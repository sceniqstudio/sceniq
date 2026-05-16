// tests/snapshots/storyboarder.snapshot.test.ts
// Agent : Agent Tester
// Objectif : détecter les régressions de structure si le prompt ou le modèle change
// ⚠️ Ne pas snapshotter le texte verbatim — capturer la structure

import { describe, it, expect } from 'vitest'
import Anthropic from '@anthropic-ai/sdk'
import { FIXTURE_QUERIES } from '../fixtures/data'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STORYBOARDER_SYSTEM = `Tu es un storyboarder professionnel spécialisé en génération vidéo IA (Seedance 2.0).
À partir du brief, tu produis EXACTEMENT 4 scènes numérotées.
Pour chaque scène, tu écris un prompt en anglais optimisé pour Seedance 2.0.
FORMAT STRICT pour chaque scène :
SCÈNE N [Xs] — Titre court
Prompt Seedance: [prompt anglais cinématique]
Description FR: [description visuelle]`

async function callStoryboarder(brief: string) {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: STORYBOARDER_SYSTEM,
    messages: [{ role: 'user', content: `Brief : ${brief}` }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : ''
}

function parseSceneCount(text: string): number {
  return (text.match(/SCÈNE\s+\d+/gi) || []).length
}

function hasSeedancePrompts(text: string): boolean {
  return text.includes('Prompt Seedance:')
}

function hasDescriptionsFR(text: string): boolean {
  return text.includes('Description FR:')
}

describe('Snapshot: Storyboarder agent', () => {
  it('génère exactement 4 scènes', async () => {
    const output = await callStoryboarder(FIXTURE_QUERIES.storyboarder)

    // Structure — stable même si le contenu textuel varie
    const snapshot = {
      sceneCount:        parseSceneCount(output),
      hasSeedancePrompts: hasSeedancePrompts(output),
      hasDescriptionsFR: hasDescriptionsFR(output),
      hasContent:        output.length > 100,
      error:             null,
    }

    expect(snapshot).toMatchSnapshot()
    // Assertion dure sur le nombre de scènes
    expect(snapshot.sceneCount).toBe(4)
    expect(snapshot.hasSeedancePrompts).toBe(true)
  }, 30_000)

  it('ne génère pas d\'erreur sur un brief court', async () => {
    const output = await callStoryboarder('Spot 15s pour une startup tech.')

    expect(output.length).toBeGreaterThan(50)
    expect(output).not.toContain('ERROR')
    expect(output).not.toContain('Je ne peux pas')
  }, 30_000)
})

// ──────────────────────────────────────────────────────────────────────────────
// tests/snapshots/director.snapshot.test.ts
// ──────────────────────────────────────────────────────────────────────────────

const DIRECTOR_SYSTEM = `Tu es un directeur artistique vidéo senior.
À partir du brief, tu proposes le concept central, l'angle narratif, le ton émotionnel, la cible, et la promesse visuelle.
Format : sections courtes avec titres en MAJUSCULES.`

async function callDirector(brief: string) {
  const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: DIRECTOR_SYSTEM,
    messages: [{ role: 'user', content: `Brief : ${brief}` }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : ''
}

describe('Snapshot: Director agent', () => {
  it('retourne une structure avec sections en majuscules', async () => {
    const output = await callDirector(FIXTURE_QUERIES.director)
    const hasMajSections = /^[A-ZÉÈÀÙÎÔÊ\s]{3,}$/m.test(output)

    expect({
      hasContent:       output.length > 100,
      hasMajSections,
      error:            null,
    }).toMatchSnapshot()
  }, 30_000)
})
