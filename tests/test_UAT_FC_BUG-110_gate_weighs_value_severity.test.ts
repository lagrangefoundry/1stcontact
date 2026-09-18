import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import * as cli from '../tools/generate/src/cli/index'
import {
  cmdGate,
  formatGateReport,
  writeMultiState,
  writeRasterPng,
  VALUES_TIER_FLOOR,
  type Capture,
  type CaptureAsset,
  type ContentRun,
  type GateReport,
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
 * UATs for BUG-110 — `1c gate`'s verdict was decided by the perceptual floor and
 * the L1 gate alone, so a run carrying 13 HIGH-tier semantic deltas reported
 * `pass`.
 *
 * The defect, from the round it was filed by. Iteration 3 of
 * `repro-gigabytealchemy-ai` produced a reproduction with **no document outline
 * and no links at all** — eleven `a11yRole: heading → generic` deltas and two
 * `link → generic`, every one of them `kind: "semantics"`, `tier: "HIGH"`. Its
 * `gate.json` read `"pass": true`. Nothing was broken about the value gate: it
 * saw all thirteen and said so in `values-diff.json`. The ladder simply never
 * asked. `deltas` was COUNTED at the top of `reconcileGates` and then used only
 * to narrate the pass rung, and every rung below `pass` was unreachable once
 * `perceptualBreach` was false.
 *
 * Semantics is the axis that proves why a pixel-only floor cannot be the whole
 * gate: a heading reproduced as a styled `<div>` paints the same glyphs at the
 * same size in the same place, so the perceptual eye is *structurally* incapable
 * of seeing it, and the one gate that can see it could not reach the verdict.
 *
 * The fix is a floor for the value gate, held and echoed exactly as the
 * perceptual one is: `floor.valuesTier` is the worst {@link SeverityTier} a
 * passing run may carry, defaulting to MEDIUM — so tone and treatment drift
 * still passes (the gate must not become a second `1c values-diff`, which
 * already exits non-zero on ANY delta) and HIGH or CRITICAL fails the run.
 *
 * Every UAT here drives the real `1c gate` — `cmdGate`, and `cli.run(['gate',…])`
 * for exit status — through the offline seams `--actual-image` / `--actual-manifest`
 * already expose. No headless browser, and nothing we own is mocked.
 */

const LADDER = [320, 375, 768, 1024, 1280, 1440]
/** `--size desktop`'s width, and therefore the ladder rung the `--size` probes read. */
const DESKTOP_WIDTH = 1280

const tmpDirs: string[] = []
function freshDir(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), `bug110-${prefix}-`))
  tmpDirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

// ── fixture builders ─────────────────────────────────────────────────────────

/** One reference text run. */
function run(text: string, role: ContentRun['role'] = 'heading'): ContentRun {
  return { role, text, color: '#111827', fontFamily: 'Inter', fontSizePx: 40, fontWeight: 600 }
}

/**
 * The reproduction's copy of a reference run, with `overrides` drifting whichever
 * axes the probe is about. Everything else agrees, so the delta set is exactly
 * what the probe asked for and the tier under test is the worst one present.
 */
function reproOf(source: ContentRun, overrides: Partial<ValueElement> = {}): ValueElement {
  return {
    text: source.text,
    role: source.role,
    color: source.color,
    fontFamily: source.fontFamily,
    fontSizePx: source.fontSizePx,
    fontWeight: source.fontWeight,
    ...overrides,
  }
}

function captureSection(index: number, content: ContentRun): Section {
  return {
    box: { x: 0, y: index * 400, width: 1280, height: 400 },
    screenshot: { x: 0, y: index * 400, width: 1280, height: 400 },
    background: { kind: 'color', color: '#ffffff' },
    layout: {
      textOverImage: false,
      contentAlign: 'left',
      arrangement: 'stack',
      columns: 1,
      contentMaxWidthPx: null,
      contentAnchorRatio: null,
    },
    content: [content],
    items: [],
    fields: [],
  }
}

/**
 * One ladder band, sized to the rung it is captured at — the shape BUG-100's and
 * BUG-106's fixtures use, for the reason they give: a band pinned to one width
 * overflows the narrow rungs and the off-sample probe reads it as a structural
 * failure, which would decide the verdict before the value floor is ever
 * consulted.
 */
function bandValues(index: number, width: number): SectionValues {
  return { index, overlay: null, contentAnchorRatio: null, box: { x: 0, y: index * 400, width, height: 400 } }
}

