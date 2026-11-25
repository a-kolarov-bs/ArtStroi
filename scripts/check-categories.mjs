#!/usr/bin/env node
// Checks the built site (dist/) against the explicit project categories in
// src/data/legacy-projects.json:
//   1. every record has one of the categories offered as chips on /proekti;
//   2. the number of cards per category on /proekti equals the data;
//   3. every "N проекта в архива" link on /uslugi says the same N as the
//      /proekti?cat=X filter it opens;
//   4. every project detail page names its category in JSON-LD and the
//      JSON-LD image is an absolute URL.
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

const uslugi = readFileSync(join(dist, 'uslugi/index.html'), 'utf8');
const links = [...uslugi.matchAll(/href="\/proekti\?cat=([^"]+)"[^>]*>\s*<span[^>]*>(\d+) (реализиран обект|реализирани обекта)<\/span>/g)];
if (links.length === 0) errors.push('/uslugi: no "N реализирани обекта" links found');
// The index at the top of /uslugi repeats the same numbers, in card order.
const indexCounts = [...uslugi.matchAll(/us-index__count[^>]*>\s*(\d+)\s*</g)].map((m) => m[1]);
if (indexCounts.join() !== links.map((l) => l[2]).join())
  errors.push(`/uslugi index counts ${indexCounts.join()} != card links ${links.map((l) => l[2]).join()}`);
for (const [, rawCat, n] of links) {
  const cat = decodeURIComponent(decode(rawCat));
  if (Number(n) !== (onPage[cat] ?? 0))
    errors.push(`/uslugi says ${n} for ${cat}, /proekti?cat=${cat} shows ${onPage[cat] ?? 0}`);
}

for (const r of data) {
  const file = join(dist, 'proekti', r.slug, 'index.html');
  if (!existsSync(file)) { errors.push(`missing detail page ${r.slug}`); continue; }
  const html = readFileSync(file, 'utf8');
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]))
    .find((o) => o['@type'] === 'CreativeWork');
  if (!ld) { errors.push(`${r.slug}: no CreativeWork JSON-LD`); continue; }
  if (ld.genre !== r.category) errors.push(`${r.slug}: JSON-LD genre ${ld.genre} != ${r.category}`);
  if (ld.image && !/^https?:\/\//.test(ld.image)) errors.push(`${r.slug}: JSON-LD image is relative (${ld.image})`);
}

const summary = Object.entries(onPage).map(([c, n]) => `${c} ${n}`).join(' · ');
const uslugiSummary = links.map(([, c, n]) => `${decodeURIComponent(decode(c))} ${n}`).join(' · ');
if (errors.length) {
  console.error(`check-categories: ${errors.length} problem(s)`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`check-categories: OK. /proekti: ${summary} (total ${cards.length}). /uslugi links: ${uslugiSummary}. ${data.length} detail pages: genre and absolute image OK.`);
