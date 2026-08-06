/**
 * Reconciliation UATs — story-d2b5cb1c, the POINTER ACCENT axis.
 *
 *   AC-879  a node's own texture, redrawn in the accent colour inside a region
 *           centred on the cursor — derived from the same declaration, so it
 *           can never drift from the design it accents
 *   AC-880  both texture kinds (typed pattern and background asset), with a
 *           faint asset still lighting to full accent weight
 *   AC-881  a fully transparent texture paints nothing at rest and exists only
 *           under the cursor
 *   AC-882  a node with no texture emits nothing — no accent, no handle, no script
 *   AC-883  the accent fails visible: five ways for it not to run, and EVERY
 *           declaration the axis adds waits behind the same marker
 *   AC-884  two renders are byte-identical; the driver is fixed, site-independent,
 *           one per page, and absent from a page that declares no accent
 *   AC-885  the region is deterministically rough, bounded by the declared reach,
 *           a plain circle at roughness 0, feathered over the declared softness
 *   AC-886  stable while the pointer is still (costing no frames), deforming
 *           while it moves, and returning after the reader leaves and comes back
 *   AC-887  typed values only — out-of-range reach/softness/roughness, a non-hex
 *           colour, a non-finite length and any unknown key are refused by path
 *
 * The story's sibling axes (interaction state, entrance motion — AC-819..828)
 * are covered by `reconciliation-l1-interaction-and-motion.test.ts`; this file is
 * the third axis only.
 *
 * Every probe is engine-free. The schema, the envelope and the emitter are pure
 * functions, so most ACs are answered by validating and rendering. The three that
 * must observe the *page* (AC-879's tracking, AC-883's five failure modes,
 * AC-886's stillness and recovery) run the renderer's real script in JSDOM with
 * only the browser stubbed — `PointerEvent` (JSDOM ships none), `matchMedia` (its
 * own always answers `false`, which would make a media guard untestable) and
 * `requestAnimationFrame` (so frames are counted and stepped rather than raced).
 * Nothing this project owns is mocked.
 */
