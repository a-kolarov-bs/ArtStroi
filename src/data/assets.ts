// Images and documents from the old site (www.artstroismolian.com),
// mirrored under public/ by scripts/fetch-legacy-assets.py. The manifests
// map each old URL to its local file and pixel size.
import projectFiles from './legacy-assets/projects.json';
import sertFiles from './legacy-assets/sert.json';
import partFiles from './legacy-assets/part.json';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { VARIANT_WIDTHS, variantPath, webpSize } from './image-variants.mjs';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));

interface LocalAsset {
  path: string;
  width: number | null;
  height: number | null;
  bytes: number;
}

const byUrl: Record<string, LocalAsset> = {
  ...projectFiles.files,
  ...sertFiles.files,
  ...partFiles.files,
};
const byPath = new Map(Object.values(byUrl).map((a) => [a.path, a]));

/**
 * Local path for an old-site URL. Throws (fails the build) when the file
 * was not mirrored, so nothing silently falls back to the old host.
 */
export function localAsset(url: string): string {
  const key = url.replace('://artstroismolian.com/', '://www.artstroismolian.com/');
  const asset = byUrl[key];
  if (!asset) {
    throw new Error(`${url} is not mirrored locally; run scripts/fetch-legacy-assets.py`);
  }
  if (!existsSync(publicDir + asset.path)) {
    throw new Error(`${asset.path} is in the manifest but missing from public/; run scripts/fetch-legacy-assets.py`);
  }
  return asset.path;
}

const headerSizes = new Map<string, { width?: number; height?: number }>();

/**
 * width/height attributes for an image under public/: from the manifests for
 * mirrored files, otherwise from the WebP header (thumbnails, resized
 * copies). Empty when unknown.
 */
export function imageSize(path: string | null | undefined): { width?: number; height?: number } {
  if (!path) return {};
  const asset = byPath.get(path);
  if (asset?.width && asset.height) return { width: asset.width, height: asset.height };
  if (!headerSizes.has(path)) {
    const file = publicDir + path;
    const size = path.endsWith('.webp') && existsSync(file) ? webpSize(file) : null;
    headerSizes.set(path, size ?? {});
  }
  return headerSizes.get(path)!;
}

/**
 * `src`, `srcset`, `sizes`, `width`, `height` for a photo, using the smaller
 * copies from scripts/make-image-variants.mjs when they exist. `sizes` is the
 * width the image is drawn at (for object-cover crops, the drawn width, not
 * the box width).
 */
export function responsiveImage(
  path: string,
  sizes: string,
): { src: string; srcset?: string; sizes?: string; width?: number; height?: number } {
  const size = imageSize(path);
  const copies = VARIANT_WIDTHS.filter((w) => existsSync(publicDir + variantPath(path, w)));
  if (!copies.length || !size.width) return { src: path, ...size };
  // encodeURI: a space in a file name would split the srcset entry and void it.
  const srcset = [...copies.map((w) => `${encodeURI(variantPath(path, w))} ${w}w`), `${encodeURI(path)} ${size.width}w`].join(', ');
  return { src: path, srcset, sizes, ...size };
}
