/**
 * BUG-178 — a property the reference USES and nothing can measure is counted as
 * unmeasured.
 *
 * THE DEFECT, in one sentence: on `faelan.com` the round's headline read
 * `unmeasured 0 — 0 axes, 0 bands, 0 populations, 0 probes` while
 * `1c capture audit` listed seven properties the page uses that the register
 * marks `not-expressible`. One of them, `text-underline-offset: 4px`, was 100%
 * of that round's ranked region score.
 *
 * Two ledgers that never met. [[REQ-275]]'s audit knows what the page uses and
 * what the capture decided about it. [[REQ-277]]'s unmeasured set was composed
 * from comparator-side silence only, so a property the capture declines because
 * L1 cannot say it was invisible twice: no delta, because nothing compared it,
 * and no unmeasured row, because nothing asked the audit.
 *
 * WHAT IS EXERCISED, through the real functions at every seam:
 *   - `unmeasuredPropertiesOf` (the audit's rows) → `reconcileGates` → `gate.json`
 *     on disk → `readGateReport` → `unmeasuredOf` → `headlineOf`/`breakdownOf` →
 *     `buildPrompt`, which is the surface the round actually reads;
 *   - `cmdGate` itself, with a browser driver whose page answers the audit probe,
 *     so the gate is shown to RUN the audit, and a fully pre-shot gate to run none;
 *   - `AUDIT_SCRIPT` evaluated over a real DOM (jsdom), for the inert-declaration
 *     half: `vertical-align` on a `display:block` image does nothing and is not
 *     counted as use.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import {
  AUDIT_SCRIPT,
  auditObservations,
  diffManifests,
  unmeasuredPropertiesOf,
  type Capture,
  type RawAudit,
  type ValueManifest,
} from '../tools/generate/src/cli/capture'
import {
  cmdGate,
  cmdNew,
  formatGateReport,
  reconcileGates,
  writeMultiState,
  writeRasterPng,
  type BrowserDriver,
  type BrowserDriverFactory,
  type CapturedResponse,
  type GateReport,
  type MultiStateCapture,
  type Raster,
  type ReconcileInput,
} from '../tools/generate/src/cli'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'
import { breakdownOf, headlineOf, unmeasuredOf } from '../tools/repro-console/src/unmeasured'
import { buildPrompt, readGateReport, type RoundContext } from '../tools/repro-console/src/ai'

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug178-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── the page, as the audit sees it ───────────────────────────────────────────
//
// The faelan.com shape from the ticket: a run axis the extractor records and this
// bundle does not carry (`text-underline-offset`, captured before REQ-365), and
// the background / overflow longhands L1 has no axis for. `declined` and
// `recorded`-and-carried rows ride along to show they are NOT counted.

const FAELAN_AUDIT: RawAudit = {
  elements: 22,
  css: [
    { property: 'text-underline-offset', count: 3, values: ['4px'] },
    { property: 'background-size', count: 1, values: ['cover'] },
    { property: 'overflow-x', count: 2, values: ['hidden'] },
    { property: 'color', count: 9, values: ['#111111'] },
    { property: 'display', count: 12, values: ['flex', 'block'] },
  ],
  dom: [],
}

/** A capture with one run and no underline offset on it — the bundle that lost it. */
const capture = (): Capture =>
  ({
    url: 'https://faelan.com/',
    host: 'faelan.com',
    path: '/',
    capturedAt: '2026-10-01T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [
      {
        box: { x: 0, y: 0, width: 1280, height: 800 },
        screenshot: { x: 0, y: 0, width: 1280, height: 800 },
        background: { kind: 'color', color: '#ffffff' },
        layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null, contentAnchorRatio: 0.5 },
        content: [{ role: 'body', text: 'Read more', color: '#111111', fontFamily: 'Inter', fontSizePx: 16, fontWeight: 400 }],
        items: [],
        fields: [],
      },
    ],
    assets: [],
  }) as unknown as Capture

// ── the gate harness: every gate clean, so the properties are the only story ──

