// @vitest-environment jsdom
/**
 * BUG-53 — **the app's controls are one size, and that size is declared once.**
 *
 * WHAT THIS FILE PROVES. Two defects that wore the same face. The top bar's
 * Theme and About, the Users tab's filter row, its Invite and its *Provision a
 * business* all say `font: inherit` and inherit no size at all — `.shell` sets
 * only a family — so every one of them resolved to the browser's default 16px
 * while the chrome around them runs at 12-13px. And five dialog buttons spelled
 * their class `builder-modal__button`, which matches no rule anywhere, so those
 * were unstyled in the literal sense.
 *
 * AND A THIRD, FOUND ON SCREEN AFTER THE FIRST FIX SHIPPED: the sizing rule was
 * written ABOVE the rules it had to beat. `font: inherit` is a shorthand and
 * resets `font-size`; each control's own rule sits later in the same sheet at
 * equal specificity, so the shorthand won and five of the six controls never
 * moved. Theme and About did move, which is what made it legible — their
 * `font: inherit` lives in an earlier component sheet, so for them ours was the
 * later word. Same rule, same token, opposite outcome, decided entirely by which
 * file each competing declaration sat in.
 *
 * WHAT IS ASSERTED AND WHAT DELIBERATELY IS NOT, on REQ-189's doctrine: jsdom
 * applies no stylesheet and computes no layout, so "the same size" is proven by
 * the CSS contract that produces it rather than by measuring boxes jsdom reports
 * as zero either way. But the contract asserted is RESOLUTION, not existence:
 * for each control this walks every rule that names it and requires the LAST
 * `font`-family declaration to be the token. The first pass asserted existence,
 * passed, and shipped the defect — a rule can name all six controls and reach
 * none of them. What IS mounted is the DOM: each selector is checked against
 * elements the real components actually render, so a rule that has stopped
 * matching anything fails here rather than passing by describing a control that
 * no longer exists.
 *
 * THE STATIC SWEEP AT THE END is the half REQ-189 could not have caught. Its
 * dialog test swept classes prefixed `builder-people`, so a `builder-modal__*`
 * typo walked straight through it. This one reads every class literal handed to
 * `modalButton` anywhere in the builder and requires a rule for each.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-53 control-type suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const BUILDER_DIR = repo('apps/control-app/src/builder')
const CSS = fs.readFileSync(path.join(BUILDER_DIR, 'builder.css'), 'utf8')

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** The browser default these controls used to take, and the thing to be under. */
const BROWSER_DEFAULT_PX = 16

/**
 * Every control the report named, as the selector that has to carry the size.
 * The top bar's two are one selector because the shell gives them one class.
 */
const CONTROLS = [
  '.shell-actions button',
  '.builder-people__search',
  // Was `.builder-people__states`, and is now the class BOTH facets carry:
  // [[REQ-188]] split the one state select into a pipeline one and an access
  // one ([[DOC-44]] §3), which share a rule and differ by `data-axis`. The
  // claim this file makes is unchanged — the control in that row is sized and
  // padded like its neighbours — and now covers two elements rather than one.
  '.builder-people__facet',
  '.builder-people__invite',
  '.builder-people__fulfil',
  '.builder-modal__btn',
]

/**
 * The `font`/`font-size` declaration that WINS for a selector, by source order.
 *
 * WHY RESOLUTION AND NOT EXISTENCE. The first pass at this bug asserted that a
 * rule naming all six controls existed, and it did — and five of the six still
 * rendered at 16px. `font: inherit` is a shorthand that resets `font-size`, and
 * each control's own rule sits later in the sheet at equal specificity (one
 * class each), so the shorthand won and the sizing rule lost. A test that reads
 * for the presence of a rule cannot see that; it passed the whole time the
 * defect was on screen.
 *
 * Every rule here that names one of these controls does so with a single class
 * (or `.shell-actions button`, a class and a type), so specificity is equal
 * across the board and SOURCE ORDER decides — which is what this walks. If a
 * future rule raises specificity, this becomes an under-approximation and the
 * assertion is still the safe direction: it would demand the last word.
 */
function winningFontDecl(selector: string): { prop: string; value: string } | null {
  // Comments carry prose about `font: inherit`; a declaration scan must not read it.
  const sheet = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  let winner: { prop: string; value: string } | null = null
  for (const rule of sheet.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = rule[1].split(',').map((s) => s.trim())
    if (!selectors.includes(selector)) continue
    for (const decl of rule[2].matchAll(/(?:^|\n)\s*(font|font-size)\s*:\s*([^;]+);/g)) {
      winner = { prop: decl[1], value: decl[2].trim() }
    }
  }
  return winner
}

/** The token as every control has to end up reading it. */
const TOKEN = 'var(--builder-control-font-size)'

/** A `Storage`-shaped map — the panel persists its filter. */
function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

