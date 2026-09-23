import fs from 'node:fs'
import path from 'node:path'
import type { StoreContext } from './paths'
import { blobsDir, distDir, draftDir, revisionDir } from './paths'
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
import { contentDigest } from './digest'
import { appendHistory, readHistory } from './history'
import { appendChange, changesSince, draftCounter } from './journal'
import { loadSite } from './loadSite'
import type { RevisionContent, RevisionEntry, StoredSnapshot } from './revision-model'
import {
  ASSET_MANIFEST_NAME,
  decodeAssetManifest,
  encodeAssetManifest,
  nextRevisionOf,
  verifiedSnapshot,
} from './revision-model'
import type {
  AssetRef,
  DraftSnapshot,
  SiteStore,
  SiteWrite,
  StoredPage,
} from './site-store'
import { MissingContentError } from './site-store'

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
  const blobPath = (slug: string, digest: string): string =>
    path.join(blobsDir(ctx, slug), digest)

  /**
   * Digests already taken, keyed by the file they describe and its mtime/size
   * ([[REQ-304]]).
   *
   * WHY THIS TIER DERIVES RATHER THAN RECORDS. A digest is recorded beside the
   * asset wherever the store OWNS the asset — which D1 does and a directory on
   * an operator's disk does not. `storage/sandbox/` is the reproduction
   * substrate: the whole point of it is that an operator (or `1c repro`, or a
   * text editor) writes into `draft/assets/` directly, and a sidecar that no
   * longer described those files would be worse than no sidecar, because it
   * would be confidently wrong about what the site contains.
   *
   * THE STAMP IS THE SAME ONE {@link stamp} USES for the render cache, for the
   * same reason: mtime and size move whenever a file does, so a hit is a hit
   * about content rather than about a name. A publish therefore hashes each
   * picture once even though the draft snapshot, the ladder and the freeze all
   * ask about it.
   */
  const digested = new Map<string, string>()

  /**
   * This file's content digest, with its bytes placed in the blob space.
   *
   * ONE FILE IN HAND AT A TIME AND NEVER A STRING. `readFileSync` gives a
   * `Buffer` that is hashed and released, so the bound is the largest single
   * asset — the same bound the cloud tier holds to, reached differently because
   * the constraint there is an isolate and here is nothing at all.
   *
   * SELF-HEALING, BECAUSE THE FILES ARE NOT THIS STORE'S TO CONTROL. Whatever
   * route content arrived by — `write`, a checkout, an operator's editor — the
   * blob space learns about it the first time anything asks what it is, so a
   * freeze can always resolve a reference it was just handed.
   */
  const digestOfFile = async (slug: string, abs: string): Promise<string | null> => {
    const info = fs.statSync(abs, { throwIfNoEntry: false })
    if (!info?.isFile()) return null
    const stampKey = `${abs}:${info.mtimeMs}:${info.size}`
    const known = digested.get(stampKey)
    if (known !== undefined && pathExists(blobPath(slug, known))) return known
    const bytes = new Uint8Array(fs.readFileSync(abs))
    const digest = await contentDigest(bytes)
    const blob = blobPath(slug, digest)
    if (!pathExists(blob)) {
      ensureDir(blobsDir(ctx, slug))
      fs.writeFileSync(blob, bytes)
    }
    digested.set(stampKey, digest)
    return digest
  }

  /**
   * Copy one content out of the blob space, moving no bytes through this process.
   *
   * `COPYFILE_FICLONE` ASKS THE FILESYSTEM TO CLONE RATHER THAN COPY. On APFS
   * and btrfs — the operator's laptop, in practice — the new file shares the old
   * one's extents and nothing is written at all; elsewhere the kernel copies,
   * and either way not one byte enters this process. That is the file tier's
   * form of [[REQ-304]]'s "freezing copies no image bytes": the directory shape
   * DOC-12 §4 specifies is kept, because `loadSite(ctx, slug, <id>)` and
   * `1c serve --source published` read it, and the cost of keeping it is a
   * filesystem operation rather than a site-sized allocation.
   */
  const placeBlob = (slug: string, ref: AssetRef, dest: string): void => {
    const blob = blobPath(slug, ref.digest)
    if (!pathExists(blob)) throw new MissingContentError(slug, ref.name, ref.digest)
    ensureDir(path.dirname(dest))
    fs.copyFileSync(blob, dest, fs.constants.COPYFILE_FICLONE)
  }

  /** Every draft asset by name, content digest and size, sorted. */
  const manifestOf = async (slug: string): Promise<AssetRef[]> => {
    const refs: AssetRef[] = []
    for (const rel of listFilesRel(assetsDir(slug))) {
      const abs = path.join(assetsDir(slug), rel)
      const digest = await digestOfFile(slug, abs)
      // A name that lists but does not read is an asset whose bytes are gone; it
      // is omitted rather than thrown on, so the listing records the site as it
      // actually is and the absence shows up as a removal in the change list.
      if (digest === null) continue
      refs.push({ name: rel, digest, size: fs.statSync(abs).size })
    }
    return refs
  }

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
      assertWritableAssetNames(change.assetRefs)
      if (change.siteJson !== undefined) writeJson(siteJsonPath(slug), change.siteJson)
      for (const { name, page } of change.pages ?? []) writeJson(path.join(pagesDir(slug), name), page)
      for (const name of change.removePages ?? []) removePath(path.join(pagesDir(slug), name))
      if (change.assets?.length) {
        ensureDir(assetsDir(slug))
        for (const { name, bytes } of change.assets) {
          const abs = path.join(assetsDir(slug), name)
          fs.writeFileSync(abs, bytes)
          // [[REQ-304]] — the blob space learns the content here rather than at
          // the first read, because this is the one moment it is certainly new.
          await digestOfFile(slug, abs)
        }
      }
      // [[REQ-304]] — restoring by content: a filesystem clone out of the blob
      // space, so checking out a revision of a picture-heavy site reads none of
      // it into this process.
      for (const ref of change.assetRefs ?? []) {
        placeBlob(slug, ref, path.join(assetsDir(slug), ref.name))
      }
      for (const name of change.removeAssets ?? []) removePath(path.join(assetsDir(slug), name))
    },

    listAssets(slug) {
      return Promise.resolve(listFilesRel(assetsDir(slug)))
    },

    assetManifest(slug) {
      return manifestOf(slug)
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

    /**
     * [[REQ-304]] — one asset's bytes by CONTENT.
     *
     * The path is composed from the digest, and a digest that is not one names a
     * file nothing was ever written to — which reads back as `null`, the same
     * answer an unknown name gets. `path.basename` is what makes that true of a
     * caller that supplied a separator rather than a digest.
     */
    readBlob(slug, digest) {
      const abs = blobPath(slug, path.basename(digest))
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

    async writeRevision(slug, entry: RevisionEntry, content: RevisionContent) {
      // The frozen definition. A revision directory is what
      // `loadSite(ctx, slug, <id>)` reads, so it has to be shaped exactly like a
      // draft — which is why this tier keeps a real `assets/` beside the
      // manifest rather than the manifest alone.
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

      /*
       * [[REQ-304]] — THE MANIFEST IS WHAT MAKES THIS A FROZEN DEFINITION, and
       * the files beside it are what make it a readable directory.
       *
       * `assets.json` records which CONTENT each name was, which is what
       * `readRevision` answers with and what the revision's `sha` is taken over.
       * The `assets/` directory is then populated by cloning out of the blob
       * space — see {@link placeBlob} — so DOC-12 §4's shape survives, the
       * reproduction loop keeps reading it, and no picture passes through this
       * process on the way.
       *
       * WRITTEN EVEN WHEN A SITE HAS NO ASSETS, so its absence means one thing
       * only: this revision predates content addressing.
       */
      writeText(path.join(dir, ASSET_MANIFEST_NAME), encodeAssetManifest(content.source.assets))
      for (const ref of content.source.assets) {
        placeBlob(slug, ref, path.join(dir, 'assets', ref.name))
      }

      // The rendered artifact. It lands where `1c serve --source published`,
      // `1c shot` and the fidelity gate already look for it, so publishing keeps
      // feeding the reproduction loop rather than only the cloud.
      const out = distDir(ctx, slug, 'published')
      emptyDir(out)
      for (const [rel, text] of content.out) writeText(path.join(out, rel), text)
      // [[REQ-222]] — the delivery renditions, beside the pages that name them.
      // They land under `out/` only: a revision DIRECTORY is what a checkout
      // reads back as a draft, and derived bytes are not part of the definition.
      for (const [rel, bytes] of content.derived ?? []) {
        ensureDir(path.dirname(path.join(out, rel)))
        fs.writeFileSync(path.join(out, rel), bytes)
      }
      // The rendered tree carries the assets it references — `1c serve
      // --source published` and the fidelity gate serve THIS directory off
      // disk, so an `<img>` that resolved only while the draft held the file
      // would be a published site that decays. Cloned out of the blob space
      // like the revision's own copy.
      for (const ref of content.source.assets) {
        placeBlob(slug, ref, path.join(out, 'assets', ref.name))
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
      /*
       * [[REQ-304]] — THE MANIFEST, OR THE FILES A REVISION FROZEN BEFORE IT
       * LEFT BEHIND. The shape on disk decides, so there is no mode to detect:
       * a revision written under content addressing has an `assets.json`, and
       * one written before it has only the directory.
       *
       * THE OLDER SHAPE IS DERIVED ONE FILE AT A TIME, and each file's content
       * joins the blob space as it is read — which is what lets a revision
       * published before this change still be CHECKED OUT, since the restore is
       * by reference and a reference has to resolve.
       */
      const manifestFile = path.join(dir, ASSET_MANIFEST_NAME)
      const manifested = pathExists(manifestFile)
      let assets = manifested
        ? decodeAssetManifest(fs.readFileSync(manifestFile, 'utf8'))
        : null
      if (assets === null) {
        assets = []
        for (const rel of listFilesRel(path.join(dir, 'assets'))) {
          const digest = await digestOfFile(slug, path.join(dir, 'assets', rel))
          if (digest === null) continue
          assets.push({
            name: rel,
            digest,
            size: fs.statSync(path.join(dir, 'assets', rel)).size,
          })
        }
      }
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
      return verifiedSnapshot(slug, id, entry.sha, snapshot, manifested)
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
