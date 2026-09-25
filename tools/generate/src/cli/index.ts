import { parseArgs } from './args'
import { withCleanStdout } from './stdio'
import {
  cmdCheckout,
  cmdList,
  cmdNew,
  cmdPublish,
  cmdRender,
  cmdRevisions,
  cmdVerify,
  ctxOf,
  type GlobalOptions,
} from './commands'
import { spawn } from 'node:child_process'
import { devEnvLayering, devUrl, devVarsPath, readDevEnv, wranglerDevArgs } from './dev-env'
import { localD1Check } from './d1-migrations'
import {
  DEV_SERVE_PORT,
  devServeArgs,
  noSnapshotMessage,
  readSnapshot,
  snapshotSummary,
} from './dev-snapshot'
import { repoRoot } from './webui'
import { cmdAssets, formatAssetReport } from './assets'
import { accessAdvice } from './push'
import {
  accessFor,
  assertDataClass,
  copyChats,
  copySite,
  endNamesFor,
  endsFor,
  exportChats,
  exportSite,
  serviceToken,
  CLOUD_ORIGIN,
  LOCAL_ORIGIN,
  type CopyDirection,
  type DataClass,
} from './copy'
import { bundleDir, fsReferenceBundle, fsReferenceStore, fsSiteStore } from '../store'
import {
  editAssetAdd,
  editAssetGet,
  editAssetList,
  editAssetRm,
  editAssetWrite,
  editBehaviorList,
  editChanges,
  editCopyGet,
  editCopySet,
  editConfigGet,
  editConfigSet,
  editModuleAdd,
  editModuleConfigure,
  editModuleRm,
  editModuleUpgrade,
  editPageAdd,
  editPageCopy,
  editPageGet,
  editPageList,
  editPageRm,
  editPageUpdate,
  editPaletteAdd,
  editPaletteGet,
  editPaletteRename,
  editPaletteRm,
  editPaletteSet,
  editStatus,
  cmdApplyGapFixes,
  parseConfigValue,
  type EditOptions,
  type EditOutput,
} from './edit'
import { cmdCapturePage, cmdCaptureList, combineAudits, runCaptureAudit, createPlaywrightDriver } from './capture'
import { cmdFontsCheck, formatFontsReport } from './fonts'
import { cmdFontsCatalogue, formatCatalogueReport } from './font-catalogue'
import {
  cmdFontsMirror,
  cmdFontsPublish,
  cmdFontsSeed,
  formatMirrorReport,
  formatPublishReport,
  seedAfterMirror,
} from './font-mirror'
import { buildIndex, cmdFontsIndex, formatIndexReport } from '../fonts/index-build'
import { cmdFontsDoc, formatFontDocReport } from './font-doc'
import {
  cmdColors,
  cmdColorsAssign,
  formatAssign,
  formatCensus,
  SHADE_FIT_TOLERANCE,
} from './colors'
import { cmdRefold, cmdRepro, cmdL1Gate } from './repro'
import { cmdGate, formatGateReport } from './gate'
import type { SeverityTier } from './capture/values-diff'
import { CommandError, EXIT_CODES, InvalidDefinitionError } from './errors'
import { assertInstall, checkInstall, COMMAND_DEPS, INSTALL_COMMAND } from './preflight'
import { assertOneWorkerd, checkWorkerd, workerdGateKey } from './workerd'
import {
  devDown,
  devReap,
  devUp,
  formatDown,
  formatReap,
  formatUp,
  readDevPidfiles,
} from './dev'
import { devProcessTable, formatProcessTable } from './ps'
import {
  assertIndexSeam as assertIndexSeamImpl,
  assertSharedStore as assertSharedStoreImpl,
  checkSharedStore as checkSharedStoreImpl,
} from './shared-store'
import { startBuilder } from './builder'
// [[REQ-273]] — the listener that lets the Worker's assistant file a defect
// into the project that builds it. It has to be a Node process, because workerd
// has no `node:child_process`; [[BUG-124]] is why nothing beyond that is true of
// it any more — the address is a setting both `1c` and the Worker read, not a
// value minted at launch and pushed at wrangler.
import {
  filingStatus,
  provisionFilingVars,
  startFilingService,
  type FilingService,
} from './filing'
import {
  builderIsRunning,
  humanBytes,
  performReset,
  resetPlan,
} from './reset'
import {
  ensureConfig,
  exportCorpus,
  kbEnsure,
  kbStatus,
  runKbBuild,
  writeProjections,
  DOC_KIND_FIELD,
  MEMBER_KIND,
  KB_USAGE,
} from './kb'
import { cmdShot, VIEWPORTS, type ViewportName } from './shot'
import {
  cmdValuesDiff,
  cmdValuesDiffMultiViewport,
  formatReport,
  formatMultiViewportReport,
  formatCollapsedReport,
  collapseMultiViewport,
  clusterDefects,
  formatClusterReport,
} from './fidelity'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { cmdDiff, cmdCrop, formatDiffReport, type DiffTuning, type RegionBox } from './perceptual'
import { cmdAlignedCrops } from './aligned-crops'
import { cmdResponsiveDiff, classifyResponsiveTable, formatResponsiveTable, formatClassifiedTable } from './responsive-diff'
import type { RenderChannel } from '../store'

export * from './commands'
export * from './edit'
export * from './capture'
export {
  cmdFontsCheck,
  loadFontRegistry,
  collectFontUsages,
  collectFontFilesOnDisk,
  formatFontsReport,
  assetBasename,
  registryPath,
  REGISTRY_REL,
} from './fonts'
export type {
  FontsCheckReport,
  FontUsage,
  FontFileOnDisk,
  FontViolation,
  FontWarning,
  ViolationKind,
} from './fonts'
export {
  cmdFontsCatalogue,
  formatCatalogueReport,
  joinFamilies,
  diffCatalogue,
  readCatalogue,
  renderCatalogueMarkdown,
  parseMetadataPb,
  parseLiveMetadata,
  indexMetadataDir,
  familySlug,
  caveatsFor,
  defaultSources,
  REDISTRIBUTABLE_LICENCES,
  CATALOGUE_JSON_REL,
  CATALOGUE_MD_REL,
  LICENCE_NAMES,
} from './font-catalogue'
export type {
  Catalogue,
  CatalogueEntry,
  CatalogueAxis,
  CatalogueChange,
  CatalogueReport,
  CatalogueSources,
  ExcludedFamily,
  LicenceIndex,
  LiveFamily,
} from './font-catalogue'
export {
  cmdFontsDoc,
  formatFontDocReport,
  projectFontDoc,
  resolveFontDocTicket,
  groupOf,
  entryLine,
  DOC_GROUPS,
  GROUP_SIZE,
  DOC_SOURCE_VALUE,
} from './font-doc'
export type { FontDocProjection, FontDocReport, DocTicketRef } from './font-doc'
export { CommandError, EXIT_CODES } from './errors'
export type { ErrorCode, CommandErrorShape } from './errors'
export { startServe } from './serve'
export { resolveStaticFile, sendFile } from './static-file'
export type { ServeOptions, ServeHandle } from './serve'
export { startBuilder, handleBuilderRequest } from './builder'
export type { BuilderOptions, BuilderHandle } from './builder'
export { PreviewRenderer } from './preview'
export type { PreviewChannel, PreviewFile, DraftSnapshot } from './preview'
export {
  webuiPackageDir,
  webuiExports,
  webuiRoots,
  WEBUI_PACKAGES,
  WEBUI_SCOPE,
  MissingWebuiComponentError,
} from './webui'
export { devEnvLayering } from './dev-env'
export type { DevEnvFile, DevEnvLayering } from './dev-env'
export { cmdShot, VIEWPORTS } from './shot'
export type { ShotOptions, ShotResult, ViewportName } from './shot'
export {
  cmdAlignedCrops,
  subRenderOptions,
  pickAnchors,
  alignedAreas,
  refAnchorsAt,
  normText,
  areaSlug,
  type AlignedArea,
  type AlignedCropsOptions,
  type AnchorEl,
  type Box as AlignedBox,
} from './aligned-crops'
export { cmdValuesDiff, cmdValuesDiffMultiViewport, formatReport, formatMultiViewportReport } from './fidelity'
export { collapseMultiViewport, formatCollapsedReport, type CollapsedDefect } from './fidelity'
export { clusterDefects, formatClusterReport, type DefectCause } from './fidelity'
export {
  cmdResponsiveDiff,
  buildResponsiveTable,
  formatResponsiveTable,
  classifyResponsiveTable,
  formatClassifiedTable,
} from './responsive-diff'
export type {
  ResponsiveDiffOptions,
  ResponsiveTable,
  ResponsiveRow,
  ResponsiveCell,
  ResponsiveSize,
  LabelledProjection,
  ResponsiveChangeKind,
  RowClassification,
  ClassifiedTable,
} from './responsive-diff'
export type { ValuesDiffOptions } from './fidelity'
export {
  cmdDiff,
  cmdCrop,
  computeDiff,
  deriveRegions,
  decodeImage,
  decodeImageBytes,
  cropRaster,
  extractRect,
  nodeScaleFor,
  resolveRegionNodes,
  writeRasterPng,
  formatDiffReport,
} from './perceptual'
/**
 * The codec, exported in its own right (REQ-156).
 *
 * `decodeImage` and friends are the *filesystem* spelling of these, and a caller
 * that already holds bytes — a Worker reading a screenshot out of R2, most of
 * all — should not have to reach through a file-shaped seam to decode them.
 */
export { decodePng, encodePng, pngDimensions, sniffImageFormat, UnsupportedImageError, PngFeatureError, PngCorruptError } from './png'
export type {
  DiffOptions,
  DiffTuning,
  CoreDiffResult,
  DiffRegion,
  NodeSource,
  PerceptualDiffReport,
  Raster,
  RegionBox,
  RegionNode,
  RegionNodeOptions,
  RegionNodes,
  CropOptions,
} from './perceptual'
export {
  cmdGate,
  referenceCoverage,
  reconcileGates,
  formatGateReport,
  PERCEPTUAL_MEAN_FLOOR,
  PERCEPTUAL_PCT_FLOOR,
  VALUES_TIER_FLOOR,
  SECTION_DENSITY_PX,
} from './gate'
export type {
  GateOptions,
  GateReport,
  GateVerdict,
  ReferenceCoverage,
  CoverageFinding,
  GateFloor,
  ReconcileInput,
} from './gate'
export { parseArgs } from './args'
export { withCleanStdout } from './stdio'
export {
  assertInstall,
  checkInstall,
  COMMAND_DEPS,
  INSTALL_COMMAND,
  GENERATE_PKG_REL,
  LOCKFILE_REL,
  INSTALLED_LOCKFILE_REL,
} from './preflight'
export type { PreflightFinding, PreflightReport, PreflightOptions, Resolver } from './preflight'
export {
  DEV_PORT_BAND,
  KNOWN_SERVICES,
  classifyCwd,
  devProcessTable,
  formatProcessTable,
  inDevPortBand,
  knownPort,
  listenerCwds,
  parseLsofSockets,
  PROCESS_TABLE_HEADER,
  repoTopology,
  splitListenName,
} from './ps'
export type {
  DevListener,
  DevProcessTable,
  KnownService,
  ListenerOrigin,
  RepoTopology,
} from './ps'
export {
  DEV_SERVICES,
  devDeploy,
  devDown,
  devReap,
  devStateDir,
  devTable,
  devUp,
  formatDown,
  formatReap,
  formatUp,
  pidAlive,
  readDevPidfiles,
  removeDevPidfile,
  writeDevPidfile,
} from './dev'
export type {
  DevDeployStep,
  DevDownOutcome,
  DevPidfile,
  DevReapOutcome,
  DevService,
  DevStarted,
  DevUpOutcome,
} from './dev'
export {
  DEV_SERVE_PORT,
  devServeArgs,
  noSnapshotMessage,
  readSnapshot,
  snapshotDir,
  snapshotSummary,
  SNAPSHOT_DIR,
  SNAPSHOT_MANIFEST,
} from './dev-snapshot'
export type { DevSnapshot } from './dev-snapshot'
export {
  assertOneWorkerd,
  checkWorkerd,
  scanWorkerd,
  workerdGateKey,
  workspaceManifests,
  WORKERD,
  WORKERD_GATED_COMMANDS,
  WORKERD_PIN_COMMAND,
} from './workerd'
export type {
  WorkerdFinding,
  WorkerdInstance,
  WorkerdOptions,
  WorkerdReport,
  WorkerdScan,
} from './workerd'
export {
  assertIndexSeam,
  assertSharedStore,
  checkIndexSeam,
  checkSharedStore,
  sharedComponents,
  SHARED_SERVER_COMPONENTS,
  SHARED_STORE_INSTALL_COMMAND,
} from './shared-store'
export type { IndexSeamProbe, SeamReport } from './shared-store'
export type {
  ComponentResolver,
  MissingSharedComponent,
  SharedComponentSurface,
  SharedStoreReport,
} from './shared-store'

