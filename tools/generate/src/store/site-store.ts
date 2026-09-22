import type { LoadResult } from './assemble'
import type { ChangeSlice, JournalRecord } from './journal-model'
import type {
  RenditionSink,
  RevisionContent,
  RevisionEntry,
  SiteOutline,
  StoredSnapshot,
} from './revision-model'

/**
 * The `SiteStore` port (REQ-142): everything the structured-edit surface needs
 * from storage, and nothing that says where storage is.
 *
 * WHY IT EXISTS. DOC-12 §7 says "the Worker reaches storage through a single
 * `SiteStore` accessor; phase 2 swaps only its implementation." That was true of
 * the read path — `preview.ts` had a `DraftStore` — and false of the write path,
 * where `edit.ts` called `writeJson`, `removePath` and `copyFileSync` directly.
 * This is the seam the doc described, now actually present, with reads and
 * writes on the same one rather than a narrow read seam beside raw filesystem
 * writes.
 *
 * NO PATHS. There is deliberately no verb here that hands back a filesystem
 * location. An `asset()` returning an absolute path is not an escape hatch that
 * happens to be convenient — it is the filesystem leaking through the port, and
 * a caller that takes one is a caller the D1/R2 adapter cannot serve. Assets
 * move as bytes. The one string that looks like a path, {@link StoredPage.name},
 * is a *key* (`home.json`): it is what the page is called in the store, it is
 * what a `pages/` directory happens to name a file, and it never carries a
 * directory component.
 *
 * ASYNC, TOTALLY. D1 and R2 are async, so every verb is — including the ones the
 * filesystem could answer synchronously. A port with a fast half and a slow half
 * would be a port callers learn the shape of, and the whole point is that they
 * cannot tell which adapter they got.
 *
 * WHY WRITES ARE ONE VERB. {@link SiteStore.write} takes a whole change — a
 * `site.json`, N pages, page removals, asset bytes — rather than offering a verb
 * per file. Several commands genuinely change more than one thing at once
 * (`palette rename` rewrites `site.json` and every page referencing the entry;
 * `page rm` rewrites the nav and deletes a page), and expressing those as one
 * call is what lets the D1 adapter make them atomic later WITHOUT revisiting a
 * single caller. The filesystem adapter cannot be atomic and does not pretend to
 * be — REQ-142 carries today's atomicity characteristics forward unchanged, and
 * improves them nowhere.
 *
 * REVISIONS ARE PART OF IT NOW (REQ-149). The port covered drafts only, and
 * publish was therefore `commands.ts`'s, filesystem all the way down — which is
 * why the builder's `/api/publish` answered 501 in workerd. The five verbs at the
 * bottom of {@link SiteStore} are the storage a publish needs and nothing more:
 * read the log, freeze a revision, read one back, and move the draft's lineage
 * pointer. THE ALGORITHM IS NOT HERE — `publish.ts` sequences those verbs, once,
 * above whichever adapter it was handed. A `publish()` verb on the port would
 * have put the sequencing inside every adapter and made "one implementation"
 * (REQ-149 AC-6) a thing to maintain rather than a thing that is structurally so.
 *
 * TWO ADAPTERS, BOTH CURRENT. `fsSiteStore` (the operator's local tree, now the
 * reproduction substrate under `storage/sandbox/`, DOC-12 §3.1) and the Worker's
 * D1/R2 one are both live; this is not a legacy mode with a preserved old path. Nothing detects a mode and no
 * caller chooses at runtime — the adapter is injected at construction.
 */

/** One page as the store holds it: its key, and its raw definition. */
export interface StoredPage {
  /**
   * What the page is called in the store, e.g. `home.json`. A key, not a path —
   * it never carries a directory component. Load order is the sort order of
   * these names, which is why they keep their extension.
   */
  name: string
  /** The page definition, exactly as stored — palette refs unresolved. */
  page: Record<string, unknown>
}

/** Bytes to put under the draft's assets, by store name. */
export interface StoredAsset {
  /** The asset's name under `assets/`, e.g. `wordmark.svg`. */
  name: string
  bytes: Uint8Array
}

