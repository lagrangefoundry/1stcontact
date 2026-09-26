/**
 * REQ-331 — the engine half of loop 1 / iteration 1 against the `faelan.com`
 * reference bundle: five defects that were the whole of that reproduction's
 * residual, measured end-to-end through the real fold, the real envelope
 * evaluator and the real renderer.
 *
 * The fixture is that hero in miniature, at the numbers the round quoted out of
 * `capture.json`: a headline, one sentence with a Spotify link in the middle of
 * it, and two photographs — one montaged over the headline with a feathered edge
 * and a two-layer shadow, one sitting clear of everything with neither. Nothing
 * here is mocked; the only thing that is synthetic is the capture, which is the
 * pipeline's own input format.
 *
 * What each issue cost on that page, so a reader knows what these pin:
 *
 *   1. the sentence was not rejoined      12 of 20 value deltas, ~99.8% of the
 *      (a link is not a "variation")      ranked pixel score, and the two
 *                                         separating spaces missing from the copy
 *   2. no `stacked` was ever emitted      218 `overlap` findings — 100% of the
 *                                         `structural-failure` verdict
 *   3. `maskEdge` was never folded        3 feathered photographs with hard edges
 *   4. a shadow's alpha was dropped       a 60%-black drop shadow painted solid
 *   5. a shadow was one layer wide        the white outer glow could not be said
 *
 * 1 and 2 are the two the round said were worth landing on their own.
 */
import { describe, expect, it } from 'vitest'
import { evaluateLayout, foldToL1 } from '../tools/generate/src'
import { measuredTextHeights } from '../tools/generate/src/l1/probes'
import { renderL1Document } from '../packages/framework/src/index'
import { l1PlainText, validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node, L1Shadow, L1Text } from '../packages/site-schema/src/index'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 768, 1280]
const SPOTIFY = 'https://open.spotify.com/artist/5eHtQYNYPEQjhLSaA1SzTR'

/** The two-layer shadow the reference paints on its montaged photographs. */
const TWO_LAYER = 'rgba(0, 0, 0, 0.6) 0px 15px 50px 0px, rgba(255, 255, 255, 0.15) 0px 0px 30px 0px'
/** The radial soft edge it feathers them with. */
const FEATHER = 'radial-gradient(92% 92%, rgb(0, 0, 0) 72%, rgba(0, 0, 0, 0) 100%)'

function run(over: Partial<ValueElement> & { text: string }): ValueElement {
  return {
    role: 'body',
    color: '#ffffff',
    fontFamily: 'Inter',
    fontSizePx: 24,
    fontWeight: 400,
    lineHeightPx: 36,
    ...over,
  } as ValueElement
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

/**
 * The three runs of the hero sentence, exactly as `capture.json` recorded them:
 * one inline formatting context (`inlineGroup`), one shared flow-root rect
 * (`inlineBox` — `y: 168, height: 36`, the LINE box), each run's own glyph rect
 * in `box` (`y: 172, height: 28`), and the separating spaces kept in `textFlow`.
 *
 * Every axis the old four-axis predicate looked at is BYTE-IDENTICAL across the
 * three: same fill, same size, same weight, same slope. The middle one is a
 * link, and that is the whole of the variation.
 */
const INLINE_BOX = { x: 102.39, y: 168, width: 267.64, height: 36 }
function sentence(): ValueElement[] {
  return [
    run({
      text: 'Artist •',
      textFlow: 'Artist • ',
      inlineGroup: 'f1:0',
      inlineIndex: 0,
      inlineBox: INLINE_BOX,
      box: { x: 102.39, y: 172, width: 76.78, height: 28 },
      renderedTextBox: { x: 102.39, y: 172, width: 76.78, height: 28 },
    }),
    run({
      text: 'Musician',
      textFlow: 'Musician',
      inlineGroup: 'f1:0',
      inlineIndex: 1,
      inlineBox: INLINE_BOX,
      box: { x: 179.17, y: 168, width: 93.3, height: 36 },
      renderedTextBox: { x: 179.17, y: 172, width: 93.3, height: 28 },
      textDecoration: 'underline',
      href: SPOTIFY,
      a11yRole: 'link',
    }),
    run({
      text: '• Creator',
      textFlow: ' • Creator',
      inlineGroup: 'f1:0',
      inlineIndex: 2,
      inlineBox: INLINE_BOX,
      box: { x: 272.47, y: 172, width: 97.56, height: 28 },
      renderedTextBox: { x: 272.47, y: 172, width: 97.56, height: 28 },
    }),
  ]
}

/** The same sentence with the link taken out — a flow that genuinely does not vary. */
function plainSentence(): ValueElement[] {
  return sentence().map((el) => ({ ...el, textDecoration: null, href: null, a11yRole: undefined }))
}

const HEADLINE = run({
  text: 'FAELAN',
  fontSizePx: 80,
  fontWeight: 800,
  lineHeightPx: 96,
  role: 'heading',
  a11yRole: 'heading',
  headingLevel: 1,
  box: { x: 216, y: 64, width: 448, height: 96 },
  renderedTextBox: { x: 216, y: 64, width: 448, height: 96 },
})

/** Montaged OVER the headline (x 216…664, y 64…160), and feathered, and shadowed. */
const GHOSTSHIP = picture({
  src: 'assets/ghostship.jpeg',
  alt: 'Ghostship',
  box: { x: 59, y: 32, width: 222, height: 222 },
  maskEdge: FEATHER,
  boxShadow: TWO_LAYER,
  borderRadiusPx: 8,
  objectFit: 'fill',
})

/** Clear of everything on the page — the control for the `stacked` declaration. */
const PORTRAIT = picture({
  src: 'assets/faelan.jpeg',
  alt: 'Faelan',
  box: { x: 923, y: 400, width: 222, height: 234 },
})

function captureOf(elements: ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `faelan@${width}`,
      viewport: { width, height: 900 },
      sections: [],
      elements,
    },
  })) as never
  return { url: 'http://faelan.test/', notes: [], projections } as never
}