import { describe, expect, it } from 'vitest'
import {
  L1_ENVELOPE,
  l1PointerAccentSchema,
  validateL1,
  type L1Document,
  type L1SurfaceAxes,
} from '../packages/site-schema/src/index'
import { L1_POINTER_SCRIPT, renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

/** The brown hairline grid the accented bands actually paint. */
const GRID = { shape: 'grid', spacingPx: 48, thicknessPx: 1, color: '#8b5c2a1a' } as const
/** Teal-petrol — the accent colour, and a value no driver may ever learn. */
const TEAL = '#2e86a3'
const ACCENT = { color: TEAL, radiusPx: 90 } as const
/** The hero's perspective grid: an asset, because no orthogonal tile expresses it. */
const HERO_ASSET = '/assets/xgd-grid-hero.svg?v=3'

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

// ── Reading the emitted stylesheet ───────────────────────────────────────────

/** The declarations of one selector's rule (outside any media query). */
function declsOf(css: string, selector: string): string[] {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(css)
  return m
    ? m[1]
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
    : []
}

/** One declaration by property name, or undefined. */
function decl(list: string[], prop: string): string | undefined {
  return list.find((d) => d.startsWith(`${prop}:`))?.slice(prop.length + 1).trim()
}

/** The class attribute of the rendered element carrying `id`. */
function classAttr(html: string, id: string): string {
  const m = new RegExp(`<\\w+ class="([^"]+)" id="${id}"`).exec(html)
  expect(m, `an element with id="${id}" rendered`).toBeTruthy()
  return m![1]
}

/** The band's own class name (the first token of its class attribute). */
function bandClass(html: string): string {
  return classAttr(html, 'band').split(' ')[0]
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

/** Render a one-band document and return its parts plus the band's two rules. */
function band(axes: L1SurfaceAxes) {
  const r = renderL1Document(docWithBand(axes))
  const cls = bandClass(r.html)
  return {
    ...r,
    cls,
    classes: classAttr(r.html, 'band').split(' '),
    /** The band's own settled rule. */
    self: declsOf(r.css, `.${cls}`),
    /** The accent overlay, which exists only behind the pointer marker. */
    overlay: declsOf(r.css, `html[data-l1-pointer] .${cls}::after`),
  }
}

/** One lobe of the region, read back off the emitted gradient layer. */
interface Lobe {
  /** Which of the script's lagging trackers carries it. */
  tracker: number
  /** Its centre, as a signed offset from that tracker's point. */
  dx: number
  dy: number
  /** Where the lobe stops being fully opaque, and where it fades out entirely. */
  inner: number
  radius: number
  /** Whether the script's per-lobe jitter scales it (the core never flickers). */
  flickers: boolean
}

/** One `radial-gradient(...)` layer → the lobe it describes. */
function parseLobe(layer: string): Lobe {
  const axis = (a: 'x' | 'y'): { tracker: number; offset: number } => {
    const m = new RegExp(`--l1-pt(\\d+)${a}, -9999px\\)(?: ([-+]) ([\\d.]+)px)?`).exec(layer)
    expect(m, `layer names a ${a} tracker: ${layer}`).toBeTruthy()
    const magnitude = m![3] === undefined ? 0 : Number(m![3])
    return { tracker: Number(m![1]), offset: m![2] === '-' ? -magnitude : magnitude }
  }
  const stop = (prefix: string): number => {
    const m = new RegExp(`${prefix} (?:calc\\(var\\(--l1-pt\\d+s, 1\\) \\* )?([\\d.]+)px`).exec(layer)
    expect(m, `layer carries a ${prefix} stop: ${layer}`).toBeTruthy()
    return Number(m![1])
  }
  const x = axis('x')
  const y = axis('y')
  expect(x.tracker, 'both coordinates ride the same tracker').toBe(y.tracker)
  return {
    tracker: x.tracker,
    dx: x.offset,
    dy: y.offset,
    inner: stop('#[0-9a-fA-F]{3,8}'),
    radius: stop('transparent'),
    flickers: layer.includes('s, 1) *'),
  }
}

/** Every lobe of a *pattern*-branch region, which lives in the mask stack. */
function maskLobes(css: string, cls: string): Lobe[] {
  const mask = decl(declsOf(css, `html[data-l1-pointer] .${cls}::after`), 'mask-image')
  expect(mask, 'the pattern branch masks with the region').toBeTruthy()
  return commaList(mask!).map(parseLobe)
}

/** A lobe's outermost reach from the cursor: how far its rim sits from the hand. */
const reachOf = (l: Lobe): number => Math.hypot(l.dx, l.dy) + l.radius
/** How deep the bays run: the distance from the rim back to the core, inward. */
const gapOf = (l: Lobe): number => Math.hypot(l.dx, l.dy) - l.radius

// ── Running the renderer's real script in a modelled browser ─────────────────

interface DriveOptions {
  /** Whether the reader's device is a fine hovering pointer (a mouse). */
  finePointer?: boolean
  /** Whether the reader has asked for reduced motion. */
  reducedMotion?: boolean
  /** Make the media query throw, standing in for a script that errors on setup. */
  throwOnSetup?: boolean
  /** Withhold `PointerEvent`, standing in for a user agent that has none. */
  noPointerEvents?: boolean
  /** Do not execute the page's scripts at all. */
  noScripting?: boolean
}

/** A live page running the renderer's own pointer driver, stepped frame by frame. */
async function drive(html: string, opts: DriveOptions = {}) {
  const { JSDOM } = await import('jsdom')
  const pending: Array<{ id: number; cb: () => void }> = []
  let nextId = 1
  let scheduled = 0

  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    ...(opts.noScripting ? {} : { runScripts: 'dangerously' as const }),
    beforeParse(win) {
      const w = win as unknown as Record<string, unknown>
      // JSDOM ships no PointerEvent, so the driver's own capability guard would
      // decline before any other behaviour could be observed. Supplying it is
      // stubbing the *browser*; the driver is the real one throughout.
      if (!opts.noPointerEvents) w.PointerEvent = win.Event
      w.matchMedia = (q: string) => {
        if (opts.throwOnSetup) throw new Error('matchMedia unavailable')
        return {
          matches: q.includes('reduced-motion')
            ? (opts.reducedMotion ?? false)
            : (opts.finePointer ?? true),
        }
      }
      w.requestAnimationFrame = (cb: () => void) => {
        scheduled += 1
        const id = nextId++
        pending.push({ id, cb })
        return id
      }
      w.cancelAnimationFrame = (id: number) => {
        const i = pending.findIndex((f) => f.id === id)
        if (i >= 0) pending.splice(i, 1)
      }
    },
  })

  const document = dom.window.document
  const fire = (type: string, extra: Record<string, unknown> = {}, onWindow = false): void => {
    const ev = new dom.window.Event(type) as unknown as Record<string, unknown>
    Object.assign(ev, extra)
    ;(onWindow ? dom.window : document).dispatchEvent(ev as unknown as Event)
  }

  return {
    dom,
    document,
    /** The band under test, as the driver's own handle class finds it. */
    handles: () => [...document.querySelectorAll('.l1-pt')],
    /** Has the driver armed the marker the whole stylesheet is gated on? */
    armed: () => document.documentElement.hasAttribute('data-l1-pointer'),
    /** The inherited visibility the overlay's `opacity` reads. */
    visibility: () => document.documentElement.style.getPropertyValue('--l1-pto'),
    /** How many animation frames the page has scheduled since it loaded. */
    scheduled: () => scheduled,
    move: (x: number, y: number, pointerType = 'mouse') =>
      fire('pointermove', { clientX: x, clientY: y, pointerType }),
    leave: () => fire('pointerleave'),
    blur: () => fire('blur', {}, true),
    /** Run every frame the page has already scheduled, once. */
    step: (): number => {
      const now = pending.splice(0, pending.length)
      for (const f of now) f.cb()
      return now.length
    },
    /** Run frames until the page stops scheduling them. Returns the count run. */
    settle: (): number => {
      let ran = 0
      for (let guard = 0; guard < 2000 && pending.length; guard++) {
        const f = pending.shift()!
        f.cb()
        ran += 1
      }
      expect(pending, 'the driver stops scheduling frames').toHaveLength(0)
      return ran
    },
    /** Every tracker point and jitter scale the driver has written on a node. */
    trackers: (el: Element): { x: number; y: number; scale: number }[] => {
      const style = (el as unknown as { style: CSSStyleDeclaration }).style
      const out: { x: number; y: number; scale: number }[] = []
      for (let i = 0; ; i++) {
        const x = style.getPropertyValue(`--l1-pt${i}x`)
        if (!x) break
        out.push({
          x: Number.parseFloat(x),
          y: Number.parseFloat(style.getPropertyValue(`--l1-pt${i}y`)),
          scale: Number(style.getPropertyValue(`--l1-pt${i}s`)),
        })
      }
      return out
    },
    /** Everything the driver has written on a node, as one comparable string. */
    snapshot: (el: Element): string => el.getAttribute('style') ?? '',
    close: () => dom.window.close(),
  }
}

/** How far apart the lagging trackers have strung out — the region's deformation. */
function spread(points: { x: number; y: number }[]): number {
  let max = 0
  for (const a of points) for (const b of points) max = Math.max(max, Math.hypot(a.x - b.x, a.y - b.y))
  return max
}

