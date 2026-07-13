/**
 * REQ-54 workstream 2 (DOC-22 §4/§5) — the styled-text *notation*: the pure,
 * lossless bridge between the runtime document and its authoring/serialization
 * string surface.
 *
 * Runtime form is {@link StyledText} — a block `baseline` style plus an ordered
 * list of {@link Block}s (a **block-document tree**, not a flat run list). Each
 * block is either a `paragraph` (its inline content is a list of
 * {@link StyledRun}s) or a `list` (bullet or ordered, its items each a list of
 * runs). A run overrides only what differs from the baseline (CSS-inheritance
 * semantics). The runs are the tree's **inline leaves**; structure — paragraph
 * boundaries, blockquotes, lists — lives at the block level, because structure
 * is a tree and a flat run list cannot hold it (lists nest; a table is 2-D).
 *
 * The string surface is CommonMark-flavoured markdown extended with a generic
 * attribute-span `[text]{field=value …}` whose keys ARE the {@link TextRun}
 * field names — so anything the capture can read has a notation and nothing is
 * inexpressible (DOC-22 §4). Paragraphs separate on blank lines; a `> ` prefix
 * marks a blockquote; `- ` / `N. ` line prefixes mark bullet / ordered lists.
 *
 * The contract is the round-trip invariant (DOC-22 §5):
 *
 *     parse(serialize(x)) deep-equals normalize(x)
 *
 * and for an already-normalized document (no two adjacent runs within a block
 * share identical formatting — what the capture and authors actually produce),
 * that reduces to exact `parse(serialize(x)) === x`. To make the invariant
 * bulletproof the *serializer* only ever emits self-delimiting inline forms
 * (bare escaped text, a `[text](href)` link, or a `[text]{…}` span) and escapes
 * any leading `-`/`N.`/`>`/`:` that would otherwise re-parse as block structure;
 * the *parser* additionally accepts the ergonomic markdown shorthands (`*x*`,
 * `**x**`) so authors can type them.
 *
 * Scope: the notation covers the *scalar* run overrides (the {@link TextRun}
 * style axes) plus `href` and `emphasis`, and the `paragraph` / `list` block
 * kinds. Structured run fields (`gradient`, `position`) are runtime-only and
 * outside the string surface, and the richer block kinds (tables, code blocks,
 * rich/nested blockquotes, headings, nested list items) are deferred to a
 * follow-up ticket (DOC-22 §8). This is a pure unit: no DOM, no theme, no async.
 */
import type { TextRun } from './text-style'

/**
 * The scalar style axes a run (or a block baseline) may override — the
 * {@link TextRun} typography vocabulary, minus the content fields
 * (`text`/`label`/`href`) and the structured fields (`gradient`/`position`).
 * Each value is a diff-unit literal or a theme alias, exactly as `TextRun` holds
 * it, so a captured value serializes and re-parses unchanged.
 */
export type StyleOverride = Pick<
  TextRun,
  | 'fontFamily'
  | 'fontSizePx'
  | 'fontWeight'
  | 'color'
  | 'letterSpacingPx'
  | 'lineHeightPx'
  | 'paddingLeftPx'
>

/** Inline emphasis marker — the markdown shorthands `*` / `**` / `***` map here. */
export type Emphasis = 'italic' | 'bold' | 'bold-italic'

/**
 * One styled run — an **inline leaf** of the block tree: its verbatim `text`
 * plus the deltas from the block baseline. Inline markers (`emphasis`, `href`)
 * and any subset of the scalar {@link StyleOverride} axes. A run that inherits
 * everything carries only `text`. Structure (paragraph / blockquote / list) is
 * NOT a run concern — it lives on the enclosing {@link Block}.
 */
export interface StyledRun extends StyleOverride {
  /** Verbatim run text. */
  text: string
  /** Link target — serializes as a markdown link or an `href=` span key. */
  href?: string
  /** Inline emphasis (`*italic*`, `**bold**`, `***bold-italic***`). */
  emphasis?: Emphasis
}

/**
 * A paragraph block: inline `runs`, optionally rendered as a blockquote (`> `).
 * The common case — a plain field is a single `paragraph` of one inherited run.
 */
export interface ParagraphBlock {
  kind: 'paragraph'
  runs: StyledRun[]
  /** True when the paragraph is a blockquote (`> …`). */
  blockquote?: boolean
}

/** One list item — its inline `runs`. (Nested / multi-block items: deferred.) */
export interface ListItem {
  runs: StyledRun[]
}

/**
 * A list block — one kind for both bullet and ordered lists (an `ordered` dial,
 * not two block kinds). Ordered lists carry `start` only when they begin at an
 * ordinal other than 1; the item ordinals are positional (`start + index`).
 */
