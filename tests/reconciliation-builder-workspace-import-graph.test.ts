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
import { withDistAssetsLock } from './support/fs-lock'
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
      await withDistAssetsLock(REPO, () => run(['assets']))
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

  it('test_UAT_AC2464_type_only_imports_are_not_emitted_and_an_import_quoted_in_a_comment_is_left_as_written', () => {
    // `l1/edit.ts` imports `./palette` and `./types` for types only, and quotes
    // `from './palette'` in a doc comment. The emitted tree shows the build read
    // the transpiled code, not the source text or its prose.
    const source = fs.readFileSync(path.join(REPO, 'packages', 'site-schema', 'src', 'l1', 'edit.ts'), 'utf8')
    expect(source).toMatch(/^import type \{[^}]*\} from '\.\/palette'$/m)
    expect(source).toMatch(/^import type \{[^}]*\} from '\.\/types'$/m)
    const quoted = source.split('\n').find((l) => /^\s*\*.*from '\.\/palette'/.test(l))
    expect(quoted, 'edit.ts no longer quotes an import in a comment').toBeDefined()

    // ── NO TYPE-ONLY MODULE IS EMITTED OR IMPORTED ───────────────────────────
    const l1Out = path.join(FRAMEWORK, 'packages', 'site-schema', 'src', 'l1')
    expect(fs.existsSync(path.join(l1Out, 'palette.js')), 'type-only ./palette was emitted').toBe(false)
    expect(fs.existsSync(path.join(l1Out, 'types.js')), 'type-only ./types was emitted').toBe(false)
    const everySpec = frameworkFiles().flatMap((f) => specifiersOf(fs.readFileSync(f, 'utf8')))
    expect(everySpec.filter((s) => /\/(palette|types)(\.js)?$/.test(s))).toEqual([])

    // ── THE COMMENT SURVIVES INTO THE EMITTED FILE, UNREWRITTEN ──────────────
    const edit = fs.readFileSync(path.join(FRAMEWORK, 'site-schema-edit.js'), 'utf8')
    expect(edit).toContain((quoted as string).trim())
    expect(edit).not.toContain('/framework/packages/site-schema/src/l1/palette')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// THE REFUSALS, THROUGH THE REAL `1c assets`. Each case runs the whole build in
// a mirrored checkout: every entry of the repo is a symlink, except the files a
// case breaks and the directories the build writes to, which the mirror owns.
// So the real build runs end to end against a broken tree, and the real repo's
// own `dist-assets` is never at risk.
// ─────────────────────────────────────────────────────────────────────────────

function lexists(p: string): boolean {
  try {
    fs.lstatSync(p)
    return true
  } catch {
    return false
  }
}

/**
 * `to` as a real directory tree mirroring `from`, with only the files linked.
 * The build lists directories by `Dirent.isDirectory()`, which is false for a
 * symlink, so a directory it walks must hold real subdirectories.
 */
function deepLink(from: string, to: string): void {
  fs.mkdirSync(to, { recursive: true })
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name)
    const d = path.join(to, e.name)
    if (e.isDirectory() && e.name !== 'node_modules') deepLink(s, d)
    else fs.symlinkSync(s, d)
  }
}

/**
 * Make `rel` the mirror's own: each ancestor becomes a real directory whose
 * other children stay symlinks, and the immediate parent is mirrored deeply.
 * A file is copied from the repo; a directory is created empty.
 */
function own(root: string, rel: string, kind: 'file' | 'dir'): string {
  const parts = rel.split('/')
  let cur = root
  let src = REPO
  parts.slice(0, -1).forEach((seg, i, ancestors) => {
    cur = path.join(cur, seg)
    src = path.join(src, seg)
    if (!fs.lstatSync(cur).isSymbolicLink()) return
    fs.unlinkSync(cur)
    if (i === ancestors.length - 1) return deepLink(src, cur)
    fs.mkdirSync(cur)
    for (const e of fs.readdirSync(src)) fs.symlinkSync(path.join(src, e), path.join(cur, e))
  })
  const target = path.join(root, rel)
  if (lexists(target)) {
    if (fs.lstatSync(target).isSymbolicLink()) fs.unlinkSync(target)
    else fs.rmSync(target, { recursive: true, force: true })
  }
  if (kind === 'file') fs.copyFileSync(path.join(REPO, rel), target)
  else fs.mkdirSync(target, { recursive: true })
  return target
}

const PREVIOUS: Record<string, string> = {
  'builder/main.js': "// the previous build\nimport '/framework/edit-client.js'\n",
  'framework/edit-client.js': 'export const previous = true\n',
  'webui/marker.css': '/* previous */\n',
}

