import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { CertificateError } from '../../modules/certificates/certificate-errors.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof CertificateError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'CONVERSION_FAILED',
          message: 'Os dados enviados para conversão são inválidos.'
        }
      });
    }

    const errorWithCode = error as Error & { code?: string };

    if (errorWithCode.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo excede o tamanho máximo permitido.'
        }
      });
    }

    app.log.error({ err: error }, 'Unhandled conversion error');
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu uma falha interna ao converter o certificado.'
      }
    });
  });
}
