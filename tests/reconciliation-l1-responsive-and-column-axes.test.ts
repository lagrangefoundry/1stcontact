/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", the BUNDLE-10 wave of the language (BUG-14 / BUG-17 / BUG-18 /
 * BUG-20 / REQ-88).
 *
 * These are the axes a *real* page demanded and the substrate could not state,
 * each closed as a typed L1 primitive rather than a raw-CSS hole or a bespoke
 * module (DOC-7 §6.3):
 *
 *   AC-759  per-side padding insets content inside the pinned border box
 *   AC-760  a varying numeric axis carries a per-width track that owns it
 *   AC-761  a text leaf paints its own chip surface, under the box axes' bounds
 *   AC-762  a box carries a typed left accent rule distinct from a full border
 *   AC-763  a run declares the width from which it is unbreakable
 *   AC-764  viewport-height response is a derivative resolved against `atHeight`
 *   AC-765  a document column + per-node anchor place x and width independently
 *   AC-766  anchored placement is emitted as a *valid* expression, so it applies
 *
 * The earlier ACs of the same story (AC-682…688, AC-723, AC-725…728) are covered
 * by `reconciliation-l1-substrate.test.ts` and `reconciliation-l1-language.test.ts`.
 *
 * The validator/emitter probes are engine-free and run everywhere. The
 * real-browser probes (the rendered-position obligation of AC-766, the
 * border-box obligation of AC-759, the mobile-value obligation of AC-760, the
 * `100vh` obligation of AC-764, and the cross-engine half of AC-763) run on a
 * real engine and skip cleanly where none is installed.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { createEngineDriver, engineAvailable, serveL1 } from '../tools/generate/src'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const chromiumReady = await engineAvailable('chromium')

const availableEngines: Array<'chromium' | 'webkit' | 'firefox'> = []
for (const e of ['chromium', 'webkit', 'firefox'] as const) {
  if (await engineAvailable(e)) availableEngines.push(e)
}

// ── shared helpers ────────────────────────────────────────────────────────────

/** Every declaration block emitted for one class, joined (base + media rules). */
function declsFor(css: string, cls: string): string {
  const re = new RegExp(`\\.${cls} \\{([^}]*)\\}`, 'g')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) out.push(m[1].trim())
  return out.join(' | ')
}

/** The un-media-queried head of a stylesheet — the base cascade. */
function headCss(css: string): string {
  const i = css.indexOf('@media')
  return i === -1 ? css : css.slice(0, i)
}

/** One `@media (min-width: Npx)` block's text. */
function mediaBlock(css: string, minWidth: number): string {
  return css.split('@media').find((b) => b.startsWith(` (min-width: ${minWidth}px)`)) ?? ''
}

interface ProbedRect {
  left: number
  top: number
  width: number
  height: number
  text: string
  fontSizePx: number
  paddingLeftPx: number
}
interface Probe {
  rects: Record<string, ProbedRect>
  scrollWidth: number
}

/**
 * Read every emitted L1 element's rendered rect and the computed axes that
 * matter here. Class names are `l1-N` in pre-order, so `l1-1` is the root's
 * first child.
 */
const RECT_PROBE = `(() => {
  var out = {};
  Array.prototype.forEach.call(document.querySelectorAll('[class^="l1-"]'), function (el) {
    var r = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    out[el.className] = {
      left: r.left, top: r.top, width: r.width, height: r.height,
      text: (el.textContent || '').slice(0, 40),
      fontSizePx: parseFloat(cs.fontSize),
      paddingLeftPx: parseFloat(cs.paddingLeft)
    };
  });
  return { rects: out, scrollWidth: document.documentElement.scrollWidth };
})()`

/** Render, serve, and probe one document at each requested viewport. */
async function probeViewports(
  doc: L1Document,
  viewports: Array<{ width: number; height?: number }>,
  engine: 'chromium' | 'webkit' | 'firefox' = 'chromium',
): Promise<Record<string, Probe>> {
  const served = await serveL1(doc)
  const driver = await createEngineDriver(engine)()
  const out: Record<string, Probe> = {}
  try {
    for (const vp of viewports) {
      const height = vp.height ?? 900
      await driver.navigate(served.url, { width: vp.width, height })
      out[`${vp.width}x${height}`] = await driver.query<Probe>(RECT_PROBE)
    }
  } finally {
    await driver.close()
    await served.close()
  }
  return out
}

// ── AC-759: per-side padding insets content inside the pinned box ─────────────

/** A pinned 200x48 box carrying a text child, with the padding under test. */
function paddedDoc(padding?: Record<string, number>): L1Document {
  return {
    widths: [320, 1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'box',
          axes: { surfaceFill: '#111827' },
          geometry: { keyframes: [{ at: 1280, x: 24, y: 40, width: 200, height: 48 }] },
          ...(padding ? { padding } : {}),
          children: [
            {
              kind: 'text',
              text: 'inset me',
              axes: { color: '#ffffff', fontSizePx: 16, lineHeightPx: 20 },
            },
          ],
        },
      ],
    },
  } as L1Document
}

