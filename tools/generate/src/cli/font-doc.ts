/**
 * REQ-311 — `1c fonts doc` : [[DOC-56]]'s body, projected from the catalogue.
 *
 * [[DOC-56]] is the system-KB document that tells the assistant which faces it
 * may serve. Every fact in it is already in `fonts/catalogue.json`, so it is
 * GENERATED — the same rule `kb-projection.ts` states for the behaviour
 * catalogue and the L1 vocabulary: *a machine-readable fact is generated from
 * its source of truth, never authored.* A hand-maintained copy of two thousand
 * families would be stale the first time upstream moved, and stale silently.
 *
 * ONLY WHAT MAY BE SERVED APPEARS. The document is read as permission — "these
 * are yours, bind one with `use_font`" — so it carries OFL 1.1 and Apache 2.0
 * families and nothing else. A family the catalogue excluded for an
 * undeterminable licence never reaches this file at all; a UFL family is in the
 * catalogue and out of this document, because its modification terms are cleared
 * per family rather than in advance.
 *
 * THE HEADING STRUCTURE IS LOAD-BEARING, NOT COSMETIC. KB chunking is
 * heading-anchored, so the headings below decide chunk boundaries and therefore
 * what a retrieval returns. Two numbers bound the design:
 *
 *   - A CHUNK PER FAMILY IS NOT AFFORDABLE. ~1,900 chunks would add roughly
 *     2.9 MB of embeddings to a bundle-resident index whose entire current
 *     corpus is 548 KB. The shape here — eight groups, sub-headings of
 *     {@link GROUP_SIZE} families — yields ~92 sub-headings and ~90 KB, which is
 *     ~141 KB of embeddings.
 *
 *   - A RETRIEVAL SHOULD RETURN A SLATE, NOT A FAMILY. "Something friendly and
 *     rounded" has no single right answer, and a chunk holding one family would
 *     answer it with one. Groups of ~{@link GROUP_SIZE} give the assistant
 *     candidates to choose among.
 *
 * GROUPING SPLITS THREE SETS OUT OF CATEGORY, and each split is a retrieval
 * decision rather than a taxonomy preference. **Slab Serif** is upstream's
 * `stroke`, not its `category`, and slabs sit inside `Serif` and `Display`
 * where a slab query will not find them. **Symbols** are not typefaces anyone
 * sets text in; leaving them in `Display` puts icon fonts in the slate for
 * "a bold poster face". **Noto** is script coverage rather than style — 208
 * families that would otherwise crowd out every Latin sans in the `Sans Serif`
 * groups while answering no style question at all.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { CommandError } from './errors'
import {
  CATALOGUE_JSON_REL,
  REDISTRIBUTABLE_LICENCES,
  type Catalogue,
  type CatalogueEntry,
} from './font-catalogue'
import { inSystemKb, readDocTickets } from './kb'

/** How many families sit under one sub-heading — one chunk, one slate. */
export const GROUP_SIZE = 22

/** How many families a sub-heading names before trailing off. */
const NAMED_IN_HEADING = 5

/** The `doc` ticket this command writes is the one declaring this as its source. */
export const DOC_SOURCE_FIELD = 'source'
export const DOC_SOURCE_VALUE = 'fonts/catalogue.json'

/**
 * The groups, in the order the document lays them out.
 *
 * Fixed rather than derived from the data: the order is "most likely to be what
 * a business site needs" and that is a judgement, not a count. Deriving it from
 * family counts would put Display above Serif and Handwriting above Monospace,
 * which is a ranking of how much work typographers enjoy rather than of what a
 * plumber's homepage is asking for.
 */
export const DOC_GROUPS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'Sans Serif', label: 'Sans Serif' },
  { key: 'Serif', label: 'Serif' },
  { key: 'Slab Serif', label: 'Slab Serif' },
  { key: 'Display', label: 'Display' },
  { key: 'Handwriting', label: 'Handwriting' },
  { key: 'Monospace', label: 'Monospace' },
  { key: 'Symbols', label: 'Symbols' },
  { key: 'Noto', label: 'Noto (script coverage)' },
]

