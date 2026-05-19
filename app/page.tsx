'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { ShowcaseClip } from '@/app/_components/ShowcaseClip'

const SHOWCASE_SLUGS = [
  'exemple1', 'exemple2', 'exemple3', 'exemple4', 'exemple5', 'exemple6',
  'exemple7', 'exemple8', 'exemple9', 'exemple10', 'exemple11', 'exemple12',
  'exemple13', 'exemple14', 'exemple15', 'exemple16', 'exemple17',
  'exemple18', 'exemple19',
] as const

// ── Portfolio — placeholders multi-format ───────────────────────────────────
type PortfolioItem = { id: string; ratio: number; label: string; grad: string }

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  { id: 'p01', ratio: 16/9, label: '16:9', grad: 'linear-gradient(135deg,#0f0c29,#302b63)' },
  { id: 'p02', ratio: 9/16, label: '9:16', grad: 'linear-gradient(135deg,#0a1628,#1a0a3c)' },
  { id: 'p03', ratio: 1,    label: '1:1',  grad: 'linear-gradient(135deg,#0c1a0f,#0f2a18)' },
  { id: 'p04', ratio: 4/3,  label: '4:3',  grad: 'linear-gradient(135deg,#1a0c10,#3c1018)' },
  { id: 'p05', ratio: 9/16, label: '9:16', grad: 'linear-gradient(135deg,#0c1520,#0a2035)' },
  { id: 'p06', ratio: 16/9, label: '16:9', grad: 'linear-gradient(135deg,#0d0f1f,#1a1f3c)' },
  { id: 'p07', ratio: 3/4,  label: '3:4',  grad: 'linear-gradient(135deg,#1f0a28,#300a40)' },
  { id: 'p08', ratio: 1,    label: '1:1',  grad: 'linear-gradient(135deg,#0a1a1f,#0a2a30)' },
  { id: 'p09', ratio: 16/9, label: '16:9', grad: 'linear-gradient(135deg,#200a14,#3c0a1e)' },
  { id: 'p10', ratio: 9/16, label: '9:16', grad: 'linear-gradient(135deg,#141f0a,#243010)' },
  { id: 'p11', ratio: 4/3,  label: '4:3',  grad: 'linear-gradient(135deg,#0f1e20,#1a2e30)' },
  { id: 'p12', ratio: 1,    label: '1:1',  grad: 'linear-gradient(135deg,#200f1a,#301520)' },
  { id: 'p13', ratio: 9/16, label: '9:16', grad: 'linear-gradient(135deg,#0a1428,#0a2040)' },
  { id: 'p14', ratio: 16/9, label: '16:9', grad: 'linear-gradient(135deg,#1a1428,#2a1840)' },
  { id: 'p15', ratio: 3/4,  label: '3:4',  grad: 'linear-gradient(135deg,#0a200a,#143014)' },
  { id: 'p16', ratio: 1,    label: '1:1',  grad: 'linear-gradient(135deg,#200a0a,#301414)' },
]

