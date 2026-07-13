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
 * UATs for REQ-57 (DOC-22 §8) — the richer block *kinds* deferred from REQ-54:
 * headings, code blocks, rich/nested blockquotes, tables, and nested / multi-
 * block list items. REQ-54 landed the block tree + `paragraph`/`list`; this
 * suite pins each new kind's notation and drains the deferred backlog under the
 * same lead contract — the round-trip invariant `parse(serialize(x)) ===
 * normalize(x)` (DOC-22 §5) — now extended over the widened block space via a
 * recursive generator that emits every kind and nests them inside one another.
 */

// A deterministic pseudo-random generator (the repo has no `fast-check`), seeded
// so the "property" test explores a wide, reproducible space of documents. Same
// xorshift32 as the REQ-54 suite.
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
// Code text laden with markup that must survive verbatim (no inline parsing),
// including a `` ``` `` run that forces the serializer to widen its fence.
const CODE_ATOMS = ['plain code', 'a[b]{c}\n*not emphasis*', '> not a quote\n- not a list', 'const x = `y`', '# not heading']
const LANGS = ['ts', 'js', 'py', 'sh']

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

// One run whose formatting signature differs from a trivial inherited run, so a
// generated list is already normalized and the invariant reduces to exact
// `parse(serialize(x)) === x`. Mirrors the REQ-54 `makeRun`.
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

// A non-container block — paragraph, heading, or code — the recursion floor.
function makeLeaf(rng: () => number, seedIndex: () => number): Block {
  const roll = rng()
  if (roll < 0.2) return { kind: 'heading', level: (1 + Math.floor(rng() * 6)) as HeadingLevel, runs: makeRuns(rng, seedIndex) }
  if (roll < 0.35) return makeCode(rng)
  return makeParagraph(rng, seedIndex)
}

// One list item — usually a single paragraph; at depth, a multi-block item (a
// second paragraph or a nested container), exercising the widened `ListItem`.
function makeItem(rng: () => number, seedIndex: () => number, depth: number): ListItem {
  if (depth > 0 && rng() < 0.4) {
    const blocks: Block[] = [makeParagraph(rng, seedIndex)]
    blocks.push(rng() < 0.6 ? makeBlock(rng, seedIndex, depth - 1) : makeParagraph(rng, seedIndex))
    return { blocks }
  }
  return { blocks: [makeParagraph(rng, seedIndex)] }
}

// A sibling block sequence with adjacent same-type lists merged — two adjacent
// same-`ordered` lists are indistinguishable in the notation (the module merges
// them in `normalizeStyledText`), so generated content must already be in that
// normal form to be its own fixpoint.
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

// One block, possibly a container (list / blockquote / table) that recurses
// until `depth` runs out. Containers hold *blocks*, so this is the generator
// analogue of the recursive-descent parser.
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

describe('REQ-57 rich text blocks — round-trip invariant over the widened space (DOC-22 §5)', () => {
  it('test_UAT_FC_REQ-57_roundtrip_all_kinds', () => {
    // Property: for a wide, deterministic space of block documents — headings,
    // code, tables, rich blockquotes and nested / multi-block list items,
    // nested inside one another — parse(serialize(x)) reproduces x exactly, and
    // the generated document is its own normalization fixpoint.
    for (let seed = 1; seed <= 500; seed++) {
      const content = makeContent(seed)
      const markup = serializeStyledText(content)
      expect(parseStyledText(markup), `seed ${seed}:\n${markup}`).toEqual(content)
      expect(normalizeStyledText(content)).toEqual(content)
    }
  })
})

