import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hashArchiveContents } from './hash-archive-contents.mjs';

const root = process.cwd();
const assetRoot = join(root, 'store-assets', 'screenshots');
const manifest = JSON.parse(await readFile(join(assetRoot, 'manifest.json'), 'utf8'));
const promotionalRoot = join(root, 'store-assets', 'promotional');
const promotionalManifest = JSON.parse(await readFile(join(promotionalRoot, 'manifest.json'), 'utf8'));
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

for (const target of ['chrome', 'edge', 'firefox']) {
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

assert.equal(promotionalManifest.schemaVersion, 1, 'Unsupported promotional asset manifest schema.');
const brandSource = await readFile(join(root, promotionalManifest.source.path));
assert.equal(
  createHash('sha256').update(brandSource).digest('hex'),
  promotionalManifest.source.sha256,
  'The canonical brand icon source changed without regenerating assets.',
);
const expectedPromotionalAssets = new Map([
  ['src/public/icon/16.png', [16, 16]],
  ['src/public/icon/32.png', [32, 32]],
  ['src/public/icon/48.png', [48, 48]],
  ['src/public/icon/96.png', [96, 96]],
  ['src/public/icon/128.png', [128, 128]],
  ['store-assets/promotional/edge/logo-300.png', [300, 300]],
  ['store-assets/promotional/chrome/small-promo-440x280.png', [440, 280]],
  ['store-assets/promotional/edge/small-promo-440x280.png', [440, 280]],
]);
assert.deepEqual(
  promotionalManifest.assets.map((asset) => asset.path).sort(),
  [...expectedPromotionalAssets.keys()].sort(),
  'The promotional asset set is incomplete or contains an unexpected file.',
);
for (const asset of promotionalManifest.assets) {
  const expectedSize = expectedPromotionalAssets.get(asset.path);
  assert.ok(expectedSize, `Unexpected promotional asset: ${asset.path}`);
  const buffer = await readFile(join(root, asset.path));
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${asset.path} is not PNG.`);
  assert.equal(buffer.readUInt32BE(16), expectedSize[0], `${asset.path} has the wrong width.`);
  assert.equal(buffer.readUInt32BE(20), expectedSize[1], `${asset.path} has the wrong height.`);
  assert.equal(
    createHash('sha256').update(buffer).digest('hex'),
    asset.sha256,
    `${asset.path} hash drifted.`,
  );
}

console.log(
  'Chrome, Edge, and Firefox screenshots, runtime icons, and promotional assets passed dimension, checksum, and provenance audit.',
);
