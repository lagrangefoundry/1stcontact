/**
 * REQ-333 issues 3, 4 and 6 — three fold/substrate defects that all come down to
 * reading a number in the wrong frame of reference.
 *
 * ## Issues 3 + 4 — a radial mask's feather, measured in the source's units
 *
 * A radial gradient's colour stops are fractions of the gradient's OWN ending
 * shape. `foldMask` multiplied that fraction by the box's smaller side, which is
 * only the same thing when the ending shape is `closest-side` — and the common
 * "soft-edged photograph" idiom deliberately puts its ending ellipse OUTSIDE the
 * box, because that is how the idiom gets a *subtle* edge:
 *
 *     mask-image: radial-gradient(ellipse 92% 92% at 50% 50%, black 72%, transparent 100%)
 *
 * `92%` of a 330×222 box is 304×204 — about 1.84x the half-extent — so the box's own
 * corner sits at normalised radius 0.769 against an opaque stop of 0.72 and the page
 * attenuates its corners by 0.17 at most. The fold wrote `featherPx: 62` and the
 * renderer read that as a 62px band measured in from the closest side, which erased
 * 21.5% of each of faelan.com's three collage photographs outright. `values-diff`
 * compares `maskEdge` by presence only, so the whole thing generated ZERO deltas.
 *
 * Issue 4 is the ceiling under issue 3: `l1MaskSchema`'s `featherRadial` had ONE
 * number (`featherPx`) where the reference needs the ending shape's extent and the
 * opaque stop, and the schema is `.strict()`, so the page's own numbers could not be
 * written down at all. With issue 3 alone fixed, all three photographs fold to no
 * mask — right to within a few px, and the substrate declining to carry a real
 * property of the page.
 *
 * ## Issue 6 — a rejoined run anchored at its LAST fragment
 *
 * REQ-211/REQ-331's rejoin gave a multi-fragment sentence its flow root's rect for
 * `geometry.keyframes`, because the fragment's own box is where one piece of glyphs
 * landed and pinning it would re-wrap the copy. The column anchor kept reading
 * `element.box` — the fragment — so the document carried two values for the same x
 * that disagreed: `keyframes[].x` 102.39 beside `anchor.x.pxTrack` 55.88, the offset
 * of the LAST run. The renderer honours the anchor, so the sentence landed 169.48px
 * to the right at every breakpoint: three CRITICAL `position` deltas, pure x, with
 * the fragments keeping their correct relative spacing — intact, and in the wrong
 * place.
 */
import { describe, expect, it } from 'vitest'
import { foldToL1 } from '../tools/generate/src'
import { renderL1Document } from '../packages/framework/src/index'
import { l1MaskSchema, l1PlainText, validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Mask, L1Node } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const SPOTIFY = 'https://open.spotify.com/artist/5eHtQYNYPEQjhLSaA1SzTR'

/** The page's own soft-edge gradient, as `getComputedStyle` resolves it. */
const FEATHER_92 = 'radial-gradient(92% 92%, rgb(0, 0, 0) 72%, rgba(0, 0, 0, 0) 100%)'

interface ProjSpec {
  width: number
  elements: ValueElement[]
}

function multi(specs: ProjSpec[]): MultiStateCapture {
  const projections: StateProjection[] = specs.map((s) => ({
    engine: 'chromium',
    viewport: { width: s.width, height: 900 },
    state: 'rest',
    manifest: {
      source: `t:${s.width}`,
      elements: s.elements,
      sections: [] as never,
      viewport: { width: s.width, height: 900 },
    },
  }))
  return { url: 'http://faelan.test/', notes: [], projections }
}

function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 18,
    fontWeight: 400,
    lineHeightPx: 29,
    ...over,
  } as ValueElement
}

/** A run that renders on one line (what `renderedTextBox` reports). */
function oneLine(el: ValueElement): ValueElement {
  const b = el.box!
  return { ...el, renderedTextBox: { x: b.x, y: b.y, width: b.width, height: 21 } }
}

function picture(over: Partial<ValueElement>): ValueElement {
  return {
    role: 'img',
    text: '',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'img',
    objectFit: 'cover',
    ...over,
  } as ValueElement
}

