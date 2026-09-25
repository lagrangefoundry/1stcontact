/**
 * [[REQ-318]] — a local dev environment that is DEPLOYED TO, not edited into.
 *
 * WHAT WAS WRONG. Locally there was no boundary at all. `pnpm dev` runs
 * `1c builder`, which runs `wrangler dev` with no `--env` — so it read the
 * top-level `wrangler.toml` block, WATCHED the source, and persisted to
 * `apps/control-app/.wrangler/state`. The running Worker and the file being
 * edited were the same bytes, continuously: a half-finished function or a
 * just-written migration was immediately what served.
 *
 * WHAT THIS TICKET DID. `bin/deploy` gained a TARGET TABLE — given an
 * environment, how do I ship to it — so that `--env dev` selects a LOCAL target
 * that bundles to `apps/<app>/.dev-snapshot/` and uploads nothing. Everything
 * before that terminal verb is identical to a cloud deploy: the same hook
 * directories in the same order, the same `DEPLOY_ENV`, the same capability
 * report. `1c dev serve` then runs `wrangler dev --no-bundle` against the
 * snapshot, which is frozen by construction rather than by a flag wrangler does
 * not have.
 *
 * WHAT THESE UATs PIN, in the order the ticket's acceptance states it:
 *
 *   1. `bin/deploy --env dev` completes, runs the same hooks in the same order,
 *      and prints the same capability report.
 *   2. After a deploy, editing a source file changes NOTHING about what the dev
 *      environment serves; a second deploy picks the edit up. This is measured
 *      against real bundles rather than asserted about the argv.
 *   3. The dev target resolves its D1 binding from `[env.dev]`, and
 *      `ACCESS_DEV_OPEN` is what that block says rather than inherited — pinned
 *      TOGETHER with the target table, because the var is only safe while the
 *      environment cannot leave the machine.
 *   4. The store is guarded before it is opened: `dev serve` is gated on exactly
 *      one `workerd`, and `bin/deploy`'s local path runs that check ahead of
 *      every hook.
 *   5. The old `pnpm dev` path still works, on its own port, against the same
 *      store.
 *
 * NO SERVER IS STARTED HERE. The freeze is a property of the BYTES the runner is
 * pointed at, so it is proven by hashing them either side of a source edit —
 * which is stronger evidence than a request against a server, and does not leave
 * a listener behind when a suite is interrupted.
 */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { readWranglerConfig } from './support/wrangler-toml'
import { migrateHookHarness, sha256 as hashOf } from './support/migrate-hook'
import { readLocalD1Binding } from '../tools/generate/src/cli/d1-migrations'
import {
  DEV_SERVE_PORT,
  devServeArgs,
  noSnapshotMessage,
  readSnapshot,
  snapshotDir,
  SNAPSHOT_DIR,
  type DevSnapshot,
} from '../tools/generate/src/cli/dev-snapshot'
import { wranglerDevArgs } from '../tools/generate/src/cli/dev-env'
import { KNOWN_SERVICES, inDevPortBand } from '../tools/generate/src/cli/ps'
import { assertOneWorkerd, WORKERD_GATED_COMMANDS } from '../tools/generate/src/cli/workerd'
import { CommandError } from '../tools/generate/src/cli/errors'

const REPO = path.resolve(import.meta.dirname, '..')
const DEPLOY = path.join(REPO, 'bin', 'deploy')
const CONTROL_APP = path.join(REPO, 'apps', 'control-app')
const PUBLIC_SITE = path.join(REPO, 'apps', 'public-site')

