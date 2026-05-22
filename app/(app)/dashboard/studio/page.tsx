'use client'
// app/(app)/dashboard/studio/page.tsx
// Studio IA — Image IA (Dreamina Image 5.0 Lite) · Vidéo IA (Seedance S2.0 Fast / S2.0)
// Image de référence obligatoire pour les 2 modes
// Pattern async pour image ET vidéo : submit → jobId → poll → résultat

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab          = 'image' | 'video'
type VideoQuality = 'standard' | 'fast'
type JobStatus    = 'idle' | 'submitting' | 'pending' | 'processing' | 'succeeded' | 'failed'

interface VideoGenState {
  jobId:    string | null
  status:   JobStatus
  videoUrl: string | null
  error:    string | null
}

interface ImgenState {
  jobId:   string | null
  status:  'idle' | 'submitting' | 'pending' | 'processing' | 'done' | 'error'
  images:  string[]
  error:   string | null
}

interface PreProdState {
  status:       'idle' | 'generating' | 'done' | 'error'
  concept:      string
  script:       string
  storyboard:   string
  ambiance:     string
  promptFinal:  string
  error:        string | null
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

// ── Constants ──────────────────────────────────────────────────────────────────

const DURATIONS   = ['4', '5', '8', '10', '12', '15']
const RESOLUTIONS = [
  { v: '480p',  l: '480p' },
  { v: '720p',  l: '720p HD' },
  { v: '1080p', l: '1080p Full HD' },
]
const RATIOS = [
  { v: '16:9', l: '16:9' },
  { v: '9:16', l: '9:16' },
  { v: '4:3',  l: '4:3'  },
  { v: '3:4',  l: '3:4'  },
  { v: '21:9', l: '21:9' },
  { v: '1:1',  l: '1:1'  },
]
const MAX_REFS = 9

// ── ImageCard — hover download ─────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function ImageCard({ url, index, onDownload }: { url: string; index: number; onDownload: (url: string, i: number) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0a14', cursor: 'pointer' }}
    >
      <img src={url} alt={`Image ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {/* Badge numéro */}
      <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.85)', fontSize: '11px', fontWeight: 700 }}>#{index + 1}</div>
      {/* Overlay hover */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.18s ease',
        pointerEvents: hovered ? 'auto' : 'none',
      }}>
        <button
          onClick={() => onDownload(url, index)}
          title="Télécharger"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          <DownloadIcon /> Télécharger
        </button>
        <button
          onClick={() => window.open(url, '_blank')}
          title="Ouvrir en plein écran"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '16px', cursor: 'pointer' }}
        >↗</button>
      </div>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [tab,         setTab]        = useState<Tab>('image')
  const [prompt,      setPrompt]     = useState('')          // Image IA uniquement
  const [description, setDescription] = useState('')         // Video IA — description libre
  const [duration,    setDuration]   = useState('8')
  const [resolution,  setResolution] = useState('1080p')
  const [ratio,       setRatio]      = useState('16:9')
  const [quality,     setQuality]    = useState<VideoQuality>('standard')

  // Références visuelles (obligatoires)
  const [refImages,   setRefImages]   = useState<File[]>([])
  const [refPreviews, setRefPreviews] = useState<string[]>([])

  const [gen,     setGen]     = useState<VideoGenState>({ jobId: null, status: 'idle', videoUrl: null, error: null })
  const [imgen,   setImgen]   = useState<ImgenState>({ jobId: null, status: 'idle', images: [], error: null })
  const [preProd, setPreProd] = useState<PreProdState>({
    status: 'idle', concept: '', script: '', storyboard: '', ambiance: '', promptFinal: '', error: null,
  })
  const [copied, setCopied] = useState(false)

  const fileInputRef    = useRef<HTMLInputElement>(null)
  const pollRef         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imagePollRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef        = useRef<HTMLVideoElement>(null)
  const imgStartRef     = useRef<number | null>(null)
  const vidStartRef     = useRef<number | null>(null)
  const [imgElapsed, setImgElapsed] = useState(0)
  const [vidElapsed, setVidElapsed] = useState(0)

  // Timers d'affichage
  useEffect(() => {
    if (!isImgRunning) { imgStartRef.current = null; setImgElapsed(0); return }
    if (!imgStartRef.current) imgStartRef.current = Date.now()
    const t = setInterval(() => setImgElapsed(Math.floor((Date.now() - imgStartRef.current!) / 1000)), 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgen.status])

  useEffect(() => {
    if (!isRunning) { vidStartRef.current = null; setVidElapsed(0); return }
    if (!vidStartRef.current) vidStartRef.current = Date.now()
    const t = setInterval(() => setVidElapsed(Math.floor((Date.now() - vidStartRef.current!) / 1000)), 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gen.status])

  // Cleanup polling timers on unmount
  useEffect(() => () => {
    if (pollRef.current)      clearTimeout(pollRef.current)
    if (imagePollRef.current) clearTimeout(imagePollRef.current)
  }, [])

  // ── Multi-image upload ─────────────────────────────────────────────────────

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!arr.length) return
    setRefImages(prev => {
      const next = [...prev, ...arr].slice(0, MAX_REFS)
      next.slice(prev.length).forEach((f, i) => {
        const r = new FileReader()
        r.onload = e => setRefPreviews(pp => {
          const np = [...pp]; np[prev.length + i] = e.target?.result as string; return np
        })
        r.readAsDataURL(f)
      })
      return next
    })
  }, [])

  const removeRef = (i: number) => {
    setRefImages(p => p.filter((_, j) => j !== i))
    setRefPreviews(p => p.filter((_, j) => j !== i))
  }

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); addFiles(e.dataTransfer.files) }
  const canAddMore = refImages.length < MAX_REFS

  // ── Polling vidéo ──────────────────────────────────────────────────────────

  const pollStatus = useCallback(async (jobId: string, attempt = 0) => {
    try {
      const res  = await fetch(`/api/studio/status/${jobId}`, { headers: { 'x-admin-secret': ADMIN_SECRET } })
      const data = await res.json()
      if (data.status === 'succeeded' && data.videoUrl) {
        setGen({ jobId, status: 'succeeded', videoUrl: data.videoUrl, error: null }); return
      }
      if (['failed', 'expired', 'cancelled'].includes(data.status)) {
        setGen(p => ({ ...p, status: 'failed', error: data.error ?? `Tâche ${data.status}` })); return
      }
      const delay = attempt < 3 ? 5000 : attempt < 8 ? 8000 : 12000
      setGen(p => ({ ...p, status: data.status === 'processing' ? 'processing' : 'pending' }))
      pollRef.current = setTimeout(() => pollStatus(jobId, attempt + 1), delay)
    } catch {
      pollRef.current = setTimeout(() => pollStatus(jobId, attempt + 1), 6000)
    }
  }, [])

  // ── Générer pré-prod via Claude ────────────────────────────────────────────

  const handleGeneratePreProd = async () => {
    if (!description.trim() || refImages.length === 0) return
    setPreProd({ status: 'generating', concept: '', script: '', storyboard: '', ambiance: '', promptFinal: '', error: null })
    try {
      const res = await fetch('/api/studio/generate-preprod', {
        method: 'POST',
        headers: { 'x-admin-secret': ADMIN_SECRET, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          ratio, duration: parseInt(duration, 10), quality, numRefs: refImages.length,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setPreProd(p => ({ ...p, status: 'error', error: data.error ?? 'Erreur Claude' })); return
      }
      setPreProd({ status: 'done', concept: data.concept, script: data.script, storyboard: data.storyboard, ambiance: data.ambiance, promptFinal: data.promptFinal, error: null })
    } catch (e) {
      setPreProd(p => ({ ...p, status: 'error', error: (e as Error).message }))
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(preProd.promptFinal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Submit vidéo ───────────────────────────────────────────────────────────

  const handleGenerateVideo = async () => {
    // Video uses the prompt final from pre-prod (or description as fallback)
    const videoPrompt = preProd.promptFinal.trim() || description.trim()
    if (!videoPrompt || refImages.length === 0) return
    if (pollRef.current) clearTimeout(pollRef.current)
    setGen({ jobId: null, status: 'submitting', videoUrl: null, error: null })
    try {
      const form = new FormData()
      form.append('prompt', videoPrompt)
      form.append('duration', duration)
      form.append('resolution', resolution)
      form.append('ratio', ratio)
      form.append('quality', quality)
      refImages.forEach(f => form.append('refs', f))
      const res  = await fetch('/api/studio/submit', { method: 'POST', headers: { 'x-admin-secret': ADMIN_SECRET }, body: form })
      const data = await res.json()
      if (!res.ok || data.error) { setGen({ jobId: null, status: 'failed', videoUrl: null, error: data.error ?? 'Erreur serveur' }); return }
      setGen({ jobId: data.jobId, status: 'pending', videoUrl: null, error: null })
      pollStatus(data.jobId)
    } catch (e) { setGen({ jobId: null, status: 'failed', videoUrl: null, error: (e as Error).message }) }
  }

  // ── Polling images ─────────────────────────────────────────────────────────

  const pollImageStatus = useCallback(async (jobId: string, attempt = 0) => {
    // Timeout à 3 min (36 tentatives × ~5s moy)
    if (attempt >= 36) {
      setImgen(p => ({ ...p, status: 'error', error: 'Timeout — BytePlus n\'a pas répondu en 3 min. Réessaie.' }))
      return
    }
    try {
      const res  = await fetch(`/api/studio/image-status/${jobId}`, { headers: { 'x-admin-secret': ADMIN_SECRET } })
      const data = await res.json()
      if (data.status === 'succeeded' && data.images?.length) {
        setImgen({ jobId, status: 'done', images: data.images, error: null }); return
      }
      if (['failed', 'expired', 'cancelled'].includes(data.status)) {
        setImgen(p => ({ ...p, status: 'error', error: data.error ?? `Tâche ${data.status}` })); return
      }
      const delay = attempt < 3 ? 4000 : attempt < 8 ? 6000 : 10000
      setImgen(p => ({ ...p, status: data.status === 'processing' ? 'processing' : 'pending' }))
      imagePollRef.current = setTimeout(() => pollImageStatus(jobId, attempt + 1), delay)
    } catch {
      imagePollRef.current = setTimeout(() => pollImageStatus(jobId, attempt + 1), 5000)
    }
  }, [])

  // ── Submit images ──────────────────────────────────────────────────────────

  const handleGenerateImages = async () => {
    if (!prompt.trim() || refImages.length === 0) return
    if (imagePollRef.current) clearTimeout(imagePollRef.current)
    setImgen({ jobId: null, status: 'submitting', images: [], error: null })
    try {
      const form = new FormData()
      form.append('prompt', prompt.trim())
      form.append('ratio', ratio)
      form.append('numImages', '4')
      refImages.forEach(f => form.append('refs', f))
      const res  = await fetch('/api/studio/generate-images', { method: 'POST', headers: { 'x-admin-secret': ADMIN_SECRET }, body: form })
      const data = await res.json()
      if (!res.ok || data.error) { setImgen({ jobId: null, status: 'error', images: [], error: data.error ?? 'Erreur serveur' }); return }
      // API synchrone — images retournées directement
      if (data.images?.length) {
        setImgen({ jobId: null, status: 'done', images: data.images, error: null }); return
      }
      // Fallback polling (cas async inattendu)
      setImgen({ jobId: data.jobId ?? null, status: 'pending', images: [], error: null })
      if (data.jobId) pollImageStatus(data.jobId)
    } catch (e) { setImgen({ jobId: null, status: 'error', images: [], error: (e as Error).message }) }
  }

  // ── Download ───────────────────────────────────────────────────────────────

  const handleDownloadVideo = async () => {
    if (!gen.videoUrl) return
    try { const r = await fetch(gen.videoUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `sceniq-${Date.now()}.mp4`; a.click(); URL.revokeObjectURL(u) }
    catch { window.open(gen.videoUrl, '_blank') }
  }
  const handleDownloadImage = async (url: string, i: number) => {
    try { const r = await fetch(url); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `sceniq-img-${i + 1}-${Date.now()}.jpg`; a.click(); URL.revokeObjectURL(u) }
    catch { window.open(url, '_blank') }
  }

  // ── Computed ───────────────────────────────────────────────────────────────

  const hasRefs          = refImages.length > 0
  const hasPrompt        = !!prompt.trim()
  const hasDescription   = !!description.trim()
  const isRunning        = gen.status === 'submitting' || gen.status === 'pending' || gen.status === 'processing'
  const isImgRunning     = imgen.status === 'submitting' || imgen.status === 'pending' || imgen.status === 'processing'
  const isPreProdRunning = preProd.status === 'generating'
  const canGenVideo      = !isRunning && !!preProd.promptFinal.trim() && hasRefs
  const canGenImage      = !isImgRunning && hasPrompt && hasRefs
  const canGenPreProd    = !isPreProdRunning && hasDescription && hasRefs

  const statusLabel: Record<JobStatus, string> = {
    idle: '', submitting: 'Envoi…', pending: 'En file d\'attente…',
    processing: 'Génération (2-4 min)…', succeeded: 'Vidéo prête !', failed: 'Erreur',
  }

  const aspectCss = (r: string) =>
    r === '9:16' ? '9/16' : r === '4:3' ? '4/3' : r === '3:4' ? '3/4' : r === '21:9' ? '21/9' : r === '1:1' ? '1/1' : '16/9'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex', gap: '24px',
      margin: '-36px -40px -64px',
      padding: '24px',
      minHeight: 'calc(100vh - 72px)',
      background: '#0A0A14',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px',
        border: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
      }}>

        {/* ── 2 Tabs ── */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          {([
            { v: 'image', l: '🖼️ Image IA' },
            { v: 'video', l: '🎬 Vidéo IA' },
          ] as { v: Tab; l: string }[]).map(t => (
            <button key={t.v} onClick={() => setTab(t.v)} style={{
              flex: 1, padding: '10px 0', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 700, transition: 'all 0.15s',
              background: tab === t.v ? '#7C5CFC' : 'transparent',
              color:      tab === t.v ? '#fff' : 'rgba(255,255,255,0.45)',
            }}>{t.l}</button>
          ))}
        </div>

        {/* ── Qualité vidéo (tab vidéo uniquement) ── */}
        {tab === 'video' && (
          <div>
            <label style={labelStyle}>Qualité vidéo</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {([
                { v: 'standard', l: 'S2.0', hint: '~2-4 min · Meilleure qualité' },
                { v: 'fast',     l: 'S2.0 Fast', hint: '~30-60s · Rendu rapide' },
              ] as { v: VideoQuality; l: string; hint: string }[]).map(q => (
                <button key={q.v} onClick={() => setQuality(q.v)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: '10px', border: '1px solid', cursor: 'pointer',
                  borderColor:  quality === q.v ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                  background:   quality === q.v ? 'rgba(124,92,252,0.15)' : 'transparent',
                  transition: 'all 0.15s', textAlign: 'left',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: quality === q.v ? '#A78BFA' : 'rgba(255,255,255,0.7)' }}>{q.l}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{q.hint}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Prompt (Image) / Description (Vidéo) ── */}
        {tab === 'image' ? (
          <div>
            <label style={labelStyle}>Prompt</label>
            <textarea
              value={prompt} onChange={e => setPrompt(e.target.value)}
              maxLength={2000}
              placeholder='Décris l&apos;image… ex : "Flacon de parfum sur marbre noir, éclairage studio, fond sombre"'
              rows={4}
              style={textareaStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', textAlign: 'right' }}>{prompt.length} / 2000</div>
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Décris avec tes mots ce que tu imagines</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              maxLength={1000}
              placeholder='Ex : "Un flacon de parfum posé sur un socle en marbre noir, lumière studio dorée, atmosphère luxe. Le flacon tourne lentement sur lui-même. Fin avec le logo en fondu."'
              rows={5}
              style={textareaStyle}
              onFocus={e => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', textAlign: 'right' }}>{description.length} / 1000</div>
          </div>
        )}

        {/* ── Références visuelles (obligatoires) ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              Références visuelles <span style={{ color: '#F87171', fontSize: '11px' }}>*</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px' }}>{refImages.length}/{MAX_REFS}</span>
            </label>
            {canAddMore && refImages.length > 0 && (
              <button onClick={() => fileInputRef.current?.click()} style={{ fontSize: '11px', fontWeight: 600, color: '#A78BFA', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' }}>+ Ajouter</button>
            )}
          </div>

          {refImages.length === 0 ? (
            <div
              onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
              style={{ border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '12px', cursor: 'pointer', minHeight: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
            >
              <div style={{ fontSize: '28px' }}>📸</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Glisse tes images ici</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>JPG · PNG · WebP — 1 à {MAX_REFS} images</div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                {refPreviews.map((src, i) => src && (
                  <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#111' }}>
                    <img src={src} alt={`Ref ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '4px', left: '4px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.8)', fontSize: '9px', fontWeight: 700 }}>#{i + 1}</div>
                    <button onClick={e => { e.stopPropagation(); removeRef(i) }} style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {refImages.length < refPreviews.filter(Boolean).length + 1 && refImages.slice(refPreviews.filter(Boolean).length).map((_, i) => (
                  <div key={`ld-${i}`} style={{ borderRadius: '8px', aspectRatio: '1', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SpinnerIcon size={14} /></div>
                ))}
                {canAddMore && (
                  <div
                    onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                    style={{ borderRadius: '8px', aspectRatio: '1', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'rgba(255,255,255,0.2)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,92,252,0.4)'; e.currentTarget.style.color = '#A78BFA' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
                  >+</div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
                {tab === 'video' ? 'La 1ère image guide le style visuel de la vidéo.' : 'Les images orientent le style et le sujet des rendus.'}
              </div>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { if (e.target.files) { addFiles(e.target.files); e.target.value = '' } }}
          />
        </div>

        {/* ── Format / Ratio ── */}
        <div>
          <label style={labelStyle}>Format</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {RATIOS.map(r => (
              <button key={r.v} onClick={() => setRatio(r.v)} style={{
                padding: '8px 4px', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                borderColor: ratio === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                background:  ratio === r.v ? 'rgba(124,92,252,0.2)' : 'transparent',
                color:       ratio === r.v ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
              }}>{r.l}</button>
            ))}
          </div>
        </div>

        {/* ── Durée + Résolution (vidéo uniquement) ── */}
        {tab === 'video' && (<>
          <div>
            <label style={labelStyle}>Durée</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                  borderColor: duration === d ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                  background:  duration === d ? 'rgba(124,92,252,0.2)' : 'transparent',
                  color:       duration === d ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                  fontSize: '13px', fontWeight: 600, transition: 'all 0.15s',
                }}>{d}s</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Résolution</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {RESOLUTIONS.map(r => (
                <button key={r.v} onClick={() => setResolution(r.v)} style={{
                  padding: '10px 14px', borderRadius: '8px', border: '1px solid', textAlign: 'left', cursor: 'pointer',
                  borderColor: resolution === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                  background:  resolution === r.v ? 'rgba(124,92,252,0.15)' : 'transparent',
                  color:       resolution === r.v ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                  fontSize: '13px', fontWeight: resolution === r.v ? 600 : 400, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderColor: resolution === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.2)', background: resolution === r.v ? '#7C5CFC' : 'transparent', flexShrink: 0 }}/>
                  {r.l}
                </button>
              ))}
            </div>
          </div>
        </>)}

        {/* ── CTA ── */}
        {tab === 'image' ? (
          <button onClick={handleGenerateImages} disabled={!canGenImage} style={ctaStyle(canGenImage)}>
            {isImgRunning
              ? <span style={flexCenter}><SpinnerIcon />Génération en cours…</span>
              : '🖼️ Générer 4 images'}
          </button>
        ) : (
          <button onClick={handleGeneratePreProd} disabled={!canGenPreProd} style={ctaStyle(canGenPreProd)}>
            {isPreProdRunning
              ? <span style={flexCenter}><SpinnerIcon />Claude prépare la pré-prod…</span>
              : '✨ Générer la pré-prod'}
          </button>
        )}

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: 0 }}>
          {tab === 'image'
            ? 'Dreamina Image 5.0 Lite · BytePlus · 4 images'
            : `Claude Sonnet → Seedance ${quality === 'fast' ? '2.0 Fast' : '2.0'} · ${duration}s`}
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>

        {/* Header */}
        {tab === 'image' && (
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
            4 images générées
          </h2>
        )}
        {tab === 'video' && preProd.status === 'done' && gen.status === 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Pré-production</h2>
            <button onClick={() => { setPreProd(p => ({ ...p, status: 'idle' })); setGen({ jobId: null, status: 'idle', videoUrl: null, error: null }) }} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', background: 'transparent', border: 'none', cursor: 'pointer' }}>✕ Recommencer</button>
          </div>
        )}
        {tab === 'video' && gen.status === 'succeeded' && (
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Vidéo prête ✓</h2>
        )}

        {/* ── MODE IMAGE IA ── */}
        {tab === 'image' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {imgen.status === 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div><div style={{ fontSize: '48px', marginBottom: '12px' }}>🖼️</div><div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>4 images apparaîtront ici</div><div style={{ fontSize: '13px', marginTop: '6px', color: 'rgba(255,255,255,0.2)' }}>Dreamina Image 5.0 Lite · BytePlus</div></div>
              </div>
            )}
            {isImgRunning && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div>
                  <LoadingWave />
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', color: 'rgba(255,255,255,0.6)' }}>
                    {imgen.status === 'submitting' && 'Envoi de la requête…'}
                    {imgen.status === 'pending'    && 'En file d\'attente Dreamina…'}
                    {imgen.status === 'processing' && 'Image 5.0 Lite génère…'}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '6px', color: 'rgba(255,255,255,0.3)' }}>
                    {imgElapsed > 0 ? `${imgElapsed}s écoulées — max ~3 min` : 'Peut prendre 1-2 min'}
                  </div>
                </div>
              </div>
            )}
            {imgen.status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div><div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div><div style={{ fontSize: '15px', fontWeight: 600, color: '#F87171', marginBottom: '8px' }}>Erreur génération</div><div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{imgen.error}</div><button onClick={() => setImgen({ jobId: null, status: 'idle', images: [], error: null })} style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Réessayer</button></div>
              </div>
            )}
            {imgen.status === 'done' && imgen.images.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setImgen({ jobId: null, status: 'idle', images: [], error: null })}
                  style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >↺ Générer à nouveau</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {imgen.images.map((url, i) => (
                  <ImageCard key={i} url={url} index={i} onDownload={handleDownloadImage} />
                ))}
              </div>
              </div>
            )}
          </div>
        )}

        {/* ── MODE VIDÉO IA ── */}
        {tab === 'video' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0' }}>

            {/* État idle — invite */}
            {preProd.status === 'idle' && gen.status === 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', minHeight: '300px' }}>
                <div>
                  <div style={{ fontSize: '52px', marginBottom: '16px' }}>✨</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Décris ta vidéo et génère la pré-prod</div>
                  <div style={{ fontSize: '13px', marginTop: '8px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>Claude va créer le concept, le script,<br/>le storyboard et le prompt Seedance optimisé.</div>
                </div>
              </div>
            )}

            {/* Génération pré-prod en cours */}
            {preProd.status === 'generating' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', minHeight: '300px' }}>
                <div>
                  <LoadingWave />
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', color: 'rgba(255,255,255,0.6)' }}>Claude prépare la pré-production…</div>
                  <div style={{ fontSize: '12px', marginTop: '6px', color: 'rgba(255,255,255,0.3)' }}>Concept · Script · Storyboard · Prompt final — ~15s</div>
                </div>
              </div>
            )}

            {/* Erreur pré-prod */}
            {preProd.status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', minHeight: '200px' }}>
                <div>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#F87171', marginBottom: '8px' }}>Erreur pré-production</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{preProd.error}</div>
                  <button onClick={() => setPreProd(p => ({ ...p, status: 'idle' }))} style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Réessayer</button>
                </div>
              </div>
            )}

            {/* 5 sections éditables + Prompt final */}
            {preProd.status === 'done' && gen.status === 'idle' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {([
                  { key: 'concept',    label: '🎯 Concept & angle narratif',    field: preProd.concept,    setter: (v: string) => setPreProd(p => ({ ...p, concept: v })),    rows: 4 },
                  { key: 'script',     label: '🎙️ Script voix-off + textes',   field: preProd.script,     setter: (v: string) => setPreProd(p => ({ ...p, script: v })),     rows: 4 },
                  { key: 'storyboard', label: '🎞️ Storyboard — shots',         field: preProd.storyboard, setter: (v: string) => setPreProd(p => ({ ...p, storyboard: v })), rows: 7 },
                  { key: 'ambiance',   label: '🎵 Ambiance sonore (No Lyrics)', field: preProd.ambiance,   setter: (v: string) => setPreProd(p => ({ ...p, ambiance: v })),   rows: 3 },
                ] as const).map(s => (
                  <div key={s.key}>
                    <label style={{ ...labelStyle, marginBottom: '6px' }}>{s.label}</label>
                    <textarea
                      value={s.field}
                      onChange={e => s.setter(e.target.value)}
                      rows={s.rows}
                      style={{ ...textareaStyle, fontSize: '13px' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(124,92,252,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                ))}

                {/* Prompt final — section spéciale */}
                <div style={{ borderRadius: '12px', border: '1px solid rgba(124,92,252,0.3)', background: 'rgba(124,92,252,0.06)', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0, color: '#A78BFA' }}>✅ Prompt final — Copier / Coller</label>
                    <button
                      onClick={handleCopyPrompt}
                      style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid rgba(124,92,252,0.4)', background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(124,92,252,0.15)', color: copied ? '#4ADE80' : '#A78BFA', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {copied ? '✓ Copié !' : '📋 Copier'}
                    </button>
                  </div>
                  <textarea
                    value={preProd.promptFinal}
                    onChange={e => setPreProd(p => ({ ...p, promptFinal: e.target.value }))}
                    rows={6}
                    style={{ ...textareaStyle, fontSize: '13px', borderColor: 'rgba(124,92,252,0.25)', background: 'rgba(124,92,252,0.05)', fontFamily: 'monospace' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(124,92,252,0.25)')}
                  />
                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                    <button onClick={handleGenerateVideo} disabled={!canGenVideo} style={ctaStyle(canGenVideo)}>
                      {isRunning
                        ? <span style={flexCenter}><SpinnerIcon />Génération Seedance…</span>
                        : `🎬 Générer la vidéo ${duration}s`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Vidéo en cours de génération */}
            {isRunning && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', minHeight: '300px' }}>
                <div>
                  <LoadingWave />
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '24px', color: 'rgba(255,255,255,0.6)' }}>
                    {gen.status === 'submitting' && 'Envoi à Seedance…'}
                    {gen.status === 'pending'    && 'En file d\'attente Seedance…'}
                    {gen.status === 'processing' && `Dreamina ${quality === 'fast' ? 'S2.0 Fast' : 'S2.0'} génère…`}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '6px', color: 'rgba(255,255,255,0.3)' }}>
                    {quality === 'fast' ? '~30-60 secondes' : '~2-4 minutes'}
                  </div>
                </div>
              </div>
            )}

            {/* Vidéo échouée */}
            {gen.status === 'failed' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', minHeight: '200px' }}>
                <div>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#F87171', marginBottom: '8px' }}>Génération vidéo échouée</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', lineHeight: 1.6 }}>{gen.error}</div>
                  <button onClick={() => setGen({ jobId: null, status: 'idle', videoUrl: null, error: null })} style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Réessayer</button>
                </div>
              </div>
            )}

            {/* Vidéo prête */}
            {gen.status === 'succeeded' && gen.videoUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video ref={videoRef} src={gen.videoUrl} controls autoPlay loop playsInline style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 0 60px rgba(124,92,252,0.3)' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleDownloadVideo} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)', color: '#fff', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 16px rgba(124,92,252,0.4)' }}>⬇️ Télécharger MP4</button>
                  <button onClick={() => window.open(gen.videoUrl!, '_blank')} style={{ padding: '14px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer' }}>🔗</button>
                </div>
                <button
                  onClick={() => setGen({ jobId: null, status: 'idle', videoUrl: null, error: null })}
                  style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
                >↺ Générer à nouveau (modifier le prompt)</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
  letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', padding: '12px 14px', color: '#fff',
  fontSize: '14px', lineHeight: 1.6, resize: 'vertical', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}

