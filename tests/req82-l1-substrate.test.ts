/**
 * REQ-82 — L1 layout substrate + safety envelope UATs.
 *
 * The four acceptance probes from the ticket, proven on a hand-authored
 * one-section hero spike:
 *   - roundtrip          capture(render(L1)) reproduces every authored axis at
 *                        all captured widths (real Chromium).
 *   - envelope_security  injection payloads in text/url/colour fields are inert.
 *   - envelope_robustness out-of-range / oversize / freeform inputs are rejected.
 *   - cross_browser      the spike renders equivalently across the 3 engines.
 *
 * Deterministic probes (validator + emitter) run everywhere; the browser probes
 * skip cleanly on a runner without the engines installed.
 */
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Page } from '../packages/framework/src/index'
import {
  captureL1,
  chromiumAvailable,
  engineAvailable,
  expectedTextManifest,
  roundTripReport,
  X_BROWSER_TOLERANCE,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src'

const WIDTHS = [320, 375, 768, 1024, 1280, 1440]

/**
 * The hand-authored hero spike (grounded on the faelan capture: black band, a
 * white wordmark, a muted subhead). Geometry interpolates position + width
 * across the ladder; the authored axes are fixed literals.
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

// ── Deterministic: validator accepts a well-formed document ───────────────────

describe('REQ-82 L1 envelope validator', () => {
  it('test_UAT_FC_REQ-82_validator_accepts_valid_hero', () => {
    const result = validateL1(heroDoc())
    expect(result.ok).toBe(true)
  })

  // ── envelope_robustness: out-of-range / oversize / freeform rejected ────────
  it('test_UAT_FC_REQ-82_envelope_robustness_out_of_range_rejected', () => {
    const bad = (mutate: (d: L1Document) => unknown): boolean => {
      const doc = heroDoc()
      const target = mutate(doc)
      return validateL1(target).ok
    }

    // Oversize font-size (> 400px).
    expect(
      bad((d) => {
        ;(d.root as { children: L1Node[] }).children[0] = {
          kind: 'text',
          text: 'x',
          axes: { fontSizePx: 5000 },
        }
        return d
      }),
    ).toBe(false)

    // Non-finite geometry coordinate.
    expect(
      bad((d) => {
        ;(d.root as { children: L1Node[] }).children[0] = {
          kind: 'text',
          text: 'x',
          geometry: { keyframes: [{ at: 320, x: Number.NaN, y: 0, width: 100 }] },
        }
        return d
      }),
    ).toBe(false)

    // Keyframe width not one of the document widths.
    expect(
      bad((d) => {
        ;(d.root as { children: L1Node[] }).children[0] = {
          kind: 'text',
          text: 'x',
          geometry: { keyframes: [{ at: 999, x: 0, y: 0, width: 100 }] },
        }
        return d
      }),
    ).toBe(false)

    // A freeform CSS/HTML escape hatch (unknown key) — rejected by `.strict()`.
    expect(
      bad((d) => {
        ;(d.root as { children: L1Node[] }).children[0] = {
          kind: 'text',
          text: 'x',
          style: 'color:red;position:fixed',
        } as unknown as L1Node
        return d
      }),
    ).toBe(false)

    // Depth cap — a chain of 40 nested boxes exceeds the 32 cap.
    expect(
      bad(() => {
        let node: L1Node = { kind: 'text', text: 'deep' }
        for (let i = 0; i < 40; i++) node = { kind: 'box', children: [node] }
        return { widths: WIDTHS, root: node }
      }),
    ).toBe(false)

    // Node-count cap — > 2000 sibling leaves.
    expect(
      bad(() => {
        const children: L1Node[] = Array.from({ length: 2100 }, (_, i) => ({
          kind: 'text',
          text: `n${i}`,
        }))
        return { widths: WIDTHS, root: { kind: 'container', layout: 'stack', children } }
      }),
    ).toBe(false)
  })

  // ── envelope_security: injection payloads are inert ─────────────────────────
  it('test_UAT_FC_REQ-82_envelope_security_validator_rejects_unsafe', () => {
    // A `javascript:` image src is rejected by the URL-scheme allowlist.
    const jsUrl = validateL1({
      widths: WIDTHS,
      root: { kind: 'image', src: 'javascript:alert(1)', alt: 'x' },
    })
    expect(jsUrl.ok).toBe(false)

    // A non-hex colour (a `url()` payload) is rejected by the colour type.
    const badColor = validateL1({
      widths: WIDTHS,
      root: { kind: 'text', text: 'x', axes: { color: 'url(javascript:alert(1))' } },
    })
    expect(badColor.ok).toBe(false)
  })

  it('test_UAT_FC_REQ-82_envelope_security_renderer_escapes_and_sanitises', () => {
    // Even if an unsafe value slipped past validation, the emitter neutralises it:
    // text is HTML-escaped, font-family is sanitised (no `;{}<>()`), and an unsafe
    // image src is dropped to empty.
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

    // No executable script survived into the markup.
    expect(page).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    // No attribute-breakout from the alt payload: the `">` is escaped, so it
    // cannot close the attribute and inject a live `<img onerror>` tag.
    expect(html).not.toContain('"><img onerror')
    expect(html).toContain('&quot;&gt;')
    // The unsafe src was dropped, not emitted.
    expect(html).not.toContain('javascript:')
    // The font-family injection cannot break out of the declaration.
    expect(css).not.toContain('body{display:none}')
    expect(css).not.toContain('@import')
  })
})

// ── Deterministic: geometry keyframes compile to media-queried CSS ────────────

describe('REQ-82 L1 renderer geometry compilation', () => {
  it('test_UAT_FC_REQ-82_geometry_keyframes_compile_to_media_queries', () => {
    const { css } = renderL1Document(heroDoc())

    // Base rule pins the smallest-width keyframe absolutely.
    expect(css).toMatch(/position: absolute/)
    expect(css).toContain('left: 20px')

    // The interpolate segment emits a fluid calc() gated at the lower breakpoint.
    expect(css).toMatch(/@media \(min-width: 320px\)/)
    expect(css).toMatch(/left: calc\(20px \+ \(320 \* \(100vw - 320px\) \/ 960\)\)/)

    // The final keyframe is held statically above the top breakpoint.
    expect(css).toMatch(/@media \(min-width: 1280px\)/)
    expect(css).toContain('left: 340px')

    // The snap segment (subhead) holds the lower keyframe — a static value, no calc.
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
    // Under snap, min-width:320 holds x=10 (no interpolation calc for left).
    const at320 = snapCss.split('@media (min-width: 320px)')[1] ?? ''
    expect(at320).toContain('left: 10px')
    expect(at320).not.toContain('calc(')
  })
})

// ── Real browser: round-trip identity + cross-browser equivalence ─────────────

const chromiumReady = await chromiumAvailable()
const itChromium = it.runIf(chromiumReady)

const allEnginesReady =
  (await engineAvailable('chromium')) &&
  (await engineAvailable('webkit')) &&
  (await engineAvailable('firefox'))
const itAllEngines = it.runIf(allEnginesReady)

function byText(m: ValueManifest, text: string): ValueElement | undefined {
  return m.elements.find((e) => e.text.trim() === text)
}

describe('REQ-82 L1 round-trip identity (real Chromium)', () => {
  itChromium(
    'test_UAT_FC_REQ-82_roundtrip_authored_axes_reproduced_at_all_widths',
    async () => {
      const doc = heroDoc()
      const projections = await captureL1(doc, { engines: ['chromium'], widths: WIDTHS })
      expect(projections.length).toBe(WIDTHS.length)

      for (const proj of projections) {
        const width = proj.viewport.width
        // The wordmark and subhead both reproduced.
        expect(byText(proj.manifest, 'FAELAN'), `heading @${width}`).toBeDefined()
        expect(byText(proj.manifest, 'A considered practice'), `subhead @${width}`).toBeDefined()

        // capture(render(L1)) reproduces every authored (Type-A) axis exactly.
        const report = roundTripReport(doc, proj.manifest)
        const typeA = report.deltas.filter((d) => d.valueType === 'A')
        expect(typeA, `Type-A deltas @${width}: ${JSON.stringify(typeA)}`).toEqual([])
      }
    },
    180000,
  )

  itChromium(
    'test_UAT_FC_REQ-82_roundtrip_geometry_grows_across_widths',
    async () => {
      const doc = heroDoc()
      const projections = await captureL1(doc, { engines: ['chromium'], widths: [320, 1280] })
      const at320 = projections.find((p) => p.viewport.width === 320)!
      const at1280 = projections.find((p) => p.viewport.width === 1280)!

      const h320 = byText(at320.manifest, 'FAELAN')!
      const h1280 = byText(at1280.manifest, 'FAELAN')!
      expect(h320.box, 'heading box @320').toBeDefined()
      expect(h1280.box, 'heading box @1280').toBeDefined()

      // The interpolate track moves the wordmark right and widens it across the
      // ladder, and pins the endpoints to the authored keyframes (±2px).
      expect(h320!.box!.x).toBeGreaterThanOrEqual(18)
      expect(h320!.box!.x).toBeLessThanOrEqual(22)
      expect(h320!.box!.width).toBeGreaterThanOrEqual(278)
      expect(h1280!.box!.x).toBeGreaterThan(h320!.box!.x + 100)
      expect(Math.abs(h1280!.box!.x - 340)).toBeLessThanOrEqual(2)
      expect(Math.abs(h1280!.box!.width - 600)).toBeLessThanOrEqual(2)
    },
    120000,
  )
})

describe('REQ-82 L1 cross-browser equivalence (3 engines)', () => {
  itAllEngines(
    'test_UAT_FC_REQ-82_cross_browser_no_divergence_3_engines',
    async () => {
      const doc = heroDoc()
      const projections = await captureL1(doc, {
        engines: ['chromium', 'webkit', 'firefox'],
        widths: [375, 1280],
      })

      for (const width of [375, 1280]) {
        const perEngine = projections.filter((p) => p.viewport.width === width)
        // Every engine produced a projection (none hung / crashed).
        expect(perEngine.map((p) => p.engine).sort()).toEqual(['chromium', 'firefox', 'webkit'])

        const headings = perEngine.map((p) => byText(p.manifest, 'FAELAN'))
        expect(headings.every(Boolean), `heading present on all engines @${width}`).toBe(true)

        // Position + width agree across engines within the calibrated tolerance
        // (font metrics move height, not the CSS-pinned left/top/width).
        const xs = headings.map((h) => h!.box!.x)
        const ws = headings.map((h) => h!.box!.width)
        expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(X_BROWSER_TOLERANCE.posPx)
        expect(Math.max(...ws) - Math.min(...ws)).toBeLessThanOrEqual(X_BROWSER_TOLERANCE.sizePx)

        // Authored axes are engine-invariant.
        const sizes = new Set(headings.map((h) => Math.round(h!.fontSizePx)))
        expect(sizes.size, 'font-size identical across engines').toBe(1)
      }
    },
    240000,
  )
})
