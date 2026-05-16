-- Migration 007 — subscriptions (Stripe)

create table public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid references public.users(id) on delete cascade not null,
  stripe_customer_id      text unique not null,
  stripe_subscription_id  text unique,
  plan                    text not null default 'free'
                            check (plan in ('free','studio','agency','white_label')),
  status                  text not null default 'active'
                            check (status in ('active','past_due','canceled','trialing')),
  current_period_end      timestamptz,
  created_at              timestamptz default now() not null,
  updated_at              timestamptz default now() not null
);

alter table public.subscriptions enable row level security;

create policy "subscriptions: lecture propre" on public.subscriptions
  for select using (
    user_id = (select id from public.users where clerk_id = auth.jwt() ->> 'sub')
  );

-- Service role only pour les mises à jour webhook Stripe
-- (pas de policy update/delete pour les users)
