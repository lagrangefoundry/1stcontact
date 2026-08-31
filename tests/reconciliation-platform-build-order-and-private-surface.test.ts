/**
 * Reconciliation UATs for story-d5167ced — "Platform Build, Deploy & Smoke: One
 * Path To Ship A Worker, And Proof It Serves" — the three criteria BUNDLE-20
 * added to it.
 *
 * The story's other thirteen criteria already have their UATs in
 * `reconciliation-platform-build-deploy-smoke.test.ts`, written when BUNDLE-19
 * reconciled the same story. This file carries only what that reconciliation had
 * no criterion for, so the 1:1 test-to-AC mapping holds across the pair:
 *
 *   • AC-1425 — the smoke check asserts the operator surface is private: an
 *     unauthenticated caller is challenged, and the platform-default hostname
 *     does not answer. Each on its own option, each skipped BY NAME when that
 *     option is absent, and neither able to fail against the other axis.
 *   • AC-1426 — the build refuses a Worker whose TYPE program reaches a
 *     filesystem-bound module, naming the import chain that got there.
 *   • AC-1427 — the build generates the uncommitted derived artifacts BEFORE it
 *     typechecks, so a fresh checkout builds.
 *
 * THREE BOUNDARIES, chosen per criterion for what it actually claims — the same
 * three the sibling file uses, and for the same reasons:
 *
 *   - **`runSmoke` and the real `smoke.mjs` process**, against a fake origin.
 *     The story states the check engine is drivable against a supplied origin
 *     precisely so its failure path is exercised without breaking a real deploy.
 *     The engine is driven in-process where the claim is about a check's status
 *     and detail; the real process is driven where the claim is about the exit
 *     status and the report an operator reads.
 *   - **The real `tsc`** — the very binary `bin/build`'s typecheck stage runs
 *     through `pnpm -r build` — for AC-1426 and AC-1427. "The build refuses" and
 *     "the typecheck has nothing to read" are claims about what that compiler
 *     does, so it is the compiler that is asked, not a description of it.
 *   - **The real `bin/build`, against a fixture tree.** It resolves its repo root
 *     from its own location, so the unmodified script runs in a temporary tree
 *     while the test controls the apps and the environment. `pnpm`, `npx` and
 *     `bin/1c` are recording shims on PATH — they are the external boundary (a
 *     package manager, an upload to Cloudflare, a separately criterioned
 *     command), and stubbing them is what makes the stage ORDER observable at
 *     all. Nothing internal is mocked.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatReport,
  runSmoke,
  // @ts-expect-error — plain JS with no type declarations, deliberately: it has
  // to run from a shell straight after a deploy with no transform available.
} from '../tools/generate/bin/smoke.mjs'

const REPO = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

/** The compiler `pnpm -r build` runs for the control app, invoked directly. */
const TSC = path.join(REPO, 'apps', 'control-app', 'node_modules', '.bin', 'tsc')

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

const scratch: string[] = []
afterEach(() => {
  for (const dir of scratch.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function tempDir(label: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), `d5167ced-${label}-`))
  scratch.push(dir)
  return dir
}

function write(file: string, body: string): void {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, body)
}

/** Run the real compiler over a fixture, with the flags `bin/build` would reach it by. */
function typecheck(dir: string): Run {
  return sh(TSC, ['--noEmit', '--project', path.join(dir, 'tsconfig.json')], { cwd: dir })
}

// ═════════════════════════════════════════════════════════════════════════════
// AC-1425 — the operator surface is private, asserted from outside
// ═════════════════════════════════════════════════════════════════════════════

const PUBLIC_ORIGIN = 'https://public.test'
const CONTROL_ORIGIN = 'https://app.control.test'
const WORKERS_DEV_ORIGIN = 'https://control-app.uat.workers.dev'

interface Reply {
  status: number
  headers: Record<string, string>
  body: string
}

/**
 * A fetch that answers per ORIGIN, and can be made not to resolve at all.
 *
 * The engine's other checks need somewhere harmless to point, so the public
 * origin answers correctly throughout: a control-surface claim must never be
 * confounded by a public-site check failing underneath it.
 */