function nodesOf(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (nodes: readonly L1Node[]): void => {
    for (const n of nodes) {
      out.push(n)
      walk(n.kind === 'container' ? n.children : ((n as { children?: L1Node[] }).children ?? []))
    }
  }
  walk([doc.root])
  return out
}

const byAlt = (doc: L1Document, alt: string): L1Node =>
  nodesOf(doc).find((n) => n.kind === 'image' && (n as { alt?: string }).alt === alt)!
const maskOf = (doc: L1Document, alt: string): L1Mask | undefined =>
  (byAlt(doc, alt) as { mask?: L1Mask }).mask

/** One photograph on the ladder, so the fold has a full track for it. */
function pageWithPicture(over: Partial<ValueElement>): MultiStateCapture {
  return multi(LADDER.map(() => ({ width: 1280, elements: [picture({ alt: 'subject', src: 'a.jpg', ...over })] })))
}

/**
 * The share of a box the mask makes even PARTLY transparent, by sampling the box on
 * a grid and evaluating the gradient the renderer emits. This is what "erased a
 * fifth of the photograph" means as a number the test can hold.
 */
function attenuatedShare(
  mask: { extentPct?: number; opaqueStopPct?: number; featherPx?: number },
  box: { width: number; height: number },
): number {
  // The renderer's two forms, in px radii against this box.
  const rx = mask.extentPct !== undefined ? (mask.extentPct / 100) * box.width : box.width / 2
  const ry = mask.extentPct !== undefined ? (mask.extentPct / 100) * box.height : box.height / 2
  // `opaqueStopPct` is a fraction of the ending shape; `featherPx` is a band measured
  // in from it (`calc(100% - Npx)`), which is what `closest-side` made of it.
  const opaque =
    mask.opaqueStopPct !== undefined
      ? mask.opaqueStopPct / 100
      : (Math.min(rx, ry) - (mask.featherPx ?? 0)) / Math.min(rx, ry)
  let hit = 0
  let n = 0
  const N = 120
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const dx = ((i + 0.5) / N - 0.5) * box.width
      const dy = ((j + 0.5) / N - 0.5) * box.height
      const t = Math.hypot(dx / rx, dy / ry)
      n++
      if (t > opaque) hit++
    }
  }
  return hit / n
}

