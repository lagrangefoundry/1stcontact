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
 * One asset named and STAMPED, with its bytes left where they are ([[REQ-303]]).
 *
 * WHAT A STAMP IS. An opaque string the store derives from the metadata it
 * already holds about an object — never by reading the object. Two stamps from
 * the SAME store are comparable; nothing compares one across stores, and nothing
 * parses one.
 *
 * WHAT IT PROMISES, AND WHICH DIRECTION. Equal bytes always stamp equal, so a
 * stamp that MOVED is always a change. The converse is only as strong as what
 * the store recorded — which is why the change count is a floor rather than a
 * guess, and why publish's own byte-exact diff is still the authority on what
 * actually goes into a revision.
 *
 * WHAT A STORE CAN PROMISE DEPENDS ON WHAT IT KEEPS. R2 records an etag per
 * object — the MD5 of what was put — so the D1/R2 adapter's stamp changes
 * whenever a byte does. A filesystem records a size and
 * a modification time, and a modification time moves when the bytes do not
 * (a revision's copy is written at publish; the draft's original is older), so
 * that tier stamps with the size alone and two different pictures of exactly
 * equal length read as unchanged UNTIL a publish, whose own diff is byte-exact
 * and is not this. That is the trade [[REQ-303]] names: the count in front of
 * every turn is derived from what the store already knows, and the operation
 * that actually freezes bytes still reads them.
 */
export interface AssetStamp {
  /** The asset's name under `assets/`, e.g. `wordmark.svg`. */
  name: string
  /** Opaque, and comparable only against another stamp from the same store. */
  stamp: string
}

/**
 * A site's shape with its assets STAMPED rather than carried ([[REQ-303]]).
 *
 * THE SAME THREE PATH FAMILIES AS A SNAPSHOT — `site.json`, `pages/<name>`,
 * `assets/<name>` — so {@link diffOutlines} answers in exactly the vocabulary
 * {@link diffSnapshots} answers in and `1c status` reads the same either way.
 * What is missing is the one thing a change COUNT never needed: the bytes.
 *
 * WHY IT IS A SECOND SHAPE AND NOT A FLAG ON THE FIRST. A `StoredSnapshot` is
 * what a revision IS — the thing a checkout restores and a publish freezes —
 * and it is immutable precisely because it carries content. An outline carries
 * evidence about content instead, which is a different promise; expressing both
 * as one type with the bytes sometimes absent would put a test for which kind
 * you were holding into every caller of either.
 */
