#!/usr/bin/env tsx
/**
 * scripts/push-videos.ts — ScenIQ
 * ─────────────────────────────────────────────────────────────────────────────
 * Pousse les vidéos showcase depuis public/showcase/ vers Cloudflare R2.
 * Compression automatique via ffmpeg si le fichier dépasse MAX_MB (2 Mo).
 *
 * Usage :
 *   npm run push:videos                  → pousse TOUS les .mp4 (compresse si besoin)
 *   npm run push:videos -- --new         → seulement les fichiers absents de R2
 *   npm run push:videos -- exemple27.mp4 → pousse 1 fichier précis
 *   npm run push:videos -- --dry         → simule sans uploader ni compresser
 *   npm run push:videos -- --no-compress → upload brut sans compression
 *
 * Auth : wrangler lit automatiquement CLOUDFLARE_API_TOKEN (env var)
 * ou le compte enregistré via `npx wrangler login`.
 *
 * Bucket R2 cible : sceniq-showcase
 * Dossier local    : public/showcase/
 */

import { execSync }       from 'node:child_process'
import fs                 from 'node:fs'
import path               from 'node:path'
import os                 from 'node:os'
import { fileURLToPath }  from 'node:url'

// ─── Config compression ───────────────────────────────────────────────────────

const TARGET_MB   = 1.6    // taille cible en Mo (marge confortable sous 2 Mo)
const MAX_MB      = 2.0    // seuil déclencheur : au-delà → compression automatique
const MAX_WIDTH   = 1280   // largeur max (720p si vidéo plus large)
const AUDIO_KBPS  = 96     // bitrate audio AAC fixe (qualité suffisante pour showcase)
const MIN_VID_KBPS = 200   // bitrate vidéo minimum garanti

// ─── Config upload ─────────────────────────────────────────────────────────────

const BUCKET    = 'sceniq-showcase'
const LOCAL_DIR = 'public/showcase'
const EXT       = '.mp4'

// ─── Charger .env.local ───────────────────────────────────────────────────────

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
try {
  const envText = fs.readFileSync(path.join(root, '.env.local'), 'utf-8')
  for (const line of envText.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  }
} catch { /* .env.local optionnel */ }

// ─── Parse args ───────────────────────────────────────────────────────────────

const args        = process.argv.slice(2)
const onlyNew     = args.includes('--new')
const dryRun      = args.includes('--dry')
const noCompress  = args.includes('--no-compress')
const specifics   = args.filter(a => a.endsWith(EXT))

// ─── Vérification ffmpeg ──────────────────────────────────────────────────────

function checkFfmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

const ffmpegAvailable = checkFfmpeg()
if (!ffmpegAvailable && !noCompress) {
  console.warn('  ⚠️  ffmpeg introuvable — compression désactivée (installe avec: brew install ffmpeg)')
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getVideoDuration(filePath: string): number {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { stdio: 'pipe' }
    ).toString().trim()
    const d = parseFloat(out)
    return isNaN(d) || d <= 0 ? 10 : d
  } catch {
    return 10 // fallback 10s
  }
}

/**
 * Compresse le fichier si sa taille dépasse MAX_MB.
 * Retourne le chemin du fichier temporaire compressé, ou null si pas besoin / échec.
 */
