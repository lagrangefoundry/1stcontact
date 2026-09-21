import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { siteDir, distDir } from '../tools/generate/src/store/paths'

import { cmdNew, cmdList } from '../tools/generate/src/cli/commands'
import { bundleDirFor } from '../tools/generate/src/store/fs-reference-store'

/**
 * UATs for REQ-22 — the site-data trees consolidated under `storage/`, all of
 * them gitignored since REQ-290 retired the tracked authoring tier. Pure
 * path-builder checks plus a `git check-ignore` assertion against the repo's
 * real `.gitignore`.
 */
describe('storage/ layout (REQ-22)', () => {
  const cwd = '/repo'

  it('test_UAT_FC_REQ-22_new_and_render_use_storage', () => {
    expect(siteDir({ cwd, root: 'sandbox' }, 'acme')).toBe(
      path.join('/repo', 'storage', 'sandbox', 'acme'),
    )
    expect(siteDir({ cwd, root: 'sandbox' }, 'acme')).toBe(
      path.join('/repo', 'storage', 'sandbox', 'acme'),
    )
    expect(distDir({ cwd, root: 'sandbox' }, 'acme', 'draft')).toBe(
      path.join('/repo', 'storage', 'dist', 'sandbox', 'acme', 'draft'),
    )
  })

  it('test_UAT_FC_REQ-22_capture_writes_under_storage', () => {
    expect(bundleDirFor(cwd, { host: 'faelan.com', path: '/' })).toBe(
      path.join('/repo', 'storage', 'references', 'faelan.com', 'index'),
    )
  })

  it('test_UAT_FC_REQ-22_gitignore_ignores_every_storage_tier', () => {
    const ignored = (rel: string): boolean => {
      try {
        execFileSync('git', ['check-ignore', '-q', rel])
        return true
      } catch {
        return false
      }
    }
    // Placeholder slugs: this asserts a GITIGNORE PATTERN and never opens the
    // file, so it must not depend on which sites happen to be stored (REQ-140).
    //
    // REQ-290 retired the tracked tier. `storage/sites/` was the one path under
    // `storage/` that git followed, because it was where real sites were
    // authored on disk. Every real site now lives in the builder's store, and
    // the only tree the CLI writes is the gitignored reproduction substrate —
    // so what this asserts is no longer "one tracked tier, the rest ignored"
    // but that NOTHING under `storage/` is committed site data.
    expect(ignored('storage/sandbox/example/site.json')).toBe(true)
    expect(ignored('storage/sandbox/x/site.json')).toBe(true)
    expect(ignored('storage/dist/sandbox/x/draft/index.html')).toBe(true)
    expect(ignored('storage/references/foo.com/index/capture.json')).toBe(true)
  })

  it('test_UAT_FC_REQ-22_list_finds_sites_under_storage', () => {
    // cmdList scans the container dir (not a per-slug path) — the spot that
    // broke on first refactor. Create a site, list it, confirm it's found.
    const tmp = mkdtempSync(path.join(tmpdir(), 'req22-'))
    try {
      cmdNew('acme', { cwd: tmp })
      expect(JSON.stringify(cmdList({ cwd: tmp }))).toContain('acme')
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })
})
