/**
 * REQ-157 — the gate's reconciliation, with no host in it.
 *
 * WHY THIS FILE EXISTS, and it is the same reason `perceptual-core.ts` does.
 * `gate.ts` was one module doing two things: deciding what a reproduction's
 * gates MEAN when they disagree, and being the `1c gate` command — which renders
 * a report, writes `gate.json`, and reaches `cmdDiff` and `cmdValuesDiff` to
 * obtain its inputs. The first of those is pure arithmetic over data. The second
 * needs `node:fs`, a loopback server and Playwright, and importing the module at
 * all dragged all three into the graph.
 *
 * That was invisible while the only caller was the CLI. REQ-157 put the
 * reconciliation on a tool surface that runs in workerd, and the boundary test
 * REQ-146 installed said so immediately: importing `../gate` for `reconcileGates`
 * pulled `serve.ts`, `perceptual.ts`, `fidelity.ts`, `repro.ts` and three
 * filesystem stores into the Worker's import graph. So the split is along the
 * line that was always there and had never had to be drawn.
 *
 * WHAT IS HERE. Everything that reads a {@link ReferenceBundle} through the port
 * or computes over data already in hand: the perceptual floor, the coverage
 * proxies, the three-probe L1 gate, and the reconciliation itself. What is NOT
 * here is the command — `1c gate` still lives in `gate.ts`, still writes its
 * report, and still reads exactly these functions, so there is one place where a
 * verdict is decided and the CLI is a caller of it rather than its owner.
 *
 * NOTHING CHANGED BUT THE FILE. The functions below are moved, not rewritten:
 * `1c gate` and `check_fidelity` reach the same code, which is what makes
 * REQ-157's "reproduces `1c gate`'s reconciliation" a property of the build
 * rather than of anyone's care.
 */
import { readCapture, readMultiState } from './capture/bundle'
// DEEP PATHS, not the `../l1` barrel. That barrel re-exports `roundtrip.ts`,
// which drives a real browser over `node:http` and pulls the `capture` barrel's
// Playwright with it — so importing `../l1` for the fold put Playwright into the
// Worker's graph, which is exactly what REQ-154 removed it from. The three
// functions this uses are pure and live in two modules.
import { foldToL1 } from '../l1/fold'
import type { FoldResidual } from '../l1/fold'
import { promoteToFlow, threeProbeGate } from '../l1/probes'
import type { ThreeProbeReport } from '../l1/probes'
import type { FoldedForm } from '../l1/forms'
import type { ReferenceBundle } from '../store/reference-store'
import type {
  MultiStateCapture,
  StateProjection,
  ValueManifest,
  ValuesDiffReport,
} from './capture/values-diff'

/** Content-perturbation factor for the robustness probe + structure recovery. */
const CONTENT_SCALE = 2.5

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
  /**
   * REQ-157 — `regions` is only ever counted here, so this asks for something
   * countable rather than for a diff report's own region type.
   *
   * It used to `Pick` them off `PerceptualDiffReport`, which dragged in the crop-path triptych
   * (`{ref, actual, diff}` filenames) that the CLI attaches when it writes them
   * to disk — and this function reads none of it. That made a caller with no
   * filesystem, which is every caller in a Worker, unable to satisfy a type
   * whose extra half it could never have produced and this code never wanted.
   */
  perceptual: {
    /** Mean per-pixel max-channel diff, 0..255. */
    meanDiff: number
    /** Percentage of pixels over the noise threshold. */
    pctOverThreshold: number
    /** The ranked regions — only ever counted here, so only countable. */
    regions: readonly unknown[]
  }
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

// ── the structural gate ──────────────────────────────────────────────────────

export interface L1GateResult extends ThreeProbeReport {
  /** Paths of the pinned sibling groups `promoteToFlow` recovered into flow. */
  promoted: string[]
  /**
   * REQ-92 / BUG-6 (B2) — elements the fold could not yet express as L1 leaves
   * (text-free media/fields, pure-surface panels, geometry-less runs). Kept
   * separate from the probes' mispairing/fidelity residuals: these name *folder
   * power* gaps (a leaf kind the fold does not emit yet), not a diff delta.
   */
  foldResiduals: FoldResidual[]
  /**
   * REQ-93 — the behaviours the fold recovered into L1 slots, with whatever the
   * capture could not tell us about each. A *derivation* gap (no endpoint, no
   * recorded input type), deliberately distinct from {@link foldResiduals}: the
   * form was mounted, so it is not a gap in L1's expressive power.
   */
  forms: FoldedForm[]
}

/**
 * Run the 3-probe acceptance gate against a capture bundle's oracle. Folds the
 * `multistate.json` to the absolute base, applies demand-driven `promoteToFlow`
 * for the envelope probes, and runs {@link threeProbeGate}. The returned report's
 * residuals each name a framework gap (a missing L1 axis, a capture-hint gap, or
 * a region needing promotion) to feed back per the DOC-21 growth loop.
 */
export async function cmdL1Gate(bundle: ReferenceBundle): Promise<L1GateResult> {
  const multiState = await readMultiState(bundle)
  if (!multiState) {
    throw new Error(
      `No multistate.json in bundle '${bundle.name}'. The bundle predates multi-state ` +
        `capture — re-capture with \`1c capture page <url>\` before gating.`,
    )
  }
  const foldResiduals: FoldResidual[] = []
  const forms: FoldedForm[] = []
  const base = foldToL1(multiState, { residuals: foldResiduals, forms })
  const { doc: recovered, promoted } = promoteToFlow(base, { scale: CONTENT_SCALE })
  const report = threeProbeGate(base, multiState, { recovered, contentScale: CONTENT_SCALE })
  return { ...report, promoted, foldResiduals, forms }
}
