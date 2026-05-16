/**
 * scripts/generate-showcase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Génère les 6 vidéos showcase de la landing en appelant Seedance 2.0 via fal.ai
 * et les enregistre dans /public/showcase/ pour être servies statiquement.
 *
 * Usage :
 *   1. Mettre FAL_KEY dans .env.local
 *   2. `npm run generate:showcase`         (génère les 6 vidéos manquantes)
 *   3. `npm run generate:showcase -- --all` (régénère tout, écrase l'existant)
 *   4. `npm run generate:showcase -- --slug=cafe-de-flore` (régénère 1 seule)
 *
 * Coût estimé : ~9 € par vidéo de 8s en 720p audio inclus → ~54 € pour les 6.
 * Durée totale : ~10 à 20 minutes (les générations Seedance prennent 2-4 min chacune).
 */

import { fal } from '@fal-ai/client'
import fs from 'node:fs/promises'
import path from 'node:path'

// ─── Charge .env.local si présent ────────────────────────────────────────────
try {
  const envText = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  // .env.local optionnel — l'utilisateur peut aussi exporter directement
}

// ─── Briefs pour les 6 vidéos showcase ───────────────────────────────────────
// Prompts en anglais — Seedance répond significativement mieux à l'anglais cinématique.
const BRIEFS = [
  {
    slug:     'cafe-de-flore',
    title:    'Café de Flore — Reels automne',
    prompt:   'Parisian café at golden hour, espresso ritual on white marble counter, soft window light, intimate close-up of hands and steam rising, warm bistro interior with brass fixtures, contemplative pacing, cinematic 35mm look, shallow depth of field',
    duration: 8,
    aspect:   '9:16',
  },
  {
    slug:     'medtech-startup',
    title:    'MedTech — Lancement LinkedIn',
    prompt:   'Modern medical research facility, scientist examining holographic patient data, clean white surfaces with blue LED accents, focused close-up of expert hands on touchscreen, professional documentary lighting, slow tracking shot, depth of field, B2B corporate film aesthetic',
    duration: 8,
    aspect:   '16:9',
  },
  {
    slug:     'maison-lumiere',
    title:    'Maison Lumière — Stories printemps',
    prompt:   'Luxury perfume bottle on white marble at dawn, golden Parisian morning light through linen curtains, woman in soft beige robe applying cream, art direction inspired by Vermeer paintings, contemplative slow motion, museum-grade beauty shot, cinematic 35mm',
    duration: 8,
    aspect:   '9:16',
  },
  {
    slug:     'btp-solutions',
    title:    'BTP Solutions — Brand Film',
    prompt:   'Construction site at golden hour, weathered hands of senior craftsman placing stone, three generations of builders working together, authentic documentary style, warm earth tones, natural light, French countryside heritage feeling, slow cinematic motion',
    duration: 8,
    aspect:   '16:9',
  },
  {
    slug:     'champagne-berthelot',
    title:    'Champagne Berthelot — Fêtes',
    prompt:   'Champagne pouring into crystal flute in slow motion, candlelit elegant dinner party, bubbles rising in golden light, vintage Parisian apartment interior, festive but refined atmosphere, dramatic shallow depth of field, cinematic premium spirits commercial style',
    duration: 8,
    aspect:   '16:9',
  },
  {
    slug:     'greentech-mobility',
    title:    'GreenTech Mobility — Impact report',
    prompt:   'Electric vehicle charging station in modern Scandinavian city park, woman walking past with bicycle in soft morning fog, data visualization overlays subtly fading in/out, clean minimal aesthetic, hopeful sunrise lighting, documentary corporate film style, slow tracking shot',
    duration: 8,
    aspect:   '16:9',
  },
] as const

// ─── Args CLI ────────────────────────────────────────────────────────────────
const args        = process.argv.slice(2)
const forceAll    = args.includes('--all')
const slugFilter  = args.find((a) => a.startsWith('--slug='))?.split('=')[1]

// ─── Setup paths ─────────────────────────────────────────────────────────────
const OUT_DIR = path.join(process.cwd(), 'public', 'showcase')

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true } catch { return false }
}

// ─── Génère une vidéo et la télécharge ───────────────────────────────────────
async function generateOne(brief: typeof BRIEFS[number]): Promise<void> {
  const outPath = path.join(OUT_DIR, `${brief.slug}.mp4`)
  const exists  = await fileExists(outPath)

  if (exists && !forceAll) {
    console.log(`  ⏭  ${brief.slug}.mp4 existe déjà — skip (use --all pour régénérer)`)
    return
  }

  console.log(`  🎬 Génération : ${brief.title}`)
  console.log(`     prompt : ${brief.prompt.slice(0, 80)}…`)

  const t0 = Date.now()
  const result = await fal.subscribe('fal-ai/bytedance/seedance/v1/pro/text-to-video', {
    input: {
      prompt:         brief.prompt,
      // @ts-expect-error — fal.ai type literal stricte ("2"|"3"|…) trop restrictif pour notre script
      duration:       String(brief.duration),
      resolution:     '720p',
      aspect_ratio:   brief.aspect,
      generate_audio: true,
    },
    logs: false,
  }) as { data: { video: { url: string } } }

  const videoUrl = result.data?.video?.url
  if (!videoUrl) throw new Error('No video URL returned by fal.ai')

  // Download MP4
  const res = await fetch(videoUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${videoUrl}`)
  const buf = Buffer.from(await res.arrayBuffer())

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(outPath, buf)

  const sizeMB = (buf.byteLength / 1024 / 1024).toFixed(1)
  const sec    = ((Date.now() - t0) / 1000).toFixed(0)
  console.log(`  ✓  ${brief.slug}.mp4  —  ${sizeMB} MB  —  ${sec}s\n`)
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.FAL_KEY) {
    console.error('\n❌ FAL_KEY manquant dans .env.local')
    console.error('   1. Crée un compte sur https://fal.ai')
    console.error('   2. Récupère ta clé dans Settings > Keys')
    console.error('   3. Ajoute dans .env.local : FAL_KEY=fal-...\n')
    process.exit(1)
  }

  fal.config({ credentials: process.env.FAL_KEY })

  const toRun = slugFilter
    ? BRIEFS.filter((b) => b.slug === slugFilter)
    : BRIEFS

  if (toRun.length === 0) {
    console.error(`\n❌ Aucun brief trouvé pour --slug=${slugFilter}\n`)
    console.error('   Slugs disponibles :', BRIEFS.map((b) => b.slug).join(', '))
    process.exit(1)
  }

  console.log(`\n🎬 Génération de ${toRun.length} vidéo${toRun.length > 1 ? 's' : ''} showcase via Seedance 2.0`)
  console.log(`   Coût estimé : ~${toRun.length * 9} € · durée ~${toRun.length * 3} min\n`)

  let ok = 0, fail = 0
  for (const brief of toRun) {
    try {
      await generateOne(brief)
      ok++
    } catch (err) {
      console.error(`  ✗  ${brief.slug} : ${(err as Error).message}\n`)
      fail++
    }
  }

  console.log(`\n📦 Terminé : ${ok} succès · ${fail} échec(s)`)
  console.log(`   Les vidéos sont dans /public/showcase/`)
  console.log(`   Lance \`npm run dev\` et regarde la landing — le carousel les affiche automatiquement.\n`)
}

main().catch((err) => {
  console.error('\n💥 Erreur fatale :', err)
  process.exit(1)
})
