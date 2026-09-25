/**
 * REQ-308 issue 2 — a reference band that paints nothing was counted as a
 * reproduction gap that no reproduction could ever close.
 *
 * The two section lists are built by DIFFERENT PROCEDURES. The reference's bands
 * are `document.body`'s children qualified on their subtree's painted extent
 * (BUG-27); the reproduction's are the band nodes the fold emits, and
 * `foldSectionBackgrounds` emits one only for a section carrying an image or an
 * overlay — solid bands arrive as run surfaces. So a reference band with no fill,
 * no image and no overlay has nothing for ANY fold to emit: the missing
 * counterpart belongs to the comparison, not to the reproduction, and no amount
 * of folding will drive the count down.
 *
 * Measured on `storage/references/gigabytealchemy.ai/index`: `§0` is
 * `<header class="absolute top-0 left-0 right-0 z-40">` — a transparent,
 * absolutely-positioned header lying over the hero, a band only because BUG-27
 * qualifies a collapsed-but-painting child on its subtree's extent. Its record is
 * `surfaceFill: null`, no `backgroundImageUrl`, `overlay: null`. It was the WHOLE
 * of that round's `unmeasured` number, and it is a content grouping rather than a
 * surface — so counting it as an uncompared surface is a category error.
 *
 * The ticket offered two fixes and declined to pick between them on the evidence
 * it had. This takes the instrument side, which it names as preferred, and within
 * it the "classify it as not-a-band" variant rather than "pair it to the geometric
 * slice that contains its runs": that slice is `§1`, the 800px hero, and comparing
 * a 192px transparent header's band values against it would be a second category
 * error in place of the first.
 *
 * Reclassified, NOT dropped. The band is still listed, still carries its geometry,
 * and now carries the reason it is not counted — BUG-111's discipline (an
 * uncompared band must be visible somewhere a reader actually looks) applied to
 * BUG-111's own count.
 *
 * What this does NOT do is rescue `§1`'s anchor. REQ-270 declines that comparison
 * because the two sides measure it over different POPULATIONS of runs, and
 * reclassifying the band that overlaps it says nothing about that.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdGate,
  diffManifests,
  writeMultiState,
  writeRasterPng,
  type Capture,
  type ContentRun,
  type MultiStateCapture,
  type Raster,
  type Section,
  type SectionValues,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'
import { CAPTURE_SCHEMA } from '../tools/generate/src/cli/capture'
import { fsReferenceBundle as fsBundle } from '../tools/generate/src/store/fs-reference-store'
import { breakdownOf, headlineOf, unmeasuredOf } from '../tools/repro-console/src/unmeasured'

// ── level 1: the manifests, transcribed from the evidence ───────────────────

const band = (index: number, y: number, height: number, over: Partial<SectionValues> = {}): SectionValues => ({
  index,
  overlay: null,
  contentAnchorRatio: 0.5,
  // Measured, and it paints none. A pre-schema-3 bundle records `undefined`
  // here, which is a different fact — see the last UAT in this block.
  surfaceFill: null,
  box: { x: 0, y, width: 1280, height },
  ...over,
})

const manifest = (source: string, sections: SectionValues[], elements: ValueElement[] = []): ValueManifest => ({
  source,
  elements,
  sections,
})

/** gigabytealchemy.ai at 1280: the transparent header band over the hero, and six more. */
const REFERENCE_SECTIONS: SectionValues[] = [
  band(0, 0, 192, { contentAnchorRatio: 0.66, textAlign: 'left' }),
  band(1, 0, 800, { contentAnchorRatio: 0.53, overlay: { color: '#030717', opacity: 0.3 } }),
  band(2, 800, 487.5, { surfaceFill: '#e8dfd3' }),
  band(3, 1287.5, 594.5, { surfaceFill: '#e8dfd3' }),
]

/** The reproduction's bands: §1…§3 and no header, which is the whole off-by-one. */
const REPRO_BANDS: SectionValues[] = [
  band(0, 0, 800, { contentAnchorRatio: 0.53, overlay: { color: '#030717', opacity: 0.3 } }),
  band(1, 800, 488, { surfaceFill: '#e8dfd3' }),
  band(2, 1288, 594, { surfaceFill: '#e8dfd3' }),
]

