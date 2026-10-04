/**
 * BUG-195 — a run that is its own surface (a button: `surface.self`) is measured
 * by the probes with ONE procedure, not two.
 *
 * The fold places such a run's top at its LINE block, centred on its glyphs
 * (REQ-370 issue 4), and sizes it by those lines in its own `textHeights`. The
 * probes' measured height (`measuredTextHeights`, via `oracleBoxes`) took the
 * captured `box.height` instead, and that is the button's BORDER box. The probe
 * box was therefore line-box top + border-box height: a 43px run starting 14.5px
 * down a 43px button. The gate reported the label "15px below" its own backing
 * card (114 of 565 escape findings on www.hearingzone510.com), and that escape
 * came from the instrument, not from the page.
 *
 * The fixture is that page's `SCHEDULE AN APPOINTMENT` button at 320px, as
 * captured: border box `{y 313.875, h 43}`, 3px border, rendered glyphs
 * `{y 328.625, h 13}`, line height 13.5px.
 */
import { describe, expect, it } from 'vitest'
import {
  foldToL1,
  measuredTextHeights,
  onSampleProbe,
  type MultiStateCapture,
  type StateProjection,
  type ValueElement,
} from '../tools/generate/src'

const LADDER = [320, 768]
const HEIGHT = 800
const LABEL = 'SCHEDULE AN APPOINTMENT'
const BORDER = { widthPx: 3, color: '#2b5ea8', style: 'solid' }

function multiFrom(elementsAt: (w: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: HEIGHT },
    state: 'rest',
    manifest: { source: `bug195:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: HEIGHT } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** The captured button: its `box` is the border box, its glyphs sit centred in it. */
const button = (w: number): ValueElement => {
  const box = { x: w / 2 - 81.33, y: 313.875, width: 162.66, height: 43 }
  return {
    text: LABEL,
    role: 'link',
    color: '#ffffff',
    fontFamily: 'Arial',
    fontSizePx: 11,
    fontWeight: 700,
    lineHeightPx: 13.5,
    textAlign: 'center',
    box,
    renderedTextBox: { x: w / 2 - 70, y: 328.625, width: 140, height: 13 },
    surfaceFill: '#2b5ea8',
    borderRadiusPx: 0,
    border: BORDER,
    surface: { self: true, box, borderRadiusPx: 0, boxShadow: null, border: BORDER },
  }
}

const anchor = (w: number): ValueElement => ({
  text: 'Below the fold',
  role: 'text',
  color: '#111111',
  fontFamily: 'Arial',
  fontSizePx: 16,
  fontWeight: 400,
  lineHeightPx: 20,
  box: { x: 20, y: 600, width: w - 40, height: 20 },
})

const escapes = (r: { byWidth: Array<{ findings: Array<{ kind: string; detail?: string }> }> }) =>
  r.byWidth.flatMap((w) => w.findings.filter((f) => f.kind === 'escape'))

describe('BUG-195 — a self-surface run is measured by its lines, as the fold places it', () => {
  const ms = multiFrom((w) => [button(w), anchor(w)])

  it('test_UAT_FC_BUG-195_the_measured_height_of_a_button_label_is_its_line_block_not_the_button', () => {
    const measured = measuredTextHeights(ms)
    const track = measured.tracks.get(`${LABEL.toLowerCase()}#0`)
    expect(track).toBeDefined()
    // One line of 13.5px type, which is what the fold sizes the run by, and not
    // the button's 43px border box.
    for (const { height } of track!) {
      expect(height).toBeLessThan(43)
      expect(height).toBeCloseTo(13.5, 1)
    }
  })

  it('test_UAT_FC_BUG-195_a_button_label_does_not_escape_its_own_button', () => {
    const doc = foldToL1(ms)
    const measured = measuredTextHeights(ms)
    const found = escapes(onSampleProbe(doc, { measured, heights: [HEIGHT] })).filter((f) =>
      (f.detail ?? '').includes(LABEL),
    )
    expect(found).toEqual([])
  })
})
