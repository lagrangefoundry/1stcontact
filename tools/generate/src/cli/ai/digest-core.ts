/**
 * The site as it stands, gathered once a turn so a session never has to look
 * ([[REQ-285]]).
 *
 * WHAT IT IS FOR. The consultant re-reads the page constantly, and its own
 * account of why is that it does not trust its memory of the page across a
 * failure — correctly, as the `since: 120` slip demonstrates: it asked the site
 * for changes since revision 120 when the true count was 76. It had not misread
 * anything, it had INVENTED a state marker and believed it. A session that is
 * handed the page every turn has no reason to go and look, no reason to remember
 * a revision number, and nothing to confabulate.
 *
 * THIS MODULE GATHERS FACTS AND RENDERS NOTHING. The sentences are
 * `priming.json`'s and the assembly is `roles.ts`'s {@link pageDigest}, for the
 * reason every other signal in this host splits the same way (DOC-22 §5): code
 * contributes the structure, configuration contributes the prose, and the host
 * contributes only the state.
 *
 * IT IS DERIVED, NEVER STORED. Every field here is read back out of the store on
 * the turn it is delivered — which is the whole of what makes it authoritative.
 * A cached page shape, a remembered counter or a carried-forward "current page"
 * would be a second copy of the truth, and a second copy is the thing the
 * session was already confabulating.
 *
 * AND IT IS NOT CACHED EITHER, WHICH USED TO BE A CAVEAT ON THAT SENTENCE
 * ([[BUG-128]]). The derivation was kept against `SiteStore.version`, defended as
 * *"bumped by every write, so a cache keyed on it cannot be stale by
 * construction"*. The version moves on a draft {@link SiteStore.write} and on
 * nothing else, while this entry also reports the JOURNAL's counter, the page
 * last worked on, the live revision and what is unpublished — so a journal record
 * or a publish moved what the digest says while leaving its key still, and the
 * digest went on quoting a superseded number for as long as nobody touched the
 * draft. A caveat with exceptions the header did not list is worse than no
 * caveat: the consultant read *"read off the site a moment ago"* and had no
 * reason to check.
 *
 * THE COMPOSITE KEY THAT WOULD HAVE FIXED IT WAS THE WRONG SHAPE. Keying on
 * version-and-counter-and-base-revision is correct until the next counter is
 * added, and nothing would fail when it is. What must hold is that this entry is
 * a fresh derivation, and the cheapest way to guarantee that is to derive it.
 * The saving it bought — a handful of store reads on a turn that changed nothing
 * — is paid immediately before a model call that costs seconds and cents, which
 * is not the budget that was ever in question.
 */

import { l1AssetKey, l1AssetReferences } from '@1stcontact/site-schema'
import type { L1Node } from '@1stcontact/site-schema'
import { labelOf } from '../segments'
import type { EditOptions } from '../edit'
import { assetHandle } from '../edit'
import { pendingChanges } from '../../publish/publish'

/**
 * One band on a page — a top-level child of the page's root ([[REQ-285]]).
 *
 * ONE LEVEL AND NOT THE TREE. The digest's job is orientation: what is on this
 * page, in what order. The subtree, the copy and the paint axes are what
 * `get_l1` is for, and putting them here would recreate the cost this removes —
 * a page map plus two element reads is already several thousand tokens, which is
 * the trade this whole entry has to win.
 *
 * THE ADDRESS TRAVELS WITH THE NAME because a band the session can see and
 * cannot reach is an invitation to compose an address, and composing addresses
 * is the failure the declaration's `overview` already forbids.
 */
export interface DigestBand {
  /** The dotted address, in the form every write operation takes. */
  path: string
  /** `segments.ts`'s label — the same words the page map and the journal use. */
  label: string
}

/** One page, as a session needs to see it without reading it. */
export interface DigestPage {
  /** The id every operation takes. */
  id: string
  title: string
  /** Where it sits in the site. */
  address: string
  kind: 'web' | 'email'
  bands: DigestBand[]
  /**
   * What this page references, by the name the CLIENT reads ([[REQ-280]]).
   *
   * The Library label (`IMAGE-5`) where the deployment has a catalogue, and the
   * site handle otherwise. The point of preferring the label is that it is the
   * one string that means the same thing on both sides of the engagement: the
   * client says *"replace IMAGE-5"*, and a session whose digest says `IMAGE-5`
   * does not have to translate.
   */
  assets: string[]
}

