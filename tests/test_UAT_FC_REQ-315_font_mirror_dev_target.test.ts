/**
 * [[REQ-315]] — the font mirror's **dev** target, and `bin/deploy --fonts`.
 *
 * WHAT WAS MISSING. [[REQ-312]] built the mirror and gave it one delivery —
 * `1c fonts publish`, which writes the cloud R2 bucket over the REST API. Local
 * dev is `wrangler dev`, where `env.SITES` is miniflare's own R2 under
 * `.wrangler/state/v3/r2/`, which publish never touches. So a full mirror and a
 * full publish still left every local preview 404ing every platform font.
 *
 * AND THE ASSISTANT'S PROJECTION MAKES THAT ACTIVELY HARMFUL. `1c fonts index`
 * builds from the STAGED manifest and is a build-time global, while the bytes
 * are per-environment: `use_font` refuses honestly while the projection is empty
 * and starts succeeding the moment the mirror completes — binding `/_fonts/…`
 * paths local dev cannot answer. The operator is shown a fallback face while
 * being told they chose Roboto, which is [[REQ-312]]'s own failure surviving in
 * the one environment the work is done in.
 *
 * THE OBSERVATION IS ALWAYS THE SERVED BYTES, never the seed's own report: each
 * UAT below opens the seeded store with a FRESH miniflare instance — the same
 * `R2Bucket` API `wrangler dev` hands the Worker — and reads it back through
 * `r2PlatformFonts`, the very reader the deployed Worker uses. A report claiming
 * an object was written is exactly the evidence this ticket exists because
 * nobody had.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Miniflare } from 'miniflare'
import { afterEach, describe, expect, it } from 'vitest'
import { platformFontKey } from '../packages/site-schema/src/fonts'
import { r2PlatformFonts, servePreviewPlatformFont } from '../apps/control-app/src/platform-fonts'
import { cmdFontsMirror } from '../tools/generate/src/cli/font-mirror'
import { MANIFEST_REL, MIRROR_DIR_REL } from '../tools/generate/src/fonts/mirror'
import { PLATFORM_BUCKET } from '../tools/generate/src/fonts/publish'
import { localStores, runSeed, R2_PERSIST_REL } from '../tools/generate/src/fonts/seed'
import { run } from '../tools/generate/src/cli/index'

const REPO = path.resolve(import.meta.dirname, '..')
/** A REAL TrueType font, already committed to this repository. */
const UPSTREAM_TTF = fileURLToPath(new URL('./fixtures/capture/heading-font.ttf', import.meta.url))
const TODAY = '2026-09-23'
const REF = '0123456789abcdef0123456789abcdef01234567'

const HEADING = { slug: 'headingfont', family: 'Heading Font', file: 'HeadingFont-Regular.ttf' }
const BODY = { slug: 'bodyface', family: 'Body Face', file: 'BodyFace-Regular.ttf' }
type Fixture = typeof HEADING

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** A google/fonts-shaped checkout the mirror can read: metadata, licence, real bytes. */
function makeCheckout(families: Fixture[]): string {
  const checkout = mkdtempSync(path.join(tmpdir(), 'req315-gf-'))
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

/**
 * A repo-shaped workspace with app directories.
 *
 * `apps` is the list of app directory names and whether each DECLARES the
 * platform bucket, because "which surfaces will answer" is the question the
 * local target has to be honest about — an app that never declares the bucket
 * must not be handed a store, and one that does must not be skipped.
 */
function makeWorkspace(families: Fixture[], apps: { name: string; bucket?: boolean }[]): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req315-repo-'))
  mkdirSync(path.join(cwd, 'fonts'), { recursive: true })
  writeFileSync(
    path.join(cwd, 'fonts', 'registry.yaml'),
    'fonts: []\n',
  )
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
    }, null, 1),
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
function fixture(families: Fixture[], apps: { name: string; bucket?: boolean }[] = [{ name: 'control-app' }]) {
  const cwd = makeWorkspace(families, apps)
  const repo = makeCheckout(families)
  scratch.push(cwd, repo)
  // `quality: 5` for wall-clock only — the container and the round-trip check
  // are identical at every brotli level, and this fixture is about delivery.
  cmdFontsMirror({ cwd, repo, ref: REF, today: TODAY, quality: 5 })
  return { cwd, repo }
}
afterEach(() => {
  while (scratch.length > 0) {
    const dir = scratch.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

/**
 * Read one mirror-relative path back the way the DEPLOYED Worker reads it.
 *
 * A fresh miniflare over the persisted store, `r2PlatformFonts(env.SITES)` over
 * that, and `servePreviewPlatformFont` over that — so what is asserted is the
 * response a `wrangler dev` builder would hand the browser, not a row the seed
 * believes it wrote.
 */
async function servedFrom(cwd: string, app: string, relPath: string): Promise<Response | null> {
  const mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response(null, { status: 404 }) } }',
    r2Buckets: { SITES: PLATFORM_BUCKET },
    r2Persist: path.join(cwd, 'apps', app, R2_PERSIST_REL),
  })
  try {
    const bucket = (await mf.getR2Bucket('SITES')) as unknown as Parameters<typeof r2PlatformFonts>[0]
    return await servePreviewPlatformFont(relPath, r2PlatformFonts(bucket))
  } finally {
    await mf.dispose()
  }
}