function compressIfNeeded(inputPath: string): { tmpPath: string | null; skipped: boolean } {
  if (noCompress || !ffmpegAvailable) return { tmpPath: null, skipped: true }

  const stat = fs.statSync(inputPath)
  if (stat.size <= MAX_MB * 1024 * 1024) {
    return { tmpPath: null, skipped: true }  // déjà sous le seuil
  }

  // Calcul du bitrate vidéo cible
  const duration   = getVideoDuration(inputPath)
  const totalBits  = TARGET_MB * 1024 * 1024 * 8
  const audioBits  = AUDIO_KBPS * 1000 * duration
  const videoBps   = Math.max(Math.floor((totalBits - audioBits) / duration), MIN_VID_KBPS * 1000)
  const videoKbps  = Math.floor(videoBps / 1000)

  // Fichier temporaire dans le dossier système
  const tmpPath = path.join(os.tmpdir(), `sceniq_${path.basename(inputPath, '.mp4')}_${Date.now()}.mp4`)

  try {
    process.stdout.write(`  🗜️  Compression → ${videoKbps}k vidéo + ${AUDIO_KBPS}k audio (${duration.toFixed(1)}s)... `)
    execSync(
      `ffmpeg -i "${inputPath}" ` +
      `-c:v libx264 -b:v ${videoKbps}k -maxrate ${videoKbps * 2}k -bufsize ${videoKbps * 4}k ` +
      `-preset fast -vf "scale='min(${MAX_WIDTH},iw)':-2:flags=lanczos" ` +
      `-c:a aac -b:a ${AUDIO_KBPS}k ` +
      `-movflags +faststart ` +
      `-y "${tmpPath}"`,
      { stdio: 'pipe' }
    )
    const compressedSize = fs.statSync(tmpPath).size
    console.log(`${formatSize(compressedSize)} ✓`)
    return { tmpPath, skipped: false }
  } catch (e) {
    console.log('échec (upload brut)')
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
    return { tmpPath: null, skipped: true }
  }
}

function fileExistsOnR2(filename: string): boolean {
  try {
    execSync(
      `npx wrangler r2 object get ${BUCKET}/${filename} --remote --pipe 2>/dev/null | head -c 1`,
      { stdio: 'pipe', cwd: root }
    )
    return true
  } catch {
    return false
  }
}

