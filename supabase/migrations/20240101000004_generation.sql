-- Migration 005 — scenes + clips (génération)

create table public.scenes (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid references public.projects(id) on delete cascade not null,
  scene_index     integer not null,
  duration_sec    integer not null,
  seedance_prompt text not null,
  description_fr  text not null,
  status          text not null default 'idle'
                    check (status in ('idle','generating','done','failed')),
  created_at      timestamptz default now() not null
);

create table public.clips (
  id          uuid primary key default uuid_generate_v4(),
  scene_id    uuid references public.scenes(id) on delete cascade not null,
  fal_job_id  text,
  video_url   text,
  duration_ms integer,
  status      text not null default 'pending'
                check (status in ('pending','processing','done','failed')),
  error       text,
  created_at  timestamptz default now() not null
);

alter table public.scenes enable row level security;
alter table public.clips enable row level security;

create policy "scenes: accès via project" on public.scenes
  for all using (
    project_id in (
      select p.id from public.projects p
      join public.users u on u.id = p.user_id
      where u.clerk_id = auth.jwt() ->> 'sub'
    )
  );

create policy "clips: accès via scene" on public.clips
  for all using (
    scene_id in (
      select s.id from public.scenes s
      join public.projects p on p.id = s.project_id
      join public.users u on u.id = p.user_id
      where u.clerk_id = auth.jwt() ->> 'sub'
    )
  );