describe('AC-759 per-side padding insets content inside the pinned box', () => {
  it('test_UAT_AC759_padding_insets_content_without_moving_the_pinned_border_box', async () => {
    const padding = { topPx: 12, rightPx: 16, bottomPx: 20, leftPx: 24 }
    const { css } = renderL1Document(paddedDoc(padding))

    // The four sides are emitted as individual per-side declarations…
    expect(css).toContain('padding-top: 12px')
    expect(css).toContain('padding-right: 16px')
    expect(css).toContain('padding-bottom: 20px')
    expect(css).toContain('padding-left: 24px')
    // …alongside the *unchanged* pinned geometry — padding eats the box from the
    // inside rather than inflating what the document declared…
    expect(css).toContain('width: 200px')
    expect(css).toContain('height: 48px')
    // …which is only true because the document's own reset sizes by border box.
    expect(css).toContain('box-sizing: border-box')

    // A node declaring one side leaves the other three untouched — no reset to 0.
    const oneSide = renderL1Document(paddedDoc({ leftPx: 24 })).css
    expect(oneSide).toContain('padding-left: 24px')
    expect(oneSide).not.toContain('padding-top')
    expect(oneSide).not.toContain('padding-right')
    expect(oneSide).not.toContain('padding-bottom')

    // The envelope is the boundary: the in-range document is accepted, and a
    // negative side, an over-cap side, and a freeform key are each refused
    // before the document can reach the renderer.
    expect(validateL1(paddedDoc(padding)).ok, 'in-range padding accepted').toBe(true)
    const rejected: Record<string, Record<string, unknown>> = {
      negativeSide: { leftPx: -4 },
      overCapSide: { leftPx: 20_000 },
      freeformKey: { leftPx: 8, style: 'position:fixed' },
    }
    for (const [name, pad] of Object.entries(rejected)) {
      const result = validateL1(paddedDoc(pad as Record<string, number>))
      expect(result.ok, `${name} must be rejected`).toBe(false)
    }
    // The two numeric violations locate the offending side; the freeform key is
    // caught at the node union's boundary, so it names the node rather than the
    // side — either way the document never reaches the renderer.
    for (const name of ['negativeSide', 'overCapSide'] as const) {
      const result = validateL1(paddedDoc(rejected[name] as Record<string, number>))
      expect(!result.ok && result.errors.some((e) => e.path.endsWith('/padding/leftPx')), name).toBe(
        true,
      )
    }

    // Real engine: the padded node reports the SAME outer rect as the unpadded
    // one, while its content is inset by exactly the declared left padding.
    if (chromiumReady) {
      const withPad = await probeViewports(paddedDoc(padding), [{ width: 1280 }])
      const noPad = await probeViewports(paddedDoc(), [{ width: 1280 }])
      const boxed = withPad['1280x900'].rects['l1-1']
      const bare = noPad['1280x900'].rects['l1-1']

      expect(boxed.left).toBeCloseTo(bare.left, 1)
      expect(boxed.top).toBeCloseTo(bare.top, 1)
      expect(boxed.width).toBeCloseTo(200, 1)
      expect(bare.width).toBeCloseTo(200, 1)
      expect(boxed.height).toBeCloseTo(48, 1)
      expect(bare.height).toBeCloseTo(48, 1)

      // The content moved; the box did not.
      const inner = withPad['1280x900'].rects['l1-2']
      const innerBare = noPad['1280x900'].rects['l1-2']
      expect(inner.left - bare.left).toBeCloseTo(24, 1)
      expect(innerBare.left - bare.left).toBeCloseTo(0, 1)
      expect(inner.width).toBeCloseTo(200 - 24 - 16, 1)
    }
  }, 180000)
})

// ── AC-760: a per-width track owns its axis at render time ────────────────────

/** A tracked type axis, an invariant one, and a tracked padding side. */
function trackedDoc(): L1Document {
  return {
    widths: LADDER,
    root: {
      kind: 'box',
      children: [
        {
          kind: 'text',
          text: 'Tracked headline',
          // `axes.fontSizePx` stays the representative (widest) value; the track
          // is what actually owns the axis in the cascade.
          axes: { color: '#111111', fontSizePx: 72, lineHeightPx: 29 },
          responsive: {
            fontSizePx: {
              keyframes: [
                { at: 320, value: 36 },
                { at: 1440, value: 72 },
              ],
              segments: ['interpolate'],
            },
          },
          geometry: {
            keyframes: [
              { at: 320, x: 20, y: 20, width: 280 },
              { at: 1440, x: 20, y: 20, width: 900 },
            ],
            segments: ['interpolate'],
          },
        },
        {
          kind: 'text',
          text: 'Invariant subhead',
          axes: { color: '#666666', fontSizePx: 18, lineHeightPx: 29 },
        },
        {
          kind: 'box',
          axes: { surfaceFill: '#eeeeee' },
          padding: { topPx: 8, leftPx: 32 },
          responsivePadding: {
            leftPx: {
              keyframes: [
                { at: 320, value: 12 },
                { at: 1024, value: 32 },
              ],
              segments: ['snap'],
            },
          },
        },
      ],
    },
  } as L1Document
}

