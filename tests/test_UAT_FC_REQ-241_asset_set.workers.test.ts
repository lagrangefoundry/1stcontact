import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { capturingMailer } from '../apps/control-app/src/mail'
import { BOUNCED, messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { eventsOf } from '../apps/control-app/src/events'
import { ASSET_SENT, FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-241]] — **the asset a capture form promises is a set.**
 *
 * WHAT THE OLD SHAPE COULD NOT SAY. `contact-form` carried one asset as three
 * sibling strings, so a form gating two artifacts had one key, one URL and one
 * ledger entry — and *"did they take both papers or one of them"* was not a
 * question the stored shape could express. The XGD whitepapers page is the
 * concrete case: it promises both papers and could only be told about one.
 *
 * THE ASSERTIONS READ THE MESSAGE RECORD, NOT A STATUS CODE, for the reason
 * [[REQ-223]]'s do: the caller is answered one frozen acknowledgement whatever
 * happened, and the record is written `queued` BEFORE the provider is called, so
 * it is the one witness that cannot claim a send that never happened or miss one
 * that did. Two artifacts means two records, each naming its own key — which is
 * the whole of what makes the question answerable.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a form promising two assets delivering one of them, or one message
 *     covering both* — the ledger is back to a single entry and the question is
 *     unanswerable again;
 *   - *a contact who has had paper A being refused paper B*, or being sent A a
 *     second time — the at-most-once rule reading the form instead of the item;
 *   - *one malformed item silencing the whole set*;
 *   - *a bounced address being sent any of them* — suppression is about the
 *     mailbox and the set has nothing to do with it.
 */

const TENANT = 'req241-assets'
const PAPER_A = { key: 'paper-a', name: 'the first paper', url: 'https://example.test/papers#a' }
const PAPER_B = { key: 'paper-b', name: 'the second paper', url: 'https://example.test/papers#b' }

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@req241.test>',
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

