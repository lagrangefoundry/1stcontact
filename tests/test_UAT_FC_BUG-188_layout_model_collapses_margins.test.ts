/**
 * BUG-188 — the L1 gate's layout model diverged from the browser on the same
 * served document.
 *
 *   1. The renderer emits every `container` as flex/grid, but a `box` with
 *      children, and the root inside `body`, is a plain block. A block lets its
 *      first in-flow child's top margin collapse through its own top edge. The
 *      model never did this. On www.bluelotusintegralhealing.com the root and
 *      every band pinned to it sat 84px lower in Chromium, while sampleFidelity
 *      read 0.009px.
 *   2. Every `escape` the verdict quoted came from the content-robustness probe
 *      (copy grown 2.5×), and the finding sentence did not say so. A 2.5×
 *      magnitude was read as what the browser draws.
 *
 * Driven through the public `tools/generate/src` surface on hand-built
 * documents. Nothing internal is mocked.
 */
import { describe, expect, it } from 'vitest'
import {
  contentRobustnessProbe,
  evaluateLayout,
  onSampleProbe,
  sampleFidelityProbe,
} from '../tools/generate/src'
import { layoutCollisions } from '../tools/generate/src/cli/gate-core'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const W = 1280

/** A band pinned at page y `y` (one keyframe, held across the ladder). */
function pinnedPanel(id: string, y: number, height: number): L1Node {
  return {
    kind: 'box',
    id,
    axes: { surfaceFill: '#224e7a' },
    geometry: { keyframes: [{ at: 320, x: 0, y, width: W, height }] },
  }
}

/** An in-flow node carrying a top margin (`place: 'flow'` leading offset). */
function marginTop(node: L1Node, y: number, height?: number): L1Node {
  return {
    ...node,
    geometry: { place: 'flow', keyframes: [{ at: 320, x: 0, y, width: W, ...(height !== undefined ? { height } : {}) }] },
  } as L1Node
}

function textRun(text: string): L1Node {
  return { kind: 'text', text, axes: { color: '#111827', fontFamily: 'Arial', fontSizePx: 16, fontWeight: 400 } }
}

function mkDoc(root: L1Node): L1Document {
  const doc: L1Document = { widths: LADDER, background: '#ffffff', root }
  const result = validateL1(doc)
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return doc
}

const boxAt = (doc: L1Document, path: string) => evaluateLayout(doc, W).boxes.get(path)!

/** A container (flex column) holding one run — the shape of the served `section-bg-0`. */
function flowSection(y: number): L1Node {
  return marginTop({ kind: 'container', layout: 'stack', children: [textRun('Hero copy')] } as L1Node, y)
}

