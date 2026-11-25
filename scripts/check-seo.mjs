#!/usr/bin/env node
// Checks every built page in dist/ for the SEO basics:
//   1. <title> ends with „— АРТСТРОЙ ООД“ (optionally „, <city>…“), or is the home title;
//   2. meta description present, at most 160 characters; titles and
//      descriptions unique across pages;
//   3. canonical present and equal to og:url (except 404, which is noindex);
//   4. og:image and twitter:image are absolute and the file exists in dist/;
//      twitter:card = summary_large_image;
//   5. every JSON-LD block parses; exactly one GeneralContractor with name,
//      address, telephone, email, opening hours, url, logo, image, and no
//      foundingDate / taxID / vatID / aggregateRating (unconfirmed facts);
//   6. 404.html has noindex and links to /proekti/ and /kontakti/;
//   7. robots.txt points at a sitemap file that exists.
// Usage: node scripts/check-seo.mjs [distDir]   (runs as postbuild)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const errors = [];
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === '_astro' ? [] : htmlFiles(p);
    return name.endsWith('.html') ? [p] : [];
  });
}

const meta = (html, attr, key) => {
  const m = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
  return m ? decode(m[1]) : null;
};

const company = 'АРТСТРОЙ ООД';
const pages = htmlFiles(dist);
let checked = 0;
let ldBlocks = 0;
const seenTitle = new Map();
const seenDesc = new Map();
const dup = (map, key, rel, what) => {
  if (map.has(key)) errors.push(`${rel}: same ${what} as ${map.get(key)}`);
  else map.set(key, rel);
};

for (const file of pages) {
  const rel = relative(dist, file);
  const html = readFileSync(file, 'utf8');
  const err = (msg) => errors.push(`${rel}: ${msg}`);
  const is404 = rel === '404.html';
  checked++;

  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '');
  dup(seenTitle, title, rel, 'title');
  if (!title) err('no <title>');
  else if (rel !== 'index.html' && !new RegExp(` — ${company}(, [^—]+)?$`).test(title))
    err(`title not in the form „<Страница> — ${company}“: ${title}`);

  const desc = meta(html, 'name', 'description');
  if (desc) dup(seenDesc, desc, rel, 'description');
  if (!desc) err('no meta description');
  else if (desc.length > 160) err(`description ${desc.length} chars (> 160)`);

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;
  const robots = meta(html, 'name', 'robots');
  if (is404) {
    if (!robots || !robots.includes('noindex')) err('404 without noindex');
    if (canonical) err('404 must not have a canonical');
    if (!/href="\/proekti\/"/.test(html) || !/href="\/kontakti\/"/.test(html)) err('404 without links to /proekti/ and /kontakti/');
  } else {
    if (robots && robots.includes('noindex')) err('indexable page has noindex');
    if (!canonical) err('no canonical');
    else if (canonical !== meta(html, 'property', 'og:url')) err('og:url differs from canonical');
  }

  if (meta(html, 'name', 'twitter:card') !== 'summary_large_image') err('twitter:card is not summary_large_image');
  for (const [attr, key] of [['property', 'og:image'], ['name', 'twitter:image']]) {
    const v = meta(html, attr, key);
    if (!v || !/^https?:\/\//.test(v)) { err(`${key} missing or not absolute: ${v}`); continue; }
    const local = join(dist, decodeURIComponent(new URL(v).pathname));
    if (!existsSync(local)) err(`${key} file missing in dist: ${new URL(v).pathname}`);
  }

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const orgs = [];
  for (const raw of blocks) {
    ldBlocks++;
    let data;
    try { data = JSON.parse(raw); } catch (e) { err(`JSON-LD does not parse: ${e.message}`); continue; }
    if (data['@context'] !== 'https://schema.org') err(`JSON-LD without schema.org @context (${data['@type']})`);
    if (data['@type'] === 'GeneralContractor') orgs.push(data);
  }
  if (orgs.length !== 1) { err(`expected 1 GeneralContractor JSON-LD, found ${orgs.length}`); continue; }
  const o = orgs[0];
  for (const k of ['@id', 'name', 'url', 'logo', 'image', 'telephone', 'email', 'address', 'openingHoursSpecification'])
    if (!o[k] || (Array.isArray(o[k]) && o[k].length === 0)) err(`GeneralContractor without ${k}`);
  for (const k of ['foundingDate', 'taxID', 'vatID', 'aggregateRating', 'review'])
    if (k in o) err(`GeneralContractor has unconfirmed ${k}`);
  for (const k of ['streetAddress', 'addressLocality', 'postalCode', 'addressCountry'])
    if (!o.address?.[k]) err(`address without ${k}`);
  for (const k of ['url', 'logo', 'image'])
    if (o[k] && !/^https?:\/\//.test(o[k])) err(`GeneralContractor ${k} not absolute`);
  const h = o.openingHoursSpecification?.[0];
  if (!h?.dayOfWeek?.length || !/^\d\d:\d\d$/.test(h.opens ?? '') || !/^\d\d:\d\d$/.test(h.closes ?? ''))
    err('opening hours incomplete');
  for (const k of ['logo', 'image']) {
    if (o[k] && !existsSync(join(dist, new URL(o[k]).pathname))) err(`GeneralContractor ${k} file missing in dist`);
  }
}

const robotsTxt = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : '';
const sitemap = robotsTxt.match(/^Sitemap: (\S+)$/m)?.[1];
if (!sitemap) errors.push('robots.txt: no Sitemap line');
else if (!existsSync(join(dist, new URL(sitemap).pathname))) errors.push(`robots.txt: ${sitemap} not in dist`);
if (!existsSync(join(dist, '404.html'))) errors.push('dist/404.html missing');

if (errors.length) {
  console.error(`check-seo: ${errors.length} problem(s)\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`check-seo: OK. ${checked} pages, ${ldBlocks} JSON-LD blocks parsed, robots.txt → ${sitemap}.`);
