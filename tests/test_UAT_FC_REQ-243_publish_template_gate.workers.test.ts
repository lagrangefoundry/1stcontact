import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import controlApp from '../apps/control-app/src/index'
import type { Env as ControlEnv } from '../apps/control-app/src/index'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { TEMPLATE_TYPE } from '../apps/control-app/src/templates'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * [[REQ-243]] §2 — **the check that replaced the closed set**, at the surface an
 * author actually publishes through.
 *
 * THE COMPANION TO THE SEND FILE. That one proves which message a submission
 * produces; this one proves what can never reach a published site, which is a
 * different kind of claim and needs a different boundary. `templates.ts` closed
 * the key set on the argument that *"the failure of a closed set is a refusal at
 * authoring time; the failure of an open one is a send that finds nothing at the
 * moment somebody is waiting for mail"* — and that argument is conceded, not
 * overturned. Opening the vocabulary is only safe because the refusal MOVED: it
 * now comes from the store's actual contents rather than from a literal in the
 * source, and it still lands at authoring time.
 *
 * SO THE ATTEMPTS GO THROUGH `/api/publish` AND NOT THROUGH `publishSite`. The
 * refusal is worth nothing unless it reaches the author, and reaching them is
 * exactly the part a direct call cannot prove: `publishSite` only checks when it
 * is HANDED a predicate, and whether the Worker hands it one — with the real
 * business's real ticket store behind it — is the wiring under test. A test
 * supplying its own `templateRefusal` would assert its own fixture.
 *
 * THE REFUSAL MUST NAME THE FORM AND THE KEY, both. "No such template" sends an
 * author looking through every page; "the beta form is wrong" does not say what
 * to change it to. And the path has to point at the config key, because the
 * toolbar that renders path-pointed validation errors is the surface this
 * arrives on.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a form naming a template nobody wrote reaching a published site* — the
 *     send-finds-nothing failure the closed set existed to prevent, now with
 *     nothing preventing it;
 *   - *a refusal that names neither the form nor the key* — a correct refusal
 *     nobody can act on;
 *   - *a public form publishable with `invite` or `signin`* — one publish from
 *     mailing a redeemable credential to an address a stranger typed;
 *   - *a form naming no template being refused* — capture with no mail is an
 *     ordinary configuration, and a gate that demanded a key would make a
 *     mailing-list form unpublishable;
 *   - *the seeded system keys being reported missing* — `templateFor` is
 *     seed-if-absent, so refusing a publish that is about to work perfectly is
 *     a refusal with no failure behind it;
 *   - *only the first bad form being reported* — two forms wrong means two
 *     publishes to find out, which is the toolbar lying about how much is wrong.
 */

/**
 * ONE BUSINESS PER CASE ([[REQ-236]]).
 *
 * Every case here used to share the tenant `req243-publish` and tell its sites
 * apart by the name it imported under. A payload cannot name one any more —
 * `/api/import` resolves the receiving business's single site — so cases sharing
 * a tenant would be successive writes to one site, and the second publish in
 * this file would be refused for a reason that has nothing to do with templates.
 * A fresh business per case restores the isolation the shared tenant used to
 * provide, and the template a case writes is written into that case's own store.
 */
let businessSeq = 0
const nextBusiness = (): string => `req243-publish-${(businessSeq += 1)}`

