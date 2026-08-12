/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", the criteria added by the **REQ-136 phase 1** upgrade: a
 * picture's framing, its shape, and the colour adjustment of a node's own paint.
 *
 *   AC-1124  a picture declares which part of itself its box shows
 *   AC-1125  a node's own paint carries a typed colour adjustment, emitted as one
 *            declaration in a fixed order
 *   AC-1126  an adjustment at its identity emits nothing, and the identity
 *            differs per function
 *   AC-1127  a typed shape names an intent and never geometry, and a generated
 *            outline is deterministic
 *   AC-1128  the envelope bounds a colour adjustment through the shared surface
 *            check
 *
 * The story's other criteria are pinned in the companion files
 * `reconciliation-l1-substrate.test.ts`, `reconciliation-l1-language.test.ts`,
 * `reconciliation-l1-shared-axis-groups.test.ts` and
 * `reconciliation-l1-control-and-texture.test.ts`; this file covers only the ones
 * those do not.
 *
 * Every probe here is engine-free: the envelope validator and the sole emitter
 * are both pure, and each of these five claims is a property of one or the other.
 */
import { describe, expect, it } from 'vitest'
import {
  validateL1,
  type L1Document,
  type L1Node,
  type L1SurfaceAxes,
} from '../packages/site-schema/src/index'
import {
  renderL1Document,
  renderL1Fragment,
  type L1ControlElement,
} from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

/** A one-child document whose single node is the subject under test. */
function docWith(node: L1Node): L1Document {
  return {
    widths: WIDTHS,
    root: { kind: 'container', id: 'root', layout: 'stack', children: [node] },
  }
}

/**
 * The declarations of one class's **axis** rule — the last un-media-queried rule
 * for that selector (a node carrying geometry emits its position rule for the
 * same selector first; the axis rule the emitter builds is always last).
 */
function baseDecls(css: string, cls: string): string[] {
  const head = css.split('@media')[0]
  const rules = [...head.matchAll(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))]
  const last = rules[rules.length - 1]
  return last
    ? last[1]
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
    : []
}

/** Validate, then render, the subject node — returning its own declarations. */
function declsOf(node: L1Node): string[] {
  const doc = docWith(node)
  const report = validateL1(doc)
  expect(report.ok, report.ok ? '' : JSON.stringify(report.errors)).toBe(true)
  // The root container is `l1-0`; its single child — the subject — is `l1-1`.
  return baseDecls(renderL1Document(doc).css, 'l1-1')
}

/** The one declaration whose property is `prop`, or undefined if none. */
function decl(decls: string[], prop: string): string | undefined {
  return decls.find((d) => d.startsWith(`${prop}:`))
}

/** Every error path a rejected document reports. */
function errorPaths(doc: unknown): string[] {
  const report = validateL1(doc)
  expect(report.ok, 'the document was expected to be REJECTED by the envelope').toBe(false)
  return report.ok ? [] : report.errors.map((e) => e.path)
}

/** Assert the document validates — the boundary is the value, not the axis. */
function expectAccepted(doc: unknown): void {
  const report = validateL1(doc)
  expect(report.ok, report.ok ? '' : JSON.stringify(report.errors)).toBe(true)
}

/** A minimal node of each box-rendering kind, ready to be spread with `axes`. */
const KIND_BASES: Record<string, L1Node> = {
  box: { kind: 'box' },
  container: { kind: 'container', layout: 'stack', children: [] },
  text: { kind: 'text', text: 'Evidence of correctness' },
  image: { kind: 'image', src: '/assets/photo.jpg', alt: 'Photo' },
  slot: { kind: 'slot', name: 'signup-form' },
}

/** The mounted roster a `control` leaf paints through. */
const ROSTER: Record<string, L1ControlElement> = {
  email: { tag: 'input', attrs: { type: 'email', name: 'email', id: 'cf-email' } },
}

// ── AC-1124: a picture declares which part of itself its box shows ─────────────

