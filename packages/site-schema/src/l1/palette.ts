/**
 * The L1 palette colour model (REQ-114 / DOC-23 §5) — **literal base, palette
 * overlay**.
 *
 * Colour takes exactly the shape geometry already has (DOC-23 §3): an absolute
 * base that is always valid, plus an optional overlay the author refines it
 * with.
 *
 * | | absolute base | overlay |
 * |---|---|---|
 * | geometry | per-viewport keyframes | recovered structure |
 * | **colour** | **hex literal** | **palette reference** |
 *
 * - A **hex literal** is always valid, so transcription from a capture stays
 *   lossless and inference-free and nothing is gated on a palette existing.
 * - A **palette reference** resolves to an entry whose value is a hex, so the
 *   rendered output is identical either way and converting literals to
 *   references is pixel-identical by construction.
 *
 * A palette is of **arbitrary size** with free-form kebab-case entry names —
 * DOC-23 §5.4's role vocabulary is a starting *vocabulary*, not a schema. A
 * reference naming a missing entry is a **validation failure**, never a
 * render-time fallback: {@link resolveL1Color} throws rather than substituting a
 * default, and the envelope validator rejects the document long before the
 * renderer ever sees it.
 *
 * **An entry is exactly one colour, and both of its variation axes live on the
 * reference** (REQ-137, DOC-23 §5). If an entry could carry alpha then one
 * conceptual colour would occupy N entries and the entry would stop being the
 * unit of change; the measured `xgd` evidence is `#2e86a3`, `#2e86a3a6` and
 * `#2e86a355`, which are one entry at three alphas.
 *
 * REQ-137 applies that same argument one axis over. Named *steps* were the
 * mistake it warns about: `primary`, `primary/500` and `primary/700` were three
 * stored hexes that nothing kept related, so changing the brand teal repainted
 * the references to the base and left the ones on its steps at the old colour.
 * The light↔dark family is therefore not stored at all — it is **generated**
 * from the entry, and the position within it is carried by
 * {@link L1PaletteRef.shade}. Changing the entry moves the whole family by
 * construction rather than by a convention someone has to maintain.
 *
 * {@link L1PaletteRef.shade} and {@link L1PaletteRef.alpha} are independent
 * axes on the same reference, which is what they are.
 */
import { z } from 'zod'

/** A painted colour literal — hex only. No `url()`, no `rgb(var(--…))`, no keywords. */
export const l1HexSchema = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    'must be a hex color (#rgb, #rrggbb, or #rrggbbaa)',
  )

/**
 * A palette *entry* value — opaque hex only. An 8-digit (alpha-carrying) hex is
 * rejected here on purpose: alpha belongs to the reference, not the entry.
 */
export const l1OpaqueHexSchema = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    'a palette entry must be an opaque hex color (#rgb or #rrggbb) — translucency is a reference axis, not an entry',
  )

/** A palette entry name: kebab-case, free-form (`primary`, `brand-teal`, `slate-2`). */
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const l1PaletteNameSchema = z
  .string()
  .regex(NAME, 'must be a kebab-case name (lowercase alphanumerics separated by single hyphens)')

/**
 * One palette entry: **a single colour** (REQ-137). Its light↔dark family is
 * generated on the reference via {@link L1PaletteRef.shade}, not stored here, so
 * the entry stays the unit of change — see the module header.
 */
export const l1PaletteEntrySchema = z
  .object({
    value: l1OpaqueHexSchema,
  })
  .strict()

/** A palette: an arbitrary-size map of kebab-case names to entries. */
export const l1PaletteSchema = z.record(l1PaletteNameSchema, l1PaletteEntrySchema)

/**
 * A reference to a palette entry. A *typed object* rather than a magic string:
 * L1's leaf axes are typed literals and every object is `.strict()`, so a shape
 * that can only carry `{ ref, shade?, alpha? }` is both unambiguous against the
 * hex grammar and unable to smuggle a freeform value.
 *
 * Both optional keys are the variation axes entries deliberately do not carry
 * (see the module header):
 *
 * - `shade` — a **continuous** signed scalar on `[-1, +1]`: negative mixes the
 *   entry toward black, positive toward white, in Oklab
 *   ({@link shadeHex}). `0` or absent resolves to the entry's own hex.
 *   Continuous rather than a set of named stops because the axis is
 *   perceptually even, so a slider over it is linear in what the eye sees.
 * - `alpha` — `1` (or absent) resolves to the opaque hex, anything less appends
 *   the alpha byte.
 */
export const l1PaletteRefSchema = z
  .object({
    ref: l1PaletteNameSchema,
    shade: z.number().min(-1).max(1).optional(),
    alpha: z.number().min(0).max(1).optional(),
  })
  .strict()

/**
 * A colour axis: the absolute base or the overlay. Used for every colour in L1
 * — one type alias, so widening it once reaches gradient stops, shadows,
 * borders, textures, link states and surface fills alike.
 */
export const l1ColorSchema = z.union([l1HexSchema, l1PaletteRefSchema])

