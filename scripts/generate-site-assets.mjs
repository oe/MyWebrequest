import { copyFile, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const screenshot = 'store-assets/screenshots/chrome/01-rules-overview.png';
await copyFile(screenshot, 'site/src/assets/rules-overview.png');
const encoded = (await readFile(screenshot)).toString('base64');
const icon = (await readFile('store-assets/brand/app-icon.svg')).toString('base64');
const browser = await chromium.launch({ executablePath: chromium.executablePath(), headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; width: 1200px; height: 630px; color: #17202b; background: #f0f5fc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      header { display: flex; align-items: center; gap: 16px; padding: 38px 44px; font-size: 30px; font-weight: 700; }
      header img { width: 48px; height: 48px; }
      main { display: flex; align-items: center; gap: 30px; padding: 15px 44px; }
      .copy { width: 402px; flex: none; }
      h1 { font-size: 49px; line-height: 1.08; letter-spacing: -2px; margin: 0 0 22px; }
      p { font-size: 21px; line-height: 1.45; color: #536176; margin: 0; }
      .screenshot { width: 680px; height: 425px; object-fit: contain; border: 1px solid #d4deeb; border-radius: 10px; box-shadow: 0 18px 48px #17385820; }
    </style>
    <header><img src="data:image/svg+xml;base64,${icon}" />RequestOrbit</header>
    <main><div class="copy"><h1>Make links go<br>where you want</h1>
    <p>Your own URL redirects.<br>No account. Rules stay local.<br>request.forth.ink</p></div>
    <img class="screenshot" src="data:image/png;base64,${encoded}" /></main>
  `);
  await page.locator('.screenshot').evaluate((img) => img.decode());
  await page.screenshot({ path: 'site/public/social-preview.png' });
} finally {
  await browser.close();
}
console.log('Updated the website screenshot and 1200x630 social card from the captured product UI.');
