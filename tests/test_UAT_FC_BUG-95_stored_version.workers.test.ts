import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { captureLead, formDefinitionOf } from '../apps/control-app/src/lead'
import type { LeadEnv } from '../apps/control-app/src/lead'
import { capturingMailer } from '../apps/control-app/src/mail'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../tools/generate/src/store/d1r2-store'
import { applySchema } from './support/d1-site-factory'
import { handleFor, seedFormSite } from './support/lead-site'

/**
 * [[BUG-95]] — **a stored form is read under the contract it was written at.**
 *
 * THE DEFECT, STATED ONCE. Migration is an explicit act: `upgradeSiteModules`
 * runs from a CLI command and an API route and nowhere else, deliberately,
 * because an upgrade can drop config keys. Reading was not an explicit act, and
 * the capture path never asked what version it was reading — `instance.config`
 * went straight into v7's `assetsIn` and v7's `template`. So every stored
 * instance was interpreted under today's rules whatever day it was written.
 *
 * FOR `contact-form` THAT WINDOW HAD A SILENT FAILURE IN IT. A v5 instance
 * declares its download as three sibling strings (`asset`, `assetName`,
 * `assetUrl`). v7 looks for `config.assets`, a list, finds none, and reads an
 * absent `template` as *send nothing* — so a v5 form that had been gating a
 * whitepaper captured the contact, told the visitor it had worked, and mailed
 * nobody. `contactFormV6ToV7` exists precisely to stop that, and did not run.
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * carrying `db/migrations` and a real R2 bucket, through the shipped
 * `captureLead`, reading module instances out of a real frozen `site_revisions`
 * snapshot — the immutability that makes stale pins permanent rather than
 * theoretical. The witnesses are what the recipient got and what the store still
 * holds.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a v5 or v6 form gating a download and delivering nothing* — the defect
 *     itself, and the only case in which it is not benign;
 *   - *a fix that invents a delivery* — a form that promised nothing must go on
 *     promising nothing, or the cure mails strangers;
 *   - *a read that writes* — the persisted upgrade stays the explicit, reported,
 *     key-dropping act it is today, and a submission is not it;
 *   - *a module type the catalogue has never heard of throwing* — that is a
 *     different failure and an upgrade pass must not have an opinion about it;
 *   - *a current-version instance taking a different path than before* — this
 *     change must be invisible to the shape every live site is actually in.
 */

const TENANT = 'bug95-versions'
const PAPER_A = { key: 'paper-a', name: 'the first paper', url: 'https://example.test/papers#a' }
const PAPER_B = { key: 'paper-b', name: 'the second paper', url: 'https://example.test/papers#b' }

function leadEnv(): LeadEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@bug95.test>',
  } as LeadEnv
}

/**
 * One module instance exactly as the PUBLISHED REVISION holds it.
 *
 * READ OUT OF THE REVISION AND NOT THE DRAFT, because the revision is what the
 * receiver read and the revision is what must be unchanged by its having done
 * so. Returned as JSON so a comparison is over bytes rather than over whichever
 * fields a test remembered to name.
 */
async function storedModule(siteKey: string, page: string, instanceId: string): Promise<string> {
  const store = await d1r2SiteStore(env as unknown as SiteStoreEnv).forTenant(TENANT)
  const snapshot = await store.readRevision(siteKey, 1)
  const stored = (snapshot?.pages ?? []).find((entry) => entry.name === `${page}.json`)
  const modules = (stored?.page.modules ?? []) as Array<Record<string, unknown>>
  return JSON.stringify(modules.find((m) => m.id === instanceId))
}

beforeAll(async () => {
  await applySchema()
})