function multiOriginFetch(opts: {
  control?: () => Response
  workersDev?: () => Response
  unresolvable?: string[]
}) {
  return async (input: string | URL): Promise<Response> => {
    const url = new URL(String(input))
    if ((opts.unresolvable ?? []).includes(url.origin)) {
      throw new TypeError('fetch failed: getaddrinfo ENOTFOUND')
    }
    if (url.origin === CONTROL_ORIGIN && opts.control) return opts.control()
    if (url.origin === WORKERS_DEV_ORIGIN && opts.workersDev) return opts.workersDev()
    if (url.origin === PUBLIC_ORIGIN && url.pathname === '/') {
      return new Response('Hello', { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } })
    }
    return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  }
}

interface Check {
  name: string
  status: 'pass' | 'fail' | 'skip'
  detail: string
}
interface Report {
  ok: boolean
  checks: Check[]
  failed: Check[]
}

const CHALLENGE = 'control_app_challenges_unauthenticated'
const DEFAULT_HOSTNAME = 'control_app_workers_dev_closed'

/**
 * Drive the real `smoke.mjs` PROCESS with its transport replaced beneath it, so
 * the exit status and the rendered report are the ones an operator sees. The
 * origin table is keyed by `<origin><pathname>`, because these two checks are
 * the only ones in the set that address a DIFFERENT host from the site.
 */
const FETCH_HOOK = `
const TABLE = JSON.parse(process.env.UAT_MULTI_TABLE)
const THROWS = JSON.parse(process.env.UAT_UNRESOLVABLE)
globalThis.fetch = async (input) => {
  const url = new URL(String(input))
  if (THROWS.includes(url.origin)) throw new TypeError('fetch failed: getaddrinfo ENOTFOUND')
  const hit = TABLE[url.origin + url.pathname]
  if (hit) {
    return new Response(hit.body === '' ? null : hit.body, { status: hit.status, headers: hit.headers })
  }
  return new Response('Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
`

function runSmokeCli(
  args: string[],
  table: Record<string, Reply>,
  unresolvable: string[],
): Run {
  const dir = tempDir('smoke-cli')
  const hook = path.join(dir, 'origin.mjs')
  writeFileSync(hook, FETCH_HOOK)
  return sh('node', ['--import', hook, path.join(REPO, 'tools', 'generate', 'bin', 'smoke.mjs'), ...args], {
    cwd: REPO,
    env: {
      UAT_MULTI_TABLE: JSON.stringify(table),
      UAT_UNRESOLVABLE: JSON.stringify(unresolvable),
    },
  })
}

const APEX_OK: Reply = {
  status: 200,
  headers: { 'content-type': 'text/plain; charset=utf-8' },
  body: 'Hello',
}

