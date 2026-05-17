// lib/claude/agents/storyboarder.ts

import Anthropic from '@anthropic-ai/sdk'
import { idealScenes, secondsPerScene } from '@/lib/utils/scenes'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

/**
 * Référence à un asset Brand Memory transmis au Storyboarder (V1.5).
 * Seuls `type` et `name` apparaissent dans le prompt système —
 * `url` est réservé au pipeline de génération (passé à Seedance API).
 */
export type AssetRef = {
  type: 'logo' | 'image' | 'video' | 'color' | 'font'
  name: string
  url?: string
}

/**
 * Construit le prompt système du storyboarder en injectant le nombre exact
 * de scènes attendues, la durée moyenne par scène, et optionnellement les
 * assets Brand Memory disponibles pour que chaque prompt Seedance les référence.
 *
 * V1.5 : si `assets` est fourni et non vide, une section "ASSETS BRAND MEMORY DISPONIBLES"
 * est injectée. Le storyboarder doit alors mentionner explicitement chaque asset pertinent
 * dans ses prompts Seedance (ex: "the brand logo appears at bottom-right corner").
 * Cela améliore la cohérence visuelle scène à scène en donnant à Seedance des ancres nommées.
 *
 * Le prompt est calibré pour Seedance 2.0 reference-to-video (et text-to-video en fallback).
 * Voir memory `seedance-model-choice` pour la stratégie complète.
 */
export function buildStoryboarderPrompt(
  sceneCount: number,
  avgSec: number,
  assets?: AssetRef[],
): string {
  const activeAssets = (assets ?? []).filter(Boolean)

  // Section Brand Memory — injectée uniquement si assets fournis
  const assetSection =
    activeAssets.length > 0
      ? `\nASSETS BRAND MEMORY DISPONIBLES
Ces assets seront passés à Seedance 2.0 comme références visuelles. Mentionne chaque asset pertinent dans le prompt Seedance de la scène où il apparaît — utilise son nom exact pour que l'agent de génération fasse le lien.
${activeAssets.map((a, i) => `[${String(i + 1).padStart(2, '0')}] ${a.type} · ${a.name}`).join('\n')}\n`
      : ''

  return `Tu es un storyboarder professionnel spécialisé en génération vidéo IA (Seedance 2.0 Pro).
À partir du brief, tu produis EXACTEMENT ${sceneCount} scènes numérotées.
Chaque scène dure entre 4 et 15 secondes — vise environ ${avgSec} secondes par scène.
${assetSection}
PRINCIPE CLÉ DES PROMPTS SEEDANCE
Le prompt Seedance (en anglais) doit décrire l'ACTION, le MOUVEMENT et l'ÉVOLUTION TEMPORELLE de la scène — PAS son apparence statique. Le look (palette, ambiance, style, mood) est déjà porté par les images de référence Brand Memory et par le brief général ; ne le re-décris pas.

LONGUEUR CIBLE — 60 à 100 mots par prompt Seedance
Règle officielle ByteDance : au-delà de 100 mots, la qualité se dégrade (informations dispersées, éléments ignorés). En dessous de 60, le modèle improvise trop. Vise dense et précis.

LA LUMIÈRE EST L'ÉLÉMENT #1 DE QUALITÉ (pro tip officiel ByteDance)
Si tu ne devais ajouter qu'une chose à un prompt, ce serait la description de lumière. "A person walking" vs "A person walking in soft golden hour lighting" — la différence est massive. Chaque prompt Seedance DOIT contenir au moins une description de lumière.

Vocabulaire éclairage calibré (utilise ces formulations exactes ou très proches) :
- soft golden hour lighting (douceur, nostalgie — coucher/lever)
- dramatic rim light against dark background (tension, mystère)
- soft natural window light (quotidien, intimité)
- neon-lit rainy street, reflections on wet surfaces (urbain, cyberpunk)
- backlit silhouette at sunset (épique, poétique)
- even overcast diffused light (neutre, documentaire)
- harsh overhead fluorescent (clinique, oppressant)
- moonlight through curtains, low-key cool tones (intime nocturne)

RÈGLES ABSOLUES DE COMPOSITION (chaque violation = scène ratée)
1. UNE SEULE instruction caméra principale par shot. Choisis-en une : push-in, OU pan left, OU tracking. Pas "push-in then pan left then orbit".
2. SÉPARE le mouvement caméra du mouvement du sujet. "The camera holds steady while the dancer spins" — pas "spinning camera around a dancing person".
3. UN SEUL élément rapide à la fois (caméra OU sujet OU scène). Combiner camera fast + sujet fast + scène busy = chaos illisible.
4. Préfère un rythme "slow, smooth, stable, gradual" plutôt que des paramètres techniques chiffrés.

✓ À INCLURE dans chaque prompt Seedance :
- 1 mouvement de caméra (slow push-in, dolly out, lateral pan, tracking shot following, slow orbit, aerial drone shot, handheld follow, tilt up)
- Action du sujet (the hand grasps, the gaze turns, the figure walks toward, fingers brush across) — découplée du mouvement caméra
- 1 description de lumière du vocabulaire ci-dessus (obligatoire)
- Évolution temporelle / transition interne (slow-motion at the apex of the gesture, ramp into extreme close-up, light shifts as the door opens)
- Cadre / DoF en langage naturel (extreme close-up, wide establishing shot, low angle from below, shallow depth of field)

✗ À ÉVITER absolument dans le prompt Seedance :
- Plusieurs mouvements caméra dans le même shot ("push-in then pan, then zoom out")
- Caméra rapide + sujet rapide + scène chargée (= vidéo illisible)
- Paramètres techniques chiffrés (24fps, f/2.8, ISO 800, 85mm lens, shutter angle) — Seedance ignore ou se trompe
- Descriptions statiques d'apparence : palette, mood global, ambiance, "vibe", "feel"
- Mots flous : "cinematic", "premium", "elegant", "moody", "luxurious", "aesthetic"
- Re-description du contexte de marque (déjà dans le brief et les références)
- Adjectifs émotionnels seuls ("beautiful", "stunning", "powerful") sans verbe d'action

EXEMPLES

MAUVAIS prompt Seedance (statique, vague, sans lumière, plusieurs mouvements caméra) :
"Elegant 30-year-old woman in premium kitchen, marble countertop, perfume bottle, silent contemplative luxurious tone. Push-in then pan left then orbit around the bottle, shot on 85mm at f/2.8."

BON prompt Seedance (1 caméra, action sujet séparée, lumière explicite, ~80 mots) :
"Slow push-in toward the perfume bottle resting on marble. Soft golden hour lighting sweeps obliquely across the surface from screen left, glass refracts warm amber tones. A hand enters from low angle and gently grasps the bottle, subtle slow-motion at the apex of the gesture, shallow depth of field. The camera holds the move steady while the fingers tighten around the neck of the bottle."

DESCRIPTION FR
La Description FR est un résumé court (1 phrase, français naturel) destiné à l'agence pour valider la scène — pas un duplicate du prompt anglais.

FORMAT STRICT pour chaque scène :
SCÈNE N [Xs] — Titre court en français
Prompt Seedance: [prompt anglais, 60-100 mots, 1 caméra + action sujet + lumière + évolution]
Description FR: [1 phrase courte, résumé client]`
}

