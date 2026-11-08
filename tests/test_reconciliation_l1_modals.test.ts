/**
 * Reconciliation UATs for story-e214a00d — "L1 Modals: an author can declare an
 * overlay panel and the controls that open and close it" (REQ-212).
 *
 * One test per acceptance criterion, AC-2426 … AC-2442. The boundaries are the
 * envelope validator (`validateL1`), the sole emitter (`renderL1Document`, draft
 * and edit channels), the published page driven in jsdom with the emitted script
 * running unstubbed, and the REF-l1 projection with its coverage check.
 */
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import {
  L1_STRUCTURAL_RULES,
  validateL1,
  type L1Document,
  type L1Node,
} from '../packages/site-schema/src/index'
import { L1_DIALOG_CSS, L1_DIALOG_SCRIPT, renderL1Document } from '../packages/framework/src/index'
import { l1VocabularyGaps, projectL1Vocabulary } from '../tools/generate/src/cli/kb-projection'

const WIDTHS = [320, 768, 1440]
const doc = (root: L1Node): L1Document => ({ widths: WIDTHS, root })
const render = (root: L1Node): { html: string; css: string; js?: string } =>
  renderL1Document(doc(root))
const errorsOf = (root: L1Node): Array<{ path: string; message: string }> => {
  const result = validateL1(doc(root))
  return result.ok ? [] : result.errors
}
const stack = (...children: L1Node[]): L1Node => ({ kind: 'container', layout: 'stack', children })
const panel = (id: string, extra: Partial<L1Node> = {}, children: L1Node[] = []): L1Node =>
  ({ kind: 'box', id, dialog: {}, children, ...extra }) as L1Node

/** Parse markup without running scripts — for structural assertions. */
const parse = (html: string): Document => new JSDOM(`<!doctype html><body>${html}</body>`).window.document

