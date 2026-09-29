/**
 * REQ-338 issues 1–4 — the fold painted every band two or three times over, and
 * the least faithful copy was on top.
 *
 * Three probes describe the same rectangle and all three were emitted. The
 * treatments probe reads the page's dedicated overlay ELEMENT and gets every
 * axis it carries (`opacity: 0.49`, `brightness(67%) contrast(88%)
 * saturate(106%)` — joyfulculinarycreations.com's own values to the digit); the
 * section-background probe reads the section and gets the bare image URL; the
 * run-surface builder reconstructs a solid plate from the runs standing on it.
 * They were emitted in that order as absolutely-positioned siblings, so the copy
 * carrying the LEAST information painted last:
 *
 * - **issue 1** — the reconstructed plate nested inside the section's image box
 *   and a child painted over its parent. 644 × 1280 px of the hero photograph
 *   read `(0, 0, 0)`; 25.96% of that page's diff mass, and zero value deltas.
 * - **issue 2** — above the plate, the section box's untreated copy of the same
 *   photograph painted over the treated backdrop: mean 142/255, the highest
 *   residual on the page, over 156 of 4743 rows.
 * - **issue 3** — `bandBaseFill`'s scrim guard read only the widest projection,
 *   so a `#28542d` veil recorded at four widths of seven and `null` at the two
 *   widest (where the panel it belongs to narrows to 770 of 1280px) was missed
 *   entirely and the flattened composite became the band's OPAQUE base at every
 *   width. 32.28% of the page's diff mass over a band the reference paints white.
 * - **issue 4** — `foldSectionBackgrounds` had no viewport-height branch at all,
 *   so every `section-bg-N` was pinned while every run standing on it carried
 *   `yFactor: 1`. 161 of 367 `escape` findings, and 100% of the
 *   `structural-failure` verdict — the one residual here that no perceptual
 *   average can ever see, because the page is exact at the captured viewport
 *   heights and comes apart at every other one.
 *
 * These drive the real `foldToL1` entry point over synthetic ladders shaped like
 * the bundle that filed the ticket: a `100vh` hero that paints a black base
 * under a treated photograph, and a testimonial band below it whose scrim stops
 * being band-wide at the widest two widths.
 */
