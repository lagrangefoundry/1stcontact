/**
 * REQ-270 — four residuals in how a reproduction is MEASURED, not rendered.
 *
 * Loop 1 iteration 2 of `repro-gigabytealchemy-ai` returned `pass` with one value
 * delta, and the delta was false. The reproduction painted the hero scrim
 * correctly — the emitted CSS carried `linear-gradient(#0307174d, #0307174d)`
 * over the photograph and the two screenshots agreed across the whole 1280×800
 * hero to within 1/255 — while the diff reported `overlay: #030717 @ 0.3 →
 * none`. Meanwhile the ranked-region score was `1051.13` in both iterations,
 * region for region and bbox for bbox, although five capture fixes had landed in
 * between.
 *
 * **1. The reference bundle predated the extractor measuring against it.** The
 * bundle was taken seventy minutes before REQ-269's commit and carried no field
 * padding, no `href`, no `headingLevel` and whole-pixel line-heights. The fold
 * re-ran with the new code and produced the identical impoverished L1, because
 * its INPUT could not express what the new code reads. Nothing anywhere noticed:
 * `capture.json` carried no record of the code that wrote it, so a stale oracle
 * and a current one were indistinguishable and the loop could iterate
 * indefinitely against a frozen residual whose fix had already shipped.
 *
 * **2. The reproduction's band paint was read from the opaque fill box.** Our own
 * renderer emits a hero as two full-bleed siblings: an opaque colour fill and,
 * sitting exactly inside it, the photograph. The geometric slicer correctly
 * refused to emit the inner one as its own band — and then DISCARDED it, reading
 * all the band's paint off the fill. The reproduction's own hero photograph never
 * reached its own manifest, and `backgroundImageUrl` was the one section axis the
 * diff never compared, so a reproduction that dropped the hero entirely would
 * have produced zero deltas and a clean gate.
 *
 * **3. A scrim painted as a gradient layer was invisible.** Scrim detection was
 * `background-color`-only on both overlay readers, and a gradient layer inside
 * `background-image` is the only way `render.ts` can express an L1 `overlay`
 * axis. So the axis was measurable on the reference and unmeasurable on the
 * reproduction, and the difference was reported as a defect in the reproduction.
 *
 * **4. The content anchor was measured over two different populations.** The
 * reference's anchor is a DOM-descendant walk; ours is every run whose centre
 * falls in the geometric slice. They agree on a conventionally nested page and
 * disagree exactly when the reference's own sections overlap — an absolutely
 * positioned header over a hero is its own reference section, so its runs are
 * excluded there and included here. 0.53 vs 0.39 on byte-identical geometry, a
 * phantom 112px content shift, silent only because 0.14 fell 0.01 under the
 * tolerance.
 *
 * The browser UATs drive a REAL headless Chromium against a committed fixture
 * over an ephemeral loopback server (no third-party site); they skip cleanly
 * where no browser can launch. The rest pin the pure consequences — the coverage
 * finding, the round context, the section comparison, the anchor guard — with no
 * browser at all.
 */
import { describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  captureSchemaOf,
  chromiumAvailable,
  cmdCapturePage,
  createPlaywrightDriver,
  diffManifests,
  flattenSignals,
  staleCaptureAxes,
  staleCaptureDetail,
  type Capture,
  type RawSignals,
  type SectionValues,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import { referenceCoverage } from '../tools/generate/src/cli'
import { fsReferenceBundle, fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'
import { buildPrompt, readGateReport, type RoundContext } from '../tools/repro-console/src/ai'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

const CONTENT_TYPE: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
}

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
  const cwd = mkdtempSync(path.join(tmpdir(), 'req270-'))
  try {
    const { capture } = await cmdCapturePage(`${server.origin}/${page}`, fsReferenceStore(cwd))
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

/**
 * The fixture measured the way a REPRODUCTION is measured — the live extraction
 * path (`EXTRACT_SCRIPT` → `flattenSignals`), which is the side every defect
 * below lives on. Distinct from {@link captureFixture}, which is the reference
 * projection; the whole class of bug here is the two disagreeing.
 */
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

// Driven once each and shared — every browser UAT asks a different question of
// the same page, and a real Chromium run is the expensive part.
const heroCapture: Capture | undefined = browserOk ? await captureFixture('req270-hero-layers.html') : undefined
const heroRepro: ValueManifest | undefined = browserOk ? await reproManifest('req270-hero-layers.html') : undefined

// ── shared fixtures for the browser-free legs ────────────────────────────────

const section = (s: Partial<SectionValues> & Pick<SectionValues, 'index'>): SectionValues =>
  ({ overlay: null, contentAnchorRatio: null, ...s }) as SectionValues

const manifest = (source: string, sections: SectionValues[]): ValueManifest =>
  ({ source, elements: [], sections, viewport: { width: 1280, height: 800 } }) as unknown as ValueManifest

/** A capture bundle written straight to disk, so coverage can be asked about it. */
function writeBundleDir(capture: Record<string, unknown>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'req270-bundle-'))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  // `referenceCoverage` measures against the ladder oracle and refuses a bundle
  // that has none, so the minimum viable one is written beside it.
  writeFileSync(
    path.join(dir, 'multistate.json'),
    JSON.stringify(
      {
        url: capture.url,
        notes: [],
        projections: [
          {
            engine: 'chromium',
            viewport: { width: 1280, height: 800 },
            state: 'rest',
            manifest: {
              source: 'ref',
              elements: [{ role: 'body', text: 'x', box: { x: 0, y: 0, width: 100, height: 20 } }],
              sections: [{ index: 0, overlay: null, contentAnchorRatio: null, box: { x: 0, y: 0, width: 1280, height: 800 } }],
              viewport: { width: 1280, height: 800 },
            },
          },
        ],
      },
      null,
      2,
    ),
  )
  return dir
}

/** A bundle body at the pre-REQ-269 shape: no stamp, and none of the axes. */
const staleCaptureJson = (): Record<string, unknown> => ({
  url: 'https://example.test/',
  host: 'example.test',
  path: '/',
  capturedAt: '2026-09-17T23:01:30.421Z',
  viewport: { width: 1280, height: 800 },
  theme: { subScales: {} },
  sections: [
    {
      index: 0,
      box: { x: 0, y: 0, width: 1280, height: 800 },
      background: { kind: 'color', color: '#ffffff' },
      layout: { contentAlign: 'left', contentAnchorRatio: 0.5 },
      content: [{ role: 'body', text: 'A paragraph', lineHeightPx: 29 }],
      items: [],
      fields: [{ a11yRole: 'textbox', accessibleName: 'Your email address', controlType: 'text' }],
    },
  ],
  assets: [],
})

