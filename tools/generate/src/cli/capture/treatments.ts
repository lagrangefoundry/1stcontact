/**
 * REQ-331 — the ONE statement of what a captured CSS treatment actually paints.
 *
 * WHY THIS IS A MODULE AND NOT A BRANCH IN EITHER CALLER. Two sides ask the same
 * questions of the same strings and used to answer them differently:
 *
 * - The **fold** parsed a `box-shadow` into layers (and kept only the first),
 *   and knew — in a table beside `foldFilter` — which `filter` values are the
 *   identity and therefore paint nothing.
 * - The **values-diff** knew neither. It compared a shadow by asking whether one
 *   EXISTS, so a wrong colour, alpha, offset, blur or layer count read as clean;
 *   and it compared a filter by asking whether the string is non-empty, so
 *   `blur(0px)` — which paints nothing, and which the fold is right to drop —
 *   was reported as a defect against a reproduction that had done the correct
 *   thing.
 *
 * Measured on faelan.com: three shadowed photographs whose captured shadow was
 * `rgba(0,0,0,0.6) 0 15px 50px, rgba(255,255,255,0.15) 0 0 30px` against a
 * reproduction painting `rgb(0,0,0) 0 15px 50px` — a wrong alpha AND a missing
 * layer, on three elements, reported as **zero** deltas; and one MEDIUM `filter`
 * delta that was false.
 *
 * So the parse and the identity table live here, once, and both sides read them.
 */
import { colorToHex, colorToHexAlpha } from './color-values'
import { L1_ENVELOPE } from '@1stcontact/site-schema'

/** One layer of a computed `box-shadow` / `text-shadow`, structurally. */
export interface ShadowLayer {
  offsetXPx: number
  offsetYPx: number
  blurPx: number
  spreadPx: number
  inset: boolean
  /** `#rrggbb`, or `#rrggbbaa` when the layer is translucent. */
  color: string
}

/** Split a comma list into layers WITHOUT splitting inside `rgb(…)`. */
const LAYERS = /,(?![^(]*\))/

/**
 * A computed shadow string → its layers, in CSS order (which is paint order —
 * the first layer paints on top).
 *
 * Chrome emits `[inset] <color> <x>px <y>px [<blur>px] [<spread>px]` with the
 * colour first; other engines put it last. Both are read by pulling the colour
 * token out and taking the remaining lengths positionally, so neither order is
 * privileged. A layer with fewer than two lengths is not a shadow and is
 * dropped; `none` and the empty string yield no layers at all.
 *
 * Omitted lengths come back as their CSS defaults (`0`) rather than as
 * `undefined`, because this shape is compared numerically: `0 15px 50px` and
 * `0 15px 50px 0` are the same shadow and must not read as a difference.
 */
export function parseShadowLayers(css: string | null | undefined): ShadowLayer[] {
  if (!css || /^none$/i.test(css.trim())) return []
  const out: ShadowLayer[] = []
  for (const raw of css.split(LAYERS)) {
    const layer = raw.trim()
    if (!layer) continue
    const colorTok = layer.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/)
    const color = colorTok ? colorToHexAlpha(colorTok[0]) : null
    if (!color) continue
    const rest = (colorTok ? layer.replace(colorTok[0], ' ') : layer).replace(/\binset\b/i, ' ')
    const nums = (rest.match(/-?\d*\.?\d+px/g) ?? []).map((n) => parseFloat(n))
    if (nums.length < 2 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1])) continue
    out.push({
      offsetXPx: nums[0],
      offsetYPx: nums[1],
      blurPx: Number.isFinite(nums[2]) && nums[2] >= 0 ? nums[2] : 0,
      spreadPx: Number.isFinite(nums[3]) ? nums[3] : 0,
      inset: /\binset\b/i.test(layer),
      color,
    })
  }
  return out
}

