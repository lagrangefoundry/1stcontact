/**
 * `1c values-diff` — the fidelity verification loop (REQ-31, [[DOC-13]] §6).
 *
 * Given a captured reference bundle (expected values) and our own reproduction
 * (actual values), it diffs field-by-field and emits a severity-ranked delta
 * report *before* human review — so near-neighbour colours, off-by-one type
 * scale, gradient direction, and left-bar treatments are mechanically flagged
 * rather than missed by eye.
 *
 * The actual side is produced exactly as the eyes loop produces a screenshot:
 * render the draft → serve it over loopback → read *its* computed styles
 * through the same {@link BrowserDriver} seam. A pre-extracted `--actual`
 * manifest short-circuits the browser (offline re-diff, CI without Chromium).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { GlobalOptions } from './commands'
import { cmdRender } from './commands'
import { startServe } from './serve'
import {
  createPlaywrightDriver,
  EXTRACT_SCRIPT,
  readCapture,
  type BrowserDriverFactory,
  type RawSignals,
} from './capture'
import {
  diffManifests,
  flattenCapture,
  flattenSignals,
  type DiffOptions,
  type ObjectCard,
  type ValueDelta,
  type ValueManifest,
  type ValuesDiffReport,
} from './capture/values-diff'
import type { RenderChannel, SiteSource } from '../store'

export interface ValuesDiffOptions extends GlobalOptions {
  /** Site slug whose rendered draft is the *actual* side. */
  slug?: string
  /** Which channel of our site to diff (default `draft`). */
  source?: RenderChannel
  /** Capture bundle directory — the *expected* side. */
  refBundleDir: string
  /** Pre-extracted actual manifest JSON path; when set, no browser is launched. */
  actualManifestPath?: string
  /** Write the full report JSON here in addition to returning it. */
  out?: string
  /** Diff tolerances (REQ-53); axes we author are exact by default, `tolerant` restores loose matching. */
  diffOptions?: DiffOptions
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Fixed serve port; defaults to an ephemeral port. */
  port?: number
}

/** Render the draft, serve it over loopback, read its computed value manifest. */
async function extractDraftManifest(
  slug: string,
  source: RenderChannel,
  factory: BrowserDriverFactory,
  opts: ValuesDiffOptions,
): Promise<ValueManifest> {
  const renderSource: SiteSource = source === 'published' ? 'latest' : 'draft'
  await cmdRender(slug, { ...opts, source: renderSource, out: undefined })

  const handle = await startServe(slug, { ...opts, source, port: opts.port })
  const driver = await factory()
  try {
    await driver.navigate(handle.url)
    const signals = await driver.query<RawSignals>(EXTRACT_SCRIPT)
    return flattenSignals(signals, `draft:${slug}`)
  } finally {
    await driver.close()
    await new Promise<void>((resolve) => handle.server.close(() => resolve()))
  }
}

/**
 * Compute a values-diff report. Exactly one actual source is used: an injected
 * `--actual` manifest if given, else the live rendered draft for `slug`.
 */
export async function cmdValuesDiff(opts: ValuesDiffOptions): Promise<ValuesDiffReport> {
  const expected = flattenCapture(readCapture(opts.refBundleDir))

  let actual: ValueManifest
  if (opts.actualManifestPath) {
    actual = JSON.parse(readFileSync(opts.actualManifestPath, 'utf8')) as ValueManifest
  } else {
    if (!opts.slug) {
      throw new Error('values-diff needs a <slug> (or --actual <manifest.json>) for the actual side.')
    }
    const factory = opts.driverFactory ?? createPlaywrightDriver
    actual = await extractDraftManifest(opts.slug, opts.source ?? 'draft', factory, opts)
  }

  const report = diffManifests(expected, actual, opts.diffOptions)
  if (opts.out) writeFileSync(path.resolve(opts.out), JSON.stringify(report, null, 2))
  return report
}

/** Truncate a display label so a card heading / row stays one terminal line. */
function trunc(s: string, max = 48): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/**
 * A delta that is NOT tied to a reference object card: a section treatment
 * (`§n`), a document-level precondition (viewport), a render-only unilateral
 * check (overflow / font-load, read off *our* side), or a synthetic systemic
 * aggregate. These have no reference object to hang under, so they render in a
 * dedicated tail — everything the flat list held is still surfaced, nothing
 * vanishes into a count.
 */
function isNonObjectDelta(d: ValueDelta): boolean {
  return (
    d.systemic === true ||
    d.role === 'section' ||
    d.role === 'document' ||
    d.role === 'aggregate' ||
    d.property === 'overflow' ||
    d.property === 'fontLoad'
  )
}

