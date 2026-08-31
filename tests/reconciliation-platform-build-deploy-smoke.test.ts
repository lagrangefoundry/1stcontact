/**
 * Reconciliation UATs for story-d5167ced — "Platform Build, Deploy & Smoke: One
 * Path To Ship A Worker, And Proof It Serves".
 *
 * Reconciled from bundle-77b28def (BUNDLE-19), plan item 9 of 9. One UAT per
 * acceptance criterion:
 *
 *   • AC-1330 — the environment preflight reports both halves, distinguishes a
 *     browser component from a server one, and refuses an incomplete tree with
 *     an environment-specific exit code and a named remedy.
 *   • AC-1331 — `bin/build` discovers every Worker, bundles each against the
 *     production environment, runs the preflight first, honours the skip option,
 *     and refuses a tree with nothing to build.
 *   • AC-1332 — a rehearsal is the same path: same hooks, same invocation plus
 *     one flag, nothing uploaded, reported as rehearsed.
 *   • AC-1333 — hooks are discovered by executability, run sorted, migrate then
 *     secrets, before the upload, with the deploy context in their environment.
 *   • AC-1334 — a hook that fails aborts that app before anything is uploaded.
 *   • AC-1335 — target selection: all discovered by default, named apps honoured,
 *     an unknown app refused listing the real ones.
 *   • AC-1336 — every applicable check passes against a correctly serving origin
 *     and the run exits zero; the two control-surface checks, which sit on an
 *     independent axis, are NAMED as skipped rather than forbidden.
 *   • AC-1337 — each distinct silent breakage fails, naming the check that owns it.
 *   • AC-1338 — a check with nothing to test against is skipped, never passed.
 *   • AC-1339 — every same-origin asset a preview references resolves, following
 *     one level into stylesheets.
 *   • AC-1340 — an unpublished site is indistinguishable from an unknown one.
 *   • AC-1341 — every named environment repeats every top-level var and binding,
 *     with exactly one stated exception: the local-development relaxation.
 *   • AC-1342 — no secret value is committed, and the documented push is piped,
 *     newline-free, and echoes only the name — proven by running the hook.
 *
 * THREE BOUNDARIES, chosen per criterion for what it actually claims:
 *
 *   - **The real shell scripts, against a fixture tree.** `bin/build` and
 *     `bin/deploy` resolve their repo root from their own location, so copying
 *     the unmodified scripts into a temporary tree runs exactly the bytes that
 *     ship while giving the test control of the apps, the hooks and the
 *     environment. `pnpm`, `npx` (wrangler) and — in the fixture tree only —
 *     `bin/1c` are replaced by recording shims on PATH: they are the external
 *     boundary (a package manager, an upload to Cloudflare, a separately
 *     criterioned command), and stubbing them is what makes the ORDER and the
 *     COMPOSED COMMAND LINE observable at all. Nothing internal is mocked.
 *   - **The real `1c` binary**, from the real repo, for the preflight — with a
 *     module-resolution hook that makes one shared component genuinely
 *     unresolvable, which is the fault the preflight exists for. Nothing on disk
 *     is touched.
 *   - **A live local origin** plus `runSmoke`, for the smoke checks. The story
 *     states the check engine is drivable against a supplied origin precisely so
 *     its failure path is exercised without breaking a real deploy; the exit
 *     status and the summary are read from the real `smoke.mjs` process against
 *     a Node HTTP server standing in for the deployed Worker.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { contentTypeFor } from '../apps/public-site/src/content-type'
import { DEV_ONLY_VAR, missingFromEnv, parseWranglerConfig, readWranglerConfig } from './support/wrangler-toml'
// `WEBUI_SCOPE` is imported rather than written: AC-960 declares the component
// scope exactly once, and every reference — this suite's included — composes it
// from that declaration.
import {
  COMMAND_DEPS,
  SHARED_STORE_INSTALL_COMMAND,
  sharedComponents,
  WEBUI_SCOPE,
} from '../tools/generate/src/cli'
import { EXIT_CODES } from '../tools/generate/src/cli/errors'
import {
  EXPECTED_CONTENT_TYPES,
  formatReport,
  referencedAssets,
  referencedFromCss,
  runSmoke,
  // @ts-expect-error — plain JS with no type declarations, deliberately: it has
  // to run from a shell straight after a deploy with no transform available.
} from '../tools/generate/bin/smoke.mjs'

const REPO = realpathSync(fileURLToPath(new URL('..', import.meta.url)))

// Every Worker in the real tree — one per `apps/*/wrangler.toml`, discovered.
const APPS = readdirSync(path.join(REPO, 'apps'))
  .filter((app) => existsSync(path.join(REPO, 'apps', app, 'wrangler.toml')))
  .sort()

interface Run {
  code: number
  out: string
  err: string
  all: string
}

function sh(cmd: string, args: string[], opts: { cwd: string; env?: NodeJS.ProcessEnv }): Run {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd,
    encoding: 'utf8',
    env: { ...process.env, ...opts.env },
  })
  const out = res.stdout ?? ''
  const err = res.stderr ?? ''
  return { code: res.status ?? -1, out, err, all: out + err }
}

// ── fixture tree: the real scripts, a tree we control, recording shims ───────

const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

interface HookSpec {
  kind: 'migrate' | 'secrets'
  name: string
  /** Bash body, minus the shebang. Defaults to recording the deploy context. */
  body?: string
  /** false writes it 0644 — documentation, which must never run. */
  executable?: boolean
}

interface Tree {
  root: string
  /** Everything the shims and hooks recorded, in order. */
  log: () => string[]
  env: NodeJS.ProcessEnv
}

/** Record the deploy context a hook was handed, as one parseable line. */
function contextHook(label: string): string {
  const fields = 'hook|%s|app=%s|dir=%s|env=%s|name=%s|dry=%s|root=%s'
  const values = '"$DEPLOY_APP" "$DEPLOY_APP_DIR" "$DEPLOY_ENV" "$DEPLOY_WORKER_NAME" "$DEPLOY_DRY_RUN" "$DEPLOY_REPO_ROOT"'
  return `printf '${fields}\\n' '${label}' ${values} >> "$SHIM_LOG"\n`
}

function writeScript(file: string, body: string, executable = true): void {
  writeFileSync(file, `#!/usr/bin/env bash\nset -euo pipefail\n${body}`)
  chmodSync(file, executable ? 0o755 : 0o644)
}

