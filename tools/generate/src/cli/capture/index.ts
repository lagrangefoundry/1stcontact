/**
 * REQ-12 — rendered-only reference capture ([[DOC-13]]). Public surface for the
 * `1c capture page` command, the capture pipeline, the CF-shaped BrowserDriver
 * seam, and offline re-extraction.
 *
 * `cf-driver.ts` IS DELIBERATELY ABSENT (REQ-154). This barrel re-exports
 * `playwright-driver`, so importing it drags Playwright in — which is exactly
 * what must not reach a Worker bundle. The Browser Rendering driver is therefore
 * reached by deep path (`capture/cf-driver`), the same convention `router.ts`
 * already follows for every `tools/generate` import it makes. Adding it here
 * would suggest this barrel is Worker-reachable, and it is not.
 */
export type { CapturePageOptions, CapturePageResult } from './capture'
// No Node default to add: listing is store reads only, so it needs no browser
// and is re-exported straight through rather than wrapped like `cmdCapturePage`.
export { cmdCaptureList } from './capture'
export type { StoredCapture } from './capture'
export { runCapturePipeline, runMultiStateCapture, captureLadderScreenshots, captureStructuralHints } from './pipeline'
export type {
  CapturePipelineOptions,
  MultiStateCaptureOptions,
  LadderScreenshot,
  LadderScreenshotOptions,
  StructuralHintsOptions,
} from './pipeline'
export { HINTS_SCRIPT, extractHints } from './hints'
export { VIEWPORTS, resolveViewport, screenshotUrl } from './screenshot'
export type { ViewportName } from './screenshot'
export { FONT_BARRIER, FONTS_READY, IMAGES_DECODED, SETTLE_CSS, SETTLE_SCROLL } from './page-scripts'
export type { StructuralHints, HintNode, ParentLayout, SizingUnit, HintDriver } from './hints'
export {
  createPlaywrightDriver,
  createEngineDriver,
  chromiumAvailable,
  engineAvailable,
} from './playwright-driver'
export type { RenderEngine } from './playwright-driver'
export { reextractFromBundle, rewriteMirroredRefs, serveBundle } from './reextract'
// REQ-275 — the completeness probe. Node-only for the same reason re-extraction
// is (it navigates a loopback origin), so it belongs on this barrel and not on a
// Worker-reachable path.
export { AUDIT_SCRIPT } from './audit-script'
export type { ObservedProperty, RawAudit } from './audit-script'
export { CAPTURE_COVERAGE } from './coverage'
export type { CoverageEntry, CoverageVerdict } from './coverage'
export { auditObservations, combineAudits, runCaptureAudit } from './audit'
export type {
  AuditFinding,
  CaptureAudit,
  CaptureAuditOptions,
  CombinedAudit,
  CombinedFinding,
} from './audit'
export {
  writeBundle,
  readCapture,
  readCaptureAssets,
  listAssets,
  writeMultiState,
  readMultiState,
  writeLadderScreenshots,
  readLadderScreenshot,
  writeL1,
  readL1,
  writeForms,
  readForms,
  writeHints,
  readHints,
} from './bundle'
export type { BundleLocation } from './bundle'
export {
  CAPTURE_SCHEMA,
  CAPTURE_SCHEMA_AXES,
  captureFields,
  captureRuns,
  captureSchemaOf,
  staleCaptureAxes,
  staleCaptureDetail,
} from './schema'
export type { CaptureAxis } from './schema'
export { EXTRACT_SCRIPT } from './extract'
// REQ-274 — the single declaration site for every value axis. Exported so a
// caller can ask the table what it covers (and what it cannot read on one side)
// rather than reading two projection bodies to find out.
export {
  AXIS_TABLES,
  FIELD_AXES,
  GEOMETRY_AXES,
  MANIFEST_AXES,
  RUN_AXES,
  SECTION_AXES,
  UNMEASURED_AXES,
  observedUnmeasuredAxes,
  readerOf,
  unmeasuredAxesOf,
  unmeasuredAxisLabel,
  unsupplied,
} from './value-axes'
export type {
  AxisRole,
  AxisScope,
  AxisSide,
  AxisSideName,
  CaptureBand,
  UnmeasuredAxis,
} from './value-axes'
export type { RawSignals, RawRun, RawField, RawGeometry } from './extract'
export {
  flattenCapture,
  flattenSignals,
  diffManifests,
  diffMultiState,
  selectProjectionAtWidth,
  normalizeGradient,
  colorToHex,
  colorDistance,
  contentRunToElement,
  rawRunToElement,
  fieldToElement,
  horizontalOverflows,
  unresolvedFonts,
  HEIGHT_PROBE_VIEWPORTS,
  partitionProbes,
  RESPONSIVE_VIEWPORTS,
} from './values-diff'
export type {
  ValueElement,
  ValueManifest,
  SectionValues,
  ValueDelta,
  DeltaProperty,
  DeltaKind,
  SeverityTier,
  ValuesDiffReport,
  ObjectKind,
  ObjectParam,
  ObjectCard,
  UnpairedObject,
  SectionPairing,
  UnpairedSection,
  NotComparableAxis,
  DiffOptions,
  StateProjection,
  MultiStateCapture,
  StateDiff,
} from './values-diff'
export {
  makeCalibrationBaseline,
  calibrateDiscriminator,
  discriminatorIsCalibrated,
  SEEDED_DEFECTS,
} from './calibration'
export type { SeededDefect, CalibrationResult } from './calibration'
export * from './types'

