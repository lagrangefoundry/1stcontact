/**
 * REQ-31 — the fidelity verification loop's mechanical half.
 *
 * Reproduction (REQ-20) drifts at the *value* level — exact colours, font
 * sizes, gradient direction, left-bar treatments — and screenshots hide exactly
 * that class of delta (near-neighbour golds, 72px vs 48px, horizontal vs
 * vertical sweep). This module turns "a value you could just read off the DOM"
 * from missed-by-eye into mechanically-flagged.
 *
 * Two pure pieces, both browser-free and therefore deterministically testable:
 *
 *   1. {@link flattenCapture} / {@link flattenSignals} — project a capture
 *      bundle (the reference) or a live extraction (our reproduction) into a
 *      flat {@link ValueManifest}: one {@link ValueElement} per verbatim text
 *      run, carrying its resolved styling. Text is captured verbatim (DOC-13
 *      §5), so the run text is the natural join key between the two sides.
 *   2. {@link diffManifests} — align expected↔actual by text and diff each
 *      styling field, emitting a severity-ranked {@link ValueDelta} list. Vision
 *      is then reserved for what a manifest can't encode ("does the gradient
 *      read intentional"), not for reading a hex.
 */
import type {
  BorderTreatment,
  Capture,
  ContentRun,
  TextGradient,
} from './types'
import type { RawRun, RawSignals } from './extract'

// ── manifest model ───────────────────────────────────────────────────────────

/** One text run projected to its comparable value fields (REQ-31). */
export interface ValueElement {
  /** Verbatim text (display form; the join key is its normalized version). */
  text: string
  role: string
  color: string
  fontFamily: string
  fontSizePx: number
  fontWeight: number
  lineHeightPx?: number
  letterSpacingPx?: number
  gradient?: TextGradient | null
  borderLeft?: BorderTreatment | null
  paddingLeftPx?: number
}

/** A flat, structured value manifest — the single artifact the diff and a human both read. */
export interface ValueManifest {
  /** Where these values came from (a capture host/path, or `draft:<slug>`). */
  source: string
  elements: ValueElement[]
}

export type DeltaProperty =
  | 'missing'
  | 'color'
  | 'gradient'
  | 'borderLeft'
  | 'fontSizePx'
  | 'fontWeight'
  | 'fontFamily'
  | 'lineHeightPx'
  | 'letterSpacingPx'
  | 'paddingLeftPx'

/** A single field-level disagreement between expected and actual. */
export interface ValueDelta {
  /** Expected element text (truncated for display). */
  text: string
  role: string
  property: DeltaProperty
  expected: string
  actual: string
  /** Rank weight; higher sorts first. */
  severity: number
}

export interface ValuesDiffReport {
  expectedSource: string
  actualSource: string
  /** Expected elements paired with an actual element. */
  matched: number
  /** Expected elements with no actual match. */
  unmatched: number
  /** Field-level deltas, most-severe first. */
  deltas: ValueDelta[]
}

// ── gradient normalization ───────────────────────────────────────────────────

/** `to <side[ side]>` → CSS angle in degrees (direction the gradient points). */
const SIDE_ANGLES: Record<string, number> = {
  top: 0,
  right: 90,
  bottom: 180,
  left: 270,
  'top right': 45,
  'right top': 45,
  'bottom right': 135,
  'right bottom': 135,
  'bottom left': 225,
  'left bottom': 225,
  'top left': 315,
  'left top': 315,
}

/** Any `rgb()/rgba()/#hex` colour token → `#rrggbb` (drops alpha). */
export function colorToHex(token: string): string | null {
  const t = token.trim()
  const hex = t.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (hex) {
    const h = hex[1]
    return (h.length === 3 ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : `#${h}`).toLowerCase()
  }
  const rgb = t.match(/rgba?\(([^)]+)\)/)
  if (rgb) {
    const p = rgb[1].split(',').map((s) => parseFloat(s.trim()))
    if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null
    const h = (n: number) => ('0' + Math.round(n).toString(16)).slice(-2)
    return `#${h(p[0])}${h(p[1])}${h(p[2])}`
  }
  return null
}

/**
 * Normalize a computed `linear-gradient(...)` string to {@link TextGradient}.
 * Non-linear (radial/conic) or unparseable input yields `{ angleDeg: null }` so
 * a gradient's *presence* is still comparable even when its direction is not.
 */
