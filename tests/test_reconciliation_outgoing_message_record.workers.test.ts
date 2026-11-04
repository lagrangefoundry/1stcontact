import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import {
  EMAIL_WEBHOOK_PATH,
  WEBHOOK_TOLERANCE_SECONDS,
  handleEmailWebhook,
  signWebhook,
  type EmailWebhookEnv,
} from '../apps/control-app/src/email-webhook'
import {
  EMAIL_TYPE,
  messagesFor,
  sendRecordedEmail,
  type MessageRecord,
  type OutgoingMessage,
} from '../apps/control-app/src/messages'
import type { Message, SendEmail } from '../apps/control-app/src/mail'
import {
  PEOPLE_PATH,
  PERSON_MESSAGES_PATH,
  route,
  type RouterEnv,
} from '../apps/control-app/src/router'
import {
  productTypePack,
  ticketStoreFor,
  type Ticket,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { TEMPLATE_TYPE, renderTemplate, templateFor } from '../apps/control-app/src/templates'
import { applySchema } from './support/d1-site-factory'

/**
 * Reconciliation UATs for story-219b4217 — **the outgoing message record**
 * ([[REQ-198]]), the workerd half.
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs against a real D1 + R2 with the
 * deployed baseline applied. Sends go through the shipped `sendRecordedEmail`
 * with a stub sender (the port is passed in, so the stub IS the boundary).
 * Provider events go through `handleEmailWebhook`, signed by the shipped
 * `signWebhook` (itself pinned to the published Standard Webhooks vector in the
 * REQ-198 FC suite), and — for the reachability AC — through the Worker's own
 * top-level `fetch` with Access live. The Contacts reads go through `route`,
 * the router the Worker calls, with a resolved business scope. Every "writes
 * nothing" claim is asserted by reading the record back.
 */

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw'
const OTHER_SECRET = 'whsec_AAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const PLATFORM = 'story219b-platform'
const TEAM = 'https://story219b-team.cloudflareaccess.com'
const AUD = 'f'.repeat(64)

const storeEnv = (): TicketStoreEnv => ({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket })
const storeOf = (businessId: string): Promise<TicketStore> => ticketStoreFor(storeEnv(), { businessId })

function hookEnv(over: Partial<EmailWebhookEnv> = {}): EmailWebhookEnv {
  return { ...storeEnv(), EMAIL_WEBHOOK_SECRET: SECRET, ...over }
}

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as RouterEnv
}

/** GET a Contacts read through the router, in one business's scope. */
async function readAs(businessId: string, url: string): Promise<Response> {
  return route(new Request(`https://app.test${url}`), routerEnv(), { businessId })
}

let seq = 0
const next = () => (seq += 1)

function outgoing(over: Partial<OutgoingMessage> = {}): OutgoingMessage {
  const n = next()
  return {
    contactId: `usr_s219b_${n}`,
    addressId: `uem_s219b_${n}`,
    templateKey: 'invite',
    templateUid: `tpl_s219b_${n}`,
    subject: `Subject ${n}`,
    from: 'no-reply@1stcontact.io',
    to: `s219b-${n}@example.test`,
    body: `<p>Body ${n}</p>`,
    ...over,
  }
}

/** A capturing stub sender that answers with `providerId`. */
function capturing(providerId: string) {
  const calls: Message[] = []
  const send: SendEmail = async (message) => {
    calls.push({ ...message })
    return { providerId }
  }
  return { send, calls }
}

const accepts = (providerId: string): SendEmail => capturing(providerId).send

async function emailTickets(store: TicketStore, contactId?: string): Promise<Ticket[]> {
  const predicate = contactId
    ? `type="${EMAIL_TYPE}" AND fields.contact_id="${contactId}"`
    : `type="${EMAIL_TYPE}"`
  return (await store.query({ predicate, limit: 'all' })).tickets
}

/** One record, read back through a FRESH handle so the row is asserted. */
async function recordOf(businessId: string, contactId: string): Promise<MessageRecord> {
  const found = await messagesFor(await storeOf(businessId), contactId)
  expect(found).toHaveLength(1)
  return found[0]
}

