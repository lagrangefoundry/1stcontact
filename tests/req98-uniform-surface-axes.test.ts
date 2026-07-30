/**
 * REQ-98 — the paint capability is ONE shared axis group, carried by every L1
 * node kind that renders a box.
 *
 * Which kinds could paint used to be arbitrary: `box` / `image` / `text` each
 * re-declared an overlapping slice of the surface axes, while `container` and
 * `slot` carried none. The visible cost was that any element which is both
 * *painted* and *internally laid out* — a card, a panel, a bordered section —
 * needed TWO nodes, a `box` wrapped around a `container`.
 *
 * Under REQ-96 that stops being an ergonomic tax and becomes a hole in the
 * contract: L1 owns class, geometry and every paint axis, and a behavior module
 * ships zero CSS. An axis L1 cannot carry on the node that needs it is an axis a
 * module has to paint — the precise outcome REQ-96 exists to make impossible.
 * REQ-96's own new kind (`control`) needed the surface added by hand, which is
 * exactly the process that produced the asymmetry.
 *
 * These UATs pin the ticket's acceptance: the group is admitted and *painted*
 * on every kind, a painted-and-laid-out element is one node rather than two, the
 * envelope bounds the group uniformly rather than per kind, and a folded
 * reproduction renders exactly the declarations it did before.
 */
import { describe, expect, it } from 'vitest'
import {
  l1SurfaceAxesSchema,
  validateL1,
  type L1Document,
  type L1Node,
  type L1SurfaceAxes,
} from '../packages/site-schema/src/index'
import { renderL1Document, renderL1Fragment } from '../packages/framework/src/index'
import { localizeAssets } from '../tools/generate/src/l1'
import type { CaptureAsset } from '../tools/generate/src/cli/capture'

const WIDTHS = [320, 768, 1440]

/** Every axis in the shared surface group, populated. */
const SURFACE: L1SurfaceAxes = {
  surfaceFill: '#101828',
  borderRadiusPx: 12,
  opacity: 0.9,
  surfaceGradient: { angleDeg: 90, stops: [{ color: '#ff0000' }, { color: '#0000ff' }] },
  backgroundImageUrl: '/assets/card.png',
  overlay: { color: '#000000', opacity: 0.5 },
  boxShadow: { offsetXPx: 0, offsetYPx: 8, blurPx: 24, color: '#00000033' },
  border: { widthPx: 1, color: '#e5e7eb' },
  borderLeft: { widthPx: 4, color: '#f59e0b' },
  backdropBlurPx: 6,
  blendMode: 'multiply',
}

/** The declarations the shared group must produce, in emission order. */
const SURFACE_DECLS = [
  'background-color: #101828',
  'border-radius: 12px',
  'opacity: 0.9',
  // REQ-109 — the authored axis keeps its `/assets/…`; the EMITTED url() is
  // document-relative so a rendered snapshot relocates under any path prefix.
  'background-image: linear-gradient(#00000080, #00000080), linear-gradient(90deg, #ff0000, #0000ff), url("assets/card.png")',
  'background-size: cover',
  'background-position: center',
  'background-repeat: no-repeat',
  'border: 1px solid #e5e7eb',
  'border-left: 4px solid #f59e0b',
  'box-shadow: 0px 8px 24px #00000033',
  '-webkit-backdrop-filter: blur(6px)',
  'backdrop-filter: blur(6px)',
  'mix-blend-mode: multiply',
]

/** The CSS properties the surface group owns — used to isolate paint from layout. */
const PAINT_PROPS = new Set(SURFACE_DECLS.map((d) => d.slice(0, d.indexOf(':'))))

/**
 * The declarations of one class's **axis** rule — the last un-media-queried rule
 * for that selector. A node with geometry emits its position rule for the same
 * selector first; the axis rule the emitter builds in `base` is always last.
 */
