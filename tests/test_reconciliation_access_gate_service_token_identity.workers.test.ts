import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'
import wranglerToml from '../apps/control-app/wrangler.toml?raw'

/**
 * STORY-120 — the builder is private; a service token acts as a named person
 * (BUG-59, reconciled in BUNDLE-39).
 *
 * Every request-handling case drives the Worker's own `fetch` with a real RS256
 * token signed by this process and verified against a JWKS the gateway stub
 * publishes, against real D1. Nothing about the gate or admission is
 * short-circuited: the only thing stubbed is the identity gateway's key endpoint,
 * which is the external boundary.
 *
 * The admission refusal reason never reaches the wire (one message for every
 * reason, DOC-40 §5), so it is observed where the application records it: the
 * `admission_denied` line `admit` writes at the point it decides.
 */

const PLATFORM = 'story120-platform'
const TEAM = 'https://story120-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)
const KID = 'story120-key'
const TOKEN_NAME = '1stcontact-publish'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

let seq = 0
const anEmail = (): string => `story120-${(seq += 1)}@example.test`

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A real gateway-shaped token: `email` for a person, `common_name` for a service token. */
async function mint(claims: { email?: string; common_name?: string }): Promise<string> {
  const header = { alg: 'RS256', kid: KID, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, ...claims }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

function stubGateway(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url === certsUrl(TEAM)) {
        return new Response(JSON.stringify(jwks), { headers: { 'content-type': 'application/json' } })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

interface Denial {
  event: string
  reason: string
  email: string | null
}

/** Capture the `admission_denied` lines `admit` writes while `fn` runs. */
async function denialsDuring<T>(fn: () => Promise<T>): Promise<{ value: T; denials: Denial[] }> {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  try {
    const value = await fn()
    const denials = spy.mock.calls
      .map((args) => {
        try {
          return JSON.parse(String(args[0])) as Denial
        } catch {
          return null
        }
      })
      .filter((d): d is Denial => d !== null && d.event === 'admission_denied')
    return { value, denials }
  } finally {
    spy.mockRestore()
  }
}

async function call(
  token: string,
  overrides: Partial<Env> = {},
  init: { path?: string; headers?: Record<string, string>; method?: string; body?: string } = {},
): Promise<Response> {
  return worker.fetch(
    new Request(`https://app.example${init.path ?? '/api/businesses'}`, {
      method: init.method ?? 'GET',
      headers: { 'cf-access-jwt-assertion': token, ...(init.headers ?? {}) },
      body: init.body,
    }),
    workerEnv(overrides),
    {} as ExecutionContext,
  )
}

async function snapshot(response: Response): Promise<{ status: number; body: string }> {
  return { status: response.status, body: await response.text() }
}

async function countUsers(): Promise<number> {
  const row = await (env.DB as D1Database)
    .prepare('SELECT COUNT(*) AS n FROM users')
    .first<{ n: number }>()
  return row?.n ?? 0
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetJwksCache()
})

describe('STORY-120 — who a service token is', () => {
  it('test_UAT_AC2358_mapped_service_token_is_admitted_as_the_named_person', async () => {
    stubGateway()
    const serviceToken = await mint({ common_name: TOKEN_NAME })

    // --- Same businesses, same payload, as the person presenting their own address.
    const email = anEmail()
    const seeded = await inviteAccount(identityEnv(), { email })
    await acceptTerms(identityEnv(), seeded.user.id)
    const mapping = { SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${email}` }

    const asPerson = await snapshot(await call(await mint({ email }), mapping))
    const asAutomation = await snapshot(await call(serviceToken, mapping))
    expect(asPerson.status, asPerson.body).toBe(200)
    expect(asAutomation.status, asAutomation.body).toBe(200)
    expect(JSON.parse(asAutomation.body)).toEqual(JSON.parse(asPerson.body))
    const payload = JSON.parse(asAutomation.body) as {
      person: { email: string }
      businesses: Array<{ id: string; selectable: boolean }>
    }
    expect(payload.person.email).toBe(email)
    expect(payload.businesses.map((b) => b.id)).toContain(seeded.businessId)

    // --- The person's arrival is what is recorded: their own row is stamped and no
    // presence is invented for the automation.
    const usersBefore = await countUsers()
    const stamped = await (env.DB as D1Database)
      .prepare('SELECT last_seen_at FROM users WHERE id = ?')
      .bind(seeded.user.id)
      .first<{ last_seen_at: string | null }>()
    expect(stamped?.last_seen_at).toBeTruthy()

    // --- Case- and whitespace-insensitive on both halves.
    const shouted = {
      SERVICE_TOKEN_IDENTITIES: `  ${TOKEN_NAME.toUpperCase()} = ${email.toUpperCase()} `,
    }
    const asShouted = await snapshot(await call(serviceToken, shouted))
    expect(asShouted.status, asShouted.body).toBe(200)
    expect(JSON.parse(asShouted.body)).toEqual(JSON.parse(asPerson.body))

    // --- The person's grants decide selectability, with the same lapse reasons.
    const lapsedEmail = anEmail()
    const lapsed = await inviteAccount(identityEnv(), {
      email: lapsedEmail,
      startsAt: '2020-01-01T00:00:00.000Z',
      endsAt: '2020-02-01T00:00:00.000Z',
    })
    await acceptTerms(identityEnv(), lapsed.user.id)
    const lapsedMapping = { SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${lapsedEmail}` }
    const lapsedPerson = await snapshot(await call(await mint({ email: lapsedEmail }), lapsedMapping))
    const lapsedAutomation = await snapshot(await call(serviceToken, lapsedMapping))
    expect(lapsedAutomation).toEqual(lapsedPerson)
    expect(lapsedAutomation.status, lapsedAutomation.body).toBe(200)
    const lapsedEntry = (JSON.parse(lapsedAutomation.body) as {
      businesses: Array<{ id: string; selectable: boolean; lapse: unknown }>
    }).businesses.find((b) => b.id === lapsed.businessId)
    expect(lapsedEntry?.selectable).toBe(false)
    expect(lapsedEntry?.lapse).not.toBeNull()

    // --- The terms gate applies to the person: not accepted → the same refusal.
    const unagreedEmail = anEmail()
    await inviteAccount(identityEnv(), { email: unagreedEmail })
    const unagreedMapping = { SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${unagreedEmail}` }
    const unagreedPerson = await snapshot(
      await call(await mint({ email: unagreedEmail }), unagreedMapping),
    )
    const unagreedAutomation = await snapshot(await call(serviceToken, unagreedMapping))
    expect(unagreedPerson.status).not.toBe(200)
    expect(unagreedAutomation).toEqual(unagreedPerson)

    // --- Removing the mapping entry alone revokes the automation.
    const revoked = await denialsDuring(() => call(serviceToken, { SERVICE_TOKEN_IDENTITIES: '' }))
    expect(revoked.value.status).toBe(403)
    expect(revoked.denials.map((d) => d.reason)).toEqual(['no_email'])

    // --- The mapping names a person; it does not create one.
    const ghost = 'Ghost-Story120@Example.test'
    const nobody = await denialsDuring(() =>
      call(serviceToken, { SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${ghost}` }),
    )
    expect(nobody.value.status).toBe(403)
    expect(nobody.denials).toHaveLength(1)
    expect(nobody.denials[0].reason).toBe('no_user')
    expect(nobody.denials[0].email).toBe(ghost.toLowerCase())
    // Nothing provisioned by any of the refused or mapped requests above.
    expect(await countUsers()).toBe(usersBefore + 2)
    const ghostRow = await (env.DB as D1Database)
      .prepare('SELECT COUNT(*) AS n FROM user_emails WHERE lower(email) = ?')
      .bind(ghost.toLowerCase())
      .first<{ n: number }>()
    expect(ghostRow?.n ?? 0).toBe(0)
  })

  it('test_UAT_AC2359_unmapped_token_refused_no_email_and_human_email_never_redirected', async () => {
    stubGateway()
    const serviceToken = await mint({ common_name: TOKEN_NAME })

    // --- Unmapped in a non-empty mapping, empty, and undeclared: all refused no_email.
    for (const overrides of [
      { SERVICE_TOKEN_IDENTITIES: 'some-other-token=elsewhere@example.test' },
      { SERVICE_TOKEN_IDENTITIES: '' },
      {},
    ] as Array<Partial<Env>>) {
      const { value, denials } = await denialsDuring(() => call(serviceToken, overrides))
      expect(value.status, JSON.stringify(overrides)).toBe(403)
      expect(value.headers.get('cache-control')).toBe('no-store')
      expect(denials.map((d) => d.reason), JSON.stringify(overrides)).toEqual(['no_email'])
      expect(denials[0].email).toBeNull()
    }

    // --- A human's own email wins, even when the mapping lists that identity's
    // machine name against a different (real, admissible) person.
    const human = anEmail()
    const humanSeed = await inviteAccount(identityEnv(), { email: human })
    await acceptTerms(identityEnv(), humanSeed.user.id)
    const other = anEmail()
    const otherSeed = await inviteAccount(identityEnv(), { email: other })
    await acceptTerms(identityEnv(), otherSeed.user.id)
    const redirecting = { SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${other}` }

    const bothClaims = await mint({ email: human, common_name: TOKEN_NAME })
    const admitted = await call(bothClaims, redirecting)
    expect(admitted.status, await admitted.clone().text()).toBe(200)
    const payload = (await admitted.json()) as {
      person: { email: string }
      businesses: Array<{ id: string }>
    }
    expect(payload.person.email).toBe(human)
    const ids = payload.businesses.map((b) => b.id)
    expect(ids).toContain(humanSeed.businessId)
    expect(ids).not.toContain(otherSeed.businessId)

    // --- And refused AS that address: a human with no person behind them is not
    // rescued into the mapped person.
    const stranger = anEmail()
    const strangerToken = await mint({ email: stranger, common_name: TOKEN_NAME })
    const refused = await denialsDuring(() => call(strangerToken, redirecting))
    expect(refused.value.status).toBe(403)
    expect(refused.denials).toHaveLength(1)
    expect(refused.denials[0].reason).toBe('no_user')
    expect(refused.denials[0].email).toBe(stranger)
  })

  it('test_UAT_AC2360_mapping_declared_per_environment_as_name_address_never_from_request', async () => {
    // --- Configuration: declared in the default environment and every named one.
    const sections = new Map<string, string[]>()
    let current = ''
    for (const line of wranglerToml.split('\n')) {
      const header = /^\s*\[{1,2}([^\]]+)\]{1,2}\s*$/.exec(line)
      if (header) {
        current = header[1].trim()
        if (!sections.has(current)) sections.set(current, [])
        continue
      }
      if (/^\s*#/.test(line)) continue
      sections.get(current)?.push(line)
    }
    const declared = (section: string): string | undefined => {
      for (const line of sections.get(section) ?? []) {
        const m = /^\s*SERVICE_TOKEN_IDENTITIES\s*=\s*"([^"]*)"\s*$/.exec(line)
        if (m) return m[1]
      }
      return undefined
    }
    const named = [...sections.keys()]
      .map((s) => /^env\.([^.]+)$/.exec(s)?.[1])
      .filter((n): n is string => n !== undefined)
    expect(named).toContain('production')

    expect(declared('vars')).toBe('')
    const values = [declared('vars') as string]
    for (const name of named) {
      const value = declared(`env.${name}.vars`)
      expect(value, `env.${name}.vars must declare SERVICE_TOKEN_IDENTITIES`).toBeDefined()
      values.push(value as string)
    }
    expect(declared('env.production.vars')).not.toBe('')
    for (const value of values.filter((v) => v !== '')) {
      for (const entry of value.split(',')) {
        expect(entry).toMatch(/^[^=,\s]+=[^=,\s@]+@[^=,\s@]+\.[^=,\s@]+$/)
      }
    }

    // --- Request input cannot select or change which person a token acts as.
    stubGateway()
    const person = anEmail()
    const seeded = await inviteAccount(identityEnv(), { email: person })
    await acceptTerms(identityEnv(), seeded.user.id)
    const mapping = { SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${person}` }
    const unmapped = await mint({ common_name: 'unmapped-automation' })

    const attempts: Array<{ label: string; init: Parameters<typeof call>[2] }> = [
      {
        label: 'headers',
        init: {
          headers: {
            'cf-access-authenticated-user-email': person,
            'x-service-token-identity': TOKEN_NAME,
            'x-common-name': TOKEN_NAME,
            'x-email': person,
          },
        },
      },
      {
        label: 'query',
        init: {
          path: `/api/businesses?common_name=${TOKEN_NAME}&email=${encodeURIComponent(person)}` +
            `&SERVICE_TOKEN_IDENTITIES=${encodeURIComponent(`unmapped-automation=${person}`)}`,
        },
      },
      {
        label: 'cookie',
        init: { headers: { cookie: `common_name=${TOKEN_NAME}; email=${person}` } },
      },
      {
        label: 'body',
        init: {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            common_name: TOKEN_NAME,
            email: person,
            SERVICE_TOKEN_IDENTITIES: `unmapped-automation=${person}`,
          }),
        },
      },
    ]
    for (const { label, init } of attempts) {
      const { value, denials } = await denialsDuring(() => call(unmapped, mapping, init))
      expect(value.status, label).toBe(403)
      expect(denials.map((d) => d.reason), label).toEqual(['no_email'])
      expect(denials[0].email, label).toBeNull()
    }
  })
})
