import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { capturingMailer } from '../apps/control-app/src/mail'
import { messagesFor, sendRecordedEmail } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { templateFor } from '../apps/control-app/src/templates'
import { emailsOf } from '../apps/control-app/src/identity'
import type { Scope } from '../apps/control-app/src/scope'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite } from './support/lead-site'

/**
 * [[REQ-247]] — **the send path, now that the message is a page.**
 *
 * WHAT THIS FILE PROVES, AND WHY IT IS SEPARATE FROM THE AUTHORING ONE. That the
 * copy a recipient actually receives is the copy that was PUBLISHED on the site
 * that sent it. Being editable is the authoring claim and is asserted next door;
 * this file is about the consequence that follows from where the copy now lives,
 * and it is the consequence the ticket trades for: template editing had no
 * review step at all — the ticket the sender read was the live one, so an edit
 * reached the next recipient the instant it was saved — and §2 gives that up
 * deliberately in exchange for *"what is gained is review before live"*.
 *
 * SO THE TWO HALVES ARE ASSERTED AS A PAIR AND NOT SEPARATELY. "The new copy
 * goes out after a publish" is satisfied by a sender with no snapshot at all,
 * which would send every draft keystroke. "The draft does not go out" is
 * satisfied by a sender frozen on the first revision forever. Only the sequence
 * — v1, then an unpublished edit that changes nothing, then a publish that
 * changes it — distinguishes the correct behaviour from both.
 *
 * WHAT MAKES IT EVIDENCE. Every case runs inside workerd against a real D1
 * carrying `db/migrations` and a real R2 bucket, through the shipped
 * `captureLead`, and reads the message RECORD — written `queued` before the
 * provider is called, so it is the one witness that cannot claim a send that
 * never happened or miss one that did. The capturing mailer is asserted beside
 * it, because a record written for a message never handed to a provider would
 * satisfy the first witness alone.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *an unpublished edit reaching a recipient* — the review window §2 buys is
 *     imaginary, and a half-finished message goes out under a business's name;
 *   - *a published edit NOT reaching the next recipient* — the copy is editable
 *     in a sense nobody can use, which is [[REQ-197]]'s *"editable without a
 *     deploy"* lost rather than preserved;
 *   - *a form that has already sent a welcome sending a second one* — §7's named
 *     hazard: the welcome path remembers a delivery by `templateKey`, and if
 *     that identity shifted under the move, everybody who already had the mail
 *     would get it again;
 *   - *two sites of one business sharing one message* — the isolation that makes
 *     per-site copy meaningful;
 *   - *the credential templates moving too* — §5 says they do not, and a
 *     business with two sites must still have exactly one sign-in email.
 */

const TENANT = 'req247-delivery'
const WELCOME = 'beta-welcome'

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@req247.test>',
  } as LeadEnv
}

const scopeOf = (businessId: string): Scope => ({ businessId })

async function messagesOf(tenantId: string, contactId: string) {
  return messagesFor(await ticketStoreFor(leadEnv(), scopeOf(tenantId)), contactId)
}

const submit = (
  site: { siteKey: string },
  instanceId: string,
  email: string,
  send: unknown,
): ReturnType<typeof captureLead> =>
  captureLead(
    leadEnv(),
    { siteKey: site.siteKey, instanceId, fields: { email } },
    { send: send as never },
  )

/**
 * Rewrite one email page's copy IN THE DRAFT, leaving the published revision
 * exactly where it was.
 *
 * THROUGH THE SITE STORE, which is the same store the edit surface writes
 * through — so what this simulates is an operator having saved a change, and
 * nothing more. Publishing is a separate act below, which is the whole point.
 */
async function rewriteDraftCopy(
  tenantId: string,
  siteKey: string,
  pageId: string,
  subject: string,
  line: string,
): Promise<void> {
  const store = await d1r2SiteStore(env as unknown as SiteStoreEnv).forTenant(tenantId)
  const pages = await store.readPages(siteKey)
  const found = pages.find((p) => (p.page as { id?: string }).id === pageId)
  if (!found) throw new Error(`no email page '${pageId}' in the draft`)
  const page = found.page as Record<string, unknown>
  const l1 = page.l1 as { root: { children: unknown[] } }
  await store.write(siteKey, {
    pages: [
      {
        name: found.name,
        page: {
          ...page,
          email: { ...(page.email as Record<string, unknown>), subject },
          l1: {
            ...l1,
            root: {
              ...l1.root,
              children: [
                ...l1.root.children,
                {
                  kind: 'text',
                  text: line,
                  axes: {
                    fontFamily: 'Helvetica, sans-serif',
                    fontSizePx: 16,
                    lineHeightPx: 24,
                    color: '#1a1a1a',
                  },
                },
              ],
            },
          },
        },
      },
    ],
  })
}

