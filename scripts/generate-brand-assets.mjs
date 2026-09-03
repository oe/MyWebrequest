import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const root = process.cwd();
const sourcePath = join(root, 'store-assets', 'brand', 'app-icon.svg');
const runtimeIconRoot = join(root, 'src', 'public', 'icon');
const promotionalRoot = join(root, 'store-assets', 'promotional');
const svg = await readFile(sourcePath, 'utf8');
const rulesScreenshotPath = join(root, 'store-assets', 'screenshots', 'chrome', '01-rules-overview.png');
const permissionScreenshotPath = join(
  root,
  'store-assets',
  'screenshots',
  'chrome',
  '02-permission-explanation.png',
);
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
  const encodedIcon = Buffer.from(svg).toString('base64');
  const encodedRules = rulesScreenshot.toString('base64');
  const encodedPermission = permissionScreenshot.toString('base64');
  const isMarquee = width > 1000;
  await page.setViewportSize({ width, height });
  await page.setContent(`
    <style>
      * { box-sizing: border-box; }
      html, body { width: ${width}px; height: ${height}px; margin: 0; overflow: hidden; }
      body {
        position: relative;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 14% -8%, rgba(108, 225, 255, 0.72), transparent 35%),
          radial-gradient(circle at 100% 110%, rgba(0, 189, 255, 0.42), transparent 42%),
          linear-gradient(132deg, #061a43 0%, #075bcf 52%, #08aee9 100%);
      }
      body::before {
        content: "";
        position: absolute;
        inset: 0;
        opacity: .34;
        background-image:
          linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
        background-size: ${isMarquee ? '64px 64px' : '32px 32px'};
        mask-image: linear-gradient(100deg, transparent 0%, black 46%, black 100%);
      }
      .orbital {
        position: absolute;
        width: ${isMarquee ? 720 : 330}px;
        height: ${isMarquee ? 720 : 330}px;
        left: ${isMarquee ? -330 : -172}px;
        top: ${isMarquee ? -160 : -105}px;
        border: 1px solid rgba(255,255,255,.24);
        border-radius: 50%;
        box-shadow:
          0 0 0 ${isMarquee ? 72 : 34}px rgba(255,255,255,.06),
          0 0 0 ${isMarquee ? 144 : 68}px rgba(35,210,255,.07);
      }
      .brand {
        position: absolute;
        z-index: 4;
        left: ${isMarquee ? 92 : 30}px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 34px;
      }
      .brand img {
        display: block;
        width: ${isMarquee ? 250 : 146}px;
        height: ${isMarquee ? 250 : 146}px;
        filter:
          drop-shadow(0 ${isMarquee ? 30 : 16}px ${isMarquee ? 42 : 22}px rgba(0, 11, 43, .35))
          drop-shadow(0 0 ${isMarquee ? 18 : 10}px rgba(114, 232, 255, .28));
      }
      .wordmark {
        display: ${isMarquee ? 'block' : 'none'};
        width: 330px;
        font-size: 54px;
        line-height: 1.02;
        letter-spacing: -.045em;
        font-weight: 760;
        text-shadow: 0 8px 24px rgba(0, 20, 76, .28);
      }
      .stage {
        position: absolute;
        z-index: 2;
        width: ${isMarquee ? 650 : 288}px;
        height: ${isMarquee ? 455 : 205}px;
        right: ${isMarquee ? -30 : -34}px;
        top: 50%;
        transform: translateY(-50%);
      }
      .window {
        position: absolute;
        overflow: hidden;
        border: ${isMarquee ? 2 : 1}px solid rgba(255,255,255,.7);
        border-radius: ${isMarquee ? 24 : 13}px;
        background: #f7f9fc;
        box-shadow:
          0 ${isMarquee ? 30 : 15}px ${isMarquee ? 70 : 32}px rgba(0, 16, 61, .34),
          inset 0 1px 0 rgba(255,255,255,.9);
      }
      .window::before {
        content: "";
        position: absolute;
        z-index: 2;
        left: 0;
        right: 0;
        top: 0;
        height: ${isMarquee ? 30 : 15}px;
        background:
          radial-gradient(circle at ${isMarquee ? 18 : 9}px 50%, #ff6b6b 0 ${isMarquee ? 4 : 2}px, transparent ${isMarquee ? 5 : 3}px),
          radial-gradient(circle at ${isMarquee ? 36 : 18}px 50%, #ffd43b 0 ${isMarquee ? 4 : 2}px, transparent ${isMarquee ? 5 : 3}px),
          radial-gradient(circle at ${isMarquee ? 54 : 27}px 50%, #51cf66 0 ${isMarquee ? 4 : 2}px, transparent ${isMarquee ? 5 : 3}px),
          linear-gradient(180deg, rgba(255,255,255,.96), rgba(236,241,248,.96));
        border-bottom: 1px solid rgba(30, 72, 119, .12);
      }
      .window img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .window.primary {
        width: ${isMarquee ? 600 : 268}px;
        height: ${isMarquee ? 412 : 168}px;
        right: 0;
        top: ${isMarquee ? 16 : 14}px;
        transform: rotate(${isMarquee ? -2.5 : -3.5}deg);
      }
      .window.primary img { padding-top: ${isMarquee ? 30 : 15}px; }
      .window.secondary {
        display: ${isMarquee ? 'block' : 'none'};
        width: 420px;
        height: 262px;
        left: -40px;
        bottom: -34px;
        transform: rotate(4.5deg);
      }
      .window.secondary img { padding-top: 30px; }
      .shine {
        position: absolute;
        z-index: 3;
        width: ${isMarquee ? 450 : 190}px;
        height: ${isMarquee ? 450 : 190}px;
        right: ${isMarquee ? -180 : -88}px;
        top: ${isMarquee ? -220 : -95}px;
        border-radius: 50%;
        background: rgba(255,255,255,.18);
        filter: blur(${isMarquee ? 2 : 1}px);
      }
    </style>
    <div class="orbital"></div>
    <div class="shine"></div>
    <div class="brand">
      <img alt="" src="data:image/svg+xml;base64,${encodedIcon}">
      <div class="wordmark">My<br>Webrequest</div>
    </div>
    <div class="stage">
      <div class="window primary"><img alt="" src="data:image/png;base64,${encodedRules}"></div>
      <div class="window secondary"><img alt="" src="data:image/png;base64,${encodedPermission}"></div>
    </div>
  `);
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
  for (const size of [16, 32, 48, 96, 128]) {
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
      path: 'store-assets/screenshots/chrome/01-rules-overview.png',
      purpose: 'Real rules editor UI used in promotional artwork',
      sha256: sha256(rulesScreenshot),
    },
    {
      path: 'store-assets/screenshots/chrome/02-permission-explanation.png',
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