function makeTree(opts: {
  label: string
  apps?: string[]
  hooks?: HookSpec[]
  /** Exit code the fixture tree's `bin/1c` stub returns. */
  oneCExit?: number
}): Tree {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), `d5167ced-${opts.label}-`)))
  roots.push(root)

  // The real scripts, byte-for-byte — they resolve their repo root from here.
  mkdirSync(path.join(root, 'bin'), { recursive: true })
  for (const script of ['build', 'deploy']) {
    const dest = path.join(root, 'bin', script)
    copyFileSync(path.join(REPO, 'bin', script), dest)
    chmodSync(dest, 0o755)
  }
  // `bin/1c` is a separate command with its own criterion (AC-1330); here it is
  // a stub so `bin/build`'s ORDERING and exit-code propagation are observable.
  writeScript(
    path.join(root, 'bin', '1c'),
    `printf '1c|%s\\n' "$*" >> "$SHIM_LOG"\necho "stub preflight"\nexit "\${ONE_C_EXIT:-0}"\n`,
  )

  for (const kind of ['migrate', 'secrets'] as const) {
    const dir = path.join(root, 'bin', 'deploy.d', kind)
    mkdirSync(dir, { recursive: true })
    // Documentation beside the hooks — non-executable, so never run.
    writeFileSync(path.join(dir, 'README.md'), `# ${kind} hooks (fixture)\n`)
    chmodSync(path.join(dir, 'README.md'), 0o644)
  }
  for (const hook of opts.hooks ?? []) {
    writeScript(
      path.join(root, 'bin', 'deploy.d', hook.kind, hook.name),
      hook.body ?? contextHook(`${hook.kind}/${hook.name}`),
      hook.executable !== false,
    )
  }

  mkdirSync(path.join(root, 'apps'), { recursive: true })
  for (const app of opts.apps ?? []) {
    mkdirSync(path.join(root, 'apps', app, 'src'), { recursive: true })
    writeFileSync(path.join(root, 'apps', app, 'src', 'index.ts'), 'export default {}\n')
    writeFileSync(
      path.join(root, 'apps', app, 'wrangler.toml'),
      // The deployed Worker's name deliberately differs from the directory, so
      // a hook reading DEPLOY_WORKER_NAME cannot pass by accident.
      `name = "worker-${app}"\nmain = "src/index.ts"\n\n` +
        `[env.production]\nname = "prod-${app}"\n\n` +
        `[env.staging]\nname = "stage-${app}"\n`,
    )
  }

  // pnpm and wrangler are the external boundary: recorded, never run.
  const shim = path.join(root, 'shim')
  mkdirSync(shim, { recursive: true })
  writeScript(path.join(shim, 'pnpm'), `printf 'pnpm|%s|%s\\n' "$*" "$PWD" >> "$SHIM_LOG"\n`)
  writeScript(
    path.join(shim, 'npx'),
    `printf 'npx|%s|%s\\n' "$*" "$PWD" >> "$SHIM_LOG"\n` +
      // Real wrangler writes the bundle; `bin/build` reports what it finds.
      `if [[ "$*" == *"--outdir dist"* ]]; then mkdir -p dist && printf x > dist/index.js; fi\n`,
  )

  const shimLog = path.join(root, 'shim.log')
  writeFileSync(shimLog, '')

  return {
    root,
    log: () =>
      readFileSync(shimLog, 'utf8')
        .split('\n')
        .filter((l) => l !== ''),
    env: {
      PATH: `${shim}:${process.env.PATH ?? ''}`,
      SHIM_LOG: shimLog,
      ONE_C_EXIT: String(opts.oneCExit ?? 0),
    },
  }
}

/** PATH shims for a run against the REAL repo — discovery must see the real tree. */
function realRepoShims(label: string): { env: NodeJS.ProcessEnv; log: () => string[] } {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), `d5167ced-${label}-`)))
  roots.push(dir)
  const shim = path.join(dir, 'shim')
  mkdirSync(shim, { recursive: true })
  writeScript(path.join(shim, 'pnpm'), `printf 'pnpm|%s|%s\\n' "$*" "$PWD" >> "$SHIM_LOG"\n`)
  writeScript(
    path.join(shim, 'npx'),
    `printf 'npx|%s|%s\\n' "$*" "$PWD" >> "$SHIM_LOG"\n` +
      `if [[ "$*" == *"--outdir dist"* ]]; then mkdir -p dist && printf x > dist/index.js; fi\n`,
  )
  const shimLog = path.join(dir, 'shim.log')
  writeFileSync(shimLog, '')
  return {
    env: { PATH: `${shim}:${process.env.PATH ?? ''}`, SHIM_LOG: shimLog },
    log: () =>
      readFileSync(shimLog, 'utf8')
        .split('\n')
        .filter((l) => l !== ''),
  }
}

/**
 * Run the real `10-anthropic-api-key` secret hook — the worked example the hook
 * documentation points at — with the upload boundary replaced by a recorder.
 *
 * `npx` (wrangler) is the external boundary and the only thing stubbed: it is
 * what makes the composed command line, the value's arrival on standard input,
 * and the absence of an upload on a rehearsal observable at all. Nothing
 * internal is replaced — the bytes that ship are the bytes that run.
 */
function runSecretHook(opts: { label: string; env?: NodeJS.ProcessEnv }): {
  run: Run
  log: () => string[]
  stdin: () => string
} {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), `d5167ced-${opts.label}-`)))
  roots.push(dir)
  const shim = path.join(dir, 'shim')
  mkdirSync(shim, { recursive: true })
  const shimLog = path.join(dir, 'shim.log')
  const stdinFile = path.join(dir, 'stdin.bin')
  writeFileSync(shimLog, '')
  writeScript(
    path.join(shim, 'npx'),
    `printf 'npx|%s\\n' "$*" >> "$SHIM_LOG"\n` +
      // Captured RAW — a trailing newline is exactly what must not be there, so
      // it cannot be read back through a shell substitution that strips it.
      `if [[ "$*" == *"secret put"* ]]; then cat > "$STDIN_CAPTURE"; fi\n` +
      `if [[ "$*" == *"secret list"* ]]; then printf '%s\\n' "\${SECRET_LIST:-[]}"; fi\n`,
  )
  const appDir = path.join(dir, 'apps', 'control-app')
  mkdirSync(appDir, { recursive: true })

  const run = sh(path.join(REPO, 'bin', 'deploy.d', 'secrets', '10-anthropic-api-key'), [], {
    cwd: REPO,
    env: {
      PATH: `${shim}:${process.env.PATH ?? ''}`,
      SHIM_LOG: shimLog,
      STDIN_CAPTURE: stdinFile,
      // The deploy context `bin/deploy` hands every hook. The deployed Worker's
      // name deliberately differs from the directory, so an echo naming the
      // destination cannot pass by naming the app.
      DEPLOY_APP: 'control-app',
      DEPLOY_APP_DIR: appDir,
      DEPLOY_ENV: 'production',
      DEPLOY_WORKER_NAME: 'prod-control-app',
      DEPLOY_DRY_RUN: '0',
      DEPLOY_REPO_ROOT: dir,
      ...opts.env,
    },
  })
  return {
    run,
    log: () =>
      readFileSync(shimLog, 'utf8')
        .split('\n')
        .filter((l) => l !== ''),
    stdin: () => (existsSync(stdinFile) ? readFileSync(stdinFile, 'utf8') : ''),
  }
}

/**
 * A `--import` hook that makes named packages genuinely unresolvable, exactly as
 * a machine that never ran the out-of-band install sees them. `require.resolve`
 * is the path `webuiPackageDir` takes, so hiding it there is what makes the
 * preflight fire. Nothing on disk changes.
 */
const HIDE_HOOK = `
import Module from 'node:module'
const HIDDEN = JSON.parse(process.env.UAT_HIDDEN_SPECS)
const hidden = (s) => HIDDEN.some((p) => s === p || String(s).startsWith(p + '/'))
const real = Module._resolveFilename
Module._resolveFilename = function (request, ...rest) {
  if (hidden(request)) {
    const err = new Error("Cannot find module '" + request + "'")
    err.code = 'MODULE_NOT_FOUND'
    throw err
  }
  return real.call(this, request, ...rest)
}
`

function hideHookFile(label: string): string {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), `d5167ced-${label}-`)))
  roots.push(dir)
  const hook = path.join(dir, 'hide.mjs')
  writeFileSync(hook, HIDE_HOOK)
  return hook
}

// ── a live origin that behaves as a correct `public-site` deploy does ────────

const SLUG = 'acme'
const DRAFT = 'abc123def456'

interface Reply {
  status: number
  headers: Record<string, string>
  body: string
}

function correctOrigin(): Map<string, Reply> {
  const root = `/site/${SLUG}/draft/${DRAFT}`
  const asset = (body: string, type: string): Reply => ({
    status: 200,
    headers: {
      'content-type': type,
      'cache-control': 'public, max-age=31536000, immutable',
      'x-robots-tag': 'noindex',
    },
    body,
  })
  const html =
    '<!doctype html><html><head>' +
    '<link rel="stylesheet" href="./theme.css">' +
    '<script type="module" src="./app.js"></script>' +
    '</head><body><img src="./assets/logo.svg" alt=""></body></html>'

  return new Map<string, Reply>([
    ['/', { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'Hello' }],
    [
      `/site/${SLUG}`,
      { status: 301, headers: { location: `/site/${SLUG}/` }, body: '' },
    ],
    [
      `/site/${SLUG}/`,
      { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'Not Found' },
    ],
    [root, { status: 301, headers: { location: `${root}/` }, body: '' }],
    [`${root}/`, asset(html, 'text/html; charset=utf-8')],
    [
      `${root}/theme.css`,
      asset('@font-face{font-family:X;src:url("./fonts/x.woff2") format("woff2")}', 'text/css; charset=utf-8'),
    ],
    [`${root}/app.js`, asset('export {}', 'text/javascript; charset=utf-8')],
    [`${root}/assets/logo.svg`, asset('<svg/>', 'image/svg+xml')],
    [`${root}/fonts/x.woff2`, asset('font-bytes', 'font/woff2')],
  ])
}