/** The ladder element for a run, carrying the semantic identity the capture read. */
function ladderElement(source: ContentRun, index: number, width: number): ValueElement {
  const el = reproOf(source, { box: { x: 20, y: index * 400 + 100, width: width - 40, height: 48 } })
  // BUG-107 — what the browser says the thing IS. Only the ladder projection
  // records it: a single-width `capture.json` content run has no `a11yRole`
  // field at all, which is why the `--size` probes below are the ones that can
  // reproduce this ticket's own semantic deltas.
  el.a11yRole = source.role === 'link' ? 'link' : 'heading'
  if (source.role !== 'link') el.headingLevel = 2
  return el
}

interface BundleSpec {
  /** One reference band per entry, each carrying that run. */
  runs: ContentRun[]
  /** Mirrored image assets the capture kept bytes for (an orphan → a coverage finding). */
  assets?: CaptureAsset[]
}

/** A capture bundle the 3-probe gate passes cleanly, with a ladder and both shots. */
async function writeBundle(spec: BundleSpec): Promise<string> {
  const dir = freshDir('bundle')
  mkdirSync(path.join(dir, 'assets'), { recursive: true })
  const capture: Capture = {
    url: 'http://fixture.test/',
    host: 'fixture.test',
    path: '/',
    capturedAt: '2026-09-17T00:00:00.000Z',
    // REQ-270 — the stamp a bundle from the CURRENT extractor carries; without it
    // coverage correctly reports `stale-capture` and every probe here would be
    // asserting against a bundle no live capture produces.
    captureSchema: CAPTURE_SCHEMA,
    viewport: { width: 1280, height: 800 },
    theme: { colors: [], fonts: [], typeScale: [], spacingScalePx: [], containerMaxWidthPx: null },
    sections: spec.runs.map((r, i) => captureSection(i, r)),
    assets: spec.assets ?? [],
  }
  writeFileSync(path.join(dir, 'capture.json'), JSON.stringify(capture, null, 2))

  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `ref@chromium:${width}:rest`,
      viewport: { width, height: 900 },
      sections: spec.runs.map((_, i) => bandValues(i, width)),
      elements: spec.runs.map((r, i) => ladderElement(r, i, width)),
    } satisfies ValueManifest,
  }))
  const oracle: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }
  await writeMultiState(fsReferenceBundle(dir), oracle)
  await writeRasterPng(flat(64, 64, 0), path.join(dir, 'screenshot.full.png'))
  // REQ-61 — `--size desktop` compares same-width shots, so the bundle carries the
  // rung's own screenshot rather than being graded against the desktop full shot.
  await writeRasterPng(flat(64, 64, 0), path.join(dir, `screenshot-${DESKTOP_WIDTH}.png`))
  return dir
}

/** A uniform raster — the perceptual eye's pixel input. */
function flat(w: number, h: number, value: number): Raster {
  const data = new Uint8Array(w * h * 3).fill(value)
  return { data, width: w, height: h, channels: 3 }
}

/**
 * Our reproduction's screenshot. `0` is IDENTICAL to the reference's, which is
 * the whole point of this suite: every probe below that fails a run fails it with
 * the perceptual eye reading a mean difference of zero.
 */
async function actualShot(value: number): Promise<string> {
  const file = path.join(freshDir('shot'), 'actual.png')
  await writeRasterPng(flat(64, 64, value), file)
  return file
}

/**
 * The HIGH-tier semantic deltas the run's own `values-diff.json` recorded — read
 * back off disk exactly as the ticket's own reproduction instructions read them
 * (`jq '[.deltas[]|select(.tier=="HIGH")]|length'`), so the count the gate was
 * weighing is the count the artifact carries.
 */
function highSemanticDeltas(out: string): Array<{ property: string; expected: string; actual: string }> {
  const report = JSON.parse(readFileSync(path.join(out, 'values-diff.json'), 'utf8')) as {
    deltas: Array<{ property: string; kind: string; tier: string; expected: string; actual: string }>
  }
  return report.deltas.filter((d) => d.tier === 'HIGH' && d.kind === 'semantics')
}

/** Our reproduction's value manifest. */
function actualManifest(elements: ValueElement[], sections: SectionValues[] = []): string {
  const file = path.join(freshDir('manifest'), 'actual.json')
  const manifest: ValueManifest = { source: 'draft:fixture', elements, sections }
  writeFileSync(file, JSON.stringify(manifest))
  return file
}

