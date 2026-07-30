/**
 * `1c deploy` (REQ-110) — ship rendered snapshots to the R2 artifact store.
 *
 * Serving, not storing: the canonical site definition stays on the laptop and
 * authoring is unchanged. What crosses the wire is the DOC-12 artifact — an
 * immutable, complete snapshot of `out/` plus the `source/` it was rendered from.
 */
export { cmdDeploy, formatDeployReport, DEPLOY_BASE_URL } from './deploy'
export type { DeployOptions, DeployResult, DeployStage } from './deploy'

export {
  collectSnapshotFiles,
  snapshotSha,
  formatBytes,
  SNAPSHOT_ID_LENGTH,
} from './content'
export type { SnapshotFile } from './content'

export {
  manifestKey,
  emptyManifest,
  serializeManifest,
  readManifest,
  writeManifest,
  ManifestConflictError,
} from './manifest'
export type { SiteManifest, ManifestPreview, ManifestRevision, ManifestRead } from './manifest'

export {
  DEPLOY_BUCKET,
  KEY_INDEX_KEY,
  contentTypeFor,
  WranglerR2Client,
  MemoryR2Client,
} from './r2'
export type { R2Client, WranglerR2Options } from './r2'
