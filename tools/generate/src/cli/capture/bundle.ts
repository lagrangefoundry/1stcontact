/**
 * Bundle I/O (DOC-13 §4). A capture is written to a gitignored, fully
 * self-contained directory:
 *
 *   storage/references/<host>/<path>/
 *     capture.json         structured essence — the AI's primary input
 *     screenshot.full.png  the AI's eyes
 *     rendered.html        post-JS DOM — the AI's escape hatch
 *     raw.html             original server response
 *     assets/              every mirrored subresource
 *
 * Self-containment is what makes offline re-extraction possible (DOC-13 §9).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { L1Document } from '@1stcontact/site-schema'
import type { MultiStateCapture } from './values-diff'
import type { LadderScreenshot } from './pipeline'
import type { StructuralHints } from './hints'
import type { Capture, CaptureResult } from './types'

export interface BundleLocation {
  bundleDir: string
  capturePath: string
}

/** Turn a URL path into a single safe directory segment. */
function pathSlug(urlPath: string): string {
  const trimmed = urlPath.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return 'index'
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_')
}

/** `storage/references/<host>/<path>/` under the working directory (DOC-13 §4). */
export function bundleDirFor(cwd: string, capture: Pick<Capture, 'host' | 'path'>): string {
  return path.join(cwd, 'storage', 'references', capture.host, pathSlug(capture.path))
}

export function writeBundle(result: CaptureResult, cwd: string): BundleLocation {
  const bundleDir = bundleDirFor(cwd, result.capture)
  mkdirSync(path.join(bundleDir, 'assets'), { recursive: true })

  const capturePath = path.join(bundleDir, 'capture.json')
  writeFileSync(capturePath, JSON.stringify(result.capture, null, 2))
  writeFileSync(path.join(bundleDir, 'screenshot.full.png'), result.screenshot)
  writeFileSync(path.join(bundleDir, 'rendered.html'), result.renderedHtml)
  writeFileSync(path.join(bundleDir, 'raw.html'), result.rawHtml)
  for (const [rel, bytes] of result.assetBytes) {
    const dest = path.join(bundleDir, rel)
    mkdirSync(path.dirname(dest), { recursive: true })
    writeFileSync(dest, bytes)
  }
  return { bundleDir, capturePath }
}

/** Read a bundle's `capture.json` back into a {@link Capture}. */
export function readCapture(bundleDir: string): Capture {
  return JSON.parse(readFileSync(path.join(bundleDir, 'capture.json'), 'utf8')) as Capture
}

/** The multi-state projection matrix filename within a bundle (REQ-48). */
const MULTISTATE_FILE = 'multistate.json'

/**
 * REQ-48 (items 1, 5, 6, 10) — persist the multi-state projection matrix
 * (`engine × viewport × interaction-state`) alongside `capture.json`. This is the
 * artifact {@link diffMultiState} pairs against; writing it into the bundle keeps
 * the re-capture discipline (item 10) — when the schema grows, re-capturing
 * refreshes every cell rather than leaving new fields comparing null↔null.
 */
export function writeMultiState(bundleDir: string, matrix: MultiStateCapture): string {
  mkdirSync(bundleDir, { recursive: true })
  const dest = path.join(bundleDir, MULTISTATE_FILE)
  writeFileSync(dest, JSON.stringify(matrix, null, 2))
  return dest
}

/** Read a bundle's `multistate.json`, or null when the bundle predates multi-state capture. */
export function readMultiState(bundleDir: string): MultiStateCapture | null {
  const src = path.join(bundleDir, MULTISTATE_FILE)
  if (!existsSync(src)) return null
  return JSON.parse(readFileSync(src, 'utf8')) as MultiStateCapture
}

/** REQ-83 — the folded L1 document filename within a bundle. */
const L1_FILE = 'l1.json'
/** REQ-83 — the advisory structural-hint sidecar filename within a bundle. */
const HINTS_FILE = 'hints.json'

/**
 * REQ-83 — persist the folded L1 document alongside `capture.json`. The
 * multi-viewport capture (`multistate.json`) is retained as the acceptance
 * oracle; this is the single-document fold the reproduction flow renders and
 * gates against it.
 */
export function writeL1(bundleDir: string, doc: L1Document): string {
  mkdirSync(bundleDir, { recursive: true })
  const dest = path.join(bundleDir, L1_FILE)
  writeFileSync(dest, JSON.stringify(doc, null, 2))
  return dest
}

/** Read a bundle's `l1.json`, or null when the bundle predates the fold. */
export function readL1(bundleDir: string): L1Document | null {
  const src = path.join(bundleDir, L1_FILE)
  if (!existsSync(src)) return null
  return JSON.parse(readFileSync(src, 'utf8')) as L1Document
}

/** REQ-83 — persist the advisory structural-hint sidecar alongside `capture.json`. */
export function writeHints(bundleDir: string, hints: StructuralHints): string {
  mkdirSync(bundleDir, { recursive: true })
  const dest = path.join(bundleDir, HINTS_FILE)
  writeFileSync(dest, JSON.stringify(hints, null, 2))
  return dest
}

/** Read a bundle's `hints.json`, or null when the bundle predates the hint pass. */
export function readHints(bundleDir: string): StructuralHints | null {
  const src = path.join(bundleDir, HINTS_FILE)
  if (!existsSync(src)) return null
  return JSON.parse(readFileSync(src, 'utf8')) as StructuralHints
}

/** REQ-61 — the per-width reference screenshot filename (`screenshot-<width>.png`). */
export function ladderScreenshotPath(bundleDir: string, width: number): string {
  return path.join(bundleDir, `screenshot-${width}.png`)
}

/**
 * REQ-61 — persist one full-page reference screenshot per viewport width, so
 * `1c diff --size` has a same-width reference to compare our reproduction against.
 * These sit beside `screenshot.full.png` (the default desktop shot) as sibling
 * PNGs; the JSON matrix stays byte-free.
 */
export function writeLadderScreenshots(bundleDir: string, shots: readonly LadderScreenshot[]): string[] {
  mkdirSync(bundleDir, { recursive: true })
  return shots.map((shot) => {
    const dest = ladderScreenshotPath(bundleDir, shot.viewport.width)
    writeFileSync(dest, shot.bytes)
    return dest
  })
}

/**
 * REQ-61 — resolve the reference screenshot for a viewport width: the per-width
 * `screenshot-<width>.png` when the bundle carries one, else null. The caller
 * decides how to handle a miss (a size-aware pixel diff must fail loudly rather
 * than silently compare against the desktop shot).
 */
export function readLadderScreenshotPath(bundleDir: string, width: number): string | null {
  const src = ladderScreenshotPath(bundleDir, width)
  return existsSync(src) ? src : null
}
