import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { builderIsRunning as portAnswers } from './reset'
import {
  devProcessTable,
  formatProcessTable,
  type DevListener,
  type DevProcessTable,
  knownPort,
  listenerPidsOnPort,
  type GitRunner,
  type LsofRunner,
} from './ps'

/**
 * `bin/dev up` / `down` / `reap` — start the local dev environment, stop it, and
 * reclaim what stopping it could not reach ([[REQ-319]]).
 *
 * WHY A REAPER IS A FIRST-CLASS COMMAND RATHER THAN A TIDY-UP SCRIPT. A sweep of
 * the dev port band found three listeners that were the dev environment and EIGHT
 * that were this repository's zombies. Four of those eight were started in `.xgd`
 * worktrees that have since been torn down — and a torn-down worktree takes its
 * pidfile with it, so `down` could never have been run there. That is a permanent
 * condition of how this project is developed, not a bug to be fixed upstream, so
 * `reap` is not redundant with `down`: it is the half that can still act after the
 * bookkeeping has been deleted.
 *
 * `down` IS POLITE AND `reap` IS NOT, and that split is deliberate. `down` sends
 * SIGTERM to what its pidfiles name and then CHECKS — via the same `lsof` survey
 * `1c ps` prints, rather than by assuming the signal landed. A service that
 * ignores SIGTERM is therefore reported as a failure rather than silently left
 * running, and `down` removes the pidfile anyway so that `reap`, which escalates,
 * inherits it as a stray. Two commands, one of which can always finish the other's
 * job.
 *
 * REAP REPORTS WHAT IT COULD NOT KILL. A detached listener started from an agent
 * sandbox survives `kill -9` sent from inside that sandbox; only the operator can
 * stop those. A reaper that claimed success would be lying, and the operator would
 * go on believing the port was free.
 */

/** One service `bin/dev up` starts, and how. */
export interface DevService {
  /** Short name — the pidfile's stem and the {@link KNOWN_SERVICES} name. */
  readonly name: string
  readonly port: number
  /** argv, run from the repo root. */
  readonly argv: readonly string[]
  /** What it is for, for the report. */
  readonly what: string
}

/**
 * The dev environment, in start order.
 *
 * THE ORDER IS A DEPENDENCY ORDER, not a preference. `1c builder` starts a filing
 * listener of its own unless one is already answering, so filing goes first and
 * the builder then finds it rather than forking a second one whose lifetime
 * nothing records. `bin/access-sim` proxies to the builder, so it goes after.
 *
 * EACH ENTRY INVOKES THE EXISTING ENTRY POINT rather than reimplementing it.
 * `pnpm dev:public`, `1c builder`, `1c filing` and `bin/access-sim` all survive
 * this ticket untouched as operator entry points; `bin/dev up` is a fifth caller
 * of them, not a replacement for what they do.
 */
export const DEV_SERVICES: readonly DevService[] = [
  {
    name: 'filing',
    port: knownPort('filing'),
    argv: ['bin/1c', 'filing'],
    what: 'the loopback filing service the assistant reports defects through',
  },
  {
    name: 'builder',
    port: knownPort('builder'),
    argv: ['bin/1c', 'builder'],
    what: 'the builder — wrangler dev on apps/control-app',
  },
  {
    name: 'public-site',
    port: knownPort('public-site'),
    argv: ['pnpm', '--filter', '@1stcontact/public-site', 'dev'],
    what: 'the public site Worker',
  },
  {
    name: 'access-sim',
    port: knownPort('access-sim'),
    argv: ['bin/access-sim'],
    what: 'the Cloudflare Access simulator — sign in as a person on loopback',
  },
]

/**
 * Where the pidfiles and logs live.
 *
 * UNDER `storage/tmp`, WHICH IS ALREADY GITIGNORED AND ALREADY THE SCRATCH TREE.
 * A new top-level directory would need a new `.gitignore` entry and would be a
 * second answer to a question this repository has already answered. `1c reset`
 * does not touch it, which is correct: emptying the store has nothing to do with
 * what is running.
 */
export function devStateDir(repoRoot: string): string {
  return path.join(repoRoot, 'storage', 'tmp', 'dev')
}

