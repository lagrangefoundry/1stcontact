import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { redactor, REDACTED } from '../apps/control-app/src/redact'

/**
 * REQ-146 — **the boundary properties of the AI host in workerd**.
 *
 * Companion to `test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts`, which
 * takes real turns inside workerd. This file holds the acceptance criteria that
 * a passing turn CANNOT establish, and it lives in the node project because each
 * one is a statement about the SOURCE — what the Worker may import, and what it
 * may say — rather than about a running conversation.
 *
 * WHY AC5 AND AC6 ARE ASSERTED OVER THE IMPORT GRAPH AND NOT BY RUNNING.
 * Under `nodejs_compat`, `node:fs` RESOLVES in workerd and hands back a
 * per-isolate ephemeral filesystem: writes succeed, reads come back, and a
 * file-backed junction or archive therefore PASSES a functional test in workerd
 * while losing every conversation in production on the next eviction.
 * lagrange-framework REQ-103 measured exactly that. A green turn is thus not
 * evidence for these two criteria — only the absence of the import is, so that
 * is what is asserted.
 */

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')
const workerSrc = path.join(repoRoot, 'apps', 'control-app', 'src')

/** Every `.ts` under the Worker's source, minus the generated shim. */
function workerSources(): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        // `generated/` is `1c assets`' output — a one-line re-export carrying an
        // absolute path, regenerated per checkout and never committed.
        if (entry.name !== 'generated') walk(full)
      } else if (entry.name.endsWith('.ts')) {
        out.push(full)
      }
    }
  }
  walk(workerSrc)
  return out
}

/**
 * Is this import erased at compile time, and therefore absent from the bundle?
 *
 * THIS DISTINCTION IS THE WHOLE ACCURACY OF THE WALK. `d1r2-store` reaches
 * `fsutil`, and `toolbox-core` reaches the node-only store barrel — both only
 * through `import type`, both erased before a bundler ever sees them. Following
 * them would report a filesystem dependency the Worker does not have and make
 * the assertion fail on correct code, which is the fastest way to get a guard
 * like this deleted.
 *
 * Erased forms, given this repo's `tsconfig` (no `verbatimModuleSyntax`, so an
 * import left with no value bindings is elided rather than kept as a side-effect
 * import):
 *   `import type { X } from '…'`      — the statement is type-only
 *   `export type { X } from '…'`      — same, re-exported
 *   `import { type X, type Y } from '…'` — every specifier inline-typed
 *
 * Anything else — a default binding, a namespace binding, one value specifier,
 * or a bare `import '…'` for side effects — reaches the runtime.
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
 * tree-shaking — and a `node:fs` import that survives shaking is exactly as
 * fatal as one that does not, so shaking is not the thing to measure.
 *
 * (Cross-checked against the real thing: `wrangler deploy --dry-run` on this
 * Worker emits a bundle whose only `node:` specifiers are `events`, `path`,
 * `process` and `stream`.)
 */
