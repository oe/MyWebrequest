import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { chromium } from '@playwright/test';

const root = process.cwd();
const outputRoot = join(root, 'store-assets', 'listing-screenshots', 'chrome', 'en-US');
const manifestPath = join(root, 'store-assets', 'listing-screenshots', 'manifest.json');
const iconPath = join(root, 'store-assets', 'brand', 'app-icon.svg');
const sourcePaths = {
  rules: join(root, 'store-assets', 'screenshots', 'chrome', '01-rules-overview.png'),
  permission: join(root, 'store-assets', 'screenshots', 'chrome', '02-permission-explanation.png'),
  backup: join(root, 'store-assets', 'screenshots', 'chrome', '03-backup-restore.png'),
};

const icon = await readFile(iconPath);
const sources = Object.fromEntries(
  await Promise.all(Object.entries(sourcePaths).map(async ([key, path]) => [key, await readFile(path)])),
);

const scenes = [
  {
    index: '01 / 05',
    filename: '01-request-rules-made-clear.png',
    source: 'rules',
    layout: 'hero',
    eyebrow: 'MY WEBREQUEST',
    headline: 'Request rules,\nmade clear.',
    subhead: 'Create, test, and manage browser request rules without editing raw DNR JSON.',
    background: '#f2efe8',
    foreground: '#171a1e',
    muted: '#5d6268',
    frame: 'rgba(23,26,30,.16)',
  },
  {
    index: '02 / 05',
    filename: '02-match-with-precision.png',
    source: 'rules',
    layout: 'offset-right',
    eyebrow: 'CLEAR CONDITIONS',
    headline: 'Match with\nprecision.',
    subhead: 'Use wildcards, regular expressions, resource types, methods, and priorities.',
    background: '#e8edf0',
    foreground: '#171a1e',
    muted: '#59636c',
    frame: 'rgba(23,26,30,.16)',
  },
  {
    index: '03 / 05',
    filename: '03-access-only-when-needed.png',
    source: 'permission',
    layout: 'split',
    eyebrow: 'BOUNDED PERMISSIONS',
    headline: 'Access only\nwhen needed.',
    subhead: 'Review the exact website origins before continuing to the browser prompt.',
    background: '#1c2025',
    foreground: '#f7f6f2',
    muted: '#bec5cc',
    frame: 'rgba(255,255,255,.18)',
  },
  {
    index: '04 / 05',
    filename: '04-preview-before-import.png',
    source: 'backup',
    layout: 'offset-left',
    eyebrow: 'SAFE BACKUPS',
    headline: 'Preview before\nyou import.',
    subhead: 'See additions, updates, conflicts, and import mode before any rule changes.',
    background: '#efe5d8',
    foreground: '#191b1e',
    muted: '#625f5a',
    frame: 'rgba(25,27,30,.16)',
  },
  {
    index: '05 / 05',
    filename: '05-local-by-design.png',
    source: 'backup',
    layout: 'minimal',
    eyebrow: 'PRIVATE BY DEFAULT',
    headline: 'Local by\ndesign.',
    subhead: 'Rules, backups, and settings stay on this device.',
    background: '#f3f1ea',
    foreground: '#171a1e',
    muted: '#5d6268',
    frame: 'rgba(23,26,30,.16)',
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
  const encodedIcon = icon.toString('base64');
  const encodedScreenshot = sources[scene.source].toString('base64');
  const headline = scene.headline.replaceAll('\n', '<br>');
  return `
    <style>
      * { box-sizing: border-box; }
      html, body { width: 1280px; height: 800px; margin: 0; overflow: hidden; }
      body {
        position: relative;
        color: ${scene.foreground};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: ${scene.background};
      }
      body::after {
        content: "";
        position: absolute;
        z-index: 8;
        inset: 28px;
        border: 1px solid ${scene.frame};
        pointer-events: none;
      }
      .copy {
        position: absolute;
        z-index: 4;
      }
      .eyebrow {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 22px;
        font-size: 15px;
        font-weight: 760;
        letter-spacing: .16em;
      }
      .eyebrow::before {
        content: "";
        width: 34px;
        height: 4px;
        border-radius: 999px;
        background: #168bd2;
      }
      h1 {
        margin: 0;
        font-size: 68px;
        line-height: .98;
        letter-spacing: -.052em;
        font-weight: 780;
      }
      p {
        max-width: 580px;
        margin: 24px 0 0;
        color: ${scene.muted};
        font-size: 23px;
        line-height: 1.42;
        letter-spacing: -.01em;
      }
      .mark {
        position: absolute;
        z-index: 5;
        display: block;
        width: 68px;
        height: 68px;
        filter: drop-shadow(0 8px 12px rgba(17,28,39,.16));
      }
      .index {
        position: absolute;
        z-index: 6;
        right: 62px;
        bottom: 48px;
        color: ${scene.muted};
        font-size: 15px;
        font-weight: 680;
        letter-spacing: .14em;
        font-variant-numeric: tabular-nums;
      }
      .window {
        position: absolute;
        z-index: 2;
        overflow: hidden;
        border: 1px solid rgba(23,32,42,.18);
        border-radius: 18px;
        background: #f7f9fc;
        box-shadow: 0 24px 54px rgba(19,33,48,.16), inset 0 1px 0 rgba(255,255,255,.95);
      }
      .chrome {
        position: absolute;
        z-index: 2;
        left: 0;
        right: 0;
        top: 0;
        height: 38px;
        background:
          radial-gradient(circle at 22px 50%, #ff6b6b 0 5px, transparent 6px),
          radial-gradient(circle at 43px 50%, #ffd43b 0 5px, transparent 6px),
          radial-gradient(circle at 64px 50%, #51cf66 0 5px, transparent 6px),
          linear-gradient(180deg, rgba(255,255,255,.98), rgba(236,241,248,.98));
        border-bottom: 1px solid rgba(30,72,119,.12);
      }
      .window img {
        display: block;
        width: 100%;
        height: calc(100% - 38px);
        margin-top: 38px;
        object-fit: cover;
        object-position: center;
      }
      .hero .copy { left: 78px; top: 58px; }
      .hero .copy h1 { font-size: 62px; }
      .hero .copy p { max-width: 650px; margin-top: 18px; font-size: 21px; }
      .hero .mark { right: 64px; top: 58px; }
      .hero .window { left: 72px; top: 292px; width: 1136px; height: 690px; transform: rotate(.25deg); }

      .offset-right .copy { left: 72px; top: 96px; width: 470px; }
      .offset-right .mark { left: 72px; bottom: 62px; }
      .offset-right .window { right: -80px; top: 80px; width: 820px; height: 650px; transform: rotate(-.7deg); }
      .offset-right .window img { width: 145%; max-width: none; transform: translateX(-31%); object-fit: cover; }

      .split .copy { left: 72px; top: 122px; width: 450px; }
      .split .mark { left: 72px; bottom: 62px; }
      .split .window { right: -54px; top: 76px; width: 750px; height: 650px; }

      .offset-left .copy { right: 70px; top: 92px; width: 455px; }
      .offset-left .mark { right: 70px; bottom: 64px; }
      .offset-left .window { left: -66px; top: 134px; width: 790px; height: 620px; transform: rotate(.65deg); }
      .offset-left .window img { width: 136%; max-width: none; object-position: left center; }

      .minimal .copy { left: 108px; top: 170px; width: 430px; }
      .minimal .mark { left: 108px; top: 72px; width: 76px; height: 76px; }
      .minimal .window { right: -70px; top: 84px; width: 760px; height: 646px; transform: rotate(-.5deg); }
      .minimal .window img { width: 132%; max-width: none; object-position: left center; }
    </style>
    <main class="${scene.layout}">
      <img class="mark" alt="" src="data:image/svg+xml;base64,${encodedIcon}">
      <div class="index">${scene.index}</div>
      <section class="copy">
        <div class="eyebrow">${scene.eyebrow}</div>
        <h1>${headline}</h1>
        <p>${scene.subhead}</p>
      </section>
      <section class="window">
        <div class="chrome"></div>
        <img alt="" src="data:image/png;base64,${encodedScreenshot}">
      </section>
    </main>
  `;
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
    source: `store-assets/screenshots/chrome/${
      scene.source === 'rules'
        ? '01-rules-overview.png'
        : scene.source === 'permission'
          ? '02-permission-explanation.png'
          : '03-backup-restore.png'
    }`,
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
      path: `store-assets/screenshots/chrome/${
        key === 'rules'
          ? '01-rules-overview.png'
          : key === 'permission'
            ? '02-permission-explanation.png'
            : '03-backup-restore.png'
      }`,
      sha256: sha256(bytes),
    })),
  ],
  assets,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Generated five Chrome Web Store listing screenshots at 1280x800.');
