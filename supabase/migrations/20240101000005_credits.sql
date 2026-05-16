-- Migration 006 — credits_ledger

create table public.credits_ledger (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.users(id) on delete cascade not null,
  delta       integer not null,           -- positif = ajout, négatif = consommation
  reason      text not null,              -- 'subscription_renewal', 'generation', 'refund', 'trial'
  project_id  uuid references public.projects(id) on delete set null,
  scene_id    uuid references public.scenes(id) on delete set null,
  created_at  timestamptz default now() not null
);

alter table public.credits_ledger enable row level security;

create policy "credits_ledger: lecture propre" on public.credits_ledger
  for select using (
    user_id = (select id from public.users where clerk_id = auth.jwt() ->> 'sub')
  );

-- Vue calculée pour solde courant
create or replace view public.user_credits as
  select
    user_id,
    coalesce(sum(delta), 0) as balance
  from public.credits_ledger
  group by user_id;
