/**
 * BUG-153 (item 2) — what a mask DOES to the box it is painted on, as a pair of
 * engine-independent scalars.
 *
 * ## Why this exists
 *
 * `maskEdge` was compared by *presence* (REQ-48 item 3), and the reasoning was
 * sound as far as it went: the exact strings drift across engines — a blur
 * radius rounds, a vendor prefix appears, an equivalent size keyword is spelled
 * differently — so comparing them verbatim would report noise on every run. The
 * consequence, which the rationale did not reach, is that a mask that is
 * *present but wrong* is indistinguishable from a correct one.
 *
 * Measured on faelan.com. The reference and the reproduction mask the same
 * 330.33 × 222.17 photograph with
 *
 *     ref:  radial-gradient(92% 92%, rgb(0,0,0) 72%, rgba(0,0,0,0) 100%)
 *     ours: radial-gradient(closest-side, rgb(0,0,0) calc(100% - 62px), rgba(0,0,0,0) 100%)
 *
 * and what they paint is not close: the reference attenuates only the extreme
 * corners (and on one of the three photographs, nothing at all), while ours is
 * fully opaque over 30.6% of the box and erases 21.5% of it outright. The axis
 * reported **0** deltas. Worse, it reported them as an IMPROVEMENT: one iteration
 * earlier the fold emitted no mask and the axis scored 3 MEDIUM `mask` deltas
 * (`present → none`); the fold then started emitting a mask with the wrong
 * geometry and the count went to zero, while the page got no closer.
 *
 * ## What is compared instead
 *
 * Not the string, and not its presence: a **derived scalar resolved against each
 * side's own box**. `radial-gradient(...)` against `-webkit-radial-gradient(...)`
 * is not a delta, because both resolve to the same coverage; `30.6%` opaque
 * against `100%` opaque is one, because the eye can see it.
 *
 * The resolution is numeric rather than closed-form — the box is sampled on a
 * grid and each sample's alpha is evaluated — because the closed form is
 * different for every ending-shape keyword, and a grid is the same code for all
 * of them, has no special cases to get wrong at the box/ellipse boundary, and
 * generalises to a shape whose analytic area nobody wants to derive.
 *
 * ## What it declines to answer
 *
 * `undefined`, never a guess: a `clip-path` polygon, a `linear-gradient` mask, an
 * off-centre gradient, a spelling this parser does not hold. The caller treats
 * that as unmeasured — an axis nobody could read is not a clean one — rather than
 * substituting a default that would compare as agreement.
 */

/** How much of an element's box a mask leaves, as fractions of the box's area. */
export interface MaskCoverage {
  /** Fraction of the box painted at (effectively) full opacity. */
  opaque: number
  /** Fraction of the box the mask erases outright. */
  erased: number
}

/** The box a mask is resolved against. Only its size matters; a mask is box-relative. */
export interface MaskBox {
  width: number
  height: number
}

/** One resolved colour stop on the gradient ray: a position in ending-shape units, and an alpha. */
interface Stop {
  /** Position along the ray, where 1 is the ending shape. */
  at: number
  alpha: number
}

/** Samples per axis. 64² = 4096 points — under a millisecond, and finer than any tolerance below. */
const GRID = 64

/** An alpha this close to the ends counts as "fully opaque" / "erased outright". */
const EPS = 1e-3

/** Split on commas that are not inside parentheses (`calc(100% - 62px)` holds none, `rgba(0,0,0,0)` holds three). */
function topLevelParts(s: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && depth === 0) {
      out.push(s.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(s.slice(start).trim())
  return out.filter((p) => p.length > 0)
}

/**
 * The alpha a colour token paints, or `undefined` when this parser cannot say.
 *
 * Only the spellings a computed `mask-image` actually arrives in are held:
 * a browser serialises every colour to `rgb()` / `rgba()`, and `transparent` is
 * kept because an authored mask is sometimes echoed back verbatim.
 */
function alphaOfColor(token: string): number | undefined {
  const t = token.trim().toLowerCase()
  if (t === 'transparent') return 0
  const rgba = /^rgba?\(([^)]*)\)$/.exec(t)
  if (rgba) {
    const parts = rgba[1].split(/[,/]/).map((p) => p.trim()).filter((p) => p.length > 0)
    if (parts.length < 3) return undefined
    if (parts.length === 3) return 1
    const a = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
    return Number.isFinite(a) ? Math.min(1, Math.max(0, a)) : undefined
  }
  const hex = /^#([0-9a-f]{3,8})$/.exec(t)
  if (hex) {
    const h = hex[1]
    if (h.length === 3 || h.length === 6) return 1
    if (h.length === 4) return parseInt(h[3] + h[3], 16) / 255
    if (h.length === 8) return parseInt(h.slice(6, 8), 16) / 255
    return undefined
  }
  // A named colour other than `transparent` is opaque; anything else is unknown.
  return /^[a-z]+$/.test(t) ? 1 : undefined
}

