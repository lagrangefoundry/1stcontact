/**
 * story-83ff6262 — **Customer portal: an account reaches its own page, rendered
 * as site content, with an honest Delete account control** (node side).
 *
 * WHAT MAKES THIS EVIDENCE. The portal is served by the builder origin over real
 * HTTP (`startBuilder`, the Node transport of the one control-app route table),
 * against a real filesystem site store. The page is then loaded into a DOM and
 * driven by the module's own vetted client (`account-portal/client.js`, the code
 * `capabilities.js` ships). The only thing mocked is the network answer the
 * client reads its account facts from — the account endpoint's payload — so each
 * account shape the criteria name can be served deterministically.
 *
 * The workers-side sibling (`test_reconciliation_customer_portal.workers.test.ts`)
 * covers the claims only a real Access-admitted request against D1 can show.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { afterEach, describe, expect, it } from 'vitest'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { route, BUSINESSES_PATH, type RouterEnv } from '../apps/control-app/src/router'
import { PORTAL_PATH, PORTAL_SLUG, portalHomePage, portalSiteJson } from '../apps/control-app/src/portal'
import { openAccountSurface } from '../apps/control-app/src/builder/business.js'
import { enhanceAccountPortal } from '../packages/framework/src/modules/account-portal/client.js'

// ── workspace ────────────────────────────────────────────────────────────────

interface Workspace {
  cwd: string
  builder: BuilderHandle
  req(p: string, init?: RequestInit): Promise<Response>
}

const OPEN: Workspace[] = []

afterEach(async () => {
  while (OPEN.length) {
    const ws = OPEN.pop()!
    await ws.builder.close()
    fs.rmSync(ws.cwd, { recursive: true, force: true })
  }
})

/** A throwaway store holding one ordinary site, and a builder origin over it. */
async function openWorkspace(): Promise<Workspace> {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-83ff6262-'))
  cmdNew('alpha', { cwd })
  const builder = await startBuilder({ cwd })
  const ws: Workspace = {
    cwd,
    builder,
    req: (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init),
  }
  OPEN.push(ws)
  return ws
}

/**
 * Author a `portal` site into the workspace's store, as a site write would land.
 *
 * `heading` (when given) replaces the default's heading, so a rendered page says
 * which source it came from.
 */
function authorPortal(cwd: string, heading?: string): void {
  cmdNew(PORTAL_SLUG, { cwd })
  const draft = path.join(cwd, 'storage', 'sites', PORTAL_SLUG, 'draft')
  const page = portalHomePage(BUSINESSES_PATH) as {
    modules: Array<{ slots: { body: { children: Array<{ text?: string }> } } }>
  }
  if (heading !== undefined) page.modules[0].slots.body.children[0].text = heading
  fs.writeFileSync(path.join(draft, 'site.json'), JSON.stringify(portalSiteJson(), null, 2))
  fs.writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(page, null, 2))
}

/** Every file under `dir`, relative path → bytes (as base64), for before/after equality. */
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walk = (d: string): void => {
    if (!fs.existsSync(d)) return
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) walk(full)
      else out[path.relative(dir, full)] = fs.readFileSync(full).toString('base64')
    }
  }
  walk(dir)
  return out
}

// ── DOM harness ──────────────────────────────────────────────────────────────

interface Portal {
  dom: JSDOM
  doc: Document
  section: HTMLElement
  erasure: HTMLElement
  reveal: HTMLButtonElement
  dismiss: HTMLButtonElement
  identity: HTMLElement
  holdings: HTMLElement
  error: HTMLElement
  requests: Array<{ url: string; method: string }>
}

type AccountAnswer = (() => Promise<Response>) | { status?: number; body?: unknown }

/** Let the client's fire-and-forget account load run to completion. */
async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0))
}

/**
 * The served `/account` page, in a DOM, enhanced by the module's own client.
 *
 * `answer` is what the account endpoint returns — the one external boundary.
 */