const HERO = (): MultiStateCapture => captureOf([HEADLINE, ...sentence(), GHOSTSHIP, PORTRAIT])

/** Every node in the folded document, in document order. */
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

const textNodes = (doc: L1Document): L1Text[] => nodesOf(doc).filter((n): n is L1Text => n.kind === 'text')
const byAlt = (doc: L1Document, alt: string): L1Node =>
  nodesOf(doc).find((n) => n.kind === 'image' && n.alt === alt)!
const keyframeAt = (node: L1Node, at: number): Record<string, number> =>
  ((node as { geometry?: { keyframes: Array<Record<string, number>> } }).geometry?.keyframes ?? []).find(
    (k) => k.at === at,
  )!
const layers = (s: L1Shadow | readonly L1Shadow[] | undefined): readonly L1Shadow[] =>
  s === undefined ? [] : Array.isArray(s) ? s : [s as L1Shadow]

describe('REQ-331 — the fold rejoins a linked sentence and declares a montage', () => {
  // ── Issue 1 — a link IS a variation ────────────────────────────────────────
  it('test_UAT_FC_REQ-331_a_sentence_whose_only_variation_is_a_link_is_rejoined', () => {
    const doc = foldToL1(HERO())
    const runs = textNodes(doc)

    // ONE node for the sentence, not three pinned fragments. Before this the
    // predicate compared fill / size / weight / slope, on which these three runs
    // are byte-identical, so `flowVaries` said no and the fold transcribed each
    // fragment at its own absolute box — which is what put the four images and
    // everything below them 16px down the page.
    const sentenceNodes = runs.filter((n) => l1PlainText(n.text).includes('Musician'))
    expect(sentenceNodes).toHaveLength(1)
    expect(Array.isArray(sentenceNodes[0].text), 'the sentence is a run list').toBe(true)
    expect((sentenceNodes[0].text as unknown[]).length).toBe(3)

    // And the headline beside it is untouched — a run that is in no flow at all
    // is still one plain string, so nothing about this widened what gets
    // rejoined beyond the flows that vary.
    const headline = runs.find((n) => l1PlainText(n.text) === 'FAELAN')!
    expect(typeof headline.text).toBe('string')
  })

  it('test_UAT_FC_REQ-331_the_rejoined_sentence_reads_with_its_separating_spaces', () => {
    const { html } = renderL1Document(foldToL1(HERO()))

    // The content-completeness half of issue 1. Un-rejoined, the fold wrote each
    // run's TRIMMED `text` as its own block, so the served page read
    // "Artist •Musician• Creator" — and the reproduction's own accessible name
    // recorded exactly that. `textFlow` keeps each run's own spaces and the
    // rejoin is what lets them be written.
    expect(html).toContain('Artist • ')
    expect(html).toContain(' • Creator')
    expect(html).not.toContain('•Musician')
    expect(html).not.toContain('Musician•')
  })

  it('test_UAT_FC_REQ-331_the_linked_run_survives_the_rejoin_as_a_live_anchor', () => {
    const doc = foldToL1(HERO())
    const { html, css } = renderL1Document(doc)

    // THE REJOIN HAD TO BE LOSSLESS OR IT WAS NOT WORTH TAKING. Before REQ-331
    // L1 could give a RUN neither a link nor a decoration, so rejoining this
    // sentence would have traded a brittle layout for a dead link and a missing
    // underline. Both now ride the run.
    const node = textNodes(doc).find((n) => l1PlainText(n.text).includes('Musician'))!
    const list = node.text as Array<{ text: string; link?: { href: string }; axes?: { textDecoration?: string } }>
    expect(list[1].link?.href).toBe(SPOTIFY)
    expect(list[1].axes?.textDecoration).toBe('underline')
    // ...and the two runs either side of it carry neither, because they differ
    // from the node in nothing.
    expect(list[0].link).toBeUndefined()
    expect(list[2].axes?.textDecoration).toBeUndefined()

    // The anchor reaches the page, with its target.
    expect(html).toMatch(/<a[^>]*href="https:\/\/open\.spotify\.com\/artist\/[^"]*"[^>]*>Musician<\/a>/)
    expect(css).toContain('text-decoration: underline')

    // A legal document at the end of it — the run href clears the same URL
    // allowlist every other URL sink does.
    expect(validateL1(doc).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-331_the_rejoined_node_lays_out_in_its_flow_root_box', () => {
    const doc = foldToL1(HERO())
    const node = textNodes(doc).find((n) => l1PlainText(n.text).includes('Musician'))!
    const kf = keyframeAt(node, 1280)

    // The flow root's rect (`inlineBox`), not the tight box of whichever
    // fragment carried the node. Pinning the fragment's would re-wrap the
    // sentence into the width of its longest word — and its `y` is the GLYPH
    // top (172), four pixels below the line box the browser laid it out in.
    expect(kf.y).toBe(INLINE_BOX.y)
    expect(kf.x).toBeCloseTo(INLINE_BOX.x, 2)
    expect(kf.width).toBeGreaterThanOrEqual(INLINE_BOX.width)
  })

  it('test_UAT_FC_REQ-331_an_unrejoined_run_occupies_its_line_box_not_its_glyph_box', () => {
    // The other half of issue 1, and the one a rejoin cannot fix: a flow that
    // does NOT vary is still transcribed as fragments, and each fragment's `box`
    // is its glyph rect (28px) while the renderer gives the node a line box
    // (36px). The fold's model of how much vertical space a run occupies was
    // therefore 8px short of its own output, and because each sibling's lead is
    // measured from the previous one's bottom the error accumulated down the
    // chain.
    const heights = measuredTextHeights(captureOf([HEADLINE, ...plainSentence(), PORTRAIT]))
    const track = [...heights.tracks.entries()].find(([k]) => k.startsWith('artist'))![1]
    for (const point of track) expect(point.height, `@${point.at}`).toBe(INLINE_BOX.height)

    // The headline is not in any flow, so nothing about it changed: its own box
    // is its line box already and it is still measured at exactly that.
    const head = [...heights.tracks.entries()].find(([k]) => k.startsWith('faelan'))![1]
    for (const point of head) expect(point.height).toBe(96)
  })

  // ── Issue 2 — the montage declares itself ──────────────────────────────────
  it('test_UAT_FC_REQ-331_a_montaged_picture_declares_its_overlap_and_a_clear_one_does_not', () => {
    const doc = foldToL1(HERO())

    // The picture the reference painted over the headline says so. Nothing in
    // the engine had ever emitted `stacked` — `grep` found it only in comments —
    // so every collage reproduction failed the envelope's overlap probe for
    // reproducing the reference faithfully.
    expect((byAlt(doc, 'Ghostship') as { stacked?: true }).stacked).toBe(true)

    // AND THE EXEMPTION STAYS HONEST: a picture that overlaps nothing carries no
    // declaration, so an overlap the FOLD invents is still a finding. Without
    // this rail the change would read as "never report an overlap again".
    expect((byAlt(doc, 'Faelan') as { stacked?: true }).stacked).toBeUndefined()

    // The consequence: the served document no longer collides at any captured
    // width over a pair the reference itself painted.
    for (const width of doc.widths) {
      const overlaps = evaluateLayout(doc, width).findings.filter((f) => f.kind === 'overlap')
      expect(overlaps, `overlaps @${width}`).toEqual([])
    }
  })

  it('test_UAT_FC_REQ-331_an_overlap_with_no_picture_in_it_is_still_a_finding', () => {
    // THE RAIL. The declaration is made by the picture and by nothing else, so a
    // pair the reference painted that contains no picture keeps its finding —
    // text landing on text is the reader losing a sentence, and it stays
    // reportable. Without this the change would read as "never report an overlap
    // again", which is the failure mode an exemption of this kind has.
    const onTop = run({
      text: 'Worlds End Studio',
      box: { x: 240, y: 96, width: 300, height: 36 },
      renderedTextBox: { x: 240, y: 96, width: 300, height: 36 },
    })
    const doc = foldToL1(captureOf([HEADLINE, onTop, PORTRAIT]))
    const overlaps = evaluateLayout(doc, 1280).findings.filter((f) => f.kind === 'overlap')
    expect(overlaps.length).toBeGreaterThan(0)
    expect(overlaps[0].detail).toContain('FAELAN')
  })

  // ── Issue 3 — the feathered edge ───────────────────────────────────────────
  it('test_UAT_FC_REQ-331_a_feathered_photograph_keeps_its_soft_edge', () => {
    const doc = foldToL1(HERO())
    const mask = (byAlt(doc, 'Ghostship') as { mask?: { shape: string; featherPx?: number } }).mask

    // `maskEdge` has been captured since REQ-48 and `featherRadial` has existed
    // since REQ-136; the image-axis builder simply never read the field, so
    // three feathered photographs reproduced as hard rectangles.
    expect(mask?.shape).toBe('featherRadial')
    // (100 − 72)% of the 222px box — the transparent run of the captured
    // gradient, which is the value the axis carries.
    expect(mask?.featherPx).toBe(62)

    // And it reaches the page as a mask rather than as the gradient string the
    // instance would then be authoring.
    const { css } = renderL1Document(doc)
    expect(css).toContain('mask-image: radial-gradient(')

    // The picture with no captured mask gets none — an axis is folded from a
    // measurement, never defaulted.
    expect((byAlt(doc, 'Faelan') as { mask?: unknown }).mask).toBeUndefined()
  })

  // ── Issues 4 + 5 — the shadow, with its alpha and with both its layers ─────
  it('test_UAT_FC_REQ-331_a_translucent_two_layer_shadow_survives_the_fold', () => {
    const doc = foldToL1(HERO())
    const axes = (byAlt(doc, 'Ghostship') as { axes?: { boxShadow?: L1Shadow | L1Shadow[] } }).axes
    const stack = layers(axes?.boxShadow)

    // Issue 5 — BOTH layers. The fold took `css.split(',')[0]` and said so in a
    // comment, which was correct while the axis was one object wide: there was
    // nowhere to put layer two. The second layer here is the pale outer glow
    // that separates a torn photograph from the dark montage behind it.
    expect(stack).toHaveLength(2)

    // Issue 4 — the ALPHA. `colorToHex` formatted three channels and returned,
    // so a 60%-black drop shadow folded to `#000000` and reproduced as solid
    // black. 0.6 × 255 = 153 = 0x99; 0.15 × 255 = 38 = 0x26.
    expect(stack[0].color).toBe('#00000099')
    expect(stack[0].offsetYPx).toBe(15)
    expect(stack[0].blurPx).toBe(50)
    expect(stack[1].color).toBe('#ffffff26')
    expect(stack[1].blurPx).toBe(30)

    // Both reach the stylesheet, comma-joined in the document's own order —
    // which is CSS's paint order, so the first layer paints on top.
    const { css } = renderL1Document(doc)
    const rule = css.split('}').find((r) => r.includes('box-shadow')) ?? ''
    expect(rule).toContain('#00000099')
    expect(rule).toContain('#ffffff26')
    expect(rule.split('box-shadow:')[1].split(';')[0].split(',').length).toBe(2)

    // Still inside the envelope, per layer — the bound walks the stack rather
    // than looking only at the first.
    expect(validateL1(doc).ok).toBe(true)
  })
})
