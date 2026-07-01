/**
 * `1c capture page <url>` orchestrator (DOC-13). Runs the rendered-only capture
 * pipeline and writes the self-contained bundle to `references/<host>/<path>/`.
 */
import { runCapturePipeline } from './pipeline'
import { writeBundle, type BundleLocation } from './bundle'
import type { BrowserDriverFactory, Capture } from './types'

export interface CapturePageOptions {
  /** Working directory the `references/` tree is resolved against. */
  cwd?: string
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Extra navigation attempts on browser failure. */
  retries?: number
}

export interface CapturePageResult extends BundleLocation {
  capture: Capture
}

export async function cmdCapturePage(url: string, opts: CapturePageOptions = {}): Promise<CapturePageResult> {
  const result = await runCapturePipeline(url, {
    driverFactory: opts.driverFactory,
    retries: opts.retries,
  })
  const location = writeBundle(result, opts.cwd ?? process.cwd())
  return { ...location, capture: result.capture }
}
