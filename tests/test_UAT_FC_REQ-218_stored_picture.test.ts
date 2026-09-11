import { describe, expect, it } from 'vitest'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { L1_DECLARATION, L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import {
  FIDELITY_DECLARATION,
  MAX_IMAGE_EDGE,
  fidelityOperations,
  fidelitySurfaceFor,
} from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock, FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { bundleNameFor } from '../tools/generate/src/store/reference-store'
import { writeBundle } from '../tools/generate/src/cli/capture/bundle'
import { syntheticCapture } from './support/reference-fixtures'
import { decodePng, encodePng, sniffImageFormat } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { resolvePicture } from '../tools/generate/src/cli/picture'
import { DRAWING_RASTER_NOTE } from '../tools/generate/src/cli/picture'
import {
  mergeImageLibraries,
  resolveStoredImage,
} from '../tools/generate/src/cli/image-library'
import type { ImageLibrary, StoredImage } from '../tools/generate/src/cli/image-library'
import { siteImageLibrary } from '../tools/generate/src/cli/edit'
import { materialImageLibrary } from '../apps/control-app/src/material'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'

/**
 * REQ-218 — **the assistant can look at a stored image: a sixth picture kind.**
 *
 * THE FAILURE THIS SUITE IS ABOUT. Five kinds of picture were five kinds of
 * PAGE, so the assistant could see every page in the product and no picture in
 * it — not one it generated, not one the client uploaded, not an SVG it drew
 * itself — and the client's experience of that was being apologised to about a
 * picture made ten seconds earlier.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The declaration is the shipped one, checked
 * by the framework's own validator. The Toolbox is the real one, so parameter
 * validation, the capability gate and the manual projection are production code.
 * The site half of the image library is the REAL `siteImageLibrary` over a real
 * `SiteStore`, and the Library half is the REAL `materialImageLibrary` — the
 * name rule, the listing and the reads are all the shipped functions.
 *
 * TWO THINGS ARE DOUBLES, both of them genuine external boundaries reached over
 * a wire. The browser is the seam the whole `BrowserDriver` design exists to have
 * injected. D1 is the other: `materialImageLibrary` is given a store object that
 * answers `list`, `get`, `attachments` and `blobs` out of memory, which is what
 * the component's own handle does over the network. Everything between them —
 * resolution, the refusals, the PNG normalisation, the reduction cap and the
 * diff — is the real thing.
 *
 * WHY THE PICTURES ARE REAL PNGs. Half of what is under test is what happens to
 * pixels: the cap resamples, `compare` decodes and diffs, and a fixture that
 * could not be decoded would let every one of those assertions pass vacuously.
 */

// ── real pictures ────────────────────────────────────────────────────────────

/** A solid-colour raster — something with real, predictable pixels. */
function solid(width: number, height: number, rgb: [number, number, number]): Raster {
  const data = new Uint8Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    data[i * 3] = rgb[0]
    data[i * 3 + 1] = rgb[1]
    data[i * 3 + 2] = rgb[2]
  }
  return { data, width, height, channels: 3 }
}

const png = (raster: Raster): Promise<Uint8Array> => encodePng(raster)

/**
 * Bytes that sniff as a JPEG, standing in for a photograph.
 *
 * They do not have to decode: nothing on this side of the browser seam ever
 * decodes them, and that is the property under test — a stored JPEG reaches the
 * model without this product owning a JPEG decoder. What matters is that
 * `sniffImageFormat` reads them as JPEG, so the resolver takes the branch a real
 * photograph takes.
 */
function jpegBytes(): Uint8Array {
  const bytes = new Uint8Array(64)
  bytes.set([0xff, 0xd8, 0xff, 0xe0], 0)
  return bytes
}

/** A real, valid SVG drawing — the kind `write_image` writes. */
const DRAWING_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">' +
  '<rect width="200" height="100" fill="#101820"/></svg>'

const svgBytes = (): Uint8Array => new TextEncoder().encode(DRAWING_SVG)

// ── the browser, doubled ─────────────────────────────────────────────────────

