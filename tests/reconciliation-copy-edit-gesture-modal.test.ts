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

/**
 * The address of the region that exposes nothing — the painted container the
 * headline sits in. Named once because two criteria pin the same dead end, and
 * they must pin the *same* one for AC-1002's dismissals to be about the dialog
 * AC-1001 opened.
 */
const NOTHING_TO_EDIT_PATH = '0.0'
/** The segment selector for that region, as the edit render stamps it. */
const NOTHING_TO_EDIT_SEGMENT = `[${L1_EDIT_SEGMENT_ATTR}="container"]`

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
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  fs.writeFileSync(homePath, JSON.stringify(home, null, 2))
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
  function display({ stale = false } = {}): void {
    const source = stale
      ? html.replace(new RegExp(`\\s${L1_EDIT_PAGE_ATTR}="[^"]*"`), '')
      : html
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

  function draftBytes(): string {
    return fs.readFileSync(path.join(cwd, 'storage/sites/acme/draft/pages/home.json'), 'utf8')
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

    expect(loaded.fields).toEqual([{ name: 'text', label: 'Text', type: 'string' }])
    expect(loaded.values).toEqual({ text: HEADLINE })
    // NO ROUTE TO MARKUP OR STYLING: every control the derivation can ask for
    // is a plain string, so there is no rich-text surface to reach.
    for (const field of loaded.fields) expect(field.type).toBe('string')

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
      // hand-rolled replacement fails here rather than passing quietly.
      expect(modal.querySelectorAll('.fields')).toHaveLength(1)
      // ...confirmed as a whole, which is what makes one Save one change.
      expect(modal.querySelector('.fields')!.getAttribute('data-commit')).toBe('buffered')
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
})
