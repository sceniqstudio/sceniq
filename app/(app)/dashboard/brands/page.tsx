'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/(app)/_components/Toast'

interface Brand {
  id:         string
  name:       string
  created_at: string
  updated_at: string
}

export default function BrandsListPage() {
  const router = useRouter()
  const { notify } = useToast()
  const [brands, setBrands]     = useState<Brand[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/brands', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : { brands: [] })
      .then(d => setBrands(Array.isArray(d.brands) ? d.brands : []))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [])

  async function createBrand() {
    const trimmed = newName.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/brands', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok || !data.brand) {
        notify(data.error || `HTTP ${res.status}`, 'warn')
        return
      }
      notify(`Marque « ${data.brand.name} » créée`, 'success')
      router.push(`/dashboard/brands/${data.brand.id}`)
    } catch (e) {
      notify((e as Error).message, 'warn')
    } finally {
      setSaving(false)
    }
  }

  async function deleteBrand(id: string, name: string) {
    if (!confirm(`Supprimer la marque « ${name} » et tous ses assets ?`)) return
    try {
      const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        notify(data.error || `HTTP ${res.status}`, 'warn')
        return
      }
      setBrands((prev) => prev.filter((b) => b.id !== id))
      notify(`Marque « ${name} » supprimée`, 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
    }
  }

  if (loading) {
    return (
      <>
        <h1 className="app-h1">Mes marques</h1>
        <p className="app-h1-sub">Chargement…</p>
      </>
    )
  }

  return (
    <>
      <h1 className="app-h1">Mes marques</h1>
      <p className="app-h1-sub">
        Les marques que tu enregistres ici sont disponibles dans les briefs. Tu peux uploader leur logo et des images de référence — elles seront passées à Seedance pour produire des vidéos cohérentes scène à scène.
      </p>

      {error && (
        <div style={{
          margin: '16px 0', padding: '12px 16px', borderRadius: 8,
          background: 'rgba(220,38,38,.08)', color: '#7F1D1D',
          border: '1px solid rgba(220,38,38,.3)', fontSize: 13,
        }}>⚠ {error}</div>
      )}

      <div className="app-toolbar">
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>
            {brands.length} marque{brands.length > 1 ? 's' : ''}
          </span>
        </div>
        {!creating ? (
          <button type="button" className="btn btn-p" onClick={() => setCreating(true)}>
            + Nouvelle marque
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              autoFocus
              type="text"
              className="form-input"
              placeholder="Nom de la marque"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); void createBrand() }
                if (e.key === 'Escape') { setCreating(false); setNewName('') }
              }}
              maxLength={80}
              disabled={saving}
              style={{ minWidth: 260 }}
            />
            <button
              type="button" className="btn btn-p"
              onClick={() => void createBrand()}
              disabled={!newName.trim() || saving}
            >
              {saving ? 'Création…' : 'Créer'}
            </button>
            <button
              type="button" className="btn btn-g"
              onClick={() => { setCreating(false); setNewName('') }}
              disabled={saving}
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {brands.length === 0 ? (
        <div className="proj-empty">
          <div className="proj-empty-ico">🏷️</div>
          <div className="proj-empty-t">Aucune marque enregistrée</div>
          <p className="proj-empty-s">
            Crée une marque pour associer un logo et des images de référence. Les vidéos générées seront cohérentes avec ton univers visuel.
          </p>
          {!creating && (
            <button type="button" className="btn btn-p btn-lg" onClick={() => setCreating(true)}>
              + Créer ma première marque
            </button>
          )}
        </div>
      ) : (
        <div className="proj-grid">
          {brands.map((b) => (
            <div key={b.id} className="proj-card" style={{ cursor: 'default' }}>
              <div className="proj-head">
                <div className="proj-title">{b.name}</div>
              </div>
              <div className="proj-meta">
                <span className="proj-meta-i">
                  <span className="proj-meta-l">Mis à jour {timeAgo(b.updated_at)}</span>
                </span>
                <span className="proj-meta-i" style={{ marginLeft: 'auto', gap: 8, display: 'flex' }}>
                  <Link href={`/dashboard/brands/${b.id}`} className="btn btn-p" style={{ fontSize: 12, padding: '4px 12px' }}>
                    Modifier
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteBrand(b.id, b.name)}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid var(--line)', background: 'transparent',
                      color: 'var(--muted)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Suppr.
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)   return 'à l\'instant'
  if (min < 60)  return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)    return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1)   return 'hier'
  if (d < 7)     return `il y a ${d} jours`
  return `il y a ${Math.floor(d / 7)} sem.`
}
