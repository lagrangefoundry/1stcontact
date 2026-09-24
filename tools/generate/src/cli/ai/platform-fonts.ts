/**
 * [[REQ-313]] — the platform font corpus, as the assistant reaches it.
 *
 * [[REQ-312]] put 1,935 families on a shared origin and wrote `fonts/platform.json`
 * to describe them. That file is the MIRROR'S record — every path, byte count and
 * pair of digests, because a publish has to know what it already sent — and it is
 * megabytes of provenance that answer no question the assistant asks. The
 * assistant asks three: is this family one we serve, what does it ship, and which
 * file draws a given weight.
 *
 * So this module carries a PROJECTION of the manifest rather than the manifest:
 * `platform-fonts.json`, written by `1c fonts index` from `fonts/platform.json`
 * joined to `fonts/catalogue.json`. The join is for the fields the mirror has no
 * reason to hold — the category a family belongs to, the weights it names, the
 * ranges its variable axes cover — which are [[DOC-56]]'s facts and therefore the
 * catalogue's.
 *
 * IMPORTED AS DATA, for the reason `l1-surface.json` is (REQ-146): `use_font`
 * runs in a Worker, where there is no `readFileSync` and no module path to
 * resolve a manifest against. A static import is a value the bundler carries, so
 * the corpus reaches workerd by the same route the code does.
 *
 * NOTHING HERE WRITES. The projection is built by `../../fonts/index-build.ts`,
 * which is Node's and stays Node's; this half is pure data and pure decisions, so
 * it is the half a Worker can hold.
 *
 * AND NOTHING HERE COMPOSES A FILENAME. Every path is one the mirror recorded
 * having written. A rule that derived `<slug>/<Family>-<Weight>.woff2` would be a
 * second opinion about what is served, and the six `Edu *` families upstream
 * renamed are the standing proof that the second opinion is wrong sometimes and
 * silent about it always.
 */

import type { PlatformLicence } from '@1stcontact/site-schema'
import { parsePlatformFontSrc, platformFontSrc } from '@1stcontact/site-schema'
import index from './platform-fonts.json'
import { CommandError } from '../errors'

/** One variable axis, with the range it actually covers. */
export interface IndexedAxis {
  tag: string
  min: number
  max: number
}

/**
 * One mirrored file, reduced to what choosing between them needs.
 *
 * `variable` marks a file that carries axes rather than a single instance — the
 * one file that draws a whole range of weights, and therefore the file a request
 * for weight 550 resolves to when the family has no static 550.
 */
export interface IndexedFace {
  /** Mirror-relative, `<slug>/<file>.woff2`. Exactly the manifest's `path`. */
  path: string
  weight?: number
  style?: 'normal' | 'italic'
  variable?: true
}

/** One family the platform serves. */
export interface IndexedFamily {
  /** The family name, spelled as `axes.fontFamily` must spell it. */
  family: string
  slug: string
  /** The catalogue's classification — `Serif`, `Sans Serif`, `Monospace`, … */
  category: string
  /**
   * A SLAB serif, which `category` cannot say ([[REQ-314]]).
   *
   * The catalogue classifies on two independent fields: `category` — the five
   * values this projection already carries — and `stroke`, where 30 families
   * declare `Slab Serif`. Every one of those 30 is categorised `Serif`, so slab
   * is a REFINEMENT of serif and not a sixth category; carrying it as a flag
   * says exactly that, where a sixth `category` value would have had to take
   * Roboto Slab out of `Serif` to make room for it.
   *
   * IT IS HERE AND NOT IN A SECOND ARTIFACT for the reason this module states
   * about the projection generally: a second generated file describing the same
   * catalogue would be free to disagree with this one. The editor's font control
   * is the only reader today; `use_font` neither reads it nor is narrowed by it.
   */
  slab?: true
  licence: PlatformLicence
  /** The static weights the family names. A variable `wght` axis widens this. */
  weights: number[]
  /** Whether a true italic ships. Absent means any slant would be synthesised. */
  italic: boolean
  axes?: IndexedAxis[]
  faces: IndexedFace[]
}

