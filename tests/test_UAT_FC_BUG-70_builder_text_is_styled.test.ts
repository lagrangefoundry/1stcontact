// @vitest-environment jsdom
/**
 * BUG-70 — **nothing the builder puts on screen is left to the browser's
 * defaults.**
 *
 * WHAT THIS FILE PROVES. Three shapes of the same fact — `.shell` declares a
 * font FAMILY and no SIZE, and form controls inherit neither by default:
 *
 *   1. A control that says `font: inherit` and no more. The shorthand RESETS
 *      `font-size`, the walk up finds no size declared anywhere, and the control
 *      lands on the document default of 16px beside chrome running at 13px.
 *      [[BUG-53]] named six of these; fourteen more were still on screen —
 *      including the business switcher and the Library's filter row.
 *   2. A control with NO `font` rule at all. Worse, and easier to miss: it does
 *      not take the wrong SIZE, it takes the user agent's own button font. Four
 *      toolbar buttons were in this state, next to an `<a>` that DID inherit and
 *      so rendered at 16px — three typographies in one bar.
 *   3. Text with no element around it. `emptyDetail` is documented `HTMLElement`
 *      and goes to `replaceChildren`; the Library and the Contacts tab passed a
 *      STRING, so the blank pane's copy was a bare text node with no box, and
 *      the component's own `.list-detail-empty` fallback was displaced by it.
 *
 * HOW IT IS ASSERTED. jsdom applies no stylesheet, so — on the doctrine
 * [[REQ-189]] set and [[BUG-53]] refined — the claim is the CSS contract that
 * produces the size rather than a box jsdom reports as zero either way. But it
 * is RESOLUTION, not existence: `winningFor` walks every rule in source order
 * and keeps the LAST `font`/`font-size` that reaches the element, because a rule
 * can name a control and still lose to a later shorthand. That is the exact
 * mistake [[BUG-53]]'s first pass shipped.
 *
 * AND IT RESOLVES THROUGH INHERITANCE, which is what makes this an audit rather
 * than a list. `font: inherit` is not a defect — it is a defect only when
 * nothing above declares a size. So `sizeSource` walks the real mounted
 * ancestry: a control whose winning word is the shorthand hands the question to
 * its parent, and a control that reaches `<html>` with nobody having answered is
 * on the browser default. Every one of the three shapes above fails that walk.
 *
 * THE SWEEPS ARE EXHAUSTIVE, NOT NAMED. A named list is what let fourteen
 * controls sit unfixed behind a green [[BUG-53]]. The DOM sweep takes every
 * control the mounted surfaces actually render; the static sweep reads every
 * text-bearing control the builder's modules CREATE, whether or not this file
 * can mount its surface. A control added later with no size fails here.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let createLibraryPanel: (opts?: Record<string, unknown>) => never
let createBusinessSwitcher: (opts?: Record<string, unknown>) => never
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-70 builder-type suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const BUILDER_DIR = repo('apps/control-app/src/builder')
const CSS = fs.readFileSync(path.join(BUILDER_DIR, 'builder.css'), 'utf8')
/** Prose in this sheet discusses `font: inherit` at length; a scan must not read it. */
const SHEET = CSS.replace(/\/\*[\s\S]*?\*\//g, '')

const TOKEN = 'var(--builder-control-font-size)'
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** Every rule in the sheet, in source order, as (selector list, declarations). */
const RULES = [...SHEET.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selectors: m[1].split(',').map((s) => s.trim()).filter(Boolean),
  body: m[2],
}))

/** The last `font`/`font-size` declaration in a block — the one that survives it. */
function lastFontDecl(body: string): { prop: string; value: string } | null {
  let out: { prop: string; value: string } | null = null
  for (const d of body.matchAll(/(?:^|\n)\s*(font|font-size)\s*:\s*([^;]+);/g)) {
    out = { prop: d[1], value: d[2].trim() }
  }
  return out
}

