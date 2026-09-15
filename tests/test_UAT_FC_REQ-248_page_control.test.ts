// @vitest-environment jsdom
/**
 * [[REQ-248]] UATs — **the page control**, in the real builder chrome.
 *
 * Moving between pages means clicking a link inside the render, so a page
 * nothing links to could not be opened at all: it appeared in no list and could
 * be clicked from nowhere. This control is the way to those pages, and the place
 * that says which they are.
 *
 * Driven against the ACTUAL composition — `mountBuilder`, the real panel, the
 * real toolbar — for the reason every other builder suite is: the property under
 * test is which controls a MODE declares and what they do to the pane, and a
 * stand-in strip would assert that of itself. Only the listing is injected, the
 * way every other transport in this file's neighbours is.
 *
 * WHAT `jsdom` CANNOT DO, AND WHERE THAT IS HANDLED. An iframe here never
 * navigates: its window stays on `about:blank`, and neither `location` nor
 * `history.replaceState` can be moved on it. So "the reader followed a link
 * inside the render" — the one case where the document and the pane's own URL
 * legitimately disagree — is driven in the second block below, against the real
 * `createPageIndex` and a real `jsdom` window at a real preview URL. That is
 * patching the browser, not the subject.
 *
 * Acceptance covered:
 *
 *   AC-1  every page can be opened from the control, including an unlinked one
 *   AC-2  an unreachable page is named as such; a reachable one is not marked
 *   AC-3  choosing a page shows it in View and in Edit alike, keeping the mode
 *   AC-4  following a link inside the render moves the control
 *   AC-5  the control and the render never disagree, including about a page the
 *         listing no longer holds
 *   AC-6  a page added while the tab is open can be chosen without a reload
 *   AC-7  a site with one page still shows the control, naming that page
 *   AC-8  a page with no title is listed by something recognisable
 *   AC-14 choosing a page names it immediately and keeps naming it until it arrives
 *   AC-15 the control sits in the same position in View and in Edit
 */
