#!/usr/bin/env node
// Every Tailwind class with an opacity step (`text-white/72`, `group-hover:bg-white/12`)
// used in the built pages must have a rule in the built CSS. A step that is
// neither a Tailwind default nor in tailwind.config.ts `opacity` silently
// produces no CSS (the colour falls back, the gradient disappears).
// Usage: node scripts/check-opacity.mjs [distDir]   (runs as postbuild)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(dist);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8')).join('\n')
  + files.filter((f) => f.endsWith('.html')).map((f) => [...readFileSync(f, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')).join('\n');

const used = new Map(); // class -> first page
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(f, 'utf8');
  for (const [, attr] of html.matchAll(/\sclass="([^"]*)"/g)) {
    for (const c of attr.split(/\s+/)) {
      // colour/opacity utilities only: `<prefix>-<colour>/<step>`, not fractions like -translate-y-1/2
      if (!/^(?:[a-z-]+:)*-?[a-z]+(?:-[a-z]+)*-[a-z0-9]+\/\d+$/.test(c)) continue;
      if (/(?:^|:)-?(?:translate-[xy]|w|h|size|inset(?:-[xy])?|top|left|right|bottom|basis|start|end)-\d+\/\d+$/.test(c)) continue;
      if (!used.has(c)) used.set(c, f.slice(dist.length + 1));
    }
  }
}
const esc = (c) => c.replace(/([:/.\[\]])/g, '\\$1');
const missing = [...used].filter(([c]) => !css.includes('.' + esc(c)));
if (missing.length) {
  console.error(`check-opacity: ${missing.length} class(es) without CSS (add the step to tailwind.config.ts opacity):`);
  for (const [c, page] of missing) console.error(`  - ${c} (${page})`);
  process.exit(1);
}
console.log(`check-opacity: OK. ${used.size} colour/opacity classes, all in the CSS.`);