const PERSON = {
  id: 'usr_1',
  email: 'alice@example.test',
  displayName: 'Alice Adams',
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  createdAt: '2026-09-01T09:00:00.000Z',
}

/** `canInvite`/`canFulfil` both true: this suite needs both dialogs reachable. */
function transport() {
  return {
    list: async () => ({ people: [{ ...PERSON }], canInvite: true, canFulfil: true }),
    item: async () => ({ person: { ...PERSON }, operates: [], grants: [] }),
    saveStatus: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    invite: async () => ({ created: true, person: { ...PERSON } }),
    fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteSlug: 'acct_new' }),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
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
    dispatchEvent: () => false,
  })) as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/** The Users tab, with its one person selected so the detail pane is drawn. */
async function usersTab() {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() })
  root.append((made as unknown as { element: HTMLElement }).element)
  await (made as unknown as { refresh(): Promise<void> }).refresh()
  ;(made as unknown as { listDetail: { select(k: string): void } }).listDetail.select('usr_1')
  await settle()
  await settle()
  return made
}

const click = (sel: string) => (root.querySelector(sel) as HTMLElement).click()

describe.skipIf(!WEBUI_INSTALLED)('BUG-53 — one control size, declared once', () => {
  it('test_UAT_FC_BUG-53_every_control_the_report_named_takes_one_declared_size', async () => {
    // THE DEFECT, STATED AS A TEST. Six controls, one token — because a
    // `font-size` written out per rule is six places to find the day the scale
    // moves, and the one that gets missed is this bug again.
    for (const control of CONTROLS) {
      const decl = winningFontDecl(control)
      expect(decl, `${control} is sized by nothing at all`).toBeTruthy()
      expect(decl!.value, `${control} is not sized by the app's control token`).toContain(
        '--builder-control-font-size',
      )
    }
  })

  it('test_UAT_FC_BUG-53_no_controls_size_is_left_to_a_later_font_shorthand', () => {
    // THE SECOND PASS, AND THE ONE THAT COST A ROUND TRIP TO THE BROWSER. Every
    // control here says `font: inherit` somewhere, and that shorthand RESETS
    // `font-size`. Declare the token earlier in the sheet than the shorthand and
    // the shorthand wins at equal specificity, which is exactly what happened:
    // Theme and About took the new size (their `font: inherit` is in an earlier
    // component sheet, so ours is the later word) and all five controls on the
    // Users tab did not (theirs are in THIS sheet, below the sizing rule).
    //
    // So it is not enough that the token be applied. It has to be applied LAST.
    for (const control of CONTROLS) {
      expect(
        winningFontDecl(control),
        `${control}: a later \`font\` shorthand overrides the control size, ` +
          'so the rule that names it has no effect on screen',
      ).toEqual({ prop: 'font-size', value: TOKEN })
    }
  })

  it('test_UAT_FC_BUG-53_that_size_is_smaller_than_the_default_they_used_to_take', () => {
    // "Smaller", asserted against the value they actually had rather than a
    // literal restated here: nothing declared a size, so the browser's default
    // is what they were.
    const declared = /--builder-control-font-size:\s*(\d+(?:\.\d+)?)px/.exec(CSS)
    expect(declared, 'the control size is not declared as a token').toBeTruthy()
    expect(Number(declared![1])).toBeLessThan(BROWSER_DEFAULT_PX)
  })

  it('test_UAT_FC_BUG-53_the_top_bars_own_actions_are_reached_by_that_rule', () => {
    // The shell is a shared out-of-repo component and is not ours to edit, so
    // its buttons are sized by an override here. Two halves make that work and
    // both are asserted: the selector matches what the shell actually renders,
    // and `builder.css` is emitted AFTER the component stylesheets, which is
    // what lets a same-specificity rule win.
    mountBuilder(root, { sites: [{ slug: 'alpha', latest: 1 }], storage: memoryStorage() })
    const labels = [...root.querySelectorAll('.shell-actions button')].map((b) =>
      (b.textContent || '').trim(),
    )
    expect(labels, 'the top bar does not render Theme and About as shell actions').toEqual(
      expect.arrayContaining(['Theme', 'About']),
    )

    expect(
      winningFontDecl('.shell-actions button'),
      'nothing here overrides the shell component\'s own action-button size',
    ).toEqual({ prop: 'font-size', value: TOKEN })

    const html = fs.readFileSync(repo('apps/control-app/src/chrome.ts'), 'utf8')
    const componentSheets = html.indexOf('styles.map(')
    const ours = html.indexOf('/builder/builder.css')
    expect(componentSheets).toBeGreaterThan(-1)
    expect(ours, 'builder.css must be emitted after the component stylesheets').toBeGreaterThan(
      componentSheets,
    )
  })

  it('test_UAT_FC_BUG-53_the_filter_rows_controls_share_one_height', async () => {
    // Three controls in one row had three paddings — `3px 6px`, `3px 10px`,
    // `4px 12px` — so the row did not read as one control group. Asserted as
    // the token, and against the DOM, so a rule that stopped matching anything
    // cannot pass by describing a control that is no longer rendered.
    await usersTab()
    for (const sel of ['.builder-people__search', '.builder-people__facet', '.builder-people__invite']) {
      expect(root.querySelector(sel), `${sel} is not rendered`).toBeTruthy()
    }
    expect(root.querySelector('.builder-people__fulfil'), 'the fulfil control is not rendered')
      .toBeTruthy()

    for (const sel of [
      '\\.builder-people__search,\\s*\\n?\\.builder-people__facet',
      '\\.builder-people__invite',
      '\\.builder-people__fulfil',
    ]) {
      const body = new RegExp(`${sel}\\s*\\{([^}]*)\\}`).exec(CSS)
      expect(body, `no rule for ${sel}`).toBeTruthy()
      expect(body![1], `${sel} still declares its own padding`).toContain(
        'padding: var(--builder-control-padding);',
      )
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-53 — nothing these surfaces emit is unstyled', () => {
  it('test_UAT_FC_BUG-53_every_class_the_tab_and_its_dialogs_emit_has_a_rule', async () => {
    // WIDER THAN REQ-189's SWEEP, deliberately. That one filtered to classes
    // prefixed `builder-people`, which is exactly why the five
    // `builder-modal__button` buttons — a class with no rule anywhere — passed
    // it while rendering at the browser's defaults inside an otherwise styled
    // dialog. Every `builder-` class, including the dialog chrome's own.
    await usersTab()
    click('.builder-people__invite')
    await settle()
    click('.builder-people__fulfil')
    await settle()

    const emitted = new Set<string>()
    for (const node of root.querySelectorAll('[class]')) {
      for (const name of node.classList) if (name.startsWith('builder-')) emitted.add(name)
    }
    expect(emitted.size).toBeGreaterThan(20)
    const unstyled = [...emitted].sort().filter((name) => !CSS.includes(`.${name}`))
    expect(unstyled, `no rule matches: ${unstyled.join(', ')}`).toEqual([])

    // The dialogs were reached, not merely the tab: their footer button is the
    // one class only an opened dialog can emit.
    expect([...emitted]).toContain('builder-modal__btn')
  })

  it('test_UAT_FC_BUG-53_no_dialog_anywhere_asks_for_a_class_that_does_not_exist', () => {
    // The rendered sweep above reaches the two dialogs this tab opens. This one
    // reaches the rest: every class literal handed to `modalButton` in the
    // builder, whichever surface opens it, must be a class the stylesheet has.
    const files = fs.readdirSync(BUILDER_DIR).filter((f) => f.endsWith('.js'))
    const asked = new Set<string>()
    for (const file of files) {
      const src = fs.readFileSync(path.join(BUILDER_DIR, file), 'utf8')
      for (const m of src.matchAll(/modalButton\(\s*(?:'[^']*'|"[^"]*"|[^,]+),\s*'([^']+)'/g)) {
        for (const name of m[1].split(/\s+/)) if (name) asked.add(name)
      }
    }
    expect(asked.size, 'no modalButton call sites were found to check').toBeGreaterThan(0)
    const missing = [...asked].sort().filter((name) => !CSS.includes(`.${name}`))
    expect(missing, `asked for but never declared: ${missing.join(', ')}`).toEqual([])
  })

  it('test_UAT_FC_BUG-53_each_dialog_marks_its_affirmative_button_the_way_the_app_does', async () => {
    // Every other dialog in the builder (`editor.js`, `palette-popup.js`) marks
    // its confirming button `--primary` and leaves the dismissing one plain.
    // These two did neither, because their class matched nothing at all.
    await usersTab()

    for (const [opener, affirm] of [
      ['.builder-people__invite', 'Invite'],
      ['.builder-people__fulfil', 'Provision'],
    ] as const) {
      click(opener)
      await settle()
      const buttons = [...root.querySelectorAll('.builder-modal__footer button')]
      const byLabel = (label: string) =>
        buttons.find((b) => (b.textContent || '').trim() === label) as HTMLElement

      expect(byLabel(affirm), `${affirm} is not in the dialog footer`).toBeTruthy()
      expect(byLabel(affirm).classList.contains('builder-modal__btn')).toBe(true)
      expect(
        byLabel(affirm).classList.contains('builder-modal__btn--primary'),
        `${affirm} is not marked as the affirmative action`,
      ).toBe(true)

      expect(byLabel('Close'), 'the dismissing button is missing').toBeTruthy()
      expect(byLabel('Close').classList.contains('builder-modal__btn')).toBe(true)
      expect(
        byLabel('Close').classList.contains('builder-modal__btn--primary'),
        'the dismissing button must not be marked affirmative',
      ).toBe(false)

      byLabel('Close').click()
      await settle()
    }
  })
})
