import {
  certificateOutputFiles,
  type ApiErrorResponse,
  type CertificateConversionMetadata,
  type CertificateOutputFile
} from '@sh-cert-converter/shared';

export interface ConvertCertificatePayload {
  file: File;
  password?: string;
  legacyMode?: boolean;
}

export interface ConvertCertificateResult {
  blob: Blob;
  filename: string;
  metadata: CertificateConversionMetadata;
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
    const errorBody = (await response.json().catch(() => undefined)) as
      | ApiErrorResponse
      | undefined;
    const apiError = errorBody?.error;
    throw new CertificateApiError(
      apiError?.code ?? 'CONVERSION_FAILED',
      apiError?.message ?? 'Não foi possível converter o certificado enviado.'
    );
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'certificados-extraidos.zip';
  const files = parseGeneratedFilesHeader(response.headers.get('x-certificate-files'));

  return {
    blob: await response.blob(),
    filename,
    metadata: {
      files,
      hasIntermediateCertificate: files.includes('intermediate.crt')
    }
  };
}

function parseGeneratedFilesHeader(headerValue: string | null): CertificateOutputFile[] {
  if (!headerValue) {
    return ['certificate.crt', 'intermediate.crt', 'private.key'];
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(headerValue)) as unknown;

    if (!Array.isArray(parsed)) {
      return ['certificate.crt', 'intermediate.crt', 'private.key'];
    }

    const validFiles = parsed.filter((file): file is CertificateOutputFile =>
      certificateOutputFiles.includes(file as CertificateOutputFile)
    );

    return validFiles.length > 0
      ? validFiles
      : ['certificate.crt', 'intermediate.crt', 'private.key'];
  } catch {
    return ['certificate.crt', 'intermediate.crt', 'private.key'];
  }
}