export interface ListBlock {
  kind: 'list'
  ordered: boolean
  /** First ordinal of an ordered list, when ≠ 1. Absent for bullet lists. */
  start?: number
  items: ListItem[]
}

/** A block node of the document tree. */
export type Block = ParagraphBlock | ListBlock

/**
 * A block of styled text: the shared `baseline` style plus the ordered
 * {@link Block}s. `baseline` is omitted when the block sets no shared style
 * (every run then inherits the module's own defaults).
 */
export interface StyledText {
  baseline?: StyleOverride
  blocks: Block[]
}

/** The scalar override axes, in the fixed order the serializer emits them. */
const STYLE_KEYS: readonly (keyof StyleOverride)[] = [
  'fontFamily',
  'fontSizePx',
  'fontWeight',
  'color',
  'letterSpacingPx',
  'lineHeightPx',
  'paddingLeftPx',
]

/** Delimiters escaped with a backslash so a literal round-trips (DOC-22 §4.1). */
const ESCAPE_RE = /([\\[\]{}*`>])/g

// ---------------------------------------------------------------------------
// Serialize
// ---------------------------------------------------------------------------

/** Backslash-escape every notation delimiter in a literal text fragment. */
function escapeText(text: string): string {
  return text.replace(ESCAPE_RE, '\\$1')
}

/**
 * Serialize one attribute value. Numbers emit bare; strings emit bare unless
 * they contain whitespace or a delimiter (`}`/`"`/`=`), in which case they are
 * double-quoted with `"`/`\` escaped inside (DOC-22 §4.1 quotable values).
 */
function serializeAttrValue(value: number | string): string {
  if (typeof value === 'number') return String(value)
  if (/[\s}"=]/.test(value)) return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  return value
}

/** The `key=value …` attribute list for a run's overrides (empty when none). */
function serializeAttrs(run: StyledRun): string {
  const parts: string[] = []
  for (const key of STYLE_KEYS) {
    const value = run[key]
    if (value !== undefined) parts.push(`${key}=${serializeAttrValue(value)}`)
  }
  if (run.href !== undefined) parts.push(`href=${serializeAttrValue(run.href)}`)
  if (run.emphasis !== undefined) parts.push(`emphasis=${run.emphasis}`)
  return parts.join(' ')
}

/** True when the run carries any scalar style override. */
function hasStyleOverride(run: StyledRun): boolean {
  return STYLE_KEYS.some((key) => run[key] !== undefined)
}

/**
 * Serialize one run to its canonical, self-delimiting form:
 * - plain (no href/emphasis/overrides) → bare escaped text;
 * - href only → a markdown link `[text](href)`;
 * - anything else → a generic span `[text]{…}` (href/emphasis become keys).
 */
function serializeRun(run: StyledRun): string {
  const attrs = serializeAttrs(run)
  const text = escapeText(run.text)
  if (attrs === '') return text
  // href with no other override → the ergonomic markdown link form.
  if (run.href !== undefined && run.emphasis === undefined && !hasStyleOverride(run)) {
    return `[${text}](${run.href})`
  }
  return `[${text}]{${attrs}}`
}

/** Serialize a run list to its inline string (the leaf content of a block). */
function serializeInline(runs: StyledRun[]): string {
  return runs.map(serializeRun).join('')
}

/**
 * Escape a leading `- ` / `N. ` in paragraph text so it does not re-parse as a
 * list marker. `\- ` and `N\. ` are literal (CommonMark backslash-escaping) and
 * fail the block classifier's `^- ` / `^\d+\. ` line tests, so the paragraph
 * stays a paragraph. Blockquote's `> ` and the fence's `:` are guarded elsewhere.
 */
function guardLeadingMarker(inline: string): string {
  if (/^- /.test(inline)) return `\\${inline}`
  const ordered = inline.match(/^(\d+)\. /)
  if (ordered) return `${ordered[1]}\\. ${inline.slice(ordered[0].length)}`
  return inline
}

/** Serialize a `list` block: one line per item, `- ` / `N. ` prefixed. */
function serializeList(list: ListBlock): string {
  const start = list.start ?? 1
  return list.items
    .map((item, i) => {
      const marker = list.ordered ? `${start + i}. ` : '- '
      return `${marker}${serializeInline(item.runs)}`
    })
    .join('\n')
}

/** Serialize one block to its markup chunk. */
function serializeBlock(block: Block): string {
  if (block.kind === 'list') return serializeList(block)
  const inline = serializeInline(block.runs)
  // A blockquote paragraph gets a `> ` prefix; a plain paragraph guards a
  // leading list marker so it does not re-parse as a list.
  return block.blockquote ? `> ${inline}` : guardLeadingMarker(inline)
}

/**
 * Serialize a {@link StyledText} to its markup string (DOC-22 §4). Blocks join
 * with a blank line; a non-empty `baseline` wraps the whole body in a
 * `::: {…}` block fence.
 */
export function serializeStyledText(content: StyledText): string {
  let body = content.blocks.map(serializeBlock).join('\n\n')

  // Guard a body that begins with `:` from colliding with the `:::` fence when
  // there is no baseline to introduce one.
  if (body.startsWith(':')) body = `\\${body}`

  const baseline = content.baseline
  if (baseline && STYLE_KEYS.some((key) => baseline[key] !== undefined)) {
    const attrs = STYLE_KEYS.filter((key) => baseline[key] !== undefined)
      .map((key) => `${key}=${serializeAttrValue(baseline[key] as number | string)}`)
      .join(' ')
    return `::: {${attrs}}\n${body}\n:::`
  }
  return body
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

/** Keys whose value is always a string — never number-coerced (an all-digit `href`/family stays a string). */
const STRING_KEYS = new Set(['text', 'href', 'emphasis', 'color', 'fontFamily'])

/** Coerce a bare attribute value: numeric axes → number, string-only keys stay verbatim. */
function coerceValue(key: string, raw: string): number | string {
  if (!STRING_KEYS.has(key) && /^-?\d+(\.\d+)?$/.test(raw)) return Number(raw)
  return raw
}

/**
 * Parse a `key=value …` attribute list into a partial run. Values are bare
 * (until whitespace) or `"…"`-quoted (whitespace/delimiters allowed, `\"`/`\\`
 * unescaped). Unknown keys are kept — the schema layer (Stage 2) rejects them.
 */
