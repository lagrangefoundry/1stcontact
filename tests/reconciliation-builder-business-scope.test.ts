// @vitest-environment jsdom
/**
 * story-e674c60a — **the business is chosen once, in the shell's chrome, and
 * every tab follows it** (REQ-179, REQ-180 §1/§3).
 *
 * WHAT MAKES THIS EVIDENCE. The mounted cases build the REAL builder over the
 * ACTUALLY-INSTALLED shared `webui-*` components; the shell, the split and the
 * list-detail are never stood in for, because "the switcher is in the shell's
 * header and outside every tab panel" is a claim about the shell's own markup.
 *
 * WHERE A CASE IS ABOUT REQUESTS, THE NETWORK IS THE ONLY THING REPLACED. AC-2145
 * and AC-2146 leave every transport at its shipped default and stub
 * `globalThis.fetch` — the one external boundary a browser client has — so the
 * URLs recorded are the URLs the shipped `api.js` builds. A suite that injected
 * transports would be asserting what the suite asked for.
 *
 * The account surface, the switcher's labels and the vocabulary guard need no
 * shared component, so those halves run unconditionally.
 */

import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import {
  createBusinessSwitcher,
  openAccountSurface,
} from '../apps/control-app/src/builder/business.js'
import * as CONFIG from '../apps/control-app/src/builder/config.js'

