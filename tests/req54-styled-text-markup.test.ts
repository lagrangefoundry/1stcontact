import { describe, it, expect } from 'vitest'
import {
  parseStyledText,
  serializeStyledText,
  normalizeRuns,
  normalizeStyledText,
  type StyledRun,
  type StyledText,
  type Block,
} from '../packages/framework/src/modules/text-markup'

/**
 * UATs for REQ-54 workstream 2 (DOC-22 §4/§5) — the styled-text *notation*: the
 * pure, lossless bridge between the runtime **block-document** `{ baseline,
 * blocks[] }` and its markdown + attribute-span string surface. The lead
 * acceptance test is the round-trip invariant `parse(serialize(x)) ===
 * normalize(x)` (DOC-22 §5); the rest pin the markdown desugaring, the generic
 * attribute-span, per-run override inheritance, delimiter escaping, and — after
 * the block-model pivot — bullet and ordered lists (the 1stcontact "How it
 * works" list that flat runs could not represent).
 */

// A deterministic pseudo-random generator (the repo has no `fast-check`), seeded
// so the "property" test explores a wide, reproducible space of documents —
// paragraphs, blockquotes and lists whose text is laden with the notation
// delimiters and dense per-run overrides.
function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    // xorshift32 — deterministic, uniform enough for structural fuzzing.
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
}

const TEXT_ATOMS = ['abc', 'a b', 'x[y]z', '{k=v}', 'a*b', 'back\\slash', 'quote " it', '] } close', ':::lead']
const COLORS = ['#314158', '#fff', '#0a0a0aff', 'primary', 'accent']
const SIZES = [14, 16, 18, 24, '5xl', 'lg']
const WEIGHTS = [400, 517, 700, 'medium', 'bold']
const EMPHASES = ['italic', 'bold', 'bold-italic'] as const

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

// Build one run with a distinct-from-predecessor formatting signature, so a
// generated run list is already normalized (no two adjacent runs merge) and the
// invariant reduces to exact `parse(serialize(x)) === x`. Every run has
// non-empty text (a list item marker + empty text is a documented boundary).
function makeRun(rng: () => number, index: number): StyledRun {
  const run: StyledRun = { text: pick(rng, TEXT_ATOMS) }
  if (rng() < 0.4) run.fontSizePx = pick(rng, SIZES)
  if (rng() < 0.4) run.fontWeight = pick(rng, WEIGHTS)
  if (rng() < 0.4) run.color = pick(rng, COLORS)
  if (rng() < 0.2) run.letterSpacingPx = pick(rng, [0, 1, 2])
  if (rng() < 0.2) run.lineHeightPx = pick(rng, [20, 26, 75])
  if (rng() < 0.15) run.emphasis = pick(rng, EMPHASES)
  if (rng() < 0.15) run.href = pick(rng, ['/a', 'https://x.io/p', 'mailto:a@b.co'])
  // Guarantee this run's signature differs from a trivial inherited run so
  // adjacent plain runs (which would legitimately merge) are not generated.
  if (Object.keys(run).length === 1) run.fontSizePx = 12 + index
  return run
}

function makeRuns(rng: () => number, seedIndex: () => number): StyledRun[] {
  const count = 1 + Math.floor(rng() * 3)
  const runs: StyledRun[] = []
  for (let r = 0; r < count; r++) runs.push(makeRun(rng, seedIndex()))
  return normalizeRuns(runs)
}

function makeContent(seed: number): StyledText {
  const rng = makeRng(seed)
  let counter = 0
  const seedIndex = () => counter++
  const blocks: Block[] = []
  const blockCount = 1 + Math.floor(rng() * 3)
  for (let b = 0; b < blockCount; b++) {
    const roll = rng()
    if (roll < 0.3) {
      // A list — bullet or ordered, 1..3 items (each a single paragraph block).
      const ordered = rng() < 0.5
      const items = Array.from({ length: 1 + Math.floor(rng() * 3) }, () => ({
        blocks: [{ kind: 'paragraph', runs: makeRuns(rng, seedIndex) } as Block],
      }))
      if (ordered && rng() < 0.4) {
        blocks.push({ kind: 'list', ordered, start: 2 + Math.floor(rng() * 5), items })
      } else {
        blocks.push({ kind: 'list', ordered, items })
      }
    } else if (roll < 0.45) {
      blocks.push({ kind: 'blockquote', blocks: [{ kind: 'paragraph', runs: makeRuns(rng, seedIndex) }] })
    } else {
      blocks.push({ kind: 'paragraph', runs: makeRuns(rng, seedIndex) })
    }
  }
  const content: StyledText = { blocks }
  if (rng() < 0.5) {
    content.baseline = { fontSizePx: pick(rng, SIZES), color: pick(rng, COLORS) }
  }
  return content
}

