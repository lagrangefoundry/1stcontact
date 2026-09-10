// @vitest-environment jsdom
/**
 * BUG-72 — the Marked Points **chrome**: a label you can actually reach, and a
 * cross that sits on its disc.
 *
 * BOTH DEFECTS ARE THE SAME MISTAKE MADE TWICE: a position derived from
 * something other than where the thing actually is.
 *
 * THE LABEL faded once the pointer was more than one radius from the POINT —
 * but the label sits to the right of the point and carries its own `+` and `×`,
 * so the journey to a control crosses that radius before it arrives. The label
 * went out from under the cursor mid-approach, and a hidden label has no
 * pointer-events, so there was nothing left to hover.
 *
 * THE CROSS was the glyph `✕` centred by flexbox, which centres the LINE BOX
 * rather than the ink — off-centre by an amount that depends on whichever font
 * resolved, and therefore differently wrong per platform.
 *
 * WHAT THESE DRIVE is the same harness REQ-210's suite uses and for the same
 * reason: the overlay runs against the bytes `1c render --edit` actually wrote,
 * in a real DOM, driven by real pointer events. jsdom has no layout engine, so
 * the ONE thing a browser would have supplied — a box per element — is supplied
 * here, and the geometry under test is what the controller does with it.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { resolveEditTarget } from '../packages/framework/src/l1/edit-client'
import * as markedPoints from '../packages/framework/src/l1/marked-points'
import * as anchors from '../packages/site-schema/src/anchors'
import { measureScript } from '../tools/generate/src/cli/capture/measure-svg'
import { L1_EDIT_PAGE_ATTR } from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'

const HEADLINE = 'A painted band.'
const PREVIEW_URL = 'https://builder.test/preview/acme/edit/'

function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  }
  home.l1.root = root
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

/** Give one element the box a browser would have measured. */
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

let createMarkedPoints: (opts?: Record<string, unknown>) => never

beforeAll(async () => {
  ;({ createMarkedPoints } = await import('../apps/control-app/src/builder/points.js'))
})

