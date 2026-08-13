// @vitest-environment jsdom
/**
 * BUG-34 — **a run whose colour lives in its own background**.
 *
 * `gradientFill` is compiled the way browsers require: the glyphs are painted by
 * the element's OWN `background-image`, clipped to the text, with a transparent
 * fill colour. The copy modal reads presentation off the live element (REQ-121)
 * and reproduced the two halves of that technique separately — the colour, which
 * computes `rgba(0, 0, 0, 0)`, and the backdrop, which by definition starts one
 * element PAST the run. Only the invisible half survived, so the editing box for
 * `gigabytealchemy/home`'s wordmark opened empty: the operator was typing into
 * words that were not being drawn.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern REQ-121/138
 * established: the page is the bytes `1c render --edit` wrote, the declarations
 * under test are the renderer's own (nothing here hand-writes `background-clip`),
 * the bridge is the one the browser runs and the dialog is the real one, opened
 * by clicking the words.
 *
 * WHAT THE HEADLESS RUN CANNOT SEE. jsdom resolves the cascade — which is what
 * makes the read under test measurable — but it does not resolve `var()` in
 * `getComputedStyle`, so the last hop (the box's custom properties reaching the
 * control that draws the glyphs) is asserted against `builder.css` itself rather
 * than a computed value. Called out rather than quietly skipped.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender, startBuilder, type BuilderHandle } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import {
  formatL1Path,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

/** The wordmark: painted by a gradient clipped to its glyphs, as on the real site. */
const WORDMARK = 'Gigabyte Alchemy'
/** An ordinary run beside it — the control for "nothing else changed". */
const BODY = 'Ordinary copy, painted by its own colour.'
/** A run the author has made fully transparent, with no glyph fill behind it. */
const GHOST = 'Copy nobody can see.'

const BODY_COLOR = '#f8f5ef'
const BAND_FILL = '#101822'
const GRADIENT_FROM = '#f5e6a3'
const GRADIENT_TO = '#ff6b35'

/**
 * Three runs on one painted band, differing only in how their glyphs get paint.
 *
 * The band matters: it is what the backdrop read finds, and it is what the box
 * showed instead of the wordmark before this fix — a dark surface with nothing
 * on it, which is a perfectly faithful reproduction of everything except the
 * words.
 */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8')) as Record<string, unknown>
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    axes: { surfaceFill: BAND_FILL },
    children: [
      {
        kind: 'text',
        text: WORDMARK,
        axes: {
          fontSizePx: 72,
          fontWeight: 600,
          color: BODY_COLOR,
          gradientFill: {
            angleDeg: 90,
            stops: [
              { color: GRADIENT_FROM, position: 0 },
              { color: GRADIENT_TO, position: 100 },
            ],
          },
        },
      },
      { kind: 'text', text: BODY, axes: { fontSizePx: 16, color: BODY_COLOR } },
      { kind: 'text', text: GHOST, axes: { fontSizePx: 16, color: '#00000000' } },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

describe.skipIf(!WEBUI_INSTALLED)(`BUG-34 — the glyphs' own paint (${WEBUI_SKIP_REASON})`, () => {
  let cwd: string
  let html: string
  let pageId: string
  let builder: BuilderHandle
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
  let editor: { destroy(): void } | undefined
  let restoreFetch: (() => void) | undefined

  beforeAll(async () => {
    ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'bug34-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
    builder = await startBuilder({ cwd })
  }, 240000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  beforeEach(() => {
    document.body.replaceChildren()
    const real = globalThis.fetch
    const origin = builder.url
    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) =>
      real(typeof input === 'string' ? new URL(input, origin) : input, init)) as typeof fetch
    restoreFetch = () => {
      globalThis.fetch = real
    }
  })

  afterEach(() => {
    editor?.destroy()
    editor = undefined
    for (const m of document.querySelectorAll('.builder-modal')) m.remove()
    restoreFetch?.()
  })

  const modals = () => [...document.querySelectorAll('.builder-modal')]

  async function settle(): Promise<void> {
    for (let i = 0; i < 400 && modals().length === 0; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  /** Open the dialog the way the operator does: by clicking the words. */
  async function openOn(copy: string): Promise<HTMLElement> {
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
    editor = mountEditor(document, {
      slug: 'acme',
      bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
    })
    const el = [...document.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === copy,
    )
    if (!el) throw new Error(`no element renders the copy ${JSON.stringify(copy)}`)
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle()
    expect(modals()).toHaveLength(1)
    return modals()[0].querySelector('.builder-modal__box') as HTMLElement
  }

  const varOf = (box: HTMLElement, name: string) => box.style.getPropertyValue(name).trim()

  // The defect itself: the box must carry the paint that actually draws the
  // glyphs, and must NOT carry the transparent colour that was standing in for it.
  it('test_UAT_FC_BUG-34_a_gradient_wordmark_previews_with_its_glyph_paint', async () => {
    const box = await openOn(WORDMARK)

    // Read off the RENDER, not written by this test: the renderer chose the
    // gradient's syntax, the clip and the transparent fill.
    const image = varOf(box, '--preview-text-image')
    expect(image).toContain('linear-gradient')
    expect(image).toContain(GRADIENT_FROM)
    expect(image).toContain(GRADIENT_TO)
    expect(varOf(box, '--preview-text-clip')).toBe('text')
    expect(varOf(box, '--preview-text-fill')).toBe('transparent')

    // And the half that made the box empty. A transparent foreground is not a
    // foreground; withholding it leaves `--fields-fg` on the chrome's own colour.
    expect(varOf(box, '--preview-color')).toBe('')

    // The backdrop is still the band behind the copy — the element's own
    // background is glyph paint and must not be mistaken for a surface.
    expect(varOf(box, '--preview-background')).toBe('rgb(16, 24, 34)')
  })

  // The last hop, which jsdom cannot compute: `background-image` does not
  // inherit, so the paint has to land on the element that DRAWS the words.
  it('test_UAT_FC_BUG-34_the_control_draws_the_glyph_paint_not_the_box', () => {
    const css = fs.readFileSync('apps/control-app/src/builder/builder.css', 'utf8')
    const rule = /\.builder-modal__box \.fields-control \{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule).toContain('background-image: var(--preview-text-image, none)')
    expect(rule).toContain('background-clip: var(--preview-text-clip, border-box)')
    expect(rule).toContain('-webkit-text-fill-color: var(--preview-text-fill, currentColor)')
    // Every fallback is the property's INITIAL value, which is what makes a run
    // with no glyph fill compute exactly what it computed before.
    expect(rule).not.toMatch(/var\(--preview-text-[a-z]+\)/)
  })

  // The regression guard: one run in `storage/` carries a glyph gradient and
  // every other run must be able to prove it was left alone.
  it('test_UAT_FC_BUG-34_an_ordinary_run_is_untouched', async () => {
    const box = await openOn(BODY)
    expect(varOf(box, '--preview-color')).toBe('rgb(248, 245, 239)')
    expect(varOf(box, '--preview-text-image')).toBe('')
    expect(varOf(box, '--preview-text-clip')).toBe('')
    expect(varOf(box, '--preview-text-fill')).toBe('')
  })

  // The backstop, which is deliberately not about gradients: ANY route to a
  // foreground that paints nothing must fall back to a legible one rather than
  // reproducing invisibility faithfully.
  it('test_UAT_FC_BUG-34_a_foreground_that_paints_nothing_falls_back', async () => {
    const box = await openOn(GHOST)
    expect(varOf(box, '--preview-color')).toBe('')
    expect(varOf(box, '--preview-text-image')).toBe('')
  })
})