export function normalizeGradient(css: string | null | undefined): TextGradient | null {
  if (!css || !/gradient\(/.test(css)) return null

  const stops: string[] = []
  const colorRe = /(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\))/g
  let m: RegExpExecArray | null
  while ((m = colorRe.exec(css))) {
    const hex = colorToHex(m[1])
    if (hex) stops.push(hex)
  }

  if (!/linear-gradient\(/.test(css)) return { angleDeg: null, stops }

  const inner = css.slice(css.indexOf('linear-gradient(') + 'linear-gradient('.length)
  const firstArg = inner.split(',')[0].trim()
  let angleDeg: number | null = 180 // CSS default direction is `to bottom`
  const deg = firstArg.match(/^(-?\d+(?:\.\d+)?)deg$/)
  const isColorFirst = /^(#|rgb)/.test(firstArg)
  if (deg) {
    angleDeg = ((parseFloat(deg[1]) % 360) + 360) % 360
  } else if (/^to\s+/.test(firstArg)) {
    const side = firstArg.replace(/^to\s+/, '').replace(/\s+/g, ' ').trim().toLowerCase()
    angleDeg = side in SIDE_ANGLES ? SIDE_ANGLES[side] : null
  } else if (!isColorFirst) {
    // First arg is neither an angle, a side, nor a colour — unknown direction.
    angleDeg = null
  }
  return { angleDeg, stops }
}

// ── projection: runs → elements ──────────────────────────────────────────────

const norm = (text: string): string => text.replace(/\s+/g, ' ').trim().toLowerCase()

/** Project a {@link ContentRun} (from a capture bundle) to a {@link ValueElement}. */
export function contentRunToElement(run: ContentRun): ValueElement {
  const el: ValueElement = {
    text: run.text,
    role: run.role,
    color: run.color,
    fontFamily: run.fontFamily,
    fontSizePx: run.fontSizePx,
    fontWeight: run.fontWeight,
  }
  if (run.lineHeightPx !== undefined) el.lineHeightPx = run.lineHeightPx
  if (run.letterSpacingPx !== undefined) el.letterSpacingPx = run.letterSpacingPx
  if (run.gradient !== undefined) el.gradient = run.gradient
  if (run.borderLeft !== undefined) el.borderLeft = run.borderLeft
  if (run.paddingLeftPx !== undefined) el.paddingLeftPx = run.paddingLeftPx
  return el
}

/** Project a raw extracted run (our live reproduction) to a {@link ValueElement}. */
export function rawRunToElement(run: RawRun): ValueElement {
  const border: BorderTreatment | null =
    run.borderLeftWidthPx > 0 && run.borderLeftColor
      ? { widthPx: run.borderLeftWidthPx, color: run.borderLeftColor }
      : null
  const el: ValueElement = {
    text: run.text,
    role: run.role,
    color: run.color,
    fontFamily: run.fontFamily,
    fontSizePx: run.fontSizePx,
    fontWeight: run.fontWeight,
    letterSpacingPx: run.letterSpacingPx,
    gradient: normalizeGradient(run.gradientCss),
    borderLeft: border,
    paddingLeftPx: run.paddingLeftPx,
  }
  if (run.lineHeightPx !== null) el.lineHeightPx = run.lineHeightPx
  return el
}

/** Flatten a capture bundle's sections (+ repeated items) into a value manifest. */
export function flattenCapture(capture: Capture): ValueManifest {
  const elements: ValueElement[] = []
  for (const section of capture.sections) {
    for (const run of section.content) elements.push(contentRunToElement(run))
    for (const item of section.items) {
      for (const run of item.content) elements.push(contentRunToElement(run))
    }
  }
  return { source: `${capture.host}${capture.path}`, elements }
}

/** Flatten a live extraction (our reproduction) into a value manifest. */
export function flattenSignals(signals: RawSignals, source: string): ValueManifest {
  const elements: ValueElement[] = []
  for (const band of signals.bands) {
    for (const run of band.content) elements.push(rawRunToElement(run))
    for (const item of band.items) {
      for (const run of item) elements.push(rawRunToElement(run))
    }
  }
  return { source, elements }
}

// ── diff ─────────────────────────────────────────────────────────────────────

/** Per-property rank weights: the deltas the eye misses most sort to the top. */
const SEVERITY: Record<DeltaProperty, number> = {
  missing: 100,
  color: 90,
  gradient: 85,
  borderLeft: 80,
  fontSizePx: 70,
  fontFamily: 55,
  fontWeight: 50,
  lineHeightPx: 30,
  paddingLeftPx: 25,
  letterSpacingPx: 20,
}

export interface DiffOptions {
  /** Absolute px tolerance for size/length fields (default 0 — exact). */
  sizeTolerancePx?: number
  /** Gradient direction tolerance in degrees (default 20). */
  gradientAngleToleranceDeg?: number
}

function gradientLabel(g: TextGradient | null | undefined): string {
  if (!g) return 'none'
  const dir = g.angleDeg === null ? '?°' : `${g.angleDeg}°`
  return `${dir} [${g.stops.join(', ')}]`
}

function borderLabel(b: BorderTreatment | null | undefined): string {
  return b ? `${b.widthPx}px ${b.color}` : 'none'
}

/** True when both gradients agree on direction (within tolerance) and stop colours. */
function gradientsMatch(a: TextGradient, b: TextGradient, tolDeg: number): boolean {
  const stopsEqual = a.stops.length === b.stops.length && a.stops.every((s, i) => s === b.stops[i])
  if (!stopsEqual) return false
  if (a.angleDeg === null || b.angleDeg === null) return a.angleDeg === b.angleDeg
  let d = Math.abs(a.angleDeg - b.angleDeg) % 360
  if (d > 180) d = 360 - d
  return d <= tolDeg
}

/**
 * Diff an actual manifest against an expected one, field by field, aligning
 * elements by verbatim text. Only fields present on the *expected* side are
 * compared — the expected manifest (the captured reference) is authoritative
 * about what must be reproduced. Returns deltas ranked most-severe first.
 */
export function diffManifests(
  expected: ValueManifest,
  actual: ValueManifest,
  opts: DiffOptions = {},
): ValuesDiffReport {
  const sizeTol = opts.sizeTolerancePx ?? 0
  const angleTol = opts.gradientAngleToleranceDeg ?? 20

  // Group actual elements by normalized text into FIFO queues so repeated texts
  // pair with expected occurrences in document order.
  const queues = new Map<string, ValueElement[]>()
  for (const el of actual.elements) {
    const key = norm(el.text)
    const q = queues.get(key)
    if (q) q.push(el)
    else queues.set(key, [el])
  }

  const deltas: ValueDelta[] = []
  let matched = 0
  let unmatched = 0

  const push = (
    e: ValueElement,
    property: DeltaProperty,
    expectedVal: string,
    actualVal: string,
  ): void => {
    deltas.push({
      text: e.text.length > 60 ? `${e.text.slice(0, 57)}…` : e.text,
      role: e.role,
      property,
      expected: expectedVal,
      actual: actualVal,
      severity: SEVERITY[property],
    })
  }

  for (const exp of expected.elements) {
    const q = queues.get(norm(exp.text))
    const act = q && q.length > 0 ? q.shift() : undefined
    if (!act) {
      unmatched++
      push(exp, 'missing', 'present', 'absent')
      continue
    }
    matched++

    if (exp.color.toLowerCase() !== act.color.toLowerCase()) {
      push(exp, 'color', exp.color, act.color)
    }
    if (Math.abs(exp.fontSizePx - act.fontSizePx) > sizeTol) {
      push(exp, 'fontSizePx', `${exp.fontSizePx}`, `${act.fontSizePx}`)
    }
    if (exp.fontWeight !== act.fontWeight) {
      push(exp, 'fontWeight', `${exp.fontWeight}`, `${act.fontWeight}`)
    }
    if (exp.fontFamily.toLowerCase() !== act.fontFamily.toLowerCase()) {
      push(exp, 'fontFamily', exp.fontFamily, act.fontFamily)
    }
    if (exp.gradient !== undefined) {
      const e = exp.gradient
      const a = act.gradient ?? null
      const ok = (!e && !a) || (!!e && !!a && gradientsMatch(e, a, angleTol))
      if (!ok) push(exp, 'gradient', gradientLabel(e), gradientLabel(a))
    }
    if (exp.borderLeft !== undefined) {
      const e = exp.borderLeft
      const a = act.borderLeft ?? null
      const ok =
        (!e && !a) ||
        (!!e && !!a && Math.abs(e.widthPx - a.widthPx) <= sizeTol && e.color.toLowerCase() === a.color.toLowerCase())
      if (!ok) push(exp, 'borderLeft', borderLabel(e), borderLabel(a))
    }
    if (exp.lineHeightPx !== undefined && act.lineHeightPx !== undefined) {
      if (Math.abs(exp.lineHeightPx - act.lineHeightPx) > sizeTol) {
        push(exp, 'lineHeightPx', `${exp.lineHeightPx}`, `${act.lineHeightPx}`)
      }
    }
    if (exp.letterSpacingPx !== undefined && act.letterSpacingPx !== undefined) {
      if (Math.abs(exp.letterSpacingPx - act.letterSpacingPx) > sizeTol) {
        push(exp, 'letterSpacingPx', `${exp.letterSpacingPx}`, `${act.letterSpacingPx}`)
      }
    }
    if (exp.paddingLeftPx !== undefined && act.paddingLeftPx !== undefined) {
      if (Math.abs(exp.paddingLeftPx - act.paddingLeftPx) > sizeTol) {
        push(exp, 'paddingLeftPx', `${exp.paddingLeftPx}`, `${act.paddingLeftPx}`)
      }
    }
  }

  // Stable sort: within a severity band, deltas keep document order.
  deltas.sort((a, b) => b.severity - a.severity)
  return {
    expectedSource: expected.source,
    actualSource: actual.source,
    matched,
    unmatched,
    deltas,
  }
}
