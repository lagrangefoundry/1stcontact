/**
 * [[REQ-314]] — the curated thirty, the families we cannot serve, and the corpus
 * the editor's font control browses.
 *
 * TWO LISTS ARE AUTHORED HERE AND NOTHING ELSE IS. Both are taste and
 * knowledge — which families a person should be shown first, and which famous
 * names a person will type that we will never hold — and neither is derivable
 * from the mirror, which by construction contains only what we *do* carry. The
 * third export, {@link browseCorpus}, derives everything else from
 * [[REQ-313]]'s projection and invents nothing.
 *
 * THE SHORTLIST IS AN AFFORDANCE AND NEVER A GATE. It narrows what is shown
 * FIRST to a human opening a dropdown. It does not narrow what may be bound: the
 * query box reaches the whole mirror, and the assistant — which addresses the
 * corpus through [[DOC-56]] and `use_font` — does not read this file at all.
 * Nothing in this module is imported by `use_font`, by the knowledge base, or by
 * anything on the write path.
 *
 * WHY THE CURATED LIST IS NOT "THE THIRTY MOST POPULAR". The top thirty by
 * popularity are overwhelmingly sans text faces; a list of them would let two
 * sites built from the defaults look identical and would leave a person wanting
 * a wordmark with nothing to set it in. So the list spans the range a small
 * business actually needs — text faces in both serif and sans, display faces
 * with enough weight range to carry a wordmark, slabs, two scripts and two
 * monospaces — and popularity orders what survives that choice rather than
 * making it.
 */

import {
  faceFor,
  foldFamily,
  platformFontSrc,
  type IndexedFamily,
  type PlatformFontIndex,
} from '../cli/ai/platform-fonts'

/**
 * How many families the control lists at once, curated or matched.
 *
 * ONE NUMBER FOR BOTH STATES, because they are the same list in two moods and a
 * person scrolling one has learnt how long the other is. Thirty is the length at
 * which a dropdown is still a thing you read rather than a thing you page
 * through, and it is the size of the curated list for the same reason.
 */
export const FONT_LIST_LIMIT = 30

/**
 * The curated thirty, **in the order the control shows them**.
 *
 * ORDERED BY THE CATALOGUE'S POPULARITY RANK, frozen here rather than sorted at
 * projection time. Popularity is [[REQ-311]]'s field and the assistant's index
 * has no reason to carry it — projecting it purely so this list could re-derive
 * an order it already knows would widen a generated artifact to reproduce a
 * constant.
 *
 * EVERY CHIP HAS MEMBERS, which is a property of the list and not of the filter:
 * a category chip that empties the curated view the moment it is pressed reads
 * as a broken control rather than as an empty category. Sans Serif, Serif, Slab
 * Serif, Display, Handwriting and Monospace are each represented.
 *
 * Every entry is checked against `fonts/catalogue.json` by this ticket's suite,
 * so a family upstream renames or withdraws fails the build rather than
 * quietly becoming a row that cannot be chosen.
 */
export const CURATED_FAMILIES: readonly string[] = [
  'Inter',
  'Montserrat',
  'Poppins',
  'Oswald',
  'DM Sans',
  'Playfair Display',
  'Nunito Sans',
  'Roboto Slab',
  'Work Sans',
  'Manrope',
  'Lora',
  'Plus Jakarta Sans',
  'Figtree',
  'JetBrains Mono',
  'Archivo',
  'Karla',
  'Source Sans 3',
  'Libre Baskerville',
  'Dancing Script',
  'EB Garamond',
  'IBM Plex Mono',
  'Fraunces',
  'Caveat',
  'Source Serif 4',
  'Arvo',
  'Spectral',
  'Literata',
  'Crimson Pro',
  'Gabarito',
  'Big Shoulders',
]

/** Why a famous family is not in the mirror, as the control explains it. */
export type UnservedReason = 'licensed' | 'system'

/** One family a person will ask for and we will never hold. */
export interface UnservedFamily {
  /** The name as it is typed — the spelling the match is made against. */
  family: string
  reason: UnservedReason
  /**
   * Open families that set a page the same way, **nearest first**.
   *
   * Metric-compatible where one exists (Arial→Arimo, Courier New→Cousine), and
   * merely close where none does. Filtered to what the deployment actually
   * mirrors by {@link browseCorpus}, so a suggestion is always something the
   * person can press.
   */
  instead: readonly string[]
}

