import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { buildModuleAssets, type ModuleAssetBuild } from './module-assets'
import { kbBundle } from './kb'
import {
  WEBUI_PACKAGES,
  WEBUI_SCOPE,
  sharedModulePath,
  webuiExports,
  webuiPackageDir,
} from './webui'

/**
 * The control app's asset build (REQ-145 phase 1).
 *
 * THREE ROUTES BECOME ARTIFACTS. Until now the builder origin answered
 * `/builder/*`, `/webui/*` and `/framework/*.js` by reaching for something a
 * Worker cannot reach: files under the repo checkout, a package directory in the
 * out-of-repo shared artifact store, and — for the framework bridges —
 * TypeScript **type-stripped at request time**. The last was a build step
 * wearing a route, and the route said so: *"if that ever stops being true this
 * route should become a real build step rather than growing a resolver."* This
 * is that build step.
 *
 * WHY IT IS A `1c` COMMAND rather than a script under `apps/control-app`. It
 * needs {@link webuiPackageDir}, and {@link WEBUI_SCOPE} is declared in exactly
 * one place in this repository — a second literal is the defect `webui.ts`
 * describes at length, because a half-completed rename then reads as "not
 * installed yet" rather than as a bug. A plain `.mjs` build script cannot import
 * that module (Node's type stripping rejects its parameter properties), so it
 * would have had to restate the scope. This runs where TypeScript already
 * resolves.
 *
 * WHAT IT EMITS, and why the import map is not among the assets:
 *
 *   dist-assets/builder/&#42;&#42;        the builder's browser source, verbatim
 *   dist-assets/webui/&lt;pkg&gt;/&#42;&#42;    each installed component, verbatim
 *   dist-assets/framework/&#42;.js    the bridges, type-stripped ONCE
 *   src/generated/importmap.json  the map the Worker writes into the chrome document
 *   src/generated/ai-workers.js   the AI library's Worker rung, resolved (REQ-146)
 *
 * The Worker composes the chrome document per request, so the map has to be a
 * value it holds rather than a file it would have to fetch mid-request. It is
 * emitted as JSON and imported by the Worker, which wrangler bundles.
 *
 * IT IS STILL DERIVED, NEVER HARDCODED. The map is composed from each
 * component's own `exports` map, exactly as the old request-time `chromeHtml()`
 * composed it, so an upstream file move surfaces as a build-time throw here
 * instead of a 404 in the operator's browser. What changed is when it is
 * computed, not how.
 */

/**
 * The framework bridges, and the one rewrite they need.
 *
 * These files are TypeScript in `packages/`, and they must STAY the one
 * implementation: `edit-client.ts` reads the same stamp the renderer writes, and
 * `shade.ts` is the renderer's own colour arithmetic, which the palette slider
 * runs once per frame of a drag. A hand-written browser copy of either would be
 * free to drift from the markup and from the pixels respectively.
 *
 * Type-stripping is enough, and bundling is not needed, because these files'
 * only runtime import is each other: `l1/edit.ts` imports nothing at runtime,
 * `l1/shade.ts` imports nothing at all, and `edit-client.ts` imports only
 * `@1stcontact/site-schema`, rewritten below to the sibling URL. One rewrite.
 */
const FRAMEWORK_SOURCES: Record<string, string> = {
  'edit-client': 'packages/framework/src/l1/edit-client.ts',
  'site-schema-edit': 'packages/site-schema/src/l1/edit.ts',
  'site-schema-shade': 'packages/site-schema/src/l1/shade.ts',
}

/** What the build wrote, so the command can report it and a UAT can assert it. */
export interface AssetBuildReport {
  /** The behavior modules' precompiled chrome — see `module-assets.ts`. */
  modules: ModuleAssetBuild
  outDir: string
  builderFiles: number
  webuiFiles: number
  frameworkFiles: string[]
  imports: Record<string, string>
  styles: string[]
  /** The absolute path `src/generated/ai-workers.js` re-exports (REQ-146). */
  aiWorkersEntry: string
  /** The absolute path `src/generated/ticketing.js` re-exports (REQ-162). */
  ticketingEntry: string
  /** The absolute path `src/generated/knowledge.js` re-exports (REQ-159). */
  knowledgeEntry: string
  /** The absolute path `src/generated/ai-knowledge.js` re-exports (REQ-158). */
  aiKnowledgeEntry: string
  /** The system KB inlined into `src/generated/kb.js`, built or not (REQ-158). */
  kb: KbAssetReport
}

