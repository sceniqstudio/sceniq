-- Migration 009 — brand_assets : ajouter 'voice' au type CHECK
--
-- Objectif V1.5 : permettre l'upload d'un échantillon vocal par marque
-- (mp3/wav 30-60 sec) pour alimenter le pipeline lip-sync FR :
--   1. ElevenLabs clone la voix depuis cet échantillon
--   2. Chaque scène avec dialogue → ElevenLabs TTS (voix clonée) → MP3
--   3. OmniHuman synchronise les lèvres sur ce MP3
--
-- Le CHECK constraint existant ne référence que (logo, image, video, color, font).
-- On le remplace pour ajouter 'voice'. Idempotent : DROP + ADD.

alter table public.brand_assets
  drop constraint if exists brand_assets_type_check;

alter table public.brand_assets
  add constraint brand_assets_type_check
  check (type in ('logo', 'image', 'video', 'color', 'font', 'voice'));
