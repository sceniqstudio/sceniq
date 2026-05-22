'use client'
// app/(app)/dashboard/studio/page.tsx
// Studio IA — Text→Video · Image→Video · Text→Images (4 images)

import { useState, useRef, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab       = 'text' | 'image' | 'imgen'
type JobStatus = 'idle' | 'submitting' | 'pending' | 'processing' | 'succeeded' | 'failed'

interface VideoGenState {
  jobId:    string | null
  status:   JobStatus
  videoUrl: string | null
  error:    string | null
}

interface ImgenState {
  status:  'idle' | 'loading' | 'done' | 'error'
  images:  string[]
  error:   string | null
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

// ── Constants ─────────────────────────────────────────────────────────────────

const DURATIONS   = ['4', '5', '8', '10', '12', '15']
const RESOLUTIONS = [{ v: '480p', l: '480p' }, { v: '720p', l: '720p HD' }, { v: '1080p', l: '1080p Full HD' }]
const RATIOS      = [{ v: '16:9', l: '16:9 — Paysage' }, { v: '9:16', l: '9:16 — Portrait' }, { v: '1:1', l: '1:1 — Carré' }]

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [tab,          setTab]          = useState<Tab>('text')
  const [prompt,       setPrompt]       = useState('')
  const [duration,     setDuration]     = useState('8')
  const [resolution,   setResolution]   = useState('1080p')
  const [ratio,        setRatio]        = useState('16:9')
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [gen,          setGen]          = useState<VideoGenState>({
    jobId: null, status: 'idle', videoUrl: null, error: null,
  })
  const [imgen, setImgen] = useState<ImgenState>({ status: 'idle', images: [], error: null })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)

  // ── Polling vidéo ────────────────────────────────────────────────────────────

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

  // ── Submit vidéo ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    if (tab === 'image' && !imageFile) return
    if (pollRef.current) clearTimeout(pollRef.current)
    setGen({ jobId: null, status: 'submitting', videoUrl: null, error: null })
    try {
      const form = new FormData()
      form.append('prompt', prompt.trim())
      form.append('duration', duration)
      form.append('resolution', resolution)
      form.append('ratio', ratio)
      if (tab === 'image' && imageFile) form.append('image', imageFile)
      const res  = await fetch('/api/studio/submit', { method: 'POST', headers: { 'x-admin-secret': ADMIN_SECRET }, body: form })
      const data = await res.json()
      if (!res.ok || data.error) { setGen({ jobId: null, status: 'failed', videoUrl: null, error: data.error ?? 'Erreur serveur' }); return }
      setGen({ jobId: data.jobId, status: 'pending', videoUrl: null, error: null })
      pollStatus(data.jobId)
    } catch (e) { setGen({ jobId: null, status: 'failed', videoUrl: null, error: (e as Error).message }) }
  }

  // ── Générer images ───────────────────────────────────────────────────────────

  const handleGenerateImages = async () => {
    if (!prompt.trim()) return
    setImgen({ status: 'loading', images: [], error: null })
    try {
      const res  = await fetch('/api/studio/generate-images', {
        method: 'POST',
        headers: { 'x-admin-secret': ADMIN_SECRET, 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), ratio }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setImgen({ status: 'error', images: [], error: data.error ?? 'Erreur' }); return }
      setImgen({ status: 'done', images: data.images ?? [], error: null })
    } catch (e) { setImgen({ status: 'error', images: [], error: (e as Error).message }) }
  }

  // ── Image upload ─────────────────────────────────────────────────────────────

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) { const r = new FileReader(); r.onload = e => setImagePreview(e.target?.result as string); r.readAsDataURL(file) }
    else setImagePreview(null)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleImageChange(file)
  }

  // ── Download ─────────────────────────────────────────────────────────────────

  const handleDownloadVideo = async () => {
    if (!gen.videoUrl) return
    try { const r = await fetch(gen.videoUrl); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `sceniq-${Date.now()}.mp4`; a.click(); URL.revokeObjectURL(u) }
    catch { window.open(gen.videoUrl, '_blank') }
  }

  const handleDownloadImage = async (url: string, i: number) => {
    try { const r = await fetch(url); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `sceniq-img-${i + 1}-${Date.now()}.jpg`; a.click(); URL.revokeObjectURL(u) }
    catch { window.open(url, '_blank') }
  }

  // ── Computed ─────────────────────────────────────────────────────────────────

  const isVideoTab   = tab === 'text' || tab === 'image'
  const isRunning    = gen.status === 'submitting' || gen.status === 'pending' || gen.status === 'processing'
  const canGenVideo  = !isRunning && !!prompt.trim() && (tab === 'text' || !!imageFile)
  const canGenImages = imgen.status !== 'loading' && !!prompt.trim()

  const statusLabel: Record<JobStatus, string> = {
    idle: '', submitting: 'Envoi…', pending: 'En file d\'attente…',
    processing: 'Génération (2-4 min)…', succeeded: 'Vidéo prête !', failed: 'Erreur',
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    /* fond dark full-bleed — contre-carre le padding blanc de app-main */
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
        width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px',
        border: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
      }}>

        {/* Tabs — 3 onglets */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          {([
            { v: 'text',  l: '✏️ Texte→Vidéo' },
            { v: 'image', l: '🖼️ Image→Vidéo' },
            { v: 'imgen', l: '🎨 Texte→Images' },
          ] as { v: Tab; l: string }[]).map(t => (
            <button key={t.v} onClick={() => setTab(t.v)} style={{
              flex: 1, padding: '8px 0', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
              background: tab === t.v ? '#7C5CFC' : 'transparent',
              color:      tab === t.v ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>{t.l}</button>
          ))}
        </div>

        {/* Upload zone (Image→Vidéo) */}
        {tab === 'image' && (
          <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${imagePreview ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '12px', cursor: 'pointer', overflow: 'hidden', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
            {imagePreview ? (
              <><img src={imagePreview} alt="Ref" style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '200px' }} />
              <button onClick={e => { e.stopPropagation(); handleImageChange(null) }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', color: '#fff', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>✕</button></>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Glisse ton image ici</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>ou clique pour parcourir</div>
                <div style={{ fontSize: '11px', marginTop: '8px', color: 'rgba(255,255,255,0.25)' }}>JPG · PNG · WebP — max 10 Mo</div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageChange(e.target.files?.[0] ?? null)} />
          </div>
        )}

        {/* Prompt */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={
              tab === 'imgen' ? 'Décris l\'image… ex : "Flacon de parfum sur marbre noir, éclairage studio, fond sombre, reflets dorés"'
              : tab === 'image' ? 'Décris le mouvement… ex : "Zoom lent sur le produit, fond bokeh"'
              : 'Décris la vidéo… ex : "Barista verse un latte art en slow motion, lumière dorée"'
            }
            rows={5} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#fff', fontSize: '14px', lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onFocus={e => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', textAlign: 'right' }}>{prompt.length} / 2000</div>
        </div>

        {/* Ratio (commun à tous les modes) */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Format</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {RATIOS.map(r => (
              <button key={r.v} onClick={() => setRatio(r.v)} style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: '1px solid', borderColor: ratio === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.1)', background: ratio === r.v ? 'rgba(124,92,252,0.2)' : 'transparent', color: ratio === r.v ? '#A78BFA' : 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                {r.v}
              </button>
            ))}
          </div>
        </div>

        {/* Durée + Résolution (vidéo uniquement) */}
        {isVideoTab && (<>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Durée</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid', borderColor: duration === d ? '#7C5CFC' : 'rgba(255,255,255,0.1)', background: duration === d ? 'rgba(124,92,252,0.2)' : 'transparent', color: duration === d ? '#A78BFA' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{d}s</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Résolution</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {RESOLUTIONS.map(r => (
                <button key={r.v} onClick={() => setResolution(r.v)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid', textAlign: 'left', borderColor: resolution === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.1)', background: resolution === r.v ? 'rgba(124,92,252,0.15)' : 'transparent', color: resolution === r.v ? '#A78BFA' : 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: resolution === r.v ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid', borderColor: resolution === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.2)', background: resolution === r.v ? '#7C5CFC' : 'transparent', flexShrink: 0 }}/>
                  {r.l}
                </button>
              ))}
            </div>
          </div>
        </>)}

        {/* CTA */}
        {tab === 'imgen' ? (
          <button onClick={handleGenerateImages} disabled={!canGenImages} style={{ marginTop: '4px', padding: '16px', borderRadius: '12px', border: 'none', cursor: canGenImages ? 'pointer' : 'not-allowed', background: canGenImages ? 'linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)' : 'rgba(255,255,255,0.08)', color: canGenImages ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '15px', fontWeight: 700, transition: 'all 0.2s', boxShadow: canGenImages ? '0 4px 20px rgba(124,92,252,0.4)' : 'none' }}>
            {imgen.status === 'loading' ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><SpinnerIcon />Génération des 4 images…</span> : '🎨 Générer 4 images'}
          </button>
        ) : (
          <button onClick={handleGenerate} disabled={!canGenVideo} style={{ marginTop: '4px', padding: '16px', borderRadius: '12px', border: 'none', cursor: canGenVideo ? 'pointer' : 'not-allowed', background: canGenVideo ? 'linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)' : 'rgba(255,255,255,0.08)', color: canGenVideo ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '15px', fontWeight: 700, transition: 'all 0.2s', boxShadow: canGenVideo ? '0 4px 20px rgba(124,92,252,0.4)' : 'none' }}>
            {isRunning ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><SpinnerIcon />Génération…</span> : '🎬 Générer la vidéo'}
          </button>
        )}

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: 0 }}>
          {tab === 'imgen' ? 'FLUX.1 Schnell · fal.ai · ~4 images en 10-15s' : `Seedance 2.0 Pro · BytePlus · ~$0.075/s · ${duration}s ≈ $${(Number(duration) * 0.075).toFixed(2)}`}
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
            {tab === 'imgen' ? '4 images générées' : 'Aperçu vidéo'}
          </h2>
          {isVideoTab && gen.status !== 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: statusBg(gen.status), border: `1px solid ${statusBorder(gen.status)}` }}>
              {isRunning && <SpinnerIcon size={12} />}
              {gen.status === 'succeeded' && <span style={{ color: '#4ADE80', fontSize: '12px' }}>✓</span>}
              {gen.status === 'failed' && <span style={{ color: '#F87171', fontSize: '12px' }}>✕</span>}
              <span style={{ fontSize: '12px', fontWeight: 600, color: statusColor(gen.status) }}>{statusLabel[gen.status]}</span>
            </div>
          )}
        </div>

        {/* ── MODE IMAGES ── */}
        {tab === 'imgen' && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {imgen.status === 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>
                <div><div style={{ fontSize: '48px', marginBottom: '12px' }}>🎨</div><div style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>4 images apparaîtront ici</div><div style={{ fontSize: '13px', marginTop: '6px' }}>Écris un prompt et génère →</div></div>
              </div>
            )}
            {imgen.status === 'loading' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div><LoadingWave /><div style={{ fontSize: '15px', fontWeight: 600, marginTop: '20px', color: 'rgba(255,255,255,0.6)' }}>FLUX génère 4 images…</div><div style={{ fontSize: '12px', marginTop: '6px', color: 'rgba(255,255,255,0.3)' }}>~10-15 secondes</div></div>
              </div>
            )}
            {imgen.status === 'error' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                <div><div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div><div style={{ fontSize: '15px', fontWeight: 600, color: '#F87171', marginBottom: '8px' }}>Erreur génération</div><div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{imgen.error}</div><button onClick={() => setImgen({ status: 'idle', images: [], error: null })} style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Réessayer</button></div>
              </div>
            )}
            {imgen.status === 'done' && imgen.images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {imgen.images.map((url, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0a14', aspectRatio: ratio === '9:16' ? '9/16' : ratio === '1:1' ? '1/1' : '16/9' }}>
                    <img src={url} alt={`Image ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleDownloadImage(url, i)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '12px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>⬇</button>
                      <button onClick={() => window.open(url, '_blank')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '12px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>🔗</button>
                    </div>
                    <div style={{ position: 'absolute', top: '8px', left: '8px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 700 }}>#{i + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODE VIDÉO ── */}
        {isVideoTab && (
          <>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0a14', minHeight: '300px' }}>
              {gen.status === 'idle' && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎬</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Ta vidéo apparaîtra ici</div>
                  <div style={{ fontSize: '13px', marginTop: '6px' }}>Configure et lance la génération →</div>
                </div>
              )}
              {isRunning && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  <LoadingWave />
                  <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '24px', color: 'rgba(255,255,255,0.6)' }}>
                    {gen.status === 'submitting' && 'Envoi de la requête…'}
                    {gen.status === 'pending' && 'En file d\'attente Seedance…'}
                    {gen.status === 'processing' && 'Dreamina génère ta vidéo…'}
                  </div>
                </div>
              )}
              {gen.status === 'failed' && (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#F87171', marginBottom: '8px' }}>Génération échouée</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', lineHeight: 1.6 }}>{gen.error}</div>
                  <button onClick={() => setGen({ jobId: null, status: 'idle', videoUrl: null, error: null })} style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer' }}>Réessayer</button>
                </div>
              )}
              {gen.status === 'succeeded' && gen.videoUrl && (
                <video ref={videoRef} src={gen.videoUrl} controls autoPlay loop playsInline style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', boxShadow: '0 0 60px rgba(124,92,252,0.3)' }} />
              )}
            </div>
            {gen.status === 'succeeded' && gen.videoUrl && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleDownloadVideo} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)', color: '#fff', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 16px rgba(124,92,252,0.4)' }}>⬇️ Télécharger MP4</button>
                <button onClick={() => window.open(gen.videoUrl!, '_blank')} style={{ padding: '14px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer' }}>🔗 Ouvrir</button>
                <button onClick={() => setGen({ jobId: null, status: 'idle', videoUrl: null, error: null })} style={{ padding: '14px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer' }}>✕</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Helpers UI ─────────────────────────────────────────────────────────────────

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