/**
 * What `bin/dev up` recorded about a service it started.
 *
 * TWO PIDS, BECAUSE A SERVICE IS NOT ALWAYS THE PROCESS `up` SPAWNED. `1c builder`
 * starts `wrangler dev`, which forks `workerd`, and it is the GRANDCHILD that ends
 * up holding the port; `pnpm --filter … dev` has the same shape. Recording only
 * the spawned pid meant `down` signalled a wrapper and `1c ps` could not recognise
 * the listener as anything `bin/dev` had started ([[BUG-147]]). Both facts are
 * kept and each is used for what it is good for: the wrapper names the process
 * GROUP to signal, the listener names the process that is actually serving.
 */
export interface DevPidfile {
  readonly name: string
  /**
   * The pid `up` SPAWNED, and — because `up` spawns detached — the id of the
   * process group every descendant of it inherits.
   */
  readonly pid: number
  /**
   * The pid holding {@link port} when the port started answering, which is
   * `pid` itself for a service that is a single process (filing, access-sim).
   *
   * `null` MEANS NOT RESOLVED, WHICH IS NOT THE SAME AS "IT IS THE WRAPPER": a
   * pidfile written before the port answered, one written by an older version, or
   * an `lsof` that would not say all arrive here as `null`, and a reader must fall
   * back to {@link pid} rather than conclude anything from it.
   */
  readonly listenerPid: number | null
  readonly port: number
  readonly startedAt: string
  /** Where the service's output went, absolute. */
  readonly log: string
  /** The pidfile itself, absolute. Not persisted — it is where this was read from. */
  readonly file: string
}

/**
 * Read every pidfile.
 *
 * ONE FILE PER SERVICE, HOLDING JSON. A bare pid would not say which port it was
 * started on, and `down` has to verify THAT port rather than re-derive it from a
 * table that may have moved since. A malformed file — a crash mid-write — is
 * skipped rather than raised: the pid it would have named is then an unmanaged
 * listener, which is precisely the case `reap` exists for.
 */
export function readDevPidfiles(repoRoot: string): DevPidfile[] {
  const dir = devStateDir(repoRoot)
  let names: string[]
  try {
    names = fs.readdirSync(dir).filter((n) => n.endsWith('.pid'))
  } catch {
    return []
  }
  const records: DevPidfile[] = []
  for (const name of names.sort()) {
    const file = path.join(dir, name)
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>
      if (typeof raw.pid !== 'number' || typeof raw.port !== 'number') continue
      records.push({
        name: typeof raw.name === 'string' ? raw.name : path.basename(name, '.pid'),
        pid: raw.pid,
        listenerPid: typeof raw.listenerPid === 'number' ? raw.listenerPid : null,
        port: raw.port,
        startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : '',
        log: typeof raw.log === 'string' ? raw.log : '',
        file,
      })
    } catch {
      continue
    }
  }
  return records
}

/**
 * Record a started service.
 *
 * `listenerPid` IS OPTIONAL BECAUSE `up` WRITES TWICE. The first write happens the
 * moment the child exists, so a crash while waiting for the port still leaves the
 * spawned pid recorded; the second happens once the port answers and the process
 * holding it can be asked for. Omitted is recorded as `null` — not resolved.
 */
