/**
 * REQ-302 issue 2 — a band's runs are projected in DOCUMENT order, with each
 * repeated-item row put back where it was lifted from.
 *
 * `itemGroup` pulls a band's repeated rows (a card's bullet list, a pricing
 * row) out of the content walk so band content and item content are not
 * captured twice. Both projections then re-appended those rows after ALL of
 * the band's content — so a card whose bullet list happened to be the band's
 * one detected group had its bullets emitted after a LATER card's copy.
 *
 * That array is read as reading order by everything downstream: the responsive
 * table's occurrence pairing, the fold's child order, and REQ-278's flow
 * recovery, which measures each member's leading offset from the PREVIOUS
 * sibling's bottom. On one measured reference it cost the `structural-failure`
 * verdict itself — three bullet rows emitted ~460px below where they paint,
 * which the flow recovery then repaired with `margin-top: -946px` and friends:
 * a document that holds at exactly the six sampled widths and nowhere between
 * them, 2 off-sample collisions at 500px and 19 content-robustness collisions
 * at every width.
 *
 * The repair is at the source, not in the fold: the extractor records the
 * index the lifted subtree sat at, and both projections splice the rows back
 * in there. A bundle with no anchor — one written before REQ-302, or the
 * geometric-slice path where a slice is a box rather than a subtree and the
 * question has no answer — appends, which is exactly what every reader did
 * before the anchor existed.
 */
import { describe, expect, it } from 'vitest'
import { flattenCapture, flattenSignals } from '../tools/generate/src/cli/capture'
import { buildSections } from '../tools/generate/src/cli/capture/sections'
import type {
  Capture,
  ContentRun,
  RawBand,
  RawRun,
  RawSignals,
  Section,
} from '../tools/generate/src/cli/capture'

// ── the shape the failure was measured on ─────────────────────────────────────
//
// Two cards, each with a heading, a paragraph and a bullet list. The two cards
// differ in class, so the CARD row is not a uniform group and the item-group
// walk descends into the FIRST card's <ul> instead — which is the precise
// condition that puts a lifted group in the middle of the content rather than
// at its end.
const CARD_A = ['First Card Heading', 'First card paragraph copy.']
const BULLETS = ['Alpha bullet of the first card', 'Beta bullet of the first card']
const CARD_B = ['Second Card Heading', 'Second card paragraph copy.']

/** Reading order as a person sees the page: card A, its bullets, then card B. */
const READING_ORDER = [...CARD_A, ...BULLETS, ...CARD_B]
/** What appending produced: the bullets after a LATER card's copy. */
const APPENDED_ORDER = [...CARD_A, ...CARD_B, ...BULLETS]

function contentRun(text: string, y: number): ContentRun {
  return {
    role: 'body',
    text,
    color: '#111827',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 16,
    fontWeight: 400,
    box: { x: 40, y, width: 400, height: 24 },
  } as ContentRun
}

function rawRun(text: string, y: number): RawRun {
  return {
    ...contentRun(text, y),
    lineHeightPx: 24,
    letterSpacingPx: 0,
    gradientCss: null,
    borderLeftWidthPx: 0,
    borderLeftColor: null,
    accentBox: null,
    paddingLeftPx: 0,
    paddingTopPx: 0,
    paddingRightPx: 0,
    paddingBottomPx: 0,
    textAlign: 'left',
  } as unknown as RawRun
}

/** y positions matching READING_ORDER, so "where it paints" is unambiguous. */
const Y = Object.fromEntries(READING_ORDER.map((t, i) => [t, 100 + i * 40]))

/** A capture bundle with the bullets lifted out after `CARD_A`, anchored or not. */
function captureWith(itemsAt: number[] | undefined): Capture {
  const section = {
    box: { x: 0, y: 0, width: 1280, height: 400 },
    screenshot: { x: 0, y: 0, width: 1280, height: 400 },
    background: { kind: 'solid', color: '#ffffff' },
    layout: {},
    content: [...CARD_A, ...CARD_B].map((t) => contentRun(t, Y[t])),
    items: [{ content: BULLETS.map((t) => contentRun(t, Y[t])) }],
    fields: [],
    ...(itemsAt ? { itemsAt } : {}),
  } as unknown as Section
  return {
    url: 'http://req302.test/',
    sections: [section],
    captureSchema: 5,
    theme: {},
    viewport: { width: 1280, height: 900 },
  } as unknown as Capture
}

