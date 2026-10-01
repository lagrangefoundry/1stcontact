import { afterAll, describe, expect, it } from 'vitest'
import { migrateHookHarness, sha256 } from './support/migrate-hook'

/**
 * [[BUG-171]] — **output after wrangler's answer does not fail the migration
 * check.**
 *
 * The migrate hook merges stderr into what it hands `bin/migration-manifest`,
 * and npm prints its update notice on stderr AFTER wrangler's JSON. The parser
 * used to read from each `[` to the end of the output, so that trailing notice
 * made a successful read look unreadable and `bin/dev up` refused to start.
 *
 * Like the [[REQ-291]] cases, this runs the SHIPPED hook against the SHIPPED
 * script with only `npx` stubbed.
 */

const BASELINE = 'CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY);\n'
const EDITED = `${BASELINE}CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY);\n`
const NPM_NOTICE = [
  'npm notice',
  'npm notice New minor version of npm available! 11.6.0 -> 11.21.0',
  'npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.21.0',
  'npm notice To update run: npm install -g npm@11.21.0',
  'npm notice',
].join('\n')

const hook = migrateHookHarness()
afterAll(() => hook.dispose())

describe('BUG-171 — trailing output after the D1 result set', () => {
  it('test_UAT_FC_BUG-171_a_trailing_npm_notice_does_not_fail_verification', () => {
    const r = hook.run({
      files: { '0001_baseline.sql': BASELINE },
      applied: ['0001_baseline.sql'],
      env: 'dev',
      target: 'local',
      trailer: NPM_NOTICE,
    })

    expect(r.out).not.toContain('could not read the migrations')
    expect(r.out).toContain('1 applied migration matches')
    expect(r.code).toBe(0)
    expect(r.migrations).toEqual([
      'apply 1stcontact-dev --env dev --local --persist-to .wrangler/state',
    ])
  })

  it('test_UAT_FC_BUG-171_drift_behind_a_trailing_npm_notice_is_still_refused', () => {
    const r = hook.run({
      files: { '0001_baseline.sql': EDITED },
      manifest: { '0001_baseline.sql': sha256(BASELINE) },
      applied: ['0001_baseline.sql'],
      chatter: "▲ [WARNING] Proxy environment variables detected. We'll use your proxy.",
      trailer: NPM_NOTICE,
    })

    expect(r.code).toBe(1)
    expect(r.out).toContain(sha256(BASELINE))
    expect(r.out).toContain(sha256(EDITED))
    expect(r.migrations).toEqual([])
  })
})