async function mountPortal(html: string, answer: AccountAnswer): Promise<Portal> {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const section = doc.querySelector('[data-account-portal]') as HTMLElement
  expect(section).not.toBeNull()
  const requests: Array<{ url: string; method: string }> = []
  const fetchImpl = async (url: string, init: RequestInit = {}): Promise<Response> => {
    requests.push({ url, method: (init.method ?? 'GET').toUpperCase() })
    if (typeof answer === 'function') return answer()
    return new Response(JSON.stringify(answer.body ?? {}), {
      status: answer.status ?? 200,
      headers: { 'content-type': 'application/json' },
    })
  }
  enhanceAccountPortal(section, fetchImpl)
  await settle()
  const buttons = [...section.querySelectorAll('button')] as HTMLButtonElement[]
  return {
    dom,
    doc,
    section,
    erasure: section.querySelector('[data-account-erasure]') as HTMLElement,
    reveal: buttons.find((b) => b.hasAttribute('aria-expanded'))!,
    dismiss: buttons.find((b) => !b.hasAttribute('aria-expanded'))!,
    identity: section.querySelector('[data-account-identity]') as HTMLElement,
    holdings: section.querySelector('[data-account-holdings]') as HTMLElement,
    error: section.querySelector('[data-account-error]') as HTMLElement,
    requests,
  }
}

function click(p: Portal, button: HTMLElement): void {
  button.dispatchEvent(new p.dom.window.Event('click'))
}

/** True when the element or any ancestor carries `hidden`. */
function isHidden(el: Element | null): boolean {
  for (let n: Element | null = el; n; n = n.parentElement) {
    if (n.hasAttribute('hidden')) return true
  }
  return false
}

/** The words a sighted visitor sees: no scripts/styles, nothing under `[hidden]`. */
function visibleText(root: Element): string {
  const parts: string[] = []
  const walk = (node: Node): void => {
    if (node.nodeType === 3) {
      parts.push(node.textContent ?? '')
      return
    }
    if (node.nodeType !== 1) return
    const el = node as Element
    if (['SCRIPT', 'STYLE', 'TEMPLATE'].includes(el.tagName)) return
    if (el.hasAttribute('hidden')) return
    for (const child of el.childNodes) walk(child)
  }
  walk(root)
  return parts.join(' ').replace(/\s+/g, ' ')
}

/** Leaf elements carrying text, in document order. */
function leafTexts(root: Element): string[] {
  return [...root.querySelectorAll('*')]
    .filter((el) => el.children.length === 0 && !['SCRIPT', 'STYLE'].includes(el.tagName))
    .map((el) => (el.textContent ?? '').trim())
    .filter(Boolean)
}

const SURVIVORS = [
  'A one-way fingerprint of your email address.',
  'The dates you gave permission and withdrew it — not what you said.',
  'Your invoices and payments, with you reduced to the least the law allows.',
]

const ACCOUNT = {
  account: { name: 'Alice', email: 'alice@example.test' },
  businesses: [
    { id: 'acct_a', name: 'Salon', selectable: true },
    { id: 'acct_b', name: 'Studio', selectable: false },
  ],
}

// ── where the portal comes from ──────────────────────────────────────────────

