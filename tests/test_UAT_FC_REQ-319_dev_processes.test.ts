import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import {
  classifyCwd,
  devProcessTable,
  formatProcessTable,
  inDevPortBand,
  KNOWN_SERVICES,
  repoTopology,
  type GitRunner,
  type LsofRunner,
} from '../tools/generate/src/cli/ps'
import {
  devDeploy,
  devDown,
  devReap,
  devStateDir,
  devUp,
  formatDown,
  formatReap,
  pidAlive,
  readDevPidfiles,
  writeDevPidfile,
  type DevService,
} from '../tools/generate/src/cli/dev'

/**
 * [[REQ-319]] — `1c ps` and `bin/dev up` / `down` / `reap`.
 *
 * WHAT IS MOCKED AND WHAT IS NOT. `lsof` and `kill` are the operating system, and
 * both are reachable as injected functions for the one reason a thin mock is ever
 * allowed: they are an external boundary this repository does not own. Everything
 * else in these tests is real — real detached child processes holding real
 * listening sockets, a real `lsof` reading them back, real pidfiles on disk. Where
 * `kill` IS stubbed (the could-not-kill case, which cannot be manufactured
 * otherwise) the stub only REFUSES TO SIGNAL; the evidence that the process is
 * still there afterwards still comes from a real `lsof` sweep.
 *
 * EVERY PROCESS TEST RUNS AGAINST A TEMPORARY REPO ROOT, deliberately. `reap` kills
 * every listener whose working directory is the checkout it was asked about, so a
 * reap test rooted at the real repository would kill the operator's own running
 * builder. Rooted at a temp directory, the children this file starts are that
 * root's and every real listener on the machine classifies as somebody else's — so
 * the sparing rule is exercised for real, against real processes, and cannot reach
 * anything that matters.
 */

// ── the situation the ticket measured ────────────────────────────────────────

/**
 * The sweep from the ticket, replayed as `lsof` output.
 *
 * VERBATIM FROM THE MEASURED TABLE: three live services, eight strays (four of
 * them in `.xgd` worktrees that have since been torn down), and six listeners
 * belonging to sibling repositories. It is a fixture rather than a live machine
 * because the point of the assertion is that THIS arrangement is read correctly,
 * and that arrangement no longer exists — the strays it describes are exactly what
 * this ticket exists to remove.
 */
const MEASURED = {
  repoRoot: '/repo/1stcontact',
  worktreeBase: '/home/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git',
  rows: [
    { pid: 40872, cmd: 'workerd', port: 8788, cwd: '/repo/1stcontact/apps/control-app' },
    { pid: 79585, cmd: 'node', port: 8790, cwd: '/repo/1stcontact' },
    { pid: 9488, cmd: 'node', port: 8799, cwd: '/repo/1stcontact' },
    { pid: 64976, cmd: 'node', port: 8712, cwd: '/repo/1stcontact' },
    { pid: 1917, cmd: 'node', port: 8722, cwd: '/repo/1stcontact' },
    { pid: 4639, cmd: 'node', port: 8733, cwd: '/repo/1stcontact' },
    { pid: 18161, cmd: 'node', port: 8711, cwd: '/home/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-254' },
    { pid: 56507, cmd: 'node', port: 8719, cwd: '/home/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-254' },
    { pid: 3453, cmd: 'node', port: 8723, cwd: '/home/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-254' },
    { pid: 87773, cmd: 'node', port: 8795, cwd: '/home/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-124' },
    { pid: 86999, cmd: 'python3.12', port: 8889, cwd: '/private/tmp/pytest-of-x/test_UAT_FC_REQ_706_stop_port_3' },
    { pid: 56588, cmd: 'python3.12', port: 8766, cwd: '/repo/lagrange-framework' },
    { pid: 89890, cmd: 'python3.12', port: 8767, cwd: '/repo/lagrange-framework' },
    { pid: 28713, cmd: 'python3.12', port: 8791, cwd: '/repo/lagrange-framework/components/ai/py' },
    { pid: 74893, cmd: 'python3.12', port: 8793, cwd: '/repo/lagrange-framework' },
    { pid: 74834, cmd: 'python3.12', port: 8794, cwd: '/repo/lagrange-framework' },
    { pid: 86410, cmd: 'python3.12', port: 8888, cwd: '/repo/xgd' },
    // Not in the band and not ours: the machine's unrelated furniture, which the
    // survey must not carry.
    { pid: 986, cmd: 'rapportd', port: 51903, cwd: '/' },
    { pid: 4665, cmd: 'ollama', port: 11434, cwd: '/' },
  ],
}

