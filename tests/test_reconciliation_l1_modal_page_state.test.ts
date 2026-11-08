/**
 * Reconciliation UATs for story-e214a00d — L1 Modals, the REQ-215 half: what the
 * edit render carries for a modal, and reading / applying a page's state across
 * the View/Edit switch (bundle-7ba3af93).
 *
 * One test per acceptance criterion: AC-2436 (amended), AC-2491 … AC-2495.
 *
 * Boundaries: the sole emitter (`renderL1Document`, draft and edit channels) and
 * the framework's page-state entry points (`readL1PageState`, `applyL1PageState`,
 * `listL1Dialogs`, `L1_INITIAL_PAGE_STATE`) run against the rendered document in
 * jsdom. The draft page runs its own emitted dialog script, unstubbed. The only
 * thing simulated is the scroll position, because jsdom has no layout: a scroll
 * offset is set on the window, and `scrollTo` is observed, not replaced in
 * behaviour the module depends on.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import {
  L1_DIALOG_CSS,
  L1_DIALOG_SCRIPT,
  L1_EDIT_MARKER_ATTR,
  L1_INITIAL_PAGE_STATE,
  applyL1PageState,
  listL1Dialogs,
  readL1PageState,
  renderL1Document,
} from '../packages/framework/src/index'
import { accountChrome } from '../packages/framework/src/modules/account-chrome/component'

const WIDTHS = [320, 768, 1440]
const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })
type Channel = 'draft' | 'edit'

const stack = (...children: L1Node[]): L1Node => ({ kind: 'container', layout: 'stack', children })

/** Two panels: `signin` has its own Close, `terms` has none. */
const page = (termsDialog: Record<string, unknown> = {}): L1Node =>
  stack(
    { kind: 'text', id: 'signin-open', text: 'Sign in', action: { opens: 'signin' } } as L1Node,
    {
      kind: 'container',
      id: 'signin',
      layout: 'stack',
      dialog: { backdrop: { color: '#000000', opacity: 0.5 }, placement: 'center', ariaLabel: 'Sign in' },
      axes: { surfaceFill: '#ffffff' },
      children: [
        { kind: 'text', text: 'Please enter your email address' },
        { kind: 'text', id: 'signin-close', text: 'Close', action: { closes: 'signin' } },
      ],
    } as L1Node,
    { kind: 'text', id: 'terms-open', text: 'Terms', action: { opens: 'terms' } } as L1Node,
    {
      kind: 'box',
      id: 'terms',
      dialog: termsDialog,
      axes: { surfaceFill: '#eeeeee' },
      children: [{ kind: 'text', text: 'Our terms' }],
    } as L1Node,
  )