/**
 * The projection, and the pin it was taken from.
 *
 * `mirror` is `null` on a checkout whose mirror was never populated. That is an
 * ORDINARY STATE and not a misconfiguration — the bytes are a build product, a
 * fresh clone has none, and [[REQ-312]] already chose to report that plainly
 * rather than fail over it. `use_font` says the same sentence from the other end.
 */
export interface PlatformFontIndex {
  mirror: { catalogue: string; upstream: string } | null
  families: IndexedFamily[]
}

/** The corpus this build ships. Empty until `1c fonts mirror` has been run. */
export const PLATFORM_FONT_INDEX: PlatformFontIndex = index as PlatformFontIndex

// ── matching ─────────────────────────────────────────────────────────────────

/**
 * One family name, folded for comparison.
 *
 * The same rule `validate.ts` uses on a painted stack, and for the same reason:
 * CSS family matching is case-insensitive and quoting is optional, so `Lato`,
 * `'lato'` and `"LATO"` name one family. A model that types a family out of the
 * knowledge base in the wrong case has not made a mistake worth a refusal.
 */
export function foldFamily(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '').trim().toLowerCase()
}

/** The family this index holds under that name, or `null`. */
export function findFamily(idx: PlatformFontIndex, name: string): IndexedFamily | null {
  const wanted = foldFamily(name)
  return idx.families.find((f) => foldFamily(f.family) === wanted) ?? null
}

/**
 * Families whose names share a word with what was asked for, nearest first.
 *
 * WHY A REFUSAL CARRIES THEM. "Gotham is not in the mirror" is true and leaves the
 * model with nothing to do but guess again; "Gotham is not in the mirror — we do
 * serve Gothic A1, Cousine…" is a correction it can act on. The match is
 * deliberately crude — shared whole words, then shared prefix — because anything
 * cleverer is a search engine, and the search engine is the knowledge base.
 */
