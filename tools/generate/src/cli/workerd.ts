/**
 * [[REQ-316]] — the workerd preflight: **exactly one `workerd` resolves here**.
 *
 * {@link ./preflight} asks "is this tree installed at its lockfile?" and
 * {@link ./shared-store} asks "are the shared store's components present?". This
 * is the third question in that family, and it is about a dependency that is
 * present, installed, and correct — twice.
 *
 * WHAT WENT WRONG, AND WHY IT COULD NOT BE READ. `.wrangler/state` is not this
 * repository's store. It is **workerd's**, and workerd migrates that schema
 * forward silently the first time it opens it: no log line, no warning, no
 * version stamp an operator can read back. So on 2026-09-24 a newer workerd —
 * reached through `miniflare`, which `1c fonts seed` imports as a library
 * ([[REQ-315]]) — ran `ALTER TABLE _cf_ALARM ADD COLUMN actor_name` on both
 * apps' local R2 stores, and the older workerd behind `wrangler dev` then died
 * at the next `1c builder` with
 *
 *     table _cf_ALARM has 3 columns but 2 values were supplied
 *
 * naming a table that appears in no schema this repository owns, in no migration
 * and in no D1 database. Every remedy the message suggests — `wrangler d1
 * migrations apply`, a `[[migrations]]` block — is wrong, because none of them
 * reach workerd's internal tables. The fault was a `^` in four manifests; the
 * report was an internal SQLite error in an unrelated command.
 *
 * SO THE CHECK IS AN ENTRY GUARD, NOT A DIAGNOSIS. It fires **before** anything
 * opens the store, because the migration is effectively one-way — workerd does
 * not remove the column it added — and recovery on 2026-09-24 was free only
 * because of which table happened to change. The same skew landing on
 * `_mf_objects` would have cost the store's objects and blobs with no undo.
 *
 * WHY IT READS THE INSTALLED TREE AND NOT THE LOCKFILE. The lockfile says what
 * *should* be on disk; only an install puts it there, and a virtual store keeps
 * orphaned versions long after nothing links them. This walks the links an
 * importer actually resolves through, so a `workerd@...` directory that survives
 * in `node_modules/.pnpm` with no dependant is correctly not a finding — it is
 * not a runtime anything can reach. ([[REQ-44]] owns the other half: whether the
 * installed tree still matches its lockfile at all.)
 *
 * WHY NOT A pnpm `overrides` ENTRY. It is the obvious one-line answer and it is
 * worse: it would force every consumer onto one build regardless of who asked —
 * overruling wrangler's own pin, so the repository would run wrangler against a
 * runtime its authors did not ship it with. That trades a visible failure for an
 * invisible one. The exact pins in the manifests keep the declaration honest;
 * this check keeps the pins honest.
 *
 * The walk is a pure function of a root directory and an injectable scan, so the
 * suite exercises it against synthetic trees rather than by mutating a real
 * `node_modules`.
 */
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { CommandError } from './errors'

/** The runtime whose duplication this module exists to refuse. */
export const WORKERD = 'workerd'

/**
 * A `workerd` reached from an importer, and the package that depends on it.
 *
 * `broughtBy` is the DIRECT dependant rather than the importer, because that is
 * the thing an operator changes: `wrangler` and `miniflare` each declare their
 * own `workerd`, and a report naming only "the root package.json" would leave
 * them to re-derive which of the two moved.
 */
export interface WorkerdInstance {
  /** The resolved `workerd` version, e.g. `1.20260710.1`. */
  version: string
  /** The package that declares it, as `name@version` — e.g. `wrangler@4.106.0`. */
  broughtBy: string
}

/**
 * An instance, plus where in this workspace its dependant is DECLARED.
 *
 * Empty for a transitive one — `wrangler` carries its own `miniflare`, and
 * `@cloudflare/unenv-preset` takes `workerd` as a peer, so a split shows up on
 * several rows of which only some are editable. The distinction is carried
 * rather than filtered, because dropping the transitive rows would hide that the
 * two generations really are both live, and dropping the annotation would leave
 * the operator guessing which row is the one they can act on.
 */
export interface WorkerdFinding extends WorkerdInstance {
  /** Repo-relative manifests declaring `broughtBy`'s package name. */
  declaredIn: string[]
}

export interface WorkerdReport {
  ok: boolean
  /** Distinct versions reached, sorted. One (or none) is the invariant holding. */
  versions: string[]
  /** Every (version, dependant) pair found — grouped by version, declared rows first. */
  instances: WorkerdFinding[]
  /** Repo-relative manifests declaring a package that brought one, in discovery order. */
  manifests: string[]
}

