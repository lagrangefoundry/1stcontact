import type { Root } from '../store'
import type { R2Client } from './r2'

/**
 * The per-site deploy manifest (REQ-110) — the index of what is published for a
 * slug and which revision is live.
 *
 * It is deliberately *not* `history.json`. A draft deploy produces an immutable,
 * garbage-collectable **preview snapshot** that never mints a revision number,
 * which preserves DOC-12's mutable-draft / immutable-revision split: previews
 * can be shared freely without polluting publish history.
 */

/** A published revision, shipped from `revisions/NNNN/` by `--channel published`. */
export interface ManifestRevision {
  id: number
  publishedAt: string
  message: string
  /** Content-addressed id of the snapshot's bytes (audit, not addressing). */
  sha: string
}

/** A shareable draft snapshot. Addressed by `sha`; never a revision. */
export interface ManifestPreview {
  sha: string
  createdAt: string
  /** The revision the draft descended from when deployed, or null. */
  basedOn: number | null
}

export interface SiteManifest {
  slug: string
  /** Revision id currently served as the site's published output, or null. */
  live: number | null
  revisions: ManifestRevision[]
  previews: ManifestPreview[]
}

/**
 * The manifest object key for `slug` under `root`.
 *
 * Keyed by root, not by slug alone (BUG-31). The local store separates real
 * sites (`storage/sites/`) from throwaway scratch (`storage/sandbox/`, gitignored
 * — DOC-12 §3.1); flattening that distinction in R2 let a sandbox deploy read,
 * rewrite, and overwrite a real site's manifest and published bytes whenever the
 * two shared a slug. The root is part of the address on both sides.
 */
export function manifestKey(root: Root, slug: string): string {
  return `${root}/${slug}/manifest.json`
}

export function emptyManifest(slug: string): SiteManifest {
  return { slug, live: null, revisions: [], previews: [] }
}

export function serializeManifest(manifest: SiteManifest): string {
  return JSON.stringify(manifest, null, 2) + '\n'
}

/** A manifest plus the exact bytes it was read from (`null` when it did not exist). */
export interface ManifestRead {
  manifest: SiteManifest
  raw: string | null
}

export async function readManifest(
  client: R2Client,
  root: Root,
  slug: string,
): Promise<ManifestRead> {
  const raw = await client.get(manifestKey(root, slug))
  if (raw === null) return { manifest: emptyManifest(slug), raw: null }
  const manifest = JSON.parse(raw) as SiteManifest
  return {
    manifest: {
      slug: manifest.slug ?? slug,
      live: manifest.live ?? null,
      revisions: manifest.revisions ?? [],
      previews: manifest.previews ?? [],
    },
    raw,
  }
}

/** Raised when the manifest changed between the read and the write. */
export class ManifestConflictError extends Error {
  constructor(public slug: string) {
    super(
      `Deploy manifest for '${slug}' changed while this deploy was uploading — ` +
        `another deploy is in flight. Nothing was written; re-run \`1c deploy ${slug}\`.`,
    )
    this.name = 'ManifestConflictError'
  }
}

/**
 * Read-modify-write the manifest, refusing to clobber a concurrent update.
 *
 * The intended mechanism is R2's conditional write (`onlyIf` etag), which the
 * `wrangler r2 object` CLI does not expose — so the check is a re-read compared
 * against the bytes the caller started from. That is a narrower window than a
 * true compare-and-swap, not a closed one; it is the honest maximum of the
 * chosen upload mechanism, and it keeps the property that matters: a lost update
 * fails loudly instead of silently clobbering. One operator today, and the D1
 * phase removes the concern entirely.
 */
export async function writeManifest(
  client: R2Client,
  root: Root,
  slug: string,
  manifest: SiteManifest,
  expectedRaw: string | null,
): Promise<void> {
  const current = await client.get(manifestKey(root, slug))
  if (current !== expectedRaw) throw new ManifestConflictError(slug)
  await client.putText(manifestKey(root, slug), serializeManifest(manifest), 'application/json')
}