describe('BUG-72 — the mark you can reach, and the cross that is centred', () => {
  let cwd: string
  let dom: JSDOM
  let doc: Document
  let controller: ReturnType<typeof createMarkedPoints>
  let copy: Element

  const api = { resolveEditTarget, L1_EDIT_PAGE_ATTR, markedPoints, anchors, measureScript }

  /** The point every test places, in document coordinates. */
  const AT = { x: 200, y: 200 }

  /** Move the pointer, optionally reporting a different element as the target. */
  function pointerTo(clientX: number, clientY: number, on: Element = doc.documentElement): void {
    on.dispatchEvent(
      new dom.window.MouseEvent('pointermove', { bubbles: true, clientX, clientY }),
    )
  }

  const mark = () => doc.querySelector('.fc-point[data-point="A"]')!
  const isFresh = () => mark().classList.contains('is-fresh')

  /**
   * One declaration out of the overlay's own injected stylesheet.
   *
   * READ FROM THE DECLARATION TEXT, because jsdom's CSSOM exposes only a subset
   * of properties as accessors — `margin-left` and `inset` among the missing —
   * and a silently-undefined accessor would make this assertion pass for the
   * wrong reason.
   */
  function decl(selector: string, prop: string): string {
    const text = rule(selector).cssText
    const found = text.match(new RegExp(`(?:^|;)\\s*${prop}:\\s*([^;]+)`))
    if (!found) throw new Error(`no ${prop} in ${selector} { ${text} }`)
    return found[1].trim()
  }

  /** A declaration block out of the overlay's own injected stylesheet. */
  function rule(selector: string): CSSStyleDeclaration {
    for (const sheet of [...doc.styleSheets] as CSSStyleSheet[]) {
      for (const each of [...(sheet.cssRules ?? [])] as CSSStyleRule[]) {
        if (each.selectorText === selector) return each.style
      }
    }
    throw new Error(`no rule for ${selector}`)
  }

  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'bug72-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    dom = new JSDOM(readFileSync(path.join(outDir, 'index.html'), 'utf8'), { url: PREVIEW_URL })
    doc = dom.window.document
    doc.elementFromPoint = () => null
    copy = [...doc.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === HEADLINE,
    )!
    withBox(copy, { left: 0, top: 0, width: 600, height: 400 })
    controller = createMarkedPoints({ api })
    controller.bind(doc)
    controller.setActive(true)
    copy.dispatchEvent(
      new dom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: AT.x,
        clientY: AT.y,
      }),
    )
  })

  afterEach(() => {
    controller.destroy()
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_BUG-72_a_fresh_label_survives_the_journey_to_its_own_controls', () => {
    expect(isFresh()).toBe(true)

    // THE JOURNEY. The label runs rightward from the point and its `×` is the
    // far end of it — comfortably past the single 64px radius the old rule
    // measured, which is exactly why the label used to vanish mid-approach.
    pointerTo(AT.x + 120, AT.y)
    expect(isFresh()).toBe(true)

    // ARRIVAL. A pointer resting on the mark's own chrome has plainly not left
    // it, whatever the arithmetic says — so the label stays open for as long as
    // it takes to press the control, which is the whole reason it is there.
    const drop = doc.querySelector('.fc-point[data-point="A"] [data-act="delete"]')!
    pointerTo(AT.x + 4000, AT.y + 4000, drop)
    expect(isFresh()).toBe(true)

    // And the control it went there for still works.
    drop.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(doc.querySelector('.fc-point[data-point="A"]')).toBeNull()
  })

  it('test_UAT_FC_BUG-72_a_pointer_that_genuinely_leaves_still_fades_it', () => {
    // The reach is generous where the label is and tight everywhere else, so
    // REQ-210's behaviour is kept rather than traded away: leaving still fades.
    pointerTo(AT.x - 120, AT.y)
    expect(isFresh()).toBe(false)

    controller.destroy()
    controller = createMarkedPoints({ api })
    controller.bind(doc)
    controller.setActive(true)
    copy.dispatchEvent(
      new dom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: AT.x,
        clientY: AT.y,
      }),
    )
    expect(isFresh()).toBe(true)
    // Vertically the label is only its own height tall; there is no journey to
    // protect, so straying is straying.
    pointerTo(AT.x + 40, AT.y + 120)
    expect(isFresh()).toBe(false)
  })

  it('test_UAT_FC_BUG-72_the_cross_is_geometry_rather_than_a_glyph', () => {
    const x = mark().querySelector('.fc-point__x')!
    // NO TEXT AT ALL. Nothing about where the cross lands can depend on which
    // font resolved, because no font is consulted.
    expect(x.textContent).toBe('')
    const bars = x.querySelectorAll('.fc-point__bar')
    expect(bars).toHaveLength(2)

    // The disc is inset equally on all four sides of a SQUARE box, so its
    // centre is the mark's own origin.
    expect(decl('.fc-point__x', 'width')).toBe(decl('.fc-point__x', 'height'))
    // `inset` and `border-radius` are shorthands jsdom exposes only through the
    // declaration text, so the declaration is what is read. A SINGLE `inset`
    // value is the assertion that matters: equal on all four sides of a square
    // box puts the disc's centre exactly on the mark's origin.
    expect(decl('.fc-point__x::before', 'border-radius')).toBe('50%')
    expect(decl('.fc-point__x::before', 'inset')).toMatch(/^-?[\d.]+px$/)

    // And each bar is pulled back by exactly half its own size from that same
    // centre — centred by construction rather than by a glyph's metrics.
    const bar = (prop: string) => Number.parseFloat(decl('.fc-point__bar', prop))
    expect(decl('.fc-point__bar', 'left')).toBe('50%')
    expect(decl('.fc-point__bar', 'top')).toBe('50%')
    expect(bar('margin-left')).toBeCloseTo(-bar('width') / 2, 6)
    expect(bar('margin-top')).toBeCloseTo(-bar('height') / 2, 6)
  })
})
