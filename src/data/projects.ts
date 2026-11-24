import legacy from './legacy-projects.json';
import { localAsset } from './assets';

export interface Project {
  id: number;
  slug: string;
  title: string;
  location: string | null;
  client: string | null;
  scope: string | null;
  description: string | null;
  coverImageUrl: string | null;
  galleryImageUrls: string[];
  mapEmbedUrl: string | null;
  partnerUrl: string | null;
  partnerLogoUrl: string | null;
  featured?: boolean;
}

interface LegacyRecord {
  id: number;
  slug: string;
  title: string;
  location: string | null;
  client: string | null;
  scope: string | null;
  description: string | null;
  cover_image_url: string | null;
  gallery_image_urls: string[];
  map_embed_url?: string | null;
  partner_url?: string | null;
  partner_logo_url?: string | null;
}

const FEATURED_IDS = new Set([1, 7, 5, 3, 8, 14, 41, 53]);

// The legacy record keeps the old-site image URLs as data; every one is
// served from our own copy under public/ (see ./assets).
function fromLegacy(r: LegacyRecord): Project {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    location: r.location,
    client: r.client,
    scope: r.scope,
    description: r.description,
    coverImageUrl: r.cover_image_url ? localAsset(r.cover_image_url) : null,
    galleryImageUrls: r.gallery_image_urls.map(localAsset),
    mapEmbedUrl: r.map_embed_url ?? null,
    partnerUrl: r.partner_url ?? null,
    partnerLogoUrl: r.partner_logo_url ? localAsset(r.partner_logo_url) : null,
    featured: FEATURED_IDS.has(r.id),
  };
}

export const projects: Project[] = (legacy as LegacyRecord[]).map(fromLegacy);

export const featuredProjects: Project[] = projects.filter((p) => p.featured);

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

// ─── Categories ──────────────────────────────────────────────────
// Legacy data has no category field; we derive one from the title
// using ordered keyword matching (most specific rules first).

export type ProjectCategory =
  | 'Жилищни сгради'
  | 'Инфраструктура'
  | 'Обществени сгради'
  | 'Паркове и детски площадки';

export const projectCategories: ProjectCategory[] = [
  'Жилищни сгради',
  'Инфраструктура',
  'Обществени сгради',
  'Паркове и детски площадки',
];

export function getCategory(p: Project): ProjectCategory {
  const t = p.title.toLowerCase();
  // Most specific keyword groups first.
  if (/площад|парк |зона за отдих|фонтан|чарши|детска площадка/.test(t))
    return 'Паркове и детски площадки';
  if (/улиц|тротоар|свлачище|подпорни|корекци|речно корит|тец|бензино/.test(t))
    return 'Инфраструктура';
  if (/жилищн|къща|вила|сити хоум/.test(t)) return 'Жилищни сгради';
  return 'Обществени сгради';
}

// ─── Project Protocol (technical sheet) ──────────────────────────
// Premium "ПРОТОКОЛ" band shown between hero and gallery on the
// detail page. Metrics are the 3-4 big numerical callouts; records
// are the smaller monospaced document references below. All values
// are strings (already formatted for display).
//
// Only real, client-confirmed data goes here (rechnik §4). A project
// without an entry shows no protocol section, no year in the running
// head and no metrics in its meta description / JSON-LD.

export interface ProtocolMetric {
  value: string;
  label: string;
  sublabel?: string;
}

export interface ProtocolRecord {
  label: string;
  value: string;
}

export interface ProjectProtocol {
  metrics: ProtocolMetric[];
  records: ProtocolRecord[];
}

const PROJECT_PROTOCOLS: Record<number, ProjectProtocol> = {};

export function getProtocol(project: Project): ProjectProtocol | null {
  return PROJECT_PROTOCOLS[project.id] ?? null;
}
