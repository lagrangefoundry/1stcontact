import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route } from '../apps/control-app/src/router'
import type { RouterEnv } from '../apps/control-app/src/router'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { captureLead } from '../apps/control-app/src/lead'
import type { LeadEnv as ControlEnv } from '../apps/control-app/src/lead'
import { openGate, takeAsset } from '../apps/control-app/src/gate'
import { capturingMailer } from '../apps/control-app/src/mail'
import { messagesFor } from '../apps/control-app/src/messages'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { eventsOf } from '../apps/control-app/src/events'
import {
  ASSET_DOWNLOADED,
  PAGE_ACCESSED,
} from '../apps/control-app/src/builder/contact-events.js'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import type { SiteStoreEnv } from '../tools/generate/src/store/d1r2-store'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { seedFormSite, type SeededSite } from './support/lead-site'

/**
 * [[BUG-97]] — **a link minted from the preview opens, end to end.**
 *
 * WHAT MAKES THIS EVIDENCE. The link is taken OUT OF THE MAIL and then FOLLOWED
 * — through `control-app`'s own `route()`, inside workerd, against a real D1
 * database and a real R2 bucket. Nothing is reconstructed: the path a case GETs
 * is the path a recipient's client would GET, and the artifact's bytes are the
 * bytes the store holds. That is what makes *"the operator can actually open it"*
 * a claim about the product rather than about a URL's spelling.
 *
 * THE STATE THIS FILLS. [[BUG-78]] made the preview's form submit for real, and
 * `gateUrl` then minted a link into the PUBLISHED site whatever channel the
 * submission came from. On a site that has never been published that link cannot
 * resolve — so the one surface an operator can press the button on was the one
 * surface whose mail was useless. And it is the surface that matters most: a site
 * with nothing published has no published channel at all, because `public-site`
 * resolves a site through its live revision, so there is not even a form to
 * submit. **Without this route there is no way to test a gated download before
 * sending it to a stranger.**
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a draft link with no route to land on* — the same defect as a published
 *     link on the wrong host, and this file's reason for existing;
 *   - *the draft gate reading the PUBLISHED definition* — which is `null` on a
 *     site with no revision, so the link would 404 for exactly the case it is
 *     for, and would offer last week's artifacts for every other;
 *   - *a token walked sideways into another site under the draft channel* — the
 *     published gate refuses this and a second gate that did not would be a hole
 *     opened by the fix;
 *   - *an arrival through the preview that nothing records* — `recordEvent` is the
 *     one definition of how a fact enters a contact's history, and two gates that
 *     recorded differently would make *"they opened it"* mean two things;
 *   - *the published gate changed on the way past* — asserted through
 *     `public-site`'s own entry point, unchanged.
 */

const APPLIED = applySchema()

const TENANT = 'bug97gate'
const OTHER_TENANT = 'bug97other'
/** A development builder, which is where this link is most often followed. */
const ORIGIN = 'http://127.0.0.1:8788'
const PUBLIC_ORIGIN = 'https://bug97gate.test'

const PAPER_A = { key: 'paper-a', name: 'the first paper', url: 'assets/first.txt' }
const PAPER_B = { key: 'paper-b', name: 'the second paper', url: 'assets/second.txt' }

const DRAFT_BYTES = { 'first.txt': 'FIRST PAPER BYTES', 'second.txt': 'SECOND PAPER BYTES' }

beforeAll(async () => {
  await APPLIED
})

const controlEnv = () =>
  ({
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    MAIL_FROM: '1st Contact <no-reply@bug97gate.test>',
  }) as ControlEnv

