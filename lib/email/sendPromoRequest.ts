// lib/email/sendPromoRequest.ts
// Email envoyé à Pascal quand quelqu'un réclame le reel 8s offert (offre lancement 50 spots)

import { getTransporter, SMTP_FROM, PASCAL_EMAIL } from './smtp'

interface PromoParams {
  name:     string
  email:    string
  phone?:   string | null
  company?: string | null
  brief:    string
}

export async function sendPromoRequest(params: PromoParams): Promise<void> {
  const { name, email, phone, company, brief } = params

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:system-ui,-apple-system,sans-serif;color:#f5f2ec">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <div style="background:linear-gradient(135deg,#7C5CFC,#9D7AFF);border-radius:6px;padding:6px 14px;display:inline-block;margin-bottom:24px">
      <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff">🎬 REEL OFFERT — Offre lancement</span>
    </div>

    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 6px;letter-spacing:-0.5px">
      ${name} réclame son reel gratuit
    </h1>
    ${company ? `<p style="margin:0 0 24px;font-size:14px;color:#94A3B8">${company}</p>` : '<div style="margin-bottom:24px"></div>'}

    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5);width:130px">Prénom</td>
          <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600">${name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#A5B4FC"><a href="mailto:${email}" style="color:#A5B4FC">${email}</a></td>
        </tr>
        ${phone ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Téléphone</td>
          <td style="padding:6px 0;font-size:14px;color:#fff"><a href="tel:${phone}" style="color:#fff">${phone}</a></td>
        </tr>` : ''}
        ${company ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Entreprise</td>
          <td style="padding:6px 0;font-size:14px;color:#fff">${company}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="background:rgba(124,92,252,.1);border:1px solid rgba(124,92,252,.25);border-radius:10px;padding:20px;margin-bottom:32px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A5B4FC">Brief</p>
      <p style="margin:0;font-size:15px;color:rgba(255,255,255,.9);line-height:1.7;white-space:pre-line">${brief}</p>
    </div>

    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:16px;margin-bottom:32px">
      <p style="margin:0;font-size:13px;color:#64748B;line-height:1.6">
        → Répondre directement à cet email pour confirmer la prise en charge.<br>
        → Délai : 48h ouvrées pour livrer le MP4 1080p.
      </p>
    </div>

    <p style="font-size:12px;color:rgba(255,255,255,.3);margin:0">ScenIQ · Offre lancement — Reel 8s offert</p>

  </div>
</body>
</html>
`

  await getTransporter().sendMail({
    from:    `"ScenIQ Promo" <${SMTP_FROM()}>`,
    to:      PASCAL_EMAIL(),
    replyTo: email,
    subject: `🎬 [ScenIQ] Reel offert — ${name}${company ? ` · ${company}` : ''}${phone ? ` 📞` : ''}`,
    html,
  })
}