/**
 * Which group a family belongs to. First match wins, and the order IS the rule:
 * a Noto symbol font is a symbol font, and a slab that upstream files under
 * `Display` is still found by a slab query.
 */
export function groupOf(entry: CatalogueEntry): string {
  if (entry.classifications.includes('Symbols')) return 'Symbols'
  if (entry.is_noto) return 'Noto'
  if (entry.stroke === 'Slab Serif') return 'Slab Serif'
  return entry.category
}

/** `- **Roboto** — weights 100–900, italic, variable wdth/wght` */
export function entryLine(entry: CatalogueEntry): string {
  const parts: string[] = []
  if (entry.weights.length === 0) parts.push('weights unstated')
  else if (entry.weights.length === 1) parts.push(`weights ${entry.weights[0]}`)
  else parts.push(`weights ${entry.weights[0]}–${entry.weights[entry.weights.length - 1]}`)
  if (entry.italic) parts.push('italic')
  if (entry.variable && entry.axes.length > 0) {
    parts.push(`variable ${entry.axes.map((a) => a.tag).join('/')}`)
  }
  return `- **${entry.family}** — ${parts.join(', ')}`
}

const PERMISSION = `## What you may do with these

Every family listed here is licensed **OFL 1.1 or Apache 2.0**, both of which explicitly
permit bundling and redistribution as part of a larger work. That means they may be served
from any customer site, including sites the platform hosts and publishes. There is no
per-family approval step and no licence question to ask the client.

**You do not need to ask a client to supply one of these.** They are already served. Bind
one to a page with \`use_font\`, which reports the weights and axes that family actually
ships.

A family **not** in this list is not available, however well known it is. Helvetica,
Gotham, Proxima Nova, Adobe Fonts families and Fontshare families are all absent, and for
different reasons — commercial webfont licences are per-licensee and cannot be shared
across customer sites, and Adobe forbids self-hosting outright. If a client wants one of
those, they upload it themselves and attest that they hold the licence.`

const HOW_TO_READ = `## How to read an entry

\`**Family** — weights 400–700, italic, variable wght/wdth\`

- **weights** — the static weights that ship. Asking for a weight outside this range falls
  back silently, so read it before you paint \`fontWeight\`.
- **italic** — a true italic ships. Absent means any slant would be synthesised.
- **variable** — the family carries variable axes, so any value in range is available
  rather than just the named steps. \`wght\` is weight, \`wdth\` width, \`opsz\` optical size,
  \`slnt\` slant, \`ital\` italic.

Groups are ordered by usage, most-used first. That ordering is popularity, **not quality
and not a recommendation** — a display face at position 400 is the right answer whenever a
display face is what the page needs.`

function n(value: number): string {
  return value.toLocaleString('en-US')
}

/** What a projection produced, beside the body itself. */
export interface FontDocProjection {
  body: string
  /** Families carried — redistributable only. */
  families: number
  /** `label -> count`, in document order. */
  groups: Array<{ label: string; families: number; sections: number }>
}

