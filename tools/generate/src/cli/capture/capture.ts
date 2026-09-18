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
import { readCapture, writeBundle, writeForms, writeHints, writeL1, writeLadderScreenshots, writeMultiState } from './bundle'
import { bundleNameFor, type ReferenceStore } from '../../store/reference-store'
import { foldToL1 } from '../../l1/fold'
import type { FoldedForm } from '../../l1/forms'
import { fontResourcesFromTheme, primaryFamily } from './theme'
import type { StructuralHints } from './hints'
import type { BrowserDriverFactory, Capture, RenderEngine, ThemeFont } from './types'
import type { MultiStateCapture } from './values-diff'

// REQ-90's `fontResourcesFromTheme` MOVED to `./theme`, and is re-exported here
// so no caller had to move with it.
//
// WHY IT WENT. It is a pure ThemeFont[] → L1FontFace[] mapping, but this module
// imports `./pipeline` and so drags Playwright into any graph that touches it.
// BUG-113 needs the same fold `1c refold` performs — fonts included — from
// `gate-core.ts`, which is deliberately Playwright-free. `./theme` is pure and
// already owns `primaryFamily`, the normaliser this joins on.
export { fontResourcesFromTheme } from './theme'

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

/**
 * One stored capture, as {@link cmdCaptureList} reports it.
 *
 * NO DIRECTORY FIELD. A path is the filesystem adapter's to hand out, not this
 * module's — see the note on {@link cmdCaptureList}. The CLI composes `dir`
 * from `bundleDir(cwd, name)` on the way out, which is the same thing it
 * already does for `capture page --json`.
 */
export interface StoredCapture {
  /** `<host>/<pathSlug>` — the bundle's name, and its `--ref` path's tail. */
  name: string
  /** The URL that was captured, as the capture itself recorded it. */
  url: string
  /** ISO timestamp from `capture.json`, so a caller can show the freshest first. */
  capturedAt: string
}

/**
 * The captures a store already holds (REQ-254, requirement 32).
 *
 * TAKES A STORE, CONSTRUCTS NOTHING — the shape {@link cmdCapturePage} follows
 * and for the identical reason. `fs-reference-store.ts` is the only module in
 * this port's world that imports `node:fs`, and it is the CLI that reaches for
 * it, because the CLI is the thing that knows it is on a laptop. Building a
 * filesystem adapter here would put `node:fs` into the capture pipeline's
 * import graph and undo the REQ-155 seam — this function would be a very small
 * reason to lose a boundary the whole module is arranged around.
 *
 * WHY THE ENGINE ANSWERS THIS AT ALL. The naming rule — a bundle is named after
 * the host that ANSWERED, not the one that was typed — is this module's. A
 * caller that reconstructed it would be a second definition, and would still be
 * unable to answer the question that matters: whether the address someone typed
 * has a bundle behind it under a *different* host than they typed.
 *
 * A bundle whose `capture.json` is missing or unreadable is SKIPPED rather than
 * reported with empty fields or thrown over. A capture is a sequence of writes
 * and is not atomic (see `fs-reference-store.ts`), so a half-written bundle from
 * an interrupted run really does sit in this tree; it is not something to offer
 * a caller as reusable, and it is not a reason to refuse to list its neighbours.
 */
export async function cmdCaptureList(store: ReferenceStore): Promise<StoredCapture[]> {
  const names = await store.list()
  const found: StoredCapture[] = []
  for (const name of names) {
    const capture = await readCapture(store.bundle(name)).catch(() => null)
    if (!capture) continue
    found.push({ name, url: capture.url, capturedAt: capture.capturedAt })
  }
  // Freshest first: the capture someone wants back is overwhelmingly the one
  // they were last working on.
  return found.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
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
  // THE HOST THAT ANSWERED, NOT THE ONE THAT WAS TYPED (BUG-67 B5).
  //
  // The pipeline may have corrected the hostname — `www.example.com` typed for
  // a site that only serves its apex, or the reverse. That correction has to
  // carry, because a capture is FOUR navigation passes and only the first ran
  // inside the pipeline: leaving the other three on `url` would have the ladder,
  // the screenshots and the hints all still asking for the name that had nothing
  // behind it, and a bundle assembled half from one host and half from failures.
  const captured = result.capture.url
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
  const multiState = await runMultiStateCapture(captured, {
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
  const ladderShots = await captureLadderScreenshots(captured, { driverFactory: opts.driverFactory })
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
  const hints = await captureStructuralHints(captured, {
    driverFactory: opts.driverFactory,
  })
  await writeHints(bundle, hints)

  return { name: bundle.name, capture: result.capture, multiState, l1, hints }
}
