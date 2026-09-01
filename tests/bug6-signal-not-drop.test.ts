/**
 * BUG-6 (B2) — `foldToL1` must SIGNAL every element it cannot yet express, never
 * silently drop it.
 *
 * The signal-not-drop behavior itself shipped baked into REQ-92's folder rebuild
 * (commit 9e92a339, owned by REQ-92): the fold no longer `continue`s past
 * text-free media/fields, pure-surface panels, or geometry-less runs — each
 * becomes a typed {@link FoldResidual} `{kind, reason, capturedAxes, widths}`, and
 * the l1-gate carries them in a `foldResiduals` channel kept separate from the
 * probes' mispairing/fidelity residuals.
 *
 * These UATs give BUG-6 its own matrix coverage of that contract. They deliberately
 * lock the clause REQ-92's own tests never exercise — **gate report separates
 * residuals from mispairing** — by driving `cmdL1Gate` end-to-end against a fixture
 * bundle, where REQ-92's tests only call `foldToL1`'s collector directly.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { foldToL1, type FoldedForm, type FoldResidual } from '../tools/generate/src'
import { writeMultiState } from '../tools/generate/src/cli/capture/bundle'
import { cmdL1Gate } from '../tools/generate/src/cli/repro'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** A width-tracking text element (has a box → folds to a real leaf). */
function textEl(width: number, overrides: Partial<ValueElement> & Pick<ValueElement, 'text'>): ValueElement {
  return {
    role: 'heading',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 700,
    lineHeightPx: 48,
    box: { x: 20, y: 100, width: width - 40, height: 48 },
    ...overrides,
  }
}

/** A text-free <img>: object-fit + intrinsic aspect, no faithful L1 leaf yet. */
function imageEl(width: number): ValueElement {
  return {
    text: '',
    role: 'image',
    color: '#000000',
    fontFamily: 'Inter',
    fontSizePx: 0,
    fontWeight: 400,
    textless: true,
    objectFit: 'cover',
    intrinsicAspect: 1.5,
    box: { x: 0, y: 300, width, height: 200 },
  }
}

/** A text-free form control — an accessible-named textbox. */
function fieldEl(): ValueElement {
  return {
    text: '',
    role: 'field',
    color: '#000000',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    textless: true,
    a11yRole: 'textbox',
    accessibleName: 'Email',
    box: { x: 20, y: 520, width: 240, height: 40 },
  }
}

