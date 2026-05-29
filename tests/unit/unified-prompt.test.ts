// tests/unit/unified-prompt.test.ts
// Agent Tester — contrat d'extraction du PROMPT_FINAL_UNIFIE produit par le Storyboarder.
// Ce bloc est le SEUL texte envoyé à BytePlus dans le pipeline V1 (1 appel multi-shot).
// S'il est mal extrait, BytePlus reçoit un mauvais prompt → vidéo ratée silencieusement.

import { describe, it, expect } from 'vitest'
import { parseUnifiedPrompt } from '@/lib/claude/agents/storyboarder'

// Sortie storyboarder réaliste : N scènes d'affichage + bloc unifié final
const STORYBOARDER_OUTPUT = `SCÈNE 1 [5s] — Ouverture
Prompt Seedance: Slow push-in toward the bottle, soft golden hour lighting, a hand grasps it.
Description FR: La main saisit le flacon dans une lumière chaude.

SCÈNE 2 [5s] — Révélation
Prompt Seedance: Lateral pan across the label, dramatic rim light against dark background.
Description FR: Travelling latéral sur l'étiquette.

PROMPT_FINAL_UNIFIE
slow push-in on bottle, golden hour light, hand grasps || lateral pan across label, rim light, slow reveal || wide pull-back, soft window light, product centered`

describe('parseUnifiedPrompt — extraction du bloc multi-shot BytePlus', () => {
  it('extrait le contenu après le marqueur PROMPT_FINAL_UNIFIE', () => {
    const result = parseUnifiedPrompt(STORYBOARDER_OUTPUT)
    expect(result).toBe(
      'slow push-in on bottle, golden hour light, hand grasps || lateral pan across label, rim light, slow reveal || wide pull-back, soft window light, product centered',
    )
  })

  it('préserve les séparateurs " || " entre shots', () => {
    const result = parseUnifiedPrompt(STORYBOARDER_OUTPUT)
    expect(result?.split(' || ')).toHaveLength(3)
  })

  it('n\'inclut pas les scènes d\'affichage qui précèdent le bloc', () => {
    const result = parseUnifiedPrompt(STORYBOARDER_OUTPUT)
    expect(result).not.toContain('Description FR')
    expect(result).not.toContain('SCÈNE')
  })

  it('retourne null quand le bloc PROMPT_FINAL_UNIFIE est absent', () => {
    const onlyScenes = `SCÈNE 1 [5s] — Ouverture
Prompt Seedance: push-in.
Description FR: ouverture.`
    expect(parseUnifiedPrompt(onlyScenes)).toBeNull()
  })

  it('trim les espaces autour du bloc extrait', () => {
    const padded = `PROMPT_FINAL_UNIFIE
   shot one || shot two   `
    expect(parseUnifiedPrompt(padded)).toBe('shot one || shot two')
  })

  it('s\'arrête au premier saut de ligne double (n\'avale pas le texte suivant)', () => {
    const withTrailing = `PROMPT_FINAL_UNIFIE
shot one || shot two

Note: ceci ne doit pas être inclus.`
    expect(parseUnifiedPrompt(withTrailing)).toBe('shot one || shot two')
  })

  it('extrait le bloc même en fin de chaîne sans saut de ligne final', () => {
    const atEnd = `bla bla\nPROMPT_FINAL_UNIFIE\nshot final unique`
    expect(parseUnifiedPrompt(atEnd)).toBe('shot final unique')
  })
})
