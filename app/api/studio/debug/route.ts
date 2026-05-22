// app/api/studio/debug/route.ts
// GET — Teste l'API BytePlus image directement, retourne la réponse brute
// Usage : /api/studio/debug (admin only)

import { NextRequest, NextResponse } from 'next/server'

const BASE_URL    = process.env.BYTEPLUS_BASE_URL ?? 'https://ark.ap-southeast.bytepluses.com/api/v3'
const IMAGE_MODEL = 'seedream-5-0-260128'

export async function GET(req: NextRequest) {
  const secret   = req.headers.get('x-admin-secret')
  const expected = process.env.ADMIN_SECRET ?? process.env.NEXT_PUBLIC_ADMIN_SECRET
  if (secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.BYTEPLUS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'BYTEPLUS_API_KEY manquant' }, { status: 500 })

  const body = {
    model:           IMAGE_MODEL,
    prompt:          'a simple red circle on white background',
    n:               1,
    size:            '1920x1920',
    response_format: 'url',
    watermark:       false,
  }

  try {
    const res  = await fetch(`${BASE_URL}/images/generations`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })

    const text = await res.text()
    let data: unknown
    try { data = JSON.parse(text) } catch { data = text }

    return NextResponse.json({
      http_status: res.status,
      ok:          res.ok,
      raw:         data,
      sent_body:   body,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