/** A layer that paints nothing: fully transparent, or zero in every dimension. */
function layerPaints(l: ShadowLayer): boolean {
  if (/^#[0-9a-fA-F]{6}00$/.test(l.color)) return false
  return l.offsetXPx !== 0 || l.offsetYPx !== 0 || l.blurPx !== 0 || l.spreadPx !== 0
}

/**
 * Does this shadow string move a pixel?
 *
 * `none`, the empty string, and a stack whose every layer is transparent or
 * zero-sized are all ABSENT. Normalising presence to painted effect is what
 * stops the comparator charging a reproduction with a delta for correctly
 * declining to emit a declaration that changes nothing.
 */
export function shadowPaints(css: string | null | undefined): boolean {
  return paintedShadowLayers(css).length > 0
}

/**
 * The layers of a shadow that actually paint — the comparable form.
 *
 * A transparent or zero-sized layer is a declaration that moves no pixel, so two
 * sides that differ only by one of those do not differ. This is the same
 * normalise-to-painted-effect rule {@link filterPaints} applies, stated for the
 * axis that needs it as a LIST rather than as a boolean.
 */
export function paintedShadowLayers(css: string | null | undefined): ShadowLayer[] {
  return parseShadowLayers(css).filter(layerPaints)
}

/** One layer → a short, comparable prose form (`15px down, 50px blur, #00000099`). */
export function shadowLayerLabel(l: ShadowLayer): string {
  const bits = [`${l.offsetXPx},${l.offsetYPx}px`]
  if (l.blurPx) bits.push(`blur ${l.blurPx}px`)
  if (l.spreadPx) bits.push(`spread ${l.spreadPx}px`)
  if (l.inset) bits.push('inset')
  bits.push(l.color)
  return bits.join(' ')
}

/** A whole shadow → prose, layer by layer. `none` when nothing paints. */
export function shadowLabel(css: string | null | undefined): string {
  const layers = paintedShadowLayers(css)
  return layers.length === 0 ? 'none' : layers.map(shadowLayerLabel).join(' + ')
}

/**
 * The CSS filter functions L1 carries, with the value at which each is the
 * IDENTITY.
 *
 * Moved here from the fold (REQ-136's `foldFilter`) so the comparator can read
 * the same table. Stated per function rather than as one rule because the
 * identity is not the same number for all of them: `grayscale(0)` and
 * `saturate(1)` are both no-ops while `grayscale(1)` and `saturate(0)` are both
 * extremes, so a single "skip the identity" rule would be wrong for half of them
 * — and would fail silently, folding a fully desaturated photograph to no filter
 * at all.
 */
export const FILTER_FUNCTIONS = [
  { css: 'grayscale', axis: 'grayscale', unit: 'ratio', identity: 0, min: 0, max: 1 },
  { css: 'sepia', axis: 'sepia', unit: 'ratio', identity: 0, min: 0, max: 1 },
  { css: 'invert', axis: 'invert', unit: 'ratio', identity: 0, min: 0, max: 1 },
  { css: 'saturate', axis: 'saturate', unit: 'ratio', identity: 1, min: 0, max: L1_ENVELOPE.filterAmount.max },
  { css: 'brightness', axis: 'brightness', unit: 'ratio', identity: 1, min: 0, max: L1_ENVELOPE.filterAmount.max },
  { css: 'contrast', axis: 'contrast', unit: 'ratio', identity: 1, min: 0, max: L1_ENVELOPE.filterAmount.max },
  {
    css: 'hue-rotate',
    axis: 'hueRotateDeg',
    unit: 'deg',
    identity: 0,
    min: L1_ENVELOPE.rotateDeg.min,
    max: L1_ENVELOPE.rotateDeg.max,
  },
  { css: 'blur', axis: 'blurPx', unit: 'px', identity: 0, min: 0, max: 10_000 },
] as const

/**
 * Does this `filter` string move a pixel?
 *
 * False for `none`, for the empty string, and for a stack whose every function
 * sits at its identity — `blur(0px)`, `saturate(1)`, `grayscale(0)`. That last
 * case is the one this exists for: the fold drops an identity filter
 * deliberately (it costs a composite layer and moves nothing), and a comparator
 * that measured the STRING rather than the EFFECT reported the fold's correct
 * behaviour as a MEDIUM defect.
 *
 * A function this table does not know (`drop-shadow`, `url(…)`) counts as
 * painting: the safe direction for an unknown treatment is to assume it does
 * something, so an unreported difference is never the result of ignorance.
 */
export function filterPaints(css: string | null | undefined): boolean {
  if (!css) return false
  const v = css.trim()
  if (v === '' || /^none$/i.test(v)) return false
  let sawKnown = false
  for (const m of v.matchAll(/(-?[a-z-]+)\(\s*(-?\d*\.?\d+)(%|deg|px|)\s*\)/gi)) {
    const fn = FILTER_FUNCTIONS.find((f) => f.css === m[1].toLowerCase())
    if (!fn) return true // an unknown function — assume it paints
    sawKnown = true
    let n = parseFloat(m[2])
    if (!Number.isFinite(n)) return true
    if (fn.unit === 'ratio' && m[3] === '%') n /= 100
    if (n !== fn.identity) return true
  }
  // Something was written that this cannot read at all (a `url()` mask, a
  // custom property) — treat it as painting, for the same reason as above.
  return !sawKnown
}

/**
 * REQ-332 — a `filter` string → its PAINTING CHAIN, in source order.
 *
 * `filterPaints` answers "does this move a pixel", which is the whole of what the
 * comparator used to ask — so a chain reordered between reference and
 * reproduction scored `present` on both sides and was invisible. CSS filter
 * functions do not commute, so the sequence is part of the value: this is the
 * comparable form of it, normalised the same way `filterPaints` is (ratios folded
 * out of percentages, functions at their identity dropped, unknown functions kept
 * verbatim because the safe reading of an unknown treatment is that it does
 * something).
 *
 * `none` when nothing paints, so the two ends of the scale read the same way
 * {@link shadowLabel} makes them read.
 */
export function filterChain(css: string | null | undefined): string {
  if (!filterPaints(css)) return 'none'
  const parts: string[] = []
  for (const m of (css ?? '').matchAll(/(-?[a-z-]+)\(\s*(-?\d*\.?\d+)(%|deg|px|)\s*\)/gi)) {
    const name = m[1].toLowerCase()
    const fn = FILTER_FUNCTIONS.find((f) => f.css === name)
    let n = parseFloat(m[2])
    if (!fn || !Number.isFinite(n)) {
      parts.push(m[0].toLowerCase().replace(/\s+/g, ''))
      continue
    }
    if (fn.unit === 'ratio' && m[3] === '%') n /= 100
    if (n === fn.identity) continue
    const unit = fn.unit === 'deg' ? 'deg' : fn.unit === 'px' ? 'px' : ''
    parts.push(`${name}(${Math.round(n * 1e4) / 1e4}${unit})`)
  }
  return parts.length ? parts.join(' ') : 'none'
}

/** Re-exported so a caller normalising a shadow colour has one import. */
export { colorToHex, colorToHexAlpha }
