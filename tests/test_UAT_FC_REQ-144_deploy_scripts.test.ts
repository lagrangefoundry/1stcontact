import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { chmodSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { contentTypeFor } from '../apps/public-site/src/content-type'
import { missingFromEnv, parseWranglerConfig, readWranglerConfig } from './support/wrangler-toml'
import {
  EXPECTED_CONTENT_TYPES,
  referencedAssets,
  referencedFromCss,
  runSmoke,
  // @ts-expect-error — plain JS with no type declarations, deliberately: it has
  // to run from a shell straight after a deploy with no transform available.
} from '../tools/generate/bin/smoke.mjs'

const REPO = path.resolve(import.meta.dirname, '..')
const APPS = readdirSync(path.join(REPO, 'apps')).filter((app) =>
  existsSync(path.join(REPO, 'apps', app, 'wrangler.toml')),
)

function existsSync(file: string): boolean {
  try {
    statSync(file)
    return true
  } catch {
    return false
  }
}

/**
 * A fake origin behaving exactly as a correct `public-site` deploy does.
 *
 * `overrides` replaces the response for one URL, which is how the failure path
 * is exercised: a real deploy is not broken to prove the smoke script notices.
 */
function fakeOrigin(overrides: Record<string, Response> = {}) {
  const origin = 'https://example.test'
  const slug = 'acme'
  const draft = 'abc123def456'
  const root = `${origin}/site/${slug}/draft/${draft}`

  const html =
    '<!doctype html><html><head>' +
    '<link rel="stylesheet" href="./theme.css">' +
    '<script type="module" src="./app.js"></script>' +
    '</head><body><img src="./assets/logo.svg" alt=""></body></html>'
  const css = '@font-face{font-family:X;src:url("./fonts/x.woff2") format("woff2")}'

  const page = (body: string, type: string) =>
    new Response(body, {
      status: 200,
      headers: {
        'content-type': type,
        'cache-control': 'public, max-age=31536000, immutable',
        'x-robots-tag': 'noindex',
      },
    })

  const notFound = (draftChannel: boolean) =>
    new Response('Not Found', {
      status: 404,
      headers: draftChannel
        ? { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' }
        : { 'content-type': 'text/plain; charset=utf-8' },
    })

  const table: Record<string, () => Response> = {
    [`${origin}/`]: () =>
      new Response('Hello', { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } }),
    [`${origin}/site/${slug}`]: () =>
      new Response(null, { status: 301, headers: { location: `/site/${slug}/` } }),
    [`${origin}/site/${slug}/`]: () => notFound(false),
    [root]: () => new Response(null, { status: 301, headers: { location: `/site/${slug}/draft/${draft}/` } }),
    [`${root}/`]: () => page(html, 'text/html; charset=utf-8'),
    [`${root}/theme.css`]: () => page(css, 'text/css; charset=utf-8'),
    [`${root}/app.js`]: () => page('export {}', 'text/javascript; charset=utf-8'),
    [`${root}/assets/logo.svg`]: () => page('<svg/>', 'image/svg+xml'),
    [`${root}/fonts/x.woff2`]: () => page('font-bytes', 'font/woff2'),
  }

  const fetchImpl = async (input: string | URL) => {
    const url = String(input)
    const override = overrides[url]
    if (override) return override.clone()
    const hit = table[url]
    if (hit) return hit()
    return notFound(url.includes('/draft/'))
  }

  return { origin, slug, draft, root, fetch: fetchImpl }
}

describe('REQ-144 — build, deploy and smoke scripts', () => {
  /**
   * AC2 — the guard against the bug that made production 503.
   *
   * A named environment inherits neither `vars` nor bindings. Wrangler warns and
   * deploys anyway, so nothing mechanical stopped `control-app` shipping with no
   * `BUILDER_ORIGIN` at all. This is what stops it recurring: not a comment, not
   * a convention, an assertion over every Worker in the tree.
   */
  it('test_UAT_FC_REQ-144_named_environments_repeat_every_top_level_var_and_binding', () => {
    expect(APPS.length).toBeGreaterThan(0)

    for (const app of APPS) {
      const config = readWranglerConfig(path.join(REPO, 'apps', app, 'wrangler.toml'))
      const envNames = Object.keys(config.envs)
      expect(envNames, `${app} declares no named environment`).toContain('production')

      for (const envName of envNames) {
        const missing = missingFromEnv(config, envName)
        // ONE EXCEPTION, and it is the inverse of this rule rather than a hole in
        // it: `ACCESS_DEV_OPEN` opens an unconfigured Access gate for
        // `wrangler dev` (REQ-145), and its ABSENCE from production is what
        // makes that safe. A named environment inheriting no vars is exactly why
        // the top-level declaration cannot reach the deployed Worker. The REQ-145
        // suite asserts it stays absent; this one must not demand it be present.
        missing.vars = missing.vars.filter((v) => v !== 'ACCESS_DEV_OPEN')
        expect(
          missing.vars,
          `apps/${app}/wrangler.toml: [env.${envName}] does not repeat top-level vars ` +
            `${missing.vars.join(', ')} — a named environment does not inherit them, so the ` +
            'deployed Worker would see none of them',
        ).toEqual([])
        expect(
          missing.bindings,
          `apps/${app}/wrangler.toml: [env.${envName}] does not repeat top-level bindings ` +
            `${missing.bindings.join(', ')}`,
        ).toEqual([])
      }
    }
  })

  /**
   * The guard is only worth having if it CATCHES the bug, so it is pointed at
   * the exact configuration that shipped — control-app before the fix.
   */
  it('test_UAT_FC_REQ-144_inheritance_guard_catches_the_config_that_shipped', () => {
    const broken = `
name = "1stcontact-control-app"
main = "src/index.ts"

[vars]
BUILDER_ORIGIN = "http://localhost:8790"

[[r2_buckets]]
binding = "SITES"
bucket_name = "1stcontact-sites"

[env.production]
name = "1stcontact-control-app"
routes = [{ pattern = "app.1stcontact.io/*", zone_name = "1stcontact.io" }]
`
    const missing = missingFromEnv(parseWranglerConfig(broken), 'production')
    expect(missing.vars).toEqual(['BUILDER_ORIGIN'])
    expect(missing.bindings).toEqual(['r2_buckets:SITES'])

    const fixed =
      broken +
      `
[env.production.vars]
BUILDER_ORIGIN = "http://localhost:8790"

[[env.production.r2_buckets]]
binding = "SITES"
bucket_name = "1stcontact-sites"
`
    expect(missingFromEnv(parseWranglerConfig(fixed), 'production')).toEqual({
      vars: [],
      bindings: [],
    })
  })

  /** AC1 — the fix itself, stated as a fact about the file rather than a diff. */
  /**
   * REQ-145 DELETED THE VAR THIS ONCE PINNED. `control-app` proxied to a Node
   * origin named by `BUILDER_ORIGIN`; it is the origin now, so the var is gone
   * rather than emptied. What still has to hold is the property that made the
   * original assertion worth writing — the deployed Worker must carry the
   * configuration it cannot run without — so it is repointed at the store and
   * tenancy that replaced it.
   */
  it('test_UAT_FC_REQ-144_control_app_production_carries_what_it_cannot_run_without', () => {
    const config = readWranglerConfig(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'))
    expect(config.topLevel.vars).not.toContain('BUILDER_ORIGIN')
    expect(config.envs.production.vars).not.toContain('BUILDER_ORIGIN')

    for (const key of ['TENANT_ID', 'ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
      expect(config.envs.production.vars, key).toContain(key)
    }
    for (const binding of ['d1_databases:DB', 'r2_buckets:SITES', 'assets:ASSETS']) {
      expect(config.envs.production.bindings, binding).toContain(binding)
    }
  })

  /** AC3 — the three scripts exist and are runnable, not merely committed. */
  it('test_UAT_FC_REQ-144_build_deploy_and_smoke_are_executable_and_self_describing', () => {
    for (const script of ['build', 'deploy', 'smoke']) {
      const file = path.join(REPO, 'bin', script)
      expect(existsSync(file), `bin/${script} is missing`).toBe(true)
      // eslint-disable-next-line no-bitwise
      expect(statSync(file).mode & 0o111, `bin/${script} is not executable`).toBeGreaterThan(0)

      const help = execFileSync(file, ['--help'], { encoding: 'utf8' })
      expect(help, `bin/${script} --help says nothing`).toContain(`bin/${script}`)
    }
  })

  /**
   * The hooks are the whole reason this ticket does not depend on the store
   * chain, so the contract they promise is tested: a hook runs, it is told it is
   * a rehearsal, and a hook that fails stops the deploy BEFORE anything uploads.
   */
  it('test_UAT_FC_REQ-144_a_failing_hook_aborts_the_deploy_before_upload', () => {
    const hook = path.join(REPO, 'bin', 'deploy.d', 'migrate', '99-uat-abort')
    writeFileSync(
      hook,
      '#!/usr/bin/env bash\n' +
        'echo "uat-hook saw app=$DEPLOY_APP env=$DEPLOY_ENV dry=$DEPLOY_DRY_RUN"\n' +
        'exit 17\n',
    )
    chmodSync(hook, 0o755)
    try {
      let output = ''
      let failed = false
      try {
        execFileSync(path.join(REPO, 'bin', 'deploy'), ['--dry-run', 'public-site'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        })
      } catch (err) {
        failed = true
        const e = err as { stdout?: string; stderr?: string }
        output = `${e.stdout ?? ''}${e.stderr ?? ''}`
      }
      expect(failed, 'a hook exiting non-zero did not fail the deploy').toBe(true)
      expect(output).toContain('uat-hook saw app=public-site env=production dry=1')
      // Aborted before the upload stage — nothing wrangler prints appears.
      expect(output).not.toContain('Total Upload')
    } finally {
      rmSync(hook, { force: true })
    }
  })

  /** Non-executable files in a hook directory are documentation, not hooks. */
  it('test_UAT_FC_REQ-144_hook_directories_ignore_non_executable_files', () => {
    for (const kind of ['migrate', 'secrets']) {
      const readme = path.join(REPO, 'bin', 'deploy.d', kind, 'README.md')
      expect(existsSync(readme), `bin/deploy.d/${kind}/README.md is missing`).toBe(true)
      // eslint-disable-next-line no-bitwise
      expect(statSync(readme).mode & 0o111).toBe(0)
    }
    const output = execFileSync(path.join(REPO, 'bin', 'deploy'), ['--help'], { encoding: 'utf8' })
    expect(output).toContain('bin/deploy.d/migrate/')
    expect(output).toContain('bin/deploy.d/secrets/')
  })

  /** AC6 — no secret value anywhere the repository can leak one. */
  it('test_UAT_FC_REQ-144_no_secret_value_is_committed_or_echoed', () => {
    const files = [
      ...['build', 'deploy', 'smoke'].map((s) => path.join(REPO, 'bin', s)),
      ...['migrate', 'secrets'].map((k) => path.join(REPO, 'bin', 'deploy.d', k, 'README.md')),
      ...APPS.map((app) => path.join(REPO, 'apps', app, 'wrangler.toml')),
    ]

    // Shapes a real credential takes. Split so this file is not its own match.
    const shapes = [
      new RegExp(['sk', 'ant', 'api'].join('-')),
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /\b[A-Za-z0-9_-]*(?:SECRET|TOKEN|API_KEY|PASSWORD)[A-Za-z0-9_-]*\s*=\s*["'][^"'$][^"']{7,}/,
    ]

    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const shape of shapes) {
        expect(shape.test(text), `${path.relative(REPO, file)} looks like it contains a secret`).toBe(
          false,
        )
      }
    }

    // A secret reaches Cloudflare's store and nowhere else. The documented
    // mechanism must pipe the value, never pass it as an argument (visible in
    // `ps` and in history) and never echo it back.
    const secretsDoc = readFileSync(path.join(REPO, 'bin', 'deploy.d', 'secrets', 'README.md'), 'utf8')
    expect(secretsDoc).toContain('wrangler secret put')
    expect(secretsDoc).toMatch(/printf '%s'[^\n]*\|/)
    expect(secretsDoc).not.toMatch(/wrangler secret put \w+ [^-\n]/)
  })

  /**
   * The smoke script's content-type table is a second statement of the Worker's
   * own, because it runs outside the bundle and cannot import it. Pinned here so
   * the pair cannot drift — the arrangement `content-type.ts` already records.
   */
  it('test_UAT_FC_REQ-144_smoke_content_types_agree_with_the_worker', () => {
    const table = EXPECTED_CONTENT_TYPES as Record<string, string>
    expect(Object.keys(table).length).toBeGreaterThan(10)
    for (const [ext, expected] of Object.entries(table)) {
      expect(contentTypeFor(`file.${ext}`), `smoke and the Worker disagree about .${ext}`).toBe(
        expected,
      )
    }
  })

  /** Asset discovery finds what a rendered page actually references. */
  it('test_UAT_FC_REQ-144_asset_discovery_follows_document_relative_references', () => {
    const base = 'https://example.test/site/acme/draft/abc123def456/'
    const found = referencedAssets(
      '<link rel="stylesheet" href="./theme.css">' +
        '<script src="./app.js"></script>' +
        '<img src=\'./assets/logo.svg\'>' +
        '<a href="#top">x</a>' +
        '<img src="data:image/png;base64,AAAA">' +
        '<script src="https://cdn.example.com/other.js"></script>' +
        '<div style="background:url(./bg.png)"></div>',
      base,
    ) as string[]

    expect(found.sort()).toEqual([
      `${base}app.js`,
      `${base}assets/logo.svg`,
      `${base}bg.png`,
      `${base}theme.css`,
    ])

    // Fonts hide one level down, inside the stylesheet.
    const nested = referencedFromCss(
      '@font-face{src:url("./fonts/x.woff2") format("woff2")}',
      `${base}theme.css`,
    ) as string[]
    expect(nested).toEqual([`${base}fonts/x.woff2`])
  })

  /** A healthy origin passes every check — the baseline AC5's failures are read against. */
  it('test_UAT_FC_REQ-144_smoke_passes_against_a_correct_origin', async () => {
    const fake = fakeOrigin()
    const report = await runSmoke({
      origin: fake.origin,
      slug: fake.slug,
      draft: fake.draft,
      fetch: fake.fetch,
    })

    expect(report.failed.map((c: { name: string }) => c.name)).toEqual([])
    expect(report.ok).toBe(true)
    // Every SITE check ran. REQ-147 added control-app checks on an independent
    // axis (`--control-origin` / `--workers-dev-origin`), and this origin is a
    // public-site: they skip here because there is nothing to point them at, not
    // because anything was left untested.
    expect(
      report.checks
        .filter((c: { status: string }) => c.status === 'skip')
        .map((c: { name: string }) => c.name),
    ).toEqual(['control_app_challenges_unauthenticated', 'control_app_workers_dev_closed'])
    expect(report.checks.map((c: { name: string }) => c.name)).toContain('draft_assets_resolve')
  })

  /**
   * AC5 — each way a deploy is broken fails, non-zero, naming the assertion.
   *
   * Table-driven because the value is in the COVERAGE: a smoke script that only
   * notices a 500 is a smoke script that passes on the silent breakages, which
   * are the ones that actually happen.
   */
  it.each([
    {
      what: 'a referenced asset that 404s',
      url: 'https://example.test/site/acme/draft/abc123def456/theme.css',
      response: () => new Response('Not Found', { status: 404 }),
      check: 'draft_assets_resolve',
    },
    {
      what: 'a font served as the wrong type',
      url: 'https://example.test/site/acme/draft/abc123def456/fonts/x.woff2',
      response: () =>
        new Response('font', { status: 200, headers: { 'content-type': 'application/octet-stream' } }),
      check: 'draft_assets_resolve',
    },
    {
      what: 'a preview that lost its noindex',
      url: 'https://example.test/site/acme/draft/abc123def456/',
      response: () =>
        new Response('<html></html>', {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=31536000, immutable',
          },
        }),
      check: 'draft_cache_and_robots_policy',
    },
    {
      what: 'a lost trailing-slash redirect',
      url: 'https://example.test/site/acme/draft/abc123def456',
      response: () => new Response('Not Found', { status: 404 }),
      check: 'draft_root_redirects',
    },
    {
      what: 'a 404 that reveals the site exists',
      url: 'https://example.test/site/acme/',
      response: () =>
        new Response('No published revision for acme', {
          status: 404,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      check: 'unpublished_slug_indistinguishable',
    },
    {
      what: 'an apex that stopped resolving',
      url: 'https://example.test/',
      response: () => new Response('boom', { status: 500 }),
      check: 'apex_resolves',
    },
  ])('test_UAT_FC_REQ-144_smoke_fails_naming_the_assertion — $what', async ({ url, response, check }) => {
    const fake = fakeOrigin({ [url]: response() })
    const report = await runSmoke({
      origin: fake.origin,
      slug: fake.slug,
      draft: fake.draft,
      fetch: fake.fetch,
    })

    expect(report.ok).toBe(false)
    expect(report.failed.map((c: { name: string }) => c.name)).toContain(check)
    const failure = report.failed.find((c: { name: string }) => c.name === check)
    expect(failure.detail.length, 'a failure must say what it expected').toBeGreaterThan(0)
  })

  /** Nothing to test against is reported as skipped, never quietly as passing. */
  it('test_UAT_FC_REQ-144_smoke_reports_untested_checks_as_skipped', async () => {
    const fake = fakeOrigin()
    const report = await runSmoke({ origin: fake.origin, fetch: fake.fetch })

    expect(report.ok).toBe(true)
    const skipped = report.checks
      .filter((c: { status: string }) => c.status === 'skip')
      .map((c: { name: string }) => c.name)
    expect(skipped).toContain('draft_assets_resolve')
    expect(skipped).toContain('published_root_redirects')
  })

  /** The build preflight refuses a tree whose shared component store is incomplete. */
  it('test_UAT_FC_REQ-144_preflight_refuses_a_missing_shared_component', async () => {
    const { assertSharedStore, checkSharedStore, sharedComponents } = await import(
      '../tools/generate/src/cli/shared-store'
    )

    const all = sharedComponents()
    expect(all.length).toBeGreaterThan(0)
    expect(all.some((c) => c.surface === 'browser')).toBe(true)
    expect(all.some((c) => c.surface === 'server')).toBe(true)

    const absent = all[0].component
    const resolve = (component: string) => (component === absent ? undefined : '/somewhere')

    expect(checkSharedStore({ resolve }).ok).toBe(false)
    expect(() => assertSharedStore({ resolve })).toThrowError(
      new RegExp(`${absent}[^]*does not resolve`),
    )
    // The remedy is named, because "not installed" is unactionable without it.
    try {
      assertSharedStore({ resolve })
      throw new Error('expected assertSharedStore to throw')
    } catch (err) {
      const e = err as { code?: string; hint?: string }
      expect(e.code).toBe('ENVIRONMENT')
      expect(e.hint).toContain('bin/install')
    }

    expect(checkSharedStore({ resolve: () => '/somewhere' }).ok).toBe(true)
  })
})
