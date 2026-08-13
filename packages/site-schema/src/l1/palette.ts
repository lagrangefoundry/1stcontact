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

// The color arithmetic lives in `./shade`, which imports NOTHING — see that
// module's header. It is split out so the builder's shade slider can run the
// one implementation of the axis in the browser rather than a copy of it
// (REQ-133); re-exported here so no caller has to know where it went.
import { alphaByteHex, expandHex, shadeHex } from './shade'
export { alphaByteHex, expandHex, shadeHex } from './shade'

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
 * Visit every palette reference reachable from `input`, replacing each with
 * whatever `fn` returns. Pure — the input is never mutated, and a subtree
 * containing no reference is returned by identity rather than copied.
 *
 * **This is the one structural walk** (REQ-133 §6). Collecting references,
 * resolving them and renaming an entry are three questions about the same set of
 * nodes, and three hand-kept copies of the traversal is how a census comes to
 * disagree with the edit it is describing — the count a palette editor shows
 * before a rename has to be exactly the set that rename rewrites, or it is
 * telling the operator a number about a different site.
 *
 * Structural rather than a hand-listed tour of the color axes: `l1Color` is one
 * alias used in a dozen places and growing, and a tour would silently miss the
 * next one.
 *
 * `fn` receives the reference and its JSON-pointer-style path relative to
 * `input`. Returning the reference itself (or anything `===` to it) leaves the
 * node untouched.
 */
export function mapL1PaletteRefs(
  input: unknown,
  fn: (ref: L1PaletteRef, path: string) => unknown,
): unknown {
  const walk = (v: unknown, path: string): unknown => {
    if (Array.isArray(v)) {
      let changed = false
      const out = v.map((item, i) => {
        const next = walk(item, `${path}/${i}`)
        if (next !== item) changed = true
        return next
      })
      return changed ? out : v
    }
    if (typeof v !== 'object' || v === null) return v
    // A reference is a LEAF for this walk. Descending into it would visit its
    // `ref` string as though it were a container, and — worse — a replacement
    // that is itself a reference would be re-visited by whatever the caller
    // meant to apply once.
    if (isL1PaletteRef(v)) return fn(v as L1PaletteRef, path)
    let changed = false
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(v)) {
      const next = walk(item, `${path}/${key}`)
      if (next !== item) changed = true
      out[key] = next
    }
    return changed ? out : v
  }
  return walk(input, '')
}

/**
 * Every palette reference reachable from `input`, with a JSON-pointer-style path
 * relative to it.
 *
 * REQ-137 — a reference counts against **its entry, whatever its shade**. There
 * is no per-step tally any more, because there are no steps: a shade is a
 * position within the entry's own family, not a sibling of it. That is what
 * makes the usage count a palette editor shows ("primary, used 40 times") the
 * whole truth about what an edit to `primary` will move.
 */
export function collectL1PaletteRefs(input: unknown): { path: string; ref: L1PaletteRef }[] {
  const out: { path: string; ref: L1PaletteRef }[] = []
  mapL1PaletteRefs(input, (ref, path) => {
    out.push({ path, ref })
    return ref
  })
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
  return mapL1PaletteRefs(input, (ref) => resolveL1Color(ref, palette)) as T
}

/**
 * Every reference to `from` re-pointed at `to`, everything else left alone
 * (REQ-133 §5d).
 *
 * The rename is expressed HERE, on the shared walk, rather than in the command
 * that calls it — so the set of nodes it rewrites is the same set
 * {@link collectL1PaletteRefs} counted, by construction rather than by two
 * traversals agreeing.
 *
 * Only `ref` moves: `shade` and `alpha` are properties of the *use* and say
 * nothing about which entry it names, so a reference at a shade survives a
 * rename at exactly the shade it had.
 */
export function renameL1PaletteRef<T>(input: T, from: string, to: string): T {
  return mapL1PaletteRefs(input, (ref) => (ref.ref === from ? { ...ref, ref: to } : ref)) as T
}
