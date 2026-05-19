'use client'

// app/commande/page.tsx
// Page checkout multi-step ScenIQ V1 agence services
// Étapes : 1. Config (format + durée) → 2. Brief + refs → 3. Coordonnées → 4. Paiement Stripe

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────

type Format = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16'
type Duration = 5 | 8 | 10 | 12 | 15
type CallDay  = 'Lun' | 'Mar' | 'Mer' | 'Jeu' | 'Ven' | 'Sam'
type CallTime = 'Matin' | 'Après-midi' | 'Soir'

const CALL_DAYS: CallDay[]  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const CALL_TIMES: { value: CallTime; range: string }[] = [
  { value: 'Matin',      range: '9h – 12h'  },
  { value: 'Après-midi', range: '13h – 18h' },
  { value: 'Soir',       range: '18h – 20h' },
]

const PRICE: Record<Duration, number> = {
  5: 69, 8: 89, 10: 109, 12: 129, 15: 159,
}
const AI_MODEL_ADDON = 49

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
  const [wantAiModel, setWantAiModel] = useState(false)
  const [aiModelDesc, setAiModelDesc] = useState('')
  const [brief, setBrief]             = useState('')
  const [files, setFiles]             = useState<File[]>([])
  const [uploading, setUploading]     = useState(false)
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])
  const [sessionId]                   = useState(() => crypto.randomUUID())
  const [clientName, setClientName]   = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [callDay,  setCallDay]        = useState<CallDay | null>(null)
  const [callTime, setCallTime]       = useState<CallTime | null>(null)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [dragOver, setDragOver]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Pré-remplissage depuis URL params (?duree=10&modele=1) ────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const duree  = params.get('duree')
    if (duree) {
      const n = parseInt(duree) as Duration
      if (([5, 8, 10, 12, 15] as number[]).includes(n)) setDuration(n)
    }
    if (params.get('modele') === '1') setWantAiModel(true)
  }, [])

  const basePrice  = duration ? PRICE[duration] : null
  const totalPrice = basePrice !== null ? basePrice + (wantAiModel ? AI_MODEL_ADDON : 0) : null
  const price      = totalPrice

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
    // Vérification taille totale avant envoi (limite Vercel 4,5 MB)
    const totalMb = files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024
    if (totalMb > 4) {
      throw new Error(`Fichiers trop volumineux (${totalMb.toFixed(1)} MB total). Envoyez-les directement par email à support@sceniq.studio après paiement.`)
    }
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('file', f))
      const res = await fetch(`/api/orders/upload?sessionId=${sessionId}`, {
        method: 'POST', body: fd,
      })
      let json: { paths?: string[]; error?: string }
      try {
        json = await res.json()
      } catch {
        throw new Error('Fichiers trop volumineux pour l\'upload. Envoyez vos références à support@sceniq.studio après paiement.')
      }
      if (!res.ok) throw new Error(json.error ?? 'Erreur upload')
      return json.paths ?? []
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
          want_ai_model: wantAiModel,
          ai_model_desc: wantAiModel ? aiModelDesc : undefined,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone || undefined,
          client_company: clientCompany || undefined,
          preferred_call_slot: (callDay && callTime) ? `${callDay} · ${callTime} (${CALL_TIMES.find(t => t.value === callTime)!.range})` : undefined,
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
          <img src="/logo-sceniq.svg" alt="ScenIQ" style={{ height: 40, display: 'block' }} />
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

            {/* Durée — en premier pour cohérence avec le flow depuis la page tarifs */}
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

            {/* Option Modèle IA */}
            <div style={{ marginBottom: 28 }}>
              <Label>Option · Modèle IA sur mesure</Label>
              <button
                type="button"
                onClick={() => setWantAiModel(v => !v)}
                style={{
                  width: '100%', padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                  background: wantAiModel ? 'rgba(165,180,252,0.1)' : s.surface,
                  border: wantAiModel ? `1.5px solid ${s.accent}` : s.border,
                  color: s.text, textAlign: 'left', transition: 'all .15s',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}
              >
                {/* Toggle visuel */}
                <div style={{
                  width: 44, height: 24, borderRadius: 999, flexShrink: 0, marginTop: 2,
                  background: wantAiModel ? s.accent : 'rgba(255,255,255,.15)',
                  position: 'relative', transition: 'background .15s',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', transition: 'left .15s',
                    left: wantAiModel ? 23 : 3,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: wantAiModel ? s.accent : '#fff' }}>
                      Inclure un modèle IA sur mesure
                    </span>
                    <span style={{
                      padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      background: wantAiModel ? 'rgba(165,180,252,0.15)' : 'rgba(255,255,255,0.07)',
                      color: wantAiModel ? s.accent : s.muted,
                    }}>
                      +{AI_MODEL_ADDON} €
                    </span>
                  </div>
                  <p style={{ margin: '5px 0 0', fontSize: 12, color: s.muted, lineHeight: 1.55 }}>
                    Personnage IA fictif selon votre description — pas de cachet, pas de contrat,
                    pas de droits à gérer. Mention légale «&nbsp;Image générée par IA&nbsp;» fournie.
                  </p>
                </div>
              </button>

              {/* Champ description si activé */}
              {wantAiModel && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: s.muted, display: 'block', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Description du modèle
                  </label>
                  <textarea
                    value={aiModelDesc}
                    onChange={e => setAiModelDesc(e.target.value)}
                    placeholder="Ex : Femme 28–35 ans, style urbain et décontracté, peau claire, cheveux mi-longs châtains, regard direct, ambiance moderne et accessible."
                    rows={3}
                    maxLength={400}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                      borderRadius: 8, background: s.surface, border: s.border,
                      color: s.text, fontSize: 13, lineHeight: 1.55,
                      resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color .15s',
                    }}
                    onFocus={e => (e.target.style.borderColor = s.accent)}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,.1)')}
                  />
                  {/* Notice légale inline */}
                  <div style={{
                    marginTop: 10, padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(165,180,252,0.06)',
                    border: '1px solid rgba(165,180,252,0.15)',
                    fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
                  }}>
                    ⚖️ Le personnage généré est <strong style={{ color: 'rgba(255,255,255,0.55)' }}>entièrement fictif</strong> —
                    aucune ressemblance avec une personne réelle n&apos;est reproduite. Conformément au{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.55)' }}>EU AI Act (art. 50)</strong> et à la{' '}
                    <strong style={{ color: 'rgba(255,255,255,0.55)' }}>loi du 9 juin 2023</strong> sur les influenceurs,
                    la mention «&nbsp;Image générée par IA&nbsp;» est obligatoire sur vos publications.
                    ScenIQ vous la fournit dans la livraison. Vous restez responsable de l&apos;afficher.
                  </div>
                </div>
              )}
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
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, color: s.accent, lineHeight: 1.5 }}>
                    Tous formats inclus · 10 allers-retours inclus<br />
                    <span style={{ color: 'rgba(165,180,252,.7)' }}>Livraison MP4 sous 48 h après validation</span>
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', marginLeft: 12 }}>
                    {price}&nbsp;€&nbsp;<span style={{ fontSize: 13, fontWeight: 400, color: s.muted }}>HT</span>
                  </span>
                </div>
                {wantAiModel && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(165,180,252,.15)', fontSize: 12, color: 'rgba(165,180,252,.8)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Forfait vidéo {duration}s …… {basePrice} €</span>
                    <span style={{ color: s.accent }}>+ Modèle IA …… +{AI_MODEL_ADDON} €</span>
                  </div>
                )}
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
              <Label>Références (facultatif) — 10 max, 4 MB total · ou par email après paiement</Label>
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

              {/* Jour */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {CALL_DAYS.map(day => (
                  <button key={day} onClick={() => setCallDay(day)} style={{
                    flex: '1 1 0', minWidth: 44, padding: '10px 6px', borderRadius: 8, cursor: 'pointer',
                    background: callDay === day ? s.accentBg : s.surface,
                    border: callDay === day ? `1.5px solid ${s.accent}` : s.border,
                    color: callDay === day ? s.accent : s.muted,
                    fontSize: 13, fontWeight: callDay === day ? 700 : 400,
                    transition: 'all .15s',
                  }}>
                    {day}
                  </button>
                ))}
              </div>

              {/* Tranche horaire */}
              <div style={{ display: 'flex', gap: 8 }}>
                {CALL_TIMES.map(({ value, range }) => (
                  <button key={value} onClick={() => setCallTime(value)} style={{
                    flex: 1, padding: '11px 8px', borderRadius: 8, cursor: 'pointer',
                    background: callTime === value ? s.accentBg : s.surface,
                    border: callTime === value ? `1.5px solid ${s.accent}` : s.border,
                    color: callTime === value ? s.accent : s.muted,
                    fontSize: 13, fontWeight: callTime === value ? 700 : 400,
                    transition: 'all .15s', textAlign: 'center',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{value}</div>
                    <div style={{ fontSize: 11, opacity: 0.75 }}>{range}</div>
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
              <div style={{ borderBottom: s.border, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Vidéo IA {duration}s · {format}</div>
                    <div style={{ fontSize: 13, color: s.muted, marginTop: 2 }}>Tous formats inclus · 10 allers-retours · MP4 livré sous 48 h après validation</div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.accent, whiteSpace: 'nowrap', marginLeft: 12 }}>{price}&nbsp;€&nbsp;<span style={{ fontSize: 13, fontWeight: 400, color: s.muted }}>HT</span></div>
                </div>
                {wantAiModel && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 12, color: 'rgba(255,255,255,.5)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>dont option Modèle IA sur mesure (personnage fictif, mention légale fournie)</span>
                    <span style={{ color: s.accent, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>+{AI_MODEL_ADDON} €</span>
                  </div>
                )}
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
                  {(callDay || callTime) && <><br /><span style={{ color: s.muted }}>Créneau : {[callDay, callTime].filter(Boolean).join(' · ')}</span></>}
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
              🔒 Paiement sécurisé Stripe — vous recevez un email de confirmation immédiatement après le paiement. Je reviens sous 4 h ouvrées avec la préprod (concept + storyboard + ambiance). 10 allers-retours inclus pour affiner. Remboursement intégral si la direction créative ne convient pas. Facture TVA disponible sur demande.
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