// ── PortfolioRow — infinite scroll + drag souris/touch ─────────────────────
function PortfolioRow({
  items, direction, rowHeight = 190, gap = 12, speed = 0.45,
}: {
  items: PortfolioItem[]; direction: 'left' | 'right'
  rowHeight?: number; gap?: number; speed?: number
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const posRef   = useRef(0)
  const animRef  = useRef<number>()
  const drag     = useRef({ active: false, startX: 0, startPos: 0 })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const getTotal = () => track.scrollWidth / 2
    const mod = (n: number, m: number) => ((n % m) + m) % m

    const tick = () => {
      if (!drag.current.active) {
        const total = getTotal()
        if (total > 0) {
          posRef.current = mod(
            posRef.current + (direction === 'left' ? speed : -speed),
            total
          )
          track.style.transform = `translateX(${-posRef.current}px)`
        }
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)

    const startDrag = (x: number) => {
      drag.current = { active: true, startX: x, startPos: posRef.current }
    }
    const moveDrag = (x: number) => {
      if (!drag.current.active) return
      const total = getTotal()
      posRef.current = mod(drag.current.startPos + (drag.current.startX - x), total)
      track.style.transform = `translateX(${-posRef.current}px)`
    }
    const endDrag = () => { drag.current.active = false }

    const onMouseDown  = (e: MouseEvent)  => { startDrag(e.clientX); track.style.cursor = 'grabbing' }
    const onMouseMove  = (e: MouseEvent)  => moveDrag(e.clientX)
    const onMouseUp    = ()               => { endDrag(); track.style.cursor = 'grab' }
    const onTouchStart = (e: TouchEvent)  => startDrag(e.touches[0].clientX)
    const onTouchMove  = (e: TouchEvent)  => moveDrag(e.touches[0].clientX)
    const onTouchEnd   = ()               => endDrag()

    track.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    track.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      track.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      track.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [direction, speed])

  const doubled = [...items, ...items]

  return (
    <div style={{ overflow: 'hidden', cursor: 'grab' }}>
      <div
        ref={trackRef}
        style={{ display: 'flex', alignItems: 'flex-start', gap, width: 'max-content', willChange: 'transform', userSelect: 'none' }}
      >
        {doubled.map((item, i) => {
          const w = Math.round(rowHeight * item.ratio)
          return (
            <div key={`${item.id}-${i}`} style={{
              width: w, height: rowHeight, flexShrink: 0, borderRadius: 10,
              background: item.grad, border: '1px solid rgba(124,92,252,0.12)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
                {item.label}
              </span>
              <div style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, borderRadius: '50%', background: 'rgba(124,92,252,0.35)' }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Hero animated columns — 3 left + empty center + 2 right ───────────────
// 5 columns: index 0,1,2 → left side  |  index 3,4 → right side
const COL_DURATIONS = [32, 26, 38, 24, 28]
const COL_DELAYS    = [-6, -14, -2, -18, -8]
const COL_SLUGS     = Array.from({ length: 5 }, (_, c) =>
  Array.from({ length: 4 }, (_, i) => SHOWCASE_SLUGS[(c * 4 + i) % SHOWCASE_SLUGS.length])
)

export default function HomePage() {
  const [openVideo, setOpenVideo]           = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [questionOpen, setQuestionOpen]     = useState(false)
  const [questionSent, setQuestionSent]     = useState(false)
  const [qForm, setQForm]                   = useState({ name: '', email: '', message: '' })
  const [portfolioRows, setPortfolioRows]   = useState<[PortfolioItem[], PortfolioItem[]]>([
    PORTFOLIO_ITEMS.slice(0, 8), PORTFOLIO_ITEMS.slice(8),
  ])

  // ── Question form handler ────────────────────────────────────────────────
  const handleQuestionSubmit = (e: FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Question ScenIQ — ${qForm.name}`)
    const body = encodeURIComponent(
      `Prénom : ${qForm.name}\nEmail : ${qForm.email}\n\nQuestion :\n${qForm.message}`
    )
    window.open(`mailto:support@sceniq.studio?subject=${subject}&body=${body}`, '_blank')
    setQuestionSent(true)
  }

  // ── ESC + body scroll lock ──────────────────────────────────────────────
  useEffect(() => {
    if (!openVideo && !mobileMenuOpen && !questionOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenVideo(null)
        setMobileMenuOpen(false)
        setQuestionOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openVideo, mobileMenuOpen, questionOpen])

  // ── Nav scroll state ────────────────────────────────────────────────────
  useEffect(() => {
    const nav = document.querySelector('.lv2-nav')
    const onScroll = () => {
      if (!nav) return
      if (window.scrollY > 50) nav.classList.add('scrolled')
      else nav.classList.remove('scrolled')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      nav?.classList.remove('scrolled')
    }
  }, [])

  // ── Scroll reveal + FAQ + Carousel + Smooth anchors ─────────────────────
  useEffect(() => {
    // Reveal on scroll
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('on')
          ;[...e.target.querySelectorAll('.step,.ag,.plan,.fi,.vc,.lv2-process-step,.lv2-testimonial')].forEach((c, i) => {
            const el = c as HTMLElement
            el.style.cssText += `;opacity:0;transform:translateY(14px)`
            setTimeout(() => {
              el.style.cssText += `;transition:opacity .4s ease,transform .4s ease;opacity:1;transform:translateY(0)`
            }, i * 65)
          })
        })
      },
      { threshold: 0.08 }
    )
    document.querySelectorAll('.rv').forEach((el) => obs.observe(el))

    // FAQ accordion — handles both old .fq/.fi and new layout
    const fqHandlers: Array<{ btn: Element; handler: () => void }> = []
    document.querySelectorAll('.fq').forEach((b) => {
      const handler = () => {
        const fi = b.closest('.fi')
        if (!fi) return
        const open = fi.classList.contains('open')
        document.querySelectorAll('.fi').forEach((f) => f.classList.remove('open'))
        if (!open) fi.classList.add('open')
      }
      b.addEventListener('click', handler)
      fqHandlers.push({ btn: b, handler })
    })

    // Shuffle portfolio rows on mount
    const shuffled = [...PORTFOLIO_ITEMS].sort(() => Math.random() - 0.5)
    const mid = Math.ceil(shuffled.length / 2)
    setPortfolioRows([shuffled.slice(0, mid), shuffled.slice(mid)])

    // Smooth scroll anchors
    const anchorHandlers: Array<{ a: Element; handler: (e: Event) => void }> = []
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const handler = (e: Event) => {
        const href = a.getAttribute('href')
        if (!href || href === '#') return
        const t = document.querySelector(href)
        if (t) { e.preventDefault(); (t as HTMLElement).scrollIntoView({ behavior: 'smooth' }) }
      }
      a.addEventListener('click', handler)
      anchorHandlers.push({ a, handler })
    })

    return () => {
      obs.disconnect()
      fqHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler))
      anchorHandlers.forEach(({ a, handler }) => a.removeEventListener('click', handler))
    }
  }, [])

  // ════════════════════════════════════════════════════════════════════════
  //  JSX
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="lv2">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="lv2-nav" aria-label="Navigation principale">
        <div className="lv2-nav-inner">
          <a href="#" className="lv2-nav-logo" aria-label="ScenIQ — Accueil">
            <img
              src="/sceniq-logo-dark.svg"
              alt="ScenIQ"
              style={{ height: 44, width: 'auto', display: 'block' }}
            />
          </a>
          <ul className="lv2-nav-links">
            <li><a href="#process">Comment ça marche</a></li>
            <li><a href="#qualite">Qualité</a></li>
            <li><a href="#modeles">Modèles IA</a></li>
            <li><a href="#tarifs">Tarifs</a></li>
            <li><a href="#reels">Exemples</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div className="lv2-nav-right">
            <a href="mailto:support@sceniq.studio" className="lv2-btn lv2-btn-ghost lv2-btn-sm">
              Une question ?
            </a>
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-sm">
              Commander →
            </a>
          </div>
          <button
            className={`lv2-burger${mobileMenuOpen ? ' open' : ''}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ──────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lv2-mob-wrap" role="dialog" aria-modal="true" aria-label="Menu navigation">
          <div className="lv2-mob-bd" onClick={() => setMobileMenuOpen(false)} />
          <div className="lv2-mob-panel">
            <div className="lv2-mob-header">
              <img src="/sceniq-logo-dark.svg" alt="ScenIQ" style={{ height: 36, width: 'auto' }} />
              <button className="lv2-mob-close" onClick={() => setMobileMenuOpen(false)} aria-label="Fermer">×</button>
            </div>
            <ul className="lv2-mob-links">
              <li><a href="#process"  onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a></li>
              <li><a href="#qualite"  onClick={() => setMobileMenuOpen(false)}>Qualité</a></li>
              <li><a href="#modeles"  onClick={() => setMobileMenuOpen(false)}>Modèles IA</a></li>
              <li><a href="#tarifs"   onClick={() => setMobileMenuOpen(false)}>Tarifs</a></li>
              <li><a href="#reels"    onClick={() => setMobileMenuOpen(false)}>Exemples</a></li>
              <li><a href="#faq"      onClick={() => setMobileMenuOpen(false)}>FAQ</a></li>
            </ul>
            <div className="lv2-mob-cta">
              <a
                href="/commande"
                className="lv2-btn lv2-btn-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Commander ma vidéo →
              </a>
              <a
                href="mailto:support@sceniq.studio"
                className="lv2-btn lv2-btn-ghost"
                onClick={() => setMobileMenuOpen(false)}
                style={{ justifyContent: 'center' }}
              >
                Une question ?
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO — 3 cols gauche · centre vide · 2 cols droite ──────────── */}
      <section className="lv2-hero" id="main-content" aria-label="Hero ScenIQ">
        <div className="lv2-hbg" aria-hidden="true">

          {/* ── 3 colonnes gauche ── */}
          <div className="lv2-hbg-side lv2-hbg-left">
            {[0, 1, 2].map((c) => (
              <div
                key={c}
                className={`lv2-hcol${c % 2 === 1 ? ' down' : ''}`}
                style={{
                  animationDuration: `${COL_DURATIONS[c]}s`,
                  animationDelay:    `${COL_DELAYS[c]}s`,
                }}
              >
                {[...COL_SLUGS[c], ...COL_SLUGS[c]].map((slug, i) => (
                  <div key={`${slug}-${c}-${i}`} className="lv2-hcard">
                    <video autoPlay muted loop playsInline preload="none" poster={`/showcase/${slug}.jpg`}>
                      <source src={`/showcase/${slug}.mp4`} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Centre vide — lisibilité du texte ── */}
          <div className="lv2-hbg-center" />

          {/* ── 2 colonnes droite ── */}
          <div className="lv2-hbg-side lv2-hbg-right">
            {[3, 4].map((c) => (
              <div
                key={c}
                className={`lv2-hcol${c % 2 === 1 ? ' down' : ''}`}
                style={{
                  animationDuration: `${COL_DURATIONS[c]}s`,
                  animationDelay:    `${COL_DELAYS[c]}s`,
                }}
              >
                {[...COL_SLUGS[c], ...COL_SLUGS[c]].map((slug, i) => (
                  <div key={`${slug}-${c}-${i}`} className="lv2-hcard">
                    <video autoPlay muted loop playsInline preload="none" poster={`/showcase/${slug}.jpg`}>
                      <source src={`/showcase/${slug}.mp4`} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            ))}
          </div>

        </div>
        <div className="lv2-hover" aria-hidden="true" />
        <div className="lv2-hcontent">
          <div className="lv2-badge">
            <span className="lv2-badge-pill">Agence IA</span>
            Publicités vidéo — du brief au MP4 en 48h
          </div>
          <h1 className="lv2-h1">
            Du brief à l&apos;écran.<br />
            <em>48 heures.</em>
          </h1>
          <p className="lv2-sub">
            Cinq agents IA forment une équipe créa complète. Vous écrivez le brief, ils livrent la pré-prod — script, storyboard, musique, visuels — sans réunion intermédiaire.
          </p>
          <div className="lv2-ctas">
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-lg">
              Commander ma vidéo →
            </a>
            <a href="#reels" className="lv2-btn lv2-btn-ghost lv2-btn-lg">
              Voir les exemples
            </a>
          </div>
          <p className="lv2-footnote">À partir de 69 € HT · 5 à 15 secondes · 10 itérations incluses</p>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────── */}
      <div className="lv2-trust">
        <div className="lv2-trust-inner">
          <span className="lv2-trust-lbl">Utilisé par</span>
          <div className="lv2-trust-items">
            <span className="lv2-trust-item">Agences pub</span>
            <span className="lv2-trust-item">Startups</span>
            <span className="lv2-trust-item">E-commerce</span>
            <span className="lv2-trust-item">Directeurs créatifs</span>
            <span className="lv2-trust-item">Brand managers</span>
          </div>
        </div>
      </div>

      {/* ── PROCESS — 5 étapes ───────────────────────────────────────────── */}
      <section className="lv2-s" id="process">
        <div className="lv2-si">
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">Processus</div>
            <h2>Du brief au MP4.<br />Cinq étapes.</h2>
            <p className="lv2-s-sub" style={{ maxWidth: 480, margin: '16px auto 0' }}>
              Vous écrivez deux lignes et vous payez. ScenIQ fait le reste — sans réunion, sans aller-retour interminable.
            </p>
          </div>
          <div className="lv2-process-grid rv">
            {[
              { n: '1', title: 'Brief', desc: 'Deux lignes sur votre marque et votre objectif. Ajoutez des références visuelles ou audio si vous en avez.' },
              { n: '2', title: 'Commande', desc: 'Choisissez la durée. Paiement 100 % sécurisé par Stripe. Confirmation par email immédiate.' },
              { n: '3', title: 'Appel', desc: 'Pascal vous rappelle sous 4h ouvrées pour aligner la direction créative avant de lancer les agents.' },
              { n: '4', title: 'Pré-prod', desc: 'Director, Scriptwriter, Storyboarder, Music et Visual travaillent en parallèle. Pré-prod livrée sans intermédiaire.' },
              { n: '5', title: 'Livraison', desc: 'MP4 1080p envoyé par e-mail sous 48h. Pas d\'espace client, pas de compte. 10 itérations incluses.' },
            ].map((step) => (
              <div key={step.n} className="lv2-process-step">
                <div className="lv2-process-num">{step.n}</div>
                <div className="lv2-process-title">{step.title}</div>
                <div className="lv2-process-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUALITÉ — 2 splits ───────────────────────────────────────────── */}
      <section
        className="lv2-s alt"
        id="qualite"
        style={{ background: 'linear-gradient(180deg, var(--bg) 0%, rgba(124,92,252,0.03) 50%, var(--bg) 100%)' }}
      >
        <div className="lv2-si">

          {/* Split 1 : agents IA */}
          <div className="lv2-split rv" style={{ marginBottom: 96 }}>
            <div>
              <div className="lv2-label">Intelligence artificielle</div>
              <h2>Cinq agents IA.<br />Une pré-prod complète.</h2>
              <p className="lv2-s-sub" style={{ marginTop: 16 }}>
                Chaque agent est spécialisé. Ensemble, ils couvrent tout ce qu&apos;une équipe créa fait habituellement en plusieurs jours de réunions — sans que vous n&apos;ouvriez aucune interface.
              </p>
              <ul className="lv2-feat-list">
                {[
                  { name: 'Director', desc: 'direction créative, axe publicitaire, prise de position défendable' },
                  { name: 'Scriptwriter', desc: 'script calibré à 2,2 mots/sec, voix-off structurée' },
                  { name: 'Storyboarder', desc: 'découpage shot par shot, prompts multi-shot pour Seedance' },
                  { name: 'Music', desc: 'direction musicale avec BPM précis et références licenciables réelles' },
                  { name: 'Visual', desc: 'palette hex, typographie, ambiance lumière — spec exécutable directement' },
                ].map((item) => (
                  <li key={item.name} className="lv2-feat-item">
                    <span className="lv2-feat-check">
                      <svg viewBox="0 0 12 12" fill="none" stroke="#7C5CFC" strokeWidth="2" width="10" height="10">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    </span>
                    <span>
                      <strong style={{ color: '#fff' }}>{item.name}</strong>
                      {' '}— {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="lv2-placeholder" aria-hidden="true">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Vue pré-prod agents — à venir
                </span>
              </div>
            </div>
          </div>

          {/* Split 2 : génération vidéo */}
          <div className="lv2-split lv2-split-reverse rv">
            <div>
              <div className="lv2-label">Seedance 2.0 by ByteDance</div>
              <h2>Génération vidéo.<br />Un prompt. Un clip livré.</h2>
              <p className="lv2-s-sub" style={{ marginTop: 16 }}>
                Le Storyboarder produit un prompt multi-shot unifié. Un seul appel Seedance 2.0 génère la vidéo déjà montée — cohérence visuelle garantie entre chaque plan, sans post-prod ni assemblage manuel.
              </p>
              <ul className="lv2-feat-list">
                {[
                  'Résolution 1080p native — qualité broadcast, pas du 720p upscalé',
                  'Audio natif intégré — ambiance sonore et voix off générées dans le même rendu',
                  'Multi-shot en un seul appel — 2 à 4 plans selon la durée, déjà montés',
                  'Formats 9:16, 1:1 et 16:9 inclus — prêts pour Meta Ads, TikTok et YouTube',
                ].map((desc) => (
                  <li key={desc} className="lv2-feat-item">
                    <span className="lv2-feat-check">
                      <svg viewBox="0 0 12 12" fill="none" stroke="#7C5CFC" strokeWidth="2" width="10" height="10">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    </span>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Composition vidéo : 16:9 + 9:16 superposés */}
            <div style={{ position: 'relative', paddingBottom: '38%' }}>

              {/* ── Carte 16:9 ── */}
              <button
                type="button"
                onClick={() => setOpenVideo('exemple19')}
                style={{
                  display: 'block', width: '100%',
                  aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden',
                  background: 'var(--surface)', border: '1px solid var(--bdr-md)',
                  position: 'relative', cursor: 'pointer', padding: 0,
                }}
                aria-label="Lire exemple 16:9 en grand format"
              >
                <video
                  autoPlay muted loop playsInline preload="none"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                >
                  <source src="/showcase/exemple19.mp4" type="video/mp4" />
                </video>
                {/* Label format */}
                <div style={{
                  position: 'absolute', top: 10, left: 12,
                  padding: '3px 8px', borderRadius: 5,
                  background: 'rgba(7,7,15,0.78)', border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.55)',
                }}>16:9</div>
                {/* Play hint */}
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  className="play-overlay"
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(124,92,252,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 16 16" fill="white" width="16" height="16"><polygon points="4,2 14,8 4,14"/></svg>
                  </div>
                </div>
              </button>

              {/* ── Carte 9:16 — flottante en bas à droite ── */}
              <button
                type="button"
                onClick={() => setOpenVideo('exemple18')}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: '36%', aspectRatio: '9/16',
                  borderRadius: 14, overflow: 'hidden',
                  background: 'var(--surface)',
                  border: '1px solid rgba(124,92,252,0.4)',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,92,252,0.1)',
                  cursor: 'pointer', padding: 0,
                }}
                aria-label="Lire exemple 9:16 en grand format"
              >
                <video
                  autoPlay muted loop playsInline preload="none"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                >
                  <source src="/showcase/exemple18.mp4" type="video/mp4" />
                </video>
                {/* Label format */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  padding: '3px 8px', borderRadius: 5,
                  background: 'rgba(7,7,15,0.78)', border: '1px solid rgba(124,92,252,0.3)',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(165,180,252,0.7)',
                }}>9:16</div>
              </button>

              {/* ── Note bas ── */}
              <p style={{
                position: 'absolute', bottom: -28, left: 0,
                fontSize: 11, color: 'var(--g6)', letterSpacing: '0.04em',
                margin: 0,
              }}>
                Clips générés via Seedance 2.0 depuis un brief de 2 lignes
              </p>

            </div>
          </div>

        </div>
      </section>

      {/* ── STATS ROW ────────────────────────────────────────────────────── */}
      <section className="lv2-s" style={{ borderTop: '1px solid var(--bdr)', padding: '64px 0' }}>
        <div className="lv2-si">
          <div className="lv2-stats-row rv">
            <div className="lv2-stat">
              <div className="lv2-stat-num"><em>48h</em></div>
              <div className="lv2-stat-label">Délai de livraison garanti</div>
            </div>
            <div className="lv2-stat">
              <div className="lv2-stat-num">10<em>×</em></div>
              <div className="lv2-stat-label">Itérations incluses</div>
            </div>
            <div className="lv2-stat">
              <div className="lv2-stat-num">3<em>+</em></div>
              <div className="lv2-stat-label">Formats livrés simultanément</div>
            </div>
            <div className="lv2-stat">
              <div className="lv2-stat-num">5<em>↗</em></div>
              <div className="lv2-stat-label">Agents IA en parallèle</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODÈLES IA ───────────────────────────────────────────────────── */}
      <section className="lv2-s alt" id="modeles">
        <div className="lv2-si">
          <div className="lv2-split rv">

            {/* Texte */}
            <div>
              <div className="lv2-label">Option · +49 €</div>
              <h2>Un modèle IA.<br />Sur votre brief.</h2>
              <p className="lv2-s-sub" style={{ marginTop: 16 }}>
                Décrivez le profil, ScenIQ génère le personnage. Intégré directement dans votre clip — pas de casting, pas d&apos;intermédiaire.
              </p>
              <ul className="lv2-feat-list">
                {[
                  { label: 'Pas de cachet',        desc: 'pas de contrat modèle, pas de droits à l\'image à négocier' },
                  { label: 'Pas de tarif agence',  desc: '800–3 000 € de casting en agence — 49 € ici, dans votre forfait' },
                  { label: 'Disponible à volonté', desc: 'recadré, retravaillé ou remplacé à chaque itération' },
                  { label: 'Mention légale fournie', desc: 'conforme EU AI Act + loi influenceurs FR — livrée par écrit avec le MP4' },
                ].map((item) => (
                  <li key={item.label} className="lv2-feat-item">
                    <span className="lv2-feat-check">
                      <svg viewBox="0 0 12 12" fill="none" stroke="#7C5CFC" strokeWidth="2" width="10" height="10">
                        <polyline points="2,6 5,9 10,3"/>
                      </svg>
                    </span>
                    <span>
                      <strong style={{ color: '#fff' }}>{item.label}</strong>
                      {' '}— {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: 16, fontSize: 12, color: 'var(--g6)', lineHeight: 1.65 }}>
                Personnages entièrement fictifs — aucune ressemblance avec une personne réelle.
                La mention «&nbsp;Image générée par IA&nbsp;» est obligatoire sur vos publications
                (EU AI Act art.&nbsp;50 · loi FR 9 juin 2023). ScenIQ vous la fournit dans chaque livraison.
              </p>
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <a href="#reels" className="lv2-btn lv2-btn-accent">
                  Voir les clips avec modèles IA →
                </a>
                <a href="/commande?modele=1" className="lv2-btn lv2-btn-ghost" style={{ fontSize: 14 }}>
                  Ajouter l&apos;option · +49 €
                </a>
              </div>
            </div>

            {/* Cartes modèles — layout éditorial */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 10, height: 520 }}>

                {/* Kaelys — pleine hauteur */}
                <div style={{
                  borderRadius: 14, overflow: 'hidden', position: 'relative', height: '100%',
                  background: 'linear-gradient(160deg,#1a0f3a,#0e0e1a)',
                  border: '1px solid rgba(124,92,252,0.35)',
                }}>
                  <img src="/models/kaelys.jpg" alt="Kaelys"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(7,7,15,0.82)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(165,180,252,0.7)' }}>IA</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 14px 14px', background: 'linear-gradient(to top,rgba(7,7,15,0.97),transparent)' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#A5B4FC' }}>Kaelys</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>Influenceuse</div>
                  </div>
                </div>

                {/* Marcus + Sofia empilés */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                  {[
                    { slug: 'modele-1', name: 'Marcus', type: 'Tech · Urbain' },
                    { slug: 'modele-2', name: 'Sofia',  type: 'Business' },
                  ].map((m) => (
                    <div key={m.slug} style={{
                      flex: 1, borderRadius: 14, overflow: 'hidden', position: 'relative',
                      background: 'var(--surface)', border: '1px solid var(--bdr-md)',
                    }}>
                      <img src={`/models/${m.slug}.jpg`} alt={m.name}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 7px', borderRadius: 4, background: 'rgba(7,7,15,0.82)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.45)' }}>IA</div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 12px 12px', background: 'linear-gradient(to top,rgba(7,7,15,0.97),transparent)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.name}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 1 }}>{m.type}</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
              {/* Carte sur mesure */}
              <div style={{
                marginTop: 10, padding: '14px 16px', borderRadius: 12,
                border: '1px dashed rgba(124,92,252,0.25)',
                background: 'rgba(124,92,252,0.03)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g6)' }}>
                  + Sur mesure selon votre description
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="lv2-s alt" id="tarifs">
        <div className="lv2-si">
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">Tarifs</div>
            <h2>Prix fixe. Sans surprise.</h2>
            <p className="lv2-s-sub" style={{ maxWidth: 480, margin: '16px auto 0' }}>
              Choisissez la durée de votre publicité. Tous les formats sont inclus dans chaque forfait.
            </p>
          </div>

          <div className="lv2-prices rv">
            {[
              { dur: '5s',  fmt: 'Format court',    price: 69,  shots: '2 shots vidéo', fmts: 'Formats 9:16 + 1:1',         extra: 'Script + musique',            featured: false },
              { dur: '8s',  fmt: 'Format reel',     price: 89,  shots: '3 shots vidéo', fmts: 'Formats 9:16 + 1:1',         extra: 'Script + musique',            featured: false },
              { dur: '10s', fmt: 'Format pub',      price: 109, shots: '3 shots vidéo', fmts: 'Formats 9:16 + 1:1 + 16:9', extra: 'Script + voix-off + musique', featured: true  },
              { dur: '12s', fmt: 'Format narration',price: 129, shots: '4 shots vidéo', fmts: 'Formats 9:16 + 1:1 + 16:9', extra: 'Script + voix-off + musique', featured: false },
              { dur: '15s', fmt: 'Format histoire', price: 159, shots: '4 shots vidéo', fmts: 'Formats 9:16 + 1:1 + 16:9', extra: 'Script + voix-off + musique', featured: false },
            ].map((p) => (
              <div key={p.dur} className={`lv2-price-card${p.featured ? ' featured' : ''}`}>
                {p.featured && <div className="lv2-price-badge">⭐ Populaire</div>}
                <div className="lv2-price-dur">{p.dur}</div>
                <div style={{ fontSize: 12, color: 'var(--g6)', fontWeight: 500, marginTop: -10, marginBottom: 10 }}>
                  {p.fmt}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--bdr)', margin: '0 0 14px' }} />
                <div className="lv2-price-num">
                  <sup>€</sup>{p.price}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--g4)', marginLeft: 2 }}>HT</span>
                </div>
                <ul className="lv2-price-perks">
                  <li className="lv2-price-perk">{p.shots}</li>
                  <li className="lv2-price-perk">{p.fmts}</li>
                  <li className="lv2-price-perk">{p.extra}</li>
                  <li className="lv2-price-perk">10 itérations</li>
                </ul>
                <a
                  href={`/commande?duree=${parseInt(p.dur)}`}
                  className={`lv2-btn${p.featured ? ' lv2-btn-accent' : ' lv2-btn-ghost'}`}
                  style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                >
                  {p.featured ? 'Commander →' : 'Commander'}
                </a>
              </div>
            ))}
          </div>

          <p className="rv" style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--g6)' }}>
            Tous prix HT · MP4 livré par e-mail · Paiement sécurisé Stripe
          </p>
        </div>
      </section>

      {/* ── PORTFOLIO — deux lignes défilantes ───────────────────────────── */}
      <section id="reels" style={{ background: '#0D0D1A', padding: '80px 0 72px', overflow: 'hidden' }}>
        <div className="lv2-si">
          <div className="rv" style={{ marginBottom: 40 }}>
            <div className="lv2-label">Portfolio</div>
            <h2>Créé avec ScenIQ.</h2>
            <p style={{ color: 'var(--g4)', fontSize: 17, marginTop: 10, maxWidth: 460 }}>
              Des publicités vidéo pour des marques de toutes tailles, dans tous les secteurs.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PortfolioRow items={portfolioRows[0]} direction="left"  rowHeight={320} speed={0.5} />
          <PortfolioRow items={portfolioRows[1]} direction="right" rowHeight={320} speed={0.42} />
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--g6)', letterSpacing: '0.06em' }}>
          ✦ Vidéos générées via Seedance 2.0 · formats 9:16 · 1:1 · 16:9
        </p>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="lv2-s">
        <div className="lv2-si">
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">Témoignages</div>
            <h2>Ce que disent<br />les marques.</h2>
          </div>
          <div className="lv2-testimonials rv">
            {[
              {
                init: 'M', name: 'Marie D.', role: 'Responsable marketing · Marque A',
                text: (
                  <>"<em>On a reçu notre reel en 36h.</em> Le brief faisait 3 lignes. Le résultat était exactement ce qu&apos;on voulait — on a juste ajusté le texte sur une itération."</>
                ),
              },
              {
                init: 'T', name: 'Thomas L.', role: 'Fondateur · Startup SaaS',
                text: (
                  <>"Je pensais qu&apos;il fallait un budget agence pour avoir du contenu vidéo de qualité. <em>ScenIQ a changé ça.</em> 109€ pour une pub 10s prête pour Meta Ads."</>
                ),
              },
              {
                init: 'S', name: 'Sophie R.', role: 'CMO · E-commerce mode',
                text: (
                  <>"<em>Le process est redoutablement simple.</em> Brief, paiement, appel Pascal, livraison. On commande maintenant chaque lancement produit."</>
                ),
              },
              {
                init: 'A', name: 'Alexis M.', role: 'Directeur créatif · Agence digitale',
                text: (
                  <>"La qualité visuelle m&apos;a surpris — on était sceptique sur l&apos;IA pour la vidéo. <em>Ce n&apos;est plus le sujet.</em> Le résultat parle de lui-même."</>
                ),
              },
            ].map((t) => (
              <div key={t.name} className="lv2-testimonial">
                <div className="lv2-test-stars">
                  {['★','★','★','★','★'].map((s, i) => (
                    <span key={i} className="lv2-test-star">{s}</span>
                  ))}
                </div>
                <p className="lv2-test-text">{t.text}</p>
                <div className="lv2-test-author">
                  <div className="lv2-test-avatar">{t.init}</div>
                  <div>
                    <div className="lv2-test-name">{t.name}</div>
                    <div className="lv2-test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ 2-COL ────────────────────────────────────────────────────── */}
      <section className="lv2-s alt" id="faq">
        <div className="lv2-si">
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">FAQ</div>
            <h2>Questions fréquentes.</h2>
            <p className="lv2-s-sub" style={{ maxWidth: 480, margin: '16px auto 0' }}>
              Tout ce qu&apos;il faut savoir avant de commander.
            </p>
          </div>

          <div className="lv2-faq-grid rv">
            {/* Colonne gauche */}
            <div className="lv2-faq-col">
              {[
                {
                  q: 'Comment se déroule le processus exactement ?',
                  a: 'Vous commandez en ligne et remplissez un brief en 2 lignes. Pascal vous rappelle sous 4h ouvrées pour aligner la direction créative. Les 5 agents IA génèrent la pré-prod en parallèle. La vidéo finale vous est envoyée par e-mail sous 48h.',
                },
                {
                  q: "Qu'est-ce qui est livré exactement ?",
                  a: "Un fichier MP4 1080p envoyé directement par e-mail. Pas d'espace client, pas de compte à créer. Les formats 9:16, 1:1 et 16:9 sont inclus selon la durée choisie — prêts pour Meta Ads, TikTok, YouTube et Instagram.",
                },
                {
                  q: 'Combien de temps pour recevoir ma vidéo ?',
                  a: "48h après validation de la direction créative lors de l'appel. Le délai court à partir de cet appel, pas du paiement. En pratique, la plupart des livraisons se font en moins de 48h.",
                },
                {
                  q: 'Puis-je fournir des références visuelles ou musicales ?',
                  a: "Oui, c'est même recommandé. Lors de la commande vous pouvez uploader des images, vidéos ou fichiers audio. Plus vos références sont précises, plus la cohérence visuelle de la vidéo est forte.",
                },
                {
                  q: 'Dois-je créer un compte ?',
                  a: "Non. Vous commandez, vous payez, vous recevez votre MP4 par e-mail. Aucun compte, aucun espace client. Un outil self-service est prévu pour 2027.",
                },
              ].map((item) => (
                <div key={item.q} className="fi">
                  <button className="fq">
                    {item.q}
                    <span className="fi-ico">+</span>
                  </button>
                  <div className="fa">{item.a}</div>
                </div>
              ))}
            </div>

            {/* Colonne droite */}
            <div className="lv2-faq-col">
              {[
                {
                  q: "Puis-je inclure un modèle ou une influenceuse IA dans ma vidéo ?",
                  a: "Oui — c'est une option à +49 € sur votre forfait. Vous décrivez le profil (âge, style, ambiance), ScenIQ génère le personnage IA sur mesure. Tous les personnages sont entièrement fictifs. Conformément au EU AI Act et à la loi française sur les influenceurs (juin 2023), une mention 'Image générée par IA' est obligatoire sur vos publications. ScenIQ vous fournit cette mention dans chaque livraison. Vous restez responsable de l'afficher sur vos supports.",
                },
                {
                  q: "Pourquoi Seedance 2.0 et pas Runway, Veo 3 ou Sora ?",
                  a: "Seedance 2.0 est le moteur vidéo de ByteDance — la même entreprise que TikTok, donc optimisé pour les formats courts et les cuts dynamiques. Trois avantages concrets : (1) rendu 1080p natif avec audio intégré dans le même appel, là où les autres facturent son et image séparément. (2) architecture multi-shot en un seul prompt — la cohérence visuelle entre les plans est meilleure qu'en assemblant des clips séparés. (3) vitesse de rendu : un clip 10s est généré en moins de 3 minutes. Runway Gen-4 et Veo 3 produisent de bons résultats, mais sont plus lents, plus chers à l'usage, et moins optimisés pour le format pub court.",
                },
                {
                  q: "Que se passe-t-il si le résultat ne me convient pas ?",
                  a: "10 itérations sont incluses dans chaque commande. Si après 10 allers-retours nous n'arrivons pas à un résultat satisfaisant, vous êtes intégralement remboursé. C'est rare — ça ne nous est pas encore arrivé.",
                },
                {
                  q: 'Quelle durée choisir pour ma publicité ?',
                  a: "5–8s pour des accroches Reels/Stories sans narration. 10s pour une pub Meta classique avec voix-off courte. 12–15s pour un format avec storytelling ou démonstration produit. En cas de doute, le 10s est le plus polyvalent.",
                },
                {
                  q: "Comment se passe l'appel avec Pascal ?",
                  a: "Un appel téléphonique de 15–20 minutes maximum. Pascal valide avec vous l'axe créatif, la tonalité et les éventuelles contraintes de marque avant de lancer la génération. Pas de visio obligatoire, pas d'outil tiers.",
                },
                {
                  q: 'La vidéo peut-elle inclure une voix-off ?',
                  a: "Oui, à partir du format 10s. Le Scriptwriter calibre le script à 2,2 mots par seconde. Pour les voix-off françaises, une couche dédiée est ajoutée au montage final, sans surcoût.",
                },
                {
                  q: 'Quel mode de paiement est accepté ?',
                  a: "Paiement 100 % à la commande via Stripe (CB, Apple Pay, Google Pay). Pas d'acompte, pas de paiement différé. Une facture est générée automatiquement après le paiement.",
                },
              ].map((item) => (
                <div key={item.q} className="fi">
                  <button className="fq">
                    {item.q}
                    <span className="fi-ico">+</span>
                  </button>
                  <div className="fa">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="lv2-final-cta">
        <div className="lv2-si">
          <div className="lv2-final-cta-inner">
            <div className="lv2-label" style={{ margin: '0 auto 20px' }}>Prêt à commencer ?</div>
            <h2>Votre prochaine pub vidéo.<br />Deux lignes. 48 heures.</h2>
            <p className="lv2-final-cta-sub">
              Un brief, un paiement, un appel. Pré-prod livrée sans réunion intermédiaire.
            </p>
            <div className="lv2-final-cta-btns">
              <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-lg">
                Commander ma vidéo →
              </a>
              <button
                type="button"
                onClick={() => { setQuestionOpen(true); setQuestionSent(false) }}
                className="lv2-btn lv2-btn-ghost lv2-btn-lg"
              >
                Une question ?
              </button>
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: 'var(--g6)' }}>
              Vous recevez votre MP4 par e-mail. Pas de compte, pas d&apos;espace client.
              Questions&nbsp;:{' '}
              <a href="mailto:support@sceniq.studio" style={{ color: 'var(--accent)' }}>
                support@sceniq.studio
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="lv2-footer">
        <div className="lv2-footer-inner">
          <div className="lv2-footer-brand">
            <img src="/sceniq-logo-dark.svg" alt="ScenIQ" style={{ height: 34, width: 'auto' }} />
            <p className="lv2-footer-desc">
              Agence IA de production vidéo publicitaire. Cinq agents spécialisés — Director, Scriptwriter, Storyboarder, Music, Visual — livrent la pré-prod en 48h.
            </p>
          </div>
          <div>
            <div className="lv2-footer-col-title">Service</div>
            <ul className="lv2-footer-links">
              <li><a href="#process">Comment ça marche</a></li>
              <li><a href="#modeles">Modèles IA</a></li>
              <li><a href="#tarifs">Tarifs</a></li>
              <li><a href="#reels">Exemples</a></li>
              <li><a href="/commande">Commander</a></li>
            </ul>
          </div>
          <div>
            <div className="lv2-footer-col-title">Formats</div>
            <ul className="lv2-footer-links">
              <li><a href="#tarifs">Pub 5 secondes — 69 €</a></li>
              <li><a href="#tarifs">Reel 8 secondes — 89 €</a></li>
              <li><a href="#tarifs">Clip 10 secondes — 109 €</a></li>
              <li><a href="#tarifs">Narration 12–15s</a></li>
            </ul>
          </div>
          <div>
            <div className="lv2-footer-col-title">Contact</div>
            <ul className="lv2-footer-links">
              <li><a href="mailto:support@sceniq.studio">support@sceniq.studio</a></li>
              <li><a href="tel:+33756808831">📞 07 56 80 88 31</a></li>
              <li><a href="#">Mentions légales</a></li>
              <li><a href="#">Confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div className="lv2-footer-bottom">
          <span>© 2026 ScenIQ · Tous droits réservés</span>
          <span>Outil self-service prévu pour 2027</span>
        </div>
      </footer>

      {/* ── MODALE QUESTION ─────────────────────────────────────────────── */}
      {questionOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setQuestionOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Poser une question"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0E0E1A', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 480,
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setQuestionOpen(false)}
              aria-label="Fermer"
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 20, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >×</button>

            {!questionSent ? (
              <>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#7C5CFC', marginBottom: 10,
                }}>Avant de commander</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
                  Une question&nbsp;?
                </h3>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, marginBottom: 16 }}>
                  Pas encore prêt(e) à commander ? Posez-moi votre question directement —
                  vous parlez à une vraie personne, pas à un bot.
                </p>
                <a
                  href="tel:+33756808831"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '9px 18px', borderRadius: 999,
                    background: 'rgba(124,92,252,0.12)', border: '1px solid rgba(124,92,252,0.3)',
                    color: '#A5B4FC', fontSize: 14, fontWeight: 700,
                    textDecoration: 'none', marginBottom: 20,
                  }}
                >
                  📞 07 56 80 88 31 — appel direct
                </a>
                <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                        Prénom
                      </label>
                      <input
                        type="text" required placeholder="Marie"
                        value={qForm.name}
                        onChange={(e) => setQForm((f) => ({ ...f, name: e.target.value }))}
                        style={{
                          width: '100%', padding: '11px 14px',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                        Email
                      </label>
                      <input
                        type="email" required placeholder="marie@agence.fr"
                        value={qForm.email}
                        onChange={(e) => setQForm((f) => ({ ...f, email: e.target.value }))}
                        style={{
                          width: '100%', padding: '11px 14px',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      Votre question
                    </label>
                    <textarea
                      required rows={4}
                      placeholder="Ex : Est-ce que vous pouvez faire une vidéo pour un lancement produit avec plusieurs personnages ?"
                      value={qForm.message}
                      onChange={(e) => setQForm((f) => ({ ...f, message: e.target.value }))}
                      style={{
                        width: '100%', padding: '11px 14px', resize: 'vertical',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', lineHeight: 1.55,
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: '13px 24px', borderRadius: 999,
                      background: '#7C5CFC', border: 'none', color: '#fff',
                      fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
                    }}
                  >
                    Envoyer ma question →
                  </button>
                  <p style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>
                    Réponse sous 4 h ouvrées · Aucun engagement
                  </p>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                  Message envoyé !
                </h3>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6 }}>
                  Je reviens vers vous sous 4 h ouvrées, {qForm.name || 'à très vite'}&nbsp;!
                </p>
                <button
                  type="button"
                  onClick={() => setQuestionOpen(false)}
                  style={{
                    marginTop: 24, padding: '11px 28px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALE VIDÉO ─────────────────────────────────────────────────── */}
      {openVideo && (
        <div
          className="video-modal-backdrop"
          onClick={() => setOpenVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Lecture ${openVideo}`}
        >
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="video-modal-close"
              onClick={() => setOpenVideo(null)}
              aria-label="Fermer"
            >
              ×
            </button>
            <video
              key={openVideo}
              className="video-modal-video"
              src={`/showcase/${openVideo}.mp4`}
              autoPlay
              controls
              playsInline
              muted={false}
              ref={(el) => { if (el) { el.muted = false; el.play().catch(() => {}); } }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
