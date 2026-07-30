/**
 * REQ-103 — L1 can express texture.
 *
 * Every surface the substrate could paint was a flat colour or one *linear*
 * gradient, and a background image was pinned to `cover` / `no-repeat` (BUG-13),
 * so a 24×24 dot-grid could not tile. Both routes to a textured surface were
 * closed, and the only workaround left — one full-bleed asset stretched across
 * the box — distorts at every viewport it was not authored for and pushes the
 * design decision out of L1 and back into a hand-authored file.
 *
 * These UATs pin the ticket's acceptance: a container paints a dot-grid and a
 * hairline grid from typed axes with no asset and no raw CSS; the texture
 * composes with the fill, the gradient and the scrim in a defined order; the
 * radial branch exists so a glow can be drawn at all; the envelope bounds the new
 * numbers and the colour goes through `l1Color`; and a document that declares no
 * pattern renders exactly as it did before.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, globSync } from 'node:fs'
import {
  l1ContainerSchema,
  l1GradientSchema,
  l1PatternSchema,
  validateL1,
  type L1Document,
  type L1Node,
  type L1SurfaceAxes,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

/** The declarations of one class's base rule (no media query) in a stylesheet. */
function baseDecls(css: string, cls: string): string[] {
  const m = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`).exec(css)
  return m ? m[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** The class of the rendered element carrying `id`. */
function classOf(html: string, id: string): string {
  const m = new RegExp(`<\\w+ class="([^"]+)" id="${id}"`).exec(html)
  expect(m, `an element with id="${id}" rendered`).toBeTruthy()
  return m![1]
}

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

/** The band's base declarations for a document carrying `axes`. */
function bandDecls(axes: L1SurfaceAxes): string[] {
  const { html, css } = renderL1Document(docWithBand(axes))
  return baseDecls(css, classOf(html, 'band'))
}

