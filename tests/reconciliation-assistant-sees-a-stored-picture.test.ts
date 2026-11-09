import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import {
  FIDELITY_DECLARATION,
  MAX_IMAGE_EDGE,
  fidelitySurfaceFor,
} from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock, FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { nodeDeps } from '../tools/generate/src/cli/ai/host'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { bundleNameFor } from '../tools/generate/src/store/reference-store'
import {
  writeBundle,
  writeForms,
  writeHints,
  writeL1,
  writeMultiState,
} from '../tools/generate/src/cli/capture/bundle'
import { VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import { decodePng, encodePng, pngDimensions } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import { mergeImageLibraries } from '../tools/generate/src/cli/image-library'
import { siteImageLibrary } from '../tools/generate/src/cli/edit'
import { PreviewRenderer } from '../tools/generate/src/cli/preview'
import { materialImageLibrary } from '../apps/control-app/src/material'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import { syntheticCapture, syntheticL1, syntheticMultiState } from './support/reference-fixtures'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'

/**
 * **The assistant can see a stored picture** (story-58b2cec4, REQ-218) — the
 * sixth picture kind, `image`, and the REQ-218 sharpening of the picture
 * vocabulary's own criteria (AC-2026, AC-2027, AC-2028) — and `compare` taking
 * a stored picture on either side (story-47fb84e6, AC-2490).
 *
 * ENTRY POINT. Every criterion is driven through the consultant's composed
 * Toolbox (`createL1Toolbox` with the looking surface as an extra surface) —
 * the same object both hosts hand the model — so parameter validation, the
 * capability gate, the untrusted-content frame and the refusal envelope are
 * production code. The CLI criterion goes one step further out and builds the
 * looking surface from the `1c` host's own `nodeDeps({ origin })`.
 *
 * WHAT IS REAL. The declaration, the Toolbox, the picture resolver, the name
 * rule (`resolveStoredImage` via `mergeImageLibraries`, assembled exactly as
 * `router.ts` assembles it), the site half (`siteImageLibrary` over a real
 * in-memory `SiteStore`), the Library half (`materialImageLibrary`), the
 * rasteriser's shell document and byte delivery (BUG-80), the reduction and the
 * content-type table.
 *
 * TWO DOUBLES, both genuine external boundaries:
 *   - the BROWSER — a `BrowserDriver` that records every lease, navigation and
 *     evaluated script (so the byte deliveries can be read back),
 *     answers the decode question as a browser would (or reports a failed
 *     decode), and screenshots a real PNG of whatever size it is asked for;
 *   - D1 — the ticket store `materialImageLibrary` reads, answered out of memory
 *     for exactly the four members it reaches for.
 */

// ── pictures with real pixels ────────────────────────────────────────────────

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

/** Bytes that sniff as JPEG — a photograph, as far as the resolver can tell. */
function jpegBytes(tag = 0): Uint8Array {
  const bytes = new Uint8Array(64)
  bytes.set([0xff, 0xd8, 0xff, 0xe0, tag], 0)
  return bytes
}

/** Bytes that sniff as GIF. */
function gifBytes(): Uint8Array {
  return new TextEncoder().encode('GIF89a\u0001\u0000\u0001\u0000')
}

const DRAWING_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">' +
  '<text x="10" y="50">Wordmark</text></svg>'
const svgBytes = (): Uint8Array => new TextEncoder().encode(DRAWING_SVG)

const base64ToBytes = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

/** The PNG signature, base64-encoded — what any PNG payload in a string begins with. */
const PNG_BASE64_HEAD = 'iVBORw0KGgo'

// ── the browser boundary ─────────────────────────────────────────────────────

interface BrowserLog {
  leases: number
  navigated: string[]
  /** Every script the page was asked to evaluate, in order. */
  queried: string[]
}

/**
 * A browser that records what it was asked to do.
 *
 * `layout` is what the decode question is answered with: the size the picture
 * was laid out at, or `null` for a picture the browser would not decode.
 */
function browser(layout: { width: number; height: number } | null = { width: 200, height: 100 }) {
  const log: BrowserLog = { leases: 0, navigated: [], queried: [] }
  class RecordingDriver implements BrowserDriver {
    async navigate(url: string, _viewport?: Viewport): Promise<void> {
      log.navigated.push(url)
    }
    async screenshot(viewport?: Viewport): Promise<Uint8Array> {
      const w = viewport?.width ?? layout?.width ?? 64
      const h = viewport?.height ?? layout?.height ?? 48
      return png(solid(w, h, [12, 34, 56]))
    }
    async query<T>(script: string): Promise<T> {
      log.queried.push(script)
      if (!layout) return { ok: false } as T
      return { ok: true, ...layout, naturalWidth: layout.width, naturalHeight: layout.height } as T
    }
    responses(): CapturedResponse[] {
      return []
    }
    diagnostics() {
      return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
    }
    async content(): Promise<string> {
      return '<html><body></body></html>'
    }
    async close(): Promise<void> {}
  }
  const factory = async (): Promise<BrowserDriver> => {
    log.leases += 1
    return new RecordingDriver()
  }
  return { factory, log }
}

/** The document a `data:text/html` navigation carried, decoded back to text. */
function documentOf(url: string): string {
  expect(url.startsWith('data:text/html;base64,')).toBe(true)
  return new TextDecoder().decode(base64ToBytes(url.slice('data:text/html;base64,'.length)))
}

const bytesToBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64')

/** The base64 one byte delivery carried, or `null` for any other script. */
function deliveredChunk(script: string): string | null {
  return /window\.__pic=window\.__pic\|\|\[\]\)\.push\("([A-Za-z0-9+/=]*)"\)/.exec(script)?.[1] ?? null
}