/**
 * The `font` word that wins for an ELEMENT, by source order.
 *
 * SPECIFICITY IS NOT MODELLED, deliberately and safely: every rule in this sheet
 * that reaches a control does so with one class (or a class and a type), so
 * specificity is equal across the board and order decides. Were a future rule to
 * raise it, this becomes an under-approximation — and the assertion it feeds
 * still errs toward demanding the last word, which is the safe direction.
 */
function winningFor(el: Element): { prop: string; value: string } | null {
  let winner: { prop: string; value: string } | null = null
  for (const rule of RULES) {
    let hits = false
    for (const sel of rule.selectors) {
      try {
        if (el.matches(sel)) { hits = true; break }
      } catch { /* a selector jsdom cannot parse reaches nothing here */ }
    }
    if (!hits) continue
    const decl = lastFontDecl(rule.body)
    if (decl) winner = decl
  }
  return winner
}

/** The same word, for a SELECTOR — for controls whose surface this file does not mount. */
function winningForSelector(selector: string): { prop: string; value: string } | null {
  let winner: { prop: string; value: string } | null = null
  for (const rule of RULES) {
    if (!rule.selectors.includes(selector)) continue
    const decl = lastFontDecl(rule.body)
    if (decl) winner = decl
  }
  return winner
}

/** Controls do not inherit their font; everything else does. */
const IS_CONTROL = (el: Element) => ['BUTTON', 'SELECT', 'INPUT', 'TEXTAREA'].includes(el.tagName)

/**
 * WHERE AN ELEMENT'S SIZE ACTUALLY COMES FROM, walking the mounted ancestry.
 *
 * `'ua'` is the defect in both its forms: either a control that nothing sizes
 * and nothing tells to inherit (shape 2 — the user agent's own font), or one
 * that inherits all the way to the root without anybody having declared a size
 * (shape 1 — the document default of 16px).
 */
function sizeSource(start: Element): { kind: 'declared' | 'ua'; value?: string; from?: Element } {
  let node: Element | null = start
  while (node) {
    const decl = winningFor(node)
    if (decl?.prop === 'font-size') return { kind: 'declared', value: decl.value, from: node }
    if (decl?.prop === 'font' && !/inherit/.test(decl.value)) {
      return { kind: 'declared', value: decl.value, from: node }
    }
    // Nothing declared here. A control that was not told to inherit stops the
    // walk on the user agent's own font; everything else asks its parent.
    const inherits = decl?.prop === 'font' && /inherit/.test(decl.value)
    if (IS_CONTROL(node) && !inherits) return { kind: 'ua', from: node }
    node = node.parentElement
  }
  return { kind: 'ua' }
}

const describeEl = (el: Element) =>
  `<${el.tagName.toLowerCase()}${el.className ? ` class="${el.className}"` : ''}>` +
  ((el.textContent || '').trim() ? ` "${(el.textContent || '').trim().slice(0, 24)}"` : '')

/** Types that paint no text of their own, so a font declaration on them is inert. */
const TEXTLESS = new Set(['checkbox', 'radio', 'color', 'range', 'file', 'hidden'])

function paintsText(el: Element): boolean {
  if (el.tagName === 'INPUT' && TEXTLESS.has((el as HTMLInputElement).type)) return false
  if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return true
  if (el.tagName === 'INPUT') return true
  return (el.textContent || '').trim().length > 0
}

const isOurs = (el: Element) => [...el.classList].some((c) => c.startsWith('builder-'))

/**
 * The controls THIS STYLESHEET is answerable for.
 *
 * NOT EVERYTHING ON THE PAGE. The mounted surfaces are the shared out-of-repo
 * components configured, so the tree also holds the chat widget's send button,
 * the split's narrow toggle and the list's collapse control — each styled by its
 * own sheet, which this file does not read and is not ours to edit. Auditing
 * them here would report a gap that exists only in what was loaded.
 *
 * A control is ours when it carries a `builder-` class, OR when it carries no
 * class at all and its nearest classed ancestor does — which is the toolbar's
 * mode toggles exactly, and is why they are IN scope. That matters: they had no
 * class and no rule, which is the very shape this audit exists to catch, so a
 * scope rule that asked for a rule to exist would have excused them.
 */
