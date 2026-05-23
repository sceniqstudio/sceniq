'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { ShowcaseClip } from '@/app/_components/ShowcaseClip'
import { SHOWCASE_VIDEOS, HERO_SLUGS } from '@/lib/showcase'
import { translations, type Lang } from '@/lib/i18n'

// ── Portfolio — items depuis lib/showcase.ts ────────────────────────────────
// Slugs avec poster JPG disponible (exemple1-22 + volt)
const SLUGS_WITH_POSTER = new Set([
  'exemple1','exemple2','exemple3','exemple4','exemple5','exemple6','exemple7',
  'exemple8','exemple9','exemple10','exemple11','exemple12','exemple13','exemple14',
  'exemple15','exemple16','exemple17','exemple18','exemple19','exemple20','exemple21','exemple22',
])

type PortfolioItem = { id: string; slug: string; ratio: number; label: string; grad: string; poster?: string }

const GRADS = [
  'linear-gradient(135deg,#0a0a14,#1a0a3c)',
  'linear-gradient(135deg,#0f0c29,#302b63)',
]

const PORTFOLIO_ITEMS: PortfolioItem[] = SHOWCASE_VIDEOS.map((v, i) => ({
  id:     `e${String(i + 1).padStart(2, '0')}`,
  slug:   v.slug,
  ratio:  v.ratio,
  label:  v.ratio > 1 ? '16:9' : v.ratio > 0.7 ? '3:4' : '9:16',
  grad:   GRADS[i % 2],
  poster: SLUGS_WITH_POSTER.has(v.slug) ? `/showcase/${v.slug}.jpg` : undefined,
}))

const SHOWCASE_SLUGS = HERO_SLUGS

