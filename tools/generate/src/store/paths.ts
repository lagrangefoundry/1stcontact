import path from 'node:path'

/**
 * Path resolution for the file-backed site store (DOC-12 §2).
 *
 * Every command resolves against a {@link StoreContext}: a working directory
 * (the repo root in normal use) and a `root` selecting real sites (`sites/`,
 * git-tracked) or throwaway scratch (`sandbox/`, gitignored). Rendered output
 * always lands under `dist/<root>/<slug>/<channel>/`.
 */

export type Root = 'sites' | 'sandbox'
export type RenderChannel = 'draft' | 'published'

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
  return path.join(ctx.cwd, ctx.root, slug)
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

export function distDir(ctx: StoreContext, slug: string, channel: RenderChannel): string {
  return path.join(ctx.cwd, 'dist', ctx.root, slug, channel)
}
