// @vitest-environment jsdom
/**
 * [[BUG-248]] — **the preview refreshes like a page being watched, not reloaded.**
 *
 * Every write used to `location.reload()` whatever page the pane showed: the
 * reader lost their place, the page reloaded while the builder worked on another
 * one, every entrance replayed, and a build's burst of writes redrew the page
 * constantly. Now:
 *
 *   1. the newer page loads in a frame behind the shown one, is scrolled to where
 *      the reader is (their latest position), and is swapped in;
 *   2. only a change to the page on screen — or to something every page renders —
 *      refreshes it; a look is a page of its own;
 *   3. a refresh asks for the page without entrance motion, and "Replay
 *      animations" asks for it with;
 *   4. a burst refreshes at most once per interval, plus once after it.
 *
 * Mounted against the installed `webui-chat`, as the BUG-192 suite is; the feed
 * is injected because it is an `EventSource`. The origin half is
 * `test_UAT_FC_BUG-248_change_scope.workers.test.ts`.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { previewWindow, watchRefreshes, type RefreshWatch } from './support/preview-refresh'

const SITES = [{ site: 'alpha', latest: null }]
const PAGES = [
  { id: 'home', slug: 'home', title: 'Home', reachable: true },
  { id: 'prices', slug: 'prices', title: 'Prices', reachable: true },
  // A look is a page of its own ([[REQ-391]]).
  { id: 'home-heavy-duty', slug: 'home-heavy-duty', title: 'Home — Heavy duty', reachable: false },
]

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-248 preview suite skipped: ${WEBUI_SKIP_REASON}`)

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

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function fakeFeed() {
  let push: (frame: unknown) => void = () => {}
  return {
    push: (frame: unknown) => push(frame),
    transport: {
      subscribe(_site: string, onChange: (frame: unknown) => void) {
        push = onChange
        return { close: () => {} }
      },
    },
  }
}

type App = {
  panel: { frame: HTMLIFrameElement; getMode(): string; setMode(id: string): void }
  toolbar: { get(id: string): HTMLElement | null; ids(): string[] }
  destroy(): void
}

const mount = (root: HTMLElement, feed: ReturnType<typeof fakeFeed>) =>
  mountBuilder(root, {
    sites: SITES,
    storage: memoryStorage(),
    draftTransport: feed.transport,
    pagesTransport: { list: async () => ({ pages: PAGES }) },
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
    },
  }) as unknown as App

/** The page on screen has arrived, at `path`, rendered at change count `at`. */
async function showPage(app: App, opts: Parameters<typeof previewWindow>[0]) {
  const win = previewWindow(opts)
  Object.defineProperty(app.panel.frame, 'contentWindow', { configurable: true, value: win })
  app.panel.frame.dispatchEvent(new Event('load'))
  await settle()
  return win
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) ({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
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
})

