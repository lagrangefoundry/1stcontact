/**
 * [[REQ-215]] UATs — **switching channel must preserve what the page is
 * showing**, the framework's half.
 *
 * The rule the ticket states is one sentence: switching between View and Edit
 * shows the same page in the same state. This file covers the part of it that
 * lives in `packages/framework` — what the edit render now carries, and the two
 * ways a page is put back into a state.
 *
 * Both channels are driven through `jsdom` rather than asserted as strings
 * wherever the criterion is about what the reader would SEE. The draft page runs
 * the renderer's own inline script (`runScripts: 'dangerously'`), so "the opener
 * is activated" is the real script doing the real opening rather than a
 * reconstruction of it — which is precisely the distinction the design turns on.
 *
 * Acceptance covered, in the ticket's order:
 *
 *   AC-3   the edit render emits the shell, the role, the id and the stylesheet,
 *          and still no script and no acting attribute
 *   AC-4   with nothing telling it otherwise the panel lies in flow, settled
 *   AC-5   a page's state reads as the open panels plus the scroll offset
 *   AC-6   applying a state to an edit document opens exactly those panels
 *   AC-7   applying a state to a draft document activates the opening control
 *   AC-8   read on one channel, applied to the other, round-trips
 *   AC-12  a behaviour module's own panel is untouched
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import {
  applyL1PageState,
  listL1Dialogs,
  readL1PageState,
  renderL1Document,
} from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]
const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })

/** The sign-in shape the ticket was filed about: a trigger, a panel, a way out. */
const signInPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    { kind: 'text', id: 'signin-link', text: 'Sign in', action: { opens: 'signin-panel' } },
    {
      kind: 'container',
      id: 'signin-panel',
      layout: 'stack',
      dialog: { backdrop: { color: '#000000', opacity: 0.5 }, placement: 'center' },
      axes: { surfaceFill: '#ffffff' },
      children: [
        { kind: 'text', text: 'Please enter your email address' },
        { kind: 'text', id: 'signin-close', text: 'Close', action: { closes: 'signin-panel' } },
      ],
    },
    {
      kind: 'box',
      id: 'terms-panel',
      dialog: {},
      axes: { surfaceFill: '#eeeeee' },
      children: [{ kind: 'text', text: 'Terms' }],
    },
    { kind: 'text', id: 'terms-link', text: 'Terms', action: { opens: 'terms-panel' } },
  ],
})

/**
 * One channel's render, in a browser.
 *
 * The edit channel's body carries the marker the page assembler writes, because
 * that one attribute is how everything downstream — the edit bridge, and now the
 * state applier — tells the two channels apart.
 */
