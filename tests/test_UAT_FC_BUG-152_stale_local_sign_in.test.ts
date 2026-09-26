import { afterEach, describe, expect, it } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  accessSimSignInUrl,
  guardAccess,
  isAccessSimKid,
  resetJwksCache,
} from '../apps/control-app/src/access'

/**
 * [[BUG-152]] §2 — **a stale Access cookie reads as a stale sign-in, not a broken
 * key configuration.**
 *
 * `bin/access-sim` generates a fresh RSA keypair PER PROCESS and names it
 * `local-dev-<pid>` ([[REQ-192]]), deliberately, so that `access.ts` treats a
 * restart as a key rotation and force-refreshes its JWKS cache on an unseen `kid`.
 * That works for the NEXT cookie. The cookie already in the browser was minted with
 * `Max-Age` of thirty days, so the credential outlives its signing key by design —
 * and every `bin/dev up` or `bin/dev restart access-sim` therefore guaranteed
 *
 *     Cloudflare Access rejected this request: no Access signing key matches kid 'local-dev-88241'
 *
 * for anyone who had signed in. That sentence reads as a misconfigured Access team,
 * a missing JWKS or a wrong `.dev.vars`, none of which it is: the operator's actual
 * state is "your cookie was signed by a process that no longer exists" and the
 * repair is one click at the simulator's `/login`.
 *
 * WHAT MAKES IT EVIDENCE. The restart is performed, not described. A real simulator
 * is spawned, signed into over loopback, killed, and a SECOND real simulator is
 * started on the same port — so the token under test is a real cookie really signed
 * by a keypair that really no longer exists, and the JWKS really is a different
 * one. Nothing about the scenario is constructed.
 *
 * AND THE DEPLOYED PATH IS HELD TO THE OPPOSITE. Two legs pin the shape gate from
 * both sides: a `kid` that is not the simulator's keeps the original message even
 * when the simulator is live, and a simulator-shaped `kid` against a Cloudflare
 * JWKS keeps it too. Cloudflare's own kids are hex digests and cannot take this
 * shape, so there is no deployment in which the reassuring sentence is reachable.
 * The only stub in this file is `fetch` in that last leg, which is the one true
 * external boundary here — Cloudflare's own certs endpoint.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIM = path.join(REPO, 'bin', 'access-sim')
const AUD = 'bug152-local-aud'
const WHO = 'operator@example.com'

const sims: ChildProcess[] = []

afterEach(() => {
  for (const sim of sims.splice(0)) {
    try {
      sim.kill('SIGKILL')
    } catch {
      /* already gone */
    }
  }
  resetJwksCache()
})

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

/** Start a simulator and wait for its JWKS to answer. Returns the kid it publishes. */
async function startSim(port: number): Promise<string> {
  const sim = spawn(process.execPath, [SIM, '--port', String(port), '--aud', AUD], {
    stdio: 'ignore',
  })
  sims.push(sim)
  const url = `http://127.0.0.1:${port}/cdn-cgi/access/certs`
  for (let i = 0; i < 100; i += 1) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const body = (await res.json()) as { keys: { kid: string }[] }
        return body.keys[0].kid
      }
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`access-sim did not answer ${url}`)
}

/** Sign in and return the `CF_Authorization` cookie the simulator set. */
async function signIn(origin: string): Promise<string> {
  const res = await fetch(`${origin}/login?email=${encodeURIComponent(WHO)}`, {
    redirect: 'manual',
  })
  const setCookie = res.headers.get('set-cookie') ?? ''
  const token = /CF_Authorization=([^;]+)/.exec(setCookie)?.[1]
  if (token === undefined) throw new Error(`no cookie in ${setCookie}`)
  return token
}

/** The `kid` a token's own header names. */
function kidOf(token: string): string {
  const header = JSON.parse(
    Buffer.from(token.split('.')[0], 'base64url').toString('utf8'),
  ) as { kid: string }
  return header.kid
}

function requestWith(token: string): Request {
  return new Request('http://127.0.0.1:8789/', { headers: { cookie: `CF_Authorization=${token}` } })
}

