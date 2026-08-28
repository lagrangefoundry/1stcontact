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
export { cmdCapturePage } from './capture'
export type { CapturePageOptions, CapturePageResult } from './capture'
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
export { reextractFromBundle, rewriteMirroredRefs } from './reextract'
export {
  writeBundle,
  readCapture,
  bundleDirFor,
  writeMultiState,
  readMultiState,
  writeLadderScreenshots,
  readLadderScreenshotPath,
  ladderScreenshotPath,
  writeL1,
  readL1,
  writeHints,
  readHints,
} from './bundle'
export type { BundleLocation } from './bundle'
export { EXTRACT_SCRIPT } from './extract'
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