/** Run `bin/deploy`, returning whatever it printed on either stream. */
function deploy(args: string[]): { ok: boolean; output: string } {
  try {
    const stdout = execFileSync(DEPLOY, args, {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10 * 60_000,
    })
    return { ok: true, output: stdout }
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string }
    return { ok: false, output: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

describe('REQ-318 — the local dev environment is a deploy target', () => {
  /**
   * AC — "runs the same hooks in the same order as a cloud deploy, and prints
   * the same capability report".
   *
   * DRIVEN THROUGH A TEMPORARY HOOK, which is how REQ-144 proved the same
   * contract for the cloud target: a hook is any executable file in the
   * directory, so a `99-` one runs last and reports what it was told. What is
   * asserted is that BOTH directories ran, migrate before secrets, with
   * `DEPLOY_ENV=dev` and `DEPLOY_TARGET=local` — the new variable being the only
   * thing that distinguishes the two targets from a hook's point of view.
   *
   * ON `public-site`, because every real hook gates on `control-app` and exits
   * 0 immediately for it — so this exercises the driver without applying a
   * migration or reaching a credential.
   */
  it('test_UAT_FC_REQ-318_the_local_target_runs_the_same_hooks_in_the_same_order', () => {
    const hooks = ['migrate', 'secrets'].map((kind) => ({
      kind,
      file: path.join(REPO, 'bin', 'deploy.d', kind, '99-uat-req318'),
    }))
    for (const hook of hooks) {
      writeFileSync(
        hook.file,
        '#!/usr/bin/env bash\n' +
          `echo "req318 ${hook.kind} env=$DEPLOY_ENV target=$DEPLOY_TARGET app=$DEPLOY_APP dry=$DEPLOY_DRY_RUN"\n`,
      )
      chmodSync(hook.file, 0o755)
    }
    try {
      const { ok, output } = deploy(['--env', 'dev', '--dry-run', 'public-site'])
      expect(ok, output).toBe(true)

      const migrate = output.indexOf('req318 migrate env=dev target=local app=public-site dry=1')
      const secrets = output.indexOf('req318 secrets env=dev target=local app=public-site dry=1')
      expect(migrate, `migrate hook did not run at the dev target:\n${output}`).toBeGreaterThan(-1)
      expect(secrets, `secrets hook did not run at the dev target:\n${output}`).toBeGreaterThan(-1)
      // The ordering is the point: a migration that fails must stop the code
      // that assumes it ran, whichever target is selected.
      expect(secrets).toBeGreaterThan(migrate)

      // The same capability report, in the same place — after the ship step and
      // before the deployed list.
      expect(output).toContain('==> Capabilities')
      expect(output.indexOf('==> Capabilities')).toBeGreaterThan(secrets)
      expect(output).toContain('==> Deployed')
      expect(output.indexOf('==> Deployed')).toBeGreaterThan(output.indexOf('==> Capabilities'))
      // And it announced the target it selected, so a local deploy is legible as
      // one in a log rather than indistinguishable from a cloud deploy.
      expect(output).toContain('(--env dev, local)')
    } finally {
      for (const hook of hooks) rmSync(hook.file, { force: true })
    }
  })

  /**
   * The other row of the table still reads `cloud`, which is what makes it a
   * table rather than a special case for one environment.
   */
  it('test_UAT_FC_REQ-318_every_other_environment_still_ships_to_the_cloud', () => {
    const { ok, output } = deploy(['--env', 'production', '--dry-run', 'public-site'])
    expect(ok, output).toBe(true)
    expect(output).toContain('(--env production, cloud)')
    // The cloud target composes an upload; nothing is written beside the app.
    expect(output).not.toContain(SNAPSHOT_DIR)
  })

  /**
   * THE ACCEPTANCE CONDITION OF THE WHOLE TICKET: "editing a source file changes
   * nothing about what the dev environment serves; a second `bin/deploy --env
   * dev` picks the edit up."
   *
   * MEASURED ON REAL BUNDLES. A source file gains a marker; the snapshot is
   * hashed before and after and must be byte-identical, because nothing watches
   * it. Then a second deploy runs and the marker appears. The marker is an
   * exported const rather than a comment: esbuild drops comments and keeps the
   * module's exports, so this survives the bundler for a reason rather than by
   * luck.
   *
   * ON `public-site` — the small Worker, and the one whose hooks are all no-ops
   * — so this costs two bundles and touches no store.
   */
  it('test_UAT_FC_REQ-318_a_source_edit_changes_nothing_until_the_next_deploy', () => {
    const source = path.join(PUBLIC_SITE, 'src', 'index.ts')
    const original = readFileSync(source, 'utf8')
    const marker = `req318_${createHash('sha256').update(original).digest('hex').slice(0, 12)}`
    const snapshot = path.join(PUBLIC_SITE, SNAPSHOT_DIR)
    // The suite must leave the operator's snapshot as it found it, or the next
    // `1c dev serve` would be serving whatever a test last built.
    const existing = readSnapshot({ repoRoot: REPO, app: 'public-site' }) !== null
    const keep = existing ? mkdtempSync(path.join(tmpdir(), 'req318-')) : null
    if (keep !== null) cpSync(snapshot, path.join(keep, 'snapshot'), { recursive: true })

    try {
      expect(deploy(['--env', 'dev', 'public-site']).ok).toBe(true)
      const manifest = readSnapshot({ repoRoot: REPO, app: 'public-site' })
      expect(manifest, 'the deploy wrote no snapshot manifest').not.toBeNull()
      const entry = path.join(snapshot, (manifest as DevSnapshot).entry)
      const before = sha256(entry)
      expect(readFileSync(entry, 'utf8')).not.toContain(marker)

      // THE EDIT. Under the old path this reaches the running Worker within a
      // second; here it must reach nothing at all.
      writeFileSync(source, `${original}\nexport const __req318 = '${marker}'\n`)
      expect(sha256(entry), 'the snapshot changed without a deploy').toBe(before)

      // …and the deploy is what picks it up.
      expect(deploy(['--env', 'dev', 'public-site']).ok).toBe(true)
      expect(readFileSync(entry, 'utf8')).toContain(marker)
    } finally {
      writeFileSync(source, original)
      rmSync(snapshot, { recursive: true, force: true })
      if (keep !== null) {
        cpSync(path.join(keep, 'snapshot'), snapshot, { recursive: true })
        rmSync(keep, { recursive: true, force: true })
      }
    }
  }, 600_000)

  /**
   * The snapshot manifest is the CONTRACT between the deploy and the runner, and
   * it exists so the runner derives nothing for itself. A second derivation of
   * the entry file's name — recomputing `main`'s basename here, say — would be a
   * second opinion free to disagree with the one that produced the bytes.
   */
  it('test_UAT_FC_REQ-318_the_deploy_records_what_the_runner_needs_to_read', () => {
    expect(deploy(['--env', 'dev', 'public-site']).ok).toBe(true)
    try {
      const manifest = readSnapshot({ repoRoot: REPO, app: 'public-site' })
      expect(manifest).not.toBeNull()
      const snapshot = manifest as DevSnapshot
      expect(snapshot.app).toBe('public-site')
      expect(snapshot.env).toBe('dev')
      // The name out of `[env.dev].name`, which is what `bin/deploy` reports —
      // and is NOT production's, so a local deploy cannot be read as one.
      expect(snapshot.worker).toBe('1stcontact-public-site-dev')
      expect(snapshot.worker).not.toBe('1stcontact-public-site')
      // `main = "src/index.ts"` → `index.js`, derived from the config by the
      // deploy and checked to exist before the manifest was written.
      expect(snapshot.entry).toBe('worker/index.js')
      expect(readFileSync(path.join(snapshotDir(REPO, 'public-site'), snapshot.entry), 'utf8').length)
        .toBeGreaterThan(0)
      expect(snapshot.deployedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    } finally {
      rmSync(path.join(PUBLIC_SITE, SNAPSHOT_DIR), { recursive: true, force: true })
    }
  }, 600_000)

  /**
   * The runner's whole argv, which is where the freeze is expressed.
   *
   * THE ASSERTION THAT MATTERS IS THE NEGATIVE ONE: no argument names anything
   * under `src/`. `--no-bundle` removes the compile step and the entry is the
   * already-built bundle, so there is nothing for wrangler to watch that a
   * source edit could touch.
   */
  it('test_UAT_FC_REQ-318_the_runner_is_pointed_only_at_the_snapshot', () => {
    const snapshot: DevSnapshot = {
      app: 'control-app',
      env: 'dev',
      worker: '1stcontact-control-app-dev',
      entry: 'worker/worker.js',
      assets: 'assets',
      deployedAt: '2026-09-25T00:00:00Z',
      commit: 'abc1234',
    }
    const args = devServeArgs({ appDir: CONTROL_APP, snapshot, port: DEV_SERVE_PORT })

    expect(args.slice(0, 2)).toEqual(['wrangler', 'dev'])
    expect(args).toContain('--no-bundle')
    expect(args[2]).toBe(path.join(SNAPSHOT_DIR, 'worker/worker.js'))
    expect(args).toContain('--env')
    expect(args[args.indexOf('--env') + 1]).toBe('dev')
    // The FROZEN assets, not the live `dist-assets` the config names: that
    // directory is rebuilt by `1c assets`, and a live read would leave the
    // builder client as the one unfrozen part of the environment.
    expect(args[args.indexOf('--assets') + 1]).toBe(path.join(SNAPSHOT_DIR, 'assets'))
    // The store, stated rather than defaulted — and it is the same store the old
    // path persists to, because there is only one copy of the dev data.
    expect(args[args.indexOf('--persist-to') + 1]).toBe(path.join('.wrangler', 'state'))
    expect(args[args.indexOf('--port') + 1]).toBe(String(DEV_SERVE_PORT))
    // The env-file layering is REUSED rather than restated, so the dev
    // environment reads exactly the files the old path reads (BUG-50).
    expect(args).toContain('--env-file')
    expect(args).toContain('.dev.vars')

    for (const arg of args) {
      expect(arg, `${arg} reaches into the working tree`).not.toMatch(/(^|[/\\])src([/\\]|$)/)
    }
  })

  /** Nothing deployed is an ordinary state, and the remedy is one command. */
  it('test_UAT_FC_REQ-318_an_undeployed_environment_says_what_to_type', () => {
    expect(readSnapshot({ repoRoot: mkdtempSync(path.join(tmpdir(), 'req318-')), app: 'control-app' })).toBeNull()
    const message = noSnapshotMessage('control-app')
    expect(message).toContain('bin/deploy --env dev')
    expect(message).toContain(SNAPSHOT_DIR)
  })

  /**
   * AC — "the dev target resolves its D1 binding from `[env.dev]`, not from the
   * top-level block".
   *
   * `d1-migrations.ts` read the top level because that is what `wrangler dev`
   * reads with no `--env`. The dev environment runs at `--env dev`, which
   * inherits nothing, so the same rule now selects a different block. The two
   * agree today ON PURPOSE — one store, one copy of the data — so the scoping is
   * proven against a synthetic config where they differ, which is the only way
   * to tell a correct read from a lucky one.
   */
  it('test_UAT_FC_REQ-318_the_d1_binding_is_read_from_the_environment_being_served', () => {
    const top = readLocalD1Binding(CONTROL_APP)
    const dev = readLocalD1Binding(CONTROL_APP, 'dev')
    expect(top).not.toBeNull()
    expect(dev).not.toBeNull()
    // One store (EPIC-16 §K2): the dev environment does not fork `.wrangler/state`.
    expect(dev?.databaseId).toBe(top?.databaseId)
    expect(dev?.databaseName).toBe(top?.databaseName)
    expect(dev?.migrationsDir).toBe(top?.migrationsDir)

    const synthetic = mkdtempSync(path.join(tmpdir(), 'req318-'))
    writeFileSync(
      path.join(synthetic, 'wrangler.toml'),
      [
        'name = "app"',
        '[[d1_databases]]',
        'binding = "DB"',
        'database_name = "top-level"',
        'database_id = "11111111-1111-1111-1111-111111111111"',
        'migrations_dir = "../../db/migrations"',
        '[env.dev]',
        'name = "app-dev"',
        '[[env.dev.d1_databases]]',
        'binding = "DB"',
        'database_name = "dev-only"',
        'database_id = "22222222-2222-2222-2222-222222222222"',
        'migrations_dir = "../../db/migrations"',
        '',
      ].join('\n'),
    )
    expect(readLocalD1Binding(synthetic)?.databaseName).toBe('top-level')
    expect(readLocalD1Binding(synthetic, 'dev')?.databaseName).toBe('dev-only')
    // An environment that declares no block is not silently answered from the
    // top level — a named environment inherits nothing, and reporting the
    // top-level database for it would be confidently wrong.
    expect(readLocalD1Binding(synthetic, 'staging')).toBeNull()
    rmSync(synthetic, { recursive: true, force: true })
  })

  /**
   * AC — "`ACCESS_DEV_OPEN` is whatever `[env.dev]` says rather than inherited
   * by accident" — pinned TOGETHER WITH THE TARGET TABLE, which is the half that
   * makes it safe.
   *
   * The var opens an unconfigured Access gate. Production's safety is its
   * ABSENCE (REQ-145). This environment's safety is that it never leaves the
   * machine — so the rule enforced here is: any named environment that names
   * `ACCESS_DEV_OPEN` must be one `bin/deploy` ships LOCALLY. The two facts are
   * in different files and would otherwise be free to drift apart.
   */
  it('test_UAT_FC_REQ-318_access_dev_open_only_exists_where_the_target_is_local', () => {
    const table = readFileSync(DEPLOY, 'utf8')
    const shipTarget = table.slice(table.indexOf('ship_target() {'))
    const localRows = [...shipTarget.slice(0, shipTarget.indexOf('\n}')).matchAll(
      /^\s*([a-z0-9|-]+)\)\s*echo local\s*;;/gm,
    )].flatMap((m) => m[1].split('|'))
    expect(localRows, 'bin/deploy declares no local target').toContain('dev')

    for (const app of ['control-app', 'public-site']) {
      const config = readWranglerConfig(path.join(REPO, 'apps', app, 'wrangler.toml'))
      for (const [envName, declarations] of Object.entries(config.envs)) {
        if (!declarations.vars.includes('ACCESS_DEV_OPEN')) continue
        expect(
          localRows,
          `apps/${app}/wrangler.toml: [env.${envName}.vars] names ACCESS_DEV_OPEN, which opens ` +
            'an unconfigured Access gate — that is only safe while bin/deploy ships that ' +
            'environment locally, and its target table does not say so',
        ).toContain(envName)
      }
    }
    // And it IS declared for dev rather than inherited: a named environment
    // inherits no vars, so silence here would mean the gate is closed and the
    // loopback builder would refuse every request.
    const control = readWranglerConfig(path.join(CONTROL_APP, 'wrangler.toml'))
    expect(control.envs.dev.vars).toContain('ACCESS_DEV_OPEN')
    expect(control.envs.production.vars).not.toContain('ACCESS_DEV_OPEN')
  })

  /**
   * §J3 — the production-data hazard this ticket had to close before the flag
   * could be used. `bin/deploy.d/migrate/10-d1-site-store` honoured `DEPLOY_ENV`
   * everywhere and then named the DATABASE literally three times, so
   * `bin/deploy --env dev` would have verified and applied migrations against
   * PRODUCTION's D1 while shipping code somewhere else entirely.
   *
   * BOTH HALVES ARE ASSERTED. The static one — no literal database name survives
   * — because the failure is silent and a future edit could reintroduce it. The
   * behavioural one — a rehearsal at `--env dev` reports the name it resolved
   * AND the local store — because a scrape that returned the right string by
   * accident would satisfy the first and not the second.
   */
  it('test_UAT_FC_REQ-318_the_migrate_hook_resolves_the_database_from_the_environment', () => {
    const hook = readFileSync(path.join(REPO, 'bin', 'deploy.d', 'migrate', '10-d1-site-store'), 'utf8')
    const commands = hook
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .filter((line) => line.includes('npx wrangler d1'))
    expect(commands.length, 'the hook no longer invokes wrangler d1').toBeGreaterThan(0)
    for (const line of commands) {
      expect(line, 'the database is still named literally').not.toMatch(/\sd1\s+\w+\s+["']?1stcontact/)
      expect(line).toContain('"$database"')
    }
    expect(hook).toContain('env.$DEPLOY_ENV.d1_databases')

    const { ok, output } = deploy(['--env', 'dev', '--dry-run', 'control-app'])
    expect(ok, output).toBe(true)
    // The name came out of `[[env.dev.d1_databases]]`, and the STORE came out of
    // the target table: `--local --persist-to`, never `--remote`.
    expect(output).toContain("would apply D1 migrations to '1stcontact'")
    expect(output).toContain('--env dev --local --persist-to .wrangler/state')
    expect(output).not.toContain('--env dev --remote')
    // A rehearsal makes no change, so no snapshot is written.
    expect(output).toContain(`would write the snapshot to apps/control-app/${SNAPSHOT_DIR}`)
  }, 600_000)

  /**
   * §J3 AGAIN, AS BEHAVIOUR RATHER THAN AS A GREP. REQ-291's harness drives the
   * real hook with a stubbed `npx` and RECORDS every `wrangler d1 migrations`
   * invocation, which is the only way to say "it applied to THAT database"
   * rather than "the script mentions a variable". Its fixture declares two
   * environments naming DIFFERENT databases, so a hook reading the wrong block
   * cannot pass by coincidence — which is precisely how the literal name passed
   * for as long as `production` was the only environment.
   */
  it('test_UAT_FC_REQ-318_the_hook_applies_to_the_database_and_store_the_target_selects', () => {
    const hook = migrateHookHarness()
    try {
      const baseline = 'CREATE TABLE sites (id TEXT PRIMARY KEY);\n'
      const files = { '0001_baseline.sql': baseline }
      const manifest = { '0001_baseline.sql': hashOf(baseline) }

      // The cloud target: production's database, on Cloudflare.
      const cloud = hook.run({ files, manifest, applied: ['0001_baseline.sql'] })
      expect(cloud.code, cloud.out).toBe(0)
      expect(cloud.migrations).toEqual(['apply 1stcontact --env production --remote'])

      // The local target: the DEV environment's database, in `.wrangler/state`.
      // Both halves move together — a hook that followed the environment but not
      // the target would migrate a local store under production's name, and one
      // that followed the target but not the environment would apply dev's
      // migrations to production's D1, which is the hazard itself.
      const local = hook.run({
        files,
        manifest,
        applied: ['0001_baseline.sql'],
        env: 'dev',
        target: 'local',
      })
      expect(local.code, local.out).toBe(0)
      expect(local.migrations).toEqual([
        'apply 1stcontact-dev --env dev --local --persist-to .wrangler/state',
      ])
      expect(local.migrations[0]).not.toContain('--remote')

      // A REHEARSAL STILL MAKES NO CHANGE AT THE LOCAL TARGET. `bin/deploy`'s
      // contract for a hook is the same whichever row was selected.
      const rehearsal = hook.run({
        files,
        manifest,
        applied: ['0001_baseline.sql'],
        env: 'dev',
        target: 'local',
        dryRun: true,
      })
      expect(rehearsal.code, rehearsal.out).toBe(0)
      expect(rehearsal.migrations).toEqual([
        'list 1stcontact-dev --env dev --local --persist-to .wrangler/state',
      ])

      // AND AN ENVIRONMENT WITH NO BLOCK IS REFUSED rather than answered from
      // the top level. A named environment inherits no bindings, so falling back
      // would apply somebody else's migrations with complete confidence.
      const undeclared = hook.run({ files, manifest, applied: [], env: 'staging' })
      expect(undeclared.code).not.toBe(0)
      expect(undeclared.out).toContain('[[env.staging.d1_databases]]')
      expect(undeclared.migrations).toEqual([])
    } finally {
      hook.dispose()
    }
  })

  /**
   * The local target has no `wrangler secret` store at all, and the capability
   * report says so rather than going quiet. A hook that stayed silent because it
   * had nothing to probe would leave a hole in the report that reads exactly
   * like a pass.
   */
  it('test_UAT_FC_REQ-318_the_capability_report_is_honest_about_a_store_that_does_not_exist', () => {
    const { ok, output } = deploy(['--env', 'dev', '--dry-run', 'control-app'])
    expect(ok, output).toBe(true)
    const report = output.slice(output.indexOf('==> Capabilities'))
    for (const credential of [
      'ANTHROPIC_API_KEY',
      'RESEND_API_KEY',
      'OPENAI_API_KEY',
      'CLOUDFLARE_DNS_TOKEN',
    ]) {
      expect(report, `${credential} has no row in the report`).toContain(credential)
    }
    // Never a pass by default: a value the deploy could not read is `unverified`,
    // the same verdict a stored cloud secret gets.
    expect(report).not.toContain('— ok\n      can      anything')
  }, 600_000)

  /**
   * AC — "with two `workerd` versions resolvable, the entry point refuses BEFORE
   * the store is opened".
   *
   * `.wrangler/state` is workerd's own store and workerd migrates that schema
   * forward silently and one-way; this environment holds the only copy of the
   * dev data, so a check that fired afterwards would have watched the damage
   * happen. Two entry points reach the store and both are covered: `1c dev
   * serve`, through REQ-316's existing gate, and `bin/deploy --env dev`, whose
   * FIRST act is a migrate hook against that store.
   */
  it('test_UAT_FC_REQ-318_both_entry_points_refuse_a_tree_with_two_workerds', () => {
    expect(WORKERD_GATED_COMMANDS).toContain('dev serve')
    const skewed = () => [
      { version: '1.20260710.1', broughtBy: 'wrangler@4.111.0' },
      { version: '1.20260801.0', broughtBy: 'miniflare@4.20260801.0' },
    ]
    expect(() => assertOneWorkerd('dev serve', { repoRoot: REPO, scan: skewed })).toThrow(CommandError)

    // `bin/deploy` is a shell script and cannot call that function, so it calls
    // the CLI surface REQ-318 added for it — and the position of that call is
    // the guarantee: before the loop that runs any hook.
    const script = readFileSync(DEPLOY, 'utf8')
    const guard = script.indexOf('bin/1c" workerd')
    expect(guard, 'bin/deploy does not run the workerd check').toBeGreaterThan(-1)
    expect(guard).toBeLessThan(script.indexOf('run_hooks migrate "$app"'))
    // …and only for the target that opens a local store.
    expect(script.slice(guard - 200, guard)).toContain('"$target" == "local"')

    // The surface itself answers, and is silent on a tree that is fine.
    const quiet = execFileSync(path.join(REPO, 'bin', '1c'), ['workerd', '--quiet'], {
      cwd: REPO,
      encoding: 'utf8',
    })
    expect(quiet.trim()).toBe('')
    const report = JSON.parse(
      execFileSync(path.join(REPO, 'bin', '1c'), ['workerd', '--json'], { cwd: REPO, encoding: 'utf8' }),
    ) as { ok: boolean; versions: string[] }
    expect(report.ok).toBe(true)
    expect(report.versions.length).toBeLessThanOrEqual(1)
  }, 120_000)

  /**
   * AC — "the old `pnpm dev` path still works, on its existing ports, against the
   * same store". Retirement is a separate, later step (EPIC-16 §L1) precisely so
   * the replacement can be proved while running BESIDE it, which is only
   * possible while the two hold different ports and the same state directory.
   */
  it('test_UAT_FC_REQ-318_the_old_path_is_untouched_and_binds_a_different_port', () => {
    const scripts = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf8')).scripts as Record<
      string,
      string
    >
    expect(scripts.dev).toContain('dev:public')
    expect(scripts['dev:control']).toBe('./bin/1c builder')

    // `1c builder`'s argv is unchanged: no `--env`, so it still reads the
    // top-level block, and no `--no-bundle`, so it still watches.
    const old = wranglerDevArgs({ appDir: CONTROL_APP, port: '8788' })
    expect(old).not.toContain('--env')
    expect(old).not.toContain('--no-bundle')
    expect(old[old.indexOf('--port') + 1]).toBe('8788')

    // Two ports, both inside the band `1c ps` surveys and `bin/dev reap` sweeps.
    const builder = KNOWN_SERVICES.find((s) => s.name === 'builder')
    const dev = KNOWN_SERVICES.find((s) => s.name === 'dev')
    expect(builder?.port).toBe(8788)
    expect(dev?.port).toBe(DEV_SERVE_PORT)
    expect(dev?.port).not.toBe(builder?.port)
    expect(inDevPortBand(DEV_SERVE_PORT)).toBe(true)

    // And one store. `--persist-to` names the directory `1c reset` already calls
    // "the whole of what survives a restart … There is no second place".
    const snapshot: DevSnapshot = {
      app: 'control-app',
      env: 'dev',
      worker: '1stcontact-control-app-dev',
      entry: 'worker/worker.js',
      assets: 'assets',
      deployedAt: '',
      commit: 'unknown',
    }
    const args = devServeArgs({ appDir: CONTROL_APP, snapshot, port: DEV_SERVE_PORT })
    expect(args[args.indexOf('--persist-to') + 1]).toBe(path.join('.wrangler', 'state'))
    const control = readWranglerConfig(path.join(CONTROL_APP, 'wrangler.toml'))
    expect(control.envs.dev.bindings).toEqual(expect.arrayContaining(control.topLevel.bindings))
  })
})
