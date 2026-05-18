// lib/email/smtp.ts
// Transporter nodemailer — SMTP IONOS support@sceniq.studio
// Variables d'env requises (à ajouter sur Vercel) :
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

import nodemailer from 'nodemailer'

let _transporter: nodemailer.Transporter | null = null

export function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  if (!host || !user || !pass || !from) {
    throw new Error(
      '[ScenIQ email] Variables SMTP manquantes. Requis : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM'
    )
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true pour SSL/TLS sur 465, false pour STARTTLS sur 587
    auth: { user, pass },
  })

  return _transporter
}

export const SMTP_FROM = () => process.env.SMTP_FROM ?? 'support@sceniq.studio'
export const PASCAL_EMAIL = () => process.env.SMTP_USER ?? 'support@sceniq.studio'
