// @vitest-environment jsdom
/**
 * story-e674c60a — **the builder's text is the app's, not the browser's**
 * (BUG-70; AC-2232, AC-2463).
 *
 * WHAT MAKES THIS EVIDENCE. The real builder shell, the real business switcher,
 * the real Library and the real Contacts tab are mounted over the
 * ACTUALLY-INSTALLED shared `webui-*` components. Only the network is replaced,
 * through the transport seam each panel already exposes.
 *
 * jsdom applies no stylesheet, so the claim is the CSS contract that produces
 * the size: the sheets the workspace document links, in the order it links them
 * (the component sheets from the generated import map, then `builder.css`), are
 * parsed, and for every element the LAST `font`/`font-size` declaration that
 * reaches it in source order is the one that wins. A `font: inherit` hands the
 * question to the parent; a form control with no font rule at all stops on the
 * user agent's own font. That walk is run over the real mounted ancestry, so a
 * control inheriting from a sized ancestor passes and one inheriting from
 * nothing fails.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a typography suite skipped: ${WEBUI_SKIP_REASON}`)

const REPO = path.resolve(__dirname, '..')
const BUILDER_DIR = path.join(REPO, 'apps/control-app/src/builder')
const BUILDER_SHEET = '/builder/builder.css'
const TOKEN = 'var(--builder-control-font-size)'

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let createPeoplePanel: (opts?: Record<string, unknown>) => Handle
let createLibraryPanel: (opts?: Record<string, unknown>) => Handle
let createBusinessSwitcher: (opts?: Record<string, unknown>) => Handle

// ── the cascade, as far as font size goes ─────────────────────────────────────

const uncomment = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

type Decl = { prop: string; value: string }
type Rule = { sheet: string; selectors: string[]; decls: Decl[] }

function parseRules(sheet: string, css: string): Rule[] {
  const rules: Rule[] = []
  for (const m of uncomment(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const decls = m[2]
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.includes(':'))
      .map((d) => {
        const at = d.indexOf(':')
        return { prop: d.slice(0, at).trim(), value: d.slice(at + 1).trim() }
      })
    rules.push({ sheet, selectors, decls })
  }
  return rules
}

/** The stylesheets the workspace document links, in the order it links them. */
function loadedRules(): Rule[] {
  const map = JSON.parse(
    fs.readFileSync(path.join(REPO, 'apps/control-app/src/generated/importmap.json'), 'utf8'),
  ) as { styles: string[] }
  const rules: Rule[] = []
  for (const href of map.styles) {
    const m = /^\/webui\/([^/]+)\/(.+)$/.exec(href)!
    rules.push(...parseRules(href, fs.readFileSync(path.join(webuiPackageDir(m[1]), m[2]), 'utf8')))
  }
  rules.push(...parseRules(BUILDER_SHEET, fs.readFileSync(path.join(BUILDER_DIR, 'builder.css'), 'utf8')))
  return rules
}

const matches = (el: Element, selector: string) => {
  try {
    return el.matches(selector)
  } catch {
    return false
  }
}

/** The last declaration of one of `props` that reaches `el`, taking every rule in source order. */
function winning(el: Element, rules: Rule[], props: string[]): (Decl & { sheet: string }) | null {
  let out: (Decl & { sheet: string }) | null = null
  for (const rule of rules) {
    if (!rule.selectors.some((s) => matches(el, s))) continue
    for (const d of rule.decls) if (props.includes(d.prop)) out = { ...d, sheet: rule.sheet }
  }
  return out
}

const IS_CONTROL = (el: Element) => ['BUTTON', 'SELECT', 'INPUT', 'TEXTAREA'].includes(el.tagName)
const inheritsSize = (d: Decl) => /\binherit\b/.test(d.value) && (d.prop === 'font' || d.prop === 'font-size')

/**
 * Where an element's size comes from, walking its mounted ancestry.
 * `ua` is a browser default: a control with no font rule (the user agent's own
 * font) or an inheritance chain that reaches the root with nothing declared.
 */
