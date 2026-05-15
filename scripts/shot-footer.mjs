import { chromium } from 'playwright';
const browser = await chromium.launch();

// 1) footer-only shots
for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 900, deviceScaleFactor: 1 }],
  ['mobile',  { width: 390,  height: 844, deviceScaleFactor: 2 }],
]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.deviceScaleFactor, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(800);
  const footer = await page.$('footer');
  await footer.screenshot({ path: `screenshots/footer-only-${name}.png` });
  await context.close();
}

// 2) footer + FinalCta transition shot
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const footer = document.querySelector('footer');
    const rect = footer.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + rect.top - 400);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'screenshots/footer-transition.png' });
  await context.close();
}

console.log('done');
await browser.close();
