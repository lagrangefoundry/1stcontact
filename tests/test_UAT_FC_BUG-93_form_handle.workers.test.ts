import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead, formDefinitionOf } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { capturingMailer } from '../apps/control-app/src/mail'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { eventsOf } from '../apps/control-app/src/events'
import { FORM_SUBMITTED } from '../apps/control-app/src/builder/contact-events.js'
import { contactForm } from '../packages/framework/src/modules/contact-form/component'
import {
  FORM_INSTANCE_FIELD,
  formHandle,
  parseFormHandle,
} from '../packages/framework/src/modules/contact-form/fields'
import { applySchema } from './support/d1-site-factory'
import { handleFor, seedFormSite } from './support/lead-site'

/**
 * [[BUG-93]] — **a submission resolves the form it was actually made from.**
 *
 * THE DEFECT, STATED ONCE. A component name is unique per PAGE — `editModuleAdd`
 * refuses a second `signup` on one page and permits one on the next, deliberately,
 * because two pages may each reasonably hold a form called `signup`. A submission
 * was resolved per SITE: `formDefinitionOf` scanned every page and took the first
 * instance whose id matched. The XGD site holds two components called `signup`,
 * and `home.json` sorts before `whitepapers.json` — so seven submissions made on
 * the whitepapers page over four days were every one of them recorded under the
 * home page's waitlist label, with no assets and no template, and the send path
 * returned before it began. Nothing anywhere said so.
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * carrying `db/migrations` and a real R2 bucket, through the shipped
 * `captureLead` and the shipped `contactForm`. The witnesses are the ones that
 * cannot be satisfied by a near miss: the contact event the CRM will show, and
 * the message record — written `queued` before a provider is called, so it can
 * neither claim a send that did not happen nor miss one that did.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a submission from one page resolving another page's definition* — the
 *     defect itself, in either direction;
 *   - *resolution that works only because of the order the store returns pages
 *     in* — a fix that passes by accident of sorting is not a fix;
 *   - *a bare instance id still resolving* — a compatibility branch would be the
 *     defect restored, because deciding which of two forms a bare id meant is
 *     exactly what went wrong;
 *   - *a handle naming a page of a DIFFERENT site reaching anything* — the trust
 *     boundary is the route's site and must not have moved;
 *   - *a contact who already received an asset receiving it twice* — the ledger
 *     keys on the asset and the address, and this change must not have shifted
 *     that identity underneath it.
 */

const TENANT = 'bug93-forms'
const OTHER_TENANT = 'bug93-other'
const PAPER_A = { key: 'paper-a', name: 'the first paper', url: 'https://example.test/papers#a' }
const PAPER_B = { key: 'paper-b', name: 'the second paper', url: 'https://example.test/papers#b' }

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@bug93.test>',
  } as LeadEnv
}

/** The messages a business holds for a contact, newest first. */
async function messagesOf(tenantId: string, contactId: string) {
  return messagesFor(await ticketStoreFor(leadEnv(), { businessId: tenantId }), contactId)
}

/** The `form.submitted` event a contact carries. */
async function submissionEvent(tenantId: string, contactId: string) {
  const events = await eventsOf(
    { DB: env.DB as D1Database } as LeadEnv,
    { businessId: tenantId },
    contactId,
  )
  return events.find((e) => e.kind === FORM_SUBMITTED)
}

/**
 * The XGD shape: a home page whose `signup` is a waitlist promising nothing, and
 * a whitepapers page whose `signup` promises two papers and names a message.
 *
 * THE TWO FORMS SHARE A NAME AND DIFFER IN EVERY OTHER RESPECT, which is what
 * makes a resolution assertion mean something: whichever definition comes back,
 * its template, its assets and its submit label all say which page it came from.
 */
async function xgdShapedSite(tenantId = TENANT) {
  return seedFormSite({
    tenantId,
    instanceId: 'signup',
    submitLabel: 'Join the waitlist',
    template: '',
    alsoPages: [
      {
        id: 'whitepapers',
        forms: [
          {
            instanceId: 'signup',
            submitLabel: 'Send me both papers',
            template: 'whitepapers-email',
            assets: [PAPER_A, PAPER_B],
          },
        ],
      },
    ],
  })
}

beforeAll(async () => {
  await applySchema()
})

