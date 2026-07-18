/**
 * REQ-54 workstream 2 + REQ-57 (DOC-22 §4/§5) — the styled-text *notation*: the
 * pure, lossless bridge between the runtime document and its authoring/
 * serialization string surface.
 *
 * Runtime form is {@link StyledText} — a block `baseline` style plus an ordered
 * list of {@link Block}s (a **block-document tree**, not a flat run list). The
 * tree's **inline leaves** are {@link StyledRun}s; a run overrides only what
 * differs from the baseline (CSS-inheritance semantics). Structure — paragraph
 * boundaries, headings, lists, blockquotes, code, tables — lives at the block
 * level, because structure is a tree and a flat run list cannot hold it (lists
 * nest; a table is 2-D; a code block owns raw text).
 *
 * Block kinds (DOC-22 §3, §8):
 * - `paragraph` — inline `runs`.
 * - `heading` — a `level` 1–6 plus inline `runs`.
 * - `list` — one kind for bullet **and** ordered (the `ordered` dial); each
 *   item holds child `blocks` (so an item can nest a list or span paragraphs).
 * - `blockquote` — a **container** of child `blocks` (nested / multi-paragraph
 *   quotes). It replaces REQ-54's paragraph-level `blockquote` flag outright.
 * - `code` — raw verbatim `text` + optional `language`; no inline parsing.
 * - `table` — 2-D `rows` of cells, each cell a container of child `blocks`.
 *
 * The string surface is CommonMark-flavoured markdown extended with a generic
 * attribute-span `[text]{field=value …}` whose keys ARE the {@link TextRun}
 * field names — so anything the capture can read has a notation and nothing is
 * inexpressible (DOC-22 §4). Blank lines separate sibling blocks; `#…###### `
 * prefixes a heading; `- ` / `N. ` line prefixes bullet / ordered list items;
 * `> ` prefixes a blockquote (whose stripped content is itself block content);
 * a ```` ``` ```` fence is a code block; and a nesting `::: table` / `::: row` /
 * `::: cell` … `:::` structural-fence family carries a table. Because lists,
 * blockquotes, cells and rows all hold *blocks*, both the parser and the
 * serializer are **recursive descent** over the tree.
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
 * any leading `-`/`N.`/`>`/`#`/`:` that would otherwise re-parse as block
 * structure; the *parser* additionally accepts the ergonomic markdown
 * shorthands (`*x*`, `**x**`) so authors can type them.
 *
 * Scope: the notation covers the *scalar* run overrides (the {@link TextRun}
 * style axes) plus `href` and `emphasis`, and every block kind above. Structured
 * run fields (`gradient`, `position`) are runtime-only and outside the string
 * surface (DOC-22 §8). This is a pure unit: no DOM, no theme, no async.
 */
import type { TextRun } from './text-style'

/**
 * The scalar style axes a run (or a block baseline) may override — the
 * {@link TextRun} typography vocabulary, minus the content fields
 * (`text`/`label`/`href`) and the structured fields (`gradient`/`position`).
 * Each value is a diff-unit literal or a theme alias, exactly as `TextRun` holds
 * it, so a captured value serializes and re-parses unchanged.
 */
// REQ-70 — the responsive `{ base, sm?… }` axis form is only for discrete TextRuns
// (headings that scale); an inline prose run is a single size, so re-narrow those axes
// to scalar here rather than inherit TextRun's responsive union.
export type StyleOverride = Pick<TextRun, 'fontFamily' | 'fontWeight' | 'color' | 'paddingLeftPx'> & {
  fontSizePx?: number | string
  letterSpacingPx?: number | string
  lineHeightPx?: number | string
}

/** Inline emphasis marker — the markdown shorthands `*` / `**` / `***` map here. */
export type Emphasis = 'italic' | 'bold' | 'bold-italic'

/** Heading rank — `#` (1) through `######` (6), the CommonMark ATX range. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/**
 * One styled run — an **inline leaf** of the block tree: its verbatim `text`
 * plus the deltas from the block baseline. Inline markers (`emphasis`, `href`)
 * and any subset of the scalar {@link StyleOverride} axes. A run that inherits
 * everything carries only `text`. Structure (paragraph / heading / list …) is
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

/** A paragraph block: inline `runs`. The common single-field case. */
export interface ParagraphBlock {
  kind: 'paragraph'
  runs: StyledRun[]
}

/** A heading block: an ATX `level` 1–6 plus inline `runs` (`#…###### text`). */
export interface HeadingBlock {
  kind: 'heading'
  level: HeadingLevel
  runs: StyledRun[]
}

/**
 * A code block: raw verbatim `text` and an optional `language`, serialized as a
 * ```` ``` ```` fence. Its text is NOT inline-parsed — `[..]{..}`, `*`, `` ` ``
 * inside it are literal.
 */
