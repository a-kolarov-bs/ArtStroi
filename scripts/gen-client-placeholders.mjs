// Generate simple SVG placeholder logos for the Trusted-by marquee.
// Each SVG is a centered text in the brand wordmark style.
// To be replaced with real logos when the client provides them.

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'clients');
mkdirSync(OUT, { recursive: true });

const items = [
  { file: 'balchik',       text: 'БАЛЧИК',                   weight: 700, font: 'serif' },
  { file: 'yakoruda',      text: 'ЯКОРУДА',                  weight: 700, font: 'serif' },
  { file: 'zemen',         text: 'ОБЩИНА ЗЕМЕН',             weight: 600, font: 'sans-serif' },
  { file: 'novo-selo',     text: 'НОВО СЕЛО',                weight: 700, font: 'serif' },
  { file: 'rakovski',      text: 'РАКОВСКИ',                 weight: 700, font: 'serif' },
  { file: 'krichim',       text: 'КРИЧИМ',                   weight: 700, font: 'serif' },
  { file: 'aytos',         text: 'АЙТОС',                    weight: 700, font: 'serif' },
  { file: 'smolyan',       text: 'СМОЛЯН',                   weight: 700, font: 'serif' },
  { file: 'ckb',           text: 'ЦКБ',                      weight: 800, font: 'sans-serif' },
  { file: 'goethe',        text: 'GOETHE INSTITUT',          weight: 500, font: 'sans-serif' },
  { file: 'umbal-rilski',  text: 'УМБАЛ Св. Иван Рилски',    weight: 600, font: 'sans-serif' },
  { file: 'trakia-uni',    text: 'ТРАКИЙСКИ УНИВЕРСИТЕТ',    weight: 600, font: 'serif' },
  { file: 'izamet',        text: 'ИЗАМЕТ',                   weight: 700, font: 'sans-serif' },
  { file: 'stesar',        text: 'СТЕСАР',                   weight: 700, font: 'sans-serif' },
  { file: 'mountain-star', text: 'MOUNTAIN STAR',            weight: 700, font: 'sans-serif' },
];

function svg({ text, weight, font }) {
  // Approximate width: ~13px per glyph at this size
  const charWidth = 13;
  const padding = 24;
  const w = Math.max(160, text.length * charWidth + padding * 2);
  const h = 56;
  const fontFamily = font === 'serif'
    ? "Fraunces, Georgia, serif"
    : "Inter, system-ui, sans-serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  <text
    x="${w / 2}" y="${h / 2 + 1}"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="${fontFamily}"
    font-weight="${weight}"
    font-size="20"
    fill="#252E39"
    letter-spacing="${font === 'sans-serif' ? '0.04em' : '0.02em'}"
  >${text}</text>
</svg>`;
}

for (const item of items) {
  const path = join(OUT, `${item.file}.svg`);
  writeFileSync(path, svg(item), 'utf8');
}
console.log(`Wrote ${items.length} SVG placeholders → ${OUT}`);
