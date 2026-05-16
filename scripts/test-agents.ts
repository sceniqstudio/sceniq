#!/usr/bin/env npx tsx
/**
 * scripts/test-agents.ts
 *
 * Test rapide des 5 agents IA ScenIQ sans passer par l'app (pas de Supabase/Clerk).
 * Appelle runAllAgents() directement et affiche les outputs dans le terminal.
 *
 * Usage :
 *   npx tsx scripts/test-agents.ts
 *   npx tsx scripts/test-agents.ts "Brief personnalisé en une ligne"
 */

import { runAllAgents } from '../lib/claude/agents'

const brief = process.argv[2] ??
  'Lancer ScenIQ, le SaaS de production vidéo IA pour agences pub françaises. Brief → 5 agents → vidéo Seedance 2.0 en 30 secondes.'

const DURATION = 30 // secondes

console.log('\n╔══════════════════════════════════════════════════════╗')
console.log('║          CREATIQ — Test des 5 agents IA             ║')
console.log('╠══════════════════════════════════════════════════════╣')
console.log(`║  Brief    : ${brief.slice(0, 40).padEnd(40)} ║`)
console.log(`║  Durée    : ${String(DURATION + 's').padEnd(40)} ║`)
console.log('╚══════════════════════════════════════════════════════╝\n')

console.log('⏳ Lancement des 5 agents en parallèle...\n')

async function main() {
  const t0 = Date.now()

  const result = await runAllAgents(brief, DURATION)

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

  console.log(`✅ ${result.successCount}/5 agents ont réussi en ${elapsed}s\n`)

  const AGENTS = [
    { label: '🎬 Director',          r: result.director },
    { label: '✍️  Scriptwriter',      r: result.scriptwriter },
    { label: '🎞️  Storyboarder',      r: result.storyboarder },
    { label: '🎵 Music Supervisor',   r: result.music },
    { label: '🎨 Visual Director',    r: result.visual },
  ]

  for (const { label, r } of AGENTS) {
    console.log('─'.repeat(60))
    if (r.error) {
      console.log(`${label}  ❌  ERREUR : ${r.error}`)
    } else {
      console.log(`${label}  ✅`)
      console.log(r.content?.slice(0, 600) + (r.content && r.content.length > 600 ? '\n[…tronqué]' : ''))
    }
    console.log()
  }

  // Résumé Storyboarder
  if (result.storyboarder.scenes.length > 0) {
    console.log('─'.repeat(60))
    console.log(`🎞️  Storyboarder — ${result.storyboarder.scenes.length} scènes parsées :`)
    for (const s of result.storyboarder.scenes) {
      console.log(`  Scène ${s.index} [${s.duration}s] : ${s.description}`)
    }
    console.log()
  }

  console.log('═'.repeat(60))
  console.log('  Test terminé.')
  console.log('═'.repeat(60))
}

main().catch((err) => {
  console.error('❌ Erreur fatale :', err)
  process.exit(1)
})
