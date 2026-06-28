'use client'

// app/commande/page.tsx — V2 multi-vidéos · i18n FR/EN
// Étapes : 1. Panier (formats + durées + langues) → 2. Brief + refs → 3. Coordonnées → 4. Récap + Paiement

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { translations, type Lang } from '@/lib/i18n'

// ─── Types ─────────────────────────────────────────────────────────────────

type Format   = '16:9' | '1:1' | '9:16' | '4:3' | '3:4' | '21:9'
type Duration = 5 | 8 | 10 | 12 | 15 | 30 | 60

type CartItem = {
  id: string
  duration: Duration | null
  formats: Format[]
  qty: number
  wantAiModel: boolean
  aiModelDesc: string
}

const PRICE: Record<Duration, number> = { 5: 69, 8: 89, 10: 109, 12: 129, 15: 159, 30: 249, 60: 449 }
const AI_MODEL_PRICE: Record<Duration, number> = { 5: 49, 8: 49, 10: 49, 12: 49, 15: 49, 30: 99, 60: 149 }
const getModelAddon = (dur: Duration | null) => dur ? AI_MODEL_PRICE[dur] : 49
const DURATIONS: Duration[] = [10, 15, 30, 60]
// Un seul format au choix parmi 6 — pas de multi-sélection en V1
const DEFAULT_FORMAT: Format = '9:16'

const FORMATS: { value: Format; label: string; desc: string; ratio: [number, number] }[] = [
  { value: '9:16',  label: '9:16',  desc: 'TikTok · Reels',      ratio: [9,  16] },
  { value: '1:1',   label: '1:1',   desc: 'Instagram feed',       ratio: [1,  1]  },
  { value: '16:9',  label: '16:9',  desc: 'YouTube · Web',        ratio: [16, 9]  },
  { value: '4:3',   label: '4:3',   desc: 'Square+',              ratio: [4,  3]  },
  { value: '3:4',   label: '3:4',   desc: 'Pinterest · Portrait', ratio: [3,  4]  },
  { value: '21:9',  label: '21:9',  desc: 'Cinema · Ultra-wide',  ratio: [21, 9]  },
]

// Language codes — label driven by tc.langLabels[code]
const LANG_CODES = ['fr', 'en', 'ja', 'es', 'pt', 'id', 'zh']
const LANG_FLAGS: Record<string, string> = {
  fr: '🇫🇷', en: '🇺🇸', ja: '🇯🇵', es: '🇪🇸', pt: '🇧🇷', id: '🇮🇩', zh: '🇨🇳',
}

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/heic,audio/mpeg,audio/wav,audio/mp4,video/mp4,video/quicktime,video/webm'

// ─── Styles ────────────────────────────────────────────────────────────────

const s = {
  bg:       '#0a0a14',
  surface:  'rgba(255,255,255,.05)',
  surface2: 'rgba(255,255,255,.08)',
  border:   '1px solid rgba(255,255,255,.10)',
  borderAcc:'1px solid rgba(165,180,252,.45)',
  text:     '#f5f2ec',
  muted:    'rgba(255,255,255,.45)',
  accent:   '#A5B4FC',
  accentBg: 'rgba(165,180,252,.10)',
  green:    '#4ade80',
  red:      '#f87171',
  danger:   'rgba(248,113,113,.12)',
} as const

// ─── Sub-components ────────────────────────────────────────────────────────