/** The published page in a browser that runs its inline script, wired. */
async function drive(root: L1Node): Promise<{ dom: JSDOM; d: Document }> {
  const { html, css } = render(root)
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`,
    { runScripts: 'dangerously' },
  )
  await new Promise((resolve) => dom.window.setTimeout(resolve, 0))
  return { dom, d: dom.window.document }
}
const click = (dom: JSDOM, el: Element): void => {
  el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
}
const key = (dom: JSDOM, k: string, init: Record<string, unknown> = {}): void => {
  dom.window.document.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }),
  )
}
const isOpen = (d: Document, id: string): boolean =>
  d.querySelector(`[data-l1-dialog="${id}"]`)!.hasAttribute('data-l1-open')

describe('story-e214a00d — what the envelope accepts and refuses', () => {
  it('test_UAT_AC2426_overlay_role_only_on_box_container_and_action_only_on_box_container_text', () => {
    const target = panel('p')
    const dialog = { placement: 'center' as const }
    const action = { opens: 'p' }

    // Accepted kinds.
    expect(errorsOf(stack({ kind: 'box', id: 'd', dialog, children: [] } as L1Node))).toEqual([])
    expect(
      errorsOf(stack({ kind: 'container', id: 'd', layout: 'stack', dialog, children: [] } as L1Node)),
    ).toEqual([])
    for (const actor of [
      { kind: 'box', action, children: [] },
      { kind: 'container', layout: 'stack', action, children: [] },
      { kind: 'text', text: 'Open', action },
    ]) {
      expect(errorsOf(stack(actor as L1Node, target))).toEqual([])
    }

    // Refused kinds — each error located at the offending node (child 0).
    const refused: L1Node[] = [
      { kind: 'text', id: 'd', text: 'x', dialog },
      { kind: 'image', id: 'd', src: '/a.png', alt: 'a', dialog },
      { kind: 'control', control: 'submit', dialog },
      { kind: 'slot', name: 'form', dialog },
      { kind: 'image', src: '/a.png', alt: 'a', action },
      { kind: 'control', control: 'submit', action },
      { kind: 'slot', name: 'form', action },
    ] as unknown as L1Node[]
    for (const node of refused) {
      const errors = errorsOf(stack(node, target))
      expect(errors.length, JSON.stringify(node)).toBeGreaterThan(0)
      expect(
        errors.some((e) => e.path.startsWith('/root/children/0')),
        `${JSON.stringify(node)} → ${JSON.stringify(errors)}`,
      ).toBe(true)
    }
  })

  it('test_UAT_AC2427_a_dialog_without_an_id_is_refused_at_its_dialog_path', () => {
    const errors = errorsOf({ kind: 'box', dialog: { placement: 'center' }, children: [] } as L1Node)
    expect(errors).toEqual([{ path: '/root/dialog', message: L1_STRUCTURAL_RULES.dialogNeedsId }])
    expect(errors[0].message).toBe('a node carrying `dialog` must declare an `id`')

    expect(
      errorsOf({ kind: 'box', id: 'p', dialog: { placement: 'center' }, children: [] } as L1Node),
    ).toEqual([])
  })

  it('test_UAT_AC2428_an_action_naming_neither_or_both_verbs_is_refused_at_the_action_path', () => {
    for (const action of [{}, { opens: 'p', closes: 'p' }]) {
      const errors = errorsOf(stack({ kind: 'text', text: 'x', action } as L1Node, panel('p')))
      const verbError = errors.filter((e) =>
        e.message.includes('an action must name exactly one of `opens` / `closes`'),
      )
      expect(verbError.length, JSON.stringify(action)).toBe(1)
      expect(verbError[0].path).toBe('/root/children/0/action')
    }
    for (const action of [{ opens: 'p' }, { closes: 'p' }]) {
      expect(errorsOf(stack({ kind: 'text', text: 'x', action } as L1Node, panel('p')))).toEqual([])
    }
  })

  it('test_UAT_AC2429_an_action_whose_target_is_missing_or_not_a_panel_is_refused', () => {
    const missing = errorsOf(stack({ kind: 'text', text: 'x', action: { opens: 'nowhere' } } as L1Node))
    expect(missing).toHaveLength(1)
    expect(missing[0].path).toBe('/root/children/0/action/opens')
    expect(missing[0].message).toContain('an action must name a node that carries `dialog`')
    expect(missing[0].message).toContain("'nowhere'")

    const notPanel = errorsOf(
      stack(
        { kind: 'text', text: 'x', action: { closes: 'footer' } } as L1Node,
        { kind: 'box', id: 'footer', children: [] },
      ),
    )
    expect(notPanel).toHaveLength(1)
    expect(notPanel[0].path).toBe('/root/children/0/action/closes')
    expect(notPanel[0].message).toContain('an action must name a node that carries `dialog`')
    expect(notPanel[0].message).toContain("'footer'")

    // Whole-document: a panel declared after the action, or before it, is found.
    expect(errorsOf(stack({ kind: 'text', text: 'x', action: { opens: 'later' } } as L1Node, panel('later')))).toEqual([])
    expect(errorsOf(stack(panel('earlier'), { kind: 'text', text: 'x', action: { opens: 'earlier' } } as L1Node))).toEqual([])
  })

  it('test_UAT_AC2430_a_node_carrying_both_link_and_action_is_refused', () => {
    const both = errorsOf(
      stack(
        { kind: 'text', text: 'Sign in', link: { href: '/in' }, action: { opens: 'p' } } as L1Node,
        panel('p'),
      ),
    )
    expect(both.some((e) => e.message === 'a node cannot carry both `link` and `action`')).toBe(true)

    expect(
      errorsOf(stack({ kind: 'text', text: 'Sign in', link: { href: '/in' } } as L1Node, panel('p'))),
    ).toEqual([])
    expect(
      errorsOf(stack({ kind: 'text', text: 'Sign in', action: { opens: 'p' } } as L1Node, panel('p'))),
    ).toEqual([])
  })
})

describe('story-e214a00d — what the renderer emits', () => {
  const page = (): L1Node =>
    stack(
      {
        kind: 'box',
        id: 'opener',
        action: { opens: 'p' },
        axes: { surfaceFill: '#abcdef' },
        children: [{ kind: 'text', text: 'Open' }],
      } as L1Node,
      panel('p', { dialog: { ariaLabel: 'Sign in' } } as Partial<L1Node>, [
        { kind: 'text', id: 'closer', text: 'Close', action: { closes: 'p' } } as L1Node,
      ]),
      panel('q'),
    )

  it('test_UAT_AC2431_an_action_node_is_retagged_to_a_button_with_disclosure_semantics', () => {
    const { html, css } = render(page())
    const d = parse(html)
    const opener = d.getElementById('opener')!
    const closer = d.getElementById('closer')!

    // Retagged, not wrapped: the node's own element IS the button.
    for (const b of [opener, closer]) {
      expect(b.tagName).toBe('BUTTON')
      expect(b.getAttribute('type')).toBe('button')
      expect(b.className).toMatch(/^l1-\d+$/)
      expect(b.parentElement!.tagName).not.toBe('BUTTON')
    }
    // Keeps its paint declarations.
    const cls = opener.className
    expect(css).toMatch(new RegExp(`\\.${cls} \\{[^}]*background-color: #abcdef`))
    // The opener is the open-honest disclosure.
    expect(opener.getAttribute('aria-haspopup')).toBe('dialog')
    expect(opener.getAttribute('aria-controls')).toBe('p')
    expect(opener.getAttribute('aria-expanded')).toBe('true')
    // The closer claims neither.
    expect(closer.hasAttribute('aria-haspopup')).toBe(false)
    expect(closer.hasAttribute('aria-expanded')).toBe(false)
  })

  it('test_UAT_AC2432_a_dialog_node_renders_as_an_accessible_panel_inside_a_shell', () => {
    const d = parse(render(page()).html)
    const labelled = d.getElementById('p')!
    const unlabelled = d.getElementById('q')!
    for (const p of [labelled, unlabelled]) {
      expect(p.getAttribute('role')).toBe('dialog')
      expect(p.getAttribute('aria-modal')).toBe('true')
      expect(p.getAttribute('tabindex')).toBe('-1')
      expect(p.className).toMatch(/^l1-\d+$/)
      // Wrapped by a separate shell, not replaced by it.
      const shell = p.parentElement!
      expect(shell.getAttribute('data-l1-dialog')).toBe(p.id)
      expect(shell.hasAttribute('id')).toBe(false)
      expect(shell.firstElementChild).toBe(p)
      expect(shell.classList.contains('l1-dlg')).toBe(true)
    }
    expect(labelled.getAttribute('aria-label')).toBe('Sign in')
    expect(unlabelled.hasAttribute('aria-label')).toBe(false)
    expect(d.querySelectorAll('#p')).toHaveLength(1)
  })

  it('test_UAT_AC2433_scrim_placement_and_panel_paint_come_from_the_document', () => {
    const scrimRule = (css: string): string =>
      css.split('\n').find((r) => /^html\[data-l1-dialog-ready\] \.l1-\d+-dlg\[data-l1-open\] \{/.test(r)) ?? ''

    const dark = render(panel('p', { dialog: { backdrop: { color: '#000000', opacity: 0.5 } } } as Partial<L1Node>)).css
    expect(scrimRule(dark)).toContain('background-color: #00000080')
    expect(scrimRule(dark)).toContain('justify-content: center') // absent placement → center

    const tinted = render(
      panel('p', { dialog: { backdrop: { color: '#112233', opacity: 0.25 }, placement: 'top' } } as Partial<L1Node>),
    ).css
    expect(scrimRule(tinted)).toContain('background-color: #11223340')
    expect(scrimRule(tinted)).toContain('justify-content: flex-start')

    const bottom = render(panel('p', { dialog: { placement: 'bottom' } } as Partial<L1Node>)).css
    expect(scrimRule(bottom)).toContain('justify-content: flex-end')
    expect(scrimRule(bottom)).not.toContain('background-color')
    const center = render(panel('p', { dialog: { placement: 'center' } } as Partial<L1Node>)).css
    expect(scrimRule(center)).toContain('justify-content: center')

    // The panel's paint is its own L1 axes, on the panel's own class.
    const painted = render(
      panel('p', {
        axes: { surfaceFill: '#fafafa', borderRadiusPx: 12 },
        padding: { topPx: 24, rightPx: 24, bottomPx: 24, leftPx: 24 },
        sizing: { width: { mode: 'fixed', px: 480 } },
      } as Partial<L1Node>),
    )
    const cls = parse(painted.html).getElementById('p')!.className
    const panelRules = painted.css.split('\n').filter((r) => r.startsWith(`.${cls} {`)).join('\n')
    expect(panelRules).toContain('background-color: #fafafa')
    expect(panelRules).toContain('12px')
    expect(panelRules).toContain('24px')
    expect(panelRules).toContain('480px')

    // None of the document's values live in the module stylesheet.
    for (const v of ['#000000', '#112233', '#fafafa', 'flex-start', 'flex-end', 'justify-content']) {
      expect(L1_DIALOG_CSS).not.toContain(v)
    }
    // Covered-viewport obligations: the shell scrolls, the panel does not shrink.
    expect(dark).toMatch(/html\[data-l1-dialog-ready\] \.l1-dlg\[data-l1-open\] \{[^}]*overflow: auto/)
    expect(dark).toMatch(/html\[data-l1-dialog-ready\] \.l1-dlg\[data-l1-open\] > \* \{[^}]*flex-shrink: 0/)
  })

  it('test_UAT_AC2434_the_dialog_script_ships_once_only_with_a_modal_and_carries_no_document_values', () => {
    const count = (s: string | undefined, needle: string): number => (s ?? '').split(needle).length - 1

    const one = render(panel('a'))
    const two = render(stack(panel('a'), panel('b')))
    for (const r of [one, two]) {
      expect(count(r.js, L1_DIALOG_SCRIPT)).toBe(1)
      expect(count(r.css, L1_DIALOG_CSS)).toBe(1)
    }

    const none = render(stack({ kind: 'text', text: 'Hello', link: { href: '/x' } } as L1Node))
    expect(none.js).toBeUndefined()
    expect(none.html).not.toContain('<script')
    expect(none.css).not.toContain(L1_DIALOG_CSS)
    expect(none.css).not.toContain('l1-dlg')

    const a = render(
      stack(
        { kind: 'text', text: 'Open', action: { opens: 'signin-panel' } } as L1Node,
        panel('signin-panel', {
          dialog: { backdrop: { color: '#123456', opacity: 0.9 }, placement: 'bottom', ariaLabel: 'Sign in' },
          axes: { surfaceFill: '#abcdef' },
        } as Partial<L1Node>),
      ),
    ).js!
    const b = render(
      stack(
        { kind: 'text', text: 'Go', action: { opens: 'other' } } as L1Node,
        panel('other', {
          dialog: { backdrop: { color: '#fedcba', opacity: 0.1 }, placement: 'top', ariaLabel: 'Newsletter' },
        } as Partial<L1Node>),
      ),
    ).js!
    expect(a).toBe(L1_DIALOG_SCRIPT)
    expect(b).toBe(L1_DIALOG_SCRIPT)
    for (const v of ['signin-panel', 'Sign in', '#123456', '#abcdef', 'other', 'Newsletter', '#fedcba', 'bottom']) {
      expect(L1_DIALOG_SCRIPT).not.toContain(v)
    }
  })

  it('test_UAT_AC2435_without_the_script_the_panel_lays_out_in_flow_and_open', async () => {
    const root = stack(
      { kind: 'text', id: 'o1', text: 'Open', action: { opens: 'p' } } as L1Node,
      { kind: 'text', id: 'o2', text: 'Open too', action: { opens: 'p' } } as L1Node,
      panel('p', { dialog: { backdrop: { color: '#000000', opacity: 0.5 }, placement: 'top' } } as Partial<L1Node>, [
        { kind: 'text', text: 'Content' },
      ]),
    )
    const { css } = render(root)
    const rules = css.split('\n')
    const covering = rules.filter((r) => /position: fixed|inset:|z-index|justify-content|background-color: #00000080/.test(r))
    expect(covering.length).toBeGreaterThan(0)
    for (const r of covering) expect(r).toContain('html[data-l1-dialog-ready]')
    // Unmarked, the shell contributes no box of its own.
    expect(rules).toContain('.l1-dlg { display: contents }')

    // Unenhanced markup: the panel is present, in flow, with its content.
    const plain = parse(render(root).html)
    expect(plain.getElementById('p')!.textContent).toContain('Content')
    expect(plain.querySelector('[data-l1-dialog="p"]')!.hasAttribute('data-l1-open')).toBe(false)

    // Once the script runs: marker set, panels closed, openers report false.
    const { d } = await drive(root)
    expect(d.documentElement.hasAttribute('data-l1-dialog-ready')).toBe(true)
    expect(isOpen(d, 'p')).toBe(false)
    expect(d.getElementById('o1')!.getAttribute('aria-expanded')).toBe('false')
    expect(d.getElementById('o2')!.getAttribute('aria-expanded')).toBe('false')
  })

  it('test_UAT_AC2436_the_edit_render_ships_no_dialog_script_and_no_acting_attribute', () => {
    const root = page()
    const draft = renderL1Document(doc(root))
    const edit = renderL1Document(doc(root), { edit: true })

    expect(draft.js).toContain(L1_DIALOG_SCRIPT)
    expect(edit.js).toBeUndefined()
    expect(edit.html).not.toContain('<script')

    const dd = parse(draft.html)
    const ed = parse(edit.html)
    for (const id of ['opener', 'closer']) {
      const dn = dd.getElementById(id)!
      const en = ed.getElementById(id)!
      expect(en.tagName).toBe('BUTTON')
      expect(en.className).toBe(dn.className)
      const rule = (css: string): string[] => css.split('\n').filter((r) => r.startsWith(`.${dn.className} {`))
      expect(rule(edit.css)).toEqual(rule(draft.css))
    }
    expect(dd.getElementById('opener')!.getAttribute('data-l1-opens')).toBe('p')
    expect(dd.getElementById('closer')!.getAttribute('data-l1-closes')).toBe('p')
    for (const attr of ['data-l1-opens', 'data-l1-closes', 'aria-controls', 'aria-expanded']) {
      expect(ed.querySelectorAll(`[${attr}]`)).toHaveLength(0)
    }
    // The panel renders in flow and visible: same element and class, no shell.
    const ep = ed.getElementById('p')!
    expect(ep.className).toBe(dd.getElementById('p')!.className)
    expect(ed.querySelector('[data-l1-dialog]')).toBeNull()
    expect(edit.css).not.toContain('l1-dlg')
  })

  it('test_UAT_AC2437_a_reveal_on_a_panel_is_not_emitted_while_a_reveal_inside_it_is', () => {
    const { html, css } = render(
      panel('p', { reveal: { yPx: 24, fromOpacity: 0 } } as Partial<L1Node>, [
        { kind: 'text', id: 'inner', text: 'hi', reveal: { yPx: 10, fromOpacity: 0 } } as L1Node,
      ]),
    )
    const d = parse(html)
    const own = (el: Element): string => [...el.classList].find((c) => /^l1-\d+$/.test(c))!
    const p = d.getElementById('p')!
    const inner = d.getElementById('inner')!
    // No pre-state rule and no transition for the panel…
    expect(css).not.toContain(`.${own(p)}:not(.l1-in)`)
    expect(css.split('\n').filter((r) => r.startsWith(`.${own(p)} {`)).join('\n')).not.toContain('transition')
    // …and no reveal behaviour of any kind for it. The panel may still carry the
    // observer's handle class, but that handle is inert: no rule anywhere keys
    // the panel's class on the motion marker or the revealed state, so whatever
    // the observer does to it, the panel never sits at a pre-state opacity.
    const pCls = own(p)
    const panelRevealRules = css
      .split('\n')
      .filter((r) => r.includes(`.${pCls}`) && (r.includes('data-l1-motion') || r.includes('l1-in')))
    expect(panelRevealRules).toEqual([])
    const innerCls = own(inner)
    expect(inner.classList.contains('l1-rv')).toBe(true)
    expect(css).toContain(`html[data-l1-motion] .${innerCls}:not(.l1-in) { opacity: 0`)
  })

  it('test_UAT_AC2438_a_document_declaring_no_modal_renders_exactly_as_before', () => {
    const out = renderL1Document({
      widths: WIDTHS,
      root: stack(
        { kind: 'text', text: 'Hello', link: { href: '/x' } } as L1Node,
        { kind: 'box', axes: { surfaceFill: '#ffffff' }, children: [{ kind: 'text', text: 'Hi' }] },
      ),
    })
    expect(out.html).toBe(
      '<div class="l1-0"><a class="l1-1" href="x">Hello</a><div class="l1-2"><p class="l1-3">Hi</p></div></div>',
    )
    expect(out.css).toBe(
      [
        '*, *::before, *::after { box-sizing: border-box }',
        'html, body { margin: 0; padding: 0 }',
        '.l1-1 { display: block; text-decoration: none; color: inherit; margin: 0 }',
        '.l1-3 { margin: 0 }',
        '.l1-2 { background-color: #ffffff; position: relative }',
        '.l1-0 { display: flex; flex-direction: column; position: relative }',
      ].join('\n'),
    )
    expect(out.js).toBeUndefined()
    for (const marker of ['l1-dlg', 'data-l1-dialog', 'role="dialog"', '<button']) {
      expect(out.html + out.css).not.toContain(marker)
    }
  })
})