/** The reproduction the ladder rung expects, with `overrides` applied to every run. */
function ladderRepro(runs: ContentRun[], overrides: Partial<ValueElement>): string {
  return actualManifest(
    runs.map((r, i) => ({ ...ladderElement(r, i, DESKTOP_WIDTH), ...overrides })),
    runs.map((_, i) => bandValues(i, DESKTOP_WIDTH)),
  )
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('BUG-110 — a lost document outline is not a pass', () => {
  it('test_UAT_FC_BUG-110_high_semantic_deltas_fail_a_pixel_identical_run', async () => {
    // The ticket's own run, reproduced: eleven headings and two links, every one
    // of them rendered by our side as a `generic` box. The screenshots are
    // BYTE-IDENTICAL, so the perceptual eye reads mean 0 and cannot be what
    // decides this. Before BUG-110 that combination was `verdict: "pass"`.
    const runs = [
      ...Array.from({ length: 11 }, (_, i) => run(`Heading ${i + 1}`)),
      run('LinkedIn', 'link'),
      run('GitHub', 'link'),
    ]
    const ref = await writeBundle({ runs })
    const out = freshDir('out')
    const report = await cmdGate({
      ref,
      size: 'desktop',
      actualImagePath: await actualShot(0),
      actualManifestPath: ladderRepro(runs, { a11yRole: 'generic', headingLevel: undefined }),
      out,
    })

    expect(report.perceptual.meanDiff).toBe(0)
    expect(report.perceptualBreach).toBe(false)
    expect(report.l1Pass).toBe(true)
    // The value gate saw all thirteen, as it always did…
    const semantic = highSemanticDeltas(out)
    expect(semantic).toHaveLength(13)
    expect(semantic.filter((d) => d.expected === 'heading')).toHaveLength(11)
    expect(semantic.filter((d) => d.expected === 'link')).toHaveLength(2)
    expect(new Set(semantic.map((d) => d.actual))).toEqual(new Set(['generic']))
    // …and now the verdict is decided by them.
    expect(report.values.worstTier).toBe('HIGH')
    expect(report.valuesBreach).toBe(true)
    expect(report.verdict).toBe('reproduction-wrong')
    expect(report.pass).toBe(false)
  })

  it('test_UAT_FC_BUG-110_the_diagnosis_names_the_gate_that_failed_it', async () => {
    // A run that fails on the value gate ALONE is not the both-eyes-agree case,
    // and must not be described as one — the operator is being sent to a defect
    // the eye reports as clean, so the report has to say which gate saw it and
    // which bound it broke.
    const runs = [run('Our Mission'), run('A Different Approach')]
    const ref = await writeBundle({ runs })
    const report = await cmdGate({
      ref,
      size: 'desktop',
      actualImagePath: await actualShot(0),
      actualManifestPath: ladderRepro(runs, { a11yRole: 'generic', headingLevel: undefined }),
      out: freshDir('out'),
    })

    expect(report.diagnosis).toMatch(/WITHIN its floor/)
    expect(report.diagnosis).toMatch(/HIGH-tier delta/)
    expect(report.diagnosis).not.toMatch(/eye and the value gates agree/)
    expect(report.nextStep).toMatch(/values-diff/)
    expect(report.nextStep).toMatch(/worst-first/)
  })

  it('test_UAT_FC_BUG-110_a_critical_delta_fails_it_too', async () => {
    // The bound is a CEILING, not an equality test for one tier: CRITICAL ranks
    // above HIGH, so content that is simply ABSENT — the loudest thing the value
    // gate can report — must fail for the same reason a lost heading does.
    const ref = await writeBundle({ runs: [run('Front door heading')] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      // Nothing at all on our side: a CRITICAL `presence` delta.
      actualManifestPath: actualManifest([]),
      out: freshDir('out'),
    })

    expect(report.perceptualBreach).toBe(false)
    expect(report.values.worstTier).toBe('CRITICAL')
    expect(report.verdict).toBe('reproduction-wrong')
    expect(report.pass).toBe(false)
  })
})

describe('BUG-110 — the gate is still not a second `1c values-diff`', () => {
  it('test_UAT_FC_BUG-110_sub_floor_deltas_still_pass_and_are_still_reported', async () => {
    // REQ-94's claim, kept: a reproduction an operator accepts still passes while
    // the sharp instrument has deltas to work. The bound is set where the tier
    // table already draws the line — LOW is tone and MEDIUM is treatment, so a
    // drifted colour AND a drifted weight are both under it. The deltas are not
    // hidden: the pass rung still enumerates them and still names `values-diff`
    // as their home, which is what BUG-106 installed.
    const source = run('Front door heading')
    const ref = await writeBundle({ runs: [source] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest([reproOf(source, { color: '#1f2937', fontWeight: 500 })]),
      out: freshDir('out'),
    })

    expect(report.values.deltas).toBeGreaterThan(0)
    expect(report.values.worstTier).toBe('MEDIUM')
    expect(report.valuesBreach).toBe(false)
    expect(report.verdict).toBe('pass')
    expect(report.pass).toBe(true)
    expect(report.nextStep).toMatch(/values-diff/)
  })

  it('test_UAT_FC_BUG-110_a_clean_run_reports_no_worst_tier_at_all', async () => {
    // `worstTier` is the worst tier among the deltas, so a run with none has
    // none — `null`, not a floor value standing in for "nothing was ranked".
    const source = run('Front door heading')
    const ref = await writeBundle({ runs: [source] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest([reproOf(source)]),
      out: freshDir('out'),
    })

    expect(report.values.deltas).toBe(0)
    expect(report.values.worstTier).toBeNull()
    expect(report.valuesBreach).toBe(false)
    expect(report.verdict).toBe('pass')
  })
})

describe('BUG-110 — the bound is echoed and is a per-run dial', () => {
  it('test_UAT_FC_BUG-110_the_value_floor_is_in_the_report_and_in_the_operator_read', async () => {
    // The floor contract REQ-94 installed, extended rather than duplicated: every
    // bound the verdict was decided against is IN the report, so no reader has to
    // already know it. `gate.json` on disk is the artifact the reproduction
    // console and every downstream consumer actually read.
    const runs = [run('Our Mission')]
    const ref = await writeBundle({ runs })
    const out = freshDir('out')
    const report = await cmdGate({
      ref,
      size: 'desktop',
      actualImagePath: await actualShot(0),
      actualManifestPath: ladderRepro(runs, { a11yRole: 'generic', headingLevel: undefined }),
      out,
    })

    expect(report.floor).toMatchObject({ valuesTier: VALUES_TIER_FLOOR })
    const onDisk = JSON.parse(readFileSync(path.join(out, 'gate.json'), 'utf8')) as GateReport
    expect(onDisk.floor.valuesTier).toBe(VALUES_TIER_FLOOR)
    expect(onDisk.valuesBreach).toBe(true)
    expect(onDisk.values.worstTier).toBe('HIGH')

    // …and the operator reading the terminal sees the same bound beside the
    // counts it is read against, printed the way the perceptual floor is.
    const text = formatGateReport(report, ref)
    expect(text).toMatch(/✗ over value floor \(worst HIGH; no delta above MEDIUM\)/)
    // The perceptual mark is untouched: two bounds, two lines, neither implicit.
    expect(text).toContain('✓ within floor (mean ≤ 8, pct ≤ 25%)')
  })

  it('test_UAT_FC_BUG-110_a_passing_run_prints_the_bound_it_stayed_within', async () => {
    const source = run('Front door heading')
    const ref = await writeBundle({ runs: [source] })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(0),
      actualManifestPath: actualManifest([reproOf(source, { color: '#1f2937' })]),
      out: freshDir('out'),
    })

    expect(formatGateReport(report, ref)).toMatch(/✓ within value floor \(worst LOW; no delta above MEDIUM\)/)
  })

  it('test_UAT_FC_BUG-110_the_bound_can_be_loosened_and_switched_off', async () => {
    // The perceptual floor is a per-run dial because it is provisional (DOC-21
    // §4); the value floor is one for the same reason, and because a caller that
    // wants the pre-BUG-110 behaviour — pixels decide alone — must be able to say
    // so explicitly rather than by being an older build.
    const runs = [run('Our Mission'), run('LinkedIn', 'link')]
    const ref = await writeBundle({ runs })
    const shot = await actualShot(0)
    const manifest = ladderRepro(runs, { a11yRole: 'generic', headingLevel: undefined })
    const at = async (valuesTier: 'CRITICAL' | null | undefined): Promise<GateReport> =>
      cmdGate({
        ref,
        size: 'desktop',
        actualImagePath: shot,
        actualManifestPath: manifest,
        out: freshDir('out'),
        ...(valuesTier === undefined ? {} : { floor: { valuesTier } }),
      })

    // Loosened to CRITICAL: HIGH is now within the bound, so the same run passes.
    const loose = await at('CRITICAL')
    expect(loose.floor.valuesTier).toBe('CRITICAL')
    expect(loose.values.worstTier).toBe('HIGH')
    expect(loose.valuesBreach).toBe(false)
    expect(loose.verdict).toBe('pass')

    // Switched off entirely: the value gate is held to nothing, which is exactly
    // the verdict this run used to get.
    const off = await at(null)
    expect(off.floor.valuesTier).toBeNull()
    expect(off.valuesBreach).toBe(false)
    expect(off.verdict).toBe('pass')
    expect(formatGateReport(off, ref)).toMatch(/value floor: none/)

    // …and the default is neither: the run fails.
    expect((await at(undefined)).verdict).toBe('reproduction-wrong')
  })
})

