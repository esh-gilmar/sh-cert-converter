import FormData from 'form-data';
import { promises as fs } from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { CertificateError } from '../../src/modules/certificates/certificate-errors.js';
import type {
  CertificateExtractorPort,
  ExtractCertificateInput
} from '../../src/modules/certificates/certificate.types.js';

const apps: Array<Awaited<ReturnType<typeof buildApp>>> = [];

afterEach(async () => {
  await Promise.all(apps.map((app) => app.close()));
  apps.length = 0;
});

async function buildTestApp(extractor: CertificateExtractorPort) {
  const app = await buildApp({ extractor });
  apps.push(app);
  return app;
}

function multipartPayload(filename: string) {
  const form = new FormData();
  form.append('file', Buffer.from('content'), {
    filename,
    contentType: 'application/octet-stream'
  });
  form.append('password', 'secret');
  return {
    payload: form.getBuffer(),
    headers: form.getHeaders()
  };
}

describe('certificate routes', () => {
  it('returns health status', async () => {
    const app = await buildTestApp({
      async extract() {
        throw new Error('not used');
      }
    });

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('rejects requests without file', async () => {
    const app = await buildTestApp({
      async extract() {
        throw new Error('not used');
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/certificates/convert'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('MISSING_FILE');
  });

  it('rejects invalid extension', async () => {
    const app = await buildTestApp({
      async extract() {
        throw new Error('not used');
      }
    });
    const request = multipartPayload('document.txt');

    const response = await app.inject({
      method: 'POST',
      url: '/api/certificates/convert',
      payload: request.payload,
      headers: request.headers
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_FILE_TYPE');
  });

  it('maps invalid PFX failures', async () => {
    const app = await buildTestApp({
      async extract() {
        throw new CertificateError('INVALID_PFX');
      }
    });
    const request = multipartPayload('invalid.pfx');

    const response = await app.inject({
      method: 'POST',
      url: '/api/certificates/convert',
      payload: request.payload,
      headers: request.headers
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_PFX');
  });

  it('returns a zip with intermediate.crt when the chain exists', async () => {
    const app = await buildTestApp({
      async extract(input: ExtractCertificateInput) {
        const certificatePath = path.join(input.workspacePath, 'certificate.crt');
        const intermediatePath = path.join(input.workspacePath, 'intermediate.crt');
        const privateKeyPath = path.join(input.workspacePath, 'private.key');
        await fs.writeFile(certificatePath, pemCertificate('certificate'));
        await fs.writeFile(intermediatePath, pemCertificate('intermediate'));
        await fs.writeFile(privateKeyPath, pemPrivateKey());
        return { certificatePath, intermediatePath, privateKeyPath };
      }
    });
    const request = multipartPayload('valid.pfx');

    const response = await app.inject({
      method: 'POST',
      url: '/api/certificates/convert',
      payload: request.payload,
      headers: request.headers
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/zip');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(readGeneratedFilesHeader(response.headers['x-certificate-files'])).toEqual([
      'certificate.crt',
      'intermediate.crt',
      'private.key'
    ]);
    expect(response.headers['x-certificate-has-intermediate']).toBe('true');
    expect(response.body.length).toBeGreaterThan(0);
    expect(listZipEntryNames(response.rawPayload)).toEqual(
      expect.arrayContaining(['certificate.crt', 'intermediate.crt', 'private.key'])
    );
    expect(listZipEntryNames(response.rawPayload)).not.toContain('README.txt');
  });

  it('returns a zip with README.txt and without intermediate.crt when the chain is absent', async () => {
    const app = await buildTestApp({
      async extract(input: ExtractCertificateInput) {
        const certificatePath = path.join(input.workspacePath, 'certificate.crt');
        const privateKeyPath = path.join(input.workspacePath, 'private.key');
        await fs.writeFile(certificatePath, pemCertificate('certificate'));
        await fs.writeFile(privateKeyPath, pemPrivateKey());
        return { certificatePath, privateKeyPath };
      }
    });
    const request = multipartPayload('valid.pfx');

    const response = await app.inject({
      method: 'POST',
      url: '/api/certificates/convert',
      payload: request.payload,
      headers: request.headers
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/zip');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(readGeneratedFilesHeader(response.headers['x-certificate-files'])).toEqual([
      'certificate.crt',
      'private.key'
    ]);
    expect(response.headers['x-certificate-has-intermediate']).toBe('false');
    expect(listZipEntryNames(response.rawPayload)).toEqual(
      expect.arrayContaining(['certificate.crt', 'private.key', 'README.txt'])
    );
    expect(listZipEntryNames(response.rawPayload)).not.toContain('intermediate.crt');
  });
});

function readGeneratedFilesHeader(headerValue: string | string[] | undefined) {
  if (typeof headerValue !== 'string') {
    return [];
  }

  return JSON.parse(decodeURIComponent(headerValue)) as string[];
}

function listZipEntryNames(zipBuffer: Buffer) {
  const names: string[] = [];

  for (let offset = 0; offset <= zipBuffer.length - 46; offset += 1) {
    if (zipBuffer.readUInt32LE(offset) !== 0x02014b50) {
      continue;
    }

    const nameLength = zipBuffer.readUInt16LE(offset + 28);
    const extraLength = zipBuffer.readUInt16LE(offset + 30);
    const commentLength = zipBuffer.readUInt16LE(offset + 32);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;

    names.push(zipBuffer.subarray(nameStart, nameEnd).toString('utf8'));
    offset = nameEnd + extraLength + commentLength - 1;
  }

  return names;
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
