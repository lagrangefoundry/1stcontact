import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { openGate } from '../apps/control-app/src/gate'
import { capturingMailer } from '../apps/control-app/src/mail'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { eventsOf } from '../apps/control-app/src/events'
import { ASSET_SENT } from '../apps/control-app/src/builder/contact-events.js'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[BUG-98]] — **one message per delivery, not one per asset.**
 *
 * THE SYMPTOM THIS FILE PINS. One press of the XGD whitepapers button produced
 * two emails 386ms apart to the same address — same subject, same body, same
 * link, nothing at all distinguishing them to the recipient. The form was
 * replaced by its success copy on submit, so pressing twice was not even
 * available: the duplicate was ours.
 *
 * WHY IT HAPPENED, AND WHY THE LEDGER WAS NOT WHAT WAS WRONG. `deliverForm` sent
 * one message per ASSET, which was right while an artifact WAS the message.
 * [[REQ-241]] made assets a set and [[REQ-244]] moved the link off the artifact
 * onto a page listing the whole set, and after both the unit of DELIVERY and the
 * unit of MESSAGE had come apart while the loop still assumed they were the same.
 * The at-most-once rule was satisfied throughout — each paper really did go out
 * exactly once. What was unguarded was the thing the recipient experiences.
 *
 * WHAT DECIDES THE SHAPE IS THE COPY'S OWN DECLARATION. A message declaring
 * `{{asset_name}}` names an artifact and gets a message each; one that does not
 * is about the set and is sent once. That is data the page already holds, so
 * nothing new is configured and no form has to be told which mode it is in.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1
 * carrying `db/migrations` and a real R2 bucket, through the shipped
 * `captureLead`, and asserts on BOTH witnesses: the capturing mailer, which is
 * what a recipient's mailbox would actually have received, and the message
 * record, which is written `queued` before the provider is called and so cannot
 * miss a send that happened. Neither alone is enough — a record written for a
 * message never handed to a provider satisfies the first, and a provider called
 * without a record satisfies the second.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a set-style message going out once per artifact* — the bug itself;
 *   - *a message naming `{{asset_name}}` collapsing into one* — the case the
 *     per-asset loop was written for, broken by the fix;
 *   - *the one message's link opening one paper rather than the set* — a
 *     recipient told about two artifacts and given a page holding one;
 *   - *at-most-once weakening* — a set-style message that records one of the
 *     artifacts it delivered offers the other again on the next form, which is
 *     the same duplicate arriving a week later;
 *   - *an artifact that went out in a shared message leaving no `asset.sent`* —
 *     `sent` and `taken` are only comparable while they count the same things.
 */

const TENANT = 'bug98-messages'
const PAPER_A = { key: 'paper-a', name: 'the first paper', url: 'https://example.test/papers#a' }
const PAPER_B = { key: 'paper-b', name: 'the second paper', url: 'https://example.test/papers#b' }

/** A message about the SET: it links at the page and never names a paper. */
const ABOUT_THE_SET = { id: 'asset', placeholders: ['cta_url'] }
/** A message about ONE artifact: it says which, so it is sent per artifact. */
const ABOUT_ONE = { id: 'asset', placeholders: ['cta_url', 'asset_name'] }

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@bug98.test>',
  } as LeadEnv
}

/**
 * The gated-page link a delivery mail carries.
 *
 * READ OUT OF THE BODY rather than reconstructed from the grant table, on
 * [[REQ-244]]'s reasoning: what has to be true is that the RECIPIENT can reach
 * the page, and a token asserted from the database would pass even if the mail
 * carried something else.
 */
