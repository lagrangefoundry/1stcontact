import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Carousel from '../packages/framework/src/modules/carousel/index.astro'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import type { ModuleMeta } from '../packages/framework/src/modules/types'
import {
  diffManifests,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-82eb6908 — "Gradients as a first-class value:
 * stop positions and panel surface gradients — captured, authored, and diffed."
 * One UAT per acceptance criterion, verifying the behaviour the existing `1c`
 * capture + values-diff pipeline and the framework's first-class gradient value
 * (styled-run text-fill gradient + gradient content validation) already ship.
 *
 * Boundary: the diff ACs drive the exported diff engine (`diffManifests`) — the
 * same code path the `1c` CLI runs; the authoring ACs drive the framework's
 * real render (Astro container, a carousel styled-text run) and content validator
 * (`validateModuleContent`).
 *
 *   AC-634 — text-fill gradient stop-position drift surfaces as a gradient delta
 *   AC-635 — gradient stops without an explicit offset are compared on colour only
 *   AC-636 — a missing/differing panel surface gradient surfaces; matching/absent → none
 *   AC-637 — a styled-run authored with a text-fill gradient paints the clipped sweep
 *   AC-638 — a gradient-typed content field accepts a well-formed gradient, rejects a malformed one
 */

// ── diff-engine helpers (mirror the sibling reconcile-values-diff UATs) ───────

/** A projected text run with sane defaults; `over` sets the axis under test. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}
const mani = (source: string, elements: ValueElement[]): ValueManifest => ({ source, elements, sections: [] })

const hasDelta = (deltas: { text: string; property: string }[], sub: string, property: string): boolean =>
  deltas.some((d) => d.text.includes(sub) && d.property === property)

/** Build the gigabytealchemy wordmark gradient with a middle stop at `mid` %. */
function wordmark(mid: number) {
  return {
    angleDeg: 90,
    stops: [
      { color: '#f5e6a3', position: 0 },
      { color: '#f5e6a3', position: mid },
      { color: '#ff6b35', position: 100 },
    ],
  }
}

// ── render helper (mirrors the REQ-62 framework UATs) ─────────────────────────

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(
    Carousel as Parameters<Container['renderToString']>[0],
    { props: props as Record<string, unknown> },
  )
}

/** A synthetic module exposing a gradient-typed content field — the gradient
 *  value validation primitive, independent of any one module's schema. */
const gradientMeta: ModuleMeta = {
  id: 'test-gradient',
  version: 1,
  variants: ['default'],
  dials: {},
  contentSchema: { panelGradient: { type: 'gradient', required: false } },
}

