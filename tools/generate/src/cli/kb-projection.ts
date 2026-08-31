/**
 * The PROJECTED REFERENCE — the product's own facts, generated (REQ-165, DOC-39 §3.2).
 *
 * DOC-39 §3.1 keeps architecture documents out of the system KB, and it is right
 * to: they argue engineering decisions to ourselves, rejected alternatives and
 * all, and an assistant advising a client is the wrong reader for them. But the
 * exclusion leaves a hole the moment it takes effect — the corpus becomes a
 * shelf of consultation material with **nothing in it that says what the product
 * does**. An assistant that can discuss restraint and hierarchy and cannot say
 * what a module is has been made articulate and useless.
 *
 * The two obvious repairs are both wrong. Tagging the architecture documents in
 * breaks the exclusivity §3.1 exists for. Writing system-KB counterparts creates
 * two sources for one fact, and the second one starts drifting the day it is
 * written. So this file takes the third option, which is already precedented
 * twice here — the tool manual is projected from `l1-surface.json` so priming
 * cannot fall behind the operations it describes (REQ-126), and capture mapping
 * runs against the live module registry rather than a written catalogue
 * (DOC-13 §8):
 *
 *   **A machine-readable fact is generated from its source of truth, never
 *   authored.** A projected document is not a document anybody maintains, and it
 *   cannot be stale — it is rebuilt from the source on every build.
 *
 * THREE SOURCES, THREE PROJECTIONS, and each reads exactly one source:
 *
 *   the behavior catalogue (`CATALOG`)  -> what components exist, and how each is configured
 *   the L1 schemas + envelope           -> the layout vocabulary and its limits
 *   `ai/l1-surface.json`                -> what the assistant may change, and how
 *
 * NOTHING HERE READS A DOCUMENT, and that is the invariant that keeps the rule
 * true. The moment a projection copies a sentence out of an authored document
 * there are two sources again; the moment it invents one there is a fact with no
 * source at all. Every sentence below is either structural (rendered from the
 * shape of the source) or lifted verbatim from prose the source itself carries —
 * a declaration's `description`, a schema's doc comment.
 *
 * ONE CATALOGUE PER SOURCE, NOT ONE DOCUMENT PER MODULE. The ticket leaves the
 * granularity open and chunk retrieval decides it: a chunk is only useful if it
 * is coherent on its own, and with two behaviors in the catalogue a per-module
 * split produces documents too small to cluster and a map territory per module.
 * The catalogue stays one document until the modules are numerous enough that
 * one of them no longer fits a chunk.
 *
 * WHY THIS IS NOT `renderManual`. The shared AI library's Toolbox already projects
 * `l1-surface.json` into a manual, and this deliberately does not call it: a
 * manual is projected THROUGH A GRANT — it describes the operations one role was
 * given, in the second person, as instructions. A reference describes the whole
 * declared surface to a reader who is asking what the product can do. Same
 * source, two renderings, and the rule DOC-39 §3.2 states is one source per
 * fact — not one rendering.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { repoRoot } from './webui'
import { CATALOG } from '@1stcontact/framework/modules'
import type {
  BehaviorConfigSpec,
  BehaviorControlSpec,
  BehaviorMeta,
  BehaviorSlotSpec,
} from '@1stcontact/framework/modules'
import * as SiteSchema from '@1stcontact/site-schema'
import l1Surface from './ai/l1-surface.json'

/**
 * A projected document, before it is given a corpus file's frontmatter.
 *
 * `id` is the filename stem and therefore the document's identity in the index —
 * see `kb.ts`'s note on why the filename is never the title. The `REF-` prefix
 * is what makes the two corpus producers separable: no ticket export can collide
 * with a projection, and each sweeps only its own namespace, so neither can
 * delete the other's output whatever order they run in.
 */
export interface ProjectedDoc {
  id: string
  title: string
  /** Where the facts came from, named in the document so a reader can go there. */
  source: string
  /** The markdown body, without frontmatter. */
  body: string
}

/** The namespace every projected document's id sits in. */
export const PROJECTED_PREFIX = 'REF-'

/** Whether a corpus filename is a projection rather than an exported ticket. */
export function isProjected(filename: string): boolean {
  return filename.startsWith(PROJECTED_PREFIX) && filename.endsWith('.md')
}

// ── prose the source already carries ─────────────────────────────────────────

