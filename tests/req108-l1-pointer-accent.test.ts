/**
 * REQ-108 — the texture responds to the pointer.
 *
 * A band's grid was inert: whatever L1 painted, it painted the same way whether a
 * reader's hand was over it or on the other side of the screen. The only route to
 * a cursor-reactive surface was a hand-written script and a hand-written mask,
 * which is exactly the pair the substrate exists to keep out of an instance — one
 * names a selector, the other names a CSS string, and between them they can paint
 * anything anywhere.
 *
 * These UATs pin the ticket's acceptance: a typed `pointerAccent` axis redraws the
 * node's OWN texture in a second colour inside a rough region that tracks the
 * cursor — for a `pattern`-drawn grid and for an asset-drawn one (the hero's
 * perspective grid, which no orthogonal tile can express); the overlay is gated on
 * a marker only the script sets, so a page with no pointer — no JS, a touchscreen,
 * a reduced-motion reader, every capture — paints exactly what it painted before;
 * the script is a renderer-owned constant carrying no instance value; the region's
 * roughness is deliberate and stable rather than random; and the envelope bounds
 * the new numbers.
 */
import { describe, expect, it } from 'vitest'
import {
  l1ContainerSchema,
  l1PointerAccentSchema,
  validateL1,
  L1_ENVELOPE,
  type L1Document,
  type L1Node,
  type L1SurfaceAxes,
} from '../packages/site-schema/src/index'
import { renderL1Document, L1_POINTER_SCRIPT } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

/** The brown hairline grid the xgd.dev bands actually paint. */
const GRID = { shape: 'grid', spacingPx: 48, thicknessPx: 1, color: '#8b5c2a1a' } as const
/** Teal-petrol, the accent the page uses. */
const TEAL = '#2e86a3'
const ACCENT = { color: TEAL, radiusPx: 90 } as const

/** A one-band document whose single painted container is the subject under test. */
function docWithBand(axes: L1SurfaceAxes): L1Document {
  return {
    widths: WIDTHS,
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [{ kind: 'container', id: 'band', layout: 'stack', children: [], axes }],
    },
  }
}

