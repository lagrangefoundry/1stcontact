/**
 * Reconciliation UATs — story-8acc338d "Fold a multi-viewport capture into one L1
 * reproduction document…", the **REQ-136 phase 1** upgrade: a picture's framing
 * and the colour adjustment painted over a picture or a surface.
 *
 * The text-only criteria (AC-689…AC-696) are proven in tests/reconciliation-l1-fold.test.ts
 * and the full-language ones (AC-729…AC-733) in
 * tests/reconciliation-l1-fold-full-language.test.ts. This file proves the two
 * criteria REQ-136 added, one UAT per AC:
 *
 *   AC-1133  a captured picture's framing folds to the typed percentage pair; the
 *            browser's own centre and an unreadable form fold to nothing rather
 *            than to a guess, and the pair is whole or absent
 *   AC-1134  a captured colour adjustment folds to the typed stack, with one
 *            fraction per spelling, a per-function no-op skip, a ceiling clamp to
 *            the nearest expressible value, a negative amount skipped, and a
 *            shadow-as-filter deliberately not read
 *
 * Both probes drive the real `foldToL1` / `validateL1` / `renderL1Document` entry
 * points over synthetic multi-viewport captures — real components, no mocks.
 */
import { describe, expect, it } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

/** The fixed sampled width ladder `1c capture page` walks. */
const LADDER = [320, 375, 768, 1024, 1280, 1440]

