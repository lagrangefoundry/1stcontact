/**
 * REQ-12 — rendered-only reference capture ([[DOC-13]]). Public surface for the
 * `1c capture page` command, the capture pipeline, the CF-shaped BrowserDriver
 * seam, and offline re-extraction.
 */
export { cmdCapturePage } from './capture'
export type { CapturePageOptions, CapturePageResult } from './capture'
export { runCapturePipeline } from './pipeline'
export type { CapturePipelineOptions } from './pipeline'
export { createPlaywrightDriver, chromiumAvailable } from './playwright-driver'
export { reextractFromBundle } from './reextract'
export { writeBundle, readCapture, bundleDirFor } from './bundle'
export type { BundleLocation } from './bundle'
export { EXTRACT_SCRIPT } from './extract'
export type { RawSignals, RawRun, RawField, RawGeometry } from './extract'
export {
  flattenCapture,
  flattenSignals,
  diffManifests,
  normalizeGradient,
  colorToHex,
  colorDistance,
  contentRunToElement,
  rawRunToElement,
  fieldToElement,
  horizontalOverflows,
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
  DiffOptions,
} from './values-diff'
export * from './types'
