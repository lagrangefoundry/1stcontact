/**
 * `1c colors <slug>` — the colour census, and the repeatable retrofit that turns
 * a site's colour literals into palette references (REQ-114 / DOC-23 §5).
 *
 * The census reproduces the DOC-23 §5.3 measurement — distinct colours, and
 * distinct RGB ignoring alpha — which was done ad hoc when the palette model was
 * designed. It is a command now because that measurement is the evidence the
 * whole model rests on: captured sites arrive *already palette-structured*, so a
 * good palette is derivable rather than imposed.
 *
 * `--assign` performs the retrofit. It is deliberately two mechanically distinct
 * passes, in order of how much they infer:
 *
 *  1. **Alpha collapse — exact, zero inference.** One RGB used at N opacities is
 *     one entry plus the reference's alpha axis. `xgd`'s `#2e86a3`, `#2e86a3a6`
 *     and `#2e86a355` are one colour at three opacities, and saying so is a
 *     statement of fact about the bytes.
 *  2. **Ramp fitting — mild, reviewable, and *measured*.** Colours sharing a hue
 *     family become one entry plus a `shade` on each reference, when the mix can
 *     actually reach them: `xgd`'s neutrals run one hue at five lightnesses, its
 *     brand teal at two. A member the mix cannot reach keeps its own entry — a
 *     slightly large palette is a fine outcome, a *wrong* one is not.
 *
 * **What REQ-137 changed about the guarantee.** REQ-114 promised byte-identity
 * and could keep it, because a step stored the member's exact hex. A shade
 * *computes* it, so a genuine ramp member lands within a bounded distance of
 * where it was rather than exactly on it. The bound is
 * {@link SHADE_FIT_TOLERANCE} and the fit is searched over the renderer's own
 * {@link shadeHex}, so the drift measured here is the drift that will paint.
 * Anything outside the bound is not approximated: it becomes its own entry and
 * stays a byte-exact literal. `--assign` verifies both halves before writing,
 * reports the drift it accepted, and refuses to write if anything exceeds it.
 *
 * Family names are derived from hue and chroma (`slate`, `teal`, `sand`), which
 * says what a family *is* without inventing a role it may not play. Where the
 * role IS obvious, `--names <derived>=<chosen>` renames it to DOC-23 §5.4's
 * vocabulary — as an argument rather than a hand-edit, so the retrofit stays
 * reproducible end to end.
 */
import path from 'node:path'
import type { L1Palette, L1PaletteRef } from '@1stcontact/site-schema'
import { alphaByteHex, resolveL1Palette, shadeHex, validateSite } from '@1stcontact/site-schema'
import { draftDir, listFilesRel, pathExists, readJson, writeJson, type StoreContext } from '../store'
import type { GlobalOptions } from './commands'
import { ctxOf } from './commands'
import { CommandError } from './errors'

// ── colour arithmetic ────────────────────────────────────────────────────────

/** A colour split into its opaque RGB and its alpha byte (255 when opaque). */
export interface SplitColor {
  /** `#rrggbb`, lowercased and expanded from any `#rgb` shorthand. */
  rgb: string
  /** 0..255. */
  alpha: number
}

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/** Split a hex literal into `{ rgb, alpha }`, or `null` when it is not one. */
export function splitColor(value: string): SplitColor | null {
  if (!HEX.test(value)) return null
  let body = value.slice(1).toLowerCase()
  if (body.length === 3) body = body.split('').map((c) => c + c).join('')
  const alpha = body.length === 8 ? parseInt(body.slice(6, 8), 16) : 255
  return { rgb: `#${body.slice(0, 6)}`, alpha }
}

/**
 * Hue (degrees), chroma (0–255) and lightness (percent) of an `#rrggbb`.
 *
 * **Chroma, not HSL saturation.** HSL saturation is unusable as a neutrality
 * test near the ends of the lightness range: `#fffef8` — a cream 7/255 off white
 * — reports 100% saturation, because the denominator `1 - |2L-1|` collapses. Its
 * chroma is 7, which is what the eye actually sees. Reading neutrality off
 * saturation would have split `xgd`'s three warm surfaces (chroma 16/9/7, hue
 * 49–53) across two families and contradicted the measurement in DOC-23 §5.3.
 */
