# Legacy data extract — АРТСТРОЙ ООД

Извлечено от https://www.artstroismolian.com на 2026-04-30 (55 проекта, 267 валидни снимки).

## Файлове

- **projects.json** — масив от 55 records, готови за Supabase import
- **schema.sql** — Postgres DDL за `public.projects` таблица

## Статистика

- 55 проекта (`progect1.html` → `progect55.html` на legacy сайта)
- 55 cover изображения (всички 200 OK)
- 212 gallery изображения (267 общо, минус 8 broken на legacy сървъра, минус 47 cover-и вече броени)
  - 4 gallery snimki/проект × 55 = 220 теоретично; 8 от тях са 404 на legacy host-а:
    `10/5.jpg, 15/4-5.jpg, 16/5.jpg, 24/3-5.jpg, 39/5.jpg`. Махнати са от `gallery_image_urls`.

## Качествени забележки (от източника)

- Проект 24 («Укрепване на свлачище гр. Смолян») няма `client` и `scope` в legacy CMS-а.
- Проекти 2, 8, 9, 10, 11, 15-18, 21-25, 31-33, 35, 39, 40, 42, 44, 45, 48 нямат `scope` (празно в източника).
- Проект 50 (с.Момчиловци) има разменени етикети: текстът зад "Част" всъщност е описание, а зад "КРАТКО ОПИСАНИЕ" е scope. Извличаме както е в източника — поправянето е editorial решение.
- Снимките са на legacy host-а. За production трябва да се мигрират към Supabase Storage (или CDN), след което `cover_image_url` и `gallery_image_urls` се пренаписват.

## Schema полета (виж schema.sql за пълно DDL)

| Поле | Тип | Бележки |
|---|---|---|
| `id` | bigint PK | 1..55 (запазен от legacy URL pattern) |
| `slug` | text unique | транслит. от заглавието на латиница |
| `title` | text | оригинал на кирилица |
| `location` | text | „гр.Смолян, кв.Каптажа" и т.н. |
| `client` | text | „Възложител" |
| `scope` | text | „Част" — scope of work |
| `description` | text | „КРАТКО ОПИСАНИЕ" |
| `cover_image_url` | text | абсолютен URL на legacy host |
| `gallery_image_urls` | text[] | абсолютни URL-и (без 404-те) |
| `map_embed_url` | text | Google Maps iframe src (по желание) |
| `partner_url` | text | сайт на възложителя |
| `partner_logo_url` | text | logo на възложителя |
| `source_url` | text | original `/projects/progectN.html` |
| `category` | text | **празно** — за editorial попълване |
| `year` | int | **празно** — източникът няма дати |
| `is_published` | bool | default true |
| `display_order` | int | за ръчно подреждане |

## Категория и година

В legacy сайта липсват и двете. Когато решим как да категоризираме (residential / public / hotel / infrastructure / sports / education / industrial), ще се попълни ръчно или чрез AI пас върху `title + description + scope`.
