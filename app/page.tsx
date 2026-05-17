'use client'

import { useEffect, useState } from 'react'
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
          <li><a href="#exemples">Réalisations</a></li>
          <li><a href="#process">Le process</a></li>
          <li><a href="#pricing">Tarifs</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-r">
          <a href="#devis" className="btn btn-p">Demander un devis →</a>
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
              <a href="#devis" className="btn btn-p" style={{width:'100%',justifyContent:'center'}} onClick={() => setMobileMenuOpen(false)}>Demander un devis →</a>
            </div>
          </div>
        </div>
      )}

      {/* ═════ HERO SPLIT — gauche contenu, droite grille reels ═════ */}
      <section className="hero-rw" id="main-content" aria-label="Hero ScenIQ">
        <div className="hero-rw-content">
          <h1 className="hero-rw-title">
            Vos vidéos.<br />
            <em>Notre équipe créa.</em><br />
            48 heures.
          </h1>

          <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink2)', margin: '18px 0 22px', maxWidth: 520 }}>
            Vous nous envoyez deux lignes et vos références. Notre équipe créa vous livre une vidéo IA prête à diffuser — concept, scénario, storyboard, son et finalisation inclus. Sans tokens, sans interface à apprendre, sans surprise sur la facture.
          </p>

          <div className="hero-rw-categories" aria-hidden="true">
            <span>REELS · STORIES · TIKTOK</span>
            <span>BRAND FILM · TEASER</span>
            <span>LANCEMENT PRODUIT · CAMPAGNE</span>
            <span>ADS DIGITAUX · PITCH</span>
            <span style={{ color: '#A5B4FC' }}>UN INTERLOCUTEUR · UN PRIX FERME</span>
          </div>

          <div className="hero-rw-bottom">
            <a href="#devis" className="hero-rw-cta">
              Demander un devis
              <span className="hero-rw-cta-ico">›</span>
            </a>
            <span className="hero-rw-note">Réponse sous 4h ouvrées · Devis gratuit</span>
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

      {/* HOW — Process agence en 4 étapes */}
      <section className="s" id="process">
        <div className="si">
          <div className="s-eye rv">Le process</div>
          <h2 className="rv">Vous briefez. Je livre.</h2>
          <p className="s-sub rv" style={{ maxWidth: 'none' }}>
            Quatre étapes, un seul interlocuteur. Vous ne touchez à aucun outil — vous validez à chaque étape, je m&apos;occupe du reste.
          </p>
          <div className="steps rv">
            <div className="step">
              <div className="sn">01</div>
              <div className="si2">✉️</div>
              <div className="st">Vous m&apos;envoyez votre brief</div>
              <div className="sd">
                Deux lignes, vos références (logo, charte, visuels, audio si voix-off) et le format souhaité. Je reviens vers vous sous 4&nbsp;h ouvrées avec un devis ferme.
              </div>
            </div>
            <div className="step">
              <div className="sn">02</div>
              <div className="si2">🎬</div>
              <div className="st">Je vous livre la pré-prod</div>
              <div className="sd">
                Concept créatif, storyboard 4 scènes, ambiance sonore, prompt final. Vous découvrez ce que la vidéo va raconter avant qu&apos;une seule image ne soit générée.
              </div>
            </div>
            <div className="step">
              <div className="sn">03</div>
              <div className="si2">🔁</div>
              <div className="st">On itère jusqu&apos;à validation</div>
              <div className="sd">
                10 allers-retours inclus. Vous pouvez ajuster le ton, le rythme, une scène, la musique. Je modifie. Vous validez. Pas de chrono, pas de stress.
              </div>
            </div>
            <div className="step">
              <div className="sn">04</div>
              <div className="si2">▶</div>
              <div className="st">Je livre la vidéo sous 48&nbsp;h</div>
              <div className="sd">
                MP4 prêt à diffuser, dans le format demandé, avec son. Vous recevez aussi le dossier de production (concept, script, storyboard) — utile si vous voulez décliner.
              </div>
            </div>
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
          <h2 className="rv">Un prix par vidéo. Rien à comprendre.</h2>
          <p className="s-sub rv">
            Pas de tokens, pas de crédits, pas de surprise. Vous choisissez une durée, vous savez ce que vous payez.
            Tous les formats inclus (vertical, horizontal, carré, cinéma). 10 itérations incluses sur chaque vidéo. Livraison sous 48&nbsp;h après validation finale.
          </p>

          <div
            className="rv"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginTop: 32,
              maxWidth: 1100,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {[
              { dur: '5 sec',  price: 49,  use: 'Story · Bumper · Logo reveal' },
              { dur: '8 sec',  price: 69,  use: 'Reel court · Teaser produit' },
              { dur: '10 sec', price: 89,  use: 'Spot social · Ad digital',         featured: true },
              { dur: '12 sec', price: 109, use: 'Brand film court · Campagne' },
              { dur: '15 sec', price: 139, use: 'Pub TV · Format long social' },
            ].map((p) => (
              <div
                key={p.dur}
                style={{
                  background: 'var(--white)',
                  border: p.featured ? '2px solid var(--blue)' : '1.5px solid var(--border)',
                  borderRadius: 14,
                  padding: '22px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: p.featured ? '0 6px 24px rgba(99,102,241,.12)' : 'none',
                }}
              >
                {p.featured && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -11,
                      left: 18,
                      background: 'var(--blue)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 6,
                      letterSpacing: 0.3,
                    }}
                  >
                    Le plus demandé
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink2)', letterSpacing: 0.3 }}>
                  {p.dur}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                    marginTop: 6,
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.2, color: 'var(--ink)' }}>{p.price}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>€</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>HT / vidéo</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.4, minHeight: 30 }}>
                  {p.use}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rv"
            style={{
              maxWidth: 1100,
              margin: '32px auto 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 18,
              padding: '20px 22px',
              background: 'var(--off)',
              borderRadius: 14,
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>📐 Tous formats inclus</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4, lineHeight: 1.45 }}>
                21:9 · 16:9 · 4:3 · 1:1 · 3:4 · 9:16 — TV, reels, stories, TikTok, posts, présentations
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>🔁 10 itérations incluses</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4, lineHeight: 1.45 }}>
                Ajustements concept, script, storyboard, ambiance — jusqu&apos;à ce que vous validiez. +9 €/itération au-delà.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>⏱ Livraison 48 h</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4, lineHeight: 1.45 }}>
                Délai garanti après validation finale du brief. Préprod livrée en 4 h ouvrées.
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>🔒 Vous êtes propriétaire</div>
              <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4, lineHeight: 1.45 }}>
                Usage commercial inclus. Aucune mention ScenIQ sur les livrables. Vos vidéos, votre marque.
              </div>
            </div>
          </div>

          <div className="rv" style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#devis" className="btn btn-p btn-lg">Demander un devis →</a>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
              Réponse sous 4 h ouvrées · Devis gratuit · Aucun engagement
            </p>
          </div>

          <div
            className="rv"
            style={{
              marginTop: 36,
              padding: '14px 18px',
              background: 'rgba(99,102,241,.06)',
              border: '1px solid rgba(99,102,241,.18)',
              borderRadius: 10,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
              fontSize: 13,
              color: 'var(--ink2)',
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: 'var(--blue)' }}>Volume ?</strong>{' '}
            Au-delà de 10 vidéos/mois pour le même client, je propose un forfait dégressif personnalisé.
            Mentionnez-le dans votre brief.
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
        <h2 id="devis">Vous avez un projet ?<br />Parlons-en.</h2>
        <p className="cta-final-p">
          Envoyez-moi votre brief en deux lignes — je reviens vers vous sous 4&nbsp;h ouvrées avec un devis ferme et une première proposition créative.
        </p>
        <a
          href={`mailto:hello@sceniq.app?subject=${encodeURIComponent('Demande de devis — ScenIQ')}&body=${encodeURIComponent(
            'Bonjour Pascal,\n\n' +
            '— Mon brief (2 lignes max) :\n\n\n' +
            '— Format souhaité (16:9, 9:16, 1:1, 21:9, 3:4, 4:3) :\n\n' +
            '— Durée souhaitée (5, 8, 10, 12, 15 sec) :\n\n' +
            '— Marque / contexte :\n\n' +
            '— Références (liens vers logo, visuels, audio voix-off si applicable) :\n\n' +
            '— Échéance souhaitée :\n\n' +
            '— Volume estimé (nb de vidéos) :\n\n\n' +
            'Merci !'
          )}`}
          className="btn btn-p btn-xl"
        >
          Envoyer mon brief →
        </a>
        <div className="cta-badges">
          <span className="cb">Réponse sous 4&nbsp;h ouvrées</span>
          <span className="cb">Devis gratuit · Sans engagement</span>
          <span className="cb">Livraison sous 48&nbsp;h</span>
          <span className="cb">10 itérations incluses</span>
        </div>

        <div
          style={{
            marginTop: 56,
            padding: '24px 28px',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid rgba(255,255,255,.10)',
            borderRadius: 14,
            maxWidth: 620,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: '#A5B4FC', textTransform: 'uppercase' }}>
            Bientôt
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '8px 0 8px', letterSpacing: -0.4 }}>
            Version self-service · 2027
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,.78)', margin: '0 0 16px' }}>
            Une plateforme où vous générez vos vidéos vous-mêmes, dans votre interface, sans passer par moi.
            Pour l&apos;instant je préfère vous accompagner à la main — c&apos;est comme ça que je garantis la qualité.
          </p>
          <a
            href={`mailto:hello@sceniq.app?subject=${encodeURIComponent('Waitlist V2 self-service ScenIQ')}&body=${encodeURIComponent(
              'Bonjour,\n\nJe souhaite être prévenu(e) du lancement de la version self-service de ScenIQ en 2027.\n\nMon email : \nMa structure : \nUsage prévu : \n\nMerci !'
            )}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 22px',
              borderRadius: 8,
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,.30)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background .15s, border-color .15s',
            }}
          >
            M&apos;inscrire à la waitlist →
          </a>
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