function routerEnv(): RouterEnv {
  return {
    ...controlEnv(),
    ASSETS: { fetch: async () => new Response('not found', { status: 404 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

/**
 * `public-site`'s whole environment, with the gate wired to the REAL record.
 *
 * The same shape [[REQ-244]]'s own file uses, so the published half is asserted
 * against the published path rather than against a second opinion about it.
 */
function publicEnv(): PublicEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    SESSION_COOKIE_NAME: '',
    SESSION_COOKIE_DOMAIN: '',
    ASSET_GATE: {
      openGate: (siteKey: string, token: string) => openGate(controlEnv(), siteKey, token),
      takeAsset: (siteKey: string, token: string, assetKey: string) =>
        takeAsset(controlEnv(), siteKey, token, assetKey),
    },
  } as PublicEnv
}

const scopeOf = (businessId = TENANT): Scope => ({ businessId })

/** GET one path through the builder's real router, under one business's scope. */
const get = (path: string, businessId = TENANT): Promise<Response> =>
  route(new Request(`${ORIGIN}${path}`), routerEnv(), scopeOf(businessId))

/** A site gating two papers, with the bytes in its draft. */
const gatedSite = (over: Record<string, unknown> = {}): Promise<SeededSite> =>
  seedFormSite({
    tenantId: TENANT,
    assets: [PAPER_A, PAPER_B],
    draftAssets: DRAFT_BYTES,
    ...over,
  })

/** One preview submission, and the link the mail it produced actually carries. */
async function submitInPreview(
  site: SeededSite,
  email: string,
  tenantId = TENANT,
): Promise<{ contactId: string; link: string; path: string }> {
  const mailer = capturingMailer()
  const outcome = await captureLead(
    controlEnv(),
    {
      siteKey: site.siteKey,
      formHandle: site.formHandle,
      fields: { email },
      channel: 'draft',
      origin: ORIGIN,
    },
    { send: mailer.send },
  )
  expect(outcome.accepted).toBe(true)
  const contactId = outcome.contactId as string
  const store = await ticketStoreFor(controlEnv(), { businessId: tenantId })
  const records = await messagesFor(store, contactId)
  const match = /https?:\/\/[^\s"'<>]*\/api\/download\/gate_[0-9a-f]{32}/.exec(
    records[0]?.body ?? '',
  )
  if (!match) throw new Error(`no gate link in the mail: ${records[0]?.body}`)
  return { contactId, link: match[0], path: new URL(match[0]).pathname }
}

/** The `href`s a downloads page offers, in the order it lists them. */
function linksOn(html: string): string[] {
  return [...html.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1])
}

/** One contact's history, filtered to a kind. */
async function eventsOfKind(contactId: string, kind: string, tenantId = TENANT) {
  const events = await eventsOf(controlEnv(), { businessId: tenantId }, contactId)
  return events.filter((event) => event.kind === kind)
}

describe('BUG-97 — the link a preview submission mails can be followed', () => {
  /**
   * The whole claim, on the site that matters most: one that has NEVER been
   * published. Press the button, read the mail, follow the link, take the paper.
   */
  it('test_UAT_FC_BUG-97_a_never_published_sites_link_opens_and_lists_what_the_form_promises', async () => {
    const site = await gatedSite({ publish: false })
    const { link } = await submitInPreview(site, 'opens@example.com')

    const page = await get(new URL(link).pathname)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toContain('text/html')
    const html = await page.text()

    // EXACTLY WHAT THIS FORM PROMISES, in declaration order and no others.
    expect(html).toContain(PAPER_A.name)
    expect(html).toContain(PAPER_B.name)
    const offered = linksOn(html)
    expect(offered).toEqual([
      `${new URL(link).pathname}/${PAPER_A.key}`,
      `${new URL(link).pathname}/${PAPER_B.key}`,
    ])
  })

  /**
   * And the artifact the page offers really arrives — out of the DRAFT's own
   * assets, which is where a site being built keeps its bytes.
   */
  it('test_UAT_FC_BUG-97_the_artifact_the_draft_page_links_arrives_as_its_bytes', async () => {
    const site = await gatedSite({ publish: false })
    const { link } = await submitInPreview(site, 'takes@example.com')
    const page = await get(new URL(link).pathname)
    const [first] = linksOn(await page.text())

    const artifact = await get(first)
    expect(artifact.status).toBe(200)
    expect(await artifact.text()).toBe(DRAFT_BYTES['first.txt'])
    // A PER-CONTACT ARTIFACT IS NOBODY ELSE'S, and must not be indexed — the
    // gate's own headers, on a response the preview renderer would otherwise have
    // said nothing about.
    expect(artifact.headers.get('x-robots-tag')).toBe('noindex')
    // THE PROPERTY AND NOT THE SPELLING. `route()` restamps every response it
    // produces through `uncacheable`, so the directive that arrives is the
    // builder's `no-store, must-revalidate` rather than the gate's `private,
    // no-store` — strictly stronger, since bare `no-store` forbids storage by any
    // cache, shared or private. What must hold is that these bytes are never
    // stored, and that is what is asserted.
    expect(artifact.headers.get('cache-control')).toContain('no-store')
  })

  /**
   * A gated page is not cacheable anywhere, on the draft channel as on the
   * published one — it is minted per contact, and a shared copy would serve the
   * first arrival's page to everybody.
   */
  it('test_UAT_FC_BUG-97_the_draft_gated_page_is_never_cacheable', async () => {
    const site = await gatedSite({ publish: false })
    const { link } = await submitInPreview(site, 'nocache@example.com')
    const page = await get(new URL(link).pathname)
    // See the artifact case above on why this is the property rather than the
    // gate's exact directive: `route()` restamps with something stronger.
    expect(page.headers.get('cache-control')).toContain('no-store')
    expect(page.headers.get('x-robots-tag')).toBe('noindex')
  })

  /**
   * The arrival and the download are RECORDED, by the same statement the
   * published gate records them with — `recordEvent` is the one definition of how
   * a fact enters a contact's history, so *"they opened it"* means one thing
   * whichever channel they opened it on.
   */
  it('test_UAT_FC_BUG-97_an_arrival_through_the_preview_is_recorded_like_any_other', async () => {
    const site = await gatedSite({ publish: false })
    const { link, contactId } = await submitInPreview(site, 'recorded@example.com')

    const page = await get(new URL(link).pathname)
    const opened = await eventsOfKind(contactId, PAGE_ACCESSED)
    expect(opened).toHaveLength(1)
    expect((opened[0].detail as Record<string, unknown>).assets).toEqual([
      PAPER_A.key,
      PAPER_B.key,
    ])

    const [, second] = linksOn(await page.text())
    await get(second)
    const took = await eventsOfKind(contactId, ASSET_DOWNLOADED)
    expect(took).toHaveLength(1)
    expect((took[0].detail as Record<string, unknown>).asset).toBe(PAPER_B.key)
  })
})

describe('BUG-97 — the draft gate reads the draft', () => {
  /**
   * A paper added to the form since the last publish is on the page. That is
   * `formDefinitionOf`'s own rule — *read the definition from the rendering the
   * submitter was served* — and the reason the channel had to reach the gate at
   * all: a published read would have offered last week's set.
   */
  it('test_UAT_FC_BUG-97_an_artifact_added_since_the_publish_is_on_the_draft_page', async () => {
    // Published holding ONE paper, then the draft edited to promise two.
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A],
      draftAssets: DRAFT_BYTES,
    })
    const store = await d1r2SiteStore(env as unknown as SiteStoreEnv).forTenant(TENANT)
    const pages = await store.readPages(site.siteKey)
    const home = pages.find((entry) => entry.name === `${site.pageId}.json`)!
    const modules = home.page.modules as Array<Record<string, unknown>>
    const form = modules.find((mod) => mod.id === site.instanceId)!
    ;(form.config as Record<string, unknown>).assets = [PAPER_A, PAPER_B]
    await store.write(site.siteKey, { pages: [home] })

    const { link } = await submitInPreview(site, 'freshly-added@example.com')
    const html = await (await get(new URL(link).pathname)).text()
    expect(html).toContain(PAPER_B.name)
    expect(linksOn(html)).toHaveLength(2)
  })
})

