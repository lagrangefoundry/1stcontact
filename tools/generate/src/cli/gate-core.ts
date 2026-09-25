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
import { readCapture, readForms, readL1, readMultiState } from './capture/bundle'
// `./capture/theme`, NOT `./capture/capture` — same deep-path rule as the fold
// import below. `capture.ts` re-exports this, but it also imports `./pipeline`,
// and taking it from there would put Playwright back in the Worker's graph.
import { fontResourcesFromTheme } from './capture/theme'
import type { Capture } from './capture/types'
// DEEP PATHS, not the `../l1` barrel. That barrel re-exports `roundtrip.ts`,
// which drives a real browser over `node:http` and pulls the `capture` barrel's
// Playwright with it — so importing `../l1` for the fold put Playwright into the
// Worker's graph, which is exactly what REQ-154 removed it from. The three
// functions this uses are pure and live in two modules.
import { foldToL1 } from '../l1/fold'
import type { FoldResidual } from '../l1/fold'
import {
  acceptanceGate,
  contentRobustnessProbe,
  measuredTextHeights,
  promoteToFlow,
  chooseRecovery,
  sampleFidelityProbe,
} from '../l1/probes'
import type { AcceptanceReport, EnvelopeReport } from '../l1/probes'
import { mountBehaviours } from '../l1/forms'
import type { FoldedForm } from '../l1/forms'
import type { ReferenceBundle } from '../store/reference-store'
// BUG-100 — the coverage proxy compares image handles by mirrored-asset basename,
// which is the identity `localizeAssets` mirrors by and the one the values-diff
// already uses for background URLs. Reusing the helper rather than writing a
// second normaliser keeps "is this the same asset?" answered in one place.
// BUG-110 — the value gate's floor is a TIER bound, so the reconciliation reads
// the same ordering the deltas were ranked by rather than keeping a second copy
// of the severity taxonomy that could drift from it.
import { assetBasename, TIER_RANK } from './capture/values-diff'
import { staleCaptureDetail } from './capture/schema'
// REQ-274 — an axis the diff COMPARES but only one side of the projection can
// supply. Reported here for the same reason BUG-111's unpaired bands are: it is
// a fact about what the run did NOT measure, and a pass that does not name it is
// a pass claiming to have measured it.
import type { UnmeasuredAxis } from './capture/value-axes'
import { unmeasuredAxisLabel } from './capture/value-axes'
import type {
  MultiStateCapture,
  SeverityTier,
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
 * BUG-110 — the VALUE gate's floor: the worst {@link SeverityTier} a run may
 * carry and still pass. A delta ranked above it fails the run no matter how
 * close the pixels are.
 *
 * WHY THERE HAS TO BE ONE. Before this bound the ladder was decided by the
 * perceptual floor and the L1 gate alone: `deltas` was counted, never weighed,
 * and every rung below `pass` was unreachable once the pixels were within their
 * floor. So a reproduction of `gigabytealchemy.ai` that had lost EVERY heading
 * and EVERY link on the page — 13 HIGH `a11yRole` deltas, no document outline,
 * nothing that is still a link — reported `verdict: "pass"`. Semantics is the
 * axis that proves the point: a heading that renders as a `generic` div moves no
 * pixel at all, so the eye is structurally incapable of seeing it and the one
 * gate that CAN see it had no way to reach the verdict.
 *
 * WHY `MEDIUM`, i.e. why HIGH and CRITICAL breach and nothing else does. The
 * gate must not become a second `1c values-diff` — that verb already exits
 * non-zero on ANY delta, and a gate that did the same would be a duplicate of it
 * rather than the cross-gate reconciliation REQ-94 built. So the bound is set at
 * the line the tier table already draws: LOW is tone (colour, scrim, spacing)
 * and MEDIUM is treatment (shape, border, weight) — residual drift on a
 * reproduction an operator would accept, and exactly what REQ-94's "faithful
 * reproduction passes despite value deltas" was about. HIGH and above is
 * structure: a lost heading, a link that is no longer a link, a size that is
 * wrong, something absent. None of those is a close reproduction.
 *
 * `null` holds the value gate to nothing, which is the behaviour every run had
 * before this bound existed (`--values-tier none`).
 */
export const VALUES_TIER_FLOOR: SeverityTier = 'MEDIUM'

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
 * - `pass`                     — every gate this command owns is clear: the eye is
 *                                within its floor AND no value delta ranks above
 *                                the value floor (BUG-110).
 * - `structural-failure`       — `l1-gate` itself failed; ordinary, pre-existing.
 * - `capture-incomplete`       — perceptual floor breached AND reference coverage
 *                                is suspect. The value gates are not wrong, they
 *                                are BLIND: they cannot raise a delta against
 *                                substance the capture never recorded.
 * - `reproduction-wrong`       — the reproduction differs and the value gates name
 *                                how. Either the perceptual floor is breached,
 *                                coverage is clean and both eyes agree; or
 *                                (BUG-110) the eye is within its floor and a
 *                                delta above the value floor failed the run on
 *                                its own — the semantic class no pixel shows.
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

/**
 * The floor a run was held to (echoed into the report so it is never implicit).
 *
 * BUG-110 — renamed from `PerceptualFloor`, because it is no longer only the
 * perceptual one. It is ONE object carrying every bound the verdict was decided
 * against, for the reason the name it had was written for: a bound that is not
 * in the report is a bound the reader has to already know.
 */
export interface GateFloor {
  mean: number
  pct: number
  /**
   * BUG-110 — the worst {@link SeverityTier} a passing run may carry.
   * `null` means the value gate is held to nothing (the pre-BUG-110 behaviour).
   */
  valuesTier: SeverityTier | null
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
    /**
     * BUG-111 — reference sections no repro band overlapped, and the repro-side
     * mirror. COUNTABLE ONLY, and REQUIRED rather than optional, for the same two
     * reasons `unpairedActual` above is: a caller with no such type can still
     * satisfy a `readonly unknown[]`, and the defect this fixes was a fact the
     * type made impossible to carry — so the reconciliation asks for it instead
     * of trusting a call site to remember. An unpaired band is not a delta, so
     * without these the whole fact reached the gate as nothing at all.
     */
    unpairedSections: readonly unknown[]
    unpairedActualSections: readonly unknown[]
    /**
     * REQ-308 — reference bands lifted OUT of `unpairedSections` because they
     * paint nothing and are therefore not surfaces any reproduction could have a
     * counterpart for. OPTIONAL, on the same terms as `unmeasuredAxes` below: a
     * real {@link ValuesDiffReport} always carries it, and a hand-built input
     * that omits it is saying "not asked about" rather than "asked, and there
     * were none".
     */
    nonSurfaceSections?: readonly unknown[]
    /**
     * REQ-274 — the compared axes only one side of the projection could supply,
     * which this run actually ran into. Named rather than counted, because
     * "one axis was unmeasured" is not actionable and "the reference records no
     * text-run padding" is.
     *
     * OPTIONAL, where BUG-111's counts above are required, and the difference is
     * the point: those were a per-run measurement the type made impossible to
     * carry, so asking for them is how a call site cannot forget. This is a
     * property of the projection TABLE that every real {@link ValuesDiffReport}
     * carries automatically — a hand-built input omitting it is saying "not
     * asked about", which is a different fact from "asked, and there were none",
     * and is the same optionality `sectionsNotComparable` has.
     */
    unmeasuredAxes?: readonly UnmeasuredAxis[]
    /** BUG-102 — why section-level values could not be compared at all, when they could not. */
    sectionsNotComparable?: string
  }
  floor?: Partial<GateFloor>
}

