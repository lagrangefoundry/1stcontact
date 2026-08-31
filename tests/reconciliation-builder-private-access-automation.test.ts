/**
 * story-182e8cb9 — **the builder is private**: the automation caller's half.
 *
 * The gate's own refusal and admission behaviour (AC-1375 … AC-1384) is pinned by
 * `reconciliation-builder-private-access-gate.test.ts`. This file owns the other
 * side of the same story: what a granted AUTOMATION identity presents to that
 * gate, what it is told when the gate declines, and how that identity is minted.
 *
 * WHY THAT BELONGS TO THIS STORY. A gate that admits a service identity nobody
 * can produce a credential for is shut to everyone, which is the state this
 * surface was in: `pushSite` sent the gateway's own forwarded assertion header as
 * though it were an inbound credential, so every call to the deployed builder was
 * bounced to the sign-in page — and, because the bounce was followed, the
 * operator met a `JSON.parse` error about a document type rather than an
 * authentication refusal.
 *
 * BOUNDARIES. Nothing here reaches into a helper: the push claims are driven
 * through `pushSite` and through the real `1c` entry point (`run`), the operator
 * scripts are driven as the processes an operator actually types, and the policy
 * record is read as the file an operator actually opens. The only stub is
 * `fetch` — the network, which is not this repository's to own — and it is a
 * RECORDER, so "the pair went out and the assertion header did not" is an
 * observation of the request that was made rather than of the code that made it.
 *
 * OUT OF SCOPE, deliberately: what the import behind the gate then does with the
 * site (the store's copy path), and that the pair is in fact admitted by a live
 * Access edge — that needs a deploy and was confirmed empirically by the
 * operator, not from this repository.
 */
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cmdNew, run } from '../tools/generate/src/cli'
import { pushSite } from '../tools/generate/src/cli/push'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'

const REPO = path.resolve(import.meta.dirname, '..')
const CONTROL_APP = path.join(REPO, 'apps', 'control-app')

/** A deployment behind the gate, and one that is not. */
const GATED_ORIGIN = 'https://app.1stcontact.io'
const UNGATED_ORIGIN = 'http://127.0.0.1:9'

const CLIENT_ID = 'uat-automation.access'
const CLIENT_SECRET = 'uat-secret-value'

/** What the import route answers when a push is admitted and lands. */
const LANDED = '{"pages":1,"assets":0,"siteJson":true}'

/** A store holding one trivial site — all a push needs in order to have content. */
function storeWithSite(slug = 'xgd') {
  const store = memorySiteStore()
  store.seed(slug, { siteJson: { name: slug }, pages: { index: { kind: 'page' } } })
  return store
}

interface RecordedCall {
  url: string
  init: RequestInit
}

/**
 * A `fetch` that RECORDS the request and answers with `response`.
 *
 * Recording rather than asserting inline is what makes the negative claims
 * checkable: "no assertion header under any casing" and "no request was made at
 * all" are both statements about this list.
 */
function recordingFetch(response: { status: number; body: string }) {
  const calls: RecordedCall[] = []
  const impl = ((url: string, init: RequestInit) => {
    calls.push({ url, init })
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      text: () => Promise.resolve(response.body),
    })
  }) as unknown as typeof fetch
  return { impl, calls }
}

/** Header names as they went out, lower-cased, so casing cannot hide one. */
const headerNames = (init: RequestInit): string[] =>
  Object.keys(init.headers as Record<string, string>).map((name) => name.toLowerCase())

const headerValue = (init: RequestInit, name: string): string | undefined => {
  const headers = init.headers as Record<string, string>
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
  return key === undefined ? undefined : headers[key]
}

/**
 * The real `1c` entry point, driven the way a shell drives it: a working
 * directory on the process, and the environment as the ordinary source of the
 * credential. Console output is captured so a passing push does not print.
 */
async function cli(cwd: string, ...argv: string[]): Promise<void> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  process.chdir(cwd)
  console.log = () => {}
  try {
    await run(argv)
  } finally {
    console.log = prevLog
    process.chdir(prevCwd)
  }
}

/** The environment an operator's shell would hold, minus any real credential. */
function shellEnv(overrides: Record<string, string> = {}): Record<string, string | undefined> {
  const env = { ...process.env }
  delete env.CF_ACCESS_CLIENT_ID
  delete env.CF_ACCESS_CLIENT_SECRET
  delete env.CLOUDFLARE_API_TOKEN
  return { ...env, ...overrides }
}

