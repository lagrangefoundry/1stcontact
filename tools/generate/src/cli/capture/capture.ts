/**
 * `1c capture page <url>` orchestrator ([[DOC-13]]). Runs the rendered-only
 * capture pipeline and writes the self-contained bundle into whichever
 * {@link ReferenceStore} it was handed — the operator's `storage/references/`
 * tree, or R2 (REQ-155).
 *
 * THE STORE IS INJECTED AND HAS NO DEFAULT. A `store ?? fsReferenceStore(cwd)`
 * fallback would put `node:fs` back in this module's import graph, which is
 * exactly what REQ-155 removes; the CLI constructs the filesystem adapter
 * because the CLI is the thing that knows it is on a laptop. This is the same
 * inject-or-fail rule `driverFactory` needs for the same reason, and applying
 * one of them without the other would leave the seam half-cut.
 */
import type { L1Document, L1FontFace } from '@1stcontact/site-schema'
import { captureLadderScreenshots, captureStructuralHints, runCapturePipeline, runMultiStateCapture } from './pipeline'
import { writeBundle, writeForms, writeHints, writeL1, writeLadderScreenshots, writeMultiState } from './bundle'
import { bundleNameFor, type ReferenceStore } from '../../store/reference-store'
import { foldToL1 } from '../../l1/fold'
import type { FoldedForm } from '../../l1/forms'
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
export function fontResourcesFromTheme(fonts: ThemeFont[]): L1FontFace[] {
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
  /** Injectable driver factory (tests supply a fake); defaults to Playwright. */
  driverFactory?: BrowserDriverFactory
  /** Extra navigation attempts on browser failure. */
  retries?: number
  /** Engine-availability probe passthrough for the multi-viewport pass (tests inject a stub). */
  isEngineAvailable?: (engine: RenderEngine) => Promise<boolean>
  /**
   * Per-engine driver factory for the multi-viewport pass (REQ-157).
   *
   * Defaults to {@link driverFactory} for every engine, which is what a single
   * injected driver has always meant here. It exists as its own seam so the Node
   * barrel can supply Playwright's real per-engine factory without this module
   * importing one — see `capture/index.ts`.
   */
  driverFactoryFor?: (engine: RenderEngine) => BrowserDriverFactory
}

export interface CapturePageResult {
  /** What the bundle is called in the store it landed in ({@link bundleNameFor}). */
  name: string
  capture: Capture
  /** REQ-58 (T2) — the reference projected across the viewport ladder, persisted as `multistate.json`. */
  multiState: MultiStateCapture
  /** REQ-83 — the multi-viewport capture folded into one L1 document (`l1.json`). */
  l1: L1Document
  /** REQ-83 — the advisory structural-hint sidecar (`hints.json`). */
  hints: StructuralHints
}

export async function cmdCapturePage(
  url: string,
  store: ReferenceStore,
  opts: CapturePageOptions = {},
): Promise<CapturePageResult> {
  const result = await runCapturePipeline(url, {
    driverFactory: opts.driverFactory,
    retries: opts.retries,
  })
  // The name comes from the captured URL, not from anywhere the caller chose —
  // see `bundleNameFor`. Both adapters therefore agree on what this bundle is
  // called, which is what lets a cloud capture and a laptop capture of the same
  // URL be compared member for member (REQ-155 AC3).
  const bundle = store.bundle(bundleNameFor(result.capture))
  await writeBundle(bundle, result)

  // REQ-58 (T2) — a reference is only complete if it spans the viewport ladder: a
  // %-vs-fixed reflow (a wordmark that drifts on resize) is invisible at a single
  // width. Project the reference across RESPONSIVE_VIEWPORTS at rest and persist it
  // so `values-diff --multi-viewport` has a per-width reference to pair against.
  const multiState = await runMultiStateCapture(url, {
    states: ['rest'],
    driverFactoryFor:
      opts.driverFactoryFor ?? (opts.driverFactory ? () => opts.driverFactory! : undefined),
    // AN INJECTED DRIVER IS ITSELF THE AVAILABILITY ANSWER (REQ-157). The probe
    // exists to ask whether a real engine can launch here, which is a question
    // about Playwright; a caller that supplied its own factory — a fake in a
    // test, a leased Browser Rendering session in a Worker — has already
    // answered it, and running the probe would have it answer "no" on a machine
    // with no Playwright and silently skip the ladder.
    isEngineAvailable:
      opts.isEngineAvailable ?? (opts.driverFactory ? async () => true : undefined),
  })
  await writeMultiState(bundle, multiState)

  // REQ-61 — the image sibling of the ladder: a full-page reference screenshot at
  // each width, so `1c diff --size` compares our reproduction against a same-width
  // reference rather than the single desktop shot.
  const ladderShots = await captureLadderScreenshots(url, { driverFactory: opts.driverFactory })
  await writeLadderScreenshots(bundle, ladderShots)

  // REQ-83 — fold the retained ladder into ONE L1 document (the reproduction
  // artifact), and read the advisory structural hints. `multistate.json` stays as
  // the acceptance oracle the folded doc renders and gates against.
  //
  // REQ-93 — the same fold recovers the page's behaviours: each captured form
  // becomes a `slot` seam in the document plus a binding written beside it, so
  // the two artifacts always agree about which seams exist.
  const forms: FoldedForm[] = []
  const l1 = foldToL1(multiState, {
    fonts: fontResourcesFromTheme(result.capture.theme.fonts),
    forms,
  })
  await writeL1(bundle, l1)
  await writeForms(bundle, forms)
  const hints = await captureStructuralHints(url, {
    driverFactory: opts.driverFactory,
  })
  await writeHints(bundle, hints)

  return { name: bundle.name, capture: result.capture, multiState, l1, hints }
}
