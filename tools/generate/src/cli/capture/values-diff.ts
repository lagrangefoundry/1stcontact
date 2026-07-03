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
 *      run, carrying its resolved styling, plus a {@link SectionValues} per
 *      section for treatments a text run can't hold (a hero scrim, where the
 *      content sits vertically). Text is captured verbatim (DOC-13 §5), so the
 *      run text is the natural join key; sections join by ordinal index.
 *   2. {@link diffManifests} — align expected↔actual by case-folded text and
 *      diff each field, including the *verbatim* text (casing is normalized away
 *      in the join key but is itself a captured value, so "Gigabyte Alchemy" vs
 *      "GIGABYTE ALCHEMY" is flagged), emitting a severity-ranked
 *      {@link ValueDelta} list. Vision is then reserved for what a manifest
 *      can't encode ("does the gradient read intentional"), not for reading a
 *      hex or spotting a casing slip.
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
  /**
   * REQ-35 — true when this run's colour could not be resolved from computed
   * styles and fell back to the `#000000`/`#ffffff` sentinel. The capture was
   * *guessing*, so the diff treats the colour as low-confidence and does not
   * emit a hard colour delta against it (a dark footer / over-image header the
   * fallback mislabels as black-on-white would otherwise diff forever).
   */
  colorInferred?: boolean
}

/**
 * Section-level values — treatments that belong to a whole section, not a text
 * run, so they have no text to join on and are aligned by ordinal index instead
 * (REQ-31). These are exactly the composition-level deltas a text-run manifest
 * couldn't encode: a hero scrim and where the content sits vertically.
 */
export interface SectionValues {
  /** Section ordinal in document order — the join key between the two sides. */
  index: number
  /** Full-bleed translucent overlay (a hero scrim) painted over the section, or null. */
  overlay: { color: string; opacity: number } | null
  /** Vertical content anchor (0 = top … 1 = bottom), or null when the section is textless. */
  contentAnchorRatio: number | null
}

/** A flat, structured value manifest — the single artifact the diff and a human both read. */
export interface ValueManifest {
  /** Where these values came from (a capture host/path, or `draft:<slug>`). */
  source: string
  elements: ValueElement[]
  /** Section-level treatments (scrim, vertical anchor), aligned by ordinal index. */
  sections: SectionValues[]
}

export type DeltaProperty =
  | 'missing'
  | 'text'
  | 'color'
  | 'gradient'
  | 'overlay'
  | 'borderLeft'
  | 'fontSizePx'
  | 'contentAnchor'
  | 'fontWeight'
  | 'fontFamily'
  | 'lineHeightPx'
  | 'letterSpacingPx'
  | 'paddingLeftPx'

