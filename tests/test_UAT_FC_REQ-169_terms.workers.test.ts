import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { admit, provisionInvite, type IdentityEnv } from '../apps/control-app/src/identity'
import {
  acceptTerms,
  guardTerms,
  needsAcceptance,
  TERMS_ACCEPT_PATH,
  TERMS_PATH,
  TERMS_TEXT,
  TERMS_VERSION,
  termsHtml,
} from '../apps/control-app/src/terms'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-169 — **the terms of service, accepted before the builder loads**.
 *
 * WHAT MAKES THIS EVIDENCE. Every end-to-end case drives the Worker's own `fetch`
 * inside workerd, against a real D1 database with the deployed schema applied,
 * carrying a real RS256 Access token verified against a real JWKS. Nothing on the
 * way to the check is short-circuited: the person under test was invited through
 * `provisionInvite` and admitted through `admit`, so what is being proved is that
 * an otherwise perfectly entitled caller is stopped by this and nothing else.
 *
 * THE THREE CLAIMS THIS FILE EXISTS FOR:
 *
 *   1. IT BLOCKS THE BUILDER, NOT JUST THE CHROME. An unaccepted session is
 *      refused assets and API routes, not merely un-navigated-to — the assets
 *      binding here returns a recognisable body precisely so that a fall-through
 *      would be visible rather than inferred.
 *   2. THE VERSION IS THE POINT. Acceptance stamps a version identifier, and a
 *      user accepted at a previous one is prompted again — driven both by moving
 *      the stored version and by moving the constant.
 *   3. DECLINING IS NOT A STATE. There is no control that records a refusal, and
 *      the assertion is over the served page rather than over an intention.
 */

const PLATFORM = 'req169-platform'
const TEAM = 'https://req169-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)

/** A version that is not the shipped one, for the re-prompt cases. */
const BUMPED = '2099-01-01'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

/** The whole Worker environment, with Access configured for real verification. */
function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    // A recognisable body, so "the asset was served" is an observation rather
    // than an absence of one.
    ASSETS: { fetch: async () => new Response('ASSET-BYTES', { status: 200 }) } as unknown as Fetcher,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** A real Access token — minted here, signed by the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req169-key', typ: 'JWT' }
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

/** What a browser sends when it is going to RENDER the answer. */
const NAVIGATION = { accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }
/** What a module script, an `<img>` or a `fetch()` sends. */
const SUBRESOURCE = { accept: '*/*' }

async function call(
  path: string,
  token: string,
  init: RequestInit & { headers?: Record<string, string> } = {},
): Promise<Response> {
  const headers = { ...(init.headers ?? {}), 'cf-access-jwt-assertion': token }
  return worker.fetch(new Request(`https://app.example${path}`, { ...init, headers }), workerEnv())
}

let seq = 0
const anEmail = (): string => `req169-${(seq += 1)}@example.test`

/** An invited, entitled person who has never accepted anything. */
async function anInvitee(): Promise<{ email: string; token: string; userId: string }> {
  const email = anEmail()
  const invited = await provisionInvite(identityEnv(), { email, endsAt: null })
  return { email, token: await mint(email), userId: invited.user.id }
}

async function storedTerms(userId: string): Promise<{ tos_version: string | null; tos_accepted_at: string | null }> {
  const row = await env.DB.prepare('SELECT tos_version, tos_accepted_at FROM users WHERE id = ?')
    .bind(userId)
    .first<{ tos_version: string | null; tos_accepted_at: string | null }>()
  return row ?? { tos_version: null, tos_accepted_at: null }
}

