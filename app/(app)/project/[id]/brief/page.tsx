'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Stepper } from '@/app/(app)/_components/Stepper'
import { useToast } from '@/app/(app)/_components/Toast'
import { idealScenes, sceneDurationLabel } from '@/lib/utils/scenes'

interface BrandRow {
  id:   string
  name: string
}

const FORMATS = [
  { value: '16:9', label: '16:9', sub: 'Horizontal · TV, web, YouTube',  pic: 'ar-169' },
  { value: '9:16', label: '9:16', sub: 'Vertical · Reels, Stories, TikTok', pic: 'ar-916' },
  { value: '1:1',  label: '1:1',  sub: 'Carré · Posts Instagram',           pic: 'ar-11'  },
  { value: '4:3',  label: '4:3',  sub: 'Standard · Présentations',          pic: 'ar-43'  },
] as const

const DURATIONS = [
  { value: 15, label: '15s', sub: 'Format court' },
  { value: 30, label: '30s', sub: 'Spot standard' },
  { value: 45, label: '45s', sub: 'Format long' },
  { value: 60, label: '60s', sub: 'Brand film' },
] as const

const TONES = [
  'Premium', 'Corporate', 'Émotionnel', 'Dynamique', 'Minimaliste',
  'Festif', 'Authentique', 'Audacieux', 'Poétique', 'Documentaire',
] as const

