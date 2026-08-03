/**
 * Reconciliation UATs for story-24098299 —
 * "End-to-end 3-probe reproduction acceptance gate" (third span).
 *
 * `tests/reconciliation-3probe-gate.test.ts` carries AC-705..710 + AC-724 (the
 * three probes, the combined gate, demand-driven recovery, the diagnostic residual
 * shape and the idempotence identity); `tests/reconciliation-3probe-gate-
 * evaluator.test.ts` carries AC-734..737 (the evaluator's flow model, the
 * half-open breakpoint intervals, the backing-surface exception and the
 * fold-residual channel). This file carries the remaining three — the ACs that
 * govern *what the measure is taken over*:
 *
 *   AC-779  a responsive type-axis track resolves per viewport in the analytic
 *           model, mirroring the rendered cascade
 *   AC-780  repeated projections at one (width, state) key are partitioned into
 *           ladder and evidence, so a height probe cannot drain the measure
 *   AC-781  oracle text covered by a mounted behaviour slot is set aside and
 *           counted on the gate report — not graded, not dropped
 *
 * Each UAT drives a real boundary — `evalScalarTrack` / `expectedTextManifest` /
 * `foldToL1` / `oracleBoxes` / `sampleFidelityProbe` on the `tools/generate/src`
 * surface, `cmdL1Gate` on the command surface, and `run(argv)` on the `1c` CLI
 * surface. No internal helper is mocked; the only synthetic input is the capture
 * bundle each test writes to a temporary directory.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  evalScalarTrack,
  expectedTextManifest,
  foldToL1,
  oracleBoxes,
  sampleFidelityProbe,
} from '../tools/generate/src'
import { cmdL1Gate } from '../tools/generate/src/cli/repro'
import { run, writeMultiState } from '../tools/generate/src/cli'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'
import type { L1ScalarTrack } from '../packages/site-schema/src/index'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

// ── shared builders ───────────────────────────────────────────────────────────

/** A resting `MultiStateCapture` over the ladder from a per-width element list. */
function multiFromLadder(
  elementsAt: (width: number) => ValueElement[],
  height = 1600,
): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height },
    state: 'rest',
    manifest: {
      source: `fixture@${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A captured text run with a box — the fields the fold + probes read. */
function run_(
  text: string,
  box: NonNullable<ValueElement['box']>,
  over: Partial<ValueElement> = {},
): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 24,
    box,
    ...over,
  }
}

/** A captured text-free form control, named by the a11y tree (never an L1 leaf). */
function control(accessibleName: string, box: NonNullable<ValueElement['box']>): ValueElement {
  return {
    text: '',
    role: 'field',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    nameSource: 'placeholder',
    accessibleName,
    box,
  }
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'gate3-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Write a fixture capture bundle carrying a multistate oracle; return its dir. */
function bundleWith(multistate: MultiStateCapture, name = 'bundle'): string {
  const dir = path.join(cwd, name)
  mkdirSync(dir, { recursive: true })
  writeMultiState(dir, multistate)
  return dir
}

/** Invoke the `1c` CLI, capturing stdout, stderr and the resulting exit code. */
async function runCli(argv: string[]): Promise<{ code: number; out: string; err: string }> {
  const out: string[] = []
  const err: string[] = []
  const logSpy = vi
    .spyOn(console, 'log')
    .mockImplementation((...a: unknown[]) => void out.push(a.join(' ')))
  const errSpy = vi
    .spyOn(console, 'error')
    .mockImplementation((...a: unknown[]) => void err.push(a.join(' ')))
  const prev = process.exitCode
  process.exitCode = 0
  try {
    await run(argv)
    const code = typeof process.exitCode === 'number' ? process.exitCode : 0
    return { code, out: out.join('\n'), err: err.join('\n') }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
    process.exitCode = prev
  }
}

// ── AC-779 — a responsive type axis resolves per viewport ─────────────────────

/** The size the reference scales its hero heading to at each captured width. */
const HEADING_SIZE: Record<number, number> = {
  320: 36,
  375: 36,
  768: 48,
  1024: 60,
  1280: 66,
  1440: 72,
}

describe('story-24098299 — responsive type axes in the analytic model', () => {
  it('test_UAT_AC779_type_axis_track_resolves_per_viewport', () => {
    const track: L1ScalarTrack = {
      keyframes: LADDER.map((at) => ({ at, value: HEADING_SIZE[at] })),
    }

    // Every sampled ladder width evaluates to that width's OWN keyframe value —
    // the interval that STARTS at the breakpoint is the active one, so a sampled
    // width never returns the value held from the segment below it.
    for (const w of LADDER) expect(evalScalarTrack(track, w), `at ${w}px`).toBe(HEADING_SIZE[w])

    // Interior widths between keyframes interpolate linearly.
    expect(evalScalarTrack(track, 896)).toBeCloseTo(54, 6) // halfway 768→1024: 48→60
    expect(evalScalarTrack(track, 1360)).toBeCloseTo(69, 6) // halfway 1280→1440: 66→72

    // At or below the first keyframe the base value holds; at or above the last,
    // the final value holds.
    expect(evalScalarTrack(track, 320)).toBe(36)
    expect(evalScalarTrack(track, 200)).toBe(36)
    expect(evalScalarTrack(track, 1440)).toBe(72)
    expect(evalScalarTrack(track, 2000)).toBe(72)

    // A `snap` segment holds the LOWER keyframe's value across its own interval —
    // but the interval is half-open, so at the exact interior breakpoint the
    // segment starting there wins and the post-reflow value is returned.
    const snapped: L1ScalarTrack = {
      keyframes: [
        { at: 320, value: 36 },
        { at: 768, value: 48 },
        { at: 1440, value: 72 },
      ],
      segments: ['snap', 'interpolate'],
    }
    expect(evalScalarTrack(snapped, 500)).toBe(36) // held across [320, 768)
    expect(evalScalarTrack(snapped, 767)).toBe(36)
    expect(evalScalarTrack(snapped, 768)).toBe(48) // …never the held 36 at 768 itself
    expect(evalScalarTrack(snapped, 1104)).toBeCloseTo(60, 6) // interpolates above it

    // ── The projected expectation is per-viewport, not single-valued ───────────
    // A heading captured at 36px on mobile and 72px on desktop folds to a track;
    // the expectation projected from the reproduced document must carry the value
    // the browser actually paints at each viewport, or a correct responsive
    // reproduction reports a phantom "desktop size at mobile" delta.
    const HEADING = 'Gigabyte Alchemy'
    const TAGLINE = 'Static tagline'
    const doc = foldToL1(
      multiFromLadder((w) => [
        run_(HEADING, { x: 20, y: 40, width: w - 40, height: 80 }, { fontSizePx: HEADING_SIZE[w] }),
        // A genuinely static axis: constant across the ladder, so it carries no
        // track and must contribute its single scalar at every viewport.
        run_(TAGLINE, { x: 20, y: 400, width: w - 40, height: 30 }, { fontSizePx: 20 }),
      ]),
    )

    const atMobile = expectedTextManifest(doc, { width: 320, height: 900 })
    const atDesktop = expectedTextManifest(doc, { width: 1440, height: 900 })
    expect(atMobile.elements.find((e) => e.text === HEADING)!.fontSizePx).toBe(36)
    expect(atDesktop.elements.find((e) => e.text === HEADING)!.fontSizePx).toBe(72)
    // Resolving the document's flat axis instead would have expected 72 at 320 —
    // the phantom delta this AC exists to close.
    expect(atMobile.elements.find((e) => e.text === HEADING)!.fontSizePx).not.toBe(
      atDesktop.elements.find((e) => e.text === HEADING)!.fontSizePx,
    )

    // The static axis is unaffected: the same scalar at both viewports.
    expect(atMobile.elements.find((e) => e.text === TAGLINE)!.fontSizePx).toBe(20)
    expect(atDesktop.elements.find((e) => e.text === TAGLINE)!.fontSizePx).toBe(20)

    // …and every ladder width in between resolves to its own captured size.
    for (const w of LADDER) {
      const projected = expectedTextManifest(doc, { width: w, height: 900 })
      expect(projected.elements.find((e) => e.text === HEADING)!.fontSizePx, `at ${w}px`).toBe(
        HEADING_SIZE[w],
      )
    }
  })
})

// ── AC-780 — the ladder / evidence partition over repeated projections ────────

const ROWS = ['Front door heading', 'Second band copy', 'Third band copy']

/** A roomy three-run page over the ladder — the width ladder proper. */
function ladderCapture(): MultiStateCapture {
  return multiFromLadder((w) => [
    run_(ROWS[0], { x: 20, y: 100, width: w - 40, height: 48 }),
    run_(ROWS[1], { x: 20, y: 500, width: w - 40, height: 48 }),
    run_(ROWS[2], { x: 20, y: 900, width: w - 40, height: 48 }),
  ])
}

describe('story-24098299 — ladder / evidence partition', () => {
  it('test_UAT_AC780_height_probe_is_evidence_not_a_second_ladder_cell', () => {
    const ladder = ladderCapture()
    const doc = foldToL1(ladder)

    // A height probe: the SAME ladder width (768) re-shot at a second viewport
    // height. Its rows carry different boxes — the page reflowed at the taller
    // viewport — so admitting them would be visible twice over: as residuals
    // against the ladder cell's boxes AND as a second full set of oracle rows
    // whose reproduced-leaf queues were already drained.
    const withProbe: MultiStateCapture = structuredClone(ladder)
    const cell = ladder.projections.find((p) => p.viewport.width === 768)!
    withProbe.projections.push({
      engine: 'chromium',
      viewport: { width: 768, height: 2600 },
      state: 'rest',
      manifest: {
        source: 'probe@768x2600',
        sections: [],
        viewport: { width: 768, height: 2600 },
        elements: cell.manifest.elements.map((e) => ({
          ...e,
          box: { ...e.box!, y: e.box!.y + 300 },
        })),
      },
    })
    // Non-vacuous: the probe really does carry a full second set of rows, and
    // really does disagree with the ladder cell about where they sit.
    const probeRows = withProbe.projections[withProbe.projections.length - 1].manifest.elements
    expect(probeRows).toHaveLength(3)
    expect(probeRows[0].box!.y).not.toBe(cell.manifest.elements[0].box!.y)

    // The oracle is built from the width ladder only: the re-shot width still
    // contributes exactly the samples a single projection at that width does.
    const ladderSamples = oracleBoxes(ladder).filter((s) => s.width === 768)
    const probedSamples = oracleBoxes(withProbe).filter((s) => s.width === 768)
    expect(ladderSamples).toHaveLength(3)
    expect(probedSamples).toHaveLength(ladderSamples.length)
    expect(probedSamples).toEqual(ladderSamples)
    // …and the whole table is unchanged, not just that width's slice.
    expect(oracleBoxes(withProbe)).toEqual(oracleBoxes(ladder))

    // The reproduction has not changed, so it still gates clean: no coverage gaps
    // invented by the probe's rows, no residuals from their shifted boxes.
    const probed = sampleFidelityProbe(doc, withProbe, { tolerancePx: 2 })
    expect(probed.pass).toBe(true)
    expect(probed.residuals).toEqual([])
    expect(probed.unmatched).toEqual([])

    // Removing the height probe from the same oracle produces a byte-identical
    // report — the partition, not luck, is what makes the two agree.
    const plain = sampleFidelityProbe(doc, ladder, { tolerancePx: 2 })
    expect(JSON.stringify(probed)).toEqual(JSON.stringify(plain))
    expect(probed.maxDelta).toBe(plain.maxDelta)

    // Non-resting states are outside the measure entirely: a hover projection at
    // a width the ladder never sampled contributes no oracle samples at all.
    const withHover: MultiStateCapture = structuredClone(ladder)
    withHover.projections.push({
      engine: 'chromium',
      viewport: { width: 900, height: 1600 },
      state: 'hover',
      manifest: {
        source: 'hover@900',
        sections: [],
        viewport: { width: 900, height: 1600 },
        elements: [run_('Hover only label', { x: 20, y: 1300, width: 300, height: 40 })],
      },
    })
    expect(oracleBoxes(withHover)).toEqual(oracleBoxes(ladder))
    expect(oracleBoxes(withHover).some((s) => s.width === 900)).toBe(false)
    const hovered = sampleFidelityProbe(doc, withHover, { tolerancePx: 2 })
    expect(JSON.stringify(hovered)).toEqual(JSON.stringify(plain))
  })
})

// ── AC-781 — oracle text a mounted behaviour covers is set aside and counted ──

const SUBMIT = 'Send message'
const IN_SLOT = 'Contact form'

/**
 * A roomy page carrying one contact form: a page heading, a label that sits
 * *inside* the form's rect but is ordinary L1 text, two clustered controls, and
 * the reference's own submit chip.
 *
 * The fold groups the controls into one `slot` seam, unions the submit chip's box
 * into that seam and lifts the chip out of the page body into the behaviour's
 * `submit` slot (REQ-93). The chip's oracle text therefore has no reproduced leaf
 * to pair with — the canonical set-aside case.
 */
function mountedFormCapture(): MultiStateCapture {
  // The fields track the viewport like a real responsive form, so the seam the
  // fold pins around them never overruns the narrow end of the ladder.
  const field = (w: number): number => Math.min(400, w - 40)
  return multiFromLadder((w) => [
    run_('Front door heading', { x: 20, y: 100, width: w - 40, height: 48 }),
    // Inside the form's union rect, but a plain text run — still L1's to grade.
    run_(IN_SLOT, { x: 30, y: 710, width: 200, height: 24 }),
    control('Your name', { x: 20, y: 700, width: field(w), height: 50 }),
    control('Your email', { x: 20, y: 770, width: field(w), height: 50 }),
    // The reference's own submit chip: a painted run carrying text, near enough
    // to the field cluster to be claimed as that form's submit control.
    run_(SUBMIT, { x: 20, y: 840, width: 180, height: 44 }, { a11yRole: 'button' }),
  ])
}

/** The same page with no behaviour at all — nothing to set aside. */
function noFormCapture(): MultiStateCapture {
  return multiFromLadder((w) => [
    run_('Front door heading', { x: 20, y: 100, width: w - 40, height: 48 }),
    run_('Second band copy', { x: 20, y: 700, width: w - 40, height: 48 }),
  ])
}

describe('story-24098299 — mounted-behaviour set-aside', () => {
  it('test_UAT_AC781_mounted_oracle_text_is_set_aside_and_counted', async () => {
    const cap = mountedFormCapture()
    const ref = bundleWith(cap, 'mounted')
    const report = cmdL1Gate({ cwd, ref })

    // The fold really did mount a behaviour into a slot — the precondition that
    // makes this a set-aside rather than a coverage gap.
    expect(report.forms).toHaveLength(1)
    expect(report.forms[0].behavior).toBe('contact-form')
    // …and lifted the reference's own chip into that behaviour's `submit` slot,
    // so no L1 text leaf renders it any more.
    expect(report.forms[0].submit).toBeDefined()

    // ── Set aside: the chip's oracle text is its own reported class ────────────
    const setAside = report.sampleFidelity.mounted
    expect(setAside.length).toBeGreaterThan(0)
    expect(setAside.every((m) => m.text === SUBMIT)).toBe(true)
    // One entry per captured width — the class carries the width, like the other two.
    expect(setAside.map((m) => m.width).sort((a, b) => a - b)).toEqual(LADDER)
    // It appears in NEITHER of the graded lists.
    expect(report.sampleFidelity.residuals.some((r) => r.text === SUBMIT)).toBe(false)
    expect(report.sampleFidelity.unmatched.some((u) => u.text === SUBMIT)).toBe(false)

    // ── Does not fail the gate ────────────────────────────────────────────────
    expect(report.sampleFidelity.residuals).toEqual([])
    expect(report.sampleFidelity.unmatched).toEqual([])
    expect(report.sampleFidelity.pass).toBe(true)
    expect(report.pass).toBe(true)

    // ── Still measured where it pairs ─────────────────────────────────────────
    const doc = foldToL1(cap)
    // (a) An unpairable oracle run positioned OUTSIDE every slot rect is still a
    // coverage gap, not a set-aside — the exclusion is the slot rect, not
    // "anything unpairable".
    const withGhost = structuredClone(cap)
    withGhost.projections
      .find((p) => p.viewport.width === 768)!
      .manifest.elements.push(run_('Ghost row', { x: 20, y: 1300, width: 200, height: 40 }))
    const ghosted = sampleFidelityProbe(doc, withGhost, { tolerancePx: 2 })
    expect(ghosted.unmatched).toEqual([{ text: 'Ghost row', width: 768 }])
    expect(ghosted.mounted.every((m) => m.text === SUBMIT)).toBe(true)
    expect(ghosted.pass).toBe(false)

    // (b) Oracle text inside a slot rect that DOES pair with a reproduced leaf is
    // still graded — perturb its box and it surfaces as a residual.
    const withDrift = structuredClone(cap)
    const drifted = withDrift.projections
      .find((p) => p.viewport.width === 1440)!
      .manifest.elements.find((e) => e.text === IN_SLOT)!
    drifted.box!.y += 30
    const gradedInSlot = sampleFidelityProbe(doc, withDrift, { tolerancePx: 2 })
    expect(gradedInSlot.pass).toBe(false)
    expect(gradedInSlot.residuals).toHaveLength(1)
    expect(gradedInSlot.residuals[0].text).toBe(IN_SLOT)
    expect(gradedInSlot.residuals[0].width).toBe(1440)
    expect(gradedInSlot.residuals[0].dy).toBeCloseTo(30, 5)
    expect(gradedInSlot.unmatched).toEqual([])

    // ── Counted: the human-readable gate output states the count ──────────────
    const { code, out } = await runCli(['l1-gate', '--ref', ref])
    expect(code).toBe(0)
    const fidelityLine = out.split('\n').find((l) => l.includes('sample-fidelity'))!
    expect(fidelityLine, out).toBeDefined()
    // Labelled as covered by a mounted behaviour, on the sample-fidelity line…
    expect(fidelityLine).toContain(`${setAside.length} in mounted behaviour`)
    // …alongside, NOT merged into, the residual and unmatched counts.
    expect(fidelityLine).toContain('0 residual(s)')
    expect(fidelityLine).toContain('0 unmatched')
    expect(fidelityLine).toMatch(/PASS/)
    expect(out).toContain('3-probe gate on')

    // The JSON form carries the set-aside list as its own channel.
    const json = await runCli(['l1-gate', '--ref', ref, '--json'])
    expect(json.code).toBe(0)
    const parsed = JSON.parse(json.out)
    expect(parsed.pass).toBe(true)
    expect(parsed.sampleFidelity.mounted).toHaveLength(setAside.length)
    expect(parsed.sampleFidelity.residuals).toEqual([])
    expect(parsed.sampleFidelity.unmatched).toEqual([])

    // ── …and omits it when nothing was set aside ──────────────────────────────
    const bare = bundleWith(noFormCapture(), 'no-form')
    const bareReport = cmdL1Gate({ cwd, ref: bare })
    expect(bareReport.sampleFidelity.mounted).toEqual([])
    const bareOut = await runCli(['l1-gate', '--ref', bare])
    const bareLine = bareOut.out.split('\n').find((l) => l.includes('sample-fidelity'))!
    expect(bareLine, bareOut.out).toBeDefined()
    expect(bareLine).not.toMatch(/mounted behaviour/)
    expect(bareLine).toContain('0 unmatched')
  })
})
