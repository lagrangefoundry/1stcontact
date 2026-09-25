/**
 * THE UNMEASURED SET — the number an iteration is read by ([[REQ-277]]).
 *
 * [[EPIC-19]]'s audit closed on one sentence: *stop reading the delta count as
 * progress*. Landing [[BUG-107]] took a reproduction from 1 delta to 14 without
 * anything about the page changing — it added `role`/`a11yRole` comparison, so
 * eleven lost headings that had read as **zero** started reading as differences.
 * An operator reading the delta count as a score saw a 14× regression on a pure
 * improvement, and the same inversion is queued to happen on every axis the
 * capture-completeness work adds.
 *
 * The quantity that does not invert already exists. [[BUG-106]] and [[BUG-111]]
 * established the discipline — *an unmeasured axis is not a clean one: it is
 * skipped rather than compared against a stand-in* (`values-diff.ts`) — and
 * [[REQ-274]] named the axes only one side of the projection can supply. What
 * was missing is that it is not the number anybody reads. So this module is the
 * console's one definition of the set, and the page, the digest and the round's
 * prompt all take their headline from here.
 *
 * ## Counted, never inferred
 *
 * A quantity the report does not carry is `null`, not `0`. That is the whole
 * discipline restated one layer out: a gate report written before [[REQ-274]]
 * existed says nothing about unmeasured axes, and reading its silence as "none"
 * would manufacture exactly the clean bill this module exists to refuse. The
 * silent parts are named on the page beside the total.
 */

/** The four things an iteration can fail to measure, in the order they are read. */
export type UnmeasuredPartId = 'axes' | 'bands' | 'populations' | 'probes'

/** One component of the set, and what the report was able to say about it. */
export interface UnmeasuredPart {
  id: UnmeasuredPartId
  /** How it reads on the page — plural noun, lower case. */
  label: string
  /** The same noun in the singular, because `1 axes` reads as a typo. */
  one: string
  /** `null` when the report does not carry it: cannot say, which is not zero. */
  count: number | null
  /** What the count is made of, when the report names it. */
  detail?: string
}

/** The set, as one number plus the breakdown behind it. */
export interface UnmeasuredSet {
  /**
   * The sum of the parts the report could speak for.
   *
   * Meaningless when {@link known} is false, and the page says so rather than
   * printing a zero that would read as a clean instrument.
   */
  total: number
  /** False when there is no report at all — then nothing below was measured either. */
  known: boolean
  parts: UnmeasuredPart[]
  /** The parts the report does not carry, by label. */
  silent: string[]
}

/** What `gate.json`'s `values` block can say about what it did NOT compare. */
interface ValuesBlock {
  unmeasuredAxes?: unknown
  unpairedSections?: unknown
  unpairedActualSections?: unknown
  nonSurfaceSections?: unknown
  unmatched?: unknown
  unpairedActual?: unknown
  sectionsNotComparable?: unknown
}

/** A number the report actually carries, or `null` for "it does not say". */
function countOf(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.length
  return null
}

/** `a + b`, where a side that cannot say makes the pair unable to say. */
function sum(a: number | null, b: number | null): number | null {
  return a === null || b === null ? null : a + b
}

/** The axes' own names, so "3 axes" can be taken back to which three. */
function axisNames(value: unknown): string | undefined {
  if (!Array.isArray(value) || !value.length) return undefined
  const named = value
    .map((entry) => {
      const axis = (entry as { axis?: unknown; scope?: unknown })?.axis
      const scope = (entry as { scope?: unknown })?.scope
      if (typeof axis !== 'string') return null
      return typeof scope === 'string' ? `${scope}.${axis}` : axis
    })
    .filter((name): name is string => name !== null)
  return named.length ? named.join(', ') : undefined
}