describe('AC-760 a varying numeric axis carries a per-width track that owns it', () => {
  it('test_UAT_AC760_track_owns_its_axis_while_an_invariant_axis_stays_scalar', async () => {
    const doc = trackedDoc()
    expect(validateL1(doc).ok, 'a well-formed tracked document is accepted').toBe(true)
    const { css } = renderL1Document(doc)
    const head = headCss(css)

    // The smallest keyframe is the page's BASE value and holds below the ladder.
    expect(head).toContain('.l1-1 { font-size: 36px }')
    // No competing single-valued declaration: the desktop value appears only as a
    // per-breakpoint override, never in the base cascade.
    expect(head).not.toContain('font-size: 72px')
    expect(mediaBlock(css, 1440)).toContain('font-size: 72px')
    // …and it varies continuously between the two declared widths.
    expect(mediaBlock(css, 320)).toContain('font-size: calc(36px + (36 * (100vw - 320px) / 1120))')

    // An axis that does not vary stays a plain single value and gains no track:
    // line-height is emitted once, in the base cascade, with no media override.
    expect(head).toContain('line-height: 29px')
    expect(css.slice(css.indexOf('@media'))).not.toContain('line-height')

    // A padding side is trackable on the same terms: the track owns the side and
    // the static longhand for it is suppressed, while the untracked side stays.
    expect(head).toContain('padding-left: 12px')
    expect(head).toContain('padding-top: 8px')
    expect(head).not.toContain('padding-left: 32px')
    expect(mediaBlock(css, 1024)).toContain('padding-left: 32px')

    // The envelope requires each keyframe at a declared ladder width, in range,
    // with segment flags exactly one shorter than the keyframes.
    const trackDoc = (track: unknown): unknown => ({
      widths: LADDER,
      root: { kind: 'text', text: 'x', responsive: { fontSizePx: track } },
    })
    const rejected: Record<string, unknown> = {
      offLadderWidth: trackDoc({ keyframes: [{ at: 999, value: 36 }] }),
      valueOutOfRange: trackDoc({
        keyframes: [
          { at: 320, value: 5000 },
          { at: 1440, value: 72 },
        ],
        segments: ['interpolate'],
      }),
      mismatchedSegments: trackDoc({
        keyframes: [
          { at: 320, value: 36 },
          { at: 1440, value: 72 },
        ],
        segments: ['interpolate', 'snap'],
      }),
      notAscending: trackDoc({
        keyframes: [
          { at: 1440, value: 72 },
          { at: 320, value: 36 },
        ],
        segments: ['interpolate'],
      }),
    }
    for (const [name, bad] of Object.entries(rejected)) {
      const result = validateL1(bad)
      expect(result.ok, `${name} must be rejected`).toBe(false)
      if (!result.ok) {
        expect(
          result.errors.some((e) => e.path.includes('/responsive/fontSizePx')),
          `${name} names the offending track`,
        ).toBe(true)
      }
    }

    // Real engine: a viewport at the ladder's smallest width shows the MOBILE
    // value, not the desktop one — the whole point of the track.
    if (chromiumReady) {
      const probes = await probeViewports(doc, [{ width: 320 }, { width: 1440 }])
      expect(probes['320x900'].rects['l1-1'].fontSizePx).toBeCloseTo(36, 1)
      expect(probes['1440x900'].rects['l1-1'].fontSizePx).toBeCloseTo(72, 1)
      // The invariant run is the same size at both widths.
      expect(probes['320x900'].rects['l1-2'].fontSizePx).toBeCloseTo(18, 1)
      expect(probes['1440x900'].rects['l1-2'].fontSizePx).toBeCloseTo(18, 1)
      // The tracked padding side snaps at its declared breakpoint.
      expect(probes['320x900'].rects['l1-3'].paddingLeftPx).toBeCloseTo(12, 1)
      expect(probes['1440x900'].rects['l1-3'].paddingLeftPx).toBeCloseTo(32, 1)
    }
  }, 180000)
})

// ── AC-761: a text leaf paints its own chip surface ───────────────────────────

