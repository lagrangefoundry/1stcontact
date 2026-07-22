/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction" (REQ-82).
 *
 * One UAT per acceptance criterion, proven on a hand-authored one-section hero
 * spike (a fluid black band carrying a white wordmark and a muted subhead):
 *
 *   AC-682  a well-formed document is accepted as a typed layout tree
 *   AC-683  authored (Type-A) axes round-trip: capture(render(L1)) at all widths
 *   AC-684  geometry keyframes — interpolate varies continuously, snap holds
 *   AC-685  injection payloads in content values are inert in the rendered output
 *   AC-686  out-of-range / oversize / freeform documents are rejected
 *   AC-687  a rejected document returns the full list of per-field errors
 *   AC-688  the spike renders equivalently across chromium, webkit, firefox
 *
 * The validator + emitter probes (AC-682/684/685/686/687) are engine-free and
 * run everywhere; the real-browser probes (AC-683/688) skip cleanly on a runner
 * without the engines installed.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Page } from '../packages/framework/src/index'
import {
  captureL1,
  engineAvailable,
  roundTripReport,
  X_BROWSER_TOLERANCE,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src'

const WIDTHS = [320, 375, 768, 1024, 1280, 1440]

/**
 * The hand-authored hero spike: a fluid black box containing a white wordmark
 * (interpolate geometry track) and a muted subhead (snap geometry track), across
 * the 6-width ladder. Authored axes are fixed literals.
 */
function heroDoc(): L1Document {
  return {
    widths: WIDTHS,
    background: '#000000',
    root: {
      kind: 'box',
      axes: { surfaceFill: '#000000' },
      sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 600 } },
      children: [
        {
          kind: 'text',
          text: 'FAELAN',
          axes: {
            color: '#ffffff',
            fontFamily: 'Georgia',
            fontSizePx: 48,
            fontWeight: 700,
            textAlign: 'center',
            letterSpacingPx: 2,
          },
          geometry: {
            keyframes: [
              { at: 320, x: 20, y: 200, width: 280 },
              { at: 1280, x: 340, y: 260, width: 600 },
            ],
            segments: ['interpolate'],
          },
        },
        {
          kind: 'text',
          text: 'A considered practice',
          axes: {
            color: '#94a3b8',
            fontFamily: 'Arial',
            fontSizePx: 18,
            fontWeight: 400,
            textAlign: 'center',
          },
          geometry: {
            keyframes: [
              { at: 320, x: 20, y: 320, width: 280 },
              { at: 1280, x: 340, y: 360, width: 600 },
            ],
            segments: ['snap'],
          },
        },
      ],
    },
  }
}

function byText(m: ValueManifest, text: string): ValueElement | undefined {
  return m.elements.find((e) => e.text.trim() === text)
}

// ── AC-682: a well-formed document is accepted as a typed layout tree ──────────

describe('AC-682 well-formed L1 document accepted as a typed layout tree', () => {
  it('test_UAT_AC682_valid_document_and_optional_primitives_accepted', () => {
    // The canonical hero validates and the typed document is returned.
    const result = validateL1(heroDoc())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.root.kind).toBe('box')
      expect(result.value.widths).toEqual(WIDTHS)
    }

    // Each optional structure primitive, varied independently, is still accepted:
    // per-axis sizing modes, distribution/alignment, viewport visibility, a slot,
    // an image with an allowed relative src, and both segment kinds.
    const variants: L1Document[] = [
      {
        widths: WIDTHS,
        root: {
          kind: 'container',
          layout: 'row',
          gapPx: 16,
          distribution: 'between',
          align: 'stretch',
          sizing: { width: { mode: 'hug' } },
          children: [{ kind: 'text', text: 'hug me' }],
        },
      },
      {
        widths: WIDTHS,
        root: {
          kind: 'container',
          layout: 'grid',
          columns: 3,
          children: [
            { kind: 'slot', name: 'gallery', capability: 'carousel' },
            { kind: 'image', src: '/assets/photo.jpg', alt: 'a photo', axes: { objectFit: 'cover' } },
            { kind: 'text', text: 'caption', visibility: { fromPx: 768 } },
          ],
        },
      },
      {
        widths: WIDTHS,
        root: {
          kind: 'text',
          text: 'snap track',
          geometry: {
            keyframes: [
              { at: 320, x: 0, y: 0, width: 100 },
              { at: 1280, x: 40, y: 0, width: 200 },
            ],
            segments: ['snap'],
          },
        },
      },
    ]
    for (const doc of variants) {
      expect(validateL1(doc).ok, JSON.stringify(doc)).toBe(true)
    }
  })
})

