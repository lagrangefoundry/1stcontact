import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { buildModuleAssets, type ModuleAssetBuild } from './module-assets'
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
  'applyRecords',
  'availableBackends',
  'memoryJunctions',
  'registerBackend',
] as const

/** Build every control-app asset. `repoRoot` is the checkout to read and write in. */
export function buildControlAppAssets(repoRoot: string): AssetBuildReport {
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

  return {
    modules,
    outDir,
    builderFiles,
    webuiFiles,
    frameworkFiles,
    imports,
    styles,
    aiWorkersEntry,
  }
}

/** `1c assets` — build them and report what was written. */
export function cmdAssets(opts: { cwd?: string } = {}): AssetBuildReport {
  return buildControlAppAssets(opts.cwd ?? process.cwd())
}

export function formatAssetReport(report: AssetBuildReport): string {
  return [
    `modules    ${report.modules.css.length} css, ${report.modules.clientJs.length} client.js → ${report.modules.file}`,
    `builder    ${report.builderFiles} files`,
    `webui      ${report.webuiFiles} files, ${Object.keys(report.imports).length} import-map entries, ${report.styles.length} stylesheets`,
    `framework  ${report.frameworkFiles.join(', ')}`,
    `ai         ${report.aiWorkersEntry}`,
    `out        ${report.outDir}`,
  ].join('\n')
}