describe('REQ-57 rich text blocks — tables (DOC-22 §8)', () => {
  it('test_UAT_FC_REQ-57_table_roundtrips', () => {
    // A 2-D table (2 rows × 2 cells) whose cells carry inline-styled runs parses
    // and serializes losslessly; cells are paired positionally by (row, col).
    const content: StyledText = {
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
    const markup = serializeStyledText(content)
    expect(markup.split('\n')[0]).toBe('::: table')
    expect(parseStyledText(markup)).toEqual(content)
  })

  it('test_UAT_FC_REQ-57_table_cell_holds_blocks', () => {
    // A cell is a block container: it can hold a heading + paragraph, not just
    // one run. The nested structure round-trips.
    const content: StyledText = {
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
    expect(parseStyledText(serializeStyledText(content))).toEqual(content)
  })
})

describe('REQ-57 rich text blocks — code (DOC-22 §8)', () => {
  it('test_UAT_FC_REQ-57_code_block_is_raw', () => {
    // A fenced code block preserves its text verbatim — no inline `[..]{..}` /
    // `*` interpretation — and its language.
    const content: StyledText = {
      blocks: [{ kind: 'code', language: 'ts', text: 'const a = [1]{2}\n// *not italic* and `ticks`' }],
    }
    const markup = serializeStyledText(content)
    expect(markup).toBe('```ts\nconst a = [1]{2}\n// *not italic* and `ticks`\n```')
    const parsed = parseStyledText(markup)
    expect(parsed).toEqual(content)
    // The code text is one raw block, not inline runs.
    expect(parsed.blocks[0]).toEqual(content.blocks[0])
  })

  it('test_UAT_FC_REQ-57_code_fence_widens_for_backticks', () => {
    // Code whose text itself contains a ```` ``` ```` run is fenced with four
    // backticks so the inner run does not close the block early.
    const content: StyledText = { blocks: [{ kind: 'code', text: 'a\n```\nb' }] }
    const markup = serializeStyledText(content)
    expect(markup.startsWith('````\n')).toBe(true)
    expect(parseStyledText(markup)).toEqual(content)
  })

  it('test_UAT_FC_REQ-57_code_block_without_language', () => {
    const content: StyledText = { blocks: [{ kind: 'code', text: 'no language here' }] }
    expect(serializeStyledText(content)).toBe('```\nno language here\n```')
    expect(parseStyledText(serializeStyledText(content))).toEqual(content)
  })
})

describe('REQ-57 rich text blocks — headings (DOC-22 §8)', () => {
  it('test_UAT_FC_REQ-57_heading_levels', () => {
    // `#`…`######` map to heading levels 1–6; a 7th `#` is not a heading.
    for (let level = 1; level <= 6; level++) {
      const markup = `${'#'.repeat(level)} Title`
      expect(parseStyledText(markup)).toEqual({
        blocks: [{ kind: 'heading', level, runs: [{ text: 'Title' }] }],
      })
      expect(serializeStyledText(parseStyledText(markup))).toBe(markup)
    }
    expect(parseStyledText('####### Too deep').blocks[0].kind).toBe('paragraph')
  })

  it('test_UAT_FC_REQ-57_heading_carries_inline_runs', () => {
    // A heading is a run container — inline emphasis / spans inside it survive.
    const content: StyledText = {
      blocks: [
        { kind: 'heading', level: 2, runs: [{ text: 'Bold', emphasis: 'bold' }, { text: ' plain' }] },
      ],
    }
    expect(parseStyledText(serializeStyledText(content))).toEqual(content)
  })

  it('test_UAT_FC_REQ-57_paragraph_leading_hash_is_guarded', () => {
    // Paragraph text that merely starts with `#` is escaped so it stays a
    // paragraph rather than re-parsing as a heading.
    const content: StyledText = { blocks: [{ kind: 'paragraph', runs: [{ text: '# not a heading' }] }] }
    const markup = serializeStyledText(content)
    expect(parseStyledText(markup)).toEqual(content)
    expect(parseStyledText(markup).blocks[0].kind).toBe('paragraph')
  })
})

describe('REQ-57 rich text blocks — nested / multi-block list items (DOC-22 §8)', () => {
  it('test_UAT_FC_REQ-57_nested_list_item', () => {
    // A list item containing a nested list round-trips: the item holds a
    // paragraph plus a child `list` block.
    const content: StyledText = {
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
    const markup = serializeStyledText(content)
    // The nested list is indented under its item's marker.
    expect(markup).toBe('- Fruit\n\n  - Apple\n  - Pear\n- Veg')
    expect(parseStyledText(markup)).toEqual(content)
  })

  it('test_UAT_FC_REQ-57_multi_paragraph_list_item', () => {
    // An item spanning two paragraphs keeps both blocks, indented under the
    // marker with a blank line between.
    const content: StyledText = {
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
    const markup = serializeStyledText(content)
    expect(markup).toBe('1. First para.\n\n   Second para.')
    expect(parseStyledText(markup)).toEqual(content)
  })
})

describe('REQ-57 rich text blocks — rich / nested blockquotes (DOC-22 §8)', () => {
  it('test_UAT_FC_REQ-57_rich_blockquote', () => {
    // A blockquote is a block container: a multi-paragraph quote with an
    // attribution round-trips as one `blockquote` holding three paragraphs.
    const content: StyledText = {
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
    const markup = serializeStyledText(content)
    // Emphasis serializes to the canonical self-delimiting span form (the `*…*`
    // markdown shorthand is an author-input convenience the parser also accepts).
    expect(markup).toBe('> Line one of the quote.\n>\n> Line two.\n>\n> [— Ada]{emphasis=italic}')
    expect(parseStyledText(markup)).toEqual(content)
  })

  it('test_UAT_FC_REQ-57_nested_blockquote', () => {
    // A quote nested inside a quote round-trips (each level adds a `> `).
    const content: StyledText = {
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
    const markup = serializeStyledText(content)
    expect(markup).toBe('> Outer.\n>\n> > Inner.')
    expect(parseStyledText(markup)).toEqual(content)
  })

  it('test_UAT_FC_REQ-57_blockquote_holds_a_list', () => {
    // A blockquote can wrap block structure, not just paragraphs — a quoted
    // bullet list round-trips.
    const content: StyledText = {
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
    const markup = serializeStyledText(content)
    expect(markup).toBe('> - quoted one\n> - quoted two')
    expect(parseStyledText(markup)).toEqual(content)
  })
})