export function writeDevPidfile(
  repoRoot: string,
  rec: Omit<DevPidfile, 'file' | 'listenerPid'> & { listenerPid?: number | null },
): string {
  const dir = devStateDir(repoRoot)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${rec.name}.pid`)
  fs.writeFileSync(file, `${JSON.stringify({ listenerPid: null, ...rec }, null, 2)}\n`)
  return file
}

/** Forget a service. Absent is success: the point is that it is not recorded. */
export function removeDevPidfile(repoRoot: string, name: string): void {
  fs.rmSync(path.join(devStateDir(repoRoot), `${name}.pid`), { force: true })
}

/**
 * Every pid a pidfile names — the process `up` spawned, and the one holding the
 * port when they are not the same process.
 *
 * WRITTEN ONCE BECAUSE TWO READERS NEED THE SAME ANSWER. `1c ps` matches a
 * LISTENER's pid against this set to decide whether a row is something `bin/dev`
 * started, and `down` tests both for liveness before it decides a service has
 * already gone. Either one reading `pid` alone is the [[BUG-147]] defect.
 */
export function devPidfilePids(rec: DevPidfile): number[] {
  return rec.listenerPid === null || rec.listenerPid === rec.pid ? [rec.pid] : [rec.pid, rec.listenerPid]
}

/** Does this pid still exist? Signal 0 asks without delivering anything. */
export function pidAlive(pid: number, kill: KillFn = process.kill.bind(process)): boolean {
  try {
    kill(pid, 0)
    return true
  } catch (err) {
    // EPERM means it exists and belongs to somebody else — which is still "alive",
    // and is exactly the case a reaper has to be able to report honestly.
    return (err as { code?: string }).code === 'EPERM'
  }
}

/** How this module signals a process. The seam every kill goes through. */
export type KillFn = (pid: number, signal: number | string) => void

/** The shared plumbing every verb here resolves against. */
export interface DevContext {
  repoRoot: string
  kill?: KillFn
  lsof?: LsofRunner
  git?: GitRunner
  /** Injected for the same reason `lsof` is: it is a syscall, not our code. */
  answers?: (port: number) => Promise<boolean>
  /** Who holds a port. The same boundary as `lsof`, and injected for that reason. */
  listenerPids?: (port: number) => number[]
  /** Seam for tests that must not wait in real time. */
  sleep?: (ms: number) => Promise<void>
  /** The table of services, when it is not {@link DEV_SERVICES}. */
  services?: readonly DevService[]
  /**
   * Service NAMES this call is restricted to, or `undefined` for all of them.
   *
   * SO ONE SERVICE CAN BE RESTARTED ([[BUG-147]]). An env-file change only takes
   * effect on a process started after it, and an operator who can only stop the
   * whole environment cannot act on that — while `reap`, the other way to reach a
   * single stale listener, takes every unmanaged listener in the project with it.
   */
  only?: readonly string[]
}

const realSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** The services this call is about — {@link DevContext.only} applied, or all of them. */
export function devSelection(ctx: DevContext): readonly DevService[] {
  const all = ctx.services ?? DEV_SERVICES
  const only = ctx.only
  return only === undefined ? all : all.filter((s) => only.includes(s.name))
}

/**
 * The survey `1c ps` prints, with this repo's pidfiles folded in.
 *
 * EVERY PID A PIDFILE NAMES IS MANAGED, not just the spawned one. `devProcessTable`
 * matches a LISTENER's pid against this set, and for the builder and the public
 * site the listener is a grandchild of what `up` spawned — so passing only `pid`
 * made `1c ps` report a service `up` had started as belonging to nobody, which is
 * the signal an operator reads before reaching for `reap` ([[BUG-147]]).
 */
export function devTable(ctx: DevContext): DevProcessTable {
  return devProcessTable({
    repoRoot: ctx.repoRoot,
    managedPids: readDevPidfiles(ctx.repoRoot).flatMap(devPidfilePids),
    lsof: ctx.lsof,
    git: ctx.git,
  })
}

// ── up ───────────────────────────────────────────────────────────────────────

/**
 * The deploy the dev environment is supposed to be fed by ([[REQ-318]]).
 *
 * `bin/dev up` DELEGATES THIS ENTIRELY and owns none of it. [[REQ-318]] builds
 * `bin/deploy --env dev` — the snapshot, the migrate hook against the local
 * store, the same hooks in the same order as a cloud deploy — and the whole of
 * this step is to call it. Reimplementing any of it here would be the second code
 * path that ticket exists to avoid.
 *
 * IT IS SKIPPED, LOUDLY, UNTIL THAT TARGET EXISTS. `[env.dev]` is not in
 * `apps/control-app/wrangler.toml` yet, so `bin/deploy --env dev` fails with *"No
 * environment found in configuration with name 'dev'"*. Running it anyway would
 * make `bin/dev up` unusable until a sibling ticket lands, for no gain; saying so
 * in one line and starting the services against the existing store is what the
 * operator can actually use today. The condition is the presence of the
 * environment, so nothing needs changing here when REQ-318 lands.
 */
export interface DevDeployStep {
  readonly ran: boolean
  readonly ok: boolean
  readonly line: string
}

export function devDeploy(opts: {
  repoRoot: string
  run?: (argv: readonly string[], cwd: string) => void
  readWrangler?: (p: string) => string
}): DevDeployStep {
  const tomlPath = path.join(opts.repoRoot, 'apps', 'control-app', 'wrangler.toml')
  const read = opts.readWrangler ?? ((p: string) => fs.readFileSync(p, 'utf8'))
  let toml: string
  try {
    toml = read(tomlPath)
  } catch {
    toml = ''
  }
  if (!/^\[env\.dev\]/m.test(toml)) {
    return {
      ran: false,
      ok: true,
      line:
        '  deploy: SKIPPED — apps/control-app/wrangler.toml has no [env.dev], so there is no\n' +
        "          local deploy target to ship to yet (that is REQ-318's). The services below\n" +
        '          are started against the store they already read.',
    }
  }
  const run =
    opts.run ??
    ((argv: readonly string[], cwd: string): void => {
      execFileSync(argv[0], [...argv.slice(1)], { cwd, stdio: 'inherit', timeout: 30 * 60_000 })
    })
  try {
    run(['bin/deploy', '--env', 'dev'], opts.repoRoot)
    return { ran: true, ok: true, line: '  deploy: bin/deploy --env dev completed' }
  } catch (err) {
    return {
      ran: true,
      ok: false,
      line: `  deploy: FAILED — bin/deploy --env dev: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

export interface DevStarted {
  readonly name: string
  /** The process `up` spawned. */
  readonly pid: number
  /** The process found holding {@link port}, or `null` when `lsof` would not say. */
  readonly listenerPid: number | null
  readonly port: number
  readonly log: string
}

export interface DevUpOutcome {
  readonly deploy: DevDeployStep
  readonly started: readonly DevStarted[]
  /** Already answering when `up` looked — left alone rather than duplicated. */
  readonly alreadyUp: readonly { name: string; port: number }[]
  /** Spawned, but the port never answered. */
  readonly failed: readonly { name: string; port: number; detail: string }[]
  readonly ok: boolean
}

/**
 * Start the dev environment and record what was started.
 *
 * A SERVICE THAT IS ALREADY ANSWERING IS NOT AN ERROR AND IS NOT RESTARTED,
 * following `1c filing`'s own reason: two of them would fight over one port and
 * the second would lose, so the useful thing to say is that the first is doing
 * the job. No pidfile is written for it — `up` did not start it and cannot claim
 * to know how to stop it, and `reap` is the command for a listener nothing owns.
 *
 * DETACHED, WITH OUTPUT TO A FILE. `up` has to return to the operator's prompt,
 * so each child is its own process group with its stdio on a log rather than on a
 * terminal that is about to go away.
 */
export async function devUp(
  ctx: DevContext & {
    /** Per-service budget for the port to start answering. */
    timeoutMs?: number
    deploy?: DevDeployStep
  },
): Promise<DevUpOutcome> {
  const services = devSelection(ctx)
  const answers = ctx.answers ?? ((port: number) => portAnswers(port))
  const listeners = ctx.listenerPids ?? ((port: number) => listenerPidsOnPort(port))
  const sleep = ctx.sleep ?? realSleep
  const timeoutMs = ctx.timeoutMs ?? 60_000
  const deploy = ctx.deploy ?? devDeploy({ repoRoot: ctx.repoRoot })

  const started: DevStarted[] = []
  const alreadyUp: { name: string; port: number }[] = []
  const failed: { name: string; port: number; detail: string }[] = []

  const logDir = devStateDir(ctx.repoRoot)
  fs.mkdirSync(logDir, { recursive: true })

  for (const service of services) {
    if (await answers(service.port)) {
      alreadyUp.push({ name: service.name, port: service.port })
      continue
    }
    const log = path.join(logDir, `${service.name}.log`)
    let pid: number | undefined
    try {
      const fd = fs.openSync(log, 'a')
      const child = spawn(service.argv[0], [...service.argv.slice(1)], {
        cwd: ctx.repoRoot,
        detached: true,
        stdio: ['ignore', fd, fd],
      })
      fs.closeSync(fd)
      child.unref()
      pid = child.pid
    } catch (err) {
      failed.push({
        name: service.name,
        port: service.port,
        detail: `could not spawn ${service.argv.join(' ')} — ${err instanceof Error ? err.message : String(err)}`,
      })
      continue
    }
    if (pid === undefined) {
      failed.push({ name: service.name, port: service.port, detail: 'spawned with no pid' })
      continue
    }
    const startedAt = new Date().toISOString()
    writeDevPidfile(ctx.repoRoot, { name: service.name, pid, port: service.port, startedAt, log })
    const up = await waitForPort(service.port, timeoutMs, answers, sleep)
    if (up) {
      // THE PORT ANSWERING IS THE MOMENT THE LISTENER CAN BE ASKED FOR, and the
      // only moment: before it there is nothing holding the socket, and `up` has
      // just waited for exactly this. The pidfile is rewritten rather than written
      // once, so that a service that never answers still leaves the spawned pid
      // behind for `reap` to find ([[BUG-147]]).
      const listenerPid = chooseListenerPid(listeners(service.port), pid)
      writeDevPidfile(ctx.repoRoot, {
        name: service.name,
        pid,
        listenerPid,
        port: service.port,
        startedAt,
        log,
      })
      started.push({ name: service.name, pid, listenerPid, port: service.port, log })
    } else
      failed.push({
        name: service.name,
        port: service.port,
        // THE LOG IS NAMED IN THE FAILURE, because a service that was spawned and
        // never answered has already written the reason somewhere, and the
        // operator's next question is where.
        detail: `spawned as pid ${pid} but nothing answered on ${service.port} within ${Math.round(timeoutMs / 1000)}s — see ${log}`,
      })
  }

  return { deploy, started, alreadyUp, failed, ok: deploy.ok && failed.length === 0 }
}

/**
 * Which of the pids on a port to record as THE listener.
 *
 * PREFER ONE THAT IS NOT THE WRAPPER, because that is the whole point: for the
 * builder and the public site the process `up` spawned does not hold the socket,
 * and the pid worth recording is the descendant that does. When the wrapper IS the
 * listener — filing and access-sim are single node processes — recording it says
 * so explicitly, which is a different fact from `null`'s "nobody could be asked".
 */
function chooseListenerPid(pids: readonly number[], wrapper: number): number | null {
  const other = pids.find((pid) => pid !== wrapper)
  if (other !== undefined) return other
  return pids.includes(wrapper) ? wrapper : null
}

/** Poll until `port` answers, or the budget runs out. */
async function waitForPort(
  port: number,
  timeoutMs: number,
  answers: (port: number) => Promise<boolean>,
  sleep: (ms: number) => Promise<void>,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (await answers(port)) return true
    if (Date.now() >= deadline) return false
    await sleep(300)
  }
}

