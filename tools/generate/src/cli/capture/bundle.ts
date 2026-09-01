/**
 * Bundle I/O ([[DOC-13]] §4) — the codec that turns a capture's artifacts into
 * bundle members and back.
 *
 *   <bundle>/
 *     capture.json         structured essence — the AI's primary input
 *     screenshot.full.png  the AI's eyes
 *     screenshot-<w>.png   the persisted viewport ladder (REQ-61)
 *     rendered.html        post-JS DOM — the AI's escape hatch
 *     raw.html             original server response
 *     assets/              every mirrored subresource
 *     multistate.json      the viewport ladder — the acceptance oracle (REQ-48)
 *     l1.json              the ladder folded into one document (REQ-83)
 *     forms.json           the behaviours the fold recovered (REQ-93)
 *     hints.json           the advisory structural sidecar (REQ-83)
 *
 * Self-containment is what makes offline re-extraction possible ([[DOC-13]] §9).
 *
 * NO `node:` IMPORT REMAINS IN THIS FILE, and that is REQ-155's whole point.
 * Every function below takes a {@link ReferenceBundle} where it used to take a
 * `bundleDir` string, so the same codec serves the operator's disk and the
 * Worker's R2 bucket without knowing which it got. `mkdirSync` has no counterpart
 * here because a store has no directories to make: writing `assets/hero.jpg`
 * creates whatever the adapter needs, or nothing, and neither is this module's
 * business.
 *
 * THE SCHEMAS ARE HERE AND THE BYTES ARE THERE. The port is deliberately
 * byte-level, so JSON encoding, the two-space formatting the bundle has always
 * used, and the tolerant "absent member → null/[]" reads all live in this one
 * module. Pushing them into the adapters would give three places for one shape to
 * be, and a bundle written by the laptop and read by the cloud is exactly the
 * case that would break when they drifted.
 */
import type { L1Document } from '@1stcontact/site-schema'
import {
  ASSETS_PREFIX,
  CAPTURE_MEMBER,
  FORMS_MEMBER,
  HINTS_MEMBER,
  L1_MEMBER,
  MULTISTATE_MEMBER,
  RAW_MEMBER,
  RENDERED_MEMBER,
  SCREENSHOT_MEMBER,
  ladderMember,
  type ReferenceBundle,
} from '../../store/reference-store'
import type { MultiStateCapture } from './values-diff'
import type { LadderScreenshot } from './pipeline'
import type { StructuralHints } from './hints'
import type { FoldedForm } from '../../l1/forms'
import type { Capture, CaptureAsset, CaptureResult } from './types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/** The bundle's JSON encoding — two-space, as every member on disk already is. */
function encodeJson(value: unknown): Uint8Array {
  return encoder.encode(JSON.stringify(value, null, 2))
}

/** Read one member and parse it, or `null` when the bundle holds no such member. */
async function readJson<T>(bundle: ReferenceBundle, member: string): Promise<T | null> {
  const bytes = await bundle.read(member)
  if (!bytes) return null
  return JSON.parse(decoder.decode(bytes)) as T
}

/** Where a capture landed. A name in the store — never a filesystem path. */
export interface BundleLocation {
  /** What the bundle is called in the store it was written to. */
  name: string
}

/**
 * Write a capture's core members: the record, the shot, both DOMs, and every
 * mirrored asset.
 *
 * `result.assetBytes` is already keyed by bundle-relative path (`assets/x.png`),
 * which is exactly a member key, so the mirror moves across unchanged.
 */
export async function writeBundle(
  bundle: ReferenceBundle,
  result: CaptureResult,
): Promise<BundleLocation> {
  await bundle.write(CAPTURE_MEMBER, encodeJson(result.capture))
  await bundle.write(SCREENSHOT_MEMBER, result.screenshot)
  await bundle.write(RENDERED_MEMBER, encoder.encode(result.renderedHtml))
  await bundle.write(RAW_MEMBER, encoder.encode(result.rawHtml))
  for (const [member, bytes] of result.assetBytes) await bundle.write(member, bytes)
  return { name: bundle.name }
}

/** Read a bundle's `capture.json` back into a {@link Capture}. */
export async function readCapture(bundle: ReferenceBundle): Promise<Capture> {
  const capture = await readJson<Capture>(bundle, CAPTURE_MEMBER)
  if (!capture) throw new Error(`Bundle '${bundle.name}' has no ${CAPTURE_MEMBER}.`)
  return capture
}

/**
 * BUG-23 — the bundle's origin→mirror asset map, or `[]` when the bundle carries
 * no `capture.json`. Tolerant because the map is only *needed* by a document that
 * actually references remote media: a bundle without it and without remote
 * handles reproduces fine, and one with remote handles fails loudly downstream.
 */
