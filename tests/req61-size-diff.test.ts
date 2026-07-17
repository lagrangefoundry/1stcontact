import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdValuesDiff,
  parseArgs,
  writeMultiState,
  VIEWPORTS,
  type MultiStateCapture,
  type StateProjection,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * UATs for REQ-61 — `values-diff --size mobile|tablet|desktop`.
 *
 * A single-width values-diff reads the reference at one width; a responsive site
 * reflows discretely between sizes (a component departs on mobile, a font steps
 * down, nav collapses). `--size` diffs at ONE named viewport: the reference is
 * read from the persisted ladder (`multistate.json`) at that width and the actual
 * side is rendered there — so the phone cell is compared phone↔phone.
 *
 * These are pure/offline: the reference ladder is authored in-memory and written
 * to a bundle, and the actual side is injected as a manifest — no browser.
 */

/** A minimal manifest whose `source` encodes the width, so the diff report's
 * `expectedSource` reveals which projection the selector picked. */
function manifestAtWidth(width: number): ValueManifest {
  return {
    source: `ref@chromium:${width}:rest`,
    elements: [],
    sections: [],
    viewport: { width, height: 800 },
    engine: 'chromium',
    state: 'rest',
  }
}

/** A ladder reference: one rest/chromium projection per named-size width. */
function ladderBundle(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'req61-ladder-'))
  const projections: StateProjection[] = [
    { engine: 'chromium', viewport: VIEWPORTS.mobile, state: 'rest', manifest: manifestAtWidth(VIEWPORTS.mobile.width) },
    { engine: 'chromium', viewport: VIEWPORTS.tablet, state: 'rest', manifest: manifestAtWidth(VIEWPORTS.tablet.width) },
    { engine: 'chromium', viewport: VIEWPORTS.desktop, state: 'rest', manifest: manifestAtWidth(VIEWPORTS.desktop.width) },
  ]
  const matrix: MultiStateCapture = { url: 'ref', projections, notes: [] }
  writeMultiState(dir, matrix)
  return dir
}

const tmpDirs: string[] = []
function actualManifestFile(m: ValueManifest): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'req61-actual-'))
  tmpDirs.push(dir)
  const file = path.join(dir, 'actual.json')
  writeFileSync(file, JSON.stringify(m))
  return file
}

const bundles: string[] = []
afterEach(() => {
  for (const d of bundles.splice(0)) rmSync(d, { recursive: true, force: true })
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

describe('REQ-61 — values-diff --size selects the reference projection at that width', () => {
  it('test_UAT_FC_REQ-61_size_selects_matching_ladder_width', async () => {
    const dir = ladderBundle()
    bundles.push(dir)
    // The actual side is an empty manifest — content is irrelevant here; we assert
    // WHICH reference width was diffed against via the report's expectedSource.
    const actual = actualManifestFile({ source: 'draft:x', elements: [], sections: [] })

    const tablet = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actual, size: 'tablet' })
    expect(tablet.expectedSource).toBe(`ref@chromium:${VIEWPORTS.tablet.width}:rest`)

    const mobile = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actual, size: 'mobile' })
    expect(mobile.expectedSource).toBe(`ref@chromium:${VIEWPORTS.mobile.width}:rest`)

    const desktop = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actual, size: 'desktop' })
    expect(desktop.expectedSource).toBe(`ref@chromium:${VIEWPORTS.desktop.width}:rest`)
  })

  it('test_UAT_FC_REQ-61_size_terminal_fails_on_stale_reference', async () => {
    // A bundle with no multistate.json predates the ladder. --size must halt with a
    // re-capture instruction rather than silently fall back to a desktop comparison.
    const empty = mkdtempSync(path.join(tmpdir(), 'req61-stale-'))
    bundles.push(empty)
    const actual = actualManifestFile({ source: 'draft:x', elements: [], sections: [] })
    await expect(
      cmdValuesDiff({ refBundleDir: empty, actualManifestPath: actual, size: 'tablet' }),
    ).rejects.toThrow(/multistate\.json/)
  })

  it('test_UAT_FC_REQ-61_size_fails_loudly_when_width_absent_from_ladder', async () => {
    // A ladder that never reached the requested width must fail with the widths it
    // does carry — never diff against the wrong width.
    const dir = mkdtempSync(path.join(tmpdir(), 'req61-partial-'))
    bundles.push(dir)
    // Ladder with only mobile — tablet/desktop are absent.
    const matrix: MultiStateCapture = {
      url: 'ref',
      projections: [
        { engine: 'chromium', viewport: VIEWPORTS.mobile, state: 'rest', manifest: manifestAtWidth(VIEWPORTS.mobile.width) },
      ],
      notes: [],
    }
    writeMultiState(dir, matrix)
    const actual = actualManifestFile({ source: 'draft:x', elements: [], sections: [] })
    await expect(
      cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actual, size: 'desktop' }),
    ).rejects.toThrow(new RegExp(`no projection at width ${VIEWPORTS.desktop.width}px`))
  })
})

describe('REQ-61 — --size is a valued flag on the CLI surface', () => {
  it('test_UAT_FC_REQ-61_size_flag_parses_as_value', () => {
    // `values-diff <slug> --ref <dir> --size tablet` must capture tablet as the
    // flag value and keep the slug positional intact.
    const parsed = parseArgs(['values-diff', 'site', '--ref', 'bundle/dir', '--size', 'tablet'])
    expect(parsed.flags.size).toBe('tablet')
    expect(parsed.flags.ref).toBe('bundle/dir')
    expect(parsed.positionals).toEqual(['values-diff', 'site'])
  })
})
