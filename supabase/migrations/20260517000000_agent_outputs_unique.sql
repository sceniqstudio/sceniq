-- Migration 008 — agent_outputs : unique constraint sur (project_id, agent)
--
-- Sans cette contrainte, l'upsert avec `onConflict: 'project_id,agent'` dans
-- app/api/production/[projectId]/route.ts échoue silencieusement côté Postgrest.
-- Symptôme observé en prod le 2026-05-17 : POST /api/production renvoie 200 avec
-- les 5 outputs des agents, mais aucune ligne n'est écrite en BDD. La page
-- production affiche alors "ÉCHEC" pour les 5 agents au prochain reload parce
-- que le GET ne retourne aucun agent_outputs et le useEffect re-trigger
-- runAgents() en boucle.
--
-- Stratégie : ajout idempotent — on supprime d'abord les éventuels doublons
-- existants (en gardant la ligne la plus récente par couple project_id+agent),
-- puis on crée la contrainte unique.

-- 1. Dédup défensif : garder uniquement la ligne la plus récente par (project_id, agent)
delete from public.agent_outputs a
  using public.agent_outputs b
  where a.project_id = b.project_id
    and a.agent      = b.agent
    and a.created_at < b.created_at;

-- 2. Contrainte unique requise par l'upsert onConflict
alter table public.agent_outputs
  add constraint agent_outputs_project_agent_unique
  unique (project_id, agent);
