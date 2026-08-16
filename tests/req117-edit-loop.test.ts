/**
 * REQ-117 — the edit loop, end to end (DOC-28 §4, §11).
 *
 * These drive the loop through the SAME origin the browser talks to, so what is
 * asserted is the thing that ships: the copy API is a thin transport over
 * `editCopyGet`/`editCopySet` — the identical functions `1c copy get|set`
 * dispatch to — and the editor is therefore a second *producer* of structured
 * edits rather than a second write path (DOC-8 §7).
 *
 * The browser half (click → hover → modal → Save → refresh) is measured in
 * `tests/req117-edit-loop-browser.test.ts`, which needs a real layout engine.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  cmdNew,
  cmdRender,
  editCopyGet,
  startBuilder,
  type BuilderHandle,
} from '../tools/generate/src/cli'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { fsOpts } from './support/site-factory'

const REPO = path.resolve(__dirname, '..')

if (!WEBUI_INSTALLED) console.warn(`REQ-117 loop suites skipped: ${WEBUI_SKIP_REASON}`)

/** The first copy segment in a freshly scaffolded site, read off the edit render. */
function firstCopyAddress(html: string): string {
  const m = /data-l1-path="([^"]+)"[^>]*data-l1-segment="copy"/.exec(html)
  if (!m) throw new Error('no copy segment in the edit render')
  return m[1]
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-117 edit loop over the builder origin', () => {
  let cwd: string
  let builder: BuilderHandle
  let addr: string
  let pageId: string

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req117-loop-'))
    cmdNew('alpha', { cwd })
    const { outDir } = await cmdRender('alpha', { cwd, edit: true })
    const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    addr = firstCopyAddress(html)
    pageId = /data-fc-page="([^"]+)"/.exec(html)![1]
    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
  }, 180000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  const get = (p: string) => fetch(new URL(p, builder.url))
  const post = (body: unknown) =>
    fetch(new URL('/api/copy', builder.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('test_UAT_FC_REQ-117_edit_render_stamps_the_page_its_address_belongs_to', async () => {
    // AC1 — an address is only half a coordinate. `index.html` is an ALIAS for
    // the home page, so the file name is NOT the page id; without the stamp the
    // client would have to re-derive the renderer's home-page rule.
    const res = await get(`/preview/alpha/edit/`)
    const html = await res.text()
    const stamped = /data-fc-page="([^"]+)"/.exec(html)![1]
    expect(stamped).toBe(pageId)

    // ...and it addresses a real node, which is the only thing that makes it
    // useful. Resolved through the definition, not the markup.
    await expect(editCopyGet('alpha', stamped, addr, fsOpts(cwd))).resolves.toBeTruthy()
  })

  it('test_UAT_FC_REQ-117_modal_reads_its_descriptors_from_the_segment', async () => {
    // AC2 — the ticket's job is to DERIVE descriptors from a segment, not to
    // build forms. Assert the derivation, in the shape `mountFields` consumes.
    const res = await get(`/api/copy?slug=alpha&page=${pageId}&path=${addr}`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      kind: string
      fields: Array<{ name: string; type: string }>
      values: Record<string, string>
    }
    expect(body.kind).toBe('text')
    expect(body.fields.map((f) => f.name)).toContain('text')
    // Every descriptor must carry the one key `mountFields` refuses to default.
    for (const f of body.fields) expect(typeof f.name).toBe('string')
    expect(typeof body.values.text).toBe('string')
  })

  it('test_UAT_FC_REQ-117_one_save_writes_the_draft_and_rerenders', async () => {
    // AC3 — a valid change map lands in the draft AND the rendered bytes, in one
    // call. The re-render is what lets the host merely refresh the iframe; if it
    // did not happen here the user would save and see no change.
    const res = await post({ slug: 'alpha', page: pageId, path: addr, values: { text: 'Hello loop' } })
    expect(res.status).toBe(200)

    expect((await editCopyGet('alpha', pageId, addr, fsOpts(cwd))).data).toMatchObject({
      values: { text: 'Hello loop' },
    })
    const html = await (await get('/preview/alpha/edit/')).text()
    expect(html).toContain('Hello loop')
  })

  it('test_UAT_FC_REQ-117_invalid_never_lands_and_says_why', async () => {
    // AC4 — the refusal is the user's mistake, not a server fault, so it comes
    // back as a 400 carrying the validator's own message. A 500 would tell the
    // modal "the builder broke" and throw away the text that names the field.
    const before = (await editCopyGet('alpha', pageId, addr, fsOpts(cwd))).data as { values: unknown }

    const res = await post({ slug: 'alpha', page: pageId, path: addr, values: { nope: 'x' } })
    expect(res.status).toBe(400)
    const err = (await res.json()) as { code: string; message: string; hint?: string }
    expect(err.code).toBe('SCHEMA_INVALID')
    expect(err.message).toMatch(/nope/)

    // Byte-unchanged: the iframe the user is looking at is still accurate, which
    // is what makes "surface the error and keep the modal open" safe.
    expect(((await editCopyGet('alpha', pageId, addr, fsOpts(cwd))).data as { values: unknown }).values).toEqual(
      before.values,
    )
  })

  it('test_UAT_FC_REQ-117_a_malformed_address_is_refused_not_resolved', async () => {
    // The client reads addresses off the DOM, so they are untrusted input. The
    // comma-joined form is the specific mistake a bare `String(path)` makes on
    // the parsed index array — it must fail closed rather than resolve to some
    // neighbouring node.
    const res = await post({ slug: 'alpha', page: pageId, path: '0,0,0', values: { text: 'x' } })
    expect(res.status).toBe(400)
    expect((await res.json()).message).toMatch(/not a segment address/)
  })

  it('test_UAT_FC_REQ-117_the_bridge_reaches_the_browser_as_one_implementation', async () => {
    // The bridge is TypeScript beside the renderer because stamp-and-read are
    // one contract. It must reach the browser as THAT source, type-stripped —
    // a hand-written second copy in the client would be free to drift from the
    // markup it reads. Assert both halves are served as runnable ES modules
    // with the package import rewritten to a URL a browser can fetch.
    const bridge = await (await get('/framework/edit-client.js')).text()
    expect(bridge).toContain('export function mountL1EditBridge')
    expect(bridge).not.toMatch(/@1stcontact\/site-schema/)
    expect(bridge).toContain('/framework/site-schema-edit.js')
    // Type-stripped, so no TS-only syntax survives to reach the parser.
    expect(bridge).not.toMatch(/\binterface\s+L1EditHit\b/)

    const schema = await (await get('/framework/site-schema-edit.js')).text()
    expect(schema).toContain('export function parseL1Path')
    expect(schema).toContain('export function formatL1Path')
  })

  it('test_UAT_FC_REQ-117_one_save_rerenders_the_view_channel_too', async () => {
    // An edit changes the PAGE, not one rendering of it. Re-rendering only the
    // edit channel left View — the mode you switch to in order to see the page
    // as a visitor would — showing whatever the last manual `1c render`
    // produced. Nothing signalled it: View looked like a working page, just an
    // old one, and it stayed old indefinitely.
    const res = await post({
      slug: 'alpha',
      page: pageId,
      path: addr,
      values: { text: 'Visible in view mode' },
    })
    expect(res.status).toBe(200)

    // Both channels, from one save. The edit channel is asserted alongside so a
    // fix that swapped which one gets re-rendered cannot pass.
    expect(await (await get('/preview/alpha/edit/')).text()).toContain('Visible in view mode')
    expect(await (await get('/preview/alpha/draft/')).text()).toContain('Visible in view mode')
  })

  it('test_UAT_FC_REQ-117_preview_bytes_are_never_served_from_cache', async () => {
    // The origin rewrites these bytes underneath the browser: a save re-renders
    // the very channel the iframe is displaying. With no freshness directive AND
    // no validator, the browser may serve a post-save reload from cache — the
    // edit is on disk and correct, and the screen shows the old page. There is
    // nothing to trade away on a dev origin serving live-rebuilt artifacts.
    // The shell and the client JS are on the list too: a stale tab running
    // yesterday's chrome against current assets produces a symptom that looks
    // like anything except caching, and one exempt response is enough to do it.
    for (const p of [
      '/',
      '/builder/editor.js',
      '/framework/edit-client.js',
      '/preview/alpha/edit/',
      '/preview/alpha/draft/',
    ]) {
      const res = await get(p)
      expect(res.status, p).toBe(200)
      expect(res.headers.get('cache-control'), p).toContain('no-store')
    }
  })
})
