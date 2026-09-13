import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { acceptanceOf, contactsWith } from '../apps/control-app/src/acceptances'
import {
  BETA_REQUESTED,
  NEWSLETTER,
  WHITEPAPERS,
} from '../apps/control-app/src/builder/acceptances.js'
import {
  ACCEPTANCE_GRANTED,
  ACCEPTANCE_REQUESTED,
  ACCEPTANCE_WITHDRAWN,
  FORM_SUBMITTED,
} from '../apps/control-app/src/builder/contact-events.js'
import { eventsOf } from '../apps/control-app/src/events'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-242]] — **a capture form sets acceptances.**
 *
 * WHAT THIS FILE PROVES. That pressing the button, and ticking the boxes beside
 * it, produce STATE A BUSINESS CAN QUERY rather than a blob inside one event's
 * `detail`. Before this, `provenanceOfSubmission` wrote
 * `consent: [{field, wording, answer}]` and nothing read it back: a checkbox was
 * linked to nothing but its own label, so there was no way to say that THIS box
 * is the newsletter and no way to ask who is on it.
 *
 * SO THE CENTRAL ASSERTION IS A QUERY, NOT A FIELD READ. `contactsWith` is the
 * question the whole change exists to make answerable — "who in this business is
 * on the newsletter" — and it runs through the state table's own index. A test
 * that only read the acceptance back by contact id would pass just as happily
 * against a per-contact blob, which is the shape being replaced.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1
 * carrying `db/migrations` and a real R2 bucket, through the shipped
 * `captureLead`. The form definition is read out of a real PUBLISHED revision,
 * which is the only non-forgeable source of the wording — so the wording asserted
 * here is one that was genuinely on the page rather than one a payload asserted.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a ticked box that records evidence and no state* — the `consent[]` blob,
 *     back under another name;
 *   - *an unticked box recording nothing* — "they were asked and said no" is the
 *     fact worth having, and it is exactly the one a record built from what
 *     arrived loses;
 *   - *an implied acceptance recorded without the wording it was asserted under*
 *     — a consent nobody can be shown to have been given;
 *   - *a second submission appending a second grant* — a history that lies about
 *     how many times somebody agreed;
 *   - *a second submission refusing a box they have only just ticked* — the
 *     idempotency rule reading the contact instead of the key;
 *   - *`form.submitted` losing the provenance that is not duplicated anywhere* —
 *     the blob went away; the site, page, instance and submit label did not.
 */

const TENANT = 'req242-acceptances'

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@req242.test>',
  } as LeadEnv
}

const scope: Scope = { businessId: TENANT }

const EMAIL_FIELD = { name: 'email', label: 'Your email', type: 'email' as const, required: true }

/** The list box, named — the whole of what [[REQ-242]] §2's explicit half adds. */
const LIST_BOX = {
  name: 'list',
  label: 'Email me occasionally about new papers',
  type: 'checkbox' as const,
  acceptance: NEWSLETTER,
}

