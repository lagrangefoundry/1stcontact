/**
 * REQ-48 (item 11) — anti-self-grading calibration.
 *
 * A severity score authored and read by the same agent that built the repro is
 * self-certification: "we already watched the faelan agent grade its own diff
 * against a number it could influence." Before a *clean* verdict from
 * {@link diffManifests} can be trusted, the discriminator must be shown to
 * actually discriminate — otherwise "0 deltas" might mean "faithful" or might
 * mean "blind on this axis", and the two are indistinguishable from the score.
 *
 * This module is the independent oracle. It holds a faithful baseline and a fixed
 * table of known defects — one per fidelity axis the gate claims to cover — each
 * paired with the delta *kind* the gate MUST emit when that defect is present.
 * {@link calibrateDiscriminator} seeds each defect into a faithful render and
 * confirms the gate fires; {@link discriminatorIsCalibrated} is the guard a
 * consumer runs *before* trusting a clean verdict. A defect that does not fire is
 * a hole in the gate, reported by name — not silently absorbed into a passing score.
 */
import { diffManifests } from './values-diff'
import type { DeltaKind, DiffOptions, ValueElement, ValueManifest } from './values-diff'

/** A known defect and the delta kind the gate must emit when it is present. */
export interface SeededDefect {
  /** Human name of the axis this defect exercises. */
  name: string
  /** The delta kind the gate MUST emit for this defect (the oracle's expectation). */
  expects: DeltaKind
  /** Inject the defect into a faithful *actual* manifest (mutates the given clone). */
  inject: (actual: ValueManifest) => void
}

/** Per-defect calibration outcome. */
export interface CalibrationResult {
  name: string
  expects: DeltaKind
  /** True when the gate emitted at least one delta of {@link expects}. */
  fired: boolean
}

const clone = (m: ValueManifest): ValueManifest => JSON.parse(JSON.stringify(m)) as ValueManifest

/**
 * A faithful baseline manifest with every projected axis populated to a known
 * value, so a single mutation on the actual side creates exactly one defect.
 * Deliberately small: the calibration proves *discrimination*, not coverage of
 * every element shape.
 */
export function makeCalibrationBaseline(): ValueManifest {
  const textEl = (text: string, over: Partial<ValueElement> = {}): ValueElement => ({
    text,
    role: 'body',
    color: '#111111',
    fontFamily: 'Inter',
    fontSizePx: 18,
    fontWeight: 400,
    box: { x: 0, y: 0, width: 300, height: 40 },
    zIndex: 0,
    transformRotateDeg: 0,
    transformScale: 1,
    motion: null,
    fontLoaded: true,
    filter: null,
    textShadow: null,
    maskEdge: null,
    ...over,
  })
  const imgEl: ValueElement = {
    text: 'portrait',
    role: 'img',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    accessibleName: 'portrait',
    objectFit: 'cover',
    box: { x: 0, y: 0, width: 200, height: 200 },
    zIndex: 1,
  }
  return {
    source: 'calibration:baseline',
    elements: [textEl('Heading', { role: 'heading', fontSizePx: 40 }), textEl('body copy'), imgEl],
    sections: [],
    viewport: { width: 1280, height: 800 },
  }
}

const firstText = (m: ValueManifest): ValueElement => m.elements.find((e) => !e.textless)!
const theImg = (m: ValueManifest): ValueElement => m.elements.find((e) => e.a11yRole === 'img')!

/**
 * The seeded-defect table — one per axis the gate claims. If any defect here
 * fails to fire, a "clean" verdict is meaningless on that axis.
 */
export const SEEDED_DEFECTS: SeededDefect[] = [
  { name: 'missing element', expects: 'presence', inject: (m) => void m.elements.shift() },
  // A case change keeps the (case-folded) join key so the run still pairs, then
  // the case-sensitive verbatim compare fires a `text` delta — a wholesale change
  // would break pairing and surface as `presence` instead (the join hid it).
  { name: 'wrong text casing', expects: 'text', inject: (m) => void (firstText(m).text = firstText(m).text.toUpperCase()) },
  { name: 'displaced position', expects: 'position', inject: (m) => void (firstText(m).box!.y += 300) },
  { name: 'colour drift', expects: 'color', inject: (m) => void (firstText(m).color = '#557799') },
  { name: 'wrong z-order', expects: 'zOrder', inject: (m) => void (theImg(m).zIndex = 99) },
  { name: 'ellipse not circle', expects: 'media', inject: (m) => void (theImg(m).box!.height = 100) },
  { name: 'missing photo child', expects: 'presence', inject: (m) => void m.elements.splice(m.elements.indexOf(theImg(m)), 1) },
  { name: 'lost text glow', expects: 'treatment', inject: (m) => void (firstText(m).textShadow = null) },
  { name: 'mis-rotation', expects: 'transform', inject: (m) => void (firstText(m).transformRotateDeg = 20) },
  { name: 'lost entrance motion', expects: 'motion', inject: (m) => void (firstText(m).motion = 'animation') },
  { name: 'font fell back', expects: 'fontLoad', inject: (m) => void (firstText(m).fontLoaded = false) },
  { name: 'horizontal overflow', expects: 'overflow', inject: (m) => m.elements.push({ ...firstText(m), text: 'WIDE', box: { x: 0, y: 500, width: 3000, height: 40 } }) },
  { name: 'viewport mismatch', expects: 'viewport', inject: (m) => void (m.viewport = { width: 375, height: 800 }) },
]

// The baseline carries the treatment/motion *presence* the "lost X" defects
// remove; without it, injecting `null` would be a no-op. Seed those on baseline.
function seededBaseline(): ValueManifest {
  const base = makeCalibrationBaseline()
  firstText(base).textShadow = '0 0 8px #0ff'
  return base
}

/**
 * Seed every {@link SEEDED_DEFECTS} entry into a faithful copy of `baseline` and
 * report, per defect, whether the gate emitted the expected delta kind. Pass a
 * baseline to calibrate against your own projection; omit it for the canonical
 * fixture. The expected side is always the untouched baseline.
 */
export function calibrateDiscriminator(
  baseline: ValueManifest = seededBaseline(),
  opts?: DiffOptions,
): CalibrationResult[] {
  return SEEDED_DEFECTS.map((defect) => {
    const actual = clone(baseline)
    defect.inject(actual)
    const report = diffManifests(baseline, actual, opts)
    return { name: defect.name, expects: defect.expects, fired: report.deltas.some((d) => d.kind === defect.expects) }
  })
}

/**
 * The guard a consumer runs before trusting a clean verdict: true only when
 * *every* seeded defect fired. Returns the calibration results too, so a caller
 * can name the blind axis rather than just fail.
 */
export function discriminatorIsCalibrated(
  baseline?: ValueManifest,
  opts?: DiffOptions,
): { calibrated: boolean; results: CalibrationResult[] } {
  const results = calibrateDiscriminator(baseline, opts)
  return { calibrated: results.every((r) => r.fired), results }
}