// ── the Node defaults, which live HERE and nowhere below ────────────────────

/**
 * REQ-157 — `cmdCapturePage` with a browser already chosen.
 *
 * WHY THE DEFAULT IS AT THIS LEVEL. `pipeline.ts` used to default its four
 * driver seams to Playwright's factories. That was invisible while every caller
 * was a `1c` command on a laptop, and fatal once `capture_site` had to run in a
 * Worker: a static `?? createPlaywrightDriver` put Playwright into the Worker's
 * bundle graph, which REQ-154 exists to keep it out of. The seams below are
 * inject-or-fail now.
 *
 * The convenience is not lost, it is relocated to the one place that was always
 * Node-only. This barrel already re-exports `playwright-driver` and already
 * declines to re-export the Browser Rendering driver for exactly that reason
 * (see the header above), so a caller that reaches it has a laptop by
 * construction — and every `1c capture page` and every real-browser test calls
 * what it always called.
 *
 * A Worker imports `./capture/capture` directly and supplies its own.
 */
export function cmdCapturePage(
  url: string,
  store: ReferenceStore,
  opts: CapturePageOptionsNode = {},
): Promise<CapturePageResultNode> {
  // ONLY WHEN THE CALLER SUPPLIED NO DRIVER. A caller that injected one — a
  // fake in a test, a leased session in a Worker — has said which browser it
  // wants, and filling in Playwright's per-engine seams underneath it would
  // quietly launch a real Chromium alongside the driver it was handed. That is
  // not a hypothetical: it is what this wrapper did in its first draft, and
  // seven capture suites went red on a machine with no Playwright installed.
  if (opts.driverFactory) return cmdCapturePageCore(url, store, opts)
  return cmdCapturePageCore(url, store, {
    driverFactory: createPlaywrightDriver,
    driverFactoryFor: createEngineDriver,
    isEngineAvailable: engineAvailable,
    ...opts,
  })
}

import { cmdCapturePage as cmdCapturePageCore } from './capture'
import { createEngineDriver, createPlaywrightDriver, engineAvailable } from './playwright-driver'
import type {
  CapturePageOptions as CapturePageOptionsNode,
  CapturePageResult as CapturePageResultNode,
} from './capture'
import type { ReferenceStore } from '../../store/reference-store'
