/**
 * REQ-212 UATs — "Modals in L1: the overlay role and the disclosure verb".
 *
 * The two boundaries are the envelope validator (`validateL1`) and the sole
 * markup/CSS emitter (`renderL1Document`) — the pair every other L1 file probes.
 * Where an AC is about what the reader can actually DO, the published page is
 * parsed and driven in jsdom: it implements focus, keyboard events and attribute
 * state, which is the whole of what the vetted script touches.
 *
 * Acceptance covered, in the ticket's order:
 *
 *   AC-1   `dialog` is carried by `box` / `container` and refused elsewhere
 *   AC-2   `action` is carried by `box` / `container` / `text` and refused elsewhere
 *   AC-3   a panel with no `id` is refused
 *   AC-4   an action naming neither verb, or both, is refused
 *   AC-5   an action naming a non-panel, or nothing at all, is refused
 *   AC-6   a node carrying both `link` and `action` is refused
 *   AC-7   an action node retags to a button and carries the disclosure ARIA
 *   AC-8   a panel carries the dialog role, its modality and its name
 *   AC-9   the scrim, the placement and the panel's paint all come from the document
 *   AC-10  a page with a modal ships the script once; a page without ships none
 *   AC-11  the script carries no value taken from the document
 *   AC-12  the edit render ships no script and no acting attribute
 *   AC-13  the overlay is gated on a marker only the script sets
 *   AC-14  a panel's scroll entrance is not emitted (it could never fire)
 *
 * plus the behaviour the script owns, driven end to end: opening, closing,
 * Escape, the scrim click, the two opt-outs, focus in, focus back, the Tab trap
 * and the scroll lock.
 */
import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  l1BoxSchema,
  l1ContainerSchema,
  l1ControlSchema,
  l1ImageSchema,
  l1SlotSchema,
  l1TextSchema,
  validateL1,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { renderL1Document, L1_DIALOG_SCRIPT, L1_DIALOG_CSS } from '../packages/framework/src/index'

const WIDTHS = [320, 768, 1440]

const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })
const render = (root: L1Node): { html: string; css: string; js?: string } =>
  renderL1Document(doc(root))

/** The messages a rejected document reported, joined for substring assertions. */
const refusals = (root: L1Node): string => {
  const result = validateL1(doc(root))
  return result.ok ? '' : result.errors.map((e) => `${e.path}: ${e.message}`).join('\n')
}

/** The sign-in shape the ticket describes: a trigger, a panel, a way out. */
const signInPage = (): L1Node => ({
  kind: 'container',
  layout: 'stack',
  children: [
    {
      kind: 'text',
      id: 'signin-link',
      text: 'Sign in',
      action: { opens: 'signin-panel' },
    },
    {
      kind: 'container',
      id: 'signin-panel',
      layout: 'stack',
      dialog: {
        backdrop: { color: '#000000', opacity: 0.5 },
        placement: 'center',
        ariaLabel: 'Sign in',
      },
      axes: { surfaceFill: '#ffffff', borderRadiusPx: 12 },
      children: [
        { kind: 'text', text: 'Please enter your email address' },
        { kind: 'box', id: 'signin-field', children: [] },
        { kind: 'text', id: 'signin-continue', text: 'Continue' },
        { kind: 'text', id: 'signin-close', text: 'Close', action: { closes: 'signin-panel' } },
      ],
    },
  ],
})

/**
 * The published page, in a browser that runs its inline script.
 *
 * `runScripts: 'dangerously'` is what makes these end-to-end rather than
 * markup assertions: the script under test is the one the renderer emitted, in
 * the markup the renderer emitted, with nothing stubbed.
 */