describe('story-83ff6262 — the portal is site content served at /account', () => {
  it('test_UAT_AC2213_authored_portal_site_is_served_else_the_shipped_default', async () => {
    const ws = await openWorkspace()

    // No `portal` site in the store: the shipped default serves.
    const before = await ws.req(PORTAL_PATH)
    expect(before.status).toBe(200)
    const defaultHtml = await before.text()
    const defaultDoc = new JSDOM(defaultHtml).window.document
    expect(defaultDoc.title).toBe('Your account')
    expect(defaultHtml).toContain('Delete account')
    expect(defaultHtml).toContain('Closing your account')
    expect(defaultHtml).toMatch(/>Your account</)

    // Its site settings are the starter site's: theme and nav shape identical,
    // and the business label is "Your account".
    const portal = portalSiteJson()
    const starter = starterSiteJson(PORTAL_SLUG) as Record<string, unknown>
    for (const key of Object.keys(starter)) {
      if (key === 'id' || key === 'config') continue
      expect(portal[key]).toEqual(starter[key])
    }
    expect((portal.config as { businessName: string }).businessName).toBe('Your account')

    // And the default's theme is a freshly scaffolded site's theme, as served.
    const defaultTheme = await ws.req(`${PORTAL_PATH}/theme.css`).then((r) => r.text())
    const scaffoldedTheme = await ws.req('/preview/alpha/draft/theme.css').then((r) => r.text())
    const rootVars = (css: string): string => (css.match(/:root\s*\{[^}]*\}/) ?? [''])[0]
    expect(rootVars(defaultTheme)).not.toBe('')
    expect(rootVars(defaultTheme)).toBe(rootVars(scaffoldedTheme))

    // Write a `portal` site draft with distinctive text: the next request serves it.
    authorPortal(ws.cwd, 'A portal this business authored itself')
    const after = await ws.req(PORTAL_PATH).then((r) => r.text())
    expect(after).toContain('A portal this business authored itself')
    expect(after).not.toMatch(/>Your account<\/p>/)
  })

  it('test_UAT_AC2214_portal_is_rendered_by_the_preview_renderer_with_assets_under_account', async () => {
    const ws = await openWorkspace()
    // The default, as served before any portal is authored.
    const fallbackHtml = await ws.req(`${PORTAL_PATH}/`).then((r) => r.text())

    // The same definition, authored as an ordinary site so the preview route can
    // render it too.
    authorPortal(ws.cwd)

    const portalHtml = await ws.req(`${PORTAL_PATH}/`).then((r) => r.text())
    const previewHtml = await ws.req(`/preview/${PORTAL_SLUG}/draft/`).then((r) => r.text())
    expect(portalHtml).toBe(previewHtml)
    // The shipped default is the same render of the same definition — no
    // separate template produced it.
    expect(fallbackHtml).toBe(previewHtml)

    for (const asset of ['theme.css', 'capabilities.js']) {
      const atPortal = await ws.req(`${PORTAL_PATH}/${asset}`)
      const atPreview = await ws.req(`/preview/${PORTAL_SLUG}/draft/${asset}`)
      expect(atPortal.status).toBe(200)
      expect(atPreview.status).toBe(200)
      expect(Buffer.from(await atPortal.arrayBuffer())).toEqual(
        Buffer.from(await atPreview.arrayBuffer()),
      )
    }

    // Every document-relative sub-resource the page names resolves under /account/.
    const doc = new JSDOM(portalHtml).window.document
    const refs = [
      ...[...doc.querySelectorAll('link[href]')].map((l) => l.getAttribute('href')!),
      ...[...doc.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')!),
    ].filter((r) => !/^[a-z]+:|^\/\//i.test(r))
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) {
      const resolved = new URL(ref, new URL(`${PORTAL_PATH}/`, ws.builder.url))
      expect(resolved.pathname.startsWith(`${PORTAL_PATH}/`)).toBe(true)
      expect((await fetch(resolved)).status).toBe(200)
    }
  })

  it('test_UAT_AC2215_portal_accepts_only_get_and_head_and_writes_change_nothing', async () => {
    const ws = await openWorkspace()
    authorPortal(ws.cwd)
    const storage = path.join(ws.cwd, 'storage')

    for (const p of [PORTAL_PATH, `${PORTAL_PATH}/theme.css`]) {
      const get = await ws.req(p)
      expect(get.status).toBe(200)
      const getType = get.headers.get('content-type')
      expect((await get.arrayBuffer()).byteLength).toBeGreaterThan(0)

      const head = await ws.req(p, { method: 'HEAD' })
      expect(head.status).toBe(200)
      expect(head.headers.get('content-type')).toBe(getType)
      expect((await head.arrayBuffer()).byteLength).toBe(0)

      const before = snapshot(storage)
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        const res = await ws.req(p, {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ delete: true }),
        })
        expect(res.status).toBe(405)
        expect(await res.text()).toBe('Method Not Allowed')
      }
      expect(snapshot(storage)).toEqual(before)
    }
  })

  it('test_UAT_AC2216_no_admission_and_no_scope_is_404_but_a_scope_alone_serves_its_portal', async () => {
    // Neither an admitted identity nor a business scope: the route table refuses.
    const env = {
      DB: new Proxy({}, { get: () => { throw new Error('D1 must not be reached') } }),
      SITES: new Proxy({}, { get: () => { throw new Error('R2 must not be reached') } }),
      ASSETS: { fetch: async () => new Response('asset', { status: 404 }) },
    } as unknown as RouterEnv
    const refused = await route(new Request(`https://app.example${PORTAL_PATH}`), env, null, {})
    expect(refused.status).toBe(404)
    expect(await refused.text()).toBe('Not found')

    // A scope and no admission (the local transport, no access layer): that
    // business's portal is served.
    const ws = await openWorkspace()
    authorPortal(ws.cwd, 'The scoped business portal')
    const served = await ws.req(PORTAL_PATH)
    expect(served.status).toBe(200)
    expect(await served.text()).toContain('The scoped business portal')
  })
})