/**
 * The pids of one service, as a report reads them.
 *
 * BOTH, WHEN THEY DIFFER, because an operator looking at a stuck builder has to be
 * able to see that the thing holding the port is not the thing `up` spawned — that
 * is the whole of [[BUG-147]], and a report that named one number could not show
 * it. One number when the service is a single process, which is most of them.
 */
function describePids(rec: { pid: number; listenerPid: number | null }): string {
  return rec.listenerPid === null || rec.listenerPid === rec.pid
    ? `pid ${rec.pid}`
    : `pid ${rec.pid} → listener ${rec.listenerPid}`
}

export function formatUp(outcome: DevUpOutcome): string {
  const lines: string[] = [outcome.deploy.line]
  for (const s of outcome.started)
    lines.push(`  started  ${s.name.padEnd(12)} ${s.port}  ${describePids(s)}  → ${s.log}`)
  for (const a of outcome.alreadyUp)
    lines.push(
      `  already  ${a.name.padEnd(12)} ${a.port}  something was answering, so it was left alone` +
        ` (\`1c ps\` says whose it is)`,
    )
  for (const f of outcome.failed) lines.push(`  FAILED   ${f.name.padEnd(12)} ${f.port}  ${f.detail}`)
  return (
    `${outcome.ok ? 'The dev environment is up.' : 'The dev environment did not come up.'}\n` +
    `${lines.join('\n')}\n\n` +
    `\`1c ps\` lists what is running; \`bin/dev down\` stops it and \`bin/dev restart <service>\`\n` +
    `stops and starts one of them — which is what an env-file change needs, since it only\n` +
    `takes effect on a process started after it.`
  )
}

