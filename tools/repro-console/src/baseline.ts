/**
 * The recorded bar, and what it means to be worse than it (REQ-255).
 *
 * The regression rail answers one question — "is everything still as good as it
 * was?" — and it can only answer it against something written down. This module
 * is that something: the shape of the recorded baseline, the metrics read off a
 * gate report, and the comparison that turns two of them into a named list of
 * regressions.
 *
 * NOTHING HERE SPAWNS, READS THE ENGINE OR NEEDS A BROWSER. That is deliberate:
 * the judgement the rail exists to make is the part most worth testing, and a
 * judgement that could only be exercised behind a headless browser would be
 * tested by nobody.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/** The baseline, and the rail's scratch space, live here. Gitignored. */
export const RAIL_DIR = path.join('storage', 'rail')
export const BASELINE_FILE = path.join(RAIL_DIR, 'baseline.json')

// ── what a metric is ─────────────────────────────────────────────────────────

/**
 * Which way is better.
 *
 * `must-stay-true` is not "must be true": almost every reference's gate reads
 * FAIL today, and a rail that demanded a pass would be red on day one and
 * ignored by day two. It means *a probe that was passing may not stop* — which
 * is the only reading of "no worse" that is usable while the reproductions are
 * still poor.
 */
export type Direction = 'lower-is-better' | 'higher-is-better' | 'must-stay-true'

export interface MetricSpec {
  /**
   * A dotted path into the probe's JSON report. A segment of `[]` maps over an
   * array and sums the rest of the path across it; a path that lands on an
   * array yields its length, and one that lands on a boolean yields 0 or 1.
   */
  key: string
  direction: Direction
  /**
   * How much movement in the worse direction is noise rather than a regression.
   *
   * Only the perceptual numbers carry one. They come from rasterising a page in
   * a real browser, so they are reproducible to about a decimal place and not
   * beyond it; a rail that failed on the third decimal would cry wolf every
   * run. Counts have no tolerance — one more unmatched element is one more
   * unmatched element.
   */
  tolerance?: number
  /** What this number means, said once, so a failure line can explain itself. */
  means: string
}

/** One `1c` verb the rail asks about a reference, and what it reads off it. */
export interface ProbeSpec {
  /** The `1c` verb. Also the probe's name in the baseline and in the report. */
  name: string
  /** True when the probe drives a headless browser and can therefore be skipped. */
  needsBrowser: boolean
  /**
   * True when the verb grades OUR reproduction and therefore takes its slug.
   * `l1-gate` grades the bundle's own fold and takes only `--ref`; `gate`
   * renders the reproduced site and needs to be told which one.
   */
  needsSlug: boolean
  metrics: MetricSpec[]
  /** One line on what this probe sees that the other does not. */
  covers: string
}

/**
 * The two probes, and why there are two.
 *
 * `l1-gate` is browser-free and grades geometry against the bundle's own
 * retained oracle. `gate` is the cross-gate reconciliation — it renders the
 * reproduction in a real browser and reconciles the structural gate, the value
 * gate and the perceptual eye ([[DOC-19]]).
 *
 * Only the second can see colour, font and media, so only the second can catch
 * the regression class this rail exists for. The first is kept anyway because
 * it is seconds rather than minutes and it is the only probe that still runs
 * where there is no browser — a rail that could say nothing at all on such a
 * machine would simply not be run there.
 */
