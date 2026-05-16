'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  id:           string
  name:         string
  brief:        string
  status:       'brief' | 'production' | 'generation' | 'export' | 'archived'
  format:       string
  duration_sec: number
  tone:         string
  brand_id:     string | null
  created_at:   string
  updated_at:   string
}

const STATUS_LABELS: Record<Project['status'], string> = {
  brief:      'Brief',
  production: 'En production',
  generation: 'Génération',
  export:     'Terminé',
  archived:   'Archivé',
}

type FilterKey = 'all' | 'active' | 'done'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',    label: 'Tous'      },
  { key: 'active', label: 'En cours'  },
  { key: 'done',   label: 'Terminés'  },
]

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

export default function DashboardPage() {
  const [filter, setFilter]     = useState<FilterKey>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/projects', { cache: 'no-store' })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        setProjects(Array.isArray(data.projects) ? data.projects : [])
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filtered = projects.filter((p) => {
    if (filter === 'all')    return true
    if (filter === 'active') return p.status !== 'export' && p.status !== 'archived'
    if (filter === 'done')   return p.status === 'export'
    return true
  })

  const counts = {
    all:    projects.length,
    active: projects.filter((p) => p.status !== 'export' && p.status !== 'archived').length,
    done:   projects.filter((p) => p.status === 'export').length,
  }

  if (loading) {
    return (
      <>
        <h1 className="app-h1">Mes projets</h1>
        <p className="app-h1-sub">Chargement…</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <h1 className="app-h1">Mes projets</h1>
        <p className="app-h1-sub" style={{ color: '#DC2626' }}>
          ⚠ Impossible de charger tes projets : {error}
        </p>
      </>
    )
  }

  return (
    <>
      <h1 className="app-h1">Mes projets</h1>
      <p className="app-h1-sub">
        {projects.length === 0
          ? 'Démarre ton premier projet vidéo.'
          : `${projects.length} projet${projects.length > 1 ? 's' : ''} — du brief à l'export.`}
      </p>

      <div className="app-toolbar">
        <div className="app-tabs" role="tablist" aria-label="Filtrer les projets">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              className={`app-tab ${filter === f.key ? 'active' : ''}`}
              type="button"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="tab-count tabular">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <Link href="/project/new/brief" className="btn btn-p">
          + Nouveau projet
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="proj-empty">
          <div className="proj-empty-ico" aria-hidden="true">
            {filter === 'done' ? '🎉' : filter === 'active' ? '🎬' : '📁'}
          </div>
          <div className="proj-empty-t">
            {filter === 'all'    && 'Aucun projet pour l\'instant'}
            {filter === 'active' && 'Aucun projet en cours'}
            {filter === 'done'   && 'Aucun projet terminé pour l\'instant'}
          </div>
          <p className="proj-empty-s">
            {filter === 'all' && 'Décris ta vidéo en quelques phrases — les 5 agents IA prennent le relais et te livrent un dossier de production complet.'}
            {filter === 'active' && 'Tous tes projets sont terminés. Démarres-en un nouveau ou consulte tes projets archivés.'}
            {filter === 'done' && 'Termine un projet jusqu\'à l\'export pour qu\'il apparaisse ici.'}
          </p>
          {filter === 'all' ? (
            <Link href="/project/new/brief" className="btn btn-p btn-lg">
              Créer mon premier projet →
            </Link>
          ) : (
            <button type="button" className="btn btn-g" onClick={() => setFilter('all')}>
              Voir tous les projets
            </button>
          )}
        </div>
      ) : (
        <div className="proj-grid">
          {filtered.map((p) => {
            const resumeHref =
              p.status === 'brief'      ? `/project/${p.id}/brief`
              : p.status === 'production' ? `/project/${p.id}/production`
              : p.status === 'generation' ? `/project/${p.id}/generate`
              :                              `/project/${p.id}/export`
            return (
              <Link key={p.id} href={resumeHref} className="proj-card">
                <div className="proj-head">
                  <div className="proj-title">{p.name || '(sans titre)'}</div>
                  <div className={`proj-status ${p.status}`}>
                    {STATUS_LABELS[p.status]}
                  </div>
                </div>
                <p className="proj-brief">{p.brief || <em style={{ color: 'var(--muted)' }}>Pas encore de brief</em>}</p>
                <div className="proj-meta">
                  <span className="proj-meta-i">
                    <span className="proj-meta-l">{p.format}</span>
                  </span>
                  <span className="proj-meta-i">
                    <span className="proj-meta-l tabular">{p.duration_sec}s</span>
                  </span>
                  <span className="proj-meta-i">
                    <span className="proj-meta-l">{p.tone}</span>
                  </span>
                  <span className="proj-meta-i" style={{ marginLeft: 'auto' }}>
                    {timeAgo(p.updated_at)}
                  </span>
                </div>
              </Link>
            )
          })}

          {filter !== 'done' && (
            <Link href="/project/new/brief" className="proj-new">
              <div className="proj-new-ico" aria-hidden="true">+</div>
              <div className="proj-new-t">Nouveau projet</div>
              <div className="proj-new-s">Démarre depuis un brief</div>
            </Link>
          )}
        </div>
      )}
    </>
  )
}