export function toHcl(rgb: string): { h: number; c: number; l: number } {
  const r = parseInt(rgb.slice(1, 3), 16)
  const g = parseInt(rgb.slice(3, 5), 16)
  const b = parseInt(rgb.slice(5, 7), 16)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const c = max - min
  const l = ((max + min) / 2 / 255) * 100
  if (c === 0) return { h: 0, c: 0, l }
  let h: number
  if (max === r) h = ((g - b) / c) % 6
  else if (max === g) h = (b - r) / c + 2
  else h = (r - g) / c + 4
  h *= 60
  if (h < 0) h += 360
  return { h, c, l }
}

// ── census ───────────────────────────────────────────────────────────────────

/** One measured colour and where it is used. */
export interface ColorUse {
  /** The literal exactly as authored (lowercased). */
  literal: string
  rgb: string
  alpha: number
  count: number
}

export interface ColorCensus {
  slug: string
  /** Distinct colour literals, most-used first — DOC-23 §5.3's first column. */
  colors: ColorUse[]
  /** Distinct RGB ignoring alpha — DOC-23 §5.3's second column. */
  distinctRgb: number
  /** RGB values used at more than one alpha (the exact-collapse candidates). */
  alphaFamilies: { rgb: string; alphas: number[] }[]
}

/**
 * Every colour literal reachable from `input`. Structural, like the palette
 * resolver: `l1Color` is one alias used in a dozen places and growing, and a
 * hand-listed tour of the axes would silently miss the next one. A string is a
 * colour iff it parses as a hex literal — no other L1 axis takes that shape.
 */
export function collectColorLiterals(input: unknown): string[] {
  const out: string[] = []
  const walk = (v: unknown): void => {
    if (typeof v === 'string') {
      if (HEX.test(v)) out.push(v.toLowerCase())
      return
    }
    if (Array.isArray(v)) {
      v.forEach(walk)
      return
    }
    if (typeof v === 'object' && v !== null) for (const item of Object.values(v)) walk(item)
  }
  walk(input)
  return out
}

/**
 * Read a site's draft page definitions (the colour-bearing half of a site),
 * **with any existing palette resolved back to literals**.
 *
 * That resolution is what makes the retrofit *re-runnable* rather than a
 * one-shot: an already-assigned site censuses and re-assigns exactly as it did
 * the first time, so adding a page or renaming a family is one command instead
 * of a manual un-assignment. It is also lossless in the direction that matters —
 * a reference resolves to the literal it replaced, which is the same guarantee
 * the assignment itself is gated on.
 */
function readPages(ctx: StoreContext, slug: string): { rel: string; abs: string; page: unknown }[] {
  const dir = draftDir(ctx, slug)
  if (!pathExists(dir)) throw new CommandError({ code: 'NOT_FOUND', message: `Site '${slug}' has no draft/.`, path: dir })
  const palette = readJson<Record<string, unknown>>(path.join(dir, 'site.json')).palette as
    | L1Palette
    | undefined
  const pagesDir = path.join(dir, 'pages')
  return listFilesRel(pagesDir)
    .filter((rel) => rel.endsWith('.json'))
    .map((rel) => ({
      rel,
      abs: path.join(pagesDir, rel),
      page: resolveL1Palette(readJson<unknown>(path.join(pagesDir, rel)), palette),
    }))
}