export default function BriefPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { notify } = useToast()
  const isNew = params.id === 'new'

  const [name, setName]                 = useState('')
  const [brandId, setBrandId]           = useState<string>('')
  const [brands, setBrands]             = useState<BrandRow[]>([])
  const [creatingBrand, setCreatingBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [savingBrand, setSavingBrand]   = useState(false)
  const [brief, setBrief]               = useState('')
  const [format, setFormat]             = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9')
  const [duration, setDuration]         = useState<15 | 30 | 45 | 60>(30)
  const [toneMode, setToneMode]         = useState<'auto' | 'manual'>('auto')
  const [tone, setTone]                 = useState('')
  const [customToneOpen, setCustomToneOpen] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [loadingProject, setLoadingProject] = useState(!isNew)

  // Charger les marques de l'user au mount
  useEffect(() => {
    fetch('/api/brands', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { brands: [] })
      .then(d => setBrands(Array.isArray(d.brands) ? d.brands : []))
      .catch(() => setBrands([]))
  }, [])

  // Sur projet existant : charger les vraies valeurs depuis la BDD pour pré-remplir
  useEffect(() => {
    if (isNew) return
    let alive = true
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`, { cache: 'no-store' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        const { project } = await res.json()
        if (!alive || !project) return
        setName(project.name ?? '')
        setBrief(project.brief ?? '')
        if (['16:9', '9:16', '1:1', '4:3'].includes(project.format)) setFormat(project.format)
        if ([15, 30, 45, 60].includes(project.duration_sec)) setDuration(project.duration_sec)
        setBrandId(project.brand_id ?? '')
        if (project.tone === 'auto' || !project.tone) {
          setToneMode('auto')
          setTone('')
        } else {
          setToneMode('manual')
          setTone(project.tone)
        }
      } catch (e) {
        setSubmitError(`Impossible de charger le projet : ${(e as Error).message}`)
      } finally {
        if (alive) setLoadingProject(false)
      }
    })()
    return () => { alive = false }
  }, [isNew, params.id])

  async function createBrand() {
    const trimmed = newBrandName.trim()
    if (!trimmed || savingBrand) return
    setSavingBrand(true)
    try {
      const res = await fetch('/api/brands', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok || !data.brand) {
        notify(`Erreur création marque : ${data.error || res.status}`, 'warn')
        return
      }
      setBrands((prev) => [data.brand, ...prev])
      setBrandId(data.brand.id)
      setCreatingBrand(false)
      setNewBrandName('')
      notify(`Marque « ${data.brand.name} » créée`, 'success')
    } catch (e) {
      notify(`Erreur réseau : ${(e as Error).message}`, 'warn')
    } finally {
      setSavingBrand(false)
    }
  }

  const briefLen = brief.trim().length
  const briefTooShort = briefLen > 0 && briefLen < 10
  // En mode auto, pas besoin de tone — l'IA le déduit
  const toneValid = toneMode === 'auto' || tone.trim().length > 0
  const canSubmit = name.trim().length > 0 && briefLen >= 10 && toneValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        name:         name.trim(),
        brief:        brief.trim(),
        format,
        duration_sec: duration,
        tone:         toneMode === 'auto' ? 'auto' : tone.trim(),
        brand_id:     brandId || (isNew ? undefined : null),
      }
      // Création vs mise à jour : POST sur /new, PATCH sur projet existant
      const res = isNew
        ? await fetch('/api/projects', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          })
        : await fetch(`/api/projects/${params.id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || (data.errors && data.errors.join(', ')) || `HTTP ${res.status}`
        throw new Error(msg)
      }
      const targetId = isNew ? data.projectId : params.id
      router.push(`/project/${targetId}/production`)
    } catch (err) {
      setSubmitError((err as Error).message)
      setSubmitting(false)
    }
  }

  async function saveDraft() {
    if (isNew) {
      notify('Renseigne au moins un nom et un brief pour enregistrer.', 'warn')
      return
    }
    try {
      const payload = {
        name:         name.trim() || undefined,
        brief:        brief.trim().length >= 10 ? brief.trim() : undefined,
        format,
        duration_sec: duration,
        tone:         toneMode === 'auto' ? 'auto' : tone.trim(),
        brand_id:     brandId || null,
      }
      const res = await fetch(`/api/projects/${params.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        notify(data.error || `HTTP ${res.status}`, 'warn')
        return
      }
      notify('Brouillon enregistré.', 'success')
      router.push('/dashboard')
    } catch (err) {
      notify((err as Error).message, 'warn')
    }
  }

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Link href="/dashboard" className="app-crumb" style={{ textDecoration: 'none' }}>
          ← Projets
        </Link>
      </div>
      <h1 className="app-h1">
        {isNew ? 'Nouveau projet' : 'Modifier le brief'}
      </h1>
      <p className="app-h1-sub">
        {isNew
          ? 'Décris ta vidéo en quelques phrases. Les 5 agents IA prennent le relais et te livrent un dossier de production complet en ~45 secondes.'
          : 'Ajuste le brief de ton projet. Les modifications seront prises en compte au prochain lancement de la production.'}
      </p>

      <Stepper projectId={params.id} current="brief" />

      {loadingProject ? (
        <div className="form-card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          Chargement du projet…
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        {/* IDENTITÉ */}
        <div className="form-card">
          <div className="form-section-t">Identité</div>
          <h2 className="form-section-h">Comment s&apos;appelle ce projet ?</h2>
          <p className="form-section-s">Un nom court qui te permet de retrouver ce projet dans ton dashboard.</p>

          <div className="form-field">
            <label className="form-label" htmlFor="name">
              Nom du projet
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Ex : Maison Lumière — Spot Printemps"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="brand">
              Marque
              <span className="form-label-opt" style={{ color: 'var(--blue)' }}>(recommandé)</span>
            </label>
            {creatingBrand ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  autoFocus
                  type="text"
                  className="form-input"
                  placeholder="Nom de la marque (ex: Maison Lumière)"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); void createBrand() }
                    if (e.key === 'Escape') { setCreatingBrand(false); setNewBrandName('') }
                  }}
                  maxLength={80}
                  disabled={savingBrand}
                />
                <button
                  type="button"
                  className="btn btn-p"
                  onClick={() => void createBrand()}
                  disabled={!newBrandName.trim() || savingBrand}
                >
                  {savingBrand ? 'Création…' : 'Créer'}
                </button>
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={() => { setCreatingBrand(false); setNewBrandName('') }}
                  disabled={savingBrand}
                >
                  Annuler
                </button>
              </div>
            ) : (
              <select
                id="brand"
                className="form-select"
                value={brandId}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setCreatingBrand(true)
                  } else {
                    setBrandId(e.target.value)
                  }
                }}
              >
                <option value="">— Aucune marque associée —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
                <option value="__new__">+ Créer une nouvelle marque…</option>
              </select>
            )}

            {brandId ? (
              <div
                style={{
                  marginTop: 10,
                  padding: '11px 14px',
                  borderRadius: '0 8px 8px 0',
                  borderLeft: '3px solid #22C55E',
                  background: 'rgba(34, 197, 94, .08)',
                  color: '#15803D',
                  fontSize: 13,
                  lineHeight: 1.55,
                  fontFamily: 'var(--f)',
                }}
              >
                <strong>✓ Marque « {brands.find((b) => b.id === brandId)?.name} » associée au projet.</strong>{' '}
                En V1 : seul le nom est utilisé. L&apos;upload de logo et images de référence arrive en V2 (et alimentera le reference-to-video Seedance).
              </div>
            ) : (
              <div
                style={{
                  marginTop: 10,
                  padding: '11px 14px',
                  borderRadius: '0 8px 8px 0',
                  borderLeft: '3px solid #F59E0B',
                  background: 'rgba(245, 158, 11, .08)',
                  color: '#92400E',
                  fontSize: 13,
                  lineHeight: 1.55,
                  fontFamily: 'var(--f)',
                }}
              >
                <strong>⚠ Output générique sans la charte de ta marque.</strong>{' '}
                Qualité Seedance 2.0 Pro identique, mais la vidéo ne reflétera ni les couleurs, ni le logo, ni le mood de ton client.
                {' '}
                <Link
                  href="/dashboard/brands/new"
                  style={{ color: '#B45309', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Créer une marque →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* BRIEF */}
        <div className="form-card">
          <div className="form-section-t">Brief créatif</div>
          <h2 className="form-section-h">Décris la vidéo que tu veux produire</h2>
          <p className="form-section-s">
            Plus tu donnes de contexte (cible, ambiance, références, message clé), plus les agents seront précis.
          </p>

          <div className="form-field">
            <label className="form-label" htmlFor="brief">
              Brief créatif
            </label>
            <textarea
              id="brief"
              className="form-textarea lg"
              placeholder="Ex : Spot 30s pour une marque de cosmétiques premium. Ambiance luxe parisien, lever du jour. Femme 30-45 ans, CSP+. Ton épuré, silencieux, contemplatif. Référence visuelle : Sofia Coppola. Message final : « Le luxe, c'est le temps retrouvé. »"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              required
              minLength={10}
              maxLength={2000}
            />
            <div className={`form-count ${briefLen > 1800 ? 'warn' : ''}`}>
              {briefTooShort ? (
                <span style={{ color: '#DC2626' }}>
                  Encore {10 - briefLen} caractère{10 - briefLen > 1 ? 's' : ''} minimum
                </span>
              ) : (
                <span>{briefLen} / 2000 caractères</span>
              )}
            </div>
          </div>
        </div>

        {/* FORMAT TECHNIQUE */}
        <div className="form-card">
          <div className="form-section-t">Format technique</div>
          <h2 className="form-section-h">Ratio, durée, ton</h2>
          <p className="form-section-s">
            Ces paramètres conditionnent les prompts envoyés à Seedance 2.0.
          </p>

          {/* FORMAT */}
          <div className="form-field">
            <label className="form-label">Ratio d&apos;image</label>
            <div className="radio-tiles form-grid-4">
              {FORMATS.map((f) => (
                <label
                  key={f.value}
                  className={`radio-tile ${format === f.value ? 'on' : ''}`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.value}
                    checked={format === f.value}
                    onChange={() => setFormat(f.value)}
                  />
                  <span className={`ar-pic ${f.pic}`}></span>
                  <span className="radio-tile-t">{f.label}</span>
                  <span className="radio-tile-s">{f.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* DURATION */}
          <div className="form-field">
            <label className="form-label">Durée totale</label>
            <div className="radio-tiles form-grid-4">
              {DURATIONS.map((d) => (
                <label
                  key={d.value}
                  className={`radio-tile ${duration === d.value ? 'on' : ''}`}
                >
                  <input
                    type="radio"
                    name="duration"
                    value={d.value}
                    checked={duration === d.value}
                    onChange={() => setDuration(d.value)}
                  />
                  <span className="radio-tile-t">{d.label}</span>
                  <span className="radio-tile-s">{d.sub}</span>
                </label>
              ))}
            </div>
            <p className="form-help">
              <strong style={{ color: 'var(--blue)' }}>
                ≈ {idealScenes(duration)} scènes de {sceneDurationLabel(duration)}
              </strong>
              {' '}— le nombre est calculé automatiquement selon la durée pour optimiser le rythme. Seedance 2.0 génère chaque clip en 4 à 15 secondes.
            </p>
          </div>

          {/* AMBIANCE — auto par défaut, manuel optionnel */}
          <div className="form-field">
            <label className="form-label">
              Ambiance
              <span className="form-label-opt">(optionnel)</span>
            </label>

            {toneMode === 'auto' ? (
              <div className="tone-auto">
                <div className="tone-auto-l">
                  <div className="tone-auto-ico">✨</div>
                  <div>
                    <div className="tone-auto-t">L&apos;IA déduira l&apos;ambiance depuis ton brief</div>
                    <div className="tone-auto-s">Les 5 agents identifieront le ton émotionnel et l&apos;univers visuel automatiquement.</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-g"
                  style={{ fontSize: 13, padding: '7px 14px' }}
                  onClick={() => setToneMode('manual')}
                >
                  Préciser moi-même
                </button>
              </div>
            ) : (
              <>
                <p className="form-help" style={{ marginTop: 0, marginBottom: 12 }}>
                  Choisis une ambiance dans la liste, ou tape la tienne avec « Autre ».
                </p>
                <div className="chip-group">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`chip ${tone === t ? 'on' : ''}`}
                      onClick={() => {
                        setTone(t)
                        setCustomToneOpen(false)
                      }}
                    >
                      {t}
                    </button>
                  ))}

                  {!customToneOpen && tone && !TONES.includes(tone as typeof TONES[number]) ? (
                    <button
                      type="button"
                      className="chip on"
                      onClick={() => setCustomToneOpen(true)}
                      title="Cliquer pour modifier"
                    >
                      {tone} ✎
                    </button>
                  ) : null}

                  {!customToneOpen ? (
                    <button
                      type="button"
                      className="chip chip-other"
                      onClick={() => {
                        setCustomToneOpen(true)
                        setTone('')
                      }}
                    >
                      + Autre
                    </button>
                  ) : (
                    <input
                      autoFocus
                      type="text"
                      className="chip-input"
                      placeholder="Ambiance personnalisée…"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      onBlur={() => {
                        if (!tone.trim()) setCustomToneOpen(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          ;(e.target as HTMLInputElement).blur()
                        }
                        if (e.key === 'Escape') {
                          setCustomToneOpen(false)
                          setTone('')
                        }
                      }}
                      maxLength={60}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToneMode('auto')
                    setTone('')
                    setCustomToneOpen(false)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: 13,
                    fontFamily: 'var(--f)',
                    cursor: 'pointer',
                    marginTop: 10,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  ← Laisser l&apos;IA décider à ma place
                </button>
              </>
            )}
          </div>
        </div>

        {/* RECAP — affiché dès qu'on a un minimum d'infos */}
        {canSubmit && (
          <div className="recap">
            <div className="recap-eyebrow">Avant de lancer</div>
            <div className="recap-title">Voici ce que les agents vont recevoir</div>

            <div className="recap-row">
              <div className="recap-ico">📁</div>
              <div className="recap-l">
                <div className="recap-k">Nom du projet</div>
                <div className="recap-v">{name}</div>
              </div>
            </div>

            {brandId ? (
              <div className="recap-row">
                <div className="recap-ico">🏷️</div>
                <div className="recap-l">
                  <div className="recap-k">Marque associée</div>
                  <div className="recap-v">{brands.find((b) => b.id === brandId)?.name}</div>
                </div>
              </div>
            ) : null}

            <div className="recap-row">
              <div className="recap-ico">📝</div>
              <div className="recap-l">
                <div className="recap-k">Brief créatif</div>
                <div className="recap-v brief-v">« {brief.trim()} »</div>
              </div>
            </div>

            <div className="recap-row">
              <div className="recap-ico">🎬</div>
              <div className="recap-l">
                <div className="recap-k">Format technique</div>
                <div className="recap-tags">
                  <span className="recap-tag">{format}</span>
                  <span className="recap-tag">{duration}s</span>
                  <span className="recap-tag">
                    {toneMode === 'auto' ? '✨ Ambiance auto' : tone}
                  </span>
                </div>
              </div>
            </div>

            <div className="recap-row">
              <div className="recap-ico">🎞️</div>
              <div className="recap-l">
                <div className="recap-k">Découpage estimé</div>
                <div className="recap-v">
                  ≈ <strong>{idealScenes(duration)} scènes</strong> de <strong>{sceneDurationLabel(duration)}</strong> chacune
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                  Le storyboarder ajustera précisément selon le contenu de ton brief.
                </div>
              </div>
            </div>

            {/* WHAT HAPPENS NEXT */}
            <div className="recap-next">
              <div className="recap-next-ico">✨</div>
              <div>
                <div className="recap-next-t">Ce qui va se passer</div>
                <div className="recap-next-s">
                  Les <strong>5 agents IA</strong> (Director, Scriptwriter, Storyboarder, Music, Visual) vont analyser ton brief <strong>en parallèle</strong>.{' '}
                  <strong>Durée : ~45 secondes.</strong> Cette étape est <strong>gratuite</strong> — elle n&apos;utilise pas tes crédits vidéo (uniquement pour la génération Seedance après).
                </div>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div style={{
            margin: '16px 0', padding: '12px 16px', borderRadius: 8,
            background: 'rgba(220, 38, 38, .08)', color: '#7F1D1D',
            border: '1px solid rgba(220, 38, 38, .3)', fontSize: 13,
          }}>
            ⚠ {submitError}
          </div>
        )}

        {/* ACTIONS */}
        <div className="form-actions">
          <Link href="/dashboard" className="btn btn-g">
            Annuler
          </Link>
          <div className="form-actions-r">
            <button
              type="button"
              className="btn btn-g"
              onClick={() => void saveDraft()}
              disabled={isNew}
              title={isNew ? 'Disponible après le premier enregistrement' : undefined}
              style={isNew ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              Enregistrer en brouillon
            </button>
            <button
              type="submit"
              className="btn btn-p btn-lg"
              disabled={!canSubmit}
              style={!canSubmit ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner" aria-hidden="true"></span>
                  Lancement…
                </>
              ) : (
                'Lancer la production →'
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
