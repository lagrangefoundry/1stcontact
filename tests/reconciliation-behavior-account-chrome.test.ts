import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { validateSite, type Site } from '../packages/site-schema/src/index'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { ContentSafetyError } from '../packages/framework/src/modules/safety'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import {
  applyAccountChromeSession,
  hasAccountChrome,
} from '../packages/framework/src/modules/account-chrome/session'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { renderSiteFiles } from '../tools/generate/src/render/render'

/**
 * Reconciliation UATs for story-179b8c06 — the `account-chrome` behavior module
 * ([[REQ-200]]): AC-2329 (site-declared capability, every state in the bytes)
 * and AC-2332 (a link control is a real anchor with an allowlisted href).
 * AC-2330 and AC-2331 live on the current contract in
 * `reconciliation-behavior-strict-contract.test.ts`.
 *
 * The module version is the catalog's latest and the slots are the current
 * `accountChromePreset()`, so these tests track the live contract.
 *
 * Exercised at the real boundaries: the site validator and the render pipeline
 * (`renderSiteFiles`) that produces the published bytes.
 */

const CONFIG = {
  signIn: 'https://app.example/sign-in',
  portal: 'https://app.example/account',
  businesses: 'https://app.example/builder',
}

type Capabilities = { accounts?: boolean }

/** A one-page site whose L1 body carries `slotIds` seams, each bound to a chrome. */
function buildSite(opts: {
  capabilities?: Capabilities | Record<string, unknown>
  slotIds?: string[]
  color?: string
}): Record<string, unknown> {
  const slotIds = opts.slotIds ?? ['header-chrome']
  const site = starterSiteJson('acme') as Record<string, unknown>
  const config = site.config as Record<string, unknown>
  if (opts.capabilities !== undefined) config.capabilities = opts.capabilities
  site.pages = [
    {
      id: 'home',
      slug: 'home',
      title: 'Home',
      modules: slotIds.map((slotId, i) => ({
        id: `chrome-${i}`,
        type: 'account-chrome',
        version: latestModuleVersion('account-chrome'),
        slot: slotId,
        config: CONFIG,
        slots: accountChromePreset(opts.color ? { color: opts.color } : {}),
      })),
      l1: {
        widths: [320, 1280],
        background: '#ffffff',
        textColor: '#111827',
        root: {
          kind: 'container',
          id: 'root',
          layout: 'stack',
          children: slotIds.map((slotId) => ({ kind: 'slot', id: slotId, name: slotId })),
        },
      },
    },
  ]
  return site
}

async function publish(site: Record<string, unknown>, edit = false) {
  const checked = validateSite(site)
  expect(checked.ok).toBe(true)
  const rendered = await renderSiteFiles(
    { slug: 'acme', sourceDir: '(memory)', site: site as unknown as Site, assetFiles: [] },
    { edit },
  )
  return { html: rendered.files.get('home.html')!, css: rendered.files.get('theme.css')! }
}

function renderChrome(overrides: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
  const { Component } = getModule('account-chrome', latestModuleVersion('account-chrome'))
  return Component({
    config: { ...CONFIG, ...overrides },
    slots: accountChromePreset(),
    instanceId: 'chrome',
    capabilities: { accounts: true },
    ...extra,
  })
}

function page(html: string) {
  const window = new JSDOM(`<!doctype html><html><body>${html}</body></html>`).window
  return { window, doc: window.document }
}

