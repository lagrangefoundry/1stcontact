import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { capturingMailer } from '../apps/control-app/src/mail'
import { BOUNCED, COMPLAINED, messagesFor } from '../apps/control-app/src/messages'
import {
  EMAIL_WEBHOOK_PATH,
  handleEmailWebhook,
  signWebhook,
} from '../apps/control-app/src/email-webhook'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { eventsOf } from '../apps/control-app/src/events'
import { ASSET_SENT } from '../apps/control-app/src/builder/contact-events.js'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-223]] §5 — **the asset a form promised, delivered at most once, ever.**
 *
 * WHY AT MOST ONCE IS THE DESIGN AND NOT A RATE LIMIT. This is the one endpoint
 * that mails an address it has never seen, which is inherent to an email-gated
 * asset and cannot be designed away. It is not an open relay — a relay is one
 * where the attacker controls the recipient AND the content, and the content here
 * is entirely ours. What remains is mail-bombing a victim and burning the sending
 * domain's reputation, and a per-day cap answers neither: it still permits
 * sustained harassment. One message per address per asset bounds a victim's
 * exposure to the same single message any newsletter signup produces.
 *
 * AND DELIVERABILITY IS THE ONE THAT HURTS MOST. Unsolicited mail earns spam
 * complaints, complaints degrade the sending domain, and the first casualty is
 * sign-in links not arriving — abuse of a marketing form breaks the login. That
 * is why an address that has bounced is never written to again.
 *
 * THE ASSERTIONS READ THE MESSAGE RECORD AND NOT A STATUS CODE. The caller is
 * answered one frozen acknowledgement whatever happened, so a status code cannot
 * say whether anything left the building; the [[REQ-198]] record is written
 * `queued` BEFORE the provider is called, so it is the one witness that cannot
 * claim a send that never happened or miss one that did.
 *
 * THE ARTIFACTS DO NOT EXIST YET, and this does not wait for them ([[CHAT-56]]:
 * no PDFs in either repo, the papers are ticket bodies). Delivery is built
 * against the asset as an ABSTRACTION — a key, a name and a URL the form
 * declares — and proved here with a fixture.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a second request delivering a second message* — the mail-bomb;
 *   - *a bounced address being written to again* — the deliverability failure
 *     that ends with sign-in links in spam;
 *   - *a form with no asset sending anything at all*.
 */

const TENANT = 'req223-asset'
/** The provider's signing secret, in the shape the library insists on. */
const WEBHOOK_SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw'
const ASSET = { key: 'whitepapers', name: 'both whitepapers', url: 'https://example.test/papers' }

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@req223.test>',
  } as LeadEnv
}