function gateLinkIn(body: string): string {
  const match = /https:\/\/[^\s"'<>]*\/api\/download\/([A-Za-z0-9_]+)/.exec(body)
  if (!match) throw new Error(`no gate link in: ${body}`)
  return match[1]
}

async function messagesOf(contactId: string) {
  return messagesFor(await ticketStoreFor(leadEnv(), { businessId: TENANT }), contactId)
}

async function assetSentEvents(contactId: string) {
  const events = await eventsOf(leadEnv(), { businessId: TENANT }, contactId)
  return events.filter((event) => event.kind === ASSET_SENT)
}

/** One press of the button on a seeded form. */
const submit = (
  site: { siteKey: string; formHandle: string },
  address: string,
  send: unknown,
): ReturnType<typeof captureLead> =>
  captureLead(
    leadEnv(),
    { siteKey: site.siteKey, formHandle: site.formHandle, fields: { email: address } },
    { send: send as never },
  )

beforeAll(async () => {
  await applySchema()
})

describe('BUG-98 — a message is sent once per delivery', () => {
  it('test_UAT_FC_BUG-98_a_set_style_message_goes_out_once_for_two_assets', async () => {
    // THE SYMPTOM, EXACTLY. Two papers, one message that does not name either,
    // one press. Before the fix this sent two identical mails.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_B],
      emails: [ABOUT_THE_SET],
    })
    const mailer = capturingMailer()
    const outcome = await submit(site, 'set@example.com', mailer.send)

    expect(mailer.sent).toHaveLength(1)
    const records = await messagesOf(outcome.contactId as string)
    expect(records).toHaveLength(1)

    // BOTH ARTIFACTS WENT OUT, and the outcome says so per item — one message is
    // not one delivery, and reporting a summary would lose the distinction the
    // whole asset-set change exists for.
    expect(outcome.assets).toEqual([
      { key: PAPER_A.key, sent: true },
      { key: PAPER_B.key, sent: true },
    ])

    // …and the ledger remembers BOTH of them against that one message.
    expect([...records[0].assets].sort()).toEqual([PAPER_A.key, PAPER_B.key])
  })

  it('test_UAT_FC_BUG-98_a_message_naming_an_artifact_is_still_sent_per_artifact', async () => {
    // THE CASE THE LOOP WAS WRITTEN FOR, UNBROKEN. Copy that says WHICH paper is
    // copy about one paper, and two papers are then two different messages.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_B],
      emails: [ABOUT_ONE],
    })
    const mailer = capturingMailer()
    const outcome = await submit(site, 'each@example.com', mailer.send)

    expect(mailer.sent).toHaveLength(2)
    const records = await messagesOf(outcome.contactId as string)
    expect(records).toHaveLength(2)
    for (const record of records) expect(record.assets).toHaveLength(1)
    expect(records.flatMap((record) => record.assets).sort()).toEqual([PAPER_A.key, PAPER_B.key])

    // EACH NAMES ITS OWN AND NOT THE OTHER, which is what makes two messages
    // worth sending at all — the thing the symptom's two identical mails lacked.
    const byKey = new Map(records.map((record) => [record.assets[0], record]))
    expect(byKey.get(PAPER_A.key)!.body).toContain(PAPER_A.name)
    expect(byKey.get(PAPER_A.key)!.body).not.toContain(PAPER_B.name)
    expect(byKey.get(PAPER_B.key)!.body).toContain(PAPER_B.name)
    expect(byKey.get(PAPER_B.key)!.body).not.toContain(PAPER_A.name)
  })

  it('test_UAT_FC_BUG-98_the_one_message_link_opens_the_whole_set', async () => {
    // A RECIPIENT TOLD ABOUT TWO PAPERS AND GIVEN ONE LINK must find both behind
    // it. The link is the gated page and never the artifact, so the page has to
    // list the SET or the single message is a promise it cannot keep.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_B],
      emails: [ABOUT_THE_SET],
    })
    const mailer = capturingMailer()
    const outcome = await submit(site, 'gate@example.com', mailer.send)

    expect(mailer.sent).toHaveLength(1)
    const token = gateLinkIn(mailer.sent[0].body)
    const page = await openGate(leadEnv(), site.siteKey, token)
    expect(page?.contactId).toBe(outcome.contactId)
    expect(page?.assets.map((asset) => asset.key)).toEqual([PAPER_A.key, PAPER_B.key])
  })

  it('test_UAT_FC_BUG-98_at_most_once_survives_a_shared_message', async () => {
    // THE LEDGER IS STILL PER ARTIFACT. A set-style message delivered two papers
    // in one send; a resubmission must send nothing, and a DIFFERENT form naming
    // one of those papers must send nothing for it — otherwise the duplicate the
    // fix removed simply arrives a week later under another form.
    const both = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_B],
      emails: [ABOUT_THE_SET],
    })
    const justA = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A],
      emails: [ABOUT_THE_SET],
    })
    const mailer = capturingMailer()
    const address = 'ledger98@example.com'

    const first = await submit(both, address, mailer.send)
    expect(mailer.sent).toHaveLength(1)

    const again = await submit(both, address, mailer.send)
    expect(again.contactId).toBe(first.contactId)
    expect(again.assets).toEqual([
      { key: PAPER_A.key, sent: false, skipped: 'already_sent' },
      { key: PAPER_B.key, sent: false, skipped: 'already_sent' },
    ])

    const narrower = await submit(justA, address, mailer.send)
    expect(narrower.assets).toEqual([{ key: PAPER_A.key, sent: false, skipped: 'already_sent' }])

    // NOTHING FURTHER LEFT THE BUILDING, by either witness.
    expect(mailer.sent).toHaveLength(1)
    expect(await messagesOf(first.contactId as string)).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-98_a_single_asset_sends_one_message_under_either_shape', async () => {
    // ONE ARTIFACT IS THE CASE WHERE THE TWO SHAPES AGREE, and it is worth
    // pinning: the fix must not turn the ordinary single-paper form into
    // something that depends on which way its copy was written.
    const mailer = capturingMailer()
    for (const [label, emails] of [
      ['set', ABOUT_THE_SET],
      ['named', ABOUT_ONE],
    ] as const) {
      const site = await seedFormSite({
        tenantId: TENANT,
        assets: [PAPER_A],
        emails: [emails],
      })
      const outcome = await submit(site, `one-${label}@example.com`, mailer.send)
      expect(outcome.assets).toEqual([{ key: PAPER_A.key, sent: true }])
      const records = await messagesOf(outcome.contactId as string)
      expect(records).toHaveLength(1)
      expect(records[0].assets).toEqual([PAPER_A.key])
    }
    expect(mailer.sent).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-98_a_form_promising_nothing_still_welcomes_once', async () => {
    // THE WELCOME IS KEYED ON THE TEMPLATE AND NOT ON AN ARTIFACT, and it reads
    // that key off a record carrying NO assets — which is the half of the record
    // shape the set change had to leave alone.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [],
      template: 'beta-welcome',
    })
    const mailer = capturingMailer()
    const address = 'welcome98@example.com'

    const first = await submit(site, address, mailer.send)
    expect(first.message).toEqual({ sent: true })
    expect(first.assets).toEqual([])

    const again = await submit(site, address, mailer.send)
    expect(again.message).toEqual({ sent: false, skipped: 'already_sent' })

    expect(mailer.sent).toHaveLength(1)
    const records = await messagesOf(first.contactId as string)
    expect(records).toHaveLength(1)
    expect(records[0].assets).toEqual([])
  })

  it('test_UAT_FC_BUG-98_every_asset_in_a_shared_message_gets_its_own_sent_event', async () => {
    // `asset.sent` AND `asset.downloaded` COUNT THE SAME THINGS OR NEITHER MEANS
    // ANYTHING. A download is recorded per artifact, so a delivery that carried
    // two artifacts in one mail has to leave two rows — both naming that one
    // message, which is what says they went out together.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A, PAPER_B],
      emails: [ABOUT_THE_SET],
    })
    const mailer = capturingMailer()
    const outcome = await submit(site, 'events98@example.com', mailer.send)

    const sent = await assetSentEvents(outcome.contactId as string)
    expect(sent).toHaveLength(2)
    expect(sent.map((event) => (event.detail as { asset: string }).asset).sort()).toEqual([
      PAPER_A.key,
      PAPER_B.key,
    ])

    const records = await messagesOf(outcome.contactId as string)
    expect(new Set(sent.map((event) => event.ref))).toEqual(new Set([records[0].uid]))
  })
})
