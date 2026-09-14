import { contactFormTemplateRefs } from '@1stcontact/framework/worker'
import { renderSiteFiles } from '../render/render'
import { EMPTY_LADDER, type ImageLadder, type LadderProgressReporter } from './ladder'
import { InvalidDefinitionError, NoPublicAddressError } from '../cli/errors'
import type { SiteStore, StoredAsset, StoredPage } from '../store/site-store'
import type { ValidationError } from '@1stcontact/site-schema'
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
  /**
   * [[REQ-222]] — the delivery width ladder, built from this deployment's image
   * renderer. Omit it and the publish builds no ladder.
   *
   * AN OPTION AND NOT A STORE VERB, for the reason `publishSite` is not one
   * either: a store holds bytes, and which widths a picture should be offered at
   * is a policy. It is also the seam that makes "the ladder is built in the
   * Worker" true without a branch — the Worker's route passes one and the CLI
   * does not, and neither of them tests for the other.
   */
  ladder?: ImageLadder
  /**
   * Told how far through building the ladder this publish is ([[REQ-222]]).
   *
   * PROGRESS IS A PROPERTY OF THE ROUTE, NOT OF THE PUBLISH — the same line this
   * ticket already draws around the ladder itself. `POST /api/publish` supplies a
   * reporter because it has a stream to write frames into; `1c publish` has a
   * terminal and no use for frames, and supplies none. So there is one
   * implementation and no branch inside it, and the CLI is byte-identical to
   * before.
   *
   * IT IS THE LADDER'S PROGRESS AND NOT THE PUBLISH'S, deliberately. Every other
   * step here is a handful of store calls; the ladder is the one that decodes and
   * re-encodes every picture on the site, and it is the only reason a publish ever
   * takes long enough to need explaining. Reporting the cheap steps too would
   * dilute the one number the client is waiting on.
   */
  onLadderProgress?: LadderProgressReporter
  /**
   * Whether a capture form on this site may send under a template key —
   * a sentence when it may not, null when it may ([[REQ-243]] §2).
   *
   * THE CHECK THAT REPLACED A CLOSED SET. `contact-form.config.template` names
   * whichever message the business authored, so nothing in this repository can
   * enumerate the legal values; what it CAN do is refuse a name the business
   * does not hold, at the moment somebody publishes rather than at the moment
   * somebody is waiting for mail. That is the property the enum was protecting,
   * sourced from the store's actual contents instead of from a literal.
   *
   * A PREDICATE AND NOT A SET, so this file holds no opinion about WHY a key is
   * refused. `templates.ts` in `control-app` knows two different reasons — a key
   * nobody authored, and a sign-in credential a public form may never send — and
   * they want different words. What belongs here is only that every named
   * template is asked about, and that the refusal names the form.
   *
   * ABSENT MEANS UNCHECKED, on {@link PublishOptions.ladder}'s reasoning. The
   * check needs the business's TICKET store, which is a thing the Worker holds
   * and `1c publish` against a directory on somebody's disk does not. So the
   * route supplies one and the CLI does not, and neither tests for the other.
   *
   * ASYNC, AND ONLY CALLED WHEN A FORM ACTUALLY NAMES SOMETHING. The answer
   * comes out of a store, and a site with no capture form has no question to
   * ask — so opening that store eagerly would make every publish on the
   * deployment depend on a binding this one needs nothing from. The caller is
   * free to read once and memoise, which the route does.
   */
  templateRefusal?: (key: string) => Promise<string | null> | string | null
  /**
   * Every public address this site can be reached at ([[REQ-238]]).
   *
   * PUBLICATION IS THE GATE, NOT PROVISION. To go live a business needs a
   * `1stc.site` hostname, a custom domain, or both — at least one address, or
   * there is nothing for a publish to make reachable. The requirement belongs
   * HERE rather than at the moment a business is created because a business may
   * take as long as it likes to choose: until a site is published it has no
   * public address and needs none. It is also what makes deleting the
   * `/site/<key>/` path grammar safe ([[DOC-45]] §4) — after that, a published
   * site with no host mapping is simply unreachable.
   *
   * IT ANSWERS A LIST AND NOT A HOSTNAME, and the shape is the requirement. The
   * question is *does this site have at least one address*, over a list that has
   * two kinds and one implementation today; `if (!hostname) refuse` is the same
   * check today and a wrong refusal the day [[EPIC-6]]'s custom domains land.
   * Nothing in this file knows what an address IS beyond that there can be more
   * than one of them.
   *
   * ABSENT MEANS UNCHECKED, on {@link templateRefusal}'s reasoning. The answer
   * comes out of the deployment's own database, which is a thing the Worker
   * holds and `1c publish` against a directory on somebody's disk does not — so
   * the Worker supplies one and the CLI does not, and neither tests for the
   * other.
   */
  addresses?: () => Promise<readonly unknown[]> | readonly unknown[]
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
 * Every capture form on this site naming a template it may not send
 * ([[REQ-243]] §2), as the author's own validation errors.
 *
 * THE REFUSAL NAMES THE FORM AND THE KEY, both, for the reason
 * `TemplateRefusedError` names the template and the token: neither alone is
 * actionable. "No such template" sends an author looking through every page, and
 * "the beta form is wrong" does not say what to change it to. The `path` carries
 * the machine-followable location and the message carries the words.
 *
 * ONE ERROR PER FORM AND NOT THE FIRST ONE. A site whose two forms both name
 * missing templates should say so once, not across two publishes.
 */