/**
 * Freeze the draft as the site's live revision — an operator pressing Publish.
 *
 * WRITTEN THROUGH `writeRevision` FROM THE CURRENT DRAFT, so what goes live is
 * whatever the draft says at this instant. That is the mechanism under test: the
 * message a visitor is sent is a page of the very revision their form came out
 * of, so publishing the draft is what moves the copy and nothing else is.
 */
async function publishDraft(tenantId: string, siteKey: string, id: number): Promise<void> {
  const store = await d1r2SiteStore(env as unknown as SiteStoreEnv).forTenant(tenantId)
  const pages = await store.readPages(siteKey)
  const siteJson = await store.readSiteJson(siteKey)
  await store.writeRevision(
    siteKey,
    {
      id,
      publishedAt: `2026-09-1${id}T00:00:00.000Z`,
      message: `publish ${id}`,
      by: null,
      basedOn: null,
      changes: { added: [], modified: pages.map((p) => p.name), removed: [] },
      sha: `publish-${id}`,
    },
    {
      source: { siteJson: siteJson ?? {}, pages, assets: [] },
      out: new Map([['index.html', '<!doctype html><title>Home</title>']]),
    },
  )
}

beforeAll(async () => {
  await applySchema()
})

// ── AC-5, AC-6 — the copy that goes out is the copy that was published ──────

describe('REQ-247 — changed copy reaches a recipient once it is published', () => {
  /**
   * AC-5 ∩ AC-6 — asserted as one sequence, because neither half is worth
   * anything alone.
   *
   * THE THREE SUBMISSIONS USE THREE ADDRESSES, and they have to. A welcome is
   * remembered at most once per address ([[REQ-243]]), so resubmitting the same
   * address would be answered `already_sent` and the test would be asserting the
   * cap rather than the copy.
   */
  it('test_UAT_FC_REQ-247_an_unpublished_edit_waits_and_a_published_one_goes_out', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      template: WELCOME,
      emails: [{ id: WELCOME, subject: 'Welcome to the beta', lines: ['The first words.'] }],
    })
    const mailer = capturingMailer()

    // ── 1. what is live goes out ──
    const first = await submit(site, site.instanceId, 'one@example.com', mailer.send)
    expect(first.message).toEqual({ sent: true })
    const v1 = (await messagesOf(TENANT, first.contactId as string))[0]
    expect(v1.subject).toBe('Welcome to the beta')
    expect(v1.body).toContain('The first words.')

    // ── 2. an operator rewrites the copy, and does not publish ──
    await rewriteDraftCopy(
      TENANT,
      site.siteKey,
      WELCOME,
      'Welcome — we have changed our minds',
      'The second words, not yet live.',
    )

    // AC-6 — AND IT REACHES NOBODY. This is the review window §2 trades for: an
    // edit saved half-finished, at the moment a stranger happens to submit, is
    // not a message that goes out.
    const second = await submit(site, site.instanceId, 'two@example.com', mailer.send)
    expect(second.message).toEqual({ sent: true })
    const stillV1 = (await messagesOf(TENANT, second.contactId as string))[0]
    expect(stillV1.subject).toBe('Welcome to the beta')
    expect(stillV1.body).toContain('The first words.')
    expect(stillV1.body).not.toContain('The second words')

    // ── 3. the operator publishes ──
    await publishDraft(TENANT, site.siteKey, 2)

    // AC-5 ∩ AC-6 — and the NEXT send uses the changed copy. Without this the
    // behaviour above is indistinguishable from a sender frozen forever on the
    // first revision.
    const third = await submit(site, site.instanceId, 'three@example.com', mailer.send)
    expect(third.message).toEqual({ sent: true })
    const v2 = (await messagesOf(TENANT, third.contactId as string))[0]
    expect(v2.subject).toBe('Welcome — we have changed our minds')
    expect(v2.body).toContain('The second words, not yet live.')

    // …and every one of the three was really handed to a provider, so none of
    // the assertions above is about a record written for a mail nobody sent.
    expect(mailer.sent).toHaveLength(3)
    expect(mailer.sent.map((m) => m.subject)).toEqual([
      'Welcome to the beta',
      'Welcome to the beta',
      'Welcome — we have changed our minds',
    ])
  })

  /**
   * AC-6's counterpart — the builder's own preview reads the DRAFT, so an
   * operator can see an unpublished message before deciding to publish it.
   *
   * WHY BOTH CHANNELS EXIST AT ALL. If the draft were unreadable there would be
   * no way to review a change before it went live, and the review window §2 buys
   * would be a window with nothing in it. So the same edit that reaches no
   * visitor is immediately visible to whoever made it.
   */
  it('test_UAT_FC_REQ-247_the_draft_channel_shows_the_unpublished_copy', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      template: WELCOME,
      emails: [{ id: WELCOME, subject: 'As published', lines: ['The published words.'] }],
    })
    await rewriteDraftCopy(TENANT, site.siteKey, WELCOME, 'As drafted', 'The drafted words.')

    const mailer = capturingMailer()
    const preview = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        instanceId: site.instanceId,
        fields: { email: 'preview@example.com' },
        channel: 'draft',
      },
      { send: mailer.send },
    )

    expect(preview.message).toEqual({ sent: true })
    const record = (await messagesOf(TENANT, preview.contactId as string))[0]
    expect(record.subject).toBe('As drafted')
    expect(record.body).toContain('The drafted words.')
  })
})