/**
 * The families a person types that we cannot serve, and why.
 *
 * WHY THIS IS AUTHORED AND CANNOT BE DERIVED. The catalogue contains what we
 * carry; nothing in it knows that Helvetica exists. A developer typing
 * `Helvetica` has asked a reasonable question, and an empty result answers it
 * misleadingly — it says "no such font" where the truth is "that font is real,
 * widely used, and cannot be shared across customer sites".
 *
 * TWO REASONS, BECAUSE THEY ARE DIFFERENT FACTS. A `licensed` family is one
 * somebody sells a webfont licence for, and that licence is per-licensee — a
 * platform cannot buy one and serve it from ten thousand sites. A `system`
 * family ships with an operating system and is licensed to that system, not to
 * the web. Both end in the same place — upload it yourself if you hold a licence
 * — and they do not end there for the same reason, so they do not say the same
 * sentence.
 *
 * DELIBERATELY SHORT. This is the set a person actually types, not an index of
 * type history: every entry earns its place by being a name somebody would
 * reach for while building a small-business site.
 */
export const UNSERVED_FAMILIES: readonly UnservedFamily[] = [
  { family: 'Helvetica', reason: 'licensed', instead: ['Arimo', 'Inter'] },
  { family: 'Helvetica Neue', reason: 'licensed', instead: ['Arimo', 'Inter'] },
  { family: 'Neue Haas Grotesk', reason: 'licensed', instead: ['Inter', 'Arimo'] },
  { family: 'Akzidenz-Grotesk', reason: 'licensed', instead: ['Inter', 'Archivo'] },
  { family: 'Proxima Nova', reason: 'licensed', instead: ['Figtree', 'Open Sans'] },
  { family: 'Gotham', reason: 'licensed', instead: ['Montserrat', 'Chivo'] },
  { family: 'Futura', reason: 'licensed', instead: ['Jost', 'Josefin Sans'] },
  { family: 'Avenir', reason: 'licensed', instead: ['Nunito Sans', 'Montserrat'] },
  { family: 'Circular', reason: 'licensed', instead: ['Figtree', 'Manrope'] },
  { family: 'Graphik', reason: 'licensed', instead: ['Public Sans', 'Inter'] },
  { family: 'Brandon Grotesque', reason: 'licensed', instead: ['Josefin Sans', 'Montserrat'] },
  { family: 'Gill Sans', reason: 'licensed', instead: ['Lato', 'Karla'] },
  { family: 'DIN', reason: 'licensed', instead: ['Archivo', 'Oswald'] },
  { family: 'Univers', reason: 'licensed', instead: ['Inter', 'Archivo'] },
  { family: 'Frutiger', reason: 'licensed', instead: ['Lato', 'Source Sans 3'] },
  { family: 'Myriad Pro', reason: 'licensed', instead: ['Source Sans 3', 'Open Sans'] },
  { family: 'Minion Pro', reason: 'licensed', instead: ['Source Serif 4', 'Crimson Pro'] },
  { family: 'Garamond', reason: 'licensed', instead: ['EB Garamond', 'Cormorant Garamond'] },
  { family: 'Baskerville', reason: 'licensed', instead: ['Libre Baskerville'] },
  { family: 'Caslon', reason: 'licensed', instead: ['Libre Caslon Text'] },
  { family: 'Bodoni', reason: 'licensed', instead: ['Bodoni Moda', 'Playfair Display'] },
  { family: 'Didot', reason: 'licensed', instead: ['Playfair Display', 'Bodoni Moda'] },
  { family: 'Optima', reason: 'licensed', instead: ['Alegreya Sans', 'Lato'] },
  { family: 'Arial', reason: 'system', instead: ['Arimo', 'Inter'] },
  { family: 'Times New Roman', reason: 'system', instead: ['Tinos', 'EB Garamond'] },
  { family: 'Courier New', reason: 'system', instead: ['Cousine', 'IBM Plex Mono'] },
  { family: 'Calibri', reason: 'system', instead: ['Carlito', 'Lato'] },
  { family: 'Cambria', reason: 'system', instead: ['Caladea', 'Lora'] },
  { family: 'Georgia', reason: 'system', instead: ['Gelasio', 'Lora'] },
  { family: 'Verdana', reason: 'system', instead: ['Open Sans', 'PT Sans'] },
  { family: 'Tahoma', reason: 'system', instead: ['Open Sans', 'PT Sans'] },
  { family: 'Trebuchet MS', reason: 'system', instead: ['Lato', 'Open Sans'] },
  { family: 'Segoe UI', reason: 'system', instead: ['Inter', 'Open Sans'] },
  { family: 'SF Pro', reason: 'system', instead: ['Inter', 'Figtree'] },
  { family: 'Comic Sans MS', reason: 'system', instead: ['Comic Neue'] },
  { family: 'Papyrus', reason: 'system', instead: ['Caveat', 'Dancing Script'] },
]

