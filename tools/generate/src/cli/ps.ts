import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DEFAULT_FILING_PORT } from './filing'

/**
 * `1c ps` — every server this project has running, with its pid, its port and
 * the directory it was started from ([[REQ-319]]).
 *
 * WHY A COMMAND EXISTS AT ALL. A sweep of the dev port band on the operator's
 * machine found ELEVEN listeners belonging to this repository. Three of them were
 * the dev environment; eight were zombies, four of them from `.xgd` worktrees
 * that had since been torn down. Nothing had ever reclaimed them and they had
 * plainly been accumulating for a long time — `filing.ts` picked 8790 over 8711
 * and 8712 precisely because those two were "routinely taken on a working
 * machine", and what had taken them was this repo's own strays. There was no view
 * of any of that: the table was built by hand with `lsof`.
 *
 * BUILT ON `lsof`, NOT `ps`. Measured rather than assumed: under the agent
 * sandbox `ps aux` returns ZERO lines, while `lsof -nP -iTCP -sTCP:LISTEN` works
 * and `lsof -a -p <pid> -d cwd -Fn` returns a usable working directory. A
 * `ps`-based implementation would serve the operator and be unusable by the agent
 * that produced four of the eight zombies — which is the condition that created
 * them in the first place. Nothing in this module invokes `ps`, and a UAT pins
 * that.
 *
 * THE CWD IS THE IDENTITY KEY, and that answers an existing objection rather
 * than walking past it. `reset.ts` deliberately rejects this mechanism: *"A
 * CONNECT, NOT A PID FILE OR A PROCESS SCAN. … A pid file can be stale; a process
 * scan matches another checkout's server, which is a different store entirely."*
 * That reasoning is correct for the question RESET asks — is something holding my
 * store open — and a connect is the right test for it. This asks a different
 * question — what is running here, and what would I stop — which a connect cannot
 * answer at all, because it yields no pid. Keying rows on the working directory
 * answers the objection head on: a listener whose cwd is another checkout is
 * reported as THAT checkout's and never as this one's. `1c reset`'s refusal test
 * is unchanged; the two probes coexist and neither replaces the other.
 *
 * IT RETURNS A VALUE AND RENDERS SEPARATELY, following `filingStatus` and its
 * stated reason. `bin/dev down` and `bin/dev reap` are this table's other readers
 * — one verifies the ports it asked to free really are free, the other decides
 * what is safe to kill — so a print-only survey could not have been written.
 */

/** Where a listener was started from, which is what decides whether it is ours. */
export type ListenerOrigin =
  /** cwd is this checkout, or under it. */
  | 'this-checkout'
  /**
   * cwd is ANOTHER CHECKOUT of this repository — an `.xgd` worktree of it, or the
   * main checkout when the question is asked from a worktree. Ours either way, and
   * reapable either way: a stray left behind in one checkout is this repository's
   * to reclaim from any of them.
   */
  | 'worktree'
  /** cwd is somewhere else entirely: a sibling project, or a deleted temp dir. */
  | 'sibling'
  /** `lsof` would not say. Reported as such rather than omitted. */
  | 'undeterminable'

/** A port this repository's tooling is known to bind, and what binds it. */
export interface KnownService {
  readonly port: number
  /** The short name `bin/dev` uses for the same service. */
  readonly name: string
  /** What starts it, for a row an operator has to act on. */
  readonly what: string
}

/**
 * The ports a constant in this repository names.
 *
 * ONE TABLE, AND IT IS THE REASON AN UNRECOGNISED ROW IS LEGIBLE. Four of the
 * eight zombies held ports nothing names (8712, 8722, 8733, 8795); those rows
 * still have to read as something an operator can act on, which means naming the
 * cwd and saying the service is unrecognised rather than dropping the row. An
 * unnamed listener inside this repo's tree is precisely what has never been
 * visible.
 *
 * `DEFAULT_FILING_PORT` IS IMPORTED rather than repeated, because that constant
 * already exists and two copies of a port number drift silently. The others have
 * no constant to import — 8788 is a literal in this CLI's `builder` case, 8787
 * lives in the public site's package script, 8799 in `bin/access-sim` and 8710 in
 * the reproduction console's server — and hunting them into one module would be a
 * refactor of four call sites this ticket has no business making. This table is
 * the single place that says what the band MEANS; making it the single place the
 * numbers are DECLARED is a separate step.
 */
