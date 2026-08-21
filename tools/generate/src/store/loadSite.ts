import path from 'node:path'
import type { StoreContext } from './paths'
import { draftDir, revisionDir } from './paths'
import { listFilesRel, pathExists, readJson } from './fsutil'
import { readHistory } from './history'
import { liveRevisionOf } from './revision-model'
import { assembleSite } from './assemble'
import type { LoadResult } from './assemble'

export type { LoadedSite, LoadResult } from './assemble'

/**
 * Where to load a site definition from:
 * - `'draft'`  — the working set under `draft/`
 * - `'latest'` — the highest published revision
 * - a revision id (number or 4-digit string, e.g. `1` / `'0001'`)
 */
export type SiteSource = 'draft' | 'latest' | number | string

/** Resolve a {@link SiteSource} to the absolute directory holding the definition. */
function resolveSourceDir(ctx: StoreContext, slug: string, source: SiteSource): string {
  if (source === 'draft') return draftDir(ctx, slug)
  if (source === 'latest') {
    const id = liveRevisionOf(readHistory(ctx, slug).revisions)
    if (id === null) {
      throw new Error(`Site '${slug}' has no published revisions to load as 'latest'.`)
    }
    return revisionDir(ctx, slug, id)
  }
  const id = typeof source === 'number' ? source : Number(source)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid revision source '${String(source)}' for site '${slug}'.`)
  }
  return revisionDir(ctx, slug, id)
}

/**
 * Read a site definition off disk and validate it (DOC-12 §3).
 *
 * `site.json` plus `pages/*.json` (sorted by filename for deterministic order)
 * are merged and validated as a whole by {@link assembleSite} — the shared step,
 * so a definition read from D1 later validates identically. A missing source
 * directory is a precondition bug and throws; an invalid definition returns
 * `{ ok: false, errors }` and the caller writes nothing.
 */
export function loadSite(ctx: StoreContext, slug: string, source: SiteSource = 'draft'): LoadResult {
  const sourceDir = resolveSourceDir(ctx, slug, source)
  if (!pathExists(sourceDir)) {
    throw new Error(`Site source not found: ${sourceDir}`)
  }

  const siteJsonPath = path.join(sourceDir, 'site.json')
  if (!pathExists(siteJsonPath)) {
    throw new Error(`Missing site.json in ${sourceDir}`)
  }
  const base = readJson<Record<string, unknown>>(siteJsonPath)

  const pagesDir = path.join(sourceDir, 'pages')
  const pages = listFilesRel(pagesDir)
    .filter((rel) => rel.endsWith('.json'))
    .map((rel) => readJson<unknown>(path.join(pagesDir, rel)))

  return assembleSite({
    slug,
    sourceDir,
    base,
    pages,
    assetFiles: listFilesRel(path.join(sourceDir, 'assets')),
  })
}
