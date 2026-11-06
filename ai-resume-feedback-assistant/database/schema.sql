-- AI Resume Feedback Assistant
-- Run this entire file in Supabase Dashboard -> SQL Editor.
-- Authentication identities are managed by Supabase Auth; this app does not store passwords.

create extension if not exists pgcrypto;

create table if not exists public.resume_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Resume review' check (char_length(title) between 1 and 80),
  resume_text text not null check (char_length(resume_text) between 80 and 12000),
  job_description text check (job_description is null or char_length(job_description) <= 8000),
  score integer not null check (score between 0 and 100),
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists resume_reviews_user_created_idx
  on public.resume_reviews (user_id, created_at desc);

alter table public.resume_reviews enable row level security;

drop policy if exists "Users can read their own resume reviews" on public.resume_reviews;
create policy "Users can read their own resume reviews"
  on public.resume_reviews for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own resume reviews" on public.resume_reviews;
create policy "Users can insert their own resume reviews"
  on public.resume_reviews for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own resume reviews" on public.resume_reviews;
create policy "Users can delete their own resume reviews"
  on public.resume_reviews for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- No update policy is needed because this MVP does not edit saved reviews.
-- The browser never receives a service-role key. Express verifies the JWT and
-- forwards the user's access token so PostgreSQL RLS remains active.