/** Walk a tree and report the `workerd` copies an importer can reach. Injectable for tests. */
export type WorkerdScan = (repoRoot: string) => WorkerdInstance[]

// -- finding the importers ---------------------------------------------------

/**
 * The workspace's own packages, as repo-relative `package.json` paths.
 *
 * READ FROM `pnpm-workspace.yaml` rather than listed here, for the reason
 * `seed.ts` discovers its apps rather than naming them: a fourth workspace
 * package that starts declaring a runtime is covered by existing, not by someone
 * remembering to extend a constant. The read is a handful of lines under
 * `packages:` and deliberately not a YAML parser — that would be a dependency
 * bought for one list of globs, and the globs this repository uses are one level
 * deep.
 */
export function workspaceManifests(repoRoot: string): string[] {
  const manifests = ['package.json']
  let text: string
  try {
    text = readFileSync(path.join(repoRoot, 'pnpm-workspace.yaml'), 'utf8')
  } catch {
    return manifests
  }
  const globs: string[] = []
  let inPackages = false
  for (const line of text.split('\n')) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true
      continue
    }
    if (inPackages) {
      const item = /^\s+-\s+['"]?([^'"\s]+)['"]?\s*$/.exec(line)
      if (item !== null) globs.push(item[1])
      else if (/^\S/.test(line)) inPackages = false
    }
  }
  for (const glob of globs) {
    // `apps/*` and nothing more exotic. A pattern this repository does not use is
    // better skipped than half-implemented: a partially-expanded glob would
    // silently narrow what the check covers, which is the failure mode the whole
    // module exists to refuse.
    if (!glob.endsWith('/*')) continue
    const parent = glob.slice(0, -2)
    let entries: string[]
    try {
      entries = readdirSync(path.join(repoRoot, parent))
    } catch {
      continue
    }
    for (const entry of entries.sort()) {
      const rel = path.join(parent, entry, 'package.json')
      if (pathExists(path.join(repoRoot, rel))) manifests.push(rel)
    }
  }
  return manifests
}

function pathExists(p: string): boolean {
  try {
    statSync(p)
    return true
  } catch {
    return false
  }
}

function readJson(file: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
}

/** Every package name a manifest declares, across both dependency kinds. */
function declaredNames(manifestFile: string): string[] {
  const pkg = readJson(manifestFile)
  if (pkg === undefined) return []
  const names = new Set<string>()
  for (const key of ['dependencies', 'devDependencies']) {
    const block = pkg[key]
    if (block !== null && typeof block === 'object') {
      for (const name of Object.keys(block as Record<string, unknown>)) names.add(name)
    }
  }
  return [...names]
}

// -- the walk ----------------------------------------------------------------

/** The packages directly inside one `node_modules` directory, scope-aware. */
function packagesIn(scope: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(scope)
  } catch {
    return []
  }
  const out: string[] = []
  for (const entry of entries) {
    // `.pnpm` is the virtual store itself and `.bin` holds shims: neither is a
    // resolution an importer makes, and descending into the store directly is
    // precisely how an ORPHANED version would come to be counted as a live one.
    if (entry.startsWith('.')) continue
    if (entry.startsWith('@')) {
      try {
        for (const scoped of readdirSync(path.join(scope, entry))) out.push(`${entry}/${scoped}`)
      } catch {
        /* an unreadable scope directory contributes nothing */
      }
    } else {
      out.push(entry)
    }
  }
  return out
}

function realOrUndefined(p: string): string | undefined {
  try {
    return realpathSync(p)
  } catch {
    return undefined
  }
}

/** `name@version` from a package directory, falling back to its repo-relative path. */
function labelOf(dir: string, repoRoot: string): string {
  const pkg = readJson(path.join(dir, 'package.json'))
  if (typeof pkg?.name === 'string') {
    return `${pkg.name}@${typeof pkg.version === 'string' ? pkg.version : '?'}`
  }
  return path.relative(repoRoot, dir) || '.'
}

/** One `node_modules` directory, and the package whose dependencies it holds. */
interface Scope {
  dir: string
  owner: string
  /** The owner's own realpath — pnpm parks it beside its dependencies. */
  ownerDir?: string
}

/**
 * Walk the resolution graph from every workspace importer and report each
 * `workerd` it reaches.
 *
 * THE UNIT OF THE WALK IS A `node_modules` DIRECTORY, not a package directory,
 * because that is what pnpm's layout means. A package's dependencies are its
 * SIBLINGS — `wrangler` and the `workerd` it declares both sit in
 * `.pnpm/wrangler@<v>/node_modules/`, and Node finds the second by walking up
 * from the first. Looking under `wrangler/node_modules` instead finds nothing at
 * all, which reads exactly like a clean tree. The nested npm layout is followed
 * too, so neither shape is assumed.
 *
 * Breadth-first, canonicalised, and each scope visited once however many
 * dependants reach it. The visited set is bounded by the number of installed
 * packages, so this is a few hundred directory reads — which is the only reason
 * it can be an entry guard rather than something an operator has to remember to
 * run.
 */
