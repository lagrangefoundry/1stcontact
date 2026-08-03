import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

/**
 * Resolution of the `@gendevlabs/webui-*` components (REQ-115 Deliverable 0,
 * DOC-8 §9.5).
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

const require = createRequire(import.meta.url)

export const WEBUI_SCOPE = '@gendevlabs'

/** The components the builder mounts. Extend as later phases consume more. */
export const WEBUI_PACKAGES = ['webui-shell', 'webui-split'] as const
export type WebuiPackage = (typeof WEBUI_PACKAGES)[number]

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