describe('AC-1124 a picture declares which part of itself its box shows', () => {
  it('test_UAT_AC1124_object_position_is_a_pair_or_nothing_and_image_only', () => {
    // The pan half of a crop: `cover` makes the box a window onto a larger
    // picture, and this says where the window looks. It is re-derived as an
    // `object-position` percentage pair beside the fill mode, because the two are
    // one idea.
    const framed = declsOf({
      kind: 'image',
      src: '/assets/hero.jpg',
      alt: 'The hero',
      axes: { objectFit: 'cover', objectPosition: { xPct: 25, yPct: 80 } },
    })
    expect(framed).toContain('object-fit: cover')
    expect(framed).toContain('object-position: 25% 80%')

    // AN ABSENT AXIS MEANS THE BROWSER'S OWN CENTRE, not a recorded default: a
    // picture that declares no framing emits NO `object-position` at all, so
    // returning a framed picture to the centre removes the axis rather than
    // writing the browser's own behaviour into the definition.
    const unframed = declsOf({
      kind: 'image',
      src: '/assets/hero.jpg',
      alt: 'The hero',
      axes: { objectFit: 'cover' },
    })
    expect(unframed).toContain('object-fit: cover')
    expect(decl(unframed, 'object-position')).toBeUndefined()

    // A PAIR OR NOTHING. Both components are required together — CSS silently
    // defaults an unspecified component to a centred 50%, so a half-written
    // position is not "unset on one axis" but a load-bearing value the document
    // never said.
    for (const half of [{ xPct: 25 }, { yPct: 80 }]) {
      const paths = errorPaths(
        docWith({
          kind: 'image',
          src: '/assets/hero.jpg',
          alt: 'The hero',
          axes: { objectPosition: half },
        } as unknown as L1Node),
      )
      expect(paths.some((p) => p.includes('objectPosition'))).toBe(true)
    }

    // Each component is bounded to 0–100, and the offending field is located.
    for (const [pos, field] of [
      [{ xPct: 140, yPct: 50 }, 'xPct'],
      [{ xPct: 50, yPct: -10 }, 'yPct'],
    ] as const) {
      const paths = errorPaths(
        docWith({
          kind: 'image',
          src: '/assets/hero.jpg',
          alt: 'The hero',
          axes: { objectPosition: pos },
        } as unknown as L1Node),
      )
      expect(paths).toContain(`/root/children/0/axes/objectPosition/${field}`)
    }

    // THE AXIS IS THE IMAGE LEAF'S ALONE. Framing replaced content and framing a
    // paint layer are different CSS families, and a painted surface's background
    // is still pinned to `cover / center / no-repeat` — so the axis is refused
    // outright on every other kind rather than offered and half-honoured.
    for (const kind of ['box', 'container', 'text', 'slot'] as const) {
      const report = validateL1(
        docWith({
          ...KIND_BASES[kind],
          axes: { objectPosition: { xPct: 25, yPct: 80 } },
        } as unknown as L1Node),
      )
      expect(report.ok, `${kind} must refuse objectPosition as an unknown key`).toBe(false)
      const reported = report.ok ? '' : JSON.stringify(report.errors)
      expect(reported).toContain('objectPosition')
    }

    // …and the boundary really is the *kind*, not the shape: the same non-framing
    // axes on those kinds validate.
    for (const kind of ['box', 'container', 'text', 'slot'] as const) {
      expectAccepted(docWith({ ...KIND_BASES[kind], axes: { surfaceFill: '#101828' } } as L1Node))
    }
  })
})

// ── AC-1125: one filter declaration, in the renderer's own order ───────────────

