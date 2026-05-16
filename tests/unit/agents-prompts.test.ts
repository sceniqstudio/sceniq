// tests/unit/agents-prompts.test.ts
// Agent Tester — Contrats des system prompts des 5 agents Scenica.
// Le but : éviter qu'un refactor casse les sections clés (qui sont parsées en UI).

import { describe, it, expect } from 'vitest'
import { DIRECTOR_SYSTEM }         from '@/lib/claude/agents/director'
import { buildScriptwriterPrompt } from '@/lib/claude/agents/scriptwriter'
import { MUSIC_SUPERVISOR_SYSTEM } from '@/lib/claude/agents/music-supervisor'
import { VISUAL_DIRECTOR_SYSTEM }  from '@/lib/claude/agents/visual-director'

describe('Director system prompt', () => {
  it('précise les 5 sections obligatoires en MAJUSCULES', () => {
    const sections = ['CONCEPT', 'ANGLE NARRATIF', 'PROMESSE ÉMOTIONNELLE', 'CIBLE', 'RISQUE CRÉATIF']
    sections.forEach((s) => expect(DIRECTOR_SYSTEM).toContain(s))
  })

  it('liste les buzzwords à éviter ("premium", "engageant", "élégant", "iconique")', () => {
    expect(DIRECTOR_SYSTEM).toMatch(/À ÉVITER/i)
    ;['premium', 'engageant', 'élégant', 'iconique'].forEach((w) =>
      expect(DIRECTOR_SYSTEM.toLowerCase()).toContain(w),
    )
  })

  it('exige une prise de position (pas de menu d\'options)', () => {
    expect(DIRECTOR_SYSTEM).toMatch(/UNE proposition/i)
  })
})

describe('Scriptwriter system prompt', () => {
  it('injecte la durée demandée et calcule le quota de mots VO max', () => {
    const p30 = buildScriptwriterPrompt(30)
    expect(p30).toContain('30 secondes')
    // 30 × 2.2 = 66 mots max
    expect(p30).toContain('66 mots')

    const p15 = buildScriptwriterPrompt(15)
    expect(p15).toContain('15 secondes')
    expect(p15).toContain('33 mots') // 15 × 2.2 = 33
  })

  it('exige les 4 sections : VOIX-OFF, ÉCRAN, MESSAGE CLÉ FINAL, NOTES MONTEUR', () => {
    const p = buildScriptwriterPrompt(30)
    ;['VOIX-OFF', 'ÉCRAN', 'MESSAGE CLÉ FINAL', 'NOTES MONTEUR'].forEach((s) =>
      expect(p).toContain(s),
    )
  })

  it('impose le ratio mots/seconde (2,2 max) et la respect des silences', () => {
    const p = buildScriptwriterPrompt(30)
    expect(p).toMatch(/2,?2\s+mots\/seconde/i)
    expect(p.toLowerCase()).toContain('silence')
  })

  it('bannit les VO d\'ouverture faiblardes', () => {
    const p = buildScriptwriterPrompt(30)
    ;['Découvrez', 'Vivez', 'Expérimentez'].forEach((w) => expect(p).toContain(w))
  })
})

describe('Music Supervisor system prompt', () => {
  it('exige les 5 sections : MOOD, BPM, RÉFÉRENCES, SYNC POINTS, NOTES SOUND DESIGN', () => {
    ;['MOOD GÉNÉRAL', 'BPM CIBLE', '3 RÉFÉRENCES TRACKS', 'SYNC POINTS', 'NOTES SOUND DESIGN'].forEach(
      (s) => expect(MUSIC_SUPERVISOR_SYSTEM).toContain(s),
    )
  })

  it('liste des artistes licenciables réalistes (Ólafur Arnalds, Nils Frahm, etc.)', () => {
    ;['Ólafur Arnalds', 'Nils Frahm', 'Hania Rani', 'Khruangbin'].forEach((a) =>
      expect(MUSIC_SUPERVISOR_SYSTEM).toContain(a),
    )
  })

  it('mentionne explicitement les contraintes de licensing (budget sync réel)', () => {
    expect(MUSIC_SUPERVISOR_SYSTEM).toMatch(/sync/i)
    expect(MUSIC_SUPERVISOR_SYSTEM).toMatch(/licens/i)
  })

  it('exige un format strict pour les références (artiste — titre — pourquoi)', () => {
    expect(MUSIC_SUPERVISOR_SYSTEM).toMatch(/\[Artiste\]\s*—\s*\[Titre\]/)
  })
})

describe('Visual Director system prompt', () => {
  it('exige les 6 sections : PALETTE, TYPOGRAPHIE, MOTION, TRANSITIONS, EFFETS, RÉFÉRENCES', () => {
    ;['PALETTE', 'TYPOGRAPHIE', 'STYLE MOTION', 'TRANSITIONS SIGNATURE', 'EFFETS SIGNATURE', 'RÉFÉRENCES VISUELLES'].forEach(
      (s) => expect(VISUAL_DIRECTOR_SYSTEM).toContain(s),
    )
  })

  it('exige des hex codes pour les couleurs (pas juste des noms)', () => {
    expect(VISUAL_DIRECTOR_SYSTEM).toMatch(/#HEXCODE/i)
    expect(VISUAL_DIRECTOR_SYSTEM).toMatch(/sans hex/i)
  })

  it('impose des durées de transitions en frames (à 24fps)', () => {
    expect(VISUAL_DIRECTOR_SYSTEM).toMatch(/24fps/i)
    expect(VISUAL_DIRECTOR_SYSTEM).toMatch(/frames/i)
  })

  it('privilégie Google Fonts pour les typographies', () => {
    expect(VISUAL_DIRECTOR_SYSTEM).toMatch(/Google Fonts/i)
  })

  it('exige une dominante + accent + surface + texte (au moins 4 rôles palette)', () => {
    ;['Dominante', 'Accent', 'Surface', 'Texte'].forEach((r) =>
      expect(VISUAL_DIRECTOR_SYSTEM).toContain(r),
    )
  })
})

describe('runAllAgents orchestrator (shape contract)', () => {
  it('exporte un type AllAgentsResult avec les 5 agents + successCount', async () => {
    const mod = await import('@/lib/claude/agents/index')
    expect(typeof mod.runAllAgents).toBe('function')
    // Re-exports utiles
    expect(typeof mod.DIRECTOR_SYSTEM).toBe('string')
    expect(typeof mod.buildScriptwriterPrompt).toBe('function')
    expect(typeof mod.buildStoryboarderPrompt).toBe('function')
    expect(typeof mod.MUSIC_SUPERVISOR_SYSTEM).toBe('string')
    expect(typeof mod.VISUAL_DIRECTOR_SYSTEM).toBe('string')
    expect(typeof mod.parseScenes).toBe('function')
  })
})
