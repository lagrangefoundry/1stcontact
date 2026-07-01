/**
 * Style-scope segmentation (DOC-13 §2.7, §4). A section is a *styling context*,
 * not a module or content group. We coalesce consecutive band candidates that
 * share a style signature (background + color scheme + type treatment) into one
 * section; a uniformly-styled page therefore collapses to a single section, and
 * a page with N distinct style bands yields N sections.
 *
 * Segmentation errors are grouping errors only: every text run keeps its own
 * exact styling regardless of where a boundary falls (DOC-13 §5).
 */
import type { RawBand, RawRun, RawSignals } from './extract'
import type {
  Background,
  Box,
  ContentRun,
  Layout,
  Section,
  SectionItem,
} from './types'

/** First `rgba(...)` in a computed gradient → overlay color + opacity. */
function firstOverlay(css: string): { color: string; opacity: number } | null {
  const m = css.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const p = m[1].split(',').map((s) => parseFloat(s.trim()))
  const hex = (n: number) => ('0' + Math.round(n).toString(16)).slice(-2)
  return { color: `#${hex(p[0])}${hex(p[1])}${hex(p[2])}`, opacity: p.length >= 4 ? p[3] : 1 }
}

/** First `url(...)` in a computed background → absolute URL. */
function firstUrl(css: string): string | null {
  const m = css.match(/url\((['"]?)([^'")]+)\1\)/)
  return m ? m[2] : null
}

function backgroundOf(band: RawBand, urlToLocal: (url: string) => string | undefined): Background {
  const img = band.backgroundImage
  const hasUrl = /url\(/.test(img)
  const hasGradient = /gradient\(/.test(img)
  const color = band.backgroundColor ?? undefined

  if (hasUrl) {
    const url = firstUrl(img)
    const bg: Background = { kind: 'image', color }
    if (url) bg.image = urlToLocal(url) ?? url
    if (hasGradient) {
      const overlay = firstOverlay(img)
      if (overlay) bg.overlay = overlay
    }
    return bg
  }
  if (hasGradient) return { kind: 'gradient', color, gradient: img }
  return { kind: 'color', color }
}

const toContentRuns = (runs: RawRun[]): ContentRun[] =>
  runs.map((r) => ({
    role: r.role,
    text: r.text,
    color: r.color,
    fontFamily: r.fontFamily,
    fontSizePx: r.fontSizePx,
    fontWeight: r.fontWeight,
  }))

/** A band's style signature — the key segmentation coalesces on. */
function signatureOf(band: RawBand): string {
  const bgKey = /url\(|gradient\(/.test(band.backgroundImage)
    ? band.backgroundImage
    : (band.backgroundColor ?? 'none')
  return [bgKey, band.colorScheme, band.fontFamily].join('|')
}

/** Union of two boxes. */
function unionBox(a: Box, b: Box): Box {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

function sectionFromBands(bands: RawBand[], signals: RawSignals, urlToLocal: (url: string) => string | undefined): Section {
  const head = bands[0]
  const box = bands.reduce<Box>((acc, b) => unionBox(acc, b.box), head.box)
  const background = backgroundOf(head, urlToLocal)
  const content: ContentRun[] = bands.flatMap((b) => toContentRuns(b.content))
  const items: SectionItem[] = bands.flatMap((b) =>
    b.items.map((runs) => ({ content: toContentRuns(runs) })),
  )
  const layout: Layout = {
    textOverImage: background.kind === 'image' && content.length > 0,
    contentAlign: head.textAlign,
    arrangement: items.length > 1 ? 'row' : 'stack',
    columns: items.length > 0 ? items.length : 1,
    contentMaxWidthPx: signals.containerMaxWidthPx,
  }
  return { box, screenshot: box, background, layout, content, items }
}

export function buildSections(
  signals: RawSignals,
  urlToLocal: (url: string) => string | undefined,
): Section[] {
  const sections: Section[] = []
  let run: RawBand[] = []
  let sig: string | null = null

  for (const band of signals.bands) {
    const s = signatureOf(band)
    if (sig === null || s === sig) {
      run.push(band)
      sig = s
    } else {
      sections.push(sectionFromBands(run, signals, urlToLocal))
      run = [band]
      sig = s
    }
  }
  if (run.length > 0) sections.push(sectionFromBands(run, signals, urlToLocal))
  return sections
}
