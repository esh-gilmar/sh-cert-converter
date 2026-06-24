import { promises as fs } from 'fs';
import path from 'path';
import { env } from '../../config/env.js';
import { runCommand } from '../../shared/process/run-command.js';
import { CertificateError, mapOpenSslFailure } from './certificate-errors.js';
import type {
  CertificateExtractorPort,
  ExtractCertificateInput,
  ExtractedCertificateFiles
} from './certificate.types.js';

export class CertificateExtractor implements CertificateExtractorPort {
  async extract(input: ExtractCertificateInput): Promise<ExtractedCertificateFiles> {
    const certificatePath = path.join(input.workspacePath, 'certificate.crt');
    const intermediatePath = path.join(input.workspacePath, 'intermediate.crt');
    const privateKeyPath = path.join(input.workspacePath, 'private.key');

    await this.runPkcs12(input, ['-clcerts', '-nokeys', '-out', certificatePath]);
    const extractedIntermediatePath = await this.runIntermediateExtraction(input, intermediatePath);
    await this.runPkcs12(input, ['-nocerts', '-nodes', '-out', privateKeyPath]);

    return {
      certificatePath,
      intermediatePath: extractedIntermediatePath,
      privateKeyPath
    };
  }

  private async runIntermediateExtraction(input: ExtractCertificateInput, outputPath: string) {
    try {
      await this.runPkcs12(input, ['-cacerts', '-nokeys', '-chain', '-out', outputPath]);
      return outputPath;
    } catch (error) {
      if (error instanceof CertificateError && error.code === 'CONVERSION_FAILED') {
        await fs.rm(outputPath, { force: true });
        return undefined;
      }

      throw error;
    }
  }

  private async runPkcs12(input: ExtractCertificateInput, operationArgs: string[]) {
    const args = [
      'pkcs12',
      ...(input.legacyMode ? ['-legacy'] : []),
      '-in',
      input.inputPath,
      ...operationArgs,
      '-passin',
      'stdin'
    ];

    const result = await runCommand({
      command: env.opensslBin,
      args,
      stdin: `${input.password}\n`,
      timeoutMs: env.opensslTimeoutMs
    });

    if (result.timedOut) {
      throw new CertificateError('OPENSSL_TIMEOUT', 504);
    }

    if (result.spawnErrorCode === 'ENOENT') {
      throw new CertificateError('OPENSSL_NOT_AVAILABLE', 500);
    }

    if (result.exitCode !== 0) {
      throw mapOpenSslFailure(result.stderr);
    }
  }
}