function sizeSource(start: Element, rules: Rule[]): { kind: 'declared' | 'ua'; value?: string; at?: Element } {
  let node: Element | null = start
  while (node) {
    const decl = winning(node, rules, ['font', 'font-size'])
    if (decl && !inheritsSize(decl)) return { kind: 'declared', value: decl.value, at: node }
    if (!decl && IS_CONTROL(node)) return { kind: 'ua', at: node }
    node = node.parentElement
  }
  return { kind: 'ua' }
}

const describeEl = (el: Element) =>
  `<${el.tagName.toLowerCase()}${el.className ? ` class="${el.className}"` : ''}>` +
  ((el.textContent || '').trim() ? ` "${(el.textContent || '').trim().slice(0, 24)}"` : '')

/** Types that paint no text, so a font declaration on them changes nothing on screen. */
const TEXTLESS = new Set(['checkbox', 'radio', 'color', 'range', 'file', 'hidden'])

function paintsText(el: Element): boolean {
  if (el.tagName === 'INPUT') return !TEXTLESS.has((el as HTMLInputElement).type)
  if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return true
  return (el.textContent || '').trim().length > 0
}

const isOurs = (el: Element) => [...el.classList].some((c) => c.startsWith('builder-'))

/**
 * The text-bearing controls the builder stylesheet answers for: those carrying a
 * `builder-` class, and unclassed ones whose nearest classed ancestor is ours
 * (the toolbar's mode toggles). Controls the shared components render carry
 * their own classes and are styled by their own sheets — exempt.
 */
function ownControls(root: ParentNode): Element[] {
  return [...root.querySelectorAll('button, select, input, textarea')].filter((el) => {
    if (!paintsText(el)) return false
    if (el.classList.length) return isOurs(el)
    const classed = el.parentElement?.closest('[class]')
    return Boolean(classed && isOurs(classed))
  })
}

// ── fixtures ──────────────────────────────────────────────────────────────────

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

const settle = async (n = 6) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
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

