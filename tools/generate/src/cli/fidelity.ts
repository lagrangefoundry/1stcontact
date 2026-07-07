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
  /** Diff tolerances / strict mode (REQ-35); defaults are jitter-tolerant. */
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

/**
 * One-line-per-delta human rendering, most-severe first. Each row leads with the
 * severity **tier** (REQ-47) — the report leads with the severity-ranked delta
 * list, not the aggregate fidelity mean, which reads like "≈98% done" while the
 * most obvious structural defects sit unflagged.
 */
export function formatReport(report: ValuesDiffReport): string {
  const masked = report.suppressed > 0 ? `, ${report.suppressed} masked` : ''
  const head = `values-diff: ${report.expectedSource} ⇄ ${report.actualSource}\n  ${report.matched} matched, ${report.unmatched} unmatched, ${report.deltas.length} delta(s)${masked}`
  if (report.deltas.length === 0) return `${head}\n  ✓ no value deltas`
  const rows = report.deltas.map(
    (d) =>
      `  ${d.tier.padEnd(8)} [${d.kind}] "${d.text}" (${d.role}): expected ${d.expected} · actual ${d.actual}`,
  )
  return `${head}\n${rows.join('\n')}`
}
