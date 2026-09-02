/**
 * REQ-94 — cross-gate reconciliation (`1c gate`).
 *
 * The reproduction pipeline has three gates and, until this module, nothing that
 * compared them to each other:
 *
 *   - `l1-gate`     grades geometry + envelope. Deliberately blind to colour,
 *                   font, media and list styling (REQ-88): a green gate on a
 *                   visually incomplete page is designed behaviour, not a bug.
 *   - `values-diff` compares elements present in BOTH manifests. When the
 *                   reference manifest itself omits page substance, there is
 *                   nothing to raise a delta against.
 *   - `diff`        the perceptual eye. The only gate with no shared assumption
 *                   with the thing it grades.
 *
 * On `joyfulculinarycreations.com` the first two read clean while the third read
 * `mean 106.84 / 255, 80.3% of pixels over threshold` — a page that had not
 * reproduced at all, and an operator had to look at a screenshot to find out.
 *
 * This module makes the DISAGREEMENT a first-class finding. Two mechanisms:
 *
 *   1. {@link referenceCoverage} — cheap, browser-free proxies for "did we
 *      actually capture this page": mirrored image assets no manifest element
 *      references, and page height per captured section. Both numbers already
 *      existed in the bundle; neither was ever surfaced as a signal.
 *   2. {@link reconcileGates} — a perceptual FLOOR that fails regardless of what
 *      the value gates say, plus a verdict that names the likely cause. The
 *      distinction it draws is the one the operator actually needs: "the
 *      reproduction is wrong" and "the capture is incomplete" need different
 *      fixes and, before this, looked identical.
 *
 * Deliberately NOT part of the pass/fail: the value gates' own delta counts.
 * `1c values-diff` already exits non-zero on any delta and remains the sharp
 * instrument for a text-led page; this command exists to catch what the value
 * gates MISS, and folding their (routinely non-empty) output into its exit code
 * would make it a duplicate of a gate that already runs.
 */
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { readCapture, readMultiState } from './capture'
import type { ReferenceBundle } from '../store/reference-store'
import type {
  BrowserDriverFactory,
  MultiStateCapture,
  StateProjection,
  ValueManifest,
  ValuesDiffReport,
} from './capture'
import { cmdDiff } from './perceptual'
import type { PerceptualDiffReport } from './perceptual'
import { cmdValuesDiff } from './fidelity'
import { cmdL1Gate } from './repro'
import type { L1GateResult } from './repro'
import type { GlobalOptions } from './commands'
import { ensureDir, fsReferenceBundle } from '../store'
import type { RenderChannel } from '../store'
import type { ViewportName } from './shot'

// REQ-157 — the reconciliation MOVED to `gate-core.ts`, re-exported here so no
// caller had to move with it.
//
// WHY IT WENT. `1c gate` obtains its inputs from `cmdDiff` and `cmdValuesDiff`
// and writes `gate.json`, so this module needs `node:fs`, a loopback server and
// Playwright. Deciding what the gates MEAN needs none of those, and REQ-157 put
// that decision on a surface that runs in workerd. The command is a CALLER of
// the reconciliation now rather than its owner, which is what makes
// `check_fidelity` and `1c gate` the same verdict by construction.
export {
  PERCEPTUAL_MEAN_FLOOR,
  PERCEPTUAL_PCT_FLOOR,
  SECTION_DENSITY_PX,
  referenceCoverage,
  reconcileGates,
} from './gate-core'
export type {
  CoverageFinding,
  ReferenceCoverage,
  GateVerdict,
  PerceptualFloor,
  ReconcileInput,
  GateReport,
} from './gate-core'

import {
  PERCEPTUAL_MEAN_FLOOR,
  PERCEPTUAL_PCT_FLOOR,
  referenceCoverage,
  reconcileGates,
} from './gate-core'
import type { GateReport, GateVerdict, PerceptualFloor } from './gate-core'

const VERDICT_LABEL: Record<GateVerdict, string> = {
  pass: 'PASS',
  'structural-failure': 'FAIL — structural-failure',
  'capture-incomplete': 'FAIL — capture-incomplete',
  'reproduction-wrong': 'FAIL — reproduction-wrong',
  'unexplained-disagreement': 'FAIL — unexplained-disagreement',
}

