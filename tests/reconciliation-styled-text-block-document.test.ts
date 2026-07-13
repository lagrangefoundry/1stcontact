import { describe, it, expect } from 'vitest'
import {
  parseStyledText,
  serializeStyledText,
  normalizeRuns,
  normalizeStyledText,
  type StyledRun,
  type StyledText,
  type Block,
  type ListItem,
  type HeadingLevel,
} from '../packages/framework/src/modules/text-markup'

/**
 * Reconciliation UATs for story-8b5ebbf7 — the styled-text block-document
 * content model with its lossless authoring notation. One UAT per acceptance
 * criterion (AC-618..AC-628), each asserting the observable behaviour of the
 * pure serialize/parse/normalize unit through its public entry points
 * (`parseStyledText`, `serializeStyledText`, `normalizeStyledText`). The lead
 * contract is the round-trip invariant `parse(serialize(x)) === normalize(x)`,
 * with exact equality for the normalized subset.
 */

// ---------------------------------------------------------------------------
// Deterministic document generator (shared by the AC-618 property test). The
// repo has no `fast-check`; a seeded xorshift32 explores a wide, reproducible
// space of documents spanning every block kind nested inside one another.
// ---------------------------------------------------------------------------
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
}

const TEXT_ATOMS = ['abc', 'a b', 'x[y]z', '{k=v}', 'a*b', 'back\\slash', 'quote " it', '] } close', ':::lead', '# hash']
const COLORS = ['#314158', '#fff', '#0a0a0aff', 'primary', 'accent']
const SIZES = [14, 16, 18, 24, '5xl', 'lg']
const WEIGHTS = [400, 517, 700, 'medium', 'bold']
const EMPHASES = ['italic', 'bold', 'bold-italic'] as const
const CODE_ATOMS = ['plain code', 'a[b]{c}\n*not emphasis*', '> not a quote\n- not a list', 'const x = `y`', '# not heading']
const LANGS = ['ts', 'js', 'py', 'sh']

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

function makeRun(rng: () => number, index: number): StyledRun {
  const run: StyledRun = { text: pick(rng, TEXT_ATOMS) }
  if (rng() < 0.4) run.fontSizePx = pick(rng, SIZES)
  if (rng() < 0.4) run.fontWeight = pick(rng, WEIGHTS)
  if (rng() < 0.4) run.color = pick(rng, COLORS)
  if (rng() < 0.2) run.letterSpacingPx = pick(rng, [0, 1, 2])
  if (rng() < 0.15) run.emphasis = pick(rng, EMPHASES)
  if (rng() < 0.15) run.href = pick(rng, ['/a', 'https://x.io/p', 'mailto:a@b.co'])
  if (Object.keys(run).length === 1) run.fontSizePx = 12 + index
  return run
}

function makeRuns(rng: () => number, seedIndex: () => number): StyledRun[] {
  const count = 1 + Math.floor(rng() * 3)
  const runs: StyledRun[] = []
  for (let r = 0; r < count; r++) runs.push(makeRun(rng, seedIndex()))
  return normalizeRuns(runs)
}

function makeParagraph(rng: () => number, seedIndex: () => number): Block {
  return { kind: 'paragraph', runs: makeRuns(rng, seedIndex) }
}

function makeCode(rng: () => number): Block {
  const block: Block = { kind: 'code', text: pick(rng, CODE_ATOMS) }
  if (rng() < 0.6) block.language = pick(rng, LANGS)
  return block
}

function makeLeaf(rng: () => number, seedIndex: () => number): Block {
  const roll = rng()
  if (roll < 0.2) return { kind: 'heading', level: (1 + Math.floor(rng() * 6)) as HeadingLevel, runs: makeRuns(rng, seedIndex) }
  if (roll < 0.35) return makeCode(rng)
  return makeParagraph(rng, seedIndex)
}

function makeItem(rng: () => number, seedIndex: () => number, depth: number): ListItem {
  if (depth > 0 && rng() < 0.4) {
    const blocks: Block[] = [makeParagraph(rng, seedIndex)]
    blocks.push(rng() < 0.6 ? makeBlock(rng, seedIndex, depth - 1) : makeParagraph(rng, seedIndex))
    return { blocks }
  }
  return { blocks: [makeParagraph(rng, seedIndex)] }
}