const manifest = (source: string): ValueManifest =>
  ({ source, elements: [], sections: [], viewport: { width: 1280, height: 800 } }) as unknown as ValueManifest

function gateOn(properties?: ReconcileInput['properties']): GateReport {
  return reconcileGates({
    l1Gate: {
      pass: true,
      onSample: { pass: true, byWidth: [{ width: 1280, findings: [] }] },
      offSample: { pass: true, byWidth: [{ width: 506, height: 800, findings: [] }] },
      contentRobustness: { pass: true, byWidth: [{ width: 1280, height: 800, findings: [] }] },
    },
    coverage: { mirroredImages: 0, referencedImages: 0, unreferencedImages: [], sections: 1, pageHeightPx: 800, pxPerSection: 800, findings: [] },
    perceptual: { meanDiff: 0, pctOverThreshold: 0, regions: [] },
    values: diffManifests(manifest('ref'), manifest('ours')),
    ...(properties !== undefined ? { properties } : {}),
  })
}

/** Written to disk and read back the way the console reads it. */
function roundTrip(report: GateReport): { file: unknown; summary: ReturnType<typeof readGateReport> } {
  const file = path.join(freshDir('gate'), 'gate.json')
  writeFileSync(file, JSON.stringify(report, null, 2))
  return { file: JSON.parse(readFileSync(file, 'utf8')), summary: readGateReport(file) }
}