export function scanWorkerd(repoRoot: string): WorkerdInstance[] {
  const found = new Map<string, WorkerdInstance>()
  const seen = new Set<string>()
  const queue: Scope[] = []

  const push = (dir: string, owner: string, ownerDir?: string): void => {
    const real = realOrUndefined(dir)
    if (real === undefined || seen.has(real)) return
    seen.add(real)
    queue.push({ dir: real, owner, ownerDir })
  }

  for (const manifest of workspaceManifests(repoRoot)) {
    const dir = path.join(repoRoot, path.dirname(manifest))
    push(path.join(dir, 'node_modules'), labelOf(dir, repoRoot), realOrUndefined(dir))
  }

  while (queue.length > 0) {
    const scope = queue.shift() as Scope
    for (const name of packagesIn(scope.dir)) {
      const real = realOrUndefined(path.join(scope.dir, name))
      if (real === undefined) continue
      // pnpm parks a package beside its own dependencies, so the scope holds the
      // owner as well. It is not a dependency of itself, and counting it would
      // attribute `workerd` to `workerd`.
      if (real === scope.ownerDir) continue

      if (name === WORKERD) {
        const runtime = readJson(path.join(real, 'package.json'))
        const version = typeof runtime?.version === 'string' ? runtime.version : 'unknown'
        found.set(`${version} ${scope.owner}`, { version, broughtBy: scope.owner })
        // Deliberately not a `continue`: the runtime is an ordinary node of the
        // graph and its own scope is walked below like any other.
      }

      const label = labelOf(real, repoRoot)
      // pnpm: the siblings around it. Guarded on the parent actually being a
      // `node_modules`, so a workspace link — which resolves into `packages/` —
      // never turns the walk loose on the repository itself.
      const siblings = name.includes('/') ? path.dirname(path.dirname(real)) : path.dirname(real)
      if (path.basename(siblings) === 'node_modules') push(siblings, label, real)
      // npm/yarn: nested underneath it.
      push(path.join(real, 'node_modules'), label, real)
    }
  }

  return [...found.values()].sort(
    (a, b) => a.version.localeCompare(b.version) || a.broughtBy.localeCompare(b.broughtBy),
  )
}

// -- the report --------------------------------------------------------------

export interface WorkerdOptions {
  /** Repo root — where `pnpm-workspace.yaml` and `node_modules/` live. */
  repoRoot: string
  /** Defaults to {@link scanWorkerd}. */
  scan?: WorkerdScan
}

/**
 * Probe the installed tree for runtime skew.
 *
 * ZERO COPIES IS NOT A FINDING. "Exactly one" is the invariant, but a tree with
 * no `workerd` at all is an UNINSTALLED tree, and [[REQ-44]] already reports that
 * exactly — naming the lockfile and `pnpm install` — where this one could only
 * say something confusing about a runtime nothing asked for. Two checks refusing
 * the same tree for different reasons is how an operator comes to fix the wrong
 * one first.
 */
export function checkWorkerd(opts: WorkerdOptions): WorkerdReport {
  const scanned = (opts.scan ?? scanWorkerd)(opts.repoRoot)
  const versions = [...new Set(scanned.map((i) => i.version))].sort()

  // The dependant's NAME, without the `@version` tail, because that is what a
  // manifest declares and the manifest is what the remedy asks to be edited.
  const byName = new Map<string, string[]>()
  for (const manifest of workspaceManifests(opts.repoRoot)) {
    for (const name of declaredNames(path.join(opts.repoRoot, manifest))) {
      byName.set(name, [...(byName.get(name) ?? []), manifest])
    }
  }

  const instances = scanned
    .map((i) => ({ ...i, declaredIn: byName.get(i.broughtBy.replace(/@[^@]*$/, '')) ?? [] }))
    // Grouped by version so the split reads as a table, and within a version the
    // rows an operator can actually edit come first.
    .sort(
      (a, b) =>
        a.version.localeCompare(b.version) ||
        (b.declaredIn.length > 0 ? 1 : 0) - (a.declaredIn.length > 0 ? 1 : 0) ||
        a.broughtBy.localeCompare(b.broughtBy),
    )

  const declared = new Set(instances.flatMap((i) => i.declaredIn))
  const manifests = workspaceManifests(opts.repoRoot).filter((m) => declared.has(m))
  return { ok: versions.length <= 1, versions, instances, manifests }
}