// ── down ─────────────────────────────────────────────────────────────────────

export interface DevDownOutcome {
  readonly stopped: readonly DevPidfile[]
  /** Recorded, but the process had already gone — a stale pidfile. */
  readonly alreadyStopped: readonly DevPidfile[]
  /**
   * Ports `down` was asked to free that are STILL answering.
   *
   * THIS IS THE REASON `down` VERIFIES INSTEAD OF ASSUMING. A SIGTERM a service
   * ignores looks identical to one it obeyed, and a `down` that reported success
   * either way would leave the operator certain the port was free.
   */
  readonly stillListening: readonly DevListener[]
  readonly ok: boolean
}

/**
 * Stop everything the pidfiles name, then check the ports really are free.
 *
 * SIGTERM ONLY, AND NO ESCALATION. `reap` is the command that escalates; if
 * `down` sent SIGKILL there would be no state in which the backstop was reachable
 * and the split between the two would be decoration. What `down` does instead is
 * REMOVE the pidfile for anything it could not stop, which hands that process to
 * `reap` as an unmanaged stray — the one thing `reap` is guaranteed to act on.
 */
export async function devDown(ctx: DevContext): Promise<DevDownOutcome> {
  const kill = ctx.kill ?? process.kill.bind(process)
  const sleep = ctx.sleep ?? realSleep
  const only = ctx.only
  const records = readDevPidfiles(ctx.repoRoot).filter((r) => only === undefined || only.includes(r.name))
  const stopped: DevPidfile[] = []
  const alreadyStopped: DevPidfile[] = []

  // REVERSE START ORDER: access-sim proxies to the builder and the builder talks to
  // filing, so the dependents go down first and nothing spends its last moments
  // reporting that its upstream has vanished.
  for (const rec of [...records].reverse()) {
    if (stopService(rec, kill)) stopped.push(rec)
    else alreadyStopped.push(rec)
    removeDevPidfile(ctx.repoRoot, rec.name)
  }

  const ports = new Set(records.map((r) => r.port))
  // A NAMED SERVICE'S PORT IS VERIFIED WHETHER OR NOT A PIDFILE CLAIMED IT.
  // `bin/dev down builder` is half of a restart, and the question that half has to
  // answer is whether the port is free — not whether a file happened to name it.
  // Unnamed, the behaviour is unchanged: with nothing recorded there is nothing to
  // verify and no `lsof` is run.
  if (only !== undefined) for (const service of devSelection(ctx)) ports.add(service.port)
  if (ports.size > 0) await sleep(700)
  const table = ports.size > 0 ? devTable(ctx) : null
  const stillListening = (table?.listeners ?? []).filter((l) => l.ours && ports.has(l.port))

  return {
    stopped,
    alreadyStopped,
    stillListening,
    ok: stillListening.length === 0,
  }
}

