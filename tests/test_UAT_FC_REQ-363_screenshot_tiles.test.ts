import { describe, expect, it } from 'vitest'
import {
  MAX_IMAGE_EDGE,
  fidelityOperations,
} from '../tools/generate/src/cli/ai/fidelity-core'
import type { ContentBlock, FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { TILE_SETTINGS } from '../tools/generate/src/cli/ai/picture-tiles'
import type { TileSettings } from '../tools/generate/src/cli/ai/picture-tiles'
import tilesDocument from '../tools/generate/src/cli/ai/picture-tiles.json'
import { SECTIONS_SCRIPT } from '../tools/generate/src/cli/picture'
import type { PageSection } from '../tools/generate/src/cli/picture'
import type { ImageLibrary, StoredImage } from '../tools/generate/src/cli/image-library'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { encodePng, decodePng } from '../tools/generate/src/cli/png'
import type { Raster } from '../tools/generate/src/cli/perceptual-core'
import type { BrowserDriver, CapturedResponse, Viewport } from '../tools/generate/src/cli/capture/types'

/**
 * REQ-363 — **a page is looked at one screen at a time.**
 *
 * WHAT IS REAL. The `screenshot` operation is the production one, over a real
 * reference store, a real PNG codec and the real resampler; the tiles under test
 * are decoded back out of the very content blocks the model would be handed.
 *
 * ONE THING IS A DOUBLE: the browser, the surface's one external boundary. It
 * answers a full-page shot whose sections are painted in distinct colours — so a
 * tile's PIXELS say which part of the page it is, not only its label — and it
 * answers the section measurement with the positions those colours were painted
 * at, which is what a real browser reading the same page would report.
 */

const ORIGIN = 'https://app.example.test'

/** A page of `bands`, each a section painted in its own colour, top to bottom. */
interface Band {
  address: string
  top: number
  bottom: number
  rgb: [number, number, number]
}

function pageOf(width: number, height: number, bands: Band[]): Raster {
  const data = new Uint8Array(width * height * 3).fill(255)
  for (const band of bands) {
    for (let y = band.top; y < Math.min(band.bottom, height); y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3
        data[i] = band.rgb[0]
        data[i + 1] = band.rgb[1]
        data[i + 2] = band.rgb[2]
      }
    }
  }
  return { data, width, height, channels: 3 }
}

/** Twelve sections down a 9059px page — the Charlie's Plumbing desktop shape. */
const DESKTOP_BANDS: Band[] = Array.from({ length: 12 }, (_, i) => ({
  address: `0.${i}`,
  top: i === 0 ? 0 : 300 + (i - 1) * 796,
  bottom: i === 0 ? 300 : 300 + i * 796,
  rgb: [20 * i, 255 - 20 * i, (60 * i) % 256] as [number, number, number],
}))
DESKTOP_BANDS[11].bottom = 9059

/**
 * The browser double: a scripted full-page shot per viewport width, the sections
 * measured on it, and a record of what it was asked to do.
 */
class PageDriver implements BrowserDriver {
  static leased = 0
  static queried: string[] = []
  static order: string[] = []
  constructor(
    private readonly shots: Map<number, Uint8Array>,
    private readonly sections: PageSection[],
  ) {
    PageDriver.leased++
  }
  private width = 0
  async navigate(_url: string, viewport?: Viewport): Promise<void> {
    if (viewport) this.width = viewport.width
  }
  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    if (viewport) this.width = viewport.width
    PageDriver.order.push('screenshot')
    return this.shots.get(this.width) ?? this.shots.values().next().value!
  }
  async query<T>(script: string): Promise<T> {
    PageDriver.queried.push(script)
    if (script === SECTIONS_SCRIPT) {
      PageDriver.order.push('measure')
      return this.sections as T
    }
    // A page step: done, as a real page would report a click that took.
    PageDriver.order.push('step')
    return { ok: true } as T
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

function reset(): void {
  PageDriver.leased = 0
  PageDriver.queried = []
  PageDriver.order = []
}

async function deps(
  shots: Map<number, Uint8Array>,
  sections: PageSection[],
  extra: Partial<FidelityDeps> = {},
): Promise<FidelityDeps> {
  return {
    slug: 'charlies',
    origin: ORIGIN,
    references: memoryReferenceStore(),
    driverFactory: async () => new PageDriver(shots, sections),
    guardedDriver: () => async () => new PageDriver(shots, sections),
    ...extra,
  }
}

/** Encoded once: a 1280×9059 PNG takes seconds to encode in pure JS. */
let desktopPng: Promise<Uint8Array> | null = null

/** The desktop page, 1280×9059, and the sections a browser would read off it. */
async function desktopPage(): Promise<{ shots: Map<number, Uint8Array>; sections: PageSection[] }> {
  desktopPng ??= encodePng(pageOf(1280, 9059, DESKTOP_BANDS))
  return {
    shots: new Map([[1280, await desktopPng]]),
    sections: DESKTOP_BANDS.map(({ address, top, bottom }) => ({ address, top, bottom })),
  }
}

const images = (blocks: ContentBlock[]) =>
  Promise.all(
    blocks
      .filter((b) => b.type === 'image')
      .map((b) =>
        decodePng(
          Uint8Array.from(atob((b as { source: { data: string } }).source.data), (c) => c.charCodeAt(0)),
          'tile',
        ),
      ),
  )

const texts = (blocks: ContentBlock[]) =>
  blocks.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text)

