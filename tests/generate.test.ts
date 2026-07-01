import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  cmdCheckout,
  cmdNew,
  cmdPublish,
  cmdRender,
  cmdRevisions,
  InvalidDefinitionError,
} from '../tools/generate/src/cli/commands'
import { loadSite, listFilesRel, sameBytes } from '../tools/generate/src/store'

/**
 * UATs for REQ-9 — the `1c` CLI: file-backed site storage, versioning, and the
 * server-side render pipeline. Each test drives the command handlers (the same
 * functions the `1c` binary dispatches) against an isolated temp working
 * directory, so nothing touches the repo's real sites/ or dist/ trees. Module
 * rendering goes through Astro's container API via Vitest's Astro transform —
 * the same SSR path the binary uses at runtime.
 */

let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req9-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** True when two directory trees are byte-identical (same files, same bytes). */
function dirsIdentical(a: string, b: string): boolean {
  const fa = listFilesRel(a)
  const fb = listFilesRel(b)
  if (fa.join('\n') !== fb.join('\n')) return false
  return fa.every((rel) => sameBytes(path.join(a, rel), path.join(b, rel)))
}

const sitePath = (...parts: string[]) => path.join(cwd, 'sites', ...parts)
const distPath = (...parts: string[]) => path.join(cwd, 'dist', ...parts)

