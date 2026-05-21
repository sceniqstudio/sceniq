// app/sitemap.ts — généré automatiquement par Next.js
import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sceniq-ashen.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url:              BASE,
      lastModified:     new Date(),
      changeFrequency: 'weekly',
      priority:         1.0,
    },
    {
      url:              `${BASE}/commande`,
      lastModified:     new Date(),
      changeFrequency: 'monthly',
      priority:         0.9,
    },
    {
      url:              `${BASE}/mentions-legales`,
      lastModified:     new Date('2026-05-01'),
      changeFrequency: 'yearly',
      priority:         0.2,
    },
    {
      url:              `${BASE}/confidentialite`,
      lastModified:     new Date('2026-05-01'),
      changeFrequency: 'yearly',
      priority:         0.2,
    },
  ]
}
