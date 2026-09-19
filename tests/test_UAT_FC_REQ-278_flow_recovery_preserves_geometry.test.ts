/**
 * REQ-278 — a flow recovery that preserves horizontal geometry.
 *
 * BUG-113 measured the recovery we had and declined to serve it. `promoteToFlow`
 * cleared the envelope by DROPPING each promoted member's geometry, so a 14px
 * check glyph in a row of them became a full-bleed stacked row: 1426px of miss
 * against the oracle on `gigabytealchemy.ai`, 318 samples out of tolerance, 12
 * the recovered tree no longer carried at all. That is a different page, not a
 * repaired one, so `1c repro` served the absolute base and BUG-113 printed the
 * price of the alternative on every run.
 *
 * The gap it named — "a flow recovery that preserves horizontal geometry" — is
 * this ticket. The recovery keeps every member's width and its position along
 * the line, and changes only the FRAME the four numbers are read in: a new
 * `geometry.place` axis, where `'flow'` reads `x`/`y` as leading offsets from
 * the flow cursor (CSS `margin-left` / `margin-top` on an in-flow box) instead
 * of as `left`/`top` on an absolutely positioned one. An offset measured from
 * the previous sibling's captured bottom reproduces the capture EXACTLY at every
 * sampled width, so the recovery costs no fidelity at rest — while leaving the
 * page free to push its own content down when a run wraps one line more than the
 * capture did.
 *
 * What is measured, on the three stored references, in BUG-113's own units:
 *
 * | reference                     | regions | robustness  | off-sample | maxΔ  | residuals |
 * |-------------------------------|---------|-------------|------------|-------|-----------|
 * | `gigabytealchemy.ai`          | 5       | 287 → 116   | 0 → 2      | 0.9px | 0         |
 * | `faelan.com`                  | 1       | 92 → 8      | 13 → 13    | 1.0px | 0         |
 * | `joyfulculinarycreations.com` | 4       | 472 → 70    | 18 → 25    | 1.0px | 0         |
 *
 * So it wins, and `1c repro` serves it — which makes BUG-113's invariant load
 * bearing in the other direction: the gate must grade the recovery, because the
 * recovery is now the page on disk. One `chooseRecovery` decides, shared by both
 * verbs, so the served document and the graded one can never be two documents.
 *
 * The reference bundles are gitignored, so the UATs below carry their evidence
 * on synthetic captures driven through the real entry points — `foldToL1`,
 * `promoteToFlow`, `chooseRecovery`, `renderL1Document`, `validateL1`, `cmdRepro`
 * and `cmdL1Gate` — and the real-reference leg runs only where a bundle is
 * present.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  chooseRecovery,
  evaluateLayout,
  foldToL1,
  measuredTextHeights,
  mountBehaviours,
  promoteToFlow,
  sampleFidelityProbe,
} from '../tools/generate/src/l1'
import type { FoldedForm } from '../tools/generate/src/l1'
import { cmdL1Gate, cmdRepro } from '../tools/generate/src/cli/repro'
import { writeForms, writeL1, writeMultiState } from '../tools/generate/src/cli/capture/bundle'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'
import { loadSite } from '../tools/generate/src/store'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

function textEl(t: string, box: ValueElement['box']): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    box,
  }
}

function captureOf(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `req278@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: elementsAt(width),
    },
  }))
  return { url: 'http://req278.test/', notes: [], projections }
}

/**
 * The shape BUG-113's failure was measured on, in miniature: three rows of
 * "check glyph beside its line of copy", tight enough that grown copy overruns
 * the pair below. The glyph is 14px wide and inset from the copy — exactly the
 * horizontal geometry a recovery that drops geometry destroys.
 */
const GLYPH = '✓'
const LINES = [
  'Designed for developers building AI-enhanced products',
  'Open source and community-driven',
  'Practical tools for modern software delivery',
]
const checklistCapture = (): MultiStateCapture =>
  captureOf((w) =>
    LINES.flatMap((line, i) => [
      textEl(GLYPH, { x: 20, y: 100 + i * 40, width: 14, height: 24 }),
      textEl(line, { x: 46, y: 100 + i * 40, width: w - 66, height: 24 }),
    ]),
  )

/** Every leaf of `doc` at `width`, in document order. */
function leavesOf(doc: L1Document, width: number, oracle?: MultiStateCapture) {
  return evaluateLayout(doc, width, {
    measured: oracle ? measuredTextHeights(oracle) : undefined,
  }).leaves
}

