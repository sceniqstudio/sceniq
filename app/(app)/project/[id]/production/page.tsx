'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams }                      from 'next/navigation'
import Link                                          from 'next/link'
import { Stepper, BackStep }                         from '@/app/(app)/_components/Stepper'
import { useToast }                                  from '@/app/(app)/_components/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockId     = 'director' | 'storyboarder' | 'music'
type BlockStatus = 'pending' | 'running' | 'ready' | 'accepted' | 'failed'

interface ProjectMeta {
  id:              string
  name:            string
  brief:           string
  format:          string
  duration_sec:    number
  tone:            string
  status:          string
  ref_image_urls:  string[]
  video_job_id:    string | null
  final_video_url: string | null
}

interface AgentOutput {
  agent:    string
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

// ─── Block metadata ───────────────────────────────────────────────────────────

const BLOCKS: Array<{ id: BlockId; ico: string; name: string; role: string }> = [
  { id: 'director',     ico: '🎬', name: 'Concept créatif',  role: 'Angle narratif · Ton · Messages clés' },
  { id: 'storyboarder', ico: '🎨', name: 'Storyboard',        role: 'Scènes · Voix off · Prompts Seedance 2.0' },
  { id: 'music',        ico: '🎵', name: 'Ambiance sonore',   role: 'Style musical · No Lyrics · Références' },
]

// ─── Polling interval (ms) ────────────────────────────────────────────────────
const POLL_MS = 5_000

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductionPage() {
  const router  = useRouter()
  const params  = useParams<{ id: string }>()
  const { notify } = useToast()

  // ── Core state ──────────────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [project,     setProject]     = useState<ProjectMeta | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [outputs,     setOutputs]     = useState<Record<BlockId, AgentOutput | null>>({
    director: null, storyboarder: null, music: null,
  })
  const [scenes,         setScenes]         = useState<SceneRow[]>([])
  const [unifiedPrompt,  setUnifiedPrompt]  = useState<string | null>(null)
  const [blockStates,    setBlockStates]    = useState<Record<BlockId, BlockStatus>>({
    director: 'pending', storyboarder: 'pending', music: 'pending',
  })
  const [running, setRunning] = useState(false)
  const triggered = useRef(false)

  // ── Per-block edit/rerun state ───────────────────────────────────────────────
  const [editing,    setEditing]    = useState<Record<BlockId, boolean>>({
    director: false, storyboarder: false, music: false,
  })
  const [draft,      setDraft]      = useState<Record<BlockId, string>>({
    director: '', storyboarder: '', music: '',
  })
  const [rerunning,  setRerunning]  = useState<Record<BlockId, boolean>>({
    director: false, storyboarder: false, music: false,
  })
  const [savingEdit, setSavingEdit] = useState<Record<BlockId, boolean>>({
    director: false, storyboarder: false, music: false,
  })

  // ── Reference images ─────────────────────────────────────────────────────────
  const [refImages,     setRefImages]     = useState<string[]>([])
  const [uploadingImg,  setUploadingImg]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Prompt copy ───────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)

  // ── Generation (unified BytePlus) ─────────────────────────────────────────────
  const [generating,      setGenerating]      = useState(false)
  const [generateStatus,  setGenerateStatus]  = useState<string>('idle')
  const [generateError,   setGenerateError]   = useState<string | null>(null)
  const [videoUrl,        setVideoUrl]        = useState<string | null>(null)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Extract unified prompt from storyboarder content ────────────────────────
  function extractUnifiedPrompt(content: string): string | null {
    const match = content.match(/PROMPT_FINAL_UNIFIE\s*\n([\s\S]+?)(?:\n\n|$)/i)
    return match ? match[1].trim() : null
  }

  // ─── Helper: hydrate state from API response ─────────────────────────────────
  function hydrateFromResponse(data: {
    project:       ProjectMeta
    agentOutputs:  AgentOutput[]
    scenes:        SceneRow[]
  }) {
    setProject(data.project)
    setScenes(data.scenes ?? [])
    setRefImages((data.project.ref_image_urls as string[]) ?? [])
    if (data.project.final_video_url) {
      setVideoUrl(data.project.final_video_url)
      setGenerateStatus('succeeded')
    }

    const map: Record<BlockId, AgentOutput | null> = {
      director: null, storyboarder: null, music: null,
    }
    for (const o of data.agentOutputs ?? []) {
      if (o.agent in map) map[o.agent as BlockId] = o
    }
    setOutputs(map)

    // Unified prompt — extrait du storyboarder
    if (map.storyboarder?.content) {
      setUnifiedPrompt(extractUnifiedPrompt(map.storyboarder.content))
    }

    const newStates: Record<BlockId, BlockStatus> = {
      director: 'pending', storyboarder: 'pending', music: 'pending',
    }
    for (const k of Object.keys(newStates) as BlockId[]) {
      if (map[k]) newStates[k] = 'ready'
    }
    setBlockStates(newStates)
  }

  // ─── Load initial data ───────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        hydrateFromResponse(data)

        const hasAnyOutput = (data.agentOutputs ?? []).length > 0
        if (!hasAnyOutput && !triggered.current) {
          triggered.current = true
          void runAgents()
        }

        // Si un job est déjà en cours → reprendre le polling
        if (data.project.video_job_id && !data.project.final_video_url) {
          setGenerating(true)
          setGenerateStatus('processing')
          scheduleNextPoll()
        }
      } catch (e) {
        setGlobalError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void load()
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // ─── Run all agents ──────────────────────────────────────────────────────────
  async function runAgents() {
    setRunning(true)
    setGlobalError(null)
    setBlockStates({ director: 'running', storyboarder: 'running', music: 'running' })
    try {
      const res  = await fetch(`/api/production/${params.id}`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      await res.json()
      // Reload complet
      const reload = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
      if (reload.ok) {
        const fresh = await reload.json()
        hydrateFromResponse(fresh)
        const successCount = (fresh.agentOutputs ?? []).length
        notify(`${successCount}/3 blocs générés.`, successCount >= 3 ? 'success' : 'warn')
      }
    } catch (e) {
      setGlobalError((e as Error).message)
      setBlockStates({ director: 'failed', storyboarder: 'failed', music: 'failed' })
      notify('Échec du lancement des agents.', 'warn')
    } finally {
      setRunning(false)
    }
  }

  // ─── Per-block actions ───────────────────────────────────────────────────────

  function accept(id: BlockId) {
    setBlockStates((p) => ({ ...p, [id]: 'accepted' }))
  }

  function reopen(id: BlockId) {
    setBlockStates((p) => ({ ...p, [id]: 'ready' }))
  }

  async function rerunBlock(id: BlockId) {
    setRerunning((p) => ({ ...p, [id]: true }))
    setBlockStates((p) => ({ ...p, [id]: 'running' }))
    try {
      const res  = await fetch(`/api/production/${params.id}/agent/${id}`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      const reload = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
      if (reload.ok) {
        const fresh = await reload.json()
        hydrateFromResponse(fresh)
      }
      setBlockStates((p) => ({ ...p, [id]: 'ready' }))
      notify(`Bloc régénéré — à revalider.`, 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
      setBlockStates((p) => ({ ...p, [id]: outputs[id] ? 'ready' : 'failed' }))
    } finally {
      setRerunning((p) => ({ ...p, [id]: false }))
    }
  }

  function startEdit(id: BlockId) {
    setDraft((p) => ({ ...p, [id]: outputs[id]?.content ?? '' }))
    setEditing((p) => ({ ...p, [id]: true }))
  }

  function cancelEdit(id: BlockId) {
    setEditing((p) => ({ ...p, [id]: false }))
    setDraft((p) => ({ ...p, [id]: '' }))
  }

  async function saveEdit(id: BlockId) {
    const content = (draft[id] || '').trim()
    if (!content) { notify('Le contenu ne peut pas être vide.', 'warn'); return }
    setSavingEdit((p) => ({ ...p, [id]: true }))
    try {
      const res  = await fetch(`/api/production/${params.id}/agent/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      const reload = await fetch(`/api/production/${params.id}`, { cache: 'no-store' })
      if (reload.ok) {
        const fresh = await reload.json()
        hydrateFromResponse(fresh)
      }
      setEditing((p) => ({ ...p, [id]: false }))
      setBlockStates((p) => ({ ...p, [id]: 'ready' }))
      notify('Modifications enregistrées — à revalider.', 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
    } finally {
      setSavingEdit((p) => ({ ...p, [id]: false }))
    }
  }

  // ─── Image upload / remove ───────────────────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (refImages.length >= 6) { notify('Maximum 6 images atteint.', 'warn'); return }

    setUploadingImg(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch(`/api/projects/${params.id}/ref-images`, {
        method: 'POST', body: form,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setRefImages(body.urls as string[])
      notify('Image ajoutée.', 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
    } finally {
      setUploadingImg(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function removeImage(url: string) {
    try {
      const res  = await fetch(`/api/projects/${params.id}/ref-images`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
      setRefImages(body.urls as string[])
    } catch (e) {
      notify((e as Error).message, 'warn')
    }
  }

  // ─── Copy unified prompt ─────────────────────────────────────────────────────

  async function copyPrompt() {
    if (!unifiedPrompt) return
    try {
      await navigator.clipboard.writeText(unifiedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      notify('Copie impossible — sélectionne manuellement.', 'warn')
    }
  }

  // ─── Unified generation ──────────────────────────────────────────────────────

  const scheduleNextPoll = useCallback(() => {
    pollTimer.current = setTimeout(pollGenerationStatus, POLL_MS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function pollGenerationStatus() {
    try {
      const res  = await fetch(`/api/generation/${params.id}/unified`, { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)

      setGenerateStatus(body.status)

      if (body.status === 'succeeded' && body.videoUrl) {
        setVideoUrl(body.videoUrl)
        setGenerating(false)
        notify('🎬 Vidéo prête !', 'success')
        return // stop polling
      }

      if (body.status === 'failed' || body.status === 'expired' || body.status === 'cancelled') {
        setGenerateError(body.error ?? 'Échec de la génération')
        setGenerating(false)
        notify('Génération échouée — réessaie.', 'warn')
        return // stop polling
      }

      // En cours → continuer le polling
      scheduleNextPoll()
    } catch (e) {
      // Erreur réseau transitoire — on continue de poller
      scheduleNextPoll()
    }
  }

  async function startGeneration() {
    setGenerating(true)
    setGenerateError(null)
    setGenerateStatus('pending')
    try {
      const res  = await fetch(`/api/generation/${params.id}/unified`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)

      if (body.alreadyRunning) {
        // Job existant → on reprend le polling
        setGenerateStatus('processing')
        scheduleNextPoll()
        return
      }

      // Nouveau job soumis → démarrer le polling
      setGenerateStatus('processing')
      scheduleNextPoll()
    } catch (e) {
      setGenerateError((e as Error).message)
      setGenerating(false)
      setGenerateStatus('failed')
      notify((e as Error).message, 'warn')
    }
  }

  // ─── Computed ────────────────────────────────────────────────────────────────

  const acceptedCount = Object.values(blockStates).filter((s) => s === 'accepted').length
  const allAccepted   = acceptedCount === 3
  const canGenerate   = allAccepted && !generating && !videoUrl

  // ─── Loading / error guards ───────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Nav breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Link href="/dashboard" className="app-crumb" style={{ textDecoration: 'none' }}>
          ← Projets
        </Link>
      </div>

      <h1 className="app-h1">Production</h1>
      <p className="app-h1-sub">
        {running
          ? 'Les agents analysent ton brief en parallèle. Patiente quelques secondes…'
          : 'Valide chaque bloc ou modifie-le avant de lancer la génération.'}
      </p>

      <Stepper projectId={params.id} current="production" />

      {/* ── Brief strip ── */}
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

      {/* ── Global error banner ── */}
      {globalError && (
        <div style={{
          margin: '16px 0', padding: '12px 16px', borderRadius: 8,
          background: 'rgba(220,38,38,.08)', color: '#7F1D1D',
          border: '1px solid rgba(220,38,38,.3)', fontSize: 13,
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

      {/* ── Status banner ── */}
      {running ? (
        <div className="prod-banner running">
          <span className="prod-banner-ico">⚡</span>
          Génération IA en cours — les 3 blocs tournent en parallèle…
          <span className="prod-banner-s">~30 à 60 secondes selon charge Claude.</span>
        </div>
      ) : allAccepted ? (
        <div className="prod-banner done">
          <span className="prod-banner-ico">✓</span>
          Les 3 blocs sont validés.
          {videoUrl
            ? <span className="prod-banner-s">La vidéo est prête — voir ci-dessous.</span>
            : <span className="prod-banner-s">Ajoute des images de référence puis génère la vidéo.</span>}
        </div>
      ) : (
        <div className="prod-banner running">
          <span className="prod-banner-ico">⚡</span>
          {acceptedCount}/3 blocs validés.
          <span className="prod-banner-s">Valide chaque bloc pour activer la génération.</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ── SECTION : Images de référence ──────────────────────────────────────
          ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Images de référence
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-sub)', margin: '2px 0 0' }}>
              Optionnel — jusqu&apos;à 6 images passées à Seedance 2.0 (logo, ambiance, produit…)
            </p>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600, color: refImages.length >= 6 ? '#DC2626' : 'var(--ink-sub)',
            background: 'var(--surface)', padding: '2px 10px', borderRadius: 20,
            border: '1px solid var(--border)',
          }}>
            {refImages.length}/6
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Thumbnails */}
          {refImages.map((url, i) => (
            <div
              key={url}
              style={{
                position: 'relative', width: 88, height: 88,
                borderRadius: 8, overflow: 'hidden',
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url} alt={`Image${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,.55)', padding: '2px 4px',
                fontSize: 10, color: '#fff', fontWeight: 600, textAlign: 'center',
              }}>
                Image{i + 1}
              </div>
              <button
                type="button"
                onClick={() => removeImage(url)}
                title="Supprimer"
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(0,0,0,.65)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, lineHeight: 1, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Upload slot */}
          {refImages.length < 6 && (
            <button
              type="button"
              disabled={uploadingImg}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 88, height: 88, borderRadius: 8,
                border: '2px dashed var(--border)',
                background: 'var(--surface)',
                cursor: uploadingImg ? 'wait' : 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, color: 'var(--ink-sub)', fontSize: 11,
                flexShrink: 0,
              }}
            >
              {uploadingImg ? (
                <>
                  <span className="agent-spinner" style={{ width: 18, height: 18 }} />
                  <span>Upload…</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 22 }}>+</span>
                  <span>Ajouter</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          ── SECTION : 3 blocs IA ────────────────────────────────────────────────
          ════════════════════════════════════════════════════════════════════════ */}
      <div className="agents-grid">
        {BLOCKS.map((block) => {
          const status    = blockStates[block.id]
          const output    = outputs[block.id]
          const cardClass =
            status === 'accepted' ? 'agent-card accepted'
            : status === 'running' ? 'agent-card running'
            : 'agent-card'

          return (
            <div key={block.id} className={cardClass}>
              <div className="agent-head">
                <div className={`agent-ico ${block.id}`}>{block.ico}</div>
                <div className="agent-head-l">
                  <div className="agent-name">{block.name}</div>
                  <div className="agent-role">{block.role}</div>
                </div>
                <div className={`agent-status ${status}`}>
                  {status === 'pending'  && 'En attente'}
                  {status === 'running'  && 'En cours…'}
                  {status === 'ready'    && 'À valider'}
                  {status === 'accepted' && 'Validé ✓'}
                  {status === 'failed'   && 'Échec'}
                </div>
              </div>

              {/* ── Body ── */}
              {status === 'running' ? (
                <div className="agent-body running">
                  <span className="agent-spinner" />
                  Génération en cours…
                </div>
              ) : status === 'failed' ? (
                <div className="agent-body" style={{ color: '#7F1D1D' }}>
                  ⚠ Cet agent a échoué — clique sur Régénérer.
                </div>
              ) : editing[block.id] ? (
                <div className="agent-body" style={{ padding: 0 }}>
                  <textarea
                    value={draft[block.id]}
                    onChange={(e) => setDraft((p) => ({ ...p, [block.id]: e.target.value }))}
                    rows={12}
                    style={{
                      width: '100%', minHeight: 220, padding: 12, borderRadius: 8,
                      border: '1px solid var(--border)',
                      fontFamily: 'var(--f-mono, ui-monospace, monospace)',
                      fontSize: 13, lineHeight: 1.55, resize: 'vertical',
                      background: 'var(--white)', color: 'var(--ink)',
                    }}
                  />
                </div>
              ) : (
                <div className="agent-body" style={{ whiteSpace: 'pre-wrap' }}>
                  {output?.content || '—'}
                </div>
              )}

              {/* ── Parsed scenes (storyboard only) ── */}
              {block.id === 'storyboarder' && scenes.length > 0 && status !== 'running' && !editing[block.id] && (
                <div style={{ padding: '0 16px 12px' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                    textTransform: 'uppercase', color: 'var(--ink-sub)', marginBottom: 8,
                  }}>
                    {scenes.length} scènes parsées
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {scenes.map((sc) => (
                      <div
                        key={sc.id}
                        style={{
                          padding: '8px 12px', borderRadius: 6,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 2, color: 'var(--ink)' }}>
                          Scène {sc.scene_index} · {sc.duration_sec}s
                        </div>
                        <div style={{ color: 'var(--ink-sub)', lineHeight: 1.4 }}>
                          {sc.description_fr}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Actions ── */}
              {editing[block.id] ? (
                <div className="agent-actions" style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button" className="btn btn-p"
                    onClick={() => saveEdit(block.id)}
                    disabled={savingEdit[block.id]}
                  >
                    {savingEdit[block.id] ? 'Enregistrement…' : '✓ Enregistrer'}
                  </button>
                  <button
                    type="button" className="btn btn-g"
                    onClick={() => cancelEdit(block.id)}
                    disabled={savingEdit[block.id]}
                  >
                    Annuler
                  </button>
                </div>
              ) : status === 'accepted' ? (
                <div className="agent-actions-done">
                  <span>✓ Validé</span>
                  <button type="button" onClick={() => reopen(block.id)}>Revenir</button>
                </div>
              ) : status === 'running' ? null : status === 'failed' ? (
                <div className="agent-actions">
                  <button
                    type="button" className="btn btn-p"
                    onClick={() => rerunBlock(block.id)}
                    disabled={rerunning[block.id]}
                  >
                    {rerunning[block.id] ? 'Régénération…' : '↻ Régénérer'}
                  </button>
                </div>
              ) : (
                <div className="agent-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-p" onClick={() => accept(block.id)}>
                    ✓ Valider
                  </button>
                  <button type="button" className="btn btn-g" onClick={() => startEdit(block.id)}>
                    ✏ Modifier
                  </button>
                  <button
                    type="button" className="btn btn-g"
                    onClick={() => rerunBlock(block.id)}
                    disabled={rerunning[block.id]}
                  >
                    {rerunning[block.id] ? 'Régénération…' : '↻ Régénérer'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ── SECTION : Prompt final unifié ──────────────────────────────────────
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        marginTop: 24, padding: '20px 20px 16px', borderRadius: 12,
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Prompt final unifié</div>
              <div style={{ fontSize: 12, color: 'var(--ink-sub)' }}>
                Multi-shot BytePlus — envoyé tel quel à Seedance 2.0
              </div>
            </div>
          </div>
          {unifiedPrompt && (
            <button
              type="button"
              onClick={copyPrompt}
              style={{
                padding: '6px 14px', borderRadius: 6,
                background: copied ? 'var(--accent)' : 'var(--white)',
                color:      copied ? '#fff' : 'var(--ink)',
                border:     '1px solid var(--border)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'background .2s, color .2s',
              }}
            >
              {copied ? '✓ Copié !' : '📋 Copier'}
            </button>
          )}
        </div>

        {unifiedPrompt ? (
          <div style={{
            fontFamily:  'var(--f-mono, ui-monospace, monospace)',
            fontSize:    13, lineHeight: 1.65,
            color:       'var(--ink)', padding: '12px 14px',
            background:  'var(--white)', borderRadius: 8,
            border:      '1px solid var(--border)',
            whiteSpace:  'pre-wrap', wordBreak: 'break-word',
          }}>
            {unifiedPrompt}
          </div>
        ) : running ? (
          <div style={{ fontSize: 13, color: 'var(--ink-sub)', fontStyle: 'italic' }}>
            <span className="agent-spinner" style={{ width: 14, height: 14, marginRight: 8 }} />
            Extraction du prompt en cours…
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--ink-sub)', fontStyle: 'italic' }}>
            Le prompt unifié apparaîtra ici une fois le Storyboard généré.
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ── SECTION : Génération vidéo ──────────────────────────────────────────
          ════════════════════════════════════════════════════════════════════════ */}
      {videoUrl ? (
        <div style={{
          marginTop: 28, padding: '24px', borderRadius: 12,
          background: 'rgba(99,102,241,.05)', border: '2px solid var(--accent)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            Vidéo prête !
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginBottom: 20 }}>
            Ta vidéo est disponible en export.
          </div>
          <video
            src={videoUrl}
            controls
            style={{
              maxWidth: 560, width: '100%', borderRadius: 8,
              border: '1px solid var(--border)', display: 'block', margin: '0 auto 20px',
            }}
          />
          <Link
            href={`/project/${params.id}/export`}
            className="btn btn-p btn-lg"
            style={{ display: 'inline-block' }}
          >
            Voir le dossier export →
          </Link>
        </div>
      ) : generating ? (
        <div style={{
          marginTop: 28, padding: '20px 24px', borderRadius: 12,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span className="agent-spinner" style={{ width: 28, height: 28, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Génération en cours…</div>
            <div style={{ fontSize: 13, color: 'var(--ink-sub)' }}>
              {generateStatus === 'pending'    && 'Soumission du job BytePlus…'}
              {generateStatus === 'processing' && 'Seedance 2.0 génère ta vidéo — ~2 à 5 minutes.'}
              Sondage toutes les 5 secondes.
            </div>
          </div>
        </div>
      ) : generateError ? (
        <div style={{
          marginTop: 24, padding: '12px 16px', borderRadius: 8,
          background: 'rgba(220,38,38,.08)', color: '#7F1D1D',
          border: '1px solid rgba(220,38,38,.3)', fontSize: 13,
        }}>
          <strong>⚠ Génération échouée :</strong> {generateError}
          <button
            type="button" onClick={startGeneration}
            style={{
              marginLeft: 12, padding: '4px 10px', borderRadius: 6,
              background: '#7F1D1D', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            Réessayer
          </button>
        </div>
      ) : null}

      {/* ── Footer bar ── */}
      <div className="prod-footbar">
        <div className="prod-footbar-l">
          <BackStep projectId={params.id} current="production" />
          <div className="prod-progress">
            <span className="prod-progress-num tabular">{acceptedCount}/3</span>
            <span className="prod-progress-t">blocs validés</span>
          </div>
        </div>

        {videoUrl ? (
          <Link
            href={`/project/${params.id}/export`}
            className="btn btn-p btn-lg"
          >
            Voir le dossier export →
          </Link>
        ) : (
          <button
            type="button"
            className="btn btn-p btn-lg"
            disabled={!canGenerate}
            style={!canGenerate ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={canGenerate ? startGeneration : undefined}
          >
            {generating
              ? 'Génération en cours…'
              : !allAccepted
              ? `Valide les 3 blocs pour générer`
              : '🎬 Générer la vidéo'}
          </button>
        )}
      </div>
    </>
  )
}
