import { promises as fs } from 'fs';
import { describe, expect, it } from 'vitest';
import { createTempWorkspace } from '../../src/shared/filesystem/temp-workspace.js';

describe('createTempWorkspace', () => {
  it('creates and cleans a temporary workspace', async () => {
    const workspace = await createTempWorkspace();
    await fs.writeFile(`${workspace.path}/sample.txt`, 'ok');

    await workspace.cleanup();

    await expect(fs.access(workspace.path)).rejects.toThrow();
  });
});