export type L1Palette = z.infer<typeof l1PaletteSchema>
export type L1PaletteEntry = z.infer<typeof l1PaletteEntrySchema>
export type L1PaletteRef = z.infer<typeof l1PaletteRefSchema>
export type L1Color = z.infer<typeof l1ColorSchema>

/**
 * True when `v` is a palette reference rather than a hex literal. Structural,
 * and unambiguous because no other L1 object declares a `ref` key and every L1
 * object is `.strict()`.
 */
export function isL1PaletteRef(v: unknown): v is L1PaletteRef {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && typeof (v as { ref?: unknown }).ref === 'string'
}

/** Normalise a `#rgb` shorthand to `#rrggbb`; longer forms pass through. */
function expandHex(hex: string): string {
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
// drags it and expects the colour to move evenly. A straight sRGB lerp bunches
// the perceived change at the dark end (sRGB is gamma-encoded, so equal byte
// steps are not equal lightness steps), and HSL's `L` distorts hue-dependently
// — a 50%-lightness yellow and a 50%-lightness blue are nowhere near as bright
// as each other. Oklab is built so equal numeric steps read as equal steps,
// which is exactly the property a linear control needs.
//
// The consequence worth naming: mixing toward black or white always moves the
// `a`/`b` chroma coordinates toward zero, so **a shade can only reduce chroma**.
// A colour more saturated than the entry is not a shade of it — it is a
// different colour, and the retrofit files it as its own entry rather than
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
 * `|shade|` of the way. `0` returns the colour unchanged (expanded to
 * `#rrggbb`), `-1` is pure black and `+1` pure white.
 *
 * This is the *one* implementation of the axis: the retrofit fits a shade by
 * searching over this same function rather than over its own copy of the maths,
 * so the drift it measures is the drift the renderer will actually produce.
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

/**
 * Resolve a colour axis to its hex literal.
 *
 * A literal is returned unchanged. A reference is looked up in `palette` — and
 * an unresolvable one **throws**: there is no render-time fallback and no silent
 * default (DOC-23 §6). Validation catches this first, so a throw here means the
 * document reached a consumer that skipped validation, which is a bug worth
 * failing loudly on rather than painting the wrong colour.
 */
export function resolveL1Color(value: L1Color, palette?: L1Palette): string {
  if (typeof value === 'string') return value
  const entry = palette?.[value.ref]
  if (!entry) {
    throw new Error(
      `L1 palette reference '${value.ref}' does not resolve: ${
        palette ? `the palette declares [${Object.keys(palette).join(', ')}]` : 'no palette is declared'
      }.`,
    )
  }
  // An absent or zero shade is the entry verbatim — not a round trip through
  // Oklab, so a reference with no shade is byte-identical to the literal it
  // replaced by construction rather than by the precision of the maths.
  const hex = value.shade === undefined || value.shade === 0 ? entry.value : shadeHex(entry.value, value.shade)
  if (value.alpha === undefined || value.alpha >= 1) return hex
  return `${expandHex(hex)}${alphaByteHex(value.alpha)}`
}

/**
 * Every palette reference reachable from `input`, with a JSON-pointer-style path
 * relative to it. The walk is structural rather than a hand-listed tour of the
 * colour axes: `l1Color` is one alias used in a dozen places and growing, and a
 * tour would silently miss the next one.
 *
 * REQ-137 — a reference counts against **its entry, whatever its shade**. There
 * is no per-step tally any more, because there are no steps: a shade is a
 * position within the entry's own family, not a sibling of it. That is what
 * makes the usage count a palette editor shows ("primary, used 40 times") the
 * whole truth about what an edit to `primary` will move.
 */
export function collectL1PaletteRefs(input: unknown): { path: string; ref: L1PaletteRef }[] {
  const out: { path: string; ref: L1PaletteRef }[] = []
  const walk = (v: unknown, path: string): void => {
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${path}/${i}`))
      return
    }
    if (typeof v !== 'object' || v === null) return
    if (isL1PaletteRef(v)) {
      out.push({ path, ref: v as L1PaletteRef })
      return
    }
    for (const [key, item] of Object.entries(v)) walk(item, `${path}/${key}`)
  }
  walk(input, '')
  return out
}

/**
 * Replace every palette reference in `input` with its resolved hex literal,
 * returning a structurally identical copy. Pure; the input is never mutated.
 *
 * This is the *one* resolution pass. Applying it wholesale — rather than
 * teaching each of L1's colour sinks to resolve — is what makes the conversion
 * pixel-identical by construction: everything downstream of it (the renderer,
 * the analytic evaluator, the round-trip gate, values-diff) sees exactly the
 * document it would have seen had the colours been written as literals.
 */
export function resolveL1Palette<T>(input: T, palette?: L1Palette): T {
  const map = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(map)
    if (typeof v !== 'object' || v === null) return v
    if (isL1PaletteRef(v)) return resolveL1Color(v as L1PaletteRef, palette)
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(v)) out[key] = map(item)
    return out
  }
  return map(input) as T
}
