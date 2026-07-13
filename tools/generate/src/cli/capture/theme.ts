/**
 * Build the exact-token `theme` block (DOC-13 §4) from browser-computed
 * signals. Colors and font sizes are already resolved (var() gone) because they
 * were read from computed styles in the page; here we only aggregate and shape.
 */
import type { RawRun, RawSignals } from './extract'
import type { ColorUsage, Theme, ThemeFont, ThemeSubScale, ThemeSubScales } from './types'

/** All text runs across every band and item, in document order. */
function allRuns(signals: RawSignals): RawRun[] {
  const runs: RawRun[] = []
  for (const band of signals.bands) {
    runs.push(...band.content)
    for (const item of band.items) runs.push(...item)
  }
  return runs
}

/** The most frequent value in `vals` (ties → smallest, for determinism). */
function modal(vals: number[]): number {
  const freq = new Map<number, number>()
  for (const v of vals) freq.set(v, (freq.get(v) ?? 0) + 1)
  let best = vals[0]
  let bestN = 0
  for (const [v, n] of freq) {
    if (n > bestN || (n === bestN && v < best)) {
      best = v
      bestN = n
    }
  }
  return best
}

/**
 * A rounded-pill run: the corner radius reaches (near) half the painted height,
 * so the ends are fully round — the shape that reads as a status badge, not
 * prose. Guards on a positive height so a zero-box run never qualifies.
 */
function isPill(r: RawRun): boolean {
  return r.box.height > 0 && r.borderRadiusPx * 2 >= r.box.height - 1
}

/** Word count of a run's collapsed text — badges are 1–3 words, not sentences. */
function wordCount(text: string): number {
  const t = text.trim()
  return t === '' ? 0 : t.split(/\s+/).length
}

/**
 * A cohort of like sub-elements → one subscale in the render's px vocabulary,
 * each axis the modal value so a stray outlier doesn't skew the ramp. Returns
 * undefined below two members — a subscale is a *systemic* ramp, not a one-off.
 */
function aggregateSubScale(cohort: RawRun[]): ThemeSubScale | undefined {
  if (cohort.length < 2) return undefined
  const lh = cohort.map((r) => r.lineHeightPx).filter((v): v is number => v != null)
  return {
    fontSizePx: modal(cohort.map((r) => r.fontSizePx)),
    fontWeight: modal(cohort.map((r) => r.fontWeight)),
    lineHeightPx: lh.length > 0 ? modal(lh) : null,
    letterSpacingPx: modal(cohort.map((r) => r.letterSpacingPx)),
    count: cohort.length,
  }
}

/**
 * Component-owned subscales (REQ-56) read from the page's own semantics — no
 * framework class names, so this works against any reference site:
 *  - `checklist` ← a11y `listitem` runs (the browser's own list semantics).
 *  - `badge`     ← small, short-text, strongly-rounded `body` runs (pills).
 * Interactive pills (buttons / links) are excluded — those are CTAs, not badges.
 */
function buildSubScales(runs: RawRun[]): ThemeSubScales {
  const checklist = runs.filter((r) => r.role === 'listitem')
  const badges = runs.filter((r) => r.role === 'body' && isPill(r) && wordCount(r.text) <= 3)
  const subScales: ThemeSubScales = {}
  const badge = aggregateSubScale(badges)
  const list = aggregateSubScale(checklist)
  if (badge) subScales.badge = badge
  if (list) subScales.checklist = list
  return subScales
}

export function buildTheme(
  signals: RawSignals,
  fontFilesByFamily: Map<string, string[]>,
): Theme {
  const colors = signals.colorUsage.map((c) => ({
    hex: c.hex,
    usage: c.usage as ColorUsage,
    freq: c.freq,
  }))

  // Family → {role, weights} from how each family is actually painted.
  const runs = allRuns(signals)
  const byFamily = new Map<string, { heading: boolean; weights: Set<number> }>()
  for (const r of runs) {
    if (!r.fontFamily) continue
    const e = byFamily.get(r.fontFamily) ?? { heading: false, weights: new Set<number>() }
    if (r.role === 'heading' || r.role === 'subheading') e.heading = true
    e.weights.add(r.fontWeight)
    byFamily.set(r.fontFamily, e)
  }

  const fonts: ThemeFont[] = [...byFamily.entries()].map(([family, e]) => ({
    family,
    role: e.heading ? 'heading' : 'body',
    weights: [...e.weights].sort((a, b) => a - b),
    files: fontFilesByFamily.get(family) ?? [],
  }))

  return {
    colors,
    fonts,
    typeScale: signals.typeScale,
    spacingScalePx: signals.spacingScalePx,
    containerMaxWidthPx: signals.containerMaxWidthPx,
    subScales: buildSubScales(runs),
  }
}