describe('AC-1125 a node paints a typed colour adjustment as one declaration in a fixed order', () => {
  it('test_UAT_AC1125_colour_adjustment_emits_one_ordered_declaration_on_every_kind', () => {
    const FULL: L1SurfaceAxes['filter'] = {
      // Deliberately written in an order that is NOT the emitted one.
      contrast: 1.2,
      grayscale: 0.5,
      blurPx: 2,
      saturate: 0.4,
      hueRotateDeg: 30,
      brightness: 1.1,
      invert: 0.25,
      sepia: 0.75,
    }
    const EXPECTED =
      'filter: grayscale(0.5) sepia(0.75) invert(0.25) saturate(0.4) ' +
      'brightness(1.1) contrast(1.2) hue-rotate(30deg) blur(2px)'

    const decls = declsOf({ kind: 'box', axes: { filter: FULL } })
    // EXACTLY ONE declaration, whichever combination is declared — never one
    // property per function.
    const filters = decls.filter((d) => d.startsWith('filter:'))
    expect(filters).toHaveLength(1)
    expect(filters[0]).toBe(EXPECTED)

    // THE ORDER IS THE RENDERER'S, NOT THE DOCUMENT'S. Filter functions compose
    // in sequence, so removing colour then doubling saturation paints differently
    // from the reverse; the order a document happens to list its fields in is an
    // accident of how the file was written or how a diff was applied. Two
    // documents saying the identical thing must therefore emit byte-identical
    // declarations.
    const reversed = Object.fromEntries(
      Object.entries(FULL as Record<string, number>).reverse(),
    ) as L1SurfaceAxes['filter']
    expect(Object.keys(reversed!)).not.toEqual(Object.keys(FULL!))
    expect(decl(declsOf({ kind: 'box', axes: { filter: reversed } }), 'filter')).toBe(EXPECTED)

    // CSS-CANONICAL RATIOS, NOT PERCENTAGES — the form a browser reports, so a
    // measurement taken off a real page is recorded unconverted and the round
    // trip closes with no hidden unit change.
    expect(filters[0]).toContain('saturate(0.4)')
    expect(filters[0]).not.toContain('%')

    // The adjustment is on the SHARED surface group, so every box-rendering kind
    // paints it — an axis L1 could carry on only one kind is an axis every other
    // kind would have to reach outside L1 for.
    for (const [kind, base] of Object.entries(KIND_BASES)) {
      const kindDecls = declsOf({ ...base, axes: { filter: { saturate: 0.4 } } } as L1Node)
      expect(decl(kindDecls, 'filter'), `${kind} must paint the adjustment`).toBe(
        'filter: saturate(0.4)',
      )
    }
    // …including the `control` leaf, which paints through a mounted roster.
    const fragment = renderL1Fragment(
      [{ kind: 'control', control: 'email', axes: { filter: { saturate: 0.4 } } }],
      'cf',
      ROSTER,
    )
    expect(decl(baseDecls(fragment.css, 'cf-l1-0'), 'filter')).toBe('filter: saturate(0.4)')

    // DISTINCT FROM THE BACKDROP BLUR the same group carries: one blurs what sits
    // behind the node, the other adjusts what the node itself paints. A node may
    // declare both, and both are emitted as separate properties.
    const both = declsOf({ kind: 'box', axes: { backdropBlurPx: 6, filter: { blurPx: 3 } } })
    expect(both).toContain('backdrop-filter: blur(6px)')
    expect(both).toContain('filter: blur(3px)')
  })
})

// ── AC-1126: an identity emits nothing, and the identity differs per function ──

describe('AC-1126 an adjustment at its identity emits nothing, per function', () => {
  it('test_UAT_AC1126_identity_is_skipped_per_function_and_the_opposite_extreme_is_emitted', () => {
    // The no-op is ONE for the scaling adjustments and ZERO for the rest. A
    // single "skip the zero" or "skip the one" rule would silently discard half
    // of them.
    const IDENTITY: Record<string, number> = {
      grayscale: 0,
      sepia: 0,
      invert: 0,
      saturate: 1,
      brightness: 1,
      contrast: 1,
      hueRotateDeg: 0,
      blurPx: 0,
    }

    // Each function at its own identity, one at a time: it costs a compositing
    // layer and moves no pixel, so nothing is emitted for it.
    for (const [name, value] of Object.entries(IDENTITY)) {
      const decls = declsOf({ kind: 'box', axes: { filter: { [name]: value } } } as L1Node)
      expect(decl(decls, 'filter'), `${name}=${value} is the identity and must emit nothing`)
        .toBeUndefined()
    }

    // Every function at its identity at once: no adjustment declaration at all.
    expect(
      decl(declsOf({ kind: 'box', axes: { filter: IDENTITY } } as L1Node), 'filter'),
    ).toBeUndefined()

    // THE OPPOSING EXTREME OF EACH FUNCTION REACHES THE PAGE. This is what proves
    // the skip rule is per-function rather than one constant applied to all: a
    // fully desaturated photograph (`saturate: 0`) must not be discarded as
    // though zero were a no-op, and a fully greyscale one (`grayscale: 1`) must
    // not be discarded as though one were.
    const EXTREME: Array<[string, number, string]> = [
      ['grayscale', 1, 'grayscale(1)'],
      ['sepia', 1, 'sepia(1)'],
      ['invert', 1, 'invert(1)'],
      ['saturate', 0, 'saturate(0)'],
      ['brightness', 0, 'brightness(0)'],
      ['contrast', 0, 'contrast(0)'],
      ['hueRotateDeg', 180, 'hue-rotate(180deg)'],
      ['blurPx', 4, 'blur(4px)'],
    ]
    for (const [name, value, emitted] of EXTREME) {
      const decls = declsOf({ kind: 'box', axes: { filter: { [name]: value } } } as L1Node)
      expect(decl(decls, 'filter'), `${name}=${value} must reach the page`).toBe(
        `filter: ${emitted}`,
      )
    }

    // The consequence stated as one probe: an adjusted surface and an unadjusted
    // one never collapse to the same output.
    const adjusted = declsOf({ kind: 'box', axes: { filter: { saturate: 0 } } })
    const unadjusted = declsOf({ kind: 'box', axes: { filter: { saturate: 1 } } })
    expect(adjusted).not.toEqual(unadjusted)
  })
})

