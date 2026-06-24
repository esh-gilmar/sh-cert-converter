import type { CertificateConversionMetadata } from '@sh-cert-converter/shared';

export interface ConvertCertificateInput {
  fileBuffer: Buffer;
  originalFilename: string;
  password?: string;
  legacyMode?: boolean;
}

export interface ExtractCertificateInput {
  inputPath: string;
  workspacePath: string;
  password: string;
  legacyMode: boolean;
}

export interface ExtractedCertificateFiles {
  certificatePath: string;
  intermediatePath?: string;
  privateKeyPath: string;
}

export interface CertificateExtractorPort {
  extract(input: ExtractCertificateInput): Promise<ExtractedCertificateFiles>;
}

export interface ConvertedCertificateArchive {
  zipBuffer: Buffer;
  filename: string;
  metadata: CertificateConversionMetadata;
}
