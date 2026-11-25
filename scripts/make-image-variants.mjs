// Smaller copies of the project photos for `srcset`.
//
// For every public/projects/**/<name>.webp that is wide enough, writes
// <name>-640w.webp and <name>-1024w.webp next to it (cwebp, quality 78).
// src/data/assets.ts (responsiveImage) picks up whichever copies exist.
// Existing copies are kept, so the script is safe to re-run after new
// photos are added.
//
// Usage: node scripts/make-image-variants.mjs [--check]
//   --check  only list missing copies; exit 1 when any are missing.
// Needs `cwebp` (brew install webp).
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { webpSize, VARIANT_WIDTHS, variantPath, isVariant } from '../src/data/image-variants.mjs';

const root = fileURLToPath(new URL('../public', import.meta.url));
const checkOnly = process.argv.includes('--check');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.webp') && !isVariant(p)) yield p;
  }
}

let made = 0;
let missing = 0;
for (const file of walk(join(root, 'projects'))) {
  const size = webpSize(file);
  if (!size) continue;
  for (const w of VARIANT_WIDTHS) {
    if (size.width < w * 1.15) continue; // too close to the original to be worth a copy
    const out = variantPath(file, w);
    if (existsSync(out)) continue;
    missing++;
    if (checkOnly) {
      console.log(`missing ${out.slice(root.length)}`);
      continue;
    }
    execFileSync('cwebp', ['-quiet', '-q', '78', '-m', '6', '-resize', String(w), '0', file, '-o', out]);
    made++;
  }
}
console.log(checkOnly ? `make-image-variants: ${missing} missing` : `make-image-variants: ${made} written`);
if (checkOnly && missing) process.exit(1);
