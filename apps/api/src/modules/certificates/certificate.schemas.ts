import path from 'path';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { CertificateError } from './certificate-errors.js';

const allowedExtensions = new Set(['.pfx', '.p12']);
const acceptedMimeTypes = new Set([
  'application/x-pkcs12',
  'application/pkcs12',
  'application/octet-stream',
  'application/x-pkcs-12'
]);

export const convertFieldsSchema = z.object({
  password: z.string().optional().default(''),
  legacyMode: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === 'true')
});

export interface UploadFileInput {
  filename: string;
  mimetype: string;
  size: number;
}

export function validateUploadFile(input: UploadFileInput) {
  if (!input.filename) {
    throw new CertificateError('MISSING_FILE');
  }

  const extension = path.extname(input.filename).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    throw new CertificateError('INVALID_FILE_TYPE');
  }

  if (input.size > env.maxUploadSizeBytes) {
    throw new CertificateError('FILE_TOO_LARGE', 413);
  }

  if (input.mimetype && !acceptedMimeTypes.has(input.mimetype)) {
    throw new CertificateError('INVALID_FILE_TYPE');
  }

  return {
    extension
  };
}