export const KNOWN_SERVICES: readonly KnownService[] = [
  { port: 8710, name: 'repro-console', what: '`bin/repro-console`' },
  { port: 8787, name: 'public-site', what: '`pnpm dev:public`' },
  { port: 8788, name: 'builder', what: '`1c builder` / `pnpm dev:control`' },
  // The deployed local dev environment ([[REQ-318]]). A SEPARATE PORT from the
  // builder's on purpose (EPIC-16 §L1): the old path is retired in a later step,
  // and "proved first" means the two run side by side against the same store.
  { port: 8789, name: 'dev', what: '`1c dev serve` — the deployed dev snapshot' },
  { port: DEFAULT_FILING_PORT, name: 'filing', what: '`1c filing`' },
  { port: 8799, name: 'access-sim', what: '`bin/access-sim`' },
  { port: 24678, name: 'vite-hmr', what: "Vite's HMR channel" },
]

/**
 * The port ranges this survey reads.
 *
 * WHY A BAND AND NOT JUST THE KNOWN PORTS. Every one of the eight zombies held a
 * port no constant names, so a survey restricted to the known table would have
 * reported none of them — it would have shown the three services that were fine
 * and hidden the eight that were not. The band is 8700–8899 because that is where
 * every listener in the measured sweep sat, plus Vite's fixed HMR port, which is
 * nowhere near it.
 *
 * THE BAND IS THE WHOLE FILTER, INCLUDING FOR OUR OWN PROCESSES, and that is a
 * correction rather than a simplification. Reporting every listener whose cwd is
 * this checkout at ANY port sounds more thorough and is unusable: a live `wrangler
 * dev` holds a dozen ephemeral control sockets in the 49000–62000 range, all with
 * the app directory as their cwd, so the answer to "what is running here" arrived
 * buried under twenty rows of one server's own plumbing — and `reap` would have
 * offered to kill each of them. The band keeps both that and the machine's
 * unrelated furniture (an editor's language server, `ollama`, AirPlay) out. A
 * service of ours that binds outside it is [[REQ-318]]'s to add here, which is the
 * one place that decision is recorded.
 */
export const DEV_PORT_BAND: readonly (readonly [number, number])[] = [
  [8700, 8899],
  [24678, 24678],
]

/**
 * The port {@link KNOWN_SERVICES} names for `name`.
 *
 * SO `DEV_SERVICES` DOES NOT RESTATE THE NUMBERS. `bin/dev up` starts four of the
 * services in that table and has to know their ports; writing them down a second
 * time would be two constants for one fact, and the whole reason this table exists
 * is that scattered port literals drift silently. It THROWS on an unknown name
 * rather than returning a default, because a typo would otherwise become a service
 * started on port 0.
 */
export function knownPort(name: string): number {
  const found = KNOWN_SERVICES.find((k) => k.name === name)
  if (found === undefined) throw new Error(`No known service named '${name}'.`)
  return found.port
}

/** Is `port` inside {@link DEV_PORT_BAND}? */
export function inDevPortBand(port: number): boolean {
  return DEV_PORT_BAND.some(([from, to]) => port >= from && port <= to)
}

/** One listening socket, attributed. */
export interface DevListener {
  readonly pid: number
  readonly port: number
  /** `lsof`'s COMMAND column — `node`, `workerd`, `python3.1`. Truncated by lsof. */
  readonly command: string
  /** The address it is bound to, as `lsof` gives it: `127.0.0.1` or `*`. */
  readonly address: string
  /** The process's working directory, or `null` when `lsof` would not say. */
  readonly cwd: string | null
  readonly origin: ListenerOrigin
  /** `true` when {@link origin} is this checkout or a worktree of this repository. */
  readonly ours: boolean
  /** The {@link KNOWN_SERVICES} name for this port, or `null` when nothing names it. */
  readonly service: string | null
  /** Named in one of `bin/dev up`'s pidfiles — which is what `reap` spares. */
  readonly managed: boolean
  /** One line, ready to print. */
  readonly line: string
}

export interface DevProcessTable {
  /** Every attributed listener, ours first, then by port. */
  readonly listeners: readonly DevListener[]
  /** This checkout's root, which is what `this-checkout` was decided against. */
  readonly repoRoot: string
  /** The `.xgd` worktree parents a `worktree` row was matched under. */
  readonly worktreeBases: readonly string[]
  /** `false` when `lsof` could not be run at all; the table is then empty. */
  readonly probed: boolean
  /**
   * What this survey could not determine, one line each.
   *
   * IT REPORTS WHAT IT COULD NOT SEE. `lsof` will not return a cwd for a process
   * owned by another user, and a survey that silently omits what it cannot see
   * reads as "that is everything" when it is not.
   */
  readonly warnings: readonly string[]
}