// ── AC-13 — the at-most-once ledger survives the move ───────────────────────

describe('REQ-247 — a form that has already sent does not send again', () => {
  /**
   * AC-13, and §7's named hazard.
   *
   * WHAT COULD HAVE BROKEN. `deliveryState` remembers a gated delivery by its
   * ASSET key, so a form promising assets is untouched by any of this. The
   * welcome path is the exposed one: it matches `message.asset === null &&
   * message.templateKey === templateKey`. If the identity a message is
   * remembered by had shifted from a template key to a page id — an entirely
   * reasonable-looking change, since the thing it names is now a page — then a
   * form that had already sent its welcome would not recognise its own history,
   * and everybody who already had the mail would get it a second time.
   *
   * SO THE HISTORY IS WRITTEN IN THE OLD VOCABULARY, DELIBERATELY, and by the
   * ordinary recorder rather than by reaching past it. A record carrying
   * `template_key: 'beta-welcome'` and no asset is exactly what a send BEFORE
   * this change left behind, and the claim is that today's code still reads it
   * as *this message, already sent*.
   */
  it('test_UAT_FC_REQ-247_a_welcome_already_recorded_is_not_sent_a_second_time', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      instanceId: 'ledger-form',
      template: WELCOME,
      emails: [{ id: WELCOME, subject: 'Welcome to the beta' }],
    })
    const mailer = capturingMailer()
    const address = 'already@example.com'

    // The contact, and the record a PRE-CHANGE send would have left.
    const first = await submit(site, 'ledger-form', address, mailer.send)
    expect(first.message).toEqual({ sent: true })
    const contactId = first.contactId as string
    expect(mailer.sent).toHaveLength(1)

    // THE IDENTITY IS THE KEY THE FORM NAMES, and the key did not change across
    // the move — which is precisely why `contactFormV6ToV7` still writes the
    // string `asset` rather than something page-shaped.
    const history = await messagesOf(TENANT, contactId)
    expect(history).toHaveLength(1)
    expect(history[0].templateKey).toBe(WELCOME)
    expect(history[0].asset).toBeNull()

    // …so the same address through the same form is recognised and not re-sent.
    const again = await submit(site, 'ledger-form', address, mailer.send)
    expect(again.contactId).toBe(contactId)
    expect(again.message).toEqual({ sent: false, skipped: 'already_sent' })
    expect(mailer.sent).toHaveLength(1)
    expect(await messagesOf(TENANT, contactId)).toHaveLength(1)
  })

  /**
   * AC-13's sharper half — a record written by the recorder directly, with no
   * send behind it, is still recognised.
   *
   * WHY THIS IS NOT THE SAME TEST TWICE. Above, the history was created by
   * today's code in the same process, so a ledger that had quietly changed
   * identity would agree with itself and pass. Here the record is written
   * independently, through `sendRecordedEmail` — the same function the sender
   * uses — carrying the fields a send made months ago would carry. Nothing in
   * the reading path helped write it, so agreement is the claim rather than the
   * setup.
   */
  it('test_UAT_FC_REQ-247_a_history_written_independently_is_still_recognised', async () => {
    const tenant = `${TENANT}-ledger`
    const site = await seedFormSite({
      tenantId: tenant,
      instanceId: 'old-form',
      template: WELCOME,
      emails: [{ id: WELCOME, subject: 'Welcome to the beta' }],
    })
    const mailer = capturingMailer()
    const address = 'historic@example.com'

    // The contact has to exist, and the honest way to make one is a submission —
    // against a form naming NO message, so nothing is sent and the ledger stays
    // empty for this address.
    const quiet = await seedFormSite({ tenantId: tenant, instanceId: 'quiet', template: '' })
    const landed = await submit(quiet, 'quiet', address, mailer.send)
    const contactId = landed.contactId as string
    expect(await messagesOf(tenant, contactId)).toHaveLength(0)

    // NOW THE OLD RECORD, in the old vocabulary, written by the real recorder.
    const store = await ticketStoreFor(leadEnv(), scopeOf(tenant))
    // THE ADDRESS ROW THE SENDER ITSELF WOULD HAVE USED, read through the same
    // `emailsOf` — so the record written here is the record a real send leaves,
    // down to which address id it points at.
    const primary = (await emailsOf(leadEnv(), contactId)).find((row) => row.is_primary === 1)
    expect(primary, 'the submission should have landed an address').toBeDefined()
    await sendRecordedEmail(
      store,
      {
        contactId,
        addressId: String(primary!.id),
        templateKey: WELCOME,
        templateUid: 'template-from-before-this-change',
        subject: 'Welcome to the beta',
        from: '1st Contact <no-reply@req247.test>',
        to: address,
        asset: null,
        body: '<p>Sent long before a message was a page.</p>',
      },
      async () => ({ providerId: 'historic-1' }),
    )
    expect(await messagesOf(tenant, contactId)).toHaveLength(1)

    // …and today's sender reads that as *this message, already sent*.
    const now = await submit(site, 'old-form', address, mailer.send)
    expect(now.contactId).toBe(contactId)
    expect(now.message).toEqual({ sent: false, skipped: 'already_sent' })
    expect(await messagesOf(tenant, contactId)).toHaveLength(1)
  })
})

