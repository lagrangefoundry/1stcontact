/**
 * [[REQ-215]] UATs — **switching channel must preserve what the page is
 * showing**, the builder's half.
 *
 * `carry.js` is what holds the page across the swap that destroys it, and these
 * drive it exactly as the builder does: capture from the document that is about
 * to go, compose the other channel's URL from what was captured, adopt the
 * document that arrives.
 *
 * NOTHING IS SUBSTITUTED FOR THE PAGE STATE. The real
 * `packages/framework`'s module is injected, against real rendered documents in
 * `jsdom` — the same pairing the browser makes — so what "open" means here is
 * what it means to the renderer that wrote the marker.
 *
 * `scrollY` and `scrollTo` are the two things jsdom does not implement, so the
 * offset is defined on the window and the call is recorded. That is patching the
 * browser, not the subject.
 *
 * Acceptance covered:
 *
 *   AC-1   the page is carried: a reader on `/about` in View is on `/about` in Edit
 *   AC-2   the scroll offset is carried
 *   AC-8   what View was showing is what Edit shows
 *   AC-10  a re-render re-applies the carried state rather than resetting it
 *   AC-11  switching site discards it
 */
import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { previewUrl, setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { createPageCarry } from '../apps/control-app/src/builder/carry.js'
import { renderL1Document } from '../packages/framework/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

const doc = (root: L1Node): L1Document => ({ widths: [320, 768, 1440], root })

const signInPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'signin-link', text: 'Sign in', action: { opens: 'signin-panel' } },
    {
      kind: 'container',
      id: 'signin-panel',
      layout: 'stack',
      dialog: { backdrop: { color: '#000000', opacity: 0.5 } },
      axes: { surfaceFill: '#ffffff' },
      children: [{ kind: 'text', text: 'Please enter your email address' }],
    },
  ],
})

interface Loaded {
  win: Window
  doc: Document
  /** Every offset `applyL1PageState` scrolled this window to, in order. */
  scrolled: number[]
}

/** One channel's render, served at the URL the pane actually shows it at. */
async function load(channel: 'draft' | 'edit', slug: string, rel = ''): Promise<Loaded> {
  const { html, css } = renderL1Document(doc(signInPage()), { edit: channel === 'edit' })
  const body = channel === 'edit' ? '<body data-fc-edit>' : '<body>'
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head>${body}${html}</body></html>`,
    { runScripts: 'dangerously', url: `https://app.example${previewUrl(slug, channel, rel)}` },
  )
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0))
  const scrolled: number[] = []
  // jsdom implements neither, and both are the browser's rather than the
  // subject's — so the offset is given a value and the call is recorded.
  dom.window.scrollTo = ((_x: number, y: number) => void scrolled.push(y)) as Window['scrollTo']
  return { win: dom.window as unknown as Window, doc: dom.window.document, scrolled }
}

const at = (loaded: Loaded, offset: number): void => {
  Object.defineProperty(loaded.win, 'scrollY', { value: offset, configurable: true })
}

const openSignIn = (loaded: Loaded): void => {
  ;(loaded.doc.getElementById('signin-link') as HTMLElement).click()
}

const openPanels = (loaded: Loaded): string[] =>
  [...loaded.doc.querySelectorAll('[data-l1-dialog][data-l1-open]')].map(
    (s) => s.getAttribute('data-l1-dialog') ?? '',
  )

