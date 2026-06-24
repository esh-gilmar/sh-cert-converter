import { promises as fs } from 'fs';
import path from 'path';
import { env } from '../../config/env.js';
import { safeDelete } from './safe-delete.js';

export interface TempWorkspace {
  path: string;
  cleanup: () => Promise<void>;
}

export async function createTempWorkspace(): Promise<TempWorkspace> {
  await fs.mkdir(env.tempDir, { recursive: true, mode: 0o700 });
  const workspacePath = await fs.mkdtemp(path.join(env.tempDir, 'pfx-'));
  await fs.chmod(workspacePath, 0o700).catch(() => undefined);

  return {
    path: workspacePath,
    cleanup: () => safeDelete(workspacePath, workspacePath)
  };
}