/** Every key present in one app's local store, so the PREFIX can be asserted. */
async function keysIn(cwd: string, app: string): Promise<string[]> {
  const mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response(null, { status: 404 }) } }',
    r2Buckets: { SITES: PLATFORM_BUCKET },
    r2Persist: path.join(cwd, 'apps', app, R2_PERSIST_REL),
  })
  try {
    const bucket = await mf.getR2Bucket('SITES')
    const listed = await bucket.list({ limit: 1000 })
    return listed.objects.map((o) => o.key).sort()
  } finally {
    await mf.dispose()
  }
}

function stagedFile(cwd: string, relPath: string): Buffer {
  return readFileSync(path.join(cwd, MIRROR_DIR_REL, ...relPath.split('/')))
}

function fontPath(cwd: string, family: Fixture): string {
  const manifest = JSON.parse(readFileSync(path.join(cwd, MANIFEST_REL), 'utf8')) as {
    families: { slug: string; files: { path: string }[] }[]
  }
  return manifest.families.find((f) => f.slug === family.slug)!.files[0].path
}

// ── UATs ─────────────────────────────────────────────────────────────────────

describe('REQ-315 — the mirror reaches the environment the work is done in', () => {
  /**
   * The whole ticket in one observation: the staged mirror lands in miniflare's
   * local R2 under the SAME `platform/fonts/` prefix and the SAME key function
   * publish writes, so `r2PlatformFonts(env.SITES)` serves dev UNCHANGED — not
   * merely the same interface as production but the same implementation.
   */
  it('test_UAT_FC_REQ-315_a_seeded_store_serves_the_staged_bytes_through_the_deployed_reader', async () => {
    const { cwd } = fixture([HEADING])
    const rel = fontPath(cwd, HEADING)

    await runSeed({ cwd })

    const response = await servedFrom(cwd, 'control-app', rel)
    expect(response?.status).toBe(200)
    expect(response?.headers.get('content-type')).toBe('font/woff2')
    // Byte-for-byte what the mirror converted — not merely "something answered".
    const served = new Uint8Array(await response!.arrayBuffer())
    expect(Buffer.from(served).equals(stagedFile(cwd, rel))).toBe(true)

    // And under the key `1c fonts publish` writes, which is what makes the two
    // environments the same arrangement rather than two that happen to work.
    expect(await keysIn(cwd, 'control-app')).toContain(platformFontKey(rel))
  })

  /**
   * "Absent bytes return `null` and 404 identically in both, so a missing family
   * fails the same way everywhere rather than one environment throwing and
   * another going quiet."
   */
  it('test_UAT_FC_REQ-315_a_family_the_mirror_does_not_hold_is_absent_rather_than_an_error', async () => {
    const { cwd } = fixture([HEADING])
    await runSeed({ cwd })

    expect(await servedFrom(cwd, 'control-app', 'nosuchfamily/NoSuch-Regular.woff2')).toBeNull()
  })

  /**
   * The local bucket is NOT one place: `.wrangler/state` is per app directory,
   * so seeding one app leaves a locally-served published site 404ing the fonts
   * the preview beside it renders. Every app that declares the bucket is seeded,
   * one that does not is never given a store, and the report names which
   * surfaces will answer.
   */
  it('test_UAT_FC_REQ-315_every_app_declaring_the_bucket_is_seeded_and_the_report_names_them', async () => {
    const { cwd } = fixture([HEADING], [
      { name: 'control-app' },
      { name: 'public-site' },
      { name: 'docs-app', bucket: false },
    ])
    const rel = fontPath(cwd, HEADING)

    // What ONE store would hold, so the two-store run can be measured against it.
    const one = await runSeed({ cwd, apps: ['control-app'], dryRun: true })

    const report = await runSeed({ cwd })

    expect(report.stores?.map((s) => s.app)).toEqual(['control-app', 'public-site'])
    // Two stores are two sets of writes — but not twice the corpus. Seeding a
    // second app does not make the mirror bigger, and `bytes` is the number an
    // operator checks against their disk.
    expect(report.uploaded).toBe(one.uploaded * 2)
    expect(report.bytes).toBe(one.bytes)
    for (const store of report.stores ?? []) {
      expect(store.persist).toContain(path.join('apps', store.app))
    }
    // Both surfaces answer, which is the fact the report is claiming.
    expect((await servedFrom(cwd, 'control-app', rel))?.status).toBe(200)
    expect((await servedFrom(cwd, 'public-site', rel))?.status).toBe(200)
    // And an app that never declares the bucket is never handed a store.
    expect(localStores(cwd).map((s) => s.app)).not.toContain('docs-app')
    expect(existsSync(path.join(cwd, 'apps', 'docs-app', '.wrangler'))).toBe(false)
  })

  /** `--app` narrows the target, and the report stays honest about the narrowing. */
  it('test_UAT_FC_REQ-315_naming_an_app_seeds_that_store_and_says_so', async () => {
    const { cwd } = fixture([HEADING], [{ name: 'control-app' }, { name: 'public-site' }])
    const rel = fontPath(cwd, HEADING)

    const report = await runSeed({ cwd, apps: ['control-app'] })

    expect(report.stores?.map((s) => s.app)).toEqual(['control-app'])
    expect((await servedFrom(cwd, 'control-app', rel))?.status).toBe(200)
    expect(existsSync(path.join(cwd, 'apps', 'public-site', '.wrangler'))).toBe(false)
  })

  /**
   * Digest-checked per object, the same property the cloud publish has and for
   * the same reason: a re-seed of an unchanged mirror must move nothing, or the
   * cost of keeping dev current would scale with the corpus every time.
   */
  it('test_UAT_FC_REQ-315_reseeding_an_unchanged_mirror_transfers_nothing', async () => {
    const { cwd } = fixture([HEADING, BODY])

    const first = await runSeed({ cwd })
    expect(first.uploaded).toBeGreaterThan(0)
    expect(first.unchanged).toBe(0)

    const second = await runSeed({ cwd })
    expect(second.uploaded).toBe(0)
    expect(second.unchanged).toBe(first.uploaded)

    // And the bytes are still there — "nothing moved" is not "nothing is held".
    expect((await servedFrom(cwd, 'control-app', fontPath(cwd, BODY)))?.status).toBe(200)
  })

  /**
   * "`--dry-run` reports what would move and moves nothing, on both targets —
   * `bin/deploy` guarantees this of every hook."
   */
  it('test_UAT_FC_REQ-315_a_dry_run_reports_what_would_move_and_writes_no_store', async () => {
    const { cwd } = fixture([HEADING])

    const report = await runSeed({ cwd, dryRun: true })

    expect(report.dryRun).toBe(true)
    expect(report.uploaded).toBeGreaterThan(0)
    expect(report.bytes).toBeGreaterThan(0)
    expect(report.stores?.map((s) => s.app)).toEqual(['control-app'])
    // Nothing was written: the store does not exist at all.
    expect(existsSync(path.join(cwd, 'apps', 'control-app', '.wrangler'))).toBe(false)
  })

  /**
   * "An unstaged or partial mirror refuses and says which objects are missing,
   * rather than publishing a mirror that is not one."
   */
  it('test_UAT_FC_REQ-315_a_partial_mirror_names_what_is_missing_and_the_cli_fails', async () => {
    const { cwd } = fixture([HEADING, BODY])
    const gone = fontPath(cwd, BODY)
    rmSync(path.join(cwd, MIRROR_DIR_REL, ...gone.split('/')))

    const report = await runSeed({ cwd })
    expect(report.missing).toContain(gone)

    // Through the real CLI, because what matters is that a caller — `bin/deploy
    // --fonts` among them — is stopped rather than told in passing.
    expect(await runCli(cwd, ['fonts', 'seed'])).toBeTruthy()
  })

  /**
   * "After a mirror completes, the operator starts the builder and fonts work,
   * having typed nothing extra and having chosen no environment."
   *
   * The same treatment `1c fonts mirror` already gives the assistant's
   * projection: a mirror that leaves the operator's own dev environment unable
   * to serve what it just converted has not finished.
   */
  it('test_UAT_FC_REQ-315_a_mirror_run_leaves_local_dev_serving_what_it_converted', async () => {
    const cwd = makeWorkspace([HEADING], [{ name: 'control-app' }])
    const repo = makeCheckout([HEADING])
    scratch.push(cwd, repo)

    // The whole of what the operator types. No seed verb, no environment.
    expect(await runCli(cwd, ['fonts', 'mirror', '--repo', repo, '--ref', REF, '--quality', '5'])).toBeFalsy()

    const response = await servedFrom(cwd, 'control-app', fontPath(cwd, HEADING))
    expect(response?.status).toBe(200)
  })
})

