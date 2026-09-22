// @vitest-environment jsdom
/**
 * [[REQ-298]] — **the operator console as a full-surface view**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case below mounts the SHIPPED builder over the
 * actually-installed `webui-*` components into a real DOM and reads back what an
 * operator would see and could do. The claim this file exists for is not about
 * spend or sites — the sibling suite has those — it is about the CONTAINER, and
 * a container can only be proved against the real shell, because every statement
 * in the ticket is a statement about the shell's own markup: its content region,
 * its panels, its tab strip, its header.
 *
 * WHY THE HALF THAT IS *NOT* DONE MATTERS MOST HERE. A dialog and a view look
 * alike in a screenshot and differ in what they do to the things around them. So
 * the falsifiers this file exists for are mostly absences:
 *
 *   - *a scrim, a backdrop, or any dialog chrome left beside the view*;
 *   - *Escape closing it*, which is the reflex a transient overlay owes its
 *     reader and this surface must not have;
 *   - *a tab reading as selected while its panel is not on screen*;
 *   - *a tab strip that stops navigating because a view is open*;
 *   - *an entry added to the tab strip*, which [[REQ-179]] forbids and
 *     [[REQ-298]] deliberately did not reopen;
 *   - *a second console mounted by a second press*;
 *   - *a business switcher left live over a surface it does not apply to*;
 *   - *a `console` surface posted to a business-scoped activity log*.
 *
 * THE CLAIMS, in the order the ticket makes them (conditions 1–5):
 *
 *   1. THE ACTION IS GATED ON OWNING THE PLATFORM BUSINESS, and it is the same
 *      action [[REQ-297]] put there — the container changed, the gate did not.
 *   2. PRESSING IT OPENS A FULL-SURFACE VIEW: in the content region, with the
 *      panels hidden, no scrim, and no dialog form of the console left anywhere.
 *   3. NO ENTRY IS ADDED TO THE TAB STRIP.
 *   4. WHILE IT IS UP NO TAB READS AS SELECTED; a tab click dismisses it and
 *      goes there; Close returns to the tab that was active; ESCAPE DOES NOT
 *      CLOSE IT.
 *   5. THE SWITCHER IS DISABLED AND RESTORED, and no surface is posted for
 *      opening or closing.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { consoleActions, CONSOLE_OPEN_CLASS } from '../apps/control-app/src/builder/console.js'
import * as CONFIG from '../apps/control-app/src/builder/config.js'

const REPO = path.resolve(__dirname, '..')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')
const settle = () => new Promise((r) => setTimeout(r, 0))

/** Every request the builder made, so "nothing was posted" is checkable. */
let asked: string[] = []

beforeEach(() => {
  document.body.replaceChildren()
  asked = []
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    asked.push(typeof input === 'string' ? input : String(input))
    return { ok: true, status: 200, json: async () => ({}) } as unknown as Response
  }) as typeof fetch
})

/**
 * The builder, mounted over the real shell.
 *
 * THE CONSOLE'S SECTIONS ARE REPLACED WITH ONE INERT SECTION on purpose. What is
 * at stake in this file is the container; a section that reached the network
 * would make these cases depend on the meter, which is the sibling suite's
 * subject and is proved there.
 */
async function builder(over: Record<string, unknown> = {}) {
  const { mountBuilder } = await import('../apps/control-app/src/builder/app.js')
  const root = document.createElement('div')
  document.body.append(root)
  const app = mountBuilder(root, {
    businesses: [
      { id: 'biz_salon', name: 'Salon', selectable: true },
      { id: 'biz_studio', name: 'Studio', selectable: true },
    ],
    person: { name: 'Sam', email: 'sam@example.test' },
    ownsPlatformBusiness: true,
    consoleSections: [
      { id: 'inert', label: 'Inert', mount: (into: Element) => void into.append('nothing') },
    ],
    loadSites: async () => [],
    chatTransport: {
      openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: () => '',
      upload: async () => ({}),
    },
    paletteTransport: { get: async () => ({ palette: {}, usage: {} }), write: async () => ({}) },
    ...over,
  })
  await settle()
  // The mount posts its opening surface ([[REQ-235]] §5) — that is the shell's
  // own record and is not this ticket's. Cleared so what follows is only ours.
  asked = []
  return {
    app,
    shell: app.shell.element as HTMLElement,
    action: app.shell.element.querySelector(
      `[data-action="${CONFIG.CONSOLE_ACTION_ID}"]`,
    ) as HTMLButtonElement,
  }
}

