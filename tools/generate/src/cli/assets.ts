import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { CommandError } from './errors'
import { buildModuleAssets, type ModuleAssetBuild } from './module-assets'
import { kbBundle, requireCoherentKb } from './kb'
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
 * The framework bridges — the ENTRY POINTS of the emitted framework tree.
 *
 * These files are TypeScript in `packages/`, and they must STAY the one
 * implementation: `edit-client.ts` reads the same stamp the renderer writes, and
 * `shade.ts` is the renderer's own colour arithmetic, which the palette slider
 * runs once per frame of a drag. A hand-written browser copy of either would be
 * free to drift from the markup and from the pixels respectively.
 *
 * THIS MAP NAMES ENTRIES, NOT THE WHOLE TREE ([[BUG-71]]). It used to be the
 * complete list of what was emitted, on the stated grounds that "these files'
 * only runtime import is each other". That was true until it was not:
 * `l1/edit.ts` gained `import { l1TextRuns } from './text'`, `text.ts` was on
 * no list, and the browser asked for `/framework/text` and got a 404 — which
 * took the whole builder down, because one unloadable module in a graph fails
 * the graph. The list could not have caught it: a hand-maintained inventory of
 * a dependency graph is correct only until the next import.
 *
 * So {@link emitFrameworkTree} FOLLOWS the imports out of each entry below and
 * emits what it finds. What these names still decide is the stable public URL
 * `/framework/<name>.js` — the address the builder's own sources import by
 * hand, which is why it is declared rather than derived. A module reached only
 * as a dependency has no such caller, and is emitted under its source path.
 */
const FRAMEWORK_SOURCES: Record<string, string> = {
  'edit-client': 'packages/framework/src/l1/edit-client.ts',
  'site-schema-edit': 'packages/site-schema/src/l1/edit.ts',
  'site-schema-shade': 'packages/site-schema/src/l1/shade.ts',
  // [[REQ-215]] — what the page is showing. The builder carries it across a
  // channel switch, and it must be the SAME implementation the renderer's own
  // markers were designed against: a browser copy would be a second opinion
  // about what "open" means, in the one place where the two channels have to
  // agree exactly.
  'page-state': 'packages/framework/src/l1/page-state.ts',
  // REQ-210 — Marked Points. `marked-points.ts` inverts the transform chain a
  // pointed-at pixel sits under and writes what the assistant will read;
  // `anchors.ts` says which named lines are near it. Both are the ONE
  // implementation of their arithmetic — `anchors.ts` is what `relate` and
  // `solve` answer from (REQ-209), so a browser copy would be a second opinion
  // about what `cap-top` means.
  'marked-points': 'packages/framework/src/l1/marked-points.ts',
  'site-schema-anchors': 'packages/site-schema/src/anchors.ts',
  // The measuring script itself, so `near:` measures the drawing the SAME way
  // `measure_drawing` does rather than a second way that agrees until it does
  // not. It is a CLI file only in where it happens to live: it imports nothing,
  // renders nothing, and returns a string of browser JS — which is what both
  // callers evaluate, one through a driver and one in the page.
  'measure-svg': 'tools/generate/src/cli/capture/measure-svg.ts',
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
  /** The absolute path `src/generated/auth-passwordless.js` re-exports ([[REQ-202]]). */
  authEntry: string
  /** The absolute path `src/generated/ai-imagegen.js` re-exports ([[REQ-208]]). */
  aiImagegenEntry: string
  /** The system KB inlined into `src/generated/kb.js`, built or not (REQ-158). */
  kb: KbAssetReport
  /** The builder's import graph, proved to resolve before the swap ([[BUG-71]]). */
  graph: ImportGraphReport
}

/**
 * Required lazily, as the request-time route did: `typescript` is a
 * devDependency and a packaged install that never builds assets should not fail
 * to load this module over it.
 */
function typescript(): typeof import('typescript') {
  const require = createRequire(import.meta.url)
  return require('typescript') as typeof import('typescript')
}

