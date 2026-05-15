// Capture a sequence of screenshots over time — useful for verifying
// auto-rotating carousels and other ambient animations.
//
// Usage:  node scripts/screenshot-sequence.mjs <path> <viewport> <count> <intervalMs>

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900,  deviceScaleFactor: 1 },
  tablet:  { width: 1024, height: 1366, deviceScaleFactor: 1 },
  mobile:  { width: 390,  height: 844,  deviceScaleFactor: 2 },
};

const argPath = process.argv[2] || '/';
const argViewport = process.argv[3] || 'desktop';
const count = parseInt(process.argv[4] || '4', 10);
const interval = parseInt(process.argv[5] || '4500', 10);
const baseUrl = process.env.BASE_URL || 'http://localhost:4321';

const viewport = VIEWPORTS[argViewport];
if (!viewport) {
  console.error(`Unknown viewport: ${argViewport}. Choose: ${Object.keys(VIEWPORTS).join(', ')}`);
  process.exit(1);
}

const outDir = join(process.cwd(), 'screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[T:]/g, '-').slice(0, 16);
const slug = argPath === '/' ? 'home' : argPath.replace(/\//g, '-').replace(/^-/, '');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.deviceScaleFactor });
const page = await context.newPage();
await page.goto(`${baseUrl}${argPath}`, { waitUntil: 'networkidle', timeout: 20000 });
// Initial paint + font-swap
await page.waitForTimeout(1500);

for (let i = 1; i <= count; i++) {
  const file = join(outDir, `${stamp}-${slug}-${argViewport}-seq-${i}.png`);
  await page.screenshot({ path: file });
  console.log(`✓ frame ${i}/${count}  →  ${file}`);
  if (i < count) await page.waitForTimeout(interval);
}

await context.close();
await browser.close();
