/**
 * [[REQ-314]] — which families a query shows, and in what order.
 *
 * THE WHOLE MATCHING RULE, IN THE ONE PLACE THAT USES IT. The origin answers
 * `/api/fonts` with the corpus and filters nothing; this module decides what a
 * typed query means. That split is deliberate: matching in the browser is what
 * makes typing instant — no round trip between a person and the letter they just
 * pressed, and no debounce to tune — and one rule with one consumer cannot drift
 * from a second copy, because there is no second copy.
 *
 * IT IS NOT THE AUTHORITY ON WHAT MAY BE CHOSEN. `editCopySet` resolves the
 * chosen family against the same corpus on the way in and refuses an unknown one
 * with a sentence, so the worst a stale list here can do is offer a family the
 * mirror has since dropped — and the answer to pressing it is a clean refusal
 * rather than a page painting in a face that does not exist.
 */

/**
 * The six chips, and what each one means.
 *
 * FIVE COME FROM `category` AND ONE FROM `slab`, which is the shape of the
 * catalogue's own classification rather than an inconsistency: every family it
 * calls a slab serif it also calls a serif. So **Slab Serif narrows Serif rather
 * than excluding it** — the Serif chip shows Roboto Slab, because Roboto Slab is
 * a serif, and hiding it to make room for a narrower chip would be a lie about
 * what it is.
 *
 * A TABLE RATHER THAN A CHAIN OF TESTS, so the row of chips is rendered by
 * iterating it and a seventh facet is a row here rather than an edit in three
 * places.
 */
export const FONT_CATEGORIES = [
  { id: 'sans', label: 'Sans Serif', holds: (f) => f.category === 'Sans Serif' },
  { id: 'serif', label: 'Serif', holds: (f) => f.category === 'Serif' },
  { id: 'slab', label: 'Slab Serif', holds: (f) => f.slab === true },
  { id: 'display', label: 'Display', holds: (f) => f.category === 'Display' },
  { id: 'handwriting', label: 'Handwriting', holds: (f) => f.category === 'Handwriting' },
  { id: 'mono', label: 'Monospace', holds: (f) => f.category === 'Monospace' },
]

/** Case and surrounding space folded away — the form every comparison uses. */
function fold(text) {
  return String(text ?? '').trim().toLowerCase()
}

/**
 * Folded, with the spaces and hyphens taken out too.
 *
 * What makes matching SPACE-TOLERANT: `playfairdisplay`, `playfair display` and
 * `Playfair  Display` are one query, because the gap between two words of a font
 * name is not something anybody holds in their head.
 */
function squash(text) {
  return fold(text).replace(/[\s-]+/g, '')
}

/**
 * Whether `family` answers `query` — **word-prefix, either whole**.
 *
 * WORD-PREFIX AND NOT STRING-PREFIX, and that is the load-bearing choice. Plain
 * string-prefix answers `mono` with nothing at all, because no family is CALLED
 * "Mono…" — the word people type to find Roboto Mono, JetBrains Mono and Space
 * Mono is the distinguishing one, which is rarely the first. Matching any word's
 * prefix keeps the predictability that makes prefix search worth having (`Ar`
 * finds Archivo, Arimo and Arvo, and does not find Cardo) while answering the
 * common case rather than an edge one.
 *
 * THE SECOND TEST IS THE WHOLE NAME, SQUASHED, which is what lets a multi-word
 * query work at all: no single word of `Playfair Display` begins with
 * `playfair display`, and a person typing the family out in full must not be
 * told there is no such font.
 *
 * NOT FUZZY, DELIBERATELY. A picker that answers `Helvetica` with `Heebo`
 * because they share letters is a picker that cannot say *"we do not carry
 * that"* — and saying so, accurately, is what this control owes a developer who
 * knows exactly what they want.
 */
export function familyMatches(family, query) {
  const q = fold(query)
  if (q === '') return true
  if (fold(family).split(/\s+/).some((word) => word.startsWith(q))) return true
  return squash(family).startsWith(squash(query))
}

/** Whether a family passes the chips — a union, so pressing two widens. */
function passesChips(family, chips) {
  if (!chips || chips.size === 0) return true
  return FONT_CATEGORIES.some((c) => chips.has(c.id) && c.holds(family))
}

/**
 * A known commercial or system family this query is asking for, or `null`.
 *
 * WHY A PREFIX AND NOT AN EXACT MATCH. The sentence is worth saying while
 * somebody is still typing — by `helve` the question is already unambiguous, and
 * waiting for the final `a` means the control shows an empty list first and
 * explains itself afterwards. Three characters is the floor: below it a query is
 * still narrowing rather than naming.
 *
 * AN EXACT MATCH WINS over a longer prefix match, so typing `Helvetica` in full
 * answers about Helvetica rather than about Helvetica Neue.
 */
export function unservedFor(corpus, query) {
  const q = squash(query)
  if (q.length < 3) return null
  const entries = corpus?.unserved ?? []
  return (
    entries.find((entry) => squash(entry.family) === q) ??
    entries.find((entry) => squash(entry.family).startsWith(q)) ??
    null
  )
}

/**
 * What the list shows, given what has been typed and which chips are down.
 *
 * TWO STATES OF ONE LIST, NOT TWO LISTS. An empty query is the curated default —
 * the thirty, in the order they were authored, each drawn in its own face. Any
 * query replaces them with matches from the WHOLE mirror, alphabetically. There
 * is no mode to switch and no second screen to find: the curated view is simply
 * what the empty query answers.
 *
 * ALPHABETICAL WHEN THERE IS A QUERY, and popularity only when there is not.
 * Somebody typing `Arch` is looking for a specific family, and ordering their
 * results by how popular other families are pushes the one they named down the
 * list for no reason they can see.
 *
 * `total` IS THE WHOLE MATCH COUNT AND `rows` IS CAPPED. They are reported
 * separately so the control can say *"30 of 214"* — a list that silently stopped
 * at thirty reads as "that is all there is", which is exactly the wrong thing to
 * tell a developer who is looking for something.
 *
 * `previewFaces` says whether these rows may be drawn in their own faces. Only
 * the curated set carries a preview and only the curated set is a fixed, cached,
 * bounded thing to load; a query renders in the UI face because somebody typing
 * `Archivo` is already committed to Archivo, and because per-keystroke font
 * loading is the cost this whole design exists to avoid.
 */
export function browseList(corpus, { query = '', chips = null } = {}) {
  const q = fold(query)
  const curated = q === ''
  const source = curated ? (corpus?.curated ?? []) : (corpus?.families ?? [])
  const matched = source.filter(
    (family) => passesChips(family, chips) && (curated || familyMatches(family.family, q)),
  )
  const limit = corpus?.limit ?? 30
  return {
    rows: matched.slice(0, limit),
    total: matched.length,
    limit,
    curated,
    previewFaces: curated,
    unserved: curated ? null : unservedFor(corpus, query),
  }
}
