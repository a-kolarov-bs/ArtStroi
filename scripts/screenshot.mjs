// Screenshot helper for visual iteration.
//
// Usage:
//   node scripts/screenshot.mjs                       — captures all 3 viewports of /
//   node scripts/screenshot.mjs /proekti              — captures all 3 viewports of /proekti
//   node scripts/screenshot.mjs / desktop             — only desktop viewport
//   node scripts/screenshot.mjs / mobile fullPage     — mobile, full page (not just hero)
//
// Output → screenshots/<YYYY-MM-DD-HHmm>-<viewport>-<path>.png
// Requires the dev server running at localhost:4321.

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900,  deviceScaleFactor: 1 },
  tablet:  { width: 1024, height: 1366, deviceScaleFactor: 1 },
  mobile:  { width: 390,  height: 844,  deviceScaleFactor: 2 },
};

const argPath = process.argv[2] || '/';
const argViewport = process.argv[3]; // optional, restricts to one viewport
const fullPage = process.argv.includes('fullPage');
const baseUrl = process.env.BASE_URL || 'http://localhost:4321';

const outDir = join(process.cwd(), 'screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[T:]/g, '-').slice(0, 16);
const slug = argPath === '/' ? 'home' : argPath.replace(/\//g, '-').replace(/^-/, '');

const targets = argViewport ? [[argViewport, VIEWPORTS[argViewport]]] : Object.entries(VIEWPORTS);

const browser = await chromium.launch();
try {
  for (const [name, viewport] of targets) {
    if (!viewport) {
      console.error(`Unknown viewport: ${name}. Choose one of: ${Object.keys(VIEWPORTS).join(', ')}`);
      continue;
    }
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: viewport.deviceScaleFactor,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    const url = `${baseUrl}${argPath}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    // Wait for fonts + initial paint
    await page.waitForTimeout(800);

    // Trigger IntersectionObserver-based reveals by walking the document.
    // We scroll to the bottom and back to the top so every section enters
    // viewport at least once; otherwise fullPage shots show below-fold
    // sections still in their pre-reveal opacity-0 state.
    if (fullPage) {
      await page.evaluate(async () => {
        const total = document.documentElement.scrollHeight;
        const step = window.innerHeight;
        for (let y = 0; y <= total; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 80));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 250));
      });
      // Wait for any post-scroll animation settle
      await page.waitForTimeout(600);
    }

    const file = join(outDir, `${stamp}-${slug}-${name}${fullPage ? '-full' : ''}.png`);
    await page.screenshot({ path: file, fullPage });
    console.log(`✓ ${name.padEnd(7)} ${viewport.width}×${viewport.height}  →  ${file}`);
    await context.close();
  }
} finally {
  await browser.close();
}
