/**
 * REQ-338 issue 5, downstream half — a scrim's BLEND MODE is part of what it
 * paints, so it has to survive the whole way: capture → L1 → render, and be
 * compared when the two sides disagree.
 *
 * A page-builder band routinely veils its photograph with `mix-blend-mode`
 * rather than plain alpha. joyfulculinarycreations.com's vegetable band paints
 * `#141e14` at an effective 0.67 with `darken`; recorded without the mode it
 * reproduces as a flat tint, and alpha-only compositing lifted the band's
 * darkest pixels by roughly 55/255 over 13.96% of that page's diff mass.
 * `l1BlendModeSchema` already existed for the `blendMode` node axis — the
 * overlay just could not say it.
 *
 * The renderer emits it as `background-blend-mode` on the scrim's OWN layer, not
 * as `mix-blend-mode` on the box: the blend belongs between the veil and the
 * image it veils, and must never reach the page behind them.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { diffManifests } from '../tools/generate/src/cli/capture'
import type { SectionValues, ValueManifest } from '../tools/generate/src/cli/capture'

const WIDTHS = [320, 1280]
const VEIL = '#141e14'
const PHOTO = 'https://joyful.test/market-vegetables-produce-6329164.jpg'

const docWith = (node: L1Node): L1Document => ({ widths: WIDTHS, root: { kind: 'box', children: [node] } })

/** The vegetable band as L1: a photograph under a dark scrim that darkens it. */
const veiledBand = (blendMode?: string): L1Node =>
  ({
    kind: 'box',
    id: 'section-bg-4',
    axes: {
      backgroundImageUrl: PHOTO,
      overlay: { color: VEIL, opacity: 0.67, ...(blendMode ? { blendMode } : {}) },
    },
    geometry: { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 2667, width: at, height: 268 })) },
  }) as unknown as L1Node

/** Every declaration of `.cls`'s media-query-free rules. */
function baseDecls(css: string, cls: string): string[] {
  const out: string[] = []
  for (const [, body] of css.matchAll(new RegExp(`(?:^|\\n)\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))) {
    out.push(...body.split(';').map((d) => d.trim()).filter(Boolean))
  }
  return out
}

describe('REQ-338 — the L1 envelope can say how a veil composites', () => {
  it('test_UAT_FC_REQ-338_the_validator_accepts_a_blend_mode_on_an_overlay', () => {
    const res = validateL1(docWith(veiledBand('darken')))
    expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  })

  it('test_UAT_FC_REQ-338_the_validator_rejects_a_blend_mode_that_is_not_one', () => {
    // Closed enum, like every other axis — the structured-only invariant means
    // there is no raw-CSS hole here for an arbitrary string to travel through.
    const res = validateL1(docWith(veiledBand('brighten-a-bit')))
    expect(res.ok).toBe(false)
  })
})

describe('REQ-338 — the renderer paints the veil the way the page does', () => {
  it('test_UAT_FC_REQ-338_a_blended_veil_emits_background_blend_mode_on_its_own_layer', () => {
    const { css } = renderL1Document(docWith(veiledBand('darken')))
    const decls = baseDecls(css, 'l1-1')
    const blend = decls.find((d) => d.startsWith('background-blend-mode:'))
    expect(blend, 'the box states how its layers composite').toBeTruthy()

    // The scrim is the FIRST layer and the one that blends; the photograph under
    // it composites normally. Emitted positionally, like the sizing triple.
    expect(blend).toBe('background-blend-mode: darken, normal')

    // And it is `background-blend-mode`, never `mix-blend-mode`: the blend is
    // confined to this box's own background stack and never reaches the page.
    expect(decls.some((d) => d.startsWith('mix-blend-mode:'))).toBe(false)
  })

  it('test_UAT_FC_REQ-338_a_veil_that_composites_normally_emits_no_declaration_at_all', () => {
    // The CSS default is `normal`, so saying so would be noise on every page that
    // ever carried a scrim.
    const { css } = renderL1Document(docWith(veiledBand()))
    expect(baseDecls(css, 'l1-1').some((d) => d.startsWith('background-blend-mode:'))).toBe(false)
  })
})

describe('REQ-338 — the comparator reads the blend mode as part of the veil', () => {
  const manifest = (overlay: SectionValues['overlay']): ValueManifest =>
    ({
      source: 'req338',
      elements: [],
      sections: [{ index: 0, overlay, contentAnchorRatio: null } as unknown as SectionValues],
      viewport: { width: 1280, height: 800 },
    }) as unknown as ValueManifest

  const overlayDeltas = (a: SectionValues['overlay'], b: SectionValues['overlay']) =>
    diffManifests(manifest(a), manifest(b)).deltas.filter((d) => d.property === 'overlay')

  it('test_UAT_FC_REQ-338_two_veils_that_composite_differently_are_a_delta', () => {
    // Before this the two read clean: same colour, same alpha, different pixels.
    const deltas = overlayDeltas(
      { color: VEIL, opacity: 0.67, blendMode: 'darken' },
      { color: VEIL, opacity: 0.67 },
    )
    expect(deltas, 'a `darken` veil and a `normal` one are not the same veil').toHaveLength(1)
    // …and the reader can see WHICH one arrived, not just that something differs.
    expect(deltas[0].expected).toContain('darken')
    expect(deltas[0].actual).not.toContain('darken')
  })

  it('test_UAT_FC_REQ-338_a_veil_reproduced_with_its_blend_mode_reports_clean', () => {
    expect(
      overlayDeltas(
        { color: VEIL, opacity: 0.67, blendMode: 'darken' },
        { color: VEIL, opacity: 0.67, blendMode: 'darken' },
      ),
    ).toHaveLength(0)
  })
})
