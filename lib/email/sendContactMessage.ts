// lib/email/sendContactMessage.ts
// Email envoyé à Pascal quand quelqu'un soumet le formulaire "Une question ?"

import { getTransporter, SMTP_FROM, PASCAL_EMAIL } from './smtp'

interface ContactParams {
  name:    string
  email:   string
  phone?:  string | null
  message: string
}

export async function sendContactMessage(params: ContactParams): Promise<void> {
  const { name, email, phone, message } = params

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:system-ui,-apple-system,sans-serif;color:#f5f2ec">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">

    <div style="background:#7C5CFC;border-radius:6px;padding:6px 14px;display:inline-block;margin-bottom:24px">
      <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff">💬 Nouvelle question</span>
    </div>

    <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 24px;letter-spacing:-0.5px">
      ${name} a une question
    </h1>

    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px;margin-bottom:20px">
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5);width:120px">Nom</td>
          <td style="padding:6px 0;font-size:14px;color:#fff;font-weight:600">${name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#A5B4FC"><a href="mailto:${email}" style="color:#A5B4FC">${email}</a></td>
        </tr>
        ${phone ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,.5)">Téléphone</td>
          <td style="padding:6px 0;font-size:16px;font-weight:700;color:#fff">${phone}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="background:rgba(165,180,252,.08);border:1px solid rgba(165,180,252,.2);border-radius:10px;padding:20px;margin-bottom:32px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A5B4FC">Message</p>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,.9);line-height:1.7;white-space:pre-line">${message}</p>
    </div>

    <p style="font-size:12px;color:rgba(255,255,255,.3);margin:0">ScenIQ · Formulaire de contact landing page</p>

  </div>
</body>
</html>
`

  await getTransporter().sendMail({
    from:    `"ScenIQ Contact" <${SMTP_FROM()}>`,
    to:      PASCAL_EMAIL(),
    replyTo: email,
    subject: `💬 [ScenIQ] Question de ${name}`,
    html,
  })
}