export interface CodeBlock {
  kind: 'code'
  language?: string
  text: string
}

/**
 * One list item — a **container** of child {@link Block}s (not just runs), so an
 * item can nest a sub-list or span multiple paragraphs. A plain single-line item
 * is one `paragraph` block of one inherited run.
 */
export interface ListItem {
  blocks: Block[]
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

/**
 * A blockquote block — a **container** of child {@link Block}s, serialized by
 * prefixing every line of its content with `> `. It holds nested quotes,
 * multi-paragraph quotes, an attribution paragraph, etc. This replaces the
 * REQ-54 paragraph-level `blockquote` flag (no dual model).
 */
export interface BlockquoteBlock {
  kind: 'blockquote'
  blocks: Block[]
}

/** One table cell — a **container** of child {@link Block}s. */
export interface TableCell {
  blocks: Block[]
}

/**
 * A table block — a 2-D grid of {@link TableCell}s (`rows[row][col]`),
 * serialized as a nesting `::: table` / `::: row` / `::: cell` structural-fence
 * family. The diff pairs cells positionally by (row, col).
 */
export interface TableBlock {
  kind: 'table'
  rows: TableCell[][]
}

/** A block node of the document tree. */
export type Block = ParagraphBlock | HeadingBlock | CodeBlock | ListBlock | BlockquoteBlock | TableBlock

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

/** A structural-fence opener: `::: ` followed by a tag/attrs (`table`, `{…}`, …). */
const FENCE_OPEN_RE = /^::: .+$/
/** A structural-fence closer: a bare `:::` line. */
const FENCE_CLOSE = ':::'

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
 * Escape a leading block marker in paragraph text so it does not re-parse as a
 * heading / list / fence. `\- `, `N\. `, `\# `, `\:` are literals (CommonMark
 * backslash-escaping) that fail the block classifier's line tests, so the
 * paragraph stays a paragraph. (`> ` and the code fence are already covered by
 * {@link escapeText}, which escapes `>` and `` ` `` everywhere.)
 */
function guardLeadingMarker(inline: string): string {
  if (/^- /.test(inline)) return `\\${inline}`
  const ordered = inline.match(/^(\d+)\. /)
  if (ordered) return `${ordered[1]}\\. ${inline.slice(ordered[0].length)}`
  if (/^#{1,6} /.test(inline)) return `\\${inline}`
  if (inline.startsWith(':')) return `\\${inline}`
  return inline
}

/** Serialize a `code` block to a backtick fence long enough to enclose its text. */
function serializeCode(block: CodeBlock): string {
  const longest = (block.text.match(/`+/g) ?? []).reduce((m, run) => Math.max(m, run.length), 0)
  const fence = '`'.repeat(Math.max(3, longest + 1))
  return `${fence}${block.language ?? ''}\n${block.text}\n${fence}`
}

/**
 * Serialize a `list` block: each item's child blocks are serialized (recursing),
 * the first line carries the `- ` / `N. ` marker, and continuation lines are
 * indented by the marker width so a nested list / second paragraph re-parses
 * back under the item.
 */
function serializeList(list: ListBlock): string {
  const start = list.start ?? 1
  return list.items
    .map((item, idx) => {
      const marker = list.ordered ? `${start + idx}. ` : '- '
      const indent = ' '.repeat(marker.length)
      const lines = serializeBlocks(item.blocks).split('\n')
      return lines.map((line, li) => (li === 0 ? marker + line : line === '' ? '' : indent + line)).join('\n')
    })
    .join('\n')
}

/** Serialize a `blockquote` block: `> `-prefix every line of its child blocks. */
function serializeBlockquote(block: BlockquoteBlock): string {
  return serializeBlocks(block.blocks)
    .split('\n')
    .map((line) => (line === '' ? '>' : `> ${line}`))
    .join('\n')
}

/** Serialize a `table` block to the nesting `::: table` / `::: row` / `::: cell` fences. */
function serializeTable(table: TableBlock): string {
  const rows = table.rows
    .map((row) => {
      const cells = row.map((cell) => `::: cell\n${serializeBlocks(cell.blocks)}\n:::`).join('\n')
      return `::: row\n${cells}\n:::`
    })
    .join('\n')
  return `::: table\n${rows}\n:::`
}

/** Serialize one block to its markup chunk (recursing into containers). */
function serializeBlock(block: Block): string {
  switch (block.kind) {
    case 'paragraph':
      return guardLeadingMarker(serializeInline(block.runs))
    case 'heading':
      return `${'#'.repeat(block.level)} ${serializeInline(block.runs)}`
    case 'code':
      return serializeCode(block)
    case 'list':
      return serializeList(block)
    case 'blockquote':
      return serializeBlockquote(block)
    case 'table':
      return serializeTable(block)
  }
}