/**
 * SIGTERM one service — the process GROUP, not just the pid.
 *
 * `up` SPAWNS WITH `detached: true`, WHICH MAKES THE SPAWNED PROCESS A GROUP
 * LEADER, and for the builder and the public site the listener is a grandchild
 * inside that group. `kill(pid, …)` signals the leader alone, after which whether
 * `workerd` dies is wrangler's signal propagation — something `down` neither
 * controls nor verifies, and which was measurably not happening ([[BUG-147]]).
 * `kill(-pid, …)` signals every member, which is the only call that reaches the
 * process actually serving.
 *
 * A NEGATIVE PID CANNOT REACH A GROUP THIS DID NOT START. A process group's id is
 * its leader's pid, so `kill(-P)` either finds the group led by P — the process
 * `up` spawned — or finds nothing and throws. It cannot land on some unrelated
 * group even when the pidfile is stale and P has been recycled.
 *
 * THE RECORDED LISTENER IS SIGNALLED TOO WHEN IT IS NOT THE LEADER. A group signal
 * reaches it in every arrangement measured, but a descendant that called `setsid`
 * for itself would be outside the group and nothing here can ask which — so the pid
 * the port resolved to gets its own SIGTERM. `down` is polite either way: a second
 * SIGTERM is not an escalation, and `reap` remains the only thing that escalates.
 */
function stopService(rec: DevPidfile, kill: KillFn): boolean {
  const alive = devPidfilePids(rec).filter((pid) => pidAlive(pid, kill))
  if (alive.length === 0) return false
  let signalled = false
  try {
    kill(-rec.pid, 'SIGTERM')
    signalled = true
  } catch {
    // No such group: the leader has gone and taken the group's identity with it.
    // Whatever is left of the service is signalled by pid below.
  }
  for (const pid of alive) {
    if (signalled && pid === rec.pid) continue
    try {
      kill(pid, 'SIGTERM')
      signalled = true
    } catch {
      // It went away between the liveness test and the signal, which is the
      // outcome being asked for.
    }
  }
  return signalled
}