/**
 * A driver that decodes whatever it is shown and records where it was sent.
 *
 * IT RECORDS BECAUSE HALF OF WHAT RASTERISATION HAS TO GET RIGHT IS WHAT IT PUT
 * IN FRONT OF THE BROWSER. A rasteriser that navigated to the draft would return
 * a perfectly valid picture of the wrong thing, and no assertion about the pixels
 * would catch it — so the document it navigated to is asserted directly, and the
 * bytes it carried are read back out of it.
 */
class RasterDriver implements BrowserDriver {
  static navigated: string[] = []
  private url = ''
  constructor(private readonly size: { width: number; height: number }) {}

  async navigate(url: string, _viewport?: Viewport): Promise<void> {
    this.url = url
    RasterDriver.navigated.push(url)
  }
  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    // The real driver screenshots whatever the viewport now is, so the double
    // does too: a resolver that asked for the wrong size would be visible as a
    // picture of the wrong size rather than silently correct.
    const w = viewport?.width ?? this.size.width
    const h = viewport?.height ?? this.size.height
    return png(solid(w, h, [12, 34, 56]))
  }
  async query<T>(_script: string): Promise<T> {
    // Answers the decode question the way a browser that could read the image
    // does. The document is a `data:` URL, so what was handed over is readable
    // back off `this.url` — which is what the navigation assertions use.
    return { ok: true, ...this.size, naturalWidth: this.size.width, naturalHeight: this.size.height } as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>raster</body></html>'
  }
  async close(): Promise<void> {}
}

/** The document a `data:text/html` navigation carried, decoded back to text. */
function documentOf(url: string): string {
  const b64 = url.slice('data:text/html;base64,'.length)
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))
}

// ── the Library, over a store that answers out of memory ─────────────────────

interface FakeMaterial {
  uid: string
  /** `material` for an upload or a generated picture; `reference` for a capture. */
  type: string
  title: string
  filename: string
  kind: string
  contentType: string
  bytes: Uint8Array
}

/**
 * A ticket store holding material and nothing else.
 *
 * Only the four members `materialImageLibrary` and `materialFile` actually reach
 * for are implemented, because the rest are D1 verbs this code never calls and a
 * stub of each would be thirty lines asserting nothing.
 */
function fakeTickets(materials: FakeMaterial[]): TicketStore {
  const ticketOf = (m: FakeMaterial): Ticket =>
    ({
      uid: m.uid,
      type: m.type,
      title: m.title,
      status: null,
      human_id: null,
      fields: { kind: m.kind, filename: m.filename, content_type: m.contentType },
      updated_at: '2026-09-10T00:00:00Z',
    }) as unknown as Ticket

  return {
    // BY TYPE, because `listMaterial` asks twice — once for `material` and once
    // for `reference` — and a fake that ignored the argument would answer both
    // with everything and hand back every picture twice.
    async list(a?: { type?: string }) {
      return { tickets: materials.filter((m) => m.type === a?.type).map(ticketOf) }
    },
    async get({ uid }: { uid: string }) {
      const m = materials.find((x) => x.uid === uid)
      if (!m) throw new Error(`no such material ${uid}`)
      return { ticket: ticketOf(m) }
    },
    async attachments({ uid }: { uid: string }) {
      const m = materials.find((x) => x.uid === uid)!
      return {
        attachments: [
          {
            uid: `${uid}-file`,
            type: 'attachment',
            fields: { filename: m.filename, content_type: m.contentType },
          } as unknown as Ticket,
        ],
      }
    },
    blobs: {
      async get(key: string) {
        const m = materials.find((x) => `${x.uid}-file` === key)
        return m ? m.bytes : null
      },
    },
  } as unknown as TicketStore
}

// ── the deployment under test ────────────────────────────────────────────────

const BUNDLE = bundleNameFor({ host: 'example.test', path: '/pricing' })
const ORIGIN = 'https://app.example.test'

/** A reference store holding one bundle, so `compare` has a real other side. */
async function seededReferences(shot: Uint8Array) {
  const store = memoryReferenceStore()
  await writeBundle(store.bundle(BUNDLE), {
    capture: syntheticCapture(),
    screenshot: shot,
    renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
    rawHtml: '<html><body>raw</body></html>',
    assetBytes: new Map(),
  })
  return store
}

