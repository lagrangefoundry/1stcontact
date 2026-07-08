import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse } from 'yaml'
import { unstable_dev, type UnstableDevWorker } from 'wrangler'

// Reconciliation UATs for story-0ceaf24d — "Multi-tenant platform scaffold with
// auto-deploy pipeline". One UAT per acceptance criterion (AC-416 .. AC-424),
// each asserting against the existing scaffold code at its external boundary.

// --- Helpers ---------------------------------------------------------------

/** Extract every `pattern = "..."` value from a wrangler.toml body. */
function routePatterns(toml: string): string[] {
  return [...toml.matchAll(/pattern\s*=\s*"([^"]+)"/g)].map((m) => m[1])
}

/** Extract every `zone_name = "..."` value from a wrangler.toml body. */
function zoneNames(toml: string): string[] {
  return [...toml.matchAll(/zone_name\s*=\s*"([^"]+)"/g)].map((m) => m[1])
}

// --- AC-416: public-site serves the apex marketing placeholder -------------

describe('AC-416 public-site apex placeholder', () => {
  let worker: UnstableDevWorker

  beforeAll(async () => {
    worker = await unstable_dev('apps/public-site/src/index.ts', {
      config: 'apps/public-site/wrangler.toml',
      // Disable filesystem persistence: these placeholder workers have no
      // storage bindings, and the default `.wrangler/state` dir is shared
      // across parallel test files, causing SQLITE_BUSY contention on
      // Miniflare's internal SQLite when workerd starts up.
      persist: false,
      experimental: { disableExperimentalWarning: true },
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  it('test_UAT_AC416_public_site_serves_apex_placeholder', async () => {
    const res = await worker.fetch('/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^text\/plain/)
    expect(await res.text()).toBe('Hello from 1stcontact.io')
  })
})

// --- AC-417: control-app serves the builder/portal placeholder -------------

describe('AC-417 control-app builder placeholder', () => {
  let worker: UnstableDevWorker

  beforeAll(async () => {
    worker = await unstable_dev('apps/control-app/src/index.ts', {
      config: 'apps/control-app/wrangler.toml',
      // See AC-416 above: disable persistence to avoid SQLITE_BUSY contention
      // on Miniflare's shared default state dir across parallel test files.
      persist: false,
      experimental: { disableExperimentalWarning: true },
    })
  })

  afterAll(async () => {
    await worker.stop()
  })

  it('test_UAT_AC417_control_app_serves_builder_placeholder', async () => {
    const res = await worker.fetch('/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/^text\/plain/)
    expect(await res.text()).toBe('Hello from app.1stcontact.io')
  })
})

// --- AC-418: public-site claims apex + wildcard routes in production --------

describe('AC-418 public-site apex and wildcard routes', () => {
  it('test_UAT_AC418_public_site_claims_apex_and_wildcard_routes', () => {
    const toml = readFileSync('apps/public-site/wrangler.toml', 'utf8')
    const patterns = routePatterns(toml)
    // Both production routes present, both bound to the 1stcontact.io zone.
    expect(patterns).toContain('1stcontact.io/*')
    expect(patterns).toContain('*.1stcontact.io/*')
    for (const z of zoneNames(toml)) {
      expect(z).toBe('1stcontact.io')
    }
  })
})

// --- AC-419: control-app reserved app route outranks the wildcard ----------

describe('AC-419 control-app reserved app route', () => {
  it('test_UAT_AC419_control_app_claims_reserved_app_route', () => {
    const controlToml = readFileSync('apps/control-app/wrangler.toml', 'utf8')
    const publicToml = readFileSync('apps/public-site/wrangler.toml', 'utf8')

    const controlPatterns = routePatterns(controlToml)
    expect(controlPatterns).toContain('app.1stcontact.io/*')
    expect(zoneNames(controlToml)).toContain('1stcontact.io')

    // The app route must be strictly more specific than public-site's wildcard:
    // its host is a literal subdomain (no `*`) that still falls under the
    // `*.1stcontact.io` wildcard — so it wins the Cloudflare route match.
    const appHost = 'app.1stcontact.io/*'.replace('/*', '')
    const wildcard = '*.1stcontact.io/*'
    expect(routePatterns(publicToml)).toContain(wildcard)
    const wildcardHost = wildcard.replace('/*', '')
    expect(appHost.includes('*')).toBe(false)
    expect(wildcardHost.includes('*')).toBe(true)
    expect(appHost.endsWith('.1stcontact.io')).toBe(true)
  })
})

// --- AC-420: deploy pipeline ships both Workers on promotion ----------------

describe('AC-420 deploy pipeline', () => {
  it('test_UAT_AC420_deploy_pipeline_ships_both_workers', () => {
    const wf = parse(readFileSync('.github/workflows/deploy.yml', 'utf8'))

    // (1) triggers on push to xgd-stable
    expect(wf.on.push.branches).toContain('xgd-stable')

    // (2) declares a concurrency group that serializes runs (no cancellation).
    expect(wf.concurrency?.group).toBeTruthy()
    expect(wf.concurrency['cancel-in-progress']).toBe(false)

    // (3) both Cloudflare secrets are exposed to the deploy job environment.
    const env = wf.jobs.deploy.env
    expect(env.CLOUDFLARE_API_TOKEN).toContain('CLOUDFLARE_API_TOKEN')
    expect(env.CLOUDFLARE_ACCOUNT_ID).toContain('CLOUDFLARE_ACCOUNT_ID')

    // (4) performs a production deploy of both Workers.
    const runs = wf.jobs.deploy.steps
      .filter((s: { run?: string }) => s.run)
      .map((s: { run: string }) => s.run)
      .join('\n')
    expect(runs).toContain('wrangler deploy --env production')
    expect(runs).toContain('@1stcontact/public-site')
    expect(runs).toContain('@1stcontact/control-app')
  })
})

// --- AC-421: CI pipeline validates every pull request -----------------------

describe('AC-421 CI pipeline', () => {
  it('test_UAT_AC421_ci_pipeline_validates_pull_requests', () => {
    const wf = parse(readFileSync('.github/workflows/ci.yml', 'utf8'))

    // Triggered by pull requests.
    expect(wf.on.pull_request).toBeTruthy()

    // Runs the workspace build, the test suite, and dry-run deploys of both Workers.
    const runs = wf.jobs['build-and-test'].steps
      .filter((s: { run?: string }) => s.run)
      .map((s: { run: string }) => s.run)
      .join('\n')
    expect(runs).toContain('pnpm -r build')
    expect(runs).toContain('pnpm test')
    expect(runs).toContain('dryrun:public')
    expect(runs).toContain('dryrun:control')
  })
})

// --- AC-422: version-bump advances the root package manifest ----------------

/** Stage a temp copy of the version-bump tool + a package.json at `version`. */
function stageBumpTool(version: string): { root: string; script: string } {
  const root = mkdtempSync(join(tmpdir(), 'vbump-'))
  mkdirSync(join(root, 'bin', 'project'), { recursive: true })
  const script = join(root, 'bin', 'project', 'xgd_version_bump')
  writeFileSync(script, readFileSync('bin/project/xgd_version_bump', 'utf8'))
  writeFileSync(join(root, 'package.json'), `{\n  "name": "scaffold-fixture",\n  "version": "${version}"\n}\n`)
  return { root, script }
}

function manifestVersion(root: string): string {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  return pkg.version
}

describe('AC-422 version-bump advances the manifest', () => {
  it('test_UAT_AC422_version_bump_advances_root_manifest', () => {
    // Patch: X.Y.Z -> X.Y.Z+1
    let { root, script } = stageBumpTool('4.7.2')
    execFileSync('python3', [script])
    expect(manifestVersion(root)).toBe('4.7.3')
    rmSync(root, { recursive: true, force: true })

    // Minor: X.Y.Z -> X.Y+1.0 (patch reset)
    ;({ root, script } = stageBumpTool('4.7.2'))
    execFileSync('python3', [script, '--minor'])
    expect(manifestVersion(root)).toBe('4.8.0')
    rmSync(root, { recursive: true, force: true })

    // Major: X.Y.Z -> X+1.0.0 (minor + patch reset)
    ;({ root, script } = stageBumpTool('4.7.2'))
    execFileSync('python3', [script, '--major'])
    expect(manifestVersion(root)).toBe('5.0.0')
    rmSync(root, { recursive: true, force: true })
  })
})

// --- AC-423: version-bump --check and --list-paths --------------------------

describe('AC-423 version-bump check and list-paths', () => {
  it('test_UAT_AC423_version_bump_check_and_list_paths', () => {
    const { root, script } = stageBumpTool('3.1.4')
    const git = (...args: string[]) => execFileSync('git', args, { cwd: root })
    git('init', '-q')
    git('config', 'user.email', 'test@example.com')
    git('config', 'user.name', 'Test')
    git('add', '-A')
    git('commit', '-qm', 'seed manifest at 3.1.4')
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim()

    // --list-paths prints the root package manifest path it writes during a bump.
    const listed = execFileSync('python3', [script, '--list-paths']).toString().trim()
    expect(listed.split('\n')).toContain('package.json')

    // --check succeeds (exit 0) when a supplied commit introduced the version.
    expect(() => execFileSync('python3', [script, '--check', sha, '--version', '3.1.4'])).not.toThrow()

    // --check fails (non-zero) when no supplied commit introduced the version.
    let checkFailed = false
    try {
      execFileSync('python3', [script, '--check', sha, '--version', '9.9.9'], { stdio: 'pipe' })
    } catch {
      checkFailed = true
    }
    expect(checkFailed).toBe(true)

    rmSync(root, { recursive: true, force: true })
  })
})

// --- AC-424: platform identifiers normalized to the 1stcontact name ---------

describe('AC-424 identifier naming', () => {
  it('test_UAT_AC424_identifiers_normalized_to_1stcontact', () => {
    const publicToml = readFileSync('apps/public-site/wrangler.toml', 'utf8')
    const controlToml = readFileSync('apps/control-app/wrangler.toml', 'utf8')

    // Worker names carry the 1stcontact- prefix.
    expect(publicToml).toContain('name = "1stcontact-public-site"')
    expect(controlToml).toContain('name = "1stcontact-control-app"')

    // Seed site-definition directory is sites/1stcontact/.
    expect(existsSync('sites/1stcontact')).toBe(true)

    // No `first-contact` identifier remains in the worker configs or site path.
    expect(publicToml).not.toMatch(/first[-_]contact/i)
    expect(controlToml).not.toMatch(/first[-_]contact/i)
    expect(existsSync('sites/first-contact')).toBe(false)
  })
})
