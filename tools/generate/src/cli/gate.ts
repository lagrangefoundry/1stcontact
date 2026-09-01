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

/**
 * The perceptual floor. A reproduction over EITHER bound has failed no matter
 * what the value gates report.
 *
 * PROVISIONAL, and deliberately generous. DOC-21 §4 calls for these to be
 * calibrated against a human-labelled anchor set of (reference, render) pairs
 * tagged indistinguishable / not; that set does not exist yet. The defaults are
 * set from the two reproductions we have measured — `gigabytealchemy.ai` (a
 * reproduction an operator accepts) reads mean 2.12 / 2.6%, and
 * `joyfulculinarycreations.com` (a page that did not reproduce) reads 106.84 /
 * 80.3% — so anything between is unclassified rather than wrongly passed. Both
 * are overridable per run; neither is a claim about perceptual thresholds.
 */
export const PERCEPTUAL_MEAN_FLOOR = 8
export const PERCEPTUAL_PCT_FLOOR = 25

/**
 * Page height per captured section above which segmentation is treated as
 * suspect. DOC-13 §7 is explicit that a uniformly-styled page is correctly ONE
 * section, so a long band is not wrong by itself — this is a proxy reported as
 * evidence under an already-failing perceptual diff, never a finding on its own.
 * `gigabytealchemy.ai` segments at ~566 px/section; `joyfulculinarycreations.com`
 * at ~2450.
 */
export const SECTION_DENSITY_PX = 1200

/** One reference-coverage proxy that came back suspect. */
export interface CoverageFinding {
  kind: 'unreferenced-image' | 'section-density'
  /** Operator-facing sentence: what was measured and why it reads as a gap. */
  detail: string
}

/**
 * Cheap proxies for "did the capture actually record this page", read from the
 * bundle alone. Reported always; escalated to a verdict only when the perceptual
 * floor is breached (see {@link reconcileGates}).
 */
export interface ReferenceCoverage {
  /** Image assets the capture mirrored into the bundle. */
  mirroredImages: number
  /** Mirrored image assets some reference element carries as its media `src`. */
  referencedImages: number
  /** Mirrored image assets no reference element references, by local path. */
  unreferencedImages: string[]
  /** Sections the capture segmented the reference page into. */
  sections: number
  /** The reference page's full document height, from its own element boxes. */
  pageHeightPx: number
  /** `pageHeightPx / max(1, sections)` — the segmentation-density proxy. */
  pxPerSection: number
  findings: CoverageFinding[]
}

/**
 * What the reconciliation concluded.
 *
 * - `pass`                     — every gate this command owns is clear.
 * - `structural-failure`       — `l1-gate` itself failed; ordinary, pre-existing.
 * - `capture-incomplete`       — perceptual floor breached AND reference coverage
 *                                is suspect. The value gates are not wrong, they
 *                                are BLIND: they cannot raise a delta against
 *                                substance the capture never recorded.
 * - `reproduction-wrong`       — perceptual floor breached, coverage clean, and
 *                                the value gates do see deltas. They agree; the
 *                                values-diff already names what to fix.
 * - `unexplained-disagreement` — perceptual floor breached and nothing else sees
 *                                it. A framework gap: an axis that moves pixels
 *                                which the value manifest does not carry.
 */
export type GateVerdict =
  | 'pass'
  | 'structural-failure'
  | 'capture-incomplete'
  | 'reproduction-wrong'
  | 'unexplained-disagreement'

/** The floor a run was held to (echoed into the report so it is never implicit). */
export interface PerceptualFloor {
  mean: number
  pct: number
}

/** Everything the reconciliation reads. Pure input — no I/O, no browser. */
export interface ReconcileInput {
  l1Gate: Pick<L1GateResult, 'pass'>
  coverage: ReferenceCoverage
  perceptual: Pick<PerceptualDiffReport, 'meanDiff' | 'pctOverThreshold' | 'regions'>
  values: Pick<ValuesDiffReport, 'deltas' | 'matched' | 'unmatched'>
  floor?: Partial<PerceptualFloor>
}

