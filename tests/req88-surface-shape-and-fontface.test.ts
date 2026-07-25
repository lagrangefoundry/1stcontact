/**
 * REQ-88 — two reproduction-fidelity fixes found by reading the round-5
 * gigabytealchemy reproduction against the target.
 *
 * **1. Card geometry is measured, not inferred.** BUG-14's card reconstruction
 * derived a panel's box from where its *text runs* sat, expanded by an estimate of
 * the ancestor's unseen padding. That estimate is what produced BUG-21's 2x-height
 * buttons; correcting it per-edge only changed the direction of the error — panels
 * then came out *inset* by a per-card amount (`x=111 w=854` against the reference's
 * `x=88 w=896`, and each of three sibling panels off by a different margin), and a
 * panel's rounding vanished entirely because a *run* is square while the *panel*
 * element carries `r=8`.
 *
 * The capture already records the answer. BUG-22 added `SurfaceShape` — which
 * ancestor paints a run's surface, that element's own rect, and its radius — so the
 * fold reads it instead of re-deriving it. Nothing is inferred, and nothing is
 * invented when the capture carried no surface shape.
 *
 * One exception is load-bearing: a surface as wide as the viewport is the **band**,
 * not a card (the run sits directly on the section). Bands are reconstructed
 * separately, so adopting that rect here would stretch a quote's accent rule across
 * a whole section — 868x29 became 1280x595 before the guard.
 *
 * **2. A mirrored web font actually binds.** Two joins were broken between a
 * captured `@font-face` and the run that paints it, both fallout from BUG-16
 * widening a run's `fontFamily` from its primary token to the full stack:
 *   - `buildTheme` looked the face-file table up by the full stack (`Cinzel, serif`)
 *     while it is keyed by the bare `@font-face` name (`Cinzel`), so `files` came
 *     back empty and no resource reached the document;
 *   - the face then declared the *stack* as its family, which the renderer
 *     sanitises to `"Cinzel serif"` — a name no run's `Cinzel, serif` can match.
 *
 * Either break alone leaves the title painting the document default: an unmatched
 * family is valid CSS that resolves to no font. Both are joins between two tables,
 * so both are asserted end-to-end rather than at the seam.
 */
import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1 } from '../packages/site-schema/src'
import { foldToL1 } from '../tools/generate/src'
import { buildTheme } from '../tools/generate/src/cli/capture/theme'
import type { L1Box, L1Document } from '../packages/site-schema/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

type Box = NonNullable<ValueElement['box']>

function run(text: string, box: Box, over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'text', color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400, box, ...over }
}

/** A run whose surface is painted by an ancestor with its own rect + rounding. */
function onSurface(text: string, box: Box, surfaceBox: Box, over: Partial<ValueElement> = {}): ValueElement {
  return run(text, box, {
    surfaceFill: '#f8f5f2',
    surface: { self: false, box: surfaceBox, borderRadiusPx: 8, boxShadow: null, border: null },
    ...over,
  })
}

/** A full-width section fill, so the panels under test read as cards on a band. */
function band(width: number): ValueElement {
  return run('Our Mission', { x: 24, y: 1351, width: width - 48, height: 40 }, { surfaceFill: '#d9ccba' })
}