const quietChat = {
  openSession: async (slug: string) => ({ sessionId: `s-${slug}`, turns: [], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
    ;({ createBusinessSwitcher } = await import('../apps/control-app/src/builder/business.js'))
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
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

async function mountLibrary(host: HTMLElement) {
  const library = createLibraryPanel({ storage: memoryStorage(), transport: libraryTransport() })
  host.append(library.element)
  await library.refresh()
  await settle()
  return library
}

async function mountContacts(host: HTMLElement) {
  const panel = createPeoplePanel({ storage: memoryStorage(), transport: peopleTransport() })
  host.append(panel.element)
  await panel.refresh()
  await settle()
  return panel
}

// ── AC-2232 ───────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — every text-bearing builder control is one size', () => {
  it('test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry', async () => {
    const BUILDER_CSS = uncomment(fs.readFileSync(path.join(BUILDER_DIR, 'builder.css'), 'utf8'))

    // ── ONE DEFINITION SITE, 13px, SMALLER THAN THE BROWSER DEFAULT ──────────
    const defs = [...BUILDER_CSS.matchAll(/--builder-control-font-size\s*:\s*([^;]+);/g)]
    expect(defs, 'the control size token must be declared exactly once').toHaveLength(1)
    expect(defs[0][1].trim()).toBe('13px')
    expect(parseFloat(defs[0][1])).toBeLessThan(16)
    // No control restates the size as a literal: every mounted control below must
    // resolve to the token itself, so a `font-size: 13px` on one is reported.

    const rules = loadedRules()
    const builderRules = rules.filter((r) => r.sheet === BUILDER_SHEET)
    const builderClasses = new Set(
      builderRules.flatMap((r) => r.selectors.flatMap((s) => s.match(/\.[\w-]+/g) ?? []).map((c) => c.slice(1))),
    )

    // ── MOUNT THE REAL SURFACES ──────────────────────────────────────────────
    const app = mountBuilder(root, {
      sites: [{ slug: 'alpha', latest: 1 }],
      storage: memoryStorage(),
      markdownReady: Promise.resolve(),
      chatTransport: quietChat,
      libraryTransport: libraryTransport(),
      peopleTransport: peopleTransport(),
    })
    await settle()

    const switcher = createBusinessSwitcher({
      businesses: [
        { id: 'acct_a', name: 'Alpha Catering' },
        { id: 'acct_b', name: 'Beta Studio' },
      ],
      selected: 'acct_a',
    })
    root.append(switcher.element)
    const library = await mountLibrary(root)
    const contactsHost = document.createElement('div')
    root.append(contactsHost)
    const contacts = await mountContacts(contactsHost)
    contacts.listDetail.select('usr_1')
    await settle()

    const emitted = new Set<string>()
    const adrift: string[] = []
    const offToken: string[] = []
    let audited = 0
    /** Audit everything currently in the document — run again while each dialog is open. */
    const audit = () => {
      for (const node of root.querySelectorAll('[class]')) {
        for (const name of node.classList) if (name.startsWith('builder-')) emitted.add(name)
      }
      for (const el of ownControls(root)) {
        audited += 1
        const source = sizeSource(el, rules)
        if (source.kind === 'ua') adrift.push(describeEl(el))
        else if (source.value !== TOKEN) offToken.push(`${describeEl(el)} → ${source.value}`)
      }
    }
    audit()

    // Named surfaces the criterion lists are actually on screen and covered.
    const topBar = [...root.querySelectorAll('.shell-actions button')].filter((b) =>
      ['Theme', 'About'].includes((b.textContent || '').trim()),
    )
    expect(topBar.map((b) => b.textContent!.trim()).sort()).toEqual(['About', 'Theme'])
    for (const b of topBar) expect(sizeSource(b, rules)).toMatchObject({ kind: 'declared', value: TOKEN })
    // Their shorthand lives in the shell sheet, loaded before ours; ours is the later word.
    const topWin = winning(topBar[0], rules, ['font', 'font-size'])!
    expect(topWin).toMatchObject({ prop: 'font-size', value: TOKEN, sheet: BUILDER_SHEET })
    expect(
      rules.some(
        (r) => r.sheet !== BUILDER_SHEET && r.selectors.some((s) => matches(topBar[0], s)) && r.decls.some((d) => d.prop === 'font'),
      ),
    ).toBe(true)

    const select = switcher.element.querySelector('.builder-business__select')
    expect(select, 'the business switcher renders no select').toBeTruthy()
    expect(sizeSource(select!, rules)).toMatchObject({ kind: 'declared', value: TOKEN })

    const libraryRow = library.element.querySelector('.builder-library__filter')
    expect(libraryRow, 'the Library renders no filter row').toBeTruthy()
    const libraryControls = ownControls(libraryRow!)
    expect(libraryControls.map((c) => c.tagName).sort()).toEqual(['INPUT', 'SELECT', 'SELECT'])

    // ── THE TOOLBAR IS ONE TYPOGRAPHY: ITS BUTTONS AND ITS LINK ──────────────
    const bar = root.querySelector('.builder-toolbar')
    expect(bar, 'the builder renders no toolbar').toBeTruthy()
    const link = bar!.querySelector('.builder-toolbar__open')
    expect(link, 'the toolbar renders no open-in-new-tab link').toBeTruthy()
    const barButtons = [...bar!.querySelectorAll('button')].filter(paintsText)
    expect(barButtons.length).toBeGreaterThanOrEqual(3)
    const barSizes = new Set<string>()
    for (const el of [link!, ...barButtons]) {
      const source = sizeSource(el, rules)
      expect(source.kind, `${describeEl(el)} takes the browser's font`).toBe('declared')
      barSizes.add(source.value!)
    }
    expect([...barSizes]).toEqual([TOKEN])
    // The link inherits it from the sized toolbar rather than restating it.
    expect(sizeSource(link!, rules).at).not.toBe(link)

    // ── THE CONTACTS FILTER ROW SHARES ONE PADDING ───────────────────────────
    const search = contactsHost.querySelector('.builder-people__search') as HTMLElement
    const facets = [...contactsHost.querySelectorAll('.builder-people__facet')] as HTMLElement[]
    const inviteBtn = contactsHost.querySelector('.builder-people__invite') as HTMLButtonElement
    expect(search && inviteBtn && facets.length > 0, 'the Contacts filter row is incomplete').toBe(true)
    const paddings = [search, ...facets, inviteBtn].map((el) => winning(el, rules, ['padding'])?.value)
    expect(paddings[0]).toBeTruthy()
    expect(new Set(paddings).size, `filter row paddings differ: ${paddings.join(' | ')}`).toBe(1)

    // ── EVERY CONTACTS DIALOG: CANONICAL CLASSES, PRIMARY AFFIRMATIVE ────────
    const openers: Array<{ name: string; open: () => Promise<void>; affirm: RegExp }> = [
      {
        name: 'Add a contact',
        open: async () => (contactsHost.querySelector('.builder-people__add') as HTMLElement).click(),
        affirm: /^Add$/,
      },
      {
        name: 'Invite',
        open: async () => {
          const box = contactsHost.querySelector('.builder-people__check') as HTMLInputElement
          expect(box, 'the Contacts rows carry no selection checkbox').toBeTruthy()
          box.checked = true
          box.dispatchEvent(new Event('change'))
          await settle()
          expect(inviteBtn.disabled, 'Invite stays disabled with a row ticked').toBe(false)
          inviteBtn.click()
        },
        affirm: /^Send \d+$/,
      },
      {
        name: 'Provision a business',
        open: async () => (contactsHost.querySelector('.builder-people__fulfil') as HTMLElement).click(),
        affirm: /^Provision$/,
      },
    ]
    for (const { name, open, affirm } of openers) {
      await open()
      await settle()
      const buttons = [...contactsHost.querySelectorAll('.builder-modal__footer button')] as HTMLElement[]
      expect(buttons.length, `the ${name} dialog rendered no footer buttons`).toBeGreaterThanOrEqual(2)
      const yes = buttons.find((b) => affirm.test((b.textContent || '').trim()))
      const close = buttons.find((b) => (b.textContent || '').trim() === 'Close')
      expect(yes, `the ${name} dialog has no affirmative button`).toBeTruthy()
      expect(close, `the ${name} dialog has no Close`).toBeTruthy()
      for (const b of buttons) {
        expect(b.classList.contains('builder-modal__btn'), `${name}: ${describeEl(b)} lacks the canonical class`).toBe(true)
        for (const c of b.classList) expect(builderClasses.has(c), `.${c} has no builder rule`).toBe(true)
      }
      expect(yes!.classList.contains('builder-modal__btn--primary')).toBe(true)
      expect(close!.classList.contains('builder-modal__btn--primary')).toBe(false)
      // Dialog buttons keep their larger footer padding; only the type size is unified.
      expect(winning(yes!, rules, ['padding'])?.value).not.toBe('var(--builder-control-padding)')
      expect(sizeSource(yes!, rules)).toMatchObject({ kind: 'declared', value: TOKEN })
      audit()
      close!.click()
      await settle()
    }

    // ── THE EXHAUSTIVE MOUNTED SWEEP ─────────────────────────────────────────
    expect(audited, 'nothing was mounted to audit').toBeGreaterThan(20)
    expect(adrift, `sized by the browser, not by the builder: ${adrift.join(' · ')}`).toEqual([])
    expect(offToken, `sized, but not by the control token: ${offToken.join(' · ')}`).toEqual([])
    const unmatched = [...emitted].sort().filter((c) => !builderClasses.has(c))
    expect(unmatched, `no builder rule matches: ${unmatched.join(', ')}`).toEqual([])

    // ── THE STATIC SWEEP: CONTROLS THE MODULES CREATE, MOUNTED OR NOT ────────
    const found = new Map<string, string>()
    for (const file of fs.readdirSync(BUILDER_DIR).filter((f) => f.endsWith('.js'))) {
      const lines = fs.readFileSync(path.join(BUILDER_DIR, file), 'utf8').split('\n')
      lines.forEach((line, i) => {
        // `document.` only: the Marked Points overlay is built in the preview's
        // own document and styled by its own sheet — exempt.
        const made = /document\.createElement\('(button|select|input|textarea)'\)/.exec(line)
        const decl = made && /(?:const|let|var)\s+(\w+)\s*=/.exec(line)
        if (!decl) return
        const scope = lines.slice(i, i + 14).join('\n')
        const cls = new RegExp(`\\b${decl[1]}\\.className\\s*=\\s*'([^']+)'`).exec(scope)
        const type = new RegExp(`\\b${decl[1]}\\.type\\s*=\\s*'([^']+)'`).exec(scope)
        if (!cls || (type && TEXTLESS.has(type[1]))) return
        for (const c of cls[1].split(/\s+/)) if (c.startsWith('builder-')) found.set(c, `${file}:${i + 1}`)
      })
    }
    for (const required of ['builder-palette__new-name', 'builder-upload__cancel', 'builder-signed-out-action']) {
      expect([...found.keys()], `the static sweep missed ${required}`).toContain(required)
    }
    const unsized: string[] = []
    for (const [name, where] of found) {
      let decl: Decl | null = null
      for (const r of builderRules) {
        if (!r.selectors.includes(`.${name}`)) continue
        for (const d of r.decls) if (d.prop === 'font' || d.prop === 'font-size') decl = d
      }
      if (!decl || inheritsSize(decl)) unsized.push(`.${name} (${where}) → ${decl ? `${decl.prop}: ${decl.value}` : 'no rule'}`)
    }
    expect(unsized, `left to the browser's own type: ${unsized.join(' · ')}`).toEqual([])

    app.destroy?.()
  })
})

// ── AC-2463 ───────────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a — the empty detail state is one styled box', () => {
  it('test_UAT_AC2463_library_and_contacts_show_their_empty_prompt_in_one_shared_styled_box', async () => {
    const rules = loadedRules()
    const builderRules = rules.filter((r) => r.sheet === BUILDER_SHEET)

    const library = await mountLibrary(root)
    const contactsHost = document.createElement('div')
    root.append(contactsHost)
    const contacts = await mountContacts(contactsHost)

    const surfaces = [
      { name: 'Library', host: library.element as HTMLElement, prompt: 'Pick something on the left, or drop a file here to add one.' },
      { name: 'Contacts', host: contacts.element as HTMLElement, prompt: 'Select a person.' },
    ]
    const classes: string[][] = []
    for (const { name, host, prompt } of surfaces) {
      const body = host.querySelector('.list-detail-detail-body')
      expect(body, `${name} renders no detail body`).toBeTruthy()
      // Never a bare text node: a node with no box has nothing for a rule to reach.
      const bare = [...body!.childNodes].filter((n) => n.nodeType === 3 && (n.textContent || '').trim())
      expect(bare.map((n) => n.textContent), `${name}: the empty copy is a bare text node`).toEqual([])

      const box = body!.querySelector('.builder-empty')
      expect(box, `${name}: the empty state carries no shared class`).toBeTruthy()
      expect((box!.textContent || '').trim()).toBe(prompt)
      classes.push([...box!.classList].sort())

      // Its size resolves to the control token through its ancestry, not the default.
      expect(sizeSource(box!, rules), `${name}: the empty state is sized by the browser`).toMatchObject({
        kind: 'declared',
        value: TOKEN,
      })
    }
    // Same box in both panes, different words.
    expect(classes[0]).toEqual(classes[1])

    // One rule for it in the builder sheet: centred, padded and muted.
    const own = builderRules.filter((r) => r.selectors.includes('.builder-empty'))
    expect(own, 'the builder stylesheet has no single rule for .builder-empty').toHaveLength(1)
    const decls = Object.fromEntries(own[0].decls.map((d) => [d.prop, d.value]))
    expect(decls['font-size']).toBe(TOKEN)
    expect(decls['text-align']).toBe('center')
    expect(decls['justify-content']).toBe('center')
    expect(decls['align-items']).toBe('center')
    expect(decls.padding, 'the empty state is not padded').toBeTruthy()
    expect(decls.padding).not.toMatch(/^0(px)?$/)
    expect(decls.color, 'the empty state is not muted').toMatch(/muted/)
  })
})
