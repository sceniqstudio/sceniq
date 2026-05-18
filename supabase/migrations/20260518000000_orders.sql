-- Migration : table orders (Phase A — checkout V1 agence services)
-- 2026-05-18

-- ─── Types ENUM ──────────────────────────────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'paid',
  'cancelled',
  'refunded'
);

CREATE TYPE order_format AS ENUM (
  '21:9',
  '16:9',
  '4:3',
  '1:1',
  '3:4',
  '9:16'
);

-- ─── Table orders ─────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  status                order_status NOT NULL DEFAULT 'pending_payment',
  format                order_format NOT NULL,
  duration              integer      NOT NULL,
  price_ht              integer      NOT NULL,       -- en centimes (ex: 10900 = 109 € HT)
  brief                 text         NOT NULL,
  client_name           text         NOT NULL,
  client_email          text         NOT NULL,
  client_phone          text,
  client_company        text,
  preferred_call_slot   text,                        -- 'matin' | 'après-midi' | 'soir'
  ref_paths             text[]       NOT NULL DEFAULT '{}', -- chemins bucket client-uploads
  stripe_session_id     text,
  stripe_payment_intent text,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  updated_at            timestamptz  NOT NULL DEFAULT now(),

  -- Contrainte : seules les durées tarifées sont acceptées
  CONSTRAINT orders_duration_check CHECK (duration IN (5, 8, 10, 12, 15)),

  -- Contrainte : price_ht cohérent avec la grille (vérification côté app, pas BDD —
  -- on laisse la flexibilité d'ajuster le prix si promo / sur-itérations facturées)
  CONSTRAINT orders_price_positive CHECK (price_ht > 0)
);

-- ─── Trigger updated_at ───────────────────────────────────────────────────────

-- La fonction peut déjà exister depuis les migrations précédentes — on la recrée
-- uniquement si absente (idempotent).
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Accès via service role uniquement (admin Pascal + webhook Stripe).
-- Aucun client public ne doit pouvoir lire les commandes des autres.

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Pas de policy publique : RLS activé + aucune policy = tout bloqué côté anon/user.
-- Le service role key bypass RLS nativement — c'est le seul accès V1.

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX orders_status_idx        ON orders (status);
CREATE INDEX orders_stripe_session_idx ON orders (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX orders_created_at_idx    ON orders (created_at DESC);
