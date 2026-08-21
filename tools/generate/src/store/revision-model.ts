import type { StoredAsset, StoredPage } from './site-store'

/**
 * The revision model (REQ-149) — worker-safe, and deliberately so.
 *
 * WHY IT IS ITS OWN MODULE. `history.ts` holds the same vocabulary but reaches
 * `node:fs` to read it, so a Worker that imported it would pull a filesystem
 * into its graph. This is the same split `journal-model.ts` already makes for the
 * change journal: the *arithmetic* of a revision — what a snapshot is, what
 * changed between two of them, which one is live — is a pure function of data,
 * and both adapters have to agree on it exactly. Putting it here means they
 * cannot each grow their own answer.
 *
 * NO STORAGE HERE AND NO I/O. Everything below takes what it needs as an
 * argument and returns a value. `fs-store.ts` and `d1r2-store.ts` supply the
 * bytes; `publish.ts` supplies the sequencing.
 */

/** A whole-snapshot file-change list (DOC-12 §4). */
export interface ChangeSet {
  added: string[]
  modified: string[]
  removed: string[]
}

/** One published revision's metadata. */
export interface RevisionEntry {
  /** Monotonic revision id. Live is always the highest — there is no head pointer. */
  id: number
  /** ISO-8601 timestamp the revision was published. */
  publishedAt: string
  /** Operator-supplied publish message. */
  message: string
  /** Identifier of who published, or null. */
  by: string | null
  /** The revision this one descends from (set when checked out from history). */
  basedOn: number | null
  /** Files changed versus the previous live revision. */
  changes: ChangeSet
  /**
   * Digest of the frozen definition — AUDIT, NOT ADDRESSING.
   *
   * Nothing resolves a revision by it: a revision is named by its id, and the id
   * is what every key and every URL is built from. What it answers is the
   * question a change list cannot — "are these the same bytes?" — across two
   * stores that hold the same definition in different shapes.
   */
  sha: string
}

/**
 * A complete site definition, frozen — the store-level equivalent of DOC-12's
 * `revisions/NNNN/` directory.
 *
 * It carries asset BYTES rather than names, because a revision is immutable and
 * an immutable thing that points at a mutable one is not immutable. The draft's
 * `logo.svg` may be replaced tomorrow; revision 3's copy of it may not.
 */
export interface StoredSnapshot {
  siteJson: Record<string, unknown> | null
  pages: StoredPage[]
  assets: StoredAsset[]
}

/**
 * Everything a publish freezes: the definition, and the bytes it rendered to.
 *
 * The two travel together because they are one act. A revision whose `source`
 * landed and whose `out` did not is a revision that lists in the history and
 * serves nothing, which is worse than a publish that failed outright.
 *
 * `out` holds only the RENDERED text (`index.html`, `theme.css`, a page per
 * slug). Assets are not repeated here — the store copies them across from
 * `source.assets`, exactly as the filesystem writer copies `assets/` through.
 */
export interface RevisionContent {
  source: StoredSnapshot
  /** Rendered artifact, by path within the snapshot's `out/`. */
  out: Map<string, string>
}

/**
 * The live revision id, or null when nothing has been published.
 *
 * DERIVED, NEVER STORED (DOC-12 §4, §10). The highest id IS the live one, so
 * there is no pointer that can disagree with the log it points into — REQ-7
 * dropped a `published_revision_id` column for this reason and REQ-149 declined
 * to reintroduce it as a manifest field.
 */
export function liveRevisionOf(revisions: readonly RevisionEntry[]): number | null {
  if (revisions.length === 0) return null
  return revisions.reduce((max, r) => Math.max(max, r.id), 0)
}

/** The next revision id: one past the highest ever minted. Forward-only. */
export function nextRevisionOf(revisions: readonly RevisionEntry[]): number {
  return (liveRevisionOf(revisions) ?? 0) + 1
}

/**
 * A definition object as a comparable string, with object keys sorted.
 *
 * CANONICAL, not verbatim, and that is a deliberate change from the byte
 * comparison the directory-based diff performed. Two stores hold the same
 * definition in different shapes — a file's bytes on one side, a JSON column
 * round-tripped through `parse`/`stringify` on the other — so comparing what
 * they happen to serialize to would make "did this page change?" depend on which
 * adapter answered. Sorting keys makes the question about the DEFINITION, which
 * is the only thing either store claims to hold, and is what lets AC-6 (same
 * store state from the same publish) be true rather than approximately true.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`)
  return `{${entries.join(',')}}`
}

/** Bytes, as a comparable string. Latin-1 per byte — never decoded as text. */
function byteKey(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i])
  return out
}