export interface GateReport {
  pass: boolean
  verdict: GateVerdict
  /** What the verdict means, in the operator's terms. */
  diagnosis: string
  /** The single next action the verdict implies. */
  nextStep: string
  floor: GateFloor
  /** True when the perceptual diff exceeded either bound. */
  perceptualBreach: boolean
  /** BUG-110 — true when a value delta ranks above `floor.valuesTier`. */
  valuesBreach: boolean
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
    /**
     * BUG-110 — the worst tier among `deltas`, which is what `valuesBreach` was
     * decided from. `null` when there are no deltas to rank. Carried because a
     * COUNT says nothing about severity: the run this ticket came from read
     * `deltas: 14` on a page that had lost its entire outline, and 14 is also
     * what a page with fourteen slightly-off colours reads.
     */
    worstTier: SeverityTier | null
    /**
     * BUG-111 — how many bands went UNCOMPARED on each side. Read next to
     * `coverage.sections`: that number counts the reference's bands, so a run
     * reporting eight sections and one unpaired section has compared seven.
     */
    unpairedSections: number
    unpairedActualSections: number
    /**
     * REQ-308 — how many reference bands were RECLASSIFIED rather than counted
     * above. Read next to `unpairedSections`: a band that paints nothing has no
     * counterpart any fold could emit, so counting it as an uncompared surface
     * states a reproduction gap that cannot be closed. Reported so the drop in
     * the count above is visible rather than silent.
     */
    nonSurfaceSections: number
    /**
     * REQ-274 — the compared axes this run could not evaluate because only one
     * side of the projection can read them. Read next to `deltas`: that number
     * counts what the gate DID compare, and a zero beside a non-empty list here
     * means the silence covers less of the page than it looks like it does.
     */
    unmeasuredAxes: UnmeasuredAxis[]
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
 * BUG-110 — a tier's rank, tolerant of one that is not in the table.
 *
 * `0` for an absent or unrecognised tier, so it can never exceed a floor: a
 * caller that hands the reconciliation a delta shape it does not understand gets
 * the pre-BUG-110 verdict rather than a failure invented from a value that was
 * never classified.
 */
function tierRank(tier: SeverityTier | null | undefined): number {
  return tier ? (TIER_RANK[tier] ?? 0) : 0
}

/** The worst tier among a run's deltas, or `null` when there are none. */
function worstTierOf(deltas: ValuesDiffReport['deltas']): SeverityTier | null {
  let worst: SeverityTier | null = null
  for (const delta of deltas) {
    if (tierRank(delta.tier) > tierRank(worst)) worst = delta.tier
  }
  return worst
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
  const floor: GateFloor = {
    mean: input.floor?.mean ?? PERCEPTUAL_MEAN_FLOOR,
    pct: input.floor?.pct ?? PERCEPTUAL_PCT_FLOOR,
    // `undefined` is "not asked", which takes the default; `null` is "asked for
    // no bound", which is the pre-BUG-110 behaviour and must survive `??`.
    valuesTier: input.floor?.valuesTier === undefined ? VALUES_TIER_FLOOR : input.floor.valuesTier,
  }
  const { meanDiff, pctOverThreshold } = input.perceptual
  const perceptualBreach = meanDiff > floor.mean || pctOverThreshold > floor.pct
  const deltas = input.values.deltas.length
  // BUG-110 — the value gate's own breach, ranked by the SAME table the deltas
  // were sorted by. An unrecognised tier ranks 0 and cannot breach: the bound
  // exists to fail runs on evidence, never on a value it could not classify.
  const worstTier = worstTierOf(input.values.deltas)
  const valuesBreach = floor.valuesTier !== null && tierRank(worstTier) > tierRank(floor.valuesTier)
  const unpairedActual = input.values.unpairedActual.length
  const unpairedSections = input.values.unpairedSections.length
  const unpairedActualSections = input.values.unpairedActualSections.length
  const nonSurfaceSections = (input.values.nonSurfaceSections ?? []).length
  const notComparable = input.values.sectionsNotComparable
  // REQ-274 — the compared axes only one side of the projection can supply, and
  // that this run actually ran into. A count is useless here (one axis is not a
  // severity) so the rows travel whole and the pass rung names them.
  const unmeasuredAxes = [...(input.values.unmeasuredAxes ?? [])]
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
    // BUG-110's value-severity bound joins the perceptual one here: both are
    // breaches a passing run must be clear of, and neither can rescue a
    // structural failure above.
  } else if (!perceptualBreach && !valuesBreach) {
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
    // BUG-110 — this used to read "THE LADDER IS UNCHANGED. Nothing here decides
    // a verdict." That was true of BUG-106 and is no longer true of the rung: a
    // delta above `floor.valuesTier` now fails the run before it gets here. What
    // is STILL true, and is the point of the list, is that everything below the
    // value floor is reported rather than decided — a run reaching this rung is
    // a pass, and the list is how it says what it is nonetheless carrying.
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
    // BUG-111 — the fourth way the pass rung was silent about what it did not
    // measure. A reference band with no repro counterpart produces no delta (BUG-102
    // classified it correctly as a segmentation mismatch) and no coverage finding, so
    // the only trace it left was a row in `values-diff.json`'s `sectionPairing` —
    // which this report does not summarise and no reader of it opens. One rung, not
    // two: the two counts are the same fact seen from either side (the pages segment
    // differently), and splitting them would put two near-identical lines in a list
    // whose whole value is that it is skimmable.
    if (unpairedSections > 0 || unpairedActualSections > 0) {
      const sides: string[] = []
      if (unpairedSections > 0) {
        sides.push(
          `${unpairedSections} reference section(s) had no reproduction band to compare against ` +
            `(\`values.unpairedSections\`)`,
        )
      }
      if (unpairedActualSections > 0) {
        sides.push(
          `${unpairedActualSections} reproduction band(s) had no reference section ` +
            `(\`values.unpairedActualSections\`)`,
        )
      }
      outstanding.push(
        `${sides.join(' and ')} — the two pages segment differently, so those bands' section-level values ` +
          `(overlay, contentAnchor, textAlign) are UNMEASURED rather than clean`,
      )
    }
    // REQ-308 — a band the comparator RECLASSIFIED is not outstanding work, and
    // saying nothing about it would make the count above look like it had simply
    // got smaller. Named as what it is: a category the instrument declines to
    // count, with the detail in `values-diff.json` beside the reason for each.
    if (nonSurfaceSections > 0) {
      outstanding.push(
        `${nonSurfaceSections} reference band(s) paint NOTHING — no fill, no image, no overlay — so they are ` +
          `content groupings rather than surfaces and are NOT counted as unpaired: no reproduction band could ` +
          `be their counterpart (\`values.nonSurfaceSections\`; \`values-diff.json\` carries the reason per band)`,
      )
    }
    // REQ-274 — the fifth way the pass rung could be silent about what it did not
    // measure, and the only one that is a property of the INSTRUMENT rather than
    // of the page. An axis the diff compares but only one side of the projection
    // can read produces no delta and no count: the comparator's both-sides guard
    // skips it, which is correct, and then nothing said it had been skipped. That
    // is how REQ-64's four Type-A text-run axes read clean on every reproduction
    // of every site from the day they were added to the comparator. Named, not
    // counted — "1 axis unmeasured" tells an operator nothing they can act on,
    // and "the reference records no text-run padding" tells them where to look.
    if (unmeasuredAxes.length > 0) {
      outstanding.push(
        `${unmeasuredAxes.length} compared axis/axes could only be read on ONE side of the projection, so they were ` +
          `not evaluated on this run — ${unmeasuredAxes.map(unmeasuredAxisLabel).join('; ')} ` +
          `(\`values.unmeasuredAxes\`)`,
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
  } else if (perceptualBreach && coverage.findings.length) {
    // BUG-110 — `capture-incomplete` is explicitly gated on the PERCEPTUAL
    // breach now that a run can reach this rung on the value gate alone. Its
    // whole diagnosis is that the eye sees a page-scale difference the value
    // gates are BLIND to; a run whose pixels are within their floor and whose
    // value gate DID see the break is the opposite case, and saying the value
    // gates could not see it would be false about the very deltas that failed
    // the run. The perceptual ordering — coverage BEFORE the delta count — is
    // unchanged, which is what BUG-100's suite pins.
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
    // BUG-110 — two ways to arrive here now, and they are not the same finding.
    // The original is both eyes agreeing. The new one is the value gate ALONE:
    // pixels within their floor, and a delta above the value floor anyway. That
    // second case is not a weaker version of the first — it is the class the eye
    // is structurally unable to see, because a heading that renders as a
    // `generic` div moves no pixel. Saying "the perceptual eye and the value
    // gates agree" there would be false about the one gate that did the work.
    if (perceptualBreach) {
      diagnosis =
        'The perceptual eye and the value gates agree the reproduction differs, and reference coverage is ' +
        'clean — so the reference is trustworthy and the defect is ours.'
      nextStep = `Work the ${deltas} \`1c values-diff\` delta(s): they name, element by element, what to fix.`
    } else {
      diagnosis =
        `The perceptual eye is WITHIN its floor and the run still fails: the value gate reports a ` +
        `${worstTier}-tier delta, above this run's value floor of ${floor.valuesTier}. Pixel closeness is not ` +
        'fidelity — a heading that renders as a generic box, or a link that is no longer a link, moves no ' +
        'pixel at all, so the eye is structurally unable to see it and only the value gate can.'
      nextStep =
        `Work the ${deltas} \`1c values-diff\` delta(s) worst-first — ${worstTier} tier is what failed the run` +
        (coverage.findings.length
          ? `; reference coverage also reports ${coverage.findings.map((f) => `\`${f.kind}\``).join(', ')} (\`coverage.findings\`).`
          : '.')
    }
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
    valuesBreach,
    l1Pass: input.l1Gate.pass,
    perceptual: { meanDiff, pctOverThreshold, regions: input.perceptual.regions.length },
    values: {
      deltas,
      matched: input.values.matched,
      unmatched: input.values.unmatched,
      unpairedActual,
      worstTier,
      unpairedSections,
      unpairedActualSections,
      nonSurfaceSections,
      unmeasuredAxes,
      ...(notComparable ? { sectionsNotComparable: notComparable } : {}),
    },
    coverage,
    layout: { pass: input.l1Gate.onSample.pass, findings: collisions },
  }
}

// ── the structural gate ──────────────────────────────────────────────────────

/**
 * BUG-113 — what structure recovery would buy, and what it would cost.
 *
 * `promoteToFlow` used to supply the document the envelope probes graded, which
 * made its cost invisible: the gate reported the recovered overlay's clean
 * envelope and never priced the fidelity it paid for it. Measured across the
 * three retained bundles that price is not marginal — on `gigabytealchemy.ai`
 * the recovered document misses the oracle by 1426px at its widest sample, which
 * on a 1440px viewport is the whole page — because recovery clears the envelope
 * by DROPPING each promoted member's geometry, so a 14px glyph in a grid becomes
 * a full-bleed stacked row.
 *
 * So it is reported, not applied. The served document is graded as served, and
 * this says what the only recovery we have would do to it.
 */
export interface RecoveryCost {
  /** Paths of the pinned sibling groups `promoteToFlow` would flow. */
  promoted: string[]
  /**
   * REQ-278 — whether the recovery WON and is therefore the document this gate
   * graded. False means the absolute base is still what is served and this block
   * is still the priced alternative BUG-113 made it.
   */
  served: boolean
  /** Envelope findings on the served document, across the captured ladder. */
  servedFindings: number
  /** Envelope findings the recovered document would have instead. */
  recoveredFindings: number
  /** Largest per-axis miss against the oracle, in px, if it were served. */
  fidelityMaxDeltaPx: number
  /** Oracle samples the recovered document would place out of tolerance. */
  fidelityResiduals: number
}

export interface L1GateResult extends AcceptanceReport {
  /** Paths of the pinned sibling groups `promoteToFlow` recovered into flow. */
  promoted: string[]
  /** BUG-113 — the costed alternative to what was served. Graded by no probe. */
  recovery: RecoveryCost
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
  /**
   * BUG-113 — set when the bundle's retained `l1.json` is not what a fresh fold
   * of its own `multistate.json` produces, i.e. the artifact this gate graded
   * (and `1c repro` serves) was folded by an older folder.
   *
   * This is a STALENESS fact, not a quality one, so it does not move `pass`:
   * the retained document is the one that will be served, so grading it is
   * correct however old it is. What would NOT be correct is letting the operator
   * read that verdict without knowing a re-fold would change the subject of it —
   * which is the same "the verdict is about a different artifact" defect this
   * ticket exists to close, so it is surfaced rather than silently absorbed.
   *
   * `null` when the retained fold is current, or when the bundle has no
   * `l1.json` at all (nothing retained to be stale).
   */
  staleFold: string | null
}

/**
 * BUG-113 — the bundle's `capture.json`, or `null` when it has none.
 *
 * Only the staleness comparison wants this, and that comparison is advisory, so
 * a missing member must not turn into a thrown gate. {@link readCapture} is the
 * strict reader for the callers that genuinely cannot proceed without a theme.
 */
async function readCaptureOrNull(bundle: ReferenceBundle): Promise<Capture | null> {
  try {
    return await readCapture(bundle)
  } catch {
    return null
  }
}

/**
 * Run the acceptance gate against a capture bundle's oracle. Folds the
 * `multistate.json` to the absolute base, composes the document that is actually
 * served, and runs {@link acceptanceGate} against it. The returned report's
 * residuals each name a framework gap (a missing L1 axis, a capture-hint gap, or
 * a region needing promotion) to feed back per the DOC-21 growth loop.
 *
 * BUG-113 — the envelope probes grade `mountBehaviours(base, forms)`: the page
 * body plus every behaviour's controls, which is the artifact `1c repro` writes
 * and a browser paints. They used to grade `promoteToFlow(base).doc`, a
 * structure-recovered overlay written nowhere, so the verdict and the page were
 * about different documents. Recovery still runs — as {@link RecoveryCost}, a
 * priced alternative beside the verdict rather than the subject of it.
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
  const freshForms: FoldedForm[] = []
  // The fresh fold is still computed, because `foldResiduals` is a question
  // about FOLDER POWER — which element kinds L1 cannot express yet — and only
  // today's folder can answer it. It is no longer what gets graded.
  // Folded exactly as `1c refold` folds — FONTS INCLUDED. This fold is the
  // reference the retained artifact is compared against, so any option `refold`
  // passes and this does not shows up as a spurious difference: omitting `fonts`
  // reported every bundle stale, including one refolded seconds earlier.
  //
  // Read SOFTLY, though. `capture.json` is not something this gate has ever
  // required, and starting to require it would fail bundles that gate fine today
  // for the sake of a comparison that is advisory. Without it the fold simply
  // carries no font faces, exactly as it did before.
  const captured = await readCaptureOrNull(bundle)
  const fresh = foldToL1(multiState, {
    ...(captured ? { fonts: fontResourcesFromTheme(captured.theme.fonts) } : {}),
    residuals: foldResiduals,
    forms: freshForms,
  })
  // BUG-113 — grade what is SERVED. `1c repro` writes the bundle's retained
  // `l1.json` (localized), not a re-fold of its oracle, so a gate that re-folds
  // is grading a document the operator will never be handed. The two agree only
  // until the folder changes — and this ticket's own per-window reflow hold
  // changed it, which is how the gap was found: on `gigabytealchemy.ai` the gate
  // read 0 off-sample findings while the page `repro` wrote read 3 at 500px.
  // Retained wins; the divergence is reported as `staleFold` below.
  const retained = await readL1(bundle)
  const retainedForms = retained ? await readForms(bundle) : []
  const base = retained ?? fresh
  const forms = retained ? retainedForms : freshForms
  const staleFold =
    retained && JSON.stringify(retained) !== JSON.stringify(fresh)
      ? `bundle '${bundle.name}' retains an l1.json its own oracle no longer folds to — ` +
        `this verdict grades the retained document, which is what \`1c repro\` serves; ` +
        `run \`1c refold --ref <bundle>\` to re-derive it and gate the current fold`
      : null
  // The oracle's own text heights. A text leaf pins no height, so without these
  // the envelope is drawn around an estimate — which is what reported five
  // overlaps per width on a document whose boxes match the oracle to 0.89px.
  const measured = measuredTextHeights(multiState)
  // BUG-112 named `served` as `base` and left the question of whether that is the
  // right document to this ticket. It is the right document, on measured evidence
  // — recovery costs more fidelity than it buys — but it is not the WHOLE
  // document: the browser is handed the page body with each behaviour's controls
  // mounted at its seam, and a control colliding with the prose above it is
  // exactly the defect an operator reported seeing.
  // REQ-278 — WHICH document is served is now a measurement, not a comment. The
  // recovery keeps every promoted member's geometry and reads it as leading
  // offsets in flow, so it reproduces the capture exactly at rest; where that
  // costs no fidelity AND holds the envelope better, it is what `1c repro`
  // writes, and therefore what this gate must grade. `chooseRecovery` is the one
  // definition of that comparison, shared with `repro` so the two can never
  // disagree about which page the verdict is about.
  const choice = chooseRecovery(base, multiState, {
    scale: CONTENT_SCALE,
    measured,
    compose: (doc) => mountBehaviours(doc, forms),
  })
  const graded = choice.doc
  const report = acceptanceGate(graded, multiState, {
    served: mountBehaviours(graded, forms),
    measured,
    contentScale: CONTENT_SCALE,
  })
  const countFindings = (r: { byWidth: Array<{ findings: unknown[] }> }): number =>
    r.byWidth.reduce((n, w) => n + w.findings.length, 0)
  // The arrow always reads base → recovery, whichever of the two is being
  // served: it is the trade itself, not a statement about the winner.
  const recovery: RecoveryCost = {
    promoted: choice.promoted,
    served: choice.served,
    servedFindings: countFindings(
      contentRobustnessProbe(mountBehaviours(base, forms), { scale: CONTENT_SCALE, measured }),
    ),
    recoveredFindings: countFindings(
      contentRobustnessProbe(
        mountBehaviours(promoteToFlow(base, { scale: CONTENT_SCALE, measured }).doc, forms),
        { scale: CONTENT_SCALE, measured },
      ),
    ),
    fidelityMaxDeltaPx: choice.recovery.maxDelta,
    fidelityResiduals: choice.recovery.residuals,
  }
  return { ...report, promoted: choice.promoted, recovery, foldResiduals, forms, staleFold }
}