/**
 * Each rasterisation the browser was asked for, read back out of the scripts it
 * evaluated: the base64 its byte deliveries carried, joined in order, and the
 * script that assembled them into the `<img>` and asked it to decode.
 */
function deliveries(log: BrowserLog): { base64: string; decode: string }[] {
  const out: { base64: string; decode: string }[] = []
  let chunks: string[] = []
  for (const script of log.queried) {
    const chunk = deliveredChunk(script)
    if (chunk !== null) chunks.push(chunk)
    else if (script.includes('img.decode')) {
      out.push({ base64: chunks.join(''), decode: script })
      chunks = []
    }
  }
  return out
}

/**
 * BUG-80 / AC-2485: the `index`th stored picture reached the browser through
 * its delivery channel, not the address it was navigated to. The navigated
 * address is the constant shell (an empty `<img>`, no picture, nothing to
 * fetch); the delivered chunks join to exactly the picture's base64; and the
 * decode script names the picture's own media type.
 */
function expectDeliveredThroughTheShell(
  log: BrowserLog,
  index: number,
  bytes: Uint8Array,
  mediaType: string,
): void {
  const picture = bytesToBase64(bytes)
  const url = log.navigated[index]
  // The shell: the same address for every picture, a few hundred characters.
  expect(url).toBe(log.navigated[0])
  expect(url.length).toBeLessThan(1000)
  expect(url).not.toContain(picture)
  const shell = documentOf(url)
  expect(shell).toContain('<img id="stored">')
  expect(shell).not.toContain(picture)
  expect(shell).not.toContain(';base64,')
  expect(shell).not.toMatch(/https?:\/\//)

  const delivered = deliveries(log)[index]
  expect(delivered, `delivery ${index}`).toBeDefined()
  expect(delivered.base64).toBe(picture)
  expect(delivered.decode).toContain(`'data:${mediaType};base64,'`)
  expect(delivered.decode).not.toContain('application/octet-stream')
  expect(delivered.decode).not.toMatch(/https?:\/\//)
}

// ── the Library, over a D1 answered out of memory ────────────────────────────

interface FakeMaterial {
  uid: string
  type: string
  title: string
  filename: string
  kind: string
  contentType: string
  bytes: Uint8Array
}

function fakeTickets(materials: FakeMaterial[], reads: string[] = []): TicketStore {
  const ticketOf = (m: FakeMaterial): Ticket =>
    ({
      uid: m.uid,
      type: m.type,
      title: m.title,
      status: null,
      human_id: null,
      fields: { kind: m.kind, filename: m.filename, content_type: m.contentType },
      updated_at: '2026-11-08T00:00:00Z',
    }) as unknown as Ticket
  return {
    async list(a?: { type?: string }) {
      reads.push(`list:${a?.type ?? ''}`)
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
        reads.push(`blob:${key}`)
        const m = materials.find((x) => `${x.uid}-file` === key)
        return m ? m.bytes : null
      },
    },
  } as unknown as TicketStore
}

const BANNER: FakeMaterial = {
  uid: 'material-banner',
  type: 'material',
  title: 'Spring banner',
  filename: 'banner-final.jpg',
  kind: 'image',
  contentType: 'image/jpeg',
  bytes: jpegBytes(7),
}

// ── the deployment under test ────────────────────────────────────────────────

const BUNDLE = bundleNameFor({ host: 'example.test', path: '/pricing' })
const ORIGIN = 'https://app.example.test'

/** A complete bundle — everything `check_fidelity` reads before it reaches `actual`. */
async function seededReferences() {
  const store = memoryReferenceStore()
  const bundle = store.bundle(BUNDLE)
  await writeBundle(bundle, {
    capture: syntheticCapture(),
    screenshot: await png(solid(40, 40, [200, 30, 30])),
    renderedHtml: '<html><body><h1>Pricing</h1></body></html>',
    rawHtml: '<html><body>raw</body></html>',
    assetBytes: new Map(),
  })
  await writeMultiState(bundle, syntheticMultiState())
  await writeL1(bundle, syntheticL1())
  await writeForms(bundle, [])
  await writeHints(bundle, { viewport: VIEWPORTS.mobile, mediaBreakpoints: [], nodes: [] })
  return store
}

const sites: SiteFixture[] = []
const workspaces: string[] = []

function site(assets: Record<string, Uint8Array>): SiteFixture {
  const fixture = makeMemorySite({ assets })
  sites.push(fixture)
  return fixture
}

afterEach(async () => {
  while (sites.length > 0) await sites.pop()!.dispose()
  while (workspaces.length > 0) rmSync(workspaces.pop()!, { recursive: true, force: true })
})

/**
 * The Worker's shape of the surface's dependencies: both namespaces merged
 * exactly as `router.ts` merges them, with the browser doubled.
 */
async function workerLooking(
  fixture: SiteFixture,
  opts: {
    materials?: FakeMaterial[]
    reads?: string[]
    layout?: { width: number; height: number } | null
    images?: false
  } = {},
) {
  const eyes = browser(opts.layout === undefined ? { width: 200, height: 100 } : opts.layout)
  const deps: FidelityDeps = {
    slug: fixture.slug,
    origin: ORIGIN,
    references: await seededReferences(),
    driverFactory: eyes.factory,
    guardedDriver: () => eyes.factory,
    ...(opts.images === false
      ? {}
      : {
          images: mergeImageLibraries({
            site: siteImageLibrary(fixture.slug, fixture.store),
            library: materialImageLibrary(fakeTickets(opts.materials ?? [BANNER], opts.reads)),
          }),
        }),
  }
  return { deps, eyes }
}

/** The consultant's Toolbox with the looking surface composed. */
async function consultantBox(fixture: { slug: string; store: SiteFixture['store'] }, deps: FidelityDeps) {
  const lib = await aiCore()
  return createL1Toolbox(fixture.slug, {}, {
    lib,
    store: fixture.store,
    extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, deps) }],
  })
}

