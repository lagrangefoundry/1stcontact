import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { applySchema } from './support/d1-site-factory'

/**
 * story-fde7370b, AC-2238 (from REQ-190) — **the baseline, applied to an empty
 * database, seeds the platform business and no people.**
 *
 * The node sibling (`test_reconciliation_baseline_schema.test.ts`) proves the
 * repository facts: one migration file, and a `TENANT_ID` both deployment blocks
 * agree with the seed on. This proves what the migration DOES: it is applied, by
 * the same runner every workers suite uses, to this file's own fresh D1, and the
 * rows are counted. Nothing else in this file writes, and no earlier test runs
 * before it, so what is counted is exactly what the baseline leaves behind.
 */

async function count(table: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{ n: number }>()
  return Number(row?.n ?? 0)
}

beforeAll(async () => {
  // A fresh database: nothing has been created yet.
  const { results } = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tenants'",
  ).all<{ name: string }>()
  expect(results ?? []).toEqual([])
  await applySchema()
})

describe('REQ-190 — the baseline seeds no people', () => {
  it('test_UAT_AC2238_the_baseline_applied_to_an_empty_database_creates_one_business_and_no_people', async () => {
    expect(await count('tenants')).toBe(1)
    const tenant = await env.DB.prepare('SELECT id FROM tenants').first<{ id: string }>()
    expect(tenant?.id).toMatch(/^[a-z]+_[0-9a-f]{32}$/)

    for (const table of ['users', 'user_emails', 'user_names', 'accounts', 'memberships', 'entitlements']) {
      expect(await count(table), `the baseline seeded rows into ${table}`).toBe(0)
    }
  })
})
