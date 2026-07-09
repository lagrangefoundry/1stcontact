import { afterAll, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdValuesDiff,
  diffManifests,
  run,
  type Capture,
  type ContentRun,
  type Section,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-f826e5ca — the `1c values-diff` mechanical
 * value-level fidelity diff (REQ-31/REQ-35). One UAT per acceptance criterion
 * (AC-525 … AC-535), each driving a real entry point: the exported CLI
 * dispatcher `run(argv)` for the command-surface ACs (output forms, exit status,
 * offline `--actual`/slug handling) and the `cmdValuesDiff` / `diffManifests`
 * command APIs for the diff-semantics ACs, with a written capture bundle
 * (expected) and an in-memory / written actual manifest (no browser needed).
 */

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'recon-vdiff-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders (mirror req31-values-diff.test.ts) ──────────────────────

/** A ContentRun (capture/reference side) with sensible defaults. */
function run_(text: string, over: Partial<ContentRun> = {}): ContentRun {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

/** A ValueElement (actual side) with the same defaults. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

function manifest(source: string, elements: ValueElement[], sections: ValueManifest['sections'] = []): ValueManifest {
  return { source, elements, sections }
}

/** A section-only manifest (no text runs) for the section-level ACs. */
function sectionManifest(source: string, sections: ValueManifest['sections']): ValueManifest {
  return { source, elements: [], sections }
}

/** Wrap content runs in a single-section Capture and write its bundle to disk. */
function writeRefBundle(dir: string, content: ContentRun[], items: ContentRun[][] = []): string {
  const section: Section = {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: { kind: 'color', color: '#ffffff' },
    layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null },
    content,
    items: items.map((c) => ({ content: c })),
  }
  const capture: Capture = {
    url: 'https://ref.example/',
    host: 'ref.example',
    path: '/',
    capturedAt: '2026-07-03T00:00:00.000Z',
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: [section],
    assets: [],
  }
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))
  return dir
}

function writeActualManifest(dir: string, elements: ValueElement[], name = 'actual.json'): string {
  const p = path.join(dir, name)
  writeFileSync(p, JSON.stringify(manifest('draft:test', elements), null, 2))
  return p
}

/** Does the report carry a delta for this element text + property? */
function hasDelta(deltas: { text: string; property: string }[], textSub: string, property: string): boolean {
  return deltas.some((d) => d.text.includes(textSub) && d.property === property)
}