/** Run an operator script as the process it is, not as a module. */
function script(
  file: string,
  args: string[],
  options: { env?: Record<string, string>; timeout?: number } = {},
) {
  const result = spawnSync(path.join(REPO, 'bin', file), args, {
    cwd: REPO,
    encoding: 'utf8',
    timeout: options.timeout ?? 15000,
    killSignal: 'SIGKILL',
    env: shellEnv(options.env),
  })
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac1450-'))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  rmSync(cwd, { recursive: true, force: true })
})

/**
 * AC-1450 — an automation caller presents the service-token PAIR, and never the
 * assertion header the gateway forwards inward.
 *
 * The pair is what the edge exchanges for the assertion; the assertion header is
 * the far side's, carrying an identity the gateway has already verified. A client
 * presenting it inbound asserts an identity it has not proved and is refused
 * exactly as one presenting nothing is — so it is not a fallback, not a legacy
 * mode, and is asserted here as absent under ANY casing rather than as absent
 * from one spelling.
 */
it('test_UAT_AC1450_an_automation_caller_presents_the_pair_never_the_forwarded_assertion_header', async () => {
  // ── A credential configured: the pair goes out, with the values supplied. ──
  const gated = recordingFetch({ status: 200, body: LANDED })
  await pushSite(storeWithSite(), 'xgd', {
    origin: GATED_ORIGIN,
    access: { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET },
    fetch: gated.impl,
  })

  expect(gated.calls, 'the push made no request').toHaveLength(1)
  expect(headerValue(gated.calls[0].init, 'CF-Access-Client-Id')).toBe(CLIENT_ID)
  expect(headerValue(gated.calls[0].init, 'CF-Access-Client-Secret')).toBe(CLIENT_SECRET)
  expect(
    headerNames(gated.calls[0].init),
    'the client sent the header the gateway sets on what it forwards',
  ).not.toContain('cf-access-jwt-assertion')

  // ── No credential configured: neither header, and no refusal for want of one. ──
  const local = recordingFetch({ status: 200, body: LANDED })
  const result = await pushSite(storeWithSite(), 'xgd', {
    origin: UNGATED_ORIGIN,
    fetch: local.impl,
  })

  expect(result.landed.pages, 'an uncredentialled push against an ungated origin failed').toBe(1)
  const names = headerNames(local.calls[0].init)
  expect(names, 'a credential header was sent when none was configured').not.toContain(
    'cf-access-client-id',
  )
  expect(names).not.toContain('cf-access-client-secret')
  expect(names).not.toContain('cf-access-jwt-assertion')

  // ── Through the real CLI: the environment is the ordinary path, because a
  //    secret named on a command line lands in shell history; explicit options
  //    override it per invocation. Both are observed on the request that went. ──
  cmdNew('acme', { cwd })

  const fromEnv = recordingFetch({ status: 200, body: LANDED })
  vi.stubGlobal('fetch', fromEnv.impl)
  vi.stubEnv('CF_ACCESS_CLIENT_ID', CLIENT_ID)
  vi.stubEnv('CF_ACCESS_CLIENT_SECRET', CLIENT_SECRET)
  await cli(cwd, 'push', 'acme', '--origin', GATED_ORIGIN)

  expect(headerValue(fromEnv.calls[0].init, 'CF-Access-Client-Id')).toBe(CLIENT_ID)
  expect(headerValue(fromEnv.calls[0].init, 'CF-Access-Client-Secret')).toBe(CLIENT_SECRET)
  expect(headerNames(fromEnv.calls[0].init)).not.toContain('cf-access-jwt-assertion')

  const fromFlags = recordingFetch({ status: 200, body: LANDED })
  vi.stubGlobal('fetch', fromFlags.impl)
  await cli(
    cwd,
    'push',
    'acme',
    '--origin',
    GATED_ORIGIN,
    '--client-id',
    'other.access',
    '--client-secret',
    'other-secret',
  )

  expect(
    headerValue(fromFlags.calls[0].init, 'CF-Access-Client-Id'),
    'the explicit option did not override the environment',
  ).toBe('other.access')
  expect(headerValue(fromFlags.calls[0].init, 'CF-Access-Client-Secret')).toBe('other-secret')
})

/**
 * AC-1451 — half a service token is refused BEFORE any request is sent, and
 * before the first site moves.
 *
 * A service token is a pair; half of one is not a weaker credential, it is a
 * request the edge declines with a message about identity rather than about the
 * half that was missing locally. And a production run that half-succeeded leaves
 * the operator working out which sites moved — so the same refusal guards the
 * publish path ahead of the first push, not per site.
 */
