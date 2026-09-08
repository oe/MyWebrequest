import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Render the existing vector icon with a warm palette; no runtime canvas or filters.
const palette = {
  '#75DDFF': '#FDE68A',
  '#229EF5': '#FBBF24',
  '#0869DF': '#D97706',
  '#0346B8': '#92400E',
  '#BDF3FF': '#FEF3C7',
  '#25C8FF': '#F59E0B',
  '#063DAE': '#78350F',
  '#EDF4FA': '#FFFBEB',
};
const source = await readFile(new URL('../store-assets/brand/app-icon.svg', import.meta.url), 'utf8');
const amber = source.replace(/#[0-9A-F]{6}/g, (color) => palette[color] ?? color);
const output = new URL('../src/public/icon/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium' });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const size of [16, 32, 48]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body {margin:0;background:transparent} svg {display:block;width:100%;height:100%}</style>${amber}`,
    );
    await page.screenshot({ path: new URL(`paused-${size}.png`, output).pathname, omitBackground: true });
  }
} finally {
  await browser.close();
}
console.log('Rendered amber toolbar icons at 16, 32 and 48 px.');
