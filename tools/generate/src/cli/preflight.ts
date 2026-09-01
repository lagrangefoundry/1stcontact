/**
 * REQ-44 — the install preflight.
 *
 * Declaring a dependency is not the same as materializing it. `package.json`
 * plus `pnpm-lock.yaml` describe what *should* be on disk; only `pnpm install`
 * puts it there. When a dependency lands via a commit and no install follows,
 * `node_modules` silently lags the lockfile — and the next prune is free to
 * remove a package that is still *declared*, because as far as the installed
 * tree is concerned it was never wanted. That is how `playwright` disappeared
 * from a tree whose manifests named it, and how `1c shot` came to die deep
 * inside a browser launch with `Cannot find module 'playwright'`.
 *
 * This module turns that into a check that runs *before* the browser, in two
 * independent parts:
 *
 *   - **resolution** — can each declared dependency the command actually loads
 *     be resolved from disk? This catches the pruned-package case directly.
 *   - **drift** — does `pnpm-lock.yaml` still match the copy pnpm wrote at last
 *     install (`node_modules/.pnpm/lock.yaml`)? pnpm writes that file verbatim,
 *     so byte-inequality is an exact statement that the tree was never installed
 *     at the committed lockfile. No mtime heuristics, no false positives from a
 *     touched file.
 *
 * Drift is reported even when everything still resolves. The two are different
 * facts: resolution says "the thing I need is here *right now*", drift says
 * "this tree is not the tree the lockfile describes" — which is the state that
 * *permits* the next prune. Catching it while the commands still work is the
 * whole point; waiting for the prune means the report arrives as a stack trace.
 *
 * Both checks are pure functions of a root directory and a resolver, so they are
 * exercised against synthetic trees rather than by mutating a real install.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { CommandError } from './errors'

/** The package whose declared dependencies the CLI runs on. */
export const GENERATE_PKG_REL = path.join('tools', 'generate', 'package.json')

/** The committed lockfile — what the tree *should* be installed at. */
export const LOCKFILE_REL = 'pnpm-lock.yaml'

/**
 * pnpm's verbatim copy of the lockfile as of the last install. Present in every
 * pnpm-installed tree; its absence means nothing was ever installed here.
 */
export const INSTALLED_LOCKFILE_REL = path.join('node_modules', '.pnpm', 'lock.yaml')

/**
 * Which declared dependencies each command actually loads.
 *
 * Deliberately per-command rather than one blanket "browser deps" set: the
 * offline seams of `diff` / `values-diff` (`--actual`, `--actual-manifest`) exist
 * so the pipeline is drivable without a browser. Blocking a verb on a package it
 * does not load would make the preflight the very thing it was written to
 * prevent — a failure with no bearing on the work.
 *
 * Commands absent from this map are ungated: `render`, `serve`, `builder`,
 * `repro`, `refold`, `l1-gate`, `responsive-diff` and the structured-edit verbs
 * read and write files only.
 *
 * `crop` LEFT THIS MAP ENTIRELY under REQ-156. It decodes an image and never
 * opens a browser, so `sharp` was its only declared dependency; with the codec
 * written into this repo it loads nothing that can be absent, and a gate on an
 * empty requirement is a gate that can only produce false refusals. `diff`,
 * `gate` and `aligned-crops` keep their entries, now naming `playwright` alone.
 */
export const COMMAND_DEPS: Readonly<Record<string, readonly string[]>> = {
  capture: ['playwright'],
  shot: ['playwright'],
  'values-diff': ['playwright'],
  'adopt-gaps': ['playwright'],
  diff: ['playwright'],
  gate: ['playwright'],
  'aligned-crops': ['playwright'],
}

/** A single reason the installed tree is not usable as-is. */
export interface PreflightFinding {
  /** `missing-dep`: a declared package does not resolve. `lockfile-drift`: install ≠ lockfile. */
  kind: 'missing-dep' | 'lockfile-drift'
  /** Human-readable statement of the fact, without the remedy. */
  detail: string
  /** For `missing-dep`, the packages that failed to resolve. */
  packages?: string[]
}

