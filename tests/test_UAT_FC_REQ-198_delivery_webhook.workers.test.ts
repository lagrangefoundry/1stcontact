import { beforeAll, describe, expect, it } from 'vitest'
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
import { messagesFor, sendRecordedEmail } from '../apps/control-app/src/messages'
import type { SendEmail } from '../apps/control-app/src/mail'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-198 — **bounces come back and land on the record.**
 *
 * WHAT THIS FILE PROVES. That a provider's delivery and bounce events reach the
 * record of what we sent, and that nothing else does. The endpoint is
 * unauthenticated by necessity — a provider cannot present a Cloudflare Access
 * token — so the signature is the whole of its defence, and the cases below
 * assert both halves of that: a correctly signed event mutates exactly one
 * record, and a request that is unsigned, wrongly signed, stale or unconfigured
 * mutates nothing.
 *
 * WHAT MAKES IT EVIDENCE. The reachability case goes through the WORKER'S OWN
 * `fetch` with Access configured and no token presented — which is the only way
 * to prove the route sits ahead of the gate rather than merely being written
 * before it. The rest drive `handleEmailWebhook` directly against a real D1, and
 * every "writes nothing" claim is asserted by reading the record back rather
 * than by trusting the status code.
 *
 * THE SIGNATURES ARE MADE BY THE SHIPPED SIGNER. A suite that signed some other
 * way would prove this file agrees with the suite; `signWebhook` is exported so
 * the two sides are one implementation, and the scheme itself is pinned by a
 * fixed-secret case below.
 */

const BUSINESS = 'req198-hook-business'
const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw'
const TEAM = 'https://req198-team.cloudflareaccess.com'
const AUD = 'e'.repeat(64)

const storeEnv = () => ({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket })

function hookEnv(overrides: Partial<EmailWebhookEnv> = {}): EmailWebhookEnv {
  return { ...storeEnv(), EMAIL_WEBHOOK_SECRET: SECRET, ...overrides }
}

const storeFor = (businessId = BUSINESS): Promise<TicketStore> =>
  ticketStoreFor(storeEnv(), { businessId })

const accepts = (providerId: string): SendEmail => async () => ({ providerId })

let seq = 0

/** A message that has been sent and is waiting on a delivery event. */
async function sentMessage(providerId: string, businessId = BUSINESS) {
  seq += 1
  const store = await storeFor(businessId)
  const contactId = `usr_req198hook_${seq}`
  const record = await sendRecordedEmail(
    store,
    {
      contactId,
      addressId: `uem_req198hook_${seq}`,
      templateKey: 'invite',
      subject: `Welcome ${seq}`,
      from: 'no-reply@1stcontact.io',
      to: `req198hook-${seq}@example.test`,
      body: 'Welcome.',
    },
    accepts(providerId),
  )
  return { store, contactId, record }
}

/** The provider's own payload shape, as far as this ticket reads it. */
function payloadFor(type: string, emailId: string, bounceMessage?: string): string {
  return JSON.stringify({
    type,
    created_at: '2026-09-06T10:00:00.000Z',
    data: {
      email_id: emailId,
      to: ['someone@example.test'],
      from: 'no-reply@1stcontact.io',
      ...(bounceMessage ? { bounce: { message: bounceMessage, type: 'Permanent' } } : {}),
    },
  })
}