const USAGE = `1c — file-backed site storage, versioning & server-side render (REQ-9)

Usage:
  1c new <slug>
  1c list
  1c render <slug> [--source draft|latest|<revId>] [--edit] [--out <dir>]
    --edit renders the third channel (REQ-116): the page the builder's editor works on.
    Always from draft/. Deliberately non-functional — no link target, no form action, no
    behaviour or motion script — so all content shows at once, and every editable region
    is outlined and stamped with its address. Never published; lands in dist/<slug>/edit/.
  1c publish <slug> [-m "message"] [--by <id>]
    Freezes the draft as the next revision, renders it, and records what changed.
    An UNCHANGED draft mints nothing and says so (REQ-149) — publishing twice in a
    row is a no-op, not a second revision describing no difference.
  1c checkout <slug> [<revId>] [--force]
    Replaces the draft with a revision. Forward-only: publishing afterwards mints a
    NEW highest revision recording what it descended from — history never rewinds.
  1c revisions <slug>
  1c verify <slug>
    Recomputes every published revision's digest and reports any whose stored bytes
    no longer match the log. A published revision is immutable (REQ-266); this is how
    you ask whether the history still is, without checking each one out by hand.
  1c reset [--yes] [--include-public] [--port <n>]
    Empties the LOCAL dev store: apps/control-app/.wrangler/state, which is where
    \`wrangler dev\` persists D1 and R2 — every site, page, change journal, asset,
    revision, chat transcript, ticket, tenant and audit record. Removing it is what
    a fresh clone would have. storage/ is never touched, and nothing under it is a
    source a re-seed could come from: every site lives in the store this empties, and
    \`bin/copy-from-cloud\` is how one comes back.
    Without --yes it PREVIEWS: prints what it would remove and deletes nothing.
    Refuses while the builder is answering on --port (default 8788) — a live
    miniflare holds those SQLite files open, so deleting under it corrupts the
    store rather than resetting it. Stop the server first.
    --include-public extends it to apps/public-site/.wrangler/state.

  1c builder [--port <n>] [--remote] [--no-filing]
    Starts \`wrangler dev\` on apps/control-app — the builder itself, with the same
    routes, store and runtime as production. Serves what \`1c assets\` built, so run
    that first. The store is the LOCAL simulated D1/R2, and it starts empty: author in
    the builder, or bring a site down with \`bin/copy-from-cloud <business>\`.
    --remote points at the deployed D1 and R2, which means editing production data.
    Refuses to start when the local database is behind db/migrations/, naming the
    pending files and the command that applies them; --remote skips that check,
    because the deployed database is \`bin/deploy\`'s to migrate.
    It also starts a loopback FILING SERVICE (REQ-273) unless one is already
    answering, so the assistant can report a defect in this software into THIS
    project's ticket store — never into the client's.
    Filing no longer depends on this command: the address lives in .dev.vars, so
    a dev server started any other way has it too (BUG-124). The banner reports
    what is actually ANSWERING at that address rather than what this process did.
    --no-filing starts no listener. It does not un-configure the address, which
    this command does not own — the assistant is still offered the tool and is
    told the project is unreachable when it uses it, which the banner also says.
  1c ps [--json]
    Every server this project has running, with its pid, its port and the directory
    it was started from ([[REQ-319]]). Built on \`lsof\`, not \`ps\` — \`ps aux\` returns
    nothing at all under an agent sandbox, which is the condition that let eight
    zombie listeners accumulate unseen. Each row is classified by its working
    directory: this checkout, an .xgd worktree of this repo, another project, or
    undeterminable. A port no constant names is still a row, naming the cwd and
    saying the service is unrecognised — an unnamed listener inside this repo's tree
    is exactly what has never been visible. Listeners belonging to other projects
    are reported so a port collision is legible, and are never reaped.
    It returns the table as a VALUE: \`bin/dev down\` and \`bin/dev reap\` read the
    same function rather than parsing this output.

  1c workerd [--json] [--quiet]
    Which \`workerd\` versions resolve in this tree, and what brought each one
    ([[REQ-316]]). Exactly one is the invariant: \`.wrangler/state\` is workerd's own
    store and the first version to open it migrates that schema forward silently and
    one-way, after which the other dies inside SQLite naming an internal table no
    schema here owns. Exits 6 when more than one resolves. --quiet prints nothing
    when the tree is fine, which is how \`bin/deploy --env dev\` uses it: the guard in
    front of the only copy of the dev data.

  1c dev up | down | reap | serve [--dry-run] [--json]  (\`bin/dev\` is the launcher)
    up    Deploys to the local dev target (REQ-318's \`bin/deploy --env dev\`, skipped
          with a line while that target does not exist), then starts filing, the
          builder, the public site and access-sim in dependency order and records a
          pidfile per service under storage/tmp/dev. A service already answering is
          left alone rather than duplicated.
    down  SIGTERMs what the pidfiles name, then VERIFIES the ports are free through
          \`1c ps\` rather than assuming the signal landed. Exits non-zero when a port
          it was asked to free is still answering, and removes that service's pidfile
          so \`reap\` inherits it.
    serve Runs the DEPLOYED snapshot ([[REQ-318]]): \`wrangler dev --no-bundle\` against
          apps/control-app/.dev-snapshot, on port ${DEV_SERVE_PORT} — not 8788, so it
          runs beside the old path against the same store. It is FROZEN by
          construction: editing a source file changes nothing here until the next
          \`bin/deploy --env dev\`. Refuses when the local database is behind
          db/migrations/, and when more than one \`workerd\` resolves — the store is
          the only copy of the dev data. --port overrides.
    reap  The backstop. Kills every listener whose cwd is this checkout or an .xgd
          worktree of it and which no pidfile claims — SIGTERM, then SIGKILL what is
          still there. It is not redundant with \`down\`: a worktree torn down
          mid-session takes its pidfile with it, so \`down\` can never be run there,
          and four of the eight zombies arrived exactly that way. \`--dry-run\` lists
          what it would stop and kills nothing. It distinguishes killed from could
          not kill — a detached listener started inside an agent sandbox survives a
          kill sent from inside it, and only the operator can stop those.

  1c filing [--port <n>] [--token <t>]
    Starts the filing service on its own and waits. Use it when the dev server
    is started some other way — by hand, from an editor, or alongside
    \`bin/access-sim\`. The first run in a clone mints the bearer and writes both
    DEVELOPMENT_TICKETS_* lines into apps/control-app/.dev.vars; after that the
    address is a setting every launch path reads. A DEPLOYED builder has neither
    var and gets no filing tool at all, which is correct — there is no project.

System knowledge base (REQ-123) — what the builder AI knows, as a release artefact:
  1c kb build
    Write kb/system/ — every opted-in doc ticket, plus the generated REF-*
    reference — then index it, chunk it, and generate the
    awareness map. Needs CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN for the
    embedding model; the map's paragraphs come from the Claude Code CLI when no
    ANTHROPIC_API_KEY is set.
  1c kb ensure     build only if the index is behind its corpus — the KB stage
                   \`bin/build\` runs, which is why building the thing is one
                   command and not two (REQ-322). A coherent index costs no
                   credential and no request; \`--force\` builds regardless, which
                   is what \`bin/kb-release\` runs.
  1c kb export     the corpus only — no embedding, no credentials
                   (both producers: opted-in doc tickets, and the generated
                    REF-* reference projected from the code)
  1c kb status     what is built

Build preflight (REQ-144) — what \`bin/build\` runs before it builds:
  1c preflight
    Reports every shared-store component and every declared package, then fails
    with exit 6 naming what is absent. The shared components are delivered out
    of band, so \`pnpm install\` cannot supply them and the lockfile cannot notice
    them missing — and a missing BROWSER component yields an import map that
    loads and then fails at the first import, in the operator's browser. This is
    where that is caught instead.

Copy a business between builders (REQ-289, REQ-294) — what \`bin/copy-to-cloud\` runs:
  1c copy-to-cloud   <business> [--origin URL] [--force] [--backup FILE]
  1c copy-from-cloud <business> [--origin URL] [--force] [--backup FILE]
                     [--site|--chats|--contacts] [--client-id ID --client-secret SECRET]
                     [--local-client-id ID --local-client-secret SECRET] [--json]
    Reads one business's site out of one builder through GET /api/export and writes it
    into the other through POST /api/import — the same payload, the matched pair of routes.
    <business> is the business's NAME as it reads in the builder ("Lagrange Foundry");
    it resolves to a different id on each side, and both calls name their side's id
    explicitly. The target business must ALREADY EXIST on the far side: this never
    creates one. --origin overrides the non-cloud end (default http://localhost:8788,
    or point it at \`bin/access-sim\`). REFUSED with 409 when the target
    carries changes made in the BUILDER (BUG-51); --force says you mean it.
    --backup FILE writes the SOURCE side's export to FILE and touches the destination
    not at all.
    This is NOT \`1c publish\`, which mints a revision, and NOT \`1c copy\`, which edits text.

    THREE CLASSES, AND THEY ARE SEPARATE PAYLOADS ON PURPOSE (REQ-294):
      --site     the default. site.json, the page documents and the asset bytes.
      --chats    this business's consultant conversations — every chat ticket, its
                 transcript, its engagement ledger and its standing note. A second
                 pair of routes (/api/chats/export, /api/chats/import), so a site
                 copy still carries a site and nothing else. Matched by session id:
                 running it twice duplicates no turn. A conversation the far side
                 already holds is KEPT and counted; --force replaces it. Carried
                 to-cloud only — refused from-cloud, because the local builder runs
                 with ACCESS_DEV_OPEN=1 and a conversation is whatever the customer
                 typed.
      --contacts recognised and not carried, in either direction, for that reason
                 and its own.

    TWO ENDS, TWO CREDENTIALS (BUG-134), because the two builders can be behind
    two different gates and a copy has to satisfy both in one run:
      CLOUD end  app.1stcontact.io, behind Cloudflare Access.
                 CF_ACCESS_CLIENT_ID + CF_ACCESS_CLIENT_SECRET, or --client-id and
                 --client-secret. Provision with \`bin/access-token\`.
                 CLOUDFLARE_API_TOKEN is an API credential and is not one of these.
      LOCAL end  whatever --origin names. Behind a gate only when it is
                 \`bin/access-sim\`, which accepts ONLY its own pair.
                 LOCAL_ACCESS_CLIENT_ID + LOCAL_ACCESS_CLIENT_SECRET, or
                 --local-client-id and --local-client-secret. Unset, the cloud pair
                 is used for this end too — which is right when one credential
                 genuinely serves both, or when the local builder has no gate.
                 \`bin/access-sim --print-token\` prints its pair under the CLOUD
                 names; put those two values in the LOCAL_ ones, do not eval it.

Control-app assets (REQ-145) — the build step behind /builder, /webui and /framework:
  1c assets [--json]
    Copies the builder client and each installed webui component into
    apps/control-app/dist-assets/, type-strips the framework bridges once, and
    writes the derived import map the Worker serves in its chrome document.
    Nothing is type-stripped, transpiled or resolved at request time afterwards.

Reference capture (REQ-12, REQ-83) — rendered-only headless-browser capture:
  1c capture list [--json]
    The captures already on disk, freshest first ({name, dir, url, capturedAt}).
    Bundles are named after the host that ANSWERED, so which captures exist is a
    question only the engine can answer — the reproduction console reads this to
    offer a stored site back without re-hitting it (REQ-254).

  1c capture audit [<bundleName>] [--all] [--json]
    What does this page USE that the capture does not carry? (REQ-275)
    Walks the STORED bundle's own rendered DOM in a real browser, enumerates every CSS longhand
    whose rule matches a visible element (plus inline styles and DOM attributes), and triages each
    against the coverage register. Reports the properties nothing has decided about — the axes a
    reproduction round would otherwise discover one at a time — plus what the extractor records
    and this bundle carries no instance of. --all audits every stored bundle and combines.

  1c capture page <url> [--json]
    --json reports the bundle machine-readably ({url, name, dir, sections, assets, l1Nodes, widths}).
    The bundle is named after the host that ANSWERED, which may not be the one typed, so a
    program that captures and then points --ref at the result cannot derive the directory.
    Writes the bundle (capture.json, screenshots, raw/rendered html, assets) plus the multi-viewport
    ladder (multistate.json — the acceptance oracle), the ladder folded into ONE L1 document
    (l1.json: geometry keyframes + interpolate/snap + visibility), and advisory structural hints
    (hints.json: parent layout, sizing unit, position mode, @media breakpoints — read for direction, never executed).

L1 reproduction pipeline (REQ-88) — turn a capture bundle into a servable, gate-able 1c site:
  1c repro <slug> --ref <captureBundleDir>
    Import the bundle's folded l1.json as a raw-L1 home page site (idempotent — re-import rebuilds).
    The normal render/serve/shot/diff/values-diff loop then works on the reproduction unchanged.
  1c refold --ref <captureBundleDir>
    Re-derive the bundle's l1.json + forms.json from its OWN retained multistate.json, offline.
    Both are a pure function of the oracle and the current fold, so every fold change makes every
    stored bundle stale; this picks the change up without re-hitting the site (which would also
    re-roll the oracle, landing a fold change and a reference change inseparably).
  1c l1-gate --ref <captureBundleDir> [--json]
    The mechanical 3-probe acceptance gate: fold multistate.json → base, promoteToFlow → recovered,
    then sample-fidelity · off-sample · content-robustness. Exits non-zero while any probe fails;
    each residual names a framework gap (missing L1 axis / capture hint / region needing promotion).

Cross-gate reconciliation (REQ-94) — run l1-gate + values-diff + perceptual diff and COMPARE them:
  1c gate <slug> --ref <captureBundleDir> [--source draft|published] [--size mobile|tablet|desktop]
          [--out <dir>] [--json] [--mean-floor <0-255>] [--pct-floor <0-100>]
          [--values-tier <CRITICAL|HIGH|MEDIUM|LOW|none>]
  1c gate --ref <captureBundleDir> --actual-image <png> --actual-manifest <manifest.json> [--out <dir>] [--json]
    (BUG-103) with --out, writes actual-manifest.json, expected-manifest.json and actual.png beside
    values-diff.json / regions.json / gate.json — the artifacts that describe the REPRODUCTION rather than
    the comparison. No flag: the reproduction console already passes --out, and evidence a round has to know
    to ask for is evidence it will not have.
    l1-gate is blind to colour/font/media BY DESIGN and values-diff can only compare elements present in
    BOTH manifests — so a page whose capture missed its imagery passes both while the perceptual eye reads
    80% of pixels wrong. This verb makes that DISAGREEMENT the finding. A perceptual FLOOR fails the run
    regardless of the value gates, and a value-gate TIER floor fails it regardless of the pixels — a lost
    heading, or a link that is no longer a link, moves no pixel at all, so the eye is structurally unable
    to see it and only the value gate can. Default: no delta above MEDIUM (so tone and treatment drift
    still passes, as it always did); --values-tier none holds the value gate to nothing.
    The verdict names the likely cause:
      capture-incomplete       the reference manifest is impoverished vs the reference screenshot —
                               fix the CAPTURE; value deltas against it are not yet evidence
      reproduction-wrong       both eyes agree (coverage clean), OR the eye is within its floor and a
                               delta above the value floor failed it — work the values-diff deltas
      unexplained-disagreement nothing but pixels sees it — a pixel-moving axis the manifest lacks
    Reference coverage (mirrored-vs-referenced images, page height per section) is reported every run.

Screenshot primitive (REQ-13) — AI eyes; PNG of our own output or any URL:
  1c shot <slug> [--source draft|published] [--viewport mobile|tablet|desktop] [--out <file>]
  1c shot --url <url> [--viewport mobile|tablet|desktop] [--out <file>]

Fidelity values-diff (REQ-31) — mechanical per-element value comparison:
  1c values-diff <slug> --ref <captureBundleDir> [--source draft|published] [--out <file>] [--json]
  1c values-diff --ref <captureBundleDir> --actual <manifest.json> [--out <file>] [--json]
    (BUG-103) --actual-out <manifest.json> / --expected-out <manifest.json> WRITE the manifests the diff was
    computed from — the reproduction's and the reference's. Both sides, because a delta's actual value is
    often a summary (contentAnchor: center (0.50)) and the two section lists are not the same kind of list
    (the capture's are coalesced, the reproduction's are the raw bands). Same shape --actual reads, so the
    offline path round-trips; written even when the side came from disk. Not available with --multi-viewport
    (the ladder's actual side is a multi-state projection, not one manifest) — use --size instead.
  1c values-diff <slug> --ref <captureBundleDir> --multi-viewport [--source …] [--out <file>] [--json]
    (REQ-64) add --collapse to dedup to one row per DEFECT (x-viewport multiplier removed), grouped in
    repair order: Type-A flat (copy) -> Type-A structural (author) -> Type-B (emergent residual).
    (REQ-76) add --clusters to roll the counted defects up into ranked CAUSES, each tagged fix/review/accept.
    (REQ-58 T2) pair the draft against the reference's persisted viewport ladder, cell-for-cell — catches
    a %-vs-fixed reflow (a wordmark that drifts on resize) invisible at the single default width.
  1c values-diff <slug> --ref <captureBundleDir> --size mobile|tablet|desktop [--out <file>] [--json]
    (REQ-61) diff at ONE named size: reference read from the persisted ladder at that width, actual rendered
    there. Default (no --size) is the single-width path (≈ desktop).
  Tolerance controls (REQ-53): axes we author are EXACT by default; --tolerant restores loose matching.
    [--tolerant] [--color-tol <ΔE>] [--font-size-tol <px>] [--line-height-tol <px>]
    [--letter-spacing-tol <px>] [--padding-tol <px>] [--border-tol <px>] [--weight-tol <n>]
    [--position-tol <px>] [--width-tol <px>] [--height-tol <px>] [--radius-tol <px>]
  Ignore-masks (REQ-48): [--ignore <regex,regex,…>] suppress dynamic content; [--compare-years] disable the built-in © year mask.

Perceptual-diff eye (REQ-38) — screenshot-to-screenshot fidelity; ranked regions + crop triptychs:
  1c diff <slug> --ref <bundleDir|refPng> [--source draft|published] [--size mobile|tablet|desktop] [--out <dir>] [--json]
  1c diff --ref <bundleDir|refPng> --actual <png> [--out <dir>] [--json]
    (BUG-103) --actual-out <png> keeps the reproduction's screenshot; without it the shot is deleted with the
    scratch dir and the actual path recorded in regions.json names a file that no longer exists.
    Tuning: [--block <px>] [--threshold <0-255>] [--block-threshold <0-255>] [--bands <n>] [--top <n>] [--pad <px>]
    (REQ-61) --size shoots the actual at that viewport and pairs it against the bundle's screenshot-<width>.png.
  1c crop <image> --box <x,y,w,h> [--out <png>]
  1c aligned-crops <slug> --ref <bundleDir> [--size mobile|tablet|desktop] [--areas <text,…>] [--out <dir>]
    (REQ-78) drift-aligned ref/ours crop pairs per section anchor + index.md — the AI perceptual judge's
    eyes. Each element is cropped at its OWN position in both renders, so cumulative drift never makes
    the diff compare a heading against a field. View the pairs and rule perceptible / not.

Responsive-diff (REQ-61) — analyse ONE captured site across sizes (not a repro comparison):
  1c responsive-diff --ref <captureBundleDir> [--sizes mobile,tablet,desktop] [--classify] [--out <file>] [--json]
    Line up the persisted ladder's per-width manifests into an N-way per-node table — one row per node,
    one column per size — so a font step, a reflow, or a component that departs on mobile reads left-to-right.
    --classify labels each changed node value-step / presence-flip / layout-swap (the reproduction move).

Adopt-gaps (REQ-74) — close section-boundary vertical GAP deltas by inverting to spacingTop:
  1c adopt-gaps <slug> --ref <captureBundleDir> [--apply] [--json]
    A gap is linear in one knob: new spacingTop = current + (ref_gap - our_gap); a too-tight gap also
    reduces the previous section's spacingBottom. Dry-run by default. Pairs with the REQ-73 gap axis.

Colours (REQ-114, REQ-137) — the palette colour model (DOC-23 §5): one colour per entry, the
light↔dark position carried as shade on the reference:
  1c colors <slug> [--json]
    Census the site's colour literals: distinct colours, distinct RGB ignoring alpha, and the
    alpha families (one RGB used at several opacities) that collapse to one entry exactly.
  1c colors <slug> --assign [--names <derived>=<chosen>,…] [--json]
    Retrofit the site onto a derived palette: alpha collapse first (exact), then shade fitting —
    each family member is fitted to an Oklab mix of its base toward black or white and carried as
    shade on the reference. Writes site.palette and rewrites every colour literal as a reference.
    A reference naming an entry's own colour reproduces it exactly; a fitted shade must land within
    ${SHADE_FIT_TOLERANCE}/255 per channel, and a colour a mix cannot reach becomes its own entry
    instead. Refuses to write if anything exceeds that bound, and reports the drift it accepted.
    --json emits the palette alone: the document the site now stores.

Fonts (REQ-101) — licence provenance for every font file in the project:
  1c fonts check [--json]
    Join every site's l1.resources.fonts against fonts/registry.yaml. Fails on a family the
    registry does not record, on a served file the family's entry does not list, and — for a
    site declaring config.distribution "product" — on a licence whose redistribute_in_product
    is not true. Outstanding licence actions are reported but do not fail. Scans every
    site tree the file store can address, because a licence attaches to the font, not
    to the site.
  1c fonts catalogue [--json] [--metadata <url|file>] [--repo <url|dir>]
    Rebuild fonts/catalogue.json and fonts/CATALOGUE.md from upstream (REQ-311). Existence
    comes from fonts.google.com/metadata/fonts; licence is read from each family's own
    METADATA.pb in github.com/google/fonts, never inferred from a directory name. A family
    whose licence cannot be determined is excluded and named in the report, never defaulted;
    a family the live list no longer carries is dropped and named. Unreachable upstream fails
    and leaves the existing catalogue untouched; a run that changes nothing rewrites nothing.
    --metadata and --repo point the same build at a saved snapshot or an existing checkout.
  1c fonts mirror --repo <google/fonts checkout> [--ref <sha>] [--only <slug,…>] [--quality <0-11>] [--json]
    Mirror every OFL 1.1 / Apache 2.0 family in the catalogue into fonts/mirror/ as woff2, and
    write the platform tier to fonts/platform.json (REQ-312). The upstream ships TTF only, so
    each release file is repackaged into the WOFF2 container — brotli, null transform, no
    subsetting and no renaming — and a file that does not reverse back to the upstream bytes is
    not written. Incremental: a family whose upstream bytes and staged output are both unchanged
    is not re-read or re-compressed, so a re-run against an unchanged catalogue transfers
    nothing. A family gone from upstream is reported and its manifest entry RETAINED, because a
    live site may be serving it. The staged bytes are gitignored; the manifest is committed and
    is the pin that makes two builds of the same commit serve the same faces. Seeds the local
    dev stores when it finishes (REQ-315), so a mirror is followed by 1c builder and nothing
    else. --quality is a CLIFF and not a dial: brotli 11 (the default, and what a production
    publish wants) runs the full corpus in roughly 75-90 minutes, while --quality 9 is about
    20x faster for some 9% more bytes, which is the right trade for a local dev seed.
  1c fonts index [--json]
    Project fonts/platform.json into the corpus the assistant reads (REQ-313), joined to
    fonts/catalogue.json for the category, named weights and axis ranges the mirror has no
    reason to hold. Writes tools/generate/src/cli/ai/platform-fonts.json, which use_font
    imports as data because it runs in a Worker with no filesystem. Re-run it after every
    1c fonts mirror; 1c fonts check fails when the two have drifted apart.
  1c fonts publish [--dry-run] [--json]
    Upload the staged mirror to the platform R2 prefix, where public-site serves it from
    /_fonts/ (REQ-312). Needs CLOUDFLARE_API_TOKEN — the same credential 1c kb build uses;
    the account is discovered from the token. Digest-checked per object, so an interrupted
    publish resumes by being re-run and an unchanged mirror transfers nothing.
  1c fonts seed [--app <name,…>] [--dry-run] [--json]
    The same staged mirror, written into the local miniflare R2 store wrangler dev reads
    (REQ-315) — the same platform/fonts/ prefix and the same key function publish uses, so
    r2PlatformFonts(env.SITES) serves local dev unchanged. Nothing is uploaded: the bytes
    land on this machine. .wrangler/state is per app directory, so every app declaring the
    bucket is seeded by default and the report names which stores answer; --app narrows it.
    Digest-checked per object, so a re-seed of an unchanged mirror moves nothing. Run at the
    tail of 1c fonts mirror already — this verb is for re-seeding.
  1c fonts doc [--json] [--stdout]
    Project DOC-56's body from fonts/catalogue.json and write it into the system-KB document
    that declares fonts/catalogue.json as its source. Only OFL 1.1 and Apache 2.0 families
    appear — the document is read as permission. Grouped by category with Slab Serif, Symbols
    and Noto split out, then sub-headings of 22 families by usage, because KB chunking is
    heading-anchored and a retrieval should return a slate rather than one family.
    --stdout prints the body instead of writing the document.

Structured-edit commands (REQ-11) — operate on draft/; support --json:
  1c status <slug>
  1c changes <slug> [--since <n>]
    What has changed on the draft since change <n>, oldest first: who, what, and
    the words before and after. Different question from 'status', which compares
    the draft to the last PUBLISHED revision and knows nothing about ordering or
    about who did anything.
  1c page list <slug>
  1c page get <slug> <pageId>
  1c page add <slug> <pageId> [--title <t>] [--path <p>] [--seo <json>]
  1c page copy <slug> <fromPageId> <pageId> [--title <t>] [--path <p>]
    A new page that IS <fromPageId> — its content, its page style, its components and
    their configuration — under a new id, path and title. Images are referenced, not
    copied. --path defaults to <pageId>, --title to the source page's (REQ-301).
  1c page update <slug> <pageId> [--title <t>] [--path <p>] [--seo <json>]
  1c page rm <slug> <pageId> [--force]
  1c config get <slug> [<key>]
  1c config set <slug> <key> <value>
    <value> is JSON when it parses as JSON, else the literal string. An object MERGES into
    what is at <key>, so naming one setting leaves its siblings alone (REQ-130).
  1c palette get <slug>
    Every palette color with its usage count across the site — the document and every page,
    at any shade. The count is what the delete and rename rules below are stated in.
  1c palette set <slug> <name> <hex>
  1c palette add <slug> <name> <hex>
    A palette entry is ONE opaque color (#rgb or #rrggbb): its light↔dark family is generated
    per-use by the reference's shade (REQ-137), and translucency is a reference axis too.
    Changing an entry therefore repaints every use of it, at every shade, from one write.
  1c palette rm <slug> <name>
    Refused while anything references it, naming the count. Deleting a color in use means
    deciding what each use becomes, and there is no correct default — so no --force.
  1c palette rename <slug> <from> <to>
    Moves the key AND rewrites every reference to it in one atomic write. Refused on a name
    that already exists (that would merge two colors) or one that is not kebab-case.
  1c asset list <slug>
  1c asset get <slug> <assetName>
  1c asset add <slug> <file> [--as <name>]
  1c asset write <slug> <name> --content <svg> [--alt <t>] [--force]
    Write a GENERATED image. SVG only, and its contents are validated against a closed
    grammar (no script, no event handler, no stylesheet, no external reference) — an
    extension check is not enough once the bytes are composed rather than vouched for.
  1c asset rm <slug> <assetName> [--force]

Behavior modules (REQ-130) — instantiating a vetted behaviour, never authoring one:
  1c behavior list
  1c module upgrade <slug> [--write]
  1c module add <slug> <pageId> <moduleId> <type> [--slot <name>] [--config <json>] [--slots <json>]
    --slots is optional where L2 holds a default look for the behaviour; the result is
    ordinary L1, refined afterwards with 1c copy set or the AI surface's set_l1.
  1c module set <slug> <pageId> <moduleId> --config <json>
  1c module rm <slug> <pageId> <moduleId>

The page editor's write path (REQ-117) — the same surface, same validator:
  1c copy get <slug> <pageId> <path> [--module <id> --slot <name>]
    The mountFields descriptors + current values for one segment. An empty field
    list means the segment exposes no phase-1 control (a container, a module).
  1c copy set <slug> <pageId> <path> --values <json> [--module <id> --slot <name>]
    Apply one modal's worth of changes as ONE diff, then re-render the edit
    channel. Nothing is written unless the resulting definition validates.

  <path> is the dotted child-index address the edit render stamps as
  data-l1-path; --module/--slot are its data-fc-module / data-l1-slot scope, and
  are needed only for copy inside a behavior module's slot.

Every command works in storage/sandbox/, the gitignored scratch tree the
reproduction loop lives in. There is no second tree and no flag to choose one:
REQ-290 retired storage/sites/, the file-backed authoring tier, and every real
site now lives in the builder's store. Rendered output lands in
dist/sandbox/<slug>/<channel>/.

In --json mode, structured-edit commands emit {"ok":true,"data":...} on success
or {"ok":false,"error":{code,message,path?,hint?}} on failure. Exit codes:
0 success, 2 schema-invalid, 3 not-found, 4 referential-integrity, 5 conflict,
6 environment (see below), 1 unexpected/internal.

Install preflight (REQ-44) — commands that load a declared runtime dependency
(capture, shot, values-diff, adopt-gaps, crop, diff, gate, aligned-crops) check
the installed tree before doing any work, and refuse with exit 6 when a declared
package does not resolve or when pnpm-lock.yaml differs from the copy pnpm wrote
at last install. Declaring a dependency does not materialize it: a tree that lags
the lockfile is one prune away from losing a package it still declares. The
remedy is always \`pnpm install\` at the repo root. Offline commands (render,
serve, builder, repro, refold, l1-gate, responsive-diff, the structured-edit
verbs) are never gated.`