/**
 * One whole change to a site's draft.
 *
 * Every member is optional and an empty write is legal (it does nothing). What
 * matters is that a command expresses ALL of its change in one of these, so the
 * store is asked to make one transition rather than a sequence a reader has to
 * reassemble.
 */
export interface SiteWrite {
  /** Replace `site.json` in its entirety. */
  siteJson?: Record<string, unknown>
  /** Write these pages, creating or replacing each by name. */
  pages?: StoredPage[]
  /** Remove these pages by name. Removing one that is absent is not an error. */
  removePages?: string[]
  /** Write these asset bytes, creating or replacing each by name. */
  assets?: StoredAsset[]
  /** Remove these assets by name. Removing one that is absent is not an error. */
  removeAssets?: string[]
  /**
   * The site {@link SiteStore.version} this change was computed against
   * (REQ-143). Supply it and the write is a compare-and-set: if the site has
   * moved on since, the write is refused with a {@link StoreConflictError} and
   * nothing lands. Omit it and the write is unconditional.
   *
   * WHY IT IS THE CALLER'S TO SUPPLY. Every interesting command here is a
   * read-modify-write — a palette rename reads `site.json` and every page, then
   * writes both back. The lost update it can suffer is *between* the read and
   * the write, which is a window only the caller can name. A store cannot infer
   * it, because by the time `write` is called the read it should have been
   * checked against has already happened.
   *
   * WHICH ADAPTERS HONOUR IT. The D1 one, where the check and the write are the
   * same `db.batch()` and the guarantee is real. The filesystem adapter cannot —
   * it is a sequence of `writeFileSync` calls with no transaction to attach a
   * condition to — so it ignores this field rather than performing a
   * check-then-write that would *look* like CAS while leaving the race intact. A
   * caller therefore gets a genuine refusal or no refusal at all, never a
   * reassuring one that does not hold.
   */
  expect?: number
}

/**
 * A write refused because the site moved since the writer read it (REQ-143).
 *
 * Typed rather than a bare `Error` so the builder can report it as what it is —
 * "someone else changed this; re-read and try again" — instead of surfacing a
 * database message. It carries both versions because that is the whole content
 * of the answer: what the writer thought it was changing, and what is actually
 * there.
 */
export class StoreConflictError extends Error {
  readonly name = 'StoreConflictError'
  /** The version the writer supplied as {@link SiteWrite.expect}. */
  readonly expected: number
  /** The version the store actually holds. `null` when the site is gone. */
  readonly actual: number | null

  constructor(site: string, expected: number, actual: number | null) {
    super(
      actual === null
        ? `Site '${site}' no longer exists (expected version ${expected}).`
        : `Site '${site}' has moved on: expected version ${expected}, found ${actual}.`,
    )
    this.expected = expected
    this.actual = actual
  }
}

/** A site's current draft, plus a token that changes whenever the draft does. */
export interface DraftSnapshot {
  /**
   * The assembled definition, or the errors that stopped it assembling. Reported
   * rather than thrown because an invalid draft is the AUTHOR'S error and its
   * presentation differs per caller — the preview renders it as a page, a CLI
   * command as an envelope.
   */
  result: LoadResult
  /**
   * Opaque; equal iff the definition is unchanged. Keys the render cache, so a
   * change made outside the builder — `1c copy set`, a hand-edited page — is
   * picked up on the next request rather than needing the server restarted.
   */
  stamp: string
}

/**
 * Storage for one site tree, addressed by whatever the store calls the site.
 *
 * WHAT `site` IS DEPENDS ON THE ADAPTER, and deliberately says so rather than
 * naming one ([[REQ-236]]). In the file-backed tier it is the site's own
 * directory — single-user, local, nothing to collide with. In D1 it
 * is the site's KEY: `sites.slug` is gone, so there is no second name to
 * translate and no lookup to spend undoing one. A caller holds one opaque string
 * either way and cannot tell which adapter it has, which is the whole point of
 * the port.
 */
export interface SiteStore {
  /** True when the site has a draft to operate on. */
  hasDraft(site: string): Promise<boolean>

