// app/api/credits/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ensureUser } from '@/lib/supabase/ensure-user'
import { getBalance } from '@/lib/credits'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const { userId: dbUserId } = await ensureUser(userId)
    const balance = await getBalance(dbUserId)
    return NextResponse.json({ balance })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
