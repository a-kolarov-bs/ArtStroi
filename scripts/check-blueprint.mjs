#!/usr/bin/env node
// One strength for the blueprint backdrop on the whole site (round 2, task 14).
// The line strength lives in public/blueprint/sheet.svg and sheet-dark.svg.
// A .bp-sheet layer must not carry its own opacity utility, which is how the
// backdrop faded to invisible in round 1 (5% lines × 7–18% layers).
//
// Usage: node scripts/check-blueprint.mjs [dir=src]   (exit 1 on violation)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'src';
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.astro')) yield p;
  }
}

let bad = 0;
for (const file of walk(root)) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/class(?::list)?=["{][^"}]*\bbp-sheet\b[^"}]*["}]/g)) {
      if (/\bopacity-/.test(m[0])) {
        console.error(`${file}:${i + 1}: opacity utility on a .bp-sheet layer: ${m[0]}`);
        bad++;
      }
    }
  });
}
if (bad) {
  console.error(`\n${bad} violation(s). The blueprint strength is set in public/blueprint/sheet*.svg only.`);
  process.exit(1);
}
console.log('check-blueprint: ok');