/** Build a resting `MultiStateCapture` over the ladder from a per-width element list. */
function multiFromLadder(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: { source: `bug6@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 900 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug6-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** Write a fixture capture bundle carrying a multistate oracle; return its dir. */
async function bundleWith(multistate: MultiStateCapture): Promise<string> {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(dir, { recursive: true })
  await writeMultiState(fsReferenceBundle(dir), multistate)
  return dir
}

describe('BUG-6 — foldToL1 signals unexpressed elements instead of dropping them', () => {
  it('test_UAT_FC_BUG-6_no_element_silently_dropped', () => {
    // A capture mixing one real heading with a text-free image and a text-free
    // field. Every element must be accounted for — nothing vanishes without a
    // trace. REQ-93 changed *where* the control is accounted for, not whether:
    // it is no longer a residual, it is a `slot` seam with a bound behaviour.
    const residuals: FoldResidual[] = []
    const forms: FoldedForm[] = []
    const doc = foldToL1(
      multiFromLadder((w) => [textEl(w, { text: 'Real Heading' }), imageEl(w), fieldEl()]),
      { residuals, forms },
    )

    const leaves = doc.root.kind === 'box' ? (doc.root.children ?? []) : []
    expect(leaves.map((n) => (n.kind === 'text' ? n.text : n.kind))).toEqual(['Real Heading', 'slot'])

    // The image still has no L1 leaf → a typed residual. The control has a home.
    expect(residuals.map((r) => r.kind)).toEqual(['image'])
    expect(forms.map((f) => f.slot)).toEqual(['form-0'])
    expect(forms[0].fields.map((f) => f.label)).toEqual(['Email'])
  })

  it('test_UAT_FC_BUG-6_every_unexpressed_kind_is_a_typed_residual', () => {
    // image (media) and a geometry-less text run must each surface as a typed
    // residual carrying a reason, its captured pixel-mover axes, and the widths it
    // appeared at — the completeness signal, not an anonymous drop. (REQ-93: a
    // control with geometry is no longer among them — it becomes a mounted seam.)
    const residuals: FoldResidual[] = []
    foldToL1(
      multiFromLadder((w) => [
        textEl(w, { text: 'Real Heading' }),
        imageEl(w),
        // present at every width but never boxed → no keyframes → no leaf.
        { text: 'Ghost Run', role: 'body', color: '#111111', fontFamily: 'Inter', fontSizePx: 18, fontWeight: 400 },
        // a control with no box either — no seam to mount at, so still a residual.
        { ...fieldEl(), box: undefined },
      ]),
      { residuals },
    )

    const image = residuals.find((r) => r.kind === 'image')
    const field = residuals.find((r) => r.kind === 'field')
    const ghost = residuals.find((r) => r.kind === 'text')
    expect(image?.capturedAxes).toEqual(expect.arrayContaining(['objectFit', 'intrinsicAspect']))
    expect(field?.capturedAxes).toContain('accessibleName')
    expect(field?.reason).toMatch(/no geometry/i)
    expect(ghost?.reason).toMatch(/geometry/i)
    // Every residual names a reason and the widths it spans — no bare entries.
    for (const r of residuals) {
      expect(r.reason.length).toBeGreaterThan(0)
      expect(r.widths).toEqual(LADDER)
    }
  })

  it('test_UAT_FC_BUG-6_gate_surfaces_fold_residuals_separate_from_mispairing', async () => {
    // Acceptance clause: the gate report SEPARATES folder-power residuals from the
    // probes' mispairing/fidelity residuals. Drive the gate end-to-end over a bundle
    // whose oracle carries a text-free image beside faithful text.
    const ref = await bundleWith(multiFromLadder((w) => [textEl(w, { text: 'Front door heading' }), imageEl(w)]))
    const report = await cmdL1Gate(fsReferenceBundle(ref))

    // The image gap lands in `foldResiduals` — a typed, named framework-gap…
    const imageGap = report.foldResiduals.find((r) => r.kind === 'image')
    expect(imageGap).toBeDefined()
    expect(imageGap?.capturedAxes).toEqual(expect.arrayContaining(['objectFit']))

    // …in its OWN channel, distinct from the fidelity probe's residuals (a different
    // array of a different shape: dx/dy/dw deltas, never kind/capturedAxes). The
    // folder-power gap is never laundered into the mispairing bucket.
    expect(report.foldResiduals).not.toBe(report.sampleFidelity.residuals)
    for (const r of report.sampleFidelity.residuals) {
      expect(r).not.toHaveProperty('kind')
      expect(r).not.toHaveProperty('capturedAxes')
    }
    // The text folds faithfully, so the fidelity probe pairs it cleanly — the only
    // signal about the image is the fold residual, not a fidelity miss.
    expect(report.sampleFidelity.residuals.some((r) => r.text === '')).toBe(false)
  })

  it('test_UAT_FC_BUG-6_gate_clean_bundle_emits_no_fold_residuals', async () => {
    // The gap signal must be zero when everything is expressible: a pure-text oracle
    // yields an empty `foldResiduals` list — no false framework-gap noise.
    const ref = await bundleWith(multiFromLadder((w) => [textEl(w, { text: 'Only Heading' })]))
    const report = await cmdL1Gate(fsReferenceBundle(ref))
    expect(report.foldResiduals).toEqual([])
  })
})
