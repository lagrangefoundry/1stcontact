/**
 * REQ-117 — a captured width is a floor for a run that cannot wrap.
 *
 * The fold pins `width` to what the *reference* text measured. That is exactly
 * right while the text is the reference text, and silently destructive as soon
 * as anyone edits it. An operator renamed a heading, the save landed in the
 * draft and in both rendered channels, the editor's modal read the new string
 * back — and the page kept showing the old words.
 *
 * The captured box was 686px, the new string needed 743px, and the run is
 * painted the way display headings usually are: `background-clip: text` over a
 * gradient with a transparent `color`. Glyphs past the box fall outside the
 * background's painting area, and the element's own colour paints nothing, so
 * the tail is not clipped, not ellipsised and not spilling. It is simply never
 * drawn. Every visible signal said the edit had failed.
 *
 * `min-width` keeps the captured geometry as the floor and lets the box grow
 * with its content, so the paint area grows with it.
 *
 * The swap is gated on `nowrapFromPx` and that gate is the substance of these
 * tests: for a WRAPPING run the fixed width is load-bearing — it is what
 * decides the line breaks — and relaxing it would let an absolutely-positioned
 * run stretch to its shrink-to-fit width and reflow every line. So the floor
 * applies only at and above the width from which the reference stopped
 * wrapping, and nowhere below it.
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const LADDER_H: Record<number, number> = { 320: 800, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }

function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
}

/** Mark `el` as having rendered on `n` lines — what the fold reads to decide wrapping. */
function lines(el: ValueElement, n: number): ValueElement {
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 29 * n - 8 } }
}

function multi(
  specs: { width: number; height: number; elements: ValueElement[]; sections?: unknown[] }[],
): MultiStateCapture {
  const projections: StateProjection[] = specs.map((s) => ({
    engine: 'chromium',
    viewport: { width: s.width, height: s.height },
    state: 'rest',
    manifest: {
      source: `t:${s.width}x${s.height}`,
      elements: s.elements,
      sections: (s.sections ?? []) as never,
      viewport: { width: s.width, height: s.height },
    },
  })) as never
  return { url: 'http://fixture.test/', notes: [], projections } as never
}

/**
 * The width-ish declarations for one class, with the media width each sits under.
 *
 * Parsed rather than substring-matched on purpose: `min-width: 686px` CONTAINS
 * `width: 686px`, so `css.toContain('width: 686px')` passes whether the fix is
 * present or not. That false pass is exactly the shape of bug under test.
 */
function widthDecls(css: string, cls: string): { at: number | null; prop: string; value: string }[] {
  const out: { at: number | null; prop: string; value: string }[] = []
  let at: number | null = null
  for (const line of css.split('\n')) {
    const media = /^@media\s*\(min-width:\s*(\d+)px\)/.exec(line)
    if (media) {
      at = Number(media[1])
      continue
    }
    if (/^\}/.test(line)) {
      at = null
      continue
    }
    const rule = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(line)
    if (!rule) continue
    for (const decl of rule[1].split(';')) {
      const m = /^\s*(min-width|max-width|width)\s*:\s*(.+?)\s*$/.exec(decl)
      if (m) out.push({ at, prop: m[1], value: m[2] })
    }
  }
  return out
}

/** The same declarations, grouped by the rung (media width) they sit on. */
function byRung(
  decls: { at: number | null; prop: string; value: string }[],
): Map<number | null, { prop: string; value: string }[]> {
  const m = new Map<number | null, { prop: string; value: string }[]>()
  for (const d of decls) m.set(d.at, [...(m.get(d.at) ?? []), { prop: d.prop, value: d.value }])
  return m
}

/** The generated class carrying `text`, read off the rendered markup. */
function classOf(html: string, text: string): string {
  const m = new RegExp(`class="([^"]+)"[^>]*>${text}<`).exec(html)
  if (!m) throw new Error(`no element rendering ${JSON.stringify(text)}`)
  return m[1].split(/\s+/)[0]
}