describe('BUG-93 — a form handle names its page', () => {
  it('test_UAT_FC_BUG-93_a_submission_resolves_the_form_it_was_made_from', async () => {
    const site = await xgdShapedSite()
    const mailer = capturingMailer()

    // THE SUBMISSION THE OPERATOR ACTUALLY MADE: the whitepapers page's form.
    const outcome = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        formHandle: handleFor('whitepapers', 'signup'),
        fields: { email: 'papers@example.com' },
      },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    // THE SECOND PAGE'S DEFINITION, WHICH IS THE WHOLE TICKET. Under the defect
    // this was `home`'s: no assets at all, and `assets: []` rather than two
    // deliveries.
    expect(outcome.assets).toEqual([
      { key: PAPER_A.key, sent: true },
      { key: PAPER_B.key, sent: true },
    ])

    // AND THE MAIL LEFT THE BUILDING — two messages, one per paper, each naming
    // its own artifact. Silence here was the symptom the ticket was filed for.
    const records = await messagesOf(TENANT, outcome.contactId as string)
    expect(records.flatMap((m) => m.assets).sort()).toEqual([PAPER_A.key, PAPER_B.key])
    expect(mailer.sent).toHaveLength(2)
    expect(new Set(mailer.sent.map((m) => m.to))).toEqual(new Set(['papers@example.com']))

    // AND THE DOWNLOAD GRANT IS FILED UNDER THE HANDLE. `asset_grants` was keyed
    // on a bare component id, so a grant for the whitepapers `signup` and one for
    // the home page's were the same row under the live-grant unique index —
    // whichever was minted first would have opened the other form's artifacts.
    const grant = await (env.DB as D1Database)
      .prepare('SELECT form_handle AS handle FROM asset_grants WHERE contact_id = ?')
      .bind(outcome.contactId as string)
      .first<{ handle: string }>()
    expect(grant?.handle).toBe('whitepapers:signup')
  })

  it('test_UAT_FC_BUG-93_the_event_names_the_page_actually_submitted_from', async () => {
    const site = await xgdShapedSite()
    const outcome = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        formHandle: handleFor('whitepapers', 'signup'),
        fields: { email: 'provenance@example.com' },
      },
      { send: capturingMailer().send },
    )

    // THE RECORD IN THE CRM. Under the defect every one of these three said
    // `home` — the page, the button the operator never pressed, and no assets.
    const submitted = await submissionEvent(TENANT, outcome.contactId as string)
    expect(submitted?.detail.page).toBe('whitepapers.json')
    expect(submitted?.detail.submitLabel).toBe('Send me both papers')
    expect(submitted?.detail.assets).toEqual([PAPER_A.key, PAPER_B.key])
    // THE HANDLE ITSELF IS THE `form`, so the record says which of the two
    // identically-named components it was without anyone having to infer it.
    expect(submitted?.detail.form).toBe('whitepapers:signup')
  })

  it('test_UAT_FC_BUG-93_the_other_form_on_the_same_site_is_unaffected', async () => {
    const site = await xgdShapedSite()
    const mailer = capturingMailer()

    // THE HOME PAGE'S WAITLIST: same name, no template, no assets. It sent
    // nothing before this change and must send nothing after it — the fix must
    // not have made every form deliver.
    const outcome = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        formHandle: site.formHandle,
        fields: { email: 'waitlist@example.com' },
      },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    expect(outcome.assets).toEqual([])
    expect(outcome.message).toBeUndefined()
    expect(mailer.sent).toHaveLength(0)

    const submitted = await submissionEvent(TENANT, outcome.contactId as string)
    expect(submitted?.detail.page).toBe('home.json')
    expect(submitted?.detail.submitLabel).toBe('Join the waitlist')
    expect(submitted?.detail.assets).toBeUndefined()
  })

  it('test_UAT_FC_BUG-93_resolution_does_not_depend_on_page_order', async () => {
    // TWO PAGES WHOSE IDS SORT EITHER SIDE OF THE HOME PAGE'S, so whichever way
    // the store returns them, one of these two is reached by walking FORWARD
    // past a same-named form and the other by walking BACKWARD past one. A fix
    // that merely reversed a scan passes half of this and fails the other half.
    const site = await seedFormSite({
      tenantId: TENANT,
      instanceId: 'signup',
      submitLabel: 'Home',
      template: '',
      alsoPages: [
        { id: 'aaa', forms: [{ instanceId: 'signup', submitLabel: 'First', template: '' }] },
        { id: 'zzz', forms: [{ instanceId: 'signup', submitLabel: 'Last', template: '' }] },
      ],
    })

    for (const [pageId, label] of [
      ['aaa', 'First'],
      ['home', 'Home'],
      ['zzz', 'Last'],
    ] as const) {
      const definition = await formDefinitionOf(
        leadEnv(),
        TENANT,
        site.siteKey,
        handleFor(pageId, 'signup'),
      )
      expect(definition?.page).toBe(`${pageId}.json`)
      expect(definition?.submitLabel).toBe(label)
    }
  })

  it('test_UAT_FC_BUG-93_a_bare_instance_id_resolves_nothing_and_writes_nothing', async () => {
    const site = await xgdShapedSite()

    // NO COMPATIBILITY BRANCH. A bare id is precisely the value that cannot say
    // which of two `signup` components it meant, and answering it would be the
    // defect reinstated under a kinder name.
    expect(parseFormHandle('signup')).toBeNull()
    expect(
      await formDefinitionOf(leadEnv(), TENANT, site.siteKey, 'signup'),
    ).toBeNull()

    // THE CONTACT IS STILL CAPTURED — a submission with an address in it is a
    // lead whatever its handle says — but nothing is promised and nothing is
    // sent, because no definition was resolved to promise it.
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, formHandle: 'signup', fields: { email: 'bare@example.com' } },
      { send: mailer.send },
    )
    expect(outcome.assets).toEqual([])
    expect(mailer.sent).toHaveLength(0)
    const submitted = await submissionEvent(TENANT, outcome.contactId as string)
    expect(submitted?.detail.page).toBeUndefined()
  })

  it('test_UAT_FC_BUG-93_a_handle_naming_a_page_this_site_does_not_hold_resolves_nothing', async () => {
    const site = await xgdShapedSite()
    expect(
      await formDefinitionOf(leadEnv(), TENANT, site.siteKey, handleFor('nowhere', 'signup')),
    ).toBeNull()
    // AND THE RIGHT PAGE WITH THE WRONG INSTANCE IS EQUALLY NOTHING — the second
    // half is looked up ON that page, not anywhere.
    expect(
      await formDefinitionOf(leadEnv(), TENANT, site.siteKey, handleFor('whitepapers', 'nosuch')),
    ).toBeNull()
  })

  it('test_UAT_FC_BUG-93_a_handle_cannot_reach_another_sites_form', async () => {
    const mine = await xgdShapedSite()
    const theirs = await seedFormSite({
      tenantId: OTHER_TENANT,
      instanceId: 'signup',
      submitLabel: 'Not yours',
      template: '',
      alsoPages: [
        {
          id: 'secrets',
          forms: [
            { instanceId: 'signup', submitLabel: 'Theirs', template: 'x', assets: [PAPER_A] },
          ],
        },
      ],
    })

    // THE SITE COMES FROM THE ROUTE AND THE HANDLE NAMES SOMETHING WITHIN IT.
    // `secrets` exists — in the OTHER business's site — and naming it here
    // reaches nothing, because the lookup is scoped by the site the request was
    // addressed to before the handle is read at all.
    expect(
      await formDefinitionOf(leadEnv(), TENANT, mine.siteKey, handleFor('secrets', 'signup')),
    ).toBeNull()
    // The same handle against its OWN site does resolve, so the refusal above is
    // the scope and not a typo.
    expect(
      (await formDefinitionOf(leadEnv(), OTHER_TENANT, theirs.siteKey, handleFor('secrets', 'signup')))
        ?.submitLabel,
    ).toBe('Theirs')
  })

  it('test_UAT_FC_BUG-93_a_single_page_site_is_unaffected', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      instanceId: 'contact',
      submitLabel: 'Send',
      assets: [PAPER_A],
    })
    const mailer = capturingMailer()
    const outcome = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        formHandle: site.formHandle,
        fields: { email: 'single@example.com' },
      },
      { send: mailer.send },
    )

    expect(site.formHandle).toBe('home:contact')
    expect(outcome.assets).toEqual([{ key: PAPER_A.key, sent: true }])
    expect(mailer.sent).toHaveLength(1)
  })

  it('test_UAT_FC_BUG-93_an_asset_already_delivered_is_not_delivered_twice', async () => {
    const site = await xgdShapedSite()
    const handle = handleFor('whitepapers', 'signup')
    const send = (mailer: ReturnType<typeof capturingMailer>) =>
      captureLead(
        leadEnv(),
        { siteKey: site.siteKey, formHandle: handle, fields: { email: 'once@example.com' } },
        { send: mailer.send },
      )

    const first = capturingMailer()
    await send(first)
    expect(first.sent).toHaveLength(2)

    // THE LEDGER KEYS ON THE ASSET AND THE ADDRESS AND NOT ON THE HANDLE, so
    // widening the handle must not have minted a fresh identity that forgets
    // every delivery already made.
    const second = capturingMailer()
    const again = await send(second)
    expect(second.sent).toHaveLength(0)
    expect(again.assets).toEqual([
      { key: PAPER_A.key, sent: false, skipped: 'already_sent' },
      { key: PAPER_B.key, sent: false, skipped: 'already_sent' },
    ])
  })

  it('test_UAT_FC_BUG-93_the_rendered_form_carries_the_page_qualified_handle', async () => {
    // THE OTHER END OF THE SEAM. The receiver above is only correct if the thing
    // on the page actually sends both halves — and the module is the only place
    // that decides what goes on the wire.
    const html = contactForm({
      config: { submitLabel: 'Send me both papers', fields: [{ name: 'email', type: 'email' }] },
      instanceId: 'signup',
      pageId: 'whitepapers',
    })
    expect(html).toContain(
      `<input type="hidden" name="${FORM_INSTANCE_FIELD}" value="whitepapers:signup">`,
    )
    expect(parseFormHandle('whitepapers:signup')).toEqual({
      pageId: 'whitepapers',
      instanceId: 'signup',
    })
    // AND THE GRAMMAR IS ONE FUNCTION, not a string spelled at each end.
    expect(formHandle('whitepapers', 'signup')).toBe('whitepapers:signup')
  })
})
