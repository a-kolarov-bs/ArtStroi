# CLAUDE.md

Контекст за Claude Code при работа по този проект.

## Какво е това

Модерен редизайн на корпоративния сайт на **АРТСТРОЙ ООД** (Смолян) — строителна компания. Оригиналният сайт: https://www.artstroismolian.com/ (WordPress/Enfold от 2018, LayerSlider).

## Главна цел

Създай **уникален премиум дизайн за строителна фирма**, не generic template. Всяко визуално решение трябва да подсилва усещането за стабилност, мащаб, инженерна прецизност, доверие и висок клас изпълнение.

При всяка задача пази фокуса:
- премиум строителен бранд, не стандартен корпоративен сайт
- силна типография, ритъм, мащаб, реални проектни визуали и детайл
- отлична mobile/desktop композиция без overlap, cramped spacing или декоративен шум
- SEO-ready структура и съдържание, когато задачата засяга страници, copy, metadata, schema или информационна архитектура

Клиентът иска:
- Съвременен, премиум, по-интерактивен визуален език
- Запазена цветова гама (`#BA2D20` е сигнатурата)
- По-премиум шрифт от текущия (Didact Gothic + Poiret One)
- Подобна хиро секция (slider с реализирани проекти)
- Място за **нови проекти** — клиентът ще предостави снимки по-късно
- **Допълнение** (feature), за което ще говорим след като завършим дизайна

### Какво НЕ се пренася от стария сайт

- **Двата top-header бутона** „Запитване за проект" (`ReservationForm/...`) и „Инвестиционни проекти" (`https://arinvest.bg/`) — игнорирай ги напълно. Не присъстват в новия дизайн, не се правят пренасочвания към тях.

## Стек

- **Astro 5** — MPA, ~0 JS по подразбиране
- **Tailwind CSS** с custom design tokens в [tailwind.config.ts](tailwind.config.ts)
- **React islands** (само за HeroCarousel — Embla)
- **Lenis** smooth scroll
- **TypeScript** strict
- Статичен build → готов за Netlify/Vercel/Cloudflare Pages

## Дизайн система

### Палитра
| Token | Hex | Употреба |
|---|---|---|
| `brand` | `#BA2D20` | CTA, акцент |
| `brand-dark` | `#8F1F15` | hover |
| `ink-950` | `#12161C` | дълбоко тъмно |
| `ink-900` | `#1A1F26` | заглавия, footer |
| `ink-800` | `#252E39` | оригиналното тъмно |
| `ink-600` | `#494949` | тяло текст |
| `ink-100` | `#F7F7F5` | меки секции |
| `ink-0` | `#FFFFFF` | фон |

### Шрифтове
- **Fraunces** — display/заглавия (с optical sizing, кирилица)
- **Inter** — body/UI (кирилица)

Зареждат се от Google Fonts в [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro).

## Структура (текуща след Phase 0+1+2+2.5)

```
src/
├── layouts/BaseLayout.astro       # SEO, fonts, smooth scroll, ClientRouter
├── components/
│   ├── Header.astro               # sticky, прозрачен върху hero, top progress bar
│   ├── Footer.astro
│   ├── HeroVideo.astro            # full-bleed composite video + text overlay
│   ├── HeroNewsCard.tsx           # React island, Embla карусел в долен десен ъгъл
│   ├── ProjectCard.astro          # portrait, premium hover motion
│   ├── TrustedBy.astro            # CSS-only infinite marquee
│   ├── Reveal.astro               # IntersectionObserver fade-up
│   └── SmoothScroll.astro         # Lenis
├── sections/
│   ├── HomeBody.astro
│   └── FeaturedProjects.astro     # Embla на desktop, scroll-snap на mobile
├── pages/
│   └── index.astro
├── data/
│   ├── projects.ts                # seed от data-extract/projects.json (55)
│   └── clients.ts                 # 15 placeholder лога (общини, институции)
└── styles/global.css              # Tailwind base + custom components
public/
├── hero/
│   ├── hero-poster.jpg            # placeholder (от legacy project #7)
│   └── hero-composite.mp4         # ⚠ липсва — генерира се от scripts/build-hero-video.sh
└── clients/                       # 15 SVG text placeholders (заместват се при доставка)
scripts/
├── build-hero-video.sh            # ffmpeg композит script
└── gen-client-placeholders.mjs    # генератор на client SVG лога
```

Placeholder SVG-та за client лога са в [public/clients/](public/clients/) — **ще бъдат заменени с реални лога когато клиентът ги достави**. Hero-то има placeholder poster от legacy проект #7 (Бутиков хотел Пампорово); реално mp4 видео ще се генерира с `scripts/build-hero-video.sh` след подаване на 3–5 stock клипа в `scripts/raw-clips/` (засега `<video>` graceful fallback-ва на poster).

## Команди

```bash
npm run dev      # localhost:4321
npm run build    # статичен build → dist/
npm run preview  # локален preview на build-а
npx astro check  # type check
```

## Visual iteration (screenshots)