describe('story-e214a00d — what the reader can do', () => {
  it('test_UAT_AC2439_a_reader_opens_and_closes_a_panel_and_focus_returns_to_the_opener', async () => {
    const { dom, d } = await drive(
      stack(
        { kind: 'text', id: 'open', text: 'Open', action: { opens: 'p' } } as L1Node,
        panel('p', {}, [
          { kind: 'text', text: 'Body' },
          { kind: 'text', id: 'close', text: 'Close', action: { closes: 'p' } } as L1Node,
        ]),
        { kind: 'text', id: 'open-empty', text: 'Open empty', action: { opens: 'e' } } as L1Node,
        panel('e', {}, [{ kind: 'text', text: 'Nothing to focus' }]),
      ),
    )
    const opener = d.getElementById('open')!
    const shell = d.querySelector('[data-l1-dialog="p"]')!

    click(dom, opener)
    expect(isOpen(d, 'p')).toBe(true)
    expect(dom.window.getComputedStyle(shell).display).toBe('flex')
    expect(opener.getAttribute('aria-expanded')).toBe('true')
    expect(d.getElementById('p')!.contains(d.activeElement)).toBe(true)

    click(dom, d.getElementById('close')!)
    expect(isOpen(d, 'p')).toBe(false)
    expect(dom.window.getComputedStyle(shell).display).toBe('none')
    expect(opener.getAttribute('aria-expanded')).toBe('false')
    expect(d.activeElement).toBe(opener)

    // A panel holding nothing focusable receives focus itself.
    click(dom, d.getElementById('open-empty')!)
    expect(isOpen(d, 'e')).toBe(true)
    expect(d.activeElement).toBe(d.getElementById('e'))
  })

  it('test_UAT_AC2440_escape_and_scrim_dismiss_unless_turned_off_and_an_inside_click_never_does', async () => {
    const build = (dialog: Record<string, unknown>): L1Node =>
      stack(
        { kind: 'text', id: 'open', text: 'Open', action: { opens: 'p' } } as L1Node,
        panel('p', { dialog } as Partial<L1Node>, [
          { kind: 'box', id: 'field', children: [] },
          { kind: 'text', id: 'x', text: 'Close', action: { closes: 'p' } } as L1Node,
        ]),
      )

    // Defaults: both dismissals on.
    const def = await drive(build({}))
    const defShell = def.d.querySelector('[data-l1-dialog="p"]')!
    click(def.dom, def.d.getElementById('open')!)
    key(def.dom, 'Escape')
    expect(isOpen(def.d, 'p')).toBe(false)
    click(def.dom, def.d.getElementById('open')!)
    click(def.dom, def.d.getElementById('field')!)
    click(def.dom, def.d.getElementById('p')!)
    expect(isOpen(def.d, 'p')).toBe(true)
    click(def.dom, defShell)
    expect(isOpen(def.d, 'p')).toBe(false)

    // Escape turned off: Escape leaves it open, the scrim still closes it.
    const noEsc = await drive(build({ dismissOnEscape: false }))
    click(noEsc.dom, noEsc.d.getElementById('open')!)
    key(noEsc.dom, 'Escape')
    expect(isOpen(noEsc.d, 'p')).toBe(true)
    click(noEsc.dom, noEsc.d.querySelector('[data-l1-dialog="p"]')!)
    expect(isOpen(noEsc.d, 'p')).toBe(false)

    // Scrim turned off: the scrim leaves it open, Escape still closes it.
    const noScrim = await drive(build({ dismissOnBackdrop: false }))
    click(noScrim.dom, noScrim.d.getElementById('open')!)
    click(noScrim.dom, noScrim.d.querySelector('[data-l1-dialog="p"]')!)
    expect(isOpen(noScrim.d, 'p')).toBe(true)
    key(noScrim.dom, 'Escape')
    expect(isOpen(noScrim.d, 'p')).toBe(false)
  })

  it('test_UAT_AC2441_tab_is_trapped_scroll_is_locked_and_panels_work_independently', async () => {
    const { dom, d } = await drive(
      stack(
        { kind: 'text', id: 'open-a', text: 'A', action: { opens: 'a' } } as L1Node,
        { kind: 'text', id: 'open-b', text: 'B', action: { opens: 'b' } } as L1Node,
        { kind: 'text', id: 'outside', text: 'Elsewhere', link: { href: '/x' } } as L1Node,
        panel('a', {}, [
          { kind: 'text', id: 'a1', text: 'One', action: { closes: 'a' } } as L1Node,
          { kind: 'text', id: 'a2', text: 'Two', link: { href: '/y' } } as L1Node,
          { kind: 'text', id: 'a3', text: 'Three', action: { closes: 'a' } } as L1Node,
        ]),
        panel('b', {}, [{ kind: 'text', id: 'b-close', text: 'Close B', action: { closes: 'b' } } as L1Node]),
      ),
    )
    const locked = (): boolean => d.documentElement.hasAttribute('data-l1-dialog-lock')
    expect(locked()).toBe(false)

    click(dom, d.getElementById('open-a')!)
    expect(locked()).toBe(true)
    expect(d.activeElement?.id).toBe('a1')

    // Tab past the last wraps to the first; Shift+Tab before the first wraps to the last.
    d.getElementById('a3')!.focus()
    key(dom, 'Tab')
    expect(d.activeElement?.id).toBe('a1')
    key(dom, 'Tab', { shiftKey: true })
    expect(d.activeElement?.id).toBe('a3')
    // Focus that escaped is pulled back in.
    d.getElementById('outside')!.focus()
    key(dom, 'Tab')
    expect(d.getElementById('a')!.contains(d.activeElement)).toBe(true)

    // Two panels open at once, each independent; the lock lifts only after the last.
    click(dom, d.getElementById('open-b')!)
    expect([isOpen(d, 'a'), isOpen(d, 'b')]).toEqual([true, true])
    click(dom, d.getElementById('b-close')!)
    expect([isOpen(d, 'a'), isOpen(d, 'b')]).toEqual([true, false])
    expect(locked()).toBe(true)
    click(dom, d.getElementById('a1')!)
    expect([isOpen(d, 'a'), isOpen(d, 'b')]).toEqual([false, false])
    expect(locked()).toBe(false)
  })
})