/** Wrap a sentence-shaped paragraph to `width`, indented by `indent`. */
function wrap(text: string, indent: string, width = 92): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (line && (indent + line + ' ' + word).length > width) {
      lines.push(indent + line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(indent + line)
  return lines.join('\n')
}

/** The operator read: the three gates side by side, then the verdict. */
export function formatGateReport(report: GateReport, ref: string): string {
  const c = report.coverage
  const floorMark = report.perceptualBreach
    ? `  ✗ over floor (mean ≤ ${report.floor.mean}, pct ≤ ${report.floor.pct}%)`
    : `  ✓ within floor (mean ≤ ${report.floor.mean}, pct ≤ ${report.floor.pct}%)`

  const lines = [
    `cross-gate reconciliation on ${ref}: ${VERDICT_LABEL[report.verdict]}`,
    '',
    `  l1-gate      ${report.l1Pass ? 'PASS' : 'FAIL'}  (geometry + envelope; blind to colour/font/media by design)`,
    `  values-diff  ${report.values.deltas} delta(s) over ${report.values.matched} matched element(s), ${report.values.unmatched} unmatched`,
    `  perceptual   mean ${report.perceptual.meanDiff.toFixed(2)} / 255 · ${report.perceptual.pctOverThreshold.toFixed(1)}% of pixels over threshold · ${report.perceptual.regions} region(s)`,
    floorMark,
    '',
    '  reference coverage:',
    `    images     ${c.referencedImages} of ${c.mirroredImages} mirrored image asset(s) referenced by the reference manifest`,
    ...(c.unreferencedImages.length
      ? [`    unreferenced: ${c.unreferencedImages.slice(0, 6).join(', ')}${c.unreferencedImages.length > 6 ? `, …+${c.unreferencedImages.length - 6}` : ''}`]
      : []),
    `    sections   ${c.sections} across ${c.pageHeightPx}px (${c.pxPerSection} px/section)`,
    ...c.findings.map((f) => `    ⚠ ${f.kind}: ${f.detail}`),
    '',
    wrap(report.diagnosis, '  '),
    '',
    wrap(`next: ${report.nextStep}`, '  '),
  ]
  return lines.join('\n')
}

export interface GateOptions extends GlobalOptions {
  /** Site slug whose rendered draft is the *actual* side of both eyes. */
  slug?: string
  /** Which channel of our site to grade (default `draft`). */
  source?: RenderChannel
  /** Capture bundle directory — the reference, and the coverage subject. Required. */
  ref: string
  /** Grade at a named viewport size; absent → the default (≈ desktop) width. */
  size?: ViewportName
  /** Pre-shot actual PNG — short-circuits the browser for the perceptual eye. */
  actualImagePath?: string
  /** Pre-extracted actual manifest JSON — short-circuits the browser for the value eye. */
  actualManifestPath?: string
  /** Directory for the perceptual artifacts, the values report, and `gate.json`. */
  out?: string
  /** Override the provisional perceptual floor for this run. */
  floor?: Partial<PerceptualFloor>
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Fixed serve port; defaults to an ephemeral port. */
  port?: number
}

/**
 * Run all three gates against one bundle and reconcile them.
 *
 * The two browser-free gates (`l1-gate`, reference coverage) run FIRST so a
 * stale or half-captured bundle fails before a headless browser is ever spun up.
 * The two eyes then run sequentially — each does its own render → serve → read,
 * exactly as its own verb does, so `1c gate` grades the same artifacts an
 * operator would get from running the three commands by hand. The difference is
 * that their outputs are compared to each other rather than left in three
 * terminal scrollbacks.
 */
export async function cmdGate(opts: GateOptions): Promise<GateReport> {
  const refBundle = fsReferenceBundle(opts.ref)
  const l1Gate = await cmdL1Gate(refBundle)
  const coverage = await referenceCoverage(refBundle)

  const out = opts.out ? path.resolve(opts.out) : undefined
  if (out) ensureDir(out)

  const perceptual = await cmdDiff({
    ...opts,
    ref: opts.ref,
    actualImagePath: opts.actualImagePath,
    out,
  })
  const values = await cmdValuesDiff({
    ...opts,
    refBundleDir: opts.ref,
    actualManifestPath: opts.actualManifestPath,
    out: out ? path.join(out, 'values-diff.json') : undefined,
  })

  const report = reconcileGates({ l1Gate, coverage, perceptual, values, floor: opts.floor })
  if (out) writeFileSync(path.join(out, 'gate.json'), JSON.stringify(report, null, 2))
  return report
}