Playwright (chromium headless) е инсталиран; скриптът `scripts/screenshot.mjs` прави screenshots от dev сървъра.

```bash
# Всички 3 viewports на /
node scripts/screenshot.mjs

# Конкретна страница, пълна страница
node scripts/screenshot.mjs /proekti desktop fullPage

# Конкретен viewport
node scripts/screenshot.mjs / mobile
```

Изходи: `screenshots/<timestamp>-<page>-<viewport>[-full].png`. `fullPage` режимът автоматично скролва през страницата за да тригърне Reveal IntersectionObserver-ите преди capture.

**Workflow:** UI промяна → `node scripts/screenshot.mjs` → Read screenshot → итерация. Това замества „guess if it works" подхода.

## Работен процес

**Важно**: Това е **визуален проект**. Кодовата коректност не е достатъчна — всяка промяна трябва да се проверява визуално. Ако потребителят не може да види резултата, я обяви изрично, не предполагай че работи.

### Задължителни умения

Когато задачата засяга UI, layout, компоненти, дизайн система, анимации, responsive поведение или визуално качество, **задължително използвай умението `frontend-design`** преди имплементация.

Когато задачата засяга SEO, content structure, headings, metadata, schema, индексиране, copy за страници или информационна архитектура, **задължително използвай `marketing-seo` ако е налично**. Ако няма умение с точно това име в текущата среда, използвай най-близкото налично SEO умение според задачата (`ai-seo`, `seo-audit`, `schema-markup`, `content-strategy`) и отбележи избора кратко.

### Стриктен execution loop

1. Разбери конкретното задание и обхвата му. Не добавяй несвързани функции, секции или рефактори.
2. Провери съществуващите компоненти, tokens, patterns и съдържание преди промяна.
3. Изпълни промяната в съществуващия стил на проекта, но с премиум строителна посока.
4. Провери сам резултата спрямо заданието:
   - изпълнено ли е точно това, което е поискано
   - спазен ли е премиум строителният визуален език
   - няма ли layout проблеми, overlap, счупен responsive, липсващи states или accessibility regressions
   - SEO елементите са коректни, когато задачата ги засяга
5. Ако има разминаване, върни се и го поправи. Повтаряй проверка → поправка, докато задачата не е изпълнена на 100%.
6. Валидирай с най-подходящата команда за промяната (`npm run build`, `npm run check`, screenshots, preview). Ако проверка не може да се пусне, кажи го изрично.

### Token discipline

Не хаби токени за обяснения, идеи или промени извън обхвата на заданието. Комуникирай кратко: какво правиш, какво си проверил, какъв е резултатът.

Клиентът (потребителят) ще:
- Дава визуални референции от други сайтове (компоненти, идеи)
- Итерира по дизайна — "това е само база"
- Ще достави реални снимки на нови проекти в следваща фаза
- Има планирано "допълнение" след като визуалния дизайн е готов

## Design principles (2026 premium)

- **Typography is the hero.** Display шрифтът (Fraunces) носи основното визуално тегло. Body не е автоматично 16px — ползвай `clamp()` fluid sizes (`text-display-*` вече са такива в [tailwind.config.ts](tailwind.config.ts)).
- **Щедро section spacing.** `py-24 md:py-32` (96–128px) е Vercel/Linear benchmark. По-малко = cramped, повече от `py-40` = самоиндулгенция.
- **Motion is signage, not decoration.** Всяка анимация трябва да отговаря: "какво обяснява?" — йерархия, ориентация, feedback. Ако отговорът е "изглежда готино" → режи.
- **Accessibility-first motion.** `@media (prefers-reduced-motion: reduce)` fallback е **задължителен**, не nice-to-have. Заменяй transform-и с opacity-only или директно финално състояние.
- **Performance е design принцип.** Lighthouse Performance ≥ 95 е baseline, не цел. Под 95 = дизайн bug.
- **Variable font axes.** Fraunces има `opsz` и `SOFT` — размерът влияе на характера (не само на px). Използвай за hero numerals и extra-large headings.

## Animation stack

- **GSAP + ScrollTrigger** — сложни timeline-и (pin, scrub, sequenced reveals). Инсталиран, но все още не е в активна употреба. Добави при нужда.
- **Lenis** — global smooth scroll. Вече в [SmoothScroll.astro](src/components/SmoothScroll.astro). Не го заменяй.
- **CSS scroll-driven animations** (`animation-timeline: scroll()` / `view()`) за прости fade-up reveal-и — по-евтино от JS (compositor thread). Предпочитай пред IntersectionObserver където работи.
- **View Transitions API** за `proekti` grid → project детайл навигация. Astro има `<ClientRouter />` за това.
- **Compositor-safe properties only**: `transform`, `opacity`, `filter`. **Никога** `top`/`left`/`width`/`height`/`margin` в keyframe-и — това тригърира layout.
- **Timing**: 400–800ms е премиум sweet spot. Под 200ms = twitchy; над 1000ms = бавно.
- **Easing**: `ease-out-expo` (вече в tokens) за reveal-и. Spring physics (Framer Motion-style) само за interactive drag/hover където inertia помага на feel-а.