function mirror(): { base: string; root: string; served: string } {
  // Realpath, because `process.cwd()` after a chdir is the real path and the
  // build derives every path it prints from it.
  const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ac2464-mirror-')))
  const root = path.join(base, 'repo')
  fs.mkdirSync(root)
  for (const e of fs.readdirSync(REPO)) fs.symlinkSync(path.join(REPO, e), path.join(root, e))
  // Everything the build writes, so nothing it writes reaches the real repo.
  own(root, 'packages/framework/src/modules/module-assets.ts', 'file')
  own(root, 'apps/control-app/src/generated', 'dir')
  const served = own(root, 'apps/control-app/dist-assets', 'dir')
  for (const [rel, body] of Object.entries(PREVIOUS)) {
    fs.mkdirSync(path.dirname(path.join(served, rel)), { recursive: true })
    fs.writeFileSync(path.join(served, rel), body)
  }
  return { base, root, served }
}

/** Every file under `dir`, relative path → content, so "untouched" is byte-exact. */
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {}
  const walkDir = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walkDir(full)
      else out[path.relative(dir, full)] = fs.readFileSync(full, 'utf8')
    }
  }
  walkDir(dir)
  return out
}

async function assetsIn(root: string): Promise<unknown> {
  const cwd = process.cwd()
  const log = console.log
  console.log = () => {}
  process.chdir(root)
  try {
    await withDistAssetsLock(REPO, () => run(['assets']))
    return undefined
  } catch (err) {
    return err
  } finally {
    process.chdir(cwd)
    console.log = log
  }
}

describe('story-e674c60a — a refused build leaves the served tree exactly as it was', () => {
  const bases: string[] = []
  afterAll(() => {
    for (const b of bases) fs.rmSync(b, { recursive: true, force: true })
  })

  it('test_UAT_AC2464_a_dangling_edge_fails_1c_assets_before_the_swap_and_the_served_tree_is_byte_identical', async () => {
    const { base, root, served } = mirror()
    bases.push(base)
    const main = own(root, 'apps/control-app/src/builder/main.js', 'file')
    fs.appendFileSync(main, "\nimport '/framework/never-built-ac2464.js'\n")
    const before = snapshot(served)

    const err = await assetsIn(root)

    expect(err, '1c assets accepted a tree with a dangling import').toBeInstanceOf(CommandError)
    expect((err as CommandError).code).toBe('ENVIRONMENT')
    expect((err as CommandError).message).toContain('/framework/never-built-ac2464.js  <- /builder/main.js')
    // The build got as far as a whole staged tree, carrying the broken import…
    const stagedMain = path.join(`${served}.staging`, 'builder', 'main.js')
    expect(fs.readFileSync(stagedMain, 'utf8')).toContain('/framework/never-built-ac2464.js')
    expect(fs.existsSync(path.join(`${served}.staging`, 'framework', 'site-schema-edit.js'))).toBe(true)
    // …and was never swapped in: the served tree is byte for byte the previous one.
    expect(snapshot(served)).toEqual(before)
    expect(lexists(`${served}.retired`), 'the served tree was moved aside').toBe(false)
  }, 180_000)

  it('test_UAT_AC2464_a_bridge_import_that_resolves_to_no_file_fails_1c_assets_naming_the_importer_and_the_specifier', async () => {
    const { base, root, served } = mirror()
    bases.push(base)
    const shade = own(root, 'packages/site-schema/src/l1/shade.ts', 'file')
    fs.writeFileSync(shade, "import './nowhere-ac2464'\n" + fs.readFileSync(shade, 'utf8'))
    const before = snapshot(served)

    const err = await assetsIn(root)

    expect(err, '1c assets emitted a bridge whose import names no file').toBeInstanceOf(CommandError)
    expect((err as CommandError).code).toBe('ENVIRONMENT')
    expect((err as CommandError).message).toBe(
      "packages/site-schema/src/l1/shade.ts imports './nowhere-ac2464', which resolves to no file.",
    )
    expect(snapshot(served)).toEqual(before)
    expect(lexists(`${served}.retired`)).toBe(false)
  }, 180_000)

  it('test_UAT_AC2464_a_bridge_import_that_resolves_outside_the_repository_fails_1c_assets_naming_the_importer_and_the_specifier', async () => {
    const { base, root, served } = mirror()
    bases.push(base)
    // A real file, so the import resolves — just not inside the checkout.
    fs.writeFileSync(path.join(base, 'outside-ac2464.ts'), 'export const outside = 1\n')
    const spec = '../../../../../outside-ac2464'
    const shade = own(root, 'packages/site-schema/src/l1/shade.ts', 'file')
    fs.writeFileSync(shade, `import '${spec}'\n` + fs.readFileSync(shade, 'utf8'))
    const before = snapshot(served)

    const err = await assetsIn(root)

    expect(err, '1c assets emitted a bridge importing from outside the repo').toBeInstanceOf(CommandError)
    expect((err as CommandError).code).toBe('ENVIRONMENT')
    expect((err as CommandError).message).toBe(
      `packages/site-schema/src/l1/shade.ts imports '${spec}', which lies outside the repository.`,
    )
    expect(fs.readdirSync(served).sort()).toEqual(['builder', 'framework', 'webui'])
    expect(snapshot(served)).toEqual(before)
    expect(lexists(`${served}.retired`)).toBe(false)
  }, 180_000)
})