export async function readCaptureAssets(bundle: ReferenceBundle): Promise<CaptureAsset[]> {
  const capture = await readJson<Capture>(bundle, CAPTURE_MEMBER)
  return capture?.assets ?? []
}

/** The mirrored subresource member keys a bundle holds, sorted (REQ-155). */
export async function listAssets(bundle: ReferenceBundle): Promise<string[]> {
  return bundle.list(ASSETS_PREFIX)
}

/**
 * REQ-48 (items 1, 5, 6, 10) — persist the multi-state projection matrix
 * (`engine × viewport × interaction-state`) alongside `capture.json`. This is the
 * artifact `diffMultiState` pairs against; writing it into the bundle keeps the
 * re-capture discipline (item 10) — when the schema grows, re-capturing refreshes
 * every cell rather than leaving new fields comparing null↔null.
 */
export async function writeMultiState(
  bundle: ReferenceBundle,
  matrix: MultiStateCapture,
): Promise<void> {
  await bundle.write(MULTISTATE_MEMBER, encodeJson(matrix))
}

/** Read a bundle's `multistate.json`, or null when the bundle predates multi-state capture. */
export function readMultiState(bundle: ReferenceBundle): Promise<MultiStateCapture | null> {
  return readJson<MultiStateCapture>(bundle, MULTISTATE_MEMBER)
}

/**
 * REQ-83 — persist the folded L1 document alongside `capture.json`. The
 * multi-viewport capture (`multistate.json`) is retained as the acceptance
 * oracle; this is the single-document fold the reproduction flow renders and
 * gates against.
 */
export async function writeL1(bundle: ReferenceBundle, doc: L1Document): Promise<void> {
  await bundle.write(L1_MEMBER, encodeJson(doc))
}

/** Read a bundle's `l1.json`, or null when the bundle predates the fold. */
export function readL1(bundle: ReferenceBundle): Promise<L1Document | null> {
  return readJson<L1Document>(bundle, L1_MEMBER)
}

/**
 * REQ-93 — persist the behavior-module bindings the fold recovered, beside the
 * `l1.json` whose `slot` nodes they mount into.
 *
 * A separate artifact rather than a field on the document, because they are
 * different kinds of fact: `l1.json` is the page body (pure presentation, under
 * the L1 envelope), while these are *behavioural* config for modules the body
 * merely reserves seams for. They are written by the same `foldToL1` call that
 * emits those seams, so the two can never disagree about which slots exist.
 */
export async function writeForms(bundle: ReferenceBundle, forms: FoldedForm[]): Promise<void> {
  await bundle.write(FORMS_MEMBER, encodeJson(forms))
}

/**
 * Read a bundle's `forms.json`, or `[]` when the bundle predates REQ-93 (or its
 * page simply has no behaviours). Empty is the honest answer for both: the L1
 * document then carries no slot to mount into either.
 */
export async function readForms(bundle: ReferenceBundle): Promise<FoldedForm[]> {
  return (await readJson<FoldedForm[]>(bundle, FORMS_MEMBER)) ?? []
}

/** REQ-83 — persist the advisory structural-hint sidecar alongside `capture.json`. */
export async function writeHints(bundle: ReferenceBundle, hints: StructuralHints): Promise<void> {
  await bundle.write(HINTS_MEMBER, encodeJson(hints))
}

/** Read a bundle's `hints.json`, or null when the bundle predates the hint pass. */
export function readHints(bundle: ReferenceBundle): Promise<StructuralHints | null> {
  return readJson<StructuralHints>(bundle, HINTS_MEMBER)
}

/**
 * REQ-61 — persist one full-page reference screenshot per viewport width, so
 * `1c diff --size` has a same-width reference to compare our reproduction
 * against. These sit beside `screenshot.full.png` (the default desktop shot) as
 * sibling PNGs; the JSON matrix stays byte-free.
 */
export async function writeLadderScreenshots(
  bundle: ReferenceBundle,
  shots: readonly LadderScreenshot[],
): Promise<void> {
  for (const shot of shots) await bundle.write(ladderMember(shot.viewport.width), shot.bytes)
}

/**
 * REQ-61 — the reference screenshot for a viewport width: the per-width
 * `screenshot-<width>.png` when the bundle carries one, else null. The caller
 * decides how to handle a miss (a size-aware pixel diff must fail loudly rather
 * than silently compare against the desktop shot).
 *
 * BYTES, NOT A PATH (REQ-155). This used to hand back a filesystem location and
 * feed it straight to the image layer — the "NO PATHS" leak `reference-store.ts`
 * argues against, and the one place this ticket and [[REQ-156]] touch. The path
 * helper still exists where a path is a legitimate thing to have, in the
 * filesystem adapter, and `1c diff` takes it from there.
 */
export function readLadderScreenshot(
  bundle: ReferenceBundle,
  width: number,
): Promise<Uint8Array | null> {
  return bundle.read(ladderMember(width))
}
