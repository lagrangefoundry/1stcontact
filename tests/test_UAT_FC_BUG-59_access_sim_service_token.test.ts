import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { resetJwksCache, verifyAccessJwt } from '../apps/control-app/src/access'

/**
 * BUG-59 — **the simulator is the edge, not only the issuer**.
 *
 * WHAT WAS BROKEN. Turning the local gate on locked the local tooling out of the
 * local builder. `1c push` is the only way to get a site into the store — the
 * documented recovery when `sites` is empty, which is the state a fresh clone is
 * in — and its one inbound credential is the `CF-Access-Client-Id` /
 * `CF-Access-Client-Secret` pair. Nothing on this side exchanged that pair for an
 * identity, so every push answered 401 with advice (`bin/access-token`) that
 * cannot be followed against a simulator.
 *
 * WHY THE FIX BELONGS HERE AND NOT IN `push.ts`. The exchange is the EDGE's half
 * of the protocol. Cloudflare takes the two headers and sets
 * `cf-access-jwt-assertion` on what it forwards; BUG-36 removed that header from
 * the client for exactly that reason, and re-adding it there would re-break the
 * deployed path to fix the local one. So the missing half is a proxy, and this
 * suite drives a real `bin/access-sim` process pointed at a stub builder it
 * started itself — what is asserted is what the simulator actually forwards.
 *
 * THE VERIFIER IS THE PRODUCT'S OWN, as in REQ-192's suite: `verifyAccessJwt` is
 * imported and called on the assertion the simulator minted. Nothing is
 * reimplemented and nothing is stubbed except the origin being protected.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIM = path.join(REPO, 'bin', 'access-sim')
const AUD = 'bug59-local-aud'
const CLIENT_ID = 'bug59.access'
const CLIENT_SECRET = 'bug59-secret'
const SERVICE_EMAIL = 'martin@westhead.me'
/** What `bin/access-sim` derives from `CLIENT_ID`, following Cloudflare's own. */
const SERVICE_NAME = 'bug59'

/** One request the stub builder was actually given. */
interface Seen {
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
  body: string
}

let sim: ChildProcess | undefined
let builder: http.Server | undefined
let origin = ''
let seen: Seen[] = []

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

/**
 * The origin behind the gate, standing in for `wrangler dev`.
 *
 * It records what it was given and echoes it back, because the claims under test
 * are all about the request as the BUILDER receives it — the assertion header the
 * simulator added, the credential it spent, the method and body it carried
 * across. A real Worker would answer these with its own routing and prove less.
 */
function startStubBuilder(port: number): http.Server {
  return http
    .createServer((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        seen.push({
          method: req.method ?? '',
          url: req.url ?? '',
          headers: req.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        })
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true, saw: req.url }))
      })
    })
    .listen(port, '127.0.0.1')
}

beforeAll(async () => {
  const simPort = await freePort()
  const builderPort = await freePort()
  origin = `http://127.0.0.1:${simPort}`
  builder = startStubBuilder(builderPort)
  sim = spawn(
    process.execPath,
    [
      SIM,
      '--port', String(simPort),
      '--aud', AUD,
      '--builder', `http://127.0.0.1:${builderPort}`,
      '--client-id', CLIENT_ID,
      '--client-secret', CLIENT_SECRET,
      '--service-email', SERVICE_EMAIL,
    ],
    { stdio: 'ignore' },
  )
  await waitForCerts(`${origin}/cdn-cgi/access/certs`)
}, 30_000)

afterAll(() => {
  sim?.kill()
  builder?.close()
})

