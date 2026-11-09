import { describe, expect, it } from 'vitest'
import { renderL1Document } from '../packages/framework/src/index'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { assetRefSchema } from '../packages/site-schema/src/schema'

/**
 * STORY-d0a8cfad (L1 layout substrate rendered safe by construction) — the
 * REQ-222 delivery ladder as the renderer sees it: a manifest supplied by the
 * publish is a render INPUT, never a document field, and every rendition URL it
 * carries goes through the same sinks as an authored one.
 *
 * Every case drives the real `validateL1` → `renderL1Document` boundary — the
 * same pair the publish and the draft channels call — and asserts on the
 * emitted HTML/CSS bytes.
 */

const WIDTHS = [320, 640, 1280]

/** The manifest a publish of one 2000px-wide `hero.jpg` would produce. */
const HERO_MANIFEST = {
  'hero.jpg': {
    width: 2000,
    height: 1000,
    renditions: [
      { src: 'assets/d/abc123-320.jpg', width: 320 },
      { src: 'assets/d/abc123-640.jpg', width: 640 },
      { src: 'assets/hero.jpg', width: 2000 },
    ],
  },
}

const HERO_SRCSET =
  'srcset="assets/d/abc123-320.jpg 320w, assets/d/abc123-640.jpg 640w, assets/hero.jpg 2000w"'

/** The manifest for a 4000px band backdrop. */
const BAND_MANIFEST = {
  'band.jpg': {
    width: 4000,
    height: 2000,
    renditions: [
      { src: 'assets/d/beef01-320.jpg', width: 320 },
      { src: 'assets/d/beef01-640.jpg', width: 640 },
      { src: 'assets/d/beef01-1280.jpg', width: 1280 },
      { src: 'assets/band.jpg', width: 4000 },
    ],
  },
}

type RenderOpts = Parameters<typeof renderL1Document>[1]

function validDoc(child: L1Node, column?: L1Document['column']): L1Document {
  const doc: L1Document = {
    widths: WIDTHS,
    root: { kind: 'box', children: [child] },
    ...(column ? { column } : {}),
  }
  const res = validateL1(doc)
  expect(res.ok, res.ok ? '' : JSON.stringify(res.errors)).toBe(true)
  return doc
}

/** One image leaf in a validated document, rendered — returns the `<img>` tag. */
function renderImg(
  node: Record<string, unknown> & { src: string },
  opts: RenderOpts = {},
  column?: L1Document['column'],
): string {
  const image = { kind: 'image', alt: 'a picture', ...node } as unknown as L1Node
  const html = renderL1Document(validDoc(image, column), opts).html
  const tag = /<img\b[^>]*>/.exec(html)
  expect(tag, html).not.toBeNull()
  return tag![0]
}

/** One box carrying a surface, validated and rendered — returns the stylesheet. */
function renderBoxCss(box: Record<string, unknown>, opts: RenderOpts = {}): string {
  const node = { kind: 'box', children: [], ...box } as unknown as L1Node
  return renderL1Document(validDoc(node), opts).css
}

/** Every `background-image` value in a stylesheet fragment, in order. */
function backgroundImages(css: string): string[] {
  return [...css.matchAll(/background-image:\s*([^;}]+)/g)].map((m) => m[1].trim())
}

/** The stylesheet split into the part before any `@media` and each media block. */
function splitMedia(css: string): { base: string; media: { width: number; body: string }[] } {
  const parts = css.split('@media')
  const media = parts.slice(1).map((body) => {
    const m = /^\s*\(min-width:\s*(\d+)px\)/.exec(body)
    return { width: m ? Number(m[1]) : NaN, body }
  })
  return { base: parts[0], media }
}

/** Media blocks that restate `background-image`. */
function backgroundOverrides(css: string): { width: number; images: string[] }[] {
  return splitMedia(css)
    .media.map((m) => ({ width: m.width, images: backgroundImages(m.body) }))
    .filter((m) => m.images.length > 0)
}