// ── the corpus the control browses ───────────────────────────────────────────

/**
 * One family, reduced to what CHOOSING between them needs.
 *
 * Three fields and no fourth. Weights, axes and files are what BINDING needs and
 * the write side already holds them — sending them here would put a second copy
 * of the mirror in every browser that opens a dropdown, to answer a question the
 * dropdown does not ask.
 */
export interface BrowseFamily {
  family: string
  /** The catalogue's classification, which the chips filter on. */
  category: string
  /** Set on the 30 slab serifs; see `IndexedFamily.slab`. */
  slab?: true
}

/** A curated family, plus the face that draws its own name in the list. */
export interface CuratedFamily extends BrowseFamily {
  /**
   * The `src` of the face this row previews in — its regular, or the nearest
   * thing the family ships.
   *
   * ROOT-RELATIVE, AND COMPOSED BY `platformFontSrc` — the same one spelling of
   * `/_fonts/…` that a page's own `src` carries, that `use_font` writes and that
   * every serving surface answers for. The control resolves it against the
   * preview iframe's own root, which is where the page's faces resolve; a URL
   * built here would have to know which of the four snapshot roots the reader
   * happens to be looking through, and a second `_fonts/` literal in the browser
   * would be a fifth party to a spelling four already have to agree about.
   */
  preview: string
}

/** Everything the font control needs, in one answer. */
export interface FontBrowseCorpus {
  /** The pin the mirror was built from; `null` on a checkout that has none. */
  mirror: PlatformFontIndex['mirror']
  /** Every family the deployment serves, alphabetically. */
  families: BrowseFamily[]
  /** The curated default, in shown order. */
  curated: CuratedFamily[]
  /** The famous names we cannot serve, with only the substitutes we do. */
  unserved: UnservedFamily[]
  /** How many rows the control shows at once — {@link FONT_LIST_LIMIT}. */
  limit: number
}

/** The row a family contributes to the browse list. */
function browseFamilyOf(family: IndexedFamily): BrowseFamily {
  return {
    family: family.family,
    category: family.category,
    ...(family.slab ? { slab: true as const } : {}),
  }
}

/**
 * The file a curated row is drawn in: the regular, or the nearest face shipped.
 *
 * `faceFor` is `use_font`'s own resolver rather than a rule about filenames, for
 * the reason that module states at length — the six `Edu *` families upstream
 * renamed are the standing proof that a derived filename is wrong sometimes and
 * silent about it always. A single-weight display face has no 400 and is drawn
 * in whatever it has; a family whose files the mirror is missing entirely
 * contributes no preview and is simply not curated in this deployment.
 */
function previewPathOf(family: IndexedFamily): string | null {
  const path = (faceFor(family, 400, 'normal') ?? family.faces[0])?.path
  return path === undefined ? null : platformFontSrc(path)
}

/**
 * Project the corpus the editor's font control browses.
 *
 * DERIVED ON EVERY CALL, from the index the deployment actually ships. A
 * checkout with no mirror answers with no families and a `null` pin, which is
 * the same ordinary state [[REQ-312]] and [[REQ-313]] already report rather than
 * fail over — and it is what lets the control say *"this deployment serves no
 * fonts yet"* instead of drawing an empty list that looks like a bug.
 *
 * A CURATED NAME THE MIRROR DOES NOT HOLD IS DROPPED, not reported as an error.
 * The list is checked against the catalogue where a checkout can check it; here,
 * at serving time, a name with no bytes behind it would be a row that paints in
 * a fallback and refuses on Save, and showing nothing is the honest answer.
 *
 * SUBSTITUTES ARE FILTERED TO WHAT IS MIRRORED for the same reason. *"Try
 * Arimo"* is only useful advice if Arimo can be pressed.
 */
export function browseCorpus(idx: PlatformFontIndex): FontBrowseCorpus {
  const byName = new Map(idx.families.map((f) => [foldFamily(f.family), f]))

  const curated: CuratedFamily[] = []
  for (const name of CURATED_FAMILIES) {
    const family = byName.get(foldFamily(name))
    if (!family) continue
    const preview = previewPathOf(family)
    if (preview === null) continue
    curated.push({ ...browseFamilyOf(family), preview })
  }

  return {
    mirror: idx.mirror,
    families: idx.families
      .map(browseFamilyOf)
      .sort((a, b) => a.family.localeCompare(b.family)),
    curated,
    unserved: UNSERVED_FAMILIES.map((entry) => ({
      ...entry,
      instead: entry.instead.filter((name) => byName.has(foldFamily(name))),
    })),
    limit: FONT_LIST_LIMIT,
  }
}
