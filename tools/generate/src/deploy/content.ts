import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { listFilesRel } from '../store'

/**
 * The content-addressed snapshot id (REQ-110).
 *
 * A deployed snapshot is named by its contents, not by a counter or a clock, so
 * redeploying identical bytes is a no-op that returns the same URL and changed
 * bytes always land beside — never on top of — what came before.
 *
 * Accepted v1 trade-off: a content-derived id is *theoretically* computable by
 * anyone who can reproduce the exact rendered bytes. Impractical in practice,
 * and preview URLs are unguessable-private by deliberate decision (real ACLs
 * arrive with login). If it ever matters the fix is a random token in the
 * manifest pointing at the content-addressed key — no layout change.
 */

/** Hex characters of the tree digest kept as the snapshot id (48 bits). */
export const SNAPSHOT_ID_LENGTH = 12

/** One file in a snapshot: where it lives now, and where it lives in the snapshot. */
export interface SnapshotFile {
  /** Path within the snapshot, e.g. `out/index.html` or `source/site.json`. */
  rel: string
  /** Absolute path on disk. */
  abs: string
  /** Size in bytes. */
  bytes: number
}

/**
 * Every file of a deployable snapshot: the rendered artifact under `out/` and
 * the DOC-12 definition it was rendered from under `source/`.
 *
 * `source/` travels with `out/` so what lands in R2 is a *complete* DOC-12
 * revision rather than only its render — which makes the eventual D1 migration
 * an import from R2 instead of a re-derivation from someone's laptop.
 */
export function collectSnapshotFiles(outDir: string, sourceDir: string): SnapshotFile[] {
  const files: SnapshotFile[] = []
  for (const [prefix, dir] of [
    ['out', outDir],
    ['source', sourceDir],
  ] as const) {
    for (const rel of listFilesRel(dir)) {
      const abs = path.join(dir, ...rel.split('/'))
      files.push({ rel: `${prefix}/${rel}`, abs, bytes: statSync(abs).size })
    }
  }
  return files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))
}

/**
 * SHA-256 over a canonical listing of `(relative path, file sha256)` pairs
 * sorted by path, truncated to {@link SNAPSHOT_ID_LENGTH} hex characters.
 *
 * Hashing the *listing* rather than the concatenated bytes means a rename is a
 * change (as it must be — it moves a URL) and file order can never perturb the
 * id.
 */
export function snapshotSha(files: readonly SnapshotFile[]): string {
  const listing = [...files]
    .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))
    .map((f) => `${f.rel}\0${createHash('sha256').update(readFileSync(f.abs)).digest('hex')}\n`)
    .join('')
  return createHash('sha256').update(listing, 'utf8').digest('hex').slice(0, SNAPSHOT_ID_LENGTH)
}

/**
 * The first path segment inside a served site that belongs to the preview
 * channel: `/site/<slug>/draft/<sha>/…` (REQ-111).
 *
 * A published snapshot containing a top-level entry of this name would be
 * addressed at `/site/<slug>/draft/…` and shadowed by the preview route.
 */
export const RESERVED_SNAPSHOT_SEGMENT = 'draft'

/**
 * Refuse a snapshot whose rendered output would collide with the preview route.
 *
 * Checked at deploy time rather than trusted to convention, so the collision is
 * impossible rather than merely unlikely — and so it is caught by the operator
 * who caused it, not by a visitor who cannot see why a page vanished.
 */
export function assertNoReservedSegment(files: readonly SnapshotFile[]): void {
  const clash = files.find(
    (f) => f.rel.startsWith('out/') && f.rel.slice('out/'.length).split('/')[0] === RESERVED_SNAPSHOT_SEGMENT,
  )
  if (clash === undefined) return
  throw new Error(
    `Snapshot contains a top-level '${RESERVED_SNAPSHOT_SEGMENT}' entry (${clash.rel}).\n` +
      `'${RESERVED_SNAPSHOT_SEGMENT}' is reserved: it is the first path segment of the ` +
      `preview channel (/site/<slug>/${RESERVED_SNAPSHOT_SEGMENT}/<sha>/), so a published ` +
      'entry of that name would be unreachable. Rename it.',
  )
}

/** Total bytes across `files`, rendered as a short human string (`2.7 MB`). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
