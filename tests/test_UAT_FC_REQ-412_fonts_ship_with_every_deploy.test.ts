/**
 * [[REQ-412]] — `bin/deploy` ships the platform fonts when, and only when, the
 * mirror has changed since the last font deploy to that target.
 *
 * WHAT WAS WRONG. [[REQ-315]] kept the fonts out of a code deploy, because
 * detecting change by re-hashing 1.35 GB would have added an hour to each one.
 * So on 2026-10-19 a fixed font encoder was built and deployed while every dev
 * store went on serving the broken woff2 it had been seeded with a month
 * before: the fix needed a second command nobody knew to run.
 *
 * WHAT CHANGED. Before the first app, `1c fonts deploy` compares the manifest's
 * object set with a record the destination holds of its last full font
 * delivery, and runs the existing delivery only when they differ.
 *
 * THE OBSERVATION IS THE STORE, not the command's account of itself: each UAT
 * reads the seeded store back through a FRESH miniflare — the `R2Bucket`
 * `wrangler dev` hands the Worker — and the served bytes through
 * `r2PlatformFonts`, the deployed Worker's own reader. The decision is driven
 * through the real CLI, the way `bin/deploy` invokes it; the `bin/deploy`
 * wiring (fonts first, `--no-fonts`, the help) is driven through the script.
 */

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Miniflare } from 'miniflare'
import { afterEach, describe, expect, it } from 'vitest'
import { r2PlatformFonts, servePreviewPlatformFont } from '../apps/control-app/src/platform-fonts'
import { cmdFontsMirror } from '../tools/generate/src/cli/font-mirror'
import { DEPLOYED_RECORD_KEY } from '../tools/generate/src/fonts/deployed'
import { MANIFEST_REL, MIRROR_DIR_REL } from '../tools/generate/src/fonts/mirror'
import { PLATFORM_BUCKET } from '../tools/generate/src/fonts/publish'
import { R2_PERSIST_REL } from '../tools/generate/src/fonts/seed'
import { run } from '../tools/generate/src/cli/index'

const REPO = path.resolve(import.meta.dirname, '..')
/** A REAL TrueType font, already committed to this repository. */
const UPSTREAM_TTF = fileURLToPath(new URL('./fixtures/capture/heading-font.ttf', import.meta.url))
const TODAY = '2026-10-19'
const REF = '0123456789abcdef0123456789abcdef01234567'

const HEADING = { slug: 'headingfont', family: 'Heading Font', file: 'HeadingFont-Regular.ttf' }
const BODY = { slug: 'bodyface', family: 'Body Face', file: 'BodyFace-Regular.ttf' }
type Fixture = typeof HEADING

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** A google/fonts-shaped checkout the mirror can read. */
function makeCheckout(families: Fixture[]): string {
  const checkout = mkdtempSync(path.join(tmpdir(), 'req412-gf-'))
  const ttf = readFileSync(UPSTREAM_TTF)
  for (const family of families) {
    const dir = path.join(checkout, 'ofl', family.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      path.join(dir, 'METADATA.pb'),
      [
        `name: "${family.family}"`,
        'license: "OFL"',
        'fonts {',
        `  name: "${family.family}"`,
        '  style: "normal"',
        '  weight: 400',
        `  filename: "${family.file}"`,
        `  copyright: "Copyright 2026 The ${family.family} Project Authors"`,
        '}',
      ].join('\n') + '\n',
    )
    writeFileSync(path.join(dir, 'OFL.txt'), `Copyright 2026 The ${family.family} Project Authors\n`)
    writeFileSync(path.join(dir, family.file), ttf)
  }
  return checkout
}