/** The messages this business holds for a contact, newest first. */
async function messagesOf(contactId: string) {
  const store = await ticketStoreFor(leadEnv(), { businessId: TENANT })
  return messagesFor(store, contactId)
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-223 — asset delivery', () => {
  it('test_UAT_FC_REQ-223_an_asset_is_delivered_exactly_once_per_address', async () => {
    const site = await seedFormSite({ tenantId: TENANT, asset: ASSET })
    const mailer = capturingMailer()
    const submit = () =>
      captureLead(
        leadEnv(),
        {
          siteKey: site.siteKey,
          instanceId: site.instanceId,
          fields: { email: 'once@example.com' },
        },
        { send: mailer.send },
      )

    const first = await submit()
    expect(first.accepted).toBe(true)
    expect(first.assetSent).toBe(true)

    const second = await submit()
    // AC-11 — the second request is accepted and delivers nothing.
    expect(second.accepted).toBe(true)
    expect(second.assetSent).toBe(false)
    expect(second.assetSkipped).toBe('already_sent')

    // AC-11 asserted where it can be asserted: the record of what was sent.
    const records = await messagesOf(first.contactId as string)
    const forAsset = records.filter((message) => message.asset === ASSET.key)
    expect(forAsset).toHaveLength(1)
    expect(forAsset[0].to).toBe('once@example.com')
    expect(forAsset[0].status).toBe('sent')
    // The content is ours end to end — our template, our link, our sender.
    expect(forAsset[0].body).toContain(ASSET.url)
    expect(forAsset[0].body).toContain(ASSET.name)
    expect(forAsset[0].from).toBe('1st Contact <no-reply@req223.test>')
    // ONE RECIPIENT PER MESSAGE, which is what the port's own shape enforces.
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].to).toBe('once@example.com')

    // …and the contact's own history says it happened, once.
    const events = await eventsOf(leadEnv(), { businessId: TENANT }, first.contactId as string)
    expect(events.filter((e) => e.kind === ASSET_SENT)).toHaveLength(1)
  })

  /**
   * AC-12 — an address recorded as bounced OR COMPLAINED is never sent to.
   *
   * BOTH STATUSES, ONE RULE, AND THEY ARE ASSERTED SEPARATELY BECAUSE THEY ARE
   * DIFFERENT FACTS. A bounce is the mailbox refusing; a complaint is the person
   * refusing. A suppression check that read only one of them would let the
   * endpoint mail somebody who had already pressed the spam button — which is the
   * outcome that damages the sending domain, and a degraded domain's first
   * casualty is sign-in links not arriving.
   */
  it.each([
    ['bounced', BOUNCED],
    ['complained', COMPLAINED],
  ])(
    'test_UAT_FC_REQ-223_a_%s_address_is_never_written_to_again',
    async (label, suppressing) => {
      const site = await seedFormSite({ tenantId: TENANT, asset: ASSET })
      const mailer = capturingMailer()
      const address = `${label}@example.com`
      const first = await captureLead(
        leadEnv(),
        {
          siteKey: site.siteKey,
          instanceId: site.instanceId,
          fields: { email: address },
        },
        { send: mailer.send },
      )
      const contactId = first.contactId as string

      // The delivery webhook's own outcome, applied to the record it landed on.
      const store = await ticketStoreFor(leadEnv(), { businessId: TENANT })
      const record = (await messagesFor(store, contactId))[0]
      await store.update({ uid: record.uid, patch: { fields: { status: suppressing } } })

      // A different asset, so `already_sent` cannot be what refuses it.
      const other = await seedFormSite({
        tenantId: TENANT,
        asset: { key: `guide-${label}`, name: 'the guide', url: 'https://example.test/guide' },
      })
      const again = await captureLead(
        leadEnv(),
        {
          siteKey: other.siteKey,
          instanceId: other.instanceId,
          fields: { email: address },
        },
        { send: mailer.send },
      )

      // AC-12 — the capture still happens; the send does not.
      expect(again.accepted).toBe(true)
      expect(again.contactId).toBe(contactId)
      expect(again.assetSent).toBe(false)
      expect(again.assetSkipped).toBe('suppressed')
      expect(mailer.sent).toHaveLength(1)
    },
  )

  /**
   * AC-12's precondition: a complaint has to be able to REACH the record.
   *
   * WITHOUT THIS THE SUPPRESSION RULE IS UNREACHABLE CODE. Nothing in the product
   * recorded a complaint before this ticket, so the case above could only ever
   * fire for a status a test had written by hand — which would prove the check
   * and not the capability. This drives the REAL webhook, signed the way the
   * provider signs one, and then asks the endpoint for the asset: the address is
   * refused because of an event that arrived from outside.
   *
   * IT IS ALSO WHERE THE TWO DEFINITIONS OF *WHAT STATUSES EXIST* MEET. The
   * ticket schema validates every write, so a status the code believes in and the
   * schema does not is a runtime refusal — and only a test that actually writes
   * one through the real path catches it.
   */
  it('test_UAT_FC_REQ-223_a_provider_complaint_suppresses_the_address', async () => {
    const site = await seedFormSite({ tenantId: TENANT, asset: ASSET })
    const mailer = capturingMailer()
    const first = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        instanceId: site.instanceId,
        fields: { email: 'spamreporter@example.com' },
      },
      { send: mailer.send },
    )
    const contactId = first.contactId as string
    const store = await ticketStoreFor(leadEnv(), { businessId: TENANT })
    const providerId = (await messagesFor(store, contactId))[0].providerId as string

    // The provider's own complaint event, signed by the shipped signer so the two
    // sides of the signature are one implementation.
    const payload = JSON.stringify({
      type: 'email.complained',
      created_at: '2026-09-10T10:00:00.000Z',
      data: { email_id: providerId, to: ['spamreporter@example.com'] },
    })
    const id = 'msg_req223_complaint'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = await signWebhook(WEBHOOK_SECRET, id, timestamp, payload)
    const result = await handleEmailWebhook(
      new Request(`https://app.example${EMAIL_WEBHOOK_PATH}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'webhook-id': id,
          'webhook-timestamp': timestamp,
          'webhook-signature': `v1,${signature}`,
        },
        body: payload,
      }),
      { ...leadEnv(), EMAIL_WEBHOOK_SECRET: WEBHOOK_SECRET },
    )

    // It landed, as its own status and not as a second name for a bounce.
    expect(result.outcome?.matched).toBe(true)
    expect((await messagesFor(store, contactId))[0].status).toBe(COMPLAINED)
    expect(COMPLAINED).not.toBe(BOUNCED)

    // AC-12 — and the endpoint now refuses to write to that address again.
    const other = await seedFormSite({
      tenantId: TENANT,
      asset: { key: 'guide-complaint', name: 'the guide', url: 'https://example.test/guide' },
    })
    const again = await captureLead(
      leadEnv(),
      {
        siteKey: other.siteKey,
        instanceId: other.instanceId,
        fields: { email: 'spamreporter@example.com' },
      },
      { send: mailer.send },
    )
    expect(again.assetSkipped).toBe('suppressed')
    expect(mailer.sent).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-223_a_form_that_promises_nothing_sends_nothing', async () => {
    const site = await seedFormSite({ tenantId: TENANT })
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        instanceId: site.instanceId,
        fields: { email: 'quiet@example.com' },
      },
      { send: mailer.send },
    )
    expect(outcome.accepted).toBe(true)
    expect(outcome.assetSkipped).toBe('not_offered')
    expect(mailer.sent).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-223_a_submission_naming_no_published_site_writes_nothing', async () => {
    const outcome = await captureLead(leadEnv(), {
      siteKey: 'site_no_such_key',
      instanceId: 'anything',
      fields: { email: 'ghost@example.com' },
    })
    expect(outcome.accepted).toBe(false)
    expect(outcome.reason).toBe('unknown_site')
    const { results } = await (env.DB as D1Database)
      .prepare('SELECT id FROM user_emails WHERE email = ?')
      .bind('ghost@example.com')
      .all()
    expect(results ?? []).toHaveLength(0)
  })
})