/**
 * The surface's dependencies, assembled the way a real deployment assembles
 * them: both namespaces merged through the shipped `mergeImageLibraries`.
 */
async function deps(
  site: SiteFixture,
  materials: FakeMaterial[],
  opts: { raster?: { width: number; height: number }; images?: false } = {},
): Promise<FidelityDeps> {
  const references = await seededReferences(await png(solid(40, 40, [200, 30, 30])))
  const size = opts.raster ?? { width: 200, height: 100 }
  return {
    slug: site.slug,
    origin: ORIGIN,
    references,
    driverFactory: async () => new RasterDriver(size),
    guardedDriver: () => async () => new RasterDriver(size),
    ...(opts.images === false
      ? {}
      : {
          images: mergeImageLibraries({
            site: siteImageLibrary(site.slug, site.store),
            library: materialImageLibrary(fakeTickets(materials)),
          }),
        }),
  }
}

const SUNRISE: FakeMaterial = {
  uid: 'material-sunrise',
  type: 'material',
  title: 'A sunrise over the bay',
  filename: 'sunrise.jpg',
  kind: 'image',
  contentType: 'image/jpeg',
  bytes: jpegBytes(),
}

/** A site holding a drawing and a photograph among its assets. */
function siteWithPictures(extra: Record<string, Uint8Array> = {}): SiteFixture {
  return makeMemorySite({
    assets: { 'wordmark.svg': svgBytes(), 'brochure.woff2': new Uint8Array([1, 2]), ...extra },
  })
}

// ── AC1 — both namespaces, one name ──────────────────────────────────────────

