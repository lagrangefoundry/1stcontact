import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdGate,
  formatGateReport,
  referenceCoverage,
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
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

/**
 * UATs for BUG-189 — a reference section with a box and no content is not
 * flagged, so a capture that lost two of its six sections (bluelotus: the
 * contact and footer bands, 952px) read `structural-failure` instead of
 * `capture-incomplete`.
 *
 * The fix adds two coverage proxies — `emptySections` (tall bands holding no
 * manifest element) and `unrecordedText` (rendered.html text capture.json never
 * recorded) — and an `empty-section` finding when they corroborate, which routes
 * to `capture-incomplete` ahead of every other rung.
 *
 * Driven through the real `referenceCoverage` and `1c gate` entry points over
 * offline bundles on disk; nothing we own is mocked.
 */

const LADDER = [320, 375, 768, 1024, 1280, 1440]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug189-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

const HEADING: ContentRun = {
  role: 'heading',
  text: 'Front door heading',
  color: '#111827',
  fontFamily: 'Inter',
  fontSizePx: 40,
  fontWeight: 600,
}

function el(text: string, box: ValueElement['box']): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 40,
    fontWeight: 600,
    lineHeightPx: 48,
    box,
  }
}

function captureSection(): Section {
  return {
    box: { x: 0, y: 0, width: 1280, height: 400 },
    screenshot: { x: 0, y: 0, width: 1280, height: 400 },
    background: { kind: 'color', color: '#ffffff' },
    layout: {
      textOverImage: false,
      contentAlign: 'left',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio: null,
    },
    content: [HEADING],
    items: [],
    fields: [],
  }
}

interface Band {
  height: number
  /** CSS background-image handle the band paints, if any. */
  bg?: string
  /** The band carries its own full-bleed paint record as a textless element. */
  paint?: boolean
}

interface BundleSpec {
  /** Bands stacked from y=0. The heading always stands in the first. */
  bands: Band[]
  /** The bundle's rendered.html, or omitted for a bundle without one. */
  renderedHtml?: string
  /** Push the heading past the viewport so the structural gate fails. */
  overhangPx?: number
}

function bandValues(index: number, y: number, width: number, band: Band): SectionValues {
  const sv: SectionValues = { index, overlay: null, contentAnchorRatio: null, box: { x: 0, y, width, height: band.height } }
  if (band.bg) sv.backgroundImageUrl = band.bg
  return sv
}

async function writeBundle(spec: BundleSpec): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-10-03T00:00:00.000Z',
    captureSchema: CAPTURE_SCHEMA,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [captureSection()],
    assets: [],
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  if (spec.renderedHtml !== undefined) writeFileSync(path.join(dir, 'rendered.html'), spec.renderedHtml)

  const projections: StateProjection[] = LADDER.map((width) => {
    const sections: SectionValues[] = []
    const paints: ValueElement[] = []
    let y = 0
    spec.bands.forEach((band, index) => {
      sections.push(bandValues(index, y, width, band))
      if (band.paint) {
        paints.push({ ...el('', { x: 0, y, width, height: band.height }), textless: true, role: 'generic' } as ValueElement)
      }
      y += band.height
    })
    return {
      engine: 'chromium',
      viewport: { width, height: 900 },
      state: 'rest',
      manifest: {
        source: `ref@chromium:${width}:rest`,
        viewport: { width, height: 900 },
        sections,
        elements: [el('Front door heading', { x: 20, y: 100, width: width - 40 + (spec.overhangPx ?? 0), height: 48 }), ...paints],
      } satisfies ValueManifest,
    }
  })
  const oracle: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }
  await writeMultiState(fsReferenceBundle(dir), oracle)
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

function flat(w: number, h: number, value: number): Raster {
  return { data: new Uint8Array(w * h * 3).fill(value), width: w, height: h, channels: 3 }
}

async function actualShot(value: number): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(flat(64, 64, value), file)
  return file
}

function actualManifest(): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  writeFileSync(file, JSON.stringify({ source: 'draft:fixture', elements: [], sections: [] } satisfies ValueManifest))
  return file
}