beforeAll(async () => {
  await applySchema()
  signing = (await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req169-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-169 — the interstitial stands between login and the builder', () => {
  it('test_UAT_FC_REQ-169_an_admitted_person_who_has_not_accepted_is_served_the_terms', async () => {
    // The plainest form of the ticket. This caller passes the Access gate for
    // real and passes `admit` for real — they were invited, they are entitled —
    // and the builder is still not what comes back.
    stubJwks()
    const { token } = await anInvitee()

    const response = await call('/', token, { headers: NAVIGATION })
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(body).toContain('Terms of service')
    expect(body).toContain(TERMS_VERSION)
    // Not the builder. The chrome document is what `/` answers with once the
    // terms are accepted, so its absence here is the whole claim.
    expect(body).not.toContain('1st Contact builder')
    expect(body).not.toContain('/builder/main.js')
  })

  it('test_UAT_FC_REQ-169_it_blocks_the_builder_and_not_just_the_chrome', async () => {
    // [[REQ-147]]'s lesson: bytes served before the check are bytes served to
    // someone who has not passed it. So a sub-resource an unaccepted session asks
    // for is REFUSED, not merely un-navigated-to — including the assets binding,
    // which is the one that would otherwise answer before any route matched.
    stubJwks()
    const { token } = await anInvitee()

    for (const path of ['/builder/main.js', '/builder/builder.css', '/api/sites', '/api/material']) {
      const response = await call(path, token, { headers: SUBRESOURCE })
      expect(response.status, `${path} was not refused`).toBe(403)
      expect(await response.text()).not.toContain('ASSET-BYTES')
    }
  })

  it('test_UAT_FC_REQ-169_a_navigation_gets_the_page_and_everything_else_gets_a_refusal', async () => {
    // The distinction the interstitial rests on. `Sec-Fetch-Dest: document` is
    // what a browser sends when it is going to RENDER the answer and is the
    // precise signal; `Accept: text/html` is the fallback for anything that does
    // not send it. A wildcard `Accept` is deliberately NOT enough — that is what
    // a module script sends, and answering one with an HTML document breaks the
    // page more confusingly than refusing it does.
    stubJwks()
    const { token } = await anInvitee()

    const byDest = await call('/some/deep/link', token, {
      headers: { accept: '*/*', 'sec-fetch-dest': 'document' },
    })
    expect(byDest.status).toBe(200)
    expect(await byDest.text()).toContain('Terms of service')

    const byAccept = await call('/some/deep/link', token, { headers: NAVIGATION })
    expect(byAccept.status).toBe(200)

    const script = await call('/some/deep/link', token, {
      headers: { accept: '*/*', 'sec-fetch-dest': 'script' },
    })
    expect(script.status).toBe(403)
  })

  it('test_UAT_FC_REQ-169_the_terms_and_the_refusal_are_neither_cacheable_nor_indexable', async () => {
    // A cached interstitial outlives the acceptance that should have replaced it,
    // and a cached refusal becomes everybody's answer including the accepted.
    stubJwks()
    const { token } = await anInvitee()

    for (const [path, headers] of [
      ['/', NAVIGATION],
      ['/builder/main.js', SUBRESOURCE],
    ] as const) {
      const response = await call(path, token, { headers })
      expect(response.headers.get('cache-control'), path).toBe('no-store')
      expect(response.headers.get('x-robots-tag'), path).toContain('noindex')
    }
  })
})

describe('REQ-169 — acceptance', () => {
  it('test_UAT_FC_REQ-169_accepting_stamps_the_version_and_the_time', async () => {
    // BOTH COLUMNS. A timestamp alone says when somebody clicked and not what
    // they clicked; a version alone cannot answer when. Read back out of D1
    // rather than out of a return value, because a function that reported what it
    // meant to write would pass having written nothing.
    stubJwks()
    const { token, userId } = await anInvitee()
    expect(await storedTerms(userId)).toEqual({ tos_version: null, tos_accepted_at: null })

    const response = await call(TERMS_ACCEPT_PATH, token, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    expect(response.status).toBe(204)

    const stored = await storedTerms(userId)
    expect(stored.tos_version).toBe(TERMS_VERSION)
    expect(Number.isNaN(Date.parse(stored.tos_accepted_at ?? ''))).toBe(false)
  })

  it('test_UAT_FC_REQ-169_acceptance_continues_to_where_they_were_going', async () => {
    // The other half, and the half that would otherwise be assumed: a gate that
    // refused everybody would pass every assertion above. After acceptance the
    // SAME urls answer with the things that were asked for — which is what
    // "continues to where they were going" means when the interstitial was served
    // at the requested url and the browser simply reloads it.
    stubJwks()
    const { token } = await anInvitee()

    expect((await call('/', token, { headers: NAVIGATION })).status).toBe(200)
    await call(TERMS_ACCEPT_PATH, token, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })

    const chrome = await call('/', token, { headers: NAVIGATION })
    expect(await chrome.text()).toContain('1st Contact builder')

    const asset = await call('/builder/main.js', token, { headers: SUBRESOURCE })
    expect(asset.status).toBe(200)
    expect(await asset.text()).toBe('ASSET-BYTES')
  })

  it('test_UAT_FC_REQ-169_acceptance_cannot_be_posted_from_another_origin', async () => {
    // Acceptance of a legal agreement is exactly the thing that must not be
    // forgeable cross-site. A form can only send three content types, none of
    // them JSON, and anything able to set JSON has been through a preflight this
    // Worker never answers — so requiring it is the whole defence, and the row
    // must be untouched when it is missing.
    stubJwks()
    const { token, userId } = await anInvitee()

    const response = await call(TERMS_ACCEPT_PATH, token, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'accept=1',
    })
    expect(response.status).toBe(415)
    expect(await storedTerms(userId)).toEqual({ tos_version: null, tos_accepted_at: null })
  })

  it('test_UAT_FC_REQ-169_declining_is_not_a_state', async () => {
    // There is no control that records a refusal and no route that would accept
    // one: declining is closing the tab. Asserted over the SERVED page, because
    // the claim is about what a person is offered.
    stubJwks()
    const { token } = await anInvitee()
    const body = await (await call('/', token, { headers: NAVIGATION })).text()

    expect(body.match(/<button/g) ?? []).toHaveLength(1)
    expect(body).not.toMatch(/decline|reject|refuse|no thanks/i)

    // And nothing writes a refusal: the only route an unaccepted session may
    // reach is the accepting one, and it accepts.
    const declined = await call('/api/terms/decline', token, { headers: SUBRESOURCE })
    expect(declined.status).toBe(403)
  })
})

