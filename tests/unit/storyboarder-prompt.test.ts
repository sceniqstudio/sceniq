// tests/unit/storyboarder-prompt.test.ts
// Agent Tester — Vérifie que le system prompt du Storyboarder force le style action/mouvement
// nécessaire pour exploiter Seedance 2.0 reference-to-video (cf memory `seedance-model-choice`).

import { describe, it, expect } from 'vitest'
import { buildStoryboarderPrompt } from '@/lib/claude/agents/storyboarder'

describe('buildStoryboarderPrompt — calibration reference-to-video', () => {
  const prompt = buildStoryboarderPrompt(4, 8)

  describe('injection des paramètres dynamiques', () => {
    it('injecte le nombre de scènes demandé', () => {
      expect(prompt).toMatch(/EXACTEMENT\s+4\s+scènes/)
    })

    it('injecte la durée moyenne par scène', () => {
      expect(prompt).toMatch(/environ\s+8\s+secondes/)
    })

    it('précise la fenêtre de durée Seedance (4 à 15s)', () => {
      expect(prompt).toContain('4 et 15 secondes')
    })
  })

  describe('cadrage style action/mouvement (le cœur du prompt)', () => {
    it('mentionne explicitement ACTION et MOUVEMENT comme principe clé', () => {
      expect(prompt).toMatch(/ACTION/i)
      expect(prompt).toMatch(/MOUVEMENT/i)
      expect(prompt).toMatch(/ÉVOLUTION TEMPORELLE/i)
    })

    it('liste des exemples de mouvements de caméra', () => {
      const cameraKeywords = ['push-in', 'dolly', 'pan', 'tracking', 'tilt']
      cameraKeywords.forEach((kw) => {
        expect(prompt.toLowerCase()).toContain(kw)
      })
    })

    it('liste des exemples d\'action sujet', () => {
      const actionKeywords = ['grasps', 'turns', 'walks']
      actionKeywords.forEach((kw) => {
        expect(prompt.toLowerCase()).toContain(kw)
      })
    })

    it('mentionne explicitement Brand Memory comme porteur du look', () => {
      expect(prompt).toMatch(/Brand Memory/i)
    })
  })

  describe('liste des anti-patterns à éviter', () => {
    it('liste les mots-clés flous à bannir', () => {
      // Note : ces mots APPARAISSENT dans le prompt (dans la section "À ÉVITER"),
      // mais on vérifie que le prompt les nomme bien pour que l'agent les évite.
      const antiPatterns = ['cinematic', 'premium', 'elegant', 'moody', 'luxurious', 'aesthetic']
      antiPatterns.forEach((word) => {
        expect(prompt.toLowerCase()).toContain(word)
      })
    })

    it('a une section "À ÉVITER" claire', () => {
      expect(prompt).toMatch(/À ÉVITER/i)
    })

    it('a un exemple "MAUVAIS" vs "BON" en regard', () => {
      expect(prompt).toMatch(/MAUVAIS/i)
      expect(prompt).toMatch(/BON/i)
    })
  })

  describe('format de sortie strict', () => {
    it('exige le format SCÈNE N [Xs]', () => {
      expect(prompt).toMatch(/SCÈNE N \[Xs\]/)
    })

    it('exige un Prompt Seedance en anglais', () => {
      expect(prompt).toContain('Prompt Seedance:')
      expect(prompt).toMatch(/anglais/i)
    })

    it('exige une Description FR courte (résumé client)', () => {
      expect(prompt).toContain('Description FR:')
      expect(prompt).toMatch(/résumé client/i)
    })
  })

  describe('injection Brand Memory assets (V1.5)', () => {
    it('sans assets — pas de section ASSETS dans le prompt', () => {
      const p = buildStoryboarderPrompt(4, 8)
      expect(p).not.toMatch(/ASSETS BRAND MEMORY/i)
    })

    it('avec assets — injecte une section ASSETS BRAND MEMORY', () => {
      const p = buildStoryboarderPrompt(4, 8, [
        { type: 'logo', name: 'logo-blanc.svg' },
        { type: 'image', name: 'flacon-hero.jpg' },
      ])
      expect(p).toMatch(/ASSETS BRAND MEMORY/i)
    })

    it('avec assets — liste chaque asset avec son type et son nom', () => {
      const p = buildStoryboarderPrompt(4, 8, [
        { type: 'logo', name: 'logo-blanc.svg' },
        { type: 'image', name: 'flacon-hero.jpg' },
      ])
      expect(p).toContain('logo')
      expect(p).toContain('logo-blanc.svg')
      expect(p).toContain('image')
      expect(p).toContain('flacon-hero.jpg')
    })

    it('avec assets — enjoint le storyboarder à les mentionner explicitement', () => {
      const p = buildStoryboarderPrompt(4, 8, [
        { type: 'logo', name: 'logo.svg' },
      ])
      // Le prompt doit instruire l'agent à référencer les assets dans ses prompts
      expect(p).toMatch(/référence.*asset|mention.*asset|asset.*prompt/i)
    })

    it('avec tableau vide — comportement identique à sans assets', () => {
      const withEmpty  = buildStoryboarderPrompt(4, 8, [])
      const withNone   = buildStoryboarderPrompt(4, 8)
      // Les deux ne doivent pas contenir de section assets
      expect(withEmpty).not.toMatch(/ASSETS BRAND MEMORY/i)
      expect(withNone).not.toMatch(/ASSETS BRAND MEMORY/i)
    })
  })

  describe('robustesse aux variations de sceneCount/avgSec', () => {
    it('fonctionne pour 1 scène', () => {
      const p = buildStoryboarderPrompt(1, 15)
      expect(p).toMatch(/EXACTEMENT\s+1\s+scènes?/)
      expect(p).toMatch(/environ\s+15\s+secondes/)
    })

    it('fonctionne pour 10 scènes', () => {
      const p = buildStoryboarderPrompt(10, 4)
      expect(p).toMatch(/EXACTEMENT\s+10\s+scènes/)
      expect(p).toMatch(/environ\s+4\s+secondes/)
    })
  })
})