export function nearbyFamilies(idx: PlatformFontIndex, name: string, limit = 6): string[] {
  const wanted = foldFamily(name)
  const words = new Set(wanted.split(/\s+/).filter((w) => w.length > 2))
  const scored: { family: string; score: number }[] = []
  for (const family of idx.families) {
    const folded = foldFamily(family.family)
    let score = 0
    for (const word of folded.split(/\s+/)) if (words.has(word)) score += 10
    if (score === 0 && folded.startsWith(wanted.slice(0, 4)) && wanted.length >= 4) score = 1
    if (score > 0) scored.push({ family: family.family, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.family.localeCompare(b.family))
    .slice(0, limit)
    .map((s) => s.family)
}

/** The `wght` axis, when the family carries one. */
function weightAxis(family: IndexedFamily): IndexedAxis | undefined {
  return family.axes?.find((a) => a.tag === 'wght')
}

/** Whether this family can actually draw that weight — named step or axis range. */
export function shipsWeight(family: IndexedFamily, weight: number): boolean {
  if (family.weights.includes(weight)) return true
  const axis = weightAxis(family)
  return axis !== undefined && weight >= axis.min && weight <= axis.max
}

/** The shipped weight closest to the one asked for; ties go to the heavier. */
function nearestWeight(family: IndexedFamily, weight: number): number {
  const axis = weightAxis(family)
  if (axis) return Math.min(axis.max, Math.max(axis.min, weight))
  return [...family.weights].sort(
    (a, b) => Math.abs(a - weight) - Math.abs(b - weight) || b - a,
  )[0]
}

/**
 * The file that draws one weight in one style, or `null` when nothing does.
 *
 * An exact static face wins; a variable file covering the `wght` range answers
 * everything else. That order matters — a family shipping both a static 700 and a
 * variable file should serve the 700 someone drew rather than an instance
 * interpolated to it.
 */
export function faceFor(
  family: IndexedFamily,
  weight: number,
  style: 'normal' | 'italic',
): IndexedFace | null {
  const inStyle = family.faces.filter((f) => (f.style ?? 'normal') === style)
  const exact = inStyle.find((f) => f.weight === weight)
  if (exact) return exact
  const axis = weightAxis(family)
  const variable = inStyle.find((f) => f.variable)
  if (variable && axis && weight >= axis.min && weight <= axis.max) return variable
  return null
}

/**
 * `platformFontSrc` IS THE SCHEMA'S AND IS RE-EXPORTED, NOT RESTATED ([[REQ-312]],
 * `COMMENT-3711`). This module held its own one-line copy, which was the second
 * definition of a spelling that four programs have to agree about — and the review
 * that made the `src` root-relative would have had to find both.
 */
export { platformFontSrc }

// ── what a call resolves to ──────────────────────────────────────────────────

/** The CSS generic a category falls back to, so a painted stack cannot fail silently. */
const CATEGORY_GENERIC: Record<string, string> = {
  Serif: 'serif',
  'Sans Serif': 'sans-serif',
  Display: 'sans-serif',
  Handwriting: 'cursive',
  Monospace: 'monospace',
}

/** The stack to paint: the family, then the generic its category implies. */
export function paintableStack(family: IndexedFamily): string {
  return `${family.family}, ${CATEGORY_GENERIC[family.category] ?? 'sans-serif'}`
}

/** One face a call decided to bind. */
export interface ResolvedFace {
  family: string
  src: string
  weight: number
  style: 'normal' | 'italic'
}

/** What a resolved call binds, and what it has to say about the family. */
export interface FontResolution {
  family: IndexedFamily
  faces: ResolvedFace[]
  /** Weights asked for that the family cannot draw, in the order they were asked. */
  unavailableWeights: number[]
  /** True when italic was asked for and the family ships none. */
  italicUnavailable: boolean
  /** Weights bound in place of ones that were asked for and do not ship. */
  substitutedWeights: number[]
}

/**
 * The weights a call binds when it names none.
 *
 * A regular and a bold, because that is what setting a page needs and what every
 * other weight is reachable from by naming it. A family shipping neither — a
 * single-weight display face — binds the one thing it has rather than nothing,
 * which is the difference between a family that works and a family that validates.
 */
function defaultWeights(family: IndexedFamily): number[] {
  const wanted = [400, 700].filter((w) => shipsWeight(family, w))
  return wanted.length > 0 ? wanted : [nearestWeight(family, 400)]
}

/**
 * Turn a `use_font` call into the faces it binds, or refuse it with a sentence.
 *
 * THE REFUSALS ARE THE POINT, not an error path bolted onto a binder. A family we
 * do not carry has to come back named, because the alternative is the model
 * painting the name anyway and the page rendering in whatever the browser felt
 * like. Every refusal is a `CommandError`, which is what the Toolbox renders into
 * a correction the model can act on.
 *
 * A WEIGHT THAT DOES NOT SHIP IS NOT A REFUSAL. It is answered — the nearest
 * weight is bound, and both the substitution and the family's real weights come
 * back — because the call named a family we have, and returning nothing would
 * leave the page painting a fallback over a spelling detail.
 */
export function resolveFont(
  idx: PlatformFontIndex,
  request: { family: string; weights?: number[]; styles?: string[] },
): FontResolution {
  if (idx.families.length === 0) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: 'This deployment serves no platform fonts: the font mirror was never built.',
      hint: 'Tell the user. Nothing you send can fix it — the operator runs `1c fonts mirror` and `1c fonts publish`. A font the client uploads themselves still works.',
    })
  }

  const family = findFamily(idx, request.family)
  if (!family) {
    const nearby = nearbyFamilies(idx, request.family)
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `'${request.family.trim()}' is not a font this platform serves.`,
      hint:
        (nearby.length > 0 ? `Families we do serve with similar names: ${nearby.join(', ')}. ` : '') +
        'Ask the knowledge base for the fonts available and choose one of those, or ask the client to upload the face if they hold a licence for it. Do not paint a family that is not bound.',
    })
  }

  const styles = (request.styles ?? ['normal']).map((s) => String(s).trim().toLowerCase())
  const unknownStyle = styles.find((s) => s !== 'normal' && s !== 'italic')
  if (unknownStyle !== undefined) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${unknownStyle}' is not a font style.`,
      hint: "A style is 'normal' or 'italic'.",
    })
  }
  const wantItalic = styles.includes('italic')
  const italicUnavailable = wantItalic && !family.italic
  const bindStyles: ('normal' | 'italic')[] = [
    ...(styles.includes('normal') || !wantItalic || italicUnavailable ? (['normal'] as const) : []),
    ...(wantItalic && family.italic ? (['italic'] as const) : []),
  ]

  const asked = request.weights?.map((w) => Number(w)) ?? null
  const badWeight = asked?.find((w) => !Number.isFinite(w) || w < 1 || w > 1000)
  if (badWeight !== undefined) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `'${badWeight}' is not a font weight.`,
      hint: 'A weight is a number between 1 and 1000 — 400 is regular, 700 is bold.',
    })
  }

  const unavailableWeights = (asked ?? []).filter((w) => !shipsWeight(family, w))
  const availableWeights = (asked ?? []).filter((w) => shipsWeight(family, w))
  const substitutedWeights =
    asked !== null && availableWeights.length === 0
      ? [...new Set(asked.map((w) => nearestWeight(family, w)))]
      : []
  const weights =
    asked === null
      ? defaultWeights(family)
      : availableWeights.length > 0
        ? availableWeights
        : substitutedWeights

  const faces: ResolvedFace[] = []
  for (const style of bindStyles) {
    for (const weight of weights) {
      const face = faceFor(family, weight, style)
      // A weight this index says ships and no file draws is a mirror that was
      // populated from a catalogue it no longer matches. Skipping is right —
      // the other faces still bind — and `1c fonts index` is what reports it.
      if (!face) continue
      faces.push({ family: family.family, src: platformFontSrc(face.path), weight, style })
    }
  }

  if (faces.length === 0) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: `The mirror holds no file for '${family.family}' in the weights it says it ships.`,
      hint: 'Tell the user, and choose a different family. The operator re-runs `1c fonts mirror`.',
    })
  }

  return { family, faces, unavailableWeights, italicUnavailable, substitutedWeights }
}