/**
 * The doc comments in a TypeScript source, SCOPED TO THE DECLARATION they sit in.
 *
 * The L1 schemas are Zod, and Zod carries names, value sets and bounds but no
 * meanings — nothing in `schema.ts` calls `.describe()`. The meanings are all
 * there, though, in the comment above each field, and that comment IS the source
 * of truth for what the field means: it is what a maintainer reads and what they
 * change when the field changes. Harvesting it is projection in exactly the sense
 * this file is about, not a second copy of anything.
 *
 * SCOPING IS THE WHOLE MECHANISM, and a flat `field -> prose` map is the trap it
 * exists to avoid. `color` is documented once, on the pointer-accent shape, and
 * appears undocumented on a dozen others; a flat map would put "the colour the
 * texture is redrawn in" against a border's colour and read as authoritative.
 * Keying on the declaration a field was documented IN means prose can only ever
 * describe the shape it was written for.
 *
 * Spreads are followed, because a shape composed by `...surfaceAxesShape` really
 * does own those fields and their comments really do describe them — that is what
 * the spread means. Following it is not a heuristic; refusing to would silently
 * drop the documentation of every field the substrate shares between kinds, which
 * is most of them.
 *
 * The harvest DEGRADES rather than fails. A moved file, a reformatted comment or a
 * renamed field costs prose and never correctness: everything structural comes
 * from the schema objects themselves, and this only ever adds a sentence.
 */
export interface Declared {
  /** Field name → its definition, for fields documented in this declaration. */
  fields: Map<string, string>
  /** Declarations spread into this one, whose fields it therefore also owns. */
  spreads: string[]
}

export function harvestDeclarations(source: string): Map<string, Declared> {
  const declarations = new Map<string, Declared>()
  for (const [name, region] of regions(source)) {
    const fields = new Map<string, string>()
    const ambiguous = new Set<string>()
    for (const match of region.matchAll(DOC_COMMENT)) {
      const prose = definition(match[1])
      if (!prose) continue
      const key = match[2]
      const seen = fields.get(key)
      if (seen === undefined) fields.set(key, prose)
      else if (seen !== prose) ambiguous.add(key)
    }
    for (const key of ambiguous) fields.delete(key)
    const spreads = [...region.matchAll(/\.\.\.([A-Za-z_][A-Za-z0-9_]*)\s*[,}]/g)].map((m) => m[1])
    declarations.set(name, { fields, spreads })
  }
  return declarations
}

/**
 * The source split at its top-level `const` declarations.
 *
 * Crude on purpose. A real parse would be more precise and would put a
 * TypeScript dependency on the export path for a document that degrades to
 * silence when it is wrong; the boundaries this needs are all at column zero, and
 * a comment that lands in the wrong region can only ever fail to be found.
 */
function regions(source: string): Map<string, string> {
  const found = new Map<string, string>()
  const boundary = /^(?:export )?const ([A-Za-z_][A-Za-z0-9_]*)\b/gm
  const marks = [...source.matchAll(boundary)]
  for (let i = 0; i < marks.length; i += 1) {
    const name = marks[i][1]
    const from = marks[i].index ?? 0
    const to = i + 1 < marks.length ? (marks[i + 1].index ?? source.length) : source.length
    if (!found.has(name)) found.set(name, source.slice(from, to))
  }
  return found
}

/** One field's definition, following spreads, or `undefined`. */
export function definitionOf(
  declarations: Map<string, Declared>,
  declaration: string | undefined,
  field: string,
): string | undefined {
  if (!declaration) return undefined
  const seen = new Set<string>()
  const queue = [declaration]
  while (queue.length > 0) {
    const name = queue.shift()!
    if (seen.has(name)) continue
    seen.add(name)
    const declared = declarations.get(name)
    if (!declared) continue
    const prose = declared.fields.get(field)
    if (prose) return prose
    queue.push(...declared.spreads)
  }
  return undefined
}

/**
 * A doc comment sitting IMMEDIATELY above a field, and nothing else.
 *
 * Two details do real work. The body is `(?:[^*]|\*(?!\/))*` rather than
 * `[\s\S]*?`, because a lazy body BACKTRACKS: it will happily swallow the code
 * between one comment and a later one to find a field it can attach to, which
 * files a shape's comment against an unrelated field three declarations down. And
 * the gap before the field is `\n?[ \t]*` — at most one newline — so a blank line
 * breaks the association, which is what a maintainer means by leaving one.
 */