describe('REQ-333 issues 3 + 4 — a feather is read, and written, in the gradient own units', () => {
  // THE BOX THE ROUND MEASURED: `ghostship-eyes.jpg`'s layout box, 320 x 205.7,
  // recorded (post-issue-1) unrotated.
  const BOX = { x: 64, y: 32, width: 320, height: 205.7 }

  it('test_UAT_FC_REQ-333_a_soft_edge_carries_the_pages_own_extent_and_opaque_stop', () => {
    const doc = foldToL1(pageWithPicture({ box: BOX, maskEdge: FEATHER_92 }))
    const mask = maskOf(doc, 'subject')

    // The axis is still the same axis — this is not a new shape.
    expect(mask?.shape).toBe('featherRadial')

    // THE FIX. The document carries the gradient's OWN two numbers: the ending
    // ellipse's radii as a share of the box, and where the opaque core ends. 92 and
    // 72 are what the page's stylesheet says.
    expect(mask?.extentPct).toBe(92)
    expect(mask?.opaqueStopPct).toBe(72)

    // And the one-parameter projection is gone rather than carried alongside: two
    // spellings of the same edge is how a document comes to disagree with itself.
    expect(mask?.featherPx).toBeUndefined()

    // It is a valid L1 document, which is the other half of issue 4: `l1MaskSchema`
    // is `.strict()`, so before this an extent was not merely ignored — it was
    // REFUSED by `validateL1` before it could reach the renderer.
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-333_the_old_projection_erased_a_fifth_of_the_photograph_and_the_new_one_does_not', () => {
    // WHAT IT WAS WORTH, as arithmetic rather than as a screenshot. The old fold's
    // `featherPx` for this gradient and box was `round((100-72)/100 * min(320,
    // 205.7))` = 58 — a fraction of the SOURCE's ending shape multiplied by the BOX.
    const old = { featherPx: Math.round(((100 - 72) / 100) * Math.min(BOX.width, BOX.height)) }
    expect(old.featherPx).toBe(58)

    const doc = foldToL1(pageWithPicture({ box: BOX, maskEdge: FEATHER_92 }))
    const now = maskOf(doc, 'subject')!

    // Under the old emission (`closest-side`, opaque only to (102.85-58)/102.85 =
    // 0.436) most of the photograph was attenuated and its whole outer band erased.
    const before = attenuatedShare(old, BOX)
    expect(before).toBeGreaterThan(0.5)

    // Under the page's own numbers the box corner sits at normalised radius
    // hypot(0.5/0.92, 0.5/0.92) = 0.769 against an opaque stop of 0.72, so only the
    // extreme corners are touched at all — which is what the reference paints.
    const after = attenuatedShare(now, BOX)
    expect(after).toBeLessThan(0.05)
    expect(after).toBeLessThan(before / 10)
  })

  it('test_UAT_FC_REQ-333_the_renderer_emits_the_ending_shape_the_document_names', () => {
    const doc = foldToL1(pageWithPicture({ box: BOX, maskEdge: FEATHER_92 }))
    const { css } = renderL1Document(doc)

    // The document names the intent and the renderer owns the geometry — the
    // gradient is BUILT from typed numbers, never transcribed from the instance.
    expect(css).toContain('mask-image: radial-gradient(ellipse 92% 92% at 50% 50%, #000 72%, transparent 100%)')
    // Both spellings, as every masked node has always emitted.
    expect(css).toContain('-webkit-mask-image: radial-gradient(ellipse 92% 92%')
    // The hard-coded ending shape is gone for a document that names its own.
    expect(css).not.toContain('radial-gradient(closest-side, #000 calc(100% - ')
  })

  it('test_UAT_FC_REQ-333_a_document_that_names_no_extent_renders_exactly_as_before', () => {
    // THE RAIL on issue 4. The two parameters are additive: a `featherPx`-only mask
    // — every mask authored or folded before this — must still emit the historical
    // `closest-side` band, or the axis change is a silent re-render of the corpus.
    const doc: L1Document = {
      widths: [1280],
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [
          {
            kind: 'image',
            id: 'img-0',
            src: 'a.jpg',
            alt: 'a photograph',
            mask: { shape: 'featherRadial', featherPx: 48 },
            geometry: { keyframes: [{ at: 1280, x: 0, y: 0, width: 400, height: 300 }] },
          },
        ],
      },
    }
    expect(validateL1(doc).ok).toBe(true)
    const { css } = renderL1Document(doc)
    expect(css).toContain('mask-image: radial-gradient(closest-side, #000 calc(100% - 48px), transparent 100%)')
  })

  it('test_UAT_FC_REQ-333_the_mask_axis_admits_the_two_new_parameters_and_still_refuses_freeform', () => {
    // The envelope contract: the variant is expressible, and opening it did not open
    // the door to an instance authoring CSS (DOC-2 §2 / the structured-only rule).
    expect(l1MaskSchema.safeParse({ shape: 'featherRadial', extentPct: 92, opaqueStopPct: 72 }).success).toBe(true)
    expect(l1MaskSchema.safeParse({ shape: 'featherRadial', featherPx: 62 }).success).toBe(true)
    // Out of range, and freeform, are both still refused.
    expect(l1MaskSchema.safeParse({ shape: 'featherRadial', extentPct: 0 }).success).toBe(false)
    expect(l1MaskSchema.safeParse({ shape: 'featherRadial', opaqueStopPct: 140 }).success).toBe(false)
    expect(
      l1MaskSchema.safeParse({ shape: 'featherRadial', gradient: 'radial-gradient(red, blue)' }).success,
    ).toBe(false)
  })

  it('test_UAT_FC_REQ-333_a_closest_side_gradient_reads_as_the_half_extent_it_is', () => {
    // The generalisation check: `closest-side` is not a special case in the code, it
    // is `50% 50%` — the ending shape whose radii ARE the box's half-extents. An
    // implementation that only knew how to read `P% P%` would fail here, and one
    // that hardcoded 92 would fail everywhere else.
    const doc = foldToL1(
      pageWithPicture({
        box: { x: 0, y: 0, width: 400, height: 300 },
        maskEdge: 'radial-gradient(closest-side, rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0) 100%)',
      }),
    )
    const mask = maskOf(doc, 'subject')
    expect(mask?.extentPct).toBe(50)
    expect(mask?.opaqueStopPct).toBe(60)
  })

  it('test_UAT_FC_REQ-333_a_mask_that_attenuates_nothing_inside_the_box_is_not_emitted', () => {
    // The honest answer where the axis cannot hold the shape: a PIXEL radius on a
    // non-square box is genuinely two numbers, so it falls to the one-parameter band
    // — and there the band is converted into the renderer's frame (in from the box's
    // own half-extent) rather than the source's. An opaque core that already reaches
    // the half-extent attenuates nothing inside the box, and a mask is then a crop
    // the page does not paint.
    const doc = foldToL1(
      pageWithPicture({
        box: { x: 0, y: 0, width: 400, height: 200 },
        maskEdge: 'radial-gradient(600px 600px, rgb(0, 0, 0) 80%, rgba(0, 0, 0, 0) 100%)',
      }),
    )
    expect(maskOf(doc, 'subject')).toBeUndefined()
  })

  it('test_UAT_FC_REQ-333_a_gradient_whose_shape_cannot_be_read_folds_to_no_mask', () => {
    // Unchanged contract, restated because the parser is new: a wrong mask crops the
    // photograph, a missing one is the hard edge that was already there. An
    // off-centre origin is a different mask that this axis does not name.
    for (const edge of [
      'radial-gradient(at 20% 80%, rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0) 100%)',
      'conic-gradient(from 0deg, rgb(0, 0, 0) 60%, rgba(0, 0, 0, 0) 100%)',
    ]) {
      const doc = foldToL1(pageWithPicture({ box: { x: 0, y: 0, width: 400, height: 300 }, maskEdge: edge }))
      expect(maskOf(doc, 'subject'), edge).toBeUndefined()
    }
  })
})

