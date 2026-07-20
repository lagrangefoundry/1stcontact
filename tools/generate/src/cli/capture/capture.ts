/**
 * `1c capture page <url>` orchestrator (DOC-13). Runs the rendered-only capture
 * pipeline and writes the self-contained bundle to `references/<host>/<path>/`.
 */
import type { L1Document } from '@1stcontact/site-schema'
import { captureLadderScreenshots, captureStructuralHints, runCapturePipeline, runMultiStateCapture } from './pipeline'
import { writeBundle, writeHints, writeL1, writeLadderScreenshots, writeMultiState, type BundleLocation } from './bundle'
import { foldToL1 } from '../../l1/fold'
import type { StructuralHints } from './hints'
import type { BrowserDriverFactory, Capture, RenderEngine } from './types'
import type { MultiStateCapture } from './values-diff'

export interface CapturePageOptions {
  /** Working directory the `references/` tree is resolved against. */
  cwd?: string
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Extra navigation attempts on browser failure. */
  retries?: number
  /** Engine-availability probe passthrough for the multi-viewport pass (tests inject a stub). */
  isEngineAvailable?: (engine: RenderEngine) => Promise<boolean>
}

export interface CapturePageResult extends BundleLocation {
  capture: Capture
  /** REQ-58 (T2) — the reference projected across the viewport ladder, persisted as `multistate.json`. */
  multiState: MultiStateCapture
  /** REQ-83 — the multi-viewport capture folded into one L1 document (`l1.json`). */
  l1: L1Document
  /** REQ-83 — the advisory structural-hint sidecar (`hints.json`). */
  hints: StructuralHints
}

export async function cmdCapturePage(url: string, opts: CapturePageOptions = {}): Promise<CapturePageResult> {
  const result = await runCapturePipeline(url, {
    driverFactory: opts.driverFactory,
    retries: opts.retries,
  })
  const location = writeBundle(result, opts.cwd ?? process.cwd())

  // REQ-58 (T2) — a reference is only complete if it spans the viewport ladder: a
  // %-vs-fixed reflow (a wordmark that drifts on resize) is invisible at a single
  // width. Project the reference across RESPONSIVE_VIEWPORTS at rest and persist it
  // so `values-diff --multi-viewport` has a per-width reference to pair against.
  const multiState = await runMultiStateCapture(url, {
    states: ['rest'],
    driverFactoryFor: opts.driverFactory ? () => opts.driverFactory! : undefined,
    isEngineAvailable: opts.isEngineAvailable,
  })
  writeMultiState(location.bundleDir, multiState)

  // REQ-61 — the image sibling of the ladder: a full-page reference screenshot at
  // each width, so `1c diff --size` compares our reproduction against a same-width
  // reference rather than the single desktop shot.
  const ladderShots = await captureLadderScreenshots(url, { driverFactory: opts.driverFactory })
  writeLadderScreenshots(location.bundleDir, ladderShots)

  // REQ-83 — fold the retained ladder into ONE L1 document (the reproduction
  // artifact), and read the advisory structural hints. `multistate.json` stays as
  // the acceptance oracle the folded doc renders and gates against.
  const l1 = foldToL1(multiState)
  writeL1(location.bundleDir, l1)
  const hints = await captureStructuralHints(url, {
    driverFactory: opts.driverFactory,
  })
  writeHints(location.bundleDir, hints)

  return { ...location, capture: result.capture, multiState, l1, hints }
}
