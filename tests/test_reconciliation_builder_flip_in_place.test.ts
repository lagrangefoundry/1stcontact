// @vitest-environment jsdom
/**
 * story-e674c60a, BUG-79 upgrade. **View↔Edit flips in place**: the display
 * panel holds one frame per document mode, kept alive, and a switch only
 * changes which one is visible.
 *
 * Driven against the ACTUAL composition: `mountBuilder`, the real display
 * panel, the real toolbar, the real `carry.js` fed the real framework
 * page-state module, and (for the edit loop) the real framework edit bridge.
 * The thing under test is how the pane, its modes and the builder's listeners
 * are wired to each other, so nothing inside the builder is replaced.
 *
 * THE FRAMES' DOCUMENTS ARE REAL RENDERS, delivered as a browser delivers them.
 * jsdom never fetches an iframe `src`; it swaps a blank window in and fires a
 * `load` for it, which a browser does not do. So, as in the page-carry suite:
 *
 *   - jsdom's own `load` events are stopped on an ancestor in the capture phase
 *     (and COUNTED — a navigation is exactly what produces one), and only the
 *     documents `arrive` delivers reach the frame's listeners;
 *   - each frame shows the document most recently delivered to it, a real
 *     `renderL1Document` output at the preview address the pane points at;
 *   - jsdom implements neither `scrollY` nor `scrollTo`, so the offset is
 *     defined on the window and the calls are recorded;
 *   - `location.reload()` is a navigation jsdom reports as not implemented on
 *     the window's own virtual console, which is how a reload is counted.
 *
 * Navigations are observed as `src` attribute writes on the frames (a
 * MutationObserver records a write even when the value is unchanged), so "no
 * navigation" is asserted as "no write and no load", never inferred. The
 * observer's callback RECORDS what it is handed, so a write is still visible to
 * `navsOf` after an `await` has let the records be delivered.
 *
 * THE WRITES ARE THE REAL ONES (AC-2521). A palette change goes through the
 * toolbar's Colors popup, a segment save through the edit bridge's click and the
 * segment modal's Save, and an assistant change through the pane's own turn. Only
 * the HTTP behind each is stood in for: the palette transport and the chat
 * transport are the builder's own seams for that, and the copy endpoint is
 * answered at `fetch`.
 */
import fs from 'node:fs'
import { JSDOM, VirtualConsole } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import {
  renderL1Document,
  mountL1EditBridge,
  L1_EDIT_HOT_CLASS,
} from '../packages/framework/src/index'
import { formatL1Path, L1_EDIT_PAGE_ATTR, L1_EDIT_SEGMENT_ATTR } from '../packages/site-schema/src/l1/edit'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Channel = 'draft' | 'edit'

const SITES = [
  { slug: 'acme', latest: null },
  { slug: 'other', latest: null },
]

const l1 = (root: L1Node): L1Document => ({ widths: [320, 768, 1440], root })

const page = (words: string): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'headline', text: words },
    { kind: 'text', text: 'A long page body the reader scrolls down.' },
  ],
})

function memoryStorage(): Storage {
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
  } as Storage
}

interface Loaded {
  win: Window
  doc: Document
  /** Every offset the workspace scrolled this document to, in order. */
  scrolled: number[]
  /** How many times this document's window was asked to reload. */
  reloads: () => number
}

interface Panel {
  readonly frame: HTMLIFrameElement | null
  getSrc(): string
  setSite(slug: string): void
  refresh(): void
  reloadDocument(): void
  on(event: string, cb: (d: unknown) => void): () => void
}

interface App {
  panel: Panel
  toolbar: { get(id: string): HTMLElement | null }
  chat: { getChat(): { send(text: string): Promise<unknown> } | null }
  destroy?: () => void
}

/** The palette the popup paints, and what a write of it answers. */
const PALETTE_ENTRIES = [{ name: 'primary', value: '#112233', count: 1 }]

/** One segment's copy envelope: a single colour field, so a pick makes it dirty. */
const COPY_ENVELOPE = {
  kind: 'container',
  fields: [{ name: 'color', type: 'color', label: 'Colour' }],
  values: { color: '#000000' },
  palette: { primary: { value: '#112233' } },
  panel: null,
}

/** `app.js` imports the webui components by bare specifier, hence the dynamic load. */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => App
let previewUrl: (slug: string, channel: string, rel?: string) => string