// ── merging into the page's resource table ───────────────────────────────────

/** One `resources.fonts[]` entry, as the document holds it. */
export interface FontFaceEntry {
  family: string
  src: string
  weight?: number
  style?: 'normal' | 'italic'
}

/** What merging a resolved binding into a page's existing faces produced. */
export interface FontMerge {
  fonts: FontFaceEntry[]
  /** Whether the table actually moved. `false` is the idempotent second call. */
  changed: boolean
  /**
   * The page already serves this family from its own assets.
   *
   * REPORTED RATHER THAN RESOLVED, because the two candidates are different bytes
   * under different obligations — ours, cleared by construction, and the client's,
   * on their attestation. Choosing between them is not a merge rule.
   */
  conflict: boolean
}

/**
 * Add the resolved faces to a page's table, changing nothing that is already right.
 *
 * KEYED ON FAMILY, WEIGHT AND STYLE, because that triple is what a browser
 * selects a face by: two entries sharing it are one face declared twice, and the
 * second is dead weight in every rendered stylesheet. Binding a family a page
 * already serves therefore adds nothing and reports no change, which is what makes
 * the call safe to make when you are not sure.
 *
 * A PLATFORM ENTRY WHOSE PATH HAS MOVED IS REPAIRED. The mirror renames a file
 * when upstream's bytes change, so an old path is a face that 404s; both sides of
 * that swap are the platform's bytes for the same family, weight and style, so
 * pointing at the current one is a repair rather than a substitution.
 */
export function mergeFontFaces(
  existing: readonly FontFaceEntry[],
  resolved: readonly ResolvedFace[],
): FontMerge {
  const family = resolved[0]?.family ?? ''
  const wanted = foldFamily(family)
  const mine = existing.filter((e) => foldFamily(e.family) === wanted)
  if (mine.some((e) => parsePlatformFontSrc(e.src) === null)) {
    return { fonts: [...existing], changed: false, conflict: true }
  }

  const key = (e: { weight?: number; style?: string }): string =>
    `${e.weight ?? 400}/${e.style ?? 'normal'}`
  const fonts = [...existing]
  let changed = false
  for (const face of resolved) {
    const at = fonts.findIndex((e) => foldFamily(e.family) === wanted && key(e) === key(face))
    const entry: FontFaceEntry = {
      family: face.family,
      src: face.src,
      weight: face.weight,
      style: face.style,
    }
    if (at < 0) {
      fonts.push(entry)
      changed = true
    } else if (fonts[at].src !== face.src) {
      fonts[at] = entry
      changed = true
    }
  }
  return { fonts, changed, conflict: false }
}