/** One declaration by property name (`background-image`), or undefined. */
function decl(decls: string[], prop: string): string | undefined {
  return decls.find((d) => d.startsWith(`${prop}:`))?.slice(prop.length + 1).trim()
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

describe('REQ-103 — a surface can carry a repeating texture', () => {
  it('test_UAT_FC_REQ-103_container_paints_a_dot_grid_with_no_asset', () => {
    const pattern = { shape: 'dots', spacingPx: 24, thicknessPx: 2, color: '#8b5c2a' } as const

    // The axis is admitted by the shared surface group, so it lands on a
    // container — the kind that both paints and lays out — not just a box.
    const parsed = l1ContainerSchema.safeParse({
      kind: 'container',
      layout: 'stack',
      children: [],
      axes: { pattern },
    })
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true)

    const decls = bandDecls({ pattern })
    const image = decl(decls, 'background-image')
    expect(image, 'the dot-grid painted as a background layer').toBeTruthy()
    // A disc per tile, drawn by the renderer — no `url(...)`, no asset.
    expect(image).toContain('radial-gradient')
    expect(image).not.toContain('url(')
    expect(image).toContain('#8b5c2a')
    // `thicknessPx` is the dot diameter, so the radius is half of it.
    expect(image).toContain('1px')
    // The tile is the spacing, and it repeats — the capability BUG-13's pinned
    // `cover` / `no-repeat` triple made unreachable.
    expect(decl(decls, 'background-size')).toBe('24px 24px')
    expect(decl(decls, 'background-repeat')).toBe('repeat')

    // Spacing is what the author sets; nothing about the axis is a fixed tile.
    expect(decl(bandDecls({ pattern: { ...pattern, spacingPx: 40 } }), 'background-size')).toBe(
      '40px 40px',
    )
    // And the whole document clears the envelope end to end.
    const report = validateL1(docWithBand({ pattern }))
    expect(report.ok, JSON.stringify(report.ok ? [] : report.errors)).toBe(true)
  })

  it('test_UAT_FC_REQ-103_container_paints_a_hairline_grid_and_rules', () => {
    const decls = bandDecls({
      pattern: { shape: 'grid', spacingPx: 32, thicknessPx: 1, color: '#ffffff' },
    })
    const layers = commaList(decl(decls, 'background-image')!)
    // A CSS gradient runs along one axis, so a grid is one rule set per axis.
    expect(layers).toHaveLength(2)
    expect(layers[0]).toContain('to bottom')
    expect(layers[1]).toContain('to right')
    for (const layer of layers) {
      expect(layer).toContain('#ffffff')
      expect(layer).toContain('1px')
      expect(layer).not.toContain('url(')
    }
    // Both rule sets tile on the same period, so the cells are square.
    expect(commaList(decl(decls, 'background-size')!)).toEqual(['32px 32px', '32px 32px'])
    expect(commaList(decl(decls, 'background-repeat')!)).toEqual(['repeat', 'repeat'])
    expect(validateL1(docWithBand({ pattern: { shape: 'grid', spacingPx: 32, color: '#ffffff' } })).ok).toBe(
      true,
    )

    // `lines` is the one-axis form, and the only shape `angleDeg` tilts.
    const lines = bandDecls({
      pattern: { shape: 'lines', spacingPx: 8, thicknessPx: 2, color: '#101014', angleDeg: 45 },
    })
    const lineImage = decl(lines, 'background-image')!
    expect(commaList(lineImage)).toHaveLength(1)
    expect(lineImage).toContain('repeating-linear-gradient(45deg')
    expect(lineImage).toContain('#101014')
    // A repeating gradient carries its own period, so the tilt does not shear a tile.
    expect(lineImage).toContain('8px')
    expect(decl(lines, 'background-size')).toBe('auto')
  })

  it('test_UAT_FC_REQ-103_texture_composes_with_fill_gradient_scrim_and_backdrop', () => {
    const decls = bandDecls({
      surfaceFill: '#0b0b0f',
      pattern: { shape: 'dots', spacingPx: 24, color: '#8b5c2a' },
      surfaceGradient: { kind: 'radial', origin: 'top', stops: [{ color: '#3a2a1a' }, { color: '#0b0b0f' }] },
      overlay: { color: '#000000', opacity: 0.2 },
      backgroundImageUrl: '/assets/xgd-grid-hero.svg',
    })

    // The fill stays behind everything as a background *colour*, not a layer.
    expect(decl(decls, 'background-color')).toBe('#0b0b0f')

    // Layer order, top-most first: scrim over texture over wash over image.
    const layers = commaList(decl(decls, 'background-image')!)
    expect(layers).toHaveLength(4)
    expect(layers[0]).toContain('#00000033') // the scrim, alpha-folded
    expect(layers[1]).toContain('radial-gradient(circle at center')
    expect(layers[2]).toContain('radial-gradient(at top')
    // REQ-109 — emitted document-relative so the snapshot relocates; the axis is
    // still authored `/assets/…`.
    expect(layers[3]).toBe('url("assets/xgd-grid-hero.svg")')

    // The sizing triple is positional, so a tiled texture and a `cover` backdrop
    // coexist: each layer keeps its own size / position / repeat.
    expect(commaList(decl(decls, 'background-size')!)).toEqual(['auto', '24px 24px', 'auto', 'cover'])
    expect(commaList(decl(decls, 'background-position')!)).toEqual(['0% 0%', '0% 0%', '0% 0%', 'center'])
    expect(commaList(decl(decls, 'background-repeat')!)).toEqual([
      'repeat',
      'repeat',
      'repeat',
      'no-repeat',
    ])
  })

  it('test_UAT_FC_REQ-103_a_radial_gradient_paints_a_glow', () => {
    const glow = bandDecls({
      surfaceGradient: {
        kind: 'radial',
        origin: 'top-left',
        extent: 'closest-side',
        stops: [{ color: '#3a2a1a', position: 0 }, { color: '#0b0b0f', position: 100 }],
      },
    })
    // The falloff device that had no representation at all while L1's only
    // gradient was linear.
    expect(decl(glow, 'background-image')).toBe(
      'radial-gradient(closest-side at left top, #3a2a1a 0%, #0b0b0f 100%)',
    )

    // The origin is a closed enum, so no instance value reaches CSS as syntax.
    expect(
      l1GradientSchema.safeParse({
        kind: 'radial',
        origin: '30% 40%',
        stops: [{ color: '#000000' }, { color: '#ffffff' }],
      }).success,
    ).toBe(false)
    // The two branches cannot be mixed into a gradient that means nothing.
    expect(
      l1GradientSchema.safeParse({
        kind: 'radial',
        angleDeg: 90,
        stops: [{ color: '#000000' }, { color: '#ffffff' }],
      }).success,
    ).toBe(false)
    // A gradient that does not say otherwise is still linear, unchanged.
    expect(
      decl(bandDecls({ surfaceGradient: { angleDeg: 90, stops: [{ color: '#000000' }, { color: '#ffffff' }] } }), 'background-image'),
    ).toBe('linear-gradient(90deg, #000000, #ffffff)')
  })

  it('test_UAT_FC_REQ-103_envelope_bounds_the_texture_numbers_and_its_colour', () => {
    const ok = { shape: 'dots', spacingPx: 24, thicknessPx: 2, color: '#8b5c2a' } as const
    expect(l1PatternSchema.safeParse(ok).success).toBe(true)

    // Closed shape: no freeform CSS hole, no unknown keys, hex colour only.
    expect(l1PatternSchema.safeParse({ ...ok, shape: 'noise' }).success).toBe(false)
    expect(l1PatternSchema.safeParse({ ...ok, color: 'rgba(0,0,0,.2)' }).success).toBe(false)
    expect(l1PatternSchema.safeParse({ ...ok, backgroundImage: 'url(x)' }).success).toBe(false)
    expect(l1PatternSchema.safeParse({ shape: 'dots', color: '#000000' }).success).toBe(false)

    // A sub-pixel period tiles a full-bleed band millions of times — a way to
    // hang a compositor, so the envelope refuses it by name.
    const tiny = validateL1(docWithBand({ pattern: { ...ok, spacingPx: 0.05 } }))
    expect(tiny.ok).toBe(false)
    expect(!tiny.ok && tiny.errors.map((e) => e.path)).toContain('/root/children/0/axes/pattern/spacingPx')

    const huge = validateL1(docWithBand({ pattern: { ...ok, spacingPx: 50_000 } }))
    expect(huge.ok).toBe(false)
    const thick = validateL1(docWithBand({ pattern: { ...ok, thicknessPx: 90_000 } }))
    expect(thick.ok).toBe(false)
    expect(!thick.ok && thick.errors.map((e) => e.path)).toContain(
      '/root/children/0/axes/pattern/thicknessPx',
    )

    // A rule wider than its own period is a fill, not a texture: it saturates at
    // the spacing rather than bleeding into the neighbouring tile.
    const saturated = bandDecls({ pattern: { shape: 'grid', spacingPx: 4, thicknessPx: 4, color: '#ffffff' } })
    expect(decl(saturated, 'background-image')).not.toContain('8px')
  })

  it('test_UAT_FC_REQ-103_untextured_documents_render_unchanged', () => {
    // The change is strictly additive. A surface that declares no pattern emits
    // no texture and — the byte-level risk in making the sizing triple
    // positional — keeps BUG-13's single-valued `cover` for a backdrop image.
    const backdrop = bandDecls({ backgroundImageUrl: '/assets/hero.png' })
    expect(decl(backdrop, 'background-size')).toBe('cover')
    expect(decl(backdrop, 'background-position')).toBe('center')
    expect(decl(backdrop, 'background-repeat')).toBe('no-repeat')

    // A scrim + gradient surface with no image declares no sizing triple at all,
    // exactly as before.
    const wash = bandDecls({
      surfaceFill: '#0b0b0f',
      overlay: { color: '#000000', opacity: 0.4 },
      surfaceGradient: { stops: [{ color: '#000000' }, { color: '#ffffff' }] },
    })
    expect(decl(wash, 'background-size')).toBeUndefined()
    expect(decl(wash, 'background-repeat')).toBeUndefined()

    const pages = globSync('storage/sites/*/draft/pages/*.json')
    expect(pages.length, 'shipped L1 pages to re-render').toBeGreaterThan(0)
    for (const path of pages) {
      const page = JSON.parse(readFileSync(path, 'utf8')) as { l1?: L1Document }
      if (!page.l1) continue
      const report = validateL1(page.l1)
      expect(report.ok, `${path}: ${JSON.stringify(report.ok ? [] : report.errors)}`).toBe(true)
      const { html, css } = renderL1Document(page.l1)
      expect(html.length, `${path} rendered markup`).toBeGreaterThan(0)
      // Every `background-size` on a page whose surfaces declare no pattern is
      // still the single `cover` value BUG-13 emits — the positional list form
      // appears only where a texture asked for it.
      //
      // Scoped to the rules that style a NODE'S SURFACE, which is what this claim
      // is about. REQ-108's pointer accent paints a renderer-owned `::after` whose
      // background is legitimately a stack of lobes, and it is gated behind
      // `html[data-l1-pointer]`; reading its `background-size` here would make this
      // assertion fail for a page that declares no pattern at all — which is the
      // opposite of what it is checking.
      for (const [, selector, block] of css.matchAll(/(?:^|\n)([^\n{}]+)\{([^}]*)\}/g)) {
        if (selector.includes('data-l1-pointer')) continue
        for (const [, value] of block.matchAll(/background-size:\s*([^;}]+)/g)) {
          if (patternedNodes(page.l1.root) > 0) continue
          expect(commaList(value.trim()), `${path} background-size`).toHaveLength(1)
        }
      }
    }
  })
})

/** How many nodes in the tree declare the new texture axis. */
function patternedNodes(node: L1Node): number {
  const self = node.axes && 'pattern' in node.axes && node.axes.pattern ? 1 : 0
  const children = 'children' in node ? (node.children ?? []) : []
  return children.reduce((n: number, c: L1Node) => n + patternedNodes(c), self)
}
