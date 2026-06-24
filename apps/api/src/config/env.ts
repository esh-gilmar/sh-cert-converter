import 'dotenv/config';
import os from 'os';
import { z } from 'zod';

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().max(100).default(10),
  OPENSSL_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  OPENSSL_BIN: z.string().trim().min(1).default('openssl'),
  TEMP_DIR: z.string().trim().optional()
});

const parsedEnv = rawEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Invalid environment configuration: ${details.join('; ')}`);
}

const values = parsedEnv.data;

export const env = {
  nodeEnv: values.NODE_ENV,
  apiPort: values.API_PORT,
  maxUploadSizeMb: values.MAX_UPLOAD_SIZE_MB,
  maxUploadSizeBytes: values.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  opensslTimeoutMs: values.OPENSSL_TIMEOUT_MS,
  opensslBin: values.OPENSSL_BIN,
  tempDir: values.TEMP_DIR && values.TEMP_DIR.length > 0 ? values.TEMP_DIR : os.tmpdir()
} as const;