function controlEnv(tenant: string): ControlEnv {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async (request: Request | string) =>
        new Response(
          `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
          { status: 200 },
        ),
    } as unknown as Fetcher,
  } as unknown as ControlEnv
}

const call = (tenant: string, path: string, init?: RequestInit): Promise<Response> =>
  controlApp.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, init),
    controlEnv(tenant),
  )

/**
 * One `contact-form`, in the shape a page carries it.
 *
 * IT NAMES THE L1 SLOT IT MOUNTS INTO, because the page validator requires one
 * and {@link publishWith} puts a matching seam in the tree. A module floating
 * free of the layout is a different invalid draft, and a fixture that produced
 * one would never reach the check under test.
 */
function form(id: string, template?: string): Record<string, unknown> {
  return {
    id,
    type: 'contact-form',
    version: 7,
    slot: slotFor(id),
    config: {
      submitLabel: 'Send',
      fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
      ...(template === undefined ? {} : { template }),
    },
    slots: {},
  }
}

/** The seam a given form mounts into. One per form, so two never collide. */
const slotFor = (id: string): string => `${id}-slot`

interface PublishRefusal {
  error: string
  code?: string
  errors?: Array<{ path: string; message: string }>
}

/**
 * Import a site whose home page carries `forms`, then publish it.
 *
 * BUILT ON THE REAL SCAFFOLDER rather than a hand-written page, for the reason
 * [[REQ-149]]'s fixture is: a definition written here would restate the schema,
 * and one that drifts fails as "this draft does not validate" — a test asserting
 * its own mistake rather than the gate.
 */
async function publishWith(
  tenant: string,
  forms: Array<Record<string, unknown>>,
): Promise<{ status: number; body: PublishRefusal }> {
  await ensureTenant(tenant)
  const seed = siteSeed({ slug: nextSlug('req243pub') })
  const scaffolded = seed.pages['home.json'] as Record<string, unknown>
  const l1 = scaffolded.l1 as { root: { children: unknown[] } }
  const home = {
    ...scaffolded,
    modules: forms,
    // THE SEAMS THE FORMS MOUNT INTO, added to the scaffolder's own tree rather
    // than replacing it: what is under test is the template check, and a page
    // rebuilt here would restate the schema and fail as its own mistake.
    l1: {
      ...l1,
      root: {
        ...l1.root,
        children: [
          ...l1.root.children,
          ...forms.map((module) => ({ kind: 'slot', name: slotFor(String(module.id)) })),
        ],
      },
    },
  }
  const imported = await call(tenant, '/api/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      // `slug` NAMES THE SOURCE, not the destination ([[REQ-236]]) — what this
      // site is called on the laptop it came from. The route resolves its own
      // target: the receiving business's single site, minted on the way in.
      slug: seed.slug,
      siteJson: seed.siteJson,
      pages: [{ name: 'home.json', page: home }],
      assets: [],
    }),
  })
  expect(imported.status, await imported.clone().text()).toBe(200)
  // THE KEY THE IMPORT LANDED ON, which is the only handle a publish has.
  const { site } = (await imported.json()) as { site: string }

  const res = await call(tenant, '/api/publish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ site, message: 'go' }),
  })
  return { status: res.status, body: (await res.json()) as PublishRefusal }
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-243 — publishing checks the templates its forms name', () => {
  /**
   * AC-4 — publishing a site whose form names a template that does not exist in
   * that business's store is refused, and the refusal names the form and the
   * missing key.
   */
  it('test_UAT_FC_REQ-243_publishing_a_form_naming_an_unwritten_template_is_refused', async () => {
    const { status, body } = await publishWith(nextBusiness(), [
      form('beta-form', 'never-written'),
    ])

    // THE AUTHOR'S ERROR, reported the way every other invalid draft is — so the
    // toolbar that already renders path-pointed validation errors renders this
    // one with no new surface.
    expect(status).toBe(400)
    expect(body.code).toBe('INVALID_DEFINITION')
    expect(body.errors).toHaveLength(1)

    const [error] = body.errors!
    // BOTH HALVES. The form, because an author looking at a site sees forms and
    // not module indices; the key, because otherwise they know something is
    // wrong and not what to change it to.
    expect(error.message).toContain('beta-form')
    expect(error.message).toContain('never-written')
    // …and a machine-followable path at the config key itself.
    expect(error.path).toBe('/pages/0/modules/0/config/template')
  })

  /**
   * AC-4, the other side — a template the business HOLDS publishes.
   *
   * THE CASE THAT MAKES THE REFUSAL MEAN SOMETHING. A gate that refused
   * everything would pass the case above; what says the check reads the store is
   * that writing the template is what changes the answer.
   */
  it('test_UAT_FC_REQ-243_a_template_the_business_wrote_publishes', async () => {
    const tenant = nextBusiness()
    await ensureTenant(tenant)
    const store = await ticketStoreFor(
      { DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket },
      { businessId: tenant },
    )
    await store.create({
      type: TEMPLATE_TYPE,
      title: 'The beta welcome',
      fields: { template_key: 'beta-welcome', subject: 'Welcome', placeholders: [] },
      body: '<p>You are on the list.</p>',
    })

    const { status, body } = await publishWith(tenant, [form('beta-form', 'beta-welcome')])
    expect(status, JSON.stringify(body)).toBe(200)
  })

  /**
   * AC-4, and the reason the seeded keys are in the available set.
   *
   * `templateFor` IS SEED-IF-ABSENT, so a business that has never been asked for
   * its `asset` template will be given one the first time a download is
   * delivered. Reporting it missing would refuse a publish that is about to work
   * perfectly — a refusal with no failure behind it, which is the worst kind.
   */
  it('test_UAT_FC_REQ-243_a_seeded_system_key_is_not_reported_missing', async () => {
    const { status } = await publishWith(nextBusiness(), [form('gate', 'asset')])
    expect(status).toBe(200)
  })

  /**
   * AC-4 ∩ AC-6 — a public form cannot be PUBLISHED naming a credential message,
   * and the refusal says it is a thing this product will not do rather than a
   * template somebody forgot to write.
   *
   * THE TWO REASONS ARE DIFFERENT MISTAKES and the words have to say which.
   * Otherwise an author writes an `invite` template, finds it still refused, and
   * has learned nothing.
   */
  it('test_UAT_FC_REQ-243_a_credential_template_is_refused_as_forbidden_not_as_missing', async () => {
    for (const key of ['invite', 'signin']) {
      const { status, body } = await publishWith(nextBusiness(), [form('signup-form', key)])
      expect(status).toBe(400)
      const [error] = body.errors!
      expect(error.message).toContain('signup-form')
      expect(error.message).toContain(key)
      // NOT "write one" — no amount of authoring makes this legal.
      expect(error.message).toMatch(/public form cannot send one/)
      expect(error.message).not.toMatch(/Write one/)
    }
  })

  /**
   * AC-2's publish half — a form naming NO template publishes.
   *
   * CAPTURE WITH NO MAIL IS AN ORDINARY CONFIGURATION, and a gate demanding a key
   * would make a mailing-list form unpublishable — turning absence into a missing
   * value rather than the honest way to say "this one sends nothing".
   */
  it('test_UAT_FC_REQ-243_a_form_naming_no_template_publishes', async () => {
    const { status, body } = await publishWith(nextBusiness(), [form('quiet-form')])
    expect(status, JSON.stringify(body)).toBe(200)
  })

  /**
   * AC-4 — two wrong forms are reported together.
   *
   * ONE ERROR PER FORM AND NOT THE FIRST ONE. A site whose two forms both name
   * missing templates should say so once, not across two publishes; a gate that
   * stopped at the first would make the toolbar understate how much is wrong.
   */
  it('test_UAT_FC_REQ-243_every_form_naming_a_bad_template_is_reported_at_once', async () => {
    const { status, body } = await publishWith(nextBusiness(), [
      form('first-form', 'not-a-template'),
      form('second-form', 'signin'),
    ])
    expect(status).toBe(400)
    expect(body.errors).toHaveLength(2)
    expect(body.errors!.map((e) => e.path)).toEqual([
      '/pages/0/modules/0/config/template',
      '/pages/0/modules/1/config/template',
    ])
    expect(body.errors![0].message).toContain('first-form')
    expect(body.errors![1].message).toContain('second-form')
  })
})
