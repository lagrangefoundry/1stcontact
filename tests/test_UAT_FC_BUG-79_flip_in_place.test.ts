// @vitest-environment jsdom
/**
 * [[BUG-79]] UATs — **View↔Edit flips in place**.
 *
 * The complaint was that moving back and forth between the two channels loses
 * where the operator was: the pane blanks, the page re-renders, and the scroll
 * offset is gone. The cause was structural — one frame, a `src` per mode — so
 * every switch destroyed the document the operator was looking at. [[REQ-215]]
 * carried the page state across that navigation and put it back on `load`,
 * which is the right thing to carry and is not the same as never having lost
 * it.
 *
 * The fix is a frame per document mode, kept alive, with the switch swapping
 * which one is visible. So the property under test throughout is NEGATIVE — the
 * absence of a navigation — and that is asserted the only way an absence can be:
 * by identity of the document object and of the `src` the frame was given.
 *
 * Driven against the ACTUAL composition (`mountBuilder`, the real panel and
 * toolbar), as every other builder suite is, because the thing under test is how
 * the pane and its modes are wired to each other; a stand-in panel would assert
 * that of itself.
 *
 * Covered:
 *
 *   - a mode switch does not navigate: the same document object is still there
 *     after switching away and back
 *   - the frame being left stays laid out (hidden by `visibility`, never by
 *     `display`/`hidden`), which is what keeps its scroll offset
 *   - the arriving document is announced on show, so the carried state lands on
 *     it and the edit loop rebinds
 *   - a write reloads the shown document and marks the others out of date, so
 *     the next flip re-renders rather than serving the pre-write page
 *   - a change of site invalidates every frame
 */
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [
  { slug: 'acme', latest: null },
  { slug: 'other', latest: null },
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

/** `app.js` imports the webui components by bare specifier — hence the dynamic load. */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => { destroy?: () => void }

if (!WEBUI_INSTALLED) console.warn(`BUG-79 flip-in-place suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('BUG-79 — the channel flip is in place', () => {
  let root: HTMLElement

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
  })

  const mount = () => mountBuilder(root, { sites: SITES, storage: memoryStorage(), pageState })

  const panelOf = () => root.querySelector('.builder-panel') as HTMLElement
  /** Every frame the pane holds, in the order the modes were registered. */
  const panes = () => [...panelOf().querySelectorAll('.builder-panel__pane')] as HTMLIFrameElement[]
  /** The one on screen. */
  const shown = () => panelOf().querySelector('.builder-panel__frame') as HTMLIFrameElement | null
  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement

  /**
   * Put a document in the shown frame and announce it, exactly as a load does.
   *
   * Written rather than assigned, because a frame whose `src` the environment
   * never fetched has no body to write into otherwise — and `data-fc-edit` is
   * what everything downstream reads the channel from.
   */
  const load = (edit = false): Document => {
    const frame = shown() as HTMLIFrameElement
    const d = frame.contentDocument as Document
    d.open()
    d.write(`<!doctype html><html><body${edit ? ' data-fc-edit' : ''}><p>page</p></body></html>`)
    d.close()
    frame.dispatchEvent(new Event('load'))
    return frame.contentDocument as Document
  }

  it('test_UAT_FC_BUG-79_a_mode_switch_does_not_navigate_either_channel', () => {
    mount()
    const viewFrame = shown() as HTMLIFrameElement
    const viewDoc = load()
    const viewSrc = viewFrame.getAttribute('src')

    modeButton('edit').click()
    const editFrame = shown() as HTMLIFrameElement
    // A channel of its own, not the same frame re-pointed.
    expect(editFrame).not.toBe(viewFrame)
    const editDoc = load(true)
    const editSrc = editFrame.getAttribute('src')

    // Back and forth. Neither frame is asked for a URL again, and neither
    // document is replaced — which is the whole of the fix.
    modeButton('view').click()
    expect(shown()).toBe(viewFrame)
    expect(viewFrame.contentDocument).toBe(viewDoc)
    expect(viewFrame.getAttribute('src')).toBe(viewSrc)

    modeButton('edit').click()
    expect(shown()).toBe(editFrame)
    expect(editFrame.contentDocument).toBe(editDoc)
    expect(editFrame.getAttribute('src')).toBe(editSrc)
  })

  it('test_UAT_FC_BUG-79_the_idle_channel_is_primed_so_the_first_flip_is_in_place_too', () => {
    const app = mount() as { panel: { on: (e: string, cb: (d: unknown) => void) => () => void } }
    const [viewFrame, editFrame] = panes()
    // Nothing has been asked for on the operator's behalf yet: the channel they
    // are looking at comes first and alone.
    expect(shown()).toBe(viewFrame)
    expect(editFrame.getAttribute('src')).toBeNull()

    load()

    // ...and once it has arrived, the channel they have not opened is loaded
    // behind it. Without this the FIRST flip is still a navigation, and the
    // first flip is the one the operator notices.
    expect(editFrame.getAttribute('src')).toContain('/edit/')
    expect(shown()).toBe(viewFrame)

    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    const primed = editFrame.getAttribute('src')
    modeButton('edit').click()
    // Shown, not fetched: no second navigation, and the document is announced
    // at once because no `load` is coming.
    expect(shown()).toBe(editFrame)
    expect(editFrame.getAttribute('src')).toBe(primed)
    expect(seen).toEqual([editFrame.contentDocument])
  })

  it('test_UAT_FC_BUG-79_the_channel_left_behind_stays_laid_out', () => {
    mount()
    const viewFrame = shown() as HTMLIFrameElement
    modeButton('edit').click()

    // `display: none` — which `hidden` means — takes an iframe out of layout,
    // and an iframe out of layout does not keep where it was scrolled to. So
    // the idle frame must still be in the document, still sized, and hidden by
    // visibility alone.
    expect(viewFrame.isConnected).toBe(true)
    expect(viewFrame.hasAttribute('hidden')).toBe(false)
    expect(viewFrame.classList.contains('builder-panel__pane')).toBe(true)
    expect(viewFrame.classList.contains('builder-panel__frame')).toBe(false)
    expect(panes()).toHaveLength(2)
  })

  it('test_UAT_FC_BUG-79_the_revealed_document_is_announced', () => {
    const app = mount() as { panel: { on: (e: string, cb: (d: unknown) => void) => () => void } }
    const viewDoc = load()
    modeButton('edit').click()
    load(true)

    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    // Revealing a frame that is already holding its document fires no `load`,
    // so without an announcement here nothing rebinds — the edit bridge, Marked
    // Points and the carried page state all arrive on this event.
    modeButton('view').click()
    expect(seen).toEqual([viewDoc])
  })

  it('test_UAT_FC_BUG-79_a_write_reloads_the_shown_page_and_stales_the_others', () => {
    const app = mount() as {
      panel: { reloadDocument: () => void; on: (e: string, cb: (d: unknown) => void) => () => void }
    }
    const viewFrame = shown() as HTMLIFrameElement
    load()
    modeButton('edit').click()
    load(true)

    app.panel.reloadDocument()

    // The frame nobody is looking at is NOT re-rendered now — a render nobody
    // can see is a render nobody should pay for. It is noted instead, and the
    // note is what makes the next flip fetch rather than serve the pre-write
    // page: a frame that is still current announces its document the moment it
    // is revealed, and one that is out of date has to load first.
    const seen: unknown[] = []
    app.panel.on('document', (d) => seen.push(d))
    modeButton('view').click()
    expect(shown()).toBe(viewFrame)
    expect(seen).toEqual([])
  })

  it('test_UAT_FC_BUG-79_a_change_of_site_invalidates_every_channel', () => {
    const app = mount() as { panel: { setSite: (s: string) => void } }
    const viewFrame = shown() as HTMLIFrameElement
    load()
    modeButton('edit').click()
    const editFrame = shown() as HTMLIFrameElement
    load(true)

    app.panel.setSite('other')
    // Another site's page is not this page in another state, so BOTH channels
    // are now holding the wrong document — the one on screen re-renders at once
    // and the idle one re-renders when it is next shown.
    expect(editFrame.getAttribute('src')).toContain('other')
    modeButton('view').click()
    expect(viewFrame.getAttribute('src')).toContain('other')
  })
})