function ownControls(root: ParentNode): Element[] {
  return [...root.querySelectorAll('button, select, input, textarea')].filter((el) => {
    if (!paintsText(el)) return false
    if (el.classList.length) return isOurs(el)
    const classed = el.parentElement?.closest('[class]')
    return Boolean(classed && isOurs(classed))
  })
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() { return map.size },
  }
}

const MATERIAL = [
  {
    uid: 'material-1',
    type: 'material',
    title: 'The wordmark',
    filename: 'wordmark.svg',
    kind: 'image',
    role: 'site',
    origin: 'uploaded',
    description: 'A gold wordmark.',
    created: '2026-09-01T09:00:00.000Z',
  },
]

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

const peopleTransport = () => ({
  list: async () => ({ people: [{ ...PERSON }], canInvite: true, canFulfil: true, bounced: [] }),
  item: async () => ({ person: { ...PERSON }, emails: [], operates: [], grants: [], events: [] }),
  messages: async () => ({ messages: [] }),
  saveStatus: async () => ({}),
  saveRecord: async () => ({}),
  grant: async () => ({}),
  revoke: async () => {},
  add: async () => ({ created: true, person: { ...PERSON } }),
  inviteDraft: async () => ({ from: 'no-reply@example.test', subject: 'Hi', body: 'x', declared: [] }),
  invite: async () => ({ results: [] }),
  fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteSlug: 'acct_new' }),
})

const libraryTransport = () => ({
  list: async () => ({ material: MATERIAL, seq: 1 }),
  item: async () => ({ material: MATERIAL[0] }),
  save: async () => ({}),
  setRole: async () => ({}),
  fileUrl: () => 'about:blank',
  subscribe: () => () => {},
})

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
    ;({ createBusinessSwitcher } = await import('../apps/control-app/src/builder/business.js'))
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

