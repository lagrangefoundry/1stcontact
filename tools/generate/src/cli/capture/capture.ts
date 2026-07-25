/**
 * `1c capture page <url>` orchestrator (DOC-13). Runs the rendered-only capture
 * pipeline and writes the self-contained bundle to `references/<host>/<path>/`.
 */
import type { L1Document, L1FontFace } from '@1stcontact/site-schema'
import { captureLadderScreenshots, captureStructuralHints, runCapturePipeline, runMultiStateCapture } from './pipeline'
import { writeBundle, writeHints, writeL1, writeLadderScreenshots, writeMultiState, type BundleLocation } from './bundle'
import { foldToL1 } from '../../l1/fold'
import { primaryFamily } from './theme'
import type { StructuralHints } from './hints'
import type { BrowserDriverFactory, Capture, RenderEngine, ThemeFont } from './types'
import type { MultiStateCapture } from './values-diff'

/**
 * REQ-90 — turn the captured theme's font handles into L1 font-face resources:
 * one entry per mirrored `.woff2` (family → served asset). A single-weight family
 * pins its weight; a multi-weight family leaves weight unset (the capture aggregates
 * the per-face weight away, so binding the family name is what moves the pixel).
 * Families whose face never mirrored (`files: []` — e.g. a CDN the intercept missed)
 * contribute nothing, and the fold drops any face no text paints.
 */
function fontResourcesFromTheme(fonts: ThemeFont[]): L1FontFace[] {
  const out: L1FontFace[] = []
  for (const f of fonts) {
    const weight = f.weights.length === 1 ? f.weights[0] : undefined
    for (const src of f.files) {
      // An `@font-face` declares ONE family name; a painted run carries the full
      // stack (BUG-16). Declaring the stack would emit `font-family: "Cinzel serif"`,
      // which no run's `Cinzel, serif` can ever match — so bind the primary token.
      const face: L1FontFace = { family: primaryFamily(f.family), src }
      if (weight !== undefined) face.weight = weight
      out.push(face)
    }
  }
  return out
}

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
  const l1 = foldToL1(multiState, { fonts: fontResourcesFromTheme(result.capture.theme.fonts) })
  writeL1(location.bundleDir, l1)
  const hints = await captureStructuralHints(url, {
    driverFactory: opts.driverFactory,
  })
  writeHints(location.bundleDir, hints)

  return { ...location, capture: result.capture, multiState, l1, hints }
}
