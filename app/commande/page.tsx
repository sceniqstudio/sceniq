'use client'

// app/commande/page.tsx
// Page checkout multi-step ScenIQ V1 agence services
// Étapes : 1. Config (format + durée) → 2. Brief + refs → 3. Coordonnées → 4. Paiement Stripe

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────

type Format = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
type Duration = 5 | 8 | 10 | 12 | 15
type CallSlot = 'matin' | 'après-midi' | 'soir'

const PRICE: Record<Duration, number> = {
  5: 69, 8: 89, 10: 109, 12: 129, 15: 159,
}

const FORMATS: { value: Format; label: string; desc: string; ratio: [number, number] }[] = [
  { value: '21:9', label: '21:9', desc: 'Cinéma / Ultra-wide',    ratio: [21, 9] },
  { value: '16:9', label: '16:9', desc: 'YouTube / TV / Web',     ratio: [16, 9] },
  { value: '4:3',  label: '4:3',  desc: 'Square+',                ratio: [4,  3] },
  { value: '1:1',  label: '1:1',  desc: 'Instagram feed',         ratio: [1,  1] },
  { value: '3:4',  label: '3:4',  desc: 'Pinterest / Portrait',   ratio: [3,  4] },
  { value: '9:16', label: '9:16', desc: 'TikTok / Reels',         ratio: [9, 16] },
]

const DURATIONS: Duration[] = [5, 8, 10, 12, 15]

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,audio/mpeg,audio/wav,audio/mp4,audio/aac,video/mp4,video/quicktime,video/webm'

// ─── Styles constants ────────────────────────────────────────────────────────

const s = {
  bg:       '#0a0a14',
  surface:  'rgba(255,255,255,.05)',
  border:   '1px solid rgba(255,255,255,.1)',
  text:     '#f5f2ec',
  muted:    'rgba(255,255,255,.5)',
  accent:   '#A5B4FC',
  accentBg: 'rgba(165,180,252,.12)',
  green:    '#4ade80',
  red:      '#f87171',
} as const

// ─── Icônes ──────────────────────────────────────────────────────────────────

function FormatIcon({ ratio, active }: { ratio: [number, number]; active: boolean }) {
  const [rw, rh] = ratio
  const maxW = 38, maxH = 26
  const scale = Math.min(maxW / rw, maxH / rh)
  const w = Math.round(rw * scale)
  const h = Math.round(rh * scale)
  const x = (maxW - w) / 2
  const y = (maxH - h) / 2
  const color = active ? '#A5B4FC' : 'rgba(255,255,255,0.45)'
  return (
    <svg width={maxW} height={maxH} viewBox={`0 0 ${maxW} ${maxH}`} style={{ display: 'block', margin: '0 auto 5px' }}>
      <rect x={x} y={y} width={w} height={h} rx={2} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}

function ClockIcon({ active }: { active: boolean }) {
  const c = active ? '#A5B4FC' : 'rgba(255,255,255,0.45)'
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 5, marginTop: -2 }}>
      <circle cx={8} cy={8} r={6.5} stroke={c} strokeWidth={1.4} fill="none" />
      <line x1={8} y1={4.5} x2={8} y2={8} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
      <line x1={8} y1={8} x2={10.5} y2={9.8} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  )
}

// ─── Sous-composants ─────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i < current ? s.accent : i === current ? s.accent : 'rgba(255,255,255,.1)',
            border: i === current ? `2px solid ${s.accent}` : '2px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            color: i <= current ? '#1E1B4B' : s.muted,
            transition: 'all .2s',
          }}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div style={{
              width: 32, height: 2,
              background: i < current ? s.accent : 'rgba(255,255,255,.1)',
              borderRadius: 2, transition: 'background .2s',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: s.muted }}>
      {children}
    </p>
  )
}

