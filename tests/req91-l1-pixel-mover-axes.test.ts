/**
 * REQ-91 — L1 pixel-mover axes UATs.
 *
 * Raises L1's language power to match the value-render's sufficient statistic
 * (DOC-27): every captured pixel-mover that L1 previously had no axis for is
 * added as a **typed** axis (numeric / enum / hex / structured) emitted through
 * the renderer's safe sink. This file proves, per family:
 *
 *   - the envelope validator ACCEPTS the axis (typed, in range) and REJECTS
 *     out-of-range / non-hex / unsafe-URL / freeform-key inputs (no raw-CSS hole),
 *   - the renderer EMITS the correct CSS re-derived from the typed fields,
 *   - real gigabytealchemy / joyful / faelan captured values fold + render
 *     (the design check — the folder-match step cannot surprise us).
 *
 * All probes here are deterministic (validator + emitter + fold); no browser is
 * required, so the whole file runs on any runner.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  validateL1,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1, type MultiStateCapture } from '../tools/generate/src'

const WIDTHS = [320, 1280]

/** Wrap a node under a minimal valid document so it can be validated + rendered. */
function docWith(node: L1Node): L1Document {
  return { widths: WIDTHS, root: { kind: 'box', children: [node] } }
}

function render(node: L1Node): string {
  const res = validateL1(docWith(node))
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(docWith(node)).css
}

// ── Real captured pixel-mover values (the design-check fixtures) ───────────────
// gigabytealchemy wordmark: a gold→orange horizontal text-fill gradient.
const WORDMARK_GRADIENT = {
  angleDeg: 90,
  stops: [
    { color: '#f5e6a3', position: 0 },
    { color: '#f5e6a3', position: 60 },
    { color: '#ff8c42', position: 90 },
    { color: '#ff6b35', position: 100 },
  ],
} as const
// gigabytealchemy panel surface gradient.
const PANEL_GRADIENT = {
  angleDeg: 135,
  stops: [
    { color: '#f1f5f9', position: 0 },
    { color: '#e2e8f0', position: 100 },
  ],
} as const
// gigabytealchemy accent bar; joyful drop shadow; faelan hero scrim.
const ACCENT_BORDER = { widthPx: 4, color: '#00d492' } as const
const CARD_SHADOW = { offsetXPx: 6, offsetYPx: 4, blurPx: 10, spreadPx: 0, color: '#00000080' } as const
const HERO_SCRIM = { color: '#000000', opacity: 0.3 } as const

describe('REQ-91 L1 pixel-mover axes — validator envelope', () => {
  it('test_UAT_FC_REQ-91_validator_accepts_all_families', () => {
    const doc: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        axes: {
          surfaceGradient: PANEL_GRADIENT,
          overlay: HERO_SCRIM,
          backgroundImageUrl: '/assets/hero.jpg',
          border: ACCENT_BORDER,
          boxShadow: CARD_SHADOW,
          backdropBlurPx: 12,
          blendMode: 'multiply',
        },
        transform: { rotateDeg: -3, scale: 1.05 },
        mask: { shape: 'featherBottom', featherPx: 48 },
        children: [
          {
            kind: 'text',
            text: 'Gigabyte Alchemy',
            axes: {
              gradientFill: WORDMARK_GRADIENT,
              textDecoration: 'underline',
              textShadow: CARD_SHADOW,
              fontVariantCaps: 'small-caps',
              listMarker: 'disc',
            },
          },
          {
            kind: 'image',
            src: '/assets/photo.jpg',
            alt: 'a dish',
            axes: { blendMode: 'screen', border: ACCENT_BORDER, boxShadow: CARD_SHADOW },
            mask: { shape: 'circle' },
          },
        ],
      },
    }
    const res = validateL1(doc)
    expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  })

  it('test_UAT_FC_REQ-91_security_rejects_non_hex_and_freeform', () => {
    // A gradient stop coloured with a raw CSS token — not hex — is rejected.
    const badStop = validateL1(
      docWith({
        kind: 'box',
        axes: { surfaceGradient: { stops: [{ color: 'red' }, { color: 'url(x)' }] } },
      } as unknown as L1Node),
    )
    expect(badStop.ok).toBe(false)

    // A border coloured with an injection payload is rejected (hex-only).
    const badBorder = validateL1(
      docWith({
        kind: 'box',
        axes: { border: { widthPx: 2, color: 'red; } body{display:none}' } },
      } as unknown as L1Node),
    )
    expect(badBorder.ok).toBe(false)

    // A freeform (unknown) axis key — a would-be raw-CSS hole — is rejected by
    // the strict schema, so no untyped value can ride in alongside typed ones.
    const freeform = validateL1(
      docWith({ kind: 'box', axes: { rawCss: 'color:red' } } as unknown as L1Node),
    )
    expect(freeform.ok).toBe(false)
  })

  it('test_UAT_FC_REQ-91_security_rejects_unsafe_background_image_url', () => {
    const js = validateL1(
      docWith({ kind: 'box', axes: { backgroundImageUrl: 'javascript:alert(1)' } } as L1Node),
    )
    expect(js.ok).toBe(false)
    const data = validateL1(
      docWith({ kind: 'box', axes: { backgroundImageUrl: 'data:text/html,<script>' } } as L1Node),
    )
    expect(data.ok).toBe(false)
    const ok = validateL1(
      docWith({ kind: 'box', axes: { backgroundImageUrl: 'https://cdn.example/x.jpg' } } as L1Node),
    )
    expect(ok.ok).toBe(true)
  })

  it('test_UAT_FC_REQ-91_robustness_rejects_out_of_range', () => {
    const shadow = validateL1(
      docWith({
        kind: 'box',
        axes: { boxShadow: { offsetXPx: 999_999, offsetYPx: 0, color: '#000000' } },
      } as L1Node),
    )
    expect(shadow.ok).toBe(false)
    const scale = validateL1(
      docWith({ kind: 'box', transform: { scale: 9999 } } as L1Node),
    )
    expect(scale.ok).toBe(false)
    const border = validateL1(
      docWith({ kind: 'box', axes: { border: { widthPx: 50_000, color: '#000000' } } } as L1Node),
    )
    expect(border.ok).toBe(false)
  })
})

