import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ladderFor } from '../apps/control-app/src/image-ladder'
import { encodePng, pngDimensions } from '../tools/generate/src/cli/png'
import { publishSite } from '../tools/generate/src/publish/publish'
import { d1r2SiteStore } from '../tools/generate/src/store/d1r2-store'
import { publishedOutPrefix } from '../tools/generate/src/store/revision-model'
import { applySchema } from './support/d1-site-factory'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * REQ-234 — a band's backdrop served in WebP, through the real binding.
 *
 * WHAT THIS PROVES THAT THE NODE SUITE CANNOT. The node tests drive a fake sizer
 * that returns whatever it is told to, so they prove the POLICY: what the
 * declaration says, in what order, with which fallback. What they cannot prove is
 * the thing this ticket actually rests on — **that the bytes behind a
 * `type("image/webp")` option really are a WebP**.
 *
 * AND THE FAILURE IS UNRECOVERABLE, which is why it is worth a real binding. A
 * browser that reads WebP takes the first option whose `type()` it supports and
 * never looks at the rest; if those bytes are a PNG the band simply does not
 * paint, for nearly every visitor, with nothing on the page able to find out. The
 * plain `url()` declaration before it does not help — the browser understood the
 * `image-set()` perfectly well, which is precisely why it discarded the earlier
 * declaration.
 */

const TENANT = 'req234'

/** A real PNG, `width` × `height`, with content that does not compress to nothing. */
async function picture(width: number, height: number): Promise<Uint8Array> {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = (i * 7) % 256
    data[i * 3 + 1] = (i * 13) % 256
    data[i * 3 + 2] = (i * 29) % 256
  }
  return encodePng({ data, width, height, channels: 3 })
}

/** The scaffolder's home page, with one full-bleed band carrying a backdrop. */
function pageWithABand(slug: string): Record<string, unknown> {
  return {
    ...starterHomePage(slug),
    l1: {
      widths: [320, 1280],
      root: {
        kind: 'box',
        children: [
          { kind: 'box', children: [], axes: { backgroundImageUrl: '/assets/band.png' } },
        ],
      },
    },
  }
}

/** A tenant-scoped store, and a site in it whose ONLY picture is a backdrop. */
async function siteWithABand(bytes: Uint8Array) {
  const platform = d1r2SiteStore({ DB: env.DB, SITES: env.SITES })
  await platform.createTenant({ id: TENANT, name: TENANT, status: 'active' })
  const store = await platform.forTenant(TENANT)
  const slug = nextSlug('req234')
  const seed = siteSeed({ slug, pages: { 'home.json': pageWithABand(slug) } })
  await store.createDraft(slug)
  await store.write(slug, {
    siteJson: seed.siteJson,
    pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
    assets: [{ name: 'band.png', bytes }],
  })
  return { store, slug }
}

/** The ladder this deployment builds — the real binding, the real bucket. */
function realLadder() {
  const built = ladderFor(env as unknown as Parameters<typeof ladderFor>[0], {
    businessId: TENANT,
  })
  expect(built, 'the workerd project declares an IMAGES binding').not.toBeNull()
  return built!
}

/** Every `background-image` declaration in a published page, in emitted order. */
function bgDecls(html: string): string[] {
  return html
    .split(/[;{}]/)
    .map((d) => d.trim())
    .filter((d) => d.startsWith('background-image:'))
}

describe('REQ-234 — a backdrop in WebP, through the real binding', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('offers a WebP whose bytes really are a WebP, behind a plain url()', async () => {
    const { store, slug } = await siteWithABand(await picture(1400, 700))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const out = publishedOutPrefix((await store.siteKey(slug))!, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()

    const decls = bgDecls(html)
    expect(decls.length).toBeGreaterThanOrEqual(2)
    // The plain declaration comes first and names the SOURCE format, so a browser
    // with no `image-set()` is left holding a picture it can certainly read.
    expect(decls[0]).not.toContain('image-set(')
    expect(decls[0]).toContain('.png')
    expect(decls[1]).toContain('image-set(')

    const webp = /url\("([^"]+\.webp)"\) type\("image\/webp"\)/.exec(decls[1])
    expect(webp, 'the published stylesheet offers a WebP option').not.toBeNull()
    // …and the source format closes the set, as the option a browser that reads
    // no alternative lands on.
    expect(decls[1]).toMatch(/url\("[^"]+\.png"\) type\("image\/png"\)\)$/)

    const object = await env.SITES.get(`${out}/${webp![1]}`)
    expect(object, `${webp![1]} was painted but not written`).not.toBeNull()
    const bytes = new Uint8Array(await object!.arrayBuffer())
    // THE ASSERTION THE NODE SUITE CANNOT MAKE: `RIFF....WEBP` is the container's
    // own magic, read here rather than taken from a content type nobody set.
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF')
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WEBP')
  })

  it('paints only renditions this same publish wrote, in both declarations', async () => {
    // A stylesheet naming bytes the bucket does not hold is a 404 on the band —
    // and the browser will have chosen that option precisely because it preferred
    // the format.
    const { store, slug } = await siteWithABand(await picture(1500, 750))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const out = publishedOutPrefix((await store.siteKey(slug))!, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()

    const painted = [...html.matchAll(/url\("(assets\/d\/[^"]+)"\)/g)].map((m) => m[1])
    expect(painted.some((src) => src.endsWith('.webp'))).toBe(true)
    expect(painted.some((src) => src.endsWith('.png'))).toBe(true)
    for (const src of painted) {
      const object = await env.SITES.get(`${out}/${src}`)
      expect(object, `${src} was painted but not written`).not.toBeNull()
      // Every source-format rung is still a real PNG at the width it claims —
      // which is what makes the plain declaration a fallback rather than a second
      // copy of the WebP ladder.
      if (!src.endsWith('.png')) continue
      const bytes = new Uint8Array(await object!.arrayBuffer())
      const claimed = Number(/-(\d+)\.png$/.exec(src)![1])
      expect(pngDimensions(bytes).width, src).toBe(claimed)
    }
  })

  it('gives a backdrop below the smallest step no image-set() at all', async () => {
    // The body's plainest promise, kept on this side too: such a picture is served
    // exactly as it is. A lone WebP rendition of a file that already fits every box
    // it appears in is a transform and an R2 write for a few kilobytes.
    const { store, slug } = await siteWithABand(await picture(300, 150))
    const result = await publishSite(store, slug, { ladder: realLadder() })
    const out = publishedOutPrefix((await store.siteKey(slug))!, result.id)
    const html = await (await env.SITES.get(`${out}/home.html`))!.text()
    expect(html).not.toContain('image-set(')
    expect(html).toContain('url("assets/band.png")')
  })
})
