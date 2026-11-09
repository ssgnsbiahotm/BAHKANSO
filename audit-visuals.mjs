import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PAGES = [
  { name: 'login', url: 'http://localhost:5173/login' },
  { name: 'home', url: 'http://localhost:5173/' },
  { name: 'dashboard', url: 'http://localhost:5173/app/dashboard' },
  { name: 'operations', url: 'http://localhost:5173/app/agriculture/operations' },
];

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

async function runAudit() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const p of PAGES) {
    console.log(`Auditing page: ${p.name} (${p.url})`);
    const dir = path.join('output/audit', p.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    try {
      await page.goto(p.url, { waitUntil: 'networkidle' });
      
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const screenshotPath = path.join(dir, `${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  - Captured ${vp.name}`);
      }
    } catch (e) {
      console.error(`  - Failed to capture ${p.name}: ${e.message}`);
    }
  }

  await browser.close();
}

runAudit().catch(console.error);