/** Census a site's colours without touching it. */
export function cmdColors(slug: string, opts: GlobalOptions = {}): ColorCensus {
  const ctx = ctxOf(opts)
  const literals = readPages(ctx, slug).flatMap(({ page }) => collectColorLiterals(page))

  const byLiteral = new Map<string, ColorUse>()
  for (const literal of literals) {
    const split = splitColor(literal)
    if (!split) continue
    const existing = byLiteral.get(literal)
    if (existing) existing.count += 1
    else byLiteral.set(literal, { literal, rgb: split.rgb, alpha: split.alpha, count: 1 })
  }

  const colors = [...byLiteral.values()].sort((a, b) => b.count - a.count || a.literal.localeCompare(b.literal))

  const alphasByRgb = new Map<string, Set<number>>()
  for (const use of colors) {
    const set = alphasByRgb.get(use.rgb) ?? new Set<number>()
    set.add(use.alpha)
    alphasByRgb.set(use.rgb, set)
  }
  const alphaFamilies = [...alphasByRgb.entries()]
    .filter(([, alphas]) => alphas.size > 1)
    .map(([rgb, alphas]) => ({ rgb, alphas: [...alphas].sort((a, b) => b - a) }))
    .sort((a, b) => b.alphas.length - a.alphas.length || a.rgb.localeCompare(b.rgb))

  return { slug, colors, distinctRgb: alphasByRgb.size, alphaFamilies }
}

export function formatCensus(census: ColorCensus): string {
  const lines = [
    `${census.slug}: ${census.colors.length} distinct colour(s), ${census.distinctRgb} distinct RGB ignoring alpha`,
  ]
  for (const c of census.colors) {
    const alpha = c.alpha === 255 ? '' : ` (α ${(c.alpha / 255).toFixed(2)})`
    lines.push(`  ${c.literal}${alpha}  ×${c.count}`)
  }
  if (census.alphaFamilies.length) {
    lines.push('  alpha families (one entry + the reference alpha axis):')
    for (const f of census.alphaFamilies) {
      lines.push(`    ${f.rgb} at α ${f.alphas.map((a) => (a / 255).toFixed(2)).join(', ')}`)
    }
  }
  return lines.join('\n')
}

// ── palette derivation ───────────────────────────────────────────────────────

/**
 * How far two hues may sit apart and still be read as one family. 15° keeps
 * `xgd`'s cool neutrals (hue 215–220) and its brand teal (192–196) apart, which
 * is the measurement this threshold has to respect: they are two roles, not one
 * ramp, and merging them would be the *wrong* palette DOC-23 §5.3 warns about.
 */
const HUE_TOLERANCE_DEG = 15

/**
 * Below this chroma a colour carries no hue worth grouping on — a true grey,
 * black or white. The floor is deliberately *low*: `xgd`'s creams sit at chroma
 * 7–16 and are a real warm family (DOC-23 §5.3), so anything much higher would
 * dissolve a measured ramp into the neutrals.
 */
const NEUTRAL_CHROMA = 6

/** Above this chroma a family is named by its hue; below it, by a muted name. */
const MUTED_CHROMA = 40

/** Coarse hue names — enough to name a family after what it *is*. */
const HUE_NAMES: [number, string][] = [
  [15, 'red'],
  [45, 'orange'],
  [70, 'amber'],
  [95, 'lime'],
  [165, 'green'],
  [200, 'teal'],
  [235, 'blue'],
  [265, 'indigo'],
  [290, 'violet'],
  [330, 'pink'],
  [360, 'red'],
]

/**
 * Muted names for a low-chroma family. A cool grey at hue 217 is a *slate*, not
 * a blue, and a cream at hue 51 is *sand*, not amber — naming it by the hue
 * alone would describe a colour nobody would recognise in it.
 */
function familyName(h: number, chroma: number): string {
  if (chroma < MUTED_CHROMA) {
    if (h >= 170 && h < 265) return 'slate'
    if (h >= 20 && h < 70) return 'sand'
    if (h >= 95 && h < 170) return 'moss'
    return 'mauve'
  }
  for (const [limit, name] of HUE_NAMES) if (h < limit) return name
  return 'red'
}

