import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServe, type ServeHandle } from '../tools/generate/src/cli'

/**
 * REQ-113 — `1c serve` must resolve extensionless URLs to the sibling `.html`.
 *
 * A page authored as slug `whitepapers` renders to `whitepapers.html`. Cloudflare
 * Pages — the deployment target — serves that at `/whitepapers`, but the preview
 * server required an exact path match, so the clean URL 404'd locally while working
 * in production. The author then bakes `.html` into the site to make the preview
 * work, which is the wrong fix to the wrong environment (CHAT-12).
 *
 * These UATs drive the real server over loopback rather than unit-testing a path
 * helper: the defect was in request resolution, and the contract that matters is
 * the status code and bytes a browser actually receives.
 */

let handle: ServeHandle
let dir: string

beforeAll(async () => {
  // A minimal rendered snapshot: root index, a flat page, a nested dir with its
  // own index, and an asset. This is the shape `renderSite` emits.
  dir = await mkdtemp(path.join(tmpdir(), 'req113-'))
  const site = path.join(dir, 'storage', 'dist', 'sites', 'demo', 'draft')
  await mkdir(path.join(site, 'assets'), { recursive: true })
  await mkdir(path.join(site, 'guides'), { recursive: true })
  await writeFile(path.join(site, 'index.html'), '<html>ROOT</html>')
  await writeFile(path.join(site, 'whitepapers.html'), '<html>PAPERS</html>')
  await writeFile(path.join(site, 'guides', 'index.html'), '<html>GUIDES</html>')
  await writeFile(path.join(site, 'assets', 'logo.svg'), '<svg/>')
  handle = await startServe('demo', { cwd: dir, source: 'draft' })
})

afterAll(async () => {
  await new Promise<void>((res) => handle.server.close(() => res()))
  await rm(dir, { recursive: true, force: true })
})

const get = async (p: string): Promise<{ status: number; body: string; type: string }> => {
  const r = await fetch(new URL(p, handle.url))
  return { status: r.status, body: await r.text(), type: r.headers.get('content-type') ?? '' }
}

describe('REQ-113 — extensionless URL resolution in 1c serve', () => {
  // AC1 — the defect itself.
  it('test_UAT_FC_REQ113_extensionless_path_resolves_to_sibling_html', async () => {
    const r = await get('/whitepapers')
    expect(r.status).toBe(200)
    expect(r.body).toContain('PAPERS')
    expect(r.type).toContain('text/html')
  })

  // AC2 — every previously-working shape keeps working. Parameterised because the
  // regression risk here is entirely about what the fallback might displace.
  it('test_UAT_FC_REQ113_existing_resolution_unaffected', async () => {
    const cases: { label: string; url: string; expect: string }[] = [
      { label: 'explicit .html still served directly', url: '/whitepapers.html', expect: 'PAPERS' },
      { label: 'root resolves to index.html', url: '/', expect: 'ROOT' },
      { label: 'trailing-slash dir resolves to its index', url: '/guides/', expect: 'GUIDES' },
      { label: 'bare dir resolves to its index, not guides.html', url: '/guides', expect: 'GUIDES' },
      { label: 'asset with extension served as-is', url: '/assets/logo.svg', expect: '<svg/>' },
    ]
    for (const c of cases) {
      const r = await get(c.url)
      expect(r.status, c.label).toBe(200)
      expect(r.body, c.label).toContain(c.expect)
    }
  })

  // AC3 — the fallback must not turn a missing asset into a silent HTML 200, and
  // must not invent a page that does not exist.
  it('test_UAT_FC_REQ113_no_fallback_for_extensions_or_missing_pages', async () => {
    const cases: { label: string; url: string }[] = [
      { label: 'missing extensionless page still 404s', url: '/nope' },
      { label: 'missing asset does not fall back to html', url: '/assets/missing.svg' },
      { label: 'missing nested page still 404s', url: '/guides/missing' },
    ]
    for (const c of cases) {
      expect((await get(c.url)).status, c.label).toBe(404)
    }
  })

  // AC4 — confinement is unchanged; the fallback is applied to the already-confined
  // absolute path, so it cannot be used to reach a .html file outside the root.
  it('test_UAT_FC_REQ113_traversal_still_rejected', async () => {
    await writeFile(path.join(dir, 'secret.html'), '<html>SECRET</html>')
    for (const url of ['/../secret', '/../secret.html', '/guides/../../secret']) {
      const r = await get(url)
      expect(r.body, url).not.toContain('SECRET')
      expect([403, 404], url).toContain(r.status)
    }
  })
})