describe('AC-761 a text leaf paints its own chip surface under the box axes bounds', () => {
  it('test_UAT_AC761_chip_axes_paint_on_the_run_itself_and_take_the_box_bounds', () => {
    // A "Coming soon" pill: one element that is both a styled run and a painted
    // surface. Before BUG-20 this fused element had to become a text leaf and
    // lost its pill entirely.
    const chip: L1Document = {
      widths: [320, 1280],
      root: {
        kind: 'text',
        text: 'Coming soon',
        axes: {
          color: '#ffffff',
          fontSizePx: 14,
          fontWeight: 600,
          surfaceFill: '#111827',
          borderRadiusPx: 9999,
          boxShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 6, color: '#00000033' },
          border: { widthPx: 1, color: '#334155', style: 'solid' },
        },
      },
    }
    expect(validateL1(chip).ok, 'an in-bounds chip is accepted').toBe(true)

    const { html, css } = renderL1Document(chip)
    // All four surface axes land on the text element's OWN rule…
    const run = declsFor(css, 'l1-0')
    expect(run).toContain('background-color: #111827')
    expect(run).toContain('border-radius: 9999px')
    expect(run).toContain('border: 1px solid #334155')
    expect(run).toContain('box-shadow: 0px 2px 6px #00000033')
    // …so the chip is painted exactly once, with no separate box behind it.
    expect(html.startsWith('<p ')).toBe(true)
    expect(html).not.toContain('<div')

    // Where a run somehow declares both, the glyph gradient wins the
    // background-image slot — it is what paints the text itself.
    const both: L1Document = {
      widths: [320, 1280],
      root: {
        kind: 'text',
        text: 'Gradient wordmark',
        axes: {
          color: '#ffffff',
          surfaceFill: '#111827',
          gradientFill: {
            angleDeg: 90,
            stops: [{ color: '#facc15' }, { color: '#fb923c' }],
          },
        },
      },
    }
    const bothCss = renderL1Document(both).css
    expect(bothCss).toContain('background-image: linear-gradient(90deg, #facc15, #fb923c)')
    expect(bothCss).toContain('background-clip: text')
    expect(bothCss).not.toContain('background-color: #111827')

    // A run cannot paint a surface the substrate would refuse on a box: the chip
    // axes take the very same envelope bounds as the equivalent box axes.
    const chipDoc = (axes: Record<string, unknown>): unknown => ({
      widths: [320, 1280],
      root: { kind: 'text', text: 'x', axes },
    })
    const rejected: Record<string, unknown> = {
      radiusOutOfRange: chipDoc({ borderRadiusPx: 200_000 }),
      shadowOffsetOutOfRange: chipDoc({
        boxShadow: { offsetXPx: 0, offsetYPx: 50_000, color: '#000000' },
      }),
      shadowBlurOutOfRange: chipDoc({
        boxShadow: { offsetXPx: 0, offsetYPx: 0, blurPx: 50_000, color: '#000000' },
      }),
      nonHexChipFill: chipDoc({ surfaceFill: 'red' }),
      nonHexChipBorder: chipDoc({ border: { widthPx: 1, color: 'rebeccapurple' } }),
      chipBorderWidthOutOfRange: chipDoc({ border: { widthPx: 50_000, color: '#000000' } }),
      freeformShadowKey: chipDoc({
        boxShadow: { offsetXPx: 0, offsetYPx: 0, color: '#000000', style: 'x' },
      }),
    }
    for (const [name, bad] of Object.entries(rejected)) {
      expect(validateL1(bad).ok, `${name} must be rejected`).toBe(false)
    }
  })
})

// ── AC-762: a box carries a typed left accent rule ────────────────────────────

describe('AC-762 a box carries a typed left accent rule distinct from a full border', () => {
  it('test_UAT_AC762_left_accent_rule_paints_one_edge_and_coexists_with_a_border', () => {
    const doc: L1Document = {
      widths: [320, 1280],
      root: {
        kind: 'box',
        children: [
          // A card whose design IS a thick coloured rule down its left edge.
          {
            kind: 'box',
            axes: { borderLeft: { widthPx: 4, color: '#00d492', style: 'solid' } },
            geometry: { keyframes: [{ at: 1280, x: 88, y: 0, width: 896, height: 120 }] },
          },
          // A card carrying both: the explicit left rule takes that edge.
          {
            kind: 'box',
            axes: {
              border: { widthPx: 1, color: '#e5e7eb', style: 'solid' },
              borderLeft: { widthPx: 4, color: '#ff8800', style: 'solid' },
            },
            geometry: { keyframes: [{ at: 1280, x: 88, y: 160, width: 896, height: 120 }] },
          },
        ],
      },
    }
    expect(validateL1(doc).ok, 'in-bounds accent rules are accepted').toBe(true)

    const { css } = renderL1Document(doc)

    // (a) Accent only: a left-edge rule of the declared width/style/colour, and
    // no uniform border framing the other three sides.
    const accentOnly = declsFor(css, 'l1-1')
    expect(accentOnly).toContain('border-left: 4px solid #00d492')
    expect(accentOnly).not.toMatch(/(^|[;|] )border: /)

    // (b) Both: each appears, with the left rule emitted after the uniform
    // border so it takes effect on that edge.
    const both = declsFor(css, 'l1-2')
    expect(both).toContain('border: 1px solid #e5e7eb')
    expect(both).toContain('border-left: 4px solid #ff8800')
    expect(both.indexOf('border-left:')).toBeGreaterThan(both.indexOf('border: '))

    // Re-derived from its typed fields, and bounded exactly as the uniform
    // border is: hex-only colour, bounded width, a closed set of line styles,
    // and no unknown keys.
    //
    // NOTE — `widthOutOfRange` currently FAILS. The envelope bounds
    // `axes.border.widthPx` against `effectPx` (±10000) but never visits
    // `axes.borderLeft`, so a 50000px accent rule is accepted while the very
    // same width on the uniform border is rejected. AC-762 states the accent
    // rule "takes the same envelope bounds … a bounded width", so the
    // assertion below is what the criterion specifies; the gap is in
    // `checkEffects` (packages/site-schema/src/l1/validate.ts), not here.
    const accentDoc = (borderLeft: unknown): unknown => ({
      widths: [320, 1280],
      root: { kind: 'box', axes: { borderLeft } },
    })
    const rejected: Record<string, unknown> = {
      widthOutOfRange: accentDoc({ widthPx: 50_000, color: '#00d492' }),
      nonHexColour: accentDoc({ widthPx: 4, color: 'emerald' }),
      styleNotInEnum: accentDoc({ widthPx: 4, color: '#00d492', style: 'groove' }),
      freeformKey: accentDoc({ widthPx: 4, color: '#00d492', css: 'border-left:4px' }),
    }
    for (const [name, bad] of Object.entries(rejected)) {
      expect(validateL1(bad).ok, `${name} must be rejected`).toBe(false)
    }
  })
})