/**
 * A stop position in units of the ending shape, given the gradient ray's length.
 *
 * `72%` → 0.72. `calc(100% - 62px)` on a 165.16px ray → 0.625. A bare length is
 * measured against the same ray, which for an ellipse is its HORIZONTAL radius —
 * the axis CSS resolves a `<length>` stop against.
 */
function stopPosition(token: string, rayPx: number): number | undefined {
  const t = token.trim().toLowerCase()
  if (t.endsWith('%')) {
    const v = parseFloat(t)
    return Number.isFinite(v) ? v / 100 : undefined
  }
  if (t.endsWith('px')) {
    const v = parseFloat(t)
    return Number.isFinite(v) && rayPx > 0 ? v / rayPx : undefined
  }
  const calc = /^calc\(\s*([0-9.]+)%\s*([+-])\s*([0-9.]+)px\s*\)$/.exec(t)
  if (calc && rayPx > 0) {
    const pct = parseFloat(calc[1]) / 100
    const px = parseFloat(calc[3]) / rayPx
    return calc[2] === '-' ? pct - px : pct + px
  }
  return undefined
}

/** True when a top-level part opens with something that can only be a colour. */
function looksLikeColorStop(part: string): boolean {
  return /^(#|rgba?\(|hsla?\(|transparent\b|[a-z]+\s+[-0-9.]|[a-z]+$)/i.test(part.trim())
}

/**
 * The ending shape's two radii in px, from the size/shape prefix, for a gradient
 * CENTRED on the box.
 *
 * `undefined` for anything off-centre (`at top left`) or for a spelling not held:
 * the whole point is that a guess would compare as agreement.
 */
function endingRadii(prefix: string | undefined, box: MaskBox): { rx: number; ry: number } | undefined {
  const hw = box.width / 2
  const hh = box.height / 2
  if (hw <= 0 || hh <= 0) return undefined
  const p = (prefix ?? '').trim().toLowerCase()
  // An explicit centre is fine; any other position is a shape this does not model.
  const centred = /\bat\s+(center|50%(\s+50%)?|center\s+center)\s*$/.test(p)
  if (/\bat\b/.test(p) && !centred) return undefined
  const size = p.replace(/\bat\b.*$/, '').replace(/\b(circle|ellipse)\b/g, '').trim()
  // Centred, so closest-side and farthest-side coincide, as do the two corners.
  if (size === '' || /farthest-corner|closest-corner/.test(size)) {
    return { rx: hw * Math.SQRT2, ry: hh * Math.SQRT2 }
  }
  if (/farthest-side|closest-side/.test(size)) return { rx: hw, ry: hh }
  const tokens = size.split(/\s+/).filter((t) => t.length > 0)
  const resolve = (tok: string, extent: number): number | undefined => {
    if (tok.endsWith('%')) {
      const v = parseFloat(tok)
      return Number.isFinite(v) ? (v / 100) * extent : undefined
    }
    if (tok.endsWith('px')) {
      const v = parseFloat(tok)
      return Number.isFinite(v) ? v : undefined
    }
    return undefined
  }
  if (tokens.length === 1) {
    // A circle's single radius. A percentage circle radius is invalid CSS, and
    // `resolve` would need an extent to answer it, so only a length is held.
    const r = resolve(tokens[0], box.width)
    return r !== undefined && r > 0 ? { rx: r, ry: r } : undefined
  }
  if (tokens.length === 2) {
    const rx = resolve(tokens[0], box.width)
    const ry = resolve(tokens[1], box.height)
    return rx !== undefined && ry !== undefined && rx > 0 && ry > 0 ? { rx, ry } : undefined
  }
  return undefined
}

/** Fill in the positions CSS leaves implicit: first 0, last 1, and the gaps evenly spread. */
function normalizeStops(raw: Array<{ at?: number; alpha: number }>): Stop[] | undefined {
  if (raw.length < 2) return undefined
  const out = raw.map((s) => ({ ...s }))
  if (out[0].at === undefined) out[0].at = 0
  if (out[out.length - 1].at === undefined) out[out.length - 1].at = 1
  for (let i = 0; i < out.length; i++) {
    if (out[i].at !== undefined) continue
    let j = i
    while (j < out.length && out[j].at === undefined) j++
    if (j >= out.length) return undefined
    const before = out[i - 1].at as number
    const after = out[j].at as number
    const span = j - (i - 1)
    for (let k = i; k < j; k++) out[k].at = before + ((after - before) * (k - (i - 1))) / span
    i = j - 1
  }
  // CSS clamps a stop to never precede the one before it.
  let run = -Infinity
  for (const s of out) {
    run = Math.max(run, s.at as number)
    s.at = run
  }
  return out as Stop[]
}

/** The alpha at a point on the ray, piecewise-linear between stops and clamped at the ends. */
function alphaAt(stops: readonly Stop[], t: number): number {
  if (t <= stops[0].at) return stops[0].alpha
  const last = stops[stops.length - 1]
  if (t >= last.at) return last.alpha
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1]
    const b = stops[i]
    if (t <= b.at) {
      const span = b.at - a.at
      if (span <= 0) return b.alpha
      return a.alpha + ((t - a.at) / span) * (b.alpha - a.alpha)
    }
  }
  return last.alpha
}

