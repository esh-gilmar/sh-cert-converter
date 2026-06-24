import type { FastifyInstance } from 'fastify';
import { CertificatesController } from './certificates.controller.js';
import { CertificatesService } from './certificates.service.js';
import type { CertificateExtractorPort } from './certificate.types.js';

interface RouteOptions {
  extractor: CertificateExtractorPort;
}

export async function registerCertificateRoutes(app: FastifyInstance, options: RouteOptions) {
  const service = new CertificatesService(options.extractor);
  const controller = new CertificatesController(service);

  app.post('/api/certificates/convert', controller.convert);
}
