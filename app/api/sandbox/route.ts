// app/api/sandbox/route.ts
// Route de test sans auth ni Supabase — appelle directement les 5 agents.
// À supprimer ou protéger avant mise en production.

import { NextResponse } from 'next/server'
import { runAllAgents } from '@/lib/claude/agents'

export async function POST(req: Request) {
  const { brief, durationSec = 30 } = await req.json()

  if (!brief || typeof brief !== 'string' || brief.trim().length < 5) {
    return NextResponse.json({ error: 'brief trop court (min 5 caractères)' }, { status: 400 })
  }

  const result = await runAllAgents(brief.trim(), durationSec)

  return NextResponse.json({
    successCount: result.successCount,
    director:     { content: result.director.content,     error: result.director.error },
    scriptwriter: { content: result.scriptwriter.content, error: result.scriptwriter.error },
    storyboarder: { content: result.storyboarder.content, error: result.storyboarder.error, scenes: result.storyboarder.scenes },
    music:        { content: result.music.content,        error: result.music.error },
    visual:       { content: result.visual.content,       error: result.visual.error },
  })
}
