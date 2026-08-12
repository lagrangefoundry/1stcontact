// @vitest-environment jsdom
/**
 * story-3bf94bd4 — **the form the gesture opens**, and the two honest dead ends
 * it opens instead when there is nothing to edit or nothing to edit *against*.
 *
 * The gesture's other half — the pointer, the address a click resolves to, and
 * the page the operator is left looking at — is in
 * `reconciliation-copy-edit-gesture.test.ts`. This file is the dialog: what it
 * is built from, what it refuses to open, and how it closes.
 *
 * REAL EVERYTHING EXCEPT THE ORIGIN'S PORT. The document is the bytes
 * `1c render --edit` wrote; the bridge is the one the browser runs; the reads
 * and writes go over HTTP to a real builder origin. The single shim is the one
 * a browser supplies for free: relative URLs are resolved against that origin.
 * `defaultModal` is driven directly — the injected double the other suites use
 * is exactly what hid the temporal-dead-zone bug this story records.
 *
 * KNOWN COVERAGE CAVEAT (story Technical Context). The form is a shared
 * shared `webui-fields` component, consumed from an out-of-band install
 * that nothing in this repository's manifests records. On a machine that has
 * not run it, each criterion below asserts whatever core does not need the
 * component and reports the rest as UNVERIFIED — loudly, because a quiet skip
 * on the only test of the actual gesture is indistinguishable from a pass. The
 * one criterion that is *entirely* about the dialog (AC-1002) skips outright
 * rather than pretending to a green it did not earn. The component is never
 * mocked: a mocked form would prove nothing about the thing under test.
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
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
} from '../packages/site-schema/src/l1/edit'
import type { L1Node } from '@1stcontact/site-schema'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const HEADLINE = 'A painted band.'
/** The words inside the panel that carries a background — AC-1050's contrast. */
const BEHIND = 'Over the backdrop.'

/**
 * The address of the region that exposes nothing — the painted container the
 * headline sits in. Named once because two criteria pin the same dead end, and
 * they must pin the *same* one for AC-1002's dismissals to be about the dialog
 * AC-1001 opened.
 */
const NOTHING_TO_EDIT_PATH = '0.0'
/** The segment selector for that region, as the edit render stamps it. */
const NOTHING_TO_EDIT_SEGMENT = `[${L1_EDIT_SEGMENT_ATTR}="container"]`

/** The handles the seeded site's images are referenced by. */
const HERO = '/assets/hero.png'
const BETA = '/assets/beta.png'
const LOGO = '/assets/logo.svg'
/** Every image the site can offer — sorted, images only. */
const SITE_IMAGES = [BETA, HERO, LOGO]
/** Safe and well-formed, and naming nothing the site has: a stale listing's pick. */
const ABSENT = '/assets/nowhere.png'
/** The painted panel that carries a background image — AC-1050's specimen. */
const PAINTED_PANEL_PATH = '0.2'

/** The asset files the site's own images are, beside two that are not images. */
const ASSET_FILES: Record<string, string> = {
  'hero.png': 'bytes:hero',
  'beta.png': 'bytes:beta',
  'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  'body.woff2': 'bytes:font',
}

/** A field descriptor, as `/api/copy` answers with it. */
interface Field {
  name: string
  label: string
  type: string
  enum?: string[]
  required?: boolean
}

if (!WEBUI_INSTALLED) console.warn(`story-3bf94bd4 form suite: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-3bf94bd4: ${what} NOT VERIFIED here — ${WEBUI_SKIP_REASON}`)
}