const DOC_COMMENT = /\/\*\*((?:[^*]|\*(?!\/))*)\*\/\n?[ \t]*(?:readonly[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)[ \t]*\??[ \t]*:/g

/**
 * The comment's DEFINITION — its first sentence — as one line of markdown.
 *
 * The first sentence says what the field is; everything after it says why it is
 * that way, and *why* is precisely what DOC-39 §3.1 keeps out of this corpus. The
 * split is not a length heuristic dressed up: an axis comment reads "Per-width
 * absolute placement." and then three sentences about which ticket hoisted it and
 * what drifted before it did. The first belongs in a reference; the rest is the
 * engineering record, written for a different reader.
 *
 * A leading ticket reference is dropped for the same reason. One left ANYWHERE
 * ELSE in the sentence takes the whole comment down with it — a definition that
 * cannot be stated without pointing at a ticket is not a definition, and a
 * reference document that sends a client-facing assistant to read REQ-105 is
 * worse than one that says nothing.
 */
function definition(block: string): string {
  const text = block
    .split('\n')
    .map((line) => line.replace(/^[ \t]*\*[ \t]?/, ''))
    .join(' ')
    .replace(/\{@link\s+([^}]+)\}/g, (_m, target: string) => `\`${target.trim()}\``)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:REQ|BUG|DOC|EPIC)-\d+[a-z]?\s*[—–-]\s*/i, '')
  if (!text) return ''
  const stop = text.search(/[.!?](?:\s|$)/)
  const sentence = (stop === -1 ? text : text.slice(0, stop + 1)).trim()
  if (!sentence || sentence.length > PROSE_BUDGET) return ''
  if (/\b(?:REQ|BUG|DOC|EPIC)-\d+/i.test(sentence)) return ''
  // Sentence case, because stripping the ticket prefix often leaves the sentence
  // starting mid-clause ("REQ-105 — the node's own extent" becomes "the node's
  // own extent"), and a reference entry that starts lowercase reads as a fragment.
  const capitalised = sentence[0].toUpperCase() + sentence.slice(1)
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`
}

/** The longest a single definition may be before it stops being one. */
const PROSE_BUDGET = 240

/** A source file under the repository, or `''` when it has moved. */
function readSource(relative: string): string {
  try {
    return readFileSync(path.join(repoRoot(), relative), 'utf8')
  } catch {
    return ''
  }
}

const L1_SCHEMA_SOURCE = 'packages/site-schema/src/l1/schema.ts'
const L1_VALIDATE_SOURCE = 'packages/site-schema/src/l1/validate.ts'

// ── projection 1: the behavior catalogue ─────────────────────────────────────

/**
 * What behavior modules exist and how each is configured, from `CATALOG`.
 *
 * The catalogue is contracts-only by construction (`modules/catalog.ts` exists
 * to keep the render binding out of it), so this reads the same data the
 * structured-edit surface validates instances against — there is no second
 * inventory to fall behind.
 */
export function projectBehaviorCatalogue(): ProjectedDoc {
  const lines: string[] = []
  lines.push(
    'Every component the framework ships, with the settings it takes and the parts of',
    'a page it fills. A site uses a component by naming it and its version; the',
    'framework supplies the behaviour and the page supplies everything that is seen.',
    '',
    `The catalogue holds ${CATALOG.length} component${CATALOG.length === 1 ? '' : 's'}.`,
    '',
  )
  for (const meta of CATALOG) lines.push(...behaviorSection(meta))
  return {
    id: `${PROJECTED_PREFIX}behaviors`,
    title: 'The components a site can use',
    source: 'the framework behavior catalogue',
    body: lines.join('\n').trimEnd() + '\n',
  }
}

/**
 * One component, as ONE section with no sub-headings.
 *
 * The shape is chosen by RETRIEVAL, not by tidiness. The chunker splits a
 * document at its headings, so a `### Settings` sub-heading puts a component's
 * settings in a chunk that does not contain the component's name — and
 * "what settings does a carousel take" then cannot reach the list that answers
 * it. Keeping the whole component under its own `##` means every fact about it
 * arrives in a passage that says which component it is about.
 */
