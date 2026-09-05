import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hashArchiveContents } from './hash-archive-contents.mjs';

// Validate original captures before a renderer writes derived artwork or opens a browser.
export async function verifyScreenshotSources(root, targets = ['chrome', 'edge', 'firefox']) {
  const assetRoot = join(root, 'store-assets', 'screenshots');
  const manifest = JSON.parse(await readFile(join(assetRoot, 'manifest.json'), 'utf8'));
  const checksumLines = (await readFile(join(root, 'dist', 'SHA256SUMS'), 'utf8')).trim().split('\n');
  const releaseChecksums = new Map(
    checksumLines.map((line) => {
      const [hash, filename] = line.trim().split(/\s+/, 2);
      return [filename, hash];
    }),
  );

  assert.equal(manifest.schemaVersion, 2, 'Unsupported store screenshot manifest schema.');
  assert.deepEqual(manifest.viewport, { width: 1280, height: 800 }, 'Store screenshots must be 1280x800.');
  assert.deepEqual(Object.keys(manifest.targets).sort(), ['chrome', 'edge', 'firefox']);

  for (const target of targets) {
    const entry = manifest.targets[target];
    assert.match(entry.sourceArtifact, new RegExp(`-${target}\\.zip$`));
    assert.match(entry.sourceContentSha256, /^[a-f0-9]{64}$/);
    const currentArchive = join(root, 'dist', entry.sourceArtifact);
    const currentArchiveBytes = await readFile(currentArchive);
    assert.equal(
      createHash('sha256').update(currentArchiveBytes).digest('hex'),
      releaseChecksums.get(entry.sourceArtifact),
      `${target} release archive does not match dist/SHA256SUMS.`,
    );
    assert.equal(
      await hashArchiveContents(currentArchive),
      entry.sourceContentSha256,
      `${target} screenshots do not come from the current release contents.`,
    );
    assert.equal(typeof entry.browserVersion, 'string');
    assert.ok(entry.browserVersion.length > 0);
    assert.equal(entry.files.length, 3, `${target} must provide the complete three-screenshot story.`);
    for (const file of entry.files) {
      const buffer = await readFile(join(assetRoot, file.path));
      assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file.path} is not PNG.`);
      assert.equal(buffer.readUInt32BE(16), 1280, `${file.path} has the wrong width.`);
      assert.equal(buffer.readUInt32BE(20), 800, `${file.path} has the wrong height.`);
      assert.equal(
        createHash('sha256').update(buffer).digest('hex'),
        file.sha256,
        `${file.path} hash drifted.`,
      );
    }
  }
}
