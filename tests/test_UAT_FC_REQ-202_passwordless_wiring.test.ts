import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { SHARED_SERVER_COMPONENTS } from '../tools/generate/src/cli/shared-store'
import { SIGN_IN_PATH, SIGN_OUT_PATH } from '../apps/control-app/src/sessions'
import {
  PASSWORDLESS_INSTALLED,
  PASSWORDLESS_SKIP_REASON,
} from './support/passwordless-installed'

/**
 * REQ-202 — **the component is consumed the way the others are, and the schema
 * has not forked from it.**
 *
 * FOUR CLAIMS, each a one-line mistake production would not announce.
 *
 * 1. THE PREFLIGHT REPORTS IT. The `auth-passwordless` component is delivered
 *    out of band, so `pnpm install` cannot supply it and the lockfile cannot
 *    notice it missing. Without a registration here, a machine that never ran
 *    `bin/install` gets an unresolved specifier deep inside a build rather than a
 *    refusal naming the component and the command.
 *
 * 2. THE MIGRATION HAS NOT FORKED FROM THE COMPONENT. `SCHEMA_STATEMENTS` is the
 *    component's own DDL and wrangler's migration runner reads `.sql` off disk —
 *    it cannot import a JS constant — so the statements are TRANSCRIBED into
 *    `0001_baseline.sql`, and a transcription is a fork unless something checks
 *    it. This is that something, and it is the same check `test_UAT_FC_REQ-162`
 *    makes for the ticket store.
 *
 * 3. THE COOKIE IS DECLARED ON BOTH HALVES. A named wrangler environment inherits
 *    neither vars nor bindings (REQ-144), so the production half must restate
 *    everything. An absent `SESSION_COOKIE_NAME` in production is a deployed
 *    Worker that issues no sessions at all — and it says so nowhere, because
 *    Access still admits the operator.
 *
 * 4. THE BUILDER AND THE APEX AGREE ABOUT IT. `apps/public-site` reads a session
 *    cookie by name and domain to choose which of `account-chrome`'s states to
 *    render ([[REQ-200]]); this Worker is what writes it. They share a session
 *    precisely when the two files agree, and the symptom of disagreeing is a
 *    person signed in on one and signed out on the other with nothing reporting
 *    why.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const CONTROL = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const PUBLIC = path.join(REPO, 'apps', 'public-site', 'wrangler.toml')
const MIGRATION = path.join(REPO, 'db', 'migrations', '0001_baseline.sql')

const control = readFileSync(CONTROL, 'utf8')
const publicSite = readFileSync(PUBLIC, 'utf8')

/** The `[env.production]` half of a file, and everything before it. */
function split(source: string): { top: string; production: string } {
  const match = /^\[env\.production\]$/m.exec(source)
  expect(match, 'the file declares an [env.production] environment').not.toBeNull()
  return { top: source.slice(0, match!.index), production: source.slice(match!.index) }
}

/** One `key = "value"` out of a half, ignoring comment lines. */
function varOf(half: string, key: string): string | undefined {
  for (const line of half.split('\n')) {
    if (line.trim().startsWith('#')) continue
    const match = new RegExp(`^${key}\\s*=\\s*"([^"]*)"`).exec(line.trim())
    if (match) return match[1]
  }
  return undefined
}

describe('REQ-202 — the component is a declared dependency of the build', () => {
  it('test_UAT_FC_REQ-202_the_shared_store_preflight_names_the_component', () => {
    // Claim 1. The list is what `1c preflight` and `1c assets` refuse on, and it
    // is the only place absence is turned into a message an operator can act on.
    expect(SHARED_SERVER_COMPONENTS).toContain('auth-passwordless')
  })
})

