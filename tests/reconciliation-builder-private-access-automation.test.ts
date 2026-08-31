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
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
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
 * The command is driven as the process it is (so the shebang and the executable
 * bit are part of the claim), and its properties that need a Cloudflare account
 * to exercise are read out of its source — which is where the criterion itself
 * puts them, because provisioning against the real API from a test would create
 * a live credential.
 */
it('test_UAT_AC1453_the_automation_identity_is_provisioned_by_a_command_that_persists_no_secret', () => {
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

  const source = readFileSync(provisioner, 'utf8')

  // The account is resolved explicitly, and inferred only when unambiguous;
  // several accounts get a refusal naming them rather than a coin flip.
  expect(source).toContain('CLOUDFLARE_ACCOUNT_ID')
  expect(source, 'the account is inferred without checking there is exactly one').toMatch(
    /len\(accounts\) == 1/,
  )
  expect(source, 'several accounts are not refused by name').toMatch(
    /set CLOUDFLARE_ACCOUNT_ID[\s\S]{0,40}Saw:/,
  )

  // The application is located by the DOMAIN it guards, not by its display name,
  // which is a label an operator can change without meaning to change anything.
  expect(source, 'the application is not matched on its domain').toMatch(
    /app\.get\("domain"\)[\s\S]{0,40}== domain/,
  )
  expect(source, 'no Access application for the domain is not a named refusal').toMatch(
    /no Access application for/,
  )

  // Minted, reused, or freshly rotated — and it says which of the three happened.
  expect(source).toMatch(/Token\s+created/)
  expect(source).toMatch(/already exists — not recreated/)
  expect(source).toMatch(/rotated/)

  // A SERVICE AUTH policy, added SEPARATELY rather than by widening the
  // operator's own rule, so the automation revokes without touching the rule
  // that keeps the operator signed in. An existing inclusion is left alone.
  expect(source, 'the policy is not a Service Auth rule').toMatch(/"decision": "non_identity"/)
  expect(source, 'the policy does not include the service token').toMatch(
    /"include": \[\{"service_token": \{"token_id": token_id\}\}\]/,
  )
  expect(source, 'an existing inclusion is not left alone').toMatch(/already included by policy/)

  // A refusal inside a successful transport envelope is a refusal — Cloudflare
  // answers 200 with `success: false` as readily as it answers 4xx.
  expect(source, 'a refusal reported inside a 200 is read as a successful no-op').toMatch(
    /if not payload\.get\("success"\)/,
  )

  // The pair is printed once, and no secret is written anywhere: not into this
  // repository, not into a dotfile, not into a log.
  expect(source).toMatch(/export CF_ACCESS_CLIENT_ID/)
  expect(source).toMatch(/export CF_ACCESS_CLIENT_SECRET/)
  expect(source, 'the provisioner opens a file for writing').not.toMatch(/open\([^)]*["']w["']/)
  expect(source, 'the provisioner writes a file').not.toMatch(/write_text|writeFileSync|\.write\(/)
  // The assertion header is the far side's and is never this script's business.
  expect(source).not.toMatch(/cf-access-jwt-assertion/i)

  // When the secret is no longer obtainable it says so plainly, and names the one
  // command that produces a fresh one.
  expect(source, 'a lost secret is not explained').toMatch(
    /shown only when the token is created or rotated/,
  )
  expect(source, 'a lost secret names no way to replace it').toMatch(
    /bin\/access-token --rotate/,
  )

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
