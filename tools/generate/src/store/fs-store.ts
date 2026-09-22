import fs from 'node:fs'
import path from 'node:path'
import type { StoreContext } from './paths'
import { distDir, draftDir, revisionDir } from './paths'
import {
  emptyDir,
  ensureDir,
  listFilesRel,
  pathExists,
  readJson,
  removePath,
  writeJson,
  writeText,
} from './fsutil'
import { assertWritableAssetNames } from './asset-name'
import { readDraftBase, writeDraftBase } from './base'
import { appendHistory, readHistory } from './history'
import { appendChange, changesSince, draftCounter } from './journal'
import { loadSite } from './loadSite'
import type {
  AssetStamp,
  RenditionSink,
  RevisionContent,
  RevisionEntry,
  SiteOutline,
  StoredSnapshot,
} from './revision-model'
import { nextRevisionOf, verifiedSnapshot } from './revision-model'
import type {
  DraftSnapshot,
  SiteStore,
  SiteWrite,
  StoredAsset,
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
 *
 * REVISIONS ARRIVED WITHOUT MOVING (REQ-149). The five revision verbs read and
 * write exactly what DOC-12 §4 already specified — `revisions/NNNN/`,
 * `history.json`, `.draft-base.json` — and the rendered output still lands in
 * `storage/dist/<root>/<slug>/published/`, where `1c serve --source published`
 * and the fidelity gate look for it. What changed is WHO drives them: publish is
 * `publish.ts`'s single sequence over the port, so the operator's disk and the
 * Worker's D1 now run the same publish rather than two that agree by inspection.
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

    /**
     * `async` SO A REFUSED NAME REJECTS RATHER THAN THROWING ([[REQ-246]]).
     *
     * The port declares `Promise<void>`, and until the name guard existed there
     * was nothing in here that could fail, so returning a resolved promise from
     * a synchronous body cost nothing. It costs something now: a caller holding
     * the promise — rather than awaiting the call in place — would see the
     * refusal escape past its own error handling, and the D1/R2 adapter would
     * reject where these two threw. One shape, every adapter.
     */
    async write(slug, change: SiteWrite) {
      // ONE RULE ABOUT NAMES, ACROSS EVERY ADAPTER ([[REQ-246]]). The D1/R2 store
      // is where an unsafe name used to be skipped silently; this adapter never
      // checked at all, so a name with a separator in it composed a path that
      // left the assets directory. Both are the same refusal now, from the same
      // statement of which names are refused.
      assertWritableAssetNames(change.assets)
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

    // ── revisions (REQ-149) ─────────────────────────────────────────────────
    //
    // The same `revisions/NNNN/` tree and `history.json` DOC-12 §4 has always
    // described — reached through the port instead of by `commands.ts` directly,
    // so the publish that drives them is the one the Worker drives too.

    revisions(slug): Promise<RevisionEntry[]> {
      return Promise.resolve(readHistory(ctx, slug).revisions)
    },

    // ONE PAST THE LOG, because this tier has no claim table to union with
    // ([[REQ-266]] §2). The operator's disk is a single writer — one process,
    // one `1c publish` at a time — so the read-then-write window the claim
    // closes in D1 cannot open here, and reserving an id would be machinery
    // guarding against a second publisher that does not exist.
    nextRevision(slug): Promise<number> {
      return Promise.resolve(nextRevisionOf(readHistory(ctx, slug).revisions))
    },

    /**
     * [[REQ-305]] — the published tree is emptied HERE, and the renditions land
     * in it as they are rendered.
     *
     * THE EMPTYING MOVED AND THE WRITING DID NOT. `writeRevision` used to empty
     * `dist/published/` at the top of its own body and write the renditions from
     * a map at the bottom. A rendition written before that call would have been
     * deleted by it — so the act that clears the tree has to happen before the
     * first rendition, which is exactly what this verb is. What lands is
     * unchanged: the same relative paths, under the same directory, beside the
     * pages that name them.
     *
     * `out/` ONLY, and the revision's own directory is still emptied by
     * `writeRevision`. A revision DIRECTORY is what a checkout reads back as a
     * draft, and derived bytes are not part of the definition — so nothing this
     * sink writes goes anywhere near it.
     */
    beginRevision(slug, _id): Promise<RenditionSink> {
      const out = distDir(ctx, slug, 'published')
      emptyDir(out)
      return Promise.resolve((rel: string, bytes: Uint8Array) => {
        ensureDir(path.dirname(path.join(out, rel)))
        fs.writeFileSync(path.join(out, rel), bytes)
        return Promise.resolve()
      })
    },

    async writeRevision(slug, entry: RevisionEntry, content: RevisionContent) {
      // The frozen definition, as a complete byte copy — a revision directory is
      // what `loadSite(ctx, slug, <id>)` reads, so it has to be shaped exactly
      // like a draft.
      const dir = revisionDir(ctx, slug, entry.id)
      emptyDir(dir)
      if (content.source.siteJson !== null) {
        writeJson(path.join(dir, 'site.json'), content.source.siteJson)
      }
      for (const { name, page } of content.source.pages) {
        writeJson(path.join(dir, 'pages', name), page)
      }
      // The same refusal as `write`, for the same reason ([[REQ-246]]) — a
      // publish that quietly omitted an asset would render a revision with a
      // hole in it and report success.
      assertWritableAssetNames(content.source.assets)

      for (const { name, bytes } of content.source.assets) {
        ensureDir(path.join(dir, 'assets'))
        fs.writeFileSync(path.join(dir, 'assets', name), bytes)
      }

      // The rendered artifact. It lands where `1c serve --source published`,
      // `1c shot` and the fidelity gate already look for it, so publishing keeps
      // feeding the reproduction loop rather than only the cloud.
      //
      // NOT EMPTIED HERE ANY MORE ([[REQ-305]]): `beginRevision` cleared this
      // directory and the renditions already in it were written through the sink
      // it opened, so emptying it again would delete them.
      const out = distDir(ctx, slug, 'published')
      for (const [rel, text] of content.out) writeText(path.join(out, rel), text)
      for (const { name, bytes } of content.source.assets) {
        ensureDir(path.join(out, 'assets'))
        fs.writeFileSync(path.join(out, 'assets', name), bytes)
      }

      // LAST, so the log never names a revision whose bytes are not all there.
      appendHistory(ctx, slug, entry)
    },

    async readRevision(slug, id): Promise<StoredSnapshot | null> {
      const dir = revisionDir(ctx, slug, id)
      if (!pathExists(dir)) return null
      const siteJsonFile = path.join(dir, 'site.json')
      const pages: StoredPage[] = listFilesRel(path.join(dir, 'pages'))
        .filter((rel) => rel.endsWith('.json'))
        .map((rel) => ({
          name: rel,
          page: readJson<Record<string, unknown>>(path.join(dir, 'pages', rel)),
        }))
      const assets: StoredAsset[] = listFilesRel(path.join(dir, 'assets')).map((rel) => ({
        name: rel,
        bytes: new Uint8Array(fs.readFileSync(path.join(dir, 'assets', rel))),
      }))
      const snapshot: StoredSnapshot = {
        siteJson: pathExists(siteJsonFile)
          ? readJson<Record<string, unknown>>(siteJsonFile)
          : null,
        pages,
        assets,
      }

      // [[REQ-266]] §4 — VERIFIED AGAINST THE LOG'S OWN DIGEST. `history.json`
      // and `revisions/NNNN/` are two files on a disk anyone with the checkout
      // can edit, and a revision directory quietly changed after the fact is
      // exactly what a checkout would then restore. The comparison is the shared
      // {@link verifiedSnapshot}, so this tier refuses identically to the cloud.
      //
      // WHEN THE LOG HAS NO ENTRY the directory is all there is, and there is
      // nothing to verify AGAINST — a half-written publish, or a tree copied in
      // by hand. It reads back unverified rather than being refused, which is
      // the behaviour that existed before this and the only one the absence of a
      // record can support.
      const entry = readHistory(ctx, slug).revisions.find((r) => r.id === id)
      if (entry === undefined) return snapshot
      return verifiedSnapshot(slug, id, entry.sha, snapshot)
    },

    /**
     * [[REQ-303]] — the draft with its assets stamped by SIZE, from the
     * directory entry rather than from the file.
     *
     * `statSync` AND NOT `readFileSync`, which is the whole verb. A change count
     * is derived before every model call, and reading fifty megabytes of
     * pictures to produce a number is what killed the isolate in the cloud tier;
     * this tier is not where that happened, but a port verb whose cost differs
     * by adapter is a verb whose callers learn which one they have.
     *
     * SIZE AND NOT MTIME, even though a directory entry offers both. A
     * revision's copy of an asset is written at publish and the draft's original
     * is older, so a stamp carrying a modification time would report every asset
     * modified the moment it was published. Size is the one thing a directory
     * entry knows that BOTH copies agree about when the bytes agree.
     */
    draftOutline(slug): Promise<SiteOutline> {
      const dir = assetsDir(slug)
      return Promise.resolve({
        siteJson: pathExists(siteJsonPath(slug))
          ? readJson<Record<string, unknown>>(siteJsonPath(slug))
          : null,
        pages: listFilesRel(pagesDir(slug))
          .filter((rel) => rel.endsWith('.json'))
          .map((rel) => ({
            name: rel,
            page: readJson<Record<string, unknown>>(path.join(pagesDir(slug), rel)),
          })),
        assets: listFilesRel(dir).map(
          (rel): AssetStamp => ({
            name: rel,
            stamp: String(fs.statSync(path.join(dir, rel), { throwIfNoEntry: false })?.size ?? -1),
          }),
        ),
      })
    },

    /** [[REQ-303]] — the same shape for a revision directory, and unverified. */
    revisionOutline(slug, id): Promise<SiteOutline | null> {
      const dir = revisionDir(ctx, slug, id)
      if (!pathExists(dir)) return Promise.resolve(null)
      const assets = path.join(dir, 'assets')
      return Promise.resolve({
        siteJson: pathExists(path.join(dir, 'site.json'))
          ? readJson<Record<string, unknown>>(path.join(dir, 'site.json'))
          : null,
        pages: listFilesRel(path.join(dir, 'pages'))
          .filter((rel) => rel.endsWith('.json'))
          .map((rel) => ({
            name: rel,
            page: readJson<Record<string, unknown>>(path.join(dir, 'pages', rel)),
          })),
        assets: listFilesRel(assets).map(
          (rel): AssetStamp => ({
            name: rel,
            stamp: String(
              fs.statSync(path.join(assets, rel), { throwIfNoEntry: false })?.size ?? -1,
            ),
          }),
        ),
      })
    },

    draftBase(slug) {
      return Promise.resolve(readDraftBase(ctx, slug).basedOn)
    },

    setDraftBase(slug, id) {
      writeDraftBase(ctx, slug, id)
      return Promise.resolve()
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