/**
 * A `--import` preload that answers `table` and 404s everything else, with the
 * preview channel's noindex on a miss.
 *
 * The origin is supplied to the real `smoke.mjs` PROCESS on its own command line
 * and its transport is replaced beneath it, so the exit status, the report
 * rendering and the summary counts are the ones an operator sees — without this
 * suite needing to bind a socket, and without a real deploy being broken to
 * exercise the failure path.
 */
const FETCH_HOOK = `
const TABLE = JSON.parse(process.env.UAT_ORIGIN_TABLE)
globalThis.fetch = async (input) => {
  const url = new URL(String(input))
  const hit = TABLE[url.pathname]
  if (hit) {
    return new Response(hit.body === '' ? null : hit.body, { status: hit.status, headers: hit.headers })
  }
  const headers = { 'content-type': 'text/plain; charset=utf-8' }
  if (url.pathname.includes('/draft/')) headers['x-robots-tag'] = 'noindex'
  return new Response('Not Found', { status: 404, headers })
}
`

/** Drive the real `smoke.mjs` process — the exit status is the thing under test. */
function runSmokeCli(args: string[], table: Map<string, Reply>): Run {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'd5167ced-smoke-')))
  roots.push(dir)
  const hook = path.join(dir, 'origin.mjs')
  writeFileSync(hook, FETCH_HOOK)
  return sh(
    'node',
    ['--import', hook, path.join(REPO, 'tools', 'generate', 'bin', 'smoke.mjs'), ...args],
    { cwd: REPO, env: { UAT_ORIGIN_TABLE: JSON.stringify(Object.fromEntries(table)) } },
  )
}

/** The in-process engine, against a table-driven fake origin. */
function fakeFetch(table: Map<string, Reply>, origin = 'https://example.test') {
  return async (input: string | URL): Promise<Response> => {
    const url = new URL(String(input))
    const hit = table.get(url.pathname)
    if (hit) return new Response(hit.body === '' ? null : hit.body, { status: hit.status, headers: hit.headers })
    const headers: Record<string, string> = { 'content-type': 'text/plain; charset=utf-8' }
    if (url.pathname.includes('/draft/')) headers['x-robots-tag'] = 'noindex'
    return new Response('Not Found', { status: 404, headers })
  }
}

interface Check {
  name: string
  status: 'pass' | 'fail' | 'skip'
  detail: string
}
interface Report {
  ok: boolean
  origin: string
  checks: Check[]
  failed: Check[]
}

const FAKE_ORIGIN = 'https://example.test'

async function smoke(
  table: Map<string, Reply>,
  opts: { slug?: string; draft?: string; maxAssets?: number } = {},
): Promise<Report> {
  return (await runSmoke({
    origin: FAKE_ORIGIN,
    slug: 'slug' in opts ? opts.slug : SLUG,
    draft: 'draft' in opts ? opts.draft : DRAFT,
    maxAssets: opts.maxAssets,
    fetch: fakeFetch(table),
  })) as Report
}

/**
 * The nine checks that answer "does this public origin serve?", in the order the
 * report lists them. Selected by `--origin` plus `--slug` / `--draft`.
 */
const PUBLIC_CHECKS = [
  'apex_resolves',
  'unknown_slug_not_found',
  'unpublished_slug_indistinguishable',
  'published_root_redirects',
  'draft_root_redirects',
  'draft_index_serves_html',
  'draft_cache_and_robots_policy',
  'draft_miss_is_noindex_404',
  'draft_assets_resolve',
]

/**
 * The two checks on the INDEPENDENT axis — "is the operator surface private?"
 * (AC-1425). They are selected by their own options, so a run pointed at a
 * public-serving origin has nothing to point them at and they skip. Held apart
 * from `PUBLIC_CHECKS` rather than appended to it because the distinction is the
 * subject of AC-1336: a passing run is not required to have skipped nothing, it
 * is required to NAME what it skipped.
 */
const CONTROL_CHECKS = ['control_app_challenges_unauthenticated', 'control_app_workers_dev_closed']

/** Every check the report lists, in order. */
const ALL_CHECKS = [...PUBLIC_CHECKS, ...CONTROL_CHECKS]

