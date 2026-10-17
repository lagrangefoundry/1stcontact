// @vitest-environment jsdom
/**
 * BUG-207 (reopened) — **switching business shows the new business's site, not
 * the one being left.**
 *
 * The operator was on 1st Contact and selected "Charlie's plumbing - 3": every
 * surface moved, and the preview went on showing 1st Contact's site until a
 * browser refresh. Both businesses have sites.
 *
 * The switch points the frame at the new site — and until that navigation
 * commits, the frame's window is still the OLD site's document. The new site's
 * draft feed ([[BUG-192]]) opens with a `ready` count; the builder read the
 * count the frame "shows" off that old document, found it behind, and reloaded
 * it — `location.reload()` on the page being left, which in a browser cancels
 * the navigation to the new site and reloads the old one.
 *
 * WHAT MAKES IT EVIDENCE. The real builder and the real display panel. jsdom's
 * frame cannot navigate, so the window is stood in for the way a browser
 * behaves mid-navigation: it stays the old document (its reload counted, its
 * count stated) until the frame fires `load`. The assertions are on the old
 * window's reloads and on where the shown frame is pointed.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`BUG-207 switch cases skipped: ${WEBUI_SKIP_REASON}`)

const settle = async () => {
  for (let i = 0; i < 3; i += 1) await new Promise((r) => setTimeout(r, 0))
}

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

const BUSINESSES = [
  { id: 'biz_first', name: '1st Contact', selectable: true },
  { id: 'biz_charlie', name: "Charlie's plumbing - 3", selectable: true },
]
const SITES: Record<string, { site: string }[]> = {
  biz_first: [{ site: 'site_first' }],
  biz_charlie: [{ site: 'site_charlie' }],
}

/** A feed the test pushes frames into, for whichever site is followed last. */
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

/**
 * Every frame's window, as a browser has it: the document it last LOADED, with
 * that document's `draft-at` count, until the next `load` replaces it.
 */
function browserLikeFrames(root: HTMLElement) {
  const reloads: string[] = []
  const windows = new WeakMap<HTMLIFrameElement, { page: string }>()
  const windowOf = (el: HTMLIFrameElement) => {
    let w = windows.get(el)
    if (!w) windows.set(el, (w = { page: el.getAttribute('src') ?? '' }))
    return w
  }
  for (const el of root.querySelectorAll<HTMLIFrameElement>('iframe')) {
    const w = windowOf(el)
    Object.defineProperty(el, 'contentWindow', {
      configurable: true,
      get: () => ({
        location: {
          pathname: new URL(w.page, 'http://x/').pathname,
          reload: () => void reloads.push(w.page),
        },
        performance: {
          // The page being left is behind the new site's count.
          getEntriesByType: () => [{ serverTiming: [{ name: 'draft-at', description: '3', duration: 0 }] }],
        },
      }),
    })
  }
  /** The navigation commits: the frame's window becomes the page it was pointed at. */
  const load = (el: HTMLIFrameElement) => {
    windowOf(el).page = el.getAttribute('src') ?? ''
    el.dispatchEvent(new Event('load'))
  }
  return { reloads, load, page: (el: HTMLIFrameElement) => windowOf(el).page }
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

async function mountAt(feed: ReturnType<typeof fakeFeed>): Promise<Handle> {
  const { mountBuilder } = await import('../apps/control-app/src/builder/app.js')
  const app = mountBuilder(root, {
    businesses: BUSINESSES,
    person: { name: 'Operator', email: 'op@example.test' },
    storage: memoryStorage(),
    loadSites: async (id: string) => SITES[id] ?? [],
    draftTransport: feed.transport,
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
      upload: async () => ({}),
    },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
  }) as Handle
  await settle()
  return app
}

/** On 1st Contact with its site loaded, then switched to Charlie's — not yet arrived. */
async function switchMidway(feed: ReturnType<typeof fakeFeed>) {
  const app = await mountAt(feed)
  const frames = browserLikeFrames(root)
  const shown = () => app.panel.frame as HTMLIFrameElement
  expect(shown().getAttribute('src')).toContain('site_first')
  frames.load(shown())
  expect(frames.page(shown())).toContain('site_first')

  const select = root.querySelector<HTMLSelectElement>('.builder-business__select')!
  select.value = 'biz_charlie'
  select.dispatchEvent(new Event('change'))
  await settle()
  expect(shown().getAttribute('src')).toContain('site_charlie')
  // Still in flight: the window is the page being left.
  expect(frames.page(shown())).toContain('site_first')
  return { app, frames, shown }
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-207 — a switch shows the new site, not the one left', () => {
  it('test_UAT_FC_BUG-207_a_feed_ready_mid_switch_does_not_reload_the_old_site', async () => {
    const feed = fakeFeed()
    const { app, frames, shown } = await switchMidway(feed)

    // The new site's feed opens at a count beyond the one the OLD page states.
    feed.push({ kind: 'ready', at: 9 })

    expect(frames.reloads).toEqual([])
    expect(shown().getAttribute('src')).toContain('site_charlie')
    frames.load(shown())
    expect(frames.page(shown())).toContain('site_charlie')
    app.destroy()
  })

  it('test_UAT_FC_BUG-207_a_write_mid_switch_re_points_the_frame_at_the_new_site', async () => {
    const feed = fakeFeed()
    const { app, frames, shown } = await switchMidway(feed)

    feed.push({ kind: 'draft', at: 9 })

    // Never the old page reloaded in place; the frame is sent to the new site.
    expect(frames.reloads).toEqual([])
    expect(shown().getAttribute('src')).toContain('site_charlie')
    frames.load(shown())
    expect(frames.page(shown())).toContain('site_charlie')
    app.destroy()
  })
})