/** The colour at a pixel of a decoded tile. */
function colourAt(raster: Raster, x: number, y: number): number[] {
  const i = (y * raster.width + x) * raster.channels
  return [raster.data[i], raster.data[i + 1], raster.data[i + 2]]
}

describe('REQ-363 — a page picture is one screen at a time, with a conservative default', () => {
  it('test_UAT_FC_REQ_363_default_desktop_shot_is_the_first_screen_about_1024_wide', async () => {
    reset()
    const page = await desktopPage()
    const ops = fidelityOperations(await deps(page.shots, page.sections))

    const blocks = (await ops.screenshot({ of: { kind: 'draft' } })) as ContentBlock[]

    // ONE image — the screen a visitor sees on arrival — not the page squeezed.
    const shown = await images(blocks)
    expect(shown).toHaveLength(1)
    expect(shown[0].width).toBe(1024)
    // One screen tall: the 800px desktop screen, reduced by the same factor.
    expect(shown[0].height).toBe(640)
    // Its pixels are the TOP of the page: the first section's colour, then the second's.
    expect(colourAt(shown[0], 10, 10)).toEqual(DESKTOP_BANDS[0].rgb)
    expect(colourAt(shown[0], 10, 600)).toEqual(DESKTOP_BANDS[1].rgb)

    // The label says where it is, what it shows, and what it cost.
    const [label] = texts(blocks)
    expect(label).toContain('tile 1 of 12')
    expect(label).toContain('page y 0–800 of 9059 px')
    expect(label).toContain('sections 0.0, 0.1')
    expect(label).not.toContain('0.2')
    expect(label).toMatch(/1024×640 \(reduced from 1280×800\), about \d+ tokens/)
    expect(label).toContain(`about ${Math.ceil((1024 * 640) / 750)} tokens`)

    // The sections were read in the page, after the shutter, in the same session.
    expect(PageDriver.leased).toBe(1)
    expect(PageDriver.order).toEqual(['screenshot', 'measure'])
  })

  it('test_UAT_FC_REQ_363_default_mobile_shot_is_375_wide_and_one_screen_tall', async () => {
    reset()
    const mobile = await encodePng(
      pageOf(375, 2427, [{ address: '0.0', top: 0, bottom: 2427, rgb: [200, 40, 40] }]),
    )
    const ops = fidelityOperations(await deps(new Map([[375, mobile]]), []))

    const blocks = (await ops.screenshot({ of: { kind: 'draft', viewport: 'mobile' } })) as ContentBlock[]
    const shown = await images(blocks)
    expect(shown).toHaveLength(1)
    expect(shown[0].width).toBe(375)
    expect(shown[0].height).toBe(667)
    const [label] = texts(blocks)
    expect(label).toContain('tile 1 of 4')
    // Sent at its real width: there is no reduction to report.
    expect(label).not.toContain('reduced')
  })

  it('test_UAT_FC_REQ_363_a_section_brings_back_the_tile_its_top_is_in', async () => {
    reset()
    const page = await desktopPage()
    const ops = fidelityOperations(await deps(page.shots, page.sections))

    // 0.5 starts at y=3484, which is in tile 5 (3200–4000).
    const blocks = (await ops.screenshot({ of: { kind: 'draft' }, section: '0.5' })) as ContentBlock[]
    const shown = await images(blocks)
    expect(shown).toHaveLength(1)
    const [label] = texts(blocks)
    expect(label).toContain('tile 5 of 12')
    expect(label).toContain('page y 3200–4000')
    expect(label).toContain('0.5')
    // And the pixels are that section's: 3484 - 3200 = 284 screen px in, × 0.8.
    expect(colourAt(shown[0], 10, Math.round(300 * 0.8))).toEqual(DESKTOP_BANDS[5].rgb)

    // A section that runs past its tile says so, and says how to see the rest.
    const tall = (await ops.screenshot({ of: { kind: 'draft' }, section: '0.1' })) as ContentBlock[]
    expect(texts(tall).join(' ')).toMatch(/Section 0\.1 starts in tile 1 and runs to tile 2/)
    expect(texts(tall).join(' ')).toContain('ask for tiles `2` to see the rest of it')
  })

  it('test_UAT_FC_REQ_363_section_is_refused_where_there_are_no_addresses', async () => {
    reset()
    const page = await desktopPage()
    const ops = fidelityOperations(await deps(page.shots, page.sections))

    // A stranger's page has no L1 addresses — refused by name, before any browser.
    await expect(
      ops.screenshot({ of: { kind: 'url', url: 'https://example.com/' }, section: '0.2' }),
    ).rejects.toThrow(/only your own pages/)
    // An address that is not one of the page's sections names the ones that are.
    await expect(ops.screenshot({ of: { kind: 'draft' }, section: '0.40' })).rejects.toThrow(
      /'0\.40' is not a top-level section of that page\. Its sections are 0\.0, 0\.1/,
    )
    // Two ways of saying which part at once has no single meaning.
    await expect(
      ops.screenshot({ of: { kind: 'draft' }, section: '0.1', tiles: '2' }),
    ).rejects.toThrow(/not both/)
    expect(PageDriver.leased).toBe(1) // only the draft that got as far as resolving
  })

  it('test_UAT_FC_REQ_363_the_whole_page_is_bounded_and_says_what_remains', async () => {
    reset()
    const page = await desktopPage()
    const ops = fidelityOperations(await deps(page.shots, page.sections))

    const blocks = (await ops.screenshot({ of: { kind: 'draft' }, tiles: 'all' })) as ContentBlock[]
    const shown = await images(blocks)
    // The configured cap — 4 — rather than all 12, refused or silently cut.
    expect(shown).toHaveLength(TILE_SETTINGS.maxTilesPerCall)
    expect(shown).toHaveLength(4)
    const said = texts(blocks)
    expect(said.slice(0, 4).map((t) => /tile (\d+) of 12/.exec(t)?.[1])).toEqual(['1', '2', '3', '4'])
    // The closing sentence: how many remain and exactly how to ask for them.
    const closing = said[said.length - 1]
    expect(closing).toContain('8 more tiles')
    expect(closing).toContain('`5-8`')
    expect(closing).toContain('up to tile 12')

    // And the next batch is exactly what it says it is.
    const next = (await ops.screenshot({ of: { kind: 'draft' }, tiles: '5-8' })) as ContentBlock[]
    expect(texts(next)[0]).toContain('tile 5 of 12')
    expect(await images(next)).toHaveLength(4)

    // The last tile is the remainder of the page, not a full screen.
    const last = (await ops.screenshot({ of: { kind: 'draft' }, tiles: '12' })) as ContentBlock[]
    expect(texts(last)[0]).toContain('page y 8800–9059 of 9059 px')
    // And a tile past the end is refused by name.
    await expect(ops.screenshot({ of: { kind: 'draft' }, tiles: '13' })).rejects.toThrow(
      /12 tiles long, so there is no tile 13/,
    )
  })

  it('test_UAT_FC_REQ_363_detail_sets_the_width_and_high_stays_within_the_provider_limit', async () => {
    reset()
    const page = await desktopPage()
    const tablet = await encodePng(
      pageOf(768, 3000, [{ address: '0.0', top: 0, bottom: 3000, rgb: [1, 2, 3] }]),
    )
    page.shots.set(768, tablet)
    const ops = fidelityOperations(await deps(page.shots, page.sections))

    const widthAt = async (detail: string, viewport = 'desktop') => {
      const [shown] = await images(
        (await ops.screenshot({ of: { kind: 'draft', viewport }, detail })) as ContentBlock[],
      )
      return shown
    }
    expect((await widthAt('low')).width).toBe(768)
    expect((await widthAt('normal')).width).toBe(1024)
    const high = await widthAt('high')
    // As wide as the page was rendered — never upscaled — and inside the limit.
    expect(high.width).toBe(1280)
    expect(Math.max(high.width, high.height)).toBeLessThanOrEqual(TILE_SETTINGS.providerMaxEdge)
    // Tablet is rendered at 768 and sent unreduced at every detail.
    for (const detail of ['low', 'normal', 'high']) {
      const shown = await widthAt(detail, 'tablet')
      expect([shown.width, shown.height]).toEqual([768, 1024])
    }
    await expect(ops.screenshot({ of: { kind: 'draft' }, detail: 'ultra' })).rejects.toThrow(
      /'ultra' is not a detail/,
    )
  })

  it('test_UAT_FC_REQ_363_a_stored_picture_is_reduced_exactly_as_before', async () => {
    reset()
    const poster: StoredImage = {
      name: 'poster.png',
      where: 'site',
      mediaType: 'image/png',
      aliases: [],
    }
    // Taller than a desktop screen and wider than the cap: a page would be tiled,
    // and a stored picture must not be.
    const bytes = await encodePng(
      pageOf(1500, 2000, [{ address: 'x', top: 0, bottom: 2000, rgb: [9, 120, 200] }]),
    )
    const library: ImageLibrary = {
      list: async () => [poster],
      read: async () => bytes,
    }
    const ops = fidelityOperations(await deps(new Map(), [], { images: library }))

    const blocks = (await ops.screenshot({ of: { kind: 'image', image: 'poster.png' } })) as ContentBlock[]
    const shown = await images(blocks)
    expect(shown).toHaveLength(1)
    // The whole picture, longest edge capped — the rule it had before.
    expect(Math.max(shown[0].width, shown[0].height)).toBe(MAX_IMAGE_EDGE)
    expect(shown[0].width / shown[0].height).toBeCloseTo(1500 / 2000, 2)
    expect(texts(blocks)[0]).toContain('reduced from 1500×2000')
    expect(texts(blocks)[0]).not.toContain('tile')
    // Tiles and sections do not apply to it, and asking for them says so.
    await expect(
      ops.screenshot({ of: { kind: 'image', image: 'poster.png' }, tiles: '2' }),
    ).rejects.toThrow(/shown whole/)
  })

  it('test_UAT_FC_REQ_363_the_defaults_and_the_cap_are_configuration', async () => {
    // The shipped settings ARE the configuration file's values — nothing in code
    // decides how much the model sees by default.
    expect(TILE_SETTINGS).toEqual({
      defaultTiles: tilesDocument.default_tiles,
      defaultDetail: tilesDocument.default_detail,
      maxTilesPerCall: tilesDocument.max_tiles_per_call,
      detailWidths: tilesDocument.detail_widths,
      providerMaxEdge: tilesDocument.provider_max_edge,
      pixelsPerToken: tilesDocument.pixels_per_token,
    })

    // And other settings change the behaviour with no code change.
    reset()
    const page = await desktopPage()
    const settings: TileSettings = {
      ...TILE_SETTINGS,
      defaultTiles: '2-3',
      defaultDetail: 'low',
      maxTilesPerCall: 1,
    }
    const ops = fidelityOperations(await deps(page.shots, page.sections, { tiles: settings }))

    const blocks = (await ops.screenshot({ of: { kind: 'draft' } })) as ContentBlock[]
    const shown = await images(blocks)
    expect(shown).toHaveLength(1)
    expect(shown[0].width).toBe(768)
    const said = texts(blocks)
    expect(said[0]).toContain('tile 2 of 12')
    expect(said[said.length - 1]).toContain('1 more tile')
    expect(said[said.length - 1]).toContain('Ask for tiles `3` next')
  })

  it('test_UAT_FC_REQ_363_after_steps_drive_the_page_before_a_tiled_shot', async () => {
    reset()
    const page = await desktopPage()
    const ops = fidelityOperations(await deps(page.shots, page.sections))

    const blocks = (await ops.screenshot({
      of: { kind: 'draft', after: ['click "Menu"'] },
      tiles: '2',
    })) as ContentBlock[]
    // The step ran first, then the shutter, then the measurement of that state.
    expect(PageDriver.order).toEqual(['step', 'screenshot', 'measure'])
    const [label] = texts(blocks)
    expect(label).toContain('after `click "Menu"`')
    expect(label).toContain('tile 2 of 12')
    expect(await images(blocks)).toHaveLength(1)
  })
})
