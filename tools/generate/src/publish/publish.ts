import { renderSiteFiles } from '../render/render'
import { InvalidDefinitionError } from '../cli/errors'
import type { SiteStore, StoredAsset, StoredPage } from '../store/site-store'
import type { ChangeSet, RevisionEntry, StoredSnapshot } from '../store/revision-model'
import {
  diffSnapshots,
  isEmptyChangeSet,
  liveRevisionOf,
  nextRevisionOf,
  snapshotSha,
} from '../store/revision-model'

/**
 * Publish, checkout and the pending-change report — ONE implementation, over the
 * {@link SiteStore} port (REQ-149).
 *
 * WHAT THIS REPLACES. `cmdPublish` was filesystem all the way down: it counted
 * `revisions/NNNN/` directories to mint an id, copied a directory tree to freeze
 * one, diffed two directories to describe the change, and appended to a
 * `history.json`. None of that can run in a Worker, which is why the builder's
 * `/api/publish` answered 501. Every step is now a port verb, so the SAME code
 * publishes against the operator's disk and against D1 + R2 — REQ-149 AC-6 is a
 * property of the module graph, not a claim about two things staying in step.
 *
 * NO FILESYSTEM AND NO TRANSPORT. Nothing here imports `node:*` and nothing here
 * knows about HTTP. `1c publish` calls it directly and so does the `/api/publish`
 * route handler; the CLI is not an HTTP client of the Worker, because the thing
 * worth sharing is this function rather than a wire format.
 *
 * WHY IT IS NOT A `publish()` VERB ON THE PORT. Every adapter would then carry
 * this sequence, and "one implementation" would be a thing to maintain rather
 * than a thing that cannot be otherwise. The port holds STORAGE; the order those
 * writes happen in, and what makes a publish a no-op, is a policy that belongs
 * in exactly one place.
 */

/** What a publish did. */
export interface PublishResult {
  /** The live revision after this call — newly minted, or the existing one. */
  id: number
  /** What changed versus the previous live revision. Empty when nothing did. */
  changes: ChangeSet
  /**
   * False when the draft matched the live revision and nothing was minted.
   *
   * REQ-149 D1 — publishing an unchanged draft is a NO-OP, which is a behaviour
   * change from the CLI's unconditional mint. Publish is a toolbar button now
   * (DOC-28 §10) and buttons get pressed twice; minting an identical revision
   * per press would fill the history with entries that describe nothing and make
   * "what changed in revision 7?" answerable only as "nothing".
   *
   * FORWARD-ONLY IS UNAFFECTED. A draft checked out from an older revision
   * differs from live — that is what made it worth checking out — so the diff is
   * non-empty and publish mints a new highest id, exactly as before.
   */
  published: boolean
}

/** What has changed on the draft since the revision it descends from. */
export interface PendingChanges extends ChangeSet {
  /** The live revision the draft is compared against, or null before any publish. */
  baseRevision: number | null
}

export interface PublishOptions {
  message?: string
  by?: string
  /** ISO timestamp to record. Injectable so a test can assert one. */
  now?: string
}

/**
 * The draft, as a frozen snapshot: `site.json`, every page, every asset's BYTES.
 *
 * Assets are read into memory rather than referenced, because that is what makes
 * a revision immutable — a snapshot that pointed at the draft's `logo.svg` would
 * silently change the day someone replaced it.
 */
export async function readDraftSnapshot(
  store: SiteStore,
  slug: string,
): Promise<StoredSnapshot> {
  const [siteJson, pages, assetNames] = await Promise.all([
    store.readSiteJson(slug),
    store.readPages(slug),
    store.listAssets(slug),
  ])
  const assets: StoredAsset[] = []
  for (const name of assetNames) {
    const bytes = await store.readAsset(slug, name)
    // A name that lists but does not read is an asset whose bytes are gone. It is
    // skipped rather than thrown on: the snapshot then records the site as it
    // actually is, and the missing asset shows up in the change list as a
    // removal, which is a great deal more use than a publish that refuses.
    if (bytes !== null) assets.push({ name, bytes })
  }
  return { siteJson, pages, assets }
}

/** The draft's differences from the live revision, as `1c status` reports them. */
export async function pendingChanges(store: SiteStore, slug: string): Promise<PendingChanges> {
  const live = liveRevisionOf(await store.revisions(slug))
  const previous = live === null ? null : await store.readRevision(slug, live)
  const draft = await readDraftSnapshot(store, slug)
  return { baseRevision: live, ...diffSnapshots(previous, draft) }
}

/** The publish log, newest first. */
export async function revisionHistory(
  store: SiteStore,
  slug: string,
): Promise<RevisionEntry[]> {
  return [...(await store.revisions(slug))].sort((a, b) => b.id - a.id)
}

