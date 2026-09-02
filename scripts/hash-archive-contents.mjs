import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function hashArchiveContents(archivePath) {
  const { stdout: listing } = await execFileAsync('unzip', ['-Z1', archivePath], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  const entries = listing
    .split('\n')
    .filter((entry) => entry.length > 0 && !entry.endsWith('/'))
    .sort((left, right) => left.localeCompare(right));

  if (entries.length === 0) throw new Error(`${archivePath} contains no files.`);
  if (new Set(entries).size !== entries.length) {
    throw new Error(`${archivePath} contains duplicate file entries.`);
  }

  const digest = createHash('sha256');
  for (const entry of entries) {
    const { stdout } = await execFileAsync('unzip', ['-p', archivePath, entry], {
      encoding: null,
      maxBuffer: 16 * 1024 * 1024,
    });
    const content = Buffer.from(stdout);
    digest.update(`${Buffer.byteLength(entry)}:`);
    digest.update(entry);
    digest.update(`:${content.length}:`);
    digest.update(content);
  }
  return digest.digest('hex');
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const archivePath = process.argv[2];
  if (!archivePath) throw new Error('Usage: node scripts/hash-archive-contents.mjs <archive.zip>');
  console.log(await hashArchiveContents(resolve(archivePath)));
}