// ── AC-763: a run declares the width from which it is unbreakable ─────────────

/** A run pinned at the width its glyphs measure in Chromium, to a whole pixel. */
function tightDoc(nowrapFromPx?: number): L1Document {
  return {
    widths: [1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'text',
          text: 'Designed for developers building AI-enhanced workflows',
          axes: {
            color: '#111111',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSizePx: 16,
            fontWeight: 400,
            lineHeightPx: 24,
            ...(nowrapFromPx !== undefined ? { nowrapFromPx } : {}),
          },
          geometry: { keyframes: [{ at: 1280, x: 24, y: 40, width: 414 }] },
        },
      ],
    },
  } as L1Document
}

/** Each available engine's rendered line count for the run in `doc`. */
async function lineCountsPerEngine(doc: L1Document, needle: string): Promise<Record<string, number>> {
  const probe = `(() => {
    var els = Array.prototype.slice.call(document.querySelectorAll('*')).filter(function (n) {
      return !n.children.length && (n.textContent || '').indexOf(${JSON.stringify(needle)}) === 0;
    });
    var r = document.createRange();
    r.selectNodeContents(els[0]);
    return { lines: r.getClientRects().length };
  })()`
  const served = await serveL1(doc)
  const out: Record<string, number> = {}
  try {
    for (const engine of availableEngines) {
      const driver = await createEngineDriver(engine)()
      try {
        await driver.navigate(served.url, { width: 1280, height: 900 })
        out[engine] = (await driver.query<{ lines: number }>(probe)).lines
      } finally {
        await driver.close()
      }
    }
  } finally {
    await served.close()
  }
  return out
}

describe('AC-763 a run declares the width from which it is unbreakable', () => {
  it('test_UAT_AC763_unbreakable_from_width_pins_above_it_and_holds_in_every_engine', async () => {
    // A width ABOVE the ladder floor: the pin takes effect from that width up,
    // and the run is left free to wrap below it (the checklist item that is one
    // line on desktop and three at 320).
    const gated = renderL1Document({
      widths: LADDER,
      root: {
        kind: 'text',
        text: 'Designed for developers',
        axes: { fontSizePx: 16, nowrapFromPx: 768 },
      },
    } as L1Document).css
    expect(gated).toMatch(/@media \(min-width: 768px\)[\s\S]*white-space: nowrap/)
    expect(headCss(gated)).not.toContain('white-space: nowrap')

    // At (or below) the ladder floor the pin is unconditional.
    for (const at of [320, 0]) {
      const floored = renderL1Document({
        widths: LADDER,
        root: { kind: 'text', text: 'Never wraps', axes: { fontSizePx: 16, nowrapFromPx: at } },
      } as L1Document).css
      expect(headCss(floored), `nowrapFromPx=${at} pins unconditionally`).toContain(
        'white-space: nowrap',
      )
    }

    // A run declaring no such width is left breakable everywhere.
    const unpinned = renderL1Document({
      widths: LADDER,
      root: { kind: 'text', text: 'Flows freely', axes: { fontSizePx: 16 } },
    } as L1Document).css
    expect(unpinned).not.toContain('white-space: nowrap')

    // The cross-engine obligation: a shrink-to-fit box clears its own glyphs by a
    // fraction of a pixel, and engines measure glyphs differently. With the
    // declaration every available engine keeps the run on one line…
    if (availableEngines.length >= 2) {
      const pinned = await lineCountsPerEngine(tightDoc(1280), 'Designed for developers')
      expect(Object.keys(pinned).length).toBeGreaterThanOrEqual(2)
      for (const [engine, n] of Object.entries(pinned)) {
        expect(n, `${engine} broke a run the reference set on one line`).toBe(1)
      }

      // …and without it, at least one engine disagrees — so the check above
      // cannot silently stop discriminating.
      const loose = await lineCountsPerEngine(tightDoc(), 'Designed for developers')
      const distinct = new Set(Object.values(loose))
      expect(
        distinct.size > 1 || [...distinct][0] > 1,
        `every engine agreed (${JSON.stringify(loose)}) — the fixture is no longer tight enough ` +
          'to discriminate; re-tighten the pinned width against current Chromium metrics',
      ).toBe(true)
    }
  }, 300000)
})

