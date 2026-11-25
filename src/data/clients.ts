export interface Client {
  name: string;
  logo: string;
  alt: string;
  href?: string;
}

// Лога на партньорите — извлечени от https://www.artstroismolian.com/partners.html
// Бели фонове са премахнати програмно (scripts/bg-remove.py).
// Вертикалните гради по фирмени бранд-цветове са запазени (Изамет, ЕМ Инвест и др.).
export const clients: Client[] = [
  { name: 'Автомагистрали Черно Море',  logo: '/clients/amshumen.webp',     alt: 'Автомагистрали Черно Море АД', href: 'https://amshumen.com/bg/' },
  { name: 'ИСА 2000',                   logo: '/clients/isa2000.webp',      alt: 'ИСА 2000 ЕООД',                href: 'https://www.isa2000.bg/' },
  { name: 'Община Раковски',            logo: '/clients/rakovski.webp',     alt: 'Община Раковски',              href: 'http://www.rakovski.bg/' },
  { name: 'Запрянови-03',               logo: '/clients/zapryanovi.webp',   alt: 'Запрянови-03 ООД',             href: 'http://www.zapryanovi.com/' },
  { name: 'Балкантабако / Старосел',    logo: '/clients/starosel.webp',     alt: 'Балкантабако ЕООД (Старосел)', href: 'http://www.starosel.com/' },
  { name: 'Изамет',                     logo: '/clients/izamet.webp',       alt: 'Изамет ООД',                   href: 'http://izamet.com/' },
  { name: 'МБАЛ Смолян',                logo: '/clients/mbal-smolyan.webp', alt: 'МБАЛ Д-р Братан Шукеров',      href: 'http://mbalsmolyan.com/' },
  { name: 'Ива и Елена',                logo: '/clients/iva-elena.webp',    alt: 'Бутиков хотел Ива и Елена',    href: 'http://www.ivaielena.com/' },
  { name: 'Община Смолян',              logo: '/clients/smolyan.webp',      alt: 'Община Смолян',                href: 'https://www.smolyan.bg/bg/home' },
  { name: 'Вила Алба',                  logo: '/clients/vila-alba.webp',    alt: 'Вила Алба, Момчиловци' },
  { name: 'Омикс',                      logo: '/clients/omiks.webp',        alt: 'Омикс ЕООД',                   href: 'http://omiks-oil.com/' },
  { name: 'Община Рудозем',             logo: '/clients/rudozem.webp',      alt: 'Община Рудозем',               href: 'http://www.rudozem.bg/bg' },
  { name: 'Община Чепеларе',            logo: '/clients/chepelare.webp',    alt: 'Община Чепеларе',              href: 'http://chepelare.org/' },
  { name: 'Община Айтос',               logo: '/clients/aytos.webp',        alt: 'Община Айтос',                 href: 'https://aytos.bg/' },
  { name: 'Община Брезово',             logo: '/clients/brezovo.webp',      alt: 'Община Брезово',               href: 'http://brezovo.bg/news.php' },
  { name: 'ЕМ Инвест',                  logo: '/clients/em-invest.webp',    alt: 'ЕМ Инвест ЕООД',               href: 'http://www.em-inv.com/' },
  { name: 'Община Асеновград',          logo: '/clients/asenovgrad.webp',   alt: 'Община Асеновград',            href: 'https://www.assenovgrad.com/' },
  { name: 'Община Кричим',              logo: '/clients/krichim.webp',      alt: 'Община Кричим',                href: 'https://www.krichim.bg/' },
  { name: 'Община Стамболийски',        logo: '/clients/stamboliyski.webp', alt: 'Община Стамболийски',          href: 'http://www.stamb.info/' },
];
