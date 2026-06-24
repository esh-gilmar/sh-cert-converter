import { describe, expect, it } from 'vitest';
import { CertificateError } from '../../src/modules/certificates/certificate-errors.js';
import { validateUploadFile } from '../../src/modules/certificates/certificate.schemas.js';

describe('validateUploadFile', () => {
  it('accepts pfx and p12 files', () => {
    expect(
      validateUploadFile({
        filename: 'certificado.pfx',
        mimetype: 'application/octet-stream',
        size: 1200
      }).extension
    ).toBe('.pfx');

    expect(
      validateUploadFile({
        filename: 'certificado.p12',
        mimetype: 'application/x-pkcs12',
        size: 1200
      }).extension
    ).toBe('.p12');
  });

  it('rejects invalid extensions', () => {
    expect(() =>
      validateUploadFile({
        filename: 'certificado.txt',
        mimetype: 'text/plain',
        size: 1200
      })
    ).toThrow(CertificateError);
  });
});