describe('REQ-218 AC1 — a stored picture is addressable however it is referenced', () => {
  it('test_UAT_FC_REQ_218_a_stored_picture_is_named_however_it_is_referenced', async () => {
    const site = siteWithPictures()
    try {
      const library = mergeImageLibraries({
        site: siteImageLibrary(site.slug, site.store),
        library: materialImageLibrary(fakeTickets([SUNRISE])),
      })
      const images = await library.list()

      // BOTH STORES, ONE LIST. The client asking about "the logo" does not know
      // which of the two holds it, and this is the assertion that they no longer
      // have to.
      expect(images.map((i) => i.where).sort()).toEqual(['library', 'site'])

      const named = (name: string): StoredImage | null => resolveStoredImage(name, images).match

      // The site's drawing, by every spelling a caller can be holding: the
      // filename `list_assets` shows, the handle a page node carries, and the
      // bare stem `write_image` was called with.
      expect(named('wordmark.svg')?.name).toBe('wordmark.svg')
      expect(named('/assets/wordmark.svg')?.name).toBe('wordmark.svg')
      expect(named('wordmark')?.name).toBe('wordmark.svg')

      // The Library's photograph, by its record, by the title the Library shows
      // it under, and by the name the client's own file has.
      expect(named('material-sunrise')?.where).toBe('library')
      expect(named('A sunrise over the bay')?.name).toBe('material-sunrise')
      expect(named('sunrise.jpg')?.name).toBe('material-sunrise')
      // A title is a sentence somebody typed; holding the model to its
      // capitalisation would be a riddle rather than a name.
      expect(named('a sunrise over the bay')?.name).toBe('material-sunrise')

      // A FONT IS NOT A PICTURE. It is in `list_assets` and there is nothing to
      // look at, so it is not in this list and cannot be asked for.
      expect(images.some((i) => i.name === 'brochure.woff2')).toBe(false)
      expect(named('brochure.woff2')).toBeNull()
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ_218_a_name_that_means_two_pictures_is_refused_with_both', async () => {
    const site = siteWithPictures({ 'hero.png': await png(solid(8, 8, [1, 1, 1])), 'hero.jpg': jpegBytes() })
    try {
      const ops = fidelityOperations(await deps(site, [SUNRISE]))

      // `hero` is the stem of two different files, so it is two pictures. The
      // refusal names both, because the caller is one call from being right and
      // a picture handed back as though it were the one they meant is a wrong
      // answer that looks like a right one.
      await expect(
        ops.screenshot({ of: { kind: 'image', image: 'hero' } }),
      ).rejects.toThrow(/2 pictures.*hero\.jpg.*hero\.png|2 pictures.*hero\.png.*hero\.jpg/s)

      // Each of them is still reachable, by the name that means exactly one.
      const blocks = (await ops.screenshot({
        of: { kind: 'image', image: 'hero.png' },
      })) as ContentBlock[]
      expect(blocks[0]).toMatchObject({ type: 'text' })
      expect((blocks[0] as { text: string }).text).toContain('hero.png')

      // And a name nobody has is a NOT_FOUND that says where to look, not a
      // guess at the nearest thing — and it names the listings that exist rather
      // than a Library listing, which deliberately is not one of them.
      await expect(
        ops.screenshot({ of: { kind: 'image', image: 'logo-final-v2.png' } }),
      ).rejects.toThrow(/no stored picture called 'logo-final-v2\.png'.*list_assets/s)
    } finally {
      await site.dispose()
    }
  })
})

// ── AC2 — one kind, over both stores, and no second way in ──────────────────

describe('REQ-218 AC2 — the sixth kind is declared, and nothing else was added', () => {
  it('test_UAT_FC_REQ_218_the_sixth_kind_reaches_both_stores_through_one_verb', async () => {
    const site = siteWithPictures()
    try {
      const lib = await aiCore()
      const fidelity = await deps(site, [SUNRISE])
      const box = await createL1Toolbox(site.slug, {}, {
        lib,
        store: site.store,
        extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, fidelity) }],
      })

      // NO NEW VERB. A Library listing is a different capability and is
      // deliberately not here: a picture's handle arrives in the result of
      // whatever made it, which is the case this whole thing is for. What the
      // sixth kind cost the surface is one enum entry and two fields.
      const tools = Object.keys(box.schemas())
      expect(tools).toContain('screenshot')
      expect(tools).not.toContain('list_images')

      // And both stores are reached through the verb that was already there.
      const ops = fidelityOperations(fidelity)
      const drawing = (await ops.screenshot({
        of: { kind: 'image', image: 'wordmark' },
      })) as ContentBlock[]
      const upload = (await ops.screenshot({
        of: { kind: 'image', image: 'A sunrise over the bay' },
      })) as ContentBlock[]
      expect((drawing[0] as { text: string }).text).toContain('site image wordmark.svg')
      expect((upload[0] as { text: string }).text).toContain('library image material-sunrise')
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ_218_the_declaration_carries_the_sixth_kind', async () => {
    // Through the framework's OWN validator, which is the check DOC-30 puts in
    // CI: a declaration that failed here would fail at session construction, on
    // a deployment, with a turn already in flight.
    const { validateData } = await aiCore()
    const report = validateData([L1_DECLARATION, FIDELITY_DECLARATION], L1_INSTANCES)
    expect(report.problems).toEqual([])

    const picture = (
      FIDELITY_DECLARATION.param_types as Record<
        string,
        { keys: Record<string, { enum?: string[]; description?: string }> }
      >
    ).picture
    expect(picture.keys.kind.enum).toEqual([
      'reference',
      'draft',
      'edit',
      'revision',
      'url',
      'image',
    ])
    // The two fields the sixth kind takes are declared, so the model is shown
    // they exist rather than guessing at them.
    expect(picture.keys.image).toBeDefined()
    expect(picture.keys.original).toBeDefined()
    // And the paragraph the epic turns on: looking is deliberate, because an
    // image stays in every turn after this one.
    expect(FIDELITY_DECLARATION.overview as string).toMatch(/stays\s+in every turn after this one/)
  })
})

// ── AC3 — the picture comes back as a picture ────────────────────────────────