/** How this module reaches `lsof`. The one external boundary, so the one seam. */
export type LsofRunner = (args: readonly string[]) => string

/**
 * Run `lsof`, treating "nothing matched" as an empty answer.
 *
 * `lsof` EXITS 1 WHEN IT MATCHED NOTHING, which is not a failure — it is the
 * answer "no such listener". `execFileSync` throws on any non-zero exit, so the
 * captured stdout is returned instead. An `lsof` that is genuinely absent has no
 * stdout to return and rethrows, which is the case {@link DevProcessTable.probed}
 * exists to report.
 */
export const lsof: LsofRunner = (args) => {
  try {
    return execFileSync('lsof', [...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
      maxBuffer: 16 * 1024 * 1024,
    })
  } catch (err) {
    const stdout = (err as { stdout?: unknown }).stdout
    if (typeof stdout === 'string') return stdout
    throw err
  }
}

/** How this module reaches `git`. Injectable for the same reason `lsof` is. */
export type GitRunner = (args: readonly string[]) => string

/** Run `git` in `cwd`, or return `''` when it cannot answer (not a repository). */
export const git: GitRunner = (args) => {
  try {
    return execFileSync('git', [...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
    })
  } catch {
    return ''
  }
}

/** A `-F` field record: the fields `lsof` emitted, keyed by their letter. */
interface LsofSocket {
  pid: number
  command: string
  name: string
}

/**
 * Parse `lsof -F` field output.
 *
 * FIELD OUTPUT, NOT COLUMNS. `lsof`'s human table pads and truncates, and a
 * command name with a space in it ("LM Studio Helper") splits a column-parsed row
 * into the wrong fields. `-F` emits one field per line, tagged by letter, and
 * carries process fields (`p`, `c`) until the next process — so a pid's command
 * applies to every socket beneath it.
 */
export function parseLsofSockets(out: string): LsofSocket[] {
  const sockets: LsofSocket[] = []
  let pid = 0
  let command = ''
  for (const raw of out.split('\n')) {
    if (raw.length === 0) continue
    const tag = raw[0]
    const value = raw.slice(1)
    if (tag === 'p') {
      pid = Number.parseInt(value, 10)
      // A process record resets the command: `lsof` re-emits `c` for each pid,
      // and carrying the previous one would mislabel a row if it ever did not.
      command = ''
    } else if (tag === 'c') {
      command = value
    } else if (tag === 'n') {
      if (Number.isInteger(pid) && pid > 0) sockets.push({ pid, command, name: value })
    }
  }
  return sockets
}

/** `127.0.0.1:8788` / `*:5000` / `[::1]:8080` → address and port. */
export function splitListenName(name: string): { address: string; port: number } | null {
  const at = name.lastIndexOf(':')
  if (at <= 0) return null
  const port = Number.parseInt(name.slice(at + 1), 10)
  if (!Number.isInteger(port) || port <= 0) return null
  return { address: name.slice(0, at), port }
}

/**
 * The path `lsof` would report for `p`, or `p` when it cannot be resolved.
 *
 * BECAUSE EVERY COMPARISON HERE IS A PATH PREFIX AND `lsof` ANSWERS IN REAL PATHS.
 * On macOS the system temp directory is `/var/folders/...`, a symlink to
 * `/private/var/folders/...`; a process started with the former as its cwd is
 * reported by `lsof` with the latter, and a prefix test between the two says the
 * listener is a stranger's. The same is true of any operator whose checkout sits
 * under a symlinked path. Resolving both sides once, here, is the whole fix.
 */
function realpathOrSelf(p: string): string {
  try {
    return fs.realpathSync(p)
  } catch {
    return p
  }
}

