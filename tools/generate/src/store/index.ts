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
export {
  padRevision,
  siteDir,
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
  DraftSnapshot,
  PendingChanges,
  SiteStore,
  SiteWrite,
  StoredAsset,
  StoredPage,
} from './site-store'
export { StoreConflictError } from './site-store'

export { MIME, contentTypeOf, extensionOf } from './content-type'

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

export type { Snapshot } from './snapshot'
export { snapshot, nextRevisionId } from './snapshot'

export { diffSnapshots } from './diff'

export type { ChangeSet, RevisionEntry, History } from './history'
export { readHistory, appendHistory, liveRevision } from './history'

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
