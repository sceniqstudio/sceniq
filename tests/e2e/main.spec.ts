// tests/e2e/production.spec.ts
// Agent QA — E2E sur le parcours principal de Scenica

import { test, expect } from '@playwright/test'

// Credentials de test Clerk (user fixture 001)
const TEST_EMAIL    = 'agency@test.scenica.io'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPass123!'

test.describe('Parcours : Brief → Production → Export', () => {
  test.beforeEach(async ({ page }) => {
    // Login via Clerk
    await page.goto('/sign-in')
    await page.fill('[name="identifier"]', TEST_EMAIL)
    await page.click('button[type="submit"]')
    await page.fill('[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('crée un nouveau projet depuis le dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('[data-testid="new-project-btn"]')

    // Page brief
    await expect(page).toHaveURL(/\/project\/.*\/brief/)
    await expect(page.locator('h1')).toContainText('BRIEF')
  })

  test('soumet un brief et lance les agents', async ({ page }) => {
    // Créer un projet
    await page.goto('/dashboard')
    await page.click('[data-testid="new-project-btn"]')

    // Remplir le brief
    const briefText = 'Spot 30s pour une marque de cosmétiques premium. Ambiance luxe parisien. Cible femmes 30-45 CSP+.'
    await page.fill('[data-testid="brief-textarea"]', briefText)
    await page.fill('[data-testid="brand-input"]', 'Maison Lumière Test')

    // Sélectionner format 16:9
    await page.click('[data-testid="format-16-9"]')

    // Soumettre
    await page.click('[data-testid="submit-brief-btn"]')

    // Arriver sur la page production
    await page.waitForURL(/\/project\/.*\/production/, { timeout: 10_000 })
    await expect(page.locator('h1')).toContainText('PRODUCTION')

    // Les 5 agents doivent apparaître
    for (const agent of ['Director', 'Scriptwriter', 'Storyboarder', 'Music Supervisor', 'Visual Director']) {
      await expect(page.locator(`[data-testid="agent-${agent.toLowerCase().replace(' ', '-')}"]`)).toBeVisible()
    }
  })

  test('valide tous les agents et passe à la génération', async ({ page }) => {
    // Naviguer directement vers un projet en production (fixture)
    await page.goto(`/project/00000000-0000-0000-0002-000000000002/production`)

    // Accepter tous les agents
    const acceptBtns = page.locator('[data-testid^="accept-agent-"]')
    const count = await acceptBtns.count()
    for (let i = 0; i < count; i++) {
      await acceptBtns.nth(i).click()
    }

    // Barre de progression à 100%
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('data-value', '5')

    // Bouton "Générer" actif
    const nextBtn = page.locator('[data-testid="go-generate-btn"]')
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()

    await page.waitForURL(/\/project\/.*\/generate/, { timeout: 5_000 })
  })

  test('affiche les crédits restants', async ({ page }) => {
    await page.goto('/dashboard')
    const creditsEl = page.locator('[data-testid="credits-badge"]')
    await expect(creditsEl).toBeVisible()
    // L'user fixture 001 a 50 crédits
    await expect(creditsEl).toContainText('50')
  })
})

// tests/e2e/auth.spec.ts
test.describe('Auth — accès protégé', () => {
  test('redirige vers sign-in si non connecté', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/sign-in/)
  })

  test('redirige vers sign-in si accès direct à un projet', async ({ page }) => {
    await page.goto('/project/some-id/brief')
    await page.waitForURL(/\/sign-in/)
  })
})

// tests/e2e/brief.spec.ts
test.describe('Validation formulaire Brief', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in')
    await page.fill('[name="identifier"]', TEST_EMAIL)
    await page.click('button[type="submit"]')
    await page.fill('[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('bouton submit désactivé si brief vide', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('[data-testid="new-project-btn"]')
    const submitBtn = page.locator('[data-testid="submit-brief-btn"]')
    await expect(submitBtn).toBeDisabled()
  })

  test('bouton submit activé si brief renseigné', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('[data-testid="new-project-btn"]')
    await page.fill('[data-testid="brief-textarea"]', 'Brief test suffisamment long pour valider.')
    const submitBtn = page.locator('[data-testid="submit-brief-btn"]')
    await expect(submitBtn).toBeEnabled()
  })
})
