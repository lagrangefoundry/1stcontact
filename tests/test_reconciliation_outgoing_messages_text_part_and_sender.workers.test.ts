import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import {
  InvalidMessageError,
  capturingMailer,
  mailerFor,
  textFrom,
  type Message,
  type SendEmail,
} from '../apps/control-app/src/mail'
import {
  SEED_TEMPLATES,
  TEMPLATE_KEYS,
  TEMPLATE_TYPE,
  copyOf,
  ensureTemplates,
  renderTemplate,
  templateFor,
} from '../apps/control-app/src/templates'
import {
  productTypePack,
  ticketStoreFor,
  type Ticket,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { addContact } from '../apps/control-app/src/people'
import { invitePeople } from '../apps/control-app/src/invites'
import { messagesFor } from '../apps/control-app/src/messages'
import { signInMailer } from '../apps/control-app/src/sessions'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { acceptTerms } from '../apps/control-app/src/terms'
import { PERSON_INVITE_PATH } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * Reconciliation UATs for story-7d255580 — **outgoing messages**, the REQ-205
 * upgrade (workerd half): the derived plain-text part, its refusal, the
 * per-template sending address, and the template / seed changes that carry it.
 *
 * WHAT MAKES THIS EVIDENCE. Sends go through `mailerFor` — the one entry point
 * the Worker uses — with the provider's endpoint replaced by a recording `fetch`
 * double, the only boundary we do not own. Templates live in a real D1/R2
 * ticket store. The sending-address claims are read off what the send port was
 * handed AND off the outgoing message record, and the display-only claim is
 * proved through the Worker's own invite routes.
 */

const KEY = 're_story7d255580_req205_key'
const PLATFORM = 'story7d25-req205-platform'
const TEAM = 'https://story7d25-req205.cloudflareaccess.com'
const AUD = 'e'.repeat(64)
const DEPLOYMENT_FROM = '1st Contact <no-reply@story7d25.test>'
const INVITE_FROM = '1st Contact <invite@1stcontact.io>'
const CTA = 'https://app.example/i/story7d25?next=%2Fbuilder&x=1'

const MESSAGE: Message = {
  to: 'alice@example.com',
  from: DEPLOYMENT_FROM,
  subject: 'A subject',
  body: '<p>A body with words.</p>',
}

/** A provider double that answers success and records each request. */
function providerDouble() {
  return vi.fn(async (_url: string, _init: RequestInit) => Response.json({ id: 'msg_story7d25' }))
}

type Provider = ReturnType<typeof providerDouble>

const credentialed = (provider: Provider): SendEmail =>
  mailerFor({ RESEND_API_KEY: KEY }, { fetch: provider as unknown as typeof fetch })

/** The JSON body of the `n`th request the provider double received. */
function payload(provider: Provider, n = 0): Record<string, unknown> {
  return JSON.parse(provider.mock.calls[n][1].body as string) as Record<string, unknown>
}

/** Every URL an `href` names, as the HTML part carries it. */
function hrefsIn(html: string): string[] {
  return [...html.matchAll(/href\s*=\s*"([^"]*)"/gi)].map(([, u]) => u.replace(/&amp;/g, '&'))
}

const storeEnv = (): TicketStoreEnv => ({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket })
const scope = (businessId: string): Scope => ({ businessId })
const storeOf = (businessId: string): Promise<TicketStore> =>
  ticketStoreFor(storeEnv(), scope(businessId))

const identityEnv = (): IdentityEnv => ({
  DB: env.DB as D1Database,
  SITES: env.SITES as R2Bucket,
  TENANT_ID: PLATFORM,
})

async function templatesIn(store: TicketStore): Promise<Ticket[]> {
  return (await store.query({ predicate: `type=${TEMPLATE_TYPE}`, limit: 'all' })).tickets
}

/** A send port that records and accepts, so what it was handed is readable. */
function recordingPort(): { send: SendEmail; sent: Message[] } {
  const sent: Message[] = []
  return {
    sent,
    send: async (message) => {
      sent.push(message)
      return { providerId: `prov_${sent.length}` }
    },
  }
}

/** D1 stamps `created_at` to the millisecond, so "newest" needs a real gap. */
const tick = () => new Promise((r) => setTimeout(r, 5))

let seq = 0
const anEmail = (): string => `story7d25-${(seq += 1)}@example.test`

// --- Access, for the route-level claims -------------------------------------

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'story7d25-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, email }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`
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

function workerEnv(): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    MAIL_FROM: DEPLOYMENT_FROM,
    SESSION_COOKIE_NAME: 'session',
    SESSION_COOKIE_DOMAIN: '',
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as Env
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
  jwks = { keys: [{ ...jwk, kid: 'story7d25-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetJwksCache()
})

describe('story-7d255580 — the derived text part (REQ-205)', () => {
  it('test_UAT_AC2369_every_message_carries_a_text_part_that_keeps_every_href', async () => {
    // THE FALSIFIER over every shipped template: no href in the HTML part may be
    // missing from the text part the provider received.
    const store = await storeOf('story7d25-ac2369')
    for (const key of TEMPLATE_KEYS) {
      const rendered = renderTemplate(await templateFor(store, key), { cta_url: CTA })
      const provider = providerDouble()
      await credentialed(provider)({ ...MESSAGE, subject: rendered.subject, body: rendered.body })

      const sent = payload(provider)
      const text = String(sent.text)
      const hrefs = hrefsIn(String(sent.html))
      expect(hrefs.length, `${key} carries no link`).toBeGreaterThan(0)
      for (const href of hrefs) expect(text, `${key} text part lost ${href}`).toContain(href)
    }

    // Hand-built bodies, read off the provider's text field.
    const textOf = async (body: string): Promise<string> => {
      const provider = providerDouble()
      await credentialed(provider)({ ...MESSAGE, body })
      return String(payload(provider).text)
    }

    // Anchors: words then <address>; words that are the address render once.
    expect(await textOf(`<p><a href="${CTA}" style="color:#fff">Accept your invitation</a></p>`)).toBe(
      `Accept your invitation <${CTA}>`,
    )
    expect(await textOf(`<p><a href="${CTA}">${CTA}</a></p>`)).toBe(CTA)

    // Non-content markup never appears.
    const stripped = await textOf(
      '<html><head><title>Secret title</title></head><body>' +
        '<style>.x{color:red}</style><script>var leak=1</script><p>Visible words</p></body></html>',
    )
    expect(stripped).toBe('Visible words')
    expect(stripped).not.toContain('Secret title')
    expect(stripped).not.toContain('color:red')
    expect(stripped).not.toContain('leak')

    // Blocks are paragraphs; source wrapping and runs of whitespace collapse.
    expect(
      await textOf(
        ['<p>The first paragraph is', '   wrapped across', 'source lines.</p>', '<p>Second.</p>'].join(
          '\n',
        ),
      ),
    ).toBe('The first paragraph is wrapped across source lines.\n\nSecond.')

    // Entities are decoded, named and numeric.
    expect(await textOf('<p>Fish &amp; chips &#8212; tonight</p>')).toBe('Fish & chips — tonight')
  })

  it('test_UAT_AC2370_a_body_yielding_no_text_is_refused_by_both_senders_before_anything_happens', async () => {
    for (const body of ['<p></p>', '<style>p{}</style>']) {
      const provider = providerDouble()
      const local = capturingMailer()
      const wordless = { ...MESSAGE, body }

      for (const send of [credentialed(provider), local.send, mailerFor({})]) {
        let caught: unknown
        try {
          await send(wordless)
        } catch (e) {
          caught = e
        }
        expect(caught, `${body} was accepted`).toBeInstanceOf(InvalidMessageError)
        expect((caught as Error).message).toMatch(/plain-text/i)
        expect((caught as Error).message).toMatch(/derived/i)
      }
      expect(provider, 'the provider was reached with an underivable body').not.toHaveBeenCalled()
      expect(local.sent).toEqual([])
    }

    // A body that does yield text is accepted by both, and the text the
    // provider receives is the text that check derived.
    const body = '<p>Hello &amp; welcome,</p><p><a href="https://x.example/a">Go</a></p>'
    const provider = providerDouble()
    const local = capturingMailer()
    await expect(credentialed(provider)({ ...MESSAGE, body })).resolves.toMatchObject({
      providerId: 'msg_story7d25',
    })
    await expect(local.send({ ...MESSAGE, body })).resolves.toBeTruthy()
    expect(local.sent).toHaveLength(1)
    expect(payload(provider).text).toBe(textFrom(body))
    expect(payload(provider).text).toBe('Hello & welcome,\n\nGo <https://x.example/a>')
  })

  it('test_UAT_AC2281_message_body_reaches_the_provider_as_html_beside_a_derived_text_part', async () => {
    const store = await storeOf('story7d25-ac2281-req205')
    const url = 'https://app.example/i/ac2281'
    const rendered = renderTemplate(await templateFor(store, 'invite'), { cta_url: url })

    const provider = providerDouble()
    await credentialed(provider)({ ...MESSAGE, subject: rendered.subject, body: rendered.body })

    expect(provider).toHaveBeenCalledTimes(1)
    const sent = payload(provider)
    expect(sent.html).toBe(rendered.body)
    expect(String(sent.html)).toMatch(new RegExp(`<a\\s[^>]*href="${url.replace(/[./]/g, '\\$&')}"`))
    expect(typeof sent.text).toBe('string')
    expect(String(sent.text).trim()).not.toBe('')
    // No HTML tags — `<https://…>` is the anchor's address form, not a tag.
    expect(String(sent.text)).not.toMatch(/<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>/i)
    expect(String(sent.text)).toContain(`<${url}>`)

    // Only one body is authored: the template type has no text field.
    const schema = productTypePack().schema(TEMPLATE_TYPE) as { fields: Record<string, unknown> }
    expect(Object.keys(schema.fields)).not.toContain('text')
    for (const key of TEMPLATE_KEYS) expect(Object.keys(SEED_TEMPLATES[key])).not.toContain('text')
  })
})

describe('story-7d255580 — the sending address is per template (REQ-205)', () => {
  it('test_UAT_AC2371_sender_is_the_template_address_else_mail_from_resolved_once_and_not_editable', async () => {
    // Invite send, seeded templates: the template's address, on message and record.
    const business = 'story7d25-ac2371'
    const store = await storeOf(business)
    const invitee = (await addContact(identityEnv(), scope(business), { email: anEmail() })).person
    const port = recordingPort()
    const deps = {
      env: identityEnv(),
      scope: scope(business),
      store,
      send: port.send,
      from: DEPLOYMENT_FROM,
      inviteUrl: async () => CTA,
    }
    const [result] = await invitePeople(deps, [invitee.id])
    expect(result.status).toBe('sent')
    expect(port.sent[0].from).toBe(INVITE_FROM)
    expect((await messagesFor(store, invitee.id))[0].from).toBe(INVITE_FROM)

    // A newer invite template with no `from`, then one with a blank `from`:
    // both send from MAIL_FROM, message and record alike.
    for (const from of [undefined, '   ']) {
      await tick()
      await store.create({
        type: TEMPLATE_TYPE,
        title: 'Invite, own words',
        fields: {
          template_key: 'invite',
          subject: 'Come in',
          placeholders: ['cta_url'],
          ...(from === undefined ? {} : { from }),
        },
        body: '<p>Come in: <a href="{{cta_url}}">open your account</a></p>',
      })
      const contact = (await addContact(identityEnv(), scope(business), { email: anEmail() })).person
      const p = recordingPort()
      await invitePeople({ ...deps, send: p.send }, [contact.id])
      expect(p.sent[0].from, `from=${JSON.stringify(from)}`).toBe(DEPLOYMENT_FROM)
      expect((await messagesFor(store, contact.id))[0].from).toBe(DEPLOYMENT_FROM)
    }

    // A sign-in link comes from MAIL_FROM, never from the invite address.
    const signinBusiness = 'story7d25-ac2371-signin'
    const signinStore = await storeOf(signinBusiness)
    const email = anEmail()
    const member = (await addContact(identityEnv(), scope(signinBusiness), { email })).person
    const signin = recordingPort()
    await signInMailer({
      env: { ...identityEnv(), TENANT_ID: signinBusiness },
      tenantId: signinBusiness,
      store: signinStore,
      send: signin.send,
      from: DEPLOYMENT_FROM,
    })({ to: email, url: CTA })
    expect(signin.sent[0].from).toBe(DEPLOYMENT_FROM)
    expect(signin.sent[0].from).not.toBe(INVITE_FROM)
    expect((await messagesFor(signinStore, member.id))[0].from).toBe(DEPLOYMENT_FROM)

    // Through the Worker: the invite form's draft shows the template's address
    // (not the fallback), and a forged `from` on the send is ignored.
    stubJwks()
    const owner = anEmail()
    const seeded = await inviteAccount(identityEnv(), {
      email: owner,
      accountName: 'A Business',
      endsAt: null,
    })
    await acceptTerms(identityEnv(), seeded.user.id)
    const url = `https://app.example/b/${seeded.businessId}${PERSON_INVITE_PATH}`

    const draftResponse = await worker.fetch(
      new Request(url, { headers: { 'cf-access-jwt-assertion': await mint(owner) } }),
      workerEnv(),
    )
    expect(draftResponse.status).toBe(200)
    const draft = (await draftResponse.json()) as { from: string }
    expect(draft.from).toBe(INVITE_FROM)

    const ownerStore = await storeOf(seeded.businessId)
    const target = (await addContact(identityEnv(), scope(seeded.businessId), {
      email: anEmail(),
    })).person
    const sendResponse = await worker.fetch(
      new Request(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cf-access-jwt-assertion': await mint(owner),
        },
        body: JSON.stringify({
          ids: [target.id],
          from: 'attacker@example.com',
          subject: 'Edited subject',
          body: '<p>Edited: <a href="{{cta_url}}">come in</a></p>',
        }),
      }),
      workerEnv(),
    )
    expect(sendResponse.status).toBe(200)
    const [record] = await messagesFor(ownerStore, target.id)
    expect(record, 'the invite recorded nothing').toBeTruthy()
    expect(record.from).toBe(INVITE_FROM)
    expect(record.from).not.toContain('attacker@example.com')
  })

  it('test_UAT_AC2282_template_type_requires_key_subject_body_with_optional_placeholders_and_from', async () => {
    const pack = productTypePack()
    expect(pack.has(TEMPLATE_TYPE)).toBe(true)
    const schema = pack.schema(TEMPLATE_TYPE) as {
      fields: Record<string, { type?: string; enum?: string[]; required?: boolean }>
      body: { required?: boolean; non_empty?: boolean }
    }
    expect(schema.fields.template_key).toMatchObject({
      type: 'enum',
      enum: ['invite', 'signin', 'lapsed'],
      required: true,
    })
    expect(schema.fields.subject).toMatchObject({ type: 'string', required: true })
    expect(schema.fields.placeholders?.type).toBe('list')
    expect(schema.fields.placeholders?.required ?? false).toBe(false)
    expect(schema.fields.from?.type).toBe('string')
    expect(schema.fields.from?.required ?? false).toBe(false)
    expect(schema.body).toMatchObject({ required: true, non_empty: true })

    const store = await storeOf('story7d25-ac2282-req205')
    const body = '<p><a href="{{cta_url}}">Go</a></p><p>{{cta_url}}</p>'
    const valid = [
      { title: 'With placeholders', fields: { template_key: 'invite', subject: 'Hi', placeholders: ['cta_url'] }, body },
      { title: 'Without placeholders', fields: { template_key: 'lapsed', subject: 'Bye' }, body: '<p>Ended.</p>' },
      { title: 'With from', fields: { template_key: 'invite', subject: 'Hi', placeholders: ['cta_url'], from: INVITE_FROM }, body },
      { title: 'Without from', fields: { template_key: 'signin', subject: 'Sign in', placeholders: ['cta_url'] }, body },
    ]
    for (const attempt of valid) {
      const { ticket } = await store.create({ type: TEMPLATE_TYPE, ...attempt })
      expect(ticket.fields.template_key, attempt.title).toBe(attempt.fields.template_key)
    }
    const stored = await templatesIn(store)
    expect(stored).toHaveLength(4)
    expect(stored.filter((t) => t.fields.from === INVITE_FROM)).toHaveLength(1)

    const invalid = [
      { title: 'No key', fields: { subject: 'Hi' }, body },
      { title: 'Wrong key', fields: { template_key: 'sign-in', subject: 'Hi' }, body },
      { title: 'No subject', fields: { template_key: 'signin' }, body },
      { title: 'Empty body', fields: { template_key: 'signin', subject: 'Hi' }, body: '' },
    ]
    for (const attempt of invalid) {
      await expect(store.create({ type: TEMPLATE_TYPE, ...attempt }), attempt.title).rejects.toThrow()
    }
    expect(await templatesIn(store)).toHaveLength(4)
  })

  it('test_UAT_AC2286_seeded_templates_are_neutral_with_button_and_pasteable_url_and_invite_names_its_sender', async () => {
    const store = await storeOf('story7d25-ac2286-req205')
    const seeded = await ensureTemplates(store)
    expect(seeded.map((t) => t.fields.template_key)).toEqual(['invite', 'signin', 'lapsed'])

    for (const t of seeded) {
      const subject = String(t.fields.subject)
      expect(subject.trim()).not.toBe('')
      expect(t.fields.placeholders).toEqual(['cta_url'])
      const tokens = new Set(
        [...`${subject}\n${t.body}`.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)].map((m) => m[1]),
      )
      expect([...tokens]).toEqual(['cta_url'])
      // Neutrality applies to the copy, not to the address field.
      expect(t.body).not.toMatch(/1st ?Contact/i)
      expect(subject).not.toMatch(/1st ?Contact/i)

      const anchor = t.body.match(/<a\s[^>]*href="\{\{cta_url\}\}"[^>]*>/)
      expect(anchor, `${t.fields.template_key} has no button`).not.toBeNull()
      expect(anchor![0]).toMatch(/style="[^"]+"/)
      const after = t.body.slice(t.body.indexOf('</a>', t.body.indexOf(anchor![0])))
      expect(after).toContain('{{cta_url}}')
      expect(after).toMatch(/copy/i)
      expect(after).toMatch(/paste/i)

      const url = 'https://app.example/i/ac2286'
      const rendered = renderTemplate(t, { cta_url: url })
      expect(rendered.body).not.toContain('{{')
    }

    const [invite, signin, lapsed] = seeded
    expect(invite.body.slice(0, invite.body.indexOf('<a '))).toMatch(/invited/i)
    expect(invite.fields.from).toBe(INVITE_FROM)
    expect(copyOf(invite).from).toBe(INVITE_FROM)
    expect(signin.fields.from).toBeUndefined()
    expect(lapsed.fields.from).toBeUndefined()
    expect(copyOf(signin).from).toBeUndefined()
    expect(copyOf(lapsed).from).toBeUndefined()
  })
})
