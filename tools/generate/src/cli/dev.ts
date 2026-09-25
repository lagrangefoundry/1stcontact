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
 * nothing records. `bin/access-sim` proxies to whichever server it fronts, so it
 * goes last — and since REQ-322 that server is `1c dev serve`, which therefore
 * has to be started before it.
 *
 * BOTH SERVERS, NOT ONE ([[REQ-322]], EPIC-16 §L1). `1c dev serve` runs the
 * DEPLOYED snapshot and `1c builder` watches the source tree, on two ports the
 * {@link KNOWN_SERVICES} table names; §L1 requires the old path to keep working
 * until the replacement is proved, so `up` starts both rather than choosing.
 * Retiring the builder is a later step and deleting its row here is how that step
 * will begin — it is not this one.
 *
 * EACH ENTRY INVOKES THE EXISTING ENTRY POINT rather than reimplementing it.
 * `pnpm dev:public`, `1c builder`, `1c filing`, `1c dev serve` and
 * `bin/access-sim` all survive this ticket untouched as operator entry points;
 * `bin/dev up` is a further caller of them, not a replacement for what they do.
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
    // `dev` is the name the {@link KNOWN_SERVICES} table already gives this
    // port, and the name is the pidfile's stem — so `down` and `reap` cover this
    // service with no further change, which is why the table is the one place a
    // port is declared.
    name: 'dev',
    port: knownPort('dev'),
    argv: ['bin/1c', 'dev', 'serve'],
    what: 'the deployed dev environment — wrangler dev on the snapshot bin/deploy --env dev wrote',
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

