import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * STORY-387c9dfe, plan item 4 of BUNDLE-37 — **a business is owned by an
 * account** ([[REQ-194]]), the half of AC-2255 that is about the DEPLOYMENT.
 *
 * The database half (a provisioned business names its owning account, the
 * platform business is owned by nobody, business and account keys never
 * overlap) is proved in workerd by the `.workers` sibling. What is left is the
 * one business id the deployment itself names: `TENANT_ID`, declared in both
 * wrangler environment blocks — which do not inherit from each other — and
 * seeded by the baseline. All three must agree, and none may read `acct_`,
 * because that prefix belongs to accounts alone.
 *
 * Read from the shipped files because those ARE the deployment configuration;
 * there is no runtime surface that reports them.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const BASELINE = path.join(REPO, 'db', 'migrations', '0001_baseline.sql')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

/** The baseline DDL with its comment lines removed — the file argues in prose. */
function ddl(): string {
  return fs
    .readFileSync(BASELINE, 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
}

describe('the business id the deployment names', () => {
  it('test_UAT_AC2255_the_configured_platform_business_id_agrees_across_both_environments_and_the_seed_and_reads_biz', () => {
    const toml = fs.readFileSync(WRANGLER, 'utf8')
    const declared = [...toml.matchAll(/^TENANT_ID\s*=\s*"([^"]+)"/gm)].map((m) => m[1])
    expect(declared, 'expected TENANT_ID in both environment blocks').toHaveLength(2)
    expect(declared[0]).toBe(declared[1])

    const seeded = /INSERT OR IGNORE INTO tenants[\s\S]*?VALUES\s*\(\s*'([^']+)'/.exec(ddl())
    expect(seeded, 'the baseline seeds no tenant').not.toBeNull()
    expect(seeded![1]).toBe(declared[0])

    for (const id of [...declared, seeded![1]]) {
      expect(id).toMatch(/^biz_[0-9a-f]{32}$/)
      expect(id.startsWith('acct_')).toBe(false)
    }
  })
})
