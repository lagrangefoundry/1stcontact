import type { AssetRef, StoredPage } from './site-store'

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
 * IT CARRIES ASSET IDENTITIES RATHER THAN ASSET BYTES ([[REQ-304]]). It used to
 * carry the bytes, on the argument that *"a revision is immutable and an
 * immutable thing that points at a mutable one is not immutable"* — which is
 * correct about the danger and wrong about the remedy. What made the draft's
 * `logo.svg` unsafe to point at was that its NAME was the address, and a name
 * can be made to mean different bytes tomorrow. A content digest cannot: it
 * names one set of bytes for as long as the digest exists. So a snapshot points
 * at immutable things by pointing at what they ARE, and a whole site's
 * definition costs a listing rather than a site.
 */
export interface StoredSnapshot {
  siteJson: Record<string, unknown> | null
  pages: StoredPage[]
  assets: AssetRef[]
}

/**
 * Everything a publish freezes: the definition, and the bytes it rendered to.
 *
 * The two travel together because they are one act. A revision whose `source`
 * landed and whose `out` did not is a revision that lists in the history and
 * serves nothing, which is worse than a publish that failed outright.
 *
 * `out` holds only the RENDERED text (`index.html`, `theme.css`, a page per
 * slug). Assets are not repeated here: `source.assets` names them by content
 * ([[REQ-304]]) and the store resolves each digest against bytes it already
 * holds, so freezing a revision whose pictures are unchanged moves none of them.
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

/**
 * Flatten a snapshot to `path → comparable content`, using the same relative
 * paths DOC-12 §4 names: `site.json`, `pages/<name>`, `assets/<name>`.
 *
 * The paths are the store's own keys, not a filesystem's. That they read like a
 * directory listing is what keeps a change list legible to an operator who knows
 * the file-backed layout — and it is the same listing whichever adapter produced
 * it, which is the point.
 *
 * AN ASSET'S COMPARABLE CONTENT IS ITS DIGEST ([[REQ-304]]). It used to be
 * `byteKey(bytes)` — the whole picture as a JavaScript string, one character per
 * byte — which answered the same question at fifty million times the cost and is
 * why a 50 MB site could not be published or even described. The property that
 * matters is unchanged and is the reason a digest is the right substitute: two
 * assets compare equal exactly when their bytes are identical, so an asset whose
 * content changed while its name and size stayed the same is still reported as
 * modified.
 */