/** A repo-shaped workspace whose apps declare (or do not declare) the platform bucket. */
function makeWorkspace(families: Fixture[], apps: { name: string; bucket?: boolean }[]): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req412-repo-'))
  mkdirSync(path.join(cwd, 'fonts'), { recursive: true })
  writeFileSync(path.join(cwd, 'fonts', 'registry.yaml'), 'fonts: []\n')
  writeFileSync(
    path.join(cwd, 'fonts', 'catalogue.json'),
    JSON.stringify({
      source: 'fixture',
      retrieved: TODAY,
      family_count: families.length,
      families: families.map((f) => ({
        family: f.family,
        slug: f.slug,
        licence: 'OFL-1.1',
        licence_source: `ofl/${f.slug}/METADATA.pb`,
        variable: false,
      })),
    }),
  )
  for (const app of apps) {
    const dir = path.join(cwd, 'apps', app.name)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      path.join(dir, 'wrangler.toml'),
      app.bucket === false
        ? `name = "${app.name}"\n`
        : `name = "${app.name}"\n\n[[r2_buckets]]\nbinding = "SITES"\nbucket_name = "${PLATFORM_BUCKET}"\n`,
    )
  }
  return cwd
}

const scratch: string[] = []
function fixture(families: Fixture[] = [HEADING, BODY], apps = [{ name: 'control-app' }] as { name: string; bucket?: boolean }[]) {
  const cwd = makeWorkspace(families, apps)
  const repo = makeCheckout(families)
  scratch.push(cwd, repo)
  // Staged, NOT seeded: `cmdFontsMirror` is the mirror alone (the CLI's mirror
  // dispatch is what seeds at its tail), so every store starts with no record.
  cmdFontsMirror({ cwd, repo, ref: REF, today: TODAY, quality: 5 })
  return cwd
}
afterEach(() => {
  while (scratch.length > 0) {
    const dir = scratch.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

function storeDir(cwd: string, app: string): string {
  return path.join(cwd, 'apps', app, R2_PERSIST_REL)
}

async function withStore<T>(cwd: string, app: string, fn: (bucket: R2BucketLike) => Promise<T>): Promise<T> {
  const mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response(null, { status: 404 }) } }',
    r2Buckets: { SITES: PLATFORM_BUCKET },
    r2Persist: storeDir(cwd, app),
  })
  try {
    return await fn((await mf.getR2Bucket('SITES')) as unknown as R2BucketLike)
  } finally {
    await mf.dispose()
  }
}
type R2BucketLike = Parameters<typeof r2PlatformFonts>[0] & {
  get(key: string): Promise<{ text(): Promise<string> } | null>
}

/** The bytes the deployed Worker's reader serves for one mirror path. */
async function served(cwd: string, app: string, rel: string): Promise<Buffer | null> {
  return withStore(cwd, app, async (bucket) => {
    const response = await servePreviewPlatformFont(rel, r2PlatformFonts(bucket))
    return response ? Buffer.from(await response.arrayBuffer()) : null
  })
}

/** The deploy record the store holds, as written. */
async function recordIn(cwd: string, app: string): Promise<{ digest: string; objects: Record<string, string> } | null> {
  return withStore(cwd, app, async (bucket) => {
    const object = await bucket.get(DEPLOYED_RECORD_KEY)
    return object ? JSON.parse(await object.text()) : null
  })
}

interface Manifest {
  families: { slug: string; files: { path: string; sha256: string }[] }[]
}
const manifestOf = (cwd: string): Manifest => JSON.parse(readFileSync(path.join(cwd, MANIFEST_REL), 'utf8'))
const fontPath = (cwd: string, family: Fixture): string =>
  manifestOf(cwd).families.find((f) => f.slug === family.slug)!.files[0].path

/** What re-encoding one font does to the mirror: new staged bytes, and the manifest's sha256 for them. */
function reencode(cwd: string, family: Fixture): Buffer {
  const rel = fontPath(cwd, family)
  const file = path.join(cwd, MIRROR_DIR_REL, ...rel.split('/'))
  const bytes = Buffer.concat([readFileSync(file), Buffer.from('re-encoded')])
  writeFileSync(file, bytes)
  const manifest = manifestOf(cwd)
  for (const f of manifest.families) for (const entry of f.files) {
    if (entry.path === rel) entry.sha256 = createHash('sha256').update(bytes).digest('hex')
  }
  writeFileSync(path.join(cwd, MANIFEST_REL), `${JSON.stringify(manifest, null, 1)}\n`)
  return bytes
}

