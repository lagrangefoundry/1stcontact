import { parseArgs } from './args'
import { withCleanStdout } from './stdio'
import {
  cmdCheckout,
  cmdList,
  cmdNew,
  cmdPublish,
  cmdRender,
  cmdRevisions,
  ctxOf,
  type GlobalOptions,
} from './commands'
import { spawn } from 'node:child_process'
import { cmdAssets, formatAssetReport } from './assets'
import { pushSite } from './push'
import { fsSiteStore } from '../store'
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
  editPageAdd,
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
import { cmdCapturePage } from './capture'
import { cmdDeploy, formatDeployReport } from '../deploy'
import { cmdFontsCheck, formatFontsReport } from './fonts'
import {
  cmdColors,
  cmdColorsAssign,
  formatAssign,
  formatCensus,
  SHADE_FIT_TOLERANCE,
} from './colors'
import { cmdRefold, cmdRepro, cmdL1Gate } from './repro'
import { cmdGate, formatGateReport } from './gate'
import { CommandError, EXIT_CODES, InvalidDefinitionError } from './errors'
import { assertInstall, checkInstall, COMMAND_DEPS, INSTALL_COMMAND } from './preflight'
import {
  assertSharedStore as assertSharedStoreImpl,
  checkSharedStore as checkSharedStoreImpl,
} from './shared-store'
import { startServe } from './serve'
import { startBuilder } from './builder'
import { buildKb, ensureConfig, exportCorpus, kbStatus, KB_USAGE } from './kb'
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
import { readFileSync } from 'node:fs'
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
export { CommandError, EXIT_CODES } from './errors'
export type { ErrorCode, CommandErrorShape } from './errors'
export { startServe, resolveStaticFile, sendFile, MIME } from './serve'
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
  writeRasterPng,
  formatDiffReport,
} from './perceptual'
export type {
  DiffOptions,
  DiffTuning,
  CoreDiffResult,
  DiffRegion,
  PerceptualDiffReport,
  Raster,
  RegionBox,
  CropOptions,
} from './perceptual'
export {
  cmdGate,
  referenceCoverage,
  reconcileGates,
  formatGateReport,
  PERCEPTUAL_MEAN_FLOOR,
  PERCEPTUAL_PCT_FLOOR,
  SECTION_DENSITY_PX,
} from './gate'
export type {
  GateOptions,
  GateReport,
  GateVerdict,
  ReferenceCoverage,
  CoverageFinding,
  PerceptualFloor,
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
  assertSharedStore,
  checkSharedStore,
  sharedComponents,
  SHARED_SERVER_COMPONENTS,
  SHARED_STORE_INSTALL_COMMAND,
} from './shared-store'
export type {
  ComponentResolver,
  MissingSharedComponent,
  SharedComponentSurface,
  SharedStoreReport,
} from './shared-store'

