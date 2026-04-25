-- LucentWorship Supabase setup
-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  "key" text,
  tempo numeric,
  tags text[] not null default '{}',
  sections jsonb not null default '[]'::jsonb,
  ccli_number text,
  notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date,
  status text not null default 'draft',
  slides jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.scripture (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  text text not null,
  translation text,
  book text,
  chapter integer,
  verse_from integer,
  verse_to integer,
  tags text[] not null default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'image',
  url text not null,
  size bigint,
  created_date timestamptz not null default now()
);

alter table public.songs add column if not exists created_date timestamptz not null default now();
alter table public.songs add column if not exists updated_date timestamptz not null default now();
alter table public.songs add column if not exists title text;
alter table public.songs add column if not exists artist text;
alter table public.songs add column if not exists "key" text;
alter table public.songs add column if not exists tempo numeric;
alter table public.songs add column if not exists tags text[] not null default '{}';
alter table public.songs add column if not exists sections jsonb not null default '[]'::jsonb;
alter table public.songs add column if not exists ccli_number text;
alter table public.songs add column if not exists notes text;

alter table public.presentations add column if not exists created_date timestamptz not null default now();
alter table public.presentations add column if not exists updated_date timestamptz not null default now();
alter table public.presentations add column if not exists title text;
alter table public.presentations add column if not exists description text;
alter table public.presentations add column if not exists date date;
alter table public.presentations add column if not exists status text not null default 'draft';
alter table public.presentations add column if not exists slides jsonb not null default '[]'::jsonb;
alter table public.presentations add column if not exists tags text[] not null default '{}';

alter table public.scripture add column if not exists created_date timestamptz not null default now();
alter table public.scripture add column if not exists updated_date timestamptz not null default now();
alter table public.scripture add column if not exists reference text;
alter table public.scripture add column if not exists text text;
alter table public.scripture add column if not exists translation text;
alter table public.scripture add column if not exists book text;
alter table public.scripture add column if not exists chapter integer;
alter table public.scripture add column if not exists verse_from integer;
alter table public.scripture add column if not exists verse_to integer;
alter table public.scripture add column if not exists tags text[] not null default '{}';

alter table public.media add column if not exists created_date timestamptz not null default now();
alter table public.media add column if not exists name text;
alter table public.media add column if not exists type text not null default 'image';
alter table public.media add column if not exists url text;
alter table public.media add column if not exists size bigint;

alter table public.songs enable row level security;
alter table public.presentations enable row level security;
alter table public.scripture enable row level security;
alter table public.media enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'songs' and policyname = 'songs_authenticated_all') then
    create policy songs_authenticated_all on public.songs for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'presentations' and policyname = 'presentations_authenticated_all') then
    create policy presentations_authenticated_all on public.presentations for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scripture' and policyname = 'scripture_authenticated_all') then
    create policy scripture_authenticated_all on public.scripture for all to authenticated using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'media' and policyname = 'media_authenticated_all') then
    create policy media_authenticated_all on public.media for all to authenticated using (true) with check (true);
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update
set public = true,
    file_size_limit = null,
    allowed_mime_types = null;

drop policy if exists media_public_read on storage.objects;
drop policy if exists media_authenticated_insert on storage.objects;
drop policy if exists media_authenticated_update on storage.objects;
drop policy if exists media_authenticated_delete on storage.objects;

create policy media_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'media');

create policy media_authenticated_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
);

create policy media_authenticated_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media'
)
with check (
  bucket_id = 'media'
);

create policy media_authenticated_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
);