export interface GateReport {
  pass: boolean
  verdict: GateVerdict
  /** What the verdict means, in the operator's terms. */
  diagnosis: string
  /** The single next action the verdict implies. */
  nextStep: string
  floor: PerceptualFloor
  /** True when the perceptual diff exceeded either bound. */
  perceptualBreach: boolean
  l1Pass: boolean
  perceptual: { meanDiff: number; pctOverThreshold: number; regions: number }
  values: { deltas: number; matched: number; unmatched: number }
  coverage: ReferenceCoverage
}

/**
 * The widest `rest`-state projection on the reference's primary engine — the one
 * cell whose manifest best represents "the page as the reference screenshot shows
 * it". Coverage is a whole-page question, so it is asked once, at the width the
 * full-page screenshot was taken at, rather than averaged across the ladder.
 */
function widestRestProjection(oracle: MultiStateCapture): StateProjection | null {
  const rest = oracle.projections.filter((p) => p.state === 'rest')
  const pool = rest.length ? rest : oracle.projections
  if (!pool.length) return null
  const engine = pool[0].engine
  const sameEngine = pool.filter((p) => p.engine === engine)
  return sameEngine.reduce((best, p) => (p.viewport.width > best.viewport.width ? p : best), sameEngine[0])
}

/** Full document height implied by a manifest's own element boxes. */
function manifestHeight(manifest: ValueManifest): number {
  let bottom = 0
  for (const el of manifest.elements) {
    if (!el.box) continue
    bottom = Math.max(bottom, el.box.y + el.box.height)
  }
  return Math.round(bottom)
}

/**
 * Read the bundle's reference-coverage proxies.
 *
 * Both are numbers the pipeline already computed and simply never reported:
 *
 *   - **media coverage.** The capture mirrors every subresource it intercepts,
 *     including images it then fails to attribute to any element. A bundle that
 *     mirrored seven images and attributed four has three images' worth of page
 *     the value gates are structurally unable to see.
 *   - **segmentation density.** A 4900px page recorded as two style-scope bands
 *     is either genuinely uniform (DOC-13 §7 says that is legal) or a capture
 *     that stopped short. Under a failing perceptual diff, the second reading is
 *     overwhelmingly the likely one.
 *
 * Throws when the bundle predates multi-state capture: coverage measured against
 * a manifest that does not exist would be a fabricated clean bill.
 */
export async function referenceCoverage(bundle: ReferenceBundle): Promise<ReferenceCoverage> {
  const oracle = await readMultiState(bundle)
  if (!oracle) {
    throw new Error(
      `No multistate.json in bundle '${bundle.name}'. Reference coverage is measured against the ` +
        `reference manifest — re-capture with \`1c capture page <url>\` before gating.`,
    )
  }
  const projection = widestRestProjection(oracle)
  if (!projection) {
    throw new Error(`Bundle '${bundle.name}' has an empty multistate.json — nothing to measure coverage against.`)
  }
  const manifest = projection.manifest
  const images = (await readCapture(bundle)).assets.filter((a) => a.kind === 'image')
  const referenced = new Set(
    manifest.elements.map((el) => el.src).filter((src): src is string => typeof src === 'string' && src.length > 0),
  )
  const unreferencedImages = images.filter((a) => !referenced.has(a.src)).map((a) => a.localPath)

  const sections = manifest.sections.length
  const pageHeightPx = manifestHeight(manifest)
  const pxPerSection = Math.round(pageHeightPx / Math.max(1, sections))

  const findings: CoverageFinding[] = []
  if (unreferencedImages.length) {
    findings.push({
      kind: 'unreferenced-image',
      detail:
        `${unreferencedImages.length} of ${images.length} mirrored image asset(s) are referenced by no ` +
        `element in the reference manifest — the capture kept the bytes but never attributed them to the page.`,
    })
  }
  if (pxPerSection > SECTION_DENSITY_PX) {
    findings.push({
      kind: 'section-density',
      detail:
        `the capture segmented ${pageHeightPx}px into ${sections} section(s) (${pxPerSection} px/section) — ` +
        `a band this long is usually under-segmentation rather than a uniformly-styled page.`,
    })
  }

  return {
    mirroredImages: images.length,
    referencedImages: images.length - unreferencedImages.length,
    unreferencedImages,
    sections,
    pageHeightPx,
    pxPerSection,
    findings,
  }
}