function reachableFrom(entry: string): Map<string, string> {
  const seen = new Map<string, string>()
  const resolve = (fromFile: string, spec: string): string | null => {
    if (!spec.startsWith('.')) return null
    const base = path.resolve(path.dirname(fromFile), spec)
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.js`,
      path.join(base, 'index.ts'),
      base.replace(/\.js$/, '.ts'),
    ]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
    }
    return null
  }

  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    const source = fs.readFileSync(file, 'utf8')
    seen.set(file, source)
    // The whole import/export statement, so its type-only-ness can be judged.
    // The dynamic form is caught separately below, where its presence is itself
    // the failure rather than an edge to follow.
    const statements = withoutComments(source).matchAll(
      /\b(?:import|export)\b[\s\S]*?\bfrom\s+['"]([^'"]+)['"]/g,
    )
    for (const match of statements) {
      if (isTypeOnlyImport(match[0])) continue
      const next = resolve(file, match[1])
      if (next) queue.push(next)
    }
  }
  return seen
}

/** Source with block and line comments removed, so prose cannot trip an assertion. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/**
 * THE GUARD ON THE GUARD.
 *
 * Every assertion below is of the form "this set is empty", and a walker that
 * followed no edges — or a comment-stripper that ate the file — would satisfy
 * all of them while checking nothing. That is the rubber-stamp failure DOC-20
 * names, and the only defence is to prove the discriminator discriminates BEFORE
 * trusting what it says. So: the walk must reach modules known to be on the
 * path, and the classifier must be right about forms whose answers are known.
 */
describe('REQ-146 — the import walk actually discriminates', () => {
  it('test_UAT_FC_REQ-146_the_walk_reaches_the_workers_real_runtime_modules', () => {
    const graph = reachableFrom(path.join(workerSrc, 'index.ts'))
    const reached = [...graph.keys()].map((f) => path.relative(repoRoot, f))
    // Value imports, every one — if these are missing the walk is broken and
    // every emptiness assertion in this file is worthless.
    for (const expected of [
      'apps/control-app/src/router.ts',
      'apps/control-app/src/ai.ts',
      'apps/control-app/src/store.ts',
      'apps/control-app/src/redact.ts',
      'tools/generate/src/store/d1r2-store.ts',
      'tools/generate/src/cli/ai/host-core.ts',
      'tools/generate/src/cli/ai/toolbox-core.ts',
    ]) {
      expect(reached, `walk did not reach ${expected}`).toContain(expected)
    }
  })

  it('test_UAT_FC_REQ-146_type_only_imports_are_classified_correctly', () => {
    // Erased — following these reports dependencies the bundle does not have.
    for (const erased of [
      "import type { X } from './x'",
      "export type { X } from './x'",
      "import { type X } from './x'",
      "import { type X, type Y } from './x'",
    ]) {
      expect(isTypeOnlyImport(erased), erased).toBe(true)
    }
    // Reaches the runtime — missing any of these would let a real filesystem
    // import hide from the assertion.
    for (const live of [
      "import { X } from './x'",
      "import X from './x'",
      "import * as X from './x'",
      "import { type X, Y } from './x'",
      "import X, { type Y } from './x'",
      "export { X } from './x'",
    ]) {
      expect(isTypeOnlyImport(live), live).toBe(false)
    }
  })

  it('test_UAT_FC_REQ-146_a_planted_filesystem_import_is_caught', () => {
    // The detection itself, run against a module that genuinely does import
    // `node:fs` — `fsutil` is reachable only through `import type` today, so it
    // is the honest fixture: real code, really importing the thing.
    const fsutil = withoutComments(
      fs.readFileSync(path.join(repoRoot, 'tools/generate/src/store/fsutil.ts'), 'utf8'),
    )
    const hits = [...fsutil.matchAll(/['"](node:(?:fs|os|child_process)[^'"]*)['"]/g)]
    expect(hits.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-146_comment_stripping_keeps_the_code', () => {
    // If this ate the file, every "no offenders" assertion would pass vacuously.
    const stripped = withoutComments(
      ["/* node:fs in a block comment */", "// node:fs in a line comment", "import fs from 'node:fs'"].join(
        '\n',
      ),
    )
    expect(stripped).toContain("import fs from 'node:fs'")
    expect(stripped).not.toContain('block comment')
    expect(stripped).not.toContain('line comment')
  })
})

describe('REQ-146 — what the Worker may import, and what it may say', () => {
  it('test_UAT_FC_REQ-146_no_filesystem_module_can_reach_the_worker', () => {
    // AC6. `node:fs` RESOLVES under `nodejs_compat` and silently loses sessions,
    // so a passing turn proves nothing here — the absence of the import is the
    // only evidence there is.
    const graph = reachableFrom(path.join(workerSrc, 'index.ts'))
    expect(graph.size).toBeGreaterThan(5)

    const offenders: string[] = []
    for (const [file, source] of graph) {
      const code = withoutComments(source)
      for (const match of code.matchAll(/['"](node:(?:fs|os|child_process)[^'"]*)['"]/g)) {
        offenders.push(`${path.relative(repoRoot, file)} → ${match[1]}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_REQ-146_no_runtime_module_resolution_survives_on_the_worker_path', () => {
    // AC5. The Node host reaches the AI library through `require.resolve` →
    // `pathToFileURL` → a dynamic `import()` of that URL. workerd has no
    // filesystem and cannot import an arbitrary URL, so none of the three may
    // appear on this path: the library must arrive as a STATIC import the
    // bundler followed at build time.
    const graph = reachableFrom(path.join(workerSrc, 'index.ts'))
    const offenders: string[] = []
    for (const [file, source] of graph) {
      const code = withoutComments(source)
      const rel = path.relative(repoRoot, file)
      if (/\brequire\.resolve\b/.test(code)) offenders.push(`${rel} → require.resolve`)
      if (/\bpathToFileURL\b/.test(code)) offenders.push(`${rel} → pathToFileURL`)
      if (/\bcreateRequire\b/.test(code)) offenders.push(`${rel} → createRequire`)
      // `import(` with a non-literal argument: a literal specifier is a code
      // split the bundler resolves, an expression is a runtime lookup it cannot.
      for (const match of code.matchAll(/\bimport\s*\(\s*([^'")\s][^)]*)\)/g)) {
        offenders.push(`${rel} → dynamic import(${match[1].slice(0, 40)})`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_REQ-146_the_ai_library_is_reached_as_a_bundled_static_import', () => {
    // AC5, the positive half. The library has to be present as a STATIC import
    // of the generated shim — the rung `1c assets` resolved — and not as a bare
    // specifier, which resolves from the main checkout and finds nothing from a
    // linked git worktree.
    const ai = fs.readFileSync(path.join(workerSrc, 'ai.ts'), 'utf8')
    expect(ai).toMatch(/^import \* as aiLib from '\.\/generated\/ai-workers\.js'$/m)

    // And never the package root, which eagerly pulls the provider SDKs and
    // `node:child_process`. `/workers` is REQ-103's Cloudflare packaging.
    const graph = reachableFrom(path.join(workerSrc, 'index.ts'))
    for (const [file, source] of graph) {
      const code = withoutComments(source)
      expect(code, path.relative(repoRoot, file)).not.toMatch(
        /from\s+['"]@lagrangefoundry\/ai['"]/,
      )
    }
  })

  it('test_UAT_FC_REQ-146_the_generated_shim_is_not_committed', () => {
    // It carries a machine-specific absolute path, so a committed copy would be
    // wrong on every other machine — and would be a second definition site for
    // the component scope. `1c assets` regenerates it per checkout.
    const ignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8')
    expect(ignore).toMatch(/generated/)
  })

  it('test_UAT_FC_REQ-146_a_secret_is_scrubbed_from_whatever_the_worker_says', () => {
    // AC4. The leak this defends against arrives from BELOW — an SDK that puts
    // the request it tried to send into the error it threw. So the property is
    // that the value cannot survive the trip out, wherever in the message it sits.
    const key = 'sk-ant-api03-not-a-real-key-000'
    const scrub = redactor([key])

    expect(scrub(`upstream refused (key ${key})`)).not.toContain(key)
    expect(scrub(`upstream refused (key ${key})`)).toContain(REDACTED)
    // Every occurrence, not just the first — a stack trace repeats it.
    expect(scrub(`${key} ... ${key}`).includes(key)).toBe(false)
    // Embedded in a header dump, with no delimiters to anchor on.
    expect(scrub(`{"authorization":"Bearer ${key}"}`)).not.toContain(key)
    // The rest of the message survives, because a redacted diagnostic still has
    // to be a diagnostic.
    expect(scrub(`upstream refused (key ${key})`)).toContain('upstream refused')
  })

  it('test_UAT_FC_REQ-146_redaction_is_inert_when_there_is_nothing_to_protect', () => {
    // A deployment with no key must not have its error messages mangled, and a
    // misconfigured binding holding `''` or `'x'` must not blank every message
    // that happens to contain that character.
    const message = 'x marks the spot and the value is short'
    expect(redactor([])(message)).toBe(message)
    expect(redactor([undefined, null])(message)).toBe(message)
    expect(redactor([''])(message)).toBe(message)
    expect(redactor(['x'])(message)).toBe(message)
    expect(redactor(['short'])(message)).toBe(message)
  })

  it('test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed', () => {
    // The guarantee is only as good as its coverage: one path that formats
    // `err.message` without scrubbing is the whole hole. Asserted structurally,
    // because a test that exercises today's paths cannot fail for the one added
    // tomorrow.
    const router = withoutComments(
      fs.readFileSync(path.join(workerSrc, 'router.ts'), 'utf8'),
    )
    const raw = [...router.matchAll(/error:\s*([A-Za-z_.$][\w.$]*)/g)].map((m) => m[1])
    // Every `error:` value built from a variable must be the scrubbed one.
    for (const name of raw) {
      expect(['scrub'], `unscrubbed error value: ${name}`).toContain(name.split('(')[0])
    }
    expect(router).not.toMatch(/error:\s*err\.message/)
    expect(router).not.toMatch(/error:\s*message\b/)
  })
})