function transpileForBrowser(absPath: string): string {
  const ts = typescript()
  const out = ts.transpileModule(fs.readFileSync(absPath, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  return out.outputText
}

/**
 * Every static module specifier in a file, with the span of the specifier text.
 *
 * THE SCANNER, NOT A REGEX. This began as a pattern matching the specifier
 * position of `import`/`export`/`import()`, and it worked until it read a
 * DOC COMMENT that quoted an import as an example — whereupon the build
 * rewrote the comment, followed the specifier out of it, and emitted a module
 * nothing imports (which in turn imported `zod`, which is not servable, and
 * failed the build for a line of prose). Comments and string literals are
 * exactly what a scanner exists to tell apart from code, and TypeScript's is
 * already loaded here to do the type-stripping.
 *
 * `preProcessFile` returns each specifier's position as well as its text, so
 * the same call serves both readers: {@link emitFrameworkTree} rewrites at
 * those spans and {@link checkImportGraph} resolves the text.
 */
function specifiersOf(code: string): Array<{ text: string; pos: number; end: number }> {
  const ts = typescript()
  return ts.preProcessFile(code, true, true).importedFiles.map((f) => {
    // `pos` IS THE OPENING QUOTE, and `end` is `pos + fileName.length` — so the
    // span TypeScript hands back is the right length in the wrong place, and
    // slicing at it verbatim eats the quote and keeps the specifier's last
    // character. The span is therefore derived from the text rather than taken
    // on trust, and checked: if a future TypeScript changes this convention the
    // build says so, instead of quietly emitting files with mangled imports.
    const pos = f.pos + 1
    const end = pos + f.fileName.length
    if (code.slice(pos, end) !== f.fileName) {
      throw new CommandError({
        code: 'INTERNAL',
        message: `TypeScript reported '${f.fileName}' at ${f.pos}, where the source reads '${code.slice(pos, end)}'.`,
        hint: 'preProcessFile changed how it positions module specifiers — see `specifiersOf`.',
      })
    }
    return { text: f.fileName, pos, end }
  })
}

/**
 * Each specifier in `code`, rewritten by `to` — returning `null` leaves it alone.
 *
 * Applied last-first so that replacing one specifier cannot shift the positions
 * of the ones still to be replaced.
 */
function rewriteSpecifiers(code: string, to: (spec: string) => string | null): string {
  let out = code
  for (const { text, pos, end } of specifiersOf(code).reverse()) {
    const next = to(text)
    if (next !== null) out = out.slice(0, pos) + next + out.slice(end)
  }
  return out
}

/**
 * The source file a relative specifier names.
 *
 * TypeScript writes `./text` and means `./text.ts`; a browser writes `./text`
 * and means a file literally called `text`. That mismatch is half of [[BUG-71]]
 * — even had `text.ts` been emitted, `./text` would still have 404ed — so the
 * extension is resolved here, once, and the specifier is rewritten to the URL
 * the file was emitted at rather than to a guess.
 */
function resolveSibling(fromAbs: string, spec: string): string | null {
  const base = path.resolve(path.dirname(fromAbs), spec)
  for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

/**
 * Type-strip the framework entries AND everything they import, into `outDir`.
 *
 * WHY A GRAPH WALK AND NOT A LIST ([[BUG-71]]). See {@link FRAMEWORK_SOURCES}:
 * a list of files is a claim about a dependency graph that nothing checks, and
 * it was wrong within one commit of being written.
 *
 * IT FOLLOWS THE TRANSPILED OUTPUT, NOT THE SOURCE, and that is the whole
 * reason no type-only module is emitted. `transpileModule` erases `import type`
 * and elides any import whose bindings never appear in the emitted JS, so what
 * survives into the output is exactly what the browser will actually fetch.
 * Reading the source instead would emit `./palette` and `./types` — modules
 * that exist only at compile time — and ship the browser bytes it can never run.
 *
 * ONE URL PER SOURCE FILE. `urlOf` is keyed on the absolute source path and
 * seeded with the declared entries, so a module that is both an entry and
 * somebody's dependency is emitted once and imported by its entry URL from
 * everywhere. Emitting it under two URLs would give the page two instances of
 * one module — two copies of whatever state it holds, agreeing until they did
 * not, which is the class of bug that does not reproduce.
 *
 * A dependency is emitted under its REPO-RELATIVE SOURCE PATH, which is both
 * collision-proof (two packages may each have a `text.ts`; they cannot share a
 * path) and legible: the URL in a stack trace names the file to open.
 */
function emitFrameworkTree(repoRoot: string, outDir: string): string[] {
  const urlOf = new Map<string, string>()
  for (const [name, rel] of Object.entries(FRAMEWORK_SOURCES)) {
    urlOf.set(path.join(repoRoot, rel), `/framework/${name}.js`)
  }

  const emitted: string[] = []
  const done = new Set<string>()
  const queue = [...urlOf.keys()]

  while (queue.length > 0) {
    const src = queue.shift() as string
    if (done.has(src)) continue
    done.add(src)

    const code = rewriteSpecifiers(transpileForBrowser(src), (spec) => {
      // The one bare specifier these sources use, and the reason it is rewritten
      // rather than mapped: `edit-client.ts` imports the site schema as a
      // package, and in the browser that package IS the sibling bridge.
      if (spec === '@1stcontact/site-schema') return '/framework/site-schema-edit.js'
      if (!spec.startsWith('.')) return null
      const dep = resolveSibling(src, spec)
      if (dep === null) {
        throw new CommandError({
          code: 'ENVIRONMENT',
          message: `${path.relative(repoRoot, src)} imports '${spec}', which resolves to no file.`,
          path: spec,
          hint: 'The framework bridges are served as files — every relative import must name one.',
        })
      }
      let url = urlOf.get(dep)
      if (url === undefined) {
        const rel = path.relative(repoRoot, dep)
        if (rel.startsWith('..')) {
          throw new CommandError({
            code: 'ENVIRONMENT',
            message: `${path.relative(repoRoot, src)} imports '${spec}', which lies outside the repository.`,
            path: rel,
            hint: 'A framework bridge can only import files this build can emit — keep it in the repo.',
          })
        }
        url = `/framework/${rel.replace(/\.tsx?$/, '.js')}`
        urlOf.set(dep, url)
      }
      queue.push(dep)
      return url
    })

    const file = (urlOf.get(src) as string).replace(/^\/framework\//, '')
    const target = path.join(outDir, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, code)
    emitted.push(file)
  }
  return emitted
}

/** What {@link checkImportGraph} proved, so the report can say it was proved. */
export interface ImportGraphReport {
  /** Modules reachable from the builder's entry, the entry included. */
  modules: number
  /** Stylesheets the import map declares. */
  styles: number
}

/** Where a specifier points, as a URL under the served tree — or `null` if nowhere. */
function resolveUrl(from: string, spec: string, imports: Record<string, string>): string | null {
  if (spec.startsWith('/')) return spec
  if (spec.startsWith('.')) return path.posix.join(path.posix.dirname(from), spec)
  return imports[spec] ?? null
}

/**
 * Refuse to ship a tree the browser cannot load ([[BUG-71]]).
 *
 * WHAT IT CHECKS AND WHY THAT IS THE RIGHT SCOPE. It walks out from
 * `/builder/main.js` — the module the chrome document actually loads — and
 * resolves every static specifier it meets: absolute and relative against the
 * emitted tree, bare against the import map, plus the stylesheets the map
 * declares. A file no entry can reach cannot produce a blank page and is not
 * this check's business; a file that IS reachable and missing takes the entire
 * builder down, because the module graph fails as a unit.
 *
 * IT RUNS AGAINST THE STAGED TREE, BEFORE THE SWAP. That is what makes it
 * safe to be strict: a refusal leaves the previously built `dist-assets` exactly
 * where it was, so the operator's builder keeps working while they fix the
 * cause. Checking after the swap would mean every refusal also broke the thing
 * it was protecting.
 *
 * IT REPORTS ALL OF THEM, not the first. A build failure that names one missing
 * file per run turns a rename into as many edit-build cycles as it touched
 * files.
 */
export function checkImportGraph(
  distDir: string,
  entry: string,
  map: { imports: Record<string, string>; styles: string[] },
): ImportGraphReport {
  const exists = (url: string): boolean => fs.existsSync(path.join(distDir, url.replace(/^\//, '')))
  const dangling: Array<{ spec: string; from: string }> = []
  const seen = new Set<string>()
  const queue: Array<{ url: string; from: string }> = [{ url: entry, from: '(entry)' }]

  while (queue.length > 0) {
    const { url, from } = queue.shift() as { url: string; from: string }
    if (seen.has(url)) continue
    seen.add(url)
    if (!exists(url)) {
      dangling.push({ spec: url, from })
      continue
    }
    if (!/\.m?js$/.test(url)) continue
    const code = fs.readFileSync(path.join(distDir, url.replace(/^\//, '')), 'utf8')
    for (const { text: spec } of specifiersOf(code)) {
      const target = resolveUrl(url, spec, map.imports)
      if (target === null) dangling.push({ spec, from: url })
      else queue.push({ url: target, from: url })
    }
  }

  for (const style of map.styles) if (!exists(style)) dangling.push({ spec: style, from: '(import map)' })

  if (dangling.length > 0) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message:
        `The built assets import ${dangling.length} file(s) that were not built:\n` +
        dangling.map((d) => `  ${d.spec}  <- ${d.from}`).join('\n'),
      hint:
        'Nothing was swapped in — the previous dist-assets is untouched. ' +
        'A relative import inside a framework bridge must name a file in the repo; ' +
        'a bare specifier must be exported by an installed webui package.',
    })
  }

  return { modules: seen.size, styles: map.styles.length }
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
  // BUG-63 — the two halves of DOC-22's priming configuration the host
  // constructs. `Entry` is one named section of a tier; `PrimingProviders` is
  // the registry a `provider:` name resolves through. They arrive together
  // because neither is any use alone: an entry naming a provider nobody
  // registered is a load-time error, which is the design's point.
  'Entry',
  'NullArchive',
  'PrimingProviders',
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
  // REQ-207 — the port's own base64 encoder, which is why this file has none.
  // The image describer must hand `imageBlock` a base64 STRING rather than the
  // bytes the constructor also accepts: the session manager writes the durable
  // `turn_start` record — and measures the image for it — BEFORE the backend
  // normalises content, so bytes that far up the path are read as a string and
  // are not one. Encoding here with the same function the port would have used
  // keeps one encoder in the system rather than a second copy in this Worker.
  'bytesToBase64',
  // REQ-162 — the chat half of the ticket store's type pack. The AI component
  // owns the shape a `chat` ticket and its `chat_transcript` comment take
  // (DOC-10 §8), so the pack imports it rather than restating it here, where it
  // would drift from the archive that actually reads it back.
  'chatSchemas',
  // REQ-207 — the content-block vocabulary (REQ-111), which is what lets the
  // image describer stop being a second path to a model. They arrive as a pair
  // because a describer sends both: the picture and the one line of instruction
  // beside it. Named here rather than reconstructed as object literals in
  // `ai.ts`, so that a rename of the port's constructors surfaces as a
  // typecheck failure rather than as a request the provider refuses.
  'imageBlock',
  'memoryJunctions',
  'registerBackend',
  // [[REQ-208]] — the plugin layer ([[REQ-139]]). A tool surface packaged to be
  // INSTALLED rather than authored: the host imports a plugin, hands it the
  // credential the plugin declared, and gets back either a surface or a named
  // absence. It is on this boundary because `imagegen.ts` is the first adopter,
  // and it arrives ALONE rather than with `AbsentPlugin` because the absence is
  // consumed as an empty surface list — a host that never names the class
  // cannot mistake an absent plugin for a broken one.
  'resolvePlugins',
  'textBlock',
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
 * Passwordless sessions, as a module wrangler can follow ([[REQ-202]]).
 *
 * IDENTICALLY MOTIVATED to the three shims around it and deliberately not folded
 * into any of them: same out-of-repo shared store, same bare-specifier hazard
 * from a linked `git worktree`, same single resolution point, same one-line
 * re-export carrying an absolute path.
 *
 * TWO ENTRY POINTS, WHICH IS WHAT IS NEW HERE. The component publishes its
 * CONFORMANCE SUITE behind a second `exports` subpath, deliberately, so that
 * importing the component never drags a test harness onto a request path — and a
 * host is meant to run that suite against its own binding rather than trust that
 * its wiring satisfies the contract. So the subpath gets a shim of its own: the
 * Worker imports the root and nothing else, and only the workerd suite names the
 * conformance file. A bundler follows imports, so the harness reaches no
 * deployed bundle by virtue of not being imported from one.
 *
 * `sharedModulePath` THROWS WHEN A SUBPATH IS ABSENT, which is the failure worth
 * having: a component that dropped `./conformance` would otherwise produce a
 * build that succeeds and a contract nothing checks.
 */
function writeAuthShim(generatedDir: string): string {
  const entry = sharedModulePath('auth-passwordless')
  const conformance = sharedModulePath('auth-passwordless', './conformance')
  fs.writeFileSync(
    path.join(generatedDir, 'auth-passwordless.js'),
    `// Generated by \`1c assets\` ([[REQ-202]]). Do not edit, do not commit.\n` +
      `// Resolves the out-of-repo shared store to an absolute path so wrangler can\n` +
      `// bundle it from any checkout, including a linked git worktree.\n` +
      `export * from ${JSON.stringify(entry)}\n`,
  )
  fs.writeFileSync(
    path.join(generatedDir, 'auth-passwordless.d.ts'),
    [
      '// Generated by `1c assets` ([[REQ-202]]). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      ...AUTH_EXPORTS.map((n) => `export const ${n}: any`),
      '',
    ].join('\n'),
  )
  fs.writeFileSync(
    path.join(generatedDir, 'auth-passwordless-conformance.js'),
    `// Generated by \`1c assets\` ([[REQ-202]]). Do not edit, do not commit.\n` +
      `// The component's own contract suite, for the workerd UAT that runs it against\n` +
      `// this deployment's D1. Nothing on a request path imports this file.\n` +
      `export * from ${JSON.stringify(conformance)}\n`,
  )
  fs.writeFileSync(
    path.join(generatedDir, 'auth-passwordless-conformance.d.ts'),
    [
      '// Generated by `1c assets` ([[REQ-202]]). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      'export const PASSWORDLESS_CONTRACT: any',
      'export const assertPasswordlessContract: any',
      '',
    ].join('\n'),
  )
  return entry
}

/**
 * What the Worker reaches for out of the passwordless component.
 *
 * Listed rather than wildcarded for the reason {@link TICKETING_EXPORTS} gives:
 * a wildcard would also silence a typo, and an upstream rename should surface as
 * a typecheck failure here rather than as `undefined is not a constructor` at the
 * moment somebody is waiting for a sign-in link.
 */
const AUTH_EXPORTS = [
  'ISSUE_ACK',
  'PURPOSES',
  'PasswordlessAuth',
  'REDEEM_STATUS',
  // The DDL, so the schema-drift UAT can compare the migration against the
  // component's own statements without a second resolution path.
  'SCHEMA_STATEMENTS',
  'readCookie',
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
  // The name a knowledge base's `source` resolves to when it declares none
  // ([[BUG-55]]). The project KB declares none, and upstream's `indexFor` — unlike
  // `storeFor` — has no default entry to fall back on, so the project index has
  // to be keyed under this name explicitly. Naming the constant rather than
  // typing `'project'` keeps one answer to "what is a KB's source called".
  'DEFAULT_SOURCE',
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
/**
 * The image-generation plugin, as a module wrangler can follow ([[REQ-208]]).
 *
 * THE SAME SHIM FOR THE SAME REASON as the others, and nothing new is decided
 * here: same out-of-repo shared store, same bare-specifier hazard from a linked
 * `git worktree`, same single resolution point, same one-line re-export carrying
 * an absolute path so the bundler follows a real module graph.
 *
 * THE PACKAGE ROOT, which is Worker-safe by construction. The plugin's whole
 * dependency set is the AI component's `/core` rung (backend-free), the
 * image-generation component (plain `fetch`, no SDK) and the ticketing
 * component — no provider SDK and no node builtin reaches a bundle through this
 * entry point.
 *
 * The components are named WITHOUT their scope, deliberately: `webui.ts` is the
 * one place that string is written, and `bug32-webui-scope-rebrand` fails any
 * file that restates it — prose included, because a half-completed rename reads
 * as "not installed yet" rather than as a bug.
 */
function writeAiImagegenShim(generatedDir: string): string {
  const entry = sharedModulePath('ai-imagegen')
  fs.writeFileSync(
    path.join(generatedDir, 'ai-imagegen.js'),
    `// Generated by \`1c assets\` (REQ-208). Do not edit, do not commit.\n` +
      `// Resolves the out-of-repo shared store to an absolute path so wrangler can\n` +
      `// bundle it from any checkout, including a linked git worktree.\n` +
      `export * from ${JSON.stringify(entry)}\n`,
  )
  fs.writeFileSync(
    path.join(generatedDir, 'ai-imagegen.d.ts'),
    [
      '// Generated by `1c assets` (REQ-208). Do not edit, do not commit.',
      '/* eslint-disable @typescript-eslint/no-explicit-any */',
      ...AI_IMAGEGEN_EXPORTS.map((n) => `export const ${n}: any`),
      '',
    ].join('\n'),
  )
  return entry
}

/**
 * What the Worker reaches for out of the image-generation plugin.
 *
 * Listed rather than wildcarded for the reason {@link AI_WORKER_EXPORTS} gives.
 * Four names, and each is a decision this repository would otherwise have to
 * restate: `createImagePlugin` builds the plugin, `PROVIDERS` is where the
 * credential's NAME is read from so this repository never spells it a second
 * way, `DEFAULT_BUDGET` is the runaway-loop stop this deployment chose to keep
 * rather than override, and `instanceConfig` is the GRANT.
 *
 * THE GRANT IS IMPORTED RATHER THAN WRITTEN, and that is the opposite of what
 * the fidelity surface does. Fidelity's grant is an entry in `instances.json`
 * because its declaration lives in this repository and CI validates the two
 * against each other. This surface's declaration lives upstream, so an entry
 * there would be a grant naming a surface the validator has never seen — and
 * `test_UAT_FC_REQ_157_both_declarations_validate_together` says so, correctly.
 * Deriving it from the declaration is also the stronger property: a grant built
 * by the surface cannot name a group the surface does not have, so an upstream
 * rename cannot leave this deployment quietly granting nothing.
 */
const AI_IMAGEGEN_EXPORTS = [
  'DEFAULT_BUDGET',
  'PROVIDERS',
  'createImagePlugin',
  'instanceConfig',
] as const

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
 * They are the two halves of DOC-10 §5.1's bargain: the corpus as a searchable
 * tool surface (`KnowledgeRuntime`, `KnowledgeToolbox`,
 * `knowledgeInstanceConfig`) and the map that tells a cold session the corpus is
 * there at all. Shipping the first without the second would be a tool the
 * assistant never learns to reach for.
 *
 * THE MAP IS THREE NAMES NOW, NOT ONE (BUG-63). It was `KnowledgeDocs`, a class
 * that assembled the map, the purpose and the mechanism into one document.
 * Upstream deleted it when priming became DOC-22's ordered entries: the map and
 * the mechanism are separately named providers, `registerKmProviders` binds both
 * onto the session's registry, and the two constants are what a priming entry
 * names them by. All three or none — a host that registers the providers and
 * cannot name them has primed nothing.
 *
 * That this list is explicit is what made the upgrade a typecheck failure at the
 * shim rather than `undefined is not a function` inside a turn.
 */
const AI_KNOWLEDGE_EXPORTS = [
  'LANDSCAPE_PROVIDER',
  'MECHANISM_PROVIDER',
  'KnowledgeRuntime',
  'KnowledgeToolbox',
  'knowledgeInstanceConfig',
  'registerKmProviders',
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
  const kbDir = path.join(repoRoot, 'kb')
  const bundle = await kbBundle(kbDir)
  // BEFORE ANYTHING IS WRITTEN (BUG-48). The corpus arrives here as a directory
  // listing and the two manifests as build artefacts — two clocks, and nothing
  // until now required them to agree. A bundle whose corpus holds documents its
  // index does not is refused rather than inlined, because what it produces is an
  // assistant that carries a document all session and reports the subject as one
  // it has nothing on. Refused HERE, at the last moment the operator can still
  // fix it, and before the staged tree is swapped in — so a refusal costs a build
  // and never a shipped one.
  const skew = bundle === null ? null : await requireCoherentKb(bundle, kbDir)
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
    ? { built: false, documents: 0, bytes: fs.statSync(file).size, exempt: [] }
    : {
        built: true,
        documents: Object.keys(bundle.docs).length,
        bytes: fs.statSync(file).size,
        exempt: skew?.exempt ?? [],
      }
}

/** What {@link writeKbModule} emitted, so the operator can see it or its absence. */
export interface KbAssetReport {
  /** Whether `1c kb build` has produced an index for this checkout. */
  built: boolean
  documents: number
  bytes: number
  /**
   * Documents inlined as text that the corpus predicate excludes from the index.
   *
   * The awareness map, today and probably always. Named in the report rather than
   * left implicit because "this document ships unsearchable" is exactly the claim
   * BUG-48 was filed over, and the difference between this one and the three that
   * caused it is that this one is deliberate. An exemption nobody can see is
   * indistinguishable from the bug.
   *
   * OPTIONAL, because {@link kbLine} is called on hand-built reports as well as on
   * the one {@link writeKbModule} returns, and a report line that throws on a
   * field it only ever decorates with would turn a formatting detail into a failed
   * build. The producer always sets it.
   */
  exempt?: string[]
}

/**
 * What the chrome document loads, and therefore what the graph check walks from.
 * Must match the module `chrome.ts` writes into its `<script type="module">`.
 */
const BUILDER_ENTRY = '/builder/main.js'

/** Build every control-app asset. `repoRoot` is the checkout to read and write in. */
export async function buildControlAppAssets(repoRoot: string): Promise<AssetBuildReport> {
  // First, because it is the one artifact the RENDER needs rather than the
  // browser: without it `theme.css` cannot be composed in a runtime with no
  // filesystem, and every page the Worker serves would be unstyled.
  const modules = buildModuleAssets(repoRoot)

  const appDir = path.join(repoRoot, 'apps', 'control-app')
  const outDir = path.join(appDir, 'dist-assets')

  // BUILT ASIDE, THEN SWAPPED IN, for two reasons that are really one.
  //
  // Emptied, not merged: a stale component left behind by a rename would be
  // served for as long as nobody looked, which is the failure this whole ticket
  // is removing from the request path. But emptying the directory that is being
  // SERVED and refilling it over the next several seconds means everything
  // reading it in the meantime — a `wrangler dev` on this checkout, another test
  // in the same run — gets a 404 for every component. And a build that FAILS
  // part-way through, which is exactly what an incomplete component store makes
  // it do, leaves that hole permanently.
  //
  // So the new tree is assembled beside the old one and takes its place only
  // once it is whole. A reader sees the previous build or the new one, never a
  // half of either, and a failed build leaves the working one in place.
  const stageDir = `${outDir}.staging`
  fs.rmSync(stageDir, { recursive: true, force: true })
  fs.mkdirSync(stageDir, { recursive: true })

  const builderFiles = copyDir(path.join(appDir, 'src', 'builder'), path.join(stageDir, 'builder'))

  const imports: Record<string, string> = {}
  const styles: string[] = []
  let webuiFiles = 0
  for (const name of WEBUI_PACKAGES) {
    webuiFiles += copyDir(webuiPackageDir(name), path.join(stageDir, 'webui', name))
    for (const [subpath, target] of Object.entries(webuiExports(name))) {
      const url = `/webui/${name}/${target.replace(/^\.\//, '')}`
      // Composed from the single scope declaration, never restated.
      if (subpath === '.') imports[`${WEBUI_SCOPE}/${name}`] = url
      else if (target.endsWith('.css')) styles.push(url)
      else imports[`${WEBUI_SCOPE}/${name}/${subpath.replace(/^\.\//, '')}`] = url
    }
  }

  const fwOut = path.join(stageDir, 'framework')
  fs.mkdirSync(fwOut, { recursive: true })
  const frameworkFiles = emitFrameworkTree(repoRoot, fwOut)

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
  const authEntry = writeAuthShim(generated)
  const aiImagegenEntry = writeAiImagegenShim(generated)
  const kb = await writeKbModule(generated, repoRoot)

  // THE CHECK GOES HERE — after the tree is whole and before it is served.
  // Every artifact the browser can reach now exists in `stageDir`, and nothing
  // has replaced `outDir` yet, so this is the one moment at which refusing costs
  // the operator nothing ([[BUG-71]]).
  const graph = checkImportGraph(stageDir, BUILDER_ENTRY, { imports, styles })

  // The swap, last, once every artifact above exists. Two renames rather than a
  // delete-then-rename: a directory rename cannot land on a non-empty one, and
  // moving the old tree aside first keeps the moment the path is unoccupied to a
  // single syscall instead of the whole copy.
  const retiredDir = `${outDir}.retired`
  fs.rmSync(retiredDir, { recursive: true, force: true })
  if (fs.existsSync(outDir)) fs.renameSync(outDir, retiredDir)
  fs.renameSync(stageDir, outDir)
  fs.rmSync(retiredDir, { recursive: true, force: true })

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
    authEntry,
    aiImagegenEntry,
    kb,
    graph,
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
    `graph      ${report.graph.modules} modules, ${report.graph.styles} stylesheets — every import resolves`,
    `ai         ${report.aiWorkersEntry}`,
    `ticketing  ${report.ticketingEntry}`,
    `knowledge  ${report.knowledgeEntry}`,
    `bridge     ${report.aiKnowledgeEntry}`,
    `auth       ${report.authEntry}`,
    `imagegen   ${report.aiImagegenEntry}`,
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
  if (!kb.built) {
    return (
      'kb         *** NOT BUILT — the assistant will ship with no system knowledge. ' +
      'Run `1c kb build`. ***'
    )
  }
  // The exempt documents are named, not counted (BUG-48). A count would say a
  // number the operator cannot check; the names are three words and let them see
  // that the map is the only thing shipping unsearchable, which is the whole
  // claim the exemption makes.
  const exempt = kb.exempt ?? []
  const held = exempt.length > 0 ? `, ${exempt.join(', ')} primed not indexed` : ''
  return `kb         ${kb.documents} document(s), ${Math.round(kb.bytes / 1024)}KB inlined${held}`
}
