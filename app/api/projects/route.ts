// app/api/projects/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureUser } from '@/lib/supabase/ensure-user'
import { validateBrief } from '@/lib/utils/validation'

// GET /api/projects — liste les projets de l'user
export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    const { data, error } = await sb
      .from('projects')
      .select('id, name, status, format, duration_sec, tone, brief, brand_id, created_at, updated_at')
      .eq('user_id', dbUserId)
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ projects: data })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST /api/projects — crée un projet
export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const validation = validateBrief(body)
  if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const sb = createSupabaseServerClient()

    const { data, error } = await sb.from('projects').insert({
      user_id:      dbUserId,
      brief:        validation.data!.brief,
      format:       validation.data!.format,
      duration_sec: validation.data!.duration_sec,
      tone:         validation.data!.tone,
      name:         validation.data!.name,
      brand_id:     validation.data!.brand_id ?? null,
      status:       'brief',
    }).select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ projectId: data.id }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
