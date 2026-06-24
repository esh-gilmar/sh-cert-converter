import { promises as fs } from 'fs';
import path from 'path';
import { inflateRawSync } from 'zlib';
import { describe, expect, it } from 'vitest';
import { CertificateError } from '../../src/modules/certificates/certificate-errors.js';
import { CertificatesService } from '../../src/modules/certificates/certificates.service.js';
import type {
  CertificateExtractorPort,
  ExtractCertificateInput
} from '../../src/modules/certificates/certificate.types.js';

class SuccessfulExtractor implements CertificateExtractorPort {
  public workspacePath = '';
  constructor(private readonly includeIntermediate = true) {}

  async extract(input: ExtractCertificateInput) {
    this.workspacePath = input.workspacePath;
    const certificatePath = path.join(input.workspacePath, 'certificate.crt');
    const intermediatePath = this.includeIntermediate
      ? path.join(input.workspacePath, 'intermediate.crt')
      : undefined;
    const privateKeyPath = path.join(input.workspacePath, 'private.key');
    await fs.writeFile(certificatePath, withOpenSslMetadata(pemCertificate('certificate')));
    if (intermediatePath) {
      await fs.writeFile(intermediatePath, withOpenSslMetadata(pemCertificate('intermediate')));
    }
    await fs.writeFile(privateKeyPath, withOpenSslMetadata(pemPrivateKey()));
    return { certificatePath, intermediatePath, privateKeyPath };
  }
}

describe('CertificatesService', () => {
  it('returns a zip with intermediate.crt when the chain exists', async () => {
    const extractor = new SuccessfulExtractor();
    const service = new CertificatesService(extractor);

    const result = await service.convert({
      fileBuffer: Buffer.from('fake-pfx'),
      originalFilename: 'sample.pfx'
    });

    expect(result.filename).toBe('certificados-extraidos.zip');
    expect(result.zipBuffer.length).toBeGreaterThan(0);
    const entries = readZipEntries(result.zipBuffer);
    expect(Object.keys(entries)).toEqual(
      expect.arrayContaining(['certificate.crt', 'intermediate.crt', 'private.key'])
    );
    expect(Object.keys(entries)).not.toContain('README.txt');
    expect(entries['certificate.crt']).toMatch(/^-----BEGIN CERTIFICATE-----/);
    expect(entries['certificate.crt']).not.toContain('Bag Attributes');
    expect(entries['intermediate.crt']).toMatch(/^-----BEGIN CERTIFICATE-----/);
    expect(entries['intermediate.crt']).not.toContain('Bag Attributes');
    expect(entries['private.key']).toMatch(/^-----BEGIN PRIVATE KEY-----/);
    expect(entries['private.key']).not.toContain('Bag Attributes');
    await expect(fs.access(extractor.workspacePath)).rejects.toThrow();
  });

  it('returns a zip with README.txt and without intermediate.crt when the chain is absent', async () => {
    const extractor = new SuccessfulExtractor(false);
    const service = new CertificatesService(extractor);

    const result = await service.convert({
      fileBuffer: Buffer.from('fake-pfx'),
      originalFilename: 'sample.pfx'
    });

    const entries = readZipEntries(result.zipBuffer);
    expect(Object.keys(entries)).toEqual(
      expect.arrayContaining(['certificate.crt', 'private.key', 'README.txt'])
    );
    expect(Object.keys(entries)).not.toContain('intermediate.crt');
    expect(entries['README.txt']).toContain('Cadeia intermediaria nao encontrada');
    await expect(fs.access(extractor.workspacePath)).rejects.toThrow();
  });

  it('removes temporary files after extractor error', async () => {
    let workspacePath = '';
    const service = new CertificatesService({
      async extract(input) {
        workspacePath = input.workspacePath;
        throw new CertificateError('INVALID_PASSWORD');
      }
    });

    await expect(
      service.convert({
        fileBuffer: Buffer.from('fake-pfx'),
        originalFilename: 'sample.p12'
      })
    ).rejects.toThrow(CertificateError);
    await expect(fs.access(workspacePath)).rejects.toThrow();
  });
});

function readZipEntries(zipBuffer: Buffer) {
  const entries: Record<string, string> = {};

  for (let offset = 0; offset <= zipBuffer.length - 46; offset += 1) {
    if (zipBuffer.readUInt32LE(offset) !== 0x02014b50) {
      continue;
    }

    const nameLength = zipBuffer.readUInt16LE(offset + 28);
    const extraLength = zipBuffer.readUInt16LE(offset + 30);
    const commentLength = zipBuffer.readUInt16LE(offset + 32);
    const compressionMethod = zipBuffer.readUInt16LE(offset + 10);
    const compressedSize = zipBuffer.readUInt32LE(offset + 20);
    const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    const name = zipBuffer.subarray(nameStart, nameEnd).toString('utf8');

    entries[name] = readZipEntryContent(zipBuffer, localHeaderOffset, compressedSize, compressionMethod);
    offset = nameEnd + extraLength + commentLength - 1;
  }

  return entries;
}

function readZipEntryContent(
  zipBuffer: Buffer,
  localHeaderOffset: number,
  compressedSize: number,
  compressionMethod: number
) {
  const localNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26);
  const localExtraLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
  const compressedContent = zipBuffer.subarray(dataStart, dataStart + compressedSize);

  if (compressionMethod === 0) {
    return compressedContent.toString('utf8');
  }

  if (compressionMethod === 8) {
    return inflateRawSync(compressedContent).toString('utf8');
  }

  throw new Error(`Unsupported zip compression method: ${compressionMethod}`);
}

function pemCertificate(label: string) {
  return [
    '-----BEGIN CERTIFICATE-----',
    Buffer.from(label).toString('base64'),
    '-----END CERTIFICATE-----',
    ''
  ].join('\n');
}

function pemPrivateKey() {
  return [
    '-----BEGIN PRIVATE KEY-----',
    Buffer.from('private-key').toString('base64'),
    '-----END PRIVATE KEY-----',
    ''
  ].join('\n');
}

function withOpenSslMetadata(pemBlock: string) {
  return ['Bag Attributes', '    friendlyName: test', pemBlock].join('\n');
}