// ── UATs: the decision ───────────────────────────────────────────────────────

describe('REQ-412 — the fonts are delivered when the mirror changed, and only then', () => {
  it('test_UAT_FC_REQ-412_a_store_with_no_record_is_fully_seeded_and_recorded', async () => {
    const cwd = fixture()

    const ran = await fontsDeploy(cwd, ['--target', 'local'])

    expect(ran.exitCode).toBeUndefined()
    expect(ran.out).toContain('platform fonts: deployed')
    expect(ran.out).toContain('never deployed here')
    // Served, byte for byte, by the deployed Worker's own reader.
    const rel = fontPath(cwd, HEADING)
    expect((await served(cwd, 'control-app', rel))?.equals(readFileSync(path.join(cwd, MIRROR_DIR_REL, rel)))).toBe(true)
    // And the record names every object the manifest does.
    const record = await recordIn(cwd, 'control-app')
    expect(Object.keys(record?.objects ?? {})).toContain(rel)
    expect(record?.objects[rel]).toBe(manifestOf(cwd).families.find((f) => f.slug === HEADING.slug)!.files[0].sha256)
  }, 120_000)

  it('test_UAT_FC_REQ-412_an_unchanged_mirror_is_skipped_in_one_line', async () => {
    const cwd = fixture()
    await fontsDeploy(cwd, ['--target', 'local'])
    const before = await recordIn(cwd, 'control-app')

    const ran = await fontsDeploy(cwd, ['--target', 'local', '--json'])

    const report = JSON.parse(ran.out).data
    expect(report.outcome).toBe('unchanged')
    // No delivery ran at all — not one that found everything current.
    expect(report.delivery).toBeUndefined()
    expect((await fontsDeploy(cwd, ['--target', 'local'])).out.split('\n')[0]).toMatch(/^platform fonts: unchanged/)
    expect(await recordIn(cwd, 'control-app')).toEqual(before)
  }, 120_000)

  it('test_UAT_FC_REQ-412_a_changed_object_is_reseeded_and_the_next_deploy_skips', async () => {
    const cwd = fixture()
    await fontsDeploy(cwd, ['--target', 'local'])
    const bytes = reencode(cwd, BODY)

    const ran = await fontsDeploy(cwd, ['--target', 'local', '--json'])

    const report = JSON.parse(ran.out).data
    expect(report.outcome).toBe('deployed')
    expect(report.destinations[0].moves).toBe(1)
    // Only the changed object travelled.
    expect(report.delivery.uploaded).toBe(1)
    expect((await served(cwd, 'control-app', fontPath(cwd, BODY)))?.equals(bytes)).toBe(true)
    // The record moved with it, so the following deploy has nothing to do.
    expect(JSON.parse((await fontsDeploy(cwd, ['--target', 'local', '--json'])).out).data.outcome).toBe('unchanged')
  }, 120_000)

  it('test_UAT_FC_REQ-412_a_changed_mirror_that_is_not_fully_staged_stops_the_deploy', async () => {
    const cwd = fixture()
    const gone = fontPath(cwd, BODY)
    rmSync(path.join(cwd, MIRROR_DIR_REL, ...gone.split('/')))

    const ran = await fontsDeploy(cwd, ['--target', 'local'])

    expect(ran.exitCode).toBe(1)
    expect(ran.out).toContain('BLOCKED')
    expect(ran.out).toContain(gone)
    expect(ran.out).toContain('1c fonts mirror')
    // Nothing shipped: the store was never even created.
    expect(existsSync(storeDir(cwd, 'control-app'))).toBe(false)
  }, 120_000)

  /**
   * A fresh checkout or worktree holds no mirror at all (it is gitignored), and
   * its dev stores are its own: that is not a half-staged mirror, so a local
   * deploy proceeds — and says plainly that dev will serve no platform fonts.
   */
  it('test_UAT_FC_REQ-412_a_checkout_with_no_staged_mirror_deploys_locally_with_a_warning', async () => {
    const cwd = fixture()
    rmSync(path.join(cwd, MIRROR_DIR_REL), { recursive: true, force: true })

    const ran = await fontsDeploy(cwd, ['--target', 'local'])

    expect(ran.exitCode).toBeUndefined()
    expect(ran.out).toContain('NOT deployed — no mirror is staged in this checkout')
    expect(existsSync(storeDir(cwd, 'control-app'))).toBe(false)
  }, 120_000)

  /**
   * The decision reads the manifest, not the bytes — so a machine that holds no
   * staged mirror can still deploy code to a target that is already current.
   */
  it('test_UAT_FC_REQ-412_a_current_target_needs_no_staged_mirror', async () => {
    const cwd = fixture()
    await fontsDeploy(cwd, ['--target', 'local'])
    rmSync(path.join(cwd, MIRROR_DIR_REL), { recursive: true, force: true })

    const ran = await fontsDeploy(cwd, ['--target', 'local'])

    expect(ran.exitCode).toBeUndefined()
    expect(ran.out).toMatch(/^platform fonts: unchanged/)
  }, 120_000)

  it('test_UAT_FC_REQ-412_a_dry_run_reports_the_decision_and_the_count_and_moves_nothing', async () => {
    const cwd = fixture()

    const fresh = await fontsDeploy(cwd, ['--target', 'local', '--dry-run'])
    expect(fresh.out).toMatch(/^platform fonts: would deploy/)
    expect(existsSync(storeDir(cwd, 'control-app'))).toBe(false)

    await fontsDeploy(cwd, ['--target', 'local'])
    reencode(cwd, HEADING)
    const before = await recordIn(cwd, 'control-app')
    const changed = JSON.parse((await fontsDeploy(cwd, ['--target', 'local', '--dry-run', '--json'])).out).data
    expect(changed.outcome).toBe('would-deploy')
    expect(changed.destinations[0].moves).toBe(1)
    expect(changed.delivery).toBeUndefined()
    expect(await recordIn(cwd, 'control-app')).toEqual(before)
  }, 120_000)

  it('test_UAT_FC_REQ-412_a_check_only_run_warns_of_stale_fonts_and_delivers_nothing', async () => {
    const cwd = fixture()
    await fontsDeploy(cwd, ['--target', 'local'])
    const old = await served(cwd, 'control-app', fontPath(cwd, BODY))
    reencode(cwd, BODY)

    const ran = await fontsDeploy(cwd, ['--target', 'local', '--check'])

    // A code-only deploy proceeds — but not silently.
    expect(ran.exitCode).toBeUndefined()
    expect(ran.out).toContain('STALE and NOT deployed')
    expect((await served(cwd, 'control-app', fontPath(cwd, BODY)))?.equals(old!)).toBe(true)
  }, 120_000)

  it('test_UAT_FC_REQ-412_the_decision_is_a_row_in_the_capability_report', async () => {
    const cwd = fixture()
    const report = path.join(cwd, 'capability.jsonl')
    writeFileSync(report, '')

    await fontsDeploy(cwd, ['--target', 'local'], { DEPLOY_CAPABILITY_REPORT: report })
    reencode(cwd, BODY)
    await fontsDeploy(cwd, ['--target', 'local', '--check'], { DEPLOY_CAPABILITY_REPORT: report })

    const rows = readFileSync(report, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    expect(rows.map((r) => [r.credential, r.verdict])).toEqual([
      ['platform fonts', 'capable'],
      ['platform fonts', 'STALE'],
    ])
    expect(rows[1].cannot[0]).toContain('NOT deployed')
  }, 120_000)

  /** At the local target the stores checked are those of the apps being deployed. */
  it('test_UAT_FC_REQ-412_only_the_deployed_apps_stores_are_checked_and_seeded', async () => {
    const cwd = fixture([HEADING], [{ name: 'control-app' }, { name: 'public-site' }, { name: 'docs-app', bucket: false }])

    const one = JSON.parse((await fontsDeploy(cwd, ['--target', 'local', '--app', 'control-app,docs-app', '--json'])).out).data
    expect(one.destinations.map((d: { app: string }) => d.app)).toEqual(['control-app'])
    expect(existsSync(storeDir(cwd, 'public-site'))).toBe(false)

    const none = await fontsDeploy(cwd, ['--target', 'local', '--app', 'docs-app'])
    expect(none.out).toContain('no app in this deploy serves them')
  }, 120_000)
})

// ── UATs: bin/deploy ─────────────────────────────────────────────────────────

describe('REQ-412 — bin/deploy runs the font step before any app', () => {
  it('test_UAT_FC_REQ-412_the_font_step_runs_before_the_first_app_and_is_reported', () => {
    const ran = deploy(['--env', 'dev', '--dry-run', 'public-site'])
    expect(ran.status, ran.stdout + ran.stderr).toBe(0)
    const fonts = ran.stdout.indexOf('==> platform fonts')
    const app = ran.stdout.indexOf('==> public-site')
    expect(fonts).toBeGreaterThan(-1)
    expect(app).toBeGreaterThan(fonts)
    // The decision is a line of its own, and a row in the capability report.
    expect(ran.stdout).toMatch(/platform fonts: \S/)
    expect(ran.stdout.slice(ran.stdout.indexOf('==> Capabilities'))).toContain('platform fonts —')
  }, 600_000)

  it('test_UAT_FC_REQ-412_no_fonts_checks_without_delivering_and_cannot_combine_with_fonts', () => {
    const ran = deploy(['--env', 'dev', '--dry-run', '--no-fonts', 'public-site'])
    expect(ran.status, ran.stdout + ran.stderr).toBe(0)
    expect(ran.stdout).toContain('--no-fonts: checking only')

    const both = deploy(['--fonts', '--no-fonts', '--env', 'dev', '--dry-run'])
    expect(both.status).not.toBe(0)
    expect(both.stderr).toContain('pick one')
  }, 600_000)

  it('test_UAT_FC_REQ-412_the_help_describes_the_change_detected_fonts', () => {
    const help = deploy(['--help'])
    expect(help.status).toBe(0)
    expect(help.stdout).toContain('--no-fonts')
    expect(help.stdout).toContain('Every deploy ships the platform font mirror FIRST')
    expect(help.stdout).not.toContain('a 1.35GB\ncorpus and a Worker move on different schedules')
  })
})

// ── Drivers ──────────────────────────────────────────────────────────────────

/** `1c fonts deploy …` through the real CLI, in `cwd`, with what it printed. */
async function fontsDeploy(
  cwd: string,
  argv: string[],
  env: Record<string, string> = {},
): Promise<{ exitCode: number | undefined; out: string }> {
  const previousCwd = process.cwd()
  const previousExit = process.exitCode
  const previousEnv = Object.fromEntries(Object.keys(env).map((k) => [k, process.env[k]]))
  const log = console.log
  const error = console.error
  const lines: string[] = []
  process.chdir(cwd)
  process.exitCode = undefined
  Object.assign(process.env, env)
  console.log = (...args: unknown[]) => lines.push(args.join(' '))
  console.error = () => {}
  try {
    await run(['fonts', 'deploy', ...argv])
    return { exitCode: process.exitCode as number | undefined, out: lines.join('\n') }
  } finally {
    console.log = log
    console.error = error
    process.chdir(previousCwd)
    process.exitCode = previousExit
    for (const [k, v] of Object.entries(previousEnv)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
}

/** Drive `bin/deploy` the way an operator does — a shell, from the repo root. */
function deploy(argv: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(path.join(REPO, 'bin', 'deploy'), ['--no-secrets-file', ...argv], {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 9 * 60_000,
    })
    return { status: 0, stdout, stderr: '' }
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}