/**
 * Copy nested in a painted container, plus a region that exposes nothing.
 *
 * The painted container is BOTH: it is a segment in its own right (paint is what
 * makes it one) and it exposes no phase-1 field, so it is the "nothing to edit"
 * specimen. The image beside it is the deliberate contrast — since REQ-118 an
 * image exposes which image goes there and its alt text, so the empty answer
 * below is a fact about the container, not about everything that is not copy.
 *
 * Since REQ-128 there is a THIRD shape: a painted panel that carries a
 * background image. It is what makes the dead end above a fact about *that*
 * panel rather than about painted panels — two panels, alike in every way but
 * one, one of which opens a form and one of which does not.
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
        axes: { surfaceFill: '#101822' },
        children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }], // [0.0.0]
      },
      // [0.1] an image — editable since REQ-118, kept here as the contrast.
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
      // [0.2] a painted panel that DOES carry a background image, with a full
      // stack of other paint beside it: "nothing else of its paint is offered"
      // is only measurable on a panel that demonstrably carries some.
      {
        kind: 'container',
        layout: 'stack',
        axes: {
          backgroundImageUrl: HERO,
          surfaceFill: '#1d2733',
          borderRadiusPx: 12,
          opacity: 0.9,
        },
        children: [{ kind: 'text', text: BEHIND, axes: { fontSizePx: 20 } }], // [0.2.0]
      },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))

  // The site's own images, so the picker has a closed list to be closed over.
  // The font file is a real asset and nothing a background can point at.
  const assets = path.join(cwd, 'storage', 'sites', slug, 'draft', 'assets')
  fs.mkdirSync(assets, { recursive: true })
  for (const [name, bytes] of Object.entries(ASSET_FILES)) {
    fs.writeFileSync(path.join(assets, name), bytes)
  }
}

/**
 * The browser's own URL resolution, and nothing more: the builder's client
 * calls `/api/copy`, which only means something relative to an origin. Every
 * call is recorded so a criterion about what was NOT sent can assert it.
 */
function browserFetch(originUrl: string): {
  calls: Array<{ url: string; method: string; body: string | undefined }>
  restore: () => void
} {
  const real = globalThis.fetch
  const calls: Array<{ url: string; method: string; body: string | undefined }> = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? new URL(input, originUrl) : input
    calls.push({
      url: String(url),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : undefined,
    })
    return real(url as URL, init)
  }) as typeof fetch
  return {
    calls,
    restore: () => {
      globalThis.fetch = real
    },
  }
}

