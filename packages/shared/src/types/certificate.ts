export const certificateOutputFiles = [
  'certificate.crt',
  'intermediate.crt',
  'private.key'
] as const;

export type CertificateOutputFile = (typeof certificateOutputFiles)[number];

export interface CertificateConversionMetadata {
  files: CertificateOutputFile[];
  hasIntermediateCertificate: boolean;
}

export type CertificateErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'MISSING_FILE'
  | 'INVALID_PASSWORD'
  | 'INVALID_PFX'
  | 'CERTIFICATE_NOT_FOUND'
  | 'PRIVATE_KEY_NOT_FOUND'
  | 'OPENSSL_NOT_AVAILABLE'
  | 'OPENSSL_TIMEOUT'
  | 'CONVERSION_FAILED'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: {
    code: CertificateErrorCode;
    message: string;
  };
}
