import path from 'node:path'

/**
 * Path resolution for the file-backed site store (DOC-12 §2).
 *
 * Every command resolves against a {@link StoreContext}: a working directory
 * (the repo root in normal use) and a `root` selecting real sites (`storage/sites/`,
 * git-tracked) or throwaway scratch (`storage/sandbox/`, gitignored). Rendered output
 * always lands under `storage/dist/<root>/<slug>/<channel>/`.
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
