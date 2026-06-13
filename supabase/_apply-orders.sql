-- ─────────────────────────────────────────────────────────────────────────────
-- ScenIQ — Application manuelle des migrations `orders` (checkout V1)
-- À exécuter une fois dans Supabase → SQL Editor (projet lawmjbyhqmuxalxqraxz).
-- 100 % idempotent : peut être relancé sans risque, que la table existe déjà ou non.
-- Corrige l'erreur « Erreur lors de la création de la commande » sur /commande.
-- ─────────────────────────────────────────────────────────────────────────────

-- ENUMs (idempotents)
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending_payment','paid','cancelled','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_format AS ENUM ('21:9','16:9','4:3','1:1','3:4','9:16');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table orders
CREATE TABLE IF NOT EXISTS orders (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  status                order_status NOT NULL DEFAULT 'pending_payment',
  format                order_format NOT NULL,
  duration              integer      NOT NULL,
  price_ht              integer      NOT NULL,
  brief                 text         NOT NULL,
  client_name           text         NOT NULL,
  client_email          text         NOT NULL,
  client_phone          text,
  client_company        text,
  preferred_call_slot   text,
  ref_paths             text[]       NOT NULL DEFAULT '{}',
  stripe_session_id     text,
  stripe_payment_intent text,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT orders_duration_check  CHECK (duration IN (5, 8, 10, 12, 15)),
  CONSTRAINT orders_price_positive  CHECK (price_ht > 0)
);

-- Colonnes multi-cart (additives, idempotentes)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cart_items     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_language TEXT;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (accès service role uniquement — webhook + admin)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS orders_status_idx         ON orders (status);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON orders (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_created_at_idx      ON orders (created_at DESC);
