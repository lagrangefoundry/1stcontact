// @vitest-environment jsdom
/**
 * story-e674c60a — **the workspace tells an ended session from an empty account,
 * and its controls share one type size** (BUG-52, BUG-53).
 *
 * WHAT MAKES THIS EVIDENCE. Every mounted case builds the REAL builder (or the
 * real Contacts panel) over the ACTUALLY-INSTALLED shared `webui-*` components.
 * The only thing replaced is the network: `fetch` is either stubbed on
 * `globalThis` (so the URLs and failures are the ones the shipped `api.js`
 * meets) or handed to an `api.js` call as its transport parameter, which is the
 * seam every call in that module already exposes.
 *
 * The sizing case walks the stylesheets in the order the workspace document
 * loads them — the component sheets `chrome.ts` emits from the generated import
 * map, then `builder.css` — against elements the real components rendered, so a
 * rule that has stopped matching anything cannot pass by describing a control
 * that no longer exists.
 */

import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'
import {
  CopyError,
  fetchAiStatus,
  fetchBusinesses,
  fetchSites,
  saveCopy,
  setBusinessScope,
  streamChatPrompt,
} from '../apps/control-app/src/builder/api.js'
import {
  createSessionNotice,
  isSessionEnded,
  loadOrSignOut,
  onSessionEnded,
} from '../apps/control-app/src/builder/session.js'

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a session/sizing suites skipped: ${WEBUI_SKIP_REASON}`)

const REPO = path.resolve(__dirname, '..')
const BUILDER_DIR = path.join(REPO, 'apps/control-app/src/builder')

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let createPeoplePanel: (opts?: Record<string, unknown>) => Handle

const EXPIRED_WORDING = 'Your session has ended. Sign in again to carry on.'
const UNREACHABLE_WORDING =
  'The builder could not reach the server — your session may have ended. Sign in again to carry on.'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
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

const settle = async (n = 6) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

/** An origin that refuses the session on every call. */
const refuses = () => async () => json({ error: 'unauthorised' }, 401)
/** What `fetch` does when Access redirects a background request it may not follow. */
const rejects = () => async () => {
  throw new TypeError('Failed to fetch')
}

const ACCOUNT = { name: 'Robin Owner', email: 'robin@example.test' }
const TWO = [
  { id: 'acct_salon', name: 'Salon', selectable: true, lapse: null },
  { id: 'acct_studio', name: 'Studio', selectable: true, lapse: null },
]

const PERSON = {
  id: 'usr_1',
  email: 'alice@example.test',
  displayName: 'Alice Adams',
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  createdAt: '2026-09-01T09:00:00.000Z',
}

function peopleTransport(calls?: string[]) {
  return {
    list: async () => {
      calls?.push('people')
      return { people: [{ ...PERSON }], canInvite: true, canFulfil: true }
    },
    item: async () => ({ person: { ...PERSON }, operates: [], grants: [] }),
    saveStatus: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    invite: async () => ({ created: true, person: { ...PERSON } }),
    fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteSlug: 'acct_new' }),
  }
}

const quietChat = {
  openSession: async (slug: string) => ({ sessionId: `s-${slug}`, turns: [], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

const quietLibrary = {
  list: async () => ({ material: [] }),
  item: async () => ({ body: '' }),
  save: async () => ({}),
  fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
  upload: async () => ({ uid: 'm', role: 'site', indexed: true }),
}

let root: HTMLElement
let realFetch: typeof fetch

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
  }
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

// ── AC-2230: an ended session is reported as one ────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — an ended session says so', () => {
  it('test_UAT_AC2230_expired_session_replaces_builder_at_load_and_strips_a_live_shell_mid_session', async () => {
    // ── AT LOAD, A 401 ───────────────────────────────────────────────────────
    // The same opening calls `main.js` makes, against an origin refusing all
    // three. Each of them refuses rather than defaulting.
    await expect(fetchBusinesses(refuses() as never)).rejects.toMatchObject({ name: 'SessionEndedError' })
    await expect(fetchAiStatus(refuses() as never)).rejects.toMatchObject({ name: 'SessionEndedError' })
    await expect(fetchSites(refuses() as never)).rejects.toMatchObject({ name: 'SessionEndedError' })

    const signIn = vi.fn()
    const notice = (opts: Record<string, unknown>) => createSessionNotice({ ...opts, signIn })
    const loaded = await loadOrSignOut(
      root,
      () => Promise.all([fetchBusinesses(refuses() as never), fetchAiStatus(refuses() as never)]),
      notice,
    )
    expect(loaded).toBeNull()
    // The notice is the mount point's ONLY content: no builder, no shell.
    expect(root.childElementCount).toBe(1)
    const page = root.firstElementChild as HTMLElement
    expect(page.classList.contains('builder-signed-out')).toBe(true)
    expect(page.getAttribute('role')).toBe('alert')
    expect(page.textContent).toContain(EXPIRED_WORDING)
    expect(root.querySelector('.shell')).toBeNull()
    const button = page.querySelector('button')!
    expect(button.textContent).toBe('Sign in again')
    // Nothing navigated on its own; the button navigates exactly once.
    expect(signIn).not.toHaveBeenCalled()
    button.click()
    expect(signIn).toHaveBeenCalledTimes(1)

    // ── AT LOAD, A REJECTED FETCH ────────────────────────────────────────────
    root.replaceChildren()
    const refused = await fetchBusinesses(rejects() as never).catch((e: unknown) => e)
    expect(isSessionEnded(refused)).toBe(true)
    expect((refused as { cause?: unknown }).cause).toBeInstanceOf(TypeError)
    expect(
      await loadOrSignOut(
        root,
        () => Promise.all([fetchBusinesses(rejects() as never), fetchAiStatus(rejects() as never)]),
        notice,
      ),
    ).toBeNull()
    expect(root.childElementCount).toBe(1)
    expect(root.firstElementChild!.textContent).toContain(UNREACHABLE_WORDING)
    expect(root.querySelector('.shell')).toBeNull()

    // ── A LOAD THAT FAILS FOR ANOTHER REASON STILL THROWS ────────────────────
    root.replaceChildren()
    const boom = new Error('importmap.json is not valid JSON')
    await expect(
      loadOrSignOut(root, async () => {
        throw boom
      }),
    ).rejects.toBe(boom)
    expect(root.childElementCount).toBe(0)

    // ── MID-SESSION: A LIVE BUILDER, A DIALOG WITH TYPED TEXT ────────────────
    let refuseListing = false
    const sitesOf: Record<string, Array<{ slug: string; latest: number | null }>> = {
      acct_salon: [{ slug: 'salon-site', latest: null }],
      acct_studio: [{ slug: 'studio-site', latest: null }],
    }
    const calls: string[] = []
    const app = mountBuilder(root, {
      businesses: TWO,
      account: ACCOUNT,
      storage: memoryStorage(),
      markdownReady: Promise.resolve(),
      loadSites: async (id: string | null) =>
        refuseListing ? fetchSites(refuses() as never) : (sitesOf[id ?? ''] ?? []),
      chatTransport: quietChat,
      libraryTransport: {
        ...quietLibrary,
        list: async () => {
          calls.push('library')
          return {
            material: [
              { uid: 'mat-salon', title: 'Salon logo', filename: 'salon.png', kind: 'image', role: 'site' },
            ],
          }
        },
      },
      peopleTransport: peopleTransport(calls),
    })
    await settle()
    expect(app.sessionNotice).toBeNull()
    expect(app.scope.getSite()).toBe('salon-site')

    const shellEl = app.shell.element as HTMLElement
    ;(shellEl.querySelector('.builder-people__invite') as HTMLElement).click()
    await settle()
    const dialog = shellEl.querySelector('.builder-modal') as HTMLElement
    expect(dialog, 'the invite dialog did not open inside the shell').toBeTruthy()
    const typed = dialog.querySelector('input') as HTMLInputElement
    typed.value = 'half-typed@example.test'

    // Several calls are refused, from several places.
    await Promise.all([
      fetchSites(refuses() as never).catch(() => null),
      fetchBusinesses(refuses() as never).catch(() => null),
      fetchAiStatus(refuses() as never).catch(() => null),
      saveCopy({ slug: 'salon-site', page: 'index', path: 'x' }, {}, refuses() as never).catch(() => null),
    ])

    // Exactly one strip, a sibling ABOVE the shell, not inside it.
    const strips = root.querySelectorAll('.builder-session-notice')
    expect(strips).toHaveLength(1)
    const strip = strips[0] as HTMLElement
    expect(strip).toBe(app.sessionNotice)
    expect(strip.getAttribute('role')).toBe('alert')
    expect(strip.textContent).toContain(EXPIRED_WORDING)
    expect(strip.querySelector('button')!.textContent).toBe('Sign in again')
    expect(strip.parentElement).toBe(shellEl.parentElement)
    expect(shellEl.contains(strip)).toBe(false)
    expect(strip.compareDocumentPosition(shellEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // The shell stays live: not inert, not dimmed; the work stays editable.
    expect(shellEl.hasAttribute('inert')).toBe(false)
    expect(shellEl.classList.contains('builder-shell--blocked')).toBe(false)
    expect(dialog.closest('[inert]')).toBeNull()
    expect(dialog.isConnected).toBe(true)
    expect(typed.value).toBe('half-typed@example.test')
    expect(typed.disabled).toBe(false)
    expect(typed.readOnly).toBe(false)

    // ── A REFUSED SITE LISTING CHANGES NOTHING ───────────────────────────────
    ;(dialog.querySelector('.builder-modal__footer button:last-child') as HTMLElement | null)?.click()
    await settle()
    const libraryEl = app.library.element as HTMLElement
    const peopleEl = shellEl.querySelector('.builder-people') as HTMLElement
    const frameSrc = app.panel.frame.getAttribute('src')
    const libraryBefore = libraryEl.innerHTML
    const peopleBefore = peopleEl.innerHTML
    expect(libraryEl.textContent).toContain('Salon logo')
    expect(peopleEl.textContent).toContain('Alice Adams')
    const callsBefore = calls.length

    refuseListing = true
    await app.scope.setBusiness('acct_studio')
    await settle()

    expect(app.panel.getSite()).toBe('salon-site')
    expect(app.panel.frame.getAttribute('src')).toBe(frameSrc)
    expect(libraryEl.innerHTML).toBe(libraryBefore)
    expect(peopleEl.innerHTML).toBe(peopleBefore)
    // Not cleared and re-read against a store this session can no longer read.
    expect(calls.length).toBe(callsBefore)
    expect(root.querySelectorAll('.builder-session-notice')).toHaveLength(1)

    app.destroy()
  })
})

// ── AC-2231: any other failure is handled as before ─────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — only a refused session counts', () => {
  it('test_UAT_AC2231_non_401_failures_keep_their_defaults_and_a_valid_session_is_never_told_it_ended', async () => {
    const seen: unknown[] = []
    const stop = onSessionEnded((e: unknown) => seen.push(e))
    try {
      // ── AN ORIGIN THAT MERELY FAILED (500) ─────────────────────────────────
      globalThis.fetch = (async () => json({ error: 'down' }, 500)) as never
      const loaded = await loadOrSignOut(root, () => Promise.all([fetchBusinesses(), fetchAiStatus()]))
      expect(loaded).toEqual([{ account: null, businesses: [] }, { ai: true, message: null }])
      const [biz, aiStatus] = loaded as [Handle, Handle]
      const failed = mountBuilder(root, {
        businesses: biz.businesses,
        account: biz.account,
        aiStatus,
        storage: memoryStorage(),
        markdownReady: Promise.resolve(),
        chatTransport: quietChat,
        libraryTransport: quietLibrary,
        peopleTransport: peopleTransport(),
      })
      await settle()
      // Mounted, unblocked, no switcher, unscoped, and no session notice.
      expect(root.querySelector('.shell')).toBeTruthy()
      expect(failed.sessionNotice).toBeNull()
      expect(root.querySelector('.builder-signed-out')).toBeNull()
      expect(failed.banner).toBeNull()
      expect((failed.shell.element as HTMLElement).hasAttribute('inert')).toBe(false)
      expect(failed.switcher.element.querySelector('select')).toBeNull()
      expect(failed.scope.getBusiness()).toBeNull()
      failed.destroy()

      // A site listing that failed for a non-session reason is an empty list.
      expect(await fetchSites().catch((e: unknown) => e)).toBeInstanceOf(Error)
      expect(isSessionEnded(await fetchSites().catch((e: unknown) => e))).toBe(false)
      root.replaceChildren()
      const emptyListing = mountBuilder(root, {
        businesses: TWO,
        account: ACCOUNT,
        sites: [{ slug: 'stale-site', latest: null }],
        storage: memoryStorage(),
        markdownReady: Promise.resolve(),
        chatTransport: quietChat,
        libraryTransport: quietLibrary,
        peopleTransport: peopleTransport(),
      })
      await settle()
      expect(emptyListing.scope.getBusiness()).toBe('acct_salon')
      expect(emptyListing.scope.getSite()).toBeNull()
      expect(emptyListing.sessionNotice).toBeNull()
      emptyListing.destroy()
      expect(seen).toEqual([])

      // ── A VALID SESSION, LOADED TWICE ──────────────────────────────────────
      globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
        const url = String(input)
        const rest = url.replace(/^\/b\/[^/]+/, '')
        if (rest === '/api/businesses') return json({ account: ACCOUNT, businesses: TWO })
        if (rest === '/api/status') return json({ ai: true })
        if (rest.startsWith('/api/sites')) return json([{ slug: 'salon-site', latest: 1 }])
        if (rest.startsWith('/api/ai/session')) {
          const { slug } = JSON.parse(String(init?.body ?? '{}'))
          return json({ sessionId: `s-${slug}`, turns: [], ready: true })
        }
        if (rest.startsWith('/api/material')) return json({ material: [] })
        if (rest.startsWith('/api/people')) return json({ people: [] })
        if (rest.startsWith('/api/palette')) return json({ palette: {}, usage: {} })
        return json({ error: 'not found' }, 404)
      }) as never
      const storage = memoryStorage()
      let live: Handle | null = null
      for (let load = 0; load < 2; load += 1) {
        live?.destroy()
        root.replaceChildren()
        const opened = await loadOrSignOut(root, () => Promise.all([fetchBusinesses(), fetchAiStatus()]))
        expect(opened).not.toBeNull()
        const [b, s] = opened as [Handle, Handle]
        expect(b.account).toEqual(ACCOUNT)
        expect(b.businesses).toHaveLength(2)
        live = mountBuilder(root, {
          businesses: b.businesses,
          account: b.account,
          aiStatus: s,
          storage,
          markdownReady: Promise.resolve(),
        })
        await settle()
        expect(live.scope.getSite()).toBe('salon-site')
        expect(live.sessionNotice).toBeNull()
        expect(root.querySelector('.builder-signed-out')).toBeNull()
      }
      expect(seen).toEqual([])

      // ── OTHER CALLERS KEEP THEIR OWN ERROR CONTRACTS ───────────────────────
      const target = { slug: 'salon-site', page: 'index', path: 'hero.title' }
      const VALIDATOR = 'hero.title must be at most 80 characters'
      const rejected = await saveCopy(target, { title: 'x' }, (async () =>
        json({ message: VALIDATOR, path: 'hero.title' }, 400)) as never).catch((e: unknown) => e)
      expect(rejected).toBeInstanceOf(CopyError)
      expect((rejected as Error).message).toBe(VALIDATOR)
      expect((rejected as { path?: string }).path).toBe('hero.title')

      const frames: unknown[] = []
      for await (const frame of streamChatPrompt('s-salon-site', 'hi', (async () =>
        json({ error: 'the model is busy' }, 503)) as never)) {
        frames.push(frame)
      }
      expect(frames).toEqual([{ kind: 'text', content: '\n\n_the model is busy_' }, { kind: 'done' }])
      expect(seen).toEqual([])
      expect(live!.sessionNotice).toBeNull()

      // A 401 on a non-load call: the strip appears AND the caller's error is
      // the same CopyError it always was.
      const unauthorised = await saveCopy(target, { title: 'x' }, (async () =>
        json({ error: 'unauthorised' }, 401)) as never).catch((e: unknown) => e)
      expect(unauthorised).toBeInstanceOf(CopyError)
      expect(isSessionEnded(unauthorised)).toBe(false)
      expect((unauthorised as { status?: number }).status).toBe(401)
      expect((unauthorised as Error).message).toBe('unauthorised')
      expect(live!.sessionNotice).toBeTruthy()
      expect(root.querySelectorAll('.builder-session-notice')).toHaveLength(1)

      // And the stream still reports a refusal as a frame, not a throw.
      const refusedFrames: unknown[] = []
      for await (const frame of streamChatPrompt('s-salon-site', 'hi', refuses() as never)) {
        refusedFrames.push(frame)
      }
      expect(refusedFrames).toEqual([{ kind: 'text', content: '\n\n_unauthorised_' }, { kind: 'done' }])
      live!.destroy()
    } finally {
      stop()
    }
  })
})

// ── AC-2232: one control size, declared once, winning on resolution ─────────

/** Strip comments; a declaration scan must not read prose about `font: inherit`. */
const uncomment = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

type Rule = { sheet: string; selectors: string[]; decls: Array<{ prop: string; value: string }> }

function parseRules(sheet: string, css: string): Rule[] {
  const rules: Rule[] = []
  for (const m of uncomment(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const decls = m[2]
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.includes(':'))
      .map((d) => {
        const at = d.indexOf(':')
        return { prop: d.slice(0, at).trim(), value: d.slice(at + 1).trim() }
      })
    rules.push({ sheet, selectors, decls })
  }
  return rules
}

/** The stylesheets the workspace document links, in the order it links them. */
function loadedSheets(): Array<{ name: string; css: string }> {
  const map = JSON.parse(
    fs.readFileSync(path.join(REPO, 'apps/control-app/src/generated/importmap.json'), 'utf8'),
  ) as { styles: string[] }
  const chrome = fs.readFileSync(path.join(REPO, 'apps/control-app/src/chrome.ts'), 'utf8')
  // The order is the document's: component sheets first, then the builder's own.
  expect(chrome.indexOf('styles.map(')).toBeGreaterThan(-1)
  expect(chrome.indexOf('/builder/builder.css')).toBeGreaterThan(chrome.indexOf('styles.map('))
  const sheets = map.styles.map((href) => {
    const m = /^\/webui\/([^/]+)\/(.+)$/.exec(href)!
    return { name: href, css: fs.readFileSync(path.join(webuiPackageDir(m[1]), m[2]), 'utf8') }
  })
  sheets.push({ name: '/builder/builder.css', css: fs.readFileSync(path.join(BUILDER_DIR, 'builder.css'), 'utf8') })
  return sheets
}

const matches = (el: Element, selector: string) => {
  try {
    return el.matches(selector)
  } catch {
    return false
  }
}

/** Specificity as [ids, classes/attrs/pseudo-classes, types]. */
function specificity(sel: string): [number, number, number] {
  const ids = (sel.match(/#[\w-]+/g) ?? []).length
  const classes = (sel.match(/\.[\w-]+|\[[^\]]*\]|(?<!:):(?!:)[\w-]+/g) ?? []).length
  const types = (
    sel.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|::?[\w-]+(\([^)]*\))?/g, ' ').match(/[a-zA-Z][\w-]*/g) ?? []
  ).length
  return [ids, classes, types]
}
const cmp = (a: number[], b: number[]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

/** Every `font`/`font-size` (or `padding`) declaration applying to `el`, in load order. */
function applying(el: Element, rules: Rule[], props: string[]) {
  const out: Array<{ sheet: string; selector: string; prop: string; value: string }> = []
  for (const rule of rules) {
    const hit = rule.selectors.filter((s) => matches(el, s))
    if (hit.length === 0) continue
    const best = hit.sort((a, b) => cmp(specificity(b), specificity(a)))[0]
    for (const d of rule.decls) {
      if (props.includes(d.prop)) out.push({ sheet: rule.sheet, selector: best, ...d })
    }
  }
  return out
}

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the chrome controls share one size', () => {
  it('test_UAT_AC2232_every_chrome_control_resolves_to_the_single_control_font_size_token_last', async () => {
    const BUILDER_CSS = fs.readFileSync(path.join(BUILDER_DIR, 'builder.css'), 'utf8')
    const TOKEN = 'var(--builder-control-font-size)'

    // ── ONE DEFINITION SITE, 13px, SMALLER THAN THE BROWSER DEFAULT ──────────
    const defs = [...uncomment(BUILDER_CSS).matchAll(/--builder-control-font-size\s*:\s*([^;]+);/g)]
    expect(defs, 'the control size token must be declared exactly once').toHaveLength(1)
    expect(defs[0][1].trim()).toBe('13px')
    expect(parseFloat(defs[0][1])).toBeLessThan(16)

    const sheets = loadedSheets()
    const rules = sheets.flatMap((s) => parseRules(s.name, s.css))
    const builderRules = rules.filter((r) => r.sheet === '/builder/builder.css')
    const builderClasses = new Set(
      builderRules.flatMap((r) => r.selectors.flatMap((s) => s.match(/\.[\w-]+/g) ?? []).map((c) => c.slice(1))),
    )

    // ── MOUNT THE REAL SURFACES ──────────────────────────────────────────────
    const app = mountBuilder(root, {
      sites: [{ slug: 'alpha', latest: 1 }],
      storage: memoryStorage(),
      markdownReady: Promise.resolve(),
      chatTransport: quietChat,
      libraryTransport: quietLibrary,
      peopleTransport: peopleTransport(),
    })
    await settle()
    const topBar = [...root.querySelectorAll('.shell-actions button')].filter((b) =>
      ['Theme', 'About'].includes((b.textContent || '').trim()),
    )
    expect(topBar.map((b) => b.textContent!.trim()).sort()).toEqual(['About', 'Theme'])

    const contacts = document.createElement('div')
    document.body.append(contacts)
    const panel = createPeoplePanel({ storage: memoryStorage(), transport: peopleTransport() })
    contacts.append(panel.element)
    await panel.refresh()
    panel.listDetail.select('usr_1')
    await settle()

    const one = (sel: string) => {
      const el = contacts.querySelector(sel)
      expect(el, `${sel} is not rendered`).toBeTruthy()
      return el as HTMLElement
    }
    const search = one('.builder-people__search')
    const facets = [...contacts.querySelectorAll('.builder-people__facet')] as HTMLElement[]
    expect(facets.length).toBeGreaterThan(0)
    const invite = one('.builder-people__invite')
    const fulfil = one('.builder-people__fulfil')

    // Open both dialogs, collecting their footer buttons and every class emitted.
    const dialogButtons: Array<{ el: HTMLElement; label: string; affirmative: boolean }> = []
    const emitted = new Set<string>()
    const sweep = () => {
      for (const node of contacts.querySelectorAll('[class]')) {
        for (const name of node.classList) if (name.startsWith('builder-')) emitted.add(name)
      }
    }
    sweep()
    for (const [opener, affirm] of [
      [invite, 'Invite'],
      [fulfil, 'Provision'],
    ] as const) {
      opener.click()
      await settle()
      sweep()
      const buttons = [...contacts.querySelectorAll('.builder-modal__footer button')] as HTMLElement[]
      const byLabel = (l: string) => buttons.find((b) => (b.textContent || '').trim() === l)!
      expect(byLabel(affirm), `${affirm} is missing from its dialog`).toBeTruthy()
      expect(byLabel('Close'), `Close is missing from the ${affirm} dialog`).toBeTruthy()
      dialogButtons.push({ el: byLabel(affirm), label: affirm, affirmative: true })
      dialogButtons.push({ el: byLabel('Close'), label: `${affirm}/Close`, affirmative: false })

      // Canonical class, matched by a builder rule; primary modifier on the affirmative.
      for (const b of [byLabel(affirm), byLabel('Close')]) {
        expect(b.classList.contains('builder-modal__btn')).toBe(true)
        for (const c of b.classList) expect(builderClasses.has(c), `.${c} has no builder rule`).toBe(true)
      }
      expect(byLabel(affirm).classList.contains('builder-modal__btn--primary')).toBe(true)
      expect(byLabel('Close').classList.contains('builder-modal__btn--primary')).toBe(false)

      // Font resolution must be checked while the dialog is in the document.
      const resolveIn = [byLabel(affirm), byLabel('Close')]
      for (const el of resolveIn) {
        const last = applying(el, rules, ['font', 'font-size']).at(-1)
        expect(last, `${(el.textContent || '').trim()} is sized by nothing`).toBeTruthy()
        expect(last!.prop).toBe('font-size')
        expect(last!.value).toBe(TOKEN)
      }
      // Dialog buttons keep their larger footer padding.
      const pad = applying(byLabel(affirm), rules, ['padding']).at(-1)!
      expect(pad.value).not.toBe('var(--builder-control-padding)')
      byLabel('Close').click()
      await settle()
    }
    expect(dialogButtons).toHaveLength(4)

    // ── EVERY `builder-*` CLASS EMITTED IS MATCHED BY A BUILDER RULE ─────────
    expect(emitted.has('builder-modal__btn')).toBe(true)
    const unmatched = [...emitted].sort().filter((c) => !builderClasses.has(c))
    expect(unmatched, `no builder rule matches: ${unmatched.join(', ')}`).toEqual([])

    // ── THE LAST FONT DECLARATION ON EACH CONTROL IS THE TOKEN ───────────────
    const controls: Array<[string, Element]> = [
      ...topBar.map((b) => [`top bar ${b.textContent!.trim()}`, b] as [string, Element]),
      ['search', search],
      ...facets.map((f, i) => [`facet ${i}`, f] as [string, Element]),
      ['Invite', invite],
      ['Provision a business', fulfil],
    ]
    for (const [name, el] of controls) {
      const chain = applying(el, rules, ['font', 'font-size'])
      const last = chain.at(-1)
      expect(last, `${name} is sized by nothing`).toBeTruthy()
      expect(last, `${name}: a later font declaration overrides the token`).toMatchObject({
        prop: 'font-size',
        value: TOKEN,
        sheet: '/builder/builder.css',
      })
      // The winner is at least as specific as anything it has to beat.
      for (const earlier of chain) {
        expect(
          cmp(specificity(last!.selector), specificity(earlier.selector)),
          `${name}: ${earlier.sheet} '${earlier.selector}' outranks '${last!.selector}'`,
        ).toBeGreaterThanOrEqual(0)
      }
      // Within the builder sheet, a shorthand reset is IMMEDIATELY followed by the token.
      for (const rule of builderRules) {
        if (!rule.selectors.some((s) => matches(el, s))) continue
        const i = rule.decls.findIndex((d) => d.prop === 'font')
        if (i === -1) continue
        expect(rule.decls[i + 1], `${name}: '${rule.selectors.join(', ')}' resets font without the token next`)
          .toEqual({ prop: 'font-size', value: TOKEN })
      }
    }

    // The top bar's shorthand lives in the shell sheet, loaded before ours.
    const topChain = applying(topBar[0], rules, ['font', 'font-size'])
    expect(topChain.some((d) => d.sheet !== '/builder/builder.css' && d.prop === 'font')).toBe(true)

    // ── THE FILTER ROW SHARES ONE PADDING ────────────────────────────────────
    const paddings = [search, ...facets, invite].map((el) => applying(el, rules, ['padding']).at(-1)?.value)
    expect(paddings[0]).toBeTruthy()
    expect(new Set(paddings).size, `filter row paddings differ: ${paddings.join(' | ')}`).toBe(1)

    app.destroy()
  })
})