describe('BUG-97 — the draft gate refuses what the published gate refuses', () => {
  /**
   * A valid token under ANOTHER site's key reaches nothing. The grant names the
   * only site it can ever reach; a second gate that took the key from the URL
   * would be a hole this fix opened.
   */
  it('test_UAT_FC_BUG-97_a_token_cannot_be_walked_sideways_on_the_draft_channel', async () => {
    const mine = await gatedSite({ publish: false })
    const theirs = await seedFormSite({
      tenantId: OTHER_TENANT,
      assets: [PAPER_A],
      draftAssets: DRAFT_BYTES,
      publish: false,
    })
    const { link } = await submitInPreview(mine, 'sideways@example.com')
    const token = new URL(link).pathname.split('/').pop() as string

    // Under the other business's own scope, naming their site with my token.
    const refused = await get(
      `/preview/${theirs.siteKey}/draft/api/download/${token}`,
      OTHER_TENANT,
    )
    expect(refused.status).toBe(404)
  })

  /** An unknown token is the ordinary refusal, not an error that says so. */
  it('test_UAT_FC_BUG-97_an_unknown_token_is_refused_on_the_draft_channel', async () => {
    const site = await gatedSite({ publish: false })
    const refused = await get(
      `/preview/${site.siteKey}/draft/api/download/gate_${'0'.repeat(32)}`,
    )
    expect(refused.status).toBe(404)
  })

  /**
   * A site key this business does not hold is a 404, the same check the preview's
   * `api/lead` route makes — so the gate is not a second way to ask which site
   * keys exist.
   */
  it('test_UAT_FC_BUG-97_a_site_this_business_does_not_hold_is_refused', async () => {
    const mine = await gatedSite({ publish: false })
    const { link } = await submitInPreview(mine, 'wrong-scope@example.com')
    const refused = await route(
      new Request(`${ORIGIN}${new URL(link).pathname}`),
      routerEnv(),
      scopeOf(OTHER_TENANT),
    )
    expect(refused.status).toBe(404)
  })

  /**
   * The EDIT channel answers no gate. The site is not meant to be functional in
   * edit mode, and a second channel serving per-contact artifacts would widen
   * this route past the doorway it was opened for.
   */
  it('test_UAT_FC_BUG-97_the_edit_channel_answers_no_gate', async () => {
    const site = await gatedSite({ publish: false })
    const { link } = await submitInPreview(site, 'editchannel@example.com')
    const token = new URL(link).pathname.split('/').pop() as string
    const refused = await get(`/preview/${site.siteKey}/edit/api/download/${token}`)
    expect(refused.status).not.toBe(200)
  })
})