const BUILDER_CSS = fs.readFileSync('apps/control-app/src/builder/builder.css', 'utf8')

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a flip-in-place suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the View/Edit flip is in place (BUG-79)', () => {
  let root: HTMLElement
  let app: App
  /** True only while `arrive` is firing a frame's `load`. */
  let delivering = false
  /** What each frame is showing. */
  let showing: Map<HTMLIFrameElement, Loaded>
  /** Every `load` the environment fired on a frame (navigations), per frame. */
  let envLoads: Map<HTMLIFrameElement, number>
  /** Every `src` write on a frame since the last `clearNavs()`. */
  let navLog: { frame: HTMLIFrameElement; src: string | null }[]
  let observer: MutationObserver | null = null

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ previewUrl } = (await import('../apps/control-app/src/builder/api.js')) as {
      previewUrl: typeof previewUrl
    })
    app?.destroy?.()
    observer?.disconnect()
    document.head.querySelector('style[data-test-builder-css]')?.remove()
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    showing = new Map()
    envLoads = new Map()
    navLog = []
    // The assistant's pane measures and queries media; jsdom has neither.
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
    root.addEventListener(
      'load',
      (ev) => {
        if (ev.target instanceof HTMLIFrameElement && !delivering) {
          envLoads.set(ev.target, (envLoads.get(ev.target) ?? 0) + 1)
          ev.stopImmediatePropagation()
        }
      },
      true,
    )
  })

  /** Mount the real builder, then patch the browser (never the subject). */
  function mount(extra: Record<string, unknown> = {}) {
    app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), pageState, ...extra })
    for (const f of frames()) {
      Object.defineProperty(f, 'contentWindow', {
        configurable: true,
        get: () => showing.get(f)?.win ?? null,
      })
      Object.defineProperty(f, 'contentDocument', {
        configurable: true,
        get: () => showing.get(f)?.doc ?? null,
      })
    }
    observer = new MutationObserver((records) => record(records))
    observer.observe(panelEl(), { attributes: true, attributeFilter: ['src'], subtree: true })
    return app
  }

  function record(records: MutationRecord[]) {
    for (const r of records) {
      const el = r.target as HTMLIFrameElement
      navLog.push({ frame: el, src: el.getAttribute('src') })
    }
  }

  const panelEl = () => root.querySelector('.builder-panel') as HTMLElement
  /** Every frame the pane holds, in mode-registration order: [view, edit]. */
  const frames = () => [...panelEl().querySelectorAll('.builder-panel__pane')] as HTMLIFrameElement[]
  const viewFrame = () => frames()[0]
  const editFrame = () => frames()[1]
  const shown = () => panelEl().querySelector('.builder-panel__frame') as HTMLIFrameElement | null
  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement

  function drain() {
    record(observer?.takeRecords() ?? [])
  }
  const navsOf = (f: HTMLIFrameElement) => {
    drain()
    return navLog.filter((n) => n.frame === f).map((n) => n.src)
  }
  const clearNavs = () => {
    drain()
    navLog = []
    envLoads.clear()
  }
  /** Let any environment-fired `load` land before counting. */
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

  /** Wait, bounded, for a condition the composition reaches asynchronously. */
  async function until(cond: () => boolean, what: string) {
    for (let i = 0; i < 400 && !cond(); i++) await new Promise((r) => setTimeout(r, 5))
    expect(cond(), `timed out waiting for ${what}`).toBe(true)
  }

  /** The open dialog holding `selector`, once it has painted. */
  async function dialogWith(selector: string): Promise<HTMLElement> {
    const find = () =>
      ([...document.querySelectorAll('.builder-modal')] as HTMLElement[]).find((m) => m.querySelector(selector)) ??
      null
    await until(() => find() !== null, `a dialog holding ${selector}`)
    return find() as HTMLElement
  }

  const buttonIn = (host: Element, label: string) =>
    [...host.querySelectorAll('button')].find((b) => b.textContent === label) as HTMLButtonElement

  /** Select a palette entry in the popup, as the operator's click on its swatch does. */
  async function pickEntry(popup: HTMLElement, name: string) {
    const input = () => popup.querySelector(`.builder-palette__swatch-input[value="${name}"]`) as HTMLInputElement | null
    await until(() => input() !== null, `the ${name} swatch`)
    const el = input() as HTMLInputElement
    el.checked = true
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }

  /** The palette origin, at the builder's own transport seam. */
  function paletteOrigin() {
    const writes: unknown[] = []
    return {
      writes,
      transport: {
        get: async () => ({ entries: PALETTE_ENTRIES }),
        write: async (body: unknown) => {
          writes.push(body)
          return { entries: PALETTE_ENTRIES, count: 1 }
        },
      },
    }
  }

  /** The copy endpoint (`/api/copy`), answered at `fetch`; everything else passes through. */
  function copyOrigin() {
    const real = globalThis.fetch
    const posts: unknown[] = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (!url.includes('/api/copy')) return real(input, init)
      if (init?.method === 'POST') posts.push(JSON.parse(String(init.body)))
      return new Response(JSON.stringify(COPY_ENVELOPE), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch
    return {
      posts,
      restore: () => {
        globalThis.fetch = real
      },
    }
  }

  /**
   * Deliver a real render to a frame, as a browser delivers it: a document at
   * the preview address, shown by that frame, and the frame's `load` fired.
   */
  async function arrive(
    frame: HTMLIFrameElement,
    channel: Channel,
    site: string,
    rel: string,
    words: string,
  ): Promise<Loaded> {
    const { html, css } = renderL1Document(l1(page(words)), { edit: channel === 'edit' })
    let reloads = 0
    const vc = new VirtualConsole()
    vc.on('jsdomError', (e: Error) => {
      if (/navigation/i.test(e.message)) reloads += 1
    })
    const dom = new JSDOM(
      `<!doctype html><html><head><style>${css}</style></head>` +
        `${channel === 'edit' ? '<body data-fc-edit>' : '<body>'}${html}</body></html>`,
      {
        runScripts: 'dangerously',
        url: new URL(previewUrl(site, channel, rel), window.location.origin).href,
        virtualConsole: vc,
      },
    )
    const d = dom.window.document
    for (let i = 0; i < 50 && d.readyState === 'loading'; i++) await tick()
    expect(d.readyState).not.toBe('loading')
    const win = dom.window as unknown as Window
    Object.defineProperty(win, 'scrollY', { value: 0, configurable: true, writable: true })
    const scrolled: number[] = []
    win.scrollTo = ((_x: number, y: number) => void scrolled.push(y)) as Window['scrollTo']
    const loaded: Loaded = { win, doc: d, scrolled, reloads: () => reloads }
    showing.set(frame, loaded)
    delivering = true
    try {
      frame.dispatchEvent(new Event('load'))
    } finally {
      delivering = false
    }
    return loaded
  }

  const scrollTo = (loaded: Loaded, offset: number) =>
    Object.defineProperty(loaded.win, 'scrollY', { value: offset, configurable: true, writable: true })

  /** Mount and let both channels load: View shown, Edit primed behind it. */
  async function mountBothLoaded(extra: Record<string, unknown> = {}) {
    mount(extra)
    const view = await arrive(viewFrame(), 'draft', 'acme', '', 'View of acme')
    // The prime the View load triggered, arriving behind the page on screen.
    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit'))
    const edit = await arrive(editFrame(), 'edit', 'acme', '', 'Edit of acme')
    await tick()
    clearNavs()
    return { view, edit }
  }

  it('test_UAT_AC2517_a_view_edit_switch_navigates_neither_channel', async () => {
    const { view, edit } = await mountBothLoaded()
    expect(shown()).toBe(viewFrame())
    // A channel of its own each, not one frame re-pointed.
    expect(editFrame()).not.toBe(viewFrame())
    const viewSrc = viewFrame().getAttribute('src')
    const editSrc = editFrame().getAttribute('src')
    expect(viewSrc).toBe(previewUrl('acme', 'draft'))
    expect(editSrc).toBe(previewUrl('acme', 'edit'))

    // Away and back, twice over.
    modeButton('edit').click()
    expect(shown()).toBe(editFrame())
    modeButton('view').click()
    expect(shown()).toBe(viewFrame())
    modeButton('edit').click()
    expect(shown()).toBe(editFrame())
    modeButton('view').click()
    await tick()

    // The same document objects, at the same addresses.
    expect(viewFrame().contentDocument).toBe(view.doc)
    expect(editFrame().contentDocument).toBe(edit.doc)
    expect(viewFrame().getAttribute('src')).toBe(viewSrc)
    expect(editFrame().getAttribute('src')).toBe(editSrc)
    // Nothing was asked for and nothing loaded: no navigation on either frame.
    expect(navsOf(viewFrame())).toEqual([])
    expect(navsOf(editFrame())).toEqual([])
    expect(envLoads.get(viewFrame()) ?? 0).toBe(0)
    expect(envLoads.get(editFrame()) ?? 0).toBe(0)

    // Separately: the reader follows a link inside View. The frame moves by
    // itself (the pane re-points nothing), and Edit is primed at that page
    // behind it.
    const linked = await arrive(viewFrame(), 'draft', 'acme', 'contact', 'Contact page')
    expect(viewFrame().getAttribute('src')).toBe(viewSrc)
    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit', 'contact'))
    const linkedEdit = await arrive(editFrame(), 'edit', 'acme', 'contact', 'Edit of contact')
    await tick()
    clearNavs()

    // A round trip from there navigates neither channel: View already holds the
    // page Edit was showing, so it is revealed, not re-pointed at it.
    modeButton('edit').click()
    expect(shown()).toBe(editFrame())
    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'edit', 'contact'))
    modeButton('view').click()
    // Read at once, before anything else could happen.
    expect(navsOf(viewFrame())).toEqual([])
    expect(navsOf(editFrame())).toEqual([])
    expect(viewFrame().getAttribute('src')).toBe(viewSrc)
    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit', 'contact'))
    await tick()
    expect(shown()).toBe(viewFrame())
    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'draft', 'contact'))
    expect(viewFrame().contentDocument).toBe(linked.doc)
    expect(editFrame().contentDocument).toBe(linkedEdit.doc)
    expect(envLoads.get(viewFrame()) ?? 0).toBe(0)
    expect(envLoads.get(editFrame()) ?? 0).toBe(0)
  })

  it('test_UAT_AC2518_the_channel_left_behind_stays_connected_and_laid_out_hidden_by_visibility', () => {
    const style = document.createElement('style')
    style.setAttribute('data-test-builder-css', '')
    style.textContent = BUILDER_CSS
    document.head.append(style)

    mount()
    const view = viewFrame()
    modeButton('edit').click()

    // Still in the document, never hidden by the attribute or taken out of layout.
    expect(view.isConnected).toBe(true)
    expect(view.hasAttribute('hidden')).toBe(false)
    const cs = getComputedStyle(view)
    expect(cs.display).not.toBe('none')
    // Unpainted and untouchable.
    expect(cs.visibility).toBe('hidden')
    expect(cs.pointerEvents).toBe('none')
    // The revealed one is painted and interactive.
    const ecs = getComputedStyle(editFrame())
    expect(ecs.visibility).toBe('visible')
    expect(ecs.pointerEvents).toBe('auto')

    // Every frame carries the geometry class; exactly one the shown class, and
    // it is the frame the pane reports as shown.
    expect(frames()).toHaveLength(2)
    for (const f of frames()) expect(f.classList.contains('builder-panel__pane')).toBe(true)
    const shownFrames = panelEl().querySelectorAll('.builder-panel__frame')
    expect(shownFrames).toHaveLength(1)
    expect(shownFrames[0]).toBe(app.panel.frame)
    expect(shownFrames[0]).toBe(editFrame())

    // And back: the roles swap, nothing is removed.
    modeButton('view').click()
    expect(editFrame().isConnected).toBe(true)
    expect(editFrame().hasAttribute('hidden')).toBe(false)
    expect(getComputedStyle(editFrame()).visibility).toBe('hidden')
    expect(app.panel.frame).toBe(view)
  })

  it('test_UAT_AC2519_the_idle_channel_is_primed_after_the_visible_load_and_a_stale_frame_is_not', async () => {
    mount()
    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))

    // Before the visible channel has loaded, nothing is fetched on the
    // operator's behalf.
    expect(shown()).toBe(viewFrame())
    expect(editFrame().getAttribute('src')).toBeNull()

    const view = await arrive(viewFrame(), 'draft', 'acme', '', 'View of acme')
    // Once it has: the edit channel's address for the same site, behind it.
    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit'))
    expect(shown()).toBe(viewFrame())
    expect(seen).toEqual([view.doc])

    // The primed document arrives while hidden.
    const edit = await arrive(editFrame(), 'edit', 'acme', '', 'Edit of acme')
    await tick()
    clearNavs()

    // The first flip shows rather than fetches.
    modeButton('edit').click()
    await tick()
    expect(shown()).toBe(editFrame())
    expect(navsOf(editFrame())).toEqual([])
    expect(envLoads.get(editFrame()) ?? 0).toBe(0)
    expect(editFrame().contentDocument).toBe(edit.doc)

    // Separately: a write while View is shown leaves Edit only STALE (same
    // address, newer content behind it). It is not primed — not at write time,
    // and not when the reloaded View arrives and priming runs again.
    modeButton('view').click()
    await tick()
    clearNavs()
    app.panel.reloadDocument()
    await arrive(viewFrame(), 'draft', 'acme', '', 'View of acme, after the write')
    await tick()
    expect(navsOf(editFrame())).toEqual([])
    expect(envLoads.get(editFrame()) ?? 0).toBe(0)

    // It re-renders when it is next shown.
    modeButton('edit').click()
    expect(navsOf(editFrame())).toEqual([previewUrl('acme', 'edit')])
  })

  it('test_UAT_AC2520_a_revealed_document_is_announced_and_the_edit_loop_and_carry_bind_to_it', async () => {
    const { view, edit } = await mountBothLoaded({
      editBridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
    })
    // The reader is scrolled down the View page.
    scrollTo(view, 640)

    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    modeButton('edit').click()
    await tick()

    // Exactly one announcement, carrying the revealed frame's document, with no
    // load behind it.
    expect(seen).toEqual([edit.doc])
    expect(envLoads.get(editFrame()) ?? 0).toBe(0)
    expect(navsOf(editFrame())).toEqual([])

    // The carried state was applied to the revealed page: the View offset.
    expect(edit.scrolled.at(-1)).toBe(640)

    // The edit loop is bound to the document now on screen: a segment there
    // answers the editing gesture's hover.
    const segment = edit.doc.querySelector(`[${L1_EDIT_SEGMENT_ATTR}]`) as HTMLElement
    expect(segment).not.toBeNull()
    segment.dispatchEvent(new edit.win.Event('pointerover', { bubbles: true }))
    expect(edit.doc.querySelector(`.${L1_EDIT_HOT_CLASS}`)).not.toBeNull()

    // A load in a frame that is not shown is not announced.
    seen.length = 0
    await arrive(viewFrame(), 'draft', 'acme', '', 'View of acme, re-primed')
    expect(seen).toEqual([])

    // Back to View: announced again, and the carried offset lands there too.
    scrollTo(edit, 300)
    const back = showing.get(viewFrame()) as Loaded
    modeButton('view').click()
    expect(seen).toEqual([back.doc])
    expect(back.scrolled.at(-1)).toBe(300)
  })

  it('test_UAT_AC2521_a_palette_change_reloads_the_shown_page_in_place_and_stales_the_others', async () => {
    const palette = paletteOrigin()
    const { view, edit } = await mountBothLoaded({ paletteTransport: palette.transport })
    expect(shown()).toBe(viewFrame())

    // The operator changes a colour through the toolbar's Colors popup.
    const colors = app.toolbar.get('colors') as HTMLElement
    expect(colors).not.toBeNull()
    colors.click()
    const popup = await dialogWith('.builder-palette__list')
    await pickEntry(popup, 'primary')
    const hex = popup.querySelector('.builder-palette__hex-text') as HTMLInputElement
    hex.value = '#123456'
    hex.dispatchEvent(new Event('input', { bubbles: true }))
    buttonIn(popup, 'Change color').click()
    await until(() => palette.writes.length === 1 && view.reloads() > 0, 'the palette write and its reload')

    // The shown document reloads in place: its own window's reload, once, and
    // not a re-pointed `src`.
    expect(view.reloads()).toBe(1)
    expect(navsOf(viewFrame())).toEqual([])
    // The idle channel is not re-rendered at write time.
    expect(edit.reloads()).toBe(0)
    expect(navsOf(editFrame())).toEqual([])
    expect(envLoads.get(editFrame()) ?? 0).toBe(0)

    buttonIn(popup, 'Close').click()
    await until(() => !popup.isConnected, 'the popup to close')

    // The reload arrives; still nothing for the idle channel (it is stale, not
    // pointed elsewhere, so it is not primed).
    await arrive(viewFrame(), 'draft', 'acme', '', 'View of acme, after the write')
    await tick()
    expect(navsOf(editFrame())).toEqual([])

    // Flipping to Edit fetches rather than revealing the pre-write document:
    // a navigation, and no announcement of the old document.
    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    modeButton('edit').click()
    expect(navsOf(editFrame())).toEqual([previewUrl('acme', 'edit')])
    expect(seen).not.toContain(edit.doc)
    expect(seen).toEqual([])
    const fresh = await arrive(editFrame(), 'edit', 'acme', '', 'Edit of acme, after the write')
    expect(seen).toEqual([fresh.doc])
  })

  it('test_UAT_AC2521_a_segment_save_reloads_the_shown_page_in_place_and_stales_the_others', async () => {
    const palette = paletteOrigin()
    const { view, edit } = await mountBothLoaded({
      editBridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      paletteTransport: palette.transport,
    })
    // The edit render names its page, as the origin's does, so a segment has an
    // address to save against.
    edit.doc.body.setAttribute(L1_EDIT_PAGE_ATTR, 'home')

    // The operator is editing: Edit is shown, View is the idle channel.
    modeButton('edit').click()
    await tick()
    expect(shown()).toBe(editFrame())
    clearNavs()

    const copy = copyOrigin()
    try {
      // Click a segment on the page on screen, stage a colour, and Save.
      const segment = edit.doc.querySelector(`[${L1_EDIT_SEGMENT_ATTR}]`) as HTMLElement
      expect(segment).not.toBeNull()
      segment.dispatchEvent(new edit.win.MouseEvent('click', { bubbles: true, cancelable: true }))
      const modal = await dialogWith('.builder-color__swatch')
      ;(modal.querySelector('.builder-color__swatch') as HTMLButtonElement).click()
      const picker = await dialogWith('.builder-palette__list')
      await pickEntry(picker, 'primary')
      buttonIn(picker, 'Use this color').click()
      await until(() => !picker.isConnected, 'the colour picker to answer')
      await tick()
      buttonIn(modal, 'Save').click()
      await until(() => copy.posts.length === 1 && edit.reloads() > 0, 'the save and its reload')
      await until(() => !modal.isConnected, 'the segment modal to close')
    } finally {
      copy.restore()
    }

    // The shown document (Edit) reloads in place, once.
    expect(edit.reloads()).toBe(1)
    expect(navsOf(editFrame())).toEqual([])
    // The idle channel is not re-rendered at write time…
    expect(view.reloads()).toBe(0)
    expect(navsOf(viewFrame())).toEqual([])
    expect(envLoads.get(viewFrame()) ?? 0).toBe(0)

    // …but it is out of date: the next flip to it fetches rather than revealing
    // the pre-write page. Read before any await.
    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    modeButton('view').click()
    expect(navsOf(viewFrame())).toEqual([previewUrl('acme', 'draft')])
    expect(seen).not.toContain(view.doc)
  })

  it('test_UAT_AC2521_an_assistant_change_reloads_the_linked_page_in_place_and_stales_the_others', async () => {
    const { view } = await mountBothLoaded({
      chatTransport: {
        openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
        streamPrompt: async function* () {
          yield { kind: 'tool_activity', content: 'tool_call set_copy', meta: { name: 'set_copy' } }
          yield { kind: 'site_changed', content: '', meta: { at: 1, changes: 1 } }
          yield { kind: 'text', content: 'Done.' }
          yield { kind: 'done' }
        },
      },
    })
    expect(shown()).toBe(viewFrame())

    // The reader follows a link inside View; Edit is primed at that page behind
    // it and arrives there.
    const linked = await arrive(viewFrame(), 'draft', 'acme', 'contact', 'Contact page')
    // The pane never re-pointed the frame; the document moved by itself.
    expect(viewFrame().getAttribute('src')).toBe(previewUrl('acme', 'draft'))
    const linkedEdit = await arrive(editFrame(), 'edit', 'acme', 'contact', 'Edit of contact')
    await tick()
    clearNavs()

    // The assistant writes the site in a turn.
    await until(() => app.chat.getChat() !== null, 'the assistant session')
    await (app.chat.getChat() as { send(text: string): Promise<unknown> }).send('Make the headline bigger.')
    await tick()

    // The reload is the linked document's own, so it reloads the linked page —
    // not the page the mode first opened — and the page that was left is not.
    expect(linked.reloads()).toBe(1)
    expect(view.reloads()).toBe(0)
    expect(new URL(linked.win.location.href).pathname).toBe(
      new URL(previewUrl('acme', 'draft', 'contact'), window.location.origin).pathname,
    )
    expect(navsOf(viewFrame())).toEqual([])
    // The idle channel is not re-rendered at write time…
    expect(linkedEdit.reloads()).toBe(0)
    expect(navsOf(editFrame())).toEqual([])

    // …and the next flip to it fetches the same page, newer, rather than
    // revealing the pre-write one. Read before any await.
    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    modeButton('edit').click()
    expect(navsOf(editFrame())).toEqual([previewUrl('acme', 'edit', 'contact')])
    expect(seen).not.toContain(linkedEdit.doc)
  })

  it('test_UAT_AC2522_a_change_of_site_or_a_refresh_invalidates_every_channel', async () => {
    const { edit } = await mountBothLoaded()
    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))

    // A change of site: the shown frame navigates at once to the new site.
    app.panel.setSite('other')
    expect(navsOf(viewFrame())).toEqual([previewUrl('other', 'draft')])

    // Flip before anything has arrived: the idle channel is re-fetched for the
    // new site rather than revealing acme's edit document.
    modeButton('edit').click()
    expect(navsOf(editFrame())).toEqual([previewUrl('other', 'edit')])
    expect(seen).not.toContain(edit.doc)
    const otherEdit = await arrive(editFrame(), 'edit', 'other', '', 'Edit of other')
    expect(seen).toEqual([otherEdit.doc])

    // Once the shown frame has loaded, an idle frame pointing at a different
    // address is primed in the usual way.
    const otherView = await arrive(viewFrame(), 'draft', 'other', '', 'View of other')
    clearNavs()
    // Edit is shown; View now holds other's page, delivered behind it.
    modeButton('view').click()
    expect(navsOf(viewFrame())).toEqual([])
    expect(viewFrame().contentDocument).toBe(otherView.doc)
    expect(viewFrame().getAttribute('src')).toContain('/other/')

    // An explicit refresh with the slug unchanged (as a business switch makes):
    // every channel is re-fetched before it is shown.
    await arrive(editFrame(), 'edit', 'other', '', 'Edit of other, settled')
    await tick()
    clearNavs()
    seen.length = 0
    app.panel.refresh()
    expect(navsOf(viewFrame())).toEqual([previewUrl('other', 'draft')])
    expect(seen).toEqual([])
    modeButton('edit').click()
    expect(navsOf(editFrame())).toEqual([previewUrl('other', 'edit')])
    expect(seen).toEqual([])
  })

  it('test_UAT_AC2522_after_a_change_of_site_the_idle_channel_is_primed_behind_the_loaded_frame', async () => {
    const { edit } = await mountBothLoaded()
    expect(shown()).toBe(viewFrame())

    // A change of site while View is shown: View navigates to the new site,
    // and Edit is not touched yet — the page in front of the operator first.
    app.panel.setSite('other')
    expect(navsOf(viewFrame())).toEqual([previewUrl('other', 'draft')])
    expect(navsOf(editFrame())).toEqual([])
    clearNavs()

    // View's new-site document arrives. Before any flip, the idle Edit frame —
    // still holding acme's edit page, a different address — is primed at
    // other's edit page behind it.
    // Asserted on the attribute as well as the write: the prime runs inside the
    // load `arrive` dispatches.
    expect(editFrame().getAttribute('src')).toBe(previewUrl('acme', 'edit'))
    await arrive(viewFrame(), 'draft', 'other', '', 'View of other')
    expect(shown()).toBe(viewFrame())
    expect(editFrame().getAttribute('src')).toBe(previewUrl('other', 'edit'))
    expect(viewFrame().getAttribute('src')).toBe(previewUrl('other', 'draft'))

    // The primed document arrives while hidden; the flip then reveals it in
    // place, holding other's edit document and never acme's.
    const otherEdit = await arrive(editFrame(), 'edit', 'other', '', 'Edit of other')
    await tick()
    clearNavs()
    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    modeButton('edit').click()
    expect(navsOf(editFrame())).toEqual([])
    await tick()
    expect(shown()).toBe(editFrame())
    expect(envLoads.get(editFrame()) ?? 0).toBe(0)
    expect(editFrame().contentDocument).toBe(otherEdit.doc)
    expect(editFrame().contentDocument).not.toBe(edit.doc)
    expect(seen).toEqual([otherEdit.doc])
    expect(app.panel.getSrc()).toBe(previewUrl('other', 'edit'))
  })
})