// ── AC-764: viewport-height response is a typed derivative ────────────────────

/** A `min-h-screen` hero, the content it pushes down, and a node that ignores it. */
function heightResponseDoc(withResponse: boolean): L1Document {
  return {
    widths: [320, 1280],
    root: {
      kind: 'box',
      children: [
        {
          kind: 'box',
          axes: { surfaceFill: '#030717' },
          geometry: {
            keyframes: [
              { at: 320, x: 0, y: 0, width: 320, height: 600, atHeight: 800 },
              { at: 1280, x: 0, y: 0, width: 1200, height: 600, atHeight: 800 },
            ],
            segments: ['interpolate'],
            ...(withResponse ? { viewportResponse: { heightFactor: 1 } } : {}),
          },
        },
        {
          kind: 'box',
          axes: { surfaceFill: '#e8dfd3' },
          geometry: {
            keyframes: [
              { at: 320, x: 0, y: 620, width: 320, height: 40, atHeight: 800 },
              { at: 1280, x: 0, y: 620, width: 1200, height: 40, atHeight: 800 },
            ],
            segments: ['interpolate'],
            ...(withResponse ? { viewportResponse: { yFactor: 1 } } : {}),
          },
        },
        {
          // Above the fold: declares no response, so it is positioned purely
          // from its keyframes.
          kind: 'box',
          axes: { surfaceFill: '#ffffff' },
          geometry: {
            keyframes: [
              { at: 320, x: 0, y: 100, width: 200, height: 40, atHeight: 800 },
              { at: 1280, x: 0, y: 100, width: 200, height: 40, atHeight: 800 },
            ],
            segments: ['interpolate'],
          },
        },
      ],
    },
  } as L1Document
}

describe('AC-764 viewport-height response is a derivative resolved against each capture height', () => {
  it('test_UAT_AC764_height_factor_grows_from_its_own_capture_height_and_pushes_content_down', async () => {
    const doc = heightResponseDoc(true)
    expect(validateL1(doc).ok, 'a response with captured heights is accepted').toBe(true)

    const { css } = renderL1Document(doc)
    // Each factor is resolved against THAT keyframe's own captured viewport
    // height, so the keyframe still evaluates to its captured pixels there.
    expect(css).toContain('height: calc(600px + (100vh - 800px))')
    expect(css).toContain('top: calc(620px + (100vh - 800px))')
    // A node with no declared response is positioned purely from its keyframes.
    expect(declsFor(css, 'l1-3')).toContain('top: 100px')
    expect(declsFor(css, 'l1-3')).not.toContain('100vh')

    // The same document with no response is purely keyframed geometry.
    const plain = renderL1Document(heightResponseDoc(false)).css
    expect(plain).not.toContain('100vh')
    expect(plain).toContain('height: 600px')
    expect(plain).toContain('top: 620px')

    // The envelope refuses a response whose keyframes carry no captured height:
    // applying it with no origin would silently treat the origin as zero and
    // turn a full-viewport height into height-plus-a-viewport.
    const noOrigin = {
      widths: [320, 1280],
      root: {
        kind: 'box',
        geometry: {
          keyframes: [{ at: 1280, x: 0, y: 0, width: 1200, height: 600 }],
          viewportResponse: { heightFactor: 1 },
        },
      },
    }
    const result = validateL1(noOrigin)
    expect(result.ok, 'a response with no origin is rejected').toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path.endsWith('/atHeight'))).toBe(true)
      expect(result.errors.some((e) => /atHeight/.test(e.message))).toBe(true)
    }

    // Real engine: at the capture height the hero is exactly its captured
    // height; 200px taller, it grows by exactly the difference and the section
    // below moves down by the same amount, while the fixed node does not move.
    if (chromiumReady) {
      const probes = await probeViewports(doc, [
        { width: 1280, height: 800 },
        { width: 1280, height: 1000 },
      ])
      const at800 = probes['1280x800'].rects
      const at1000 = probes['1280x1000'].rects

      expect(at800['l1-1'].height).toBeCloseTo(600, 0)
      expect(at1000['l1-1'].height).toBeCloseTo(800, 0)
      expect(at1000['l1-1'].height - at800['l1-1'].height).toBeCloseTo(200, 0)

      expect(at800['l1-2'].top).toBeCloseTo(620, 0)
      expect(at1000['l1-2'].top).toBeCloseTo(820, 0)

      expect(at800['l1-3'].top).toBeCloseTo(100, 0)
      expect(at1000['l1-3'].top).toBeCloseTo(100, 0)
    }
  }, 180000)
})

// ── AC-765 / AC-766: the document column and per-node anchor ──────────────────

const COLUMN = { containerPx: 1152, insetPx: 24, maxWidthPx: 896 }

/** The column's closed-form origin: flat, then rising at half the viewport's growth. */
function columnOrigin(vw: number): number {
  return Math.max(0, (vw - COLUMN.containerPx) / 2) + COLUMN.insetPx
}
/** The column's closed-form content extent. */
function columnExtent(vw: number): number {
  return Math.min(COLUMN.maxWidthPx, Math.min(COLUMN.containerPx, vw) - 2 * COLUMN.insetPx)
}

