// app/commande/success/page.tsx
// Page post-paiement Stripe — affiché après checkout.session.completed
// Query params : ?session_id=xxx&order_id=xxx

import Link from 'next/link'

export const metadata = {
  title: 'Commande confirmée — ScenIQ',
  description: 'Votre commande a bien été reçue. Je vous rappelle sous 4 h ouvrées.',
}

export default function CommandeSuccessPage() {
  return (
    <main style={{
      minHeight: '100vh', background: '#0a0a14', color: '#f5f2ec',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px', fontFamily: 'var(--f)',
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>

        {/* Icône succès */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(74,222,128,.12)', border: '2px solid rgba(74,222,128,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px', fontSize: 30,
        }}>
          ✓
        </div>

        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase', color: '#4ade80',
          background: 'rgba(74,222,128,.1)', padding: '5px 14px',
          borderRadius: 4, marginBottom: 20,
        }}>
          Paiement confirmé
        </div>

        <h1 style={{
          fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 700,
          letterSpacing: -1, lineHeight: 1.1, color: '#fff', marginBottom: 18,
        }}>
          Votre commande est lancée.
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,.75)', marginBottom: 36 }}>
          Je vous rappelle dans les <strong style={{ color: '#A5B4FC' }}>4 heures ouvrées</strong> pour
          caler la préprod. Consultez vos emails — un récap de votre commande vient de vous être envoyé.
        </p>

        {/* Étapes suivantes */}
        <div style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 12, padding: '24px 28px', marginBottom: 36, textAlign: 'left',
        }}>
          <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>
            Ce qui se passe ensuite
          </p>
          {[
            { icon: '📞', text: 'Je vous appelle sous 4 h ouvrées pour valider le brief et les refs' },
            { icon: '🤖', text: '5 agents IA préparent le concept, le storyboard et l\'ambiance sonore' },
            { icon: '✏️', text: 'Vous validez la préprod — 10 itérations incluses, sans surcoût' },
            { icon: '🎬', text: 'Livraison du MP4 final sous 48 h après validation' },
          ].map(({ icon, text }, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '10px 0',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,.06)' : 'none',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', marginBottom: 24 }}>
          Une question&nbsp;?{' '}
          <a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC', textDecoration: 'none' }}>
            support@sceniq.studio
          </a>
        </p>

        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'rgba(255,255,255,.5)', textDecoration: 'none',
        }}>
          ← Retour à l&apos;accueil
        </Link>

      </div>
    </main>
  )
}
