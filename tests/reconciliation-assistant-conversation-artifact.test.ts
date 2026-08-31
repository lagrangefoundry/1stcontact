import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { CommandError, EXIT_CODES } from '../tools/generate/src/cli/errors'
import {
  SHARED_STORE_INSTALL_COMMAND,
  assertSharedStore,
  sharedComponents,
} from '../tools/generate/src/cli/shared-store'
import { WEBUI_SCOPE, sharedModulePath } from '../tools/generate/src/cli/webui'

/**
 * **The deployable artifact the conversation ships in** (story-a58a0974 —
 * AC-1406, AC-1407, AC-1410).
 *
 * These three criteria are the ones a passing turn CANNOT establish, which is
 * why they live here rather than beside the turns in
 * `reconciliation-assistant-conversation-deployed.workers.test.ts`. Each is a
 * statement about the artifact — what it may carry, whether it is produced at
 * all, and what the deploy does with the credential — rather than about a
 * running conversation.
 *
 * WHY AC-1406 IS ASSERTED OVER THE IMPORT GRAPH AND NOT BY RUNNING. Under the
 * deployed runtime's `nodejs_compat` setting, `node:fs` RESOLVES and hands back a
 * per-isolate ephemeral disk: writes succeed, reads come back, and a
 * filesystem-backed junction or archive therefore PASSES a functional test while
 * losing every conversation on the next eviction. A green turn is not evidence
 * for that criterion — only the absence of the import is, so that is what is
 * asserted, and the walk is proved to discriminate before it is trusted.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')
const workerSrc = path.join(repoRoot, 'apps', 'control-app', 'src')
const workerEntry = path.join(workerSrc, 'index.ts')

// ── the import walk ──────────────────────────────────────────────────────────

/** Source with block and line comments removed, so prose cannot trip an assertion. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/**
 * Is this import erased at compile time, and therefore absent from the artifact?
 *
 * THIS DISTINCTION IS THE WHOLE ACCURACY OF THE WALK. The Cloudflare store
 * adapter reaches the filesystem helper, and the toolbox core reaches the
 * node-only store barrel — both only through `import type`, both erased before a
 * bundler ever sees them. Following them would report a filesystem dependency the
 * artifact does not have and make the assertion fail on correct code, which is
 * the fastest way to get a guard like this deleted.
 */