/**
 * Four anchored shapes plus a full-viewport band: a constant offset, a
 * fractional share of the column, a capped width, and a tracked in-column
 * offset. Deliberately short so no scrollbar exists to perturb `100vw`.
 */
function anchoredDoc(): L1Document {
  const at = [320, 768, 1280]
  const kf = (y: number, width: (w: number) => number) =>
    at.map((w) => ({ at: w, x: columnOrigin(w), y, width: width(w) }))
  return {
    widths: at,
    column: COLUMN,
    root: {
      kind: 'box',
      children: [
        {
          kind: 'text',
          text: 'anchor-const',
          axes: { color: '#111111', fontSizePx: 16, lineHeightPx: 20 },
          geometry: { keyframes: kf(0, () => 200), anchor: { x: { px: 0, fraction: 0 } } },
        },
        {
          kind: 'text',
          text: 'anchor-share',
          axes: { color: '#111111', fontSizePx: 16, lineHeightPx: 20 },
          geometry: { keyframes: kf(40, () => 150), anchor: { x: { px: 0, fraction: 0.5 } } },
        },
        {
          kind: 'text',
          text: 'anchor-capped',
          axes: { color: '#111111', fontSizePx: 16, lineHeightPx: 20 },
          geometry: {
            keyframes: kf(80, (w) => Math.min(600, columnExtent(w))),
            anchor: { x: { px: 0, fraction: 0 }, width: { px: 0, fraction: 1, maxPx: 600 } },
          },
        },
        {
          kind: 'text',
          text: 'anchor-tracked',
          axes: { color: '#111111', fontSizePx: 16, lineHeightPx: 20 },
          geometry: {
            keyframes: kf(120, () => 200),
            anchor: {
              x: {
                pxTrack: {
                  keyframes: [
                    { at: 320, value: 16 },
                    { at: 768, value: 0 },
                    { at: 1280, value: 0 },
                  ],
                  segments: ['snap', 'snap'],
                },
              },
            },
          },
        },
        {
          // A full-viewport band is never anchored: its left edge is zero
          // absolutely, and expressing that as origin-plus-its-negation walks it
          // off-screen between the samples.
          kind: 'box',
          axes: { surfaceFill: '#f3f4f6' },
          geometry: { keyframes: at.map((w) => ({ at: w, x: 0, y: 160, width: w, height: 8 })) },
        },
      ],
    },
  } as L1Document
}

/** The tracked in-column offset, evaluated at a viewport width (snap segments). */
function trackedOffset(vw: number): number {
  if (vw < 768) return 16
  return 0
}