// ── what the page shows and does ─────────────────────────────────────────────

describe('story-83ff6262 — the Delete account control and its explanation', () => {
  it('test_UAT_AC2218_delete_account_reveals_the_erasure_explanation_and_close_folds_it', async () => {
    const ws = await openWorkspace()
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())
    const p = await mountPortal(html, { body: ACCOUNT })

    // Initial, with scripting: the control is there, collapsed, explanation hidden.
    expect(p.reveal.textContent?.trim()).toBe('Delete account')
    expect(p.reveal.getAttribute('aria-expanded')).toBe('false')
    expect(isHidden(p.erasure)).toBe(true)

    click(p, p.reveal)
    expect(isHidden(p.erasure)).toBe(false)
    expect(p.reveal.getAttribute('aria-expanded')).toBe('true')

    const words = visibleText(p.erasure)
    expect(words).toContain('Closing your account')
    expect(words).toContain('What is destroyed')
    for (const item of [
      /email address/i,
      /\bname\b/i,
      /phone number/i,
      /enquiries/i,
      /place on any list/i,
      /where you came to us from/i,
      /sessions/i,
      /conversation you have had with the assistant/i,
    ]) {
      expect(words).toMatch(item)
    }
    expect(words).toContain('What survives, and why each one is for you')

    // Exactly three survivors, each followed by its reason.
    const leaves = leafTexts(p.erasure)
    const from = leaves.indexOf('What survives, and why each one is for you')
    const to = leaves.findIndex((t) => t.startsWith('So the accurate promise'))
    expect(from).toBeGreaterThanOrEqual(0)
    expect(to).toBeGreaterThan(from)
    const between = leaves.slice(from + 1, to)
    expect(between).toHaveLength(6)
    expect([between[0], between[2], between[4]]).toEqual(SURVIVORS)
    expect(between[1]).toMatch(/cannot be turned back into an address/i)
    expect(between[3]).toMatch(/evidence that we were allowed to hold your details/i)
    expect(between[5]).toMatch(/Financial records have to be kept/i)

    // Close, inside the explanation, folds it away again.
    expect(p.erasure.contains(p.dismiss)).toBe(true)
    expect(p.dismiss.textContent?.trim()).toBe('Close')
    click(p, p.dismiss)
    expect(isHidden(p.erasure)).toBe(true)
    expect(p.reveal.getAttribute('aria-expanded')).toBe('false')
  })

  it('test_UAT_AC2220_without_scripting_the_explanation_is_served_in_full_and_visible', async () => {
    const ws = await openWorkspace()
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())
    // Parsed, no script executed.
    const doc = new JSDOM(html).window.document
    const erasure = doc.querySelector('[data-account-erasure]') as HTMLElement
    expect(erasure).not.toBeNull()
    expect(isHidden(erasure)).toBe(false)

    const words = visibleText(erasure)
    expect(words).toContain('Closing your account')
    expect(words).toContain('What is destroyed')
    expect(words).toContain('What survives, and why each one is for you')
    for (const survivor of SURVIVORS) expect(words).toContain(survivor)
    expect(words).toMatch(/cannot be turned back into an address/i)
    expect(words).toMatch(/evidence that we were allowed to hold your details/i)
    expect(words).toMatch(/Financial records have to be kept/i)

    // The control's announced state matches what a scriptless visitor sees.
    const reveal = doc.querySelector('button[aria-expanded]') as HTMLElement
    expect(reveal.getAttribute('aria-expanded')).toBe('true')
  })

  it('test_UAT_AC2221_copy_says_closing_is_done_by_asking_and_offers_no_dead_contact_channel', async () => {
    const ws = await openWorkspace()
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())
    const p = await mountPortal(html, { body: ACCOUNT })
    click(p, p.reveal)

    const words = visibleText(p.doc.body)
    expect(words).toContain('This page does not close your account on its own. Ask us and we will do it.')
    expect(words).toMatch(/everything we are allowed to delete/i)
    expect(words).not.toMatch(
      /has been deleted|have been deleted|is being deleted|deletion scheduled|scheduled for deletion|request received|has been closed|account closed|will be deleted/i,
    )

    const anchors = [...p.doc.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? '')
    expect(anchors.filter((h) => /^mailto:/i.test(h.trim()))).toEqual([])
    expect(html).not.toMatch(/mailto:/i)
  })

  it('test_UAT_AC2226_portal_offers_no_business_plan_charges_details_or_export_surface_and_no_tenant', async () => {
    const ws = await openWorkspace()
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())
    const p = await mountPortal(html, { body: ACCOUNT })
    click(p, p.reveal)
    // The account facts are filled, so client-written text is in the scan too.
    expect(p.identity.textContent).toBe('Alice — alice@example.test')

    const words = visibleText(p.doc.body)
    const labels = [...p.doc.querySelectorAll('button, a, input, select, textarea, [role=button]')].map(
      (el) =>
        [el.textContent, el.getAttribute('aria-label'), el.getAttribute('value'), el.getAttribute('title')]
          .filter(Boolean)
          .join(' '),
    )
    const surface = `${words} ${labels.join(' ')}`

    expect(surface).not.toMatch(/tenant/i)
    expect(surface).not.toMatch(/add (a )?business|new business|create (a )?business/i)
    expect(surface).not.toMatch(/your plan is|change (your )?plan|upgrade|downgrade|subscribe/i)
    expect(surface).not.toMatch(/charges|billing|invoice #|amount due|£|€|\$\s?\d/i)
    expect(surface).not.toMatch(/edit (your )?(name|details|account)|change your (name|email|details)/i)
    expect(surface).not.toMatch(/export|download/i)

    // The only controls are the reveal and its dismiss; nothing to submit or edit.
    expect(p.doc.querySelectorAll('form, input, select, textarea').length).toBe(0)
    const controls = [...p.doc.querySelectorAll('button, a[href]')].map((c) => (c.textContent ?? '').trim())
    expect(controls.sort()).toEqual(['Close', 'Delete account'])
  })

  it('test_UAT_AC2219_pressing_delete_account_and_close_sends_only_gets_and_changes_nothing', async () => {
    const ws = await openWorkspace()
    authorPortal(ws.cwd)
    const storage = path.join(ws.cwd, 'storage')
    const before = snapshot(storage)

    // The served page, enhanced by the module's own client, with every request
    // the client makes sent to the real control-app origin and recorded. The
    // window's own `fetch` and any form submission are recorded too, so a click
    // handler that wrote by another path would show here.
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())
    const sent: Array<{ method: string; url: string; status: number }> = []
    const throughOrigin = async (url: string, init: RequestInit = {}): Promise<Response> => {
      const method = (init.method ?? 'GET').toUpperCase()
      const res = await ws.req(url, init)
      sent.push({ method, url, status: res.status })
      return res
    }
    const dom = new JSDOM(html)
    const doc = dom.window.document
    ;(dom.window as unknown as { fetch: typeof throughOrigin }).fetch = throughOrigin
    const submits: string[] = []
    doc.addEventListener('submit', (e) => submits.push(String((e.target as Element)?.tagName)))
    const section = doc.querySelector('[data-account-portal]') as HTMLElement
    enhanceAccountPortal(section, throughOrigin)
    await settle()

    const buttons = [...section.querySelectorAll('button')] as HTMLButtonElement[]
    const reveal = buttons.find((b) => b.hasAttribute('aria-expanded'))!
    const dismiss = buttons.find((b) => !b.hasAttribute('aria-expanded'))!
    const erasure = section.querySelector('[data-account-erasure]') as HTMLElement
    expect(reveal.textContent?.trim()).toBe('Delete account')
    expect(dismiss.textContent?.trim()).toBe('Close')

    reveal.dispatchEvent(new dom.window.Event('click'))
    await settle()
    expect(isHidden(erasure)).toBe(false)
    dismiss.dispatchEvent(new dom.window.Event('click'))
    await settle()
    expect(isHidden(erasure)).toBe(true)

    // Only GETs left the page, and the account endpoint answered them.
    expect(sent.length).toBeGreaterThan(0)
    expect(sent.filter((s) => s.method !== 'GET')).toEqual([])
    expect(sent.every((s) => s.status === 200)).toBe(true)
    expect(submits).toEqual([])

    // Nothing in the store moved, and the portal and the builder still load.
    expect(snapshot(storage)).toEqual(before)
    expect((await ws.req(PORTAL_PATH)).status).toBe(200)
    expect((await ws.req('/')).status).toBe(200)
  })
})