/** The content blocks a `screenshot` produced, read out of the Toolbox's rendering. */
function blocksOf(result: unknown): ContentBlock[] {
  if (Array.isArray(result)) return result as ContentBlock[]
  const text = String(result)
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error(`not a picture: ${text.slice(0, 400)}`)
  return JSON.parse(text.slice(start, end + 1)) as ContentBlock[]
}

const textOf = (blocks: ContentBlock[]): string =>
  (blocks.find((b) => b.type === 'text') as { text: string } | undefined)?.text ?? ''

function imageBytesOf(blocks: ContentBlock[]): Uint8Array {
  const image = blocks.find((b) => b.type === 'image') as
    | { source: { data: string; media_type: string } }
    | undefined
  if (!image) throw new Error('no image block')
  expect(image.source.media_type).toBe('image/png')
  return base64ToBytes(image.source.data)
}

async function shoot(box: Awaited<ReturnType<typeof consultantBox>>, of: Record<string, unknown>) {
  return String(await box.run('screenshot', { of }))
}

// ── AC-2026 (REQ-218) — the schema tells the model what applies to an image ──

describe('the picture schema the model is shown carries the sixth kind', () => {
  it('test_UAT_AC2026_the_schema_says_image_and_original_are_image_only_and_viewport_does_not_apply_to_an_image', async () => {
    const fixture = site({})
    const { deps, eyes } = await workerLooking(fixture)
    const box = await consultantBox(fixture, deps)
    const schemas = box.schemas() as Record<
      string,
      { properties: Record<string, Record<string, unknown>> }
    >

    for (const [tool, param] of [
      ['screenshot', 'of'],
      ['compare', 'a'],
      ['compare', 'b'],
      ['check_fidelity', 'actual'],
    ] as const) {
      const shape = schemas[tool].properties[param] as {
        properties: Record<string, { type: string; enum?: string[]; description?: string }>
        additionalProperties: boolean
        required: string[]
      }
      expect(Object.keys(shape.properties).sort(), `${tool}.${param}`).toEqual([
        'after',
        'bundle',
        'image',
        'kind',
        'original',
        'page',
        'revision',
        'url',
        'viewport',
      ])
      expect(shape.properties.kind.enum).toContain('image')
      expect(shape.properties.image.type).toBe('string')
      expect(shape.properties.image.description).toContain('Only for `image`')
      expect(shape.properties.original.type).toBe('boolean')
      expect(shape.properties.original.description).toContain('Only for `image`')
      expect(shape.properties.viewport.description).toMatch(/does not apply to an `image`/)
      expect(shape.required).toEqual(['kind'])
      expect(shape.additionalProperties).toBe(false)
    }

    // An `original` that is not a boolean is refused before the operation runs.
    const wrong = await shoot(box, { kind: 'image', image: 'hero.png', original: 'yes' })
    expect(wrong).toContain('original')
    expect(wrong).not.toContain(PNG_BASE64_HEAD)
    expect(eyes.log.leases).toBe(0)
  })
})