const REPO = path.resolve(__dirname, '..')

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let setBusinessScope: (id: string | null) => string | null

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a business-scope suites skipped: ${WEBUI_SKIP_REASON}`)

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

const settle = async (n = 5) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const ACCOUNT = { name: 'Robin Owner', email: 'robin@example.test' }
const TWO = [
  { id: 'acct_salon', name: 'Salon', selectable: true, lapse: null },
  { id: 'acct_studio', name: 'Studio', selectable: true, lapse: null },
]
const WITH_LAPSED = [
  ...TWO,
  { id: 'acct_gone', name: 'Gone', selectable: false, lapse: { reason: 'revoked', endedAt: null } },
]
const ALL_LAPSED = [
  { id: 'acct_salon', name: 'Salon', selectable: false, lapse: { reason: 'expired', endedAt: '2026-07-01T00:00:00Z' } },
  { id: 'acct_studio', name: 'Studio', selectable: false, lapse: { reason: 'revoked', endedAt: null } },
]

/**
 * The origin, at the browser's network boundary. Answers the routes the
 * builder's default transports call, scoped by the `/b/<id>` prefix exactly as
 * `scope.ts` parses it, and records every URL asked for.
 */
function fakeOrigin(spec: {
  sites: Record<string, Array<{ slug: string; latest: number | null }>>
  material?: Record<string, Array<Record<string, unknown>>>
  failMaterial?: Set<string>
}) {
  const calls: Array<{ url: string; method: string; body: unknown }> = []
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  const impl = async (input: unknown, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body ?? null })
    const m = /^\/b\/([^/]+)(\/.*)$/.exec(url)
    const business = m ? decodeURIComponent(m[1]) : null
    const rest = m ? m[2] : url
    if (rest.startsWith('/api/sites')) return json(spec.sites[business ?? ''] ?? [])
    if (rest.startsWith('/api/ai/session')) {
      const { slug } = JSON.parse(String(init?.body ?? '{}'))
      return json({ sessionId: `${business}:${slug}`, turns: [], ready: true })
    }
    if (rest === '/api/material' && (init?.method ?? 'GET') === 'GET') {
      if (spec.failMaterial?.has(business ?? '')) return json({ error: 'down' }, 500)
      return json({ material: spec.material?.[business ?? ''] ?? [] })
    }
    if (rest === '/api/material' && init?.method === 'POST') {
      return json({ uid: 'material-new', role: 'site', indexed: true })
    }
    if (rest.startsWith('/api/palette')) return json({ palette: {}, usage: {} })
    return json({ error: 'not found' }, 404)
  }
  return { calls, impl }
}

let root: HTMLElement
let realFetch: typeof fetch

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
  ;({ setBusinessScope } = await import('../apps/control-app/src/builder/api.js'))
  setBusinessScope(null)
  realFetch = globalThis.fetch
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

afterEach(() => {
  globalThis.fetch = realFetch
  setBusinessScope(null)
})

/** Mount with the network-facing seams left at their shipped defaults. */
function mountOverNetwork(over: Record<string, unknown> = {}) {
  return mountBuilder(root, {
    businesses: TWO,
    account: ACCOUNT,
    storage: memoryStorage(),
    markdownReady: Promise.resolve(),
    ...over,
  })
}

/** Mount with every transport injected — for the cases about chrome, not requests. */
function mountInjected(over: Record<string, unknown> = {}) {
  const sitesOf: Record<string, Array<{ slug: string; latest: number | null }>> = {
    acct_salon: [{ slug: 'salon-site', latest: null }],
    acct_studio: [{ slug: 'studio-site', latest: null }],
  }
  return mountBuilder(root, {
    businesses: TWO,
    account: ACCOUNT,
    storage: memoryStorage(),
    markdownReady: Promise.resolve(),
    loadSites: async (id: string | null) => sitesOf[id ?? ''] ?? [],
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `s-${slug}`, turns: [], ready: true }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => ({ uid: 'm', role: 'site', indexed: true }),
    },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
    ...over,
  })
}

// ── AC-2143: where the controls live ─────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — shell chrome carries the scope', () => {
  it('test_UAT_AC2143_shell_header_carries_switcher_and_avatar_and_no_tab_is_unscoped', async () => {
    const app = mountInjected({ businesses: WITH_LAPSED })
    await settle()
    const shellEl = app.shell.element as HTMLElement
    const bar = shellEl.querySelector('.shell-bar') as HTMLElement
    expect(bar).toBeTruthy()

    // The switcher is the header's LEADING element, and outside every tab panel.
    const switcher = root.querySelector('.builder-business') as HTMLElement
    expect(bar.firstElementChild).toBe(switcher)
    for (const tab of CONFIG.TABS) expect(app.shell.getPanel(tab.id).contains(switcher)).toBe(false)

    // The avatar is among the header's trailing controls, also outside every panel.
    const avatar = bar.querySelector(`[data-action="${CONFIG.ACCOUNT_ACTION_ID}"]`) as HTMLButtonElement
    expect(avatar).toBeTruthy()
    for (const tab of CONFIG.TABS) expect(app.shell.getPanel(tab.id).contains(avatar)).toBe(false)
    expect(switcher.compareDocumentPosition(avatar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Initial of the person's name.
    expect(avatar.querySelector('.builder-avatar')!.textContent).toBe('R')

    // No account tab; every declared tab is business-scoped.
    const tabIds = app.shell.getTabs().map((t: { id: string }) => t.id)
    expect(tabIds).not.toContain(CONFIG.ACCOUNT_ACTION_ID)
    expect(tabIds).toEqual(CONFIG.TABS.map((t: { id: string }) => t.id))

    // No render channel declares a site selector, and no toolbar renders one.
    for (const mode of app.panel.getModes()) {
      for (const action of mode.actions ?? []) expect(String(action)).not.toMatch(/site/i)
    }
    expect(shellEl.querySelector('.builder-layout select')).toBeNull()

    // Several businesses: a live choice, with the lapsed one listed, suffixed, unchoosable.
    const select = switcher.querySelector('select') as HTMLSelectElement
    expect([...select.options].map((o) => o.textContent)).toEqual([
      'Salon',
      'Studio',
      `Gone${CONFIG.BUSINESS_LAPSED_SUFFIX}`,
    ])
    expect(select.disabled).toBe(false)
    const gone = [...select.options].find((o) => o.value === 'acct_gone')!
    expect(gone.disabled).toBe(true)
    expect(app.scope.getBusiness()).not.toBe('acct_gone')

    // The avatar opens the account surface: identity and businesses, and nothing
    // about plan, billing, invoices or adding a business.
    avatar.click()
    const dialog = shellEl.querySelector('.builder-modal') as HTMLElement
    expect(dialog).toBeTruthy()
    expect(dialog.textContent).toContain(ACCOUNT.email)
    expect(dialog.textContent).toContain(ACCOUNT.name)
    const rows = [...dialog.querySelectorAll('.builder-account__business-name')].map((r) => r.textContent)
    expect(rows).toEqual(['Salon', 'Studio', `Gone${CONFIG.BUSINESS_LAPSED_SUFFIX}`])
    const text = dialog.textContent!.toLowerCase()
    for (const word of ['invoice', 'billing', 'plan', 'payment', 'subscription']) expect(text).not.toContain(word)
    const controls = [...dialog.querySelectorAll('button, a[href], input')].map((e) =>
      (e.textContent ?? '').toLowerCase(),
    )
    expect(controls.some((l) => l.includes('add') || l.includes('new'))).toBe(false)
    app.destroy()

    // Exactly one business: the name, no control.
    root = document.body.appendChild(document.createElement('div'))
    const one = mountInjected({ businesses: [TWO[0]], account: { name: null, email: 'solo@example.test' } })
    await settle()
    const single = root.querySelector('.builder-business') as HTMLElement
    expect(single.querySelector('select')).toBeNull()
    expect(single.querySelector('.builder-business__name')!.textContent).toBe('Salon')
    // No name set → the avatar falls back to the email's initial.
    expect(one.shell.element.querySelector('.builder-avatar')!.textContent).toBe('S')
    one.destroy()

    // No businesses at all: the switcher renders nothing.
    root = document.body.appendChild(document.createElement('div'))
    const none = mountInjected({ businesses: [], sites: [{ slug: 'x', latest: null }] })
    await settle()
    const empty = root.querySelector('.builder-business') as HTMLElement
    expect(empty.children.length).toBe(0)
    expect(empty.textContent).toBe('')
    none.destroy()
  })
})

// ── AC-2145: one act re-scopes everything ────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — a business switch moves everything', () => {
  it('test_UAT_AC2145_switching_business_rescopes_requests_frame_assistant_and_library', async () => {
    const origin = fakeOrigin({
      sites: {
        acct_salon: [{ slug: 'salon-site', latest: null }],
        acct_studio: [{ slug: 'studio-site', latest: null }],
      },
      material: {
        acct_salon: [{ uid: 'mat-salon', title: 'Salon logo', filename: 'salon.png', kind: 'image', role: 'site' }],
        acct_studio: [{ uid: 'mat-studio', title: 'Studio flyer', filename: 'studio.pdf', kind: 'document', role: 'reference' }],
      },
    })
    globalThis.fetch = origin.impl as typeof fetch
    const storage = memoryStorage()
    const app = mountOverNetwork({ storage })
    await vi.waitFor(() => expect(app.library.getRows().map((r: { uid: string }) => r.uid)).toEqual(['mat-salon']))
    expect(app.panel.frame.getAttribute('src')).toBe('/b/acct_salon/preview/salon-site/draft/')

    // Watch the frame's address, so a reload is observed rather than inferred.
    const srcWrites: string[] = []
    new MutationObserver((records) => {
      for (const r of records) srcWrites.push(app.panel.frame.getAttribute('src'))
    }).observe(app.panel.frame, { attributes: true, attributeFilter: ['src'] })

    // The operator's gesture, through the control on screen.
    const before = origin.calls.length
    const select = root.querySelector('.builder-business__select') as HTMLSelectElement
    select.value = 'acct_studio'
    select.dispatchEvent(new Event('change'))
    await vi.waitFor(() => expect(app.library.getRows().map((r: { uid: string }) => r.uid)).toEqual(['mat-studio']))

    // Uploads and the palette follow the shell's selection too.
    await app.receiveFiles([new File(['x'], 'logo.png')], 'site', 'library')
    ;(app.toolbar.get('colors') as HTMLButtonElement).click()
    await vi.waitFor(() => expect(origin.calls.some((c) => c.url.includes('/api/palette'))).toBe(true))

    // EVERY request after the switch carries the second business.
    const after = origin.calls.slice(before)
    expect(after.length).toBeGreaterThanOrEqual(4)
    for (const call of after) expect(call.url, call.url).toMatch(/^\/b\/acct_studio\//)
    expect(after.some((c) => c.url === '/b/acct_studio/api/sites')).toBe(true)
    expect(after.some((c) => c.url === '/b/acct_studio/api/material' && c.method === 'GET')).toBe(true)
    const upload = after.find((c) => c.url === '/b/acct_studio/api/material' && c.method === 'POST')!
    expect((upload.body as FormData).get('slug')).toBe('studio-site')
    expect(after.some((c) => c.url === '/b/acct_studio/api/palette?slug=studio-site')).toBe(true)

    // The assistant opened a fresh session for the second business's site.
    const session = after.find((c) => c.url === '/b/acct_studio/api/ai/session')!
    expect(JSON.parse(String(session.body))).toEqual({ slug: 'studio-site' })

    // The frame carries the business and reloaded.
    expect(app.panel.frame.getAttribute('src')).toBe('/b/acct_studio/preview/studio-site/draft/')
    expect(srcWrites).toContain('/b/acct_studio/preview/studio-site/draft/')

    // The selection is remembered.
    expect([...storage.map.entries()].some(([k, v]) => k.includes(CONFIG.STORAGE_KEYS.business) && v === 'acct_studio')).toBe(true)

    // A failing Library re-read leaves NO row of the business being left.
    origin.calls.length = 0
    const failing = fakeOrigin({
      sites: { acct_salon: [{ slug: 'salon-site', latest: null }] },
      failMaterial: new Set(['acct_salon']),
    })
    globalThis.fetch = failing.impl as typeof fetch
    await app.scope.setBusiness('acct_salon')
    await settle()
    expect(failing.calls.some((c) => c.url === '/b/acct_salon/api/material')).toBe(true)
    expect(app.library.getRows()).toEqual([])
    app.destroy()

    // Same slug under two businesses: the frame still reloads, the session re-opens.
    root = document.body.appendChild(document.createElement('div'))
    const shared = fakeOrigin({
      sites: { acct_salon: [{ slug: 'home', latest: null }], acct_studio: [{ slug: 'home', latest: null }] },
    })
    globalThis.fetch = shared.impl as typeof fetch
    const twin = mountOverNetwork()
    await vi.waitFor(() => expect(twin.panel.frame.getAttribute('src')).toBe('/b/acct_salon/preview/home/draft/'))
    await settle()
    await twin.scope.setBusiness('acct_studio')
    await settle()
    expect(twin.scope.getSite()).toBe('home')
    expect(twin.panel.frame.getAttribute('src')).toBe('/b/acct_studio/preview/home/draft/')
    const sessions = shared.calls.filter((c) => c.url.endsWith('/api/ai/session')).map((c) => c.url)
    expect(sessions).toContain('/b/acct_studio/api/ai/session')
    twin.destroy()

    // No surface outside the display panel asks the pane which scope it is in.
    const builder = path.join(REPO, 'apps/control-app/src/builder')
    const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
    for (const file of fs.readdirSync(builder).filter((f) => f.endsWith('.js') && f !== 'panel.js')) {
      const hits = strip(fs.readFileSync(path.join(builder, file), 'utf8')).match(/panel\.getSite\(\)/g) ?? []
      // app.js's single read is the scope seeding itself from persistence at boot.
      expect(hits.length, file).toBe(file === 'app.js' ? 1 : 0)
    }
  })
})

// ── AC-2146: nothing selectable ──────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — an account with nothing selectable', () => {
  it('test_UAT_AC2146_no_selectable_business_blocks_tabs_keeps_chrome_and_asks_no_site_list', async () => {
    const origin = fakeOrigin({ sites: { acct_salon: [{ slug: 'salon-site', latest: null }] } })
    globalThis.fetch = origin.impl as typeof fetch
    const storage = memoryStorage()
    const app = mountOverNetwork({ businesses: ALL_LAPSED, storage })
    await settle()
    const shellEl = app.shell.element as HTMLElement

    // The switcher renders, every business listed and marked, first one named, disabled.
    const select = root.querySelector('.builder-business select') as HTMLSelectElement
    expect([...select.options].map((o) => o.value)).toEqual(['acct_salon', 'acct_studio'])
    for (const o of select.options) {
      expect(o.disabled).toBe(true)
      expect(o.textContent).toContain(CONFIG.BUSINESS_LAPSED_SUFFIX)
    }
    expect(select.value).toBe('acct_salon')
    expect(select.disabled).toBe(true)

    // No business in scope; no request carries one and no site list is asked for.
    expect(app.scope.getBusiness()).toBeNull()
    expect(app.scope.getSite()).toBeNull()
    expect(origin.calls.filter((c) => c.url.includes('/api/sites'))).toEqual([])
    expect(origin.calls.filter((c) => c.url.startsWith('/b/'))).toEqual([])
    // The stored selection is rewritten to empty — nothing was opened.
    const key = [...storage.map.keys()].find((k) => k.includes(CONFIG.STORAGE_KEYS.business))!
    expect(storage.map.get(key)).toBe('')

    // Tab strip and panels inert; the header is not.
    expect(shellEl.querySelector('.shell-tabs')!.hasAttribute('inert')).toBe(true)
    expect(shellEl.querySelector('.shell-panels')!.hasAttribute('inert')).toBe(true)
    expect(shellEl.hasAttribute('inert')).toBe(false)
    expect(shellEl.querySelector('.shell-bar')!.closest('[inert]')).toBeNull()
    for (const id of ['theme', 'about', CONFIG.ACCOUNT_ACTION_ID]) {
      expect(shellEl.querySelector(`[data-action="${id}"]`)!.closest('[inert]')).toBeNull()
    }

    // One banner, an alert, in the content area, outside the inert region.
    const banners = shellEl.querySelectorAll('.builder-banner')
    expect(banners).toHaveLength(1)
    const banner = banners[0] as HTMLElement
    expect(banner.getAttribute('role')).toBe('alert')
    expect(banner.textContent).toBe(CONFIG.BUSINESS_NONE_SELECTABLE_MESSAGE)
    expect(shellEl.querySelector('.shell-content')!.contains(banner)).toBe(true)
    expect(banner.closest('[inert]')).toBeNull()

    // The avatar still opens the account surface.
    ;(shellEl.querySelector(`[data-action="${CONFIG.ACCOUNT_ACTION_ID}"]`) as HTMLButtonElement).click()
    expect(shellEl.querySelector('.builder-modal')!.textContent).toContain(ACCOUNT.email)
    app.destroy()

    // Non-vacuity: with a selectable business the same default DOES ask for sites.
    root = document.body.appendChild(document.createElement('div'))
    const live = mountOverNetwork({ businesses: [TWO[0]] })
    await vi.waitFor(() => expect(origin.calls.some((c) => c.url === '/b/acct_salon/api/sites')).toBe(true))
    live.destroy()

    // Unconfigured deployment too: the wider block wins, no second banner.
    root = document.body.appendChild(document.createElement('div'))
    const both = mountOverNetwork({ businesses: ALL_LAPSED, aiStatus: { ai: false, message: 'Not configured.' } })
    await settle()
    expect(root.querySelectorAll('.builder-banner')).toHaveLength(1)
    expect(root.querySelector('.builder-banner--no-business')).toBeNull()
    expect(both.shell.element.hasAttribute('inert')).toBe(true)
    both.destroy()
  })
})

// ── AC-2147: the lapse reason, in words (no shared component needed) ────────

describe('story-e674c60a — the account surface explains a lapse', () => {
  it('test_UAT_AC2147_account_surface_states_each_lapse_reason_and_switcher_only_suffixes', () => {
    const businesses = [
      { id: 'live', name: 'Live', selectable: true, lapse: null },
      { id: 'exp-dated', name: 'Dated', selectable: false, lapse: { reason: 'expired', endedAt: '2026-08-01T23:30:00.000Z' } },
      { id: 'exp-undated', name: 'Undated', selectable: false, lapse: { reason: 'expired', endedAt: null } },
      { id: 'revoked', name: 'Revoked', selectable: false, lapse: { reason: 'revoked', endedAt: null } },
      { id: 'not-yet', name: 'Early', selectable: false, lapse: { reason: 'not_yet', endedAt: null } },
      { id: 'never', name: 'Never', selectable: false, lapse: { reason: 'never_granted', endedAt: null } },
      { id: 'unknown', name: 'Unknown', selectable: false, lapse: { reason: 'something_new', endedAt: null } },
      { id: 'missing', name: 'Missing', selectable: false },
    ]
    const host = document.body.appendChild(document.createElement('div'))
    openAccountSurface({ host, account: ACCOUNT, businesses, selected: 'live' })

    const rows = new Map(
      [...document.querySelectorAll('.builder-account__business')].map((row) => [
        row.querySelector('.builder-account__business-name')!.textContent!,
        row.querySelector('.builder-account__business-lapse')?.textContent ?? null,
      ]),
    )
    const S = CONFIG.BUSINESS_LAPSED_SUFFIX
    // A selectable business carries no reason.
    expect(rows.get('Live')).toBeNull()
    // The dated expiry names its day, locale-independently (the wire's own date).
    expect(rows.get(`Dated${S}`)).toBe(CONFIG.BUSINESS_LAPSE_EXPIRED_ON('2026-08-01'))
    expect(rows.get(`Dated${S}`)).toContain('2026-08-01')
    // An expiry with no date still says access ended.
    expect(rows.get(`Undated${S}`)).toBe(CONFIG.BUSINESS_LAPSE_SENTENCES.expired)
    // Each other reason gets its own sentence.
    expect(rows.get(`Revoked${S}`)).toBe(CONFIG.BUSINESS_LAPSE_SENTENCES.revoked)
    expect(rows.get(`Early${S}`)).toBe(CONFIG.BUSINESS_LAPSE_SENTENCES.not_yet)
    expect(rows.get(`Never${S}`)).toBe(CONFIG.BUSINESS_LAPSE_SENTENCES.never_granted)
    const sentences = [`Dated${S}`, `Undated${S}`, `Revoked${S}`, `Early${S}`, `Never${S}`].map((k) => rows.get(k))
    expect(new Set(sentences).size).toBe(5)
    for (const s of sentences) expect(typeof s === 'string' && s.length > 0).toBe(true)
    // Unknown or missing reason: the marking only — no sentence, no placeholder.
    expect(rows.get(`Unknown${S}`)).toBeNull()
    expect(rows.get(`Missing${S}`)).toBeNull()
    expect(document.body.textContent).not.toMatch(/undefined|null|something_new/)

    // The switcher carries only the short suffix, never the sentence.
    const switcher = createBusinessSwitcher({ businesses, selected: 'live' })
    const labels = [...switcher.element.querySelectorAll('option')].map((o) => o.textContent!)
    expect(labels).toHaveLength(businesses.length)
    for (const [i, b] of businesses.entries()) {
      if (b.selectable === false) expect(labels[i]).toBe(`${b.name}${S}`)
      else expect(labels[i]).toBe(b.name)
    }
    const allSentences = [
      ...Object.values(CONFIG.BUSINESS_LAPSE_SENTENCES),
      CONFIG.BUSINESS_LAPSE_EXPIRED_ON('2026-08-01'),
    ] as string[]
    for (const label of labels) for (const s of allSentences) expect(label).not.toContain(s)
  })
})

// ── AC-2148: the word on screen is Business ──────────────────────────────────

/** Blank comments, keeping every other character position (so line numbers stay true). */
function withoutComments(source: string): string {
  let out = ''
  let quote: string | null = null
  for (let i = 0; i < source.length; ) {
    const c = source[i]
    const next = source[i + 1]
    if (quote) {
      if (c === '\\') {
        out += c + (next ?? '')
        i += 2
        continue
      }
      if (c === quote) quote = null
      out += c
      i += 1
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      out += c
      i += 1
      continue
    }
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') {
        out += ' '
        i += 1
      }
      continue
    }
    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? source.length : end + 2
      for (; i < stop; i += 1) out += source[i] === '\n' ? '\n' : ' '
      continue
    }
    out += c
    i += 1
  }
  return out
}

function stringMask(source: string): boolean[] {
  const mask = new Array<boolean>(source.length).fill(false)
  let quote: string | null = null
  for (let i = 0; i < source.length; i += 1) {
    const c = source[i]
    if (quote) {
      if (c === '\\') {
        mask[i] = true
        if (i + 1 < source.length) mask[i + 1] = true
        i += 1
        continue
      }
      if (c === quote) {
        quote = null
        continue
      }
      mask[i] = true
      continue
    }
    if (c === "'" || c === '"' || c === '`') quote = c
  }
  return mask
}

