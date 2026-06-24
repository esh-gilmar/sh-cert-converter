import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = await buildApp();

try {
  await app.listen({ host: '0.0.0.0', port: env.apiPort });
} catch (error) {
  app.log.error(error, 'API startup failed');
  process.exit(1);
}
