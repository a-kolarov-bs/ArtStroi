#!/usr/bin/env node
// Checks the built site (dist/) against the explicit project categories in
// src/data/legacy-projects.json:
//   1. every record has one of the categories offered as chips on /proekti;
//   2. the number of cards per category on /proekti equals the data;
//   3. on /uslugi, every service with its own category (refCat in
//      src/data/services.ts) links "N реализирани обекта" to the
//      /proekti?cat=X filter that shows exactly N cards, and the index at the
//      top repeats N; a service with refCat: null shows no number anywhere
//      and links to /proekti. No two services may share a category;
//   4. every project detail page names its category in JSON-LD and the
//      JSON-LD image is an absolute URL;
//   5. every project detail page draws at least one gallery tile: the hero
//      cover is hidden below 1024 px, so a phone sees only the gallery.
// Usage: node scripts/check-categories.mjs [distDir]   (runs as postbuild)
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const data = JSON.parse(readFileSync('src/data/legacy-projects.json', 'utf8'));
const errors = [];
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const proekti = readFileSync(join(dist, 'proekti/index.html'), 'utf8');
const chips = [...proekti.matchAll(/data-cat="([^"]+)"/g)].map((m) => decode(m[1])).filter((c) => c !== 'all');
const cards = [...proekti.matchAll(/data-category="([^"]+)"/g)].map((m) => decode(m[1]));

if (new Set(chips).size !== chips.length) errors.push(`duplicate chips: ${chips.join(', ')}`);

const expected = {};
for (const r of data) {
  if (!chips.includes(r.category)) errors.push(`project ${r.id}: category ${JSON.stringify(r.category)} is not a chip on /proekti`);
  expected[r.category] = (expected[r.category] ?? 0) + 1;
}
const onPage = {};
for (const c of cards) onPage[c] = (onPage[c] ?? 0) + 1;

if (cards.length !== data.length) errors.push(`/proekti shows ${cards.length} cards, data has ${data.length}`);
for (const c of chips) {
  if ((onPage[c] ?? 0) !== (expected[c] ?? 0))
    errors.push(`/proekti?cat=${c}: ${onPage[c] ?? 0} cards, data says ${expected[c] ?? 0}`);
  if (!expected[c]) errors.push(`chip ${c} has no projects`);
}

// Expected: the refCat of each service, in card order, from src/data/services.ts.
const uslugiSrc = readFileSync('src/data/services.ts', 'utf8');
const refCats = [...uslugiSrc.matchAll(/^\s*refCat: (null|'([^']+)'),/gm)].map((m) => m[2] ?? null);
if (refCats.length !== 6) errors.push(`services.ts: expected 6 refCat entries, found ${refCats.length}`);
const own = refCats.filter(Boolean);
if (new Set(own).size !== own.length) errors.push(`services.ts: two services share a category (${own.join(', ')}); set refCat: null on the one that is not that kind of work`);
for (const c of own) if (!chips.includes(c)) errors.push(`services.ts: refCat ${c} is not a chip on /proekti`);

const uslugi = readFileSync(join(dist, 'uslugi/index.html'), 'utf8');
// Card footers, in card order: href and the visible label.
const links = [...uslugi.matchAll(/href="(\/proekti[^"]*)"[^>]*class="[^"]*us-card__more[^"]*"[^>]*>\s*<span[^>]*>([^<]+)<\/span>/g)]
  .map((m) => ({ href: decode(m[1]), label: m[2].trim() }));
// Index rows at the top, in the same order: the number, or none.
const indexRows = [...uslugi.matchAll(/class="us-index__row[\s\S]*?<\/a>/g)]
  .map((m) => m[0].match(/us-index__count[^>]*>\s*(\d+)\s*</)?.[1] ?? null);
if (links.length !== refCats.length) errors.push(`/uslugi: ${links.length} card links, ${refCats.length} services`);
if (indexRows.length !== refCats.length) errors.push(`/uslugi: ${indexRows.length} index rows, ${refCats.length} services`);
const uslugiParts = [];
refCats.forEach((cat, i) => {
  const link = links[i];
  const idx = indexRows[i];
  if (!link) return;
  if (cat === null) {
    if (link.href !== '/proekti') errors.push(`/uslugi card ${i + 1}: no own category, links to ${link.href} instead of /proekti`);
    if (/\d/.test(link.label)) errors.push(`/uslugi card ${i + 1}: no own category, but the link says "${link.label}"`);
    if (idx !== null) errors.push(`/uslugi index row ${i + 1}: no own category, but shows ${idx}`);
    uslugiParts.push(`${i + 1}: без число`);
    return;
  }
  const n = onPage[cat] ?? 0;
  const m = link.label.match(/^(\d+) (реализиран обект|реализирани обекта)$/);
  if (decodeURIComponent(link.href) !== `/proekti?cat=${cat}`) errors.push(`/uslugi card ${i + 1}: links to ${decodeURIComponent(link.href)}, expected /proekti?cat=${cat}`);
  if (!m || Number(m[1]) !== n) errors.push(`/uslugi card ${i + 1}: says "${link.label}", /proekti?cat=${cat} shows ${n}`);
  if (idx === null || Number(idx) !== n) errors.push(`/uslugi index row ${i + 1}: shows ${idx}, /proekti?cat=${cat} shows ${n}`);
  uslugiParts.push(`${i + 1}: ${cat} ${n}`);
});

for (const r of data) {
  const file = join(dist, 'proekti', r.slug, 'index.html');
  if (!existsSync(file)) { errors.push(`missing detail page ${r.slug}`); continue; }
  const html = readFileSync(file, 'utf8');
  if (!/class="g-tile[\s"]/.test(html)) errors.push(`${r.slug}: no gallery tile, a phone shows no photo of this project`);

  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .find((o) => o['@type'] === 'CreativeWork');
  if (!ld) { errors.push(`${r.slug}: no CreativeWork JSON-LD`); continue; }
  if (ld.genre !== r.category) errors.push(`${r.slug}: JSON-LD genre ${ld.genre} != ${r.category}`);
  if (ld.image && !/^https?:\/\//.test(ld.image)) errors.push(`${r.slug}: JSON-LD image is relative (${ld.image})`);
}

const summary = Object.entries(onPage).map(([c, n]) => `${c} ${n}`).join(' · ');
const uslugiSummary = uslugiParts.join(' · ');
if (errors.length) {
  console.error(`check-categories: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`check-categories: OK. /proekti: ${summary} (total ${cards.length}). /uslugi links: ${uslugiSummary}. ${data.length} detail pages: genre and absolute image OK.`);
