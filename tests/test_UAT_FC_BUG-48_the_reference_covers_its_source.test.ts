import { describe, expect, it } from 'vitest'
import {
  l1VocabularyGaps,
  projectL1Vocabulary,
} from '../tools/generate/src/cli/kb-projection'
import {
  L1_DOCUMENT_KEYS,
  L1_ENVELOPE,
  L1_STRUCTURAL_RULES,
  danglingAssetReferences,
  danglingFontFamilies,
  l1DocumentSchema,
  validateL1,
  type L1Document,
} from '../packages/site-schema/src/index'

/**
 * BUG-48 — **`REF-l1` was reachable and incomplete**, which is the half of the bug
 * an index check cannot see.
 *
 * The other suite establishes that a document in the corpus and not in the index is
 * refused before it ships. This one is about the failure that passes that check
 * completely. `REF-l1` was in the corpus, would have been in the index after one
 * rebuild, and STILL could not answer the question [[CHAT-35]] asked — because
 * `projectL1Vocabulary` rendered three things (the element union, the shapes it
 * reaches, the numeric envelope) and **nothing read `l1DocumentSchema`**. A
 * document calling itself "the vocabulary a page is written in" said nothing about
 * the page: no background, no text colour, no fonts, no content column.
 *
 * THAT WAS SURVIVABLE ONLY WHILE IT WAS UNWRITABLE. A reference omitting what
 * nothing can set is merely incomplete. [[REQ-175]] made all five document keys
 * writable through `get_page_style` / `set_page_style`, at which point it became
 * the [[CHAT-35]] failure with the pieces rearranged: the capability exists, the
 * tool manual says the operation exists, and the field reference does not say what
 * may be written into it.
 *
 * AND THE LIMITS SECTION KEPT HALF A PROMISE. "A page outside these is refused
 * whole; nothing is clamped silently" was true of the arithmetic and silent about
 * every structural refusal a consultant will actually meet.
 *
 * The assertions below are made AGAINST THE SOURCE rather than against expected
 * strings, for the reason REQ-165's suite gives and this ticket sharpens: a
 * hand-written list of what a document ought to contain is the exact artefact that
 * goes stale without saying so, and writing one here to guard against one elsewhere
 * would be the joke telling itself.
 */

const BODY = projectL1Vocabulary().body

describe('BUG-48 — the reference projects the page, not only its tree', () => {
  it('test_UAT_FC_BUG-48_every_document_key_appears_in_the_reference', () => {
    // Derived from `Object.keys(l1DocumentSchema.shape)`, so the sixth document
    // key documents itself the day it is declared and fails here the same day if
    // it does not.
    expect(L1_DOCUMENT_KEYS.length).toBeGreaterThan(0)
    for (const key of L1_DOCUMENT_KEYS) {
      expect(BODY, `document key '${key}' is absent from REF-l1`).toContain(`\`${key}\``)
    }

    // The section exists as a section, so a reader looking for the page finds a
    // heading rather than a field line buried among an element's.
    expect(BODY).toContain('## The page itself')

    // The tree comes with it. `L1_DOCUMENT_KEYS` excludes `root` because that
    // constant is about WRITABILITY through the control surface — `root` is not
    // unreachable, it IS the address "0". This is a vocabulary, not a grant.
    expect(Object.keys(l1DocumentSchema.shape)).toContain('root')
    expect(BODY).toContain('`root`')
  })

  it('test_UAT_FC_BUG-48_the_keys_the_consultant_can_now_write_say_what_they_take', () => {
    // The concrete [[CHAT-35]] questions, each answered by a type the schema
    // itself supplies rather than by a sentence anybody wrote here. A key named
    // with no type beside it would be a heading pretending to be documentation.
    const section = BODY.slice(
      BODY.indexOf('## The page itself'),
      BODY.indexOf('## The kinds of element'),
    )
    expect(section).toMatch(/`widths` — a list of number/)
    expect(section).toMatch(/`background` — /)
    expect(section).toMatch(/`textColor` — /)
    expect(section).toMatch(/`column` — /)
    expect(section).toMatch(/`resources` — /)
  })

  it('test_UAT_FC_BUG-48_the_shapes_a_document_key_reaches_are_described_once', () => {
    // The font face was previously unreachable from the element union alone, so
    // "what does `resources` take" had no answer anywhere in 477 lines. Pushing
    // the document's field schemas onto the SAME walk that already collects the
    // elements' means it is described in the section that exists for that, rather
    // than duplicated into a new one.
    expect(BODY).toContain('### font face')
    const face = BODY.slice(BODY.indexOf('### font face'))
    expect(face).toMatch(/`family` — text/)
    expect(face).toMatch(/`src` — text/)

    // Described ONCE. The whole file exists to avoid a second copy of a fact.
    expect(BODY.split('### font face').length - 1).toBe(1)
  })
})