/** A message already sent in `businessId`, awaiting delivery events. */
async function sentIn(businessId: string, providerId: string) {
  const message = outgoing()
  const record = await sendRecordedEmail(await storeOf(businessId), message, accepts(providerId))
  return { message, record }
}

function payloadFor(type: string, emailId: string | null, bounceMessage?: string): string {
  return JSON.stringify({
    type,
    created_at: '2026-11-04T10:00:00.000Z',
    data: {
      ...(emailId === null ? {} : { email_id: emailId }),
      to: ['someone@example.test'],
      from: 'no-reply@1stcontact.io',
      ...(bounceMessage ? { bounce: { message: bounceMessage, type: 'Permanent' } } : {}),
    },
  })
}

interface SignOpts {
  secret?: string
  at?: number
  timestamp?: string
  prefix?: 'webhook' | 'svix'
  signatureHeader?: (good: string) => string
  body?: string
}

/** A request signed the way the provider signs one. */
async function signed(payload: string, opts: SignOpts = {}): Promise<Request> {
  const id = `msg_s219b_${next()}`
  const timestamp = opts.timestamp ?? String(Math.floor((opts.at ?? Date.now()) / 1000))
  const signature = await signWebhook(opts.secret ?? SECRET, id, timestamp, payload)
  const prefix = opts.prefix ?? 'webhook'
  const header = opts.signatureHeader ? opts.signatureHeader(signature) : `v1,${signature}`
  return new Request(`https://app.example${EMAIL_WEBHOOK_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [`${prefix}-id`]: id,
      [`${prefix}-timestamp`]: timestamp,
      [`${prefix}-signature`]: header,
    },
    body: opts.body ?? payload,
  })
}

async function post(request: Request, over: Partial<EmailWebhookEnv> = {}) {
  const result = await handleEmailWebhook(request, hookEnv(over))
  return { status: result.response.status, text: await result.response.text() }
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('story-219b4217 — the email record type', () => {
  it('test_UAT_AC2287_email_type_is_registered_with_its_field_contract_and_refuses_a_record_without_an_address', async () => {
    const pack = productTypePack()
    expect(pack.has(EMAIL_TYPE)).toBe(true)
    const schema = pack.schema(EMAIL_TYPE) as {
      fields: Record<string, { type?: string; enum?: string[]; required?: boolean; default?: unknown }>
      body: { required?: boolean; non_empty?: boolean }
    }
    const f = schema.fields
    expect(Object.keys(f).sort()).toEqual(
      [
        'address_id',
        'contact_id',
        'failure',
        'from',
        'provider_id',
        'queued_at',
        'sent_at',
        'status',
        'subject',
        'template_key',
        'template_uid',
        'to',
      ].sort(),
    )
    // Identity keys are plain strings, not ticket references.
    for (const name of ['contact_id', 'address_id', 'template_key', 'subject', 'from', 'to', 'queued_at']) {
      expect(f[name], name).toMatchObject({ type: 'string', required: true })
    }
    for (const name of ['template_uid', 'provider_id', 'sent_at', 'failure']) {
      expect(f[name].type, name).toBe('string')
      expect(f[name].required ?? false, name).toBe(false)
    }
    expect(f.status).toMatchObject({ type: 'enum', default: 'queued' })
    expect(f.status.enum).toEqual(['queued', 'sent', 'delivered', 'bounced', 'failed'])
    expect(schema.body.required).toBe(true)
    expect(schema.body.non_empty ?? false).toBe(false)

    // A record naming no address is refused, and nothing is written.
    const store = await storeOf('s219b-ac2287')
    await expect(
      store.create({
        type: EMAIL_TYPE,
        title: 'No address',
        fields: {
          contact_id: 'usr_ac2287',
          template_key: 'invite',
          subject: 'Hi',
          from: 'no-reply@1stcontact.io',
          to: 'ac2287@example.test',
          status: 'queued',
          queued_at: new Date().toISOString(),
        },
        body: 'text',
      }),
    ).rejects.toThrow(/address_id/)
    expect(await emailTickets(store)).toEqual([])

    // An empty body is still a writable record (required, may be empty).
    const { ticket } = await store.create({
      type: EMAIL_TYPE,
      title: 'Empty body',
      fields: {
        contact_id: 'usr_ac2287',
        address_id: 'uem_ac2287',
        template_key: 'invite',
        subject: 'Hi',
        from: 'no-reply@1stcontact.io',
        to: 'ac2287@example.test',
        queued_at: new Date().toISOString(),
      },
      body: '',
    })
    expect(ticket.fields.status).toBe('queued')
  })
})

describe('story-219b4217 — queue, send, update', () => {
  it('test_UAT_AC2288_record_is_queued_naming_contact_and_address_before_the_sender_is_called', async () => {
    const business = 's219b-ac2288'
    const store = await storeOf(business)

    for (const subject of ['Welcome aboard', '', '   ']) {
      const message = outgoing({ subject })
      let atCallTime: Ticket[] | null = null
      const observing: SendEmail = async () => {
        atCallTime = await emailTickets(await storeOf(business), message.contactId)
        return { providerId: `prov_ac2288_${next()}` }
      }
      await sendRecordedEmail(store, message, observing)

      expect(atCallTime, `subject=${JSON.stringify(subject)}`).not.toBeNull()
      const seen = atCallTime as unknown as Ticket[]
      expect(seen).toHaveLength(1)
      const fields = seen[0].fields as Record<string, unknown>
      expect(fields.status).toBe('queued')
      expect(typeof fields.queued_at).toBe('string')
      expect(String(fields.queued_at)).not.toBe('')
      expect(fields.contact_id).toBe(message.contactId)
      expect(fields.address_id).toBe(message.addressId)
      expect(fields.template_key).toBe(message.templateKey)
      expect(fields.from).toBe(message.from)
      expect(fields.to).toBe(message.to)
      expect(seen[0].body).toBe(message.body)
      expect(fields.provider_id ?? null).toBeNull()

      // The subject is kept as given; an empty one titles the record "(no subject)".
      if (subject.trim() === '') {
        expect(seen[0].title).toBe('(no subject)')
        expect(fields.subject ?? '').toBe(subject)
      } else {
        expect(fields.subject).toBe(subject)
      }

      // After the call, the same contact/address pair is on the record.
      const after = await recordOf(business, message.contactId)
      expect(after.contactId).toBe(message.contactId)
      expect(after.addressId).toBe(message.addressId)
    }
  })

  it('test_UAT_AC2289_successful_send_moves_the_same_record_to_sent_with_provider_id_and_send_time', async () => {
    const business = 's219b-ac2289'
    const store = await storeOf(business)
    const message = outgoing()
    const stub = capturing('prov_ac2289')
    let queuedUid = ''
    const send: SendEmail = async (m) => {
      queuedUid = (await emailTickets(store, message.contactId))[0].uid
      return stub.send(m)
    }

    const returned = await sendRecordedEmail(store, message, send)

    expect(returned.uid).toBe(queuedUid)
    expect(returned.status).toBe('sent')
    expect(returned.providerId).toBe('prov_ac2289')
    expect(returned.sentAt).toBeTruthy()

    const stored = await recordOf(business, message.contactId)
    expect(stored.uid).toBe(queuedUid)
    expect(stored.status).toBe('sent')
    expect(stored.providerId).toBe('prov_ac2289')
    expect(stored.sentAt).toBeTruthy()

    expect(stub.calls).toEqual([
      { to: message.to, from: message.from, subject: message.subject, body: message.body },
    ])
  })

  it('test_UAT_AC2290_failed_send_resolves_with_a_failed_record_carrying_the_reason', async () => {
    const business = 's219b-ac2290'
    const store = await storeOf(business)
    const message = outgoing()
    let queuedUid = ''
    const refusing: SendEmail = async () => {
      queuedUid = (await emailTickets(store, message.contactId))[0].uid
      throw new Error('domain not verified')
    }

    // Resolves rather than rejects.
    const returned = await sendRecordedEmail(store, message, refusing)
    expect(returned.status).toBe('failed')
    expect(returned.failure).toBe('domain not verified')
    expect(returned.uid).toBe(queuedUid)

    const tickets = await emailTickets(await storeOf(business), message.contactId)
    expect(tickets).toHaveLength(1)
    const fields = tickets[0].fields as Record<string, unknown>
    expect(tickets[0].uid).toBe(queuedUid)
    expect(fields.status).toBe('failed')
    expect(fields.failure).toBe('domain not verified')
    expect(fields.provider_id ?? null).toBeNull()
    expect(fields.sent_at ?? null).toBeNull()
  })

  it('test_UAT_AC2291_stored_body_is_the_rendered_text_and_survives_a_later_template_change', async () => {
    const business = 's219b-ac2291'
    const store = await storeOf(business)
    const url = 'https://app.example/i/ac2291'

    const first = renderTemplate(await templateFor(store, 'invite'), { cta_url: url })
    const message = outgoing({
      templateKey: first.templateKey,
      templateUid: first.templateUid,
      subject: first.subject,
      body: first.body,
    })
    const stub = capturing('prov_ac2291')
    await sendRecordedEmail(store, message, stub.send)
    expect(stub.calls[0].body).toBe(first.body)

    // Replace the template with different copy and render again.
    await new Promise((r) => setTimeout(r, 5))
    await store.create({
      type: TEMPLATE_TYPE,
      title: 'Invite (rewritten)',
      fields: { template_key: 'invite', subject: 'Rewritten', placeholders: ['cta_url'] },
      body: '<p>Entirely new copy. <a href="{{cta_url}}">Go</a></p><p>{{cta_url}}</p>',
    })
    const second = renderTemplate(await templateFor(store, 'invite'), { cta_url: url })
    expect(second.templateUid).not.toBe(first.templateUid)
    expect(second.body).not.toBe(first.body)

    const stored = await recordOf(business, message.contactId)
    expect(stored.body).toBe(first.body)
    expect(stored.body).not.toBe(second.body)
    expect(stored.templateKey).toBe('invite')
    expect(stored.templateUid).toBe(first.templateUid)

    // Without a template uid the message is still recorded, with none.
    const bare = outgoing({ templateUid: undefined })
    await sendRecordedEmail(store, bare, accepts('prov_ac2291_bare'))
    const bareRecord = await recordOf(business, bare.contactId)
    expect(bareRecord.templateUid).toBeNull()
    expect(bareRecord.status).toBe('sent')
  })

  it('test_UAT_AC2292_sending_goes_only_through_the_sender_passed_in', async () => {
    // No provider credential in this runtime.
    expect(((env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY ?? '').trim()).toBe('')
    const network = vi.spyOn(globalThis, 'fetch')

    const business = 's219b-ac2292'
    const store = await storeOf(business)
    const a = capturing('prov_ac2292_a')
    const b = capturing('prov_ac2292_b')

    const one = outgoing()
    const viaA = await sendRecordedEmail(store, one, a.send)
    expect(a.calls).toEqual([{ to: one.to, from: one.from, subject: one.subject, body: one.body }])
    expect(viaA.status).toBe('sent')
    expect(viaA.providerId).toBe('prov_ac2292_a')

    const two = outgoing()
    const viaB = await sendRecordedEmail(store, two, b.send)
    expect(b.calls).toEqual([{ to: two.to, from: two.from, subject: two.subject, body: two.body }])
    expect(a.calls).toHaveLength(1)
    expect(viaB.providerId).toBe('prov_ac2292_b')

    expect(network).not.toHaveBeenCalled()
  })
})

describe('story-219b4217 — the delivery webhook', () => {
  it('test_UAT_AC2293_verified_delivery_and_bounce_land_on_the_record_in_the_business_that_sent_it', async () => {
    const first = 's219b-ac2293-a'
    const second = 's219b-ac2293-b'
    const inFirst = await sentIn(first, 'prov_ac2293_first')
    const inSecond = await sentIn(second, 'prov_ac2293_second')

    const bounced = await post(
      await signed(payloadFor('email.bounced', 'prov_ac2293_second', 'mailbox does not exist')),
    )
    expect(bounced.status).toBe(200)
    const after = await recordOf(second, inSecond.message.contactId)
    expect(after.status).toBe('bounced')
    expect(after.failure).toBe('mailbox does not exist')
    expect(after.addressId).toBe(inSecond.message.addressId)
    expect(after.contactId).toBe(inSecond.message.contactId)
    expect(await recordOf(first, inFirst.message.contactId)).toEqual(inFirst.record)

    const delivered = await post(await signed(payloadFor('email.delivered', 'prov_ac2293_first')))
    expect(delivered.status).toBe(200)
    expect((await recordOf(first, inFirst.message.contactId)).status).toBe('delivered')
    expect((await recordOf(second, inSecond.message.contactId)).status).toBe('bounced')
  })

  it('test_UAT_AC2294_missing_or_unverifiable_signature_is_refused_identically_and_writes_nothing', async () => {
    const business = 's219b-ac2294'
    const { message, record } = await sentIn(business, 'prov_ac2294')
    const payload = payloadFor('email.bounced', 'prov_ac2294', 'forged')
    const unchanged = async () => expect(await recordOf(business, message.contactId)).toEqual(record)

    // Wrong key.
    expect(await post(await signed(payload, { secret: OTHER_SECRET }))).toEqual({
      status: 401,
      text: 'Refused.',
    })
    await unchanged()

    // Each header missing in turn, and all of them.
    const good = await signed(payload)
    for (const drop of [['webhook-id'], ['webhook-timestamp'], ['webhook-signature'], ['webhook-id', 'webhook-timestamp', 'webhook-signature']]) {
      const headers = new Headers(good.headers)
      for (const h of drop) headers.delete(h)
      const req = new Request(good.url, { method: 'POST', headers, body: payload })
      expect(await post(req), drop.join(',')).toEqual({ status: 401, text: 'Refused.' })
    }
    await unchanged()

    // Same JSON re-serialised in a different key order, original signature.
    const reordered = JSON.stringify({ data: JSON.parse(payload).data, type: 'email.bounced' })
    expect(reordered).not.toBe(payload)
    expect(await post(await signed(payload, { body: reordered }))).toEqual({
      status: 401,
      text: 'Refused.',
    })
    // One byte altered.
    expect(await post(await signed(payload, { body: payload.replace('forged', 'forgee') }))).toEqual({
      status: 401,
      text: 'Refused.',
    })
    await unchanged()

    // Rotation: a wrong signature listed first, the correct one second, is accepted.
    const wrong = await signWebhook(OTHER_SECRET, 'x', '0', payload)
    const rotated = await post(
      await signed(payload, { signatureHeader: (sig) => `v1,${wrong} v1,${sig}` }),
    )
    expect(rotated.status).toBe(200)
    expect((await recordOf(business, message.contactId)).status).toBe('bounced')

    // The `svix-` header prefix is accepted too.
    const other = await sentIn(business, 'prov_ac2294_svix')
    const svix = await post(
      await signed(payloadFor('email.delivered', 'prov_ac2294_svix'), { prefix: 'svix' }),
    )
    expect(svix.status).toBe(200)
    expect((await recordOf(business, other.message.contactId)).status).toBe('delivered')
  })

  it('test_UAT_AC2295_signed_request_outside_the_five_minute_window_is_refused', async () => {
    const business = 's219b-ac2295'
    const { message, record } = await sentIn(business, 'prov_ac2295')
    const payload = payloadFor('email.bounced', 'prov_ac2295', 'replayed')
    const skew = (WEBHOOK_TOLERANCE_SECONDS + 1) * 1000
    expect(WEBHOOK_TOLERANCE_SECONDS).toBe(300)

    for (const opts of [
      { at: Date.now() - skew - 1000 },
      { at: Date.now() + skew + 1000 },
      { timestamp: 'not-a-number' },
    ] as SignOpts[]) {
      expect(await post(await signed(payload, opts)), JSON.stringify(opts)).toEqual({
        status: 401,
        text: 'Refused.',
      })
      expect(await recordOf(business, message.contactId)).toEqual(record)
    }

    // Within the window: applied.
    const ok = await post(await signed(payload, { at: Date.now() - 60_000 }))
    expect(ok.status).toBe(200)
    expect((await recordOf(business, message.contactId)).status).toBe('bounced')
  })

  it('test_UAT_AC2296_with_no_signing_secret_every_request_is_refused', async () => {
    const business = 's219b-ac2296'
    const { message, record } = await sentIn(business, 'prov_ac2296')
    const payload = payloadFor('email.bounced', 'prov_ac2296', 'should not land')

    for (const over of [{ EMAIL_WEBHOOK_SECRET: undefined }, { EMAIL_WEBHOOK_SECRET: '' }, { EMAIL_WEBHOOK_SECRET: '   ' }]) {
      // Signed under some key — even the one a configured deployment would use.
      for (const secret of [SECRET, OTHER_SECRET]) {
        expect(await post(await signed(payload, { secret }), over)).toEqual({
          status: 401,
          text: 'Refused.',
        })
      }
    }
    expect(await recordOf(business, message.contactId)).toEqual(record)
  })

  it('test_UAT_AC2297_verified_but_malformed_body_is_400_and_bad_signature_wins_over_parsing', async () => {
    const business = 's219b-ac2297'
    const { message, record } = await sentIn(business, 'prov_ac2297')

    expect(await post(await signed('not json at all'))).toEqual({ status: 400, text: 'Refused.' })
    expect(await post(await signed(payloadFor('email.bounced', null, 'no id')))).toEqual({
      status: 400,
      text: 'Refused.',
    })
    expect(await post(await signed(payloadFor('email.delivered', '')))).toEqual({
      status: 400,
      text: 'Refused.',
    })
    // The same malformed body with a bad signature is a 401, not a 400.
    expect(await post(await signed('not json at all', { secret: OTHER_SECRET }))).toEqual({
      status: 401,
      text: 'Refused.',
    })
    expect(await recordOf(business, message.contactId)).toEqual(record)
  })

  it('test_UAT_AC2298_verified_event_for_an_unknown_message_is_404_and_writes_nothing', async () => {
    const a = 's219b-ac2298-a'
    const b = 's219b-ac2298-b'
    const { message, record } = await sentIn(a, 'prov_ac2298_known')
    await sentIn(b, 'prov_ac2298_known_b')
    const countIn = async (id: string) => (await emailTickets(await storeOf(id))).length
    const before = [await countIn(a), await countIn(b)]

    for (const type of ['email.bounced', 'email.delivered']) {
      expect(await post(await signed(payloadFor(type, 'prov_ac2298_never_sent', 'x')))).toEqual({
        status: 404,
        text: 'No such message.',
      })
    }
    expect([await countIn(a), await countIn(b)]).toEqual(before)
    expect(await recordOf(a, message.contactId)).toEqual(record)
  })

  it('test_UAT_AC2299_verified_non_delivery_events_are_acknowledged_and_change_nothing', async () => {
    const business = 's219b-ac2299'
    const { message } = await sentIn(business, 'prov_ac2299')
    expect(
      (await post(await signed(payloadFor('email.bounced', 'prov_ac2299', 'mailbox full')))).status,
    ).toBe(200)
    const bounced = await recordOf(business, message.contactId)
    expect(bounced.status).toBe('bounced')

    for (const type of ['email.sent', 'email.opened', 'email.clicked', 'email.delivery_delayed']) {
      expect(await post(await signed(payloadFor(type, 'prov_ac2299'))), type).toEqual({
        status: 200,
        text: 'Ignored.',
      })
      expect(await recordOf(business, message.contactId)).toEqual(bounced)
    }
  })
})

describe('story-219b4217 — the webhook sits ahead of the Access gate', () => {
  function workerEnv(): Env {
    return {
      ...storeEnv(),
      SITES: env.SITES as R2Bucket,
      TENANT_ID: PLATFORM,
      ACCESS_DEV_OPEN: '',
      // CONFIGURED, so the gate is live for every other route.
      ACCESS_TEAM_DOMAIN: TEAM,
      ACCESS_AUD: AUD,
      EMAIL_WEBHOOK_SECRET: SECRET,
      ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    } as Env
  }

  async function snapshot(response: Response) {
    return { status: response.status, text: await response.text() }
  }

  it('test_UAT_AC2300_signed_post_reaches_the_webhook_without_access_while_other_routes_stay_gated', async () => {
    const business = 's219b-ac2300'
    const { message } = await sentIn(business, 'prov_ac2300')

    // The gate's own unauthenticated refusal, as any gated route gets it.
    const gated = await snapshot(
      await worker.fetch(new Request(`https://app.example${PEOPLE_PATH}`), workerEnv()),
    )
    expect(gated.status).toBeGreaterThanOrEqual(400)
    expect(gated.status).not.toBe(404)

    // A signed POST with no Access token reaches the webhook and is applied.
    const applied = await worker.fetch(
      await signed(payloadFor('email.delivered', 'prov_ac2300')),
      workerEnv(),
    )
    expect(applied.status).toBe(200)
    expect((await recordOf(business, message.contactId)).status).toBe('delivered')

    // GET on the same path, and a POST to a sibling under /api/email/, are refused by the gate.
    const get = await snapshot(
      await worker.fetch(
        new Request(`https://app.example${EMAIL_WEBHOOK_PATH}`, { method: 'GET' }),
        workerEnv(),
      ),
    )
    const signedSibling = await signed(payloadFor('email.bounced', 'prov_ac2300', 'x'))
    const sibling = await snapshot(
      await worker.fetch(
        new Request('https://app.example/api/email/other', {
          method: 'POST',
          headers: signedSibling.headers,
          body: await signedSibling.text(),
        }),
        workerEnv(),
      ),
    )
    const nested = await snapshot(
      await worker.fetch(
        new Request(`https://app.example${EMAIL_WEBHOOK_PATH}/anything`, { method: 'POST', body: '{}' }),
        workerEnv(),
      ),
    )
    expect(get).toEqual(gated)
    expect(sibling).toEqual(gated)
    expect(nested).toEqual(gated)
    expect((await recordOf(business, message.contactId)).status).toBe('delivered')
  })
})

