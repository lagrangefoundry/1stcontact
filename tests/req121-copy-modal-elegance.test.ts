// @vitest-environment jsdom
/**
 * REQ-121 — the copy-edit modal, made elegant.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT, on the pattern
 * `reconciliation-copy-edit-gesture-modal.test.ts` established: the document is
 * the bytes `1c render --edit` wrote, the bridge is the one the browser runs,
 * the form is the installed `webui-fields` component, and the reads go over
 * HTTP to a real builder origin. `defaultModal` is driven directly — an injected
 * double would be a test of the double, and every criterion here is about what
 * the real dialog builds.
 *
 * WHAT THE HEADLESS RUN GENUINELY CANNOT SEE. jsdom computes the cascade
 * (families, sizes, colours and backgrounds all resolve from the render's own
 * stylesheet — this suite depends on that and asserts against it) but it lays
 * nothing out, so every `getBoundingClientRect()` is zero. The mirrored
 * background's *offset* is therefore unverifiable here and is asserted only as
 * far as "the layer exists, carrying the ancestor's paint". It is called out
 * rather than quietly skipped.
 *
 * The webui components come from an out-of-band install nothing in this repo's
 * manifests records, so an absent install skips loudly (see `support/`).
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
  L1_EDIT_SEGMENT_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const HEADLINE = 'A painted band.'

/** The page's own presentation of that headline — what the box must reproduce. */
const PAGE_FAMILY = 'Editorial'
const PAGE_SIZE_PX = 56
const PAGE_COLOR = '#f8f5ef'
/** The painted container behind it. Nothing between the two paints anything. */
const BAND_FILL = '#101822'
/** The face the document binds `Editorial` to — the `@font-face` to be copied. */
const FONT_SRC = 'assets/editorial.woff2'

if (!WEBUI_INSTALLED) console.warn(`REQ-121 modal suite: ${WEBUI_SKIP_REASON}`)

/**
 * A headline on a painted band, in a bound face, at display size.
 *
 * Every value is chosen to be one the box has to *transform or resolve* rather
 * than pass through: the size is far outside the editing range, the colour is
 * carried by the run while the background is carried by an ancestor two levels
 * up, and the family resolves only through a document-level resource entry.
 */
function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(fs.readFileSync(homePath, 'utf8')) as Record<string, unknown>
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      {
        kind: 'container',
        layout: 'stack',
        axes: { surfaceFill: BAND_FILL },
        children: [
          {
            kind: 'text',
            text: HEADLINE, // [0.0.0]
            axes: {
              fontSizePx: PAGE_SIZE_PX,
              fontFamily: PAGE_FAMILY,
              fontWeight: 700,
              color: PAGE_COLOR,
            },
          },
        ],
      },
      // Editable since REQ-118, and the contrast for the preview criterion: an
      // image's fields are metadata about the page, not words on it.
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
    ],
  }
  home.l1 = {
    ...(home.l1 as Record<string, unknown>),
    resources: { fonts: [{ family: PAGE_FAMILY, src: FONT_SRC, weight: 700 }] },
    root,
  }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
}