function FormatIcon({ ratio, active }: { ratio: [number,number]; active: boolean }) {
  const [rw, rh] = ratio
  const maxW = 32, maxH = 22
  const scale = Math.min(maxW / rw, maxH / rh)
  const w = Math.round(rw * scale), h = Math.round(rh * scale)
  const x = (maxW - w) / 2, y = (maxH - h) / 2
  const color = active ? '#A5B4FC' : 'rgba(255,255,255,0.4)'
  return (
    <svg width={maxW} height={maxH} viewBox={`0 0 ${maxW} ${maxH}`} style={{ display: 'block', margin: '0 auto 4px' }}>
      <rect x={x} y={y} width={w} height={h} rx={2} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}

function ClockIcon({ active }: { active: boolean }) {
  const c = active ? '#A5B4FC' : 'rgba(255,255,255,0.4)'
  return (
    <svg width={13} height={13} viewBox="0 0 16 16" style={{ display:'inline-block', verticalAlign:'middle', marginRight:4, marginTop:-2 }}>
      <circle cx={8} cy={8} r={6.5} stroke={c} strokeWidth={1.4} fill="none"/>
      <line x1={8} y1={4.5} x2={8} y2={8} stroke={c} strokeWidth={1.4} strokeLinecap="round"/>
      <line x1={8} y1={8} x2={10.5} y2={9.8} stroke={c} strokeWidth={1.4} strokeLinecap="round"/>
    </svg>
  )
}

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:36, overflowX:'auto' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background: i <= current ? s.accent : 'rgba(255,255,255,.1)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700,
              color: i <= current ? '#1E1B4B' : s.muted,
              transition:'all .2s',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{ fontSize:10, color: i === current ? s.accent : s.muted, whiteSpace:'nowrap', fontWeight: i === current ? 700 : 400 }}>
              {labels[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div style={{ width:24, height:2, background: i < current ? s.accent : 'rgba(255,255,255,.1)', borderRadius:2, marginBottom:14, transition:'background .2s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin:'0 0 10px', fontSize:12, fontWeight:700, letterSpacing:1.1, textTransform:'uppercase', color:s.muted }}>
      {children}
    </p>
  )
}

function FieldInput({ label, value, onChange, placeholder, type='text', required=false }: {
  label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; required?:boolean
}) {
  return (
    <div style={{ marginBottom:16 }}>
      <Label>{label}{required && <span style={{ color:s.accent, marginLeft:3 }}>*</span>}</Label>
      <input
        type={type} value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} required={required}
        style={{
          width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:8,
          background:s.surface, border:s.border, color:s.text, fontSize:14,
          outline:'none', fontFamily:'inherit', transition:'border-color .15s',
        }}
        onFocus={e=>(e.target.style.borderColor=s.accent)}
        onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.1)')}
      />
    </div>
  )
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function CommandePage() {

  const newItem = (): CartItem => ({
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36),
    duration: null, formats: [], qty: 1, wantAiModel: false, aiModelDesc: '',
  })

  // UI language — read from landing page preference
  const [uiLang, setUiLang] = useState<Lang>('fr')
  useEffect(() => {
    const saved = localStorage.getItem('sceniq-lang') as Lang | null
    if (saved === 'en' || saved === 'fr') setUiLang(saved)
  }, [])
  const tc = translations[uiLang].checkout

  const [step,        setStep]        = useState(0)
  const [voiceLang,   setVoiceLang]   = useState<string>('fr')   // language code for video voice
  const [cartItems,   setCartItems]   = useState<CartItem[]>([newItem()])
  const [brief,       setBrief]       = useState('')
  const [files,       setFiles]       = useState<File[]>([])
  const [uploading,   setUploading]   = useState(false)
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])
  const [sessionId]                   = useState(() => typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36))
  const [clientName,  setClientName]  = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [callDayIdx,  setCallDayIdx]  = useState<number | null>(null)
  const [callTimeIdx, setCallTimeIdx] = useState<number | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [dragOver,    setDragOver]    = useState(false)
  const [acceptCgv,   setAcceptCgv]   = useState(false)
  const [acceptRgpd,  setAcceptRgpd]  = useState(false)
  const [acceptRights,setAcceptRights]= useState(false)
  const [legalModal,  setLegalModal]  = useState<null | 'cgv' | 'confidentialite'>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pré-remplissage URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const duree = params.get('duree')
    if (duree) {
      const n = parseInt(duree) as Duration
      if ((DURATIONS as number[]).includes(n)) {
        setCartItems([{ ...newItem(), duration: n, formats: [DEFAULT_FORMAT] }])
      }
    }
    if (params.get('modele') === '1') {
      setCartItems(prev => prev.map((item, i) => i === 0 ? { ...item, wantAiModel: true } : item))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Calculs panier ────────────────────────────────────────────────────────

  const totalVideos = cartItems.reduce((s, i) => s + i.qty, 0)
  const totalPrice  = cartItems.reduce((sum, item) => {
    if (!item.duration) return sum
    return sum + (PRICE[item.duration] + (item.wantAiModel ? getModelAddon(item.duration) : 0)) * item.qty
  }, 0)

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const voiceLabel = tc.langLabels[voiceLang] ?? voiceLang
  const callDayLabel  = callDayIdx  !== null ? tc.callDays[callDayIdx]           : null
  const callTimeLabel = callTimeIdx !== null ? tc.callTimes[callTimeIdx].label    : null
  const callTimeRange = callTimeIdx !== null ? tc.callTimes[callTimeIdx].range    : null
  const callSlotStr   = (callDayLabel && callTimeLabel)
    ? `${callDayLabel} · ${callTimeLabel} (${callTimeRange})`
    : undefined

  // ─── Handlers panier ───────────────────────────────────────────────────────

  const updateItem = (id: string, patch: Partial<CartItem>) =>
    setCartItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it))

  const removeItem = (id: string) =>
    setCartItems(prev => prev.filter(it => it.id !== id))

  const addItem = () => setCartItems(prev => [...prev, newItem()])

  // ─── Handlers fichiers ─────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    setFiles(prev => [...prev, ...Array.from(incoming)].slice(0, 10))
  }, [])

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files)
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return []
    const totalMb = files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024
    if (totalMb > 4) {
      const msg = uiLang === 'en'
        ? `Files too large (${totalMb.toFixed(1)} MB). Send them by email after payment.`
        : `Fichiers trop volumineux (${totalMb.toFixed(1)} MB). Envoyez-les par email après paiement.`
      throw new Error(msg)
    }
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('file', f))
      const res = await fetch(`/api/orders/upload?sessionId=${sessionId}`, { method:'POST', body:fd })
      let json: { paths?: string[]; error?: string }
      try { json = await res.json() } catch {
        const msg = uiLang === 'en'
          ? 'Files too large. Send them by email after payment.'
          : 'Fichiers trop volumineux. Envoyez-les par email après paiement.'
        throw new Error(msg)
      }
      if (!res.ok) throw new Error(json.error ?? (uiLang === 'en' ? 'Upload error' : 'Erreur upload'))
      return json.paths ?? []
    } finally { setUploading(false) }
  }

  const handleSubmit = async () => {
    setSubmitting(true); setError(null)
    try {
      let paths = uploadedPaths
      if (files.length > 0 && uploadedPaths.length === 0) {
        paths = await uploadFiles(); setUploadedPaths(paths)
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: voiceLabel,
          cart_items: cartItems.map(it => ({
            duration:       it.duration,
            formats:        it.formats,
            qty:            it.qty,
            want_ai_model:  it.wantAiModel,
            ai_model_desc:  it.wantAiModel ? it.aiModelDesc : undefined,
          })),
          total_price: totalPrice,
          brief,
          client_name:    clientName,
          client_email:   clientEmail,
          client_phone:   clientPhone || undefined,
          client_company: clientCompany || undefined,
          preferred_call_slot: callSlotStr,
          ref_paths: paths,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? (uiLang === 'en' ? 'Error creating order' : 'Erreur lors de la création de la commande'))
      window.location.href = json.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : (uiLang === 'en' ? 'Unexpected error' : 'Erreur inattendue'))
      setSubmitting(false)
    }
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  const step0Valid = cartItems.length > 0 && cartItems.every(it => it.duration !== null && it.formats.length > 0)
  const step1Valid = brief.trim().length >= 10
  const step2Valid = clientName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)

  // ─── Render ────────────────────────────────────────────────────────────────

  // Ferme la modale sur Escape
  useEffect(() => {
    if (!legalModal) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLegalModal(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [legalModal])

  return (
    <>
    {/* ── Modale légale ─────────────────────────────────────────────────── */}
    {legalModal && (
      <div
        onClick={() => setLegalModal(null)}
        style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'rgba(0,0,0,.75)', backdropFilter:'blur(4px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'24px',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width:'100%', maxWidth:760, height:'80vh',
            background:'#13121f', borderRadius:16,
            border:'1px solid rgba(124,92,252,.2)',
            boxShadow:'0 24px 80px rgba(0,0,0,.6)',
            display:'flex', flexDirection:'column', overflow:'hidden',
          }}
        >
          {/* Header modale */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,.08)', flexShrink:0,
          }}>
            <span style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,.5)', letterSpacing:.5 }}>
              {legalModal === 'cgv' ? 'Conditions Générales de Vente' : 'Politique de confidentialité'}
            </span>
            <button
              onClick={() => setLegalModal(null)}
              style={{
                background:'rgba(255,255,255,.08)', border:'none', borderRadius:6,
                color:'rgba(255,255,255,.6)', fontSize:16, cursor:'pointer',
                width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background .15s',
              }}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.15)')}
              onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,.08)')}
            >✕</button>
          </div>
          {/* iframe */}
          <iframe
            src={legalModal === 'cgv' ? '/cgv' : '/confidentialite'}
            style={{ flex:1, border:'none', width:'100%' }}
            title={legalModal === 'cgv' ? 'CGV' : 'Politique de confidentialité'}
          />
        </div>
      </div>
    )}

    <main style={{
      minHeight:'100vh', background:s.bg, color:s.text,
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      padding:'48px 24px 80px', fontFamily:'var(--f)',
    }}>
      <div style={{ maxWidth:640, width:'100%' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40 }}>
          <Link href="/" style={{ fontSize:13, color:s.muted, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
            {tc.back}
          </Link>
          <img src="/sceniq-logo-dark.svg" alt="ScenIQ" style={{ height:40, display:'block' }} />
        </div>

        <StepIndicator current={step} total={4} labels={tc.stepLabels} />

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 0 — Panier vidéos
        ══════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              {tc.s0.h1}
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 32px', lineHeight:1.5 }}>
              {tc.s0.sub}
            </p>

            {/* Langue de la voix */}
            <div style={{ marginBottom:32 }}>
              <Label>{tc.s0.langLabel} <span style={{ color:s.accent }}>*</span></Label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {LANG_CODES.map(code => (
                  <button key={code} onClick={() => setVoiceLang(code)} style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'8px 14px', borderRadius:999, cursor:'pointer',
                    background: voiceLang === code ? s.accentBg : s.surface,
                    border:     voiceLang === code ? s.borderAcc : s.border,
                    color:      voiceLang === code ? s.accent : s.muted,
                    fontSize:13, fontWeight: voiceLang === code ? 700 : 400,
                    transition:'all .15s',
                  }}>
                    {LANG_FLAGS[code]} {tc.langLabels[code]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop:s.border, marginBottom:24 }} />

            {/* Cart items */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
              {cartItems.map((item, idx) => (
                <div key={item.id} style={{
                  background: s.surface2, border: item.duration ? s.borderAcc : s.border,
                  borderRadius:14, padding:'18px 18px 16px', transition:'border-color .2s',
                }}>
                  {/* Header item */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:s.accent, letterSpacing:0.4 }}>
                      {tc.s0.video(idx + 1)}
                      {item.duration && (
                        <span style={{ color:s.muted, fontWeight:400 }}>
                          {' · '}{item.duration} sec · {tc.durLabels[item.duration]}{item.formats.length > 0 ? ` · ${item.formats.join(' · ')}` : ''}
                        </span>
                      )}
                    </span>
                    {cartItems.length > 1 && (
                      <button onClick={() => removeItem(item.id)} style={{
                        background:'none', border:'none', cursor:'pointer',
                        color:s.muted, fontSize:18, padding:'0 4px', lineHeight:1,
                        transition:'color .15s',
                      }}
                        onMouseEnter={e=>(e.currentTarget.style.color=s.red)}
                        onMouseLeave={e=>(e.currentTarget.style.color=s.muted)}
                      >×</button>
                    )}
                  </div>

                  {/* Durée */}
                  <div style={{ marginBottom:14 }}>
                    <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted }}>{tc.s0.durLabel}</p>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {DURATIONS.map(d => (
                        <button key={d} onClick={() => updateItem(item.id, { duration: d, formats: [DEFAULT_FORMAT] })} style={{
                          flex:'1 1 0', minWidth:58, padding:'10px 4px', borderRadius:8, cursor:'pointer',
                          background: item.duration === d ? s.accentBg : 'rgba(255,255,255,.04)',
                          border:     item.duration === d ? s.borderAcc : s.border,
                          color:s.text, textAlign:'center', transition:'all .15s',
                        }}>
                          <div style={{ fontSize:14, fontWeight:700, color: item.duration === d ? s.accent : '#fff' }}>
                            <ClockIcon active={item.duration === d} />{d} sec
                          </div>
                          <div style={{ fontSize:11, color: item.duration === d ? s.accent : s.muted, marginTop:2 }}>
                            {PRICE[d]} €
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Format — single choice among 6 */}
                  {item.duration && (
                    <div style={{ marginBottom:14 }}>
                      <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted }}>
                        {tc.s0.formatsLabel}
                      </p>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                        {FORMATS.map(f => {
                          const active = item.formats.includes(f.value)
                          return (
                            <button key={f.value}
                              onClick={() => updateItem(item.id, { formats: [f.value] })}
                              style={{
                                padding:'8px 6px', borderRadius:8, cursor:'pointer',
                                background: active ? s.accentBg : 'rgba(255,255,255,.03)',
                                border:     active ? s.borderAcc : s.border,
                                color: s.text, textAlign:'center', transition:'all .15s',
                              }}>
                              <FormatIcon ratio={f.ratio} active={active} />
                              <div style={{ fontSize:12, fontWeight:700, color: active ? s.accent : '#fff' }}>{f.label}</div>
                              <div style={{ fontSize:10, color:s.muted, marginTop:1 }}>{f.desc}</div>
                            </button>
                          )
                        })}
                      </div>
                      <p style={{ margin:'6px 0 0', fontSize:11, color:'rgba(255,255,255,.3)', lineHeight:1.4 }}>
                        {tc.s0.formatsNote}
                      </p>
                    </div>
                  )}

                  {/* Quantité */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div>
                      <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted }}>{tc.s0.qtyLabel}</p>
                      {item.duration && item.qty > 1 && (
                        <span style={{ fontSize:12, color:s.accent }}>
                          {item.qty} × {PRICE[item.duration]} € = {item.qty * PRICE[item.duration]} €
                        </span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:0, background:'rgba(255,255,255,.06)', borderRadius:10, border:s.border, overflow:'hidden' }}>
                      <button onClick={() => updateItem(item.id, { qty: Math.max(1, item.qty - 1) })} style={{
                        width:38, height:38, background:'none', border:'none', cursor:'pointer',
                        color:item.qty <= 1 ? s.muted : '#fff', fontSize:18, transition:'color .15s',
                      }}>−</button>
                      <span style={{ width:32, textAlign:'center', fontSize:15, fontWeight:700, color:'#fff' }}>{item.qty}</span>
                      <button onClick={() => updateItem(item.id, { qty: item.qty + 1 })} style={{
                        width:38, height:38, background:'none', border:'none', cursor:'pointer',
                        color:'#fff', fontSize:18, transition:'color .15s',
                      }}>+</button>
                    </div>
                  </div>

                  {/* Option comédien IA */}
                  <button onClick={() => updateItem(item.id, { wantAiModel: !item.wantAiModel })} style={{
                    width:'100%', padding:'11px 14px', borderRadius:10, cursor:'pointer',
                    background: item.wantAiModel ? 'rgba(165,180,252,.08)' : 'transparent',
                    border:     item.wantAiModel ? s.borderAcc : s.border,
                    color:s.text, textAlign:'left', transition:'all .15s',
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:36, height:20, borderRadius:999, flexShrink:0,
                        background: item.wantAiModel ? s.accent : 'rgba(255,255,255,.15)',
                        position:'relative', transition:'background .15s',
                      }}>
                        <div style={{
                          position:'absolute', top:2, width:16, height:16, borderRadius:'50%',
                          background:'#fff', transition:'left .15s', boxShadow:'0 1px 4px rgba(0,0,0,.4)',
                          left: item.wantAiModel ? 18 : 2,
                        }} />
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color: item.wantAiModel ? s.accent : s.muted }}>
                        {tc.s0.aiModel}
                      </span>
                    </div>
                    <span style={{
                      fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:999,
                      background: item.wantAiModel ? 'rgba(165,180,252,.15)' : 'rgba(255,255,255,.07)',
                      color: item.wantAiModel ? s.accent : s.muted, whiteSpace:'nowrap',
                    }}>
                      {tc.s0.aiModelPrice(getModelAddon(item.duration))}
                    </span>
                  </button>

                  {item.wantAiModel && (
                    <div style={{ marginTop:10 }}>
                      <textarea
                        value={item.aiModelDesc}
                        onChange={e => updateItem(item.id, { aiModelDesc: e.target.value })}
                        placeholder={tc.s0.aiModelPh}
                        rows={2}
                        maxLength={400}
                        style={{
                          width:'100%', boxSizing:'border-box', padding:'10px 12px',
                          borderRadius:8, background:s.surface, border:s.border,
                          color:s.text, fontSize:13, lineHeight:1.5,
                          resize:'vertical', outline:'none', fontFamily:'inherit', transition:'border-color .15s',
                        }}
                        onFocus={e=>(e.target.style.borderColor=s.accent)}
                        onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.1)')}
                      />
                    </div>
                  )}

                  {/* Sous-total item */}
                  {item.duration && (
                    <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
                      <span style={{ fontSize:13, color:s.muted }}>
                        {tc.s0.subtotal}{' '}
                        <strong style={{ color:'#fff', fontSize:15 }}>
                          {(PRICE[item.duration] + (item.wantAiModel ? getModelAddon(item.duration) : 0)) * item.qty} €
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Ajouter une vidéo */}
            <button onClick={addItem} style={{
              width:'100%', padding:'13px', borderRadius:12, cursor:'pointer',
              background:'transparent', border:`1.5px dashed rgba(165,180,252,.3)`,
              color:s.accent, fontSize:14, fontWeight:600,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'all .15s',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.background=s.accentBg; e.currentTarget.style.borderColor=s.accent }}
              onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(165,180,252,.3)' }}
            >
              {tc.s0.addVideo}
            </button>

            {/* Total */}
            {totalPrice > 0 && (
              <div style={{
                marginTop:20, padding:'16px 20px', borderRadius:12,
                background:s.accentBg, border:s.borderAcc,
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10,
              }}>
                <div style={{ fontSize:13, color:s.accent, lineHeight:1.6 }}>
                  <strong>{tc.s0.totalVoice(totalVideos, voiceLabel)}</strong><br />
                  <span style={{ color:'rgba(165,180,252,.7)', fontSize:12 }}>
                    {tc.s0.totalMeta}{' '}
                    {cartItems.length === 1 && cartItems[0].formats.length > 0
                      ? tc.s0.totalFmts1(cartItems[0].formats.length, cartItems[0].formats.join(', '))
                      : tc.s0.totalFmts2(cartItems.reduce((a, i) => a + i.formats.length, 0))
                    }
                  </span>
                </div>
                <div style={{ fontSize:26, fontWeight:800, color:'#fff', whiteSpace:'nowrap' }}>
                  {totalPrice} €
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              disabled={!step0Valid}
              style={{
                width:'100%', marginTop:16, padding:'15px', borderRadius:10,
                background: step0Valid ? s.accent : 'rgba(255,255,255,.1)',
                color:      step0Valid ? '#1E1B4B' : s.muted,
                fontSize:15, fontWeight:700, border:'none',
                cursor: step0Valid ? 'pointer' : 'not-allowed', transition:'all .15s',
              }}
            >
              {tc.s0.continue}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 1 — Brief + Références
        ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              {tc.s1.h1}
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 28px', lineHeight:1.5 }}>
              {tc.s1.sub}
            </p>

            <div style={{ marginBottom:24 }}>
              <Label>{tc.s1.briefLabel} <span style={{ color:s.accent }}>*</span></Label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder={tc.s1.briefPh}
                rows={5}
                maxLength={1000}
                style={{
                  width:'100%', boxSizing:'border-box', padding:'12px 14px',
                  borderRadius:8, background:s.surface, border:s.border,
                  color:s.text, fontSize:14, lineHeight:1.6,
                  resize:'vertical', outline:'none', fontFamily:'inherit', transition:'border-color .15s',
                }}
                onFocus={e=>(e.target.style.borderColor=s.accent)}
                onBlur={e=>(e.target.style.borderColor='rgba(255,255,255,.1)')}
              />
              <p style={{ margin:'6px 0 0', fontSize:12, color:s.muted, textAlign:'right' }}>{brief.length}/1000</p>
            </div>

            <div style={{ marginBottom:28 }}>
              <Label>{tc.s1.refsLabel}</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e=>{ e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                style={{
                  border:`2px dashed ${dragOver ? s.accent : 'rgba(255,255,255,.15)'}`,
                  borderRadius:10, padding:'24px 20px', textAlign:'center', cursor:'pointer',
                  background: dragOver ? s.accentBg : 'transparent', transition:'all .15s',
                }}
              >
                <div style={{ fontSize:24, marginBottom:8 }}>📁</div>
                <p style={{ margin:0, fontSize:14, color:s.muted }}>
                  {tc.s1.dropZone} <span style={{ color:s.accent, textDecoration:'underline' }}>{tc.s1.dropLink}</span>
                </p>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'rgba(255,255,255,.3)' }}>
                  {tc.s1.dropTypes}
                </p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept={ACCEPT_TYPES} style={{ display:'none' }} onChange={e=>addFiles(e.target.files)} />
              {files.length > 0 && (
                <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'8px 12px', borderRadius:8, background:s.surface, border:s.border,
                    }}>
                      <span style={{ fontSize:13, color:s.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'80%' }}>
                        {f.name} <span style={{ color:s.muted }}>({(f.size/1024/1024).toFixed(1)} MB)</span>
                      </span>
                      <button onClick={() => removeFile(i)} style={{ background:'none', border:'none', cursor:'pointer', color:s.muted, fontSize:16, padding:'0 4px' }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep(0)} style={{
                flex:'0 0 auto', padding:'14px 20px', borderRadius:10,
                background:'transparent', border:s.border, color:s.muted, fontSize:14, cursor:'pointer',
              }}>{tc.back}</button>
              <button onClick={() => setStep(2)} disabled={!step1Valid} style={{
                flex:1, padding:'14px', borderRadius:10,
                background: step1Valid ? s.accent : 'rgba(255,255,255,.1)',
                color:      step1Valid ? '#1E1B4B' : s.muted,
                fontSize:15, fontWeight:700, border:'none',
                cursor: step1Valid ? 'pointer' : 'not-allowed', transition:'all .15s',
              }}>{tc.s1.continue}</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 2 — Coordonnées
        ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              {tc.s2.h1}
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 28px', lineHeight:1.5 }}>
              {tc.s2.sub}
            </p>

            <FieldInput label={tc.s2.fullName}  value={clientName}    onChange={setClientName}    placeholder={tc.s2.fullNamePh} required />
            <FieldInput label={tc.s2.email}      value={clientEmail}   onChange={setClientEmail}   placeholder={tc.s2.emailPh} type="email" required />
            <FieldInput label={tc.s2.phone}      value={clientPhone}   onChange={setClientPhone}   placeholder={tc.s2.phonePh} type="tel" />
            <FieldInput label={tc.s2.company}    value={clientCompany} onChange={setClientCompany} placeholder={tc.s2.companyPh} />

            <div style={{ marginBottom:28 }}>
              <Label>{tc.s2.callSlot}</Label>
              <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                {tc.callDays.map((day, i) => (
                  <button key={day} onClick={() => setCallDayIdx(i)} style={{
                    flex:'1 1 0', minWidth:44, padding:'10px 6px', borderRadius:8, cursor:'pointer',
                    background: callDayIdx === i ? s.accentBg : s.surface,
                    border:     callDayIdx === i ? s.borderAcc : s.border,
                    color:      callDayIdx === i ? s.accent : s.muted,
                    fontSize:13, fontWeight: callDayIdx === i ? 700 : 400, transition:'all .15s',
                  }}>{day}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {tc.callTimes.map(({ label, range }, i) => (
                  <button key={label} onClick={() => setCallTimeIdx(i)} style={{
                    flex:1, padding:'11px 8px', borderRadius:8, cursor:'pointer',
                    background: callTimeIdx === i ? s.accentBg : s.surface,
                    border:     callTimeIdx === i ? s.borderAcc : s.border,
                    color:      callTimeIdx === i ? s.accent : s.muted,
                    fontSize:13, fontWeight: callTimeIdx === i ? 700 : 400,
                    transition:'all .15s', textAlign:'center',
                  }}>
                    <div style={{ fontWeight:700, marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:11, opacity:0.75 }}>{range}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep(1)} style={{
                flex:'0 0 auto', padding:'14px 20px', borderRadius:10,
                background:'transparent', border:s.border, color:s.muted, fontSize:14, cursor:'pointer',
              }}>{tc.back}</button>
              <button onClick={() => setStep(3)} disabled={!step2Valid} style={{
                flex:1, padding:'14px', borderRadius:10,
                background: step2Valid ? s.accent : 'rgba(255,255,255,.1)',
                color:      step2Valid ? '#1E1B4B' : s.muted,
                fontSize:15, fontWeight:700, border:'none',
                cursor: step2Valid ? 'pointer' : 'not-allowed', transition:'all .15s',
              }}>{tc.s2.review}</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 3 — Récap + Paiement
        ══════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              {tc.s3.h1}
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 28px', lineHeight:1.5 }}>
              {tc.s3.sub}
            </p>

            <div style={{ background:s.surface, border:s.border, borderRadius:12, overflow:'hidden', marginBottom:20 }}>

              {/* Vidéos */}
              <div style={{ padding:'16px 20px', borderBottom:s.border }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:12 }}>
                  {tc.s3.videosHdr(voiceLabel)}
                </div>
                {cartItems.map((item, idx) => item.duration && (
                  <div key={item.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                    padding:'10px 0',
                    borderBottom: idx < cartItems.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                        {tc.s3.videoRow(item.duration, tc.durLabels[item.duration])}{item.formats.length > 0 ? ` · ${item.formats.join(', ')}` : ''}
                        {item.qty > 1 && <span style={{ color:s.accent }}> × {item.qty}</span>}
                      </div>
                      {item.wantAiModel && (
                        <div style={{ fontSize:12, color:s.accent, marginTop:2 }}>{tc.s3.aiLine}</div>
                      )}
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:s.accent, whiteSpace:'nowrap', marginLeft:16 }}>
                      {(PRICE[item.duration] + (item.wantAiModel ? getModelAddon(item.duration) : 0)) * item.qty} €
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,.08)' }}>
                  <span style={{ fontSize:13, color:s.muted }}>{tc.s3.totalRow(totalVideos)}</span>
                  <span style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{totalPrice} €</span>
                </div>
              </div>

              {/* Brief */}
              <div style={{ padding:'16px 20px', borderBottom:s.border }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:8 }}>{tc.s3.briefLabel}</div>
                <p style={{ margin:0, fontSize:14, color:s.text, lineHeight:1.6, whiteSpace:'pre-line' }}>{brief}</p>
              </div>

              {/* Contact */}
              <div style={{ padding:'16px 20px', borderBottom: files.length > 0 ? s.border : 'none' }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:8 }}>{tc.s3.contactLbl}</div>
                <p style={{ margin:0, fontSize:14, color:s.text, lineHeight:1.7 }}>
                  {clientName}{clientCompany && <span style={{ color:s.muted }}> — {clientCompany}</span>}<br />
                  {clientEmail}{clientPhone && <><br />{clientPhone}</>}
                  {callSlotStr && <><br /><span style={{ color:s.muted }}>{tc.s3.slotLbl} {callSlotStr}</span></>}
                </p>
              </div>

              {files.length > 0 && (
                <div style={{ padding:'16px 20px' }}>
                  <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:8 }}>
                    {tc.s3.refsLbl(files.length)}
                  </div>
                  <p style={{ margin:0, fontSize:13, color:s.muted }}>{files.map(f => f.name).join(' · ')}</p>
                </div>
              )}
            </div>

            {/* Rassurance */}
            <div style={{
              background:'rgba(74,222,128,.06)', border:'1px solid rgba(74,222,128,.15)',
              borderRadius:10, padding:'14px 18px', marginBottom:24,
              fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.6,
            }}>
              {tc.s3.assurance}
            </div>

            {/* Cases à cocher légales */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {[
                {
                  checked: acceptCgv,
                  set: setAcceptCgv,
                  label: (
                    <>
                      {uiLang === 'en' ? 'I accept the ' : 'J\'accepte les '}
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setLegalModal('cgv') }} style={{ background:'none', border:'none', padding:0, cursor:'pointer', color:s.accent, textDecoration:'underline', fontSize:'inherit', fontFamily:'inherit' }}>
                        {uiLang === 'en' ? 'Terms & Conditions' : 'Conditions Générales de Vente'}
                      </button>
                      {uiLang === 'en' ? ' and acknowledge that full payment is due before production begins.' : ' et reconnais que le paiement intégral est dû avant le démarrage de la production.'}
                    </>
                  ),
                },
                {
                  checked: acceptRgpd,
                  set: setAcceptRgpd,
                  label: (
                    <>
                      {uiLang === 'en' ? 'I consent to the processing of my personal data in accordance with the ' : 'Je consens au traitement de mes données personnelles conformément à la '}
                      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setLegalModal('confidentialite') }} style={{ background:'none', border:'none', padding:0, cursor:'pointer', color:s.accent, textDecoration:'underline', fontSize:'inherit', fontFamily:'inherit' }}>
                        {uiLang === 'en' ? 'Privacy Policy' : 'Politique de confidentialité'}
                      </button>
                      .
                    </>
                  ),
                },
                {
                  checked: acceptRights,
                  set: setAcceptRights,
                  label: uiLang === 'en'
                    ? 'I certify that I hold all rights to the elements provided (logos, images, brief) and take sole responsibility for their use.'
                    : 'Je certifie être titulaire des droits sur les éléments fournis (logos, visuels, brief) et assume l\'entière responsabilité de leur utilisation.',
                },
              ].map(({ checked, set, label }, i) => (
                <label key={i} style={{
                  display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer',
                  padding:'12px 14px', borderRadius:10,
                  background: checked ? 'rgba(165,180,252,.06)' : s.surface,
                  border: checked ? s.borderAcc : s.border,
                  transition:'all .15s',
                }}>
                  <div style={{
                    flexShrink:0, marginTop:1,
                    width:18, height:18, borderRadius:4,
                    background: checked ? s.accent : 'transparent',
                    border: checked ? 'none' : '1.5px solid rgba(255,255,255,.3)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .15s',
                  }}>
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#1E1B4B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" checked={checked} onChange={e => set(e.target.checked)} style={{ display:'none' }} />
                  <span style={{ fontSize:13, color: checked ? 'rgba(255,255,255,.85)' : s.muted, lineHeight:1.55 }}>
                    {label}
                  </span>
                </label>
              ))}
            </div>

            {error && (
              <div style={{ background:s.danger, border:'1px solid rgba(248,113,113,.3)', borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:14, color:s.red }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep(2)} disabled={submitting} style={{
                flex:'0 0 auto', padding:'14px 20px', borderRadius:10,
                background:'transparent', border:s.border, color:s.muted, fontSize:14, cursor:'pointer',
                opacity: submitting ? 0.5 : 1,
              }}>{tc.back}</button>
              <button onClick={handleSubmit} disabled={submitting || !acceptCgv || !acceptRgpd || !acceptRights} style={{
                flex:1, padding:'16px', borderRadius:10,
                background: (submitting || !acceptCgv || !acceptRgpd || !acceptRights) ? 'rgba(165,180,252,.4)' : s.accent,
                color:'#1E1B4B', fontSize:16, fontWeight:700, border:'none',
                cursor: (submitting || !acceptCgv || !acceptRgpd || !acceptRights) ? 'not-allowed' : 'pointer',
                transition:'all .15s', letterSpacing:-0.2,
              }}>
                {submitting
                  ? (uploading ? tc.s3.uploading : tc.s3.redirecting)
                  : tc.s3.pay(totalPrice)}
              </button>
            </div>

            <p style={{ margin:'16px 0 0', fontSize:12, color:'rgba(255,255,255,.35)', textAlign:'center' }}>
              {tc.s3.stripeNote}
            </p>
          </div>
        )}

      </div>
    </main>
    </>
  )
}
