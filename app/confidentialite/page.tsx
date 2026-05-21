// app/confidentialite/page.tsx
import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité — ScenIQ',
  description: 'Comment ScenIQ collecte, utilise et protège vos données personnelles.',
}

export default function ConfidentialitePage() {
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
            RGPD
          </span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', margin: '0 0 48px' }}>
          Dernière mise à jour : mai 2026
        </p>

        <Section title="Qui sommes-nous ?">
          <p style={pStyle}>
            ScenIQ est une agence IA de production vidéo publicitaire, exploitée en micro-entreprise par Pascal Ekloui. Responsable du traitement des données : Pascal Ekloui — <a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>.
          </p>
        </Section>

        <Section title="Données collectées">
          <p style={pStyle}>ScenIQ collecte uniquement les données nécessaires à la réalisation de votre commande :</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: '20px' }}>
            <DataItem label="Données d'identification" desc="prénom, adresse e-mail, numéro de téléphone (optionnel)" />
            <DataItem label="Données de commande" desc="brief créatif, format vidéo, durée, créneau de livraison souhaité, images de référence uploadées" />
            <DataItem label="Données de paiement" desc="traitées exclusivement par Stripe — ScenIQ ne stocke aucun numéro de carte" />
          </ul>
          <p style={pStyle}>
            Le site ne recourt à aucun cookie publicitaire ni traceur de navigation.
          </p>
        </Section>

        <Section title="Finalités et base légale">
          <Row label="Exécution de commande" value="Traiter votre commande et livrer la vidéo — base : contrat" />
          <Row label="Communication" value="Vous envoyer les emails liés à votre commande — base : intérêt légitime" />
          <Row label="Formulaire de contact" value="Répondre à vos questions — base : intérêt légitime" />
          <Row label="Facturation" value="Respect des obligations comptables légales — base : obligation légale" />
        </Section>

        <Section title="Durée de conservation">
          <Row label="Données de commande" value="3 ans après la livraison de la vidéo" />
          <Row label="Données de facturation" value="10 ans (obligation légale comptable)" />
          <Row label="Emails de contact" value="1 an" />
          <Row label="Images uploadées" value="Supprimées sous 30 jours après livraison" />
        </Section>

        <Section title="Sous-traitants (données transférées)">
          <Row label="Stripe" value="Paiement sécurisé — USA, certifié PCI-DSS" />
          <Row label="Vercel" value="Hébergement — USA" />
          <Row label="Supabase" value="Base de données — EU West (Irlande)" />
          <Row label="Anthropic" value="Génération des agents IA (brief, concept, storyboard) — USA" />
          <Row label="BytePlus / ByteDance" value="Génération vidéo Seedance 2.0 — Singapour" />
        </Section>

        <Section title="Vos droits (RGPD)">
          <p style={pStyle}>
            Conformément au Règlement européen 2016/679 (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :
          </p>
          <ul style={{ margin: '0 0 16px', paddingLeft: '20px' }}>
            {[
              'Droit d\'accès à vos données',
              'Droit de rectification',
              'Droit à l\'effacement (« droit à l\'oubli »)',
              'Droit à la limitation du traitement',
              'Droit à la portabilité',
              'Droit d\'opposition',
            ].map((right) => (
              <li key={right} style={{ fontSize: '15px', color: 'rgba(255,255,255,.75)', marginBottom: '6px', lineHeight: 1.6 }}>
                {right}
              </li>
            ))}
          </ul>
          <p style={pStyle}>
            Pour exercer ces droits, contactez-nous à <a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>. Nous répondrons sous 30 jours.
          </p>
          <p style={pStyle}>
            Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#A5B4FC' }}>CNIL</a> (Commission Nationale de l'Informatique et des Libertés).
          </p>
        </Section>

        <Section title="Cookies">
          <p style={pStyle}>
            ScenIQ n'utilise aucun cookie publicitaire ou de suivi. Le seul cookie déposé est celui de session Stripe, strictement nécessaire au traitement de votre paiement.
          </p>
        </Section>

        <Section title="Sécurité">
          <p style={pStyle}>
            Les communications entre votre navigateur et nos serveurs sont chiffrées via HTTPS/TLS. Les données de paiement sont tokenisées par Stripe et ne transitent jamais par nos serveurs. Les fichiers uploadés sont stockés dans un bucket privé Supabase avec accès restreint.
          </p>
        </Section>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <Link href="/mentions-legales" style={{ color: '#A5B4FC', fontSize: '14px', textDecoration: 'none' }}>
            ← Mentions légales
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

function Row({ label, value }: { label: string; value: string }) {
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

function DataItem({ label, desc }: { label: string; desc: string }) {
  return (
    <li style={{ fontSize: '15px', color: 'rgba(255,255,255,.75)', marginBottom: '8px', lineHeight: 1.6 }}>
      <strong style={{ color: '#fff', fontWeight: 600 }}>{label}</strong> — {desc}
    </li>
  )
}
