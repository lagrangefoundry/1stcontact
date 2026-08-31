/**
 * Reconciliation UATs for story-d5167ced — "Platform Build, Deploy & Smoke: One
 * Path To Ship A Worker, And Proof It Serves".
 *
 * Reconciled from bundle-78f4e2fe (BUNDLE-21), plan item 4 of 5. One UAT per
 * acceptance criterion:
 *
 *   • AC-1454 — the operator surface retains every invocation's log: declared at
 *     the top level and again for the named production environment, unsampled,
 *     and PLACED so the production route survives the table it sits beneath.
 *   • AC-1455 — the retention declaration is not a binding, so the set the
 *     environment-repetition check counts is unchanged by it.
 *
 * THE BOUNDARY. Both criteria are stated about the PARSED deployment
 * configuration rather than about its text, and deliberately so: the failure
 * each guards against still parses, still deploys, and is indistinguishable by
 * eye. `apps/control-app/wrangler.toml` is read from disk exactly as wrangler
 * reads it — nothing is stubbed, because the file itself is the artifact under
 * test.
 *
 * TWO READERS, and the split is the point:
 *
 *   - `tables()` below answers "which table does this key belong to?", which is
 *     the whole of AC-1454. A TOML table header ENDS the table above it, so the
 *     question of whether `routes` is still a key of `[env.production]` — rather
 *     than having been swallowed by a retention table written above it — is
 *     answered by the parse and by nothing else.
 *   - `parseWranglerConfig` from the support module is the reader the
 *     environment-repetition check itself uses (AC-1341). AC-1455 is a claim
 *     about THAT check's answer, so it is asserted through that reader rather
 *     than through a second opinion, or the test would be pinning something the
 *     check does not see.
 *
 * Each criterion also carries a NEGATIVE CONTROL — the broken form fed to the
 * same reader — because a test that only ever sees the correct file cannot
 * distinguish "the property holds" from "the reader cannot express the fault".
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { missingFromEnv, parseWranglerConfig } from './support/wrangler-toml'

const REPO = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

/** The operator surface — the Worker that serves the builder. */
const CONTROL_TOML = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

/**
 * The TOML tables, keyed by dotted path, each holding its own bare keys.
 *
 * Deliberately narrow: it answers which table a key was declared in and what
 * scalar it was assigned, which is exactly what AC-1454 asserts and no more. A
 * multi-line array (`routes = [ … ]`) registers under its opening line — the
 * continuation lines are not assignments and are ignored — which is all this
 * needs, since the criterion is about WHICH TABLE `routes` belongs to, not about
 * the route's own shape.
 */
function tables(toml: string): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>()
  const open = (dotted: string): Map<string, string> => {
    const existing = out.get(dotted)
    if (existing) return existing
    const fresh = new Map<string, string>()
    out.set(dotted, fresh)
    return fresh
  }

  let current = open('')
  for (const raw of toml.split('\n')) {
    const line = raw.replace(/(^|\s)#.*$/, '').trim()
    if (line === '') continue

    const header = /^\[\[?([^\]]+)\]\]?$/.exec(line)
    if (header) {
      current = open(header[1].trim())
      continue
    }

    const assignment = /^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/.exec(line)
    if (assignment) current.set(assignment[1], assignment[2].trim())
  }
  return out
}