// ── AC-1127: a typed shape names an intent; a generated outline is deterministic ─

describe('AC-1127 a typed shape names an intent and never geometry', () => {
  it('test_UAT_AC1127_renderer_drawn_shapes_are_bounded_and_a_blob_is_seed_deterministic', () => {
    // A LEANING QUADRILATERAL and a GENERATED ORGANIC OUTLINE join the circle,
    // the ellipse and the feathers — each emitted as a clip path whose geometry
    // is built entirely by the renderer from bounded numbers.
    const leaning = declsOf({ kind: 'box', mask: { shape: 'parallelogram', slantPct: 12 } })
    const generated = declsOf({ kind: 'box', mask: { shape: 'blob', roughness: 0.6, seed: 7 } })
    for (const decls of [leaning, generated]) {
      const clip = decl(decls, 'clip-path')
      expect(clip).toMatch(/^clip-path: polygon\(/)
      // THE DOCUMENT NAMES THE INTENT AND NEVER THE GEOMETRY: no coordinate,
      // path or point list is authored, so nothing in the emitted polygon can
      // have come from an instance string.
      expect(clip).not.toContain('url(')
      expect(clip).toMatch(/^clip-path: polygon\((-?[\d.]+% -?[\d.]+%, )*-?[\d.]+% -?[\d.]+%\)$/)
    }
    // A lean is a real shape change, not a decorative no-op.
    expect(decl(leaning, 'clip-path')).not.toBe(
      decl(declsOf({ kind: 'box', mask: { shape: 'parallelogram', slantPct: 30 } }), 'clip-path'),
    )

    // A GENERATED OUTLINE IS DETERMINISTIC IN ITS SEED. This is a correctness
    // obligation and not polish: an outline that differed between two renders of
    // one document would break the round-trip identity the substrate is gated on
    // and would make the picture visibly change on every re-render.
    const outline = (seed: number, roughness = 0.6): string =>
      decl(declsOf({ kind: 'box', mask: { shape: 'blob', roughness, seed } }), 'clip-path')!
    expect(outline(7)).toBe(outline(7))
    expect(outline(7)).not.toBe(outline(8))
    // …and how many points make an outline read as organic is the renderer's own
    // constant: the document cannot reach in to set it, and every seed produces
    // the same vertex count.
    const vertices = (clip: string): number => clip.split(',').length
    expect(vertices(outline(8))).toBe(vertices(outline(7)))

    // SHAPE AND CORNER ROUNDING ARE INDEPENDENT TREATMENTS — rounding is the
    // shared surface's own axis, not a mask — so a node may carry both and
    // neither displaces the other.
    const rounded = declsOf({
      kind: 'image',
      src: '/assets/portrait.jpg',
      alt: 'A portrait',
      axes: { borderRadiusPx: 24 },
      mask: { shape: 'blob', roughness: 0.4, seed: 3 },
    })
    expect(rounded).toContain('border-radius: 24px')
    expect(decl(rounded, 'clip-path')).toMatch(/^clip-path: polygon\(/)

    // The parameters are bounded, and each is inert on the shapes that do not
    // name it. A lean cannot consume the whole box and degenerate into a
    // different shape; a roughness is bounded to its full range.
    for (const [mask, field] of [
      [{ shape: 'parallelogram', slantPct: 60 }, 'slantPct'],
      [{ shape: 'parallelogram', slantPct: -60 }, 'slantPct'],
      [{ shape: 'blob', roughness: 1.5 }, 'roughness'],
      [{ shape: 'blob', roughness: -0.2 }, 'roughness'],
      [{ shape: 'blob', seed: 10_000 }, 'seed'],
    ] as const) {
      const paths = errorPaths(docWith({ kind: 'box', mask } as unknown as L1Node))
      expect(paths).toContain(`/root/children/0/mask/${field}`)
    }
    // …and an unknown key on the shape object is refused rather than ignored, so
    // no authored path can be smuggled in beside a typed field.
    const smuggled = errorPaths(
      docWith({
        kind: 'box',
        mask: { shape: 'blob', points: '0% 0%, 100% 100%' },
      } as unknown as L1Node),
    )
    expect(smuggled.some((p) => p.startsWith('/root/children/0/mask'))).toBe(true)

    // The boundary is the value's range, not the presence of the axis.
    expectAccepted(docWith({ kind: 'box', mask: { shape: 'parallelogram', slantPct: 45 } }))
    expectAccepted(docWith({ kind: 'box', mask: { shape: 'blob', roughness: 1, seed: 9999 } }))
  })
})

// ── AC-1128: the envelope bounds the adjustment through the shared check ───────

describe('AC-1128 the envelope bounds a colour adjustment through the shared surface check', () => {
  it('test_UAT_AC1128_adjustment_bounds_apply_to_base_and_interaction_states_alike', () => {
    // A SCALING ADJUSTMENT outside [0, 4]. The ceiling is a robustness rule
    // rather than taste: an adjustment four times over is no longer an adjustment
    // but a way to delete the content the page still pays to download.
    for (const name of ['saturate', 'brightness', 'contrast'] as const) {
      const paths = errorPaths(
        docWith({ kind: 'box', axes: { filter: { [name]: 5 } } } as unknown as L1Node),
      )
      expect(paths).toContain(`/root/children/0/axes/filter/${name}`)
    }

    // A HUE SHIFT outside the rotation bounds every other angle is held to, and a
    // BLUR OF THE NODE'S OWN PAINT outside the effect-length bounds.
    expect(
      errorPaths(docWith({ kind: 'box', axes: { filter: { hueRotateDeg: 5000 } } } as L1Node)),
    ).toContain('/root/children/0/axes/filter/hueRotateDeg')
    expect(
      errorPaths(docWith({ kind: 'box', axes: { filter: { blurPx: 20_000 } } } as L1Node)),
    ).toContain('/root/children/0/axes/filter/blurPx')

    // A greyscale / sepia / invert outside 0..1 — the whole of their range.
    for (const name of ['grayscale', 'sepia', 'invert'] as const) {
      for (const bad of [1.5, -0.5]) {
        const paths = errorPaths(
          docWith({ kind: 'box', axes: { filter: { [name]: bad } } } as unknown as L1Node),
        )
        expect(paths).toContain(`/root/children/0/axes/filter/${name}`)
      }
    }

    // ANY UNKNOWN OR EXTRA KEY on the adjustment object — so no freeform filter
    // can be smuggled in beside a typed field.
    const smuggled = errorPaths(
      docWith({
        kind: 'box',
        axes: { filter: { saturate: 0.4, dropShadow: '0 0 4px red' } },
      } as unknown as L1Node),
    )
    expect(smuggled.some((p) => p.startsWith('/root/children/0/axes/filter'))).toBe(true)

    // BECAUSE THE CHECK IS SHARED, AN INTERACTION-STATE ADJUSTMENT IS BOUNDED BY
    // THE IDENTICAL RULE AS THE BASE NODE. An adjustment that only fires on
    // pointer-over or on keyboard focus is exactly where an unbounded value would
    // go unnoticed — a state is not a route around the ceiling.
    for (const state of ['hover', 'focus'] as const) {
      const paths = errorPaths(
        docWith({
          kind: 'box',
          interaction: { [state]: { filter: { saturate: 9 } } },
        } as unknown as L1Node),
      )
      expect(paths).toContain(`/root/children/0/interaction/${state}/filter/saturate`)
    }

    // The bound applies to EVERY box-rendering kind, wherever the shared group is
    // carried — a value cannot escape by being declared on a kind nobody
    // remembered to check.
    for (const [kind, base] of Object.entries(KIND_BASES)) {
      const paths = errorPaths(
        docWith({ ...base, axes: { filter: { brightness: 6 } } } as unknown as L1Node),
      )
      expect(paths, `${kind} must be bounded identically`).toContain(
        '/root/children/0/axes/filter/brightness',
      )
    }

    // THE BOUNDARY IS THE VALUE'S RANGE, NOT THE PRESENCE OF THE AXIS: the
    // boundary values themselves are accepted.
    expectAccepted(
      docWith({
        kind: 'box',
        axes: {
          filter: {
            grayscale: 1,
            sepia: 0,
            invert: 1,
            saturate: 4,
            brightness: 0,
            contrast: 4,
            hueRotateDeg: 3600,
            blurPx: 10_000,
          },
        },
      } as L1Node),
    )
    expectAccepted(
      docWith({
        kind: 'box',
        interaction: { hover: { filter: { saturate: 4 } }, focus: { filter: { saturate: 0 } } },
      } as L1Node),
    )
  })
})
