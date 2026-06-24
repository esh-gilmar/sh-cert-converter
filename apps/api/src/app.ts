import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import Fastify from 'fastify';
import { env } from './config/env.js';
import { registerCertificateRoutes } from './modules/certificates/certificates.routes.js';
import { CertificateExtractor } from './modules/certificates/certificate-extractor.js';
import type { CertificateExtractorPort } from './modules/certificates/certificate.types.js';
import { registerErrorHandler } from './shared/http/error-handler.js';

interface BuildAppOptions {
  extractor?: CertificateExtractorPort;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: {
      level: env.nodeEnv === 'test' ? 'silent' : 'info',
      redact: ['req.headers.authorization', 'password', '*.password']
    },
    bodyLimit: env.maxUploadSizeBytes
  });

  await app.register(helmet, {
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    }
  });

  await app.register(multipart, {
    limits: {
      fileSize: env.maxUploadSizeBytes,
      files: 1,
      fields: 3
    }
  });

  app.get('/health', async () => ({ status: 'ok' }));

  registerErrorHandler(app);
  await registerCertificateRoutes(app, {
    extractor: options.extractor ?? new CertificateExtractor()
  });

  return app;
}
