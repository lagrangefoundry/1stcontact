import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { validateSite, type Site } from '../packages/site-schema/src/index'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { CATALOG } from '../packages/framework/src/modules/catalog'
import { validateBehaviorInstance } from '../packages/framework/src/modules/behavior'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import {
  applyAccountChromeSession,
  hasAccountChrome,
} from '../packages/framework/src/modules/account-chrome/session'
import { submitAddress } from '../packages/framework/src/modules/account-chrome/client.js'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'
import { hasSlotPreset, presetSlots } from '../packages/framework/src/l2/presets'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { renderSiteFiles } from '../tools/generate/src/render/render'

/**
 * [[REQ-200]] — **Sign In is a feature of any 1c site that has accounts, and 1st
 * Contact's own site is simply the first one.**
 *
 * WHAT THIS FILE IS EVIDENCE FOR. The ticket's whole claim is that the two
 * controls a site with accounts owes its visitors are an L2 behavior module in an
 * L1 slot rather than chrome the platform's Worker paints — so the evidence has to
 * show that L1 really does decide placement and look, that the capability is
 * present or absent PER SITE by declaration, and that nothing in the module
 * branches on which site or which business it is rendering for. Each of those is
 * an assertion below rather than a sentence in a comment.
 */

const CONFIG = {
  signIn: 'https://app.example/sign-in',
  portal: 'https://app.example/account',
  businesses: 'https://app.example/builder',
}

/** Render one instance with the accounts capability declared. */
function render(overrides: Record<string, unknown> = {}, capabilities = { accounts: true }) {
  const { Component } = getModule('account-chrome', latestModuleVersion('account-chrome'))
  return Component({
    config: { ...CONFIG, ...overrides },
    slots: accountChromePreset(),
    instanceId: 'chrome',
    capabilities,
  })
}

function dom(html: string): Document {
  return new JSDOM(`<!doctype html><html><body>${html}</body></html>`).window.document
}

describe('REQ-200 · account-chrome is a behavior module like any other', () => {
  it('test_UAT_FC_REQ_200_module_is_catalogued_beside_contact_form', () => {
    // The precedent named in the ticket: it lands in the same catalog, resolves
    // through the same registry, and carries the same conformance obligations.
    expect(CATALOG.map((m) => m.id)).toContain('account-chrome')
    expect(CATALOG.map((m) => m.id)).toContain('contact-form')
    const def = getModule('account-chrome', latestModuleVersion('account-chrome'))
    expect(def.meta).toBe(accountChromeMeta)
    expect(def.meta.kind).toBe('behavior')
    expect([...def.meta.conformance.obligations]).toContain('isolation')
  })

  it('test_UAT_FC_REQ_200_ships_a_slot_preset_asked_for_by_behavior_id', () => {
    // "It ships a preset, so a site can instantiate it without authoring any L1."
    // Asked for BY BEHAVIOR ID through the general registry, never by a caller
    // that knows which module happens to have one.
    expect(hasSlotPreset('account-chrome')).toBe(true)
    const slots = presetSlots('account-chrome', {})
    expect(slots).not.toBeNull()
    expect(Object.keys(slots ?? {}).sort()).toEqual(
      Object.keys(accountChromeMeta.slots).sort(),
    )
    // Every declared slot is bound and every declared control is painted, so an
    // instance built from the preset alone validates.
    const errors = validateBehaviorInstance(accountChromeMeta, {
      id: 'chrome',
      type: 'account-chrome',
      version: 1,
      config: CONFIG,
      slots: slots ?? {},
    })
    expect(errors).toEqual([])
  })
})