  /** The raw `site.json` object, or null when the site holds none. */
  readSiteJson(site: string): Promise<Record<string, unknown> | null>

  /** Every page, in load order. Empty when the site has none. */
  readPages(site: string): Promise<StoredPage[]>

  /** Apply one whole change. See {@link SiteWrite} for why it is one verb. */
  write(site: string, change: SiteWrite): Promise<void>

  /** Asset names under the draft's `assets/`, sorted. */
  listAssets(site: string): Promise<string[]>

  /** One asset's bytes, or null when the store holds no such asset. */
  readAsset(site: string, name: string): Promise<Uint8Array | null>

  /** The site's change count. Zero for a site nothing has been written to. */
  counter(site: string): Promise<number>

  /**
   * Record one write and return the count it produced. Never fails a write: a
   * store that cannot take the record returns the counter unmoved.
   */
  appendChange(
    site: string,
    entry: Omit<JournalRecord, 'at' | 'ts'> & { ts?: string },
  ): Promise<number>

  /** Every change after `since`, plus where the counter stands now. */
  changesSince(site: string, since?: number): Promise<ChangeSlice>

  /**
   * Every published revision, oldest first. Empty when nothing is published.
   *
   * THE LOG IS THE WHOLE RECORD. There is no companion "which one is live" verb,
   * because live is the highest id and {@link liveRevisionOf} derives it — a
   * stored pointer is a second place for the same fact to be, and DOC-12 §4
   * refused one for exactly that reason.
   */
  revisions(site: string): Promise<RevisionEntry[]>

  /**
   * The id the NEXT revision of this site will take ([[REQ-266]] §2).
   *
   * A PORT VERB AND NOT `nextRevisionOf(await revisions(site))`, which is what
   * `publish.ts` used to compute. The arithmetic is unchanged — one past the
   * highest ever minted, forward-only — but the set it is computed over is not
   * the log alone any more. The D1/R2 adapter reserves an id in
   * `site_revision_claims` before it writes a byte, so the highest id that has
   * ever been HANDED OUT can exceed the highest id that was ever COMPLETED, and
   * only the adapter holding that table can see the difference. A caller doing
   * the arithmetic itself would hand out an id another publish is already
   * writing into, which is the exact race the claim exists to close.
   *
   * THE ADAPTERS WITH NO CLAIMS ANSWER EXACTLY AS BEFORE. The filesystem and
   * in-memory stores are single-writer by construction — one operator, one
   * process — so `nextRevisionOf` over their own log is the whole answer, and
   * they say so by calling it.
   */
  nextRevision(site: string): Promise<number>

  /**
   * Freeze `content` as the revision `entry` names, and append `entry` to the
   * log — one act, because a revision that lists in the history and serves
   * nothing is worse than a publish that failed outright.
   *
   * The store writes the rendered output AND copies `content.source.assets`
   * alongside it. Callers never name a destination: where a revision's bytes
   * live is the adapter's business, which is what lets one publish service drive
   * a directory tree and an R2 bucket without knowing which it has.
   */
  writeRevision(site: string, entry: RevisionEntry, content: RevisionContent): Promise<void>

  /**
   * Take the revision `id` and open the channel its DERIVED bytes are written
   * through ([[REQ-305]]).
   *
   * WHY THE WRITE IS IN TWO ACTS NOW. Everything a revision freezes is known
   * before it is written except one thing: the delivery renditions, which the
   * image ladder produces by rendering them, and which the *pages* then have to
   * name. So the order is forced — renditions first, pages second, revision
   * last — and a rendition that cannot be written until the last act is a
   * rendition that has to be HELD until then. Thirteen of those per photograph
   * is what killed a photo-heavy publish ([[REQ-305]]); a sink opened first is
   * what lets each one be written and forgotten.
   *
   * IT IS WHERE THE ID IS TAKEN, and that is the second half of why it exists.
   * `nextRevision` is a read, so two publishes of one site can both see the same
   * answer; the adapter that has a claim to make makes it HERE, before a single
   * rendition is written, which is earlier than {@link writeRevision} could make
   * it and is the one ordering in which the loser of that race writes nothing at
   * all ([[REQ-266]] §2).
   *
   * IT IS NOT OPTIONAL AND NOT CONDITIONAL ON A LADDER. A publish calls it
   * whichever adapter it has and whether or not this deployment can build
   * renditions, because the adapters also use it to make the destination ready —
   * and a publish that sometimes prepared and sometimes did not would be two
   * lifecycles wearing one name. A publish with nothing derived to write opens
   * the sink and never calls it.
   *
   * {@link writeRevision} IS THE ACT THAT MAKES THE REVISION EXIST, still, and
   * must follow this. Nothing here appends to the log or writes a definition:
   * until `writeRevision` lands the row, whatever this opened is unreachable
   * bytes rather than a revision anyone can read.
   */
  beginRevision(site: string, id: number): Promise<RenditionSink>