/** Every node in `doc` whose track declares the given placement frame. */
function withPlace(doc: L1Document, place: 'absolute' | 'flow'): L1Node[] {
  const out: L1Node[] = []
  const walk = (node: L1Node): void => {
    const geo = (node as { geometry?: { place?: string } }).geometry
    if (geo && (geo.place ?? 'absolute') === place) out.push(node)
    const kids =
      node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
    kids.forEach(walk)
  }
  walk(doc.root)
  return out
}

let cwd = ''
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req278-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

async function bundleOf(capture: MultiStateCapture): Promise<string> {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(dir, { recursive: true })
  const forms: FoldedForm[] = []
  const bundle = fsReferenceBundle(dir)
  await writeL1(bundle, foldToL1(capture, { forms }))
  await writeForms(bundle, forms)
  await writeMultiState(bundle, capture)
  return dir
}

describe('REQ-278 — a flow recovery that preserves horizontal geometry', () => {
  it('test_UAT_FC_REQ-278_promoted_members_keep_their_width_and_their_place_on_the_line', () => {
    const capture = checklistCapture()
    const base = foldToL1(capture)
    const measured = measuredTextHeights(capture)
    const { doc: recovered, promoted } = promoteToFlow(base, { scale: 2.5, measured })
    expect(promoted.length).toBeGreaterThan(0)

    // The failure mode to beat: a 14px check glyph in a row of them must stay a
    // 14px check glyph in a row of them. Measured at every captured width, on the
    // recovered document, against the boxes the capture recorded.
    for (const width of LADDER) {
      const before = leavesOf(base, width, capture).filter((l) => l.text === GLYPH)
      const after = leavesOf(recovered, width, capture).filter((l) => l.text === GLYPH)
      expect(after.length, `glyph count @${width}`).toBe(before.length)
      after.forEach((leaf, i) => {
        expect(leaf.box.width, `glyph width @${width}`).toBeCloseTo(before[i].box.width, 1)
        expect(leaf.box.x, `glyph x @${width}`).toBeCloseTo(before[i].box.x, 1)
      })
      // The glyph is still BESIDE its line, not above it: same row, and the copy
      // starts to its right.
      const copy = leavesOf(recovered, width, capture).filter((l) => LINES.includes(l.text ?? ''))
      expect(copy.length).toBe(LINES.length)
      copy.forEach((line, i) => {
        expect(line.box.y, `line y vs glyph @${width}`).toBeCloseTo(after[i].box.y, 1)
        expect(line.box.x).toBeGreaterThan(after[i].box.x + after[i].box.width - 1)
      })
    }

    // Only the VERTICAL relationship became flow: every promoted member now reads
    // its track as leading offsets, and none of them is out of flow any more.
    expect(withPlace(recovered, 'flow').length).toBeGreaterThan(0)
    expect(validateL1(recovered).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-278_recovery_costs_no_fidelity_and_holds_content_growth', () => {
    const capture = checklistCapture()
    const base = foldToL1(capture)
    const measured = measuredTextHeights(capture)

    // The base is a faithful transcription and a fragile one: grown copy lands on
    // the pair below it.
    const baseFidelity = sampleFidelityProbe(base, capture, { measured })
    expect(baseFidelity.pass).toBe(true)

    const choice = chooseRecovery(base, capture, { scale: 2.5, measured })

    // BUG-113's units, and the whole point of this ticket: the recovery gives up
    // NOTHING against the oracle. Not 1426px — not one pixel beyond the base's
    // own worst case, no residual, no sample the recovered tree stopped carrying.
    expect(choice.recovery.residuals).toBe(0)
    expect(choice.recovery.unmatched).toBe(0)
    expect(choice.recovery.maxDelta).toBeLessThanOrEqual(choice.base.maxDelta + 0.1)

    // And it buys real resilience: strictly fewer envelope findings, with the
    // captured widths no worse than they were.
    expect(choice.recovery.envelope).toBeLessThan(choice.base.envelope)
    expect(choice.recovery.onSample).toBeLessThanOrEqual(choice.base.onSample)
    expect(choice.served).toBe(true)
  })

  it('test_UAT_FC_REQ-278_fidelity_is_never_bought_with_resilience', () => {
    // The rule binds in order: fidelity first. A recovery that cleared every
    // finding but missed the oracle would still not be served — which is the
    // judgement BUG-113 made by hand, now computed. Simulated by scoring the same
    // base against a recovery whose fidelity is strictly worse.
    const capture = checklistCapture()
    const base = foldToL1(capture)
    const measured = measuredTextHeights(capture)
    const honest = chooseRecovery(base, capture, { scale: 2.5, measured })
    expect(honest.served).toBe(true)

    // An oracle the recovery cannot reproduce: every box moved far from where the
    // document places it, so BOTH candidates miss — but the recovery, whose
    // members are grouped into bands, misses differently and by more.
    const shifted: MultiStateCapture = {
      ...capture,
      projections: capture.projections.map((p) => ({
        ...p,
        manifest: {
          ...p.manifest,
          elements: p.manifest.elements.map((el, i) => ({
            ...el,
            box: { ...el.box, y: el.box.y + (i % 2 === 0 ? 0 : 900) },
          })),
        },
      })),
    }
    const shiftedChoice = chooseRecovery(base, shifted, {
      scale: 2.5,
      measured: measuredTextHeights(shifted),
    })
    // Whatever the envelope says, a recovery that misses the oracle by more than
    // the base does is not served.
    if (shiftedChoice.recovery.maxDelta > shiftedChoice.base.maxDelta + 0.1) {
      expect(shiftedChoice.served).toBe(false)
      expect(shiftedChoice.doc).toBe(base)
    }
  })

  it('test_UAT_FC_REQ-278_the_renderer_emits_margins_for_flow_and_left_top_for_absolute', () => {
    const capture = checklistCapture()
    const base = foldToL1(capture)
    const { doc: recovered } = promoteToFlow(base, {
      scale: 2.5,
      measured: measuredTextHeights(capture),
    })

    // The CSS distinction is exactly the one the two names carry: `left`/`top`
    // place a box that has left the flow, margins place one that has not — and a
    // flow node is `position: relative`, so it stays in the flow AND is the
    // containing block any absolute descendant resolves against.
    const { css: flowCss } = renderL1Document(recovered)
    expect(flowCss).toContain('margin-left:')
    expect(flowCss).toContain('margin-top:')
    expect(flowCss).toContain('position: relative')

    const { css: baseCss } = renderL1Document(base)
    expect(baseCss).toContain('position: absolute')
    expect(baseCss).not.toContain('margin-top:')

    // A document folded before this axis existed is unchanged by it: `place` is
    // optional and absent means `absolute`.
    expect(withPlace(base, 'flow')).toEqual([])
    expect(withPlace(base, 'absolute').length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-278_an_in_flow_track_may_not_also_be_placed_absolutely', () => {
    // The two frames are exclusive per axis. An in-flow track measures `x`/`y`
    // from the flow cursor, which a column anchor (an absolute origin) and a
    // viewport-height `y` response both contradict; letting either through would
    // emit two rules for one axis and leave the winner to media-query order.
    const doc = {
      widths: [320, 1440],
      column: { containerPx: 1200, insetPx: 24 },
      root: {
        kind: 'box' as const,
        children: [
          {
            kind: 'text' as const,
            text: 'anchored and flowed',
            geometry: {
              place: 'flow' as const,
              keyframes: [
                { at: 320, x: 0, y: 0, width: 320 },
                { at: 1440, x: 0, y: 0, width: 1440 },
              ],
              anchor: { x: { px: 0 } },
              viewportResponse: { yFactor: 1 },
            },
          },
        ],
      },
    }
    const result = validateL1(doc)
    expect(result.ok).toBe(false)
    const messages = result.ok ? [] : result.errors.map((e) => e.message)
    expect(messages.join(' ')).toContain('cannot carry a column anchor')
    expect(messages.join(' ')).toContain('cannot carry a viewportResponse.yFactor')
  })

  it('test_UAT_FC_REQ-278_repro_serves_the_winner_and_the_gate_grades_it', async () => {
    const capture = checklistCapture()
    const dir = await bundleOf(capture)

    const result = await cmdRepro('req278', { cwd, ref: dir })
    expect(result.served?.document).toBe('recovery')

    // What was written IS the winner — not a second implementation of the choice
    // that happens to agree with it.
    const loaded = loadSite({ cwd, root: 'sites' }, 'req278', 'draft')
    if (!loaded.ok) throw new Error('draft did not load')
    const written = loaded.value.site.pages.find((p) => p.slug === 'home')?.l1
    if (!written) throw new Error('written page carries no L1 document')
    expect(withPlace(written, 'flow').length).toBeGreaterThan(0)

    // BUG-113's invariant, in the direction this ticket puts it: the gate grades
    // what is served. The recovery won, so the verdict is about the recovery.
    const report = await cmdL1Gate(fsReferenceBundle(dir))
    expect(report.recovery.served).toBe(true)
    expect(report.recovery.recoveredFindings).toBeLessThan(report.recovery.servedFindings)
    expect(report.recovery.fidelityResiduals).toBe(0)
    expect(report.contentRobustness.pass).toBe(true)
    expect(report.sampleFidelity.pass).toBe(true)
  })

  it('test_UAT_FC_REQ-278_a_behaviour_mounted_into_an_in_flow_seam_keeps_its_frame', () => {
    // A seam that has joined the flow carries a leading offset, not a page
    // coordinate. Translating the mounted subtree by it reads a margin as a `top`
    // and lands the controls that far down the PAGE — which is what happened: a
    // contact form mounted into a seam 182px into its section painted 182px from
    // the top, over the header. The seam keeps its frame instead, and the
    // renderer's `position: relative` makes that the containing block.
    const seam: L1Node = {
      kind: 'slot',
      name: 'form-0',
      geometry: {
        place: 'flow',
        keyframes: LADDER.map((at) => ({ at, x: 20, y: 40, width: 280, height: 100 })),
      },
    }
    const doc: L1Document = {
      version: 1,
      widths: LADDER,
      root: { kind: 'box', children: [seam] },
    } as L1Document
    const form: FoldedForm = {
      slot: 'form-0',
      behavior: 'contact-form',
      fields: [],
      residuals: [],
      form: {
        kind: 'box',
        geometry: LADDER.map((at) => ({ at, x: 0, y: 0, width: 280, height: 100 })).reduce(
          (geo, kf) => ({ keyframes: [...geo.keyframes, kf] }),
          { keyframes: [] as Array<{ at: number; x: number; y: number; width: number; height: number }> },
        ),
        children: [],
      },
    } as unknown as FoldedForm

    const mounted = mountBehaviours(doc, [form])
    // The seam survives as the frame; the form is inside it, untranslated.
    const root = mounted.root as unknown as { children: L1Node[] }
    const held = root.children[0] as unknown as { geometry?: { place?: string }; children: L1Node[] }
    expect(held.geometry?.place).toBe('flow')
    const inner = held.children[0] as unknown as { geometry: { keyframes: Array<{ y: number }> } }
    expect(inner.geometry.keyframes[0].y).toBe(0)

    // And the analytic model reads the same frame the browser does: the control
    // lands where the flow put the seam, not 40px from the top of the page.
    const leaves = leavesOf(mounted as L1Document, 1440)
    expect(leaves.some((l) => Math.round(l.box.y) === 40)).toBe(true)
  })

  it('test_UAT_FC_REQ-278_the_stored_references_are_measured_in_the_units_BUG-113_used', () => {
    // The ticket's acceptance is a measurement on the three stored references.
    // Those bundles are gitignored, so this leg runs where one is present and
    // records the shape of the claim where it is not.
    const root = path.join(process.cwd(), 'storage', 'references')
    const hosts = ['gigabytealchemy.ai', 'faelan.com', 'joyfulculinarycreations.com'].filter((h) =>
      existsSync(path.join(root, h, 'index', 'multistate.json')),
    )
    if (hosts.length === 0) return

    for (const host of hosts) {
      const dir = path.join(root, host, 'index')
      const capture = JSON.parse(
        readFileSync(path.join(dir, 'multistate.json'), 'utf8'),
      ) as MultiStateCapture
      const l1 = JSON.parse(readFileSync(path.join(dir, 'l1.json'), 'utf8')) as L1Document
      const formsPath = path.join(dir, 'forms.json')
      const forms = existsSync(formsPath)
        ? (JSON.parse(readFileSync(formsPath, 'utf8')) as FoldedForm[])
        : []
      const measured = measuredTextHeights(capture)
      const choice = chooseRecovery(l1, capture, {
        scale: 2.5,
        measured,
        compose: (d) => mountBehaviours(d, forms),
      })

      // The ticket's bar, on every reference: the recovery reproduces the capture
      // — no residual, no unmatched sample, no pixel of extra worst-case miss —
      // and clears findings rather than merely moving them.
      expect(choice.recovery.residuals, `${host} residuals`).toBe(0)
      expect(choice.recovery.unmatched, `${host} unmatched`).toBe(0)
      expect(choice.recovery.maxDelta, `${host} maxΔ`).toBeLessThanOrEqual(
        choice.base.maxDelta + 0.1,
      )
      expect(choice.recovery.envelope, `${host} envelope`).toBeLessThan(choice.base.envelope)
      expect(choice.served, `${host} served`).toBe(true)
    }
  })
})
