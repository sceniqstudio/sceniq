// app/confidentialite/page.tsx
import LegalHeader from '@/app/_components/LegalHeader'
import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité — ScenIQ',
  description: 'Politique de confidentialité et protection des données personnelles — ScenIQ.',
}

export default function ConfidentialitePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#f5f2ec', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <LegalHeader />

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 80px' }}>

        <div style={{ background: '#7C5CFC', borderRadius: '6px', padding: '4px 12px', display: 'inline-block', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#fff' }}>Légal</span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px', color: '#fff' }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', margin: '0 0 48px' }}>
          Dernière mise à jour : mai 2026
        </p>

        {/* Article 1 */}
        <Section title="1. Responsable du traitement">
          <p style={pStyle}>Le responsable du traitement de vos données personnelles est :</p>
          <Row label="Raison sociale"   value="DESIGN SPRINT EXPERTS LTD" />
          <Row label="Marque"           value="ScenIQ" />
          <Row label="Siège social"     value="Henleaze House, 13 Harbury Road, Bristol, England, BS9 4PN" />
          <Row label="Company number"   value="14310075" />
          <Row label="Email"            value={<a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>} />
          <Row label="Téléphone"        value={<a href="tel:+33756808831" style={{ color: '#A5B4FC' }}>+33 7 56 80 88 31</a>} />
          <p style={{ ...pStyle, marginTop: '16px' }}>
            Bien que basée au Royaume-Uni, notre société respecte le Règlement Général sur la Protection
            des Données (RGPD) et le UK GDPR pour tous les clients résidant dans l'Union européenne ou au Royaume-Uni.
          </p>
        </Section>

        {/* Article 2 */}
        <Section title="2. Données collectées">
          <h3 style={h3Style}>Données d'identification</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Nom, prénom</li>
            <li style={liStyle}>Adresse email</li>
            <li style={liStyle}>Numéro de téléphone (si fourni)</li>
            <li style={liStyle}>Adresse de facturation</li>
          </ul>
          <h3 style={h3Style}>Données de commande</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Format et durée de la vidéo commandée</li>
            <li style={liStyle}>Photos, logos et visuels fournis en référence</li>
            <li style={liStyle}>Brief créatif et instructions de personnalisation</li>
          </ul>
          <h3 style={h3Style}>Données de paiement</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Informations de transaction (montant, date)</li>
            <li style={liStyle}>Les données bancaires sont traitées exclusivement par Stripe et ne sont jamais conservées sur nos serveurs</li>
          </ul>
        </Section>

        {/* Article 3 */}
        <Section title="3. Finalités du traitement">
          <p style={pStyle}>Vos données sont utilisées pour :</p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Exécution de votre commande</strong> — création et livraison de la vidéo personnalisée</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Gestion de la relation client</strong> — réponse à vos demandes, support</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Facturation et comptabilité</strong> — émission de factures, obligations légales</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Amélioration de nos services</strong> — analyse de satisfaction (avec votre consentement)</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Communications commerciales</strong> — uniquement si vous avez accepté de les recevoir</li>
          </ul>
        </Section>

        {/* Article 4 */}
        <Section title="4. Base légale du traitement">
          <ul style={ulStyle}>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Exécution du contrat</strong> — traitement nécessaire pour réaliser votre commande (art. 6.1.b RGPD et UK GDPR)</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Obligation légale</strong> — conservation des factures, obligations comptables et fiscales (art. 6.1.c RGPD et UK GDPR)</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Consentement</strong> — pour l'envoi de communications marketing (art. 6.1.a RGPD et UK GDPR)</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Intérêt légitime</strong> — prévention de la fraude, amélioration de nos services (art. 6.1.f RGPD et UK GDPR)</li>
          </ul>
        </Section>

        {/* Article 5 */}
        <Section title="5. Destinataires des données">
          <p style={pStyle}>Vos données peuvent être partagées avec nos sous-traitants techniques :</p>
          <Row label="Stripe"               value="Paiement sécurisé — USA, certifié PCI-DSS" />
          <Row label="Vercel"               value="Hébergement — USA" />
          <Row label="Supabase"             value="Base de données — EU West (Irlande)" />
          <Row label="Anthropic"            value="Génération agents IA (brief, concept, storyboard) — USA" />
          <Row label="BytePlus / ByteDance" value="Génération vidéo Seedance 2.0 — Singapour" />
          <p style={{ ...pStyle, marginTop: '16px' }}>
            Nous ne vendons ni ne louons vos données personnelles à des tiers.
            Les autorités compétentes peuvent y accéder en cas d'obligation légale.
          </p>
        </Section>

        {/* Article 6 */}
        <Section title="6. Transfert de données hors UE">
          <h3 style={h3Style}>Transfert vers le Royaume-Uni</h3>
          <p style={pStyle}>
            Vos données sont traitées et stockées au Royaume-Uni par notre société. Le Royaume-Uni bénéficie
            d'une décision d'adéquation de la Commission européenne (renouvelée en 2024), reconnaissant un
            niveau de protection équivalent au RGPD. Aucune garantie supplémentaire n'est requise.
          </p>
          <h3 style={h3Style}>Autres transferts (sous-traitants)</h3>
          <p style={pStyle}>
            Certains sous-traitants sont situés hors UE/UK (USA, Singapour). Nous nous assurons que des
            garanties appropriées sont en place — clauses contractuelles types de la Commission européenne
            ou certification d'adéquation. Vous pouvez en obtenir une copie à{' '}
            <a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>.
          </p>
        </Section>

        {/* Article 7 */}
        <Section title="7. Durée de conservation">
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Type de données</th>
                  <th style={thStyle}>Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>Données de commande et fichiers clients</td>
                  <td style={tdStyle}>3 ans après la dernière commande</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Images et visuels uploadés</td>
                  <td style={tdStyle}>Supprimés sous 30 jours après livraison</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Factures et données comptables</td>
                  <td style={tdStyle}>10 ans (obligation légale UK et UE)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Données marketing (avec consentement)</td>
                  <td style={tdStyle}>3 ans à compter du dernier contact ou retrait du consentement</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Données de réclamations</td>
                  <td style={tdStyle}>5 ans après clôture du dossier</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ ...pStyle, marginTop: '14px' }}>Passé ces délais, vos données sont supprimées ou anonymisées.</p>
        </Section>

        {/* Article 8 */}
        <Section title="8. Vos droits">
          <p style={pStyle}>Conformément au RGPD et au UK GDPR, vous disposez des droits suivants :</p>
          <ul style={ulStyle}>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Droit d'accès</strong> — obtenir une copie de vos données personnelles</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Droit de rectification</strong> — corriger des données inexactes ou incomplètes</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Droit à l'effacement</strong> — demander la suppression de vos données (sauf obligation légale)</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Droit à la limitation</strong> — restreindre temporairement le traitement</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Droit d'opposition</strong> — vous opposer au traitement pour des raisons tenant à votre situation</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Droit à la portabilité</strong> — récupérer vos données dans un format structuré et lisible</li>
            <li style={liStyle}><strong style={{ color: '#fff' }}>Retrait du consentement</strong> — à tout moment, pour les traitements basés sur le consentement</li>
          </ul>
          <p style={pStyle}>
            Pour exercer ces droits, envoyez votre demande à{' '}
            <a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>{' '}
            avec la mention « Exercice de mes droits RGPD / UK GDPR ». Délai de réponse : 1 mois maximum
            (extensible à 3 mois si la demande est complexe).
          </p>
          <p style={pStyle}>
            En cas de litige non résolu, vous pouvez déposer une plainte auprès de l'
            <a href="https://www.ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#A5B4FC' }}>ICO</a>{' '}
            (Royaume-Uni), de la{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#A5B4FC' }}>CNIL</a>{' '}
            (France), ou de l'autorité de protection des données de votre pays de résidence.
          </p>
        </Section>

        {/* Article 9 */}
        <Section title="9. Sécurité des données">
          <ul style={ulStyle}>
            <li style={liStyle}>Chiffrement des données en transit (SSL/TLS)</li>
            <li style={liStyle}>Données de paiement tokenisées par Stripe — elles ne transitent jamais par nos serveurs</li>
            <li style={liStyle}>Fichiers uploadés stockés dans un bucket privé Supabase avec accès restreint</li>
            <li style={liStyle}>Accès aux données limité au personnel autorisé</li>
            <li style={liStyle}>Sauvegardes régulières sécurisées</li>
          </ul>
          <p style={pStyle}>
            En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits,
            vous serez informé dans les 72 heures.
          </p>
        </Section>

        {/* Article 10 */}
        <Section title="10. Cookies et traceurs">
          <p style={pStyle}>
            ScenIQ n'utilise aucun cookie publicitaire ni traceur de navigation tiers. Le seul cookie
            déposé est celui de session Stripe, strictement nécessaire au traitement de votre paiement.
            Durée de conservation : 13 mois maximum.
          </p>
        </Section>

        {/* Article 11 */}
        <Section title="11. Modifications">
          <p style={pStyle}>
            Nous nous réservons le droit de modifier cette Politique de confidentialité à tout moment
            pour refléter les évolutions légales ou de nos pratiques. Toute modification sera publiée
            sur cette page avec une nouvelle date. En cas de modification substantielle, vous serez
            informé par email.
          </p>
        </Section>

        {/* Article 12 */}
        <Section title="12. Contact">
          <Row label="Email"     value={<a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>} />
          <Row label="Téléphone" value={<a href="tel:+33756808831" style={{ color: '#A5B4FC' }}>+33 7 56 80 88 31</a>} />
          <Row label="Adresse"   value="Henleaze House, 13 Harbury Road, Bristol, England, BS9 4PN" />
        </Section>

        {/* Navigation */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: '24px', flexWrap: 'wrap' as const }}>
          <Link href="/mentions-legales" style={{ color: '#A5B4FC', fontSize: '14px', textDecoration: 'none' }}>
            Mentions légales →
          </Link>
          <Link href="/cgv" style={{ color: '#A5B4FC', fontSize: '14px', textDecoration: 'none' }}>
            CGV →
          </Link>
        </div>

      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: '24px', textAlign: 'center' as const, fontSize: '12px', color: 'rgba(255,255,255,.3)' }}>
        © 2026 ScenIQ
      </footer>
    </div>
  )
}

const pStyle: React.CSSProperties = {
  fontSize: '15px', lineHeight: 1.75, color: 'rgba(255,255,255,.75)', margin: '0 0 14px',
}

const h3Style: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.55)',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '20px 0 8px',
}

const ulStyle: React.CSSProperties = {
  margin: '0 0 14px', paddingLeft: '20px',
}

const liStyle: React.CSSProperties = {
  fontSize: '15px', lineHeight: 1.75, color: 'rgba(255,255,255,.75)', marginBottom: '4px',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left' as const, padding: '10px 12px', fontSize: '12px', fontWeight: 700,
  color: 'rgba(255,255,255,.4)', borderBottom: '1px solid rgba(255,255,255,.1)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: '14px', color: 'rgba(255,255,255,.75)',
  borderBottom: '1px solid rgba(255,255,255,.05)', verticalAlign: 'top' as const,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{
        fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 16px',
        paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,.1)', letterSpacing: '-0.2px',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '16px', padding: '8px 0', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
      <span style={{ color: 'rgba(255,255,255,.4)', minWidth: '180px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'rgba(255,255,255,.85)' }}>{value}</span>
    </div>
  )
}