/**
 * The commands that open `.wrangler/state`, and are therefore the ones a skew
 * can damage.
 *
 * PER-COMMAND FOR [[REQ-44]]'s REASON, not as a nod to it: a gate on a verb that
 * cannot cause the fault is a refusal with no bearing on the work, and refusals
 * like that are the thing this family of checks was written to avoid. `1c
 * render`, `1c capture` and the structured-edit verbs read and write files; none
 * of them has a local store to poison.
 *
 * `fonts` is keyed WITH its subcommand because only two of its seven open a
 * store: `seed` writes the local R2 bucket and `mirror` seeds at its tail
 * ([[REQ-315]]), while `check`, `catalogue`, `doc`, `index` and `publish` read
 * files or talk to the R2 REST API. Gating the whole verb would block an
 * operator refreshing a catalogue on a runtime they are not about to run.
 */
export const WORKERD_GATED_COMMANDS: readonly string[] = [
  'builder',
  // `dev up` STARTS the builder, so the gate has to fire before it does ([[REQ-319]]).
  // Keyed with its subcommand for the same reason `fonts` is: `dev down` and `dev
  // reap` send signals and read `lsof`, and neither opens a store — gating the
  // whole verb would refuse to STOP a dev environment on a tree with a runtime
  // skew, which is the one moment stopping it is most useful.
  'dev up',
  // `dev restart` starts the builder again, so it opens the store for the same
  // reason `dev up` does ([[BUG-147]]) — and restarting one service is the moment
  // an operator is least likely to be thinking about runtime skew.
  'dev restart',
  // `dev serve` runs `wrangler dev` against the deployed snapshot ([[REQ-318]]),
  // which opens `.wrangler/state` — the environment holding the ONLY copy of the
  // dev data, which is what makes a one-way schema migration by the wrong
  // runtime unrecoverable rather than annoying.
  'dev serve',
  'fonts mirror',
  'fonts seed',
  'reset',
]

/** The gate key for a parsed command line — the verb, plus a subcommand where one selects a store. */
export function workerdGateKey(command: string, sub?: string): string {
  return sub !== undefined && WORKERD_GATED_COMMANDS.includes(`${command} ${sub}`)
    ? `${command} ${sub}`
    : command
}

/** The remedy, once the manifests agree. */
export const WORKERD_PIN_COMMAND = 'pnpm install'

/**
 * Refuse a store-opening command while more than one runtime resolves.
 *
 * A {@link CommandError} with `ENVIRONMENT`, so it exits 6 through the CLI's
 * existing failure contract, exactly as its two neighbours do and for the same
 * reason: the command and its input were both fine, and no way of re-forming the
 * request will help.
 *
 * The message prints the WHOLE table — every version and the package that
 * brought it — because the operator's next question is always "which one do I
 * change", and a refusal that says only "mismatch" makes them re-derive by hand
 * the exact table the check is already holding.
 */
export function assertOneWorkerd(
  command: string,
  opts?: { repoRoot?: string; scan?: WorkerdScan },
): void {
  if (!WORKERD_GATED_COMMANDS.includes(command)) return

  const repoRoot = opts?.repoRoot ?? process.cwd()
  const report = checkWorkerd({ repoRoot, scan: opts?.scan })
  if (report.ok) return

  const rows = report.instances.map(
    (i) =>
      `  - ${WORKERD} ${i.version} — brought by ${i.broughtBy}` +
      (i.declaredIn.length > 0 ? `, declared in ${i.declaredIn.join(', ')}` : ''),
  )
  const where =
    report.manifests.length > 0
      ? `They are declared in ${report.manifests.join(', ')}.`
      : "They are declared in this workspace's manifests."

  throw new CommandError({
    code: 'ENVIRONMENT',
    message:
      `'1c ${command}' cannot run: ${report.versions.length} versions of \`${WORKERD}\` ` +
      `resolve in this tree.\n${rows.join('\n')}\n` +
      "`.wrangler/state` is workerd's own store and workerd migrates that schema " +
      'forward silently the first time it opens it. Whichever version runs first ' +
      'upgrades the store; the other then fails inside SQLite naming an internal ' +
      'table (`_cf_ALARM`, `_mf_objects`) that no schema here owns, and there is no ' +
      'supported way back.',
    hint:
      `Pin \`wrangler\` and \`miniflare\` to exact versions that agree on one ${WORKERD}. ` +
      `${where} Then run \`${WORKERD_PIN_COMMAND}\` and retry.`,
  })
}
