'use client'

// app/commande/page.tsx — V2 multi-vidéos
// Étapes : 1. Panier (formats + durées + langues) → 2. Brief + refs → 3. Coordonnées → 4. Récap + Paiement

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────

type Format   = '16:9' | '1:1' | '9:16' | '4:3' | '3:4' | '21:9'
type Duration = 5 | 8 | 10 | 12 | 15
type CallDay  = 'Lun' | 'Mar' | 'Mer' | 'Jeu' | 'Ven' | 'Sam'
type CallTime = 'Matin' | 'Après-midi' | 'Soir'

type CartItem = {
  id: string
  duration: Duration | null
  qty: number
  wantAiModel: boolean
  aiModelDesc: string
}

const CALL_DAYS: CallDay[]  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const CALL_TIMES: { value: CallTime; range: string }[] = [
  { value: 'Matin',      range: '9h – 12h'  },
  { value: 'Après-midi', range: '13h – 18h' },
  { value: 'Soir',       range: '18h – 20h' },
]

const PRICE: Record<Duration, number> = { 5: 69, 8: 89, 10: 109, 12: 129, 15: 159 }
const AI_MODEL_ADDON = 49
const DURATIONS: Duration[] = [5, 8, 10, 12, 15]
const DUR_LABEL: Record<Duration, string> = { 5: 'Court', 8: 'Reel', 10: 'Pub', 12: 'Narration', 15: 'Histoire' }

const FORMATS: { value: Format; label: string; desc: string; ratio: [number, number] }[] = [
  { value: '9:16',  label: '9:16',  desc: 'TikTok · Reels',      ratio: [9,  16] },
  { value: '1:1',   label: '1:1',   desc: 'Instagram feed',       ratio: [1,  1]  },
  { value: '16:9',  label: '16:9',  desc: 'YouTube · Web',        ratio: [16, 9]  },
  { value: '4:3',   label: '4:3',   desc: 'Square+',              ratio: [4,  3]  },
  { value: '3:4',   label: '3:4',   desc: 'Pinterest · Portrait', ratio: [3,  4]  },
  { value: '21:9',  label: '21:9',  desc: 'Cinéma · Ultra-wide',  ratio: [21, 9]  },
]