// ── Issue 6 — the anchor and the keyframes read the same rect ────────────────

const INLINE_WIDTH = 268
/** The three fragment widths of the hero sentence, at the round's own numbers. */
const FRAGS = [77, 93, 98]

/**
 * A real `max-w-6xl mx-auto px-6` + `max-w-4xl` column with a three-fragment linked
 * sentence inside it. The sentence's flow root starts at the column's own left edge;
 * its LAST fragment starts 170px to the right of that, which is the excess the
 * anchor used to pick up.
 */
function columnPageWithRejoinedSentence(): MultiStateCapture {
  return multi(
    LADDER.map((width) => {
      const origin = Math.max(0, (width - 1152) / 2) + 24
      const extent = Math.min(896, Math.min(1152, width) - 48)
      const inlineBox = { x: origin, y: 300, width: INLINE_WIDTH, height: 29 }
      let cursor = origin
      const frags = ['Artist •', 'Musician', '• Creator'].map((text, i) => {
        const box = { x: cursor, y: 300, width: FRAGS[i], height: 29 }
        cursor += FRAGS[i]
        return oneLine(
          run({
            text,
            textFlow: i === 0 ? 'Artist • ' : i === 1 ? 'Musician' : ' • Creator',
            inlineGroup: 'f1:0',
            inlineIndex: i,
            inlineBox,
            box,
            ...(i === 1 ? { textDecoration: 'underline', href: SPOTIFY, a11yRole: 'link' } : {}),
          }),
        )
      })
      return {
        width,
        elements: [
          // Runs that fill the column, so its container / inset / cap are identifiable.
          ...['Fills it', 'Also fills', 'Fills too'].map((text, i) =>
            oneLine(run({ text, box: { x: origin, y: 100 + i * 40, width: extent, height: 29 } })),
          ),
          ...frags,
        ],
      }
    }),
  )
}

/** The column origin at one viewport width, from the document's own column. */
function originAt(doc: L1Document, at: number): number {
  const col = doc.column!
  return Math.max(0, (at - col.containerPx) / 2) + col.insetPx
}

