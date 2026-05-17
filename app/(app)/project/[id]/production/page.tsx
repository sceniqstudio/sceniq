'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Stepper, BackStep } from '@/app/(app)/_components/Stepper'
import { useToast } from '@/app/(app)/_components/Toast'

type AgentId = 'director' | 'scriptwriter' | 'storyboarder' | 'music' | 'visual'
type AgentStatus = 'pending' | 'running' | 'ready' | 'accepted' | 'failed'

interface ProjectMeta {
  id:           string
  name:         string
  brief:        string
  format:       string
  duration_sec: number
  tone:         string
  status:       string
}

interface AgentOutput {
  agent:    AgentId
  content:  string
  accepted: boolean
  version:  number
}

interface SceneRow {
  id:              string
  scene_index:     number
  duration_sec:    number
  seedance_prompt: string
  description_fr:  string
  status:          string
}

const AGENT_META: Array<{ id: AgentId; ico: string; name: string; role: string }> = [
  { id: 'director',     ico: '🎬', name: 'Director',          role: 'Concept créatif & angle narratif' },
  { id: 'scriptwriter', ico: '✍️',  name: 'Scriptwriter',      role: 'Script voix-off + textes écran' },
  { id: 'storyboarder', ico: '🎨', name: 'Storyboarder',      role: 'Scènes → prompts Seedance 2.0' },
  { id: 'music',        ico: '🎵', name: 'Music Supervisor',  role: 'Ambiance sonore & références' },
  { id: 'visual',       ico: '🖼️', name: 'Visual Director',  role: 'Palette, typographie & motion' },
]

