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
  { name: 'Автомагистрали Черно Море',  logo: '/clients/amshumen.png',     alt: 'Автомагистрали Черно Море АД', href: 'https://amshumen.com/bg/' },
  { name: 'ИСА 2000',                   logo: '/clients/isa2000.png',      alt: 'ИСА 2000 ЕООД',                href: 'https://www.isa2000.bg/' },
  { name: 'Община Раковски',            logo: '/clients/rakovski.png',     alt: 'Община Раковски',              href: 'http://www.rakovski.bg/' },
  { name: 'Запрянови-03',               logo: '/clients/zapryanovi.png',   alt: 'Запрянови-03 ООД',             href: 'http://www.zapryanovi.com/' },
  { name: 'Балкантабако / Старосел',    logo: '/clients/starosel.png',     alt: 'Балкантабако ЕООД (Старосел)', href: 'http://www.starosel.com/' },
  { name: 'Изамет',                     logo: '/clients/izamet.png',       alt: 'Изамет ООД',                   href: 'http://izamet.com/' },
  { name: 'МБАЛ Смолян',                logo: '/clients/mbal-smolyan.png', alt: 'МБАЛ Д-р Братан Шукеров',      href: 'http://mbalsmolyan.com/' },
  { name: 'Иваи Елена',                 logo: '/clients/iva-elena.png',    alt: 'Бутиков хотел Ива и Елена',    href: 'http://www.ivaielena.com/' },
  { name: 'Община Смолян',              logo: '/clients/smolyan.png',      alt: 'Община Смолян',                href: 'https://www.smolyan.bg/bg/home' },
  { name: 'Вила Алба',                  logo: '/clients/vila-alba.png',    alt: 'Вила Алба, Момчиловци',        href: 'http://www.stamb.info/' },
  { name: 'Омикс',                      logo: '/clients/omiks.png',        alt: 'Омикс ЕООД',                   href: 'http://omiks-oil.com/' },
  { name: 'Община Рудозем',             logo: '/clients/rudozem.png',      alt: 'Община Рудозем',               href: 'http://www.rudozem.bg/bg' },
  { name: 'Община Чепеларе',            logo: '/clients/chepelare.png',    alt: 'Община Чепеларе',              href: 'http://chepelare.org/' },
  { name: 'Община Айтос',               logo: '/clients/aytos.png',        alt: 'Община Айтос',                 href: 'https://aytos.bg/' },
  { name: 'Община Брезово',             logo: '/clients/brezovo.png',      alt: 'Община Брезово',               href: 'http://brezovo.bg/news.php' },
  { name: 'ЕМ Инвест',                  logo: '/clients/em-invest.png',    alt: 'ЕМ Инвест ЕООД',               href: 'http://www.em-inv.com/' },
  { name: 'Община Асеновград',          logo: '/clients/asenovgrad.png',   alt: 'Община Асеновград',            href: 'https://www.assenovgrad.com/' },
  { name: 'Община Кричим',              logo: '/clients/krichim.png',      alt: 'Община Кричим',                href: 'https://www.krichim.bg/' },
  { name: 'Община Стамболийски',        logo: '/clients/stamboliyski.png', alt: 'Община Стамболийски',          href: 'http://www.stamb.info/' },
];
