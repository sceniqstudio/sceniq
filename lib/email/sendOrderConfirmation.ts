// lib/email/sendOrderConfirmation.ts
// Email envoyé au CLIENT après paiement Stripe confirmé

import { getTransporter, SMTP_FROM } from './smtp'
import { formatPrice } from '@/lib/orders/index'
import type { CartItemJson } from '@/lib/supabase/types'

interface ConfirmationParams {
  orderId:       string
  clientName:    string
  clientEmail:   string
  priceHt:       number
  brief:         string
  cartItems:     CartItemJson[]
  voiceLanguage?: string | null
}

function renderCartRows(items: CartItemJson[]): string {
  return items.map((it, i) => {
    const label = `Vidéo ${i + 1} — ${it.duration}s · ${it.formats.join(', ')}`
    const qty   = it.qty > 1 ? ` × ${it.qty}` : ''
    const ai    = it.want_ai_model ? ' + comédien IA' : ''
    return `
      <tr>
        <td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,.6);border-bottom:1px solid rgba(255,255,255,.06)">${label}${ai}${qty}</td>
      </tr>`
  }).join('')
}

export async function sendOrderConfirmation(params: ConfirmationParams): Promise<void> {
  const { orderId, clientName, clientEmail, priceHt, brief, cartItems, voiceLanguage } = params
  const totalVideos = cartItems.reduce((s, i) => s + i.qty, 0)

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:system-ui,-apple-system,sans-serif;color:#f5f2ec">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <div style="margin-bottom:32px">
      <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#fff">ScenIQ</span>
    </div>

    <h1 style="font-size:26px;font-weight:700;color:#fff;margin:0 0 12px;letter-spacing:-0.5px">
      Votre commande est confirmée&nbsp;✓
    </h1>

    <p style="font-size:16px;color:rgba(255,255,255,.78);line-height:1.6;margin:0 0 32px">
      Bonjour ${clientName},<br><br>
      Votre paiement a bien été reçu. Je vous rappelle dans les <strong style="color:#A5B4FC">4 heures ouvrées</strong> pour caler la préprod.
    </p>

    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px;margin-bottom:32px">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5)">Récap commande</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,.6);border-bottom:1px solid rgba(255,255,255,.06)">Référence</td>
          <td style="padding:8px 0;font-size:14px;color:#fff;text-align:right;border-bottom:1px solid rgba(255,255,255,.06);font-family:monospace">${orderId.slice(0, 8).toUpperCase()}</td>
        </tr>
        ${renderCartRows(cartItems)}
        ${voiceLanguage ? `
        <tr>
          <td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,.6);border-bottom:1px solid rgba(255,255,255,.06)">Langue voix</td>
          <td style="padding:8px 0;font-size:14px;color:#fff;text-align:right;border-bottom:1px solid rgba(255,255,255,.06)">${voiceLanguage}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,.6)">Total (${totalVideos} vidéo${totalVideos > 1 ? 's' : ''})</td>
          <td style="padding:8px 0;font-size:16px;font-weight:700;color:#A5B4FC;text-align:right">${formatPrice(priceHt)}</td>
        </tr>
      </table>
    </div>

    <div style="background:rgba(165,180,252,.08);border:1px solid rgba(165,180,252,.2);border-radius:10px;padding:20px;margin-bottom:32px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A5B4FC">Votre brief</p>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,.85);line-height:1.6;white-space:pre-line">${brief}</p>
    </div>

    <div style="margin-bottom:32px">
      <p style="font-size:14px;color:rgba(255,255,255,.6);line-height:1.6;margin:0">
        <strong style="color:#fff">Ce qui se passe ensuite :</strong><br>
        1. Je vous rappelle sous 4 h ouvrées pour valider le brief et les références<br>
        2. Je prépare la préprod avec mes agents IA (concept, storyboard, ambiance, prompt)<br>
        3. Vous validez (révisions incluses)<br>
        4. Livraison du MP4 final sous 48 h après validation
      </p>
    </div>

    <p style="font-size:14px;color:rgba(255,255,255,.5);margin:0">
      Une question&nbsp;?&nbsp;<a href="mailto:support@sceniq.studio" style="color:#A5B4FC;text-decoration:none">support@sceniq.studio</a>
    </p>

    <hr style="border:none;border-top:1px solid rgba(255,255,255,.06);margin:32px 0">
    <p style="font-size:12px;color:rgba(255,255,255,.3);margin:0">
      ScenIQ · Production vidéo IA pour agences pub<br>
      Facture TVA disponible sur demande
    </p>

  </div>
</body>
</html>
`

  const totalVideos2 = cartItems.reduce((s, i) => s + i.qty, 0)
  const subject = `Votre commande ScenIQ est confirmée — ${totalVideos2} vidéo${totalVideos2 > 1 ? 's' : ''} · ${formatPrice(priceHt)}`

  await getTransporter().sendMail({
    from: `"Pascal — ScenIQ" <${SMTP_FROM()}>`,
    to:   clientEmail,
    subject,
    html,
  })
}
