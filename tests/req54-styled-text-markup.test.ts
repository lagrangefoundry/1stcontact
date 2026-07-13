import { describe, it, expect } from 'vitest'
import {
  parseStyledText,
  serializeStyledText,
  normalizeRuns,
  type StyledRun,
  type StyledText,
} from '../packages/framework/src/modules/text-markup'

/**
 * UATs for REQ-54 workstream 2 (DOC-22 §4/§5) — the styled-text *notation*: the
 * pure, lossless bridge between the runtime run-list `{ baseline, runs[] }` and
 * its markdown + attribute-span string surface. The lead acceptance test is the
 * round-trip invariant `parse(serialize(x)) === normalize(x)` (DOC-22 §5); the
 * rest pin the markdown desugaring, the generic attribute-span, per-run override
 * inheritance, and delimiter escaping.
 */

// A deterministic pseudo-random generator (the repo has no `fast-check`), seeded
// so the "property" test explores a wide, reproducible space of run lists —
// including text laden with the notation delimiters and dense per-run overrides.
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

const TEXT_ATOMS = ['abc', 'a b', 'x[y]z', '{k=v}', 'a*b', 'back\\slash', 'quote " it', '] } close', ':::lead', '']
const COLORS = ['#314158', '#fff', '#0a0a0aff', 'primary', 'accent']
const SIZES = [14, 16, 18, 24, '5xl', 'lg']
const WEIGHTS = [400, 517, 700, 'medium', 'bold']
const EMPHASES = ['italic', 'bold', 'bold-italic'] as const

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

// Build one run with a distinct-from-predecessor formatting signature, so the
// generated list is already normalized (no two adjacent runs merge) and the
// invariant reduces to exact `parse(serialize(x)) === x`.
function makeRun(rng: () => number, index: number, inQuote: boolean): StyledRun {
  const run: StyledRun = { text: pick(rng, TEXT_ATOMS) || 'x' }
  if (rng() < 0.4) run.fontSizePx = pick(rng, SIZES)
  if (rng() < 0.4) run.fontWeight = pick(rng, WEIGHTS)
  if (rng() < 0.4) run.color = pick(rng, COLORS)
  if (rng() < 0.2) run.letterSpacingPx = pick(rng, [0, 1, 2])
  if (rng() < 0.2) run.lineHeightPx = pick(rng, [20, 26, 75])
  if (rng() < 0.15) run.emphasis = pick(rng, EMPHASES)
  if (rng() < 0.15) run.href = pick(rng, ['/a', 'https://x.io/p', 'mailto:a@b.co'])
  if (inQuote) run.blockquote = true
  // Guarantee this run's signature differs from a trivial inherited run so
  // adjacent plain runs (which would legitimately merge) are not generated.
  if (Object.keys(run).length === 1) run.fontSizePx = 12 + index
  return run
}

function makeContent(seed: number): StyledText {
  const rng = makeRng(seed)
  const runs: StyledRun[] = []
  const paragraphs = 1 + Math.floor(rng() * 3)
  for (let p = 0; p < paragraphs; p++) {
    const inQuote = rng() < 0.25
    const runCount = 1 + Math.floor(rng() * 3)
    for (let r = 0; r < runCount; r++) {
      const run = makeRun(rng, runs.length, inQuote)
      if (p > 0 && r === 0) run.paragraphBreak = true
      runs.push(run)
    }
  }
  const content: StyledText = { runs: normalizeRuns(runs) }
  if (rng() < 0.5) {
    content.baseline = { fontSizePx: pick(rng, SIZES), color: pick(rng, COLORS) }
  }
  return content
}

describe('REQ-54 styled-text markup — round-trip invariant (DOC-22 §5)', () => {
  it('test_UAT_FC_REQ-54_roundtrip_invariant', () => {
    // Property: for a wide, deterministic space of run lists (delimiter-laden
    // text, dense per-run overrides, paragraphs, blockquotes, baselines),
    // parse(serialize(x)) reproduces the normalized run list exactly.
    for (let seed = 1; seed <= 500; seed++) {
      const content = makeContent(seed)
      const round = parseStyledText(serializeStyledText(content))
      expect(round, `seed ${seed}: ${serializeStyledText(content)}`).toEqual(content)
    }
  })

  it('test_UAT_FC_REQ-54_roundtrip_dense_overrides', () => {
    // A single run carrying every scalar axis at once still round-trips.
    const content: StyledText = {
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
    }
    expect(parseStyledText(serializeStyledText(content))).toEqual(content)
  })
})

describe('REQ-54 styled-text markup — markdown desugars to runs (DOC-22 §4)', () => {
  it('test_UAT_FC_REQ-54_markdown_desugars_to_runs', () => {
    expect(parseStyledText('*x*').runs).toEqual([{ text: 'x', emphasis: 'italic' }])
    expect(parseStyledText('**x**').runs).toEqual([{ text: 'x', emphasis: 'bold' }])
    expect(parseStyledText('[x](https://a.co)').runs).toEqual([
      { text: 'x', href: 'https://a.co' },
    ])
    expect(parseStyledText('> quiet line').runs).toEqual([
      { text: 'quiet line', blockquote: true },
    ])
  })

  it('test_UAT_FC_REQ-54_bare_paragraph_is_single_inherited_run', () => {
    // A plain paragraph compiles to one run that inherits the baseline entirely.
    expect(parseStyledText('just some prose here')).toEqual({
      runs: [{ text: 'just some prose here' }],
    })
  })
})

describe('REQ-54 styled-text markup — generic attribute-span (DOC-22 §4)', () => {
  it('test_UAT_FC_REQ-54_attribute_span_overrides', () => {
    // Keys ARE the TextRun field names; the run carries exactly those overrides
    // (numeric axis coerced to a number) and inherits everything else.
    expect(parseStyledText('[x]{fontSizePx=18 color=#314158}').runs).toEqual([
      { text: 'x', fontSizePx: 18, color: '#314158' },
    ])
  })

  it('test_UAT_FC_REQ-54_baseline_fence_overrides_block', () => {
    // A `::: {…}` fence supplies the block baseline; runs inside inherit it.
    const parsed = parseStyledText('::: {fontSizePx=16 color=#314158}\nhello\n:::')
    expect(parsed).toEqual({
      baseline: { fontSizePx: 16, color: '#314158' },
      runs: [{ text: 'hello' }],
    })
  })
})

describe('REQ-54 styled-text markup — escaping (DOC-22 §4.1)', () => {
  it('test_UAT_FC_REQ-54_escaping_literal_delimiters', () => {
    // Run text containing literal notation delimiters serializes escaped and
    // round-trips to the identical run.
    const content: StyledText = { runs: [{ text: 'a [b] {c} * d ` e', color: '#000000' }] }
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
      runs: [{ text: 'x', href: '/a?q=1 2&b=} c', color: '#000000' }],
    }
    const markup = serializeStyledText(content)
    expect(markup).toContain('href="/a?q=1 2&b=} c"')
    expect(parseStyledText(markup)).toEqual(content)
  })
})
