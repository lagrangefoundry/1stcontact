import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { ensurePlatformOperator, findAccount, type IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { ADMIN_BUSINESSES_PATH, PEOPLE_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * story-387c9dfe — **owning the 1st Contact business and hosting the others are
 * two facts, observed through the Worker.**
 *
 * Every case drives the deployed `fetch` inside workerd against a real D1 with
 * the deployed migrations, with a real RS256 Access token verified against a
 * stubbed JWKS (the JWKS fetch is the only external boundary). People are seeded
 * by shipped entry points — `ensurePlatformOperator` writes both halves,
 * `inviteAccount` writes an ordinary customer owner — and a half is taken away
 * by setting the `platform_operator` column, which is the only thing that
 * distinguishes the halves on disk.
 */

const PLATFORM = 'split-platform'
const TEAM = 'https://split-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'split-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, email }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

function stubJwks(): void {
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

let seq = 0
const anEmail = (): string => `split-${(seq += 1)}@example.test`

const setHosting = async (email: string, on: boolean): Promise<void> => {
  await env.DB.prepare('UPDATE users SET platform_operator = ? WHERE tenant_id = ? AND email = ?')
    .bind(on ? 1 : 0, PLATFORM, email)
    .run()
}

/** Both halves, exactly as production seeds an operator. */
async function both(): Promise<string> {
  const email = anEmail()
  await ensurePlatformOperator(identityEnv(), email)
  const account = await findAccount(identityEnv(), email)
  if (!account) throw new Error('the seeded operator was not readable back')
  await acceptTerms(identityEnv(), account.id)
  return email
}

/** The ownership half alone: an `owner` membership on 1st Contact, no column. */
async function ownerOnly(): Promise<string> {
  const email = await both()
  await setHosting(email, false)
  return email
}

/** An ordinary customer owner of a business of their own. */
async function customer(name = 'Salon'): Promise<{ email: string; businessId: string }> {
  const email = anEmail()
  const seeded = await inviteAccount(identityEnv(), { email, accountName: name, endsAt: null })
  await acceptTerms(identityEnv(), seeded.user.id)
  return { email, businessId: seeded.businessId }
}

/** The hosting half alone: the column, no membership on 1st Contact. */
async function hostOnly(): Promise<string> {
  const { email } = await customer('Host Own Business')
  await setHosting(email, true)
  return email
}

const listPeople = (token: string, businessId: string): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/b/${encodeURIComponent(businessId)}${PEOPLE_PATH}`, {
      headers: { 'cf-access-jwt-assertion': token },
    }),
    workerEnv(),
  )

const addBusiness = (token: string, accountEmail: string): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example${ADMIN_BUSINESSES_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
      body: JSON.stringify({ accountEmail, name: `Provisioned ${(seq += 1)}` }),
    }),
    workerEnv(),
  )

beforeAll(async () => {
  await applySchema()
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'split-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('story-387c9dfe — owning 1st Contact is ordinary ownership', () => {
  it('test_UAT_AC2165_owning_1st_contact_reads_exactly_like_owning_a_salon', async () => {
    stubJwks()
    const platformOwner = await ownerOnly()
    const salon = await customer('Salon')
    const asPlatformOwner = await mint(platformOwner)
    const asSalonOwner = await mint(salon.email)

    const ours = await listPeople(asPlatformOwner, PLATFORM)
    const theirs = await listPeople(asSalonOwner, salon.businessId)
    expect(ours.status).toBe(200)
    expect(theirs.status).toBe(200)
    const oursBody = await ours.json<Record<string, unknown>>()
    const theirsBody = await theirs.json<Record<string, unknown>>()

    // Each is the owner of their own business, through the same answer, and the
    // two answers carry exactly the same fields — nothing says "this one is ours".
    expect(oursBody.canInvite).toBe(true)
    expect(theirsBody.canInvite).toBe(true)
    expect(Object.keys(oursBody).sort()).toEqual(Object.keys(theirsBody).sort())

    // The one difference is the business, not the person: the 1st Contact owner
    // passes the add-a-business gate because what they own is the business
    // whose product is businesses — and they hold no `platform_operator`.
    expect(oursBody.canFulfil).toBe(true)
    expect(theirsBody.canFulfil).toBe(false)
    expect((await addBusiness(asPlatformOwner, salon.email)).status).toBe(200)
    expect((await addBusiness(asSalonOwner, salon.email)).status).toBe(404)

    // The column without the membership is not ownership of 1st Contact. The
    // host enters through the bypass, and is told they may not invite there.
    const host = await hostOnly()
    const asHost = await mint(host)
    const hosted = await listPeople(asHost, PLATFORM)
    expect(hosted.status).toBe(200)
    const hostedBody = await hosted.json<Record<string, unknown>>()
    expect(hostedBody.canInvite).toBe(false)
    expect(hostedBody.canFulfil).toBe(false)
  })
})

describe('story-387c9dfe — no single predicate answers both questions', () => {
  it('test_UAT_AC2168_ownership_and_bypass_are_separately_held_and_neither_implies_the_other', async () => {
    stubJwks()
    const platformOwner = await ownerOnly()
    const host = await hostOnly()
    const operator = await both()
    const target = await customer('Not Theirs')

    const warnings: string[] = []
    vi.spyOn(console, 'warn').mockImplementation((line: unknown) => {
      warnings.push(String(line))
    })

    const matrix: Array<[string, string, number, number]> = [
      // who, email, add-a-business, enter a business they are not a member of
      ['operator-only', host, 404, 200],
      ['owner-only', platformOwner, 200, 403],
      ['both', operator, 200, 200],
    ]
    for (const [who, email, addStatus, enterStatus] of matrix) {
      const token = await mint(email)
      expect((await addBusiness(token, target.email)).status, `${who} add-a-business`).toBe(addStatus)
      const entered = await listPeople(token, target.businessId)
      expect(entered.status, `${who} entering a non-member business`).toBe(enterStatus)
      if (enterStatus === 200) {
        // Entering a business you host is not owning it.
        expect((await entered.json<{ canInvite: boolean }>()).canInvite, `${who} reported as owner`).toBe(false)
      }
    }

    // The owner-only refusal is the scope refusal, logged as not a member.
    const refusals = warnings
      .map((line) => {
        try {
          return JSON.parse(line) as { event?: string; reason?: string; business?: string }
        } catch {
          return {}
        }
      })
      .filter((e) => e.event === 'scope_refused')
    expect(refusals).toEqual([{ event: 'scope_refused', reason: 'not_a_member', business: target.businessId }])
  })
})
