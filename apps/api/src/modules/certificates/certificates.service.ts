import archiver from 'archiver';
import type {
  CertificateConversionMetadata,
  CertificateOutputFile
} from '@sh-cert-converter/shared';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { createTempWorkspace } from '../../shared/filesystem/temp-workspace.js';
import { sanitizeFilename } from '../../shared/security/sanitize-filename.js';
import { CertificateError } from './certificate-errors.js';
import type {
  CertificateExtractorPort,
  ConvertedCertificateArchive,
  ConvertCertificateInput,
  ExtractedCertificateFiles
} from './certificate.types.js';
import { validateUploadFile } from './certificate.schemas.js';

export class CertificatesService {
  constructor(private readonly extractor: CertificateExtractorPort) {}

  async convert(input: ConvertCertificateInput): Promise<ConvertedCertificateArchive> {
    validateUploadFile({
      filename: input.originalFilename,
      mimetype: 'application/octet-stream',
      size: input.fileBuffer.length
    });

    const workspace = await createTempWorkspace();

    try {
      const extension = path.extname(input.originalFilename).toLowerCase();
      const inputPath = path.join(workspace.path, `input${extension}`);
      await fsp.writeFile(inputPath, input.fileBuffer, { mode: 0o600 });

      const files = await this.extractor.extract({
        inputPath,
        workspacePath: workspace.path,
        password: input.password ?? '',
        legacyMode: input.legacyMode ?? false
      });

      await normalizeExtractedFiles(files);
      await this.validateExtractedFiles(files);
      const metadata = getConversionMetadata(files);

      return {
        zipBuffer: await createZipBuffer(files),
        filename: sanitizeFilename('certificados-extraidos.zip'),
        metadata
      };
    } finally {
      await workspace.cleanup();
    }
  }

  private async validateExtractedFiles(files: ExtractedCertificateFiles) {
    await assertReadableFile(files.certificatePath, 'CERTIFICATE_NOT_FOUND');
    await assertReadableFile(files.privateKeyPath, 'PRIVATE_KEY_NOT_FOUND');

    if (files.intermediatePath && !(await isReadableFile(files.intermediatePath))) {
      files.intermediatePath = undefined;
    }
  }
}

function getConversionMetadata(files: ExtractedCertificateFiles): CertificateConversionMetadata {
  const outputFiles: CertificateOutputFile[] = ['certificate.crt'];

  if (files.intermediatePath) {
    outputFiles.push('intermediate.crt');
  }

  outputFiles.push('private.key');

  return {
    files: outputFiles,
    hasIntermediateCertificate: Boolean(files.intermediatePath)
  };
}

async function assertReadableFile(
  pathToFile: string,
  code: 'CERTIFICATE_NOT_FOUND' | 'PRIVATE_KEY_NOT_FOUND'
) {
  if (!(await isReadableFile(pathToFile))) {
    throw new CertificateError(code);
  }
}

async function isReadableFile(pathToFile: string) {
  const stat = await fsp.stat(pathToFile).catch(() => undefined);

  return Boolean(stat && stat.isFile() && stat.size > 0);
}

async function normalizeExtractedFiles(files: ExtractedCertificateFiles) {
  await rewritePemFile(
    files.certificatePath,
    extractPemBlocks(await fsp.readFile(files.certificatePath, 'utf8'), ['CERTIFICATE'])
  );

  await rewritePemFile(
    files.privateKeyPath,
    extractPemBlocks(await fsp.readFile(files.privateKeyPath, 'utf8'), [
      'PRIVATE KEY',
      'RSA PRIVATE KEY',
      'EC PRIVATE KEY'
    ])
  );

  if (!files.intermediatePath) {
    return;
  }

  const intermediateBlocks = extractPemBlocks(await fsp.readFile(files.intermediatePath, 'utf8'), [
    'CERTIFICATE'
  ]);

  if (intermediateBlocks.length === 0) {
    await fsp.rm(files.intermediatePath, { force: true });
    files.intermediatePath = undefined;
    return;
  }

  await rewritePemFile(files.intermediatePath, intermediateBlocks);
}

async function rewritePemFile(pathToFile: string, pemBlocks: string[]) {
  await fsp.writeFile(pathToFile, pemBlocks.join('\n'), { mode: 0o600 });
}

function extractPemBlocks(content: string, labels: string[]) {
  const blocks: string[] = [];

  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blockPattern = new RegExp(
      `-----BEGIN ${escapedLabel}-----[\\s\\S]*?-----END ${escapedLabel}-----`,
      'g'
    );

    blocks.push(...(content.match(blockPattern) ?? []));
  }

  return blocks.map((block) => `${block.trim()}\n`);
}

function createZipBuffer(files: ExtractedCertificateFiles): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('warning', reject);
    archive.on('error', reject);
    archive.on('end', () => resolve(Buffer.concat(chunks)));

    archive.append(fs.createReadStream(files.certificatePath), { name: 'certificate.crt' });
    if (files.intermediatePath) {
      archive.append(fs.createReadStream(files.intermediatePath), { name: 'intermediate.crt' });
    } else {
      archive.append(
        [
          'Cadeia intermediaria nao encontrada no arquivo PFX informado.',
          'O pacote contem certificate.crt e private.key extraidos normalmente.',
          ''
        ].join('\n'),
        { name: 'README.txt' }
      );
    }
    archive.append(fs.createReadStream(files.privateKeyPath), { name: 'private.key' });
    archive.finalize().catch(reject);
  });
}