const measuredLsof: LsofRunner = (args) => {
  if (args.includes('-sTCP:LISTEN')) {
    return MEASURED.rows
      .flatMap((r) => [`p${r.pid}`, `c${r.cmd}`, 'f25', `n127.0.0.1:${r.port}`])
      .join('\n')
  }
  const wanted = new Set((args[args.indexOf('-p') + 1] ?? '').split(',').map(Number))
  return MEASURED.rows
    .filter((r) => wanted.has(r.pid))
    .flatMap((r) => [`p${r.pid}`, 'fcwd', `n${r.cwd}`])
    .join('\n')
}

const measuredGit: GitRunner = (args) => {
  if (args.includes('--git-common-dir')) return `${MEASURED.repoRoot}/.git\n`
  if (args.includes('worktree')) {
    return [
      `worktree ${MEASURED.repoRoot}`,
      'HEAD abc',
      `worktree ${MEASURED.worktreeBase}/main`,
      'HEAD def',
      `worktree ${MEASURED.worktreeBase}/reconcile-BUNDLE-29`,
      'HEAD ghi',
      '',
    ].join('\n')
  }
  if (args.includes('get-url')) return 'git@github.com:lagrangefoundry/1stcontact.git\n'
  return ''
}

const measuredTable = (): ReturnType<typeof devProcessTable> =>
  devProcessTable({
    repoRoot: MEASURED.repoRoot,
    lsof: measuredLsof,
    git: measuredGit,
    env: { HOME: '/home' },
  })

// ── real listeners, for the legs that must not be simulated ─────────────────

const children: ChildProcess[] = []
const tempRoots: string[] = []

