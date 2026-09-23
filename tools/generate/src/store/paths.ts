import path from 'node:path'

/**
 * Path resolution for the file-backed site store (DOC-12 §2).
 *
 * Every command resolves against a {@link StoreContext}: a working directory
 * (the repo root in normal use) and a {@link Root}. Rendered output always lands
 * under `storage/dist/<root>/<slug>/<channel>/`.
 */

/**
 * Which tree under `storage/` a context addresses.
 *
 * `sandbox` IS THE ONLY ONE THE CLI REACHES (REQ-290). It is the gitignored
 * scratch tree the reproduction loop lives in: `1c repro` imports a capture
 * there and the fidelity commands run over it.
 *
 * `sites` WAS THE AUTHORING TIER AND IS NOT ONE ANY MORE. Sites were authored as
 * JSON on disk there, git-tracked, and copied up to the cloud; the builder
 * replaced all of it and every real site now lives in the builder's store.
 * REQ-290 deleted the tree and stopped the CLI from resolving this value. It
 * survives in the type because the L1 conformance corpus — the hand-authored
 * documents fourteen suites read, now under `tests/fixtures/l1-corpus/` — keeps
 * repo shape, and `loadSite({ cwd: L1_CORPUS_CWD, root: 'sites' }, …)` is how it
 * is addressed. A path shape, not a tier.
 */
export type Root = 'sites' | 'sandbox'
/**
 * The channels a site renders to. `draft` and `published` are the two DOC-12
 * artifacts; `edit` (REQ-116) is the third render of the SAME draft definition —
 * the page the builder's editor works on. It gets its own directory for the same
 * reason draft and published do (DOC-12 principle 4): every rendered artifact has
 * its own address, so a non-functional page can never be served from a working
 * page's URL. It is never published and never enters `history.json`.
 */
export type RenderChannel = 'draft' | 'published' | 'edit'

export interface StoreContext {
  /** Directory the site/dist trees are resolved against (default: process cwd). */
  cwd: string
  /** Which site tree to operate on. */
  root: Root
}

/** Zero-pad a revision id to the canonical 4-digit directory name (`1` → `0001`). */
export function padRevision(id: number): string {
  return String(id).padStart(4, '0')
}

export function siteDir(ctx: StoreContext, slug: string): string {
  return path.join(ctx.cwd, 'storage', ctx.root, slug)
}

export function draftDir(ctx: StoreContext, slug: string): string {
  return path.join(siteDir(ctx, slug), 'draft')
}

export function revisionsDir(ctx: StoreContext, slug: string): string {
  return path.join(siteDir(ctx, slug), 'revisions')
}

/**
 * The site's content-addressed asset store: `blobs/<digest>` ([[REQ-304]]).
 *
 * BESIDE `draft/` AND `revisions/`, NEVER INSIDE EITHER, for the reason
 * `.draft-base.json` sits at the site root: it is not part of any snapshot, so a
 * capture of the draft cannot pick it up and it cannot perturb byte-identity or
 * a change list.
 *
 * WHY THE FILE TIER HAS ONE AT ALL. A revision names its assets by content, and
 * a checkout restores them by that name — so there has to be somewhere a digest
 * resolves to bytes even after the draft has been edited past them. Making the
 * two tiers agree on that is what keeps `publish.ts` one implementation rather
 * than one with a branch in it.
 *
 * WRITE-ONCE AND NEVER SWEPT HERE EITHER (see `blobKey`): the digest IS the
 * name, so a write can only ever put back what is already there, and a blob no
 * draft names may still be some revision's content.
 */
export function blobsDir(ctx: StoreContext, slug: string): string {
  return path.join(siteDir(ctx, slug), 'blobs')
}

export function revisionDir(ctx: StoreContext, slug: string, id: number): string {
  return path.join(revisionsDir(ctx, slug), padRevision(id))
}

export function historyPath(ctx: StoreContext, slug: string): string {
  return path.join(siteDir(ctx, slug), 'history.json')
}

/**
 * Sidecar tracking which revision the current `draft/` descends from. Lives at
 * the site root — never inside `draft/` — so it is never captured by a snapshot
 * and can never perturb byte-identity or the change log.
 */
export function draftBasePath(ctx: StoreContext, slug: string): string {
  return path.join(siteDir(ctx, slug), '.draft-base.json')
}

/**
 * The draft change journal (REQ-131). Beside `.draft-base.json` at the site
 * root — never inside `draft/`, so it cannot be captured by a snapshot or
 * perturb byte-identity — and gitignored, because it is a per-keystroke record
 * that a checkout has no reason to carry and losing it costs only a re-read.
 */
export function journalPath(ctx: StoreContext, slug: string): string {
  return path.join(siteDir(ctx, slug), '.journal.json')
}

export function distDir(ctx: StoreContext, slug: string, channel: RenderChannel): string {
  return path.join(ctx.cwd, 'storage', 'dist', ctx.root, slug, channel)
}
