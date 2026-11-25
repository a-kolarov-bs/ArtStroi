#!/usr/bin/env node
// Guards the "scoped class on a component" bug class (round 1, В1).
//
// Astro scopes a page's <style> to elements rendered by that page
// (`.us-card[data-astro-cid-…]`). A class passed to a child component such as
// `<Reveal class="us-card">` lands on an element rendered by the child, which
// carries the child's cid, so the page's rules silently never apply.
//
// Rule: classes defined in a file's scoped <style> are never passed to a
// component tag (<Capitalised …>). Put them on an inner element instead:
//   <Reveal as="li" class="relative"><div class="us-card">…</div></Reveal>
// Only Tailwind utilities (global) go through a component's `class`.
//
// Usage: node scripts/check-scoped-class.mjs [dir=src]   (exit 1 on violation)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] ?? 'src';

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.astro')) yield p;
  }
}

function scopedClasses(src) {
  const out = new Set();
  const styleRe = /<style([^>]*)>([\s\S]*?)<\/style>/g;
  for (const [, attrs, body] of src.matchAll(styleRe)) {
    if (/is:global/.test(attrs)) continue;
    const css = body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/:global\((?:[^()]|\([^()]*\))*\)/g, '')
      .replace(/theme\([^)]*\)/g, '')
      .replace(/url\([^)]*\)/g, '')
      .replace(/(["'])(?:(?!\1).)*\1/g, '');
    // only selector parts (before each `{`)
    for (const [, sel] of css.matchAll(/([^{}]+)\{/g)) {
      if (sel.trim().startsWith('@')) continue;
      for (const [, cls] of sel.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) out.add(cls);
    }
  }
  return out;
}

function componentClassTokens(src) {
  const blank = (s) => s.replace(/[^\n]/g, ' '); // keep line numbers
  const markup = src.replace(/<style[\s\S]*?<\/style>/g, blank).replace(/<script[\s\S]*?<\/script>/g, blank);
  // Only imported components; `const Tag = 'li'` style dynamic HTML tags are
  // real elements and do get the file's cid.
  const imported = new Set(
    [...src.matchAll(/^\s*import\s+([A-Z]\w*)\s+from\s+['"][^'"]+['"]/gm)].map((m) => m[1]),
  );
  const res = [];
  const tagRe = /<([A-Z][\w.]*)\b((?:[^>{}]|\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*)>/g;
  for (const m of markup.matchAll(tagRe)) {
    const [, tag, attrs] = m;
    if (!imported.has(tag.split('.')[0])) continue;
    const line = markup.slice(0, m.index).split('\n').length;
    const strings = [];
    for (const [, v] of attrs.matchAll(/\bclass="([^"]*)"/g)) strings.push(v);
    // class={…} and class:list={…}: every string / template literal inside
    // the expression (template `${…}` holes are dropped, the static text kept).
    for (const [, v] of attrs.matchAll(/\bclass(?::list)?=\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
      const expr = v.replace(/\$\{[^{}]*\}/g, ' ');
      for (const [, , s] of expr.matchAll(/(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g)) strings.push(s);
    }
    for (const s of strings) for (const tok of s.split(/\s+/).filter(Boolean)) res.push({ tag, tok, line });
  }
  return res;
}

let bad = 0;
for (const file of walk(root)) {
  const src = readFileSync(file, 'utf8');
  const scoped = scopedClasses(src);
  if (!scoped.size) continue;
  for (const { tag, tok, line } of componentClassTokens(src)) {
    if (scoped.has(tok)) {
      bad++;
      console.error(`${relative(process.cwd(), file)}:~${line}  <${tag} class="${tok}">  — scoped class passed to a component; move it to an inner element`);
    }
  }
}
if (bad) {
  console.error(`\ncheck-scoped-class: ${bad} violation(s).`);
  process.exit(1);
}
console.log('check-scoped-class: OK');
