// Images and documents from the old site (www.artstroismolian.com),
// mirrored under public/ by scripts/fetch-legacy-assets.py. The manifests
// map each old URL to its local file and pixel size.
import projectFiles from './legacy-assets/projects.json';
import sertFiles from './legacy-assets/sert.json';
import partFiles from './legacy-assets/part.json';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

/** width/height attributes for a mirrored image (empty when unknown). */
export function imageSize(path: string | null | undefined): { width?: number; height?: number } {
  const asset = path ? byPath.get(path) : undefined;
  return asset?.width && asset.height ? { width: asset.width, height: asset.height } : {};
}
