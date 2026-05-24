// app/api/orders/upload/route.ts
// POST multipart/form-data — Upload des fichiers de référence dans le bucket client-uploads
//
// Body : FormData avec un ou plusieurs champs "file"
// Query param : ?sessionId=xxx (identifiant temporaire pour grouper les fichiers)
// Retourne : { paths: string[] } — chemins dans le bucket (stockés dans orders.ref_paths)
//
// Limites : 10 fichiers max, 25 MB par fichier, formats image/audio/vidéo

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const uuidv4 = () => crypto.randomUUID()

const BUCKET = 'client-uploads'
const MAX_FILES = 10
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/bmp',
  'image/tiff', 'image/gif', 'image/heic', 'image/heif',
  // Audio
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/x-m4a',
  // Vidéo
  'video/mp4', 'video/quicktime', 'video/webm',
])

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // sessionId = identifiant temporaire pour grouper les fichiers d'une même commande
    const sessionId = req.nextUrl.searchParams.get('sessionId') ?? uuidv4()

    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'FormData invalide' }, { status: 400 })
    }

    const files = formData.getAll('file') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} fichiers par commande` },
        { status: 422 },
      )
    }

    const supabase = getSupabaseAdmin()
    const uploadedPaths: string[] = []
    const errors: string[] = []

    for (const file of files) {
      // Vérification MIME
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        errors.push(`${file.name} : type non autorisé (${file.type})`)
        continue
      }

      // Vérification taille
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name} : fichier trop lourd (max 25 MB)`)
        continue
      }

      // Chemin dans le bucket : client-uploads/temp/{sessionId}/{uuid}-{nom-sanitisé}
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 80)
      const filePath = `temp/${sessionId}/${uuidv4()}-${safeName}`

      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('[upload] Erreur Supabase Storage:', uploadError)
        errors.push(`${file.name} : erreur d'upload`)
        continue
      }

      uploadedPaths.push(filePath)
    }

    if (errors.length > 0 && uploadedPaths.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier uploadé', details: errors }, { status: 422 })
    }

    return NextResponse.json({
      paths: uploadedPaths,
      sessionId,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    })

  } catch (err) {
    console.error('[upload] Erreur inattendue:', err)
    return NextResponse.json({ error: 'Erreur serveur lors de l\'upload' }, { status: 500 })
  }
}

// Note App Router : pas besoin de désactiver le bodyParser — Next.js 14 gère
// nativement le FormData multipart dans les Route Handlers.
