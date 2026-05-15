import legacy from './legacy-projects.json';

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

// Locally-hosted assets for projects whose imagery has been brought in-house.
// When present, these override the legacy artstroismolian.com URLs.
const LOCAL_ASSETS: Record<number, { cover: string; gallery: string[] }> = {
  1: {
    cover: '/projects/1/cover.jpg',
    // Temporary seed — 20 entries cycling the 4 local files until the client
    // delivers real imagery. Repetition is intentional; it lets us preview
    // the gallery slider behaviour at production-scale image counts.
    gallery: Array.from({ length: 20 }, (_, i) =>
      `/projects/1/${['1a', '1b', '1c', '1d'][i % 4]}.jpg`
    ),
  },
};

function fromLegacy(r: LegacyRecord): Project {
  const local = LOCAL_ASSETS[r.id];
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    location: r.location,
    client: r.client,
    scope: r.scope,
    description: r.description,
    coverImageUrl: local?.cover ?? r.cover_image_url,
    galleryImageUrls: local?.gallery ?? r.gallery_image_urls,
    mapEmbedUrl: r.map_embed_url ?? null,
    partnerUrl: r.partner_url ?? null,
    partnerLogoUrl: r.partner_logo_url ?? null,
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
// FAKE DATA WARNING: values below are placeholders so the section
// can be visually tested before the client supplies real Акт 16
// dates, permit refs, gross-area numbers, etc. Replace per project.

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

const PROJECT_PROTOCOLS: Record<number, ProjectProtocol> = {
  1: {
    metrics: [
      { value: '2 400', label: 'm² РЗП' },
      { value: '16', label: 'месеца', sublabel: 'срок' },
      { value: '32', label: 'стаи' },
    ],
    records: [
      { label: 'Акт 16', value: 'XII.2020' },
      { label: 'Гаранция', value: 'до 2030' },
    ],
  },
};

export function getProtocol(project: Project): ProjectProtocol | null {
  return PROJECT_PROTOCOLS[project.id] ?? null;
}
