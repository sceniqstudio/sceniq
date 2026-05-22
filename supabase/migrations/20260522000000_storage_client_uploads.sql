-- Migration : créer bucket Supabase Storage "client-uploads"
-- 2026-05-22
--
-- Ce bucket stocke les fichiers de référence uploadés par les clients
-- pendant le checkout (/commande). Accès via service role uniquement.
-- Les fichiers sont groupés par session : temp/{sessionId}/{uuid}-{nom}

-- ─── Créer le bucket (idempotent) ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-uploads',
  'client-uploads',
  false,                  -- privé : accès via signed URLs uniquement
  26214400,              -- 25 MB en octets
  ARRAY[
    -- Images
    'image/jpeg', 'image/png', 'image/webp', 'image/bmp',
    'image/tiff', 'image/gif', 'image/heic', 'image/heif',
    -- Audio
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/x-m4a',
    -- Vidéo
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ─── RLS Storage ─────────────────────────────────────────────────────────────
-- Accès via service role uniquement (bypass RLS natif Supabase).
-- Aucune policy publique = accès anon/user bloqué.
-- Pas de policy SELECT/INSERT explicite : le service role passe toujours.

-- Note : en prod, les fichiers dans temp/{sessionId}/ peuvent être purgés
-- automatiquement via un cron job Supabase (Edge Function) après 30 jours.
-- À implémenter en V1.5 si le bucket grossit.