/** Build a resting `MultiStateCapture` over the ladder from a per-width element list. */
function multiFrom(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: { source: `fold@${width}`, elements: elementsAt(width), sections: [], viewport: { width, height: 1200 } },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A text-free element at one width — the media / surface shape. */
function textless(over: Partial<ValueElement> & Pick<ValueElement, 'role'>): ValueElement {
  return {
    text: '',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    ...over,
  }
}

/**
 * A captured `<img>` at one width. `objectFit` is what makes the fold classify the
 * element as media (`isMediaElement`), and `src` is what lets it emit a leaf at all
 * rather than signalling a residual.
 */
function picture(role: string, y: number, over: Partial<ValueElement> = {}): ValueElement {
  return textless({
    role,
    objectFit: 'cover',
    src: `https://cdn.example.com/${role}.jpg`,
    box: { x: 0, y, width: 600, height: 300 },
    ...over,
  })
}

/** The root box's direct children — the folded leaves, in document order. */
function leavesOf(doc: ReturnType<typeof foldToL1>) {
  return doc.root.kind === 'box' ? (doc.root.children ?? []) : []
}

/** The folded image leaves, keyed by the role the capture carried. */
function imageAxesByRole(doc: ReturnType<typeof foldToL1>): Map<string, Record<string, unknown>> {
  const out = new Map<string, Record<string, unknown>>()
  const images = leavesOf(doc).filter((n) => n.kind === 'image')
  for (const img of images) {
    if (img.kind !== 'image') continue
    // The capture's src is the only stable per-element handle that survives the
    // fold, and `picture()` derives it from the role.
    const role = img.src.replace(/^.*\/(.*)\.jpg$/, '$1')
    out.set(role, (img.axes ?? {}) as Record<string, unknown>)
  }
  return out
}

// ── AC-1133: a captured picture's framing folds to the typed pair ─────────────

describe("AC-1133 a captured picture's framing folds to the typed pair, with the browser's own centre and an unreadable form folding to nothing rather than a guess", () => {
  it('test_UAT_AC1133_framing_folds_to_typed_pair_and_unreadable_forms_fold_to_nothing', () => {
    const doc = foldToL1(
      multiFrom(() => [
        // (a) framed off-centre — the pair says something the browser would not
        //     have done unasked, so it is carried.
        picture('offcentre', 100, { objectPosition: '20% 80%' }),
        // (b) framed dead centre — what a browser does unasked, so no axis.
        picture('centred', 500, { objectPosition: '50% 50%' }),
        // (c) keyword form — a form the fold does not read: no axis, no guess.
        picture('keywords', 900, { objectPosition: 'left top' }),
        // (d) length-pair form — likewise unreadable, likewise nothing.
        picture('lengths', 1300, { objectPosition: '20px 0' }),
        // (e) one component only — the browser silently defaults the other, so
        //     writing half a pair would make the definition say something the
        //     page never did. Whole or absent.
        picture('halfpair', 1700, { objectPosition: '20%' }),
        // (f) fractional percentages survive as the typed pair.
        picture('fractional', 2100, { objectPosition: '12.5% 37.25%' }),
        // (g) a painted SURFACE carrying the same value: framing is a picture-only
        //     family here — a surface's own framing is `background-position`, a
        //     different family this fold does not touch.
        textless({
          role: 'panel',
          surfaceFill: '#f0eee9',
          objectPosition: '10% 90%',
          box: { x: 0, y: 2500, width: 600, height: 200 },
        }),
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)

    const axes = imageAxesByRole(doc)
    expect([...axes.keys()].sort()).toEqual([
      'centred',
      'fractional',
      'halfpair',
      'keywords',
      'lengths',
      'offcentre',
    ])

    // Off-centre: the typed pair with BOTH components at the captured percentages.
    expect(axes.get('offcentre')).toEqual({ objectFit: 'cover', objectPosition: { xPct: 20, yPct: 80 } })
    expect(axes.get('fractional')).toEqual({
      objectFit: 'cover',
      objectPosition: { xPct: 12.5, yPct: 37.25 },
    })

    // The browser's own centre, and every form the fold cannot read, write NO
    // framing axis — and invent no number in its place.
    for (const role of ['centred', 'keywords', 'lengths', 'halfpair']) {
      expect(axes.get(role)).toEqual({ objectFit: 'cover' })
      expect(axes.get(role)).not.toHaveProperty('objectPosition')
    }

    // Framing is carried on a folded picture only.
    const panel = leavesOf(doc).filter((n) => n.kind === 'box')[0]
    if (panel?.kind !== 'box') throw new Error('expected a folded box leaf for the painted surface')
    expect(panel.axes).toEqual({ surfaceFill: '#f0eee9' })
    expect(panel.axes).not.toHaveProperty('objectPosition')

    // Strong observation: the one framed picture pans in the emitted CSS, and it
    // is the ONLY node that does — nothing defaulted a pair in for the others.
    const { css } = renderL1Document(doc)
    const emitted = css.match(/object-position:[^;}]*/g) ?? []
    expect(emitted).toEqual(['object-position: 20% 80%', 'object-position: 12.5% 37.25%'])
  })
})

// ── AC-1134: a captured colour adjustment folds to the typed stack ────────────

describe('AC-1134 a captured colour adjustment folds to the typed stack, with one fraction per spelling, a per-function no-op skip, and an over-envelope value carried at the nearest expressible one', () => {
  it('test_UAT_AC1134_colour_adjustment_folds_to_typed_stack_across_spellings_noops_and_bounds', () => {
    const doc = foldToL1(
      multiFrom(() => [
        // (a) the same adjustment spelled as a decimal and as a percentage: one
        //     filter, and which spelling the browser reported must not matter.
        picture('decimal', 100, { filter: 'saturate(0.4)' }),
        picture('percent', 500, { filter: 'saturate(40%)' }),
        // (b) every function sitting at ITS OWN no-op value. A single skip rule
        //     would fold a fully desaturated photograph to no adjustment at all,
        //     so the whole point is that these are not one constant.
        picture('allnoop', 900, {
          filter: 'grayscale(0) sepia(0) invert(0) saturate(1) brightness(1) contrast(1) hue-rotate(0deg) blur(0px)',
        }),
        // (c) the OPPOSITE extremes of those two differently oriented scales —
        //     both are real treatments and both must survive.
        picture('extremes', 1300, { filter: 'grayscale(1) saturate(0)' }),
        // (d) past the envelope ceiling: carried at the nearest expressible value,
        //     because a real treatment reproduces better near-missed than absent.
        picture('overceiling', 1700, { filter: 'saturate(9)' }),
        // (e) a negative amount is not a treatment at all — skipped, not clamped.
        picture('negative', 2100, { filter: 'brightness(-0.5)' }),
        // (f) a shadow written as an adjustment function is deliberately NOT read:
        //     L1 already carries a typed shadow, and two ways to say one thing is
        //     the legacy-mode state the project forbids.
        picture('dropshadow', 2500, { filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.5))' }),
        // (g) no adjustment stated at all.
        picture('none', 2900, { filter: 'none' }),
        // (h) a painted SURFACE carries its own adjustment too — every painting
        //     kind holds the axis, not just pictures.
        textless({
          role: 'panel',
          surfaceFill: '#f0eee9',
          filter: 'grayscale(50%) hue-rotate(90deg) blur(3px)',
          box: { x: 0, y: 3300, width: 600, height: 200 },
        }),
      ]),
    )
    expect(validateL1(doc).ok).toBe(true)

    const axes = imageAxesByRole(doc)

    // A ratio folds to the same fraction however the browser spelled it.
    expect(axes.get('decimal')).toEqual({ objectFit: 'cover', filter: { saturate: 0.4 } })
    expect(axes.get('percent')).toEqual(axes.get('decimal'))

    // The value that changes nothing is skipped, per function — every one of the
    // eight sits at its own identity here, so no adjustment axis is written.
    expect(axes.get('allnoop')).toEqual({ objectFit: 'cover' })
    expect(axes.get('allnoop')).not.toHaveProperty('filter')

    // ...but the opposite ends of those same scales are both carried. This is the
    // assertion a single-constant skip rule would fail: `saturate(0)` is full
    // desaturation, and `grayscale(0)` above was none of it.
    expect(axes.get('extremes')).toEqual({ objectFit: 'cover', filter: { grayscale: 1, saturate: 0 } })

    // Past the ceiling → the nearest expressible value, and the document still
    // validates against the envelope that set the ceiling.
    expect(axes.get('overceiling')).toEqual({ objectFit: 'cover', filter: { saturate: 4 } })

    // A negative amount is skipped outright.
    expect(axes.get('negative')).toEqual({ objectFit: 'cover' })
    expect(axes.get('negative')).not.toHaveProperty('filter')

    // A shadow stated as an adjustment function is not carried in the stack.
    expect(axes.get('dropshadow')).toEqual({ objectFit: 'cover' })
    expect(axes.get('none')).toEqual({ objectFit: 'cover' })

    // A painted surface carries the stack too, with each spelling normalised.
    const panel = leavesOf(doc).filter((n) => n.kind === 'box')[0]
    if (panel?.kind !== 'box') throw new Error('expected a folded box leaf for the painted surface')
    expect(panel.axes).toEqual({
      surfaceFill: '#f0eee9',
      filter: { grayscale: 0.5, hueRotateDeg: 90, blurPx: 3 },
    })

    // Strong observation: the folded stacks paint. The surface emits ONE `filter`
    // declaration composing its functions in the renderer's fixed order.
    const { css } = renderL1Document(doc)
    const emitted = css.match(/[^-]filter:[^;}]*/g)?.map((s) => s.trim()) ?? []
    expect(emitted).toContain('filter: saturate(0.4)')
    expect(emitted).toContain('filter: grayscale(1) saturate(0)')
    expect(emitted).toContain('filter: saturate(4)')
    expect(emitted).toContain('filter: grayscale(0.5) hue-rotate(90deg) blur(3px)')
    // Nothing painted an adjustment for the elements that folded none.
    expect(emitted).toHaveLength(5)
  })
})
