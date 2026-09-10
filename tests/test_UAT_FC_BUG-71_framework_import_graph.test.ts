/**
 * BUG-71 — the builder's assets must be a graph that loads, not a list that
 * happened to.
 *
 * WHAT BROKE. `l1/edit.ts` gained `import { l1TextRuns } from './text'`. The
 * asset build emitted the six files `FRAMEWORK_SOURCES` names and no others, so
 * `text.ts` was never emitted and `./text` was never rewritten; the browser
 * asked for `/framework/text`, got a 404, and the entire builder failed to
 * mount. `1c assets` reported success every time it was run.
 *
 * A module script's `error` event fires on the TOP-LEVEL script even when the
 * failure is a nested import, so the operator's boot guard blamed `main.js` —
 * which was fine — and told them to run the command that could not help. The
 * only observation that names the real defect is the one below: walk the graph
 * the build actually wrote and see whether every edge lands.
 *
 * THESE DRIVE `1c assets` ITSELF, once, and assert against the tree on disk.
 * That matters here more than usual: the bug was invisible to every artifact
 * short of the emitted bytes, and a test that asked the build what it did —
 * rather than reading what it wrote — would have passed throughout.
 *
 * THE GRAPH WALK BELOW IS DELIBERATELY ITS OWN. `checkImportGraph` performs the
 * same walk inside the build, and calling it here would assert only that it
 * agrees with itself. This one resolves specifiers independently, from the
 * emitted import map, so the evidence is about the tree rather than about the
 * checker.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { run } from '../tools/generate/src/cli'
import { checkImportGraph } from '../tools/generate/src/cli/assets'
import { CommandError } from '../tools/generate/src/cli/errors'

const REPO = path.resolve(__dirname, '..')
const DIST = path.join(REPO, 'apps', 'control-app', 'dist-assets')
const FRAMEWORK = path.join(DIST, 'framework')
const IMPORT_MAP = path.join(REPO, 'apps', 'control-app', 'src', 'generated', 'importmap.json')
const ENTRY = '/builder/main.js'

/** The specifiers in a file, read the way a browser would — code only, no prose. */
function specifiersOf(code: string): string[] {
  const ts = createRequire(import.meta.url)('typescript') as typeof import('typescript')
  return ts.preProcessFile(code, true, true).importedFiles.map((f) => f.fileName)
}

