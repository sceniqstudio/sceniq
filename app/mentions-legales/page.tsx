// app/mentions-legales/page.tsx
import Link from 'next/link'

export const metadata = {
  title: 'Mentions légales — ScenIQ',
  description: 'Mentions légales du site ScenIQ, agence IA de production vidéo publicitaire.',
}

export default function MentionsLegalesPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a14',
      color: '#f5f2ec',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Nav minimal */}
      <nav style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          color: '#f5f2ec',
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}>
          ← ScenIQ
        </Link>
      </nav>

      {/* Contenu */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px 80px' }}>

        <div style={{
          background: '#7C5CFC',
          borderRadius: '6px',
          padding: '4px 12px',
          display: 'inline-block',
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#fff' }}>
            Légal
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Mentions légales
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', margin: '0 0 48px' }}>
          Dernière mise à jour : mai 2026
        </p>

        <Section title="Éditeur du site">
          <Row label="Raison sociale" value="ScenIQ" />
          <Row label="Statut" value="Micro-entreprise" />
          <Row label="Responsable de publication" value="Pascal Ekloui" />
          <Row label="Email" value={<a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>} />
          <Row label="Téléphone" value={<a href="tel:+33756808831" style={{ color: '#A5B4FC' }}>+33 7 56 80 88 31</a>} />
        </Section>

        <Section title="Hébergement">
          <Row label="Hébergeur" value="Vercel Inc." />
          <Row label="Adresse" value="340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis" />
          <Row label="Site" value={<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#A5B4FC' }}>vercel.com</a>} />
        </Section>

        <Section title="Propriété intellectuelle">
          <p style={pStyle}>
            L'ensemble des contenus présents sur le site ScenIQ — textes, visuels, vidéos, logotypes et interface — est protégé par le droit de la propriété intellectuelle et appartient à ScenIQ ou fait l'objet d'une autorisation d'utilisation.
          </p>
          <p style={pStyle}>
            Toute reproduction, distribution ou utilisation sans autorisation expresse est interdite.
          </p>
        </Section>

        <Section title="Vidéos de démonstration">
          <p style={pStyle}>
            Les vidéos présentées sur ce site ont été générées par intelligence artificielle via Seedance 2.0 (BytePlus / ByteDance). Elles sont utilisées à des fins de démonstration. Toute ressemblance avec des marques, produits ou personnes existants est fortuite.
          </p>
        </Section>

        <Section title="Limitation de responsabilité">
          <p style={pStyle}>
            ScenIQ s'efforce de fournir des informations exactes et à jour. Toutefois, le site peut contenir des erreurs ou omissions. ScenIQ ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du site.
          </p>
        </Section>

        <Section title="Droit applicable">
          <p style={pStyle}>
            Le présent site est soumis au droit français. Tout litige relatif à son utilisation relève de la compétence des tribunaux français.
          </p>
        </Section>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <Link href="/confidentialite" style={{ color: '#A5B4FC', fontSize: '14px', textDecoration: 'none' }}>
            Politique de confidentialité →
          </Link>
        </div>

      </main>

      {/* Footer minimal */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,.08)',
        padding: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'rgba(255,255,255,.3)',
      }}>
        © 2026 ScenIQ · <Link href="/" style={{ color: 'rgba(255,255,255,.3)', textDecoration: 'none' }}>Retour à l'accueil</Link>
      </footer>
    </div>
  )
}

// ── Composants internes ───────────────────────────────────────────────────────

const pStyle: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: 1.7,
  color: 'rgba(255,255,255,.75)',
  margin: '0 0 12px',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: 700,
        color: '#fff',
        margin: '0 0 16px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255,255,255,.1)',
        letterSpacing: '-0.2px',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      padding: '8px 0',
      fontSize: '14px',
      borderBottom: '1px solid rgba(255,255,255,.05)',
    }}>
      <span style={{ color: 'rgba(255,255,255,.4)', minWidth: '200px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,.85)' }}>{value}</span>
    </div>
  )
}