describe('story-e214a00d — the reference', () => {
  it('test_UAT_AC2442_ref_l1_documents_the_overlay_role_the_action_verb_and_the_four_modal_rules', () => {
    const body = projectL1Vocabulary().body
    const shapeSection = (heading: string): string => {
      const from = body.indexOf(`\n${heading}\n`)
      expect(from, `${heading} missing`).toBeGreaterThan(-1)
      const next = body.indexOf('\n### ', from + heading.length + 1)
      return body.slice(from, next === -1 ? undefined : next)
    }

    const dialog = shapeSection('### dialog')
    for (const field of ['backdrop', 'placement', 'dismissOnEscape', 'dismissOnBackdrop', 'ariaLabel']) {
      expect(dialog).toContain(`- \`${field}\` — `)
    }
    expect(dialog).toContain('`center` | `top` | `bottom`')

    const action = shapeSection('### action')
    expect(action).toContain('- `opens` — text')
    expect(action).toContain('- `closes` — text')

    const kinds = body.slice(body.indexOf('## The kinds of element'), body.indexOf('## The shapes those fields take'))
    expect(kinds).toContain('- `dialog` — dialog')
    expect(kinds).toContain('- `action` — action')

    const limits = body.slice(body.indexOf('## The limits every page is held to'))
    for (const prose of [
      'A node presented as an overlay must declare an `id`',
      'An action names exactly one verb',
      'What an action names must exist and must itself carry `dialog`',
      '`link` and `action` cannot both be present',
    ]) {
      expect(limits).toContain(prose)
    }

    expect(l1VocabularyGaps()).toEqual([])
  })
})
