import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { secretHookHarness } from './support/secret-hook'

/**
 * [[REQ-259]] — **the deploy refuses without the zone credential, and does not
 * refuse without the sending one.**
 *
 * WHY THIS IS REQ-259'S AND NOT [[REQ-257]]'S. REQ-257 minted
 * `CLOUDFLARE_DNS_TOKEN` and made its hook WARN, on a stated condition: it was
 * the DNS layer and nothing that used it, so a deployment without the token
 * answered 503 to an operator and customers noticed nothing. It wrote down what
 * would end that — *"the moment serving a custom domain depends on it"* — and
 * `Your domain` is that moment. Every control in the section goes through the
 * credential: the selector reads the account's zones, the attach writes records
 * and a route, the toggle writes three more, and release takes them down.
 *
 * WHAT MAKES THIS EVIDENCE. It runs the SHIPPED hook — the same file
 * `bin/deploy` sources — under a constructed environment with a stubbed `npx`,
 * so the decision table is exercised rather than described. A test that only
 * grepped the script for the word `fail` would pass on a script that printed it
 * and exited 0.
 *
 * THE ASYMMETRY IS HALF THE CLAIM. A missing zone credential costs the whole
 * section and aborts; a missing sending credential costs a feature and does not,
 * because REQ-259 states that case as an ordinary one — the domain still
 * attaches, the website still serves, and the toggle reports `off`. Flipping
 * both together would be the easy mistake, so both are pinned here.
 */

const REPO = path.resolve(import.meta.dirname, '..')

const dns = secretHookHarness(
  'bin/deploy.d/secrets/40-cloudflare-dns-token',
  'CLOUDFLARE_DNS_TOKEN',
)
const resend = secretHookHarness('bin/deploy.d/secrets/20-resend-api-key', 'RESEND_API_KEY')
afterAll(() => {
  dns.dispose()
  resend.dispose()
})

describe('REQ-259 — a deployment that cannot manage DNS cannot ship the section', () => {
  it('test_UAT_FC_REQ-259_a_deploy_with_no_zone_credential_is_refused', () => {
    // ABSENT IN BOTH PLACES — not in the operator's shell, and not on the
    // Worker. This is the row REQ-257 left as a warning.
    const missing = dns.run({ stored: [] })
    expect(missing.code).toBe(1)
    expect(missing.pushed).toBeNull()
    expect(missing.out).toMatch(/CLOUDFLARE_DNS_TOKEN is not set/)
    // AND IT SAYS WHY IT NOW REFUSES, naming the surface rather than the
    // capability: an operator who reads this has to be able to tell that
    // something a customer can see is what changed.
    expect(missing.out).toMatch(/Your domain/)
    expect(missing.out).toMatch(/Zone:DNS:Edit/)
  })

  it('test_UAT_FC_REQ-259_a_store_that_could_not_be_read_is_not_a_yes', () => {
    // The directory's standing asymmetry ([[REQ-149]]): only a positive read
    // counts as present, because the failure being guarded against is a
    // confident skip based on an answer nobody actually got. It was a warning
    // on this row too, and it is a refusal for the same reason as the first.
    const unreadable = dns.run({ listFails: true })
    expect(unreadable.code).toBe(1)
    expect(unreadable.pushed).toBeNull()
    expect(unreadable.out).toMatch(/could not be read to check/)
  })

  it('test_UAT_FC_REQ-259_a_credential_already_in_the_store_still_deploys', () => {
    // THE FLIP MUST NOT COST THE ROTATION CONTRACT. An operator whose token has
    // been on the Worker for weeks is not asked to re-supply it, and supplying
    // one is still how a rotation is expressed.
    const kept = dns.run({ stored: ['CLOUDFLARE_DNS_TOKEN'] })
    expect(kept.code).toBe(0)
    expect(kept.pushed).toBeNull()
    expect(kept.out).toMatch(/already on 1stcontact-control-app/)

    const value = 'cf-token-do-not-print-me'
    const pushed = dns.run({ value, stored: [] })
    expect(pushed.code).toBe(0)
    expect(pushed.pushed).toBe(value)
    // AND THE VALUE IS STILL NEVER ECHOED, on the row that now aborts as much
    // as on the rows that do not.
    expect(pushed.out).not.toContain(value)
  })

  it('test_UAT_FC_REQ-259_a_rehearsal_still_reports_rather_than_acts', () => {
    const rehearsal = dns.run({ value: 'cf-token', stored: [], dryRun: true })
    expect(rehearsal.code).toBe(0)
    expect(rehearsal.pushed).toBeNull()
    expect(rehearsal.out).toMatch(/would push CLOUDFLARE_DNS_TOKEN/)
  })

  it('test_UAT_FC_REQ-259_the_sending_credential_did_not_move_with_it', () => {
    // REQ-259 IS A CALLER OF THIS KEY TOO, and says that case is ordinary:
    // `RESEND_API_KEY` absent still attaches the domain and still serves the
    // website, and the toggle reports `off`. So this hook still warns, and the
    // two hooks now make DIFFERENT claims about what their absence costs.
    const missing = resend.run({ stored: [] })
    expect(missing.code).toBe(0)
    expect(missing.pushed).toBeNull()
    expect(missing.out).toMatch(/RESEND_API_KEY is not set/)
  })

  it('test_UAT_FC_REQ-259_no_warning_path_is_left_behind_in_the_dns_hook', () => {
    // A `warn` branch left in place is how this silently reverts: the decision
    // table would still compile, and only one row's `action=` would have to be
    // wrong for the deploy to pass again.
    const hook = readFileSync(
      path.join(REPO, 'bin', 'deploy.d', 'secrets', '40-cloudflare-dns-token'),
      'utf8',
    )
    const decisions = hook
      .split('\n')
      .filter((line) => /^\s*(absent|unreadable)\)\s*action=/.test(line))
    expect(decisions).toHaveLength(2)
    for (const line of decisions) expect(line).toMatch(/action=fail/)
    expect(hook).not.toMatch(/^\s*action=warn/m)
  })
})