/**
 * Reconcile the three gates into one verdict.
 *
 * Ordering is deliberate. Coverage is consulted BEFORE the value-delta count
 * because a delta count measured against an impoverished reference is not
 * evidence: if the capture missed half the page, the value gates' silence about
 * that half says nothing, and their deltas about the rest are a distraction from
 * the real defect. So a run with both coverage findings AND value deltas is
 * reported as `capture-incomplete`, naming both, and the operator is told which
 * to work first.
 */
export function reconcileGates(input: ReconcileInput): GateReport {
  const floor: PerceptualFloor = {
    mean: input.floor?.mean ?? PERCEPTUAL_MEAN_FLOOR,
    pct: input.floor?.pct ?? PERCEPTUAL_PCT_FLOOR,
  }
  const { meanDiff, pctOverThreshold } = input.perceptual
  const perceptualBreach = meanDiff > floor.mean || pctOverThreshold > floor.pct
  const deltas = input.values.deltas.length
  const coverage = input.coverage

  let verdict: GateVerdict
  let diagnosis: string
  let nextStep: string

  if (!input.l1Gate.pass) {
    verdict = 'structural-failure'
    diagnosis = 'The 3-probe gate failed: the reproduction is not geometrically faithful to the oracle.'
    nextStep = 'Work `1c l1-gate --ref <bundle>` — its residuals each name the framework gap to close.'
  } else if (!perceptualBreach) {
    verdict = 'pass'
    diagnosis =
      'The perceptual eye and the structural gate agree the reproduction is faithful. ' +
      'No cross-gate disagreement to explain.'
    nextStep =
      deltas > 0
        ? `\`1c values-diff\` still reports ${deltas} delta(s) — the sharp instrument for a page this close. Work them there.`
        : 'Nothing outstanding from this gate.'
  } else if (coverage.findings.length) {
    verdict = 'capture-incomplete'
    diagnosis =
      'The perceptual eye sees a page-scale difference the value gates do not, and reference coverage ' +
      'says why: the reference manifest is impoverished relative to the reference screenshot. ' +
      'The value gates are not disagreeing — they are BLIND. They compare elements present in both ' +
      'manifests, so they cannot raise a delta against substance the capture never recorded.'
    nextStep =
      'This is a CAPTURE defect, not a reproduction defect. Close the extraction gap (or re-capture) ' +
      'first' +
      (deltas > 0
        ? `; the ${deltas} values-diff delta(s) are measured against an impoverished reference and are not yet evidence.`
        : '.')
  } else if (deltas > 0) {
    verdict = 'reproduction-wrong'
    diagnosis =
      'The perceptual eye and the value gates agree the reproduction differs, and reference coverage is ' +
      'clean — so the reference is trustworthy and the defect is ours.'
    nextStep = `Work the ${deltas} \`1c values-diff\` delta(s): they name, element by element, what to fix.`
  } else {
    verdict = 'unexplained-disagreement'
    diagnosis =
      'The perceptual eye sees a difference that NOTHING else explains: the structural gate passes, ' +
      'reference coverage is clean, and the value gates report no delta. A pixel moved that no ' +
      'ValueElement axis carries.'
    nextStep =
      'This is a FRAMEWORK gap: find the pixel-moving property the value manifest does not record and ' +
      'add it as a typed axis (DOC-24 — an axis belongs in L1 iff it moves a pixel).'
  }

  return {
    pass: verdict === 'pass',
    verdict,
    diagnosis,
    nextStep,
    floor,
    perceptualBreach,
    l1Pass: input.l1Gate.pass,
    perceptual: { meanDiff, pctOverThreshold, regions: input.perceptual.regions.length },
    values: { deltas, matched: input.values.matched, unmatched: input.values.unmatched },
    coverage,
  }
}

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
