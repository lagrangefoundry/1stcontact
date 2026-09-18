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
 * proxies, the L1 acceptance gate, and the reconciliation itself. What is NOT
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
import { acceptanceGate, promoteToFlow } from '../l1/probes'
import type { AcceptanceReport, EnvelopeReport } from '../l1/probes'
import type { FoldedForm } from '../l1/forms'
import type { ReferenceBundle } from '../store/reference-store'
// BUG-100 — the coverage proxy compares image handles by mirrored-asset basename,
// which is the identity `localizeAssets` mirrors by and the one the values-diff
// already uses for background URLs. Reusing the helper rather than writing a
// second normaliser keeps "is this the same asset?" answered in one place.
import { assetBasename } from './capture/values-diff'
import { staleCaptureDetail } from './capture/schema'
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
  kind: 'unreferenced-image' | 'section-density' | 'stale-capture'
  /** Operator-facing sentence: what was measured and why it reads as a gap. */
  detail: string
}

/**
 * BUG-112 — one on-sample layout collision on the served document.
 *
 * `kind` + `detail` are deliberately the SAME two keys a {@link CoverageFinding}
 * carries, and for the same reason: `detail` is a finished operator-facing
 * sentence, so every surface that already knows how to print a coverage finding
 * — the CLI report, the `check_fidelity` tool result an AI round reads — carries
 * this one with no new format to learn. `width` and `paths` are the machine-side
 * halves of the same sentence, for a caller that wants to sort or navigate
 * rather than read.
 */
export interface LayoutCollision {
  kind: 'overlap' | 'clip'
  /** Operator-facing sentence: what collided with what, at which width. */
  detail: string
  /** The captured width the collision was found at. */
  width: number
  /** Index paths of the leaves involved. */
  paths: string[]
}

/**
 * Flatten an envelope report into collisions, width by width and, inside each
 * width, in the order the probe walked the page — so the list an operator reads
 * is the page top to bottom rather than a bag sorted by nothing.
 */
export function layoutCollisions(report: EnvelopeReport): LayoutCollision[] {
  return report.byWidth.flatMap(({ width, findings }) =>
    findings.map((f) => ({ kind: f.kind, detail: `at ${width}px: ${f.detail}`, width, paths: [...f.paths] })),
  )
}

/** The first `n` collisions as one semicolon-joined sentence, with a tail count. */
function namedCollisions(all: LayoutCollision[], n = 5): string {
  const head = all.slice(0, n).map((c) => c.detail).join('; ')
  return all.length > n ? `${head}; …and ${all.length - n} more` : head
}

/**
 * Cheap proxies for "did the capture actually record this page", read from the
 * bundle alone. Reported always; escalated to a verdict only when the perceptual
 * floor is breached (see {@link reconcileGates}).
 */