/** A request signed exactly the way the provider signs one. */
async function signedRequest(
  payload: string,
  { secret = SECRET, at = Date.now(), id = `msg_${(seq += 1)}` } = {},
): Promise<Request> {
  const timestamp = String(Math.floor(at / 1000))
  const signature = await signWebhook(secret, id, timestamp, payload)
  return new Request(`https://app.example${EMAIL_WEBHOOK_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': id,
      'webhook-timestamp': timestamp,
      'webhook-signature': `v1,${signature}`,
    },
    body: payload,
  })
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-198 — an event lands on the record', () => {
  it('test_UAT_FC_REQ-198_a_delivery_event_moves_the_record_to_delivered', async () => {
    const { store, contactId } = await sentMessage('prov_deliver_1')
    const request = await signedRequest(payloadFor('email.delivered', 'prov_deliver_1'))
    const result = await handleEmailWebhook(request, hookEnv())

    expect(result.response.status).toBe(200)
    expect(result.outcome?.matched).toBe(true)
    expect((await messagesFor(store, contactId))[0].status).toBe('delivered')
  })

  it('test_UAT_FC_REQ-198_a_bounce_event_moves_the_record_to_bounced_and_keeps_the_address', async () => {
    // THE ADDRESS IS WHAT A BOUNCE IS ABOUT. The record already names it, so the
    // event does not have to — and the reason the provider gave is stored, since
    // a typo and a full mailbox call for opposite actions from the operator.
    const { store, contactId, record } = await sentMessage('prov_bounce_1')
    const request = await signedRequest(
      payloadFor('email.bounced', 'prov_bounce_1', 'mailbox does not exist'),
    )
    await handleEmailWebhook(request, hookEnv())

    const [after] = await messagesFor(store, contactId)
    expect(after.status).toBe('bounced')
    expect(after.addressId).toBe(record.addressId)
    expect(after.failure).toBe('mailbox does not exist')
  })

  it('test_UAT_FC_REQ-198_an_event_finds_its_record_in_whichever_business_sent_it', async () => {
    // THE LOOKUP HAS NO TENANT TO START FROM — the provider knows a message id
    // and nothing about businesses. It is resolved by listing the registry and
    // reading each business through its OWN ordinary scoped handle, so the
    // record is found without any unscoped read existing.
    const other = 'req198-hook-other'
    const { store, contactId } = await sentMessage('prov_other_business', other)
    await handleEmailWebhook(
      await signedRequest(payloadFor('email.delivered', 'prov_other_business')),
      hookEnv(),
    )
    const result = await messagesFor(store, contactId)
    expect(result[0].status).toBe('delivered')
  })

  it('test_UAT_FC_REQ-198_an_untracked_event_type_is_acknowledged_and_writes_nothing', async () => {
    // OPENS AND CLICKS ARE NOT TRACKED, deliberately — a privacy cost with no
    // beta value. And `email.sent` is ignored too: the send path already wrote
    // `sent` from the call that returned the id, so honouring the event would
    // let a slow one overwrite a bounce that arrived first.
    const { store, contactId } = await sentMessage('prov_ignored')
    const result = await handleEmailWebhook(
      await signedRequest(payloadFor('email.opened', 'prov_ignored')),
      hookEnv(),
    )
    expect(result.ignored).toBe(true)
    expect((await messagesFor(store, contactId))[0].status).toBe('sent')
  })
})

describe('REQ-198 — the signature is the whole of the defence', () => {
  it('test_UAT_FC_REQ-198_a_request_whose_signature_does_not_verify_is_refused_and_writes_nothing', async () => {
    const { store, contactId } = await sentMessage('prov_forged')
    const payload = payloadFor('email.bounced', 'prov_forged', 'forged')
    const request = await signedRequest(payload, { secret: 'whsec_AAAAAAAAAAAAAAAAAAAAAAAAAAAA' })

    const result = await handleEmailWebhook(request, hookEnv())
    expect(result.response.status).toBe(401)
    expect(result.refusal).toBe('bad_signature')
    // THE ASSERTION THAT MATTERS is the record, not the status code: a refusal
    // that had already written would be a refusal in name only.
    expect((await messagesFor(store, contactId))[0].status).toBe('sent')
  })

  it('test_UAT_FC_REQ-198_a_request_carrying_no_signature_at_all_is_refused', async () => {
    const request = new Request(`https://app.example${EMAIL_WEBHOOK_PATH}`, {
      method: 'POST',
      body: payloadFor('email.delivered', 'prov_unsigned'),
    })
    const result = await handleEmailWebhook(request, hookEnv())
    expect(result.response.status).toBe(401)
    expect(result.refusal).toBe('missing_headers')
  })

  it('test_UAT_FC_REQ-198_a_captured_request_replayed_later_is_refused_on_its_timestamp', async () => {
    // A SIGNATURE ALONE IS NOT ENOUGH. Without a bound on the timestamp, one
    // captured request is valid forever and can re-mark a repaired address as
    // bounced. The signature here is perfectly valid; the age is what refuses it.
    const { store, contactId } = await sentMessage('prov_replayed')
    const stale = Date.now() - (WEBHOOK_TOLERANCE_SECONDS + 60) * 1000
    const request = await signedRequest(payloadFor('email.bounced', 'prov_replayed'), {
      at: stale,
    })

    const result = await handleEmailWebhook(request, hookEnv())
    expect(result.response.status).toBe(401)
    expect(result.refusal).toBe('stale_timestamp')
    expect((await messagesFor(store, contactId))[0].status).toBe('sent')
  })

  it('test_UAT_FC_REQ-198_the_body_is_verified_and_not_the_parse', async () => {
    // THE SIGNATURE COVERS THE BYTES. A payload re-serialised from a parsed
    // object is a different string, so an implementation that verified THAT
    // would pass in testing and fail on the first message whose key order
    // differed. Proved the other way round: the same object, re-serialised with
    // its keys in another order, no longer verifies.
    const { store, contactId } = await sentMessage('prov_bytes')
    const payload = payloadFor('email.bounced', 'prov_bytes')
    const request = await signedRequest(payload)
    const reordered = JSON.stringify({ data: JSON.parse(payload).data, type: 'email.bounced' })
    const tampered = new Request(request, { body: reordered })

    const result = await handleEmailWebhook(tampered, hookEnv())
    expect(result.refusal).toBe('bad_signature')
    expect((await messagesFor(store, contactId))[0].status).toBe('sent')
  })

  it('test_UAT_FC_REQ-198_an_unconfigured_secret_refuses_rather_than_skipping_the_check', async () => {
    // FAILS CLOSED. A deployment that forgot the secret must refuse rather than
    // become an open mutation endpoint that looks exactly like a working one.
    const { store, contactId } = await sentMessage('prov_nosecret')
    const request = await signedRequest(payloadFor('email.bounced', 'prov_nosecret'))
    const result = await handleEmailWebhook(request, hookEnv({ EMAIL_WEBHOOK_SECRET: '' }))

    expect(result.response.status).toBe(401)
    expect(result.refusal).toBe('not_configured')
    expect((await messagesFor(store, contactId))[0].status).toBe('sent')
  })

  it('test_UAT_FC_REQ-198_the_signature_is_the_schemes_and_not_this_repositorys', async () => {
    // THE SCHEME PINNED AGAINST A FIXED SECRET, id, timestamp and payload —
    // the published Standard Webhooks vector. Without this, both sides of the
    // suite could agree on a scheme the provider does not use, and the first
    // real bounce would be refused with everything green.
    const signed = await signWebhook(
      'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
      'msg_p5jXN8AQM9LWM0D4loKWxJek',
      '1614265330',
      '{"test": 2432232314}',
    )
    expect(signed).toBe('g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=')
  })
})