describe('BUG-97 — the published gate is unchanged', () => {
  /**
   * ASSERTED THROUGH `public-site`'s OWN ENTRY POINT, with its real route
   * grammar and the real record behind the binding. The draft gate is an
   * addition; if this moved, the fix broke the path it was not about.
   */
  it('test_UAT_FC_BUG-97_the_published_gate_still_serves_the_page_and_the_paper', async () => {
    const site = await seedFormSite({
      tenantId: TENANT,
      assets: [PAPER_A],
      draftAssets: DRAFT_BYTES,
      outFiles: { 'assets/first.txt': DRAFT_BYTES['first.txt'] },
    })

    // A PUBLISHED submission, so the mail carries the published link.
    const mailer = capturingMailer()
    const outcome = await captureLead(
      controlEnv(),
      { siteKey: site.siteKey, formHandle: site.formHandle, fields: { email: 'live@example.com' } },
      { send: mailer.send },
    )
    const store = await ticketStoreFor(controlEnv(), scopeOf())
    const records = await messagesFor(store, outcome.contactId as string)
    const link = new URL(
      /https:\/\/[^\s"'<>]*\/api\/download\/gate_[0-9a-f]{32}/.exec(records[0].body)![0],
    )
    // The mail names the site's own host; `public-site` is asked for the same
    // PATH, which is the part its grammar resolves.
    expect(link.host).toBe(site.host)

    const page = await publicSite.fetch(
      new Request(`${PUBLIC_ORIGIN}${link.pathname}`),
      publicEnv(),
      {} as ExecutionContext,
    )
    expect(page.status).toBe(200)
    const offered = linksOn(await page.text())
    expect(offered).toEqual([`${link.pathname}/${PAPER_A.key}`])

    const artifact = await publicSite.fetch(
      new Request(`${PUBLIC_ORIGIN}${offered[0]}`),
      publicEnv(),
      {} as ExecutionContext,
    )
    expect(artifact.status).toBe(200)
    expect(await artifact.text()).toBe(DRAFT_BYTES['first.txt'])
    expect(artifact.headers.get('cache-control')).toBe('private, no-store')
  })
})
