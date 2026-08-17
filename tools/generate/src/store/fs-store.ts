import fs from 'node:fs'
import path from 'node:path'
import type { StoreContext } from './paths'
import { draftDir, revisionDir } from './paths'
import {
  ensureDir,
  listFilesRel,
  pathExists,
  readJson,
  removePath,
  writeJson,
} from './fsutil'
import { diffSnapshots } from './diff'
import { liveRevision, readHistory } from './history'
import { appendChange, changesSince, draftCounter } from './journal'
import { loadSite } from './loadSite'
import type {
  DraftSnapshot,
  PendingChanges,
  SiteStore,
  SiteWrite,
  StoredPage,
} from './site-store'

/**
 * {@link SiteStore} over the file-backed store (DOC-12 §3) — REQ-142.
 *
 * THIS IS THE ONLY MODULE IN THE PORT'S WORLD THAT IMPORTS `node:fs`, and it is
 * imported by the CLI rather than by `edit.ts`. That is the whole shape:
 * the shared `ticketing` component's `docs_store.js` keeps its filesystem reader
 * behind a separate entry point so the Worker-safe path never reaches it, and
 * this follows it. If this module ever appears in a Worker's import graph, the
 * seam has been undone.
 *
 * BEHAVIOUR IS CARRIED FORWARD, NOT IMPROVED. Every verb below does what
 * `edit.ts` did inline before the port existed — same JSON formatting, same
 * ordering, same idempotent removes. In particular {@link write} is a *sequence*
 * of filesystem writes and is not atomic: a crash between two of them leaves the
 * draft half-written, exactly as it did before. REQ-142's correctness claim is
 * that nothing changed, so making this better here would have made the claim
 * uncheckable. The D1 adapter is where multi-file atomicity arrives, and the
 * one-verb shape of {@link SiteWrite} is what lets it arrive without touching a
 * caller.
 */
export function fsSiteStore(ctx: StoreContext): SiteStore {
  const siteJsonPath = (slug: string): string => path.join(draftDir(ctx, slug), 'site.json')
  const pagesDir = (slug: string): string => path.join(draftDir(ctx, slug), 'pages')
  const assetsDir = (slug: string): string => path.join(draftDir(ctx, slug), 'assets')

  /**
   * The mtime/size of every file that feeds the render. Cheap enough to take on
   * each request (a site.json and a handful of page files) and exact enough that
   * a re-render happens when — and only when — the definition moved.
   */
  const stamp = (slug: string): string => {
    const dir = draftDir(ctx, slug)
    const rels = ['site.json']
    if (pathExists(pagesDir(slug))) {
      for (const name of fs.readdirSync(pagesDir(slug)).sort()) rels.push(path.join('pages', name))
    }
    return rels
      .map((rel) => {
        const info = fs.statSync(path.join(dir, rel), { throwIfNoEntry: false })
        return info ? `${rel}:${info.mtimeMs}:${info.size}` : `${rel}:-`
      })
      .join('|')
  }

  return {
    hasDraft(slug) {
      return Promise.resolve(pathExists(draftDir(ctx, slug)))
    },

    readSiteJson(slug) {
      const file = siteJsonPath(slug)
      if (!pathExists(file)) return Promise.resolve(null)
      return Promise.resolve(readJson<Record<string, unknown>>(file))
    },

    readPages(slug) {
      const dir = pagesDir(slug)
      const pages: StoredPage[] = listFilesRel(dir)
        .filter((rel) => rel.endsWith('.json'))
        .map((rel) => ({ name: rel, page: readJson<Record<string, unknown>>(path.join(dir, rel)) }))
      return Promise.resolve(pages)
    },

    write(slug, change: SiteWrite) {
      if (change.siteJson !== undefined) writeJson(siteJsonPath(slug), change.siteJson)
      for (const { name, page } of change.pages ?? []) writeJson(path.join(pagesDir(slug), name), page)
      for (const name of change.removePages ?? []) removePath(path.join(pagesDir(slug), name))
      if (change.assets?.length) {
        ensureDir(assetsDir(slug))
        for (const { name, bytes } of change.assets) {
          fs.writeFileSync(path.join(assetsDir(slug), name), bytes)
        }
      }
      for (const name of change.removeAssets ?? []) removePath(path.join(assetsDir(slug), name))
      return Promise.resolve()
    },

    listAssets(slug) {
      return Promise.resolve(listFilesRel(assetsDir(slug)))
    },

    readAsset(slug, name) {
      const root = assetsDir(slug)
      const abs = path.join(root, path.normalize(name))
      // Confined to the assets root: `..` in a name can never reach the
      // definition, the revisions, or anything else on the operator's disk.
      if (abs !== root && !abs.startsWith(root + path.sep)) return Promise.resolve(null)
      if (!fs.statSync(abs, { throwIfNoEntry: false })?.isFile()) return Promise.resolve(null)
      return Promise.resolve(new Uint8Array(fs.readFileSync(abs)))
    },

    counter(slug) {
      return Promise.resolve(draftCounter(ctx, slug))
    },

    appendChange(slug, entry) {
      return Promise.resolve(appendChange(ctx, slug, entry))
    },

    changesSince(slug, since) {
      return Promise.resolve(changesSince(ctx, slug, since))
    },

    pendingChanges(slug): Promise<PendingChanges> {
      const live = liveRevision(readHistory(ctx, slug))
      const prevDir = live === null ? null : revisionDir(ctx, slug, live)
      return Promise.resolve({ baseRevision: live, ...diffSnapshots(prevDir, draftDir(ctx, slug)) })
    },

    /**
     * The stamp, as a number: a hash of every definition file's mtime and size.
     *
     * It satisfies the contract's "changes whenever the draft does" and nothing
     * more. This adapter cannot offer compare-and-set (see
     * {@link SiteWrite.expect}), so the version has no second job here — it is
     * readable so that code written against the port stays adapter-agnostic, not
     * because passing it back to `write` would protect anything.
     */
    version(slug) {
      if (!pathExists(draftDir(ctx, slug))) return Promise.resolve(null)
      const text = stamp(slug)
      let hash = 0
      for (let i = 0; i < text.length; i += 1) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
      return Promise.resolve(hash >>> 0)
    },

    loadDraft(slug): Promise<DraftSnapshot | null> {
      if (!pathExists(draftDir(ctx, slug))) return Promise.resolve(null)
      return Promise.resolve({ result: loadSite(ctx, slug, 'draft'), stamp: stamp(slug) })
    },
  }
}
