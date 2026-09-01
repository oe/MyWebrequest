import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const directory = join(process.cwd(), 'dist');
const packageManifest = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf8'));
const archivePrefix = `my-webrequest-${packageManifest.version}`;
const expectedArchives = [
  `${archivePrefix}-chrome.zip`,
  `${archivePrefix}-edge.zip`,
  `${archivePrefix}-firefox.zip`,
  `${archivePrefix}-sources.zip`,
].sort();
const archives = (await readdir(directory)).filter((name) => name.endsWith('.zip')).sort();

if (JSON.stringify(archives) !== JSON.stringify(expectedArchives)) {
  throw new Error(
    `dist/ must contain exactly the current release archives. Expected ${expectedArchives.join(', ')}; found ${archives.join(', ') || 'none'}.`,
  );
}

const lines = await Promise.all(
  archives.map(async (name) => {
    const bytes = await readFile(join(directory, name));
    return `${createHash('sha256').update(bytes).digest('hex')}  ${name}`;
  }),
);

await writeFile(join(directory, 'SHA256SUMS'), `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote SHA256SUMS for ${archives.length} release archives.`);
