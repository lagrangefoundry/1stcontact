/**
 * [[BUG-203]] — `bin/deploy` shipped stale builder browser assets beside a fresh
 * Worker.
 *
 * WHAT WAS WRONG. The deploy COPIED `apps/control-app/dist-assets` and never
 * built it; only `bin/build` / `1c assets` did. The Worker bundle, though, is
 * rebuilt from source on every deploy — so a deploy without a fresh build
 * shipped today's server beside yesterday's builder client and said nothing. On
 * 2026-10-04 the comp board was live on the server and absent from the browser.
 *
 * WHAT CHANGED. A `bin/deploy.d/assets/` hook stage runs FIRST, before migrate
 * and secrets, at every target. Its control-app hook runs `1c assets`, so what
 * the deploy ships (or freezes into the dev snapshot) is what it just built.
 *
 * WHAT THESE PIN:
 *   1. A builder file whose `dist-assets` copy is stale is rebuilt by the hook,
 *      byte-for-byte to the source — whatever directory the hook is run from.
 *   2. `bin/deploy` runs the build stage before every other hook, at the local
 *      AND the cloud target.
 *   3. A build that fails stops the deploy: no migrate hook, nothing deployed.
 *   4. A rehearsal builds nothing and says what it would build.
 *
 * NOT A FULL `bin/deploy --env dev control-app`. That runs the control app's
 * migrate hook against `.wrangler/state`, which in the main checkout is the only
 * copy of the dev data. The chain is proved in its parts instead: the hook makes
 * `dist-assets` match the source (1), the deploy runs it before the ship step
 * (2, 3), and the ship step copies `dist-assets` into the snapshot (REQ-318).
 */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const REPO = path.resolve(import.meta.dirname, '..')
const DEPLOY = path.join(REPO, 'bin', 'deploy')
const HOOK = path.join(REPO, 'bin', 'deploy.d', 'assets', '10-control-app-assets')
const CONTROL_APP = path.join(REPO, 'apps', 'control-app')
const SOURCE = path.join(CONTROL_APP, 'src', 'builder')
const BUILT = path.join(CONTROL_APP, 'dist-assets', 'builder')
const PROBE = 'plan-panel.js'
// `1c assets` regenerates this committed file; a test must not leave it dirty.
const MODULE_ASSETS = path.join(REPO, 'packages', 'framework', 'src', 'modules', 'module-assets.ts')

function run(file: string, args: string[], env: Record<string, string> = {}, cwd = REPO) {
  try {
    const out = execFileSync(file, args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5 * 60_000,
    })
    return { ok: true, out }
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string }
    return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }
  }
}

function hookEnv(dry: '0' | '1'): Record<string, string> {
  return {
    DEPLOY_APP: 'control-app',
    DEPLOY_APP_DIR: CONTROL_APP,
    DEPLOY_ENV: 'dev',
    DEPLOY_TARGET: 'local',
    DEPLOY_DRY_RUN: dry,
    DEPLOY_REPO_ROOT: REPO,
  }
}

