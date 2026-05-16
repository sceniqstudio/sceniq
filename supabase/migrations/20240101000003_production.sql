-- Migration 004 — agent_outputs (production)

create table public.agent_outputs (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid references public.projects(id) on delete cascade not null,
  agent       text not null check (agent in ('director','scriptwriter','storyboarder','music','visual')),
  content     text not null,
  accepted    boolean not null default false,
  version     integer not null default 1,
  created_at  timestamptz default now() not null
);

alter table public.agent_outputs enable row level security;

create policy "agent_outputs: accès via project" on public.agent_outputs
  for all using (
    project_id in (
      select p.id from public.projects p
      join public.users u on u.id = p.user_id
      where u.clerk_id = auth.jwt() ->> 'sub'
    )
  );
