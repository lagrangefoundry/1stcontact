import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { KNOWN_SERVICES, inDevPortBand, listenerPidsOnPort } from '../tools/generate/src/cli/ps'
import {
  devDown,
  devPidfilePids,
  devRestart,
  devStateDir,
  devTable,
  devUp,
  formatDown,
  formatRestart,
  formatUp,
  pidAlive,
  readDevPidfiles,
  writeDevPidfile,
  type DevService,
} from '../tools/generate/src/cli/dev'

/**
 * [[BUG-147]] — `bin/dev down` could not stop the builder, because `up` recorded
 * the pid of the process it SPAWNED and for two of the four services that process
 * is not the one holding the socket: `1c builder` starts `wrangler dev`, which
 * forks `workerd`, and the listener is the grandchild.
 *
 * THE WRAPPER SHAPE IS BUILT FOR REAL, NOT SIMULATED. Every leg below that is
 * about the defect starts a real detached wrapper which spawns a real child that
 * holds a real port and which does NOT die when its parent does — measured as the
 * arrangement the ticket found, with `lsof` reading the pids back. Nothing about
 * the wrapper/grandchild relationship is stubbed, because the whole defect was a
 * wrong assumption about that relationship.
 *
 * WHAT IS MOCKED: `kill` in exactly one leg, where a process that ignores SIGTERM
 * is needed and `ignoreTerm` supplies it without any stub at all — so in practice,
 * nothing. `lsof` is never stubbed here; the pidfiles, the sockets, the signals and
 * the process groups are all real.
 *
 * EVERY LEG RUNS AGAINST A TEMPORARY REPO ROOT, for the reason the REQ-319 suite
 * states: rooted at the real checkout, a `devTable`-driven test would read the
 * operator's own running builder.
 */

const children: ChildProcess[] = []
const tempRoots: string[] = []
/** Pids started indirectly — a wrapper's child is nobody's `ChildProcess`. */
const strays: number[] = []