describe('STORY-d0a8cfad — the delivery ladder in the renderer (REQ-222)', () => {
  it('test_UAT_AC2529_manifest_render_emits_srcset_and_computed_sizes_and_plain_render_is_unchanged', () => {
    // Column-anchored: one condition per ladder width, then the saturated width.
    const column = { containerPx: 1152, insetPx: 24 }
    const anchored = renderImg(
      {
        src: '/assets/hero.jpg',
        geometry: {
          keyframes: [{ at: 320, x: 0, y: 0, width: 272, height: 200 }],
          anchor: { width: { fraction: 1 } },
        },
      },
      { delivery: HERO_MANIFEST },
      column,
    )
    expect(anchored).toContain('src="assets/hero.jpg"')
    expect(anchored).toContain(HERO_SRCSET)
    // extent = min(1152, vw) - 48: 272 @320, 592 @640, 1104 @1280, saturating at 1104.
    expect(anchored).toContain(
      'sizes="(max-width: 320px) 272px, (max-width: 640px) 592px, (max-width: 1280px) 1104px, 1104px"',
    )

    // Keyframed: one condition per segment at its upper bound, then the last width.
    const keyframed = renderImg(
      {
        src: '/assets/hero.jpg',
        geometry: {
          keyframes: [
            { at: 320, x: 0, y: 0, width: 300, height: 200 },
            { at: 640, x: 0, y: 0, width: 500, height: 300 },
            { at: 1280, x: 0, y: 0, width: 900, height: 600 },
          ],
          segments: ['interpolate', 'snap'],
        },
      },
      { delivery: HERO_MANIFEST },
    )
    expect(keyframed).toContain(HERO_SRCSET)
    expect(keyframed).toContain('sizes="(max-width: 640px) 500px, (max-width: 1280px) 500px, 900px"')

    // Fixed px: that length.
    const fixed = renderImg(
      { src: '/assets/hero.jpg', sizing: { width: { mode: 'fixed', px: 420 } } },
      { delivery: HERO_MANIFEST },
    )
    expect(fixed).toContain(HERO_SRCSET)
    expect(fixed).toContain('sizes="420px"')

    // Capped fluid: (max-width: M) 100vw, M.
    const capped = renderImg(
      { src: '/assets/hero.jpg', sizing: { width: { mode: 'fluid', maxPx: 720 } } },
      { delivery: HERO_MANIFEST },
    )
    expect(capped).toContain('sizes="(max-width: 720px) 100vw, 720px"')

    // Uncapped fluid and hug: srcset, no sizes.
    for (const mode of ['fluid', 'hug'] as const) {
      const open = renderImg(
        { src: '/assets/hero.jpg', sizing: { width: { mode } } },
        { delivery: HERO_MANIFEST },
      )
      expect(open, mode).toContain(HERO_SRCSET)
      expect(open, mode).not.toContain('sizes=')
    }

    // The three spellings of a flat site asset all match the same entry.
    for (const src of ['/assets/hero.jpg', 'assets/hero.jpg', './assets/hero.jpg']) {
      expect(renderImg({ src }, { delivery: HERO_MANIFEST }), src).toContain(HERO_SRCSET)
    }

    // Absolute, subdirectory, query and fragment references get no ladder.
    for (const src of [
      'https://example.com/assets/hero.jpg',
      '/assets/nested/hero.jpg',
      '/assets/hero.jpg?v=2',
      '/assets/hero.jpg#x',
    ]) {
      const tag = renderImg({ src, sizing: { width: { mode: 'fixed', px: 420 } } }, { delivery: HERO_MANIFEST })
      expect(tag, src).not.toContain('srcset=')
      expect(tag, src).not.toContain('sizes=')
    }

    // A sizes is never emitted without a srcset; one surviving candidate is no srcset.
    const lone = renderImg(
      { src: '/assets/hero.jpg', sizing: { width: { mode: 'fixed', px: 420 } } },
      {
        delivery: {
          'hero.jpg': {
            width: 2000,
            height: 1000,
            renditions: [
              { src: 'javascript:alert(1)', width: 320 },
              { src: 'assets/hero.jpg', width: 2000 },
            ],
          },
        },
      },
    )
    expect(lone).not.toContain('srcset=')
    expect(lone).not.toContain('sizes=')

    // Without a manifest (draft / edit) or for an unmentioned picture: the plain
    // <img src>, byte-identical to the pre-ladder render.
    const node = { src: '/assets/hero.jpg', sizing: { width: { mode: 'fixed', px: 420 } } }
    const plain = renderImg(node)
    expect(renderImg(node, {})).toBe(plain)
    for (const attr of ['srcset=', 'sizes=', 'width="', 'height="']) {
      expect(plain).not.toContain(attr)
    }
    const unmentioned = renderImg({ ...node, src: '/assets/other.png' }, { delivery: HERO_MANIFEST })
    expect(unmentioned).toBe(renderImg({ ...node, src: '/assets/other.png' }))
  })

  it('test_UAT_AC2530_laddered_img_carries_the_measured_intrinsic_width_and_height', () => {
    // Exactly the manifest entry's dimensions, not a rendition's.
    const tag = renderImg({ src: '/assets/hero.jpg' }, { delivery: HERO_MANIFEST })
    expect(tag).toContain(' width="2000"')
    expect(tag).toContain(' height="1000"')

    // Present even when no srcset survives: they follow the entry, not the srcset.
    const noSrcset = renderImg(
      { src: '/assets/hero.jpg' },
      {
        delivery: {
          'hero.jpg': {
            width: 1600,
            height: 900,
            renditions: [
              { src: 'javascript:alert(1)', width: 320 },
              { src: 'assets/hero.jpg', width: 1600 },
            ],
          },
        },
      },
    )
    expect(noSrcset).not.toContain('srcset=')
    expect(noSrcset).toContain(' width="1600"')
    expect(noSrcset).toContain(' height="900"')

    // Absent with no manifest, and for a picture the manifest does not mention.
    for (const tagWithout of [
      renderImg({ src: '/assets/hero.jpg' }),
      renderImg({ src: '/assets/other.png' }, { delivery: HERO_MANIFEST }),
    ]) {
      expect(tagWithout).not.toMatch(/\swidth="/)
      expect(tagWithout).not.toMatch(/\sheight="/)
    }

    // Absent when either recorded dimension is non-finite or not positive.
    for (const [width, height] of [
      [2000, 0],
      [0, 1000],
      [-5, 1000],
      [Number.NaN, 1000],
      [2000, Number.POSITIVE_INFINITY],
    ]) {
      const bad = renderImg(
        { src: '/assets/hero.jpg' },
        { delivery: { 'hero.jpg': { ...HERO_MANIFEST['hero.jpg'], width, height } } },
      )
      expect(bad, `${width}x${height}`).not.toMatch(/\swidth="/)
      expect(bad, `${width}x${height}`).not.toMatch(/\sheight="/)
    }

    // Hints only: the node's own width rule is still a stylesheet rule.
    const doc = validDoc({
      kind: 'image',
      src: '/assets/hero.jpg',
      alt: 'a picture',
      sizing: { width: { mode: 'fixed', px: 420 } },
    } as unknown as L1Node)
    const withManifest = renderL1Document(doc, { delivery: HERO_MANIFEST })
    const without = renderL1Document(doc)
    expect(withManifest.css).toContain('width: 420px')
    expect(withManifest.css).toBe(without.css)
  })

  it('test_UAT_AC2531_background_ladder_bases_on_the_smallest_width_and_overrides_only_where_the_choice_changes', () => {
    // A box 150px wide at 320 and 640 (snap holds it), 700px wide from 1280.
    // At 2× that wants 300 → the 320 rendition twice, then 1400 → only the
    // original covers it.
    const box = {
      axes: { backgroundImageUrl: '/assets/band.jpg' },
      geometry: {
        keyframes: [
          { at: 320, x: 0, y: 0, width: 150, height: 100 },
          { at: 640, x: 0, y: 0, width: 150, height: 100 },
          { at: 1280, x: 0, y: 0, width: 700, height: 400 },
        ],
        segments: ['snap', 'snap'],
      },
    }
    const css = renderBoxCss(box, { delivery: BAND_MANIFEST })
    const { base } = splitMedia(css)
    expect(backgroundImages(base)).toContain('url("assets/d/beef01-320.jpg")')

    const overrides = backgroundOverrides(css)
    // One override, at the width where the choice changes, and none at 640.
    expect(overrides.map((o) => o.width)).toEqual([1280])
    expect(overrides[0].images).toEqual(['url("assets/band.jpg")'])
    expect(css).not.toContain('image-set(')

    // A full-bleed band (width not owned → the viewport): 640 @320, 1280 @640,
    // original @1280 — a change at every rung, so an override at each.
    const band = renderBoxCss({ axes: { backgroundImageUrl: '/assets/band.jpg' } }, { delivery: BAND_MANIFEST })
    expect(backgroundImages(splitMedia(band).base)).toContain('url("assets/d/beef01-640.jpg")')
    expect(backgroundOverrides(band)).toEqual([
      { width: 640, images: ['url("assets/d/beef01-1280.jpg")'] },
      { width: 1280, images: ['url("assets/band.jpg")'] },
    ])

    // No manifest, no entry, or a single-rendition entry: exactly as before.
    const plain = renderBoxCss(box)
    expect(renderBoxCss(box, { delivery: {} })).toBe(plain)
    expect(
      renderBoxCss(box, {
        delivery: {
          'band.jpg': { width: 4000, height: 2000, renditions: [{ src: 'assets/band.jpg', width: 4000 }] },
        },
      }),
    ).toBe(plain)
    expect(plain).toContain('url("assets/band.jpg")')
    expect(plain).not.toContain('assets/d/')
    expect(backgroundOverrides(plain)).toEqual([])

    // No document ladder: exactly as before.
    const noLadderNode = { kind: 'box', children: [], axes: { backgroundImageUrl: '/assets/band.jpg' } } as unknown as L1Node
    const noLadder: L1Document = { widths: [], root: { kind: 'box', children: [noLadderNode] } } as unknown as L1Document
    expect(renderL1Document(noLadder, { delivery: BAND_MANIFEST }).css).toBe(renderL1Document(noLadder).css)
  })

  it('test_UAT_AC2532_per_width_background_override_restates_the_whole_layer_stack_and_never_drops_the_image', () => {
    const axes = {
      backgroundImageUrl: '/assets/band.jpg',
      overlay: { color: '#000000', opacity: 0.5 },
      pattern: { shape: 'dots', spacingPx: 16, color: '#ffffff' },
      surfaceGradient: { angleDeg: 90, stops: [{ color: '#112233' }, { color: '#445566' }] },
    }
    const css = renderBoxCss({ axes }, { delivery: BAND_MANIFEST })
    const { base } = splitMedia(css)
    const [baseImage] = backgroundImages(base)
    expect(baseImage).toBeDefined()

    // The base stack: scrim, texture, gradient, image — image last.
    const scrimAt = baseImage.indexOf('linear-gradient(#00000080')
    const gradientAt = baseImage.indexOf('#112233')
    const imageAt = baseImage.indexOf('url("assets/d/beef01-640.jpg")')
    expect(scrimAt).toBeGreaterThanOrEqual(0)
    expect(gradientAt).toBeGreaterThan(scrimAt)
    expect(imageAt).toBeGreaterThan(gradientAt)
    expect(baseImage.endsWith('url("assets/d/beef01-640.jpg")')).toBe(true)

    // Every override is the base stack with only the image URL swapped.
    const overrides = backgroundOverrides(css)
    expect(overrides.length).toBeGreaterThan(0)
    const baseStack = baseImage.slice(0, imageAt)
    for (const o of overrides) {
      expect(o.images, `@${o.width}`).toHaveLength(1)
      const value = o.images[0]
      expect(value.startsWith(baseStack), `@${o.width}: ${value}`).toBe(true)
      expect(value.slice(baseStack.length), `@${o.width}`).toMatch(/^url\("assets\/[^"]+"\)$/)
      // The override restates background-image only.
      const media = splitMedia(css).media.find((m) => m.width === o.width)!.body
      expect(media).not.toMatch(/background-(size|position|repeat)\s*:/)
    }

    // The base still carries the sizing triple, positionally aligned: four layers.
    for (const prop of ['size', 'position', 'repeat']) {
      const m = new RegExp(`background-${prop}:\\s*([^;}]+)`).exec(base)
      expect(m, prop).not.toBeNull()
      expect(m![1].split(',').length, prop).toBe(4)
    }
    expect(/background-repeat:\s*([^;}]+)/.exec(base)![1].trim().endsWith('no-repeat')).toBe(true)

    // A chosen rendition that fails the url() sink paints the authored URL, with
    // the scrim and gradient still present — the image layer is never dropped.
    const hostile = {
      'band.jpg': {
        width: 4000,
        height: 2000,
        renditions: [
          { src: 'javascript:alert(1)', width: 640 },
          { src: 'assets/d/beef01-1280.jpg', width: 1280 },
          { src: 'assets/band.jpg', width: 4000 },
        ],
      },
    }
    const fallback = renderBoxCss({ axes }, { delivery: hostile })
    expect(fallback).not.toContain('javascript:')
    const [fallbackBase] = backgroundImages(splitMedia(fallback).base)
    expect(fallbackBase).toContain('linear-gradient(#00000080')
    expect(fallbackBase).toContain('#112233')
    expect(fallbackBase.endsWith('url("assets/band.jpg")')).toBe(true)
    for (const o of backgroundOverrides(fallback)) {
      expect(o.images[0], `@${o.width}`).toMatch(/url\("assets\/[^"]+"\)$/)
      expect(o.images[0]).toContain('linear-gradient(#00000080')
    }
  })

  it('test_UAT_AC2533_document_carries_no_delivery_fields_and_rendition_urls_pass_url_safety', () => {
    // The asset reference keeps exactly its authored shape.
    expect(Object.keys(assetRefSchema.shape).sort()).toEqual(['alt', 'focalPoint', 'id', 'src'])
    // A delivery key on an asset reference is STRIPPED, not refused: the schema
    // is unchanged (REQ-222) and is not strict, so the reference parses and the
    // key never survives into the parsed value — nothing downstream can read it.
    for (const key of ['srcset', 'sizes', 'renditions']) {
      const parsed = assetRefSchema.safeParse({ id: 'a', src: '/assets/hero.jpg', alt: 'x', [key]: 'v' })
      expect(parsed.success, key).toBe(true)
      if (parsed.success) {
        expect(Object.keys(parsed.data).sort(), key).toEqual(['alt', 'id', 'src'])
        expect(parsed.data, key).not.toHaveProperty(key)
      }
    }

    // An image node carrying a delivery key is refused as an unknown key.
    for (const key of ['srcset', 'sizes', 'renditions']) {
      const doc = {
        widths: WIDTHS,
        root: {
          kind: 'box',
          children: [{ kind: 'image', src: '/assets/hero.jpg', alt: 'a picture', [key]: 'x 320w' }],
        },
      }
      const res = validateL1(doc)
      expect(res.ok, key).toBe(false)
      if (!res.ok) {
        expect(
          res.errors.some((e) => /Unrecognized key/i.test(e.message) && e.message.includes(key)),
          `${key}: ${JSON.stringify(res.errors)}`,
        ).toBe(true)
      }
    }

    // Hostile renditions are dropped from srcset; the safe candidates remain.
    const hostile = {
      'hero.jpg': {
        width: 2000,
        height: 1000,
        renditions: [
          { src: 'javascript:alert(1)', width: 320 },
          { src: 'assets/d/one,two-480.jpg', width: 480 },
          { src: 'assets/d/sp ace-560.jpg', width: 560 },
          { src: 'assets/d/q"uote-600.jpg', width: 600 },
          { src: 'assets/d/ok-960.jpg', width: 960 },
          { src: 'assets/hero.jpg', width: 2000 },
        ],
      },
    }
    const tag = renderImg({ src: '/assets/hero.jpg' }, { delivery: hostile })
    expect(tag).toContain('srcset="assets/d/ok-960.jpg 960w, assets/hero.jpg 2000w"')
    for (const bad of ['javascript:', 'one,two', 'sp ace', 'q"uote', '480w', '560w', '600w']) {
      expect(tag, bad).not.toContain(bad)
    }

    // A background rendition passes the same url() sanitisation.
    const css = renderBoxCss(
      { axes: { backgroundImageUrl: '/assets/band.jpg' } },
      {
        delivery: {
          'band.jpg': {
            width: 4000,
            height: 2000,
            renditions: [
              { src: 'javascript:alert(1)', width: 640 },
              { src: 'assets/band.jpg', width: 4000 },
            ],
          },
        },
      },
    )
    expect(css).not.toContain('javascript:')
    expect(css).toContain('url("assets/band.jpg")')

    // A prototype-named src yields no ladder.
    const proto = renderImg(
      { src: '/assets/__proto__', sizing: { width: { mode: 'fixed', px: 420 } } },
      { delivery: HERO_MANIFEST },
    )
    expect(proto).not.toContain('srcset=')
    expect(proto).not.toContain('sizes=')
    expect(proto).not.toMatch(/\swidth="/)
  })
})
