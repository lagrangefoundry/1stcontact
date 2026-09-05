import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { validateSite } from '../packages/site-schema/src/index'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { validateBehaviorSlots } from '../packages/framework/src/modules/behavior'
import { accountPortalMeta } from '../packages/framework/src/modules/account-portal/meta'
import { accountLine, holdingsLine } from '../packages/framework/src/modules/account-portal/client.js'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { assembleSite } from '../tools/generate/src/store/assemble'
import {
  PORTAL_PATH,
  PORTAL_SLUG,
  portalBusinessId,
  portalFallbackStore,
  portalHomePage,
  portalSiteJson,
} from '../apps/control-app/src/portal'
import { openAccountSurface } from '../apps/control-app/src/builder/business.js'

/**
 * [[REQ-183]] — **the customer portal is a page of a site, and it says nothing
 * that is not true**.
 *
 * WHAT THIS FILE IS EVIDENCE FOR. The ticket's whole claim is that the surface
 * showing an account its own relationship with a business is the customer portal
 * of that business's SITE ([[DOC-40]] §2.1) — so it must be authored as site
 * content, rendered by the renderer that renders everything else, and must not
 * exist a second time as a builder template. Everything below drives the shipped
 * definition through the real renderer, the real behaviour contract and the real
 * client, so "it goes through the site pipeline" is a property something failed
 * rather than a sentence in a comment.
 *
 * THE SECOND CLAIM IS THE HARDER ONE. A **Delete account** control that does not
 * delete the account converts a missing feature into a lie ([[DOC-37]] §6.2), on
 * the one subject where being caught in one is unrecoverable. So the acceptance
 * is not "the deletion works" — no deletion is built — it is that **nothing on
 * the surface claims otherwise**, and that the code has no way to make it claim
 * otherwise later without a test failing.
 *
 * The workers-side sibling proves the serving half against a real Worker, real
 * D1 and a real Access token.
 */

const ACCOUNT_ENDPOINT = '/api/businesses'

/** The shipped default, assembled exactly as the store's own loader assembles it. */
function loadPortal() {
  const loaded = assembleSite({
    slug: PORTAL_SLUG,
    sourceDir: '',
    base: portalSiteJson(),
    pages: [portalHomePage(ACCOUNT_ENDPOINT)],
    assetFiles: [],
  })
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors))
  return loaded.value
}

/** The portal's own page, rendered by the shared renderer. */
async function renderPortal(): Promise<{ html: string; files: Map<string, string> }> {
  const rendered = await renderSiteFiles(loadPortal())
  const html = rendered.files.get('index.html')
  if (!html) throw new Error('the portal rendered no index page')
  return { html, files: rendered.files }
}

/** The visible words of a rendered page, with markup and script removed. */
function visibleText(html: string): string {
  const dom = new JSDOM(html)
  for (const el of dom.window.document.querySelectorAll('script,style,template')) el.remove()
  return dom.window.document.body.textContent ?? ''
}

