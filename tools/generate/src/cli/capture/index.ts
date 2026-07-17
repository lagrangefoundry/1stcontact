/**
 * REQ-12 — rendered-only reference capture ([[DOC-13]]). Public surface for the
 * `1c capture page` command, the capture pipeline, the CF-shaped BrowserDriver
 * seam, and offline re-extraction.
 */
export { cmdCapturePage } from './capture'
export type { CapturePageOptions, CapturePageResult } from './capture'
export { runCapturePipeline, runMultiStateCapture, captureLadderScreenshots } from './pipeline'
export type { CapturePipelineOptions, MultiStateCaptureOptions, LadderScreenshot, LadderScreenshotOptions } from './pipeline'
export {
  createPlaywrightDriver,
  createEngineDriver,
  chromiumAvailable,
  engineAvailable,
} from './playwright-driver'
export type { RenderEngine } from './playwright-driver'
export { reextractFromBundle } from './reextract'
export {
  writeBundle,
  readCapture,
  bundleDirFor,
  writeMultiState,
  readMultiState,
  writeLadderScreenshots,
  readLadderScreenshotPath,
  ladderScreenshotPath,
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