/** Run the CLI dispatcher, capturing stdout/stderr and the resulting exit code. */
async function runCli(argv: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const out: string[] = []
  const err: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((m?: unknown) => void out.push(String(m)))
  const errSpy = vi.spyOn(console, 'error').mockImplementation((m?: unknown) => void err.push(String(m)))
  const prev = process.exitCode
  process.exitCode = 0
  try {
    await run(argv)
    return { stdout: out.join('\n'), stderr: err.join('\n'), exitCode: Number(process.exitCode ?? 0) }
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
    process.exitCode = prev
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('story-f826e5ca — 1c values-diff (reconciliation UATs)', () => {
  // AC-525 — live values-diff produces a severity-ranked delta report with
  // integer matched/unmatched counts and richly-shaped deltas.
  it('test_UAT_AC525_report_exposes_counts_and_shaped_deltas', async () => {
    const dir = freshDir()
    writeRefBundle(dir, [run_('Sub', { color: '#000000', fontSizePx: 24 })])
    const actualPath = writeActualManifest(dir, [el('Sub', { color: '#ffffff', fontSizePx: 48 })])

    const report = await cmdValuesDiff({ refBundleDir: dir, actualManifestPath: actualPath })

    expect(Number.isInteger(report.matched)).toBe(true)
    expect(report.matched).toBeGreaterThanOrEqual(0)
    expect(report.matched).toBe(1)
    expect(Number.isInteger(report.unmatched)).toBe(true)
    expect(report.unmatched).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(report.deltas)).toBe(true)
    expect(report.deltas.length).toBeGreaterThan(0)
    for (const d of report.deltas) {
      expect(typeof d.text).toBe('string')
      expect(typeof d.role).toBe('string')
      expect(typeof d.property).toBe('string')
      expect(d.expected).toBeDefined()
      expect(d.actual).toBeDefined()
    }
    // Ranked most-severe first: colour (90) precedes font size (70).
    expect(report.deltas.map((d) => d.property)).toEqual(['color', 'fontSizePx'])
    expect(report.deltas[0].text).toBe('Sub')
    expect(report.deltas[0].role).toBe('body')
  })

  // AC-526 — every per-element styling field is compared; a lone disagreement is
  // flagged as its own property, and a field absent from the reference is skipped.
  it('test_UAT_AC526_per_element_fields_flagged_by_property', () => {
    const cases: Array<{ ref: Partial<ValueElement>; act: Partial<ValueElement>; property: string }> = [
      { ref: { color: '#000000' }, act: { color: '#ffffff' }, property: 'color' },
      { ref: { fontSizePx: 18 }, act: { fontSizePx: 48 }, property: 'fontSizePx' },
      { ref: { fontWeight: 400 }, act: { fontWeight: 700 }, property: 'fontWeight' },
      { ref: { fontFamily: 'sans' }, act: { fontFamily: 'serif' }, property: 'fontFamily' },
      {
        ref: { gradient: { angleDeg: 90, stops: ['#f6c453', '#d98c30'] } },
        act: { gradient: { angleDeg: 180, stops: ['#f6c453', '#d98c30'] } },
        property: 'gradient',
      },
      { ref: { borderLeft: { widthPx: 4, color: '#34d399' } }, act: { borderLeft: null }, property: 'borderLeft' },
      { ref: { lineHeightPx: 24 }, act: { lineHeightPx: 60 }, property: 'lineHeightPx' },
      { ref: { letterSpacingPx: 0 }, act: { letterSpacingPx: 3 }, property: 'letterSpacingPx' },
      { ref: { paddingLeftPx: 24 }, act: { paddingLeftPx: 64 }, property: 'paddingLeftPx' },
    ]
    for (const c of cases) {
      const report = diffManifests(manifest('ref', [el('X', c.ref)]), manifest('draft', [el('X', c.act)]))
      expect(report.deltas.length, `only ${c.property} differs`).toBe(1)
      expect(report.deltas[0].property).toBe(c.property)
    }
    // A field present on the actual but absent from the reference is not compared.
    const noRefLineHeight = diffManifests(
      manifest('ref', [el('X')]), // no lineHeightPx on the reference run
      manifest('draft', [el('X', { lineHeightPx: 999 })]),
    )
    expect(hasDelta(noRefLineHeight.deltas, 'X', 'lineHeightPx')).toBe(false)
    expect(noRefLineHeight.deltas).toEqual([])
  })

  // AC-527 — a casing difference is a `text` delta (still counted matched);
  // whitespace-only noise is ignored.
  it('test_UAT_AC527_casing_flagged_whitespace_ignored', () => {
    const casing = diffManifests(
      manifest('ref', [el('Gigabyte Alchemy', { role: 'heading' })]),
      manifest('draft', [el('GIGABYTE ALCHEMY', { role: 'heading' })]),
    )
    expect(casing.matched).toBe(1)
    expect(casing.unmatched).toBe(0)
    expect(hasDelta(casing.deltas, 'Gigabyte Alchemy', 'text')).toBe(true)
    const td = casing.deltas.find((d) => d.property === 'text')
    expect(td?.expected).toBe('Gigabyte Alchemy')
    expect(td?.actual).toBe('GIGABYTE ALCHEMY')

    const whitespace = diffManifests(
      manifest('ref', [el('Get  Started')]),
      manifest('draft', [el(' Get Started ')]),
    )
    expect(whitespace.matched).toBe(1)
    expect(whitespace.deltas).toEqual([])
  })

  // AC-528 — section scrim/anchor deltas align by ordinal index; a section
  // present on only one side is skipped rather than reported.
  it('test_UAT_AC528_section_overlay_and_anchor_by_index', () => {
    const expected = sectionManifest('ref', [
      { index: 0, overlay: { color: '#020617', opacity: 0.45 }, contentAnchorRatio: 0.82 },
    ])
    const actual = sectionManifest('draft', [{ index: 0, overlay: null, contentAnchorRatio: 0.5 }])
    const report = diffManifests(expected, actual)

    expect(hasDelta(report.deltas, '§0', 'overlay')).toBe(true)
    const ov = report.deltas.find((d) => d.property === 'overlay')
    expect(ov?.expected).toContain('#020617')
    expect(ov?.actual).toBe('none')

    expect(hasDelta(report.deltas, '§0', 'contentAnchor')).toBe(true)
    const anchor = report.deltas.find((d) => d.property === 'contentAnchor')
    expect(anchor?.expected).toContain('bottom')
    expect(anchor?.actual).toContain('center')

    // An extra section present on only one side has no counterpart → no delta.
    const refExtra = sectionManifest('ref', [
      { index: 0, overlay: null, contentAnchorRatio: null },
      { index: 1, overlay: { color: '#020617', opacity: 0.6 }, contentAnchorRatio: 0.9 },
    ])
    const draftOne = sectionManifest('draft', [{ index: 0, overlay: null, contentAnchorRatio: null }])
    expect(diffManifests(refExtra, draftOne).deltas).toEqual([])
  })

  // AC-529 — deltas are ranked so content/structural drift outranks measurement
  // drift: missing > text > color > lineHeightPx.
  it('test_UAT_AC529_deltas_ranked_most_severe_first', () => {
    const expected = manifest('ref', [
      el('Gamma', { lineHeightPx: 24 }), // measurement-tier delta (severity 30)
      el('Gone'), // missing (severity 100)
      el('Beta', { color: '#000000' }), // color (severity 90)
      el('Alpha'), // casing → text (severity 95)
    ])
    const actual = manifest('draft', [
      el('Gamma', { lineHeightPx: 60 }),
      el('Beta', { color: '#ffffff' }),
      el('ALPHA'),
    ])
    const report = diffManifests(expected, actual)
    expect(report.deltas.map((d) => d.property)).toEqual(['missing', 'text', 'color', 'lineHeightPx'])
  })

  // AC-530 — perceptual colour: ±1/channel rounding is suppressed; the flagship
  // near-neighbour gold flags; an unparseable colour is never a silent match.
  it('test_UAT_AC530_colour_compared_perceptually', () => {
    const rounding = diffManifests(
      manifest('ref', [el('C', { color: '#808080' })]),
      manifest('draft', [el('C', { color: '#818181' })]),
    )
    expect(hasDelta(rounding.deltas, 'C', 'color')).toBe(false)

    const nearNeighbour = diffManifests(
      manifest('ref', [el('C', { color: '#f5e6a3' })]),
      manifest('draft', [el('C', { color: '#fbba72' })]),
    )
    expect(hasDelta(nearNeighbour.deltas, 'C', 'color')).toBe(true)

    const unparseable = diffManifests(
      manifest('ref', [el('C', { color: '#123456' })]),
      manifest('draft', [el('C', { color: 'not-a-colour' })]),
    )
    expect(hasDelta(unparseable.deltas, 'C', 'color')).toBe(true)
  })

  // AC-531 — measurement jitter suppressed by default; --strict surfaces it; a
  // per-metric tolerance overrides one metric; a two-step weight still flags.
  it('test_UAT_AC531_jitter_tolerances_strict_and_per_metric', () => {
    const ref = manifest('ref', [
      el('J', {
        fontSizePx: 72,
        fontWeight: 400,
        lineHeightPx: 80,
        letterSpacingPx: 0,
        paddingLeftPx: 24,
        borderLeft: { widthPx: 4, color: '#34d399' },
      }),
    ])
    // Only sub-step measurement jitter (sizes ±1px, one weight step, etc.).
    const jitter = manifest('draft', [
      el('J', {
        fontSizePx: 72.6,
        fontWeight: 500,
        lineHeightPx: 81,
        letterSpacingPx: 0.4,
        paddingLeftPx: 24.5,
        borderLeft: { widthPx: 4.5, color: '#34d399' },
      }),
    ])
    expect(diffManifests(ref, jitter).deltas).toEqual([])
    // --strict zeroes the measurement tolerances → the jitter now surfaces.
    const strict = diffManifests(ref, jitter, { strict: true })
    expect(strict.deltas.length).toBeGreaterThan(0)
    expect(hasDelta(strict.deltas, 'J', 'fontSizePx')).toBe(true)

    // A per-metric flag widens exactly one metric.
    const twoDeltas = manifest('draft', [el('P', { letterSpacingPx: 2, fontSizePx: 22 })])
    const base = manifest('ref', [el('P', { letterSpacingPx: 0, fontSizePx: 18 })])
    const both = diffManifests(base, twoDeltas)
    expect(hasDelta(both.deltas, 'P', 'letterSpacingPx')).toBe(true)
    expect(hasDelta(both.deltas, 'P', 'fontSizePx')).toBe(true)
    const widened = diffManifests(base, twoDeltas, { letterSpacingTolerancePx: 5 })
    expect(hasDelta(widened.deltas, 'P', 'letterSpacingPx')).toBe(false)
    expect(hasDelta(widened.deltas, 'P', 'fontSizePx')).toBe(true)

    // A genuine two-step weight change (400↔600) still flags under defaults.
    const twoStep = diffManifests(
      manifest('ref', [el('W', { fontWeight: 400 })]),
      manifest('draft', [el('W', { fontWeight: 600 })]),
    )
    expect(hasDelta(twoStep.deltas, 'W', 'fontWeight')).toBe(true)
  })

  // AC-532 — a reference colour flagged inferred never produces a hard colour
  // delta; a confidently-resolved colour still does.
  it('test_UAT_AC532_inferred_reference_colour_never_hard_delta', () => {
    const inferred = diffManifests(
      manifest('ref', [el('F', { color: '#000000', colorInferred: true })]),
      manifest('draft', [el('F', { color: '#ff0000' })]),
    )
    expect(hasDelta(inferred.deltas, 'F', 'color')).toBe(false)

    const confident = diffManifests(
      manifest('ref', [el('G', { color: '#000000' })]),
      manifest('draft', [el('G', { color: '#ff0000' })]),
    )
    expect(hasDelta(confident.deltas, 'G', 'color')).toBe(true)
  })

  // AC-533 — offline `--actual` short-circuits the browser and needs no slug;
  // omitting both slug and `--actual` is a usage error.
  it('test_UAT_AC533_offline_actual_short_circuits_and_slug_required', async () => {
    const dir = freshDir()
    writeRefBundle(dir, [run_('Sub', { color: '#000000' })])
    const actualPath = writeActualManifest(dir, [el('Sub', { color: '#ffffff' })])

    // No slug, no browser driver injected: only the --actual short-circuit can
    // produce a report without launching Chromium.
    const offline = await runCli(['values-diff', '--ref', dir, '--actual', actualPath, '--json'])
    const parsed = JSON.parse(offline.stdout)
    expect(Array.isArray(parsed.deltas)).toBe(true)
    expect(hasDelta(parsed.deltas, 'Sub', 'color')).toBe(true)

    // Neither slug nor --actual → usage error (does not silently produce a report).
    await expect(run(['values-diff', '--ref', dir])).rejects.toThrow(/slug/i)
  })

  // AC-534 — repeated identical texts pair in document order (FIFO), so each
  // occurrence's delta is attributed to its own position.
  it('test_UAT_AC534_repeated_texts_pair_fifo', () => {
    const expected = manifest('ref', [
      el('Learn more', { color: '#111111' }),
      el('Learn more', { color: '#222222' }),
    ])
    const actual = manifest('draft', [
      el('Learn more', { color: '#111111' }), // matches first occurrence
      el('Learn more', { color: '#999999' }), // differs at the second occurrence
    ])
    const report = diffManifests(expected, actual)
    expect(report.matched).toBe(2)
    // Only the second occurrence disagrees, and its delta carries its own value.
    expect(report.deltas.length).toBe(1)
    expect(report.deltas[0].property).toBe('color')
    expect(report.deltas[0].expected).toBe('#222222')
    expect(report.deltas[0].actual).toBe('#999999')
  })

  // AC-535 — report is human text by default, JSON with --json, written to a
  // file with --out; exit status is non-zero iff deltas remain.
  it('test_UAT_AC535_output_forms_and_exit_status', async () => {
    const dir = freshDir()
    writeRefBundle(dir, [run_('Sub', { color: '#000000', fontSizePx: 24 })])
    const buggy = writeActualManifest(dir, [el('Sub', { color: '#ffffff', fontSizePx: 48 })], 'buggy.json')
    const faithful = writeActualManifest(dir, [el('Sub', { color: '#000000', fontSizePx: 24 })], 'faithful.json')

    // Default: human summary, one line per delta, most-severe first, non-zero exit.
    const human = await runCli(['values-diff', '--ref', dir, '--actual', buggy])
    expect(human.stdout).toMatch(/2 delta\(s\)/)
    expect(human.stdout).toContain('[color]')
    expect(human.stdout).toContain('[fontSizePx]')
    expect(human.stdout.indexOf('[color]')).toBeLessThan(human.stdout.indexOf('[fontSizePx]'))
    expect(human.exitCode).toBe(1)

    // --json: parseable full report.
    const json = await runCli(['values-diff', '--ref', dir, '--actual', buggy, '--json'])
    const parsed = JSON.parse(json.stdout)
    expect(parsed.deltas.length).toBe(2)
    expect(parsed.matched).toBe(1)
    expect(json.exitCode).toBe(1)

    // --out: writes the full report JSON to the file.
    const outFile = path.join(dir, 'report.json')
    await runCli(['values-diff', '--ref', dir, '--actual', buggy, '--out', outFile])
    const written = JSON.parse(readFileSync(outFile, 'utf8'))
    expect(Array.isArray(written.deltas)).toBe(true)
    expect(written.deltas.length).toBe(2)

    // Matching draft: zero exit and a "no value deltas" message.
    const clean = await runCli(['values-diff', '--ref', dir, '--actual', faithful])
    expect(clean.stdout).toMatch(/no value deltas/)
    expect(clean.exitCode).toBe(0)
  })
})