function parseAttrs(src: string): Partial<StyledRun> {
  const out: Record<string, number | string> = {}
  let i = 0
  const n = src.length
  while (i < n) {
    while (i < n && /\s/.test(src[i])) i++
    if (i >= n) break
    let key = ''
    while (i < n && src[i] !== '=' && !/\s/.test(src[i])) key += src[i++]
    if (src[i] !== '=') break // malformed pair — stop
    i++ // skip '='
    let value = ''
    if (src[i] === '"') {
      i++ // opening quote
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < n) i++
        value += src[i++]
      }
      i++ // closing quote
      out[key] = value // quoted values stay strings verbatim
    } else {
      while (i < n && !/\s/.test(src[i])) value += src[i++]
      out[key] = coerceValue(key, value)
    }
  }
  return out as Partial<StyledRun>
}

/**
 * Parse the inline content of one paragraph/item into runs. Recognises:
 * backslash escapes, `*`/`**`/`***` emphasis, `[text](href)` links,
 * `[text]{attrs}` spans, and bare text (flushed as an inherited run at each
 * boundary).
 */
function parseInline(src: string): StyledRun[] {
  const runs: StyledRun[] = []
  let buf = ''
  let i = 0
  const n = src.length

  const flush = () => {
    if (buf !== '') {
      runs.push({ text: buf })
      buf = ''
    }
  }

  // Read `text` until an unescaped `stop` char; consumes and returns unescaped text.
  const readUntil = (stop: string): string => {
    let out = ''
    while (i < n && src[i] !== stop) {
      if (src[i] === '\\' && i + 1 < n) {
        i++
        out += src[i++]
      } else {
        out += src[i++]
      }
    }
    return out
  }

  while (i < n) {
    const ch = src[i]
    if (ch === '\\' && i + 1 < n) {
      buf += src[i + 1]
      i += 2
    } else if (ch === '*') {
      // Emphasis: 1/2/3 stars, matched by an equal-length closing run.
      let stars = 0
      while (i < n && src[i] === '*') {
        stars++
        i++
      }
      const marker = '*'.repeat(stars)
      let inner = ''
      while (i < n && src.slice(i, i + stars) !== marker) {
        if (src[i] === '\\' && i + 1 < n) {
          i++
          inner += src[i++]
        } else {
          inner += src[i++]
        }
      }
      i += stars // consume closing marker
      const emphasis: Emphasis = stars >= 3 ? 'bold-italic' : stars === 2 ? 'bold' : 'italic'
      flush()
      runs.push({ text: inner, emphasis })
    } else if (ch === '[') {
      i++ // consume '['
      const text = readUntil(']')
      i++ // consume ']'
      if (src[i] === '(') {
        i++ // consume '('
        const href = readUntil(')')
        i++ // consume ')'
        flush()
        runs.push({ text, href })
      } else if (src[i] === '{') {
        i++ // consume '{'
        // Quote-aware: a `}` inside a `"…"` value does not close the block.
        let attrs = ''
        while (i < n && src[i] !== '}') {
          if (src[i] === '"') {
            attrs += src[i++] // opening quote
            while (i < n && src[i] !== '"') {
              if (src[i] === '\\' && i + 1 < n) attrs += src[i++]
              attrs += src[i++]
            }
            if (i < n) attrs += src[i++] // closing quote
          } else if (src[i] === '\\' && i + 1 < n) {
            attrs += src[i++]
            attrs += src[i++]
          } else {
            attrs += src[i++]
          }
        }
        i++ // consume '}'
        flush()
        runs.push({ text, ...parseAttrs(attrs) })
      } else {
        // A lone `[text]` with no span — treat the brackets as literal text.
        buf += `[${text}]`
      }
    } else {
      buf += ch
      i++
    }
  }
  flush()
  return runs
}

