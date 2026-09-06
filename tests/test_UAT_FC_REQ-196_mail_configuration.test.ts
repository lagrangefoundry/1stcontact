import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readWranglerConfig } from './support/wrangler-toml'
import { secretHookHarness } from './support/secret-hook'

/**
 * [[REQ-196]] — **the sending address is configuration, and the credential is
 * not in the repository.**
 *
 * TWO HALVES OF ONE SETUP, and both fail silently if they are wrong. A missing
 * `MAIL_FROM` in the production block is a Worker that refuses to send at the
 * moment it is asked to — a named environment inherits no vars, which is this
 * repository's standing rule ([[REQ-144]], [[REQ-147]]) and its most frequently
 * rediscovered one. A credential in a committed file is a credential that can
 * send mail as `1stcontact.io` for as long as it takes somebody to notice.
 *
 * AND THE HOOK THAT PUSHES IT WARNS RATHER THAN FAILS, which is a deliberate
 * departure from `10-anthropic-api-key` and therefore worth pinning: a control
 * app that cannot take a turn does nothing at all, while a control app with no
 * mail credential runs the local adapter and delivers nothing — survivable only
 * for as long as nothing sends. The rule is that the outcome matches what a
 * deployment without the value actually does.
 */

const REPO = path.resolve(import.meta.dirname, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const FROM_ADDRESS = 'no-reply@1stcontact.io'

const harness = secretHookHarness('bin/deploy.d/secrets/20-resend-api-key', 'RESEND_API_KEY')
afterAll(() => harness.dispose())

describe('REQ-196 — the mail configuration', () => {
  it('test_UAT_FC_REQ-196_the_from_address_is_declared_on_both_sides', () => {
    const config = readWranglerConfig(WRANGLER)
    expect(config.topLevel.vars, 'MAIL_FROM is not declared at the top level').toContain(
      'MAIL_FROM',
    )
    expect(
      config.envs.production.vars,
      'MAIL_FROM is not declared for production, which inherits no vars — the deployed ' +
        'Worker would have no address to send from and would refuse every send.',
    ).toContain('MAIL_FROM')

    const declarations = readFileSync(WRANGLER, 'utf8')
      .split('\n')
      .filter((line) => /^\s*MAIL_FROM\s*=/.test(line))
      .map((line) => line.trim())
    expect(declarations).toHaveLength(2)
    for (const line of declarations) {
      expect(line).toBe(`MAIL_FROM = "${FROM_ADDRESS}"`)
    }
  })

  it('test_UAT_FC_REQ-196_the_api_key_is_in_no_committed_configuration', () => {
    // A secret and not a var: `wrangler secret` values are write-only, while a
    // [vars] entry is readable in the dashboard and echoed by `wrangler deploy`.
    // This one can send mail as our own domain.
    const toml = readFileSync(WRANGLER, 'utf8')
    const assignments = toml
      .split('\n')
      .filter((line) => /^\s*RESEND_API_KEY\s*=/.test(line))
    expect(
      assignments,
      'RESEND_API_KEY is assigned in wrangler.toml. It is a bearer credential that can ' +
        'send as 1stcontact.io and belongs in `wrangler secret`, never in a committed file.',
    ).toEqual([])

    // The hook that pushes it carries the NAME and never a value.
    const hook = readFileSync(path.join(REPO, 'bin', 'deploy.d', 'secrets', '20-resend-api-key'), 'utf8')
    expect(hook).not.toMatch(/RESEND_API_KEY\s*=\s*["']?re_/)
  })

  it('test_UAT_FC_REQ-196_the_hook_pushes_a_supplied_credential_and_never_prints_it', () => {
    // Supplying a value is how a rotation is expressed, so it pushes even when
    // the name is already there — and the standing rule for every hook in that
    // directory is that the value is never echoed, not even truncated.
    const value = 're_super_secret_do_not_print'
    const r = harness.run({ value, stored: ['RESEND_API_KEY'] })

    expect(r.code).toBe(0)
    expect(r.pushed).toBe(value) // exact: no trailing newline
    expect(r.out).toMatch(/pushed RESEND_API_KEY/)
    expect(r.out).not.toContain(value)
    expect(r.out).not.toContain(value.slice(0, 12))
  })

  it('test_UAT_FC_REQ-196_the_hook_leaves_a_stored_credential_alone', () => {
    // The guard is about the store, not the operator's shell: a deploy from a
    // shell without the key must not demand it be re-supplied to overwrite it
    // with itself.
    const r = harness.run({ stored: ['RESEND_API_KEY'] })

    expect(r.code).toBe(0)
    expect(r.out).toMatch(/already on 1stcontact-control-app/)
    expect(r.pushed).toBeNull()
  })

  it('test_UAT_FC_REQ-196_the_hook_warns_loudly_when_the_credential_exists_nowhere', () => {
    // It does not abort — nothing sends yet, and the sending domain is an
    // operator task with waiting in it. What it must not do is pass silently:
    // the deployment will record messages and deliver none of them, which is
    // precisely the assumption this ticket exists to prevent.
    const r = harness.run({ stored: [] })

    expect(r.code).toBe(0)
    expect(r.out).toMatch(/RESEND_API_KEY is not set in your environment/)
    expect(r.out).toMatch(/delivers none of them/)
    expect(r.pushed).toBeNull()

    // An unreadable store is not a yes. Only a positive read counts as present.
    const unreadable = harness.run({ listFails: true })
    expect(unreadable.code).toBe(0)
    expect(unreadable.out).toMatch(/could not be read to check/)
    expect(unreadable.pushed).toBeNull()
  })

  it('test_UAT_FC_REQ-196_the_hook_rehearses_and_leaves_the_public_site_alone', () => {
    // A rehearsal must change nothing, or `--dry-run` stops being a rehearsal.
    const push = harness.run({ value: 're_x', stored: [], dryRun: true })
    expect(push.code).toBe(0)
    expect(push.out).toMatch(/would push RESEND_API_KEY/)
    expect(push.pushed).toBeNull()

    // public-site serves rendered bytes to the public internet and must never
    // carry a credential that can send as our domain.
    const other = harness.run({ app: 'public-site', stored: [] })
    expect(other.code).toBe(0)
    expect(other.pushed).toBeNull()
    expect(other.out.trim()).toBe('')
  })
})
