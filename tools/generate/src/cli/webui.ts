import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/**
 * Resolution of the shared `webui-*` components (REQ-115 Deliverable 0,
 * DOC-8 §9.5).
 *
 * THE SCOPE THEY ARE PUBLISHED UNDER IS DECLARED HERE, ONCE — see
 * {@link WEBUI_SCOPE} — and nothing else in this repository writes it as a
 * literal. Everything that composes a component reference composes it from that
 * declaration, so moving with an upstream rename is a one-line change.
 *
 * WHY THE RULE IS STRICTER THAN IT LOOKS. The dependency is implicit (below),
 * so absence is detected by resolution failing — and a HALF-COMPLETED rename
 * fails resolution in exactly the same way a machine that never ran the install
 * does. A second copy of the scope anywhere would therefore not announce itself
 * as a defect; it would read as "not installed yet" and skip green while the
 * workspace shipped an import map nothing can resolve. That is why the scope
 * lives at one site, why the old name is deleted outright rather than kept as a
 * fallback, and why this prose does not spell either name.
 *
 * The one place that cannot compose it is the workspace's own browser source:
 * it is served to the browser verbatim and can read no build-time value, so it
 * names components directly. That exception is bounded and held in step by
 * evidence, never trusted.
 *
 * THE CONSUMPTION ROUTE: a **shared artifact store**, populated by the operator
 * running `lagrange-framework`'s `bin/install`. That command packs each
 * component and extracts it into a flat `node_modules` in a directory the
 * consumer lives under — so Node's ordinary upward resolution finds it, with no
 * registry, no workspace link, and no submodule. Neither publishing nor a
 * submodule is used: the upstream repo has already designed and shipped this
 * mechanism, and consuming it any other way would fork the decision.
 *
 * Two properties come from upstream and are why this is the right route: the
 * consumer runs against a packed snapshot (never an editable install), so it
 * keeps working while the framework repo is mid-edit; and updates only happen
 * when the operator deliberately re-runs `bin/install`.
 *
 * NO SOURCE IS COPIED INTO THIS REPO, and nothing here patches or wraps a
 * component — a gap is closed upstream (DOC-8 §9.4.1), never worked around.
 *
 * The one cost upstream names explicitly is that the dependency is *implicit*:
 * nothing in our `package.json` records it, so a fresh clone gets nothing "with
 * no diagnostic pointing here". {@link webuiPackageDir} is that diagnostic — it
 * is the single resolution point, and its failure names the command to run.
 */

/**
 * The repository's MAIN CHECKOUT — the directory the shared store was installed
 * to sit beside.
 *
 * `bin/install` never infers its target from a working directory; the operator
 * names one, and for this repo that is the directory the checkout lives under.
 * "The consumer" in that sentence is the repository, not the process's happened
 * -to-be file location — and a `git worktree` checkout is the same repository
 * parked outside that directory. Anchoring resolution here therefore computes
 * what the consumption route already means, instead of what an accident of
 * layout implies: a linked worktree reads the identical store the main checkout
 * does, and a build or a test run from one is not silently evidence-free.
 *
 * Found by walking up to the `.git` entry. A directory is the main checkout's
 * own; a FILE is a linked worktree's pointer, whose `commondir` names the main
 * `.git` — its parent is the main checkout. Outside a checkout entirely (an
 * extracted tarball) there is nothing to anchor to and this file's own location
 * is the only honest answer.
 */
function mainCheckout(from: string): string {
  const dir = checkoutRoot(from)
  const dotGit = path.join(dir, '.git')
  if (!fs.existsSync(dotGit) || fs.statSync(dotGit).isDirectory()) return dir
  const gitdir = path.resolve(dir, fs.readFileSync(dotGit, 'utf8').replace(/^gitdir:/, '').trim())
  const commondir = path.join(gitdir, 'commondir')
  if (!fs.existsSync(commondir)) return dir
  return path.dirname(path.resolve(gitdir, fs.readFileSync(commondir, 'utf8').trim()))
}

/**
 * The checkout the code is RUNNING FROM — the directory holding the `.git`
 * entry, whether that entry is a directory (the main checkout) or a file (a
 * linked worktree's pointer).
 *
 * Deliberately stops where {@link mainCheckout} keeps going, because the two
 * answer different questions. The shared component store is installed ONCE,
 * beside the main checkout, and every worktree must read that one — so its
 * resolution follows the pointer. Repository CONTENT is the opposite: a worktree
 * has its own, on its own branch, and following the pointer would make a build
 * run from a worktree write into the main checkout's working tree — landing the
 * artefact on the wrong branch and dirtying a tree the operator was not working
 * in.
 */
function checkoutRoot(from: string): string {
  let dir = from
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir
    const up = path.dirname(dir)
    if (up === dir) return from
    dir = up
  }
}

/**
 * Where to start the walk. Normally this file; when a bundler has inlined it
 * (Vite bundles its own config and everything the config imports) `import.meta`
 * no longer describes a real file, and the running directory is the only thing
 * left that is genuinely inside the checkout.
 */
function walkOrigin(): string {
  try {
    return path.dirname(fileURLToPath(import.meta.url))
  } catch {
    return process.cwd()
  }
}

