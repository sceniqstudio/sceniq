-- Migration : orders — support multi-cart + voice language
-- 2026-05-21
-- Colonnes additives (non-breaking) : cart_items JSONB + voice_language TEXT

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cart_items    JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_language TEXT;

COMMENT ON COLUMN orders.cart_items IS
  'Détail du panier complet : [{duration, formats[], qty, want_ai_model, ai_model_desc}]';

COMMENT ON COLUMN orders.voice_language IS
  'Langue de la voix off choisie par le client (ex: "Français", "English")';