describe('REQ-215 — the builder carries the page across a channel switch', () => {
  beforeEach(() => setBusinessScope('biz-1'))

  it('test_UAT_FC_REQ-215_switching_channel_stays_on_the_page_the_reader_was_on', async () => {
    const carry = createPageCarry({ pageState })
    const view = await load('draft', 'acme', 'about')
    carry.adopt(view.win, 'acme')

    // What the toggle resolves to — the same page in the other channel, rather
    // than the channel's front door.
    carry.capture(view.win)
    expect(previewUrl('acme', 'edit', carry.pathFor('acme'))).toBe(
      '/b/biz-1/preview/acme/edit/about',
    )
    // …and back again.
    const edit = await load('edit', 'acme', 'about')
    carry.adopt(edit.win, 'acme')
    carry.capture(edit.win)
    expect(previewUrl('acme', 'draft', carry.pathFor('acme'))).toBe(
      '/b/biz-1/preview/acme/draft/about',
    )
  })

  it('test_UAT_FC_REQ-215_switching_channel_keeps_the_readers_place_on_the_page', async () => {
    const carry = createPageCarry({ pageState })
    const view = await load('draft', 'acme')
    carry.adopt(view.win, 'acme')
    at(view, 640)
    carry.capture(view.win)

    const edit = await load('edit', 'acme')
    carry.adopt(edit.win, 'acme')
    expect(edit.scrolled).toEqual([640])
  })

  it('test_UAT_FC_REQ-215_the_modal_the_reader_opened_in_view_is_showing_in_edit', async () => {
    // The exchange the ticket was filed about, end to end: open the sign-in
    // dialog in View, switch to Edit, and the dialog is there — and the copy
    // inside it is addressable, like any other copy on the page.
    const carry = createPageCarry({ pageState })
    const view = await load('draft', 'acme')
    carry.adopt(view.win, 'acme')
    openSignIn(view)
    carry.capture(view.win)

    const edit = await load('edit', 'acme')
    carry.adopt(edit.win, 'acme')
    expect(openPanels(edit)).toEqual(['signin-panel'])
    const panel = edit.doc.getElementById('signin-panel') as HTMLElement
    expect(edit.win.getComputedStyle(panel.parentElement as Element).position).toBe('fixed')
    expect(panel.querySelector('[data-l1-segment="copy"]')).not.toBeNull()
  })

  it('test_UAT_FC_REQ-215_editing_the_copy_inside_an_open_modal_does_not_close_it', async () => {
    // A save re-renders the page and reloads the frame. The carry is the
    // builder's, not the document's, so the panel is still there afterwards —
    // which is what makes editing inside one possible at all rather than a
    // single gesture before it shuts.
    const carry = createPageCarry({ pageState })
    const view = await load('draft', 'acme')
    carry.adopt(view.win, 'acme')
    openSignIn(view)
    carry.capture(view.win)

    const edit = await load('edit', 'acme')
    carry.adopt(edit.win, 'acme')
    const reloaded = await load('edit', 'acme')
    carry.adopt(reloaded.win, 'acme')
    expect(openPanels(reloaded)).toEqual(['signin-panel'])
  })

  it('test_UAT_FC_REQ-215_following_a_link_out_of_a_panel_leaves_the_panel_behind', async () => {
    // The carry is about THIS page. A reader who followed a link out of an open
    // panel has gone somewhere else, and arriving there with the panel reopened
    // over them — or halfway down a page they have not read — would be the carry
    // acting on a page it was never about.
    const carry = createPageCarry({ pageState })
    const view = await load('draft', 'acme')
    carry.adopt(view.win, 'acme')
    openSignIn(view)
    at(view, 640)
    carry.capture(view.win)

    const elsewhere = await load('draft', 'acme', 'about')
    at(elsewhere, 900)
    carry.adopt(elsewhere.win, 'acme')
    expect(openPanels(elsewhere)).toEqual([])
    expect(elsewhere.scrolled).toEqual([0])
    // …and the pane now follows the reader, so a switch from here goes to the
    // page they are actually on.
    carry.capture(elsewhere.win)
    expect(carry.pathFor('acme')).toBe('about')
  })

  it('test_UAT_FC_REQ-215_another_sites_page_is_not_this_page_in_another_state', async () => {
    const carry = createPageCarry({ pageState })
    const view = await load('draft', 'acme', 'about')
    carry.adopt(view.win, 'acme')
    openSignIn(view)
    at(view, 640)
    carry.capture(view.win)

    // The pane re-derives its src DURING the site change, when the site has
    // already moved and the document has not — so a carry that answered for any
    // site would put one site's page at another site's path.
    expect(carry.pathFor('other')).toBe('')

    const other = await load('draft', 'other')
    at(other, 900)
    carry.adopt(other.win, 'other')
    expect(openPanels(other)).toEqual([])
    // The top of the new site's page — not the offset the last one was at.
    expect(other.scrolled).toEqual([0])
  })

  it('test_UAT_FC_REQ-215_the_chrome_can_choose_which_panel_the_edit_render_shows', async () => {
    // The escape hatch and the entrance: a panel reproduced in Edit covers the
    // page and every control in that render is inert, so choosing "no panel" has
    // to be reachable from the chrome — and choosing one is how you edit the
    // copy inside a modal you never opened in View.
    const carry = createPageCarry({ pageState })
    const edit = await load('edit', 'acme')
    carry.adopt(edit.win, 'acme')
    expect(carry.listDialogs(edit.doc)).toEqual([
      { id: 'signin-panel', label: 'Please enter your email address' },
    ])

    carry.setOpenDialog('signin-panel')
    carry.apply(edit.win)
    expect(openPanels(edit)).toEqual(['signin-panel'])
    expect(carry.openDialog()).toBe('signin-panel')

    // …and it applies to the document already loaded, so the operator does not
    // lose their place to see the panel appear, or to leave it.
    carry.setOpenDialog('')
    carry.apply(edit.win)
    expect(openPanels(edit)).toEqual([])
  })
})