## Modern CSS

- **Fluid everything with `clamp()`** — вече за typography; разшири към section padding и spacing при нужда.
- **OKLCH color space** (`oklch(0.6 0.18 30)`) за тонални variations — перцептивно равни стъпки, вместо hex skating. Hex остава за точни brand hit-ове (`#BA2D20`).
- **`color-mix()`** за bulk tonal variants без да пишеш всеки shade (`color-mix(in oklch, var(--brand), white 30%)`).
- **Container queries** (`@container`) ако компонент е на 3+ места с различен parent width — по-точни от viewport-based breakpoints.
- **Logical properties** (`padding-inline`, `margin-block`) предпочитай пред directional — future-proof за RTL.

## Phase 2 roadmap (след приключване на визуалния дизайн)

Следната функционалност **не се имплементира сега**, но е планирана и решения по нея са вече взети. Записано тук за да не се губи контекст.

### Client admin (`/admin`)
Клиентът иска да качва нови проекти без разработчик — форма със снимки, кратък текст + локация; AI генерира пълно описание; записва в DB → появява се на сайта автоматично.

- **Auth**: Supabase magic link с email allowlist (само пред-одобрени имейли на управител/тех директор могат да поискат link).
- **Route**: Astro `/admin` в **hybrid mode** (SSR само за тази страница; marketing остава статичен).
- **Image upload**: Supabase Storage с built-in image transformations (resize/format). `astro:assets` **не** се прилага за user-uploaded снимки — това е приемливо.
- **AI description**: server-side endpoint `/api/generate-description` → **OpenRouter** (Claude Sonnet 4.6 като default модел, конфигурируем).
- **Auto-publish**: Supabase database webhook → Netlify/Vercel build hook → rebuild на `/proekti` → проектът се появява за ~30s. **Build webhook е ключов — не го изключваме.**

### Chatbot
За консултации за проекти/услуги. React island с streaming от OpenRouter. RAG върху Supabase `projects` + `services` tables за контекстни отговори.

### Data source миграция
- **Сега → до края на визуала**: `src/data/projects.ts` (статичен TS файл).
- **При приключване на дизайна**: seed script чете TS файла → insert в Supabase `projects` table. Смяна на един import в компонентите. ~1 час работа.
- Маркетинг страниците продължават да се генерират статично при build; админ-ът добавя нови редове, webhook-ът ги публикува.

### Stack decisions (confirmed)
- **Database + Auth + Storage**: Supabase
- **AI**: OpenRouter (default Claude Sonnet 4.6 за description; по-евтин модел за chatbot ако трафикът расте)
- **Hosting**: TBD (текущият хост на клиента още не е уточнен). Ако текущият е shared PHP hosting → мигрираме на **Netlify** (домейнът остава, само DNS промяна). Ако поддържа Node runtime → оценяваме.
- **Astro output mode**: ще смени на `hybrid` когато се избере adapter. Дотогава остава `static`.

## Какво НЕ е в обхвата сега

- Реални снимки на проекти (чакаме клиента)
- Supabase setup / admin имплементация (Phase 2 — след визуала)
- Backend/CMS (докато сме във визуалната фаза, контент е в TS файлове)
- Contact форма backend (placeholder `action` към Formspree засега)
- Сертификати/партньори страници (не са в текущата навигация)

## Legacy data extract

В `data-extract/` са структурираните данни от стария сайт (готови за Supabase import — Phase 2):

- **`projects.json`** — 55 проекта (`progect1.html` → `progect55.html` в legacy CMS-а), 267 валидни image URL-и (cover + gallery)
- **`schema.sql`** — Postgres DDL за `public.projects` таблица
- **`README.md`** — schema описание + качествени забележки

Извлечени полета: `id, slug, title, location, client, scope, description, cover_image_url, gallery_image_urls[], map_embed_url, partner_url, partner_logo_url, source_url`. Няма `category` или `year` в legacy сайта — попълват се editorial-но по-късно.

Източникът имаше 8 счупени gallery snimki (404 на legacy host-а) — филтрирани от `gallery_image_urls`. Подробности в `data-extract/README.md`.

Скриптовете (`scrape/parse.py`, `scrape/build_dataset.py`) и кешираните HTML файлове остават в `scrape/` — преизползваеми ако трябва да се префреши извличането.

**Засега** `src/data/projects.ts` (8 хардкоднати + 2 placeholder) остава активният източник за визуалната фаза. При мигриране към Supabase, `data-extract/projects.json` се seed-ва в `public.projects` и компонентите се пренасочват.

## Мигрирано съдържание (не измисляй!)

**АРТСТРОЙ ООД**
- гр. Смолян 4700, кв. Устово, ул. „Хаджи Иван Бечев" №6
- artstroismolian@abv.bg
- Пон–Пет 9:00–18:00

**Телефони**: +359 878 715 936 (Управител) · +359 878 715 935 (Счетоводство) · +359 877 766 523 (Технически директор) · +359 878 986 797 (Транспорт)
