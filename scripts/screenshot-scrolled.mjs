// Capture a screenshot after scrolling — useful for verifying scroll-triggered
// state changes (header background swap, etc.)
//
// Usage:  node scripts/screenshot-scrolled.mjs <path> <viewport> <scrollY>

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
const scrollY = parseInt(process.argv[4] || '600', 10);
const baseUrl = process.env.BASE_URL || 'http://localhost:4321';

const viewport = VIEWPORTS[argViewport];
const outDir = join(process.cwd(), 'screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[T:]/g, '-').slice(0, 16);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.deviceScaleFactor });
const page = await context.newPage();
await page.goto(`${baseUrl}${argPath}`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(1000);
await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
await page.waitForTimeout(700);

const file = join(outDir, `${stamp}-scrolled-${scrollY}-${argViewport}.png`);
await page.screenshot({ path: file });
console.log(`✓ scrolled to ${scrollY}px  →  ${file}`);

await context.close();
await browser.close();