async function refusal(token: string, origin: string, fetchImpl?: typeof fetch): Promise<string> {
  const outcome = await guardAccess(
    requestWith(token),
    { ACCESS_TEAM_DOMAIN: origin, ACCESS_AUD: AUD },
    fetchImpl === undefined ? {} : { fetch: fetchImpl },
  )
  expect(outcome.ok).toBe(false)
  if (outcome.ok) throw new Error('unreachable')
  expect(outcome.response.status).toBe(401)
  return outcome.response.text()
}

describe('a cookie the simulator can no longer verify reports as an expired sign-in', () => {
  it('test_UAT_FC_BUG-152_restarted_simulator_names_the_sign_in_url', async () => {
    const port = await freePort()
    const origin = `http://127.0.0.1:${port}`

    const firstKid = await startSim(port)
    const stale = await signIn(origin)
    expect(kidOf(stale)).toBe(firstKid)

    // THE RESTART, FOR REAL. `bin/dev restart access-sim` is this: the process that
    // holds the only copy of the signing key goes away, and a new one takes the
    // port. The cookie in the browser does not notice.
    sims.splice(0)[0].kill('SIGKILL')
    resetJwksCache()
    const secondKid = await startSim(port)
    expect(secondKid).not.toBe(firstKid)

    const body = await refusal(stale, origin)
    // WHAT THE OPERATOR NOW READS: what happened, and what to do about it.
    expect(body).toContain('this local sign-in has expired')
    expect(body).toContain(accessSimSignInUrl(origin))
    expect(accessSimSignInUrl(origin)).toBe(`${origin}/login`)
    // And NOT the sentence that sent them looking at their Access configuration.
    expect(body).not.toContain('no Access signing key matches')

    // THE WORKING PATH IS UNCHANGED — a cookie from the live simulator still
    // verifies, so this is a better diagnosis and not a new refusal.
    const fresh = await signIn(origin)
    const ok = await guardAccess(requestWith(fresh), {
      ACCESS_TEAM_DOMAIN: origin,
      ACCESS_AUD: AUD,
    })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.email).toBe(WHO)
  })

  it('test_UAT_FC_BUG-152_a_kid_that_is_not_the_simulators_keeps_the_key_message', async () => {
    // A `kid` OF ANOTHER SHAPE IS GENUINELY A CONFIGURATION QUESTION, and is still
    // reported as one even with the simulator live and publishing. The shape is the
    // whole discriminator, so it is asserted from this side too.
    const port = await freePort()
    const origin = `http://127.0.0.1:${port}`
    await startSim(port)
    const token = await signIn(origin)

    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'f00dbabe0123456789abcdef' }),
    ).toString('base64url')
    const [, payload, signature] = token.split('.')

    const body = await refusal(`${header}.${payload}.${signature}`, origin)
    expect(body).toContain("no Access signing key matches kid 'f00dbabe0123456789abcdef'")
    expect(body).not.toContain('sign-in has expired')
    expect(isAccessSimKid('f00dbabe0123456789abcdef')).toBe(false)
  })

  it('test_UAT_FC_BUG-152_a_cloudflare_jwks_never_reports_an_expired_local_sign_in', async () => {
    // THE DEPLOYED PATH MUST NOT LEARN TO BE REASSURING ABOUT A REAL KEY MISMATCH.
    // Both sides have to say simulator: even a token whose `kid` takes the
    // simulator's shape gets the original message when the team domain's JWKS is
    // Cloudflare's. `fetch` is stubbed here and nowhere else in this file — the
    // certs endpoint of a team that does not exist is the one thing that cannot be
    // run locally.
    const port = await freePort()
    const origin = `http://127.0.0.1:${port}`
    await startSim(port)
    const token = await signIn(origin)
    const simKid = kidOf(token)
    expect(isAccessSimKid(simKid)).toBe(true)

    const cloudflare = 'https://team.cloudflareaccess.com'
    const stub = (async () =>
      new Response(JSON.stringify({ keys: [{ kty: 'RSA', kid: 'a'.repeat(64), alg: 'RS256' }] }), {
        headers: { 'content-type': 'application/json' },
      })) as unknown as typeof fetch

    resetJwksCache()
    const body = await refusal(token, cloudflare, stub)
    expect(body).toContain(`no Access signing key matches kid '${simKid}'`)
    expect(body).not.toContain('sign-in has expired')
    expect(body).not.toContain('/login')
  })
})
