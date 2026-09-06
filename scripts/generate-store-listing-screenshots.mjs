import { verifyScreenshotSources } from './verify-screenshot-sources.mjs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const root = process.cwd();
await verifyScreenshotSources(process.cwd(), ['chrome']);

const outputRoot = join(root, 'store-assets', 'listing-screenshots', 'chrome', 'en-US');
const manifestPath = join(root, 'store-assets', 'listing-screenshots', 'manifest.json');
const iconPath = join(root, 'store-assets', 'brand', 'app-icon.svg');
const sourceNames = {
  create: '04-create-redirect.png',
  host: '05-host-scope.png',
  test: '06-test-urls.png',
  edit: '07-edit-redirect.png',
  backup: '03-backup-restore.png',
};
const sourcePaths = Object.fromEntries(
  Object.entries(sourceNames).map(([key, name]) => [
    key,
    join(root, 'store-assets', 'screenshots', 'chrome', name),
  ]),
);

const icon = await readFile(iconPath);
const sources = Object.fromEntries(
  await Promise.all(Object.entries(sourcePaths).map(async ([key, path]) => [key, await readFile(path)])),
);

const scenes = [
  {
    index: '01 / 05',
    filename: '01-create-your-redirect.png',
    source: 'create',
    eyebrow: 'YOUR OWN URL REDIRECTS',
    headline: 'Make links go where you want.',
    subhead: 'Enter two addresses. Preview the result before saving.',
    background: '#f2efe8',
    foreground: '#171a1e',
    muted: '#5d6268',
  },
  {
    index: '02 / 05',
    filename: '02-one-url-or-whole-site.png',
    source: 'host',
    eyebrow: 'CHOOSE THE SCOPE',
    headline: 'One URL or the whole site.',
    subhead: 'Replace the host. Keep paths, queries, protocol, and port.',
    background: '#e8edf0',
    foreground: '#171a1e',
    muted: '#59636c',
  },
  {
    index: '03 / 05',
    filename: '03-test-before-saving.png',
    source: 'test',
    eyebrow: 'CHECK THE BOUNDARIES',
    headline: 'Test before you save.',
    subhead: 'Try more URLs and see which ones redirect.',
    background: '#1c2025',
    foreground: '#f7f6f2',
    muted: '#bec5cc',
  },
  {
    index: '04 / 05',
    filename: '04-edit-your-redirects.png',
    source: 'edit',
    eyebrow: 'STAY IN CONTROL',
    headline: 'Change your redirects anytime.',
    subhead: 'Reopen the simple editor. Save disabled or apply with permission.',
    background: '#efe5d8',
    foreground: '#191b1e',
    muted: '#625f5a',
  },
  {
    index: '05 / 05',
    filename: '05-local-by-design.png',
    source: 'backup',
    eyebrow: 'LOCAL BY DESIGN',
    headline: 'Your rules stay on your device.',
    subhead: 'No account. Export a backup and preview imports before applying.',
    background: '#f3f1ea',
    foreground: '#171a1e',
    muted: '#5d6268',
  },
];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function inspectPng(path) {
  const buffer = await readFile(path);
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`${path} is not a PNG.`);
  }
  return {
    sha256: sha256(buffer),
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function sceneHtml(scene) {
  return `<!doctype html><html><head><style>
    * { box-sizing: border-box; }
    html, body { width:1280px; height:800px; margin:0; overflow:hidden; }
    body { background:${scene.background}; color:${scene.foreground}; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    header { height:152px; padding:26px 46px 16px; position:relative; }
    .eyebrow { font-size:12px; font-weight:700; letter-spacing:.14em; color:${scene.muted}; }
    h1 { font-size:34px; line-height:1.15; letter-spacing:-1px; margin:9px 0 8px; }
    p { font-size:18px; margin:0; color:${scene.muted}; }
    .mark { position:absolute; width:48px; height:48px; right:50px; top:32px; }
    .index { position:absolute; right:50px; top:100px; font-size:12px; color:${scene.muted}; }
    .product { display:block; width:992px; height:620px; margin:0 auto; border:1px solid #8693a538; border-radius:8px; object-fit:contain; box-shadow:0 8px 24px #14253b16; }
  </style></head><body><header>
    <div class="eyebrow">${scene.eyebrow}</div><h1>${scene.headline}</h1><p>${scene.subhead}</p>
    <img class="mark" alt="" src="data:image/svg+xml;base64,${icon.toString('base64')}"><div class="index">${scene.index}</div>
  </header><img class="product" alt="RequestOrbit interface" src="data:image/png;base64,${sources[scene.source].toString('base64')}"></body></html>`;
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true });
const browserVersion = browser.version();
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  for (const scene of scenes) {
    await page.setContent(sceneHtml(scene));
    await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    await page.screenshot({ path: join(outputRoot, scene.filename) });
  }
} finally {
  await browser.close();
}

const assets = [];
for (const scene of scenes) {
  const path = `store-assets/listing-screenshots/chrome/en-US/${scene.filename}`;
  assets.push({
    path,
    locale: 'en-US',
    source: `store-assets/screenshots/chrome/${sourceNames[scene.source]}`,
    headline: scene.headline.replaceAll('\n', ' '),
    subhead: scene.subhead,
    ...(await inspectPng(join(root, path))),
  });
}

const manifest = {
  schemaVersion: 1,
  target: 'chrome',
  locale: 'en-US',
  viewport: { width: 1280, height: 800 },
  generatedWith: { browserName: 'Chromium', browserVersion },
  generatedAt: new Date().toISOString(),
  sources: [
    {
      path: 'store-assets/brand/app-icon.svg',
      sha256: sha256(icon),
    },
    ...Object.entries(sources).map(([key, bytes]) => ({
      path: `store-assets/screenshots/chrome/${sourceNames[key]}`,
      sha256: sha256(bytes),
    })),
  ],
  assets,
};

const previous = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{"assets":[]}'));
for (const old of previous.assets) {
  if (
    !assets.some((asset) => asset.path === old.path) &&
    /^store-assets\/listing-screenshots\/chrome\/en-US\/[a-z0-9-]+\.png$/.test(old.path)
  ) {
    await unlink(join(root, old.path)).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Generated five Chrome Web Store listing screenshots at 1280x800.');