function makeBlocks(rng: () => number, seedIndex: () => number, depth: number, count: number): Block[] {
  const out: Block[] = []
  for (let i = 0; i < count; i++) {
    const block = makeBlock(rng, seedIndex, depth)
    const prev = out[out.length - 1]
    if (block.kind === 'list' && prev && prev.kind === 'list' && prev.ordered === block.ordered) {
      prev.items = prev.items.concat(block.items)
    } else {
      out.push(block)
    }
  }
  return out
}

function makeBlock(rng: () => number, seedIndex: () => number, depth: number): Block {
  if (depth <= 0) return makeLeaf(rng, seedIndex)
  const roll = rng()
  if (roll < 0.25) {
    const ordered = rng() < 0.5
    const items = Array.from({ length: 1 + Math.floor(rng() * 2) }, () => makeItem(rng, seedIndex, depth - 1))
    if (ordered && rng() < 0.4) return { kind: 'list', ordered, start: 2 + Math.floor(rng() * 8), items }
    return { kind: 'list', ordered, items }
  }
  if (roll < 0.4) {
    const inner = makeBlocks(rng, seedIndex, depth - 1, 1 + Math.floor(rng() * 2))
    return { kind: 'blockquote', blocks: inner }
  }
  if (roll < 0.55) {
    const nrows = 1 + Math.floor(rng() * 2)
    const ncols = 1 + Math.floor(rng() * 2)
    const rows = Array.from({ length: nrows }, () =>
      Array.from({ length: ncols }, () => {
        const cell: Block[] = [makeParagraph(rng, seedIndex)]
        if (rng() < 0.3) cell.push(makeParagraph(rng, seedIndex))
        return { blocks: cell }
      }),
    )
    return { kind: 'table', rows }
  }
  return makeLeaf(rng, seedIndex)
}

function makeContent(seed: number): StyledText {
  const rng = makeRng(seed)
  let counter = 0
  const seedIndex = () => counter++
  const blockCount = 1 + Math.floor(rng() * 3)
  const blocks = makeBlocks(rng, seedIndex, 2, blockCount)
  const content: StyledText = { blocks }
  if (rng() < 0.4) content.baseline = { fontSizePx: pick(rng, SIZES), color: pick(rng, COLORS) }
  return content
}

// ---------------------------------------------------------------------------

