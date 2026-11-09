// @vitest-environment jsdom
/**
 * story-e674c60a, plan item 6 (REQ-215, the builder half). **View and Edit
 * behave as one page with a toggle**, tested in the mounted workspace.
 *
 * Each criterion is tested against the ACTUAL composition: `mountBuilder`, the
 * real display panel, the real toolbar, and the real `carry.js`, all fed the
 * real `packages/framework` page-state module. A carry driven on its own would
 * only show that the module can keep state. It would not show that the
 * workspace calls it at the moments the criteria name (before the pane
 * re-derives its source, and on every document that arrives).
 *
 * THE FRAME'S DOCUMENTS ARE REAL RENDERS. jsdom never fetches an iframe `src`,
 * so each arrival is played the way a browser delivers it. The real
 * `renderL1Document` output for that channel becomes a document at the preview
 * address the pane displays it at, with its own script running. The frame
 * shows that document until the next one arrives, and fires `load` once per
 * arrival. In View a panel is opened by clicking the page's own opener, as a
 * reader would.
 *
 * Those are patches to the BROWSER, never to the subject. jsdom swaps a blank
 * window into a frame the instant its `src` changes, and fires a `load` for
 * it. A browser does neither: the outgoing document stays until the next one
 * commits. jsdom also implements neither `scrollY` nor `scrollTo`, so the
 * offset is defined on the window and the calls are recorded.
 */
import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Channel = 'draft' | 'edit'

const SITES = [
  { slug: 'acme', latest: null },
  { slug: 'beta', latest: null },
]

const l1 = (root: L1Node): L1Document => ({ widths: [320, 768, 1440], root })

/** A page with one L1 panel and the opener that a reader clicks. */
const signInPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'signin-link', text: 'Sign in', action: { opens: 'signin-panel' } },
    { kind: 'text', text: 'A long page body the reader scrolls down.' },
    {
      kind: 'container',
      id: 'signin-panel',
      layout: 'stack',
      dialog: { backdrop: { color: '#000000', opacity: 0.5 } },
      axes: { surfaceFill: '#ffffff' },
      children: [{ kind: 'text', text: 'Please enter your email address' }],
    },
  ],
})

/** A page with no panel at all. */
const plainPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [{ kind: 'text', text: 'Nothing to open here.' }],
})

/** Longer than the selector's 40-character cut. */
const HOURS = 'We are open every weekday from nine until half past five'

/**
 * Two panels named by different means. One carries an accessible name. The
 * other carries only a long sentence, to check the 40-character cut.
 */
const twoPanelPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', text: 'Welcome' },
    {
      kind: 'container',
      id: 'newsletter-panel',
      layout: 'stack',
      dialog: { ariaLabel: 'Join our newsletter' },
      axes: { surfaceFill: '#ffffff' },
      children: [{ kind: 'text', text: 'Get our monthly letter' }],
    },
    {
      kind: 'container',
      id: 'hours-panel',
      layout: 'stack',
      dialog: {},
      axes: { surfaceFill: '#ffffff' },
      children: [{ kind: 'text', text: HOURS }],
    },
  ],
})

/**
 * A panel named only by its heading.
 *
 * An L1 text node never emits a heading element, so this shell is written in
 * the exact shape the renderer gives every dialog: a `data-l1-dialog` shell
 * whose first child is the panel. Another author of a page (a captured site, a
 * module) can still put a heading there, and the selector reads the document,
 * not the definition.
 */
const HEADING_PANEL =
  '<div data-l1-dialog="faq-panel"><div><h2>Frequently asked</h2><p>Answers to the questions customers ask most.</p></div></div>'

/**
 * A panel whose first written words come BEFORE its heading. The heading still
 * names it: the rule is "a heading, else the first words", not "whatever is
 * written first". A selector that dropped the heading rule would name this one
 * by its paragraph.
 */
const HEADING_AFTER_TEXT_PANEL =
  '<div data-l1-dialog="returns-panel"><div><p>We accept returns within thirty days of purchase.</p><h2>Returns</h2></div></div>'

