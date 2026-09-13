import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { imageLadder, type ImageSizer } from '../tools/generate/src/publish/ladder'
import { publishSite } from '../tools/generate/src/publish/publish'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { memorySiteStore } from '../tools/generate/src/store'
import { siteSeed } from './support/site-seed'

/**
 * REQ-234 — a band's backdrop is offered in WebP too, through `image-set()`.
 *
 * WHAT THE FAILURES LOOK LIKE, which is why each claim below is worth a test:
 *
 *   - A BLANK BAND. The whole risk of this ticket is that a browser which cannot
 *     parse `image-set()` — or parses it but not the `type()` inside it — is left
 *     with no backdrop at all. CSS keeps the last declaration it understood, so
 *     the plain `url()` must PRECEDE the `image-set()` in every rule. Asserting
 *     that both are present would pass on the arrangement that breaks.
 *   - A WEBP WITH NO FALLBACK. A `background-image` declares nothing and
 *     negotiates nothing. The only thing that makes a typed rendition safe here is
 *     the option beside it inside the same `image-set()`, so a set that lost its
 *     fallback to a rejected URL must not be emitted at all.
 *   - A SECOND WIDTH VOCABULARY. `image-set()` can carry resolution descriptors,
 *     and REQ-222 refused it for exactly that job. Width still comes from the
 *     per-breakpoint rules keyed to the geometry keyframes; the set carries format
 *     and nothing else, and two mechanisms choosing width would be the duplication
 *     REQ-222 refused.
 *   - A SILENTLY DROPPED SCRIM. The picture is one layer in a composed stack, so
 *     the `image-set()` declaration restates the whole stack. A restatement that
 *     held its own opinion about that list would lose the client's overlay at the
 *     first breakpoint it applied to.
 *
 * THE SUPPORT STORY, confirmed against MDN's browser-compat data on 2026-09-12
 * rather than from memory, because the ticket rests on it: `type()` is supported
 * wherever the modern unprefixed `image-set()` is. Every earlier release that
 * shipped `image-set()` is recorded as a PARTIAL implementation precisely because
 * it lacked `type()` — Chrome/Edge 113, Firefox 89 and Safari/iOS 17 are the floor
 * for both. So there is one support question here, not two, and its answer is the
 * one `image-set()` already had: Baseline, widely available.
 */

const WIDTHS = [320, 1280]

/**
 * A 4000px backdrop with a WebP ladder beside its own — what a publish writes for
 * any JPEG or PNG big enough to earn a ladder at all. The two ladders are keyed to
 * the same widths, because `alternativeDeliveryWidthsFor` is `deliveryWidthsFor`
 * plus the source's own width and the source IS the source-format ladder's top
 * rung.
 */
const TYPED_BAND = {
  'band.jpg': {
    width: 4000,
    height: 2000,
    renditions: [
      { src: 'assets/d/beef01-320.jpg', width: 320 },
      { src: 'assets/d/beef01-640.jpg', width: 640 },
      { src: 'assets/d/beef01-1280.jpg', width: 1280 },
      { src: 'assets/band.jpg', width: 4000 },
    ],
    sources: [
      {
        type: 'image/webp',
        renditions: [
          { src: 'assets/d/beef01-320.webp', width: 320 },
          { src: 'assets/d/beef01-640.webp', width: 640 },
          { src: 'assets/d/beef01-1280.webp', width: 1280 },
          { src: 'assets/d/beef01-4000.webp', width: 4000 },
        ],
      },
    ],
  },
}

/** The same backdrop with no alternative format — every publish before this one. */
const PLAIN_BAND = {
  'band.jpg': { ...TYPED_BAND['band.jpg'], sources: undefined },
}

/** One box carrying a surface, rendered — returns the stylesheet. */
function renderBox(
  box: Partial<L1Node & { kind: 'box' }>,
  opts: Parameters<typeof renderL1Document>[1] = {},
): string {
  const node = { kind: 'box', children: [], ...box } as L1Node
  const doc: L1Document = { widths: WIDTHS, root: { kind: 'box', children: [node] } }
  const res = validateL1(doc)
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return renderL1Document(doc, opts).css
}

/** Every `background-image` declaration in `css`, in the order it was emitted. */
function bgDecls(css: string): string[] {
  return css
    .split(/[;{}]/)
    .map((d) => d.trim())
    .filter((d) => d.startsWith('background-image:'))
}