const consoleOf = (shell: HTMLElement) => shell.querySelector('.builder-console')
const tabButton = (shell: HTMLElement, id: string) =>
  shell.querySelector(`.shell-tab[data-tab-id="${id}"]`) as HTMLButtonElement

// ── the shape of the thing, provable without a shell ─────────────────────────

describe('REQ-298 — the console keeps its entry point and loses its overlay', () => {
  it('test_UAT_FC_REQ-298_the_action_is_unchanged_and_still_gated_on_owning_the_platform', () => {
    // CONDITION 1. [[REQ-297]]'s gate survived the re-housing whole: what
    // changed is what the action opens, so the function that decides whether
    // there IS an action must still answer exactly as it did.
    expect(consoleActions({ ownsPlatformBusiness: false })).toEqual([])
    expect(consoleActions({})).toEqual([])
    const [action] = consoleActions({ ownsPlatformBusiness: true, open: () => {} })
    expect(action.id).toBe(CONFIG.CONSOLE_ACTION_ID)
    expect(action.ariaLabel).toBe(CONFIG.CONSOLE_LABEL)

    // CONDITION 3, at the one place it can be stated without a DOM: the strip
    // is a declared list and the console is not in it.
    expect(CONFIG.TABS.map((t: { id: string }) => t.id)).not.toContain(CONFIG.CONSOLE_ACTION_ID)
  })

  it('test_UAT_FC_REQ-298_no_dialog_form_of_the_console_remains_in_the_codebase', () => {
    // CONDITION 2's second half, and the form that stops the next hand. The
    // ticket does not say "prefer a view"; it says the dialog GOES. Two ways to
    // open one surface is the complexity this project's standards name outright,
    // and git is the archive — so the absence is asserted rather than described.
    const source = fs.readFileSync(path.join(BUILDER, 'console.js'), 'utf8')
    // COMMENTS STRIPPED, on [[REQ-297]]'s own precedent for this kind of
    // assertion: prose that EXPLAINS why the dialog went must not be mistaken
    // for the dialog still being there.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code).not.toContain('modal.js')
    expect(code).not.toContain('createModalShell')
    // AND IT BINDS NO KEY AT ALL. `modal.js` binds Escape at creation, which is
    // exactly the reflex this surface must not have — so the whole of condition
    // 4's last clause is that this file has no listener to remove.
    expect(code).not.toContain('keydown')

    // `modal.js` ITSELF STAYS. It has ten other callers and this ticket is not
    // about them; what went is the console's use of it.
    expect(fs.existsSync(path.join(BUILDER, 'modal.js'))).toBe(true)
  })

  it('test_UAT_FC_REQ-298_the_sheet_gives_the_view_a_height_chain_and_no_layering', () => {
    // CONDITION 2's first half, at the one place it is a stylesheet fact. The
    // console fills the content region, which needs that region to be a
    // shrinkable column of definite height. The shell supplies exactly that —
    // but only while the active tab is a FILL tab, which is true of all four of
    // this builder's tabs and is not a property the console should rest on. So
    // the sheet declares it under the root marker itself.
    const css = fs.readFileSync(path.join(BUILDER, 'builder.css'), 'utf8')
    expect(css).toContain(`.${CONSOLE_OPEN_CLASS} > .shell-content {`)

    // AND IT DOES NOT TRY TO HIDE THE PANELS. That was the first cut's bug: a
    // two-class rule here cannot beat `shell.css`'s eight-class `:has()` chain,
    // so the panels stayed on screen and the console took the half of the region
    // left over. Hiding them is `console.js`'s inline style now, and a rule
    // reintroduced here would look like it worked without working.
    expect(css).not.toContain(`.${CONSOLE_OPEN_CLASS} .shell-panels {`)

    // THE TYPE SIZE IS DECLARED. Nothing between `html` and this view sets one,
    // so without this every row, label and figure lands at the user agent's 16px
    // in a builder that is 13px throughout — which is what "unstyled" looks
    // like. Asserted in the sheet because jsdom applies no stylesheet.
    const block = css.slice(css.indexOf('.builder-console {'), css.indexOf('.builder-console__titles'))
    expect(block).toContain('font-size: var(--builder-control-font-size)')

    // AND THE VIEW IS NOT LAYERED. No backdrop, no scrim, nothing positioned
    // over the builder — the content region shows the console INSTEAD of the
    // panels, so there is nothing for a z-index to be above.
    expect(block).not.toContain('position')
    expect(block).not.toContain('z-index')
    expect(css).not.toContain('.builder-console__backdrop')
  })
})

