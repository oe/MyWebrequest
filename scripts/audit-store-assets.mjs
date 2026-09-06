import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { verifyScreenshotSources } from './verify-screenshot-sources.mjs';

const root = process.cwd();
const promotionalRoot = join(root, 'store-assets', 'promotional');
const promotionalManifest = JSON.parse(await readFile(join(promotionalRoot, 'manifest.json'), 'utf8'));
const listingScreenshotRoot = join(root, 'store-assets', 'listing-screenshots');
const listingScreenshotManifest = JSON.parse(
  await readFile(join(listingScreenshotRoot, 'manifest.json'), 'utf8'),
);
await verifyScreenshotSources(root);

assert.equal(promotionalManifest.schemaVersion, 2, 'Unsupported promotional asset manifest schema.');
assert.deepEqual(
  promotionalManifest.sources.map((source) => source.path).sort(),
  [
    'store-assets/brand/app-icon.svg',
    'store-assets/screenshots/chrome/04-create-redirect.png',
    'store-assets/screenshots/chrome/05-host-scope.png',
  ],
  'The promotional artwork source set is incomplete or contains an unexpected file.',
);
for (const source of promotionalManifest.sources) {
  const sourceBytes = await readFile(join(root, source.path));
  assert.equal(
    createHash('sha256').update(sourceBytes).digest('hex'),
    source.sha256,
    `${source.path} changed without regenerating promotional assets.`,
  );
}
const expectedPromotionalAssets = new Map([
  ['src/public/icon/16.png', [16, 16]],
  ['src/public/icon/32.png', [32, 32]],
  ['src/public/icon/48.png', [48, 48]],
  ['src/public/icon/96.png', [96, 96]],
  ['src/public/icon/128.png', [128, 128]],
  ['store-assets/promotional/edge/logo-300.png', [300, 300]],
  ['store-assets/promotional/chrome/small-promo-440x280.png', [440, 280]],
  ['store-assets/promotional/chrome/marquee-promo-1400x560.png', [1400, 560]],
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

assert.equal(listingScreenshotManifest.schemaVersion, 1, 'Unsupported listing screenshot manifest schema.');
assert.equal(listingScreenshotManifest.target, 'chrome');
assert.equal(listingScreenshotManifest.locale, 'en-US');
assert.deepEqual(
  listingScreenshotManifest.viewport,
  { width: 1280, height: 800 },
  'Chrome listing screenshots must be 1280x800.',
);
assert.equal(
  listingScreenshotManifest.assets.length,
  5,
  'Chrome should provide the recommended five-image listing story.',
);
assert.deepEqual(
  listingScreenshotManifest.sources.map((source) => source.path).sort(),
  [
    'store-assets/brand/app-icon.svg',
    'store-assets/screenshots/chrome/03-backup-restore.png',
    'store-assets/screenshots/chrome/04-create-redirect.png',
    'store-assets/screenshots/chrome/05-host-scope.png',
    'store-assets/screenshots/chrome/06-test-urls.png',
    'store-assets/screenshots/chrome/07-edit-redirect.png',
  ],
  'The listing screenshot source set is incomplete or contains an unexpected file.',
);
for (const source of listingScreenshotManifest.sources) {
  const sourceBytes = await readFile(join(root, source.path));
  assert.equal(
    createHash('sha256').update(sourceBytes).digest('hex'),
    source.sha256,
    `${source.path} changed without regenerating listing screenshots.`,
  );
}
for (const asset of listingScreenshotManifest.assets) {
  const buffer = await readFile(join(root, asset.path));
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${asset.path} is not PNG.`);
  assert.equal(buffer.readUInt32BE(16), 1280, `${asset.path} has the wrong width.`);
  assert.equal(buffer.readUInt32BE(20), 800, `${asset.path} has the wrong height.`);
  assert.equal(
    createHash('sha256').update(buffer).digest('hex'),
    asset.sha256,
    `${asset.path} hash drifted.`,
  );
}

console.log(
  'Chrome, Edge, and Firefox source captures, listing screenshots, runtime icons, and promotional assets passed dimension, checksum, and provenance audit.',
);