// ── AC-2027 (REQ-218) — the sixth kind resolves to what it names ─────────────

describe('an image picture resolves to the stored picture it names', () => {
  it('test_UAT_AC2027_an_image_picture_resolves_to_the_stored_picture_at_its_own_size_named_by_store_and_title', async () => {
    const stored = await png(solid(60, 30, [9, 120, 200]))
    const fixture = site({ 'hero.png': stored })
    const { deps, eyes } = await workerLooking(fixture, { layout: { width: 300, height: 150 } })
    const box = await consultantBox(fixture, deps)

    // A site asset, with no viewport: its own size, labelled by store and name.
    const siteShot = blocksOf(await shoot(box, { kind: 'image', image: 'hero.png' }))
    expect(textOf(siteShot)).toContain('site image hero.png — 60×30')
    expect(imageBytesOf(siteShot)).toEqual(stored)

    // A viewport is ignored rather than changing the size reported.
    const atMobile = blocksOf(await shoot(box, { kind: 'image', image: 'hero.png', viewport: 'mobile' }))
    expect(textOf(atMobile)).toContain('— 60×30')
    expect(textOf(atMobile)).not.toContain('mobile')

    // A Library item: which store, its exact name, and its Library title.
    const libraryShot = blocksOf(await shoot(box, { kind: 'image', image: 'Spring banner' }))
    expect(textOf(libraryShot)).toContain('library image material-banner (Spring banner) — 300×150')
    expect(pngDimensions(imageBytesOf(libraryShot), 'library')).toEqual({ width: 300, height: 150 })
    expect(eyes.log.leases).toBe(1)
  })
})

// ── AC-2028 (REQ-218) — an image without its field is refused naming it ──────

describe('an image picture missing its name is refused naming the field', () => {
  it('test_UAT_AC2028_an_image_picture_without_image_is_refused_naming_kind_and_field_with_no_browser', async () => {
    const fixture = site({ 'hero.png': await png(solid(8, 8, [1, 1, 1])) })
    const reads: string[] = []
    const { deps, eyes } = await workerLooking(fixture, { reads })
    const box = await consultantBox(fixture, deps)

    const refusal = await shoot(box, { kind: 'image' })
    expect(refusal).toMatch(/^Error: screenshot failed\./)
    expect(refusal).toContain("a picture of kind 'image' needs 'image'")
    expect(refusal).not.toContain(PNG_BASE64_HEAD)
    expect(eyes.log.leases).toBe(0)
  })
})

// ── AC-2483 — one naming rule across both stores ─────────────────────────────

describe('a stored picture is named however it is referenced', () => {
  it('test_UAT_AC2483_site_filename_handle_stem_and_library_id_title_upload_name_resolve_by_one_rule_fonts_excluded', async () => {
    const fixture = site({
      'hero.png': await png(solid(10, 10, [1, 2, 3])),
      'Logo.png': await png(solid(11, 11, [4, 5, 6])),
      'logo.png': await png(solid(12, 12, [7, 8, 9])),
      'brand.woff2': new Uint8Array([0x77, 0x4f, 0x46, 0x32]),
    })
    const { deps } = await workerLooking(fixture, { layout: { width: 90, height: 45 } })
    const box = await consultantBox(fixture, deps)
    const label = async (image: string) => textOf(blocksOf(await shoot(box, { kind: 'image', image })))

    for (const name of ['hero.png', '/assets/hero.png', 'hero']) {
      expect(await label(name), name).toContain('site image hero.png — 10×10')
    }
    for (const name of ['material-banner', 'Spring banner', '  spring BANNER ', 'banner-final.jpg']) {
      expect(await label(name), name).toContain('library image material-banner (Spring banner)')
    }
    // Two pictures differing only by case are each reachable by their exact name.
    expect(await label('Logo.png')).toContain('site image Logo.png — 11×11')
    expect(await label('logo.png')).toContain('site image logo.png — 12×12')

    // A font is not a picture.
    const font = await shoot(box, { kind: 'image', image: 'brand.woff2' })
    expect(font).toMatch(/^Error: screenshot failed\./)
    expect(font).toContain("no stored picture called 'brand.woff2'")
    expect(font).not.toContain(PNG_BASE64_HEAD)
  })
})