describe('BUG-110 — through the CLI, and without disturbing the rest of the ladder', () => {
  it('test_UAT_FC_BUG-110_the_cli_exit_status_follows_the_value_breach', async () => {
    // The consumer this ticket is about does not read prose. The reproduction
    // console, a rail baseline and a promotion check all branch on the verb's
    // exit status or on `pass` in the JSON, and both must say the same thing the
    // verdict does.
    const runs = [run('Our Mission'), run('GitHub', 'link')]
    const ref = await writeBundle({ runs })
    const shot = await actualShot(0)
    const manifest = ladderRepro(runs, { a11yRole: 'generic', headingLevel: undefined })
    const stdout = vi.spyOn(console, 'log').mockImplementation(() => {})

    process.exitCode = 0
    await cli.run(['gate', '--ref', ref, '--size', 'desktop', '--actual-image', shot, '--actual-manifest', manifest, '--json'])
    expect(process.exitCode).toBe(1)
    const printed = JSON.parse(stdout.mock.calls.at(-1)![0] as string) as GateReport
    expect(printed.pass).toBe(false)
    expect(printed.verdict).toBe('reproduction-wrong')
    expect(printed.values.worstTier).toBe('HIGH')

    // …and `--values-tier none` on the same run restores the old exit status, so
    // the flag is a real dial rather than a reported-but-ignored preference.
    process.exitCode = 0
    await cli.run([
      'gate',
      '--ref',
      ref,
      '--size',
      'desktop',
      '--actual-image',
      shot,
      '--actual-manifest',
      manifest,
      '--values-tier',
      'none',
      '--json',
    ])
    expect(process.exitCode).toBe(0)
    expect((JSON.parse(stdout.mock.calls.at(-1)![0] as string) as GateReport).pass).toBe(true)
    stdout.mockRestore()

    // An unusable tier is refused by name rather than silently ignored — a
    // typo'd bound that reads as "no bound" is the defect this ticket is about.
    await expect(
      cli.run(['gate', '--ref', ref, '--actual-image', shot, '--actual-manifest', manifest, '--values-tier', 'SEVERE']),
    ).rejects.toThrow(/--values-tier/)
  })

  it('test_UAT_FC_BUG-110_a_breached_eye_with_suspect_coverage_is_still_capture_incomplete', async () => {
    // The rung order BUG-100's suite pins is untouched. Under a BREACHING
    // perceptual eye, a coverage finding still outranks the value gate — the
    // value deltas there are measured against an impoverished reference and are
    // not yet evidence, whatever tier they carry.
    const ref = await writeBundle({
      runs: [run('Front door heading')],
      assets: [{ id: 'img-orphan', kind: 'image', src: 'https://fixture.test/media/orphan.jpg', localPath: 'assets/orphan.jpg' }],
    })
    const report = await cmdGate({
      ref,
      actualImagePath: await actualShot(200),
      actualManifestPath: actualManifest([]),
      out: freshDir('out'),
    })

    expect(report.perceptualBreach).toBe(true)
    expect(report.valuesBreach).toBe(true)
    expect(report.coverage.findings.map((f) => f.kind)).toEqual(['unreferenced-image'])
    expect(report.verdict).toBe('capture-incomplete')
    expect(report.diagnosis).toMatch(/BLIND/)
  })

  it('test_UAT_FC_BUG-110_a_value_only_breach_still_names_a_coverage_finding_it_is_carrying', async () => {
    // …and the converse. With the eye WITHIN its floor, `capture-incomplete` is
    // the wrong answer — its whole diagnosis is that the value gates could not
    // see what the eye did, and here they are the only gate that saw anything.
    // The finding is not dropped on the floor, though: it is named in the next
    // step, which is what BUG-106 established for facts a verdict does not turn on.
    const runs = [run('Our Mission')]
    const ref = await writeBundle({
      runs,
      assets: [{ id: 'img-orphan', kind: 'image', src: 'https://fixture.test/media/orphan.jpg', localPath: 'assets/orphan.jpg' }],
    })
    const report = await cmdGate({
      ref,
      size: 'desktop',
      actualImagePath: await actualShot(0),
      actualManifestPath: ladderRepro(runs, { a11yRole: 'generic', headingLevel: undefined }),
      out: freshDir('out'),
    })

    expect(report.perceptualBreach).toBe(false)
    expect(report.coverage.findings.map((f) => f.kind)).toEqual(['unreferenced-image'])
    expect(report.verdict).toBe('reproduction-wrong')
    expect(report.nextStep).toMatch(/reference coverage also reports `unreferenced-image`/)
  })
})

