import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseWranglerConfig } from './support/wrangler-toml'

/**
 * BUG-37 — the builder Worker keeps its invocation logs.
 *
 * WHY THIS IS PINNED AT ALL. Without an `[observability]` block a Worker retains
 * no per-invocation logs, only aggregate analytics. That absence is what made
 * BUG-37 expensive: it was possible to establish THAT a request had been killed
 * and not WHICH URL killed it, so the diagnosis came from reading source and a
 * billing page instead of reading one log line.
 *
 * WHY BOTH DECLARATIONS. `observability` is on wrangler's inheritable list, so
 * the production repeat is redundant today — and this file's standing rule is
 * that nothing here depends on remembering which keys inherit, because the key
 * that turns out not to is only discovered in production. The failure mode is
 * silent in the worst way: the deploy succeeds and the logs simply are not
 * there, which reads as "nothing was logged" rather than as a misconfiguration.
 */

const REPO = path.resolve(__dirname, '..')
const TOML = path.join(REPO, 'apps/control-app/wrangler.toml')

describe('BUG-37 — invocation logs are retained', () => {
  const toml = readFileSync(TOML, 'utf8')

  it('test_UAT_FC_BUG-37_observability_is_declared_at_both_levels', () => {
    // AC-7. Two blocks, and the count is the assertion — one of them is the one
    // that silently goes missing.
    expect(toml.match(/^\[observability\]$/gm)).toHaveLength(1)
    expect(toml.match(/^\[env\.production\.observability\]$/gm)).toHaveLength(1)
    expect(toml.match(/^enabled = true$/gm)).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-37_every_invocation_is_sampled', () => {
    // AC-8. A sampled log is a log that is missing exactly the request you came
    // to read. This Worker serves one operator, so the volume argument for
    // sampling does not apply and the rate is pinned rather than left to default.
    expect(toml.match(/^head_sampling_rate = 1$/gm)).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-37_the_production_route_survives_the_new_table', () => {
    // AC-9, and this is the one that would have caught the mistake this change
    // actually made on the first attempt. A TOML table header ENDS the table
    // above it, so `[env.production.observability]` written before `routes`
    // captures it — the file still parses, wrangler still deploys, and the
    // production route silently stops being declared. Asserting the parse rather
    // than the text is the point: the broken form is indistinguishable by eye.
    const config = parseWranglerConfig(toml)
    expect(config.envs.production).toBeDefined()

    // Anchored to line start, not `indexOf`: the prose above mentions
    // `[env.production]` inline, and a substring search finds the comment first.
    const header = /^\[env\.production\]$/m.exec(toml)
    expect(header).not.toBeNull()
    const prod = toml.slice(header!.index + header![0].length)
    const nextTable = /^\[/m.exec(prod)
    const bareKeys = nextTable ? prod.slice(0, nextTable.index) : prod
    expect(bareKeys).toMatch(/^routes = \[$/m)
    expect(bareKeys).toMatch(/^name = "1stcontact-control-app"$/m)
  })

  it('test_UAT_FC_BUG-37_observability_declares_no_binding', () => {
    // Guards the neighbours: the config parser treats any table carrying a
    // `binding` key as a binding declaration, and the REQ-145 UATs assert an
    // exact set of those under production. An `[observability]` block must stay
    // invisible to that count rather than quietly joining it.
    const config = parseWranglerConfig(toml)
    for (const bucket of [config.topLevel, config.envs.production]) {
      expect(bucket.bindings.some((b) => b.startsWith('observability'))).toBe(false)
    }
    expect(config.envs.production.bindings).toEqual(
      expect.arrayContaining(['d1_databases:DB', 'r2_buckets:SITES', 'assets:ASSETS']),
    )
  })
})