/** Every file under `dir`, relative to it. */
function walk(dir: string, rel = ''): string[] {
  return readdirSync(path.join(dir, rel), { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(dir, path.join(rel, d.name)) : [path.join(rel, d.name)],
  )
}

/** Make the built copy of the probe file stale: older bytes, older mtime. */
function staleCopy(): string {
  mkdirSync(BUILT, { recursive: true })
  const stale = `// bug203 stale copy ${Date.now()}\n`
  writeFileSync(path.join(BUILT, PROBE), stale)
  const yesterday = new Date(Date.now() - 86_400_000)
  utimesSync(path.join(BUILT, PROBE), yesterday, yesterday)
  return stale
}

/** Install temporary hooks for the duration of `fn`. */
function withHooks<T>(hooks: { kind: string; name: string; body: string }[], fn: () => T): T {
  const files = hooks.map((h) => path.join(REPO, 'bin', 'deploy.d', h.kind, h.name))
  hooks.forEach((h, i) => {
    writeFileSync(files[i], `#!/usr/bin/env bash\n${h.body}\n`)
    chmodSync(files[i], 0o755)
  })
  try {
    return fn()
  } finally {
    for (const f of files) rmSync(f, { force: true })
  }
}

describe('BUG-203 — bin/deploy builds the browser assets it ships', () => {
  it('test_UAT_FC_BUG-203_a_stale_builder_asset_is_rebuilt_from_its_source', () => {
    const moduleAssets = readFileSync(MODULE_ASSETS, 'utf8')
    staleCopy()
    try {
      // Run from somewhere that is NOT the repo: the hook must not depend on
      // the caller's directory to find what it builds.
      const { ok, out } = run(HOOK, [], hookEnv('0'), tmpdir())
      expect(ok, out).toBe(true)

      expect(readFileSync(path.join(BUILT, PROBE), 'utf8')).toBe(readFileSync(path.join(SOURCE, PROBE), 'utf8'))
      // And not just the probe: every builder source ships as it is on disk.
      for (const rel of walk(SOURCE)) {
        expect(existsSync(path.join(BUILT, rel)), `dist-assets lacks builder/${rel}`).toBe(true)
        expect(readFileSync(path.join(BUILT, rel), 'utf8'), `builder/${rel} is stale`).toBe(
          readFileSync(path.join(SOURCE, rel), 'utf8'),
        )
      }
    } finally {
      writeFileSync(MODULE_ASSETS, moduleAssets)
    }
  }, 300_000)

  it('test_UAT_FC_BUG-203_the_deploy_builds_before_every_other_hook_at_both_targets', () => {
    withHooks(
      [
        { kind: 'assets', name: '99-uat-bug203', body: 'echo "bug203 build env=$DEPLOY_ENV target=$DEPLOY_TARGET"' },
        { kind: 'migrate', name: '99-uat-bug203', body: 'echo "bug203 migrate env=$DEPLOY_ENV"' },
      ],
      () => {
        for (const env of ['dev', 'production']) {
          const { ok, out } = run(DEPLOY, ['--env', env, '--dry-run', 'public-site'])
          expect(ok, out).toBe(true)
          const build = out.indexOf(`bug203 build env=${env}`)
          const migrate = out.indexOf(`bug203 migrate env=${env}`)
          expect(build, `the build stage did not run at --env ${env}:\n${out}`).toBeGreaterThan(-1)
          expect(migrate).toBeGreaterThan(build)
          // The real asset hook is in the stage too.
          expect(out).toContain('hook assets/10-control-app-assets')
        }
      },
    )
  }, 600_000)

  it('test_UAT_FC_BUG-203_a_failed_build_stops_the_deploy', () => {
    withHooks(
      [
        { kind: 'assets', name: '00-uat-bug203-fail', body: 'echo "bug203 build failed"; exit 9' },
        { kind: 'migrate', name: '99-uat-bug203', body: 'echo "bug203 migrate ran"' },
      ],
      () => {
        const { ok, out } = run(DEPLOY, ['--env', 'dev', '--dry-run', 'public-site'])
        expect(ok, 'a failing build hook did not fail the deploy').toBe(false)
        expect(out).toContain('bug203 build failed')
        expect(out).not.toContain('bug203 migrate ran')
        expect(out).not.toContain('==> Deployed')
      },
    )
  }, 300_000)

  it('test_UAT_FC_BUG-203_a_rehearsal_builds_nothing', () => {
    const stale = staleCopy()
    const { ok, out } = run(HOOK, [], hookEnv('1'))
    expect(ok, out).toBe(true)
    expect(out).toContain('would build apps/control-app/dist-assets')
    expect(readFileSync(path.join(BUILT, PROBE), 'utf8')).toBe(stale)
    // Leave the operator's dist-assets fresh rather than with the stale probe.
    const moduleAssets = readFileSync(MODULE_ASSETS, 'utf8')
    try {
      expect(run(HOOK, [], hookEnv('0')).ok).toBe(true)
    } finally {
      writeFileSync(MODULE_ASSETS, moduleAssets)
    }
  }, 300_000)
})