it('test_UAT_AC1451_half_a_service_token_is_refused_before_a_request_and_before_the_first_site_moves', async () => {
  // ── `1c push`: one half by option or by environment, in either combination. ──
  const halves: { what: string; argv: string[]; env: Record<string, string> }[] = [
    { what: 'only the client id, by option', argv: ['--client-id', CLIENT_ID], env: {} },
    { what: 'only the secret, by option', argv: ['--client-secret', CLIENT_SECRET], env: {} },
    { what: 'only the client id, by environment', argv: [], env: { CF_ACCESS_CLIENT_ID: CLIENT_ID } },
    {
      what: 'only the secret, by environment',
      argv: [],
      env: { CF_ACCESS_CLIENT_SECRET: CLIENT_SECRET },
    },
  ]

  for (const half of halves) {
    // A tripwire, not a stub of a collaborator: any outbound request at all is
    // the failure this criterion is about.
    const tripwire = recordingFetch({ status: 200, body: LANDED })
    vi.stubGlobal('fetch', tripwire.impl)
    vi.unstubAllEnvs()
    for (const [name, value] of Object.entries(half.env)) vi.stubEnv(name, value)
    vi.stubEnv('CF_ACCESS_CLIENT_ID', half.env.CF_ACCESS_CLIENT_ID ?? '')
    vi.stubEnv('CF_ACCESS_CLIENT_SECRET', half.env.CF_ACCESS_CLIENT_SECRET ?? '')

    let thrown: unknown
    try {
      await cli(cwd, 'push', 'acme', '--origin', GATED_ORIGIN, ...half.argv)
    } catch (err) {
      thrown = err
    }

    const message = thrown instanceof Error ? thrown.message : String(thrown)
    expect(thrown, `${half.what}: half a credential was accepted`).toBeInstanceOf(Error)
    expect(message, `${half.what}: the refusal does not say the credential is a pair`).toMatch(
      /PAIR/i,
    )
    expect(message, `${half.what}: the refusal does not name both halves`).toContain(
      'CF_ACCESS_CLIENT_ID',
    )
    expect(message).toContain('CF_ACCESS_CLIENT_SECRET')
    expect(message, `${half.what}: the refusal names no way to provision one`).toMatch(
      /bin\/access-token/,
    )
    expect(tripwire.calls, `${half.what}: a request was sent before the refusal`).toEqual([])
  }

  vi.unstubAllGlobals()
  vi.unstubAllEnvs()

  // ── `bin/publish --production`: the same refusal, before the first site moves. ──
  const productionRuns: { what: string; env: Record<string, string> }[] = [
    { what: 'neither half', env: {} },
    { what: 'only the client id', env: { CF_ACCESS_CLIENT_ID: CLIENT_ID } },
    { what: 'only the secret', env: { CF_ACCESS_CLIENT_SECRET: CLIENT_SECRET } },
  ]

  for (const attempt of productionRuns) {
    const result = script('publish', ['--production', 'acme'], { env: attempt.env, timeout: 15000 })

    expect(result.status, `${attempt.what}: the production run was not refused`).toBe(1)
    expect(result.stderr, `${attempt.what}: the refusal does not name both halves`).toContain(
      'CF_ACCESS_CLIENT_ID',
    )
    expect(result.stderr).toContain('CF_ACCESS_CLIENT_SECRET')
    expect(result.stderr, `${attempt.what}: the refusal names neither option`).toMatch(
      /--client-id[\s\S]*--client-secret/,
    )
    expect(result.stderr, `${attempt.what}: the refusal names no provisioning command`).toMatch(
      /bin\/access-token/,
    )
    // Nothing moved: the run never reached the push loop it announces.
    expect(result.stdout, `${attempt.what}: a site was pushed before the refusal`).not.toMatch(
      /Pushing \d+ site/,
    )
  }

  // ── An ungated target is not subject to the refusal: the check is attached to
  //    the gated target, not to publishing. The run gets past the gate and into
  //    the push it announces (and is then killed — where it goes next is the
  //    store's copy path, not this story's). ──
  const ungated = script('publish', ['--origin', UNGATED_ORIGIN, 'acme'], { timeout: 10000 })
  expect(ungated.stdout, 'an ungated run was refused for want of a credential').toMatch(
    new RegExp(`Pushing 1 site\\(s\\) to ${UNGATED_ORIGIN}`),
  )
  expect(ungated.stderr).not.toMatch(/behind Cloudflare Access/)

  // ── No single-value credential remains: it never denoted anything the gateway
  //    accepts, and leaving the name in place is how the defect survived a
  //    written policy record. Deleted, not deprecated. ──
  const publishPath = [
    path.join(REPO, 'bin', 'publish'),
    path.join(REPO, 'tools', 'generate', 'src', 'cli', 'push.ts'),
    path.join(REPO, 'tools', 'generate', 'src', 'cli', 'index.ts'),
  ]
  for (const file of publishPath) {
    const source = readFileSync(file, 'utf8')
    expect(source, `${file} still names a single-value credential`).not.toMatch(/CF_ACCESS_TOKEN/)
    expect(source, `${file} still carries a single-value --token option`).not.toMatch(/--token\b/)
  }
})

