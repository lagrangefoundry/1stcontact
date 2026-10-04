/**
 * BUG-201 — a failing sample-fidelity probe never reached `gate.json`.
 *
 * On joyfulculinarycreations.com the served CSS hides the whole testimonial
 * section at 320 and 375. `1c l1-gate` saw it (`sampleFidelity.unmatched: 23`),
 * but the cross-gate report built its `layout.findings` from the envelope probes
 * alone, so the round read "92 backing surface(s) have left the content they
 * back" and nothing about a section missing on phones, and the console counted
 * the round as `unmeasured 0` on that population.
 *
 * The fixture is that defect in miniature: the served document is folded from a
 * page WITHOUT the section, and graded against an oracle that paints it at the
 * two phone widths only. Everything below runs the real fold, the real probes,
 * the real reconciliation and the real console arithmetic — and, for the
 * recovery half, the real `cmdL1Gate` over a bundle on disk, whose result is
 * exactly what `1c l1-gate --json` prints.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { acceptanceGate, foldToL1 } from '../tools/generate/src'
import { reconcileGates } from '../tools/generate/src/cli/gate'
import type { ReferenceCoverage } from '../tools/generate/src/cli/gate'
import { cmdL1Gate } from '../tools/generate/src/cli/gate-core'
import { writeForms, writeL1, writeMultiState } from '../tools/generate/src/cli/capture/bundle'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'
import type { FoldedForm } from '../tools/generate/src/l1'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import { unmeasuredOf } from '../tools/repro-console/src/unmeasured'

const LADDER = [320, 375, 768, 1280]
const PHONES = [320, 375]

function text(t: string, y: number): ValueElement {
  return {
    text: t,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 16,
    fontWeight: 400,
    lineHeightPx: 24,
    box: { x: 20, y, width: 260, height: 24 },
  }
}

const PAGE = [text('Welcome to the kitchen', 40), text('Book a class today', 120)]
const TESTIMONIAL = [text('What people are saying', 400), text('Dan H.', 460), text('Parent / CFO', 520)]

function capture(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `http://joyful.test/@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements: elementsAt(width),
    },
  }))
  return { url: 'http://joyful.test/', notes: [], projections }
}

/** The reference: the testimonial section painted at the phone widths. */
const oracle = (): MultiStateCapture => capture((w) => (PHONES.includes(w) ? [...PAGE, ...TESTIMONIAL] : PAGE))
/** What is served: a document that never draws it. */
const served = () => foldToL1(capture(() => PAGE))

const COVERAGE: ReferenceCoverage = {
  mirroredImages: 0,
  referencedImages: 0,
  unreferencedImages: [],
  sections: 2,
  pageHeightPx: 900,
  pxPerSection: 450,
  findings: [],
}
const VALUES = {
  deltas: [],
  matched: 2,
  unmatched: 0,
  unpairedActual: [],
  unpairedSections: [],
  unpairedActualSections: [],
  bandPaintActual: [],
  notComparableAxes: [],
}

const dirs: string[] = []
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})
function tmp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'bug201-'))
  dirs.push(dir)
  return dir
}

/** The cross-gate report, round-tripped through `gate.json` as the console reads it. */
function gateJson(): Record<string, any> {
  const l1Gate = acceptanceGate(served(), oracle())
  const report = reconcileGates({
    l1Gate,
    coverage: COVERAGE,
    perceptual: { meanDiff: 0.1, pctOverThreshold: 0.1, regions: [] },
    values: VALUES,
  })
  const file = path.join(tmp(), 'gate.json')
  writeFileSync(file, JSON.stringify(report, null, 2))
  return JSON.parse(readFileSync(file, 'utf8'))
}

describe('BUG-201 — content missing at a captured width is named in gate.json', () => {
  it('test_UAT_FC_BUG-201_unmatched_runs_are_missing_at_width_findings_first', () => {
    const gate = gateJson()

    expect(gate.verdict).toBe('structural-failure')
    // The probe travels into the artifact — it used to appear 0 times.
    expect(gate.sampleFidelity.pass).toBe(false)
    expect(gate.sampleFidelity.unmatched).toHaveLength(6)

    const missing = gate.layout.findings.filter((f: any) => f.kind === 'missing-at-width')
    expect(missing).toHaveLength(6)
    expect(missing.every((f: any) => f.probe === 'sampleFidelity')).toBe(true)
    expect(missing.map((f: any) => f.width)).toEqual([320, 320, 320, 375, 375, 375])
    expect(missing.map((f: any) => f.detail).join(' | ')).toContain('"What people are saying"')
    // Named FIRST: completeness is read before any collision class.
    expect(gate.layout.findings[0].kind).toBe('missing-at-width')
    expect(gate.layout.pass).toBe(false)
  })

  it('test_UAT_FC_BUG-201_diagnosis_leads_with_runs_not_drawn_per_width', () => {
    const gate = gateJson()

    expect(gate.diagnosis).toMatch(
      /^The acceptance gate failed: 3 run\(s\) the reference paints at width 320px are not drawn; 3 run\(s\) the reference paints at width 375px are not drawn/,
    )
    expect(gate.nextStep).toMatch(/^Draw each missing run at the width named/)
  })

  it('test_UAT_FC_BUG-201_unmatched_runs_count_into_the_unmeasured_population', () => {
    const gate = gateJson()
    const set = unmeasuredOf(gate)
    const populations = set.parts.find((p) => p.id === 'populations')

    expect(populations?.count).toBe(6)
    expect(populations?.detail).toContain('6 are runs the reference paints at a captured width')
    expect(set.total).toBe(6)

    // A report written before the block existed keeps the total it always had.
    const { sampleFidelity: _dropped, ...older } = gate
    expect(unmeasuredOf(older).parts.find((p) => p.id === 'populations')?.count).toBe(0)
  })

  it('test_UAT_FC_BUG-201_l1_gate_json_recovery_carries_its_findings_and_residuals', async () => {
    const dir = path.join(tmp(), 'bundle')
    mkdirSync(dir, { recursive: true })
    const bundle = fsReferenceBundle(dir)
    const forms: FoldedForm[] = []
    await writeL1(bundle, served())
    await writeForms(bundle, forms)
    await writeMultiState(bundle, oracle())

    // Exactly what `1c l1-gate --json` prints.
    const json = JSON.parse(JSON.stringify(await cmdL1Gate(bundle)))

    expect(json.sampleFidelity.unmatched).toHaveLength(6)
    expect(Array.isArray(json.recovery.findings)).toBe(true)
    expect(json.recovery.findings).toHaveLength(json.recovery.recoveredFindings)
    expect(Array.isArray(json.recovery.residuals)).toBe(true)
    expect(json.recovery.residuals).toHaveLength(json.recovery.fidelityResiduals)
    // The recovery cannot draw what the fold never emitted either — and says so.
    expect(json.recovery.unmatched).toHaveLength(6)
  })
})