  /** A revision's frozen definition, or null when the store holds no such revision. */
  readRevision(site: string, id: number): Promise<StoredSnapshot | null>

  /**
   * The DRAFT's shape with its assets stamped rather than read ([[REQ-303]]).
   *
   * WHY THE PORT ANSWERS THIS AND NOT THE CALLER. "How many files differ from
   * what is published?" used to be answered by reading the whole site twice —
   * every draft asset's bytes and every published asset's bytes — to produce a
   * number. On a fifty-megabyte site in a 128 MB Workers isolate that is fatal,
   * and it ran before every model call. Only the adapter knows what it already
   * holds that stands in for content (an etag R2 recorded at `put`, a size a
   * directory entry carries), so only the adapter can answer the question
   * without opening anything.
   *
   * THE COST IS FLAT IN ASSET BYTES. A site with fifty megabytes of pictures
   * answers this in the same memory as a site with none — which is the whole
   * requirement, and the reason this is a verb rather than a helper over
   * {@link SiteStore.listAssets} and {@link SiteStore.readAsset}.
   *
   * A SITE THIS STORE DOES NOT HOLD IS AN EMPTY OUTLINE, exactly as
   * `readDraftSnapshot` answers an empty snapshot: the absence of a draft is a
   * question {@link SiteStore.version} answers, and answering it twice in two
   * shapes is how two callers come to disagree about it.
   */
  draftOutline(site: string): Promise<SiteOutline>

  /**
   * The same shape for a published revision, or null when there is no such
   * revision ([[REQ-303]]).
   *
   * IT DOES NOT VERIFY THE REVISION, and {@link SiteStore.readRevision} still
   * does. Verification is {@link snapshotSha} over the frozen bytes, which is
   * the cost this verb exists to avoid; what it protects is a revision being
   * SERVED or RESTORED, and nothing here is either. A count that differs by one
   * because a published object was tampered with is not the failure that
   * detector is for, and paying fifty megabytes a turn to rule it out is how the
   * digest came to kill the isolate.
   */
  revisionOutline(site: string, id: number): Promise<SiteOutline | null>

  /**
   * The revision the current draft descends from, or null before any publish.
   *
   * Distinct from "the live revision" and only equal to it most of the time: a
   * checkout of an older revision re-parents the draft onto THAT one, and the
   * difference is precisely what `basedOn` records when the next publish mints
   * (DOC-12 §4).
   */
  draftBase(site: string): Promise<number | null>

  /** Re-parent the draft onto `id`. Publish and checkout are the only callers. */
  setDraftBase(site: string, id: number | null): Promise<void>

  /** The current draft assembled and validated, or null when there is no draft. */
  loadDraft(site: string): Promise<DraftSnapshot | null>

  /**
   * The site's write version — bumped by every {@link SiteStore.write} — or
   * `null` when the store holds no such site (REQ-143).
   *
   * This is what a caller reads before a read-modify-write and passes back as
   * {@link SiteWrite.expect}. It is deliberately NOT
   * {@link SiteStore.counter}: the counter is the *journal's*, it moves only
   * when a command chooses to record something, and a store that failed to
   * journal leaves it unmoved on purpose. A version that could stand still
   * across a write is not a version.
   */
  version(site: string): Promise<number | null>
}
