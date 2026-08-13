/**
 * The color arithmetic behind the palette's two reference axes (REQ-137), in a
 * module with **no runtime imports at all**.
 *
 * WHY IT IS ITS OWN FILE (REQ-133). The palette popup's shade control is a
 * continuous slider, so it has to answer "what color is this entry at this
 * position" once per frame of a drag — a round trip per frame is not a control,
 * it is a progress bar. The browser therefore needs this maths, and there is
 * exactly one acceptable way for it to get it: run the SAME code the renderer
 * runs. A second implementation in `apps/control-app` would be a second answer
 * to a pixel-moving question, free to drift from the one that paints, and the
 * drift would show up as a slider that previews a color the page never
 * produces.
 *
 * The builder origin serves this file type-stripped at
 * `/framework/site-schema-shade.js`, exactly as it already serves the edit
 * bridge — and type-stripping is enough *because* there is nothing to resolve
 * here. `palette.ts` imports zod and could never travel that route; splitting
 * the arithmetic out is what makes the one-implementation rule affordable rather
 * than aspirational. `palette.ts` re-exports everything below, so no caller
 * learns about this file.
 *
 * Nothing here knows what a palette is. It is bytes in, bytes out.
 */

/** Normalise a `#rgb` shorthand to `#rrggbb`; longer forms pass through. */
export function expandHex(hex: string): string {
  if (hex.length !== 4) return hex
  const [, r, g, b] = hex
  return `#${r}${r}${g}${g}${b}${b}`
}

/**
 * The alpha byte for a 0..1 alpha, as two lowercase hex digits. Exact for every
 * byte-derived alpha: `round((b / 255) * 255) === b` for all `b` in 0..255, so a
 * literal→reference conversion of `#rrggbbaa` round-trips to the same bytes.
 */
export function alphaByteHex(alpha: number): string {
  return Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')
}

// ── the shade axis: an Oklab mix toward black or white (REQ-137) ─────────────
//
// Oklab rather than sRGB or HSL because the axis is a *slider*: the operator
// drags it and expects the color to move evenly. A straight sRGB lerp bunches
// the perceived change at the dark end (sRGB is gamma-encoded, so equal byte
// steps are not equal lightness steps), and HSL's `L` distorts hue-dependently
// — a 50%-lightness yellow and a 50%-lightness blue are nowhere near as bright
// as each other. Oklab is built so equal numeric steps read as equal steps,
// which is exactly the property a linear control needs.
//
// The consequence worth naming: mixing toward black or white always moves the
// `a`/`b` chroma coordinates toward zero, so **a shade can only reduce chroma**.
// A color more saturated than the entry is not a shade of it — it is a
// different color, and the retrofit files it as its own entry rather than
// approximating it.

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

const linearToSrgb = (c: number): number => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

/** sRGB bytes → Oklab `[L, a, b]` (Björn Ottosson's matrices). */
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = srgbToLinear(r / 255)
  const lg = srgbToLinear(g / 255)
  const lb = srgbToLinear(b / 255)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** Oklab `[L, a, b]` → an sRGB byte, clamped into gamut. */
function oklabToByte(component: number): number {
  return Math.max(0, Math.min(255, Math.round(linearToSrgb(component) * 255)))
}

/** Oklab `[L, a, b]` → `#rrggbb`, clamped into gamut. */
function oklabToHex(L: number, A: number, B: number): string {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const r = oklabToByte(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = oklabToByte(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const b = oklabToByte(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/**
 * `hex` mixed toward black (`shade < 0`) or white (`shade > 0`) in Oklab, by
 * `|shade|` of the way. `0` returns the color unchanged (expanded to
 * `#rrggbb`), `-1` is pure black and `+1` pure white.
 *
 * This is the *one* implementation of the axis: the retrofit fits a shade by
 * searching over this same function rather than over its own copy of the maths,
 * the renderer resolves through it, and the popup's slider previews through it
 * — so the drift the retrofit measures is the drift that will paint, and the
 * swatch under the slider is the color the page will show.
 */
export function shadeHex(hex: string, shade: number): string {
  const body = expandHex(hex).slice(1)
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(body.slice(i, i + 2), 16))
  if (shade === 0) return `#${body.toLowerCase()}`
  const [L, A, B] = rgbToOklab(r, g, b)
  const t = Math.abs(shade)
  // The target is pure black `(0, 0, 0)` or pure white `(1, 0, 0)`; both have
  // zero chroma, which is why the mix can only desaturate.
  const targetL = shade > 0 ? 1 : 0
  return oklabToHex(L + (targetL - L) * t, A * (1 - t), B * (1 - t))
}
