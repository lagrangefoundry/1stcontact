/**
 * REQ-97 — a text leaf declares its own **measure**.
 *
 * `text` was the only L1 leaf without `sizing`: `box`, `image`, `container` and
 * `control` all carry it. The consequence was that a paragraph could not cap its
 * own line length — the most fundamental control in typography — so every
 * constrained run had to be wrapped in a container whose only job was to hold a
 * `max-width`, filling the tree with nodes that carry no semantic meaning.
 *
 * Under REQ-96 (L1 is the sole owner of appearance; a behavior module ships no
 * CSS) anything L1 cannot express has to be painted by a module — exactly the
 * outcome REQ-96 exists to prevent. So the missing axis is a hole in the
 * contract, not only an authoring annoyance.
 *
 * These UATs pin the ticket's acceptance: the schema admits `sizing` on a text
 * run, the emitter turns it into `width` / `min-width` / `max-width`, a measured
 * run needs no wrapper, the analytic gate wraps against the measure rather than
 * the frame, and a folded reproduction — where capture never populates the field
 * — is untouched.
 */
import { describe, expect, it } from 'vitest'
import {
  l1TextSchema,
  validateL1,
  type L1Document,
  type L1Text,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { evaluateLayout } from '../tools/generate/src/l1'

const WIDTHS = [320, 768, 1440]

/** A long enough run that a 620px measure forces visibly more lines than 1200px. */
const PROSE =
  "XGD maintains a living spec of your software's intended behavior and tests the " +
  'running system against it on every change. You own that intent and the ' +
  'architecture; XGD owns the implementation.'

/** The declarations of one class's base rule (no media query) in a stylesheet. */
function baseDecls(css: string, cls: string): string[] {
  // The base rule is the first `.cls { … }` — media-query overrides come after
  // and are scoped inside `@media`, which this deliberately does not enter.
  const m = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(css)
  return m ? m[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** A one-run document whose single text node is the subject under test. */
function docWithText(text: L1Text): L1Document {
  return {
    widths: WIDTHS,
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [text],
    },
  }
}

describe('REQ-97 — text leaves declare their own measure', () => {
  it('test_UAT_FC_REQ-97_text_node_accepts_sizing_width', () => {
    const node = {
      kind: 'text',
      id: 'sub',
      text: PROSE,
      sizing: { width: { mode: 'fluid', maxPx: 620 } },
    }
    const parsed = l1TextSchema.safeParse(node)
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)

    // The whole axis-sizing shape, not just maxPx.
    for (const width of [
      { mode: 'fixed', px: 480 },
      { mode: 'hug' },
      { mode: 'fluid', minPx: 240, maxPx: 620 },
    ] as const) {
      expect(l1TextSchema.safeParse({ kind: 'text', text: 'x', sizing: { width } }).success).toBe(
        true,
      )
    }

    // Still strict: sizing does not open a freeform hole in the envelope.
    expect(
      l1TextSchema.safeParse({ kind: 'text', text: 'x', sizing: { width: { mode: 'wide' } } })
        .success,
    ).toBe(false)
    expect(
      l1TextSchema.safeParse({ kind: 'text', text: 'x', sizing: { width: { mode: 'fluid' }, q: 1 } })
        .success,
    ).toBe(false)

    // And the document envelope accepts a measured run end to end.
    const report = validateL1(
      docWithText({ kind: 'text', text: PROSE, sizing: { width: { mode: 'fluid', maxPx: 620 } } }),
    )
    expect(report.ok, JSON.stringify(report.ok ? [] : report.errors)).toBe(true)
  })

  it('test_UAT_FC_REQ-97_renderer_emits_width_min_and_max_for_a_measured_run', () => {
    const { html, css } = renderL1Document(
      docWithText({
        kind: 'text',
        id: 'sub',
        text: PROSE,
        sizing: { width: { mode: 'fluid', minPx: 240, maxPx: 620 } },
      }),
    )
    const cls = /<p class="([^"]+)"/.exec(html)?.[1]
    expect(cls, 'the measured run rendered as a <p> with a class').toBeTruthy()

    const decls = baseDecls(css, cls!)
    expect(decls).toContain('width: 100%')
    expect(decls).toContain('min-width: 240px')
    expect(decls).toContain('max-width: 620px')

    // A fixed measure emits the px width rather than 100%.
    const fixed = renderL1Document(
      docWithText({ kind: 'text', id: 'sub', text: PROSE, sizing: { width: { mode: 'fixed', px: 480 } } }),
    )
    const fixedCls = /<p class="([^"]+)"/.exec(fixed.html)![1]
    expect(baseDecls(fixed.css, fixedCls)).toContain('width: 480px')

    // A run with no sizing gains no sizing declarations — the field is opt-in.
    const bare = renderL1Document(docWithText({ kind: 'text', id: 'sub', text: PROSE }))
    const bareCls = /<p class="([^"]+)"/.exec(bare.html)![1]
    const bareDecls = baseDecls(bare.css, bareCls).join(';')
    expect(bareDecls).not.toMatch(/(^|;)\s*(min-|max-)?width:/)
  })

  it('test_UAT_FC_REQ-97_measured_run_needs_no_wrapper_container', () => {
    // The xgd.dev hero subhead, both ways: the wrapper the ticket describes, and
    // the run declaring its own measure. Same painted measure, one fewer node.
    const wrapped: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'container',
            id: 'sub-measure',
            layout: 'stack',
            sizing: { width: { mode: 'fluid', maxPx: 620 } },
            children: [{ kind: 'text', id: 'sub', text: PROSE }],
          },
        ],
      },
    }
    const direct = docWithText({
      kind: 'text',
      id: 'sub',
      text: PROSE,
      sizing: { width: { mode: 'fluid', maxPx: 620 } },
    })

    const wrappedOut = renderL1Document(wrapped)
    const directOut = renderL1Document(direct)

    // The wrapper is gone from the markup…
    expect(wrappedOut.html.match(/<div/g)!.length).toBe(directOut.html.match(/<div/g)!.length + 1)

    // …and the measure it used to carry is now on the run itself.
    const directCls = /<p class="([^"]+)"/.exec(directOut.html)![1]
    expect(baseDecls(directOut.css, directCls)).toContain('max-width: 620px')

    // The analytic gate agrees the two lay out the same: same leaf box width,
    // same wrapped height. The wrapper was pure ceremony.
    const w = evaluateLayout(wrapped, 1440)
    const d = evaluateLayout(direct, 1440)
    const wSub = w.leaves.find((l) => l.id === 'sub')!
    const dSub = d.leaves.find((l) => l.id === 'sub')!
    expect(dSub.box.width).toBe(wSub.box.width)
    expect(dSub.box.height).toBe(wSub.box.height)
  })

  it('test_UAT_FC_REQ-97_analytic_gate_wraps_against_the_measure_not_the_frame', () => {
    // A 1440-wide frame with a 620px measure must wrap to more lines — the
    // probe model mirrors the renderer, or a measured run reports phantom drift.
    const measured = evaluateLayout(
      docWithText({
        kind: 'text',
        id: 'sub',
        text: PROSE,
        axes: { fontSizePx: 19, lineHeightPx: 31 },
        sizing: { width: { mode: 'fluid', maxPx: 620 } },
      }),
      1440,
    )
    const unmeasured = evaluateLayout(
      docWithText({
        kind: 'text',
        id: 'sub',
        text: PROSE,
        axes: { fontSizePx: 19, lineHeightPx: 31 },
      }),
      1440,
    )
    const m = measured.leaves.find((l) => l.id === 'sub')!
    const u = unmeasured.leaves.find((l) => l.id === 'sub')!

    expect(m.box.width).toBe(620)
    expect(u.box.width).toBe(1440)
    expect(m.box.height).toBeGreaterThan(u.box.height)

    // Below the cap the measure is inert — max-width caps, it does not stretch.
    const narrow = evaluateLayout(
      docWithText({
        kind: 'text',
        id: 'sub',
        text: PROSE,
        axes: { fontSizePx: 19, lineHeightPx: 31 },
        sizing: { width: { mode: 'fluid', maxPx: 620 } },
      }),
      320,
    )
    expect(narrow.leaves.find((l) => l.id === 'sub')!.box.width).toBe(320)
  })

  it('test_UAT_FC_REQ-97_folded_reproductions_are_unaffected', () => {
    // Capture never populates `sizing` on a text run — it folds text as
    // absolutely-positioned with a geometry track — so a folded document renders
    // byte-identically to how it did before the axis existed. Pinned geometry
    // with no sizing is the shape every reproduction on disk carries.
    const folded: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        id: 'band',
        children: [
          {
            kind: 'text',
            id: 'run',
            text: PROSE,
            axes: { fontSizePx: 16, lineHeightPx: 26, color: '#314158' },
            geometry: {
              keyframes: WIDTHS.map((at) => ({ at, x: 24, y: 40, width: at - 48 })),
            },
          },
        ],
      },
    }
    const { css } = renderL1Document(folded)
    const sizingDecls = css
      .split(/[;{}\n]/)
      .map((d) => d.trim())
      .filter((d) => /^(min-|max-)?width:/.test(d) || /fit-content/.test(d))
    // The only width a folded run paints is its geometry keyframe track.
    expect(sizingDecls.filter((d) => !/^width: \d/.test(d) && !/^width: calc\(/.test(d))).toEqual([])

    // And the analytic gate sees the geometry width, unnarrowed.
    const evaluated = evaluateLayout(folded, 1440)
    expect(evaluated.leaves.find((l) => l.id === 'run')!.box.width).toBe(1440 - 48)
  })
})
