/**
 * Build the exact-token `theme` block (DOC-13 §4) from browser-computed
 * signals. Colors and font sizes are already resolved (var() gone) because they
 * were read from computed styles in the page; here we only aggregate and shape.
 */
import type { RawRun, RawSignals } from './extract'
import type { ColorUsage, Theme, ThemeFont } from './types'

/** All text runs across every band and item, in document order. */
function allRuns(signals: RawSignals): RawRun[] {
  const runs: RawRun[] = []
  for (const band of signals.bands) {
    runs.push(...band.content)
    for (const item of band.items) runs.push(...item)
  }
  return runs
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
  }
}