describe('story-3bf94bd4 the form the gesture opens', () => {
  let cwd: string
  let html: string
  let pageId: string
  let renderedPath: string
  let builder: BuilderHandle
  /** Loaded dynamically: `editor.js` imports the component by bare specifier. */
  let mountEditor: (doc: Document, options: Record<string, unknown>) => { destroy(): void }

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-3bf94bd4-form-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
    const { outDir } = await cmdRender('acme', { cwd, edit: true })
    renderedPath = path.join(outDir, 'index.html')
    html = fs.readFileSync(renderedPath, 'utf8')
    pageId = new RegExp(`${L1_EDIT_PAGE_ATTR}="([^"]+)"`).exec(html)![1]
    builder = await startBuilder({ cwd })
    if (WEBUI_INSTALLED) {
      ;({ mountEditor } = await import('../apps/control-app/src/builder/editor.js'))
    }
  }, 240000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /**
   * Put the edit rendering on screen. `documentElement.innerHTML` does not
   * carry the parsed `<body>` attributes, so the marker and the page coordinate
   * are restored explicitly — and `stale` is what a rendering built before the
   * coordinate existed looks like: everything else intact.
   */
  function display({ stale = false, from = html }: { stale?: boolean; from?: string } = {}): void {
    const source = stale
      ? from.replace(new RegExp(`\\s${L1_EDIT_PAGE_ATTR}="[^"]*"`), '')
      : from
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(source)![1]
    // Assigning `documentElement.innerHTML` reuses the existing `<body>`, so
    // its attributes are whatever the last call left there — set them, never
    // assume them.
    document.body.setAttribute(L1_EDIT_MARKER_ATTR, '')
    if (stale) document.body.removeAttribute(L1_EDIT_PAGE_ATTR)
    else document.body.setAttribute(L1_EDIT_PAGE_ATTR, pageId)
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
   * Wait for the gesture's `fetch`-and-open.
   *
   * NOT a microtask chain, despite what this comment used to claim: opening the
   * dialog is a real HTTP round trip to the origin, so a single macrotask is not
   * a bound on it — it is a bound on how fast the machine happened to be. Every
   * criterion here failed on that, and the failures compounded, because a dialog
   * that arrived after its own test had finished was still in the document when
   * the next one looked (AC-1001 read "A painted band.CancelSave" out of AC-994's
   * late form). Polling for the thing actually being waited on is deterministic.
   */
  async function settle(): Promise<void> {
    for (let i = 0; i < 200 && modals().length === 0; i += 1) {
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  const homeJson = (): string => path.join(cwd, 'storage/sites/acme/draft/pages/home.json')

  function draftBytes(): string {
    return fs.readFileSync(homeJson(), 'utf8')
  }

  /**
   * Wait for `ready` the way `settle` waits for the dialog — by polling the
   * thing itself. A Save is a real round trip to the origin, so any fixed number
   * of ticks bounds how fast the machine was rather than the thing waited on.
   */
  async function until(ready: () => boolean): Promise<void> {
    for (let i = 0; i < 400 && !ready(); i += 1) await new Promise((r) => setTimeout(r, 5))
  }

  function renderedBytes(): string {
    return fs.readFileSync(renderedPath, 'utf8')
  }

  beforeEach(() => {
    document.body.replaceChildren()
  })

  afterEach(() => {
    for (const m of modals()) m.remove()
  })

  it('test_UAT_AC994_clicking_a_copy_region_opens_one_form_over_that_regions_fields', async () => {
    // AC-994 — the click opens a form over exactly the fields that region
    // exposes, pre-filled with the words currently in the draft, and does
    // nothing else.
    display()
    const words = elementShowing(HEADLINE)

    let hits = 0
    let address = ''
    const bridge = mountL1EditBridge(document, (hit) => {
      hits += 1
      address = formatL1Path(hit.target.path)
    })
    const click = new window.MouseEvent('click', { bubbles: true, cancelable: true })
    words.dispatchEvent(click)
    bridge.destroy()

    expect(hits).toBe(1)
    expect(address).toBe('0.0.0')
    // Whatever the element would ordinarily do when clicked does not happen.
    expect(click.defaultPrevented).toBe(true)

    // The form is built from what the region exposes and what the draft holds —
    // this is the call it is built from.
    const loaded = (await (
      await fetch(
        new URL(
          `/api/copy?${new URLSearchParams({ slug: 'acme', page: pageId, path: address })}`,
          builder.url,
        ),
      )
    ).json()) as { fields: Array<{ name: string; type: string }>; values: Record<string, string> }

    expect(loaded.fields[0]).toEqual({ name: 'text', label: 'Text', type: 'string' })
    expect(loaded.values).toMatchObject({ text: HEADLINE })
    // NO ROUTE TO MARKUP OR STYLING. Every control the derivation can ask for is
    // one of a closed set of shapes, none of which can carry markup: plain text
    // (which the renderer escapes), a pick from a list this surface wrote, a
    // bounded whole number, or a bit. REQ-135 added the last two; there is still
    // no rich-text surface to reach, which is the claim.
    for (const field of loaded.fields) {
      expect(['string', 'enum', 'integer', 'boolean']).toContain(field.type)
    }

    if (!WEBUI_INSTALLED) {
      unverified('AC-994 that the dialog is the shared component in whole-form confirm mode')
      return
    }
    const net = browserFetch(builder.url)
    let editor: { destroy(): void } | undefined
    try {
      display()
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      })
      elementShowing(HEADLINE).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle()

      // A SINGLE dialog...
      expect(modals()).toHaveLength(1)
      const modal = modals()[0]
      // ...whose form is the shared component's, not a hand-built one. A future
      // hand-rolled replacement fails here rather than passing quietly. Counted
      // over the BOX: REQ-135 mounts a second instance of the same component
      // beneath it for the run's typography, so "one form" became "one form for
      // the words" — still the component, still not hand-built.
      const box = modal.querySelector('.builder-modal__box')!
      expect(box.querySelectorAll('.fields')).toHaveLength(1)
      // ...confirmed as a whole, which is what makes one Save one change.
      expect(box.querySelector('.fields')!.getAttribute('data-commit')).toBe('buffered')
      // ...showing the words the region displays on the page. Read off the
      // CONTROL rather than the dialog's text: REQ-121 opens a one-field form
      // straight into its control, so the words are a form value now instead of
      // a span. What this criterion is about — the form is pre-filled with what
      // the draft holds — is unchanged.
      const control = modal.querySelector('.fields-control') as HTMLTextAreaElement | null
      expect(control?.value ?? modal.textContent).toContain(HEADLINE)
    } finally {
      editor?.destroy()
      net.restore()
    }
  })

  it('test_UAT_AC1001_a_region_with_nothing_editable_says_so_and_names_its_kind', async () => {
    // AC-1001 — a plain message, not an empty form and not silence. The
    // specimen is the painted CONTAINER: paint is what makes it a segment, and
    // its background is phase 2, so it is a real region that genuinely exposes
    // nothing today.
    display()
    const container = document.querySelector(`[${L1_EDIT_SEGMENT_ATTR}="container"]`)!
    expect(container.getAttribute(L1_EDIT_PATH_ATTR)).toBe(NOTHING_TO_EDIT_PATH)

    // The region is real and resolves; it simply exposes nothing — so there is
    // no form to build, and the kind is what the answer can name.
    const loaded = (await (
      await fetch(
        new URL(
          `/api/copy?${new URLSearchParams({
            slug: 'acme',
            page: pageId,
            path: NOTHING_TO_EDIT_PATH,
          })}`,
          builder.url,
        ),
      )
    ).json()) as { kind: string; fields: unknown[]; values: Record<string, string> }
    expect(loaded.kind).toBe('container')
    expect(loaded.fields).toEqual([])
    expect(loaded.values).toEqual({})

    if (!WEBUI_INSTALLED) {
      unverified('AC-1001 the message dialog opened over a region with no fields')
      return
    }
    const net = browserFetch(builder.url)
    let editor: { destroy(): void } | undefined
    try {
      display()
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      })
      document
        .querySelector(NOTHING_TO_EDIT_SEGMENT)!
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle()

      expect(modals()).toHaveLength(1)
      const modal = modals()[0]
      // The operator's answer is "not this one", stated plainly and naming the
      // kind of region they clicked.
      expect(modal.textContent).toContain('Nothing to edit on this container segment yet.')
      // And it is a message, not an empty form.
      expect(modal.querySelectorAll('input, textarea, select, .fields')).toHaveLength(0)
    } finally {
      editor?.destroy()
      net.restore()
    }
  })

  it.skipIf(!WEBUI_INSTALLED)(
    'test_UAT_AC1002_the_nothing_to_edit_message_is_dismissible_by_button_escape_and_backdrop',
    async () => {
      // AC-1002 — the plain answer must not become a trap. Every route a dialog
      // is normally dismissed by has to work, independently, and leave nothing
      // behind. They all funnel through one `close()`, so they broke together
      // once and must be proven together.
      const net = browserFetch(builder.url)
      try {
        const open = async (): Promise<{ modal: Element; editor: { destroy(): void } }> => {
          display()
          const editor = mountEditor(document, {
            slug: 'acme',
            bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
          })
          document
            .querySelector(NOTHING_TO_EDIT_SEGMENT)!
            .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
          await settle()
          expect(modals()).toHaveLength(1)
          return { modal: modals()[0], editor }
        }

        // 1 — its own button.
        let opened = await open()
        const close = [...opened.modal.querySelectorAll('button')].find(
          (b) => b.textContent === 'Close',
        )
        expect(close, 'the message offers a way out').toBeTruthy()
        close!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
        expect(modals()).toHaveLength(0)

        // After a dismissal, nothing of it is still listening: a further Escape
        // with nothing open is inert and raises no error.
        expect(() =>
          document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })),
        ).not.toThrow()
        expect(modals()).toHaveLength(0)
        opened.editor.destroy()

        // 2 — Escape.
        opened = await open()
        document.dispatchEvent(
          new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        )
        expect(modals()).toHaveLength(0)
        opened.editor.destroy()

        // 3 — the backdrop.
        opened = await open()
        opened.modal
          .querySelector('.builder-modal__backdrop')!
          .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
        expect(modals()).toHaveLength(0)
        opened.editor.destroy()
      } finally {
        net.restore()
      }
    },
  )

  it('test_UAT_AC1000_closing_a_form_in_which_nothing_changed_writes_nothing', async () => {
    // AC-1000 — opening a form to look is not an edit.
    const beforeDraft = draftBytes()
    const beforeRender = renderedBytes()

    // Building the form reads; reading writes nothing and re-renders nothing.
    const res = await fetch(
      new URL(
        `/api/copy?${new URLSearchParams({ slug: 'acme', page: pageId, path: '0.0.0' })}`,
        builder.url,
      ),
    )
    expect(res.status).toBe(200)
    expect(draftBytes()).toBe(beforeDraft)
    expect(renderedBytes()).toBe(beforeRender)

    if (!WEBUI_INSTALLED) {
      unverified('AC-1000 that confirming an untouched form sends nothing, exactly as cancelling')
      return
    }
    // Confirm and cancel are the same answer when nothing was changed.
    for (const button of ['.builder-modal__btn--primary', '.builder-modal__btn'] as const) {
      const net = browserFetch(builder.url)
      let editor: { destroy(): void } | undefined
      try {
        display()
        editor = mountEditor(document, {
          slug: 'acme',
          bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
        })
        elementShowing(HEADLINE).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
        await settle()
        expect(modals()).toHaveLength(1)

        const control = modals()[0].querySelector(button) as HTMLElement
        control.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
        await settle()

        // The form closed, and nothing was sent...
        expect(modals()).toHaveLength(0)
        expect(net.calls.filter((c) => c.method === 'POST')).toEqual([])
        // ...so the draft is untouched and the page was not re-rendered.
        expect(draftBytes()).toBe(beforeDraft)
        expect(renderedBytes()).toBe(beforeRender)
      } finally {
        editor?.destroy()
        net.restore()
      }
    }
  })

  it('test_UAT_AC1003_a_rendering_without_the_page_coordinate_is_refused_before_anything_is_sent', async () => {
    // AC-1003 — an address is only half a coordinate. A rendering built before
    // the coordinate existed still looks entirely editable, which is exactly
    // why the refusal has to happen here rather than at the write path.
    const body = /<body([^>]*)>/.exec(html)![1]
    // Under a real attribute NAME, and naming a page that exists — the observed
    // failure was `undefined="home"`, which is silently valid HTML.
    expect(body).toMatch(new RegExp(`\\s${L1_EDIT_PAGE_ATTR}="[^"]+"`))
    expect(body).not.toMatch(/\bundefined\s*=/)
    expect(fs.existsSync(path.join(cwd, 'storage/sites/acme/draft/pages', `${pageId}.json`))).toBe(
      true,
    )

    // The stale artifact: everything intact but the coordinate.
    display({ stale: true })
    expect(document.body.hasAttribute(L1_EDIT_MARKER_ATTR)).toBe(true)
    expect(document.body.hasAttribute(L1_EDIT_PAGE_ATTR)).toBe(false)
    expect(document.querySelectorAll(`[${L1_EDIT_PATH_ATTR}]`).length).toBeGreaterThan(0)

    if (!WEBUI_INSTALLED) {
      unverified('AC-1003 the refusal message raised on clicking a rendering with no coordinate')
      return
    }
    const net = browserFetch(builder.url)
    let editor: { destroy(): void } | undefined
    try {
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      })
      elementShowing(HEADLINE).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await settle()

      // Exactly one message, and it names the exact re-render to run, for this
      // site.
      expect(modals()).toHaveLength(1)
      expect(modals()[0].textContent).toContain('1c render acme --edit')

      // NOTHING WAS SENT. An incomplete request could only come back reporting
      // a missing page — true, and useless, since the page was never the
      // problem.
      expect(net.calls).toEqual([])
    } finally {
      editor?.destroy()
      net.restore()
    }
  })

  it('test_UAT_AC1050_a_painted_panel_opens_its_background_picker_over_the_same_transport', async () => {
    // AC-1050 — the gesture is kind-agnostic a SECOND time over. Nothing about
    // it differs for a painted panel carrying a background: the same click
    // resolution, the same form, the same `/api/copy` transport, the same
    // one-Save-is-one-change rule. What is new is only what the region answers
    // with when asked which fields it exposes — and a panel that answered
    // "nothing to edit here" now opens the form purely because of that.

    /** The rendering the operator is looking at, served by the origin. */
    const servedEdit = async (): Promise<string> =>
      (await fetch(new URL('/preview/acme/edit/', builder.url))).text()
    const read = async (address: string) =>
      (await (
        await fetch(
          new URL(
            `/api/copy?${new URLSearchParams({ slug: 'acme', page: pageId, path: address })}`,
            builder.url,
          ),
        )
      ).json()) as { kind: string; fields: Field[]; values: Record<string, string> }
    const post = (address: string, values: Record<string, string>) =>
      fetch(new URL('/api/copy', builder.url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'acme', page: pageId, path: address, values }),
      })

    const served = await servedEdit()
    expect(served).toMatch(/background-image:[^;}]*assets\/hero\.png/)
    display({ from: served })

    // ── the click resolves to the panel ──────────────────────────────────────
    const panel = document.querySelector(`[${L1_EDIT_PATH_ATTR}="${PAINTED_PANEL_PATH}"]`)!
    expect(panel.getAttribute(L1_EDIT_SEGMENT_ATTR)).toBe('container')

    const seen: Array<{ kind: string; address: string }> = []
    const bridge = mountL1EditBridge(document, (hit) => {
      seen.push({ kind: hit.kind, address: formatL1Path(hit.target.path) })
    })
    panel.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
    // The words INSIDE it still resolve to themselves: the panel becoming
    // editable did not make it steal the click from its own copy.
    elementShowing(BEHIND).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    bridge.destroy()
    expect(seen).toEqual([
      { kind: 'container', address: PAINTED_PANEL_PATH },
      { kind: 'copy', address: `${PAINTED_PANEL_PATH}.0` },
    ])

    // ── what the form is built from ──────────────────────────────────────────
    const loaded = await read(PAINTED_PANEL_PATH)
    expect(loaded.kind).toBe('container')
    // ONE field: which image sits behind it. Not the rest of its paint, which
    // the panel demonstrably carries.
    expect(loaded.fields.map((f) => f.name)).toEqual(['backgroundImageUrl'])
    const [picker] = loaded.fields
    expect(picker).toMatchObject({ label: 'Background image', type: 'enum', required: true })
    // A CLOSED list of the site's own images — including the handle the panel
    // paints now, so opening the form and saving cannot swap it for another.
    expect(picker.enum).toEqual(SITE_IMAGES)
    expect(picker.enum).toContain(loaded.values.backgroundImageUrl)
    expect(picker.enum).not.toContain('/assets/body.woff2')
    // Pre-filled from the draft.
    expect(loaded.values).toEqual({ backgroundImageUrl: HERO })

    // The dead end is still a dead end, on the same page and over the same
    // read: a panel with paint but no background opens no form at all.
    expect((await read(NOTHING_TO_EDIT_PATH)).fields).toEqual([])

    // ── a choice the surface refuses comes back field-scoped ─────────────────
    const beforeDraft = draftBytes()
    const refused = await post(PAINTED_PANEL_PATH, { backgroundImageUrl: ABSENT })
    expect(refused.status).toBe(400)
    const envelope = (await refused.json()) as { code: string; message: string; path?: string }
    // A CLIENT fault naming the field the operator was choosing in, never a
    // generic server failure that throws the choice away.
    expect(envelope.code).toBe('SCHEMA_INVALID')
    expect(envelope.path).toBe(`${PAINTED_PANEL_PATH}/backgroundImageUrl`)
    // Nothing partial landed: the draft is byte-identical and the page the
    // operator is looking at still paints what it did.
    expect(draftBytes()).toBe(beforeDraft)
    expect(await servedEdit()).toMatch(/background-image:[^;}]*assets\/hero\.png/)

    if (!WEBUI_INSTALLED) {
      unverified('AC-1050 the picker the dialog builds, and the refusal it stays open holding')
      return
    }

    // ── the dialog itself ────────────────────────────────────────────────────
    const net = browserFetch(builder.url)
    let editor: { destroy(): void } | undefined
    try {
      display({ from: served })
      editor = mountEditor(document, {
        slug: 'acme',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      })
      const clickRegion = (address: string): void =>
        document
          .querySelector(`[${L1_EDIT_PATH_ATTR}="${address}"]`)!
          .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      // THE PANEL BESIDE IT IS STILL AN HONEST DEAD END. Two painted panels,
      // alike in everything but one, and the difference is a background handle:
      // this one says so plainly rather than opening an empty form or offering
      // to add one.
      clickRegion(NOTHING_TO_EDIT_PATH)
      await settle()
      expect(modals()).toHaveLength(1)
      expect(modals()[0].textContent).toContain('Nothing to edit on this container segment yet.')
      expect(modals()[0].querySelectorAll('input, textarea, select, .fields')).toHaveLength(0)
      document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(modals()).toHaveLength(0)

      clickRegion(PAINTED_PANEL_PATH)
      await settle()

      // The SAME single dialog a copy region and an image region open...
      expect(modals()).toHaveLength(1)
      const modal = modals()[0]
      // ...built over exactly one closed list of the site's images, with the one
      // this panel currently paints already chosen.
      //
      // Since REQ-132 that list is the thumbnail picker rather than a `<select>`
      // of handles: the same options, the same values, shown as the pictures
      // they name. The criterion is unchanged — a closed list, and a pick — so
      // it is asserted against the control that now carries it.
      expect(modal.querySelectorAll('.builder-modal__picker')).toHaveLength(1)
      const options = [
        ...modal.querySelectorAll<HTMLInputElement>('.builder-modal__tile-input'),
      ]
      expect(options.map((o) => o.value)).toEqual(SITE_IMAGES)
      expect(options.filter((o) => o.checked).map((o) => o.value)).toEqual([HERO])
      // A pick, never a handle the operator types: there is no free-text route
      // to an image the site does not have.
      expect(modal.querySelectorAll('input[type=text], textarea')).toHaveLength(0)
      // And no form beside it — a background handle is the whole of what this
      // segment exposes, so there is no text control for the dialog to build.
      expect(modal.querySelectorAll('.fields-control')).toHaveLength(0)

      // A refusal the operator can actually meet: break the page out from under
      // the open form, so the confirm is refused by the real validator.
      const sound = draftBytes()
      const broken = JSON.parse(sound) as {
        l1: { root: { children: Array<{ children: Array<{ axes: { fontSizePx: number } }> }> } }
      }
      broken.l1.root.children[0].children[0].axes.fontSizePx = 9999
      fs.writeFileSync(homeJson(), JSON.stringify(broken, null, 2))
      const brokenBytes = draftBytes()

      const beta = options.find((o) => o.value === BETA)!
      beta.checked = true
      beta.dispatchEvent(new window.Event('change', { bubbles: true }))
      const save = modal.querySelector('.builder-modal__btn--primary') as HTMLElement
      save.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      const error = () => modal.querySelector('.builder-modal__error') as HTMLElement
      await until(() => !error().hidden)

      // THE FORM STAYS OPEN, holding the choice, showing the reason — and
      // nothing was written.
      expect(modals()).toHaveLength(1)
      expect(error().textContent).toContain('fontSizePx')
      // Still holding the choice — read off the control rather than off the
      // dialog's text, which since REQ-132 shows the file name and not the
      // handle.
      expect(options.filter((o) => o.checked).map((o) => o.value)).toEqual([BETA])
      expect(draftBytes()).toBe(brokenBytes)

      // Corrected and confirmed again from the SAME open form.
      fs.writeFileSync(homeJson(), sound)
      save.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await until(() => modals().length === 0)
      expect(modals()).toHaveLength(0)
      expect(net.calls.filter((c) => c.method === 'POST')).toHaveLength(2)
    } finally {
      editor?.destroy()
      net.restore()
    }

    // ── the page repaints, and is still editable ─────────────────────────────
    const after = await servedEdit()
    expect(after).toMatch(/background-image:[^;}]*assets\/beta\.png/)
    expect(after).not.toMatch(/background-image:[^;}]*assets\/hero\.png/)
    // Everything else the panel painted survived the swap: the chosen handle
    // was written into the paint the panel already carried, not over it.
    const draft = JSON.parse(draftBytes()) as {
      l1: { root: { children: Array<{ axes: Record<string, unknown> }> } }
    }
    expect(draft.l1.root.children[2].axes).toEqual({
      backgroundImageUrl: BETA,
      surfaceFill: '#1d2733',
      borderRadiusPx: 12,
      opacity: 0.9,
    })

    display({ from: after })
    expect(document.body.hasAttribute(L1_EDIT_MARKER_ATTR)).toBe(true)
    const live: string[] = []
    const again = mountL1EditBridge(document, (hit) => void live.push(formatL1Path(hit.target.path)))
    document
      .querySelector(`[${L1_EDIT_PATH_ATTR}="${PAINTED_PANEL_PATH}"]`)!
      .dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    again.destroy()
    expect(live).toEqual([PAINTED_PANEL_PATH])
  })
})