export default function ProductionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { notify } = useToast()

  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [project, setProject]         = useState<ProjectMeta | null>(null)
  const [outputs, setOutputs]         = useState<Record<AgentId, AgentOutput | null>>({
    director: null, scriptwriter: null, storyboarder: null, music: null, visual: null,
  })
  const [scenes, setScenes]           = useState<SceneRow[]>([])
  const [agentStates, setAgentStates] = useState<Record<AgentId, AgentStatus>>({
    director: 'pending', scriptwriter: 'pending', storyboarder: 'pending',
    music: 'pending', visual: 'pending',
  })
  const [running, setRunning]         = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const triggered = useRef(false)

  // États par agent : édition inline + rerun en cours
  const [editing, setEditing] = useState<Record<AgentId, boolean>>({
    director: false, scriptwriter: false, storyboarder: false, music: false, visual: false,
  })
  const [draft, setDraft] = useState<Record<AgentId, string>>({
    director: '', scriptwriter: '', storyboarder: '', music: '', visual: '',
  })
  const [rerunning, setRerunning] = useState<Record<AgentId, boolean>>({
    director: false, scriptwriter: false, storyboarder: false, music: false, visual: false,
  })
  const [savingEdit, setSavingEdit] = useState<Record<AgentId, boolean>>({
    director: false, scriptwriter: false, storyboarder: false, music: false, visual: false,
  })

  // Chargement initial
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        setProject(data.project)
        setScenes(data.scenes ?? [])

        const map: Record<AgentId, AgentOutput | null> = {
          director: null, scriptwriter: null, storyboarder: null, music: null, visual: null,
        }
        for (const o of data.agentOutputs ?? []) {
          if (o.agent in map) map[o.agent as AgentId] = o
        }
        setOutputs(map)

        const newStates: Record<AgentId, AgentStatus> = {
          director: 'pending', scriptwriter: 'pending', storyboarder: 'pending',
          music: 'pending', visual: 'pending',
        }
        for (const k of Object.keys(newStates) as AgentId[]) {
          if (map[k]) newStates[k] = map[k]!.accepted ? 'accepted' : 'ready'
        }
        setAgentStates(newStates)

        const hasAnyOutput = Object.values(map).some((o) => o !== null)
        if (!hasAnyOutput && !triggered.current) {
          triggered.current = true
          void runAgents()
        }
      } catch (e) {
        setGlobalError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  async function runAgents() {
    setRunning(true)
    setGlobalError(null)
    setAgentStates({
      director: 'running', scriptwriter: 'running', storyboarder: 'running',
      music: 'running', visual: 'running',
    })

    try {
      const res = await fetch(`/api/production/${params.id}`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const data = await res.json()

      const reload = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
      if (reload.ok) {
        const fresh = await reload.json()
        setScenes(fresh.scenes ?? [])

        const map: Record<AgentId, AgentOutput | null> = {
          director: null, scriptwriter: null, storyboarder: null, music: null, visual: null,
        }
        for (const o of fresh.agentOutputs ?? []) {
          if (o.agent in map) map[o.agent as AgentId] = o
        }
        setOutputs(map)

        const newStates: Record<AgentId, AgentStatus> = {
          director: 'failed', scriptwriter: 'failed', storyboarder: 'failed',
          music: 'failed', visual: 'failed',
        }
        for (const k of Object.keys(newStates) as AgentId[]) {
          if (map[k]) newStates[k] = 'ready'
        }
        setAgentStates(newStates)
      }

      notify(`${data.successCount}/5 agents prêts.`, data.successCount === 5 ? 'success' : 'warn')
    } catch (e) {
      setGlobalError((e as Error).message)
      setAgentStates({
        director: 'failed', scriptwriter: 'failed', storyboarder: 'failed',
        music: 'failed', visual: 'failed',
      })
      notify('Échec du lancement des agents.', 'warn')
    } finally {
      setRunning(false)
    }
  }

  function accept(id: AgentId) {
    setAgentStates((prev) => ({ ...prev, [id]: 'accepted' }))
    notify('Proposition validée.', 'success')
  }

  function reopen(id: AgentId) {
    setAgentStates((prev) => ({ ...prev, [id]: 'ready' }))
  }

  // Régénère un seul agent (POST /api/production/[id]/agent/[agentId])
  async function rerunAgent(id: AgentId) {
    setRerunning((p) => ({ ...p, [id]: true }))
    setAgentStates((p) => ({ ...p, [id]: 'running' }))
    try {
      const res = await fetch(`/api/production/${params.id}/agent/${id}`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      // Recharge tout depuis la BDD pour rester aligné (notamment scenes si storyboarder)
      const reload = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
      if (reload.ok) {
        const fresh = await reload.json()
        setScenes(fresh.scenes ?? [])
        const map: Record<AgentId, AgentOutput | null> = {
          director: null, scriptwriter: null, storyboarder: null, music: null, visual: null,
        }
        for (const o of fresh.agentOutputs ?? []) {
          if (o.agent in map) map[o.agent as AgentId] = o
        }
        setOutputs(map)
      }
      setAgentStates((p) => ({ ...p, [id]: 'ready' }))
      notify(`Agent ${id} régénéré — à revalider.`, 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
      setAgentStates((p) => ({ ...p, [id]: outputs[id] ? 'ready' : 'failed' }))
    } finally {
      setRerunning((p) => ({ ...p, [id]: false }))
    }
  }

  function startEdit(id: AgentId) {
    setDraft((p) => ({ ...p, [id]: outputs[id]?.content ?? '' }))
    setEditing((p) => ({ ...p, [id]: true }))
  }

  function cancelEdit(id: AgentId) {
    setEditing((p) => ({ ...p, [id]: false }))
    setDraft((p) => ({ ...p, [id]: '' }))
  }

  async function saveEdit(id: AgentId) {
    const content = (draft[id] || '').trim()
    if (!content) {
      notify('Le contenu ne peut pas être vide.', 'warn')
      return
    }
    setSavingEdit((p) => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/production/${params.id}/agent/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)

      // Recharge tout (storyboarder peut avoir mis à jour les scenes)
      const reload = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
      if (reload.ok) {
        const fresh = await reload.json()
        setScenes(fresh.scenes ?? [])
        const map: Record<AgentId, AgentOutput | null> = {
          director: null, scriptwriter: null, storyboarder: null, music: null, visual: null,
        }
        for (const o of fresh.agentOutputs ?? []) {
          if (o.agent in map) map[o.agent as AgentId] = o
        }
        setOutputs(map)
      }
      setEditing((p) => ({ ...p, [id]: false }))
      setAgentStates((p) => ({ ...p, [id]: 'ready' }))
      notify('Modifications enregistrées — à revalider.', 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
    } finally {
      setSavingEdit((p) => ({ ...p, [id]: false }))
    }
  }

  const acceptedCount = Object.values(agentStates).filter((s) => s === 'accepted').length
  const readyCount    = Object.values(agentStates).filter((s) => s === 'ready' || s === 'accepted').length
  const allAccepted   = acceptedCount === 5

  function continueToGenerate() {
    router.push(`/project/${params.id}/generate`)
  }

  if (loading) {
    return <p className="app-h1-sub" style={{ padding: 24 }}>Chargement…</p>
  }

  if (notFound) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="app-h1">Projet introuvable</h1>
        <Link href="/dashboard" className="btn btn-p" style={{ marginTop: 16, display: 'inline-block' }}>
          ← Retour au dashboard
        </Link>
      </div>
    )
  }

  if (!project) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="app-h1">Erreur de chargement</h1>
        <p className="app-h1-sub" style={{ color: '#DC2626' }}>{globalError}</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Link href="/dashboard" className="app-crumb" style={{ textDecoration: 'none' }}>
          ← Projets
        </Link>
      </div>
      <h1 className="app-h1">Production</h1>
      <p className="app-h1-sub">
        {running
          ? 'Les 5 agents analysent ton brief en parallèle. Patiente quelques secondes…'
          : 'Les 5 agents ont analysé ton brief. Valide ou relis chaque proposition.'}
      </p>

      <Stepper projectId={params.id} current="production" />

      <div className="brief-strip">
        <div className="brief-strip-l">
          <div className="brief-strip-ico">📁</div>
          <div className="brief-strip-name">{project.name}</div>
        </div>
        <div className="brief-strip-quote">« {project.brief} »</div>
        <div className="brief-strip-tags">
          <span className="recap-tag">{project.format}</span>
          <span className="recap-tag">{project.duration_sec}s</span>
          <span className="recap-tag">{project.tone === 'auto' ? 'Ton auto' : project.tone}</span>
        </div>
      </div>

      {globalError && (
        <div style={{
          margin: '16px 0', padding: '12px 16px', borderRadius: 8,
          background: 'rgba(220, 38, 38, .08)', color: '#7F1D1D',
          border: '1px solid rgba(220, 38, 38, .3)', fontSize: 13,
        }}>
          <strong>⚠ Erreur agents.</strong> {globalError}
          <button
            type="button" onClick={runAgents}
            style={{
              marginLeft: 12, padding: '4px 10px', borderRadius: 6,
              background: '#7F1D1D', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {running ? (
        <div className="prod-banner running">
          <span className="prod-banner-ico">⚡</span>
          Production en cours — les 5 agents tournent en parallèle…
          <span className="prod-banner-s">~30 à 60 secondes selon charge Claude.</span>
        </div>
      ) : allAccepted ? (
        <div className="prod-banner done">
          <span className="prod-banner-ico">✓</span>
          Tous les agents ont été validés.
          <span className="prod-banner-s">Tu peux maintenant passer à la génération vidéo.</span>
        </div>
      ) : (
        <div className="prod-banner running">
          <span className="prod-banner-ico">⚡</span>
          {readyCount}/5 agents prêts — {acceptedCount}/5 propositions validées.
          <span className="prod-banner-s">Valide chaque agent pour passer à la génération.</span>
        </div>
      )}

      <div className="agents-grid">
        {AGENT_META.map((agent) => {
          const status = agentStates[agent.id]
          const output = outputs[agent.id]
          const cardClass =
            status === 'accepted' ? 'agent-card accepted'
            : status === 'running' ? 'agent-card running'
            : 'agent-card'

          return (
            <div key={agent.id} className={cardClass}>
              <div className="agent-head">
                <div className={`agent-ico ${agent.id}`}>{agent.ico}</div>
                <div className="agent-head-l">
                  <div className="agent-name">{agent.name}</div>
                  <div className="agent-role">{agent.role}</div>
                </div>
                <div className={`agent-status ${status}`}>
                  {status === 'pending'  && 'En attente'}
                  {status === 'running'  && 'En cours…'}
                  {status === 'ready'    && 'À valider'}
                  {status === 'accepted' && 'Validé'}
                  {status === 'failed'   && 'Échec'}
                </div>
              </div>

              {status === 'running' ? (
                <div className="agent-body running">
                  <span className="agent-spinner"></span>
                  L&apos;agent {agent.name} travaille…
                </div>
              ) : status === 'failed' ? (
                <div className="agent-body" style={{ color: '#7F1D1D' }}>
                  ⚠ Cet agent a échoué — clique sur Régénérer pour réessayer.
                </div>
              ) : editing[agent.id] ? (
                <div className="agent-body" style={{ padding: 0 }}>
                  <textarea
                    value={draft[agent.id]}
                    onChange={(e) => setDraft((p) => ({ ...p, [agent.id]: e.target.value }))}
                    rows={12}
                    style={{
                      width: '100%', minHeight: 220, padding: 12, borderRadius: 8,
                      border: '1px solid var(--border)', fontFamily: 'var(--f-mono, ui-monospace, monospace)',
                      fontSize: 13, lineHeight: 1.55, resize: 'vertical', background: 'var(--white)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              ) : (
                <div className="agent-body" style={{ whiteSpace: 'pre-wrap' }}>
                  {output?.content || '—'}
                </div>
              )}

              {/* ─── Actions ─── */}
              {editing[agent.id] ? (
                <div className="agent-actions" style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button" className="btn btn-p"
                    onClick={() => saveEdit(agent.id)}
                    disabled={savingEdit[agent.id]}
                  >
                    {savingEdit[agent.id] ? 'Enregistrement…' : '✓ Enregistrer'}
                  </button>
                  <button
                    type="button" className="btn btn-g"
                    onClick={() => cancelEdit(agent.id)}
                    disabled={savingEdit[agent.id]}
                  >
                    Annuler
                  </button>
                </div>
              ) : status === 'accepted' ? (
                <div className="agent-actions-done">
                  <span>✓ Proposition validée</span>
                  <button type="button" onClick={() => reopen(agent.id)}>Revenir dessus</button>
                </div>
              ) : status === 'running' ? null : status === 'failed' ? (
                <div className="agent-actions">
                  <button
                    type="button" className="btn btn-p"
                    onClick={() => rerunAgent(agent.id)}
                    disabled={rerunning[agent.id]}
                  >
                    {rerunning[agent.id] ? 'Régénération…' : '↻ Régénérer cet agent'}
                  </button>
                </div>
              ) : (
                <div className="agent-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button" className="btn btn-p"
                    onClick={() => accept(agent.id)}
                  >
                    ✓ Valider
                  </button>
                  <button
                    type="button" className="btn btn-g"
                    onClick={() => startEdit(agent.id)}
                  >
                    ✏ Modifier
                  </button>
                  <button
                    type="button" className="btn btn-g"
                    onClick={() => rerunAgent(agent.id)}
                    disabled={rerunning[agent.id]}
                  >
                    {rerunning[agent.id] ? 'Régénération…' : '↻ Régénérer'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="prod-footbar">
        <div className="prod-footbar-l">
          <BackStep projectId={params.id} current="production" />
          <div className="prod-progress">
            <span className="prod-progress-num tabular">{acceptedCount}/5</span>
            <span className="prod-progress-t">propositions validées</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-p btn-lg"
          disabled={!allAccepted}
          style={!allAccepted ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          onClick={continueToGenerate}
        >
          {allAccepted ? `Continuer vers la génération (${scenes.length} scènes) →` : 'Valide les 5 propositions pour continuer'}
        </button>
      </div>
    </>
  )
}