// ── the account facts the client fills ───────────────────────────────────────

describe("story-83ff6262 — the caller's own account facts", () => {
  it('test_UAT_AC2222_account_line_names_the_caller_and_falls_back_to_the_verified_email', async () => {
    const ws = await openWorkspace()
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())

    const cases: Array<{ account: unknown; text: string; hidden: boolean }> = [
      { account: { name: 'Alice', email: 'alice@example.test' }, text: 'Alice — alice@example.test', hidden: false },
      { account: { name: '', email: 'alice@example.test' }, text: 'alice@example.test', hidden: false },
      { account: { name: '   ', email: 'alice@example.test' }, text: 'alice@example.test', hidden: false },
      { account: { name: null, email: null }, text: '', hidden: true },
      { account: null, text: '', hidden: true },
    ]
    for (const c of cases) {
      const p = await mountPortal(html, { body: { account: c.account, businesses: [] } })
      // It asked the endpoint the instance names — the caller's own account endpoint.
      expect(p.requests).toEqual([{ url: BUSINESSES_PATH, method: 'GET' }])
      expect(p.identity.textContent).toBe(c.text)
      expect(p.identity.hasAttribute('hidden')).toBe(c.hidden)
      expect(isHidden(p.error)).toBe(true)
    }
  })

  it('test_UAT_AC2223_holdings_sentence_names_every_business_including_lapsed_ones', async () => {
    const ws = await openWorkspace()
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())
    const account = { name: 'Alice', email: 'alice@example.test' }

    const cases: Array<{ businesses: unknown[]; text: string }> = [
      {
        businesses: [{ id: 'acct_a', name: 'Salon', selectable: true }],
        text: 'This account operates 1 business: Salon.',
      },
      {
        businesses: [
          { id: 'acct_a', name: 'Salon', selectable: true },
          { id: 'acct_b', name: 'Studio', selectable: false },
        ],
        text: 'This account operates 2 businesses: Salon, Studio.',
      },
      {
        businesses: [{ id: 'acct_unnamed', name: '', selectable: true }],
        text: 'This account operates 1 business: acct_unnamed.',
      },
      { businesses: [], text: '' },
    ]
    for (const c of cases) {
      const p = await mountPortal(html, { body: { account, businesses: c.businesses } })
      click(p, p.reveal)
      expect(p.holdings.textContent).toBe(c.text)
      if (c.text) {
        expect(isHidden(p.holdings)).toBe(false)
        expect(visibleText(p.erasure)).toContain(c.text)
      } else {
        expect(p.holdings.hasAttribute('hidden')).toBe(true)
        expect(visibleText(p.erasure)).not.toMatch(/operates/i)
      }
    }
  })

  it('test_UAT_AC2224_failed_account_load_is_announced_and_the_explanation_still_works', async () => {
    const ws = await openWorkspace()
    const html = await ws.req(PORTAL_PATH).then((r) => r.text())

    const failures: AccountAnswer[] = [
      { status: 401, body: { error: 'unauthorized' } },
      { status: 500, body: { error: 'boom' } },
      async () => {
        throw new TypeError('network down')
      },
    ]
    for (const failure of failures) {
      const p = await mountPortal(html, failure)

      expect(isHidden(p.error)).toBe(false)
      expect(p.error.textContent?.trim()).toBe('Your account details could not be loaded just now.')
      // Not shown as empty text standing in for a name or a list.
      expect(p.identity.textContent).toBe('')
      expect(p.holdings.textContent).toBe('')
      expect(isHidden(p.holdings)).toBe(true)

      // The control and the explanation behave exactly as on success.
      expect(p.reveal.getAttribute('aria-expanded')).toBe('false')
      expect(isHidden(p.erasure)).toBe(true)
      click(p, p.reveal)
      expect(isHidden(p.erasure)).toBe(false)
      expect(p.reveal.getAttribute('aria-expanded')).toBe('true')
      const words = visibleText(p.erasure)
      expect(words).toContain('Closing your account')
      for (const survivor of SURVIVORS) expect(words).toContain(survivor)
      click(p, p.dismiss)
      expect(isHidden(p.erasure)).toBe(true)
    }
  })
})

