'use client'

import { useState } from 'react'

const AGENTS = [
  { id: 'director',     emoji: '🎬', label: 'Director' },
  { id: 'scriptwriter', emoji: '✍️',  label: 'Scriptwriter' },
  { id: 'storyboarder', emoji: '🎞️',  label: 'Storyboarder' },
  { id: 'music',        emoji: '🎵', label: 'Music Supervisor' },
  { id: 'visual',       emoji: '🎨', label: 'Visual Director' },
]

type AgentResult = { content: string | null; error: string | null; scenes?: { index: number; duration: string; description: string; seedancePrompt: string }[] }
type Results = Record<string, AgentResult> & { successCount?: number }

export default function SandboxPage() {
  const [brief, setBrief]       = useState('')
  const [duration, setDuration] = useState(30)
  const [loading, setLoading]   = useState(false)
  const [elapsed, setElapsed]   = useState<number | null>(null)
  const [results, setResults]   = useState<Results | null>(null)
  const [active, setActive]     = useState('director')

  async function run() {
    if (!brief.trim() || loading) return
    setLoading(true)
    setResults(null)
    setElapsed(null)
    const t0 = Date.now()
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, durationSec: duration }),
      })
      const data = await res.json()
      setElapsed(Math.round((Date.now() - t0) / 1000))
      setResults(data)
      setActive('director')
    } catch (e) {
      setResults({ error: String(e) } as any)
    } finally {
      setLoading(false)
    }
  }

  const activeResult = results ? results[active] as AgentResult : null

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#f9fafb', fontFamily: 'Geist, sans-serif', padding: '40px 24px' }}>

      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>ScenIQ</span>
          <span style={{ background: '#4F46E5', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>SANDBOX</span>
        </div>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Test des 5 agents IA — sans auth ni BDD</p>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 900, margin: '0 auto 32px', background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24 }}>
        <textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder="Décris le projet en 2 lignes — ex : Lancer une nouvelle parfumerie bio parisienne, cible 25-40 ans, ton poétique et naturel"
          rows={3}
          style={{
            width: '100%', background: '#0f0f1a', border: '1px solid #374151',
            borderRadius: 8, padding: '12px 16px', color: '#f9fafb', fontSize: 15,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[5, 8, 12, 15, 30, 45, 60].map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                style={{
                  padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: duration === d ? '2px solid #4F46E5' : '2px solid #374151',
                  background: duration === d ? '#4F46E5' : '#0f0f1a',
                  color: duration === d ? '#fff' : '#9CA3AF',
                  transition: 'all 0.15s',
                }}
              >{d}s</button>
            ))}
          </div>
          <button
            onClick={run}
            disabled={loading || !brief.trim()}
            style={{
              marginLeft: 'auto', padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: loading || !brief.trim() ? 'not-allowed' : 'pointer',
              background: loading || !brief.trim() ? '#374151' : '#4F46E5',
              color: '#fff', border: 'none',
            }}
          >
            {loading ? '⏳ Agents en cours…' : '▶ Lancer les 5 agents'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ maxWidth: 900, margin: '0 auto 32px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            {AGENTS.map((a, i) => (
              <div key={a.id} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: '#1a1a2e', border: '1px solid #2d2d4e', color: '#6B7280',
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}>{a.emoji} {a.label}</div>
            ))}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
          Les 5 agents tournent en parallèle…
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#059669', fontWeight: 700 }}>
              ✅ {results.successCount}/5 agents réussis
            </span>
            {elapsed && <span style={{ fontSize: 13, color: '#6B7280' }}>en {elapsed}s</span>}
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              {AGENTS.map(a => {
                const r = results[a.id] as AgentResult
                const ok = r?.content && !r?.error
                return (
                  <button
                    key={a.id}
                    onClick={() => setActive(a.id)}
                    style={{
                      padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', border: 'none', textAlign: 'left', whiteSpace: 'nowrap',
                      background: active === a.id ? '#4F46E5' : '#1a1a2e',
                      color: active === a.id ? '#fff' : ok ? '#d1fae5' : '#f87171',
                    }}
                  >
                    {a.emoji} {a.label} {ok ? '✓' : '✗'}
                  </button>
                )
              })}
            </div>

            {/* Content */}
            <div style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 12, padding: 24, minHeight: 400 }}>
              {activeResult?.error && (
                <div style={{ color: '#f87171', fontSize: 14 }}>❌ {activeResult.error}</div>
              )}
              {activeResult?.content && (
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.8, color: '#e5e7eb', fontFamily: 'inherit', margin: 0 }}>
                  {activeResult.content}
                </pre>
              )}
              {/* Scenes summary for storyboarder */}
              {active === 'storyboarder' && activeResult?.scenes && activeResult.scenes.length > 0 && (
                <div style={{ marginTop: 24, borderTop: '1px solid #2d2d4e', paddingTop: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                    {activeResult.scenes.length} scènes parsées
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeResult.scenes.map(s => (
                      <div key={s.index} style={{ background: '#0f0f1a', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                        <span style={{ color: '#A5B4FC', fontWeight: 700 }}>Scène {s.index}</span>
                        <span style={{ color: '#6B7280', marginLeft: 8 }}>[{s.duration}s]</span>
                        <span style={{ color: '#d1d5db', marginLeft: 8 }}>{s.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
