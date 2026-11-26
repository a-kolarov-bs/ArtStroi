// Single source of truth for company facts shown anywhere on the site.
// Values come from the migrated content in CLAUDE.md / docs/rechnik.md.
// Unconfirmed facts are `null`; every consumer hides the dependent text
// while a value is `null` and shows the same value everywhere once set.

export interface CompanyPhone {
  role: string;
  /** Short role label for tight layouts. */
  roleShort: string;
  number: string;
}

export interface Company {
  name: string;
  shortName: string;
  postalCode: string;
  city: string;
  district: string;
  street: string;
  email: string;
  hoursDays: string;
  hoursTime: string;
  phones: CompanyPhone[];
  /** Year of founding. `null` until the client confirms it (rechnik §4). */
  founded: number | null;
  /** ЦПРС groups, e.g. ['I', 'II']. `null` until the client confirms them. */
  cprsGroups: string[] | null;
  /** Completed projects in total, shown as „150+“ (owner, 26.11.2026). Not
   *  the number of projects listed on the site: that is `projects.length`. */
  completedProjects: number;
  /** Years of experience, shown as „22+“ (owner, 26.11.2026). */
  yearsExperience: number;
}

export const company: Company = {
  name: 'АРТСТРОЙ ООД',
  shortName: 'АРТСТРОЙ',
  postalCode: '4700',
  city: 'Смолян',
  district: 'кв. Устово',
  street: 'ул. „Хаджи Иван Бечев“ №6',
  email: 'artstroismolian@abv.bg',
  hoursDays: 'пон.–пет.',
  hoursTime: '9:00–18:00',
  phones: [
    { role: 'Управител', roleShort: 'Управител', number: '+359 878 715 936' },
    { role: 'Счетоводство', roleShort: 'Счетоводство', number: '+359 878 715 935' },
    { role: 'Технически директор', roleShort: 'Тех. директор', number: '+359 877 766 523' },
    { role: 'Транспорт', roleShort: 'Транспорт', number: '+359 878 986 797' },
  ],
  founded: null,
  cprsGroups: null,
  completedProjects: 150,
  yearsExperience: 22,
};

/** „гр. Смолян 4700, кв. Устово, ул. „Хаджи Иван Бечев“ №6“ */
export const fullAddress = `гр. ${company.city} ${company.postalCode}, ${company.district}, ${company.street}`;

/** Query string for map embeds and Google Maps links. */
export const mapQuery = `${company.street}, ${company.district}, ${company.city} ${company.postalCode}, България`;

/** Years since founding, or `null` while `founded` is unconfirmed. */
export function yearsActive(now: Date = new Date()): number | null {
  return company.founded === null ? null : now.getFullYear() - company.founded;
}

/** `tel:` href for a display-formatted number. */
export function telHref(number: string): string {
  return `tel:${number.replace(/\s+/g, '')}`;
}

/** Phone by role (exact match on `role`). Throws if missing so typos fail the build. */
export function phone(role: string): CompanyPhone {
  const p = company.phones.find((x) => x.role === role);
  if (!p) throw new Error(`company.ts: no phone for role "${role}"`);
  return p;
}

/** „I · II · IV група“ or `null`. */
export function cprsGroupsLabel(): string | null {
  return company.cprsGroups && company.cprsGroups.length > 0
    ? `${company.cprsGroups.join(' · ')} група`
    : null;
}