describe('REQ-202 — the migration carries the component schema', () => {
  const sql = readFileSync(MIGRATION, 'utf8')

  /** Collapse whitespace so formatting is not what this compares. */
  const flat = (s: string) => s.replace(/\s+/g, ' ').trim()

  it('test_UAT_FC_REQ-202_the_baseline_creates_login_tokens_and_sessions', () => {
    // Asserted UNCONDITIONALLY, unlike the drift check below: this is a file this
    // repository owns and it is always present. Without these two tables every
    // sign-in route throws on the first statement it runs, and `public-site`'s
    // session reader — which already reads `sessions` — answers "signed out" for
    // everybody forever.
    const ddl = flat(
      sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n'),
    )
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS login_tokens')
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS sessions')
  })

  it.skipIf(!PASSWORDLESS_INSTALLED)(
    'test_UAT_FC_REQ-202_every_statement_in_SCHEMA_STATEMENTS_is_in_the_migration',
    async () => {
      // Claim 2. Compared as WHOLE STATEMENTS rather than by table name: a check
      // that only looked for `CREATE TABLE … sessions` would keep passing after
      // upstream added a column, which is precisely the drift this catches.
      const { SCHEMA_STATEMENTS } = (await import(sharedModuleUrl('auth-passwordless'))) as {
        SCHEMA_STATEMENTS: string[]
      }
      expect(SCHEMA_STATEMENTS.length).toBeGreaterThan(0)

      const flatSql = flat(sql)
      for (const statement of SCHEMA_STATEMENTS) {
        expect(flatSql, `migration is missing: ${flat(statement).slice(0, 60)}…`).toContain(
          flat(statement),
        )
      }
    },
  )
})

describe('REQ-202 — the session cookie is configured on both halves and both Workers', () => {
  const { top, production } = split(control)

  it('test_UAT_FC_REQ-202_control_app_names_the_session_cookie_in_both_environments', () => {
    // Claim 3. A name is required in BOTH: an empty one means "this deployment
    // issues no sessions", so an empty production value is a deployed builder
    // that can mint nothing and an empty local one is a `wrangler dev` that
    // cannot sign anybody in.
    expect(varOf(top, 'SESSION_COOKIE_NAME')).toBeTruthy()
    expect(varOf(production, 'SESSION_COOKIE_NAME')).toBeTruthy()
    // The domain is DECLARED in both and empty at the top level on purpose:
    // `wrangler dev` serves on 127.0.0.1, which is nobody's cookie domain, and an
    // absent declaration is not the same statement as an empty one when the
    // production half inherits nothing.
    expect(varOf(top, 'SESSION_COOKIE_DOMAIN')).toBeDefined()
    expect(varOf(production, 'SESSION_COOKIE_DOMAIN')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-202_the_builder_and_the_apex_agree_about_the_cookie', () => {
    // Claim 4. The two Workers are a pair: this one writes the cookie and
    // `public-site` reads it. Compared on the PRODUCTION halves, because that is
    // the deployment where they actually share an apex.
    const apex = split(publicSite).production
    expect(varOf(production, 'SESSION_COOKIE_NAME')).toBe(varOf(apex, 'SESSION_COOKIE_NAME'))
    expect(varOf(production, 'SESSION_COOKIE_DOMAIN')).toBe(varOf(apex, 'SESSION_COOKIE_DOMAIN'))
  })

  it('test_UAT_FC_REQ-202_the_cookie_domain_reaches_the_builder_and_the_apex', () => {
    // The domain has to be the APEX and not the host. `Domain=app.1stcontact.io`
    // would be accepted by every check above and would leave the Sign In control
    // on the public site unable to see a session it had just been given.
    const domain = varOf(production, 'SESSION_COOKIE_DOMAIN') ?? ''
    const routes = /pattern\s*=\s*"([^"]+)"/.exec(split(control).production)?.[1] ?? ''
    const host = routes.split('/')[0]
    expect(host.endsWith(`.${domain}`) || host === domain).toBe(true)
  })
})

describe('REQ-202 — the sign-in paths are the ones the operator has to bypass', () => {
  it('test_UAT_FC_REQ-202_ACCESS_md_records_the_bypass_the_deployment_needs', () => {
    // NOT DOCUMENTATION FOR ITS OWN SAKE. Access enforces on a hostname, so
    // without a bypass policy the edge challenges an invitee before this Worker
    // sees the request — and answers them with its OWN one-time-PIN email. The
    // code is complete and the invite still does not work, which is a failure
    // nothing in this repository can detect at runtime. So the paths are recorded
    // beside the Worker, and this check is what keeps that record in step with
    // the paths the code actually serves.
    const doc = readFileSync(path.join(REPO, 'apps', 'control-app', 'ACCESS.md'), 'utf8')
    expect(doc).toContain(SIGN_IN_PATH)
    expect(doc).toContain(SIGN_OUT_PATH)
    expect(doc.toLowerCase()).toContain('bypass')
  })
})

if (!PASSWORDLESS_INSTALLED) {
  console.warn(`REQ-202 schema drift check skipped: ${PASSWORDLESS_SKIP_REASON}`)
}