// ── PortfolioRow — infinite scroll + drag souris/touch iOS fluide ───────────
function PortfolioRow({
  items, direction, rowHeight = 190, gap = 12, speed = 0.45, onCardClick,
}: {
  items: PortfolioItem[]; direction: 'left' | 'right'
  rowHeight?: number; gap?: number; speed?: number
  onCardClick?: (slug: string) => void
}) {
  const trackRef    = useRef<HTMLDivElement>(null)
  const posRef      = useRef(0)
  const animRef     = useRef<number>()
  const drag        = useRef({ active: false, startX: 0, startY: 0, startPos: 0, didDrag: false, locked: false })
  const momentumRef = useRef(0)
  const lastXRef    = useRef(0)
  const lastTRef    = useRef(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const getTotal = () => track.scrollWidth / 2
    const mod = (n: number, m: number) => ((n % m) + m) % m

    const tick = () => {
      if (!drag.current.active) {
        const total = getTotal()
        if (total > 0) {
          // momentum décelération après swipe
          if (Math.abs(momentumRef.current) > 0.3) {
            posRef.current = mod(posRef.current + momentumRef.current, total)
            momentumRef.current *= 0.92
          } else {
            momentumRef.current = 0
            posRef.current = mod(posRef.current + (direction === 'left' ? speed : -speed), total)
          }
          track.style.transform = `translateX(${-posRef.current}px)`
        }
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)

    // ── Souris ──
    const onMouseDown = (e: MouseEvent) => {
      drag.current = { active: true, startX: e.clientX, startY: 0, startPos: posRef.current, didDrag: false, locked: true }
      momentumRef.current = 0
      track.style.cursor = 'grabbing'
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!drag.current.active) return
      const delta = drag.current.startX - e.clientX
      if (Math.abs(delta) > 4) drag.current.didDrag = true
      posRef.current = mod(drag.current.startPos + delta, getTotal())
      track.style.transform = `translateX(${-posRef.current}px)`
    }
    const onMouseUp = () => { drag.current.active = false; track.style.cursor = 'grab' }

    // ── Touch iOS — détection direction + momentum ──
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      drag.current = { active: true, startX: t.clientX, startY: t.clientY, startPos: posRef.current, didDrag: false, locked: false }
      momentumRef.current = 0
      lastXRef.current = t.clientX
      lastTRef.current = Date.now()
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!drag.current.active) return
      const t = e.touches[0]
      const dx = Math.abs(t.clientX - drag.current.startX)
      const dy = Math.abs(t.clientY - drag.current.startY)

      // Verrouillage direction au premier mouvement significatif
      if (!drag.current.locked) {
        if (dx < 3 && dy < 3) return
        drag.current.locked = true
        // Si mouvement vertical dominant → on laisse le scroll page
        if (dy > dx) { drag.current.active = false; return }
      }

      // Mouvement horizontal confirmé → on bloque le scroll page
      e.preventDefault()
      if (dx > 6) drag.current.didDrag = true

      // Calcul vélocité pour momentum
      const now = Date.now()
      const dt = now - lastTRef.current
      if (dt > 0) momentumRef.current = (lastXRef.current - t.clientX) / dt * 16
      lastXRef.current = t.clientX
      lastTRef.current = now

      const delta = drag.current.startX - t.clientX
      posRef.current = mod(drag.current.startPos + delta, getTotal())
      track.style.transform = `translateX(${-posRef.current}px)`
    }
    const onTouchEnd = () => { drag.current.active = false }

    track.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    // touchstart sur track, touchmove sur track (non-passive pour preventDefault)
    track.addEventListener('touchstart', onTouchStart, { passive: true })
    track.addEventListener('touchmove', onTouchMove, { passive: false })
    track.addEventListener('touchend', onTouchEnd)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      track.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      track.removeEventListener('touchstart', onTouchStart)
      track.removeEventListener('touchmove', onTouchMove)
      track.removeEventListener('touchend', onTouchEnd)
    }
  }, [direction, speed])

  const doubled = [...items, ...items]

  return (
    <div style={{ touchAction: 'pan-y', overflow: 'hidden' }}>
      <div
        ref={trackRef}
        style={{ display: 'flex', alignItems: 'flex-start', gap, width: 'max-content', willChange: 'transform', userSelect: 'none' }}
      >
        {doubled.map((item, i) => {
          const w = Math.round(rowHeight * item.ratio)
          return (
            <button
              key={`${item.id}-${i}`}
              type="button"
              className="portfolio-card"
              onClick={() => { if (!drag.current.didDrag && onCardClick) onCardClick(item.slug) }}
              style={{
                width: w, height: rowHeight, borderRadius: 14,
                background: item.grad,
                cursor: onCardClick ? 'pointer' : 'inherit',
              }}
              aria-label={`Lire ${item.slug}`}
            >
              {item.poster ? (
                <img
                  src={item.poster}
                  alt=""
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
                  {item.label}
                </span>
              )}
              <div className="portfolio-card-play">
                <div className="portfolio-card-play-icon">
                  <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Hero animated columns — 2 left + empty center + 2 right ───────────────
// 4 columns: index 0,1 → left side  |  index 2,3 → right side
const COL_DURATIONS = [32, 26, 28, 36]
const COL_DELAYS    = [-6, -14, -18, -4]
const COL_SLUGS     = Array.from({ length: 4 }, (_, c) =>
  Array.from({ length: 4 }, (_, i) => SHOWCASE_SLUGS[(c * 4 + i) % SHOWCASE_SLUGS.length])
)

export default function HomePage() {
  const [openVideo, setOpenVideo]           = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [questionOpen, setQuestionOpen]     = useState(false)
  const [questionSent, setQuestionSent]     = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [qForm, setQForm]                   = useState({ name: '', email: '', phone: '', message: '' })
  const [pricingModel, setPricingModel]     = useState(false)
  const [portfolioRows, setPortfolioRows]   = useState<[PortfolioItem[], PortfolioItem[]]>([
    PORTFOLIO_ITEMS.slice(0, 11), PORTFOLIO_ITEMS.slice(11),
  ])
  const [lang, setLang] = useState<Lang>('fr')
  const t = translations[lang]

  // Persist lang preference
  useEffect(() => {
    const saved = localStorage.getItem('sceniq-lang') as Lang | null
    if (saved === 'en' || saved === 'fr') setLang(saved)
  }, [])
  const toggleLang = () => {
    const next: Lang = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    localStorage.setItem('sceniq-lang', next)
  }

  // ── Question form handler ────────────────────────────────────────────────
  const handleQuestionSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setQuestionLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    qForm.name,
          email:   qForm.email,
          phone:   qForm.phone || null,
          message: qForm.message,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setQuestionSent(true)
    } catch {
      // Fallback mailto si l'API échoue
      const subject = encodeURIComponent(`Question ScenIQ — ${qForm.name}`)
      const body = encodeURIComponent(
        `Prénom : ${qForm.name}\nEmail : ${qForm.email}${qForm.phone ? `\nTéléphone : ${qForm.phone}` : ''}\n\nQuestion :\n${qForm.message}`
      )
      window.open(`mailto:support@sceniq.studio?subject=${subject}&body=${body}`, '_blank')
      setQuestionSent(true)
    } finally {
      setQuestionLoading(false)
    }
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

    // ── IntersectionObserver : pause/play vidéos hors viewport ──────────────
    // iOS Safari ignore preload="none" → readyState=0 au premier passage.
    // Il faut appeler load() d'abord, puis play() dans le handler canplay.
    const videoObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const vid = entry.target as HTMLVideoElement
        if (entry.isIntersecting) {
          if (vid.readyState === 0) {
            // iOS : rien n'est chargé — load() puis play() sur canplay
            const onCanPlay = () => {
              vid.play().catch(() => {})
              vid.removeEventListener('canplay', onCanPlay)
            }
            vid.addEventListener('canplay', onCanPlay)
            vid.load()
          } else if (vid.paused) {
            vid.play().catch(() => {})
          }
        } else {
          if (!vid.paused) vid.pause()
        }
      })
    }, { rootMargin: '200px 0px', threshold: 0 })

    // Observer toutes les vidéos hors hero — studio inclus (même comportement que Seedance)
    document.querySelectorAll('video:not(.lv2-hero video):not(#modal-video)').forEach(v => {
      videoObs.observe(v)
    })

    return () => {
      obs.disconnect()
      videoObs.disconnect()
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
            <img src="/sceniq-logo-dark.svg" alt="ScenIQ" style={{ height: 56, width: 'auto', display: 'block' }} />
          </a>
          <ul className="lv2-nav-links">
            <li><a href="#process">{t.nav.process}</a></li>
            <li><a href="#qualite">{t.nav.studio}</a></li>
            <li><a href="#modeles">{t.nav.models}</a></li>
            <li><a href="#tarifs">{t.nav.pricing}</a></li>
            <li><a href="#reels">{t.nav.portfolio}</a></li>
          </ul>
          <div className="lv2-nav-right">
            <button type="button" onClick={() => { setQuestionOpen(true); setQuestionSent(false) }} className="lv2-btn lv2-btn-ghost lv2-btn-sm">
              {t.nav.question}
            </button>
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-sm" style={{ borderRadius: '100px', fontWeight: 700 }}>
              {t.nav.order}
            </a>
            <button
              type="button"
              onClick={toggleLang}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '100px', padding: '6px 12px',
                color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.08em', fontFamily: 'inherit',
                marginRight: '4px',
              }}
            >
              {t.misc.langSwitch}
            </button>
          </div>
          <button
            className={`lv2-burger${mobileMenuOpen ? ' open' : ''}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? t.misc.burgerClose : t.misc.burgerOpen}
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
              <button className="lv2-mob-close" onClick={() => setMobileMenuOpen(false)} aria-label={t.misc.mobileClose}>×</button>
            </div>
            <ul className="lv2-mob-links">
              <li><a href="#process"  onClick={() => setMobileMenuOpen(false)}>{t.nav.process}</a></li>
              <li><a href="#qualite"  onClick={() => setMobileMenuOpen(false)}>{t.nav.studio}</a></li>
              <li><a href="#modeles"  onClick={() => setMobileMenuOpen(false)}>{t.nav.models}</a></li>
              <li><a href="#tarifs"   onClick={() => setMobileMenuOpen(false)}>{t.nav.pricing}</a></li>
              <li><a href="#reels"    onClick={() => setMobileMenuOpen(false)}>{t.nav.portfolio}</a></li>
            </ul>
            <div className="lv2-mob-cta">
              <button
                type="button"
                onClick={toggleLang}
                className="lv2-btn lv2-btn-ghost"
                style={{ justifyContent: 'center', letterSpacing: '0.06em', fontSize: 13 }}
              >
                {lang === 'fr' ? '🇬🇧 English' : '🇫🇷 Français'}
              </button>
              <a href="/commande" className="lv2-btn lv2-btn-accent" onClick={() => setMobileMenuOpen(false)}>
                {t.nav.orderMobile}
              </a>
              <button
                type="button"
                className="lv2-btn lv2-btn-ghost"
                onClick={() => { setMobileMenuOpen(false); setQuestionOpen(true); setQuestionSent(false) }}
                style={{ justifyContent: 'center' }}
              >
                {t.nav.question}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO — 2 cols gauche · centre vide · 2 cols droite ──────────── */}
      <section className="lv2-hero" id="main-content" aria-label="Hero ScenIQ">
        <div className="lv2-hbg" aria-hidden="true">

          {/* ── 2 colonnes gauche ── */}
          <div className="lv2-hbg-side lv2-hbg-left">
            {[0, 1].map((c) => (
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
                    <video autoPlay muted loop playsInline preload="none">
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
            {[2, 3].map((c) => (
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
                    <video autoPlay muted loop playsInline preload="none">
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
            <span className="lv2-badge-pill">{t.hero.badge}</span>
            {t.hero.badgeSub}
          </div>
          <h1 className="lv2-h1">
            {t.hero.h1a}<br />
            <em>{t.hero.h1b}</em>
          </h1>
          <p className="lv2-sub">{t.hero.sub}</p>
          <div className="lv2-ctas">
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-lg">{t.hero.cta1}</a>
            <a href="#reels" className="lv2-btn lv2-btn-ghost lv2-btn-lg">{t.hero.cta2}</a>
          </div>
          <p className="lv2-footnote">{t.hero.footnote}</p>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────── */}
      <div className="lv2-trust">
        <div className="lv2-trust-inner">
          <span className="lv2-trust-lbl">{t.trust.label}</span>
          <div className="lv2-trust-items">
            {t.trust.items.map(item => <span key={item} className="lv2-trust-item">{item}</span>)}
          </div>
        </div>
      </div>

      {/* ── PROCESS — 5 étapes ───────────────────────────────────────────── */}
      <section className="lv2-s" id="process">
        <div className="lv2-si">
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">{t.process.label}</div>
            <h2>{t.process.h2a}<br />{t.process.h2b}</h2>
            <p className="lv2-s-sub" style={{ maxWidth: 480, margin: '16px auto 0' }}>{t.process.sub}</p>
          </div>
          <div className="lv2-process-grid rv">
            {t.process.steps.map((step) => (
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
              <div className="lv2-label">{t.studio.label}</div>
              <h2>{t.studio.h2a}<br />{t.studio.h2b}</h2>
              <p className="lv2-s-sub" style={{ marginTop: 16 }}>{t.studio.sub}</p>
              <ul className="lv2-feat-list">
                {t.studio.agents.map((item) => (
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
              <button
                type="button"
                onClick={() => setOpenVideo('volt')}
                style={{
                  display: 'block', width: '100%',
                  aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden',
                  background: 'var(--surface)', border: '1px solid var(--bdr-md)',
                  position: 'relative', cursor: 'pointer', padding: 0,
                }}
                aria-label={t.studio.videoAria}
              >
                <video
                  autoPlay muted loop playsInline preload="none" poster="/showcase/volt.jpg"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                >
                  <source src="/showcase/volt.mp4" type="video/mp4" />
                </video>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                }} className="play-overlay">
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(124,92,252,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 16 16" fill="white" width="16" height="16"><polygon points="4,2 14,8 4,14"/></svg>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Split 2 : génération vidéo */}
          <div className="lv2-split lv2-split-reverse rv">
            <div>
              <div className="lv2-label">{t.seedance.label}</div>
              <h2>{t.seedance.h2a}<br />{t.seedance.h2b}</h2>
              <p className="lv2-s-sub" style={{ marginTop: 16 }}>{t.seedance.sub}</p>
              <ul className="lv2-feat-list">
                {t.seedance.features.map((desc) => (
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
                aria-label={t.seedance.aria169}
              >
                <video
                  autoPlay muted loop playsInline preload="none" poster="/showcase/exemple19.jpg"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }}
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
                aria-label={t.seedance.aria916}
              >
                <video
                  autoPlay muted loop playsInline preload="none" poster="/showcase/exemple18.jpg"
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }}
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
                {t.seedance.note}
              </p>

            </div>
          </div>

        </div>
      </section>

      {/* ── STATS ROW ────────────────────────────────────────────────────── */}
      <section className="lv2-s" style={{ borderTop: '1px solid var(--bdr)', padding: '64px 0' }}>
        <div className="lv2-si">
          <div className="lv2-stats-row rv">
            {t.stats.map((s) => (
              <div key={s.num} className="lv2-stat">
                <div className="lv2-stat-num"><em>{s.num}</em></div>
                <div className="lv2-stat-divider" />
                <div className="lv2-stat-label">{s.label}</div>
                <div className="lv2-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODÈLES IA ───────────────────────────────────────────────────── */}
      <section className="lv2-s alt" id="modeles">
        <div className="lv2-si">
          <div className="lv2-split rv">

            {/* Texte */}
            <div>
              <div className="lv2-label">{t.models.label}</div>
              <h2>{t.models.h2a}<br />{t.models.h2b}</h2>
              <p className="lv2-s-sub" style={{ marginTop: 16 }}>{t.models.sub}</p>
              <ul className="lv2-feat-list">
                {t.models.features.map((item) => (
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
                {t.models.disclaimer}
              </p>
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <a href="#reels" className="lv2-btn lv2-btn-accent">{t.models.cta1}</a>
                <a href="/commande?modele=1" className="lv2-btn lv2-btn-ghost" style={{ fontSize: 14 }}>{t.models.cta2}</a>
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(165,180,252,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.models.renderLabel}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{t.models.kaelysType}</div>
                  </div>
                </div>

                {/* Marcus + Sofia empilés */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
                  {[
                    { slug: 'modele-1', name: 'Marcus', type: t.models.modelTypes[0] },
                    { slug: 'modele-2', name: 'Sofia',  type: t.models.modelTypes[1] },
                  ].map((m) => (
                    <div key={m.slug} style={{
                      flex: 1, borderRadius: 14, overflow: 'hidden', position: 'relative',
                      background: 'var(--surface)', border: '1px solid var(--bdr-md)',
                    }}>
                      <img src={`/models/${m.slug}.jpg`} alt={m.name}
                        loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 7px', borderRadius: 4, background: 'rgba(7,7,15,0.82)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(255,255,255,0.45)' }}>IA</div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 12px 12px', background: 'linear-gradient(to top,rgba(7,7,15,0.97),transparent)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.models.renderLabel}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{m.type}</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
              {/* Note exemples */}
              <div style={{
                marginTop: 10, padding: '12px 16px', borderRadius: 12,
                border: '1px dashed rgba(124,92,252,0.22)',
                background: 'rgba(124,92,252,0.04)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.models.noteIcon}</span>
                <p style={{ fontSize: 12, color: 'var(--g6)', lineHeight: 1.5, margin: 0 }}>
                  {t.models.note.split(t.models.noteHighlight).map((part, i, arr) =>
                    i < arr.length - 1
                      ? <span key={i}>{part}<strong style={{ color: 'var(--g4)' }}>{t.models.noteHighlight}</strong></span>
                      : <span key={i}>{part}</span>
                  )}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="lv2-s alt" id="tarifs">
        <div className="lv2-si">
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">{t.pricing.label}</div>
            <h2>{t.pricing.h2}</h2>
            <p className="lv2-s-sub" style={{ maxWidth: 520, margin: '16px auto 0' }}>
              {t.pricing.sub.split(t.pricing.subHighlight).map((part, i, arr) =>
                i < arr.length - 1
                  ? <span key={i}>{part}<strong style={{ color: 'var(--white)' }}>{t.pricing.subHighlight}</strong></span>
                  : <span key={i}>{part}</span>
              )}
            </p>
          </div>

          {/* ── Langues inline ── */}
          <div className="rv" style={{ textAlign: 'center', marginTop: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--g6)' }}>
              {t.pricing.langLine}
            </p>
          </div>

          {/* ── Toggle Comédien IA ── */}
          <div className="rv lv2-model-toggle-wrap">
            <button
              type="button"
              onClick={() => setPricingModel(v => !v)}
              className={`lv2-model-toggle${pricingModel ? ' active' : ''}`}
            >
              <div className="lv2-model-toggle-left">
                <div className="lv2-model-toggle-icon">🎭</div>
                <div>
                  <div className="lv2-model-toggle-title">{t.pricing.toggleTitle}</div>
                  <div className="lv2-model-toggle-desc">{t.pricing.toggleDesc}</div>
                </div>
              </div>
              <div className="lv2-model-toggle-right">
                <span className="lv2-model-toggle-price">{t.pricing.togglePrice}</span>
                <div className={`lv2-model-toggle-switch${pricingModel ? ' on' : ''}`}>
                  <div className="lv2-model-toggle-thumb" />
                </div>
              </div>
            </button>
            {pricingModel && (
              <p style={{ fontSize: 12, color: 'var(--g6)', textAlign: 'center', marginTop: 10 }}>
                {t.pricing.toggleNote}
              </p>
            )}
          </div>

          <div className="lv2-prices rv">
            {t.pricing.plans.map((p) => {
              const total = p.price + (pricingModel ? 49 : 0)
              return (
                <div key={p.dur} className={`lv2-price-card${p.featured ? ' featured' : ''}`}>
                  {p.featured && <div className="lv2-price-badge">{t.pricing.badge}</div>}
                  <div className="lv2-price-dur">{p.dur}</div>
                  <div style={{ fontSize: 12, color: 'var(--g6)', fontWeight: 500, marginTop: -10, marginBottom: 10 }}>
                    {p.fmt}
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--bdr)', margin: '0 0 14px' }} />
                  <div className="lv2-price-num">
                    <sup>€</sup>{total}
                    {pricingModel && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', marginLeft: 6, verticalAlign: 'middle' }}>
                        {t.pricing.perks.modelIncluded}
                      </span>
                    )}
                  </div>
                  <ul className="lv2-price-perks">
                    <li className="lv2-price-perk">{t.pricing.perks.shots(p.shots, p.maxFmts, p.fmts)} <span style={{ color:'var(--g6)', fontWeight:400 }}>{p.fmts}</span></li>
                    <li className="lv2-price-perk">{t.pricing.perks.script}</li>
                    <li className="lv2-price-perk">{t.pricing.perks.music}</li>
                    <li className="lv2-price-perk">{t.pricing.perks.lipsync} <span style={{ color: 'var(--g6)', fontWeight: 400 }}>🇫🇷 🇺🇸 🇯🇵 🇪🇸 🇧🇷 🇮🇩 🇨🇳</span></li>
                    <li className="lv2-price-perk">{t.pricing.perks.subs}</li>
                    {p.voix && <li className="lv2-price-perk">{t.pricing.perks.voix}</li>}
                    {pricingModel && <li className="lv2-price-perk" style={{ color: 'var(--accent)' }}>{t.pricing.perks.model}</li>}
                  </ul>
                  <a
                    href={`/commande?duree=${parseInt(p.dur)}${pricingModel ? '&modele=1' : ''}`}
                    className={`lv2-btn${p.featured ? ' lv2-btn-accent' : ' lv2-btn-ghost'}`}
                    style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                  >
                    {p.featured ? t.pricing.orderFeatured : t.pricing.orderDefault}
                  </a>
                </div>
              )
            })}
          </div>

          <p className="rv" style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--g6)' }}>
            {t.pricing.footer}
          </p>
        </div>
      </section>

      {/* ── PORTFOLIO — deux lignes défilantes ───────────────────────────── */}
      <section id="reels" style={{ background: '#0D0D1A', padding: '80px 0 72px', overflow: 'hidden' }}>
        <div className="lv2-si">
          <div className="rv" style={{ marginBottom: 40 }}>
            <div className="lv2-label">{t.portfolio.label}</div>
            <h2>{t.portfolio.h2a} <span style={{ color: 'var(--g4)', fontWeight: 400 }}>+</span> {t.portfolio.h2b}</h2>
            <p style={{ color: 'var(--g4)', fontSize: 17, marginTop: 10, maxWidth: 460 }}>
              {t.portfolio.sub}
            </p>
          </div>
        </div>

        <div className="portfolio-rows-container">
          <div className="portfolio-scroll-hint" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}><path d="M18 8L22 12L18 16"/><path d="M6 8L2 12L6 16"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            {t.portfolio.hint}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="portfolio-row-wrap">
              <PortfolioRow items={portfolioRows[0]} direction="left"  rowHeight={640} speed={0.5}  onCardClick={setOpenVideo} />
            </div>
            <div className="portfolio-row-wrap">
              <PortfolioRow items={portfolioRows[1]} direction="right" rowHeight={640} speed={0.42} onCardClick={setOpenVideo} />
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'var(--g6)', letterSpacing: '0.06em' }}>
          {t.portfolio.footer}
        </p>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="lv2-s">
        <div className="lv2-si">
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">{t.testimonials.label}</div>
            <h2>{t.testimonials.h2a}<br />{t.testimonials.h2b}</h2>
          </div>
          <div className="lv2-testimonials rv">
            {t.testimonials.items.map((item) => (
              <div key={item.name} className="lv2-testimonial">
                <div className="lv2-test-stars">
                  {['★','★','★','★','★'].map((s, i) => (
                    <span key={i} className="lv2-test-star">{s}</span>
                  ))}
                </div>
                <p className="lv2-test-text">
                  {item.pre}<em>{item.em}</em>{item.post}
                </p>
                <div className="lv2-test-author">
                  <div className="lv2-test-avatar" style={{ background: item.color, border: 'none' }}>{item.init}</div>
                  <div>
                    <div className="lv2-test-name">{item.name}</div>
                    <div className="lv2-test-role">{item.role}</div>
                    {item.verified && (
                      <div className="lv2-test-verified">✓ Commande vérifiée</div>
                    )}
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
            <div className="lv2-label">{t.faq.label}</div>
            <h2>{t.faq.h2}</h2>
            <p className="lv2-s-sub" style={{ maxWidth: 480, margin: '16px auto 0' }}>
              {t.faq.sub}
            </p>
          </div>

          <div className="lv2-faq-grid rv">
            {/* Colonne gauche */}
            <div className="lv2-faq-col">
              {t.faq.left.map((item) => (
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
              {t.faq.right.map((item) => (
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
            <div className="lv2-label" style={{ margin: '0 auto 20px' }}>{t.cta.label}</div>
            <h2>{t.cta.h2a}<br />{t.cta.h2b}</h2>
            <p className="lv2-final-cta-sub">
              {t.cta.sub}
            </p>
            <div className="lv2-final-cta-btns">
              <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-lg">
                {t.cta.btn1}
              </a>
              <button
                type="button"
                onClick={() => { setQuestionOpen(true); setQuestionSent(false) }}
                className="lv2-btn lv2-btn-ghost lv2-btn-lg"
              >
                {t.cta.btn2}
              </button>
            </div>
            <p style={{ marginTop: 20, fontSize: 13, color: 'var(--g6)' }}>
              {t.cta.note}
              {' '}Questions&nbsp;:{' '}
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
              {t.footer.desc}
            </p>
          </div>
          <div>
            <div className="lv2-footer-col-title">{t.footer.colService}</div>
            <ul className="lv2-footer-links">
              <li><a href="#process">{t.footer.links.process}</a></li>
              <li><a href="#modeles">{t.footer.links.models}</a></li>
              <li><a href="#tarifs">{t.footer.links.pricing}</a></li>
              <li><a href="#reels">{t.footer.links.portfolio}</a></li>
              <li><a href="/commande">{t.footer.links.order}</a></li>
            </ul>
          </div>
          <div>
            <div className="lv2-footer-col-title">{t.footer.colFormats}</div>
            <ul className="lv2-footer-links">
              <li><a href="#tarifs">{t.footer.links.f5}</a></li>
              <li><a href="#tarifs">{t.footer.links.f8}</a></li>
              <li><a href="#tarifs">{t.footer.links.f10}</a></li>
              <li><a href="#tarifs">{t.footer.links.f12}</a></li>
            </ul>
          </div>
          <div>
            <div className="lv2-footer-col-title">{t.footer.colContact}</div>
            <ul className="lv2-footer-links">
              <li><a href="mailto:support@sceniq.studio">support@sceniq.studio</a></li>
              <li><a href="tel:+33756808831">📞 07 56 80 88 31</a></li>
              <li><a href="/mentions-legales">{t.footer.links.legal}</a></li>
              <li><a href="/confidentialite">{t.footer.links.privacy}</a></li>
            </ul>
          </div>
        </div>
        <div className="lv2-footer-bottom">
          <span>{t.footer.bottom1}</span>
          <span>{t.footer.bottom2}</span>
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
              aria-label={t.modal.closeAria}
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
                }}>{t.modal.preLabel}</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
                  {t.modal.h3}
                </h3>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, marginBottom: 16 }}>
                  {t.modal.sub}
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
                  {t.modal.phone}
                </a>
                <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                        {t.modal.labelName}
                      </label>
                      <input
                        type="text" required placeholder={t.modal.placeName}
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
                      {lang === 'fr' ? 'Téléphone' : 'Phone'} <span style={{ fontWeight: 400, color: '#475569' }}>{lang === 'fr' ? '(optionnel)' : '(optional)'}</span>
                    </label>
                    <input
                      type="tel" placeholder="+33 6 00 00 00 00"
                      value={qForm.phone}
                      onChange={(e) => setQForm((f) => ({ ...f, phone: e.target.value }))}
                      style={{
                        width: '100%', padding: '11px 14px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      {t.modal.labelMsg}
                    </label>
                    <textarea
                      required rows={4}
                      placeholder={t.modal.placeMsg}
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
                    disabled={questionLoading}
                    style={{
                      padding: '13px 24px', borderRadius: 999,
                      background: questionLoading ? 'rgba(124,92,252,0.5)' : '#7C5CFC',
                      border: 'none', color: '#fff',
                      fontSize: 15, fontWeight: 600,
                      cursor: questionLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', transition: 'background .15s',
                    }}
                  >
                    {questionLoading ? '…' : t.modal.submit}
                  </button>
                  <p style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>
                    {lang === 'fr' ? 'Réponse sous 4 h ouvrées · Aucun engagement' : 'Reply within 4 business hours · No commitment'}
                  </p>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                  {t.modal.sentTitle}
                </h3>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6 }}>
                  {t.modal.sentSub}
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
                  {t.modal.sentClose}
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
              ref={(el) => {
                if (!el) return
                // Forcer unmute avant que autoPlay ne démarre
                el.muted = false
                el.volume = 1
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