describe('REQ-54 styled-text markup — round-trip invariant (DOC-22 §5)', () => {
  it('test_UAT_FC_REQ-54_roundtrip_invariant', () => {
    // Property: for a wide, deterministic space of block documents (paragraphs,
    // blockquotes, bullet + ordered lists, delimiter-laden text, dense per-run
    // overrides, baselines), parse(serialize(x)) reproduces x exactly.
    for (let seed = 1; seed <= 500; seed++) {
      const content = makeContent(seed)
      const markup = serializeStyledText(content)
      expect(parseStyledText(markup), `seed ${seed}: ${markup}`).toEqual(content)
      // The generated document is already normalized, so it is its own fixpoint.
      expect(normalizeStyledText(content)).toEqual(content)
    }
  })

  it('test_UAT_FC_REQ-54_roundtrip_dense_overrides', () => {
    // A single run carrying every scalar axis at once still round-trips.
    const content: StyledText = {
      blocks: [
        {
          kind: 'paragraph',
          runs: [
            {
              text: 'Dreaming of healthier meals',
              fontFamily: 'Oswald',
              fontSizePx: 65,
              fontWeight: 517,
              color: '#ffffff',
              letterSpacingPx: 0,
              lineHeightPx: 75,
              paddingLeftPx: 12,
            },
          ],
        },
      ],
    }
    expect(parseStyledText(serializeStyledText(content))).toEqual(content)
  })
})

describe('REQ-54 styled-text markup — block structure (DOC-22 §3)', () => {
  it('test_UAT_FC_REQ-54_paragraphs_are_blocks', () => {
    // Two blank-line-separated paragraphs compile to two paragraph blocks; a
    // bare single paragraph compiles to one paragraph of one inherited run.
    expect(parseStyledText('first para\n\nsecond para')).toEqual({
      blocks: [
        { kind: 'paragraph', runs: [{ text: 'first para' }] },
        { kind: 'paragraph', runs: [{ text: 'second para' }] },
      ],
    })
    expect(parseStyledText('just some prose here')).toEqual({
      blocks: [{ kind: 'paragraph', runs: [{ text: 'just some prose here' }] }],
    })
  })

  it('test_UAT_FC_REQ-54_markdown_desugars_to_runs', () => {
    expect(parseStyledText('*x*').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'x', emphasis: 'italic' }],
    })
    expect(parseStyledText('**x**').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'x', emphasis: 'bold' }],
    })
    expect(parseStyledText('[x](https://a.co)').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'x', href: 'https://a.co' }],
    })
    expect(parseStyledText('> quiet line').blocks[0]).toEqual({
      kind: 'blockquote',
      blocks: [{ kind: 'paragraph', runs: [{ text: 'quiet line' }] }],
    })
  })
})

