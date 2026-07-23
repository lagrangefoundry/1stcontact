/**
 * BUG-17 — L1 padding axis UATs.
 *
 * The fold dropped element padding, so pill badges / buttons reproduced as tight
 * text with no pill shape or click target, and their missing box height inflated
 * downstream inter-element gaps. This adds a node-level `padding` axis that:
 *
 *   - the envelope validator ACCEPTS (typed, non-negative, in range) and REJECTS
 *     out-of-range / negative / freeform-key inputs (no raw-CSS hole),
 *   - the renderer EMITS as per-side longhands through the safe numeric sink,
 *     INSIDE the `box-sizing: border-box` reset (so it insets content rather than
 *     inflating the pinned keyframe geometry),
 *   - the fold carries straight from the capture's `paddingTop/Right/Bottom/LeftPx`
 *     — proven against the real gigabytealchemy badges ("Coming soon" 4/12/4/12).
 *
 * All probes are deterministic (validator + emitter + fold); no browser required.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
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

const BADGE_PADDING = { topPx: 4, rightPx: 12, bottomPx: 4, leftPx: 12 } as const

describe('BUG-17 L1 padding axis — validator envelope', () => {
  it('test_UAT_FC_BUG-17_validator_accepts_padding_on_text_box_image', () => {
    const doc: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        padding: { topPx: 24, bottomPx: 24 },
        children: [
          { kind: 'text', text: 'Coming soon', padding: BADGE_PADDING },
          { kind: 'image', src: '/assets/photo.jpg', alt: 'x', padding: { leftPx: 8 } },
        ],
      },
    }
    const res = validateL1(doc)
    expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  })

  it('test_UAT_FC_BUG-17_robustness_rejects_negative_and_out_of_range', () => {
    // Negative padding is rejected by the schema (non-negative).
    const neg = validateL1(docWith({ kind: 'text', text: 'x', padding: { topPx: -4 } } as unknown as L1Node))
    expect(neg.ok).toBe(false)
    // A padding beyond the envelope ceiling is rejected (can't blow out layout).
    const huge = validateL1(docWith({ kind: 'box', padding: { leftPx: 999_999 } }))
    expect(huge.ok).toBe(false)
  })

  it('test_UAT_FC_BUG-17_security_rejects_freeform_padding_key', () => {
    // A freeform key on the padding object — a would-be raw-CSS hole — is rejected
    // by the strict schema, so no untyped value can ride in alongside the sides.
    const freeform = validateL1(
      docWith({ kind: 'box', padding: { topPx: 4, css: 'color:red' } } as unknown as L1Node),
    )
    expect(freeform.ok).toBe(false)
  })
})

describe('BUG-17 L1 padding axis — renderer safe sink', () => {
  it('test_UAT_FC_BUG-17_renders_present_sides_as_longhands', () => {
    const css = render({ kind: 'text', text: 'Coming soon', padding: BADGE_PADDING })
    expect(css).toContain('padding-top: 4px')
    expect(css).toContain('padding-right: 12px')
    expect(css).toContain('padding-bottom: 4px')
    expect(css).toContain('padding-left: 12px')
  })

  it('test_UAT_FC_BUG-17_partial_padding_omits_absent_sides', () => {
    // Only the present sides emit — an absent side never resets the others.
    const css = render({ kind: 'box', padding: { leftPx: 32, rightPx: 32 } })
    expect(css).toContain('padding-left: 32px')
    expect(css).toContain('padding-right: 32px')
    expect(css).not.toContain('padding-top')
    expect(css).not.toContain('padding-bottom')
  })

  it('test_UAT_FC_BUG-17_padding_insets_within_border_box_geometry', () => {
    // The document reset sets border-box, so padding insets content inside the
    // pinned keyframe box rather than inflating it — this is what makes folding a
    // captured (padding-inclusive) box geometry round-trip-safe.
    const node: L1Node = {
      kind: 'text',
      text: 'Send message',
      padding: { topPx: 12, rightPx: 32, bottomPx: 12, leftPx: 32 },
      geometry: { keyframes: [{ at: 320, x: 0, y: 0, width: 160 }] },
    }
    const full = renderL1Document(docWith(node)).css
    expect(full).toContain('box-sizing: border-box')
    expect(full).toContain('padding-left: 32px')
    // No raw-CSS break-out from the numeric sink.
    expect(full).not.toContain('</style>')
    expect(full).not.toContain('@import')
  })
})

describe('BUG-17 L1 padding axis — design check against real captures', () => {
  it('test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding', () => {
    const bundle = path.resolve(__dirname, '../storage/references/gigabytealchemy.ai/index/multistate.json')
    const multiState = JSON.parse(readFileSync(bundle, 'utf8')) as MultiStateCapture
    const doc = foldToL1(multiState)

    const padded: Extract<L1Node, { kind: 'text' }>[] = []
    const walk = (n: L1Node): void => {
      if (n.kind === 'text' && n.padding) padded.push(n)
      if (n.kind === 'box' || n.kind === 'container') (n.children ?? []).forEach(walk)
    }
    walk(doc.root)

    // The pill badges survived the fold as text leaves carrying their captured pad.
    const badge = padded.find((n) => /coming soon|in development/i.test(n.text))
    expect(badge, 'a padded badge text leaf should be folded').toBeDefined()
    // Captured badge padding is 4/12/4/12 (top/right/bottom/left).
    expect(badge!.padding!.leftPx).toBe(12)
    expect(badge!.padding!.rightPx).toBe(12)
    expect(badge!.padding!.topPx).toBe(4)

    // And it renders through the safe sink as padding longhands.
    const css = renderL1Document(doc).css
    expect(css).toContain('padding-left: 12px')
  })
})