/** The declarations of one selector's rule (no media query) in a stylesheet. */
function declsOf(css: string, selector: string): string[] {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(css)
  return m ? m[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** One declaration by property name, or undefined. */
function decl(decls: string[], prop: string): string | undefined {
  return decls.find((d) => d.startsWith(`${prop}:`))?.slice(prop.length + 1).trim()
}

/** The class of the rendered element carrying `id`. */
function classAttr(html: string, id: string): string {
  const m = new RegExp(`<\\w+ class="([^"]+)" id="${id}"`).exec(html)
  expect(m, `an element with id="${id}" rendered`).toBeTruthy()
  return m![1]
}

/** The band's own class name (the first token of its class attribute). */
function bandClass(html: string): string {
  return classAttr(html, 'band').split(' ')[0]
}

/** Render a one-band document and return its html, css, js and overlay decls. */
function band(axes: L1SurfaceAxes) {
  const r = renderL1Document(docWithBand(axes))
  const cls = bandClass(r.html)
  return {
    ...r,
    cls,
    classes: classAttr(r.html, 'band').split(' '),
    self: declsOf(r.css, `.${cls}`),
    overlay: declsOf(r.css, `html[data-l1-pointer] .${cls}::after`),
  }
}

/**
 * Every lobe's outer radius in a region stack, in layer order.
 *
 * A bump's stop is `transparent calc(var(--l1-ptNs, 1) * 34.9px)` — the resting
 * length wrapped in the script's flicker scale — while the core's is a plain
 * `transparent 42px`. Both forms are read at their resting length.
 */
function lobeRadii(css: string): number[] {
  // `[^)]*` would stop at the `)` closing the `var()` INSIDE the calc, so the
  // multiplier is skipped with a lazy `.*?` up to the `*` instead.
  return [...css.matchAll(/transparent (?:calc\(.*?\*\s*)?([\d.]+)px/g)].map((m) => Number(m[1]))
}

/** Split a comma-separated CSS list, respecting `fn(a, b)` nesting. */
function commaList(value: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      out.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

describe('REQ-108 — a texture responds to the pointer', () => {
  /**
   * AC1 — a pattern-drawn grid lights up in a second colour under the cursor, from
   * a typed axis, with no script and no selector in the document.
   */
  it('test_UAT_FC_REQ-108_pattern_grid_is_redrawn_in_the_accent_colour_under_the_pointer', () => {
    // The axis is admitted by the shared surface group, so it lands on the same
    // kind that paints the texture it accents.
    const parsed = l1ContainerSchema.safeParse({
      kind: 'container',
      layout: 'stack',
      children: [],
      axes: { pattern: GRID, pointerAccent: ACCENT },
    })
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)

    const b = band({ surfaceFill: '#F5F4EC', pattern: GRID, pointerAccent: ACCENT })

    // The accent is the SAME texture, one colour substituted — a grid is two
    // gradients (one per axis) at the pattern's own tile, exactly as REQ-103 draws
    // it. So it cannot drift from the design it accents.
    const image = decl(b.overlay, 'background-image')
    expect(image).toBeTruthy()
    expect(commaList(image!)).toHaveLength(2)
    expect(image).toContain(TEAL)
    expect(image).not.toContain(GRID.color)
    expect(decl(b.overlay, 'background-size')).toBe('48px 48px, 48px 48px')

    // The base band still paints its own brown grid, untouched.
    expect(decl(b.self, 'background-image')).toContain(GRID.color)
    expect(decl(b.self, 'background-image')).not.toContain(TEAL)

    // The accent is confined to a region that tracks the cursor: a mask built from
    // radial lobes positioned by custom properties the script writes.
    const mask = decl(b.overlay, 'mask-image')
    expect(mask).toBeTruthy()
    expect(mask).toContain('--l1-pt0x')
    expect(mask).toContain('--l1-pt0y')
    // Both the standard and the -webkit- longhand, so the region exists in every
    // browser the substrate claims (the prefixed form is not optional on older Safari).
    expect(decl(b.overlay, '-webkit-mask-image')).toBe(mask)

    // The region reaches no further than the radius the author asked for. A bump's
    // outer stop carries the script's flicker scale, the core's is a plain length.
    const radii = lobeRadii(mask!)
    expect(radii.length).toBeGreaterThan(1)
    for (const r of radii) expect(r).toBeLessThanOrEqual(ACCENT.radiusPx)

    // Decoration, not furniture: it cannot eat a click, and it sits BELOW the
    // band's content so an accent line never lands on a headline — which only
    // holds because the band is its own stacking context.
    expect(b.overlay).toContain('pointer-events: none')
    expect(b.overlay).toContain('z-index: -1')
    expect(declsOf(b.css, `html[data-l1-pointer] .${b.cls}`)).toContain('isolation: isolate')
    // And the node itself carries NOTHING extra — a stacking context changes how the
    // band rasterises, so it may not exist before a pointer does (see AC3).
    expect(b.self).not.toContain('isolation: isolate')

    // Nothing in the document named the mechanism.
    const authored = JSON.stringify(docWithBand({ pattern: GRID, pointerAccent: ACCENT }))
    expect(authored).not.toContain('::after')
    expect(authored).not.toContain('mask')
    expect(authored).not.toContain('script')
  })

  /**
   * AC2 — the hero case. Its grid is a perspective SVG, not an orthogonal tile, so
   * the accent cannot be a re-emitted `pattern`: the asset carries only alpha the
   * renderer cannot recolour, so it becomes the MASK and the region becomes the
   * PAINT — the opposite arrangement to the pattern branch, and the one that lets a
   * faint texture gain enough weight for the accent to be visible at all.
   */
  it('test_UAT_FC_REQ-108_asset_drawn_grid_is_recoloured_by_masking_with_the_asset', () => {
    const src = '/assets/xgd-grid-hero.svg?v=3'
    const b = band({ backgroundImageUrl: src, pointerAccent: ACCENT })

    // Paint is the REGION in the accent colour — not a flat fill, which under an
    // asset mask would recolour the whole grid instead of the part under the cursor.
    expect(decl(b.overlay, 'background-color')).toBeUndefined()
    const paint = commaList(decl(b.overlay, 'background-image')!)
    expect(paint.length).toBeGreaterThan(4)
    for (const layer of paint) {
      expect(layer).toContain('radial-gradient')
      expect(layer).toContain(TEAL)
      expect(layer).toContain('--l1-pt')
    }

    // The mask is the asset, repeated — a mask reads a texture's ALPHA, so one pass
    // of a grid stroked at 0.24 caps the accent at 0.24 and measures ~25 levels off
    // the cream it sits on: real, and invisible. The copies ADD.
    const mask = commaList(decl(b.overlay, 'mask-image')!)
    expect(mask.length).toBeGreaterThan(1)
    for (const layer of mask) expect(layer).toBe(`url("${src}")`)

    // The asset mask restates the base layer's geometry EXACTLY, or the teal
    // strokes would slide off the brown ones at every viewport but one.
    expect(decl(b.self, 'background-size')).toBe('cover')
    expect(new Set(commaList(decl(b.overlay, 'mask-size')!))).toEqual(new Set(['cover']))
    expect(new Set(commaList(decl(b.overlay, 'mask-position')!))).toEqual(new Set(['center']))
    expect(new Set(commaList(decl(b.overlay, 'mask-repeat')!))).toEqual(new Set(['no-repeat']))
    expect(decl(b.overlay, '-webkit-mask-image')).toBe(decl(b.overlay, 'mask-image'))

    // BOTH branches are union-only stacks, so neither needs `mask-composite` — the
    // default IS union. Emitting it would mean shipping `intersect` (Chrome 120+,
    // Safari 15.4+) and WebKit's separate legacy keyword set for no gain.
    expect(decl(b.overlay, 'mask-composite')).toBeUndefined()
    expect(decl(b.overlay, '-webkit-mask-composite')).toBeUndefined()
    const p = band({ pattern: GRID, pointerAccent: ACCENT })
    expect(decl(p.overlay, 'mask-composite')).toBeUndefined()

    // The two branches take OPPOSITE sides: pattern paints and the region masks;
    // an asset masks and the region paints.
    expect(decl(p.overlay, 'background-image')).not.toContain('--l1-pt')
    expect(decl(p.overlay, 'mask-image')).toContain('--l1-pt')
  })

  /**
   * AC3 — it fails VISIBLE and it fails STILL. Nothing about the accent can cost a
   * reader the page: with no script, no fine pointer, or a reduced-motion
   * preference, the marker is absent and the band paints exactly what an unaccented
   * band paints. This is also what keeps the capture honest — a headless render
   * never moves a pointer, so the captured page is the plain page.
   */
  it('test_UAT_FC_REQ-108_a_page_with_no_pointer_paints_exactly_the_unaccented_page', () => {
    const plain = renderL1Document(docWithBand({ surfaceFill: '#F5F4EC', pattern: GRID }))
    const accented = renderL1Document(
      docWithBand({ surfaceFill: '#F5F4EC', pattern: GRID, pointerAccent: ACCENT }),
    )

    // EVERY rule the accent adds is behind the marker — no exceptions, including the
    // ones that paint nothing. `isolation: isolate` is the case in point: it makes
    // the band a stacking context, which is the kind of thing that can change how it
    // rasterises, so it waits for the pointer too. That leaves this assertion with
    // no whitelist to drift, which is the real reason it is worth doing.
    const added = accented.css
      .split('\n')
      .filter((line) => !plain.css.includes(line.trim()) && line.trim())
    expect(added.length).toBeGreaterThan(0)
    for (const line of added) {
      const isMarked = line.includes('html[data-l1-pointer]')
      const isMediaFrame = /^\s*[@}]/.test(line) || line.trim() === '}'
      expect(isMarked || isMediaFrame, `unmarked rule: ${line}`).toBe(true)
    }

    // The overlay starts fully transparent and is turned on by an inherited custom
    // property, so even WITH the marker set, nothing paints until a pointer moves.
    const b = band({ surfaceFill: '#F5F4EC', pattern: GRID, pointerAccent: ACCENT })
    expect(decl(b.overlay, 'opacity')).toBe('var(--l1-pto, 0)')

    // The script sets the marker only after a real pointer has moved, and guards
    // on a fine hovering pointer and on reduced motion BEFORE it — the order is
    // what makes the guards meaningful.
    const marker = L1_POINTER_SCRIPT.indexOf('setAttribute')
    expect(marker).toBeGreaterThan(0)
    for (const guard of ['prefers-reduced-motion: reduce', '(hover: hover) and (pointer: fine)']) {
      expect(L1_POINTER_SCRIPT).toContain(guard)
      expect(L1_POINTER_SCRIPT.indexOf(guard)).toBeLessThan(marker)
    }
    // The marker is set INSIDE the move handler, so a page nobody has moved a
    // pointer over — every capture, every crawler — never gets it at all.
    expect(L1_POINTER_SCRIPT.indexOf('function move(')).toBeLessThan(marker)
    // A finger has no cursor to follow, so a touch pointer is declined outright.
    expect(L1_POINTER_SCRIPT).toContain("e.pointerType!=='mouse'")

    // Belt and braces on the same obligation: even if some other path set the
    // marker, a reduced-motion reader gets no tracking region.
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(
      accented.css,
    )?.[1]
    expect(reduced).toContain(`html[data-l1-pointer] .${bandClass(accented.html)}::after`)
    expect(reduced).toContain('display: none')
  })

  /**
   * AC4 — the script is a renderer-owned constant: byte-identical between sites,
   * carrying no value from any instance, and absent from a page that accents
   * nothing. It supplies lagging cursor trackers and nothing else — every number
   * describing the region lives in the CSS.
   */
  it('test_UAT_FC_REQ-108_the_pointer_script_is_renderer_owned_not_per_site', () => {
    const a = renderL1Document(docWithBand({ pattern: GRID, pointerAccent: ACCENT }))
    const b = renderL1Document(
      docWithBand({
        pattern: { ...GRID, spacingPx: 31, color: '#123456' },
        pointerAccent: { color: '#654321', radiusPx: 140, roughness: 1, softnessPx: 12 },
      }),
    )
    expect(a.js).toBe(L1_POINTER_SCRIPT)
    expect(b.js).toBe(L1_POINTER_SCRIPT)

    // No instance value reaches the script — not a colour, not a radius, not a
    // spacing. It cannot know how big the region is or what colour it paints.
    for (const instanceValue of ['2e86a3', '654321', '123456', '90', '140', '31', '12']) {
      expect(L1_POINTER_SCRIPT).not.toContain(instanceValue)
    }
    // Exactly one listener set, and the marker set once.
    expect(L1_POINTER_SCRIPT.match(/addEventListener\('pointermove'/g)).toHaveLength(1)
    expect(L1_POINTER_SCRIPT.match(/setAttribute\('data-l1-pointer'/g)).toHaveLength(1)
    // Reads before writes within a frame — a tracking loop that interleaved
    // getBoundingClientRect with setProperty would thrash layout every frame.
    expect(L1_POINTER_SCRIPT.indexOf('getBoundingClientRect')).toBeLessThan(
      L1_POINTER_SCRIPT.indexOf('setProperty(\'--l1-pt'),
    )
    // And the loop stops when the trackers arrive, so a STILL pointer costs no
    // frames at all — the "stable while the mouse is still" requirement met by not
    // running rather than by damping.
    expect(L1_POINTER_SCRIPT).toContain('if(busy)raf=requestAnimationFrame(frame)')

    // A page that accents nothing ships no script and no marker class.
    const none = renderL1Document(docWithBand({ pattern: GRID }))
    expect(none.js).toBeUndefined()
    expect(none.html).not.toContain('<script>')
    expect(none.html).not.toContain('l1-pt')

    // An accenting page carries the script once, at the top of the body.
    expect(a.html.match(/<script>/g)).toHaveLength(1)
    expect(a.html.startsWith('<script>')).toBe(true)
    // The node carries the listener's handle as a second class it did not author.
    expect(classAttr(a.html, 'band').split(' ')).toContain('l1-pt')
  })

  /**
   * AC5 — where the randomness lives. The *resting* outline is deterministic (so a
   * still pointer sits in the same region every time and two renders are
   * byte-identical), while the *flicker* is genuinely random and belongs to the
   * script. And the resting outline must not read as a circle: a union of
   * near-concentric discs is one however its radii are varied, so the shape is a
   * small core plus bumps pushed out to it.
   */
  it('test_UAT_FC_REQ-108_the_resting_shape_is_deterministic_and_the_flicker_is_random', () => {
    const lobesOf = (css: string, cls: string) => {
      const mask = decl(declsOf(css, `html[data-l1-pointer] .${cls}::after`), 'mask-image')!
      return commaList(mask).map((l) => ({
        // The lobe's own reach, how far its centre is offset from the cursor, and
        // whether the script's flicker scales it.
        radius: lobeRadii(l)[0],
        offsets: [...l.matchAll(/[-+] ([\d.]+)px/g)].map((m) => Number(m[1])),
        flickers: l.includes('s, 1)'),
      }))
    }

    // Two renders of the same axis are byte-identical: the RENDERER rolls no dice,
    // so a captured page reproduces and the round-trip gate stays meaningful.
    const one = renderL1Document(docWithBand({ pattern: GRID, pointerAccent: ACCENT }))
    const two = renderL1Document(docWithBand({ pattern: GRID, pointerAccent: ACCENT }))
    expect(one.css).toBe(two.css)
    expect(one.css).not.toContain('NaN')

    const rough = lobesOf(one.css, bandClass(one.html))
    expect(rough.length).toBeGreaterThan(4)

    // Exactly one core — centred, unscaled, and the thing the outline falls back to
    // between bumps. Everything else is a bump: offset from the cursor and flickering.
    const cores = rough.filter((l) => !l.flickers)
    const bumps = rough.filter((l) => l.flickers)
    expect(cores).toHaveLength(1)
    expect(cores[0].offsets).toEqual([])
    expect(bumps.length).toBeGreaterThan(4)
    for (const b of bumps) expect(b.offsets.length).toBeGreaterThan(0)

    // NOT A CIRCLE. Every bump reaches PAST the core, so the boundary alternates
    // between bump reach and core radius rather than tracing one arc; and the
    // bumps' own reaches differ, so no two bulges are the same size. A union of
    // near-concentric discs — the first two cuts — fails this by construction.
    const core = cores[0].radius
    const reaches = bumps.map((b) => Math.hypot(b.offsets[0] ?? 0, b.offsets[1] ?? 0) + b.radius)
    for (const reach of reaches) {
      expect(reach).toBeGreaterThan(core)
      expect(reach).toBeLessThanOrEqual(ACCENT.radiusPx + 0.001)
    }
    expect(new Set(bumps.map((b) => b.radius)).size).toBeGreaterThan(1)
    // The bays DEEPEN with roughness — which is the dial doing what it says, and
    // the property the "too much like a circle" cut failed. Asserted as a trend
    // rather than one threshold, so it cannot be satisfied by a lucky constant.
    const bayRatio = (roughness: number) => {
      const r = renderL1Document(
        docWithBand({ pattern: GRID, pointerAccent: { ...ACCENT, roughness } }),
      )
      const ls = lobesOf(r.css, bandClass(r.html))
      const c = ls.find((l) => !l.flickers)!.radius
      const reach = ls
        .filter((l) => l.flickers)
        .map((l) => Math.hypot(l.offsets[0] ?? 0, l.offsets[1] ?? 0) + l.radius)
      return c / Math.max(...reach)
    }
    expect(bayRatio(1)).toBeLessThan(bayRatio(0.65))
    expect(bayRatio(0.65)).toBeLessThan(bayRatio(0.3))
    // At the roughness the site actually uses, the outline falls back to ~70% of
    // its reach between bumps — deep enough that no arc dominates the silhouette.
    expect(bayRatio(0.65)).toBeLessThan(0.75)
    // Every bump still overlaps the core, so no bulge floats free of the region.
    for (const b of bumps) {
      expect(Math.hypot(b.offsets[0] ?? 0, b.offsets[1] ?? 0) - b.radius).toBeLessThan(core)
    }

    // The flicker is the script's, and it is random, speed-scaled, and snaps to rest.
    expect(L1_POINTER_SCRIPT).toContain('Math.random()')
    expect(L1_POINTER_SCRIPT).toMatch(/sc\[i\]\+=\(tg-sc\[i\]\)/)
    expect(L1_POINTER_SCRIPT).toContain('if(amp===0&&Math.abs(sc[i]-1)<0.004)sc[i]=1')

    // `roughness: 0` collapses the core, the offsets and the variation together,
    // leaving concentric circles of exactly `radiusPx` — a neat circle, as documented.
    const neat = renderL1Document(
      docWithBand({ pattern: GRID, pointerAccent: { ...ACCENT, roughness: 0 } }),
    )
    const disc = lobesOf(neat.css, bandClass(neat.html))
    for (const l of disc) {
      const d = Math.hypot(l.offsets[0] ?? 0, l.offsets[1] ?? 0)
      // Emitted lengths are rounded to 4dp, so exact equality is not the claim —
      // "every lobe's edge lands on the same circle, to well under a pixel" is.
      expect(Math.abs(d + l.radius - ACCENT.radiusPx)).toBeLessThan(0.01)
    }

    // `softnessPx` is the feather: the mask is opaque up to `radius - softness`.
    const hard = renderL1Document(
      docWithBand({ pattern: GRID, pointerAccent: { ...ACCENT, roughness: 0, softnessPx: 0 } }),
    )
    const soft = renderL1Document(
      docWithBand({ pattern: GRID, pointerAccent: { ...ACCENT, roughness: 0, softnessPx: 30 } }),
    )
    // The core lobe's opaque stop, which at `roughness: 0` is the whole disc.
    const opaqueTo = (css: string, html: string) =>
      Number(
        /#000 ([\d.]+)px/.exec(
          decl(declsOf(css, `html[data-l1-pointer] .${bandClass(html)}::after`), 'mask-image')!,
        )![1],
      )
    expect(opaqueTo(hard.css, hard.html)).toBe(ACCENT.radiusPx)
    expect(opaqueTo(soft.css, soft.html)).toBe(ACCENT.radiusPx - 30)
  })

  /**
   * AC6 — the axis accents *a texture*. On a node that paints none there is nothing
   * to redraw, so the honest emission is silence — not a bloom of flat colour
   * following the mouse, and not a stacking context and a listener handle bought
   * for an overlay that paints nothing.
   */
  it('test_UAT_FC_REQ-108_a_node_with_no_texture_emits_no_overlay', () => {
    const b = band({ surfaceFill: '#F5F4EC', pointerAccent: ACCENT })
    expect(b.overlay).toEqual([])
    expect(b.css).not.toContain('isolation')
    expect(b.classes).not.toContain('l1-pt')
    expect(b.js).toBeUndefined()
  })

  /**
   * AC7 — the envelope. The schema pins the axis's shape and its hex colour; the
   * envelope pins how large a number a document may hold. A sub-pixel region is a
   * repaint per frame that paints nothing; a full-bleed one is a different design
   * and a compositor cost the author did not choose.
   */
  it('test_UAT_FC_REQ-108_the_envelope_bounds_the_accent_and_the_colour_is_hex_only', () => {
    // Colour is hex only — no `url()`, no keyword, no variable.
    for (const color of ['teal', 'var(--brand)', 'url(x.svg)', 'rgb(0 0 0)', '#gggggg']) {
      expect(l1PointerAccentSchema.safeParse({ color, radiusPx: 90 }).success).toBe(false)
    }
    // Freeform additions are rejected outright, so no mechanism can be smuggled in.
    expect(
      l1PointerAccentSchema.safeParse({ color: TEAL, radiusPx: 90, maskImage: 'url(x)' }).success,
    ).toBe(false)
    // Roughness is a 0..1 dial; a lobe count is not an author's to name.
    expect(l1PointerAccentSchema.safeParse({ color: TEAL, radiusPx: 90, roughness: 2 }).success).toBe(
      false,
    )
    expect(l1PointerAccentSchema.safeParse({ color: TEAL, radiusPx: 90, lobes: 40 }).success).toBe(
      false,
    )
    // A non-finite length never reaches a declaration.
    expect(l1PointerAccentSchema.safeParse({ color: TEAL, radiusPx: Number.NaN }).success).toBe(false)

    // The reach is bounded by the envelope, above and below.
    const { min, max } = L1_ENVELOPE.pointerAccentRadiusPx
    const at = (radiusPx: number) =>
      validateL1(docWithBand({ pattern: GRID, pointerAccent: { color: TEAL, radiusPx } }))
    for (const outside of [min - 1, max + 1]) {
      const r = at(outside)
      expect(r.ok).toBe(false)
      expect(
        !r.ok && r.errors.some((e) => e.path.endsWith('/pointerAccent/radiusPx')),
        `radiusPx=${outside} rejected by the envelope`,
      ).toBe(true)
    }
    expect(at(ACCENT.radiusPx).ok).toBe(true)
  })

  /**
   * AC8 — a document that declares no accent renders byte-identically to one from
   * before the axis existed. The capability is additive; it changes no page that
   * did not ask for it.
   */
  it('test_UAT_FC_REQ-108_a_document_with_no_accent_renders_exactly_as_before', () => {
    const textured = docWithBand({ surfaceFill: '#F5F4EC', pattern: GRID })
    const { css, html, js } = renderL1Document(textured)
    expect(css).not.toContain('data-l1-pointer')
    expect(css).not.toContain('mask-image')
    expect(css).not.toContain('isolation')
    expect(html).not.toContain('l1-pt')
    expect(js).toBeUndefined()
    // The document reset is the ONLY `::after` in a stylesheet with no accent — no
    // pseudo-element rule is bought by the axis merely existing.
    expect(css.match(/::after/g)).toHaveLength(1)

    // And the axis is genuinely optional on every kind that carries a surface.
    const surfaces: L1Node[] = [
      { kind: 'box', axes: { pattern: GRID } } as L1Node,
      { kind: 'container', layout: 'stack', children: [], axes: { pattern: GRID } } as L1Node,
    ]
    for (const node of surfaces) {
      expect(validateL1({ widths: WIDTHS, root: node }).ok).toBe(true)
    }
  })
})
