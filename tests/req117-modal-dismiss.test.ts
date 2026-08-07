// @vitest-environment jsdom
/**
 * REQ-117 — a modal with nothing to edit must still close (DOC-28 §11).
 *
 * A segment with no exposed fields is a legitimate answer, not an error: a
 * container or a module instance is a real segment with no phase-1 control. The
 * loop says so plainly and offers Close — so Close has to work, or the plain
 * answer becomes a trap the user cannot get out of without a reload.
 *
 * The bug this pins is a temporal dead zone, which is why it survived review and
 * why every existing modal UAT missed it. `close()` reads `fields`; `fields` was
 * declared `const` *below* the `spec.kind !== 'fields'` early return, so for a
 * message or an error modal it was never initialised and stayed in TDZ for the
 * life of the dialog. `fields?.destroy()` then THREW ReferenceError rather than
 * reading undefined — optional chaining guards null, not TDZ — and the throw
 * landed before `host.remove()`. Every dismissal route died together: button,
 * Escape and backdrop all funnel through that one function.
 *
 * The form modal was unaffected (it initialises `fields` before anyone can
 * click), so the suite that drives the fields path stayed green throughout.
 * These drive the REAL `defaultModal` — the one the browser gets — rather than
 * the injected test double the other suites use, because the double is exactly
 * what hid this.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cmdNew, cmdRender } from '../tools/generate/src/cli'
import { mountL1EditBridge } from '../packages/framework/src/l1/edit-client'
import { formatL1Path, L1_EDIT_PAGE_ATTR } from '../packages/site-schema/src/l1/edit'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

if (!WEBUI_INSTALLED) console.warn(`REQ-117 modal-dismiss suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-117 a fieldless modal closes', () => {
  let cwd: string
  let html: string

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req117-modal-'))
    cmdNew('alpha', { cwd })
    const { outDir } = await cmdRender('alpha', { cwd, edit: true })
    html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
  }, 180000)

  afterAll(() => {
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /**
   * Open the REAL modal over the origin's "no fields here" answer.
   *
   * `mountEditor` is deliberately given no `openModal`, so `defaultModal` is
   * under test — the injected double the other suites use is exactly what hid
   * this bug.
   *
   * Which segment is clicked is not the variable: the `box` kind and the empty
   * field list come from the origin's reply, not from the element, and the
   * starter render is all `copy`. So the click is real and the fieldless answer
   * is stubbed — the same answer the origin genuinely gives for a container,
   * which is the case the user hit.
   */
  async function openFieldlessModal() {
    document.documentElement.innerHTML = /<html[^>]*>([\s\S]*)<\/html>/.exec(html)![1]
    const pageId = /data-fc-page="([^"]+)"/.exec(html)![1]
    document.body.setAttribute('data-fc-edit', '')
    document.body.setAttribute('data-fc-page', pageId)

    const { mountEditor } = await import('../apps/control-app/src/builder/editor.js')

    const realFetch = globalThis.fetch
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ kind: 'box', fields: [], values: {} }),
    })) as unknown as typeof fetch

    try {
      const editor = mountEditor(document, {
        slug: 'alpha',
        bridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
      })
      const segment = document.querySelector('[data-l1-segment]') as HTMLElement
      expect(segment, 'the edit render carries segments to click').toBeTruthy()
      segment.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      await new Promise((r) => setTimeout(r, 0))

      const modal = document.querySelector('.builder-modal') as HTMLElement
      expect(modal, 'clicking a fieldless segment opens the modal').toBeTruthy()
      // The user's exact wording — this is the dialog being pinned, not a
      // neighbouring one that happens to also be dismissible.
      expect(modal.textContent).toContain('Nothing to edit on this box segment yet.')
      return { editor, modal, restore: () => (globalThis.fetch = realFetch) }
    } catch (err) {
      globalThis.fetch = realFetch
      throw err
    }
  }

  it('test_UAT_FC_REQ-117_fieldless_modal_closes_on_the_close_button', async () => {
    const { editor, modal, restore } = await openFieldlessModal()
    try {
      const close = [...modal.querySelectorAll('button')].find((b) => b.textContent === 'Close')
      expect(close, 'the modal offers Close').toBeTruthy()
      close!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

      expect(document.querySelector('.builder-modal')).toBeNull()
    } finally {
      restore()
      editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-117_fieldless_modal_closes_on_escape_and_backdrop', async () => {
    // Both routes call the same `close`, so they died together and must recover
    // together — asserting only the button would leave two live regressions.
    const first = await openFieldlessModal()
    try {
      document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      expect(document.querySelector('.builder-modal'), 'Escape dismisses').toBeNull()
    } finally {
      first.restore()
      first.editor.destroy()
    }

    const second = await openFieldlessModal()
    try {
      const backdrop = second.modal.querySelector('.builder-modal__backdrop') as HTMLElement
      backdrop.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      expect(document.querySelector('.builder-modal'), 'the backdrop dismisses').toBeNull()
    } finally {
      second.restore()
      second.editor.destroy()
    }
  })

  it('test_UAT_FC_REQ-117_closing_a_fieldless_modal_unbinds_its_key_handler', async () => {
    // `close` also removes the keydown listener. If the ReferenceError returns,
    // it throws before that too — so a dismissed modal would leave a listener
    // per open, and Escape would act on dialogs that are no longer on screen.
    const { editor, modal, restore } = await openFieldlessModal()
    try {
      const close = [...modal.querySelectorAll('button')].find((b) => b.textContent === 'Close')
      close!.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
      // A second Escape with nothing open must be inert, not throw.
      expect(() =>
        document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })),
      ).not.toThrow()
      expect(document.querySelector('.builder-modal')).toBeNull()
    } finally {
      restore()
      editor.destroy()
    }
  })
})