/** A panel with no name and nothing written in it: only then is its id the label. */
const EMPTY_PANEL = '<div data-l1-dialog="blank-panel"><div></div></div>'

/** Every panel the selector test adds after the L1 panels, in document order. */
const EXTRA_PANELS = HEADING_PANEL + HEADING_AFTER_TEXT_PANEL + EMPTY_PANEL

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
}

interface Panel {
  frame: HTMLIFrameElement
  getSrc(): string
  getSite(): string | null
  setSite(slug: string): void
}

/** `app.js` imports the webui components by bare specifier, hence the dynamic load. */
let mountBuilder: (
  root: HTMLElement,
  opts?: Record<string, unknown>,
) => { panel: Panel; destroy?: () => void }
let previewUrl: (slug: string, channel: string, rel?: string) => string

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a page-carry suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the page carried across a channel switch', () => {
  let root: HTMLElement
  let app: { panel: Panel; destroy?: () => void }
  /** True only while `arrive` is firing the frame's `load`. */
  let delivering = false
  /** The document the frame is showing. */
  let showing: Loaded | null = null

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ previewUrl } = (await import('../apps/control-app/src/builder/api.js')) as {
      previewUrl: typeof previewUrl
    })
    app?.destroy?.()
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    // A browser fires the frame's `load` once, for the document that arrives.
    // jsdom also fires one for the blank window it puts in place when the `src`
    // changes. Stopped here in the capture phase, on an ancestor, before any
    // listener on the frame sees it. Only the documents `arrive` delivers load.
    root.addEventListener(
      'load',
      (ev) => {
        if (ev.target instanceof HTMLIFrameElement && !delivering) ev.stopImmediatePropagation()
      },
      true,
    )
    app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), pageState })
    // The frame shows the document most recently delivered to it, and keeps
    // showing it while the next one is on its way, as a browser's frame does.
    // jsdom swaps in a blank window the instant `src` changes, so the toolbar
    // the mode switch rebuilds would read an empty page that a browser never
    // shows.
    showing = null
    Object.defineProperty(app.panel.frame, 'contentWindow', {
      configurable: true,
      get: () => showing?.win ?? null,
    })
    Object.defineProperty(app.panel.frame, 'contentDocument', {
      configurable: true,
      get: () => showing?.doc ?? null,
    })
  })

  const frame = () => app.panel.frame
  const selector = () => root.querySelector('[data-action="panels"]') as HTMLElement | null
  const select = () => selector()?.querySelector('select') as HTMLSelectElement
  const modeButton = (id: string) =>
    root.querySelector(
      `.builder-toolbar__modes button[data-mode="${id}"]`,
    ) as HTMLButtonElement

  /**
   * Deliver a document to the frame as a browser would. The channel's real
   * render becomes a real document at the address the pane displays it at, with
   * its own script running. The frame then shows it, and the frame's `load` is
   * fired. `extra` is appended to the body verbatim.
   *
   * `load` waits for parsing to finish, as a browser's does: the draft render's
   * script wires its openers on `DOMContentLoaded`. The wait is bounded, so a
   * document still loading fails the test here rather than hanging it.
   */
  async function arrive(
    channel: Channel,
    site: string,
    rel: string,
    page: L1Node,
    extra = '',
    /** Where the browser delivered the document scrolled to. */
    at = 0,
  ): Promise<Loaded> {
    const { html, css } = renderL1Document(l1(page), { edit: channel === 'edit' })
    const dom = new JSDOM(
      `<!doctype html><html><head><style>${css}</style></head>` +
        `${channel === 'edit' ? '<body data-fc-edit>' : '<body>'}${html}${extra}</body></html>`,
      {
        runScripts: 'dangerously',
        url: new URL(previewUrl(site, channel, rel), window.location.origin).href,
      },
    )
    const d = dom.window.document
    for (let i = 0; i < 50 && d.readyState === 'loading'; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    expect(d.readyState).not.toBe('loading')
    const win = dom.window as unknown as Window
    Object.defineProperty(win, 'scrollY', { value: at, configurable: true })
    const scrolled: number[] = []
    win.scrollTo = ((_x: number, y: number) => void scrolled.push(y)) as Window['scrollTo']
    showing = { win, doc: d, scrolled }
    delivering = true
    try {
      frame().dispatchEvent(new Event('load'))
    } finally {
      delivering = false
    }
    return showing
  }

  /** The reader scrolls the page to this offset. */
  const scrollTo = (loaded: Loaded, offset: number) =>
    Object.defineProperty(loaded.win, 'scrollY', { value: offset, configurable: true })

  /** A reader's click on a control inside the frame's document. */
  const click = (loaded: Loaded, id: string) =>
    (loaded.doc.getElementById(id) as HTMLElement).click()

  const openPanels = (loaded: Loaded): string[] =>
    [...loaded.doc.querySelectorAll('[data-l1-dialog][data-l1-open]')].map(
      (s) => s.getAttribute('data-l1-dialog') ?? '',
    )

  /** The operator picks an entry in the toolbar's panel selector. */
  const pick = (value: string) => {
    select().value = value
    select().dispatchEvent(new Event('change'))
  }

  /** What the pane is asking the frame to show. */
  const displayed = () => frame().getAttribute('src')

  it('test_UAT_AC2496_switching_view_and_edit_keeps_the_page_and_the_scroll_offset', async () => {
    // In View, the reader is on the long non-home page and scrolled down it.
    expect(displayed()).toBe(previewUrl('acme', 'draft'))
    const view = await arrive('draft', 'acme', 'about', signInPage())
    scrollTo(view, 640)

    // To Edit: the same page in the edit channel, at the same offset.
    modeButton('edit').click()
    expect(displayed()).toBe(previewUrl('acme', 'edit', 'about'))
    const edit = await arrive('edit', 'acme', 'about', signInPage())
    expect(edit.scrolled).toEqual([640])

    // A different offset in Edit, and back to View: the ordinary channel, the
    // same page, the new offset.
    scrollTo(edit, 300)
    modeButton('view').click()
    expect(displayed()).toBe(previewUrl('acme', 'draft', 'about'))
    const back = await arrive('draft', 'acme', 'about', signInPage())
    expect(back.scrolled).toEqual([300])

    // The rendered documents ship nothing to make this happen. The edit render
    // stays inert.
    expect(edit.doc.querySelectorAll('script')).toHaveLength(0)
  })

  it('test_UAT_AC2497_a_panel_open_in_view_shows_in_edit_and_survives_the_post_save_reload', async () => {
    const view = await arrive('draft', 'acme', '', signInPage())
    // Opened through the page's own opener, as a reader opens it.
    click(view, 'signin-link')
    expect(openPanels(view)).toEqual(['signin-panel'])

    modeButton('edit').click()
    const edit = await arrive('edit', 'acme', '', signInPage())
    expect(openPanels(edit)).toEqual(['signin-panel'])
    // Laid over the page, as in View, and its copy can be edited like any other
    // copy on the page.
    const shell = edit.doc.querySelector('[data-l1-dialog="signin-panel"]') as HTMLElement
    expect(edit.win.getComputedStyle(shell).position).toBe('fixed')
    expect(
      (edit.doc.getElementById('signin-panel') as HTMLElement).querySelector(
        '[data-l1-segment="copy"]',
      ),
    ).not.toBeNull()

    // A save re-renders the page and reloads the frame on the same address.
    // The reloaded document arrives with the panel still open.
    const reloaded = await arrive('edit', 'acme', '', signInPage())
    expect(openPanels(reloaded)).toEqual(['signin-panel'])

    // Back in View the panel is open in the ordinary channel. The page's own
    // script opened it, so the opener reports it.
    modeButton('view').click()
    const back = await arrive('draft', 'acme', '', signInPage())
    expect(openPanels(back)).toEqual(['signin-panel'])
    expect(back.doc.getElementById('signin-link')?.getAttribute('aria-expanded')).toBe('true')
  })

  it('test_UAT_AC2498_switching_site_or_following_a_link_drops_the_carried_state', async () => {
    // A panel open and the page scrolled, on a page within the first site.
    const view = await arrive('draft', 'acme', 'about', signInPage())
    click(view, 'signin-link')
    expect(openPanels(view)).toEqual(['signin-panel'])
    scrollTo(view, 640)

    // A different site: that site's channel root, at the top, with no panel.
    app.panel.setSite('beta')
    expect(displayed()).toBe(previewUrl('beta', 'draft'))
    const other = await arrive('draft', 'beta', '', signInPage(), '', 900)
    expect(openPanels(other)).toEqual([])
    expect(other.scrolled).toEqual([0])

    // Returning restores nothing from before: the first site's root, not its
    // `about` page, and no panel.
    app.panel.setSite('acme')
    expect(displayed()).toBe(previewUrl('acme', 'draft'))
    const returned = await arrive('draft', 'acme', '', signInPage())
    expect(openPanels(returned)).toEqual([])
    expect(returned.scrolled).toEqual([])

    // Separately: a link out of an open panel to another page of the same site.
    // The frame navigates by itself (the pane re-derives nothing). The arriving
    // page has no panel and starts at the top, even though the browser
    // delivered it scrolled.
    click(returned, 'signin-link')
    expect(openPanels(returned)).toEqual(['signin-panel'])
    scrollTo(returned, 500)
    const elsewhere = await arrive('draft', 'acme', 'contact', signInPage(), '', 900)
    expect(openPanels(elsewhere)).toEqual([])
    expect(elsewhere.scrolled).toEqual([0])

    // Edit shows that new page, also with no panel open.
    modeButton('edit').click()
    expect(displayed()).toBe(previewUrl('acme', 'edit', 'contact'))
    const edit = await arrive('edit', 'acme', 'contact', signInPage())
    expect(openPanels(edit)).toEqual([])
  })

  it('test_UAT_AC2499_edit_alone_offers_a_panel_selector_named_by_text_applied_without_reload', async () => {
    // View: no selector in the strip at all.
    await arrive('draft', 'acme', '', twoPanelPage(), EXTRA_PANELS)
    expect(selector()).toBeNull()

    modeButton('edit').click()
    const edit = await arrive('edit', 'acme', '', twoPanelPage(), EXTRA_PANELS)
    expect(selector()).not.toBeNull()
    expect((selector() as HTMLElement).hidden).toBe(false)

    // "No panel" first, then each panel named by what is written in it, in this
    // order of preference: its accessible name, else its heading (even when a
    // paragraph comes before the heading), else its first text cut to 40
    // characters. Its id only when nothing is written in it at all.
    expect([...select().options].map((o) => [o.value, o.text])).toEqual([
      ['', 'No panel'],
      ['newsletter-panel', 'Join our newsletter'],
      ['hours-panel', `${HOURS.slice(0, 40)}…`],
      ['faq-panel', 'Frequently asked'],
      ['returns-panel', 'Returns'],
      ['blank-panel', 'blank-panel'],
    ])
    // A panel that has any text is never named by its id.
    for (const o of select().options) {
      if (o.value && o.value !== 'blank-panel') expect(o.text).not.toContain(o.value)
    }
    // On arrival the selector shows what is open: nothing.
    expect(select().value).toBe('')

    // A pick shows the panel over the page already loaded. The frame does not
    // reload, so its document is the same object.
    pick('faq-panel')
    expect(frame().contentDocument).toBe(edit.doc)
    expect(openPanels(edit)).toEqual(['faq-panel'])

    pick('newsletter-panel')
    expect(frame().contentDocument).toBe(edit.doc)
    expect(openPanels(edit)).toEqual(['newsletter-panel'])

    // The pick is carried: it survives the post-save reload, and the selector
    // shows it there.
    const reloaded = await arrive('edit', 'acme', '', twoPanelPage(), EXTRA_PANELS)
    expect(openPanels(reloaded)).toEqual(['newsletter-panel'])
    expect(select().value).toBe('newsletter-panel')

    // "No panel" closes it, again with no reload.
    pick('')
    expect(frame().contentDocument).toBe(reloaded.doc)
    expect(openPanels(reloaded)).toEqual([])

    // A page that no longer declares the carried panel: the selector reads
    // "No panel", and the carried state follows it.
    pick('hours-panel')
    await arrive('edit', 'acme', '', signInPage())
    expect(select().value).toBe('')
    const back = await arrive('edit', 'acme', '', twoPanelPage(), EXTRA_PANELS)
    expect(openPanels(back)).toEqual([])

    // A page that declares no panel: no control is shown, not an empty one.
    await arrive('edit', 'acme', '', plainPage())
    expect((selector() as HTMLElement).hidden).toBe(true)

    // And in View the strip carries no selector.
    modeButton('view').click()
    expect(selector()).toBeNull()
  })

  it('test_UAT_AC1029_the_registered_edit_mode_opens_on_the_page_the_reader_was_on', async () => {
    // The modes used here are the ones the workspace registers. The test
    // registers none.
    expect(modeButton('view')).not.toBeNull()
    expect(modeButton('edit')).not.toBeNull()

    // View, on a page other than home. Edit opens the edit channel at that page.
    await arrive('draft', 'acme', 'about', plainPage())
    modeButton('edit').click()
    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'edit', 'about'))
    expect(app.panel.getSrc()).not.toBe(previewUrl('acme', 'edit'))

    // Back to View: the ordinary channel at that same page, not the root.
    await arrive('edit', 'acme', 'about', plainPage())
    modeButton('view').click()
    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'draft', 'about'))

    // With Edit active, a different site opens that site's edit channel at its
    // root. Another site's page is not this page in another state.
    await arrive('draft', 'acme', 'about', plainPage())
    modeButton('edit').click()
    await arrive('edit', 'acme', 'about', plainPage())
    app.panel.setSite('beta')
    expect(app.panel.getSrc()).toBe(previewUrl('beta', 'edit'))

    // Back to View: the current site's ordinary channel, at the page Edit was
    // showing (its root).
    await arrive('edit', 'beta', '', plainPage())
    modeButton('view').click()
    expect(app.panel.getSrc()).toBe(previewUrl('beta', 'draft'))
  })

  it('test_UAT_AC1036_both_addresses_are_the_channel_root_plus_the_readers_path_encoding_unchanged', async () => {
    // A freshly opened site: the two addresses are the two channel roots.
    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'draft'))
    expect(app.panel.getSrc()).toMatch(/\/preview\/acme\/draft\/$/)
    modeButton('edit').click()
    expect(app.panel.getSrc()).toBe(previewUrl('acme', 'edit'))
    expect(app.panel.getSrc()).toMatch(/\/preview\/acme\/edit\/$/)
    modeButton('view').click()

    // The reader moves to a page whose path holds a percent-encoded character.
    // Both addresses become the channel root plus that same path, encoded once.
    const rel = 'menu/caf%C3%A9'
    await arrive('draft', 'acme', rel, plainPage())
    modeButton('edit').click()
    const editSrc = app.panel.getSrc()
    expect(editSrc).toBe(`${previewUrl('acme', 'edit')}${rel}`)
    expect(editSrc).not.toContain('%25')

    await arrive('edit', 'acme', rel, plainPage())
    modeButton('view').click()
    const viewSrc = app.panel.getSrc()
    expect(viewSrc).toBe(`${previewUrl('acme', 'draft')}${rel}`)
    expect(viewSrc).not.toContain('%25')
    // One grammar: only the channel segment differs between the two.
    expect(viewSrc.replace('/draft/', '/edit/')).toBe(editSrc)
  })
})