const require = createRequire(path.join(mainCheckout(walkOrigin()), 'package.json'))

/**
 * The checkout this code is running from, for callers that need a REPO-ANCHORED
 * path rather than a working-directory one (REQ-123).
 *
 * Exported for the same reason the store resolution above does not trust
 * `process.cwd()`: a release artefact belongs to the repository, not to wherever
 * a process happened to be started. The system KB is such an artefact — one KB
 * serves every site, so it cannot live under `ctxOf().cwd`, which is deliberately
 * the caller's directory because site data IS per-directory.
 *
 * {@link checkoutRoot} and not {@link mainCheckout}: the KB is repository
 * content, and a worktree's build belongs to the worktree.
 */
export function repoRoot(): string {
  return checkoutRoot(walkOrigin())
}

/** The npm scope the components are published under. THE single definition. */
export const WEBUI_SCOPE = '@lagrangefoundry'

/**
 * The components the builder mounts. Extend as later phases consume more.
 *
 * `webui-markdown` is here because `webui-chat` declares it a PEER: the chat
 * panel renders assistant turns through it and does not carry it. A peer is the
 * consumer's to supply, so it has to reach the browser's import map too — an
 * import map that resolves the panel but not what the panel imports fails at the
 * first rendered message rather than at load.
 */
export const WEBUI_PACKAGES = [
  'webui-shell',
  'webui-split',
  'webui-fields',
  'webui-chat',
  'webui-markdown',
] as const
export type WebuiPackage = (typeof WEBUI_PACKAGES)[number]

/**
 * A module in the shared store, as a URL `import()` can take (REQ-122).
 *
 * The store holds more than the browser components — `@lagrangefoundry/ai` lives
 * there too, and the builder origin loads it SERVER-side. A bare specifier would
 * be resolved by Node walking up from the importing file, which finds the store
 * from the main checkout and finds nothing from a linked `git worktree`; that is
 * the same silent-skip hazard {@link webuiPackageDir} exists to close, so the
 * server-side load goes through the same single resolution point rather than a
 * second guess at where the store is.
 *
 * Returned as a URL rather than a path because it is consumed by dynamic
 * `import()`, which resolves a bare path relative to the *importing* module.
 */
export function sharedModuleUrl(name: string, subpath = '.'): string {
  return pathToFileURL(sharedModulePath(name, subpath)).href
}

/**
 * The same module as an absolute PATH (REQ-146).
 *
 * {@link sharedModuleUrl} is for a runtime dynamic `import()`, which needs a URL.
 * This is for a BUILD, which needs a path to write into a generated re-export
 * that a bundler will follow — `1c assets` emits one so the Worker can reach the
 * AI library without a bare specifier. Both go through the same single resolution
 * point, so neither is a second guess at where the store is.
 *
 * Throws {@link MissingWebuiComponentError} when the component is absent OR when
 * it declares no such subpath. The second case matters as much as the first: an
 * upstream rung that moved would otherwise produce a build that succeeds and a
 * Worker with no assistant.
 */
export function sharedModulePath(name: string, subpath = '.'): string {
  const target = webuiExports(name)[subpath]
  if (target === undefined) {
    throw new MissingWebuiComponentError(name)
  }
  return path.join(webuiPackageDir(name), target.replace(/^\.\//, ''))
}

/**
 * Absolute directory of an installed component.
 *
 * Resolved through the package's own `exports` entry and then walked up to the
 * directory holding its `package.json`, so nothing here assumes a layout (`src/`
 * today) that upstream is free to change.
 */
export function webuiPackageDir(name: string): string {
  const spec = `${WEBUI_SCOPE}/${name}`
  let entry: string
  try {
    entry = require.resolve(spec)
  } catch {
    throw new MissingWebuiComponentError(name)
  }
  let dir = path.dirname(entry)
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir
    const up = path.dirname(dir)
    if (up === dir) throw new MissingWebuiComponentError(name)
    dir = up
  }
}

/** Raised when a component is absent — names the command that installs it. */
export class MissingWebuiComponentError extends Error {
  constructor(public component: string) {
    super(
      `${WEBUI_SCOPE}/${component} is not installed.\n` +
        `The webui components are delivered by lagrange-framework's deliberate install:\n` +
        `    cd ../lagrange-framework && bin/install --lang js --component ${component}\n` +
        `(or '--component all'). They are never vendored into this repo.`,
    )
    this.name = 'MissingWebuiComponentError'
  }
}

/**
 * The subpaths a component exposes, as declared by its own `exports` map —
 * `'.'` plus any CSS entry. Used to build the browser import map and stylesheet
 * links without hardcoding `src/index.js` anywhere.
 */
export function webuiExports(name: string): Record<string, string> {
  const dir = webuiPackageDir(name)
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
    exports?: Record<string, string>
    main?: string
  }
  if (pkg.exports) return pkg.exports
  return { '.': pkg.main ?? './index.js' }
}

/** Every installed component's directory, keyed by package name. */
export function webuiRoots(names: readonly string[] = WEBUI_PACKAGES): Map<string, string> {
  return new Map(names.map((n) => [n, webuiPackageDir(n)]))
}