function behaviorSection(meta: BehaviorMeta): string[] {
  const lines = [`## ${meta.id}`, '', `The \`${meta.id}\` component, version ${meta.version}.`, '']

  const config = Object.entries(meta.config)
  lines.push(config.length === 0 ? `\`${meta.id}\` takes no settings.` : `Settings \`${meta.id}\` takes:`, '')
  for (const [name, spec] of config) lines.push(`- ${configEntry(name, spec)}`)
  if (config.length > 0) lines.push('')

  const slots = Object.entries(meta.slots)
  lines.push(
    slots.length === 0
      ? `\`${meta.id}\` holds no part of the page.`
      : `Parts of the page \`${meta.id}\` holds:`,
    '',
  )
  for (const [name, spec] of slots) lines.push(`- ${slotEntry(name, spec)}`)
  if (slots.length > 0) lines.push('')

  const controls = Object.entries(meta.controls ?? {})
  if (controls.length > 0) {
    lines.push(`Elements \`${meta.id}\` supplies for the page to style:`, '')
    for (const [name, spec] of controls) lines.push(`- ${controlEntry(name, spec)}`)
    lines.push('')
  }

  lines.push(
    `\`${meta.id}\` is obliged to satisfy: ` +
      (meta.conformance.obligations.map((o) => `\`${o}\``).join(', ') || 'nothing declared') +
      '.',
    '',
  )
  const except = Object.entries(meta.conformance.except ?? {})
  if (except.length > 0) {
    lines.push('Declared exceptions:', '')
    for (const [ac, reason] of except) lines.push(`- \`${ac}\` — ${reason}`)
    lines.push('')
  }
  return lines
}

/** One config field, rendered from its contract and nothing else. */
function configEntry(name: string, spec: BehaviorConfigSpec, depth = 0): string {
  const parts: string[] = [`\`${name}\` — ${spec.type}`]
  if (spec.values) parts.push(`one of ${spec.values.map((v) => `\`${v}\``).join(', ')}`)
  if (spec.min !== undefined || spec.max !== undefined) parts.push(range(spec.min, spec.max))
  if (spec.minItems !== undefined || spec.maxItems !== undefined) {
    parts.push(`${range(spec.minItems, spec.maxItems)} item(s)`)
  }
  if (spec.default !== undefined) parts.push(`default \`${String(spec.default)}\``)
  parts.push(spec.required ? 'required' : 'optional')
  const head = parts.join('; ')
  if (!spec.itemSchema || depth > 2) return head
  const indent = '  '.repeat(depth + 1)
  const items = Object.entries(spec.itemSchema).map(
    (entry) => `\n${indent}- ${configEntry(entry[0], entry[1], depth + 1)}`,
  )
  return `${head}. Each item:${items.join('')}`
}

function slotEntry(name: string, spec: BehaviorSlotSpec): string {
  const parts: string[] = [`\`${name}\``]
  parts.push(spec.repeated ? 'one per item' : 'one')
  if (spec.minItems !== undefined || spec.maxItems !== undefined) {
    parts.push(`${range(spec.minItems, spec.maxItems)} item(s)`)
  }
  parts.push(spec.required ? 'required' : 'optional')
  return parts.join('; ')
}

function controlEntry(name: string, spec: BehaviorControlSpec): string {
  const parts: string[] = [`\`${name}\` — an HTML \`${spec.element}\` element`]
  if (spec.perItemOf) parts.push(`one per item of \`${spec.perItemOf}\``)
  if (spec.perSubtreeOf) parts.push(`one per item of \`${spec.perSubtreeOf}\``)
  if (spec.invariant) parts.push('painted by the component itself, never by the page')
  else parts.push(spec.required ? 'the page must supply its appearance' : 'optional')
  return parts.join('; ')
}