// ── AC-683: authored axes round-trip at every width (real browser) ────────────

const chromiumReady = await engineAvailable('chromium')
const itChromium = it.runIf(chromiumReady)

describe('AC-683 authored axes round-trip: capture(render(L1)) reproduces every literal axis', () => {
  itChromium(
    'test_UAT_AC683_type_a_axes_reproduced_and_text_present_at_all_widths',
    async () => {
      const doc = heroDoc()
      const projections = await captureL1(doc, { engines: ['chromium'], widths: WIDTHS })
      expect(projections.length).toBe(WIDTHS.length)

      for (const proj of projections) {
        const width = proj.viewport.width
        // Each authored text run is present in the re-captured page.
        expect(byText(proj.manifest, 'FAELAN'), `wordmark @${width}`).toBeDefined()
        expect(byText(proj.manifest, 'A considered practice'), `subhead @${width}`).toBeDefined()

        // The set of Type-A (authored literal) deltas is empty at every width.
        const report = roundTripReport(doc, proj.manifest)
        const typeA = report.deltas.filter((d) => d.valueType === 'A')
        expect(typeA, `Type-A deltas @${width}: ${JSON.stringify(typeA)}`).toEqual([])
      }
    },
    180000,
  )
})

// ── AC-684: geometry keyframes — interpolate varies continuously, snap holds ───

describe('AC-684 geometry keyframes produce per-viewport layout (interpolate vs snap)', () => {
  it('test_UAT_AC684_interpolate_varies_continuously_and_snap_holds', () => {
    // The interpolate wordmark: base rule pins the smallest keyframe absolutely,
    // the segment emits a viewport-fluid calc() gated at the lower breakpoint that
    // equals the authored endpoints, and the top keyframe is held above the ceiling.
    const { css } = renderL1Document(heroDoc())
    expect(css).toMatch(/position: absolute/)
    expect(css).toContain('left: 20px') // endpoint @320
    expect(css).toMatch(/@media \(min-width: 320px\)/)
    // Continuous variation with viewport width across the [320,1280] span.
    expect(css).toMatch(/left: calc\(20px \+ \(320 \* \(100vw - 320px\) \/ 960\)\)/)
    expect(css).toMatch(/@media \(min-width: 1280px\)/)
    expect(css).toContain('left: 340px') // endpoint @1280 held above the ceiling

    // A snap track holds the lower keyframe's value unchanged (no interpolation
    // calc) until the next breakpoint.
    const snapDoc: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'text',
        text: 's',
        geometry: {
          keyframes: [
            { at: 320, x: 10, y: 0, width: 100 },
            { at: 1280, x: 500, y: 0, width: 100 },
          ],
          segments: ['snap'],
        },
      },
    }
    const snapCss = renderL1Document(snapDoc).css
    const at320 = snapCss.split('@media (min-width: 320px)')[1] ?? ''
    expect(at320).toContain('left: 10px')
    expect(at320).not.toContain('calc(')
  })
})

// ── AC-685: injection payloads in content values are inert in the output ───────

