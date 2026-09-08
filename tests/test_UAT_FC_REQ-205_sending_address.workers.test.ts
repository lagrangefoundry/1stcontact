import { beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { addContact } from '../apps/control-app/src/people'
import { inviteDraft, invitePeople } from '../apps/control-app/src/invites'
import { messagesFor } from '../apps/control-app/src/messages'
import { signInMailer } from '../apps/control-app/src/sessions'
import { resendMailer, type Message, type SendEmail } from '../apps/control-app/src/mail'
import { copyOf, templateFor, TEMPLATE_TYPE } from '../apps/control-app/src/templates'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'
import type { Scope } from '../apps/control-app/src/scope'

/**
 * [[REQ-205]] — **the sending address is the template's, and `MAIL_FROM` is what
 * a template with none means.**
 *
 * THE PROBLEM WITH ONE ADDRESS FOR EVERYTHING. `MAIL_FROM` is deployment-wide:
 * the invite path, the sign-in path and the modal's prefill all read it, so
 * setting it to `invite@` would have sent sign-in links from `invite@` too. And
 * `no-reply@` makes replies impossible, which throws away one of the strongest
 * positive engagement signals a recipient can generate — somebody *will* reply
 * to an invitation.
 *
 * WHAT THIS FILE PROVES. That a template carrying a `from` sends from it; that a
 * template with none still sends from the deployment's address, which is what
 * every template ticket written before the field existed already meant; that the
 * invite is the one that names an address and sign-in is not; that the modal
 * displays the address the send will actually use AND still refuses to take an
 * edit to it; and that an RFC 5322 display-name form reaches the provider
 * character for character.
 *
 * THE DISPLAY-ONLY CLAIM IS ASSERTED THROUGH THE ROUTE, because it is a claim
 * about a door: the modal not offering the field is one client's manners, and
 * the server not reading it is the property. An operator-set sender fails DKIM
 * and lands in spam, which is the failure this whole ticket is about.
 *
 * NO CREDENTIAL IS CONFIGURED, so `mailerFor` returns the adapter that records
 * and delivers nothing ([[REQ-196]]) — every claim here is read back off the
 * message record or off a `fetch` double.
 */

const PLATFORM = 'req205-platform'
const TEAM = 'https://req205-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)
const DEPLOYMENT_FROM = '1st Contact <no-reply@req205.test>'
const INVITE_FROM = '1st Contact <invite@1stcontact.io>'
const CTA = 'https://app.req205.test/sign-in/req205-token'

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }
let seq = 0
const anEmail = (): string => `req205-${(seq += 1)}@example.test`

const identityEnv = (): IdentityEnv => ({
  DB: env.DB as D1Database,
  SITES: env.SITES as R2Bucket,
  TENANT_ID: PLATFORM,
})

const scope = (businessId: string): Scope => ({ businessId })

const storeFor = (businessId: string): Promise<TicketStore> =>
  ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, scope(businessId))

/** A sender that records and accepts, so what was handed to the port is readable. */
function recording(): { send: SendEmail; sent: Message[] } {
  const sent: Message[] = []
  return {
    sent,
    send: async (message) => {
      sent.push(message)
      return { providerId: `prov_${sent.length}` }
    },
  }
}

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    MAIL_FROM: DEPLOYMENT_FROM,
    // The invite mints a redeemable link per contact ([[REQ-202]]), which needs
    // a session cookie to exist — an unconfigured one is a 503 rather than a
    // send.
    SESSION_COOKIE_NAME: 'session',
    SESSION_COOKIE_DOMAIN: '',
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

/** A real Access token, signed by the key the stubbed JWKS publishes. */
async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req205-key', typ: 'JWT' }
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
        return new Response(JSON.stringify(jwks), {
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

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
  jwks = { keys: [{ ...jwk, kid: 'req205-key', alg: 'RS256', use: 'sig' }] }
})