describe('BUG-95 — a stored instance is read under its own contract', () => {
  it('test_UAT_FC_BUG-95_a_v5_form_delivers_the_download_it_promised', async () => {
    // THE SILENT FAILURE, ASSERTED DIRECTLY. This is a revision frozen before
    // [[REQ-241]]: the asset is the old triple, and there is no `template` key
    // because v7 had not invented one. Under the defect this captured the
    // contact, reported success and sent nothing at all.
    const site = await seedFormSite({ tenantId: TENANT, legacyAsset: PAPER_A })
    const mailer = capturingMailer()

    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, formHandle: site.formHandle, fields: { email: 'frozen@example.com' } },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    expect(outcome.assets).toEqual([{ key: PAPER_A.key, sent: true }])
    expect(mailer.sent).toHaveLength(1)
    // THE ARTIFACT IS NAMED, which is the half a near miss would fail: the name
    // lives in `assetName`, a key no v7 contract declares, so a message carrying
    // it can only have come through the migration.
    expect(mailer.sent[0]?.body).toContain(PAPER_A.name)
    expect(mailer.sent[0]?.to).toBe('frozen@example.com')
  })

  it('test_UAT_FC_BUG-95_a_v5_form_promising_nothing_still_sends_nothing', async () => {
    // THE BENIGN CASE STAYS BENIGN. XGD's own home page is this shape — a v5
    // waitlist declaring no asset and no template — and it behaves correctly
    // today by coincidence. It must go on behaving correctly on purpose: a fix
    // that reached for a default message here would mail somebody who joined a
    // list, which is worse than the defect it cures.
    const site = await seedFormSite({
      tenantId: TENANT,
      storedVersion: 5,
      submitLabel: 'Join the waitlist',
    })
    const mailer = capturingMailer()

    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, formHandle: site.formHandle, fields: { email: 'waitlist@example.com' } },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    expect(outcome.contactId).toBeTruthy()
    expect(outcome.assets).toEqual([])
    expect(mailer.sent).toHaveLength(0)
  })

  it('test_UAT_FC_BUG-95_a_v6_form_sends_the_message_its_migration_names', async () => {
    // v6 HELD THE ASSET LIST AND NO `template`, because the key did not exist
    // yet. `contactFormV6ToV7`'s rule is that any form declaring an artifact
    // names `asset`, and this is the reading of it that a submission depends on.
    const site = await seedFormSite({
      tenantId: TENANT,
      storedVersion: 6,
      assets: [PAPER_A, PAPER_B],
    })
    const mailer = capturingMailer()

    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, formHandle: site.formHandle, fields: { email: 'six@example.com' } },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    expect(outcome.assets).toEqual([
      { key: PAPER_A.key, sent: true },
      { key: PAPER_B.key, sent: true },
    ])
    expect(mailer.sent).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-95_a_read_does_not_rewrite_the_store', async () => {
    // THE UPGRADE IS IN MEMORY AND THE PERSISTED ONE STAYS AN EXPLICIT ACT. An
    // upgrade drops undeclared config keys and reports each one, which is why it
    // is something an operator runs rather than something a visitor's button
    // press does. `1c module upgrade` must go on finding this instance stale,
    // because it is.
    const site = await seedFormSite({ tenantId: TENANT, legacyAsset: PAPER_B })
    const before = await storedModule(site.siteKey, 'home', site.instanceId)
    expect(JSON.parse(before).version).toBe(5)

    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, formHandle: site.formHandle, fields: { email: 'untouched@example.com' } },
      { send: capturingMailer().send },
    )
    expect(outcome.assets).toEqual([{ key: PAPER_B.key, sent: true }])

    // BYTE FOR BYTE, AND NOT "STILL v5". The pin is the obvious thing to
    // rewrite; the triple quietly becoming a list would be the same defect
    // wearing the store's clothes.
    expect(await storedModule(site.siteKey, 'home', site.instanceId)).toBe(before)
  })

  it('test_UAT_FC_BUG-95_an_instance_at_the_current_version_is_unaffected', async () => {
    // EVERY LIVE SITE IS THIS SHAPE, so the whole of what this change owes them
    // is to be invisible. An instance already at the catalogue's version has no
    // migration to cross, and both the delivery and the stored bytes say so.
    const site = await seedFormSite({ tenantId: TENANT, assets: [PAPER_A] })
    const before = await storedModule(site.siteKey, 'home', site.instanceId)
    expect(JSON.parse(before).version).toBe(7)
    const mailer = capturingMailer()

    const outcome = await captureLead(
      leadEnv(),
      { siteKey: site.siteKey, formHandle: site.formHandle, fields: { email: 'current@example.com' } },
      { send: mailer.send },
    )

    expect(outcome.assets).toEqual([{ key: PAPER_A.key, sent: true }])
    expect(mailer.sent).toHaveLength(1)
    expect(await storedModule(site.siteKey, 'home', site.instanceId)).toBe(before)
  })

  it('test_UAT_FC_BUG-95_a_module_type_the_catalogue_does_not_know_is_left_alone', async () => {
    // A TYPE NOBODY HAS HEARD OF IS A DIFFERENT FAILURE — a module removed, or a
    // page written by a build that had one we do not — and `upgradePageModules`
    // deliberately declines to have an opinion about it. Reading one must
    // therefore capture rather than throw: a submission lost to a 500 is a lead
    // lost, which is a worse answer than the one this ticket started from.
    const site = await seedFormSite({
      tenantId: TENANT,
      alsoModules: [
        {
          id: 'mystery',
          type: 'not-in-the-catalogue',
          version: 3,
          config: { submitLabel: 'Send', fields: [{ name: 'email', label: 'Email', type: 'email' }] },
          slots: {},
        },
      ],
    })
    const mailer = capturingMailer()

    const outcome = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        formHandle: handleFor('home', 'mystery'),
        fields: { email: 'mystery@example.com' },
      },
      { send: mailer.send },
    )

    expect(outcome.accepted).toBe(true)
    expect(outcome.contactId).toBeTruthy()
    expect(mailer.sent).toHaveLength(0)
  })

  it('test_UAT_FC_BUG-95_one_site_carrying_both_shapes_behaves_correctly_on_each', async () => {
    // THE XGD SHAPE. A v5 waitlist on the home page and a v7 gated form on the
    // whitepapers page, in one published revision, submitted through the one
    // path — because the version is a property of the INSTANCE and not of the
    // site, and a fix keyed off anything site-wide would pass every case above
    // and still fail here.
    const site = await seedFormSite({
      tenantId: TENANT,
      instanceId: 'signup',
      storedVersion: 5,
      submitLabel: 'Join the waitlist',
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
    const mailer = capturingMailer()

    const waitlist = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        formHandle: handleFor('home', 'signup'),
        fields: { email: 'both-waitlist@example.com' },
      },
      { send: mailer.send },
    )
    const papers = await captureLead(
      leadEnv(),
      {
        siteKey: site.siteKey,
        formHandle: handleFor('whitepapers', 'signup'),
        fields: { email: 'both-papers@example.com' },
      },
      { send: mailer.send },
    )

    expect(waitlist.assets).toEqual([])
    expect(papers.assets).toEqual([
      { key: PAPER_A.key, sent: true },
      { key: PAPER_B.key, sent: true },
    ])
    expect(mailer.sent).toHaveLength(2)

    // AND THE DEFINITION EACH RESOLVED SAYS WHICH PAGE IT CAME FROM, so the two
    // submissions are demonstrably not both reading the same instance.
    const home = await formDefinitionOf(leadEnv(), TENANT, site.siteKey, handleFor('home', 'signup'))
    const papersForm = await formDefinitionOf(
      leadEnv(),
      TENANT,
      site.siteKey,
      handleFor('whitepapers', 'signup'),
    )
    expect(home?.template).toBe('')
    expect(home?.assets).toEqual([])
    expect(papersForm?.template).toBe('whitepapers-email')
    expect(papersForm?.assets).toHaveLength(2)
  })
})