export interface ReferenceCoverage {
  /** Image assets the capture mirrored into the bundle. */
  mirroredImages: number
  /** BUG-100 — mirrored image assets the reference manifest names, by any of the
   *  fields that can hold an image handle: an element's media `src`, an element's
   *  `backgroundImageUrl` (a nested backdrop box), or a section band's
   *  `backgroundImageUrl` (the hero, on a page whose imagery is CSS-painted). */
  referencedImages: number
  /** Mirrored image assets nothing in the reference manifest names, by local path. */
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
  /**
   * BUG-112 — `onSample` travels beside `pass`, and it is not redundant with it.
   * `pass` already folds the on-sample envelope in, so the VERDICT is right
   * either way; what `onSample` adds is the ability to say WHAT collided, which
   * is the whole difference between "the structural gate failed" and a brief an
   * AI round can act on.
   *
   * Required, not optional, for the reason the BUG-106 note below gives at
   * length: a `Pick` that structurally excludes the facts a caller would have to
   * remember to pass is a caller that will one day not remember. Every caller
   * here holds a whole {@link L1GateResult}, so satisfying it costs nothing.
   */
  l1Gate: Pick<L1GateResult, 'pass' | 'onSample'>
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
  /**
   * BUG-106 — what the value gates saw, INCLUDING what they could not see.
   *
   * This was `Pick<ValuesDiffReport, 'deltas' | 'matched' | 'unmatched'>`, and
   * that `Pick` is the whole of the defect it is named for. `unmatched` counts
   * unpaired *expected* objects only, and `deltas` counts comparisons that
   * happened — so a run whose sections could not be paired at all, against a
   * reproduction carrying seven objects the reference does not have, reported
   * `{ deltas: 0, matched: 59, unmatched: 0 }` and read as a complete match. The
   * two facts that would have said otherwise were structurally excluded from the
   * type, so no amount of care at the call site could have carried them.
   *
   * Both are therefore asked for here rather than left to a caller to remember.
   * `unpairedActual` is COUNTABLE ONLY, for the reason `perceptual.regions`
   * above gives: it is only ever counted here, so asking for the report's own
   * object type would make a caller with no such type unable to satisfy one it
   * could never have produced. `sectionsNotComparable` is optional because it is
   * optional on {@link ValuesDiffReport} — absent means the sections WERE
   * comparable, which is a different fact from "not reported".
   */
  values: {
    deltas: ValuesDiffReport['deltas']
    matched: number
    unmatched: number
    /** REQ-51 — repro objects that paired with no reference object. */
    unpairedActual: readonly unknown[]
    /** BUG-102 — why section-level values could not be compared at all, when they could not. */
    sectionsNotComparable?: string
  }
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
  /**
   * BUG-106 — the counts, and the two facts that say what they are worth.
   * `unpairedActual` is the repro-side mirror of `unmatched`; a present
   * `sectionsNotComparable` means every section-level value behind `deltas` is
   * UNMEASURED on this run rather than clean.
   */
  values: {
    deltas: number
    matched: number
    unmatched: number
    unpairedActual: number
    sectionsNotComparable?: string
  }
  coverage: ReferenceCoverage
  /**
   * BUG-112 — what the served document does at the captured widths, as it
   * stands. `pass: false` here is always a `structural-failure` verdict: a page
   * that paints a run over its neighbour at a width the reference itself was
   * measured at is wrong however the pixels average out.
   */
  layout: { pass: boolean; findings: LayoutCollision[] }
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
 * BUG-100 — every way a reference manifest can name a mirrored image, as a set
 * of mirrored-asset basenames.
 *
 * This read `manifest.elements[].src` alone, which is the ONE field a background
 * image structurally cannot reach. Both the extractor (BUG-27) and the section
 * projection (BUG-13) say so in as many words: a painted surface "carries the
 * image handle as `backgroundImageUrl` rather than `src`, because it paints a
 * SURFACE behind content, not replaced content in flow", and a band's imagery
 * "never reaches the element manifest". So on a page whose imagery is all CSS
 * `background-image` — `gigabytealchemy.ai`, the bundle this file's own floor is
 * calibrated against — the set came back EMPTY and every mirrored asset was
 * reported unreferenced, unconditionally. That is not a noisy line: a coverage
 * finding outranks the value-delta count in {@link reconcileGates}, so one false
 * `unreferenced-image` turns a `reproduction-wrong` run into `capture-incomplete`
 * and tells the operator to stop and fix a capture that is in fact complete.
 *
 * Membership is by BASENAME, not by URL string. The two sides name the same
 * bytes differently — a ladder projection carries the absolute origin URL where a
 * single-width projection carries the site-local `assets/…` mirror — and
 * `assetBasename` is already how the values-diff asks "is the same asset painted
 * here?". A handle with no basename (an empty tail, a bare `data:` handle) is
 * left out rather than admitted as a wildcard.
 */
function referencedAssets(manifest: ValueManifest): Set<string> {
  const names = new Set<string>()
  const add = (handle: string | null | undefined): void => {
    const name = assetBasename(handle)
    if (name) names.add(name)
  }
  for (const el of manifest.elements) {
    add(el.src)
    // BUG-27 — a text-free backdrop box nested below the band root.
    add(el.backgroundImageUrl)
  }
  // BUG-13 — the section band's own imagery: the hero, on a photography-led page.
  for (const section of manifest.sections) add(section.backgroundImageUrl)
  return names
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
  const capture = await readCapture(bundle)
  const images = capture.assets.filter((a) => a.kind === 'image')
  const referenced = referencedAssets(manifest)
  const unreferencedImages = images
    .filter((a) => {
      const name = assetBasename(a.src)
      return !name || !referenced.has(name)
    })
    .map((a) => a.localPath)

  const sections = manifest.sections.length
  const pageHeightPx = manifestHeight(manifest)
  const pxPerSection = Math.round(pageHeightPx / Math.max(1, sections))

  const findings: CoverageFinding[] = []
  // REQ-270 — the oldest coverage question there is: was this bundle taken by
  // the extractor now measuring against it? A capture is the INPUT to every
  // other proxy here, so a bundle that cannot express an axis makes every gate
  // downstream of it silent about that axis rather than clean. This sits first
  // because it is the finding that explains the others.
  const staleDetail = staleCaptureDetail(capture)
  if (staleDetail) findings.push({ kind: 'stale-capture', detail: staleDetail })
  if (unreferencedImages.length) {
    findings.push({
      kind: 'unreferenced-image',
      detail:
        `${unreferencedImages.length} of ${images.length} mirrored image asset(s) are referenced by ` +
        `nothing in the reference manifest — neither an element's media \`src\` nor any \`backgroundImageUrl\` ` +
        `names them, so the capture kept the bytes but never attributed them to the page.`,
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
  const unpairedActual = input.values.unpairedActual.length
  const notComparable = input.values.sectionsNotComparable
  const coverage = input.coverage
  const collisions = layoutCollisions(input.l1Gate.onSample)

  let verdict: GateVerdict
  let diagnosis: string
  let nextStep: string

  if (!input.l1Gate.pass) {
    verdict = 'structural-failure'
    // BUG-112 — an on-sample collision is named HERE rather than left to
    // `1c l1-gate`, because it is the one structural failure an operator can
    // confirm by opening the page: two runs painted on top of each other at a
    // width the reference was measured at. Leaving it as "work the residuals"
    // is what sent an AI round after fourteen sub-pixel value deltas while the
    // form controls sat on the prose above them.
    diagnosis = collisions.length
      ? `The acceptance gate failed: the SERVED document collides with itself at ${
          new Set(collisions.map((c) => c.width)).size
        } captured width(s) — ${namedCollisions(collisions)}. ` +
        'A run painted over its neighbour is a reproduction defect no perceptual average can excuse.'
      : 'The acceptance gate failed: the reproduction is not geometrically faithful to the oracle.'
    nextStep = collisions.length
      ? 'Fix the collisions first (`layout.findings` lists every pair and width) — either give the ' +
        'colliding region structure so it cannot overlap, or, where the stack IS the design, declare ' +
        'it on the node with `stacked: true` so the intent is recorded rather than inferred. Then work ' +
        '`1c l1-gate --ref <bundle>` for the remaining residuals.'
      : 'Work `1c l1-gate --ref <bundle>` — its residuals each name the framework gap to close.'
  } else if (!perceptualBreach) {
    verdict = 'pass'
    diagnosis =
      'The perceptual eye and the structural gate agree the reproduction is faithful. ' +
      'No cross-gate disagreement to explain.'
    // BUG-106 — "Nothing outstanding from this gate." is a CLAIM, and it was
    // emitted from the delta count alone. On the run this ticket came from it
    // was false three ways at once: a coverage finding sat two keys below it in
    // the same JSON, seven repro objects had paired with nothing, and eight
    // reference sections had no band to be compared against at all. Naming only
    // one of the three would leave the same sentence lying about the other two,
    // so the pass rung enumerates every fact this run is carrying and falls back
    // to the original sentence only when it is carrying none.
    //
    // THE LADDER IS UNCHANGED. Nothing here decides a verdict — a run that
    // passed still passes. What changes is that it says what it did not measure.
    // EACH ITEM NAMES ITS FACT AND WHERE THE DETAIL ALREADY IS, rather than
    // quoting it. The reason and the finding are both in this same report, two
    // keys away, and pasting them in full turns one next action into a wall of
    // prose an operator skims past — which is how the contradiction went
    // unnoticed in the first place.
    const outstanding: string[] = []
    if (deltas > 0) {
      outstanding.push(
        `\`1c values-diff\` still reports ${deltas} delta(s) — the sharp instrument for a page this close, so work them there`,
      )
    }
    if (unpairedActual > 0) {
      outstanding.push(
        `${unpairedActual} repro object(s) paired with NOTHING in the reference — \`unmatched\` above is the ` +
          `expected side only and does not see them (\`values.unpairedActual\`)`,
      )
    }
    if (notComparable) {
      outstanding.push(
        'section-level values were NOT compared at all on this run, so the delta count above says nothing ' +
          'about them (`values.sectionsNotComparable` gives the reason)',
      )
    }
    if (coverage.findings.length) {
      outstanding.push(
        `reference coverage reports ${coverage.findings.map((f) => `\`${f.kind}\``).join(', ')} ` +
          `(\`coverage.findings\` gives the detail)`,
      )
    }
    nextStep = outstanding.length
      ? `Every gate is within its floor, but this run is NOT silent: ${outstanding.join('; ')}.`
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
    values: {
      deltas,
      matched: input.values.matched,
      unmatched: input.values.unmatched,
      unpairedActual,
      ...(notComparable ? { sectionsNotComparable: notComparable } : {}),
    },
    coverage,
    layout: { pass: input.l1Gate.onSample.pass, findings: collisions },
  }
}

// ── the structural gate ──────────────────────────────────────────────────────

export interface L1GateResult extends AcceptanceReport {
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
 * Run the acceptance gate against a capture bundle's oracle. Folds the
 * `multistate.json` to the absolute base, applies demand-driven `promoteToFlow`
 * for the envelope probes, and runs {@link acceptanceGate}. The returned report's
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
  // BUG-112 — `served` is `base`, NAMED, because that is what `1c repro` writes
  // to disk (`cmdRepro` imports `promoteToFlow` and never calls it — see
  // BUG-113, which owns the question of whether that is the right document).
  // Until that question is settled the gate's job is to grade the artifact the
  // operator's browser loads, whichever one it is, rather than to assume the
  // recovered overlay it certifies is the one that got written.
  const report = acceptanceGate(base, multiState, { recovered, served: base, contentScale: CONTENT_SCALE })
  return { ...report, promoted, foldResiduals, forms }
}