function baseDecls(css: string, cls: string): string[] {
  const head = css.split('@media')[0]
  const rules = [...head.matchAll(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`, 'g'))]
  const last = rules[rules.length - 1]
  return last ? last[1].split(';').map((d) => d.trim()).filter(Boolean) : []
}

/** Only the paint declarations of a rule, in the order the emitter wrote them. */
function paintDecls(css: string, cls: string): string[] {
  return baseDecls(css, cls).filter((d) => PAINT_PROPS.has(d.slice(0, d.indexOf(':'))))
}

/** The class of the first element in a rendered fragment. */
function firstClass(html: string): string {
  return /class="([^"]+)"/.exec(html)![1]
}

describe('REQ-98 — one shared surface group across every node kind', () => {
  it('test_UAT_FC_REQ-98_every_box_rendering_kind_accepts_and_paints_the_surface_group', () => {
    // One table, six kinds. Each node is the document root (or, for `control`,
    // the one node of a mounted fragment) carrying the FULL group — so the
    // assertion is not "this kind has some paint axes" but "this kind has the
    // same paint axes as every other kind, through the same emitter".
    const kinds: Array<{ label: string; render: () => { html: string; css: string } }> = [
      {
        label: 'box',
        render: () => renderL1Document({ widths: WIDTHS, root: { kind: 'box', axes: SURFACE } }),
      },
      {
        label: 'container',
        render: () =>
          renderL1Document({
            widths: WIDTHS,
            root: { kind: 'container', layout: 'stack', axes: SURFACE, children: [] },
          }),
      },
      {
        label: 'text',
        render: () =>
          renderL1Document({
            widths: WIDTHS,
            root: { kind: 'text', text: 'Coming soon', axes: SURFACE },
          }),
      },
      {
        label: 'image',
        render: () =>
          renderL1Document({
            widths: WIDTHS,
            root: { kind: 'image', src: '/assets/photo.jpg', alt: 'Photo', axes: SURFACE },
          }),
      },
      {
        label: 'slot',
        render: () =>
          renderL1Document({ widths: WIDTHS, root: { kind: 'slot', name: 'form', axes: SURFACE } }),
      },
      {
        label: 'control',
        render: () => {
          const out = renderL1Fragment([{ kind: 'control', control: 'email', axes: SURFACE }], 'fc', {
            email: { tag: 'input', attrs: { type: 'email', name: 'email' } },
          })
          return { html: out.htmls[0], css: out.css }
        },
      },
    ]

    for (const { label, render } of kinds) {
      const { html, css } = render()
      // Contiguous subsequence, not equality: a `control` leaf is preceded by
      // the UA-chrome reset REQ-96 emits (`border: 0`, `background: transparent`),
      // which the group's own declarations then override further down the rule.
      expect(paintDecls(css, firstClass(html)).join(' | '), `${label} paints the shared group`)
        .toContain(SURFACE_DECLS.join(' | '))
    }

    // …and on a control the group genuinely wins: L1's border is emitted after
    // the reset's, so the module's element takes L1's paint, not the UA's.
    const ctl = renderL1Fragment([{ kind: 'control', control: 'email', axes: SURFACE }], 'fc', {
      email: { tag: 'input', attrs: { type: 'email', name: 'email' } },
    })
    const ctlDecls = baseDecls(ctl.css, firstClass(ctl.htmls[0]))
    expect(ctlDecls.indexOf('border: 1px solid #e5e7eb')).toBeGreaterThan(
      ctlDecls.indexOf('border: 0'),
    )

    // …and the whole group clears the document envelope on the kinds that used
    // to carry none at all.
    const doc: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        axes: SURFACE,
        children: [{ kind: 'slot', name: 'form', axes: SURFACE }],
      },
    }
    const report = validateL1(doc)
    expect(report.ok, JSON.stringify(report.ok ? [] : report.errors)).toBe(true)

    // Still strict: sharing the group does not open a freeform CSS hole in it.
    expect(l1SurfaceAxesSchema.safeParse({ surfaceFill: '#fff' }).success).toBe(true)
    expect(l1SurfaceAxesSchema.safeParse({ surfaceFill: 'red' }).success).toBe(false)
    expect(l1SurfaceAxesSchema.safeParse({ style: 'color:red' }).success).toBe(false)
    expect(
      validateL1({
        widths: WIDTHS,
        root: { kind: 'container', layout: 'stack', axes: { boxSizing: 'content-box' }, children: [] },
      }).ok,
    ).toBe(false)
  })

  it('test_UAT_FC_REQ-98_a_painted_and_laid_out_element_is_one_node_not_two', () => {
    // The card the ticket describes, both ways: the `box`-wrapping-`container`
    // pair the old split forced, and the single painted container.
    const card: L1SurfaceAxes = {
      surfaceFill: '#ffffff',
      borderRadiusPx: 16,
      border: { widthPx: 1, color: '#e5e7eb' },
      boxShadow: { offsetXPx: 0, offsetYPx: 2, blurPx: 8, color: '#0000001a' },
    }
    const rows: L1Node[] = [
      { kind: 'text', id: 'title', text: 'Evidence of correctness' },
      { kind: 'text', id: 'body', text: 'A living spec, tested on every change.' },
    ]

    const paired = renderL1Document({
      widths: WIDTHS,
      root: {
        kind: 'box',
        id: 'card',
        axes: card,
        children: [{ kind: 'container', layout: 'stack', gapPx: 12, children: rows }],
      },
    })
    const single = renderL1Document({
      widths: WIDTHS,
      root: { kind: 'container', id: 'card', layout: 'stack', gapPx: 12, axes: card, children: rows },
    })

    // One fewer element in the markup…
    expect(single.html.match(/<div/g)!.length).toBe(paired.html.match(/<div/g)!.length - 1)

    // …and the surviving node carries BOTH the paint and the layout, which is
    // the capability that did not exist before: previously one node could have
    // either, never both.
    const decls = baseDecls(single.css, firstClass(single.html))
    expect(decls).toContain('background-color: #ffffff')
    expect(decls).toContain('border-radius: 16px')
    expect(decls).toContain('border: 1px solid #e5e7eb')
    expect(decls).toContain('box-shadow: 0px 2px 8px #0000001a')
    expect(decls).toContain('display: flex')
    expect(decls).toContain('flex-direction: column')
    expect(decls).toContain('gap: 12px')

    // The pair painted and laid out in two different rules; the single node's
    // paint and layout are the same rule, so no wrapper is doing hidden work.
    const pairedOuter = baseDecls(paired.css, firstClass(paired.html))
    expect(pairedOuter).toContain('background-color: #ffffff')
    expect(pairedOuter).not.toContain('display: flex')
  })

  it('test_UAT_FC_REQ-98_the_envelope_bounds_the_shared_group_on_every_kind', () => {
    // Security and robustness were checked per kind, so they inherited the same
    // arbitrariness as the schema: a background-image URL was scheme-checked
    // only on a `box`, and `borderLeft`'s width was bounded on no kind at all.
    const withAxes = (kind: 'container' | 'slot' | 'image' | 'text', axes: unknown): unknown => ({
      widths: WIDTHS,
      root:
        kind === 'container'
          ? { kind, layout: 'stack', axes, children: [] }
          : kind === 'slot'
            ? { kind, name: 'form', axes }
            : kind === 'image'
              ? { kind, src: '/a.png', alt: 'a', axes }
              : { kind, text: 'x', axes },
    })

    for (const kind of ['container', 'slot', 'image', 'text'] as const) {
      const unsafe = validateL1(withAxes(kind, { backgroundImageUrl: 'javascript:alert(1)' }))
      expect(unsafe.ok, `${kind} rejects a javascript: background image`).toBe(false)
      expect(unsafe.ok ? '' : unsafe.errors[0].path).toMatch(/axes\/backgroundImageUrl$/)

      const wide = validateL1(withAxes(kind, { borderLeft: { widthPx: 99_999, color: '#000000' } }))
      expect(wide.ok, `${kind} bounds borderLeft width`).toBe(false)

      const huge = validateL1(withAxes(kind, { borderRadiusPx: 10_000_000 }))
      expect(huge.ok, `${kind} bounds borderRadiusPx`).toBe(false)
    }

    // A legitimate value on the same kinds still passes — the bound is a bound,
    // not a ban on the axis.
    for (const kind of ['container', 'slot', 'image', 'text'] as const) {
      expect(
        validateL1(
          withAxes(kind, {
            backgroundImageUrl: '/assets/card.png',
            borderLeft: { widthPx: 4, color: '#f59e0b' },
            borderRadiusPx: 12,
          }),
        ).ok,
      ).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-98_a_painted_container_binds_its_asset_to_the_local_mirror', () => {
    // `localizeAssets` resolved `backgroundImageUrl` only on a `box`. Now that
    // any kind can carry one, a painted container that kept the captured origin
    // would hotlink the target — the exact hole that module closes.
    const ORIGIN = 'https://example.test/images/card.png'
    const doc = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        axes: { backgroundImageUrl: ORIGIN },
        children: [{ kind: 'slot', name: 'form', axes: { backgroundImageUrl: ORIGIN } }],
      },
    } as unknown as L1Document
    const assets: CaptureAsset[] = [
      { id: 'card', kind: 'image', src: ORIGIN, localPath: 'assets/card.png' },
    ]

    const out = localizeAssets(doc, assets)
    const root = out.doc.root as Extract<L1Node, { kind: 'container' }>
    expect(root.axes?.backgroundImageUrl).toBe('/assets/card.png')
    expect((root.children[0] as Extract<L1Node, { kind: 'slot' }>).axes?.backgroundImageUrl).toBe(
      '/assets/card.png',
    )
    expect(out.unmirrored).toEqual([])
    expect(out.unreferenced).toEqual([])
  })

  it('test_UAT_FC_REQ-98_folded_reproductions_render_unchanged', () => {
    // Capture never populates a container's surface, so sharing the group is
    // purely additive. This pins the shape a fold emits — a full-bleed band with
    // a photo + scrim, a chip run, a rounded image, a bare layout container —
    // against the exact declarations, in the exact order, the emitter produced
    // before the group was shared.
    const geometry = { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: at, height: 400 })) }
    const folded: L1Document = {
      widths: WIDTHS,
      root: {
        kind: 'box',
        children: [
          {
            kind: 'box',
            id: 'band',
            geometry,
            axes: {
              surfaceFill: '#0b1120',
              backgroundImageUrl: '/assets/hero.png',
              overlay: { color: '#000000', opacity: 0.4 },
            },
          },
          {
            kind: 'container',
            id: 'flow',
            layout: 'row',
            gapPx: 24,
            children: [
              {
                kind: 'text',
                id: 'chip',
                text: 'Coming soon',
                axes: {
                  color: '#ffffff',
                  fontSizePx: 13,
                  surfaceFill: '#1d4ed8',
                  borderRadiusPx: 999,
                  border: { widthPx: 1, color: '#3b82f6' },
                  boxShadow: { offsetXPx: 0, offsetYPx: 1, blurPx: 2, color: '#00000022' },
                },
              },
              {
                kind: 'image',
                id: 'shot',
                src: '/assets/shot.jpg',
                alt: 'Shot',
                axes: { objectFit: 'cover', borderRadiusPx: 8, opacity: 0.95 },
              },
            ],
          },
        ],
      },
    }

    const { html, css } = renderL1Document(folded)
    const clsOf = (tag: string, nth: number): string =>
      [...html.matchAll(new RegExp(`<${tag} class="([^"]+)"`, 'g'))][nth][1]

    // The band: fill, then the scrim-over-image background stack, then sizing.
    expect(baseDecls(css, clsOf('div', 1))).toEqual([
      'background-color: #0b1120',
      'background-image: linear-gradient(#00000066, #00000066), url("assets/hero.png")',
      'background-size: cover',
      'background-position: center',
      'background-repeat: no-repeat',
    ])

    // The layout container: no axes → no paint declarations appear at all.
    expect(baseDecls(css, clsOf('div', 2))).toEqual([
      'display: flex',
      'flex-direction: row',
      'gap: 24px',
      'position: relative',
    ])

    // The chip run: type first, then its own surface in the BUG-20 order.
    expect(baseDecls(css, clsOf('p', 0))).toEqual([
      'color: #ffffff',
      'font-size: 13px',
      'background-color: #1d4ed8',
      'border-radius: 999px',
      'border: 1px solid #3b82f6',
      'box-shadow: 0px 1px 2px #00000022',
      'margin: 0',
    ])

    // The image: object-fit first, then the surface axes it always carried.
    expect(baseDecls(css, clsOf('img', 0))).toEqual([
      'object-fit: cover',
      'border-radius: 8px',
      'opacity: 0.95',
      'display: block',
    ])
  })
})
