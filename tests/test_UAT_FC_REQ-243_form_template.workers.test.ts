import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { capturingMailer } from '../apps/control-app/src/mail'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { TEMPLATE_TYPE, TemplateRefusedError } from '../apps/control-app/src/templates'
import { acceptanceOf } from '../apps/control-app/src/acceptances'
import { NEWSLETTER } from '../apps/control-app/src/builder/acceptances.js'
import { eventsOf } from '../apps/control-app/src/events'
import { EMAIL_SENT, FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-243]] — **a capture form chooses the email it sends.**
 *
 * WHAT THIS FILE PROVES. That the message a submission produces is a property of
 * THE FORM rather than of the receiver. Before this there was one template and it
 * fired only on an asset: `captureLead` rendered `asset` and rendered it only when
 * the form declared both a key and a URL, so two forms on one site could not say
 * different things and a form whose whole deliverable is a place on a list —
 * this product's own beta form — mailed nobody at all.
 *
 * SO THE CENTRAL CASE IS TWO FORMS ON ONE SITE, and it is deliberately not two
 * sites. The receiver resolves a form by its instance id WITHIN one served
 * definition; two sites would exercise the site lookup and leave the half that
 * has to pick between two forms untested, which is precisely the half this
 * ticket adds.
 *
 * THE ASSERTIONS READ THE MESSAGE RECORD, for the reason [[REQ-223]]'s and
 * [[REQ-241]]'s do: the caller is answered one frozen acknowledgement whatever
 * happened, and the record is written `queued` BEFORE the provider is called, so
 * it is the one witness that cannot claim a send that never happened or miss one
 * that did. The capturing mailer is asserted alongside it, because a record
 * written for a message never handed to a provider would satisfy the first
 * witness alone.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1
 * carrying `db/migrations` and a real R2 bucket, through the shipped
 * `captureLead`, and every form definition is read out of a real PUBLISHED
 * revision — the only non-forgeable source of which template a form names. A
 * key that arrived in the request would be a stranger choosing which of a
 * business's messages to send to an address they typed, so the lookup being the
 * served definition is itself part of the claim.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *two forms on one site sending the same mail* — the receiver still owns the
 *     choice and the config key is decoration;
 *   - *a form promising no artifact mailing nobody* — the case that fails today,
 *     and the reason the ticket exists;
 *   - *a form naming no template sending something anyway* — silence has to be
 *     expressible, or a mailing-list form cannot be built;
 *   - *a welcome arriving twice for one address* — the at-most-once cap keyed on
 *     the asset, which an asset-less form does not have, so the cap quietly
 *     ceases to exist for exactly the forms a stranger can post to;
 *   - *a public form sending a sign-in or a sign-up message* — one config edit
 *     from mailing a redeemable credential to an address anybody typed;
 *   - *a template with a token the capture path cannot fill going out anyway* —
 *     a mail with a dead button, which is the failure `renderCopy`'s refusals
 *     exist to prevent;
 *   - *one business's copy reaching another's contacts* — the platform-only
 *     branch [[REQ-197]] exists to have removed.
 */

const TENANT = 'req243-templates'
const OTHER_TENANT = 'req243-other'

const PAPER = { key: 'paper', name: 'the whitepaper', url: 'https://example.test/paper' }

/** A business's own welcome, and a second one that is a different message. */
const BETA_WELCOME = 'beta-welcome'
const LIST_WELCOME = 'list-welcome'

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@req243.test>',
  } as LeadEnv
}

const scopeOf = (businessId: string): Scope => ({ businessId })

/**
 * Author one of this business's own templates.
 *
 * WRITTEN AS AN ORDINARY TICKET, through the same store the operator's own
 * authoring goes through. A fixture that reached past the store would prove the
 * sender can read a value somebody planted, not that it can read a template a
 * business wrote — and the second is the claim.
 */
async function writeTemplate(
  tenantId: string,
  key: string,
  subject: string,
  body: string,
  placeholders: string[] = [],
): Promise<void> {
  const store = await ticketStoreFor(leadEnv(), scopeOf(tenantId))
  await store.create({
    type: TEMPLATE_TYPE,
    title: `${key} for ${tenantId}`,
    fields: { template_key: key, subject, placeholders },
    body,
  })
}

/** The messages this business holds for a contact, newest first. */
async function messagesOf(tenantId: string, contactId: string) {
  const store = await ticketStoreFor(leadEnv(), scopeOf(tenantId))
  return messagesFor(store, contactId)
}

const submit = (site: { siteKey: string }, instanceId: string, email: string, send?: unknown) =>
  captureLead(
    leadEnv(),
    { siteKey: site.siteKey, instanceId, fields: { email } },
    send ? { send: send as never } : undefined,
  )

