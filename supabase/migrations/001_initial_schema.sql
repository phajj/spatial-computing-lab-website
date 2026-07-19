-- supabase/migrations/001_initial_schema.sql
-- Run this in the Supabase dashboard: SQL Editor → New query → paste & run.


-- ============================================================
-- ADMINS  (allowlist — managed directly in the Supabase table editor)
-- ============================================================
create table public.admins (
  email text primary key
);

-- Strip the default public grants; only the app's authenticated role needs SELECT.
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- Pre-seed the first admin.
insert into public.admins (email) values ('hajjp@merrimack.edu');


-- ============================================================
-- MEDIA
-- ============================================================
create table public.media (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  src         text        not null,                          -- Supabase Storage URL
  thumb       text,                                         -- thumbnail URL
  type        text        not null check (type in ('photo', 'video')),
  category    text,                                         -- e.g. 'study_abroad', 'campus_events'
  collection  text,                                         -- e.g. 'Greece Spring 2026'
  description text,
  location    text,
  date        date,
  featured    boolean     not null default false,
  hotspots    jsonb       not null default '[]'::jsonb,
  published   boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table public.media enable row level security;

-- Unauthenticated visitors see published items only
create policy "Public can view published media"
  on public.media for select
  to anon
  using (published = true);

-- Allowlisted admins see everything (drafts included)
create policy "Admins can view all media"
  on public.media for select
  to authenticated
  using (exists (select 1 from public.admins where email = auth.email()));

create policy "Admins can insert media"
  on public.media for insert
  to authenticated
  with check (exists (select 1 from public.admins where email = auth.email()));

create policy "Admins can update media"
  on public.media for update
  to authenticated
  using  (exists (select 1 from public.admins where email = auth.email()))
  with check (exists (select 1 from public.admins where email = auth.email()));

create policy "Admins can delete media"
  on public.media for delete
  to authenticated
  using (exists (select 1 from public.admins where email = auth.email()));


-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true);

create policy "Public can view media files"
  on storage.objects for select
  to anon
  using (bucket_id = 'media');

create policy "Admins can upload media files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media' and
    exists (select 1 from public.admins where email = auth.email())
  );

create policy "Admins can update media files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media' and
    exists (select 1 from public.admins where email = auth.email())
  );

create policy "Admins can delete media files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media' and
    exists (select 1 from public.admins where email = auth.email())
  );


-- ============================================================
-- INDEXES
-- ============================================================
create index on public.media (published, featured);
create index on public.media (collection);