/**
 * How this colour would be filed: which of the three chroma classes it lands in
 * and, when it has a hue worth grouping on, which family that hue names.
 *
 * The grouping decides membership on these two facts, so agreeing on them is
 * what it means for two colours to be candidates for the same entry — see
 * {@link fitShade}'s caller for why a fit has to preserve it.
 */
function classOf(rgb: string): string {
  const { h, c } = toHcl(rgb)
  if (c < NEUTRAL_CHROMA) return 'neutral'
  return `${c >= MUTED_CHROMA ? 'vivid' : 'muted'}:${familyName(h, c)}`
}

interface Family {
  name: string
  /** Members, lightest first. */
  members: { rgb: string; l: number }[]
}

/** Rename derived families — `{ derived: chosen }`, for the vocabulary pass. */
export type FamilyNames = Readonly<Record<string, string>>

/**
 * Group distinct RGB values into families. A colour joins the family whose mean
 * hue it is within {@link HUE_TOLERANCE_DEG} of **and whose chroma class it
 * shares**; near-greys join `neutral`. Anything that clusters with nothing comes
 * back as a family of one, which is the honest outcome for a colour that is
 * genuinely its own role.
 *
 * **Chroma class, not hue alone.** Hue alone chains a *brand* colour into the
 * tinted greys that happen to share its hue: `gigabytealchemy` carries a vivid
 * blue (`#1447e6`, chroma 210) and a slate scale (`#e2e8f0`, chroma 14) only 11°
 * apart, and merging them produced one 14-member "blue" entry that was not a
 * role anyone could edit — the *wrong* palette DOC-23 §5.3 warns against, dressed
 * up as a small one. A vivid hue and a neutral tinted with it are two roles, so
 * `vivid` and `muted` never merge.
 */
export function groupIntoFamilies(
  rgbs: string[],
  names: FamilyNames = {},
  used: Map<string, number> = new Map(),
): Family[] {
  interface Bucket {
    neutral: boolean
    vivid: boolean
    hueSum: number
    chromaSum: number
    members: { rgb: string; l: number }[]
  }
  const buckets: Bucket[] = []
  // Sort for determinism: the same input always yields the same families.
  for (const rgb of [...rgbs].sort()) {
    const { h, c, l } = toHcl(rgb)
    if (c < NEUTRAL_CHROMA) {
      const neutral = buckets.find((b) => b.neutral)
      if (neutral) neutral.members.push({ rgb, l })
      else buckets.push({ neutral: true, vivid: false, hueSum: 0, chromaSum: 0, members: [{ rgb, l }] })
      continue
    }
    const vivid = c >= MUTED_CHROMA
    const bucket = buckets.find(
      (b) =>
        !b.neutral &&
        b.vivid === vivid &&
        Math.abs(b.hueSum / b.members.length - h) <= HUE_TOLERANCE_DEG,
    )
    if (bucket) {
      bucket.hueSum += h
      bucket.chromaSum += c
      bucket.members.push({ rgb, l })
    } else {
      buckets.push({ neutral: false, vivid, hueSum: h, chromaSum: c, members: [{ rgb, l }] })
    }
  }
  // Disambiguate two families that landed on the same name (two distinct blues,
  // say) so every entry name stays unique without inventing a role. `used` is a
  // parameter so the caller can carry it across the derivation's rounds
  // (REQ-137) and a second-round blue becomes `blue-2` rather than colliding.
  return buckets.map((b) => {
    const derived = b.neutral
      ? 'neutral'
      : familyName(b.hueSum / b.members.length, b.chromaSum / b.members.length)
    const n = (used.get(derived) ?? 0) + 1
    used.set(derived, n)
    const unique = n === 1 ? derived : `${derived}-${n}`
    return {
      name: names[unique] ?? unique,
      members: [...b.members].sort((x, y) => y.l - x.l || x.rgb.localeCompare(y.rgb)),
    }
  })
}

