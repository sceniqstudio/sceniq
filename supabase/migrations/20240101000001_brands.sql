-- Migration 002 — brands (Brand Memory)

create table public.brands (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete cascade not null,
  name        text not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create table public.brand_assets (
  id          uuid primary key default uuid_generate_v4(),
  brand_id    uuid references public.brands(id) on delete cascade not null,
  type        text not null check (type in ('logo', 'image', 'video', 'color', 'font')),
  url         text,              -- Supabase Storage URL
  value       text,              -- pour couleurs (#hex) ou polices
  created_at  timestamptz default now() not null
);

alter table public.brands enable row level security;
alter table public.brand_assets enable row level security;

create policy "brands: CRUD propre" on public.brands
  for all using (
    user_id = (select id from public.users where clerk_id = auth.jwt() ->> 'sub')
  );

create policy "brand_assets: CRUD via brand" on public.brand_assets
  for all using (
    brand_id in (
      select b.id from public.brands b
      join public.users u on u.id = b.user_id
      where u.clerk_id = auth.jwt() ->> 'sub'
    )
  );