const USAGE = `1c — file-backed site storage, versioning & server-side render (REQ-9)

Usage:
  1c new <slug> [--sandbox]
  1c list [--sandbox]
  1c render <slug> [--source draft|latest|<revId>] [--edit] [--sandbox] [--out <dir>]
    --edit renders the third channel (REQ-116): the page the builder's editor works on.
    Always from draft/. Deliberately non-functional — no link target, no form action, no
    behaviour or motion script — so all content shows at once, and every editable region
    is outlined and stamped with its address. Never published; lands in dist/<slug>/edit/.
  1c publish <slug> [-m "message"] [--by <id>] [--sandbox]
  1c checkout <slug> [<revId>] [--force] [--sandbox]
  1c revisions <slug> [--sandbox]
  1c serve <slug> [--source draft|published] [--sandbox] [--port <n>]
  1c builder [--port <n>] [--remote]
    Starts \`wrangler dev\` on apps/control-app — the builder itself, with the same
    routes, store and runtime as production. Serves what \`1c assets\` built, so run
    that first. The store is the LOCAL simulated D1/R2; seed it with \`bin/publish\`.
    --remote points at the deployed D1 and R2, which means editing production data.

System knowledge base (REQ-123) — what the builder AI knows, as a release artefact:
  1c kb build
    Export every doc ticket to kb/system/, index it, chunk it, and generate the
    awareness map. Needs CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN for the
    embedding model; the map's paragraphs come from the Claude Code CLI when no
    ANTHROPIC_API_KEY is set.
  1c kb export     the corpus only — no embedding, no credentials
  1c kb status     what is built

Build preflight (REQ-144) — what \`bin/build\` runs before it builds:
  1c preflight
    Reports every shared-store component and every declared package, then fails
    with exit 6 naming what is absent. The shared components are delivered out
    of band, so \`pnpm install\` cannot supply them and the lockfile cannot notice
    them missing — and a missing BROWSER component yields an import map that
    loads and then fails at the first import, in the operator's browser. This is
    where that is caught instead.

Push a site to the cloud store (REQ-145) — what \`bin/publish\` runs:
  1c push <slug> [--origin URL] [--token JWT] [--json]
    Reads the local draft (definition + assets) and posts it to the builder Worker's
    import route, which writes it into D1 and R2 through the same store it serves from.
    Idempotent: re-running after an edit replaces each page and asset by name.
    --origin defaults to http://localhost:8788 (\`wrangler dev\`). --token carries a
    Cloudflare Access service-token JWT when the target is a deployed builder.
    This is NOT \`1c publish\`, which mints a revision from a draft.

Control-app assets (REQ-145) — the build step behind /builder, /webui and /framework:
  1c assets [--json]
    Copies the builder client and each installed webui component into
    apps/control-app/dist-assets/, type-strips the framework bridges once, and
    writes the derived import map the Worker serves in its chrome document.
    Nothing is type-stripped, transpiled or resolved at request time afterwards.

Deploy (REQ-110) — ship a rendered snapshot to the R2 artifact store:
  1c deploy <slug> [--channel draft|published] [--dry-run] [--prune] [--sandbox] [--json]
    Renders first, always — there is no way to ship stale bytes. The snapshot (out/ plus the
    source/ it was rendered from, so R2 holds a COMPLETE DOC-12 revision) is content-addressed:
    redeploying identical bytes is a no-op that returns the same URL.
    --channel draft (default) publishes an immutable, shareable PREVIEW snapshot; it never enters
    history.json and never mints a revision number. --channel published ships the current latest
    revision and moves the manifest's live pointer; it refuses when history.json is empty
    (publish mints the revision, deploy ships it).
    --dry-run prints the full plan and writes nothing. --prune deletes snapshot objects the
    manifest does not reference — the orphans an interrupted deploy leaves behind.
    --sandbox deploys under the sandbox/ R2 root, which nothing serves: the snapshot is uploaded
    and indexed but has no URL. To exercise the serving path, use a throwaway slug in storage/sites/.

Reference capture (REQ-12, REQ-83) — rendered-only headless-browser capture:
  1c capture page <url>
    Writes the bundle (capture.json, screenshots, raw/rendered html, assets) plus the multi-viewport
    ladder (multistate.json — the acceptance oracle), the ladder folded into ONE L1 document
    (l1.json: geometry keyframes + interpolate/snap + visibility), and advisory structural hints
    (hints.json: parent layout, sizing unit, position mode, @media breakpoints — read for direction, never executed).

L1 reproduction pipeline (REQ-88) — turn a capture bundle into a servable, gate-able 1c site:
  1c repro <slug> --ref <captureBundleDir> [--sandbox]
    Import the bundle's folded l1.json as a raw-L1 home page site (idempotent — re-import rebuilds).
    The normal render/serve/shot/diff/values-diff loop then works on the reproduction unchanged.
  1c refold --ref <captureBundleDir>
    Re-derive the bundle's l1.json + forms.json from its OWN retained multistate.json, offline.
    Both are a pure function of the oracle and the current fold, so every fold change makes every
    stored bundle stale; this picks the change up without re-hitting the site (which would also
    re-roll the oracle, landing a fold change and a reference change inseparably).
  1c l1-gate --ref <captureBundleDir> [--json] [--sandbox]
    The mechanical 3-probe acceptance gate: fold multistate.json → base, promoteToFlow → recovered,
    then sample-fidelity · off-sample · content-robustness. Exits non-zero while any probe fails;
    each residual names a framework gap (missing L1 axis / capture hint / region needing promotion).

Cross-gate reconciliation (REQ-94) — run l1-gate + values-diff + perceptual diff and COMPARE them:
  1c gate <slug> --ref <captureBundleDir> [--source draft|published] [--size mobile|tablet|desktop]
          [--out <dir>] [--json] [--sandbox] [--mean-floor <0-255>] [--pct-floor <0-100>]
  1c gate --ref <captureBundleDir> --actual-image <png> --actual-manifest <manifest.json> [--out <dir>] [--json]
    l1-gate is blind to colour/font/media BY DESIGN and values-diff can only compare elements present in
    BOTH manifests — so a page whose capture missed its imagery passes both while the perceptual eye reads
    80% of pixels wrong. This verb makes that DISAGREEMENT the finding. A perceptual FLOOR fails the run
    regardless of the value gates, and the verdict names the likely cause:
      capture-incomplete       the reference manifest is impoverished vs the reference screenshot —
                               fix the CAPTURE; value deltas against it are not yet evidence
      reproduction-wrong       coverage is clean and both eyes agree — work the values-diff deltas
      unexplained-disagreement nothing but pixels sees it — a pixel-moving axis the manifest lacks
    Reference coverage (mirrored-vs-referenced images, page height per section) is reported every run.

Screenshot primitive (REQ-13) — AI eyes; PNG of our own output or any URL:
  1c shot <slug> [--source draft|published] [--viewport mobile|tablet|desktop] [--out <file>] [--sandbox]
  1c shot --url <url> [--viewport mobile|tablet|desktop] [--out <file>]

Fidelity values-diff (REQ-31) — mechanical per-element value comparison:
  1c values-diff <slug> --ref <captureBundleDir> [--source draft|published] [--out <file>] [--json] [--sandbox]
  1c values-diff --ref <captureBundleDir> --actual <manifest.json> [--out <file>] [--json]
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
  1c diff <slug> --ref <bundleDir|refPng> [--source draft|published] [--size mobile|tablet|desktop] [--out <dir>] [--json] [--sandbox]
  1c diff --ref <bundleDir|refPng> --actual <png> [--out <dir>] [--json]
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
  1c adopt-gaps <slug> --ref <captureBundleDir> [--apply] [--json] [--sandbox]
    A gap is linear in one knob: new spacingTop = current + (ref_gap - our_gap); a too-tight gap also
    reduces the previous section's spacingBottom. Dry-run by default. Pairs with the REQ-73 gap axis.

Colours (REQ-114, REQ-137) — the palette colour model (DOC-23 §5): one colour per entry, the
light↔dark position carried as shade on the reference:
  1c colors <slug> [--json] [--sandbox]
    Census the site's colour literals: distinct colours, distinct RGB ignoring alpha, and the
    alpha families (one RGB used at several opacities) that collapse to one entry exactly.
  1c colors <slug> --assign [--names <derived>=<chosen>,…] [--json] [--sandbox]
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
    is not true. Outstanding licence actions are reported but do not fail. Scans both the
    sites/ and sandbox/ trees, because a licence attaches to the font, not to the site.

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

Every command defaults to the git-tracked sites/ tree; --sandbox targets the
gitignored sandbox/ scratch tree. Rendered output always lands in
dist/<root>/<slug>/<channel>/.

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
 * Dispatch a parsed `1c` command line. Returns when the command completes —
 * except `serve`, which resolves only when its server closes.
 */
export async function run(argv: string[]): Promise<void> {
  const { positionals, flags } = parseArgs(argv)
  const [command, ...rest] = positionals
  const global: GlobalOptions = { sandbox: flags.sandbox === true }

  // REQ-44 — check the installed tree before the command does anything. Here
  // rather than inside each handler because the failure is about the workspace,
  // not the verb: one gate covers every present and future command through
  // COMMAND_DEPS, and no half-done work (a render, a launched browser, a written
  // file) precedes the refusal. Ungated commands return immediately.
  if (command !== undefined) {
    try {
      assertInstall(command)
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
        console.log(
          `\nPreflight passed: ${store.checked.length} shared components, ` +
            `${declared.length} declared packages.`,
        )
      } catch (err) {
        fail(err, json)
      }
      return
    }

    case 'push': {
      // REQ-145 — copy a local site's draft into the cloud store. The WORKER
      // writes, through the bindings it serves from, because Node has neither a
      // D1 nor an R2 binding and a second writer would be a second definition of
      // what a site is made of. See push.ts.
      const slug = requireSlug(rest[0])
      const origin = typeof flags.origin === 'string' ? flags.origin : 'http://localhost:8788'
      const token = typeof flags.token === 'string' ? flags.token : undefined
      const result = await pushSite(fsSiteStore(ctxOf(global)), slug, {
        origin,
        accessToken: token,
      })
      if (flags.json === true) {
        console.log(JSON.stringify(result, null, 2))
        return
      }
      console.log(
        `pushed ${result.slug} → ${origin}\n` +
          `  pages   ${result.landed.pages} (${result.pages.join(', ') || 'none'})\n` +
          `  assets  ${result.landed.assets}\n` +
          `  site.json ${result.landed.siteJson ? 'yes' : 'no'}`,
      )
      return
    }

    case 'assets': {
      // REQ-145 — the build step that replaces three request-time routes. It runs
      // before the Worker is bundled, because the Worker serves what it emits.
      const report = cmdAssets({ cwd: process.cwd() })
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
      const revs = cmdRevisions(slug, global)
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
      const { id, outDir, changes } = await cmdPublish(slug, {
        ...global,
        message: typeof flags.message === 'string' ? flags.message : undefined,
        by: typeof flags.by === 'string' ? flags.by : undefined,
      })
      const n = changes.added.length + changes.modified.length + changes.removed.length
      console.log(`Published revision r${id} (${n} change(s)) → ${outDir}`)
      return
    }

    case 'deploy': {
      // REQ-110 — render + content-address + upload. Render chatter is diverted so
      // `--json` stays a single clean document.
      const slug = requireSlug(rest[0])
      if (flags.channel !== undefined && flags.channel !== 'draft' && flags.channel !== 'published') {
        throw new Error(`Invalid --channel '${String(flags.channel)}'. Use draft|published.`)
      }
      const result = await withCleanStdout(() =>
        cmdDeploy(slug, {
          ...global,
          channel: flags.channel === 'published' ? 'published' : 'draft',
          dryRun: flags['dry-run'] === true,
          prune: flags.prune === true,
        }),
      )
      console.log(flags.json === true ? JSON.stringify(result, null, 2) : formatDeployReport(result))
      return
    }

    case 'checkout': {
      const slug = requireSlug(rest[0])
      const { id, draftDir } = cmdCheckout(slug, parseRev(rest[1]), {
        ...global,
        force: flags.force === true,
      })
      console.log(`Checked out revision r${id} → ${draftDir}`)
      return
    }

    case 'serve': {
      const slug = requireSlug(rest[0])
      const source = flags.source === 'draft' ? 'draft' : 'published'
      const { url, rootDir } = await startServe(slug, {
        ...global,
        source,
        port: typeof flags.port === 'string' ? Number(flags.port) : undefined,
      })
      console.log(`Serving ${rootDir}\n  ${url}`)
      // Keep the process alive until the server closes.
      await new Promise<void>(() => {})
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
      const appDir = path.join(process.cwd(), 'apps', 'control-app')
      const args = ['wrangler', 'dev', '--port', port]
      // `--remote` edits the DEPLOYED database from a laptop. Local is the
      // default because a dev loop that writes to production by default is one
      // keystroke from losing a site; `bin/publish` seeds the local one.
      if (flags.remote === true) args.push('--remote')

      console.log(
        `Builder (wrangler dev) on http://localhost:${port}\n` +
          `  store: ${flags.remote === true ? 'REMOTE — this edits production data' : 'local'}\n` +
          '  seed it with `bin/publish`\n',
      )
      const child = spawn('npx', args, { cwd: appDir, stdio: 'inherit' })
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
      return
    }

    case 'kb': {
      const sub = rest[0] ?? 'status'
      if (sub === 'export') {
        // The declaration too, so that `export` leaves a COHERENT tree rather
        // than documents with nothing declaring what they belong to. Idempotent:
        // an existing declaration is never overwritten.
        ensureConfig()
        const { docs, removed, skipped, dir } = exportCorpus()
        console.log(`corpus: ${docs.length} document(s) -> ${dir}`)
        if (removed.length) console.log(`removed: ${removed.join(', ')}`)
        // Named, never a bare count: "3 skipped" tells an operator that
        // something is missing without telling them what, which is the version
        // of this message that generates a support question.
        if (skipped.length) {
          console.log(`not in the KB (no fields.system_kb): ${skipped.join(', ')}`)
        }
        return
      }
      if (sub === 'build') {
        const r = await buildKb()
        console.log(
          `index:  ${r.documents} document(s), ${r.embedded} embedded\n` +
            `chunks: ${r.chunks}\n` +
            `map:    ${r.territories} territories, ${r.accessPoints} access point(s), ` +
            `written by ${r.describer}`,
        )
        if (r.doorless.length) {
          // Named, never silent: a territory with no validated access point is a
          // region of the corpus the map describes but cannot route to.
          console.log(`        no way in: ${r.doorless.join(', ')}`)
        }
        return
      }
      if (sub === 'status') {
        const s = kbStatus()
        console.log(
          `corpus: ${s.corpus} document(s)\n` +
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
      if (sub !== 'page') {
        console.error(`Unknown capture subcommand: ${sub ?? '(none)'}\n\n${USAGE}`)
        process.exitCode = 1
        return
      }
      const url = requireSlug(rest[1])
      const { bundleDir, capture, l1, hints } = await cmdCapturePage(url, global)
      const l1Nodes = (l1.root.kind === 'box' || l1.root.kind === 'container' ? l1.root.children?.length : 0) ?? 0
      console.log(
        `Captured ${url} → ${bundleDir}\n` +
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
      const { draftDir, nodeCount, copiedAssets, localizedAssets, unreferencedAssets, forms } =
        cmdRepro(slug, { ...global, ref })
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
      console.log(
        `Reproduced ${ref} → ${draftDir}\n` +
          `  L1 home page: ${nodeCount} node(s)${copiedAssets ? '; assets copied' : ''}` +
          `; ${localizedAssets} media handle(s) bound to local mirror` +
          gap +
          mounted +
          `\n  next: 1c render ${slug}${global.sandbox ? ' --sandbox' : ''}  ·  1c l1-gate --ref ${ref}`,
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
      const { nodeCount, forms, residuals } = cmdRefold({ ...global, ref })
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
      const report = cmdL1Gate({ ...global, ref })
      if (flags.json === true) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        const mark = (ok: boolean): string => (ok ? 'PASS' : 'FAIL')
        const findings = (r: { byWidth: Array<{ findings: unknown[] }> }): number =>
          r.byWidth.reduce((n, w) => n + w.findings.length, 0)
        console.log(
          `3-probe gate on ${ref}: ${report.pass ? 'PASS' : 'FAIL'}\n` +
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
            `  off-sample          ${mark(report.offSample.pass)}  (${findings(report.offSample)} envelope finding(s))\n` +
            `  content-robustness  ${mark(report.contentRobustness.pass)}  (${findings(report.contentRobustness)} finding(s))\n` +
            `  promoted regions: ${report.promoted.length ? report.promoted.join(', ') : 'none'}\n` +
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
          floor: { mean: floorFlag('mean-floor'), pct: floorFlag('pct-floor') },
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
      const table = cmdResponsiveDiff({
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
      if (sub !== 'check') {
        console.error(`Unknown fonts subcommand '${sub ?? ''}'. Expected: check.\n\n` + USAGE)
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
 * `1c` edits `storage/sites/` on the operator's own machine (DOC-12 §3.1), so
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
    const writeOpts = { ...opts, title: str('title'), path: str('path'), seoMeta: jsonFlag('seo') }
    switch (sub) {
      case 'list':
        return editPageList(slug, opts)
      case 'get':
        return editPageGet(slug, requireArg(rest[2], 'pageId'), opts)
      case 'add':
        return editPageAdd(slug, requireArg(rest[2], 'pageId'), writeOpts)
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
        { ...opts, force, alt: str('alt') },
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
