// Company JSON-LD, built only from company.ts. Unconfirmed facts
// (founding year, company registry number, ratings) are left out on purpose (rechnik §4).
import { company, phone } from './company';

const DAYS: Record<string, string> = {
  'пон.': 'Monday',
  'вт.': 'Tuesday',
  'ср.': 'Wednesday',
  'чет.': 'Thursday',
  'пет.': 'Friday',
  'съб.': 'Saturday',
  'нед.': 'Sunday',
};
const ORDER = Object.keys(DAYS);

/** „пон.–пет.“ → ['Monday', …, 'Friday']. Throws on an unknown label so a typo fails the build. */
export function dayRange(label: string): string[] {
  const [from, to = from] = label.split(/\s*[–-]\s*/);
  const a = ORDER.indexOf(from);
  const b = ORDER.indexOf(to);
  if (a < 0 || b < a) throw new Error(`schema.ts: unknown day range "${label}"`);
  return ORDER.slice(a, b + 1).map((d) => DAYS[d]);
}

/** „9:00–18:00“ → ['09:00', '18:00']. */
export function timeRange(label: string): [string, string] {
  const m = label.match(/^(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`schema.ts: unknown time range "${label}"`);
  return [`${m[1].padStart(2, '0')}:${m[2]}`, `${m[3].padStart(2, '0')}:${m[4]}`];
}

const tel = (n: string) => n.replace(/\s+/g, '');

export function organizationId(origin: string): string {
  return `${origin}/#organization`;
}

export function organizationSchema(site: URL) {
  const origin = site.origin;
  const [opens, closes] = timeRange(company.hoursTime);
  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': organizationId(origin),
    name: company.name,
    url: `${origin}/`,
    logo: `${origin}/brand/logo-original.png`,
    image: `${origin}/og-default.jpg`,
    email: company.email,
    telephone: tel(phone('Управител').number),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${company.district}, ${company.street}`,
      addressLocality: company.city,
      postalCode: company.postalCode,
      addressCountry: 'BG',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayRange(company.hoursDays),
        opens,
        closes,
      },
    ],
    contactPoint: company.phones.map((p) => ({
      '@type': 'ContactPoint',
      contactType: p.role,
      telephone: tel(p.number),
      availableLanguage: 'bg',
    })),
    ...(company.founded !== null && { foundingDate: String(company.founded) }),
  };
}