let root: HTMLElement
let watch: RefreshWatch | null = null
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})
afterEach(() => {
  watch?.restore()
  watch = null
  vi.useRealTimers()
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-248 — the reader keeps their place', () => {
  it('test_UAT_FC_BUG-248_a_change_swaps_in_the_new_page_at_the_readers_scroll_with_no_blank_frame', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    const shown = app.panel.frame
    await showPage(app, { at: 67, scrollY: 1200 })
    watch = watchRefreshes(app.panel)

    feed.push({ kind: 'draft', at: 68, pages: ['home'], site: false })

    // The newer page is loading BEHIND the one on screen, which stays put.
    expect(watch.asked).toHaveLength(1)
    expect(watch.asked[0].frame).not.toBe(shown)
    expect(watch.asked[0].url).toMatch(/^http:\/\/builder\.test\/preview\/alpha\/draft\/\?still=1$/)
    expect(app.panel.frame).toBe(shown)
    expect(shown.classList.contains('builder-panel__frame')).toBe(true)

    // It arrives: it is scrolled to the reader's place BEFORE it is shown.
    const incoming = previewWindow({ at: 68 })
    const shownWhenScrolled: boolean[] = []
    const scroll = incoming.scrollTo
    incoming.scrollTo = (to) => {
      shownWhenScrolled.push(watch!.asked[0].frame.classList.contains('builder-panel__frame'))
      scroll(to)
    }
    const arrived = watch.arrive(incoming)

    expect(incoming.scrolledTo).toEqual([{ left: 0, top: 1200 }])
    expect(shownWhenScrolled).toEqual([false])
    expect(app.panel.frame).toBe(arrived)
    expect(arrived.classList.contains('builder-panel__frame')).toBe(true)
    expect(shown.classList.contains('builder-panel__frame')).toBe(false)

    app.destroy()
  })

  it('test_UAT_FC_BUG-248_a_scroll_made_while_the_new_page_loads_wins', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    const old = await showPage(app, { at: 67, scrollY: 1200 })
    watch = watchRefreshes(app.panel)

    feed.push({ kind: 'draft', at: 68, pages: ['home'], site: false })
    old.scrollY = 1650
    const incoming = previewWindow({ at: 68 })
    watch.arrive(incoming)

    expect(incoming.scrolledTo).toEqual([{ left: 0, top: 1650 }])

    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-248 — only the page that changed refreshes', () => {
  it('test_UAT_FC_BUG-248_a_change_to_another_page_or_a_look_leaves_the_visible_page_alone', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    await showPage(app, { at: 67 })
    watch = watchRefreshes(app.panel)

    // The builder works on the prices page, and sets up looks for home.
    feed.push({ kind: 'draft', at: 70, pages: ['prices'], site: false })
    feed.push({ kind: 'draft', at: 72, pages: ['home-heavy-duty'], site: false })
    expect(watch.asked).toEqual([])

    // A site-wide style change touches every page, this one included.
    feed.push({ kind: 'draft', at: 73, pages: [], site: true })
    expect(watch.asked).toHaveLength(1)

    app.destroy()
  })

  it('test_UAT_FC_BUG-248_a_change_to_the_real_page_leaves_a_look_being_viewed_alone', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    await showPage(app, { at: 67, path: '/preview/alpha/draft/home-heavy-duty' })
    watch = watchRefreshes(app.panel)

    feed.push({ kind: 'draft', at: 70, pages: ['home'], site: false })
    expect(watch.asked).toEqual([])

    feed.push({ kind: 'draft', at: 71, pages: ['home-heavy-duty'], site: false })
    expect(watch.asked).toHaveLength(1)

    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-248 — no entrances on a refresh', () => {
  it('test_UAT_FC_BUG-248_a_refresh_asks_for_no_entrances_and_replay_asks_for_them', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    await showPage(app, { at: 67, path: '/preview/alpha/draft/prices', scrollY: 300 })
    watch = watchRefreshes(app.panel)

    feed.push({ kind: 'draft', at: 68, pages: ['prices'], site: false })
    expect(watch.asked.map((a) => a.url)).toEqual(['http://builder.test/preview/alpha/draft/prices?still=1'])
    const arrived = previewWindow({ at: 68, path: '/preview/alpha/draft/prices', scrollY: 300 })
    arrived.location.href += '?still=1'
    watch.arrive(arrived)

    // The control is in View, where the page's own script runs; it replays the
    // page in place — the flag dropped, the reader's place kept.
    const replay = app.toolbar.get('replay-animations') as HTMLButtonElement
    expect(replay.textContent).toBe('Replay animations')
    replay.click()
    expect(watch.asked.map((a) => a.url).at(-1)).toBe('http://builder.test/preview/alpha/draft/prices')
    const again = previewWindow({ at: 68, path: '/preview/alpha/draft/prices' })
    watch.arrive(again)
    expect(again.scrolledTo).toEqual([{ left: 0, top: 300 }])

    // Edit runs no page script, so there is nothing there to replay.
    app.panel.setMode('edit')
    expect(app.toolbar.ids()).not.toContain('replay-animations')

    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-248 — a burst refreshes at a steady pace', () => {
  it('test_UAT_FC_BUG-248_ten_changes_within_the_interval_refresh_once_during_and_once_after', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    await showPage(app, { at: 67 })
    watch = watchRefreshes(app.panel)
    vi.useFakeTimers()

    // The first change after a quiet spell shows at once.
    for (let at = 68; at <= 77; at++) feed.push({ kind: 'draft', at, pages: ['home'], site: false })
    expect(watch.asked).toHaveLength(1)
    watch.arrive(previewWindow({ at: 68 }))

    // The rest of the burst waits out the interval, then shows once.
    vi.advanceTimersByTime(2999)
    expect(watch.asked).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(watch.asked).toHaveLength(2)
    watch.arrive(previewWindow({ at: 77 }))

    // Caught up: nothing more.
    vi.advanceTimersByTime(30_000)
    expect(watch.asked).toHaveLength(2)

    app.destroy()
  })

  it('test_UAT_FC_BUG-248_the_interval_is_configurable', async () => {
    const feed = fakeFeed()
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      draftTransport: feed.transport,
      pagesTransport: { list: async () => ({ pages: PAGES }) },
      previewRefreshMs: 10_000,
      chatTransport: { openSession: async () => ({ sessionId: 's', turns: [], ready: true }) },
    }) as unknown as App
    await settle()
    await showPage(app, { at: 67 })
    watch = watchRefreshes(app.panel)
    vi.useFakeTimers()

    feed.push({ kind: 'draft', at: 68, pages: ['home'], site: false })
    watch.arrive(previewWindow({ at: 68 }))
    feed.push({ kind: 'draft', at: 69, pages: ['home'], site: false })
    vi.advanceTimersByTime(9_999)
    expect(watch.asked).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(watch.asked).toHaveLength(2)

    app.destroy()
  })
})