// ── the builder's avatar dialog ──────────────────────────────────────────────

describe('story-83ff6262 — the avatar dialog links out to the portal', () => {
  it('test_UAT_AC2225_avatar_dialog_links_to_the_portal_in_a_new_tab_and_adds_nothing_else', () => {
    const dom = new JSDOM('<!doctype html><body><div id="host"></div></body>')
    const g = globalThis as unknown as { document?: Document; window?: Window }
    const savedDoc = g.document
    const savedWin = g.window
    g.document = dom.window.document as unknown as Document
    g.window = dom.window as unknown as Window
    try {
      const accounts = [
        {
          label: 'live businesses',
          businesses: [
            { id: 'acct_a', name: 'Salon', selectable: true },
            { id: 'acct_b', name: 'Studio', selectable: true },
          ],
          selected: 'acct_a' as string | null,
        },
        {
          label: 'every grant lapsed',
          businesses: [
            { id: 'acct_a', name: 'Salon', selectable: false },
            { id: 'acct_b', name: 'Studio', selectable: false },
          ],
          selected: null as string | null,
        },
      ]
      for (const a of accounts) {
        const host = dom.window.document.getElementById('host') as HTMLElement
        host.innerHTML = ''
        const modal = openAccountSurface({
          host,
          account: { name: 'Alice', email: 'alice@example.test' },
          businesses: a.businesses,
          selected: a.selected,
        })

        const links = [...host.querySelectorAll('a')] as HTMLAnchorElement[]
        expect(links).toHaveLength(1)
        const link = links[0]
        expect(link.textContent).toBe('Open your account portal')
        expect(link.getAttribute('href')).toBe(PORTAL_PATH)
        expect(link.getAttribute('target')).toBe('_blank')
        expect(link.getAttribute('rel')).toBe('noopener noreferrer')

        // Followed by a short hint.
        const hint = link.nextElementSibling as HTMLElement
        expect(hint).not.toBeNull()
        expect(hint.tagName).toBe('P')
        expect((hint.textContent ?? '').trim().length).toBeGreaterThan(0)
        expect((hint.textContent ?? '').length).toBeLessThan(120)

        // Besides the link, the only control is the dialog's own Close.
        const controls = [...host.querySelectorAll('button, input, select, textarea, form')]
        expect(controls.map((c) => (c.textContent ?? '').trim())).toEqual(['Close'])

        // Facts about the session: who is signed in and which businesses.
        const words = host.textContent ?? ''
        expect(words).toContain('Alice — alice@example.test')
        expect(words).toContain('Salon')
        expect(words).toContain('Studio')
        expect(words).not.toMatch(/delete account|invoice|billing|upgrade|export/i)
        modal.close()
      }
    } finally {
      g.document = savedDoc
      g.window = savedWin
    }
  })
})