/** The browser's own URL resolution, and nothing more. */
function browserFetch(originUrl: string): { restore: () => void } {
  const real = globalThis.fetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) =>
    real(typeof input === 'string' ? new URL(input, originUrl) : input, init)) as typeof fetch
  return {
    restore: () => {
      globalThis.fetch = real
    },
  }
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-121 the copy-edit modal', () => {
  let cwd: string
  let html: string
  let pageId: string
  let builder: BuilderHandle
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }
  let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, never>
  let APP_FONT: string
  let clampPreviewSize: (px: number) => number
  let copyFontFaces: (source: Document, target?: Document) => number

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req121-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
    builder = await startBuilder({ cwd })
    ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ APP_FONT } = await import('../apps/control-app/src/builder/config.js'))
    ;({ clampPreviewSize, copyFontFaces } = await import(
      '../apps/control-app/src/builder/page-style.js'
    ))
    // jsdom ships neither; the split primitive observes its container.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as never
    globalThis.matchMedia ??= ((q: string) => ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    })) as never
  }, 240000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /**
   * Put the edit rendering on screen, INCLUDING its `<style>` — the cascade is
   * what carries the page's presentation, so a suite about reproducing it that
   * dropped the stylesheet would be measuring nothing.
   */
  function display(): void {
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
  }

  function elementShowing(copy: string): Element {
    const el = [...document.querySelectorAll('*')].find(
      (n) => n.children.length === 0 && n.textContent === copy,
    )
    if (!el) throw new Error(`no element renders the copy ${JSON.stringify(copy)}`)
    return el
  }

  const modals = () => [...document.querySelectorAll('.builder-modal')]

  /**
   * Wait for the dialog, rather than for a fixed tick.
   *
   * Opening one is a real HTTP round trip to the origin, so a single macrotask
   * is not a bound on it — it is a bound on how fast this machine happened to be
   * that run. Polling for the thing actually being waited on turns a flaky suite
   * into a deterministic one.
   */
  async function settle(): Promise<void> {
    for (let i = 0; i < 200 && modals().length === 0; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  /** Open the dialog the way the operator does: by clicking the words. */
  async function openOn(
    selector: string | Element,
    host?: Element,
  ): Promise<{ modal: Element; editor: { destroy(): void } }> {
    const editor = mountEditor(document, {
      slug: 'acme',
      bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      ...(host ? { host } : {}),
    })
    const el = typeof selector === 'string' ? document.querySelector(selector)! : selector
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await settle()
    expect(modals()).toHaveLength(1)
    return { modal: modals()[0], editor }
  }

  let net: { restore: () => void }
  beforeEach(() => {
    document.body.replaceChildren()
    document.head.querySelector('style[data-1c-preview-fonts]')?.remove()
    net = browserFetch(builder.url)
  })

  afterEach(() => {
    for (const m of modals()) m.remove()
    net.restore()
  })

  it('test_UAT_FC_REQ-121_the_app_typeface_is_set_once_through_the_shells_font_token', () => {
    // The family is app-level and theme-independent, and it is applied at the
    // ONE place every descendant inherits from. Not a stylesheet override of
    // `.shell`: the token is the component's own extension point, and an
    // override would be invisible to it.
    const root = document.createElement('div')
    document.body.append(root)
    const app = mountBuilder(root, { sites: [{ slug: 'acme', latest: null }] }) as unknown as {
      shell: { element: HTMLElement; getTokens(): Record<string, string> }
      destroy(): void
    }
    try {
      expect(app.shell.getTokens().font).toBe(APP_FONT)
      expect(app.shell.element.style.getPropertyValue('--shell-font')).toBe(APP_FONT)
      // Self-hosted, so the chrome does not depend on a CDN and tells no third
      // party which sites the operator is editing.
      expect(APP_FONT).toContain('IBM Plex Sans')
      const faces = fs.readFileSync('apps/control-app/src/builder/builder.css', 'utf8')
      for (const weight of ['400', '600']) {
        expect(faces).toContain(`ibm-plex-sans-${weight}-latin.woff2`)
        expect(
          fs.existsSync(`apps/control-app/src/builder/fonts/ibm-plex-sans-${weight}-latin.woff2`),
        ).toBe(true)
      }
    } finally {
      app.destroy()
    }
  })

  it('test_UAT_FC_REQ-121_the_dialog_opens_inside_the_shell_so_it_can_resolve_the_theme', async () => {
    // THE ROOT CAUSE. On `document.body` the dialog is a SIBLING of the themed
    // subtree: it resolves no `--shell-*` token and inherits no font, so it
    // renders in the browser default and cannot follow a theme switch. The fix
    // is where it is appended, so that is what this pins.
    display()
    const shell = document.createElement('div')
    shell.className = 'shell'
    document.body.append(shell)

    const { modal, editor } = await openOn(elementShowing(HEADLINE), shell)
    try {
      expect(shell.contains(modal)).toBe(true)
      expect(modal.parentElement).toBe(shell)
    } finally {
      editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-121_the_form_drops_the_heading_and_the_label_column', async () => {
    // Both were redundant chrome around a box you can obviously type in: the
    // heading named the control directly below it, and the label column spent
    // ~40% of the dialog's width saying "Text" beside the words themselves.
    display()
    const { modal, editor } = await openOn(elementShowing(HEADLINE))
    try {
      expect(modal.querySelector('.builder-modal__title')).toBeNull()
      expect(modal.querySelectorAll('.fields-label')).toHaveLength(0)
      expect(modal.querySelector('.fields')!.getAttribute('data-layout')).toBe('stacked')

      // NEITHER DROP COSTS THE DIALOG ITS NAME. The heading's real job was the
      // accessible name, which moves to the dialog; the label's was naming the
      // control, which the component moves onto the control itself.
      expect(modal.getAttribute('aria-label')).toBe('Edit copy')
      const named = modal.querySelector('[aria-label="Text"]')
      expect(named, 'the control keeps the label as its accessible name').toBeTruthy()

      // And the form is still the shared component in whole-form confirm mode.
      expect(modal.querySelector('.fields')!.getAttribute('data-commit')).toBe('buffered')

      // READY TO TYPE, not a value waiting for a second click. The dialog
      // opened because the operator clicked the words, so the value is not being
      // read — and until the control exists the box is not one, which is the
      // whole reason the heading could go.
      const control = modal.querySelector('.fields-control') as HTMLTextAreaElement
      expect(control, 'the one field opens in its control').toBeTruthy()
      expect(control.value).toBe(HEADLINE)
    } finally {
      editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-121_a_dead_end_keeps_its_heading', async () => {
    // The heading is dropped where it was redundant, NOT everywhere. On an
    // error or a message it is the content — removing it would leave a bare
    // sentence floating over a Close button.
    display()
    document.body.removeAttribute(L1_EDIT_PAGE_ATTR)
    const { modal, editor } = await openOn(elementShowing(HEADLINE))
    try {
      const heading = modal.querySelector('.builder-modal__title')
      expect(heading?.textContent).toBe('Could not edit')
      expect(modal.textContent).toContain('1c render acme --edit')
      // A dead end has no editing box, which is what widens the panel.
      expect(modal.querySelector('.builder-modal__box')).toBeNull()
    } finally {
      editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-121_the_box_shows_the_copy_as_the_page_renders_it', async () => {
    display()
    const { modal, editor } = await openOn(elementShowing(HEADLINE))
    try {
      const box = modal.querySelector('.builder-modal__box') as HTMLElement
      expect(box, 'the editing box is the visible box, not the control').toBeTruthy()

      // Typography, READ FROM THE RENDER rather than derived from the node: the
      // colour and family are the run's own, and both arrive through the
      // cascade the renderer emitted.
      expect(box.style.getPropertyValue('--preview-font-family')).toContain(PAGE_FAMILY)
      expect(box.style.getPropertyValue('--preview-font-weight')).toBe('700')
      expect(box.style.getPropertyValue('--preview-color')).toBe('rgb(248, 245, 239)')

      // SIZE IS THE ONE AXIS DELIBERATELY NOT REPRODUCED. 56px in a dialog is
      // unusable, so the page's size is brought into the editing range — still
      // derived from the page (a headline still previews larger than body copy),
      // just stopping short of the extreme.
      expect(box.style.getPropertyValue('--preview-font-size')).toBe(
        `${clampPreviewSize(PAGE_SIZE_PX)}px`,
      )
      expect(clampPreviewSize(PAGE_SIZE_PX)).toBeLessThan(PAGE_SIZE_PX)

      // The background comes from the nearest ancestor that PAINTS — the run
      // itself paints nothing, so a naive read of the clicked element would
      // have produced a transparent box.
      expect(box.style.getPropertyValue('--preview-background')).toBe('rgb(16, 24, 34)')
      const layer = modal.querySelector('.builder-modal__box-bg') as HTMLElement
      expect(layer, 'the mirrored layer is present').toBeTruthy()
      expect(layer.style.backgroundColor).toBe('rgb(16, 24, 34)')
      // Its OFFSET cannot be verified headlessly — jsdom lays nothing out, so
      // every rect is zero. Only the paint it carries is asserted here.

      // The control is restyled THROUGH THE COMPONENT'S OWN TOKENS. Nothing
      // reaches into a `.fields-*` class, so a component update cannot strand a
      // rule that was silently doing the work.
      const css = fs.readFileSync('apps/control-app/src/builder/builder.css', 'utf8')
      expect(css).not.toMatch(/^\s*\.fields[-.\s]/m)
    } finally {
      editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-121_an_images_fields_are_not_dressed_as_page_copy', async () => {
    // The gate is the segment KIND, not the field count. `src` and `alt` are
    // metadata about the page; rendering an alt string in the band's 32px
    // display face would assert something false about where that text ends up.
    display()
    const { modal, editor } = await openOn(`[${L1_EDIT_SEGMENT_ATTR}="image"]`)
    try {
      const box = modal.querySelector('.builder-modal__box') as HTMLElement
      expect(box, 'an image still gets a proper box').toBeTruthy()
      expect(box.style.getPropertyValue('--preview-font-family')).toBe('')
      expect(modal.querySelector('.builder-modal__box-bg')).toBeNull()
    } finally {
      editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-121_the_pages_font_faces_are_copied_into_the_builder_document', async () => {
    // The site's faces are declared in the PREVIEW's stylesheet, which the
    // parent document cannot see. Naming the family without them would preview
    // a system font while claiming to preview the page's — wrong in exactly the
    // axis the box exists to show.
    display()
    const { editor } = await openOn(elementShowing(HEADLINE))
    try {
      const copied = document.head.querySelector('style[data-1c-preview-fonts]')
      expect(copied, 'the faces crossed into the builder document').toBeTruthy()
      expect(copied!.textContent).toContain('@font-face')
      expect(copied!.textContent).toContain(PAGE_FAMILY)
      // Absolutised on the way across: the render is served under
      // `/preview/<slug>/<channel>/`, so a relative handle that resolves there
      // resolves to nothing in the parent.
      expect(copied!.textContent).toMatch(/url\(["']?https?:\/\//)
      expect(copied!.textContent).not.toMatch(/url\(["']?assets\//)
    } finally {
      editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-121_only_font_faces_cross_and_a_reload_replaces_them', () => {
    // ONE RULE TYPE. Copying the whole stylesheet would drag the site's layout,
    // its resets and its `body` rules into the builder chrome, where they would
    // fight the shell for a document the site knows nothing about.
    // An IFRAME, because that is what the preview is — and because a document
    // built any other way carries no `styleSheets` in jsdom, so the suite would
    // be asserting against a source that has nothing to copy.
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const source = frame.contentDocument!
    source.head.innerHTML = `<style>
      @font-face { font-family: "One"; src: url("f/one.woff2") format("woff2"); }
      body { margin: 40px; background: red }
      .l1-3 { display: grid }
    </style>`
    expect(copyFontFaces(source, document)).toBe(1)
    const host = document.head.querySelector('style[data-1c-preview-fonts]')!
    expect(host.textContent).toContain('One')
    expect(host.textContent).not.toContain('margin')
    expect(host.textContent).not.toContain('l1-3')

    // A switch of site or channel must not leave the previous site's families
    // resolvable — the faces belong to the document currently in the frame.
    const nextFrame = document.createElement('iframe')
    document.body.append(nextFrame)
    const next = nextFrame.contentDocument!
    next.head.innerHTML = `<style>@font-face { font-family: "Two"; src: url("f/two.woff2") }</style>`
    expect(copyFontFaces(next, document)).toBe(1)
    expect(document.head.querySelectorAll('style[data-1c-preview-fonts]')).toHaveLength(1)
    expect(document.head.querySelector('style[data-1c-preview-fonts]')!.textContent).toContain(
      'Two',
    )
    expect(document.head.querySelector('style[data-1c-preview-fonts]')!.textContent).not.toContain(
      'One',
    )
  })

  it('test_UAT_FC_REQ-121_the_editing_range_holds_at_both_extremes', () => {
    // The clamp is a range, not a ceiling: a 9px legal line is as unusable to
    // edit as a 72px headline.
    expect(clampPreviewSize(72)).toBe(32)
    expect(clampPreviewSize(9)).toBe(14)
    // Ordinary copy passes through untouched, which is what keeps the preview
    // honest for the overwhelming majority of edits.
    expect(clampPreviewSize(17)).toBe(17)
    // A page that computes no size still yields a usable box.
    expect(clampPreviewSize(Number.NaN)).toBe(14)
  })
})