const SQL = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|WHERE|VALUES|SET|CREATE TABLE|ORDER BY)\b/
const DEPLOYMENT = /TENANT_ID|wrangler\.toml/
const IN_A_PATTERN = /\/[^/\n]*tenant[^/\n]*\/[a-z]*/i
const AN_IDENTIFIER = /^[A-Za-z0-9_$.\-/]+$/

/** Lines whose quoted string says "tenant" to a person, outside the exemptions. */
function offendingLines(source: string): number[] {
  const stripped = withoutComments(source)
  const mask = stringMask(stripped)
  const found: number[] = []
  let offset = 0
  for (const [index, line] of stripped.split('\n').entries()) {
    const start = offset
    offset += line.length + 1
    if (!/tenant/i.test(line)) continue
    if (SQL.test(line) || DEPLOYMENT.test(line) || IN_A_PATTERN.test(line)) continue
    const at = line.search(/tenant/i)
    if (!mask[start + at]) continue
    let from = start + at
    while (from > 0 && mask[from - 1]) from -= 1
    let to = start + at
    while (to + 1 < stripped.length && mask[to + 1]) to += 1
    if (AN_IDENTIFIER.test(stripped.slice(from, to + 1))) continue
    found.push(index + 1)
  }
  return found
}

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name !== 'generated') out.push(...sourceFiles(path.join(dir, e.name)))
    } else if (/\.(ts|js|mjs)$/.test(e.name)) out.push(path.join(dir, e.name))
  }
  return out
}