describe('REQ-205 — the sending address is per template', () => {
  it('test_UAT_FC_REQ-205_the_seeded_invite_names_an_address_and_the_other_templates_do_not', async () => {
    // The invite sends from a mailbox somebody reads; sign-in and the lapse
    // notice fall back to the deployment's address until somebody decides
    // otherwise. Read back through `templateFor`, which is what seeds a business
    // that has never had templates — so this proves the seeder writes the field
    // rather than that a constant contains it.
    const business = 'req205-seeded'
    const store = await storeFor(business)

    expect(copyOf(await templateFor(store, 'invite')).from).toBe(INVITE_FROM)
    expect(copyOf(await templateFor(store, 'signin')).from).toBeUndefined()
    expect(copyOf(await templateFor(store, 'lapsed')).from).toBeUndefined()
  })

  it('test_UAT_FC_REQ-205_an_invite_is_sent_from_the_template_address_and_the_record_agrees', async () => {
    // What was SENT and what was RECORDED are the same value, which is the
    // reason the address is resolved once rather than at each of the two call
    // sites: a record naming an address the message did not come from answers
    // the wrong question the day somebody asks why a reply bounced.
    const business = 'req205-invite'
    const store = await storeFor(business)
    const contact = (await addContact(identityEnv(), scope(business), { email: anEmail() })).person
    const port = recording()

    const [result] = await invitePeople(
      {
        env: identityEnv(),
        scope: scope(business),
        store,
        send: port.send,
        from: DEPLOYMENT_FROM,
        inviteUrl: async () => CTA,
      },
      [contact.id],
    )

    expect(result.status).toBe('sent')
    expect(port.sent).toHaveLength(1)
    expect(port.sent[0].from, 'the invite did not send from its template address').toBe(INVITE_FROM)
    const [record] = await messagesFor(store, contact.id)
    expect(record.from).toBe(INVITE_FROM)
  })

  it('test_UAT_FC_REQ-205_a_template_with_no_from_sends_from_the_deployment_address', async () => {
    // ABSENT MEANS `MAIL_FROM`, which is what every template ticket written
    // before the field existed already means — so this business holds an invite
    // template of its own, authored without the field, and nothing seeds over
    // it ([[REQ-197]]: a template exists, so `templateFor` returns it).
    const business = 'req205-fallback'
    const store = await storeFor(business)
    await store.create({
      type: TEMPLATE_TYPE,
      title: 'Invite email, this business own words',
      fields: { template_key: 'invite', subject: 'Come in', placeholders: ['cta_url'] },
      body: '<p>Come in: <a href="{{cta_url}}">open your account</a></p>',
    })
    const contact = (await addContact(identityEnv(), scope(business), { email: anEmail() })).person
    const port = recording()

    await invitePeople(
      {
        env: identityEnv(),
        scope: scope(business),
        store,
        send: port.send,
        from: DEPLOYMENT_FROM,
        inviteUrl: async () => CTA,
      },
      [contact.id],
    )

    expect(port.sent[0].from).toBe(DEPLOYMENT_FROM)
  })

  it('test_UAT_FC_REQ-205_a_sign_in_link_does_not_come_from_the_invite_address', async () => {
    // The whole reason the address moved onto the template: one deployment-wide
    // value could not send invitations from `invite@` without sending sign-in
    // links from it too. Driven through the shipped `signInMailer`, which is the
    // port the sign-in route hands the passwordless component.
    const business = 'req205-signin'
    const store = await storeFor(business)
    const email = anEmail()
    const contact = (await addContact(identityEnv(), scope(business), { email })).person
    const port = recording()

    await signInMailer({
      env: { ...identityEnv(), TENANT_ID: business },
      tenantId: business,
      store,
      send: port.send,
      from: DEPLOYMENT_FROM,
    })({ to: email, url: CTA })

    expect(port.sent[0].from).toBe(DEPLOYMENT_FROM)
    expect(port.sent[0].from).not.toBe(INVITE_FROM)
    const [record] = await messagesFor(store, contact.id)
    expect(record.from).toBe(DEPLOYMENT_FROM)
  })

  it('test_UAT_FC_REQ-205_the_modal_shows_the_address_the_send_will_use', async () => {
    // The operator is owed the answer to *who will this appear to be from*, and
    // the answer is only worth showing if it is the one the send uses. The
    // fallback is passed in and is NOT what comes back, which is the difference
    // between displaying a deployment setting and displaying this message's own
    // sender.
    const store = await storeFor('req205-draft')

    const draft = await inviteDraft(store, DEPLOYMENT_FROM)

    expect(draft.from).toBe(INVITE_FROM)
  })

  it('test_UAT_FC_REQ-205_the_route_ignores_a_from_sent_with_the_invite', async () => {
    // DISPLAY-ONLY IS A PROPERTY OF THE SERVER, not of one client's manners. An
    // operator-set sender fails DKIM and lands in spam, so a `from` on the POST
    // is not read — and the message goes out from the template's address as
    // though nothing had been sent at all.
    stubJwks()
    const owner = anEmail()
    const seeded = await inviteAccount(identityEnv(), {
      email: owner,
      accountName: 'A Business',
      endsAt: null,
    })
    await acceptTerms(identityEnv(), seeded.user.id)
    const store = await storeFor(seeded.businessId)
    const contact = (await addContact(identityEnv(), scope(seeded.businessId), {
      email: anEmail(),
    })).person

    const response = await worker.fetch(
      new Request(`https://app.example/b/${seeded.businessId}${PERSON_INVITE_PATH}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-access-jwt-assertion': await mint(owner),
        },
        body: JSON.stringify({ ids: [contact.id], from: 'attacker@elsewhere.test' }),
      }),
      workerEnv(),
    )

    expect(response.status).toBe(200)
    const [record] = await messagesFor(store, contact.id)
    expect(record, 'the invite recorded nothing to read a sender off').toBeTruthy()
    expect(record.from).toBe(INVITE_FROM)
    expect(record.from).not.toContain('attacker@elsewhere.test')
    vi.unstubAllGlobals()
    resetJwksCache()
  })

  it('test_UAT_FC_REQ-205_a_display_name_from_reaches_the_provider_verbatim', async () => {
    // RFC 5322 `Name <address>` form, which Resend accepts as-is. An anonymous
    // From is most of what makes a message from a domain with no reputation look
    // like phishing, so the display name has to survive every hop between the
    // template and the provider — the adapter carries the string through and
    // changes nothing about it.
    const fetchDouble = vi.fn(
      async () => new Response(JSON.stringify({ id: 'msg_req205_from' }), { status: 200 }),
    )

    await resendMailer('re_test_key', fetchDouble as unknown as typeof fetch)({
      to: 'alice@example.com',
      from: INVITE_FROM,
      subject: 'Your invitation',
      body: '<p>Come in.</p>',
    })

    const [, init] = fetchDouble.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).from).toBe(INVITE_FROM)
  })
})
