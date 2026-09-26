/**
 * [[BUG-150]] — `bin/dev up` built the frozen environment and then served the
 * watching one.
 *
 * WHAT WAS WRONG. `bin/dev up` is the instructed way to start the local
 * environment. It ran `bin/deploy --env dev`, which wrote
 * `apps/control-app/.dev-snapshot/` and `apps/public-site/.dev-snapshot/` — and
 * then started `1c builder` on 8788 and `pnpm --filter … dev` on 8787, both
 * `wrangler dev` over `src/`, while nothing at all listened on the snapshot's
 * port. [[REQ-318]] had built the frozen environment; the operator was handed the
 * watching one.
 *
 * THE COST WAS MEASURED, NOT HYPOTHESISED. In one thirteen-minute stretch the
 * 8788 builder was restarted FOUR TIMES by merges landing in the checkout's own
 * branch, once three minutes into a live consultant turn, and once against a root
 * `package.json` still holding `<<<<<<< HEAD` — which did not restart the builder
 * but broke it. The operator believed he was on the frozen environment because he
 * had started it the way he was told to. **He had no way to know what he was
 * running.** That is the defect: not the restart, but that the question "what am
 * I running?" had no answer even after doing the right thing.
 *
 * WHAT THESE UATs PIN, in the order the ticket's acceptance states it:
 *
 *   1. `bin/dev up` leaves no `wrangler dev` reading `src/` — asserted the way
 *      EPIC-16 §K asked it, on the argv: every path under `.dev-snapshot/` or
 *      `.wrangler/state`, none under `src/`.
 *   2. `bin/dev up` prints, per served app, what is being served and when it was
 *      deployed — including for a port something else was already answering on,
 *      which is where the question is least answerable.
 *   3. `bin/deploy --env dev` remains the only way to change what is served: the
 *      argv names a bundle and `--no-bundle` means there is no compile step to
 *      re-run, so a source edit is not something the running server can see.
 *   4. Every entry point that served from the changing tree is DELETED — `pnpm
 *      dev`, `pnpm dev:control`, `pnpm dev:public`, the public site's own `dev`
 *      script, `1c builder`, and `wranglerDevArgs`, which existed only to compose
 *      the retired command line.
 *   5. `bin/dev down` stops what `up` started and `1c ps` names it correctly.
 *
 * NO REAL DEV PORT IS BOUND, for the reason the [[REQ-319]] and [[REQ-322]]
 * suites give: a suite that listened on 8787 or 8789 would fight the operator's
 * own running environment. The process half is proven with stand-in services on
 * free ports carrying the real names; the freeze half is proven on the argv and
 * on the text, which is where the mechanism actually lives.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import {
  DEV_SERVICES,
  devDown,
  devUp,
  formatUp,
  readDevPidfiles,
  type DevService,
} from '../tools/generate/src/cli/dev'
import {
  DEFAULT_SERVE_APP,
  DEV_SERVE_APPS,
  DEV_SERVE_PORT,
  devServeApp,
  devServeArgs,
  PUBLIC_SITE_SERVE_PORT,
  SNAPSHOT_DIR,
  SNAPSHOT_MANIFEST,
  snapshotDir,
  snapshotSummary,
  type DevSnapshot,
} from '../tools/generate/src/cli/dev-snapshot'
import { inDevPortBand, KNOWN_SERVICES, knownPort } from '../tools/generate/src/cli/ps'
import { WORKERD_GATED_COMMANDS } from '../tools/generate/src/cli/workerd'
import { STATE_DIR } from '../tools/generate/src/cli/reset'

const REPO = path.resolve(import.meta.dirname, '..')

const tempRoots: string[] = []
const children: number[] = []

afterEach(() => {
  for (const pid of children.splice(0)) {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* already gone */
    }
  }
  for (const dir of tempRoots.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function tempRoot(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bug150-'))
  tempRoots.push(dir)
  return dir
}

/** A port inside the dev band that nothing currently holds. */
async function freeBandPort(from: number): Promise<number> {
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

/** A stand-in service: the real NAME, a free port, and a process that binds it. */
function standIn(service: DevService, port: number): DevService {
  return {
    ...service,
    port,
    argv: [process.execPath, '-e', `require('node:net').createServer().listen(${port}, '127.0.0.1')`],
  }
}

/** A snapshot manifest on disk, so `up` can report what is being served. */
function writeSnapshot(root: string, app: string, over: Partial<DevSnapshot> = {}): DevSnapshot {
  const snapshot: DevSnapshot = {
    app,
    env: 'dev',
    worker: `1stcontact-${app}-dev`,
    entry: 'worker/worker.js',
    assets: null,
    deployedAt: '2026-09-26T09:15:00Z',
    commit: 'cafe123',
    ...over,
  }
  const dir = snapshotDir(root, app)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, SNAPSHOT_MANIFEST), `${JSON.stringify(snapshot, null, 2)}\n`)
  return snapshot
}