import { describe, expect, it } from 'vitest'
import { foldToL1 } from '../tools/generate/src'
import type {
  MultiStateCapture,
  SectionValues,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

const WIDTHS = [320, 768, 1280]
const HEIGHTS = [800, 1000]
const HERO_IMG = 'https://joyful.test/HERO-AdobeStock_254767116-scaled.jpeg'
const HERO_BASE = '#000000'
const SCRIM = '#28542d'
const BAND_FILL = '#ffffff'

const section = (s: Partial<SectionValues> & Pick<SectionValues, 'index'>): SectionValues =>
  ({ overlay: null, contentAnchorRatio: null, ...s }) as SectionValues

const el = (o: Partial<ValueElement>): ValueElement =>
  ({ text: '', role: 'generic', color: '#111111', fontFamily: 'Karla', fontSizePx: 17, fontWeight: 400, ...o }) as ValueElement

/** One rung of the ladder, at a stated viewport width AND height. */
const projection = (
  width: number,
  height: number,
  elements: ValueElement[],
  sections: SectionValues[],
): StateProjection =>
  ({
    engine: 'chromium',
    viewport: { width, height },
    state: 'rest',
    manifest: { source: `req338:${width}x${height}`, elements, sections, viewport: { width, height } },
  }) as unknown as StateProjection

/**
 * The page the ticket was filed against, in miniature.
 *
 * The hero is `100vh` — its box IS the viewport height, which is what lets the
 * height probe measure `heightFactor: 1` for it — and everything below it starts
 * one viewport height down, which is what makes the band below it `yFactor: 1`.
 * The testimonial band's scrim is band-wide only while the panel carrying it is:
 * at 1280 the panel narrows and the capture records no overlay, exactly as
 * `multistate.json` does.
 */
function joyfulLadder(): MultiStateCapture {
  const projections: StateProjection[] = []
  for (const width of WIDTHS) {
    for (const height of HEIGHTS) {
      const scrimmed = width < 1280
      const bandY = height + 100
      projections.push(
        projection(
          width,
          height,
          [
            // The treatments probe's reading of the hero's overlay element: the
            // photograph WITH the opacity the page applies to it.
            el({
              textless: true,
              backgroundImageUrl: HERO_IMG,
              opacity: 0.49,
              surfaceFill: HERO_BASE,
              box: { x: 0, y: 0, width, height },
            }),
            el({
              text: 'Dreaming of healthier meals',
              role: 'heading',
              color: '#ffffff',
              fontSizePx: 40,
              surfaceFill: HERO_BASE,
              box: { x: 40, y: 300, width: width - 80, height: 48 },
            }),
            // The testimonial band's runs. The capture flattens the scrim into
            // every run standing on the panel — at EVERY width, because the panel
            // is still there when it stops being band-wide — so the run-derived
            // fill is the composite, and that is the colour that must not become
            // the band's base.
            el({
              text: 'What people are saying',
              role: 'heading',
              fontSizePx: 30,
              surfaceFill: SCRIM,
              box: { x: 0, y: bandY, width, height: 40 },
            }),
            el({
              text: 'Weekly meals, cooked in your own kitchen',
              surfaceFill: SCRIM,
              box: { x: 0, y: bandY + 60, width, height: 30 },
            }),
          ],
          [
            section({
              index: 0,
              box: { x: 0, y: 0, width, height },
              backgroundImageUrl: HERO_IMG,
              surfaceFill: HERO_BASE,
            }),
            section({
              index: 1,
              box: { x: 0, y: bandY, width, height: 200 },
              surfaceFill: BAND_FILL,
              overlay: scrimmed ? { color: SCRIM, opacity: 0.62 } : null,
            }),
          ],
        ),
      )
    }
  }
  return { url: 'https://joyfulculinarycreations.test/', notes: [], projections } as unknown as MultiStateCapture
}

type Node = {
  kind: string
  id?: string
  axes?: Record<string, unknown>
  geometry?: { keyframes: Array<Record<string, number>>; viewportResponse?: Record<string, number> }
  visibility?: { fromPx?: number; untilPx?: number }
  children?: Node[]
}

/** Every painted node in the folded tree, at any depth, with its parent chain. */
function walk(doc: ReturnType<typeof foldToL1>): Array<{ node: Node; parents: Node[] }> {
  const out: Array<{ node: Node; parents: Node[] }> = []
  const go = (nodes: Node[], parents: Node[]): void => {
    for (const n of nodes) {
      out.push({ node: n, parents })
      go(n.children ?? [], [...parents, n])
    }
  }
  go(((doc.root as unknown as Node).children ?? []) as Node[], [])
  return out
}

const folded = walk(foldToL1(joyfulLadder()))
const byId = (id: string): { node: Node; parents: Node[] } | undefined => folded.find((f) => f.node.id === id)

describe('REQ-338 issue 1 — a band is painted once, not twice', () => {
  it('test_UAT_FC_REQ-338_the_band_s_own_fill_is_not_reconstructed_a_second_time_over_its_image', () => {
    const hero = byId('section-bg-0')
    expect(hero, 'the hero section still folds to a box of its own').toBeTruthy()

    // The section box carries the section's OWN measured fill. CSS paints a box's
    // background-color under its background-image and the renderer does too, so
    // this is the base every other layer of the hero paints over — and the reason
    // no separate plate is needed to carry it.
    expect(hero!.node.axes?.surfaceFill, "the section box carries the section's own base fill").toBe(HERO_BASE)

    // …and no RECONSTRUCTED plate repaints it. The run-surface builder's
    // `section-band-N` used to nest here and paint `#000000` over 644 of the
    // hero's 800 rows — the photograph buried under the very colour it is
    // composited on.
    const inside = folded.filter((f) => f.parents.some((p) => p.id === 'section-bg-0'))
    expect(
      inside.map((f) => f.node.id).filter((id) => (id ?? '').startsWith('section-band-')),
      'no reconstructed band plate may nest inside the section box that already paints its fill',
    ).toEqual([])

    // The page has no `section-band-` plate for the hero at all: the section box
    // is the one carrier of that colour.
    expect(
      folded.filter((f) => f.node.axes?.surfaceFill === HERO_BASE).map((f) => f.node.id),
      'the hero fill is carried by the section box and by the overlay element the page paints it on',
    ).toEqual(['section-bg-0', 'backdrop-0'])
  })

  it('test_UAT_FC_REQ-338_a_band_the_section_box_does_not_cover_everywhere_keeps_its_own_plate', () => {
    // The drop is conditional, and the condition is load-bearing. The testimonial
    // section records its scrim at 320/768 only, so its `section-bg` box carries
    // `untilPx: 1280` — above that it paints nothing at all. A band that stopped
    // painting there would trade issue 1 for a white band gone missing.
    const bandPlate = folded.find((f) => (f.node.id ?? '').startsWith('section-band-'))
    expect(bandPlate, 'the testimonial band keeps a plate of its own').toBeTruthy()
    expect(bandPlate!.node.axes?.surfaceFill).toBe(BAND_FILL)

    const testimonialBox = folded.find(
      (f) => (f.node.id ?? '').startsWith('section-bg-') && f.node.axes?.overlay !== undefined,
    )
    expect(testimonialBox, 'and the section box that carries its scrim').toBeTruthy()
    expect(
      testimonialBox!.node.visibility?.untilPx,
      'which stops painting above the widths the scrim was recorded at',
    ).toBe(1280)
  })

  it('test_UAT_FC_REQ-338_a_section_the_capture_could_not_box_at_every_width_leaves_the_plate_alone', () => {
    // The same conditional, reached the other way. Here the section carries its
    // fill AND its image at every width, so the treatment is never in doubt — but
    // the capture resolved no BOX for it at 320. `foldSectionBackgrounds` skips a
    // width it cannot place, so the box it emits is gated `fromPx: 768` and paints
    // nothing on a phone. The plate must survive, or the band goes missing there.
    const bandBox = (w: number) => ({ x: 0, y: 0, width: w, height: 400 })
    const ladder = WIDTHS.map((w) =>
      projection(
        w,
        HEIGHTS[0],
        [
          el({ text: 'Eat well', box: { x: 24, y: 120, width: w - 48, height: 40 }, surfaceFill: HERO_BASE }),
          el({ text: 'Every day', box: { x: 24, y: 200, width: w - 48, height: 40 }, surfaceFill: HERO_BASE }),
        ],
        [
          section({
            index: 0,
            // Recorded at every width, but placed at only two of the three.
            box: w === 320 ? undefined : bandBox(w),
            backgroundImageUrl: HERO_IMG,
            surfaceFill: HERO_BASE,
          }),
        ],
      ),
    )
    const tree = walk(
      foldToL1({ url: 'http://req338.test/', notes: [], projections: ladder } as MultiStateCapture),
    )

    const bg = tree.find((f) => (f.node.id ?? '').startsWith('section-bg-'))
    expect(bg, 'the section box is emitted for the widths it could be placed at').toBeTruthy()
    expect(bg!.node.visibility?.fromPx, 'and paints nothing at the width it could not').toBe(768)

    const plate = tree.find((f) => (f.node.id ?? '').startsWith('section-band-'))
    expect(plate, 'so the reconstructed plate is the only carrier at 320 and is kept').toBeTruthy()
    expect(plate!.node.axes?.surfaceFill).toBe(HERO_BASE)
  })
})

describe('REQ-338 issue 2 — the treated copy of a background image is the only copy', () => {
  it('test_UAT_FC_REQ-338_the_image_is_painted_once_and_by_the_node_that_knows_its_treatments', () => {
    const carriers = folded.filter((f) => f.node.axes?.backgroundImageUrl === HERO_IMG)
    expect(
      carriers.map((f) => f.node.id),
      'exactly one node paints the hero photograph',
    ).toHaveLength(1)

    // And it is the better-informed one: the section probe read the bare URL, the
    // treatments probe read the element and got its opacity too.
    expect(carriers[0].node.axes?.opacity, 'the surviving copy carries the opacity the page applies').toBe(0.49)

    // The section box no longer carries a second, untreated copy.
    expect(byId('section-bg-0')!.node.axes?.backgroundImageUrl).toBeUndefined()
  })

  it('test_UAT_FC_REQ-338_the_photograph_paints_over_the_section_s_own_fill_not_under_it', () => {
    const carrier = folded.find((f) => f.node.axes?.backgroundImageUrl === HERO_IMG)!
    // Nesting is what puts it in the right layer: a top-level backdrop paints in
    // the background layer, BEFORE every surface that holds content — which is
    // how the black base ended up over the photograph in the first place.
    expect(
      carrier.parents.map((p) => p.id),
      'the photograph is a child of the box painting the fill it composites over',
    ).toContain('section-bg-0')
  })
})

describe('REQ-338 issue 3 — a scrim is looked for at every sampled width', () => {
  it('test_UAT_FC_REQ-338_a_scrim_that_stops_being_band_wide_is_not_promoted_to_an_opaque_base', () => {
    const plates = folded.filter((f) => (f.node.id ?? '').startsWith('section-band-'))
    expect(plates.length, 'the testimonial band folds to a plate').toBeGreaterThan(0)
    for (const plate of plates) {
      expect(
        plate.node.axes?.surfaceFill,
        'the flattened scrim composite may never become a band base — the band is white',
      ).not.toBe(SCRIM)
    }
    expect(plates.some((p) => p.node.axes?.surfaceFill === BAND_FILL), "the band's own measured fill survives").toBe(true)
  })

  it('test_UAT_FC_REQ-338_the_scrim_is_still_carried_where_the_capture_recorded_it', () => {
    // Removing the opaque plate must not remove the veil: it is carried on the
    // section box, at the widths the capture saw it, with its own opacity.
    const scrimmed = folded.find((f) => f.node.axes?.overlay !== undefined)
    expect(scrimmed, 'the scrim is still on the page').toBeTruthy()
    expect(scrimmed!.node.axes?.overlay).toMatchObject({ color: SCRIM, opacity: 0.62 })
  })
})

describe('REQ-338 issue 4 — a section background answers a taller viewport', () => {
  it('test_UAT_FC_REQ-338_a_full_height_section_box_grows_with_the_viewport', () => {
    const hero = byId('section-bg-0')!
    expect(
      hero.node.geometry?.viewportResponse,
      'the 100vh hero box grows a pixel of height per pixel of viewport height',
    ).toMatchObject({ heightFactor: 1 })
  })

  it('test_UAT_FC_REQ-338_a_section_box_below_a_full_height_one_travels_with_it', () => {
    const below = folded.find(
      (f) => (f.node.id ?? '').startsWith('section-bg-') && f.node.id !== 'section-bg-0',
    )
    expect(below, 'the testimonial section folds to a box of its own').toBeTruthy()
    expect(
      below!.node.geometry?.viewportResponse,
      'a band under a 100vh hero moves down with it',
    ).toMatchObject({ yFactor: 1 })
  })

  it('test_UAT_FC_REQ-338_every_section_box_keyframe_states_the_height_it_was_measured_at', () => {
    // A response is only readable against a stated baseline. Without `atHeight`
    // the factor is applied to an assumed height and the box lands anywhere.
    for (const f of folded.filter((f) => (f.node.id ?? '').startsWith('section-bg-'))) {
      for (const kf of f.node.geometry?.keyframes ?? []) {
        expect(kf.atHeight, `${f.node.id} keyframe at ${kf.at} states its measured viewport height`).toBe(HEIGHTS[0])
      }
    }
  })
})