afterEach(() => {
  for (const child of children.splice(0)) {
    try {
      if (child.pid !== undefined) process.kill(child.pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }
  for (const dir of tempRoots.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function tempRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'req319-'))
  tempRoots.push(dir)
  return dir
}

/** A port inside {@link DEV_PORT_BAND} that nothing currently holds. */
async function freeBandPort(from = 8800): Promise<number> {
  for (let port = from; port < 8900; port += 1) {
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

/** A real detached listener whose working directory is `cwd`. */
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

// ── 1c ps ────────────────────────────────────────────────────────────────────

describe('1c ps — what is running here', () => {
  it('test_UAT_FC_REQ-319_ps_attributes_every_listener_in_the_measured_sweep', () => {
    const table = measuredTable()
    const ours = table.listeners.filter((l) => l.ours)
    const theirs = table.listeners.filter((l) => !l.ours)

    // The three live services and the seven strays attributable to this repository.
    expect(ours.map((l) => l.port).sort((a, b) => a - b)).toEqual([
      8711, 8712, 8719, 8722, 8723, 8733, 8788, 8790, 8795, 8799,
    ])
    // Every row carries the pid and the working directory it was attributed by —
    // the two facts the hand-built table was made of.
    for (const l of ours) {
      expect(l.pid).toBeGreaterThan(0)
      expect(l.cwd).toBeTruthy()
    }

    // The three live services are recognised by name; the strays are not, and say so.
    expect(ours.filter((l) => l.service !== null).map((l) => l.service).sort()).toEqual([
      'access-sim',
      'builder',
      'filing',
    ])
    const strays = ours.filter((l) => l.service === null)
    expect(strays.map((l) => l.port).sort((a, b) => a - b)).toEqual([
      8711, 8712, 8719, 8722, 8723, 8733, 8795,
    ])
    for (const stray of strays) expect(stray.line).toContain('unrecognised service')

    // Which checkout each stray came from is preserved, because that is what says
    // whether `down` could ever have been run where it was started.
    expect(ours.filter((l) => l.origin === 'worktree').map((l) => l.port).sort((a, b) => a - b)).toEqual([
      8711, 8719, 8723, 8795,
    ])

    // The six listeners belonging to sibling repositories are reported and are NOT
    // this repo's — conflating those is how a reaper becomes dangerous.
    expect(theirs.filter((l) => inDevPortBand(l.port)).map((l) => l.port).sort((a, b) => a - b)).toEqual(
      [8766, 8767, 8791, 8793, 8794, 8888, 8889],
    )
    for (const l of theirs) expect(l.ours).toBe(false)

    // The machine's unrelated furniture is not in the survey at all.
    expect(table.listeners.map((l) => l.port)).not.toContain(51903)
    expect(table.listeners.map((l) => l.port)).not.toContain(11434)
  })

  it('test_UAT_FC_REQ-319_ps_never_claims_a_sibling_project_as_this_repo', () => {
    // THE FAILURE THIS PINS ACTUALLY HAPPENED. Reducing every `git worktree list`
    // entry to its parent directory yielded the directory the operator keeps every
    // project in, so each sibling repository's server was claimed as this repo's
    // and `reap` would have killed them.
    const table = measuredTable()
    expect(table.worktreeBases).toEqual([MEASURED.worktreeBase])
    for (const cwd of ['/repo/lagrange-framework', '/repo/xgd', '/repo/lagrange-biz']) {
      expect(
        classifyCwd(cwd, { repoRoot: MEASURED.repoRoot, bases: table.worktreeBases }),
      ).toBe('sibling')
    }
    expect(
      repoTopology({ repoRoot: MEASURED.repoRoot, git: measuredGit, env: { HOME: '/home' } }).bases,
    ).not.toContain('/repo')
  })

  it('test_UAT_FC_REQ-319_ps_reports_what_it_could_not_determine', () => {
    // A cwd `lsof` will not disclose is a row and a warning, never an omission: a
    // survey that silently drops what it cannot see reads as "that is everything".
    const table = devProcessTable({
      repoRoot: MEASURED.repoRoot,
      git: measuredGit,
      env: { HOME: '/home' },
      lsof: (args) =>
        args.includes('-sTCP:LISTEN') ? ['p555', 'cnode', 'f20', 'n127.0.0.1:8777'].join('\n') : '',
    })
    const row = table.listeners.find((l) => l.port === 8777)
    expect(row?.origin).toBe('undeterminable')
    expect(row?.cwd).toBeNull()
    expect(table.warnings.join('\n')).toContain('8777')
    expect(formatProcessTable(table)).toContain('Could not determine')
  })

  it('test_UAT_FC_REQ-319_ps_is_a_value_not_printed_output', async () => {
    // The strongest leg, and the one with nothing injected: a real socket, read back
    // by the real `lsof`, attributed to this real checkout — and asserted on as a
    // value, which is the whole reason `bin/dev down` and `reap` can be its callers.
    const port = await freeBandPort()
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
    try {
      const table = devProcessTable({ repoRoot: process.cwd() })
      expect(table.probed).toBe(true)
      const mine = table.listeners.find((l) => l.port === port)
      expect(mine).toBeDefined()
      expect(mine?.pid).toBe(process.pid)
      expect(mine?.origin).toBe('this-checkout')
      expect(mine?.ours).toBe(true)
      expect(mine?.cwd).toBeTruthy()
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  it('test_UAT_FC_REQ-319_ps_works_where_ps_aux_is_empty', () => {
    // UNDER THE AGENT SANDBOX `ps aux` RETURNS NOTHING AT ALL, which is the
    // condition that let eight zombies accumulate unseen. The survey must therefore
    // never consult it — a fact about the source, so it is asserted about the source
    // — and must still answer through `lsof`, which is asserted by running it.
    for (const file of ['ps.ts', 'dev.ts']) {
      const src = fs.readFileSync(path.join('tools', 'generate', 'src', 'cli', file), 'utf8')
      expect(src).not.toMatch(/execFileSync\(\s*'ps'/)
      expect(src).not.toMatch(/spawn(?:Sync)?\(\s*'ps'/)
      expect(src).not.toMatch(/'ps\s+aux'/)
    }
    expect(devProcessTable({ repoRoot: process.cwd() }).probed).toBe(true)
  })

  it('test_UAT_FC_REQ-319_ps_reports_rather_than_fails_when_lsof_is_absent', () => {
    // An `lsof` that cannot run means the answer is UNKNOWN, not empty, and the
    // table says which — a caller that read silence as calm would be wrong.
    const table = devProcessTable({
      repoRoot: MEASURED.repoRoot,
      git: measuredGit,
      lsof: () => {
        throw Object.assign(new Error('spawn lsof ENOENT'), { code: 'ENOENT' })
      },
    })
    expect(table.probed).toBe(false)
    expect(table.listeners).toEqual([])
    expect(formatProcessTable(table)).toContain('Could not survey')
  })

  it('test_UAT_FC_REQ-319_known_ports_are_declared_once', () => {
    // `DEV_SERVICES` reads its ports out of this table rather than restating them,
    // so a port cannot mean one thing to `1c ps` and another to `bin/dev up`.
    const ports = KNOWN_SERVICES.map((k) => k.port)
    expect(new Set(ports).size).toBe(ports.length)
    for (const port of ports) expect(inDevPortBand(port)).toBe(true)
    const dev = fs.readFileSync(path.join('tools', 'generate', 'src', 'cli', 'dev.ts'), 'utf8')
    for (const port of [8787, 8788, 8790, 8799]) expect(dev).not.toContain(String(port))
  })
})

// ── bin/dev up ───────────────────────────────────────────────────────────────

describe('bin/dev up', () => {
  it('test_UAT_FC_REQ-319_up_starts_a_service_records_it_and_does_not_start_it_twice', async () => {
    const root = tempRoot()
    const port = await freeBandPort(8810)
    const service: DevService = {
      name: 'probe',
      port,
      argv: [process.execPath, '-e', `require('node:net').createServer().listen(${port}, '127.0.0.1')`],
      what: 'a listener, for this test',
    }

    const first = await devUp({ repoRoot: root, services: [service], timeoutMs: 15_000 })
    expect(first.ok).toBe(true)
    expect(first.started.map((s) => s.name)).toEqual(['probe'])
    expect(await answering(port)).toBe(true)

    const recorded = readDevPidfiles(root)
    expect(recorded).toHaveLength(1)
    expect(recorded[0].port).toBe(port)
    expect(recorded[0].pid).toBe(first.started[0].pid)
    expect(pidAlive(recorded[0].pid)).toBe(true)
    // Registering it also makes it MANAGED, which is what `reap` spares.
    expect(devProcessTable({ repoRoot: root, managedPids: [recorded[0].pid] }).listeners
      .find((l) => l.port === port)?.managed).toBe(true)

    // A SERVICE ALREADY ANSWERING IS LEFT ALONE. Two of them would fight over one
    // port and the second would lose, so `up` reports the first is doing the job.
    const again = await devUp({ repoRoot: root, services: [service], timeoutMs: 15_000 })
    expect(again.started).toEqual([])
    expect(again.alreadyUp.map((a) => a.port)).toEqual([port])
    expect(readDevPidfiles(root)[0].pid).toBe(recorded[0].pid)

    // …and the polite stop works end to end, which is `down`'s happy path.
    const down = await devDown({ repoRoot: root })
    expect(down.ok).toBe(true)
    expect(down.stopped.map((s) => s.port)).toEqual([port])
    expect(down.stillListening).toEqual([])
    expect(readDevPidfiles(root)).toEqual([])
  })

  it('test_UAT_FC_REQ-319_up_reports_a_service_that_never_answered', async () => {
    const root = tempRoot()
    const port = await freeBandPort(8820)
    const outcome = await devUp({
      repoRoot: root,
      services: [{ name: 'silent', port, argv: [process.execPath, '-e', 'setTimeout(()=>{}, 5000)'], what: 'a process that binds nothing' }],
      timeoutMs: 900,
    })
    expect(outcome.ok).toBe(false)
    expect(outcome.started).toEqual([])
    expect(outcome.failed[0].port).toBe(port)
    // The log is named in the failure, because the reason is already written there.
    expect(outcome.failed[0].detail).toContain(path.join(devStateDir(root), 'silent.log'))
  })

  it('test_UAT_FC_REQ-319_up_delegates_the_deploy_to_bin_deploy_env_dev', () => {
    // `up` OWNS NONE OF THE DEPLOY. [[REQ-318]] builds `bin/deploy --env dev` — the
    // snapshot and the migrate hook against the local store — and the whole of this
    // step is to call it.
    const root = tempRoot()
    fs.mkdirSync(path.join(root, 'apps', 'control-app'), { recursive: true })
    fs.writeFileSync(path.join(root, 'apps', 'control-app', 'wrangler.toml'), '[env.dev]\nname = "x"\n')
    const calls: string[][] = []
    const ran = devDeploy({ repoRoot: root, run: (argv) => calls.push([...argv]) })
    expect(ran.ran).toBe(true)
    expect(ran.ok).toBe(true)
    expect(calls).toEqual([['bin/deploy', '--env', 'dev']])

    // …and until that target exists it is skipped with a line that names its owner,
    // rather than failing a command the operator can otherwise use today.
    const bare = devDeploy({ repoRoot: tempRoot() })
    expect(bare.ran).toBe(false)
    expect(bare.ok).toBe(true)
    expect(bare.line).toContain('REQ-318')
  })
})

// ── bin/dev down ─────────────────────────────────────────────────────────────

describe('bin/dev down', () => {
  it('test_UAT_FC_REQ-319_down_reports_failure_when_a_port_is_still_answering', async () => {
    // A SIGTERM A SERVICE IGNORES LOOKS EXACTLY LIKE ONE IT OBEYED. `down` therefore
    // re-reads `1c ps` rather than assuming the signal landed — here against a real
    // child that really does ignore it.
    const root = tempRoot()
    const port = await freeBandPort(8830)
    const pid = await listener(port, root, { ignoreTerm: true })
    writeDevPidfile(root, { name: 'stubborn', pid, port, startedAt: new Date().toISOString(), log: '' })

    const outcome = await devDown({ repoRoot: root })
    expect(outcome.ok).toBe(false)
    expect(outcome.stopped.map((s) => s.pid)).toEqual([pid])
    expect(outcome.stillListening.map((l) => l.port)).toEqual([port])
    expect(await answering(port)).toBe(true)

    const report = formatDown(outcome)
    expect(report).toContain('NOT fully down')
    expect(report).toContain(String(port))

    // ITS PIDFILE IS GONE, which is the handoff: `down` is polite and does not
    // escalate, so what it could not stop becomes an unmanaged stray that `reap`
    // is guaranteed to act on.
    expect(readDevPidfiles(root)).toEqual([])
    const reapable = await devReap({ repoRoot: root, dryRun: true })
    expect(reapable.targets.map((t) => t.pid)).toContain(pid)
  })

  it('test_UAT_FC_REQ-319_down_forgets_a_stale_pidfile', async () => {
    // A pidfile naming a process that has already gone is a successful `down`, not a
    // failure: the point is that it is not running.
    const root = tempRoot()
    const port = await freeBandPort(8840)
    const pid = await listener(port, root)
    process.kill(pid, 'SIGKILL')
    await new Promise((r) => setTimeout(r, 300))
    writeDevPidfile(root, { name: 'ghost', pid, port, startedAt: '', log: '' })

    const outcome = await devDown({ repoRoot: root })
    expect(outcome.ok).toBe(true)
    expect(outcome.alreadyStopped.map((s) => s.pid)).toEqual([pid])
    expect(readDevPidfiles(root)).toEqual([])
  })
})

// ── bin/dev reap ─────────────────────────────────────────────────────────────

describe('bin/dev reap', () => {
  it('test_UAT_FC_REQ-319_reap_dry_run_kills_nothing_and_lists_what_reap_would_kill', async () => {
    const root = tempRoot()
    const [a, b] = [await freeBandPort(8850), await freeBandPort(8860)]
    const pidA = await listener(a, root)
    const pidB = await listener(b, root)

    const preview = await devReap({ repoRoot: root, dryRun: true })
    expect(preview.dryRun).toBe(true)
    expect(preview.targets.map((t) => t.port).sort((x, y) => x - y)).toEqual([a, b])
    expect(preview.killed).toEqual([])
    expect(preview.survived).toEqual([])
    expect(pidAlive(pidA)).toBe(true)
    expect(pidAlive(pidB)).toBe(true)
    expect(formatReap(preview)).toContain('nothing was killed')

    // SIBLING PROJECTS' LISTENERS ARE REPORTED AND NEVER KILLED, however stray they
    // look. Every real listener on this machine is somebody else's relative to a
    // temp root, so this is exercised against real processes.
    expect(preview.spared.length).toBeGreaterThan(0)
    for (const s of preview.spared) expect(preview.targets).not.toContain(s)

    // A pidfile is what spares one of ours: `reap` is the command for a listener
    // nothing owns.
    writeDevPidfile(root, { name: 'owned', pid: pidA, port: a, startedAt: '', log: '' })
    const withPidfile = await devReap({ repoRoot: root, dryRun: true })
    expect(withPidfile.targets.map((t) => t.port)).toEqual([b])

    // …and the real thing kills exactly what the preview listed.
    fs.rmSync(path.join(devStateDir(root), 'owned.pid'))
    const done = await devReap({ repoRoot: root })
    expect(done.killed.map((k) => k.port).sort((x, y) => x - y)).toEqual([a, b])
    expect(done.survived).toEqual([])
    expect(done.ok).toBe(true)
    expect(await answering(a)).toBe(false)
    expect(await answering(b)).toBe(false)
  })

  it('test_UAT_FC_REQ-319_reap_distinguishes_killed_from_could_not_kill', async () => {
    // A DETACHED LISTENER STARTED FROM AN AGENT SANDBOX SURVIVES `kill -9` SENT FROM
    // INSIDE IT; only the operator can stop those, and a reaper that claimed success
    // would be lying. That condition cannot be manufactured, so the signal is the one
    // thing stubbed — it refuses, exactly as the kernel refuses there. Whether the
    // process is still listening afterwards is still read from a real `lsof` sweep.
    const root = tempRoot()
    const doomed = await freeBandPort(8870)
    const immortal = await freeBandPort(8880)
    const pidDoomed = await listener(doomed, root)
    const pidImmortal = await listener(immortal, root)

    const outcome = await devReap({
      repoRoot: root,
      kill: (pid, signal) => {
        if (pid === pidImmortal && signal !== 0) {
          throw Object.assign(new Error('kill EPERM'), { code: 'EPERM' })
        }
        process.kill(pid, signal)
      },
    })

    expect(outcome.killed.map((k) => k.port)).toEqual([doomed])
    expect(outcome.survived.map((s) => s.listener.port)).toEqual([immortal])
    expect(outcome.survived[0].detail).toContain('EPERM')
    expect(outcome.ok).toBe(false)
    expect(await answering(immortal)).toBe(true)

    const report = formatReap(outcome)
    expect(report).toContain('Killed 1')
    expect(report).toContain('COULD NOT KILL 1')
    expect(pidDoomed).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-319_reap_never_kills_its_own_process', async () => {
    // A reaper whose first act is suicide reports nothing at all, and `1c ps` is run
    // from inside the repository it is surveying.
    const port = await freeBandPort(8890)
    const server = net.createServer()
    await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
    try {
      const outcome = await devReap({ repoRoot: process.cwd(), dryRun: true })
      expect(outcome.targets.map((t) => t.pid)).not.toContain(process.pid)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})

// ── the launcher ─────────────────────────────────────────────────────────────

describe('bin/dev', () => {
  it('test_UAT_FC_REQ-319_bin_dev_is_a_launcher_for_the_three_verbs', () => {
    const script = fs.readFileSync(path.join('bin', 'dev'), 'utf8')
    expect(fs.statSync(path.join('bin', 'dev')).mode & 0o111).toBeTruthy()
    // A launcher, exactly like `bin/1c` and `bin/repro-console`: it composes no
    // behaviour of its own, so there is one implementation of these three verbs.
    expect(script).toContain('tools/generate/bin/1c.mjs" dev "$@"')
    for (const verb of ['up', 'down', 'reap']) expect(script).toContain(`bin/dev ${verb}`)
    // And the CLI answers all three plus `1c ps`, which is the table they read.
    const usage = execFileSync(process.execPath, ['tools/generate/bin/1c.mjs', 'help'], {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
    expect(usage).toContain('1c ps')
    expect(usage).toContain('1c dev up | down | reap')
  })
})
