import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const script = resolve('scripts/hash-archive-contents.mjs');

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function contentHash(path: string): string {
  return execFileSync(process.execPath, [script, path], { encoding: 'utf8' }).trim();
}

describe('archive content hash', () => {
  it('ignores ZIP entry order while preserving paths and file contents', () => {
    const directory = mkdtempSync(join(tmpdir(), 'mwr-archive-hash-'));
    writeFileSync(join(directory, 'alpha.txt'), 'alpha\n');
    writeFileSync(join(directory, 'beta.txt'), 'beta\n');
    const first = join(directory, 'first.zip');
    const second = join(directory, 'second.zip');

    execFileSync('zip', ['-X', '-q', first, 'alpha.txt', 'beta.txt'], { cwd: directory });
    execFileSync('zip', ['-X', '-q', second, 'beta.txt', 'alpha.txt'], { cwd: directory });

    expect(sha256(first)).not.toBe(sha256(second));
    expect(contentHash(first)).toBe(contentHash(second));
  });
});