describe('BUG-188 — the layout model collapses margins as the browser does', () => {
  it('test_UAT_FC_BUG-188_a_first_child_margin_moves_the_root_and_its_pinned_bands', () => {
    // The reproduction's shape: a root box holding pinned bands, then a section
    // whose 84px top margin collapses out of the root in a browser.
    const doc = mkDoc({
      kind: 'box',
      children: [pinnedPanel('box-0', 0, 400), pinnedPanel('box-1', 966, 300), flowSection(84)],
    })
    expect(boxAt(doc, '0').y).toBe(84)
    // The bands are absolute to the root, so they move with it.
    expect(boxAt(doc, '0.0').y).toBe(84)
    expect(boxAt(doc, '0.1').y).toBe(966 + 84)
    // The section is where it always was: its margin is the root's now, not twice.
    expect(boxAt(doc, '0.2').y).toBe(84)
  })

  it('test_UAT_FC_BUG-188_sample_fidelity_reports_the_shift_against_the_reference', () => {
    const doc = mkDoc({
      kind: 'box',
      children: [pinnedPanel('box-0', 0, 400), flowSection(84)],
    })
    // The reference paints the band at y 0 at every width.
    const panel: ValueElement = {
      text: '',
      role: 'separator',
      a11yRole: 'separator',
      color: '',
      fontFamily: '',
      fontSizePx: 0,
      fontWeight: 0,
      textless: true,
      surfaceFill: '#224e7a',
      box: { x: 0, y: 0, width: W, height: 400 },
    }
    const projections: StateProjection[] = [W].map((width) => ({
      engine: 'chromium',
      viewport: { width, height: 900 },
      state: 'rest',
      manifest: { source: `t:${width}`, viewport: { width, height: 900 }, sections: [], elements: [panel] },
    }))
    const oracle: MultiStateCapture = { url: 'http://bug188.test/', notes: [], projections }
    const report = sampleFidelityProbe(doc, oracle, { tolerancePx: 2 })
    expect(report.pass).toBe(false)
    expect(report.maxDelta).toBeCloseTo(84, 5)
  })

  it('test_UAT_FC_BUG-188_no_collapse_where_padding_flex_or_absolute_separates_the_edges', () => {
    // Top padding separates the root's edge from its child's margin.
    const padded = mkDoc({
      kind: 'box',
      padding: { topPx: 10 },
      children: [pinnedPanel('box-0', 0, 400), flowSection(84)],
    } as L1Node)
    expect(boxAt(padded, '0').y).toBe(0)
    expect(boxAt(padded, '0.0').y).toBe(0)
    expect(boxAt(padded, '0.1').y).toBe(10 + 84)

    // A container is flex: its children's margins stay inside it.
    const flex = mkDoc({
      kind: 'container',
      layout: 'stack',
      children: [pinnedPanel('box-0', 0, 400), flowSection(84)],
    } as L1Node)
    expect(boxAt(flex, '0').y).toBe(0)
    expect(boxAt(flex, '0.0').y).toBe(0)
    expect(boxAt(flex, '0.1').y).toBe(84)

    // A pinned box is a new formatting context: nothing passes through it.
    const pinnedParent = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'box',
          geometry: { keyframes: [{ at: 320, x: 0, y: 200, width: W, height: 500 }] },
          children: [flowSection(40)],
        } as L1Node,
      ],
    })
    expect(boxAt(pinnedParent, '0').y).toBe(0)
    expect(boxAt(pinnedParent, '0.0').y).toBe(200)
    expect(boxAt(pinnedParent, '0.0.0').y).toBe(240)
  })

  it('test_UAT_FC_BUG-188_a_nested_chain_collapses_to_the_largest_margin_once', () => {
    // root > box (margin 30) > section (margin 50), then a sibling run.
    const doc = mkDoc({
      kind: 'box',
      children: [marginTop({ kind: 'box', children: [flowSection(50)] } as L1Node, 30), textRun('After')],
    })
    // max(30, 50) = 50 — not 80 — and applied at the root.
    expect(boxAt(doc, '0').y).toBe(50)
    expect(boxAt(doc, '0.0').y).toBe(50)
    expect(boxAt(doc, '0.0.0').y).toBe(50)
    // The run after it follows the section's bottom, not a doubled margin.
    const section = boxAt(doc, '0.0.0')
    expect(boxAt(doc, '0.1').y).toBeCloseTo(section.y + section.height, 5)
  })

  it('test_UAT_FC_BUG-188_a_grown_copy_finding_says_the_copy_was_grown', () => {
    // A run in a fixed-height pinned box: it fits at rest, overflows grown.
    const doc = mkDoc({
      kind: 'box',
      children: [
        {
          kind: 'box',
          geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 300, height: 60 }] },
          children: [textRun('A sentence that wraps once grown to two and a half times its length')],
        } as L1Node,
      ],
    })
    const grown = contentRobustnessProbe(doc, { scale: 2.5, widths: [W], heights: [900] })
    const rest = onSampleProbe(doc, { widths: [W], heights: [900] })
    const collisions = layoutCollisions({ onSample: rest, contentRobustness: grown })
    const robust = collisions.filter((c) => c.probe === 'contentRobustness')
    expect(robust.length).toBeGreaterThan(0)
    for (const c of robust) expect(c.detail).toMatch(/^at 1280px×900px, copy grown 2\.5×: /)
    for (const c of collisions.filter((c) => c.probe === 'onSample')) expect(c.detail).not.toContain('grown')
  })
})
