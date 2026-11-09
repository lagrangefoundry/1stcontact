/**
 * STORY-aacb7060 (site-asset promotion), BUG-84 — `1c push` refuses a draft
 * whose assets are byte-identical to a capture-mirrored subresource.
 *
 * Driven through the real `1c` entry point (`run(['push', ...])`) in a scratch
 * working directory, so the operator's reference store is the production
 * filesystem adapter over `storage/references/` and the draft is the production
 * filesystem site store. Only the network is replaced: `fetch` is a recording
 * tripwire standing in for the builder's import route.
 */
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cmdNew, run } from '../tools/generate/src/cli'

/** The mirrored photograph, as the capture holds it. */
const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8])
/** A mirrored third-party stylesheet. */
const CSS = new TextEncoder().encode('.third-party{color:#123456}\n')
/** The capture's own rendered page — a bundle member OUTSIDE `assets/`. */
const RENDERED = new TextEncoder().encode('<html><body>captured</body></html>')
/** A file of the client's own, byte-different from anything captured. */
const OWN = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 9, 9, 9])

const BUNDLE = 'thirdparty.example/index'
const ORIGIN = 'http://127.0.0.1:9'
const LANDED = '{"pages":1,"assets":1,"siteJson":true}'

let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac2588-'))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  rmSync(cwd, { recursive: true, force: true })
})

/** A `fetch` that records every request and answers as a landed import. */
function recordingFetch() {
  const calls: string[] = []
  const impl = ((url: string) => {
    calls.push(url)
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(LANDED),
    })
  }) as unknown as typeof fetch
  return { impl, calls }
}

/** Write one capture bundle into `<dir>/storage/references/`. */
function captureInto(dir: string, members: Record<string, Uint8Array>): void {
  const bundleDir = path.join(dir, 'storage', 'references', ...BUNDLE.split('/'))
  for (const [member, bytes] of Object.entries(members)) {
    const file = path.join(bundleDir, ...member.split('/'))
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, bytes)
  }
}

/** Replace the draft's assets with exactly `assets`. */
function draftAssets(dir: string, slug: string, assets: Record<string, Uint8Array>): void {
  const assetsDir = path.join(dir, 'storage', 'sites', slug, 'draft', 'assets')
  mkdirSync(assetsDir, { recursive: true })
  for (const name of readdirSync(assetsDir)) rmSync(path.join(assetsDir, name), { force: true })
  for (const [name, bytes] of Object.entries(assets)) writeFileSync(path.join(assetsDir, name), bytes)
}

/** `1c push` exactly as a shell runs it; resolves to the thrown error, if any. */
async function push(dir: string, ...argv: string[]): Promise<unknown> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  process.chdir(dir)
  console.log = () => {}
  vi.stubEnv('CF_ACCESS_CLIENT_ID', '')
  vi.stubEnv('CF_ACCESS_CLIENT_SECRET', '')
  try {
    await run(['push', ...argv, '--origin', ORIGIN])
    return undefined
  } catch (err) {
    return err
  } finally {
    console.log = prevLog
    process.chdir(prevCwd)
  }
}

it('test_UAT_AC2588_1c_push_refuses_capture_mirrored_bytes_before_upload_naming_the_asset_and_source_with_no_override', async () => {
  captureInto(cwd, {
    'capture.json': new TextEncoder().encode('{"host":"thirdparty.example"}'),
    'rendered.html': RENDERED,
    'assets/AlchemistLab.jpg': PHOTO,
    'assets/site.css': CSS,
  })
  cmdNew('acme', { cwd })

  // ── Same bytes under a DIFFERENT name: refused, named, nothing uploaded. ──
  draftAssets(cwd, 'acme', { 'banner.jpg': PHOTO })
  const renamed = recordingFetch()
  vi.stubGlobal('fetch', renamed.impl)
  const refused = await push(cwd, 'acme')
  expect(refused, 'a draft carrying mirrored bytes was pushed').toBeInstanceOf(Error)
  const message = (refused as Error).message
  expect(message).toContain('banner.jpg')
  expect(message).toContain(BUNDLE)
  expect(message).toContain('assets/AlchemistLab.jpg')
  expect(message).toContain('mirrored from a captured page')
  expect(message).toContain('cannot go on a site')
  expect(renamed.calls, 'an import request reached the builder for a refused draft').toEqual([])

  // ── --force does not get past it. ──
  const forced = recordingFetch()
  vi.stubGlobal('fetch', forced.impl)
  const forcedErr = await push(cwd, 'acme', '--force')
  expect(forcedErr).toBeInstanceOf(Error)
  expect((forcedErr as Error).message).toContain('banner.jpg')
  expect((forcedErr as Error).message).toContain('assets/AlchemistLab.jpg')
  expect(forced.calls).toEqual([])

  // ── A non-image mirrored member (a stylesheet) is refused the same way. ──
  draftAssets(cwd, 'acme', { 'theme.css': CSS })
  const stylesheet = recordingFetch()
  vi.stubGlobal('fetch', stylesheet.impl)
  const cssErr = await push(cwd, 'acme')
  expect(cssErr).toBeInstanceOf(Error)
  expect((cssErr as Error).message).toContain('theme.css')
  expect((cssErr as Error).message).toContain('assets/site.css')
  expect(stylesheet.calls).toEqual([])

  // ── Different bytes under the captured file's own name: not refused. ──
  draftAssets(cwd, 'acme', { 'AlchemistLab.jpg': OWN })
  const collision = recordingFetch()
  vi.stubGlobal('fetch', collision.impl)
  expect(await push(cwd, 'acme'), 'a name match was treated as a byte match').toBeUndefined()
  expect(collision.calls).toHaveLength(1)

  // ── A member OUTSIDE `assets/` (the rendered page) is not matched. ──
  draftAssets(cwd, 'acme', { 'page.html': RENDERED })
  const outside = recordingFetch()
  vi.stubGlobal('fetch', outside.impl)
  expect(await push(cwd, 'acme')).toBeUndefined()
  expect(outside.calls).toHaveLength(1)

  // ── A draft with no assets pushes as before. ──
  draftAssets(cwd, 'acme', {})
  const empty = recordingFetch()
  vi.stubGlobal('fetch', empty.impl)
  expect(await push(cwd, 'acme')).toBeUndefined()
  expect(empty.calls).toHaveLength(1)

  // ── An operator with no capture bundles pushes the same bytes as before. ──
  const bare = mkdtempSync(path.join(tmpdir(), 'ac2588-bare-'))
  try {
    cmdNew('acme', { cwd: bare })
    draftAssets(bare, 'acme', { 'banner.jpg': PHOTO })
    const noCaptures = recordingFetch()
    vi.stubGlobal('fetch', noCaptures.impl)
    expect(await push(bare, 'acme')).toBeUndefined()
    expect(noCaptures.calls).toHaveLength(1)
  } finally {
    rmSync(bare, { recursive: true, force: true })
  }
})