describe('1c CLI — storage, versioning & render (REQ-9)', () => {
  it('test_UAT_FC_REQ-9_render_draft_produces_html', async () => {
    cmdNew('acme', { cwd })
    const { outDir } = await cmdRender('acme', { cwd })

    expect(outDir).toBe(distPath('sites', 'acme', 'draft'))
    const indexPath = path.join(outDir, 'index.html')
    expect(existsSync(indexPath)).toBe(true)

    const html = readFileSync(indexPath, 'utf8')
    expect(html).toContain('<!DOCTYPE html>')
    // Rendered module content from the starter page.
    expect(html).toContain('Welcome to acme')
    // A linked theme.css that actually exists on disk.
    expect(html).toContain('href="./theme.css"')
    expect(existsSync(path.join(outDir, 'theme.css'))).toBe(true)
    expect(readFileSync(path.join(outDir, 'theme.css'), 'utf8')).toContain('--color-primary')
  })

  it('test_UAT_FC_BUG-1_theme_css_carries_module_component_styles', async () => {
    cmdNew('acme', { cwd })
    const { outDir } = await cmdRender('acme', { cwd })

    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The design tokens are still present…
    expect(themeCss).toContain('--color-primary')
    // …but theme.css must ALSO carry the module component rules — the bug was
    // that it contained ONLY :root tokens and no class selectors.
    expect(themeCss).toMatch(/\.hero\b/)
    expect(themeCss).toContain('.header__inner')
    expect(themeCss).toContain('.footer__inner')

    // Every module class the render emits on the starter page must have a
    // matching rule in theme.css — otherwise the page renders unstyled. The
    // starter hero uses spacing-top-lg; its dial rule must be present.
    expect(html).toMatch(/class="[^"]*\bhero\b[^"]*\bspacing-top-lg\b/)
    expect(themeCss).toContain('.hero.spacing-top-lg')
    // And the surface-dial rules that make surfaces visible.
    expect(themeCss).toContain('.hero.surface-accent')
  })

  it('test_UAT_FC_REQ-9_publish_creates_locked_revision', async () => {
    cmdNew('acme', { cwd })
    const { id } = await cmdPublish('acme', { cwd, message: 'first', by: 'op', now: '2026-01-01T00:00:00.000Z' })
    expect(id).toBe(1)

    // The revision is a complete byte copy of the draft.
    expect(dirsIdentical(sitePath('acme', 'draft'), sitePath('acme', 'revisions', '0001'))).toBe(true)

    // history.json gained an entry with publishedAt + changes.
    const history = JSON.parse(readFileSync(sitePath('acme', 'history.json'), 'utf8'))
    expect(history.revisions).toHaveLength(1)
    const entry = history.revisions[0]
    expect(entry.id).toBe(1)
    expect(entry.publishedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(entry.changes.added).toContain('site.json')
    expect(entry.changes.added).toContain('pages/home.json')
  })

  it('test_UAT_FC_REQ-9_publish_renders_published_output', async () => {
    cmdNew('acme', { cwd })
    const draftOut = await cmdRender('acme', { cwd })
    const draftIndexBefore = readFileSync(path.join(draftOut.outDir, 'index.html'), 'utf8')

    await cmdPublish('acme', { cwd, message: 'pub' })

    const publishedIndex = distPath('sites', 'acme', 'published', 'index.html')
    expect(existsSync(publishedIndex)).toBe(true)

    // Published output equals a fresh render of the latest revision.
    const ref = await cmdRender('acme', { cwd, source: 'latest', out: path.join(cwd, 'ref') })
    expect(sameBytes(publishedIndex, path.join(ref.outDir, 'index.html'))).toBe(true)

    // The draft render is untouched by publish.
    const draftIndexAfter = readFileSync(path.join(draftOut.outDir, 'index.html'), 'utf8')
    expect(draftIndexAfter).toBe(draftIndexBefore)
  })

  it('test_UAT_FC_REQ-9_draft_and_published_separate_locations', async () => {
    cmdNew('acme', { cwd })

    await cmdRender('acme', { cwd })
    // render writes only under .../draft/, never .../published/
    expect(existsSync(distPath('sites', 'acme', 'draft', 'index.html'))).toBe(true)
    expect(existsSync(distPath('sites', 'acme', 'published'))).toBe(false)

    await cmdPublish('acme', { cwd })
    // publish writes only under .../published/
    expect(existsSync(distPath('sites', 'acme', 'published', 'index.html'))).toBe(true)
  })

  it('test_UAT_FC_REQ-9_change_log_is_accurate', async () => {
    cmdNew('acme', { cwd })
    await cmdPublish('acme', { cwd, message: 'r1' })

    // Modify one page and add one asset in the draft.
    const pagePath = sitePath('acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    page.title = 'Home (edited)'
    writeFileSync(pagePath, JSON.stringify(page, null, 2))
    writeFileSync(sitePath('acme', 'draft', 'assets', 'logo.svg'), '<svg/>')

    const { changes } = await cmdPublish('acme', { cwd, message: 'r2' })
    expect(changes.modified).toEqual(['pages/home.json'])
    expect(changes.added).toEqual(['assets/logo.svg'])
    expect(changes.removed).toEqual([])
  })

  it('test_UAT_FC_REQ-9_checkout_copies_revision_into_draft', async () => {
    cmdNew('acme', { cwd })
    await cmdPublish('acme', { cwd, message: 'r1' })

    // Change + publish again so the live revision (r2) differs from r1.
    const pagePath = sitePath('acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    page.title = 'Changed'
    writeFileSync(pagePath, JSON.stringify(page, null, 2))
    await cmdPublish('acme', { cwd, message: 'r2' })

    // draft now equals r2 (clean); checking out r1 replaces it with r1's contents.
    cmdCheckout('acme', 1, { cwd })
    expect(dirsIdentical(sitePath('acme', 'draft'), sitePath('acme', 'revisions', '0001'))).toBe(true)
  })

  it('test_UAT_FC_REQ-9_forward_only_rollback', async () => {
    cmdNew('acme', { cwd })
    await cmdPublish('acme', { cwd, message: 'r1' })

    const pagePath = sitePath('acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    page.title = 'v2'
    writeFileSync(pagePath, JSON.stringify(page, null, 2))
    await cmdPublish('acme', { cwd, message: 'r2' })

    // Roll back to r1 and publish: creates a NEW highest revision == r1's content.
    cmdCheckout('acme', 1, { cwd })
    const { id } = await cmdPublish('acme', { cwd, message: 'rollback' })
    expect(id).toBe(3)
    expect(dirsIdentical(sitePath('acme', 'revisions', '0003'), sitePath('acme', 'revisions', '0001'))).toBe(true)

    const revs = cmdRevisions('acme', { cwd })
    const r3 = revs.find((r) => r.id === 3)!
    expect(r3.basedOn).toBe(1)
  })

  it('test_UAT_FC_REQ-9_invalid_definition_rejected', async () => {
    cmdNew('acme', { cwd })
    // Corrupt the page: version must be a positive integer, not a string.
    const pagePath = sitePath('acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    page.modules[1].version = 'one'
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // loadSite reports a path-pointed schema error.
    const result = loadSite({ cwd, root: 'sites' }, 'acme', 'draft')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.path.includes('/modules/1/version'))).toBe(true)
    }

    // render refuses and writes nothing.
    await expect(cmdRender('acme', { cwd })).rejects.toBeInstanceOf(InvalidDefinitionError)
    expect(existsSync(distPath('sites', 'acme'))).toBe(false)
  })

  it('test_UAT_FC_REQ-9_multi_site', async () => {
    cmdNew('one', { cwd })
    cmdNew('two', { cwd })
    const a = await cmdRender('one', { cwd })
    const b = await cmdRender('two', { cwd })

    expect(a.outDir).toBe(distPath('sites', 'one', 'draft'))
    expect(b.outDir).toBe(distPath('sites', 'two', 'draft'))
    expect(readFileSync(path.join(a.outDir, 'index.html'), 'utf8')).toContain('Welcome to one')
    expect(readFileSync(path.join(b.outDir, 'index.html'), 'utf8')).toContain('Welcome to two')
  })

  it('test_UAT_FC_REQ-9_sandbox_isolation', async () => {
    cmdNew('scratch', { cwd, sandbox: true })
    // Created under sandbox/, NOT sites/.
    expect(existsSync(path.join(cwd, 'sandbox', 'scratch', 'draft'))).toBe(true)
    expect(existsSync(sitePath('scratch'))).toBe(false)

    const { outDir } = await cmdRender('scratch', { cwd, sandbox: true })
    expect(outDir).toBe(distPath('sandbox', 'scratch', 'draft'))
    expect(existsSync(path.join(outDir, 'index.html'))).toBe(true)
  })

  it('test_UAT_FC_REQ-9_gitignore_excludes_dist_and_sandbox', () => {
    // Runs against the real repo root: dist/ and sandbox/ are ignored; sites/ tracked.
    const repoRoot = path.resolve(__dirname, '..')
    const ignored = (p: string): boolean => {
      try {
        execFileSync('git', ['check-ignore', '-q', p], { cwd: repoRoot })
        return true
      } catch {
        return false
      }
    }
    expect(ignored('dist/sites/example/draft/index.html')).toBe(true)
    expect(ignored('sandbox/example/draft/site.json')).toBe(true)
    expect(ignored('sites/1stcontact/site.json')).toBe(false)
  })
})