afterEach(() => {
  for (const child of children.splice(0)) {
    try {
      if (child.pid !== undefined) process.kill(-child.pid, 'SIGKILL')
    } catch {
      /* group already gone */
    }
    try {
      if (child.pid !== undefined) process.kill(child.pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }
  for (const pid of strays.splice(0)) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }
  for (const dir of tempRoots.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function tempRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bug147-'))
  tempRoots.push(dir)
  return dir
}

/**
 * A port inside the dev band that nothing currently holds.
 *
 * THE LOW HALF OF THE BAND, AND NEVER A PORT `KNOWN_SERVICES` NAMES. The REQ-319
 * suite draws from 8800 up and runs in parallel with this file, and two suites
 * probing the same port can both see it free before either binds — which surfaced
 * as REQ-319's "a service that never answered" finding one of these listeners on
 * the port it had just been handed. Disjoint ranges, plus a skip for the real
 * services so a test can never bind over the operator's own builder.
 */
async function freeBandPort(from: number): Promise<number> {
  for (let port = from; port < 8780; port += 1) {
    if (KNOWN_SERVICES.some((k) => k.port === port)) continue
    const free = await new Promise<boolean>((resolve) => {
      const probe = net.createServer()
      probe.once('error', () => resolve(false))
      probe.once('listening', () => probe.close(() => resolve(true)))
      probe.listen(port, '127.0.0.1')
    })
    if (free) {
      expect(inDevPortBand(port)).toBe(true)
      return port
    }
  }
  throw new Error('no free port in the dev band')
}

function answering(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    const done = (a: boolean): void => {
      socket.removeAllListeners()
      socket.destroy()
      resolve(a)
    }
    socket.setTimeout(400)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(port, '127.0.0.1')
  })
}

/**
 * The `1c builder` → `wrangler dev` → `workerd` shape, as a service `up` can start.
 *
 * THE WRAPPER DIES ON SIGTERM AND THE CHILD DOES NOT FOLLOW IT, which is the
 * measured arrangement: 53215 was a live `node` at the repo root while 53613 was
 * the `workerd` holding 8788, and killing the first did not free the port. The
 * child is spawned in the wrapper's own process group — it does not call `setsid` —
 * so a group signal reaches it and a pid signal does not, which is exactly the
 * distinction under test.
 */
function wrapperService(name: string, port: number): DevService {
  const child = `require('node:net').createServer().listen(${port}, '127.0.0.1')`
  const wrapper =
    `const c = require('node:child_process').spawn(process.execPath, ['-e', ${JSON.stringify(child)}], ` +
    `{ stdio: 'ignore' }); c.unref(); setInterval(() => {}, 1000)`
  return {
    name,
    port,
    argv: [process.execPath, '-e', wrapper],
    what: 'a wrapper whose grandchild holds the port, as the builder is',
  }
}

/** A single-process service — filing and access-sim are this shape. */
function directService(name: string, port: number): DevService {
  return {
    name,
    port,
    argv: [process.execPath, '-e', `require('node:net').createServer().listen(${port}, '127.0.0.1')`],
    what: 'a listener that is its own process',
  }
}

/** A real detached listener in `cwd`, optionally deaf to SIGTERM. */
async function listener(port: number, cwd: string, opts: { ignoreTerm?: boolean } = {}): Promise<number> {
  const script =
    (opts.ignoreTerm === true ? "process.on('SIGTERM', () => {});" : '') +
    `require('node:net').createServer().listen(${port}, '127.0.0.1')`
  const child = spawn(process.execPath, ['-e', script], { cwd, detached: true, stdio: 'ignore' })
  child.unref()
  children.push(child)
  for (let i = 0; i < 100; i += 1) {
    if (await answering(port)) return child.pid as number
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error(`listener on ${port} never came up`)
}

describe('bin/dev up records the process that holds the port', () => {
  it('test_UAT_FC_BUG-147_up_records_the_listener_not_only_the_wrapper', async () => {
    // THE DEFECT, FROM THE `up` SIDE. `devUp` recorded `child.pid` — the wrapper —
    // and the pid holding the port was a grandchild that appeared in no pidfile at
    // all. Both are recorded now, and the report names both so the operator can see
    // that the thing serving is not the thing that was spawned.
    const root = tempRoot()
    const port = await freeBandPort(8740)
    const outcome = await devUp({ repoRoot: root, services: [wrapperService('builderish', port)], timeoutMs: 20_000 })

    expect(outcome.ok).toBe(true)
    const started = outcome.started[0]
    strays.push(started.pid)

    // The two pids of the measured table: a live wrapper, and a different process
    // actually holding the socket.
    const holding = listenerPidsOnPort(port)
    expect(holding).not.toEqual([])
    expect(holding).not.toContain(started.pid)
    expect(started.listenerPid).not.toBeNull()
    expect(holding).toContain(started.listenerPid as number)
    expect(pidAlive(started.pid)).toBe(true)
    strays.push(started.listenerPid as number)

    // And the pidfile carries both, which is what `down` and `ps` read.
    const [rec] = readDevPidfiles(root)
    expect(rec.pid).toBe(started.pid)
    expect(rec.listenerPid).toBe(started.listenerPid)
    expect(devPidfilePids(rec)).toEqual([started.pid, started.listenerPid])

    expect(formatUp(outcome)).toContain(`pid ${started.pid} → listener ${started.listenerPid}`)
  })

  it('test_UAT_FC_BUG-147_up_records_one_pid_for_a_service_that_is_its_own_listener', async () => {
    // filing AND access-sim ARE THEIR OWN LISTENER, and the measured table shows
    // both matching. Recording the wrapper explicitly as the listener is a different
    // fact from "nobody could be asked", so it is asserted rather than left implied.
    const root = tempRoot()
    const port = await freeBandPort(8744)
    const outcome = await devUp({ repoRoot: root, services: [directService('filingish', port)], timeoutMs: 20_000 })
    const started = outcome.started[0]
    strays.push(started.pid)

    expect(started.listenerPid).toBe(started.pid)
    expect(devPidfilePids(readDevPidfiles(root)[0])).toEqual([started.pid])
    // One number in the report, because there is one process.
    expect(formatUp(outcome)).toContain(`pid ${started.pid}  →`)
    expect(formatUp(outcome)).not.toContain('→ listener')
  })

  it('test_UAT_FC_BUG-147_ps_calls_a_service_up_started_bin_dev', async () => {
    // `1c ps` MISLABELLED A MANAGED SERVICE AS UNMANAGED: `devTable` matched the
    // LISTENER's pid against the pidfiles' spawned pids, so the builder's `started`
    // column read `-` for a service `up` had started three minutes earlier — the
    // signal an operator reads before deciding whether to reach for `reap`.
    const root = tempRoot()
    const port = await freeBandPort(8748)
    const outcome = await devUp({ repoRoot: root, services: [wrapperService('builderish', port)], timeoutMs: 20_000 })
    strays.push(outcome.started[0].pid, outcome.started[0].listenerPid as number)

    const row = devTable({ repoRoot: root }).listeners.find((l) => l.port === port)
    expect(row).toBeDefined()
    // The row is the LISTENER's, not the wrapper's — the wrapper holds no socket.
    expect(row?.pid).toBe(outcome.started[0].listenerPid)
    expect(row?.managed).toBe(true)
    expect(row?.line).toContain('bin/dev')
    expect(row?.line).not.toMatch(/\s-\s+this checkout/)
  })
})

describe('bin/dev down stops the service, not just the pid it holds', () => {
  it('test_UAT_FC_BUG-147_down_stops_a_listener_that_is_a_grandchild_of_what_up_spawned', async () => {
    // THE DEFECT, FROM THE `down` SIDE, AND THE CENTRAL LEG OF THIS TICKET. `up`
    // spawns detached, making the wrapper a process-group leader; `kill(pid)`
    // signals that leader alone and leaves the grandchild holding the port, which
    // is what `formatDown` was reporting as *"NOT fully down"* with no remedy but
    // `reap`. Signalling the GROUP reaches both.
    const root = tempRoot()
    const port = await freeBandPort(8752)
    const up = await devUp({ repoRoot: root, services: [wrapperService('builderish', port)], timeoutMs: 20_000 })
    const wrapper = up.started[0].pid
    const holder = up.started[0].listenerPid as number
    strays.push(wrapper, holder)
    expect(holder).not.toBe(wrapper)

    const outcome = await devDown({ repoRoot: root })

    expect(outcome.ok).toBe(true)
    expect(outcome.stillListening).toEqual([])
    expect(await answering(port)).toBe(false)
    // Both processes are gone — the port being free is the proof `down` already
    // insists on, and the pids say it was the service that stopped, not the wrapper.
    expect(pidAlive(holder)).toBe(false)
    expect(pidAlive(wrapper)).toBe(false)
    expect(readDevPidfiles(root)).toEqual([])
    // The report names both pids, because one number could not show the defect.
    expect(formatDown(outcome)).toContain(`pid ${wrapper} → listener ${holder}`)
  })

  it('test_UAT_FC_BUG-147_down_names_one_service_and_verifies_that_port', async () => {
    // A SINGLE SERVICE CAN BE STOPPED, which is half of restarting one. The other
    // service must be untouched: `reap` — the only way to reach one stale listener
    // before this — takes every unmanaged listener in the project with it.
    const root = tempRoot()
    const [keepPort, dropPort] = [await freeBandPort(8756), await freeBandPort(8760)]
    const up = await devUp({
      repoRoot: root,
      services: [directService('keep', keepPort), wrapperService('drop', dropPort)],
      timeoutMs: 20_000,
    })
    const keep = up.started.find((s) => s.name === 'keep') as (typeof up.started)[number]
    const drop = up.started.find((s) => s.name === 'drop') as (typeof up.started)[number]
    strays.push(keep.pid, drop.pid, drop.listenerPid as number)

    const outcome = await devDown({
      repoRoot: root,
      services: [directService('keep', keepPort), wrapperService('drop', dropPort)],
      only: ['drop'],
    })

    expect(outcome.ok).toBe(true)
    expect(outcome.stopped.map((s) => s.name)).toEqual(['drop'])
    expect(await answering(dropPort)).toBe(false)
    // The one that was not named is still running and still recorded.
    expect(await answering(keepPort)).toBe(true)
    expect(pidAlive(keep.pid)).toBe(true)
    expect(readDevPidfiles(root).map((r) => r.name)).toEqual(['keep'])
  })

  it('test_UAT_FC_BUG-147_down_of_a_named_service_verifies_its_port_with_no_pidfile', async () => {
    // BECAUSE `down` ALREADY REMOVES THE PIDFILE OF WHAT IT COULD NOT STOP, the
    // second `bin/dev down builder` of a restart has nothing recorded to read — and
    // an answer of "nothing was recorded as running" would be a successful exit with
    // the port still held. A NAMED service is verified whether or not a file claims it.
    const root = tempRoot()
    const port = await freeBandPort(8764)
    const pid = await listener(port, root)
    strays.push(pid)

    const outcome = await devDown({ repoRoot: root, services: [directService('orphan', port)], only: ['orphan'] })

    expect(readDevPidfiles(root)).toEqual([])
    expect(outcome.ok).toBe(false)
    expect(outcome.stillListening.map((l) => l.port)).toEqual([port])
    expect(formatDown(outcome)).toContain('NOT fully down')
    // The remedy offered names the per-service route before the project-wide one.
    expect(formatDown(outcome)).toContain('bin/dev down <service>')

    // Unnamed, with nothing recorded, the behaviour is unchanged: nothing to stop
    // and nothing to verify.
    const whole = await devDown({ repoRoot: root })
    expect(whole.ok).toBe(true)
    expect(whole.stillListening).toEqual([])
  })
})

describe('bin/dev restart', () => {
  it('test_UAT_FC_BUG-147_restart_replaces_one_service_and_leaves_the_others', async () => {
    // "THE ENVIRONMENT CHANGED, RESTART WHAT READS IT" had no spelling, and an
    // env-file change only takes effect on a process started after it — which is
    // what made BUG-146's workaround untestable. The proof is a NEW pid on the
    // restarted service's port and the same pid on its neighbour's.
    const root = tempRoot()
    const [keepPort, cyclePort] = [await freeBandPort(8768), await freeBandPort(8772)]
    const services = [directService('keep', keepPort), wrapperService('cycle', cyclePort)]
    const up = await devUp({ repoRoot: root, services, timeoutMs: 20_000 })
    const keepPid = (up.started.find((s) => s.name === 'keep') as (typeof up.started)[number]).pid
    const firstHolder = (up.started.find((s) => s.name === 'cycle') as (typeof up.started)[number])
      .listenerPid as number
    strays.push(keepPid, firstHolder)

    const outcome = await devRestart({ repoRoot: root, services, only: ['cycle'], timeoutMs: 20_000 })
    const restarted = outcome.up?.started[0]
    strays.push(restarted?.pid as number, restarted?.listenerPid as number)

    expect(outcome.ok).toBe(true)
    expect(outcome.down.stopped.map((s) => s.name)).toEqual(['cycle'])
    expect(outcome.up?.started.map((s) => s.name)).toEqual(['cycle'])
    // A DIFFERENT process is serving — which is the whole point of a restart, and
    // the thing an operator could not previously achieve without `reap`.
    expect(restarted?.listenerPid).not.toBe(firstHolder)
    expect(pidAlive(firstHolder)).toBe(false)
    expect(await answering(cyclePort)).toBe(true)

    // The untouched service is still the same process on the same port.
    expect(pidAlive(keepPid)).toBe(true)
    expect(readDevPidfiles(root).find((r) => r.name === 'keep')?.pid).toBe(keepPid)
    // It deploys nothing: this replaces processes, it does not rebuild the target.
    expect(outcome.up?.deploy.ran).toBe(false)
    expect(formatRestart(outcome)).toContain('deploy: SKIPPED')
  })

  it('test_UAT_FC_BUG-147_restart_starts_nothing_when_down_left_the_port_answering', async () => {
    // `up`'s RULE FOR A LIVE PORT IS TO LEAVE IT ALONE, so a restart that started
    // anyway would report the process that would not stop as `already answering,
    // left alone` — the exact silent carry-over that hid this defect. A failed
    // `down` therefore starts nothing and says so.
    const root = tempRoot()
    const port = await freeBandPort(8776)
    const pid = await listener(port, root, { ignoreTerm: true })
    strays.push(pid)
    writeDevPidfile(root, { name: 'stubborn', pid, port, startedAt: new Date().toISOString(), log: '' })

    const outcome = await devRestart({
      repoRoot: root,
      services: [directService('stubborn', port)],
      only: ['stubborn'],
      timeoutMs: 2_000,
    })

    expect(outcome.ok).toBe(false)
    expect(outcome.up).toBeNull()
    expect(outcome.down.ok).toBe(false)
    expect(await answering(port)).toBe(true)
    expect(formatRestart(outcome)).toContain('Nothing was started')
  })
})

describe('the launcher', () => {
  it('test_UAT_FC_BUG-147_an_unknown_service_name_is_refused_and_names_the_ones_that_exist', () => {
    // A TYPO WOULD OTHERWISE RESTRICT THE CALL TO NOTHING and report a successful
    // no-op — the same class of silence this ticket is about. Run through the real
    // entry point, because that is where argv is validated.
    let failed = false
    try {
      execFileSync(process.execPath, ['tools/generate/bin/1c.mjs', 'dev', 'down', 'buidler'], {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (err) {
      failed = true
      const out = `${(err as { stdout?: string }).stdout ?? ''}${(err as { stderr?: string }).stderr ?? ''}`
      expect(out).toContain("Unknown dev service 'buidler'")
      for (const name of ['filing', 'builder', 'public-site', 'access-sim']) expect(out).toContain(name)
    }
    expect(failed).toBe(true)
  })

  it('test_UAT_FC_BUG-147_bin_dev_and_the_cli_both_spell_restart', () => {
    // `bin/dev` composes no behaviour of its own, so the verb has to exist in one
    // place and be named in the launcher's own usage — which is what an operator
    // reads before they reach for `reap`.
    const script = fs.readFileSync(path.join('bin', 'dev'), 'utf8')
    expect(script).toContain('bin/dev restart <service>')
    expect(script).toContain('bin/dev down <service>')
    const usage = execFileSync(process.execPath, ['tools/generate/bin/1c.mjs', 'help'], {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
    expect(usage).toContain('1c dev up | down | reap | restart')
    expect(usage).toContain('<service>')
  })

  it('test_UAT_FC_BUG-147_restart_is_gated_on_one_workerd_like_up_is', async () => {
    // `dev restart` STARTS THE BUILDER AGAIN, so it opens `.wrangler/state` for the
    // same reason `dev up` does — and the first runtime to open that store migrates
    // its schema forward one-way. The gate is keyed by subcommand, so the new verb
    // has to be listed or it inherits `dev`'s ungated reading.
    const { WORKERD_GATED_COMMANDS, workerdGateKey } = await import('../tools/generate/src/cli/workerd')
    expect(WORKERD_GATED_COMMANDS).toContain('dev restart')
    expect(workerdGateKey('dev', 'restart')).toBe('dev restart')
    // …and the verbs that only send signals and read `lsof` stay ungated, because
    // refusing to STOP a dev environment on a skewed tree is the one moment
    // stopping it is most useful.
    expect(workerdGateKey('dev', 'down')).toBe('dev')
    expect(workerdGateKey('dev', 'reap')).toBe('dev')
  })
})
