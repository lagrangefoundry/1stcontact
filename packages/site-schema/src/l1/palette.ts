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
 * reference naming a missing entry (or a missing step) is a **validation
 * failure**, never a render-time fallback: {@link resolveL1Color} throws rather
 * than substituting a default, and the envelope validator rejects the document
 * long before the renderer ever sees it.
 *
 * **Entries are opaque; translucency is a separate axis.** DOC-23 §5.4 — if an
 * entry could carry alpha then one conceptual colour would occupy N entries and
 * the entry would stop being the unit of change. So the alpha lives on the
 * *reference* ({@link L1PaletteRef.alpha}), which is exactly the "one entry plus
 * the opacity axis" collapse the measured `xgd` evidence calls for: `#2e86a3`,
 * `#2e86a3a6` and `#2e86a355` are one entry at three alphas.
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

/** A palette entry / step name: kebab-case, free-form (`primary`, `brand-teal`, `500`). */
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const l1PaletteNameSchema = z
  .string()
  .regex(NAME, 'must be a kebab-case name (lowercase alphanumerics separated by single hyphens)')

/**
 * One palette entry: a base `value` plus optional named `steps`. Steps are how a
 * *ramp* belongs to a role rather than to the vocabulary (DOC-23 §5.4) — the
 * legacy 15-slot theme palette baked ramp positions into sibling role names
 * (`accentLight` / `accentMid` / `accentDeep`), which does not scale to the
 * measured hue families.
 */
export const l1PaletteEntrySchema = z
  .object({
    value: l1OpaqueHexSchema,
    steps: z.record(l1PaletteNameSchema, l1OpaqueHexSchema).optional(),
  })
  .strict()

/** A palette: an arbitrary-size map of kebab-case names to entries. */
export const l1PaletteSchema = z.record(l1PaletteNameSchema, l1PaletteEntrySchema)

/**
 * A reference to a palette entry. A *typed object* rather than a magic string:
 * L1's leaf axes are typed literals and every object is `.strict()`, so a shape
 * that can only carry `{ ref, step?, alpha? }` is both unambiguous against the
 * hex grammar and unable to smuggle a freeform value.
 *
 * `alpha` is the translucency axis entries deliberately do not carry (see the
 * module header): `1` (or absent) resolves to the entry's `#rrggbb`, anything
 * less appends the alpha byte.
 */
export const l1PaletteRefSchema = z
  .object({
    ref: l1PaletteNameSchema,
    step: l1PaletteNameSchema.optional(),
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
  let hex: string
  if (value.step === undefined) {
    hex = entry.value
  } else {
    const step = entry.steps?.[value.step]
    if (!step) {
      throw new Error(
        `L1 palette reference '${value.ref}' has no step '${value.step}': the entry declares [${Object.keys(
          entry.steps ?? {},
        ).join(', ')}].`,
      )
    }
    hex = step
  }
  if (value.alpha === undefined || value.alpha >= 1) return hex
  return `${expandHex(hex)}${alphaByteHex(value.alpha)}`
}

/**
 * Every palette reference reachable from `input`, with a JSON-pointer-style path
 * relative to it. The walk is structural rather than a hand-listed tour of the
 * colour axes: `l1Color` is one alias used in a dozen places and growing, and a
 * tour would silently miss the next one.
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