describe('BUG-59 — bin/access-sim exchanges a service token', () => {
  /**
   * The claim the whole ticket rests on: the pair `1c push` already sends is
   * exchanged for an assertion the product's own verifier accepts.
   *
   * IT IS VERIFIED RATHER THAN MATCHED. Asserting the header is merely present
   * would pass against a simulator that forwarded any string; `verifyAccessJwt`
   * runs the signature, `aud`, `iss`, `exp`, `nbf` and `iat` checks the Worker
   * runs, against the JWKS this process published.
   *
   * AND THE SHAPE IS CLOUDFLARE'S: `common_name`, no `email`, reported by
   * `access.ts` as `service-token:<name>`. That is the whole point of minting it
   * here rather than an easier token — the local path exercises the same
   * admission the deployed one does, which is `SERVICE_TOKEN_IDENTITIES`.
   */
  it('test_UAT_FC_BUG-59_a_matching_pair_is_exchanged_for_a_verifiable_assertion', async () => {
    seen = []
    resetJwksCache()
    const res = await fetch(`${origin}/api/import`, {
      method: 'POST',
      headers: {
        'CF-Access-Client-Id': CLIENT_ID,
        'CF-Access-Client-Secret': CLIENT_SECRET,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ slug: 'xgd' }),
    })

    expect(res.status).toBe(200)
    expect(seen).toHaveLength(1)
    const assertion = seen[0].headers['cf-access-jwt-assertion']
    expect(typeof assertion).toBe('string')

    const result = await verifyAccessJwt({
      token: String(assertion),
      teamDomain: origin,
      aud: AUD,
    })
    expect(result.ok, JSON.stringify(result)).toBe(true)
    if (!result.ok) return
    // No email at all, which is what makes it a service token rather than a
    // person wearing one.
    expect(result.claims.email).toBeUndefined()
    expect(result.claims.common_name).toBe(SERVICE_NAME)
    expect(result.identity).toBe(`service-token:${SERVICE_NAME}`)
  })

  /**
   * The pair is SPENT at the edge. Cloudflare does not hand the client's
   * credential to the origin — what the origin gets is the identity that was
   * already established from it — and a simulator that leaked it through would be
   * teaching the Worker to accept a credential it must never see.
   */
  it('test_UAT_FC_BUG-59_the_credential_is_spent_and_not_forwarded', async () => {
    seen = []
    await fetch(`${origin}/api/sites`, {
      headers: { 'CF-Access-Client-Id': CLIENT_ID, 'CF-Access-Client-Secret': CLIENT_SECRET },
    })

    expect(seen).toHaveLength(1)
    expect(seen[0].headers['cf-access-client-id']).toBeUndefined()
    expect(seen[0].headers['cf-access-client-secret']).toBeUndefined()
  })

  /**
   * A gate rather than a rubber stamp: the wrong secret is refused, and the
   * builder is never asked. Without the second half, "the right pair worked" is
   * equally consistent with a proxy that forwards everything.
   *
   * 403 AND NOT A REDIRECT, deliberately. BUG-36 records what a 302 costs a
   * client: it is followed, the login page arrives as 200, and the caller parses
   * HTML as its result. A caller that presented a credential is told about the
   * credential.
   */
  it('test_UAT_FC_BUG-59_a_wrong_secret_is_refused_and_nothing_is_forwarded', async () => {
    seen = []
    const res = await fetch(`${origin}/api/sites`, {
      headers: { 'CF-Access-Client-Id': CLIENT_ID, 'CF-Access-Client-Secret': 'not-the-secret' },
      redirect: 'manual',
    })

    expect(res.status).toBe(403)
    expect(await res.text()).toMatch(/--print-token/)
    expect(seen).toHaveLength(0)
  })

  /**
   * Half a pair is no pair — the rule `1c push` already enforces on the way out,
   * restated here because this is the end that decides. Half a credential is not
   * a weaker credential, so it takes the uncredentialed path rather than earning
   * an answer about the missing half.
   */
  it('test_UAT_FC_BUG-59_half_a_pair_is_treated_as_no_pair', async () => {
    seen = []
    const res = await fetch(`${origin}/api/sites`, {
      headers: { 'CF-Access-Client-Id': CLIENT_ID },
      redirect: 'manual',
    })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${origin}/login`)
    expect(seen).toHaveLength(0)
  })

  /**
   * The browser's credential is passed through untouched. What the cookie holds
   * was minted here already and the Worker verifies it; re-signing it would put a
   * second issuer in a path that has one.
   */
  it('test_UAT_FC_BUG-59_a_browser_cookie_is_forwarded_unchanged', async () => {
    seen = []
    const token = (await (await fetch(`${origin}/mint?email=alice@plumbing.example`)).text()).trim()
    const res = await fetch(`${origin}/api/sites`, {
      headers: { cookie: `CF_Authorization=${token}` },
    })

    expect(res.status).toBe(200)
    expect(seen).toHaveLength(1)
    expect(seen[0].headers.cookie).toBe(`CF_Authorization=${token}`)
    // Not re-signed, and not signed over: the Worker is left to verify the one
    // credential the caller actually presented.
    expect(seen[0].headers['cf-access-jwt-assertion']).toBeUndefined()
  })

  /**
   * With no credential at all the answer is the one Access gives a browser — a
   * way in, rather than a bare 401 naming Cloudflare, which is the dead end this
   * bug was reported from.
   */
  it('test_UAT_FC_BUG-59_an_uncredentialed_request_is_sent_to_login', async () => {
    seen = []
    const res = await fetch(`${origin}/`, { redirect: 'manual' })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe(`${origin}/login`)
    expect(seen).toHaveLength(0)
  })

  /**
   * The simulator's own routes keep priority now that everything else is
   * forwarded. `/cdn-cgi/access/certs` is what `access.ts` fetches and `/login`
   * is the point of the tool; either one reaching the builder would break the
   * gate in a way that looks like a builder fault.
   */
  it('test_UAT_FC_BUG-59_the_simulators_own_routes_are_never_proxied', async () => {
    seen = []
    const certs = await fetch(`${origin}/cdn-cgi/access/certs`)
    const login = await fetch(`${origin}/login?email=alice@plumbing.example`, {
      redirect: 'manual',
    })

    expect(certs.status).toBe(200)
    expect((await certs.json()).keys).toHaveLength(1)
    expect(login.status).toBe(302)
    expect(login.headers.get('set-cookie')).toMatch(/^CF_Authorization=/)
    expect(seen).toHaveLength(0)
  })

  /**
   * The property `1c push` depends on: an import is a POST with a JSON body, and
   * a hop that dropped either would fail as an empty or malformed import rather
   * than as a proxy fault.
   */
  it('test_UAT_FC_BUG-59_method_path_and_body_survive_the_hop', async () => {
    seen = []
    const body = JSON.stringify({ slug: 'xgd', pages: [{ name: 'home.json' }], force: true })
    await fetch(`${origin}/api/import?dry=1`, {
      method: 'POST',
      headers: {
        'CF-Access-Client-Id': CLIENT_ID,
        'CF-Access-Client-Secret': CLIENT_SECRET,
        'content-type': 'application/json',
      },
      body,
    })

    expect(seen).toHaveLength(1)
    expect(seen[0].method).toBe('POST')
    expect(seen[0].url).toBe('/api/import?dry=1')
    expect(seen[0].body).toBe(body)
    expect(seen[0].headers['content-type']).toBe('application/json')
  })

  /**
   * `--print-token` is the client half of the wiring, and it is separate from
   * `--print-env` because they configure different sides of the wire:
   * `--print-env` output belongs in `.dev.vars.local` and is read by the Worker,
   * this belongs in a shell and is read by whoever is calling. Both halves are
   * emitted for the same reason `--print-env` emits both of its own — one half of
   * a pair is not a usable configuration.
   */
  it('test_UAT_FC_BUG-59_print_token_emits_both_halves_of_the_pair', async () => {
    const { stdout } = await promisify(execFile)(process.execPath, [
      SIM, '--print-token', '--client-id', CLIENT_ID, '--client-secret', CLIENT_SECRET,
    ])

    expect(stdout).toMatch(new RegExp(`^export CF_ACCESS_CLIENT_ID='${CLIENT_ID}'$`, 'm'))
    expect(stdout).toMatch(new RegExp(`^export CF_ACCESS_CLIENT_SECRET='${CLIENT_SECRET}'$`, 'm'))
    // The WORKER's vars are not in it. Handing `.dev.vars.local` a pair the
    // Worker has no reader for is how one file ends up meaning two things.
    expect(stdout).not.toMatch(/ACCESS_TEAM_DOMAIN|ACCESS_AUD|SERVICE_TOKEN_IDENTITIES/)
  })

  /**
   * And the WORKER's side of the same wiring. The exchanged token says only which
   * NAME it is; `SERVICE_TOKEN_IDENTITIES` is where that name becomes a person, so
   * emitting it here is what keeps the two invocations of this script in step —
   * the name derived from the same `--client-id` that would be exchanged, the
   * address from the same `--service-email` that would be acted as.
   *
   * IT SITS WITH THE OTHER TWO because it is the same kind of thing: configuration
   * the Worker reads, belonging in `.dev.vars.local`.
   */
  it('test_UAT_FC_BUG-59_print_env_emits_the_identity_mapping_with_the_access_vars', async () => {
    const { stdout } = await promisify(execFile)(process.execPath, [
      SIM, '--print-env', '--port', '8799',
      '--client-id', CLIENT_ID, '--service-email', SERVICE_EMAIL,
    ])

    expect(stdout).toMatch(/^ACCESS_TEAM_DOMAIN="http:\/\/127\.0\.0\.1:8799"$/m)
    expect(stdout).toMatch(/^ACCESS_AUD=".+"$/m)
    expect(stdout).toMatch(
      new RegExp(`^SERVICE_TOKEN_IDENTITIES="${SERVICE_NAME}=${SERVICE_EMAIL}"$`, 'm'),
    )
  })

  /**
   * With no address to map the name to, the exchange refuses HERE rather than
   * minting a token the Worker will refuse `no_email`. Both answers are true; only
   * this one is about the thing the operator can change, and only this process
   * knows the mapping is empty because it is the one that emits it.
   */
  it('test_UAT_FC_BUG-59_a_pair_with_nobody_to_be_refuses_and_says_so', async () => {
    const simPort = await freePort()
    const nameless = spawn(
      process.execPath,
      [SIM, '--port', String(simPort), '--aud', AUD, '--service-email', ''],
      { stdio: 'ignore' },
    )
    try {
      const at = `http://127.0.0.1:${simPort}`
      await waitForCerts(`${at}/cdn-cgi/access/certs`)
      const res = await fetch(`${at}/api/sites`, {
        headers: {
          'CF-Access-Client-Id': 'local-dev.access',
          'CF-Access-Client-Secret': 'local-dev-secret',
        },
        redirect: 'manual',
      })

      expect(res.status).toBe(403)
      expect(await res.text()).toMatch(/PLATFORM_ADMINS|--service-email/)
    } finally {
      nameless.kill()
    }
  }, 30_000)

  /**
   * And the address it defaults to is the break glass the deployment already
   * names, read from the two files the Worker reads in the order the Worker reads
   * them (`.dev.vars` overrides `[vars]`). A default of "the first seeded person"
   * would pick whoever the fixture happened to insert first, who need not be able
   * to write to anything.
   *
   * THE FIXTURE IS WRITTEN ONLY IF THE OPERATOR HAS NO `.dev.vars`. That file is
   * gitignored personal configuration and clobbering a real one to run a test
   * would be a worse failure than not running it — so a checkout that has one
   * skips, which is the case in a working clone and not the case in CI.
   */
  it('test_UAT_FC_BUG-59_the_service_address_defaults_to_platform_admins', async () => {
    const devVars = path.join(REPO, 'apps', 'control-app', '.dev.vars')
    if (fs.existsSync(devVars)) {
      expect(fs.readFileSync(path.join(REPO, 'bin', 'access-sim'), 'utf8')).toContain(
        'PLATFORM_ADMINS',
      )
      return
    }

    const seeded = 'break-glass@example.com'
    fs.writeFileSync(devVars, `PLATFORM_ADMINS = "${seeded}, second@example.com"\n`)
    const simPort = await freePort()
    const builderPort = await freePort()
    const stub = startStubBuilder(builderPort)
    const defaulted = spawn(
      process.execPath,
      [SIM, '--port', String(simPort), '--aud', AUD, '--builder', `http://127.0.0.1:${builderPort}`],
      { stdio: 'ignore' },
    )
    try {
      const at = `http://127.0.0.1:${simPort}`
      await waitForCerts(`${at}/cdn-cgi/access/certs`)
      seen = []
      resetJwksCache()
      await fetch(`${at}/api/sites`, {
        headers: {
          'CF-Access-Client-Id': 'local-dev.access',
          'CF-Access-Client-Secret': 'local-dev-secret',
        },
      })

      expect(seen).toHaveLength(1)
      const result = await verifyAccessJwt({
        token: String(seen[0].headers['cf-access-jwt-assertion']),
        teamDomain: at,
        aud: AUD,
      })
      expect(result.ok, JSON.stringify(result)).toBe(true)
      if (!result.ok) return
      // The token itself still says only which NAME it is — the address is in the
      // mapping, which is where the Worker reads it from.
      expect(result.claims.email).toBeUndefined()
      const { stdout } = await promisify(execFile)(process.execPath, [SIM, '--print-env'])
      // The FIRST address, not the list: `PLATFORM_ADMINS` is comma-separated and
      // an identity is one person.
      expect(stdout).toMatch(new RegExp(`^SERVICE_TOKEN_IDENTITIES="[^="]+=${seeded}"$`, 'm'))
    } finally {
      defaulted.kill()
      stub.close()
      fs.rmSync(devVars, { force: true })
    }
  }, 30_000)
})