describe('REQ-198 — an event we cannot place', () => {
  it('test_UAT_FC_REQ-198_an_event_for_a_message_we_never_sent_writes_nothing', async () => {
    // PROVIDERS RETRY, and they also deliver events for messages something else
    // sent. Inventing a record for one would put a message in a contact's
    // history that we never sent.
    const before = await (await storeFor()).query({ predicate: 'type="email"', limit: 'all' })
    const result = await handleEmailWebhook(
      await signedRequest(payloadFor('email.bounced', 'prov_never_sent_by_us')),
      hookEnv(),
    )
    expect(result.response.status).toBe(404)
    expect(result.outcome?.matched).toBe(false)
    const after = await (await storeFor()).query({ predicate: 'type="email"', limit: 'all' })
    expect(after.tickets).toHaveLength(before.tickets.length)
  })

  it('test_UAT_FC_REQ-198_a_verified_body_that_is_not_json_is_refused', async () => {
    const request = await signedRequest('not json at all')
    const result = await handleEmailWebhook(request, hookEnv())
    expect(result.response.status).toBe(400)
    expect(result.refusal).toBe('malformed_body')
  })
})

describe('REQ-198 — the route sits ahead of the Access gate', () => {
  function workerEnv(): Env {
    return {
      ...storeEnv(),
      SITES: env.SITES as R2Bucket,
      TENANT_ID: BUSINESS,
      ACCESS_DEV_OPEN: '',
      // CONFIGURED, so the gate is live. With these empty the dev-open path
      // would skip it and the case would prove nothing.
      ACCESS_TEAM_DOMAIN: TEAM,
      ACCESS_AUD: AUD,
      EMAIL_WEBHOOK_SECRET: SECRET,
      ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    } as Env
  }

  it('test_UAT_FC_REQ-198_a_signed_event_reaches_the_handler_with_no_access_token', async () => {
    // THE ONE ROUTE AHEAD OF THE GATE. A provider cannot present an Access
    // token, so a webhook behind the gate is a webhook that never fires — and
    // that failure is silent: every send looks fine and no bounce ever arrives.
    const { store, contactId } = await sentMessage('prov_through_worker')
    const response = await worker.fetch(
      await signedRequest(payloadFor('email.delivered', 'prov_through_worker')),
      workerEnv(),
    )
    expect(response.status).toBe(200)
    expect((await messagesFor(store, contactId))[0].status).toBe('delivered')
  })

  it('test_UAT_FC_REQ-198_every_other_route_is_still_behind_the_gate', async () => {
    // THE OTHER HALF, AND THE REASON THE MATCH IS EXACT. A prefix match on the
    // webhook path would be a way to reach anything under it unauthenticated.
    const response = await worker.fetch(
      new Request(`https://app.example${EMAIL_WEBHOOK_PATH}/anything`, { method: 'POST' }),
      workerEnv(),
    )
    expect(response.status).not.toBe(200)
  })

  it('test_UAT_FC_REQ-198_the_webhook_path_refuses_a_get', async () => {
    // MATCHED ON METHOD TOO: a GET on this path is not a delivery event, and
    // letting it through the gate would open an unauthenticated read surface.
    const response = await worker.fetch(
      new Request(`https://app.example${EMAIL_WEBHOOK_PATH}`, { method: 'GET' }),
      workerEnv(),
    )
    expect(response.status).not.toBe(200)
  })
})
