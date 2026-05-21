'use client'
// app/(app)/dashboard/studio/page.tsx
// Studio de génération vidéo — Text→Video + Image→Video
// UX iso Dreamina : panneau gauche (settings) + zone droite (player / état)

import { useState, useRef, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab       = 'text' | 'image'
type JobStatus = 'idle' | 'submitting' | 'pending' | 'processing' | 'succeeded' | 'failed'

interface GenerationState {
  jobId:    string | null
  status:   JobStatus
  videoUrl: string | null
  error:    string | null
}

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

// ── Constants ─────────────────────────────────────────────────────────────────

const DURATIONS   = ['4', '5', '8', '10', '12', '15']
const RESOLUTIONS = [{ v: '480p', l: '480p' }, { v: '720p', l: '720p HD' }, { v: '1080p', l: '1080p Full HD' }]
const RATIOS      = [{ v: '16:9', l: '16:9 — Paysage' }, { v: '9:16', l: '9:16 — Portrait' }, { v: '1:1', l: '1:1 — Carré' }]

// ── Utils ─────────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [tab,        setTab]        = useState<Tab>('text')
  const [prompt,     setPrompt]     = useState('')
  const [duration,   setDuration]   = useState('8')
  const [resolution, setResolution] = useState('1080p')
  const [ratio,      setRatio]      = useState('16:9')
  const [imageFile,  setImageFile]  = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [gen,        setGen]        = useState<GenerationState>({
    jobId: null, status: 'idle', videoUrl: null, error: null,
  })

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const pollRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRef      = useRef<HTMLVideoElement>(null)

  // ── Polling ─────────────────────────────────────────────────────────────────

  const pollStatus = useCallback(async (jobId: string, attempt = 0) => {
    try {
      const res = await fetch(`/api/studio/status/${jobId}`, {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      })
      const data = await res.json()

      if (data.status === 'succeeded' && data.videoUrl) {
        setGen({ jobId, status: 'succeeded', videoUrl: data.videoUrl, error: null })
        return
      }

      if (data.status === 'failed' || data.status === 'expired' || data.status === 'cancelled') {
        setGen(prev => ({ ...prev, status: 'failed', error: data.error ?? `Tâche ${data.status}` }))
        return
      }

      // Continue polling — backoff : 5s → 8s → 12s (max)
      const delay = attempt < 3 ? 5000 : attempt < 8 ? 8000 : 12000
      setGen(prev => ({ ...prev, status: data.status === 'processing' ? 'processing' : 'pending' }))
      pollRef.current = setTimeout(() => pollStatus(jobId, attempt + 1), delay)
    } catch {
      // Réseau transitoire → retry dans 6s
      pollRef.current = setTimeout(() => pollStatus(jobId, attempt + 1), 6000)
    }
  }, [])

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    if (tab === 'image' && !imageFile) return

    // Annuler polling précédent
    if (pollRef.current) clearTimeout(pollRef.current)

    setGen({ jobId: null, status: 'submitting', videoUrl: null, error: null })

    try {
      const form = new FormData()
      form.append('prompt',     prompt.trim())
      form.append('duration',   duration)
      form.append('resolution', resolution)
      form.append('ratio',      ratio)
      if (tab === 'image' && imageFile) form.append('image', imageFile)

      const res = await fetch('/api/studio/submit', {
        method:  'POST',
        headers: { 'x-admin-secret': ADMIN_SECRET },
        body:    form,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setGen({ jobId: null, status: 'failed', videoUrl: null, error: data.error ?? 'Erreur serveur' })
        return
      }

      const jobId = data.jobId as string
      setGen({ jobId, status: 'pending', videoUrl: null, error: null })
      pollStatus(jobId)
    } catch (e) {
      setGen({ jobId: null, status: 'failed', videoUrl: null, error: (e as Error).message })
    }
  }

  // ── Image upload ─────────────────────────────────────────────────────────────

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = e => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleImageChange(file)
  }

  // ── Download ─────────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (!gen.videoUrl) return
    try {
      const res  = await fetch(gen.videoUrl)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `sceniq-${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(gen.videoUrl, '_blank')
    }
  }

  // ── Status helpers ───────────────────────────────────────────────────────────

  const isRunning = gen.status === 'submitting' || gen.status === 'pending' || gen.status === 'processing'
  const canGenerate = !isRunning && !!prompt.trim() && (tab === 'text' || !!imageFile)

  const statusLabel: Record<JobStatus, string> = {
    idle:       '',
    submitting: 'Envoi de la requête…',
    pending:    'Tâche en file d\'attente…',
    processing: 'Génération en cours (peut prendre 2-4 min)…',
    succeeded:  'Vidéo prête !',
    failed:     'Erreur',
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 72px)', padding: '24px', boxSizing: 'border-box', overflow: 'hidden' }}>

      {/* ── LEFT PANEL — Settings ── */}
      <div style={{
        width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '24px',
        border: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
      }}>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', gap: '4px' }}>
          {(['text', 'image'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: '7px', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: '14px', transition: 'all 0.15s',
              background: tab === t ? '#7C5CFC' : 'transparent',
              color:      tab === t ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>
              {t === 'text' ? '✏️ Texte → Vidéo' : '🖼️ Image → Vidéo'}
            </button>
          ))}
        </div>

        {/* Image upload zone (Image→Video only) */}
        {tab === 'image' && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${imagePreview ? 'rgba(124,92,252,0.5)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '12px', cursor: 'pointer', overflow: 'hidden',
              minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s', position: 'relative',
            }}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Référence" style={{ width: '100%', height: '100%', objectFit: 'cover', maxHeight: '200px' }} />
                <button
                  onClick={e => { e.stopPropagation(); handleImageChange(null) }}
                  style={{
                    position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)',
                    border: 'none', borderRadius: '6px', color: '#fff', padding: '4px 8px',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >✕</button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Glisse ton image ici</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>ou clique pour parcourir</div>
                <div style={{ fontSize: '11px', marginTop: '8px', color: 'rgba(255,255,255,0.25)' }}>JPG, PNG, WebP — max 10 Mo</div>
              </div>
            )}
            <input
              ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleImageChange(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {/* Prompt */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={tab === 'text'
              ? 'Décris la vidéo… ex : "Un barista verse un café latte art en slow motion, lumière dorée, comptoir en marbre blanc"'
              : 'Décris le mouvement… ex : "La caméra zoome doucement sur le produit, fond qui se floute en bokeh"'
            }
            rows={5}
            style={{
              width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              padding: '12px 14px', color: '#fff', fontSize: '14px', lineHeight: 1.6,
              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(124,92,252,0.6)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px', textAlign: 'right' }}>
            {prompt.length} / 2000
          </div>
        </div>

        {/* Duration */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Durée
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                padding: '8px 14px', borderRadius: '8px', border: '1px solid',
                borderColor: duration === d ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                background: duration === d ? 'rgba(124,92,252,0.2)' : 'transparent',
                color: duration === d ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Résolution
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RESOLUTIONS.map(r => (
              <button key={r.v} onClick={() => setResolution(r.v)} style={{
                padding: '10px 14px', borderRadius: '8px', border: '1px solid', textAlign: 'left',
                borderColor: resolution === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                background: resolution === r.v ? 'rgba(124,92,252,0.15)' : 'transparent',
                color: resolution === r.v ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                fontSize: '13px', fontWeight: resolution === r.v ? 600 : 400, cursor: 'pointer',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%', border: '2px solid',
                  borderColor: resolution === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.2)',
                  background: resolution === r.v ? '#7C5CFC' : 'transparent',
                  flexShrink: 0, transition: 'all 0.15s',
                }}/>
                {r.l}
              </button>
            ))}
          </div>
        </div>

        {/* Ratio */}
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Format
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RATIOS.map(r => (
              <button key={r.v} onClick={() => setRatio(r.v)} style={{
                padding: '10px 14px', borderRadius: '8px', border: '1px solid', textAlign: 'left',
                borderColor: ratio === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.1)',
                background: ratio === r.v ? 'rgba(124,92,252,0.15)' : 'transparent',
                color: ratio === r.v ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                fontSize: '13px', fontWeight: ratio === r.v ? 600 : 400, cursor: 'pointer',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%', border: '2px solid',
                  borderColor: ratio === r.v ? '#7C5CFC' : 'rgba(255,255,255,0.2)',
                  background: ratio === r.v ? '#7C5CFC' : 'transparent',
                  flexShrink: 0, transition: 'all 0.15s',
                }}/>
                {r.l}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            marginTop: '4px', padding: '16px', borderRadius: '12px', border: 'none', cursor: canGenerate ? 'pointer' : 'not-allowed',
            background: canGenerate ? 'linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)' : 'rgba(255,255,255,0.08)',
            color: canGenerate ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: '15px', fontWeight: 700, letterSpacing: '-0.2px',
            transition: 'all 0.2s', boxShadow: canGenerate ? '0 4px 20px rgba(124,92,252,0.4)' : 'none',
          }}
          onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {isRunning ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <SpinnerIcon />
              Génération en cours…
            </span>
          ) : '🎬 Générer la vidéo'}
        </button>

        {/* Info cost */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: 0 }}>
          Seedance 2.0 Pro · BytePlus · ~$0.075/s · {duration}s ≈ ${(Number(duration) * 0.075).toFixed(2)}
        </p>

      </div>

      {/* ── RIGHT PANEL — Player ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: '16px',
        background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '24px',
        border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
              Aperçu vidéo
            </h2>
            {gen.jobId && (
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                Job #{gen.jobId.slice(0, 16)}…
              </p>
            )}
          </div>

          {gen.status !== 'idle' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
              borderRadius: '20px', background: statusBg(gen.status), border: `1px solid ${statusBorder(gen.status)}`,
            }}>
              {isRunning && <SpinnerIcon size={12} />}
              {gen.status === 'succeeded' && <span style={{ color: '#4ADE80', fontSize: '12px' }}>✓</span>}
              {gen.status === 'failed' && <span style={{ color: '#F87171', fontSize: '12px' }}>✕</span>}
              <span style={{ fontSize: '12px', fontWeight: 600, color: statusColor(gen.status) }}>
                {statusLabel[gen.status]}
              </span>
            </div>
          )}
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0a14', minHeight: '300px' }}>

          {/* Idle state */}
          {gen.status === 'idle' && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎬</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Ta vidéo apparaîtra ici</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Configure et lance la génération →</div>
            </div>
          )}

          {/* Loading/Processing state */}
          {isRunning && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              <LoadingWave />
              <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '24px', color: 'rgba(255,255,255,0.6)' }}>
                {gen.status === 'submitting' && 'Envoi de la requête…'}
                {gen.status === 'pending' && 'En file d\'attente Seedance…'}
                {gen.status === 'processing' && 'Dreamina génère ta vidéo…'}
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: 'rgba(255,255,255,0.25)' }}>
                {gen.status === 'processing' && `Durée estimée : ${Math.ceil(Number(duration) * 1.5)}-${Number(duration) * 3} secondes`}
              </div>
              {gen.status === 'processing' && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <Dot delay={0} /><Dot delay={0.2} /><Dot delay={0.4} />
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {gen.status === 'failed' && (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#F87171', marginBottom: '8px' }}>Génération échouée</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', lineHeight: 1.6 }}>
                {gen.error ?? 'Une erreur est survenue. Vérifie les logs Vercel.'}
              </div>
              <button
                onClick={() => setGen({ jobId: null, status: 'idle', videoUrl: null, error: null })}
                style={{
                  marginTop: '16px', padding: '8px 20px', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                  color: 'rgba(255,255,255,0.6)', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Success — Video player */}
          {gen.status === 'succeeded' && gen.videoUrl && (
            <video
              ref={videoRef}
              src={gen.videoUrl}
              controls
              autoPlay
              loop
              playsInline
              style={{
                maxWidth: '100%', maxHeight: '100%', borderRadius: '8px',
                boxShadow: '0 0 60px rgba(124,92,252,0.3)',
              }}
            />
          )}
        </div>

        {/* Actions bar */}
        {gen.status === 'succeeded' && gen.videoUrl && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleDownload}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #7C5CFC 0%, #5B3FD4 100%)',
                color: '#fff', fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px',
                boxShadow: '0 4px 16px rgba(124,92,252,0.4)',
              }}
            >
              ⬇️ Télécharger le MP4
            </button>
            <button
              onClick={() => window.open(gen.videoUrl!, '_blank')}
              style={{
                padding: '14px 20px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer',
              }}
            >
              🔗 Ouvrir
            </button>
            <button
              onClick={() => setGen({ jobId: null, status: 'idle', videoUrl: null, error: null })}
              style={{
                padding: '14px 20px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer',
              }}
            >
              ✕ Nouvelle
            </button>
          </div>
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
      <style>{`
        @keyframes wave { 0%,100% { height: 8px } 50% { height: 40px } }
      `}</style>
      {[0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1, 0].map((d, i) => (
        <div key={i} style={{
          width: '5px', height: '8px', background: '#7C5CFC', borderRadius: '3px',
          animation: `wave 1.2s ease-in-out ${d}s infinite`,
        }} />
      ))}
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <div style={{
      width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(124,92,252,0.6)',
      animation: `dotPulse 1.4s ease-in-out ${delay}s infinite`,
    }}>
      <style>{`@keyframes dotPulse { 0%,100% { opacity:0.3; transform:scale(0.8) } 50% { opacity:1; transform:scale(1.2) } }`}</style>
    </div>
  )
}
