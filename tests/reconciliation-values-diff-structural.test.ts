import { afterAll, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  calibrateDiscriminator,
  diffManifests,
  diffMultiState,
  discriminatorIsCalibrated,
  run,
  type Capture,
  type ContentRun,
  type DeltaKind,
  type MultiStateCapture,
  type Section,
  type StateProjection,
  type ValueDelta,
  type ValueElement,
  type ValueManifest,
} from '../tools/generate/src/cli'

/**
 * Reconciliation UATs for story-f826e5ca — the REQ-47/REQ-48 *enriched* half of
 * the `1c values-diff` fidelity gate (ACs AC-571 … AC-574). The value-level ACs
 * (AC-525 … AC-535) are covered by reconciliation-values-diff.test.ts; this file
 * covers the four ACs added by BUNDLE-4:
 *
 *   AC-571 — new-axis structural deltas (z-order, treatment, media, transform,
 *            motion), own-render preconditions (viewport, overflow, font-load),
 *            and multi-state cell pairing.
 *   AC-572 — systemic sub-threshold aggregation → one capped-at-HIGH headline row.
 *   AC-573 — ignore-masks: default-on calendar-year fold (--compare-years opts
 *            out) and --ignore regex masks with an honest suppressed count.
 *   AC-574 — anti-self-grading calibration oracle names any blind axis.
 *
 * The enriched-projection / calibration / multi-state ACs drive the library
 * entry points the fidelity harness composes (`diffManifests`, `diffMultiState`,
 * `discriminatorIsCalibrated`) — per the story's technical notes these are
 * library-level, not new subcommands. AC-573 drives the two *new CLI flags*
 * (`--ignore`, `--compare-years`) through the real `run(argv)` dispatcher.
 */

const tmpDirs: string[] = []
function freshDir(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'recon-vdiff-struct-'))
  tmpDirs.push(d)
  return d
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders ─────────────────────────────────────────────────────────

