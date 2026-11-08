/**
 * story-e674c60a — **the asset build ships a graph that loads, or nothing**
 * (BUG-71; AC-2464).
 *
 * WHAT MAKES THIS EVIDENCE. `1c assets` is driven through the CLI's own `run`
 * entry point and the tree it wrote is read from disk. The graph walk here is
 * independent of the build's own checker: it resolves specifiers itself, from
 * the emitted import map, so what is proved is a fact about the bytes on disk
 * rather than that the checker agrees with itself. The refusal half drives the
 * build's verification step against a staged tree, which is the exact moment the
 * build runs it — after the tree is whole, before it replaces the served one.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { run } from '../tools/generate/src/cli'
import { checkImportGraph } from '../tools/generate/src/cli/assets'
import { CommandError } from '../tools/generate/src/cli/errors'

const REPO = path.resolve(__dirname, '..')
const DIST = path.join(REPO, 'apps', 'control-app', 'dist-assets')
const FRAMEWORK = path.join(DIST, 'framework')
const IMPORT_MAP = path.join(REPO, 'apps', 'control-app', 'src', 'generated', 'importmap.json')
const ENTRY = '/builder/main.js'

/** The specifiers a browser would fetch — code only, never prose in a comment. */
function specifiersOf(code: string): string[] {
  const ts = createRequire(import.meta.url)('typescript') as typeof import('typescript')
  return ts.preProcessFile(code, true, true).importedFiles.map((f) => f.fileName)
}

function walk(distDir: string, entry: string, imports: Record<string, string>) {
  const reached = new Set<string>()
  const dangling: string[] = []
  const queue: Array<{ url: string; from: string }> = [{ url: entry, from: '(entry)' }]
  while (queue.length > 0) {
    const { url, from } = queue.shift()!
    if (reached.has(url)) continue
    reached.add(url)
    const file = path.join(distDir, url.replace(/^\//, ''))
    if (!fs.existsSync(file)) {
      dangling.push(`${url} <- ${from}`)
      continue
    }
    if (!/\.m?js$/.test(url)) continue
    for (const spec of specifiersOf(fs.readFileSync(file, 'utf8'))) {
      const target = spec.startsWith('/')
        ? spec
        : spec.startsWith('.')
          ? path.posix.join(path.posix.dirname(url), spec)
          : (imports[spec] ?? null)
      if (target === null) dangling.push(`${spec} <- ${url}`)
      else queue.push({ url: target, from: url })
    }
  }
  return { reached, dangling }
}

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

describe('story-e674c60a — the asset build emits and verifies the import graph', () => {
  let printed = ''
  let map: { imports: Record<string, string>; styles: string[] }
  let staged = ''

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
    staged = fs.mkdtempSync(path.join(os.tmpdir(), 'ac2464-'))
  }, 180_000)

  afterAll(() => {
    if (staged) fs.rmSync(staged, { recursive: true, force: true })
  })

  it('test_UAT_AC2464_asset_build_emits_the_closed_framework_graph_verifies_it_and_refuses_a_tree_that_cannot_load', () => {
    // ── THE SIBLING THAT BROKE THE BUILDER IS EMITTED AND IMPORTED BY URL ────
    const textUrl = '/framework/packages/site-schema/src/l1/text.js'
    expect(fs.existsSync(path.join(DIST, textUrl.slice(1))), `${textUrl} was not emitted`).toBe(true)
    const edit = fs.readFileSync(path.join(FRAMEWORK, 'site-schema-edit.js'), 'utf8')
    expect(specifiersOf(edit)).toContain(textUrl)

    // ── NO RELATIVE OR EXTENSIONLESS SPECIFIER; THE TREE IS CLOSED, ONCE EACH ─
    const files = frameworkFiles()
    const urls = files.map((f) => `/framework/${path.relative(FRAMEWORK, f).split(path.sep).join('/')}`)
    expect(new Set(urls).size, 'a framework file appears twice').toBe(urls.length)
    const imported = new Set<string>()
    for (const file of files) {
      for (const spec of specifiersOf(fs.readFileSync(file, 'utf8'))) {
        expect(spec.startsWith('.'), `${path.relative(FRAMEWORK, file)} keeps a relative '${spec}'`).toBe(false)
        if (spec.startsWith('/')) expect(spec.endsWith('.js'), `'${spec}' is extensionless`).toBe(true)
        if (spec.startsWith('/framework/')) imported.add(spec)
      }
    }
    for (const spec of imported) expect(urls, `${spec} is imported but not emitted`).toContain(spec)

    // ── AN INDEPENDENT WALK FROM THE ENTRY FINDS NOTHING DANGLING ────────────
    const { reached, dangling } = walk(DIST, ENTRY, map.imports)
    expect(dangling).toEqual([])
    expect(reached.size, 'the walk stopped near the entry').toBeGreaterThan(50)
    for (const style of map.styles) {
      expect(fs.existsSync(path.join(DIST, style.replace(/^\//, ''))), `${style} is missing`).toBe(true)
    }

    // ── THE REPORT SHOWS THE PROOF, WITH THE COUNTS THE WALK FOUND ───────────
    expect(printed).toContain(
      `graph      ${reached.size} modules, ${map.styles.length} stylesheets — every import resolves`,
    )

    // ── A STAGED TREE WITH THREE DANGLING EDGES IS REFUSED, ALL NAMED ────────
    fs.mkdirSync(path.join(staged, 'builder'), { recursive: true })
    fs.writeFileSync(
      path.join(staged, 'builder', 'main.js'),
      "import './present.js'\nimport '/framework/gone.js'\nimport '@webui/absent'\n",
    )
    fs.writeFileSync(path.join(staged, 'builder', 'present.js'), "import './deep.js'\n")
    fs.writeFileSync(path.join(staged, 'builder', 'deep.js'), "// see: import x from './mirage.js'\nexport {}\n")

    let thrown: unknown
    try {
      checkImportGraph(staged, ENTRY, { imports: {}, styles: ['/webui/missing.css'] })
    } catch (err) {
      thrown = err
    }
    expect(thrown).toBeInstanceOf(CommandError)
    const err = thrown as CommandError
    expect(err.code).toBe('ENVIRONMENT')
    expect(err.message).toContain('/framework/gone.js  <- /builder/main.js')
    expect(err.message).toContain('@webui/absent  <- /builder/main.js')
    expect(err.message).toContain('/webui/missing.css  <- (import map)')
    expect(err.message).not.toContain('mirage')
    expect(err.hint ?? '').toContain('the previous dist-assets is untouched')

    // ── THE SAME STAGED TREE, MADE WHOLE, PASSES AND REPORTS ITS SIZE ────────
    fs.writeFileSync(path.join(staged, 'builder', 'main.js'), "import './present.js'\n")
    fs.mkdirSync(path.join(staged, 'webui'), { recursive: true })
    fs.writeFileSync(path.join(staged, 'webui', 'present.css'), '')
    expect(checkImportGraph(staged, ENTRY, { imports: {}, styles: ['/webui/present.css'] })).toEqual({
      modules: 3,
      styles: 1,
    })
  })
})