async function drive(root: L1Node): Promise<{ dom: JSDOM; doc: Document }> {
  const { html, css } = render(root)
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`,
    { runScripts: 'dangerously' },
  )
  // The script wires itself on `DOMContentLoaded`, which jsdom delivers on a
  // later turn of the loop than the constructor returns on. Yielding once here is
  // what makes every assertion below about the WIRED page rather than a race.
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0))
  return { dom, doc: dom.window.document }
}

const click = (dom: JSDOM, el: Element): void => {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
}
const key = (dom: JSDOM, k: string, init: Record<string, unknown> = {}): void => {
  dom.window.document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }),
  )
}

describe('REQ-212 — what the vocabulary accepts', () => {
  it('test_UAT_FC_REQ-212_a_box_and_a_container_may_present_as_an_overlay', () => {
    const dialog = { placement: 'center' as const }
    expect(l1BoxSchema.safeParse({ kind: 'box', id: 'p', dialog, children: [] }).success).toBe(true)
    expect(
      l1ContainerSchema.safeParse({ kind: 'container', id: 'p', layout: 'stack', dialog, children: [] })
        .success,
    ).toBe(true)
  })

  it('test_UAT_FC_REQ-212_a_leaf_that_holds_nothing_cannot_present_as_an_overlay', () => {
    // A modal panel always frames content, so the role is offered only to the two
    // kinds that hold children. `.strict()` is what refuses the rest.
    const dialog = { placement: 'center' as const }
    expect(l1TextSchema.safeParse({ kind: 'text', id: 'p', text: 'x', dialog }).success).toBe(false)
    expect(
      l1ImageSchema.safeParse({ kind: 'image', id: 'p', src: '/a.png', alt: 'a', dialog }).success,
    ).toBe(false)
    expect(l1ControlSchema.safeParse({ kind: 'control', control: 'submit', dialog }).success).toBe(
      false,
    )
    expect(l1SlotSchema.safeParse({ kind: 'slot', name: 'form', dialog }).success).toBe(false)
  })

  it('test_UAT_FC_REQ-212_the_kinds_a_reader_activates_may_carry_the_verb', () => {
    const action = { opens: 'p' }
    expect(l1TextSchema.safeParse({ kind: 'text', text: 'Sign in', action }).success).toBe(true)
    expect(l1BoxSchema.safeParse({ kind: 'box', action, children: [] }).success).toBe(true)
    expect(
      l1ContainerSchema.safeParse({ kind: 'container', layout: 'stack', action, children: [] })
        .success,
    ).toBe(true)
  })

  it('test_UAT_FC_REQ-212_a_picture_a_control_and_a_seam_cannot_carry_the_verb', () => {
    // A void element cannot be a button, and wrapping one would move focus off the
    // element the author styled — the REQ-99 focus ring with it. A `control` is
    // already the module's element, and a `slot` is a mount point.
    const action = { opens: 'p' }
    expect(
      l1ImageSchema.safeParse({ kind: 'image', src: '/a.png', alt: 'a', action }).success,
    ).toBe(false)
    expect(l1ControlSchema.safeParse({ kind: 'control', control: 'submit', action }).success).toBe(
      false,
    )
    expect(l1SlotSchema.safeParse({ kind: 'slot', name: 'form', action }).success).toBe(false)
  })
})

describe('REQ-212 — what the envelope refuses', () => {
  it('test_UAT_FC_REQ-212_a_panel_with_no_identifier_is_refused', () => {
    const said = refusals({
      kind: 'box',
      dialog: { placement: 'center' },
      children: [],
    })
    expect(said).toContain('must declare an `id`')
  })

  it('test_UAT_FC_REQ-212_an_action_must_name_exactly_one_verb', () => {
    const neither = refusals({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'x', action: {} },
        { kind: 'box', id: 'p', dialog: {}, children: [] },
      ],
    })
    expect(neither).toContain('exactly one of `opens` / `closes`')

    const both = refusals({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'x', action: { opens: 'p', closes: 'p' } },
        { kind: 'box', id: 'p', dialog: {}, children: [] },
      ],
    })
    expect(both).toContain('exactly one of `opens` / `closes`')
  })

  it('test_UAT_FC_REQ-212_an_action_naming_no_node_at_all_is_refused', () => {
    const said = refusals({
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'text', text: 'Sign in', action: { opens: 'nowhere' } }],
    })
    expect(said).toContain('must name a node that carries `dialog`')
    expect(said).toContain('names no node')
  })

  it('test_UAT_FC_REQ-212_an_action_naming_a_node_that_is_not_a_panel_is_refused', () => {
    // The distinction matters to the author: "there is no such id" and "that id is
    // not a panel" are different mistakes with different fixes.
    const said = refusals({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'Sign in', action: { opens: 'footer' } },
        { kind: 'box', id: 'footer', children: [] },
      ],
    })
    expect(said).toContain('carries no `dialog`')
  })

  it('test_UAT_FC_REQ-212_a_node_cannot_both_navigate_and_act', () => {
    const said = refusals({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'Sign in', link: { href: '/in' }, action: { opens: 'p' } },
        { kind: 'box', id: 'p', dialog: {}, children: [] },
      ],
    })
    expect(said).toContain('cannot carry both `link` and `action`')
  })

  it('test_UAT_FC_REQ-212_the_sign_in_page_the_ticket_describes_validates', () => {
    expect(validateL1(doc(signInPage())).ok).toBe(true)
  })
})

describe('REQ-212 — what the renderer emits', () => {
  it('test_UAT_FC_REQ-212_an_acting_node_becomes_a_button_keeping_its_own_class', () => {
    const { html } = render(signInPage())
    const trigger = /<button([^>]*)id="signin-link"([^>]*)>/.exec(html)
    expect(trigger).not.toBeNull()
    const attrs = `${trigger![1]}${trigger![2]}`
    // The retag, not a wrap: the node's own generated class rides on the button.
    expect(attrs).toMatch(/class="l1-\d+"/)
    expect(attrs).toContain('type="button"')
    expect(attrs).toContain('aria-haspopup="dialog"')
    expect(attrs).toContain('aria-controls="signin-panel"')
    // The server renders the panel OPEN, so the control's state starts honest.
    expect(attrs).toContain('aria-expanded="true"')
    expect(attrs).toContain('data-l1-opens="signin-panel"')
  })

  it('test_UAT_FC_REQ-212_a_closing_node_is_a_button_that_is_not_a_disclosure', () => {
    const { html } = render(signInPage())
    const close = /<button([^>]*)id="signin-close"([^>]*)>/.exec(html)
    expect(close).not.toBeNull()
    const attrs = `${close![1]}${close![2]}`
    expect(attrs).toContain('type="button"')
    expect(attrs).toContain('data-l1-closes="signin-panel"')
    // A Close is not the thing that reveals the panel, so it claims neither.
    expect(attrs).not.toContain('aria-haspopup')
    expect(attrs).not.toContain('aria-expanded')
  })

  it('test_UAT_FC_REQ-212_a_panel_carries_the_dialog_role_its_modality_and_its_name', () => {
    const { html } = render(signInPage())
    const panel = /<div([^>]*)id="signin-panel"([^>]*)>/.exec(html)
    expect(panel).not.toBeNull()
    const attrs = `${panel![1]}${panel![2]}`
    expect(attrs).toContain('role="dialog"')
    expect(attrs).toContain('aria-modal="true"')
    // Somewhere for focus to land in a panel holding nothing focusable.
    expect(attrs).toContain('tabindex="-1"')
    expect(attrs).toContain('aria-label="Sign in"')
  })

  it('test_UAT_FC_REQ-212_the_shell_wraps_the_panel_rather_than_replacing_it', () => {
    const { html } = render(signInPage())
    // The panel keeps its own element and every axis on it; the shell does only
    // the covering. The panel's fill is still the panel's.
    expect(html).toMatch(/<div class="l1-dlg l1-\d+-dlg" data-l1-dialog="signin-panel">/)
    const { css } = render(signInPage())
    expect(css).toMatch(/\.l1-\d+ \{[^}]*background-color: #ffffff/)
  })

  it('test_UAT_FC_REQ-212_the_scrim_and_the_placement_come_from_the_document', () => {
    const { css } = render(signInPage())
    // 50% of #000000 → the eight-digit form the rest of L1's colour axes use.
    expect(css).toMatch(
      /html\[data-l1-dialog-ready\] \.l1-\d+-dlg\[data-l1-open\] \{[^}]*background-color: #00000080/,
    )
    expect(css).toMatch(
      /html\[data-l1-dialog-ready\] \.l1-\d+-dlg\[data-l1-open\] \{[^}]*justify-content: center/,
    )
  })

  it('test_UAT_FC_REQ-212_placement_moves_the_panel_within_the_covered_viewport', () => {
    const panel = (placement: 'center' | 'top' | 'bottom'): string =>
      render({ kind: 'box', id: 'p', dialog: { placement }, children: [] }).css
    expect(panel('top')).toContain('justify-content: flex-start')
    expect(panel('bottom')).toContain('justify-content: flex-end')
    expect(panel('center')).toContain('justify-content: center')
  })

  it('test_UAT_FC_REQ-212_a_panel_with_no_scrim_dims_nothing', () => {
    const { css } = render({ kind: 'box', id: 'p', dialog: {}, children: [] })
    expect(css).not.toContain('background-color: #000000')
  })

  it('test_UAT_FC_REQ-212_the_overlay_is_gated_on_a_marker_only_the_script_sets', () => {
    const { css } = render(signInPage())
    // Every rule that covers the page is behind the marker; unenhanced, the shell
    // contributes no box at all, so the panel lays out as an ordinary part of the
    // page. Failing VISIBLE is the whole discipline.
    expect(css).toContain('.l1-dlg { display: contents }')
    for (const rule of css.split('\n').filter((r) => r.includes('position: fixed'))) {
      expect(rule).toContain('html[data-l1-dialog-ready]')
    }
    expect(L1_DIALOG_CSS).toContain('html[data-l1-dialog-lock], html[data-l1-dialog-lock] body')
  })

  it('test_UAT_FC_REQ-212_a_page_with_a_modal_ships_the_script_once', () => {
    const { html, js } = render(signInPage())
    expect(js).toContain(L1_DIALOG_SCRIPT)
    expect(html.split('data-l1-dialog-ready').length - 1).toBeGreaterThan(0)
    // Two panels, still one script.
    const two = render({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'box', id: 'a', dialog: {}, children: [] },
        { kind: 'box', id: 'b', dialog: {}, children: [] },
      ],
    })
    expect(two.js!.split('function tabbable').length - 1).toBe(1)
    // …and one copy of the invariant stylesheet.
    expect(two.css.split('.l1-dlg { display: contents }').length - 1).toBe(1)
  })

  it('test_UAT_FC_REQ-212_a_page_with_no_modal_ships_no_modal_script', () => {
    const { html, js } = render({ kind: 'text', text: 'Hello' })
    expect(js).toBeUndefined()
    expect(html).not.toContain('data-l1-dialog')
  })

  it('test_UAT_FC_REQ-212_the_script_carries_no_value_taken_from_the_document', () => {
    // Vetted once, byte-identical for every site: every colour, placement, label
    // and opt-out the author wrote is compiled into the stylesheet or into a
    // boolean attribute, never into the script.
    const a = render(signInPage()).js!
    const b = render({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', text: 'Open', action: { opens: 'other' } },
        {
          kind: 'box',
          id: 'other',
          dialog: { backdrop: { color: '#123456', opacity: 0.9 }, placement: 'bottom' },
          axes: { surfaceFill: '#abcdef' },
          children: [],
        },
      ],
    }).js!
    expect(a).toBe(b)
    for (const value of ['signin-panel', 'Sign in', '#000000', '#123456', 'other']) {
      expect(a).not.toContain(value)
    }
  })

  it('test_UAT_FC_REQ-212_the_edit_render_ships_no_script_and_no_acting_attribute', () => {
    const { html, css, js } = renderL1Document(doc(signInPage()), { edit: true })
    expect(js).toBeUndefined()
    // The element, the class and the box are kept; only what would ACT is gone —
    // exactly as a link keeps its `<a>` and loses its `href`.
    expect(html).toContain('<button')
    expect(html).not.toContain('data-l1-opens')
    expect(html).not.toContain('data-l1-closes')
    // [[REQ-215]] SUPERSEDES §5.7's "no shell, no role". The shell, the id and
    // the role are emitted in every channel, because without them the edit
    // render holds nothing a channel switch could tell "you are open" — and
    // emitting them costs this channel nothing, since every overlay rule is
    // gated on a marker only a script (or the builder carrying state in) sets.
    // What still makes the render inert is what is asserted above: no script,
    // and no attribute that would act.
    expect(html).toContain('data-l1-dialog="signin-panel"')
    expect(html).toContain('role="dialog"')
    // …and with nobody having said otherwise, it still lays out in flow: the
    // shell contributes no box until the ready marker is set.
    expect(css).toContain('.l1-dlg { display: contents }')
    expect(css).toContain('html[data-l1-dialog-ready] .l1-dlg { display: none }')
  })

  it('test_UAT_FC_REQ-212_a_panels_scroll_entrance_is_not_emitted', () => {
    // A panel that starts closed never intersects, so a reveal on it could never
    // fire and REQ-100's pre-state rule would leave it invisible inside a modal
    // that opens onto nothing. The emitter declines the axis that cannot work.
    const { css, js } = render({
      kind: 'box',
      id: 'p',
      dialog: {},
      reveal: { yPx: 24, fromOpacity: 0 },
      children: [{ kind: 'text', text: 'hi' }],
    })
    expect(css).not.toContain('l1-rv')
    expect(js).not.toContain('IntersectionObserver')
  })

  it('test_UAT_FC_REQ-212_a_document_declaring_no_modal_renders_as_it_did_before', () => {
    const plain: L1Node = {
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'text', text: 'Hello', link: { href: '/x' } }],
    }
    const { html, css } = render(plain)
    expect(html).not.toContain('l1-dlg')
    expect(css).not.toContain('l1-dlg')
    // The link still retags exactly as it did: an `<a>` keeping the node's class,
    // and (BUG-30) a root-relative path published relocatable.
    expect(html).toMatch(/<a class="l1-\d+" href="x">Hello<\/a>/)
  })
})

describe('REQ-212 — what the reader can do', () => {
  let dom: JSDOM
  let d: Document

  beforeEach(async () => {
    const driven = await drive(signInPage())
    dom = driven.dom
    d = driven.doc
  })

  const shell = (): Element => d.querySelector('[data-l1-dialog="signin-panel"]')!
  const trigger = (): HTMLElement => d.getElementById('signin-link')!
  const isOpen = (): boolean => shell().hasAttribute('data-l1-open')

  it('test_UAT_FC_REQ-212_the_script_folds_the_panel_away_and_tells_the_truth_about_it', () => {
    // The server rendered it open; the script marks the document, closes it, and
    // corrects the control it just made inaccurate.
    expect(d.documentElement.hasAttribute('data-l1-dialog-ready')).toBe(true)
    expect(isOpen()).toBe(false)
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
  })

  it('test_UAT_FC_REQ-212_the_trigger_opens_the_panel_and_focus_goes_into_it', () => {
    click(dom, trigger())
    expect(isOpen()).toBe(true)
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    // First focusable inside the panel — the Close button, the only one here.
    expect(d.activeElement?.id).toBe('signin-close')
  })

  it('test_UAT_FC_REQ-212_closing_returns_focus_to_whatever_opened_it', () => {
    click(dom, trigger())
    click(dom, d.getElementById('signin-close')!)
    expect(isOpen()).toBe(false)
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(d.activeElement?.id).toBe('signin-link')
  })

  it('test_UAT_FC_REQ-212_escape_closes_the_panel', () => {
    click(dom, trigger())
    key(dom, 'Escape')
    expect(isOpen()).toBe(false)
    expect(d.activeElement?.id).toBe('signin-link')
  })

  it('test_UAT_FC_REQ-212_a_click_on_the_scrim_closes_and_a_click_inside_does_not', () => {
    click(dom, trigger())
    click(dom, d.getElementById('signin-panel')!)
    expect(isOpen()).toBe(true)
    click(dom, shell())
    expect(isOpen()).toBe(false)
  })

  it('test_UAT_FC_REQ-212_the_page_behind_does_not_scroll_while_a_panel_is_open', () => {
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(false)
    click(dom, trigger())
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(true)
    key(dom, 'Escape')
    expect(d.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(false)
  })

  it('test_UAT_FC_REQ-212_tab_cannot_leave_the_open_panel', async () => {
    const trapped = await drive({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', id: 'open', text: 'Open', action: { opens: 'p' } },
        { kind: 'text', id: 'outside', text: 'Elsewhere', link: { href: '/x' } },
        {
          kind: 'container',
          id: 'p',
          layout: 'stack',
          dialog: {},
          children: [
            { kind: 'text', id: 'first', text: 'One', action: { closes: 'p' } },
            { kind: 'text', id: 'last', text: 'Two', action: { closes: 'p' } },
          ],
        },
      ],
    })
    const td = trapped.doc
    click(trapped.dom, td.getElementById('open')!)
    expect(td.activeElement?.id).toBe('first')

    // Forward off the end wraps to the start; backward off the start wraps to the end.
    td.getElementById('last')!.focus()
    key(trapped.dom, 'Tab')
    expect(td.activeElement?.id).toBe('first')
    key(trapped.dom, 'Tab', { shiftKey: true })
    expect(td.activeElement?.id).toBe('last')

    // And focus that has escaped entirely is pulled back in.
    td.getElementById('outside')!.focus()
    key(trapped.dom, 'Tab')
    expect(td.activeElement?.id).toBe('first')
  })

  it('test_UAT_FC_REQ-212_a_panel_may_decline_the_two_dismissals_it_owns', async () => {
    // The default is ON — a modal that cannot be escaped and cannot be clicked
    // away is a trap, so the author has to say so deliberately.
    const stubborn = await drive({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', id: 'open', text: 'Open', action: { opens: 'p' } },
        {
          kind: 'container',
          id: 'p',
          layout: 'stack',
          dialog: { dismissOnEscape: false, dismissOnBackdrop: false },
          children: [{ kind: 'text', id: 'x', text: 'Close', action: { closes: 'p' } }],
        },
      ],
    })
    const sd = stubborn.doc
    const sShell = (): Element => sd.querySelector('[data-l1-dialog="p"]')!
    click(stubborn.dom, sd.getElementById('open')!)
    expect(sShell().hasAttribute('data-l1-open')).toBe(true)

    key(stubborn.dom, 'Escape')
    expect(sShell().hasAttribute('data-l1-open')).toBe(true)
    click(stubborn.dom, sShell())
    expect(sShell().hasAttribute('data-l1-open')).toBe(true)

    // The way out the document DID author still works.
    click(stubborn.dom, sd.getElementById('x')!)
    expect(sShell().hasAttribute('data-l1-open')).toBe(false)
  })

  it('test_UAT_FC_REQ-212_two_panels_open_and_close_independently', async () => {
    const pair = await drive({
      kind: 'container',
      layout: 'stack',
      children: [
        { kind: 'text', id: 'open-a', text: 'A', action: { opens: 'a' } },
        { kind: 'text', id: 'open-b', text: 'B', action: { opens: 'b' } },
        { kind: 'box', id: 'a', dialog: {}, children: [] },
        { kind: 'box', id: 'b', dialog: {}, children: [] },
      ],
    })
    const pd = pair.doc
    const open = (id: string): boolean =>
      pd.querySelector(`[data-l1-dialog="${id}"]`)!.hasAttribute('data-l1-open')

    click(pair.dom, pd.getElementById('open-a')!)
    expect([open('a'), open('b')]).toEqual([true, false])
    expect(pd.getElementById('open-b')!.getAttribute('aria-expanded')).toBe('false')

    click(pair.dom, pd.getElementById('open-b')!)
    expect([open('a'), open('b')]).toEqual([true, true])

    key(pair.dom, 'Escape')
    // The lock only lifts once nothing is open at all.
    expect(pd.documentElement.hasAttribute('data-l1-dialog-lock')).toBe(true)
  })
})
