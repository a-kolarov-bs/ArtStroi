// Проверка на лентата (кръг 2, финал, Н2): логото, линковете в центъра и
// телефонът вдясно се четат върху каквото е под тях, на всяка страница и при
// всяко превъртане.
//
// За всеки елемент: снимка на неговия правоъгълник два пъти, видим и скрит
// (visibility:hidden). Скритата снимка е истинският фон (лентата + страницата
// под нея). Пикселите, които се различават, са самият текст/лого; за всеки
// от тях се смята контрастът спрямо фона на същото място. Взима се 80-ият
// персентил (ядрото на буквите, не размитите им ръбове). Под 3:1 е пад.
//
//   BASE_URL=http://localhost:4362 node docs/krag/k2/proverka-lenta.mjs [папка за снимки на падовете]
//
// По-сигурно е срещу build (`astro preview`), не срещу dev: презареждането
// на dev сървъра при чужда редакция прекъсва пробата. Без sandbox (Playwright).
// Мутации (кръг 2): старата лента → 108 пада от 959; лента с прозрачност
// 0.18 вместо 0.62 → 17 пада (снимки под лентата); новата → 0.

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:4362';
const OUT = process.argv[2] || '';
if (OUT) mkdirSync(OUT, { recursive: true });

const PAGES = [
  '/',
  '/uslugi',
  '/proekti',
  '/proekti/baza-za-otdih-ezerata-smolyan',
  '/proekti/rekonstruktsiya-sektor-a-stadion-georgi-asparuhov',
  '/proekti/butikov-hotel-iva-i-elena-k-k-pamporovo',
  '/za-nas',
  '/kontakti',
  '/nyama-takava-stranitsa',
];
const WIDTHS = [1024, 1440];
const MIN = 3;

const lum = (r, g, b) => {
  const c = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const ratio = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

// PNG → RGBA через браузъра (без допълнителни пакети).
async function decode(page, buffers) {
  return page.evaluate(async (list) => {
    const out = [];
    for (const b64 of list) {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      out.push(Array.from(ctx.getImageData(0, 0, c.width, c.height).data));
    }
    return out;
  }, buffers.map((b) => b.toString('base64')));
}

async function scrollTo(page, y) {
  await page.evaluate((top) => {
    const l = window.__lenis;
    if (l && typeof l.scrollTo === 'function') l.scrollTo(top, { immediate: true, force: true });
    window.scrollTo(0, top);
    window.dispatchEvent(new Event('scroll'));
  }, y);
  await page.waitForTimeout(900); // преходите на цвета/логото са до 400 ms
}

async function measure(page, handle, label) {
  const box = await handle.boundingBox();
  if (!box || box.width < 2 || box.height < 2) return null;
  const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
  const shown = await page.screenshot({ clip, animations: 'disabled' });
  await handle.evaluate((el) => { el.style.visibility = 'hidden'; });
  const hidden = await page.screenshot({ clip, animations: 'disabled' });
  await handle.evaluate((el) => { el.style.visibility = ''; });
  const [a, b] = await decode(page, [shown, hidden]);
  const contrasts = [];
  for (let i = 0; i < a.length; i += 4) {
    const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d < 24) continue;
    contrasts.push(ratio(lum(a[i], a[i + 1], a[i + 2]), lum(b[i], b[i + 1], b[i + 2])));
  }
  if (contrasts.length < 10) return { label, contrast: 1, note: 'няма видими пиксели' };
  contrasts.sort((x, y) => x - y);
  return { label, contrast: contrasts[Math.floor(contrasts.length * 0.8)] };
}

const browser = await chromium.launch();
const failures = [];
let checks = 0;
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.mouse.move(width / 2, 899);
    await page.evaluate(() => document.fonts.ready);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const vh = 900;
    const ys = [0, 0.35 * vh, 0.7 * vh, 1.05 * vh, 0.3 * max, 0.55 * max, 0.8 * max, max]
      .map((y) => Math.round(Math.min(Math.max(0, y), max)));
    for (const y of [...new Set(ys)]) {
      await scrollTo(page, y);
      const tone = await page.evaluate(() => document.getElementById('site-header')?.dataset.tone);
      const targets = [
        ['лого', page.locator('#site-header .site-logo')],
        ...(await page.locator('#site-header [data-nav-link]').all()).map((h, i) => [`линк ${i + 1}`, h]),
        ['телефон', page.locator('#site-header [data-header-call]')],
      ];
      for (const [label, loc] of targets) {
        const handle = await (loc.elementHandle ? loc.elementHandle() : loc);
        const r = await measure(page, handle, label);
        if (!r) continue;
        checks++;
        if (r.contrast < MIN) {
          const name = `${width}${path.replace(/\//g, '_')}-y${y}-${label.replace(/ /g, '')}`;
          failures.push(`${width} ${path} y=${y} тон=${tone} ${label}: ${r.contrast.toFixed(2)}${r.note ? ' ' + r.note : ''}`);
          if (OUT) await page.screenshot({ path: join(OUT, `${name}.png`), clip: { x: 0, y: 0, width, height: 120 } });
        }
      }
    }
  }
  await ctx.close();
}
await browser.close();

console.log(`проверки: ${checks}, под ${MIN}:1: ${failures.length}`);
for (const f of failures) console.log('  ПАД ' + f);
process.exit(failures.length ? 1 : 0);
