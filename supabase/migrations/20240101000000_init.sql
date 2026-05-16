-- Migration 001 — users (extension du profil Clerk)

create extension if not exists "uuid-ossp";

create table public.users (
  id          uuid primary key default uuid_generate_v4(),
  clerk_id    text unique not null,
  email       text not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "users: lecture propre" on public.users
  for select using (clerk_id = auth.jwt() ->> 'sub');

create policy "users: mise à jour propre" on public.users
  for update using (clerk_id = auth.jwt() ->> 'sub');