function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: { source: `t:${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 1200 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

function cards(doc: L1Document): L1Box[] {
  const root = doc.root as { children?: unknown[] }
  return (root.children ?? []).filter(
    (n) => (n as L1Box).kind === 'box' && String((n as L1Box).id ?? '').startsWith('card'),
  ) as L1Box[]
}

function frameAt(box: L1Box, at: number): { x: number; y: number; width: number; height?: number } {
  const kf = box.geometry.keyframes.find((k) => k.at === at)
  expect(kf, `${box.id} must have a keyframe at ${at}`).toBeDefined()
  return kf!
}

describe('REQ-88 — a card takes the captured surface rect; a mirrored face binds its family', () => {
  it('test_UAT_FC_REQ-88_a_card_adopts_the_captured_surface_rect_and_radius', () => {
    // Two runs inside one panel. Their own boxes are inset from the panel by an
    // asymmetric margin (24 left, 32 top) that no vertical-rhythm estimate could
    // recover, and both are square — the rounding lives on the panel element.
    const SURFACE = { x: 88, y: 2119, width: 896, height: 332 }
    const doc = foldToL1(
      multiFrom((w) => [
        band(w),
        onSurface('Sanctum Voice', { x: 124, y: 2151, width: 167, height: 32 }, SURFACE),
        onSurface('Your private space to think out loud', { x: 124, y: 2199, width: 828, height: 44 }, SURFACE),
      ]),
    )
    expect(validateL1(doc).ok, 'the fold must stay inside the L1 envelope').toBe(true)

    const card = cards(doc).find((b) => b.axes?.surfaceFill === '#f8f5f2')
    expect(card, 'the two runs must fold to one card').toBeDefined()
    const kf = frameAt(card!, 1280)
    // The panel's measured rect, exactly — not the runs' union (x 124..952) and not
    // that union outset by an estimate.
    expect({ x: kf.x, y: kf.y, width: kf.width, height: kf.height }).toEqual(SURFACE)
    // Rounding comes from the surface-bearing box; both runs are square.
    expect(card!.axes?.borderRadiusPx).toBe(8)
  })

  it('test_UAT_FC_REQ-88_sibling_panels_sharing_no_surface_stay_separate_and_aligned', () => {
    // Three tiles in a row, each its own surface. The measured rect is an identity:
    // same rect joins, different rects never do — so the tiles cannot merge into one
    // box, and none drifts to a different x/width from its siblings.
    const TILES = [
      { x: 88, y: 1525, width: 277, height: 192 },
      { x: 397, y: 1525, width: 277, height: 192 },
      { x: 707, y: 1525, width: 277, height: 192 },
    ]
    const doc = foldToL1(
      multiFrom((w) => [
        band(w),
        ...TILES.flatMap((t, i) => [
          onSurface(`Title ${i}`, { x: t.x + 24, y: t.y + 24, width: 229, height: 28 }, t),
          onSurface(`Body ${i}`, { x: t.x + 24, y: t.y + 64, width: 229, height: 104 }, t),
        ]),
      ]),
    )
    const got = cards(doc)
      .map((b) => frameAt(b, 1280))
      .map((k) => ({ x: k.x, y: k.y, width: k.width, height: k.height }))
      .sort((a, b) => a.x - b.x)
    expect(got).toEqual(TILES)
  })

  it('test_UAT_FC_REQ-88_a_full_viewport_surface_is_a_band_so_the_run_keeps_its_own_box', () => {
    // A quote sitting directly on the section: its painting ancestor IS the band, so
    // the run must keep its own box. Adopting the band rect stretched an 868x29
    // accent rule to 1280x595.
    const doc = foldToL1(
      multiFrom((w) => [
        run('These aren’t just features', { x: 116, y: 1757, width: 868, height: 29 }, {
          surfaceFill: '#d9ccba',
          borderLeft: { widthPx: 4, color: '#00d492' },
          surface: {
            self: false,
            box: { x: 0, y: 1288, width: w, height: 595 },
            borderRadiusPx: 0,
            boxShadow: null,
            border: null,
          },
        }),
      ]),
    )
    const card = cards(doc).find((b) => b.axes?.borderLeft?.color === '#00d492')
    expect(card, 'the accent run must still fold a card box').toBeDefined()
    const kf = frameAt(card!, 1280)
    expect({ x: kf.x, width: kf.width, height: kf.height }).toEqual({ x: 116, width: 868, height: 29 })
    // The band's rounding must not leak onto it either.
    expect(card!.axes?.borderRadiusPx).toBeUndefined()
  })

  it('test_UAT_FC_REQ-88_a_face_file_table_joins_a_run_stack_on_its_primary_token', () => {
    // `buildTheme` receives the face table keyed by the bare `@font-face` name while
    // painted runs carry the full stack. Joining on the raw stack returned no files,
    // so the mirrored .woff2 reached no document.
    const signals = {
      bands: [
        {
          content: [{ text: 'Gigabyte Alchemy', role: 'heading', fontFamily: 'Cinzel, serif', fontWeight: 600, fontSizePx: 72 }],
          items: [],
        },
      ],
      colorUsage: [],
      typeScale: [],
      spacingScalePx: [],
    } as unknown as Parameters<typeof buildTheme>[0]

    const theme = buildTheme(signals, new Map([['Cinzel', ['assets/cinzel.woff2']]]))
    const cinzel = theme.fonts.find((f) => f.family.startsWith('Cinzel'))
    expect(cinzel, 'the painted family must appear in the theme').toBeDefined()
    expect(cinzel!.files, 'the mirrored face must join the stack on its primary token').toEqual([
      'assets/cinzel.woff2',
    ])
  })

  it('test_UAT_FC_REQ-88_an_emitted_font_face_declares_a_family_the_run_can_match', () => {
    // End-to-end: a document whose resource family is the bare name must emit an
    // @font-face the painted run's stack resolves against. Declaring the stack
    // sanitises to "Cinzel serif", which `Cinzel, serif` never matches.
    const doc = foldToL1(
      multiFrom(() => [run('Gigabyte Alchemy', { x: 88, y: 79, width: 685, height: 90 }, { fontFamily: 'Cinzel, serif' })]),
      { fonts: [{ family: 'Cinzel', src: 'assets/cinzel.woff2', weight: 600 }] },
    )
    expect(doc.resources?.fonts, 'a painted face must survive into the document').toHaveLength(1)

    const { css } = renderL1Document(doc)
    const face = /@font-face \{[^}]*\}/.exec(css)
    expect(face, 'an @font-face rule must be emitted').not.toBeNull()
    expect(face![0]).toContain('font-family: "Cinzel"')
    expect(face![0]).not.toContain('Cinzel serif')
    expect(face![0]).toContain('assets/cinzel.woff2')
    // And the run that needs it still paints the full stack.
    expect(css).toContain('font-family: Cinzel, serif')
  })
})
