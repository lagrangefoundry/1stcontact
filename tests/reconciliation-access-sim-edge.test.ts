import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { execFile, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { resetJwksCache, verifyAccessJwt } from '../apps/control-app/src/access'

/**
 * Story story-5b5be809 — `bin/access-sim` as the local Cloudflare Access EDGE
 * (BUG-59 part two, REQ-204 revision), driven as a real spawned process.
 *
 * The only thing stubbed is the origin being protected: a loopback HTTP server
 * standing in for `wrangler dev`, which records every request it is given. The
 * simulator, its keys, its proxy and the product's own `verifyAccessJwt` are all
 * real.
 *
 * The one test that needs a particular `.dev.vars` / `wrangler.toml` runs a
 * byte-for-byte COPY of `bin/access-sim` placed in a temporary repository shape,
 * because the script resolves `apps/control-app` relative to itself. That keeps a
 * developer's real `.dev.vars` untouched and keeps this file from racing any
 * other suite that reads the checkout's configuration.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SIM = path.join(REPO, 'bin', 'access-sim')
const AUD = 'story-5b5be809-edge-aud'
const CLIENT_ID = 'edge-uat.access'
const CLIENT_SECRET = 'edge-uat-secret'
const SERVICE_NAME = 'edge-uat'
const SERVICE_EMAIL = 'operator@example.test'

interface Seen {
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
  body: string
}

interface Running {
  proc: ChildProcess
  origin: string
}

let work = ''
let seen: Seen[] = []
let builder: http.Server | undefined
let builderOrigin = ''
let sim: Running
const procs: ChildProcess[] = []

/** The simulator's settings with every override the env could leak removed. */
function cleanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const name of ['SIM_PORT', 'SIM_AUD', 'SIM_BUILDER', 'SIM_CLIENT_ID', 'SIM_CLIENT_SECRET', 'SIM_SERVICE_EMAIL']) {
    delete env[name]
  }
  return env
}

const run = promisify(execFile)

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

function portIsClosed(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect(port, '127.0.0.1')
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}

async function startSim(args: string[], script = SIM): Promise<Running> {
  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  const proc = spawn(process.execPath, [script, '--port', String(port), '--aud', AUD, ...args], {
    env: cleanEnv(),
    stdio: 'ignore',
  })
  procs.push(proc)
  for (let i = 0; i < 100; i += 1) {
    try {
      if ((await fetch(`${origin}/cdn-cgi/access/certs`)).ok) return { proc, origin }
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 100))
  }
  proc.kill()
  throw new Error('access-sim did not start')
}

