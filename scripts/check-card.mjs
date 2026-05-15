import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'no-preference',
});
const page = await context.newPage();

page.on('console', (msg) => console.log('PAGE LOG:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message, err.stack?.slice(0, 600)));
page.on('requestfailed', (req) => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
page.on('response', (resp) => {
  if (resp.status() >= 400) console.log('HTTP', resp.status(), resp.url());
});

await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await browser.close();