/** Project [[DOC-56]]'s body from a catalogue document. */
export function projectFontDoc(catalogue: Catalogue): FontDocProjection {
  const servable = catalogue.families.filter((f) => REDISTRIBUTABLE_LICENCES.includes(f.licence))
  const byGroup = new Map<string, CatalogueEntry[]>()
  for (const entry of servable) {
    const key = groupOf(entry)
    const bucket = byGroup.get(key) ?? []
    bucket.push(entry)
    byGroup.set(key, bucket)
  }
  for (const bucket of byGroup.values()) bucket.sort((a, b) => a.popularity_rank - b.popularity_rank)

  const lines: string[] = []
  lines.push(
    'The fonts 1st Contact can serve, and what each one offers. **Generated from',
  )
  lines.push('`fonts/catalogue.json` — do not hand-edit.** Rebuild it with `1c fonts doc`.')
  lines.push('')
  lines.push(PERMISSION)
  lines.push('')
  lines.push(HOW_TO_READ)
  lines.push('')
  lines.push('## Counts')
  lines.push('')
  const licences = REDISTRIBUTABLE_LICENCES.map(
    (l) => `${n(servable.filter((f) => f.licence === l).length)} ${l.replace('-', ' ')}`,
  )
  lines.push(`- **${n(servable.length)}** families available (${licences.join(', ')})`)
  lines.push(`- **${n(servable.filter((f) => f.variable).length)}** carry variable axes`)
  lines.push(
    `- **${n(servable.filter((f) => f.is_noto).length)}** are Noto families, for script coverage rather than style`,
  )
  lines.push(`- Retrieved ${catalogue.retrieved}`)

  const groups: FontDocProjection['groups'] = []
  for (const group of DOC_GROUPS) {
    const entries = byGroup.get(group.key) ?? []
    if (entries.length === 0) continue
    lines.push('')
    lines.push(`## ${group.label} (${n(entries.length)})`)
    let sections = 0
    for (let start = 0; start < entries.length; start += GROUP_SIZE) {
      const slice = entries.slice(start, start + GROUP_SIZE)
      const named = slice.slice(0, NAMED_IN_HEADING).map((e) => e.family).join(', ')
      lines.push('')
      lines.push(
        `### ${group.label} — ${start + 1}–${start + slice.length} by usage: ${named}…`,
      )
      lines.push('')
      for (const entry of slice) lines.push(entryLine(entry))
      sections += 1
    }
    groups.push({ label: group.label, families: entries.length, sections })
  }

  lines.push('')
  lines.push('## Known limits of this catalogue')
  lines.push('')
  catalogue.caveats.forEach((caveat, i) => lines.push(`${i + 1}. ${caveat}`))
  lines.push('')

  return { body: lines.join('\n'), families: servable.length, groups }
}

// ── The command ──────────────────────────────────────────────────────────────

/** A `doc` ticket, as far as this command needs to see one. */
export interface DocTicketRef {
  uid: string
  id: string
  body: string | null
  fields?: Record<string, unknown> | null
}

/**
 * Which document this command writes.
 *
 * FOUND BY WHAT IT DECLARES, not by a hard-coded uid. The ticket already carries
 * `fields.source: fonts/catalogue.json` — that IS the statement "I am projected
 * from the catalogue", and reading it means the generator and the document agree
 * by construction rather than by a constant somebody has to remember to update.
 * Two documents claiming the same source is an authoring mistake with no
 * defensible resolution, so it is refused rather than guessed at.
 */
export function resolveFontDocTicket(tickets: DocTicketRef[]): DocTicketRef {
  const matches = tickets.filter(
    (t) => inSystemKb(t) && (t.fields ?? {})[DOC_SOURCE_FIELD] === DOC_SOURCE_VALUE,
  )
  if (matches.length === 0) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `No system-KB doc ticket declares ${DOC_SOURCE_FIELD}: ${DOC_SOURCE_VALUE}.`,
      hint: `Set fields.${DOC_SOURCE_FIELD} on the document this catalogue projects into.`,
    })
  }
  if (matches.length > 1) {
    throw new CommandError({
      code: 'CONFLICT',
      message: `${matches.length} doc tickets declare ${DOC_SOURCE_FIELD}: ${DOC_SOURCE_VALUE} (${matches
        .map((t) => t.id)
        .join(', ')}).`,
      hint: 'One source, one projected document. Clear the field on all but one.',
    })
  }
  return matches[0]
}

export interface FontDocOptions {
  cwd?: string
  /** Print the body instead of writing it into the document. */
  stdout?: boolean
  /**
   * The document store, as a read and a write.
   *
   * INJECTABLE FOR THE REASON THE CATALOGUE'S SOURCES ARE (`font-catalogue.ts`):
   * the defaults shell out to `xgd`, and a UAT that did the same would be
   * writing to the real ticket store to find out whether it would have written.
   * The seam is the store, not a test hook — both halves are the two operations
   * this command performs on it, and nothing else.
   */
  tickets?: DocTicketRef[]
  writeBody?: (uid: string, body: string) => void
}