/** Serialize a list of sibling blocks — each block chunk joined by a blank line. */
function serializeBlocks(blocks: Block[]): string {
  return blocks.map(serializeBlock).join('\n\n')
}

/**
 * Serialize a {@link StyledText} to its markup string (DOC-22 §4). Blocks join
 * with a blank line; a non-empty `baseline` wraps the whole body in a
 * `::: {…}` block fence.
 */
export function serializeStyledText(content: StyledText): string {
  const body = serializeBlocks(content.blocks)
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
 * Parse the inline content of one paragraph/heading/item line into runs.
 * Recognises: backslash escapes, `*`/`**`/`***` emphasis, `[text](href)` links,
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

/** True when a line is empty or only whitespace. */
function isBlank(line: string): boolean {
  return line.trim() === ''
}

/** The count of leading spaces on a line (its indentation depth). */
function indentOf(line: string): number {
  return line.length - line.replace(/^ +/, '').length
}

/**
 * From a structural-fence opener at `openIdx`, return the index of the matching
 * bare `:::` closer, tracking nested openers by depth. Falls back to the end if
 * unterminated (never happens on the serializer's own output).
 */
function findFenceClose(lines: string[], openIdx: number): number {
  let depth = 1
  for (let j = openIdx + 1; j < lines.length; j++) {
    if (FENCE_OPEN_RE.test(lines[j])) depth++
    else if (lines[j] === FENCE_CLOSE) {
      depth--
      if (depth === 0) return j
    }
  }
  return lines.length
}

/** Parse the body lines of a `::: row` fence into cells (its `::: cell` fences). */
function parseRow(rowLines: string[]): TableCell[] {
  const cells: TableCell[] = []
  let i = 0
  while (i < rowLines.length) {
    if (rowLines[i] === '::: cell') {
      const close = findFenceClose(rowLines, i)
      cells.push({ blocks: parseBlocks(rowLines.slice(i + 1, close)) })
      i = close + 1
    } else {
      i++ // blank line / stray — skip
    }
  }
  return cells
}

/** Parse the body lines of a `::: table` fence into rows (its `::: row` fences). */
function parseTable(bodyLines: string[]): TableBlock {
  const rows: TableCell[][] = []
  let i = 0
  while (i < bodyLines.length) {
    if (bodyLines[i] === '::: row') {
      const close = findFenceClose(bodyLines, i)
      rows.push(parseRow(bodyLines.slice(i + 1, close)))
      i = close + 1
    } else {
      i++ // blank line / stray — skip
    }
  }
  return { kind: 'table', rows }
}

/**
 * Parse a run of `- ` / `N. ` item lines (from `start`) into a {@link ListBlock}.
 * Each item owns its marker line plus every following line that is blank or
 * indented by ≥ the marker width; those continuation lines are dedented and
 * recursively parsed as the item's child blocks. Returns the block and the index
 * of the first line past the list.
 */
function parseList(lines: string[], start: number, ordered: boolean): { block: ListBlock; next: number } {
  const markerRe = ordered ? /^(\d+)\. / : /^- /
  const items: ListItem[] = []
  let firstOrdinal: number | undefined
  let i = start
  const n = lines.length
  while (i < n) {
    const marker = lines[i].match(markerRe)
    if (!marker || indentOf(lines[i]) !== 0) break
    const width = marker[0].length
    if (ordered && firstOrdinal === undefined) firstOrdinal = Number(marker[1])
    const body: string[] = [lines[i].slice(width)]
    i++
    while (i < n && (isBlank(lines[i]) || indentOf(lines[i]) >= width)) {
      body.push(isBlank(lines[i]) ? '' : lines[i].slice(width))
      i++
    }
    // Trailing blanks belong to the block separator, not the item.
    while (body.length > 0 && body[body.length - 1] === '') body.pop()
    items.push({ blocks: parseBlocks(body) })
  }
  const block: ListBlock =
    ordered && firstOrdinal !== undefined && firstOrdinal !== 1
      ? { kind: 'list', ordered: true, start: firstOrdinal, items }
      : { kind: 'list', ordered, items }
  return { block, next: i }
}

/**
 * Parse a list of lines into sibling {@link Block}s (recursive descent). Skips
 * blank separators, then classifies the next block by its first line: a `#…`
 * heading, a ```` ``` ```` code fence, a `::: table` structural fence, a `> `
 * blockquote, a `- `/`N. ` list, or a single-line paragraph.
 */
function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = []
  let i = 0
  const n = lines.length
  while (i < n) {
    if (isBlank(lines[i])) {
      i++
      continue
    }
    const line = lines[i]

    const heading = line.match(/^(#{1,6}) (.*)$/)
    if (heading) {
      blocks.push({ kind: 'heading', level: heading[1].length as HeadingLevel, runs: parseInline(heading[2]) })
      i++
      continue
    }

    const codeFence = line.match(/^(`{3,})(.*)$/)
    if (codeFence) {
      const fence = codeFence[1]
      const language = codeFence[2].trim()
      const text: string[] = []
      let j = i + 1
      while (j < n && lines[j] !== fence) text.push(lines[j++])
      const code: CodeBlock = { kind: 'code', text: text.join('\n') }
      if (language !== '') code.language = language
      blocks.push(code)
      i = j + 1 // skip the closing fence (or run to EOF if unterminated)
      continue
    }

    if (FENCE_OPEN_RE.test(line)) {
      const tag = line.slice(4).trim()
      const close = findFenceClose(lines, i)
      if (tag === 'table') blocks.push(parseTable(lines.slice(i + 1, close)))
      // (`row`/`cell` only appear inside a table body; a stray fence is dropped.)
      i = close + 1
      continue
    }

    if (line === '>' || line.startsWith('> ')) {
      const inner: string[] = []
      while (i < n && (lines[i] === '>' || lines[i].startsWith('> '))) {
        inner.push(lines[i] === '>' ? '' : lines[i].slice(2))
        i++
      }
      blocks.push({ kind: 'blockquote', blocks: parseBlocks(inner) })
      continue
    }

    const listMarker = line.match(/^(- |\d+\. )/)
    if (listMarker) {
      const { block, next } = parseList(lines, i, /^\d/.test(listMarker[1]))
      blocks.push(block)
      i = next
      continue
    }

    blocks.push({ kind: 'paragraph', runs: parseInline(line) })
    i++
  }
  return blocks
}

/**
 * Parse a markup string back to {@link StyledText} (DOC-22 §4). Inverse of
 * {@link serializeStyledText}: strips a leading `::: {…}` baseline fence, then
 * recursively parses the body lines into the block tree.
 */
export function parseStyledText(markup: string): StyledText {
  let body = markup
  let baseline: StyleOverride | undefined

  // A baseline fence, when present, wraps the whole document: first line opens
  // `::: {…}`, the final `:::` line closes it. (Its opener is `::: {`, distinct
  // from the `::: table` structural fences that may appear inside the body.)
  const fence = body.match(/^::: \{([^}]*)\}\n([\s\S]*)\n:::\s*$/)
  if (fence) {
    baseline = parseAttrs(fence[1]) as StyleOverride
    body = fence[2]
  }

  const blocks = parseBlocks(body.split('\n'))
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

/** Normalize one block: {@link normalizeRuns} its leaves, recursing into containers. */
function normalizeBlock(block: Block): Block {
  switch (block.kind) {
    case 'paragraph':
      return { kind: 'paragraph', runs: normalizeRuns(block.runs) }
    case 'heading':
      return { kind: 'heading', level: block.level, runs: normalizeRuns(block.runs) }
    case 'code':
      return block
    case 'list':
      return { ...block, items: block.items.map((item) => ({ blocks: normalizeBlocks(item.blocks) })) }
    case 'blockquote':
      return { kind: 'blockquote', blocks: normalizeBlocks(block.blocks) }
    case 'table':
      return {
        kind: 'table',
        rows: block.rows.map((row) => row.map((cell) => ({ blocks: normalizeBlocks(cell.blocks) }))),
      }
  }
}

/**
 * Normalize a sibling block list: normalize each block, then **merge adjacent
 * lists of the same `ordered`-ness** into one. Two adjacent same-type lists are
 * indistinguishable in the notation (a blank line between items is the same
 * list, not a boundary), so the serializer emits them tight and the parser reads
 * them as one — this is the block-level analogue of {@link normalizeRuns}
 * merging adjacent same-format runs, and it is what makes the round-trip
 * invariant hold for a document that authored two adjacent same-type lists. The
 * merged list keeps the first list's `start`.
 */
function normalizeBlocks(blocks: Block[]): Block[] {
  const out: Block[] = []
  for (const block of blocks.map(normalizeBlock)) {
    const prev = out[out.length - 1]
    if (block.kind === 'list' && prev && prev.kind === 'list' && prev.ordered === block.ordered) {
      prev.items = prev.items.concat(block.items)
    } else {
      out.push(block)
    }
  }
  return out
}

/**
 * Normalize a whole document: {@link normalizeRuns} the inline content of every
 * block, merge adjacent same-type lists, and recurse through lists, blockquotes
 * and tables. This is the canonical form the round-trip converges to
 * (`parse(serialize(x))` deep-equals `normalizeStyledText(x)`).
 */
export function normalizeStyledText(content: StyledText): StyledText {
  const blocks = normalizeBlocks(content.blocks)
  return content.baseline ? { baseline: content.baseline, blocks } : { blocks }
}
