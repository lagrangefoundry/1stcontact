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
export type { RawSignals } from './extract'
export * from './types'
