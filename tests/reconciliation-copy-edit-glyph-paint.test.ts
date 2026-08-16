// @vitest-environment jsdom
/**
 * story-3bf94bd4 / **AC-1143** — the one background that is not a backdrop.
 *
 * A `gradientFill` run is compiled the way every browser requires: the glyphs are
 * painted by the element's OWN `background-image`, clipped to the text, with a
 * transparent fill colour. So the words ARE that background showing through their
 * own shape.
 *
 * The copy modal reads presentation off the live element, and it asks two
 * separate questions that a run of this kind answers on both sides. The backdrop
 * read (`paintedBehind`, AC-1040) deliberately begins ONE ELEMENT PAST the run,
 * because its question is what sits *behind* the copy — so the run's own
 * background is correctly not a backdrop. The colour read computes
 * `rgba(0, 0, 0, 0)`. Read separately the two halves are each individually
 * invisible, which is exactly what shipped: the box copied a transparent
 * foreground over a correct backdrop and drew nothing at all, and the operator
 * was typing into words that were not being painted.
 *
 * The criterion therefore names the clip as the condition that makes an element's
 * own background readable as GLYPH PAINT rather than as a surface, and requires
 * that paint to land on the element that DRAWS the words — not on the box around
 * them — for a mechanical reason: `background-image` does not inherit, and the
 * box's own background is the mirrored backdrop, which is a different thing.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT. The page is the bytes `1c render
 * --edit` wrote; the declarations under test are the renderer's own (nothing here
 * hand-writes `background-clip`); the bridge is the one the browser runs; the
 * dialog is the real one, opened by clicking the words.
 *
 * WHAT THE HEADLESS RUN CANNOT SEE. jsdom resolves the cascade — which is what
 * makes the read under test measurable — but it does not resolve `var()` in
 * `getComputedStyle`, so the last hop (the box's custom properties reaching the
 * control that draws the glyphs) is asserted against `builder.css` itself rather
 * than against a computed value. Called out rather than quietly skipped.
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

const BUILDER_CSS = 'apps/control-app/src/builder/builder.css'

/** The wordmark: painted by a gradient clipped to its glyphs, as on the real site. */
const WORDMARK = 'Gigabyte Alchemy'
/** An ordinary run beside it — the control for "a run with no such fill is unaffected". */
const BODY = 'Ordinary copy, painted by its own colour.'

const BODY_COLOR = '#f8f5ef'
const BAND_FILL = '#101822'
const GRADIENT_FROM = '#f5e6a3'
const GRADIENT_TO = '#ff6b35'