/**
 * AC-1452 — a bounce to the sign-in page reads as an AUTHENTICATION REFUSAL,
 * never as success and never as an unreadable transport failure.
 *
 * The bug this pins: followed, the bounce returns a sign-in document with a 200,
 * `res.ok` is true, the refusal branch never runs, and the operator meets a parse
 * error about a doctype. So the redirect is not followed, and both shapes an
 * unfollowed redirect can take — the 3xx itself, and the opaque response a
 * conforming client returns instead — report the same substance.
 */
it('test_UAT_AC1452_a_bounce_to_the_sign_in_page_reads_as_an_authentication_refusal', async () => {
  const refusals = [
    { what: 'a redirect to the sign-in page', status: 302, bounce: true },
    { what: 'another redirect status', status: 303, bounce: true },
    { what: 'an opaque response', status: 0, bounce: true },
    { what: 'an unauthorised caller', status: 401, bounce: false },
    { what: 'a forbidden caller', status: 403, bounce: false },
  ]

  for (const refusal of refusals) {
    const { impl, calls } = recordingFetch({ status: refusal.status, body: '' })
    let thrown: unknown
    try {
      await pushSite(storeWithSite(), 'xgd', { origin: GATED_ORIGIN, fetch: impl })
    } catch (err) {
      thrown = err
    }

    const message = thrown instanceof Error ? thrown.message : String(thrown)
    expect(thrown, `${refusal.what} was not reported as a failure`).toBeInstanceOf(Error)
    // Every refusal names the SAME fix, so the operator reaches the provisioning
    // command from whichever direction they arrived.
    expect(message, `${refusal.what}: the refusal does not name both halves`).toContain(
      'CF_ACCESS_CLIENT_ID',
    )
    expect(message).toContain('CF_ACCESS_CLIENT_SECRET')
    expect(message, `${refusal.what}: the refusal names no provisioning command`).toMatch(
      /bin\/access-token/,
    )
    // The redirect is not followed — the mechanism the whole criterion rests on.
    expect(calls[0].init.redirect, `${refusal.what}: the request follows redirects`).toBe('manual')

    if (refusal.bounce) {
      expect(message, `${refusal.what} does not read as a bounce to a sign-in page`).toMatch(
        /login page/i,
      )
    }
  }

  // The opaque response says the same thing as the 3xx rather than "refused with
  // 0: (no body)" — the two shapes are the same event through two conforming
  // clients, and one of them must not regress into an unreadable failure.
  const opaque = recordingFetch({ status: 0, body: '' })
  const opaqueMessage = await pushSite(storeWithSite(), 'xgd', {
    origin: GATED_ORIGIN,
    fetch: opaque.impl,
  }).then(
    () => 'the push reported success',
    (err: Error) => err.message,
  )
  expect(opaqueMessage, 'an opaque bounce read as success').toMatch(/a redirect to a login page/)
  expect(opaqueMessage, 'an opaque bounce read as a bare status 0').not.toMatch(/refused with 0[:\s]/)

  // A refusal for any OTHER reason reports what it received and invents no
  // credential problem — otherwise every server fault reads as "go and sign in".
  const server = recordingFetch({ status: 500, body: 'the store fell over' })
  const serverMessage = await pushSite(storeWithSite(), 'xgd', {
    origin: GATED_ORIGIN,
    fetch: server.impl,
  }).then(
    () => 'the push reported success',
    (err: Error) => err.message,
  )
  expect(serverMessage, 'a server fault does not report its status').toMatch(/refused with 500/)
  expect(serverMessage, 'a server fault does not report its body').toContain('the store fell over')
  expect(serverMessage, 'a server fault was reported as a credential problem').not.toContain(
    'CF_ACCESS_CLIENT_ID',
  )
})

