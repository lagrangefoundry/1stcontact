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
import { handleFor, seedFormSite } from './support/lead-site'
import type { SeedEmailPage } from './support/lead-site'

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
 * One message this site sends, as [[REQ-247]] made it: an email PAGE.
 *
 * WHAT MOVED, AND WHY THE CLAIM IS UNCHANGED. This file's subject is that the
 * form chooses the message, and it still is; what [[REQ-247]] changed is where
 * the chosen message LIVES. It was a business-scoped ticket the sender fetched
 * at send time, seeded on first use, so the first recipient of a new message was
 * the first person to read it. It is now a page of the site the form is on —
 * written into the same draft, frozen into the same revision, and edited with
 * the same `set_l1` as every other page.
 *
 * SO THE COPY IS SEEDED THROUGH THE SITE STORE AND NOT THE TICKET STORE, which
 * is the same fixture discipline as before rather than a relaxation of it: the
 * sender reads a real published revision, so a message it can read is one a
 * publish really put there.
 */
function message(id: string, subject: string, ...lines: string[]): SeedEmailPage {
  return { id, subject, lines }
}

/**
 * A business's own CREDENTIAL template, which is still a ticket ([[REQ-247]] §5).
 *
 * THE ONE THING THAT DID NOT MOVE, and it did not move for a reason worth
 * stating where it is used: `invite`, `signin` and `lapsed` are sent by the
 * BUSINESS and not by a site, so a business with two sites has one sign-in
 * email rather than two. Only the templates a FORM names became pages.
 *
 * WRITTEN THROUGH THE TICKET STORE, so the credential copy under test is the
 * real thing in the real place — which is the whole of what makes the refusal
 * above worth asserting.
 */
async function writeCredentialTemplate(tenantId: string, key: string): Promise<void> {
  const store = await ticketStoreFor(leadEnv(), scopeOf(tenantId))
  await store.create({
    type: TEMPLATE_TYPE,
    title: `${key} for ${tenantId}`,
    fields: { template_key: key, subject: `Your ${key} link`, placeholders: ['cta_url'] },
    body: '<p><a href="{{cta_url}}">Open it</a></p>',
  })
}

/** The messages this business holds for a contact, newest first. */
async function messagesOf(tenantId: string, contactId: string) {
  const store = await ticketStoreFor(leadEnv(), scopeOf(tenantId))
  return messagesFor(store, contactId)
}

/**
 * One submission, named the way an author names a form: the page and the
 * component on it ([[BUG-93]]).
 *
 * THE HANDLE IS BUILT HERE AND NOT SPELLED AT EACH CALL. Every form this file
 * seeds sits on the site's one page, so the page half is the same every time and
 * repeating it would be noise that hides the half that varies.
 */
const submit = (
  site: { siteKey: string; pageId: string },
  instanceId: string,
  email: string,
  send?: unknown,
) =>
  captureLead(
    leadEnv(),
    { siteKey: site.siteKey, formHandle: handleFor(site.pageId, instanceId), fields: { email } },
    send ? { send: send as never } : undefined,
  )

/**
 * The two welcomes this file's sites hold, declared once.
 *
 * PER-SITE AND NO LONGER PER-BUSINESS, which is [[REQ-247]] §2's whole shape and
 * worth seeing in the fixture. These used to be written once in `beforeAll`,
 * because a template ticket belonged to the business and every site of it read
 * the same one. A message is a page now, so it is seeded into each site that
 * sends it — and two sites of one business holding different copy under one name
 * stops being a thing to arrange and becomes the default.
 */
const BETA_COPY = message(BETA_WELCOME, 'Welcome to the beta', 'You are on the list. We will be in touch.')
const LIST_COPY = message(LIST_WELCOME, 'Thanks for subscribing', 'You will hear from us when there is news.')