describe('REQ-308 — a band that paints nothing is not an uncompared surface', () => {
  it('test_UAT_FC_REQ-308_a_paintless_unpaired_reference_band_is_reclassified', () => {
    // THE FAILURE: `unpairedSections: 1` on a page whose reproduction is correct.
    // The header paints nothing, so there is no band node any fold could emit for
    // it — the count stated a reproduction gap that could not be closed, and it
    // was the whole of the round's `unmeasured` number.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    expect(report.unpairedSections).toEqual([])
    expect(report.nonSurfaceSections.map((s) => s.label)).toEqual(['§0'])
    expect(report.nonSurfaceSections[0].box).toEqual({ x: 0, y: 0, width: 1280, height: 192 })
  })

  it('test_UAT_FC_REQ-308_the_reclassified_band_carries_the_reason_it_is_not_counted', () => {
    // Reclassified, not dropped. A count that silently got smaller would be the
    // defect BUG-111 fixed, facing the other way: the band is still listed, still
    // locatable, and now says WHY it is not an uncompared surface.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    const reason = report.nonSurfaceSections[0].reason
    expect(reason).toMatch(/paints NOTHING/)
    expect(reason).toMatch(/no fill, no background image, no overlay/)
    expect(reason).toMatch(/content grouping rather than a surface/)
    // And the pairing row it was derived from says the same thing, so the summary
    // and the rows it summarises cannot drift apart.
    const row = report.sectionPairing.find((p) => p.label === '§0')
    expect(row?.actualLabel).toBeNull()
    expect(row?.nonSurfaceReason).toBe(reason)
  })

  it('test_UAT_FC_REQ-308_a_band_that_does_paint_is_still_counted_as_unpaired', () => {
    // The discrimination, and the reason this is narrow. A band painting a fill,
    // an image or an overlay IS a surface the fold can emit, so a reproduction
    // missing it is a real gap and must keep being counted. Each of the three is
    // sufficient on its own.
    const painting: Array<[string, Partial<SectionValues>]> = [
      ['a fill', { surfaceFill: '#e8dfd3' }],
      ['an image', { backgroundImageUrl: 'assets/hero.png' }],
      ['an overlay', { overlay: { color: '#030717', opacity: 0.3 } }],
    ]
    for (const [what, paint] of painting) {
      const report = diffManifests(
        manifest('ref', [band(0, 0, 192, paint), ...REFERENCE_SECTIONS.slice(1)]),
        manifest('repro', REPRO_BANDS),
      )
      expect(report.unpairedSections.map((s) => s.label), `a band with ${what} is a surface`).toEqual(['§0'])
      expect(report.nonSurfaceSections, `a band with ${what} is not reclassified`).toEqual([])
    }
  })

  it('test_UAT_FC_REQ-308_an_unmeasured_fill_is_not_read_as_paints_nothing', () => {
    // `surfaceFill: undefined` is a capture bundle taken before schema 3, whose
    // transparent bands were recorded as an opaque fabrication of the body's
    // colour. "Paints nothing" is unknowable there, so the band stays unpaired
    // rather than being reclassified on an absence the instrument never read.
    const unmeasured = { ...band(0, 0, 192), surfaceFill: undefined }
    const report = diffManifests(
      manifest('ref', [unmeasured, ...REFERENCE_SECTIONS.slice(1)]),
      manifest('repro', REPRO_BANDS),
    )

    expect(report.unpairedSections.map((s) => s.label)).toEqual(['§0'])
    expect(report.nonSurfaceSections).toEqual([])
  })

  it('test_UAT_FC_REQ-308_the_overlapped_bands_anchor_is_still_declined', () => {
    // REQ-270's refusal is untouched, and saying so is the point: reclassifying
    // the header does NOT make the hero's anchor comparable. The two sides still
    // measure it over different populations of runs — the reference's is a
    // DOM-descendant walk that excludes the header's, ours a geometric slice that
    // cannot — so the anchor stays declined and the page still has a measurement
    // this ticket does not deliver.
    const report = diffManifests(manifest('ref', REFERENCE_SECTIONS), manifest('repro', REPRO_BANDS))

    const hero = report.sectionPairing.find((p) => p.label === '§1')
    expect(hero?.actualLabel).toBe('§0')
    expect(hero?.anchorComparable).toBe(false)
    expect(hero?.anchorReason).toMatch(/not the same measurement/)
  })

  it('test_UAT_FC_REQ-308_a_paintless_band_that_DOES_pair_is_compared_as_it_always_was', () => {
    // Nothing here changes what happens to a band with a partner. The
    // classification is only ever reached for an UNPAIRED reference band, so a
    // transparent band the reproduction does segment is compared exactly as
    // before — otherwise this would quietly stop comparing every unpainted band
    // on every page.
    const report = diffManifests(
      manifest('ref', [band(0, 0, 800, { textAlign: 'left' })]),
      manifest('repro', [band(0, 0, 800, { textAlign: 'center' })]),
    )

    expect(report.nonSurfaceSections).toEqual([])
    expect(report.deltas.map((d) => d.property)).toContain('textAlign')
  })
})