/** A ContentRun (capture/reference side) with sensible defaults. */
function run_(text: string, over: Partial<ContentRun> = {}): ContentRun {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

/** A ValueElement (either side of the diff) with the same defaults. */
function el(text: string, over: Partial<ValueElement> = {}): ValueElement {
  return { role: 'body', text, color: '#000000', fontFamily: 'sans', fontSizePx: 18, fontWeight: 400, ...over }
}

function manifest(source: string, elements: ValueElement[], over: Partial<ValueManifest> = {}): ValueManifest {
  return { source, elements, sections: [], ...over }
}

/** Wrap content runs in a single-section Capture and write its bundle to disk. */
function writeRefBundle(dir: string, content: ContentRun[]): string {
  const section: Section = {
    box: { x: 0, y: 0, width: 1280, height: 800 },
    screenshot: { x: 0, y: 0, width: 1280, height: 800 },
    background: { kind: 'color', color: '#ffffff' },
    layout: { textOverImage: false, contentAlign: 'left', arrangement: 'stack', columns: 1, contentMaxWidthPx: null },
    content,
    items: [],
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

/** Does the report carry a delta of this kind? */
function hasKind(deltas: ValueDelta[], kind: DeltaKind): boolean {
  return deltas.some((d) => d.kind === kind)
}
function ofKind(deltas: ValueDelta[], kind: DeltaKind): ValueDelta | undefined {
  return deltas.find((d) => d.kind === kind)
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

describe('story-f826e5ca — 1c values-diff enriched projection (reconciliation UATs)', () => {
  // AC-571 — the enriched projection emits a new delta kind per structural axis at
  // its fixed tier; three own-render preconditions (viewport CRITICAL, overflow
  // HIGH, font-load HIGH) fire on our own render; and a multi-state diff pairs
  // reference↔repro cell-for-cell, surfacing a cell the repro never projected.
  it('test_UAT_AC571_new_axis_preconditions_and_multistate', () => {
    // A paired text run differing in exactly one enriched axis → matching kind/tier.
    const textAxis = (over: Partial<ValueElement>): ValueManifest =>
      manifest('m', [el('X', { zIndex: 0, transformRotateDeg: 0, transformScale: 1, motion: null, textShadow: null, ...over })])

    // z-order (HIGH)
    let d = diffManifests(textAxis({}), textAxis({ zIndex: 5 })).deltas
    expect(ofKind(d, 'zOrder')?.tier).toBe('HIGH')

    // treatment (MEDIUM, presence-based): a text glow present on one side only.
    d = diffManifests(textAxis({ textShadow: '0 0 8px #0ff' }), textAxis({ textShadow: null })).deltas
    expect(ofKind(d, 'treatment')?.tier).toBe('MEDIUM')

    // transform: rotation past ±2° (HIGH).
    d = diffManifests(textAxis({}), textAxis({ transformRotateDeg: 20 })).deltas
    expect(ofKind(d, 'transform')?.tier).toBe('HIGH')
    // transform: uniform scale past ±0.05 (HIGH).
    d = diffManifests(textAxis({}), textAxis({ transformScale: 1.25 })).deltas
    expect(ofKind(d, 'transform')?.tier).toBe('HIGH')

    // motion (MEDIUM, presence): a declared entrance animation on one side only.
    d = diffManifests(textAxis({}), textAxis({ motion: 'animation' })).deltas
    expect(ofKind(d, 'motion')?.tier).toBe('MEDIUM')

    // media (HIGH): a photo child whose object-fit differs (cover → fill).
    const imgAxis = (over: Partial<ValueElement>): ValueManifest =>
      manifest('m', [
        el('portrait', {
          textless: true,
          a11yRole: 'img',
          objectFit: 'cover',
          box: { x: 0, y: 0, width: 200, height: 200 },
          ...over,
        }),
      ])
    d = diffManifests(imgAxis({}), imgAxis({ objectFit: 'fill' })).deltas
    expect(ofKind(d, 'media')?.tier).toBe('HIGH')
    // media (HIGH): rendered aspect drift > ~10% (circle 1:1 → ellipse 2:1).
    d = diffManifests(imgAxis({}), imgAxis({ box: { x: 0, y: 0, width: 200, height: 100 } })).deltas
    expect(ofKind(d, 'media')?.tier).toBe('HIGH')

    // Precondition: viewport-width mismatch is CRITICAL and *leads* the report,
    // even alongside a (LOW-tier) colour drift — the diff below can't be trusted.
    const vpMismatch = diffManifests(
      manifest('ref', [el('X', { color: '#111111' })], { viewport: { width: 1280, height: 800 } }),
      manifest('act', [el('X', { color: '#334155' })], { viewport: { width: 375, height: 800 } }),
    ).deltas
    expect(vpMismatch[0].kind).toBe('viewport')
    expect(vpMismatch[0].tier).toBe('CRITICAL')

    // Precondition: an element whose right edge exceeds the viewport (HIGH).
    const overflow = diffManifests(
      manifest('ref', [el('WIDE', { box: { x: 0, y: 0, width: 200, height: 40 } })], { viewport: { width: 375, height: 800 } }),
      manifest('act', [el('WIDE', { box: { x: 0, y: 0, width: 3000, height: 40 } })], { viewport: { width: 375, height: 800 } }),
    ).deltas
    expect(ofKind(overflow, 'overflow')?.tier).toBe('HIGH')

    // Precondition: an element that fell back from its intended face (HIGH).
    const fontLoad = diffManifests(
      manifest('ref', [el('X')]),
      manifest('act', [el('X', { fontLoaded: false })]),
    ).deltas
    expect(ofKind(fontLoad, 'fontLoad')?.tier).toBe('HIGH')

    // Multi-state: a reference cell (webkit) the repro never projected is reported
    // as a coverage gap (missing), not silently counted clean.
    const cell = (engine: 'chromium' | 'webkit'): StateProjection => ({
      engine,
      viewport: { width: 375, height: 800 },
      state: 'rest',
      manifest: manifest('m', [el('X')], { engine, viewport: { width: 375, height: 800 }, state: 'rest' }),
    })
    const reference: MultiStateCapture = { url: 'u', notes: [], projections: [cell('chromium'), cell('webkit')] }
    const repro: MultiStateCapture = { url: 'u', notes: [], projections: [cell('chromium')] }
    const cells = diffMultiState(reference, repro)
    const missing = cells.find((c) => c.missing)
    expect(missing).toBeDefined()
    expect(missing!.engine).toBe('webkit')
    expect(missing!.report).toBeNull()
    // The projected cell is diffed, not reported missing.
    expect(cells.find((c) => c.engine === 'chromium')!.missing).toBe(false)
  })

  // AC-572 — a LOW/MEDIUM kind recurring across ≥N elements produces one synthetic
  // "systemic" headline row (escalated above its per-element tier but capped at
  // HIGH), *alongside* the per-element rows; below threshold none; threshold 0 off.
  it('test_UAT_AC572_systemic_aggregation_escalates_capped_at_high', () => {
    const buildDrift = (n: number) => {
      const refs: ValueElement[] = []
      const acts: ValueElement[] = []
      for (let i = 0; i < n; i++) {
        refs.push(el(`row ${i}`, { color: '#111111' })) // near-black
        acts.push(el(`row ${i}`, { color: '#334155' })) // slate — a LOW colour drift
      }
      return { ref: manifest('ref', refs), act: manifest('act', acts) }
    }

    // 8 colour drifts (> default threshold 5): one systemic row, escalated above
    // the per-element LOW tier, while all 8 per-element rows remain.
    const eight = buildDrift(8)
    const report = diffManifests(eight.ref, eight.act)
    const systemic = report.deltas.filter((d) => d.systemic)
    expect(systemic.length).toBe(1)
    expect(systemic[0].kind).toBe('color')
    expect(systemic[0].count).toBe(8)
    // Escalated above LOW but never above HIGH.
    expect(['MEDIUM', 'HIGH']).toContain(systemic[0].tier)
    expect(systemic[0].tier).not.toBe('CRITICAL')
    // The per-element rows are additive, not replaced.
    expect(report.deltas.filter((d) => !d.systemic && d.kind === 'color').length).toBe(8)

    // Pervasive drift is *capped at HIGH*: 40 elements would escalate LOW past
    // CRITICAL, but the cap holds it at HIGH so a tonal drift never masquerades
    // as a structural break.
    const many = buildDrift(40)
    const capped = diffManifests(many.ref, many.act).deltas.filter((d) => d.systemic)
    expect(capped.length).toBe(1)
    expect(capped[0].tier).toBe('HIGH')
    expect(capped[0].tier).not.toBe('CRITICAL')

    // Below the threshold (3 < 5): no systemic row.
    const three = buildDrift(3)
    expect(diffManifests(three.ref, three.act).deltas.some((d) => d.systemic)).toBe(false)

    // Threshold 0 disables aggregation entirely, even well over the default.
    expect(diffManifests(eight.ref, eight.act, { systemicThreshold: 0 }).deltas.some((d) => d.systemic)).toBe(false)
  })

  // AC-573 — the two new CLI flags: the built-in calendar-year fold is on by
  // default (`© 2025` vs `© 2026` inert) and `--compare-years` opts out; `--ignore
  // <regex>` suppresses a matching delta with an honest suppressed count; a
  // malformed regex is skipped, not fatal.
  it('test_UAT_AC573_ignore_masks_year_fold_and_suppressed_count', async () => {
    const dir = freshDir()
    // A footer whose © line differs only by year, plus a casing-only tagline.
    writeRefBundle(dir, [run_('© 2025'), run_('Tagline', { role: 'heading' })])
    const yearActual = writeActualManifest(dir, [el('© 2026'), el('TAGLINE', { role: 'heading' })], 'year.json')

    // Default: the year difference is folded away (no delta mentions the year),
    // while the *other* change on the run (the casing tagline) still fires.
    const def = await runCli(['values-diff', '--ref', dir, '--actual', yearActual, '--json'])
    const defReport = JSON.parse(def.stdout)
    const mentionsYear = (ds: { text: string; expected: string; actual: string }[]): boolean =>
      ds.some((d) => /20(25|26)/.test(`${d.text} ${d.expected} ${d.actual}`))
    expect(mentionsYear(defReport.deltas)).toBe(false)
    expect(defReport.deltas.some((d: { property: string }) => d.property === 'text')).toBe(true)

    // --compare-years opts out: the year is now compared verbatim, so the year
    // difference surfaces (as its own delta) — no longer masked.
    const cmp = await runCli(['values-diff', '--ref', dir, '--actual', yearActual, '--compare-years', '--json'])
    const cmpReport = JSON.parse(cmp.stdout)
    expect(mentionsYear(cmpReport.deltas)).toBe(true)

    // --ignore <regex>: a matching delta is suppressed *before ranking* and the
    // report exposes an honest suppressed count.
    writeRefBundle(dir, [run_('Sale price', { color: '#111111' })])
    const priceActual = writeActualManifest(dir, [el('Sale price', { color: '#ff0000' })], 'price.json')

    // Control: without the mask the colour drift is a real delta (non-zero exit).
    const control = await runCli(['values-diff', '--ref', dir, '--actual', priceActual, '--json'])
    const controlReport = JSON.parse(control.stdout)
    expect(controlReport.deltas.some((d: { property: string }) => d.property === 'color')).toBe(true)
    expect(control.exitCode).toBe(1)

    // Masked: the delta is suppressed, counted honestly, and the run passes.
    const masked = await runCli(['values-diff', '--ref', dir, '--actual', priceActual, '--ignore', 'Sale price', '--json'])
    const maskedReport = JSON.parse(masked.stdout)
    expect(maskedReport.deltas.length).toBe(0)
    expect(maskedReport.suppressed).toBe(1)
    expect(masked.exitCode).toBe(0)

    // Malformed regex: skipped rather than fatal (over-reporting is the safe
    // direction) — the run completes and the un-suppressed delta still fires.
    const malformed = await runCli(['values-diff', '--ref', dir, '--actual', priceActual, '--ignore', '[', '--json'])
    const malformedReport = JSON.parse(malformed.stdout)
    expect(malformedReport.deltas.some((d: { property: string }) => d.property === 'color')).toBe(true)
    expect(malformedReport.suppressed).toBe(0)
    expect(malformed.exitCode).toBe(1)
  })

  // AC-574 — the anti-self-grading calibration oracle: against a faithful baseline
  // every seeded defect (one per fidelity axis) fires and the discriminator reports
  // calibrated; disabling one axis' comparison reports that defect as not-fired and
  // the discriminator as not-calibrated, naming the blind axis.
  it('test_UAT_AC574_calibration_oracle_names_blind_axis', () => {
    // Faithful baseline: every seeded defect fires; each result carries its axis.
    const perDefect = calibrateDiscriminator()
    expect(perDefect.length).toBeGreaterThanOrEqual(13)
    for (const r of perDefect) {
      expect(typeof r.name).toBe('string')
      expect(typeof r.expects).toBe('string')
      expect(r.fired).toBe(true)
    }
    const ok = discriminatorIsCalibrated()
    expect(ok.calibrated).toBe(true)
    expect(ok.results.every((r) => r.fired)).toBe(true)

    // Disable the colour comparison (an infinite colour tolerance blinds that
    // axis): the discriminator must report not-calibrated and name that axis as
    // the one whose seeded defect did not fire.
    const blind = discriminatorIsCalibrated(undefined, { colorTolerance: Infinity })
    expect(blind.calibrated).toBe(false)
    const notFired = blind.results.filter((r) => !r.fired)
    expect(notFired.length).toBe(1)
    expect(notFired[0].expects).toBe('color')
    expect(notFired[0].name.toLowerCase()).toContain('colour')
  })
})
