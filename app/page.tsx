'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { ShowcaseClip } from '@/app/_components/ShowcaseClip'
import { SHOWCASE_VIDEOS, HERO_SLUGS, showcaseUrl } from '@/lib/showcase'
import { translations, type Lang } from '@/lib/i18n'

// ── Ticker hero — briefs exemples scrollants ────────────────────────────────
const TICKER_FR = [
  'Une animation 3D style Pixar',
  'Un render produit photoréaliste',
  'Une scène d\'action cinéma',
  'Un dessin animé avec mascotte',
  'Une pub courte 10 secondes',
  'Un film de mode éditorial',
  'Un clip food cinématique',
  'Un teaser automobile sombre',
  'Un reel sport dynamique',
  'Un spot corporate B2B',
  'Un film nature atmosphérique',
  'Un clip gaming immersif',
  'Un unboxing produit luxe',
]
const TICKER_EN = [
  'A Pixar-style 3D animation',
  'A photorealistic product render',
  'A cinematic action scene',
  'An animated mascot clip',
  'A 10-second short ad',
  'An editorial fashion film',
  'A cinematic food clip',
  'A dark automotive teaser',
  'A dynamic sport reel',
  'A corporate B2B spot',
  'An atmospheric nature film',
  'An immersive gaming clip',
  'A luxury product unboxing',
]

// ── Portfolio — items depuis lib/showcase.ts ────────────────────────────────
type PortfolioItem = { id: string; slug: string; ratio: number; label: string; grad: string }

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
              <video
                autoPlay muted loop playsInline preload="none"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                onLoadedMetadata={(e) => {
                  // Auto-ajuste la largeur de la carte au ratio réel de la vidéo
                  // → upload n'importe quel format sur R2, la carte s'adapte sans toucher au code
                  const vid = e.currentTarget
                  if (vid.videoWidth && vid.videoHeight) {
                    const card = vid.closest('.portfolio-card') as HTMLElement | null
                    if (card) card.style.width = `${Math.round(rowHeight * vid.videoWidth / vid.videoHeight)}px`
                  }
                }}
              >
                <source src={showcaseUrl(item.slug)} type="video/mp4" />
              </video>
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

// ── Hero animated columns — mur 3D plein cadre (7 colonnes) ───────────────
const COL_DURATIONS = [32, 26, 30, 36, 28, 34, 27]
const COL_DELAYS    = [-6, -14, -18, -4, -10, -20, -8]
const COL_SLUGS     = Array.from({ length: 7 }, (_, c) =>
  Array.from({ length: 3 }, (_, i) => SHOWCASE_SLUGS[(c * 3 + i) % SHOWCASE_SLUGS.length])
)

