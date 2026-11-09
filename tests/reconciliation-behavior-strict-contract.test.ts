import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { afterEach, describe, expect, it } from 'vitest'
import type { Site } from '../packages/site-schema/src/index'
import * as framework from '../packages/framework/src/index'
import * as worker from '../packages/framework/src/worker'
import { getModule, latestModuleVersion } from '../packages/framework/src/modules/registry'
import { CATALOG } from '../packages/framework/src/modules/catalog'
import { getModuleCss } from '../packages/framework/src/modules/styles'
import { validateBehaviorInstance } from '../packages/framework/src/modules/behavior'
import { ContentSafetyError } from '../packages/framework/src/modules/safety'
import { accountChromeMeta } from '../packages/framework/src/modules/account-chrome/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { applyAccountChromeSession } from '../packages/framework/src/modules/account-chrome/session'
import { enhanceAccountChrome } from '../packages/framework/src/modules/account-chrome/client.js'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'
import { hasSlotPreset, presetSlots } from '../packages/framework/src/l2/presets'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import {
  editBehaviorList,
  editL1Set,
  editModuleAdd,
  editModuleConfigure,
  editPageGet,
} from '../tools/generate/src/cli/edit'
import { projectBehaviorCatalogue } from '../tools/generate/src/cli/kb-projection'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { makeMemorySite, nextSlug, type SiteFixture } from './support/site-factory'

/**
 * Reconciliation UATs for story-179b8c06, plan item 3 of BUNDLE-44 ([[BUG-76]]):
 * account-chrome contract v2 and the strict behavior contract.
 *
 *   AC-2573 — labelMode gives the address field a visible prompt; the invariant
 *             label is a clipped `<label>` every reference surface describes
 *             truthfully.
 *   AC-2574 — undeclared config keys and slot names are refused at write, naming
 *             the key and the declared set; a stored instance with one still
 *             renders.
 *   AC-2575 — a schema error inside a behavior slot reports the same path tail
 *             and key as in the page tree; an unknown kind lists the valid kinds;
 *             a refused write reports every error, up to a stated cap.
 *   AC-2330 — (v2) no-JS POST baseline; one-of-three overlay; status-blind swap
 *             to the authored `sent` subtree; network failure shows `error`.
 *   AC-2331 — (v2) catalogued as account-chrome@2 with six required slots and a
 *             six-slot preset, on the contract with no paint.
 *
 * Driven at the real boundaries: the `1c` edit verbs over an in-memory site
 * store, the render pipeline that produces the published bytes, the catalog in
 * both framework entry points, the preset library, the behavior catalogue and KB
 * projection, and the shipped `client.js` in a JSDOM page with an injected fetch.
 */

const CONFIG = {
  signIn: 'https://app.example/sign-in',
  portal: 'https://app.example/account',
  businesses: 'https://app.example/builder',
}

/** An L1 page: a text run, then one seam per id, the first bound to a chrome instance. */
function chromePage(
  opts: {
    config?: Record<string, unknown>
    slots?: Record<string, unknown>
    seams?: string[]
    bound?: string[]
    color?: string
  } = {},
): Record<string, unknown> {
  const seams = opts.seams ?? ['chrome']
  const bound = opts.bound ?? [seams[0]]
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: bound.map((seam, i) => ({
      id: i === 0 ? 'chrome' : `chrome-${i}`,
      type: 'account-chrome',
      version: 2,
      slot: seam,
      config: { ...CONFIG, ...(opts.config ?? {}) },
      slots: opts.slots ?? accountChromePreset(opts.color ? { color: opts.color } : {}),
    })),
    l1: {
      widths: [320, 1280],
      background: '#ffffff',
      textColor: '#111827',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          { kind: 'text', text: 'Welcome to Acme' },
          ...seams.map((seam) => ({ kind: 'slot', id: seam, name: seam })),
        ],
      },
    },
  }
}

function siteJsonWithAccounts(slug: string): Record<string, unknown> {
  const site = starterSiteJson(slug) as Record<string, unknown>
  ;(site.config as Record<string, unknown>).capabilities = { accounts: true }
  return site
}