const flexCenter: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
}

const ctaStyle = (enabled: boolean): React.CSSProperties => ({
  marginTop: '4px', padding: '16px', borderRadius: '12px', border: 'none',
  cursor:     enabled ? 'pointer' : 'not-allowed',
  background: enabled ? 'linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)' : 'rgba(255,255,255,0.08)',
  color:      enabled ? '#fff' : 'rgba(255,255,255,0.3)',
  fontSize: '15px', fontWeight: 700, transition: 'all 0.2s',
  boxShadow: enabled ? '0 4px 20px rgba(124,92,252,0.4)' : 'none',
  width: '100%',
})

// ── Status helpers ─────────────────────────────────────────────────────────────

function statusBg(s: JobStatus) {
  if (s === 'succeeded') return 'rgba(74,222,128,0.1)'
  if (s === 'failed')    return 'rgba(248,113,113,0.1)'
  return 'rgba(255,255,255,0.06)'
}
function statusBorder(s: JobStatus) {
  if (s === 'succeeded') return 'rgba(74,222,128,0.3)'
  if (s === 'failed')    return 'rgba(248,113,113,0.3)'
  return 'rgba(255,255,255,0.1)'
}
function statusColor(s: JobStatus) {
  if (s === 'succeeded') return '#4ADE80'
  if (s === 'failed')    return '#F87171'
  return 'rgba(255,255,255,0.6)'
}

// ── UI Components ──────────────────────────────────────────────────────────────

function SpinnerIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M14 8a6 6 0 0 1-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function LoadingWave() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '64px' }}>
      <style>{`@keyframes wave { 0%,100% { height: 8px } 50% { height: 40px } }`}</style>
      {[0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0].map((d, i) => (
        <div key={i} style={{ width: '5px', height: '8px', background: '#7C5CFC', borderRadius: '3px', animation: `wave 1.2s ease-in-out ${d}s infinite` }} />
      ))}
    </div>
  )
}