/**
 * How far a fitted shade may land from the colour it replaces, as a maximum
 * per-channel byte difference.
 *
 * **Measured, not chosen** (REQ-137 §3). Fitting every one of the 32 steps the
 * two retrofitted sites stored puts 24 of them at 0–8 and the remaining 8 at
 * 15–101, with nothing in between. The gap is where the two populations
 * genuinely separate: below it are ramp members a mix reproduces invisibly,
 * above it are colours more saturated than their base — which a mix cannot
 * reach at all, because mixing toward black or white only removes chroma. 8/255
 * on one channel is also under the ~2% a viewer can pick out on a flat fill.
 */
export const SHADE_FIT_TOLERANCE = 8

/** How finely the shade axis is searched. 2000 steps ≈ 0.001 of the axis. */
const SHADE_SEARCH_STEPS = 2000

/** The largest per-channel byte difference between two `#rrggbb` values. */
function maxChannelDelta(a: string, b: string): number {
  let worst = 0
  for (let i = 1; i < 7; i += 2) {
    worst = Math.max(worst, Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)))
  }
  return worst
}

/** A member fitted onto its base's shade axis. */
interface ShadeFit {
  /** Rounded to 3 decimals — a slider position, not a measurement. */
  shade: number
  /** The hex the shade actually resolves to. */
  resolved: string
  /** Max per-channel byte difference from the colour being replaced. */
  delta: number
}

/**
 * The shade of `base` that lands closest to `target`, by scanning the axis.
 *
 * A scan rather than a solve because the objective is not smooth: it is a
 * maximum over three channels that have each been rounded to a byte, so it has
 * flat regions and ties that a gradient method would sit down in. The axis is
 * one bounded dimension, so scanning it is both exact enough and cheap.
 *
 * Crucially the scan calls {@link shadeHex} — the renderer's own function — so
 * the returned `delta` is what the site will actually paint, not an estimate
 * from a second copy of the colour maths.
 */
export function fitShade(base: string, target: string): ShadeFit {
  let best: ShadeFit = { shade: 0, resolved: base, delta: maxChannelDelta(base, target) }
  for (let i = -SHADE_SEARCH_STEPS; i <= SHADE_SEARCH_STEPS; i++) {
    const shade = Math.round((i / SHADE_SEARCH_STEPS) * 1000) / 1000
    const resolved = shadeHex(base, shade)
    const delta = maxChannelDelta(resolved, target)
    if (delta < best.delta) best = { shade, resolved, delta }
    if (delta === 0) break
  }
  return best
}

/** One derived entry: a base colour, and the members reached as shades of it. */
interface DerivedEntry {
  name: string
  value: string
  /** `rgb → fit`, for every member other than the base. */
  shades: Map<string, ShadeFit>
}

/**
 * Fit every member of `family` onto `base`'s shade axis, splitting them into the
 * ones it reaches and the ones it does not.
 */
function fitFamily(
  base: string,
  family: Family,
): { shades: Map<string, ShadeFit>; unreached: string[] } {
  const shades = new Map<string, ShadeFit>()
  const unreached: string[] = []
  for (const m of family.members) {
    if (m.rgb === base) continue
    const fit = fitShade(base, m.rgb)
    // Two conditions, and the second is what keeps the retrofit re-runnable.
    //
    // A shade replaces the stored literal, so the *next* census reads the colour
    // the shade paints, not the one it was fitted to. If that colour would be
    // filed differently — the drift dropped it under the neutral floor, or out
    // of the vivid class — the next run regroups it and the palette changes
    // underneath a command that is supposed to be reproducible. Measured on
    // `gigabytealchemy`: `#f1f5f9` fitted to slate paints `#f3f4f6`, chroma 3,
    // which is a neutral; re-running filed it there and grew the palette.
    //
    // So a fit must land within the bound *and* stay in its own family. One that
    // cannot is not a near-miss to be accepted — it is a colour the mix does not
    // actually reach, and it gets its own entry like any other.
    if (fit.delta <= SHADE_FIT_TOLERANCE && classOf(fit.resolved) === classOf(m.rgb)) shades.set(m.rgb, fit)
    else unreached.push(m.rgb)
  }
  return { shades, unreached }
}