describe('REQ-270 — a bundle records which extractor took it', () => {
  // ── 1. A capture taken today stamps itself ─────────────────────────────────
  itB('test_UAT_FC_REQ-270_capture_stamps_the_extractor_schema', () => {
    expect(heroCapture!.captureSchema, 'a fresh bundle names the extractor that wrote it').toBe(CAPTURE_SCHEMA)
    expect(captureSchemaOf(heroCapture!)).toBe(CAPTURE_SCHEMA)
    // Current means current: a bundle taken now has nothing to warn about.
    expect(staleCaptureDetail(heroCapture!)).toBeNull()
    expect(staleCaptureAxes(heroCapture!)).toEqual([])
  })

  // ── 2. …and an unstamped one reads as the oldest schema, by name ───────────
  it('test_UAT_FC_REQ-270_unstamped_bundle_names_the_axes_it_cannot_express', () => {
    const stale = staleCaptureJson() as unknown as Capture
    expect(captureSchemaOf(stale), 'no stamp IS a schema — the oldest one').toBe(1)

    const axes = staleCaptureAxes(stale).map((a) => a.axis)
    // Exactly the three the gigabytealchemy bundle was missing, plus the
    // precision it recorded at the wrong rounding.
    expect(axes).toContain('paddingTopPx/paddingRightPx/paddingBottomPx/paddingLeftPx')
    expect(axes).toContain('href')
    expect(axes).toContain('headingLevel')
    expect(axes).toContain('lineHeightPx to two decimals')

    const detail = staleCaptureDetail(stale)!
    expect(detail, 'names both versions').toContain('schema 1')
    expect(detail).toContain(`vs ${CAPTURE_SCHEMA}`)
    expect(detail, 'and says what to do about it').toContain('1c capture page https://example.test/')
    // A finding, NOT an automatic re-capture: re-taking moves the oracle.
    expect(detail).toContain('NOT automatic')
  })

  // ── 3. An axis the bundle demonstrably HAS is never claimed as missing ─────
  it('test_UAT_FC_REQ-270_an_axis_the_bundle_carries_is_not_named_as_absent', () => {
    const partial = staleCaptureJson()
    const sections = partial.sections as Record<string, unknown>[]
    ;(sections[0].fields as Record<string, unknown>[])[0].paddingLeftPx = 16
    ;(sections[0].content as Record<string, unknown>[])[0].href = '/contact'
    const axes = staleCaptureAxes(partial as unknown as Capture).map((a) => a.axis)
    expect(axes, 'the finding claims absence, so it may only claim what it can see').not.toContain(
      'paddingTopPx/paddingRightPx/paddingBottomPx/paddingLeftPx',
    )
    expect(axes).not.toContain('href')
    // …and the ones it genuinely lacks are still named.
    expect(axes).toContain('headingLevel')
  })

  // ── 4. The gate reports it as a coverage finding ───────────────────────────
  it('test_UAT_FC_REQ-270_gate_coverage_reports_a_bundle_behind_its_extractor', async () => {
    const staleDir = writeBundleDir(staleCaptureJson())
    const freshDir = writeBundleDir({ ...staleCaptureJson(), captureSchema: CAPTURE_SCHEMA })
    try {
      const stale = await referenceCoverage(fsReferenceBundle(staleDir))
      const finding = stale.findings.find((f) => f.kind === 'stale-capture')
      expect(finding, 'a stale oracle is a coverage finding, not a silence').toBeDefined()
      expect(finding!.detail).toContain('older capture')
      expect(finding!.detail).toContain('headingLevel')

      const fresh = await referenceCoverage(fsReferenceBundle(freshDir))
      expect(fresh.findings.some((f) => f.kind === 'stale-capture'), 'a current bundle says nothing').toBe(false)
    } finally {
      rmSync(staleDir, { recursive: true, force: true })
      rmSync(freshDir, { recursive: true, force: true })
    }
  })

  // ── 5. …and the round is told before it spends itself on a frozen residual ──
  it('test_UAT_FC_REQ-270_round_context_names_the_stale_oracle', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'req270-gate-'))
    try {
      const detail = staleCaptureDetail(staleCaptureJson() as unknown as Capture)!
      writeFileSync(
        path.join(dir, 'gate.json'),
        JSON.stringify({
          verdict: 'pass',
          pass: true,
          diagnosis: 'the eye and the gate agree',
          nextStep: 'nothing outstanding',
          perceptual: { meanDiff: 0.31, pctOverThreshold: 0.1, regions: 10 },
          values: { deltas: 1 },
          coverage: { unreferencedImages: [], findings: [{ kind: 'stale-capture', detail }] },
        }),
      )
      const gate = readGateReport(path.join(dir, 'gate.json'))!
      expect(gate.coverageFindings?.[0]?.kind).toBe('stale-capture')

      const prompt = buildPrompt('BRIEF', {
        n: 2,
        slug: 'repro-example',
        originalUrl: 'https://example.test/',
        bundleDir: '/bundle',
        evidenceDir: dir,
        pageDocument: '/page.json',
        siteDir: '/site',
        gate,
        rail: { summary: 'rail' },
        knownGaps: [],
      } as unknown as RoundContext)
      // Verbatim, not counted: the finding is a statement about the ORACLE, and a
      // round cannot re-derive it from evidence the oracle produced.
      expect(prompt).toContain('coverage `stale-capture`')
      expect(prompt).toContain('older capture')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe("REQ-270 — a reproduction's band paint comes from the layer that paints it", () => {
  // ── 6. The image layer's paint reaches the band record ─────────────────────
  itB('test_UAT_FC_REQ-270_band_paint_comes_from_the_image_layer_not_the_fill_box', () => {
    const hero = heroRepro!.sections[0]
    // The slice is the OUTERMOST box — the 900px fill, not the 800px photograph.
    expect(hero.box).toEqual({ x: 0, y: 0, width: 1280, height: 900 })
    // …and its paint is the photograph sitting inside it, which before REQ-270
    // was discarded with the layer that carried it.
    expect(hero.backgroundImageUrl, "the reproduction's own hero reaches its own manifest").toMatch(
      /req270-hero\.png$/,
    )
  })

  // ── 7. The reference projection agrees, over the same page ─────────────────
  itB('test_UAT_FC_REQ-270_reference_projection_reads_the_same_hero', () => {
    const withImage = heroCapture!.sections.filter((s) => s.background.image)
    expect(withImage.length, 'the hero band paints an image on the reference side too').toBeGreaterThan(0)
    expect(withImage[0].background.image).toMatch(/req270-hero\.png$/)
    // The fill underneath is not lost to the layer above it: the colour is still
    // the outermost box's, which is what a band's fill is.
    expect(withImage[0].background.color?.toLowerCase()).toBe('#030717')
  })

  // ── 8. And a lost hero is now a delta rather than a silence ────────────────
  it('test_UAT_FC_REQ-270_values_diff_reports_a_lost_section_background', () => {
    const box = { x: 0, y: 0, width: 1280, height: 800 }
    const second = { x: 0, y: 800, width: 1280, height: 400 }
    const expected = manifest('ref', [
      section({ index: 0, box, backgroundImageUrl: 'assets/AlchemistLabWithTech.png' }),
      section({ index: 1, box: second }),
    ])
    const dropped = manifest('ours', [section({ index: 0, box }), section({ index: 1, box: second })])
    const deltas = diffManifests(expected, dropped).deltas.filter((d) => d.role === 'section')
    expect(deltas.map((d) => d.property), 'a reproduction that lost the hero used to diff clean').toContain(
      'backgroundImage',
    )
    expect(deltas.find((d) => d.property === 'backgroundImage')!.actual).toBe('(none)')

    // Compared by MIRRORED BASENAME, because the two sides legitimately spell the
    // same bytes differently — the reference the site-local mirror, our render the
    // absolute origin URL. Same bytes, no delta.
    const painted = manifest('ours', [
      section({ index: 0, box, backgroundImageUrl: 'http://127.0.0.1:8080/assets/AlchemistLabWithTech.png' }),
      section({ index: 1, box: second }),
    ])
    expect(
      diffManifests(expected, painted).deltas.filter((d) => d.property === 'backgroundImage'),
      'the same asset named two ways is not a defect',
    ).toEqual([])
  })
})

describe('REQ-270 — a scrim is a scrim however it is painted', () => {
  // ── 9. The gradient-layer veil is measured on the reproduction side ────────
  itB('test_UAT_FC_REQ-270_gradient_layer_scrim_is_measured_on_the_reproduction', () => {
    // The only syntax `render.ts` can emit for an L1 `overlay` axis:
    // `linear-gradient(#0307174d, #0307174d)` — 0x4d/255 = 0.302.
    expect(heroRepro!.sections[0].overlay).toEqual({ color: '#030717', opacity: 0.3 })
  })

  // ── 10. …so the false delta the round reported is gone ─────────────────────
  itB('test_UAT_FC_REQ-270_no_false_overlay_delta_against_a_veiled_hero', () => {
    const hero = heroRepro!.sections[0]
    const expected = manifest('ref', [
      section({
        index: 0,
        box: hero.box,
        overlay: { color: '#030717', opacity: 0.3 },
        backgroundImageUrl: 'assets/req270-hero.png',
      }),
      section({ index: 1, box: heroRepro!.sections[1]?.box ?? { x: 0, y: 900, width: 1280, height: 400 } }),
    ])
    const sectionDeltas = diffManifests(expected, heroRepro!).deltas.filter(
      (d) => d.role === 'section' && (d.property === 'overlay' || d.property === 'backgroundImage'),
    )
    expect(sectionDeltas, 'the reproduction paints both, and is no longer blamed for either').toEqual([])
  })
})

describe('REQ-270 — an anchor is only comparable over the same population of runs', () => {
  const hero = { x: 0, y: 0, width: 1280, height: 800 }
  const header = { x: 0, y: 0, width: 1280, height: 192 }
  const below = { x: 0, y: 800, width: 1280, height: 500 }

  const actual = (heroAnchor: number): ValueManifest =>
    manifest('ours', [
      section({ index: 0, box: hero, contentAnchorRatio: heroAnchor }),
      section({ index: 1, box: below, contentAnchorRatio: 0.5 }),
    ])

  // ── 11. An overlapped reference section is not compared, and says why ──────
  it('test_UAT_FC_REQ-270_overlapped_reference_section_anchor_is_not_compared', () => {
    // The gigabytealchemy shape exactly: an absolutely-positioned header is its
    // OWN reference section sitting inside the hero, so the reference's anchor
    // excludes the wordmark (0.53) and the reproduction's geometric slice
    // includes it (0.39).
    const expected = manifest('ref', [
      section({ index: 0, box: header, contentAnchorRatio: null }),
      section({ index: 1, box: hero, contentAnchorRatio: 0.53 }),
      section({ index: 2, box: below, contentAnchorRatio: 0.5 }),
    ])
    // A TOLERANCE WAS NEVER THE ANSWER, so the discriminating case leads: the
    // observed pair (0.53 vs 0.39) was silent only because 0.14 fell 0.01 under
    // the tolerance, and one widened to absorb it would absorb a real 100px shift
    // too. The guard fires on the OVERLAP, whatever the two numbers are.
    const wild = diffManifests(expected, actual(0.05))
    expect(
      wild.deltas.filter((d) => d.property === 'contentAnchor'),
      'a 0.48 gap on identical geometry is still two different measurements, not a defect',
    ).toEqual([])

    const diff = diffManifests(expected, actual(0.39))
    expect(
      diff.deltas.filter((d) => d.property === 'contentAnchor'),
      'two numbers that do not mean the same thing are not compared',
    ).toEqual([])

    const pairing = diff.sectionPairing.find((p) => p.label === '§1')!
    expect(pairing.anchorComparable).toBe(false)
    expect(pairing.anchorReason, 'and the reason names the section that made it incomparable').toContain('§0')
  })

  // ── 12. …and an ordinary page still compares it ────────────────────────────
  it('test_UAT_FC_REQ-270_non_overlapping_sections_still_compare_the_anchor', () => {
    const expected = manifest('ref', [
      section({ index: 0, box: hero, contentAnchorRatio: 0.53 }),
      section({ index: 1, box: below, contentAnchorRatio: 0.5 }),
    ])
    const diff = diffManifests(expected, actual(0.3))
    const anchor = diff.deltas.filter((d) => d.property === 'contentAnchor')
    expect(anchor.length, 'nothing overlaps, so the anchor means the same thing on both sides').toBe(1)
    expect(diff.sectionPairing.find((p) => p.label === '§0')!.anchorComparable).toBeUndefined()

    // A page whose sections merely ABUT is not an overlap: 800 ends where 800
    // begins, and §1 must still be compared.
    expect(diff.sectionPairing.find((p) => p.label === '§1')!.anchorComparable).toBeUndefined()
  })
})