// ── AC-2484 — ambiguous and unknown names ────────────────────────────────────

describe('a name that means several pictures, or none, is refused', () => {
  it('test_UAT_AC2484_ambiguous_name_lists_each_exact_name_unknown_points_at_handle_library_and_list_assets', async () => {
    const fixture = site({
      'hero.png': await png(solid(8, 8, [1, 1, 1])),
      'hero.svg': svgBytes(),
    })
    const { deps, eyes } = await workerLooking(fixture)
    const box = await consultantBox(fixture, deps)

    const ambiguous = await shoot(box, { kind: 'image', image: 'hero' })
    expect(ambiguous).toMatch(/^Error: screenshot failed\./)
    expect(ambiguous).toContain("'hero' names 2 pictures")
    expect(ambiguous).toContain("'hero.png'")
    expect(ambiguous).toContain("'hero.svg'")
    expect(ambiguous).toContain('Ask for one of those names')
    expect(ambiguous).not.toContain(PNG_BASE64_HEAD)

    const unknown = await shoot(box, { kind: 'image', image: 'nope' })
    expect(unknown).toContain("no stored picture called 'nope'")
    expect(unknown).toContain('the handle you were given when it was made')
    expect(unknown).toContain('the name it appears under in the Library')
    expect(unknown).toContain('list_assets')
    expect(unknown).not.toContain(PNG_BASE64_HEAD)
    expect(eyes.log.leases).toBe(0)

    // An empty store says it holds none yet.
    const empty = site({})
    const { deps: emptyDeps } = await workerLooking(empty, { materials: [] })
    const emptyBox = await consultantBox(empty, emptyDeps)
    const none = await shoot(emptyBox, { kind: 'image', image: 'anything.png' })
    expect(none).toContain("no stored picture called 'anything.png'")
    expect(none).toContain('This deployment holds none yet.')
    expect(none).not.toContain('list_assets')

    // There is no operation that lists the Library.
    const ops = (FIDELITY_DECLARATION.operations as { op: string }[]).map((o) => o.op)
    expect(ops).not.toContain('list_images')
    expect(Object.keys(box.schemas())).not.toContain('list_images')
  })
})

// ── AC-2485 — PNG untouched; others rasterised inline; reduced; undecodable refused

describe('a stored picture comes back as an image', () => {
  it('test_UAT_AC2485_png_passes_through_others_rasterise_inline_then_reduce_and_an_undecodable_one_is_refused', async () => {
    const stored = await png(solid(50, 20, [90, 90, 90]))
    // A PNG stored under a misleading name: recognised by its bytes, not its type.
    const fixture = site({ 'hero.png': stored, 'actually-png.jpg': stored, 'photo.jpg': jpegBytes(3) })

    // PNG: untouched, no browser, its own size.
    const passthrough = await workerLooking(fixture)
    const box = await consultantBox(fixture, passthrough.deps)
    for (const name of ['hero.png', 'actually-png.jpg']) {
      const blocks = blocksOf(await shoot(box, { kind: 'image', image: name }))
      expect(imageBytesOf(blocks), name).toEqual(stored)
      expect(textOf(blocks)).toContain('— 50×20')
    }
    expect(passthrough.eyes.log.leases).toBe(0)

    // JPEG: a browser is leased, navigated to the constant shell, and handed the
    // bytes through its delivery channel (BUG-80) — never sent to fetch them.
    const blocks = blocksOf(await shoot(box, { kind: 'image', image: 'photo.jpg' }))
    expect(passthrough.eyes.log.leases).toBe(1)
    expect(passthrough.eyes.log.navigated).toHaveLength(1)
    expect(deliveries(passthrough.eyes.log)).toHaveLength(1)
    expectDeliveredThroughTheShell(passthrough.eyes.log, 0, jpegBytes(3), 'image/jpeg')
    expect(pngDimensions(imageBytesOf(blocks), 'jpeg')).toEqual({ width: 200, height: 100 })
    expect(textOf(blocks)).toContain('site image photo.jpg — 200×100')

    // Oversized: reduced exactly as a page shot, and the reported size is after it.
    const big = await workerLooking(fixture, { layout: { width: 2048, height: 512 } })
    const bigBox = await consultantBox(fixture, big.deps)
    const reduced = blocksOf(await shoot(bigBox, { kind: 'image', image: 'photo.jpg' }))
    const raster = await decodePng(imageBytesOf(reduced), 'reduced')
    expect(Math.max(raster.width, raster.height)).toBe(MAX_IMAGE_EDGE)
    expect(textOf(reduced)).toContain(`— ${MAX_IMAGE_EDGE}×256 (reduced from 2048×512)`)

    // Undecodable: refused naming the picture and its stored type, no image.
    const blind = await workerLooking(fixture, { layout: null })
    const blindBox = await consultantBox(fixture, blind.deps)
    const refused = await shoot(blindBox, { kind: 'image', image: 'photo.jpg' })
    expect(refused).toMatch(/^Error: screenshot failed\./)
    expect(refused).toContain("'photo.jpg' is stored as image/jpeg and the browser would not decode it")
    expect(refused).not.toContain(PNG_BASE64_HEAD)
    expect(refused).not.toContain('"type":"image"')
  })
})

