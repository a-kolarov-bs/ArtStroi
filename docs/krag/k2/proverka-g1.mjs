// Г1 кръг 2: снимки + механични проверки на навигацията (6 страници × 390/1440/320/1024,
// горе, след скрол, отворено меню) и на /kontakti (h1, карта, превъртане настрани).
// Пуск от корена, при вървящ `npx astro dev --port 4331` (извън sandbox):
//   node docs/krag/k2/proverka-g1.mjs <изходна папка> [BASE_URL]  → снимки + <папка>/fakti.json
import { mkdirSync, writeFileSync } from 'fs';
import { chromium } from 'playwright';

const out = process.argv[2];
const base = process.argv[3] || 'http://localhost:4331';
mkdirSync(out, { recursive: true });
const pages = ['/', '/uslugi', '/proekti', '/proekti/baza-za-otdih-ezerata-smolyan', '/za-nas', '/kontakti'];
const slug = (p) => (p === '/' ? 'home' : p.replace(/\//g, '-').replace(/^-/, ''));
const res = {};
const browser = await chromium.launch();

const headerFacts = () => {
  const h = document.getElementById('site-header');
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), w: Math.round(b.width), vis: getComputedStyle(el).display !== 'none' && b.width > 0 }; };
  const logo = h.querySelector('.site-logo');
  const nav = h.querySelector('nav[aria-label="Главна навигация"]');
  const call = [...h.querySelectorAll('a[href^="tel:"]')].filter((a) => a.getBoundingClientRect().width > 0 && !a.closest('[data-mobile-menu]'));
  const toggle = h.querySelector('[data-mobile-menu-toggle]');
  const cur = h.querySelector('.mobile-menu__link[aria-current="page"]');
  const before = cur ? getComputedStyle(cur, '::before').content : null;
  const callChip = h.querySelector('.header-chip--call, [data-header-call]');
  return {
    vw: innerWidth, state: h.dataset.state, tone: h.dataset.tone,
    logo: r(logo), nav: r(nav), toggle: r(toggle),
    navCenterOffset: nav && r(nav).vis ? Math.round((r(nav).l + r(nav).r) / 2 - innerWidth / 2) : null,
    logoCenterOffset: logo ? Math.round((r(logo).l + r(logo).r) / 2 - innerWidth / 2) : null,
    calls: call.map((a) => ({ href: a.getAttribute('href'), text: a.textContent.replace(/\s+/g, ' ').trim(), color: getComputedStyle(a).color, ...r(a) })),
    toggleBg: toggle ? getComputedStyle(toggle).backgroundImage + ' | ' + getComputedStyle(toggle).backgroundColor : null,
    callBg: callChip ? getComputedStyle(callChip).backgroundImage + ' | ' + getComputedStyle(callChip).backgroundColor : null,
    activeBefore: before,
    hScroll: document.documentElement.scrollWidth > innerWidth,
    h1: document.querySelectorAll('h1').length,
  };
};

for (const [vname, vp] of [['m390', { width: 390, height: 844, deviceScaleFactor: 2 }], ['d1440', { width: 1440, height: 900, deviceScaleFactor: 1 }], ['m320', { width: 320, height: 640, deviceScaleFactor: 2 }], ['t1024', { width: 1024, height: 900, deviceScaleFactor: 1 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: vp.deviceScaleFactor });
  const page = await ctx.newPage();
  for (const p of pages) {
    if ((vname === 'm320' || vname === 't1024') && !['/', '/kontakti', '/proekti'].includes(p)) continue;
    const key = `${vname}${p}`;
    await page.goto(base + p, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(700);
    res[key] = { top: await page.evaluate(headerFacts) };
    await page.screenshot({ path: `${out}/${vname}-${slug(p)}-top.png`, clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 260) } });
    if (p === '/kontakti') await page.screenshot({ path: `${out}/${vname}-kontakti-full.png`, fullPage: true });
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(700);
    res[key].scrolled = await page.evaluate(headerFacts);
    await page.screenshot({ path: `${out}/${vname}-${slug(p)}-scrolled.png`, clip: { x: 0, y: 0, width: vp.width, height: 160 } });
    if (vp.width < 1024) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      const t = page.locator('[data-mobile-menu-toggle]');
      await t.click();
      await page.waitForTimeout(600);
      res[key].open = await page.evaluate(() => ({ open: document.getElementById('site-header').dataset.menuOpen, label: document.querySelector('[data-mobile-menu-toggle]').getAttribute('aria-label'), menu: (() => { const b = document.getElementById('mobile-menu').getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right) }; })() }));
      res[key].openFacts = await page.evaluate(headerFacts);
      await page.screenshot({ path: `${out}/${vname}-${slug(p)}-menu.png` });
      await t.click();
      await page.waitForTimeout(500);
      res[key].closedAgain = await page.evaluate(() => document.getElementById('site-header').dataset.menuOpen);
    }
  }
  // Keyboard: Tab through the header on / and screenshot focus on the call link.
  await page.goto(base + '/kontakti', { waitUntil: 'networkidle' });
  const focusSeq = [];
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    focusSeq.push(await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return `${a.tagName}:${(a.getAttribute('aria-label') || a.textContent).replace(/\s+/g, ' ').trim().slice(0, 30)}:${cs.outlineStyle}/${cs.outlineWidth}`; }));
    if (await page.evaluate(() => document.activeElement?.getAttribute('href')?.startsWith('tel:') && !document.activeElement.closest('[data-mobile-menu]'))) {
      await page.screenshot({ path: `${out}/${vname}-focus-call.png`, clip: { x: 0, y: 0, width: vp.width, height: 110 } });
    }
  }
  res[`${vname}-tab`] = focusSeq;
  // Contacts layout facts
  await page.goto(base + '/kontakti', { waitUntil: 'networkidle' });
  res[`${vname}-kontakti`] = await page.evaluate(() => {
    const m = document.querySelector('.contact-map'); const b = m?.getBoundingClientRect();
    const h1 = document.querySelector('h1'); const hb = h1?.getBoundingClientRect();
    const hdr = document.getElementById('site-header').getBoundingClientRect();
    return { h1s: document.querySelectorAll('h1').length, h1Text: h1?.textContent.trim(), h1Top: Math.round(hb.top), headerBottom: Math.round(hdr.bottom), map: b && { w: Math.round(b.width), h: Math.round(b.height), ratio: +(b.width / b.height).toFixed(2), top: Math.round(b.top + scrollY) }, hasHeroText: document.body.textContent.includes('Кажете ни какъв е обектът'), mark: !!document.querySelector('.contact-page__mark'), bpSheets: document.querySelectorAll('.contact-page .bp-sheet').length, hScroll: document.documentElement.scrollWidth > innerWidth };
  });
  await ctx.close();
}
// Reduced motion: menu opens instantly.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(base + '/uslugi', { waitUntil: 'networkidle' });
  await page.locator('[data-mobile-menu-toggle]').click();
  await page.waitForTimeout(50);
  res.reduced = await page.evaluate(() => getComputedStyle(document.getElementById('mobile-menu')).opacity);
  await ctx.close();
}
await browser.close();
writeFileSync(`${out}/fakti.json`, JSON.stringify(res, null, 1));
console.log('OK', Object.keys(res).length);