describe('REQ-218 AC3 — screenshot answers for a stored picture as it does for a page', () => {
  it('test_UAT_FC_REQ_218_a_stored_picture_comes_back_as_a_picture', async () => {
    // Bigger than the model's cap in both axes, so the reduction is exercised
    // rather than merely present.
    const stored = await png(solid(MAX_IMAGE_EDGE + 400, 600, [9, 120, 200]))
    const site = siteWithPictures({ 'poster.png': stored })
    try {
      RasterDriver.navigated = []
      const ops = fidelityOperations(await deps(site, [SUNRISE]))
      const blocks = (await ops.screenshot({
        of: { kind: 'image', image: 'poster.png' },
      })) as ContentBlock[]

      // AN IMAGE, NOT A DESCRIPTION OF ONE. The whole ticket is this assertion.
      const image = blocks.find((b) => b.type === 'image')
      expect(image).toBeDefined()
      expect((image as { source: { media_type: string } }).source.media_type).toBe('image/png')

      // Reduced on the way in, by the machinery that already reduces a page
      // shot — which is what "exactly as a page screenshot is" has to mean.
      const text = (blocks.find((b) => b.type === 'text') as { text: string }).text
      expect(text).toContain('site image poster.png')
      expect(text).toMatch(/reduced from 1424×600/)
      const shown = await decodePng(
        Uint8Array.from(atob((image as { source: { data: string } }).source.data), (c) =>
          c.charCodeAt(0),
        ),
      )
      expect(Math.max(shown.width, shown.height)).toBeLessThanOrEqual(MAX_IMAGE_EDGE)

      // A STORED PNG NEVER REACHED THE BROWSER. It is already the currency
      // everything downstream speaks, so re-rendering it would cost a lease and
      // flatten its transparency for bytes no better than the ones we had.
      expect(RasterDriver.navigated).toEqual([])
    } finally {
      await site.dispose()
    }
  })

  it('test_UAT_FC_REQ_218_a_photograph_reaches_the_model_with_no_decoder_in_this_product', async () => {
    const site = siteWithPictures()
    try {
      RasterDriver.navigated = []
      const ops = fidelityOperations(await deps(site, [SUNRISE], { raster: { width: 300, height: 200 } }))

      // A JPEG. `png.ts` decodes PNG and says so — REQ-156 replaced the native
      // codec deliberately — so this is the case that had no answer before.
      const blocks = (await ops.screenshot({
        of: { kind: 'image', image: 'A sunrise over the bay' },
      })) as ContentBlock[]

      // It went in front of the one decoder this product already owns, carrying
      // its own bytes: a Library blob is in a private bucket behind Access and
      // there is no URL this browser could fetch it from.
      expect(RasterDriver.navigated).toHaveLength(1)
      const document = documentOf(RasterDriver.navigated[0])
      expect(document).toContain('src="data:image/jpeg;base64,')
      expect(document).toContain('margin:0')

      // And it came back in the currency everything downstream speaks.
      const image = blocks.find((b) => b.type === 'image') as {
        source: { media_type: string; data: string }
      }
      expect(image.source.media_type).toBe('image/png')
      expect(
        sniffImageFormat(Uint8Array.from(atob(image.source.data), (c) => c.charCodeAt(0))),
      ).toBe('PNG')
      const text = (blocks.find((b) => b.type === 'text') as { text: string }).text
      expect(text).toContain('library image material-sunrise (A sunrise over the bay)')
    } finally {
      await site.dispose()
    }
  })
})

// ── AC4 — compare gains it for free ──────────────────────────────────────────

describe('REQ-218 AC4 — compare measures a stored picture against anything', () => {
  it('test_UAT_FC_REQ_218_compare_measures_a_stored_picture_against_a_reference', async () => {
    // The reference is red; the stored picture is a different red. `compare`
    // decodes both and reports a real number, which it can only do because the
    // resolver handed it a raster rather than a stored file it cannot read.
    const site = siteWithPictures({ 'hero.png': await png(solid(40, 40, [120, 30, 30])) })
    try {
      const ops = fidelityOperations(await deps(site, [SUNRISE]))
      const result = (await ops.compare({
        a: { kind: 'reference', bundle: BUNDLE },
        b: { kind: 'image', image: 'hero.png' },
      })) as {
        a: string
        b: string
        meanDifference: number
        percentDifferent: number
        size: { width: number; height: number }
      }

      // BOTH SIDES NAMED, so a comparison against the wrong picture is visible
      // in the answer rather than only in the number.
      expect(result.a).toContain(BUNDLE)
      expect(result.b).toContain('site image hero.png')
      expect(result.size).toEqual({ width: 40, height: 40 })
      // 200 against 120 in one channel — a real measurement, not a zero from two
      // things that failed to decode into the same emptiness.
      expect(result.meanDifference).toBeGreaterThan(20)
      expect(result.percentDifferent).toBeGreaterThan(90)
    } finally {
      await site.dispose()
    }
  })
})

