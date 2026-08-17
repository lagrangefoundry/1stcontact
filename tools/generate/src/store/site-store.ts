import type { LoadResult } from './assemble'
import type { ChangeSet } from './history'
import type { ChangeSlice, JournalRecord } from './journal-model'

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
 * TWO ADAPTERS, BOTH CURRENT. `fsSiteStore` (the operator's git-tracked
 * `storage/sites/`, DOC-12 §3.1) and the Worker's D1/R2 one are both live; this
 * is not a legacy mode with a preserved old path. Nothing detects a mode and no
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

  constructor(slug: string, expected: number, actual: number | null) {
    super(
      actual === null
        ? `Site '${slug}' no longer exists (expected version ${expected}).`
        : `Site '${slug}' has moved on: expected version ${expected}, found ${actual}.`,
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

/** What has changed on the draft since the revision it descends from. */
export interface PendingChanges extends ChangeSet {
  /** The live revision the draft is compared against, or null before any publish. */
  baseRevision: number | null
}

/** Storage for one site tree, addressed by slug. */
export interface SiteStore {
  /** True when the site has a draft to operate on. */
  hasDraft(slug: string): Promise<boolean>

  /** The raw `site.json` object, or null when the site holds none. */
  readSiteJson(slug: string): Promise<Record<string, unknown> | null>

  /** Every page, in load order. Empty when the site has none. */
  readPages(slug: string): Promise<StoredPage[]>

  /** Apply one whole change. See {@link SiteWrite} for why it is one verb. */
  write(slug: string, change: SiteWrite): Promise<void>

  /** Asset names under the draft's `assets/`, sorted. */
  listAssets(slug: string): Promise<string[]>

  /** One asset's bytes, or null when the store holds no such asset. */
  readAsset(slug: string, name: string): Promise<Uint8Array | null>

  /** The site's change count. Zero for a site nothing has been written to. */
  counter(slug: string): Promise<number>

  /**
   * Record one write and return the count it produced. Never fails a write: a
   * store that cannot take the record returns the counter unmoved.
   */
  appendChange(
    slug: string,
    entry: Omit<JournalRecord, 'at' | 'ts'> & { ts?: string },
  ): Promise<number>

  /** Every change after `since`, plus where the counter stands now. */
  changesSince(slug: string, since?: number): Promise<ChangeSlice>

  /** The draft's file-level differences from the revision it descends from. */
  pendingChanges(slug: string): Promise<PendingChanges>

  /** The current draft assembled and validated, or null when there is no draft. */
  loadDraft(slug: string): Promise<DraftSnapshot | null>

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
  version(slug: string): Promise<number | null>
}