describe('BUG-48 — the limits section keeps its whole promise', () => {
  it('test_UAT_FC_BUG-48_every_structural_rule_is_stated_beside_the_numeric_bounds', () => {
    const limits = BODY.slice(BODY.indexOf('## The limits every page is held to'))
    expect(limits).toContain('A page outside these is refused whole')

    // Both halves under the one promise: a bound and a structural refusal both
    // refuse a page whole, so they belong in the same section.
    for (const key of Object.keys(L1_ENVELOPE)) {
      expect(limits, `envelope bound '${key}' is absent`).toContain(`\`${key}\``)
    }
    expect(Object.keys(L1_STRUCTURAL_RULES).length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-48_the_refusals_that_are_not_numbers_are_projected_not_authored', () => {
    // Each rule appears as PROSE, and the prose is the doc comment above its entry
    // in the validator — lifted, never written here. `l1VocabularyGaps` reports a
    // rule whose sentence is missing from the body, so an empty result for the
    // structural class is the assertion that all of them landed.
    const missing = l1VocabularyGaps().filter((gap) => gap.startsWith('structural rule'))
    expect(missing).toEqual([])

    // And the specific ones [[CHAT-35]] and [[REQ-175]] make load-bearing.
    const limits = BODY.slice(BODY.indexOf('## The limits every page is held to'))
    expect(limits).toMatch(/unique/)
    expect(limits).toMatch(/palette/)
    expect(limits).toMatch(/column/)
    expect(limits).toMatch(/font family/)
  })

  it('test_UAT_FC_BUG-48_every_stated_rule_is_one_the_validator_actually_refuses', () => {
    // THIS IS WHAT KEEPS THE TABLE FROM BECOMING DECORATION. A table of rule
    // statements that only a document generator read would be a second copy of
    // the validator's behaviour, free to describe a rule that was relaxed two
    // releases ago — the exact class of stale claim this ticket is about. So every
    // entry is provoked, and the refusal it produces must carry that entry's own
    // words.
    const refusals = (doc: unknown): string[] => {
      const result = validateL1(doc)
      return result.ok ? [] : result.errors.map((e) => e.message)
    }
    const page = (over: Partial<L1Document>): L1Document =>
      ({
        widths: [360, 1280],
        root: { kind: 'box', children: [] },
        ...over,
      }) as L1Document

    const provoked: Record<keyof typeof L1_STRUCTURAL_RULES, string[]> = {
      ascendingWidths: refusals(page({ widths: [1280, 360] })),
      ascendingKeyframes: refusals(
        page({
          root: {
            kind: 'text',
            text: 'x',
            geometry: {
              keyframes: [
                { at: 1280, x: 0, y: 0, width: 10 },
                { at: 360, x: 0, y: 0, width: 10 },
              ],
              segments: ['snap'],
            },
          },
        } as Partial<L1Document>),
      ),
      declaredKeyframeWidth: refusals(
        page({
          root: {
            kind: 'text',
            text: 'x',
            geometry: { keyframes: [{ at: 999, x: 0, y: 0, width: 10 }] },
          },
        } as Partial<L1Document>),
      ),
      declaredPaletteEntry: refusals(page({ background: { ref: 'nowhere' } } as Partial<L1Document>)),
      anchorNeedsColumn: refusals(
        page({
          root: {
            kind: 'text',
            text: 'x',
            geometry: {
              keyframes: [{ at: 360, x: 0, y: 0, width: 10 }],
              anchor: { x: { px: 0 } },
            },
          },
        } as Partial<L1Document>),
      ),
      uniqueNodeIds: refusals(
        page({
          root: {
            kind: 'box',
            children: [
              { kind: 'text', id: 'twice', text: 'a' },
              { kind: 'text', id: 'twice', text: 'b' },
            ],
          },
        } as Partial<L1Document>),
      ),
      allowedUrlScheme: refusals(
        page({
          root: { kind: 'image', src: 'javascript:alert(1)', alt: '' },
        } as Partial<L1Document>),
      ),
      // The two REQ-175 findings are reported rather than refused, and
      // deliberately: both references can dangle for a reason nobody can fix — a
      // capture that could not mirror a face or an image — and refusing the
      // document would mean refusing the import and never opening the page again.
      // The rule is stated on the WRITE. So they are provoked through their own
      // finders, which is where the rule lives.
      servedFontFamily: danglingFontFamilies(
        { kind: 'text', text: 'x', axes: { fontFamily: 'Satoshi' } },
        [],
      ).map((f) => f.message),
      heldAssetReference: danglingAssetReferences(
        { kind: 'image', src: '/assets/logo.svg' },
        [],
      ).map((f) => f.message),
    }

    for (const [key, statement] of Object.entries(L1_STRUCTURAL_RULES)) {
      const messages = provoked[key as keyof typeof L1_STRUCTURAL_RULES]
      expect(messages.length, `rule '${key}' provoked no refusal at all`).toBeGreaterThan(0)
      expect(
        messages.some((m) => m.includes(statement)),
        `rule '${key}' is stated in the reference but no refusal carries it: ${messages.join(' | ')}`,
      ).toBe(true)
    }
  })
})

describe('BUG-48 — a projection is checked against its declared source', () => {
  it('test_UAT_FC_BUG-48_the_reference_covers_everything_it_says_it_is_generated_from', () => {
    // The guard the first half of this ticket needs and does not have. Presence in
    // the index is necessary and insufficient: this defect satisfies it. `REF-l1`
    // says it is generated from "the L1 element schemas and their validation
    // envelope", and a schema the projection never reads makes that line untrue.
    expect(projectL1Vocabulary().source).toBe(
      'the L1 element schemas and their validation envelope',
    )
    expect(l1VocabularyGaps()).toEqual([])
  })

  it('test_UAT_FC_BUG-48_the_coverage_check_has_teeth', () => {
    // A coverage assertion nobody has watched fail is indistinguishable from one
    // that passes vacuously — and a vacuous check is how this document got here.
    // Cut the limits section out and every bound and every rule must be named,
    // each one derived from its declaration at the moment of the check.
    const withoutLimits = BODY.slice(0, BODY.indexOf('## The limits every page is held to'))
    const gaps = l1VocabularyGaps(withoutLimits)
    for (const key of Object.keys(L1_ENVELOPE)) {
      expect(gaps).toContain(`envelope bound ${key}`)
    }
    for (const key of Object.keys(L1_STRUCTURAL_RULES)) {
      expect(gaps).toContain(`structural rule ${key}`)
    }

    // And the element kinds, which the truncated body still holds, are NOT
    // reported — a check that fails on everything says nothing about anything.
    expect(gaps.filter((gap) => gap.startsWith('element kind'))).toEqual([])

    // Cutting the page section instead reports every document key and nothing
    // else. It can be that exact because the check is SCOPED to the section that
    // is supposed to render each thing: `widths` is named again by a structural
    // rule and `fontSizePx` by a text axis, so a whole-body substring search would
    // answer "present" for a document missing the section entirely — which is the
    // question that was actually wrong here.
    const withoutPage = l1VocabularyGaps(BODY.slice(BODY.indexOf('## The kinds of element')))
    expect(withoutPage.sort()).toEqual([...L1_DOCUMENT_KEYS].map((k) => `document key ${k}`).sort())
  })
})