/** What `bin/dev up` recorded about a service it started. */
export interface DevPidfile {
  readonly name: string
  readonly pid: number
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

/** Record a started service. */
export function writeDevPidfile(repoRoot: string, rec: Omit<DevPidfile, 'file'>): string {
  const dir = devStateDir(repoRoot)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${rec.name}.pid`)
  fs.writeFileSync(file, `${JSON.stringify(rec, null, 2)}\n`)
  return file
}

/** Forget a service. Absent is success: the point is that it is not recorded. */
export function removeDevPidfile(repoRoot: string, name: string): void {
  fs.rmSync(path.join(devStateDir(repoRoot), `${name}.pid`), { force: true })
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
  /** Seam for tests that must not wait in real time. */
  sleep?: (ms: number) => Promise<void>
}

const realSleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** The survey `1c ps` prints, with this repo's pidfiles folded in. */
export function devTable(ctx: DevContext): DevProcessTable {
  return devProcessTable({
    repoRoot: ctx.repoRoot,
    managedPids: readDevPidfiles(ctx.repoRoot).map((r) => r.pid),
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
  readonly pid: number
  readonly port: number
  readonly log: string
}

/**
 * WHY A SERVICE THAT REFUSED IS NOT A SERVICE THAT NEVER ANSWERED ([[REQ-322]]).
 *
 * `1c dev serve` DECLINES TO START on a local D1 behind `db/migrations/`, and
 * `1c builder` on more than one resolvable `workerd` — each with a message that
 * names the repair. Detached, both look identical to a server still warming up:
 * the port does not answer. Reported as a timeout, the operator reads "slow" and
 * waits, or re-runs `up`, and the sentence that told them what to fix is sitting
 * in a log file nobody has been pointed at.
 *
 * So the wait watches the CHILD as well as the port. A process that has exited is
 * a decision, not a delay, and it is reported as one — with its exit code, and
 * with the log named, because the reason it gave is already written there.
 */
export type DevFailureKind =
  /** Could not be spawned at all — no process was ever created. */
  | 'spawn'
  /** Exited before the port answered: it declined, with a reason in its log. */
  | 'refused'
  /** Still running, but the port never answered inside the budget. */
  | 'timeout'

export interface DevUpOutcome {
  readonly deploy: DevDeployStep
  readonly started: readonly DevStarted[]
  /** Already answering when `up` looked — left alone rather than duplicated. */
  readonly alreadyUp: readonly { name: string; port: number }[]
  /** Spawned, but the port never answered. */
  readonly failed: readonly {
    name: string
    port: number
    kind: DevFailureKind
    detail: string
  }[]
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
    services?: readonly DevService[]
    /** Per-service budget for the port to start answering. */
    timeoutMs?: number
    deploy?: DevDeployStep
  },
): Promise<DevUpOutcome> {
  const services = ctx.services ?? DEV_SERVICES
  const answers = ctx.answers ?? ((port: number) => portAnswers(port))
  const sleep = ctx.sleep ?? realSleep
  const timeoutMs = ctx.timeoutMs ?? 60_000
  const deploy = ctx.deploy ?? devDeploy({ repoRoot: ctx.repoRoot })

  const started: DevStarted[] = []
  const alreadyUp: { name: string; port: number }[] = []
  const failed: { name: string; port: number; kind: DevFailureKind; detail: string }[] = []

  const logDir = devStateDir(ctx.repoRoot)
  fs.mkdirSync(logDir, { recursive: true })

  for (const service of services) {
    if (await answers(service.port)) {
      alreadyUp.push({ name: service.name, port: service.port })
      continue
    }
    const log = path.join(logDir, `${service.name}.log`)
    let pid: number | undefined
    // Set by the child's own `exit` event, which still arrives after `unref()`:
    // that drops the handle's claim on the event loop, not the handle. This loop
    // is awaiting sleeps, so the loop is alive to deliver it.
    let exit: { code: number | null; signal: NodeJS.Signals | null } | null = null
    try {
      const fd = fs.openSync(log, 'a')
      const child = spawn(service.argv[0], [...service.argv.slice(1)], {
        cwd: ctx.repoRoot,
        detached: true,
        stdio: ['ignore', fd, fd],
      })
      fs.closeSync(fd)
      child.on('exit', (code, signal) => {
        exit = { code, signal }
      })
      child.unref()
      pid = child.pid
    } catch (err) {
      failed.push({
        name: service.name,
        port: service.port,
        kind: 'spawn',
        detail: `could not spawn ${service.argv.join(' ')} — ${err instanceof Error ? err.message : String(err)}`,
      })
      continue
    }
    if (pid === undefined) {
      failed.push({
        name: service.name,
        port: service.port,
        kind: 'spawn',
        detail: 'spawned with no pid',
      })
      continue
    }
    writeDevPidfile(ctx.repoRoot, {
      name: service.name,
      pid,
      port: service.port,
      startedAt: new Date().toISOString(),
      log,
    })
    const outcome = await waitForPort(service.port, timeoutMs, answers, sleep, () => exit)
    if (outcome === 'up') {
      started.push({ name: service.name, pid, port: service.port, log })
      continue
    }
    // THE LOG IS NAMED IN BOTH FAILURES, because a service that was spawned and
    // did not come up has already written the reason somewhere, and the
    // operator's next question is where. What differs is whether there is a
    // reason to look for at all.
    failed.push(
      outcome === 'exited'
        ? {
            name: service.name,
            port: service.port,
            kind: 'refused',
            detail:
              `${service.argv.join(' ')} exited ${exitDescription(exit)} without answering on ` +
              `${service.port} — it declined to start, and the reason it gave is in ${log}`,
          }
        : {
            name: service.name,
            port: service.port,
            kind: 'timeout',
            detail: `spawned as pid ${pid} but nothing answered on ${service.port} within ${Math.round(timeoutMs / 1000)}s — see ${log}`,
          },
    )
  }

  return { deploy, started, alreadyUp, failed, ok: deploy.ok && failed.length === 0 }
}

/** How an exited child is named in the report — code, or the signal that killed it. */
function exitDescription(exit: { code: number | null; signal: NodeJS.Signals | null } | null): string {
  if (exit === null) return 'immediately'
  if (exit.signal !== null) return `on ${exit.signal}`
  return `with code ${exit.code ?? 0}`
}

/**
 * Poll until `port` answers, the child exits, or the budget runs out.
 *
 * THE PORT IS CHECKED FIRST ON EVERY PASS, including after an exit is seen. A
 * wrapper that hands the port to a grandchild and then exits itself is a real
 * shape — and it has started the service, whatever its own exit code was. Asking
 * about the exit before asking about the port would report that as a refusal.
 */
async function waitForPort(
  port: number,
  timeoutMs: number,
  answers: (port: number) => Promise<boolean>,
  sleep: (ms: number) => Promise<void>,
  exited: () => { code: number | null; signal: NodeJS.Signals | null } | null = () => null,
): Promise<'up' | 'exited' | 'timeout'> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    if (await answers(port)) return 'up'
    if (exited() !== null) return 'exited'
    if (Date.now() >= deadline) return 'timeout'
    await sleep(300)
  }
}

export function formatUp(outcome: DevUpOutcome): string {
  const lines: string[] = [outcome.deploy.line]
  for (const s of outcome.started) lines.push(`  started  ${s.name.padEnd(12)} ${s.port}  pid ${s.pid}  → ${s.log}`)
  for (const a of outcome.alreadyUp)
    lines.push(
      `  already  ${a.name.padEnd(12)} ${a.port}  something was answering, so it was left alone` +
        ` (\`1c ps\` says whose it is)`,
    )
  for (const f of outcome.failed) {
    // REFUSED AND FAILED ARE DIFFERENT WORDS ON PURPOSE (REQ-322): one says a
    // reason exists and where it is, the other says nobody knows yet.
    const label = f.kind === 'refused' ? 'REFUSED ' : 'FAILED  '
    lines.push(`  ${label} ${f.name.padEnd(12)} ${f.port}  ${f.detail}`)
  }
  return (
    `${outcome.ok ? 'The dev environment is up.' : 'The dev environment did not come up.'}\n` +
    `${lines.join('\n')}\n\n` +
    `\`1c ps\` lists what is running; \`bin/dev down\` stops it.`
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
  const records = readDevPidfiles(ctx.repoRoot)
  const stopped: DevPidfile[] = []
  const alreadyStopped: DevPidfile[] = []

  // REVERSE START ORDER: access-sim proxies to the builder and the builder talks to
  // filing, so the dependents go down first and nothing spends its last moments
  // reporting that its upstream has vanished.
  for (const rec of [...records].reverse()) {
    if (!pidAlive(rec.pid, kill)) {
      alreadyStopped.push(rec)
    } else {
      try {
        kill(rec.pid, 'SIGTERM')
        stopped.push(rec)
      } catch (err) {
        alreadyStopped.push(rec)
        void err
      }
    }
    removeDevPidfile(ctx.repoRoot, rec.name)
  }

  const ports = new Set(records.map((r) => r.port))
  if (ports.size > 0) await sleep(700)
  const table = devTable(ctx)
  const stillListening = table.listeners.filter((l) => l.ours && ports.has(l.port))

  return {
    stopped,
    alreadyStopped,
    stillListening,
    ok: stillListening.length === 0,
  }
}

export function formatDown(outcome: DevDownOutcome): string {
  const lines: string[] = []
  for (const s of outcome.stopped) lines.push(`  stopped  ${s.name.padEnd(12)} ${s.port}  pid ${s.pid}`)
  for (const s of outcome.alreadyStopped)
    lines.push(`  gone     ${s.name.padEnd(12)} ${s.port}  pid ${s.pid} was already not running`)
  if (lines.length === 0) lines.push('  nothing was recorded as running.')
  if (outcome.ok) return `The dev environment is down.\n${lines.join('\n')}`
  return (
    `The dev environment is NOT fully down.\n${lines.join('\n')}\n\n` +
    `Still answering:\n${outcome.stillListening.map((l) => l.line).join('\n')}\n\n` +
    `Their pidfiles have been removed, so \`bin/dev reap --dry-run\` now lists them and\n` +
    `\`bin/dev reap\` escalates to SIGKILL.`
  )
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
