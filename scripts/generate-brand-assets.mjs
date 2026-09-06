import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium } from '@playwright/test';
import { verifyScreenshotSources } from './verify-screenshot-sources.mjs';
await verifyScreenshotSources(process.cwd(), ['chrome']);

const root = process.cwd();
const sourcePath = join(root, 'store-assets', 'brand', 'app-icon.svg');
const runtimeIconRoot = join(root, 'src', 'public', 'icon');
const promotionalRoot = join(root, 'store-assets', 'promotional');
const svg = await readFile(sourcePath, 'utf8');
const rulesScreenshotPath = join(root, 'store-assets', 'screenshots', 'chrome', '04-create-redirect.png');
const permissionScreenshotPath = join(root, 'store-assets', 'screenshots', 'chrome', '05-host-scope.png');
const rulesScreenshot = await readFile(rulesScreenshotPath);
const permissionScreenshot = await readFile(permissionScreenshotPath);

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
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

async function renderIcon(page, size, path) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`
    <style>
      html, body { width: ${size}px; height: ${size}px; margin: 0; overflow: hidden; background: transparent; }
      svg { display: block; width: 100%; height: 100%; }
    </style>
    ${svg}
  `);
  await page.screenshot({ path, omitBackground: true });
}

async function renderPromo(page, path, width, height) {
  const wide = width > 1000;
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><style>
    * { box-sizing:border-box; }
    html,body { margin:0; width:${width}px; height:${height}px; overflow:hidden; }
    body { background:linear-gradient(135deg,#072b67,#077be0); color:white; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    .icon { position:absolute; width:${wide ? 128 : 92}px; height:${wide ? 128 : 92}px; left:${wide ? 60 : 24}px; top:${wide ? 122 : 92}px; filter:drop-shadow(0 12px 20px #00205655); }
    h1 { position:absolute; left:60px; top:272px; margin:0; font-size:48px; letter-spacing:-1.5px; }
    p { position:absolute; left:60px; top:340px; margin:0; font-size:24px; color:#e0efff; }
    .product { position:absolute; width:${wide ? 800 : 288}px; height:${wide ? 500 : 180}px; right:${wide ? 36 : 16}px; top:${wide ? 30 : 50}px; object-fit:contain; border:1px solid #ffffff66; border-radius:8px; box-shadow:0 12px 30px #00205644; }
  </style><img class="icon" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}">
  ${wide ? '<h1>RequestOrbit</h1><p>Make links go where you want.</p>' : ''}
  <img class="product" src="data:image/png;base64,${(wide ? permissionScreenshot : rulesScreenshot).toString('base64')}">`);
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
  await page.screenshot({ path });
}

await Promise.all([
  mkdir(runtimeIconRoot, { recursive: true }),
  mkdir(join(promotionalRoot, 'chrome'), { recursive: true }),
  mkdir(join(promotionalRoot, 'edge'), { recursive: true }),
]);

const browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true });
const browserVersion = browser.version();
try {
  const page = await browser.newPage({ colorScheme: 'light', reducedMotion: 'reduce' });
  for (const size of process.argv.includes('--promo-only') ? [] : [16, 32, 48, 96, 128]) {
    await renderIcon(page, size, join(runtimeIconRoot, `${size}.png`));
  }
  await renderIcon(page, 300, join(promotionalRoot, 'edge', 'logo-300.png'));
  await renderPromo(page, join(promotionalRoot, 'chrome', 'small-promo-440x280.png'), 440, 280);
  await renderPromo(page, join(promotionalRoot, 'chrome', 'marquee-promo-1400x560.png'), 1400, 560);
  await renderPromo(page, join(promotionalRoot, 'edge', 'small-promo-440x280.png'), 440, 280);
} finally {
  await browser.close();
}

const assets = [];
for (const [path, purpose] of [
  ['src/public/icon/16.png', 'Runtime toolbar icon'],
  ['src/public/icon/32.png', 'Runtime toolbar icon'],
  ['src/public/icon/48.png', 'Runtime extension icon'],
  ['src/public/icon/96.png', 'Runtime extension icon'],
  ['src/public/icon/128.png', 'Chrome and Firefox store icon'],
  ['store-assets/promotional/edge/logo-300.png', 'Edge listing logo'],
  ['store-assets/promotional/chrome/small-promo-440x280.png', 'Chrome small promotional tile'],
  ['store-assets/promotional/chrome/marquee-promo-1400x560.png', 'Chrome marquee promotional tile'],
  ['store-assets/promotional/edge/small-promo-440x280.png', 'Edge small promotional tile'],
]) {
  assets.push({ path, purpose, ...(await inspectPng(join(root, path))) });
}

const manifest = {
  schemaVersion: 2,
  sources: [
    {
      path: 'store-assets/brand/app-icon.svg',
      purpose: 'Canonical brand icon',
      sha256: sha256(Buffer.from(svg)),
    },
    {
      path: 'store-assets/screenshots/chrome/04-create-redirect.png',
      purpose: 'Real rules editor UI used in promotional artwork',
      sha256: sha256(rulesScreenshot),
    },
    {
      path: 'store-assets/screenshots/chrome/05-host-scope.png',
      purpose: 'Real permission UI used in marquee artwork',
      sha256: sha256(permissionScreenshot),
    },
  ],
  generatedWith: {
    browserName: 'Chromium',
    browserVersion,
  },
  generatedAt: new Date().toISOString(),
  assets,
};
await writeFile(join(promotionalRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Generated the runtime icon matrix and Chrome/Edge store promotional assets.');
