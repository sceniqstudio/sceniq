// app/cgv/page.tsx
import LegalHeader from '@/app/_components/LegalHeader'
import Link from 'next/link'

export const metadata = {
  title: 'Conditions Générales de Vente — ScenIQ',
  description: 'Conditions Générales de Vente de ScenIQ, agence IA de production vidéo publicitaire.',
}

export default function CGVPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', color: '#f5f2ec', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <LegalHeader />

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 80px' }}>

        <div style={{ background: '#7C5CFC', borderRadius: '6px', padding: '4px 12px', display: 'inline-block', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#fff' }}>Légal</span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px', color: '#fff' }}>
          Conditions Générales de Vente
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.4)', margin: '0 0 48px' }}>
          Dernière mise à jour : mai 2026
        </p>

        {/* Article 1 */}
        <Section title="Article 1 — Champ d'application">
          <p style={pStyle}>
            Les présentes Conditions Générales de Vente (CGV) s'appliquent à toute commande de vidéos courtes
            (5 à 15 secondes) avec avatars et mannequins virtuels générés par intelligence artificielle,
            proposées par ScenIQ aux clients situés dans l'Union européenne.
          </p>
          <p style={pStyle}>
            Toute commande validée implique l'acceptation sans réserve des présentes CGV.
          </p>
        </Section>

        {/* Article 2 */}
        <Section title="Article 2 — Identification du vendeur">
          <Row label="Raison sociale"      value="DESIGN SPRINT EXPERTS LTD" />
          <Row label="Marque commerciale"  value="ScenIQ" />
          <Row label="Forme juridique"     value="Private limited company (Ltd)" />
          <Row label="Siège social"        value="Henleaze House, 13 Harbury Road, Bristol, England, BS9 4PN" />
          <Row label="Company number"      value="14310075" />
          <Row label="Email"               value={<a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>} />
          <Row label="Téléphone"           value={<a href="tel:+33756808831" style={{ color: '#A5B4FC' }}>+33 7 56 80 88 31</a>} />
          <Row label="Responsable"         value="Pascal Ekloui" />
        </Section>

        {/* Article 3 */}
        <Section title="Article 3 — Services proposés">
          <p style={pStyle}>Nous proposons la création de vidéos courtes personnalisées intégrant :</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Avatars virtuels et comédiens générés par IA</li>
            <li style={liStyle}>Mannequins virtuels 3D</li>
            <li style={liStyle}>Décors et animations sur-mesure</li>
            <li style={liStyle}>Formats adaptés aux réseaux sociaux (Instagram, TikTok, YouTube Shorts, Meta Ads…)</li>
          </ul>
          <p style={pStyle}>
            Les caractéristiques techniques (résolution, format, durée) sont précisées lors de la commande.
          </p>
        </Section>

        {/* Article 4 */}
        <Section title="Article 4 — Processus de commande">
          <h3 style={h3Style}>4.1 Commande</h3>
          <p style={pStyle}>
            Le client passe commande en ligne via le formulaire de commande ScenIQ. La commande est confirmée
            dès réception du paiement. Un email de confirmation est envoyé immédiatement.
          </p>
          <h3 style={h3Style}>4.2 Validation</h3>
          <p style={pStyle}>En passant commande, le client :</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Accepte les présentes CGV</li>
            <li style={liStyle}>Consent au traitement de ses données personnelles (RGPD)</li>
            <li style={liStyle}>Certifie être titulaire des droits sur les éléments fournis (logos, références, brief)</li>
          </ul>
          <h3 style={h3Style}>4.3 Brief client</h3>
          <p style={pStyle}>
            Le client fournit les éléments nécessaires lors de la commande : photos, logos, textes, références
            visuelles, brief créatif. La production débute après un appel de direction créative sous 4 h ouvrées.
          </p>
        </Section>

        {/* Article 5 */}
        <Section title="Article 5 — Prix">
          <h3 style={h3Style}>5.1 Tarifs</h3>
          <p style={pStyle}>
            Les prix sont indiqués en euros (€), toutes taxes comprises. Les forfaits vont de 69 € à 159 €
            selon la durée de la vidéo.
          </p>
          <h3 style={h3Style}>5.2 Modalités de paiement</h3>
          <ul style={ulStyle}>
            <li style={liStyle}>Paiement 100 % à la commande — aucun acompte partiel</li>
            <li style={liStyle}>Moyens acceptés : carte bancaire, Apple Pay, Google Pay (via Stripe)</li>
            <li style={liStyle}>Une facture est générée automatiquement après paiement</li>
            <li style={liStyle}>Aucune donnée de carte bancaire n'est stockée sur nos serveurs</li>
          </ul>
        </Section>

        {/* Article 6 */}
        <Section title="Article 6 — Délais et livraison">
          <h3 style={h3Style}>6.1 Délai</h3>
          <p style={pStyle}>
            La vidéo finale est livrée sous 48 h après la validation de la direction créative lors de l'appel.
            Le délai court à partir de cet appel, pas du paiement.
          </p>
          <h3 style={h3Style}>6.2 Livraison</h3>
          <p style={pStyle}>
            La vidéo est livrée par email au format MP4 1080p. Le client dispose de 48 h pour signaler
            toute non-conformité par rapport au brief validé.
          </p>
          <h3 style={h3Style}>6.3 Itérations</h3>
          <p style={pStyle}>
            10 allers-retours sont inclus dans chaque commande. Si, après 10 itérations, aucun résultat
            satisfaisant n'est atteint, le client est intégralement remboursé.
          </p>
          <h3 style={h3Style}>6.4 Retard</h3>
          <p style={pStyle}>
            En cas de retard imputable à ScenIQ dépassant 15 jours ouvrés sans justification, le client
            peut annuler la commande et obtenir un remboursement intégral.
          </p>
        </Section>

        {/* Article 7 */}
        <Section title="Article 7 — Droit de rétractation (clients consommateurs UE)">
          <p style={pStyle}>
            Conformément à la directive 2011/83/UE, le consommateur dispose d'un délai de 14 jours
            calendaires à compter de la conclusion du contrat pour se rétracter, sans motif.
          </p>
          <p style={pStyle}>
            <strong style={{ color: '#fff' }}>Exception :</strong> Le droit de rétractation est perdu si la prestation a été intégralement
            exécutée avant la fin du délai de 14 jours, avec accord exprès et préalable du consommateur
            et reconnaissance de la perte de son droit de rétractation.
          </p>
          <p style={pStyle}>
            Pour exercer ce droit : email à{' '}
            <a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>{' '}
            avec la mention « Rétractation commande n° [X] ».
            Remboursement sous 14 jours suivant la notification.
          </p>
        </Section>

        {/* Article 8 */}
        <Section title="Article 8 — Propriété intellectuelle et droits d'usage">
          <h3 style={h3Style}>8.1 Propriété des vidéos</h3>
          <p style={pStyle}>
            Les vidéos livrées sont générées par intelligence artificielle. À compter du paiement intégral,
            le client dispose d'un droit d'usage commercial illimité sur les vidéos commandées.
          </p>
          <h3 style={h3Style}>8.2 Droits accordés</h3>
          <p style={pStyle}>Le client peut :</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Utiliser les vidéos sur tous supports (réseaux sociaux, site web, publicité en ligne, affichage physique)</li>
            <li style={liStyle}>Modifier, recadrer, ajouter du texte ou de la musique</li>
            <li style={liStyle}>Les utiliser sans limitation de durée ni de territoire</li>
          </ul>
          <h3 style={h3Style}>8.3 Limites</h3>
          <p style={pStyle}>Le client ne peut pas :</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Revendre les vidéos brutes en tant que produit</li>
            <li style={liStyle}>Prétendre en être l'auteur original</li>
            <li style={liStyle}>Utiliser les vidéos pour créer des contenus illégaux, diffamatoires ou portant atteinte aux droits de tiers</li>
          </ul>
          <h3 style={h3Style}>8.4 Avatars et comédiens IA</h3>
          <p style={pStyle}>
            Les avatars et comédiens utilisés sont intégralement générés par IA. Ils ne représentent
            aucune personne réelle. ScenIQ garantit qu'aucun droit à l'image de personne physique
            identifiable n'est violé. Conformément au EU AI Act (art. 50) et à la loi française du
            9 juin 2023, la mention « Image générée par IA » est obligatoire sur vos publications.
            ScenIQ fournit cette mention dans chaque livraison.
          </p>
        </Section>

        {/* Article 9 */}
        <Section title="Article 9 — Responsabilité">
          <h3 style={h3Style}>9.1 Responsabilité de ScenIQ</h3>
          <p style={pStyle}>
            ScenIQ s'engage à livrer des vidéos conformes à la commande validée lors de l'appel créatif.
            Sa responsabilité est limitée au montant payé par le client pour la commande concernée.
          </p>
          <p style={pStyle}>ScenIQ ne peut être tenu responsable :</p>
          <ul style={ulStyle}>
            <li style={liStyle}>De l'usage fait par le client des vidéos (contenu ajouté, contexte de diffusion)</li>
            <li style={liStyle}>Des dommages indirects (perte de chiffre d'affaires, d'image, de données)</li>
            <li style={liStyle}>D'un retard de livraison dû à un cas de force majeure</li>
          </ul>
          <h3 style={h3Style}>9.2 Responsabilité du client</h3>
          <p style={pStyle}>Le client est seul responsable :</p>
          <ul style={ulStyle}>
            <li style={liStyle}>De l'usage des vidéos et du respect des lois applicables (droit de la consommation, publicité, droits d'auteur)</li>
            <li style={liStyle}>Du contenu textuel ou musical qu'il intègre aux vidéos après livraison</li>
          </ul>
        </Section>

        {/* Article 10 */}
        <Section title="Article 10 — Données personnelles">
          <p style={pStyle}>
            Les données personnelles collectées (nom, email, téléphone, adresse de facturation) sont
            traitées conformément à notre{' '}
            <Link href="/confidentialite" style={{ color: '#A5B4FC' }}>Politique de confidentialité</Link>.
          </p>
          <p style={pStyle}>
            Vos données sont conservées 5 ans à compter de la dernière commande (obligation comptable et fiscale).
            Vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition.
            Contact :{' '}
            <a href="mailto:support@sceniq.studio" style={{ color: '#A5B4FC' }}>support@sceniq.studio</a>.
          </p>
        </Section>

        {/* Article 11 */}
        <Section title="Article 11 — Règlement des litiges">
          <h3 style={h3Style}>11.1 Droit applicable</h3>
          <p style={pStyle}>
            Les présentes CGV sont régies par le droit anglais et gallois (England and Wales). Toutefois,
            si vous êtes un consommateur résidant dans l'Union européenne, vous bénéficiez des dispositions
            impératives du droit de la consommation de votre pays de résidence, conformément au règlement
            Rome I (CE 593/2008).
          </p>
          <h3 style={h3Style}>11.2 Médiation de la consommation (clients UE)</h3>
          <p style={pStyle}>
            Conformément à la directive européenne sur le règlement extrajudiciaire des litiges, vous pouvez
            recourir gratuitement à un médiateur de la consommation. Vous pouvez également utiliser la
            plateforme européenne de règlement en ligne des litiges :{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#A5B4FC' }}>
              ec.europa.eu/consumers/odr
            </a>.
          </p>
          <h3 style={h3Style}>11.3 Tribunal compétent</h3>
          <p style={pStyle}>
            À défaut de solution amiable, le litige relève de la compétence exclusive des tribunaux
            d'Angleterre et du Pays de Galles. Pour les consommateurs résidant dans l'Union européenne :
            vous pouvez saisir les tribunaux de votre lieu de résidence habituelle, conformément au
            règlement Bruxelles I bis (UE 1215/2012).
          </p>
        </Section>

        {/* Article 12 */}
        <Section title="Article 12 — Dispositions finales">
          <h3 style={h3Style}>12.1 Modification des CGV</h3>
          <p style={pStyle}>
            ScenIQ se réserve le droit de modifier les présentes CGV à tout moment.
            Les CGV applicables sont celles en vigueur au jour de la commande.
          </p>
          <h3 style={h3Style}>12.2 Nullité partielle</h3>
          <p style={pStyle}>
            Si une clause des présentes CGV est déclarée nulle ou inapplicable, les autres clauses
            restent en vigueur.
          </p>
          <h3 style={h3Style}>12.3 Langue</h3>
          <p style={pStyle}>
            Les présentes CGV sont rédigées en français. En cas de traduction, seule la version française fait foi.
          </p>
        </Section>

        {/* Navigation */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/mentions-legales" style={{ color: '#A5B4FC', fontSize: '14px', textDecoration: 'none' }}>
            Mentions légales →
          </Link>
          <Link href="/confidentialite" style={{ color: '#A5B4FC', fontSize: '14px', textDecoration: 'none' }}>
            Politique de confidentialité →
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