describe('BUG-178 — the audit reaches the unmeasured set', () => {
  it('test_UAT_FC_BUG-178_audit_rows_are_counted_and_named_in_the_headline', () => {
    const audit = auditObservations(FAELAN_AUDIT, capture(), 'faelan.com/index')
    const properties = unmeasuredPropertiesOf(audit)
    // Exactly the not-expressible and lost rows: carried (`color`) and declined
    // (`display`, a layout mechanism) are measured some other way, or on purpose.
    expect(properties.map((p) => [p.property, p.verdict]).sort()).toEqual([
      ['background-size', 'not-expressible'],
      ['overflow-x', 'not-expressible'],
      ['text-underline-offset', 'lost'],
    ])

    const report = gateOn(properties)
    const { file, summary } = roundTrip(report)

    // `gate.json` carries the rows whole — property, verdict, values, count.
    expect((file as GateReport).unmeasuredProperties).toContainEqual(
      expect.objectContaining({ property: 'text-underline-offset', verdict: 'lost', values: ['4px'], count: 3 }),
    )

    // The headline the round is told to drive down now counts them…
    const set = unmeasuredOf(file)
    expect(headlineOf(set)).toBe('unmeasured 3')
    expect(set.silent).toEqual([])
    // …and the breakdown names each one with what is at stake.
    const breakdown = breakdownOf(set)
    expect(breakdown).toMatch(/3 properties \(/)
    expect(breakdown).toContain('text-underline-offset (4px; not carried by this bundle)')
    expect(breakdown).toContain('background-size (cover)')
    expect(breakdown).toContain('overflow-x (hidden)')

    // The surface the round actually reads carries the same headline.
    const prompt = buildPrompt('BRIEF', {
      n: 6,
      slug: 'repro-faelan-com',
      originalUrl: 'https://faelan.com/',
      bundleDir: '/bundle',
      evidenceDir: '/evidence',
      pageDocument: '/page.json',
      siteDir: '/site',
      gate: summary,
      rail: { summary: 'rail' },
      knownGaps: [],
    } as unknown as RoundContext)
    expect(prompt).toContain('**unmeasured 3**')
    expect(prompt).toContain('text-underline-offset (4px')
  })

  it('test_UAT_FC_BUG-178_properties_are_named_but_do_not_change_the_verdict', () => {
    const properties = unmeasuredPropertiesOf(auditObservations(FAELAN_AUDIT, capture(), 'faelan.com/index'))
    const without = gateOn()
    const withProps = gateOn(properties)

    // Unmeasured is not a delta: the verdict is decided exactly as before…
    expect(withProps.verdict).toBe(without.verdict)
    expect(withProps.pass).toBe(without.pass)
    // …but a passing rung no longer reads as silent about what it did not measure.
    expect(without.nextStep).not.toContain('unmeasuredProperties')
    expect(withProps.nextStep).toContain('3 property/properties the reference uses could not be measured')
    expect(withProps.nextStep).toContain('text-underline-offset (4px)')
    // The operator's terminal read names them too.
    const terminal = formatGateReport(withProps).replace(/\s+/g, ' ')
    expect(terminal).toContain('⚠ 3 property/properties the reference uses could not be measured')
    expect(terminal).toContain('text-underline-offset (4px)')
  })

  it('test_UAT_FC_BUG-178_absent_field_keeps_the_four_part_total_and_failed_audit_is_silent', () => {
    // A gate that never ran the audit (fully pre-shot, or older than BUG-178)
    // claims nothing about properties: the part is not in the set, and the total
    // is the four-part one with no `≥`.
    const notAsked = unmeasuredOf(roundTrip(gateOn()).file)
    expect(notAsked.parts.map((p) => p.id)).toEqual(['axes', 'bands', 'populations', 'probes'])
    expect(headlineOf(notAsked)).toBe('unmeasured 0')

    // An audit that ran and found nothing is a measured zero.
    const clean = unmeasuredOf(roundTrip(gateOn([])).file)
    expect(clean.parts.map((p) => p.id)).toContain('properties')
    expect(headlineOf(clean)).toBe('unmeasured 0')
    expect(breakdownOf(clean)).toContain('0 properties')

    // An audit that was attempted and FAILED is not a zero: the part is silent and
    // the headline can only be a lower bound.
    const failedReport = gateOn({ error: "Bundle 'x' has no rendered.html to serve." })
    expect(failedReport.unmeasuredProperties).toBeNull()
    expect(failedReport.unmeasuredPropertiesError).toContain('rendered.html')
    const failed = unmeasuredOf(roundTrip(failedReport).file)
    expect(failed.silent).toEqual(['properties'])
    expect(headlineOf(failed)).toBe('unmeasured ≥ 0')
    expect(breakdownOf(failed)).toContain('not counted, and not zero')
  })
})

// ── `cmdGate` runs the audit ─────────────────────────────────────────────────

const LADDER = [320, 768, 1280]

function flat(w: number, h: number, value: number): Raster {
  return { data: new Uint8Array(w * h * 3).fill(value), width: w, height: h, channels: 3 }
}

function oracle(): MultiStateCapture {
  return {
    url: 'https://faelan.com/',
    notes: [],
    projections: LADDER.map((width) => ({
      engine: 'chromium',
      viewport: { width, height: 900 },
      state: 'rest',
      manifest: {
        source: `ref@chromium:${width}:rest`,
        viewport: { width, height: 900 },
        sections: [{ index: 0, overlay: null, contentAnchorRatio: 0.5 }],
        elements: [],
      },
    })),
  } as unknown as MultiStateCapture
}

/** A reference bundle every gate can run against, with a DOM the audit can serve. */
async function writeBundle(): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture(), null, 2))
  writeFileSync(path.join(dir, 'rendered.html'), '<html><body><a href="/">Read more</a></body></html>')
  await writeMultiState(fsReferenceBundle(dir), oracle())
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

function actualManifest(): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  writeFileSync(file, JSON.stringify({ source: 'draft:fixture', elements: [], sections: [{ index: 0, overlay: null, contentAnchorRatio: 0.5 }] }))
  return file
}