export function formatDown(outcome: DevDownOutcome): string {
  const lines: string[] = []
  for (const s of outcome.stopped) lines.push(`  stopped  ${s.name.padEnd(12)} ${s.port}  ${describePids(s)}`)
  for (const s of outcome.alreadyStopped)
    lines.push(`  gone     ${s.name.padEnd(12)} ${s.port}  ${describePids(s)} was already not running`)
  if (lines.length === 0) lines.push('  nothing was recorded as running.')
  if (outcome.ok) return `The dev environment is down.\n${lines.join('\n')}`
  return (
    `The dev environment is NOT fully down.\n${lines.join('\n')}\n\n` +
    `Still answering:\n${outcome.stillListening.map((l) => l.line).join('\n')}\n\n` +
    `\`bin/dev down <service>\` retries one of them — the whole process group this time,\n` +
    `so a listener that is a grandchild of what \`up\` spawned is included. Their pidfiles\n` +
    `have been removed, so \`bin/dev reap --dry-run\` also lists them and \`bin/dev reap\`\n` +
    `escalates to SIGKILL — which takes every unmanaged listener in the project with it.`
  )
}

// ── restart ──────────────────────────────────────────────────────────────────

/**
 * The deploy line for a call that is about processes rather than the environment.
 *
 * `restart` DEPLOYS NOTHING, and says so rather than silently skipping. It exists
 * because an env file changed and the process reading it has to be replaced; running
 * [[REQ-318]]'s `bin/deploy --env dev` on the way would rebuild a snapshot nobody
 * asked about, and for a single named service it would rebuild the whole environment
 * to restart one process. `bin/dev up` is where a deploy belongs.
 */
export function devDeploySkipped(reason: string): DevDeployStep {
  return { ran: false, ok: true, line: `  deploy: SKIPPED — ${reason}` }
}

export interface DevRestartOutcome {
  readonly down: DevDownOutcome
  /** `null` when `down` left a port answering, because nothing was started. */
  readonly up: DevUpOutcome | null
  readonly ok: boolean
}

/**
 * Stop the selected services, then start them again.
 *
 * COMPOSED FROM THE TWO VERBS AND OWNING NO MECHANISM OF ITS OWN, because the
 * operator's need is not a third behaviour — it is *"the environment changed,
 * restart what reads it"*, which had no spelling at all ([[BUG-147]]) and which an
 * env-file change makes unavoidable, since a new value only reaches a process
 * started after it. Spelling the sequence as one verb is the whole contribution;
 * reimplementing either half would be a second code path.
 *
 * IT REFUSES TO START WHEN `down` LEFT A PORT ANSWERING. `up`'s rule for a live
 * port is to leave it alone, so starting anyway would report the process that
 * would not stop as `already answering, left alone` — which is exactly the silent
 * carry-over that made this defect invisible. Reporting a failed `down` and
 * starting nothing is the honest answer, and `1c ps` then says whose the port is.
 */
export async function devRestart(
  ctx: DevContext & { timeoutMs?: number; deploy?: DevDeployStep },
): Promise<DevRestartOutcome> {
  const down = await devDown(ctx)
  if (!down.ok) return { down, up: null, ok: false }
  const up = await devUp({
    ...ctx,
    deploy: ctx.deploy ?? devDeploySkipped('`restart` replaces processes; `bin/dev up` is what deploys'),
  })
  return { down, up, ok: up.ok }
}

export function formatRestart(outcome: DevRestartOutcome): string {
  if (outcome.up === null) {
    return (
      `${formatDown(outcome.down)}\n\n` +
      `Nothing was started: a port that is still answering would be read as \`already up\`,\n` +
      `leaving the process that would not stop in place and reporting it as fine.`
    )
  }
  return `${formatDown(outcome.down)}\n\n${formatUp(outcome.up)}`
}

// ── reap ─────────────────────────────────────────────────────────────────────

export interface DevReapOutcome {
  readonly dryRun: boolean
  /** Ours, and claimed by no pidfile. Exactly what a non-dry run would kill. */
  readonly targets: readonly DevListener[]
  readonly killed: readonly DevListener[]
  /** Signalled and still listening. Named, because claiming success would be a lie. */
  readonly survived: readonly { listener: DevListener; detail: string }[]
  /** Not ours. Reported for legibility, never killed, however stray they look. */
  readonly spared: readonly DevListener[]
  readonly ok: boolean
}

