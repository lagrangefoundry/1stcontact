import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { siteDir, distDir } from '../tools/generate/src/store/paths'
import { bundleDirFor } from '../tools/generate/src/cli/capture/bundle'
import { cmdNew, cmdList } from '../tools/generate/src/cli/commands'

/**
 * UATs for REQ-22 — all four site-data trees consolidated under `storage/`
 * (sites tracked; sandbox/dist/references gitignored). Pure path-builder checks
 * plus a `git check-ignore` assertion against the repo's real `.gitignore`.
 */
describe('storage/ layout (REQ-22)', () => {
  const cwd = '/repo'

  it('test_UAT_FC_REQ-22_new_and_render_use_storage', () => {
    expect(siteDir({ cwd, root: 'sites' }, 'acme')).toBe(
      path.join('/repo', 'storage', 'sites', 'acme'),
    )
    expect(siteDir({ cwd, root: 'sandbox' }, 'acme')).toBe(
      path.join('/repo', 'storage', 'sandbox', 'acme'),
    )
    expect(distDir({ cwd, root: 'sites' }, 'acme', 'draft')).toBe(
      path.join('/repo', 'storage', 'dist', 'sites', 'acme', 'draft'),
    )
  })

  it('test_UAT_FC_REQ-22_capture_writes_under_storage', () => {
    expect(bundleDirFor(cwd, { host: 'faelan.com', path: '/' })).toBe(
      path.join('/repo', 'storage', 'references', 'faelan.com', 'index'),
    )
  })

  it('test_UAT_FC_REQ-22_gitignore_tracks_sites_ignores_rest', () => {
    const ignored = (rel: string): boolean => {
      try {
        execFileSync('git', ['check-ignore', '-q', rel])
        return true
      } catch {
        return false
      }
    }
    expect(ignored('storage/sites/1stcontact/site.json')).toBe(false)
    expect(ignored('storage/sandbox/x/site.json')).toBe(true)
    expect(ignored('storage/dist/sites/x/draft/index.html')).toBe(true)
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
