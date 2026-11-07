import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { validateSite, type Site } from '../packages/site-schema/src/index'
import * as framework from '../packages/framework/src/index'
import * as worker from '../packages/framework/src/worker'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { CATALOG } from '../packages/framework/src/modules/catalog'
import { getModuleCss } from '../packages/framework/src/modules/styles'
import { validateBehaviorInstance } from '../packages/framework/src/modules/behavior'
import { ContentSafetyError } from '../packages/framework/src/modules/safety'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import {
  applyAccountChromeSession,
  hasAccountChrome,
} from '../packages/framework/src/modules/account-chrome/session'
import { enhanceAccountChrome } from '../packages/framework/src/modules/account-chrome/client.js'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'
import { hasSlotPreset, presetSlots } from '../packages/framework/src/l2/presets'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { renderSiteFiles } from '../tools/generate/src/render/render'

/**
 * Reconciliation UATs for story-179b8c06 — the `account-chrome` behavior module
 * ([[REQ-200]]): AC-2329 (site-declared capability, every state in the bytes),
 * AC-2330 (no-JS POST baseline, status-blind sent message), AC-2331 (catalogued
 * beside contact-form with an L2 preset, on the module contract), and AC-2332
 * (a link control is a real anchor with an allowlisted href).
 *
 * Exercised at the real boundaries: the site validator, the render pipeline
 * (`renderSiteFiles`) that produces the published bytes, the catalog lookup in
 * both framework entry points, the preset library, and the shipped `client.js`
 * driven in a JSDOM page with an injected `fetch`.
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
        version: 1,
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

// ════════════════════════════════════════════════════════════════════════════
// AC-2330 — no-JS POST baseline; script subtracts; status-blind sent message
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — account-chrome sign-in baseline and enhancement', () => {
  it('test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_sent_is_status_blind', async () => {
    const { html } = await publish(buildSite({ capabilities: { accounts: true } }))

    // ── No script: a real, open POST form against the configured endpoint ──
    {
      const { doc } = page(html)
      const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
      expect(form.getAttribute('method')).toBe('post')
      expect(form.getAttribute('action')).toBe(CONFIG.signIn)
      expect(form.hasAttribute('hidden')).toBe(false)
      const open = doc.querySelector('[data-account-chrome-open]')!
      expect(open.getAttribute('aria-expanded')).toBe('true')
      const email = form.querySelector('input[name="email"]') as HTMLInputElement
      expect(email.getAttribute('type')).toBe('email')
      expect(email.hasAttribute('required')).toBe(true)
      const label = form.querySelector(`label[for="${email.id}"]`)!
      expect(label.textContent).toContain('Email address')
      expect(form.querySelector('button[type="submit"]')).not.toBeNull()
      expect(form.querySelector('[data-account-chrome-close]')!.getAttribute('type')).toBe('button')
    }

    // ── Script subtracts: fold, open with focus, close, fetch instead of navigate ──
    const calls: Array<{ url: string; init: RequestInit }> = []
    const drive = async (fetchImpl: (url: string, init: RequestInit) => Promise<Response>) => {
      const { window, doc } = page(html)
      const section = doc.querySelector('section.account-chrome') as HTMLElement
      enhanceAccountChrome(section, fetchImpl)
      return { window, doc, section }
    }
    {
      const { window, doc, section } = await drive(async (url, init) => {
        calls.push({ url, init })
        return { ok: true, status: 202 } as Response
      })
      const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
      const open = doc.querySelector('[data-account-chrome-open]') as HTMLButtonElement
      const email = doc.querySelector('input[name="email"]') as HTMLInputElement
      expect(section.hasAttribute('data-account-chrome-enhanced')).toBe(true)
      expect(form.hidden).toBe(true)
      expect(open.getAttribute('aria-expanded')).toBe('false')
      open.click()
      expect(form.hidden).toBe(false)
      expect(open.getAttribute('aria-expanded')).toBe('true')
      expect(doc.activeElement).toBe(email)
      ;(doc.querySelector('[data-account-chrome-close]') as HTMLButtonElement).click()
      expect(form.hidden).toBe(true)
      expect(open.getAttribute('aria-expanded')).toBe('false')

      email.value = 'someone@example.com'
      const submit = new window.Event('submit', { cancelable: true })
      form.dispatchEvent(submit)
      expect(submit.defaultPrevented).toBe(true)
      await new Promise((r) => setTimeout(r, 0))
      expect(calls).toHaveLength(1)
      expect(calls[0].url).toBe(CONFIG.signIn)
      expect(calls[0].init.method).toBe('POST')
      expect(JSON.parse(String(calls[0].init.body))).toEqual({ email: 'someone@example.com' })
    }

    // ── Status-blind: 202, 404 and 500 leave the page in the same state, and the
    // response is never read ──
    const outcomes: string[] = []
    for (const status of [202, 404, 500]) {
      let read = false
      const response = new Proxy({ ok: status < 400, status } as Response, {
        get(target, prop) {
          if (['json', 'text', 'body', 'blob', 'arrayBuffer', 'formData'].includes(String(prop))) read = true
          return Reflect.get(target, prop)
        },
      })
      const { window, doc } = await drive(async () => response)
      const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
      form.dispatchEvent(new window.Event('submit', { cancelable: true }))
      await new Promise((r) => setTimeout(r, 0))
      const sent = doc.querySelector('[data-account-chrome-sent]') as HTMLElement
      const error = doc.querySelector('[data-account-chrome-error]') as HTMLElement
      const email = doc.querySelector('input[name="email"]') as HTMLInputElement
      const button = form.querySelector('button[type="submit"]') as HTMLButtonElement
      expect(read).toBe(false)
      outcomes.push(`${sent.hidden}|${sent.textContent}|${error.hidden}|${email.disabled}|${button.disabled}`)
    }
    expect(new Set(outcomes).size).toBe(1)
    expect(outcomes[0]).toBe('false|Check your email for a sign-in link.|true|true|true')

    // ── Only a network failure reports differently, and leaves the form usable ──
    {
      const { window, doc } = await drive(async () => {
        throw new TypeError('Failed to fetch')
      })
      const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
      form.dispatchEvent(new window.Event('submit', { cancelable: true }))
      await new Promise((r) => setTimeout(r, 0))
      expect((doc.querySelector('[data-account-chrome-sent]') as HTMLElement).hidden).toBe(true)
      const error = doc.querySelector('[data-account-chrome-error]') as HTMLElement
      expect(error.hidden).toBe(false)
      expect(error.textContent).toMatch(/could not reach the server/i)
      expect((doc.querySelector('input[name="email"]') as HTMLInputElement).disabled).toBe(false)
      expect((form.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false)
    }

    // ── Edit channel: the form carries no endpoint ──
    const edited = await publish(buildSite({ capabilities: { accounts: true } }), true)
    const editForm = page(edited.html).doc.querySelector('form[data-account-chrome-dialog]')!
    expect(editForm).not.toBeNull()
    expect(editForm.hasAttribute('action')).toBe(false)
    expect(edited.html).not.toContain(CONFIG.signIn)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-2331 — catalogued beside contact-form, preset, contract, no paint, isolation
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — account-chrome on the behavior contract', () => {
  it('test_UAT_AC2331_catalogued_with_a_preset_on_the_contract_with_no_paint', async () => {
    // Catalogued beside contact-form, resolved through the same lookup in both hosts.
    const ids = CATALOG.map((m) => `${m.id}@${m.version}`)
    expect(ids).toContain('contact-form@4')
    expect(ids).toContain('account-chrome@1')
    for (const entry of [framework, worker]) {
      const def = entry.getModule('account-chrome', 1)
      expect(def.meta).toBe(accountChromeMeta)
      expect(def.meta.kind).toBe('behavior')
      expect(typeof def.Component).toBe('function')
      expect(entry.getModule('contact-form', 4).Component).toBeTypeOf('function')
    }

    // Config: three required URLs, optional wording, no default builder URL.
    const cfg = accountChromeMeta.config as Record<string, { type: string; required: boolean; default?: unknown }>
    for (const key of ['signIn', 'portal', 'businesses']) {
      expect(cfg[key].type).toBe('url')
      expect(cfg[key].required).toBe(true)
      expect(cfg[key].default).toBeUndefined()
    }
    for (const [key, spec] of Object.entries(cfg)) {
      if (!['signIn', 'portal', 'businesses'].includes(key)) {
        expect(spec.type).toBe('string')
        expect(spec.required).toBe(false)
      }
    }
    // Unsafe URL schemes are refused, not rendered.
    for (const key of ['signIn', 'portal', 'businesses']) {
      expect(() => renderChrome({ [key]: 'javascript:alert(1)' })).toThrow(ContentSafetyError)
    }

    // Four required slots; the dialog label is an invariant, unbindable, marked.
    expect(Object.keys(accountChromeMeta.slots).sort()).toEqual(['businesses', 'dialog', 'signedIn', 'signedOut'])
    for (const spec of Object.values(accountChromeMeta.slots)) expect(spec.required).toBe(true)
    expect(accountChromeMeta.controls.emailLabel).toMatchObject({ invariant: true })
    const bindLabel = accountChromePreset()
    ;(bindLabel.dialog as { children: unknown[] }).children.push({ kind: 'control', control: 'emailLabel' })
    const labelErrors = validateBehaviorInstance(accountChromeMeta, {
      id: 'chrome',
      type: 'account-chrome',
      version: 1,
      config: CONFIG,
      slots: bindLabel,
    })
    expect(labelErrors.some((e) => JSON.stringify(e).includes('emailLabel'))).toBe(true)
    const label = page(renderChrome()).doc.querySelector('label.account-chrome__label')!
    expect(label.hasAttribute('data-fc-invariant')).toBe(true)

    // L2 preset asked for by behavior id: one valid L1 subtree per slot.
    expect(hasSlotPreset('account-chrome')).toBe(true)
    const preset = presetSlots('account-chrome', {})!
    expect(Object.keys(preset).sort()).toEqual(['businesses', 'dialog', 'signedIn', 'signedOut'])
    expect(
      validateBehaviorInstance(accountChromeMeta, {
        id: 'chrome',
        type: 'account-chrome',
        version: 1,
        config: CONFIG,
        slots: preset,
      }),
    ).toEqual([])
    expect(presetSlots('no-such-behavior', {})).toBeNull()
    expect(hasSlotPreset('no-such-behavior')).toBe(false)

    // L1 decides placement and look: two sites, different slots and paint, both render.
    const header = await publish(buildSite({ capabilities: { accounts: true }, slotIds: ['header-chrome'], color: '#123456' }))
    const footer = await publish(buildSite({ capabilities: { accounts: true }, slotIds: ['footer-chrome'], color: '#654321' }))
    expect(page(header.html).doc.querySelector('[data-l1-slot="header-chrome"] section.account-chrome')).not.toBeNull()
    expect(page(footer.html).doc.querySelector('[data-l1-slot="footer-chrome"] section.account-chrome')).not.toBeNull()
    expect(header.html).toContain('#123456')
    expect(footer.html).toContain('#654321')

    // Two instances on one page: separate class namespaces, both follow the state.
    const both = await publish(buildSite({ capabilities: { accounts: true }, slotIds: ['header-chrome', 'footer-chrome'] }))
    const sections = [...page(both.html).doc.querySelectorAll('section.account-chrome')]
    expect(sections).toHaveLength(2)
    const classesOf = (s: Element) =>
      new Set([...s.querySelectorAll('[class]')].flatMap((e) => [...e.classList]).filter((c) => !c.startsWith('account-chrome')))
    const [a, b] = sections.map(classesOf)
    expect(a.size).toBeGreaterThan(0)
    expect([...a].filter((c) => b.has(c))).toEqual([])
    const signedIn = page(applyAccountChromeSession(both.html, { signedIn: true, operatesBusiness: false })).doc
    const states = [...signedIn.querySelectorAll('section.account-chrome')].map((s) => s.getAttribute('data-account-chrome'))
    expect(states).toEqual(['signed-in', 'signed-in'])

    // Full five-dimension conformance set.
    expect([...accountChromeMeta.conformance.obligations].sort()).toEqual(
      ['isolation', 'responsive', 'safety', 'security', 'x-browser'],
    )

    // No paint: the module's own stylesheet holds only zeroing, state visibility,
    // the invariant label, and post-enhancement modal geometry.
    const css = fs.readFileSync(
      path.join(__dirname, '../packages/framework/src/modules/account-chrome/styles.css'),
      'utf8',
    )
    expect(getModuleCss()).toContain(css.trim())
    for (const { selector, body } of rules(css)) {
      // No type, no text colour, no gap/arrangement anywhere.
      expect(body).not.toMatch(/(^|;|\s)(color|font[\w-]*|letter-spacing|line-height|gap|text-[\w-]+)\s*:/)
      // Spacing is only ever zeroed.
      for (const m of body.matchAll(/(?:^|;|\s)(margin|padding|border)\s*:\s*([^;]+)/g)) {
        if (selector.includes('.account-chrome__label')) continue // invariant visually-hidden label
        expect(m[2].trim()).toBe('0')
      }
      // Fill and arrangement appear only once script has made it a modal.
      if (/(?:^|;|\s)(background|flex-direction|align-items|justify-content|position)\s*:/.test(body)) {
        expect(
          selector.includes('[data-account-chrome-enhanced]') || selector.includes('.account-chrome__label'),
        ).toBe(true)
      }
    }

    // Isolation: a repeated (array) binding on a single slot costs that slot only.
    const malformed = { ...accountChromePreset() } as Record<string, unknown>
    malformed.signedIn = [accountChromePreset().signedIn, accountChromePreset().signedIn]
    let out = ''
    expect(() => {
      out = renderChrome({}, { slots: malformed })
    }).not.toThrow()
    const iso = page(out).doc
    expect(iso.querySelector('[data-account-chrome-when="signed-in"] [data-account-chrome-portal]')).toBeNull()
    expect(iso.querySelector('[data-account-chrome-when="signed-out"] [data-account-chrome-open]')).not.toBeNull()
    expect(iso.querySelector('[data-account-chrome-builder]')).not.toBeNull()
    expect(iso.querySelector('form[data-account-chrome-dialog] input[name="email"]')).not.toBeNull()
  })
})

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
