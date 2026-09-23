import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServe, type ServeHandle } from '../tools/generate/src/cli'
import { MIRROR_DIR_REL } from '../tools/generate/src/fonts/mirror'

/**
 * [[REQ-312]] — the **capture fixture's** root answers for `_fonts/…`
 * (`COMMENT-3711`).
 *
 * THE FOURTH SNAPSHOT ROOT. A page's font `src` names no host, so the rendered
 * bytes ask for the face relative to wherever they are served — and `startServe`
 * is one of the places they are served: `1c shot`, `1c aligned-crops` and the
 * module-conformance harness all render to disk and then point a real browser at
 * this origin.
 *
 * THE FALSIFIER. Without this, every capture of a page using a platform font is
 * taken in a FALLBACK FACE while the page says otherwise — which makes the
 * fidelity surface, the one thing in this system whose whole job is to judge what
 * a page looks like, silently wrong on the axis it is most often asked about.
 *
 * THE BYTES COME OUT OF THE STAGED MIRROR AND NOT OUT OF THE RENDER OUTPUT, which
 * is the property that keeps one shared copy: nothing is copied into a site's
 * `dist` to make a capture work.
 */

let handle: ServeHandle
let dir: string

const FACE = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 42, 43, 44, 45])

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'req312-capture-'))
  const site = path.join(dir, 'storage', 'dist', 'sites', 'demo', 'draft')
  await mkdir(path.join(site, 'assets'), { recursive: true })
  await writeFile(path.join(site, 'index.html'), '<html>ROOT</html>')
  await writeFile(path.join(site, 'assets', 'logo.svg'), '<svg/>')

  // The staged mirror, exactly where `1c fonts mirror` writes it: a workspace-level
  // directory, deliberately outside every site's own tree.
  const staged = path.join(dir, MIRROR_DIR_REL, 'headingfont')
  await mkdir(staged, { recursive: true })
  await writeFile(path.join(staged, 'HeadingFont-Regular.woff2'), FACE)
  await writeFile(path.join(staged, 'OFL.txt'), 'SIL OPEN FONT LICENSE Version 1.1\n')

  handle = await startServe('demo', { cwd: dir, source: 'draft' })
})

afterAll(async () => {
  await new Promise<void>((res) => handle.server.close(() => res()))
  await rm(dir, { recursive: true, force: true })
})

describe('REQ-312 — the capture fixture serves platform fonts at its own root', () => {
  it('test_UAT_FC_REQ-312_the_capture_root_serves_the_staged_face', async () => {
    const res = await fetch(new URL('/_fonts/headingfont/HeadingFont-Regular.woff2', handle.url))
    expect(res.status).toBe(200)
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(FACE)
    expect(res.headers.get('content-type')).toBe('font/woff2')

    // The licence notice travels with the bytes here too.
    const licence = await fetch(new URL('/_fonts/headingfont/OFL.txt', handle.url))
    expect(licence.status).toBe(200)
    expect(await licence.text()).toContain('SIL OPEN FONT LICENSE')
  })

  it('test_UAT_FC_REQ-312_the_capture_root_refuses_what_the_mirror_does_not_hold', async () => {
    // An unpopulated or incomplete mirror 404s rather than resolving somewhere —
    // the same absence `1c fonts check` reports as NOT POPULATED.
    const missing = await fetch(new URL('/_fonts/absentface/Absent-Regular.woff2', handle.url))
    expect(missing.status).toBe(404)

    // Confinement is not left to the URL parser alone: a path that escapes the
    // mirror directory is refused even though nothing under it would be a font.
    const escape = await fetch(new URL('/_fonts/..%2F..%2Fstorage/dist/sites/demo/draft/index.html', handle.url))
    expect(escape.status).toBe(404)

    // AND THE SITE'S OWN TREE IS UNTOUCHED BY THE INTERCEPTION.
    const page = await fetch(new URL('/', handle.url))
    expect(page.status).toBe(200)
    expect(await page.text()).toContain('ROOT')
  })
})
