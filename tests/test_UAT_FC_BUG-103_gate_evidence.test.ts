import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdDiff,
  cmdGate,
  cmdNew,
  writeMultiState,
  writeRasterPng,
  type BrowserDriver,
  type Capture,
  type CapturedResponse,
  type ContentRun,
  type MultiStateCapture,
  type Raster,
  type Section,
  type StateProjection,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'
import { buildPrompt } from '../tools/repro-console/src/ai'

/**
 * UATs for BUG-103, the gate's half: the artifacts that describe the
 * REPRODUCTION rather than the comparison reach the iteration's evidence
 * directory, without a flag anyone has to know to pass.
 *
 * The reproduction console already runs `1c gate … --out <iteration>/diff`, so
 * `--out` is the seam that puts evidence in front of a diagnosing round. Two
 * artifacts were missing from it: the value manifests (computed and dropped),
 * and the reproduction's own screenshot — shot into a scratch directory that is
 * deleted on the way out, while `regions.json` persisted the deleted path as its
 * `actual` field. A stored report naming a file that does not exist.
 */

const LADDER = [320, 768, 1280]

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug103-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders ─────────────────────────────────────────────────────────

function flat(w: number, h: number, value: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(value)
  return { data, width: w, height: h, channels: 3 }
}

function el(text: string, box: ValueElement['box']): ValueElement {
  return { text, role: 'body', color: '#111827', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 600, lineHeightPx: 48, box }
}

function run(text: string): ContentRun {
  return { role: 'body', text, color: '#111827', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 600 }
}

function section(content: ContentRun[]): Section {
  return {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: { kind: 'color', color: '#ffffff' },
    layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null, contentAnchorRatio: 0.66 },
    content,
    items: [],
    fields: [],
  }
}

function oracle(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections: [{ index: 0, overlay: null, contentAnchorRatio: 0.66 }],
      elements: [el('Front door heading', { x: 20, y: 100, width: width - 40, height: 48 })],
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/** A reference bundle the three gates can all run against. */
async function writeBundle(): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-09-17T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [section([run('Front door heading')])],
    assets: [],
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  await writeMultiState(fsReferenceBundle(dir), oracle())
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  return dir
}

async function actualShot(value: number): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(flat(64, 64, value), file)
  return file
}

function actualManifest(): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  const manifest: ValueManifest = { source: 'draft:fixture', elements: [], sections: [{ index: 0, overlay: null, contentAnchorRatio: 0.5 }] }
  writeFileSync(file, JSON.stringify(manifest))
  return file
}

describe('BUG-103 — the gate writes the reproduction-side evidence', () => {
  /**
   * `--out` is the whole interface. A round is handed a directory of files and
   * told to read them; the three artifacts that describe the reproduction now
   * land in it beside the three that describe the comparison.
   */
  it('test_UAT_FC_BUG-103_gate_out_carries_both_manifests_and_the_actual_shot', async () => {
    const ref = await writeBundle()
    const out = freshDir('out')

    await cmdGate({
      ref,
      actualImagePath: await actualShot(4),
      actualManifestPath: actualManifest(),
      out,
    })

    // The comparison, as before…
    for (const f of ['gate.json', 'values-diff.json', 'regions.json']) {
      expect(existsSync(path.join(out, f)), `${f} still written`).toBe(true)
    }
    // …and now the reproduction, and the reference it was graded against.
    for (const f of ['actual-manifest.json', 'expected-manifest.json', 'actual.png']) {
      expect(existsSync(path.join(out, f)), `${f} written with no flag asked for`).toBe(true)
    }

    // The two manifests are the two SIDES, not one file written twice: the
    // reproduction's single section sits at 0.50, the reference's at 0.66.
    const actual = JSON.parse(readFileSync(path.join(out, 'actual-manifest.json'), 'utf8')) as ValueManifest
    const expected = JSON.parse(readFileSync(path.join(out, 'expected-manifest.json'), 'utf8')) as ValueManifest
    expect(actual.source).toBe('draft:fixture')
    expect(actual.sections[0].contentAnchorRatio).toBe(0.5)
    expect(expected.source).toContain('fixture.test')
    expect(expected.sections[0].contentAnchorRatio).toBe(0.66)
  })
})

/** A driver whose screenshot is a real PNG, so the perceptual eye can decode it. */
class ShootingDriver implements BrowserDriver {
  constructor(private readonly png: Uint8Array) {}
  async navigate(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> {
    return this.png
  }
  async query<T>(): Promise<T> {
    return {} as T
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

describe('BUG-103 — the reproduction screenshot survives the run', () => {
  /**
   * The live perceptual path shoots the reproduction into a `mkdtemp` scratch
   * directory that is removed in a `finally`. `regions.json` records that path
   * as `actual`, so what the report names has to still be there. The per-region
   * `-ours.png` crops are not a substitute: they cover only what the region
   * ranker happened to pick.
   */
  it('test_UAT_FC_BUG-103_live_diff_keeps_the_shot_regions_json_names', async () => {
    const cwd = freshDir('site')
    cmdNew('repro-site', { cwd })
    const ref = await writeBundle()
    const out = freshDir('diffout')
    const shotFile = await actualShot(200)
    const png = readFileSync(shotFile)

    const report = await cmdDiff({
      cwd,
      slug: 'repro-site',
      ref,
      out,
      actualOut: path.join(out, 'actual.png'),
      driverFactory: async () => new ShootingDriver(png),
    })

    // The report names the kept file, in the evidence directory…
    expect(report.actual).toBe(path.join(out, 'actual.png'))
    // …and the file the report names is on disk when the run is over.
    expect(existsSync(report.actual), 'regions.json names a file that exists').toBe(true)
    const persisted = JSON.parse(readFileSync(path.join(out, 'regions.json'), 'utf8')) as { actual: string }
    expect(persisted.actual).toBe(report.actual)
    expect(existsSync(persisted.actual)).toBe(true)
    // It is the reproduction's own bytes, not a copy of the reference.
    expect(readFileSync(persisted.actual)).toEqual(png)
  })
})

describe('BUG-103 — the round is told the new evidence exists', () => {
  /**
   * Written evidence a round does not know about is evidence it will not read.
   * The brief hands over PATHS, so the three new files belong in the same list
   * as `gate.json` / `values-diff.json` / `regions.json` — and the list says why
   * the manifests are there: a delta whose `actual` is a band name and two
   * decimals is read back from the `sections` list behind it, on both sides,
   * whose lengths are not comparable without checking.
   */
  it('test_UAT_FC_BUG-103_round_brief_names_the_reproduction_side_artifacts', () => {
    const prompt = buildPrompt('BRIEF-BODY', {
      n: 2,
      slug: 'repro-gigabytealchemy-ai',
      originalUrl: 'https://gigabytealchemy.ai/',
      bundleDir: '/refs/gigabytealchemy.ai/index',
      evidenceDir: '/it/2/diff',
      pageDocument: '/it/2/page.json',
      siteDir: '/it/2/site',
      gate: null,
      rail: { available: false, pass: false, summary: 'no rail' },
      knownGaps: [],
    })

    expect(prompt).toContain('/it/2/diff/actual-manifest.json')
    expect(prompt).toContain('/it/2/diff/expected-manifest.json')
    expect(prompt).toContain('/it/2/diff/actual.png')
    // Named with the reason they are there, not just listed.
    expect(prompt).toMatch(/summarised rather than raw|summarised/i)
    expect(prompt).toMatch(/coalesced/)
  })
})