describe('REQ-333 issue 6 — a rejoined sentence anchors where it lays out', () => {
  it('test_UAT_FC_REQ-333_the_rejoined_sentences_anchor_agrees_with_its_own_keyframes', () => {
    const doc = foldToL1(columnPageWithRejoinedSentence())
    expect(doc.column).toEqual({ containerPx: 1152, insetPx: 24, maxWidthPx: 896 })

    const sentence = nodesOf(doc).find(
      (n) => n.kind === 'text' && l1PlainText((n as { text: never }).text).includes('Musician'),
    )!
    // The rejoin itself still happened — one node, three runs (REQ-331).
    expect(Array.isArray((sentence as { text: unknown }).text)).toBe(true)

    const geo = sentence.geometry as {
      keyframes: Array<{ at: number; x: number }>
      anchor?: { x?: { px?: number; fraction?: number; pxTrack?: { keyframes: Array<{ at: number; value: number }> } } }
    }

    // THE FAILURE, as the document contradicting itself: `keyframes[].x` came from
    // the flow root and the anchor came from the last fragment, 170px to its right.
    const at1280 = geo.keyframes.find((k) => k.at === 1280)!
    expect(at1280.x).toBe(originAt(doc, 1280))
    const xTerm = geo.anchor?.x
    expect(xTerm, 'the sentence is anchored to the column').toBeTruthy()
    const offsetAt1280 =
      xTerm!.pxTrack?.keyframes.find((k) => k.at === 1280)?.value ??
      (xTerm!.px ?? 0) + (xTerm!.fraction ?? 0) * (Math.min(896, 1152 - 48))
    expect(offsetAt1280).toBeCloseTo(0, 2)
    // Not FRAGS[0] + FRAGS[1] — the width of the two runs the anchor used to skip.
    expect(offsetAt1280).not.toBeCloseTo(FRAGS[0] + FRAGS[1], 1)
  })

  it('test_UAT_FC_REQ-333_every_anchored_node_satisfies_pxtrack_equals_x_minus_column_origin', () => {
    // THE CHEAP REGRESSION GUARD the round asked for, as a property over the whole
    // document rather than over the one node that broke: the invariant held for 6 of
    // 7 nodes on the reference page and one violation was enough to move a sentence
    // 170px. Any future derivation that reads a different rect for the anchor than
    // for the keyframes fails here, whatever node it is on.
    const doc = foldToL1(columnPageWithRejoinedSentence())
    const extentAt = (at: number): number => {
      const col = doc.column!
      const inner = Math.min(col.containerPx, at) - col.insetPx * 2
      return col.maxWidthPx === undefined ? inner : Math.min(col.maxWidthPx, inner)
    }
    let checked = 0
    for (const node of nodesOf(doc)) {
      const geo = (node as { geometry?: Record<string, never> }).geometry as
        | {
            keyframes: Array<{ at: number; x: number }>
            anchor?: {
              x?: { px?: number; fraction?: number; maxPx?: number; pxTrack?: { keyframes: Array<{ at: number; value: number }> } }
            }
          }
        | undefined
      const x = geo?.anchor?.x
      if (!geo || !x) continue
      for (const kf of geo.keyframes) {
        const constant = x.pxTrack?.keyframes.find((k) => k.at === kf.at)?.value ?? x.px ?? 0
        let predicted = originAt(doc, kf.at) + constant + (x.fraction ?? 0) * extentAt(kf.at)
        if (x.maxPx !== undefined) predicted = Math.min(x.maxPx, predicted)
        expect(Math.abs(predicted - kf.x), `${node.id} @${kf.at}: anchor vs keyframe x`).toBeLessThanOrEqual(1)
        checked++
      }
    }
    expect(checked, 'anchored keyframes were actually checked').toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-333_the_served_page_puts_the_sentence_where_l1_says_it_is', () => {
    // End to end, through the real renderer: the anchor is what reaches CSS, so a
    // wrong anchor is a wrong page however right the keyframes are.
    const doc = foldToL1(columnPageWithRejoinedSentence())
    const { css, html } = renderL1Document(doc)
    const cls = /<p class="([^"]+)"[^>]*>Artist/.exec(html)?.[1]
    expect(cls, 'the sentence rendered as one paragraph').toBeTruthy()
    const lefts = [...css.matchAll(new RegExp(`\\.${cls}\\s*\\{[^}]*left:\\s*([^;}]+)`, 'g'))].map((m) => m[1])
    expect(lefts.length, 'the sentence carries a left').toBeGreaterThan(0)
    for (const left of lefts) {
      expect(left, 'no 170px excess from the last fragment').not.toMatch(/\b170px\b/)
    }
  })
})