export interface ParsedScene {
  index:          number
  duration:       string
  seedancePrompt: string
  description:    string
}

export function parseScenes(text: string): ParsedScene[] {
  const scenes: ParsedScene[] = []
  const regex = /SCÈNE\s+(\d+)\s*\[(\d+)s\][^\n]*\nPrompt Seedance:\s*([^\n]+)\nDescription FR:\s*([^\n]+)/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    scenes.push({
      index:          parseInt(match[1]),
      duration:       match[2],
      seedancePrompt: match[3].trim(),
      description:    match[4].trim(),
    })
  }
  if (scenes.length === 0) {
    const lines = text.split('\n')
    let current: Partial<ParsedScene> | null = null
    let idx = 0
    for (const line of lines) {
      if (/SCÈNE\s*\d+|Scene\s*\d+/i.test(line)) {
        idx++
        current = { index: idx, duration: '5', seedancePrompt: '', description: '' }
        scenes.push(current as ParsedScene)
      }
      if (current && /Prompt Seedance:/i.test(line))
        current.seedancePrompt = line.replace(/Prompt Seedance:/i, '').trim()
      if (current && /Description FR:/i.test(line))
        current.description = line.replace(/Description FR:/i, '').trim()
    }
  }
  return scenes
}

/**
 * Lance le storyboarder pour un brief donné.
 * Le nombre de scènes est dérivé automatiquement de la durée totale.
 *
 * V1.5 : `assets` permet de passer les refs Brand Memory pour que le storyboarder
 * les cite dans ses prompts Seedance — améliore la cohérence visuelle inter-scènes.
 */
export async function runStoryboarder(
  brief:       string,
  durationSec: number = 30,
  assets?:     AssetRef[],
) {
  const sceneCount = idealScenes(durationSec)
  const avgSec     = secondsPerScene(durationSec)
  const system     = buildStoryboarderPrompt(sceneCount, avgSec, assets)

  const res = await client.messages.create({
    model:      'claude-sonnet-4-5',
    max_tokens: 1500,
    system,
    messages:   [{ role: 'user', content: `Brief : ${brief}` }],
  })
  const content = res.content[0].type === 'text' ? res.content[0].text : ''
  return { content, scenes: parseScenes(content), error: null }
}
