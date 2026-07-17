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
  readMultiState,
  runMultiStateCapture,
  selectProjectionAtWidth,
  type BrowserDriverFactory,
  type RawSignals,
} from './capture'
import { VIEWPORTS, type ViewportName } from './shot'
import {
  diffManifests,
  diffMultiState,
  flattenCapture,
  flattenSignals,
  type DiffOptions,
  type ObjectCard,
  type StateDiff,
  type StateProjection,
  type ValueDelta,
  type ValueManifest,
  type ValuesDiffReport,
} from './capture/values-diff'
import type { Viewport } from './capture/types'
import type { RenderChannel, SiteSource } from '../store'

export interface ValuesDiffOptions extends GlobalOptions {
  /** Site slug whose rendered draft is the *actual* side. */
  slug?: string
  /** Which channel of our site to diff (default `draft`). */
  source?: RenderChannel
  /** Capture bundle directory — the *expected* side. */
  refBundleDir: string
  /**
   * REQ-61 — diff at a named viewport size (`mobile` | `tablet` | `desktop`).
   * The reference side is taken from the persisted viewport ladder
   * (`multistate.json`) at that width, and the actual side is rendered at that
   * viewport — so a %-vs-fixed reflow that only shows on a narrow phone is
   * compared phone↔phone. Absent → the single-width default path (≈ desktop).
   */
  size?: ViewportName
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

/**
 * Render the draft, serve it over loopback, read its computed value manifest.
 * An optional `viewport` sizes the page before load (REQ-61 size-aware diff) so
 * responsive layout resolves at that width; absent → the driver's default.
 */
async function extractDraftManifest(
  slug: string,
  source: RenderChannel,
  factory: BrowserDriverFactory,
  opts: ValuesDiffOptions,
  viewport?: Viewport,
): Promise<ValueManifest> {
  const renderSource: SiteSource = source === 'published' ? 'latest' : 'draft'
  await cmdRender(slug, { ...opts, source: renderSource, out: undefined })

  const handle = await startServe(slug, { ...opts, source, port: opts.port })
  const driver = await factory()
  try {
    await driver.navigate(handle.url, viewport)
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
 *
 * REQ-61 — `--size` routes through {@link valuesDiffAtSize}: the reference side
 * comes from the persisted viewport ladder at that width and the actual side is
 * rendered at that viewport. Absent → the single-width default below.
 */
export async function cmdValuesDiff(opts: ValuesDiffOptions): Promise<ValuesDiffReport> {
  if (opts.size) return valuesDiffAtSize(opts, opts.size)

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
 * REQ-61 — the size-aware single-cell diff. The reference at `size`'s width is
 * read from `multistate.json` (the ladder persisted by capture), and the actual
 * side is rendered at that viewport. A bundle without a ladder is a STALE
 * REFERENCE — terminal-fail with a re-capture instruction rather than silently
 * fall back to a desktop comparison the caller did not ask for; a ladder that
 * never reached this width fails loudly with the widths it does carry.
 */
async function valuesDiffAtSize(opts: ValuesDiffOptions, size: ViewportName): Promise<ValuesDiffReport> {
  const viewport = VIEWPORTS[size]
  const reference = readMultiState(opts.refBundleDir)
  if (!reference || reference.projections.length === 0) {
    throw new Error(
      `values-diff --size needs a multi-viewport reference, but '${opts.refBundleDir}' has no multistate.json ` +
        `(or it is empty). Re-capture with '1c capture page <url>' to persist the reference across the viewport ` +
        `ladder, then re-run.`,
    )
  }
  const projection = selectProjectionAtWidth(reference, viewport.width)
  if (!projection) {
    const widths = [...new Set(reference.projections.map((p) => p.viewport.width))].sort((a, b) => a - b)
    throw new Error(
      `values-diff --size ${size}: reference has no projection at width ${viewport.width}px ` +
        `(ladder carries ${widths.join(', ')}). Re-capture to include ${viewport.width}px, then re-run.`,
    )
  }
  const expected = projection.manifest

  let actual: ValueManifest
  if (opts.actualManifestPath) {
    actual = JSON.parse(readFileSync(opts.actualManifestPath, 'utf8')) as ValueManifest
  } else {
    if (!opts.slug) {
      throw new Error('values-diff --size needs a <slug> (or --actual <manifest.json>) for the actual side.')
    }
    const factory = opts.driverFactory ?? createPlaywrightDriver
    actual = await extractDraftManifest(opts.slug, opts.source ?? 'draft', factory, opts, viewport)
  }

  const report = diffManifests(expected, actual, opts.diffOptions)
  if (opts.out) writeFileSync(path.resolve(opts.out), JSON.stringify(report, null, 2))
  return report
}

/**
 * The distinct viewport widths a reference carries, in first-seen order, each with
 * its captured height. The repro is projected across *this* ladder (not a fixed
 * default) so every reference cell has a repro cell to pair against — a mismatched
 * ladder would read as phantom coverage gaps.
 */
function referenceViewports(projections: StateProjection[]): Viewport[] {
  const byWidth = new Map<number, Viewport>()
  for (const p of projections) if (!byWidth.has(p.viewport.width)) byWidth.set(p.viewport.width, p.viewport)
  return [...byWidth.values()]
}

/**
 * REQ-58 (T2) — the multi-viewport fidelity loop. A single-width diff is blind to
 * a %-vs-fixed reflow: a wordmark that tracks the hero text at 1280 but drifts on
 * a narrow phone reads clean at the one width every other gate checks. This reads
 * the reference's persisted viewport ladder (`multistate.json`), projects our
 * served draft across that *same* ladder, and diffs cell-for-cell — so a mobile
 * reflow fires in the mobile cell while desktop stays clean.
 *
 * A bundle without `multistate.json` is a STALE REFERENCE (it predates T2): the
 * loop terminal-fails with a re-capture instruction rather than silently passing a
 * comparison it cannot make.
 */
export async function cmdValuesDiffMultiViewport(opts: ValuesDiffOptions): Promise<StateDiff[]> {
  const reference = readMultiState(opts.refBundleDir)
  if (!reference || reference.projections.length === 0) {
    throw new Error(
      `values-diff --multi-viewport needs a multi-viewport reference, but '${opts.refBundleDir}' has no ` +
        `multistate.json (or it is empty). Re-capture with '1c capture page <url>' to project the reference ` +
        `across the viewport ladder, then re-run.`,
    )
  }
  if (!opts.slug) {
    throw new Error('values-diff --multi-viewport needs a <slug> for the repro side.')
  }

  const source = opts.source ?? 'draft'
  const renderSource: SiteSource = source === 'published' ? 'latest' : 'draft'
  await cmdRender(opts.slug, { ...opts, source: renderSource, out: undefined })

  const handle = await startServe(opts.slug, { ...opts, source, port: opts.port })
  let repro
  try {
    repro = await runMultiStateCapture(handle.url, {
      viewports: referenceViewports(reference.projections),
      states: ['rest'],
      // Route an injected fake through the per-engine seam and force it available;
      // production falls through to the real per-engine Playwright factory + probe.
      driverFactoryFor: opts.driverFactory ? () => opts.driverFactory! : undefined,
      isEngineAvailable: opts.driverFactory ? async () => true : undefined,
    })
  } finally {
    await new Promise<void>((resolve) => handle.server.close(() => resolve()))
  }

  const cells = diffMultiState(reference, repro, opts.diffOptions)
  if (opts.out) writeFileSync(path.resolve(opts.out), JSON.stringify(cells, null, 2))
  return cells
}

/**
 * Human rendering of a multi-viewport diff — worst cell first (a missing cell,
 * then by top-delta severity), the same ranking `diffMultiState` returns. A missing
 * cell is loud (the repro never projected a width the reference has); a clean cell
 * collapses to one ✓ line; a failing cell prints its top deltas reference→repro.
 */
export function formatMultiViewportReport(cells: StateDiff[]): string {
  const totalDeltas = cells.reduce((n, c) => n + (c.report?.deltas.length ?? 0), 0)
  const missing = cells.filter((c) => c.missing).length
  const lines: string[] = [
    `values-diff --multi-viewport: ${cells.length} cell(s) across the viewport ladder`,
    `  ${totalDeltas} delta(s), ${missing} missing cell(s) — worst cell first`,
  ]
  for (const c of cells) {
    const tag = `@${c.viewportWidth} ${c.engine}:${c.state}`
    if (c.missing) {
      lines.push(`  ⚠ ${tag}  MISSING — reference has this width, repro never projected it`)
      continue
    }
    const deltas = c.report?.deltas ?? []
    if (deltas.length === 0) {
      lines.push(`  ✓ ${tag}  clean`)
      continue
    }
    const top = deltas[0]
    lines.push(`  ✗ ${tag}  ${deltas.length} delta(s) — worst [${top.tier}] ${top.property} "${trunc(top.text)}"`)
    for (const d of deltas.slice(0, 6)) {
      lines.push(`      ${d.property.padEnd(16)} ${trunc(d.expected, 24).padEnd(24)} → ${trunc(d.actual, 24)}`)
    }
  }
  return lines.join('\n')
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