beforeAll(async () => {
  await applySchema()
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
    const site = await seedFormSite({
      tenantId: TENANT,
      template: BETA_WELCOME,
      emails: [BETA_COPY],
    })
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
    expect(records[0].assets).toEqual([])
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
      emails: [BETA_COPY, LIST_COPY],
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
        formHandle: site.formHandle,
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
      emails: [BETA_COPY],
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
   * AC-6, and [[REQ-247]] AC-9 — a capture form cannot send a redeemable
   * sign-up or sign-in link. Asserted by attempting it, with the real
   * credential template sitting in the business's store the whole time.
   *
   * THE REFUSAL BECAME STRUCTURAL AND THAT IS WHAT THIS NOW PROVES. [[REQ-243]]
   * had to CHECK for `invite` and `signin` by name, because the template
   * vocabulary was the business's entire ticket store and a form could name
   * anything in it — a check in one branch of one function, which is a thing
   * somebody can forget to write and which nothing but this test would notice
   * the absence of. A form names an email PAGE now, and a credential template is
   * not a page of any site, so there is no longer a check here to forget: naming
   * `invite` is the same act as naming anything else the site does not hold.
   *
   * SO THE CREDENTIAL TEMPLATE IS DELIBERATELY WRITTEN FIRST, and the test is
   * worth little without it. A business that held no `invite` would prove only
   * that a missing thing cannot be sent. Writing the real one — into the real
   * store, under the real key, through the same `templateFor` reads from —
   * makes the claim the sharp one: the copy IS there, a stranger's form names
   * exactly it, and the send still reaches nothing, because a form and a
   * credential template no longer share a namespace to collide in.
   *
   * REACHABLE ONLY FROM A DRAFT, because publish refuses it outright and so does
   * the operation that configures the form — which is why the answer here is a
   * reported outcome rather than an exception. The builder's own preview submits
   * against a draft and nothing validates one.
   */
  it('test_UAT_FC_REQ-243_a_capture_form_cannot_send_a_signin_or_an_invite', async () => {
    for (const key of ['invite', 'signin']) {
      await writeCredentialTemplate(TENANT, key)
      // NOT MATERIALISED AS A PAGE, which is the state under test: the form
      // names `invite`, and this site — like every site — holds no email page
      // called that.
      const site = await seedFormSite({ tenantId: TENANT, template: key, omitEmails: [key] })
      const mailer = capturingMailer()
      const outcome = await submit(site, site.instanceId, `cred-${key}@example.com`, mailer.send)

      // The lead is still captured — the refusal is about the message.
      expect(outcome.accepted).toBe(true)
      // THE ORDINARY "NO SUCH MESSAGE", and no longer a `reserved_template` of
      // its own. One fewer state for a reader to learn, and one fewer branch for
      // a credential to be let through by.
      expect(outcome.message).toEqual({ sent: false, skipped: 'no_template' })
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
    const site = await seedFormSite({
      tenantId: TENANT,
      template: 'never-written',
      omitEmails: ['never-written'],
    })
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
    // DECLARED ON A PAGE NOW, and the declaration is the same promise it was on
    // a ticket: *this copy carries `{{cta_url}}`*. What the form sending it does
    // not have is anything to put there.
    const site = await seedFormSite({
      tenantId: TENANT,
      template: key,
      emails: [{ id: key, subject: 'Your link', placeholders: ['cta_url'] }],
    })
    const mailer = capturingMailer()

    await expect(
      submit(site, site.instanceId, 'dead-button@example.com', mailer.send),
    ).rejects.toBeInstanceOf(TemplateRefusedError)

    // Refused BEFORE the provider, which is the whole value of refusing.
    expect(mailer.sent).toHaveLength(0)
  })

  /**
   * AC-7 — two businesses may hold different copy under the same name, with no
   * platform-only branch.
   *
   * THE TENANCY CASE IS WHAT THE DESIGN RESTS ON, exactly as [[REQ-197]]'s own
   * file says: opening the vocabulary is only safe because the vocabulary is
   * somebody's own, and a claim of that shape is worth what the test that two
   * businesses cannot see each other's is worth.
   *
   * AND [[REQ-247]] MADE THE ISOLATION STRUCTURAL RATHER THAN SCOPED. The copy
   * used to be a business-scoped ticket, so two businesses were kept apart by
   * the sender asking the right store — correct, and a thing a bug could get
   * wrong. Copy is a page of a site now, and a site belongs to exactly one
   * business, so the two messages here are not two rows the sender must pick
   * between: they are pages of two different sites, in two different revisions,
   * reachable only through the site key the submission itself named.
   */
  it('test_UAT_FC_REQ-243_two_businesses_hold_different_copy_under_one_key', async () => {
    const key = 'house-welcome'
    const mine = await seedFormSite({
      tenantId: TENANT,
      template: key,
      emails: [message(key, 'Welcome from the studio', 'The studio writes this.')],
    })
    const theirs = await seedFormSite({
      tenantId: OTHER_TENANT,
      template: key,
      emails: [message(key, 'Welcome from the plumber', 'The plumber writes this.')],
    })

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