/** The package manifests the ticket names, parsed. */
function manifest(rel: string): { scripts?: Record<string, string> } {
  return JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8')) as { scripts?: Record<string, string> }
}

// ── 1 — nothing `up` starts reads `src/` ─────────────────────────────────────

describe('BUG-150 — bin/dev up serves the snapshot and nothing else', () => {
  it('test_UAT_FC_BUG-150_up_starts_the_two_snapshots_and_no_watcher', () => {
    const names = DEV_SERVICES.map((s) => s.name)

    // FOUR, AND THE BUILDER IS NOT ONE OF THEM. It was five, and two of the five
    // were `wrangler dev` over `src/`. `dev` is the control app's snapshot and
    // `public-site` is now the public site's, on the port `pnpm dev:public` used.
    expect(names).toEqual(['filing', 'dev', 'public-site', 'access-sim'])
    expect(names).not.toContain('builder')

    // EACH SNAPSHOT SERVICE INVOKES `1c dev serve <app>` — the existing entry
    // point, named explicitly, rather than a second way to launch the same thing.
    for (const app of DEV_SERVE_APPS) {
      const service = DEV_SERVICES.find((s) => s.name === app.service)
      expect(service?.argv).toEqual(['bin/1c', 'dev', 'serve', app.app])
      expect(service?.port).toBe(app.port)
    }

    // NOT ONE SURVIVING ARGV NAMES THE RETIRED PATHS, which is the half an
    // operator could reach by habit.
    const argvs = DEV_SERVICES.map((s) => s.argv.join(' '))
    for (const argv of argvs) {
      expect(argv).not.toContain('1c builder')
      expect(argv).not.toMatch(/pnpm .*\bdev\b/)
    }

    // `bin/access-sim` proxies to the server it fronts, so that server cannot be
    // started after it — unchanged from [[REQ-322]], and now the only ordering
    // constraint left.
    expect(names.indexOf('dev')).toBeLessThan(names.indexOf('access-sim'))

    // EVERY NAME AND PORT COMES OUT OF THE ONE TABLE, which is what makes `down`
    // and `reap` cover these services with no further change: the name is the
    // pidfile's stem and `1c ps` recognises the port because that table declares
    // it.
    for (const service of DEV_SERVICES) {
      expect(KNOWN_SERVICES).toContainEqual(
        expect.objectContaining({ name: service.name, port: service.port }),
      )
    }
  })

  it('test_UAT_FC_BUG-150_every_served_path_is_the_snapshot_or_the_store', () => {
    // THE ACCEPTANCE CONDITION AS EPIC-16 §K ASKED FOR IT: on the argv, every
    // path under `.dev-snapshot/` or `.wrangler/state`, none under `src/`. This is
    // the whole freeze — `wrangler dev` has no `--no-watch`, so an environment is
    // frozen by WHAT IS WATCHED and by nothing else.
    for (const app of DEV_SERVE_APPS) {
      const appDir = path.join(REPO, 'apps', app.app)
      const snapshot = writeSnapshot(tempRoot(), app.app, { assets: 'assets' })
      const argv = devServeArgs({ appDir, snapshot, port: app.port, envFiles: app.envFiles })

      // THE ENV-FILE ARGUMENTS ARE A SEPARATE CLASS AND ARE EXCLUDED HERE. The
      // layering deliberately names a file OUTSIDE the repository — the
      // operator's own key, which arrives from elsewhere and must not live in
      // `.dev.vars` ([[BUG-50]]) — so it is neither the snapshot nor the store
      // and never was. It carries no code; what this assertion is about is what
      // the Worker is BUILT from.
      const envFiles = new Set(
        argv.filter((_, i) => i > 0 && argv[i - 1] === '--env-file'),
      )
      const paths = argv.filter((a) => !envFiles.has(a) && (a.includes('/') || a.includes('\\')))
      expect(paths.length).toBeGreaterThan(0)
      for (const p of paths) {
        expect(
          p.startsWith(SNAPSHOT_DIR) || p.startsWith(STATE_DIR),
          `${app.app}: ${p} is neither the snapshot nor the store`,
        ).toBe(true)
        expect(p).not.toContain('src/')
      }

      // …AND THE TWO ARGUMENTS THAT ARE THE FREEZE. The bundle rather than the
      // source entry, and no compile step to re-run.
      expect(argv).toContain('--no-bundle')
      expect(argv).toContain(path.join(SNAPSHOT_DIR, snapshot.entry))
      expect(argv[argv.indexOf('--env') + 1]).toBe('dev')
      expect(argv[argv.indexOf('--port') + 1]).toBe(String(app.port))
    }
  })

  it('test_UAT_FC_BUG-150_the_public_site_is_served_on_the_port_its_script_used', () => {
    // 8787 IS WHERE THE PUBLIC SITE HAS ALWAYS BEEN. `pnpm dev:public` ran
    // `wrangler dev --port 8787`; that script is deleted, and the frozen server
    // takes the port rather than a sixth number — so habit, a bookmark and an old
    // shell history line all land on the frozen server rather than on nothing.
    expect(PUBLIC_SITE_SERVE_PORT).toBe(8787)
    expect(knownPort('public-site')).toBe(PUBLIC_SITE_SERVE_PORT)
    expect(DEV_SERVE_PORT).toBe(8789)
    expect(knownPort('dev')).toBe(DEV_SERVE_PORT)

    // TWO PORTS, BOTH INSIDE THE BAND `1c ps` SURVEYS AND `bin/dev reap` SWEEPS.
    expect(inDevPortBand(PUBLIC_SITE_SERVE_PORT)).toBe(true)
    expect(inDevPortBand(DEV_SERVE_PORT)).toBe(true)
    expect(PUBLIC_SITE_SERVE_PORT).not.toBe(DEV_SERVE_PORT)

    // THE LAYERING IS THE CONTROL APP'S. `--env-file` REPLACES wrangler's own
    // `.dev.vars` lookup rather than adding to it, so naming it for an app with
    // no such file substitutes absent paths for a default that works.
    const publicSite = devServeApp('public-site')
    expect(publicSite?.envFiles).toBe(false)
    expect(publicSite?.checkStore).toBe(false)
    const publicArgv = devServeArgs({
      appDir: path.join(REPO, 'apps', 'public-site'),
      snapshot: writeSnapshot(tempRoot(), 'public-site'),
      port: PUBLIC_SITE_SERVE_PORT,
      envFiles: false,
    })
    expect(publicArgv).not.toContain('--env-file')

    // …AND THE CONTROL APP'S LAUNCH STILL CARRIES IT, unchanged by any of this
    // ([[BUG-50]], [[BUG-146]]): the layering was never a property of which
    // command ran.
    const control = devServeApp('control-app')
    expect(control?.envFiles).toBe(true)
    expect(control?.checkStore).toBe(true)
    const controlArgv = devServeArgs({
      appDir: path.join(REPO, 'apps', 'control-app'),
      snapshot: writeSnapshot(tempRoot(), 'control-app'),
      port: DEV_SERVE_PORT,
    })
    expect(controlArgv.filter((a) => a === '--env-file')).toHaveLength(3)
  })

  it('test_UAT_FC_BUG-150_dev_serve_takes_the_app_and_refuses_an_unknown_one', () => {
    // ONE COMMAND WITH AN ARGUMENT, not a second command. `1c dev serve`
    // hard-coded `control-app`, which is why `up` had to start the public site
    // some other way — and the only other way was `wrangler dev` over `src/`.
    expect(DEFAULT_SERVE_APP.app).toBe('control-app')
    expect(DEV_SERVE_APPS.map((a) => a.app)).toEqual(['control-app', 'public-site'])

    // BOTH SPELLINGS RESOLVE, because the operator has both: `1c ps` and `bin/dev`
    // call the control app's snapshot `dev`, while `apps/control-app` is what it
    // is on disk and what `bin/deploy` prints.
    expect(devServeApp('control-app')?.app).toBe('control-app')
    expect(devServeApp('dev')?.app).toBe('control-app')
    expect(devServeApp('public-site')?.app).toBe('public-site')
    expect(devServeApp('nope')).toBeNull()

    // AND THE CLI REFUSES A TYPO RATHER THAN SERVING THE DEFAULT, which would
    // answer a question the operator did not ask on a port they were not
    // watching. Exit 4 is the CLI's NOT_FOUND.
    let refusal = ''
    let code = 0
    try {
      execFileSync(path.join(REPO, 'bin', '1c'), ['dev', 'serve', 'nope'], {
        cwd: REPO,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string }
      code = e.status ?? 0
      refusal = `${e.stdout ?? ''}${e.stderr ?? ''}`
    }
    expect(code).not.toBe(0)
    expect(refusal).toContain("There is no dev app called 'nope'")
    expect(refusal).toContain('control-app (8789), public-site (8787)')
  })
})

// ── 2 — `up` says what it is serving ─────────────────────────────────────────

describe('BUG-150 — starting the environment says what it is serving', () => {
  it('test_UAT_FC_BUG-150_up_reports_the_snapshot_for_every_served_app', async () => {
    const root = tempRoot()
    const control = writeSnapshot(root, 'control-app', { commit: 'aaa1111' })
    const site = writeSnapshot(root, 'public-site', {
      commit: 'bbb2222',
      deployedAt: '2026-09-26T09:15:09Z',
    })

    const services: DevService[] = []
    let next = 8850
    for (const service of DEV_SERVICES) {
      const port = await freeBandPort(next)
      next = port + 1
      services.push(standIn(service, port))
    }

    const outcome = await devUp({ repoRoot: root, services, timeoutMs: 15_000 })
    for (const started of outcome.started) children.push(started.pid)
    expect(outcome.ok).toBe(true)

    // ONE ENTRY PER SERVED APP, and only for the served apps: filing and
    // access-sim serve no snapshot and have nothing to report.
    expect(outcome.served.map((s) => s.name)).toEqual(['dev', 'public-site'])
    expect(outcome.served.every((s) => s.fresh)).toBe(true)
    expect(outcome.served.map((s) => s.snapshot?.commit)).toEqual(['aaa1111', 'bbb2222'])

    // THE OPERATOR MUST NOT HAVE TO RUN A SECOND COMMAND. Everything `1c dev
    // serve` prints, `bin/dev up` prints too — worker, environment, deploy time,
    // commit, the snapshot path, and the sentence that says it is frozen.
    const printed = formatUp(outcome)
    for (const snapshot of [control, site]) {
      expect(printed).toContain(snapshot.worker)
      expect(printed).toContain(snapshot.deployedAt)
      expect(printed).toContain(snapshot.commit)
      expect(printed).toContain(`apps/${snapshot.app}/${SNAPSHOT_DIR}/${snapshot.entry}`)
    }
    expect(printed.match(/FROZEN: editing a source file changes nothing here/g)).toHaveLength(2)
    expect(printed).toContain('bin/deploy --env dev')
  })

  it('test_UAT_FC_BUG-150_a_port_already_answering_is_reported_as_the_snapshot_on_disk', async () => {
    // THE STATE THE DEFECT LIVED IN. `up` leaves a live port alone rather than
    // duplicating it — correctly — but it neither spawned that process nor can
    // ask it what it loaded. Silence there is this ticket's defect one level down;
    // reporting the manifest as if it described the incumbent is the same defect
    // wearing a report.
    const root = tempRoot()
    writeSnapshot(root, 'control-app')

    const port = await freeBandPort(8860)
    const incumbent = net.createServer()
    await new Promise<void>((resolve) => incumbent.listen(port, '127.0.0.1', resolve))
    try {
      const dev = DEV_SERVICES.find((s) => s.name === 'dev')
      const outcome = await devUp({
        repoRoot: root,
        services: [{ ...dev!, port }],
        timeoutMs: 15_000,
      })
      expect(outcome.alreadyUp.map((a) => a.name)).toEqual(['dev'])
      expect(outcome.served.map((s) => ({ name: s.name, fresh: s.fresh }))).toEqual([
        { name: 'dev', fresh: false },
      ])

      const printed = formatUp(outcome)
      expect(printed).toContain('snapshot ON DISK')
      expect(printed).toContain('bin/dev restart dev')
    } finally {
      await new Promise<void>((resolve) => incumbent.close(() => resolve()))
    }
  })

  it('test_UAT_FC_BUG-150_an_app_with_no_snapshot_is_named_rather_than_silent', async () => {
    // A SERVICE THAT CAME UP OVER A DIRECTORY NOTHING HAS DEPLOYED TO CANNOT BE
    // THE SNAPSHOT SERVER: `1c dev serve` refuses without a manifest. So this row
    // exists precisely when something ELSE is answering on that port — which is
    // the state the operator most needs named, and the one `up` used to pass over.
    const root = tempRoot()
    const port = await freeBandPort(8870)
    const incumbent = net.createServer()
    await new Promise<void>((resolve) => incumbent.listen(port, '127.0.0.1', resolve))
    try {
      const dev = DEV_SERVICES.find((s) => s.name === 'dev')
      const outcome = await devUp({ repoRoot: root, services: [{ ...dev!, port }], timeoutMs: 15_000 })
      expect(outcome.served).toEqual([
        { name: 'dev', app: 'control-app', port, snapshot: null, fresh: false },
      ])
      const printed = formatUp(outcome)
      expect(printed).toContain('holds no snapshot')
      expect(printed).toContain('bin/deploy --env dev')
    } finally {
      await new Promise<void>((resolve) => incumbent.close(() => resolve()))
    }
  })

  it('test_UAT_FC_BUG-150_the_banner_names_the_app_it_is_describing', () => {
    // TWO SERVERS MEANS TWO BANNERS, and a banner that said "Dev environment" for
    // both would be a report an operator has to count lines in to read.
    const control = writeSnapshot(tempRoot(), 'control-app')
    const site = writeSnapshot(tempRoot(), 'public-site')
    const controlText = snapshotSummary(control, DEV_SERVE_PORT, devServeApp('control-app')!)
    const siteText = snapshotSummary(site, PUBLIC_SITE_SERVE_PORT, devServeApp('public-site')!)

    expect(controlText).toContain('Dev environment')
    expect(controlText).toContain(`127.0.0.1:${DEV_SERVE_PORT}`)
    expect(siteText).toContain('Public site')
    expect(siteText).toContain(`127.0.0.1:${PUBLIC_SITE_SERVE_PORT}`)
    // `devUrl`, NOT `localhost` ([[BUG-146]]): the cookie access-sim sets is
    // host-scoped, so naming the other host logs the operator out again.
    expect(controlText).not.toContain('localhost')
    expect(siteText).not.toContain('localhost')

    // AND BOTH SAY THE SAME THING ABOUT THE FREEZE, because it is the same fact.
    for (const text of [controlText, siteText]) {
      expect(text).toContain('FROZEN: editing a source file changes nothing here until')
      expect(text).toContain('bin/deploy --env dev')
    }
  })
})

// ── 3 — the retired entry points are deleted ─────────────────────────────────

describe('BUG-150 — every server that reads the changing tree is deleted', () => {
  it('test_UAT_FC_BUG-150_no_package_script_serves_from_source', () => {
    // NOT DEPRECATED, NOT FLAGGED OFF — DELETED, so it cannot be reached by
    // habit, by an old shell history line, or by an agent reading package.json.
    const root = manifest('package.json').scripts ?? {}
    expect(root).not.toHaveProperty('dev')
    expect(root).not.toHaveProperty('dev:control')
    expect(root).not.toHaveProperty('dev:public')

    const site = manifest('apps/public-site/package.json').scripts ?? {}
    expect(site).not.toHaveProperty('dev')

    // THE TICKET'S OWN GREP. No manifest may hold a `wrangler dev` at all: the
    // only launcher left is `1c dev serve`, which composes one from the snapshot.
    for (const rel of ['package.json', 'apps/public-site/package.json', 'apps/control-app/package.json']) {
      const scripts = Object.values(manifest(rel).scripts ?? {})
      for (const script of scripts) {
        expect(script, `${rel}: ${script}`).not.toContain('wrangler dev')
        expect(script, `${rel}: ${script}`).not.toContain('1c builder')
      }
    }
  })

  it('test_UAT_FC_BUG-150_1c_builder_is_not_a_command', () => {
    // THE ENTRY POINT ITSELF. `case 'builder'` is gone from the CLI, so the verb
    // falls through to the unknown-command path — which REFUSES rather than
    // starting a watcher, and says so on stderr with a non-zero exit.
    let refusal = ''
    let code = 0
    try {
      execFileSync(path.join(REPO, 'bin', '1c'), ['builder'], {
        cwd: REPO,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string }
      code = e.status ?? 0
      refusal = `${e.stdout ?? ''}${e.stderr ?? ''}`
    }
    expect(code).not.toBe(0)
    expect(refusal).toContain('Unknown command: builder')

    // AND IT IS NOT IN THE HELP EITHER, which is the other place an operator or
    // an agent would find it.
    const help = execFileSync(path.join(REPO, 'bin', '1c'), ['help'], {
      cwd: REPO,
      encoding: 'utf8',
    })
    expect(help).not.toMatch(/^\s+1c builder/m)
    expect(help).toContain('1c dev up | down | reap | restart | serve')
  })

  it('test_UAT_FC_BUG-150_nothing_composes_a_wrangler_dev_over_src', () => {
    // `wranglerDevArgs` EXISTED ONLY TO BUILD THE RETIRED COMMAND LINE — no
    // `--env`, so the top-level block; no `--no-bundle`, so it watched. A function
    // whose only job is that is the thing an agent resurrects, so it is deleted
    // rather than left unused.
    const devEnv = fs.readFileSync(path.join(REPO, 'tools/generate/src/cli/dev-env.ts'), 'utf8')
    expect(devEnv).not.toContain('export function wranglerDevArgs')

    // ONE SOURCE-TREE-SERVING ARGV IS ALL IT WOULD TAKE, so the assertion is over
    // the whole CLI rather than over the one file that used to hold it.
    const cliDir = path.join(REPO, 'tools/generate/src/cli')
    const offenders: string[] = []
    const walk = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(full)
          continue
        }
        if (!entry.name.endsWith('.ts')) continue
        const text = fs.readFileSync(full, 'utf8')
        // The literal pair `'wrangler', 'dev'` in an array is how an argv is
        // composed here; `devServeArgs` is the one that may.
        if (/'wrangler',\s*\n?\s*'dev',/.test(text) && !full.endsWith('dev-snapshot.ts')) {
          offenders.push(path.relative(REPO, full))
        }
      }
    }
    walk(cliDir)
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_BUG-150_the_workerd_gate_still_covers_every_store_opening_path', () => {
    // DELETING A COMMAND MUST NOT UN-GATE A STORE. `builder` headed
    // `WORKERD_GATED_COMMANDS` because it opened `.wrangler/state`, which holds
    // the only copy of the dev data and which the first workerd to open migrates
    // forward silently and one-way. Every surviving path that opens it is still
    // here.
    expect(WORKERD_GATED_COMMANDS).not.toContain('builder')
    for (const gated of ['dev up', 'dev restart', 'dev serve']) {
      expect(WORKERD_GATED_COMMANDS).toContain(gated)
    }
  })

  it('test_UAT_FC_BUG-150_the_retired_port_is_still_named_by_ps', () => {
    // 8788 HAS NO CONSTANT AND STILL HAS A ROW. Nothing starts it — `bin/dev up
    // builder` is an error naming the services that exist — but a builder left
    // running from before this landed, or from an `.xgd` worktree since torn down,
    // would otherwise be the UNNAMED stray `1c ps` exists to make legible.
    const retired = KNOWN_SERVICES.find((s) => s.port === 8788)
    expect(retired?.name).toBe('builder')
    expect(retired?.what).toContain('RETIRED')
    expect(DEV_SERVICES.some((s) => s.name === 'builder')).toBe(false)
  })
})