/**
 * Reclaim every listener of this repository's that no pidfile claims.
 *
 * THE CWD DECIDES, AND THAT IS WHAT MAKES THIS SAFE. A listener is reapable only
 * when its working directory is this checkout or an `.xgd` worktree of this
 * repository. The sweep that motivated this found eleven of ours against six
 * belonging to sibling projects; conflating the two is how a reaper becomes a
 * thing nobody dares run, so the siblings are reported and never touched.
 *
 * A KNOWN-PORT LISTENER IS STILL A TARGET when no pidfile claims it, which is
 * worth stating because it includes an operator's own `pnpm dev`. That is the rule
 * the ticket asks for and it is the only rule that can reclaim the four zombies
 * whose worktrees are gone; `--dry-run` is how you find out before it happens,
 * and every row names its service so a recognised one is obvious in the preview.
 */
export async function devReap(ctx: DevContext & { dryRun?: boolean }): Promise<DevReapOutcome> {
  const dryRun = ctx.dryRun === true
  const kill = ctx.kill ?? process.kill.bind(process)
  const sleep = ctx.sleep ?? realSleep
  const table = devTable(ctx)

  // NEVER THIS PROCESS. `1c ps` is run from inside the repository, so the CLI's own
  // pid is a candidate the moment anything it started is listening on its behalf —
  // and a reaper whose first act is suicide reports nothing at all.
  const self = new Set<number>([process.pid, process.ppid])
  const targets = table.listeners.filter((l) => l.ours && !l.managed && !self.has(l.pid))
  const spared = table.listeners.filter((l) => !l.ours)

  if (dryRun || targets.length === 0) {
    return { dryRun, targets, killed: [], survived: [], spared, ok: true }
  }

  const signal = (pid: number, sig: string): string | null => {
    try {
      kill(pid, sig)
      return null
    } catch (err) {
      const code = (err as { code?: string }).code
      // ESRCH is success: it is already gone. Anything else is a reason it stayed.
      return code === 'ESRCH' ? null : `${sig} refused (${code ?? 'unknown'})`
    }
  }

  const refusals = new Map<number, string>()
  for (const t of targets) {
    const why = signal(t.pid, 'SIGTERM')
    if (why !== null) refusals.set(t.pid, why)
  }
  await sleep(700)

  // ESCALATE ONLY WHAT IS STILL THERE, re-read rather than assumed: a process that
  // obeyed SIGTERM must not be sent SIGKILL, because its pid may by then belong to
  // something else entirely.
  let alive = new Set(devTable(ctx).listeners.map((l) => `${l.pid}:${l.port}`))
  for (const t of targets) {
    if (!alive.has(`${t.pid}:${t.port}`)) continue
    const why = signal(t.pid, 'SIGKILL')
    if (why !== null) refusals.set(t.pid, why)
  }
  await sleep(700)
  alive = new Set(devTable(ctx).listeners.map((l) => `${l.pid}:${l.port}`))

  const killed: DevListener[] = []
  const survived: { listener: DevListener; detail: string }[] = []
  for (const t of targets) {
    if (!alive.has(`${t.pid}:${t.port}`)) {
      killed.push(t)
      continue
    }
    survived.push({
      listener: t,
      detail:
        refusals.get(t.pid) ??
        'still listening after SIGTERM and SIGKILL — a detached process started from an ' +
          'agent sandbox survives a kill sent from inside it, and only the operator can stop it',
    })
  }

  return { dryRun, targets, killed, survived, spared, ok: survived.length === 0 }
}

export function formatReap(outcome: DevReapOutcome): string {
  const sections: string[] = []
  if (outcome.targets.length === 0) {
    sections.push('Nothing to reap: every listener of this project\'s is claimed by a pidfile.')
  } else if (outcome.dryRun) {
    sections.push(
      `Would stop ${outcome.targets.length} listener(s) — nothing was killed:\n` +
        outcome.targets.map((l) => l.line).join('\n'),
    )
  } else {
    if (outcome.killed.length > 0) {
      sections.push(`Killed ${outcome.killed.length}:\n${outcome.killed.map((l) => l.line).join('\n')}`)
    }
    if (outcome.survived.length > 0) {
      sections.push(
        `COULD NOT KILL ${outcome.survived.length}:\n` +
          outcome.survived.map((s) => `${s.listener.line}\n        ${s.detail}`).join('\n'),
      )
    }
  }
  if (outcome.spared.length > 0) {
    sections.push(
      `Spared ${outcome.spared.length} listener(s) that are not this project's — reported so a ` +
        `port collision is visible, never reaped:\n${outcome.spared.map((l) => l.line).join('\n')}`,
    )
  }
  return sections.join('\n\n')
}

/** Re-exported so `1c ps` and `bin/dev` render one table through one function. */
export { formatProcessTable }