/**
 * The origin behind the gate. It records what it was given and answers in ways
 * the caller can tell apart: a redirect it must not have followed for it, two
 * cookies, and an echo with a non-200 status.
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
        if ((req.url ?? '').startsWith('/go-elsewhere')) {
          res.writeHead(303, { location: '/somewhere-else' })
          return res.end()
        }
        res.writeHead(201, {
          'content-type': 'application/json',
          'set-cookie': ['first=1; Path=/', 'second=2; Path=/; HttpOnly'],
        })
        res.end(JSON.stringify({ echoed: req.url }))
      })
    })
    .listen(port, '127.0.0.1')
}

function pair(id = CLIENT_ID, secret = CLIENT_SECRET): Record<string, string> {
  return { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret }
}

beforeAll(async () => {
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'access-sim-edge-uat-'))
  const builderPort = await freePort()
  builderOrigin = `http://127.0.0.1:${builderPort}`
  builder = startStubBuilder(builderPort)
  sim = await startSim([
    '--builder', builderOrigin,
    '--client-id', CLIENT_ID,
    '--client-secret', CLIENT_SECRET,
    '--service-email', SERVICE_EMAIL,
  ])
}, 30_000)

afterAll(() => {
  for (const proc of procs) proc.kill()
  builder?.close()
  if (work) fs.rmSync(work, { recursive: true, force: true })
})

describe('story-5b5be809 — bin/access-sim configuration output', () => {
  it('test_UAT_AC2317_print_env_emits_the_access_settings_and_the_identity_mapping', async () => {
    // Defaults: port 8799, aud local-dev-aud, name local-dev.
    const defaults = await run(process.execPath, [SIM, '--print-env', '--service-email', SERVICE_EMAIL], {
      env: cleanEnv(),
    })
    expect(defaults.stdout).toBe(
      'ACCESS_TEAM_DOMAIN="http://127.0.0.1:8799"\n' +
        'ACCESS_AUD="local-dev-aud"\n' +
        `SERVICE_TOKEN_IDENTITIES="local-dev=${SERVICE_EMAIL}"\n`,
    )

    // Every flag followed; exactly three lines; no listener left behind.
    const port = await freePort()
    const custom = await run(
      process.execPath,
      [SIM, '--print-env', '--port', String(port), '--aud', 'other-aud', '--client-id', 'robot.access', '--service-email', 'robot@example.test'],
      { env: cleanEnv() },
    )
    expect(custom.stdout.trimEnd().split('\n')).toEqual([
      `ACCESS_TEAM_DOMAIN="http://127.0.0.1:${port}"`,
      'ACCESS_AUD="other-aud"',
      'SERVICE_TOKEN_IDENTITIES="robot=robot@example.test"',
    ])
    expect(await portIsClosed(port)).toBe(true)

    // With no --service-email: the first PLATFORM_ADMINS entry, `.dev.vars`
    // ahead of `wrangler.toml`. Run against a copy of the script in a temporary
    // repository shape so the checkout's own configuration is never touched.
    const fakeRepo = path.join(work, 'repo')
    const fakeApp = path.join(fakeRepo, 'apps', 'control-app')
    fs.mkdirSync(path.join(fakeRepo, 'bin'), { recursive: true })
    fs.mkdirSync(fakeApp, { recursive: true })
    const copied = path.join(fakeRepo, 'bin', 'access-sim')
    fs.copyFileSync(SIM, copied)
    fs.writeFileSync(
      path.join(fakeApp, 'wrangler.toml'),
      '# PLATFORM_ADMINS = "prose@example.test"\n[vars]\nPLATFORM_ADMINS = "toml-first@example.test, toml-second@example.test"\n',
    )
    const tomlOnly = await run(process.execPath, [copied, '--print-env'], { env: cleanEnv() })
    expect(tomlOnly.stdout).toMatch(/^SERVICE_TOKEN_IDENTITIES="local-dev=toml-first@example\.test"$/m)

    fs.writeFileSync(path.join(fakeApp, '.dev.vars'), 'PLATFORM_ADMINS = "vars-first@example.test, vars-second@example.test"\n')
    const withDevVars = await run(process.execPath, [copied, '--print-env'], { env: cleanEnv() })
    expect(withDevVars.stdout).toMatch(/^SERVICE_TOKEN_IDENTITIES="local-dev=vars-first@example\.test"$/m)
    expect(withDevVars.stdout.trimEnd().split('\n')).toHaveLength(3)
  })

  it('test_UAT_AC2318_both_minted_token_shapes_pass_the_real_verifier', async () => {
    // Person token from /mint.
    resetJwksCache()
    const minted = await fetch(`${sim.origin}/mint?email=alice@plumbing.example`)
    expect(minted.status).toBe(200)
    const personToken = (await minted.text()).trim()
    const person = await verifyAccessJwt({ token: personToken, teamDomain: sim.origin, aud: AUD })
    expect(person.ok, JSON.stringify(person)).toBe(true)
    if (!person.ok) return
    expect(person.claims.email).toBe('alice@plumbing.example')
    expect(person.identity).toBe('alice@plumbing.example')
    const thirtyDays = 30 * 24 * 60 * 60
    expect(Math.abs(person.claims.exp - Math.floor(Date.now() / 1000) - thirtyDays)).toBeLessThan(120)

    expect((await fetch(`${sim.origin}/mint`)).status).toBe(400)

    // Service token: the assertion the exchange forwards.
    seen = []
    await fetch(`${sim.origin}/api/sites`, { headers: pair() })
    expect(seen).toHaveLength(1)
    const assertion = String(seen[0].headers['cf-access-jwt-assertion'])
    const service = await verifyAccessJwt({ token: assertion, teamDomain: sim.origin, aud: AUD })
    expect(service.ok, JSON.stringify(service)).toBe(true)
    if (!service.ok) return
    expect(service.claims.common_name).toBe(SERVICE_NAME)
    expect(service.claims.email).toBeUndefined()
    expect('email' in service.claims).toBe(false)
    expect(service.identity).toBe(`service-token:${SERVICE_NAME}`)
  })
})

describe('story-5b5be809 — bin/access-sim as the edge', () => {
  it('test_UAT_AC2361_a_matching_pair_is_exchanged_and_forwarded_as_the_edge_forwards_it', async () => {
    // A POST with a body, a query string and the matching pair.
    seen = []
    resetJwksCache()
    const body = JSON.stringify({ slug: 'xgd', pages: [{ name: 'home.json' }] })
    const res = await fetch(`${sim.origin}/api/import?dry=1&x=y`, {
      method: 'POST',
      headers: { ...pair(), 'content-type': 'application/json' },
      body,
      redirect: 'manual',
    })

    expect(seen).toHaveLength(1)
    const got = seen[0]
    expect(got.method).toBe('POST')
    expect(got.url).toBe('/api/import?dry=1&x=y')
    expect(got.body).toBe(body)
    expect(got.headers['cf-access-client-id']).toBeUndefined()
    expect(got.headers['cf-access-client-secret']).toBeUndefined()
    const verified = await verifyAccessJwt({
      token: String(got.headers['cf-access-jwt-assertion']),
      teamDomain: sim.origin,
      aud: AUD,
    })
    expect(verified.ok, JSON.stringify(verified)).toBe(true)
    if (verified.ok) expect(verified.identity).toBe(`service-token:${SERVICE_NAME}`)

    // The builder's answer comes back: status, body, both Set-Cookie headers.
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ echoed: '/api/import?dry=1&x=y' })
    expect(res.headers.getSetCookie()).toEqual(['first=1; Path=/', 'second=2; Path=/; HttpOnly'])

    // The builder's redirects are the caller's, not followed by the simulator.
    seen = []
    const redirected = await fetch(`${sim.origin}/go-elsewhere`, { headers: pair(), redirect: 'manual' })
    expect(redirected.status).toBe(303)
    expect(redirected.headers.get('location')).toBe('/somewhere-else')
    expect(seen.map((s) => s.url)).toEqual(['/go-elsewhere'])

    // --print-token: both halves, as export lines, exits without serving.
    const tokenPort = await freePort()
    const printed = await run(
      process.execPath,
      [SIM, '--print-token', '--port', String(tokenPort), '--client-id', CLIENT_ID, '--client-secret', CLIENT_SECRET],
      { env: cleanEnv() },
    )
    expect(printed.stdout).toBe(
      `export CF_ACCESS_CLIENT_ID='${CLIENT_ID}'\nexport CF_ACCESS_CLIENT_SECRET='${CLIENT_SECRET}'\n`,
    )
    expect(await portIsClosed(tokenPort)).toBe(true)
    const defaults = await run(process.execPath, [SIM, '--print-token'], { env: cleanEnv() })
    expect(defaults.stdout).toBe(
      "export CF_ACCESS_CLIENT_ID='local-dev.access'\nexport CF_ACCESS_CLIENT_SECRET='local-dev-secret'\n",
    )

    // The default pair is the one a default simulator exchanges.
    const defaultSim = await startSim(['--builder', builderOrigin, '--service-email', SERVICE_EMAIL])
    seen = []
    resetJwksCache()
    const viaDefault = await fetch(`${defaultSim.origin}/api/sites`, {
      headers: pair('local-dev.access', 'local-dev-secret'),
    })
    expect(viaDefault.status).toBe(201)
    expect(seen).toHaveLength(1)
    const defaultVerified = await verifyAccessJwt({
      token: String(seen[0].headers['cf-access-jwt-assertion']),
      teamDomain: defaultSim.origin,
      aud: AUD,
    })
    expect(defaultVerified.ok).toBe(true)
    if (defaultVerified.ok) expect(defaultVerified.identity).toBe('service-token:local-dev')

    // A right pair with nobody to act as: 403 naming both remedies, nothing forwarded.
    const nobody = await startSim(['--builder', builderOrigin, '--service-email', ''])
    seen = []
    const refused = await fetch(`${nobody.origin}/api/sites`, {
      headers: pair('local-dev.access', 'local-dev-secret'),
      redirect: 'manual',
    })
    expect(refused.status).toBe(403)
    const guidance = await refused.text()
    expect(guidance).toContain('PLATFORM_ADMINS')
    expect(guidance).toContain('--service-email')
    expect(seen).toHaveLength(0)

    // A builder that does not answer: 502 naming it.
    const deadOrigin = `http://127.0.0.1:${await freePort()}`
    const orphan = await startSim(['--builder', deadOrigin, '--service-email', SERVICE_EMAIL])
    const unanswered = await fetch(`${orphan.origin}/api/sites`, {
      headers: pair('local-dev.access', 'local-dev-secret'),
      redirect: 'manual',
    })
    expect(unanswered.status).toBe(502)
    expect(await unanswered.text()).toContain(deadOrigin)
  }, 60_000)

  it('test_UAT_AC2362_bad_credentials_never_reach_the_builder_and_cookies_pass_untouched', async () => {
    // Wrong pair: 403 pointing at --print-token, builder sees nothing.
    seen = []
    const wrong = await fetch(`${sim.origin}/api/sites`, {
      headers: pair(CLIENT_ID, 'not-the-secret'),
      redirect: 'manual',
    })
    expect(wrong.status).toBe(403)
    expect(await wrong.text()).toContain('--print-token')
    const wrongId = await fetch(`${sim.origin}/api/sites`, {
      headers: pair('someone-else.access', CLIENT_SECRET),
      redirect: 'manual',
    })
    expect(wrongId.status).toBe(403)
    expect(seen).toHaveLength(0)

    // Half a pair is no pair: either half alone gets the no-credential answer.
    for (const half of [{ 'CF-Access-Client-Id': CLIENT_ID }, { 'CF-Access-Client-Secret': CLIENT_SECRET }]) {
      const res = await fetch(`${sim.origin}/api/sites`, { headers: half, redirect: 'manual' })
      expect(res.status, JSON.stringify(half)).toBe(302)
      expect(res.headers.get('location')).toBe(`${sim.origin}/login`)
    }
    expect(seen).toHaveLength(0)

    // No credential at all: 302 to /login, builder sees nothing.
    const bare = await fetch(`${sim.origin}/dashboard`, { redirect: 'manual' })
    expect(bare.status).toBe(302)
    expect(bare.headers.get('location')).toBe(`${sim.origin}/login`)
    expect(seen).toHaveLength(0)

    // Cookie: forwarded byte-for-byte, no assertion added.
    const token = (await (await fetch(`${sim.origin}/mint?email=bob@example.com`)).text()).trim()
    const cookie = `theme=dark; CF_Authorization=${token}; other=1`
    const withCookie = await fetch(`${sim.origin}/api/sites`, { headers: { cookie } })
    expect(withCookie.status).toBe(201)
    expect(seen).toHaveLength(1)
    expect(seen[0].headers.cookie).toBe(cookie)
    expect(seen[0].headers['cf-access-jwt-assertion']).toBeUndefined()

    // Half a pair plus a cookie is handled exactly as the cookie alone.
    seen = []
    await fetch(`${sim.origin}/api/sites`, { headers: { cookie, 'CF-Access-Client-Id': CLIENT_ID } })
    expect(seen).toHaveLength(1)
    expect(seen[0].headers.cookie).toBe(cookie)
    expect(seen[0].headers['cf-access-jwt-assertion']).toBeUndefined()

    // The simulator's own paths are answered by it and never forwarded.
    seen = []
    const certs = await fetch(`${sim.origin}/cdn-cgi/access/certs`)
    expect(certs.status).toBe(200)
    expect(((await certs.json()) as { keys: unknown[] }).keys).toHaveLength(1)
    const login = await fetch(`${sim.origin}/login?email=bob@example.com`, { redirect: 'manual' })
    expect(login.status).toBe(302)
    expect(login.headers.get('set-cookie')).toMatch(/^CF_Authorization=/)
    expect((await fetch(`${sim.origin}/mint?email=bob@example.com`)).status).toBe(200)
    expect((await fetch(`${sim.origin}/cdn-cgi/access/logout`, { redirect: 'manual' })).status).toBe(302)
    expect(seen).toHaveLength(0)
  }, 60_000)

  it('test_UAT_AC2363_logout_clears_the_login_cookie_and_returns_only_to_the_builder', async () => {
    // Sign in through /login first, and note the cookie's name and path.
    const signIn = await fetch(`${sim.origin}/login?email=alice@plumbing.example`, { redirect: 'manual' })
    const set = signIn.headers.get('set-cookie') ?? ''
    expect(set).toMatch(/^CF_Authorization=[^;]+;/)
    expect(set).toContain('Path=/')

    seen = []
    const back = `${builderOrigin}/sign-in`
    const out = await fetch(`${sim.origin}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(back)}`, {
      headers: { cookie: set.split(';')[0] },
      redirect: 'manual',
    })
    expect(out.status).toBe(302)
    expect(out.headers.get('set-cookie')).toBe('CF_Authorization=; Path=/; Max-Age=0')
    expect(out.headers.get('location')).toBe(back)

    // Anything not on the fronted builder's origin falls back to the builder,
    // and the cookie is cleared regardless of credential.
    for (const asked of [undefined, 'https://evil.example/take-them-here', 'not-a-url-at-all', `${sim.origin}/login`]) {
      const query = asked === undefined ? '' : `?returnTo=${encodeURIComponent(asked)}`
      const res = await fetch(`${sim.origin}/cdn-cgi/access/logout${query}`, { redirect: 'manual' })
      expect(res.status, String(asked)).toBe(302)
      expect(res.headers.get('location'), String(asked)).toBe(builderOrigin)
      expect(res.headers.get('set-cookie'), String(asked)).toBe('CF_Authorization=; Path=/; Max-Age=0')
    }

    // Never forwarded to the builder.
    expect(seen).toHaveLength(0)
  })
})