describe('REQ-241 — a form promises a set of assets', () => {
  it('test_UAT_FC_REQ-241_a_form_declaring_two_assets_delivers_both', async () => {
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A, PAPER_B] })
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, instanceId: site.instanceId, fields: { email: 'both@example.com' } },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    // AC-1 — one outcome per asset, in declaration order, both sent.
    expect(outcome.assets).toEqual([
      { key: PAPER_A.key, sent: true },
      { key: PAPER_B.key, sent: true },
    ])

    // TWO RECORDS AND NOT ONE CARRYING TWO NAMES. A single message covering the
    // set would key the ledger on one asset, which is the shape this change
    // exists to widen.
    const records = await messagesOf(outcome.contactId as string)
    const byKey = new Map(records.map((message) => [message.asset, message]))
    expect([...byKey.keys()].sort()).toEqual([PAPER_A.key, PAPER_B.key])
    for (const paper of [PAPER_A, PAPER_B]) {
      const message = byKey.get(paper.key)!
      expect(message.to).toBe('both@example.com')
      // SEPARATELY IDENTIFIED: its own link and its own words, not the set's.
      expect(message.body).toContain(paper.url)
      expect(message.body).toContain(paper.name)
      expect(message.body).not.toContain(paper === PAPER_A ? PAPER_B.url : PAPER_A.url)
    }
    expect(mailer.sent).toHaveLength(2)

    // …and the contact's own history says both happened, separately recorded.
    const events = await eventsOf(leadEnv(), { businessId: TENANT }, outcome.contactId as string)
    const sent = events.filter((e) => e.kind === ASSET_SENT)
    expect(sent).toHaveLength(2)
    expect(sent.map((e) => (e.detail as { asset: string }).asset).sort()).toEqual([
      PAPER_A.key,
      PAPER_B.key,
    ])

    // The submission itself records WHICH artifacts it was gated on, which no
    // delivery event can supply for an asset that was promised and skipped.
    const submitted = events.find((e) => e.kind === FORM_SUBMITTED)
    expect((submitted?.detail as { assets: string[] }).assets).toEqual([PAPER_A.key, PAPER_B.key])
  })

  it('test_UAT_FC_REQ-241_at_most_once_is_per_asset_not_per_form', async () => {
    const first = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A] })
    const both = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A, PAPER_B] })
    const mailer = capturingMailer()
    const address = 'ledger@example.com'

    const one = await captureLead(
      leadEnv(),
      { siteKey: first.siteKey, instanceId: first.instanceId, fields: { email: address } },
      { send: mailer.send },
    )
    expect(one.assets).toEqual([{ key: PAPER_A.key, sent: true }])

    const again = await captureLead(
      leadEnv(),
      { siteKey: both.siteKey, instanceId: both.instanceId, fields: { email: address } },
      { send: mailer.send },
    )
    // AC-2 — the question is asked once per ITEM. They had A, so A is refused;
    // they have never had B, so B goes. A form-level rule would have refused
    // both, and no rule at all would have sent A twice.
    expect(again.contactId).toBe(one.contactId)
    expect(again.assets).toEqual([
      { key: PAPER_A.key, sent: false, skipped: 'already_sent' },
      { key: PAPER_B.key, sent: true },
    ])

    const records = await messagesOf(one.contactId as string)
    expect(records.filter((message) => message.asset === PAPER_A.key)).toHaveLength(1)
    expect(records.filter((message) => message.asset === PAPER_B.key)).toHaveLength(1)
    expect(mailer.sent).toHaveLength(2)
  })

  it('test_UAT_FC_REQ-241_a_half_declared_item_is_absent_and_the_others_are_not', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [
        // A key with no URL is an asset nothing can deliver…
        { key: 'no-url', name: 'a paper with nowhere to go', url: '' },
        PAPER_B,
        // …and a URL with no key is a delivery nothing can remember having made.
        { key: '', name: 'a paper nothing remembers', url: 'https://example.test/orphan' },
      ],
    })
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, instanceId: site.instanceId, fields: { email: 'partial@example.com' } },
      { send: mailer.send },
    )

    // AC-3 — both half-items are read as absent, and the complete one is
    // unaffected by sitting between them.
    expect(outcome.assets).toEqual([{ key: PAPER_B.key, sent: true }])
    const records = await messagesOf(outcome.contactId as string)
    expect(records.map((message) => message.asset)).toEqual([PAPER_B.key])
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].body).not.toContain('https://example.test/orphan')
  })

  it('test_UAT_FC_REQ-241_a_form_declaring_no_assets_captures_and_sends_nothing', async () => {
    const site = await seedFormSite({ tenantId: TENANT, assets: [] })
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, instanceId: site.instanceId, fields: { email: 'quiet241@example.com' } },
      { send: mailer.send },
    )

    // AC-4 — an empty set behaves exactly as no asset did: the contact lands,
    // nothing leaves the building, and the list says so rather than being absent.
    expect(outcome.accepted).toBe(true)
    expect(outcome.contactId).toBeTruthy()
    expect(outcome.assets).toEqual([])
    expect(mailer.sent).toHaveLength(0)
    expect(await messagesOf(outcome.contactId as string)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-241_a_suppressed_address_is_sent_none_of_the_set', async () => {
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A] })
    const both = await seedFormSite({
      tenantId: TENANT,
      assets: [
        { key: 'suppressed-a', name: 'one', url: 'https://example.test/s-a' },
        { key: 'suppressed-b', name: 'two', url: 'https://example.test/s-b' },
      ],
    })
    const mailer = capturingMailer()
    const address = 'bouncer241@example.com'

    const first = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, instanceId: site.instanceId, fields: { email: address } },
      { send: mailer.send },
    )
    const contactId = first.contactId as string

    // The delivery webhook's own outcome, applied to the record it landed on.
    const store = await ticketStoreFor(leadEnv(), { businessId: TENANT })
    const record = (await messagesFor(store, contactId))[0]
    await store.update({ uid: record.uid, patch: { fields: { status: BOUNCED } } })

    const again = await captureLead(
      leadEnv(),
      { siteKey: both.siteKey, instanceId: both.instanceId, fields: { email: address } },
      { send: mailer.send },
    )

    // AC-7 — the rule is about the mailbox, so it applies to the whole set. Two
    // assets neither of which has ever been sent, and neither goes.
    expect(again.accepted).toBe(true)
    expect(again.contactId).toBe(contactId)
    expect(again.assets).toEqual([
      { key: 'suppressed-a', sent: false, skipped: 'suppressed' },
      { key: 'suppressed-b', sent: false, skipped: 'suppressed' },
    ])
    expect(mailer.sent).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-241_a_revision_published_before_this_ticket_still_resolves', async () => {
    // AC-6, second half. `site_revisions` rows are immutable by design and the
    // receiver reads module instances straight out of those frozen snapshots, so
    // v5 instances carrying the old triple exist and will keep existing. The
    // form still captures — the contact lands, the provenance names the page —
    // which is the property a published site depends on.
    //
    // WHAT IT NO LONGER DOES IS DELIVER, and that is the intended reading rather
    // than an oversight: the triple is not the v6 contract, and teaching the
    // receiver to read both would be the legacy-alias mode this codebase refuses
    // outright. The remedy is the one the migration exists for — upgrade the
    // draft and publish it again.
    const site = await seedFormSite({ tenantId: TENANT, legacyAsset: PAPER_A })
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, instanceId: site.instanceId, fields: { email: 'frozen@example.com' } },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    expect(outcome.contactId).toBeTruthy()
    const events = await eventsOf(leadEnv(), { businessId: TENANT }, outcome.contactId as string)
    const submitted = events.find((e) => e.kind === FORM_SUBMITTED)
    // The definition resolved: the page it names could only come from the
    // snapshot, and nothing in the submission carries it.
    expect((submitted?.detail as { page: string }).page).toBe('home.json')
    expect(outcome.assets).toEqual([])
    expect(mailer.sent).toHaveLength(0)
  })
})