// ── AC-14 — one business, two sites ─────────────────────────────────────────

describe('REQ-247 — a business with two sites', () => {
  /**
   * AC-14 — two independently editable sets of form emails, and exactly one
   * sign-in template between them.
   *
   * THE ASYMMETRY IS THE WHOLE CLAIM, and it is why §5 exists. A form email is
   * sent BY A SITE, so two sites of one business must be able to say different
   * things — a studio brand and a plumbing brand under one account should not
   * share a welcome. A credential email is sent BY THE BUSINESS: signing in is
   * an act against the account, not against whichever site the person happened
   * to come from, so two sites must NOT produce two sign-in emails to keep in
   * step with each other.
   *
   * BOTH HALVES IN ONE CASE, because the claim is the contrast. A test proving
   * only that two sites differ would be satisfied by a design that moved the
   * credential templates too, which is the mistake §5 is written to prevent.
   */
  it('test_UAT_FC_REQ-247_two_sites_hold_two_messages_and_one_signin', async () => {
    const tenant = `${TENANT}-two-sites`
    const studio = await seedFormSite({
      tenantId: tenant,
      instanceId: 'studio-form',
      template: WELCOME,
      emails: [{ id: WELCOME, subject: 'Welcome from the studio', lines: ['The studio writes this.'] }],
    })
    const plumber = await seedFormSite({
      tenantId: tenant,
      instanceId: 'plumber-form',
      template: WELCOME,
      emails: [
        { id: WELCOME, subject: 'Welcome from the plumbers', lines: ['The plumbers write this.'] },
      ],
    })

    const mailer = capturingMailer()
    const a = await submit(studio, 'studio-form', 'studio-visitor@example.com', mailer.send)
    const b = await submit(plumber, 'plumber-form', 'plumber-visitor@example.com', mailer.send)

    // TWO MESSAGES UNDER ONE NAME, in one business, with no arranging: they are
    // pages of two different sites, in two different revisions, reached only
    // through the site key the submission itself named.
    const fromStudio = (await messagesOf(tenant, a.contactId as string))[0]
    const fromPlumber = (await messagesOf(tenant, b.contactId as string))[0]
    expect(fromStudio.templateKey).toBe(WELCOME)
    expect(fromPlumber.templateKey).toBe(WELCOME)
    expect(fromStudio.subject).toBe('Welcome from the studio')
    expect(fromPlumber.subject).toBe('Welcome from the plumbers')
    expect(fromStudio.body).toContain('The studio writes this.')
    expect(fromStudio.body).not.toContain('plumbers')
    expect(fromPlumber.body).not.toContain('studio')

    // …AND ONE SIGN-IN BETWEEN THEM. `templateFor` is business-scoped and
    // seed-if-absent, so asking twice — once per site's worth of traffic — must
    // answer with the same ticket rather than minting a second.
    const store = await ticketStoreFor(leadEnv(), scopeOf(tenant))
    const once = await templateFor(store, 'signin')
    const twice = await templateFor(store, 'signin')
    expect(twice.uid).toBe(once.uid)
  })
})