export interface SiteOutline {
  siteJson: Record<string, unknown> | null
  pages: StoredPage[]
  assets: AssetStamp[]
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
  /**
   * [[REQ-222]] — derived BYTES, by path within the snapshot's `out/`.
   *
   * A SECOND CHANNEL RATHER THAN A WIDER `out`, because these are not text and
   * `out` is. The rendered artifact is HTML and CSS — strings all the way down,
   * written with a charset — and a delivery rendition is a JPEG. Widening `out`
   * to `string | Uint8Array` would put a type test in both adapters' write loops
   * and in every reader, to express something the two maps say by being two maps.
   *
   * THEY DO NOT TRAVEL TO `source/`. A revision's `source/` is the frozen
   * DEFINITION — what a checkout restores — and a delivery rendition is not part
   * of what the site is. Writing them there would mean checking out a revision
   * grew the draft six extra copies of every photograph, each of which would then
   * be diffed, published, and copied again.
   *
   * EMPTY IS THE ORDINARY CASE. A publish with no image ladder (no binding, or a
   * site with no raster pictures) supplies an empty map, and the revision that
   * lands is exactly the revision that landed before this existed.
   */
  derived?: Map<string, Uint8Array>
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

/**
 * The next revision id: one past the highest ever minted. Forward-only.
 *
 * THE ARITHMETIC, NOT THE ANSWER ([[REQ-266]] §2). A publish asks
 * {@link SiteStore.nextRevision} rather than calling this over the log, because in the
 * D1/R2 adapter an id can have been HANDED OUT without a publish having
 * COMPLETED — reserved in `site_revision_claims` before a byte is written, so
 * that two publishes of one site cannot mint the same id and interleave into one
 * prefix. This stays the shared expression of "one past the highest", and the
 * adapters with nothing to reserve answer with exactly it.
 */
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
 * Flatten an outline to `path → comparable content`, using the same relative
 * paths DOC-12 §4 names: `site.json`, `pages/<name>`, `assets/<name>`.
 *
 * The paths are the store's own keys, not a filesystem's. That they read like a
 * directory listing is what keeps a change list legible to an operator who knows
 * the file-backed layout — and it is the same listing whichever adapter produced
 * it, which is the point.
 *
 * THE DEFINITION IS CANONICALISED AND THE ASSET IS NOT ([[REQ-303]]). A page is
 * held as an object by both adapters and has to be compared as one; an asset is
 * held as bytes by both and is compared through whatever evidence of those bytes
 * the store already had. {@link snapshotEntries} is this same listing with the
 * bytes themselves standing in for the evidence.
 */
export function outlineEntries(outline: SiteOutline): Map<string, string> {
  const entries = new Map<string, string>()
  if (outline.siteJson !== null) entries.set('site.json', canonicalJson(outline.siteJson))
  for (const { name, page } of outline.pages) entries.set(`pages/${name}`, canonicalJson(page))
  for (const { name, stamp } of outline.assets) entries.set(`assets/${name}`, stamp)
  return entries
}

/** The same listing over a snapshot, with each asset's own bytes as its stamp. */
export function snapshotEntries(snapshot: StoredSnapshot): Map<string, string> {
  return outlineEntries({
    siteJson: snapshot.siteJson,
    pages: snapshot.pages,
    assets: snapshot.assets.map(({ name, bytes }) => ({ name, stamp: byteKey(bytes) })),
  })
}

/**
 * The change list between two flattened listings (DOC-12 §4).
 *
 * ONE COMPARISON, TWO SHAPES ([[REQ-303]]). A publish diffs snapshots and a
 * change COUNT diffs outlines, and the two have to name added, modified and
 * removed identically or `1c status` would disagree with the publish it is
 * reporting on. The listing is the only thing either comparison ever looked at,
 * so it is the listing they share rather than the reading of it.
 *
 * Pass `before` empty for the first publish, where every path is `added`. All
 * lists are sorted, so a change set is stable output rather than a reflection of
 * whatever order the store answered in.
 */
function diffEntries(before: Map<string, string>, after: Map<string, string>): ChangeSet {
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

/**
 * The change list between two snapshots — what a publish freezes against
 * (DOC-12 §4). Byte-exact on both sides, because that is what a revision is.
 */
export function diffSnapshots(prev: StoredSnapshot | null, next: StoredSnapshot): ChangeSet {
  return diffEntries(prev === null ? new Map() : snapshotEntries(prev), snapshotEntries(next))
}

/**
 * The change list between two outlines — what `1c status`, `describe_site` and
 * the per-turn digest report ([[REQ-303]]).
 *
 * IT NAMES THE SAME PATHS `diffSnapshots` WOULD, and for the definition it gives
 * the same answer: `site.json` and every page are compared on their canonical
 * content either way. Assets are compared on the store's own evidence, so this
 * is the cheaper question and not a different one — see {@link AssetStamp} for
 * what each tier can promise.
 */
export function diffOutlines(prev: SiteOutline | null, next: SiteOutline): ChangeSet {
  return diffEntries(prev === null ? new Map() : outlineEntries(prev), outlineEntries(next))
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

/**
 * A revision whose stored bytes do not match the digest recorded for it
 * ([[REQ-266]] §4).
 *
 * A REFUSAL AND NOT A WARNING. The whole point of freezing a definition is that
 * what comes back is what went in; bytes that disagree with the record are the
 * one case where answering *anything* is worse than answering nothing, because
 * every caller downstream — the page a visitor is served, the checkout that
 * replaces a draft, the form definition a lead is captured against — treats the
 * answer as the published truth. A warning and a returned snapshot would be a
 * restore that restores tampered bytes with a note in a log nobody reads.
 *
 * IT CARRIES BOTH DIGESTS because that is the whole content of the answer: what
 * the log says this revision is, and what the store actually holds.
 */
export class RevisionIntegrityError extends Error {
  readonly name = 'RevisionIntegrityError'
  /** The store's own name for the site — a key in D1, a directory on disk. */
  readonly site: string
  readonly id: number
  /** The digest recorded when the revision was published. */
  readonly expected: string
  /** The digest of what the store holds now. */
  readonly actual: string

  constructor(site: string, id: number, expected: string, actual: string) {
    super(
      `Revision ${id} of '${site}' does not match its recorded digest ` +
        `(expected ${expected}, found ${actual}). Its stored bytes have changed ` +
        `since it was published.`,
    )
    this.site = site
    this.id = id
    this.expected = expected
    this.actual = actual
  }
}

/**
 * A publish refused because the revision id it named is already spoken for
 * ([[REQ-266]] §2, §3).
 *
 * TWO REASONS, ONE ERROR, and the difference is worth reporting rather than
 * flattening. `published` means a completed revision row already holds this id,
 * which is a caller arriving with an id it did not mint. `claimed` means another
 * publish of the same site reserved it first and may be writing into that prefix
 * right now — the race [[EPIC-17]] §5 item 5c proposed a Durable Object for,
 * resolved here at the point where it would do damage.
 *
 * EITHER WAY NOTHING WAS WRITTEN. The refusal happens before the first `put`,
 * which is the property that distinguishes it from the primary key it replaces:
 * that key also refused a duplicate, but only after every byte had already
 * overwritten the revision it collided with.
 */
export class RevisionExistsError extends Error {
  readonly name = 'RevisionExistsError'
  readonly site: string
  readonly id: number
  readonly reason: 'published' | 'claimed'

  constructor(site: string, id: number, reason: 'published' | 'claimed') {
    super(
      reason === 'published'
        ? `Revision ${id} of '${site}' is already published and cannot be rewritten.`
        : `Revision ${id} of '${site}' is already claimed by another publish.`,
    )
    this.site = site
    this.id = id
    this.reason = reason
  }
}

/**
 * The snapshot, or a refusal — one comparison, shared by every adapter
 * ([[REQ-266]] §4).
 *
 * WHY IT IS HERE AND NOT IN EACH `readRevision`. Three adapters answer that verb
 * and all three have to refuse identically, or "a revision is verified" becomes
 * a claim about whichever store you happened to ask. This is the same reason the
 * change list and the digest live in this module rather than in the adapters
 * that produce them: the ARITHMETIC of a revision is a pure function of data,
 * and both stores have to agree on it exactly.
 *
 * NO NEW CANONICALISATION. {@link snapshotSha} is already defined over exactly
 * {@link StoredSnapshot}, which is exactly what `readRevision` returns, so
 * verification is one recomputation and one string comparison. That it needed no
 * new machinery is the strongest evidence the detector was built and simply
 * never wired up.
 */
export async function verifiedSnapshot(
  site: string,
  id: number,
  expected: string,
  snapshot: StoredSnapshot,
): Promise<StoredSnapshot> {
  const actual = await snapshotSha(snapshot)
  if (actual !== expected) throw new RevisionIntegrityError(site, id, expected, actual)
  return snapshot
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

/**
 * The key prefix holding one revision: `sites/<siteId>/rev/<NNNN>`.
 *
 * THE SITE'S KEY, NOT ITS SLUG ([[REQ-190]]). It used to be the slug, which made
 * the published layout a second place the site's *name* was recorded — so
 * renaming a site would have moved every published byte it owned, and moving one
 * to another business meant copying them. It is keyed by the site's own id now,
 * so both are an UPDATE of one column and no object moves.
 *
 * There is no business in the prefix either, and that is the same decision. A
 * business's objects are reached for erasure ([[DOC-37]]) by enumerating that
 * business's site ids from D1 and deleting under each, alongside the prefixes
 * that ARE business-owned — `t/<tenant>/blob/`, `t/<tenant>/ref/`, `kb/<tenant>/`
 * — because blobs and knowledge belong to the business rather than to a site.
 */
export function publishedPrefix(siteId: string, id: number): string {
  return `${PUBLISHED_ROOT}/${siteId}/rev/${padRevision(id)}`
}

/** Where a revision's RENDERED output lives — what `public-site` serves from. */
export function publishedOutPrefix(siteId: string, id: number): string {
  return `${publishedPrefix(siteId, id)}/out`
}

/**
 * Where a revision's frozen DEFINITION lives.
 *
 * It travels with the render so what lands in R2 is a complete DOC-12 revision.
 * D1 holds only the mutable draft, so this is the only copy of what the
 * definition looked like at revision N — which is what makes checkout possible.
 */
export function publishedSourcePrefix(siteId: string, id: number): string {
  return `${publishedPrefix(siteId, id)}/source`
}
