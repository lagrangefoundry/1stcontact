import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdNew,
  cmdValuesDiff,
  cmdValuesDiffMultiViewport,
  type BrowserDriver,
  type Capture,
  type CapturedResponse,
  type ContentRun,
  type RawSignals,
  type Section,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for BUG-103 — the manifest seam only ran one way.
 *
 * `values-diff` builds a full value manifest for the REPRODUCTION every run —
 * every element's resolved colour, type and box, plus the section-level values —
 * hands it to the diff, and drops it. What landed on disk described only the
 * comparison, so a delta whose `actual` is a summary (`contentAnchor:
 * center (0.50)` is a band name and two decimals) could not be read back to the
 * values behind it, and re-deriving them meant re-running the browser.
 *
 * `--actual-out` / `--expected-out` write the two manifests the diff was
 * computed from. BOTH sides, because the expected side is a projection of the
 * bundle computed in-process too, and because the two `sections` lists are not
 * the same kind of list — the capture's are coalesced, the reproduction's are
 * its raw bands — so one side alone cannot tell a misplaced section from a
 * section-count mismatch.
 */

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'bug103-'))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── the reference side: a two-section capture with a low-anchored hero ────────

function run(text: string, over: Partial<ContentRun> = {}): ContentRun {
  return { role: 'body', text, color: '#ffffff', fontFamily: 'Inter', fontSizePx: 18, fontWeight: 400, ...over }
}

function section(box: Section['box'], content: ContentRun[], contentAnchorRatio: number | null): Section {
  return {
    box,
    screenshot: box,
    background: { kind: 'color', color: '#101820' },
    layout: {
      textOverImage: false,
      contentAlign: 'center',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio,
    },
    content,
    items: [],
    fields: [],
  }
}

