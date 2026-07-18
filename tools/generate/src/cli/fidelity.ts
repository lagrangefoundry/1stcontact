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
  DERIVED_PROPERTIES,
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
    ...repairPlanLines(cells),
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
    lines.push(`  ✗ ${tag}  ${deltas.length} delta(s) — worst [${top.tier}] ${top.valueType} ${top.property} "${trunc(top.text)}"`)
    for (const d of deltas.slice(0, 6)) {
      // `[A]` = copy the reference value; `[B]` = emergent residual (fix its inputs).
      lines.push(`      [${d.valueType}] ${d.property.padEnd(16)} ${trunc(d.expected, 22).padEnd(22)} → ${trunc(d.actual, 22)}`)
    }
  }
  return lines.join('\n')
}

/**
 * REQ-64 — the repair-order summary. Every delta is Type A (an author-set value to
 * COPY) or Type B (emergent geometry — a *measure* of how far off we are). Within
 * A, a value whose reference differs across the viewport ladder is *structural*
 * (needs a responsive ladder, not a scalar) — as is a section band padding delta
 * (spacing is padding-vs-margin, not a lone copy). The fix order is fixed:
 *
 *   1. Type-A flat        → copy the literal into place (kills the delta outright)
 *   2. Type-A structural  → author the responsive ladder / spacing model
 *   3. Type-B             → re-measure; what remains is the true residual
 *
 * Deduped across the ladder so the counts are per-defect, not per-cell.
 */
/** REQ-64 - one row per DEFECT (a value wrong at N widths is ONE defect). */
export interface CollapsedDefect {
  text: string
  property: ValueDelta['property']
  valueType: 'A' | 'B'
  /** Type-A: `flat` (a scalar to copy) or `structural` (a responsive ramp / section
   *  spacing to author). Type-B is `emergent` (the residual, not a value to set). */
  repairClass: 'flat' | 'structural' | 'emergent'
  /** The viewport widths at which this defect fires. */
  widths: number[]
  /** Reference value - a single scalar when constant, else `a .. b` across the ladder. */
  expected: string
  /** Our value, same convention. */
  actual: string
  /** Worst tier this defect reached across the widths. */
  tier: ValueDelta['tier']
  /** REQ-64 — a derived axis (absolute `position`): the cumulative shadow of the
   *  `gap`/`size` causes, reported for drill-down but excluded from the headline
   *  count so a handful of real causes aren't buried under their downstream echoes. */
  derived: boolean
}