// ═════════════════════════════════════════════════════════════════════════════
// AC-1454 — every invocation is retained, in both environments, and the
//           production route survives the declaration written beneath it
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — the operator surface retains every invocation log', () => {
  it('test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives', () => {
    const toml = readFileSync(CONTROL_TOML, 'utf8')
    const parsed = tables(toml)

    // Both declarations are present, and both keep EVERY invocation. Without
    // them the platform retains no per-invocation record at all — only aggregate
    // counters — so it is possible to establish THAT a request was killed and
    // never WHICH one. A sampled log is a log missing exactly the request the
    // reader came for; this surface serves one operator's builder, so the volume
    // argument for sampling does not apply.
    for (const table of ['observability', 'env.production.observability']) {
      const block = parsed.get(table)
      expect(block, `${table} is not declared — the deploy succeeds and the logs are simply absent`).toBeDefined()
      expect(block!.get('enabled'), `${table} does not enable retention`).toBe('true')
      expect(
        block!.get('head_sampling_rate'),
        `${table} does not keep every invocation`,
      ).toBe('1')
    }

    // The production repeat is redundant for as long as the tool inherits this
    // key, and it is written anyway: the rule is that nothing depends on
    // remembering which declarations inherit. Losing it fails silently in the
    // worst way — the deploy succeeds and the logs read as "nothing happened".
    expect(parsed.get('env.production.observability')).not.toBe(parsed.get('observability'))

    // PLACEMENT. A table header ends the table above it, so a retention table
    // written BEFORE the route list captures the route: the configuration still
    // parses, the tool still deploys, and the production route silently stops
    // being declared. The environment's own bare keys must therefore still hold
    // its deployed name and its route list.
    const production = parsed.get('env.production')
    expect(production, 'the named production environment is not declared').toBeDefined()
    expect(
      production!.has('name'),
      'the production environment lost its deployed name to the table written beneath it',
    ).toBe(true)
    expect(
      production!.has('routes'),
      'the production route was absorbed by a table written above it — the deploy still succeeds and serves nothing',
    ).toBe(true)
    expect(production!.get('name')).toBe('"1stcontact-control-app"')

    // NEGATIVE CONTROL. The same file with the retention table hoisted above the
    // route list is valid TOML that deploys — and the route is gone. If this
    // parse could not see the difference, the assertion above would be vacuous.
    const hoisted = `
name = "1stcontact-control-app"

[env.production]
name = "1stcontact-control-app"

[env.production.observability]
enabled = true
head_sampling_rate = 1
routes = [
  { pattern = "app.1stcontact.io/*", zone_name = "1stcontact.io" }
]
`
    const broken = tables(hoisted)
    expect(broken.get('env.production')!.has('routes')).toBe(false)
    expect(broken.get('env.production.observability')!.has('routes')).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1455 — retention declares no binding, so the counted set is unchanged
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — the retention declaration joins no binding set', () => {
  it('test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count', () => {
    const toml = readFileSync(CONTROL_TOML, 'utf8')
    const config = parseWranglerConfig(toml)

    // A binding is identified STRUCTURALLY — any declared block that names a
    // binding — precisely so a binding kind introduced later is covered without
    // the check being edited. The cost of that generality is that a NON-binding
    // block must stay invisible to it.
    for (const [where, bucket] of [
      ['the top level', config.topLevel],
      ['[env.production]', config.envs.production],
    ] as const) {
      expect(bucket, `${where} was not parsed`).toBeDefined()
      expect(
        bucket.bindings.filter((b) => b.includes('observability')),
        `${where} counts the retention declaration as a binding`,
      ).toEqual([])
      // Nor as a variable: its keys belong to a table of its own, not to `vars`.
      expect(bucket.vars).not.toContain('enabled')
      expect(bucket.vars).not.toContain('head_sampling_rate')
    }

    // The production binding set still holds exactly what it held before the
    // retention block was written: the structured-data store, the object bucket
    // and the asset binding. Were retention miscounted, the criteria asserting
    // this exact set would begin failing on a declaration that binds nothing.
    const EXPECTED = ['assets:ASSETS', 'd1_databases:DB', 'r2_buckets:SITES']
    expect([...config.envs.production.bindings].sort()).toEqual(EXPECTED)
    expect([...config.topLevel.bindings].sort()).toEqual(EXPECTED)

    // And the check's own answer carries nothing derived from the retention
    // declaration: no binding is reported missing at all, and neither of
    // retention's own keys appears among the variables. Deliberately asserted as
    // "nothing of ours is in here" rather than as "this list is empty" — the
    // variables half is AC-1341's to state, including its one stated exception,
    // and restating it here would make this criterion fail for that reason
    // rather than for its own.
    const missing = missingFromEnv(config, 'production')
    expect(
      missing.bindings,
      'the retention declaration was counted as a binding the named environment fails to repeat',
    ).toEqual([])
    expect(
      missing.vars.filter((v) => v === 'enabled' || v === 'head_sampling_rate'),
      'retention’s own keys leaked into the variables the check counts',
    ).toEqual([])

    // NEGATIVE CONTROL — the reader is not simply blind to unfamiliar tables. A
    // block that DOES name a binding is counted from the top level and reported
    // missing when the named environment omits it, which is what makes the
    // invisibility above a property of retention rather than of the parser.
    const withRetentionAndABinding = `
name = "1stcontact-control-app"

[observability]
enabled = true
head_sampling_rate = 1

[[a_binding_kind_nobody_has_written_yet]]
binding = "TOMORROW"

[env.production]
name = "1stcontact-control-app"

[env.production.observability]
enabled = true
head_sampling_rate = 1
`
    const control = parseWranglerConfig(withRetentionAndABinding)
    expect(control.topLevel.bindings).toEqual(['a_binding_kind_nobody_has_written_yet:TOMORROW'])
    expect(missingFromEnv(control, 'production')).toEqual({
      vars: [],
      bindings: ['a_binding_kind_nobody_has_written_yet:TOMORROW'],
    })
  })
})
