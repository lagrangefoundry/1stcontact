// @vitest-environment jsdom
/**
 * [[REQ-215]] UATs — **the panel selector**, in the real builder chrome.
 *
 * A modal reproduced in Edit covers the page, and every control in the edit
 * render is inert — including the panel's own Close. So the chrome has to carry
 * the way out, and the same control is the way in: it is how the copy inside a
 * modal nobody opened in View is reached at all.
 *
 * Driven against the ACTUAL composition — `mountBuilder`, the real panel, the
 * real toolbar — for the reason every other builder suite is: the property under
 * test is which controls a MODE declares, and a stand-in strip would assert that
 * of itself.
 *
 * Acceptance covered:
 *
 *   AC-9   Edit offers the selector and View does not; picking one changes what
 *          the loaded document shows without reloading it
 */
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ slug: 'acme', latest: null }]

const doc = (root: L1Node): L1Document => ({ widths: [320, 768, 1440], root })

const signInPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'signin-link', text: 'Sign in', action: { opens: 'signin-panel' } },
    {
      kind: 'container',
      id: 'signin-panel',
      layout: 'stack',
      dialog: {},
      axes: { surfaceFill: '#ffffff' },
      children: [{ kind: 'text', text: 'Please enter your email address' }],
    },
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

/** `app.js` imports the webui components by bare specifier — hence the dynamic load. */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => { destroy?: () => void }

if (!WEBUI_INSTALLED) console.warn(`REQ-215 panel-selector suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-215 — the panel selector', () => {
  let root: HTMLElement

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
  })

  const mount = () =>
    mountBuilder(root, { sites: SITES, storage: memoryStorage(), pageState })

  const panelOf = () => root.querySelector('.builder-panel') as HTMLElement
  const frameOf = () => panelOf().querySelector('iframe') as HTMLIFrameElement
  const selectorOf = () => root.querySelector('[data-action="panels"]') as HTMLElement | null
  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement

  /**
   * Put a render inside the frame and announce it, exactly as a load does.
   *
   * Written rather than assigned, because a frame whose `src` the environment
   * never fetched has no body to assign into — and the marker on `<body>` is
   * what everything downstream reads the channel from.
   */
  const show = (html: string): Document => {
    const frame = frameOf()
    const d = frame.contentDocument as Document
    d.open()
    d.write(`<!doctype html><html><body data-fc-edit>${html}</body></html>`)
    d.close()
    frame.dispatchEvent(new Event('load'))
    return frame.contentDocument as Document
  }

  const showEditRender = (): Document =>
    show(renderL1Document(doc(signInPage()), { edit: true }).html)

  it('test_UAT_FC_REQ-215_edit_offers_the_selector_and_view_does_not', () => {
    mount()
    modeButton('edit').click()
    expect(selectorOf()).not.toBeNull()
    // View must behave exactly as published, so which panel is showing there is
    // the reader's own choice and not the chrome's to make.
    modeButton('view').click()
    expect(selectorOf()).toBeNull()
  })

  it('test_UAT_FC_REQ-215_the_selector_names_the_panels_the_page_declares', () => {
    mount()
    modeButton('edit').click()
    showEditRender()
    const select = selectorOf()?.querySelector('select') as HTMLSelectElement
    expect([...select.options].map((o) => [o.value, o.text])).toEqual([
      ['', 'No panel'],
      ['signin-panel', 'Please enter your email address'],
    ])
  })

  it('test_UAT_FC_REQ-215_picking_a_panel_shows_it_without_reloading_the_page', () => {
    mount()
    modeButton('edit').click()
    const d = showEditRender()
    const select = selectorOf()?.querySelector('select') as HTMLSelectElement

    select.value = 'signin-panel'
    select.dispatchEvent(new Event('change'))
    expect(d.querySelector('[data-l1-dialog="signin-panel"]')?.hasAttribute('data-l1-open')).toBe(
      true,
    )

    // …and the way back out, which is the whole reason this control exists.
    select.value = ''
    select.dispatchEvent(new Event('change'))
    expect(d.querySelector('[data-l1-dialog="signin-panel"]')?.hasAttribute('data-l1-open')).toBe(
      false,
    )
  })

  it('test_UAT_FC_REQ-215_a_page_with_no_modal_shows_no_control_at_all', () => {
    mount()
    modeButton('edit').click()
    show('<p>Nothing to open here.</p>')
    expect((selectorOf() as HTMLElement).hidden).toBe(true)
  })
})
