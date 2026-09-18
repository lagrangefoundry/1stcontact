/**
 * Colour + gradient normalization — the value vocabulary both sides of the
 * fidelity diff are read into.
 *
 * REQ-274 — lifted verbatim out of `values-diff.ts` so the axis declaration
 * (`value-axes.ts`) can read a raw `background-image` into the same normalized
 * {@link TextGradient} the capture bundle already stores, without importing the
 * module that imports it. Nothing about the maths changed; `values-diff` still
 * re-exports every name here, so every existing importer is untouched.
 */
import type { GradientStop, TextGradient } from './types'


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

/** sRGB channel (0–255) → linear-light [0,1] (inverse companding). */
function srgbToLinear(c: number): number {
  const n = c / 255
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
}

/**
 * sRGB `[r,g,b]` (0–255) → OKLab `[L, a, b]` (Björn Ottosson's OKLab, the
 * perceptually-uniform space CSS `oklch()` is built on). Euclidean distance in
 * this space is ΔEOK — see {@link colorDistance}.
 */
function toOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/**
 * Perceptual distance between two colours (REQ-48 item 8b), as ΔEOK — Euclidean
 * distance in **OKLab** (the space `oklch()` builds on), replacing the earlier
 * redmean RGB approximation. OKLab is perceptually uniform, so one threshold
 * holds across the gamut: raw RGB over/under-weights greens and darks, so a
 * single RGB tolerance is simultaneously too loose in one region and too tight
 * in another. Two identical colours score 0; `#000` vs `#fff` is ≈1.0. A tiny
 * threshold (~0.02, the ΔEOK just-noticeable band) suppresses the imperceptible
 * per-channel rounding between a re-render and its capture (`#808080` vs
 * `#818080` ≈ 0.0015) while leaving real near-neighbour deltas — the flagship
 * gold-vs-gold (`#f5e6a3` vs `#fbba72` ≈ 0.105), and the near-black-vs-slate body
 * tone (`#111` vs `#334155` ≈ 0.198) — well above the line. Unparseable input
 * scores `Infinity` so an unknown colour is never silently treated as a match.
 */
export function colorDistance(a: string, b: string): number {
  const ca = toRgb(a)
  const cb = toRgb(b)
  if (!ca || !cb) return Infinity
  const [la, aa, ba] = toOklab(ca)
  const [lb, ab, bb] = toOklab(cb)
  return Math.hypot(la - lb, aa - ab, ba - bb)
}

/**
 * Normalize a computed `linear-gradient(...)` string to {@link TextGradient}.
 * Non-linear (radial/conic) or unparseable input yields `{ angleDeg: null }` so
 * a gradient's *presence* is still comparable even when its direction is not.
 */
export function normalizeGradient(css: string | null | undefined): TextGradient | null {
  if (!css || !/gradient\(/.test(css)) return null

  const stops: GradientStop[] = []
  // Each stop is a colour optionally followed by its offset (`… 60%`). The
  // offset is captured (REQ-59) so position drift is a comparable delta; a stop
  // with no explicit offset records `position: null`.
  const stopRe = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))(?:\s+(-?\d+(?:\.\d+)?)%)?/g
  let m: RegExpExecArray | null
  while ((m = stopRe.exec(css))) {
    const hex = colorToHex(m[1])
    if (hex) stops.push({ color: hex, position: m[2] !== undefined ? parseFloat(m[2]) : null })
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