const TIER_RANK: Record<ValueDelta['tier'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

/**
 * REQ-64 - collapse the per-cell multi-viewport deltas to one row per DEFECT. The
 * x-viewport multiplier (the same value flagged at every width) is the biggest
 * single inflator of the raw count; dedup by (text, property) so the count is
 * defects, not cells, and record the widths each fires at. `structural` = the
 * reference value varies across the ladder, OR the delta fires at only SOME widths
 * (fluid reference vs our fixed value - the wordmark 36->72 case), OR it is section
 * band padding (padding-vs-margin). The synthetic `systemic` rollups are skipped
 * (their own cross-element view, not per-defect rows).
 */
export function collapseMultiViewport(cells: StateDiff[]): CollapsedDefect[] {
  const present = cells.filter((c) => !c.missing).length
  interface G {
    text: string
    property: ValueDelta['property']
    valueType: 'A' | 'B'
    widths: Set<number>
    refs: string[]
    acts: string[]
    tier: ValueDelta['tier']
  }
  const groups = new Map<string, G>()
  for (const c of cells) {
    for (const d of c.report?.deltas ?? []) {
      if (d.systemic) continue
      const key = `${d.text} ${d.property}`
      let g = groups.get(key)
      if (!g) {
        g = { text: d.text, property: d.property, valueType: d.valueType, widths: new Set(), refs: [], acts: [], tier: d.tier }
        groups.set(key, g)
      }
      g.widths.add(c.viewportWidth)
      g.refs.push(d.expected)
      g.acts.push(d.actual)
      if (TIER_RANK[d.tier] < TIER_RANK[g.tier]) g.tier = d.tier
    }
  }
  const range = (vals: string[]): string => {
    const u = [...new Set(vals)]
    return u.length === 1 ? u[0] : `${u[0]} .. ${u[u.length - 1]}`
  }
  const CLASS_ORDER = { flat: 0, structural: 1, emergent: 2 }
  const out: CollapsedDefect[] = [...groups.values()].map((g) => {
    const structural =
      new Set(g.refs).size > 1 ||
      (present > 1 && g.widths.size < present) ||
      (g.text.startsWith('§') && g.property.startsWith('padding'))
    const repairClass: CollapsedDefect['repairClass'] = g.valueType === 'B' ? 'emergent' : structural ? 'structural' : 'flat'
    return {
      text: g.text,
      property: g.property,
      valueType: g.valueType,
      repairClass,
      widths: [...g.widths].sort((a, b) => a - b),
      expected: range(g.refs),
      actual: range(g.acts),
      tier: g.tier,
      derived: DERIVED_PROPERTIES.has(g.property),
    }
  })
  out.sort(
    (a, b) =>
      CLASS_ORDER[a.repairClass] - CLASS_ORDER[b.repairClass] ||
      TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
      a.property.localeCompare(b.property) ||
      a.text.localeCompare(b.text),
  )
  return out
}

/**
 * REQ-64 - the `--collapse` human report: the deduped per-defect list, grouped by
 * repair class in fix order (Type-A flat -> structural -> Type-B), each row carrying
 * the reference value to transcribe and the widths it fires at.
 */
export function formatCollapsedReport(cells: StateDiff[]): string {
  const all = collapseMultiViewport(cells)
  // REQ-64 — derived axes (absolute `position`) are the cumulative shadow of the
  // gap/size causes; report them for drill-down but keep them OUT of the headline
  // count and the repair classes, so the count is real causes, not their echoes.
  const defects = all.filter((d) => !d.derived)
  const derived = all.filter((d) => d.derived)
  const widths = cells.filter((c) => !c.missing).map((c) => c.viewportWidth)
  const rawTotal = cells.reduce((s, c) => s + (c.report?.deltas.filter((d) => !d.systemic).length ?? 0), 0)
  const byClass = (cls: CollapsedDefect['repairClass']): CollapsedDefect[] => defects.filter((d) => d.repairClass === cls)
  const HEAD: Record<CollapsedDefect['repairClass'], string> = {
    flat: 'Type-A flat - copy the reference value (the `expected` column)',
    structural: 'Type-A structural - author the responsive ladder / section spacing',
    emergent: 'Type-B - emergent residual (shrinks once Type-A is right; do not set directly)',
  }
  const derivedNote = derived.length > 0 ? ` (+${derived.length} derived position drift, not counted)` : ''
  const lines: string[] = [
    `values-diff --multi-viewport --collapse: ${defects.length} unique defect(s)${derivedNote} - from ${rawTotal} raw deltas across ${widths.length} width(s)`,
    `  A-flat ${byClass('flat').length} -> A-structural ${byClass('structural').length} -> B ${byClass('emergent').length}   (fix in that order)`,
  ]
  for (const cls of ['flat', 'structural', 'emergent'] as const) {
    const group = byClass(cls)
    if (group.length === 0) continue
    lines.push('', `  -- ${HEAD[cls]} -- ${group.length}`)
    const cap = cls === 'emergent' ? 60 : 200
    for (const d of group.slice(0, cap)) {
      const w = d.widths.length === widths.length ? 'all' : d.widths.join(',')
      lines.push(`     [${d.tier[0]}] ${d.property.padEnd(16)} "${trunc(d.text, 26)}"  ${trunc(d.expected, 20).padEnd(20)} -> ${trunc(d.actual, 20)}  @${w}`)
    }
    if (group.length > cap) lines.push(`     ... +${group.length - cap} more`)
  }
  if (derived.length > 0) {
    lines.push(
      '',
      `  -- Derived (cumulative position drift - the integral of the gap/size deltas above; NOT counted) -- ${derived.length}`,
    )
    const cap = 20
    for (const d of derived.slice(0, cap)) {
      const w = d.widths.length === widths.length ? 'all' : d.widths.join(',')
      lines.push(`     [~] ${d.property.padEnd(16)} "${trunc(d.text, 26)}"  ${trunc(d.expected, 20).padEnd(20)} -> ${trunc(d.actual, 20)}  @${w}`)
    }
    if (derived.length > cap) lines.push(`     ... +${derived.length - cap} more`)
  }
  return lines.join('\n')
}

/**
 * REQ-76 — a CAUSE the counted defects roll up to, with a disposition. The point
 * of noise management: a 112-row diff is really ~7 causes, each a single decision.
 */
export interface DefectCause {
  /** Human cause label (several properties can share one cause). */
  cause: string
  /** What to do: `fix` (a real, closeable gap), `review` (judge per case, often
   *  structural), `accept` (a capture artifact / sub-visual residual to sign off). */
  disposition: 'fix' | 'review' | 'accept'
  /** Number of counted defects rolling up to this cause. */
  count: number
  /** Worst tier reached. */
  tier: ValueDelta['tier']
  /** Union of the widths its members fire at (viewport-awareness: a cause that
   *  fires only at narrow widths is a different animal from an all-width one). */
  widths: number[]
  /** A few representative element labels. */
  examples: string[]
}

/**
 * REQ-76 — map a fine-grained delta property to the CAUSE it evidences and the
 * default disposition. Several properties share a cause (arrangement+containment =
 * layout structure; shape+border+outline = control styling), so the count collapses
 * further than the property list. `fontLoad` is a capture artifact (the reference
 * froze a webfont FOUT), so it defaults to `accept`.
 */
const CAUSE_MAP: Record<string, { cause: string; disposition: DefectCause['disposition'] }> = {
  renderedTextBox: { cause: 'text extent / wrapping', disposition: 'review' },
  gap: { cause: 'vertical spacing', disposition: 'fix' },
  listMarker: { cause: 'list-marker treatment', disposition: 'fix' },
  arrangement: { cause: 'layout structure', disposition: 'review' },
  containment: { cause: 'layout structure', disposition: 'review' },
  shape: { cause: 'control styling', disposition: 'fix' },
  border: { cause: 'control styling', disposition: 'fix' },
  outline: { cause: 'control styling', disposition: 'fix' },
  size: { cause: 'box dimensions (non-text)', disposition: 'fix' },
  fontLoad: { cause: 'capture artifact (webfont FOUT)', disposition: 'accept' },
  color: { cause: 'colour', disposition: 'fix' },
  contentAnchor: { cause: 'content anchor', disposition: 'review' },
  overflow: { cause: 'overflow', disposition: 'review' },
}

/**
 * REQ-76 — roll the counted (non-derived) defects up into ranked CAUSES. This is
 * the noise-management view: instead of 112 rows the operator sees ~7 causes, each
 * tagged fix / review / accept, so "do I care about Type-B" becomes a per-cause call.
 */
export function clusterDefects(defects: CollapsedDefect[]): DefectCause[] {
  interface G {
    cause: string
    disposition: DefectCause['disposition']
    count: number
    tier: ValueDelta['tier']
    widths: Set<number>
    examples: string[]
  }
  const groups = new Map<string, G>()
  for (const d of defects) {
    if (d.derived) continue // derived axes (position) are not counted defects
    const { cause, disposition } = CAUSE_MAP[d.property] ?? { cause: d.property, disposition: 'review' as const }
    let g = groups.get(cause)
    if (!g) {
      g = { cause, disposition, count: 0, tier: d.tier, widths: new Set(), examples: [] }
      groups.set(cause, g)
    }
    g.count++
    for (const w of d.widths) g.widths.add(w)
    if (TIER_RANK[d.tier] < TIER_RANK[g.tier]) g.tier = d.tier
    if (g.examples.length < 3 && !g.examples.includes(d.text)) g.examples.push(d.text)
  }
  return [...groups.values()]
    .map((g) => ({ ...g, widths: [...g.widths].sort((a, b) => a - b) }))
    .sort((a, b) => b.count - a.count || TIER_RANK[a.tier] - TIER_RANK[b.tier])
}

/**
 * REQ-76 — the `--clusters` report: ranked causes with dispositions, plus a
 * one-line "N causes: X fix / Y review / Z accept" summary. Width-scope is shown so
 * a cause that fires only at narrow widths (a phantom of the viewport-merged view)
 * is not mistaken for an all-width one.
 */
export function formatClusterReport(cells: StateDiff[]): string {
  const all = collapseMultiViewport(cells)
  const counted = all.filter((d) => !d.derived)
  const causes = clusterDefects(all)
  const widths = [...new Set(cells.filter((c) => !c.missing).map((c) => c.viewportWidth))].sort((a, b) => a - b)
  const byDisp = (dsp: DefectCause['disposition']): number =>
    causes.filter((c) => c.disposition === dsp).reduce((s, c) => s + c.count, 0)
  const lines: string[] = [
    `values-diff --clusters: ${counted.length} counted defect(s) roll up to ${causes.length} cause(s)`,
    `  fix ${byDisp('fix')} · review ${byDisp('review')} · accept ${byDisp('accept')}   (counted defects, by disposition)`,
    '',
  ]
  const MARK: Record<DefectCause['disposition'], string> = { fix: 'FIX  ', review: 'REVIEW', accept: 'ACCEPT' }
  for (const c of causes) {
    const scope = c.widths.length === widths.length ? '@all' : `@${c.widths.join(',')}`
    lines.push(`  [${MARK[c.disposition]}] ${String(c.count).padStart(3)} × ${c.cause.padEnd(30)} ${scope}`)
    lines.push(`             e.g. ${c.examples.map((e) => `"${trunc(e, 22)}"`).join(', ')}`)
  }
  return lines.join('\n')
}

function repairPlanLines(cells: StateDiff[]): string[] {
  // Group every delta by (text, property); a group is one defect across widths.
  const present = cells.filter((c) => !c.missing).length
  const groups = new Map<string, { valueType: 'A' | 'B'; text: string; property: string; refs: Set<string>; cells: number }>()
  for (const c of cells) {
    for (const d of c.report?.deltas ?? []) {
      const key = `${d.text} ${d.property}`
      let g = groups.get(key)
      if (!g) {
        g = { valueType: d.valueType, text: d.text, property: d.property, refs: new Set(), cells: 0 }
        groups.set(key, g)
      }
      g.refs.add(d.expected)
      g.cells++
    }
  }
  // Structural = the reference is NOT a single scalar to copy. It varies across the
  // ladder (responsive), OR the delta fires at only SOME widths — meaning the ref
  // MATCHES our (fixed) value at the others, i.e. it is fluid and we are fixed (the
  // wordmark 36-vs-72 case a raw ref-value check misses, since it only deltas where it
  // differs). Section band padding is structural too (padding-vs-margin as a system).
  const isStructural = (g: { text: string; property: string; refs: Set<string>; cells: number }): boolean =>
    g.refs.size > 1 ||
    (present > 1 && g.cells < present) ||
    (g.text.startsWith('§') && g.property.startsWith('padding'))
  let aFlat = 0
  let aStructural = 0
  let b = 0
  for (const g of groups.values()) {
    if (g.valueType === 'B') b++
    else if (isStructural(g)) aStructural++
    else aFlat++
  }
  return [
    `  repair order (REQ-64): A-flat ${aFlat} → A-structural ${aStructural} → B ${b}  (${groups.size} defects deduped across the ladder)`,
    `    ① copy the ${aFlat} Type-A flat value(s); ② author the ${aStructural} Type-A structural (responsive/spacing); ③ then read the ${b} Type-B as the residual`,
  ]
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
  const a = report.deltas.filter((d) => d.valueType === 'A').length
  const b = report.deltas.filter((d) => d.valueType === 'B').length
  const lines: string[] = [
    `values-diff: ${report.expectedSource} ⇄ ${report.actualSource}`,
    `  ${report.matched} matched, ${report.unmatched} unmatched, ${report.deltas.length} delta(s)${masked}`,
    // REQ-64 — repair order: copy the Type-A author-set values first (the `expected`
    // column is the paste-able target), then read Type-B as the emergent residual.
    // (Flat-vs-structural needs the ladder; run --multi-viewport for that split.)
    `  repair order (REQ-64): A ${a} (copy the reference value) → B ${b} (emergent residual — fix A first, then re-measure)`,
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
