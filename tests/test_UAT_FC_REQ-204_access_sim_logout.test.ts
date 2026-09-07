import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * REQ-204 — **the edge's half of signing out, locally**.
 *
 * WHY THIS IS A TEST AND NOT A LINE IN THE SCRIPT'S HEADER. `POST /sign-out`
 * sends a caller holding an Access credential to
 * `<team-domain>/cdn-cgi/access/logout`, because our Worker can end a session
 * row and a cookie it minted and can do nothing about a credential the EDGE
 * issued. In a deployment the team domain is Cloudflare's and that route is
 * Cloudflare's to serve. In local dev the team domain is `bin/access-sim` — the
 * same substitution `certsUrl` already rests on ([[REQ-192]]) — so without this
 * route the operator loop the ticket exists for cannot be run on the machine it
 * is used on: the builder would offer a Sign out that led nowhere.
 *
 * WHAT MAKES IT EVIDENCE. A real simulator process is spawned and driven over
 * loopback, exactly as [[REQ-192]]'s suite drives it. The cookie cleared is the
 * cookie `/login` actually set.
 *
 * AND THE `returnTo` IT WILL NOT HONOUR IS ASSERTED TOO. The parameter arrives
 * from the Worker, which builds it from its own request's origin — but this is
 * an open port on a developer's laptop, and a logout that redirected wherever a
 * query string named would be a redirector anybody on the machine could aim.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIM = path.join(REPO, 'bin', 'access-sim')
const AUD = 'req204-local-aud'

let sim: ChildProcess | undefined
let origin = ''
let builder = ''

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
      if ((await fetch(url)).ok) return
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error(`access-sim did not answer ${url}`)
}

/** Sign in the way the operator does, and come back with what the browser holds. */
async function aBrowserWithAnEdgeSession(): Promise<string> {
  const response = await fetch(`${origin}/login?email=felix@example.test`, { redirect: 'manual' })
  const cookie = response.headers.get('set-cookie') ?? ''
  expect(cookie, '/login set no cookie').toContain('CF_Authorization=')
  return cookie.split(';')[0]
}

beforeAll(async () => {
  const port = await freePort()
  origin = `http://127.0.0.1:${port}`
  // A builder origin that is not this process, so "came back to the builder" and
  // "stayed here" are distinguishable. Nothing is started on it: the two cases
  // below read the redirect rather than follow it.
  builder = `http://127.0.0.1:${await freePort()}`
  sim = spawn(process.execPath, [SIM, '--port', String(port), '--aud', AUD, '--builder', builder], {
    stdio: 'ignore',
  })
  await waitForCerts(`${origin}/cdn-cgi/access/certs`)
}, 30_000)

afterAll(() => {
  sim?.kill()
})

describe('REQ-204 — bin/access-sim ends the session it issued', () => {
  it('test_UAT_FC_REQ-204_the_simulator_clears_the_cookie_it_set_and_comes_back', async () => {
    await aBrowserWithAnEdgeSession()

    const out = await fetch(
      `${origin}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(`${builder}/sign-in`)}`,
      { redirect: 'manual' },
    )

    expect(out.status).toBe(302)
    const cleared = out.headers.get('set-cookie') ?? ''
    expect(cleared).toContain('CF_Authorization=;')
    // `Max-Age=0` on the same `Path` the cookie was set with. A clear whose
    // attributes do not match the original leaves the original in place, which
    // is a logout that returns 302 and signs nobody out.
    expect(cleared).toContain('Max-Age=0')
    expect(cleared).toContain('Path=/')
    expect(out.headers.get('location')).toBe(`${builder}/sign-in`)
  })

  it('test_UAT_FC_REQ-204_the_simulator_refuses_to_be_aimed_somewhere_else', async () => {
    // Anything that is not the builder this simulator fronts falls back to it —
    // and the cookie is cleared either way, because refusing the destination is
    // not a reason to refuse the logout.
    for (const asked of ['https://evil.example/take-them-here', 'not-a-url-at-all']) {
      const out = await fetch(
        `${origin}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(asked)}`,
        { redirect: 'manual' },
      )

      expect(out.headers.get('location'), asked).toBe(builder)
      expect(out.headers.get('set-cookie') ?? '', asked).toContain('Max-Age=0')
    }
  })
})