describe('REQ-315 — `bin/deploy --fonts` is the operator’s door onto both targets', () => {
  /**
   * `--fonts` deploys the mirror and NOTHING ELSE: a 1.35GB corpus and a Worker
   * move on different schedules, so each is named. No app is deployed and no
   * capability section is printed, because no hook ran and a report with no rows
   * reads as a clean bill of health for probes that never happened.
   */
  it('test_UAT_FC_REQ-315_the_fonts_target_deploys_no_app_and_claims_no_capability', () => {
    const ran = deploy(['--fonts', '--env', 'dev', '--dry-run'])
    expect(ran.stdout).toContain('platform fonts → dev')
    expect(ran.stdout).not.toContain('Capabilities')
    expect(ran.stdout).not.toContain('Deployed')
    expect(ran.stdout).not.toContain('wrangler deploy')
  })

  /** Production is the existing path, reached through the door an operator already opens. */
  it('test_UAT_FC_REQ-315_the_production_target_is_the_existing_publish', () => {
    const ran = deploy(['--fonts', '--dry-run'])
    // Defaulted, exactly as the rest of `bin/deploy` defaults.
    expect(ran.stdout).toContain('platform fonts → production')
  })

  /**
   * Two environments and no third. `--env staging` is named in `bin/deploy`'s own
   * usage comment and has never existed in either app's configuration, so a
   * fonts run that accepted it would pick a target by accident.
   */
  it('test_UAT_FC_REQ-315_an_environment_that_is_not_a_font_target_is_refused', () => {
    const ran = deploy(['--fonts', '--env', 'staging', '--dry-run'])
    expect(ran.status).not.toBe(0)
    expect(ran.stderr).toContain('production')
    expect(ran.stderr).toContain('dev')
  })

  /**
   * There is ONE cloud bucket and the mirror is not per-app, so naming an app
   * for production would imply an arrangement that does not exist — and running
   * it per app would re-read and re-hash the whole corpus to transfer nothing.
   * Locally `.wrangler/state` IS per app, so there the same name narrows.
   */
  it('test_UAT_FC_REQ-315_an_app_name_narrows_the_local_target_and_is_refused_for_the_cloud', () => {
    const cloud = deploy(['--fonts', '--env', 'production', 'control-app', '--dry-run'])
    expect(cloud.status).not.toBe(0)
    expect(cloud.stderr).toContain('one bucket')

    const local = deploy(['--fonts', '--env', 'dev', 'control-app', '--dry-run'])
    expect(local.stdout).toContain('platform fonts → dev')
  })

  /** The help names both targets in the same voice, and neither apologises for the other. */
  it('test_UAT_FC_REQ-315_the_help_names_both_targets_and_the_quality_cliff', () => {
    const help = deploy(['--help'])
    expect(help.status).toBe(0)
    expect(help.stdout).toContain('--fonts')
    expect(help.stdout).toContain('--env dev')
    expect(help.stdout).toContain('--quality 9')
  })
})

// ── Drivers ──────────────────────────────────────────────────────────────────

/** Drive the real CLI and return the exit code it set (`undefined` = success). */
async function runCli(cwd: string, argv: string[]): Promise<number | undefined> {
  const previousCwd = process.cwd()
  const previousExit = process.exitCode
  const log = console.log
  const error = console.error
  process.chdir(cwd)
  process.exitCode = undefined
  console.log = () => {}
  console.error = () => {}
  try {
    await run(argv)
    return process.exitCode
  } finally {
    console.log = log
    console.error = error
    process.chdir(previousCwd)
    process.exitCode = previousExit
  }
}

/** Drive `bin/deploy` the way an operator does — a shell, from the repo root. */
function deploy(argv: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(path.join(REPO, 'bin', 'deploy'), argv, {
      cwd: REPO,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return { status: 0, stdout, stderr: '' }
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string }
    return { status: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}