/**
 * The unmeasured set of one gate report ([[REQ-277]] behaviour 1).
 *
 * The four parts are the ticket's definition, mapped onto the fields the gate
 * already writes:
 *
 * | part | `gate.json` | what it means |
 * |---|---|---|
 * | axes | `values.unmeasuredAxes` | a compared axis only one side of the projection can read ([[REQ-274]]) |
 * | bands | `values.unpairedSections` + `values.unpairedActualSections` | a section with no counterpart, so its section-level values were never compared ([[BUG-111]]) |
 *
 * `values.nonSurfaceSections` ([[REQ-308]]) is NOT a fifth part and is not summed
 * into `bands`: a reference band that paints nothing is one no fold could ever
 * emit a counterpart for, so it is not a measurement anybody failed to make. It
 * is named on the `bands` part instead, because a total that quietly got smaller
 * reads as progress the reproduction did not make.
 * | populations | `values.unmatched` + `values.unpairedActual` | an element on either side that paired with nothing ([[BUG-106]]) |
 * | probes | `values.sectionsNotComparable` | a measurement the run declared it could not make at all ([[BUG-102]]) |
 *
 * Nothing here is new measurement — [[REQ-277]] is explicit that changing what
 * the gate measures is out of scope. It is arithmetic over numbers the gate
 * already produces, done in one place so the page, the digest and the prompt
 * cannot quote three different totals.
 */
export function unmeasuredOf(report: unknown): UnmeasuredSet {
  if (!report || typeof report !== 'object') {
    return {
      total: 0,
      known: false,
      parts: [],
      silent: ['the whole set — there is no gate report to read it from'],
    }
  }
  const values = ((report as { values?: ValuesBlock }).values ?? {}) as ValuesBlock
  const axes = countOf(values.unmeasuredAxes)
  const bands = sum(countOf(values.unpairedSections), countOf(values.unpairedActualSections))
  const populations = sum(countOf(values.unmatched), countOf(values.unpairedActual))
  // A reason is one probe that did not run; its absence is the probe running.
  // Unlike the three above this cannot be silent: the field is optional BECAUSE
  // absent means "the sections were comparable", which is a measurement.
  const probes = typeof values.sectionsNotComparable === 'string' && values.sectionsNotComparable.trim() ? 1 : 0
  // REQ-308 — not a part of the set, and deliberately not summed into `bands`:
  // it is the reason a band LEFT the set. `null` (a report predating the field)
  // reads as nothing to say, which is what it is.
  const nonSurface = countOf(values.nonSurfaceSections) ?? 0

  const parts: UnmeasuredPart[] = [
    {
      id: 'axes',
      label: 'axes',
      one: 'axis',
      count: axes,
      ...(axisNames(values.unmeasuredAxes) ? { detail: axisNames(values.unmeasuredAxes) as string } : {}),
    },
    {
      id: 'bands',
      label: 'bands',
      one: 'band',
      count: bands,
      // REQ-308 — a reference band that paints nothing has no counterpart any
      // fold could emit, so the comparator reclassifies it rather than counting
      // it here. That is a REAL drop in the set (the measurement was never
      // possible), but a total that merely got smaller with no word about why
      // reads as "the reproduction improved" — which is the false-progress shape
      // this whole module exists to refuse, facing the other way. Counted
      // nowhere; named here.
      ...(nonSurface ? { detail: `${nonSurface} reference band(s) paint nothing and are not counted` } : {}),
    },
    { id: 'populations', label: 'populations', one: 'population', count: populations },
    {
      id: 'probes',
      label: 'probes',
      one: 'probe',
      count: probes,
      ...(probes ? { detail: String(values.sectionsNotComparable) } : {}),
    },
  ]
  const known = parts.filter((part) => part.count !== null)
  return {
    total: known.reduce((n, part) => n + (part.count ?? 0), 0),
    // A report that can speak for nothing at all is no better than no report.
    known: known.length > 0,
    parts,
    silent: parts.filter((part) => part.count === null).map((part) => part.label),
  }
}