describe('story-e674c60a — the word a person reads is Business', () => {
  it('test_UAT_AC2148_no_user_facing_string_in_builder_or_public_site_says_tenant', () => {
    // The guard sees a violation and excuses each exemption.
    const sample = [
      "const label = 'Your tenant has expired'", // 1 — offence
      '// prose about a tenant is a comment',
      "  'SELECT id FROM tenants WHERE id = ?',", // SQL
      "throw new Error('TENANT_ID is not set for this tenant.')", // deployment vocabulary
      "const hint = 'Declare it in wrangler.toml for the tenant'", // deployment vocabulary
      'const tenantId = scope.businessId', // identifier
      "readonly name = 'TenantNotConfiguredError'", // quoted identifier
      'el.textContent = `This tenant is closed`', // 8 — offence in a template
    ].join('\n')
    expect(offendingLines(sample)).toEqual([1, 8])

    // The real surfaces: the builder client and the public site.
    const surfaces = [path.join(REPO, 'apps/control-app/src'), path.join(REPO, 'apps/public-site/src')]
    const files = surfaces.flatMap(sourceFiles)
    expect(files.some((f) => f.includes(`${path.sep}builder${path.sep}`))).toBe(true)
    expect(files.some((f) => f.includes(`public-site${path.sep}src`))).toBe(true)
    const offences: string[] = []
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      const lines = source.split('\n')
      for (const n of offendingLines(source)) offences.push(`${path.relative(REPO, file)}:${n} — ${lines[n - 1].trim()}`)
    }
    expect(offences).toEqual([])

    // A label rule, not a rename: the schema still declares tenant_id.
    const migrations = path.join(REPO, 'db/migrations')
    const sql = fs
      .readdirSync(migrations)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => fs.readFileSync(path.join(migrations, f), 'utf8'))
      .join('\n')
    expect(sql).toMatch(/tenant_id/)
    expect(sql).not.toMatch(/RENAME\s+COLUMN\s+tenant_id\b/i)

    // And the label the builder actually shows is "Business".
    expect(CONFIG.BUSINESS_LABEL).toBe('Business')
  })
})

