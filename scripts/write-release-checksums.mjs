import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const directory = join(process.cwd(), 'dist');
const archives = (await readdir(directory)).filter((name) => name.endsWith('.zip')).sort();

if (archives.length === 0) {
  throw new Error('No release ZIP archives were found in dist/.');
}

const lines = await Promise.all(
  archives.map(async (name) => {
    const bytes = await readFile(join(directory, name));
    return `${createHash('sha256').update(bytes).digest('hex')}  ${name}`;
  }),
);

await writeFile(join(directory, 'SHA256SUMS'), `${lines.join('\n')}\n`, 'utf8');
console.log(`Wrote SHA256SUMS for ${archives.length} release archives.`);
