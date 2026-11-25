// Meta description for a project page.
//
// Rule (checked on every page by scripts/check-seo.mjs): the description
// never repeats a run of 4+ words from the page title. Google already shows
// the title above it, so the description spends its ~155 characters on what
// the title does not say: what was done, for whom, by whom.
//
// Formula: „<project text without the title words>. Възложител: X. Изпълнител: АРТСТРОЙ ООД.“
// When the project text has nothing new, the scope of works takes its place.
import { company } from './company';

export const META_MAX = 155;

/** Lowercase words, punctuation and quotes dropped. */
export function words(s: string): string[] {
  return s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function grams(ws: string[], n = 4): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + n <= ws.length; i++) out.add(ws.slice(i, i + n).join(' '));
  return out;
}

/** True when `text` contains a run of `n` words that also appears in `title`. */
export function repeatsTitle(text: string, title: string, n = 4): boolean {
  const t = grams(words(title), n);
  for (const g of grams(words(text), n)) if (t.has(g)) return true;
  return false;
}

// Short lowercase tokens ending in a dot are abbreviations („гр.“, „с.“, „кв.“, „м.“, „ж.к.“).
const isAbbr = (tok: string) => /^[\p{Ll}.-]{1,4}\.$/u.test(tok) || /^(№|бл\.|ап\.)$/u.test(tok);
const DANGLING = new Set(['на', 'в', 'във', 'и', 'с', 'със', 'от', 'по', 'за', 'до', 'към', 'при', 'а', '–', '-', '№']);

/** Splits into sentences on „. “ unless the dot ends an abbreviation. */
function sentences(text: string): string[] {
  const toks = text.replace(/\s+/g, ' ').trim().split(' ');
  const out: string[] = [];
  let cur: string[] = [];
  toks.forEach((tok, i) => {
    cur.push(tok);
    const next = toks[i + 1];
    if (/[.!?]$/.test(tok) && !isAbbr(tok) && next && /^[\p{Lu}„"(]/u.test(next)) {
      out.push(cur.join(' '));
      cur = [];
    }
  });
  if (cur.length) out.push(cur.join(' '));
  return out;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const endSentence = (s: string) => s.replace(/[\s,;:–-]+$/, '').replace(/([^.!?…])$/, '$1.');

const startsDangling = (s: string) => DANGLING.has(words(s)[0] ?? '');

/** Drops the title words (4+) from the start of a sentence; null if what is left
    is too short or starts with a preposition („На един етаж.“). */
function withoutTitlePrefix(sentence: string, title: string): string | null {
  const tw = words(title);
  const toks = sentence.split(' ');
  let matched = 0;
  let cut = 0;
  for (let i = 0; i < toks.length && matched < tw.length; i++) {
    const tokWords = words(toks[i]);
    if (tokWords.length === 0) { cut = i + 1; continue; }
    if (tokWords.every((w, k) => tw[matched + k] === w)) {
      matched += tokWords.length;
      cut = i + 1;
    } else break;
  }
  if (matched < 4) return sentence;
  const rest = toks.slice(cut).join(' ').replace(/^[\s,;:–-]+/, '');
  return words(rest).length >= 3 && !startsDangling(rest) ? capitalize(rest) : null;
}

/** Keeps the part of a sentence before the first 4-word run shared with the
    title („… видеонаблюдение на Спортен комплекс Горна Малина“ → „… видеонаблюдение…“);
    null when fewer than 4 words come before it. */
function beforeTitleRun(sentence: string, title: string): string | null {
  const t = grams(words(title));
  const toks = sentence.split(' ');
  const flat: { w: string; tok: number }[] = [];
  toks.forEach((tok, i) => words(tok).forEach((w) => flat.push({ w, tok: i })));
  for (let i = 0; i + 4 <= flat.length; i++) {
    if (!t.has(flat.slice(i, i + 4).map((x) => x.w).join(' '))) continue;
    const keep = toks.slice(0, flat[i].tok);
    while (keep.length && DANGLING.has(words(keep[keep.length - 1]).join(' '))) keep.pop();
    const text = keep.join(' ').replace(/[\s,;:–-]+$/, '');
    return words(text).length >= 4 ? `${text}…` : null;
  }
  return sentence;
}

/** Cuts to `max` characters at a sentence end, else at a word, never after an abbreviation or a preposition. */
export function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const s = sentences(text);
  let acc = '';
  for (const x of s) {
    const next = acc ? `${acc} ${x}` : x;
    if (next.length > max) break;
    acc = next;
  }
  if (acc.length >= max * 0.6) return acc;
  const toks = text.slice(0, max - 1).split(' ');
  toks.pop(); // the last token may be cut mid-word
  while (toks.length) {
    const last = toks[toks.length - 1].replace(/[,;:]+$/, '');
    if (isAbbr(last) || DANGLING.has(last.toLowerCase()) || last === '') toks.pop();
    else break;
  }
  return toks.join(' ').replace(/[\s,;:.–-]+$/, '') + '…';
}

export interface MetaProject {
  description: string | null;
  client: string | null;
  scope: string | null;
  location: string | null;
  category: string;
}

export function projectMetaDescription(p: MetaProject, title: string, max = META_MAX): string {
  const tail: string[] = [];
  const client = p.client?.trim();
  // The client is left out when the title already names it („Рентгенов кабинет МБАЛ …“).
  if (client && !/^частно лице$/i.test(client) && !repeatsTitle(client, title, 3))
    tail.push(`Възложител: ${client}.`);
  tail.push(`Изпълнител: ${company.name}.`);
  let tailText = tail.join(' ');

  const kept: string[] = [];
  for (const s of sentences(p.description ?? '')) {
    let x = withoutTitlePrefix(s, title);
    if (x && repeatsTitle(x, title)) x = beforeTitleRun(x, title);
    if (x && !repeatsTitle(x, title)) kept.push(endSentence(x));
    if (x?.endsWith('…')) break; // the rest of the text follows a cut
  }
  // Fallbacks when the project text only repeats the title.
  const scope = p.scope ? `Дейности: ${p.scope.replace(/[\s,]+$/, '')}.` : '';
  const lead = kept.join(' ')
    || (scope && !repeatsTitle(scope, title) ? scope : '')
    || `${p.category}.`;

  // The place goes in when it says more than the title and still fits whole.
  const place = p.location?.trim();
  if (place && words(place).some((w) => !words(title).includes(w))) {
    const withPlace = `Място: ${endSentence(place)} ${tailText}`;
    if (lead.length + 1 + withPlace.length <= max && !repeatsTitle(withPlace, title)) tailText = withPlace;
  }
  return `${cut(lead, max - tailText.length - 1)} ${tailText}`;
}
