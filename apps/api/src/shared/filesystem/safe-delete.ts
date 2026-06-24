import { promises as fs } from 'fs';
import path from 'path';

export async function safeDelete(targetPath: string, allowedBasePath: string) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(allowedBasePath);

  if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(`${resolvedBase}${path.sep}`)) {
    throw new Error('Refusing to delete a path outside the temporary workspace');
  }

  await fs.rm(resolvedTarget, { recursive: true, force: true });
}