describe('story-219b4217 — the Contacts reads', () => {
  const at = (iso: string) => () => iso

  it('test_UAT_AC2301_messages_read_returns_the_contacts_messages_newest_first_with_subject_time_status_failure', async () => {
    const business = 's219b-ac2301'
    const store = await storeOf(business)
    const contactId = 'usr_s219b_ac2301'
    const base = { contactId, addressId: 'uem_s219b_ac2301' }

    await sendRecordedEmail(
      store,
      outgoing({ ...base, subject: 'Sent one' }),
      accepts('prov_ac2301_sent'),
      at('2026-09-02T09:00:00.000Z'),
    )
    await sendRecordedEmail(
      store,
      outgoing({ ...base, subject: 'Failed one' }),
      async () => {
        throw new Error('domain not verified')
      },
      at('2026-09-01T09:00:00.000Z'),
    )
    await sendRecordedEmail(
      store,
      outgoing({ ...base, subject: 'Bounced one' }),
      accepts('prov_ac2301_bounced'),
      at('2026-09-03T09:00:00.000Z'),
    )
    await post(await signed(payloadFor('email.bounced', 'prov_ac2301_bounced', 'no such mailbox')))

    const response = await readAs(business, `${PERSON_MESSAGES_PATH}?id=${contactId}`)
    expect(response.status).toBe(200)
    const { messages } = (await response.json()) as { messages: MessageRecord[] }
    expect(
      messages.map((m) => ({
        subject: m.subject,
        queuedAt: m.queuedAt,
        status: m.status,
        failure: m.failure,
      })),
    ).toEqual([
      {
        subject: 'Bounced one',
        queuedAt: '2026-09-03T09:00:00.000Z',
        status: 'bounced',
        failure: 'no such mailbox',
      },
      { subject: 'Sent one', queuedAt: '2026-09-02T09:00:00.000Z', status: 'sent', failure: null },
      {
        subject: 'Failed one',
        queuedAt: '2026-09-01T09:00:00.000Z',
        status: 'failed',
        failure: 'domain not verified',
      },
    ])
  })

  it('test_UAT_AC2302_messages_read_answers_200_with_an_empty_list_for_no_unknown_or_foreign_contact', async () => {
    const mine = 's219b-ac2302-a'
    const theirs = 's219b-ac2302-b'
    const { message: foreign } = await sentIn(theirs, 'prov_ac2302_theirs')
    await storeOf(mine)

    for (const id of ['usr_s219b_never_existed', foreign.contactId, '']) {
      const response = await readAs(mine, `${PERSON_MESSAGES_PATH}?id=${encodeURIComponent(id)}`)
      expect(response.status, id).toBe(200)
      expect(await response.json(), id).toEqual({ messages: [] })
    }
    // No id parameter at all: the same empty answer.
    const bare = await readAs(mine, PERSON_MESSAGES_PATH)
    expect(bare.status).toBe(200)
    expect(await bare.json()).toEqual({ messages: [] })
  })

  it('test_UAT_AC2303_one_businesss_messages_and_bounces_never_appear_through_another', async () => {
    const a = 's219b-ac2303-a'
    const b = 's219b-ac2303-b'
    const inA = await sentIn(a, 'prov_ac2303_a')
    const inB = await sentIn(b, 'prov_ac2303_b')
    await post(await signed(payloadFor('email.bounced', 'prov_ac2303_a', 'bad a')))
    await post(await signed(payloadFor('email.bounced', 'prov_ac2303_b', 'bad b')))

    // In A's scope, B's contact has no messages.
    const foreign = await readAs(a, `${PERSON_MESSAGES_PATH}?id=${inB.message.contactId}`)
    expect(await foreign.json()).toEqual({ messages: [] })
    // A's own contact is visible in A.
    const own = (await (
      await readAs(a, `${PERSON_MESSAGES_PATH}?id=${inA.message.contactId}`)
    ).json()) as { messages: MessageRecord[] }
    expect(own.messages.map((m) => m.status)).toEqual(['bounced'])

    // Each business's bounced set holds only its own contact.
    const peopleA = (await (await readAs(a, PEOPLE_PATH)).json()) as { bounced: string[] }
    const peopleB = (await (await readAs(b, PEOPLE_PATH)).json()) as { bounced: string[] }
    expect(peopleA.bounced).toEqual([inA.message.contactId])
    expect(peopleB.bounced).toEqual([inB.message.contactId])

    // B's record is untouched by anything done in A.
    expect((await recordOf(b, inB.message.contactId)).failure).toBe('bad b')
  })

  it('test_UAT_AC2304_people_list_read_reports_each_bounced_contact_once', async () => {
    const business = 's219b-ac2304'
    const store = await storeOf(business)
    const x = { contactId: 'usr_s219b_ac2304_x', addressId: 'uem_s219b_ac2304_x' }
    const y = { contactId: 'usr_s219b_ac2304_y', addressId: 'uem_s219b_ac2304_y' }

    // X: two bounced messages and a delivered one. Y: delivered only.
    await sendRecordedEmail(store, outgoing(x), accepts('prov_ac2304_x1'))
    await sendRecordedEmail(store, outgoing(x), accepts('prov_ac2304_x2'))
    await sendRecordedEmail(store, outgoing(x), accepts('prov_ac2304_x3'))
    await sendRecordedEmail(store, outgoing(y), accepts('prov_ac2304_y1'))
    await post(await signed(payloadFor('email.bounced', 'prov_ac2304_x1', 'gone')))
    await post(await signed(payloadFor('email.bounced', 'prov_ac2304_x2', 'gone')))
    await post(await signed(payloadFor('email.delivered', 'prov_ac2304_x3')))
    await post(await signed(payloadFor('email.delivered', 'prov_ac2304_y1')))

    const response = await readAs(business, PEOPLE_PATH)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { people: unknown[]; bounced: string[] }
    expect(Array.isArray(body.people)).toBe(true)
    expect(body.bounced).toEqual([x.contactId])

    // A business with no bounces reports an empty array.
    const clean = 's219b-ac2304-clean'
    await sentIn(clean, 'prov_ac2304_clean')
    const none = (await (await readAs(clean, PEOPLE_PATH)).json()) as { bounced: string[] }
    expect(none.bounced).toEqual([])
  })
})
