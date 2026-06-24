import '@fastify/multipart';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CertificateError } from './certificate-errors.js';
import { convertFieldsSchema, validateUploadFile } from './certificate.schemas.js';
import type { CertificatesService } from './certificates.service.js';

type MultipartFilePart = {
  type: 'file';
  filename: string;
  mimetype: string;
  toBuffer: () => Promise<Buffer>;
};

type MultipartFieldPart = {
  type: 'field';
  fieldname: string;
  value: unknown;
};

type MultipartCapableRequest = FastifyRequest & {
  isMultipart: () => boolean;
  parts: () => AsyncIterableIterator<MultipartFilePart | MultipartFieldPart>;
};

export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}

  convert = async (request: FastifyRequest, reply: FastifyReply) => {
    const multipartRequest = request as MultipartCapableRequest;

    if (!multipartRequest.isMultipart()) {
      throw new CertificateError('MISSING_FILE');
    }

    const parts = multipartRequest.parts();
    let fileBuffer: Buffer | undefined;
    let filename = '';
    let mimetype = '';
    const fields: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        filename = part.filename;
        mimetype = part.mimetype;
        fileBuffer = await part.toBuffer();
        continue;
      }

      if (typeof part.value === 'string') {
        fields[part.fieldname] = part.value;
      }
    }

    if (!fileBuffer) {
      throw new CertificateError('MISSING_FILE');
    }

    validateUploadFile({
      filename,
      mimetype,
      size: fileBuffer.length
    });

    const parsedFields = convertFieldsSchema.parse(fields);
    const archive = await this.service.convert({
      fileBuffer,
      originalFilename: filename,
      password: parsedFields.password,
      legacyMode: parsedFields.legacyMode
    });

    return reply
      .header('Content-Type', 'application/zip')
      .header('Content-Disposition', `attachment; filename="${archive.filename}"`)
      .header('Cache-Control', 'no-store')
      .header('X-Certificate-Files', encodeURIComponent(JSON.stringify(archive.metadata.files)))
      .header('X-Certificate-Has-Intermediate', String(archive.metadata.hasIntermediateCertificate))
      .send(archive.zipBuffer);
  };
}
