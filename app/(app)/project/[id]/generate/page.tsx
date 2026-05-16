'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Stepper, BackStep } from '@/app/(app)/_components/Stepper'
import { useToast } from '@/app/(app)/_components/Toast'

type SceneStatus = 'idle' | 'generating' | 'done' | 'failed'

interface SceneRow {
  id:              string
  scene_index:     number
  duration_sec:    number
  seedance_prompt: string
  description_fr:  string
  status:          SceneStatus
  /** Renseignée côté client après /api/generation/[sceneId] */
  videoUrl?:       string
  error?:          string
}

interface ProjectMeta {
  id:           string
  name:         string
  format:       string
  duration_sec: number
}

const COST_PER_SCENE = 1

export default function GeneratePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { notify } = useToast()

  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [project, setProject]     = useState<ProjectMeta | null>(null)
  const [scenes, setScenes]       = useState<SceneRow[]>([])
  const [credits, setCredits]     = useState<number>(0)
  const [busy, setBusy]           = useState<Set<string>>(new Set())
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Chargement initial
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [prodRes, creditsRes] = await Promise.all([
          fetch(`/api/production/${params.id}`, { cache: 'no-store' }),
          fetch('/api/credits',                  { cache: 'no-store' }),
        ])

        if (prodRes.status === 404) {
          setNotFound(true)
          return
        }
        if (!prodRes.ok) {
          const body = await prodRes.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${prodRes.status}`)
        }
        const prodData = await prodRes.json()
        setProject(prodData.project)
        setScenes(prodData.scenes ?? [])

        if (creditsRes.ok) {
          const cd = await creditsRes.json()
          setCredits(Number(cd.balance) || 0)
        }
      } catch (e) {
        setGlobalError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [params.id])

  async function generateScene(scene: SceneRow) {
    if (!hasCredits) return
    setBusy((prev) => new Set(prev).add(scene.id))
    setScenes((prev) =>
      prev.map((s) => (s.id === scene.id ? { ...s, status: 'generating', error: undefined } : s)),
    )

    try {
      const res  = await fetch(`/api/generation/${scene.id}`, { method: 'POST' })
      const data = await res.json()

      if (res.status === 402) {
        notify('Crédits insuffisants.', 'warn')
        setScenes((prev) =>
          prev.map((s) => (s.id === scene.id ? { ...s, status: 'idle' } : s)),
        )
        setCredits(Number(data.balance) || credits)
        return
      }

      if (!res.ok || !data.videoUrl) {
        setScenes((prev) =>
          prev.map((s) => (s.id === scene.id ? { ...s, status: 'failed', error: data.error || `HTTP ${res.status}` } : s)),
        )
        notify(`Scène ${scene.scene_index} — échec`, 'warn')
        return
      }

      setScenes((prev) =>
        prev.map((s) => (s.id === scene.id ? { ...s, status: 'done', videoUrl: data.videoUrl, error: undefined } : s)),
      )
      if (typeof data.newBalance === 'number') setCredits(data.newBalance)
      notify(`Scène ${scene.scene_index} générée ✓`, 'success')
    } catch (e) {
      setScenes((prev) =>
        prev.map((s) => (s.id === scene.id ? { ...s, status: 'failed', error: (e as Error).message } : s)),
      )
      notify(`Scène ${scene.scene_index} — exception`, 'warn')
    } finally {
      setBusy((prev) => {
        const next = new Set(prev)
        next.delete(scene.id)
        return next
      })
    }
  }

  function generateAll() {
    scenes
      .filter((s) => s.status === 'idle' || s.status === 'failed')
      .forEach((s) => void generateScene(s))
  }

  const doneCount     = scenes.filter((s) => s.status === 'done').length
  const allDone       = scenes.length > 0 && doneCount === scenes.length
  const hasCredits    = credits >= COST_PER_SCENE
  const someInProgress = busy.size > 0

  const arClass =
    project?.format === '9:16' ? 'ar-916'
    : project?.format === '1:1' ? 'ar-11'
    : project?.format === '4:3' ? 'ar-43'
    : ''

  if (loading) {
    return <p className="app-h1-sub" style={{ padding: 24 }}>Chargement…</p>
  }
  if (notFound || !project) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="app-h1">Projet introuvable</h1>
        {globalError && <p style={{ color: '#7F1D1D' }}>{globalError}</p>}
        <Link href="/dashboard" className="btn btn-p" style={{ marginTop: 16, display: 'inline-block' }}>
          ← Retour au dashboard
        </Link>
      </div>
    )
  }
  if (scenes.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="app-h1">Aucune scène à générer</h1>
        <p className="app-h1-sub">Le storyboarder n&apos;a pas produit de scènes — repasse par la production.</p>
        <Link href={`/project/${params.id}/production`} className="btn btn-p" style={{ marginTop: 16, display: 'inline-block' }}>
          ← Revenir à la production
        </Link>
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
      <h1 className="app-h1">Génération vidéo</h1>
      <p className="app-h1-sub">
        Seedance 2.0 via BytePlus — 1080p + audio natif. ~30s à quelques minutes par scène selon charge.
      </p>

      <Stepper projectId={params.id} current="generate" />

      <div className="brief-strip">
        <div className="brief-strip-l">
          <div className="brief-strip-ico">🎬</div>
          <div className="brief-strip-name">{project.name}</div>
        </div>
        <div className="brief-strip-tags">
          <span className="recap-tag">
            <span className="tabular">{scenes.length}</span> scène{scenes.length > 1 ? 's' : ''}
          </span>
          <span className="recap-tag">{project.format}</span>
          <span className="recap-tag">1080p · audio natif</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/dashboard/billing" className="app-credits">
            <span className="app-credits-dot"></span>
            <span className="app-credits-num tabular">{credits}</span>
            crédits
          </Link>
        </div>
      </div>

      {!hasCredits && (
        <div className="credits-warning">
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            Crédits insuffisants. <Link href="/dashboard/billing" style={{ color: '#92400E', textDecoration: 'underline', fontWeight: 700 }}>Recharger</Link> pour continuer.
          </div>
        </div>
      )}

      {allDone ? (
        <div className="prod-banner done">
          <span className="prod-banner-ico">✓</span>
          Toutes les scènes sont générées.
          <span className="prod-banner-s">Tu peux passer à l&apos;export.</span>
        </div>
      ) : (
        <div className="prod-banner running">
          <span className="prod-banner-ico">🎬</span>
          {doneCount}/{scenes.length} scènes générées
          {someInProgress && ' — génération en cours…'}
          <span className="prod-banner-s">
            Coût : <strong style={{ color: 'var(--blue)' }}>{COST_PER_SCENE} crédit</strong> par scène · refund automatique si échec
          </span>
        </div>
      )}

      <div className="scenes-grid">
        {scenes.map((scene) => {
          const isBusy = busy.has(scene.id) || scene.status === 'generating'
          const cardClass =
            scene.status === 'done'   ? 'scene-card done'
            : scene.status === 'failed' ? 'scene-card failed'
            : 'scene-card'

          return (
            <div key={scene.id} className={cardClass}>
              <div className={`scene-preview ${arClass}`}>
                {scene.status === 'done' && scene.videoUrl ? (
                  <video
                    src={scene.videoUrl}
                    controls
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                  />
                ) : (
                  <div
                    className="scene-preview-ph"
                    style={{
                      background: 'linear-gradient(135deg,#1A1A2E,#2D2D4E)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#9CA3AF',
                    }}
                  >
                    {scene.status === 'generating' ? (
                      <div style={{ textAlign: 'center' }}>
                        <div className="scene-spinner" style={{ margin: '0 auto 8px' }}></div>
                        <div className="scene-overlay-t">Génération en cours…</div>
                        <div className="scene-overlay-s">BytePlus — 30s à 5min</div>
                      </div>
                    ) : scene.status === 'failed' ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32 }}>⚠️</div>
                        <div className="scene-overlay-t">Échec</div>
                        <div className="scene-overlay-s" style={{ maxWidth: 280, fontSize: 11, color: '#FCA5A5' }}>
                          {scene.error?.slice(0, 200) || 'Erreur inconnue'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 48, opacity: .4 }}>🎬</div>
                        <div style={{ fontSize: 12, marginTop: 8 }}>Pas encore généré</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="scene-num-badge">SCÈNE {scene.scene_index}</div>
                <div className="scene-dur-badge">{scene.duration_sec}s</div>
              </div>

              <div className="scene-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div className="scene-title">Scène {scene.scene_index}</div>
                  <span className={`scene-status ${scene.status}`}>
                    {scene.status === 'idle'       && 'À générer'}
                    {scene.status === 'generating' && 'En cours'}
                    {scene.status === 'done'       && 'Prêt'}
                    {scene.status === 'failed'     && 'Échec'}
                  </span>
                </div>
                {scene.description_fr && <div className="scene-desc">{scene.description_fr}</div>}
                <div className="scene-prompt">
                  <div className="scene-prompt-lbl">Prompt Seedance</div>
                  {scene.seedance_prompt}
                </div>
              </div>

              {scene.status === 'done' ? (
                <div className="scene-actions">
                  <button
                    type="button" className="btn btn-g"
                    onClick={() => generateScene(scene)}
                    disabled={!hasCredits || isBusy}
                  >
                    Régénérer
                  </button>
                  {scene.videoUrl && (
                    <a
                      href={scene.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-p"
                      style={{ textDecoration: 'none' }}
                    >
                      ↗ Ouvrir
                    </a>
                  )}
                </div>
              ) : scene.status === 'generating' ? (
                <div className="scene-actions" style={{ opacity: .6 }}>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                    Génération asynchrone — patiente…
                  </span>
                </div>
              ) : (
                <div className="scene-actions">
                  <button
                    type="button" className="btn btn-p"
                    onClick={() => generateScene(scene)}
                    disabled={!hasCredits || isBusy}
                    style={!hasCredits ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    {scene.status === 'failed' ? '↻ Réessayer' : '▶ Générer'}
                  </button>
                  <span className="scene-cost">
                    <span className="scene-cost-i">−{COST_PER_SCENE}</span> crédit
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="prod-footbar">
        <div className="prod-footbar-l">
          <BackStep projectId={params.id} current="generate" />
          <div className="prod-progress">
            <span className="prod-progress-num tabular">{doneCount}/{scenes.length}</span>
            <span className="prod-progress-t">scènes générées</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!allDone && scenes.some((s) => s.status === 'idle' || s.status === 'failed') && (
            <button
              type="button" className="btn btn-g"
              onClick={generateAll}
              disabled={!hasCredits || someInProgress}
            >
              ⚡ Tout générer
            </button>
          )}
          <button
            type="button" className="btn btn-p btn-lg"
            disabled={!allDone}
            style={!allDone ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => router.push(`/project/${params.id}/export`)}
          >
            {allDone ? 'Continuer vers l\'export →' : `Génère les ${scenes.length} scènes pour continuer`}
          </button>
        </div>
      </div>
    </>
  )
}
