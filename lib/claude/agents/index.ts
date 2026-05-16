// lib/claude/agents/index.ts
//
// Orchestrateur des 5 agents IA ScenIQ.
// Lance Director, Scriptwriter, Storyboarder, Music Supervisor, Visual Director
// en parallèle (Promise.allSettled — un agent qui plante ne tue pas les autres).
//
// Le Storyboarder est traité différemment : il a un prompt dynamique (sceneCount,
// avgSec dérivés de la durée totale), et son output est parsé pour extraire les scènes.

import { runDirector }        from './director'
import { runScriptwriter }    from './scriptwriter'
import { runStoryboarder }    from './storyboarder'
import { runMusicSupervisor } from './music-supervisor'
import { runVisualDirector }  from './visual-director'
import type { ParsedScene, AssetRef } from './storyboarder'

export type AgentId =
  | 'director'
  | 'scriptwriter'
  | 'storyboarder'
  | 'music'
  | 'visual'

export interface AgentResult {
  agentId:  AgentId
  content:  string | null
  error:    string | null
}

export interface AllAgentsResult {
  director:     AgentResult
  scriptwriter: AgentResult
  storyboarder: AgentResult & { scenes: ParsedScene[] }
  music:        AgentResult
  visual:       AgentResult
  /** Nombre d'agents qui ont réussi (sur 5) */
  successCount: number
}

/**
 * Lance les 5 agents en parallèle à partir d'un brief.
 *
 * @param brief        Texte du brief créatif (2 lignes minimum)
 * @param durationSec  Durée cible du film (15, 30, 45 ou 60s)
 * @param assets       Assets Brand Memory disponibles — passés au Storyboarder (V1.5)
 *                     pour que chaque prompt Seedance référence les assets par nom.
 * @returns            Outputs structurés des 5 agents + scenes parsées du Storyboarder
 */
export async function runAllAgents(
  brief:       string,
  durationSec: number     = 30,
  assets?:     AssetRef[],
): Promise<AllAgentsResult> {
  const [
    directorRes,
    scriptwriterRes,
    storyboarderRes,
    musicRes,
    visualRes,
  ] = await Promise.allSettled([
    runDirector(brief),
    runScriptwriter(brief, durationSec),
    runStoryboarder(brief, durationSec, assets),
    runMusicSupervisor(brief),
    runVisualDirector(brief),
  ])

  const toResult = (
    id: AgentId,
    settled: PromiseSettledResult<{ content: string; error: string | null }>,
  ): AgentResult => {
    if (settled.status === 'fulfilled') {
      return { agentId: id, content: settled.value.content, error: settled.value.error }
    }
    return { agentId: id, content: null, error: String(settled.reason) }
  }

  // Le Storyboarder a une shape différente (inclut .scenes)
  const storyboarder = (() => {
    if (storyboarderRes.status === 'fulfilled') {
      return {
        agentId: 'storyboarder' as const,
        content: storyboarderRes.value.content,
        error:   storyboarderRes.value.error,
        scenes:  storyboarderRes.value.scenes,
      }
    }
    return {
      agentId: 'storyboarder' as const,
      content: null,
      error:   String(storyboarderRes.reason),
      scenes:  [],
    }
  })()

  const result: AllAgentsResult = {
    director:     toResult('director',     directorRes),
    scriptwriter: toResult('scriptwriter', scriptwriterRes),
    storyboarder,
    music:        toResult('music',        musicRes),
    visual:       toResult('visual',       visualRes),
    successCount: 0,
  }

  result.successCount = [
    result.director,
    result.scriptwriter,
    result.storyboarder,
    result.music,
    result.visual,
  ].filter((r) => r.content !== null && r.error === null).length

  return result
}

// Re-exports utiles pour les routes API et les tests
export { DIRECTOR_SYSTEM }                        from './director'
export { buildScriptwriterPrompt }                from './scriptwriter'
export { buildStoryboarderPrompt, parseScenes }   from './storyboarder'
export { MUSIC_SUPERVISOR_SYSTEM }                from './music-supervisor'
export { VISUAL_DIRECTOR_SYSTEM }                 from './visual-director'
export type { ParsedScene, AssetRef }             from './storyboarder'