/** Every module reachable from `entry`, and every edge that lands nowhere. */
function walk(distDir: string, entry: string, imports: Record<string, string>) {
  const reached = new Set<string>()
  const dangling: Array<{ spec: string; from: string }> = []
  const queue: Array<{ url: string; from: string }> = [{ url: entry, from: '(entry)' }]
  while (queue.length > 0) {
    const { url, from } = queue.shift() as { url: string; from: string }
    if (reached.has(url)) continue
    reached.add(url)
    const file = path.join(distDir, url.replace(/^\//, ''))
    if (!fs.existsSync(file)) {
      dangling.push({ spec: url, from })
      continue
    }
    if (!/\.m?js$/.test(url)) continue
    for (const spec of specifiersOf(fs.readFileSync(file, 'utf8'))) {
      const target = spec.startsWith('/')
        ? spec
        : spec.startsWith('.')
          ? path.posix.join(path.posix.dirname(url), spec)
          : (imports[spec] ?? null)
      if (target === null) dangling.push({ spec, from: url })
      else queue.push({ url: target, from: url })
    }
  }
  return { reached, dangling }
}

describe('BUG-71 — the emitted framework tree is the import graph', () => {
  let printed = ''
  let map: { imports: Record<string, string>; styles: string[] }

  beforeAll(async () => {
    const lines: string[] = []
    const log = console.log
    console.log = (...a: unknown[]) => void lines.push(a.map(String).join(' '))
    try {
      await run(['assets'])
    } finally {
      console.log = log
    }
    printed = lines.join('\n')
    map = JSON.parse(fs.readFileSync(IMPORT_MAP, 'utf8'))
  }, 180_000)

  it('test_UAT_FC_BUG-71_sibling_module_is_emitted_and_its_specifier_rewritten', () => {
    // The exact file whose absence took the builder down, at the URL the
    // rewritten specifier now names.
    const emitted = path.join(FRAMEWORK, 'packages', 'site-schema', 'src', 'l1', 'text.js')
    expect(fs.existsSync(emitted)).toBe(true)

    const edit = fs.readFileSync(path.join(FRAMEWORK, 'site-schema-edit.js'), 'utf8')
    expect(specifiersOf(edit)).toContain('/framework/packages/site-schema/src/l1/text.js')
    // `./text` was resolvable to TypeScript and meaningless to a browser. No
    // emitted file may still carry a specifier of that shape.
    for (const file of frameworkFiles()) {
      for (const spec of specifiersOf(fs.readFileSync(file, 'utf8'))) {
        expect(spec.startsWith('.')).toBe(false)
        if (spec.startsWith('/')) expect(spec.endsWith('.js')).toBe(true)
      }
    }
  })

  it('test_UAT_FC_BUG-71_builder_import_graph_resolves_end_to_end', () => {
    // The regression itself: before the fix this walk returned
    // `/framework/text <- /framework/site-schema-edit.js`, and the builder
    // showed a blank page.
    const { reached, dangling } = walk(DIST, ENTRY, map.imports)
    expect(dangling).toEqual([])
    // A graph this small would mean the walk found the entry and stopped —
    // green for the wrong reason.
    expect(reached.size).toBeGreaterThan(50)
    for (const style of map.styles) {
      expect(fs.existsSync(path.join(DIST, style.replace(/^\//, '')))).toBe(true)
    }
  })

  it('test_UAT_FC_BUG-71_each_source_is_emitted_at_exactly_one_url', () => {
    // One URL per source file: a module emitted twice would give the page two
    // instances of it, and two copies of whatever state it holds. Observable as
    // a closed tree — every framework file the emitted tree imports is a file
    // the emitted tree contains, with nothing served under a second name.
    const files = frameworkFiles().map((f) => `/framework/${path.relative(FRAMEWORK, f)}`)
    expect(new Set(files).size).toBe(files.length)
    const imported = new Set<string>()
    for (const file of frameworkFiles()) {
      for (const spec of specifiersOf(fs.readFileSync(file, 'utf8'))) {
        if (spec.startsWith('/framework/')) imported.add(spec)
      }
    }
    for (const spec of imported) expect(files).toContain(spec)
  })

  it('test_UAT_FC_BUG-71_report_states_the_graph_it_verified', () => {
    // The operator can see that the imports were checked rather than trusting
    // that they were. The count is the one the walk above independently found.
    const { reached } = walk(DIST, ENTRY, map.imports)
    expect(printed).toContain(`graph      ${reached.size} modules, ${map.styles.length} stylesheets`)
    expect(printed).toContain('every import resolves')
  })
})

describe('BUG-71 — a tree that cannot load is refused', () => {
  let staged = ''

  beforeAll(() => {
    // A staged tree shaped like the real one at the moment the check runs:
    // written, whole, and not yet swapped into place.
    staged = mkdtempSync(path.join(tmpdir(), 'bug71-'))
    fs.mkdirSync(path.join(staged, 'builder'), { recursive: true })
    fs.writeFileSync(
      path.join(staged, 'builder', 'main.js'),
      "import './present.js'\nimport '/framework/gone.js'\nimport '@webui/absent'\n",
    )
    fs.writeFileSync(path.join(staged, 'builder', 'present.js'), "import './deep.js'\n")
    fs.writeFileSync(path.join(staged, 'builder', 'deep.js'), '// a comment mentioning "./mirage.js"\n')
  })

  afterAll(() => rmSync(staged, { recursive: true, force: true }))

  it('test_UAT_FC_BUG-71_dangling_specifiers_are_all_named_and_the_build_refuses', () => {
    let thrown: unknown
    try {
      checkImportGraph(staged, ENTRY, { imports: {}, styles: ['/webui/missing.css'] })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(CommandError)
    const err = thrown as CommandError
    // ENVIRONMENT, because the tree is wrong rather than the operator's input.
    expect(err.code).toBe('ENVIRONMENT')
    // ALL of them, not the first: a rename that breaks nine imports must not
    // cost nine build cycles to discover.
    expect(err.message).toContain('/framework/gone.js')
    expect(err.message).toContain('@webui/absent')
    expect(err.message).toContain('/webui/missing.css')
    // Named with its importer, which is the half the boot guard could not give.
    expect(err.message).toContain('<- /builder/main.js')
    // A specifier quoted inside a comment is prose, not an edge.
    expect(err.message).not.toContain('mirage')
    // The operator is told their working build survived the refusal.
    expect(err.hint ?? '').toContain('previous dist-assets is untouched')
  })

  it('test_UAT_FC_BUG-71_a_whole_tree_passes_and_reports_its_size', () => {
    fs.writeFileSync(path.join(staged, 'builder', 'main.js'), "import './present.js'\n")
    const report = checkImportGraph(staged, ENTRY, { imports: {}, styles: [] })
    expect(report).toEqual({ modules: 3, styles: 0 })
  })
})

/** Every file in the emitted framework tree, nested entries included. */
function frameworkFiles(): string[] {
  const out: string[] = []
  const walkDir = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walkDir(full)
      else if (full.endsWith('.js')) out.push(full)
    }
  }
  walkDir(FRAMEWORK)
  return out
}