// ── AC-2486 — the drawing caption; `after` on an image is refused ────────────

describe('a drawing says how it was photographed, and a stored picture cannot be driven', () => {
  it('test_UAT_AC2486_svg_carries_the_default_face_caption_jpeg_does_not_and_after_is_refused_before_any_read', async () => {
    const fixture = site({ 'wordmark.svg': svgBytes(), 'photo.jpg': jpegBytes(1) })
    const reads: string[] = []
    const { deps, eyes } = await workerLooking(fixture, { reads })
    const box = await consultantBox(fixture, deps)

    const drawing = blocksOf(await shoot(box, { kind: 'image', image: 'wordmark.svg' }))
    const caption = drawing[0] as { type: string; text: string }
    expect(caption.type).toBe('text')
    expect(caption.text).toContain('site image wordmark.svg')
    expect(caption.text).toContain("photographed outside the site's own page")
    expect(caption.text).toContain("browser's default face")
    // EPIC-1 2026-09-11: the caption says what is wrong, not only that something is.
    expect(caption.text).toContain('letter widths and line breaks')
    expect(caption.text).toContain('not evidence')
    expect(caption.text).toContain('measure_drawing')
    expectDeliveredThroughTheShell(eyes.log, 0, svgBytes(), 'image/svg+xml')

    const photo = blocksOf(await shoot(box, { kind: 'image', image: 'photo.jpg' }))
    expect(textOf(photo)).not.toContain('default face')
    expect(textOf(photo)).not.toContain('measure_drawing')

    // `after` on an image: refused before the store is read or a browser leased.
    const leasesBefore = eyes.log.leases
    reads.length = 0
    const driven = await shoot(box, { kind: 'image', image: 'hero.png', after: ['click "Go"'] })
    expect(driven).toMatch(/^Error: screenshot failed\./)
    expect(driven).toContain("only a 'draft' picture can be driven")
    expect(driven).toContain('A stored picture is a picture and not a page')
    expect(driven).toContain('edit_image')
    expect(eyes.log.leases).toBe(leasesBefore)
    expect(reads).toEqual([])
  })
})

// ── AC-2487 — original; the CLI host; no image store ─────────────────────────

/** A `1c` workspace whose site holds one PNG asset on disk. */
function cliWorkspace(slug: string, asset: { name: string; bytes: Uint8Array }): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'stored-picture-'))
  workspaces.push(cwd)
  cmdNew(slug, { cwd })
  const assets = path.join(cwd, 'storage', 'sites', slug, 'draft', 'assets')
  mkdirSync(assets, { recursive: true })
  writeFileSync(path.join(assets, asset.name), asset.bytes)
  return cwd
}