export interface FontDocReport {
  /** Absent under `--stdout`, where no ticket is resolved. */
  ticket: string | null
  families: number
  groups: FontDocProjection['groups']
  bytes: number
  /** Whether the document's body differed and was rewritten. */
  changed: boolean
  body: string
}

/**
 * `1c fonts doc` — regenerate [[DOC-56]]'s body from `fonts/catalogue.json`.
 *
 * It reads the catalogue from disk rather than rebuilding it, so the two
 * commands stay separable: a refresh can be inspected and committed before the
 * document that advertises it moves. A body identical to the one already stored
 * is not written, for the reason the catalogue's own writes are skipped —
 * an unchanged document should produce no commit.
 */
export function cmdFontsDoc(opts: FontDocOptions = {}): FontDocReport {
  const cwd = opts.cwd ?? process.cwd()
  const file = path.join(cwd, CATALOGUE_JSON_REL)
  let catalogue: Catalogue
  try {
    catalogue = JSON.parse(readFileSync(file, 'utf8')) as Catalogue
  } catch (err) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `Cannot read ${CATALOGUE_JSON_REL}: ${(err as Error).message}`,
      path: CATALOGUE_JSON_REL,
      hint: 'Run `1c fonts catalogue` first — the document is projected from it.',
    })
  }
  if (!Array.isArray(catalogue.families) || catalogue.families.length === 0) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `${CATALOGUE_JSON_REL} carries no families.`,
      path: CATALOGUE_JSON_REL,
    })
  }

  const projection = projectFontDoc(catalogue)
  const base = {
    families: projection.families,
    groups: projection.groups,
    bytes: Buffer.byteLength(projection.body, 'utf8'),
    body: projection.body,
  }
  if (opts.stdout === true) return { ...base, ticket: null, changed: false }

  const ticket = resolveFontDocTicket(opts.tickets ?? (readDocTickets() as DocTicketRef[]))
  // COMPARED WITH TRAILING WHITESPACE NORMALISED, because the ticket store
  // strips it on write: a body that ends in a newline comes back without one, so
  // a byte comparison would call every run a change and commit the document on
  // every invocation — the precise failure the skip exists to prevent.
  if (sameBody(ticket.body, projection.body)) {
    return { ...base, ticket: ticket.id, changed: false }
  }
  ;(opts.writeBody ?? writeTicketBody)(ticket.uid, projection.body)
  return { ...base, ticket: ticket.id, changed: true }
}

/** The default write: the ticketing CLI, never the `.md` file behind it. */
function writeTicketBody(uid: string, body: string): void {
  execFileSync('xgd', ['ticket', 'update', uid, '--body-file', '-'], {
    input: body,
    stdio: ['pipe', 'ignore', 'pipe'],
    encoding: 'utf8',
  })
}

/** Whether a stored body already says what the projection says. */
function sameBody(stored: string | null, projected: string): boolean {
  return (stored ?? '').replace(/\s+$/, '') === projected.replace(/\s+$/, '')
}

/** Human rendering — what the document now says, and whether it moved. */
export function formatFontDocReport(report: FontDocReport): string {
  const lines: string[] = []
  const where = report.ticket === null ? '(not written)' : report.ticket
  lines.push(
    `fonts doc — ${n(report.families)} servable families, ` +
      `${report.groups.reduce((sum, g) => sum + g.sections, 0)} sub-headings, ` +
      `${n(report.bytes)} bytes → ${where}${report.changed ? '' : ' (unchanged)'}`,
  )
  for (const group of report.groups) {
    lines.push(`  ${group.label} — ${n(group.families)} in ${group.sections} section(s)`)
  }
  return lines.join('\n')
}