// ── 4 — down and ps still cover what up started ──────────────────────────────

describe('BUG-150 — down stops what up started, and ps names it', () => {
  it('test_UAT_FC_BUG-150_up_records_all_four_and_down_frees_them', async () => {
    // [[BUG-147]] MUST NOT REGRESS: the snapshot servers have the same
    // wrapper/grandchild shape the builder had, so the pidfile and the
    // process-group signal are the same mechanism on a different table.
    const root = tempRoot()
    writeSnapshot(root, 'control-app')
    writeSnapshot(root, 'public-site')

    const services: DevService[] = []
    let next = 8820
    for (const service of DEV_SERVICES) {
      const port = await freeBandPort(next)
      next = port + 1
      services.push(standIn(service, port))
    }

    const up = await devUp({ repoRoot: root, services, timeoutMs: 15_000 })
    for (const started of up.started) children.push(started.pid)
    expect(up.ok).toBe(true)
    expect(up.failed).toEqual([])
    expect(up.started.map((s) => s.name)).toEqual(['filing', 'dev', 'public-site', 'access-sim'])

    expect(readDevPidfiles(root).map((p) => p.name).sort()).toEqual([
      'access-sim',
      'dev',
      'filing',
      'public-site',
    ])

    const down = await devDown({ repoRoot: root })
    expect(down.ok).toBe(true)
    expect(down.stopped.map((s) => s.name).sort()).toEqual([
      'access-sim',
      'dev',
      'filing',
      'public-site',
    ])
    expect(down.stillListening).toEqual([])
    expect(readDevPidfiles(root)).toEqual([])
  })
})