describe('AC-685 injection payloads in content values are inert in the rendered output', () => {
  it('test_UAT_AC685_text_url_alt_and_fontfamily_payloads_are_neutralised', () => {
    // Even a value that bypassed validation is neutralised by the emitter: text
    // and alt are HTML-escaped, an unsafe image src is dropped, and a font-family
    // carrying CSS syntax is reduced to inert font-name tokens.
    const doc: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          {
            kind: 'text',
            text: '<script>alert(1)</script>',
            axes: { fontFamily: 'Arial; } body{display:none} @import "x' },
          },
          { kind: 'image', src: 'javascript:alert(1)', alt: '"><img onerror=alert(1)>' },
        ],
      },
    }
    const { html, css } = renderL1Document(doc)
    const page = renderL1Page(doc)

    // Text markup appears only as escaped text — no live <script> element.
    expect(page).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    // The alt attribute-breakout payload cannot close its attribute.
    expect(html).not.toContain('"><img onerror')
    expect(html).toContain('&quot;&gt;')
    // The disallowed-scheme src renders as no source, not a live URL.
    expect(html).not.toContain('javascript:')
    // The font-family payload cannot break out of the CSS declaration.
    expect(css).not.toContain('body{display:none}')
    expect(css).not.toContain('@import')
  })
})

// ── AC-686: out-of-range / oversize / freeform documents are rejected ──────────

describe('AC-686 out-of-range, oversize, and freeform documents are rejected by the envelope', () => {
  it('test_UAT_AC686_envelope_boundary_is_the_range_not_the_property', () => {
    const accepts = (doc: unknown): boolean => validateL1(doc).ok

    // Positive control: the in-range equivalent is accepted — the boundary is the
    // range, not the property. font-size 48 and font-weight 400 are fine.
    const inRange: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        children: [{ kind: 'text', text: 'ok', axes: { fontSizePx: 48, fontWeight: 400 } }],
      },
    }
    expect(accepts(inRange)).toBe(true)

    // Each document below violates exactly one envelope rule and must be rejected.
    const rejected: Record<string, unknown> = {
      fontSizeTooBig: {
        widths: WIDTHS,
        root: { kind: 'box', children: [{ kind: 'text', text: 'x', axes: { fontSizePx: 5000 } }] },
      },
      fontWeightTooBig: {
        widths: WIDTHS,
        root: { kind: 'box', children: [{ kind: 'text', text: 'x', axes: { fontWeight: 5000 } }] },
      },
      geometryCoordOutOfRange: {
        widths: WIDTHS,
        root: {
          kind: 'text',
          text: 'x',
          geometry: { keyframes: [{ at: 320, x: 200000, y: 0, width: 100 }] },
        },
      },
      nonFiniteNumber: {
        widths: WIDTHS,
        root: {
          kind: 'text',
          text: 'x',
          geometry: { keyframes: [{ at: 320, x: Number.NaN, y: 0, width: 100 }] },
        },
      },
      nonHexColour: {
        widths: WIDTHS,
        root: { kind: 'text', text: 'x', axes: { color: 'url(javascript:alert(1))' } },
      },
      disallowedImageScheme: {
        widths: WIDTHS,
        root: { kind: 'image', src: 'javascript:alert(1)', alt: 'x' },
      },
      freeformUnknownKey: {
        widths: WIDTHS,
        root: { kind: 'text', text: 'x', style: 'color:red;position:fixed' },
      },
      keyframeWidthNotDeclared: {
        widths: WIDTHS,
        root: { kind: 'text', text: 'x', geometry: { keyframes: [{ at: 999, x: 0, y: 0, width: 100 }] } },
      },
      keyframesNotAscending: {
        widths: WIDTHS,
        root: {
          kind: 'text',
          text: 'x',
          geometry: {
            keyframes: [
              { at: 1280, x: 0, y: 0, width: 100 },
              { at: 320, x: 0, y: 0, width: 100 },
            ],
            segments: ['interpolate'],
          },
        },
      },
      viewportLadderNotAscending: {
        widths: [320, 320, 768],
        root: { kind: 'text', text: 'x' },
      },
      depthExceedsCap: (() => {
        let node: L1Node = { kind: 'text', text: 'deep' }
        for (let i = 0; i < 40; i++) node = { kind: 'box', children: [node] }
        return { widths: WIDTHS, root: node }
      })(),
      nodeCountExceedsCap: {
        widths: WIDTHS,
        root: {
          kind: 'container',
          layout: 'stack',
          children: Array.from({ length: 2100 }, (_, i) => ({ kind: 'text', text: `n${i}` })),
        },
      },
    }

    for (const [name, doc] of Object.entries(rejected)) {
      expect(accepts(doc), `${name} must be rejected`).toBe(false)
    }
  })
})