async function load(channel: 'draft' | 'edit', root: L1Node = signInPage()): Promise<JSDOM> {
  const { html, css } = renderL1Document(doc(root), { edit: channel === 'edit' })
  const body = channel === 'edit' ? '<body data-fc-edit>' : '<body>'
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head>${body}${html}</body></html>`,
    { runScripts: 'dangerously' },
  )
  // The draft script wires on `DOMContentLoaded`, a later turn of the loop than
  // the constructor returns on. Yielding is what makes these assertions about
  // the wired page rather than a race.
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0))
  return dom
}

const shellFor = (d: Document, id: string): Element =>
  [...d.querySelectorAll('[data-l1-dialog]')].find((s) => s.getAttribute('data-l1-dialog') === id)!

describe('REQ-215 — what the edit render now carries', () => {
  it('test_UAT_FC_REQ-215_the_edit_render_carries_the_panel_it_used_to_drop', () => {
    const { html, css, js } = renderL1Document(doc(signInPage()), { edit: true })

    // The handle a channel switch needs: the covering shell, its id, and the
    // panel's own role. Without these there is nothing in the document that
    // could be told "you are open".
    expect(html).toContain('data-l1-dialog="signin-panel"')
    expect(html).toContain('class="l1-dlg')
    expect(html).toContain('role="dialog"')
    // …and the stylesheet that lays it out, so a panel reproduced here lands
    // where it lands in View rather than somewhere the operator styles against.
    expect(css).toContain('html[data-l1-dialog-ready] .l1-dlg[data-l1-open]')
    expect(css).toContain('position: fixed')

    // What is still withheld is exactly what would give a click a second
    // meaning: the behaviour, and the attribute that acts.
    expect(js).toBeUndefined()
    expect(html).not.toContain('data-l1-opens')
    expect(html).not.toContain('data-l1-closes')
  })

  it('test_UAT_FC_REQ-215_an_edit_render_nobody_has_told_anything_lies_in_flow', async () => {
    // The settled render is the honest answer when nothing has said what state
    // the page was in — an edit URL opened on its own, in its own tab. Every
    // overlay rule is gated on a marker only a script or the builder sets, so
    // the shell contributes no box and the panel is an ordinary part of the page.
    const dom = await load('edit')
    const d = dom.window.document
    expect(d.documentElement.hasAttribute('data-l1-dialog-ready')).toBe(false)
    expect(shellFor(d, 'signin-panel').hasAttribute('data-l1-open')).toBe(false)
    expect(dom.window.getComputedStyle(shellFor(d, 'signin-panel')).display).toBe('contents')
  })
})

describe('REQ-215 — reading what the page is showing', () => {
  it('test_UAT_FC_REQ-215_a_page_nobody_has_touched_has_no_panel_open', async () => {
    for (const channel of ['draft', 'edit'] as const) {
      const dom = await load(channel)
      expect(readL1PageState(dom.window as unknown as Window)).toEqual({ dialogs: [], scrollY: 0 })
    }
  })

  it('test_UAT_FC_REQ-215_a_reader_who_opened_a_panel_is_read_as_showing_it', async () => {
    const dom = await load('draft')
    const d = dom.window.document
    d.getElementById('signin-link')!.dispatchEvent(
      new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }),
    )
    expect(readL1PageState(dom.window as unknown as Window).dialogs).toEqual(['signin-panel'])
  })

  it('test_UAT_FC_REQ-215_the_panels_a_page_declares_are_named_from_the_render', async () => {
    const dom = await load('edit')
    // Read from the DOCUMENT, so chrome offering a choice needs nothing new from
    // the renderer. The label is what is inside the panel, never the author's
    // slug, unless there is nothing else to call it.
    expect(listL1Dialogs(dom.window.document)).toEqual([
      { id: 'signin-panel', label: 'Please enter your email address' },
      { id: 'terms-panel', label: 'Terms' },
    ])
  })
})

describe('REQ-215 — putting a page into a state', () => {
  it('test_UAT_FC_REQ-215_the_edit_render_is_told_which_panel_is_open', async () => {
    const dom = await load('edit')
    const d = dom.window.document
    applyL1PageState(dom.window as unknown as Window, { dialogs: ['signin-panel'], scrollY: 0 })

    // The named panel is an overlay, laid out by the same gated rules the draft
    // render lays it out by — which is what "the geometry must match" means.
    expect(d.documentElement.hasAttribute('data-l1-dialog-ready')).toBe(true)
    expect(shellFor(d, 'signin-panel').hasAttribute('data-l1-open')).toBe(true)
    expect(dom.window.getComputedStyle(shellFor(d, 'signin-panel')).position).toBe('fixed')
    // Every other panel is closed, and the page behind does not scroll.
    expect(shellFor(d, 'terms-panel').hasAttribute('data-l1-open')).toBe(false)
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(true)
  })

  it('test_UAT_FC_REQ-215_an_edit_render_told_nothing_is_open_shows_a_closed_panel', async () => {
    // The rule, in its least dramatic case: looking at the home page in View
    // with nothing open, switching to Edit shows the home page with nothing
    // open — not the settled in-flow panel the channel falls back to.
    const dom = await load('edit')
    const d = dom.window.document
    applyL1PageState(dom.window as unknown as Window, { dialogs: [], scrollY: 0 })
    expect(d.documentElement.hasAttribute('data-l1-dialog-ready')).toBe(true)
    expect(dom.window.getComputedStyle(shellFor(d, 'signin-panel')).display).toBe('none')
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(false)
  })

  it('test_UAT_FC_REQ-215_the_draft_render_is_driven_by_its_own_control', async () => {
    const dom = await load('draft')
    const d = dom.window.document
    applyL1PageState(dom.window as unknown as Window, { dialogs: ['signin-panel'], scrollY: 0 })

    // The page's OWN script did the opening, which is the whole difference:
    // everything it owns is true afterwards, and none of it would be if the
    // marker had merely been set by hand.
    expect(shellFor(d, 'signin-panel').hasAttribute('data-l1-open')).toBe(true)
    expect(d.getElementById('signin-link')!.getAttribute('aria-expanded')).toBe('true')
    expect(d.getElementById('signin-panel')!.contains(d.activeElement)).toBe(true)
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(true)
  })

  it('test_UAT_FC_REQ-215_a_draft_panel_that_should_be_closed_is_closed_by_its_own_control', async () => {
    const dom = await load('draft')
    const d = dom.window.document
    applyL1PageState(dom.window as unknown as Window, { dialogs: ['signin-panel'], scrollY: 0 })
    applyL1PageState(dom.window as unknown as Window, { dialogs: [], scrollY: 0 })
    expect(shellFor(d, 'signin-panel').hasAttribute('data-l1-open')).toBe(false)
    expect(d.getElementById('signin-link')!.getAttribute('aria-expanded')).toBe('false')
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(false)
  })

  it('test_UAT_FC_REQ-215_the_state_read_from_one_channel_reproduces_in_the_other', async () => {
    // The round trip the operator actually performs: open the panel in View,
    // switch to Edit, and find the same page in the same state — with the copy
    // inside the panel addressable, like any other copy on the page.
    const view = await load('draft')
    view.window.document.getElementById('signin-link')!.dispatchEvent(
      new view.window.MouseEvent('click', { bubbles: true, cancelable: true }),
    )
    const carried = readL1PageState(view.window as unknown as Window)

    const edit = await load('edit')
    applyL1PageState(edit.window as unknown as Window, carried)
    expect(readL1PageState(edit.window as unknown as Window)).toEqual(carried)

    const panel = edit.window.document.getElementById('signin-panel')!
    expect(edit.window.getComputedStyle(panel.parentElement!).position).toBe('fixed')
    // …and it is editable, because the edit channel stamped it like anything else.
    expect(panel.querySelector('[data-l1-segment="copy"]')).not.toBeNull()

    // …and back again: what Edit is showing reproduces in View.
    const back = await load('draft')
    applyL1PageState(back.window as unknown as Window, readL1PageState(edit.window as unknown as Window))
    expect(readL1PageState(back.window as unknown as Window).dialogs).toEqual(['signin-panel'])
  })
})

describe('REQ-215 — what the mechanism deliberately does not reach', () => {
  it('test_UAT_FC_REQ-215_a_behaviour_modules_own_panel_keeps_its_settled_state', () => {
    // The handle is the L1 dialog role's id and only that. A module that hides
    // content behind its own behaviour has no id in this namespace, and the
    // channel must not need to know what an `account-chrome` is — so it is not
    // listed, not read, and not touched.
    const dom = new JSDOM(
      `<!doctype html><html><body data-fc-edit>
         <section class="account-chrome"><div class="account-chrome__dialog">Sign in</div></section>
       </body></html>`,
    )
    expect(listL1Dialogs(dom.window.document)).toEqual([])
    applyL1PageState(dom.window as unknown as Window, { dialogs: [], scrollY: 0 })
    expect(dom.window.document.querySelector('.account-chrome__dialog')?.hasAttribute('hidden')).toBe(
      false,
    )
  })
})
