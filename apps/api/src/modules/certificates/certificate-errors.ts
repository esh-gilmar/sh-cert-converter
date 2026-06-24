import type { CertificateErrorCode } from '@sh-cert-converter/shared';

const messages: Record<CertificateErrorCode, string> = {
  INVALID_FILE_TYPE: 'Envie um arquivo de certificado no formato .pfx ou .p12.',
  FILE_TOO_LARGE: 'O arquivo excede o tamanho máximo permitido.',
  MISSING_FILE: 'Selecione um arquivo PFX antes de converter.',
  INVALID_PASSWORD: 'Não foi possível abrir o arquivo PFX. Verifique se a senha está correta.',
  INVALID_PFX: 'O arquivo enviado não parece ser um certificado PFX válido.',
  CERTIFICATE_NOT_FOUND: 'Não encontramos certificado principal no arquivo informado.',
  PRIVATE_KEY_NOT_FOUND: 'Não encontramos chave privada no arquivo informado.',
  OPENSSL_NOT_AVAILABLE: 'O conversor OpenSSL não está disponível neste ambiente.',
  OPENSSL_TIMEOUT:
    'O processamento demorou mais que o esperado. Tente novamente ou valide o arquivo de origem.',
  CONVERSION_FAILED: 'Não foi possível converter o certificado enviado.',
  INTERNAL_ERROR: 'Ocorreu uma falha interna ao converter o certificado.'
};

export class CertificateError extends Error {
  public readonly code: CertificateErrorCode;
  public readonly statusCode: number;

  constructor(code: CertificateErrorCode, statusCode = 400, message = messages[code]) {
    super(message);
    this.name = 'CertificateError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function getCertificateErrorMessage(code: CertificateErrorCode) {
  return messages[code];
}

export function mapOpenSslFailure(stderr: string): CertificateError {
  const normalized = stderr.toLowerCase();

  if (
    normalized.includes('mac verify failure') ||
    normalized.includes('invalid password') ||
    normalized.includes('maybe wrong password')
  ) {
    return new CertificateError('INVALID_PASSWORD');
  }

  if (
    normalized.includes('asn1') ||
    normalized.includes('not enough data') ||
    normalized.includes('unsupported') ||
    normalized.includes('error reading')
  ) {
    return new CertificateError('INVALID_PFX');
  }

  return new CertificateError('CONVERSION_FAILED');
}