describe('REQ-234 a background gains a format choice', () => {
  it('offers WebP first and the source format second, in one image-set()', () => {
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: TYPED_BAND,
    })
    // A 320px band at 2× wants 640px of picture, in whichever format the visitor
    // can read.
    expect(css).toContain(
      'image-set(url("assets/d/beef01-640.webp") type("image/webp"), ' +
        'url("assets/d/beef01-640.jpg") type("image/jpeg"))',
    )
  })

  it('puts the plain url() BEFORE the image-set(), which is the whole fallback', () => {
    // CSS drops a declaration it cannot parse and keeps the last one it could. A
    // browser with no `image-set()` therefore paints exactly the backdrop it
    // paints today — but only because the plain declaration came first.
    const decls = bgDecls(
      renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, { delivery: TYPED_BAND }),
    )
    expect(decls[0]).toBe('background-image: url("assets/d/beef01-640.jpg")')
    expect(decls[1]).toContain('image-set(')
  })

  it('carries the pair into the per-breakpoint override too', () => {
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: TYPED_BAND,
    })
    const override = css.slice(css.indexOf('@media (min-width: 1280px)'))
    const decls = bgDecls(override)
    // A 1280px band at 2× wants 2560px: only the source covers it in JPEG, and
    // only the encoded 4000px rung covers it in WebP.
    expect(decls[0]).toBe('background-image: url("assets/band.jpg")')
    expect(decls[1]).toContain('url("assets/d/beef01-4000.webp") type("image/webp")')
    expect(decls[1]).toContain('url("assets/band.jpg") type("image/jpeg")')
  })

  it('types the fallback option from the asset’s own extension', () => {
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/mark.png' } }, {
      delivery: {
        'mark.png': {
          width: 4000,
          height: 2000,
          renditions: [
            { src: 'assets/d/cafe01-320.png', width: 320 },
            { src: 'assets/mark.png', width: 4000 },
          ],
          sources: [
            {
              type: 'image/webp',
              renditions: [
                { src: 'assets/d/cafe01-320.webp', width: 320 },
                { src: 'assets/d/cafe01-4000.webp', width: 4000 },
              ],
            },
          ],
        },
      },
    })
    // A 320px band at 2× wants 640px, which only the source covers in either
    // format — so the fallback option is the authored PNG, typed as one.
    expect(css).toContain('url("assets/mark.png") type("image/png")')
  })

  it('restates the whole layer stack, so a scrim survives into the image-set()', () => {
    const css = renderBox(
      {
        axes: {
          backgroundImageUrl: '/assets/band.jpg',
          overlay: { color: '#000000', opacity: 0.5 },
        },
      },
      { delivery: TYPED_BAND },
    )
    const set = bgDecls(css).find((d) => d.includes('image-set('))
    expect(set).toBeDefined()
    // The scrim sits above the backdrop in the same positional list, and it is
    // still there when the backdrop is an `image-set()` rather than a `url()`.
    expect(set).toContain('linear-gradient(')
    expect(set!.indexOf('linear-gradient(')).toBeLessThan(set!.indexOf('image-set('))
  })
})

describe('REQ-234 image-set() carries format and nothing else', () => {
  it('names no resolution, so width stays the per-breakpoint rules’ job', () => {
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: TYPED_BAND,
    })
    // `image-set()` can carry `1x`/`2x`/`dpi` descriptors. It carries none here:
    // two mechanisms choosing width would be exactly the duplication REQ-222
    // refused, and the per-breakpoint rules know the node's real box width.
    for (const decl of bgDecls(css).filter((d) => d.includes('image-set('))) {
      expect(decl).not.toMatch(/\d+(x|dpi|dppx)\b/)
    }
  })

  it('chooses the same rung in both ladders, from the box’s own width', () => {
    // A 300px card at 2× wants 600px, so 640 covers it at every breakpoint in
    // both formats — the set follows the rule, it does not second-guess it.
    const css = renderBox(
      {
        axes: { backgroundImageUrl: '/assets/band.jpg' },
        sizing: { width: { mode: 'fixed', px: 300 } },
      },
      { delivery: TYPED_BAND },
    )
    expect(css).toContain('url("assets/d/beef01-640.webp") type("image/webp")')
    expect(css).not.toContain('beef01-1280')
  })

  it('does not grow the rule count where the choice never changes', () => {
    const axes = { backgroundImageUrl: '/assets/band.jpg' }
    const sizing = { width: { mode: 'fixed' as const, px: 150 } }
    // A 150px box at 2× wants 300px, and 320 is the smallest rung that covers it
    // at every breakpoint — so there is nothing for a wider rule to say, with or
    // without an alternative format. This changes what the rules SAY, not how
    // many there are.
    const plain = renderBox({ axes, sizing }, { delivery: PLAIN_BAND })
    const typed = renderBox({ axes, sizing }, { delivery: TYPED_BAND })
    expect(typed.split('@media').length).toBe(plain.split('@media').length)
    expect(typed).toContain('image-set(')
  })
})

