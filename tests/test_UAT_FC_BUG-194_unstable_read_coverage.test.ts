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
  type MultiStateCapture,
  type Raster,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'
import { CAPTURE_SCHEMA } from '../tools/generate/src/cli/capture'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'

/**
 * UATs for BUG-194 — an oracle that disagrees with itself was graded
 * `structural-failure` instead of `capture-incomplete`.
 *
 * hearingzone510 was captured mid-scroll: one header run sat at y 118.6 in the
 * 1280×800 projection and y 12.6 in the 1280×1000 one — same x, width and height.
 * Every image was referenced and every band held content, so no coverage proxy
 * fired and the gate handed a round 690 findings measured against it.
 *
 * The fix adds an `unstable-read` coverage finding — a run that sits HIGHER in
 * the taller viewport at one width, by more than its own height — and routes it
 * to `capture-incomplete` ahead of every other rung, beside BUG-189's
 * `empty-section`. Driven through the real `referenceCoverage` and `1c gate`
 * entry points over offline bundles on disk; nothing we own is mocked.
 */

const LADDER = [320, 768, 1280]
const HEIGHTS = [800, 1000]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug194-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function el(text: string, box: ValueElement['box']): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 20,
    fontWeight: 400,
    lineHeightPx: 24,
    box,
  }
}

type Box = NonNullable<ValueElement['box']>

interface BundleSpec {
  /** Where the probed run sits at a given viewport (width, height). */
  run: (width: number, height: number) => Box
  /** Push the heading past the viewport so the structural gate fails. */
  overhangPx?: number
}

const RUN = 'Learn to train your brain to hear better.'

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
    sections: [
      {
        box: { x: 0, y: 0, width: 1280, height: 1200 },
        screenshot: { x: 0, y: 0, width: 1280, height: 1200 },
        background: { kind: 'color', color: '#ffffff' },
        layout: {
          textOverImage: false,
          contentAlign: 'left',
          arrangement: 'stack',
          columns: 1,
          contentMaxWidthPx: null,
          contentAnchorRatio: null,
        },
        content: [
          { role: 'heading', text: 'Front door heading', color: '#111827', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 600 },
          { role: 'body', text: RUN, color: '#111827', fontFamily: 'Inter', fontSizePx: 20, fontWeight: 400 },
        ],
        items: [],
        fields: [],
      },
    ],
    assets: [],
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))

  const projections: StateProjection[] = HEIGHTS.flatMap((height) =>
    LADDER.map((width) => ({
      engine: 'chromium' as const,
      viewport: { width, height },
      state: 'rest' as const,
      manifest: {
        source: `ref@chromium:${width}x${height}:rest`,
        viewport: { width, height },
        sections: [{ index: 0, overlay: null, contentAnchorRatio: null, box: { x: 0, y: 0, width, height: 1200 } }],
        elements: [
          el('Front door heading', { x: 20, y: 300, width: width - 40 + (spec.overhangPx ?? 0), height: 48 }),
          el(RUN, spec.run(width, height)),
        ],
      } satisfies ValueManifest,
    })),
  )
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

/** The filed shape: a sticky header read mid-scroll — higher in the taller viewport, at 1280 only. */
const MID_SCROLL = (width: number, height: number): Box =>
  width === 1280 && height === 1000
    ? { x: 20, y: 12.6, width: 600, height: 24 }
    : { x: 20, y: width === 1280 ? 118.6 : 600, width: 600, height: 24 }

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('BUG-194 — coverage names a run the oracle places in two places', () => {
  it('test_UAT_FC_BUG-194_run_higher_in_taller_viewport_is_an_unstable_read_finding', async () => {
    const dir = await writeBundle({ run: MID_SCROLL })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    const finding = coverage.findings.find((f) => f.kind === 'unstable-read')
    expect(finding).toBeDefined()
    expect(finding!.side).toBeUndefined()
    expect(finding!.detail).toMatch(/^1 text run\(s\)/)
    expect(finding!.detail).toMatch(/"Learn to train your brain to hear bet…" at 1280px y 118\.6 \(h 800\) → 12\.6 \(h 1000\)/)
  })

  it('test_UAT_FC_BUG-194_run_lower_in_taller_viewport_is_not_a_finding', async () => {
    // Content below a 100vh hero: same size, pushed DOWN by the height delta. Legitimate.
    const dir = await writeBundle({ run: (_w, h) => ({ x: 20, y: h + 40, width: 600, height: 24 }) })
    const coverage = await referenceCoverage(fsReferenceBundle(dir))

    expect(coverage.findings.map((f) => f.kind)).not.toContain('unstable-read')
  })

  it('test_UAT_FC_BUG-194_run_that_resizes_or_moves_less_than_its_height_is_not_a_finding', async () => {
    const resized = await writeBundle({
      run: (_w, h) => (h === 1000 ? { x: 20, y: 12.6, width: 600, height: 48 } : { x: 20, y: 118.6, width: 600, height: 24 }),
    })
    const nudged = await writeBundle({
      run: (_w, h) => ({ x: 20, y: h === 1000 ? 100 : 118, width: 600, height: 24 }),
    })

    for (const dir of [resized, nudged]) {
      const coverage = await referenceCoverage(fsReferenceBundle(dir))
      expect(coverage.findings.map((f) => f.kind)).not.toContain('unstable-read')
    }
  })
})

describe('BUG-194 — an unstable-read finding decides the verdict', () => {
  it('test_UAT_FC_BUG-194_unstable_read_outranks_structural_failure', async () => {
    const ref = await writeBundle({ run: MID_SCROLL, overhangPx: 600 })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.l1Pass).toBe(false)
    expect(report.verdict).toBe('capture-incomplete')
    expect(report.pass).toBe(false)
    expect(report.coverage.findings.map((f) => f.kind)).toContain('unstable-read')
    const text = formatGateReport(report, ref)
    expect(text).toMatch(/disagrees with itself/)
    expect(text).toMatch(/⚠ unstable-read: 1 text run\(s\)/)
    expect(text).toMatch(/structural gate also failed/)
  })

  it('test_UAT_FC_BUG-194_structural_failure_unchanged_without_the_finding', async () => {
    const ref = await writeBundle({ run: (_w, h) => ({ x: 20, y: h + 40, width: 600, height: 24 }), overhangPx: 600 })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest(),
      out: freshDir('out'),
    })

    expect(report.verdict).toBe('structural-failure')
  })
})