/** A single field-level disagreement between expected and actual. */
export interface ValueDelta {
  /** Expected element text, or `§<n>` for a section-level delta (truncated for display). */
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

/** `#rrggbb`/`rgb()` → `[r, g, b]` (0–255), or null if unparseable. */
function toRgb(token: string): [number, number, number] | null {
  const hex = colorToHex(token)
  if (!hex) return null
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/**
 * Perceptual distance between two colours (REQ-35), using the low-cost "redmean"
 * approximation of CIE ΔE. Two identical colours score 0; the largest possible
 * distance (`#000` vs `#fff`) is ≈765. A tiny threshold (~3) suppresses the
 * imperceptible per-channel rounding that separates a re-render from its capture
 * while leaving real near-neighbour deltas — the flagship gold-vs-gold
 * (`#f5e6a3` vs `#fbba72`, ≈113) the tool exists to catch — well above the line.
 * Unparseable input scores `Infinity` so an unknown colour is never silently
 * treated as a match.
 */
export function colorDistance(a: string, b: string): number {
  const ca = toRgb(a)
  const cb = toRgb(b)
  if (!ca || !cb) return Infinity
  const rmean = (ca[0] + cb[0]) / 2
  const dr = ca[0] - cb[0]
  const dg = ca[1] - cb[1]
  const db = ca[2] - cb[2]
  return Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db)
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

/** Collapse internal whitespace runs and trim — the case-preserving normal form. */
const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim()
/** Case-insensitive join key: the collapsed text lowercased. */
const norm = (text: string): string => collapse(text).toLowerCase()

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
  if (run.colorInferred) el.colorInferred = true
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
  if (run.colorInferred) el.colorInferred = true
  return el
}

/** Flatten a capture bundle's sections (+ repeated items) into a value manifest. */
export function flattenCapture(capture: Capture): ValueManifest {
  const elements: ValueElement[] = []
  const sections: SectionValues[] = capture.sections.map((section, index) => ({
    index,
    overlay: section.background.overlay ?? null,
    contentAnchorRatio: section.layout.contentAnchorRatio ?? null,
  }))
  for (const section of capture.sections) {
    for (const run of section.content) elements.push(contentRunToElement(run))
    for (const item of section.items) {
      for (const run of item.content) elements.push(contentRunToElement(run))
    }
  }
  return { source: `${capture.host}${capture.path}`, elements, sections }
}

/**
 * Flatten a live extraction (our reproduction) into a value manifest. Section
 * values are read from the *raw* bands (uncoalesced), so section indices align
 * with the capture's coalesced sections at the top of the document — where the
 * hero (the scrim/anchor target) always sits at index 0.
 */
export function flattenSignals(signals: RawSignals, source: string): ValueManifest {
  const elements: ValueElement[] = []
  const sections: SectionValues[] = signals.bands.map((band, index) => ({
    index,
    overlay: band.overlay ?? null,
    contentAnchorRatio: band.contentAnchorRatio ?? null,
  }))
  for (const band of signals.bands) {
    for (const run of band.content) elements.push(rawRunToElement(run))
    for (const item of band.items) {
      for (const run of item) elements.push(rawRunToElement(run))
    }
  }
  return { source, elements, sections }
}

// ── diff ─────────────────────────────────────────────────────────────────────

/** Per-property rank weights: the deltas the eye misses most sort to the top. */
const SEVERITY: Record<DeltaProperty, number> = {
  missing: 100,
  text: 95,
  color: 90,
  gradient: 85,
  overlay: 82,
  borderLeft: 80,
  fontSizePx: 70,
  contentAnchor: 65,
  fontFamily: 55,
  fontWeight: 50,
  lineHeightPx: 30,
  paddingLeftPx: 25,
  letterSpacingPx: 20,
}

/**
 * Diff tolerances (REQ-35). The measurement fields carry jitter-tolerant
 * defaults so a "clean" diff reflects real fidelity gaps, not sub-pixel /
 * sub-step measurement noise — line-height rounds by font metric, weights snap
 * to the nearest *loaded* face, sizes ±1px viewport-clamp. Each is tight enough
 * to still catch a genuine off-by-one-step design error. `strict` zeroes every
 * measurement tolerance for an exact-match pass (colour → exact hex).
 */
export interface DiffOptions {
  /** Exact-match mode: zero every measurement tolerance below. Overrides them. */
  strict?: boolean
  /** Perceptual colour distance (redmean ΔE) under which a colour pair matches (default 3). */
  colorTolerance?: number
  /** Font-size px tolerance (default 1). */
  fontSizeTolerancePx?: number
  /**
   * Line-height px floor tolerance (default 2). Line-height is proportional to
   * font size, so the effective tolerance is `max(floor, ratio × expected)` —
   * this floor only dominates on small text. See {@link lineHeightToleranceRatio}.
   */
  lineHeightTolerancePx?: number
  /**
   * Line-height relative tolerance as a fraction of the expected line-height
   * (default 0.12). The dominant jitter bucket is font-metric line-height drift,
   * which scales with the value; a relative band tracks it where an absolute px
   * floor cannot (4px is noise on a 72px heading, a real delta on a 14px caption).
   */
  lineHeightToleranceRatio?: number
  /** Letter-spacing px tolerance (default 0.5). */
  letterSpacingTolerancePx?: number
  /** Left-padding px tolerance (default 1). */
  paddingTolerancePx?: number
  /** Left-bar width px tolerance (default 1). */
  borderWidthTolerancePx?: number
  /** Font-weight tolerance — suppresses nearest-loaded-weight snap (default 100). */
  fontWeightTolerance?: number
  /** Gradient direction tolerance in degrees (default 20). */
  gradientAngleToleranceDeg?: number
  /** Overlay (scrim) opacity tolerance, 0–1 (default 0.1). */
  overlayOpacityTolerance?: number
  /** Vertical-anchor tolerance as a fraction of box height (default 0.15). */
  anchorTolerance?: number
}

function gradientLabel(g: TextGradient | null | undefined): string {
  if (!g) return 'none'
  const dir = g.angleDeg === null ? '?°' : `${g.angleDeg}°`
  return `${dir} [${g.stops.join(', ')}]`
}

function borderLabel(b: BorderTreatment | null | undefined): string {
  return b ? `${b.widthPx}px ${b.color}` : 'none'
}

function overlayLabel(o: { color: string; opacity: number } | null): string {
  return o ? `${o.color} @ ${o.opacity}` : 'none'
}

/** Ratio → legible anchor label, e.g. `bottom (0.82)`. */
function anchorLabel(ratio: number): string {
  const band = ratio < 0.38 ? 'top' : ratio > 0.62 ? 'bottom' : 'center'
  return `${band} (${ratio.toFixed(2)})`
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
 * text elements by case-folded text and section-level values (scrim, vertical
 * anchor) by ordinal index. The verbatim text is itself compared once paired
 * (casing/whitespace the join key folds away is still a captured value). Only
 * fields present on the *expected* side are compared — the expected manifest
 * (the captured reference) is authoritative about what must be reproduced.
 * Returns deltas ranked most-severe first.
 */
export function diffManifests(
  expected: ValueManifest,
  actual: ValueManifest,
  opts: DiffOptions = {},
): ValuesDiffReport {
  const strict = opts.strict ?? false
  // `strict` collapses every measurement tolerance to exact; otherwise each
  // falls back to its jitter-tolerant default.
  const tol = (v: number | undefined, def: number): number => (strict ? 0 : (v ?? def))
  const colorTol = tol(opts.colorTolerance, 3)
  const fontSizeTol = tol(opts.fontSizeTolerancePx, 1)
  const lineHeightFloor = tol(opts.lineHeightTolerancePx, 2)
  const lineHeightRatio = tol(opts.lineHeightToleranceRatio, 0.12)
  const letterSpacingTol = tol(opts.letterSpacingTolerancePx, 0.5)
  const paddingTol = tol(opts.paddingTolerancePx, 1)
  const borderWidthTol = tol(opts.borderWidthTolerancePx, 1)
  const weightTol = tol(opts.fontWeightTolerance, 100)
  // Structural tolerances (direction bucket, scrim opacity, vertical anchor) are
  // not sub-step measurement jitter, so `strict` leaves them at their defaults.
  const angleTol = opts.gradientAngleToleranceDeg ?? 20
  const opacityTol = opts.overlayOpacityTolerance ?? 0.1
  const anchorTol = opts.anchorTolerance ?? 0.15

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

  const record = (
    text: string,
    role: string,
    property: DeltaProperty,
    expectedVal: string,
    actualVal: string,
  ): void => {
    deltas.push({
      text: text.length > 60 ? `${text.slice(0, 57)}…` : text,
      role,
      property,
      expected: expectedVal,
      actual: actualVal,
      severity: SEVERITY[property],
    })
  }
  const push = (
    e: ValueElement,
    property: DeltaProperty,
    expectedVal: string,
    actualVal: string,
  ): void => record(e.text, e.role, property, expectedVal, actualVal)

  for (const exp of expected.elements) {
    const q = queues.get(norm(exp.text))
    const act = q && q.length > 0 ? q.shift() : undefined
    if (!act) {
      unmatched++
      push(exp, 'missing', 'present', 'absent')
      continue
    }
    matched++

    // Verbatim content. Elements pair on the case-folded, whitespace-collapsed
    // key, so a pairing that survives can still differ in casing — small-caps
    // "Gigabyte Alchemy" rendered as literal "GIGABYTE ALCHEMY" is a content
    // delta both screenshots and computed styles miss (the join hid it, not a
    // font). Compare the collapsed forms case-sensitively; whitespace-only
    // formatting noise stays ignored because both sides are collapsed first.
    if (collapse(exp.text) !== collapse(act.text)) {
      push(exp, 'text', exp.text, act.text)
    }

    // A colour the capture had to infer (fallback #000/#fff) is low-confidence
    // reference data, not a real target — never a hard delta (REQ-35).
    if (!exp.colorInferred && colorDistance(exp.color, act.color) > colorTol) {
      push(exp, 'color', exp.color, act.color)
    }
    if (Math.abs(exp.fontSizePx - act.fontSizePx) > fontSizeTol) {
      push(exp, 'fontSizePx', `${exp.fontSizePx}`, `${act.fontSizePx}`)
    }
    if (Math.abs(exp.fontWeight - act.fontWeight) > weightTol) {
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
        (!!e && !!a && Math.abs(e.widthPx - a.widthPx) <= borderWidthTol && e.color.toLowerCase() === a.color.toLowerCase())
      if (!ok) push(exp, 'borderLeft', borderLabel(e), borderLabel(a))
    }
    if (exp.lineHeightPx !== undefined && act.lineHeightPx !== undefined) {
      const lineHeightTol = Math.max(lineHeightFloor, lineHeightRatio * exp.lineHeightPx)
      if (Math.abs(exp.lineHeightPx - act.lineHeightPx) > lineHeightTol) {
        push(exp, 'lineHeightPx', `${exp.lineHeightPx}`, `${act.lineHeightPx}`)
      }
    }
    if (exp.letterSpacingPx !== undefined && act.letterSpacingPx !== undefined) {
      if (Math.abs(exp.letterSpacingPx - act.letterSpacingPx) > letterSpacingTol) {
        push(exp, 'letterSpacingPx', `${exp.letterSpacingPx}`, `${act.letterSpacingPx}`)
      }
    }
    if (exp.paddingLeftPx !== undefined && act.paddingLeftPx !== undefined) {
      if (Math.abs(exp.paddingLeftPx - act.paddingLeftPx) > paddingTol) {
        push(exp, 'paddingLeftPx', `${exp.paddingLeftPx}`, `${act.paddingLeftPx}`)
      }
    }
  }

  // Section-level values (scrim, vertical anchor) — no text to join on, so
  // aligned by ordinal index. Extra sections on either side (a segmentation
  // mismatch, not a value delta) have no counterpart and are skipped.
  const actBySection = new Map<number, SectionValues>()
  for (const s of actual.sections ?? []) actBySection.set(s.index, s)
  for (const es of expected.sections ?? []) {
    const as = actBySection.get(es.index)
    if (!as) continue
    const label = `§${es.index}`

    const eo = es.overlay
    const ao = as.overlay
    const overlayOk =
      (!eo && !ao) ||
      (!!eo &&
        !!ao &&
        eo.color.toLowerCase() === ao.color.toLowerCase() &&
        Math.abs(eo.opacity - ao.opacity) <= opacityTol)
    if (!overlayOk) record(label, 'section', 'overlay', overlayLabel(eo), overlayLabel(ao))

    if (es.contentAnchorRatio !== null && as.contentAnchorRatio !== null) {
      if (Math.abs(es.contentAnchorRatio - as.contentAnchorRatio) > anchorTol) {
        record(label, 'section', 'contentAnchor', anchorLabel(es.contentAnchorRatio), anchorLabel(as.contentAnchorRatio))
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
