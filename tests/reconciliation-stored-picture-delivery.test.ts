import { afterEach, describe, expect, it } from 'vitest'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fidelitySurfaceFor } from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock, FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import {
  ImageNotRenderableError,
  INJECT_CHUNK_CHARS,
  MAX_DRIVER_ERROR_CHARS,
  MAX_STORED_PICTURE_BYTES,
  rasterizeImage,
  safeDriverMessage,
} from '../tools/generate/src/cli/capture/screenshot'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { mergeImageLibraries } from '../tools/generate/src/cli/image-library'
import { siteImageLibrary } from '../tools/generate/src/cli/edit'
import { encodePng } from '../tools/generate/src/cli/png'
import { materialImageLibrary } from '../apps/control-app/src/material'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

/**
 * **A stored picture of any ordinary size reaches the browser, and a failure on
 * the way there comes back as a sentence, never as a payload** (story-58b2cec4,
 * BUG-80: AC-2564, AC-2565, AC-2566).
 *
 * ENTRY POINT. Where the criterion is about what the model receives, it is driven
 * through the consultant's composed Toolbox (`createL1Toolbox` with the looking
 * surface composed, `screenshot` of `kind: 'image'`) — the same object both hosts
 * hand the model — with the site half (`siteImageLibrary` over a real in-memory
 * `SiteStore`) and the Library half (`materialImageLibrary`) merged as `router.ts`
 * merges them. Where the criterion is about every way the browser can fail, the
 * shipped `rasterizeImage` is driven directly with a browser that fails on cue.
 *
 * DOUBLES, both genuine external boundaries: the BROWSER (a `BrowserDriver` that
 * records every lease, navigation and evaluated script, and screenshots a real
 * PNG) and D1 (the ticket store `materialImageLibrary` reads, answered out of
 * memory).
 */

// ── pictures ─────────────────────────────────────────────────────────────────

/** Bytes that sniff as a JPEG, as long as asked for — a camera photograph. */
function photograph(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  bytes[0] = 0xff
  bytes[1] = 0xd8
  bytes[2] = 0xff
  for (let i = 3; i < length; i++) bytes[i] = (i * 7) % 251
  return bytes
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

async function solidPng(width: number, height: number): Promise<Uint8Array> {
  const data = new Uint8Array(width * height * 3).fill(80)
  return encodePng({ data, width, height, channels: 3 })
}

// ── the browser boundary ─────────────────────────────────────────────────────

interface Failures {
  /** Reject the navigation, Playwright-style: `"<code> at <url>"`. */
  navigate?: string
  /** Reject the first byte delivery, quoting the script back. */
  delivery?: boolean
  /** Reject the shot itself with this message. */
  screenshot?: string
  /** Answer the decode question as a browser that would not decode it. */
  undecodable?: boolean
}

interface BrowserLog {
  leases: number
  closed: number
  navigated: string[]
  queried: string[]
}

function browser(fail: Failures = {}) {
  const log: BrowserLog = { leases: 0, closed: 0, navigated: [], queried: [] }
  class RecordingDriver implements BrowserDriver {
    async navigate(url: string, _viewport?: Viewport): Promise<void> {
      log.navigated.push(url)
      if (fail.navigate) throw new Error(`${fail.navigate} at ${url}`)
    }
    async screenshot(viewport?: Viewport): Promise<Uint8Array> {
      if (fail.screenshot) throw new Error(fail.screenshot)
      return solidPng(viewport?.width ?? 64, viewport?.height ?? 48)
    }
    async query<T>(script: string): Promise<T> {
      log.queried.push(script)
      if (fail.delivery && script.includes('window.__pic=window.__pic')) {
        throw new Error(`Evaluation failed: SyntaxError\n=== evaluated ===\n${script}`)
      }
      if (script.includes('img.decode')) {
        if (fail.undecodable) return { ok: false } as T
        return { ok: true, width: 200, height: 100, naturalWidth: 4000, naturalHeight: 2000 } as T
      }
      return log.queried.length as T
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
    async close(): Promise<void> {
      log.closed += 1
    }
  }
  const factory = async (): Promise<BrowserDriver> => {
    log.leases += 1
    return new RecordingDriver()
  }
  return { factory, log }
}

/** The base64 one byte delivery carried, or `null` for any other script. */
function deliveredChunk(script: string): string | null {
  return /window\.__pic=window\.__pic\|\|\[\]\)\.push\("([A-Za-z0-9+/=]*)"\)/.exec(script)?.[1] ?? null
}

/** Nothing that escapes this path may carry a payload. */
const REFUSAL_CAP = MAX_DRIVER_ERROR_CHARS + 300
function expectNoPayload(message: string): void {
  expect(message.length).toBeLessThanOrEqual(REFUSAL_CAP)
  expect(message).not.toMatch(/data:[a-z]/i)
  expect(message).not.toMatch(/[A-Za-z0-9+/=]{120,}/)
}

// ── the Library, over a D1 answered out of memory ────────────────────────────

interface FakeMaterial {
  uid: string
  title: string
  filename: string
  contentType: string
  bytes: Uint8Array
}

function fakeTickets(materials: FakeMaterial[]): TicketStore {
  const ticketOf = (m: FakeMaterial): Ticket =>
    ({
      uid: m.uid,
      type: 'material',
      title: m.title,
      status: null,
      human_id: null,
      fields: { kind: 'image', filename: m.filename, content_type: m.contentType },
      updated_at: '2026-11-09T00:00:00Z',
    }) as unknown as Ticket
  return {
    async list(a?: { type?: string }) {
      return { tickets: a?.type === 'material' ? materials.map(ticketOf) : [] }
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
        return materials.find((x) => `${x.uid}-file` === key)?.bytes ?? null
      },
    },
  } as unknown as TicketStore
}