// ── the view, over the real shell ────────────────────────────────────────────

if (!WEBUI_INSTALLED) console.warn(`REQ-298 view cases skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-298 — the console in the builder chrome', () => {
  it('test_UAT_FC_REQ-298_pressing_the_action_fills_the_content_region_and_hides_the_panels', async () => {
    // CONDITION 2. The console is a CHILD of the shell's content region and a
    // SIBLING of the panels container — which is what "instead of, not on top
    // of" means in markup. A dialog would be neither: it would be appended to
    // the shell root with a backdrop over everything.
    const { shell, action } = await builder()
    expect(consoleOf(shell)).toBeNull()

    action.click()
    await settle()

    const view = consoleOf(shell)!
    const content = shell.querySelector('main.shell-content')!
    const panels = shell.querySelector('.shell-panels')!
    expect(view).toBeTruthy()
    expect(view.parentElement).toBe(content)
    expect(panels.parentElement).toBe(content)
    expect(shell.classList.contains(CONSOLE_OPEN_CLASS)).toBe(true)

    // NOTHING IS LAYERED AND NOTHING IS MADE INERT, because nothing of the
    // builder is behind it. A dialog would have left both marks.
    // (The shell's own About dialog is always in the tree and always carries
    // `aria-modal`; what must not exist is a modal the CONSOLE brought.)
    expect(view.closest('[aria-modal]')).toBeNull()
    expect(view.querySelector('[aria-modal]')).toBeNull()
    expect(shell.querySelector('.builder-modal')).toBeNull()
    expect(panels.hasAttribute('inert')).toBe(false)

    // THE PANELS ARE HIDDEN AND NOT REMOVED, and that is load-bearing rather
    // than incidental: the shell's height chain is a `:has()` on a live
    // `.shell-panel.is-fill.is-active`, so removing the panel would collapse
    // the content region the console is trying to fill.
    expect(panels.querySelector('.shell-panel.is-fill.is-active')).toBeTruthy()

    // HIDDEN ON THE ELEMENT, WHICH IS THE ONLY FORM OF HIDDEN THIS CAN PROVE.
    // The first cut hid them from a class rule in `builder.css`, which loses on
    // specificity to `shell.css`'s own `:has()` chain and left the console
    // sharing the region with the panels it was supposed to replace. jsdom
    // cannot catch that — asked here, its `getComputedStyle` resolves the two
    // rules by ORDER and reports `none`, the answer no browser gives. An inline
    // style is the one declaration nothing can out-specify and nothing can
    // misreport.
    expect((panels as HTMLElement).style.display).toBe('none')

    // AND THE BODY IT WAS GIVEN IS MOUNTED, so "fills the region" is about a
    // surface with something in it.
    expect(view.querySelector('[data-section="inert"], .builder-console__body')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-298_no_tab_reads_as_selected_while_the_console_is_up', async () => {
    // CONDITION 4's first clause. The shell keeps an active tab internally — it
    // has no concept of none — and leaving that tab highlighted while its panel
    // is off screen would be the surface telling the operator they are looking
    // at something they are not. Suppressed through the shell's OWN mechanism,
    // so a screen reader is told the same thing the eye is.
    const { app, shell, action } = await builder()
    const opened = app.shell.getActiveTab()
    expect(tabButton(shell, opened).getAttribute('aria-selected')).toBe('true')

    action.click()
    await settle()

    const tabs = [...shell.querySelectorAll('.shell-tab')]
    expect(tabs.length).toBeGreaterThan(1)
    for (const tab of tabs) {
      expect(tab.getAttribute('aria-selected')).toBe('false')
      expect(tab.classList.contains('is-active')).toBe(false)
    }

    // CONDITION 3, over the real strip: no entry was added to it.
    expect(tabs.map((t) => (t as HTMLElement).dataset.tabId)).toEqual(
      CONFIG.TABS.map((t: { id: string }) => t.id),
    )
    // AND THE HEADER ACTION IS MARKED, because the way in is now a toggle and
    // the thing it opened is still there.
    expect(action.getAttribute('aria-pressed')).toBe('true')
  })

  it('test_UAT_FC_REQ-298_clicking_a_tab_dismisses_the_console_and_goes_to_that_tab', async () => {
    // CONDITION 4's second clause, and the one place "behaves like a tab" is
    // testable. The strip is the builder's primary navigation and must not stop
    // working because a view is open.
    const { app, shell, action } = await builder()
    action.click()
    await settle()

    const target = CONFIG.LIBRARY_TAB.id
    tabButton(shell, target).click()
    await settle()

    expect(consoleOf(shell)).toBeNull()
    expect(shell.classList.contains(CONSOLE_OPEN_CLASS)).toBe(false)
    expect(app.shell.getActiveTab()).toBe(target)
    // THE TAB IT WENT TO READS AS SELECTED AGAIN — the suppression was for the
    // duration of the view and not a state the strip is left in.
    expect(tabButton(shell, target).getAttribute('aria-selected')).toBe('true')
    expect(tabButton(shell, target).classList.contains('is-active')).toBe(true)
    // AND THAT NAVIGATION IS RECORDED, through the shell's ordinary
    // `onTabChange` — dismissing TO somewhere is a move and the record says so.
    expect(asked.some((url) => url.includes('/api/activity/surface'))).toBe(true)
  })

  it('test_UAT_FC_REQ-298_close_returns_to_the_tab_that_was_active_and_posts_nothing', async () => {
    // CONDITION 4's third clause, and condition 5's second. Two ways out and
    // they are not redundant: a tab click is navigation to somewhere else, Close
    // is dismissal back to where you were — which no tab in the strip can
    // express, because the strip cannot say "wherever I was".
    const { app, shell, action } = await builder()
    app.shell.setActiveTab(CONFIG.PEOPLE_TAB.id)
    await settle()
    asked = []

    action.click()
    await settle()
    ;(shell.querySelector('.builder-console__close') as HTMLButtonElement).click()
    await settle()

    expect(consoleOf(shell)).toBeNull()
    expect(app.shell.getActiveTab()).toBe(CONFIG.PEOPLE_TAB.id)
    expect(tabButton(shell, CONFIG.PEOPLE_TAB.id).getAttribute('aria-selected')).toBe('true')
    expect(action.hasAttribute('aria-pressed')).toBe(false)

    // AND THE PANELS COME BACK. The console hides them on the element itself,
    // so the way out has to put the element back exactly as it found it — a
    // leftover `display: none` here would leave the builder with no tab content
    // at all and no console on screen to explain it.
    expect((shell.querySelector('.shell-panels') as HTMLElement).style.display).toBe('')

    // NO SURFACE FOR OPENING OR CLOSING. `/api/activity/surface` is
    // business-scoped ([[REQ-235]] §5) and `console` is about every business at
    // once, so a row against whichever business happened to be open would not be
    // false so much as meaningless. Returning to the tab that was already active
    // posts nothing either — as far as the record is concerned nothing moved.
    expect(asked.filter((url) => url.includes('/api/activity/surface'))).toEqual([])
  })

  it('test_UAT_FC_REQ-298_escape_does_not_close_it', async () => {
    // CONDITION 4's last clause, and the difference between a thing you glance
    // at and a thing you work in. A surface somebody has spent twenty minutes in
    // — divider dragged, pane scrolled, selection made — must not vanish on a
    // stray keypress.
    const { shell, action } = await builder()
    action.click()
    await settle()

    for (const target of [document, shell, consoleOf(shell)!]) {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    }
    await settle()

    expect(consoleOf(shell)).toBeTruthy()
    expect(shell.classList.contains(CONSOLE_OPEN_CLASS)).toBe(true)
  })

  it('test_UAT_FC_REQ-298_a_second_press_does_not_mount_a_second_console', async () => {
    const { shell, action } = await builder()
    action.click()
    await settle()
    action.click()
    action.click()
    await settle()

    expect(shell.querySelectorAll('.builder-console')).toHaveLength(1)

    // AND THE LATCH OPENS ON EVERY ROUTE OUT, not just on the one that closed
    // it. A latch released by Close but not by a tab click would make the
    // console unopenable for the rest of the session.
    tabButton(shell, CONFIG.LIBRARY_TAB.id).click()
    await settle()
    action.click()
    await settle()
    expect(shell.querySelectorAll('.builder-console')).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-298_the_business_switcher_is_disabled_while_it_is_up_and_restored_after', async () => {
    // CONDITION 5. The switcher is prepended into the shell bar and applies to
    // every tab; it applies to NOTHING on a console about every business at
    // once. *A control that is present and silently ignored reads as a bug* is
    // [[REQ-179]]'s own objection and does not stop being true here.
    const { shell, action } = await builder()
    const select = shell.querySelector('.builder-business__select') as HTMLSelectElement
    expect(select).toBeTruthy()
    expect(select.disabled).toBe(false)

    action.click()
    await settle()
    expect(select.disabled).toBe(true)
    ;(shell.querySelector('.builder-console__close') as HTMLButtonElement).click()
    await settle()
    expect(select.disabled).toBe(false)
  })

  it('test_UAT_FC_REQ-298_an_account_with_nothing_selectable_keeps_its_disabled_switcher', async () => {
    // THE RESTORE PUTS BACK WHAT IT FOUND AND NOT WHAT IT ASSUMED. An account
    // whose every grant has lapsed has a permanently disabled switcher
    // ([[REQ-179]] reopen); naively re-enabling on close would hand that account
    // a working control onto businesses it may not enter — a real refusal undone
    // by a surface that has nothing to do with entitlement.
    const { shell, action } = await builder({
      businesses: [
        { id: 'biz_salon', name: 'Salon', selectable: false },
        { id: 'biz_studio', name: 'Studio', selectable: false },
      ],
    })
    const select = shell.querySelector('.builder-business__select') as HTMLSelectElement
    expect(select.disabled).toBe(true)

    action.click()
    await settle()
    expect(select.disabled).toBe(true)
    ;(shell.querySelector('.builder-console__close') as HTMLButtonElement).click()
    await settle()
    expect(select.disabled).toBe(true)
  })

  it('test_UAT_FC_REQ-298_a_session_that_owns_nothing_here_gets_no_action_and_no_view', async () => {
    // CONDITION 1 over the real chrome. The absence is the same absence
    // [[REQ-297]] proved — and the routes behind the console refuse that caller
    // in their own right, which the workers suite asserts.
    const { shell, action } = await builder({ ownsPlatformBusiness: false })
    expect(action).toBeNull()
    expect(consoleOf(shell)).toBeNull()
    // The account avatar is present either way: the console's absence is the
    // console's, and never a header that failed to draw.
    expect(shell.querySelector(`[data-action="${CONFIG.ACCOUNT_ACTION_ID}"]`)).toBeTruthy()
  })
})