/**
 * AC-1453 — the automation identity is minted by a documented, operator-run
 * command, and that command persists no secret.
 *
 * DRIVEN, NOT READ. The command is run as the process it is — shebang, executable
 * bit, argv and environment — against a STUB standing where Cloudflare's
 * management API stands. Every provisioning claim in the criterion is a claim
 * about the requests it makes: which account it resolves, which application it
 * matches, the shape of the policy it posts, whether it reads a refusal reported
 * inside a 200 as a refusal, and whether it edits the operator's own rule. None
 * of those can be observed by reading the file — a check that the string
 * `"decision": "non_identity"` appears somewhere in the source passes just as
 * happily when it sits on a branch that never runs, and fails when the same
 * request is built a different way. So the requests are recorded and asserted on.
 *
 * WHY A STUB AND NOT CLOUDFLARE. Provisioning against the real API mints a live
 * credential — the one thing a test may not do. The stub is reached through
 * `CLOUDFLARE_API_BASE`, which is the script's only concession to being tested
 * and grants nothing: setting it requires the same environment access as setting
 * `CLOUDFLARE_API_TOKEN`, which is the thing actually worth having.
 *
 * The policy record beside the control application is read as the file an
 * operator opens, because the record IS the artifact that claim is about.
 */

/** What the stub hands back, and what it saw. */
interface Api {
  base: string
  seen: { method: string; path: string; body: unknown }[]
  close: () => Promise<void>
}

interface ApiState {
  accounts: { id: string; name: string }[]
  apps: { id: string; name: string; domain: string }[]
  tokens: { id: string; name: string; client_id: string }[]
  /** Policies already on an application, by application id. */
  policies: Record<string, { id: string; name: string; include: unknown[] }[]>
  /** A path fragment answered `200 {success:false}` — Cloudflare's own shape. */
  refuse?: string
}

const CREATED_SECRET = 'stub-created-secret'
const ROTATED_SECRET = 'stub-rotated-secret'

/**
 * Cloudflare's management API, reduced to the endpoints this script calls.
 *
 * A real HTTP server rather than a monkey-patched `fetch`: the script is a
 * separate PROCESS, so the only seam between it and the network is the socket.
 */
async function stubApi(state: ApiState): Promise<Api> {
  const seen: Api['seen'] = []
  const ok = (result: unknown) => ({ success: true, errors: [], result })

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      const url = req.url ?? ''
      const body = raw ? (JSON.parse(raw) as unknown) : undefined
      seen.push({ method: req.method ?? 'GET', path: url, body })

      const answer = (payload: unknown, status = 200): void => {
        res.writeHead(status, { 'content-type': 'application/json' })
        res.end(JSON.stringify(payload))
      }

      if (state.refuse && url.includes(state.refuse) && req.method === 'POST') {
        // 200 with `success: false` — "you may not do that", reported inside a
        // successful transport envelope.
        answer({ success: false, errors: [{ message: 'insufficient permissions' }] })
        return
      }

      const app = /\/access\/apps\/([^/]+)\/policies$/.exec(url)
      if (url === '/accounts') return answer(ok(state.accounts))
      if (/\/access\/apps$/.test(url)) return answer(ok(state.apps))
      if (/\/access\/service_tokens$/.test(url) && req.method === 'GET') {
        return answer(ok(state.tokens))
      }
      if (/\/access\/service_tokens$/.test(url) && req.method === 'POST') {
        const name = (body as { name: string }).name
        return answer(
          ok({ id: 'tok-created', name, client_id: 'created.access', client_secret: CREATED_SECRET }),
        )
      }
      const rotate = /\/access\/service_tokens\/([^/]+)\/rotate$/.exec(url)
      if (rotate) {
        return answer(
          ok({ id: rotate[1], client_id: 'rotated.access', client_secret: ROTATED_SECRET }),
        )
      }
      if (app && req.method === 'GET') return answer(ok(state.policies[app[1]] ?? []))
      if (app && req.method === 'POST') return answer(ok({ id: 'pol-created', ...(body as object) }))
      answer({ success: false, errors: [{ message: `no stub route for ${url}` }] }, 404)
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  return {
    base: `http://127.0.0.1:${address.port}`,
    seen,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/** Run an operator script as the process it is, without blocking the loop. */
function scriptAsync(
  file: string,
  args: string[],
  options: { env?: Record<string, string>; cwd?: string } = {},
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(path.join(REPO, 'bin', file), args, {
      cwd: options.cwd ?? REPO,
      env: shellEnv(options.env) as NodeJS.ProcessEnv,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (d: string) => (stdout += d))
    child.stderr.on('data', (d: string) => (stderr += d))
    child.on('close', (status) => resolve({ status, stdout, stderr }))
  })
}

/** Every file under a directory, recursively — used to prove nothing was written. */
function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesUnder(path.join(dir, entry.name))
      : [path.join(dir, entry.name)],
  )
}