describe('REQ-91 L1 pixel-mover axes — renderer safe sink', () => {
  it('test_UAT_FC_REQ-91_text_gradient_fill_renders', () => {
    const css = render({ kind: 'text', text: 'Gigabyte Alchemy', axes: { gradientFill: WORDMARK_GRADIENT } })
    expect(css).toContain('background-image: linear-gradient(90deg, #f5e6a3 0%, #f5e6a3 60%, #ff8c42 90%, #ff6b35 100%)')
    expect(css).toContain('background-clip: text')
    expect(css).toContain('-webkit-text-fill-color: transparent')
    expect(css).toContain('color: transparent')
  })

  it('test_UAT_FC_REQ-91_text_decoration_caps_shadow_marker_render', () => {
    const css = render({
      kind: 'text',
      text: 'note',
      axes: {
        textDecoration: 'underline',
        fontVariantCaps: 'small-caps',
        textShadow: CARD_SHADOW,
        listMarker: 'decimal',
      },
    })
    expect(css).toContain('text-decoration-line: underline')
    expect(css).toContain('font-variant-caps: small-caps')
    expect(css).toContain('text-shadow: 6px 4px 10px 0px #00000080')
    expect(css).toContain('display: list-item')
    expect(css).toContain('list-style-type: decimal')
    // A no-op default is not emitted.
    const none = render({ kind: 'text', text: 'x', axes: { textDecoration: 'none', listMarker: 'none' } })
    expect(none).not.toContain('text-decoration-line')
    expect(none).not.toContain('list-item')
  })

  it('test_UAT_FC_REQ-91_box_surface_gradient_overlay_and_effects_render', () => {
    const css = render({
      kind: 'box',
      axes: {
        surfaceFill: '#ffffff',
        surfaceGradient: PANEL_GRADIENT,
        overlay: HERO_SCRIM,
        border: ACCENT_BORDER,
        boxShadow: CARD_SHADOW,
        backdropBlurPx: 12,
        blendMode: 'multiply',
      },
    })
    // Overlay scrim paints ON TOP of the surface gradient (comma layer order).
    expect(css).toContain(
      'background-image: linear-gradient(#0000004d, #0000004d), linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    )
    expect(css).toContain('background-color: #ffffff')
    expect(css).toContain('border: 4px solid #00d492')
    expect(css).toContain('box-shadow: 6px 4px 10px 0px #00000080')
    expect(css).toContain('backdrop-filter: blur(12px)')
    expect(css).toContain('mix-blend-mode: multiply')
  })

  it('test_UAT_FC_REQ-91_box_background_image_url_safe_only', () => {
    const safe = render({ kind: 'box', axes: { backgroundImageUrl: '/assets/hero.jpg' } })
    expect(safe).toContain('background-image: url("/assets/hero.jpg")')
    // An unsafe URL never reaches CSS even if it somehow passed validation: the
    // renderer re-checks the scheme and drops it (defence in depth).
    const doc = docWith({ kind: 'box', axes: { backgroundImageUrl: 'javascript:alert(1)' } } as L1Node)
    const css = renderL1Document(doc).css
    expect(css).not.toContain('javascript:')
    expect(css).not.toContain('background-image: url')
  })

  it('test_UAT_FC_REQ-91_image_effects_render', () => {
    const css = render({
      kind: 'image',
      src: '/assets/photo.jpg',
      alt: 'x',
      axes: { blendMode: 'screen', border: ACCENT_BORDER, boxShadow: CARD_SHADOW },
    })
    expect(css).toContain('mix-blend-mode: screen')
    expect(css).toContain('border: 4px solid #00d492')
    expect(css).toContain('box-shadow: 6px 4px 10px 0px #00000080')
  })

  it('test_UAT_FC_REQ-91_transform_and_mask_render', () => {
    const rot = render({ kind: 'box', transform: { rotateDeg: -3, scale: 1.05 } })
    expect(rot).toContain('transform: rotate(-3deg) scale(1.05)')

    const circle = render({ kind: 'image', src: '/a.jpg', alt: 'x', mask: { shape: 'circle' } })
    expect(circle).toContain('clip-path: circle(50%)')

    const feather = render({ kind: 'box', mask: { shape: 'featherBottom', featherPx: 48 } })
    expect(feather).toContain('mask-image: linear-gradient(to top, transparent 0, #000 48px)')

    // The identity transform emits nothing.
    const identity = render({ kind: 'box', transform: { rotateDeg: 0, scale: 1 } })
    expect(identity).not.toContain('transform:')
  })

  it('test_UAT_FC_REQ-91_no_raw_css_escapes_the_typed_sink', () => {
    // Every family rendered together — the emitted CSS must contain no stray
    // declaration/brace break-out from any instance value.
    const css = render({
      kind: 'box',
      axes: {
        surfaceGradient: PANEL_GRADIENT,
        overlay: HERO_SCRIM,
        border: ACCENT_BORDER,
        boxShadow: CARD_SHADOW,
      },
      children: [{ kind: 'text', text: 'x', axes: { gradientFill: WORDMARK_GRADIENT } }],
    })
    expect(css).not.toContain('</style>')
    expect(css).not.toContain('@import')
    expect(css).not.toContain('javascript:')
    expect(css).not.toContain('expression(')
  })
})

describe('REQ-91 L1 pixel-mover axes — design check against real captures', () => {
  it('test_UAT_FC_REQ-91_fold_gigabytealchemy_gradient_wordmark', () => {
    const bundle = path.resolve(__dirname, '../storage/references/gigabytealchemy.ai/index/multistate.json')
    const multiState = JSON.parse(readFileSync(bundle, 'utf8')) as MultiStateCapture
    const doc = foldToL1(multiState)

    const withGradient: Extract<L1Node, { kind: 'text' }>[] = []
    const walk = (n: L1Node): void => {
      if (n.kind === 'text' && n.axes?.gradientFill) withGradient.push(n)
      if (n.kind === 'box' || n.kind === 'container') (n.children ?? []).forEach(walk)
    }
    walk(doc.root)

    // The gold→orange wordmark gradient survived the fold as a typed axis.
    expect(withGradient.length).toBeGreaterThan(0)
    const wordmark = withGradient.find((n) => /alchemy/i.test(n.text)) ?? withGradient[0]
    const g = wordmark.axes!.gradientFill!
    expect(g.stops.length).toBeGreaterThanOrEqual(2)
    expect(g.stops.every((s) => /^#[0-9a-fA-F]{3,8}$/.test(s.color))).toBe(true)
    expect(g.stops.map((s) => s.color)).toContain('#f5e6a3')

    // And it renders through the safe sink as a text-fill gradient.
    const css = renderL1Document(doc).css
    expect(css).toContain('background-clip: text')
    expect(css).toMatch(/linear-gradient\([^)]*#f5e6a3/)
  })
})
