'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useToast } from '@/app/(app)/_components/Toast'

interface Brand {
  id:   string
  name: string
}

interface Asset {
  id:         string
  type:       'logo' | 'image' | 'video' | 'color' | 'font'
  url:        string
  created_at: string
}

const MAX_IMAGES = 9

export default function BrandEditPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { notify } = useToast()

  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [brand, setBrand]       = useState<Brand | null>(null)
  const [name, setName]         = useState('')
  const [assets, setAssets]     = useState<Asset[]>([])
  const [savingName, setSavingName] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const logoInputRef  = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/brands/${params.id}`, { cache: 'no-store' })
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true)
          return
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        setBrand(d.brand)
        setName(d.brand.name)
        setAssets(Array.isArray(d.assets) ? d.assets : [])
      })
      .catch((e) => notify(`Erreur : ${(e as Error).message}`, 'warn'))
      .finally(() => setLoading(false))
  }, [params.id, notify])

  async function saveName() {
    const trimmed = name.trim()
    if (!trimmed || !brand || trimmed === brand.name) return
    setSavingName(true)
    try {
      const res = await fetch(`/api/brands/${brand.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: trimmed }),
      })
      const d = await res.json()
      if (!res.ok || !d.brand) {
        notify(d.error || `HTTP ${res.status}`, 'warn')
        return
      }
      setBrand({ ...brand, name: d.brand.name })
      notify('Nom mis à jour', 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
    } finally {
      setSavingName(false)
    }
  }

  async function uploadAsset(file: File, type: 'logo' | 'image') {
    if (!brand) return
    const setBusy = type === 'logo' ? setUploadingLogo : setUploadingImage
    setBusy(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', type)
      const res = await fetch(`/api/brands/${brand.id}/assets`, {
        method: 'POST',
        body:   fd,
      })
      const d = await res.json()
      if (!res.ok || !d.asset) {
        notify(d.error || `HTTP ${res.status}`, 'warn')
        return
      }
      setAssets((prev) => {
        // Si c'est un logo, on remplace l'ancien
        const filtered = type === 'logo' ? prev.filter((a) => a.type !== 'logo') : prev
        return [...filtered, d.asset]
      })
      notify(`${type === 'logo' ? 'Logo' : 'Image'} uploadé(e)`, 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
    } finally {
      setBusy(false)
    }
  }

  async function deleteAsset(asset: Asset) {
    if (!brand) return
    if (!confirm('Supprimer cet asset ?')) return
    try {
      const res = await fetch(`/api/brands/${brand.id}/assets/${asset.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        notify(d.error || `HTTP ${res.status}`, 'warn')
        return
      }
      setAssets((prev) => prev.filter((a) => a.id !== asset.id))
      notify('Asset supprimé', 'success')
    } catch (e) {
      notify((e as Error).message, 'warn')
    }
  }

  async function deleteBrand() {
    if (!brand) return
    if (!confirm(`Supprimer définitivement la marque « ${brand.name} » et tous ses assets ?`)) return
    try {
      const res = await fetch(`/api/brands/${brand.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        notify(d.error || `HTTP ${res.status}`, 'warn')
        return
      }
      notify('Marque supprimée', 'success')
      router.push('/dashboard/brands')
    } catch (e) {
      notify((e as Error).message, 'warn')
    }
  }

  if (loading) {
    return <p className="app-h1-sub" style={{ padding: 24 }}>Chargement…</p>
  }

  if (notFound || !brand) {
    return (
      <div style={{ padding: 24 }}>
        <h1 className="app-h1">Marque introuvable</h1>
        <Link href="/dashboard/brands" className="btn btn-p" style={{ marginTop: 16, display: 'inline-block' }}>
          ← Retour aux marques
        </Link>
      </div>
    )
  }

  const logo   = assets.find((a) => a.type === 'logo')
  const images = assets.filter((a) => a.type === 'image')

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Link href="/dashboard/brands" className="app-crumb" style={{ textDecoration: 'none' }}>
          ← Marques
        </Link>
      </div>
      <h1 className="app-h1">{brand.name}</h1>
      <p className="app-h1-sub">
        Le logo et les images de référence sont passés à Seedance pour produire des vidéos cohérentes avec ton univers visuel (reference-to-video).
      </p>

      {/* NOM */}
      <div className="form-card">
        <div className="form-section-t">Identité</div>
        <h2 className="form-section-h">Nom de la marque</h2>
        <div className="form-field" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            style={{ flex: 1 }}
          />
          <button
            type="button" className="btn btn-p"
            onClick={() => void saveName()}
            disabled={savingName || !name.trim() || name.trim() === brand.name}
          >
            {savingName ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* LOGO */}
      <div className="form-card">
        <div className="form-section-t">Logo</div>
        <h2 className="form-section-h">Logo de la marque</h2>
        <p className="form-section-s">JPEG, PNG, WebP, BMP, TIFF, GIF, HEIC ou HEIF. Max 10 MB. Un seul logo par marque — il remplace l&apos;ancien.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {logo ? (
            <div style={{
              width: 160, height: 160, borderRadius: 12,
              background: '#1a1a2e', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              padding: 16, border: '1px solid #2d2d4e',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{
              width: 160, height: 160, borderRadius: 12,
              background: '#1a1a2e', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#6B7280', fontSize: 12, border: '1px dashed #374151',
            }}>
              Pas de logo
            </div>
          )}

          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif,image/heic,image/heif"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void uploadAsset(f, 'logo')
                e.target.value = ''
              }}
            />
            <button
              type="button" className="btn btn-p"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? 'Upload en cours…' : (logo ? 'Remplacer le logo' : '+ Uploader un logo')}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => deleteAsset(logo)}
                style={{
                  marginLeft: 8, padding: '8px 14px', borderRadius: 6,
                  background: 'transparent', border: '1px solid var(--line)',
                  color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
                }}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* IMAGES DE RÉFÉRENCE */}
      <div className="form-card">
        <div className="form-section-t">Références visuelles</div>
        <h2 className="form-section-h">Images de mood & style</h2>
        <p className="form-section-s">
          Jusqu&apos;à {MAX_IMAGES} images (mood board, palette, références de cadrage, ambiance lumière…).
          Seedance les utilise comme références pour générer des scènes visuellement cohérentes avec ton univers.
        </p>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif,image/heic,image/heif"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && images.length < MAX_IMAGES) void uploadAsset(f, 'image')
            e.target.value = ''
          }}
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12, marginTop: 16,
        }}>
          {images.map((img) => (
            <div key={img.id} style={{
              position: 'relative', aspectRatio: '1/1', borderRadius: 8,
              overflow: 'hidden', background: '#1a1a2e', border: '1px solid #2d2d4e',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => deleteAsset(img)}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 24, height: 24, borderRadius: 12,
                  background: 'rgba(0,0,0,.7)', color: '#fff',
                  border: 'none', cursor: 'pointer', fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Supprimer l'image"
              >
                ×
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              style={{
                aspectRatio: '1/1', borderRadius: 8,
                border: '1px dashed #374151', background: 'transparent',
                color: '#9CA3AF', fontSize: 14, cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 24 }}>+</span>
              {uploadingImage ? 'Upload…' : 'Ajouter'}
            </button>
          )}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
          {images.length} / {MAX_IMAGES} images
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="form-card" style={{ borderColor: 'rgba(220,38,38,.3)' }}>
        <div className="form-section-t" style={{ color: '#DC2626' }}>Zone sensible</div>
        <h2 className="form-section-h">Supprimer la marque</h2>
        <p className="form-section-s">
          Action irréversible : tous les assets (logo, images) seront supprimés. Les projets utilisant cette marque resteront mais sans la référence.
        </p>
        <button
          type="button"
          onClick={deleteBrand}
          style={{
            padding: '10px 18px', borderRadius: 8,
            background: '#DC2626', color: '#fff', border: 'none',
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          Supprimer définitivement
        </button>
      </div>
    </>
  )
}