import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { previewUrl, setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { createDisplayPanel } from '../apps/control-app/src/builder/panel.js'
import { createPageIndex } from '../apps/control-app/src/builder/pages.js'
import { createToolbar, pagesAction } from '../apps/control-app/src/builder/toolbar.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ site: 'acme', latest: null }]

interface Row {
  id: string
  slug: string
  title: string
  reachable: boolean
}

const THREE: Row[] = [
  { id: 'home', slug: 'home', title: 'Home', reachable: true },
  { id: 'about', slug: 'about', title: 'About us', reachable: true },
  // The page this whole feature exists for: nothing points at it, so before
  // this control there was no way to open it and no way to be told it was there.
  { id: 'terms', slug: 'terms', title: 'Terms', reachable: false },
]

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

/** Let the listing's promise settle and the control redraw from it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

/** `app.js` imports the webui components by bare specifier — hence the dynamic load. */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => { destroy?: () => void }

if (!WEBUI_INSTALLED) console.warn(`REQ-248 page-control suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-248 — the page control', () => {
  let root: HTMLElement
  /** What the next listing answers with; a test moves it to add a page. */
  let listing: Row[]

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    setBusinessScope(null)
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    listing = THREE
  })

  const mount = () =>
    mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      pageState,
      pagesTransport: { list: async () => ({ pages: listing }) },
    })

  const panelOf = () => root.querySelector('.builder-panel') as HTMLElement
  const frameOf = () => panelOf().querySelector('.builder-panel__frame') as HTMLIFrameElement
  const controlOf = () => root.querySelector('[data-action="pages"]') as HTMLElement | null
  const selectOf = () => controlOf()?.querySelector('select') as HTMLSelectElement
  const optionsOf = () => [...selectOf().options].map((o) => [o.value, o.text])
  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement

  const choose = (slug: string): void => {
    const select = selectOf()
    select.value = slug
    select.dispatchEvent(new Event('change'))
  }

  it('test_UAT_FC_REQ-248_lists_every_page_and_says_which_one_is_unreachable', async () => {
    mount()
    await settled()
    expect(optionsOf()).toEqual([
      ['home', 'Home'],
      ['about', 'About us'],
      // AC-2 — the mark is in the row's own text, because it is the point of the
      // control rather than a decoration on it.
      ['terms', 'Terms — unreachable'],
    ])
    // AC-1 — and it is selectable like any other, which is the only way anyone
    // can reach it at all.
    choose('terms')
    expect(frameOf().getAttribute('src')).toBe('/preview/acme/draft/terms')
  })

  it('test_UAT_FC_REQ-248_the_control_is_offered_in_view_and_in_edit_alike', async () => {
    /** Where in the strip a control sits, counted among the controls themselves. */
    const positionOf = (id: string): number => {
      const strip = root.querySelector('.builder-toolbar') as HTMLElement
      return [...strip.querySelectorAll('[data-action]')].findIndex(
        (el) => (el as HTMLElement).dataset.action === id,
      )
    }

    mount()
    await settled()
    expect(controlOf()).not.toBeNull()
    const inView = positionOf('pages')
    expect(inView).toBeGreaterThanOrEqual(0)

    modeButton('edit').click()
    await settled()
    expect(controlOf()).not.toBeNull()
    // AC-15 — the SAME position in both, so flipping channel does not move the
    // control out from under the pointer that just used it. Edit declares more
    // controls than View, so this is a claim about where `pages` sits among
    // them rather than about the strip being identical.
    expect(positionOf('pages')).toBe(inView)
  })

  it('test_UAT_FC_REQ-248_choosing_a_page_keeps_the_channel_it_was_chosen_in', async () => {
    mount()
    modeButton('edit').click()
    await settled()
    choose('about')
    // AC-3 — the edit render of the chosen page. Which page is shown and which
    // channel shows it are independent questions; this answers only one.
    expect(frameOf().getAttribute('src')).toBe('/preview/acme/edit/about')
    expect(modeButton('edit').getAttribute('aria-pressed')).toBe('true')
    // The same choice made in View moves the View render, and nothing else.
    // (That the TOGGLE keeps the page across a channel switch is [[REQ-215]]'s
    // own claim, carried by the document's location — which `jsdom` will not
    // move, so it is asserted in that suite rather than restated badly here.)
  })

  it('test_UAT_FC_REQ-248_the_control_names_the_page_the_pane_is_showing', async () => {
    mount()
    await settled()
    // AC-5 — it opens naming the page the pane actually opened on, rather than
    // the first row or nothing.
    expect(selectOf().value).toBe('home')
    choose('about')
    expect(selectOf().value).toBe('about')
  })

  it('test_UAT_FC_REQ-248_a_page_added_while_the_tab_is_open_can_be_chosen', async () => {
    mount()
    await settled()
    expect(optionsOf().map(([value]) => value)).not.toContain('offer')

    // The assistant adds a page; its write reloads the render, which is when the
    // listing is re-read — AC-6, without a reload of the builder itself.
    listing = [...THREE, { id: 'offer', slug: 'offer', title: 'Spring offer', reachable: false }]
    frameOf().dispatchEvent(new Event('load'))
    await settled()

    expect(optionsOf()).toContainEqual(['offer', 'Spring offer — unreachable'])
    choose('offer')
    expect(frameOf().getAttribute('src')).toBe('/preview/acme/draft/offer')
  })

  it('test_UAT_FC_REQ-248_a_one_page_site_still_shows_the_control', async () => {
    listing = [{ id: 'home', slug: 'home', title: 'Home', reachable: true }]
    mount()
    await settled()
    // AC-7 — it answers *where am I* as well as *where else could I be*, and a
    // control that vanished here would answer neither.
    expect((controlOf() as HTMLElement).hidden).toBe(false)
    expect(optionsOf()).toEqual([['home', 'Home']])
  })

  it('test_UAT_FC_REQ-248_an_untitled_page_is_listed_by_something_recognisable', async () => {
    listing = [
      { id: 'home', slug: 'home', title: 'Home', reachable: true },
      { id: 'p2', slug: 'thank-you', title: '', reachable: false },
    ]
    mount()
    await settled()
    // AC-8 — an empty row is a row nobody can choose on purpose.
    expect(optionsOf()).toContainEqual(['thank-you', 'thank-you — unreachable'])
  })
})

/**
 * The two cases the pane's own URL cannot answer: the reader moved the document
 * themselves, and the page it is on is not in the listing any more.
 *
 * REAL MODULES THROUGHOUT — the real panel, the real toolbar, the real page
 * index. The single substitution is which window the pane's frame holds, because
 * `jsdom` will not navigate an iframe and that is the browser's job rather than
 * this feature's.
 */
describe('REQ-248 — the control follows the document, not the URL the pane asked for', () => {
  beforeEach(() => setBusinessScope(null))

  /** A document loaded at a real preview URL, as a navigated frame holds one. */
  const documentAt = (rel: string): Window =>
    new JSDOM('<!doctype html><html><body><p>a page</p></body></html>', {
      url: `https://app.example${previewUrl('acme', 'draft', rel)}`,
    }).window as unknown as Window

  /** The chrome, with the pane holding `win` rather than an iframe jsdom won't move. */
  const chrome = (win: Window, rows: Row[]) => {
    const panel = createDisplayPanel({ site: 'acme' })
    panel.registerMode({
      id: 'view',
      label: 'View',
      src: ({ site }: { site: string }) => previewUrl(site, 'draft', ''),
      actions: ['pages'],
    })
    Object.defineProperty(panel, 'frame', {
      get: () => ({ contentWindow: win }),
      configurable: true,
    })
    const pages = createPageIndex({
      panel,
      getSite: () => 'acme',
      list: async () => ({ pages: rows }),
    })
    const toolbar = createToolbar({
      panel,
      context: { getSite: () => 'acme' },
      actions: [pagesAction(pages)],
    })
    // Where a toolbar lives. The strip is emptied when its controls are
    // disposed, and a listing arriving for a control that has been thrown away
    // is deliberately dropped — so a strip nobody mounted would never redraw.
    document.body.append(toolbar.element)
    return { panel, pages, toolbar }
  }

  const selectIn = (toolbar: { get: (id: string) => HTMLElement | null }) =>
    toolbar.get('pages')?.querySelector('select') as HTMLSelectElement

  it('test_UAT_FC_REQ-248_following_a_link_in_the_render_moves_the_control', async () => {
    // The pane was asked for the channel's front door; the reader is on /about.
    const { toolbar, panel } = chrome(documentAt('about'), THREE)
    await settled()
    expect(panel.getSrc()).toBe('/preview/acme/draft/')
    // AC-4 — the document is what the operator is looking at, so it wins.
    expect(selectIn(toolbar).value).toBe('about')
  })

  it('test_UAT_FC_REQ-248_a_page_the_listing_no_longer_holds_is_still_named', async () => {
    // Deleted or renamed since the listing was taken — and still on screen.
    const { toolbar } = chrome(documentAt('gone'), THREE)
    await settled()
    // AC-5 — the control must never quietly name a page other than the one the
    // render is showing.
    expect(selectIn(toolbar).value).toBe('gone')
    expect([...selectIn(toolbar).options].map((o) => o.value)).toEqual([
      'gone',
      'home',
      'about',
      'terms',
    ])
  })

  it('test_UAT_FC_REQ-248_the_control_keeps_the_choice_while_the_page_loads', async () => {
    // The document is still the page being left for as long as the navigation
    // takes — so a control reading only the document would answer the chooser
    // with the page they just chose to leave and correct itself a moment later.
    const { toolbar, pages } = chrome(documentAt(''), THREE)
    await settled()
    const select = selectIn(toolbar)
    select.value = 'terms'
    select.dispatchEvent(new Event('change'))
    // AC-5 — it never contradicts the operator, not even for a frame.
    expect(selectIn(toolbar).value).toBe('terms')
    // …and the document takes the answer back the instant there is one.
    pages.arrived()
    expect(pages.current()).toBe('home')
  })

  it('test_UAT_FC_REQ-248_the_channel_root_names_the_page_it_serves', async () => {
    const { toolbar } = chrome(documentAt(''), THREE)
    await settled()
    // `/` and `index.html` are the home page's own aliases, so the control names
    // the page the renderer would serve rather than an empty row.
    expect(selectIn(toolbar).value).toBe('home')
  })
})