// ── AC-967 / AC-970 / AC-974: the business-driven halves ─────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — site, toolbar and memory follow the business', () => {
  it('test_UAT_AC967_displayed_site_is_one_the_selected_business_holds_and_follows_a_switch', async () => {
    const sitesOf: Record<string, Array<{ slug: string; latest: number | null }>> = {
      acct_salon: [
        { slug: 'salon-a', latest: null },
        { slug: 'shared', latest: null },
      ],
      acct_studio: [
        { slug: 'studio-a', latest: null },
        { slug: 'shared', latest: null },
      ],
    }
    let failNext = false
    const asked: Array<string | null> = []
    const app = mountInjected({
      loadSites: async (id: string | null) => {
        asked.push(id)
        if (failNext) throw new Error('listing down')
        return sitesOf[id ?? ''] ?? []
      },
    })
    await settle()
    expect(asked).toEqual(['acct_salon'])
    expect(sitesOf.acct_salon.map((s) => s.slug)).toContain(app.panel.getSite())
    app.panel.setMode('edit')

    // Switch: the second business's site, its address carries that business, mode unchanged.
    await app.scope.setBusiness('acct_studio')
    await settle()
    expect(sitesOf.acct_studio.map((s) => s.slug)).toContain(app.panel.getSite())
    expect(app.panel.getMode()).toBe('edit')
    expect(app.panel.getSrc()).toBe(`/b/acct_studio/preview/${app.panel.getSite()}/edit/`)

    // A slug both hold is kept; the document address moves to the other business.
    app.panel.setSite('shared')
    await settle()
    await app.scope.setBusiness('acct_salon')
    await settle()
    expect(app.panel.getSite()).toBe('shared')
    expect(app.panel.getSrc()).toBe('/b/acct_salon/preview/shared/edit/')

    // A listing that fails leaves the pane showing what it had, not an empty pane.
    const shownBefore = app.panel.getSite()
    failNext = true
    await app.scope.setBusiness('acct_studio')
    await settle()
    expect(app.panel.getSite()).toBe(shownBefore)
    expect(app.panel.getSrc()).not.toBe('')
    app.destroy()
  })

  it('test_UAT_AC970_strip_re_derives_when_a_business_switch_or_a_restore_changes_the_site', async () => {
    const storage = memoryStorage()
    const app = mountInjected({ storage })
    await settle()
    const declared = app.panel.getModes().find((m: { id: string }) => m.id === app.panel.getMode()).actions
    const strip = app.toolbar.element as HTMLElement
    const ids = () => [...strip.querySelectorAll('[data-action]')].map((e) => (e as HTMLElement).dataset.action)
    const held = declared.map((id: string) => app.toolbar.get(id))
    expect(app.toolbar.get('open-new-tab').getAttribute('href')).toBe(app.panel.getSrc())

    // A business switch changes the site → the whole strip is fresh instances.
    await app.scope.setBusiness('acct_studio')
    await settle()
    expect(app.panel.getSite()).toBe('studio-site')
    expect(app.toolbar.element).toBe(strip)
    for (const [i, id] of declared.entries()) expect(app.toolbar.get(id)).not.toBe(held[i])
    expect(app.toolbar.get('open-new-tab').getAttribute('href')).toBe('/b/acct_studio/preview/studio-site/draft/')
    expect(app.toolbar.get('open-new-tab').getAttribute('href')).toBe(app.panel.getSrc())
    expect(ids()).toEqual(declared)
    app.destroy()

    // Restored from remembered state: the target is the restored site.
    root = document.body.appendChild(document.createElement('div'))
    const again = mountInjected({ storage })
    await settle()
    expect(again.scope.getBusiness()).toBe('acct_studio')
    expect(again.toolbar.get('open-new-tab').getAttribute('href')).toBe('/b/acct_studio/preview/studio-site/draft/')
    expect(again.toolbar.get('open-new-tab').getAttribute('href')).toBe(again.panel.getSrc())
    again.destroy()
  })

  it('test_UAT_AC974_business_selection_is_remembered_under_a_shell_wide_key_and_falls_back', async () => {
    const storage = memoryStorage()
    const first = mountInjected({ storage })
    await settle()
    await first.scope.setBusiness('acct_studio')
    await settle()
    first.destroy()

    // Every key is under the workspace namespace; the business key is not a tab's.
    const keys = [...storage.map.keys()]
    expect(keys.length).toBeGreaterThan(0)
    for (const k of keys) expect(k.startsWith(CONFIG.APP_ID), k).toBe(true)
    const businessKey = keys.find((k) => k.includes(`:${CONFIG.STORAGE_KEYS.business}`))!
    expect(businessKey).toBeTruthy()
    for (const tab of CONFIG.TABS) expect(businessKey).not.toContain(`${tab.id}:`)
    expect(storage.map.get(businessKey)).toBe('acct_studio')

    // Restored on a fresh mount — business and its site.
    root = document.body.appendChild(document.createElement('div'))
    const second = mountInjected({ storage })
    await settle()
    expect(second.scope.getBusiness()).toBe('acct_studio')
    expect(second.scope.getSite()).toBe('studio-site')
    second.destroy()

    // A remembered business the account can no longer operate: the first operable
    // one opens instead, with no error, and the stored value is rewritten.
    root = document.body.appendChild(document.createElement('div'))
    const lapsedNow = [{ ...TWO[1], selectable: false, lapse: { reason: 'revoked', endedAt: null } }, TWO[0]]
    const third = mountInjected({ storage, businesses: lapsedNow })
    await settle()
    expect(third.scope.getBusiness()).toBe('acct_salon')
    expect(root.querySelector('.builder-banner')).toBeNull()
    expect(storage.map.get(businessKey)).toBe('acct_salon')
    third.destroy()
  })
})
