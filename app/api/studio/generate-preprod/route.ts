// app/api/studio/generate-preprod/route.ts
// POST — Génère la pré-production complète via Claude (6 blocs)
// à partir d'une description libre + paramètres vidéo
// Body JSON :
//   description  string   requis — description libre du projet
//   ratio        string   '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9'
//   duration     number   secondes (4-15)
//   quality      string   'standard' | 'fast'
//   numRefs      number   nombre d'images de référence uploadées

import { NextRequest, NextResponse } from 'next/server'
import Anthropic                     from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PREPROD_SYSTEM = `Tu es ScenIQ, un directeur créatif vidéo expert Seedance 2.0 / Dreamina AI pour agences pub françaises.

À partir d'une description libre du client, tu produis une pré-production complète et directement exploitable, en 6 blocs structurés.

## RÈGLES SEEDANCE 2.0 — à respecter impérativement

### Structure du prompt optimal (60-100 mots, ordre obligatoire)
[1. Sujet + Action] → QUI fait QUOI — verbe d'action précis
[2. Mouvement] → détail physique de l'action (micro-geste, trajectoire)
[3. Environnement] → décor + lumière ambiante + heure
[4. Esthétique] → style visuel global, référence cinéma/pub
[5. Caméra] → UNE seule instruction de mouvement caméra
[6. Audio] → son ambiant, musique, voix (No Lyrics)
[7. Contraintes] → ce que le modèle NE DOIT PAS faire

### Mouvements caméra disponibles (un seul par shot)
slow push-in | slow pull-out | lateral pan, slow | tracking shot following | slow orbit around subject | aerial drone shot ascending | handheld slight shake | camera holds fixed framing

### Bloc qualité cinématique (à injecter dans le Prompt final)
Cinematic lighting, photorealistic, 35mm film quality, professional color grading, sharp focus, high detail texture, film grain, depth of field mastery, ARRI ALEXA aesthetic.

### Contraintes de sécurité (toujours dans le Prompt final)
Avoid: jitter, shaky footage, blurry frames, bent limbs, face deformation, warped hands, distorted fingers, abrupt cuts, flickering, color inconsistency, motion blur artifacts, unrealistic physics.

### Système @ multimodal (si images de référence)
@Image1 as the first frame | @Image1 as character reference | @Image2 as outfit and material reference | @Image3 as environment reference

### Template multi-shots
Montage, multi-shot cinematic film, [N] shots, [X] seconds, [ratio].
Don't use one camera angle or single cut.
Shot 1 (0-Xs): [shot type]. [Sujet + action]. Camera [movement].
...

## FORMAT DE SORTIE — 6 blocs avec marqueurs exacts

Utilise ces marqueurs de section EXACTEMENT (pour le parsing) :

===CONCEPT===
[Concept créatif & angle narratif — 3-5 phrases. UNE proposition défendable, pas un menu d'options. Ton posé, factuel, anti-buzzwords.]

===SCRIPT===
[Script voix-off en français + textes écran si pertinents. Horodaté si plusieurs lignes. Format : [0-3s] Texte à l'écran : "..." / Voix off : "..."]

===STORYBOARD===
[Découpage scène par scène — chaque shot avec : timing, type de plan, action, mouvement caméra, prompt Seedance 2.0 associé. Format :
### Shot 1 (0-Xs) — [Nom]
**Plan :** [description]
**Prompt Seedance :**
[prompt 60-100 mots pour ce shot]]

===AMBIANCE===
[Style musical No Lyrics + sons d'ambiance. Référence musicale précise (artiste, style), justification du choix pour ce brief.]

===PROMPT_FINAL===
[Prompt unique consolidé, prêt à coller dans Dreamina. Multi-shots si durée > 5s. Inclut le bloc qualité cinématique + contraintes de sécurité. 80-150 mots max. EN ANGLAIS.]

===FIN===

## ANTI-PATTERNS — ne jamais écrire
- "révolutionnaire", "premium feel", "engageant", "iconique", "cinematic" seul sans contexte
- Listes de 3 concepts (prendre position)
- "Il est important de noter que"
- Voix off en anglais (toujours en FR sauf si demandé)
- Em dash overuse
- Plus d'UN mouvement de caméra par shot`

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let description: string
  let ratio:       string
  let duration:    number
  let quality:     string
  let numRefs:     number

  try {
    const body = await req.json()
    description = (body.description ?? '').trim()
    ratio       = body.ratio      ?? '16:9'
    duration    = body.duration   ?? 8
    quality     = body.quality    ?? 'standard'
    numRefs     = body.numRefs    ?? 0

    if (!description) return NextResponse.json({ error: 'Description requise' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: `Parsing: ${(e as Error).message}` }, { status: 400 })
  }

  const shots = duration <= 5 ? 2 : duration <= 10 ? 3 : 4
  const refsNote = numRefs > 0
    ? `Le client a fourni ${numRefs} image(s) de référence — utilise @Image1, @Image2... avec un rôle explicite dans le Prompt final.`
    : `Pas d'image de référence fournie — le prompt s'appuie uniquement sur le texte.`

  const userMessage = `Brief client :
"${description}"

Paramètres techniques :
- Ratio : ${ratio}
- Durée : ${duration} secondes
- Qualité : ${quality === 'fast' ? 'S2.0 Fast (rendu rapide)' : 'S2.0 Standard (meilleure qualité)'}
- Nombre de shots attendus : ${shots}
- ${refsNote}

Génère la pré-production complète selon le format demandé.`

  try {
    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      system:     PREPROD_SYSTEM,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    // Parse les 5 blocs
    const extract = (key: string) => {
      const markers: Record<string, string> = {
        concept:      '===CONCEPT===',
        script:       '===SCRIPT===',
        storyboard:   '===STORYBOARD===',
        ambiance:     '===AMBIANCE===',
        promptFinal:  '===PROMPT_FINAL===',
      }
      const end: Record<string, string> = {
        concept:     '===SCRIPT===',
        script:      '===STORYBOARD===',
        storyboard:  '===AMBIANCE===',
        ambiance:    '===PROMPT_FINAL===',
        promptFinal: '===FIN===',
      }
      const start = text.indexOf(markers[key])
      const stop  = text.indexOf(end[key])
      if (start === -1) return ''
      const content = stop !== -1
        ? text.slice(start + markers[key].length, stop)
        : text.slice(start + markers[key].length)
      return content.trim()
    }

    return NextResponse.json({
      concept:     extract('concept'),
      script:      extract('script'),
      storyboard:  extract('storyboard'),
      ambiance:    extract('ambiance'),
      promptFinal: extract('promptFinal'),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
