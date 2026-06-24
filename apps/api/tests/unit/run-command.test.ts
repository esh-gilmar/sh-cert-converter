import { describe, expect, it } from 'vitest';
import { runCommand } from '../../src/shared/process/run-command.js';

describe('runCommand', () => {
  it('captures stdout and exit code', async () => {
    const result = await runCommand({
      command: process.execPath,
      args: ['-e', 'process.stdout.write("ok")'],
      timeoutMs: 5000
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('ok');
  });

  it('marks command as timed out', async () => {
    const result = await runCommand({
      command: process.execPath,
      args: ['-e', 'setTimeout(() => {}, 5000)'],
      timeoutMs: 50
    });

    expect(result.timedOut).toBe(true);
  });
});