function range(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${min}–${max}`
  if (min !== undefined) return `at least ${min}`
  if (max !== undefined) return `at most ${max}`
  return ''
}

// ── projection 2: the L1 layout vocabulary ───────────────────────────────────

/**
 * Every schema in `@1stcontact/site-schema` that has a name, keyed by IDENTITY.
 *
 * A Zod schema is a value, and the same value is reachable from several places —
 * `surfaceGradient` in the surface group IS `l1GradientSchema`. Keying the map on
 * the object means a reference is recognised as one wherever it appears, so a
 * shape is described once and pointed at everywhere else. Rendering it inline at
 * each use would repeat the gradient contract a dozen times and lose the fact
 * that they are the same thing.
 *
 * The export name is the identity the codebase itself uses, so it is what the
 * document says. `l1LinearGradientSchema` reads as `linear gradient`.
 */
function namedSchemas(): Map<unknown, string> {
  const named = new Map<unknown, string>()
  for (const [key, value] of Object.entries(SiteSchema as Record<string, unknown>)) {
    if (!key.startsWith('l1') || !key.endsWith('Schema')) continue
    if (value === null || typeof value !== 'object') continue
    if (!named.has(value)) named.set(value, key)
  }
  return named
}

/** `l1LinearGradientSchema` → `linear gradient`. */
function readableName(exportName: string): string {
  return exportName
    .replace(/^l1/, '')
    .replace(/Schema$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
}

/** Zod's internal definition of a schema, which is where introspection lives. */
type ZodLike = { def?: Record<string, unknown> } & Record<string, unknown>

function def(schema: unknown): Record<string, unknown> {
  return ((schema as ZodLike | null)?.def ?? {}) as Record<string, unknown>
}

/** Unwrap the wrappers that add no vocabulary — optional, default, lazy, readonly. */
function unwrap(schema: unknown, named: Map<unknown, string>): unknown {
  let current = schema
  for (let hop = 0; hop < 12; hop += 1) {
    if (named.has(current)) return current
    const d = def(current)
    const kind = d.type
    if (kind === 'optional' || kind === 'nullable' || kind === 'readonly' || kind === 'default') {
      current = d.innerType
    } else if (kind === 'lazy' && typeof d.getter === 'function') {
      current = (d.getter as () => unknown)()
    } else if (kind === 'pipe') {
      current = d.in
    } else return current
  }
  return current
}

/** The numeric bounds a schema's checks declare, as `1–400` or `at least 0`. */
function numericRange(schema: unknown): string {
  const checks = (def(schema).checks ?? []) as Array<Record<string, unknown>>
  let min: number | undefined
  let max: number | undefined
  for (const check of checks) {
    const inner = ((check as { _zod?: { def?: Record<string, unknown> } })._zod?.def ??
      def(check)) as Record<string, unknown>
    if (inner.check === 'greater_than' && typeof inner.value === 'number') min = inner.value
    if (inner.check === 'less_than' && typeof inner.value === 'number') max = inner.value
  }
  return range(min, max)
}

/**
 * One field's type, in words, referring to named shapes rather than expanding them.
 *
 * `depth` exists only to stop an unnamed self-referential shape; every shape that
 * recurses in practice (`box`, `container`) is named, so the guard never fires on
 * the real schema and is there so that a future one cannot hang a build.
 */
function typeWords(schema: unknown, named: Map<unknown, string>, depth = 0): string {
  const inner = unwrap(schema, named)
  const name = named.get(inner)
  if (name && depth > 0) return readableName(name)
  const d = def(inner)
  switch (d.type) {
    case 'enum': {
      const values = Object.keys((d.entries ?? {}) as Record<string, unknown>)
      return values.map((v) => `\`${v}\``).join(' | ')
    }
    case 'literal': {
      const values = (d.values ?? []) as unknown[]
      return values.map((v) => `\`${String(v)}\``).join(' | ')
    }
    case 'string':
      return 'text'
    case 'boolean':
      return 'true / false'
    case 'number': {
      const bounds = numericRange(inner)
      return bounds ? `number, ${bounds}` : 'number'
    }
    case 'array':
      return `a list of ${depth > 3 ? 'values' : typeWords(d.element, named, depth + 1)}`
    case 'union': {
      const options = (d.options ?? []) as unknown[]
      return depth > 3
        ? 'one of several shapes'
        : options.map((o) => typeWords(o, named, depth + 1)).join(' or ')
    }
    case 'record':
      return `named ${depth > 3 ? 'values' : typeWords(d.valueType, named, depth + 1)}`
    case 'object':
      return 'a group of fields'
    default:
      return String(d.type ?? 'value')
  }
}

/** Whether a field may be omitted. */
function isOptional(schema: unknown): boolean {
  const kind = def(schema).type
  return kind === 'optional' || kind === 'default'
}

/** The object shape a schema resolves to, or `null` when it is not an object. */
function objectShape(
  schema: unknown,
  named: Map<unknown, string>,
): Record<string, unknown> | null {
  const inner = unwrap(schema, named)
  const d = def(inner)
  if (d.type !== 'object') return null
  return (d.shape ?? {}) as Record<string, unknown>
}