/** Is `child` `dir` itself, or inside it? */
function isUnder(child: string, dir: string): boolean {
  const rel = path.relative(dir, child)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

/** Every checkout of this repository this machine knows about, and where they sit. */
export interface RepoTopology {
  /** The checkout holding the shared `.git`, absolute. Empty when git cannot say. */
  readonly mainCheckout: string
  /** Directories an `.xgd` worktree of this repository can sit under. */
  readonly bases: readonly string[]
  /** Other checkouts of this repository — the main one, when you are not in it. */
  readonly checkouts: readonly string[]
}

/**
 * Where every checkout of this repository is.
 *
 * LEARNED FROM `git`, NOT GUESSED. `git worktree list --porcelain` names every
 * registered worktree, and the PARENT of those paths is the base XGD provisions
 * into. Taking the parent rather than the paths themselves is the whole point: a
 * worktree that has been torn down is no longer registered and no longer exists on
 * disk, but its dead server is still listening and still reports the path it was
 * started in — and four of the eight zombies arrived exactly that way. A rule keyed
 * on the base still recognises them.
 *
 * THE MAIN CHECKOUT IS IN THAT LIST TOO, AND ITS PARENT IS NOT A BASE. Reducing
 * every entry to its `dirname` indiscriminately produced
 * `/Users/martin/lagrangefoundry` — the directory the operator keeps every project
 * in — so the survey claimed each SIBLING REPOSITORY's server as this repo's own
 * and `reap` would have killed them. `--git-common-dir` names the main checkout's
 * `.git` wherever it is asked from, which is how the one entry that must not be
 * reduced to its parent is identified. It is then carried as a CHECKOUT instead:
 * asked from a worktree, the main checkout's strays are still this repository's to
 * reclaim, which is the same claim in the other direction.
 *
 * THE ORIGIN-DERIVED FALLBACK exists for the checkout that has no other worktree
 * registered at that moment. There would then be no base to learn, and a listener
 * from a pruned worktree would read as a sibling project's and never be reclaimed.
 * XGD's base is `~/.xgd/worktrees/<origin url with every character that is not a
 * letter, digit, dot or hyphen replaced by an underscore>`, which is cheap to
 * derive and costs nothing when it names a directory that does not exist.
 */
export function repoTopology(opts: {
  repoRoot: string
  env?: NodeJS.ProcessEnv
  git?: GitRunner
}): RepoTopology {
  const run = opts.git ?? git
  const env = opts.env ?? process.env
  const repoRoot = realpathOrSelf(opts.repoRoot)
  const bases = new Set<string>()
  const checkouts = new Set<string>()

  const commonDir = run([
    '-C',
    repoRoot,
    'rev-parse',
    '--path-format=absolute',
    '--git-common-dir',
  ])
    .split('\n')[0]
    .trim()
  const mainCheckout = commonDir === '' ? '' : realpathOrSelf(path.dirname(commonDir))
  if (mainCheckout !== '' && !isUnder(mainCheckout, repoRoot)) checkouts.add(mainCheckout)

  const accept = (base: string): void => {
    // BELT AND BRACES, because the cost of getting this wrong is a reaper that
    // kills another project's work: a candidate base that CONTAINS THE MAIN
    // CHECKOUT is, by construction, too broad to mean "a worktree of this
    // repository" — it is a directory somebody keeps projects in — whatever `git`
    // said about it.
    //
    // THE SAME TEST AGAINST `repoRoot` WOULD BE WRONG, and was, briefly. Asked from
    // inside a worktree, `repoRoot` IS under the base: that is what a worktree base
    // means, and rejecting it there made every sibling worktree read as a stranger's.
    if (mainCheckout !== '' && isUnder(mainCheckout, base)) return
    bases.add(realpathOrSelf(base))
  }

  for (const line of run(['-C', repoRoot, 'worktree', 'list', '--porcelain']).split('\n')) {
    if (!line.startsWith('worktree ')) continue
    const wt = realpathOrSelf(line.slice('worktree '.length).trim())
    if (wt === '' || isUnder(wt, repoRoot)) continue
    if (mainCheckout !== '' && isUnder(wt, mainCheckout)) continue
    accept(path.dirname(wt))
  }

  const home = env.HOME || os.homedir()
  for (const url of run(['-C', repoRoot, 'remote', 'get-url', 'origin']).split('\n')) {
    const trimmed = url.trim()
    if (trimmed === '') continue
    accept(path.join(home, '.xgd', 'worktrees', trimmed.replace(/[^A-Za-z0-9._-]+/g, '_')))
  }

  return { mainCheckout, bases: [...bases].sort(), checkouts: [...checkouts].sort() }
}

/** Which of the four classes a working directory falls into. */
export function classifyCwd(
  cwd: string | null,
  opts: { repoRoot: string; bases: readonly string[]; checkouts?: readonly string[] },
): ListenerOrigin {
  if (cwd === null || cwd === '') return 'undeterminable'
  if (isUnder(cwd, opts.repoRoot)) return 'this-checkout'
  if (opts.bases.some((base) => isUnder(cwd, base))) return 'worktree'
  if ((opts.checkouts ?? []).some((co) => isUnder(cwd, co))) return 'worktree'
  // DELIBERATELY NOT A FIFTH CLASS. A cwd under `/private/tmp` that no longer
  // exists is not a sibling project in any real sense, but it is not ours either,
  // and the only decision this classification drives is whether a reaper may kill
  // the process. A reaper that killed everything it could not recognise would be
  // the dangerous version; the cwd is printed, so the row stays readable.
  return 'sibling'
}

/**
 * Every process's working directory, in one `lsof` call.
 *
 * ONE CALL FOR EVERY PID rather than one per pid: the sweep can turn up forty
 * listeners and `lsof` is not fast to start. A pid that has exited between the
 * two calls simply has no row, which is the same fact as a pid whose cwd `lsof`
 * would not disclose — both arrive here as an absent entry and leave as
 * `undeterminable`.
 */
export function listenerCwds(pids: readonly number[], run: LsofRunner = lsof): Map<number, string> {
  const cwds = new Map<number, string>()
  if (pids.length === 0) return cwds
  const out = run(['-a', '-p', pids.join(','), '-d', 'cwd', '-Fn'])
  let pid = 0
  for (const raw of out.split('\n')) {
    if (raw.length === 0) continue
    if (raw[0] === 'p') pid = Number.parseInt(raw.slice(1), 10)
    else if (raw[0] === 'n' && Number.isInteger(pid) && pid > 0) cwds.set(pid, raw.slice(1))
  }
  return cwds
}

/**
 * What is running, attributed and classified.
 *
 * `managedPids` COMES FROM THE CALLER rather than being read here, because the
 * pidfiles belong to `bin/dev` and this module has no business knowing where that
 * writes them. It is the one fact this survey cannot observe: a listener is either
 * something `bin/dev up` started and is accountable for, or something nothing is.
 */
export function devProcessTable(opts: {
  repoRoot: string
  /** Pids `bin/dev up` recorded — the rows `reap` must spare. */
  managedPids?: readonly number[]
  lsof?: LsofRunner
  git?: GitRunner
  env?: NodeJS.ProcessEnv
}): DevProcessTable {
  const run = opts.lsof ?? lsof
  const managed = new Set(opts.managedPids ?? [])
  const repoRoot = realpathOrSelf(opts.repoRoot)
  const topology = repoTopology({ repoRoot, env: opts.env, git: opts.git })

  let sockets: LsofSocket[]
  try {
    sockets = parseLsofSockets(run(['-nP', '-iTCP', '-sTCP:LISTEN', '-Fpcn']))
  } catch (err) {
    return {
      listeners: [],
      repoRoot,
      worktreeBases: topology.bases,
      probed: false,
      warnings: [
        `  could not run lsof, so nothing could be surveyed — ${err instanceof Error ? err.message : String(err)}`,
      ],
    }
  }

  const parsed = sockets.flatMap((s) => {
    const split = splitListenName(s.name)
    return split === null ? [] : [{ ...s, ...split }]
  })
  // A SECOND `lsof` THAT FAILS IS A DEGRADED ANSWER, NOT A LOST ONE. The listen
  // sweep has already succeeded by this point, so throwing here would discard a
  // real table over the attribution half of it; every row becomes
  // `undeterminable` instead, which is the honest reading and is reported as such.
  let cwds: Map<number, string>
  let cwdFailure = ''
  try {
    cwds = listenerCwds([...new Set(parsed.map((p) => p.pid))], run)
  } catch (err) {
    cwds = new Map()
    cwdFailure = err instanceof Error ? err.message : String(err)
  }

  const seen = new Set<string>()
  const listeners: DevListener[] = []
  for (const p of parsed) {
    // A process listening on the same port over IPv4 AND IPv6 is ONE server, and
    // `lsof` reports it twice. Two rows for one service would inflate every count
    // this table exists to make trustworthy — and would offer `reap` the same
    // process twice.
    const key = `${p.pid}:${p.port}`
    if (seen.has(key)) continue
    seen.add(key)

    const cwd = cwds.get(p.pid) ?? null
    if (!inDevPortBand(p.port)) continue
    const origin = classifyCwd(cwd, {
      repoRoot,
      bases: topology.bases,
      checkouts: topology.checkouts,
    })
    const ours = origin === 'this-checkout' || origin === 'worktree'
    const service = KNOWN_SERVICES.find((k) => k.port === p.port)?.name ?? null
    listeners.push({
      pid: p.pid,
      port: p.port,
      command: p.command,
      address: p.address,
      cwd,
      origin,
      ours,
      service,
      managed: managed.has(p.pid),
      line: listenerLine({
        pid: p.pid,
        port: p.port,
        command: p.command,
        cwd,
        origin,
        service,
        managed: managed.has(p.pid),
      }),
    })
  }

  listeners.sort((a, b) => (a.ours === b.ours ? a.port - b.port : a.ours ? -1 : 1))

  const undeterminable = listeners.filter((l) => l.origin === 'undeterminable')
  const warnings: string[] = []
  if (cwdFailure !== '') warnings.push(`  could not read working directories — ${cwdFailure}`)
  if (undeterminable.length > 0) {
    warnings.push(
      `  ${undeterminable.length} listener(s) would not disclose a working directory ` +
        `(${undeterminable.map((l) => l.port).join(', ')}) — lsof will not answer for a ` +
        `process owned by another user, so whether any of these is this project's is unknown.`,
    )
  }
  return { listeners, repoRoot, worktreeBases: topology.bases, probed: true, warnings }
}

/**
 * The row layout, written once.
 *
 * BOTH THE HEADER AND THE ROWS READ THESE. They were two hand-counted strings and
 * drifted by a single space immediately, which is exactly the class of thing a
 * table is for.
 */
const COLUMNS: readonly (readonly [string, number])[] = [
  ['port', 6],
  ['pid', 8],
  ['proc', 12],
  ['service', 14],
  ['started', 9],
  ['where', 0],
]

/** The header `1c ps` prints above its rows. */
export const PROCESS_TABLE_HEADER = `  ${COLUMNS.map(([name, width]) => name.padEnd(width)).join('')}`

/** One row, as `1c ps` prints it. */
export function listenerLine(l: {
  pid: number
  port: number
  command: string
  cwd: string | null
  origin: ListenerOrigin
  service: string | null
  managed: boolean
}): string {
  const what =
    l.service === null
      ? 'unrecognised service'
      : (KNOWN_SERVICES.find((k) => k.name === l.service)?.what ?? l.service)
  const name = l.service ?? '?'
  const where =
    l.origin === 'this-checkout'
      ? 'this checkout'
      : l.origin === 'worktree'
        ? 'another checkout of this repo'
        : l.origin === 'sibling'
          ? 'another checkout or project'
          : 'undeterminable'
  const cells = [String(l.port), String(l.pid), l.command, name, l.managed ? 'bin/dev' : '-', where]
  return (
    `  ${cells.map((cell, i) => cell.padEnd(COLUMNS[i][1])).join('')}`.trimEnd() +
    `\n        ${what}${l.cwd === null ? '' : ` — ${l.cwd}`}`
  )
}

/**
 * The whole table, as `1c ps` prints it.
 *
 * OURS AND EVERYONE ELSE'S ARE SEPARATE SECTIONS, because the sweep found eleven
 * of this repo's own against six belonging to sibling projects, and conflating
 * those is how a reaper becomes dangerous. The sibling rows are here for
 * legibility — an operator looking for a port collision needs to see them — and
 * are never anything `bin/dev reap` will touch.
 */
export function formatProcessTable(table: DevProcessTable): string {
  if (!table.probed) {
    return `Could not survey the dev port band.\n${table.warnings.join('\n')}`
  }
  const ours = table.listeners.filter((l) => l.ours)
  const theirs = table.listeners.filter((l) => !l.ours)
  const strays = ours.filter((l) => !l.managed && l.service === null)
  const head = PROCESS_TABLE_HEADER

  const sections: string[] = []
  sections.push(
    ours.length === 0
      ? `Nothing of this project's is listening (${table.repoRoot}).`
      : `${ours.length} listener(s) belong to this project:\n${head}\n${ours.map((l) => l.line).join('\n')}`,
  )
  if (theirs.length > 0) {
    sections.push(
      `${theirs.length} listener(s) in the dev port band belong elsewhere — reported so a port ` +
        `collision is visible, never reaped:\n${head}\n${theirs.map((l) => l.line).join('\n')}`,
    )
  }
  if (strays.length > 0) {
    sections.push(
      `${strays.length} of this project's listeners are STRAYS: nothing names their port and no ` +
        `pidfile claims them. \`bin/dev reap --dry-run\` lists what it would stop.`,
    )
  }
  if (table.warnings.length > 0) sections.push(`Could not determine:\n${table.warnings.join('\n')}`)
  return sections.join('\n\n')
}