function uploadFile(filename: string, filePath: string): boolean {
  try {
    execSync(
      `npx wrangler r2 object put "${BUCKET}/${filename}" --file="${filePath}" --remote --content-type="video/mp4"`,
      { stdio: 'inherit', cwd: root }
    )
    return true
  } catch {
    return false
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const showcaseDir = path.join(root, LOCAL_DIR)

if (!fs.existsSync(showcaseDir)) {
  console.error(`❌  Dossier introuvable : ${LOCAL_DIR}`)
  process.exit(1)
}

let files: string[]

if (specifics.length > 0) {
  for (const s of specifics) {
    if (!fs.existsSync(path.join(showcaseDir, s))) {
      console.error(`❌  Fichier introuvable : ${s}`)
      process.exit(1)
    }
  }
  files = specifics
} else {
  files = fs.readdirSync(showcaseDir)
    .filter(f => f.endsWith(EXT))
    .sort()
}

if (files.length === 0) {
  console.log(`ℹ️  Aucun fichier .mp4 dans ${LOCAL_DIR}`)
  process.exit(0)
}

// ─── Récap ───────────────────────────────────────────────────────────────────

const totalSize = files.reduce((acc, f) => acc + fs.statSync(path.join(showcaseDir, f)).size, 0)

console.log('')
console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║         ScenIQ — Push vidéos → Cloudflare R2            ║')
console.log('╚══════════════════════════════════════════════════════════╝')
console.log(`  Bucket       : ${BUCKET}`)
console.log(`  Dossier      : ${LOCAL_DIR}/`)
console.log(`  Fichiers     : ${files.length} vidéo${files.length > 1 ? 's' : ''} (${formatSize(totalSize)} total)`)
console.log(`  Compression  : ${noCompress ? 'désactivée (--no-compress)' : ffmpegAvailable ? `auto si > ${MAX_MB} Mo → cible ${TARGET_MB} Mo` : 'désactivée (ffmpeg manquant)'}`)
if (onlyNew)  console.log('  Mode         : --new (ignore les fichiers déjà sur R2)')
if (dryRun)   console.log('  Mode         : --dry (simulation, aucun upload)')
console.log('')

// ─── Boucle upload ────────────────────────────────────────────────────────────

type FileStatus = 'uploaded' | 'skipped' | 'error' | 'dry'
const results: { file: string; status: FileStatus; originalSize: number; finalSize: number }[] = []
let uploaded = 0, skipped = 0, errors = 0

for (const filename of files) {
  const filePath     = path.join(showcaseDir, filename)
  const originalSize = fs.statSync(filePath).size

  if (dryRun) {
    const needsCompress = ffmpegAvailable && !noCompress && originalSize > MAX_MB * 1024 * 1024
    console.log(`  🔵 [dry] ${filename} (${formatSize(originalSize)})${needsCompress ? ' → sera compressé' : ''}`)
    results.push({ file: filename, status: 'dry', originalSize, finalSize: originalSize })
    continue
  }

  if (onlyNew) {
    process.stdout.write(`  🔍 ${filename} (${formatSize(originalSize)}) — vérif R2... `)
    if (fileExistsOnR2(filename)) {
      console.log('déjà présent, ignoré ✓')
      results.push({ file: filename, status: 'skipped', originalSize, finalSize: originalSize })
      skipped++
      continue
    }
    console.log('absent → upload')
  } else {
    console.log(`  ⬆️  ${filename} (${formatSize(originalSize)})`)
  }

  // Compression automatique si nécessaire
  const { tmpPath, skipped: compressionSkipped } = compressIfNeeded(filePath)
  const uploadPath  = tmpPath ?? filePath
  const finalSize   = fs.statSync(uploadPath).size

  if (!compressionSkipped && tmpPath) {
    const ratio = ((1 - finalSize / originalSize) * 100).toFixed(0)
    console.log(`     ${formatSize(originalSize)} → ${formatSize(finalSize)} (-${ratio}%)`)
  }

  const ok = uploadFile(filename, uploadPath)

  // Nettoyage du fichier temporaire
  if (tmpPath && fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)

  if (ok) {
    console.log(`  ✅ ${filename} — OK`)
    results.push({ file: filename, status: 'uploaded', originalSize, finalSize })
    uploaded++
  } else {
    console.log(`  ❌ ${filename} — ERREUR`)
    results.push({ file: filename, status: 'error', originalSize, finalSize })
    errors++
  }
}

// ─── Résumé ──────────────────────────────────────────────────────────────────

console.log('')
console.log('─────────────────────────────────────────────────────────────')

if (dryRun) {
  console.log(`  ✅ Dry run — ${files.length} fichier${files.length > 1 ? 's' : ''} prêt${files.length > 1 ? 's' : ''} à l'upload`)
} else {
  if (uploaded) {
    const uploadedResults = results.filter(r => r.status === 'uploaded')
    const totalOriginal   = uploadedResults.reduce((a, r) => a + r.originalSize, 0)
    const totalFinal      = uploadedResults.reduce((a, r) => a + r.finalSize, 0)
    const savedMB         = ((totalOriginal - totalFinal) / 1024 / 1024).toFixed(1)
    console.log(`  ✅ ${uploaded} fichier${uploaded > 1 ? 's' : ''} uploadé${uploaded > 1 ? 's' : ''}`)
    if (totalOriginal !== totalFinal) {
      console.log(`  🗜️  Compression : ${formatSize(totalOriginal)} → ${formatSize(totalFinal)} (−${savedMB} Mo économisés)`)
    }
  }
  if (skipped) console.log(`  ⏭️  ${skipped} ignoré${skipped > 1 ? 's' : ''} (déjà sur R2)`)
  if (errors)  console.log(`  ❌ ${errors} erreur${errors > 1 ? 's' : ''}`)

  if (uploaded > 0) {
    const r2Base = process.env.NEXT_PUBLIC_R2_BASE_URL?.replace(/\/$/, '') ?? ''
    console.log('')
    console.log('  Les vidéos sont disponibles immédiatement en prod :')
    if (r2Base) {
      for (const r of results.filter(r => r.status === 'uploaded')) {
        console.log(`  🌐 ${r2Base}/${r.file}`)
      }
    } else {
      console.log('  (ajoute NEXT_PUBLIC_R2_BASE_URL dans .env.local pour voir les URLs)')
    }
  }
}

console.log('')

process.exit(errors > 0 ? 1 : 0)