export const PROBES: ProbeSpec[] = [
  {
    name: 'l1-gate',
    needsBrowser: false,
    needsSlug: false,
    covers: 'geometry and envelope against the bundle’s own oracle; blind to colour, font and media by design',
    metrics: [
      { key: 'pass', direction: 'must-stay-true', means: 'the 3-probe structural gate' },
      { key: 'sampleFidelity.pass', direction: 'must-stay-true', means: 'sample fidelity' },
      { key: 'sampleFidelity.maxDelta', direction: 'lower-is-better', tolerance: 0.01, means: 'the worst geometry delta, in px' },
      { key: 'sampleFidelity.residuals', direction: 'lower-is-better', means: 'deltas over tolerance' },
      { key: 'sampleFidelity.unmatched', direction: 'lower-is-better', means: 'oracle samples with no reproduced leaf' },
      { key: 'offSample.pass', direction: 'must-stay-true', means: 'the off-sample envelope' },
      { key: 'offSample.byWidth[].findings', direction: 'lower-is-better', means: 'envelope findings at unsampled widths' },
      { key: 'contentRobustness.pass', direction: 'must-stay-true', means: 'the content-robustness envelope' },
      { key: 'contentRobustness.byWidth[].findings', direction: 'lower-is-better', means: 'envelope findings under scaled content' },
      { key: 'foldResiduals', direction: 'lower-is-better', means: 'elements the fold could not express as L1' },
    ],
  },
  {
    name: 'gate',
    needsBrowser: true,
    needsSlug: true,
    covers: 'the rendered reproduction — structural gate, value gate and perceptual eye, reconciled',
    metrics: [
      { key: 'pass', direction: 'must-stay-true', means: 'the reconciled cross-gate verdict' },
      { key: 'l1Pass', direction: 'must-stay-true', means: 'the structural gate inside the reconciliation' },
      { key: 'perceptual.meanDiff', direction: 'lower-is-better', tolerance: 0.25, means: 'mean per-pixel difference, 0..255' },
      { key: 'perceptual.pctOverThreshold', direction: 'lower-is-better', tolerance: 0.5, means: 'percent of pixels over the noise threshold' },
      { key: 'perceptual.regions', direction: 'lower-is-better', tolerance: 1, means: 'ranked regions of interest' },
      { key: 'values.deltas', direction: 'lower-is-better', means: 'per-element value deltas' },
      { key: 'values.matched', direction: 'higher-is-better', means: 'elements matched between the manifests' },
      { key: 'values.unmatched', direction: 'lower-is-better', means: 'elements present in one manifest only' },
    ],
  },
]

export function probeNamed(name: string): ProbeSpec | undefined {
  return PROBES.find((p) => p.name === name)
}

// ── reading a number off a report ────────────────────────────────────────────

/**
 * Follow {@link MetricSpec.key} into a report and reduce whatever it lands on
 * to one number. Returns `undefined` when the path does not resolve, which is
 * how a report shape that has moved on since the baseline was recorded stays a
 * reported gap rather than a silent zero.
 */
export function readMetric(report: unknown, key: string): number | undefined {
  const segments = key.split('.')
  let value: unknown = report
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment.endsWith('[]')) {
      const arrayKey = segment.slice(0, -2)
      const array = arrayKey ? (value as Record<string, unknown> | null)?.[arrayKey] : value
      if (!Array.isArray(array)) return undefined
      const rest = segments.slice(i + 1).join('.')
      let total = 0
      for (const item of array) {
        const part = rest ? readMetric(item, rest) : scalarOf(item)
        if (part === undefined) return undefined
        total += part
      }
      return total
    }
    if (value === null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[segment]
  }
  return scalarOf(value)
}

function scalarOf(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean') return value ? 1 : 0
  if (Array.isArray(value)) return value.length
  return undefined
}

/** Every metric a probe defines, read off one of its reports. */
export function extractMetrics(probe: ProbeSpec, report: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  for (const metric of probe.metrics) {
    const value = readMetric(report, metric.key)
    if (value !== undefined) out[metric.key] = value
  }
  return out
}

// ── the comparison ───────────────────────────────────────────────────────────

/** One way in which this run is worse than the recorded bar. */
export interface Regression {
  reference: string
  probe: string
  metric: string
  baseline: number
  current: number
  /** The operator sentence: which reference regressed, and on what. */
  detail: string
}

/** One way in which this run is better than the recorded bar. */
export interface Improvement extends Regression {}

export interface ProbeComparison {
  regressions: Regression[]
  improvements: Improvement[]
  /** Metrics the baseline has and this run did not produce — coverage that shrank. */
  missing: string[]
}

function worse(direction: Direction, baseline: number, current: number, tolerance: number): boolean {
  if (direction === 'higher-is-better') return current < baseline - tolerance
  if (direction === 'lower-is-better') return current > baseline + tolerance
  // must-stay-true: 1 → 0 is a regression; 0 → 0 and 0 → 1 are not.
  return baseline === 1 && current !== 1
}