export default function HomePage() {
  const [openVideo, setOpenVideo]           = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [questionOpen, setQuestionOpen]     = useState(false)
  const [questionSent, setQuestionSent]     = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [qForm, setQForm]                   = useState({ name: '', email: '', phone: '', message: '' })
  const [pricingModel, setPricingModel]     = useState(false)
  const [studioTab, setStudioTab]           = useState<'case' | 'team' | 'seedance'>('case')
  const [portfolioRows, setPortfolioRows]   = useState<[PortfolioItem[], PortfolioItem[]]>([
    PORTFOLIO_ITEMS.slice(0, 11), PORTFOLIO_ITEMS.slice(11),
  ])
  const [lang, setLang] = useState<Lang>('fr')
  const [faqOpen, setFaqOpen] = useState<string | null>(null)
  const [reels, setReels] = useState(SHOWCASE_VIDEOS)   // bento réalisations (ordre mélangé au mount)

  // ── Promo banner + modal ─────────────────────────────────────────────────
  const [promoBannerVisible, setPromoBannerVisible] = useState(false) // false until hydration
  const [promoOpen, setPromoOpen]                   = useState(false)
  const [promoSent, setPromoSent]                   = useState(false)
  const [promoLoading, setPromoLoading]             = useState(false)
  const [promoForm, setPromoForm]                   = useState({ name: '', email: '', phone: '', company: '', brief: '' })

  const t = translations[lang]

  // Persist lang preference + promo banner dismissed state
  useEffect(() => {
    const saved = localStorage.getItem('sceniq-lang') as Lang | null
    if (saved === 'en' || saved === 'fr') setLang(saved)
    // Show banner unless previously dismissed
    const dismissed = localStorage.getItem('sceniq-promo-dismissed')
    if (!dismissed) setPromoBannerVisible(true)
  }, [])

  // Hero — parallaxe du mur 3D à la souris + boutons magnétiques (comme la démo validée)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const wall = document.querySelector<HTMLElement>('.lv2-wall')
    const btns = Array.from(document.querySelectorAll<HTMLElement>('.lv2-hcontent .lv2-btn, .lv2-final-cta-btns .lv2-btn'))
    const onMove = (e: PointerEvent) => {
      if (!wall) return
      const dx = e.clientX / window.innerWidth - 0.5
      const dy = e.clientY / window.innerHeight - 0.5
      const sc = window.innerWidth < 520 ? 1.9 : window.innerWidth < 820 ? 1.55 : 1.3
      wall.style.transform = `rotateX(${9 - dy * 5}deg) rotateZ(-7deg) rotateY(${dx * 6}deg) scale(${sc})`
    }
    const onBtnMove = (e: PointerEvent) => {
      const b = e.currentTarget as HTMLElement
      const r = b.getBoundingClientRect()
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`
    }
    const onBtnLeave = (e: PointerEvent) => { (e.currentTarget as HTMLElement).style.transform = 'translate(0,0)' }
    window.addEventListener('pointermove', onMove, { passive: true })
    btns.forEach(b => { b.addEventListener('pointermove', onBtnMove); b.addEventListener('pointerleave', onBtnLeave) })
    return () => {
      window.removeEventListener('pointermove', onMove)
      btns.forEach(b => { b.removeEventListener('pointermove', onBtnMove); b.removeEventListener('pointerleave', onBtnLeave) })
    }
  }, [])

  // Timeline « Comment ça marche » — ligne qui se trace + numéros qui s'allument
  useEffect(() => {
    const tl = document.getElementById('lv2-tl')
    const fill = document.getElementById('lv2-tl-fill')
    const rail = document.querySelector<HTMLElement>('.lv2-tl-rail')
    if (!tl || !fill || !rail) return
    const steps = Array.from(tl.querySelectorAll<HTMLElement>('.lv2-tl-step'))
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.25 },
    )
    steps.forEach(s => io.observe(s))
    let topPx = 0, span = 0
    const layoutRail = () => {
      const tlTop = tl.getBoundingClientRect().top + window.scrollY
      const ns = steps.map(s => s.querySelector('.lv2-tl-node') as HTMLElement | null)
      if (!ns[0] || !ns[ns.length - 1]) return
      const f = ns[0]!.getBoundingClientRect(), l = ns[ns.length - 1]!.getBoundingClientRect()
      topPx = (f.top + window.scrollY + f.height / 2) - tlTop
      span = ((l.top + window.scrollY + l.height / 2) - tlTop) - topPx
      rail.style.top = topPx + 'px'; rail.style.bottom = 'auto'; rail.style.height = span + 'px'
      fill.style.top = topPx + 'px'; fill.style.bottom = 'auto'
    }
    const trace = () => {
      const tlTop = tl.getBoundingClientRect().top + window.scrollY
      const centerPage = window.scrollY + window.innerHeight * 0.6
      const firstY = tlTop + topPx, lastY = tlTop + topPx + span
      const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 4)
      const p = atBottom ? 1 : Math.min(1, Math.max(0, (centerPage - firstY) / ((lastY - firstY) || 1)))
      fill.style.height = (p * span) + 'px'
      steps.forEach(s => {
        const n = s.querySelector('.lv2-tl-node') as HTMLElement
        const nr = n.getBoundingClientRect()
        s.classList.toggle('on', atBottom || (nr.top + window.scrollY + nr.height / 2) < centerPage)
      })
    }
    const relayout = () => { layoutRail(); trace() }
    window.addEventListener('scroll', trace, { passive: true })
    window.addEventListener('resize', relayout)
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
    if (fonts?.ready) fonts.ready.then(relayout)
    const t1 = window.setTimeout(relayout, 400)
    relayout()
    return () => {
      window.removeEventListener('scroll', trace)
      window.removeEventListener('resize', relayout)
      io.disconnect()
      clearTimeout(t1)
    }
  }, [])

  // Réalisations bento — ordre mélangé à chaque chargement
  useEffect(() => {
    setReels(prev => {
      const a = [...prev]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    })
  }, [])

  // Réalisations bento — ne joue que les vidéos visibles (perfs)
  useEffect(() => {
    const tiles = Array.from(document.querySelectorAll<HTMLVideoElement>('.lv2-bento-tile video'))
    if (!tiles.length) return
    const io = new IntersectionObserver(
      es => es.forEach(e => {
        const v = e.target as HTMLVideoElement
        if (e.isIntersecting) v.play().catch(() => {}); else v.pause()
      }),
      { threshold: 0.12 },
    )
    tiles.forEach(v => io.observe(v))
    return () => io.disconnect()
  }, [reels])
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

  // ── Promo handlers ──────────────────────────────────────────────────────
  const handleDismissBanner = () => {
    setPromoBannerVisible(false)
    localStorage.setItem('sceniq-promo-dismissed', '1')
  }

  const handlePromoSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setPromoLoading(true)
    try {
      const res = await fetch('/api/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    promoForm.name,
          email:   promoForm.email,
          phone:   promoForm.phone || null,
          company: promoForm.company || null,
          brief:   promoForm.brief,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      setPromoSent(true)
    } catch {
      // Fallback mailto
      const subject = encodeURIComponent(`Reel 8s offert — ${promoForm.name}`)
      const body = encodeURIComponent(
        `Prénom : ${promoForm.name}\nEmail : ${promoForm.email}${promoForm.phone ? `\nTéléphone : ${promoForm.phone}` : ''}${promoForm.company ? `\nEntreprise : ${promoForm.company}` : ''}\n\nBrief :\n${promoForm.brief}`
      )
      window.open(`mailto:support@sceniq.studio?subject=${subject}&body=${body}`, '_blank')
      setPromoSent(true)
    } finally {
      setPromoLoading(false)
    }
  }

  // ── ESC + body scroll lock ──────────────────────────────────────────────
  useEffect(() => {
    if (!openVideo && !mobileMenuOpen && !questionOpen && !promoOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenVideo(null)
        setMobileMenuOpen(false)
        setQuestionOpen(false)
        setPromoOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openVideo, mobileMenuOpen, questionOpen, promoOpen])

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
      anchorHandlers.forEach(({ a, handler }) => a.removeEventListener('click', handler))
    }
  }, [])

  // ── Autoplay vidéos — approche multi-stratégie iOS Safari ──────────────
  //
  // Problème : saturation bande passante mobile — 32 vidéos hero + 26 portfolio
  // + 3 vidéos section = ~60 vidéos peuvent toutes tenter de charger.
  //
  // Stratégie :
  //  A) Toutes les vidéos passent par IntersectionObserver (sauf modal)
  //  B) Mobile : rootMargin='0px' → charge uniquement quand visible dans le viewport
  //     Desktop : rootMargin='300px 0px' → précharge 300px avant entrée viewport
  //  C) Mobile : file d'attente max 2 chargements simultanés
  //  D) Hero columns : les vidéos hors-écran (hidden CSS) sont skip automatiquement
  //     par l'IO car elles n'intersectent jamais le viewport
  const videoObsRef = useRef<IntersectionObserver | null>(null)

  // Crée l'observer une fois — persistant (pas de cleanup sur shuffle)
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    // Mobile : charge uniquement au contact du viewport pour éviter la saturation
    // Desktop : précharge 300px avant pour une expérience fluide
    const rootMargin = isMobile ? '0px 0px' : '300px 0px'
    // Mobile : max 2 vidéos en cours de chargement simultanément
    const MAX_CONCURRENT = isMobile ? 2 : 20
    let activeLoads = 0
    const loadQueue: HTMLVideoElement[] = []

    function processQueue() {
      while (loadQueue.length > 0 && activeLoads < MAX_CONCURRENT) {
        const vid = loadQueue.shift()!
        startLoad(vid)
      }
    }

    function startLoad(vid: HTMLVideoElement) {
      if (vid.networkState === 2) return // déjà en cours de chargement réseau
      activeLoads++
      const onDone = () => {
        activeLoads = Math.max(0, activeLoads - 1)
        processQueue()
      }
      // canplay = assez de données pour démarrer la lecture sans stall
      vid.addEventListener('canplay', () => { vid.play().catch(() => {}); onDone() }, { once: true })
      vid.addEventListener('error', onDone, { once: true })
      vid.load() // reset + charge depuis le début (nécessaire même si preload="metadata")
    }

    function enqueue(vid: HTMLVideoElement) {
      // HAVE_FUTURE_DATA (3) / HAVE_ENOUGH_DATA (4) = vraiment prêt à jouer
      if (vid.readyState >= 3) {
        if (vid.paused) vid.play().catch(() => {})
        return
      }
      // En cours de chargement réseau (networkState=2) → juste attacher le listener play
      if (vid.networkState === 2) {
        vid.addEventListener('canplay', () => vid.play().catch(() => {}), { once: true })
        return
      }
      // readyState=0 ou readyState=1 (preload=metadata → metadata only, pas de data vidéo)
      // → charger via la queue
      if (activeLoads < MAX_CONCURRENT) {
        startLoad(vid)
      } else {
        if (!loadQueue.includes(vid)) loadQueue.push(vid)
      }
    }

    const handler = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        const vid = entry.target as HTMLVideoElement
        if (entry.isIntersecting) {
          enqueue(vid)
        } else {
          // Retire de la file si pas encore chargé (économie bande passante)
          const qi = loadQueue.indexOf(vid)
          if (qi !== -1) loadQueue.splice(qi, 1)
          if (!vid.paused) vid.pause()
        }
      })
    }

    const obs = new IntersectionObserver(handler, { rootMargin, threshold: 0 })
    videoObsRef.current = obs

    // Observe TOUTES les vidéos sauf le modal — hero + section + portfolio
    // Les vidéos hero CSS-masquées (display:none) n'intersecteront jamais → skip naturel
    document.querySelectorAll('video:not(#modal-video)').forEach(v => obs.observe(v))

    return () => {
      obs.disconnect()
      videoObsRef.current = null
    }
  }, [])

  // Re-observe les vidéos portfolio après shuffle (nouveaux éléments DOM)
  useEffect(() => {
    const obs = videoObsRef.current
    if (!obs) return
    document.querySelectorAll('.portfolio-card video').forEach(v => obs.observe(v))
  }, [portfolioRows])

  // ════════════════════════════════════════════════════════════════════════
  //  JSX
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className={`lv2${promoBannerVisible ? ' lv2--banner' : ''}`}>

      {/* ── PROMO BANNER ─────────────────────────────────────────────────── */}
      {promoBannerVisible && (
        <div className="lv2-promo-banner" role="banner" aria-label={t.promoBanner.badge}>
          <span className="lv2-promo-badge">{t.promoBanner.badge}</span>
          <span className="lv2-promo-text">
            <span className="promo-long">{t.promoBanner.text}</span>
            <span className="promo-short">{t.promoBanner.textShort}</span>
          </span>
          <button
            type="button"
            className="lv2-promo-cta"
            onClick={() => setPromoOpen(true)}
          >
            {t.promoBanner.ctaShort}
          </button>
          <button
            type="button"
            className="lv2-promo-close"
            onClick={handleDismissBanner}
            aria-label={t.promoBanner.close}
          >×</button>
        </div>
      )}

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="lv2-nav" aria-label="Navigation principale">
        <div className="lv2-nav-inner">
          <a href="#" className="lv2-nav-logo" aria-label="ScenIQ — Accueil">
            <svg height="56" viewBox="0 0 234 86" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ width: 'auto', display: 'block' }}>
              <path opacity="0.35" d="M42.5303 85.5312C61.308 85.5312 76.5303 82.845 76.5303 79.5312C76.5303 76.2175 61.308 73.5312 42.5303 73.5312C23.7526 73.5312 8.53027 76.2175 8.53027 79.5312C8.53027 82.845 23.7526 85.5312 42.5303 85.5312Z" fill="#5055C0"/>
              <path opacity="0.25" d="M41.5303 81.5312C55.8897 81.5312 67.5303 79.7404 67.5303 77.5312C67.5303 75.3221 55.8897 73.5312 41.5303 73.5312C27.1709 73.5312 15.5303 75.3221 15.5303 77.5312C15.5303 79.7404 27.1709 81.5312 41.5303 81.5312Z" fill="#5055C0"/>
              <path className="lv2-gem" d="M51.4939 2.50519L17.8248 7.23707C7.98045 8.62061 1.12158 17.7226 2.50512 27.567L7.237 61.2361C8.62054 71.0805 17.7226 77.9394 27.5669 76.5558L61.2361 71.8239C71.0804 70.4404 77.9393 61.3384 76.5558 51.494L71.8239 17.8249C70.4403 7.98052 61.3383 1.12165 51.4939 2.50519Z" fill="url(#navlg)"/>
              <path d="M35.6337 11.8034C37.4429 24.6769 52.404 37.7216 65.2775 35.9124C52.404 37.7216 41.6181 54.3849 43.4274 67.2584C41.6181 54.3849 26.6571 41.3401 13.7836 43.1494C26.6571 41.3401 37.4429 24.6769 35.6337 11.8034Z" fill="white"/>
              <path d="M216.886 39.9121H222.375L225.134 43.4618L227.849 46.6238L232.964 53.0371H226.939L223.419 48.7118L221.614 46.1465L216.886 39.9121ZM233.427 35.2587C233.427 38.5897 232.795 41.4235 231.533 43.7601C230.28 46.0968 228.57 47.8816 226.402 49.1145C224.244 50.3375 221.818 50.949 219.124 50.949C216.409 50.949 213.973 50.3326 211.815 49.0996C209.658 47.8667 207.952 46.0819 206.7 43.7452C205.447 41.4086 204.82 38.5797 204.82 35.2587C204.82 31.9277 205.447 29.0939 206.7 26.7573C207.952 24.4206 209.658 22.6408 211.815 21.4178C213.973 20.1848 216.409 19.5684 219.124 19.5684C221.818 19.5684 224.244 20.1848 226.402 21.4178C228.57 22.6408 230.28 24.4206 231.533 26.7573C232.795 29.0939 233.427 31.9277 233.427 35.2587ZM226.879 35.2587C226.879 33.101 226.556 31.2814 225.91 29.7999C225.273 28.3184 224.374 27.1948 223.21 26.4292C222.047 25.6635 220.685 25.2807 219.124 25.2807C217.562 25.2807 216.2 25.6635 215.037 26.4292C213.874 27.1948 212.969 28.3184 212.322 29.7999C211.686 31.2814 211.368 33.101 211.368 35.2587C211.368 37.4164 211.686 39.236 212.322 40.7175C212.969 42.199 213.874 43.3226 215.037 44.0882C216.2 44.8539 217.562 45.2367 219.124 45.2367C220.685 45.2367 222.047 44.8539 223.21 44.0882C224.374 43.3226 225.273 42.199 225.91 40.7175C226.556 39.236 226.879 37.4164 226.879 35.2587Z" fill="#9090F8"/>
              <path d="M200.044 19.9863V50.5318H193.586V19.9863H200.044Z" fill="#9090F8"/>
              <path d="M173.693 37.2873V50.5316H167.339V27.6225H173.394V31.6644H173.663C174.17 30.332 175.02 29.2781 176.213 28.5025C177.406 27.717 178.853 27.3242 180.553 27.3242C182.144 27.3242 183.531 27.6722 184.715 28.3683C185.898 29.0643 186.818 30.0586 187.474 31.3512C188.13 32.6339 188.458 34.1651 188.458 35.945V50.5316H182.104V37.0785C182.114 35.6765 181.756 34.5827 181.031 33.7972C180.305 33.0018 179.305 32.604 178.033 32.604C177.178 32.604 176.422 32.788 175.766 33.1559C175.119 33.5238 174.612 34.0607 174.244 34.7667C173.886 35.4627 173.703 36.3029 173.693 37.2873Z" fill="white"/>
              <path d="M152.678 50.979C150.321 50.979 148.293 50.5018 146.592 49.5472C144.902 48.5827 143.599 47.2205 142.685 45.4606C141.77 43.6907 141.312 41.5977 141.312 39.1815C141.312 36.8249 141.77 34.7567 142.685 32.9769C143.599 31.1971 144.887 29.81 146.548 28.8157C148.218 27.8214 150.177 27.3242 152.424 27.3242C153.935 27.3242 155.342 27.5678 156.645 28.055C157.957 28.5323 159.101 29.2532 160.075 30.2177C161.06 31.1822 161.825 32.3952 162.372 33.8569C162.919 35.3086 163.192 37.0089 163.192 38.9577V40.7028H143.848V36.7653H157.212C157.212 35.8505 157.013 35.0401 156.615 34.3342C156.217 33.6282 155.665 33.0763 154.96 32.6786C154.263 32.271 153.453 32.0671 152.528 32.0671C151.564 32.0671 150.709 32.2908 149.963 32.7383C149.227 33.1758 148.651 33.7674 148.233 34.5131C147.815 35.2489 147.602 36.0692 147.592 36.9741V40.7177C147.592 41.8512 147.8 42.8306 148.218 43.6559C148.646 44.4812 149.247 45.1175 150.023 45.565C150.798 46.0124 151.718 46.2361 152.782 46.2361C153.488 46.2361 154.134 46.1367 154.721 45.9379C155.308 45.739 155.81 45.4407 156.227 45.043C156.645 44.6452 156.963 44.158 157.182 43.5813L163.058 43.9691C162.76 45.381 162.148 46.614 161.224 47.668C160.309 48.712 159.126 49.5273 157.674 50.114C156.232 50.6907 154.567 50.979 152.678 50.979Z" fill="white"/>
              <path d="M127.938 50.979C125.591 50.979 123.573 50.4819 121.882 49.4876C120.202 48.4833 118.909 47.0913 118.004 45.3114C117.11 43.5316 116.662 41.4833 116.662 39.1665C116.662 36.82 117.115 34.7617 118.019 32.9918C118.934 31.212 120.232 29.8249 121.912 28.8306C123.593 27.8263 125.591 27.3242 127.908 27.3242C129.906 27.3242 131.656 27.6871 133.158 28.413C134.659 29.1388 135.847 30.158 136.722 31.4705C137.597 32.783 138.08 34.3242 138.169 36.0941H132.173C132.004 34.9506 131.557 34.0309 130.831 33.3349C130.115 32.6289 129.176 32.2759 128.012 32.2759C127.028 32.2759 126.168 32.5444 125.432 33.0813C124.706 33.6083 124.139 34.3789 123.732 35.3931C123.324 36.4073 123.12 37.6353 123.12 39.0771C123.12 40.5387 123.319 41.7816 123.717 42.8058C124.124 43.8299 124.696 44.6104 125.432 45.1474C126.168 45.6843 127.028 45.9528 128.012 45.9528C128.738 45.9528 129.389 45.8036 129.966 45.5053C130.553 45.207 131.035 44.7745 131.413 44.2077C131.801 43.631 132.054 42.94 132.173 42.1346H138.169C138.07 43.8846 137.593 45.4258 136.737 46.7582C135.892 48.0806 134.724 49.1147 133.232 49.8604C131.741 50.6062 129.976 50.979 127.938 50.979Z" fill="white"/>
              <path d="M106.756 28.7708C106.637 27.5676 106.124 26.633 105.22 25.9668C104.315 25.3006 103.087 24.9675 101.536 24.9675C100.482 24.9675 99.5918 25.1167 98.8659 25.415C98.1401 25.7033 97.5833 26.106 97.1955 26.623C96.8176 27.1401 96.6287 27.7267 96.6287 28.383C96.6088 28.9299 96.7232 29.4071 96.9718 29.8148C97.2303 30.2225 97.5833 30.5755 98.0307 30.8738C98.4782 31.1621 98.9952 31.4157 99.5819 31.6344C100.169 31.8432 100.795 32.0222 101.461 32.1713L104.205 32.8276C105.538 33.1259 106.761 33.5236 107.874 34.0208C108.988 34.5179 109.953 35.1294 110.768 35.8553C111.583 36.5811 112.215 37.4363 112.662 38.4206C113.119 39.405 113.353 40.5336 113.363 41.8063C113.353 43.6756 112.876 45.2963 111.931 46.6685C110.997 48.0307 109.644 49.0897 107.874 49.8453C106.115 50.5911 103.992 50.964 101.506 50.964C99.04 50.964 96.8922 50.5861 95.0627 49.8304C93.2431 49.0748 91.8212 47.9561 90.7971 46.4746C89.7828 44.9831 89.2509 43.1387 89.2012 40.9412H95.4505C95.5201 41.9654 95.8134 42.8205 96.3304 43.5066C96.8574 44.1827 97.5584 44.6948 98.4334 45.0428C99.3184 45.3809 100.318 45.5499 101.431 45.5499C102.525 45.5499 103.475 45.3908 104.28 45.0726C105.095 44.7544 105.727 44.312 106.174 43.7452C106.622 43.1784 106.845 42.5272 106.845 41.7914C106.845 41.1053 106.642 40.5286 106.234 40.0613C105.836 39.5939 105.249 39.1962 104.474 38.8681C103.708 38.54 102.769 38.2417 101.655 37.9732L98.329 37.138C95.7537 36.5115 93.7203 35.5321 92.2289 34.1998C90.7374 32.8674 89.9966 31.0726 90.0066 28.8155C89.9966 26.9661 90.4888 25.3503 91.4831 23.9682C92.4874 22.5861 93.8645 21.5073 95.6145 20.7317C97.3645 19.9561 99.3532 19.5684 101.58 19.5684C103.847 19.5684 105.826 19.9561 107.517 20.7317C109.217 21.5073 110.539 22.5861 111.484 23.9682C112.428 25.3503 112.916 26.9512 112.945 28.7708H106.756Z" fill="white"/>
              <defs><linearGradient id="navlg" x1="0" y1="9.74219" x2="79.0609" y2="69.3188" gradientUnits="userSpaceOnUse"><stop stopColor="#8485F8"/><stop offset="1" stopColor="#4F52D8"/></linearGradient></defs>
            </svg>
          </a>
          <ul className="lv2-nav-links">
            <li><a href="#process">{t.nav.process}</a></li>
            <li><a href="#studio-ia">{t.nav.studioIA}</a></li>
            <li><a href="#modeles">{t.nav.models}</a></li>
            <li><a href="#tarifs">{t.nav.pricing}</a></li>
            <li><a href="#comparaison">{t.nav.comparison}</a></li>
            <li><a href="#reels">{t.nav.portfolio}</a></li>
          </ul>
          <div className="lv2-nav-right">
            <a href="#faq" className="lv2-btn lv2-btn-ghost lv2-btn-sm">
              {t.nav.question}
            </a>
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
              <li><a href="#studio-ia" onClick={() => setMobileMenuOpen(false)}>{t.nav.studioIA}</a></li>
              <li><a href="#modeles"  onClick={() => setMobileMenuOpen(false)}>{t.nav.models}</a></li>
              <li><a href="#tarifs"      onClick={() => setMobileMenuOpen(false)}>{t.nav.pricing}</a></li>
              <li><a href="#comparaison" onClick={() => setMobileMenuOpen(false)}>{t.nav.comparison}</a></li>
              <li><a href="#reels"       onClick={() => setMobileMenuOpen(false)}>{t.nav.portfolio}</a></li>
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
              <a
                href="#faq"
                className="lv2-btn lv2-btn-ghost"
                onClick={() => setMobileMenuOpen(false)}
                style={{ justifyContent: 'center' }}
              >
                {t.nav.question}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO — 2 cols gauche · centre vide · 2 cols droite ──────────── */}
      <section className="lv2-hero" id="main-content" aria-label="Hero ScenIQ">
        <div className="lv2-hbg" aria-hidden="true">
          {/* ── Mur 3D plein cadre — 7 colonnes ── */}
          <div className="lv2-wall">
            {COL_SLUGS.map((slugs, c) => (
              <div
                key={c}
                className={`lv2-hcol${c % 2 === 1 ? ' down' : ''}`}
                style={{
                  animationDuration: `${COL_DURATIONS[c]}s`,
                  animationDelay:    `${COL_DELAYS[c]}s`,
                }}
              >
                {[...slugs, ...slugs].map((slug, i) => (
                  <div key={`${slug}-${c}-${i}`} className="lv2-hcard">
                    <video autoPlay muted loop playsInline preload="none">
                      <source src={showcaseUrl(slug)} type="video/mp4" />
                    </video>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="lv2-hover" aria-hidden="true" />
        <div className="lv2-hcontent">
          <div className="lv2-badge lv2-badge--ticker">
            <span className="lv2-badge-pill">{t.hero.badge}</span>
            <div className="lv2-ticker-wrap" aria-hidden="true">
              <div className="lv2-ticker-track">
                {(lang === 'fr' ? TICKER_FR : TICKER_EN).map((b, i) => (
                  <span key={i} className="lv2-ticker-item">✦ {b}</span>
                ))}
                {(lang === 'fr' ? TICKER_FR : TICKER_EN).map((b, i) => (
                  <span key={`d${i}`} className="lv2-ticker-item" aria-hidden="true">✦ {b}</span>
                ))}
              </div>
              <div className="lv2-ticker-fade" />
            </div>
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
        <div className="lv2-cue" aria-hidden="true"><i /></div>
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
            <h2>{t.process.h2a}<br /><span className="gx">{t.process.h2b}</span></h2>
            <p className="lv2-s-sub" style={{ maxWidth: 480, margin: '16px auto 0' }}>{t.process.sub}</p>
          </div>
          <div className="lv2-tl" id="lv2-tl">
            <div className="lv2-tl-rail" />
            <div className="lv2-tl-fill" id="lv2-tl-fill" />
            {t.process.steps.map((step) => (
              <div key={step.n} className="lv2-tl-step">
                <div className="lv2-tl-node">{step.n}</div>
                <div className="lv2-tl-c">
                  <h3 className="lv2-tl-title">{step.title}</h3>
                  <p className="lv2-tl-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAS CONCRET — produit en situation via Studio IA ─────────────── */}
      <section className="lv2-s" id="studio-ia">
        <div className="lv2-si">
          {/* En-tête commun */}
          <div className="rv" style={{ textAlign: 'center' }}>
            <div className="lv2-label">{t.caseStudy.sectionLabel}</div>
            <p className="lv2-s-sub" style={{ maxWidth: 520, margin: '12px auto 0' }}>{t.caseStudy.sectionIntro}</p>
          </div>

          {/* Onglets */}
          <div className="rv" role="tablist" aria-label={t.caseStudy.sectionLabel}
            style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '32px 0 48px' }}>
            {([['case', t.caseStudy.tabCase], ['team', t.caseStudy.tabTeam], ['seedance', t.caseStudy.tabSeedance]] as const).map(([key, label]) => {
              const active = studioTab === key
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStudioTab(key)}
                  style={{
                    padding: '10px 22px', borderRadius: 999, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                    border: active ? '1px solid transparent' : '1px solid var(--bdr-md)',
                    background: active ? '#7C5CFC' : 'var(--surface)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Contenu selon l'onglet */}
          <div className="lv2-split lv2-split-reverse rv">
            <div>
              {studioTab === 'case' ? (
                <>
                  <h2>{t.caseStudy.h2a}<br /><span className="gx">{t.caseStudy.h2b}</span></h2>
                  <p className="lv2-s-sub" style={{ marginTop: 16 }}>{t.caseStudy.body1}</p>
                  <p className="lv2-s-sub" style={{ marginTop: 16 }}>{t.caseStudy.body2}</p>
                  <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <span className="lv2-label" style={{ margin: 0 }}>{t.caseStudy.promise}</span>
                    <a href="/commande" className="lv2-btn lv2-btn-accent">{t.caseStudy.cta}</a>
                  </div>
                </>
              ) : studioTab === 'team' ? (
                <>
                  <h2>{t.studio.h2a}<br /><span className="gx">{t.studio.h2b}</span></h2>
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
                </>
              ) : (
                <>
                  <div className="lv2-label">{t.seedance.label}</div>
                  <h2>{t.seedance.h2a}<br /><span className="gx">{t.seedance.h2b}</span></h2>
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
                </>
              )}
            </div>
            <div>
              {studioTab === 'seedance' ? (
                /* Seedance — un seul grand clip 16:9 (validé) */
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
                  <video autoPlay muted loop playsInline preload="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', pointerEvents:'none' }}>
                    <source src={showcaseUrl('exemple19')} type="video/mp4" />
                  </video>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="play-overlay">
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(124,92,252,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 16 16" fill="white" width="16" height="16"><polygon points="4,2 14,8 4,14"/></svg>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenVideo(studioTab === 'case' ? 'exemple12' : 'volt')}
                  style={{
                    display: 'block', width: '100%',
                    aspectRatio: studioTab === 'case' ? '1/1' : '16/9', borderRadius: 14, overflow: 'hidden',
                    background: 'var(--surface)', border: '1px solid var(--bdr-md)',
                    position: 'relative', cursor: 'pointer', padding: 0,
                  }}
                  aria-label={studioTab === 'case' ? t.caseStudy.videoAria : t.studio.videoAria}
                >
                  <video
                    key={studioTab}
                    autoPlay muted loop playsInline preload="none"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                  >
                    <source src={showcaseUrl(studioTab === 'case' ? 'exemple12' : 'volt')} type="video/mp4" />
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
              )}
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
              <h2>{t.models.h2a}<br /><span className="gx">{t.models.h2b}</span></h2>
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

                {/* Mivael — pleine hauteur */}
                <div style={{
                  borderRadius: 14, overflow: 'hidden', position: 'relative', height: '100%',
                  background: 'linear-gradient(160deg,#1a0f3a,#0e0e1a)',
                  border: '1px solid rgba(124,92,252,0.35)',
                }}>
                  <img src="/models/kaelys.jpg" alt="Mivael"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  {/* Badge IA */}
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(7,7,15,0.82)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: 'rgba(165,180,252,0.7)' }}>IA</div>
                  {/* Info overlay */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 14px 14px', background: 'linear-gradient(to top,rgba(7,7,15,0.97),transparent)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(165,180,252,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.models.renderLabel}</div>
                    <a
                      href={t.models.kaelysIG}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', fontSize: 12, color: 'rgba(165,180,252,0.9)', marginTop: 3, textDecoration: 'none', fontWeight: 600 }}
                    >
                      {t.models.kaelysHandle}
                    </a>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t.models.kaelysType.replace(t.models.kaelysHandle + ' · ', '')}</div>
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
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.models.modelCardLabel}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>{m.type}</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
              {/* Note Mivael — brand partner */}
              <div style={{
                marginTop: 10, padding: '14px 16px', borderRadius: 12,
                border: '1px solid rgba(124,92,252,0.3)',
                background: 'rgba(124,92,252,0.06)',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
                <p style={{ fontSize: 12, color: 'var(--g5)', lineHeight: 1.6, margin: 0 }}>
                  {t.models.kaelysPartnerNote.split(t.models.kaelysHandle).map((part, i, arr) =>
                    i < arr.length - 1
                      ? <span key={i}>{part}<a href={t.models.kaelysIG} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(165,180,252,0.9)', fontWeight: 600, textDecoration: 'none' }}>{t.models.kaelysHandle}</a></span>
                      : <span key={i}>{part}</span>
                  )}
                </p>
              </div>
              {/* Note exemples */}
              <div style={{
                marginTop: 8, padding: '12px 16px', borderRadius: 12,
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
                    <li className="lv2-price-perk">{t.pricing.perks.shots(p.shots)}</li>
                    <li className="lv2-price-perk" style={{ color:'var(--g6)', fontWeight:400, fontSize:'0.9em' }}>{t.pricing.perks.formats}</li>
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
            <h2>{t.portfolio.h2a} <span style={{ color: 'var(--g4)', fontWeight: 400 }}>+</span> <span className="gx">{t.portfolio.h2b}</span></h2>
            <p style={{ color: 'var(--g4)', fontSize: 17, marginTop: 10, maxWidth: 460 }}>
              {t.portfolio.sub}
            </p>
          </div>
        </div>

        <div className="lv2-si">
          <div className="lv2-bento">
            {reels.map((v) => (
              <button
                key={v.slug}
                type="button"
                className="lv2-bento-tile"
                onClick={() => setOpenVideo(v.slug)}
                aria-label="Voir un exemple de vidéo"
              >
                <video
                  autoPlay muted loop playsInline preload="metadata"
                  style={{ aspectRatio: String(v.ratio) }}
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget
                    if (vid.videoWidth && vid.videoHeight) vid.style.aspectRatio = `${vid.videoWidth} / ${vid.videoHeight}`
                  }}
                >
                  <source src={showcaseUrl(v.slug)} type="video/mp4" />
                </video>
                <span className="lv2-bento-play" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="#fff" width="17" height="17"><polygon points="4,2 14,8 4,14"/></svg>
                </span>
              </button>
            ))}
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
            <h2>{t.testimonials.h2a}<br /><span className="gx">{t.testimonials.h2b}</span></h2>
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

      {/* ── COMPARAISON ──────────────────────────────────────────────────── */}
      <section id="comparaison" className="lv2-s">
        <div className="lv2-si">
          <div className="cmp-label">{t.comparison.label}</div>
          <h2 className="cmp-h2">
            {t.comparison.h2a}<br /><span className="gx">{t.comparison.h2b}</span>
          </h2>
          <p className="cmp-sub">{t.comparison.sub}</p>
          <div className="cmp-table">
            <div className="cmp-header">
              <div className="cmp-col-label"></div>
              <div className="cmp-col sceniq"><span className="cmp-pill">ScenIQ</span></div>
              <div className="cmp-col tools">{t.comparison.colTools}</div>
            </div>
            {t.comparison.rows.map((row, i) => (
              <div key={row.label} className={`cmp-row${i === t.comparison.rows.length - 1 ? ' cmp-row--last' : ''}`}>
                <div className="cmp-col-label">{row.label}</div>
                <div className="cmp-col sceniq">
                  {row.sceniqType === 'yes'   && <span className="cmp-yes">{row.sceniq}</span>}
                  {row.sceniqType === 'check' && <><span className="cmp-check">✓</span> {row.sceniq}</>}
                </div>
                <div className="cmp-col tools">
                  {row.toolsType === 'muted' && <span className="cmp-muted">{row.tools}</span>}
                  {row.toolsType === 'cross' && <><span className="cmp-cross">✕</span> {row.tools}</>}
                </div>
              </div>
            ))}
          </div>
          <p className="cmp-note">{t.comparison.note}</p>
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
                <div key={item.q} className={`fi${faqOpen === item.q ? ' open' : ''}`}>
                  <button
                    className="fq"
                    onClick={() => setFaqOpen(faqOpen === item.q ? null : item.q)}
                    aria-expanded={faqOpen === item.q}
                  >
                    {item.q}
                    <span className="fi-ico">{faqOpen === item.q ? '−' : '+'}</span>
                  </button>
                  <div className="fa">{item.a}</div>
                </div>
              ))}
            </div>

            {/* Colonne droite */}
            <div className="lv2-faq-col">
              {t.faq.right.map((item) => (
                <div key={item.q} className={`fi${faqOpen === item.q ? ' open' : ''}`}>
                  <button
                    className="fq"
                    onClick={() => setFaqOpen(faqOpen === item.q ? null : item.q)}
                    aria-expanded={faqOpen === item.q}
                  >
                    {item.q}
                    <span className="fi-ico">{faqOpen === item.q ? '−' : '+'}</span>
                  </button>
                  <div className="fa">{item.a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Bloc humain — réponse directe ── */}
          <div className="rv" style={{ marginTop: 56 }}>
            <div style={{
              maxWidth: 560, margin: '0 auto',
              textAlign: 'center',
              padding: '36px 32px',
              borderRadius: 20,
              background: 'rgba(124,92,252,0.06)',
              border: '1px solid rgba(124,92,252,0.2)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>💬</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10, lineHeight: 1.25 }}>
                {t.faq.ctaH3}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--g5)', lineHeight: 1.7, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                {t.faq.ctaSub}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setQuestionOpen(true); setQuestionSent(false) }}
                  className="lv2-btn lv2-btn-accent"
                  style={{ borderRadius: 100 }}
                >
                  {t.faq.ctaBtn1}
                </button>
                <a
                  href="tel:+33756808831"
                  className="lv2-btn lv2-btn-ghost"
                  style={{ borderRadius: 100 }}
                >
                  {t.faq.ctaBtn2}
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="lv2-final-cta">
        <div className="lv2-cta-orb a" aria-hidden="true" />
        <div className="lv2-cta-orb b" aria-hidden="true" />
        <div className="lv2-si">
          <div className="lv2-final-cta-inner">
            <div className="lv2-label" style={{ margin: '0 auto 20px' }}>{t.cta.label}</div>
            <h2>{t.cta.h2a}<br /><span className="gx">{t.cta.h2b}</span></h2>
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
              <li><a href="/cgv">{t.footer.links.cgv}</a></li>
            </ul>
          </div>
        </div>
        <div className="lv2-footer-bottom">
          <span>{t.footer.bottom1}</span>
          <span>{t.footer.bottom2}</span>
        </div>
      </footer>

      {/* ── MODALE PROMO — Reel 8s offert ──────────────────────────────── */}
      {promoOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPromoOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Réclamer votre reel offert"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0E0E1A',
              border: '1px solid rgba(124,92,252,0.25)',
              borderRadius: 20, padding: '32px',
              width: '100%', maxWidth: 480,
              maxHeight: '90vh', overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 0 60px rgba(124,92,252,0.18), 0 32px 64px rgba(0,0,0,0.6)',
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setPromoOpen(false)}
              aria-label={t.promoModal.closeAria}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                color: 'rgba(255,255,255,0.55)', fontSize: 18, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
              }}
            >×</button>

            {!promoSent ? (
              <div>
                {/* Header */}
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#A5B4FC',
                  background: 'rgba(124,92,252,0.12)',
                  border: '1px solid rgba(124,92,252,0.25)',
                  borderRadius: 100, display: 'inline-block',
                  padding: '4px 10px', marginBottom: 16,
                }}>{t.promoModal.badge}</div>

                <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 10, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                  {t.promoModal.h3}
                </h3>
                <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.65, marginBottom: 24 }}>
                  {t.promoModal.sub}
                </p>

                <form onSubmit={handlePromoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Prénom + Email */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                        {t.promoModal.labelName}
                      </label>
                      <input
                        type="text" required placeholder={t.promoModal.placeName}
                        value={promoForm.name}
                        onChange={(e) => setPromoForm((f) => ({ ...f, name: e.target.value }))}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                          padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                        {t.promoModal.labelEmail}
                      </label>
                      <input
                        type="email" required placeholder={t.promoModal.placeEmail}
                        value={promoForm.email}
                        onChange={(e) => setPromoForm((f) => ({ ...f, email: e.target.value }))}
                        style={{
                          width: '100%', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                          padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      {t.promoModal.labelPhone}
                    </label>
                    <input
                      type="tel" placeholder={t.promoModal.placePhone}
                      value={promoForm.phone}
                      onChange={(e) => setPromoForm((f) => ({ ...f, phone: e.target.value }))}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Entreprise */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      {t.promoModal.labelCompany}
                    </label>
                    <input
                      type="text" placeholder={t.promoModal.placeCompany}
                      value={promoForm.company}
                      onChange={(e) => setPromoForm((f) => ({ ...f, company: e.target.value }))}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Brief */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      {t.promoModal.labelBrief}
                    </label>
                    <textarea
                      required rows={4}
                      placeholder={t.promoModal.placeBrief}
                      value={promoForm.brief}
                      onChange={(e) => setPromoForm((f) => ({ ...f, brief: e.target.value }))}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        padding: '10px 12px', color: '#fff', fontSize: 14, fontFamily: 'inherit',
                        outline: 'none', resize: 'vertical', lineHeight: 1.6,
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={promoLoading}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 100,
                      background: promoLoading ? 'rgba(124,92,252,0.5)' : 'var(--accent, #7C5CFC)',
                      color: '#fff', fontSize: 15, fontWeight: 700, cursor: promoLoading ? 'wait' : 'pointer',
                      border: 'none', fontFamily: 'inherit',
                      boxShadow: '0 0 22px rgba(124,92,252,0.35)',
                      transition: 'background .15s',
                    }}
                  >
                    {promoLoading ? '…' : t.promoModal.submit}
                  </button>
                  <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', margin: 0 }}>
                    {t.promoModal.footer}
                  </p>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                  {t.promoModal.sentTitle}
                </h3>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
                  {t.promoModal.sentSub}
                </p>
                <button
                  type="button"
                  onClick={() => { setPromoOpen(false); setPromoSent(false) }}
                  style={{
                    background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)',
                    borderRadius: 100, padding: '10px 24px',
                    color: '#A5B4FC', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {t.promoModal.sentClose}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
              src={showcaseUrl(openVideo!)}
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
