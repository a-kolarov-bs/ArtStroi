// Проверка на лентата (кръг 2, финал 2, Б2): тонът на лентата не се сменя,
// докато под нея е една и съща секция. На /uslugi лентата превключваше
// тъмно↔сиво до 4 пъти над тъмното хиро, защото търсенето на фона спираше
// на 8 нива нагоре в DOM-а.
//
// Превърта всяка страница на стъпки по 40 px. На всяка стъпка записва
// `data-tone` на лентата и секциите под трите точки на лентата (лого, център,
// телефон). Смяна на тона при същите секции под лентата е пад.
//
//   BASE_URL=http://localhost:4370 node docs/krag/k2/proverka-lenta-trepkane.mjs
//
// Срещу build (`astro preview`). Без sandbox (Playwright).
// Мутация: с лимита от 8 нива в toneAt() пада с 9 смени на /uslugi (1024 и 1440); без него минава.

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4370';
const PAGES = ['/', '/uslugi', '/proekti', '/proekti/baza-za-otdih-ezerata-smolyan', '/za-nas', '/kontakti', '/nyama-takava-stranitsa'];
const WIDTHS = [1024, 1440, 390];
const STEP = 40;

const browser = await chromium.launch();
let fails = 0;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    let prev = null;
    for (let y = 0; y + 900 <= height; y += STEP) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(60);
      const now = await page.evaluate(() => {
        const header = document.getElementById('site-header');
        const r = header.getBoundingClientRect();
        const y = Math.round(r.top + r.height / 2);
        const xs = [r.left + 40, r.left + r.width / 2, r.right - 40].map(Math.round);
        // The surface under each point: the nearest picture/video, or the
        // nearest ancestor with an opaque background, however deep it is.
        const all = [...document.querySelectorAll('*')];
        const sections = xs.map((x) => {
          let el = document.elementsFromPoint(x, y).find((e) => !header.contains(e) && e !== document.body && e !== document.documentElement);
          while (el && el !== document.body) {
            if (/^(IMG|VIDEO|PICTURE|CANVAS|IFRAME)$/.test(el.tagName)) break;
            const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
            if (m && (m[3] === undefined ? 1 : +m[3]) >= 0.35) break;
            el = el.parentElement;
          }
          return el ? all.indexOf(el) : -1;
        });
        return { tone: header.dataset.tone || '', key: sections.join(',') };
      });
      if (prev && prev.key === now.key && prev.tone !== now.tone) {
        fails++;
        console.log(`FAIL ${width} ${path} y=${y}: ${prev.tone} -> ${now.tone} over the same sections [${now.key}]`);
      }
      prev = now;
    }
  }
  await page.close();
}
await browser.close();
console.log(fails ? `${fails} tone change(s) over the same section` : 'proverka-lenta-trepkane: OK');
process.exit(fails ? 1 : 0);