// ── level 2: a real bundle, driven through the real `cmdGate` ───────────────

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `req308-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function heading(text: string): ContentRun {
  return { role: 'heading', text, color: '#111827', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 600 }
}

function reproOf(run: ContentRun, box: ValueElement['box']): ValueElement {
  return {
    text: run.text,
    role: run.role,
    color: run.color,
    fontFamily: run.fontFamily,
    fontSizePx: run.fontSizePx,
    fontWeight: run.fontWeight,
    box,
  }
}

/** A reference band. `paints` false is the transparent header: schema 3+ `none`. */
function captureSection(index: number, run: ContentRun, paints: boolean): Section {
  return {
    box: { x: 0, y: index * 400, width: 1280, height: 400 },
    screenshot: { x: 0, y: index * 400, width: 1280, height: 400 },
    background: paints ? { kind: 'color', color: '#ffffff' } : { kind: 'none' },
    layout: {
      textOverImage: false,
      contentAlign: 'left',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio: null,
    },
    content: [run],
    items: [],
    fields: [],
  } as unknown as Section
}

function bandValues(index: number, width: number): SectionValues {
  return {
    index,
    overlay: null,
    contentAnchorRatio: null,
    surfaceFill: '#ffffff',
    box: { x: 0, y: index * 400, width, height: 400 },
  }
}

/** A reference bundle with one 400px band per heading; `paintless` names the ones that paint nothing. */
async function writeBundle(headings: string[], paintless: number[]): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const runs = headings.map(heading)
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-09-23T00:00:00.000Z',
    captureSchema: CAPTURE_SCHEMA,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: runs.map((run, i) => captureSection(i, run, !paintless.includes(i))),
    assets: [],
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))

  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections: runs.map((_, i) => bandValues(i, width)),
      elements: runs.map((run, i) => reproOf(run, { x: 20, y: i * 400 + 100, width: width - 40, height: 48 })),
    } satisfies ValueManifest,
  }))
  const oracle: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }
  await writeMultiState(fsBundle(dir), oracle)
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

function flat(w: number, h: number, value: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(value)
  return { data, width: w, height: h, channels: 3 }
}

async function actualShot(): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(flat(64, 64, 0), file)
  return file
}

/** Our reproduction: every heading (so elements pair clean) and only the named bands. */
function actualManifest(headings: string[], bandIndices: number[], paintless: number[] = []): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  const manifestOut: ValueManifest = {
    source: 'draft:fixture',
    elements: headings.map((t, i) => reproOf(heading(t), { x: 20, y: i * 400 + 100, width: 1240, height: 48 })),
    sections: bandIndices.map((i, n) => ({
      ...bandValues(i, 1280),
      index: n,
      ...(paintless.includes(i) ? { surfaceFill: null } : {}),
    })),
  }
  writeFileSync(file, JSON.stringify(manifestOut))
  return file
}

describe('REQ-308 — the gate stops counting a non-surface as unmeasured', () => {
  it('test_UAT_FC_REQ-308_gate_reports_the_reclassification_instead_of_an_unpaired_band', async () => {
    // The filed shape end to end: three reference bands, the middle one painting
    // nothing, and a reproduction that segments into the other two. `gate.json`
    // read `unpairedSections: 1` and told the round to drive it down — which no
    // fold could do, because the band it named has no counterpart to emit.
    const ref = await writeBundle(['One', 'Two', 'Three'], [1])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2]),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('pass')
    expect(report.values.unpairedSections).toBe(0)
    expect(report.values.nonSurfaceSections).toBe(1)
  })

  it('test_UAT_FC_REQ-308_the_pass_rung_says_the_band_was_reclassified', async () => {
    // Not silence. A count that merely got smaller would read as "the
    // reproduction improved", which it did not — so the rung names the category
    // and points at where the per-band reason already is.
    const ref = await writeBundle(['One', 'Two', 'Three'], [1])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2]),
      out: freshDir('out'),
    })

    expect(report.nextStep).toMatch(/1 reference band\(s\) paint NOTHING/)
    expect(report.nextStep).toMatch(/NOT counted as unpaired/)
    expect(report.nextStep).toContain('`values.nonSurfaceSections`')
    // …and it does NOT claim the band was compared.
    expect(report.nextStep).not.toMatch(/had no reproduction band to compare against/)
  })

  it('test_UAT_FC_REQ-308_a_painting_band_the_reproduction_lost_still_fails_loudly', async () => {
    // The regression this must not cause. A reference band that PAINTS and has no
    // counterpart is a real reproduction gap — the hero backdrop, a colour divider
    // strip — and BUG-111's rung has to keep firing for it.
    const ref = await writeBundle(['One', 'Two', 'Three'], [])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2]),
      out: freshDir('out'),
    })

    expect(report.values.unpairedSections).toBe(1)
    expect(report.values.nonSurfaceSections).toBe(0)
    expect(report.nextStep).toMatch(/1 reference section\(s\) had no reproduction band to compare against/)
  })

  it('test_UAT_FC_REQ-308_a_page_whose_bands_all_pair_says_neither_thing', async () => {
    // Earned, not decorative: a reproduction that segments as the reference does
    // reports no unpaired band AND no reclassified one, so a non-zero count on
    // either line always means something really happened.
    const ref = await writeBundle(['One', 'Two', 'Three'], [1])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 1, 2], [1]),
      out: freshDir('out'),
    })

    expect(report.values.unpairedSections).toBe(0)
    expect(report.values.nonSurfaceSections).toBe(0)
    expect(report.nextStep).not.toMatch(/paint NOTHING/)
  })
})

describe('REQ-308 — the round’s headline number says why it fell', () => {
  it('test_UAT_FC_REQ-308_the_unmeasured_set_names_the_reclassified_band', async () => {
    // REQ-277's headline is `unmeasured N`, and this ticket takes one off it.
    // A number that quietly got smaller reads as "the reproduction improved" —
    // which is exactly the false-progress shape REQ-277 exists to refuse, facing
    // the other way. The band leaves the count and is NAMED on the part it left.
    const ref = await writeBundle(['One', 'Two', 'Three'], [1])
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(),
      actualManifestPath: actualManifest(['One', 'Two', 'Three'], [0, 2]),
      out: freshDir('out'),
    })

    const set = unmeasuredOf(report)
    expect(headlineOf(set)).toBe('unmeasured 0')
    const bands = set.parts.find((p) => p.id === 'bands')!
    expect(bands.count).toBe(0)
    expect(bands.detail).toMatch(/1 reference band\(s\) paint nothing and are not counted/)
    expect(breakdownOf(set)).toMatch(/0 bands \(1 reference band\(s\) paint nothing/)
  })

  it('test_UAT_FC_REQ-308_a_report_with_nothing_to_reclassify_reads_as_it_always_did', () => {
    // Not a permanent row. A report carrying no reclassified band says nothing
    // about it, which is the same discipline every other part here follows — and
    // a report predating the field cannot say, which is not the same as zero.
    const quiet = unmeasuredOf({
      values: { unmeasuredAxes: [], unpairedSections: 1, unpairedActualSections: 0, unmatched: 0, unpairedActual: 0, nonSurfaceSections: 0 },
    })
    expect(quiet.parts.find((p) => p.id === 'bands')?.detail).toBeUndefined()
    expect(breakdownOf(quiet)).toMatch(/1 band,/)

    const older = unmeasuredOf({
      values: { unmeasuredAxes: [], unpairedSections: 1, unpairedActualSections: 0, unmatched: 0, unpairedActual: 0 },
    })
    expect(older.parts.find((p) => p.id === 'bands')?.detail).toBeUndefined()
    expect(headlineOf(older)).toBe('unmeasured 1')
  })
})