/**
 * A family's members → one entry plus the members it can reach, and the members
 * it cannot.
 *
 * **The base is the member that reaches the most others**, because that is the
 * only choice the model actually permits. Mixing toward black or white removes
 * chroma and never adds it, so a family's pale tint cannot reproduce its vivid
 * member while the vivid member reproduces the tint easily — the relation is
 * one-directional, and picking the wrong end shatters a genuine ramp into
 * singleton entries. Reach is therefore the primary key; usage breaks ties, so
 * where several members serve equally well the entry is still the colour the
 * operator uses most and thinks of as *the* colour.
 *
 * Everything the base reaches becomes a `shade` on its references. Everything
 * else is handed back as `unreached` — those are not shades of this colour, and
 * saying so is more honest than approximating them (REQ-137 §3).
 */
function toEntry(
  family: Family,
  useCount: Map<string, number>,
): { entry: DerivedEntry; unreached: string[] } {
  const candidates = [...family.members].sort(
    (a, b) => (useCount.get(b.rgb) ?? 0) - (useCount.get(a.rgb) ?? 0) || b.l - a.l || a.rgb.localeCompare(b.rgb),
  )
  let best: { base: string; shades: Map<string, ShadeFit>; unreached: string[] } | undefined
  for (const candidate of candidates) {
    const fitted = fitFamily(candidate.rgb, family)
    // `candidates` is already in preference order, so a strict improvement is
    // the only reason to displace an earlier one — that is the tie-break.
    if (!best || fitted.shades.size > best.shades.size) best = { base: candidate.rgb, ...fitted }
    // Nothing can beat reaching everyone, and the search is O(n²) fits.
    if (best.unreached.length === 0) break
  }
  const { base, shades, unreached } = best as { base: string; shades: Map<string, ShadeFit>; unreached: string[] }
  return { entry: { name: family.name, value: base, shades }, unreached }
}

/** One RGB whose reference resolves to a different colour than the literal. */
export interface ShadeDrift {
  /** The colour as authored. */
  rgb: string
  /** The entry its reference names, and the shade of it that was fitted. */
  ref: string
  shade: number
  /** What that shade resolves to, and how far off it is. */
  resolved: string
  delta: number
}

/** The derived palette plus the literal→reference map that realises it. */
export interface PaletteAssignment {
  palette: L1Palette
  /** Every colour literal in the site, mapped to the reference replacing it. */
  refs: Map<string, L1PaletteRef>
  /**
   * Every colour a fitted shade does not reproduce exactly, worst first. The
   * conversion's honest cost, surfaced rather than assumed (REQ-137 §3) — empty
   * when every reference is byte-exact.
   */
  drift: ShadeDrift[]
}

/**
 * Derive a palette from a census, and the literal→reference map that converts
 * the site onto it. Pure — it decides, it does not write.
 *
 * Grouping runs in **rounds** (REQ-137). Each round clusters what is left by hue
 * and chroma class and fits each family onto its base's shade axis; whatever the
 * mix cannot reach goes back into the next round rather than straight into
 * singleton entries. That matters because the rejects are frequently a family of
 * their own: `gigabytealchemy`'s vivid blues are not shades of its slate-blue,
 * but `#50a2ff` *is* a shade of `#2b7fff`, and one more round finds that instead
 * of filing two unrelated entries. It terminates because a round either places
 * at least one colour or places them all as singletons.
 */