/** The three surfaces the report named, mounted together. */
async function reportedSurfaces() {
  mountBuilder(root, { sites: [{ slug: 'alpha', latest: 1 }], storage: memoryStorage() })

  const switcher = createBusinessSwitcher({
    businesses: [
      { id: 'acct_a', name: 'Alpha Catering' },
      { id: 'acct_b', name: 'Beta Studio' },
    ],
    selected: 'acct_a',
  }) as unknown as { element: HTMLElement }
  root.append(switcher.element)

  const library = createLibraryPanel({
    storage: memoryStorage(),
    transport: libraryTransport(),
  }) as unknown as { element: HTMLElement; refresh(): Promise<void> }
  root.append(library.element)
  await library.refresh()
  await settle()

  return { library, switcher }
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-70 — the reported surfaces take the app type', () => {
  it('test_UAT_FC_BUG-70_the_business_selector_is_sized_by_the_app_not_the_browser', async () => {
    // REPORTED (1). `.builder-business__select` said `font: inherit` and nothing
    // else, and the walk above it found no size in the sheet at all, so it drew
    // at the document default while the header around it ran at 13px.
    const { switcher } = await reportedSurfaces()
    const select = switcher.element.querySelector('.builder-business__select')
    expect(select, 'the switcher does not render a select for two businesses').toBeTruthy()

    const source = sizeSource(select!)
    expect(source.kind, 'the business selector falls through to the browser default').toBe('declared')
    expect(source.value).toContain('--builder-control-font-size')
  })

  it('test_UAT_FC_BUG-70_the_library_filter_row_is_sized_by_the_app_not_the_browser', async () => {
    // REPORTED (2). All three — the search box and both selects — in the same
    // state, in a row that sits directly above a list the component draws at
    // 13px, which is what made it visible.
    const { library } = await reportedSurfaces()
    const row = library.element.querySelector('.builder-library__filter')
    expect(row, 'the Library does not render its filter row').toBeTruthy()

    const controls = ownControls(row!)
    expect(controls.length, 'the filter row renders no controls to check').toBe(3)
    for (const control of controls) {
      const source = sizeSource(control)
      expect(source.kind, `${describeEl(control)} falls through to the browser default`)
        .toBe('declared')
      expect(source.value).toContain('--builder-control-font-size')
    }
  })

  it('test_UAT_FC_BUG-70_the_blank_pane_is_an_element_the_stylesheet_has_a_rule_for', async () => {
    // REPORTED (3). Nothing is selected, so the detail body holds the empty
    // state — and what it holds has to be an ELEMENT. A bare text node has no
    // box, so there is nothing for a rule to reach however many rules exist.
    const { library } = await reportedSurfaces()
    const body = library.element.querySelector('.list-detail-detail-body')
    expect(body, 'the Library does not render a detail body').toBeTruthy()
    expect((body!.textContent || '')).toContain('Pick something on the left')

    const nodes = [...body!.childNodes]
    const bare = nodes.filter((n) => n.nodeType === 3 && (n.textContent || '').trim())
    expect(bare.map((n) => n.textContent), 'the empty copy is a bare text node').toEqual([])

    const pane = body!.querySelector('.builder-empty')
    expect(pane, 'the empty state carries no class the stylesheet can reach').toBeTruthy()
    expect((pane!.textContent || '').trim()).toContain('Pick something on the left')
    expect(sizeSource(pane!).kind).toBe('declared')
  })

  it('test_UAT_FC_BUG-70_the_contacts_blank_pane_is_the_same_state_and_looks_like_it', async () => {
    // The same defect, in the other list-detail surface, fixed by the same rule
    // — because "nothing is selected" is ONE state and a second treatment for it
    // is how a third gets invented.
    const made = createPeoplePanel({
      storage: memoryStorage(),
      transport: peopleTransport(),
    }) as unknown as { element: HTMLElement; refresh(): Promise<void> }
    root.append(made.element)
    await made.refresh()
    await settle()

    const body = made.element.querySelector('.list-detail-detail-body')!
    const bare = [...body.childNodes].filter((n) => n.nodeType === 3 && (n.textContent || '').trim())
    expect(bare.map((n) => n.textContent), 'the empty copy is a bare text node').toEqual([])
    expect(body.querySelector('.builder-empty'), 'the Contacts blank pane carries no class')
      .toBeTruthy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-70 — the toolbar is one typography', () => {
  it('test_UAT_FC_BUG-70_the_toolbars_buttons_and_its_link_are_one_size', async () => {
    // THE SECOND SHAPE, and the one that reads worst. `builder.css` carries
    // exactly one `button` selector, and none of the toolbar's buttons carried a
    // class it named — so they took the user agent's own button font while the
    // bar's `<a>`, which does inherit, took the document default. Two wrong
    // answers, disagreeing with each other, in a bar 12px apart.
    await reportedSurfaces()
    const bar = root.querySelector('.builder-toolbar')
    expect(bar, 'the builder does not render a toolbar').toBeTruthy()

    const link = bar!.querySelector('.builder-toolbar__open')
    expect(link, 'the toolbar does not render its open-in-new-tab link').toBeTruthy()

    const buttons = [...bar!.querySelectorAll('button')]
    expect(buttons.length, 'the toolbar renders no buttons to check')
      .toBeGreaterThanOrEqual(3)

    const sizes = new Set<string>()
    for (const el of [link!, ...buttons]) {
      const source = sizeSource(el)
      expect(source.kind, `${describeEl(el)} takes the user agent's font, not the app's`)
        .toBe('declared')
      sizes.add(source.value!)
    }
    expect([...sizes], 'the toolbar draws its text at more than one size').toEqual([TOKEN])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-70 — the audit, not a list', () => {
  it('test_UAT_FC_BUG-70_no_control_on_a_mounted_surface_falls_back_to_the_browser', async () => {
    // EXHAUSTIVE OVER WHAT IS ON SCREEN. A named list is exactly what let these
    // fourteen sit behind a green suite while [[BUG-53]]'s six were fixed, so
    // this takes every control the mounted surfaces render and resolves each
    // through the real ancestry.
    await reportedSurfaces()
    const made = createPeoplePanel({
      storage: memoryStorage(),
      transport: peopleTransport(),
    }) as unknown as { element: HTMLElement; refresh(): Promise<void> }
    root.append(made.element)
    await made.refresh()
    await settle()

    const controls = ownControls(root)
    expect(controls.length, 'nothing was mounted to audit').toBeGreaterThan(6)

    const adrift = controls
      .filter((el) => sizeSource(el).kind === 'ua')
      .map(describeEl)
    expect(adrift, `sized by the browser, not by us: ${adrift.join(' · ')}`).toEqual([])
  })

  it('test_UAT_FC_BUG-70_every_text_bearing_control_the_builder_creates_is_sized', () => {
    // AND EXHAUSTIVE OVER WHAT IS NOT. The palette popup, the upload sheet and
    // the signed-out notice are not mounted above, and all three carried the
    // defect — so the source is read directly: every class handed to a control
    // that paints text must resolve to a declared size rather than to a `font`
    // shorthand with nothing above it to inherit from.
    //
    // Types that paint no text of their own — the row checkbox, the picker's
    // radio, the palette's colour and range inputs, the file input — are
    // excluded, because a font declaration on them changes nothing on screen.
    const found = new Map<string, string>()
    for (const file of fs.readdirSync(BUILDER_DIR).filter((f) => f.endsWith('.js'))) {
      const lines = fs.readFileSync(path.join(BUILDER_DIR, file), 'utf8').split('\n')
      lines.forEach((line, i) => {
        // `document.` specifically: `points.js` builds its overlay in the
        // preview's own document, which this stylesheet cannot reach and which
        // carries its own sheet on purpose.
        const made = /document\.createElement\('(button|select|input|textarea)'\)/.exec(line)
        if (!made) return
        const decl = /(?:const|let|var)\s+(\w+)\s*=/.exec(line)
        if (!decl) return
        const scope = lines.slice(i, i + 14).join('\n')
        const cls = new RegExp(`\\b${decl[1]}\\.className\\s*=\\s*'([^']+)'`).exec(scope)
        const type = new RegExp(`\\b${decl[1]}\\.type\\s*=\\s*'([^']+)'`).exec(scope)
        if (!cls) return
        if (type && TEXTLESS.has(type[1])) return
        for (const name of cls[1].split(/\s+/)) {
          if (name.startsWith('builder-')) found.set(name, `${file}:${i + 1}`)
        }
      })
    }
    expect(found.size, 'no controls were found in the builder source to audit')
      .toBeGreaterThan(15)

    const adrift: string[] = []
    for (const [name, where] of found) {
      const decl = winningForSelector(`.${name}`)
      const sized = decl?.prop === 'font-size' || (decl?.prop === 'font' && !/inherit/.test(decl.value))
      if (!sized) adrift.push(`.${name} (${where}) → ${decl ? `${decl.prop}: ${decl.value}` : 'no rule'}`)
    }
    expect(adrift, `left to the browser's own type: ${adrift.join(' · ')}`).toEqual([])
  })

  it('test_UAT_FC_BUG-70_the_size_is_one_token_and_it_is_under_the_browsers_default', () => {
    // The repair reads the token [[BUG-53]] declared rather than restating 13px
    // fifteen more times — a literal repeated is a place to miss the day the
    // scale moves, and the one that gets missed is this bug again.
    const declared = /--builder-control-font-size:\s*(\d+(?:\.\d+)?)px/.exec(SHEET)
    expect(declared, 'the control size is not declared as a token').toBeTruthy()
    expect(Number(declared![1])).toBeLessThan(16)

    for (const selector of [
      '.builder-business__select',
      '.builder-library__search',
      '.builder-library__role',
      '.builder-palette__new-name',
      '.builder-people__fulfil-name',
      '.builder-upload__area',
      '.builder-upload__cancel',
      '.builder-signed-out-action',
      '.builder-toolbar',
    ]) {
      expect(winningForSelector(selector), `${selector} is not sized by the app's token`)
        .toEqual({ prop: 'font-size', value: TOKEN })
    }
  })
})