function isTypeOnlyImport(statement: string): boolean {
  if (/^(?:import|export)\s+type\s/.test(statement)) return true
  const named = statement.match(/\{([\s\S]*?)\}/)
  // A default or namespace binding sits before the brace and is always a value.
  if (!named || /^import\s+(?:[A-Za-z_$][\w$]*\s*,|\*\s+as)/.test(statement)) return false
  const specifiers = named[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
  return specifiers.length > 0 && specifiers.every((s) => /^type\s/.test(s))
}

/**
 * Follow RUNTIME imports from an entry file and return every module reached.
 *
 * Deliberately a static walk rather than a bundler run: the property under test
 * is "no module on this path names the filesystem", which is a fact about the
 * source. Making it depend on a bundler would make it depend on that bundler's
 * tree-shaking — and an import that survives shaking is exactly as fatal as one
 * that does not, so shaking is not the thing to measure.
 *
 * ABSOLUTE SPECIFIERS ARE FOLLOWED TOO. The assistant library is resolved at
 * build time and re-exported by absolute path, so stopping at that edge would
 * leave the biggest thing in the artifact unwalked.
 */
function reachableFrom(entry: string): Map<string, string> {
  const seen = new Map<string, string>()
  const resolve = (fromFile: string, spec: string): string | null => {
    if (!spec.startsWith('.') && !spec.startsWith('/')) return null
    const base = spec.startsWith('/') ? spec : path.resolve(path.dirname(fromFile), spec)
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.js`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.js'),
      base.replace(/\.js$/, '.ts'),
    ]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
    }
    return null
  }

  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    const source = readFileSync(file, 'utf8')
    seen.set(file, source)
    // The whole import/export statement, so its type-only-ness can be judged.
    // The dynamic form is caught separately, where its presence is itself the
    // failure rather than an edge to follow.
    for (const match of withoutComments(source).matchAll(
      /\b(?:import|export)\b[\s\S]*?\bfrom\s+['"]([^'"]+)['"]/g,
    )) {
      if (isTypeOnlyImport(match[0])) continue
      const next = resolve(file, match[1])
      if (next) queue.push(next)
    }
  }
  return seen
}

/**
 * What may not be on the deployed path: the filesystem itself, and anything that
 * keeps a conversation on one — the junction that holds the turn in flight or the
 * archive behind it.
 */
const FS_MODULE = /['"](node:(?:fs|os|child_process)[^'"]*)['"]/g
/** A store, junction or archive backed by a disk, named as a module specifier. */
const FS_STORE_MODULE =
  /['"][^'"]*(?:\/(?:fs-store|fsutil|junction_file|file_archive|filesystem_toolbox|node_defaults)|\/ai\/host)(?:\.[jt]s)?['"]/g
/** …or named as a value binding, which is how one arrives without a specifier. */
const FS_STORE_BINDING = /\b(?:FileArchive|fileJunctions|fileAuditSink|FileJunctionStorage)\b/g

/**
 * Every offence in the graph, by file.
 *
 * TWO RULES HAVE DIFFERENT REACH, and the difference is deliberate rather than
 * convenient. `ownRoot` is the code this repository writes and is answerable
 * for — there, naming the filesystem AT ALL is the offence, because the module
 * would be in the artifact whether or not the branch runs. The shared assistant
 * library is a release artifact consumed whole: what this repository decides
 * about it is which RUNG it reaches, so the rule that reaches into it is the one
 * about specifiers — no module it carries may pull in the file-backed junction,
 * archive or toolbox. (The binding rule is not applied there because upstream's
 * own prose names those symbols when explaining why they are absent, and a guard
 * that fails on a comment is a guard somebody deletes.)
 */
function filesystemOffenders(graph: Map<string, string>, ownRoot = repoRoot): string[] {
  const offenders: string[] = []
  for (const [file, source] of graph) {
    const code = withoutComments(source)
    const rel = path.relative(repoRoot, file)
    const own = !path.relative(ownRoot, file).startsWith('..')
    for (const m of code.matchAll(FS_STORE_MODULE)) offenders.push(`${rel} → ${m[0]}`)
    if (!own) continue
    for (const m of code.matchAll(FS_MODULE)) offenders.push(`${rel} → ${m[1]}`)
    for (const m of code.matchAll(FS_STORE_BINDING)) offenders.push(`${rel} → ${m[0]}`)
  }
  return offenders
}

/** A module chosen at run time rather than resolved into the artifact. */
function runtimeResolutionOffenders(graph: Map<string, string>): string[] {
  const offenders: string[] = []
  for (const [file, source] of graph) {
    const code = withoutComments(source)
    const rel = path.relative(repoRoot, file)
    for (const name of ['require.resolve', 'createRequire', 'pathToFileURL']) {
      if (code.includes(name)) offenders.push(`${rel} → ${name}`)
    }
    // `import(` with a non-literal argument: a literal specifier is a code split
    // the bundler resolves, an expression is a lookup it cannot.
    for (const m of code.matchAll(/\bimport\s*\(\s*([^'")\s][^)]*)\)/g)) {
      offenders.push(`${rel} → dynamic import(${m[1].slice(0, 40)})`)
    }
  }
  return offenders
}

/** A throwaway module tree, for planting an offender the walk must catch. */
function plant(files: Record<string, string>): { root: string; entry: string; dispose(): void } {
  const dir = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-plant-'))
  for (const [name, source] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), source)
  }
  return {
    root: dir,
    entry: path.join(dir, 'entry.ts'),
    dispose: () => rmSync(dir, { recursive: true, force: true }),
  }
}

// ── AC-1406 — nothing filesystem-backed reaches the artifact ─────────────────

describe('no filesystem-backed junction or archive can reach the deployed artifact', () => {
  it('test_UAT_AC1406_the_artifacts_import_graph_carries_no_filesystem_module_or_store', () => {
    // THE GUARD ON THE GUARD, first. Every assertion below is "this set is
    // empty", and a walker that followed no edges — or a comment-stripper that
    // ate the file — would satisfy all of them while checking nothing.
    const graph = reachableFrom(workerEntry)
    const reached = [...graph.keys()].map((f) => path.relative(repoRoot, f))
    for (const expected of [
      'apps/control-app/src/router.ts',
      'apps/control-app/src/ai.ts',
      'apps/control-app/src/store.ts',
      'tools/generate/src/store/d1r2-store.ts',
      'tools/generate/src/cli/ai/host-core.ts',
      'tools/generate/src/cli/ai/toolbox-core.ts',
    ]) {
      expect(reached, `walk did not reach ${expected}`).toContain(expected)
    }
    expect(withoutComments("// node:fs\nimport fs from 'node:fs'")).toContain("from 'node:fs'")

    // PLANTED, in turn, so the discriminator is proved to discriminate. A walk
    // that followed nothing would otherwise pass by doing nothing.
    const bareFs = plant({ 'entry.ts': "import fs from 'node:fs'\nexport const x = fs" })
    try {
      expect(filesystemOffenders(reachableFrom(bareFs.entry), bareFs.root)).not.toEqual([])
    } finally {
      bareFs.dispose()
    }

    const fsBackedStore = plant({
      // Reached transitively, and named the way a real one would be — the offence
      // is the disk-backed archive arriving, not the word `fs` at the entry point.
      'entry.ts': "import { archive } from './lib'\nexport const a = archive",
      'lib.ts':
        "import { FileArchive } from './fs-store'\nexport const archive = new FileArchive('.')",
      'fs-store.ts': 'export class FileArchive { constructor(_d) {} }',
    })
    try {
      const offenders = filesystemOffenders(reachableFrom(fsBackedStore.entry), fsBackedStore.root)
      expect(offenders.join('\n')).toMatch(/fs-store/)
      expect(offenders.join('\n')).toMatch(/FileArchive/)
    } finally {
      fsBackedStore.dispose()
    }

    // A tree with neither must come back clean, or "not empty" would mean nothing.
    const innocent = plant({ 'entry.ts': 'export const x = 1' })
    try {
      expect(filesystemOffenders(reachableFrom(innocent.entry), innocent.root)).toEqual([])
    } finally {
      innocent.dispose()
    }

    // THE CRITERION. Nothing that keeps a conversation on a local disk is
    // reachable from what is deployed.
    expect(graph.size).toBeGreaterThan(5)
    expect(filesystemOffenders(graph)).toEqual([])

    // AND THE WALK REALLY DID LEAVE THIS REPOSITORY. The assistant library is the
    // largest thing in the artifact, so a walk that stopped at its edge would be
    // asserting emptiness over the easy half. It reaches the library's Cloudflare
    // rung and the core behind it…
    const reachedAll = [...graph.keys()]
    const libraryEntry = sharedModulePath('ai', './workers')
    expect(reachedAll).toContain(libraryEntry)
    expect(reachedAll.some((f) => f.endsWith(`${path.sep}core.js`))).toBe(true)
    // …and never the package root, which is where the file-backed junction and
    // archive are exported from. That absence is the whole reason the rung exists.
    const libraryDir = path.dirname(libraryEntry)
    for (const excluded of ['index.js', 'junction_file.js', 'file_archive.js']) {
      expect(reachedAll, excluded).not.toContain(path.join(libraryDir, excluded))
    }
  })
})

// ── AC-1407 — the library is bundled, or there is no artifact ────────────────

describe('the assistant library is bundled at build time', () => {
  it('test_UAT_AC1407_the_library_travels_in_the_artifact_and_a_missing_one_fails_the_build', async () => {
    // RESOLVED ONCE, AT BUILD TIME, through the single resolution point the
    // build itself uses — `1c assets` writes exactly this path into the shim the
    // Worker statically imports.
    const entry = sharedModulePath('ai', './workers')
    expect(path.isAbsolute(entry)).toBe(true)
    expect(existsSync(entry), `${entry} does not exist`).toBe(true)

    // THE LIBRARY'S OWN SYMBOLS ARE IN IT. Not a shim that would resolve to
    // something later — the module the artifact carries, loaded and inspected.
    const lib = (await import(pathToFileURL(entry).href)) as Record<string, unknown>
    for (const symbol of ['Session', 'SessionManager', 'Toolbox', 'ClaudeAPIBackend', 'memoryJunctions']) {
      expect(typeof lib[symbol], symbol).not.toBe('undefined')
    }

    // The generated re-export is the build's artifact and carries that same
    // absolute path, so the Worker reaches the library as a STATIC import a
    // bundler follows — never as a bare specifier resolved from wherever the
    // process happens to be.
    const shim = path.join(workerSrc, 'generated', 'ai-workers.js')
    expect(existsSync(shim), 'run `1c assets` — the shim is a build artifact').toBe(true)
    expect(readFileSync(shim, 'utf8')).toContain(JSON.stringify(entry))
    expect(readFileSync(path.join(workerSrc, 'ai.ts'), 'utf8')).toMatch(
      /^import \* as aiLib from '\.\/generated\/ai-workers\.js'$/m,
    )

    // NOTHING ON THE DEPLOYED PATH RESOLVES A MODULE PATH, builds a file address,
    // or imports a module chosen at run time. The assistant is in the artifact or
    // the artifact was never produced — there is no third state.
    expect(runtimeResolutionOffenders(reachableFrom(workerEntry))).toEqual([])
    // Non-vacuous: the resolution the Node host performs is caught when planted.
    const resolver = plant({
      'entry.ts':
        "import { createRequire } from 'x'\nconst r = createRequire(import.meta.url)\nexport const m = await import(r.resolve('a'))",
    })
    try {
      expect(runtimeResolutionOffenders(reachableFrom(resolver.entry))).not.toEqual([])
    } finally {
      resolver.dispose()
    }

    // WHEN THE LIBRARY IS NOT THERE TO BE BUILT IN, the build refuses. The
    // assistant library is one of the components the build's preflight demands…
    expect(sharedComponents().map((c) => c.component)).toContain('ai')

    // …and removing it from where the build resolves it stops the build, naming
    // what is missing and how to install it. Exercised through the resolver seam
    // the check exposes for exactly this, since a test cannot uninstall the
    // operator's shared store — what is asserted is the refusal, which is the
    // part an operator sees.
    let refusal: unknown
    try {
      assertSharedStore({ resolve: (component) => (component === 'ai' ? undefined : '/installed') })
    } catch (err) {
      refusal = err
    }
    expect(refusal).toBeInstanceOf(CommandError)
    const error = refusal as CommandError
    expect(error.message).toContain(`${WEBUI_SCOPE}/ai`)
    expect(`${error.message}\n${error.hint ?? ''}`).toContain(SHARED_STORE_INSTALL_COMMAND)
    // Non-zero, and specifically the environment code — `bin/build` branches on it.
    expect(EXIT_CODES[error.code]).toBe(6)
    expect(EXIT_CODES[error.code]).not.toBe(0)

    // AND NO ARTIFACT IS PRODUCED, because that refusal happens before anything
    // is emitted: the build runs its preflight first, then the assets, then the
    // bundle. A Worker whose conversation route is quietly absent surfaces only
    // as an operator asking the assistant a question and getting nothing, so the
    // ordering is the property rather than an implementation detail.
    const build = readFileSync(path.join(repoRoot, 'bin', 'build'), 'utf8')
    const stage = (needle: string): number => build.indexOf(needle)
    expect(stage('1c" preflight')).toBeGreaterThan(-1)
    expect(stage('1c" preflight')).toBeLessThan(stage('1c" assets'))
    expect(stage('1c" assets')).toBeLessThan(stage('wrangler deploy --env production --dry-run'))
  })
})

// ── AC-1410 — the model key ships as a deploy secret ─────────────────────────

/**
 * The hook talks to the deployment through `npx wrangler`. Putting a stub of that
 * name first on PATH makes its decision table observable without a network, a
 * deployment or a real credential — which is the only way to exercise the branch
 * that matters most (absent locally, present remotely), since a test can never
 * legitimately hold the real key.
 */
const HOOK = path.join(repoRoot, 'bin/deploy.d/secrets/10-anthropic-api-key')

const WRANGLER_STUB = `#!/usr/bin/env bash
set -euo pipefail
# invoked as: npx wrangler secret <verb> ...
if [[ "\${3:-}" == "list" ]]; then
  [[ "\${STUB_LIST_FAILS:-0}" == "1" ]] && { echo "could not reach the API" >&2; exit 1; }
  cat "\$STUB_LIST_JSON"
  exit 0
fi
if [[ "\${3:-}" == "put" ]]; then
  cat > "\$STUB_PUT_RECORD"     # the value arrives on stdin
  echo "Success! Uploaded secret \${4:-}"
  exit 0
fi
echo "stub: unexpected argv: \$*" >&2
exit 99
`

interface HookRun {
  code: number | null
  out: string
  /** What was uploaded, or `null` when nothing was. */
  pushed: string | null
}

interface HookCase {
  /** The credential in the operator's shell. Absent means genuinely absent. */
  key?: string
  /** Secret names the deployment already holds. */
  stored?: string[]
  /** The deployment could not be asked at all. */
  listFails?: boolean
  dryRun?: boolean
  app?: string
}

function runHook(c: HookCase): HookRun {
  const dir = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-secret-'))
  try {
    mkdirSync(path.join(dir, 'bin'))
    mkdirSync(path.join(dir, 'app'))
    writeFileSync(path.join(dir, 'bin', 'npx'), WRANGLER_STUB)
    chmodSync(path.join(dir, 'bin', 'npx'), 0o755)
    const putRecord = path.join(dir, 'put-record')
    const listJson = path.join(dir, 'list.json')
    writeFileSync(
      listJson,
      JSON.stringify((c.stored ?? []).map((name) => ({ name, type: 'secret_text' }))),
    )

    const env: Record<string, string> = {
      PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`,
      HOME: dir,
      STUB_LIST_JSON: listJson,
      STUB_PUT_RECORD: putRecord,
      STUB_LIST_FAILS: c.listFails ? '1' : '0',
      DEPLOY_APP: c.app ?? 'control-app',
      DEPLOY_APP_DIR: path.join(dir, 'app'),
      DEPLOY_ENV: 'production',
      DEPLOY_WORKER_NAME: '1stcontact-control-app',
      DEPLOY_DRY_RUN: c.dryRun ? '1' : '0',
      DEPLOY_REPO_ROOT: dir,
    }
    // Added only when the case says so — the child never inherits the operator's
    // own shell, so "absent" means absent.
    if (c.key !== undefined) env.ANTHROPIC_API_KEY = c.key

    const r = spawnSync('bash', [HOOK], { env, encoding: 'utf8' })
    return {
      code: r.status,
      out: `${r.stdout}${r.stderr}`,
      pushed: existsSync(putRecord) ? readFileSync(putRecord, 'utf8') : null,
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('the model key ships as a deploy secret', () => {
  it('test_UAT_AC1410_the_deploy_asks_the_deployment_and_rehearses_the_same_decision', () => {
    const VALUE = 'sk-ant-super-secret-do-not-print'

    // FOUR STATES, and the outcome, exit status and message of each.
    //
    // 1 — a value in the operator's environment is PUSHED, whether or not one is
    //     already stored, because supplying a value is how a rotation is expressed.
    const rotated = runHook({ key: VALUE, stored: ['ANTHROPIC_API_KEY'] })
    expect(rotated.code).toBe(0)
    expect(rotated.pushed).toBe(VALUE) // exact: no trailing newline
    expect(rotated.out).toMatch(/pushed ANTHROPIC_API_KEY/)

    // 2 — nothing locally, but the DEPLOYMENT already holds it: proceed, report
    //     that the stored value was left alone, and overwrite nothing.
    const kept = runHook({ stored: ['ANTHROPIC_API_KEY'] })
    expect(kept.code).toBe(0)
    expect(kept.out).toMatch(/already on 1stcontact-control-app/)
    expect(kept.out).toMatch(/left alone/)
    expect(kept.pushed).toBeNull()

    // 3 — no value in either place: fail before anything is uploaded, naming the
    //     credential and what to do.
    const nowhere = runHook({ stored: [] })
    expect(nowhere.code).toBe(1)
    expect(nowhere.out).toMatch(/ANTHROPIC_API_KEY is not set in your environment/)
    expect(nowhere.out).toMatch(/the Worker has no ANTHROPIC_API_KEY either/)
    expect(nowhere.pushed).toBeNull()

    // 4 — the deployment could not be asked at all: fail the same way, saying the
    //     store could not be read. ONLY A POSITIVE ANSWER LETS THE DEPLOY SKIP —
    //     a failed read counts as absent, because what is being guarded against is
    //     a confident skip based on an answer nobody actually got.
    const unreadable = runHook({ listFails: true })
    expect(unreadable.code).toBe(1)
    expect(unreadable.out).toMatch(/could not be read to check/)
    expect(unreadable.pushed).toBeNull()

    // A REHEARSAL REACHES THE SAME DECISION BY THE SAME ROUTE, including the
    // failures, and uploads nothing.
    const wouldKeep = runHook({ stored: ['ANTHROPIC_API_KEY'], dryRun: true })
    expect(wouldKeep.code).toBe(0)
    expect(wouldKeep.out).toMatch(/would leave it/)
    expect(wouldKeep.pushed).toBeNull()

    const wouldPush = runHook({ key: VALUE, stored: [], dryRun: true })
    expect(wouldPush.code).toBe(0)
    expect(wouldPush.out).toMatch(/would push ANTHROPIC_API_KEY/)
    expect(wouldPush.pushed).toBeNull()

    // A rehearsal that passed where the real deploy would abort is not a rehearsal.
    const wouldFail = runHook({ stored: [], dryRun: true })
    expect(wouldFail.code).toBe(1)
    expect(wouldFail.pushed).toBeNull()

    const wouldFailUnreadable = runHook({ listFails: true, dryRun: true })
    expect(wouldFailUnreadable.code).toBe(1)
    expect(wouldFailUnreadable.pushed).toBeNull()

    // THE VALUE IS NEVER PRINTED ON ANY PATH — only its name.
    for (const run of [rotated, kept, nowhere, unreadable, wouldKeep, wouldPush, wouldFail]) {
      expect(run.out).not.toContain(VALUE)
      expect(run.out).not.toContain(VALUE.slice(0, 12))
    }

    // A DEPLOYMENT THAT SERVES RENDERED VISITOR BYTES and hosts no assistant is
    // never offered the credential: it exits before it consults the store at all.
    const visitorBytes = runHook({ app: 'public-site', stored: [], listFails: true })
    expect(visitorBytes.code).toBe(0)
    expect(visitorBytes.pushed).toBeNull()
    expect(visitorBytes.out.trim()).toBe('')
  })
})
