// lib/utils/validation.ts
import { z } from 'zod'

export const BriefSchema = z.object({
  brief:       z.string()
                 .min(1, 'brief_required')
                 .min(10, 'brief_too_short'),
  format:      z.enum(['16:9', '9:16', '1:1', '4:3'], {
                 errorMap: () => ({ message: 'invalid_format' }),
               }),
  duration_sec:z.number().min(5).max(300),
  tone:        z.string().min(1),
  brand_id:    z.string().uuid().optional(),
  name:        z.string().min(1).default('Sans titre'),
})

export type BriefInput = z.infer<typeof BriefSchema>

export function validateBrief(input: unknown) {
  const result = BriefSchema.safeParse(input)
  if (result.success) return { success: true, errors: [], data: result.data }
  return {
    success: false,
    errors: result.error.issues.map(i => i.message),
    data: null,
  }
}

export const GenerationSchema = z.object({
  sceneId:   z.string().uuid(),
  projectId: z.string().uuid(),
})