// ── AC5 — what a drawing gives up, and what a picture cannot be asked ────────

describe('REQ-218 AC5 — a drawing says what it gave up, and no picture can be driven', () => {
  it('test_UAT_FC_REQ_218_a_drawing_says_what_it_gave_up_and_cannot_be_driven', async () => {
    const site = siteWithPictures()
    try {
      RasterDriver.navigated = []
      const fidelity = await deps(site, [SUNRISE])
      const picture = await resolvePicture({ kind: 'image', image: 'wordmark' }, fidelity)

      // THE CAPTION IS THE POINT. A drawing is photographed outside the site's
      // own page, so its text is in the browser's default face rather than the
      // one the site serves — and a model that had to INFER that is a model that
      // reports a font substitution as a finding about the drawing.
      expect(picture.note).toBe(DRAWING_RASTER_NOTE)
      expect(picture.note).toContain('measure_drawing')
      expect(documentOf(RasterDriver.navigated[0])).toContain('src="data:image/svg+xml;base64,')

      // The caption travels with the picture into what the model actually reads.
      const blocks = (await fidelityOperations(fidelity).screenshot({
        of: { kind: 'image', image: 'wordmark' },
      })) as ContentBlock[]
      expect((blocks[0] as { text: string }).text).toContain("browser's default face")

      // A STORED PICTURE IS NOT A PAGE. There is nothing on it to click, and
      // changing what it shows is a deliberate act with its own verb.
      await expect(
        resolvePicture(
          { kind: 'image', image: 'wordmark', after: ['click "Sign in"'] },
          fidelity,
        ),
      ).rejects.toThrow(/only a 'draft' picture can be driven.*'image'.*edit_image/s)
    } finally {
      await site.dispose()
    }
  })
})

// ── AC6 — the original, and a deployment that holds no pictures ──────────────

describe('REQ-218 AC6 — the original is askable, and a host without a store says so', () => {
  it('test_UAT_FC_REQ_218_the_original_is_askable_and_a_host_that_holds_none_says_so', async () => {
    const site = siteWithPictures({ 'hero.png': await png(solid(16, 16, [7, 7, 7])) })
    try {
      // ASKED FOR AND CARRIED, which is what makes this the seam the renderer
      // fills in rather than a parameter added later in a second shape. Until
      // the recipe exists every picture is its own original, so the two answers
      // are the same bytes — and the label still says which was asked for, so a
      // transcript stays readable once they differ.
      const asked: { name: string; original: boolean }[] = []
      const watched: ImageLibrary = {
        list: () => siteImageLibrary(site.slug, site.store).list(),
        read: (image, opts) => {
          asked.push({ name: image.name, original: opts.original })
          return siteImageLibrary(site.slug, site.store).read(image, opts)
        },
      }
      const fidelity = { ...(await deps(site, [SUNRISE])), images: watched }

      const current = await resolvePicture({ kind: 'image', image: 'hero.png' }, fidelity)
      const original = await resolvePicture(
        { kind: 'image', image: 'hero.png', original: true },
        fidelity,
      )
      expect(asked).toEqual([
        { name: 'hero.png', original: false },
        { name: 'hero.png', original: true },
      ])
      expect(original.label).toContain('as originally stored')
      expect(current.label).not.toContain('as originally stored')
      // Where no recipe exists the two are the same image.
      expect(original.bytes).toEqual(current.bytes)

      // A DEPLOYMENT THAT HOLDS NONE SAYS SO, rather than answering as though
      // the store were empty — the same honest shape as a deployment with no
      // browser, and the difference between "there is no picture called that"
      // and "this deployment cannot show you pictures".
      const blind = fidelityOperations(await deps(site, [SUNRISE], { images: false }))
      await expect(
        blind.screenshot({ of: { kind: 'image', image: 'hero.png' } }),
      ).rejects.toThrow(/no image store/)
    } finally {
      await site.dispose()
    }
  })
})