/**
 * `unmeasured 7`, `unmeasured ≥ 3`, or the fact that the report cannot say.
 *
 * THE `≥` IS LOAD-BEARING. A report that does not carry one of the four parts
 * has a total that can only be higher than it reads, and printing a bare number
 * over a partial report is the same silence — one layer out — that this module
 * exists to break.
 */
export function headlineOf(set: UnmeasuredSet): string {
  if (!set.known) return 'unmeasured — this iteration produced no report to read it from'
  return set.silent.length ? `unmeasured ≥ ${set.total}` : `unmeasured ${set.total}`
}

/** `3 axes, 2 bands, 2 populations, 0 probes`, plus what the report cannot say. */
export function breakdownOf(set: UnmeasuredSet): string {
  const counted = set.parts
    .filter((part) => part.count !== null)
    .map((part) => `${part.count} ${part.count === 1 ? part.one : part.label}${part.detail ? ` (${part.detail})` : ''}`)
    .join(', ')
  if (!set.silent.length) return counted
  const cannot = `this report does not carry ${set.silent.join(', ')} — not counted, and not zero`
  return counted ? `${counted} · ${cannot}` : cannot
}

/** Which way a number moved between two iterations. */
export type Direction = 'down' | 'up' | 'level' | 'unknown'

export function directionOf(previous: number | null, current: number | null): Direction {
  if (previous === null || current === null) return 'unknown'
  if (current < previous) return 'down'
  if (current > previous) return 'up'
  return 'level'
}

/** `↓ 2 from iteration 1`, in the arrow the page uses for both numbers. */
function movement(previous: number, current: number, from: number): string {
  if (current === previous) return `level with iteration ${from}`
  const arrow = current < previous ? '↓' : '↑'
  return `${arrow} ${Math.abs(current - previous)} from iteration ${from}`
}

/** Two iterations' unmeasured sets, over the parts BOTH of them can speak for. */
interface Comparison {
  previous: number
  current: number
  /** Which parts the pair was summed over. */
  basis: UnmeasuredPartId[]
  /** True when that basis is the whole set on both sides. */
  whole: boolean
}

/**
 * Compare two sets on the parts they have in common, or not at all.
 *
 * A part one report carries and the other does not cannot be differenced, and
 * silently treating the missing side as zero would report the arrival of a
 * QUANTITY as a movement in the thing it measures — the same false-progress
 * shape, inverted. So the basis is the intersection and the page says what it
 * was summed over whenever it is not the whole set.
 */
function compareSets(previous: UnmeasuredSet, current: UnmeasuredSet): Comparison | null {
  const byId = new Map(previous.parts.map((part) => [part.id, part.count]))
  const basis: UnmeasuredPartId[] = []
  let before = 0
  let after = 0
  for (const part of current.parts) {
    const was = byId.get(part.id)
    if (part.count === null || was === null || was === undefined) continue
    basis.push(part.id)
    before += was
    after += part.count
  }
  if (!basis.length) return null
  return { previous: before, current: after, basis, whole: basis.length === current.parts.length && !previous.silent.length }
}

/** One iteration's two numbers, and what the pair of movements means. */
export interface MeasurementView {
  /** The headline: the unmeasured count, first ([[REQ-277]] behaviour 2). */
  headline: string
  /** What the headline is made of. */
  breakdown: string
  /** How the unmeasured set moved since the previous iteration. */
  unmeasuredMove?: string
  /** The delta count, which stays — under the headline rather than as it. */
  deltas: string
  /**
   * The sentence that stops the delta count being read as a score
   * ([[REQ-277]] behaviour 3).
   *
   * Written out in full on the page, because an operator should not have to
   * know [[REQ-277]] exists to read the two numbers the right way round.
   */
  reading?: string
}

