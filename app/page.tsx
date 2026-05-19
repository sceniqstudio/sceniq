'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { ShowcaseClip } from '@/app/_components/ShowcaseClip'

const SHOWCASE_SLUGS = [
  'exemple1', 'exemple2', 'exemple3', 'exemple4', 'exemple5', 'exemple6',
  'exemple7', 'exemple8', 'exemple9', 'exemple10', 'exemple11', 'exemple12',
  'exemple13', 'exemple14', 'exemple15', 'exemple16', 'exemple17',
] as const

// ── Hero animated columns ──────────────────────────────────────────────────
const COL_DURATIONS = [32, 26, 38, 22, 28, 36, 24, 34]
const COL_DELAYS    = [-6, -14, -2, -18, -8, -20, -4, -12]
const COL_SLUGS     = Array.from({ length: 8 }, (_, c) =>
  Array.from({ length: 6 }, (_, i) => SHOWCASE_SLUGS[(c * 3 + i) % SHOWCASE_SLUGS.length])
)

export default function HomePage() {
  const [openVideo, setOpenVideo]           = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sdSlide, setSdSlide]               = useState(0)
  const [questionOpen, setQuestionOpen]     = useState(false)
  const [questionSent, setQuestionSent]     = useState(false)
  const [qForm, setQForm]                   = useState({ name: '', email: '', message: '' })

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
          ;[...e.target.querySelectorAll('.step,.ag,.plan,.fi,.vc')].forEach((c, i) => {
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

    // FAQ accordion
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

    // Carousel — scroll natif + drag souris + dots synchronisés
    const track = document.getElementById('carTrack') as HTMLElement | null
    const prev  = document.getElementById('cPrev')  as HTMLButtonElement | null
    const next  = document.getElementById('cNext')  as HTMLButtonElement | null
    const dots  = document.getElementById('cDots')

    if (track && prev && next && dots) {
      const N    = 17
      const CW   = 220
      const GAP  = 16
      const STEP = CW + GAP

      const visible  = () => Math.max(1, Math.floor((track.clientWidth - 88) / STEP))
      const maxIndex = () => Math.max(0, N - visible())

      let cur     = 0
      let scrollT: ReturnType<typeof setTimeout> | null = null

      const renderDotState = () => {
        document.querySelectorAll('.cdot').forEach((d, j) =>
          d.classList.toggle('on', j === cur)
        )
        prev.disabled = cur === 0
        next.disabled = cur >= maxIndex()
      }

      const buildDots = () => {
        dots.innerHTML = ''
        const m = maxIndex()
        for (let i = 0; i <= m; i++) {
          const d = document.createElement('div')
          d.className = 'cdot'
          d.onclick = () => goTo(i)
          dots.appendChild(d)
        }
        renderDotState()
      }

      const goTo = (i: number) => {
        const m = maxIndex()
        cur = Math.max(0, Math.min(i, m))
        track.scrollTo({ left: cur * STEP, behavior: 'smooth' })
        renderDotState()
      }

      const onScroll = () => {
        if (scrollT) clearTimeout(scrollT)
        scrollT = setTimeout(() => {
          const i = Math.round(track.scrollLeft / STEP)
          cur = Math.max(0, Math.min(i, maxIndex()))
          renderDotState()
        }, 80)
      }
      track.addEventListener('scroll', onScroll, { passive: true })

      // Drag-to-scroll
      let isDown = false
      let startX = 0
      let startScrollLeft = 0
      let didDrag = false

      const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return
        isDown = true
        didDrag = false
        startX = e.pageX
        startScrollLeft = track.scrollLeft
        track.classList.add('dragging')
      }
      const onMouseMove = (e: MouseEvent) => {
        if (!isDown) return
        const walk = e.pageX - startX
        if (Math.abs(walk) > 4) didDrag = true
        e.preventDefault()
        track.scrollLeft = startScrollLeft - walk
      }
      const onMouseUp = () => {
        if (!isDown) return
        isDown = false
        track.classList.remove('dragging')
        if (didDrag) {
          const i = Math.round(track.scrollLeft / STEP)
          goTo(i)
        }
      }
      const onClickCapture = (e: MouseEvent) => {
        if (didDrag) {
          e.preventDefault()
          e.stopPropagation()
          didDrag = false
        }
      }

      track.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      track.addEventListener('click', onClickCapture, true)

      prev.onclick = () => goTo(cur - 1)
      next.onclick = () => goTo(cur + 1)

      buildDots()

      const onResize = () => buildDots()
      window.addEventListener('resize', onResize)

      ;(track as any).__cleanupCarousel = () => {
        track.removeEventListener('scroll', onScroll)
        track.removeEventListener('mousedown', onMouseDown)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        track.removeEventListener('click', onClickCapture, true)
        window.removeEventListener('resize', onResize)
        if (scrollT) clearTimeout(scrollT)
      }
    }

    // Smooth scroll anchors
    const anchorHandlers: Array<{ a: Element; handler: (e: Event) => void }> = []
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const handler = (e: Event) => {
        const href = a.getAttribute('href')
        if (!href || href === '#') return
        const t = document.querySelector(href)
        if (t) {
          e.preventDefault()
          ;(t as HTMLElement).scrollIntoView({ behavior: 'smooth' })
        }
      }
      a.addEventListener('click', handler)
      anchorHandlers.push({ a, handler })
    })

    return () => {
      obs.disconnect()
      fqHandlers.forEach(({ btn, handler }) => btn.removeEventListener('click', handler))
      anchorHandlers.forEach(({ a, handler }) => a.removeEventListener('click', handler))
      if (track && (track as any).__cleanupCarousel) (track as any).__cleanupCarousel()
    }
  }, [])

  // ════════════════════════════════════════════════════════════════════════
  //  JSX
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="lv2">

      {/* ── TOPBAR ───────────────────────────────────────────────────────── */}
      <div className="lv2-topbar" role="complementary" aria-label="Contact direct">
        <span className="lv2-topbar-msg">
          👋 <strong>Vous ne créez pas seul.</strong>
          <span className="lv2-topbar-hide-mob"> Contrairement à Runway, Veo ou Kling — je fais tout pour vous, de A à Z.</span>
          <span className="lv2-topbar-sep"> · </span>
          Contact direct
        </span>
        <a href="tel:+33756808831" className="lv2-topbar-phone" aria-label="Appeler Pascal au 07 56 80 88 31">
          📞 07 56 80 88 31
        </a>
      </div>

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
            <li><a href="#exemples">Réalisations</a></li>
            <li><a href="#why-seedance">Seedance 2.0</a></li>
            <li><a href="#agents">Équipe créa</a></li>
            <li><a href="#process">Le process</a></li>
            <li><a href="#pricing">Tarifs</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>

          <div className="lv2-nav-right">
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-sm">
              Lancer ma vidéo →
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
              <img
                src="/sceniq-logo-dark.svg"
                alt="ScenIQ"
                style={{ height: 36, width: 'auto' }}
              />
              <button
                className="lv2-mob-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer"
              >×</button>
            </div>
            <ul className="lv2-mob-links">
              <li><a href="#exemples"     onClick={() => setMobileMenuOpen(false)}>Réalisations</a></li>
              <li><a href="#why-seedance" onClick={() => setMobileMenuOpen(false)}>Seedance 2.0</a></li>
              <li><a href="#agents"       onClick={() => setMobileMenuOpen(false)}>Équipe créa</a></li>
              <li><a href="#process"      onClick={() => setMobileMenuOpen(false)}>Le process</a></li>
              <li><a href="#pricing"      onClick={() => setMobileMenuOpen(false)}>Tarifs</a></li>
              <li><a href="#faq"          onClick={() => setMobileMenuOpen(false)}>FAQ</a></li>
            </ul>
            <div className="lv2-mob-cta">
              <a
                href="/commande"
                className="lv2-btn lv2-btn-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                Lancer ma vidéo →
              </a>
              <a
                href="tel:+33756808831"
                className="lv2-btn lv2-btn-ghost"
                onClick={() => setMobileMenuOpen(false)}
                style={{ justifyContent: 'center' }}
              >
                📞 07 56 80 88 31
              </a>
              <p style={{ fontSize: 12, color: 'var(--g6)', textAlign: 'center', marginTop: 4 }}>
                Vous parlez directement à Pascal — pas un bot, pas un formulaire.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO — colonnes vidéos animées + contenu centré ──────────────── */}
      <section className="lv2-hero" id="main-content" aria-label="Hero ScenIQ">

        {/* BG : 8 colonnes défilantes */}
        <div className="lv2-hbg" aria-hidden="true">
          {COL_SLUGS.map((colSlugs, c) => (
            <div
              key={c}
              className={`lv2-hcol${c % 2 === 1 ? ' down' : ''}`}
              style={{
                animationDuration: `${COL_DURATIONS[c]}s`,
                animationDelay:    `${COL_DELAYS[c]}s`,
              }}
            >
              {[...colSlugs, ...colSlugs].map((slug, i) => (
                <div
                  key={`${slug}-${c}-${i}`}
                  className="lv2-hcard"
                  style={{ backgroundImage: `url(/showcase/${slug}.jpg)` }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Overlay dégradé */}
        <div className="lv2-hover" aria-hidden="true" />

        {/* Contenu centré */}
        <div className="lv2-hcontent">
          <div className="lv2-badge">
            <span className="lv2-badge-pill">Service humain</span>
            Vous parlez à une vraie personne — pas une plateforme en libre-service
          </div>

          <h1 className="lv2-h1">
            Du brief à l&apos;écran.<br />
            <em>48 heures.</em>
          </h1>

          <p className="lv2-sub">
            Deux lignes, vos références. Je m&apos;occupe du reste&nbsp;:
            concept, script, storyboard, son, génération, montage.
            MP4 prêt à poster. <strong style={{ color: '#fff' }}>69 € à 159 €</strong> selon la durée.
            Sans tokens, sans abonnement, sans surprise.
          </p>

          <div className="lv2-ctas">
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-lg">
              Lancer ma vidéo →
            </a>
            <a href="#exemples" className="lv2-btn lv2-btn-ghost lv2-btn-lg">
              Voir les réalisations
            </a>
          </div>

          <p className="lv2-footnote">
            Réponse sous 4 h ouvrées · Devis gratuit ·{' '}
            <a href="tel:+33756808831" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              📞 07 56 80 88 31
            </a>
          </p>
        </div>
      </section>

      {/* ── TRUST STRIP ──────────────────────────────────────────────────── */}
      <div className="lv2-trust">
        <div className="lv2-trust-inner">
          <span className="lv2-trust-lbl">Conçu pour</span>
          <div className="lv2-trust-items">
            <span className="lv2-trust-item">Agences pub</span>
            <span className="lv2-trust-item">Studios créa</span>
            <span className="lv2-trust-item">Social media</span>
            <span className="lv2-trust-item">Directeurs artistiques</span>
            <span className="lv2-trust-item">Brand managers</span>
          </div>
        </div>
      </div>

      {/* ── MISSION — vidéo 5 agents en BG ───────────────────────────────── */}
      <section className="lv2-mission">
        <video
          autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
        >
          <source src="/showcase/5agents.mp4" type="video/mp4" />
        </video>
        <div className="lv2-mission-overlay" aria-hidden="true" />
        <div className="lv2-mission-inner">
          <div className="lv2-mission-eye">Pas un outil. Une équipe créa.</div>
          <h2>
            Vous écrivez deux lignes. Je livre le film.<br />
            <em>Concept, storyboard, son, montage</em> — sans que vous n&apos;ouvriez aucune interface.
          </h2>
        </div>
      </section>

      {/* ── CAROUSEL EXEMPLES ────────────────────────────────────────────── */}
      <section className="lv2-s" id="exemples">
        <div className="lv2-car-head">
          <div className="lv2-label rv">Exemples de productions</div>
          <h2 className="rv">Ce que ScenIQ produit.</h2>
          <p className="rv" style={{ color: 'var(--g4)', fontSize: 17, marginTop: 10 }}>
            Chaque vidéo a été générée depuis un brief de 2 lignes.
          </p>
        </div>

        <div className="lv2-car-wrap">
          <button className="car-arrow prev" id="cPrev" aria-label="Précédent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="car-arrow next" id="cNext" aria-label="Suivant">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="car-track" id="carTrack">
            {SHOWCASE_SLUGS.map((slug) => (
              <button
                key={slug}
                type="button"
                className="vc"
                onClick={() => setOpenVideo(slug)}
                aria-label={`Lire ${slug} en grand format`}
              >
                <div className="vc-thumb">
                  <ShowcaseClip
                    slug={slug}
                    fallbackBg="linear-gradient(135deg,#1a1a22,#2d2d3a)"
                    fallbackEmoji="✦"
                    ariaLabel={`${slug}.mp4`}
                  />
                  <div className="vc-play" aria-hidden="true" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="car-nav">
          <div className="car-dots" id="cDots" />
        </div>
        <p className="car-note">✦ Vidéos générées via Seedance 2.0 depuis un brief de 2 lignes</p>
      </section>

      {/* ── WHY SEEDANCE ─────────────────────────────────────────────────── */}
      <section className="lv2-s alt" id="why-seedance">
        <div className="lv2-si">
          <div className="lv2-label rv">Pourquoi Seedance 2.0</div>
          <h2 className="rv">Le modèle vidéo IA <em>le plus avancé du marché</em>.</h2>
          <p className="lv2-s-sub rv">
            ScenIQ s&apos;appuie exclusivement sur Seedance 2.0 via l&apos;API officielle ByteDance.
            Trois axes techniques distinguent ce modèle de Runway, Kling, Veo et Firefly —
            et c&apos;est ce qui permet de livrer une vidéo prête à diffuser, pas un brouillon à retravailler.
          </p>

          <div className="why-grid rv">
            {[
              {
                ico: '🎯', h: 'Précision narrative',
                p: "Exécution fidèle des mouvements et micro-expressions faciales, déviation minimale par rapport au prompt. Compréhension réelle du langage caméra (travelling, panoramique, zoom, cadrage pro) — pas juste des mots-clés. Rendu de texte fiable dans la vidéo (titre, lower-third, end card).",
              },
              {
                ico: '🌊', h: 'Physique réaliste',
                p: "Trajectoires de mouvement naturelles et fluides pour les actions complexes — fini les artefacts mécaniques type « membres tordus » ou doigts déformés. Simulation crédible des interactions physiques : poids des objets, résistance, impact. Mouvements humains qui ne sentent plus le synthétique.",
              },
              {
                ico: '🎬', h: 'Cohérence scène à scène',
                p: "Structure des objets et des personnages stable sur toute la durée et entre les plans. Éclairage, réflexions et transparences haute fidélité. Vos références (logo, charte, mood) transmises directement au modèle — le rendu reste cohérent du shot 1 au shot 4, sans retouche.",
              },
              {
                ico: '🔊', h: 'Audio natif synchronisé',
                p: "Musique, bruitages, ambiance et voix humaine générés en même temps que l'image, alignés à la milliseconde. Runway, Kling et Firefly livrent du muet — il faut un monteur son et une licence musique derrière. Avec Seedance, l'export est diffusable tel quel.",
              },
              {
                ico: '⚡', h: 'Rapide et scalable',
                p: "Génération d'une vidéo 5–15 secondes en quelques minutes via API. Conçu pour la haute concurrence — pas un outil web qui rame aux heures de pointe. La pile technique permet de livrer 48 h après validation, garantie.",
              },
              {
                ico: '🎨', h: 'Sortie 100 % personnalisable',
                p: "Six ratios disponibles (21:9, 16:9, 4:3, 1:1, 3:4, 9:16), styles de mouvement variés, caméras fixes ou dynamiques, options de rendu stylisé. Chaque vidéo est calibrée pour son format final : TV, reels, stories, ads, présentations.",
              },
            ].map((card) => (
              <div key={card.h} className="why-card">
                <div className="why-ico">{card.ico}</div>
                <div className="why-h">{card.h}</div>
                <p className="why-p">{card.p}</p>
              </div>
            ))}
          </div>

          <div className="rv" style={{
            marginTop: 32, padding: '14px 18px',
            background: 'rgba(124,92,252,.08)', border: '1px solid rgba(124,92,252,.22)',
            borderRadius: 10, fontSize: 13, color: 'var(--g4)', lineHeight: 1.55,
          }}>
            <strong style={{ color: 'var(--accent)' }}>Note honnête&nbsp;:</strong>{' '}
            Seedance 2.0 supporte officiellement les voix en anglais, japonais, espagnol, portugais et indonésien.
            Pour les voix-off françaises de qualité broadcast, j&apos;intègre une couche dédiée
            (voix off enregistrée ou TTS premium) ajoutée au montage final — sans surcoût pour vous.
          </div>
        </div>
      </section>

      {/* ── LE VRAI COÛT ─────────────────────────────────────────────────── */}
      <section className="lv2-s" style={{ background: '#0a0a12' }}>
        <div className="lv2-si" style={{ maxWidth: 1080 }}>
          <div style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
            textTransform: 'uppercase', color: '#fb923c', background: 'rgba(251,146,60,.14)',
            padding: '5px 12px', borderRadius: 3, marginBottom: 18,
          }}>
            Étude de marché · Mai 2026
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, lineHeight: 1.12, letterSpacing: -1, marginBottom: 20 }}>
            Le prix affiché ne couvre que <em style={{ color: '#fb923c', fontStyle: 'normal' }}>la couche du milieu</em>.
          </h2>
          <p style={{ fontSize: 17, color: '#aaa', maxWidth: 680, marginBottom: 36, lineHeight: 1.6 }}>
            Les plateformes IA grand public affichent quelques euros par clip. La réalité du terrain&nbsp;:
            un utilisateur non formé multiplie le prix par 3 à 8, et passe 5 à 8 heures à faire tout ce que la plateforme ne fait pas.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28, marginBottom: 56 }}>
            {[
              { num: '×3 à ×8', label: "Le multiplicateur réel par rapport au prix affiché — selon le taux d'itération." },
              { num: '5–8 h',   label: 'De travail invisible pour 30 secondes livrées — script, storyboard, prompt, montage.' },
              { num: '0 €',     label: 'De préprod incluse dans les abonnements des plateformes IA grand public.' },
            ].map((s) => (
              <div key={s.num} style={{ borderLeft: '2px solid #fb923c', paddingLeft: 18 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>{s.num}</div>
                <div style={{ fontSize: 13, color: '#999', lineHeight: 1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#13131e', borderRadius: 8, padding: '6px 4px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, color: '#e8e4dc' }}>
              <thead>
                <tr style={{ background: '#000' }}>
                  {['Étape de production','DIY seul','Délégué à un freelance'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#999', fontWeight: 700 }}>{h}</th>
                  ))}
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: '#A5B4FC', fontWeight: 700 }}>ScenIQ + Seedance 2.0</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Script + dialogues',   '1–3h de travail', '150–400 €',  '✓ Inclus'],
                  ['Storyboard + prompts', '2–4h de travail', '300–800 €',  '✓ Inclus'],
                  ['Génération vidéo',     '60–90 € (retakes)','60–90 €',   '✓ Inclus'],
                  ['Voix off + son',       '5–22 € (TTS)',    '150–500 €',  '✓ Inclus'],
                  ['Montage final',        '1–2h de travail', '200–600 €',  '✓ Inclus'],
                  ['Musique licensée',     '0–15 €',          '50–200 €',   '✓ Inclus'],
                ].map((row) => (
                  <tr key={row[0]} style={{ borderBottom: '1px solid #2a2a36' }}>
                    <td style={{ padding: '14px 16px', color: '#fff', fontWeight: 500 }}>{row[0]}</td>
                    <td style={{ padding: '14px 16px', color: '#aaa' }}>{row[1]}</td>
                    <td style={{ padding: '14px 16px', color: '#aaa' }}>{row[2]}</td>
                    <td style={{ padding: '14px 16px', color: '#86efac', fontWeight: 600 }}>{row[3]}</td>
                  </tr>
                ))}
                <tr style={{ background: '#0a0a14' }}>
                  <td style={{ padding: '16px', color: '#fff', fontWeight: 700 }}>Total pour une vidéo 30s</td>
                  <td style={{ padding: '16px', color: '#fb923c', fontWeight: 700 }}>~80–130 €<br /><span style={{ fontSize: 12, color: '#aaa' }}>+ 5–8h de votre temps</span></td>
                  <td style={{ padding: '16px', color: '#fb923c', fontWeight: 700 }}>~850–2 500 €</td>
                  <td style={{ padding: '16px', color: '#86efac', fontWeight: 800, fontSize: 18 }}>69–159 €<br /><span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>Forfait fixe · tout inclus</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: 12, color: '#777', marginTop: 14, marginBottom: 36 }}>
            Sources : Atlas Cloud, Data Science Collective, Adobe, vidpros.com — Mai 2026.
          </p>

          <div style={{ borderLeft: '3px solid #fb923c', padding: '20px 26px', background: 'rgba(251,146,60,.06)', borderRadius: '0 6px 6px 0' }}>
            <p style={{ fontSize: 17, fontStyle: 'italic', color: '#e8e4dc', lineHeight: 1.55, margin: 0 }}>
              « La génération n&apos;est que la couche du milieu. Le clip à 5&nbsp;€ et le clip à 1,50&nbsp;€ partent du même prompt et du même modèle. La différence, c&apos;est tout ce qui se passe autour. »
            </p>
            <div style={{ fontSize: 12, color: '#999', marginTop: 12, letterSpacing: 0.4 }}>
              Data Science Collective · The 2026 AI Video Production Playbook
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENTS — équipe créa ─────────────────────────────────────────── */}
      <section className="lv2-s alt" id="agents">
        <div className="lv2-si">
          <div className="lv2-label rv">L&apos;équipe créa</div>
          <h2 className="rv">
            Pas un prompt box.<br />
            Une équipe créa complète, <em>en 45 secondes</em>.
          </h2>
          <p className="lv2-s-sub rv">
            Vous décrivez votre projet en deux lignes. Trois agents IA spécialisés travaillent en parallèle :
            concept créatif, storyboard détaillé scène par scène, ambiance sonore.
            Le tout assemblé en un prompt final prêt à générer la vidéo.
          </p>

          <div className="ag-grid rv">
            <div className="ag">
              <div className="ag-ico">🎯</div>
              <div className="ag-n">Concept créatif &amp; angle narratif</div>
              <div className="ag-r">Le pourquoi avant le comment</div>
              <div className="ag-s">« Le luxe, c&apos;est le temps retrouvé. » Micro-moments de pause dans une journée urbaine. Ton : silence puissant, calme revendiqué. — Modifiable avant validation.</div>
            </div>
            <div className="ag">
              <div className="ag-ico">🎬</div>
              <div className="ag-n">Storyboard 4 scènes</div>
              <div className="ag-r">Prompts Seedance 2.0 détaillés</div>
              <div className="ag-s">SCÈNE 1 [3s] — Wide establishing shot, slow push-in toward subject, soft golden hour lighting. + voix off, dialogues si demandé. — Modifiable avant validation.</div>
            </div>
            <div className="ag">
              <div className="ag-ico">🎵</div>
              <div className="ag-n">Ambiance sonore (No Lyrics)</div>
              <div className="ag-r">Style + tempo + références licensables</div>
              <div className="ag-s">72 BPM, minimalisme contemplatif. Réf : Ólafur Arnalds — Near Light. Entrée piano à 8s, montée subtile à 22s. — Modifiable avant validation.</div>
            </div>
            <div className="ag">
              <div className="ag-ico">✅</div>
              <div className="ag-n">Prompt final unifié</div>
              <div className="ag-r">Prêt à générer la vidéo en 1 clic</div>
              <div className="ag-s">Le bloc final assemble concept + storyboard + ambiance en un prompt multi-shot. Seedance 2.0 génère une vidéo complète déjà montée — pas 4 clips à assembler.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────────────────────────────────── */}
      <section className="lv2-s" id="process">
        <div className="lv2-si">
          <div className="lv2-label rv">Le process</div>
          <h2 className="rv">Vous briefez. Je livre.</h2>
          <p className="lv2-s-sub rv">
            Quatre étapes, un seul interlocuteur. Vous ne touchez à aucun outil — vous validez à chaque étape, je m&apos;occupe du reste.
          </p>

          <div className="steps rv">
            <div className="step">
              <div className="sn">01</div>
              <div className="si2">✉️</div>
              <div className="st">Vous m&apos;envoyez votre brief</div>
              <div className="sd">
                Deux lignes, vos références (logo, charte, visuels, audio si voix-off) et le format souhaité.
                Je reviens vers vous sous 4&nbsp;h ouvrées avec un devis ferme.
              </div>
            </div>
            <div className="step">
              <div className="sn">02</div>
              <div className="si2">🎬</div>
              <div className="st">Je vous livre la pré-prod</div>
              <div className="sd">
                Concept créatif, storyboard 4 scènes, ambiance sonore, prompt final.
                Vous découvrez ce que la vidéo va raconter avant qu&apos;une seule image ne soit générée.
              </div>
            </div>
            <div className="step">
              <div className="sn">03</div>
              <div className="si2">🔁</div>
              <div className="st">J&apos;itère jusqu&apos;à votre validation</div>
              <div className="sd">
                10 allers-retours inclus. Vous pouvez ajuster le ton, le rythme, une scène, la musique.
                Je modifie. Vous validez. Pas de chrono, pas de stress.
              </div>
            </div>
            <div className="step">
              <div className="sn">04</div>
              <div className="si2">▶</div>
              <div className="st">Je livre la vidéo sous 48&nbsp;h</div>
              <div className="sd">
                MP4 prêt à diffuser, dans le format demandé, avec son intégré.
                Vous postez, vous diffusez, vous facturez votre client. C&apos;est tout.
              </div>
            </div>
          </div>

          {/* ── SEEDANCE DEMO — Reference → Output ── */}
          {(() => {
            const SLIDES = [
              {
                useCase: 'Image × 2 — vidéo produit',
                refs: [
                  { type: 'image', label: 'Image', bg: 'linear-gradient(155deg,#1e1008,#3a2010)', accent: '#D4854A' },
                  { type: 'image', label: 'Image', bg: 'linear-gradient(155deg,#08140e,#0e2818)', accent: '#34D399' },
                ],
                outBg: 'linear-gradient(145deg,#13100a,#201808,#0f0c06)',
                outAccent: '#D4854A',
                prompt: 'Slow push-in toward the perfume bottle resting on marble. Golden light sweeps obliquely across the surface from screen left. A hand enters from low angle and gently grasps the bottle — slow-motion at the apex, shallow depth of field.',
              },
              {
                useCase: 'Image + Audio — testimonial lip-sync',
                refs: [
                  { type: 'image', label: 'Image', bg: 'linear-gradient(155deg,#0c1022,#181e3a)', accent: '#818CF8' },
                  { type: 'audio', label: 'Audio', bg: 'linear-gradient(155deg,#060918,#0c1230)', accent: '#A5B4FC' },
                ],
                outBg: 'linear-gradient(145deg,#090e20,#101828,#07090f)',
                outAccent: '#818CF8',
                prompt: 'Handheld follow — subject turns toward camera, lip-sync driven by audio reference. "ScenIQ a changé ma façon de travailler." Natural gesture, soft key light from the right, shallow depth of field.',
              },
              {
                useCase: 'Image × 4 — brand film multi-scène',
                refs: [
                  { type: 'image', label: 'Image', count: 4, bg: 'linear-gradient(155deg,#12080e,#261018)', accent: '#F472B6' },
                ],
                outBg: 'linear-gradient(145deg,#0e0810,#1a0e18,#09060c)',
                outAccent: '#F472B6',
                prompt: 'Wide establishing shot tracking forward. Visual tone and character likeness from the 4 references — subjects converge at center frame. Camera tilts up to reveal product. Slow-motion at apex, 4k rendering.',
              },
            ]
            const sl = SLIDES[sdSlide]
            return (
              <div className="sdemo-outer rv" style={{ marginTop: 72 }}>
                <div className="sdemo-head">
                  <p className="sdemo-intro">Vos références (images, vidéos, audio) transmises directement à Seedance 2.0 — scène à scène.</p>
                  <div className="sdemo-dots">
                    {SLIDES.map((_, i) => (
                      <button key={i} className={`sdemo-dot${sdSlide === i ? ' on' : ''}`} onClick={() => setSdSlide(i)} aria-label={`Exemple ${i + 1}`} />
                    ))}
                  </div>
                </div>

                <div className="sdemo-container">
                  <button className="sdemo-arr" onClick={() => setSdSlide((s) => Math.max(0, s - 1))} disabled={sdSlide === 0} aria-label="Exemple précédent">‹</button>

                  <div className="sdemo-panel">
                    <div className="sdemo-split">
                      {/* Reference */}
                      <div className="sdemo-ref">
                        <span className="sdemo-lbl-ref">Reference</span>
                        <div className="sdemo-ref-cards">
                          {sl.refs.map((ref, i) => (
                            <div key={i} className="sdemo-card" style={{ background: ref.bg }}>
                              <div className="sdemo-card-header">
                                <span className="sdemo-card-badge">
                                  {ref.type === 'image' && (
                                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                      <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                      <path d="M1 10l4-3 3 2.5 3-4 4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                      <circle cx="5" cy="6.5" r="1" fill="currentColor"/>
                                    </svg>
                                  )}
                                  {ref.type === 'audio' && (
                                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                      <path d="M2 10V6M5 12V4M8 13V3M11 11V5M14 9V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                  )}
                                  {' '}{ref.label}{'count' in ref && ref.count ? ` × ${ref.count}` : ''}
                                </span>
                              </div>
                              {ref.type === 'audio' ? (
                                <div className="sdemo-waveform">
                                  <svg viewBox="0 0 280 52" fill="none" className="sdemo-wave-svg" aria-hidden="true">
                                    <defs>
                                      <linearGradient id={`wg${i}`} x1="0" x2="1" y1="0" y2="0">
                                        <stop offset="0%" stopColor="#E879F9"/>
                                        <stop offset="50%" stopColor="#A855F7"/>
                                        <stop offset="100%" stopColor="#38BDF8"/>
                                      </linearGradient>
                                    </defs>
                                    {[10,18,30,42,26,38,50,34,20,46,38,26,48,40,22,28,46,36,26,42,34,28,44,22,40,32,20,44,26,38,32,22,40,28,18,34,24,16,28,20].map((h, j) => (
                                      <rect key={j} x={j * 7} y={(52 - h) / 2} width="5" height={h} rx="2.5" fill={`url(#wg${i})`} opacity="0.78"/>
                                    ))}
                                  </svg>
                                </div>
                              ) : (
                                <div className="sdemo-card-visual" style={{ background: `radial-gradient(ellipse at 35% 55%, ${ref.accent}38 0%, transparent 68%)` }}>
                                  {'count' in ref && ref.count && ref.count > 1 && (
                                    <div className="sdemo-multi-lbl">{ref.count} références</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="sdemo-use-case">{sl.useCase}</p>
                      </div>

                      {/* Output */}
                      <div className="sdemo-out" style={{ background: sl.outBg }}>
                        <span className="sdemo-lbl-out">Output</span>
                        <div className="sdemo-out-glow" style={{ background: `radial-gradient(ellipse at 50% 50%, ${sl.outAccent}20 0%, transparent 65%)` }} />
                        <div className="sdemo-out-play">
                          <div className="sdemo-play-btn">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true"><polygon points="5,3 19,12 5,21"/></svg>
                          </div>
                        </div>
                        <div className="sdemo-out-dur">720p · Audio natif</div>
                        <div className="sdemo-out-controls">
                          <button className="sdemo-ctrl-btn" aria-label="Volume">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
                              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            </svg>
                          </button>
                          <button className="sdemo-ctrl-btn" aria-label="Lecture">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="white" aria-hidden="true"><polygon points="5,3 19,12 5,21"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="sdemo-prompt">
                      <span className="sdemo-prompt-kw">Prompt :</span>
                      {sl.prompt}
                    </div>
                  </div>

                  <button className="sdemo-arr" onClick={() => setSdSlide((s) => Math.min(SLIDES.length - 1, s + 1))} disabled={sdSlide === SLIDES.length - 1} aria-label="Exemple suivant">›</button>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section className="lv2-s alt" id="pricing">
        <div className="lv2-si">
          <div className="lv2-label rv">Tarifs</div>
          <h2 className="rv">Un prix par vidéo. Rien à comprendre.</h2>
          <p className="lv2-s-sub rv">
            Pas de tokens, pas de crédits, pas de surprise. Vous choisissez une durée, vous savez ce que vous payez.
            Tous les formats inclus (vertical, horizontal, carré, cinéma). 10 itérations incluses sur chaque vidéo.
            Livraison sous 48&nbsp;h après validation finale.
          </p>

          <div className="lv2-prices rv">
            {[
              { dur: '5 sec',  price: 69,  use: 'Story · Bumper · Logo reveal' },
              { dur: '8 sec',  price: 89,  use: 'Reel court · Teaser produit' },
              { dur: '10 sec', price: 109, use: 'Spot social · Ad digital',     featured: true },
              { dur: '12 sec', price: 129, use: 'Brand film court · Campagne' },
              { dur: '15 sec', price: 159, use: 'Pub TV · Format long social' },
            ].map((p) => (
              <div key={p.dur} className={`lv2-price-card${p.featured ? ' featured' : ''}`}>
                {p.featured && <div className="lv2-price-badge">Le plus demandé</div>}
                <div className="lv2-price-dur">{p.dur}</div>
                <div className="lv2-price-num">
                  <sup>€</sup>{p.price}
                </div>
                <div className="lv2-price-ht">HT / vidéo</div>
                <div className="lv2-price-use">{p.use}</div>
                <ul className="lv2-price-perks">
                  <li className="lv2-price-perk">Tous formats inclus</li>
                  <li className="lv2-price-perk">10 itérations incluses</li>
                  <li className="lv2-price-perk">Son natif intégré</li>
                  <li className="lv2-price-perk">Usage commercial illimité</li>
                </ul>
              </div>
            ))}
          </div>

          <div className="lv2-price-perks-row rv">
            {[
              { title: '📐 Tous formats inclus', desc: '21:9 · 16:9 · 4:3 · 1:1 · 3:4 · 9:16 — TV, reels, stories, TikTok, posts, présentations' },
              { title: '🔁 10 itérations incluses', desc: 'Ajustements concept, script, storyboard, ambiance — jusqu\'à ce que vous validiez. +9 €/itération au-delà.' },
              { title: '⏱ Livraison 48 h', desc: 'Délai garanti après validation finale du brief. Préprod livrée en 4 h ouvrées.' },
              { title: '🔒 Vous êtes propriétaire', desc: 'Usage commercial inclus. Aucune mention ScenIQ sur les livrables. Vos vidéos, votre marque.' },
            ].map((item) => (
              <div key={item.title} className="lv2-price-perk-item">
                <div className="lv2-price-perk-title">{item.title}</div>
                <div className="lv2-price-perk-desc">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="rv" style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-lg">Lancer ma vidéo →</a>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--g6)' }}>
              Réponse sous 4 h ouvrées · Devis gratuit · Aucun engagement
            </p>
            <button
              type="button"
              onClick={() => { setQuestionOpen(true); setQuestionSent(false) }}
              style={{
                marginTop: 10, background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: 'var(--g4)', textDecoration: 'underline',
                textUnderlineOffset: 3, fontFamily: 'inherit',
              }}
            >
              Une question avant de commander ?
            </button>
          </div>

          <div className="rv" style={{
            marginTop: 36, padding: '14px 18px',
            background: 'rgba(124,92,252,.08)', border: '1px solid rgba(124,92,252,.22)',
            borderRadius: 10, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto',
            fontSize: 13, color: 'var(--g4)', lineHeight: 1.55,
          }}>
            <strong style={{ color: 'var(--accent)' }}>Volume&nbsp;?</strong>{' '}
            Au-delà de 10 vidéos/mois pour le même client, je propose un forfait dégressif personnalisé.
            Mentionnez-le dans votre brief.
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="lv2-s" id="faq">
        <div className="lv2-si" style={{ maxWidth: 680 }}>
          <div className="lv2-label rv">FAQ</div>
          <h2 className="rv" style={{ marginBottom: 36 }}>Questions fréquentes</h2>

          <div className="faq rv">
            {[
              {
                q: 'Comment ça se passe concrètement ?',
                a: "Vous m'envoyez votre brief par email — deux lignes max — avec vos références (logo, charte, visuels, audio si voix-off). Je reviens sous 4 h ouvrées avec un devis ferme et une première proposition créative (concept + storyboard + ambiance). J'itère avec vous jusqu'à validation (10 allers-retours inclus). Je génère la vidéo et la livre sous 48 h. Vous n'ouvrez jamais aucun outil.",
              },
              {
                q: 'Pourquoi pas faire ça moi-même avec Runway, Kling, Veo ou Firefly ?',
                a: 'Le prix affiché de ces outils ne couvre que la génération brute. Tout le reste reste à votre charge : écrire le script, faire le storyboard plan par plan, formuler les prompts, générer plusieurs versions (5 à 8 retakes en moyenne sans formation), trouver la voix off, monter, ajouter la musique, vérifier les droits commerciaux. C\'est 5 à 8 h de travail invisible pour 30 secondes livrées — et le prix réel finit autour de 80–130 €, plus votre temps. Mon forfait à partir de 69 € inclut tout, sans aucune compétence requise de votre part.',
              },
              {
                q: 'Pourquoi Seedance 2.0 et pas Runway, Veo ou Kling ?',
                a: "J'utilise l'API officielle ByteDance (le créateur de Seedance) — accès direct à la source, pas via un intermédiaire. Concrètement : (1) Audio et vidéo générés en même temps — Runway, Kling et Firefly livrent du muet. (2) Précision narrative supérieure — micro-expressions faciales et langage caméra exécutés fidèlement. (3) Physique réaliste — fini les artefacts mécaniques. (4) Cohérence scène à scène. (5) Audio natif synchronisé à la milliseconde. Pour les voix off françaises, j'ajoute une couche dédiée au montage (sans surcoût).",
              },
              {
                q: 'Combien je paie au final ?',
                a: 'Le prix de la grille tarifaire selon la durée — 69 € (5s), 89 € (8s), 109 € (10s), 129 € (12s), 159 € (15s). Tous formats inclus. 10 itérations incluses (+9 €/itération au-delà). Aucun frais caché, aucun token, aucun abonnement. Volume au-delà de 10 vidéos/mois : j\'établis un dégressif sur mesure.',
              },
              {
                q: "Qu'est-ce que je reçois exactement ?",
                a: "Un fichier MP4 prêt à diffuser, dans le format demandé, son intégré (musique, ambiance, voix off si pertinent). Vous postez, vous diffusez, vous facturez votre client. C'est tout. Pas de zip avec 12 fichiers — juste la vidéo finale, telle qu'elle sera diffusée.",
              },
              {
                q: "Mes droits d'usage commercial ?",
                a: "Vous êtes propriétaire à 100 % de la vidéo livrée. Usage commercial illimité — publicité payante, réseaux sociaux, TV, site, présentations client. Aucune mention ScenIQ sur le livrable. Vous pouvez la revendre, la décliner, la modifier. Je ne réutilise rien de votre brief, de vos références ou du résultat dans d'autres projets.",
              },
              {
                q: "Si le résultat ne me plaît pas après la 10ᵉ itération ?",
                a: "Si après 10 allers-retours sur la pré-prod je n'arrive pas à m'aligner sur ce que vous voulez, je vous rembourse intégralement — vous ne payez rien. La validation finale du brief créatif est votre décision avant toute génération vidéo. Je ne génère la vidéo qu'après votre go.",
              },
              {
                q: 'Combien de temps avant que je récupère la vidéo ?',
                a: "Pré-prod (concept + storyboard + ambiance) livrée sous 4 h ouvrées après votre brief. Itérations généralement sous 2 h ouvrées chacune. Génération et livraison : sous 48 h après votre validation finale. Pour les projets urgents (lancement produit, deadline réseaux), je peux accélérer à 24 h — mentionnez-le dans le brief.",
              },
              {
                q: 'Sur quels types de projets je travaille ?',
                a: "Pubs digitales, reels Instagram/TikTok, brand films courts, lancements produit, teasers, vidéos LinkedIn, contenus B2B, motion branding. Cibles fréquentes : agences créa, marques premium, startups. Je ne fais pas (encore) les vidéos longues (> 15 sec), les animations 2D motion design, ni les contenus sensibles (médical, financier régulé).",
              },
              {
                q: 'Pourquoi pas une plateforme en libre-service ?',
                a: "Pour 2026, c'est volontaire. Une plateforme self-service vous redonne tous les problèmes qu'on vient d'éviter. Mon offre couvre tout ce travail invisible. Une version self-service est prévue pour 2027 — pour les pros formés au prompt engineering qui veulent gérer eux-mêmes.",
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
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <div className="lv2-cta-final">
        <video
          autoPlay muted loop playsInline preload="metadata" aria-hidden="true"
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
        >
          <source src="/showcase/5agents.mp4" type="video/mp4" />
        </video>
        <div className="lv2-cta-overlay" aria-hidden="true" />

        <div className="lv2-cta-inner">
          <h2>Prêt à lancer<br />votre vidéo&nbsp;?</h2>
          <p className="lv2-cta-sub">
            Format, durée, brief, références, paiement — tout se fait en moins de 5 minutes.
            Je vous rappelle sous 4 h ouvrées pour caler la pré-prod ensemble.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <a href="/commande" className="lv2-btn lv2-btn-accent lv2-btn-xl">
              Lancer ma vidéo →
            </a>
            <button
              type="button"
              onClick={() => { setQuestionOpen(true); setQuestionSent(false) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: 'rgba(255,255,255,0.5)',
                textDecoration: 'underline', textUnderlineOffset: 3,
                fontFamily: 'inherit',
              }}
            >
              Une question ?
            </button>
          </div>
          <div className="lv2-cta-badges">
            <span className="lv2-cb">Je vous rappelle sous 4&nbsp;h ouvrées</span>
            <span className="lv2-cb">Paiement sécurisé Stripe</span>
            <span className="lv2-cb">Livraison sous 48&nbsp;h</span>
            <span className="lv2-cb">10 itérations incluses</span>
          </div>

          <div className="lv2-waitlist-box">
            <div className="lv2-waitlist-tag">Bientôt</div>
            <h3>Version self-service · 2027</h3>
            <p>
              Une plateforme où vous générez vos vidéos vous-mêmes, dans votre interface, sans passer par moi.
              Pour l&apos;instant je préfère vous accompagner à la main — c&apos;est comme ça que je garantis la qualité.
            </p>
            <a
              href={`mailto:support@sceniq.studio?subject=${encodeURIComponent('Waitlist V2 self-service ScenIQ')}&body=${encodeURIComponent('Bonjour,\n\nJe souhaite être prévenu(e) du lancement de la version self-service de ScenIQ en 2027.\n\nMon email : \nMa structure : \nUsage prévu : \n\nMerci !')}`}
              className="lv2-waitlist-link"
            >
              M&apos;inscrire à la waitlist →
            </a>
          </div>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="lv2-footer">
        <div className="lv2-footer-inner">
          <div className="lv2-footer-brand">
            <img src="/sceniq-logo-dark.svg" alt="ScenIQ" style={{ height: 34, width: 'auto' }} />
            <p className="lv2-footer-desc">
              Agence vidéo IA. Vous parlez à Pascal — un créatif, pas une plateforme.
              Brief en 2 lignes, vidéo livrée en 48 h. Seedance 2.0 · Prix ferme.
            </p>
          </div>
          <div>
            <div className="lv2-footer-col-title">Navigation</div>
            <ul className="lv2-footer-links">
              <li><a href="#exemples">Réalisations</a></li>
              <li><a href="#why-seedance">Seedance 2.0</a></li>
              <li><a href="#agents">Équipe créa</a></li>
              <li><a href="#process">Le process</a></li>
            </ul>
          </div>
          <div>
            <div className="lv2-footer-col-title">Tarifs</div>
            <ul className="lv2-footer-links">
              <li><a href="#pricing">5 sec — 69 €</a></li>
              <li><a href="#pricing">10 sec — 109 €</a></li>
              <li><a href="#pricing">15 sec — 159 €</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="lv2-footer-col-title">Contact direct</div>
            <ul className="lv2-footer-links">
              <li><a href="tel:+33756808831">📞 07 56 80 88 31</a></li>
              <li><a href="mailto:support@sceniq.studio">support@sceniq.studio</a></li>
              <li><a href="/commande">Commander</a></li>
              <li><a href="#">Mentions légales</a></li>
              <li><a href="#">Confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div className="lv2-footer-bottom">
          <span>© 2025 ScenIQ. Tous droits réservés.</span>
          <span>Fait avec Seedance 2.0 · Livraison 48 h</span>
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
            {/* Close */}
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
                        type="text"
                        required
                        placeholder="Marie"
                        value={qForm.name}
                        onChange={(e) => setQForm((f) => ({ ...f, name: e.target.value }))}
                        style={{
                          width: '100%', padding: '11px 14px',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, color: '#fff', fontSize: 14,
                          fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="marie@agence.fr"
                        value={qForm.email}
                        onChange={(e) => setQForm((f) => ({ ...f, email: e.target.value }))}
                        style={{
                          width: '100%', padding: '11px 14px',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 10, color: '#fff', fontSize: 14,
                          fontFamily: 'inherit', outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      Votre question
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Ex : Est-ce que vous pouvez faire une vidéo pour un lancement produit avec plusieurs personnages ?"
                      value={qForm.message}
                      onChange={(e) => setQForm((f) => ({ ...f, message: e.target.value }))}
                      style={{
                        width: '100%', padding: '11px 14px', resize: 'vertical',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, color: '#fff', fontSize: 14,
                        fontFamily: 'inherit', outline: 'none', lineHeight: 1.55,
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: '13px 24px', borderRadius: 999,
                      background: '#7C5CFC', border: 'none', color: '#fff',
                      fontSize: 15, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'background .15s',
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
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
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
            />
          </div>
        </div>
      )}
    </div>
  )
}
