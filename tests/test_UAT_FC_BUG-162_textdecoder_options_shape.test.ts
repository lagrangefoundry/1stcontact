/**
 * BUG-162 — **a `TextDecoder` options object names both fields**.
 *
 * The failure this guards is a compile-time shape, not a runtime behaviour, so
 * the evidence is a source scan rather than a decode. `apps/control-app` sets
 * `types: ["@cloudflare/workers-types"]` and no `DOM` lib, so inside the
 * Worker's program the only `TextDecoder` in scope is the Workers one, and its
 * `TextDecoderConstructorOptions` declares BOTH `fatal` and `ignoreBOM`
 * required — not optional, as `lib.dom`'s `TextDecoderOptions` has them.
 *
 * WHICH TSCONFIG A MODULE LIVES UNDER DOES NOT DECIDE WHICH RULE IT OBEYS. The
 * Worker's `include` is only its own `src/**`, but its source imports the render
 * engine, so every `tools/generate` module the Worker reaches is checked under
 * the stricter Workers types. A bare `{ fatal: true }` written in
 * `tools/generate` — where that module's own program has `DOM` and accepts it —
 * is red the moment `apps/control-app`'s typecheck walks the import, and takes
 * the whole recursive build with it. That is exactly how BUG-162 arrived.
 *
 * So the scan is repo-wide over first-party source, not scoped to the modules
 * that happen to be Worker-reachable today: reachability changes with the next
 * import, silently, and a guard that tracked it would go quiet at the moment it
 * mattered. Naming both fields everywhere costs nothing —
 * `{ fatal: X, ignoreBOM: false }` is the same decoder as `{ fatal: X }`, since
 * `ignoreBOM: false` is the WHATWG default (a leading BOM is consumed rather
 * than surfaced as U+FEFF).
 *
 * Nothing is mocked: the subject is the checked-in source itself, read from the
 * tracked tree.
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO = path.resolve(__dirname, '..')

/** First-party source roots. Everything else in the tree is generated or vendored. */
const SOURCE_ROOTS = ['apps', 'packages', 'tools', 'tests']

/** Extensions carrying source the typecheck or the runtime reads. */
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs'])

/**
 * Build output and snapshots checked in beside their sources. These are bundler
 * output — they carry whatever their dependencies wrote, no rule applies, and no
 * edit here would fix anything.
 */
const GENERATED = [/(^|\/)dist(-assets)?\//, /(^|\/)\.dev-snapshot\//, /(^|\/)generated\//]

/** Every tracked first-party source file. */
function trackedSourceFiles(): string[] {
  const out = execFileSync('git', ['ls-files', '-z', ...SOURCE_ROOTS], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return out
    .split('\0')
    .filter(Boolean)
    .filter((rel) => SOURCE_EXT.has(path.extname(rel)))
    .filter((rel) => !GENERATED.some((re) => re.test(rel)))
}

/**
 * Every `new TextDecoder(…)` construction that passes an options object, with
 * the object's source text.
 *
 * A construction with no second argument is not a subject: `new TextDecoder()`
 * and `new TextDecoder('utf-8')` typecheck under both options types, because
 * the parameter itself is optional. Only a supplied object has to be complete.
 */
function optionsConstructions(): Array<{ where: string; options: string }> {
  const hits: Array<{ where: string; options: string }> = []
  for (const rel of trackedSourceFiles()) {
    const lines = fs.readFileSync(path.join(REPO, rel), 'utf8').split('\n')
    lines.forEach((line, i) => {
      // The options object as written on the construction line. Multi-line
      // objects are not matched and do not need to be: nothing in this repo
      // writes one, and a single-line miss would be a false green, not a false
      // red — the typecheck still catches it.
      for (const m of line.matchAll(/new TextDecoder\([^)]*?,\s*(\{[^}]*\})/g)) {
        hits.push({ where: `${rel}:${i + 1}`, options: m[1] })
      }
    })
  }
  return hits
}

describe('BUG-162 — TextDecoder options satisfy the Workers types', () => {
  it('test_UAT_FC_BUG-162_every_options_object_names_fatal_and_ignoreBOM', () => {
    const offenders = optionsConstructions()
      .filter((h) => !(/\bfatal\s*:/.test(h.options) && /\bignoreBOM\s*:/.test(h.options)))
      .map((h) => `${h.where}  ${h.options}`)

    expect(
      offenders,
      'every `new TextDecoder(label, { … })` must name BOTH `fatal` and `ignoreBOM`: ' +
        "the Workers `TextDecoderConstructorOptions` declares both required, so a partial " +
        'object fails `apps/control-app`’s typecheck wherever the Worker reaches the module',
    ).toEqual([])
  })

  it('test_UAT_FC_BUG-162_the_scan_sees_the_line_that_broke_the_build', () => {
    // Guards the scan itself. A regex that matched nothing would pass the check
    // above unconditionally and report a clean tree forever; the construction
    // BUG-162 fixed is the fixed point that proves the scan reaches real source.
    const seen = optionsConstructions().map((h) => h.where)
    expect(seen.some((w) => w.startsWith('tools/generate/src/render/render.ts:'))).toBe(true)
    expect(seen.some((w) => w.startsWith('apps/control-app/src/mime.ts:'))).toBe(true)
  })
})
