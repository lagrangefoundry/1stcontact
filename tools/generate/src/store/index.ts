/**
 * The site store (DOC-12): path resolution, definition loading + validation,
 * full-snapshot revisions, whole-snapshot diffing, and the publish history.
 *
 * ⚠️ THIS BARREL IS NODE-ONLY (REQ-142). It re-exports `fsutil` and the
 * filesystem adapter, so importing it pulls `node:fs` into the graph. Code that
 * has to run in a Worker imports the port and the model modules directly —
 * `./site-store`, `./assemble`, `./journal-model`, `./memory-store` — none of
 * which reach the filesystem. `edit.ts` is the standing example.
 */
export type { Root, RenderChannel, StoreContext } from './paths'
export { padRevision } from './revision-model'
export {
  siteDir,
  blobsDir,
  draftDir,
  revisionsDir,
  revisionDir,
  historyPath,
  draftBasePath,
  journalPath,
  distDir,
} from './paths'

export {
  pathExists,
  ensureDir,
  removePath,
  emptyDir,
  readJson,
  writeJson,
  writeText,
  listFilesRel,
  listDirs,
  copyDir,
  sameBytes,
} from './fsutil'

export type { SiteSource, LoadedSite, LoadResult } from './loadSite'
export { loadSite } from './loadSite'

export type { SiteParts } from './assemble'
export { assembleSite } from './assemble'

export type {
  AssetRef,
  DraftSnapshot,
  SiteStore,
  SiteWrite,
  StoredAsset,
  StoredPage,
} from './site-store'
export { MissingContentError, StoreConflictError } from './site-store'

export { CONTENT_DIGEST_LENGTH, contentDigest, isContentDigest } from './digest'

export type { ChangeSet, RevisionContent, RevisionEntry, StoredSnapshot } from './revision-model'
export {
  ASSET_MANIFEST_NAME,
  blobKey,
  canonicalJson,
  decodeAssetManifest,
  diffSnapshots,
  encodeAssetManifest,
  publishedAssetManifestKey,
  PUBLISHED_ROOT,
  publishedOutPrefix,
  publishedPrefix,
  publishedSourcePrefix,
  isEmptyChangeSet,
  liveRevisionOf,
  nextRevisionOf,
  snapshotEntries,
  snapshotSha,
  verifiedSnapshot,
  RevisionExistsError,
  RevisionIntegrityError,
  REVISION_SHA_LENGTH,
} from './revision-model'

// ONE TABLE, ONE READER ([[REQ-246]]). `MIME` itself is no longer exported —
// and no longer exists outside its own module — because a table four callers can
// index is four readers, which is how the drift this module's header predicted
// actually happened.
export {
  OCTET_STREAM,
  ACTIVE_CONTENT_TYPES,
  isActiveContentType,
  contentTypeEntries,
  contentTypeOf,
  extensionOf,
} from './content-type'

export {
  sanitizeAssetName,
  isUnsafeAssetName,
  assertWritableAssetNames,
  UnsafeAssetNameError,
} from './asset-name'

export type { ImportSummary } from './import-site'
export { importSite } from './import-site'

// The Cloudflare adapter (REQ-143). Exported from the node barrel too — it is
// worker-safe, but a node caller building the import path needs it, and a
// separate barrel per runtime would be a second list to keep in step.
export type {
  SiteStoreEnv,
  SiteStoreRoot,
  TenantRecord,
  TenantSiteStore,
} from './d1r2-store'
export { d1r2SiteStore, UnknownTenantError } from './d1r2-store'

export { fsSiteStore } from './fs-store'
export type { MemorySiteSeed, MemorySiteStore } from './memory-store'
export { memorySiteStore } from './memory-store'

export type { History } from './history'
export { readHistory, appendHistory } from './history'

export type { DraftBase } from './base'
export { readDraftBase, writeDraftBase } from './base'

export type { EditActor, JournalRecord, ChangeSlice, JournalFile } from './journal'
export {
  appendChange,
  changesSince,
  clip,
  draftCounter,
  readJournal,
  JOURNAL_TEXT_LIMIT,
  JOURNAL_WINDOW,
} from './journal'

// The reference store (REQ-155). Same split as above: the port, the pure name
// helpers and the two worker-safe adapters are re-exported here for node
// callers, and a Worker imports `./reference-store` / `./r2-reference-store`
// directly rather than through this barrel, which pulls `node:fs` in.
export type {
  ReferenceBundle,
  ReferenceStore,
  ReferenceStoreRoot,
} from './reference-store'
export {
  ASSETS_PREFIX,
  CAPTURE_MEMBER,
  FORMS_MEMBER,
  HINTS_MEMBER,
  L1_MEMBER,
  MULTISTATE_MEMBER,
  RAW_MEMBER,
  RENDERED_MEMBER,
  SCREENSHOT_MEMBER,
  bundleNameFor,
  ladderMember,
  pathSlug,
} from './reference-store'
export {
  bundleDir,
  bundleDirFor,
  fsReferenceBundle,
  fsReferenceStore,
  ladderScreenshotPath,
} from './fs-reference-store'
export { memoryReferenceBundle, memoryReferenceStore } from './memory-reference-store'

// The rights gate on the seed/push door (BUG-84). Worker-safe — it takes the
// port and hashes with WebCrypto — so a Worker imports `./asset-rights`
// directly for the same reason it imports `./reference-store` directly.
export { assertNotCaptureMirrored, MirroredAssetError, sha256Hex } from './asset-rights'
export type { ReferenceStoreEnv } from './r2-reference-store'
export { r2ReferenceStore } from './r2-reference-store'
