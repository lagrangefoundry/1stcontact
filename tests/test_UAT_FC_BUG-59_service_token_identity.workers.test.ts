import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { actingEmail, admit, type IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * BUG-59 — **a service token acts as a named person**.
 *
 * WHAT WAS BROKEN, AND WHERE. A Cloudflare Access service token authenticates as
 * a non-human `common_name` and carries no email; `verifyAccessJwt` accepts that
 * and reports it as `service-token:<name>`. `admit` then refused it, opening with
 * `if (!email) return { reason: 'no_email' }` — DOC-40 §2 makes the verified
 * email the identity and a `common_name` gives it nothing to look up. So the
 * credential BUG-36 provisioned for `bin/publish` passed the gate and was turned
 * away one layer in: `bin/publish --production` could authenticate and could not
 * do anything.
 *
 * THE FIX ADDS NO NEW PRINCIPAL. `SERVICE_TOKEN_IDENTITIES` maps a token's name
 * to an ADDRESS, and everything downstream is unchanged — membership decides
 * which businesses, the grant decides whether they are selectable, the terms that
 * person accepted are the terms it operates under, and removing the person
 * removes the automation. The cases below are therefore mostly about what the
 * mapping must NOT do: it must not open anything when absent, must not redirect a
 * human, and must not provision the address it names.
 *
 * IN WORKERD, AGAINST REAL D1. Admission is a question about rows, and the end-to-
 * end case drives the Worker's own `fetch` with a real RS256 service-token JWT
 * verified against a real JWKS — nothing about the gate is short-circuited on the
 * way to the thing under test.
 */

const PLATFORM = 'bug59-platform'
const TEAM = 'https://bug59-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)
const TOKEN_NAME = '1stcontact-publish'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

let seq = 0
const anEmail = (): string => `bug59-${(seq += 1)}@example.test`

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
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

/**
 * A real service-token JWT — the shape Cloudflare mints for Service Auth, which
 * is `common_name` and NO email. Minted rather than fixtured so the signature the
 * Worker checks is one this process produced against the key the stubbed JWKS
 * publishes.
 */
async function mintServiceToken(name: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'bug59-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, common_name: name }
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
  jwks = { keys: [{ ...jwk, kid: 'bug59-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('BUG-59 — who a service token is', () => {
  /**
   * The claim: a token the deployment has named resolves to that person, and
   * `admit` then answers about the PERSON — the same businesses, from the same
   * three reads, as if they had signed in themselves.
   */
  it('test_UAT_FC_BUG-59_a_named_service_token_is_admitted_as_that_person', async () => {
    const email = anEmail()
    const seeded = await inviteAccount(identityEnv(), { email })

    const e = identityEnv({ SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${email}` })
    const acting = actingEmail(e, { email: null, claims: { common_name: TOKEN_NAME } })
    expect(acting).toBe(email)

    const result = await admit(e, acting)
    expect(result.ok, JSON.stringify(result)).toBe(true)
    if (!result.ok) return
    expect(result.businesses.map((b) => b.businessId)).toContain(seeded.businessId)
  })

  /**
   * AN UNMAPPED TOKEN IS REFUSED EXACTLY AS BEFORE, which is the property that
   * makes this safe to add: the var opens nothing by being absent, empty, or
   * naming somebody else. Without this case, "the mapping works" is equally
   * consistent with a change that admitted every service token.
   */
  it('test_UAT_FC_BUG-59_an_unmapped_service_token_is_still_refused', async () => {
    const claims = { common_name: TOKEN_NAME }

    for (const e of [
      identityEnv(),
      identityEnv({ SERVICE_TOKEN_IDENTITIES: '' }),
      identityEnv({ SERVICE_TOKEN_IDENTITIES: 'some-other-token=elsewhere@example.test' }),
    ]) {
      expect(actingEmail(e, { email: null, claims })).toBeNull()
      const result = await admit(e, actingEmail(e, { email: null, claims }))
      expect(result.ok).toBe(false)
      expect(!result.ok && result.reason).toBe('no_email')
    }
  })

  /**
   * A HUMAN'S OWN ADDRESS WINS OUTRIGHT, and the ordering is the safety property
   * rather than a convenience: the mapping is consulted ONLY when there is nobody
   * to be, so no configuration of it can redirect somebody who signed in. This is
   * driven with a token carrying BOTH claims — which Cloudflare never mints, and
   * which is exactly why it is worth pinning.
   */
  it('test_UAT_FC_BUG-59_the_mapping_can_never_redirect_a_person', () => {
    const e = identityEnv({ SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=automation@example.test` })

    expect(actingEmail(e, { email: 'human@example.test', claims: { common_name: TOKEN_NAME } }))
      .toBe('human@example.test')
  })

  /**
   * CASEFOLDED ON BOTH SIDES, for the reason `isPlatformAdminSeed` gives about
   * `PLATFORM_ADMINS`: the `users` index is written through `normaliseEmail`, so a
   * var reading `Operator@Example.com` would name a person the database does not
   * contain — and the failure would be a lockout discovered at the moment the var
   * was reached for. The token's name is folded too, because it is a name typed
   * into two different systems.
   */
  it('test_UAT_FC_BUG-59_the_mapping_is_casefolded_on_both_sides', async () => {
    const email = anEmail()
    await inviteAccount(identityEnv(), { email })

    const e = identityEnv({ SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME.toUpperCase()}=${email.toUpperCase()}` })
    expect(actingEmail(e, { email: null, claims: { common_name: TOKEN_NAME } })).toBe(email)
  })

  /**
   * THE MAPPING NAMES A PERSON; IT DOES NOT CREATE ONE. An entry pointing at an
   * address with no `users` row is refused `no_user` like anybody else — the same
   * refusal, from the same read. A mapping that provisioned its own account would
   * be a second way to become somebody, which is precisely what this fix set out
   * not to add.
   */
  it('test_UAT_FC_BUG-59_a_mapped_address_that_is_nobody_is_refused_like_anybody', async () => {
    const e = identityEnv({ SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=ghost@example.test` })

    const result = await admit(e, actingEmail(e, { email: null, claims: { common_name: TOKEN_NAME } }))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.reason).toBe('no_user')
  })

  /**
   * And the whole path, through the Worker's own `fetch`: a real signed service
   * token, verified against a real JWKS, admitted, past the terms gate the person
   * cleared, and served. This is the case `bin/publish --production` is, and the
   * one that was 403ing.
   */
  it('test_UAT_FC_BUG-59_a_service_token_request_reaches_the_worker', async () => {
    const email = anEmail()
    const seeded = await inviteAccount(identityEnv(), { email })
    // The terms are the PERSON'S ([[DOC-40]] §4) and the automation operates under
    // them — which is the point of mapping to a person rather than inventing a
    // principal that would need its own agreement to something.
    await acceptTerms(identityEnv(), seeded.user.id)
    stubJwks()

    const token = await mintServiceToken(TOKEN_NAME)
    const request = new Request('https://app.example/api/businesses', {
      headers: { 'cf-access-jwt-assertion': token },
    })
    const response = await worker.fetch(
      request,
      workerEnv({ SERVICE_TOKEN_IDENTITIES: `${TOKEN_NAME}=${email}` }),
      {} as ExecutionContext,
    )

    expect(response.status, await response.clone().text()).toBe(200)
    const body = (await response.json()) as { person: { email: string } }
    expect(body.person.email).toBe(email)
  })

  /**
   * The same request with the var unset is refused, and this is the end-to-end
   * half of the "opens nothing when absent" claim above — asserted through the
   * Worker rather than through `admit` alone, because the resolution happens at
   * the gate and a regression could live in either place.
   */
  it('test_UAT_FC_BUG-59_the_same_request_is_refused_with_no_mapping', async () => {
    const email = anEmail()
    const seeded = await inviteAccount(identityEnv(), { email })
    await acceptTerms(identityEnv(), seeded.user.id)
    stubJwks()

    const token = await mintServiceToken(TOKEN_NAME)
    const response = await worker.fetch(
      new Request('https://app.example/api/businesses', {
        headers: { 'cf-access-jwt-assertion': token },
      }),
      workerEnv(),
      {} as ExecutionContext,
    )

    expect(response.status).toBe(403)
  })
})