// ── the deployment under test ────────────────────────────────────────────────

const sites: SiteFixture[] = []

function site(assets: Record<string, Uint8Array>): SiteFixture {
  const fixture = makeMemorySite({ assets })
  sites.push(fixture)
  return fixture
}

afterEach(async () => {
  while (sites.length > 0) await sites.pop()!.dispose()
})

/** The consultant's Toolbox with the looking surface composed, Worker-shaped. */
async function consultant(
  fixture: SiteFixture,
  opts: { fail?: Failures; materials?: FakeMaterial[] } = {},
) {
  const eyes = browser(opts.fail)
  const deps: FidelityDeps = {
    slug: fixture.slug,
    origin: 'https://app.example.test',
    references: memoryReferenceStore(),
    driverFactory: eyes.factory,
    guardedDriver: () => eyes.factory,
    images: mergeImageLibraries({
      site: siteImageLibrary(fixture.slug, fixture.store),
      library: materialImageLibrary(fakeTickets(opts.materials ?? [])),
    }),
  }
  const lib = await aiCore()
  const box = await createL1Toolbox(fixture.slug, {}, {
    lib,
    store: fixture.store,
    extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, deps) }],
  })
  const shoot = async (of: Record<string, unknown>): Promise<string> =>
    String(await box.run('screenshot', { of }))
  return { shoot, eyes }
}

function blocksOf(rendered: string): ContentBlock[] {
  const start = rendered.indexOf('[')
  const end = rendered.lastIndexOf(']')
  if (start < 0 || end < start) throw new Error(`not a picture: ${rendered.slice(0, 400)}`)
  return JSON.parse(rendered.slice(start, end + 1)) as ContentBlock[]
}

// ── AC-2564 — a multi-MB photograph is photographed; the address is a constant shell