const LANGUAGES = [
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'en', flag: '🇺🇸', label: 'Anglais'  },
  { code: 'ja', flag: '🇯🇵', label: 'Japonais' },
  { code: 'es', flag: '🇪🇸', label: 'Espagnol' },
  { code: 'pt', flag: '🇧🇷', label: 'Portugais'},
  { code: 'id', flag: '🇮🇩', label: 'Indonésien'},
]

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

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Vidéos', 'Brief', 'Contact', 'Paiement']
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:36, overflowX:'auto' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background: i < current ? s.accent : i === current ? s.accent : 'rgba(255,255,255,.1)',
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
    duration: null, qty: 1, wantAiModel: false, aiModelDesc: '',
  })

  const [step,        setStep]        = useState(0)
  const [format,      setFormat]      = useState<Format | null>(null)
  const [language,    setLanguage]    = useState<string>('Français')
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
  const [callDay,     setCallDay]     = useState<CallDay | null>(null)
  const [callTime,    setCallTime]    = useState<CallTime | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [dragOver,    setDragOver]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pré-remplissage URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const duree = params.get('duree')
    if (duree) {
      const n = parseInt(duree) as Duration
      if (([5,8,10,12,15] as number[]).includes(n)) {
        setCartItems([{ ...newItem(), duration: n }])
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
    return sum + (PRICE[item.duration] + (item.wantAiModel ? AI_MODEL_ADDON : 0)) * item.qty
  }, 0)

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
    if (totalMb > 4) throw new Error(`Fichiers trop volumineux (${totalMb.toFixed(1)} MB). Envoyez-les par email après paiement.`)
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('file', f))
      const res = await fetch(`/api/orders/upload?sessionId=${sessionId}`, { method:'POST', body:fd })
      let json: { paths?: string[]; error?: string }
      try { json = await res.json() } catch { throw new Error('Fichiers trop volumineux. Envoyez-les par email après paiement.') }
      if (!res.ok) throw new Error(json.error ?? 'Erreur upload')
      return json.paths ?? []
    } finally { setUploading(false) }
  }

  const handleSubmit = async () => {
    if (!format) return
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
          format,
          language,
          cart_items: cartItems.map(it => ({
            duration:       it.duration,
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
          preferred_call_slot: (callDay && callTime)
            ? `${callDay} · ${callTime} (${CALL_TIMES.find(t => t.value === callTime)!.range})`
            : undefined,
          ref_paths: paths,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur lors de la création de la commande')
      window.location.href = json.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue')
      setSubmitting(false)
    }
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  const step0Valid = format !== null && cartItems.length > 0 && cartItems.every(it => it.duration !== null)
  const step1Valid = brief.trim().length >= 10
  const step2Valid = clientName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{
      minHeight:'100vh', background:s.bg, color:s.text,
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      padding:'48px 24px 80px', fontFamily:'var(--f)',
    }}>
      <div style={{ maxWidth:640, width:'100%' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:40 }}>
          <Link href="/" style={{ fontSize:13, color:s.muted, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
            ← Retour
          </Link>
          <img src="/logo-sceniq.svg" alt="ScenIQ" style={{ height:40, display:'block' }} />
        </div>

        <StepIndicator current={step} total={4} />

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 0 — Panier vidéos
        ══════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              Composez votre commande
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 32px', lineHeight:1.5 }}>
              Ajoutez autant de vidéos que vous voulez — durées, quantités et options différentes dans une seule commande.
            </p>

            {/* Format partagé */}
            <div style={{ marginBottom:28 }}>
              <Label>Format vidéo <span style={{ color:s.accent }}>*</span> — partagé pour toutes les vidéos</Label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {FORMATS.map(f => (
                  <button key={f.value} onClick={() => setFormat(f.value)} style={{
                    padding:'10px 8px', borderRadius:10, cursor:'pointer',
                    background: format === f.value ? s.accentBg : s.surface,
                    border:     format === f.value ? s.borderAcc : s.border,
                    color:s.text, textAlign:'center', transition:'all .15s',
                  }}>
                    <FormatIcon ratio={f.ratio} active={format === f.value} />
                    <div style={{ fontSize:13, fontWeight:700, color: format === f.value ? s.accent : '#fff' }}>{f.label}</div>
                    <div style={{ fontSize:10, color:s.muted, marginTop:1 }}>{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Langue */}
            <div style={{ marginBottom:32 }}>
              <Label>Langue de la voix-off / dialogue <span style={{ color:s.accent }}>*</span></Label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {LANGUAGES.map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.label)} style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'8px 14px', borderRadius:999, cursor:'pointer',
                    background: language === l.label ? s.accentBg : s.surface,
                    border:     language === l.label ? s.borderAcc : s.border,
                    color:      language === l.label ? s.accent : s.muted,
                    fontSize:13, fontWeight: language === l.label ? 700 : 400,
                    transition:'all .15s',
                  }}>
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Ligne séparateur ── */}
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
                      Vidéo {idx + 1}
                      {item.duration && <span style={{ color:s.muted, fontWeight:400 }}> · {item.duration}s · {DUR_LABEL[item.duration]}</span>}
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
                    <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted }}>Durée</p>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {DURATIONS.map(d => (
                        <button key={d} onClick={() => updateItem(item.id, { duration: d })} style={{
                          flex:'1 1 0', minWidth:58, padding:'10px 4px', borderRadius:8, cursor:'pointer',
                          background: item.duration === d ? s.accentBg : 'rgba(255,255,255,.04)',
                          border:     item.duration === d ? s.borderAcc : s.border,
                          color:s.text, textAlign:'center', transition:'all .15s',
                        }}>
                          <div style={{ fontSize:14, fontWeight:700, color: item.duration === d ? s.accent : '#fff' }}>
                            <ClockIcon active={item.duration === d} />{d}s
                          </div>
                          <div style={{ fontSize:11, color: item.duration === d ? s.accent : s.muted, marginTop:2 }}>
                            {PRICE[d]} €
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantité */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div>
                      <p style={{ margin:'0 0 2px', fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted }}>Quantité</p>
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
                      {/* Toggle pill */}
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
                        Comédien IA sur mesure
                      </span>
                    </div>
                    <span style={{
                      fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:999,
                      background: item.wantAiModel ? 'rgba(165,180,252,.15)' : 'rgba(255,255,255,.07)',
                      color: item.wantAiModel ? s.accent : s.muted, whiteSpace:'nowrap',
                    }}>
                      +{AI_MODEL_ADDON} € / vidéo
                    </span>
                  </button>

                  {/* Description comédien */}
                  {item.wantAiModel && (
                    <div style={{ marginTop:10 }}>
                      <textarea
                        value={item.aiModelDesc}
                        onChange={e => updateItem(item.id, { aiModelDesc: e.target.value })}
                        placeholder="Ex : Femme 28–35 ans, style urbain, peau claire, cheveux châtains mi-longs, regard direct, ambiance moderne."
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
                        Sous-total :{' '}
                        <strong style={{ color:'#fff', fontSize:15 }}>
                          {(PRICE[item.duration] + (item.wantAiModel ? AI_MODEL_ADDON : 0)) * item.qty} €
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bouton ajouter une vidéo */}
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
              + Ajouter une autre vidéo
            </button>

            {/* Total commande */}
            {totalPrice > 0 && (
              <div style={{
                marginTop:20, padding:'16px 20px', borderRadius:12,
                background:s.accentBg, border:s.borderAcc,
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10,
              }}>
                <div style={{ fontSize:13, color:s.accent, lineHeight:1.6 }}>
                  <strong>{totalVideos} vidéo{totalVideos > 1 ? 's' : ''}</strong> · Format {format || '—'} · Voix {language}<br />
                  <span style={{ color:'rgba(165,180,252,.7)', fontSize:12 }}>10 allers-retours · MP4 sous 48h · tous formats inclus</span>
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
              Continuer →
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 1 — Brief + Références
        ══════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              Votre brief en 2–5 lignes
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 28px', lineHeight:1.5 }}>
              Marque, ton, message, contexte. Je m'occupe du reste.
            </p>

            <div style={{ marginBottom:24 }}>
              <Label>Brief <span style={{ color:s.accent }}>*</span></Label>
              <textarea
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="Ex : Vidéo de lancement pour notre eau pétillante haut-de-gamme. Ton urbain et posé. Public 25-40 ans, grandes villes. On veut montrer la bouteille dans des contextes lifestyle — terrasse, bureau moderne, après-sport."
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
              <Label>Références (facultatif) — 10 max, 4 MB total</Label>
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
                  Glissez vos fichiers ici ou <span style={{ color:s.accent, textDecoration:'underline' }}>parcourir</span>
                </p>
                <p style={{ margin:'4px 0 0', fontSize:12, color:'rgba(255,255,255,.3)' }}>
                  Images · audio · vidéos · logo · charte graphique
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
              }}>← Retour</button>
              <button onClick={() => setStep(2)} disabled={!step1Valid} style={{
                flex:1, padding:'14px', borderRadius:10,
                background: step1Valid ? s.accent : 'rgba(255,255,255,.1)',
                color:      step1Valid ? '#1E1B4B' : s.muted,
                fontSize:15, fontWeight:700, border:'none',
                cursor: step1Valid ? 'pointer' : 'not-allowed', transition:'all .15s',
              }}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 2 — Coordonnées
        ══════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              Vos coordonnées
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 28px', lineHeight:1.5 }}>
              Je vous rappelle sous 4 h ouvrées après paiement.
            </p>

            <FieldInput label="Nom complet" value={clientName} onChange={setClientName} placeholder="Marie Dupont" required />
            <FieldInput label="Email" value={clientEmail} onChange={setClientEmail} placeholder="marie@exemple.fr" type="email" required />
            <FieldInput label="Téléphone" value={clientPhone} onChange={setClientPhone} placeholder="+33 6 12 34 56 78" type="tel" />
            <FieldInput label="Société" value={clientCompany} onChange={setClientCompany} placeholder="Agence Pixel" />

            <div style={{ marginBottom:28 }}>
              <Label>Créneau préféré pour l'appel</Label>
              <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                {CALL_DAYS.map(day => (
                  <button key={day} onClick={() => setCallDay(day)} style={{
                    flex:'1 1 0', minWidth:44, padding:'10px 6px', borderRadius:8, cursor:'pointer',
                    background: callDay === day ? s.accentBg : s.surface,
                    border:     callDay === day ? s.borderAcc : s.border,
                    color:      callDay === day ? s.accent : s.muted,
                    fontSize:13, fontWeight: callDay === day ? 700 : 400, transition:'all .15s',
                  }}>{day}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {CALL_TIMES.map(({ value, range }) => (
                  <button key={value} onClick={() => setCallTime(value)} style={{
                    flex:1, padding:'11px 8px', borderRadius:8, cursor:'pointer',
                    background: callTime === value ? s.accentBg : s.surface,
                    border:     callTime === value ? s.borderAcc : s.border,
                    color:      callTime === value ? s.accent : s.muted,
                    fontSize:13, fontWeight: callTime === value ? 700 : 400,
                    transition:'all .15s', textAlign:'center',
                  }}>
                    <div style={{ fontWeight:700, marginBottom:2 }}>{value}</div>
                    <div style={{ fontSize:11, opacity:0.75 }}>{range}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep(1)} style={{
                flex:'0 0 auto', padding:'14px 20px', borderRadius:10,
                background:'transparent', border:s.border, color:s.muted, fontSize:14, cursor:'pointer',
              }}>← Retour</button>
              <button onClick={() => setStep(3)} disabled={!step2Valid} style={{
                flex:1, padding:'14px', borderRadius:10,
                background: step2Valid ? s.accent : 'rgba(255,255,255,.1)',
                color:      step2Valid ? '#1E1B4B' : s.muted,
                fontSize:15, fontWeight:700, border:'none',
                cursor: step2Valid ? 'pointer' : 'not-allowed', transition:'all .15s',
              }}>Vérifier ma commande →</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            ÉTAPE 3 — Récap + Paiement
        ══════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:700, letterSpacing:-0.5, color:'#fff', margin:'0 0 6px' }}>
              Récap de votre commande
            </h1>
            <p style={{ fontSize:14, color:s.muted, margin:'0 0 28px', lineHeight:1.5 }}>
              Vérifiez avant de payer — vous serez redirigé vers Stripe.
            </p>

            <div style={{ background:s.surface, border:s.border, borderRadius:12, overflow:'hidden', marginBottom:20 }}>

              {/* Vidéos */}
              <div style={{ padding:'16px 20px', borderBottom:s.border }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:12 }}>
                  Vidéos commandées — Format {format} · Voix {language}
                </div>
                {cartItems.map((item, idx) => item.duration && (
                  <div key={item.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                    padding:'10px 0',
                    borderBottom: idx < cartItems.length - 1 ? '1px solid rgba(255,255,255,.06)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                        Vidéo {item.duration}s · {DUR_LABEL[item.duration]}
                        {item.qty > 1 && <span style={{ color:s.accent }}> × {item.qty}</span>}
                      </div>
                      {item.wantAiModel && (
                        <div style={{ fontSize:12, color:s.accent, marginTop:2 }}>+ Comédien IA sur mesure</div>
                      )}
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:s.accent, whiteSpace:'nowrap', marginLeft:16 }}>
                      {(PRICE[item.duration] + (item.wantAiModel ? AI_MODEL_ADDON : 0)) * item.qty} €
                    </div>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,.08)' }}>
                  <span style={{ fontSize:13, color:s.muted }}>{totalVideos} vidéo{totalVideos > 1 ? 's' : ''} · 10 allers-retours · MP4 sous 48h</span>
                  <span style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{totalPrice} €</span>
                </div>
              </div>

              {/* Brief */}
              <div style={{ padding:'16px 20px', borderBottom:s.border }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:8 }}>Brief</div>
                <p style={{ margin:0, fontSize:14, color:s.text, lineHeight:1.6, whiteSpace:'pre-line' }}>{brief}</p>
              </div>

              {/* Contact */}
              <div style={{ padding:'16px 20px', borderBottom: files.length > 0 ? s.border : 'none' }}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:8 }}>Contact</div>
                <p style={{ margin:0, fontSize:14, color:s.text, lineHeight:1.7 }}>
                  {clientName}{clientCompany && <span style={{ color:s.muted }}> — {clientCompany}</span>}<br />
                  {clientEmail}{clientPhone && <><br />{clientPhone}</>}
                  {(callDay || callTime) && <><br /><span style={{ color:s.muted }}>Créneau : {[callDay, callTime].filter(Boolean).join(' · ')}</span></>}
                </p>
              </div>

              {files.length > 0 && (
                <div style={{ padding:'16px 20px' }}>
                  <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:s.muted, marginBottom:8 }}>
                    Références ({files.length} fichier{files.length > 1 ? 's' : ''})
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
              🔒 Paiement sécurisé Stripe · Confirmation email immédiate · Pré-prod sous 4 h ouvrées · 10 allers-retours inclus · Remboursement intégral si la direction créative ne convient pas
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
              }}>← Retour</button>
              <button onClick={handleSubmit} disabled={submitting} style={{
                flex:1, padding:'16px', borderRadius:10,
                background: submitting ? 'rgba(165,180,252,.4)' : s.accent,
                color:'#1E1B4B', fontSize:16, fontWeight:700, border:'none',
                cursor: submitting ? 'wait' : 'pointer', transition:'all .15s', letterSpacing:-0.2,
              }}>
                {submitting
                  ? (uploading ? 'Upload des références…' : 'Redirection Stripe…')
                  : `Payer ${totalPrice} € →`}
              </button>
            </div>

            <p style={{ margin:'16px 0 0', fontSize:12, color:'rgba(255,255,255,.35)', textAlign:'center' }}>
              Vous serez redirigé vers Stripe. Aucune carte n'est stockée sur nos serveurs.
            </p>
          </div>
        )}

      </div>
    </main>
  )
}