describe('REQ-183 — the portal is site content, not a template', () => {
  it('test_UAT_FC_REQ-183_the_portal_is_a_site_the_shared_renderer_renders', async () => {
    // The load-bearing claim of §2: the portal is a site definition, it validates
    // as one, and `renderSiteFiles` — the ONE render, of which `1c render` is a
    // writer and the request path is a reader — produces the page. A portal built
    // as an `apps/control-app` template would pass no part of this.
    const site = { ...portalSiteJson(), pages: [portalHomePage(ACCOUNT_ENDPOINT)] }
    expect(validateSite(site).ok).toBe(true)

    const { html, files } = await renderPortal()
    // The behaviour really mounted: the inert `data-l1-slot` placeholder the L1
    // document declares has been replaced by the module's own fragment.
    expect(html).toContain('data-account-portal')
    // And the page is the site's index, so `/account` reaches it without anyone
    // having to know a file name.
    expect(files.has('index.html')).toBe(true)
    // The renderer folded in the module's client behaviour and its invariant CSS
    // through the ordinary catalog path — nothing about the portal is special to
    // the pipeline.
    expect(files.get('capabilities.js') ?? '').toContain('data-account-portal')
    expect(files.get('theme.css') ?? '').toContain('account-portal__identity')
  })

  it('test_UAT_FC_REQ-183_the_portals_site_json_is_the_scaffolders', () => {
    // The portal's `site.json` is DERIVED from what `1c new` scaffolds rather
    // than written out beside it, so its theme, its nav shape and whatever the
    // scaffolder acquires next are the ones every site starts with. A second
    // literal here would be a second answer to "what does a new site look like",
    // and the two would drift silently — the portal keeping a theme nobody else
    // has, for no reason anyone recorded.
    //
    // Two keys are its own and are named here so the derivation cannot quietly
    // widen: the reserved slug it is authored under, and the label a person sees.
    const scaffolded = starterSiteJson(PORTAL_SLUG) as Record<string, unknown>
    const portal = portalSiteJson()
    for (const key of Object.keys(scaffolded)) {
      if (key === 'id' || key === 'config') continue
      expect(portal[key]).toEqual(scaffolded[key])
    }
    expect(Object.keys(portal).sort()).toEqual(Object.keys(scaffolded).sort())
    expect(portal.id).toBe(PORTAL_SLUG)
  })

  it('test_UAT_FC_REQ-183_the_control_may_not_exist_without_the_explanation', () => {
    // §4.2 turned into a contract rather than a convention. Both slots are
    // REQUIRED, so an instance carrying the button and no explanation of what
    // erasure means cannot validate — which is the only way to stop the next
    // author shipping the control on its own.
    const meta = accountPortalMeta
    const complete = portalHomePage(ACCOUNT_ENDPOINT).modules as Array<Record<string, unknown>>
    const slots = complete[0].slots as Record<string, unknown>
    expect(validateBehaviorSlots(meta, slots as never)).toEqual([])

    const withoutExplanation = { body: slots.body }
    const errors = validateBehaviorSlots(meta, withoutExplanation as never)
    expect(errors.map((e) => e.field)).toContain('slots.erasure')
  })

  it('test_UAT_FC_REQ-183_the_explanation_is_readable_with_no_javascript', async () => {
    // The direction of the progressive disclosure, which is the whole of D5. The
    // server renders the explanation OPEN and the client folds it away, so every
    // way the client can fail — no script, a throw, a refused endpoint — leaves a
    // page showing MORE of the truth. Rendered hidden and revealed by script, a
    // scriptless visitor would meet a control that does nothing and says nothing.
    const { html } = await renderPortal()
    const dom = new JSDOM(html)
    const erasure = dom.window.document.querySelector('[data-account-erasure]')
    expect(erasure).not.toBeNull()
    expect((erasure as HTMLElement).hasAttribute('hidden')).toBe(false)

    const words = visibleText(html)
    // [[DOC-37]] §6.1's three retentions are each present with the reason they
    // serve the reader, and the promise is the accurate one rather than "all".
    expect(words).toMatch(/one-way fingerprint/i)
    expect(words).toMatch(/invoices and payments/i)
    expect(words).toMatch(/gave permission and withdrew it/i)
    expect(words).toMatch(/everything we are\s+allowed to delete/i)
  })

  it('test_UAT_FC_REQ-183_no_copy_promises_a_deletion_this_page_performs', async () => {
    // §4.2's constraint, read as a rule about the words. The control is live and
    // what it opens is a conversation rather than a job, so the copy must say the
    // account is closed by ASKING — and must never say it has been, or will be,
    // closed by pressing anything.
    const words = visibleText(await renderPortal().then((r) => r.html))
    expect(words).toMatch(/does not close your account on its own/i)
    expect(words).toMatch(/Ask us and we will do it/i)
    expect(words).not.toMatch(/permanently deleted|has been deleted|will be deleted immediately/i)
  })

  it('test_UAT_FC_REQ-183_the_portal_shows_no_plan_no_charges_and_no_way_to_add_a_business', async () => {
    // §5, named because each is a thing a reasonable hand would add while they
    // were in there. Adding a business is the sharpest: pre-billing,
    // `provisionBusiness` writes a live grant, so a customer-reachable route onto
    // it is an unbounded free-plan mint ([[REQ-180]] D2) — a closed decision this
    // surface must not re-open.
    const { html } = await renderPortal()
    const dom = new JSDOM(html)
    const words = visibleText(html)

    expect(words).not.toMatch(/add a business|new business|create a business/i)
    expect(words).not.toMatch(/invoice #|your plan is|upgrade|£|\$\d/i)
    expect(html).not.toContain('/api/admin/businesses')

    // Two controls and no more: the one that opens the explanation and the one
    // that folds it away. Anything else on this page is a control nobody decided.
    const controls = [...dom.window.document.querySelectorAll('button, input, form')]
    expect(controls.map((c) => c.tagName.toLowerCase()).sort()).toEqual(['button', 'button'])
  })

  it('test_UAT_FC_REQ-183_nothing_on_the_surface_says_tenant', () => {
    // [[REQ-180]] §3's guard walks the two apps, so `portal.ts` is already inside
    // it. The behaviour module is NOT — it lives in the framework — and it is a
    // user-facing surface, so the rule follows it there rather than the surface
    // escaping the rule. Quoted strings only: `tenantId` is internal vocabulary
    // §3 explicitly keeps, and only a quoted string can reach a screen.
    const dir = path.join(__dirname, '..', 'packages/framework/src/modules/account-portal')
    for (const name of fs.readdirSync(dir)) {
      const source = fs.readFileSync(path.join(dir, name), 'utf8')
      for (const literal of source.match(/(['"])(?:\\.|(?!\1).)*\1/g) ?? []) {
        expect(literal.toLowerCase()).not.toContain('tenant')
      }
    }
  })
})

describe('REQ-183 — no deletion mechanism is built', () => {
  it('test_UAT_FC_REQ-183_the_module_has_no_verb_that_could_destroy_anything', () => {
    // The acceptance's flat prohibition, made mechanical. The portal reads and
    // grants nothing (§6) and deletes nothing (§4.1), so the vetted client makes
    // exactly one kind of request. A later hand adding a destructive call has to
    // delete this assertion to do it, which is the point — the button must not be
    // readable as evidence that the machinery behind it exists.
    const client = fs.readFileSync(
      path.join(__dirname, '..', 'packages/framework/src/modules/account-portal/client.js'),
      'utf8',
    )
    expect(client).not.toMatch(/method:\s*'(POST|PUT|PATCH|DELETE)'/i)
    expect(client.match(/method:\s*'[A-Z]+'/g) ?? []).toEqual(["method: 'GET'"])

    // And the contract has nowhere to put one: one endpoint field, and it is the
    // one that answers who is asking.
    const urls = Object.entries(accountPortalMeta.config)
      .filter(([, spec]) => spec.type === 'url')
      .map(([name]) => name)
    expect(urls).toEqual(['account'])
  })
})

describe('REQ-183 — the portal answers about the caller and nobody else', () => {
  it('test_UAT_FC_REQ-183_the_host_business_is_the_one_the_account_belongs_to', () => {
    // D2, and the reason the level-2 portal needs no second implementation. The
    // host is the business the caller is an ACCOUNT OF — never the one they are
    // operating, and never a configured id. Alice operates Alice's Plumbing and
    // her portal is 1st Contact's, because 1st Contact is who she is a customer
    // of; one level down the same expression answers Bob's as Alice's Plumbing.
    const alice = {
      ok: true as const,
      user: { tenant_id: 'acct_1stcontact' },
      businesses: [],
    }
    expect(portalBusinessId(alice as never, { businessId: 'acct_plumbing' })).toBe(
      'acct_1stcontact',
    )
    const bob = { ok: true as const, user: { tenant_id: 'acct_plumbing' }, businesses: [] }
    expect(portalBusinessId(bob as never, null)).toBe('acct_plumbing')

    // With no admission at all — the loopback dev server — the resolved scope is
    // the deployment's own single business, so reporting it is reporting a fact.
    expect(portalBusinessId(null, { businessId: 'acct_dev' })).toBe('acct_dev')
    // With neither, there is no business whose portal this could be.
    expect(portalBusinessId(null, null)).toBeNull()
  })

  it('test_UAT_FC_REQ-183_the_explanation_names_the_callers_own_businesses', () => {
    // §8's third question, answered by computing rather than by asserting (D6).
    // "Delete account" is a request about the account, and an account is relative
    // to the business it is an account of ([[DOC-42]] §6) — so a fixed sentence
    // about businesses is wrong at one level or the other. This one is right at
    // both, because it is the reader's own facts rather than copy.
    expect(
      holdingsLine([
        { id: 'acct_a', name: 'Salon', selectable: true },
        { id: 'acct_b', name: 'Studio', selectable: false },
      ]),
    ).toBe('This account operates 2 businesses: Salon, Studio.')

    // A LAPSED business is still named. It is still the person's, it still holds
    // their site and their customers, and the population most likely to be
    // reading this page is exactly the one whose grants have lapsed — so omitting
    // it would make the surface understate what erasure destroys.
    expect(holdingsLine([{ id: 'acct_b', name: 'Studio', selectable: false }])).toBe(
      'This account operates 1 business: Studio.',
    )

    // One level down an account operates nothing, and the sentence simply does
    // not appear. That is the constraint the amendment's B4 adds: whatever is
    // decided has to read correctly where the account has no businesses at all.
    expect(holdingsLine([])).toBe('')
    expect(holdingsLine(undefined as never)).toBe('')
  })

  it('test_UAT_FC_REQ-183_an_account_is_named_by_the_identity_the_login_verified', () => {
    // The email is the fallback and not the ornament: it is what Access verified
    // ([[DOC-40]] §2), so it is always true, while a display name is a label
    // somebody may never have set.
    expect(accountLine({ name: 'Alice', email: 'a@example.test' })).toBe('Alice — a@example.test')
    expect(accountLine({ name: null, email: 'a@example.test' })).toBe('a@example.test')
    expect(accountLine(null)).toBe('')
  })
})

describe('REQ-183 — the client only ever subtracts', () => {
  it('test_UAT_FC_REQ-183_the_control_opens_and_closes_the_explanation', async () => {
    const { html } = await renderPortal()
    const dom = new JSDOM(`<!doctype html><body>${html}</body>`, { runScripts: 'outside-only' })
    const { enhanceAccountPortal } = await import(
      '../packages/framework/src/modules/account-portal/client.js'
    )
    const section = dom.window.document.querySelector('[data-account-portal]') as HTMLElement
    const erasure = dom.window.document.querySelector('[data-account-erasure]') as HTMLElement
    const reveal = dom.window.document.querySelector('button[aria-expanded]') as HTMLElement

    // Enhancement's FIRST act is the fold. Before it, the explanation is open —
    // which is the state a visitor with no script is left in.
    expect(erasure.hasAttribute('hidden')).toBe(false)
    enhanceAccountPortal(section, async () => {
      throw new Error('the disclosure must not depend on the endpoint')
    })
    expect(erasure.hasAttribute('hidden')).toBe(true)
    expect(reveal.getAttribute('aria-expanded')).toBe('false')

    // And the control does exactly what its words say: it opens the explanation.
    reveal.dispatchEvent(new dom.window.Event('click'))
    expect(erasure.hasAttribute('hidden')).toBe(false)
    expect(reveal.getAttribute('aria-expanded')).toBe('true')
  })

  it('test_UAT_FC_REQ-183_a_refused_endpoint_costs_the_facts_and_nothing_else', async () => {
    const { html } = await renderPortal()
    const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
    const { loadAccount } = await import(
      '../packages/framework/src/modules/account-portal/client.js'
    )
    const section = dom.window.document.querySelector('[data-account-portal]') as HTMLElement

    await loadAccount(section, async () => new Response('no', { status: 403 }))

    // The explanation is untouched — it is copy, not fetched — and the surface
    // says the facts are missing rather than showing an empty line that reads as
    // a name nobody set.
    const erasure = dom.window.document.querySelector('[data-account-erasure]') as HTMLElement
    expect(erasure.hasAttribute('hidden')).toBe(false)
    const error = dom.window.document.querySelector('[data-account-error]') as HTMLElement
    expect(error.hasAttribute('hidden')).toBe(false)
  })

  it('test_UAT_FC_REQ-183_the_account_and_its_holdings_are_written_from_the_endpoint', async () => {
    const { html } = await renderPortal()
    const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
    const { loadAccount } = await import(
      '../packages/framework/src/modules/account-portal/client.js'
    )
    const section = dom.window.document.querySelector('[data-account-portal]') as HTMLElement

    let asked: { url: string; init: RequestInit } | null = null
    await loadAccount(section, async (url: string, init: RequestInit) => {
      asked = { url, init }
      return new Response(
        JSON.stringify({
          account: { name: 'Alice', email: 'alice@example.test' },
          businesses: [{ id: 'acct_a', name: 'Salon', selectable: true }],
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    })

    // It asked the endpoint the INSTANCE named — site content, not a path
    // compiled into the module — and it asked for it, nothing more.
    expect(asked!.url).toBe(ACCOUNT_ENDPOINT)
    expect(asked!.init.method).toBe('GET')
    expect(asked!.init.body).toBeUndefined()

    const identity = dom.window.document.querySelector('[data-account-identity]') as HTMLElement
    expect(identity.textContent).toBe('Alice — alice@example.test')
    const holdings = dom.window.document.querySelector('[data-account-holdings]') as HTMLElement
    expect(holdings.textContent).toBe('This account operates 1 business: Salon.')
  })
})

describe('REQ-183 — the avatar links out rather than owning the surface', () => {
  it('test_UAT_FC_REQ-183_the_account_dialog_links_to_the_portal_and_does_not_become_it', () => {
    const dom = new JSDOM('<!doctype html><body><div id="host"></div></body>')
    const g = globalThis as unknown as { document?: Document; window?: Window }
    const savedDoc = g.document
    const savedWin = g.window
    g.document = dom.window.document as unknown as Document
    g.window = dom.window as unknown as Window
    try {
      const host = dom.window.document.getElementById('host') as HTMLElement
      openAccountSurface({
        host,
        account: { name: 'Alice', email: 'alice@example.test' },
        businesses: [{ id: 'acct_a', name: 'Salon', selectable: true }],
        selected: 'acct_a',
      })

      // An anchor rather than a click handler: the portal is a page, so a middle
      // click and a copied link have to work the way they do for any other page.
      const link = host.querySelector('a.builder-account__portal') as HTMLAnchorElement
      expect(link).not.toBeNull()
      expect(link.getAttribute('href')).toBe(PORTAL_PATH)
      expect(link.getAttribute('target')).toBe('_blank')
      // Paired with `target`, never optional — the opener reference is a hole.
      expect(link.getAttribute('rel')).toContain('noopener')

      // And the dialog's bound is unchanged ([[REQ-179]], [[REQ-180]]): facts
      // about the session, plus a way out. Growing plan, charges or details here
      // is [[DOC-40]] §2.1 rule 1's failure mode — the bespoke admin billing page
      // — and would guarantee the portal gets built twice.
      const words = host.textContent ?? ''
      expect(words).not.toMatch(/plan|invoice|payment|billing|delete account/i)
    } finally {
      g.document = savedDoc
      g.window = savedWin
    }
  })
})

describe('REQ-183 — the shipped default is a real store, not a branch', () => {
  it('test_UAT_FC_REQ-183_a_business_with_no_authored_portal_still_has_one', async () => {
    // D3. A business provisioned before this ticket existed holds no portal site,
    // and the store is D1 plus R2, which no migration reaches — so the default is
    // what makes the surface reachable everywhere on the day it lands. It is a
    // real `SiteStore` rather than a special case in the renderer, so the
    // fallback and an authored portal arrive at the renderer identically.
    const store = portalFallbackStore(ACCOUNT_ENDPOINT)
    expect(await store.hasDraft(PORTAL_SLUG)).toBe(true)
    expect(store.slugs()).toEqual([PORTAL_SLUG])

    const pages = await store.readPages(PORTAL_SLUG)
    expect(pages.map((p) => (p.page as { slug: string }).slug)).toEqual(['home'])

    // It pins the catalog's current version rather than a literal, so a module
    // version bump cannot leave the shipped default pointing at a contract that
    // no longer exists.
    const instance = (pages[0].page as { modules: Array<{ type: string; version: number }> })
      .modules[0]
    expect(instance.type).toBe('account-portal')
    expect(() => getModule(instance.type, instance.version)).not.toThrow()
    expect(instance.version).toBe(latestModuleVersion('account-portal'))
  })
})