/**
 * Resolve a `mask-image` / `clip-path` value against the box it is painted on.
 *
 * Returns `undefined` — never a default — for anything this parser cannot resolve
 * exactly. See the module header for why that matters.
 */
export function maskCoverage(maskEdge: string | null | undefined, box: MaskBox | undefined): MaskCoverage | undefined {
  if (!maskEdge || !box || !(box.width > 0) || !(box.height > 0)) return undefined
  const m = /^(?:-[a-z]+-)?radial-gradient\((.*)\)$/is.exec(maskEdge.trim())
  if (!m) return undefined
  const parts = topLevelParts(m[1])
  if (parts.length < 2) return undefined
  const prefix = looksLikeColorStop(parts[0]) ? undefined : parts[0]
  const stopParts = prefix === undefined ? parts : parts.slice(1)
  const radii = endingRadii(prefix, box)
  if (!radii) return undefined

  const raw: Array<{ at?: number; alpha: number }> = []
  for (const part of stopParts) {
    // `rgba(0, 0, 0, 0) 100%` — the colour is everything up to the last
    // whitespace that is not inside parentheses.
    const split = /^(.*?)(?:\s+([^\s()]+|calc\([^)]*\)))?$/s.exec(part.replace(/\s+/g, ' ').trim())
    if (!split) return undefined
    const alpha = alphaOfColor(split[1])
    if (alpha === undefined) return undefined
    if (split[2] === undefined) {
      raw.push({ alpha })
      continue
    }
    const at = stopPosition(split[2], radii.rx)
    if (at === undefined) return undefined
    raw.push({ at, alpha })
  }
  const stops = normalizeStops(raw)
  if (!stops) return undefined

  let opaque = 0
  let erased = 0
  for (let iy = 0; iy < GRID; iy++) {
    // Sample cell CENTRES, so the count is an area estimate rather than a
    // lattice that lands exactly on the box's edges and double-counts them.
    const dy = ((iy + 0.5) / GRID - 0.5) * box.height
    for (let ix = 0; ix < GRID; ix++) {
      const dx = ((ix + 0.5) / GRID - 0.5) * box.width
      const t = Math.hypot(dx / radii.rx, dy / radii.ry)
      const a = alphaAt(stops, t)
      if (a >= 1 - EPS) opaque++
      else if (a <= EPS) erased++
    }
  }
  const total = GRID * GRID
  return { opaque: opaque / total, erased: erased / total }
}

/** `mask 30.6% opaque / 21.5% erased` — the label a delta carries for one side. */
export function maskCoverageLabel(c: MaskCoverage): string {
  return `${(c.opaque * 100).toFixed(1)}% opaque / ${(c.erased * 100).toFixed(1)}% erased`
}

/**
 * REQ-371 — does a captured `maskEdge` paint an edge at all?
 *
 * The capture folds `mask-image` and `clip-path` into one field, and a builder
 * routinely sets `clip-path: inset(0px)` on every band (Zyro does) purely to clip
 * its own overflowing slide-in content to the band. That clips the element to its
 * own border box — exactly where it already ends — so it is no edge, and reading
 * it as one reported a "dropped mask" on every band of the page that no
 * reproduction could ever honour or need to. A rounded inset (`inset(0 round 8px)`)
 * does paint a shape, and stays a mask.
 */
export function paintsMaskEdge(maskEdge: string | null | undefined): boolean {
  if (!maskEdge) return false
  return !/^inset\(\s*0(?:px|%)?(?:\s+0(?:px|%)?){0,3}\s*\)$/i.test(maskEdge.trim())
}