/** The whole of what a turn is told about the site it is working on. */
export interface SiteDigest {
  pages: DigestPage[]
  /**
   * The page most recently changed, by anyone, or `null`.
   *
   * *"Which one is being worked on"* READ OUT OF THE RECORD rather than carried
   * across turns. Nothing in this host knows which page the client has open, and
   * a value the session remembered would be exactly the kind of marker it
   * confabulates. The journal's most recent page-bearing record is a fact, it is
   * cheap, and it survives an interruption — which is the moment the question is
   * actually being asked.
   */
  focus: string | null
  /**
   * The draft change counter as it stood when this digest was derived.
   *
   * THE NUMBER IT QUOTES IS ONE IT WAS GIVEN. This is the entire answer to the
   * `since: 120` slip: `list_changes` takes a `since`, the session had no source
   * for one, and so it produced one. Now it has a source.
   *
   * IT IS ALSO THE DIGEST'S STAMP ([[BUG-128]]), and deliberately not a second
   * field beside it. A digest is a snapshot taken when the turn began, so a
   * session that writes during its turn will find `list_changes` ahead of this
   * number — which is the passage of the turn and not a fault, but is
   * indistinguishable from one unless the entry says what it is as of. It says
   * so in `priming.json`'s prose, against THIS number: a separate stamp would be
   * one more value that could disagree with the count it is meant to date.
   */
  counter: number
  /** The live revision, or `null` before the first publish. */
  live: number | null
  /** How many files differ from the live revision. Zero is ordinary. */
  pending: number
}

/**
 * How far back the journal is read to find the page last worked on.
 *
 * A BOUNDED LOOK-BACK AND NOT THE WHOLE WINDOW. The journal retains 500 records
 * and this question needs one; reading the window to answer it would spend the
 * thing the digest exists to save. Twelve because a single request commonly
 * lands several writes — a palette change and three copy edits — and the most
 * recent record is often not the one that names a page.
 */
export const FOCUS_LOOKBACK = 12

/** The page-level roots a page's own document contributes, in order. */
function bandsOf(page: Record<string, unknown>): DigestBand[] {
  const root = (page.l1 as { root?: L1Node } | undefined)?.root
  const children = (root as { children?: L1Node[] } | undefined)?.children ?? []
  // `0.<i>` is `resolveL1Node`'s own addressing — index the root list, then walk
  // `children`. It is not composed here beyond what that rule already says.
  return children.map((node, index) => ({ path: `0.${index}`, label: labelOf(node) }))
}

/**
 * What this page references, deduplicated and in the order it appears.
 *
 * SITE-LOCAL ONLY. `l1AssetKey` answers `null` for anything carrying a scheme,
 * which is somebody else's file to serve — naming it here would put a string in
 * front of the session that no operation of its accepts.
 *
 * NAMED BY THE LABEL WHERE THERE IS ONE, and by the handle otherwise. A
 * deployment with no catalogue is not a degraded one: it is the `1c` CLI, where
 * there is no client Library for a name to be shared with.
 */
function assetsOf(page: Record<string, unknown>, labels: ReadonlyMap<string, string>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const { value } of l1AssetReferences(page)) {
    const key = l1AssetKey(value)
    if (key === null || seen.has(key)) continue
    seen.add(key)
    out.push(labels.get(key) ?? assetHandle(key))
  }
  return out
}

/**
 * Where a page sits in the site, as a reader of the address bar would say it.
 *
 * THE SLUG IS THE PATH SEGMENT and the schema says so; there is no second field
 * to consult. `home` is the site root by the renderer's own rule, which is the
 * one place that decision is made and is not re-argued here.
 */
function addressOf(page: Record<string, unknown>): string {
  const slug = typeof page.slug === 'string' ? page.slug : String(page.id ?? '')
  return slug === 'home' ? '/' : `/${slug}`
}

/**
 * Where the digest's facts come from, as the gatherer needs them ([[REQ-285]]).
 *
 * A CALLBACK FOR THE LABELS AND NOT A CATALOGUE, for the reason every seam in
 * this graph is one: the Library is a ticket store only the Worker has, and the
 * `1c` CLI has none. `null` is the ordinary absence, not a broken deployment.
 */
export interface DigestSource {
  /** Site asset name (`hero.png`) to the label the client reads (`IMAGE-5`). */
  labels?: (() => Promise<ReadonlyMap<string, string>>) | null
}