/** A browser whose page answers the audit probe with the faelan.com observations. */
class AuditingDriver implements BrowserDriver {
  readonly scripts: string[] = []
  constructor(private readonly png: Uint8Array) {}
  async navigate(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> {
    return this.png
  }
  async query<T>(script: string): Promise<T> {
    this.scripts.push(script)
    return (script === AUDIT_SCRIPT ? FAELAN_AUDIT : {}) as T
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

describe('BUG-178 — `1c gate` runs the capture audit', () => {
  it('test_UAT_FC_BUG-178_gate_json_carries_the_audit_when_the_gate_opens_a_browser', async () => {
    const cwd = freshDir('site')
    cmdNew('repro-site', { cwd })
    const ref = await writeBundle()
    const out = freshDir('out')
    const shot = path.join(freshDir('shot'), 'a.png')
    await writeRasterPng(flat(64, 64, 0), shot)
    const driver = new AuditingDriver(readFileSync(shot))

    await cmdGate({
      cwd,
      slug: 'repro-site',
      ref,
      actualManifestPath: actualManifest(),
      out,
      driverFactory: async () => driver,
    })

    // The probe the audit runs was actually evaluated against a page…
    expect(driver.scripts).toContain(AUDIT_SCRIPT)
    // …and what it found is on disk, where the console reads it.
    const gate = JSON.parse(readFileSync(path.join(out, 'gate.json'), 'utf8')) as GateReport
    expect(gate.unmeasuredProperties?.map((p) => p.property).sort()).toEqual([
      'background-size',
      'overflow-x',
      'text-underline-offset',
    ])
    expect(headlineOf(unmeasuredOf(gate))).toBe(`unmeasured ${unmeasuredOf(gate).total}`)
    expect(unmeasuredOf(gate).parts.find((p) => p.id === 'properties')?.count).toBe(3)
  })

  it('test_UAT_FC_BUG-178_a_fully_pre_shot_gate_runs_no_audit', async () => {
    const ref = await writeBundle()
    const out = freshDir('out')
    const shot = path.join(freshDir('shot'), 'a.png')
    await writeRasterPng(flat(64, 64, 0), shot)
    const spy = vi.fn(async () => {
      throw new Error('a pre-shot gate asked for a browser')
    })

    await cmdGate({
      ref,
      actualImagePath: shot,
      actualManifestPath: actualManifest(),
      out,
      driverFactory: spy as unknown as BrowserDriverFactory,
    })

    expect(spy).not.toHaveBeenCalled()
    const gate = JSON.parse(readFileSync(path.join(out, 'gate.json'), 'utf8')) as Record<string, unknown>
    expect(gate).not.toHaveProperty('unmeasuredProperties')
  })
})

// ── the probe stops counting inert declarations ──────────────────────────────

/** Evaluate `AUDIT_SCRIPT` over `html`, with every element given a visible box. */
function audit(html: string): RawAudit {
  const dom = new JSDOM(html, { runScripts: 'outside-only' })
  // jsdom lays nothing out, so every box reads 0×0 and the probe would see no
  // visible element at all. Visibility is not what this test is about.
  dom.window.Element.prototype.getBoundingClientRect = () =>
    ({ x: 0, y: 0, width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, toJSON: () => ({}) }) as DOMRect
  return dom.window.eval(AUDIT_SCRIPT) as RawAudit
}

const observed = (raw: RawAudit, property: string) => raw.css.find((p) => p.property === property)

describe('BUG-178 — a declaration that cannot apply is not use', () => {
  it('test_UAT_FC_BUG-178_vertical_align_on_a_block_image_is_not_observed', () => {
    // The faelan.com mirrored stylesheet, verbatim in shape: a reset that sets
    // vertical-align on media AND makes them block boxes, where it does nothing.
    const raw = audit(
      '<html><head><style>img,svg,video{vertical-align:middle;display:block}</style></head>' +
        '<body><img src="x.png"></body></html>',
    )
    expect(observed(raw, 'vertical-align')).toBeUndefined()
    // The rule still matched, and its other declaration is still counted.
    expect(observed(raw, 'display')?.values).toEqual(['block'])
  })

  it('test_UAT_FC_BUG-178_vertical_align_on_an_inline_element_is_observed', () => {
    // jsdom resolves no UA default for an inline element's display, so the fixture
    // states it; a browser computes `inline` here on its own.
    const raw = audit(
      '<html><head><style>.sup{vertical-align:super;display:inline}</style></head>' +
        '<body><p>E = mc<span class="sup">2</span></p><b style="vertical-align: sub; display: inline-block">x</b></body></html>',
    )
    const va = observed(raw, 'vertical-align')
    expect(va?.values.sort()).toEqual(['sub', 'super'])
    expect(va?.count).toBe(2)
  })
})
