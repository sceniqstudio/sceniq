-- Migration 003 — projects

create table public.projects (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.users(id) on delete cascade not null,
  brand_id      uuid references public.brands(id) on delete set null,
  name          text not null,
  brief         text not null,
  format        text not null default '16:9' check (format in ('16:9','9:16','1:1','4:3')),
  duration_sec  integer not null default 30,
  tone          text not null default 'Premium',
  status        text not null default 'brief'
                  check (status in ('brief','production','generation','export','archived')),
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "projects: CRUD propre" on public.projects
  for all using (
    user_id = (select id from public.users where clerk_id = auth.jwt() ->> 'sub')
  );