/**
 * Flatten a snapshot to `path → comparable content`, using the same relative
 * paths DOC-12 §4 names: `site.json`, `pages/<name>`, `assets/<name>`.
 *
 * The paths are the store's own keys, not a filesystem's. That they read like a
 * directory listing is what keeps a change list legible to an operator who knows
 * the file-backed layout — and it is the same listing whichever adapter produced
 * it, which is the point.
 */
export function snapshotEntries(snapshot: StoredSnapshot): Map<string, string> {
  const entries = new Map<string, string>()
  if (snapshot.siteJson !== null) entries.set('site.json', canonicalJson(snapshot.siteJson))
  for (const { name, page } of snapshot.pages) entries.set(`pages/${name}`, canonicalJson(page))
  for (const { name, bytes } of snapshot.assets) entries.set(`assets/${name}`, byteKey(bytes))
  return entries
}

/**
 * The change list between two snapshots (DOC-12 §4).
 *
 * Pass `prev = null` for the first publish, where every path is `added`. All
 * lists are sorted, so a change set is stable output rather than a reflection of
 * whatever order the store answered in.
 */
export function diffSnapshots(prev: StoredSnapshot | null, next: StoredSnapshot): ChangeSet {
  const before = prev === null ? new Map<string, string>() : snapshotEntries(prev)
  const after = snapshotEntries(next)

  const added: string[] = []
  const modified: string[] = []
  const removed: string[] = []

  for (const [path, content] of after) {
    if (!before.has(path)) added.push(path)
    else if (before.get(path) !== content) modified.push(path)
  }
  for (const path of before.keys()) {
    if (!after.has(path)) removed.push(path)
  }

  return { added: added.sort(), modified: modified.sort(), removed: removed.sort() }
}

/** True when a change set names nothing at all. */
export function isEmptyChangeSet(changes: ChangeSet): boolean {
  return (
    changes.added.length === 0 && changes.modified.length === 0 && changes.removed.length === 0
  )
}

/** Hex characters of the digest kept as a revision's {@link RevisionEntry.sha}. */
export const REVISION_SHA_LENGTH = 12

/**
 * SHA-256 over the canonical `path\0content` listing of a snapshot, truncated.
 *
 * Hashing the LISTING rather than concatenated content means a rename is a
 * change (as it must be — it moves a URL) and iteration order can never perturb
 * the result. `crypto.subtle` rather than `node:crypto`, because this runs in
 * workerd as often as in Node.
 */
export async function snapshotSha(snapshot: StoredSnapshot): Promise<string> {
  const listing = [...snapshotEntries(snapshot)]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, content]) => `${path}\0${content}\n`)
    .join('')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(listing))
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, REVISION_SHA_LENGTH)
}

/** Zero-pad a revision id to its canonical 4-digit form (`1` → `0001`). */
export function padRevision(id: number): string {
  return String(id).padStart(4, '0')
}

/**
 * The R2 root every published revision lives under (REQ-110/REQ-111, BUG-31).
 *
 * ONE CONSTANT, because three parties have to agree on it exactly: the adapter
 * that writes a revision, the Worker that serves one, and any fixture that
 * inspects the bytes. It used to be spelled separately in each, which is a
 * layout that agrees by inspection — and the one thing a key must never do is
 * differ between the writer and the reader.
 *
 * `public-site` resolves this root and no other, so no URL — however crafted —
 * can name a key outside it.
 */
export const PUBLISHED_ROOT = 'sites'

/** The key prefix holding one revision: `sites/<slug>/rev/<NNNN>`. */
export function publishedPrefix(slug: string, id: number): string {
  return `${PUBLISHED_ROOT}/${slug}/rev/${padRevision(id)}`
}

/** Where a revision's RENDERED output lives — what `public-site` serves from. */
export function publishedOutPrefix(slug: string, id: number): string {
  return `${publishedPrefix(slug, id)}/out`
}

/**
 * Where a revision's frozen DEFINITION lives.
 *
 * It travels with the render so what lands in R2 is a complete DOC-12 revision.
 * D1 holds only the mutable draft, so this is the only copy of what the
 * definition looked like at revision N — which is what makes checkout possible.
 */
export function publishedSourcePrefix(slug: string, id: number): string {
  return `${publishedPrefix(slug, id)}/source`
}