function transpileForBrowser(absPath: string): string {
  // Required lazily, as the request-time route did: `typescript` is a
  // devDependency and a packaged install that never builds assets should not
  // fail to load this module over it.
  const require = createRequire(import.meta.url)
  const ts = require('typescript') as typeof import('typescript')
  const out = ts.transpileModule(fs.readFileSync(absPath, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  return out.outputText.replace(
    /(['"])@1stcontact\/site-schema\1/g,
    "'/framework/site-schema-edit.js'",
  )
}

function copyDir(from: string, to: string): number {
  fs.mkdirSync(to, { recursive: true })
  let count = 0
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    // A packed component's own `node_modules` is upstream's dependency tree; the
    // browser resolves through the import map and never through it.
    if (entry.name === 'node_modules') continue
    const src = path.join(from, entry.name)
    const dst = path.join(to, entry.name)
    if (entry.isDirectory()) count += copyDir(src, dst)
    else {
      fs.copyFileSync(src, dst)
      count += 1
    }
  }
  return count
}

/**
 * The AI library's Worker rung, as a module wrangler can follow (REQ-146).
 *
 * THE PROBLEM THIS SOLVES IS RESOLUTION, NOT PACKAGING. The AI component
 * lives in the out-of-repo shared store, which `bin/install` populates and
 * `webui.ts` says is *never vendored into this repo*. Nothing records it in a
 * `package.json`, so a bare `import` of its `/workers` rung in the Worker
 * resolves by walking up from the importing file — which finds the store from the
 * main checkout and finds NOTHING from a linked `git worktree`. That is the same
 * silent-skip hazard {@link sharedModuleUrl} exists to close, met again at build
 * time instead of at import time.
 *
 * So the specifier is resolved HERE, through {@link webuiPackageDir} — the single
 * resolution point — and written out as a one-line re-export carrying the
 * absolute path. wrangler then bundles the real module graph behind it.
 *
 * IT IS GENERATED, NOT COMMITTED, and `src/generated/` is gitignored for the
 * reason the ignore file already gives: a checked-in copy of a generator's output
 * is a second definition site for the component scope. It also *must* not be
 * committed here, because the path it carries is machine-specific.
 *
 * WHY A `.js` SHIM RATHER THAN A wrangler `alias`. An alias would have to name
 * the same absolute path in `wrangler.toml`, which IS committed — so every
 * machine would need a different one. This keeps the machine-specific value in
 * the one file that is already regenerated per checkout.
 *
 * The `/workers` rung specifically, and never the package root: the root eagerly
 * pulls the provider SDKs and `node:child_process`, while `/workers` is the
 * Cloudflare packaging REQ-103 added — `/core` plus the one backend a Worker can
 * run, with the filesystem junction and archive deliberately absent.
 */
function writeAiWorkersShim(generatedDir: string): string {
  // Through `webuiExports` so the rung's own `exports` map decides the file, and
  // an upstream move surfaces as a throw here rather than as a Worker that builds
  // and has no assistant.
  const entry = sharedModulePath('ai', './workers')
  fs.writeFileSync(
    path.join(generatedDir, 'ai-workers.js'),
    `// Generated by \`1c assets\` (REQ-146). Do not edit, do not commit.\n` +
      `// Resolves the out-of-repo shared store to an absolute path so wrangler can\n` +
      `// bundle it from any checkout, including a linked git worktree.\n` +
      `export * from ${JSON.stringify(entry)}\n`,
  )

  // The library is untyped JavaScript, so the declaration says so by NAME rather
  // than by a blanket module wildcard: a wildcard would also silence a typo in
  // an import, and these are the names the Worker actually reaches for. The
  // boundary is narrow on purpose and `ai.ts` re-narrows everything that crosses
  // it — the same treatment `host.ts` gives the Node side.
  fs.writeFileSync(
    path.join(generatedDir, 'ai-workers.d.ts'),
    [
      '// Generated by `1c assets` (REQ-146). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      ...AI_WORKER_EXPORTS.map((n) => `export const ${n}: any`),
      '',
    ].join('\n'),
  )
  return entry
}

/**
 * What the Worker reaches for out of the AI component's `/workers` rung.
 *
 * Listed rather than wildcarded so an upstream rename surfaces as a typecheck
 * failure here instead of as `undefined is not a function` inside a turn.
 */
const AI_WORKER_EXPORTS = [
  'ArchiveSyncer',
  'ClaudeAPIBackend',
  'NullArchive',
  'Role',
  'Session',
  'SessionManager',
  'Tool',
  'Toolbox',
  'ToolboxSurface',
  // REQ-160 — the archive that homes a session in a `chat` ticket (DOC-10 §8).
  // It replaced an R2-object archive, so it is not an addition to the boundary
  // so much as the other half of one: `chatSchemas` below declares the ticket
  // this writes, and a shim carrying one without the other would leave the type
  // pack describing a ticket nothing creates.
  'TicketSessionArchive',
  'applyRecords',
  'availableBackends',
  // REQ-162 — the chat half of the ticket store's type pack. The AI component
  // owns the shape a `chat` ticket and its `chat_transcript` comment take
  // (DOC-10 §8), so the pack imports it rather than restating it here, where it
  // would drift from the archive that actually reads it back.
  'chatSchemas',
  'memoryJunctions',
  'registerBackend',
] as const

/**
 * The ticket store, as a module wrangler can follow (REQ-162).
 *
 * IDENTICALLY MOTIVATED TO {@link writeAiWorkersShim}, and deliberately not
 * folded into it. The ticket store lives in the same out-of-repo shared store,
 * so a bare specifier in the Worker resolves by walking up from
 * the importing file — which finds the store from the main checkout and finds
 * NOTHING from a linked `git worktree`. Same hazard, same single resolution
 * point, same one-line re-export carrying an absolute path.
 *
 * THE PACKAGE ROOT, unlike the AI component's `/workers` rung. The root is the
 * Worker-safe surface here: D1 is the storage substrate the component is written
 * for, `R2BlobStore` takes an injected binding, and the only entry point that
 * reaches a filesystem (`./node`, holding `NodeBlobStore`) is a separate export
 * this never names. There is no rung to pick.
 */
function writeTicketingShim(generatedDir: string): string {
  const entry = sharedModulePath('ticketing')
  fs.writeFileSync(
    path.join(generatedDir, 'ticketing.js'),
    `// Generated by \`1c assets\` (REQ-162). Do not edit, do not commit.\n` +
      `// Resolves the out-of-repo shared store to an absolute path so wrangler can\n` +
      `// bundle it from any checkout, including a linked git worktree.\n` +
      `export * from ${JSON.stringify(entry)}\n`,
  )
  fs.writeFileSync(
    path.join(generatedDir, 'ticketing.d.ts'),
    [
      '// Generated by `1c assets` (REQ-162). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      ...TICKETING_EXPORTS.map((n) => `export const ${n}: any`),
      '',
    ].join('\n'),
  )
  return entry
}

/**
 * What the Worker reaches for out of the ticket store.
 *
 * Listed rather than wildcarded for the reason {@link AI_WORKER_EXPORTS} gives:
 * a wildcard would also silence a typo, and an upstream rename should surface as
 * a typecheck failure here rather than as `undefined is not a constructor` on
 * the first upload.
 *
 * `ATTACHMENT_SCHEMA` / `ATTACHMENT_TYPE` are on the list because the pack
 * merges them (tickets.ts) — the component reads those intrinsics back, so they
 * are not a matter of local taste.
 */
const TICKETING_EXPORTS = [
  'ATTACHMENT_SCHEMA',
  'ATTACHMENT_TYPE',
  'Accessor',
  // The read-only store over a directory of documents, and its Worker-side
  // reader (REQ-158). `DocDirStore` is reader-agnostic on purpose: the build
  // hands it `nodeDocReader` over a real directory, the Worker hands it
  // `bundleDocReader` over the map `1c assets` inlined, and the corpus
  // resolution above them cannot tell which it got.
  'DocDirStore',
  'MAX_BLOB_BYTES',
  'MemoryBlobStore',
  'MultiTenantTicketStore',
  'R2BlobStore',
  'TicketError',
  'TypePack',
  'blobKey',
  'bundleDocReader',
] as const

/**
 * The knowledge component, as a module wrangler can follow (REQ-159).
 *
 * THE THIRD SHIM, IDENTICALLY MOTIVATED to the two above and deliberately not
 * folded into either: same out-of-repo store, same bare-specifier hazard from a
 * linked `git worktree`, same single resolution point, same one-line re-export
 * carrying an absolute path.
 *
 * THE PACKAGE ROOT, and the component guarantees that is the Worker-safe half.
 * Its `./node` entry point holds every filesystem seam — `nodeIndexSource`,
 * `loadKbConfig`, `nodeDocReader` — precisely so a Worker importing the root
 * cannot reach `node:fs` transitively. `kb.ts` names `./node` because it runs on
 * a machine that has a filesystem; nothing under `apps/` ever may, which is why
 * the project KB's index lives in R2 behind the same `IndexSource` port
 * (`knowledge.ts`) rather than behind the directory-backed one.
 */
function writeKnowledgeShim(generatedDir: string): string {
  const entry = sharedModulePath('knowledge')
  fs.writeFileSync(
    path.join(generatedDir, 'knowledge.js'),
    `// Generated by \`1c assets\` (REQ-159). Do not edit, do not commit.\n` +
      `// Resolves the out-of-repo shared store to an absolute path so wrangler can\n` +
      `// bundle it from any checkout, including a linked git worktree.\n` +
      `export * from ${JSON.stringify(entry)}\n`,
  )
  fs.writeFileSync(
    path.join(generatedDir, 'knowledge.d.ts'),
    [
      '// Generated by `1c assets` (REQ-159). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      ...KNOWLEDGE_EXPORTS.map((n) => `export const ${n}: any`),
      '',
    ].join('\n'),
  )
  return entry
}

/**
 * What the Worker reaches for out of the knowledge component.
 *
 * Listed rather than wildcarded for the reason {@link AI_WORKER_EXPORTS} gives.
 * The list is the project KB's whole surface, and it splits three ways: the
 * declaration (`knowledgeBasesFromMapping`, `KnowledgeBase`), the two clocks —
 * the index (`buildIndex`, `buildChunkIndex`, `loadIndex`, `search`) and the map
 * (`documentsFromTickets`, `buildAwareness`, `publishAwarenessReport`,
 * `agglomerativeClusterer`) — and the corpus reads both run over
 * (`resolveCorpus`).
 *
 * `AWARENESS_REPORT_TYPE` / `AWARENESS_REPORT_KIND` / `KB_FIELD` are here for the
 * same reason `ATTACHMENT_SCHEMA` is on the ticketing list: `tickets.ts` declares
 * the type the component writes its map into, and the component reads those three
 * back when it looks the map up again. They are upstream's intrinsics, not a
 * matter of local taste.
 */
export const KNOWLEDGE_EXPORTS = [
  'AWARENESS_REPORT_KIND',
  'AWARENESS_REPORT_TYPE',
  'KB_FIELD',
  'WorkersAiEmbedder',
  'agglomerativeClusterer',
  'buildAwareness',
  'buildChunkIndex',
  'buildIndex',
  'documentsFromTickets',
  'findAwarenessReport',
  'knowledgeBasesFromMapping',
  'loadIndex',
  // The bundled index's residency (REQ-158) — the `IndexSource` over a map of
  // files rather than over R2 or a directory. It is on the package root, not
  // behind `./node`, precisely because it is the one a Worker uses.
  'memoryIndexSource',
  'publishAwarenessReport',
  'resolveCorpus',
  'search',
  // REQ-160 — the co-ranked fan-out. `search` alone was enough while one host
  // served one knowledge base; a session that reaches two searches each index
  // through its own runtime and merges on the component's own scores, so the
  // chunk half of that pair is needed for the same reason the document half is,
  // and the two defaults come with them because the merge has to take the top
  // `k` of the union rather than of either side.
  'searchChunks',
  'DEFAULT_TOP_K',
  'DEFAULT_CHUNKS_PER_HIT',
] as const

/**
 * The AI–knowledge bridge, as a module wrangler can follow (REQ-158).
 *
 * THE FOURTH SHIM, IDENTICALLY MOTIVATED to the three above: same out-of-repo
 * store, same bare-specifier hazard from a linked `git worktree`, same single
 * resolution point, same one-line re-export carrying an absolute path.
 *
 * IT CANNOT BE `sharedModuleUrl` HERE, and that is the whole reason a shim
 * exists rather than the dynamic import `kb.ts` uses. `sharedModuleUrl` builds a
 * specifier at runtime and `import()`s it, which
 * `test_UAT_FC_REQ-146_worker_ai_boundary` forbids on the Worker path for a
 * concrete reason: workerd has no filesystem and cannot import an arbitrary URL,
 * so the library has to arrive as a static import the bundler already followed.
 *
 * THE PACKAGE ROOT, which the component guarantees is Worker-safe: its
 * `./describe` entry point holds the Awareness describe seam and is Node-only
 * because it needs the provider backends. Nothing under `apps/` names it — the
 * system KB's map is built at release time by `1c kb build`, on a machine that
 * has those backends.
 */
function writeAiKnowledgeShim(generatedDir: string): string {
  const entry = sharedModulePath('ai-knowledge')
  fs.writeFileSync(
    path.join(generatedDir, 'ai-knowledge.js'),
    `// Generated by \`1c assets\` (REQ-158). Do not edit, do not commit.\n` +
      `// Resolves the out-of-repo shared store to an absolute path so wrangler can\n` +
      `// bundle it from any checkout, including a linked git worktree.\n` +
      `export * from ${JSON.stringify(entry)}\n`,
  )
  fs.writeFileSync(
    path.join(generatedDir, 'ai-knowledge.d.ts'),
    [
      '// Generated by `1c assets` (REQ-158). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      ...AI_KNOWLEDGE_EXPORTS.map((n) => `export const ${n}: any`),
      '',
    ].join('\n'),
  )
  return entry
}

/**
 * What the Worker reaches for out of the bridge.
 *
 * Listed rather than wildcarded for the reason {@link AI_WORKER_EXPORTS} gives.
 * Four names, and they are the two halves of DOC-10 §5.1's bargain: the corpus
 * as a searchable tool surface (`KnowledgeRuntime`, `KnowledgeToolbox`,
 * `knowledgeInstanceConfig`) and the map that tells a cold session the corpus is
 * there at all (`KnowledgeDocs`). Shipping the first without the second would be
 * a tool the assistant never learns to reach for.
 */
const AI_KNOWLEDGE_EXPORTS = [
  'KnowledgeDocs',
  'KnowledgeRuntime',
  'KnowledgeToolbox',
  'knowledgeInstanceConfig',
] as const

/**
 * The built system KB, inlined as a module the Worker imports (REQ-158).
 *
 * WRITTEN ALWAYS, `null` WHEN UNBUILT, and that unconditionality is the point.
 * `src/generated/` is gitignored — a checked-in generator output is a second
 * definition site, which BUG-32's scan fails on — so a fresh checkout has no
 * `kb.js` until this runs. If it were written only when a KB existed, the
 * Worker's static `import { KB } from './generated/kb.js'` would fail to
 * RESOLVE on any machine that had never run `1c kb build`, turning a missing
 * capability into a build that does not compile. `export const KB = null` costs
 * one line and makes the absent case exactly what the acceptance criterion asks
 * for: no knowledge tools, never a boot failure.
 *
 * A MISSING KB IS STILL LOUD — see {@link formatAssetReport}, which says so in
 * the operator's face rather than in a log line nobody reads. Silence would mean
 * shipping an assistant with no knowledge tools and nobody noticing until it
 * answered badly.
 *
 * NOT COMMITTED, for the same two reasons the shims are not: it is derived, and
 * it is large. The payload is the vectors, the sidecars and the corpus text —
 * hundreds of kilobytes of generated content that would be re-diffed on every
 * rebuild.
 */
export async function writeKbModule(
  generatedDir: string,
  repoRoot: string,
): Promise<KbAssetReport> {
  const bundle = await kbBundle(path.join(repoRoot, 'kb'))
  const body =
    bundle === null
      ? 'export const KB = null\n'
      : `export const KB = ${JSON.stringify(bundle)}\n`
  const file = path.join(generatedDir, 'kb.js')
  fs.writeFileSync(
    file,
    `// Generated by \`1c assets\` (REQ-158). Do not edit, do not commit.\n` +
      `// The system knowledge base, inlined so a Worker can search it with no\n` +
      `// filesystem and no network. \`null\` means \`1c kb build\` has not run.\n` +
      body,
  )
  fs.writeFileSync(
    path.join(generatedDir, 'kb.d.ts'),
    [
      '// Generated by `1c assets` (REQ-158). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      'export const KB: any',
      '',
    ].join('\n'),
  )
  return bundle === null
    ? { built: false, documents: 0, bytes: fs.statSync(file).size }
    : {
        built: true,
        documents: Object.keys(bundle.docs).length,
        bytes: fs.statSync(file).size,
      }
}

/** What {@link writeKbModule} emitted, so the operator can see it or its absence. */
export interface KbAssetReport {
  /** Whether `1c kb build` has produced an index for this checkout. */
  built: boolean
  documents: number
  bytes: number
}

/** Build every control-app asset. `repoRoot` is the checkout to read and write in. */
export async function buildControlAppAssets(repoRoot: string): Promise<AssetBuildReport> {
  // First, because it is the one artifact the RENDER needs rather than the
  // browser: without it `theme.css` cannot be composed in a runtime with no
  // filesystem, and every page the Worker serves would be unstyled.
  const modules = buildModuleAssets(repoRoot)

  const appDir = path.join(repoRoot, 'apps', 'control-app')
  const outDir = path.join(appDir, 'dist-assets')

  // Emptied, not merged: a stale component left behind by a rename would be
  // served for as long as nobody looked, which is the failure this whole ticket
  // is removing from the request path.
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.mkdirSync(outDir, { recursive: true })

  const builderFiles = copyDir(path.join(appDir, 'src', 'builder'), path.join(outDir, 'builder'))

  const imports: Record<string, string> = {}
  const styles: string[] = []
  let webuiFiles = 0
  for (const name of WEBUI_PACKAGES) {
    webuiFiles += copyDir(webuiPackageDir(name), path.join(outDir, 'webui', name))
    for (const [subpath, target] of Object.entries(webuiExports(name))) {
      const url = `/webui/${name}/${target.replace(/^\.\//, '')}`
      // Composed from the single scope declaration, never restated.
      if (subpath === '.') imports[`${WEBUI_SCOPE}/${name}`] = url
      else if (target.endsWith('.css')) styles.push(url)
      else imports[`${WEBUI_SCOPE}/${name}/${subpath.replace(/^\.\//, '')}`] = url
    }
  }

  const fwOut = path.join(outDir, 'framework')
  fs.mkdirSync(fwOut, { recursive: true })
  const frameworkFiles: string[] = []
  for (const [name, rel] of Object.entries(FRAMEWORK_SOURCES)) {
    const file = `${name}.js`
    fs.writeFileSync(path.join(fwOut, file), transpileForBrowser(path.join(repoRoot, rel)))
    frameworkFiles.push(file)
  }

  const generated = path.join(appDir, 'src', 'generated')
  fs.mkdirSync(generated, { recursive: true })
  fs.writeFileSync(
    path.join(generated, 'importmap.json'),
    JSON.stringify({ imports, styles }, null, 2) + '\n',
  )
  const aiWorkersEntry = writeAiWorkersShim(generated)
  const ticketingEntry = writeTicketingShim(generated)
  const knowledgeEntry = writeKnowledgeShim(generated)
  const aiKnowledgeEntry = writeAiKnowledgeShim(generated)
  const kb = await writeKbModule(generated, repoRoot)

  return {
    modules,
    outDir,
    builderFiles,
    webuiFiles,
    frameworkFiles,
    imports,
    styles,
    aiWorkersEntry,
    ticketingEntry,
    knowledgeEntry,
    aiKnowledgeEntry,
    kb,
  }
}

/** `1c assets` — build them and report what was written. */
export function cmdAssets(opts: { cwd?: string } = {}): Promise<AssetBuildReport> {
  return buildControlAppAssets(opts.cwd ?? process.cwd())
}

export function formatAssetReport(report: AssetBuildReport): string {
  return [
    `modules    ${report.modules.css.length} css, ${report.modules.clientJs.length} client.js → ${report.modules.file}`,
    `builder    ${report.builderFiles} files`,
    `webui      ${report.webuiFiles} files, ${Object.keys(report.imports).length} import-map entries, ${report.styles.length} stylesheets`,
    `framework  ${report.frameworkFiles.join(', ')}`,
    `ai         ${report.aiWorkersEntry}`,
    `ticketing  ${report.ticketingEntry}`,
    `knowledge  ${report.knowledgeEntry}`,
    `bridge     ${report.aiKnowledgeEntry}`,
    kbLine(report.kb),
    `out        ${report.outDir}`,
  ].join('\n')
}

/**
 * The system KB's line, and the one line in this report that can shout.
 *
 * A MISSING KB MUST BE LOUD AT BUILD TIME (REQ-158). The Worker degrades
 * gracefully without one — that is deliberate and is what keeps a fresh checkout
 * buildable — but graceful degradation and silence are different things. An
 * assistant shipped with no knowledge tools looks exactly like one with them
 * until it answers a question badly, weeks later, in front of a client. This is
 * where that gets said, in the operator's face, at the moment they could still
 * fix it.
 */
export function kbLine(kb: KbAssetReport): string {
  return kb.built
    ? `kb         ${kb.documents} document(s), ${Math.round(kb.bytes / 1024)}KB inlined`
    : 'kb         *** NOT BUILT — the assistant will ship with no system knowledge. ' +
        'Run `1c kb build`. ***'
}
