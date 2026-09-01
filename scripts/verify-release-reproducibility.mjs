import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const packageManifest = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8'));
const archivePrefix = `my-webrequest-${packageManifest.version}`;
const archives = [
  `${archivePrefix}-chrome.zip`,
  `${archivePrefix}-edge.zip`,
  `${archivePrefix}-firefox.zip`,
  `${archivePrefix}-sources.zip`,
].sort();

async function archiveHashes() {
  return Object.fromEntries(
    await Promise.all(
      archives.map(async (name) => {
        const bytes = await readFile(join(process.cwd(), 'dist', name));
        return [name, createHash('sha256').update(bytes).digest('hex')];
      }),
    ),
  );
}

const firstBuild = await archiveHashes();
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const rebuild = spawnSync(command, ['zip:browsers'], { stdio: 'inherit' });
if (rebuild.error) throw rebuild.error;
if (rebuild.status !== 0) {
  throw new Error(`The reproducibility rebuild exited with status ${String(rebuild.status)}.`);
}

const secondBuild = await archiveHashes();
assert.deepEqual(
  secondBuild,
  firstBuild,
  'Release archives are not byte-for-byte reproducible across consecutive builds.',
);

console.log(`Verified byte-for-byte reproducibility for ${archives.length} release archives.`);
