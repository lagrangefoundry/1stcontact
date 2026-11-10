// @vitest-environment jsdom
/**
 * story-44d0a572 — **Marked Points**: point at the edit preview and send the
 * pointing as text (REQ-210, BUG-72).
 *
 * One UAT per acceptance criterion, AC-2413 … AC-2425.
 *
 * WHAT THESE DRIVE. The overlay controller (`builder/points.js`) runs against the
 * bytes `1c render --edit` actually wrote, parsed by a real DOM and driven by
 * real click and pointer events, with the real framework modules the browser is
 * served (`marked-points`, `anchors`, `measure-svg`, `edit-client`). The
 * click-to-edit side is the real `mountL1EditBridge`; "the editor opens" is the
 * bridge's own `onSegment` callback firing. Composer and toolbar criteria mount
 * the real `webui-*` components and skip loudly when they are absent.
 *
 * WHAT IS STUBBED, AND WHY. jsdom has no layout engine and no CSS object-fit, so
 * the one thing a browser would have measured — a box per element, the image's
 * computed `object-fit`/`object-position`, and hit testing for a drag's drop
 * point — is supplied. The SVG asset is fetched over HTTP, which is injected;
 * and jsdom has no canvas, so the drawing's measurement is injected in the shape
 * `measureScript` produces.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { cmdNew, cmdPublish, cmdRender } from '../tools/generate/src/cli/commands'
import { mountL1EditBridge, resolveEditTarget } from '../packages/framework/src/l1/edit-client'
import * as markedPoints from '../packages/framework/src/l1/marked-points'
import * as anchors from '../packages/site-schema/src/anchors'
import { measureScript } from '../tools/generate/src/cli/capture/measure-svg'
import { L1_EDIT_PAGE_ATTR } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const HEADLINE = 'A painted band.'
const VIEW_BOX = '0 0 320 86'
const svgOf = (attrs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW_BOX}"${attrs}>
  <text id="one" x="0" y="62" font-family="Satoshi" font-size="62">1</text>
</svg>`
const MARK_SVG = svgOf()
const PREVIEW_URL = 'https://builder.test/preview/acme/edit/'
const HEADING = 'Marked points (this turn):'

/** The drawing's measurement, in the shape `measureScript` resolves to. */
const MEASUREMENT = {
  viewBox: [0, 0, 320, 86],
  fonts: [
    {
      key: 'f0',
      requested: 'Satoshi',
      resolved: 'Satoshi',
      generic: false,
      capHeight: 0.7,
      xHeight: 0.5,
      ascender: 0.75,
      descender: -0.25,
    },
  ],
  nodes: [
    {
      ref: '#one',
      text: '1',
      font: 'f0',
      fontSize: 62,
      box: [0, 15.5, 34.4, 62] as [number, number, number, number],
      ink: [1.2, 18.6, 24.8, 43.4] as [number, number, number, number],
      baseline: 62,
      advanceStart: 0,
      advanceWidth: 34.4,
    },
  ],
  warnings: [],
}

/** A page with a run of copy [0.0] and a drawing [0.1]. */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } },
      { kind: 'image', src: 'assets/mark.svg', alt: 'The wordmark' },
    ],
  }
  home.l1.root = root
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

function withBox(
  el: Element,
  box: { left: number; top: number; width: number; height: number },
): void {
  el.getBoundingClientRect = () =>
    ({
      left: box.left,
      top: box.top,
      right: box.left + box.width,
      bottom: box.top + box.height,
      width: box.width,
      height: box.height,
      x: box.left,
      y: box.top,
      toJSON: () => ({}),
    }) as DOMRect
}

/** The two composer calls `app.js` gives the controller, over a plain draft. */
function composer() {
  let markdown = ''
  return {
    get: () => markdown,
    set: (md: string) => void (markdown = md),
    insertToken: (token: string) => {
      markdown = `${markdown}${markdown === '' || /\s$/.test(markdown) ? '' : ' '}${token} `
    },
    removeToken: (label: string) => {
      markdown = markdown.replace(new RegExp(`\\[\\s*point\\s+${label}\\s*\\]\\s?`, 'gi'), '')
    },
  }
}

/** Every file under a directory, concatenated — the bytes a render wrote. */
function allBytes(dir: string): string {
  let out = ''
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out += allBytes(full)
    else if (/\.(html|css|js)$/.test(name)) out += readFileSync(full, 'utf8')
  }
  return out
}

/** All rule texts of the injected stylesheets, keyed by selector. */
function rules(doc: Document): Map<string, string> {
  const out = new Map<string, string>()
  for (const sheet of [...doc.styleSheets] as CSSStyleSheet[]) {
    for (const rule of [...(sheet.cssRules ?? [])] as CSSStyleRule[]) {
      if (rule.selectorText) out.set(rule.selectorText, rule.style.cssText)
    }
  }
  return out
}

function decl(doc: Document, selector: string, prop: string): string {
  const text = rules(doc).get(selector)
  if (text === undefined) throw new Error(`no rule for ${selector}`)
  const found = text.match(new RegExp(`(?:^|;)\\s*${prop}:\\s*([^;]+)`))
  if (!found) throw new Error(`no ${prop} in ${selector} { ${text} }`)
  return found[1].trim()
}

/** The point blocks in an expansion, by their first line. */
const blockLabels = (out: string) =>
  [...out.matchAll(/^Point ([A-Z]) — /gm)].map((m) => m[1])

let createMarkedPoints: (opts?: Record<string, unknown>) => never