/** The reference: a hero anchored LOW (0.66) and a second band anchored high. */
function writeRefBundle(dir: string): string {
  const capture: Capture = {
    url: 'https://ref.example/',
    host: 'ref.example',
    path: '/',
    capturedAt: '2026-09-17T00:00:00.000Z',
    viewport: { width: 800, height: 600 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [
      section({ x: 0, y: 0, width: 800, height: 300 }, [run('Fake Hero', { role: 'heading', fontSizePx: 40, fontWeight: 700 })], 0.66),
      section({ x: 0, y: 300, width: 800, height: 300 }, [run('Second band')], 0.2),
    ],
    assets: [],
  }
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  return dir
}

// ── the actual side: a fake driver standing in for the headless browser ───────

/**
 * What the reproduction's DOM reports. ONE band where the reference has two, and
 * that band anchored at 0.50 where the reference's hero is at 0.66 — the shape
 * of the delta that could not be closed: an anchor two decimals apart and a
 * section list of a different length, indistinguishable from the report alone.
 */
const REPRO_SIGNALS: RawSignals = {
  viewport: { width: 800, height: 600 },
  bands: [
    {
      box: { x: 0, y: 0, width: 800, height: 600 },
      backgroundColor: '#101820',
      backgroundImage: 'none',
      colorScheme: 'dark',
      fontFamily: 'Inter',
      textAlign: 'center',
      paddingTopPx: 40,
      paddingBottomPx: 40,
      overlay: null,
      contentAnchorRatio: 0.5,
      content: [{ role: 'heading', text: 'Fake Hero', color: '#ffffff', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 700 }],
      items: [],
      fields: [],
    },
  ],
  colorUsage: [],
  fontFaces: [],
  typeScale: [40],
  spacingScalePx: [40],
  containerMaxWidthPx: 720,
  images: [],
}

class FakeDriver implements BrowserDriver {
  async navigate(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> {
    return new TextEncoder().encode('PNGBYTES')
  }
  async query<T>(): Promise<T> {
    return REPRO_SIGNALS as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>Fake Hero</body></html>'
  }
  async close(): Promise<void> {}
}

/** A driver that fails the test if it is ever constructed — proves "no browser". */
function forbiddenDriver(): never {
  throw new Error('a browser was launched on a path that must be offline')
}

function readManifest(p: string): ValueManifest {
  return JSON.parse(readFileSync(p, 'utf8')) as ValueManifest
}

// ── AC: the manifests the diff was computed from reach disk ──────────────────

describe('BUG-103 — values-diff writes the manifests it computed from', () => {
  /**
   * The headline: on the LIVE path — the one that launches a browser, which is
   * the only path where the reproduction's manifest exists nowhere else — both
   * sides land on disk, and the reproduction's own section list is readable:
   * its count, each band's box, each band's `contentAnchorRatio`.
   */
  it('test_UAT_FC_BUG-103_live_run_writes_both_manifests_with_readable_sections', async () => {
    const cwd = freshDir()
    cmdNew('repro-site', { cwd })
    const ref = writeRefBundle(path.join(cwd, 'bundle'))
    const actualOut = path.join(cwd, 'actual.json')
    const expectedOut = path.join(cwd, 'expected.json')

    const report = await cmdValuesDiff({
      cwd,
      slug: 'repro-site',
      refBundleDir: ref,
      actualOut,
      expectedOut,
      driverFactory: async () => new FakeDriver(),
    })

    expect(existsSync(actualOut), 'the reproduction manifest is written').toBe(true)
    expect(existsSync(expectedOut), 'the reference manifest is written').toBe(true)

    // The reproduction side, read back: the section list the report only ever
    // summarised. One band, at 0.50 — the `actual` of a `contentAnchor` delta.
    const actual = readManifest(actualOut)
    expect(actual.source).toBe('draft:repro-site')
    expect(actual.sections).toHaveLength(1)
    expect(actual.sections[0].contentAnchorRatio).toBe(0.5)
    expect(actual.sections[0].box).toMatchObject({ width: 800, height: 600 })

    // The reference side beside it: TWO sections, the hero at 0.66. Only with
    // both lists in hand is the delta legible as a section-count mismatch rather
    // than a hero that slid up the page.
    const expected = readManifest(expectedOut)
    expect(expected.sections).toHaveLength(2)
    expect(expected.sections[0].contentAnchorRatio).toBe(0.66)
    expect(expected.sections.length).not.toBe(actual.sections.length)

    // And the delta this evidence exists to close is in the report, summarised —
    // a band name and two decimals over everything asserted above.
    const anchor = report.deltas.find((d) => d.property === 'contentAnchor')
    expect(anchor?.actual).toContain('0.50')
  })

  /**
   * The round-trip the ticket asks for: the file `--actual-out` wrote is a file
   * `--actual` reads, and replaying it reproduces the same report with no
   * browser. The second run's driver factory throws if it is ever reached.
   */
  it('test_UAT_FC_BUG-103_written_manifest_replays_through_actual_without_a_browser', async () => {
    const cwd = freshDir()
    cmdNew('repro-site', { cwd })
    const ref = writeRefBundle(path.join(cwd, 'bundle'))
    const actualOut = path.join(cwd, 'actual.json')

    const live = await cmdValuesDiff({
      cwd,
      slug: 'repro-site',
      refBundleDir: ref,
      actualOut,
      driverFactory: async () => new FakeDriver(),
    })

    const replayed = await cmdValuesDiff({
      cwd,
      refBundleDir: ref,
      actualManifestPath: actualOut,
      driverFactory: forbiddenDriver,
    })

    expect(replayed).toEqual(live)
  })

  /**
   * The write is unconditional. A side supplied from disk is written out again
   * rather than skipped, so the flag means the same thing on every path — there
   * is no "it only writes when it rendered" caveat for a round to discover.
   */
  it('test_UAT_FC_BUG-103_offline_side_is_written_out_too', async () => {
    const cwd = freshDir()
    const ref = writeRefBundle(path.join(cwd, 'bundle'))
    const input = path.join(cwd, 'in.json')
    writeFileSync(input, JSON.stringify({ source: 'draft:offline', elements: [], sections: [{ index: 0, overlay: null, contentAnchorRatio: 0.5 }] }))
    const actualOut = path.join(cwd, 'out.json')

    await cmdValuesDiff({
      cwd,
      refBundleDir: ref,
      actualManifestPath: input,
      actualOut,
      driverFactory: forbiddenDriver,
    })

    expect(existsSync(actualOut)).toBe(true)
    expect(readManifest(actualOut)).toEqual(readManifest(input))
  })

  /**
   * `--multi-viewport` is refused, not ignored. Across the ladder the actual
   * side is a multi-state projection rather than one manifest, so there is
   * nothing of the right shape to write — and a silently dropped flag is exactly
   * what let `--actual-out` look like it worked for a whole round before this
   * bug was filed. The error names the paths that do support it.
   */
  it('test_UAT_FC_BUG-103_multi_viewport_refuses_the_manifest_flags', async () => {
    const cwd = freshDir()
    cmdNew('repro-site', { cwd })
    const ref = writeRefBundle(path.join(cwd, 'bundle'))
    const actualOut = path.join(cwd, 'never-written.json')

    await expect(
      cmdValuesDiffMultiViewport({
        cwd,
        slug: 'repro-site',
        refBundleDir: ref,
        actualOut,
        driverFactory: async () => new FakeDriver(),
      }),
    ).rejects.toThrow(/--size/)

    expect(existsSync(actualOut), 'refused, so nothing is written').toBe(false)
  })
})
