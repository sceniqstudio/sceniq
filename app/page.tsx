'use client'

import { useEffect, useState } from 'react'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import Link from 'next/link'
import { ShowcaseClip } from '@/app/_components/ShowcaseClip'

const SHOWCASE_SLUGS = [
  'exemple1', 'exemple2', 'exemple3', 'exemple4', 'exemple5', 'exemple6',
  'exemple7', 'exemple8', 'exemple9', 'exemple10', 'exemple11', 'exemple12',
  'exemple13', 'exemple14', 'exemple15', 'exemple16', 'exemple17',
] as const

export default function HomePage() {
  const [openVideo, setOpenVideo] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sdSlide, setSdSlide] = useState(0)

  // ── Hero grid : 6 reels random sur 12 — re-shuffle à chaque refresh ──
  // SSR initialise avec les 6 premiers (déterministe → pas de hydration mismatch),
  // useEffect re-shuffle après le mount client.
  const [heroSlugs, setHeroSlugs] = useState<readonly string[]>(
    () => SHOWCASE_SLUGS.slice(0, 6)
  )
  useEffect(() => {
    const shuffled = [...SHOWCASE_SLUGS].sort(() => Math.random() - 0.5)
    setHeroSlugs(shuffled.slice(0, 6))
  }, [])

  // ── ESC pour fermer la modale + lock scroll body quand modale ouverte ──
  useEffect(() => {
    if (!openVideo && !mobileMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenVideo(null)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openVideo, mobileMenuOpen])

  // ── Nav scroll state — la classe landing-dark est désormais sur le wrapper SSR ──
  useEffect(() => {
    const nav = document.querySelector('nav')
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

  useEffect(() => {
    // ── Reveal on scroll ──
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

    // ── FAQ accordion ──
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

    // ── Carousel — scroll natif + drag souris + dots synchronisés ──
    const track = document.getElementById('carTrack') as HTMLElement | null
    const prev = document.getElementById('cPrev') as HTMLButtonElement | null
    const next = document.getElementById('cNext') as HTMLButtonElement | null
    const dots = document.getElementById('cDots')

    if (track && prev && next && dots) {
      const N = 17
      const CW = 220
      const GAP = 16
      const STEP = CW + GAP

      const visible = () => Math.max(1, Math.floor((track.clientWidth - 88) / STEP))
      const maxIndex = () => Math.max(0, N - visible())

      let cur = 0
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

      // Sync dots when user scrolls (trackpad, touch, drag, anchor)
      const onScroll = () => {
        if (scrollT) clearTimeout(scrollT)
        scrollT = setTimeout(() => {
          const i = Math.round(track.scrollLeft / STEP)
          cur = Math.max(0, Math.min(i, maxIndex()))
          renderDotState()
        }, 80)
      }
      track.addEventListener('scroll', onScroll, { passive: true })

      // Drag-to-scroll (souris)
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
        // Snap to nearest card after drag
        if (didDrag) {
          const i = Math.round(track.scrollLeft / STEP)
          goTo(i)
        }
      }
      // Empêche click-drag-clic d'ouvrir un lien après drag
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

    // ── Smooth scroll on anchor links ──
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

  return (
    <div className="landing-dark">
      {/* Skip-link clavier */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* BLOB SVG DEFS (réutilisé partout) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <clipPath id="blob-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.05 C0.72,0.02 0.95,0.15 0.97,0.38 C0.99,0.58 0.88,0.78 0.7,0.88 C0.55,0.97 0.36,0.99 0.2,0.9 C0.05,0.81 -0.02,0.6 0.03,0.38 C0.08,0.17 0.28,0.08 0.5,0.05Z" />
          </clipPath>
        </defs>
      </svg>

      {/* NAV */}
      <nav>
        <a href="#" className="logo" aria-label="ScenIQ — Accueil">
          <img src="/sceniq-logo-dark.svg" alt="ScenIQ" height={48} style={{ height: 48, width: 'auto', display: 'block' }} />
        </a>
        <ul className="nav-links">
          <li><a href="#how">Comment ça marche</a></li>
          <li><a href="#exemples">Exemples</a></li>
          <li><a href="#agents">Les agents</a></li>
          <li><a href="#pricing">Tarifs</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-r">
          <SignedOut>
            <Link href="/sign-in" className="btn btn-g">Se connecter</Link>
            <Link href="/sign-up" className="btn btn-p">Essayer gratuitement</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-p">Mon dashboard →</Link>
          </SignedIn>
        </div>
        {/* Burger — mobile uniquement */}
        <button
          className={`nav-burger${mobileMenuOpen ? ' open' : ''}`}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          className="mob-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigation"
        >
          {/* Backdrop */}
          <div className="mob-menu-bd" onClick={() => setMobileMenuOpen(false)} />
          <div className="mob-menu-panel">
            <ul className="mob-menu-links">
              <li><a href="#how"    onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a></li>
              <li><a href="#exemples" onClick={() => setMobileMenuOpen(false)}>Exemples</a></li>
              <li><a href="#agents" onClick={() => setMobileMenuOpen(false)}>Les agents</a></li>
              <li><a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Tarifs</a></li>
              <li><a href="#faq"    onClick={() => setMobileMenuOpen(false)}>FAQ</a></li>
            </ul>
            <div className="mob-menu-ctas">
              <SignedOut>
                <Link href="/sign-in" className="btn btn-g" style={{width:'100%',justifyContent:'center'}} onClick={() => setMobileMenuOpen(false)}>Se connecter</Link>
                <Link href="/sign-up" className="btn btn-p" style={{width:'100%',justifyContent:'center'}} onClick={() => setMobileMenuOpen(false)}>Essayer gratuitement</Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className="btn btn-p" style={{width:'100%',justifyContent:'center'}} onClick={() => setMobileMenuOpen(false)}>Mon dashboard →</Link>
              </SignedIn>
            </div>
          </div>
        </div>
      )}

      {/* ═════ HERO SPLIT — gauche contenu, droite grille reels ═════ */}
      <section className="hero-rw" id="main-content" aria-label="Hero ScenIQ">
        <div className="hero-rw-content">
          <h1 className="hero-rw-title">
            Du brief à l&apos;écran.<br />
            <em>4 minutes</em>.
          </h1>

          <div className="hero-rw-categories" aria-hidden="true">
            <span>REELS · STORIES · TIKTOK</span>
            <span>BRAND FILM · TEASER</span>
            <span>LANCEMENT PRODUIT · CAMPAGNE</span>
            <span>ADS DIGITAUX · PITCH</span>
            <span style={{ color: '#A5B4FC' }}>SANS PROMPT À ÉCRIRE · SON INCLUS</span>
          </div>

          <div className="hero-rw-bottom">
            <a href="#pricing" className="hero-rw-cta">
              Essayer ScenIQ
              <span className="hero-rw-cta-ico">›</span>
            </a>
            <span className="hero-rw-note">2 vidéos offertes · Sans CB</span>
          </div>
        </div>

        {/* Grille 3×2 = 6 reels random parmi les 12 — re-shuffle à chaque refresh */}
        <div className="hero-rw-grid" aria-hidden="true">
          {heroSlugs.map((slug) => (
            <div key={slug} className="hero-rw-cell">
              <ShowcaseClip
                slug={slug}
                fallbackBg="linear-gradient(135deg,#1a1a22,#2d2d3a)"
                fallbackEmoji="✦"
                ariaLabel={`${slug}.mp4`}
              />
            </div>
          ))}
        </div>

        <div className="hero-rw-scroll">↓ Découvrir</div>
      </section>

      {/* STRIP CLIENTS — sous le hero */}
      <div className="strip-rw">
        <div className="strip-rw-inner">
          <span className="strip-rw-lbl">Conçu pour</span>
          <div className="strip-rw-items">
            <span className="strip-rw-item">Agences pub</span>
            <span className="strip-rw-item">Studios créa</span>
            <span className="strip-rw-item">Social media</span>
            <span className="strip-rw-item">Directeurs artistiques</span>
            <span className="strip-rw-item">Brand managers</span>
          </div>
        </div>
      </div>

      {/* MISSION STATEMENT — vidéo 5 agents en background + overlay fondu noir */}
      <section className="mission-rw">
        <video
          className="mission-rw-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
        >
          <source src="/showcase/5agents.mp4" type="video/mp4" />
        </video>
        <div className="mission-rw-overlay" aria-hidden="true"></div>
        <div className="mission-rw-inner">
          <div className="mission-rw-eye">Pas un prompt box.</div>
          <h2 className="mission-rw-h">
            Cinq agents IA forment une équipe créa <em>complète</em>.<br />
            Vous écrivez le brief, ils livrent la pré-prod sans réunion intermédiaire.
          </h2>
        </div>
      </section>

      {/* CAROUSEL EXEMPLES — format reels 9:16 — placeholders prêts pour vidéos */}
      <section className="s" id="exemples">
        <div className="car-head">
          <div className="s-eye rv">Exemples de productions</div>
          <h2 className="rv">Ce que ScenIQ produit.</h2>
          <p className="s-sub rv">Chaque vidéo a été générée depuis un brief de 2 lignes.</p>
        </div>
        <div className="car-wrap">
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
                aria-label={`Lire ${slug}.mp4 en grand format`}
              >
                <div className="vc-thumb">
                  <ShowcaseClip
                    slug={slug}
                    fallbackBg="linear-gradient(135deg,#1a1a22,#2d2d3a)"
                    fallbackEmoji="✦"
                    ariaLabel={`${slug}.mp4`}
                  />
                  <div className="vc-play" aria-hidden="true">▶</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="car-nav">
          <div className="car-dots" id="cDots"></div>
        </div>
        <p className="car-note">✦ Vidéos générées via Seedance 2.0 depuis un brief de 2 lignes</p>
      </section>

      {/* WHY SEEDANCE — les différenciateurs techniques qui changent la donne */}
      <section className="s alt" id="why-seedance">
        <div className="si">
          <div className="s-eye rv">Pourquoi Seedance 2.0</div>
          <h2 className="rv">Le seul modèle IA pensé<br />pour les agences françaises.</h2>
          <p className="s-sub rv">ScenIQ accède à Seedance 2.0 via <strong>l&apos;API officielle ByteDance</strong> — la source directe, pas un intermédiaire. Résultat : des vidéos que vos concurrents ne peuvent pas reproduire avec les outils grand public.</p>

          <div className="why-grid rv">
            <div className="why-card">
              <div className="why-ico">🇫🇷</div>
              <div className="why-h">Lip-sync français précis</div>
              <p className="why-p">Seedance est le seul modèle vidéo entraîné en français. Les lèvres forment les vrais sons — <em>u</em>, <em>eu</em>, <em>in</em>, <em>an</em>. Avec Runway ou Veo, vos témoignages clients et plans serrés sonnent comme du doublage approximatif. <strong>Pas chez ScenIQ.</strong></p>
            </div>
            <div className="why-card">
              <div className="why-ico">🔊</div>
              <div className="why-h">Audio-vidéo synchronisé</div>
              <p className="why-p">Musique, bruitages, ambiance, synchro des lèvres — <strong>tout sort en même temps que l&apos;image</strong>, aligné à la milliseconde. Runway, Kling et Midjourney livrent du muet : monteur son + licensing musique = 2-3h et budget en plus. Pas ici.</p>
            </div>
            <div className="why-card">
              <div className="why-ico">🎬</div>
              <div className="why-h">Direction caméra réelle</div>
              <p className="why-p">Vous écrivez «&nbsp;<em>travelling sur la main qui saisit le flacon, ralenti au dernier moment</em>&nbsp;» — <strong>Seedance le tourne</strong>. Panoramique, zoom, cadrage pro : le modèle comprend le langage cinéma, pas seulement des mots-clés.</p>
            </div>
            <div className="why-card">
              <div className="why-ico">🎯</div>
              <div className="why-h">Chaque référence respectée</div>
              <p className="why-p">Logo, palette, mood board — Brand Memory transmet vos assets à chaque génération. <strong>Cohérence visuelle scène à scène, sans retouche</strong>. Mouvements fluides, textures réalistes (reflets, transparences), micro-expressions précises. Vos vidéos ressemblent à votre marque.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="s" id="how">
        <div className="si">
          <div className="s-eye rv">Comment ça marche</div>
          <h2 className="rv">Un flux. Quatre étapes.</h2>
          <p className="s-sub rv" style={{ maxWidth: 'none' }}>Du brief au clip MP4 — sans équipe, sans studio, sans attente.</p>
          <div className="steps rv">
            <div className="step"><div className="sn">01</div><div className="si2">📝</div><div className="st">Brief</div><div className="sd">Décrivez votre vidéo en français, comme à un freelance. Les agents écrivent les prompts techniques à votre place — vous n&apos;avez jamais à savoir prompter.</div></div>
            <div className="step"><div className="sn">02</div><div className="si2">⚡</div><div className="st">Production IA</div><div className="sd">5 agents spécialisés génèrent en parallèle concept, script, storyboard, musique et direction visuelle.</div></div>
            <div className="step"><div className="sn">03</div><div className="si2">▶</div><div className="st">Génération clips</div><div className="sd">Seedance 2.0 génère chaque scène avec audio natif synchronisé. Vos références de marque sont intégrées automatiquement — le modèle les respecte visuellement, scène à scène.</div></div>
            <div className="step"><div className="sn">04</div><div className="si2">↓</div><div className="st">Export</div><div className="sd">Clips MP4 numérotés + dossier de production complet prêt à livrer.</div></div>
          </div>

          {/* SEEDANCE DEMO — Reference → Output (style BytePlus) */}
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
                {/* Intro + dots */}
                <div className="sdemo-head">
                  <p className="sdemo-intro">Vos références (images, vidéos, audio) transmises directement à Seedance 2.0 — scène à scène.</p>
                  <div className="sdemo-dots">
                    {SLIDES.map((_, i) => (
                      <button key={i} className={`sdemo-dot${sdSlide === i ? ' on' : ''}`} onClick={() => setSdSlide(i)} aria-label={`Exemple ${i + 1}`} />
                    ))}
                  </div>
                </div>

                <div className="sdemo-container">
                  {/* Flèche gauche */}
                  <button className="sdemo-arr" onClick={() => setSdSlide((s) => Math.max(0, s - 1))} disabled={sdSlide === 0} aria-label="Exemple précédent">‹</button>

                  <div className="sdemo-panel">
                    <div className="sdemo-split">

                      {/* ── LEFT : Reference ── */}
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

                      {/* ── RIGHT : Output ── */}
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

                    {/* ── Barre Prompt ── */}
                    <div className="sdemo-prompt">
                      <span className="sdemo-prompt-kw">Prompt :</span>
                      {sl.prompt}
                    </div>
                  </div>

                  {/* Flèche droite */}
                  <button className="sdemo-arr" onClick={() => setSdSlide((s) => Math.min(SLIDES.length - 1, s + 1))} disabled={sdSlide === SLIDES.length - 1} aria-label="Exemple suivant">›</button>
                </div>
              </div>
            )
          })()}
          {/* FIN SEEDANCE DEMO */}

        </div>
      </section>

      {/* FEATURES */}
      <section className="s alt">
        <div className="si">
          <div className="split rv">
            <div>
              <div className="sp-eye">01 — Agents IA</div>
              <h3 className="sp-h">Pas un prompt box.<br />Une équipe créa complète.</h3>
              <p className="sp-p"><strong>Vous n&apos;avez plus à savoir prompter — les 5 agents le font pour vous.</strong> Vous décrivez votre projet en français comme à un freelance ; Director, Scriptwriter, Storyboarder, Music Supervisor et Visual Director traduisent en directions exécutables et prompts Seedance optimisés. Vous validez ou ajustez chaque agent indépendamment.</p>
              <div className="sp-checks">
                <div className="sp-ck"><div className="sp-ck-ico">✓</div>Brief en français naturel, zéro prompt à maîtriser</div>
                <div className="sp-ck"><div className="sp-ck-ico">✓</div>5 agents spécialisés qui travaillent en parallèle</div>
                <div className="sp-ck"><div className="sp-ck-ico">✓</div>Validez ou ajustez chaque agent sans tout relancer</div>
              </div>
              <a href="#agents" className="btn btn-g">Voir les 5 agents →</a>
            </div>
            <div className="sp-vis">
              <div style={{ padding: 20, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, padding: 13 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', letterSpacing: 1, marginBottom: 7 }}>🎬 DIRECTOR</div>
                    <div style={{ height: 5, background: 'var(--off2)', borderRadius: 3, marginBottom: 4, width: '90%' }}></div>
                    <div style={{ height: 5, background: 'var(--off2)', borderRadius: 3, width: '65%' }}></div>
                    <div style={{ marginTop: 9, display: 'inline-flex', padding: '3px 9px', background: '#FEF2F2', color: '#DC2626', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>✓ Validé</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, padding: 13 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#D97706', letterSpacing: 1, marginBottom: 7 }}>✍️ SCRIPT</div>
                    <div style={{ height: 5, background: 'var(--off2)', borderRadius: 3, marginBottom: 4 }}></div>
                    <div style={{ height: 5, background: 'var(--off2)', borderRadius: 3, width: '75%' }}></div>
                    <div style={{ marginTop: 9, display: 'inline-flex', padding: '3px 9px', background: '#FFFBEB', color: '#D97706', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>✓ Validé</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, padding: 13 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', letterSpacing: 1, marginBottom: 7 }}>🎨 STORYBOARD</div>
                    <div style={{ background: 'var(--blueL)', borderRadius: 6, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 7 }}>🎬</div>
                    <div style={{ display: 'inline-flex', padding: '3px 9px', background: 'var(--blueL)', color: 'var(--blue)', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>▶ Générer</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, padding: 13 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED', letterSpacing: 1, marginBottom: 7 }}>🎵 MUSIC</div>
                    <div style={{ height: 5, background: 'var(--off2)', borderRadius: 3, marginBottom: 4, width: '80%' }}></div>
                    <div style={{ height: 5, background: 'var(--off2)', borderRadius: 3, width: '55%' }}></div>
                    <div style={{ marginTop: 9, display: 'inline-flex', padding: '3px 9px', background: '#F5F3FF', color: '#7C3AED', borderRadius: 100, fontSize: 10, fontWeight: 600 }}>Ajuster</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="split rev rv">
            <div>
              <div className="sp-eye">02 — Génération</div>
              <h3 className="sp-h">API officielle ByteDance.<br />Source directe, sans intermédiaire.</h3>
              <p className="sp-p">ScenIQ accède à Seedance 2.0 <strong>via l&apos;API officielle ByteDance</strong> — réservée aux développeurs qui ont souscrit directement auprès de la source. Pas de surcouche, pas de revendeur. Résultat : vous obtenez les mises à jour du modèle en premier, les fonctionnalités avancées (références multimodales, génération audio synchronisée) et une stabilité que les outils grand public ne garantissent pas.</p>
              <div className="sp-checks">
                <div className="sp-ck"><div className="sp-ck-ico">✓</div>Audio-vidéo généré en une seule fois — synchronisation native</div>
                <div className="sp-ck"><div className="sp-ck-ico">✓</div>Références image, vidéo et audio respectées scène à scène</div>
                <div className="sp-ck"><div className="sp-ck-ico">✓</div>Lip-sync précis en français — micro-expressions naturelles</div>
                <div className="sp-ck"><div className="sp-ck-ico">✓</div>Direction caméra, physique des objets, textures haute fidélité</div>
              </div>
            </div>
            <div className="sp-vis" style={{ background: 'var(--blueL)' }}>
              <div style={{ padding: 24, width: '100%', display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 11, overflow: 'hidden' }}>
                  <div style={{ height: 90, background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>☀️</div>
                  <div style={{ padding: '11px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Scène 1 — Ouverture</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>8s · 720p · Audio natif</div>
                    </div>
                    <div style={{ display: 'inline-flex', padding: '3px 10px', background: 'var(--blueL)', color: 'var(--blue)', borderRadius: 100, fontSize: 10, fontWeight: 700, border: '1px solid var(--blueM)' }}>✓ Prêt</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌆</div>
                  <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--blueM)', borderRadius: 9, height: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <div style={{ fontSize: 11 }}>⚙️</div>
                    <div style={{ fontSize: 10, color: 'var(--blue)', fontWeight: 600 }}>Génération…</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="split rv">
            <div>
              <div className="sp-eye">03 — Export</div>
              <h3 className="sp-h">Un dossier de prod<br />prêt à livrer.</h3>
              <p className="sp-p">Clips MP4 numérotés et dossier de production structuré — script, storyboard, direction artistique, références musicales. Tout ce dont votre client ou monteur a besoin.</p>
              <a href="#pricing" className="btn btn-p">Commencer →</a>
            </div>
            <div className="sp-vis">
              <div style={{ padding: 22, width: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, padding: '11px 14px' }}>
                  <span style={{ fontSize: 18 }}>🎬</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>scene-01-ouverture.mp4</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>18.4 MB · 720p</div>
                  </div>
                  <span style={{ color: 'var(--muted)' }}>↓</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, padding: '11px 14px' }}>
                  <span style={{ fontSize: 18 }}>🎬</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>scene-02-personnage.mp4</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>23.1 MB · 720p</div>
                  </div>
                  <span style={{ color: 'var(--muted)' }}>↓</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 9, padding: '11px 14px' }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue)' }}>dossier-production.pdf</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Script + Storyboard + DA</div>
                  </div>
                  <span style={{ color: 'var(--muted)' }}>↓</span>
                </div>
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <div style={{ display: 'inline-flex', padding: '9px 20px', background: 'var(--blue)', color: '#fff', borderRadius: 100, fontSize: 13, fontWeight: 600 }}>↓ Tout télécharger</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section className="s alt" id="agents">
        <div className="si">
          <div className="s-eye rv">Les 5 agents IA</div>
          <h2 className="rv">Une équipe créa complète,<br />en 45 secondes.</h2>
          <p className="s-sub rv">Chaque agent a un rôle précis et des instructions métier calibrées. Ils tournent en parallèle.</p>
          <div className="ag-grid rv">
            <div className="ag"><div className="ag-ico">🎬</div><div className="ag-n">Director</div><div className="ag-r">Concept créatif &amp; angle narratif</div><div className="ag-s">« Le luxe, c&apos;est le temps retrouvé. » Micro-moments de pause dans une journée urbaine. Ton : silence puissant, calme revendiqué.</div></div>
            <div className="ag"><div className="ag-ico">✍️</div><div className="ag-n">Scriptwriter</div><div className="ag-r">Script voix-off + textes écran</div><div className="ag-s">[00-08s] NOIR. Silence. [08-22s] &quot;Il y a des matins où vous choisissez de commencer autrement.&quot; [22-28s] Logo. CTA.</div></div>
            <div className="ag"><div className="ag-ico">🎨</div><div className="ag-n">Storyboarder</div><div className="ag-r">Scènes → prompts Seedance 2.0</div><div className="ag-s">SCÈNE 1 [8s] — Extreme close-up, woman&apos;s hand placing perfume bottle on marble, golden morning light, shallow DoF.</div></div>
            <div className="ag"><div className="ag-ico">🎵</div><div className="ag-n">Music Supervisor</div><div className="ag-r">Ambiance sonore &amp; références</div><div className="ag-s">72 BPM, minimalisme contemplatif. Réf : Ólafur Arnalds — Near Light. Entrée piano à 8s, montée subtile à 22s.</div></div>
            <div className="ag"><div className="ag-ico">🖼️</div><div className="ag-n">Visual Director</div><div className="ag-r">Palette, typo &amp; motion design</div><div className="ag-s">Palette : #F5ECD7 crème, #1A1412 noir brun. Typo : Cormorant Garamond Light Italic. Transitions : fondu 12 frames.</div></div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="s" id="pricing">
        <div className="si">
          <div className="s-eye rv">Tarifs</div>
          <h2 className="rv">Simple. Prévisible.</h2>
          <p className="s-sub rv">~7 € par vidéo 30s inclus dans vos crédits mensuels.</p>
          <div className="pr-grid rv">
            {/* STUDIO */}
            <div className="plan">
              <div className="pl-name">Studio</div>
              <div className="pl-line">Freelance &amp; solo</div>
              <div className="pl-price"><span className="pl-cur">€</span><span className="pl-amt">49</span><span className="pl-per">/mois</span></div>
              <div className="pl-cost-line">soit ~4,90 € par vidéo 30s · facturé mensuel</div>
              <div className="pl-div"></div>

              <div className="pl-credits">
                <span className="pl-credits-i">⚡</span>
                <div>
                  <div className="pl-credits-t">10 crédits / mois</div>
                  <div className="pl-credits-s">1 crédit = 1 clip Seedance 2.0 (720p + audio)</div>
                </div>
              </div>

              <ul className="pl-feats">
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Jusqu&apos;à 10 vidéos / mois</div>
                    <div className="pl-feat-s">15s à 60s · formats 16:9, 9:16, 1:1, 4:3</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">1 marque enregistrée</div>
                    <div className="pl-feat-s">1 profil client avec logo et références visuelles</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">5 agents IA spécialisés</div>
                    <div className="pl-feat-s">Director, Scriptwriter, Storyboarder, Music, Visual</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Export clips MP4 + dossier PDF</div>
                    <div className="pl-feat-s">Tous les clips numérotés + brief structuré à livrer</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Support email</div>
                    <div className="pl-feat-s">Réponse sous 24h ouvrées</div>
                  </div>
                </li>
              </ul>
              <a href="mailto:hello@sceniq.app?subject=Plan Studio" className="btn btn-g" style={{ width: '100%', justifyContent: 'center' }}>Commencer</a>
            </div>

            {/* AGENCY — populaire */}
            <div className="plan feat">
              <div className="pl-badge">Populaire</div>
              <div className="pl-name">Agency</div>
              <div className="pl-line">Agences créa &amp; studios</div>
              <div className="pl-price"><span className="pl-cur">€</span><span className="pl-amt">199</span><span className="pl-per">/mois</span></div>
              <div className="pl-cost-line">soit ~3,98 € par vidéo 30s · facturé mensuel</div>
              <div className="pl-div"></div>

              <div className="pl-credits">
                <span className="pl-credits-i">⚡</span>
                <div>
                  <div className="pl-credits-t">50 crédits / mois</div>
                  <div className="pl-credits-s">crédits non utilisés reportés sur 30 jours</div>
                </div>
              </div>

              <ul className="pl-feats">
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Jusqu&apos;à 50 vidéos / mois</div>
                    <div className="pl-feat-s">Idéal pour 5 à 10 clients actifs en parallèle</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">5 marques enregistrées</div>
                    <div className="pl-feat-s">1 profil par client — bascule en 1 clic</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Brand Memory par marque</div>
                    <div className="pl-feat-s">Upload logo, palette, refs visuelles, ton — les agents s&apos;en imprègnent automatiquement</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">5 agents IA + ajustement par agent</div>
                    <div className="pl-feat-s">Valide ou ajuste chaque proposition indépendamment</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Export MP4 + dossier PDF complet</div>
                    <div className="pl-feat-s">Téléchargement individuel ou .zip global</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Support prioritaire</div>
                    <div className="pl-feat-s">Réponse sous 4h ouvrées · canal direct</div>
                  </div>
                </li>
              </ul>
              <a href="mailto:hello@sceniq.app?subject=Plan Agency" className="btn btn-p" style={{ width: '100%', justifyContent: 'center' }}>Commencer →</a>
            </div>

            {/* WHITE-LABEL */}
            <div className="plan">
              <div className="pl-name">White-label</div>
              <div className="pl-line">Agences premium &amp; studios production</div>
              <div className="pl-price"><span className="pl-cur">€</span><span className="pl-amt">599</span><span className="pl-per">/mois</span></div>
              <div className="pl-cost-line">tarif dégressif au-delà de 200 vidéos / mois</div>
              <div className="pl-div"></div>

              <div className="pl-credits">
                <span className="pl-credits-i">∞</span>
                <div>
                  <div className="pl-credits-t">Crédits illimités</div>
                  <div className="pl-credits-s">Aucune limite mensuelle · usage fair-use</div>
                </div>
              </div>

              <ul className="pl-feats">
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Vidéos illimitées</div>
                    <div className="pl-feat-s">Toutes durées, tous formats, sans plafond</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Marques illimitées</div>
                    <div className="pl-feat-s">Idéal pour agence avec 20+ clients actifs</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Marque blanche (white-label)</div>
                    <div className="pl-feat-s">Dossier PDF aux couleurs de ton agence — pas de mention « ScenIQ »</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Accès API complet</div>
                    <div className="pl-feat-s">Automatise depuis Make, Zapier, ou ton propre outil</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Onboarding dédié (2h visio)</div>
                    <div className="pl-feat-s">Setup des marques, formation des équipes, intégration workflow</div>
                  </div>
                </li>
                <li>
                  <span className="ck">✓</span>
                  <div className="pl-feat-l">
                    <div className="pl-feat-t">Canal Slack partagé</div>
                    <div className="pl-feat-s">Accès direct à l&apos;équipe ScenIQ · réponse &lt; 1h ouvrée</div>
                  </div>
                </li>
              </ul>
              <a href="mailto:hello@sceniq.app?subject=White-label" className="btn btn-g" style={{ width: '100%', justifyContent: 'center' }}>Nous contacter</a>
            </div>
          </div>

          {/* RÉASSURANCE — commun aux 3 plans */}
          <div className="pricing-common">
            <div className="pc-item">
              <div className="pc-ico">🎁</div>
              <div>
                <div className="pc-t">2 vidéos offertes</div>
                <div className="pc-s">À l&apos;essai, sans carte bancaire</div>
              </div>
            </div>
            <div className="pc-item">
              <div className="pc-ico">↩</div>
              <div>
                <div className="pc-t">Sans engagement</div>
                <div className="pc-s">Mensuel, annulable à tout moment</div>
              </div>
            </div>
            <div className="pc-item">
              <div className="pc-ico">🔒</div>
              <div>
                <div className="pc-t">Tu es propriétaire</div>
                <div className="pc-s">Usage commercial inclus, livraison client OK</div>
              </div>
            </div>
            <div className="pc-item">
              <div className="pc-ico">↻</div>
              <div>
                <div className="pc-t">Remboursement auto</div>
                <div className="pc-s">Génération qui échoue = crédit recrédité</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="s alt" id="faq">
        <div className="si" style={{ maxWidth: 640 }}>
          <div className="s-eye rv">FAQ</div>
          <h2 className="rv" style={{ marginBottom: 36 }}>Questions fréquentes</h2>
          <div className="faq rv">
            <div className="fi"><button className="fq">Dois-je apprendre à écrire des prompts comme avec ChatGPT ou Midjourney ?<span className="fi-ico">+</span></button><div className="fa">Non. ScenIQ n&apos;est pas un prompt box. Vous décrivez votre projet en français naturel — exactement comme à un freelance ou un directeur créatif. Les 5 agents IA traduisent votre brief en directions artistiques, script, storyboard, choix musicaux et prompts Seedance optimisés. Vous ne touchez jamais à la syntaxe technique.</div></div>
            <div className="fi"><button className="fq">Quelle différence avec utiliser ChatGPT + Runway/Midjourney directement ?<span className="fi-ico">+</span></button><div className="fa">Avec ChatGPT + Runway, vous êtes le chef d&apos;orchestre : vous coordonnez 3-4 outils, vous re-promptez à chaque scène, vous gérez la cohérence visuelle manuellement, vous compilez les livrables. ScenIQ fait ce travail pour vous — 5 agents IA spécialisés, mémoire de marque, génération Seedance 2.0 Pro, et dossier de production prêt à livrer. Vous restez décisionnaire ; vous n&apos;êtes plus orchestrateur technique.</div></div>
            <div className="fi"><button className="fq">Pourquoi Seedance 2.0 et pas Runway, Veo ou Kling ?<span className="fi-ico">+</span></button><div className="fa">ScenIQ utilise l&apos;API officielle ByteDance — <strong>accès direct à la source</strong>, pas via un intermédiaire. Concrètement : (1) <strong>Audio et vidéo générés ensemble</strong> — Runway et Kling livrent muet, vous repassez derrière avec un monteur. (2) <strong>Lip-sync précis en français</strong> — décisif pour voix off, témoignages et talking heads. (3) <strong>Direction caméra en langage naturel</strong> — vous écrivez « travelling sur la main qui prend le flacon », Seedance l&apos;exécute. (4) <strong>Cohérence scène à scène</strong> — Brand Memory transmet vos références visuelles automatiquement à chaque clip. Aucun autre outil grand public ne combine ces quatre forces.</div></div>
            <div className="fi"><button className="fq">Ai-je besoin de compétences techniques ?<span className="fi-ico">+</span></button><div className="fa">Aucune. Vous entrez un brief en langage naturel, validez les propositions des agents, cliquez &quot;Générer&quot;. Aucune connaissance en IA, vidéo ou code n&apos;est requise. Si vous savez briefer un freelance, vous savez utiliser ScenIQ.</div></div>
            <div className="fi"><button className="fq">Combien coûte vraiment une vidéo de 30 secondes ?<span className="fi-ico">+</span></button><div className="fa">La génération via l&apos;API native ByteDance revient à environ 3-4 € par clip de 10s (720p, audio inclus). Ce coût est couvert par vos crédits mensuels. Un plan Agency à 199 €/mois donne 50 vidéos — moins de 4 € par vidéo livrée.</div></div>
            <div className="fi"><button className="fq">Quelle est la qualité des vidéos ?<span className="fi-ico">+</span></button><div className="fa">Seedance 2.0 via API officielle ByteDance — 720p avec audio natif synchronisé. Qualité suffisante pour spots LinkedIn, Instagram, TikTok, landing pages et présentations client. La cohérence visuelle est assurée par Brand Memory : chaque scène reprend automatiquement le logo, la palette et les références de votre marque. Mouvements fluides, textures réalistes, micro-expressions naturelles — directement depuis la source.</div></div>
            <div className="fi"><button className="fq">Puis-je utiliser les vidéos pour mes clients ?<span className="fi-ico">+</span></button><div className="fa">Oui. Vous êtes propriétaire des vidéos générées. Utilisation commerciale incluse — livraison client, publication réseaux sociaux, campagnes publicitaires. Le plan White-label permet en plus de livrer le dossier de production sans mention ScenIQ.</div></div>
            <div className="fi"><button className="fq">Combien de temps pour générer une vidéo de 30s ?<span className="fi-ico">+</span></button><div className="fa">Les 5 agents produisent leurs propositions en ~45 secondes. La génération Seedance prend 2 à 4 minutes par scène. Pour 4 scènes, comptez 10 à 15 minutes au total.</div></div>
          </div>
        </div>
      </section>

      {/* CTA FINAL — vidéo 5 agents en background, fond noir comme la section mission */}
      <div className="cta-final">
        <video
          className="cta-final-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
        >
          <source src="/showcase/5agents.mp4" type="video/mp4" />
        </video>
        <div className="cta-final-overlay" aria-hidden="true"></div>
        <h2>Prêt à produire<br />sans studio ?</h2>
        <p className="cta-final-p">Brief → agents IA → clips Seedance 2.0 → dossier de production. La première vidéo en moins de 4 minutes.</p>
        <a href="mailto:hello@sceniq.app?subject=Accès beta ScenIQ" className="btn btn-p btn-xl">Demander l&apos;accès beta →</a>
        <div className="cta-badges">
          <span className="cb">10 agences fondatrices</span>
          <span className="cb">Tarif préférentiel</span>
          <span className="cb">2 vidéos offertes</span>
          <span className="cb">Sans engagement</span>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="fl">
          <img src="/sceniq-logo-dark.svg" alt="ScenIQ" height={36} style={{ height: 36, width: 'auto', display: 'block' }} />
        </div>
        <ul className="f-links">
          <li><a href="mailto:hello@sceniq.app">Contact</a></li>
          <li><a href="#">Mentions légales</a></li>
          <li><a href="#">CGU</a></li>
          <li><a href="#">Confidentialité</a></li>
        </ul>
        <span className="f-copy">© 2025 ScenIQ. Tous droits réservés.</span>
      </footer>

      {/* MODALE VIDÉO — ouvre au clic sur une carte du carousel */}
      {openVideo && (
        <div
          className="video-modal-backdrop"
          onClick={() => setOpenVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Lecture ${openVideo}.mp4`}
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
