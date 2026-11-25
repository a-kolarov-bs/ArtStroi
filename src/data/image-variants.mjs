// Shared by src/data/assets.ts (build) and scripts/make-image-variants.mjs.
import { readFileSync } from 'node:fs';

/** Widths of the smaller copies made for project photos. */
export const VARIANT_WIDTHS = /** @type {const} */ ([640, 1024]);

/**
 * Path of the copy of `path` that is `width` pixels wide.
 * @param {string} path
 * @param {number} width
 */
export const variantPath = (path, width) => path.replace(/\.webp$/, `-${width}w.webp`);

/** @param {string} path */
export const isVariant = (path) => /-\d+w\.webp$/.test(path);

/**
 * Pixel size from a WebP file header, or null when the file is not WebP.
 * @param {string} file absolute path
 * @returns {{ width: number; height: number } | null}
 */
export function webpSize(file) {
  const b = readFileSync(file);
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = b.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  return null;
}