/** Split a body into chunks on blank lines (each chunk is one block). */
function splitChunks(body: string): string[] {
  return body
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '')
}

/**
 * Classify one chunk into a {@link Block}. A chunk whose every line is a `- `
 * item is a bullet list; every line `N. ` an ordered list (start = the first
 * ordinal); a `> `-prefixed chunk is a blockquote paragraph; anything else is a
 * plain paragraph.
 */
function parseChunk(chunk: string): Block {
  const lines = chunk.split('\n')

  if (lines.every((l) => /^\d+\. /.test(l))) {
    const start = Number(lines[0].match(/^(\d+)\. /)![1])
    const items = lines.map((l) => ({ runs: parseInline(l.replace(/^\d+\. /, '')) }))
    return start === 1 ? { kind: 'list', ordered: true, items } : { kind: 'list', ordered: true, start, items }
  }
  if (lines.every((l) => /^- /.test(l))) {
    return { kind: 'list', ordered: false, items: lines.map((l) => ({ runs: parseInline(l.slice(2)) })) }
  }
  if (chunk.startsWith('> ')) {
    return { kind: 'paragraph', blockquote: true, runs: parseInline(chunk.slice(2)) }
  }
  return { kind: 'paragraph', runs: parseInline(chunk) }
}

/**
 * Parse a markup string back to {@link StyledText} (DOC-22 §4). Inverse of
 * {@link serializeStyledText}: strips a leading `::: {…}` baseline fence, splits
 * the body into chunks on blank lines, and classifies each chunk into a block.
 */
export function parseStyledText(markup: string): StyledText {
  let body = markup
  let baseline: StyleOverride | undefined

  // A baseline fence, when present, wraps the whole document: first line opens
  // `::: {…}`, the final `:::` line closes it.
  const fence = body.match(/^::: \{([^}]*)\}\n([\s\S]*)\n:::\s*$/)
  if (fence) {
    baseline = parseAttrs(fence[1]) as StyleOverride
    body = fence[2]
  }

  const blocks = splitChunks(body).map(parseChunk)
  return baseline ? { baseline, blocks } : { blocks }
}

// ---------------------------------------------------------------------------
// Normalize
// ---------------------------------------------------------------------------

/** The formatting signature of a run — everything except its `text`. */
function formatKey(run: StyledRun): string {
  const { text: _text, ...rest } = run
  const keys = Object.keys(rest).sort()
  return JSON.stringify(keys.map((k) => [k, (rest as Record<string, unknown>)[k]]))
}

/**
 * Merge adjacent runs that share identical formatting into one (concatenating
 * their text) — the canonical inline form the round-trip converges to.
 * Idempotent.
 */
export function normalizeRuns(runs: StyledRun[]): StyledRun[] {
  const out: StyledRun[] = []
  for (const run of runs) {
    const prev = out[out.length - 1]
    if (prev && formatKey(prev) === formatKey(run)) {
      prev.text += run.text
    } else {
      out.push({ ...run })
    }
  }
  return out
}

/**
 * Normalize a whole document: {@link normalizeRuns} the inline content of every
 * paragraph and every list item. This is the canonical form the round-trip
 * converges to (`parse(serialize(x))` deep-equals `normalizeStyledText(x)`).
 */
export function normalizeStyledText(content: StyledText): StyledText {
  const blocks: Block[] = content.blocks.map((block) =>
    block.kind === 'list'
      ? { ...block, items: block.items.map((item) => ({ runs: normalizeRuns(item.runs) })) }
      : { ...block, runs: normalizeRuns(block.runs) },
  )
  return content.baseline ? { baseline: content.baseline, blocks } : { blocks }
}