describe('story-82eb6908 — gradients as a first-class value', () => {
  it('test_UAT_AC634_text_fill_gradient_stop_position_drift_flags', () => {
    // Identical stop colours AND direction; only a middle stop's captured offset
    // differs — the reference cream holds to ~60%, the reproduction turns orange
    // at ~40% (a 20pp drift, well past the ±2pp default). This is the exact
    // wordmark blind spot: before stop positions were captured it diffed clean.
    const ref = mani('ref', [el('Wordmark', { gradient: wordmark(60) })])
    const drifted = mani('a', [el('Wordmark', { gradient: wordmark(40) })])
    expect(hasDelta(diffManifests(ref, drifted).deltas, 'Wordmark', 'gradient')).toBe(true)

    // Re-diff with the two offsets within the tolerance (60 vs 61, a 1pp gap) —
    // no gradient delta: sub-tolerance offset noise never fires.
    const within = mani('a', [el('Wordmark', { gradient: wordmark(61) })])
    expect(hasDelta(diffManifests(ref, within).deltas, 'Wordmark', 'gradient')).toBe(false)
  })

  it('test_UAT_AC635_positionless_stops_compared_on_colour_only', () => {
    // Both sides record NO explicit offset for their stops (evenly distributed):
    // identical ordered colours + direction ⇒ no gradient delta. Absent offsets
    // must not fabricate a false position delta.
    const stops = [
      { color: '#f5e6a3', position: null },
      { color: '#ff6b35', position: null },
    ]
    const bothNull = diffManifests(
      mani('ref', [el('Wordmark', { gradient: { angleDeg: 90, stops } })]),
      mani('a', [el('Wordmark', { gradient: { angleDeg: 90, stops: stops.map((s) => ({ ...s })) } })]),
    )
    expect(hasDelta(bothNull.deltas, 'Wordmark', 'gradient')).toBe(false)

    // The "one side" case: the reference captured offsets, the reproduction did
    // not (older / offset-free capture). Same colours + direction ⇒ still no
    // position delta, because a stop is offset-compared only when BOTH sides have
    // an offset — otherwise it falls back to colour alone.
    const oneNull = diffManifests(
      mani('ref', [el('Wordmark', { gradient: {
        angleDeg: 90,
        stops: [{ color: '#f5e6a3', position: 0 }, { color: '#ff6b35', position: 100 }],
      } })]),
      mani('a', [el('Wordmark', { gradient: {
        angleDeg: 90,
        stops: [{ color: '#f5e6a3', position: null }, { color: '#ff6b35', position: null }],
      } })]),
    )
    expect(hasDelta(oneNull.deltas, 'Wordmark', 'gradient')).toBe(false)
  })

  it('test_UAT_AC636_surface_gradient_present_vs_missing_flags', () => {
    const grad = { angleDeg: 135, stops: [
      { color: '#f1f5f9', position: 0 },
      { color: '#e2e8f0', position: 100 },
    ] }

    // (1) Reference card is a gradient; the reproduction paints a flat fill (the
    // gradient composited away). A surface-gradient delta surfaces — distinct
    // from the run's text colour and from the solid surface-fill axis.
    const missing = diffManifests(
      mani('ref', [el('What We are exploring', { surfaceGradient: grad })]),
      mani('a', [el('What We are exploring', { surfaceGradient: null })]),
    )
    expect(hasDelta(missing.deltas, 'exploring', 'surfaceGradient')).toBe(true)

    // (2) Both sides carry the matching gradient (same direction + stops) — none.
    const matched = diffManifests(
      mani('ref', [el('What We are exploring', { surfaceGradient: grad })]),
      mani('a', [el('What We are exploring', { surfaceGradient: { ...grad, stops: grad.stops.map((s) => ({ ...s })) } })]),
    )
    expect(hasDelta(matched.deltas, 'exploring', 'surfaceGradient')).toBe(false)

    // (3) Neither side has a surface gradient (a solid surface / the band) — none.
    const neither = diffManifests(
      mani('ref', [el('Plain body', { surfaceGradient: null })]),
      mani('a', [el('Plain body', { surfaceGradient: null })]),
    )
    expect(hasDelta(neither.deltas, 'Plain body', 'surfaceGradient')).toBe(false)
  })

  it('test_UAT_AC637_text_fill_gradient_paints_clipped_sweep', async () => {
    // A styled run authored with a text-fill gradient (a direction + two stops, one
    // an absolute hex, one a palette role) paints the glyphs with the specified
    // linear-gradient clipped to the text — the first-class gradient value.
    const html = await render({
      content: {
        heading: {
          text: 'What We are exploring.',
          gradient: { angleDeg: 135, stops: ['#f1f5f9', 'accent'] },
        },
        items: [{ body: 'A quote.' }],
      },
    })
    // The specified linear gradient — direction and both stop colours resolved:
    // the hex literal verbatim, the role → its overlay var.
    expect(html).toContain('background-image: linear-gradient(135deg, #f1f5f9 0%, var(--color-accent) 100%)')
    // A text-fill gradient clips to the glyphs and forces transparent text.
    expect(html).toContain('background-clip: text')
    expect(html).toContain('color: transparent')
  })

  it('test_UAT_AC638_gradient_field_accepts_wellformed_rejects_malformed', () => {
    // A well-formed gradient object — a direction alias plus colour stops, each an
    // absolute hex or a palette-role alias — produces no validation error.
    const wellFormed = validateModuleContent(gradientMeta, {
      panelGradient: { angleDeg: 'to-br', stops: ['#f1f5f9', 'accent'] },
    })
    expect(wellFormed).toEqual([])

    // A value that is not a gradient object (here a string) is rejected with a
    // validation error that names the offending gradient field.
    const notAnObject = validateModuleContent(gradientMeta, {
      panelGradient: 'not-a-gradient',
    })
    expect(notAnObject.some((e) => e.field === 'panelGradient')).toBe(true)
  })
})