/** The bluelotus shape: a recorded first band, then a contact band the capture lost. */
const LOST_CONTACT_HTML = `<!doctype html><html><head><title>Fixture</title><style>.x{color:red}</style></head><body>
  <section><h1>Front door heading</h1></section>
  <section><h2>Get in Touch</h2><p>support@fixture.test</p><button>Submit Your Message</button></section>
  <footer><p>&copy; 2025. All rights reserved.</p></footer>
  <script>var hidden = "Not visible text"</script>
</body></html>`

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('BUG-189 — coverage names a section with a box and no content', () => {
  it('test_UAT_FC_BUG-189_empty_band_with_unrecorded_text_is_an_empty_section_finding', async () => {
    const dir = await writeBundle({
      bands: [{ height: 400 }, { height: 560, paint: true }, { height: 392, paint: true }],
      renderedHtml: LOST_CONTACT_HTML,
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    // The band's own full-bleed paint record is the band, not content on it.
    expect(coverage.emptySections).toEqual([
      { index: 1, y: 400, height: 560 },
      { index: 2, y: 960, height: 392 },
    ])
    // Script text and the recorded heading are excluded; entities are decoded.
    expect(coverage.unrecordedText).toEqual([
      'Get in Touch',
      'support@fixture.test',
      'Submit Your Message',
      '© 2025. All rights reserved.',
    ])
    const finding = coverage.findings.find((f) => f.kind === 'empty-section')
    expect(finding).toBeDefined()
    expect(finding!.detail).toMatch(/section 1 \(y 400, 560px\), section 2 \(y 960, 392px\)/)
    expect(finding!.detail).toMatch(/952px/)
    expect(finding!.detail).toMatch(/"Get in Touch"/)
  })

  it('test_UAT_FC_BUG-189_empty_band_without_unrecorded_text_is_not_a_finding', async () => {
    // A decorative band with every rendered string recorded is reported as data
    // and not escalated: one proxy alone is not evidence of a lost section.
    const dir = await writeBundle({
      bands: [{ height: 400 }, { height: 560 }],
      renderedHtml: '<html><body><h1>Front door heading</h1></body></html>',
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.emptySections).toEqual([{ index: 1, y: 400, height: 560 }])
    expect(coverage.unrecordedText).toEqual([])
    expect(coverage.findings.map((f) => f.kind)).not.toContain('empty-section')
  })

  it('test_UAT_FC_BUG-189_short_bands_and_image_bands_are_not_empty', async () => {
    const dir = await writeBundle({
      bands: [{ height: 400 }, { height: 120 }, { height: 600, bg: 'https://fixture.test/hero.jpg' }],
      renderedHtml: LOST_CONTACT_HTML,
    })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.emptySections).toEqual([])
    expect(coverage.unrecordedText!.length).toBeGreaterThan(0)
    expect(coverage.findings.map((f) => f.kind)).not.toContain('empty-section')
  })

  it('test_UAT_FC_BUG-189_bundle_without_rendered_html_reports_text_unmeasured', async () => {
    const dir = await writeBundle({ bands: [{ height: 400 }, { height: 560 }] })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.unrecordedText).toBeNull()
    expect(coverage.findings.map((f) => f.kind)).not.toContain('empty-section')
  })
})

describe('BUG-189 — an empty-section finding decides the verdict', () => {
  it('test_UAT_FC_BUG-189_empty_section_outranks_structural_failure', async () => {
    // The filed run: the structural gate failed against an oracle that lost two
    // sections. The verdict is the capture, not the reproduction.
    const ref = await writeBundle({
      bands: [{ height: 400 }, { height: 560, paint: true }, { height: 392, paint: true }],
      renderedHtml: LOST_CONTACT_HTML,
      overhangPx: 600,
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.l1Pass).toBe(false)
    expect(report.verdict).toBe('capture-incomplete')
    expect(report.coverage.findings.map((f) => f.kind)).toContain('empty-section')
    const text = formatGateReport(report, ref)
    expect(text).toMatch(/lost whole sections/)
    expect(text).toMatch(/empty-section/)
    expect(text).toMatch(/empty {6}section 1 \(y 400, 560px\)/)
  })

  it('test_UAT_FC_BUG-189_empty_section_fails_a_run_the_eyes_would_pass', async () => {
    // An unmeasured section is not a clean one: identical pixels, no deltas, and
    // still not a pass while the oracle is missing sections.
    const ref = await writeBundle({
      bands: [{ height: 400 }, { height: 560 }],
      renderedHtml: LOST_CONTACT_HTML,
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.perceptualBreach).toBe(false)
    expect(report.verdict).toBe('capture-incomplete')
    expect(report.pass).toBe(false)
  })

  it('test_UAT_FC_BUG-189_structural_failure_unchanged_without_the_finding', async () => {
    const ref = await writeBundle({
      bands: [{ height: 400 }],
      renderedHtml: '<html><body><h1>Front door heading</h1></body></html>',
      overhangPx: 600,
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('structural-failure')
  })
})