/**
 * Freeze the draft as the next revision and render it.
 *
 * ORDER IS THE WHOLE CORRECTNESS ARGUMENT here, so it is stated rather than left
 * to be reconstructed from the code:
 *
 *   1. VALIDATE FIRST, write nothing. An invalid draft publishes nothing at all
 *      (AC-5) — not a revision, not a history entry, not a byte of output. The
 *      author's mistake must not become a published site's problem.
 *   2. DIFF BEFORE RENDERING. The no-op case is the common one (a second press
 *      of the button) and the render is the expensive step; deciding after it
 *      would pay the whole cost to discard the result.
 *   3. FREEZE AND RECORD TOGETHER. `writeRevision` takes the source, the
 *      rendered output and the log entry as one call, so there is no window in
 *      which a revision is listed and unservable.
 *   4. RE-PARENT LAST. The draft's lineage moves only once the revision it now
 *      descends from actually exists.
 */
export async function publishSite(
  store: SiteStore,
  slug: string,
  opts: PublishOptions = {},
): Promise<PublishResult> {
  const snapshot = await store.loadDraft(slug)
  if (snapshot === null) throw new Error(`Site '${slug}' has no draft to publish.`)
  if (!snapshot.result.ok) throw new InvalidDefinitionError(slug, snapshot.result.errors)

  const history = await store.revisions(slug)
  const live = liveRevisionOf(history)
  const previous = live === null ? null : await store.readRevision(slug, live)

  const draft = await readDraftSnapshot(store, slug)
  const changes = diffSnapshots(previous, draft)
  if (live !== null && isEmptyChangeSet(changes)) {
    return { id: live, changes, published: false }
  }

  const rendered = await renderSiteFiles(snapshot.result.value)
  const entry: RevisionEntry = {
    id: nextRevisionOf(history),
    publishedAt: opts.now ?? new Date().toISOString(),
    message: opts.message ?? '',
    by: opts.by ?? null,
    basedOn: await store.draftBase(slug),
    changes,
    sha: await snapshotSha(draft),
  }
  await store.writeRevision(slug, entry, {
    source: draft,
    out: new Map(rendered.files),
  })
  await store.setDraftBase(slug, entry.id)
  return { id: entry.id, changes, published: true }
}

export interface CheckoutOptions {
  /** Discard uncommitted draft changes instead of refusing. */
  force?: boolean
}

export interface CheckoutResult {
  /** The revision the draft now holds and descends from. */
  id: number
}

/**
 * Replace the draft with a revision's frozen definition.
 *
 * FORWARD-ONLY, and this is where that is enforced: checking out revision 2 of 5
 * does not rewind the log — it re-parents the DRAFT, so the next publish mints 6
 * and records `basedOn: 2`. History is append-only and a checkout is a starting
 * point, never an erasure.
 *
 * REFUSES A DIRTY DRAFT unless forced, because the operation overwrites the
 * draft wholesale and unpublished work has nowhere else to be.
 */
export async function checkoutRevision(
  store: SiteStore,
  slug: string,
  revId?: number,
  opts: CheckoutOptions = {},
): Promise<CheckoutResult> {
  const history = await store.revisions(slug)
  const live = liveRevisionOf(history)
  if (live === null) throw new Error(`Site '${slug}' has no revisions to check out.`)

  const target = revId ?? live
  const wanted = await store.readRevision(slug, target)
  if (wanted === null) {
    throw new Error(`Revision ${target} does not exist for site '${slug}'.`)
  }

  if (opts.force !== true) {
    const dirty = await pendingChanges(store, slug)
    const changed = dirty.added.length + dirty.modified.length + dirty.removed.length
    if (changed > 0) {
      throw new Error(
        `draft/ has uncommitted changes (${changed} file(s)); publish them or pass --force to discard.`,
      )
    }
  }

  // Everything the draft holds that the revision does not, named explicitly:
  // `write` replaces by name and removes by name, and a page the revision never
  // had would otherwise survive a checkout as a file nobody asked for.
  const keepPages = new Set(wanted.pages.map((p: StoredPage) => p.name))
  const keepAssets = new Set(wanted.assets.map((a: StoredAsset) => a.name))
  const [currentPages, currentAssets] = await Promise.all([
    store.readPages(slug),
    store.listAssets(slug),
  ])

  await store.write(slug, {
    siteJson: wanted.siteJson ?? undefined,
    pages: wanted.pages,
    removePages: currentPages.map((p) => p.name).filter((name) => !keepPages.has(name)),
    assets: wanted.assets,
    removeAssets: currentAssets.filter((name) => !keepAssets.has(name)),
  })
  await store.setDraftBase(slug, target)
  return { id: target }
}