/** The same shape as a RAW extraction — the reproduction side of the same diff. */
function signalsWith(itemsAt: number[] | undefined): RawSignals {
  const band = {
    box: { x: 0, y: 0, width: 1280, height: 400 },
    backgroundColor: '#ffffff',
    content: [...CARD_A, ...CARD_B].map((t) => rawRun(t, Y[t])),
    items: [BULLETS.map((t) => rawRun(t, Y[t]))],
    fields: [],
    ...(itemsAt ? { itemsAt } : {}),
  } as unknown as RawBand
  return { bands: [band], viewport: { width: 1280, height: 900 }, containerMaxWidthPx: null } as unknown as RawSignals
}

const textsOf = (els: { text?: string }[]): string[] => els.map((e) => e.text ?? '')

describe('REQ-302 — a section projects its runs in reading order', () => {
  it('test_UAT_FC_REQ-302_lifted_item_rows_are_spliced_back_where_the_dom_had_them', () => {
    // THE FAILURE. Without the anchor, the two bullets land after the SECOND
    // card's copy — 460px below where they paint on the measured reference.
    // With it, the projected order is the order a person reads.
    const anchored = textsOf(flattenCapture(captureWith([2])).elements)
    expect(anchored).toEqual(READING_ORDER)
    expect(anchored).not.toEqual(APPENDED_ORDER)

    // And the order is the order the boxes paint in, which is the property
    // every downstream consumer actually depends on — asserted against the
    // geometry rather than against the expected array, so a fixture whose
    // y values disagreed with its own reading order could not pass.
    const ys = flattenCapture(captureWith([2])).elements.map((e) => e.box!.y)
    expect(ys).toEqual([...ys].sort((a, b) => a - b))
  })

  it('test_UAT_FC_REQ-302_the_reproduction_side_is_ordered_by_the_same_rule', () => {
    // A diff compares two manifests element by element. If only ONE side were
    // reordered the fix would be worse than the bug — it would pair every run
    // in the band against the wrong one. Both projections read the anchor.
    const ref = textsOf(flattenCapture(captureWith([2])).elements)
    const repro = textsOf(flattenSignals(signalsWith([2]), 'req302').elements)
    expect(repro).toEqual(READING_ORDER)
    expect(repro).toEqual(ref)
  })

  it('test_UAT_FC_REQ-302_a_bundle_with_no_anchor_still_reads_the_way_it_always_did', () => {
    // The compatibility half. A bundle taken before REQ-302 carries no anchor,
    // and the geometric-slice path deliberately records none because a slice
    // is a box rather than a DOM subtree and the question has no truthful
    // answer there. Both must APPEND — the behaviour before the anchor existed
    // — rather than crash or invent a position.
    expect(textsOf(flattenCapture(captureWith(undefined)).elements)).toEqual(APPENDED_ORDER)
    expect(textsOf(flattenSignals(signalsWith(undefined), 'req302').elements)).toEqual(APPENDED_ORDER)
  })

  it('test_UAT_FC_REQ-302_the_anchor_survives_bands_being_coalesced_into_one_section', () => {
    // A section is built from a RUN of same-signature bands, and their content
    // is concatenated. An anchor that stayed band-relative would point into
    // the wrong band's copy once a second band's content sat in front of it,
    // so the projection has to re-base it onto the coalesced array.
    const bandOf = (texts: string[], bullets: string[], at: number): RawBand =>
      ({
        box: { x: 0, y: 0, width: 1280, height: 200 },
        backgroundColor: '#ffffff',
        backgroundImage: 'none',
        content: texts.map((t) => rawRun(t, Y[t] ?? 100)),
        items: [bullets.map((t) => rawRun(t, Y[t] ?? 100))],
        itemsAt: [at],
        fields: [],
      }) as unknown as RawBand

    // Two bands with identical signatures coalesce; the second band's bullets
    // are anchored at index 1 WITHIN that band, i.e. after 'Second Card
    // Heading' — which is index 3 of the coalesced content.
    const signals = {
      bands: [bandOf(CARD_A, [], 2), bandOf(CARD_B, BULLETS, 1)],
      viewport: { width: 1280, height: 900 },
      containerMaxWidthPx: null,
    } as unknown as RawSignals
    const [section] = buildSections(signals, () => undefined)

    expect(section.content.map((r) => r.text)).toEqual([...CARD_A, ...CARD_B])
    // Re-based onto the coalesced content: 2 (first band's length) + 1.
    expect(section.itemsAt).toEqual([2, 3])

    // ...and reading the bundle back gives the bullets between the second
    // card's heading and its paragraph, which is where that band put them.
    const capture = {
      url: 'http://req302.test/',
      sections: [section],
      captureSchema: 5,
      theme: {},
      viewport: { width: 1280, height: 900 },
    } as unknown as Capture
    expect(textsOf(flattenCapture(capture).elements)).toEqual([
      ...CARD_A,
      CARD_B[0],
      ...BULLETS,
      CARD_B[1],
    ])
  })
})
