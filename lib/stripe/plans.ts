// lib/stripe/plans.ts

export const PLANS = {
  studio: {
    name:            'Studio',
    priceId:         process.env.STRIPE_PRICE_STUDIO!,
    priceMonthly:    49,
    creditsPerCycle: 10,
    maxBrands:       1,
  },
  agency: {
    name:            'Agency',
    priceId:         process.env.STRIPE_PRICE_AGENCY!,
    priceMonthly:    199,
    creditsPerCycle: 50,
    maxBrands:       5,
  },
  white_label: {
    name:            'White-label',
    priceId:         process.env.STRIPE_PRICE_WHITE_LABEL!,
    priceMonthly:    599,
    creditsPerCycle: 999999, // illimité en pratique
    maxBrands:       999999,
  },
} as const

export type PlanKey = keyof typeof PLANS