describe('REQ-117 a nowrap run treats its captured width as a floor', () => {
  it('test_UAT_FC_REQ-117_an_unwrappable_run_emits_min_width_and_a_wrapping_one_does_not', () => {
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          // One line at every width — the display heading the operator edited.
          lines(run({ text: 'Gigabyte Alchemy', box: { x: 24, y: 100, width: 686, height: 90 } }), 1),
          // Wraps everywhere — its width decides its line breaks.
          lines(run({ text: 'A long paragraph of body copy', box: { x: 24, y: 300, width: 800, height: 87 } }), 3),
        ],
      })),
    )
    const doc = foldToL1(ms)
    const { css, html } = renderL1Document(doc)

    const pinned = widthDecls(css, classOf(html, 'Gigabyte Alchemy'))
    expect(pinned.length).toBeGreaterThan(0)
    // No hard pixel width survives on the run...
    expect(pinned.filter((d) => d.prop === 'width').every((d) => d.value === 'auto')).toBe(true)
    // ...and the captured geometry survives as the value of the floor, which is
    // what keeps an unedited page pixel-identical to before.
    expect(pinned.some((d) => d.prop === 'min-width' && d.value === '686px')).toBe(true)
    // Every floored rung ALSO resets `width`. Without that reset the rungs stop
    // overriding each other and the lowest rung's interpolation stays live far
    // outside its segment — the fitted line for 320→375 reaches 3190px at
    // 1280px wide. The bug is invisible in the property names alone, so it is
    // asserted per rung rather than in aggregate.
    for (const [at, ds] of byRung(pinned)) {
      if (!ds.some((d) => d.prop === 'min-width')) continue
      expect(ds.some((d) => d.prop === 'width' && d.value === 'auto'), `rung ${at ?? 'base'}`).toBe(true)
    }

    // The wrapping run keeps a hard width — relaxing it would reflow its lines.
    const flowing = widthDecls(css, classOf(html, 'A long paragraph of body copy'))
    expect(flowing.length).toBeGreaterThan(0)
    expect(flowing.every((d) => d.prop === 'width')).toBe(true)
  })

  it('test_UAT_FC_REQ-117_the_floor_begins_only_where_the_run_stops_wrapping', () => {
    // Three lines at 320/375, one from 768 up — so the width is load-bearing at
    // mobile and inert above it. A blanket swap would reflow the mobile layout;
    // a blanket refusal would leave the desktop heading truncating silently.
    const singleFrom = 768
    const ms = multi(
      LADDER.map((width) => ({
        width,
        height: LADDER_H[width],
        elements: [
          lines(
            run({ text: 'Designed for developers', box: { x: 24, y: 100, width: Math.min(414, width - 48), height: 24 } }),
            width >= singleFrom ? 1 : 3,
          ),
        ],
      })),
    )
    const doc = foldToL1(ms)
    const { css, html } = renderL1Document(doc)
    const decls = widthDecls(css, classOf(html, 'Designed for developers'))
    expect(decls.length).toBeGreaterThan(0)

    // Below the threshold the width is load-bearing: a hard pixel value, and no
    // floor. The base rule carries no media query and so is in force at mobile
    // too, which is why it counts as "below".
    for (const d of decls.filter((x) => x.at === null || x.at < singleFrom)) {
      expect(d.prop, `at ${d.at ?? 'base'}`).toBe('width')
      expect(d.value, `at ${d.at ?? 'base'}`).not.toBe('auto')
    }
    // At and above it, the floor — and the reset that keeps the rungs overriding.
    for (const [at, ds] of byRung(decls)) {
      if (at === null || at < singleFrom) continue
      expect(ds.some((d) => d.prop === 'min-width'), `rung ${at}`).toBe(true)
      expect(ds.some((d) => d.prop === 'width' && d.value === 'auto'), `rung ${at}`).toBe(true)
    }
    // Both sides of the threshold are actually exercised by this fixture.
    expect(decls.some((d) => d.prop === 'width' && d.value !== 'auto')).toBe(true)
    expect(decls.some((d) => d.prop === 'min-width')).toBe(true)
  })

})

/*
 * NOT COVERED HERE: that the swap never reaches a *container*.
 *
 * A box's width is structure — it sizes its children and clips its background —
 * so it must keep a hard width. That is enforced by a single explicit gate on
 * `node.kind` at the call site, and the wrapping-run assertion above is the only
 * part of it these fixtures can exercise.
 *
 * A test was written for it and then deleted: `foldToL1` emits no container with
 * captured geometry for any fixture cheap enough to build here (a section band
 * does not survive the fold as a box), so the only boxes in the tree carry no
 * width at all — and an assertion about which classes relax passed identically
 * with the gate removed. It could not fail, which is worse than absent: it reads
 * as coverage. Closing this properly needs a folded document with a real
 * container, which belongs with the repro-pipeline fixtures rather than here.
 */
