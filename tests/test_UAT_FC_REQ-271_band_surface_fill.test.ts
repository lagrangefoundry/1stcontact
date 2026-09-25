/**
 * REQ-271 — a band's background: fabricated when transparent, compared by
 * nothing, and wrong on the hero.
 *
 * Three residuals in a chain, all about the one property the value gate had
 * never been able to see — the background colour of a band.
 *
 * **1. The capture recorded a transparent band as an opaque white.** `rgbToHex`
 * correctly returns `null` for `rgba(0,0,0,0)`, and both band paths then
 * laundered that `null` into the body's background — which on a page whose
 * `<body>` is itself transparent is the literal string `'#ffffff'`. A band that
 * paints nothing and a band that paints white produced byte-identical records,
 * and the same fabricated value then decided the band's `colorScheme`: a
 * `<header>` whose only runs sit over a dark photograph under a 30% navy scrim
 * came out `light`.
 *
 * **2. A band's fill was compared by nothing.** `SectionValues` had no fill
 * member, so the per-section pass compared `overlay`, `contentAnchorRatio` and
 * `textAlign` and nothing else. An L1 render paints its bands as real full-bleed
 * boxes, so the reproduction's six band fills arrived as `role: "generic"`
 * elements that could never pair — seven `unpairedActual` objects carrying no
 * box and no index, locatable by nobody — while the diff reported **zero**
 * `surfaceFill` deltas on a run where one of those six fills was demonstrably
 * wrong.
 *
 * **3. The fold painted the hero scrim's flattened colour as the hero band's
 * base.** The capture flattens a translucent scrim into every run it covers (the
 * alpha loss is BUG-24), and the band builder took each band's fill straight
 * from the run group it was derived from. So `#030717` — the `bg-slate-950/30`
 * scrim — was promoted to an opaque plate under the hero, and re-applied
 * properly at 0.3 as the `overlay` axis of the `section-bg` box above it. The
 * page painted the colour twice, and issue 2 is why no gate ever said so.
 *
 * The browser UATs drive a REAL headless Chromium against committed fixtures
 * over an ephemeral loopback server, and skip cleanly where no browser can
 * launch. The rest drive the real projection / diff / fold entry points over
 * synthetic manifests, plus the retained gigabytealchemy capture where it is
 * present.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  chromiumAvailable,
  cmdCapturePage,
  createPlaywrightDriver,
  diffManifests,
  flattenCapture,
  flattenSignals,
  staleCaptureAxes,
  type Capture,
  type MultiStateCapture,
  type RawSignals,
  type SectionValues,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { buildSections } from '../tools/generate/src/cli/capture/sections'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
import { foldToL1 } from '../tools/generate/src'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const CONTENT_TYPE: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.png': 'image/png' }

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', CONTENT_TYPE[path.extname(file)] ?? 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/** The fixture captured the way `1c capture page` captures a reference. */
async function captureFixture(page: string): Promise<Capture> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'req271-'))
  try {
    const { capture } = await cmdCapturePage(`${server.origin}/${page}`, fsReferenceStore(cwd))
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

/** The fixture read by the live extractor — the raw band records, before projection. */
async function rawSignals(page: string): Promise<RawSignals> {
  const server = await serveDir(FIXTURES)
  const driver = await createPlaywrightDriver()
  try {
    await driver.navigate(`${server.origin}/${page}`)
    return await driver.query<RawSignals>(EXTRACT_SCRIPT)
  } finally {
    await driver.close()
    await server.close()
  }
}

/** The fixture measured the way a REPRODUCTION is measured (live extraction). */
async function reproManifest(page: string): Promise<ValueManifest> {
  const server = await serveDir(FIXTURES)
  const driver = await createPlaywrightDriver()
  try {
    const url = `${server.origin}/${page}`
    await driver.navigate(url)
    return flattenSignals(await driver.query<RawSignals>(EXTRACT_SCRIPT), url)
  } finally {
    await driver.close()
    await server.close()
  }
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// Driven once each and shared — a real Chromium run is the expensive part.
const bareCapture: Capture | undefined = browserOk ? await captureFixture('req271-transparent-bands.html') : undefined
const bareSignals: RawSignals | undefined = browserOk ? await rawSignals('req271-transparent-bands.html') : undefined
const layersRepro: ValueManifest | undefined = browserOk ? await reproManifest('req270-hero-layers.html') : undefined

// ── browser-free fixtures ────────────────────────────────────────────────────

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const SCRIM = '#030717'
const CREAM = '#e8dfd3'

const section = (s: Partial<SectionValues> & Pick<SectionValues, 'index'>): SectionValues =>
  ({ overlay: null, contentAnchorRatio: null, ...s }) as SectionValues

const manifest = (source: string, sections: SectionValues[]): ValueManifest =>
  ({ source, elements: [], sections, viewport: { width: 1280, height: 800 } }) as unknown as ValueManifest

const run = (text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement => ({
  text,
  role: 'text',
  color: '#f5e6a3',
  fontFamily: 'Georgia',
  fontSizePx: 20,
  fontWeight: 400,
  box,
  ...over,
})

/** A ladder whose every width carries the same elements and section records. */
function multiFrom(
  elementsAt: (width: number) => ValueElement[],
  sectionsAt: (width: number) => SectionValues[],
): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 800 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements: elementsAt(width),
      sections: sectionsAt(width),
      viewport: { width, height: 800 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

type Kid = { kind: string; id?: string; axes?: Record<string, unknown> }
/**
 * Every painted surface in the folded tree, at any depth.
 *
 * BUG-142 — a band that BACKS content folds to a `container` holding the runs it
 * is painted behind; one that backs nothing is still a childless pinned `box`.
 * The bands this suite is about are the same bands, carrying the same fill.
 */
const boxesOf = (doc: ReturnType<typeof foldToL1>): Kid[] => {
  const out: Kid[] = []
  const walk = (nodes: Kid[]): void => {
    for (const n of nodes) {
      if (n.kind === 'box' || n.kind === 'container') out.push(n)
      walk(((n as { children?: Kid[] }).children ?? []) as Kid[])
    }
  }
  walk((doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as unknown as Kid[])
  return out
}

/** The retained real gigabytealchemy ladder, when this checkout has it. */
function realGigabyte(): MultiStateCapture | null {
  const p = path.join(process.cwd(), 'storage', 'references', 'gigabytealchemy.ai', 'index', 'multistate.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as MultiStateCapture) : null
}

// The retained bundle is not committed, so a checkout without it SKIPS this leg
// rather than passing on an early return — a silent pass is not evidence.
const itReal = it.runIf(realGigabyte() !== null)

/** A capture bundle body, stamped at a given schema. */
const bundle = (schema: number | undefined, sections: unknown[]): Capture =>
  ({
    url: 'https://example.test/',
    host: 'example.test',
    path: '/',
    capturedAt: '2026-09-18T00:00:00.000Z',
    ...(schema === undefined ? {} : { captureSchema: schema }),
    viewport: { width: 1280, height: 800 },
    theme: { subScales: {} },
    sections,
    assets: [],
  }) as unknown as Capture

const capturedSection = (background: unknown, box: unknown) => ({
  index: 0,
  box,
  background,
  layout: { contentAlign: 'left', contentAnchorRatio: 0.5 },
  content: [],
  items: [],
  fields: [],
})

describe('REQ-271 (1) — a band that paints nothing is recorded as painting nothing', () => {
  // ── 1. The real capture, over a page with no background anywhere ───────────
  itB('test_UAT_FC_REQ-271_a_transparent_band_is_not_recorded_as_an_opaque_white', () => {
    const sections = bareCapture!.sections
    // Nothing on this page declares a background colour except the cream
    // `.about` section, so no band may assert one — least of all the `#ffffff`
    // that used to arrive as bodyBg's own fallback string.
    const asserted = sections.map((s) => s.background.color).filter(Boolean)
    expect(asserted, 'no band may claim a fill the page never painted').not.toContain('#ffffff')

    // The header and the hero both paint nothing of their own…
    const header = sections.find((s) => Math.round(s.box.height) === 192)
    expect(header, 'the absolutely-positioned header is its own band').toBeTruthy()
    expect(header!.background.kind, 'a band with no fill says so positively').toBe('none')
    expect(header!.background.color).toBeUndefined()

    const hero = sections.find((s) => s.background.kind === 'image')
    expect(hero, 'the hero paints an image').toBeTruthy()
    expect(hero!.background.color, 'and no base colour under it').toBeUndefined()
    // …while its scrim is recorded exactly as before: the fix removes a
    // fabrication, it does not remove a measurement.
    expect(hero!.background.overlay?.color.toLowerCase()).toBe(SCRIM)
    expect(hero!.background.overlay?.opacity).toBeCloseTo(0.3, 2)

    // …and a band that genuinely paints a fill still records it.
    const cream = sections.find((s) => s.background.color)
    expect(cream!.background.kind).toBe('color')
    expect(cream!.background.color!.toLowerCase()).toBe(CREAM)
  })

  // ── 2. The scheme is read off the backdrop, not off the fabrication ────────
  itB('test_UAT_FC_REQ-271_colour_scheme_reads_the_backdrop_a_band_is_seen_against', () => {
    const bands = bareSignals!.bands
    const header = bands.find((b) => Math.round(b.box.height) === 192)!
    // Read straight off the extractor's own record, which is where both facts
    // live and where the laundering happened.
    expect(header.backgroundColor, 'the band paints no fill of its own — and says so').toBeNull()
    // Its runs sit over a dark photograph under a 30% navy scrim. Decided on the
    // old `'#ffffff'` fallback this band read `light`: a classification made
    // entirely out of a value nobody painted.
    expect(header.colorScheme, 'the scheme is read off the backdrop, not off a fabrication').toBe('dark')

    // The cream band below is genuinely light, and still reads that way — the
    // fix must not simply darken everything that paints nothing.
    const cream = bands.find((b) => b.backgroundColor?.toLowerCase() === CREAM)!
    expect(cream.colorScheme).toBe('light')
  })

  // ── 3. The projection that turns a measured absence into `kind: none` ──────
  it('test_UAT_FC_REQ-271_a_null_band_fill_projects_as_kind_none', () => {
    const band = (backgroundColor: string | null, backgroundImage = 'none') =>
      ({
        box: { x: 0, y: 0, width: 1280, height: 192 },
        backgroundColor,
        backgroundImage,
        colorScheme: 'dark' as const,
        fontFamily: 'Georgia',
        textAlign: 'left' as const,
        paddingTopPx: 0,
        paddingBottomPx: 0,
        overlay: null,
        contentAnchorRatio: null,
        content: [],
        items: [],
        fields: [],
      })
    const signals = (bands: unknown[]) => ({ bands, containerMaxWidthPx: null }) as unknown as RawSignals

    const [none] = buildSections(signals([band(null)]), () => undefined)
    expect(none.background.kind, 'no measured fill → a positive `none`').toBe('none')
    expect(none.background.color).toBeUndefined()

    const [white] = buildSections(signals([band('#ffffff')]), () => undefined)
    expect(white.background.kind, 'a band that really paints white still says `color`').toBe('color')
    expect(white.background.color).toBe('#ffffff')

    // An image band with no base fill keeps its kind and drops only the invented
    // colour — the shape the gigabytealchemy hero has.
    const [img] = buildSections(signals([band(null, "url('hero.png')")]), () => undefined)
    expect(img.background.kind).toBe('image')
    expect(img.background.color).toBeUndefined()
  })

  // ── 4. …and a bundle taken before it is named as behind ────────────────────
  it('test_UAT_FC_REQ-271_a_pre_schema_bundle_is_named_as_unable_to_express_it', () => {
    expect(CAPTURE_SCHEMA, 'the honest band fill is schema 3').toBeGreaterThanOrEqual(3)

    const stale = bundle(2, [capturedSection({ kind: 'color', color: '#ffffff' }, { x: 0, y: 0, width: 1280, height: 192 })])
    const axes = staleCaptureAxes(stale).map((a) => a.axis)
    expect(axes.join(' | '), 'the finding names the axis the bundle cannot express').toContain('background.kind')

    // A bundle that demonstrably carries the axis is never claimed to be missing it.
    const fresh = bundle(2, [capturedSection({ kind: 'none' }, { x: 0, y: 0, width: 1280, height: 192 })])
    expect(staleCaptureAxes(fresh).map((a) => a.axis).join(' | ')).not.toContain('background.kind')
  })
})

describe('REQ-271 (2) — a band fill is compared, and repro-only band paint is not noise', () => {
  // ── 5. Both sides project the axis; a stale bundle leaves it unmeasured ────
  it('test_UAT_FC_REQ-271_both_sides_project_a_band_fill_and_a_stale_bundle_does_not', () => {
    const boxed = { x: 0, y: 0, width: 1280, height: 192 }
    const current = flattenCapture(
      bundle(CAPTURE_SCHEMA, [
        capturedSection({ kind: 'none' }, boxed),
        { ...capturedSection({ kind: 'color', color: CREAM }, boxed), index: 1 },
      ]),
    )
    expect(current.sections[0].surfaceFill, 'a measured absence projects as null').toBeNull()
    expect(current.sections[1].surfaceFill, 'a measured fill projects as itself').toBe(CREAM)

    // A pre-3 bundle asserts `#ffffff` for every transparent band, so reading it
    // as a measurement would fire a false delta on the axis's first run.
    const stale = flattenCapture(bundle(2, [capturedSection({ kind: 'color', color: '#ffffff' }, boxed)]))
    expect(stale.sections[0].surfaceFill, 'unmeasured, not white').toBeUndefined()
  })

  // ── 6. The reproduction side projects the fill the extractor already had ───
  it('test_UAT_FC_REQ-271_the_reproduction_projects_the_band_fill_it_measured', () => {
    const band = (y: number, backgroundColor: string | null) => ({
      box: { x: 0, y, width: 1280, height: 400 },
      backgroundColor,
      backgroundImage: 'none',
      colorScheme: 'light' as const,
      fontFamily: 'Georgia',
      textAlign: 'left' as const,
      paddingTopPx: 0,
      paddingBottomPx: 0,
      overlay: null,
      contentAnchorRatio: null,
      content: [],
      items: [],
      fields: [],
    })
    const m = flattenSignals(
      { bands: [band(0, SCRIM), band(400, null)], viewport: { width: 1280, height: 800 } } as unknown as RawSignals,
      'repro',
    )
    expect(m.sections.map((s) => s.surfaceFill)).toEqual([SCRIM, null])
  })

  // ── 7. A wrong band fill is a delta; a right one is not ────────────────────
  it('test_UAT_FC_REQ-271_a_wrong_band_fill_is_one_section_delta', () => {
    const box = { x: 0, y: 0, width: 1280, height: 800 }
    const fills = (e: string | null | undefined, a: string | null | undefined) =>
      diffManifests(
        manifest('ref', [section({ index: 0, box, surfaceFill: e })]),
        manifest('repro', [section({ index: 0, box, surfaceFill: a })]),
      ).deltas.filter((d) => d.property === 'surfaceFill')

    // The gigabytealchemy case: the reference paints nothing, the reproduction
    // paints an opaque navy plate. Before this axis existed the diff reported 0.
    const wrong = fills(null, SCRIM)
    expect(wrong, 'a plate the reference never paints is exactly one delta').toHaveLength(1)
    expect(wrong[0].text).toBe('§0')
    expect(wrong[0].expected).toBe('(none)')
    expect(wrong[0].actual).toBe(SCRIM)

    expect(fills(CREAM, CREAM), 'agreement is not a delta').toHaveLength(0)
    expect(fills(null, null), 'two bands that both paint nothing agree').toHaveLength(0)
    expect(fills(CREAM, '#0f172b'), 'a different colour is a delta').toHaveLength(1)
    // An unmeasured side is skipped, not compared against a stand-in.
    expect(fills(undefined, SCRIM), 'unmeasured expected → nothing to compare').toHaveLength(0)
    expect(fills(SCRIM, undefined), 'unmeasured actual → nothing to compare').toHaveLength(0)
  })

  // ── 8. An L1 render's band box is band paint, not a seventh unpaired object ─
  itB('test_UAT_FC_REQ-271_an_l1_band_box_is_band_paint_not_an_unpaired_object', () => {
    const bands = layersRepro!.sections
    // The band fills this render paints reach the record that HAS a counterpart.
    expect(bands.map((s) => s.surfaceFill)).toContain(SCRIM)
    expect(bands.map((s) => s.surfaceFill)).toContain(CREAM)

    // The manifest itself stays faithful: a full-bleed textless box is what the
    // fold reads to rebuild a backdrop (BUG-27), so it is never dropped upstream.
    const coincides = (b: ValueElement['box']) =>
      bands.some((s) => b && s.box && Math.abs(s.box.y - b.y) <= 2 && Math.abs(s.box.height - b.height) <= 2)
    expect(
      layersRepro!.elements.some((el) => coincides(el.box)),
      'the band boxes are still in the manifest the fold reads',
    ).toBe(true)

    // …and the diff no longer reports them as objects that matched nothing.
    const expected = manifest(
      'ref',
      bands.map((s, index) => section({ index, box: s.box, surfaceFill: s.surfaceFill })),
    )
    const { unpairedActual } = diffManifests(expected, layersRepro!)
    expect(
      unpairedActual.filter((u) => coincides(u.box)),
      'band paint is not a repro object that paired with nothing',
    ).toEqual([])
    // The photograph LAYER inside the band has its own geometry and is not band
    // paint — recognising band boxes must not swallow the things sitting on them.
    const hero = layersRepro!.elements.find((el) => el.backgroundImageUrl?.endsWith('req270-hero.png'))
    expect(hero, 'the inner image layer keeps its place in the manifest').toBeTruthy()
    expect(
      unpairedActual.some((u) => u.box?.height === hero!.box!.height && u.box?.y === hero!.box!.y),
      'and is still reported, because it really is repro-only here',
    ).toBe(true)
  })

  // ── 9. The same recognition, without a browser ────────────────────────────
  it('test_UAT_FC_REQ-271_a_full_bleed_box_over_a_band_is_still_reported', () => {
    const bandBox = { x: 0, y: 800, width: 1280, height: 500 }
    // Exactly what `fieldToElement` produces for a textless box: `text` is the
    // accessible name falling back to `(<role>)`, never the empty string, and
    // `textless` is the flag that actually says there is no text.
    const box = (y: number, height: number) =>
      ({
        role: 'generic',
        text: '(generic)',
        textless: true,
        box: { x: 0, y, width: 1280, height },
      }) as unknown as ValueElement
    const unpaired = (el: ValueElement) => {
      const actual = {
        ...manifest('repro', [section({ index: 0, box: bandBox, surfaceFill: CREAM })]),
        elements: [el],
      } as ValueManifest
      return diffManifests(manifest('ref', [section({ index: 0, box: bandBox, surfaceFill: CREAM })]), actual)
        .unpairedActual
    }
    // The band's own paint: compared by the section pass, so not ALSO counted as
    // an object that matched nothing.
    expect(unpaired(box(800, 500)), 'band paint is not an unpaired object').toEqual([])
    // A full-bleed box that merely sits on the band is an object in its own right.
    expect(unpaired(box(900, 120)), 'a banner standing on the band is still reported').toHaveLength(1)
    // …and so is a layer that shares the band's top but has its own height.
    expect(unpaired(box(800, 400)), 'a layer inside the band is still reported').toHaveLength(1)
  })

  // ── 10. …and whatever is left unpaired can be found ────────────────────────
  it('test_UAT_FC_REQ-271_an_unpaired_object_carries_the_geometry_to_find_it', () => {
    const box = { x: 0, y: 900, width: 1280, height: 400 }
    const only = (m: ValueManifest) => m
    const expected = only(manifest('ref', []))
    const actual = {
      ...only(manifest('repro', [])),
      elements: [{ role: 'generic', text: '', box } as unknown as ValueElement],
    } as ValueManifest
    const { unpairedActual } = diffManifests(expected, actual)
    expect(unpairedActual).toHaveLength(1)
    expect(unpairedActual[0].box, 'a count is not a finding — say where it is').toEqual(box)
    expect(unpairedActual[0].index, 'and which manifest element it is').toBe(0)
  })
})

describe('REQ-271 (3) — the fold never adopts a scrim colour as a band base', () => {
  // ── 10. The synthetic hero: scrim flattened onto every run over it ─────────
  it('test_UAT_FC_REQ-271_a_band_whose_only_fill_is_its_scrim_paints_nothing', () => {
    const heroBox = (w: number) => ({ x: 0, y: 0, width: w, height: 800 })
    const aboutBox = (w: number) => ({ x: 0, y: 800, width: w, height: 500 })
    const ms = multiFrom(
      (w) => [
        // BUG-24: the capture flattens the 30% scrim into every run it covers, so
        // each hero run reports an opaque #030717 that nobody authored.
        run('Intentional Software', { x: 88, y: 420, width: w - 176, height: 52 }, { surfaceFill: SCRIM }),
        run('Tools for clarity', { x: 88, y: 520, width: w - 176, height: 32 }, { surfaceFill: SCRIM }),
        run('A different approach', { x: 88, y: 900, width: w - 176, height: 28 }, { surfaceFill: CREAM }),
        run('We start with the work', { x: 88, y: 960, width: w - 176, height: 28 }, { surfaceFill: CREAM }),
      ],
      (w) => [
        section({
          index: 0,
          box: heroBox(w),
          overlay: { color: SCRIM, opacity: 0.3 },
          backgroundImageUrl: 'assets/hero.png',
          surfaceFill: null,
        }),
        section({ index: 1, box: aboutBox(w), surfaceFill: CREAM }),
      ],
    )
    const boxes = boxesOf(foldToL1(ms))
    const bands = boxes.filter((b) => (b.id ?? '').startsWith('section-band-'))

    expect(
      bands.map((b) => b.axes?.surfaceFill),
      'the scrim colour is never a band base — the band paints nothing at all',
    ).not.toContain(SCRIM)
    expect(bands.map((b) => b.axes?.surfaceFill), 'a band with a real fill keeps it').toContain(CREAM)

    // The scrim is not lost: it is still carried, at its real opacity, by the
    // section-background box that was always the right place for it.
    const bg = boxes.find((b) => (b.id ?? '').startsWith('section-bg-'))
    expect(bg?.axes?.overlay).toEqual({ color: SCRIM, opacity: 0.3 })
    expect(bg?.axes?.surfaceFill, 'and the background box gains no plate of its own').toBeUndefined()
  })

  // ── 11. A band whose fill merely resembles nothing on it is untouched ──────
  it('test_UAT_FC_REQ-271_a_band_fill_that_is_not_the_scrim_is_kept', () => {
    const ms = multiFrom(
      (w) => [
        run('Navy footer', { x: 88, y: 100, width: w - 176, height: 28 }, { surfaceFill: '#0f172b' }),
        run('Second line', { x: 88, y: 160, width: w - 176, height: 28 }, { surfaceFill: '#0f172b' }),
      ],
      (w) => [
        // The band paints navy AND carries a different scrim over it: the fill is
        // the band's own and must survive.
        section({
          index: 0,
          box: { x: 0, y: 0, width: w, height: 600 },
          overlay: { color: SCRIM, opacity: 0.2 },
          surfaceFill: '#0f172b',
        }),
      ],
    )
    const bands = boxesOf(foldToL1(ms)).filter((b) => (b.id ?? '').startsWith('section-band-'))
    expect(bands.map((b) => b.axes?.surfaceFill)).toContain('#0f172b')
  })

  // ── 12. The retained real bundle, re-folded ────────────────────────────────
  itReal('test_UAT_FC_REQ-271_the_retained_gigabytealchemy_hero_folds_without_a_plate', () => {
    const ms = realGigabyte()!
    const boxes = boxesOf(foldToL1(ms))
    const bands = boxes.filter((b) => (b.id ?? '').startsWith('section-band-'))
    expect(bands.length, 'the page still folds its real bands').toBeGreaterThan(0)
    expect(
      bands.map((b) => b.axes?.surfaceFill),
      'the 800px hero plate nobody chose is gone',
    ).not.toContain(SCRIM)
    const bg = boxes.find((b) => (b.id ?? '').startsWith('section-bg-'))
    expect(bg?.axes?.overlay, 'while the scrim it was mistaken for is untouched').toEqual({
      color: SCRIM,
      opacity: 0.3,
    })
  })
})