/** One channel's render loaded in a browser; the draft runs its own script. */
async function load(channel: Channel, root: L1Node = page(), extraBody = ''): Promise<JSDOM> {
  const { html, css } = renderL1Document(doc(root), { edit: channel === 'edit' })
  const body = channel === 'edit' ? `<body ${L1_EDIT_MARKER_ATTR}>` : '<body>'
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head>${body}${html}${extraBody}</body></html>`,
    { runScripts: 'dangerously' },
  )
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0))
  return dom
}

const win = (dom: JSDOM): Window => dom.window as unknown as Window
const shellFor = (d: Document, id: string): Element =>
  [...d.querySelectorAll('[data-l1-dialog]')].find((s) => s.getAttribute('data-l1-dialog') === id)!
const isOpen = (d: Document, id: string): boolean => shellFor(d, id).hasAttribute('data-l1-open')
const locked = (d: Document): boolean => d.documentElement.hasAttribute('data-l1-dialog-lock')
const ready = (d: Document): boolean => d.documentElement.hasAttribute('data-l1-dialog-ready')
const click = (dom: JSDOM, el: Element): void => {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
}
/** jsdom has no layout: simulate the page having been scrolled to `y`. */
const scrolledTo = (dom: JSDOM, y: number): void => {
  Object.defineProperty(dom.window, 'scrollY', { value: y, configurable: true, writable: true })
}
/** Observe `scrollTo`, recording whether the lock was already on when it ran. */
const watchScroll = (dom: JSDOM): Array<{ y: number; lockedAtCall: boolean }> => {
  const calls: Array<{ y: number; lockedAtCall: boolean }> = []
  dom.window.scrollTo = ((x: number, y: number) => {
    calls.push({ y, lockedAtCall: locked(dom.window.document) })
    scrolledTo(dom, y)
    void x
  }) as typeof dom.window.scrollTo
  return calls
}

describe('story-e214a00d — what the edit render carries for a modal', () => {
  it('test_UAT_AC2436_the_edit_render_carries_shell_role_id_and_stylesheet_but_no_script_or_acting_attribute', async () => {
    const draft = renderL1Document(doc(page()))
    const edit = renderL1Document(doc(page()), { edit: true })
    const parse = (html: string): Document => new JSDOM(`<!doctype html><body>${html}</body>`).window.document
    const dd = parse(draft.html)
    const ed = parse(edit.html)

    // Present in both channels: the shell with the panel's id, the role, the label, the stylesheet.
    for (const d of [dd, ed]) {
      for (const id of ['signin', 'terms']) {
        const shell = shellFor(d, id)
        expect(shell, id).toBeDefined()
        expect(shell.classList.contains('l1-dlg')).toBe(true)
        const p = d.getElementById(id)!
        expect(shell.firstElementChild).toBe(p)
        expect(p.getAttribute('role')).toBe('dialog')
        expect(p.getAttribute('aria-modal')).toBe('true')
      }
      expect(d.getElementById('signin')!.getAttribute('aria-label')).toBe('Sign in')
      expect(d.getElementById('terms')!.hasAttribute('aria-label')).toBe(false)
    }
    expect(edit.css).toContain(L1_DIALOG_CSS)
    const overlayRules = (css: string): string[] =>
      css.split('\n').filter((r) => r.includes('data-l1-dialog-ready') || r.includes('.l1-dlg'))
    expect(overlayRules(edit.css).length).toBeGreaterThan(0)
    expect(overlayRules(edit.css)).toEqual(overlayRules(draft.css))

    // Absent from the edit render only: the script.
    expect(draft.js).toContain(L1_DIALOG_SCRIPT)
    expect(edit.js).toBeUndefined()
    expect(edit.html).not.toContain('<script')

    // Action nodes: same button, class and declarations, no acting attribute in edit.
    const acting = ['aria-controls', 'aria-haspopup', 'aria-expanded', 'data-l1-opens', 'data-l1-closes']
    for (const id of ['signin-open', 'signin-close', 'terms-open']) {
      const dn = dd.getElementById(id)!
      const en = ed.getElementById(id)!
      expect(en.tagName).toBe('BUTTON')
      expect(en.getAttribute('type')).toBe('button')
      expect(en.className).toBe(dn.className)
      const rules = (css: string): string[] => css.split('\n').filter((r) => r.startsWith(`.${dn.className} {`))
      expect(rules(edit.css)).toEqual(rules(draft.css))
      for (const attr of acting) expect(en.hasAttribute(attr), `${id} ${attr}`).toBe(false)
    }
    expect(dd.getElementById('signin-open')!.getAttribute('aria-controls')).toBe('signin')
    expect(dd.getElementById('signin-open')!.getAttribute('aria-haspopup')).toBe('dialog')
    expect(dd.getElementById('signin-open')!.getAttribute('data-l1-opens')).toBe('signin')
    expect(dd.getElementById('signin-close')!.getAttribute('data-l1-closes')).toBe('signin')

    // Nothing sets the ready marker: the panel lays out in normal flow, visible, editable.
    const dom = await load('edit')
    const d = dom.window.document
    expect(ready(d)).toBe(false)
    const shell = shellFor(d, 'signin')
    expect(dom.window.getComputedStyle(shell).display).toBe('contents')
    const p = d.getElementById('signin')!
    expect(dom.window.getComputedStyle(p).position).not.toBe('fixed')
    expect(dom.window.getComputedStyle(p).display).not.toBe('none')
    expect(p.textContent).toContain('Please enter your email address')
  })
})

describe('story-e214a00d — reading what the page is showing', () => {
  it('test_UAT_AC2491_a_page_state_reads_as_open_panel_ids_plus_scroll_and_an_untouched_page_reads_as_none', async () => {
    expect(L1_INITIAL_PAGE_STATE).toEqual({ dialogs: [], scrollY: 0 })

    // Draft, after its script has folded the panels away.
    const view = await load('draft')
    const vd = view.window.document
    expect(ready(vd)).toBe(true)
    expect(readL1PageState(win(view))).toEqual(L1_INITIAL_PAGE_STATE)

    // Open the second panel by its opener, scroll, read again.
    click(view, vd.getElementById('terms-open')!)
    scrolledTo(view, 240.4)
    expect(readL1PageState(win(view))).toEqual({ dialogs: ['terms'], scrollY: 240 })

    // Both open: document order, not opening order.
    click(view, vd.getElementById('signin-open')!)
    expect(readL1PageState(win(view)).dialogs).toEqual(['signin', 'terms'])

    // Edit render nobody has told anything: settled panel visible in flow, reads as none.
    const edit = await load('edit')
    const ed = edit.window.document
    expect(ed.getElementById('signin')!.textContent).toContain('Please enter')
    expect(readL1PageState(win(edit))).toEqual({ dialogs: [], scrollY: 0 })

    // A shell with no id never appears, even when open.
    const bare = new JSDOM(
      '<!doctype html><body><div data-l1-dialog="" data-l1-open><div>x</div></div>' +
        '<div data-l1-dialog="real" data-l1-open><div>y</div></div></body>',
    )
    expect(readL1PageState(bare.window as unknown as Window).dialogs).toEqual(['real'])
    expect(listL1Dialogs(bare.window.document).map((e) => e.id)).toEqual(['real'])
  })
})

describe('story-e214a00d — putting a page into a state', () => {
  it('test_UAT_AC2492_applying_a_state_to_an_edit_document_sets_markers_and_opens_exactly_the_named_panels', async () => {
    const dom = await load('edit')
    const d = dom.window.document
    const scrolls = watchScroll(dom)
    const before = d.documentElement.outerHTML.replace(/ data-l1-[a-z-]+=""/g, '')

    applyL1PageState(win(dom), { dialogs: ['signin', 'ghost'], scrollY: 300 })

    // Scroll first, before any lock existed.
    expect(scrolls).toEqual([{ y: 300, lockedAtCall: false }])
    expect(ready(d)).toBe(true)
    expect(isOpen(d, 'signin')).toBe(true)
    expect(isOpen(d, 'terms')).toBe(false)
    expect(locked(d)).toBe(true)
    // The gated rules lay the named panel out as a fixed covering overlay and hide the rest.
    const openShell = dom.window.getComputedStyle(shellFor(d, 'signin'))
    expect(openShell.position).toBe('fixed')
    expect(dom.window.getComputedStyle(shellFor(d, 'terms')).display).toBe('none')
    // Nothing that acts was added; an unmatched name changed nothing else.
    expect(d.querySelectorAll('script')).toHaveLength(0)
    expect(d.querySelectorAll('[data-l1-opens],[data-l1-closes],[aria-expanded],[aria-controls]')).toHaveLength(0)
    expect(d.documentElement.outerHTML.replace(/ data-l1-[a-z-]+=""/g, '')).toBe(before)
    // A click still means nothing to the panel: no listener toggles it.
    click(dom, d.getElementById('signin-close')!)
    expect(isOpen(d, 'signin')).toBe(true)

    // Already at the wanted offset: no scroll call.
    applyL1PageState(win(dom), { dialogs: ['signin'], scrollY: 300 })
    expect(scrolls).toHaveLength(1)

    // Empty state: both closed, lock gone, ready marker remains.
    applyL1PageState(win(dom), { dialogs: [], scrollY: 300 })
    expect(isOpen(d, 'signin')).toBe(false)
    expect(isOpen(d, 'terms')).toBe(false)
    expect(locked(d)).toBe(false)
    expect(ready(d)).toBe(true)
    expect(dom.window.getComputedStyle(shellFor(d, 'signin')).display).toBe('none')

    // An untouched edit document told "nothing open" shows the panels closed, not settled.
    const fresh = await load('edit')
    applyL1PageState(win(fresh), L1_INITIAL_PAGE_STATE)
    expect(ready(fresh.window.document)).toBe(true)
    expect(fresh.window.getComputedStyle(shellFor(fresh.window.document, 'signin')).display).toBe('none')
  })

  it('test_UAT_AC2493_applying_a_state_to_a_draft_document_drives_its_own_openers_and_close_controls', async () => {
    const dom = await load('draft')
    const d = dom.window.document
    const scrolls = watchScroll(dom)
    const opener = d.getElementById('signin-open')!

    // Open the panel that has a Close.
    applyL1PageState(win(dom), { dialogs: ['signin'], scrollY: 120 })
    expect(scrolls).toEqual([{ y: 120, lockedAtCall: false }])
    expect(isOpen(d, 'signin')).toBe(true)
    expect(d.getElementById('signin')!.contains(d.activeElement)).toBe(true)
    expect(locked(d)).toBe(true)
    expect(opener.getAttribute('aria-expanded')).toBe('true')

    // Already in the wanted state: left alone (focus is not moved).
    d.getElementById('signin-close')!.focus()
    applyL1PageState(win(dom), { dialogs: ['signin'], scrollY: 120 })
    expect(d.activeElement?.id).toBe('signin-close')
    expect(isOpen(d, 'signin')).toBe(true)

    // Empty state: closed through its own Close; lock lifted; focus back on the opener.
    applyL1PageState(win(dom), { dialogs: [], scrollY: 120 })
    expect(isOpen(d, 'signin')).toBe(false)
    expect(locked(d)).toBe(false)
    expect(d.activeElement).toBe(opener)
    expect(opener.getAttribute('aria-expanded')).toBe('false')

    // Two at once: focus inside the most recently opened (document order → terms).
    applyL1PageState(win(dom), { dialogs: ['signin', 'terms'], scrollY: 120 })
    expect([isOpen(d, 'signin'), isOpen(d, 'terms')]).toEqual([true, true])
    expect(d.getElementById('terms')!.contains(d.activeElement)).toBe(true)
    expect(d.getElementById('terms-open')!.getAttribute('aria-expanded')).toBe('true')

    // The Close-less panel closes through its scrim.
    applyL1PageState(win(dom), { dialogs: [], scrollY: 120 })
    expect([isOpen(d, 'signin'), isOpen(d, 'terms')]).toEqual([false, false])
    expect(d.getElementById('terms-open')!.getAttribute('aria-expanded')).toBe('false')
    expect(locked(d)).toBe(false)

    // Opted out of scrim dismissal and no Close: declines, stays open.
    const sticky = await load('draft', page({ dismissOnBackdrop: false }))
    const sd = sticky.window.document
    applyL1PageState(win(sticky), { dialogs: ['terms'], scrollY: 0 })
    expect(isOpen(sd, 'terms')).toBe(true)
    applyL1PageState(win(sticky), { dialogs: [], scrollY: 0 })
    expect(isOpen(sd, 'terms')).toBe(true)
    expect(locked(sd)).toBe(true)

    // A named panel with no opener on the page is not forced open.
    const orphan = await load(
      'draft',
      stack({ kind: 'box', id: 'lonely', dialog: {}, children: [{ kind: 'text', text: 'Alone' }] } as L1Node),
    )
    applyL1PageState(win(orphan), { dialogs: ['lonely'], scrollY: 0 })
    expect(isOpen(orphan.window.document, 'lonely')).toBe(false)
    expect(locked(orphan.window.document)).toBe(false)

    // Matching compares attribute values, so an id that would break a selector still works.
    const odd = await load(
      'draft',
      stack(
        { kind: 'text', id: 'odd-open', text: 'Open', action: { opens: 'a"b]' } } as L1Node,
        { kind: 'box', id: 'a"b]', dialog: {}, children: [{ kind: 'text', text: 'Odd' }] } as L1Node,
      ),
    )
    expect(() => applyL1PageState(win(odd), { dialogs: ['a"b]'], scrollY: 0 })).not.toThrow()
    expect(isOpen(odd.window.document, 'a"b]')).toBe(true)
  })

  it('test_UAT_AC2494_a_state_read_in_one_channel_reproduces_in_the_other', async () => {
    // View → Edit.
    const view = await load('draft')
    click(view, view.window.document.getElementById('signin-open')!)
    const carried = readL1PageState(win(view))
    expect(carried.dialogs).toEqual(['signin'])

    const edit = await load('edit')
    applyL1PageState(win(edit), carried)
    expect(readL1PageState(win(edit)).dialogs).toEqual(carried.dialogs)
    expect(isOpen(edit.window.document, 'signin')).toBe(true)

    // Edit → View, with a different panel picked in Edit.
    applyL1PageState(win(edit), { dialogs: ['terms'], scrollY: 0 })
    const picked = readL1PageState(win(edit))
    expect(picked.dialogs).toEqual(['terms'])

    const back = await load('draft')
    const bd = back.window.document
    applyL1PageState(win(back), picked)
    expect(readL1PageState(win(back)).dialogs).toEqual(['terms'])
    expect(isOpen(bd, 'signin')).toBe(false)
    // Opened by its own opener: the page's script made aria-expanded honest.
    expect(bd.getElementById('terms-open')!.getAttribute('aria-expanded')).toBe('true')
    expect(bd.getElementById('signin-open')!.getAttribute('aria-expanded')).toBe('false')
  })
})

describe('story-e214a00d — what the mechanism does not reach', () => {
  it('test_UAT_AC2495_a_behaviour_modules_own_panel_is_untouched_by_state_application', async () => {
    for (const channel of ['edit', 'draft'] as const) {
      const module = accountChrome({ capabilities: { accounts: true }, edit: channel === 'edit' })
      expect(module).toContain('account-chrome__dialog')
      const dom = await load(channel, page(), module)
      const d = dom.window.document
      const form = d.querySelector('.account-chrome__dialog')!
      const moduleId = form.id
      expect(moduleId).toBe('account-chrome-dialog')
      const moduleBefore = d.querySelector('.account-chrome')!.outerHTML
      const formDisplayBefore = dom.window.getComputedStyle(form).display

      // Neither the declared list nor a read state includes the module's panel.
      expect(listL1Dialogs(d).map((e) => e.id)).toEqual(['signin', 'terms'])
      expect(readL1PageState(win(dom)).dialogs).not.toContain(moduleId)

      // Apply a state naming the L1 panel, then one naming the module's element id.
      applyL1PageState(win(dom), { dialogs: ['signin'], scrollY: 0 })
      expect(isOpen(d, 'signin')).toBe(true)
      applyL1PageState(win(dom), { dialogs: [moduleId], scrollY: 0 })
      expect(readL1PageState(win(dom)).dialogs).toEqual([])

      // The module's markup, attributes and presentation are exactly as they were.
      expect(d.querySelector('.account-chrome')!.outerHTML, channel).toBe(moduleBefore)
      expect(dom.window.getComputedStyle(form).display).toBe(formDisplayBefore)
      expect(form.hasAttribute('data-l1-open')).toBe(false)
      expect(form.closest('[data-l1-dialog]')).toBeNull()
    }
  })
})