describe('story-d5167ced — the smoke check asserts the operator surface is private', () => {
  it('test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option', async () => {
    const named = (report: Report, name: string): Check => {
      const hit = report.checks.find((c) => c.name === name)
      expect(hit, `${name} is not in the report at all`).toBeDefined()
      return hit as Check
    }

    // ── every way the gate can hold is a pass, and they look nothing alike ────
    //
    // Stated as a negative — "this did not serve the builder" — rather than as
    // one expected status, because a check that recognised only one of these
    // would fail a correctly-protected origin.
    const protectedForms = [
      {
        what: 'a browser redirected to the identity provider',
        response: () =>
          new Response(null, {
            status: 302,
            headers: { location: 'https://uat-team.cloudflareaccess.com/cdn-cgi/access/login/app' },
          }),
        provesTheChallenge: true,
      },
      {
        what: 'a non-browser refused outright',
        response: () => new Response('unauthorized', { status: 401 }),
        provesTheChallenge: true,
      },
      {
        what: "the Worker's own refusal when its gate is unconfigured",
        response: () => new Response('gate not configured', { status: 503 }),
        provesTheChallenge: false,
      },
    ]

    for (const form of protectedForms) {
      const report = (await runSmoke({
        origin: PUBLIC_ORIGIN,
        controlOrigin: CONTROL_ORIGIN,
        workersDevOrigin: WORKERS_DEV_ORIGIN,
        // The one check in the set where a transport error is the outcome
        // sought: a hostname that no longer resolves is the door being shut.
        fetch: multiOriginFetch({ control: form.response, unresolvable: [WORKERS_DEV_ORIGIN] }),
      })) as Report

      expect(named(report, CHALLENGE).status, form.what).toBe('pass')
      expect(named(report, DEFAULT_HOSTNAME).status, form.what).toBe('pass')
      // A hostname that does not resolve is REPORTED as that, not as an error.
      expect(named(report, DEFAULT_HOSTNAME).detail).toContain('does not resolve')
      // The unconfigured form passes — it is not serving — but its detail says
      // so, in the words an operator needs: not "protected", but "the challenge
      // has not yet been proved".
      const detail = named(report, CHALLENGE).detail
      if (form.provesTheChallenge) {
        expect(detail).not.toContain('no challenge was proved')
      } else {
        expect(detail).toContain('503')
        expect(detail).toContain('no challenge was proved')
      }
      // Neither may be reported as a failure of the public site's axis.
      expect(report.failed.map((c) => c.name)).toEqual([])
    }

    // ── a served builder fails, naming the check that owns that door ──────────
    const servedBuilder = runSmokeCli(
      [
        '--origin',
        PUBLIC_ORIGIN,
        '--control-origin',
        CONTROL_ORIGIN,
        '--workers-dev-origin',
        WORKERS_DEV_ORIGIN,
      ],
      {
        [`${PUBLIC_ORIGIN}/`]: APEX_OK,
        [`${CONTROL_ORIGIN}/`]: {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
          body: '<html>the builder</html>',
        },
      },
      [WORKERS_DEV_ORIGIN],
    )
    expect(servedBuilder.code, servedBuilder.all).toBe(1)
    expect(servedBuilder.out).toContain(`FAIL  ${CHALLENGE}`)
    expect(servedBuilder.out).toContain(`Failed: ${CHALLENGE}`)
    // The exposure is named, not just the status.
    expect(servedBuilder.out).toContain('the builder is being served publicly')
    // The other door is a separate check and still reports its own outcome.
    expect(servedBuilder.out).toContain(`PASS  ${DEFAULT_HOSTNAME}`)

    // ── an answering default hostname fails, and it is the OTHER check ────────
    const answeringDefault = runSmokeCli(
      [
        '--origin',
        PUBLIC_ORIGIN,
        '--control-origin',
        CONTROL_ORIGIN,
        '--workers-dev-origin',
        WORKERS_DEV_ORIGIN,
      ],
      {
        [`${PUBLIC_ORIGIN}/`]: APEX_OK,
        [`${CONTROL_ORIGIN}/`]: {
          status: 302,
          headers: { location: 'https://uat-team.cloudflareaccess.com/cdn-cgi/access/login/app' },
          body: '',
        },
        [`${WORKERS_DEV_ORIGIN}/`]: {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
          body: '<html>the builder</html>',
        },
      },
      [],
    )
    expect(answeringDefault.code, answeringDefault.all).toBe(1)
    expect(answeringDefault.out).toContain(`FAIL  ${DEFAULT_HOSTNAME}`)
    expect(answeringDefault.out).toContain(`Failed: ${DEFAULT_HOSTNAME}`)
    // The door no hostname policy covers, said in those terms.
    expect(answeringDefault.out).toContain('which no Access policy covers')
    expect(answeringDefault.out).toContain(`PASS  ${CHALLENGE}`)

    // ── neither option supplied: skipped BY NAME, and the run does not fail ───
    const noOptions = runSmokeCli(['--origin', PUBLIC_ORIGIN], { [`${PUBLIC_ORIGIN}/`]: APEX_OK }, [])
    expect(noOptions.code, noOptions.all).toBe(0)
    expect(noOptions.out).toContain(`skip  ${CHALLENGE}`)
    expect(noOptions.out).toContain(`skip  ${DEFAULT_HOSTNAME}`)
    // Each names the option it wanted, so the reason is legible without the docs.
    expect(noOptions.out).toContain('no --control-origin given')
    expect(noOptions.out).toContain('no --workers-dev-origin given')
    expect(noOptions.out).not.toContain('FAIL  ')

    // And the inverse axis: pointed at a control origin with no site to test,
    // the public-site checks skip rather than failing the control-surface run.
    const controlOnly = (await runSmoke({
      origin: PUBLIC_ORIGIN,
      controlOrigin: CONTROL_ORIGIN,
      fetch: multiOriginFetch({ control: () => new Response('unauthorized', { status: 401 }) }),
    })) as Report
    expect(controlOnly.ok).toBe(true)
    expect(named(controlOnly, CHALLENGE).status).toBe('pass')
    expect(named(controlOnly, DEFAULT_HOSTNAME).status).toBe('skip')
    expect(named(controlOnly, DEFAULT_HOSTNAME).detail).toContain('--workers-dev-origin')

    // A skip is never a pass: the rendered summary counts the two separately, so
    // "everything applicable passed" and "nothing was left untested" cannot be
    // read as the same sentence.
    const rendered = formatReport(controlOnly) as string
    expect(rendered).toMatch(/\d+ passed, \d+ skipped\./)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1426 — the build refuses a type program that reaches the filesystem
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Modules that reach `node:fs` or `node:path`, directly or otherwise.
 *
 * Listed rather than detected, because detection would have to walk the very
 * graph under test and would agree with it by construction. These are the
 * file-backed halves of the store, named in their own headers as the parts a
 * Worker must never reach.
 */
const FILESYSTEM_BOUND = [
  'tools/generate/src/store/fsutil.ts',
  'tools/generate/src/store/paths.ts',
  'tools/generate/src/store/loadSite.ts',
  'tools/generate/src/store/fs-store.ts',
  'tools/generate/src/store/history.ts',
  'tools/generate/src/store/base.ts',
  'tools/generate/src/store/journal.ts',
  'tools/generate/src/store/index.ts',
  'tools/generate/src/cli/commands.ts',
]

/** Source with comments removed, so prose cannot trip the walk. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

function resolveSpec(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  const base = path.resolve(path.dirname(fromFile), spec)
  for (const candidate of [base, `${base}.ts`, `${base}.js`, path.join(base, 'index.ts'), base.replace(/\.js$/, '.ts')]) {
    try {
      if (readFileSync(candidate) !== undefined) return candidate
    } catch {
      /* not this one */
    }
  }
  return null
}

/**
 * Every module the TYPECHECKER would pull in from `entry` — type-only edges
 * included, because that is precisely what `tsc` does and precisely what a
 * bundle-level guard cannot see.
 */
function typeProgramOf(entry: string): Map<string, string[]> {
  const seen = new Map<string, string[]>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    const source = withoutComments(readFileSync(file, 'utf8'))
    const edges: string[] = []
    for (const match of source.matchAll(/\b(?:import|export)\b[\s\S]*?\bfrom\s+['"]([^'"]+)['"]/g)) {
      const next = resolveSpec(file, match[1])
      if (next) edges.push(next)
    }
    seen.set(file, edges)
    queue.push(...edges)
  }
  return seen
}