async function refusedTemplates(
  pages: readonly { slug: string; modules?: unknown }[],
  refusal: PublishOptions['templateRefusal'],
): Promise<ValidationError[]> {
  if (!refusal) return []
  const errors: ValidationError[] = []
  for (const [pageIndex, page] of pages.entries()) {
    for (const ref of contactFormTemplateRefs(page)) {
      const why = await refusal(ref.templateKey)
      if (why === null) continue
      errors.push({
        path: `/pages/${pageIndex}/modules/${ref.index}/config/template`,
        message:
          `the form '${ref.instanceId}' on page '${page.slug}' sends the ` +
          `'${ref.templateKey}' template, but ${why}`,
      })
    }
  }
  return errors
}

/**
 * Freeze the draft as the next revision and render it.
 *
 * ORDER IS THE WHOLE CORRECTNESS ARGUMENT here, so it is stated rather than left
 * to be reconstructed from the code:
 *
 *   1. VALIDATE FIRST, write nothing. An invalid draft publishes nothing at all
 *      (AC-5) — not a revision, not a history entry, not a byte of output. The
 *      author's mistake must not become a published site's problem. [[REQ-238]]
 *      added a third refusal under this rule and not a fourth step: a site with
 *      no public address is refused here, beside the invalid draft and the form
 *      naming a template it may not send, because all three leave the store
 *      exactly as they found it.
 *   2. DIFF BEFORE RENDERING. The no-op case is the common one (a second press
 *      of the button) and the render is the expensive step; deciding after it
 *      would pay the whole cost to discard the result.
 *   3. FREEZE AND RECORD TOGETHER. `writeRevision` takes the source, the
 *      rendered output and the log entry as one call, so there is no window in
 *      which a revision is listed and unservable.
 *   4. RE-PARENT LAST. The draft's lineage moves only once the revision it now
 *      descends from actually exists.
 *
 * [[REQ-222]] PUT THE LADDER BETWEEN 2 AND 3, and the placement is the same
 * argument rule 2 makes about the render, only stronger. Building it is the most
 * expensive step in a publish by a wide margin — it decodes and re-encodes every
 * picture on the site — so it must sit after the no-op check, which is the
 * common case. It must sit BEFORE the render, because the render is what writes
 * the manifest into each `<img>`.
 *
 * WHICH ALSO PUTS THE LADDER'S OWN REFUSAL INSIDE RULE 1's PROMISE. A site whose
 * projected renditions exceed what one request can carry throws before a single
 * rendition is written, and that is upstream of `writeRevision` — so an
 * over-budget publish leaves no revision, no history entry and no bytes, exactly
 * as an invalid draft does. A publish that died halfway would leave the opposite:
 * a partial ladder, paid for, serving nothing.
 */
export async function publishSite(
  store: SiteStore,
  slug: string,
  opts: PublishOptions = {},
): Promise<PublishResult> {
  const snapshot = await store.loadDraft(slug)
  if (snapshot === null) throw new Error(`Site '${slug}' has no draft to publish.`)
  if (!snapshot.result.ok) throw new InvalidDefinitionError(slug, snapshot.result.errors)

  // [[REQ-243]] — INSIDE RULE 1's PROMISE, immediately after the schema's own
  // refusal and before anything is read for the diff. A form naming a message
  // that does not exist is an invalid draft in every sense the author cares
  // about, and it is reported the same way so the toolbar that already shows
  // path-pointed validation errors shows this one with no new surface.
  const templateErrors = await refusedTemplates(
    snapshot.result.value.site.pages,
    opts.templateRefusal,
  )
  if (templateErrors.length > 0) throw new InvalidDefinitionError(slug, templateErrors)

  /*
   * [[REQ-238]] — DOES THIS SITE HAVE AN ADDRESS AT ALL. Inside rule 1's promise
   * like the two refusals above it: no revision, no history entry, no ladder and
   * no byte of output is written by a publish that gets this far and stops.
   *
   * AFTER THE DRAFT'S OWN REFUSALS AND NOT BEFORE THEM, even though this is one
   * indexed query and `loadDraft` reads the whole site. The order is about what
   * the customer is told rather than about what is cheapest: a draft with a
   * validation error is a thing they are in the middle of editing, and being
   * sent to the settings tab to choose a hostname while their page is broken
   * would answer a question they did not ask.
   *
   * THE CHECK IS OVER THE LIST'S LENGTH AND NOTHING ELSE. It does not look at a
   * kind, a host or a status — those are the deployment's business, and this
   * file asking about any of them is the falsifier [[REQ-238]] names: *"a
   * publish check that names the `1stc.site` hostname rather than asking whether
   * any address exists."*
   */
  if (opts.addresses) {
    const addresses = await opts.addresses()
    if (addresses.length === 0) throw new NoPublicAddressError(slug)
  }

  const history = await store.revisions(slug)
  const live = liveRevisionOf(history)
  const previous = live === null ? null : await store.readRevision(slug, live)

  const draft = await readDraftSnapshot(store, slug)
  const changes = diffSnapshots(previous, draft)
  if (live !== null && isEmptyChangeSet(changes)) {
    return { id: live, changes, published: false }
  }

  // The delivery renditions, and then the pages that name them. The manifest is
  // a record of what was actually built, so a `srcset` can only ever name bytes
  // this same call is about to write.
  const ladder = opts.ladder
    ? await opts.ladder.build(draft.assets, { onProgress: opts.onLadderProgress })
    : EMPTY_LADDER
  const rendered = await renderSiteFiles(snapshot.result.value, { delivery: ladder.manifest })
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
    derived: ladder.derived,
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
