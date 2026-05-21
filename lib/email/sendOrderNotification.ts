// lib/email/sendOrderNotification.ts
// Email envoyé à PASCAL après paiement Stripe confirmé

import { getTransporter, SMTP_FROM, PASCAL_EMAIL } from './smtp'
import { formatPrice, cartSummaryLine } from '@/lib/orders/index'
import type { CartItemJson } from '@/lib/supabase/types'

interface NotificationParams {
  orderId:            string
  clientName:         string
  clientEmail:        string
  clientPhone?:       string | null
  clientCompany?:     string | null
  preferredCallSlot?: string | null
  priceHt:            number
  brief:              string
  cartItems:          CartItemJson[]
  voiceLanguage?:     string | null
  refPaths:           string[]
  stripeSessionId:    string
}

function renderCartDetail(items: CartItemJson[]): string {
  return items.map((it, i) => {
    const ai  = it.want_ai_model ? ` + comédien IA${it.ai_model_desc ? ` (${it.ai_model_desc.slice(0, 60)}…)` : ''}` : ''
    const qty = it.qty > 1 ? ` × ${it.qty}` : ''
    return `<tr>
      <td style="padding:5px 0;font-size:13px;color:rgba(255,255,255,.5)">Vidéo ${i + 1}</td>
      <td style="padding:5px 0;font-size:13px;color:#fff;text-align:right">${it.duration}s · ${it.formats.join(', ')}${ai}${qty}</td>
    </tr>`
  }).join('')
}

export async function sendOrderNotification(params: NotificationParams): Promise<void> {
  const {
    orderId, clientName, clientEmail, clientPhone, clientCompany,
    preferredCallSlot, priceHt, brief,
    cartItems, voiceLanguage, refPaths, stripeSessionId,
  } = params

  const totalVideos = cartItems.reduce((s, i) => s + i.qty, 0)
  const summary = cartSummaryLine(cartItems)

  const refList = refPaths.length > 0
    ? refPaths.map(p => `<li style="margin-bottom:4px"><code style="background:rgba(0,0,0,.3);padding:2px 6px;border-radius:3px;font-size:12px">${p}</code></li>`).join('')
    : '<li style="color:rgba(255,255,255,.5);font-size:14px">Aucun fichier de référence uploadé</li>'

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:system-ui,-apple-system,sans-serif;color:#f5f2ec">
  <div style="max-width:640px;margin:0 auto;padding:40px 24px">

    <div style="background:#ef4444;border-radius:6px;padding:6px 14px;display:inline-block;margin-bottom:24px">
      <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff">🚀 Nouvelle commande</span>
    </div>

    <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 8px;letter-spacing:-0.5px">
      ${clientName}${clientCompany ? ` — ${clientCompany}` : ''} a commandé
    </h1>
    <p style="font-size:16px;font-weight:700;color:#A5B4FC;margin:0 0 6px">
      ${summary}
    </p>
    <p style="font-size:20px;font-weight:800;color:#4ade80;margin:0 0 32px">
      ${formatPrice(priceHt)} · ${totalVideos} vidéo${totalVideos > 1 ? 's' : ''}${voiceLanguage ? ` · Voix ${voiceLanguage}` : ''}
    </p>

    <!-- À appeler -->
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px;margin-bottom:20px">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5)">📞 À appeler maintenant</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5);width:160px">Nom</td>
          <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600">${clientName}</td>
        </tr>
        ${clientCompany ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Société</td>
          <td style="padding:6px 0;font-size:14px;color:#fff">${clientCompany}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#A5B4FC"><a href="mailto:${clientEmail}" style="color:#A5B4FC">${clientEmail}</a></td>
        </tr>
        ${clientPhone ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Téléphone</td>
          <td style="padding:6px 0;font-size:18px;font-weight:700;color:#fff">${clientPhone}</td>
        </tr>` : ''}
        ${preferredCallSlot ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Créneau</td>
          <td style="padding:6px 0;font-size:14px;color:#fff">${preferredCallSlot}</td>
        </tr>` : ''}
      </table>
    </div>

    <!-- Brief -->
    <div style="background:rgba(165,180,252,.08);border:1px solid rgba(165,180,252,.2);border-radius:10px;padding:20px;margin-bottom:20px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A5B4FC">Brief client</p>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,.9);line-height:1.6;white-space:pre-line">${brief}</p>
    </div>

    <!-- Détail commande -->
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:20px;margin-bottom:20px">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5)">Détails commande</p>
      <table style="width:100%;border-collapse:collapse">
        ${renderCartDetail(cartItems)}
        <tr>
          <td style="padding:8px 0 5px;font-size:13px;color:rgba(255,255,255,.5);border-top:1px solid rgba(255,255,255,.06)">Total encaissé</td>
          <td style="padding:8px 0 5px;font-size:16px;font-weight:700;color:#4ade80;text-align:right;border-top:1px solid rgba(255,255,255,.06)">${formatPrice(priceHt)}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,.3)">Référence</td>
          <td style="padding:5px 0;font-size:13px;color:#fff;text-align:right;font-family:monospace">${orderId.slice(0, 8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,.3)">Stripe session</td>
          <td style="padding:5px 0;font-size:11px;color:rgba(255,255,255,.3);text-align:right;font-family:monospace">${stripeSessionId}</td>
        </tr>
      </table>
    </div>

    <!-- Références -->
    <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:20px;margin-bottom:32px">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5)">Fichiers de référence (${refPaths.length})</p>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none">
        ${refList}
      </ul>
      ${refPaths.length > 0 ? '<p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,.4)">→ Récupérer via signed URLs depuis Supabase Storage (bucket client-uploads)</p>' : ''}
    </div>

    <p style="font-size:12px;color:rgba(255,255,255,.3);margin:0">
      ScenIQ · ID complet : <code style="font-size:11px">${orderId}</code>
    </p>

  </div>
</body>
</html>
`

  const totalVideos2 = cartItems.reduce((s, i) => s + i.qty, 0)
  await getTransporter().sendMail({
    from:    `"ScenIQ Système" <${SMTP_FROM()}>`,
    to:      PASCAL_EMAIL(),
    subject: `🚀 [ScenIQ] Nouvelle commande — ${clientName} · ${totalVideos2} vidéo${totalVideos2 > 1 ? 's' : ''} · ${formatPrice(priceHt)}`,
    html,
  })
}