/** Render a whole site definition through the publish pipeline. */
async function publish(page: Record<string, unknown>, edit = false) {
  const site = { ...siteJsonWithAccounts('acme'), pages: [page] }
  const rendered = await renderSiteFiles(
    { slug: 'acme', sourceDir: '(memory)', site: site as unknown as Site, assetFiles: [] },
    { edit },
  )
  return { html: rendered.files.get('home.html')!, css: rendered.files.get('theme.css')! }
}

function dom(html: string) {
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

function renderChrome(overrides: Record<string, unknown> = {}, slots: Record<string, unknown> = accountChromePreset()) {
  const { Component } = getModule('account-chrome', latestModuleVersion('account-chrome'))
  return Component({
    config: { ...CONFIG, ...overrides },
    slots: slots as never,
    instanceId: 'chrome',
    capabilities: { accounts: true },
  })
}

/** Run an edit verb that must be refused, returning the refusal. */
async function refusal(run: () => Promise<unknown>): Promise<{ message: string; path?: string; code?: string }> {
  const outcome = await run().then(
    () => null,
    (e: unknown) => e as { message: string; path?: string; code?: string },
  )
  expect(outcome, 'the write was expected to be refused').not.toBeNull()
  return outcome!
}

/** The `<path>: <message>` entry for `p` in a joined refusal message. */
function entryAt(message: string, p: string): string | undefined {
  const found = message.split('; ').find((s) => s.startsWith(`${p}: `))
  return found?.slice(p.length + 2)
}

let site: SiteFixture | null = null
afterEach(async () => {
  await site?.dispose()
  site = null
})

function seedSite(page: Record<string, unknown> = chromePage()): SiteFixture {
  const slug = nextSlug('strict')
  site = makeMemorySite({ slug, siteJson: siteJsonWithAccounts(slug), pages: { 'home.json': page } })
  return site
}

async function storedPage(s: SiteFixture): Promise<unknown> {
  return (await editPageGet(s.slug, 'home', s.opts)).data.page
}

// ════════════════════════════════════════════════════════════════════════════
// AC-2573 — labelMode; the invariant label is a clipped <label>, described truthfully
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — account-chrome v2 address prompt', () => {
  it('test_UAT_AC2573_label_mode_gives_a_visible_prompt_and_the_invariant_label_is_described_truthfully', async () => {
    // The declaration: the same two answers contact-form gives, default visible.
    const mode = accountChromeMeta.config.labelMode
    expect(mode.type).toBe('enum')
    expect([...mode.values]).toEqual(['visible', 'placeholder'])
    expect(mode.default).toBe('visible')
    const cfMode = (contactFormMeta.config.fields as { itemSchema: Record<string, { values?: readonly string[] }> })
      .itemSchema.labelMode
    expect([...cfMode.values!]).toEqual([...mode.values])

    // The published page and stylesheet, under each mode.
    for (const labelMode of ['placeholder', 'visible', undefined] as const) {
      const config = { emailLabel: 'Your email', ...(labelMode ? { labelMode } : {}) }
      const { html, css } = await publish(chromePage({ config }))
      const { doc } = dom(html)
      const field = doc.querySelector('form[data-account-chrome-dialog] input[name="email"]') as HTMLInputElement
      expect(field).not.toBeNull()

      if (labelMode === 'placeholder') {
        // A panel authored from config alone shows the prompt inside the box.
        expect(field.getAttribute('placeholder')).toBe('Your email')
      } else {
        // `visible` (and the default) leave the words to an L1 text run.
        expect(field.hasAttribute('placeholder')).toBe(false)
      }

      // Under every mode: a <label> for the field, holding the configured words,
      // marked invariant, associated by `for`.
      const label = doc.querySelector(`label[for="${field.id}"]`) as HTMLElement
      expect(label).not.toBeNull()
      expect(label.textContent).toBe('Your email')
      expect(label.hasAttribute('data-fc-invariant')).toBe(true)

      // …and clipped to 1×1px by the module stylesheet the page is served with.
      const labelRule = rules(css).find((r) => r.selector === '.account-chrome__label')
      expect(labelRule, 'the published stylesheet carries the label rule').toBeDefined()
      expect(labelRule!.body).toMatch(/width:\s*1px/)
      expect(labelRule!.body).toMatch(/height:\s*1px/)
      expect(labelRule!.body).toMatch(/clip-path:\s*inset\(50%\)/)
      expect(labelRule!.body).toMatch(/overflow:\s*hidden/)
      expect(label.className.split(/\s+/)).toContain('account-chrome__label')
    }

    // The declared element is the element emitted.
    const spec = accountChromeMeta.controls.emailLabel
    expect(spec.element).toBe('label')
    expect(spec.invariant).toBe(true)

    // The edit catalogue does not offer it as a bindable control …
    const behaviors = editBehaviorList().data.behaviors as { type: string; controls: Record<string, unknown> }[]
    const chrome = behaviors.find((b) => b.type === 'account-chrome')!
    expect(Object.keys(chrome.controls)).toContain('email')
    expect(Object.keys(chrome.controls)).not.toContain('emailLabel')

    // … while the published reference lists it, says it cannot be bound from L1,
    // and states the pinned presentation in the declaration's own words.
    const reference = projectBehaviorCatalogue().body
    const line = reference.split('\n').find((l) => l.includes('`emailLabel` — an HTML `label` element'))
    expect(line, 'the reference lists the invariant label control').toBeDefined()
    expect(line!).toContain('cannot be bound from L1')
    expect(line!).toContain(spec.invariantPresentation)
    expect(spec.invariantPresentation).toContain('visually hidden')
    expect(spec.invariantPresentation).toContain('1×1px')
    expect(reference).not.toContain('visible unless L1 hides it')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-2574 — undeclared config keys and slot names are refused at write
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — behavior config and slots are closed at the write boundary', () => {
  it('test_UAT_AC2574_undeclared_config_keys_and_slots_are_refused_at_write_and_a_stored_one_still_renders', async () => {
    const s = seedSite(chromePage({ seams: ['chrome', 'footer'] }))
    const before = await storedPage(s)

    // An undeclared config key, through `configure_component`.
    const cfg = await refusal(() =>
      editModuleConfigure(s.slug, 'home', 'chrome', { account: 'https://app.example/account' }, s.opts),
    )
    expect(cfg.code).toBe('SCHEMA_INVALID')
    expect(cfg.message).toContain("config key 'account' is not declared")
    expect(cfg.message).toMatch(/declared: [^)]*signIn/)
    expect(cfg.message).toMatch(/declared: [^)]*portal/)
    expect(cfg.message).toMatch(/declared: [^)]*labelMode/)
    expect(await storedPage(s)).toEqual(before)

    // An undeclared config key, through `add_component`.
    const addCfg = await refusal(() =>
      editModuleAdd(s.slug, 'home', 'footer-chrome', 'account-chrome', {
        ...s.opts,
        slot: 'footer',
        config: { ...CONFIG, acount: 'x' },
      }),
    )
    expect(addCfg.message).toContain("config key 'acount' is not declared")
    expect(await storedPage(s)).toEqual(before)

    // An undeclared slot name, refused the same way, naming the declared slots.
    const preset = accountChromePreset()
    const slotRefusal = await refusal(() =>
      editModuleAdd(s.slug, 'home', 'footer-chrome', 'account-chrome', {
        ...s.opts,
        slot: 'footer',
        config: CONFIG,
        slots: { ...preset, dialogue: preset.dialog } as never,
      }),
    )
    expect(slotRefusal.message).toContain("slot 'dialogue' is not declared")
    for (const declared of ['signedOut', 'signedIn', 'businesses', 'dialog', 'sent', 'error']) {
      expect(slotRefusal.message).toMatch(new RegExp(`declared: [^)]*\\b${declared}\\b`))
    }
    expect(await storedPage(s)).toEqual(before)

    // Declared names validate as before and are stored.
    await editModuleConfigure(s.slug, 'home', 'chrome', { portalLabel: 'My account', labelMode: 'placeholder' }, s.opts)
    await editModuleAdd(s.slug, 'home', 'footer-chrome', 'account-chrome', {
      ...s.opts,
      slot: 'footer',
      config: CONFIG,
    })
    const after = (await storedPage(s)) as { modules: Array<{ id: string; config: Record<string, unknown> }> }
    expect(after.modules.map((m) => m.id)).toEqual(['chrome', 'footer-chrome'])
    expect(after.modules[0].config.portalLabel).toBe('My account')
    expect(after.modules[0].config.labelMode).toBe('placeholder')

    // Isolation: an instance ALREADY STORED with a stray key and a stray slot
    // still paints, and the rest of the page with it.
    const stray = chromePage({
      config: { account: 'https://app.example/elsewhere' },
      slots: { ...preset, dialogue: { kind: 'text', text: 'STRAY SLOT CONTENT' } },
    })
    const { html } = await publish(stray)
    const { doc } = dom(html)
    expect(html).toContain('Welcome to Acme')
    const section = doc.querySelector('[data-l1-slot="chrome"] section.account-chrome')
    expect(section).not.toBeNull()
    const form = section!.querySelector('form[data-account-chrome-dialog]')!
    expect(form.getAttribute('action')).toBe(CONFIG.signIn)
    expect(section!.querySelector('[data-account-chrome-portal]')!.getAttribute('href')).toBe(CONFIG.portal)
    // The stray key and slot are ignored at render.
    expect(html).not.toContain('https://app.example/elsewhere')
    expect(html).not.toContain('STRAY SLOT CONTENT')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-2575 — slot error localisation; unknown kind; every error reported (capped)
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — a refused write names every fault precisely', () => {
  it('test_UAT_AC2575_slot_errors_localise_like_page_errors_and_a_refusal_reports_every_error', async () => {
    const s = seedSite()
    const before = await storedPage(s)

    // An unrecognised axis key on a node, written once into a behavior slot …
    const badNode = {
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'control', control: 'email', axes: { lineHeight: 24 } }],
    }
    const inSlot = await refusal(() =>
      editL1Set(s.slug, 'home', '0', badNode, { ...s.opts, module: 'chrome', slot: 'dialog' }),
    )
    const slotPath = '/pages/0/modules/0/slots/dialog/children/0/axes'
    const slotMessage = entryAt(inSlot.message, slotPath)
    expect(slotMessage, `refusal reaches the offending node: ${inSlot.message}`).toBeDefined()
    expect(slotMessage!).toContain('lineHeight')
    expect(inSlot.message).not.toContain('/pages/0/modules/0/slots/dialog: Invalid input')
    expect(await storedPage(s)).toEqual(before)

    // … and once into the page's own L1 tree: same tail, same sentence.
    const inPage = await refusal(() => editL1Set(s.slug, 'home', '0.0', badNode, s.opts))
    const pagePath = '/pages/0/l1/root/children/0/children/0/axes'
    const pageMessage = entryAt(inPage.message, pagePath)
    expect(pageMessage, `page refusal reaches the node: ${inPage.message}`).toBeDefined()
    expect(slotPath.endsWith('/children/0/axes') && pagePath.endsWith('/children/0/axes')).toBe(true)
    expect(slotMessage).toBe(pageMessage)

    // An unknown kind names the tag and its valid values, not "Invalid input".
    const picture = { kind: 'picture', src: '/x.png', alt: 'x' }
    const unknown = await refusal(() => editL1Set(s.slug, 'home', '0.0', picture, s.opts))
    const kindMessage = entryAt(unknown.message, '/pages/0/l1/root/children/0')
    expect(kindMessage, unknown.message).toBeDefined()
    expect(kindMessage!).toMatch(/^kind is not one of: /)
    for (const kind of ['text', 'image', 'slot', 'control', 'container']) expect(kindMessage!).toContain(kind)
    expect(kindMessage).not.toBe('Invalid input')

    // Every error, not only the first: two invented field names in one payload.
    const two = {
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'a', axes: { lineHeight: 24 } },
        { kind: 'text', text: 'b', axes: { backgroundGradient: 'x' } },
      ],
    }
    const both = await refusal(() => editL1Set(s.slug, 'home', '0.0', two, s.opts))
    expect(both.message).toContain('lineHeight')
    expect(both.message).toContain('backgroundGradient')
    expect(both.message).not.toContain('more')

    // Capped at 10, with the remainder counted; the primary path is the first error.
    const many = {
      kind: 'container',
      layout: 'stack',
      children: Array.from({ length: 13 }, (_, i) => ({ kind: 'text', text: `t${i}`, axes: { [`bogus${i}`]: 1 } })),
    }
    const capped = await refusal(() => editL1Set(s.slug, 'home', '0.0', many, s.opts))
    const tail = capped.message.match(/; …and (\d+) more$/)
    expect(tail, capped.message).not.toBeNull()
    const listed = capped.message.replace(/; …and \d+ more$/, '').split('; ')
    expect(listed).toHaveLength(10)
    expect(Number(tail![1])).toBeGreaterThanOrEqual(3)
    expect(capped.path).toBeDefined()
    expect(listed[0].startsWith(`${capped.path}: `)).toBe(true)

    // Nothing refused was stored.
    expect(await storedPage(s)).toEqual(before)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-2330 (v2) — no-JS POST baseline; one-of-three overlay; status-blind swap
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — account-chrome v2 sign-in baseline and confirmation', () => {
  it('test_UAT_AC2330_signed_out_chrome_is_a_working_post_form_and_the_sent_swap_is_status_blind', async () => {
    const { html } = await publish(chromePage())

    // ── No script: a real, open POST form against the configured endpoint ──
    {
      const { doc } = dom(html)
      const form = doc.querySelector('form[data-account-chrome-dialog]') as HTMLFormElement
      expect(form.getAttribute('method')).toBe('post')
      expect(form.getAttribute('action')).toBe(CONFIG.signIn)
      expect(form.hasAttribute('hidden')).toBe(false)
      expect(doc.querySelector('[data-account-chrome-open]')!.getAttribute('aria-expanded')).toBe('true')
      const email = form.querySelector('input[name="email"]') as HTMLInputElement
      expect(email.getAttribute('type')).toBe('email')
      expect(email.hasAttribute('required')).toBe(true)
      // Labelled with the default emailLabel wording when config gives none.
      expect(form.querySelector(`label[for="${email.id}"]`)!.textContent).toContain('Email address')
      expect(form.querySelector('button[type="submit"]')).not.toBeNull()
      expect(form.querySelector('[data-account-chrome-close]')!.getAttribute('type')).toBe('button')

      // Three parts inside the form: the authored dialog, sent and error subtrees.
      const formPart = form.querySelector('[data-account-chrome-form]') as HTMLElement
      const sent = form.querySelector('[data-account-chrome-sent]') as HTMLElement
      const error = form.querySelector('[data-account-chrome-error]') as HTMLElement
      expect(formPart.hidden).toBe(false)
      expect(sent.hidden).toBe(true)
      expect(error.hidden).toBe(true)
      for (const control of ['input[name="email"]', 'button[type="submit"]', '[data-account-chrome-close]', 'label']) {
        expect(formPart.querySelector(control), control).not.toBeNull()
      }
      expect(sent.textContent!.replace(/\s+/g, ' ').trim()).toBe('Check your email for a sign-in link.')
      expect(error.textContent!.trim().length).toBeGreaterThan(0)
      // No component-painted message beside the authored cards: the only
      // invariant element inside the form is the programmatic label.
      const invariants = [...form.querySelectorAll('[data-fc-invariant]')]
      expect(invariants.map((e) => e.tagName)).toEqual(['LABEL'])
    }

    const drive = (fetchImpl: (url: string, init: RequestInit) => Promise<Response>) => {
      const { window, doc } = dom(html)
      const section = doc.querySelector('section.account-chrome') as HTMLElement
      enhanceAccountChrome(section, fetchImpl)
      const q = <T extends Element>(sel: string) => doc.querySelector(sel) as unknown as T
      return {
        window,
        doc,
        section,
        form: q<HTMLFormElement>('form[data-account-chrome-dialog]'),
        formPart: q<HTMLElement>('[data-account-chrome-form]'),
        sent: q<HTMLElement>('[data-account-chrome-sent]'),
        error: q<HTMLElement>('[data-account-chrome-error]'),
        email: q<HTMLInputElement>('input[name="email"]'),
        open: q<HTMLButtonElement>('[data-account-chrome-open]'),
      }
    }
    const submit = async (p: ReturnType<typeof drive>) => {
      const event = new p.window.Event('submit', { cancelable: true })
      p.form.dispatchEvent(event)
      await new Promise((r) => setTimeout(r, 0))
      return event
    }

    // ── Script only subtracts: fold, open with focus, close, fetch not navigate ──
    {
      const calls: Array<{ url: string; init: RequestInit }> = []
      const p = drive(async (url, init) => {
        calls.push({ url, init })
        return { ok: true, status: 202 } as Response
      })
      expect(p.section.hasAttribute('data-account-chrome-enhanced')).toBe(true)
      expect(p.form.hidden).toBe(true)
      expect(p.open.getAttribute('aria-expanded')).toBe('false')
      p.open.click()
      expect(p.form.hidden).toBe(false)
      expect(p.open.getAttribute('aria-expanded')).toBe('true')
      expect(p.doc.activeElement).toBe(p.email)
      ;(p.doc.querySelector('[data-account-chrome-close]') as HTMLButtonElement).click()
      expect(p.form.hidden).toBe(true)
      expect(p.open.getAttribute('aria-expanded')).toBe('false')

      p.email.value = 'someone@example.com'
      const event = await submit(p)
      expect(event.defaultPrevented).toBe(true)
      expect(calls).toHaveLength(1)
      expect(calls[0].url).toBe(CONFIG.signIn)
      expect(calls[0].init.method).toBe('POST')
      expect(JSON.parse(String(calls[0].init.body))).toEqual({ email: 'someone@example.com' })
    }

    // ── Completed at any status: the dialog part goes, the sent part shows,
    // identically, and the response is never read ──
    const outcomes: string[] = []
    for (const status of [202, 404, 500]) {
      let read = false
      const response = new Proxy({ ok: status < 400, status } as Response, {
        get(target, prop) {
          if (['json', 'text', 'body', 'blob', 'arrayBuffer', 'formData'].includes(String(prop))) read = true
          return Reflect.get(target, prop)
        },
      })
      const p = drive(async () => response)
      p.email.value = 'who@example.com'
      await submit(p)
      expect(read).toBe(false)
      // Field, submit and close are no longer presented: all inside the hidden part.
      for (const sel of ['input[name="email"]', 'button[type="submit"]', '[data-account-chrome-close]']) {
        expect(p.formPart.contains(p.doc.querySelector(sel))).toBe(true)
      }
      outcomes.push(
        [p.formPart.hidden, p.sent.hidden, p.error.hidden, p.sent.textContent!.replace(/\s+/g, ' ').trim()].join('|'),
      )
    }
    expect(new Set(outcomes).size).toBe(1)
    expect(outcomes[0]).toBe('true|false|true|Check your email for a sign-in link.')

    // ── Only a request that never arrived shows the error, and leaves the form ──
    {
      const p = drive(async () => {
        throw new TypeError('Failed to fetch')
      })
      await submit(p)
      expect(p.error.hidden).toBe(false)
      // The shown text is the authored `error` card (the preset's), not module copy.
      expect(p.error.textContent).toMatch(/could not reach the server/i)
      expect(p.sent.hidden).toBe(true)
      expect(p.formPart.hidden).toBe(false)
      expect(p.email.disabled).toBe(false)
      expect((p.form.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false)
    }

    // ── Edit channel: the form carries no endpoint ──
    const edited = await publish(chromePage(), true)
    const editForm = dom(edited.html).doc.querySelector('form[data-account-chrome-dialog]')!
    expect(editForm).not.toBeNull()
    expect(editForm.hasAttribute('action')).toBe(false)
    expect(edited.html).not.toContain(CONFIG.signIn)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// AC-2331 (v2) — catalogued as @2 beside contact-form; preset; contract; no paint
// ════════════════════════════════════════════════════════════════════════════
describe('story-179b8c06 — account-chrome v2 on the behavior contract', () => {
  it('test_UAT_AC2331_catalogued_as_v2_with_a_six_slot_preset_on_the_contract_with_no_paint', async () => {
    // Catalogued beside contact-form, resolved through one lookup in both hosts.
    const ids = CATALOG.map((m) => `${m.id}@${m.version}`)
    expect(ids).toContain('contact-form@4')
    expect(ids).toContain('account-chrome@2')
    expect(ids).not.toContain('account-chrome@1')
    for (const entry of [framework, worker]) {
      const def = entry.getModule('account-chrome', 2)
      expect(def.meta).toBe(accountChromeMeta)
      expect(def.meta.kind).toBe('behavior')
      expect(typeof def.Component).toBe('function')
      expect(entry.getModule('contact-form', 4).Component).toBeTypeOf('function')
    }

    // Config: three required URLs with no default; optional wording; labelMode;
    // no sent-message wording.
    const cfg = accountChromeMeta.config as Record<string, { type: string; required: boolean; default?: unknown }>
    for (const key of ['signIn', 'portal', 'businesses']) {
      expect(cfg[key].type).toBe('url')
      expect(cfg[key].required).toBe(true)
      expect(cfg[key].default).toBeUndefined()
    }
    for (const [key, spec] of Object.entries(cfg)) {
      if (['signIn', 'portal', 'businesses'].includes(key)) continue
      expect(spec.required).toBe(false)
      expect(spec.type).toBe(key === 'labelMode' ? 'enum' : 'string')
    }
    expect(Object.keys(cfg).some((k) => /sent/i.test(k))).toBe(false)
    for (const key of ['signIn', 'portal', 'businesses']) {
      expect(() => renderChrome({ [key]: 'javascript:alert(1)' })).toThrow(ContentSafetyError)
    }

    // Six required slots; the dialog label is an invariant <label>, unbindable, marked.
    const SLOTS = ['businesses', 'dialog', 'error', 'sent', 'signedIn', 'signedOut']
    expect(Object.keys(accountChromeMeta.slots).sort()).toEqual(SLOTS)
    for (const spec of Object.values(accountChromeMeta.slots)) expect(spec.required).toBe(true)
    expect(accountChromeMeta.controls.emailLabel).toMatchObject({ element: 'label', invariant: true })
    const bindLabel = accountChromePreset()
    ;(bindLabel.dialog as { children: unknown[] }).children.push({ kind: 'control', control: 'emailLabel' })
    const labelErrors = validateBehaviorInstance(accountChromeMeta, { config: CONFIG, slots: bindLabel })
    expect(labelErrors.some((e) => JSON.stringify(e).includes('emailLabel'))).toBe(true)
    expect(dom(renderChrome()).doc.querySelector('label.account-chrome__label')!.hasAttribute('data-fc-invariant')).toBe(
      true,
    )

    // The L2 preset, asked for by behavior id: one valid subtree per slot.
    expect(hasSlotPreset('account-chrome')).toBe(true)
    const preset = presetSlots('account-chrome', {})!
    expect(Object.keys(preset).sort()).toEqual(SLOTS)
    expect(validateBehaviorInstance(accountChromeMeta, { config: CONFIG, slots: preset })).toEqual([])
    const presetPage = dom(renderChrome({}, preset)).doc
    expect(presetPage.querySelector('[data-account-chrome-sent]')!.textContent!.trim().length).toBeGreaterThan(0)
    expect(presetPage.querySelector('[data-account-chrome-error]')!.textContent!.trim().length).toBeGreaterThan(0)
    expect(presetSlots('no-such-behavior', {})).toBeNull()
    expect(hasSlotPreset('no-such-behavior')).toBe(false)

    // L1 decides placement and look: two sites, different seams and paint.
    const header = await publish(chromePage({ seams: ['header-chrome'], color: '#123456' }))
    const footer = await publish(chromePage({ seams: ['footer-chrome'], color: '#654321' }))
    expect(dom(header.html).doc.querySelector('[data-l1-slot="header-chrome"] section.account-chrome')).not.toBeNull()
    expect(dom(footer.html).doc.querySelector('[data-l1-slot="footer-chrome"] section.account-chrome')).not.toBeNull()
    expect(header.html).toContain('#123456')
    expect(footer.html).toContain('#654321')

    // Two instances on one page: separate class namespaces, both follow the state.
    const both = await publish(chromePage({ seams: ['header-chrome', 'footer-chrome'], bound: ['header-chrome', 'footer-chrome'] }))
    const sections = [...dom(both.html).doc.querySelectorAll('section.account-chrome')]
    expect(sections).toHaveLength(2)
    const classesOf = (el: Element) =>
      new Set([...el.querySelectorAll('[class]')].flatMap((e) => [...e.classList]).filter((c) => !c.startsWith('account-chrome')))
    const [a, b] = sections.map(classesOf)
    expect(a.size).toBeGreaterThan(0)
    expect([...a].filter((c) => b.has(c))).toEqual([])
    const signedIn = dom(applyAccountChromeSession(both.html, { signedIn: true, operatesBusiness: false })).doc
    expect([...signedIn.querySelectorAll('section.account-chrome')].map((x) => x.getAttribute('data-account-chrome'))).toEqual(
      ['signed-in', 'signed-in'],
    )

    // Full five-dimension conformance set.
    expect([...accountChromeMeta.conformance.obligations].sort()).toEqual(
      ['isolation', 'responsive', 'safety', 'security', 'x-browser'],
    )

    // No paint: zeroing, state visibility, the invariant label, modal geometry.
    const css = fs.readFileSync(path.join(__dirname, '../packages/framework/src/modules/account-chrome/styles.css'), 'utf8')
    expect(getModuleCss()).toContain(css.trim())
    for (const { selector, body } of rules(css)) {
      expect(body).not.toMatch(/(^|;|\s)(color|font[\w-]*|letter-spacing|line-height|gap|text-[\w-]+)\s*:/)
      for (const m of body.matchAll(/(?:^|;|\s)(margin|padding|border)\s*:\s*([^;]+)/g)) {
        if (selector.includes('.account-chrome__label')) continue
        expect(m[2].trim()).toBe('0')
      }
      if (/(?:^|;|\s)(background|flex-direction|align-items|justify-content|position)\s*:/.test(body)) {
        expect(selector.includes('[data-account-chrome-enhanced]') || selector.includes('.account-chrome__label')).toBe(true)
      }
    }
    // No module-painted message element survives in stylesheet or markup.
    expect(css).not.toContain('account-chrome__sent')
    expect(css).not.toContain('account-chrome__error')
    const plain = renderChrome({}, { ...preset, sent: { kind: 'text', text: 'Sent.' }, error: { kind: 'text', text: 'No.' } })
    expect(plain).not.toContain('Check your email')
    expect(plain).not.toContain('Could not reach the server')

    // Isolation: a repeated (array) binding on a single slot costs that slot only.
    const malformed = { ...accountChromePreset() } as Record<string, unknown>
    malformed.signedIn = [accountChromePreset().signedIn, accountChromePreset().signedIn]
    let out = ''
    expect(() => {
      out = renderChrome({}, malformed)
    }).not.toThrow()
    const iso = dom(out).doc
    expect(iso.querySelector('[data-account-chrome-when="signed-in"] [data-account-chrome-portal]')).toBeNull()
    expect(iso.querySelector('[data-account-chrome-when="signed-out"] [data-account-chrome-open]')).not.toBeNull()
    expect(iso.querySelector('[data-account-chrome-builder]')).not.toBeNull()
    expect(iso.querySelector('form[data-account-chrome-dialog] input[name="email"]')).not.toBeNull()
    expect(iso.querySelector('[data-account-chrome-sent]')).not.toBeNull()
  })
})