async function eventsFor(contactId: string) {
  return eventsOf(leadEnv(), scope, contactId)
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-242 — a capture form sets acceptances', () => {
  /**
   * AC-1 — a ticked named box produces queryable newsletter state, and a history
   * row carrying the box's own label as the wording.
   */
  it('test_UAT_FC_REQ-242_a_ticked_box_produces_queryable_state_and_its_wording', async () => {
    const site = await seedFormSite({ tenantId: TENANT, fields: [EMAIL_FIELD, LIST_BOX] })

    const outcome = await captureLead(leadEnv(), {
      siteKey: site.siteKey,
      instanceId: site.instanceId,
      fields: { email: 'onthelist@example.com', list: 'yes' },
    })
    expect(outcome.accepted).toBe(true)
    const contactId = outcome.contactId as string

    // THE QUERY, which is the point. Not "read this contact's row back" — the
    // business asking which of its contacts are on the list.
    expect(await contactsWith(leadEnv(), scope, NEWSLETTER)).toContain(contactId)

    const state = await acceptanceOf(leadEnv(), scope, contactId, NEWSLETTER)
    expect(state).toMatchObject({ key: NEWSLETTER, granted: true, businessId: TENANT })
    // A PREFERENCE IS VERSIONED BY NOTHING, so it names no document.
    expect(state?.documentUid).toBeNull()

    // …and the history says which way it went, under the words they were shown.
    const granted = (await eventsFor(contactId)).filter((e) => e.kind === ACCEPTANCE_GRANTED)
    expect(granted).toHaveLength(1)
    expect(granted[0].detail).toMatchObject({ key: NEWSLETTER, wording: LIST_BOX.label })
  })

  /**
   * AC-2 — an unticked named box records that they were asked and said no.
   *
   * THE SHARPEST CASE IN THE FILE. An unticked box submits nothing at all, so
   * this is the fact a record assembled from the request body cannot hold — and
   * it is the one `consent[]` existed to carry. The state must be there and must
   * read `false`; the contact must NOT come back from the "who is on the
   * newsletter" query.
   */
  it('test_UAT_FC_REQ-242_an_unticked_box_records_a_no_and_grants_nothing', async () => {
    const site = await seedFormSite({ tenantId: TENANT, fields: [EMAIL_FIELD, LIST_BOX] })

    const outcome = await captureLead(leadEnv(), {
      siteKey: site.siteKey,
      instanceId: site.instanceId,
      // `list` is absent, which is what an unticked box actually submits.
      fields: { email: 'notthelist@example.com' },
    })
    const contactId = outcome.contactId as string

    const state = await acceptanceOf(leadEnv(), scope, contactId, NEWSLETTER)
    expect(state).toMatchObject({ key: NEWSLETTER, granted: false })
    expect(await contactsWith(leadEnv(), scope, NEWSLETTER)).not.toContain(contactId)

    // NOT SILENCE: the history records the answer, with the wording it was given
    // under, so "we asked and they declined" is evidenced rather than inferred
    // from an absence.
    const events = await eventsFor(contactId)
    expect(events.filter((e) => e.kind === ACCEPTANCE_GRANTED)).toHaveLength(0)
    const withdrawn = events.filter((e) => e.kind === ACCEPTANCE_WITHDRAWN)
    expect(withdrawn).toHaveLength(1)
    expect(withdrawn[0].detail).toMatchObject({ key: NEWSLETTER, wording: LIST_BOX.label })
  })

  /**
   * AC-3 — an implied acceptance is recorded on submit, with the wording from the
   * config, and with no checkbox involved.
   */
  it('test_UAT_FC_REQ-242_pressing_the_button_records_a_declared_acceptance', async () => {
    const wording = 'By sending this you are asking us for the papers.'
    const site = await seedFormSite({
      tenantId: TENANT,
      // ONE FIELD AND IT IS THE ADDRESS. There is no box here to tick, which is
      // the whole of what "implied" means.
      fields: [EMAIL_FIELD],
      accepts: [{ key: WHITEPAPERS, wording }],
    })

    const outcome = await captureLead(leadEnv(), {
      siteKey: site.siteKey,
      instanceId: site.instanceId,
      fields: { email: 'implied@example.com' },
    })
    const contactId = outcome.contactId as string

    // A `request` IS AN EVENT AND NOTHING ELSE — there is nothing to revoke, so
    // there is no state, which is a fact about the type rather than a gap.
    const requested = (await eventsFor(contactId)).filter(
      (e) => e.kind === ACCEPTANCE_REQUESTED,
    )
    expect(requested).toHaveLength(1)
    expect(requested[0].detail).toMatchObject({ key: WHITEPAPERS, wording })
    expect(await acceptanceOf(leadEnv(), scope, contactId, WHITEPAPERS)).toBeNull()
  })

  /**
   * AC-5 — a second submission does not double-record what they already hold, and
   * does record what they do not.
   *
   * BOTH HALVES IN ONE CASE, because a rule that reads the CONTACT rather than
   * the KEY passes either half alone: "seen before, skip everything" gets the
   * first right and the second wrong, and "always write" the reverse.
   */
  it('test_UAT_FC_REQ-242_a_second_submission_records_only_what_changed', async () => {
    const address = 'twice@example.com'
    const beta = {
      name: 'beta',
      label: 'I would like to try the beta',
      type: 'checkbox' as const,
      acceptance: BETA_REQUESTED,
    }
    const site = await seedFormSite({
      tenantId: TENANT,
      fields: [EMAIL_FIELD, LIST_BOX, beta],
    })
    const submit = (fields: Record<string, string>) =>
      captureLead(leadEnv(), { siteKey: site.siteKey, instanceId: site.instanceId, fields })

    const first = await submit({ email: address, list: 'yes' })
    const contactId = first.contactId as string
    // They ticked the list and left the beta box alone.
    expect(await acceptanceOf(leadEnv(), scope, contactId, NEWSLETTER)).toMatchObject({
      granted: true,
    })
    expect(await acceptanceOf(leadEnv(), scope, contactId, BETA_REQUESTED)).toMatchObject({
      granted: false,
    })

    const again = await submit({ email: address, list: 'yes', beta: 'yes' })
    expect(again.contactId).toBe(contactId)

    const events = await eventsFor(contactId)
    const granted = events.filter((e) => e.kind === ACCEPTANCE_GRANTED)
    // THE NEWSLETTER IS GRANTED ONCE, not twice: they already held it and
    // nothing happened, so a second row would make the history lie about how
    // many times they agreed. The beta is granted now, because it changed.
    expect(granted.map((e) => (e.detail as { key: string }).key).sort()).toEqual(
      [BETA_REQUESTED, NEWSLETTER].sort(),
    )
    expect(await contactsWith(leadEnv(), scope, BETA_REQUESTED)).toContain(contactId)
    // Both submissions are still on the timeline: what they asked is a fact
    // about the relationship even when no acceptance moved.
    expect(events.filter((e) => e.kind === FORM_SUBMITTED)).toHaveLength(2)
  })

  /**
   * AC-7 — `form.submitted` no longer carries `consent[]`, and still carries
   * everything that is not duplicated anywhere else.
   *
   * INCLUDING AN UNNAMED BOX'S ANSWER. The blob was right that a declared box's
   * answer is worth keeping even when nothing arrived for it; what it got wrong
   * was keeping it where nothing could query it. A box the author named is state
   * now and is deliberately absent from the bag — two records of one fact are two
   * answers free to drift — and a box nobody named is an ordinary answer.
   */
  it('test_UAT_FC_REQ-242_the_submission_keeps_its_provenance_and_drops_the_consent_blob', async () => {
    const unnamed = { name: 'terms', label: 'I have read the notes', type: 'checkbox' as const }
    const site = await seedFormSite({
      tenantId: TENANT,
      submitLabel: 'Send me both papers',
      fields: [EMAIL_FIELD, LIST_BOX, unnamed],
    })

    const outcome = await captureLead(leadEnv(), {
      siteKey: site.siteKey,
      instanceId: site.instanceId,
      fields: { email: 'provenance@example.com', list: 'yes' },
    })
    const submitted = (await eventsFor(outcome.contactId as string)).find(
      (e) => e.kind === FORM_SUBMITTED,
    )
    const detail = submitted?.detail as Record<string, unknown>

    expect(detail.consent).toBeUndefined()
    expect(detail.site).toBe(site.siteKey)
    expect(detail.page).toBe('home.json')
    expect(detail.form).toBe(site.instanceId)
    expect(detail.submitLabel).toBe('Send me both papers')
    // The unnamed box is an answer — and its `''` is the "asked and said no" the
    // blob used to carry for it. The NAMED box is not here at all; it is state.
    expect(detail.fields).toEqual({ terms: '' })
  })
})