/**
 * Two runs on one painted band, differing only in how their glyphs get paint.
 *
 * The band matters: it is what the backdrop read finds, and it is what the box
 * showed INSTEAD of the wordmark before the fix — a dark surface with nothing on
 * it, which is a perfectly faithful reproduction of everything except the words.
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
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

describe.skipIf(!WEBUI_INSTALLED)(
  `AC-1143 — the glyphs' own paint${WEBUI_INSTALLED ? '' : ` (skipped: ${WEBUI_SKIP_REASON})`}`,
  () => {
    let cwd: string
    let html: string
    let pageId: string
    let builder: BuilderHandle
    let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
    let editor: { destroy(): void } | undefined
    let restoreFetch: (() => void) | undefined

    beforeAll(async () => {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
      cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ac1143-'))
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

    /** The element on the PAGE that renders a given run — the read's own subject. */
    const renders = (copy: string) =>
      [...document.querySelectorAll('*')].find(
        (n) => n.children.length === 0 && n.textContent === copy,
      ) as HTMLElement | undefined

    /**
     * Open the dialog the way the operator does: by clicking the words.
     *
     * Self-contained per call, so one test can open over several runs: the
     * previous editor is torn down and its modal removed before the page is laid
     * out again, which is what keeps the "exactly one modal" assertion honest.
     */
    async function openOn(copy: string): Promise<{ box: HTMLElement; source: HTMLElement }> {
      editor?.destroy()
      editor = undefined
      for (const m of modals()) m.remove()

      document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
      document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
      document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      })
      const el = renders(copy)
      if (!el) throw new Error(`no element renders the copy ${JSON.stringify(copy)}`)
      el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle()
      expect(modals()).toHaveLength(1)
      return { box: modals()[0].querySelector('.builder-modal__box') as HTMLElement, source: el }
    }

    const varOf = (box: HTMLElement, name: string) => box.style.getPropertyValue(name).trim()

    it(
      'test_UAT_AC1143_a_runs_own_background_previews_as_glyph_paint_drawn_on_the_words',
      async () => {
        // ── The gradient run ────────────────────────────────────────────────
        const wordmark = await openOn(WORDMARK)

        // READ OFF THE RENDERING, not written by this test. The renderer chose
        // the gradient's syntax, the clip and the transparent fill; the box
        // carries the page's own resolved value for the image, which is what
        // "in the syntax the page itself resolved them to" means. (A gradient
        // carries no relative address, so absolutising it is the identity —
        // the resolution against the painting document is exercised by the same
        // helper every other copied layer goes through.)
        const pageImage = window.getComputedStyle(wordmark.source).backgroundImage
        expect(pageImage).toContain('linear-gradient')
        const image = varOf(wordmark.box, '--preview-text-image')
        expect(image).toBe(pageImage)
        expect(image).toContain(GRADIENT_FROM)
        expect(image).toContain(GRADIENT_TO)

        // The clip is the CONDITION that makes the run's own background readable
        // as glyph paint rather than as a surface, and it is carried across as
        // its own property together with the transparent fill.
        expect(varOf(wordmark.box, '--preview-text-clip')).toBe('text')
        expect(varOf(wordmark.box, '--preview-text-fill')).toBe('transparent')

        // The half that made the box empty. A foreground that paints nothing is
        // not a foreground: withholding it leaves `--fields-fg` on the chrome's
        // own colour rather than reproducing invisible copy.
        expect(varOf(wordmark.box, '--preview-color')).toBe('')

        // And the backdrop is STILL the band behind the copy — the run's own
        // background was read as glyph paint and not mistaken for a surface.
        expect(varOf(wordmark.box, '--preview-background')).toBe('rgb(16, 24, 34)')

        // ── The ordinary run beside it ──────────────────────────────────────
        // Completely unaffected: its ordinary foreground is reproduced and not
        // one of the glyph-paint values is present at all.
        const ordinary = await openOn(BODY)
        expect(varOf(ordinary.box, '--preview-color')).toBe('rgb(248, 245, 239)')
        expect(varOf(ordinary.box, '--preview-text-image')).toBe('')
        expect(varOf(ordinary.box, '--preview-text-clip')).toBe('')
        expect(varOf(ordinary.box, '--preview-text-fill')).toBe('')

        // ── Consumed on the control, behind each property's initial value ────
        // The last hop, which jsdom cannot compute. `background-image` does not
        // inherit, so the paint has to land on the element that DRAWS the words.
        const css = fs.readFileSync(BUILDER_CSS, 'utf8')
        const control = /\.builder-modal__box \.fields-control \{([^}]*)\}/.exec(css)?.[1] ?? ''
        expect(control).toContain('background-image: var(--preview-text-image, none)')
        expect(control).toContain('background-clip: var(--preview-text-clip, border-box)')
        expect(control).toContain(
          '-webkit-text-fill-color: var(--preview-text-fill, currentColor)',
        )

        // Every fallback is the property's INITIAL value. That inertness is a
        // property of how the values are CONSUMED, not of a check performed per
        // run — which is what makes a run carrying none of them compute exactly
        // what it computed before these declarations existed.
        expect(control).not.toMatch(/var\(--preview-text-(image|clip|fill)\)/)

        // NOT ON THE BOX. The box's own background is the mirrored backdrop —
        // putting the glyph paint there would fill the box's rectangle and still
        // leave the words unpainted.
        const boxRule = /\.builder-modal__box \{([^}]*)\}/.exec(css)?.[1] ?? ''
        expect(boxRule).toContain('background: var(--preview-background, var(--shell-bg))')
        expect(boxRule).not.toContain('--preview-text-image')
        expect(boxRule).not.toContain('--preview-text-clip')
        expect(boxRule).not.toContain('--preview-text-fill')
      },
      240000,
    )
  },
)