describe('story-d2b5cb1c — the L1 pointer accent', () => {
  /**
   * AC-879 — the accent is the node's OWN texture with one value substituted,
   * inside a region that follows the cursor, painted above the node's background
   * and below its content, inert to the reader, and clipped by its corners.
   */
  it('test_UAT_AC879_accent_redraws_the_nodes_own_texture_under_the_cursor', async () => {
    const b = band({ surfaceFill: '#F5F4EC', pattern: GRID, pointerAccent: ACCENT })

    // The texture, presented a second time in the accent colour. A grid is two
    // gradients at the pattern's own tile — the SAME emitter as the base layer,
    // so there is no second geometry to keep in step.
    const accentImage = decl(b.overlay, 'background-image')
    expect(accentImage).toBeTruthy()
    expect(commaList(accentImage!)).toHaveLength(2)
    expect(accentImage).toContain(TEAL)
    expect(accentImage).not.toContain(GRID.color)
    // …and in its base colour elsewhere: the band's own rule is untouched.
    expect(decl(b.self, 'background-image')).toContain(GRID.color)
    expect(decl(b.self, 'background-image')).not.toContain(TEAL)
    // Identical tiling, base and accent.
    expect(decl(b.overlay, 'background-size')).toBe(decl(b.self, 'background-size'))

    // Bounded, and centred on the reader's cursor: every lobe of the region is
    // positioned by a tracker the driver writes, in both the standard and the
    // prefixed longhand so the region exists in every engine the substrate claims.
    const mask = decl(b.overlay, 'mask-image')!
    expect(mask).toContain('--l1-pt0x')
    expect(mask).toContain('--l1-pt0y')
    expect(decl(b.overlay, '-webkit-mask-image')).toBe(mask)
    for (const l of maskLobes(b.css, b.cls)) expect(reachOf(l)).toBeLessThanOrEqual(ACCENT.radiusPx)

    // Decoration, never furniture: above the node's own background, below its
    // content, taking no click, hover or selection, and clipped by the node's
    // corner rounding. The negative-z ordering is only reliable inside a stacking
    // context, which is why the node also takes `isolation` — behind the marker.
    expect(b.overlay).toContain('z-index: -1')
    expect(b.overlay).toContain('pointer-events: none')
    expect(b.overlay).toContain('border-radius: inherit')
    expect(declsOf(b.css, `html[data-l1-pointer] .${b.cls}`)).toContain('isolation: isolate')

    // NOT A SECOND DESIGN. Change the texture's spacing and thickness and the
    // accented copy changes identically — because it is the same declaration.
    const wider = band({
      surfaceFill: '#F5F4EC',
      pattern: { ...GRID, spacingPx: 96, thicknessPx: 3 },
      pointerAccent: ACCENT,
    })
    expect(decl(wider.overlay, 'background-size')).toBe(decl(wider.self, 'background-size'))
    expect(decl(wider.overlay, 'background-size')).not.toBe(decl(b.overlay, 'background-size'))
    // The accent's geometry moved with the base's, and by the same amount: the
    // two stacks differ in nothing but the colour substituted into them.
    expect(decl(wider.overlay, 'background-image')!.split(TEAL).length).toBe(
      decl(wider.self, 'background-image')!.split(GRID.color).length,
    )
    expect(decl(wider.overlay, 'background-image')!.replaceAll(TEAL, GRID.color)).toBe(
      decl(wider.self, 'background-image'),
    )

    // No site definition can name the overlay, the region or how they composite.
    for (const smuggled of [
      { selector: '::after' },
      { pseudoElement: 'after' },
      { maskComposite: 'intersect' },
      { mixBlendMode: 'screen' },
      { overlay: 'radial-gradient(#fff, #000)' },
    ]) {
      const parsed = l1PointerAccentSchema.safeParse({ ...ACCENT, ...smuggled })
      expect(parsed.success, JSON.stringify(smuggled)).toBe(false)
    }

    // ── The region follows the pointer across the node ───────────────────────
    const page = await drive(b.html)
    page.move(100, 60)
    page.settle()
    const [node] = page.handles()
    expect(node, 'the accented node carries the driver handle').toBeTruthy()
    const first = page.trackers(node)
    expect(first).toHaveLength(maskLobes(b.css, b.cls).filter((l) => l.flickers).length)
    for (const t of first) expect([t.x, t.y]).toEqual([100, 60])

    page.move(400, 220)
    page.settle()
    const second = page.trackers(node)
    for (const t of second) expect(Math.hypot(t.x - 400, t.y - 220)).toBeLessThan(0.5)
    page.close()
  })

  /**
   * AC-880 — both kinds of texture a node can carry, and the weight problem an
   * asset brings with it. A mask reads a texture's ALPHA, so an accent drawn
   * through a grid stroked at 0.24 can never be heavier than 0.24 — real, and
   * invisible. The asset branch composites the mask with itself so the copies add.
   */
  it('test_UAT_AC880_accent_applies_to_both_a_typed_pattern_and_an_image_asset', () => {
    // ── The typed pattern: the texture paints, the region masks it ────────────
    const pattern = band({ surfaceFill: '#F5F4EC', pattern: GRID, pointerAccent: ACCENT })
    expect(decl(pattern.overlay, 'background-image')).toContain(TEAL)
    expect(decl(pattern.overlay, 'background-image')).not.toContain('--l1-pt')
    expect(decl(pattern.overlay, 'mask-image')).toContain('--l1-pt')

    // ── The asset: it carries only alpha, so it MASKS and the region PAINTS ───
    const asset = band({ backgroundImageUrl: HERO_ASSET, pointerAccent: ACCENT })
    // The accent lands on exactly the strokes the image draws, and nowhere else —
    // no flat fill, which under an asset mask would recolour the whole grid.
    expect(decl(asset.overlay, 'background-color')).toBeUndefined()
    for (const layer of commaList(decl(asset.overlay, 'background-image')!)) {
      expect(layer).toContain('radial-gradient')
      expect(layer).toContain(TEAL)
      expect(layer).toContain('--l1-pt')
    }
    // No second image and no colour baked into a file: the mask names the SAME
    // asset the base layer does, in the emitted document-relative form.
    const emitted = `url("${HERO_ASSET.slice(1)}")`
    const maskLayers = commaList(decl(asset.overlay, 'mask-image')!)
    for (const layer of maskLayers) expect(layer).toBe(emitted)
    expect(decl(asset.overlay, '-webkit-mask-image')).toBe(decl(asset.overlay, 'mask-image'))
    // Identical sizing and placement to the base image, so the accented marks sit
    // on the base ones at every viewport width rather than sliding off them.
    expect(decl(asset.self, 'background-size')).toBe('cover')
    expect(new Set(commaList(decl(asset.overlay, 'mask-size')!))).toEqual(new Set(['cover']))
    expect(new Set(commaList(decl(asset.overlay, 'mask-position')!))).toEqual(new Set(['center']))
    expect(new Set(commaList(decl(asset.overlay, 'mask-repeat')!))).toEqual(new Set(['no-repeat']))

    // ── A faint asset still lights to full accent weight ─────────────────────
    // The copies composite `source-over`, so n passes of an alpha `a` reach
    // `1-(1-a)^n`. One pass caps a 0.24 grid at 0.24 — a tinted line, measurably
    // present and visually absent.
    const passes = maskLayers.length
    expect(passes).toBeGreaterThan(1)
    const reached = (a: number) => 1 - (1 - a) ** passes
    const FAINT = 0.24
    expect(reached(FAINT)).toBeGreaterThan(0.6)
    // Clearly separated from where a single pass would have left it, rather than
    // capped by the asset's own faintness.
    expect(reached(FAINT) / FAINT).toBeGreaterThan(2.5)
    // An already-solid asset is left exactly where it was.
    expect(reached(1)).toBe(1)
    // …and how hard the accent asserts itself is not an author's to name.
    for (const key of ['passes', 'strength', 'intensity', 'opacity', 'alpha']) {
      expect(
        l1PointerAccentSchema.safeParse({ ...ACCENT, [key]: 4 }).success,
        `${key} is not author-facing`,
      ).toBe(false)
    }

    // ── Where a node carries both, the typed texture is the one accented ──────
    const both = band({ pattern: GRID, backgroundImageUrl: HERO_ASSET, pointerAccent: ACCENT })
    expect(decl(both.overlay, 'background-image')).toBe(decl(pattern.overlay, 'background-image'))
    expect(decl(both.overlay, 'mask-image')).toContain('--l1-pt')
    expect(decl(both.overlay, 'mask-image')).not.toContain('url(')
  })

  /**
   * AC-881 — a texture declared in a fully transparent colour paints nothing at
   * rest and is drawn only under the cursor. It falls out of the construction
   * (the accent substitutes the colour and keeps the geometry) rather than being
   * a special case, but a published page depends on it: a renderer that started
   * dropping zero-alpha pattern layers as an "optimisation" would silently delete
   * the effect from every band that runs on it.
   */
  it('test_UAT_AC881_a_transparent_texture_exists_only_under_the_pointer', () => {
    const INVISIBLE = { ...GRID, spacingPx: 32, color: '#8b5c2a00' } as const
    const FILL = '#F5F4EC'
    const b = band({ surfaceFill: FILL, pattern: INVISIBLE, pointerAccent: ACCENT })

    // At rest the node is a flat surface: it paints its fill, and every layer of
    // the texture over it is fully transparent — so no sample anywhere across the
    // node's area can differ from the fill.
    expect(decl(b.self, 'background-color')).toBe(FILL)
    const baseLayers = commaList(decl(b.self, 'background-image')!)
    expect(baseLayers.length).toBeGreaterThan(0)
    for (const layer of baseLayers) {
      const colours = [...layer.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0])
      expect(colours.length).toBeGreaterThan(0)
      for (const c of colours) expect(c, `${c} is fully transparent`).toMatch(/^#[0-9a-fA-F]{6}00$/)
    }

    // Under the pointer the same texture is drawn in a colour that DOES paint,
    // at the same geometry, inside a bounded region around the cursor.
    const accented = decl(b.overlay, 'background-image')!
    expect(accented).toContain(TEAL)
    expect(accented).not.toContain(INVISIBLE.color)
    expect(decl(b.overlay, 'background-size')).toBe(decl(b.self, 'background-size'))
    expect(decl(b.overlay, 'background-size')).toBe('32px 32px, 32px 32px')
    expect(decl(b.overlay, 'mask-image')).toContain('--l1-pt')
    expect(b.classes).toContain('l1-pt')
    for (const l of maskLobes(b.css, b.cls)) expect(reachOf(l)).toBeLessThanOrEqual(ACCENT.radiusPx)

    // With the accent removed the texture is genuinely invisible: the same page
    // presents nothing under a pointer either, because nothing redraws it.
    const plain = band({ surfaceFill: FILL, pattern: INVISIBLE })
    expect(plain.overlay).toEqual([])
    expect(plain.css).not.toContain('data-l1-pointer')
    expect(plain.js).toBeUndefined()
    // …and its base layers are the very ones the accented page paints at rest.
    expect(decl(plain.self, 'background-image')).toBe(decl(b.self, 'background-image'))
  })

  /**
   * AC-882 — the axis accents *a texture*. On a node that paints none there is
   * nothing to redraw, and a bloom of flat colour following the mouse would be a
   * different effect rather than a degraded one. Silence is the honest emission.
   */
  it('test_UAT_AC882_a_node_with_no_texture_emits_nothing_at_all', async () => {
    const declared = docWithBand({ surfaceFill: '#F5F4EC', borderRadiusPx: 8, pointerAccent: ACCENT })
    const removed = docWithBand({ surfaceFill: '#F5F4EC', borderRadiusPx: 8 })
    expect(validateL1(declared).ok).toBe(true)

    const withAccent = renderL1Document(declared)
    const without = renderL1Document(removed)

    // No accent presentation, no handle for the driver, and no driver.
    expect(declsOf(withAccent.css, `html[data-l1-pointer] .${bandClass(withAccent.html)}::after`))
      .toEqual([])
    expect(classAttr(withAccent.html, 'band').split(' ')).not.toContain('l1-pt')
    expect(withAccent.js).toBeUndefined()
    expect(withAccent.html).not.toContain('<script')
    expect(withAccent.css).not.toContain('data-l1-pointer')
    expect(withAccent.css).not.toContain('isolation')

    // The published page is byte-for-byte the page it would have been without
    // the declaration — in markup, in stylesheet and in script.
    expect(withAccent.html).toBe(without.html)
    expect(withAccent.css).toBe(without.css)
    expect(withAccent.js).toBe(without.js)

    // Driving a pointer over it changes nothing, because there is nothing to run.
    const page = await drive(withAccent.html)
    const before = page.document.body.innerHTML
    page.move(40, 40)
    page.move(120, 90)
    page.settle()
    expect(page.armed()).toBe(false)
    expect(page.handles()).toHaveLength(0)
    expect(page.scheduled()).toBe(0)
    expect(page.document.body.innerHTML).toBe(before)
    page.close()
  })

  /**
   * AC-883 — the accent fails visible, with no exception to carve out. EVERY
   * declaration the axis adds — including the stacking context the overlay needs —
   * waits behind a marker the driver sets only on a real pointer's first movement.
   * That is also what keeps the round trip honest: a headless capture never moves
   * a pointer, so the captured page is the unaccented page.
   */
  it('test_UAT_AC883_the_accent_waits_for_a_real_pointer_and_fails_visible', async () => {
    const axes: L1SurfaceAxes = { surfaceFill: '#F5F4EC', pattern: GRID, pointerAccent: ACCENT }
    const { pointerAccent: _dropped, ...unaccentedAxes } = axes
    const accented = renderL1Document(docWithBand(axes))
    const plain = renderL1Document(docWithBand(unaccentedAxes))
    const cls = bandClass(accented.html)

    // EVERY rule the axis adds is behind the marker — no whitelist, so nothing
    // can drift out of the invariant. `isolation: isolate` is the case in point:
    // it paints nothing, but a stacking context can change how a band rasterises,
    // so it waits for the pointer too.
    const added = accented.css
      .split('\n')
      .filter((line) => line.trim() && !plain.css.includes(line.trim()))
    expect(added.length).toBeGreaterThan(0)
    for (const line of added) {
      const gated = line.includes('html[data-l1-pointer]')
      const frame = /^\s*[@}]/.test(line) || line.trim() === '}'
      expect(gated || frame, `ungated rule: ${line}`).toBe(true)
    }
    // The driver's handle class is a JS handle and nothing else: it carries no
    // rule of its own, so the extra class on the element paints nothing either.
    expect(accented.css).not.toContain('.l1-pt')

    // More than one rule is gated — the overlay itself, the stacking context it
    // needs, and the reduced-motion override — so the invariant is total rather
    // than a statement about the one rule that paints.
    const gatedRules = [...accented.css.matchAll(/(html\[data-l1-pointer\][^\n{}]*?)\s*\{/g)].map(
      (m) => m[1],
    )
    expect(gatedRules.length).toBeGreaterThan(1)
    expect(gatedRules.some((s) => s.endsWith('::after'))).toBe(true)
    expect(gatedRules.some((s) => !s.endsWith('::after'))).toBe(true)
    /** The same selectors with the pseudo-element stripped, so they can be matched. */
    const gatedSelectors = [...new Set(gatedRules.map((s) => s.replace('::after', '')))]

    /** Evaluate the published page and assert the accent is presenting nothing. */
    const expectUnaccented = async (label: string, opts: DriveOptions, moves: boolean) => {
      const page = await drive(accented.html, opts)
      if (moves) {
        page.move(120, 80, opts.finePointer === false ? 'touch' : 'mouse')
        page.move(300, 200, opts.finePointer === false ? 'touch' : 'mouse')
        page.settle()
      }
      // The marker never arrives…
      expect(page.armed(), label).toBe(false)
      // …so not one rule the axis contributes can match the node.
      const [node] = [...page.document.querySelectorAll(`.${cls}`)]
      expect(node, label).toBeTruthy()
      for (const selector of gatedSelectors) {
        expect(node.matches(selector), `${label}: ${selector}`).toBe(false)
      }
      // And the overlay would still be transparent even if it did: the driver
      // never turned the inherited visibility on.
      expect(page.visibility(), label).toBe('')
      page.close()
    }

    // 1. No pointer has moved — every automated capture, every crawler.
    await expectUnaccented('no pointer has moved', {}, false)
    // 2. Scripting is unavailable.
    await expectUnaccented('scripting not executed', { noScripting: true }, false)
    // 3. The driver errors before it arms.
    await expectUnaccented('driver errors on setup', { throwOnSetup: true }, true)
    // 4. A coarse or hoverless input — a touchscreen has no cursor to follow.
    await expectUnaccented('coarse hoverless pointer', { finePointer: false }, true)
    // 5. A reduced-motion preference, honoured by the published page itself.
    await expectUnaccented('reduced motion', { reducedMotion: true }, true)
    // …and a user agent with no pointer events at all.
    await expectUnaccented('no PointerEvent support', { noPointerEvents: true }, true)

    // Belt and braces on the same obligation: even were the marker set by some
    // other path, a reduced-motion reader gets no tracking region.
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(accented.css)?.[1]
    expect(reduced).toContain(`html[data-l1-pointer] .${cls}::after`)
    expect(reduced).toContain('display: none')
    // And no site-definition field can override or opt out of that preference.
    for (const key of ['reducedMotion', 'respectReducedMotion', 'ignoreReducedMotion', 'motion']) {
      expect(
        l1PointerAccentSchema.safeParse({ ...ACCENT, [key]: false }).success,
        `${key} cannot suppress the preference`,
      ).toBe(false)
    }

    // The guards are ordered before the arming, which is what makes them mean
    // anything, and the marker is set inside the MOVE handler rather than on load.
    const arms = L1_POINTER_SCRIPT.indexOf("setAttribute('data-l1-pointer'")
    expect(arms).toBeGreaterThan(0)
    for (const guard of ['prefers-reduced-motion: reduce', '(hover: hover) and (pointer: fine)']) {
      expect(L1_POINTER_SCRIPT).toContain(guard)
      expect(L1_POINTER_SCRIPT.indexOf(guard)).toBeLessThan(arms)
    }
    expect(L1_POINTER_SCRIPT.indexOf('function move(')).toBeLessThan(arms)
  })

  /**
   * AC-884 — determinism and the shape of the driver. The region's resting outline
   * is fixed by the values the definition declares, so two renders are
   * byte-identical and a captured page reproduces; the driver is a vetted constant
   * that never learns an instance value.
   */
  it('test_UAT_AC884_two_renders_are_identical_and_the_driver_is_site_independent', () => {
    // Rendering the same definition twice produces byte-identical output. Nothing
    // about the accent is decided at render time by chance.
    const one = renderL1Document(docWithBand({ pattern: GRID, pointerAccent: ACCENT }))
    const two = renderL1Document(docWithBand({ pattern: GRID, pointerAccent: ACCENT }))
    expect(one.css).toBe(two.css)
    expect(one.html).toBe(two.html)
    expect(one.js).toBe(two.js)
    expect(one.css).not.toContain('NaN')

    // Two different sites' accented pages carry the identical driver…
    const alpha = renderL1Document(
      docWithBand({
        pattern: { ...GRID, spacingPx: 31, color: '#123456' },
        pointerAccent: { color: '#654321', radiusPx: 140, roughness: 0.85, softnessPx: 19 },
      }),
    )
    const beta = renderL1Document(
      docWithBand({
        pattern: { ...GRID, spacingPx: 77, color: '#abcdef' },
        pointerAccent: { color: '#0f9d58', radiusPx: 44, roughness: 0.24, softnessPx: 11 },
      }),
    )
    expect(alpha.js).toBe(beta.js)
    expect(alpha.js).toBe(L1_POINTER_SCRIPT)
    // …carrying none of either definition's accent values: not a colour, not a
    // reach, not a softness, not a roughness, and no count of the region's
    // features. It cannot know how big the region is or what colour it paints.
    for (const value of ['2e86a3', '654321', '0f9d58', '123456', 'abcdef']) {
      expect(L1_POINTER_SCRIPT, value).not.toContain(value)
    }
    for (const value of ['140', '44', '0.85', '0.24', '19', '11', '31', '77']) {
      expect(L1_POINTER_SCRIPT, value).not.toContain(value)
    }

    // ONE driver for every accented node on the page, not one per node.
    const many = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: Array.from({ length: 4 }, (_, i) => ({
          kind: 'container',
          id: `band${i}`,
          layout: 'stack',
          children: [],
          axes: { pattern: { ...GRID, spacingPx: 24 + i }, pointerAccent: ACCENT },
        })),
      },
    } as L1Document)
    expect(many.js).toBe(L1_POINTER_SCRIPT)
    expect(many.html.match(/<script>/g)).toHaveLength(1)
    expect(many.html.match(/class="[^"]*\bl1-pt\b[^"]*"/g)).toHaveLength(4)
    expect(L1_POINTER_SCRIPT.match(/addEventListener\('pointermove'/g)).toHaveLength(1)

    // A page whose nodes declare no accent carries no pointer driver whatsoever.
    const none = renderL1Document(docWithBand({ pattern: GRID }))
    expect(none.js).toBeUndefined()
    expect(none.html).not.toContain('<script')
    expect(none.html).not.toContain('l1-pt')
    expect(none.css).not.toContain('data-l1-pointer')
  })

  /**
   * AC-885 — the region's resting outline: rough rather than circular, the same
   * every render, bounded by the declared reach, contiguous with the cursor, a
   * plain circle at roughness 0, and feathered over exactly the declared softness.
   */
  it('test_UAT_AC885_the_resting_region_is_deterministically_rough_and_bounded', () => {
    const at = (accent: { color: string; radiusPx: number; roughness?: number; softnessPx?: number }) => {
      const r = renderL1Document(docWithBand({ pattern: GRID, pointerAccent: accent }))
      return { ...r, lobes: maskLobes(r.css, bandClass(r.html)) }
    }

    // The same definition renders to the same outline every time.
    const first = at(ACCENT)
    const again = at(ACCENT)
    expect(first.css).toBe(again.css)
    expect(first.lobes).toEqual(again.lobes)

    // Exactly one core — centred on the cursor and never scaled by the driver —
    // with the bumps pushed out toward the boundary around it.
    const cores = first.lobes.filter((l) => !l.flickers)
    const bumps = first.lobes.filter((l) => l.flickers)
    expect(cores).toHaveLength(1)
    expect([cores[0].dx, cores[0].dy]).toEqual([0, 0])
    expect(bumps.length).toBeGreaterThan(4)

    // ROUGH, NOT CIRCULAR: the outline bulges past the core where a bump sits and
    // falls back to it between them, and no two bulges are the same size — so the
    // boundary has no evident symmetry rather than tracing one arc.
    const core = cores[0].radius
    for (const b of bumps) expect(reachOf(b)).toBeGreaterThan(core)
    expect(new Set(bumps.map((b) => b.radius)).size).toBeGreaterThan(1)
    expect(new Set(bumps.map((b) => Math.round(reachOf(b) * 1e3))).size).toBeGreaterThan(1)

    // The declared reach is an OUTER BOUND. No part of the region passes it.
    for (const l of first.lobes) expect(reachOf(l)).toBeLessThanOrEqual(ACCENT.radiusPx + 1e-3)
    // And every part is contiguous with the point under the cursor: each bump
    // overlaps the core, which is centred on the hand — so no fragment floats free.
    for (const b of bumps) expect(gapOf(b)).toBeLessThan(core)

    // A rougher outline eats INWARD rather than growing outward: the reach stays
    // pinned to what the author asked for while the bays deepen.
    const bay = (roughness: number) => {
      const r = at({ ...ACCENT, roughness })
      for (const l of r.lobes) expect(reachOf(l)).toBeLessThanOrEqual(ACCENT.radiusPx + 1e-3)
      const c = r.lobes.find((l) => !l.flickers)!.radius
      return c / Math.max(...r.lobes.filter((l) => l.flickers).map(reachOf))
    }
    // Progressively more irregular, asserted as a trend so no lucky constant
    // satisfies it: the outline falls further back between bumps as the dial rises.
    expect(bay(1)).toBeLessThan(bay(0.65))
    expect(bay(0.65)).toBeLessThan(bay(0.3))
    expect(bay(0.3)).toBeLessThan(bay(0))

    // ── The dials at their limits ────────────────────────────────────────────
    // Roughness 0 is a PLAIN CIRCLE of the declared reach: every lobe's rim lands
    // on the same circle (emitted lengths are rounded to 4dp, so "to well under a
    // pixel" is the claim, not exact equality).
    const disc = at({ ...ACCENT, roughness: 0 })
    for (const l of disc.lobes) expect(Math.abs(reachOf(l) - ACCENT.radiusPx)).toBeLessThan(0.01)

    // The declared softness is the width over which the accent fades out at the
    // region's edge, with zero a hard cut. Read off the core, which at roughness
    // 0 is the whole disc.
    for (const softnessPx of [0, 12, 30]) {
      const r = at({ ...ACCENT, roughness: 0, softnessPx })
      const c = r.lobes.find((l) => !l.flickers)!
      expect(c.radius, `softness ${softnessPx}: the rim is the declared reach`).toBe(ACCENT.radiusPx)
      expect(c.radius - c.inner, `softness ${softnessPx}: the fade spans it`).toBe(softnessPx)
    }
  })

  /**
   * AC-886 — the three things that make the region feel like a hand rather than a
   * widget: it is completely still while the pointer is, costing no frames at all;
   * it deforms while the pointer moves; and it comes back after the reader's
   * attention leaves and returns — every time, not once per session.
   */
  it('test_UAT_AC886_the_region_is_still_when_the_pointer_is_and_returns_after_blur', async () => {
    const b = band({ surfaceFill: '#F5F4EC', pattern: GRID, pointerAccent: ACCENT })
    const page = await drive(b.html)
    const [node] = page.handles()
    expect(node).toBeTruthy()

    // ── Still: met by the page not running, rather than by motion being damped ─
    page.move(200, 150)
    page.settle()
    const parked = page.snapshot(node)
    const framesAtRest = page.scheduled()
    // Two observations taken apart from one another are identical, and the page
    // scheduled no animation frames in between.
    expect(page.step(), 'nothing was pending').toBe(0)
    expect(page.snapshot(node)).toBe(parked)
    expect(page.scheduled()).toBe(framesAtRest)
    // At rest every tracker sits on the cursor and every lobe is at its resting
    // scale — the outline is exactly the fixed shape the stylesheet describes.
    const resting = page.trackers(node)
    expect(spread(resting)).toBe(0)
    for (const t of resting) expect(t.scale).toBe(1)

    // ── Moving: the outline pulls apart and its edge flickers ────────────────
    const frames: string[] = []
    const spreads: number[] = []
    const scales: number[] = []
    for (let i = 1; i <= 8; i++) {
      page.move(200 + i * 70, 150 + i * 40)
      page.step()
      frames.push(page.snapshot(node))
      const t = page.trackers(node)
      spreads.push(spread(t))
      scales.push(...t.map((p) => p.scale))
    }
    // Consecutive frames differ…
    for (let i = 1; i < frames.length; i++) expect(frames[i], `frame ${i}`).not.toBe(frames[i - 1])
    // …the outline spreads measurably as the lagging trackers string out behind
    // the hand, well beyond the zero spread it rests at…
    expect(Math.max(...spreads)).toBeGreaterThan(20)
    // …and the edge flickers: lobes leave their resting scale while moving.
    expect(scales.some((s) => Math.abs(s - 1) > 0.01)).toBe(true)
    // The deformation scales with pointer speed — a slower hand deforms less.
    const slow = await drive(b.html)
    const [slowNode] = slow.handles()
    slow.move(200, 150)
    slow.settle()
    const slowSpreads: number[] = []
    for (let i = 1; i <= 8; i++) {
      slow.move(200 + i * 4, 150 + i * 2)
      slow.step()
      slowSpreads.push(spread(slow.trackers(slowNode)))
    }
    expect(Math.max(...slowSpreads)).toBeLessThan(Math.max(...spreads))
    slow.close()

    // The CENTRE does not flicker — only the edge. The core lobe takes its
    // lengths straight; every bump is scaled by the driver's per-lobe jitter.
    const lobes = maskLobes(b.css, b.cls)
    expect(lobes.filter((l) => !l.flickers)).toHaveLength(1)
    expect(lobes.filter((l) => l.flickers).length).toBeGreaterThan(4)

    // ── Stopping: it settles back to the stable rough outline ────────────────
    page.settle()
    const settled = page.trackers(node)
    expect(spread(settled)).toBeLessThan(0.5)
    for (const t of settled) expect(t.scale).toBe(1)
    // …and once settled the page is genuinely idle again.
    const idle = page.scheduled()
    expect(page.step()).toBe(0)
    expect(page.scheduled()).toBe(idle)

    // ── Leaving and returning, more than once ────────────────────────────────
    expect(page.visibility()).toBe('1')
    for (const away of ['pointerleave', 'blur'] as const) {
      for (const round of [1, 2]) {
        if (away === 'pointerleave') page.leave()
        else page.blur()
        expect(page.visibility(), `${away} round ${round}`).toBe('0')
        page.move(260 + round, 190 + round)
        page.settle()
        // It comes back on the next pointer movement — every time, not only the
        // first time in a session. The marker's arming is irrevocable; the
        // visibility is reversible, and they are separate pieces of state.
        expect(page.visibility(), `${away} round ${round} returned`).toBe('1')
        expect(page.armed()).toBe(true)
      }
    }
    page.close()
  })

  /**
   * AC-887 — the accent admits typed values only. Each refusal is reported at the
   * offending field's own path with a message saying why, and the well-formed
   * equivalent validates, renders, and puts no instance string into the page as
   * raw style, markup or script.
   */
  it('test_UAT_AC887_the_accent_admits_typed_values_only', () => {
    const refusals: { why: string; accent: unknown; at: string; names: RegExp }[] = [
      {
        why: 'a reach beyond the permitted range',
        accent: { color: TEAL, radiusPx: L1_ENVELOPE.pointerAccentRadiusPx.max + 1 },
        at: '/root/children/0/axes/pointerAccent/radiusPx',
        names: /out of range/,
      },
      {
        why: 'a reach below the permitted range',
        accent: { color: TEAL, radiusPx: L1_ENVELOPE.pointerAccentRadiusPx.min - 1 },
        at: '/root/children/0/axes/pointerAccent/radiusPx',
        names: /out of range/,
      },
      {
        why: 'a reach of zero',
        accent: { color: TEAL, radiusPx: 0 },
        at: '/root/children/0/axes/pointerAccent/radiusPx',
        names: /Too small|>0/,
      },
      {
        why: 'a negative reach',
        accent: { color: TEAL, radiusPx: -90 },
        at: '/root/children/0/axes/pointerAccent/radiusPx',
        names: /Too small|>0/,
      },
      {
        why: 'a softness beyond the permitted range',
        accent: { color: TEAL, radiusPx: 90, softnessPx: 99_999 },
        at: '/root/children/0/axes/pointerAccent/softnessPx',
        names: /out of range/,
      },
      {
        why: 'a roughness above its permitted range',
        accent: { color: TEAL, radiusPx: 90, roughness: 2 },
        at: '/root/children/0/axes/pointerAccent/roughness',
        names: /Too big|<=1/,
      },
      {
        why: 'a roughness below its permitted range',
        accent: { color: TEAL, radiusPx: 90, roughness: -0.5 },
        at: '/root/children/0/axes/pointerAccent/roughness',
        names: /Too small|>=0/,
      },
      {
        why: 'an accent colour named rather than written as a hex literal',
        accent: { color: 'teal', radiusPx: 90 },
        at: '/root/children/0/axes/pointerAccent/color',
        names: /hex color/,
      },
      {
        why: 'an accent colour expressed as a CSS colour function',
        accent: { color: 'rgb(46 134 163 / 60%)', radiusPx: 90 },
        at: '/root/children/0/axes/pointerAccent/color',
        names: /hex color/,
      },
      {
        why: 'a style string smuggled in as the accent colour',
        accent: { color: '#fff; } body { display: none } .x {', radiusPx: 90 },
        at: '/root/children/0/axes/pointerAccent/color',
        names: /hex color/,
      },
      {
        why: 'a reach that is not a finite number',
        accent: { color: TEAL, radiusPx: Number.NaN },
        at: '/root/children/0/axes/pointerAccent/radiusPx',
        names: /expected number/,
      },
      {
        why: 'a softness that is not a finite number',
        accent: { color: TEAL, radiusPx: 90, softnessPx: Number.POSITIVE_INFINITY },
        at: '/root/children/0/axes/pointerAccent/softnessPx',
        names: /expected number|out of range/,
      },
      {
        why: 'a selector smuggled in as a key',
        accent: { color: TEAL, radiusPx: 90, selector: ':hover' },
        at: '/root/children/0/axes/pointerAccent',
        names: /selector/,
      },
      {
        why: 'a style string smuggled in as a key',
        accent: { color: TEAL, radiusPx: 90, css: 'mask-image: url(x)' },
        at: '/root/children/0/axes/pointerAccent',
        names: /css/,
      },
      {
        why: 'a script smuggled in as a key',
        accent: { color: TEAL, radiusPx: 90, script: 'alert(1)' },
        at: '/root/children/0/axes/pointerAccent',
        names: /script/,
      },
      {
        why: "a count of the region's internal features, which is not an author's to name",
        accent: { color: TEAL, radiusPx: 90, lobes: 40 },
        at: '/root/children/0/axes/pointerAccent',
        names: /lobes/,
      },
    ]

    for (const { why, accent, at, names } of refusals) {
      const result = validateL1(docWithBand({ pattern: GRID, pointerAccent: accent } as L1SurfaceAxes))
      expect(result.ok, why).toBe(false)
      const reported = !result.ok ? result.errors : []
      const hit = reported.find((e) => e.path === at)
      expect(hit, `${why} — reported at ${at}, got ${JSON.stringify(reported)}`).toBeTruthy()
      expect(hit!.message, `${why} — the report says why`).toMatch(names)
    }

    // The well-formed equivalent, using only the typed vocabulary within range,
    // validates and renders.
    const good = docWithBand({
      surfaceFill: '#F5F4EC',
      pattern: GRID,
      pointerAccent: { color: TEAL, radiusPx: 90, softnessPx: 18, roughness: 0.65 },
    })
    expect(validateL1(good).ok).toBe(true)
    const { html, css, js } = renderL1Document(good)
    expect(css).toContain('html[data-l1-pointer]')

    // And no value from the definition reaches the published page as raw style,
    // markup or script: the document names none of the mechanism, and the only
    // script on the page is the fixed driver carrying none of its numbers.
    const authored = JSON.stringify(good)
    for (const mechanism of ['::after', 'mask', 'selector', 'script', 'isolation']) {
      expect(authored, mechanism).not.toContain(mechanism)
    }
    expect(js).toBe(L1_POINTER_SCRIPT)
    for (const value of ['2e86a3', '8b5c2a', '0.65', '18', '48']) {
      expect(L1_POINTER_SCRIPT, value).not.toContain(value)
    }
    expect(html.match(/<script>/g)).toHaveLength(1)
    expect(html).not.toContain('style=')
  })
})
