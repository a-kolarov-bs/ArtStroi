-- Supabase / Postgres DDL for АРТСТРОЙ ООД legacy project import
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