/** One field line: name, type, whether it may be omitted, and what it means. */
function fieldLine(
  name: string,
  schema: unknown,
  named: Map<unknown, string>,
  declarations: Map<string, Declared>,
  declaration: string | undefined,
): string {
  const parts = [`\`${name}\` — ${typeWords(schema, named, 1)}`]
  if (!isOptional(schema)) parts.push('required')
  const meaning = definitionOf(declarations, declaration, name)
  return `- ${parts.join('; ')}${meaning ? `. ${meaning}` : ''}`
}

/**
 * The layout vocabulary: what an element can be, and what each element accepts.
 *
 * Projected from the Zod schemas themselves, so the value sets and bounds a
 * reader is told about are literally the ones the validator enforces — the
 * failure this design exists to prevent is a document that lists a value the
 * schema stopped accepting three releases ago.
 *
 * The walk is CLOSED OVER WHAT THE NODE UNION REACHES. Starting at the element
 * union and following every named shape a field refers to yields exactly the
 * vocabulary a page can contain; a shape that nothing reachable refers to is not
 * part of it, and listing every export instead would put dead vocabulary in front
 * of the assistant.
 */
export function projectL1Vocabulary(): ProjectedDoc {
  const named = namedSchemas()
  const declarations = harvestDeclarations(readSource(L1_SCHEMA_SOURCE))

  const kinds = elementKinds(named)
  const queue: unknown[] = []
  const lines: string[] = []

  lines.push(
    'A page is a tree of typed elements. Everything that is seen — the words, the',
    'pictures, the boxes that hold them, and every aspect of how they look — is one of',
    'the elements below, carrying the fields below. There is no other vocabulary: an',
    'element that is not well-formed in it is refused whole, and nothing outside it',
    '(markup, a stylesheet, a script) can be expressed at all.',
    '',
    '## The kinds of element',
    '',
  )
  for (const { kind, declaration, shape } of kinds) {
    lines.push(`### \`${kind}\``, '')
    for (const [field, schema] of Object.entries(shape)) {
      if (field === 'kind') continue
      lines.push(fieldLine(field, schema, named, declarations, declaration))
      queue.push(schema)
    }
    lines.push('')
  }

  const shapes = reachableShapes(queue, named)
  if (shapes.length > 0) {
    lines.push(
      '## The shapes those fields take',
      '',
      'Each of these is one shape, referred to by name wherever it is used.',
      '',
    )
    for (const { name, shape } of shapes) {
      lines.push(`### ${readableName(name)}`, '')
      for (const [field, schema] of Object.entries(shape)) {
        lines.push(fieldLine(field, schema, named, declarations, name))
      }
      lines.push('')
    }
  }

  lines.push(...envelopeSection())

  return {
    id: `${PROJECTED_PREFIX}l1`,
    title: 'The vocabulary a page is written in',
    source: 'the L1 element schemas and their validation envelope',
    body: lines.join('\n').trimEnd() + '\n',
  }
}

/**
 * Each element kind in the node union: what it is called, the shape it accepts,
 * and the declaration it was written in — which is what scopes its field prose to
 * the fields it actually declares (see {@link harvestDeclarations}).
 */
function elementKinds(named: Map<unknown, string>): Array<{
  kind: string
  declaration: string | undefined
  shape: Record<string, unknown>
}> {
  const union = unwrap(SiteSchema.l1NodeSchema, new Map())
  const options = (def(union).options ?? []) as unknown[]
  const kinds: Array<{ kind: string; declaration: string | undefined; shape: Record<string, unknown> }> = []
  for (const option of options) {
    const shape = objectShape(option, new Map())
    if (!shape) continue
    const literal = (def(unwrap(shape.kind, new Map())).values ?? []) as unknown[]
    const kind = literal.length ? String(literal[0]) : '(unnamed)'
    kinds.push({ kind, declaration: named.get(option), shape })
  }
  // Named order rather than union order: `named` is only used for field types,
  // and the union's own order is the one the schema declares, which is the one a
  // maintainer chose. Nothing is sorted, deliberately.
  return kinds
}

/**
 * Every named shape reachable from the element kinds, breadth-first from the
 * fields they declare. Terminates because `named` is finite and each shape is
 * expanded once.
 */
