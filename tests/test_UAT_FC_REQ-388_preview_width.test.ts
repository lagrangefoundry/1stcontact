// @vitest-environment jsdom
/**
 * [[REQ-388]] UATs — **the preview's width control**, and the width going out
 * with every prompt.
 *
 * WHAT MAKES THIS EVIDENCE. Driven against the ACTUAL composition —
 * `mountBuilder`, the real panel, the real toolbar, the real page index fed by a
 * page listing shaped like `editPageList`'s, the real chat pane — exactly as the
 * REQ-376 suite drives "View on your phone". The one thing jsdom cannot do is lay
 * anything out, so the PANE'S size is stated (`clientWidth`/`clientHeight` on the
 * panel element) and everything downstream of it is the code under test.
 *
 * Covered:
 *
 *   1  the control sits directly before "Open in new tab" in View and in Edit,
 *      and offers Desktop · Tablet · Phone · Fit pane, Fit pane by default
 *   2  Phone lays the draft out at the site's own phone width whatever the pane
 *      is — shrunk to fit a narrow pane, centred in a wide one — in BOTH channels'
 *      frames; Fit pane follows the pane
 *   3  the choice is remembered: a fresh mount on the same storage shows it
 *   4  a chat submission carries the width the draft is laid out at and the
 *      setting that produced it
 *   5  the comp viewer's Desktop/Phone toggle wears the same segmented control
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/** A ladder like the captured sites': the fixed settings must land ON it. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]
const SITES = [{ site: 'acme', latest: null }]
const PAGES = [
  { id: 'home', slug: 'home', title: 'Home', reachable: true, kind: 'web', widths: LADDER },
  { id: 'about', slug: 'about', title: 'About us', reachable: true, kind: 'web', widths: LADDER },
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

const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-388 preview-width suite skipped: ${WEBUI_SKIP_REASON}`)

beforeAll(() => {
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

describe.skipIf(!WEBUI_INSTALLED)('REQ-388 — the preview has a width', () => {
  let root: HTMLElement

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    setBusinessScope(null)
    globalThis.localStorage?.clear()
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
  })

  const mount = (over: Record<string, unknown> = {}) =>
    mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      pageState,
      pagesTransport: { list: async () => ({ pages: PAGES }) },
      ...over,
    })

  /** Say how big the pane is — the one thing jsdom cannot work out. */
  const paneOf = (app: Record<string, any>, width: number, height = 600) => {
    const el = app.panel.element as HTMLElement
    Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => width })
    Object.defineProperty(el, 'clientHeight', { configurable: true, get: () => height })
  }
  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement
  const widthButton = (id: string) =>
    root.querySelector(`[data-action="preview-width"] button[data-width="${id}"]`) as HTMLButtonElement
  const frames = () => [...root.querySelectorAll('.builder-panel__pane')] as HTMLIFrameElement[]
  const shown = () => root.querySelector('.builder-panel__frame') as HTMLIFrameElement

  it('test_UAT_FC_REQ-388_the_control_sits_before_open_in_new_tab_in_view_and_edit', async () => {
    const app = mount()
    await settled()
    for (const mode of ['view', 'edit']) {
      modeButton(mode).click()
      await settled()
      const ids: string[] = app.toolbar.ids()
      expect(ids.indexOf('preview-width'), `in ${mode}`).toBe(ids.indexOf('open-new-tab') - 1)
      const labels = [...root.querySelectorAll('[data-action="preview-width"] button')].map((b) => b.textContent)
      expect(labels).toEqual(['Desktop', 'Tablet', 'Phone', 'Fit pane'])
      // Fit pane — today's behaviour — until somebody chooses otherwise.
      expect(widthButton('fit').getAttribute('aria-pressed')).toBe('true')
    }
  })

  it('test_UAT_FC_REQ-388_phone_renders_at_the_sites_phone_width_whatever_the_pane', async () => {
    const app = mount()
    await settled()

    // A pane NARROWER than a phone: laid out at 375 all the same, and shrunk to fit.
    paneOf(app, 300)
    widthButton('phone').click()
    expect(widthButton('phone').getAttribute('aria-pressed')).toBe('true')
    expect(widthButton('phone').title).toContain('375px')
    for (const frame of frames()) {
      expect(frame.style.width).toBe('375px')
      expect(frame.style.transform).toBe('scale(0.8)')
    }
    expect(app.panel.viewport().width).toBe(375)

    // A pane WIDER than a phone: still 375 — never reflowed to the pane — and centred.
    paneOf(app, 1200)
    widthButton('phone').click()
    expect(shown().style.width).toBe('375px')
    expect(shown().style.transform).toBe('')
    expect(shown().style.left).toBe(`${Math.round((1200 - 375) / 2)}px`)

    // It holds across the channel flip: both frames are laid out at it.
    modeButton('edit').click()
    await settled()
    expect(shown().style.width).toBe('375px')

    // Desktop and Tablet are the site's own ladder widths too.
    widthButton('desktop').click()
    expect(shown().style.width).toBe('1280px')
    widthButton('tablet').click()
    expect(shown().style.width).toBe('768px')

    // Fit pane follows the pane, which is what the pane always did.
    widthButton('fit').click()
    expect(shown().style.width).toBe('')
    expect(app.panel.viewport().width).toBe(1200)
    paneOf(app, 812)
    expect(app.panel.viewport().width).toBe(812)
  })

  it('test_UAT_FC_REQ-388_the_choice_is_remembered', async () => {
    const storage = memoryStorage()
    const first = mount({ storage })
    await settled()
    widthButton('phone').click()
    first.destroy()

    root.replaceChildren()
    mount({ storage })
    await settled()
    expect(widthButton('phone').getAttribute('aria-pressed')).toBe('true')
    expect(shown().style.width).toBe('375px')
  })

  it('test_UAT_FC_REQ-388_a_chat_submission_carries_the_width_and_the_setting', async () => {
    const sent: Array<{ text: string; view: unknown }> = []
    const app = mount({
      chatTransport: {
        openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
        streamPrompt: async function* (_id: string, text: string, view: unknown) {
          sent.push({ text, view })
          yield { kind: 'text', content: 'Looking.' }
          yield { kind: 'done' }
        },
      },
    })
    await settled()

    paneOf(app, 812, 640)
    await app.chat.getChat().send('the header wraps')
    expect(sent.at(-1)).toEqual({ text: 'the header wraps', view: { width: 812, height: 640, mode: 'fit' } })

    // A fixed setting reports the width the draft is LAID OUT at, not the pane's.
    paneOf(app, 300, 600)
    widthButton('phone').click()
    await app.chat.getChat().send('and on a phone?')
    expect(sent.at(-1)).toEqual({ text: 'and on a phone?', view: { width: 375, height: 750, mode: 'phone' } })
  })

  it('test_UAT_FC_REQ-388_the_comp_viewers_toggle_wears_the_same_control', async () => {
    const { createCompViewer } = await import('../apps/control-app/src/builder/comp-viewer.js')
    const viewer = createCompViewer({ onBack: () => {} })
    const host = document.createElement('div')
    viewer.mount(host)
    viewer.open([{ reference: 'r1', title: 'Rival', url: 'https://rival.example', desktop: 'd.png', phone: 'p.png' }], 'r1')
    const group = host.querySelector('.comp-viewer__widths') as HTMLElement
    expect(group.classList.contains('builder-segmented')).toBe(true)

    const app = mount()
    await settled()
    expect(root.querySelector('[data-action="preview-width"]')!.classList.contains('builder-segmented')).toBe(true)
    app.destroy()
  })
})