// ── AC-687: a rejected document returns the full list of per-field errors ──────

describe('AC-687 a rejected document returns the full list of per-field errors', () => {
  it('test_UAT_AC687_multiple_violations_all_reported_with_path_and_message', () => {
    // A document carrying three distinct, simultaneous envelope violations:
    //   1. a non-ascending viewport ladder          → /widths/1
    //   2. an out-of-range font-size on child 0      → /root/children/0/axes/fontSizePx
    //   3. a disallowed image scheme on child 1      → /root/children/1/src
    const doc = {
      widths: [320, 320, 768],
      root: {
        kind: 'box',
        children: [
          { kind: 'text', text: 'x', axes: { fontSizePx: 5000 } },
          { kind: 'image', src: 'javascript:alert(1)', alt: 'x' },
        ],
      },
    }

    const result = validateL1(doc)
    // Not an opaque single failure: a machine-readable list of violations.
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected rejection')

    expect(Array.isArray(result.errors)).toBe(true)
    // All three violations reported in one pass, not a single generic error.
    expect(result.errors.length).toBeGreaterThanOrEqual(3)

    // Each entry locates the offending field (a document path) and carries a
    // human-readable message.
    for (const err of result.errors) {
      expect(typeof err.path).toBe('string')
      expect(err.path.startsWith('/')).toBe(true)
      expect(typeof err.message).toBe('string')
      expect(err.message.length).toBeGreaterThan(0)
    }

    const paths = result.errors.map((e) => e.path)
    expect(paths).toContain('/widths/1')
    expect(paths).toContain('/root/children/0/axes/fontSizePx')
    expect(paths).toContain('/root/children/1/src')
  })
})

// ── AC-688: the spike renders equivalently across the three engines ────────────

const allEnginesReady =
  (await engineAvailable('chromium')) &&
  (await engineAvailable('webkit')) &&
  (await engineAvailable('firefox'))
const itAllEngines = it.runIf(allEnginesReady)

describe('AC-688 the spike renders equivalently across chromium, webkit, and firefox', () => {
  itAllEngines(
    'test_UAT_AC688_no_layout_divergence_across_three_engines',
    async () => {
      const doc = heroDoc()
      const projections = await captureL1(doc, {
        engines: ['chromium', 'webkit', 'firefox'],
        widths: [375, 1280],
      })

      for (const width of [375, 1280]) {
        const perEngine = projections.filter((p) => p.viewport.width === width)
        // Every engine produced a projection (none hung or crashed).
        expect(perEngine.map((p) => p.engine).sort()).toEqual(['chromium', 'firefox', 'webkit'])

        // The authored wordmark is present on all three engines.
        const headings = perEngine.map((p) => byText(p.manifest, 'FAELAN'))
        expect(headings.every(Boolean), `wordmark present on all engines @${width}`).toBe(true)

        // CSS-pinned position + width agree across engines within the calibrated
        // cross-browser tolerance.
        const xs = headings.map((h) => h!.box!.x)
        const ws = headings.map((h) => h!.box!.width)
        expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(X_BROWSER_TOLERANCE.posPx)
        expect(Math.max(...ws) - Math.min(...ws)).toBeLessThanOrEqual(X_BROWSER_TOLERANCE.sizePx)

        // Authored axes (font-size) are identical across engines.
        const sizes = new Set(headings.map((h) => Math.round(h!.fontSizePx)))
        expect(sizes.size, 'font-size identical across engines').toBe(1)
      }
    },
    240000,
  )
})