function reachableShapes(
  seeds: unknown[],
  named: Map<unknown, string>,
): Array<{ name: string; shape: Record<string, unknown> }> {
  const seen = new Set<string>()
  const found: Array<{ name: string; shape: Record<string, unknown> }> = []
  const queue = [...seeds]
  const elementNames = new Set(
    ((def(unwrap(SiteSchema.l1NodeSchema, new Map())).options ?? []) as unknown[])
      .map((o) => named.get(o))
      .filter((n): n is string => typeof n === 'string'),
  )
  while (queue.length > 0) {
    const schema = queue.shift()
    const inner = unwrap(schema, named)
    const name = named.get(inner)
    const d = def(inner)
    if (d.type === 'union') {
      for (const option of (d.options ?? []) as unknown[]) queue.push(option)
    }
    if (d.type === 'array') queue.push(d.element)
    if (d.type === 'record') queue.push(d.valueType)
    if (!name || seen.has(name)) continue
    seen.add(name)
    // The element kinds have their own section above; describing them a second
    // time here would be the one duplication this whole file exists to avoid.
    const shape = elementNames.has(name) ? null : objectShape(inner, named)
    if (!shape) continue
    found.push({ name, shape })
    for (const field of Object.values(shape)) queue.push(field)
  }
  found.sort((a, b) => readableName(a.name).localeCompare(readableName(b.name)))
  return found
}

/**
 * The validation envelope: the limits every page is held to, whoever wrote it.
 *
 * Projected from `L1_ENVELOPE` because it is the thing the validator actually
 * reads. These are safety bounds rather than taste — a sub-pixel pattern period
 * hangs a compositor, a million nodes hangs a render — so an assistant that knows
 * them asks for something achievable instead of discovering the ceiling by being
 * refused.
 */
function envelopeSection(): string[] {
  const declarations = harvestDeclarations(readSource(L1_VALIDATE_SOURCE))
  const lines = [
    '## The limits every page is held to',
    '',
    'A page outside these is refused whole; nothing is clamped silently.',
    '',
  ]
  for (const [key, value] of Object.entries(SiteSchema.L1_ENVELOPE)) {
    const bound =
      value !== null && typeof value === 'object'
        ? range(
            (value as { min?: number }).min,
            (value as { max?: number }).max,
          ) || JSON.stringify(value)
        : String(value)
    const meaning = definitionOf(declarations, 'L1_ENVELOPE', key)
    lines.push(`- \`${key}\` — ${bound}${meaning ? `. ${meaning}` : ''}`)
  }
  lines.push('')
  return lines
}

// ── projection 3: the control surface ────────────────────────────────────────

/** The declaration's own shape, read as data rather than trusted as a type. */
interface SurfaceDeclaration {
  title?: string
  surface_version?: number
  overview?: string
  param_types?: Record<string, { base?: string; description?: string }>
  shapes?: Record<string, Record<string, string>>
  errors?: Record<string, { message?: string }>
  operations?: Array<{
    op: string
    tool?: string
    effect?: string
    summary?: string
    description?: string
    params?: Record<string, { type?: string; required?: boolean; description?: string }>
    returns?: { shape?: string; provenance?: string }
    errors?: string[]
  }>
  groups?: Array<{
    group: string
    effect?: string
    title?: string
    description?: string
    operations?: string[]
  }>
  sequences?: Array<{ name: string; steps?: string[]; note?: string }>
  absences?: Array<{ name: string; note?: string }>
}

/**
 * What the assistant can change, and how — projected from `l1-surface.json`.
 *
 * The declaration is the surface's single definition site: `toolbox-core.ts`
 * binds it to the functions in `edit.ts` and carries no prose of its own, and the
 * tool manual the model is primed with is rendered from it. So an operation that
 * exists is in here, an operation that was removed is not, and neither state can
 * be reached by editing a document.
 *
 * EVERY GROUP IS DESCRIBED, not the granted subset. A manual is projected through
 * a role's grant precisely so a session is never told about a capability it does
 * not have; a reference answers "what can this product do", which is a question
 * about the surface rather than about one session.
 */