describe('AC-765 a document column plus a per-node anchor place x and width independently', () => {
  it('test_UAT_AC765_each_horizontal_axis_anchors_or_keyframes_on_its_own', async () => {
    const doc = anchoredDoc()
    expect(validateL1(doc).ok, 'a well-formed column + anchors is accepted').toBe(true)

    const { css } = renderL1Document(doc)

    // The column is a closed-form rule, so an anchored axis needs no media
    // queries and no extrapolation — one static declaration covers every width.
    const constNode = declsFor(css, 'l1-1')
    expect(constNode).toContain('left: calc(max(0px, (100vw - 1152px) / 2) + 24px')
    // An anchored axis is placed ONLY by the column: its keyframes remain in the
    // document as the record of what the rule evaluates to, and are not also
    // emitted, so the two models can never fight.
    expect(constNode).not.toMatch(/left: \d+px/)
    // …while the *other* axis is untouched: width still comes from keyframes.
    expect(constNode).toMatch(/width: \d+px/)
    expect(doc.widths.length).toBe(3)

    // The reverse pairing: a capped width anchored to the column, and the cap
    // taking over where the column extent exceeds it.
    const capped = declsFor(css, 'l1-3')
    expect(capped).toContain('width: min(600px, min(896px, (min(1152px, 100vw) - 48px)))')
    expect(capped).not.toMatch(/width: \d+px/)

    // An in-column offset track keeps the closed-form origin and keyframes only
    // the small offset inside it.
    const tracked = declsFor(css, 'l1-4')
    expect(tracked).toContain('16px')
    expect(mediaBlock(css, 768)).toMatch(/\.l1-4 \{ left: calc\(max\(0px, \(100vw - 1152px\) \/ 2\) \+ 24px \+ 0px\) \}/)

    // The full-viewport band is not anchored: plain keyframed zero.
    const band = declsFor(css, 'l1-5')
    expect(band).toContain('left: 0px')
    expect(band).not.toContain('100vw - 1152px')

    // A document that declares no column keeps its nodes' keyframes untouched.
    const noColumn = renderL1Document({
      widths: [320, 1280],
      root: {
        kind: 'text',
        text: 'Flush left',
        geometry: {
          keyframes: [
            { at: 320, x: 40, y: 0, width: 240 },
            { at: 1280, x: 40, y: 0, width: 1200 },
          ],
          segments: ['interpolate'],
        },
      },
    } as L1Document).css
    expect(noColumn).toContain('left: 40px')
    expect(noColumn).not.toContain('max(0px')

    // A dangling anchor fails loudly rather than falling back to geometry that
    // merely looks plausible; so does an anchor governing neither axis, and one
    // whose term leaves the envelope.
    const anchorDoc = (anchor: unknown, withColumn = true): unknown => ({
      widths: [320, 1280],
      ...(withColumn ? { column: COLUMN } : {}),
      root: {
        kind: 'text',
        text: 'x',
        geometry: { keyframes: [{ at: 320, x: 24, y: 0, width: 100 }], anchor },
      },
    })
    const noColumnResult = validateL1(anchorDoc({ width: { fraction: 1 } }, false))
    expect(noColumnResult.ok, 'an anchor with no column is rejected').toBe(false)
    if (!noColumnResult.ok) {
      expect(
        noColumnResult.errors.some((e) => /requires the document to declare a `column`/.test(e.message)),
      ).toBe(true)
    }
    const rejected: Record<string, unknown> = {
      governsNeitherAxis: anchorDoc({}),
      fractionOutOfRange: anchorDoc({ x: { fraction: 50 } }),
      constantOutOfRange: anchorDoc({ x: { px: 200_000 } }),
      capOutOfRange: anchorDoc({ width: { fraction: 1, maxPx: 200_000 } }),
      freeformKey: anchorDoc({ x: { px: 0, css: 'left:0' } }),
    }
    for (const [name, bad] of Object.entries(rejected)) {
      expect(validateL1(bad).ok, `${name} must be rejected`).toBe(false)
    }

    // Real engine: the independence claim, measured. The x-anchored node follows
    // the column while its keyframed width does its own thing, at a width
    // BETWEEN the samples where a keyframe lerp would have drifted.
    if (chromiumReady) {
      const probes = await probeViewports(doc, [{ width: 1000 }, { width: 1280 }])
      for (const vw of [1000, 1280]) {
        const rects = probes[`${vw}x900`].rects
        expect(rects['l1-1'].left, `const left @${vw}`).toBeCloseTo(columnOrigin(vw), 0)
        expect(rects['l1-1'].width, `const width stays keyframed @${vw}`).toBeCloseTo(200, 0)
        expect(rects['l1-3'].width, `capped width @${vw}`).toBeCloseTo(
          Math.min(600, columnExtent(vw)),
          0,
        )
      }
    }
  }, 180000)
})

describe('AC-766 anchored placement is emitted as a valid expression', () => {
  it('test_UAT_AC766_every_anchored_node_lands_at_its_column_rule_position', async () => {
    const doc = anchoredDoc()
    const { css } = renderL1Document(doc)

    // A column origin is itself a compound expression, so any sum containing it
    // must be wrapped as ONE calculation. Emitted bare it is not a legal value,
    // the declaration is dropped, and the node slams to the page edge.
    expect(css).toContain('left: calc(max(0px, (100vw - 1152px) / 2) + 24px')
    expect(css).not.toMatch(/left: max\(/)
    expect(css).not.toMatch(/width: max\(/)

    if (!chromiumReady) return

    // The obligation is stated over the RENDERED position: a real browser places
    // every anchored node at the value the column rule predicts — at the sampled
    // widths, between them, and above the widest.
    const widths = [320, 500, 768, 1000, 1280, 1600]
    const probes = await probeViewports(
      doc,
      widths.map((width) => ({ width })),
    )

    for (const vw of widths) {
      const probe = probes[`${vw}x900`]
      const rects = probe.rects
      const origin = columnOrigin(vw)
      const extent = columnExtent(vw)

      const expected: Record<string, { left: number; width?: number }> = {
        // a constant offset
        'l1-1': { left: origin, width: 200 },
        // a fractional share of the column
        'l1-2': { left: origin + 0.5 * extent, width: 150 },
        // a cap
        'l1-3': { left: origin, width: Math.min(600, extent) },
        // a tracked in-column offset
        'l1-4': { left: origin + trackedOffset(vw), width: 200 },
      }

      for (const [cls, want] of Object.entries(expected)) {
        const got = rects[cls]
        expect(got, `${cls} rendered @${vw}`).toBeDefined()
        expect(got.left, `${cls} left @${vw} (rule says ${want.left})`).toBeCloseTo(want.left, 0)
        // No anchored node lands at zero where the rule predicts otherwise.
        expect(got.left, `${cls} did not slam to the page edge @${vw}`).toBeGreaterThan(0)
        if (want.width !== undefined) {
          expect(got.width, `${cls} width @${vw}`).toBeCloseTo(want.width, 0)
        }
        // No anchored node is forced outside the viewport.
        expect(got.left + got.width, `${cls} right edge within viewport @${vw}`).toBeLessThanOrEqual(
          vw + 1,
        )
      }

      // …and the page as a whole does not overflow horizontally.
      expect(probe.scrollWidth, `no horizontal overflow @${vw}`).toBeLessThanOrEqual(vw + 1)
    }
  }, 300000)
})
