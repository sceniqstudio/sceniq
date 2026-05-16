// lib/credits/index.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function getBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single()
  return (data?.balance as number) ?? 0
}

export interface ConsumeCreditResult {
  newBalance: number
  error: 'insufficient_credits' | 'already_consumed' | null
}

export async function consumeCredit(input: {
  userId: string
  projectId: string
  sceneId: string
}): Promise<ConsumeCreditResult> {
  const { data: existing } = await supabase
    .from('credits_ledger')
    .select('id')
    .eq('scene_id', input.sceneId)
    .eq('delta', -1)
    .maybeSingle()

  if (existing) {
    return { newBalance: await getBalance(input.userId), error: 'already_consumed' }
  }

  const balance = await getBalance(input.userId)
  if (balance <= 0) return { newBalance: 0, error: 'insufficient_credits' }

  await supabase.from('credits_ledger').insert({
    user_id: input.userId, delta: -1, reason: 'generation',
    project_id: input.projectId, scene_id: input.sceneId,
  })

  return { newBalance: balance - 1, error: null }
}