export function projectControlSurface(): ProjectedDoc {
  const declaration = l1Surface as SurfaceDeclaration
  const operations = new Map((declaration.operations ?? []).map((op) => [op.op, op]))
  const lines: string[] = []

  if (declaration.overview) lines.push(declaration.overview.trim(), '')

  const covered = new Set<string>()
  lines.push('## What can be done', '')
  for (const group of declaration.groups ?? []) {
    lines.push(`### ${group.title ?? group.group}`, '')
    if (group.description) lines.push(group.description.trim(), '')
    for (const name of group.operations ?? []) {
      const op = operations.get(name)
      covered.add(name)
      if (op) lines.push(...operationEntry(op))
    }
  }
  const loose = [...operations.keys()].filter((name) => !covered.has(name))
  if (loose.length > 0) {
    lines.push('### Not in any group', '')
    for (const name of loose) lines.push(...operationEntry(operations.get(name)!))
  }

  const sequences = declaration.sequences ?? []
  if (sequences.length > 0) {
    lines.push('## How these fit together', '')
    for (const sequence of sequences) {
      const steps = (sequence.steps ?? []).map((s) => `\`${s}\``).join(' → ')
      lines.push(`- **${sequence.name}**: ${steps}`)
      if (sequence.note) lines.push(`  ${sequence.note.replace(/\s+/g, ' ').trim()}`)
    }
    lines.push('')
  }

  const params = Object.entries(declaration.param_types ?? {})
  if (params.length > 0) {
    lines.push('## The kinds of value these take', '')
    for (const [name, spec] of params) {
      lines.push(`- \`${name}\`${spec.description ? ` — ${spec.description.trim()}` : ''}`)
    }
    lines.push('')
  }

  const shapes = Object.entries(declaration.shapes ?? {})
  if (shapes.length > 0) {
    lines.push('## What comes back', '')
    for (const [name, fields] of shapes) {
      lines.push(`### \`${name}\``, '')
      for (const [field, meaning] of Object.entries(fields)) {
        lines.push(`- \`${field}\` — ${meaning}`)
      }
      lines.push('')
    }
  }

  const errors = Object.entries(declaration.errors ?? {})
  if (errors.length > 0) {
    lines.push('## How a change is refused', '')
    for (const [name, spec] of errors) {
      lines.push(`- \`${name}\` — ${(spec.message ?? '').replace(/\s+/g, ' ').trim()}`)
    }
    lines.push('')
  }

  const absences = declaration.absences ?? []
  if (absences.length > 0) {
    lines.push(
      '## What is deliberately not possible',
      '',
      'Each of these is a decision, not a gap: nothing here is missing pending work.',
      '',
    )
    for (const absence of absences) {
      lines.push(`### ${absence.name}`, '')
      if (absence.note) lines.push(absence.note.trim(), '')
    }
  }

  const version = declaration.surface_version
  return {
    id: `${PROJECTED_PREFIX}surface`,
    title: declaration.title
      ? `${declaration.title} — what can be changed, and how`
      : 'What can be changed, and how',
    source: `the declared control surface${version === undefined ? '' : ` (version ${version})`}`,
    body: lines.join('\n').trimEnd() + '\n',
  }
}

function operationEntry(op: NonNullable<SurfaceDeclaration['operations']>[number]): string[] {
  const lines = [`#### \`${op.tool ?? op.op}\``, '']
  if (op.summary) lines.push(op.summary.trim(), '')
  if (op.description) lines.push(op.description.trim(), '')
  const params = Object.entries(op.params ?? {})
  if (params.length > 0) {
    lines.push('Takes:', '')
    for (const [name, spec] of params) {
      const bits = [`\`${name}\``]
      if (spec.type) bits.push(spec.type)
      bits.push(spec.required ? 'required' : 'optional')
      lines.push(`- ${bits.join(' — ')}${spec.description ? `. ${spec.description.trim()}` : ''}`)
    }
    lines.push('')
  }
  if (op.returns?.shape) lines.push(`Returns: \`${op.returns.shape}\`.`, '')
  if (op.errors?.length) lines.push(`Can refuse with: ${op.errors.map((e) => `\`${e}\``).join(', ')}.`, '')
  return lines
}

// ── the set ──────────────────────────────────────────────────────────────────

/**
 * Every projection, in the order they are written.
 *
 * A projection that THROWS takes the export down with it, deliberately. A
 * reference that silently loses one of its three sources is the failure mode this
 * whole design exists to prevent — the assistant would answer confidently about
 * modules and be unable to say what a page is, with nothing in the build output
 * to say why.
 */
export function projections(): ProjectedDoc[] {
  return [projectBehaviorCatalogue(), projectL1Vocabulary(), projectControlSurface()]
}
