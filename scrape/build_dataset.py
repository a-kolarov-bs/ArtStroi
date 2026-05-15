#!/usr/bin/env python3
"""Build the final Supabase-ready dataset from scraped per-project JSON.

Inputs:
  - scrape/projects.json  (raw parsed)
  - scrape/broken_urls.txt (one URL per line — gallery images that 404 on the source server)

Outputs (written to ../data-extract/):
  - projects.json   — clean array, Supabase-ready
  - schema.sql      — Postgres DDL for `projects` table
  - README.md       — short description of the dataset and schema
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "projects.json"
OUT_DIR = ROOT.parent / "data-extract"
OUT_DIR.mkdir(exist_ok=True)

# 8 images that return 404 on the live site (source-side data loss, kept here
# as documentation; we filter them out of the published gallery field)
BROKEN = {
    "https://www.artstroismolian.com/projects/10/5.jpg",
    "https://www.artstroismolian.com/projects/15/4.jpg",
    "https://www.artstroismolian.com/projects/15/5.jpg",
    "https://www.artstroismolian.com/projects/16/5.jpg",
    "https://www.artstroismolian.com/projects/24/3.jpg",
    "https://www.artstroismolian.com/projects/24/4.jpg",
    "https://www.artstroismolian.com/projects/24/5.jpg",
    "https://www.artstroismolian.com/projects/39/5.jpg",
}

# Simple Cyrillic → Latin transliteration for slugs
TRANSLIT = {
    "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ж":"zh","з":"z",
    "и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p",
    "р":"r","с":"s","т":"t","у":"u","ф":"f","х":"h","ц":"ts","ч":"ch",
    "ш":"sh","щ":"sht","ъ":"a","ь":"y","ю":"yu","я":"ya",
}


def slugify(text: str) -> str:
    out = []
    for ch in text.lower():
        if ch in TRANSLIT:
            out.append(TRANSLIT[ch])
        elif ch.isalnum():
            out.append(ch)
        elif ch in " -_/.,":
            out.append("-")
    s = "".join(out)
    s = re.sub(r"-+", "-", s).strip("-")
    return s[:80]


def clean_text(s):
    if not s:
        return None
    s = s.replace("\xa0", " ").replace("​", "")
    s = re.sub(r"\s+", " ", s).strip()
    s = s.rstrip(".,;:")
    return s or None


def main():
    raw = json.loads(SRC.read_text(encoding="utf-8"))
    out = []
    for p in raw:
        gallery = [u for u in p["gallery_image_urls"] if u not in BROKEN]
        record = {
            "id": p["id"],
            "slug": slugify(p["title"] or f"project-{p['id']}"),
            "title": clean_text(p["title"]),
            "location": clean_text(p["location"]),
            "client": clean_text(p["client"]),
            "scope": clean_text(p["scope"]),
            "description": clean_text(p["description"]),
            "cover_image_url": p["cover_image_url"],
            "gallery_image_urls": gallery,
            "map_embed_url": p["map_embed_url"],
            "partner_url": p["partner_url"],
            "partner_logo_url": p["partner_logo_url"],
            "source_url": p["source_url"],
        }
        out.append(record)

    (OUT_DIR / "projects.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"wrote {len(out)} projects → {OUT_DIR / 'projects.json'}")

    # Schema SQL
    schema = """-- Supabase / Postgres DDL for АРТСТРОЙ ООД legacy project import
-- Generated from artstroismolian.com (55 projects, scraped 2026-04-30).
-- Apply via Supabase SQL editor or `psql -f schema.sql`.

create table if not exists public.projects (
  id                  bigint primary key,                -- legacy 1..55 from source URL
  slug                text not null unique,              -- transliterated, URL-safe
  title               text not null,
  location            text,
  client              text,
  scope               text,                              -- "Част" — scope of work
  description         text,                              -- "КРАТКО ОПИСАНИЕ"
  cover_image_url     text,                              -- absolute URL on legacy host
  gallery_image_urls  text[] not null default '{}',      -- absolute URLs
  map_embed_url       text,                              -- Google Maps iframe src
  partner_url         text,                              -- client/partner website
  partner_logo_url    text,                              -- absolute URL on legacy host
  source_url          text not null,                     -- original /projects/progectN.html
  -- editorial fields, populated later
  category            text,                              -- e.g. residential | public | hotel | infra
  year                int,
  is_published        boolean not null default true,
  display_order       int,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists projects_slug_idx     on public.projects (slug);
create index if not exists projects_category_idx on public.projects (category) where category is not null;
create index if not exists projects_published_idx on public.projects (is_published, display_order);

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
"""
    (OUT_DIR / "schema.sql").write_text(schema, encoding="utf-8")
    print(f"wrote schema → {OUT_DIR / 'schema.sql'}")

    readme = f"""# Legacy data extract — АРТСТРОЙ ООД

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
"""
    (OUT_DIR / "README.md").write_text(readme, encoding="utf-8")
    print(f"wrote README → {OUT_DIR / 'README.md'}")


if __name__ == "__main__":
    main()