beforeAll(async () => {
  ;({ createMarkedPoints } = await import('../apps/control-app/src/builder/points.js'))
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

if (!WEBUI_INSTALLED) console.warn(`story-44d0a572 composer/toolbar parts: ${WEBUI_SKIP_REASON}`)

describe('story-44d0a572 — Marked Points on the edit render', () => {
  let cwd: string
  let dom: JSDOM
  let doc: Document
  let box: ReturnType<typeof composer>
  let controller: ReturnType<typeof createMarkedPoints>
  let img: HTMLImageElement
  let copy: Element
  let svgFor: (url: string) => { ok: boolean; body: string }
  let measureImpl: (svg: string) => Promise<unknown>
  let fit: { objectFit: string; objectPosition: string }

  const api = { resolveEditTarget, L1_EDIT_PAGE_ATTR, markedPoints, anchors, measureScript }

  function makeController() {
    return createMarkedPoints({
      api,
      insertToken: box.insertToken,
      removeToken: box.removeToken,
      fetch: async (url: string) => {
        const { ok, body } = svgFor(url)
        return { ok, status: ok ? 200 : 404, text: async () => body } as Response
      },
      measure: (svg: string) => measureImpl(svg),
    })
  }

  function clickAt(el: Element, clientX: number, clientY: number): MouseEvent {
    const ev = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY,
    })
    el.dispatchEvent(ev)
    return ev
  }

  function pointer(type: string, clientX: number, clientY: number, on: Element = doc.documentElement) {
    on.dispatchEvent(
      new dom.window.MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY }),
    )
  }

  const markOf = (label: string) => doc.querySelector(`.fc-point[data-point="${label}"]`)
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'story44d0-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    dom = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8'), { url: PREVIEW_URL })
    doc = dom.window.document
    doc.elementFromPoint = () => null
    img = doc.querySelector('img')!
    copy = [...doc.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === HEADLINE,
    )!
    withBox(img, { left: 100, top: 50, width: 320, height: 86 })
    withBox(copy, { left: 0, top: 0, width: 600, height: 40 })
    // jsdom computes no `object-fit`; the browser would. Supplied for the image only.
    fit = { objectFit: 'fill', objectPosition: '50% 50%' }
    const realStyle = dom.window.getComputedStyle.bind(dom.window)
    dom.window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
      const style = realStyle(el, pseudo)
      if (el !== img) return style
      return new Proxy(style, {
        get: (target, prop) =>
          prop === 'objectFit' || prop === 'objectPosition'
            ? fit[prop]
            : Reflect.get(target, prop),
      })
    }) as typeof dom.window.getComputedStyle
    svgFor = () => ({ ok: true, body: MARK_SVG })
    measureImpl = async () => MEASUREMENT
    box = composer()
    controller = makeController()
    controller.bind(doc)
  })

  afterEach(() => {
    controller.destroy()
    vi.useRealTimers()
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── AC-2413 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2413_mark_points_toggle_exists_only_in_edit_mode_and_reassigns_the_click', async () => {
    // The click-to-edit bridge, real, with "the editor opens" as its callback.
    const opened: string[] = []
    const bridge = mountL1EditBridge(doc, (hit) => opened.push(hit.kind))

    // OFF: a click on a segment opens its editor.
    clickAt(copy, 10, 10)
    expect(opened).toEqual(['copy'])
    expect(controller.list()).toEqual([])

    // ON: the click places a point and opens no editor.
    controller.setActive(true)
    clickAt(copy, 10, 10)
    expect(opened).toEqual(['copy'])
    expect(controller.list()).toHaveLength(1)
    expect(markOf('A')).not.toBeNull()
    // Visibly on: the mode marker, the crosshair, the dimmed hover outline.
    expect(doc.body.hasAttribute('data-fc-points')).toBe(true)
    const css = rules(doc)
    const cursorRule = [...css.entries()].find(([sel]) => sel.startsWith('[data-fc-points]'))
    expect(cursorRule?.[1]).toMatch(/cursor:\s*crosshair/)
    // The overlay's own rule, keyed on the mode marker — not the renderer's.
    const hover = [...css.entries()].find(
      ([sel]) => sel.includes('[data-fc-points]') && sel.includes('l1-edit-hot'),
    )
    expect(hover?.[1]).toMatch(/outline:.*rgba\(\s*99,\s*102,\s*241,\s*0\.4\s*\)/)

    // OFF again: the click is the editor's once more.
    controller.setActive(false)
    clickAt(copy, 10, 10)
    expect(opened).toEqual(['copy', 'copy'])
    expect(doc.body.hasAttribute('data-fc-points')).toBe(false)
    bridge.destroy()

    // THE TOGGLE IN THE REAL TOOLBAR: offered in Edit, not in View, and leaving
    // Edit turns the mode off.
    if (!WEBUI_INSTALLED) {
      console.warn(`AC-2413 toolbar half NOT VERIFIED here — ${WEBUI_SKIP_REASON}`)
      return
    }
    const { mountBuilder } = await import('../apps/control-app/src/builder/app.js')
    document.body.replaceChildren()
    const root = document.createElement('div')
    document.body.append(root)
    const app = mountBuilder(root, { sites: [{ slug: 'alpha', latest: null }] }) as never as {
      panel: { setMode(m: string): void }
      toolbar: { ids(): string[]; get(id: string): HTMLElement | null }
    }
    app.panel.setMode('view')
    expect(app.toolbar.ids()).not.toContain('mark-points')
    app.panel.setMode('edit')
    expect(app.toolbar.ids()).toContain('mark-points')
    const toggle = app.toolbar.get('mark-points') as HTMLButtonElement
    expect(toggle.textContent).toBe('Mark Points')
    expect(toggle.getAttribute('aria-pressed')).toBe('false')
    toggle.click()
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    // jsdom loads no subresources, so a frame given a `src` holds a document with
    // no root element at all. A browser's frame always has `<html>`, `<head>` and
    // `<body>` (about:blank included), and the overlay installs into exactly that
    // — so each frame is given the skeleton a browser would already hold.
    for (const frame of root.querySelectorAll('iframe')) {
      const fd = frame.contentDocument
      if (fd && !fd.documentElement) {
        fd.open()
        fd.write('<!doctype html><html><head></head><body></body></html>')
        fd.close()
      }
    }
    // Leaving Edit mode: the mode is off, and the channel shown carries no trace
    // of it — no mode marker, no overlay — so View behaves as published.
    app.panel.setMode('view')
    const viewDoc = (app.panel as never as { frame: HTMLIFrameElement | null }).frame
      ?.contentDocument
    expect(viewDoc?.body?.hasAttribute('data-fc-points') ?? false).toBe(false)
    expect(viewDoc?.querySelector('.fc-points') ?? null).toBeNull()
    // Returning to Edit: the rebuilt toggle reports the mode off.
    app.panel.setMode('edit')
    expect((app.toolbar.get('mark-points') as HTMLElement).getAttribute('aria-pressed')).toBe(
      'false',
    )
  })

  // ── AC-2414 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2414_placing_a_point_shows_a_lettered_mark_reuses_freed_letters_and_appends_a_pill', () => {
    box.set('Move these')
    controller.setActive(true)
    clickAt(copy, 10, 10)
    clickAt(copy, 20, 20)
    clickAt(img, 150, 60)

    expect(controller.list().map((p: { label: string }) => p.label)).toEqual(['A', 'B', 'C'])
    // Existing text kept; pills appended at the END, in order.
    expect(box.get().trimEnd()).toBe('Move these [Point A] [Point B] [Point C]')

    // The mark: a cross on a disc, labelled "Point A", at the click position.
    const a = markOf('A') as HTMLElement
    expect(a.querySelector('.fc-point__x')).not.toBeNull()
    expect(a.querySelector('.fc-point__label')!.textContent).toContain('Point A')
    expect(a.style.left).toBe('10px')
    expect(a.style.top).toBe('10px')

    // Delete A: the lowest free letter is A again, not D.
    markOf('A')!
      .querySelector('[data-act="delete"]')!
      .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    clickAt(copy, 30, 30)
    expect(controller.list().map((p: { label: string }) => p.label)).toEqual(['B', 'C', 'A'])

    // Fill all 26; the 27th click places nothing and adds no pill.
    for (let i = 0; i < 23; i += 1) clickAt(copy, 40 + i, 30)
    expect(controller.list()).toHaveLength(26)
    const draft = box.get()
    const marks = doc.querySelectorAll('.fc-point').length
    clickAt(copy, 300, 30)
    expect(controller.list()).toHaveLength(26)
    expect(doc.querySelectorAll('.fc-point').length).toBe(marks)
    expect(box.get()).toBe(draft)
  })

  // ── AC-2415 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2415_a_fresh_label_fades_only_on_leaving_its_asymmetric_reach_or_the_next_point', () => {
    const AT = { x: 200, y: 200 }
    withBox(copy, { left: 0, top: 0, width: 600, height: 400 })
    controller.setActive(true)
    clickAt(copy, AT.x, AT.y)
    const fresh = (label = 'A') => markOf(label)!.classList.contains('is-fresh')
    expect(fresh()).toBe(true)
    // Its controls are clickable while fresh: the label takes pointer events.
    expect(decl(doc, '.fc-point.is-fresh .fc-point__label, .fc-point:hover .fc-point__label', 'pointer-events')).toBe('auto')

    // Within reach: rightward along the label, past the × (~100px), to just inside 200px.
    for (const dx of [40, 100, 150, 199]) {
      pointer('pointermove', AT.x + dx, AT.y)
      expect(fresh()).toBe(true)
    }
    // Within 56px left, up and down.
    pointer('pointermove', AT.x - 55, AT.y)
    pointer('pointermove', AT.x, AT.y - 55)
    pointer('pointermove', AT.x, AT.y + 55)
    expect(fresh()).toBe(true)

    // Resting on the mark's own chrome never fades it, however long — not on a timer.
    vi.useFakeTimers()
    const drop = markOf('A')!.querySelector('[data-act="delete"]')!
    pointer('pointermove', AT.x + 4000, AT.y + 4000, drop)
    vi.advanceTimersByTime(10 * 60 * 1000)
    expect(fresh()).toBe(true)
    // Held inside the reach, time passing does not fade it either.
    pointer('pointermove', AT.x + 10, AT.y + 10)
    vi.advanceTimersByTime(10 * 60 * 1000)
    expect(fresh()).toBe(true)
    vi.useRealTimers()

    // Leaving: more than 56px down fades it.
    pointer('pointermove', AT.x, AT.y + 57)
    expect(fresh()).toBe(false)

    // Fresh again on a new controller: more than 200px right fades it; and more than 56px left.
    controller.destroy()
    controller = makeController()
    controller.bind(doc)
    controller.setActive(true)
    clickAt(copy, AT.x, AT.y)
    pointer('pointermove', AT.x + 201, AT.y)
    expect(fresh()).toBe(false)
    controller.destroy()
    controller = makeController()
    controller.bind(doc)
    controller.setActive(true)
    clickAt(copy, AT.x, AT.y)
    pointer('pointermove', AT.x - 57, AT.y)
    expect(fresh()).toBe(false)

    // The next point landing fades the previous label; only the newest stays.
    controller.destroy()
    controller = makeController()
    controller.bind(doc)
    controller.setActive(true)
    clickAt(copy, AT.x, AT.y)
    expect(fresh('A')).toBe(true)
    clickAt(copy, AT.x + 300, AT.y)
    expect(fresh('A')).toBe(false)
    expect(fresh('B')).toBe(true)

    // Hovering a faded mark shows its label and controls again.
    const hoverSel = '.fc-point.is-fresh .fc-point__label, .fc-point:hover .fc-point__label'
    expect(hoverSel.split(',').map((s) => s.trim())).toContain('.fc-point:hover .fc-point__label')
    expect(decl(doc, hoverSel, 'opacity')).toBe('1')
    expect(decl(doc, '.fc-point__label', 'opacity')).toBe('0')
  })

  // ── AC-2416 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2416_the_cross_is_two_bars_centred_on_a_22px_disc_with_no_glyph', () => {
    controller.setActive(true)
    clickAt(copy, 200, 30)
    const mark = markOf('A') as HTMLElement
    const x = mark.querySelector('.fc-point__x')!
    expect(x.textContent).toBe('')
    const bars = x.querySelectorAll('.fc-point__bar')
    expect(bars).toHaveLength(2)
    expect(bars[0].classList.contains('fc-point__bar--a')).toBe(true)
    expect(bars[1].classList.contains('fc-point__bar--b')).toBe(true)
    expect(decl(doc, '.fc-point__bar--a', 'transform')).toBe('rotate(45deg)')
    expect(decl(doc, '.fc-point__bar--b', 'transform')).toBe('rotate(-45deg)')

    // Each bar centred by construction: at 50%/50%, pulled back by half its own size.
    const bar = (prop: string) => Number.parseFloat(decl(doc, '.fc-point__bar', prop))
    expect(decl(doc, '.fc-point__bar', 'left')).toBe('50%')
    expect(decl(doc, '.fc-point__bar', 'top')).toBe('50%')
    expect(bar('margin-left')).toBeCloseTo(-bar('width') / 2, 6)
    expect(bar('margin-top')).toBeCloseTo(-bar('height') / 2, 6)

    // The hit/drag disc is 22×22 and centred on the point's exact position.
    expect(decl(doc, '.fc-point__x', 'width')).toBe('22px')
    expect(decl(doc, '.fc-point__x', 'height')).toBe('22px')
    expect(decl(doc, '.fc-point__x', 'left')).toBe('-11px')
    expect(decl(doc, '.fc-point__x', 'top')).toBe('-11px')
    expect(decl(doc, '.fc-point__x::before', 'border-radius')).toBe('50%')
    expect(mark.style.left).toBe('200px')
    expect(mark.style.top).toBe('30px')
  })

  // ── AC-2417 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2417_label_plus_reinserts_a_pill_and_times_deletes_the_point_and_its_pills', async () => {
    const opened: string[] = []
    const bridge = mountL1EditBridge(doc, (hit) => opened.push(hit.kind))
    controller.setActive(true)
    clickAt(copy, 40, 20)
    await settle()
    const placed = controller.list()[0]

    // Clear the draft, then + restores a pill for the SAME point.
    box.set('')
    const press = (act: string) =>
      markOf('A')!
        .querySelector(`[data-act="${act}"]`)!
        .dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    press('refer')
    expect(box.get()).toContain('[Point A]')
    const { used } = markedPoints.expandMarkedPoints(box.get(), controller.list())
    expect(used).toHaveLength(1)
    expect(used[0].doc).toEqual(placed.doc)
    expect(used[0].node).toEqual(placed.node)

    // + never placed a point nor opened an editor.
    expect(controller.list()).toHaveLength(1)
    expect(doc.querySelectorAll('.fc-point')).toHaveLength(1)

    // Two pills for A in a draft with other text; × removes every one, and the mark.
    box.set('Move [Point A] here and [Point A] there')
    press('delete')
    expect(markOf('A')).toBeNull()
    expect(box.get()).not.toMatch(/point\s+a/i)
    expect(box.get()).toBe('Move here and there')
    expect(doc.querySelectorAll('.fc-point')).toHaveLength(0)
    expect(controller.list()).toHaveLength(0)
    expect(opened).toEqual([])
    bridge.destroy()
  })

  // ── AC-2418 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2418_dragging_a_mark_moves_its_point_and_re_resolves_it_where_the_drag_ends', async () => {
    controller.setActive(true)
    clickAt(copy, 40, 20)
    await settle()
    expect(box.get().trim()).toBe('[Point A]')
    box.set('Put [Point A] there')
    // A point on an L1 node carries no tooltip; only a resolved drawing point does.
    expect((markOf('A') as HTMLElement).title).toBe('')

    // Drag A's cross onto the drawing with real pointer events.
    doc.elementFromPoint = (x: number, y: number) =>
      x >= 100 && x <= 420 && y >= 50 && y <= 136 ? img : null
    const cross = markOf('A')!.querySelector('.fc-point__x')!
    pointer('pointerdown', 40, 20, cross)
    pointer('pointermove', 90, 40)
    expect((markOf('A') as HTMLElement).style.left).toBe('90px')
    pointer('pointermove', 150, 70)
    pointer('pointerup', 150, 70)
    await settle()

    // Same label; the pill stays where it was.
    expect(markOf('A')).not.toBeNull()
    expect(box.get()).toBe('Put [Point A] there')
    expect((markOf('A') as HTMLElement).style.left).toBe('150px')
    expect((markOf('A') as HTMLElement).style.top).toBe('70px')

    // Hovering the mark shows the point's full expansion: re-derived from where
    // the drag ended, so a reused letter can always be told apart on screen.
    // Read while the point is still live — sending (expand) clears it from list().
    const [moved] = controller.list()
    const title = (markOf('A') as HTMLElement).title
    expect(title).toBe(markedPoints.formatMarkedPoint(moved))
    expect(title).toMatch(/^Point A — inside image node 0\.1 \(asset assets\/mark\.svg\)/)
    expect(title).toMatch(/svg user space:\s+\(50, 20\)/)
    expect(title).toMatch(/node-relative:\s+\(50, 20\) of 320×86/)

    const out = controller.expand(box.get())
    expect(out).toContain('Point A — inside image node 0.1')
    expect(out).not.toContain('copy node 0.0')
    expect(out).toMatch(/node-relative:\s+\(50, 20\) of 320×86/)
    expect(out).toMatch(/viewport:\s+\(150, 70\) at width/)

    // A sent mark cannot be dragged.
    const sentCross = markOf('A')!.querySelector('.fc-point__x')!
    pointer('pointerdown', 150, 70, sentCross)
    pointer('pointermove', 300, 300)
    pointer('pointerup', 300, 300)
    expect((markOf('A') as HTMLElement).style.left).toBe('150px')
    expect((markOf('A') as HTMLElement).style.top).toBe('70px')
  })

  // ── AC-2419 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2419_each_referenced_point_expands_to_a_block_with_every_frame_width_and_render', async () => {
    Object.defineProperty(dom.window, 'scrollX', { value: 0, configurable: true })
    Object.defineProperty(dom.window, 'scrollY', { value: 400, configurable: true })
    Object.defineProperty(dom.window, 'innerWidth', { value: 375, configurable: true })
    controller.setActive(true)
    clickAt(img, 131.2, 74.8) // A — inside the drawing
    clickAt(copy, 20, 10) // B — a plain L1 node
    clickAt(doc.body, 500, 300) // C — on nothing editable
    await settle()
    const ordinal = controller.getRenderOrdinal()

    const out = controller.expand('Put [Point B] near [Point A], not [Point C].')
    // Prose first, pills flattened, then the heading.
    expect(out.startsWith('Put Point B near Point A, not Point C.\n\n' + HEADING)).toBe(true)
    // Blocks in order of first appearance in the draft.
    expect(blockLabels(out)).toEqual(['B', 'A', 'C'])

    const block = (label: string) => {
      const start = out.indexOf(`Point ${label} — `)
      const end = out.indexOf('\n\n', start)
      return out.slice(start, end === -1 ? undefined : end)
    }
    const a = block('A')
    expect(a).toMatch(/^Point A — inside image node 0\.1 \(asset assets\/mark\.svg\)/)
    expect(a).toMatch(/svg user space:\s+\(31\.2, 24\.8\)\s+\[viewBox 0 0 320 86\]/)
    expect(a).toMatch(/node-relative:\s+\(31\.2, 24\.8\) of 320×86/)
    // Document coordinates: client + scroll, at the preview's width.
    expect(a).toMatch(/viewport:\s+\(131\.2, 474\.8\) at width 375/)
    expect(a).toMatch(/near:\s+\S/)
    expect(a).toMatch(new RegExp(`render:\\s+page home, render ${ordinal}$`, 'm'))

    const b = block('B')
    expect(b).toMatch(/^Point B — inside copy node 0\.0$/m)
    expect(b).not.toContain('svg user space')
    expect(b).not.toContain('near:')
    expect(b).toMatch(/node-relative:\s+\(20, 10\) of 600×40/)
    expect(b).toMatch(/viewport:\s+\(20, 410\) at width 375/)

    const c = block('C')
    expect(c).toMatch(/^Point C — not inside any editable segment$/m)
    expect(c).not.toContain('node-relative')
    expect(c).toMatch(/viewport:\s+\(500, 700\) at width 375/)
    // Device pixel ratio is never reported.
    expect(out).not.toMatch(/devicePixelRatio|dpr/i)
    // The width note: B and C are not inside a drawing.
    expect(out).toContain('keyframed across widths')
    expect(out).toContain('ask which width the instruction is for')

    // Only drawing points: no width note.
    controller.bind(doc)
    clickAt(img, 131.2, 74.8)
    await settle()
    const only = controller.expand('Here: [Point A]')
    expect(blockLabels(only)).toEqual(['A'])
    expect(only).not.toContain('keyframed across widths')
    expect(only).toMatch(new RegExp(`render:\\s+page home, render ${ordinal + 1}`))
  })

  // ── AC-2420 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2420_a_point_in_an_svg_image_reports_user_space_through_object_fit_and_preserve_aspect_ratio', async () => {
    type Case = {
      name: string
      svg: string
      fit: string
      position?: string
      box: { left: number; top: number; width: number; height: number }
      click: [number, number]
      expect: [number, number]
    }
    const B = (width: number, height: number) => ({ left: 100, top: 50, width, height })
    const cases: Case[] = [
      // contain letterboxes 320×86 into 320×172, 43px down.
      { name: 'contain origin', svg: MARK_SVG, fit: 'contain', box: B(320, 172), click: [100, 93], expect: [0, 0] },
      { name: 'contain far corner', svg: MARK_SVG, fit: 'contain', box: B(320, 172), click: [420, 179], expect: [320, 86] },
      { name: 'contain feature', svg: MARK_SVG, fit: 'contain', box: B(320, 172), click: [131.2, 117.8], expect: [31.2, 24.8] },
      // cover in 160×86 keeps scale 1 and centres, cropping 80px each side.
      { name: 'cover', svg: MARK_SVG, fit: 'cover', box: B(160, 86), click: [220, 74.8], expect: [200, 24.8] },
      // fill hands the drawing a 320×172 viewport; its own `meet` letterboxes inside it.
      { name: 'fill + meet origin', svg: MARK_SVG, fit: 'fill', box: B(320, 172), click: [100, 93], expect: [0, 0] },
      { name: 'fill + meet far corner', svg: MARK_SVG, fit: 'fill', box: B(320, 172), click: [420, 179], expect: [320, 86] },
      { name: 'fill + meet feature', svg: MARK_SVG, fit: 'fill', box: B(320, 172), click: [131.2, 117.8], expect: [31.2, 24.8] },
      { name: 'fill + xMinYMin meet', svg: svgOf(' preserveAspectRatio="xMinYMin meet"'), fit: 'fill', box: B(320, 172), click: [131.2, 74.8], expect: [31.2, 24.8] },
      { name: 'fill + none stretches', svg: svgOf(' preserveAspectRatio="none"'), fit: 'fill', box: B(640, 172), click: [162.4, 99.6], expect: [31.2, 24.8] },
    ]

    controller.setActive(true)
    for (const c of cases) {
      controller.bind(doc) // a fresh render: the per-asset cache is cleared
      svgFor = () => ({ ok: true, body: c.svg })
      fit = { objectFit: c.fit, objectPosition: c.position ?? '50% 50%' }
      withBox(img, c.box)
      clickAt(img, c.click[0], c.click[1])
      await settle()
      const [point] = controller.list()
      expect(point.drawing, c.name).toMatchObject({ asset: 'assets/mark.svg', viewBox: [0, 0, 320, 86] })
      expect(point.drawing.x, c.name).toBeCloseTo(c.expect[0], 3)
      expect(point.drawing.y, c.name).toBeCloseTo(c.expect[1], 3)
    }

    // Still an <img>; nothing is inlined to resolve the point.
    expect(doc.querySelector('img')).toBe(img)
    expect(doc.querySelector('svg')).toBeNull()

    // An asset that cannot be fetched: no svg row, every other frame reported.
    for (const broken of [
      () => ({ ok: false, body: '' }),
      () => ({ ok: true, body: '<svg xmlns="http://www.w3.org/2000/svg"><text>no viewBox</text></svg>' }),
    ]) {
      controller.bind(doc)
      svgFor = broken
      fit = { objectFit: 'fill', objectPosition: '50% 50%' }
      withBox(img, B(320, 86))
      clickAt(img, 131.2, 74.8)
      await settle()
      const out = controller.expand('[Point A]')
      expect(out).toContain('Point A — inside image node 0.1')
      expect(out).not.toContain('svg user space')
      expect(out).toMatch(/node-relative:\s+\(31\.2, 24\.8\) of 320×86/)
      expect(out).toMatch(/viewport:\s+\(131\.2, 74\.8\) at width/)
    }
  })

  // ── AC-2421 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2421_near_names_anchor_lines_with_signed_distances_and_never_snaps', async () => {
    controller.setActive(true)
    // User space (10, 21): 2.4u below the digit's cap-top at 62 − 0.7·62 = 18.6.
    clickAt(img, 110, 71)
    await settle()
    const [point] = controller.list()

    // Raw position, not moved onto the line.
    expect(point.drawing.x).toBeCloseTo(10, 6)
    expect(point.drawing.y).toBeCloseTo(21, 6)

    // Exactly what the platform's anchor vocabulary computes for the same input.
    const fonts = Object.fromEntries(MEASUREMENT.fonts.map((f) => [f.key, f]))
    const expected = anchors.nearestAnchors(MEASUREMENT.nodes, fonts, { x: 10, y: 21 }, { x: 160, y: 43 })
    expect(point.near).toEqual(expected)
    for (const line of point.near) expect(anchors.ANCHOR_NAMES).toContain(line.anchor)
    // Both axes are reported.
    expect(point.near.some((l: { axis: string }) => l.axis === 'y')).toBe(true)
    expect(point.near.some((l: { axis: string }) => l.axis === 'x')).toBe(true)

    const out = controller.expand('Move it to [Point A]')
    const nearRow = out.split('\n').find((l) => /^\s+near:/.test(l))!
    expect(nearRow).toMatch(/cap-top of "1" \(2\.4u above\)/)
    expect(out).toMatch(/svg user space:\s+\(10, 21\)/)
    // Every entry is `<line> (<n>u <above|below|left|right>)`, direction matching axis.
    const entries = nearRow.replace(/^\s+near:\s+/, '').split(/,\s(?=[^)]*\()/)
    expect(entries.length).toBe(point.near.length)
    point.near.forEach((line: { label: string; axis: string; delta: number }, i: number) => {
      const side =
        line.axis === 'y' ? (line.delta < 0 ? 'above' : 'below') : line.delta < 0 ? 'left' : 'right'
      expect(entries[i]).toBe(`${line.label} (${Math.round(Math.abs(line.delta) * 10) / 10}u ${side})`)
    })

    // That the browser is served these same modules (not a copy), and that the
    // un-injected measure path agrees with measure_drawing, is proved
    // behaviourally in `reconciliation-marked-points-served-modules.test.ts`.

    // Measurement fails: no near row, no invented lines, other rows intact.
    controller.bind(doc)
    measureImpl = async () => {
      throw new Error('no canvas')
    }
    clickAt(img, 110, 71)
    await settle()
    expect(controller.list()[0].near).toEqual([])
    const unmeasured = controller.expand('[Point A]')
    expect(unmeasured).not.toMatch(/^\s+near:/m)
    expect(unmeasured).toMatch(/svg user space:\s+\(10, 21\)/)
    expect(unmeasured).toMatch(/node-relative:/)

    // A point not inside a drawing has no near row.
    controller.bind(doc)
    measureImpl = async () => MEASUREMENT
    clickAt(copy, 20, 20)
    await settle()
    expect(controller.expand('[Point A]')).not.toMatch(/^\s+near:/m)
  })

  // ── AC-2422 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2422_only_referenced_points_expand_typed_references_resolve_and_unknown_stay_literal', async () => {
    controller.setActive(true)
    clickAt(img, 131.2, 74.8)
    clickAt(copy, 20, 10)
    clickAt(copy, 300, 30)
    await settle()
    expect(controller.list().map((p: { label: string }) => p.label)).toEqual(['A', 'B', 'C'])

    // No reference at all: sent unchanged, nothing marked sent.
    const plain = 'Make the headline bolder.'
    expect(controller.expand(plain)).toBe(plain)
    expect(controller.list()).toHaveLength(3)
    expect(doc.querySelectorAll('.fc-point.is-sent')).toHaveLength(0)

    // B's pill deleted; A as a pill (twice, once spaced/lowercase), C typed, Q unknown.
    const draft = 'Move [Point A] to point c, then [ point a ] again; ignore Point Q.'
    const out = controller.expand(draft)
    expect(out).toContain(HEADING)
    expect(blockLabels(out)).toEqual(['A', 'C'])
    expect(out).not.toContain('Point B —')
    expect(out).not.toContain('Point Q —')
    const prose = out.slice(0, out.indexOf(HEADING))
    expect(prose).toContain('Point Q')
    expect(prose).toContain('Move Point A to point c')
  })

  // ── AC-2424 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2424_points_last_one_turn_marks_grey_out_on_send_and_the_next_render_clears_them', async () => {
    controller.setActive(true)
    clickAt(copy, 20, 10)
    clickAt(copy, 200, 30)
    await settle()
    const firstOrdinal = controller.getRenderOrdinal()
    const sentOut = controller.expand('Align [Point A] with [Point B]')
    expect(blockLabels(sentOut)).toEqual(['A', 'B'])

    // No live points; an old letter no longer expands.
    expect(controller.list()).toEqual([])
    expect(controller.expand('[Point A] again')).toBe('[Point A] again')

    // Still visible, greyed, no controls, not draggable.
    for (const label of ['A', 'B']) {
      const mark = markOf(label) as HTMLElement
      expect(mark).not.toBeNull()
      expect(mark.classList.contains('is-sent')).toBe(true)
    }
    expect(decl(doc, '.fc-point.is-sent', 'opacity')).toBe('0.4')
    expect(decl(doc, '.fc-point.is-sent', 'filter')).toBe('grayscale(1)')
    expect(decl(doc, '.fc-point.is-sent .fc-point__btn', 'display')).toBe('none')
    const cross = markOf('A')!.querySelector('.fc-point__x')!
    pointer('pointerdown', 20, 10, cross)
    pointer('pointermove', 300, 300)
    pointer('pointerup', 300, 300)
    expect((markOf('A') as HTMLElement).style.left).toBe('20px')

    // Until the next render the greyed marks are still on screen and still hold
    // their letters, so a point placed now is the only live one but takes the
    // lowest letter no mark on screen uses — C, not A.
    box.set('')
    clickAt(copy, 400, 30)
    expect(controller.list().map((p: { label: string }) => p.label)).toEqual(['C'])
    expect(box.get().trim()).toBe('[Point C]')
    expect(controller.expand('[Point A]')).toBe('[Point A]')

    // The next render removes every mark, greyed ones included, and advances the number.
    controller.bind(doc)
    expect(doc.querySelectorAll('.fc-point')).toHaveLength(0)
    expect(controller.list()).toEqual([])
    // With every mark gone, lettering starts again at Point A.
    box.set('')
    clickAt(copy, 50, 20)
    expect(controller.list().map((p: { label: string }) => p.label)).toEqual(['A'])
    expect(box.get().trim()).toBe('[Point A]')
    const next = controller.expand('[Point A]')
    expect(next).toMatch(new RegExp(`render:\\s+page home, render ${firstOrdinal + 1}`))
  })

  // ── AC-2425 ─────────────────────────────────────────────────────────────────

  it('test_UAT_AC2425_published_and_standalone_edit_renders_and_the_bridge_are_unchanged', async () => {
    const MARKERS = ['fc-points', 'fc-point', 'data-fc-points']

    // Published render and builder-less edit render carry none of it.
    const { id } = await cmdPublish('acme', { cwd, message: 'pub' })
    const published = await cmdRender('acme', { cwd, source: id })
    expect(published.outDir).toContain('published')
    const edit = await cmdRender('acme', { cwd, edit: true })
    for (const dir of [published.outDir, edit.outDir]) {
      const bytes = allBytes(dir)
      expect(bytes).toContain(HEADLINE)
      for (const marker of MARKERS) expect(bytes, `${dir}: ${marker}`).not.toContain(marker)
    }

    // Nothing in the preview until the mode is on.
    const overlayStyles = () =>
      [...doc.querySelectorAll('style')].filter((s) => s.textContent?.includes('.fc-point'))
    expect(overlayStyles()).toHaveLength(0)
    expect(doc.querySelector('.fc-points')).toBeNull()

    // On: the overlay appears in the SAME document — no re-render.
    const sameDoc = doc
    const sentinel = doc.createElement('i')
    sentinel.id = 'still-here'
    doc.body.append(sentinel)
    controller.setActive(true)
    expect(controller.getRenderOrdinal()).toBe(1)
    expect(overlayStyles()).toHaveLength(1)
    expect(doc.querySelector('.fc-points')).not.toBeNull()
    expect(doc.body.hasAttribute('data-fc-points')).toBe(true)
    clickAt(copy, 20, 10)
    expect(markOf('A')).not.toBeNull()
    expect(sameDoc.getElementById('still-here')).toBe(sentinel)

    // Off: every trace gone, and a segment click opens its editor.
    controller.setActive(false)
    expect(overlayStyles()).toHaveLength(0)
    expect(doc.querySelector('.fc-points')).toBeNull()
    expect(doc.querySelector('.fc-point')).toBeNull()
    expect(doc.body.hasAttribute('data-fc-points')).toBe(false)
    const opened: string[] = []
    const bridge = mountL1EditBridge(doc, (hit) => opened.push(hit.kind))
    const ev = clickAt(copy, 20, 10)
    expect(opened).toEqual(['copy'])
    expect(ev.defaultPrevented).toBe(true)
    bridge.destroy()
  })
})

