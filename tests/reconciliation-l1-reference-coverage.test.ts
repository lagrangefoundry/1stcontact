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
 * BUG-48 S4–S6 — `REF-l1` covers what it says it is generated from.
 *
 * The behaviour is proved by the FC suite beside this one
 * (`test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts`), which stays
 * untouched. These are the AC-token UATs for the same surface, each deriving its
 * expectation from the declarations at run time — `l1DocumentSchema.shape`,
 * `L1_ENVELOPE`, `L1_STRUCTURAL_RULES` — so no list here can go stale.
 *
 * Every check is SCOPED to the section that is supposed to render the thing
 * (C3): a key named anywhere in five hundred lines is not a key documented where
 * a reader looks for it.
 */

const BODY = projectL1Vocabulary().body

const PAGE = '## The page itself'
const KINDS = '## The kinds of element'
const LIMITS = '## The limits every page is held to'

/** The body from `heading` up to the next `##` heading. */
function section(body: string, heading: string): string {
  const start = body.indexOf(heading)
  if (start < 0) return ''
  const next = body.indexOf('\n## ', start + heading.length)
  return next < 0 ? body.slice(start) : body.slice(start, next)
}

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

describe('AC-2104 — the reference projects the page document', () => {
  it('test_UAT_AC2104_reference_documents_the_page_document_keys_and_the_shapes_they_reach', () => {
    expect(BODY.indexOf(PAGE)).toBeGreaterThanOrEqual(0)
    expect(BODY.indexOf(PAGE)).toBeLessThan(BODY.indexOf(KINDS))

    const pageSection = section(BODY, PAGE)
    const keys = Object.keys(l1DocumentSchema.shape)
    expect(keys.length).toBeGreaterThan(0)
    // Every writable key is a schema key, so the stronger walk covers both.
    for (const key of L1_DOCUMENT_KEYS) expect(keys).toContain(key)
    for (const key of keys) {
      expect(pageSection, `document key '${key}' has no field line in the page section`).toContain(
        `- \`${key}\` — `,
      )
    }

    // The shapes a document key reaches are described once, in the shapes
    // section, and not duplicated into the page section.
    expect(BODY.split('### font face').length - 1).toBe(1)
    expect(pageSection).not.toContain('### font face')
    const face = BODY.slice(BODY.indexOf('### font face'))
    const nextHeading = face.search(/\n#{2,3} /)
    const faceBlock = nextHeading < 0 ? face : face.slice(0, nextHeading)
    expect(faceBlock).toMatch(/`family` — /)
    expect(faceBlock).toMatch(/`src` — /)
  })
})

describe('AC-2105 — the limits section states the structural rules beside the bounds', () => {
  it('test_UAT_AC2105_limits_section_states_every_structural_rule_in_the_validators_words', () => {
    const limits = section(BODY, LIMITS)
    expect(limits).toContain('A page outside these is refused whole')

    for (const key of Object.keys(L1_ENVELOPE)) {
      expect(limits, `envelope bound '${key}' is absent from the limits section`).toContain(
        `\`${key}\``,
      )
    }

    // The rule prose is lifted from the validator's doc comments; the coverage
    // check knows each rule's sentence, so run it against the limits section
    // ALONE — a rule stated anywhere else does not count.
    const rules = Object.keys(L1_STRUCTURAL_RULES)
    expect(rules.length).toBeGreaterThan(0)
    const limitGaps = l1VocabularyGaps(limits).filter(
      (gap) => gap.startsWith('structural rule') || gap.startsWith('envelope bound'),
    )
    expect(limitGaps).toEqual([])
    expect(limits).toContain('The rules that are not numbers')

    // Each stated rule is one the validator actually refuses, in the rule's own
    // words — the table's value is the opening of the real message.
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
        page({ root: { kind: 'image', src: 'javascript:alert(1)', alt: '' } } as Partial<L1Document>),
      ),
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
      expect(
        messages.some((m) => m.includes(statement)),
        `rule '${key}' carries no refusal stating '${statement}': ${messages.join(' | ')}`,
      ).toBe(true)
    }

    // C4 — the reworded refusals keep the phrases their existing readers match.
    expect(provoked.uniqueNodeIds.some((m) => m.includes("duplicate node id 'twice'"))).toBe(true)
    expect(provoked.allowedUrlScheme.some((m) => m.includes('not an allowed URL'))).toBe(true)
    expect(
      provoked.declaredKeyframeWidth.some((m) => m.includes('not one of the document widths')),
    ).toBe(true)
  })
})

describe('AC-2106 — the coverage check holds the projection to its declared source', () => {
  it('test_UAT_AC2106_coverage_check_reports_every_unrendered_part_and_shipped_reference_has_none', () => {
    expect(projectL1Vocabulary().source).toBe('the L1 element schemas and their validation envelope')
    expect(l1VocabularyGaps()).toEqual([])
    expect(l1VocabularyGaps(BODY)).toEqual([])

    // Cut the limits section: every bound and every rule is named, no element kind.
    const withoutLimits = l1VocabularyGaps(BODY.slice(0, BODY.indexOf(LIMITS)))
    for (const key of Object.keys(L1_ENVELOPE)) {
      expect(withoutLimits).toContain(`envelope bound ${key}`)
    }
    for (const key of Object.keys(L1_STRUCTURAL_RULES)) {
      expect(withoutLimits).toContain(`structural rule ${key}`)
    }
    expect(withoutLimits.filter((gap) => gap.startsWith('element kind'))).toEqual([])

    // Cut the page section: exactly the document keys, and nothing else.
    const withoutPage = l1VocabularyGaps(BODY.slice(BODY.indexOf(KINDS)))
    expect([...withoutPage].sort()).toEqual(
      [...L1_DOCUMENT_KEYS].map((k) => `document key ${k}`).sort(),
    )
  })
})