describe('story-8b5ebbf7 styled-text block-document — round-trip & notation', () => {
  it('test_UAT_AC618_roundtrip_invariant_over_all_block_kinds', () => {
    // AC-618: serialize→parse yields a document deep-equal to the normalized
    // original, holding for documents mixing every block kind (paragraph,
    // heading, list, blockquote, code, table) nested to arbitrary depth with
    // dense per-run overrides. For the already-normalized subset the parsed
    // result equals the original exactly. Property test over 500 seeds.
    for (let seed = 1; seed <= 500; seed++) {
      const content = makeContent(seed)
      const markup = serializeStyledText(content)
      // Exact equality: generated documents are already in normal form.
      expect(parseStyledText(markup), `seed ${seed}:\n${markup}`).toEqual(content)
      // …and are therefore their own normalization fixpoint.
      expect(normalizeStyledText(content)).toEqual(content)
    }
  })

  it('test_UAT_AC619_per_run_overrides_via_attribute_span', () => {
    // AC-619: an inline `[text]{field=value …}` span produces a run carrying
    // exactly the listed override axes and inheriting every unlisted axis.
    expect(parseStyledText('[x]{fontSizePx=18 color=#314158}').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'x', fontSizePx: 18, color: '#314158' }],
    })
    // A subset of a different axis pair carries only those two overrides.
    expect(parseStyledText('[y]{fontWeight=700 letterSpacingPx=2}').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'y', fontWeight: 700, letterSpacingPx: 2 }],
    })
    // A run with no span carries only its text — all style axes inherited.
    expect(parseStyledText('just prose').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'just prose' }],
    })
  })

  it('test_UAT_AC620_markdown_shorthands_desugar_to_model', () => {
    // AC-620: ergonomic markdown shorthands are accepted at parse time.
    // Emphasis shorthands.
    expect(parseStyledText('*x*').blocks[0]).toEqual({ kind: 'paragraph', runs: [{ text: 'x', emphasis: 'italic' }] })
    expect(parseStyledText('**x**').blocks[0]).toEqual({ kind: 'paragraph', runs: [{ text: 'x', emphasis: 'bold' }] })
    expect(parseStyledText('***x***').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'x', emphasis: 'bold-italic' }],
    })
    // Heading shorthands `#`…`######` at line start.
    for (let level = 1; level <= 6; level++) {
      expect(parseStyledText(`${'#'.repeat(level)} Title`).blocks[0]).toEqual({
        kind: 'heading',
        level,
        runs: [{ text: 'Title' }],
      })
    }
    // Blockquote shorthand `> `.
    expect(parseStyledText('> quiet line').blocks[0]).toEqual({
      kind: 'blockquote',
      blocks: [{ kind: 'paragraph', runs: [{ text: 'quiet line' }] }],
    })
    // List shorthands `- ` (bullet) and `N. ` (ordered).
    expect(parseStyledText('- one\n- two').blocks[0]).toEqual({
      kind: 'list',
      ordered: false,
      items: [
        { blocks: [{ kind: 'paragraph', runs: [{ text: 'one' }] }] },
        { blocks: [{ kind: 'paragraph', runs: [{ text: 'two' }] }] },
      ],
    })
    expect(parseStyledText('1. one\n2. two').blocks[0]).toEqual({
      kind: 'list',
      ordered: true,
      items: [
        { blocks: [{ kind: 'paragraph', runs: [{ text: 'one' }] }] },
        { blocks: [{ kind: 'paragraph', runs: [{ text: 'two' }] }] },
      ],
    })
    // A plain line with no markup desugars to a single inherited run.
    expect(parseStyledText('plain unmarked line').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'plain unmarked line' }],
    })
  })

  it('test_UAT_AC621_literal_delimiters_and_leading_markers_are_escaped', () => {
    // AC-621: inline text containing literal notation delimiters, or beginning
    // with a character that would otherwise start a block, serializes escaped
    // and re-parses as the same literal inline text — never as a span, link, or
    // structure marker. A paragraph that merely starts like a marker stays a
    // paragraph.
    const literalDelimiters = 'a [b] {c} * d ` e'
    const contentDelims: StyledText = {
      blocks: [{ kind: 'paragraph', runs: [{ text: literalDelimiters }] }],
    }
    const delimMarkup = serializeStyledText(contentDelims)
    expect(parseStyledText(delimMarkup)).toEqual(contentDelims)
    expect(parseStyledText(delimMarkup).blocks[0].kind).toBe('paragraph')

    // Each leading block-marker character kept literal in a paragraph.
    for (const text of ['- not a list', '1. not a list', '> not a quote', '# not a heading', ': colon lead']) {
      const content: StyledText = { blocks: [{ kind: 'paragraph', runs: [{ text }] }] }
      const markup = serializeStyledText(content)
      expect(parseStyledText(markup), `leading marker: ${JSON.stringify(text)}`).toEqual(content)
      expect(parseStyledText(markup).blocks[0].kind).toBe('paragraph')
    }
  })

  it('test_UAT_AC622_bullet_and_ordered_lists_one_kind_ordinals_and_start', () => {
    // AC-622: bullet and ordered lists are one block kind, distinguished by
    // `ordered`. A bullet item's first serialized line is `- text`; ordinals are
    // positional (start + index); a non-1 start survives the round-trip; a list
    // starting at 1 records no explicit start.
    const bullet: StyledText = {
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [{ blocks: [{ kind: 'paragraph', runs: [{ text: 'plain item' }] }] }],
        },
      ],
    }
    expect(serializeStyledText(bullet).split('\n')[0]).toBe('- plain item')
    expect(parseStyledText(serializeStyledText(bullet))).toEqual(bullet)

    // Ordered list beginning at ordinal 3 — positional ordinals, start preserved.
    const ordered: StyledText = {
      blocks: [
        {
          kind: 'list',
          ordered: true,
          start: 3,
          items: [
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'third' }] }] },
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'fourth' }] }] },
          ],
        },
      ],
    }
    expect(serializeStyledText(ordered)).toBe('3. third\n4. fourth')
    expect(parseStyledText(serializeStyledText(ordered))).toEqual(ordered)

    // A list starting at 1 records no explicit `start`.
    const startsAtOne = parseStyledText('1. one\n2. two').blocks[0]
    expect(startsAtOne.kind).toBe('list')
    expect('start' in startsAtOne).toBe(false)
  })

  it('test_UAT_AC623_adjacent_same_type_lists_merge_on_normalization', () => {
    // AC-623: two adjacent sibling lists of the same ordered-ness normalize into
    // a single list block whose items are the concatenation, retaining the first
    // list's start.
    const twoBullet: StyledText = {
      blocks: [
        { kind: 'list', ordered: false, items: [{ blocks: [{ kind: 'paragraph', runs: [{ text: 'a' }] }] }] },
        { kind: 'list', ordered: false, items: [{ blocks: [{ kind: 'paragraph', runs: [{ text: 'b' }] }] }] },
      ],
    }
    expect(normalizeStyledText(twoBullet)).toEqual({
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'a' }] }] },
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'b' }] }] },
          ],
        },
      ],
    })

    // Merge retains the FIRST list's start (2), not the second's (5).
    const twoOrdered: StyledText = {
      blocks: [
        { kind: 'list', ordered: true, start: 2, items: [{ blocks: [{ kind: 'paragraph', runs: [{ text: 'x' }] }] }] },
        { kind: 'list', ordered: true, start: 5, items: [{ blocks: [{ kind: 'paragraph', runs: [{ text: 'y' }] }] }] },
      ],
    }
    const mergedOrdered = normalizeStyledText(twoOrdered)
    expect(mergedOrdered.blocks).toHaveLength(1)
    expect(mergedOrdered.blocks[0]).toEqual({
      kind: 'list',
      ordered: true,
      start: 2,
      items: [
        { blocks: [{ kind: 'paragraph', runs: [{ text: 'x' }] }] },
        { blocks: [{ kind: 'paragraph', runs: [{ text: 'y' }] }] },
      ],
    })
  })

  it('test_UAT_AC624_headings_map_atx_levels_and_carry_inline_runs', () => {
    // AC-624: `#`…`######` map to levels 1–6, each round-tripping to the same
    // level; inline overrides within a heading survive.
    for (let level = 1; level <= 6; level++) {
      const markup = `${'#'.repeat(level)} Title`
      expect(parseStyledText(markup)).toEqual({
        blocks: [{ kind: 'heading', level, runs: [{ text: 'Title' }] }],
      })
      expect(serializeStyledText(parseStyledText(markup))).toBe(markup)
    }
    // A heading carrying a styled run round-trips both the level and the run's
    // overrides.
    const styledHeading: StyledText = {
      blocks: [
        { kind: 'heading', level: 2, runs: [{ text: 'Bold', emphasis: 'bold' }, { text: ' plain', fontSizePx: 18 }] },
      ],
    }
    expect(parseStyledText(serializeStyledText(styledHeading))).toEqual(styledHeading)
  })

  it('test_UAT_AC625_code_blocks_preserve_verbatim_text_and_language', () => {
    // AC-625: a code block preserves its text byte-for-byte; inline-notation-like
    // content stays literal; an optional language is preserved (and absence is
    // valid); a backtick run widens the fence.
    const withLang: StyledText = {
      blocks: [{ kind: 'code', language: 'ts', text: 'const a = [1]{2}\n// *not italic* and `ticks`' }],
    }
    const withLangMarkup = serializeStyledText(withLang)
    expect(withLangMarkup).toBe('```ts\nconst a = [1]{2}\n// *not italic* and `ticks`\n```')
    expect(parseStyledText(withLangMarkup)).toEqual(withLang)

    // No language tag is equally valid.
    const noLang: StyledText = { blocks: [{ kind: 'code', text: 'no language here' }] }
    expect(serializeStyledText(noLang)).toBe('```\nno language here\n```')
    expect(parseStyledText(serializeStyledText(noLang))).toEqual(noLang)

    // A ``` run inside the text widens the enclosing fence to four backticks.
    const withFenceRun: StyledText = { blocks: [{ kind: 'code', text: 'a\n```\nb' }] }
    const widenedMarkup = serializeStyledText(withFenceRun)
    expect(widenedMarkup.startsWith('````\n')).toBe(true)
    expect(parseStyledText(widenedMarkup)).toEqual(withFenceRun)
  })

  it('test_UAT_AC626_blockquotes_are_containers_of_child_blocks', () => {
    // AC-626: a blockquote holds child blocks. Multi-paragraph, nested, and
    // list-containing blockquotes all round-trip, preserving nested structure.
    const multiPara: StyledText = {
      blocks: [
        {
          kind: 'blockquote',
          blocks: [
            { kind: 'paragraph', runs: [{ text: 'Line one of the quote.' }] },
            { kind: 'paragraph', runs: [{ text: 'Line two.' }] },
            { kind: 'paragraph', runs: [{ text: '— Ada', emphasis: 'italic' }] },
          ],
        },
      ],
    }
    expect(parseStyledText(serializeStyledText(multiPara))).toEqual(multiPara)

    const nested: StyledText = {
      blocks: [
        {
          kind: 'blockquote',
          blocks: [
            { kind: 'paragraph', runs: [{ text: 'Outer.' }] },
            { kind: 'blockquote', blocks: [{ kind: 'paragraph', runs: [{ text: 'Inner.' }] }] },
          ],
        },
      ],
    }
    expect(serializeStyledText(nested)).toBe('> Outer.\n>\n> > Inner.')
    expect(parseStyledText(serializeStyledText(nested))).toEqual(nested)

    const withList: StyledText = {
      blocks: [
        {
          kind: 'blockquote',
          blocks: [
            {
              kind: 'list',
              ordered: false,
              items: [
                { blocks: [{ kind: 'paragraph', runs: [{ text: 'quoted one' }] }] },
                { blocks: [{ kind: 'paragraph', runs: [{ text: 'quoted two' }] }] },
              ],
            },
          ],
        },
      ],
    }
    expect(parseStyledText(serializeStyledText(withList))).toEqual(withList)
  })

  it('test_UAT_AC627_tables_roundtrip_as_grid_of_block_cells', () => {
    // AC-627: a table is a 2-D grid of rows × cells; cells hold child blocks.
    // Grid dimensions and per-cell content survive the round-trip.
    const grid: StyledText = {
      blocks: [
        {
          kind: 'table',
          rows: [
            [
              { blocks: [{ kind: 'paragraph', runs: [{ text: 'Plan', fontWeight: 700 }] }] },
              { blocks: [{ kind: 'paragraph', runs: [{ text: 'Price' }] }] },
            ],
            [
              { blocks: [{ kind: 'paragraph', runs: [{ text: 'Pro' }] }] },
              { blocks: [{ kind: 'paragraph', runs: [{ text: '£9', color: '#314158' }] }] },
            ],
          ],
        },
      ],
    }
    const parsedGrid = parseStyledText(serializeStyledText(grid))
    expect(parsedGrid).toEqual(grid)
    // Explicit dimension assertions: 2 rows × 2 columns preserved.
    const table = parsedGrid.blocks[0]
    expect(table.kind).toBe('table')
    if (table.kind === 'table') {
      expect(table.rows).toHaveLength(2)
      expect(table.rows.every((r) => r.length === 2)).toBe(true)
    }

    // A cell holding block content (heading + paragraph) survives.
    const blockCell: StyledText = {
      blocks: [
        {
          kind: 'table',
          rows: [
            [
              {
                blocks: [
                  { kind: 'heading', level: 3, runs: [{ text: 'Cell title' }] },
                  { kind: 'paragraph', runs: [{ text: 'Cell body copy.' }] },
                ],
              },
            ],
          ],
        },
      ],
    }
    expect(parseStyledText(serializeStyledText(blockCell))).toEqual(blockCell)
  })

  it('test_UAT_AC628_list_items_hold_child_blocks', () => {
    // AC-628: a list item is a container of child blocks — it may nest a
    // sub-list or span multiple paragraphs and round-trips losslessly; a
    // single-line item still serializes to the compact one-line form.
    const nested: StyledText = {
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [
            {
              blocks: [
                { kind: 'paragraph', runs: [{ text: 'Fruit' }] },
                {
                  kind: 'list',
                  ordered: false,
                  items: [
                    { blocks: [{ kind: 'paragraph', runs: [{ text: 'Apple' }] }] },
                    { blocks: [{ kind: 'paragraph', runs: [{ text: 'Pear' }] }] },
                  ],
                },
              ],
            },
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'Veg' }] }] },
          ],
        },
      ],
    }
    expect(parseStyledText(serializeStyledText(nested))).toEqual(nested)

    // A multi-paragraph item keeps both blocks.
    const multiPara: StyledText = {
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            {
              blocks: [
                { kind: 'paragraph', runs: [{ text: 'First para.' }] },
                { kind: 'paragraph', runs: [{ text: 'Second para.' }] },
              ],
            },
          ],
        },
      ],
    }
    expect(serializeStyledText(multiPara)).toBe('1. First para.\n\n   Second para.')
    expect(parseStyledText(serializeStyledText(multiPara))).toEqual(multiPara)

    // A single-line item (one paragraph of one inherited run) still serializes
    // to the compact single-line form.
    const singleLine: StyledText = {
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [{ blocks: [{ kind: 'paragraph', runs: [{ text: 'just one line' }] }] }],
        },
      ],
    }
    expect(serializeStyledText(singleLine)).toBe('- just one line')
    expect(parseStyledText(serializeStyledText(singleLine))).toEqual(singleLine)
  })
})