/** Parse a revision positional (`0001` or `1`) to a number, or undefined. */
function parseRev(tok: string | undefined): number | undefined {
  if (tok === undefined) return undefined
  const n = Number(tok)
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid revision id '${tok}'.`)
  }
  return n
}

/**
 * Dispatch a parsed `1c` command line. Returns when the command completes.
 */
export async function run(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv)
  const [command, ...rest] = positionals
  // REQ-290 — THE SANDBOX ROOT, UNCONDITIONALLY, whatever was typed. The file
  // tier had two roots: `sites/`, git-tracked, where real sites were authored on
  // disk; and `sandbox/`, gitignored, where a reproduction is imported and the
  // fidelity loop runs over it. The builder replaced the first one — every real
  // site now lives in its D1/R2 store — so the only surviving use of the file
  // tier is the second, and a default that still resolved `sites` would let
  // `1c new foo` recreate a retired authoring tier one directory at a time.
  //
  // WHY THE PIN IS HERE AND NOT IN `ctxOf`. `ctxOf(opts)` is a library call:
  // around a hundred suites reach it directly against a temp `cwd`, and the
  // relocated L1 conformance corpus is read through it. The file store is
  // deliberately still able to address both roots — that is how the corpus is
  // read at all. What is retired is the *CLI's* ability to choose, and the CLI
  // is exactly one entry point, so this is where the choice stops being made.
  //
  // `--sandbox` is still parsed and still means what it says; it is simply no
  // longer load-bearing, and it has come out of the usage text.
  const global: GlobalOptions = { sandbox: true }

  // REQ-44 — check the installed tree before the command does anything. Here
  // rather than inside each handler because the failure is about the workspace,
  // not the verb: one gate covers every present and future command through
  // COMMAND_DEPS, and no half-done work (a render, a launched browser, a written
  // file) precedes the refusal. Ungated commands return immediately.
  if (command !== undefined) {
    try {
      assertInstall(command)
      // [[REQ-316]] — and then: does exactly one `workerd` resolve? Here, beside
      // its neighbour, because the same argument applies twice over. The fault
      // is about the workspace rather than the verb; and this one in particular
      // has to land BEFORE the command runs, because `.wrangler/state` is
      // workerd's own store and the first version to open it migrates the schema
      // forward with no way back. A check that fired afterwards would have
      // watched the damage happen.
      //
      // ORDER MATTERS, AND IT IS THIS ONE. An uninstalled tree resolves no
      // workerd at all, so `assertInstall` speaks first and names the install;
      // the skew check is about a tree that IS installed, twice over.
      assertOneWorkerd(workerdGateKey(command, rest[0]), { repoRoot: repoRoot() })
    } catch (err) {
      fail(err, flags.json === true)
      return
    }
  }

  switch (command) {
    case undefined:
    case 'help':
    case '--help':
      console.log(USAGE)
      return

    case 'preflight': {
      // REQ-144 — the one question `bin/build` asks before it builds anything:
      // is this tree able to produce a correct artifact? Both halves are
      // checked and BOTH are reported before either throws, so an operator who
      // is missing an npm package and a shared component learns that in one
      // run rather than one install at a time.
      //
      // THE REFUSAL IS RENDERED HERE, through `fail()`, exactly as the four
      // commands below do it. An uncaught throw escapes to `bin/1c.mjs`, whose
      // handler prints `err.message` and sets exit code 1 — which drops the
      // `hint:` line naming the command that installs the missing components,
      // and flattens `ENVIRONMENT` (6) into a general failure. `bin/build`
      // documents 0/6/1 and branches on the 6, so both halves of REQ-144 §3 —
      // the named remedy and the environment-specific code — depend on the
      // refusal going through the renderer rather than past it.
      const json = flags.json === true
      try {
        const declared = [...new Set(Object.values(COMMAND_DEPS).flat())].sort()
        const install = checkInstall({ repoRoot: process.cwd(), required: declared })
        const store = checkSharedStoreImpl()

        for (const { component, surface } of store.checked) {
          const ok = !store.missing.some((m) => m.component === component)
          console.log(`${ok ? 'ok  ' : 'MISS'}  shared/${surface}  ${component}`)
        }
        for (const pkg of declared) {
          const ok = !install.findings.some((f) => f.packages?.includes(pkg))
          console.log(`${ok ? 'ok  ' : 'MISS'}  npm            ${pkg}`)
        }

        if (!install.ok) {
          throw new CommandError({
            code: 'ENVIRONMENT',
            message:
              'The installed dependencies do not match what is declared.\n' +
              install.findings.map((f) => `  - ${f.detail}`).join('\n'),
            hint: `Run \`${INSTALL_COMMAND}\` at the repo root, then retry.`,
          })
        }
        assertSharedStoreImpl()
        // PRESENT, THEN COMPATIBLE — and in that order, because a component that
        // is missing cannot be probed for its shape and would report the wrong
        // failure if it were.
        await assertIndexSeamImpl()
        console.log(
          `\nPreflight passed: ${store.checked.length} shared components, ` +
            `${declared.length} declared packages.`,
        )
        // Reported on its own line rather than folded into the sentence above.
        // That sentence counts things; this one is a yes/no about a signature,
        // and running them together would have made the counts read as though
        // they covered the seam too.
        console.log('Index seam: the installed knowledge component takes `indexes`.')
      } catch (err) {
        fail(err, json)
      }
      return
    }

    /**
     * `1c copy-to-cloud` / `1c copy-from-cloud` — one business's site, moved
     * between the local builder and the deployed one ([[REQ-289]]).
     *
     * TWO CASES AND ONE BODY, which is the shape the ticket asks for: the
     * direction is a parameter to `copySite` and a word in the command name,
     * because the operator reads the name back later and has to know which way
     * the bytes went. `1c copy` is the structured-edit verb and is untouched.
     *
     * THE BUSINESS IS NAMED, NOT ADDRESSED BY ID. A site's id is minted by the
     * store that holds it, so the two ends have different strings for the thing
     * the operator calls one name; `copy.ts` asks each side what it calls it.
     */
    case 'copy-to-cloud':
    case 'copy-from-cloud': {
      const json = flags.json === true
      try {
        const direction: CopyDirection = command === 'copy-to-cloud' ? 'to-cloud' : 'from-cloud'
        const business = requireArg(rest[0], 'business')
        // RECOGNISED, THEN REFUSED — never an unknown-flag error. What
        // `--contacts` means in each direction is a decision this ticket
        // records; see `assertDataClass`. `--chats` is the third class and the
        // second one implemented ([[REQ-294]]): carried up, refused down.
        const klass: DataClass =
          flags.contacts === true ? 'contacts' : flags.chats === true ? 'chats' : 'site'
        // BEFORE THE CREDENTIAL CHECK, because it is about what was ASKED FOR
        // and that one is about how to reach a side. An operator told to
        // provision an Access token, who then provisions one and is told the
        // flag was never going to be carried, has been sent on an errand. (It
        // runs inside `copySite` as well — this is the ordering, not the rule.)
        assertDataClass(klass, direction)
        // Flags win over the environment so a one-off run can name a different
        // token without editing a shell profile; the environment is the
        // ordinary path, because a secret on a command line lands in shell
        // history.
        //
        // TWO PAIRS, ONE PER END ([[BUG-134]]). A copy touches two builders and
        // they can be behind two different gates — production's Access and the
        // laptop's `bin/access-sim`, which accepts only its OWN pair. One slot
        // could satisfy either and never both, and the way out was to restart
        // the simulator with the production token's values. Each end reads its
        // own now; the local one falls back to the cloud's when it is unset, so
        // a single credential that genuinely serves both still does.
        const cloudAccess = serviceToken(
          typeof flags['client-id'] === 'string'
            ? flags['client-id']
            : process.env.CF_ACCESS_CLIENT_ID,
          typeof flags['client-secret'] === 'string'
            ? flags['client-secret']
            : process.env.CF_ACCESS_CLIENT_SECRET,
          'cloud',
        )
        const localAccess = serviceToken(
          typeof flags['local-client-id'] === 'string'
            ? flags['local-client-id']
            : process.env.LOCAL_ACCESS_CLIENT_ID,
          typeof flags['local-client-secret'] === 'string'
            ? flags['local-client-secret']
            : process.env.LOCAL_ACCESS_CLIENT_SECRET,
          'local',
        )
        // `--origin` OVERRIDES THE NON-CLOUD END ONLY, as the retired push
        // script allowed, so the pair works against a dev server on any port —
        // which in practice means `bin/access-sim`, the one local front door
        // that can resolve a business other than `TENANT_ID`.
        const local = typeof flags.origin === 'string' ? flags.origin : LOCAL_ORIGIN
        const ends = endsFor(direction, local)
        // The same swap over the credentials and over the end names, so the
        // `--backup` read below and the refusal it may meet agree about which
        // machine it is talking to ([[BUG-134]]).
        const creds = accessFor(direction, localAccess, cloudAccess)
        const who = endNamesFor(direction)

        // A BACKUP READS THE SOURCE AND WRITES NOTHING TO THE DESTINATION. The
        // direction still says which side was read: to-cloud reads local, so
        // `copy-to-cloud --backup` is the local builder's own export landing in
        // a file the operator can commit. That is this ticket's first real use
        // — a site that exists in exactly one gitignored directory, with no
        // published revision to fall back to.
        //
        // IT WORKS FOR `--chats` TOO ([[REQ-294]]), because it is the same
        // source-side read landing in a file — and refusing it for one class
        // would be more code than carrying it, for a worse command.
        const wireFromSource = {
          end: who.source,
          ...(creds.source ? { access: creds.source } : {}),
        }
        if (typeof flags.backup === 'string') {
          const out = path.resolve(process.cwd(), flags.backup)
          if (klass === 'chats') {
            const read = await exportChats(ends.source, business, wireFromSource)
            writeFileSync(out, `${JSON.stringify(read.payload, null, 2)}\n`)
            if (json) {
              console.log(JSON.stringify({ ok: true, data: { ...read, file: out } }, null, 2))
              return
            }
            console.log(
              `backed up '${read.business.name}'s conversations from ${ends.source}\n` +
                `  chats   ${read.payload.chats.length}\n` +
                `  file    ${out}`,
            )
            return
          }
          const read = await exportSite(ends.source, business, wireFromSource)
          writeFileSync(out, `${JSON.stringify(read.payload, null, 2)}\n`)
          if (json) {
            console.log(JSON.stringify({ ok: true, data: { ...read, file: out } }, null, 2))
            return
          }
          console.log(
            `backed up '${read.business.name}' from ${ends.source}\n` +
              `  site    ${read.payload.slug}\n` +
              `  pages   ${read.payload.pages.length} ` +
              `(${read.payload.pages.map((pg) => pg.name).join(', ') || 'none'})\n` +
              `  assets  ${read.payload.assets.length}\n` +
              `  file    ${out}`,
          )
          return
        }

        // REFUSED BEFORE THE FIRST CALL rather than after the read has already
        // happened: a run that fetched a site's worth of assets and then
        // discovered it had no credential has spent the operator's time to tell
        // them something it could have said first. That was the retired push
        // script's reasoning too, applied there to a list of slugs and here to a
        // pair of ends.
        if (
          cloudAccess === undefined &&
          (ends.source === CLOUD_ORIGIN || ends.destination === CLOUD_ORIGIN)
        ) {
          throw new Error(
            `${CLOUD_ORIGIN} is unreachable without a credential. ` +
              `${accessAdvice('cloud')} CLOUDFLARE_API_TOKEN is an API credential ` +
              'for api.cloudflare.com and is not what Access accepts.',
          )
        }

        const opts = {
          direction,
          local,
          klass,
          ...(cloudAccess ? { cloudAccess } : {}),
          ...(localAccess ? { localAccess } : {}),
          // BUG-51 — only ever passed when typed. The far side refuses an
          // import that would replace builder changes; this is the operator
          // saying they know what is there. `--chats` reuses it as *replace a
          // conversation the destination already holds* ([[REQ-294]]) rather
          // than adding a second flag for the same sentence.
          ...(flags.force === true ? { force: true } : {}),
        }
        // ONE BRANCH, AT THE POINT THE CLASSES GENUINELY DIFFER. Everything
        // above — the ends, the two credential pairs, the cloud-reachability
        // refusal — is the same for every class, and a `--chats` copy that
        // re-derived any of it would be a second place for one of them to drift.
        const result = klass === 'chats' ? await copyChats(business, opts) : await copySite(business, opts)
        if (json) {
          console.log(JSON.stringify({ ok: true, data: result }, null, 2))
          return
        }
        console.log(
          // BOTH IDS ON EITHER CLASS, because they are different strings for one
          // business and the operator has no other way to see that. The
          // destination's is also what a `/b/<id>/` builder URL needs.
          'read' in result
            ? `copied ${result.read} conversation(s) of '${result.to.name}' ` +
              `${ends.source} → ${ends.destination}\n` +
              `  from    ${result.from.id}\n` +
              `  to      ${result.to.id}\n` +
              `  new     ${result.landed.created}\n` +
              `  replaced ${result.landed.replaced}\n` +
              // NAMED, NOT SILENT. A second copy reports every conversation as
              // kept, which is the command saying it duplicated nothing — and
              // the one place the operator learns `--force` is what replaces.
              `  kept    ${result.landed.kept}` +
              `${result.landed.kept > 0 ? ' (already there; --force replaces)' : ''}\n` +
              `  comments ${result.landed.comments}` +
              // ONLY WHEN THERE WERE ANY ([[BUG-137]]). A copy made before that
              // fix left rows under the SOURCE's session ids, unreachable where
              // they sat; this run re-addressed their content and archived them.
              // Ordinarily zero, and a line reading `strays 0` on every copy
              // would be noise about a repair nobody needs to think about.
              `${result.landed.strays > 0 ? `\n  strays  ${result.landed.strays} (stranded by an earlier copy; archived)` : ''}`
            : `copied '${result.to.name}' ${ends.source} → ${ends.destination}\n` +
              `  from    ${result.from.id}\n` +
              `  to      ${result.to.id}\n` +
              `  site    ${result.landed.site ?? '(not reported)'}\n` +
              `  pages   ${result.landed.pages} (${result.pages.join(', ') || 'none'})\n` +
              `  assets  ${result.landed.assets}\n` +
              `  site.json ${result.landed.siteJson ? 'yes' : 'no'}`,
        )
      } catch (err) {
        fail(err, json)
      }
      return
    }

    case 'assets': {
      // REQ-145 — the build step that replaces three request-time routes. It runs
      // before the Worker is bundled, because the Worker serves what it emits.
      const report = await cmdAssets({ cwd: process.cwd() })
      console.log(
        flags.json === true ? JSON.stringify(report, null, 2) : formatAssetReport(report),
      )
      return
    }

    case 'new': {
      const slug = requireSlug(rest[0])
      const { draftDir } = cmdNew(slug, global)
      console.log(`Created site '${slug}' at ${draftDir}`)
      return
    }

    case 'list': {
      const sites = cmdList(global)
      if (sites.length === 0) {
        console.log('(no sites)')
        return
      }
      for (const s of sites) {
        console.log(`${s.slug}\t${s.latest === null ? '(unpublished)' : `r${s.latest}`}`)
      }
      return
    }

    case 'revisions': {
      const slug = requireSlug(rest[0])
      const revs = await cmdRevisions(slug, global)
      if (revs.length === 0) {
        console.log('(no revisions)')
        return
      }
      for (const r of revs) {
        const n = r.changes.added.length + r.changes.modified.length + r.changes.removed.length
        console.log(`r${r.id}\t${r.publishedAt}\t${n} change(s)\t${r.message}`)
      }
      return
    }

    case 'verify': {
      const slug = requireSlug(rest[0])
      const { checked, mismatches } = await cmdVerify(slug, global)
      if (checked === 0) {
        console.log('(no revisions)')
        return
      }
      for (const m of mismatches) {
        console.log(
          `r${m.id}\tALTERED\texpected ${m.expected}, found ${m.actual ?? '(no bytes)'}`,
        )
      }
      // A NON-EMPTY REPORT IS A NON-ZERO EXIT, because this is the kind of
      // command something eventually runs unattended, and a check that reports a
      // corrupted history by printing a line and succeeding is a check that will
      // be watched by nothing.
      if (mismatches.length > 0) {
        throw new Error(
          `${mismatches.length} of ${checked} revision(s) of '${slug}' no longer match ` +
            `their recorded digest. A published revision is immutable; these have changed ` +
            `since they were published.`,
        )
      }
      console.log(`${checked} revision(s) verified — every one matches its digest.`)
      return
    }

    case 'render': {
      const slug = requireSlug(rest[0])
      const { outDir, files } = await cmdRender(slug, {
        ...global,
        source: typeof flags.source === 'string' ? flags.source : undefined,
        out: typeof flags.out === 'string' ? flags.out : undefined,
        // REQ-116 — the edit channel (DOC-28 §5).
        edit: flags.edit === true,
      })
      console.log(`Rendered ${files.length} file(s) → ${outDir}`)
      return
    }

    case 'publish': {
      const slug = requireSlug(rest[0])
      const { id, outDir, changes, published } = await cmdPublish(slug, {
        ...global,
        message: typeof flags.message === 'string' ? flags.message : undefined,
        by: typeof flags.by === 'string' ? flags.by : undefined,
      })
      // REQ-149 D1 — an unchanged draft mints nothing, and says so rather than
      // reporting a revision number the operator would reasonably read as new.
      if (!published) {
        console.log(`Already published as r${id} — the draft has no changes.`)
        return
      }
      const n = changes.added.length + changes.modified.length + changes.removed.length
      console.log(`Published revision r${id} (${n} change(s)) → ${outDir}`)
      return
    }

    case 'checkout': {
      const slug = requireSlug(rest[0])
      const { id, draftDir } = await cmdCheckout(slug, parseRev(rest[1]), {
        ...global,
        force: flags.force === true,
      })
      console.log(`Checked out revision r${id} → ${draftDir}`)
      return
    }

    case 'reset': {
      // BUG-51 — the deliberate way back to empty. See `reset.ts` for why a
      // command exists rather than an instruction to delete a directory.
      const port = Number.parseInt(typeof flags.port === 'string' ? flags.port : '8788', 10)
      // A bare Error, as the copy verbs raise for their own usage mistakes: the
      // `ErrorCode` set is about what happened to a DEFINITION, and a mistyped
      // flag never reached one.
      if (!Number.isFinite(port) || port <= 0) {
        throw new Error(`--port must be a port number, not '${String(flags.port)}'.`)
      }
      const plan = resetPlan({
        repoRoot: repoRoot(),
        includePublic: flags['include-public'] === true,
      })

      const describe = (): string =>
        plan.targets
          .map((t) =>
            t.present
              ? `  ${t.label}  (${t.files} file(s), ${humanBytes(t.bytes)})\n    ${t.dir}`
              : `  ${t.label}  (already empty)`,
          )
          .join('\n')

      if (flags.yes !== true) {
        // A PREVIEW EXITS 0, because it did what it was asked. `1c reset` with no
        // flag is a question — "what would this take away?" — and answering it is
        // a success. Exiting non-zero would make the safe form of a destructive
        // command look like a failure, which teaches the operator to reach past
        // it for the one that does not ask.
        console.log(
          `Would empty the local dev store:\n${describe()}\n\n` +
            `Never touched: ${plan.preserved.join(', ')}\n\n` +
            'Nothing was deleted. Re-run with --yes to do it.',
        )
        return
      }

      if (await builderIsRunning(port)) {
        // THE WHOLE EXPLANATION IS IN THE MESSAGE, not split into a `hint`. A
        // command that throws from here reaches `bin/1c.mjs`'s catch, which
        // prints `err.message` and nothing else — so a hint would be the half of
        // this refusal that never reaches the operator, and it is the half that
        // says why. `builder` has the same shape and the same silent hint; that
        // is a wart to fix where it lives, not one to inherit here.
        throw new CommandError({
          code: 'ENVIRONMENT',
          // "SOMETHING", NOT "THE BUILDER". A connect proves a listener, not
          // whose it is, and on a developer's machine that port may belong to
          // anything. Naming it as the builder would make the one case where the
          // operator is right and the tool is wrong — a different service on
          // 8788 — read as the tool knowing something it does not. `--port` is
          // the way out, and is named here because that is when it is needed.
          message:
            `Something is listening on port ${port}, so the builder may be running. ` +
            'Stop it first: a live wrangler dev holds the store\'s SQLite files open, ' +
            'so deleting them underneath it corrupts the store instead of emptying it. ' +
            'Nothing was deleted. If that port is something else, pass --port.',
        })
      }

      const { removed } = performReset(plan)
      console.log(
        (removed.length
          ? `Emptied the local dev store:\n${removed.map((t) => `  ${t.label}`).join('\n')}`
          : 'The local dev store was already empty.') +
          `\n\nNext start is a fresh store; \`bin/copy-from-cloud <business>\` brings a site back.`,
      )
      return
    }

    case 'builder': {
      // REQ-145 — `1c builder` starts `wrangler dev`, which IS the builder: the
      // same routes, the same store and the same runtime as production. It used
      // to start a `node:http` origin of its own, and keeping both would be the
      // two-code-paths problem `CLAUDE.md` forbids — the operator's local loop
      // would exercise something the deployed builder is not.
      //
      // The Node transport survives as a test harness only (`startBuilder`),
      // over that same route table. It is not started here.
      const port = typeof flags.port === 'string' ? flags.port : '8788'
      // REPO-ANCHORED, NOT CWD-ANCHORED (BUG-50). This derived `apps/control-app`
      // from the working directory, so the command only worked when typed at the
      // repo root — and `dev:control` now calls it, which would have made that
      // requirement a silent dependency of a package script rather than an
      // operator's own mistake to notice.
      const root = repoRoot()
      const appDir = path.join(root, 'apps', 'control-app')
      // THE SAME LAYERING `pnpm dev:control` ONCE COMPOSED ITSELF (BUG-50).
      // That script is now a caller rather than a second author of it; see
      // `dev-env.ts` for why half of this layering is not a smaller version of
      // it but a different and broken thing.
      const devEnv = devEnvLayering({ appDir })

      // THE STORE IS CHECKED BEFORE ANYTHING IS STARTED ([[REQ-253]]).
      //
      // Production has had this guarantee since REQ-143: the migrate hook applies
      // the migrations before the Worker is uploaded and aborts the deploy if they
      // fail, so code that assumes a column cannot reach traffic ahead of the
      // column. This is the same guarantee for the other environment, and it is a
      // REFUSAL rather than a warning for the reason that hook aborts rather than
      // warning — a dev server that started anyway would be choosing the slower
      // failure, which arrives minutes later as a SQLITE_ERROR in a log and reaches
      // the operator as a frozen acknowledgement carrying no diagnosis.
      //
      // BEFORE THE BANNER, so a refused start never prints a URL nobody can use.
      //
      // NOT UNDER `--remote`, which points wrangler at the DEPLOYED database. That
      // one is `bin/deploy`'s to migrate, and the local file this reads says
      // nothing about it.
      if (flags.remote !== true) {
        const check = await localD1Check({ repoRoot: root })
        if (check.kind === 'refuse') {
          // The whole explanation is the message, never a `hint`: an uncaught
          // throw reaches `bin/1c.mjs`, which prints `err.message` and nothing
          // else — and the hint would be the half that says what to type.
          throw new CommandError({ code: 'ENVIRONMENT', message: check.message })
        }
        // A check that could not read the database is a different fact from a
        // database that is behind one, and must not be the thing that stops an
        // operator working.
        if (check.kind === 'unreadable') console.warn(check.message)
      }

      // THE FILING SERVICE ([[REQ-273]]), started before wrangler — but no longer
      // BECAUSE wrangler needs to be told about it ([[BUG-124]]). The address is
      // in `.dev.vars` now, which wrangler reads by itself, so this command
      // starts a listener as a CONVENIENCE and nothing depends on it doing so.
      // Start one with `1c filing` instead and this is a no-op; start the dev
      // server some other way and filing works anyway, which is the whole point.
      //
      // PROVISIONED FIRST AND BEFORE WRANGLER IS SPAWNED, so a clone whose
      // `.dev.vars` has never carried these lines gets them in time for the
      // child to read them on this very run rather than the next one.
      const provision = provisionFilingVars({ devVarsPath: devVarsPath(appDir), vars: readDevEnv({ appDir }) })
      // A WRITE IS NEWS AND A FAILURE TO WRITE IS A WARNING, and they go to
      // different streams for the reason `devEnv.warnings` does: one of them is
      // something an operator has to act on.
      if (provision.note) (provision.wrote ? console.log : console.warn)(provision.note)

      // A FAILURE TO START IS A WARNING AND NEVER A REFUSAL. Being able to file
      // a defect is not a precondition for building a site, and a dev server
      // that would not start because the shared store was not installed would
      // be trading a whole product for a capability nobody was using yet — the
      // same trade `host-core.ts` refuses when a knowledge base is missing.
      //
      // AN ADDRESS ALREADY IN USE IS THE SAME KIND OF WARNING. A fixed port is
      // what makes `1c filing` and this command able to mean the same thing, and
      // the cost of a fixed port is that they can collide; the collision is
      // ordinary and the right answer is to leave the incumbent alone.
      let filing: FilingService | null = null
      const incumbent = await filingStatus(provision.address)
      if (flags['no-filing'] !== true && incumbent.kind !== 'answering') {
        try {
          filing = await startFilingService({
            root,
            port: provision.address.port,
            token: provision.address.token || undefined,
          })
        } catch (error) {
          console.warn(
            `The assistant will not be able to file development tickets: ${
              (error as Error)?.message ?? String(error)
            }`,
          )
        }
      }

      // NOT A SINGLE `--var` ANYWHERE ([[BUG-124]]). Everything the Worker reads
      // comes from the env files, which a bare `wrangler dev` reads too — so the
      // Worker's capabilities stop depending on which command launched it.
      const args = wranglerDevArgs({ appDir, port, remote: flags.remote === true })

      // WHAT IS ACTUALLY ANSWERING, not what this process did. The old line
      // reported whether THIS command had started a listener, which is exactly
      // the fact that is useless when the command was not the one that ran.
      const status = await filingStatus(provision.address)
      console.log(
        // `devUrl` rather than `localhost` ([[BUG-146]]) — see DEV_HOST.
        `Builder (wrangler dev) on ${devUrl(port)}\n` +
          `  store: ${flags.remote === true ? 'REMOTE — this edits production data' : 'local'}\n` +
          `${status.line}\n` +
          '  starts empty — author in the builder, or `bin/copy-from-cloud <business>`\n',
      )
      // AFTER the banner and BEFORE wrangler's own output, which is where an
      // operator is still reading. A warning, never a refusal: a missing key is
      // an ordinary runtime state here — the Worker opens, serves and explains
      // itself without one ([[REQ-173]]) — so the only defect is not saying so.
      for (const warning of devEnv.warnings) console.warn(warning)
      if (devEnv.warnings.length) console.warn('')
      const child = spawn('npx', args, { cwd: appDir, stdio: 'inherit' })
      try {
        await new Promise<void>((resolve, reject) => {
          child.on('error', reject)
          child.on('exit', (code) => {
            if (code === 0 || code === null) resolve()
            else reject(new CommandError({
              code: 'ENVIRONMENT',
              message: `wrangler dev exited with ${code}.`,
              hint: 'Run `1c assets` first — the Worker serves what it builds.',
            }))
          })
        })
      } finally {
        // IN A `finally`, so a wrangler that failed to start does not leave a
        // listener holding a port. It is `unref`'d as well, so this is belt and
        // braces rather than the only thing keeping the process honest.
        await filing?.close()
      }
      return
    }

    case 'filing': {
      // THE FILING SERVICE ON ITS OWN ([[BUG-124]]).
      //
      // WHY THIS COMMAND EXISTS. The listener has to be a Node process — workerd
      // has no `node:child_process` — and for a while the only Node process
      // offering to be it was `1c builder`. That made being able to file a defect
      // a property of HOW THE DEV SERVER WAS LAUNCHED: run wrangler by hand, or
      // with `bin/access-sim`'s extra `--env-file`, and the assistant silently
      // had no filing tool. The address is a setting now, so the last thing
      // needed is a way to run the listener without running a dev server.
      //
      // IT WAITS. `1c builder` unrefs its listener because the dev server is what
      // that process is waiting on; here the listener IS the thing being waited
      // on, so it is ref'd and this returns only on Ctrl-C.
      const root = repoRoot()
      const appDir = path.join(root, 'apps', 'control-app')
      // A `--port` THAT IS NOT A NUMBER IS A REFUSAL rather than a `NaN` in a
      // URL, which would travel all the way into `.dev.vars` and be written down.
      const asked = typeof flags.port === 'string' ? Number.parseInt(flags.port, 10) : undefined
      if (asked !== undefined && !Number.isInteger(asked)) {
        throw new CommandError({ code: 'SCHEMA_INVALID', message: `--port expects a number, got '${String(flags.port)}'.` })
      }
      const overrides = {
        port: asked,
        token: typeof flags.token === 'string' ? flags.token : undefined,
      }
      // PROVISION, THEN START. A clone whose `.dev.vars` has never carried these
      // lines gets them here; one that has keeps the value it already had, so
      // the bearer is stable across runs and the Worker does not have to be
      // restarted every time this is.
      const provision = provisionFilingVars({
        devVarsPath: devVarsPath(appDir),
        vars: readDevEnv({ appDir }),
        overrides,
      })
      if (provision.note) console.log(provision.note)

      const already = await filingStatus(provision.address)
      if (already.kind === 'answering') {
        // NOT AN ERROR. Two of these would fight over one port and the second
        // would lose; the useful thing to say is that the first is doing the job.
        console.log(`A filing service is already answering at ${provision.address.url}.`)
        return
      }

      const service = await startFilingService({
        root,
        port: provision.address.port,
        token: provision.address.token || undefined,
        unref: false,
      })
      console.log(
        `Filing service on ${service.url}\n` +
          `  files into: ${root}\n` +
          `  the assistant reads this address from apps/control-app/.dev.vars, so any\n` +
          `  dev server started from this clone can report a defect into this project.\n` +
          '  Ctrl-C to stop.\n',
      )
      await new Promise<void>((resolve) => {
        const stop = (): void => {
          void service.close().then(resolve)
        }
        process.once('SIGINT', stop)
        process.once('SIGTERM', stop)
      })
      return
    }

    case 'workerd': {
      // [[REQ-316]] builds the check and [[REQ-318]] needs it as a SURFACE.
      //
      // Until now the check only ever spoke as a refusal, from inside the `1c`
      // gate, for the handful of verbs that open the store. `bin/deploy --env
      // dev` is the newest of those and is a bash script, so it cannot reach a
      // TypeScript function — and its FIRST act is the migrate hook, against
      // `.wrangler/state`, which holds the only copy of the dev data. This is
      // the one line it calls before any hook runs.
      //
      // `--quiet` PRINTS NOTHING WHEN THE TREE IS FINE, which is what makes it
      // usable as a guard rather than as noise at the top of every deploy. The
      // refusal is never quiet.
      const report = checkWorkerd({ repoRoot: repoRoot() })
      if (flags.json === true) {
        console.log(JSON.stringify(report, null, 2))
      } else if (!report.ok || flags.quiet !== true) {
        const rows = report.instances.map(
          (i) =>
            `  ${i.version.padEnd(16)} ${i.broughtBy}` +
            (i.declaredIn.length > 0 ? `  (declared in ${i.declaredIn.join(', ')})` : ''),
        )
        console.log(
          report.versions.length === 0
            ? 'No `workerd` resolves in this tree — it is not installed.'
            : `${report.versions.length === 1 ? 'One' : report.versions.length} \`workerd\` version${
                report.versions.length === 1 ? '' : 's'
              } resolve${report.versions.length === 1 ? 's' : ''} here:\n${rows.join('\n')}`,
        )
      }
      // THE REFUSAL IS THE EXISTING ONE, not a second wording of it: the whole
      // explanation of why a skew costs data lives in `assertOneWorkerd`, and a
      // paraphrase here would be a second thing to keep true.
      if (!report.ok) assertOneWorkerd('builder', { repoRoot: repoRoot() })
      return
    }

    case 'ps': {
      // [[REQ-319]] — what is running here, with its pid, its port and the
      // directory it was started from. Built on `lsof` rather than `ps`, which
      // returns nothing at all under the agent sandbox; see `ps.ts`.
      //
      // THE PIDFILES ARE READ HERE rather than inside the survey, because they
      // belong to `bin/dev` and `ps.ts` has no business knowing where that writes
      // them. It is the one fact the survey cannot observe for itself.
      const root = repoRoot()
      const table = devProcessTable({
        repoRoot: root,
        managedPids: readDevPidfiles(root).map((r) => r.pid),
      })
      console.log(flags.json === true ? JSON.stringify(table, null, 2) : formatProcessTable(table))
      // A SURVEY THAT FOUND NOTHING IS STILL A SUCCESSFUL SURVEY. What is not is
      // one that could not run: `lsof` absent means the answer is unknown rather
      // than empty, and exiting 0 on that would let a caller read silence as calm.
      if (!table.probed) process.exitCode = EXIT_CODES.ENVIRONMENT
      return
    }

    case 'dev': {
      // [[REQ-319]] — `bin/dev` is a launcher for this verb and nothing else, so
      // the three subcommands live here beside `1c ps`, which is the table all
      // three of them read.
      const root = repoRoot()
      const sub = rest[0]
      if (sub === 'up') {
        const outcome = await devUp({ repoRoot: root })
        console.log(flags.json === true ? JSON.stringify(outcome, null, 2) : formatUp(outcome))
        if (!outcome.ok) process.exitCode = EXIT_CODES.ENVIRONMENT
        return
      }
      if (sub === 'down') {
        const outcome = await devDown({ repoRoot: root })
        console.log(flags.json === true ? JSON.stringify(outcome, null, 2) : formatDown(outcome))
        // A PORT THAT IS STILL ANSWERING IS A FAILED `down`, and the exit code has
        // to say so: the caller that matters is a script teeing up a fresh start,
        // and it would otherwise proceed into a port collision.
        if (!outcome.ok) process.exitCode = EXIT_CODES.ENVIRONMENT
        return
      }
      if (sub === 'serve') {
        // [[REQ-318]] — run the DEPLOYED snapshot. `bin/deploy --env dev` wrote
        // it; this reads what that recorded and starts wrangler against it.
        //
        // IT STARTS NOTHING ELSE AND RECORDS NO PIDFILE. `up` owns the set of
        // services and their bookkeeping; this is one server in the foreground,
        // which is what lets it run beside the old path while the replacement is
        // being trusted (EPIC-16 §L1) without either claiming the other's slot.
        const snapshot = readSnapshot({ repoRoot: root, app: 'control-app' })
        if (snapshot === null) {
          throw new CommandError({
            code: 'ENVIRONMENT',
            message: noSnapshotMessage('control-app'),
          })
        }
        const appDir = path.join(root, 'apps', 'control-app')
        const port = typeof flags.port === 'string' ? flags.port : String(DEV_SERVE_PORT)

        // THE STORE IS CHECKED BEFORE ANYTHING IS STARTED, exactly as `1c
        // builder` checks it ([[REQ-253]]) — and AT THIS ENVIRONMENT, because
        // `--env dev` inherits no bindings and the block that decides which
        // database file is opened is `[[env.dev.d1_databases]]`.
        const check = await localD1Check({ repoRoot: root, env: snapshot.env })
        if (check.kind === 'refuse') {
          throw new CommandError({ code: 'ENVIRONMENT', message: check.message })
        }
        if (check.kind === 'unreadable') console.warn(check.message)

        const devEnv = devEnvLayering({ appDir })
        console.log(snapshotSummary(snapshot, port))
        for (const warning of devEnv.warnings) console.warn(warning)
        if (devEnv.warnings.length) console.warn('')

        const args = devServeArgs({ appDir, snapshot, port })
        const child = spawn('npx', args, { cwd: appDir, stdio: 'inherit' })
        await new Promise<void>((resolve, reject) => {
          child.on('error', reject)
          child.on('exit', (code) => {
            if (code === 0 || code === null) resolve()
            else
              reject(
                new CommandError({
                  code: 'ENVIRONMENT',
                  message: `wrangler dev exited with ${code}.`,
                  hint: 'Re-run `bin/deploy --env dev` — the snapshot may be from a tree that no longer builds.',
                }),
              )
          })
        })
        return
      }
      if (sub === 'reap') {
        const outcome = await devReap({ repoRoot: root, dryRun: flags['dry-run'] === true })
        console.log(flags.json === true ? JSON.stringify(outcome, null, 2) : formatReap(outcome))
        if (!outcome.ok) process.exitCode = EXIT_CODES.ENVIRONMENT
        return
      }
      throw unknownSub('dev', sub)
    }

    case 'kb': {
      const sub = rest[0] ?? 'status'
      if (sub === 'export') {
        // The declaration too, so that `export` leaves a COHERENT tree rather
        // than documents with nothing declaring what they belong to. Idempotent:
        // an existing declaration is never overwritten.
        ensureConfig()
        // The generator runs BEFORE the export, so its output is in the corpus
        // the export's own report describes and the index's incremental manifest
        // sees one settled tree rather than two passes over the same directory.
        const { projected } = writeProjections()
        const { docs, removed, skipped, dir } = exportCorpus()
        console.log(`corpus: ${docs.length} document(s) -> ${dir}`)
        // Named rather than counted, for the reason the skip list is: a
        // projection has no ticket, so an operator who cannot find `REF-l1` in
        // the ticket store needs to be told it was generated, not looked for.
        if (projected.length) console.log(`projected: ${projected.join(', ')}`)
        if (removed.length) console.log(`removed: ${removed.join(', ')}`)
        // Named, never a bare count: "3 skipped" tells an operator that
        // something is missing without telling them what, which is the version
        // of this message that generates a support question.
        if (skipped.length) {
          console.log(
            `not in the KB (no ${DOC_KIND_FIELD}: ${MEMBER_KIND}): ${skipped.join(', ')}`,
          )
        }
        return
      }
      if (sub === 'build') {
        // The three steps and the reason for their order live in `runKbBuild`,
        // which is also what `1c kb ensure` runs (REQ-322) — so the two commands
        // cannot come to differ about what building the KB means.
        console.log((await runKbBuild()).report)
        return
      }
      if (sub === 'ensure') {
        // `bin/build`'s KB stage and `bin/kb-release`'s build, as one verb
        // (REQ-322). It decides whether a build is needed; the decision is
        // `requireCoherentKb` — the same check `1c assets` refuses on — so a
        // build that passes this stage cannot be refused by the next one.
        const outcome = await kbEnsure({ force: rest.includes('--force') })
        console.log(outcome.report)
        return
      }
      if (sub === 'status') {
        const s = kbStatus()
        // The ticket count sits ON the corpus line rather than under its own
        // heading, because the only thing it is for is to be read against the
        // number beside it: a corpus is not "37 documents", it is "37 of the 38
        // there should be", and a truncated export is a thing an operator sees
        // rather than a thing they later infer from an assistant's silence.
        //
        // The comparison is against the EXPORTED half, not the whole directory
        // (REQ-165). Two producers write here now, and the projections have no
        // ticket to be counted by — measuring the total against the ticket count
        // would report a perfectly current corpus as stale by exactly the number
        // of projections, every single build.
        const exported = s.corpus - s.projected
        const expected =
          s.tickets === null
            ? ' (ticket store unreadable — cannot check)'
            : s.tickets === exported
              ? ` (of ${s.tickets} ticket(s) carrying ${DOC_KIND_FIELD}: ${MEMBER_KIND})`
              : ` ⚠ ${s.tickets} ticket(s) carry ${DOC_KIND_FIELD}: ${MEMBER_KIND} —` +
                ` the corpus is stale; run \`1c kb export\``
        console.log(
          `corpus: ${exported} exported + ${s.projected} projected${expected}\n` +
            `index:  ${s.index ? 'built' : 'missing'}\n` +
            `chunks: ${s.chunks ? 'built' : 'missing'}\n` +
            `map:    ${s.map ? 'built' : 'missing'}`,
        )
        return
      }
      console.error(`Unknown kb subcommand: ${sub}\n\n${KB_USAGE}`)
      process.exitCode = 1
      return
    }

    case 'capture': {
      const sub = rest[0]
      /**
       * REQ-254 — `capture list` reports the bundles already on disk.
       *
       * WHY THE ENGINE ANSWERS THIS AND NOT THE CALLER. A bundle is named after
       * the host that ANSWERED and the path slug that was derived, so which
       * captures exist, and where each one sits, is knowledge of a layout the
       * engine owns. A caller that reconstructed `storage/references/<host>/<slug>`
       * for itself would be a second definition of that layout, wrong the day it
       * moves — the same argument requirement 19 made for `capture page --json`,
       * one level up: not *where did this one land* but *which ones are there*.
       *
       * The reproduction console reads this to offer a captured site back
       * without re-hitting it (requirements 29 and 31), which matters because
       * re-capturing re-rolls the acceptance oracle and moves the reference
       * under the very comparison an iteration exists to make.
       */
      if (sub === 'list') {
        const cwd = global.cwd ?? process.cwd()
        // The store is built HERE, not inside `cmdCaptureList` — the CLI is the
        // thing that knows it is on a laptop (REQ-155), and `dir` is composed
        // here for the same reason: a path is the filesystem adapter's to give.
        const bundles = (await cmdCaptureList(fsReferenceStore(cwd))).map((b) => ({
          ...b,
          dir: bundleDir(cwd, b.name),
        }))
        console.log(
          flags.json === true
            ? JSON.stringify(bundles, null, 2)
            : bundles.length
              ? bundles.map((b) => `${b.name}\n  ${b.dir}${b.url ? `\n  ${b.url}` : ''}`).join('\n')
              : 'No captures yet.',
        )
        return
      }
      /**
       * REQ-275 — `capture audit` turns "which axis are we missing?" from a
       * question each reproduction round answers once, expensively, into one
       * mechanical pass over a bundle that already exists.
       *
       * IT TAKES A BUNDLE, NOT A URL, and the bundle is served offline. The
       * bundle's `rendered.html` is the DOM its `capture.json` was extracted
       * from, so the two sides of the comparison are the same page by
       * construction; pointing this at the live site would report the site's own
       * drift since capture as an instrument gap.
       */
      if (sub === 'audit') {
        const cwd = global.cwd ?? process.cwd()
        const store = fsReferenceStore(cwd)
        const named = typeof rest[1] === 'string' ? rest[1] : undefined
        const all = flags.all === true
        if (!named && !all) {
          console.error('capture audit requires a bundle name, or --all.\n\n' + USAGE)
          process.exitCode = 1
          return
        }
        const names = named ? [named] : await store.list()
        if (!names.length) {
          console.error('No capture bundles on disk — run `1c capture page <url>` first.')
          process.exitCode = 1
          return
        }
        const audits = []
        for (const name of names) {
          audits.push(await runCaptureAudit(store.bundle(name), { driverFactory: createPlaywrightDriver }))
        }
        const combined = combineAudits(audits)
        if (flags.json === true) {
          console.log(JSON.stringify(combined, null, 2))
          return
        }
        for (const audit of combined.audits) {
          console.log(
            `${audit.bundle} (${audit.url})\n` +
              `  ${audit.elements} visible element(s); ${audit.observed} propert(ies) in use, ` +
              `${audit.carried} carried, ${audit.lost.length} used-but-absent, ` +
              `${audit.untriaged.length} untriaged` +
              (audit.stale ? `\n  ⚠ ${audit.stale}` : ''),
          )
        }
        const section = (title: string, rows: typeof combined.untriaged): string =>
          rows.length
            ? `\n${title} (${rows.length}):\n` +
              rows
                .map(
                  (r) =>
                    `  ${r.property}  ×${r.count} [${r.bundles.join(', ')}]` +
                    (r.values.length ? `\n      ${r.values.slice(0, 4).join(' | ')}` : '') +
                    (r.note ? `\n      ${r.note}` : ''),
                )
                .join('\n')
            : `\n${title}: none`
        console.log(
          section('UNTRIAGED — used by a page, no decision recorded', combined.untriaged) +
            section('USED BUT ABSENT — recorded axis, no instance in the bundle', combined.lost) +
            section('NOT EXPRESSIBLE IN L1 — a capability item, not an instrument one', combined.notExpressible),
        )
        return
      }
      if (sub !== 'page') {
        console.error(`Unknown capture subcommand: ${sub ?? '(none)'}\n\n${USAGE}`)
        process.exitCode = 1
        return
      }
      const url = requireSlug(rest[1])
      // REQ-155 — the CLI is the thing that knows it is on a laptop, so it is the
      // thing that constructs the filesystem adapter. `cmdCapturePage` takes the
      // store and has no default, which is what keeps `node:fs` out of the
      // capture pipeline's import graph.
      const cwd = global.cwd ?? process.cwd()
      // REQ-254 — `--json` reports WHERE THE BUNDLE LANDED, machine-readably.
      //
      // A capture is named after the host that ANSWERED, not the one that was
      // typed (`bundleNameFor`, BUG-67 B5): `www.` may be added or dropped on
      // the way. So a program that runs `capture` and then has to point
      // `--ref` at the result — the reproduction console is the first, an
      // unattended loop will be the next — cannot derive the directory from
      // its own input, and scraping it out of the prose line below is a
      // parser waiting to break on a wording change. Under `--json` the whole
      // command goes through `withCleanStdout` so a browser launch, a font
      // fetch or a Vite notice cannot land in the middle of the document.
      const json = flags.json === true
      const { name, capture, l1, hints } = json
        ? await withCleanStdout(() => cmdCapturePage(url, fsReferenceStore(cwd)))
        : await cmdCapturePage(url, fsReferenceStore(cwd))
      const l1Nodes = (l1.root.kind === 'box' || l1.root.kind === 'container' ? l1.root.children?.length : 0) ?? 0
      const dir = bundleDir(cwd, name)
      if (json) {
        console.log(
          JSON.stringify(
            {
              url: capture.url,
              name,
              dir,
              sections: capture.sections.length,
              assets: capture.assets.length,
              l1Nodes,
              widths: l1.widths.length,
            },
            null,
            2,
          ),
        )
        return
      }
      console.log(
        `Captured ${url} → ${dir}\n` +
          `  ${capture.sections.length} section(s), ${capture.assets.length} asset(s)\n` +
          `  l1.json: ${l1Nodes} node(s) across ${l1.widths.length} width(s); ` +
          `hints.json: ${hints.nodes.length} node(s), ${hints.mediaBreakpoints.length} @media breakpoint(s)`,
      )
      return
    }

    case 'repro': {
      const slug = requireSlug(rest[0])
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('repro requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const { draftDir, nodeCount, copiedAssets, localizedAssets, unreferencedAssets, forms, served } =
        await cmdRepro(slug, { ...global, ref })
      // BUG-23 — an unreferenced mirrored asset is a fold gap (the bundle has the
      // bytes; no leaf points at them), so it is reported, not silently dropped.
      const gap = unreferencedAssets.length
        ? `\n  ⚠ ${unreferencedAssets.length} mirrored asset(s) referenced by no node (fold gap):` +
          unreferencedAssets.map((a) => `\n      ${a}`).join('')
        : ''
      // REQ-93 — behaviours mounted into the page's L1 slots, and what the capture
      // could not tell us about each (an endpoint it never saw, an input type it
      // did not record). Surfaced so an honest default is never mistaken for a fact.
      const mounted = forms.length
        ? `\n  behaviours mounted: ${forms.length}` +
          forms
            .map(
              (f) =>
                `\n      ${f.behavior} → slot '${f.slot}' (${f.fields.length} field(s))` +
                f.residuals.map((r) => `\n        ⚠ ${r}`).join(''),
            )
            .join('')
        : ''
      // BUG-113 — what was WRITTEN, and the price of the alternative. `1c repro`
      // chooses between the absolute base and its structure-recovered overlay;
      // until now it made that choice silently and the gate graded the document
      // it did not pick. REQ-278 made the choice a measurement, so the line names
      // which of the two won and prints the recovery's numbers either way.
      const envelope = served
        ? `\n  served document: ${
            served.document === 'recovery' ? 'recovery (flow)' : 'base (absolute)'
          }, fidelity maxΔ ${served.fidelityMaxDeltaPx.toFixed(1)}px, ` +
          `${served.fidelityResiduals} residual(s)` +
          `\n      envelope: ` +
          // BUG-143 — `width×height:findings`. The height is on the line because it
          // is now a sampled axis: a page can be clean at every captured height and
          // come apart when the window is dragged taller, and a reader who cannot
          // see which height a count belongs to cannot tell those two apart.
          served.byWidth.map((w) => `${w.width}${w.height ? `\u00d7${w.height}` : ''}:${w.findings}`).join(' ') +
          `  ·  off-sample ` +
          served.offSample.map((w) => `${w.width}${w.height ? `\u00d7${w.height}` : ''}:${w.findings}`).join(' ') +
          `\n      recovery ${served.document === 'recovery' ? 'served' : 'declined'}: ` +
          `${served.recovery.promoted} region(s) flow, at ` +
          `maxΔ ${served.recovery.fidelityMaxDeltaPx.toFixed(1)}px / ` +
          `${served.recovery.fidelityResiduals} residual(s)` +
          (served.document === 'recovery'
            ? ' — the capture reproduced, and resilient to content that grows'
            : ' — a different page, not a repaired one')
        : ''
      console.log(
        `Reproduced ${ref} → ${draftDir}\n` +
          `  L1 home page: ${nodeCount} node(s)${copiedAssets ? '; assets copied' : ''}` +
          `; ${localizedAssets} media handle(s) bound to local mirror` +
          gap +
          mounted +
          envelope +
          `\n  next: 1c render ${slug}  ·  1c l1-gate --ref ${ref}`,
      )
      return
    }

    case 'refold': {
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('refold requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const { nodeCount, forms, residuals } = await cmdRefold(fsReferenceBundle(ref))
      console.log(
        `Refolded ${ref} from its retained oracle\n` +
          `  l1.json: ${nodeCount} node(s)\n` +
          `  forms.json: ${forms.length} behaviour binding(s)` +
          forms
            .map((f) => `\n      ${f.behavior} → slot '${f.slot}' (${f.fields.length} field(s))`)
            .join('') +
          `\n  fold residuals: ${residuals.length}`,
      )
      return
    }

    case 'l1-gate': {
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('l1-gate requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const report = await cmdL1Gate(fsReferenceBundle(ref))
      if (flags.json === true) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        const mark = (ok: boolean): string => (ok ? 'PASS' : 'FAIL')
        const findings = (r: { byWidth: Array<{ findings: unknown[] }> }): number =>
          r.byWidth.reduce((n, w) => n + w.findings.length, 0)
        console.log(
          `acceptance gate on ${ref}: ${report.pass ? 'PASS' : 'FAIL'}\n` +
            `  sample-fidelity     ${mark(report.sampleFidelity.pass)}  ` +
            `(maxΔ ${report.sampleFidelity.maxDelta.toFixed(1)}px, ${report.sampleFidelity.residuals.length} residual(s), ` +
            `${report.sampleFidelity.unmatched.length} unmatched` +
            // REQ-88 — text a mounted behaviour renders is not L1's to grade, but
            // saying so out loud keeps the mounted region from becoming a silent
            // hole in the only gate that reads geometry.
            (report.sampleFidelity.mounted.length
              ? `, ${report.sampleFidelity.mounted.length} in mounted behaviour`
              : '') +
            `)\n` +
            // BUG-112's probe (d), printed because BUG-113 makes it part of the
            // verdict: a probe that can turn this line FAIL and is not on the
            // report is the same defect one level up — a verdict about something
            // the reader cannot see.
            `  on-sample           ${mark(report.onSample.pass)}  (${findings(report.onSample)} envelope finding(s) at the captured widths)\n` +
            `  off-sample          ${mark(report.offSample.pass)}  (${findings(report.offSample)} envelope finding(s) ` +
            `across ${report.offSample.byWidth.length} width\u00d7height sample(s))\n` +
            `  content-robustness  ${mark(report.contentRobustness.pass)}  (${findings(report.contentRobustness)} finding(s))\n` +
            // BUG-113 made promotion a PRICED ALTERNATIVE rather than the
            // document the envelope probes graded; REQ-278 made which of the two
            // is served a measurement. Either way the line says the same thing —
            // what the recovery does to the envelope and what it costs against
            // the oracle — and names which document the probes above graded, so
            // the verdict and the page can never drift apart unannounced.
            `  recovery (${report.recovery.served ? 'SERVED, graded above' : 'not served'}): ` +
            `${report.recovery.promoted.length ? report.recovery.promoted.join(', ') : 'no region'} — ` +
            `${report.recovery.servedFindings} finding(s) → ${report.recovery.recoveredFindings}, ` +
            `at maxΔ ${report.recovery.fidelityMaxDeltaPx.toFixed(1)}px / ` +
            `${report.recovery.fidelityResiduals} fidelity residual(s)\n` +
            // BUG-113 — the gate grades the bundle's RETAINED l1.json, because
            // that is what `1c repro` serves. When a re-fold of the same oracle
            // would produce something else, say so: the verdict is still about
            // the served document, but the operator should not have to discover
            // that a refold changes its subject.
            (report.staleFold ? `  ⚠ stale fold: ${report.staleFold}\n` : '') +
            // REQ-93 — behaviours recovered into slots. Reported beside the fold
            // residuals because it is the same completeness question from the
            // other side: what the page needs that raw L1 does not express.
            `  behaviours mounted: ${report.forms.length ? report.forms.map((f) => `${f.behavior}@${f.slot}`).join(', ') : 'none'}\n` +
            `  fold residuals (folder-power gaps): ${report.foldResiduals.length}` +
            (report.foldResiduals.length
              ? '\n' +
                report.foldResiduals
                  .slice(0, 10)
                  .map((r) => `    - ${r.kind}: ${r.reason}${r.capturedAxes.length ? ` [${r.capturedAxes.join(', ')}]` : ''}`)
                  .join('\n') +
                (report.foldResiduals.length > 10 ? `\n    … +${report.foldResiduals.length - 10} more` : '')
              : ''),
        )
      }
      if (!report.pass) process.exitCode = 1
      return
    }

    case 'gate': {
      // REQ-94 — the three gates run and are compared to each other. `--actual-image`
      // / `--actual-manifest` are the same offline seams `diff` / `values-diff`
      // expose, so the reconciliation is drivable without a headless browser.
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('gate requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const actualImagePath = typeof flags['actual-image'] === 'string' ? flags['actual-image'] : undefined
      const actualManifestPath =
        typeof flags['actual-manifest'] === 'string' ? flags['actual-manifest'] : undefined
      const offline = Boolean(actualImagePath && actualManifestPath)
      const slug = offline ? undefined : requireSlug(rest[0])
      const source: RenderChannel = flags.source === 'published' ? 'published' : 'draft'
      const floorFlag = (name: string): number | undefined => {
        const v = flags[name]
        if (typeof v !== 'string') return undefined
        const n = Number(v)
        if (Number.isNaN(n)) throw new Error(`--${name} expects a number, got '${v}'.`)
        return n
      }
      // BUG-110 — the value gate's bound is a per-run dial for the same reason
      // the perceptual one is: `none` restores the pre-BUG-110 behaviour where
      // no delta of any severity could decide the verdict.
      const valuesTierFlag = (): SeverityTier | null | undefined => {
        const v = flags['values-tier']
        if (typeof v !== 'string') return undefined
        const upper = v.toUpperCase()
        if (upper === 'NONE') return null
        if (upper === 'CRITICAL' || upper === 'HIGH' || upper === 'MEDIUM' || upper === 'LOW') return upper
        throw new Error(`--values-tier expects one of CRITICAL|HIGH|MEDIUM|LOW|none, got '${v}'.`)
      }
      const report = await withCleanStdout(() =>
        cmdGate({
          ...global,
          slug,
          source,
          ref,
          size: parseSize(flags.size),
          actualImagePath,
          actualManifestPath,
          out: typeof flags.out === 'string' ? flags.out : undefined,
          floor: {
            mean: floorFlag('mean-floor'),
            pct: floorFlag('pct-floor'),
            valuesTier: valuesTierFlag(),
          },
        }),
      )
      if (flags.json === true) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        console.log(formatGateReport(report, ref))
      }
      if (!report.pass) process.exitCode = 1
      return
    }

    case 'shot': {
      const targetUrl = typeof flags.url === 'string' ? flags.url : undefined
      const slug = targetUrl ? undefined : requireSlug(rest[0])
      const source = flags.source === 'published' ? 'published' : 'draft'
      const viewport = parseViewport(flags.viewport)
      const { outFile, url: shotUrl, viewport: vp } = await cmdShot({
        ...global,
        slug,
        url: targetUrl,
        source,
        viewport,
        out: typeof flags.out === 'string' ? flags.out : undefined,
      })
      console.log(`Shot ${shotUrl} @ ${vp.width}×${vp.height} → ${outFile}`)
      return
    }

    case 'values-diff': {
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('values-diff requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const actualPath = typeof flags.actual === 'string' ? flags.actual : undefined
      // BUG-103 — the OUTPUT side of the manifest seam. `--actual` and `--out`
      // were both inputs-or-reports; nothing wrote the manifests the diff was
      // computed from, so a summarised delta (`contentAnchor: center (0.50)`)
      // could not be read back to the values behind it.
      const actualOut = typeof flags['actual-out'] === 'string' ? flags['actual-out'] : undefined
      const expectedOut = typeof flags['expected-out'] === 'string' ? flags['expected-out'] : undefined
      const slug = actualPath ? undefined : requireSlug(rest[0])
      const source: RenderChannel = flags.source === 'published' ? 'published' : 'draft'
      // REQ-53 tolerance flags: axes we author are exact by default; `--tolerant`
      // restores loose matching, or per-metric numeric overrides (`--color-tol`,
      // `--line-height-tol`, `--position-tol`, …) loosen a single axis.
      const numFlag = (name: string): number | undefined => {
        const v = flags[name]
        if (typeof v !== 'string') return undefined
        const n = Number(v)
        if (Number.isNaN(n)) throw new Error(`--${name} expects a number, got '${v}'.`)
        return n
      }
      // REQ-48 (item 9) ignore-masks: `--ignore` is a comma-separated list of
      // regex sources; `--compare-years` opts out of the built-in year mask.
      const ignore =
        typeof flags.ignore === 'string'
          ? flags.ignore
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined
      const diffOptions = {
        tolerant: flags.tolerant === true,
        ignore,
        ignoreDynamicYear: flags['compare-years'] === true ? false : undefined,
        colorTolerance: numFlag('color-tol'),
        fontSizeTolerancePx: numFlag('font-size-tol'),
        lineHeightTolerancePx: numFlag('line-height-tol'),
        letterSpacingTolerancePx: numFlag('letter-spacing-tol'),
        paddingTolerancePx: numFlag('padding-tol'),
        borderWidthTolerancePx: numFlag('border-tol'),
        fontWeightTolerance: numFlag('weight-tol'),
        positionTolerancePx: numFlag('position-tol'),
        widthTolerancePx: numFlag('width-tol'),
        heightTolerancePx: numFlag('height-tol'),
        borderRadiusTolerancePx: numFlag('radius-tol'),
      }
      // REQ-58 (T2) — multi-viewport mode: pair the served draft against the
      // reference's persisted viewport ladder, cell-for-cell, so a %-vs-fixed
      // reflow invisible at the single default width is surfaced in its cell.
      if (flags['multi-viewport'] === true) {
        // Keep render/Vite chatter off stdout so `--json` is a clean document.
        const cells = await withCleanStdout(() =>
          cmdValuesDiffMultiViewport({
            ...global,
            slug,
            source,
            refBundleDir: ref,
            out: typeof flags.out === 'string' ? flags.out : undefined,
            // BUG-103 — passed through so the ladder path REFUSES them rather
            // than dropping them; an ignored flag reads as a flag that worked.
            actualOut,
            expectedOut,
            diffOptions,
          }),
        )
        // REQ-64 — `--collapse` dedups the per-cell deltas to one row per DEFECT
        // (the x-viewport multiplier removed), grouped in repair order.
        // REQ-76 — `--clusters` rolls those defects up into ranked CAUSES with a
        // fix/review/accept disposition (the noise-management view).
        const collapse = flags.collapse === true
        const clusters = flags.clusters === true
        if (flags.json === true) {
          const payload = clusters ? clusterDefects(collapseMultiViewport(cells)) : collapse ? collapseMultiViewport(cells) : cells
          console.log(JSON.stringify(payload, null, 2))
        } else {
          console.log(
            clusters ? formatClusterReport(cells) : collapse ? formatCollapsedReport(cells) : formatMultiViewportReport(cells),
          )
        }
        // A missing cell or any per-cell delta is a fidelity failure to clear.
        if (cells.some((c) => c.missing || (c.report?.deltas.length ?? 0) > 0)) process.exitCode = 1
        return
      }

      // REQ-61 — `--size mobile|tablet|desktop` diffs at that viewport: the
      // reference is read from the persisted ladder at that width and the actual
      // is rendered there. Absent → the single-width default path.
      const size = parseSize(flags.size)
      const report = await withCleanStdout(() =>
        cmdValuesDiff({
          ...global,
          slug,
          source,
          refBundleDir: ref,
          actualManifestPath: actualPath,
          out: typeof flags.out === 'string' ? flags.out : undefined,
          actualOut,
          expectedOut,
          diffOptions,
          size,
        }),
      )
      if (flags.json === true) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        console.log(formatReport(report))
      }
      // A non-empty diff is a fidelity failure the operator must clear.
      if (report.deltas.length > 0) process.exitCode = 1
      return
    }

    case 'diff': {
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('diff requires --ref <bundleDir|refPng>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const actualImagePath = typeof flags.actual === 'string' ? flags.actual : undefined
      const slug = actualImagePath ? undefined : requireSlug(rest[0])
      const source: RenderChannel = flags.source === 'published' ? 'published' : 'draft'
      const numFlag = (name: string): number | undefined => {
        const v = flags[name]
        if (typeof v !== 'string') return undefined
        const n = Number(v)
        if (Number.isNaN(n)) throw new Error(`--${name} expects a number, got '${v}'.`)
        return n
      }
      const tuning: DiffTuning = {
        blockPx: numFlag('block'),
        pixelThreshold: numFlag('threshold'),
        blockThreshold: numFlag('block-threshold'),
        bands: numFlag('bands'),
        topN: numFlag('top'),
        padPx: numFlag('pad'),
      }
      // REQ-61 — `--size` shoots the actual at that viewport and pairs it against
      // the same-width reference screenshot from the bundle.
      const report = await cmdDiff({
        ...global,
        slug,
        source,
        ref,
        actualImagePath,
        out: typeof flags.out === 'string' ? flags.out : undefined,
        // BUG-103 — keep the reproduction's own screenshot instead of deleting it
        // with the scratch dir and leaving `regions.json` naming a missing file.
        actualOut: typeof flags['actual-out'] === 'string' ? flags['actual-out'] : undefined,
        tuning,
        size: parseSize(flags.size),
      })
      if (flags.json === true) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        console.log(formatDiffReport(report))
      }
      // Any region of interest is a perceptual delta the operator must clear.
      if (report.regions.length > 0) process.exitCode = 1
      return
    }

    case 'responsive-diff': {
      // REQ-61 — analyse one captured site across sizes: line up the persisted
      // ladder's per-width manifests into an N-way per-node table.
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('responsive-diff requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const sizes = parseSizes(flags.sizes)
      const table = await cmdResponsiveDiff({
        refBundleDir: ref,
        sizes,
        out: typeof flags.out === 'string' ? flags.out : undefined,
      })
      // REQ-61 Phase 2 — `--classify` labels each changed node value-step /
      // presence-flip / layout-swap; without it, print the raw N-way table.
      if (flags.classify === true) {
        const classified = classifyResponsiveTable(table)
        console.log(flags.json === true ? JSON.stringify(classified, null, 2) : formatClassifiedTable(classified))
      } else if (flags.json === true) {
        console.log(JSON.stringify(table, null, 2))
      } else {
        console.log(formatResponsiveTable(table))
      }
      return
    }

    case 'crop': {
      const input = requireSlug(rest[0])
      const box = parseBox(flags.box)
      const { outFile, box: applied } = await cmdCrop({
        input,
        box,
        out: typeof flags.out === 'string' ? flags.out : undefined,
      })
      console.log(`Cropped ${input} @ ${applied.x},${applied.y} ${applied.w}×${applied.h} → ${outFile}`)
      return
    }

    case 'aligned-crops': {
      // REQ-78 — the AI perceptual judge's eyes: drift-aligned ref/ours crop pairs
      // per section anchor, so like is compared with like (no whole-page pixel diff
      // corrupted by cumulative vertical drift). Emits crops + index.md to --out.
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('aligned-crops requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const slug = requireSlug(rest[0])
      const size = parseSize(flags.size) ?? 'desktop'
      const viewportWidth = VIEWPORTS[size].width
      const areas = typeof flags.areas === 'string' ? flags.areas.split(',').map((s) => s.trim()).filter(Boolean) : undefined
      const outDir = typeof flags.out === 'string' ? flags.out : path.join('storage', 'tmp', `aligned-crops-${slug}`)
      const { areas: written, indexPath } = await withCleanStdout(() =>
        cmdAlignedCrops({
          ...global,
          slug,
          source: flags.source === 'published' ? 'published' : 'draft',
          refBundleDir: ref,
          viewportWidth,
          areas,
          outDir,
        }),
      )
      console.log(`aligned-crops: ${written.length} area(s) @ ${viewportWidth}px → ${outDir}`)
      for (const a of written) console.log(`  ${a.anchor}  (drift ${a.drift >= 0 ? '+' : ''}${a.drift}px)`)
      console.log(`  index: ${indexPath}`)
      return
    }

    case 'adopt-gaps': {
      // REQ-74 — close section-boundary `gap` deltas by inverting to spacingTop. Runs
      // a desktop values-diff, then sets each module's spacingTop = current + correction.
      const ref = typeof flags.ref === 'string' ? flags.ref : undefined
      if (!ref) {
        console.error('adopt-gaps requires --ref <captureBundleDir>.\n\n' + USAGE)
        process.exitCode = 1
        return
      }
      const slug = requireSlug(rest[0])
      const json = flags.json === true
      try {
        const report = await withCleanStdout(() =>
          cmdValuesDiff({
            ...global,
            slug,
            source: flags.source === 'published' ? 'published' : 'draft',
            refBundleDir: ref,
            size: parseSize(flags.size) ?? 'desktop',
          }),
        )
        const gaps = report.deltas
          .filter((d) => d.property === 'gap')
          .map((d) => ({ text: d.text, expected: d.expected, actual: d.actual }))
        emit(
          await cmdApplyGapFixes(slug, gaps, {
            ...editOptions(global),
            apply: flags.apply === true,
          }),
          json,
        )
      } catch (err) {
        fail(err, json)
      }
      return
    }

    case 'colors': {
      const slug = requireSlug(rest[0])
      if (flags.assign) {
        // `--names slate=text,teal=primary` renames derived families to DOC-23
        // §5.4's role vocabulary, keeping the retrofit reproducible from the
        // command line rather than finishing it by hand.
        const names: Record<string, string> = {}
        if (typeof flags.names === 'string') {
          for (const pair of flags.names.split(',')) {
            const [from, to] = pair.split('=')
            if (from && to) names[from.trim()] = to.trim()
          }
        }
        const result = cmdColorsAssign(slug, global, names)
        // `--json` emits the palette ALONE, deliberately: AC-941 pins this
        // document to be the palette the site now stores, so it can be diffed
        // against site.json directly. Wrapping it to carry `drift` alongside
        // would break that identity. The accepted drift is reported by
        // `formatAssign`, and is re-derivable from the palette by resolving
        // each reference — it is not lost, only not duplicated here.
        if (flags.json) console.log(JSON.stringify(result.palette, null, 2))
        else console.log(formatAssign(result))
        return
      }
      const census = cmdColors(slug, global)
      if (flags.json) console.log(JSON.stringify(census, null, 2))
      else console.log(formatCensus(census))
      return
    }

    case 'fonts': {
      const json = flags.json === true
      const sub = rest[0]
      // REQ-311 — `catalogue` and `doc` join `check`. They are separate verbs
      // rather than one refresh because the catalogue is the evidence and the
      // document is the advertisement: a refresh is inspected and committed
      // before the thing that tells the assistant what it may serve moves.
      if (sub === 'catalogue') {
        try {
          const report = await cmdFontsCatalogue({
            cwd: process.cwd(),
            metadata: typeof flags.metadata === 'string' ? flags.metadata : undefined,
            repo: typeof flags.repo === 'string' ? flags.repo : undefined,
          })
          if (json) console.log(JSON.stringify({ ok: true, data: report }, null, 2))
          else console.log(formatCatalogueReport(report))
        } catch (err) {
          fail(err, json)
        }
        return
      }
      if (sub === 'doc') {
        try {
          const report = cmdFontsDoc({ cwd: process.cwd(), stdout: flags.stdout === true })
          if (flags.stdout === true) console.log(report.body)
          else if (json) console.log(JSON.stringify({ ok: true, data: report }, null, 2))
          else console.log(formatFontDocReport(report))
        } catch (err) {
          fail(err, json)
        }
        return
      }
      // [[REQ-312]] — the mirror is acquired like a dependency, so `mirror` and
      // `publish` are two verbs and not one: converting 2.5GB of upstream binaries
      // and pushing the result to R2 are separately resumable, and an operator
      // inspects the manifest between them.
      if (sub === 'mirror') {
        try {
          const cwd = process.cwd()
          const report = cmdFontsMirror({
            cwd,
            repo: typeof flags.repo === 'string' ? flags.repo : undefined,
            ref: typeof flags.ref === 'string' ? flags.ref : undefined,
            only:
              typeof flags.only === 'string'
                ? flags.only.split(',').map((s) => s.trim()).filter((s) => s !== '')
                : undefined,
            quality: typeof flags.quality === 'string' ? Number(flags.quality) : undefined,
            onProgress: json ? undefined : (line) => console.error(line),
          })
          // [[REQ-315]] — AND THE LOCAL DEV STORES, IN THE SAME BREATH, for the
          // reason `cmdFontsMirror` already re-projects at its own tail: the
          // projection it just refreshed fills in EVERY environment, so from
          // this moment `use_font` binds `/_fonts/…` paths that local dev cannot
          // answer unless the bytes are put where `wrangler dev` reads them.
          // The operator starts the builder and fonts work, having typed nothing
          // extra and having chosen no environment.
          //
          // HERE RATHER THAN INSIDE `cmdFontsMirror`, which is synchronous and
          // whose callers are: opening a local store is async, and `1c fonts
          // mirror` IS this dispatch. `seedAfterMirror` is the callable
          // operation, so `bin/deploy --fonts --env dev` invokes the same one.
          const seeded = await seedAfterMirror(cwd, json ? () => {} : (line) => console.error(line))
          if (json) {
            console.log(JSON.stringify({ ok: report.failures.length === 0, data: { ...report, seed: seeded } }, null, 2))
          } else {
            console.log(formatMirrorReport(report))
            if (seeded) console.log(formatPublishReport(seeded))
          }
          if (report.failures.length > 0) process.exitCode = 1
        } catch (err) {
          fail(err, json)
        }
        return
      }
      if (sub === 'publish') {
        try {
          const report = await cmdFontsPublish({
            cwd: process.cwd(),
            dryRun: flags['dry-run'] === true,
            onProgress: json ? undefined : (line) => console.error(line),
          })
          if (json) console.log(JSON.stringify({ ok: report.missing.length === 0, data: report }, null, 2))
          else console.log(formatPublishReport(report))
          if (report.missing.length > 0) process.exitCode = 1
        } catch (err) {
          fail(err, json)
        }
        return
      }
      // [[REQ-315]] — the other delivery. `publish` writes the cloud bucket over
      // the R2 REST API; `seed` writes the miniflare store `wrangler dev` reads,
      // so the environment the work is done in serves the same bytes through the
      // same `r2PlatformFonts(env.SITES)` the deployed Worker uses.
      if (sub === 'seed') {
        try {
          const report = await cmdFontsSeed({
            cwd: process.cwd(),
            dryRun: flags['dry-run'] === true,
            apps:
              typeof flags.app === 'string'
                ? flags.app.split(',').map((s) => s.trim()).filter((s) => s !== '')
                : undefined,
            onProgress: json ? undefined : (line) => console.error(line),
          })
          if (json) console.log(JSON.stringify({ ok: report.missing.length === 0, data: report }, null, 2))
          else console.log(formatPublishReport(report))
          if (report.missing.length > 0) process.exitCode = 1
        } catch (err) {
          fail(err, json)
        }
        return
      }
      // [[REQ-313]] — the assistant's half of the mirror. A separate verb from
      // `mirror` because it is cheap, pure and re-runnable: it reads two files
      // already on disk and writes one, so an operator who has only refreshed the
      // catalogue can re-project without touching 2.5GB of upstream binaries.
      if (sub === 'index') {
        try {
          const report = cmdFontsIndex(process.cwd())
          if (json) console.log(JSON.stringify({ ok: true, data: report }, null, 2))
          else console.log(formatIndexReport(report))
        } catch (err) {
          fail(err, json)
        }
        return
      }
      if (sub !== 'check') {
        console.error(
          `Unknown fonts subcommand '${sub ?? ''}'. Expected: check, catalogue, doc, mirror, index, publish, seed.\n\n` + USAGE,
        )
        process.exitCode = 1
        return
      }
      try {
        const report = cmdFontsCheck(process.cwd())
        if (json) {
          console.log(JSON.stringify({ ok: report.pass, data: report }, null, 2))
        } else {
          console.log(formatFontsReport(report))
        }
        if (!report.pass) process.exitCode = 1
      } catch (err) {
        fail(err, json)
      }
      return
    }

    // REQ-117 — the editor's loop, end to end in one command: apply a validated
    // diff, then re-render the channel the editor is displaying so the host has
    // only to refresh the iframe. It is its own case rather than part of
    // `dispatchEdit` because that re-render is async, and because a failed
    // validation must stop BEFORE it — an invalid edit leaves both the draft and
    // the rendered bytes exactly as the user left them.
    case 'copy': {
      const json = flags.json === true
      try {
        const sub = rest[0]
        const slug = requireArg(rest[1], 'slug')
        const pageId = requireArg(rest[2], 'pageId')
        const addr = requireArg(rest[3], 'path')
        const scope = {
          ...editOptions(global),
          module: typeof flags.module === 'string' ? flags.module : undefined,
          slot: typeof flags.slot === 'string' ? flags.slot : undefined,
          // [[REQ-314]] — THIS WORKSPACE'S corpus, not the one the build saw.
          // `1c` runs in a checkout whose mirror the operator refreshes with
          // `1c fonts mirror`, and the bundled projection describes whichever
          // mirror existed when the package was built. Choosing a typeface has
          // to be resolved against the families this workspace actually holds,
          // which is what the builder transport reads for the same reason.
          fonts: buildIndex(ctxOf(global).cwd),
        }
        if (sub === 'get') {
          emit(await editCopyGet(slug, pageId, addr, scope), json)
          return
        }
        if (sub !== 'set') throw unknownSub('copy', sub)

        const raw = flags.values
        if (typeof raw !== 'string') {
          throw new CommandError({
            code: 'SCHEMA_INVALID',
            message: 'copy set requires --values <json>.',
            hint: 'Pass the change map, e.g. --values \'{"text":"New heading"}\'.',
          })
        }
        let values: unknown
        try {
          values = JSON.parse(raw)
        } catch {
          throw new CommandError({
            code: 'SCHEMA_INVALID',
            message: '--values is not valid JSON.',
            path: 'values',
            hint: 'It is one modal\'s change map: {"<field>":"<text>"}.',
          })
        }
        if (values === null || typeof values !== 'object' || Array.isArray(values)) {
          throw new CommandError({
            code: 'SCHEMA_INVALID',
            message: '--values must be a JSON object of field → string.',
            path: 'values',
          })
        }
        const out = await editCopySet(slug, pageId, addr, values as Record<string, unknown>, scope)
        // BOTH channels, for the same reason `/api/copy` POST renders both: an
        // edit changes the page, not one rendering of it. Re-rendering only
        // `edit` leaves the draft showing whatever the last `1c render`
        // produced, so the change is invisible everywhere the page is read as a
        // visitor would read it — and nothing signals the staleness, because a
        // stale draft looks like a working page, just an old one.
        //
        // The editor and the AI are peers on this surface (DOC-28 §4), so they
        // cannot leave the store in different states after the same edit.
        const { outDir } = await cmdRender(slug, { ...global, edit: true })
        const { outDir: draftDir } = await cmdRender(slug, { ...global, edit: false })
        emit(
          {
            data: { ...(out.data as Record<string, unknown>), rendered: outDir, renderedDraft: draftDir },
            human: `${out.human}\nRe-rendered edit channel → ${outDir}\nRe-rendered draft channel → ${draftDir}`,
          },
          json,
        )
      } catch (err) {
        fail(err, json)
      }
      return
    }

    case 'page':
    case 'config':
    case 'palette':
    case 'asset':
    case 'module':
    case 'behavior':
    case 'changes':
    case 'status': {
      const json = flags.json === true
      try {
        emit(await dispatchEdit(command, rest, flags, global), json)
      } catch (err) {
        fail(err, json)
      }
      return
    }

    default:
      console.error(`Unknown command: ${command}\n\n${USAGE}`)
      process.exitCode = 1
      return
  }
}

/**
 * The CLI's store (REQ-142).
 *
 * `1c` edits the file-backed tree on the operator's own machine (DOC-12 §3.1), so
 * this is the ONE place in the CLI that names the filesystem adapter. Every
 * `edit*` call below is handed the result and none of them can tell what it is.
 */
function editOptions(global: GlobalOptions): EditOptions {
  return { ...global, store: fsSiteStore(ctxOf(global)) }
}

/** Route a structured-edit command to its handler; throws {@link CommandError}. */
async function dispatchEdit(
  command: string,
  rest: string[],
  flags: Record<string, string | boolean>,
  global: GlobalOptions,
): Promise<EditOutput> {
  const opts = editOptions(global)
  const str = (name: string): string | undefined => {
    const v = flags[name]
    return typeof v === 'string' ? v : undefined
  }
  const force = flags.force === true

  /** A flag whose value is a JSON document (a settings object, an L1 subtree). */
  const jsonFlag = (name: string): Record<string, unknown> | undefined => {
    const raw = str(name)
    if (raw === undefined) return undefined
    const parsed = parseConfigValue(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new CommandError({
        code: 'SCHEMA_INVALID',
        message: `--${name} must be a JSON object.`,
        path: name,
      })
    }
    return parsed as Record<string, unknown>
  }

  if (command === 'status') {
    return editStatus(requireArg(rest[0], 'slug'), opts)
  }

  // REQ-131 — the same journal the assistant reads, for the operator. It is on
  // the CLI for the reason every other read here is: the two callers ask the
  // same question, and a second implementation of the answer is how they come
  // to disagree about it.
  if (command === 'changes') {
    const since = str('since')
    return editChanges(requireArg(rest[0], 'slug'), since === undefined ? undefined : Number(since), opts)
  }

  // The catalog is the framework's, not a site's, so it takes no slug.
  if (command === 'behavior') {
    if (rest[0] !== undefined && rest[0] !== 'list') throw unknownSub('behavior', rest[0])
    return editBehaviorList()
  }

  const sub = rest[0]
  const slug = requireArg(rest[1], 'slug')

  if (command === 'module') {
    // [[BUG-85]] — the one `module` sub that is about the whole site rather
    // than one page, so it is answered ABOVE the `pageId` every other sub
    // requires. Read-only unless `--write`: see `upgradeSiteModules`.
    if (sub === 'upgrade') {
      return editModuleUpgrade(slug, { ...opts, ...(flags.write === true ? { write: true } : {}) })
    }
    const pageId = requireArg(rest[2], 'pageId')
    switch (sub) {
      case 'add':
        return editModuleAdd(slug, pageId, requireArg(rest[3], 'moduleId'), requireArg(rest[4], 'type'), {
          ...opts,
          version: str('version') === undefined ? undefined : Number(str('version')),
          slot: str('slot'),
          config: jsonFlag('config'),
          slots: jsonFlag('slots') as Record<string, never> | undefined,
        })
      case 'set':
        return editModuleConfigure(
          slug,
          pageId,
          requireArg(rest[3], 'moduleId'),
          jsonFlag('config') ??
            (() => {
              throw new CommandError({
                code: 'SCHEMA_INVALID',
                message: 'module set requires --config <json>.',
              })
            })(),
          opts,
        )
      case 'rm':
        return editModuleRm(slug, pageId, requireArg(rest[3], 'moduleId'), opts)
      default:
        throw unknownSub('module', sub)
    }
  }

  if (command === 'page') {
    // [[REQ-247]] — the same four email fields the control surface takes, so
    // `1c` and the assistant author a message with one vocabulary.
    const kind = str('kind')
    const declared = str('placeholders')
    const writeOpts = {
      ...opts,
      title: str('title'),
      path: str('path'),
      seoMeta: jsonFlag('seo'),
      ...(kind === 'email' || kind === 'web' ? { kind: kind as 'web' | 'email' } : {}),
      ...(str('subject') === undefined ? {} : { subject: str('subject') }),
      ...(declared === undefined
        ? {}
        : { placeholders: declared.split(',').map((t) => t.trim()).filter((t) => t !== '') }),
      ...(str('from') === undefined ? {} : { from: str('from') }),
    }
    switch (sub) {
      case 'list':
        return editPageList(slug, opts)
      case 'get':
        return editPageGet(slug, requireArg(rest[2], 'pageId'), opts)
      case 'add':
        return editPageAdd(slug, requireArg(rest[2], 'pageId'), writeOpts)
      // [[REQ-301]] — the copy takes TWO page ids, source then new, which is why
      // it reads its own arguments rather than sharing `add`'s single-id shape.
      case 'copy':
        return editPageCopy(slug, requireArg(rest[2], 'fromPageId'), requireArg(rest[3], 'pageId'), {
          ...opts,
          title: str('title'),
          path: str('path'),
        })
      case 'update':
        return editPageUpdate(slug, requireArg(rest[2], 'pageId'), writeOpts)
      case 'rm':
        return editPageRm(slug, requireArg(rest[2], 'pageId'), { ...opts, force })
      default:
        throw unknownSub('page', sub)
    }
  }

  // REQ-133 — the palette's own group. `config set` can write a palette but
  // cannot remove or move a key, and it has nothing to say about the references
  // both of those operations are defined in terms of.
  if (command === 'palette') {
    switch (sub) {
      case 'get':
        return editPaletteGet(slug, opts)
      case 'set':
        return editPaletteSet(slug, requireArg(rest[2], 'name'), requireArg(rest[3], 'value'), opts)
      case 'add':
        return editPaletteAdd(slug, requireArg(rest[2], 'name'), requireArg(rest[3], 'value'), opts)
      case 'rm':
        return editPaletteRm(slug, requireArg(rest[2], 'name'), opts)
      case 'rename':
        return editPaletteRename(slug, requireArg(rest[2], 'from'), requireArg(rest[3], 'to'), opts)
      default:
        throw unknownSub('palette', sub)
    }
  }

  if (command === 'config') {
    switch (sub) {
      case 'get':
        return editConfigGet(slug, rest[2], opts)
      case 'set':
        // argv is the one place a value genuinely arrives as text, so it is the
        // one place the JSON re-read belongs (see `parseConfigValue`).
        return editConfigSet(
          slug,
          requireArg(rest[2], 'key'),
          parseConfigValue(requireArg(rest[3], 'value')),
          opts,
        )
      default:
        throw unknownSub('config', sub)
    }
  }

  // command === 'asset'
  switch (sub) {
    case 'list':
      return editAssetList(slug, opts)
    case 'get':
      return editAssetGet(slug, requireArg(rest[2], 'assetName'), opts)
    case 'add': {
      // The source file is the OPERATOR'S, not the store's (REQ-142), so the CLI
      // is what opens it — and refuses a missing one with the envelope the
      // command surface has always reported.
      const file = requireArg(rest[2], 'file')
      let bytes: Uint8Array
      try {
        bytes = new Uint8Array(readFileSync(file))
      } catch {
        throw new CommandError({
          code: 'NOT_FOUND',
          message: `Source file '${file}' does not exist.`,
          path: file,
          hint: 'Pass a path to a readable file.',
        })
      }
      return editAssetAdd(slug, str('as') ?? path.basename(file), bytes, opts)
    }
    case 'write':
      return editAssetWrite(
        slug,
        requireArg(rest[2], 'name'),
        requireArg(str('content'), 'content'),
        { ...opts, force },
      )
    case 'rm':
      return editAssetRm(slug, requireArg(rest[2], 'assetName'), { ...opts, force })
    default:
      throw unknownSub('asset', sub)
  }
}

/** Print a success result: a `{ok,data}` envelope in JSON mode, else the human text. */
function emit(out: EditOutput, json: boolean): void {
  if (json) {
    console.log(JSON.stringify({ ok: true, data: out.data }))
  } else if (out.human) {
    console.log(out.human)
  }
}

/** Print a failure: a `{ok:false,error}` envelope in JSON mode, else a human line. Sets exit code. */
function fail(err: unknown, json: boolean): void {
  const ce =
    err instanceof CommandError
      ? err
      : new CommandError({ code: 'INTERNAL', message: err instanceof Error ? err.message : String(err) })
  if (json) {
    console.log(JSON.stringify({ ok: false, error: ce.toEnvelope() }))
  } else {
    console.error(ce.toHuman())
  }
  process.exitCode = EXIT_CODES[ce.code]
}

function unknownSub(command: string, sub: string | undefined): CommandError {
  return new CommandError({
    code: 'INTERNAL',
    message: `Unknown '${command}' subcommand: ${sub ?? '(none)'}`,
    hint: 'See `1c help` for usage.',
  })
}

/** Validate a `--viewport` flag against the known presets (default desktop). */
function parseViewport(val: string | boolean | undefined): ViewportName {
  if (typeof val !== 'string') return 'desktop'
  if (!(val in VIEWPORTS)) {
    throw new Error(`Invalid --viewport '${val}'. Use ${Object.keys(VIEWPORTS).join('|')}.`)
  }
  return val as ViewportName
}

/**
 * REQ-61 — validate a `--size` flag (the diff commands' viewport selector). Same
 * preset vocabulary as `--viewport`, but returns `undefined` when absent so the
 * caller keeps its default (single-width) path rather than forcing a ladder read.
 */
function parseSize(val: string | boolean | undefined): ViewportName | undefined {
  if (val === undefined) return undefined
  if (typeof val !== 'string' || !(val in VIEWPORTS)) {
    throw new Error(`Invalid --size '${String(val)}'. Use ${Object.keys(VIEWPORTS).join('|')}.`)
  }
  return val as ViewportName
}

/**
 * REQ-61 — parse `--sizes a,b,c` for `responsive-diff` (the table's columns, in
 * order). Absent → undefined so the command applies its default (mobile, tablet,
 * desktop). Each name must be a known preset.
 */
function parseSizes(val: string | boolean | undefined): ViewportName[] | undefined {
  if (val === undefined) return undefined
  if (typeof val !== 'string') {
    throw new Error(`Invalid --sizes. Use a comma list of ${Object.keys(VIEWPORTS).join('|')}.`)
  }
  const names = val.split(',').map((s) => s.trim()).filter(Boolean)
  for (const name of names) {
    if (!(name in VIEWPORTS)) {
      throw new Error(`Invalid --sizes entry '${name}'. Use ${Object.keys(VIEWPORTS).join('|')}.`)
    }
  }
  return names as ViewportName[]
}

function requireSlug(slug: string | undefined): string {
  if (!slug) {
    throw new Error('Missing required <slug> argument.')
  }
  return slug
}

/** Parse a `--box x,y,w,h` flag into a {@link RegionBox}. */
function parseBox(val: string | boolean | undefined): RegionBox {
  if (typeof val !== 'string') {
    throw new Error('crop requires --box <x,y,w,h>.')
  }
  const parts = val.split(',').map((p) => Number(p.trim()))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid --box '${val}'. Use --box x,y,w,h (four numbers).`)
  }
  const [x, y, w, h] = parts
  return { x, y, w, h }
}

/** Require a positional arg or throw a structured (enveloped) error. */
function requireArg(val: string | undefined, name: string): string {
  if (val === undefined || val === '') {
    throw new CommandError({
      code: 'INTERNAL',
      message: `Missing required <${name}> argument.`,
      hint: 'See `1c help` for usage.',
    })
  }
  return val
}

export { InvalidDefinitionError }