describe('REQ-169 — the version is the point, not the timestamp', () => {
  it('test_UAT_FC_REQ-169_bumping_the_version_prompts_an_accepted_user_again', async () => {
    // The mechanism the ticket exists for, driven two ways because they prove
    // different halves. Moving the CONSTANT is what a maintainer will actually
    // do, so `guardTerms` is called with a bumped version against a user accepted
    // at the shipped one; moving the STORED value proves the same comparison
    // through the Worker's own request path.
    stubJwks()
    const { email, token, userId } = await anInvitee()
    await acceptTerms(identityEnv(), userId)

    const admission = await admit(identityEnv(), email)
    expect(admission.ok).toBe(true)
    if (!admission.ok) return

    // At the shipped version: nothing to say.
    expect(needsAcceptance(admission.user)).toBe(false)
    expect(
      await guardTerms(new Request('https://app.example/', { headers: NAVIGATION }), identityEnv(), admission),
    ).toBeUndefined()

    // Bump the constant, and the same accepted user owes an acceptance again.
    expect(needsAcceptance(admission.user, BUMPED)).toBe(true)
    const prompted = await guardTerms(
      new Request('https://app.example/', { headers: NAVIGATION }),
      identityEnv(),
      admission,
      { version: BUMPED },
    )
    expect(prompted?.status).toBe(200)
    expect(await prompted!.text()).toContain(BUMPED)

    // …and through the request path, by moving the stored version instead.
    await env.DB.prepare('UPDATE users SET tos_version = ? WHERE id = ?').bind('2020-01-01', userId).run()
    const again = await call('/', token, { headers: NAVIGATION })
    expect(await again.text()).toContain('Terms of service')
  })

  it('test_UAT_FC_REQ-169_a_never_accepted_user_and_a_stale_one_are_the_same_case', async () => {
    // `tos_version IS NULL` answers "has this person ever accepted anything",
    // which is the same question as "do they owe one" only until the first time
    // the terms change. A comparison keeps them the same case forever.
    expect(needsAcceptance({ tos_version: null })).toBe(true)
    expect(needsAcceptance({ tos_version: '2020-01-01' })).toBe(true)
    expect(needsAcceptance({ tos_version: TERMS_VERSION })).toBe(false)
  })
})

describe('REQ-169 — the page itself', () => {
  it('test_UAT_FC_REQ-169_the_text_lives_in_one_constant_and_all_of_it_is_served', async () => {
    // "Supplying the real text later is an edit and not a search" is only true if
    // the page is built from the constant and restates none of it. Every
    // paragraph of `TERMS_TEXT` must reach the served page — a page that carried
    // its own copy would drift from the constant the moment one of them changed.
    stubJwks()
    const { token } = await anInvitee()
    const body = await (await call('/', token, { headers: NAVIGATION })).text()

    const paragraphs = TERMS_TEXT.split(/\n\s*\n/).map((p) => p.trim())
    expect(paragraphs.length).toBeGreaterThan(1)
    for (const para of paragraphs) expect(body).toContain(para)
  })

  it('test_UAT_FC_REQ-169_the_interstitial_references_nothing_it_would_be_refused', async () => {
    // It is served to a session being refused every asset, so a stylesheet link
    // or a module script would render as unstyled text with a button that does
    // nothing — the worst possible presentation of a legal agreement.
    stubJwks()
    const { token } = await anInvitee()
    const body = await (await call('/', token, { headers: NAVIGATION })).text()

    expect(body).not.toMatch(/<link\b/i)
    expect(body).not.toMatch(/<script[^>]+src=/i)
    expect(body).not.toContain('importmap')
    expect(body).toContain(TERMS_ACCEPT_PATH)
  })

  it('test_UAT_FC_REQ-169_the_terms_stay_readable_after_they_are_accepted', async () => {
    // Terms that vanish the moment they are accepted are terms nobody can check
    // they agreed to. The document answers for an accepted caller too — with the
    // date they accepted in place of the control.
    const accepted = termsHtml({ outstanding: false, acceptedAt: '2026-09-02T10:00:00.000Z' })
    expect(accepted).toContain('Accepted on 2026-09-02')
    expect(accepted).not.toContain('<button')
    expect(accepted).toContain(TERMS_TEXT.split(/\n\s*\n/)[0].trim())
  })

  it('test_UAT_FC_REQ-169_the_terms_path_answers_before_the_builder_does', async () => {
    // `/terms` is reachable whether or not an acceptance is outstanding, and it
    // is answered by the guard rather than falling through to the assets binding
    // — which for an accepted caller is what would otherwise happen.
    stubJwks()
    const { token, userId } = await anInvitee()
    await acceptTerms(identityEnv(), userId)

    const response = await call(TERMS_PATH, token, { headers: NAVIGATION })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    const body = await response.text()
    expect(body).toContain('Terms of service')
    expect(body).not.toContain('ASSET-BYTES')
    expect(body).not.toContain('<button')
  })
})
