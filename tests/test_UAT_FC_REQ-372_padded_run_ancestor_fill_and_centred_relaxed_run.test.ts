/**
 * REQ-372 — two independent residuals from the joyfulculinarycreations.com round.
 *
 * Issue 1 (fold): a padded run whose fill an ANCESTOR painted (`surface.self:
 * false`) is not a self-painting chip. Elementor nav links are `padding: 13px
 * 20px` anchors on a transparent `<nav>`; `surfaceFill` walks ancestors, so each
 * link reported the hero band's `#000000` and BUG-21's padded-control test took
 * it as the link's own plate, painting five opaque black plates over the hero
 * photograph. A padded `<button>` that paints itself (`surface.self: true`) keeps
 * the chip path.
 *
 * Issue 2 (renderer): a relaxed (`nowrapFromPx`) run grows past its captured width
 * from its LEFT edge whatever its alignment, so a centred run whose glyphs outgrow
 * the box drifts right by half the overflow. A centred run now keeps its captured
 * centre fixed, a right-aligned run its right edge; a left-aligned run is unchanged.
 *
 * Driven through the real `foldToL1` / `renderL1Document` entry points; the paint
 * half is measured in Chromium where an engine is available.
 */
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src'
import { createEngineDriver, engineAvailable, foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

function run(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'text', color: '#ffffff', fontFamily: 'Arial', fontSizePx: 16, fontWeight: 400, box, ...over }
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 800 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

type AnyNode = { kind: string; children?: AnyNode[] }
function textLeaves(doc: ReturnType<typeof foldToL1>): Array<Extract<L1Node, { kind: 'text' }>> {
  const out: AnyNode[] = []
  const walk = (nodes: AnyNode[]): void => {
    for (const n of nodes) {
      out.push(n)
      walk(n.children ?? [])
    }
  }
  walk((doc.root.children ?? []) as unknown as AnyNode[])
  return (out as unknown as L1Node[]).filter((n): n is Extract<L1Node, { kind: 'text' }> => n.kind === 'text')
}
function boxFills(doc: ReturnType<typeof foldToL1>): Array<{ fill?: string; width?: number }> {
  const out: Array<{ fill?: string; width?: number }> = []
  const walk = (nodes: AnyNode[]): void => {
    for (const n of nodes) {
      const b = n as unknown as { kind: string; axes?: { surfaceFill?: string }; geometry?: { keyframes: Array<{ at: number; width?: number }> } }
      if (b.kind !== 'text') out.push({ fill: b.axes?.surfaceFill, width: b.geometry?.keyframes.find((k) => k.at === 1280)?.width })
      walk(n.children ?? [])
    }
  }
  walk((doc.root.children ?? []) as unknown as AnyNode[])
  return out
}

/** The capture's own shape for "Meet the Chef": padded link, band fill, `surface.self: false`. */
const NAV_BOX = { x: 642, y: 70, width: 142, height: 46 }
const navLink = (w: number): ValueElement =>
  run('Meet the Chef', NAV_BOX, {
    a11yRole: 'link',
    surfaceFill: '#000000',
    paddingTopPx: 13,
    paddingBottomPx: 13,
    paddingLeftPx: 20,
    paddingRightPx: 20,
    surface: { self: false, box: { x: 0, y: 0, width: w, height: 800 }, borderRadiusPx: 0, boxShadow: null, border: null },
  })
const BUTTON_BOX = { x: 413, y: 600, width: 123, height: 50 }
const selfButton = (): ValueElement =>
  run('Book now', BUTTON_BOX, {
    a11yRole: 'button',
    surfaceFill: '#009966',
    borderRadiusPx: 8,
    paddingTopPx: 12,
    paddingBottomPx: 12,
    paddingLeftPx: 24,
    paddingRightPx: 24,
    surface: { self: true, box: BUTTON_BOX, borderRadiusPx: 8, boxShadow: null, border: null },
  })

describe('REQ-372 issue 1 — a padded run does not take its ancestor band fill as its own chip', () => {
  it('test_UAT_FC_REQ-372_padded_link_on_a_band_folds_with_no_surface_fill', () => {
    const doc = foldToL1(multiFrom((w) => [navLink(w), selfButton()]))
    const link = textLeaves(doc).find((t) => t.text === 'Meet the Chef')
    expect(link, 'the nav link survives as a text leaf').toBeDefined()
    expect(link!.axes?.surfaceFill, 'the band fill is not the link plate').toBeUndefined()
    // ...and no plate of that fill is painted at the link's own width instead.
    for (const b of boxFills(doc)) {
      if (b.fill === '#000000') expect(b.width, 'only a band-wide #000000 surface may exist').not.toBe(NAV_BOX.width)
    }
  })

  it('test_UAT_FC_REQ-372_self_painting_padded_button_keeps_its_chip', () => {
    const doc = foldToL1(multiFrom((w) => [navLink(w), selfButton()]))
    const button = textLeaves(doc).find((t) => t.text === 'Book now')
    expect(button!.axes?.surfaceFill).toBe('#009966')
    expect(button!.axes?.borderRadiusPx).toBe(8)
  })
})

/** A nowrap run at L1 `{x:255, width:40}` whose text is far wider than 40px. */
function relaxedDoc(textAlign: 'left' | 'center' | 'right'): L1Document {
  return {
    widths: [1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'text',
          id: 'run',
          text: 'WWWWWWWW',
          axes: { color: '#111111', fontFamily: 'Arial', fontSizePx: 20, fontWeight: 400, lineHeightPx: 24, textAlign, nowrapFromPx: 1280 },
          geometry: { keyframes: [{ at: 1280, x: 255, y: 40, width: 40 }] },
        },
      ],
    },
  }
}