/** Render one object card as a padded reference-vs-repro parameter table. */
function renderCard(o: ObjectCard): string {
  const badge = o.worstTier ? `  [${o.worstTier}]` : ''
  const head = `  ▸ ${o.kind} · "${trunc(o.label)}" (${o.role})${badge}`
  const nameW = Math.max(4, ...o.params.map((p) => p.name.length))
  const expW = Math.max(8, ...o.params.map((p) => p.expected.length))
  const actW = Math.max(8, ...o.params.map((p) => p.actual.length))
  const rows = o.params.map((p) => {
    const flag = p.mismatch ? '✗' : '✓'
    return `      ${p.name.padEnd(nameW)}  ${p.expected.padEnd(expW)}  ${p.actual.padEnd(actW)}  ${flag}`
  })
  return [head, ...rows].join('\n')
}

/**
 * Object-grouped human rendering (REQ-51) — the primary read in the fidelity
 * loop, ahead of the perceptual pixel-mean (which reads "≈98% done" while
 * structural defects sit unflagged). Instead of one flat severity-sorted stream
 * that scatters an object's deltas across a long list, this groups by object:
 * unpaired objects up top (loud, both directions), then a per-object parameter
 * card for each reference object that differs — every param reference-vs-repro,
 * `box` position first-class, mismatches flagged inline — worst object first.
 * The `expected` column prints the value to transcribe, so a flagged row is a
 * paste-able edit. Clean objects collapse to a count; non-object deltas (section
 * treatments, viewport, overflow, font-load, systemic) render in a tail.
 */
export function formatReport(report: ValuesDiffReport): string {
  const masked = report.suppressed > 0 ? `, ${report.suppressed} masked` : ''
  const lines: string[] = [
    `values-diff: ${report.expectedSource} ⇄ ${report.actualSource}`,
    `  ${report.matched} matched, ${report.unmatched} unmatched, ${report.deltas.length} delta(s)${masked}`,
  ]

  // Loud unpaired reporting (item 3) — up top, never folded into a count.
  const unpairedRef = report.objects.filter((o) => !o.paired)
  const unpairedAct = report.unpairedActual
  if (unpairedRef.length > 0 || unpairedAct.length > 0) {
    lines.push('')
    lines.push(
      `  ⚠ UNPAIRED  ${unpairedRef.length} reference object(s) had no repro match · ${unpairedAct.length} repro object(s) matched nothing`,
    )
    for (const o of unpairedRef) lines.push(`      ref only    ${o.kind} "${trunc(o.label)}" (${o.role})`)
    for (const o of unpairedAct) lines.push(`      repro only  ${o.kind} "${trunc(o.label)}" (${o.role})`)
  }

  // Stale-reference warning — reference objects paired with a repro that HAS box
  // geometry while the reference itself has none. That means the bundle predates
  // per-element geometry (REQ-47): position/width is not being verified for these
  // objects at all, so a re-capture is required before any geometry claim holds.
  const staleGeometry = report.objects.filter(
    (o) =>
      o.paired &&
      o.params.some((p) => p.name === 'box' && p.expected === '—' && p.actual !== '—'),
  )
  if (staleGeometry.length > 0) {
    lines.push('')
    lines.push(
      `  ⚠ STALE REFERENCE  ${staleGeometry.length} reference object(s) carry no box geometry — ` +
        `re-capture the bundle; position/width is NOT being verified for them.`,
    )
  }

  // Per-object cards, worst first. Clean paired objects collapse to a count.
  const dirty = report.objects
    .filter((o) => o.paired && o.deltaCount > 0)
    .sort((a, b) => b.worstSeverity - a.worstSeverity)
  const clean = report.objects.filter((o) => o.paired && o.deltaCount === 0)

  if (dirty.length > 0) {
    lines.push('')
    lines.push('  objects with deltas (expected column = value to transcribe):')
    for (const o of dirty) {
      lines.push('')
      lines.push(renderCard(o))
    }
  }
  if (clean.length > 0) {
    lines.push('')
    lines.push(`  ✓ ${clean.length} object(s) reproduced clean`)
  }

  // Non-object deltas — section / document / render-only / systemic — in a tail.
  const other = report.deltas.filter(isNonObjectDelta)
  if (other.length > 0) {
    lines.push('')
    lines.push('  section / render-only checks:')
    for (const d of other) {
      lines.push(
        `      ${d.tier.padEnd(8)} [${d.property}] "${trunc(d.text)}" (${d.role}): expected ${d.expected} · actual ${d.actual}`,
      )
    }
  }

  if (dirty.length === 0 && unpairedRef.length === 0 && unpairedAct.length === 0 && other.length === 0) {
    lines.push('  ✓ no value deltas')
  }
  return lines.join('\n')
}