export function snapshotEntries(snapshot: StoredSnapshot): Map<string, string> {
  const entries = new Map<string, string>()
  if (snapshot.siteJson !== null) entries.set('site.json', canonicalJson(snapshot.siteJson))
  for (const { name, page } of snapshot.pages) entries.set(`pages/${name}`, canonicalJson(page))
  for (const { name, digest } of snapshot.assets) entries.set(`assets/${name}`, digest)
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
 *
 * IT READS NO ASSET BYTES ([[REQ-304]]). The listing an asset contributes is its
 * content DIGEST, so the string hashed here is bounded by the number of files a
 * site has rather than by how large they are. It used to be the concatenation of
 * every picture on the site as text, put through `TextEncoder` — which doubles
 * every byte ≥ 0x80 on the way — and was the single largest allocation a publish
 * made.
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
 *
 * `manifested` IS THE ONE THING [[REQ-304]] ADDED, AND IT IS A FACT ABOUT THE
 * STORED REVISION RATHER THAN A MODE. A revision frozen before content
 * addressing recorded a `sha` over the old listing, in which an asset
 * contributed its whole content as a latin-1 string; only `byteKey` could
 * reproduce that, and `byteKey` is what this ticket retires. So such a revision
 * is read back UNVERIFIED rather than refused — the same reading `fs-store`
 * already takes for a revision with no log entry at all, and the only one the
 * absence of a digest record can support. Refusing instead would fail a restore
 * on data that is in fact intact, which is the worse of the two errors by a long
 * way.
 *
 * AN ASSET-LESS REVISION IS UNAFFECTED EITHER WAY, which is why the carve-out is
 * narrower than it first reads. With no assets the two listings are identical
 * character for character, so every such revision — however old — still
 * verifies, and the integrity guarantee holds for all of them.
 */
export async function verifiedSnapshot(
  site: string,
  id: number,
  expected: string,
  snapshot: StoredSnapshot,
  manifested: boolean,
): Promise<StoredSnapshot> {
  if (!manifested && snapshot.assets.length > 0) return snapshot
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
 * Where one asset's bytes live: `sites/<siteId>/blob/<digest>` ([[REQ-304]]).
 *
 * ONE OBJECT PER CONTENT, PER SITE, FOR EVER. The draft points at it, every
 * revision that froze that content points at it, and the served site reads it —
 * so publishing a site whose pictures are unchanged moves no picture, and a
 * checkout of a year-old revision costs a pointer rather than a copy. The key
 * used to be the asset's NAME under a mutable draft prefix and again under every
 * revision's prefix, which is why a publish wrote every photograph twice and a
 * site's storage grew with its publish count rather than with its content.
 *
 * IMMUTABLE BY CONSTRUCTION, WHICH IS WHAT MAKES THE SHARING SAFE. The key is
 * the content, so a `put` can only ever write what is already there; replacing a
 * draft asset writes a NEW blob and leaves the old one addressing exactly the
 * bytes the revisions that named it were frozen with.
 *
 * UNDER THE SITE'S OWN ROOT, so erasure ([[DOC-37]]) reaches it: `forget()`
 * already deletes everything under `sites/<siteId>/`, which is why blobs are
 * placed there rather than in a bucket-wide content space that no site's
 * teardown could sweep.
 *
 * NEVER DELETED SHORT OF THAT. A blob no draft names may still be the content of
 * a published revision, and nothing here can know which — so a replaced asset
 * leaves its old blob behind. That is storage spent to keep history restorable,
 * and reclaiming it is a sweep over live revisions that belongs with the rest of
 * retention policy rather than in a store verb.
 */
export function blobKey(siteId: string, digest: string): string {
  return `${PUBLISHED_ROOT}/${siteId}/blob/${digest}`
}

/**
 * Where a revision's ASSET MANIFEST lives ([[REQ-304]]).
 *
 * `name → { digest, size }`, and it is what replaces the copy of every asset
 * that used to sit under a revision's `source/assets/`. It is part of the frozen
 * DEFINITION — which assets the site had, and which content each of them was —
 * and the bytes it names are reached through {@link blobKey}.
 *
 * ITS PRESENCE IS ALSO THE ANSWER TO "was this revision frozen under content
 * addressing?", which is what {@link verifiedSnapshot}'s `manifested` argument
 * carries. That is deliberately a fact about the stored shape rather than a flag
 * somebody had to remember to set: a revision either has a manifest or it does
 * not, and reading what is there cannot drift from what was written.
 *
 * WRITTEN EVEN WHEN A SITE HAS NO ASSETS, so absence means one thing only.
 */
export function publishedAssetManifestKey(siteId: string, id: number): string {
  return `${publishedSourcePrefix(siteId, id)}/assets.json`
}

/** The name an asset manifest takes inside a revision, on any adapter. */
export const ASSET_MANIFEST_NAME = 'assets.json'

/**
 * A revision's asset manifest, as it is written ([[REQ-304]]).
 *
 * A RECORD KEYED BY NAME AND NOT A LIST, because every reader of it is asking
 * the same question — *what content is the asset called `hero.jpg`?* — and a
 * list would make each of them scan. `public-site` asks it once per image
 * request; being able to answer with a property access rather than a search is
 * the difference between a lookup and a loop on the serving path.
 *
 * THE CODEC IS HERE AND NOT IN THE ADAPTERS, for the reason the whole module
 * exists: three stores and one Worker write and read this, and a shape they each
 * spelled for themselves is a shape they can each get subtly wrong.
 */
export interface StoredAssetManifest {
  assets: Record<string, { digest: string; size: number }>
}

/** A manifest's bytes, from the refs it records. Sorted, so it is stable. */
export function encodeAssetManifest(assets: readonly AssetRef[]): string {
  const record: StoredAssetManifest['assets'] = {}
  for (const { name, digest, size } of [...assets].sort((a, b) => (a.name < b.name ? -1 : 1))) {
    record[name] = { digest, size }
  }
  return JSON.stringify({ assets: record }, null, 2)
}

/**
 * The refs a manifest records, sorted by name.
 *
 * TOLERANT OF NOTHING. A manifest that does not parse, or whose entries are not
 * a digest and a length, is not a manifest this store wrote — and answering with
 * a partial listing would produce a revision missing assets nobody asked it to
 * drop. It answers `null`, which every caller reads as "this revision was not
 * frozen with one".
 */
export function decodeAssetManifest(text: string): AssetRef[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  const assets = (parsed as StoredAssetManifest | null)?.assets
  if (assets === null || typeof assets !== 'object') return null
  const refs: AssetRef[] = []
  for (const [name, entry] of Object.entries(assets)) {
    const { digest, size } = (entry ?? {}) as { digest?: unknown; size?: unknown }
    if (typeof digest !== 'string' || typeof size !== 'number') return null
    refs.push({ name, digest, size })
  }
  return refs.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
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
