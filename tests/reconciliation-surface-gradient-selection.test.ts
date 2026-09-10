import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { EXTRACT_SCRIPT, flattenSignals, type RawSignals, type ValueManifest } from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-82eb6908 — AC-1611: **which** ancestor's gradient is
 * recorded as a run's surface gradient.
 *
 * Drives the real `EXTRACT_SCRIPT` under jsdom and the real `flattenSignals`.
 * Browser-free.
 *
 * There is no free-coded sibling for this criterion under any name:
 * `tests/reconcile-gradient-first-class.test.ts` carries AC-634/635/636/638 and no
 * ancestor-selection test, and `grep -rln "REQ-72" tests/` returns nothing. So this
 * file is the criterion's only evidence.
 *
 * Why the selection rule needs its own evidence, in the AC's own words: this is "the
 * one place the capture can be silently wrong in a way the **diff cannot detect**".
 * AC-636 compares the surface gradient once selected — pick the wrong ancestor and
 * both sides agree on a value that is not what paints, and the gate reads clean over
 * a wrong render. Every assertion below is therefore about the walk, not the compare.
 */

type Box = [x: number, y: number, w: number, h: number]

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, width: w, height: h, left: x, top: y, right: x + w, bottom: y + h, toJSON() {} }) as unknown as DOMRect

function extract(html: string, boxes: Record<string, Box>): RawSignals {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true })
  dom.window.Element.prototype.getBoundingClientRect = function () {
    const b = boxes[(this as Element).className || '']
    return b ? rect(...b) : rect(0, 0, 0, 0)
  }
  dom.window.Range.prototype.getBoundingClientRect = function () {
    const n = (this as Range).startContainer as Element
    const b = boxes[(n && n.className) || '']
    return b ? rect(b[0], b[1], b[2], Math.min(b[3], 24)) : rect(0, 0, 0, 0)
  }
  Object.defineProperty(dom.window.Element.prototype, 'scrollWidth', { configurable: true, get: () => 1280 })
  Object.defineProperty(dom.window.Element.prototype, 'scrollHeight', { configurable: true, get: () => 900 })
  const win = dom.window as unknown as { eval(s: string): unknown }
  return win.eval(EXTRACT_SCRIPT) as RawSignals
}

/** Two visually distinguishable gradients, so which one was picked is unambiguous. */
const INNER_GRAD = 'linear-gradient(90deg, rgb(255, 0, 0) 0%, rgb(0, 0, 255) 100%)'
const OUTER_GRAD = 'linear-gradient(180deg, rgb(0, 255, 0) 0%, rgb(255, 255, 0) 100%)'
const INNER_STOPS = ['#ff0000', '#0000ff']
const OUTER_STOPS = ['#00ff00', '#ffff00']

const BOXES: Record<string, Box> = {
  outer: [0, 0, 1280, 600],
  inner: [100, 100, 800, 300],
  run: [120, 120, 400, 24],
}

const manifest = (html: string, boxes: Record<string, Box> = BOXES): ValueManifest =>
  flattenSignals(extract(`<!doctype html><html><body>${html}</body></html>`, boxes), 'x')

const runNamed = (m: ValueManifest, text: string) => m.elements.find((e) => e.text === text)!
const stopsOf = (g: { stops?: Array<{ color: string }> } | null | undefined) =>
  (g?.stops ?? []).map((s) => s.color)

describe('story-82eb6908 — AC-1611 surface-gradient ancestor selection', () => {
  it('test_UAT_AC1611_the_nearest_painting_gradient_ancestor_wins', () => {
    // (a) Nested painting ancestors that each paint a gradient: the run sits on the
    // INNER one, so that is what its surface gradient must be. Recording the outer
    // would be a value both sides could agree on while the render differs.
    const m = manifest(
      `<section class="outer" style="background-image:${OUTER_GRAD}">` +
        `<div class="inner" style="background-image:${INNER_GRAD}">` +
        `<p class="run" style="color:rgb(0,0,0)">Nested run</p>` +
        `</div></section>`,
    )
    const surface = runNamed(m, 'Nested run').surfaceGradient

    expect(stopsOf(surface)).toEqual(INNER_STOPS)
    expect(surface!.angleDeg).toBe(90)
    // Not the outer one — the assertion that makes "nearest" load-bearing.
    expect(stopsOf(surface)).not.toEqual(OUTER_STOPS)
  })

  it('test_UAT_AC1611_a_text_clipped_gradient_is_skipped_and_lands_on_the_text_axis', () => {
    // (b) The nearest gradient ancestor clips its gradient to its own text, so it
    // paints no surface. The walk must pass over it and record the next qualifying
    // ancestor — and the skipped gradient must show up on the text-fill axis rather
    // than being lost.
    const m = manifest(
      `<section class="outer" style="background-image:${OUTER_GRAD}">` +
        `<h1 class="inner" style="background-image:${INNER_GRAD};-webkit-background-clip:text;background-clip:text">Clipped run</h1>` +
        `</section>`,
      { outer: BOXES.outer, inner: [100, 100, 800, 60] },
    )
    const run = runNamed(m, 'Clipped run')

    // The surface gradient came from the OUTER ancestor…
    expect(stopsOf(run.surfaceGradient)).toEqual(OUTER_STOPS)
    expect(run.surfaceGradient!.angleDeg).toBe(180)
    // …and the clipped one is on the text-fill axis instead (AC-634/635's), not
    // silently dropped.
    expect(stopsOf(run.gradient)).toEqual(INNER_STOPS)
  })

  it('test_UAT_AC1611_the_walk_stops_at_the_first_opaque_solid', () => {
    // (c) An opaque fill between the run and the gradient. That gradient never
    // shows, so it is not the surface — and recording it would describe a layer the
    // viewer cannot see.
    const m = manifest(
      `<section class="outer" style="background-image:${OUTER_GRAD}">` +
        `<div class="inner" style="background-color:rgb(255,255,255)">` +
        `<p class="run" style="color:rgb(0,0,0)">Blocked run</p>` +
        `</div></section>`,
    )

    expect(runNamed(m, 'Blocked run').surfaceGradient ?? null).toBeNull()
  })

  it('test_UAT_AC1611_a_run_with_no_gradient_ancestor_records_none', () => {
    // (d) No qualifying ancestor at all: none is recorded, rather than a fabricated
    // one. The guard that keeps the three clauses above from passing by accident.
    const m = manifest(
      `<section class="outer" style="background-color:rgb(240,240,240)">` +
        `<p class="run" style="color:rgb(0,0,0)">Plain run</p>` +
        `</section>`,
    )

    expect(runNamed(m, 'Plain run').surfaceGradient ?? null).toBeNull()
  })
})