function FieldInput({
  label, value, onChange, placeholder, type = 'text', required = false
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}{required && <span style={{ color: s.accent, marginLeft: 3 }}>*</span>}</Label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '11px 14px', borderRadius: 8,
          background: s.surface, border: s.border,
          color: s.text, fontSize: 14, outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color .15s',
        }}
        onFocus={e => (e.target.style.borderColor = s.accent)}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
      />
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function CommandePage() {
  // État formulaire
  const [step, setStep]               = useState(0)
  const [format, setFormat]           = useState<Format | null>(null)
  const [duration, setDuration]       = useState<Duration | null>(null)
  const [brief, setBrief]             = useState('')
  const [files, setFiles]             = useState<File[]>([])
  const [uploading, setUploading]     = useState(false)
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])
  const [sessionId]                   = useState(() => crypto.randomUUID())
  const [clientName, setClientName]   = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [callSlot, setCallSlot]       = useState<CallSlot | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [dragOver, setDragOver]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const price = duration ? PRICE[duration] : null

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const arr = Array.from(incoming)
    setFiles(prev => {
      const merged = [...prev, ...arr].slice(0, 10)
      return merged
    })
  }, [])

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return []
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('file', f))
      const res = await fetch(`/api/orders/upload?sessionId=${sessionId}`, {
        method: 'POST', body: fd,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur upload')
      return json.paths as string[]
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!format || !duration) return
    setSubmitting(true)
    setError(null)
    try {
      // Upload refs si pas encore uploadées
      let paths = uploadedPaths
      if (files.length > 0 && uploadedPaths.length === 0) {
        paths = await uploadFiles()
        setUploadedPaths(paths)
      }

      // Créer l'order + Stripe session
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format, duration, brief,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone || undefined,
          client_company: clientCompany || undefined,
          preferred_call_slot: callSlot || undefined,
          ref_paths: paths,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur lors de la création de la commande')

      // Redirection vers Stripe Checkout
      window.location.href = json.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
      setSubmitting(false)
    }
  }

  // ─── Validation par étape ──────────────────────────────────────────────────

  const step0Valid = format !== null && duration !== null
  const step1Valid = brief.trim().length >= 10
  const step2Valid =
    clientName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{
      minHeight: '100vh', background: s.bg, color: s.text,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '48px 24px 80px', fontFamily: 'var(--f)',
    }}>
      <div style={{ maxWidth: 620, width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontSize: 13, color: s.muted, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Retour
          </Link>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: '#fff' }}>ScenIQ</span>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} total={4} />

        {/* ── Étape 0 : Configuration ─────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, letterSpacing: -0.5, color: '#fff', margin: '0 0 6px' }}>
              Configurez votre vidéo
            </h1>
            <p style={{ fontSize: 15, color: s.muted, margin: '0 0 32px', lineHeight: 1.5 }}>
              Format et durée — le prix s'affiche en temps réel.
            </p>

            {/* Format */}
            <div style={{ marginBottom: 28 }}>
              <Label>Format vidéo</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {FORMATS.map(f => (
                  <button key={f.value} onClick={() => setFormat(f.value)} style={{
                    padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
                    background: format === f.value ? s.accentBg : s.surface,
                    border: format === f.value ? `1.5px solid ${s.accent}` : s.border,
                    color: s.text, textAlign: 'center', transition: 'all .15s',
                  }}>
                    <FormatIcon ratio={f.ratio} active={format === f.value} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: format === f.value ? s.accent : '#fff' }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: s.muted, marginTop: 2 }}>{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Durée */}
            <div style={{ marginBottom: 32 }}>
              <Label>Durée</Label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)} style={{
                    flex: '1 1 0', minWidth: 72, padding: '14px 8px', borderRadius: 10, cursor: 'pointer',
                    background: duration === d ? s.accentBg : s.surface,
                    border: duration === d ? `1.5px solid ${s.accent}` : s.border,
                    color: s.text, textAlign: 'center', transition: 'all .15s',
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: duration === d ? s.accent : '#fff' }}>
                      <ClockIcon active={duration === d} />{d}s
                    </div>
                    <div style={{ fontSize: 12, color: duration === d ? s.accent : s.muted, marginTop: 4, fontWeight: 600 }}>
                      {PRICE[d]} €
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Récap sélection */}
            {(format || duration) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {format && (() => {
                  const f = FORMATS.find(x => x.value === format)!
                  return (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '7px 12px', borderRadius: 8,
                      background: s.accentBg, border: `1px solid rgba(165,180,252,.3)`,
                    }}>
                      <FormatIcon ratio={f.ratio} active={true} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>{format}</span>
                    </div>
                  )
                })()}
                {duration && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 8,
                    background: s.accentBg, border: `1px solid rgba(165,180,252,.3)`,
                  }}>
                    <ClockIcon active={true} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.accent }}>{duration}s</span>
                  </div>
                )}
              </div>
            )}

            {/* Récap prix */}
            {format && duration && (
              <div style={{
                background: s.accentBg, border: `1px solid rgba(165,180,252,.25)`,
                borderRadius: 10, padding: '16px 20px', marginBottom: 28,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 14, color: s.accent }}>Tous formats · 10 itérations · 48 h</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{price}&nbsp;€&nbsp;<span style={{ fontSize: 13, fontWeight: 400, color: s.muted }}>HT</span></span>
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              disabled={!step0Valid}
              style={{
                width: '100%', padding: '15px', borderRadius: 10,
                background: step0Valid ? s.accent : 'rgba(255,255,255,.1)',
                color: step0Valid ? '#1E1B4B' : s.muted,
                fontSize: 15, fontWeight: 700, border: 'none', cursor: step0Valid ? 'pointer' : 'not-allowed',
                transition: 'all .15s',
              }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── Étape 1 : Brief + Références ────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, letterSpacing: -0.5, color: '#fff', margin: '0 0 6px' }}>
              Votre brief en 2–5 lignes
            </h1>
            <p style={{ fontSize: 15, color: s.muted, margin: '0 0 28px', lineHeight: 1.5 }}>
              Décrivez votre projet : marque, ton, message, contexte. Je m'occupe du reste.
            </p>

            {/* Brief */}
            <div style={{ marginBottom: 24 }}>
              <Label>Brief <span style={{ color: s.accent }}>*</span></Label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="Ex : Vidéo de lancement pour notre eau pétillante haut-de-gamme. Ton urbain et posé, pas agressif. Public 25-40 ans, grandes villes. On veut montrer la bouteille dans des contextes lifestyle — terrasse, bureau moderne, après-sport."
                rows={5}
                maxLength={1000}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
                  borderRadius: 8, background: s.surface, border: s.border,
                  color: s.text, fontSize: 14, lineHeight: 1.6,
                  resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color .15s',
                }}
                onFocus={e => (e.target.style.borderColor = s.accent)}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: s.muted, textAlign: 'right' }}>
                {brief.length}/1000
              </p>
            </div>

            {/* Upload refs */}
            <div style={{ marginBottom: 28 }}>
              <Label>Références (facultatif) — 10 max, 25 MB par fichier</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                style={{
                  border: `2px dashed ${dragOver ? s.accent : 'rgba(255,255,255,.15)'}`,
                  borderRadius: 10, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? s.accentBg : 'transparent',
                  transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                <p style={{ margin: 0, fontSize: 14, color: s.muted }}>
                  Glissez vos fichiers ici ou <span style={{ color: s.accent, textDecoration: 'underline' }}>parcourir</span>
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,.3)' }}>
                  Images, audio, vidéos de référence · Logo, charte graphique, visuels
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_TYPES}
                style={{ display: 'none' }}
                onChange={e => addFiles(e.target.files)}
              />

              {files.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8,
                      background: s.surface, border: s.border,
                    }}>
                      <span style={{ fontSize: 13, color: s.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                        {f.name} <span style={{ color: s.muted }}>({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </span>
                      <button onClick={() => removeFile(i)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: s.muted, fontSize: 16, padding: '0 4px',
                      }}>×</button>
                    </div>
                  ))}
                  {files.length >= 10 && (
                    <p style={{ fontSize: 12, color: '#fbbf24', margin: '4px 0 0' }}>Maximum atteint (10 fichiers)</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(0)} style={{
                flex: '0 0 auto', padding: '14px 20px', borderRadius: 10,
                background: 'transparent', border: s.border,
                color: s.muted, fontSize: 14, cursor: 'pointer',
              }}>← Retour</button>
              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                style={{
                  flex: 1, padding: '14px', borderRadius: 10,
                  background: step1Valid ? s.accent : 'rgba(255,255,255,.1)',
                  color: step1Valid ? '#1E1B4B' : s.muted,
                  fontSize: 15, fontWeight: 700, border: 'none',
                  cursor: step1Valid ? 'pointer' : 'not-allowed',
                  transition: 'all .15s',
                }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 2 : Coordonnées ────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, letterSpacing: -0.5, color: '#fff', margin: '0 0 6px' }}>
              Vos coordonnées
            </h1>
            <p style={{ fontSize: 15, color: s.muted, margin: '0 0 28px', lineHeight: 1.5 }}>
              Je vous rappelle sous 4 h ouvrées après paiement.
            </p>

            <FieldInput label="Nom complet" value={clientName} onChange={setClientName}
              placeholder="Marie Dupont" required />
            <FieldInput label="Email" value={clientEmail} onChange={setClientEmail}
              placeholder="marie@exemple.fr" type="email" required />
            <FieldInput label="Téléphone" value={clientPhone} onChange={setClientPhone}
              placeholder="+33 6 12 34 56 78" type="tel" />
            <FieldInput label="Société" value={clientCompany} onChange={setClientCompany}
              placeholder="Agence Pixel" />

            {/* Créneau d'appel */}
            <div style={{ marginBottom: 28 }}>
              <Label>Créneau préféré pour l'appel</Label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['matin', 'après-midi', 'soir'] as CallSlot[]).map(slot => (
                  <button key={slot} onClick={() => setCallSlot(slot)} style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                    background: callSlot === slot ? s.accentBg : s.surface,
                    border: callSlot === slot ? `1.5px solid ${s.accent}` : s.border,
                    color: callSlot === slot ? s.accent : s.muted,
                    fontSize: 14, fontWeight: callSlot === slot ? 700 : 400,
                    transition: 'all .15s',
                    textTransform: 'capitalize',
                  }}>
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{
                flex: '0 0 auto', padding: '14px 20px', borderRadius: 10,
                background: 'transparent', border: s.border,
                color: s.muted, fontSize: 14, cursor: 'pointer',
              }}>← Retour</button>
              <button
                onClick={() => setStep(3)}
                disabled={!step2Valid}
                style={{
                  flex: 1, padding: '14px', borderRadius: 10,
                  background: step2Valid ? s.accent : 'rgba(255,255,255,.1)',
                  color: step2Valid ? '#1E1B4B' : s.muted,
                  fontSize: 15, fontWeight: 700, border: 'none',
                  cursor: step2Valid ? 'pointer' : 'not-allowed',
                  transition: 'all .15s',
                }}
              >
                Vérifier ma commande →
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Récap + Paiement ──────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, letterSpacing: -0.5, color: '#fff', margin: '0 0 6px' }}>
              Récap de votre commande
            </h1>
            <p style={{ fontSize: 15, color: s.muted, margin: '0 0 28px', lineHeight: 1.5 }}>
              Vérifiez avant de payer — vous serez redirigé vers Stripe.
            </p>

            {/* Récap */}
            <div style={{ background: s.surface, border: s.border, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ borderBottom: s.border, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Vidéo IA {duration}s · {format}</div>
                  <div style={{ fontSize: 13, color: s.muted, marginTop: 2 }}>Tous formats inclus · 10 itérations · Livraison sous 48 h</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.accent }}>{price}&nbsp;€&nbsp;<span style={{ fontSize: 13, fontWeight: 400, color: s.muted }}>HT</span></div>
              </div>

              <div style={{ padding: '16px 20px', borderBottom: s.border }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: s.muted, marginBottom: 8 }}>Brief</div>
                <p style={{ margin: 0, fontSize: 14, color: s.text, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{brief}</p>
              </div>

              <div style={{ padding: '16px 20px', borderBottom: files.length > 0 ? s.border : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: s.muted, marginBottom: 8 }}>Contact</div>
                <p style={{ margin: 0, fontSize: 14, color: s.text, lineHeight: 1.7 }}>
                  {clientName}
                  {clientCompany && <span style={{ color: s.muted }}> — {clientCompany}</span>}<br />
                  {clientEmail}
                  {clientPhone && <><br />{clientPhone}</>}
                  {callSlot && <><br /><span style={{ color: s.muted }}>Créneau : {callSlot}</span></>}
                </p>
              </div>

              {files.length > 0 && (
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: s.muted, marginBottom: 8 }}>
                    Références ({files.length} fichier{files.length > 1 ? 's' : ''})
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: s.muted }}>
                    {files.map(f => f.name).join(' · ')}
                  </p>
                </div>
              )}
            </div>

            {/* Rassurance */}
            <div style={{
              background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.15)',
              borderRadius: 10, padding: '14px 18px', marginBottom: 24,
              fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6,
            }}>
              🔒 Paiement sécurisé Stripe · Remboursement si la préprod ne convient pas après 10 itérations · Facture TVA sur demande
            </div>

            {/* Erreur */}
            {error && (
              <div style={{
                background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                fontSize: 14, color: s.red,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} disabled={submitting} style={{
                flex: '0 0 auto', padding: '14px 20px', borderRadius: 10,
                background: 'transparent', border: s.border,
                color: s.muted, fontSize: 14, cursor: 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}>← Retour</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1, padding: '16px', borderRadius: 10,
                  background: submitting ? 'rgba(165,180,252,.4)' : s.accent,
                  color: '#1E1B4B', fontSize: 16, fontWeight: 700, border: 'none',
                  cursor: submitting ? 'wait' : 'pointer',
                  transition: 'all .15s', letterSpacing: -0.2,
                }}
              >
                {submitting
                  ? (uploading ? 'Upload des références…' : 'Redirection Stripe…')
                  : `Payer ${price} € HT →`}
              </button>
            </div>

            <p style={{ margin: '16px 0 0', fontSize: 12, color: 'rgba(255,255,255,.35)', textAlign: 'center' }}>
              Vous serez redirigé vers Stripe. Aucune carte n'est stockée sur nos serveurs.
            </p>
          </div>
        )}

      </div>
    </main>
  )
}