export function derivePalette(census: ColorCensus, names: FamilyNames = {}): PaletteAssignment {
  const useCount = new Map<string, number>()
  for (const c of census.colors) useCount.set(c.rgb, (useCount.get(c.rgb) ?? 0) + c.count)

  const palette: L1Palette = {}
  const refOf = new Map<string, L1PaletteRef>()
  const drift: ShadeDrift[] = []
  const usedNames = new Map<string, number>()

  let pending = [...useCount.keys()]
  while (pending.length) {
    const rejects: string[] = []
    for (const family of groupIntoFamilies(pending, names, usedNames)) {
      const { entry, unreached } = toEntry(family, useCount)
      palette[entry.name] = { value: entry.value }
      refOf.set(entry.value, { ref: entry.name })
      for (const [rgb, fit] of entry.shades) {
        // A best fit at shade 0 means the axis does not distinguish this colour
        // from the entry's own — `#fffefe` off `#ffffff`, one byte on two
        // channels. Writing `shade: 0` would be a no-op key claiming otherwise,
        // so the reference is the bare entry and the collapse is reported as
        // the drift it is.
        refOf.set(rgb, fit.shade === 0 ? { ref: entry.name } : { ref: entry.name, shade: fit.shade })
        if (fit.delta > 0) {
          drift.push({ rgb, ref: entry.name, shade: fit.shade, resolved: fit.resolved, delta: fit.delta })
        }
      }
      rejects.push(...unreached)
    }
    // Every family places its base, so a round always shrinks what is pending
    // and the loop is well-founded. If that ever stops being true the derivation
    // has a bug: fail loudly rather than spin, or silently leave the colour
    // unconverted.
    if (rejects.length >= pending.length) {
      throw new CommandError({
        code: 'INTERNAL',
        message: `Palette derivation made no progress on ${rejects.length} colour(s): ${rejects.join(', ')}.`,
      })
    }
    pending = rejects
  }

  const refs = new Map<string, L1PaletteRef>()
  for (const c of census.colors) {
    const target = refOf.get(c.rgb)
    if (!target) continue
    // Alpha rides on the *reference*, never on the entry: an entry that carried
    // alpha would make one conceptual colour occupy N entries and stop being the
    // unit of change (DOC-23 §5.4). `alpha = byte/255` round-trips exactly.
    refs.set(c.literal, c.alpha === 255 ? { ...target } : { ...target, alpha: c.alpha / 255 })
  }
  drift.sort((a, b) => b.delta - a.delta || a.rgb.localeCompare(b.rgb))
  return { palette, refs, drift }
}

/**
 * The hex a reference resolves back to — recomputed here from the *palette*
 * rather than trusted from the census, so the round-trip check below is a real
 * check and not a tautology.
 */
function resolvedHex(ref: L1PaletteRef, palette: L1Palette): string {
  const entry = palette[ref.ref]
  const base = ref.shade === undefined || ref.shade === 0 ? entry.value : shadeHex(entry.value, ref.shade)
  if (ref.alpha === undefined || ref.alpha >= 1) return base
  return `${base}${alphaByteHex(ref.alpha)}`
}

/** Replace every colour literal in `input` with its assigned reference. */
function applyRefs(input: unknown, refs: Map<string, L1PaletteRef>): unknown {
  if (typeof input === 'string') {
    const ref = refs.get(input.toLowerCase())
    return ref ? { ...ref } : input
  }
  if (Array.isArray(input)) return input.map((v) => applyRefs(v, refs))
  if (typeof input === 'object' && input !== null) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(input)) out[k] = applyRefs(v, refs)
    return out
  }
  return input
}

export interface AssignResult {
  slug: string
  palette: L1Palette
  /** Distinct colours before, palette entries after. */
  before: number
  after: number
  /** Every colour a fitted shade does not reproduce exactly, worst first. */
  drift: ShadeDrift[]
  /** Files rewritten, site-relative (`pages/<name>.json`, plus `site.json`). */
  written: string[]
}

/**
 * Retrofit a site onto a derived palette, writing `site.palette` and rewriting
 * every page's colour literals as references.
 *
 * The write is gated on two proofs, because a palette that changes a pixel by
 * more than the model's stated bound is a conversion bug rather than a cost
 * worth paying (DOC-23 §7, REQ-137 §3):
 *
 *  - every reference resolves back to within {@link SHADE_FIT_TOLERANCE} of the
 *    literal it replaced — exactly, for every reference carrying no shade — and
 *  - the resulting definition still validates.
 *
 * Either failing aborts before anything touches disk. What is *within* the bound
 * is not swallowed: it comes back on {@link AssignResult.drift} so the cost is
 * read rather than assumed.
 */
