/**
 * Reconciliation UATs for story-c490f1cf — "Absolute values re-homed in L1:
 * every colour, length, and radius is carried as a validated literal, with a
 * palette overlay for colour".
 *
 * The literal base (AC-716) lives in `reconciliation-absolute-value-literals`,
 * and the overlay's declaration / resolution / load-boundary half (AC-928..931)
 * in `reconciliation-colour-palette-overlay`. This file covers the two ACs
 * REQ-137 added when it replaced stored named steps with a **generated**
 * light↔dark family:
 *
 *   AC-1144  a reference carries a continuous `shade` on `[-1, +1]`, mixing the
 *            entry toward black or white in Oklab.
 *   AC-1145  the entry stays the unit of colour change: a shade only removes
 *            chroma, and every reference counts against its entry.
 *
 * Both drive real entry points — `validateSite` (the one validator every
 * consumer goes through), the `renderL1Document` emitter, and the published
 * palette surface (`resolveL1Color` / `shadeHex` / `collectL1PaletteRefs`)
 * re-exported from the site-schema package index. Nothing is mocked and nothing
 * touches the repo's own `storage/` tree.
 */
import { describe, expect, it } from 'vitest'
import type { L1Document, L1Palette, ValidationError } from '../packages/site-schema/src/index'
import {
  collectL1PaletteRefs,
  resolveL1Color,
  shadeHex,
  validateSite,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'

const WIDTHS = [320, 1280]

/** One entry, plus a second the page never references — see the AC-1145 tally. */
const PALETTE: L1Palette = {
  primary: { value: '#2e86a3' },
  'surface-accent': { value: '#101820' },
}

/** A site definition wrapping one L1 page — the real authored shape. */
function siteWith(doc: unknown, palette?: L1Palette): Record<string, unknown> {
  const base = starterSiteJson('storyc490f1cf-shade')
  return {
    ...base,
    ...(palette ? { palette } : {}),
    pages: [{ id: 'home', slug: '', title: 'Home', modules: [], l1: doc }],
  }
}

function errorsOf(site: Record<string, unknown>): ValidationError[] {
  const result = validateSite(site)
  return result.ok ? [] : result.errors
}

/** A minimal well-formed document, parameterised by the colour axis under test. */
function docWith(color: unknown): unknown {
  return {
    widths: WIDTHS,
    root: { kind: 'text', text: 'shade', axes: { color, fontSizePx: 16 } },
  }
}

// ── independent oracles ──────────────────────────────────────────────────────
//
// Deliberately re-derived here rather than imported: the claims below are about
// what the shade axis *is* (perceptually even, chroma-removing), so measuring
// them with the implementation's own helpers would only prove it agrees with
// itself.

/** Relative luminance from sRGB bytes — the "did it get lighter" oracle. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Chroma as the sRGB byte spread — zero for any grey, maximal for a pure hue. */
function chroma(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return Math.max(r, g, b) - Math.min(r, g, b)
}

/** Oklab lightness `L` from sRGB bytes (Björn Ottosson's matrices). */
function oklabL(hex: string): number {
  const lin = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const [lr, lg, lb] = lin
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
}

// ── AC-1144 ──────────────────────────────────────────────────────────────────

describe('AC-1144 a reference carries a continuous shade on [-1, +1], mixed in Oklab', () => {
  it('test_UAT_AC1144_shade_is_continuous_signed_perceptually_even_and_range_checked', () => {
    // ── absent and `0` are the entry itself, byte for byte ────────────────────
    // Short-circuited rather than a round trip through the colour maths that
    // happens to come back, so converting a literal to an unshaded reference
    // moves no pixel by construction rather than by the precision of the mix.
    expect(resolveL1Color({ ref: 'primary' }, PALETTE)).toBe('#2e86a3')
    expect(resolveL1Color({ ref: 'primary', shade: 0 }, PALETTE)).toBe('#2e86a3')

    // ── the ends of the axis are the pure targets it mixes toward ─────────────
    expect(resolveL1Color({ ref: 'primary', shade: 1 }, PALETTE)).toBe('#ffffff')
    expect(resolveL1Color({ ref: 'primary', shade: -1 }, PALETTE)).toBe('#000000')

    // ── monotone across the whole axis, not merely at its ends ───────────────
    // Sampled in fine steps so a mix that folded back on itself somewhere in the
    // middle could not pass. Equality is the honest outcome near the ends, where
    // consecutive shades quantise onto the same byte.
    let previous = -1
    for (let i = -100; i <= 100; i++) {
      const here = luminance(shadeHex('#2e86a3', i / 100))
      expect(here, `shade ${i / 100} darkened on the one before it`).toBeGreaterThanOrEqual(previous)
      previous = here
    }
    // …and genuinely moves: over steps the eye can distinguish, strictly.
    let coarse = -1
    for (let i = -4; i <= 4; i++) {
      const here = luminance(shadeHex('#2e86a3', i / 4))
      expect(here, `shade ${i / 4} did not lighten on the one before it`).toBeGreaterThan(coarse)
      coarse = here
    }

    // ── evenly, in Oklab — the property that makes a slider over the axis ─────
    // linear in what the eye sees. Equal numeric steps must produce equal
    // perceptual (Oklab L) steps, measured on each side of the entry separately
    // since the two sides mix toward different targets.
    for (const side of [1, -1]) {
      const steps = [0, 0.25, 0.5, 0.75, 1].map((t) => oklabL(shadeHex('#2e86a3', side * t)))
      const deltas = steps.slice(1).map((L, i) => L - steps[i])
      for (const d of deltas) {
        expect(Math.abs(d - deltas[0]), `Oklab L steps are uneven on the ${side > 0 ? '+' : '-'} side`)
          .toBeLessThan(0.01)
      }
    }
    // The check has teeth: a straight sRGB lerp — the obvious wrong answer, which
    // bunches the perceived change at the dark end — lands somewhere else.
    const srgbMidToWhite = `#${[1, 3, 5]
      .map((i) => Math.round((parseInt('2e86a3'.slice(i - 1, i + 1), 16) + 255) / 2))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')}`
    expect(shadeHex('#2e86a3', 0.5)).not.toBe(srgbMidToWhite)

    // ── outside the range is a validation failure, not a clamp ────────────────
    // A clamp would silently paint a colour nobody asked for, which is the
    // render-time fallback this model does not have. Just outside each end and
    // well outside both fail, through the whole-site validator.
    for (const shade of [1.001, -1.001, 5, -5]) {
      expect(
        errorsOf(siteWith(docWith({ ref: 'primary', shade }), PALETTE)).length,
        `shade ${shade} was accepted`,
      ).toBeGreaterThan(0)
    }
    // …and every value on the range inclusive, including both endpoints, is
    // accepted — the axis is continuous, not a set of admitted stops.
    for (const shade of [-1, -0.75, -0.5, -0.125, 0, 0.125, 0.5, 0.75, 1]) {
      expect(
        errorsOf(siteWith(docWith({ ref: 'primary', shade }), PALETTE)),
        `shade ${shade} was rejected`,
      ).toEqual([])
    }

    // ── shade and alpha are independent axes on the same reference ────────────
    // The same entry at a shade, at an opacity, and at both: neither displaces
    // the other, and both compose in either combination.
    const shaded = shadeHex('#2e86a3', -0.3)
    expect(resolveL1Color({ ref: 'primary', shade: -0.3 }, PALETTE)).toBe(shaded)
    expect(resolveL1Color({ ref: 'primary', alpha: 0.5 }, PALETTE)).toBe('#2e86a380')
    expect(resolveL1Color({ ref: 'primary', shade: -0.3, alpha: 0.5 }, PALETTE)).toBe(`${shaded}80`)

    // …and the shaded colour is what actually paints, through the real emitter.
    const { css } = renderL1Document(
      docWith({ ref: 'primary', shade: -0.3 }) as L1Document,
      { palette: PALETTE },
    )
    expect(css).toContain(shaded)
  })
})

// ── AC-1145 ──────────────────────────────────────────────────────────────────

describe('AC-1145 the entry stays the unit of change: shade only removes chroma, and refs tally to the entry', () => {
  it('test_UAT_AC1145_a_shade_only_removes_chroma_and_every_reference_counts_against_its_entry', () => {
    // ── a shade only ever removes chroma ─────────────────────────────────────
    // Both targets the mix moves toward — black and white — are achromatic, so
    // no shade of an entry is more saturated than the entry itself. Sampled end
    // to end across bases spanning hue and saturation, from a fully saturated
    // primary to a near-neutral. The +1 slack is byte quantisation, not licence:
    // it cannot hide a mix that genuinely added chroma.
    for (const base of ['#2e86a3', '#d94f2b', '#00bc7d', '#1447e6', '#ff0000', '#8a8f94']) {
      for (let i = -100; i <= 100; i++) {
        const shaded = shadeHex(base, i / 100)
        expect(chroma(shaded), `${base} @ shade ${i / 100} gained chroma`).toBeLessThanOrEqual(
          chroma(base) + 1,
        )
      }
      // …and at the ends it is gone entirely: pure black and pure white are the
      // targets, so the axis terminates in colours with no chroma at all.
      expect(chroma(shadeHex(base, 1))).toBe(0)
      expect(chroma(shadeHex(base, -1))).toBe(0)
    }

    // The consequence is a real boundary on the model: a colour MORE saturated
    // than a candidate base is not a shade of it and cannot be filed under it —
    // no position on the axis reproduces it, so it must earn its own entry.
    const moreSaturated = '#00d5ff' // brighter and more chromatic than #2e86a3
    expect(chroma(moreSaturated)).toBeGreaterThan(chroma('#2e86a3'))
    for (let i = -100; i <= 100; i++) {
      expect(shadeHex('#2e86a3', i / 100), 'a more saturated colour was reachable as a shade').not.toBe(
        moreSaturated,
      )
    }

    // ── a reference counts against its entry whatever shade it carries ───────
    // A page whose colour axes reference ONE entry three ways: plain, at a
    // shade, and at a shade with an alpha.
    const doc = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        axes: {
          surfaceFill: { ref: 'primary' }, //                      plain
          border: { widthPx: 2, color: { ref: 'primary', shade: 0.4 } }, // shaded
        },
        children: [
          {
            kind: 'text',
            text: 'one entry, three uses',
            axes: { color: { ref: 'primary', shade: -0.4, alpha: 0.5 }, fontSizePx: 18 }, // shaded + alpha
          },
        ],
      },
    }
    expect(errorsOf(siteWith(doc, PALETTE))).toEqual([])

    // The three uses are genuinely three different painted colours…
    const painted = [
      resolveL1Color({ ref: 'primary' }, PALETTE),
      resolveL1Color({ ref: 'primary', shade: 0.4 }, PALETTE),
      resolveL1Color({ ref: 'primary', shade: -0.4, alpha: 0.5 }, PALETTE),
    ]
    expect(new Set(painted).size).toBe(3)
    const { css } = renderL1Document(doc as unknown as L1Document, { palette: PALETTE })
    for (const hex of painted) expect(css, `no axis emitted ${hex}`).toContain(hex)

    // …and all three tally against the single entry they name. There is no
    // per-position tally, because a shade is a position within the entry's own
    // family rather than a sibling of it — so the count an editor surfaces for
    // `primary` is the whole truth about what editing it will move.
    const tally = new Map<string, number>()
    for (const { ref } of collectL1PaletteRefs(doc)) {
      tally.set(ref.ref, (tally.get(ref.ref) ?? 0) + 1)
    }
    expect([...tally.keys()], 'a shaded reference invented an entry of its own').toEqual(['primary'])
    expect(tally.get('primary')).toBe(3)
    // The palette declares a second entry, so a single-key tally is a real
    // finding rather than the only answer available.
    expect(Object.keys(PALETTE).length).toBeGreaterThan(1)
  })
})
