import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const root = process.cwd();
const sourcePath = join(root, 'store-assets', 'brand', 'app-icon.svg');
const runtimeIconRoot = join(root, 'src', 'public', 'icon');
const promotionalRoot = join(root, 'store-assets', 'promotional');
const svg = await readFile(sourcePath, 'utf8');

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

async function renderPromo(page, path) {
  const encodedIcon = Buffer.from(svg).toString('base64');
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(`
    <style>
      * { box-sizing: border-box; }
      html, body { width: 440px; height: 280px; margin: 0; overflow: hidden; }
      body {
        position: relative;
        display: grid;
        place-items: center;
        color: #111820;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 12% 0%, rgba(129, 211, 255, 0.58), transparent 38%),
          radial-gradient(circle at 100% 92%, rgba(167, 206, 238, 0.44), transparent 42%),
          linear-gradient(145deg, #f8fbfd 0%, #edf5fb 50%, #e5eef7 100%);
      }
      .route {
        position: absolute;
        width: 310px;
        height: 310px;
        right: -136px;
        bottom: -174px;
        border: 1px solid rgba(45, 129, 188, 0.18);
        border-radius: 50%;
        box-shadow: 0 0 0 38px rgba(255, 255, 255, 0.18), 0 0 0 76px rgba(77, 164, 224, 0.06);
      }
      .content {
        position: relative;
        display: grid;
        grid-template-columns: 116px 1fr;
        gap: 26px;
        align-items: center;
        width: 388px;
        min-height: 168px;
        padding: 26px;
        border: 1px solid rgba(255, 255, 255, 0.82);
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.56);
        box-shadow: 0 16px 42px rgba(23, 51, 76, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8);
      }
      img {
        display: block;
        width: 116px;
        height: 116px;
        filter: drop-shadow(0 12px 16px rgba(14, 31, 46, 0.18));
      }
      h1 { margin: 0; font-size: 27px; line-height: 1.06; letter-spacing: -0.035em; font-weight: 720; }
      p { margin: 10px 0 0; color: #52606d; font-size: 14px; line-height: 1.42; }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 14px;
        color: #315064;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }
      .badge::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #2799df; box-shadow: 0 0 0 4px rgba(39, 153, 223, 0.12); }
    </style>
    <div class="route"></div>
    <main class="content">
      <img alt="" src="data:image/svg+xml;base64,${encodedIcon}">
      <div>
        <h1>My Webrequest</h1>
        <p>Request rules,<br>made clear.</p>
        <span class="badge">Local by design</span>
      </div>
    </main>
  `);
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
  for (const size of [16, 32, 48, 96, 128]) {
    await renderIcon(page, size, join(runtimeIconRoot, `${size}.png`));
  }
  await renderIcon(page, 300, join(promotionalRoot, 'edge', 'logo-300.png'));
  await renderPromo(page, join(promotionalRoot, 'chrome', 'small-promo-440x280.png'));
  await renderPromo(page, join(promotionalRoot, 'edge', 'small-promo-440x280.png'));
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
  ['store-assets/promotional/edge/small-promo-440x280.png', 'Edge small promotional tile'],
]) {
  assets.push({ path, purpose, ...(await inspectPng(join(root, path))) });
}

const manifest = {
  schemaVersion: 1,
  source: {
    path: 'store-assets/brand/app-icon.svg',
    sha256: sha256(Buffer.from(svg)),
  },
  generatedWith: {
    browserName: 'Chromium',
    browserVersion,
  },
  generatedAt: new Date().toISOString(),
  assets,
};
await writeFile(join(promotionalRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Generated the runtime icon matrix and Chrome/Edge store promotional assets.');