/** Every `selector { … }` rule in a stylesheet, comments stripped. */
function rules(css: string): Array<{ selector: string; body: string }> {
  const out: Array<{ selector: string; body: string }> = []
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const m of stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    out.push({ selector: m[1].trim(), body: m[2].trim() })
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// AC-2329 — declared per site; every state in the published bytes; closed record
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — account-chrome is gated by a site declaration', () => {
  it('test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none', async () => {
    // Declared: the chrome is published into its slot with all three states.
    const declared = await publish(buildSite({ capabilities: { accounts: true } }))
    const { doc } = page(declared.html)
    const seam = doc.querySelector('[data-l1-slot="header-chrome"]')!
    expect(seam).not.toBeNull()
    const root = seam.querySelector('section.account-chrome')!
    expect(root).not.toBeNull()
    // As published, no session is known: the root says signed out, no businesses.
    expect(root.getAttribute('data-account-chrome')).toBe('signed-out')
    expect(root.hasAttribute('data-account-chrome-businesses')).toBe(false)
    // All three states are present in the bytes.
    expect(root.querySelector('[data-account-chrome-when="signed-out"] [data-account-chrome-open]')).not.toBeNull()
    const portal = root.querySelector('[data-account-chrome-when="signed-in"] [data-account-chrome-portal]')!
    expect(portal.getAttribute('href')).toBe(CONFIG.portal)
    const builder = root.querySelector('[data-account-chrome-when="businesses"] [data-account-chrome-builder]')!
    expect(builder.textContent).toContain('My businesses')
    // Non-current states are hidden by the module's own state rules in the
    // published stylesheet, not by anything the L1 slots author.
    expect(declared.css).toContain(
      ".account-chrome[data-account-chrome='signed-out'] [data-account-chrome-when='signed-in']",
    )
    expect(declared.css).toContain(
      ".account-chrome:not([data-account-chrome-businesses]) [data-account-chrome-when='businesses']",
    )
    // The builder state follows the person: the marker the page carries reveals it.
    const operator = applyAccountChromeSession(declared.html, { signedIn: true, operatesBusiness: true })
    const opRoot = page(operator).doc.querySelector('section.account-chrome')!
    expect(opRoot.getAttribute('data-account-chrome')).toBe('signed-in')
    expect(opRoot.hasAttribute('data-account-chrome-businesses')).toBe(true)

    // Not declared, or declared false: the same page publishes nothing for it.
    for (const capabilities of [undefined, { accounts: false }]) {
      const { html } = await publish(buildSite({ capabilities }))
      expect(hasAccountChrome(html)).toBe(false)
      expect(html).not.toContain('class="account-chrome"')
      expect(html).not.toContain('data-account-chrome-portal')
      expect(html).not.toContain(CONFIG.signIn)
    }

    // Nothing varies by which site it is rendered for: a second site with a
    // different identity but the same config, slots and capability renders the
    // same chrome bytes.
    const other = buildSite({ capabilities: { accounts: true } })
    ;(other.config as Record<string, unknown>).businessName = 'A Completely Different Business'
    const otherHtml = (await publish(other)).html
    const chromeOf = (html: string) => page(html).doc.querySelector('section.account-chrome')!.outerHTML
    expect(chromeOf(otherHtml)).toBe(chromeOf(declared.html))

    // The record is CLOSED: a misspelt capability key fails site validation
    // rather than being silently dropped.
    const typo = buildSite({ capabilities: { acounts: true } })
    const typoResult = validateSite(typo)
    expect(typoResult.ok).toBe(false)
    if (!typoResult.ok) {
      const capIssues = typoResult.errors.filter((e) => e.path.includes('capabilities'))
      expect(capIssues.length).toBeGreaterThan(0)
      expect(capIssues.map((e) => e.message).join(' ')).toContain('acounts')
    }
    // ...while the spelt-correctly record (and its absence) still validates.
    for (const capabilities of [undefined, { accounts: true }, { accounts: false }]) {
      expect(validateSite(buildSite({ capabilities })).ok).toBe(true)
    }
  })
})

// AC-2330 and AC-2331 are covered on the current (v2) contract by
// tests/reconciliation-behavior-strict-contract.test.ts.

// ════════════════════════════════════════════════════════════════════════════
// AC-2332 — a link control is a real <a> with L1 paint and an allowlisted href
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — link controls', () => {
  it('test_UAT_AC2332_link_control_emits_a_real_anchor_with_an_allowlisted_href', async () => {
    const { html } = await publish(buildSite({ capabilities: { accounts: true }, color: '#2a3b4c' }))
    const { doc } = page(html)

    for (const [marker, href] of [
      ['data-account-chrome-portal', CONFIG.portal],
      ['data-account-chrome-builder', CONFIG.businesses],
    ] as const) {
      const link = doc.querySelector(`[${marker}]`)!
      expect(link.tagName).toBe('A')
      expect(link.getAttribute('href')).toBe(href)
      // L1's class carries its paint: the class is styled with the slot's colour.
      const cls = link.getAttribute('class')
      expect(cls).toBeTruthy()
      const styled = [...doc.querySelectorAll('style')]
        .map((s) => s.textContent ?? '')
        .join('\n')
      const first = cls!.split(/\s+/)[0]
      const rule = rules(styled).find((r) => r.selector.split(',').some((s) => s.trim() === `.${first}`))
      expect(rule?.body).toMatch(/#2a3b4c/i)
      // The module contributes only href and its marker; no inline style or handler.
      const names = link.getAttributeNames()
      expect(names.some((n) => n === 'style' || n.startsWith('on'))).toBe(false)
    }

    // Sign In, submit and close stay buttons.
    expect(doc.querySelector('[data-account-chrome-open]')!.tagName).toBe('BUTTON')
    expect(doc.querySelector('form[data-account-chrome-dialog] [type="submit"]')!.tagName).toBe('BUTTON')
    expect(doc.querySelector('[data-account-chrome-close]')!.tagName).toBe('BUTTON')
    expect(accountChromeMeta.controls.portal.element).toBe('a')
    expect(accountChromeMeta.controls.businesses.element).toBe('a')

    // A javascript: link target is refused at render, not emitted.
    expect(() => renderChrome({ portal: 'javascript:alert(1)' })).toThrow(ContentSafetyError)
    expect(() => renderChrome({ businesses: 'JavaScript:alert(1)' })).toThrow(ContentSafetyError)
  })
})