beforeAll(async () => {
  await applySchema()
  await writeTemplate(
    TENANT,
    BETA_WELCOME,
    'Welcome to the beta',
    '<p>You are on the list. We will be in touch.</p>',
  )
  await writeTemplate(
    TENANT,
    LIST_WELCOME,
    'Thanks for subscribing',
    '<p>You will hear from us when there is news.</p>',
  )
})

describe('REQ-243 — a capture form chooses the email it sends', () => {
  /**
   * AC-3 — a form with no assets can still send a welcome.
   *
   * THE CASE THAT MAILS NOBODY TODAY, and the reason the ticket exists. The old
   * receiver gated the send on the form declaring an artifact, so a form whose
   * whole deliverable is a place on a list reached the end of `captureLead`
   * having sent nothing.
   */
  it('test_UAT_FC_REQ-243_a_form_promising_no_assets_sends_the_message_it_names', async () => {
    const site = await seedFormSite({ tenantId: TENANT, template: BETA_WELCOME })
    const mailer = capturingMailer()
    const outcome = await submit(site, site.instanceId, 'beta@example.com', mailer.send)

    expect(outcome.accepted).toBe(true)
    // NO ASSET OUTCOMES AND ONE MESSAGE OUTCOME. The two answer different
    // questions — *did they get this artifact* and *did the welcome go out* —
    // and folding the second into the first would need a fake asset key.
    expect(outcome.assets).toEqual([])
    expect(outcome.message).toEqual({ sent: true })

    const records = await messagesOf(TENANT, outcome.contactId as string)
    expect(records).toHaveLength(1)
    expect(records[0].templateKey).toBe(BETA_WELCOME)
    expect(records[0].subject).toBe('Welcome to the beta')
    expect(records[0].to).toBe('beta@example.com')
    // KEYED ON NOTHING IN THE ASSET LEDGER, because no artifact was promised.
    expect(records[0].asset).toBeNull()
    expect(mailer.sent).toHaveLength(1)
    expect(mailer.sent[0].subject).toBe('Welcome to the beta')

    // …and the contact's own history says a message went, naming which one.
    const events = await eventsOf(leadEnv(), scopeOf(TENANT), outcome.contactId as string)
    const sent = events.filter((e) => e.kind === EMAIL_SENT)
    expect(sent).toHaveLength(1)
    expect((sent[0].detail as { template: string }).template).toBe(BETA_WELCOME)
  })

  /**
   * AC-1 — two forms on one site, naming different templates, send different
   * mail from the same submission path.
   *
   * ONE ADDRESS THROUGH BOTH, deliberately. A test using two addresses would
   * pass just as happily against a receiver keying the message off the CONTACT,
   * and the claim is that it keys off the form. One contact receiving two
   * different messages, because they pressed two different buttons, is the
   * observation that can only be true if the form chose.
   *
   * BOTH FORMS PROMISE NO ARTIFACT, so the only thing that differs between them
   * is the template they name. A delivery-versus-welcome pair would prove the
   * choice too, but confounded with the presence of an asset.
   */
  it('test_UAT_FC_REQ-243_two_forms_on_one_site_send_different_mail', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      instanceId: 'beta-form',
      template: BETA_WELCOME,
      alsoForms: [{ instanceId: 'list-form', template: LIST_WELCOME }],
    })
    const mailer = capturingMailer()
    const address = 'both-forms@example.com'

    const beta = await submit(site, 'beta-form', address, mailer.send)
    const list = await submit(site, 'list-form', address, mailer.send)

    // One contact, because it is one address.
    expect(list.contactId).toBe(beta.contactId)
    expect(beta.message).toEqual({ sent: true })
    expect(list.message).toEqual({ sent: true })

    const records = await messagesOf(TENANT, beta.contactId as string)
    const byKey = new Map(records.map((message) => [message.templateKey, message]))
    expect([...byKey.keys()].sort()).toEqual([BETA_WELCOME, LIST_WELCOME].sort())
    expect(byKey.get(BETA_WELCOME)!.subject).toBe('Welcome to the beta')
    expect(byKey.get(LIST_WELCOME)!.subject).toBe('Thanks for subscribing')
    // DIFFERENT WORDS AND NOT MERELY DIFFERENT KEYS: the body a business wrote
    // is what actually reaches the reader.
    expect(byKey.get(BETA_WELCOME)!.body).toContain('You are on the list')
    expect(byKey.get(LIST_WELCOME)!.body).toContain('when there is news')
    expect(mailer.sent.map((m) => m.subject).sort()).toEqual(
      ['Thanks for subscribing', 'Welcome to the beta'].sort(),
    )
  })

  /**
   * AC-2 — a form naming no template captures the contact, records its
   * acceptances, and sends nothing.
   *
   * SILENCE HAS TO BE EXPRESSIBLE OR A MAILING-LIST FORM CANNOT BE BUILT, and
   * the sharp part of the case is everything that still happens: the contact
   * lands, the box they ticked becomes queryable state, the submission is on the
   * timeline. A test asserting only "no mail" would pass against a receiver that
   * dropped the submission on the floor.
   */
  it('test_UAT_FC_REQ-243_a_form_naming_no_template_captures_and_sends_nothing', async () => {
    const listBox = {
      name: 'list',
      label: 'Email me occasionally',
      type: 'checkbox' as const,
      acceptance: NEWSLETTER,
    }
    const site = await seedFormSite({
      tenantId: TENANT,
      template: '',
      fields: [
        { name: 'email', label: 'Your email', type: 'email', required: true },
        listBox,
      ],
    })
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        instanceId: site.instanceId,
        fields: { email: 'quiet@example.com', list: 'yes' },
      },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    const contactId = outcome.contactId as string

    // NOTHING WENT, and nothing was recorded as having gone.
    expect(mailer.sent).toHaveLength(0)
    expect(await messagesOf(TENANT, contactId)).toHaveLength(0)
    // NOT A SKIP EITHER: there was no message to become anything, so there is
    // no outcome to report rather than an outcome reporting a refusal.
    expect(outcome.message).toBeUndefined()
    expect(outcome.assets).toEqual([])

    // …and everything a capture is for happened anyway.
    const state = await acceptanceOf(leadEnv(), scopeOf(TENANT), contactId, NEWSLETTER)
    expect(state).toMatchObject({ key: NEWSLETTER, granted: true })
    const events = await eventsOf(leadEnv(), scopeOf(TENANT), contactId)
    expect(events.filter((e) => e.kind === FORM_SUBMITTED)).toHaveLength(1)
  })

  /**
   * The at-most-once cap, for a form that has no artifact to key it on.
   *
   * WHY THIS IS NOT AN AFTERTHOUGHT. [[REQ-223]] §5 bounds a victim's exposure
   * to one message per address per artifact, and it does so because a public
   * form takes an address the sender does not own. An asset-less form has no
   * artifact, so the ledger handle becomes the TEMPLATE — without one, the cap
   * silently ceases to exist for exactly the forms this ticket adds, and
   * resubmitting the beta form with a stranger's address a thousand times sends
   * a thousand mails.
   *
   * AND TWO FORMS NAMING ONE WELCOME SEND IT ONCE BETWEEN THEM, which is what a
   * welcome means. That is the half a cap keyed on the form rather than on the
   * message would get wrong.
   */
  it('test_UAT_FC_REQ-243_a_welcome_is_sent_at_most_once_per_address', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      instanceId: 'once-a',
      template: BETA_WELCOME,
      alsoForms: [{ instanceId: 'once-b', template: BETA_WELCOME }],
    })
    const mailer = capturingMailer()
    const address = 'once@example.com'

    const first = await submit(site, 'once-a', address, mailer.send)
    expect(first.message).toEqual({ sent: true })

    // The same form again…
    const again = await submit(site, 'once-a', address, mailer.send)
    expect(again.message).toEqual({ sent: false, skipped: 'already_sent' })

    // …and a DIFFERENT form naming the same welcome. One message between them.
    const other = await submit(site, 'once-b', address, mailer.send)
    expect(other.message).toEqual({ sent: false, skipped: 'already_sent' })

    expect(mailer.sent).toHaveLength(1)
    expect(await messagesOf(TENANT, first.contactId as string)).toHaveLength(1)
  })

  /**
   * AC-6 — a capture form cannot name a template in a way that sends a
   * redeemable sign-up or sign-in link. Asserted by attempting it.
   *
   * REFUSED BEFORE ANYTHING IS READ, because it is a refusal about the FORM and
   * not about the contact. `invite` mints a link that creates a member and
   * `signin` mints a session; both are credentials with their own expiry and
   * their own single use, and a public form a stranger can post to has no
   * business sending either.
   *
   * REACHABLE ONLY FROM A DRAFT, because publish refuses it outright — which is
   * why the answer here is a reported refusal rather than an exception. The
   * builder's own preview submits against a draft and nothing validates one.
   */
  it('test_UAT_FC_REQ-243_a_capture_form_cannot_send_a_signin_or_an_invite', async () => {
    for (const key of ['invite', 'signin']) {
      const site = await seedFormSite({ tenantId: TENANT, template: key })
      const mailer = capturingMailer()
      const outcome = await submit(site, site.instanceId, `cred-${key}@example.com`, mailer.send)

      // The lead is still captured — the refusal is about the message.
      expect(outcome.accepted).toBe(true)
      expect(outcome.message).toEqual({ sent: false, skipped: 'reserved_template' })
      expect(mailer.sent).toHaveLength(0)
      // AND NO CREDENTIAL WAS MINTED OR RECORDED. The capture path mints no
      // token of any kind, so the refusal is what stops the message going at
      // all rather than what strips a link out of one.
      expect(await messagesOf(TENANT, outcome.contactId as string)).toHaveLength(0)
    }
  })

  /**
   * A form naming a template the business does not hold is reported, not thrown.
   *
   * THE DRAFT PATH AGAIN. Publish refuses this, so reaching it means a draft —
   * and a preview that 500s tells the operator far less than a submission that
   * captures the lead and says what was missing. The seed-if-absent rule is
   * deliberately not reached for: nothing here knows what a business's own
   * welcome should say, and inventing copy would put words in their mouth at the
   * moment a stranger is receiving them.
   */
  it('test_UAT_FC_REQ-243_a_template_the_business_does_not_hold_is_reported_not_invented', async () => {
    const site = await seedFormSite({ tenantId: TENANT, template: 'never-written' })
    const mailer = capturingMailer()
    const outcome = await submit(site, site.instanceId, 'missing@example.com', mailer.send)

    expect(outcome.accepted).toBe(true)
    expect(outcome.message).toEqual({ sent: false, skipped: 'no_template' })
    expect(mailer.sent).toHaveLength(0)

    // NOTHING WAS SEEDED UNDER THE KEY, which is the half that would be silent
    // damage: a business given default copy it never wrote, sent to a stranger.
    const store = await ticketStoreFor(leadEnv(), scopeOf(TENANT))
    const { tickets } = await store.query({
      predicate: `type=${TEMPLATE_TYPE} AND fields.template_key=never-written`,
      limit: 'all',
    })
    expect(tickets).toHaveLength(0)
  })

  /**
   * AC-5 — a template whose declared placeholders cannot be satisfied by the
   * capture path is refused at render, as it is today.
   *
   * THE REFUSAL IS THE POINT AND NOT A REGRESSION. `{{cta_url}}` for a capture
   * form is the gated page, which a form promising no artifact does not have —
   * so the capture path supplies no values, and a template declaring one is a
   * mail with a dead button. `renderCopy` refusing it is what keeps that mail
   * from going out, and the refusal names the template and the token, which is
   * what makes it actionable.
   */
  it('test_UAT_FC_REQ-243_a_token_the_capture_path_cannot_fill_is_refused_at_render', async () => {
    const key = 'welcome-with-a-link'
    await writeTemplate(
      TENANT,
      key,
      'Your link',
      '<p><a href="{{cta_url}}">Open it</a></p>',
      ['cta_url'],
    )
    const site = await seedFormSite({ tenantId: TENANT, template: key })
    const mailer = capturingMailer()

    await expect(
      submit(site, site.instanceId, 'dead-button@example.com', mailer.send),
    ).rejects.toBeInstanceOf(TemplateRefusedError)

    // Refused BEFORE the provider, which is the whole value of refusing.
    expect(mailer.sent).toHaveLength(0)
  })

  /**
   * AC-7 — the business's own templates are read from its own store; two
   * businesses may hold different copy under the same key with no platform-only
   * branch.
   *
   * THE TENANCY CASE IS WHAT THE DESIGN RESTS ON, exactly as [[REQ-197]]'s own
   * file says: opening the vocabulary is only safe because the vocabulary is a
   * business's own, and a claim of that shape is worth what the test that two
   * businesses cannot see each other's is worth.
   */
  it('test_UAT_FC_REQ-243_two_businesses_hold_different_copy_under_one_key', async () => {
    const key = 'house-welcome'
    await writeTemplate(TENANT, key, 'Welcome from the studio', '<p>The studio writes this.</p>')
    await writeTemplate(
      OTHER_TENANT,
      key,
      'Welcome from the plumber',
      '<p>The plumber writes this.</p>',
    )

    const mine = await seedFormSite({ tenantId: TENANT, template: key })
    const theirs = await seedFormSite({ tenantId: OTHER_TENANT, template: key })

    const a = await submit(mine, mine.instanceId, 'mine@example.com', capturingMailer().send)
    const b = await submit(theirs, theirs.instanceId, 'theirs@example.com', capturingMailer().send)

    const mineRecord = (await messagesOf(TENANT, a.contactId as string))[0]
    const theirsRecord = (await messagesOf(OTHER_TENANT, b.contactId as string))[0]

    // ONE KEY, TWO MESSAGES, and neither business's words reach the other's
    // contact.
    expect(mineRecord.templateKey).toBe(key)
    expect(theirsRecord.templateKey).toBe(key)
    expect(mineRecord.subject).toBe('Welcome from the studio')
    expect(theirsRecord.subject).toBe('Welcome from the plumber')
    expect(mineRecord.body).not.toContain('plumber')
    expect(theirsRecord.body).not.toContain('studio')
  })
})