/** The SHORTEST import chain from `entry` to `target` — the specifier to change. */
function chainTo(graph: Map<string, string[]>, entry: string, target: string, root: string): string[] {
  const previous = new Map<string, string>()
  const queue = [entry]
  const visited = new Set([entry])
  while (queue.length > 0) {
    const file = queue.shift() as string
    if (file === target) {
      const chain = [file]
      let at = file
      while (previous.has(at)) {
        at = previous.get(at) as string
        chain.unshift(at)
      }
      return chain.map((f) => path.relative(root, f))
    }
    for (const next of graph.get(file) ?? []) {
      if (visited.has(next)) continue
      visited.add(next)
      previous.set(next, file)
      queue.push(next)
    }
  }
  return []
}

describe('story-d5167ced — the build refuses a Worker type program that reaches the filesystem', () => {
  it('test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_naming_the_chain', () => {
    // ── the tree as it stands: the build proceeds ────────────────────────────
    //
    // The real compiler, over the real Worker's real tsconfig — which declares
    // platform types and no host-runtime types, so a filesystem-bound module in
    // its type program IS a build failure and not a warning.
    const asItStands = sh(TSC, ['--noEmit', '--project', path.join(REPO, 'apps/control-app/tsconfig.json')], {
      cwd: REPO,
    })
    expect(asItStands.code, asItStands.all).toBe(0)

    const entry = path.join(REPO, 'apps/control-app/src/index.ts')
    const graph = typeProgramOf(entry)
    const reached = FILESYSTEM_BOUND.map((rel) => path.join(REPO, rel)).filter((f) => graph.has(f))
    expect(
      reached.map((f) => path.relative(REPO, f)),
      reached.map((f) => chainTo(graph, entry, f, REPO).join('\n    → ')).join('\n\n  '),
    ).toEqual([])

    // ── and the walk is not vacuous ─────────────────────────────────────────
    //
    // A walk that followed no edges, or a comment stripper that ate the file,
    // would satisfy the assertion above while proving nothing.
    for (const rel of [
      'apps/control-app/src/router.ts',
      'tools/generate/src/render/render.ts',
      'tools/generate/src/store/assemble.ts',
      'tools/generate/src/publish/publish.ts',
    ]) {
      expect(graph.has(path.join(REPO, rel)), `the walk never reached ${rel}`).toBe(true)
    }
    // At least one recorded edge is TYPE-ONLY — the kind a runtime-import walk
    // deliberately skips, and the only kind that produced this failure.
    const render = path.join(REPO, 'tools/generate/src/render/render.ts')
    const assemble = path.join(REPO, 'tools/generate/src/store/assemble.ts')
    expect(graph.get(render)).toContain(assemble)
    expect(readFileSync(render, 'utf8')).toMatch(/^import type \{ LoadedSite \} from '\.\.\/store\/assemble'$/m)

    // ── reintroduce the original offending specifier ─────────────────────────
    //
    // The shape that broke this build, minimally: a type imported from a module
    // that merely RE-EXPORTS it while itself reaching the filesystem. The type is
    // declared in a module that reaches nothing, so the two fixtures below differ
    // by one specifier and nothing else.
    const build = (dir: string, from: './loadSite' | './assemble'): void => {
      write(
        path.join(dir, 'tsconfig.json'),
        // No host-runtime types, exactly as a Worker package declares.
        `${JSON.stringify(
          {
            compilerOptions: {
              target: 'es2022',
              module: 'esnext',
              moduleResolution: 'bundler',
              strict: true,
              noEmit: true,
              types: [],
            },
            // The ENTRY only, so what is in the program is what the entry
            // imports — which is the property under test. `apps/control-app`'s
            // own tsconfig includes `src/**/*.ts` and reaches `tools/generate`
            // solely through imports, in exactly this way.
            files: ['worker.ts'],
          },
          null,
          2,
        )}\n`,
      )
      write(
        path.join(dir, 'worker.ts'),
        `import type { LoadedSite } from '${from}'\nexport const slugOf = (site: LoadedSite): string => site.slug\n`,
      )
      write(
        path.join(dir, 'loadSite.ts'),
        "import fs from 'node:fs'\n" +
          "export type { LoadedSite } from './assemble'\n" +
          "export const readIt = (p: string): string => fs.readFileSync(p, 'utf8')\n",
      )
      write(path.join(dir, 'assemble.ts'), 'export interface LoadedSite {\n  slug: string\n}\n')
    }

    const offending = tempDir('type-program-offending')
    build(offending, './loadSite')
    const refused = typecheck(offending)
    // THE BUILD FAILS. A bundler would have erased this import before resolving
    // it and shipped a correct bundle; the typechecker does not, and says so.
    expect(refused.code, refused.all).not.toBe(0)
    expect(refused.all).toContain('node:fs')

    // One specifier is the whole difference: pointed at the module that declares
    // the type rather than the one that re-exports it, the same tree builds.
    const corrected = tempDir('type-program-corrected')
    build(corrected, './assemble')
    const proceeds = typecheck(corrected)
    expect(proceeds.code, proceeds.all).toBe(0)

    // ── and the refusal names the chain, not a list of unresolved names ───────
    const offendingEntry = path.join(offending, 'worker.ts')
    const offendingGraph = typeProgramOf(offendingEntry)
    const offender = path.join(offending, 'loadSite.ts')
    expect(offendingGraph.has(offender)).toBe(true)
    expect(chainTo(offendingGraph, offendingEntry, offender, offending)).toEqual(['worker.ts', 'loadSite.ts'])
    // The corrected tree does not reach it at all — so the chain above is the
    // consequence of the specifier and not of the fixture's mere existence.
    expect(typeProgramOf(path.join(corrected, 'worker.ts')).has(path.join(corrected, 'loadSite.ts'))).toBe(false)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// AC-1427 — generate the derived artifacts BEFORE the typecheck reads them
// ═════════════════════════════════════════════════════════════════════════════

/** The generated modules the Worker's own source imports, and where they land. */
const GENERATED = [
  { importer: 'apps/control-app/src/chrome.ts', specifier: "'./generated/importmap.json'" },
  { importer: 'apps/control-app/src/ai.ts', specifier: "'./generated/ai-workers.js'" },
]

function writeScript(file: string, body: string, executable = true): void {
  writeFileSync(file, `#!/usr/bin/env bash\nset -euo pipefail\n${body}`)
  chmodSync(file, executable ? 0o755 : 0o644)
}

/** The real `bin/build`, in a tree whose 1c / pnpm / npx are recording shims. */
function buildFixture(label: string, oneCExit = 0): { root: string; env: NodeJS.ProcessEnv; log: () => string[] } {
  const root = tempDir(label)
  mkdirSync(path.join(root, 'bin'), { recursive: true })
  const dest = path.join(root, 'bin', 'build')
  copyFileSync(path.join(REPO, 'bin', 'build'), dest)
  chmodSync(dest, 0o755)

  // `1c` is a separate command with its own criterion; here it is a stub, which
  // is what makes `bin/build`'s ORDERING and exit-code propagation observable.
  writeScript(
    path.join(root, 'bin', '1c'),
    `printf '1c|%s\\n' "$*" >> "$SHIM_LOG"\nexit "\${ONE_C_EXIT:-0}"\n`,
  )

  mkdirSync(path.join(root, 'apps', 'app-one'), { recursive: true })
  writeFileSync(
    path.join(root, 'apps', 'app-one', 'wrangler.toml'),
    'name = "worker-app-one"\nmain = "src/index.ts"\n\n[env.production]\nname = "prod-app-one"\n',
  )

  const shim = path.join(root, 'shim')
  mkdirSync(shim, { recursive: true })
  writeScript(path.join(shim, 'pnpm'), `printf 'pnpm|%s\\n' "$*" >> "$SHIM_LOG"\n`)
  writeScript(
    path.join(shim, 'npx'),
    `printf 'npx|%s\\n' "$*" >> "$SHIM_LOG"\n` +
      `if [[ "$*" == *"--outdir dist"* ]]; then mkdir -p dist && printf x > dist/index.js; fi\n`,
  )

  const shimLog = path.join(root, 'shim.log')
  writeFileSync(shimLog, '')
  return {
    root,
    env: { PATH: `${shim}:${process.env.PATH ?? ''}`, SHIM_LOG: shimLog, ONE_C_EXIT: String(oneCExit) },
    log: () =>
      readFileSync(shimLog, 'utf8')
        .split('\n')
        .filter((l) => l !== ''),
  }
}

describe('story-d5167ced — the derived artifacts are generated before the typecheck', () => {
  it('test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it', () => {
    // ── the artifacts are absent from version control ────────────────────────
    //
    // Which is what makes the case below the ORDINARY state of a fresh checkout
    // rather than a contrived one: a checked-in copy of a generator's output is a
    // second definition site, so `src/generated/` is ignored on purpose.
    const tracked = sh('git', ['ls-files', 'apps/control-app/src/generated'], { cwd: REPO })
    expect(tracked.out.trim(), 'a generated artifact is committed').toBe('')
    const ignored = sh('git', ['check-ignore', 'apps/control-app/src/generated/importmap.json'], { cwd: REPO })
    expect(ignored.code, ignored.all).toBe(0)

    // And the Worker's own source imports them, which is why their absence is a
    // typecheck failure rather than a missing optimisation.
    for (const { importer, specifier } of GENERATED) {
      expect(readFileSync(path.join(REPO, importer), 'utf8'), importer).toContain(specifier)
    }

    // ── a build ordered the other way round fails on a CORRECT tree ──────────
    //
    // The real compiler, over the shape `apps/control-app` has: a Worker source
    // importing a generated JSON module. With the generator not yet run there is
    // nothing to read, and the failure reports a missing module — which means a
    // missing build stage, not a missing file anyone should commit.
    const fresh = tempDir('generated-missing')
    const tsconfig = `${JSON.stringify(
      {
        compilerOptions: {
          target: 'es2022',
          module: 'esnext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          resolveJsonModule: true,
          types: [],
        },
        include: ['*.ts', 'generated/*.json'],
      },
      null,
      2,
    )}\n`
    write(path.join(fresh, 'tsconfig.json'), tsconfig)
    write(
      path.join(fresh, 'chrome.ts'),
      "import importmap from './generated/importmap.json'\n" +
        'export const styles = (importmap as { styles: string[] }).styles\n',
    )

    const beforeGenerating = typecheck(fresh)
    expect(beforeGenerating.code, beforeGenerating.all).not.toBe(0)
    expect(beforeGenerating.all).toContain("./generated/importmap.json")

    // Run the generator, and the very same typecheck passes. Nothing else moved.
    write(path.join(fresh, 'generated', 'importmap.json'), JSON.stringify({ imports: {}, styles: [] }, null, 2))
    const afterGenerating = typecheck(fresh)
    expect(afterGenerating.code, afterGenerating.all).toBe(0)

    // The real tree is in that second state, and its real typecheck passes.
    const real = sh(TSC, ['--noEmit', '--project', path.join(REPO, 'apps/control-app/tsconfig.json')], { cwd: REPO })
    expect(real.code, real.all).toBe(0)
    expect(real.all).not.toContain('generated/importmap.json')

    // ── so the build generates first, and says which stage it is ─────────────
    const ordered = buildFixture('build-order')
    const run = sh(path.join(ordered.root, 'bin', 'build'), [], { cwd: ordered.root, env: ordered.env })
    expect(run.code, run.all).toBe(0)

    const at = (needle: string): number => {
      const index = run.out.indexOf(needle)
      expect(index, `'${needle}' is not in the build's output`).toBeGreaterThanOrEqual(0)
      return index
    }
    // Its own named stage, so an operator can see which stage produced what …
    expect(at('==> Preflight')).toBeLessThan(at('==> Control-app assets'))
    // … and it is BEFORE the typecheck that reads what it wrote.
    expect(at('==> Control-app assets')).toBeLessThan(at('==> Typecheck and package builds'))

    // The same order in what actually ran, not only in what was printed.
    expect(ordered.log()).toEqual(['1c|preflight', '1c|assets', 'pnpm|-r build', 'npx|wrangler deploy --env production --dry-run --outdir dist'])

    // ── and a failing preflight still stops the run before anything is emitted ─
    const stopped = buildFixture('build-preflight-fails', 6)
    const halted = sh(path.join(stopped.root, 'bin', 'build'), [], { cwd: stopped.root, env: stopped.env })
    expect(halted.code, halted.all).toBe(6)
    expect(halted.out).not.toContain('==> Control-app assets')
    // The generation stage emitted nothing: `1c assets` was never reached.
    expect(stopped.log()).toEqual(['1c|preflight'])
  })
})