describe('an ordinary camera photograph can be looked at', () => {
  it('test_UAT_AC2564_a_12mb_jpeg_comes_back_as_an_image_through_a_constant_shell_and_bounded_deliveries', async () => {
    const camera = photograph(12_000_000) // ~11× past the old ≈1.1 MB data: URL limit
    const tiny = photograph(600)
    const fixture = site({ 'DSC_7975.jpg': camera, 'thumb.jpg': tiny })
    const { shoot, eyes } = await consultant(fixture)

    // The big one comes back as a PNG image, the same as a small one.
    const big = await shoot({ kind: 'image', image: 'DSC_7975.jpg' })
    expect(big).not.toMatch(/^Error:/)
    const blocks = blocksOf(big)
    const image = blocks.find((b) => b.type === 'image') as
      | { source: { media_type: string; data: string } }
      | undefined
    expect(image?.source.media_type).toBe('image/png')
    expect(image?.source.data.startsWith('iVBORw0KGgo')).toBe(true)
    expect(big).toContain('site image DSC_7975.jpg — 200×100')

    // ONE short navigation, carrying nothing of the picture.
    expect(eyes.log.leases).toBe(1)
    expect(eyes.log.navigated).toHaveLength(1)
    const bigAddress = eyes.log.navigated[0]
    expect(bigAddress.length).toBeLessThan(1000)
    const base64 = toBase64(camera)
    expect(bigAddress).not.toContain(base64.slice(0, 64))
    expect(bigAddress).not.toMatch(/https?:\/\//)

    // The bytes arrived afterwards, in several bounded pieces that join to the picture.
    const chunks = eyes.log.queried.map(deliveredChunk).filter((c): c is string => c !== null)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(INJECT_CHUNK_CHARS)
    expect(chunks.join('')).toBe(base64)
    // No evaluated script is unbounded either.
    for (const script of eyes.log.queried) {
      expect(script.length).toBeLessThanOrEqual(INJECT_CHUNK_CHARS + 500)
    }

    // The tiny one is navigated to the very same address.
    const small = await shoot({ kind: 'image', image: 'thumb.jpg' })
    expect(small).not.toMatch(/^Error:/)
    expect(eyes.log.navigated).toHaveLength(2)
    expect(eyes.log.navigated[1]).toBe(bigAddress)

    // The browser was released after each.
    expect(eyes.log.closed).toBe(2)
  }, 60_000)
})

// ── AC-2565 — any browser failure is a bounded, payload-free refusal ─────────

describe('a browser failure on the stored-picture path comes back as a sentence', () => {
  it('test_UAT_AC2565_navigate_delivery_shot_and_novel_failures_are_bounded_named_refusals_and_the_browser_is_released', async () => {
    const bytes = photograph(3_000_000)
    const hugePayload = 'A'.repeat(4_000_000)

    // (a) navigation rejects quoting a multi-MB data: URL — and through the tool,
    //     what the model reads is the same bounded sentence.
    {
      const fixture = site({ 'DSC_7975.jpg': bytes })
      const { shoot, eyes } = await consultant(fixture, {
        fail: { navigate: `net::ERR_ABORTED at data:text/html;base64,${hugePayload}` },
      })
      const refused = await shoot({ kind: 'image', image: 'DSC_7975.jpg' })
      expect(refused).toMatch(/^Error: screenshot failed\./)
      expect(refused).toContain('DSC_7975.jpg')
      expect(refused).toContain('net::ERR_ABORTED')
      expect(refused).toContain('There is no picture to show you')
      expectNoPayload(refused)
      expect(refused).not.toContain('"type":"image"')
      expect(eyes.log.closed).toBe(eyes.log.leases)
      expect(eyes.log.leases).toBe(1)
    }

    const cases: Array<{ label: string; fail: Failures; code?: string }> = [
      {
        label: 'navigate',
        fail: { navigate: `net::ERR_ABORTED at data:text/html;base64,${hugePayload}` },
        code: 'net::ERR_ABORTED',
      },
      // (b) a byte delivery rejects, quoting its script (the picture's base64) back.
      { label: 'delivery', fail: { delivery: true }, code: 'SyntaxError' },
      // (c) the shot itself rejects, echoing a large payload.
      {
        label: 'screenshot',
        fail: {
          screenshot: `Protocol error (Page.captureScreenshot): net::ERR_FAILED ${hugePayload} data:image/png;base64,${hugePayload}`,
        },
        code: 'net::ERR_FAILED',
      },
    ]

    for (const c of cases) {
      const eyes = browser(c.fail)
      const err = await rasterizeImage(bytes, 'image/jpeg', eyes.factory, "'DSC_7975.jpg'").catch(
        (e: unknown) => e,
      )
      expect(err, c.label).toBeInstanceOf(ImageNotRenderableError)
      const message = (err as Error).message
      expect(message, c.label).toContain('DSC_7975.jpg')
      expect(message, c.label).toContain('There is no picture to show you')
      if (c.code) expect(message, c.label).toContain(c.code)
      expectNoPayload(message)
      expect(eyes.log.closed, `${c.label}: browser released`).toBe(1)
    }

    // (e) the lease itself rejects, its message carrying a multi-MB data: URL and
    //     a base64 run. No driver exists, so there is nothing to release, but what
    //     escapes is the same bounded sentence with the driver's own code kept.
    {
      const failingLease = async (): Promise<BrowserDriver> => {
        throw new Error(
          `browserType.launch: Target page, context or browser has been closed (E_LAUNCH) ` +
            `while opening data:text/html;base64,${hugePayload} ${hugePayload}`,
        )
      }
      const err = await rasterizeImage(bytes, 'image/jpeg', failingLease, "'DSC_7975.jpg'").catch(
        (e: unknown) => e,
      )
      expect(err, 'lease').toBeInstanceOf(ImageNotRenderableError)
      const message = (err as Error).message
      expect(message, 'lease').toContain('DSC_7975.jpg')
      expect(message, 'lease').toContain('There is no picture to show you')
      expect(message, 'lease').toContain('E_LAUNCH')
      expectNoPayload(message)
      const diagnosis = /could not be put in front of the browser: ([\s\S]*)\. There is no picture/.exec(
        message,
      )?.[1]
      expect(diagnosis, 'lease: diagnosis present').toBeDefined()
      expect(diagnosis!.length, 'lease: diagnosis capped').toBeLessThanOrEqual(MAX_DRIVER_ERROR_CHARS)
    }

    // (d) a novel multi-KB message with no data: and no base64 is still cut.
    const novel = `Target closed unexpectedly: ${'the renderer went away, '.repeat(400)}`
    const cut = safeDriverMessage(new Error(novel))
    expect(cut.length).toBeLessThanOrEqual(MAX_DRIVER_ERROR_CHARS + 1)
    expect(cut.startsWith('Target closed unexpectedly')).toBe(true)
    expect(cut.endsWith('…')).toBe(true)
  }, 60_000)
})

// ── AC-2566 — the sanity ceiling; an unsafe media type is neutralised ────────

describe('an absurd picture costs no browser, and a stored media type cannot escape the src', () => {
  it('test_UAT_AC2566_over_64mib_is_refused_before_a_lease_and_an_injected_media_type_becomes_the_named_decode_refusal', async () => {
    // Over the ceiling: refused by size, naming the picture, no browser taken.
    const fixture = site({ 'enormous.jpg': photograph(MAX_STORED_PICTURE_BYTES + 1) })
    const { shoot, eyes } = await consultant(fixture)
    const refused = await shoot({ kind: 'image', image: 'enormous.jpg' })
    expect(refused).toMatch(/^Error: screenshot failed\./)
    expect(refused).toContain('enormous.jpg')
    expect(refused).toMatch(/is \d+ MB, which is past the \d+ MB/)
    expect(eyes.log.leases).toBe(0)

    // An injected media type on a Library picture: never written into the page as given.
    const INJECTED = 'image/jpeg";alert(1);"'
    const odd = site({})
    const looking = await consultant(odd, {
      fail: { undecodable: true }, // a browser handed octet-stream will not decode it
      materials: [
        {
          uid: 'material-odd',
          title: 'Odd upload',
          filename: 'odd.jpg',
          contentType: INJECTED,
          bytes: photograph(2000),
        },
      ],
    })
    const result = await looking.shoot({ kind: 'image', image: 'Odd upload' })
    const decode = looking.eyes.log.queried.find((s) => s.includes('img.decode'))
    expect(decode).toBeDefined()
    expect(decode).not.toContain('alert(')
    expect(decode).not.toContain('jpeg"')
    expect(decode).toContain("img.src = 'data:application/octet-stream;base64,'")
    expect(result).toMatch(/^Error: screenshot failed\./)
    expect(result).toContain('the browser would not decode it')
    expect(result).toContain('material-odd')
    expect(result).not.toContain('"type":"image"')

    // No regression: a valid type the browser will not decode keeps the existing wording.
    const plain = browser({ undecodable: true })
    const err = await rasterizeImage(photograph(1000), 'image/webp', plain.factory, "'broken.webp'").catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(ImageNotRenderableError)
    expect((err as Error).message).toContain(
      "'broken.webp' is stored as image/webp and the browser would not decode it",
    )
    const plainDecode = plain.log.queried.find((s) => s.includes('img.decode'))
    expect(plainDecode).toContain("img.src = 'data:image/webp;base64,'")
  }, 60_000)
})