describe('REQ-54 styled-text markup — lists (DOC-22 §3, 1stcontact)', () => {
  it('test_UAT_FC_REQ-54_ordered_list_covers_1stcontact', () => {
    // The 1stcontact "How it works" ordered list — the block flat runs could not
    // represent — parses to a single ordered `list` block, one item per step.
    const markup =
      '1. Pick a starting point.\n' +
      '2. Drop in your words and pictures.\n' +
      '3. Publish. Every version is kept, so you can always roll back.'
    expect(parseStyledText(markup)).toEqual({
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'Pick a starting point.' }] }] },
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'Drop in your words and pictures.' }] }] },
            {
              blocks: [
                { kind: 'paragraph', runs: [{ text: 'Publish. Every version is kept, so you can always roll back.' }] },
              ],
            },
          ],
        },
      ],
    })
    // …and re-serializes to the identical markup (read/represent symmetry).
    expect(serializeStyledText(parseStyledText(markup))).toEqual(markup)
  })

  it('test_UAT_FC_REQ-54_bullet_list_with_inline_styling', () => {
    // A bullet list whose items carry inline emphasis / spans round-trips.
    const content: StyledText = {
      blocks: [
        {
          kind: 'list',
          ordered: false,
          items: [
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'plain item' }] }] },
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'bold bit', emphasis: 'bold' }, { text: ' then plain' }] }] },
            { blocks: [{ kind: 'paragraph', runs: [{ text: 'sized', fontSizePx: 18 }] }] },
          ],
        },
      ],
    }
    const markup = serializeStyledText(content)
    expect(markup.split('\n')[0]).toBe('- plain item')
    expect(parseStyledText(markup)).toEqual(content)
  })

  it('test_UAT_FC_REQ-54_ordered_list_start_offset', () => {
    // An ordered list beginning at an ordinal other than 1 preserves `start`;
    // the item ordinals are positional (start + index).
    const content: StyledText = {
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
    expect(serializeStyledText(content)).toBe('3. third\n4. fourth')
    expect(parseStyledText(serializeStyledText(content))).toEqual(content)
  })

  it('test_UAT_FC_REQ-54_paragraph_leading_marker_is_guarded', () => {
    // Paragraph text that merely *starts* like a list marker is escaped so it
    // does not re-parse as a list — it stays a paragraph.
    for (const text of ['- not a list', '1. not a list']) {
      const content: StyledText = { blocks: [{ kind: 'paragraph', runs: [{ text }] }] }
      const markup = serializeStyledText(content)
      expect(parseStyledText(markup)).toEqual(content)
      expect(parseStyledText(markup).blocks[0].kind).toBe('paragraph')
    }
  })

  it('test_UAT_FC_REQ-54_list_adjacent_to_paragraphs', () => {
    // A paragraph, then a list, then a paragraph — three distinct blocks.
    const markup = 'Intro line.\n\n- one\n- two\n\nOutro line.'
    const parsed = parseStyledText(markup)
    expect(parsed.blocks.map((b) => b.kind)).toEqual(['paragraph', 'list', 'paragraph'])
    expect(serializeStyledText(parsed)).toBe(markup)
  })
})

describe('REQ-54 styled-text markup — generic attribute-span (DOC-22 §4)', () => {
  it('test_UAT_FC_REQ-54_attribute_span_overrides', () => {
    // Keys ARE the TextRun field names; the run carries exactly those overrides
    // (numeric axis coerced to a number) and inherits everything else.
    expect(parseStyledText('[x]{fontSizePx=18 color=#314158}').blocks[0]).toEqual({
      kind: 'paragraph',
      runs: [{ text: 'x', fontSizePx: 18, color: '#314158' }],
    })
  })

  it('test_UAT_FC_REQ-54_baseline_fence_overrides_block', () => {
    // A `::: {…}` fence supplies the block baseline; runs inside inherit it.
    const parsed = parseStyledText('::: {fontSizePx=16 color=#314158}\nhello\n:::')
    expect(parsed).toEqual({
      baseline: { fontSizePx: 16, color: '#314158' },
      blocks: [{ kind: 'paragraph', runs: [{ text: 'hello' }] }],
    })
  })
})

describe('REQ-54 styled-text markup — escaping (DOC-22 §4.1)', () => {
  it('test_UAT_FC_REQ-54_escaping_literal_delimiters', () => {
    // Run text containing literal notation delimiters serializes escaped and
    // round-trips to the identical run.
    const content: StyledText = {
      blocks: [{ kind: 'paragraph', runs: [{ text: 'a [b] {c} * d ` e', color: '#000000' }] }],
    }
    const markup = serializeStyledText(content)
    expect(markup).toContain('\\[')
    expect(markup).toContain('\\{')
    expect(parseStyledText(markup)).toEqual(content)
  })

  it('test_UAT_FC_REQ-54_quoted_attribute_value', () => {
    // A value with whitespace/delimiters is double-quoted in the span form and
    // re-parses verbatim. The `color` override forces the generic `[text]{…}`
    // form (so `href` becomes a quotable attribute, not a markdown link).
    const content: StyledText = {
      blocks: [{ kind: 'paragraph', runs: [{ text: 'x', href: '/a?q=1 2&b=} c', color: '#000000' }] }],
    }
    const markup = serializeStyledText(content)
    expect(markup).toContain('href="/a?q=1 2&b=} c"')
    expect(parseStyledText(markup)).toEqual(content)
  })
})