// ── AC-2423 — the real chat panel and composer ────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-44d0a572 — the pill and the composer', () => {
  it('test_UAT_AC2423_bubble_shows_the_pill_turn_carries_the_expansion_and_pills_survive_cut_and_paste', async () => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'story44d0-chat-'))
    try {
      cmdNew('acme', { cwd })
      seedPage(cwd, 'acme')
      const { outDir } = await cmdRender('acme', { cwd, edit: true })
      const dom = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8'), {
        url: PREVIEW_URL,
      })
      const doc = dom.window.document
      const copy = [...doc.querySelectorAll('*')].find(
        (n) => n.children.length === 0 && n.textContent === HEADLINE,
      )!
      withBox(copy, { left: 0, top: 0, width: 600, height: 40 })

      const { createChatPanel } = await import('../apps/control-app/src/builder/chat.js')
      const sent: string[] = []
      // Wired exactly as `app.js` wires it: the controller writes into the real
      // composer, and the panel expands through the controller on the way out.
      let chat: ReturnType<typeof createChatPanel>
      const controller = createMarkedPoints({
        api: { resolveEditTarget, L1_EDIT_PAGE_ATTR, markedPoints, anchors, measureScript },
        insertToken: (token: string) => {
          const panel = chat.getChat()
          const current = panel.getInputMarkdown()
          panel.setInputMarkdown(`${current}${current === '' || /\s$/.test(current) ? '' : ' '}${token} `)
        },
      })
      chat = createChatPanel({
        transport: {
          streamPrompt: (_id: string, text: string) => {
            sent.push(text)
            return (async function* () {
              yield { kind: 'text', content: 'Done.' }
              yield { kind: 'done' }
            })()
          },
        },
        expandPrompt: (markdown: string) => controller.expand(markdown),
      })
      document.body.append(chat.element)
      chat.setSession({ sessionId: 'site-acme', turns: [], ready: true })
      controller.bind(doc)
      controller.setActive(true)

      const panel = chat.getChat()
      panel.setInputMarkdown('Move the st ')
      copy.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true, cancelable: true, clientX: 30, clientY: 12 }),
      )
      expect(panel.getInputMarkdown()).toContain('[Point A]')

      // Cut the pill out of the real composer, then paste it at a different position.
      const area = chat.element.querySelector('textarea')!
      area.value = 'Move the st please'
      area.dispatchEvent(new Event('input', { bubbles: true }))
      expect(markedPoints.referencedPointLabels(panel.getInputMarkdown(), ['A'])).toEqual([])
      area.value = 'Move [Point A] the st please'
      area.dispatchEvent(new Event('input', { bubbles: true }))
      const draft = panel.getInputMarkdown()
      expect(draft).toContain('[Point A]')

      await panel.send(draft)

      // The turn (what the assistant is told) carries the full expansion for A.
      expect(sent).toHaveLength(1)
      expect(sent[0]).toContain(HEADING)
      expect(sent[0]).toMatch(/^Point A — inside copy node 0\.0$/m)
      expect(sent[0]).toMatch(/node-relative:\s+\(30, 12\) of 600×40/)

      // The bubble keeps the short pill form.
      const said = panel.getMessages()
      expect(said[0]).toMatchObject({ role: 'user', markdown: draft })
      const bubbleText = chat.element.textContent ?? ''
      expect(bubbleText).toContain('[Point A]')
      expect(bubbleText).not.toContain(HEADING)

      controller.destroy()
      chat.destroy()
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })
})
