'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { Stepper, BackStep } from '@/app/(app)/_components/Stepper'

type AgentId = 'director' | 'scriptwriter' | 'storyboarder' | 'music' | 'visual'

interface ProjectMeta {
  id:           string
  name:         string
  brief:        string
  format:       string
  duration_sec: number
  tone:         string
}

interface AgentOutput {
  agent:    AgentId
  content:  string
  accepted: boolean
}

interface SceneRow {
  id:              string
  scene_index:     number
  duration_sec:    number
  description_fr:  string
  status:          string
  videoUrl?:       string | null
}

const AGENT_LABELS: Record<AgentId, string> = {
  director:     'Director — Concept',
  scriptwriter: 'Scriptwriter — Voix-off',
  storyboarder: 'Storyboarder — Scènes',
  music:        'Music Supervisor — Ambiance',
  visual:       'Visual Director — Direction artistique',
}

export default function ExportPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [project, setProject]       = useState<ProjectMeta | null>(null)
  const [scenes, setScenes]         = useState<SceneRow[]>([])
  const [outputs, setOutputs]       = useState<Record<AgentId, AgentOutput | null>>({
    director: null, scriptwriter: null, storyboarder: null, music: null, visual: null,
  })
  const [activeAgent, setActiveAgent] = useState<AgentId>('director')
  const [error, setError]           = useState<string | null>(null)

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
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.id])

  if (loading) return <p className="app-h1-sub" style={{ padding: 24 }}>Chargement…</p>
  if (notFound || !project) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="app-h1">Projet introuvable</h1>
        {error && <p style={{ color: '#7F1D1D' }}>{error}</p>}
        <Link href="/dashboard" className="btn btn-p" style={{ marginTop: 16, display: 'inline-block' }}>
          ← Retour au dashboard
        </Link>
      </div>
    )
  }

  const generatedScenes = scenes.filter((s) => s.videoUrl)
  const totalDuration   = generatedScenes.reduce((sum, s) => sum + s.duration_sec, 0)
  const activeOutput    = outputs[activeAgent]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Link href="/dashboard" className="app-crumb" style={{ textDecoration: 'none' }}>
          ← Projets
        </Link>
      </div>
      <h1 className="app-h1">Dossier de production</h1>
      <p className="app-h1-sub">Tout est prêt à livrer à ton client ou ton monteur.</p>

      <Stepper projectId={params.id} current="export" />

      <div className="prod-banner done">
        <span className="prod-banner-ico">🎉</span>
        Projet terminé — {project.name}.
        <span className="prod-banner-s">
          {generatedScenes.length} clip{generatedScenes.length > 1 ? 's' : ''} générés · {totalDuration}s au total.
        </span>
      </div>

      <div className="export-summary">
        <div className="export-stat">
          <div className="export-stat-n">{scenes.length}</div>
          <div className="export-stat-l">SCÈNES</div>
        </div>
        <div className="export-stat">
          <div className="export-stat-n">{totalDuration}s</div>
          <div className="export-stat-l">DURÉE TOTALE</div>
        </div>
        <div className="export-stat">
          <div className="export-stat-n">{project.format}</div>
          <div className="export-stat-l">FORMAT</div>
        </div>
        <div className="export-stat">
          <div className="export-stat-n">1080p</div>
          <div className="export-stat-l">RÉSOLUTION</div>
        </div>
      </div>

      {/* Clips générés */}
      <div className="export-files-card" style={{ marginBottom: 24 }}>
        <div className="export-files-h">Clips générés</div>
        {generatedScenes.length === 0 ? (
          <p style={{ padding: 16, color: 'var(--muted)', fontSize: 14 }}>
            Aucune scène n&apos;a encore été générée.{' '}
            <Link href={`/project/${params.id}/generate`} style={{ color: 'var(--blue)' }}>
              Retour à la génération →
            </Link>
          </p>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16, padding: 16,
          }}>
            {generatedScenes.map((scene) => (
              <div key={scene.id} style={{
                background: '#1a1a2e', border: '1px solid #2d2d4e',
                borderRadius: 10, overflow: 'hidden',
              }}>
                <video
                  src={scene.videoUrl ?? undefined}
                  controls playsInline
                  style={{ width: '100%', display: 'block', background: '#000' }}
                />
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Scène {scene.scene_index}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{scene.duration_sec}s</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                    {scene.description_fr}
                  </div>
                  {scene.videoUrl && (
                    <a
                      href={scene.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      ↗ Ouvrir / Télécharger
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outputs des 5 agents */}
      <div className="export-files-card">
        <div className="export-files-h">Dossier de production</div>
        <div style={{ display: 'flex', gap: 0 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 2,
            padding: 16, borderRight: '1px solid var(--line)', minWidth: 220,
          }}>
            {(Object.keys(AGENT_LABELS) as AgentId[]).map((agentId) => {
              const hasContent = !!outputs[agentId]?.content
              return (
                <button
                  key={agentId}
                  type="button"
                  onClick={() => setActiveAgent(agentId)}
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: 'none',
                    background: activeAgent === agentId ? '#4F46E5' : 'transparent',
                    color: activeAgent === agentId ? '#fff' : hasContent ? 'var(--ink)' : 'var(--muted)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  {AGENT_LABELS[agentId]} {hasContent ? '' : '✗'}
                </button>
              )
            })}
          </div>

          <div style={{ flex: 1, padding: 20, minHeight: 300 }}>
            {activeOutput?.content ? (
              <pre style={{
                whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7,
                color: 'var(--ink)', fontFamily: 'inherit', margin: 0,
              }}>
                {activeOutput.content}
              </pre>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Pas de contenu pour cet agent.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="prod-footbar">
        <div className="prod-footbar-l">
          <BackStep projectId={params.id} current="export" />
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>
            Les vidéos sont hébergées sur les serveurs Seedance — pense à les télécharger.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/dashboard" className="btn btn-g">
            ← Retour aux projets
          </Link>
          <button
            type="button"
            className="btn btn-p"
            onClick={() => router.push('/project/new/brief')}
          >
            + Nouveau projet
          </button>
        </div>
      </div>
    </>
  )
}