/**
 * Read the whole digest out of the store, once.
 *
 * FIVE READS AND NOT ONE PER PAGE. `readPages` answers with every page's whole
 * definition, so the bands and the references both fall out of one call — a
 * `describe_page` per page would be the cost this exists to remove, paid by the
 * host instead of by the model.
 *
 * AND NONE OF THE FIVE OPENS AN ASSET ([[REQ-303]]). The site's pictures are
 * named here, never read: what a page references comes out of the page's own
 * definition, and what is unpublished comes out of the store's own record of
 * its objects. So a turn against a site with fifty megabytes of photographs
 * costs what a turn against an empty one costs.
 *
 * `pendingChanges` IS REUSED RATHER THAN APPROXIMATED. It is already what
 * `describe_site` reports and what `publish` acts on, so a second idea of "is
 * anything unpublished" is a second answer that will eventually disagree with
 * the one the client sees.
 *
 * AND IT NOW COSTS WHAT A DIGEST CAN AFFORD ([[REQ-303]]). Reusing it was right
 * and is not being reversed; what it did not price is that the function was
 * written for publish, where a byte-exact snapshot of the whole site is the
 * point and the cost is paid once on a deliberate act. On this path it ran
 * before every model call, read every draft asset's bytes AND every published
 * asset's bytes, and flattened both through a string built one character per
 * byte — so a business with fifty megabytes of pictures lost chat entirely:
 * `exceededMemory` against a 128 MB isolate, every turn, with no error reaching
 * the client, because an OOM kills the isolate and {@link siteDigestSource}'s
 * `catch` never runs. The two values taken off the result — the live revision
 * and a count — never looked at a byte, and `pendingChanges` does not read one
 * now.
 */
export async function collectSiteDigest(
  slug: string,
  opts: EditOptions,
  source: DigestSource = {},
): Promise<SiteDigest> {
  const store = opts.store
  const [stored, counter, pending, labels] = await Promise.all([
    store.readPages(slug),
    store.counter(slug),
    pendingChanges(store, slug),
    source.labels ? source.labels() : Promise.resolve(new Map<string, string>()),
  ])
  const slice = await store.changesSince(slug, Math.max(0, counter - FOCUS_LOOKBACK))
  // The LAST record that names a page, which is not always the last record: a
  // request commonly lands a palette write after the copy edits it was really
  // about, and the palette is not a page.
  let focus: string | null = null
  for (const record of slice.changes) if (record.page) focus = record.page

  return {
    pages: stored.map(({ page }) => ({
      id: String(page.id ?? ''),
      title: typeof page.title === 'string' ? page.title : String(page.id ?? ''),
      address: addressOf(page),
      kind: page.kind === 'email' ? ('email' as const) : ('web' as const),
      bands: bandsOf(page),
      assets: assetsOf(page, labels),
    })),
    focus,
    counter,
    live: pending.baseRevision,
    pending: pending.added.length + pending.modified.length + pending.removed.length,
  }
}

/**
 * The digest as the per-turn provider reaches it — derived afresh on every turn
 * it is delivered ([[REQ-285]], [[BUG-128]]).
 *
 * NOTHING IS KEPT BETWEEN TURNS, and the module header says why at length. The
 * short version: this is the mechanism that tells a session *"your client edited
 * something, go and look before you write"*, so it is the one place in this host
 * where a number that is merely usually right is worth less than nothing.
 *
 * THE ONE STORE READ THAT IS NOT PART OF THE DERIVATION is the existence check.
 * `version` answers `null` for a site this store does not hold, and a site that
 * is not there is not an empty one — a digest listing no pages would tell the
 * session the client's site had been emptied.
 *
 * A FAILED READ IS SILENCE, NOT A FAILED TURN. The digest is what makes a turn
 * cheap, not what makes one possible, and a store that cannot be read is a
 * reason not to claim a page shape rather than a reason to refuse the client an
 * answer.
 */
export function siteDigestSource(
  slug: string,
  opts: EditOptions,
  source: DigestSource = {},
): () => Promise<SiteDigest | null> {
  return async () => {
    try {
      // `null` is a site this store does not hold, which is not an empty digest.
      if ((await opts.store.version(slug)) === null) return null
      return await collectSiteDigest(slug, opts, source)
    } catch {
      return null
    }
  }
}
