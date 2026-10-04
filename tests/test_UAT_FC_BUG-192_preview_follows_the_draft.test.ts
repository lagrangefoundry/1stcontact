// @vitest-environment jsdom
/**
 * [[BUG-192]] — **the browser half: the preview follows the draft, not one
 * conversation.**
 *
 * The frame used to reload only on `site_changed`, which arrives inside the
 * consultant's own chat stream. A delegated builder that wrote and then aborted
 * left the draft moved and the frame stale. Now the builder subscribes to the
 * draft's change feed for the site in view and reloads the frame whenever the
 * feed reports a count beyond the one the frame's page states — and it does not
 * reload a page that already shows that count, so a write reported twice (once
 * in the chat stream, once on the feed) reloads once.
 *
 * The feed is injected (`draftTransport`) because it is an `EventSource`; the
 * origin half is `test_UAT_FC_BUG-192_draft_changes.workers.test.ts`. Mounted
 * against the installed `webui-chat`, as the BUG-43 suite is.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ site: 'alpha', latest: null }]

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-192 panel suite skipped: ${WEBUI_SKIP_REASON}`)

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

const streamOf = (events: unknown[]) =>
  async function* () {
    for (const event of events) yield event
  }

/** A feed the test pushes frames into, recording which sites were followed. */
function fakeFeed() {
  const opened: string[] = []
  const closed: string[] = []
  let push: (frame: unknown) => void = () => {}
  return {
    opened,
    closed,
    push: (frame: unknown) => push(frame),
    transport: {
      subscribe(site: string, onChange: (frame: unknown) => void) {
        opened.push(site)
        push = onChange
        return { close: () => void closed.push(site) }
      },
    },
  }
}

/**
 * Stand in for the frame's window. jsdom's frame cannot navigate, so the reload
 * is counted; the count the page was rendered at is the `draft-at` metric on its
 * navigation entry, exactly where a browser puts the response's `Server-Timing`.
 */
function stubFrame(app: { panel: { frame: HTMLIFrameElement } }, shownAt: number | null) {
  const counts = { reloads: 0 }
  let stated = shownAt
  const win = {
    location: { reload: () => void (counts.reloads += 1) },
    performance: {
      getEntriesByType: (type: string) =>
        type !== 'navigation'
          ? []
          : [{ serverTiming: stated === null ? [] : [{ name: 'draft-at', description: String(stated), duration: 0 }] }],
    },
  }
  Object.defineProperty(app.panel.frame, 'contentWindow', { configurable: true, value: win })
  return {
    counts,
    win,
    /** What a reload would do: the page now states a newer count. */
    show: (at: number) => {
      stated = at
    },
  }
}

const mount = (root: HTMLElement, feed: ReturnType<typeof fakeFeed>, streamEvents: unknown[] = []) =>
  mountBuilder(root, {
    sites: SITES,
    storage: memoryStorage(),
    draftTransport: feed.transport,
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
      streamPrompt: streamOf(streamEvents),
    },
  }) as unknown as {
    panel: { frame: HTMLIFrameElement }
    chat: { getChat(): { send(text: string): Promise<void> } }
    destroy(): void
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
beforeEach(() => {
  document.body.replaceChildren()
  globalThis.localStorage?.clear()
  root = document.createElement('div')
  document.body.append(root)
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-192 — the preview follows the draft', () => {
  it('test_UAT_FC_BUG-192_the_builder_follows_the_draft_of_the_site_in_view', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()

    expect(feed.opened).toEqual(['alpha'])

    app.destroy()
    // An open `EventSource` outliving the mount is the origin polling for nobody.
    expect(feed.closed).toEqual(['alpha'])
  })

  it('test_UAT_FC_BUG-192_a_write_no_conversation_reported_reloads_the_preview', async () => {
    // The tester's case: a delegated builder wrote 67→75 and aborted, so no
    // `site_changed` ever reached this tab. The feed reports it instead.
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    const frame = stubFrame(app, 67)

    feed.push({ kind: 'ready', at: 67 })
    expect(frame.counts.reloads).toBe(0)

    feed.push({ kind: 'draft', at: 75 })
    expect(frame.counts.reloads).toBe(1)

    app.destroy()
  })

  it('test_UAT_FC_BUG-192_a_reconnect_finds_the_frame_behind_and_reloads_it', async () => {
    // The feed came back after a drop and opened at a count the page does not
    // hold — the gap is caught up without waiting for another write.
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    const frame = stubFrame(app, 67)

    feed.push({ kind: 'ready', at: 75 })
    expect(frame.counts.reloads).toBe(1)

    app.destroy()
  })

  it('test_UAT_FC_BUG-192_a_count_the_page_already_shows_does_not_reload_it', async () => {
    // The operator's own save already reloaded the frame; the feed reporting
    // the same write a moment later must not throw their next edit away.
    const feed = fakeFeed()
    const app = mount(root, feed)
    await settle()
    const frame = stubFrame(app, 75)

    feed.push({ kind: 'draft', at: 75 })
    feed.push({ kind: 'draft', at: 74 })
    expect(frame.counts.reloads).toBe(0)

    app.destroy()
  })

  it('test_UAT_FC_BUG-192_a_write_reported_in_the_chat_and_on_the_feed_reloads_once', async () => {
    const feed = fakeFeed()
    const app = mount(root, feed, [
      { kind: 'tool_activity', content: 'tool_call add_section', meta: { name: 'add_section' } },
      { kind: 'site_changed', content: '', meta: { at: 76, changes: 1 } },
      { kind: 'text', content: 'Added.' },
      { kind: 'done' },
    ])
    await settle()
    const frame = stubFrame(app, 75)
    // The reload loads the page at the count it was told about.
    const reload = frame.win.location.reload
    frame.win.location.reload = () => {
      reload()
      frame.show(76)
    }

    await app.chat.getChat().send('Add a section.')
    feed.push({ kind: 'draft', at: 76 })

    expect(frame.counts.reloads).toBe(1)

    app.destroy()
  })
})
