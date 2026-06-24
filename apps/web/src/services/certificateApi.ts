import type { ApiErrorResponse } from '@sh-cert-converter/shared';

export interface ConvertCertificatePayload {
  file: File;
  password?: string;
  legacyMode?: boolean;
}

export interface ConvertCertificateResult {
  blob: Blob;
  filename: string;
}

export class CertificateApiError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'CertificateApiError';
  }
}

export async function convertCertificate(
  payload: ConvertCertificatePayload
): Promise<ConvertCertificateResult> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('password', payload.password ?? '');
  formData.append('legacyMode', String(payload.legacyMode ?? false));

  const response = await fetch('/api/certificates/convert', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => undefined)) as ApiErrorResponse | undefined;
    const apiError = errorBody?.error;
    throw new CertificateApiError(
      apiError?.code ?? 'CONVERSION_FAILED',
      apiError?.message ?? 'Não foi possível converter o certificado enviado.'
    );
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'certificados-extraidos.zip';

  return {
    blob: await response.blob(),
    filename
  };
}