describe('REQ-200 · the capability is declared per site, and never derived', () => {
  it('test_UAT_FC_REQ_200_absent_on_a_site_that_declares_no_accounts', () => {
    // "Plenty of sites have no accounts at all, and a login link on a brochure
    // site is a dead end." Absent is the DEFAULT, so a site that says nothing
    // gets nothing.
    expect(render({}, {})).toBe('')
    expect(render({}, { accounts: false })).toBe('')
    expect(render({}, { accounts: true })).not.toBe('')
  })

  it('test_UAT_FC_REQ_200_declaration_is_a_site_field_and_not_a_member_count', () => {
    // The declaration is a field on the site definition. It cannot be derived
    // from "does this business have any members yet" — the first member signs up
    // BY USING the control — so the schema is where the answer lives and there is
    // nothing in the module that counts anything.
    const site = starterSiteJson('acme') as Record<string, unknown>
    const config = site.config as Record<string, unknown>
    config.capabilities = { accounts: true }
    site.pages = []
    expect(validateSite(site).ok).toBe(true)

    const source = fs.readFileSync(
      path.join(__dirname, '../packages/framework/src/modules/account-chrome/component.ts'),
      'utf8',
    )
    expect(source).toContain('capabilities.accounts')
    expect(source).not.toMatch(/members|memberships|count\(/i)
  })
})

describe('REQ-200 · two states, and what is in each', () => {
  it('test_UAT_FC_REQ_200_signed_out_offers_a_working_address_form', () => {
    // Signed out is what the published snapshot carries, and the sign-in form is
    // a real POST: a visitor with no JavaScript can still send their address.
    const doc = dom(render())
    const section = doc.querySelector('[data-account-chrome]')!
    expect(section.getAttribute('data-account-chrome')).toBe('signed-out')
    expect(section.hasAttribute('data-account-chrome-businesses')).toBe(false)

    const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
    expect(form.getAttribute('method')).toBe('post')
    expect(form.getAttribute('action')).toBe(CONFIG.signIn)
    expect(form.hasAttribute('hidden')).toBe(false)
    expect(doc.querySelector('[data-account-chrome-email]')).not.toBeNull()

    // The Sign In control opens it, and says so accurately before any script runs.
    const open = doc.querySelector('[data-account-chrome-open]')!
    expect(open.getAttribute('aria-expanded')).toBe('true')
    expect(open.getAttribute('aria-controls')).toBe(form.id)
  })

  it('test_UAT_FC_REQ_200_signed_in_offers_the_portal_and_signed_out_does_not', () => {
    // The signed-in state is a portal control pointing at THIS site's portal.
    const doc = dom(applyAccountChromeSession(render(), { signedIn: true, operatesBusiness: false }))
    const section = doc.querySelector('[data-account-chrome]')!
    expect(section.getAttribute('data-account-chrome')).toBe('signed-in')
    const portal = doc.querySelector('[data-account-chrome-portal]')!
    expect(portal.tagName).toBe('A')
    expect(portal.getAttribute('href')).toBe(CONFIG.portal)
  })

  it('test_UAT_FC_REQ_200_builder_link_follows_the_person_not_the_site', () => {
    // "operates a business" is a fact about the PERSON. Signed in and operating
    // none: no builder link. Signed in and operating one: there it is. Neither
    // answer names a site or a business.
    const none = applyAccountChromeSession(render(), {
      signedIn: true,
      operatesBusiness: false,
    })
    const some = applyAccountChromeSession(render(), {
      signedIn: true,
      operatesBusiness: true,
    })
    const marker = (html: string) =>
      dom(html).querySelector('[data-account-chrome]')!.hasAttribute(
        'data-account-chrome-businesses',
      )
    expect(marker(none)).toBe(false)
    expect(marker(some)).toBe(true)

    // The link itself is in both snapshots — it is the marker that reveals it —
    // so the difference is one attribute and not two renders.
    const link = dom(some).querySelector('[data-account-chrome-builder]')!
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe(CONFIG.businesses)
  })

  it('test_UAT_FC_REQ_200_states_are_hidden_by_the_modules_own_invariant_css', () => {
    // Which state is current is behavioural, and a static L1 subtree has no axis
    // to say it with — so the rules that hide the others belong to the module.
    const css = fs.readFileSync(
      path.join(__dirname, '../packages/framework/src/modules/account-chrome/styles.css'),
      'utf8',
    )
    expect(css).toContain("[data-account-chrome='signed-out'] [data-account-chrome-when='signed-in']")
    expect(css).toContain("[data-account-chrome='signed-in'] [data-account-chrome-when='signed-out']")
    expect(css).toContain(
      ".account-chrome:not([data-account-chrome-businesses]) [data-account-chrome-when='businesses']",
    )
  })
})

describe('REQ-200 · the sent message cannot distinguish a known address', () => {
  it('test_UAT_FC_REQ_200_check_your_email_is_identical_either_way', async () => {
    // "That message is shown whether or not the address was known: the response
    // must not reveal who is on the list." The strongest way to honour that is to
    // never read the response, so the same message appears at any status.
    const html = render()
    const outcomes: string[] = []
    for (const status of [202, 404, 500]) {
      const doc = dom(html)
      const section = doc.querySelector('[data-account-chrome]') as HTMLElement
      const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
      await submitAddress(section, form, async () => ({ ok: status < 400, status }) as Response)
      const sent = doc.querySelector('[data-account-chrome-sent]') as HTMLElement
      const error = doc.querySelector('[data-account-chrome-error]') as HTMLElement
      outcomes.push(`${sent.hidden}|${sent.textContent}|${error.hidden}`)
    }
    expect(new Set(outcomes).size).toBe(1)
    expect(outcomes[0]).toBe('false|Check your email for a sign-in link.|true')
  })

  it('test_UAT_FC_REQ_200_only_an_unreachable_server_reports_an_error', async () => {
    // A request that never arrived is a fact about the network, not about the
    // address — the one case that may report itself differently.
    const doc = dom(render())
    const section = doc.querySelector('[data-account-chrome]') as HTMLElement
    const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
    await submitAddress(section, form, async () => {
      throw new Error('offline')
    })
    expect((doc.querySelector('[data-account-chrome-sent]') as HTMLElement).hidden).toBe(true)
    expect((doc.querySelector('[data-account-chrome-error]') as HTMLElement).hidden).toBe(false)
  })
})

describe('REQ-200 · L1 decides where it goes and what it looks like', () => {
  it('test_UAT_FC_REQ_200_two_sites_place_it_differently_and_both_render', async () => {
    // The ticket's acceptance, literally: one site puts it in the header, the
    // other in the footer, they style it differently, and both render correctly.
    const build = (slotId: string, color: string): Site => {
      const site = starterSiteJson('acme') as Record<string, unknown>
      ;(site.config as Record<string, unknown>).capabilities = { accounts: true }
      const slots = accountChromePreset({ color })
      site.pages = [
        {
          id: 'home',
          slug: 'home',
          title: 'Home',
          modules: [
            {
              id: 'chrome',
              type: 'account-chrome',
              version: 1,
              slot: slotId,
              config: CONFIG,
              slots,
            },
          ],
          l1: {
            widths: [320, 1280],
            background: '#ffffff',
            textColor: '#111827',
            root: {
              kind: 'container',
              id: 'root',
              layout: 'stack',
              children: [{ kind: 'slot', id: slotId, name: slotId }],
            },
          },
        },
      ]
      const checked = validateSite(site)
      expect(checked.ok).toBe(true)
      return site as unknown as Site
    }

    const loaded = (site: Site) => ({ slug: 'acme', sourceDir: '(memory)', site, assetFiles: [] })
    const header = await renderSiteFiles(loaded(build('header-chrome', '#123456')))
    const footer = await renderSiteFiles(loaded(build('footer-chrome', '#654321')))

    const headerHtml = header.files.get('home.html')!
    const footerHtml = footer.files.get('home.html')!

    // Placement is the slot the instance is bound to …
    expect(headerHtml).toContain('data-l1-slot="header-chrome"')
    expect(footerHtml).toContain('data-l1-slot="footer-chrome"')
    // … and the look is the L1 in it, so the two differ in paint.
    expect(headerHtml).toContain('#123456')
    expect(footerHtml).toContain('#654321')
    // Both are complete: the chrome, its three states, and its form.
    for (const html of [headerHtml, footerHtml]) {
      expect(hasAccountChrome(html)).toBe(true)
      expect(html).toContain("data-account-chrome-when=\"signed-in\"")
      expect(html).toContain('data-account-chrome-dialog')
    }
  })

  it('test_UAT_FC_REQ_200_no_branch_on_which_site_or_business_it_renders_for', () => {
    // The ticket's own falsifier, as a check rather than a promise. Nothing in
    // the module may name a site, a slug, a tenant, a business id, or 1st
    // Contact itself.
    const dir = path.join(__dirname, '../packages/framework/src/modules/account-chrome')
    for (const file of fs.readdirSync(dir)) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8')
      // Comments are prose about the design and are exempt; the CODE is not.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(
          (line) =>
            !line.trim().startsWith('*') &&
            !line.trim().startsWith('//') &&
            // The package specifier `@1stcontact/site-schema` is the repo's own
            // scope, not a site this module knows about.
            !line.trim().startsWith('import'),
        )
        .join('\n')
      expect(code).not.toMatch(/1stcontact|tenant|businessId|business_id|siteKey|siteId|slug/i)
    }
  })
})