export interface PreflightReport {
  ok: boolean
  findings: PreflightFinding[]
}

/** Resolve a package id from the project, or return undefined. Injectable for tests. */
export type Resolver = (pkg: string) => string | undefined

export interface PreflightOptions {
  /** Repo root — where `pnpm-lock.yaml` and `node_modules/` live. */
  repoRoot: string
  /** Declared dependencies the command needs. */
  required: readonly string[]
  /** Defaults to Node resolution rooted at the generate package. */
  resolve?: Resolver
}

/** Node resolution rooted at `tools/generate`, where the deps are declared. */
function defaultResolver(repoRoot: string): Resolver {
  const require = createRequire(path.join(repoRoot, GENERATE_PKG_REL))
  return (pkg) => {
    try {
      return require.resolve(pkg)
    } catch {
      return undefined
    }
  }
}

/** Read a file, or undefined when it is absent/unreadable. */
function readOrUndefined(file: string): string | undefined {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return undefined
  }
}

/**
 * Probe the installed tree. Read-only and cheap — two small file reads and one
 * `require.resolve` per package — so it is affordable at the top of every gated
 * command rather than something the operator has to remember to run.
 */
export function checkInstall(opts: PreflightOptions): PreflightReport {
  const { repoRoot, required } = opts
  const resolve = opts.resolve ?? defaultResolver(repoRoot)
  const findings: PreflightFinding[] = []

  const missing = required.filter((pkg) => resolve(pkg) === undefined)
  if (missing.length > 0) {
    findings.push({
      kind: 'missing-dep',
      packages: missing,
      detail:
        `declared ${missing.length === 1 ? 'dependency' : 'dependencies'} ` +
        `${missing.map((p) => `'${p}'`).join(', ')} ` +
        `${missing.length === 1 ? 'does' : 'do'} not resolve — ` +
        `named in ${GENERATE_PKG_REL} but not present in node_modules/`,
    })
  }

  // The lockfile is only an oracle if it is there to compare against; a tree
  // with no committed lockfile is a different project shape, not a drifted
  // install, and is not this check's business.
  const lockfile = readOrUndefined(path.join(repoRoot, LOCKFILE_REL))
  if (lockfile !== undefined) {
    const installed = readOrUndefined(path.join(repoRoot, INSTALLED_LOCKFILE_REL))
    if (installed === undefined) {
      findings.push({
        kind: 'lockfile-drift',
        detail: `${INSTALLED_LOCKFILE_REL} is absent — dependencies have never been installed in this tree`,
      })
    } else if (installed !== lockfile) {
      findings.push({
        kind: 'lockfile-drift',
        detail:
          `${LOCKFILE_REL} does not match the snapshot pnpm wrote at last install ` +
          `(${INSTALLED_LOCKFILE_REL}) — node_modules/ is behind the committed lockfile`,
      })
    }
  }

  return { ok: findings.length === 0, findings }
}

/** The remedy. One command, whatever the finding — that is the point of it. */
export const INSTALL_COMMAND = 'pnpm install'

/**
 * Fail a gated command on a bad install.
 *
 * Reported as a {@link CommandError} so it travels the CLI's existing failure
 * contract — an `ENVIRONMENT` code, exit 6, and the same `{ok:false,error}`
 * envelope under `--json` — rather than as a bare throw an AI caller would have
 * to read prose to classify. The code is distinct from `INTERNAL` because
 * nothing is wrong with the *command*: the input was fine and the tree was not.
 */
export function assertInstall(command: string, opts?: { repoRoot?: string; resolve?: Resolver }): void {
  const required = COMMAND_DEPS[command]
  if (required === undefined) return

  const repoRoot = opts?.repoRoot ?? process.cwd()
  const report = checkInstall({ repoRoot, required, resolve: opts?.resolve })
  if (report.ok) return

  throw new CommandError({
    code: 'ENVIRONMENT',
    message:
      `'1c ${command}' cannot run: the installed dependencies do not match what is declared.\n` +
      report.findings.map((f) => `  - ${f.detail}`).join('\n'),
    hint: `Run \`${INSTALL_COMMAND}\` at the repo root, then retry.`,
  })
}
