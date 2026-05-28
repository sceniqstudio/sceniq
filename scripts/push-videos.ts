#!/usr/bin/env tsx
/**
 * scripts/push-videos.ts — ScenIQ
 * ─────────────────────────────────────────────────────────────────────────────
 * Pousse les vidéos showcase depuis public/showcase/ vers Cloudflare R2.
 *
 * Usage :
 *   npm run push:videos                  → pousse TOUS les .mp4 du dossier
 *   npm run push:videos -- --new         → seulement les fichiers absents de R2
 *   npm run push:videos -- exemple27.mp4 → pousse 1 fichier précis
 *   npm run push:videos -- --dry         → simule sans uploader
 *
 * Auth : wrangler lit automatiquement CLOUDFLARE_API_TOKEN (env var)
 * ou le compte enregistré via `npx wrangler login`.
 *
 * Bucket R2 cible : sceniq-showcase
 * Dossier local    : public/showcase/
 */

import { execSync }  from 'node:child_process'
import fs            from 'node:fs'
import path          from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Config ───────────────────────────────────────────────────────────────────

const BUCKET    = 'sceniq-showcase'
const LOCAL_DIR = 'public/showcase'
const EXT       = '.mp4'

// ─── Charger .env.local (pour CLOUDFLARE_API_TOKEN si défini là) ──────────────

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

const args     = process.argv.slice(2)
const onlyNew  = args.includes('--new')
const dryRun   = args.includes('--dry')
const specific = args.find(a => a.endsWith(EXT))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
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

// Sélectionne les fichiers à traiter
let files: string[]

if (specific) {
  // Fichier unique passé en argument
  const full = path.join(showcaseDir, specific)
  if (!fs.existsSync(full)) {
    console.error(`❌  Fichier introuvable : ${specific}`)
    process.exit(1)
  }
  files = [specific]
} else {
  // Tous les .mp4 du dossier, triés par nom
  files = fs.readdirSync(showcaseDir)
    .filter(f => f.endsWith(EXT))
    .sort()
}

if (files.length === 0) {
  console.log(`ℹ️  Aucun fichier .mp4 dans ${LOCAL_DIR}`)
  process.exit(0)
}

// ─── Affichage récap ─────────────────────────────────────────────────────────

const totalSize = files.reduce((acc, f) => {
  const stat = fs.statSync(path.join(showcaseDir, f))
  return acc + stat.size
}, 0)

console.log('')
console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║         ScenIQ — Push vidéos → Cloudflare R2            ║')
console.log('╚══════════════════════════════════════════════════════════╝')
console.log(`  Bucket  : ${BUCKET}`)
console.log(`  Dossier : ${LOCAL_DIR}/`)
console.log(`  Fichiers: ${files.length} vidéo${files.length > 1 ? 's' : ''} (${formatSize(totalSize)} total)`)
if (onlyNew)  console.log('  Mode    : --new (ignore les fichiers déjà sur R2)')
if (dryRun)   console.log('  Mode    : --dry (simulation, aucun upload)')
console.log('')

// ─── Upload ──────────────────────────────────────────────────────────────────

const results: { file: string; status: 'uploaded' | 'skipped' | 'error' | 'dry' }[] = []
let uploaded = 0, skipped = 0, errors = 0

for (const filename of files) {
  const filePath = path.join(showcaseDir, filename)
  const stat     = fs.statSync(filePath)
  const size     = formatSize(stat.size)

  if (dryRun) {
    console.log(`  🔵 [dry] ${filename} (${size})`)
    results.push({ file: filename, status: 'dry' })
    continue
  }

  if (onlyNew) {
    process.stdout.write(`  🔍 ${filename} (${size}) — vérif R2... `)
    const exists = fileExistsOnR2(filename)
    if (exists) {
      console.log('déjà présent, ignoré ✓')
      results.push({ file: filename, status: 'skipped' })
      skipped++
      continue
    }
    console.log('absent → upload')
  } else {
    console.log(`  ⬆️  ${filename} (${size})`)
  }

  const ok = uploadFile(filename, filePath)

  if (ok) {
    console.log(`  ✅ ${filename} — OK`)
    results.push({ file: filename, status: 'uploaded' })
    uploaded++
  } else {
    console.log(`  ❌ ${filename} — ERREUR`)
    results.push({ file: filename, status: 'error' })
    errors++
  }
}

// ─── Résumé ──────────────────────────────────────────────────────────────────

console.log('')
console.log('─────────────────────────────────────────────────────────────')

if (dryRun) {
  console.log(`  ✅ Dry run — ${files.length} fichier${files.length > 1 ? 's' : ''} prêt${files.length > 1 ? 's' : ''} à l'upload`)
} else {
  if (uploaded)  console.log(`  ✅ ${uploaded} fichier${uploaded > 1 ? 's' : ''} uploadé${uploaded > 1 ? 's' : ''}`)
  if (skipped)   console.log(`  ⏭️  ${skipped} ignoré${skipped > 1 ? 's' : ''} (déjà sur R2)`)
  if (errors)    console.log(`  ❌ ${errors} erreur${errors > 1 ? 's' : ''}`)

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