function better(direction: Direction, baseline: number, current: number, tolerance: number): boolean {
  if (direction === 'higher-is-better') return current > baseline + tolerance
  if (direction === 'lower-is-better') return current < baseline - tolerance
  return baseline !== 1 && current === 1
}

function say(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

/**
 * Compare one probe's numbers against the recorded ones.
 *
 * A metric the baseline does not carry is NOT a regression — that is a metric
 * added since the baseline was recorded, and failing on it would make every
 * change to this table an emergency. A metric the baseline carries and the run
 * did not produce IS reported, under `missing`: coverage that quietly shrinks
 * is the failure this whole rail is built against.
 */
export function compareProbe(
  reference: string,
  probe: ProbeSpec,
  baseline: Record<string, number>,
  current: Record<string, number>,
): ProbeComparison {
  const regressions: Regression[] = []
  const improvements: Improvement[] = []
  const missing: string[] = []
  for (const metric of probe.metrics) {
    const before = baseline[metric.key]
    if (before === undefined) continue
    const after = current[metric.key]
    if (after === undefined) {
      missing.push(metric.key)
      continue
    }
    const tolerance = metric.tolerance ?? 0
    const common = { reference, probe: probe.name, metric: metric.key, baseline: before, current: after }
    if (worse(metric.direction, before, after, tolerance)) {
      regressions.push({
        ...common,
        detail:
          metric.direction === 'must-stay-true'
            ? `${reference}: ${metric.means} was passing (${probe.name}.${metric.key}) and now fails`
            : `${reference}: ${metric.means} moved ${say(before)} → ${say(after)} (${probe.name}.${metric.key})`,
      })
    } else if (better(metric.direction, before, after, tolerance)) {
      improvements.push({
        ...common,
        detail:
          metric.direction === 'must-stay-true'
            ? `${reference}: ${metric.means} now passes (${probe.name}.${metric.key})`
            : `${reference}: ${metric.means} moved ${say(before)} → ${say(after)} (${probe.name}.${metric.key})`,
      })
    }
  }
  return { regressions, improvements, missing }
}

// ── the document on disk ─────────────────────────────────────────────────────

/** One reference's recorded numbers: probe name → metric key → value. */
export interface ReferenceBaseline {
  probes: Record<string, Record<string, number>>
  /** Not compared — carried so an operator reading the file can see the verdict words. */
  notes?: Record<string, string>
}

export interface RailBaseline {
  version: 1
  recordedAt: string
  /** The package version the numbers were taken at, so a stale bar is identifiable. */
  recordedAtVersion?: string
  /**
   * Test files that were already failing when the baseline was recorded.
   *
   * The suite is not green on every machine — a missing native dependency fails
   * three dozen files here and has nothing to do with the reproduction engine.
   * The rail's contract is "no worse", so the bar for the suite is the same
   * kind of recorded set as the bar for a reference: a file that fails and is
   * not on this list is a regression; one that is on it and now passes is an
   * improvement.
   */
  failingTests: string[]
  references: Record<string, ReferenceBaseline>
}

export function emptyBaseline(): RailBaseline {
  return { version: 1, recordedAt: new Date(0).toISOString(), failingTests: [], references: {} }
}

export function baselinePath(cwd: string): string {
  return path.join(cwd, BASELINE_FILE)
}

/** The recorded bar, or `undefined` when nothing has ever been recorded. */
export function readBaseline(cwd: string): RailBaseline | undefined {
  const file = baselinePath(cwd)
  if (!existsSync(file)) return undefined
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as RailBaseline
  return { ...emptyBaseline(), ...parsed }
}

/**
 * Write the bar. THE ONLY WRITER IN THIS PACKAGE, and it is reached from one
 * place: the `record` subcommand a person types. An automated run may never
 * move the bar it is being measured against, and the way that is guaranteed is
 * that the checking path has no call to this function at all.
 */
export function writeBaseline(cwd: string, doc: RailBaseline): void {
  mkdirSync(path.join(cwd, RAIL_DIR), { recursive: true })
  writeFileSync(baselinePath(cwd), JSON.stringify(doc, null, 2) + '\n')
}