export interface MeasurementInput {
  n: number
  unmeasured: UnmeasuredSet
  /** `values.deltas`, or `null` when this iteration produced no report. */
  deltas: number | null
  previous?: {
    n: number
    unmeasured: UnmeasuredSet
    deltas: number | null
  }
  /**
   * The reference moved between the previous iteration and this one
   * ([[REQ-277]] behaviour 4).
   *
   * [[REQ-272]] already marks the seam on the page; this is what the seam MEANS
   * for the numbers either side of it. The delta count is a comparison against
   * the oracle, so a new oracle makes it a different measurement wearing the
   * same name — and the unmeasured set is not: a re-capture is the main way it
   * falls, which is precisely the movement this ticket exists to make visible.
   */
  seam?: boolean
}

/** What a rising delta count means, given what the unmeasured set did. */
function readingFor(
  input: MeasurementInput,
  previous: NonNullable<MeasurementInput['previous']>,
  comparison: Comparison | null,
): string | undefined {
  const measured = directionOf(comparison?.previous ?? null, comparison?.current ?? null)
  const deltas = input.seam ? 'unknown' : directionOf(previous.deltas, input.deltas)
  const fewer = (comparison?.previous ?? 0) - (comparison?.current ?? 0)

  if (measured === 'down' && deltas === 'up') {
    return (
      `The instrument sharpened: ${fewer} fewer measurement(s) were skipped this iteration, and the ` +
      `delta count rose because the gate is now comparing what it used to pass over in silence. ` +
      `This is progress, not a regression — the unmeasured set is the number to drive down.`
    )
  }
  if (measured === 'down') {
    return `${fewer} fewer measurement(s) were skipped this iteration. The unmeasured set is the number to drive down, and it fell.`
  }
  if (measured === 'up') {
    return (
      `The instrument went blind on ${-fewer} more measurement(s) than iteration ${previous.n}. ` +
      `That is the movement that matters, whatever the delta count did.`
    )
  }
  if (measured === 'level' && deltas === 'up') {
    return `The same set was measured and more of it disagrees — this delta count rose without the instrument changing, so the reproduction moved, not the ruler.`
  }
  if (measured === 'level' && deltas === 'down') {
    return 'Fewer differences over exactly the same measured set.'
  }
  if (measured === 'unknown') {
    return 'One of the two iterations could not say what it left unmeasured, so the pair cannot be compared on that axis.'
  }
  return undefined
}

/**
 * The two numbers of one iteration, in the order they must be read.
 *
 * The unmeasured set first and the delta count under it — [[REQ-277]] behaviour
 * 2 is a statement about ORDER, and this function is where that order is
 * decided once for every surface that shows the pair.
 */
export function measurementView(input: MeasurementInput): MeasurementView {
  const view: MeasurementView = {
    headline: headlineOf(input.unmeasured),
    breakdown: breakdownOf(input.unmeasured),
    deltas: input.deltas === null ? 'delta count — no report' : `${input.deltas} delta(s)`,
  }
  const previous = input.previous
  if (!previous) return view

  const comparison = compareSets(previous.unmeasured, input.unmeasured)
  if (comparison) {
    view.unmeasuredMove =
      movement(comparison.previous, comparison.current, previous.n) +
      (comparison.whole ? '' : ` (over ${comparison.basis.join(', ')} — the parts both reports carry)`)
  }
  if (input.seam) {
    /**
     * NOT COMPARABLE, ON THE DELTA AXIS SPECIFICALLY ([[REQ-277]] behaviour 4).
     *
     * Said here and not about the unmeasured set, which is deliberate and is the
     * whole point of naming the axis: a re-capture re-rolls the oracle, so the
     * delta count either side of it is two different measurements sharing a
     * name — while the unmeasured set falling IS what a re-capture is for.
     */
    view.deltas += ` · not comparable with iteration ${previous.n}: the reference moved, so this count is measured against a different oracle`
  } else if (previous.deltas !== null && input.deltas !== null) {
    view.deltas += ` · ${movement(previous.deltas, input.deltas, previous.n)}`
  }
  const reading = readingFor(input, previous, comparison)
  if (reading) view.reading = reading
  return view
}
