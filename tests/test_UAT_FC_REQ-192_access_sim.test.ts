import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { normaliseTeamDomain, resetJwksCache, verifyAccessJwt } from '../apps/control-app/src/access'

/**
 * REQ-192 — **the Access simulator exercises the real gate, and does not bypass it**.
 *
 * WHY THIS CLAIM NEEDS A TEST RATHER THAN A COMMENT. `bin/access-sim` is the half
 * of this ticket that makes a seeded person reachable: local dev has two modes
 * and neither gets you an identity. `ACCESS_DEV_OPEN` skips `admit` entirely and
 * resolves the scope from `TENANT_ID`, which is exactly the wrong mode for
 * looking at identity-shaped surfaces, and the configured path wants a real
 * Cloudflare account. The simulator's whole justification is that it is not a
 * third mode — it publishes a JWKS, mints RS256 tokens against it, and
 * `access.ts` verifies them with the same code that verifies Cloudflare's. If
 * that were untrue it would be a bypass with a reassuring comment on top.
 *
 * SO THE VERIFIER UNDER TEST IS THE PRODUCT'S OWN. `verifyAccessJwt` is imported
 * and called here — nothing is reimplemented, nothing is stubbed. What the test
 * supplies is the team domain, and it points at a process this test started.
 *
 * IT IS NOT A BACKDOOR, AND THAT IS STRUCTURAL RATHER THAN ASSERTED. The
 * simulator signs with a keypair generated at boot and served from loopback, so a
 * deployment whose `ACCESS_TEAM_DOMAIN` names Cloudflare refuses every token it
 * mints — the signature does not verify against Cloudflare's keys. The way to
 * misuse it is to repoint a deployment at localhost, which is not a mistake.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIM = path.join(REPO, 'bin', 'access-sim')
const AUD = 'req192-local-aud'

let sim: ChildProcess | undefined
let origin = ''

/** A port nobody else is on, asked for rather than guessed. */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

/** Wait for the JWKS to answer — the simulator is up when its keys are readable. */
async function waitForCerts(url: string, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`access-sim did not answer ${url}`)
}

beforeAll(async () => {
  const port = await freePort()
  origin = `http://127.0.0.1:${port}`
  sim = spawn(process.execPath, [SIM, '--port', String(port), '--aud', AUD], { stdio: 'ignore' })
  await waitForCerts(`${origin}/cdn-cgi/access/certs`)
}, 30_000)

afterAll(() => {
  sim?.kill()
})

describe('REQ-192 — bin/access-sim', () => {
  /**
   * `--print-env` is how the simulator is wired in: two vars layered over
   * `.dev.vars`, which is the whole of the configuration. It has to emit BOTH,
   * because `isUnconfiguredLocalDev` is true only when both are empty — half the
   * pair leaves the Worker on the dev-open path with the gate switched off, which
   * is the mode the simulator exists to get out of.
   */
  it('test_UAT_FC_REQ-192_the_simulator_prints_both_access_vars', async () => {
    const { stdout } = await promisify(execFile)(process.execPath, [SIM, '--print-env', '--port', '8799'])
    expect(stdout).toMatch(/^ACCESS_TEAM_DOMAIN="http:\/\/127\.0\.0\.1:8799"$/m)
    expect(stdout).toMatch(/^ACCESS_AUD=".+"$/m)
  })

  /**
   * The claim itself: a token this process minted is accepted by the product's
   * verifier, with every check running for real.
   *
   * `normaliseTeamDomain` ACCEPTING `http://` IS WHAT MAKES IT POSSIBLE, and it is
   * asserted separately below rather than relied on silently — it is the single
   * property that would remove the simulator if it were tightened.
   */
  it('test_UAT_FC_REQ-192_a_minted_token_passes_the_real_verifier', async () => {
    resetJwksCache()
    const token = (await (await fetch(`${origin}/mint?email=alice@plumbing.example`)).text()).trim()

    const result = await verifyAccessJwt({ token, teamDomain: origin, aud: AUD })
    expect(result.ok, JSON.stringify(result)).toBe(true)
    if (!result.ok) return
    expect(result.claims.email).toBe('alice@plumbing.example')
  })

  /**
   * And it is a real gate rather than a rubber stamp: the same verifier refuses
   * the same token under a different `aud`. Without this case, "the token passed"
   * is equally consistent with a verifier that checks nothing.
   */
  it('test_UAT_FC_REQ-192_the_verifier_still_refuses_a_wrong_audience', async () => {
    resetJwksCache()
    const token = (await (await fetch(`${origin}/mint?email=alice@plumbing.example`)).text()).trim()

    const result = await verifyAccessJwt({ token, teamDomain: origin, aud: 'some-other-aud' })
    expect(result.ok).toBe(false)
  })

  /**
   * The property the whole tool rests on, pinned so that tightening it fails here
   * rather than in somebody's dev loop: `normaliseTeamDomain` keeps an `http://`
   * prefix. Cloudflare's own domains are https and unaffected.
   */
  it('test_UAT_FC_REQ-192_the_gate_accepts_an_http_team_domain', () => {
    expect(normaliseTeamDomain('http://127.0.0.1:8799')).toBe('http://127.0.0.1:8799')
    expect(fs.existsSync(SIM)).toBe(true)
    // eslint-disable-next-line no-bitwise
    expect(fs.statSync(SIM).mode & 0o111).toBeGreaterThan(0)
  })

  /**
   * The login list reads the address table, and this is a regression guard rather
   * than a design assertion.
   *
   * IT WAS BROKEN WHEN THIS TICKET PICKED IT UP. The tool was written against
   * `SELECT email FROM users`, REQ-191 moved the address into `user_emails`, and
   * the query started failing — silently, because `knownPeople` swallows a
   * failure by design so a missing store degrades to the manual path rather than
   * to a broken page. The degradation is right and it hid a real break: the page
   * kept rendering and simply stopped listing anybody.
   *
   * SO THE GUARD IS ON THE QUERY TEXT, which is the only part a test with no D1
   * can see. It fails the next time the addresses move and nobody updates the one
   * reader that cannot report its own failure.
   */
  it('test_UAT_FC_REQ-192_the_login_list_reads_the_address_table', () => {
    // Comments stripped first: the file EXPLAINS the old query in its own prose,
    // and a scan that read the explanation as the code would fail on the
    // documentation of the fix.
    const code = fs
      .readFileSync(SIM, 'utf8')
      .split('\n')
      .filter((line) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
      .join('\n')
    expect(code).toContain('FROM user_emails')
    expect(code).not.toMatch(/SELECT\s+email\s+FROM\s+users/)
  })

  /**
   * `/login` is the point of the tool — become somebody in one click — and the
   * people it offers are read out of the store at request time rather than
   * listed here, so the page cannot drift from what the seed actually wrote. A
   * store it cannot read degrades to the manual path rather than to a broken
   * page, which is what this asserts: the page answers, and it says how to sign
   * in by hand.
   */
  it('test_UAT_FC_REQ-192_login_offers_a_way_in_even_with_no_store', async () => {
    const res = await fetch(`${origin}/login`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Sign in as')
    expect(html).toMatch(/login\?email=|No seeded people found/)
  }, 90_000)
})