describe('REQ-234 a backdrop is never offered a format with no way back', () => {
  it('emits nothing new when the publish encoded no alternative', () => {
    const axes = { backgroundImageUrl: '/assets/band.jpg' }
    // Every publish before this one, and every deployment with no Images binding:
    // byte-identical to what it already emitted.
    expect(renderBox({ axes }, { delivery: TYPED_BAND })).not.toBe(
      renderBox({ axes }, { delivery: PLAIN_BAND }),
    )
    expect(renderBox({ axes }, { delivery: PLAIN_BAND })).not.toContain('image-set(')
  })

  it('emits nothing new on a channel with no manifest at all', () => {
    // The draft and edit channels are handed no manifest, so they are untouched.
    const axes = { backgroundImageUrl: '/assets/band.jpg' }
    expect(renderBox({ axes })).not.toContain('image-set(')
    expect(renderBox({ axes })).toContain('url("assets/band.jpg")')
  })

  it('drops an alternative whose URL will not pass the url() sink', () => {
    // A rejected candidate must not become the whole declaration, and it must not
    // leave a one-option set either: a set naming only the file the plain
    // declaration already names is a function every browser parses to arrive back
    // where it started.
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: {
        'band.jpg': {
          ...PLAIN_BAND['band.jpg'],
          sources: [
            { type: 'image/webp', renditions: [{ src: 'javascript:alert(1)', width: 320 }] },
          ],
        },
      },
    })
    expect(css).toContain('url("assets/d/beef01-640.jpg")')
    expect(css).not.toContain('javascript:')
    expect(css).not.toContain('image-set(')
  })

  it('drops an alternative whose type is not one the browser parses', () => {
    // Layer 2 does not trust Layer 1: a manifest arrives from a publish that read
    // bytes out of a bucket, and a `type()` is a value the browser PARSES. An
    // unrecognised one would disqualify the option silently — and retyping it as
    // untyped would be worse, because an untyped option is always supported.
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: {
        'band.jpg': {
          ...PLAIN_BAND['band.jpg'],
          sources: [
            {
              type: 'text/html',
              renditions: [
                { src: 'assets/d/beef01-320.webp', width: 320 },
                { src: 'assets/d/beef01-4000.webp', width: 4000 },
              ],
            },
          ],
        },
      },
    })
    expect(css).not.toContain('image-set(')
    expect(css).not.toContain('.webp')
  })

  it('keeps the backdrop when the source-format rung is the one rejected', () => {
    // The set's fallback option is the same value the plain declaration paints, so
    // a rejected source rung falls back to the authored URL in BOTH — the client's
    // backdrop never disappears, whichever half of the pair a browser reads.
    const css = renderBox({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, {
      delivery: {
        'band.jpg': {
          width: 4000,
          height: 2000,
          renditions: [
            { src: 'javascript:alert(1)', width: 320 },
            { src: 'assets/band.jpg', width: 4000 },
          ],
          sources: [
            {
              type: 'image/webp',
              renditions: [
                { src: 'assets/d/beef01-320.webp', width: 320 },
                { src: 'assets/d/beef01-4000.webp', width: 4000 },
              ],
            },
          ],
        },
      },
    })
    expect(css).not.toContain('javascript:')
    const decls = bgDecls(css)
    expect(decls[0]).toBe('background-image: url("assets/band.jpg")')
    expect(decls[1]).toContain('url("assets/band.jpg") type("image/jpeg")')
  })
})

/**
 * REQ-234 — end to end: the saving actually reaches the expensive picture.
 *
 * THE TICKET'S CLAIM IS ABOUT A CLIENT'S SITE, NOT ABOUT A STRING. "WebP reaches
 * every picture except the expensive one" is only answered by publishing a site
 * whose ONLY picture is a backdrop and finding the WebP in the stylesheet — and
 * finding that the bytes it names are bytes that same publish wrote. A stylesheet
 * naming a rendition the bucket does not hold is a 404 on the backdrop, chosen
 * precisely because the browser preferred it.
 */
describe('REQ-234 a published backdrop is served in WebP', () => {
  it('paints an image-set() naming renditions this same publish wrote', async () => {
    const seed = siteSeed({
      pages: {
        'home.json': {
          ...starterHomePage('home'),
          l1: {
            widths: WIDTHS,
            root: {
              kind: 'box',
              children: [
                { kind: 'box', children: [], axes: { backgroundImageUrl: '/assets/band.jpg' } },
              ],
            },
          },
        },
      },
      assets: { 'band.jpg': new TextEncoder().encode('not really a jpeg, but bytes are bytes') },
    })
    const store = memorySiteStore()
    store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })

    const sizer: ImageSizer = {
      measure: async () => ({ width: 4000, height: 2000 }),
      resize: async (_bytes, _type, width, type) =>
        new TextEncoder().encode(`rendition-${width}-${type ?? 'source'}`),
    }
    const result = await publishSite(store, seed.slug, { ladder: imageLadder(sizer) })

    const derived = store.derivedRevision(seed.slug, result.id) ?? new Map()
    const html = store.renderedRevision(seed.slug, result.id)?.get('home.html') ?? ''
    expect(html).toContain('image-set(')
    expect(html).toContain('type("image/webp")')

    // Every rendition the stylesheet paints — in either declaration of the pair —
    // is a file this same publish wrote.
    const painted = [...html.matchAll(/url\("(assets\/d\/[^"]+)"\)/g)].map((m) => m[1])
    expect(painted.some((src) => src.endsWith('.webp'))).toBe(true)
    for (const src of painted) expect(derived.has(src), src).toBe(true)
  })
})
