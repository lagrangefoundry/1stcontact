// @vitest-environment jsdom
/**
 * REQ-117 — a stale edit render must say so (DOC-28 §11).
 *
 * An L1 address is only half a coordinate: `0.1.0` means nothing without the
 * page it indexes into. The renderer supplies the other half by stamping
 * `data-fc-page` on `<body>`, and the client reads it back — so a render built
 * before that stamp existed produces a document that looks editable (segments
 * outlined, marker present) but resolves to nothing.
 *
 * Both halves of that contract are measured here:
 *
 *  - the renderer stamps a page id, and stamps it under a real attribute NAME.
 *    The observed failure was `undefined="home"` — an incomplete export chain
 *    interpolated into the attribute *name* position, which is silently valid
 *    HTML and therefore invisible to every assertion that only greps for a
 *    value;
 *  - the client refuses to post an address it cannot resolve, and names the
 *    re-render. Posting `page: null` instead gets a truthful but useless reply
 *    ("Page 'null' not found — list pages with '1c page list'"), which sends
 *    the reader hunting for a page that was never the problem.
 *
 * The stale document under test is a REAL edit render with the stamp stripped,
 * not a hand-written fixture — the artifact that produced the bug, reproduced.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import { formatL1Path, L1_EDIT_PAGE_ATTR } from '../packages/site-schema/src/l1/edit'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

if (!WEBUI_INSTALLED) console.warn(`REQ-117 stale-render suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-117 stale edit render', () => {
  let cwd: string
  let html: string

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req117-stale-'))
    cmdNew('alpha', { cwd })
    const { outDir } = await cmdRender('alpha', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
  }, 180000)

  afterAll(() => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-117_edit_render_stamps_a_resolvable_page_id', () => {
    const body = /<body([^>]*)>/.exec(html)![1]

    // The value, and — the part the bug turned on — the NAME it is bound to.
    expect(body).toMatch(/\sdata-fc-page="[^"]+"/)
    expect(body).not.toMatch(/\bundefined\s*=/)

    // And the id names a page that actually exists, so the client's half of the
    // coordinate resolves rather than merely being non-empty.
    const pageId = /data-fc-page="([^"]+)"/.exec(body)![1]
    expect(fs.existsSync(path.join(cwd, 'storage/sites/alpha/draft/pages', `${pageId}.json`))).toBe(
      true,
    )
  })

  it('test_UAT_FC_REQ-117_stale_render_names_the_re_render_and_posts_nothing', async () => {
    // The stale artifact: a real edit render, stamp removed. Everything else —
    // the marker, the outlines, every segment address — is untouched, which is
    // exactly why the document looks editable.
    const stale = html.replace(/\sdata-fc-page="[^"]*"/, '')
    expect(stale).toContain('data-fc-edit')
    expect(stale).not.toContain('data-fc-page')

    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(stale)![1]
    // `documentElement.innerHTML` does not carry the parsed `<body>` attributes,
    // so restore the marker the bridge gates on — without the page stamp.
    document.body.setAttribute('data-fc-edit', '')

    const { mountEditor } = await import('../apps/control-app/src/builder/editor.js')

    const modals: { kind: string; message?: string; hint?: string }[] = []
    let posted = 0
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (...args: unknown[]) => {
      posted += 1
      return realFetch(...(args as Parameters<typeof fetch>))
    }) as typeof fetch

    try {
      const editor = mountEditor(document, {
        slug: 'alpha',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
        openModal: (spec: { kind: string; message?: string; hint?: string }) => modals.push(spec),
      })

      const segment = document.querySelector('[data-l1-segment="copy"]') as HTMLElement
      expect(segment, 'the stale render still carries copy segments').toBeTruthy()
      segment.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await new Promise((r) => setTimeout(r, 0))

      editor.destroy()
    } finally {
      globalThis.fetch = realFetch
    }

    expect(modals).toHaveLength(1)
    expect(modals[0].kind).toBe('error')
    // The actionable part: which command, on which site.
    expect(`${modals[0].message} ${modals[0].hint}`).toContain("1c render alpha --edit")

    // Nothing was asked of the origin — an unresolvable address is refused
    // before it can come back as a misleading "page not found".
    expect(posted).toBe(0)
  })
})
