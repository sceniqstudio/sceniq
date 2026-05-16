// tests/fixtures/seed.ts
// Usage : npm run seed:test
// Aussi utilisé comme globalSetup Playwright

import { createClient } from '@supabase/supabase-js'
import { FIXTURES } from './data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role pour bypasser RLS en test
)

export async function seedTestDB() {
  console.log('🌱 Seeding test database...')

  // Ordre : supprimer de bas en haut (FK), insérer de haut en bas
  const tables = [
    'credits_ledger',
    'subscriptions',
    'clips',
    'scenes',
    'agent_outputs',
    'projects',
    'brand_assets',
    'brands',
    'users',
  ]

  // Reset
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.warn(`⚠️ Reset ${table}:`, error.message)
  }

  // Insert fixtures
  const inserts: Array<{ table: string; data: unknown[] }> = [
    { table: 'users',           data: FIXTURES.users },
    { table: 'brands',          data: FIXTURES.brands },
    { table: 'projects',        data: FIXTURES.projects },
    { table: 'credits_ledger',  data: FIXTURES.credits_ledger },
    { table: 'subscriptions',   data: FIXTURES.subscriptions },
  ]

  for (const { table, data } of inserts) {
    const { error } = await supabase.from(table).insert(data)
    if (error) throw new Error(`❌ Insert ${table}: ${error.message}`)
    console.log(`  ✓ ${table} (${data.length} rows)`)
  }

  console.log('✅ Test database seeded.')
}

// Exécution directe via npm run seed:test
if (require.main === module) {
  seedTestDB()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1) })
}

export default seedTestDB
