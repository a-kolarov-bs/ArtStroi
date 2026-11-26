// Клавиатура в отвореното мобилно меню (390). Пуск от корена при dev на 4331:
//   node docs/krag/k2/fokus-menu.mjs
// Очаквано: backToToggle.open "true", pastLast.open "false" (Tab след последния ред затваря).
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:4331/uslugi', { waitUntil: 'networkidle' });
const state = () => p.evaluate(() => ({ open: document.getElementById('site-header').dataset.menuOpen, focus: (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent).replace(/\s+/g, ' ').trim().slice(0, 28) }));
const out = {};
await p.focus('[data-mobile-menu-toggle]');
await p.keyboard.press('Enter'); await p.waitForTimeout(300);
out.opened = await state();
await p.keyboard.press('Tab'); out.firstRow = await state();
await p.keyboard.press('Shift+Tab'); out.backToToggle = await state();
for (let i = 0; i < 6; i++) await p.keyboard.press('Tab');
out.lastRow = await state();
await p.keyboard.press('Tab'); await p.waitForTimeout(100); out.pastLast = await state();
console.log(JSON.stringify(out));
await b.close();
