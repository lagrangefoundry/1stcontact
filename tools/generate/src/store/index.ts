/**
 * The file-backed site store (DOC-12): path resolution, definition loading +
 * validation, full-snapshot revisions, whole-snapshot diffing, and the publish
 * history. This is the file-backed half of what the eventual D1/R2 layer
 * (REQ-7) will mirror.
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

export type { Snapshot } from './snapshot'
export { snapshot, nextRevisionId } from './snapshot'

export { diffSnapshots } from './diff'

export type { ChangeSet, RevisionEntry, History } from './history'
export { readHistory, appendHistory, liveRevision } from './history'

export type { DraftBase } from './base'
export { readDraftBase, writeDraftBase } from './base'