const chromium = await engineAvailable('chromium')

async function renderedBox(doc: L1Document): Promise<{ x: number; width: number }> {
  const { html, css } = renderL1Document(doc)
  const page = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}${css}</style></head><body>${html}</body></html>`
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'req372-')), 'page.html')
  writeFileSync(file, page)
  const driver = await createEngineDriver('chromium')()
  try {
    await driver.navigate(pathToFileURL(file).href, { width: 1280, height: 900 })
    return await driver.query<{ x: number; width: number }>(`(() => {
      var el = Array.prototype.slice.call(document.querySelectorAll('*')).filter(function (n) {
        return !n.children.length && n.textContent === 'WWWWWWWW';
      })[0];
      var r = el.getBoundingClientRect();
      return { x: r.left, width: r.width };
    })()`)
  } finally {
    await driver.close()
  }
}

describe('REQ-372 issue 2 — a relaxed run grows about the edge its alignment names', () => {
  it('test_UAT_FC_REQ-372_centred_relaxed_run_is_pinned_by_its_captured_centre', () => {
    const { css } = renderL1Document(relaxedDoc('center'))
    expect(css).toContain('left: calc(255px + 40px / 2)')
    expect(css).toContain('translate: -50% 0')
    expect(css).toContain('min-width: 40px')
    const right = renderL1Document(relaxedDoc('right')).css
    expect(right).toContain('left: calc(255px + 40px)')
    expect(right).toContain('translate: -100% 0')
    // A left-aligned run keeps today's left-edge emission, byte for byte.
    const left = renderL1Document(relaxedDoc('left')).css
    expect(left).toContain('left: 255px')
    expect(left).not.toContain('translate:')
  })

  it.runIf(chromium)(
    'test_UAT_FC_REQ-372_centred_overflowing_run_paints_centred_on_its_captured_box',
    async () => {
      const centred = await renderedBox(relaxedDoc('center'))
      expect(centred.width, 'the fixture must overflow its 40px box').toBeGreaterThan(40)
      expect(centred.x + centred.width / 2).toBeCloseTo(275, 0)
      const righted = await renderedBox(relaxedDoc('right'))
      expect(righted.x + righted.width).toBeCloseTo(295, 0)
      const lefted = await renderedBox(relaxedDoc('left'))
      expect(lefted.x).toBeCloseTo(255, 0)
    },
    120000,
  )
})