const DOMAIN = 'app.1stcontact.io'
const TOKEN_NAME = '1stcontact-publish'
/** The account the script must pick, and one it must not guess between. */
const ONE_ACCOUNT = [{ id: 'acct-only', name: 'Lagrange Foundry' }]
/** The application it must find BY DOMAIN — its display name says otherwise. */
const APPS = [
  { id: 'app-decoy', name: '1stcontact builder', domain: 'staging.1stcontact.io' },
  { id: 'app-real', name: 'renamed by somebody in the dashboard', domain: DOMAIN },
]

it('test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret', async () => {
  const provisioner = path.join(REPO, 'bin', 'access-token')

  // Executable — an operator runs it, they do not hunt for the interpreter.
  // eslint-disable-next-line no-bitwise
  expect(statSync(provisioner).mode & 0o111, 'bin/access-token is not executable').not.toBe(0)

  // Gated on the MANAGEMENT credential, and it names the permissions that
  // credential needs — a scope error is otherwise a 403 from an API path.
  const refused = script('access-token', [])
  expect(refused.status, 'the provisioner ran without a management API credential').toBe(1)
  expect(refused.stderr).toContain('CLOUDFLARE_API_TOKEN')
  expect(refused.stderr, 'the refusal names no permissions').toMatch(/Access: Service Tokens/)
  expect(refused.stderr).toMatch(/Access: Apps and Policies/)
  expect(refused.stderr).toMatch(/Edit/)

  // ── several accounts get a refusal naming them, never a coin flip ──────────
  {
    const api = await stubApi({
      accounts: [
        { id: 'acct-one', name: 'Foundry' },
        { id: 'acct-two', name: 'Something Else' },
      ],
      apps: APPS,
      tokens: [],
      policies: {},
    })
    try {
      const run = await scriptAsync('access-token', [], {
        env: { CLOUDFLARE_API_TOKEN: 'stub-management-token', CLOUDFLARE_API_BASE: api.base },
      })
      expect(run.status, 'an ambiguous account was resolved anyway').toBe(1)
      expect(run.stderr, 'the refusal does not name the setting to disambiguate with').toContain(
        'CLOUDFLARE_ACCOUNT_ID',
      )
      expect(run.stderr, 'the refusal does not name the accounts it saw').toContain('acct-one')
      expect(run.stderr).toContain('acct-two')
      // And it stopped there: nothing was created against either account.
      expect(api.seen.filter((c) => c.method !== 'GET')).toEqual([])
    } finally {
      await api.close()
    }
  }

  // ── no application for the domain is a refusal that names it ───────────────
  {
    const api = await stubApi({
      accounts: ONE_ACCOUNT,
      apps: [APPS[0]],
      tokens: [],
      policies: {},
    })
    try {
      const run = await scriptAsync('access-token', [], {
        env: { CLOUDFLARE_API_TOKEN: 'stub-management-token', CLOUDFLARE_API_BASE: api.base },
      })
      expect(run.status).toBe(1)
      expect(run.stderr, 'the missing application is not named').toContain(DOMAIN)
      expect(run.stderr, 'the applications actually present are not reported').toContain(
        'staging.1stcontact.io',
      )
      expect(api.seen.filter((c) => c.method !== 'GET')).toEqual([])
    } finally {
      await api.close()
    }
  }

  // ── the mint: one account inferred, the app matched by domain, a Service ────
  //    Auth policy added separately, the pair printed, and nothing written.
  const workdir = mkdtempSync(path.join(tmpdir(), 'ac1453-'))
  {
    const api = await stubApi({
      accounts: ONE_ACCOUNT,
      apps: APPS,
      tokens: [],
      // The operator's own rule, already on the application. It must survive.
      policies: {
        'app-real': [{ id: 'pol-operator', name: 'operator', include: [{ email: {} }] }],
      },
    })
    try {
      // Run it somewhere it COULD write, with that directory as `HOME` too, so
      // "no secret is written to any file" is an observation of the filesystem
      // rather than of the source: a dotfile would land here.
      const run = await scriptAsync('access-token', [], {
        cwd: workdir,
        env: {
          HOME: workdir,
          CLOUDFLARE_API_TOKEN: 'stub-management-token',
          CLOUDFLARE_API_BASE: api.base,
        },
      })
      expect(run.status, run.stderr).toBe(0)

      // It says WHICH of the three things happened, and prints the pair once.
      expect(run.stdout, 'the mint is not reported as a creation').toMatch(/Token\s+created/)
      expect(run.stdout).toContain("export CF_ACCESS_CLIENT_ID='created.access'")
      expect(run.stdout).toContain(`export CF_ACCESS_CLIENT_SECRET='${CREATED_SECRET}'`)
      expect(run.stdout, 'the policy it made is not reported').toMatch(/created policy/)

      // The account was inferred because there was exactly one — every request
      // after `/accounts` is scoped to it.
      const scoped = api.seen.filter((c) => c.path !== '/accounts')
      expect(scoped.length).toBeGreaterThan(0)
      for (const call of scoped) expect(call.path.startsWith('/accounts/acct-only/')).toBe(true)

      // THE APPLICATION WAS MATCHED BY DOMAIN, not by display name: every write
      // went to `app-real`, whose name is wrong and whose domain is right, and
      // none to `app-decoy`, whose name is the one an operator would recognise.
      const posts = api.seen.filter((c) => c.method === 'POST')
      expect(posts.some((c) => c.path.includes('app-decoy'))).toBe(false)

      const policyPost = posts.find((c) => /\/apps\/[^/]+\/policies$/.test(c.path))
      expect(policyPost, 'no policy was created').toBeDefined()
      expect(policyPost?.path).toContain('/apps/app-real/policies')

      // A SERVICE AUTH rule — `non_identity` is what makes it one; an `allow`
      // rule with a service-token include asks Access to check a human identity
      // the token does not carry.
      const tokenPost = posts.find((c) => /\/access\/service_tokens$/.test(c.path))
      expect(tokenPost?.body).toMatchObject({ name: TOKEN_NAME })
      expect(policyPost?.body).toMatchObject({
        decision: 'non_identity',
        include: [{ service_token: { token_id: 'tok-created' } }],
      })
      expect((policyPost?.body as { name: string }).name).toContain(TOKEN_NAME)

      // A SEPARATE policy, never a widening of the operator's own — so revoking
      // the automation cannot touch the rule that keeps the operator signed in.
      // Nothing was edited or removed: the only mutations are creations.
      expect(api.seen.every((c) => c.method === 'GET' || c.method === 'POST')).toBe(true)
      expect(posts.some((c) => c.path.includes('pol-operator'))).toBe(false)

      // NOTHING WAS WRITTEN. The process had a writable working directory and a
      // writable `HOME`, and left both empty — the secret exists only on stdout.
      expect(filesUnder(workdir)).toEqual([])
    } finally {
      await api.close()
      rmSync(workdir, { recursive: true, force: true })
    }
  }

  // ── an existing token is reused, and an existing inclusion left alone ──────
  {
    const api = await stubApi({
      accounts: ONE_ACCOUNT,
      apps: APPS,
      tokens: [{ id: 'tok-existing', name: TOKEN_NAME, client_id: 'existing.access' }],
      policies: {
        'app-real': [
          { id: 'pol-operator', name: 'operator', include: [{ email: {} }] },
          {
            id: 'pol-service',
            name: `service token — ${TOKEN_NAME}`,
            include: [{ service_token: { token_id: 'tok-existing' } }],
          },
        ],
      },
    })
    try {
      const run = await scriptAsync('access-token', [], {
        env: { CLOUDFLARE_API_TOKEN: 'stub-management-token', CLOUDFLARE_API_BASE: api.base },
      })
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout, 'an existing token was recreated').toMatch(/already exists — not recreated/)
      expect(run.stdout, 'an existing inclusion was not left alone').toMatch(
        /already included by policy/,
      )
      // Idempotent in the only way that counts: it wrote nothing at all.
      expect(api.seen.filter((c) => c.method !== 'GET')).toEqual([])

      // The secret is not obtainable for a token it did not mint, and it says so
      // plainly rather than leaving an operator hunting a dashboard field that
      // does not exist — naming the one command that produces a fresh one.
      expect(run.stdout).toContain("export CF_ACCESS_CLIENT_ID='existing.access'")
      expect(run.stdout, 'a lost secret is not explained').toMatch(
        /shown only when the token is created or rotated/,
      )
      expect(run.stdout, 'a lost secret names no way to replace it').toMatch(
        /bin\/access-token --rotate/,
      )
      expect(run.stdout).not.toContain(CREATED_SECRET)
    } finally {
      await api.close()
    }
  }

  // ── --rotate issues a fresh secret for the token that already exists ───────
  {
    const api = await stubApi({
      accounts: ONE_ACCOUNT,
      apps: APPS,
      tokens: [{ id: 'tok-existing', name: TOKEN_NAME, client_id: 'existing.access' }],
      policies: {
        'app-real': [
          {
            id: 'pol-service',
            name: `service token — ${TOKEN_NAME}`,
            include: [{ service_token: { token_id: 'tok-existing' } }],
          },
        ],
      },
    })
    try {
      const run = await scriptAsync('access-token', ['--rotate'], {
        env: { CLOUDFLARE_API_TOKEN: 'stub-management-token', CLOUDFLARE_API_BASE: api.base },
      })
      expect(run.status, run.stderr).toBe(0)
      expect(run.stdout, 'a rotation is not reported as one').toMatch(/rotated/)
      // Rotated in place, on the token that exists — not by minting a second one.
      expect(
        api.seen.filter((c) => c.method === 'POST').map((c) => c.path),
      ).toContain('/accounts/acct-only/access/service_tokens/tok-existing/rotate')
      expect(
        api.seen.some((c) => c.method === 'POST' && /\/access\/service_tokens$/.test(c.path)),
      ).toBe(false)
      expect(run.stdout).toContain(`export CF_ACCESS_CLIENT_SECRET='${ROTATED_SECRET}'`)
    } finally {
      await api.close()
    }
  }

  // ── a refusal reported inside a 200 envelope is a refusal ──────────────────
  // Cloudflare answers `200 {success: false}` for "you may not do that" as
  // readily as it answers 4xx. A caller reading only the transport status would
  // report a successful no-op and send the operator away with a policy that was
  // never created.
  {
    const api = await stubApi({
      accounts: ONE_ACCOUNT,
      apps: APPS,
      tokens: [],
      policies: {},
      refuse: '/policies',
    })
    try {
      const run = await scriptAsync('access-token', [], {
        env: { CLOUDFLARE_API_TOKEN: 'stub-management-token', CLOUDFLARE_API_BASE: api.base },
      })
      expect(run.status, 'a refusal inside a 200 was read as success').toBe(1)
      expect(run.stderr, 'the refusal it was given is not reported').toContain(
        'insufficient permissions',
      )
    } finally {
      await api.close()
    }
  }

  // The assertion header is the far side's and is never this script's business —
  // a source-level claim, and stated as one.
  const source = readFileSync(provisioner, 'utf8')
  expect(source).not.toMatch(/cf-access-jwt-assertion/i)

  // ── The policy record carries the granted service identity, with its reason. ──
  const doc = readFileSync(path.join(CONTROL_APP, 'ACCESS.md'), 'utf8')
  const section = (doc.split(/^#+ .*Granted identities.*$/m)[1] ?? '').split(/^#+ /m)[0]
  const lines = section.split('\n').filter((line) => line.trim().startsWith('|'))
  const separator = lines.findIndex((line) => /^\s*\|[\s:|-]+\|\s*$/.test(line))
  expect(separator, 'no granted-identity table is recorded').toBeGreaterThanOrEqual(0)
  const rows = lines
    .slice(separator + 1)
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))

  const service = rows.find((cells) => /service token/i.test(cells[0] ?? ''))
  expect(service, 'the granted service identity is not recorded beside the human ones').toBeDefined()
  expect(
    (service?.[1] ?? '').length,
    `the granted service identity carries no reason: ${service?.join(' | ')}`,
  ).toBeGreaterThan(10)

  // What an automation caller presents, and where its secret belongs.
  expect(doc, 'the record does not say what an automation caller presents').toMatch(
    /CF-Access-Client-Id[\s\S]{0,80}CF-Access-Client-Secret/,
  )
  expect(doc, 'the record does not say the secret belongs in a secret store').toMatch(
    /secret store/i,
  )
  expect(doc, 'the record does not keep the secret out of this repository').toMatch(
    /never\s+into this repository/i,
  )
  expect(doc, 'the record confuses the management credential with the gate credential').toMatch(
    /API token is the provisioner, never the credential/i,
  )

  // The public half is not a secret; the secret half appears nowhere — in the
  // record or in the script that prints it.
  for (const [where, text] of [
    ['ACCESS.md', doc],
    ['bin/access-token', source],
  ] as const) {
    expect(text, `a service-token secret value is recorded in ${where}`).not.toMatch(
      /CF[-_]ACCESS[-_]CLIENT[-_]SECRET['"\s:=]+[A-Za-z0-9._-]{12,}/i,
    )
  }
})
