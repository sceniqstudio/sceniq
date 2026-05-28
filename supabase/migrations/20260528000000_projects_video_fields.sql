-- ─── Projects — champs vidéo V1 agence services ──────────────────────────────
-- Ajout de 3 colonnes pour le pipeline unifié :
--   ref_image_urls  : URLs publiques des images uploadées pour ce projet (Brand refs)
--   final_video_url : URL du MP4 final généré par BytePlus (1 appel multi-shot)
--   video_job_id    : Job ID BytePlus pour le polling status

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS ref_image_urls  text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS final_video_url text,
  ADD COLUMN IF NOT EXISTS video_job_id    text;

COMMENT ON COLUMN projects.ref_image_urls  IS 'URLs Supabase Storage des images de référence uploadées pour ce projet (max 6, @Image1…@Image6)';
COMMENT ON COLUMN projects.final_video_url IS 'URL Cloudflare/Supabase Storage du MP4 final livré (généré via 1 appel BytePlus multi-shot)';
COMMENT ON COLUMN projects.video_job_id    IS 'Job ID BytePlus (Seedance 2.0) pour le polling status de la génération unifiée';