// ═════════════════════════════════════════════════════════════════════════════
// AC-1330 — the environment preflight
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — the environment preflight', () => {
  it(
    'test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one',
    () => {
      const components = sharedComponents() as ReadonlyArray<{ component: string; surface: string }>
      const declared = [...new Set(Object.values(COMMAND_DEPS).flat())].sort()
      expect(components.length).toBeGreaterThan(0)
      expect(components.some((c) => c.surface === 'browser')).toBe(true)
      expect(components.some((c) => c.surface === 'server')).toBe(true)

      const bin = path.join(REPO, 'tools', 'generate', 'bin', '1c.mjs')
      const hook = hideHookFile('preflight')
      const preflight = (hidden: string[]): Run =>
        sh('node', ['--import', hook, bin, 'preflight'], {
          cwd: REPO,
          env: { UAT_HIDDEN_SPECS: JSON.stringify(hidden) },
        })

      // ── a complete tree: every component and every package, marked present ──
      const complete = preflight([])
      expect(complete.code, complete.all).toBe(0)
      for (const { component, surface } of components) {
        // The report distinguishes the surface, because the two break differently.
        expect(complete.out, `${component} is not reported as present`).toContain(
          `ok    shared/${surface}  ${component}`,
        )
      }
      for (const pkg of declared) {
        expect(complete.out).toContain(`ok    npm            ${pkg}`)
      }
      // …and it states the counts it checked.
      expect(complete.out).toContain(
        `Preflight passed: ${components.length} shared components, ${declared.length} declared packages.`,
      )

      // ── one BROWSER component made unresolvable ─────────────────────────────
      const browser = components.find((c) => c.surface === 'browser')!.component
      const brokenBrowser = preflight([`${WEBUI_SCOPE}/${browser}`])

      // Both halves are reported before either refuses, so an operator missing
      // one of each learns both in a single run.
      expect(brokenBrowser.out).toContain(`MISS  shared/browser  ${browser}`)
      for (const pkg of declared) expect(brokenBrowser.out).toContain(`npm            ${pkg}`)

      // The refusal names the component, the surface it serves, and why a browser
      // component's absence is not merely a missing file.
      expect(brokenBrowser.all).toContain(`${WEBUI_SCOPE}/${browser} (browser) does not resolve`)
      expect(brokenBrowser.all).toContain('the browser import map would name a module nothing serves')

      // ── one SERVER component made unresolvable ──────────────────────────────
      const server = components.find((c) => c.surface === 'server')!.component
      const brokenServer = preflight([`${WEBUI_SCOPE}/${server}`])
      expect(brokenServer.out).toContain(`MISS  shared/server  ${server}`)
      expect(brokenServer.all).toContain(`${WEBUI_SCOPE}/${server} (server) does not resolve`)
      // A server component dies on its dynamic import, not in an import map, so
      // the browser sentence is not attached to it.
      expect(brokenServer.all).not.toContain(
        `${WEBUI_SCOPE}/${server} (server) does not resolve — the browser import map`,
      )

      // The refusal is a refusal, not advice: an environment-specific exit code
      // distinct from a general failure, and a remedy naming the literal command
      // that installs the components.
      expect(EXIT_CODES.ENVIRONMENT).toBe(6)
      expect(EXIT_CODES.ENVIRONMENT).not.toBe(EXIT_CODES.INTERNAL)
      expect(brokenBrowser.all).toContain(SHARED_STORE_INSTALL_COMMAND)
      expect(brokenBrowser.code, brokenBrowser.all).toBe(EXIT_CODES.ENVIRONMENT)
      expect(brokenServer.code, brokenServer.all).toBe(EXIT_CODES.ENVIRONMENT)
    },
    240_000,
  )
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1331 — bin/build
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — the build discovers every Worker and bundles it for production', () => {
  it(
    'test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight',
    () => {
      // ── the real tree: discovery, and the environment each bundle is built for ──
      const before = new Set(APPS.filter((app) => existsSync(path.join(REPO, 'apps', app, 'dist'))))
      const shims = realRepoShims('build-real')
      let real: Run
      try {
        real = sh(path.join(REPO, 'bin', 'build'), [], { cwd: REPO, env: shims.env })

        expect(real.code, real.all).toBe(0)
        // Ordering is load-bearing: preflight, then the package builds, then bundles.
        const at = (needle: string): number => real.out.indexOf(needle)
        expect(at('==> Preflight')).toBeGreaterThanOrEqual(0)
        expect(at('==> Preflight')).toBeLessThan(at('==> Typecheck and package builds'))
        expect(at('==> Typecheck and package builds')).toBeLessThan(at('==> Bundle '))

        // Every Worker DISCOVERED in the tree is bundled — not a hand-kept list.
        const bundled = shims
          .log()
          .filter((l) => l.startsWith('npx|'))
          .map((l) => l.split('|'))
        expect(bundled.map((b) => path.basename(b[2])).sort()).toEqual(APPS)
        for (const [, args] of bundled) {
          // Against the PRODUCTION environment, deliberately: a config error that
          // only exists under [env.production] is the whole subject of this story.
          expect(args).toBe('wrangler deploy --env production --dry-run --outdir dist')
        }
        expect(shims.log().filter((l) => l.startsWith('pnpm|'))).toHaveLength(1)

        // The artifact produced for each app is reported.
        expect(real.out).toContain('==> Artifacts')
        for (const app of APPS) expect(real.out).toContain(`apps/${app}/dist`)
        expect(real.out).toContain(`Build complete.`)
        expect(real.out).toContain(`${APPS.length} app(s).`)
      } finally {
        for (const app of APPS) {
          if (!before.has(app)) rmSync(path.join(REPO, 'apps', app, 'dist'), { recursive: true, force: true })
        }
      }

      // ── a deliberately incomplete environment stops the run at the preflight ──
      const hook = hideHookFile('build-incomplete')
      const broken = realRepoShims('build-broken')
      const hidden = {
        ...broken.env,
        UAT_HIDDEN_SPECS: JSON.stringify([`${WEBUI_SCOPE}/webui-shell`]),
        NODE_OPTIONS: `--import ${hook}`,
      }
      const stopped = sh(path.join(REPO, 'bin', 'build'), [], { cwd: REPO, env: hidden })
      // No artifact appears: neither the package builds nor a single bundle ran.
      expect(stopped.code, stopped.all).not.toBe(0)
      expect(stopped.out).not.toContain('==> Typecheck and package builds')
      expect(stopped.out).not.toContain('==> Bundle ')
      expect(broken.log()).toEqual([])

      // ── the check can be skipped for an environment that cannot satisfy it ──
      const skipped = realRepoShims('build-skip')
      const proceeded = sh(path.join(REPO, 'bin', 'build'), ['--skip-preflight'], {
        cwd: REPO,
        env: {
          ...skipped.env,
          UAT_HIDDEN_SPECS: JSON.stringify([`${WEBUI_SCOPE}/webui-shell`]),
          NODE_OPTIONS: `--import ${hook}`,
        },
      })
      try {
        expect(proceeded.out).not.toContain('==> Preflight')
        expect(proceeded.code, proceeded.all).toBe(0)
        expect(skipped.log().filter((l) => l.startsWith('pnpm|'))).toHaveLength(1)
        expect(skipped.log().filter((l) => l.startsWith('npx|'))).toHaveLength(APPS.length)
      } finally {
        for (const app of APPS) {
          if (!before.has(app)) rmSync(path.join(REPO, 'apps', app, 'dist'), { recursive: true, force: true })
        }
      }

      // ── a tree with no deployment configuration is refused, not reported green ──
      const empty = makeTree({ label: 'build-empty', apps: [] })
      const nothing = sh(path.join(empty.root, 'bin', 'build'), [], { cwd: empty.root, env: empty.env })
      expect(nothing.code).not.toBe(0)
      expect(nothing.all).toContain('no apps/*/wrangler.toml found — nothing to build')
      expect(nothing.out).not.toContain('Build complete.')

      // Last, because it is the one claim the rest of this run does not depend
      // on: the preflight's ENVIRONMENT code is propagated, not flattened into a
      // general failure. `bin/build`'s own contract states 0/6/1.
      expect(readFileSync(path.join(REPO, 'bin', 'build'), 'utf8')).toContain('6 environment (preflight)')
      expect(stopped.code, stopped.all).toBe(EXIT_CODES.ENVIRONMENT)
    },
    600_000,
  )
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1332 — a rehearsal is a target, not a second script
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — a rehearsal is the same path as a real deploy', () => {
  it('test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation', () => {
    const hooks: HookSpec[] = [
      { kind: 'migrate', name: '10-migrate' },
      { kind: 'secrets', name: '10-secret' },
    ]

    const rehearsal = makeTree({ label: 'rehearse', apps: ['alpha'], hooks })
    const dry = sh(path.join(rehearsal.root, 'bin', 'deploy'), ['--dry-run', 'alpha'], {
      cwd: rehearsal.root,
      env: rehearsal.env,
    })
    expect(dry.code, dry.all).toBe(0)

    const genuine = makeTree({ label: 'deploy', apps: ['alpha'], hooks })
    const wet = sh(path.join(genuine.root, 'bin', 'deploy'), ['alpha'], {
      cwd: genuine.root,
      env: genuine.env,
    })
    expect(wet.code, wet.all).toBe(0)

    // It announces up front that it is rehearsing, and that hooks must not change
    // anything — a real deploy says neither.
    expect(dry.out).toContain('DRY RUN — hooks are told not to change anything, and nothing is uploaded.')
    expect(wet.out).not.toContain('DRY RUN')

    // The SAME hooks in the SAME order, with the same context but for the flag
    // that tells them it is a rehearsal.
    const hookLines = (tree: Tree): string[] =>
      tree
        .log()
        .filter((l) => l.startsWith('hook|'))
        // The two runs live in two fixture trees; the tree's own path is not part
        // of what "the same context" means.
        .map((l) => l.split(tree.root).join('<root>'))
    expect(hookLines(rehearsal).map((l) => l.replace('|dry=1|', '|dry=0|'))).toEqual(hookLines(genuine))
    expect(hookLines(rehearsal).every((l) => l.includes('|dry=1|'))).toBe(true)
    expect(hookLines(genuine).every((l) => l.includes('|dry=0|'))).toBe(true)

    // The SAME deployment invocation, differing by a single appended flag.
    const invocation = (tree: Tree): string => {
      const line = tree.log().find((l) => l.startsWith('npx|'))
      expect(line, 'no deployment invocation was composed').toBeDefined()
      return line!.split('|')[1]
    }
    expect(invocation(genuine)).toBe('wrangler deploy --env production')
    expect(invocation(rehearsal)).toBe(`${invocation(genuine)} --dry-run`)

    // The closing report distinguishes a rehearsal from a deploy, and a real
    // deploy points at the command that proves it serves.
    expect(dry.out).toContain('prod-alpha')
    expect(dry.out).toContain('(rehearsed, not uploaded)')
    expect(dry.out).not.toContain('bin/smoke')
    expect(wet.out).toMatch(/prod-alpha\s+production/)
    expect(wet.out).not.toContain('rehearsed')
    expect(wet.out).toContain('Now prove it serves:  bin/smoke')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1333 — the hook contract
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — hooks are discovered by executability and run before the upload', () => {
  it('test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context', () => {
    const tree = makeTree({
      label: 'hooks',
      apps: ['alpha'],
      hooks: [
        // Written out of order on purpose: discovery sorts them.
        { kind: 'migrate', name: '20-second' },
        { kind: 'migrate', name: '10-first' },
        { kind: 'secrets', name: '10-secret' },
        // A non-executable file in a hook directory is documentation, not a hook.
        {
          kind: 'migrate',
          name: 'NOTES.md',
          body: `printf 'hook|NOTES-RAN\\n' >> "$SHIM_LOG"\n`,
          executable: false,
        },
      ],
    })

    const run = sh(path.join(tree.root, 'bin', 'deploy'), ['--dry-run', 'alpha'], {
      cwd: tree.root,
      env: tree.env,
    })
    expect(run.code, run.all).toBe(0)

    // Sorted, migrate before secrets, and every one of them strictly before the
    // upload the deploy would have performed.
    const kinds = tree.log().map((l) => l.split('|')[0])
    const labels = tree.log().filter((l) => l.startsWith('hook|')).map((l) => l.split('|')[1])
    expect(labels).toEqual(['migrate/10-first', 'migrate/20-second', 'secrets/10-secret'])
    expect(kinds.indexOf('npx')).toBe(kinds.length - 1)
    expect(tree.log().some((l) => l.includes('NOTES-RAN'))).toBe(false)

    // Each is named as it runs.
    expect(run.out).toContain('hook migrate/10-first')
    expect(run.out).toContain('hook migrate/20-second')
    expect(run.out).toContain('hook secrets/10-secret')
    expect(run.out).not.toContain('NOTES.md')

    // The context each hook receives — including the deployed Worker's name,
    // which is NOT the app's directory name.
    const fields = Object.fromEntries(
      tree
        .log()[0]
        .split('|')
        .slice(2)
        .map((kv) => kv.split(/=(.*)/s).slice(0, 2) as [string, string]),
    )
    expect(fields).toEqual({
      app: 'alpha',
      dir: path.join(tree.root, 'apps', 'alpha'),
      env: 'production',
      name: 'prod-alpha',
      dry: '1',
      root: tree.root,
    })

    // A hook directory holding only documentation reports that it has none,
    // rather than passing silently.
    const bare = makeTree({ label: 'hooks-bare', apps: ['alpha'] })
    const none = sh(path.join(bare.root, 'bin', 'deploy'), ['--dry-run', 'alpha'], {
      cwd: bare.root,
      env: bare.env,
    })
    expect(none.code, none.all).toBe(0)
    expect(none.out).toContain('(no migrate hooks)')
    expect(none.out).toContain('(no secrets hooks)')
    expect(bare.log().filter((l) => l.startsWith('hook|'))).toEqual([])

    // The documentation already sitting in each real hook directory is
    // non-executable, so it can live beside the hooks and never be run.
    for (const kind of ['migrate', 'secrets']) {
      const readme = path.join(REPO, 'bin', 'deploy.d', kind, 'README.md')
      expect(existsSync(readme), `bin/deploy.d/${kind}/README.md is missing`).toBe(true)
      // eslint-disable-next-line no-bitwise
      expect(statSync(readme).mode & 0o111, `bin/deploy.d/${kind}/README.md is executable`).toBe(0)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1334 — a failing hook aborts before the upload
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — a hook that fails stops the code that assumes it ran', () => {
  it('test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded', () => {
    const failing: HookSpec = {
      kind: 'migrate',
      name: '50-boom',
      body: `printf 'hook|50-boom\\n' >> "$SHIM_LOG"\necho "migration refused: schema is not ready"\nexit 17\n`,
    }

    // A rehearsal and a real deploy are one path, so the abort holds in both.
    for (const args of [['--dry-run', 'alpha'], ['alpha']]) {
      const tree = makeTree({ label: `abort-${args.length}`, apps: ['alpha'], hooks: [failing] })
      const run = sh(path.join(tree.root, 'bin', 'deploy'), args, { cwd: tree.root, env: tree.env })

      expect(run.code, `a hook exiting non-zero did not fail the deploy (${args.join(' ')})`).not.toBe(0)
      // The failing hook's own output reaches the operator …
      expect(run.all).toContain('migration refused: schema is not ready')
      // … and nothing the upload stage would have produced exists: the abort is
      // observably ordered BEFORE the upload, not merely reported after it.
      expect(tree.log().filter((l) => l.startsWith('npx|'))).toEqual([])
      expect(run.out).not.toContain('==> Deployed')
    }

    // Remove the hook and the same deploy proceeds past that point.
    const clean = makeTree({ label: 'abort-clean', apps: ['alpha'] })
    const ok = sh(path.join(clean.root, 'bin', 'deploy'), ['--dry-run', 'alpha'], {
      cwd: clean.root,
      env: clean.env,
    })
    expect(ok.code, ok.all).toBe(0)
    expect(clean.log().filter((l) => l.startsWith('npx|'))).toHaveLength(1)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1335 — target selection
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — deploy targets come from what is discovered', () => {
  it('test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused', () => {
    const apps = ['alpha', 'beta', 'gamma']
    const hooks: HookSpec[] = [{ kind: 'migrate', name: '10-migrate' }]

    // With no app named, every discovered app is deployed …
    const all = makeTree({ label: 'targets-all', apps, hooks })
    const everything = sh(path.join(all.root, 'bin', 'deploy'), ['--dry-run'], {
      cwd: all.root,
      env: all.env,
    })
    expect(everything.code, everything.all).toBe(0)
    for (const app of apps) expect(everything.out).toContain(`prod-${app}`)
    // … at the default target environment.
    expect(everything.out).toContain('(--env production)')

    // … and with one named, only that one; the others are untouched.
    const one = makeTree({ label: 'targets-one', apps, hooks })
    const single = sh(path.join(one.root, 'bin', 'deploy'), ['--dry-run', 'beta'], {
      cwd: one.root,
      env: one.env,
    })
    expect(single.code, single.all).toBe(0)
    expect(single.out).toContain('prod-beta')
    expect(single.out).not.toContain('prod-alpha')
    expect(single.out).not.toContain('prod-gamma')
    expect(one.log().filter((l) => l.startsWith('npx|'))).toHaveLength(1)

    // The environment can be named explicitly.
    const staging = makeTree({ label: 'targets-env', apps, hooks })
    const named = sh(path.join(staging.root, 'bin', 'deploy'), ['--dry-run', '--env', 'staging', 'beta'], {
      cwd: staging.root,
      env: staging.env,
    })
    expect(named.code, named.all).toBe(0)
    expect(named.out).toContain('stage-beta')
    expect(named.out).toContain('(--env staging)')

    // An app that matches nothing discovered is refused BEFORE any hook runs and
    // before anything is uploaded, naming it and listing the apps that do exist.
    const unknown = makeTree({ label: 'targets-unknown', apps, hooks })
    const refused = sh(path.join(unknown.root, 'bin', 'deploy'), ['--dry-run', 'delta'], {
      cwd: unknown.root,
      env: unknown.env,
    })
    expect(refused.code).not.toBe(0)
    expect(refused.all).toContain("unknown app 'delta'")
    for (const app of apps) expect(refused.all).toContain(app)
    expect(unknown.log()).toEqual([])
    expect(refused.out).not.toContain('hook ')

    // Naming the environment option with no value is refused.
    const dangling = makeTree({ label: 'targets-dangling', apps, hooks })
    const noValue = sh(path.join(dangling.root, 'bin', 'deploy'), ['--dry-run', '--env'], {
      cwd: dangling.root,
      env: dangling.env,
    })
    expect(noValue.code).not.toBe(0)
    expect(noValue.all).toContain('--env needs a value')
    expect(dangling.log()).toEqual([])
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1336 — the nine checks against a correctly serving origin
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — the smoke check against an origin that serves correctly', () => {
  it('test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_with_a_zero_exit', () => {
    // The origin under test is a parameter of the run, so the same checks are
    // used against production and against any other serving origin.
    const run = runSmokeCli(['--origin', FAKE_ORIGIN, '--slug', SLUG, '--draft', DRAFT], correctOrigin())

    expect(run.code, run.all).toBe(0)
    for (const name of PUBLIC_CHECKS) {
      expect(run.out, `${name} did not pass`).toContain(`PASS  ${name}`)
    }
    expect(run.out).not.toContain('FAIL  ')

    // A passing run is NOT required to have skipped nothing. The two
    // control-surface checks sit on an independent axis, selected by their own
    // options, and this run — pointed at a public-serving origin — has nothing
    // to point them at. What the run must do is NAME each one it skipped, so
    // "everything applicable passed" and "nothing was left untested" stay
    // distinguishable rather than being conflated into one green result.
    for (const name of CONTROL_CHECKS) {
      expect(run.out, `${name} was not named as skipped`).toContain(`skip  ${name}`)
      expect(run.out, `${name} was reported as a pass`).not.toContain(`PASS  ${name}`)
    }
    // Exactly those two, and no more: a skip that crept into the applicable set
    // would otherwise pass this test by being counted rather than named.
    expect(run.out.match(/^\s*skip {2}/gm)?.length ?? 0).toBe(CONTROL_CHECKS.length)

    // The summary states how many passed and how many were skipped, counting
    // them separately.
    expect(run.out).toContain(
      `Smoke passed against ${FAKE_ORIGIN}: ${PUBLIC_CHECKS.length} passed, ${CONTROL_CHECKS.length} skipped.`,
    )

    // The asset check reports the number it verified, rather than reporting a
    // pass having verified none.
    const assets = /(\d+) assets, all 200 with the expected type/.exec(run.out)
    expect(assets, 'the asset check did not report how many assets it verified').not.toBeNull()
    expect(Number(assets![1])).toBeGreaterThan(0)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1337 — each silent breakage fails, naming the check that owns it
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — each way a deploy is silently broken fails the smoke check', () => {
  it('test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected', async () => {
    const root = `/site/${SLUG}/draft/${DRAFT}`
    const breakages: Array<{ what: string; at: string; reply: Reply; check: string }> = [
      {
        what: 'a referenced asset that is not found',
        at: `${root}/theme.css`,
        reply: { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'Not Found' },
        check: 'draft_assets_resolve',
      },
      {
        what: 'a font served as generic bytes',
        at: `${root}/fonts/x.woff2`,
        reply: { status: 200, headers: { 'content-type': 'application/octet-stream' }, body: 'font' },
        check: 'draft_assets_resolve',
      },
      {
        what: 'a preview page that lost its non-indexable marking',
        at: `${root}/`,
        reply: {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=31536000, immutable',
          },
          body: '<html><img src="./assets/logo.svg"></html>',
        },
        check: 'draft_cache_and_robots_policy',
      },
      {
        what: 'a lost trailing-slash redirect',
        at: root,
        reply: { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'Not Found' },
        check: 'draft_root_redirects',
      },
      {
        what: 'a not-found response that reveals a site exists',
        at: `/site/${SLUG}/`,
        reply: {
          status: 404,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
          body: `No published revision for ${SLUG}`,
        },
        check: 'unpublished_slug_indistinguishable',
      },
      {
        what: 'an apex that stopped responding successfully',
        at: '/',
        reply: { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'boom' },
        check: 'apex_resolves',
      },
    ]

    for (const { what, at, reply, check } of breakages) {
      const table = correctOrigin()
      table.set(at, reply)
      const report = await smoke(table)

      expect(report.ok, `${what}: the run did not fail`).toBe(false)
      // Exactly the check that owns the breakage, and no other.
      expect(report.failed.map((c) => c.name), what).toEqual([check])
      const failure = report.failed[0]
      expect(failure.detail.length, `${what}: the failure says nothing about what it expected`).toBeGreaterThan(0)
      // The remaining checks still report their own outcome — the run does not
      // stop at the first failure. Every check the report can list is listed,
      // the two control-surface ones included: this run supplies neither of
      // their options, so they report a skip rather than going unreported.
      expect(report.checks.map((c) => c.name)).toEqual(ALL_CHECKS)
      for (const other of report.checks.filter((c) => c.name !== check)) {
        expect(['pass', 'skip'], `${what}: ${other.name} did not report an outcome`).toContain(other.status)
      }
    }

    // The exit status is the operator-visible half of the same property.
    const table = correctOrigin()
    table.set('/', { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'boom' })
    const run = runSmokeCli(['--origin', FAKE_ORIGIN, '--slug', SLUG, '--draft', DRAFT], table)
    expect(run.code, run.all).toBe(1)
    expect(run.out).toContain('FAIL  apex_resolves')
    expect(run.out).toContain('Failed: apex_resolves')
    expect(run.out).toContain('Smoke FAILED against')
    // The other checks still report their own outcome in the same run.
    expect(run.out).toContain('PASS  draft_assets_resolve')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1338 — nothing to test against is a skip, never a pass
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — a check with nothing to test against is skipped', () => {
  it('test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted', async () => {
    const table = correctOrigin()

    // ── no slug: the site and preview checks skip, the origin-level ones run ──
    const noSlug = await smoke(table, { slug: undefined, draft: undefined })
    expect(noSlug.ok).toBe(true)
    const bySlugRun = Object.fromEntries(noSlug.checks.map((c) => [c.name, c]))
    for (const name of ['apex_resolves', 'unknown_slug_not_found']) {
      expect(bySlugRun[name].status, `${name} should still run`).toBe('pass')
    }
    for (const name of PUBLIC_CHECKS.slice(2)) {
      expect(bySlugRun[name].status, `${name} should be skipped`).toBe('skip')
      // The reason names the input that was missing.
      expect(bySlugRun[name].detail).toContain('--slug')
    }
    // The control-surface checks skip for a reason of their own — their own
    // option, not the site slug — and each names it, so a reader can tell which
    // input to supply to make that check run.
    for (const name of CONTROL_CHECKS) {
      expect(bySlugRun[name].status, `${name} should be skipped`).toBe('skip')
      expect(bySlugRun[name].detail).not.toContain('--slug')
      expect(bySlugRun[name].detail).toMatch(/--(control|workers-dev)-origin/)
    }
    // Skips are counted SEPARATELY from passes, so a run that proved nothing is
    // visibly a run that proved nothing rather than a green result.
    expect(formatReport(noSlug)).toContain(`2 passed, ${ALL_CHECKS.length - 2} skipped.`)

    // ── a slug but no preview identifier: the preview checks alone skip ──
    const noDraft = await smoke(table, { draft: undefined })
    expect(noDraft.ok).toBe(true)
    const byDraftRun = Object.fromEntries(noDraft.checks.map((c) => [c.name, c]))
    for (const name of PUBLIC_CHECKS.slice(0, 4)) {
      expect(byDraftRun[name].status, `${name} should still run`).toBe('pass')
    }
    for (const name of PUBLIC_CHECKS.slice(4)) {
      expect(byDraftRun[name].status, `${name} should be skipped`).toBe('skip')
      expect(byDraftRun[name].detail).toContain('--draft')
    }
    // Supplying a slug says nothing about the control surface: those two skip
    // for their own missing option either way.
    for (const name of CONTROL_CHECKS) {
      expect(byDraftRun[name].status, `${name} should be skipped`).toBe('skip')
    }
    expect(formatReport(noDraft)).toContain(
      `4 passed, ${PUBLIC_CHECKS.length - 4 + CONTROL_CHECKS.length} skipped.`,
    )

    // A skipped check never fails the run: the exit status stays zero.
    const run = runSmokeCli(['--origin', FAKE_ORIGIN], table)
    expect(run.code, run.all).toBe(0)
    expect(run.out).toContain('skip  unpublished_slug_indistinguishable')
    expect(run.out).toContain(`2 passed, ${ALL_CHECKS.length - 2} skipped.`)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1339 — the asset check
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — every same-origin asset a preview references resolves', () => {
  it('test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets', async () => {
    const base = `${FAKE_ORIGIN}/site/${SLUG}/draft/${DRAFT}/`

    // References that are not the deploy's business are EXCLUDED rather than
    // failed: bare fragments, inline data, and anything on another origin.
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

    // Coverage extends ONE LEVEL into stylesheets, where web fonts live.
    expect(
      referencedFromCss('@font-face{src:url("./fonts/x.woff2") format("woff2")}', `${base}theme.css`) as string[],
    ).toEqual([`${base}fonts/x.woff2`])

    // The font reached from inside the stylesheet is genuinely fetched: breaking
    // only it fails the check, which it could not do if nesting were not followed.
    const root = `/site/${SLUG}/draft/${DRAFT}`
    const wrongType = correctOrigin()
    wrongType.set(`${root}/fonts/x.woff2`, {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
      body: 'font',
    })
    const mistyped = await smoke(wrongType)
    expect(mistyped.failed.map((c) => c.name)).toEqual(['draft_assets_resolve'])
    expect(mistyped.failed[0].detail).toContain('fonts/x.woff2')
    expect(mistyped.failed[0].detail).toContain('font/woff2')

    // A page that references no same-origin asset at all FAILS rather than
    // passes, because that is not a rendered page.
    const barePage = correctOrigin()
    barePage.set(`${root}/`, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=31536000, immutable',
        'x-robots-tag': 'noindex',
      },
      body: '<!doctype html><html><body><a href="#top">x</a><script src="https://cdn.example.com/x.js"></script></body></html>',
    })
    const bare = await smoke(barePage)
    expect(bare.failed.map((c) => c.name)).toEqual(['draft_assets_resolve'])
    expect(bare.failed[0].detail).toContain('references no same-origin assets')

    // The bound is configurable, and stopping at it with references still queued
    // is a FAILURE telling the operator to raise it — never a silent pass.
    const bounded = await smoke(correctOrigin(), { maxAssets: 1 })
    expect(bounded.failed.map((c) => c.name)).toEqual(['draft_assets_resolve'])
    expect(bounded.failed[0].detail).toContain('stopped after 1 assets')
    expect(bounded.failed[0].detail).toContain('--max-assets')

    // The content types expected here and those the serving Worker answers with
    // are the same table — pinned to each other rather than left to drift.
    const table = EXPECTED_CONTENT_TYPES as Record<string, string>
    expect(Object.keys(table).length).toBeGreaterThan(10)
    for (const [ext, expected] of Object.entries(table)) {
      expect(contentTypeFor(`file.${ext}`), `smoke and the Worker disagree about .${ext}`).toBe(expected)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1340 — an unpublished site leaks nothing
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — an unpublished site is indistinguishable from an unknown one', () => {
  it('test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails', async () => {
    const CHECK = 'unpublished_slug_indistinguishable'
    const detailOf = (report: Report): Check => report.checks.find((c) => c.name === CHECK)!

    // ── nothing published: both requests answer not-found with identical bodies ──
    const clean = await smoke(correctOrigin())
    expect(detailOf(clean).status).toBe('pass')
    expect(detailOf(clean).detail).toContain('identical bodies')

    // ── a not-found body that names the site tells a stranger it exists ──
    const leakyBody = correctOrigin()
    leakyBody.set(`/site/${SLUG}/`, {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      body: `No published revision for ${SLUG}`,
    })
    const bodyLeak = await smoke(leakyBody)
    expect(bodyLeak.ok).toBe(false)
    expect(detailOf(bodyLeak).status).toBe('fail')
    expect(detailOf(bodyLeak).detail).toContain(`the 404 body for '${SLUG}' differs`)

    // ── a differing STATUS leaks the same fact, and says so in as many words ──
    const leakyStatus = correctOrigin()
    leakyStatus.set(`/site/${SLUG}/`, {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      body: 'Not Found',
    })
    const statusLeak = await smoke(leakyStatus)
    expect(statusLeak.ok).toBe(false)
    expect(detailOf(statusLeak).detail).toContain('the difference tells a stranger the site exists')

    // ── the site DOES have a live revision: nothing to compare, said as a pass ──
    const published = correctOrigin()
    published.set(`/site/${SLUG}/`, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: '<!doctype html><html></html>',
    })
    const live = await smoke(published)
    expect(detailOf(live).status).toBe('pass')
    expect(detailOf(live).detail).toContain('nothing to compare')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1341 — a named environment inherits nothing
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — every named environment repeats every var and binding', () => {
  it('test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally', () => {
    expect(APPS.length).toBeGreaterThan(0)

    for (const app of APPS) {
      const config = readWranglerConfig(path.join(REPO, 'apps', app, 'wrangler.toml'))
      // Every Worker declares a production environment.
      expect(Object.keys(config.envs), `${app} declares no production environment`).toContain('production')

      for (const envName of Object.keys(config.envs)) {
        const missing = missingFromEnv(config, envName)
        expect(
          missing.vars,
          `apps/${app}/wrangler.toml: [env.${envName}] does not repeat ${missing.vars.join(', ')} — ` +
            'a named environment inherits nothing, so the deployed Worker would see none of them',
        ).toEqual([])
        expect(
          missing.bindings,
          `apps/${app}/wrangler.toml: [env.${envName}] does not repeat the bindings ` +
            `${missing.bindings.join(', ')} — the deployed Worker would see none of them`,
        ).toEqual([])
      }
    }

    // The control application's production environment carries the
    // configuration its deployed form needs. `TENANT_ID` is the one whose
    // omission reproduces the failure this criterion is named for: with it
    // absent the store cannot be opened at all and the Worker answers its own
    // service-unavailable response to every request. The Access identifiers are
    // the same class — a gate with nothing to verify against fails closed.
    const control = readWranglerConfig(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'))
    for (const key of ['TENANT_ID', 'ACCESS_TEAM_DOMAIN', 'ACCESS_AUD']) {
      expect(control.topLevel.vars, `${key} is not declared at the top level`).toContain(key)
      expect(
        control.envs.production.vars,
        `${key} is not repeated under [env.production] — the deployed Worker would not see it`,
      ).toContain(key)
    }

    // The check is only worth having if it CATCHES the configuration that
    // shipped: the builder origin and a storage binding declared only at the top.
    const shipped = `
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
    const broken = missingFromEnv(parseWranglerConfig(shipped), 'production')
    expect(broken.vars).toEqual(['BUILDER_ORIGIN'])
    // The binding is identified by its KIND and its NAME.
    expect(broken.bindings).toEqual(['r2_buckets:SITES'])

    // Bindings are found STRUCTURALLY — any block carrying a binding name — so a
    // kind introduced later is covered without the check being edited.
    const futureKind = `${shipped}
[[a_binding_kind_nobody_has_written_yet]]
binding = "TOMORROW"
id = "x"
`
    expect(missingFromEnv(parseWranglerConfig(futureKind), 'production').bindings).toEqual([
      'r2_buckets:SITES',
      'a_binding_kind_nobody_has_written_yet:TOMORROW',
    ])

    // The corrected form reports nothing missing.
    const fixed = `${shipped}
[env.production.vars]
BUILDER_ORIGIN = "http://localhost:8790"

[[env.production.r2_buckets]]
binding = "SITES"
bucket_name = "1stcontact-sites"
`
    expect(missingFromEnv(parseWranglerConfig(fixed), 'production')).toEqual({ vars: [], bindings: [] })

    // ── the one stated exception, and that it is exactly one variable wide ───
    //
    // A variable whose purpose is to relax a security control for local
    // development is not required to be repeated: its absence from the named
    // environment is what keeps the relaxation out of the deployed Worker, so
    // reporting it missing would invert the rule.
    expect(DEV_ONLY_VAR).toBe('ACCESS_DEV_OPEN')
    // In the real tree: the control app declares it at the top level, does NOT
    // repeat it under production, and the check reports nothing missing — which
    // is only true because the exception is implemented in the check itself.
    expect(control.topLevel.vars).toContain(DEV_ONLY_VAR)
    expect(control.envs.production.vars).not.toContain(DEV_ONLY_VAR)
    expect(missingFromEnv(control, 'production').vars).toEqual([])

    // The exception is a NAME, not a licence. A second top-level variable is
    // still required to be repeated, and the report still names that one — and
    // only that one — when it is not.
    const withRelaxation = `
name = "1stcontact-control-app"

[vars]
${DEV_ONLY_VAR} = "1"
TENANT_ID = "1stcontact"

[env.production]
name = "1stcontact-control-app"

[env.production.vars]
TENANT_ID = "1stcontact"
`
    expect(missingFromEnv(parseWranglerConfig(withRelaxation), 'production').vars).toEqual([])

    const alsoDroppingTheOther = withRelaxation.replace(
      '[env.production.vars]\nTENANT_ID = "1stcontact"\n',
      '[env.production.vars]\n',
    )
    expect(missingFromEnv(parseWranglerConfig(alsoDroppingTheOther), 'production').vars).toEqual(['TENANT_ID'])

    // ── the rule's stated scope: repeats that are neither var nor binding ────
    //
    // The operator surface repeats under [env.production] two declarations the
    // tool WOULD have inherited — the platform-default-hostname control and the
    // invocation-log retention — because the rule must not depend on anyone
    // remembering which keys inherit. Neither may join the sets this check
    // counts: each is pinned by the criterion that owns it, and a retention key
    // arriving among the variables would fail this check for someone else's
    // reason.
    const controlToml = readFileSync(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'), 'utf8')
    expect(controlToml).toContain('[observability]')
    expect(controlToml).toContain('[env.production.observability]')
    expect(controlToml.match(/^workers_dev\s*=/gm)?.length ?? 0).toBeGreaterThanOrEqual(2)
    for (const key of ['workers_dev', 'enabled', 'head_sampling_rate', 'observability']) {
      expect(control.topLevel.vars, `${key} was counted as a variable`).not.toContain(key)
      expect(control.envs.production.vars, `${key} was counted as a variable`).not.toContain(key)
      expect(
        control.topLevel.bindings.some((b) => b.startsWith(`${key}:`) || b.endsWith(`:${key}`)),
        `${key} was counted as a binding`,
      ).toBe(false)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1342 — secrets are a mechanism, never a value
// ═════════════════════════════════════════════════════════════════════════════

describe('story-d5167ced — no secret value is committed, and the push is piped', () => {
  it('test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name', () => {
    const files = [
      path.join(REPO, 'bin', 'build'),
      path.join(REPO, 'bin', 'deploy'),
      path.join(REPO, 'bin', 'smoke'),
      path.join(REPO, 'tools', 'generate', 'bin', 'smoke.mjs'),
      path.join(REPO, 'bin', 'deploy.d', 'migrate', 'README.md'),
      path.join(REPO, 'bin', 'deploy.d', 'secrets', 'README.md'),
      ...APPS.map((app) => path.join(REPO, 'apps', app, 'wrangler.toml')),
    ]

    // The shapes a real credential takes. Assembled rather than written out, so
    // this file cannot be its own counter-example.
    const shapes: Array<[string, RegExp]> = [
      ['a provider-prefixed API key', new RegExp(['sk', 'ant', 'api'].join('-'))],
      ['a private-key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
      [
        'a credential-named assignment carrying a literal value',
        /\b[A-Za-z0-9_-]*(?:SECRET|TOKEN|API_KEY|PASSWORD)[A-Za-z0-9_-]*\s*=\s*["'][^"'$][^"']{7,}/,
      ],
    ]

    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      for (const [what, shape] of shapes) {
        expect(shape.test(text), `${path.relative(REPO, file)} looks like it contains ${what}`).toBe(false)
      }
    }

    // The documented mechanism is verifiable from the documentation itself.
    const doc = readFileSync(path.join(REPO, 'bin', 'deploy.d', 'secrets', 'README.md'), 'utf8')
    expect(doc).toContain('wrangler secret put')
    // PIPED, not passed as an argument …
    expect(doc).toMatch(/printf '%s'[^\n]*\|/)
    expect(doc).toContain('shell history')
    // … in a form that appends no trailing newline …
    expect(doc).toContain('newline becomes part')
    // … and never echoed back: a hook reports the name and the destination.
    expect(doc).toContain('Never echo the value')
    expect(doc).toContain('Report the *name* and the destination')
    // No form that passes the value as an argument appears anywhere.
    expect(doc).not.toMatch(/wrangler secret put \w+ [^-\n]/)
    // The only listing offered is of NAMES.
    expect(doc).toContain('wrangler secret list')
    expect(doc).toContain('**names**')

    // The deploy command documents the same mechanism, so an operator reading
    // either one is told the same thing.
    const deploy = readFileSync(path.join(REPO, 'bin', 'deploy'), 'utf8')
    expect(deploy).toMatch(/printf '%s'[^\n]*\|\s*npx wrangler secret put/)
    expect(deploy).not.toMatch(/wrangler secret put \w+ [^-\n]/)

    // ── the worked example, RUN rather than read ────────────────────────────
    //
    // "Prints only the name and the destination" is a claim about behaviour, and
    // the documentation's own wording is the weakest possible evidence for it —
    // an assertion on prose passes for as long as nobody rewrites the prose, and
    // fails when somebody does without the hook having changed at all. So the
    // real hook the document points at is executed, on both paths the criterion
    // names, with the upload boundary (`npx wrangler`) replaced by a recorder.
    // The value handed to it is one this file can recognise in any output.
    const VALUE = 'uat-1342-value-never-printed'

    // ── the real path: the value is pushed, and only its name is echoed ──────
    const real = runSecretHook({ label: 'push', env: { ANTHROPIC_API_KEY: VALUE } })
    expect(real.run.code, real.run.all).toBe(0)
    expect(real.run.out).toContain('pushed ANTHROPIC_API_KEY to prod-control-app')
    expect(real.run.all, 'the hook echoed the secret value').not.toContain(VALUE)

    // Piped, never an argument: the command line carries the NAME and the
    // environment and nothing that could appear in `ps` or in shell history.
    const put = real.log().find((line) => line.includes('secret put'))
    expect(put, 'the hook did not push the secret').toBeDefined()
    expect(put).toBe('npx|wrangler secret put ANTHROPIC_API_KEY --env production')
    expect(put, 'the value was passed as an argument').not.toContain(VALUE)

    // And it arrived on standard input with NO trailing newline — `printf`
    // rather than `echo`, because a newline would become part of the secret.
    expect(real.stdin()).toBe(VALUE)

    // ── the rehearsal: the same decision, reported, and nothing uploaded ─────
    const rehearsal = runSecretHook({
      label: 'dry',
      env: { ANTHROPIC_API_KEY: VALUE, DEPLOY_DRY_RUN: '1' },
    })
    expect(rehearsal.run.code, rehearsal.run.all).toBe(0)
    expect(rehearsal.run.out).toContain('would push ANTHROPIC_API_KEY to prod-control-app')
    expect(rehearsal.run.all, 'the rehearsal echoed the secret value').not.toContain(VALUE)
    expect(
      rehearsal.log().filter((line) => line.includes('secret put')),
      'a rehearsal uploaded the secret',
    ).toEqual([])
  })
})
