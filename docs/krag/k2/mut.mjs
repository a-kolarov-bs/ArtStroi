// Бързи факти за мутации (лента + /kontakti на 390 и 1440). Пуск от корена при dev на 4331:
//   node docs/krag/k2/mut.mjs
// Очаквано: logoCenter 0 (390) / nav 0 (1440), callBgColor rgba(18, 22, 28, 0.66) на 390,
// bar none, h1 1, intro false, mapRatio ≈ 0.86 на 1440. Развали ред → стойността се сменя.
import { chromium } from 'playwright';
const b = await chromium.launch();
const out = {};
for (const w of [390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('http://localhost:4331/kontakti', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  out[w] = await p.evaluate(() => {
    const h = document.getElementById('site-header');
    const nav = h.querySelector('nav[aria-label="Главна навигация"]').getBoundingClientRect();
    const logo = h.querySelector('.site-logo').getBoundingClientRect();
    const tog = h.querySelector('[data-mobile-menu-toggle]').getBoundingClientRect();
    const call = h.querySelector('[data-header-call]');
    const cur = h.querySelector('.mobile-menu__link[aria-current="page"]');
    const map = document.querySelector('.contact-map').getBoundingClientRect();
    return {
      navCenter: nav.width ? Math.round((nav.left + nav.right) / 2 - innerWidth / 2) : null,
      logoCenter: Math.round((logo.left + logo.right) / 2 - innerWidth / 2),
      toggleLeft: Math.round(tog.left), callRight: Math.round(call.getBoundingClientRect().right),
      callBgColor: getComputedStyle(call).backgroundColor,
      bar: getComputedStyle(cur, '::before').content,
      h1: document.querySelectorAll('h1').length,
      mapRatio: +(map.width / map.height).toFixed(2),
      intro: document.body.textContent.includes('Кажете ни какъв е обектът'),
    };
  });
  await p.close();
}
await b.close();
console.log(JSON.stringify(out));