export function cmdColorsAssign(
  slug: string,
  opts: GlobalOptions = {},
  names: FamilyNames = {},
): AssignResult {
  const ctx = ctxOf(opts)
  const census = cmdColors(slug, opts)
  const { palette, refs, drift } = derivePalette(census, names)

  // Proof 1 — every reference reproduces its literal within the bound, and the
  // colour an entry *is* reproduces exactly. Alpha is held to byte-identity on
  // its own: it rides the reference untouched, so any difference there is a bug
  // rather than an accepted approximation. Recomputed from the palette about to
  // be written, so it tests the artefact rather than the intent.
  const broken = [...refs.entries()].filter(([literal, ref]) => {
    const split = splitColor(literal)
    if (!split) return true
    const resolved = splitColor(resolvedHex(ref, palette))
    if (!resolved || resolved.alpha !== split.alpha) return true
    const limit = palette[ref.ref].value === split.rgb ? 0 : SHADE_FIT_TOLERANCE
    return maxChannelDelta(resolved.rgb, split.rgb) > limit
  })
  if (broken.length) {
    throw new CommandError({
      code: 'INTERNAL',
      message:
        `Palette assignment for '${slug}' exceeds the shade bound — ${broken.length} colour(s) do not round-trip: ` +
        broken.map(([literal]) => literal).join(', '),
      hint:
        `A reference with no shade must be byte-exact, and a fitted shade must land within ${SHADE_FIT_TOLERANCE}/255 ` +
        '(REQ-137 §3). This is a conversion bug, not an accepted cost. Nothing was written.',
    })
  }

  const dir = draftDir(ctx, slug)
  const siteJsonPath = path.join(dir, 'site.json')
  const base = readJson<Record<string, unknown>>(siteJsonPath)
  const pages = readPages(ctx, slug).map((p) => ({ ...p, next: applyRefs(p.page, refs) }))
  const nextBase = { ...base, palette }

  // Proof 2 — the converted definition still validates (every reference resolves
  // against the palette we are about to write beside it).
  const result = validateSite({ ...nextBase, pages: pages.map((p) => p.next) })
  if (!result.ok) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message:
        `Palette assignment for '${slug}' produced an invalid definition:\n` +
        result.errors.map((e) => `  ${e.path}: ${e.message}`).join('\n'),
      hint: 'Nothing was written.',
    })
  }

  for (const p of pages) writeJson(p.abs, p.next)
  writeJson(siteJsonPath, nextBase)

  return {
    slug,
    palette,
    before: census.colors.length,
    after: Object.keys(palette).length,
    drift,
    written: [...pages.map((p) => `pages/${p.rel}`), 'site.json'],
  }
}

export function formatAssign(result: AssignResult): string {
  const lines = [
    `${result.slug}: ${result.before} colour literal(s) → ${result.after} palette entr${
      result.after === 1 ? 'y' : 'ies'
    }`,
  ]
  for (const [name, entry] of Object.entries(result.palette)) lines.push(`  ${name}: ${entry.value}`)
  if (result.drift.length) {
    lines.push(
      `  ${result.drift.length} colour(s) re-expressed as a shade, within ${SHADE_FIT_TOLERANCE}/255 (REQ-137 §3):`,
    )
    for (const d of result.drift) {
      lines.push(`    ${d.rgb} → ${d.ref} @ shade ${d.shade >= 0 ? '+' : ''}${d.shade} = ${d.resolved}  (Δ${d.delta})`)
    }
  }
  lines.push(`  wrote ${result.written.length} file(s):`)
  for (const rel of result.written) lines.push(`    ${rel}`)
  return lines.join('\n')
}