describe('original is labelled, and each host says which pictures it holds', () => {
  it('test_UAT_AC2487_original_is_labelled_the_cli_answers_site_assets_and_says_it_holds_no_library_and_no_store_is_environment', async () => {
    const stored = await png(solid(16, 16, [7, 7, 7]))
    const fixture = site({ 'hero.png': stored })
    const worker = await workerLooking(fixture)
    const box = await consultantBox(fixture, worker.deps)

    // `original: true` — same bytes, and the label says so only when asked.
    const current = blocksOf(await shoot(box, { kind: 'image', image: 'hero.png' }))
    const original = blocksOf(await shoot(box, { kind: 'image', image: 'hero.png', original: true }))
    expect(imageBytesOf(original)).toEqual(imageBytesOf(current))
    expect(textOf(original)).toContain('site image hero.png, as originally stored')
    expect(textOf(current)).not.toContain('as originally stored')

    // The Worker answers for the business's Library too.
    const library = blocksOf(await shoot(box, { kind: 'image', image: 'material-banner' }))
    expect(textOf(library)).toContain('library image material-banner')

    // A deployment wired with no image store refuses as ENVIRONMENT.
    const none = await workerLooking(fixture, { images: false })
    const noneBox = await consultantBox(fixture, none.deps)
    const env = await shoot(noneBox, { kind: 'image', image: 'hero.png' })
    // The code is rendered the way every coded refusal is, e.g.
    // `Error: screenshot failed (INTERACTION_FAILED).` Soft, so the CLI half
    // below is still checked and reported if this one diverges.
    expect.soft(env).toMatch(/^Error: screenshot failed \(ENVIRONMENT\)/)
    expect(env).toContain('there is no image store wired to it')
    expect(env).toContain('carry on with what you can do')
    expect(env).not.toContain(PNG_BASE64_HEAD)

    // The `1c` host, built from its own nodeDeps: site assets answer…
    const slug = 'studio'
    const cwd = cliWorkspace(slug, { name: 'hero.png', bytes: stored })
    const cli = await nodeDeps({ cwd, origin: ORIGIN })
    expect(cli.fidelity).toBeTypeOf('function')
    const cliBox = await consultantBox({ slug, store: cli.store }, cli.fidelity!(slug))
    const cliShot = blocksOf(await shoot(cliBox, { kind: 'image', image: 'hero.png' }))
    expect(textOf(cliShot)).toContain('site image hero.png — 16×16')
    expect(imageBytesOf(cliShot)).toEqual(stored)

    // …and a Library name is refused saying this host holds no Library pictures.
    const cliLibrary = await shoot(cliBox, { kind: 'image', image: 'material-banner' })
    expect(cliLibrary).toMatch(/^Error: screenshot failed\./)
    expect(cliLibrary).not.toContain(PNG_BASE64_HEAD)
    expect.soft(cliLibrary).toMatch(/no Library/i)
    expect.soft(cliLibrary).toMatch(/only the site's own assets/i)
    expect.soft(cliLibrary).not.toContain('the name it appears under in the Library')
  }, 60000)
})

// ── AC-2488 — check_fidelity refuses a stored picture ────────────────────────

describe('check_fidelity needs a live page', () => {
  it('test_UAT_AC2488_check_fidelity_with_an_image_actual_is_refused_pointing_at_compare_with_no_verdict', async () => {
    const fixture = site({ 'hero.png': await png(solid(40, 40, [120, 30, 30])) })
    const { deps } = await workerLooking(fixture)
    const box = await consultantBox(fixture, deps)

    const result = String(
      await box.run('check_fidelity', {
        reference: BUNDLE,
        actual: { kind: 'image', image: 'hero.png' },
      }),
    )
    expect(result).toMatch(/^Error: check_fidelity failed\./)
    expect(result).toContain('the value gates need a live page')
    expect(result).toContain('a picture rather than a page')
    expect(result).toContain('nothing behind it to measure')
    expect(result).toContain('Use compare for a stored picture')
    expect(result).not.toContain('verdict')
  })
})

// ── AC-2490 (story-47fb84e6) — compare takes a stored picture on either side ──

const OPEN = '<<<untrusted>>>\n'
const CLOSE = '\n<<</untrusted>>>'

/** A successful operation's result object, read out of the untrusted frame. */
function resultOf(rendered: string): Record<string, unknown> {
  expect(rendered.startsWith(OPEN), rendered.slice(0, 400)).toBe(true)
  expect(rendered.endsWith(CLOSE)).toBe(true)
  return JSON.parse(rendered.slice(OPEN.length, rendered.length - CLOSE.length)) as Record<string, unknown>
}

describe('compare accepts a stored picture on either side', () => {
  it('test_UAT_AC2490_stored_jpeg_against_a_reference_either_way_crops_to_the_common_top_left_rectangle_and_a_png_against_itself_is_identical', async () => {
    const stored = await png(solid(24, 18, [70, 140, 210]))
    const fixture = site({ 'photo.jpg': jpegBytes(5), 'hero.png': stored })
    // The JPEG is rasterised at 30×120; the seeded reference is 40×40. Their
    // common top-left rectangle is the narrower width and the shorter height,
    // taken from different sides — 30×40 — which neither picture is on its own.
    const { deps, eyes } = await workerLooking(fixture, { layout: { width: 30, height: 120 } })
    const box = await consultantBox(fixture, deps)
    const compare = async (a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(await box.run('compare', { a, b }))

    const reference = { kind: 'reference', bundle: BUNDLE }
    const photo = { kind: 'image', image: 'photo.jpg' }

    const forward = resultOf(await compare(photo, reference))
    const swapped = resultOf(await compare(reference, photo))

    // Each side is labelled by which picture it was, in the order asked.
    expect(String(forward.a)).toContain('site image photo.jpg')
    expect(String(forward.b)).toContain(`reference ${BUNDLE}`)
    expect(String(swapped.a)).toContain(`reference ${BUNDLE}`)
    expect(String(swapped.b)).toContain('site image photo.jpg')

    for (const [name, result] of [
      ['forward', forward],
      ['swapped', swapped],
    ] as const) {
      expect(result.size, name).toEqual({ width: 30, height: 40 })
      expect(typeof result.meanDifference, name).toBe('number')
      expect(typeof result.percentDifferent, name).toBe('number')
      // The two are different colours throughout, so the numbers are not zero.
      expect(result.meanDifference as number, name).toBeGreaterThan(0)
      expect(Array.isArray(result.bands), name).toBe(true)
      expect(Array.isArray(result.regions), name).toBe(true)
    }
    // Swapping the sides changes the labels, not the measurement.
    expect(swapped.meanDifference).toBe(forward.meanDifference)
    expect(swapped.percentDifferent).toBe(forward.percentDifferent)

    // The non-PNG side was rasterised the way `screenshot` rasterises it: the
    // constant shell, then the JPEG's own bytes through the delivery channel.
    expect(eyes.log.navigated).toHaveLength(2)
    expect(deliveries(eyes.log)).toHaveLength(2)
    for (const index of [0, 1]) {
      expectDeliveredThroughTheShell(eyes.log, index, jpegBytes(5), 'image/jpeg')
    }

    // A Library picture is labelled as one when it is a side.
    const library = resultOf(await compare(reference, { kind: 'image', image: 'Spring banner' }))
    expect(String(library.b)).toContain('library image material-banner')
    expect(library.size).toEqual({ width: 30, height: 40 })

    // Two stored pictures: a PNG against itself is identical, at its own size.
    const leasesBefore = eyes.log.leases
    const self = resultOf(
      await compare({ kind: 'image', image: 'hero.png' }, { kind: 'image', image: 'hero.png' }),
    )
    expect(String(self.a)).toContain('site image hero.png')
    expect(String(self.b)).toContain('site image hero.png')
    expect(self.size).toEqual({ width: 24, height: 18 })
    expect(self.meanDifference).toBe(0)
    expect(self.percentDifferent).toBe(0)
    // A PNG passes straight through: no browser was leased for it.
    expect(eyes.log.leases).toBe(leasesBefore)
  })
})

// ── AC-2489 — .gif and .avif are pictures ────────────────────────────────────

describe('.gif and .avif site assets carry their image content types', () => {
  it('test_UAT_AC2489_gif_and_avif_assets_are_served_and_listed_as_image_gif_and_image_avif', async () => {
    const fixture = site({ 'anim.gif': gifBytes(), 'photo.avif': new Uint8Array([0, 0, 0, 0x1c]) })

    // Served through the preview channel with their image types.
    const renderer = new PreviewRenderer(fixture.store)
    const gif = await renderer.file(fixture.slug, 'draft', '/assets/anim.gif')
    const avif = await renderer.file(fixture.slug, 'draft', '/assets/photo.avif')
    expect(gif?.contentType).toBe('image/gif')
    expect(avif?.contentType).toBe('image/avif')

    // Listed as stored pictures with those types.
    const listed = await siteImageLibrary(fixture.slug, fixture.store).list()
    const typeOf = (name: string) => listed.find((i) => i.name === name)?.mediaType
    expect(typeOf('anim.gif')).toBe('image/gif')
    expect(typeOf('photo.avif')).toBe('image/avif')

    // And the `image` kind hands that type to the browser.
    const { deps, eyes } = await workerLooking(fixture)
    const box = await consultantBox(fixture, deps)
    blocksOf(await shoot(box, { kind: 'image', image: 'anim.gif' }))
    blocksOf(await shoot(box, { kind: 'image', image: 'photo.avif' }))
    expect(eyes.log.navigated).toHaveLength(2)
    expectDeliveredThroughTheShell(eyes.log, 0, gifBytes(), 'image/gif')
    expectDeliveredThroughTheShell(eyes.log, 1, new Uint8Array([0, 0, 0, 0x1c]), 'image/avif')
  })
})
