// @vitest-environment jsdom
/**
 * [[REQ-239]] — **the Settings tab: the record on the left, its own assistant on
 * the right.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case mounts the REAL builder over the
 * actually-installed shared `webui-*` components — the shell whose tab strip the
 * first claim is about, the split the second is about, and the `mountFields`
 * control the third is about. The seams that are injected are the network ones
 * the builder already declares, so the composition under test is the shipped one.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. THERE IS A FOURTH TAB, RIGHTMOST, AND IT FILLS. Its id is stable, its
 *      label is declared in `config.js` and appears as a literal nowhere else,
 *      and it has its own persistence keys.
 *   2. IT IS BLOCKED WITH THE OTHERS WHEN A GRANT LAPSES. It is business-scoped
 *      like every tab in the strip, which is why it is allowed to be one.
 *   3. IT HAS TWO PANES: the record, and a conversation that is NOT the site
 *      tab's. Two conversations on screen is two panes, each with its own draft.
 *   4. EDITING THE FIELD IS THE PRIMARY PATH, NOT A CONCESSION. A name typed into
 *      the box reaches the origin's rename with no conversation involved.
 *   5. THE CHROME FOLLOWS THE RECORD. A rename relabels the switcher above it,
 *      because a product that disagrees with itself on one screen is worse than
 *      one that is merely stale.
 *   6. A RENAME REPORTS WHAT IS NOW OUT OF DATE AND CHANGES NONE OF IT. Every
 *      line is an offer; there is no control here that edits a site.
 *   7. A BUSINESS SWITCH MOVES BOTH HALVES. This is a different business's record
 *      and a different conversation, not the same ones under a new heading.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let CONFIG: Record<string, any>
let SETTINGS: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-239 settings suites skipped: ${WEBUI_SKIP_REASON}`)

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
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

const settle = () => new Promise((r) => setTimeout(r, 0))

/**
 * A FACTORY AND NOT A CONSTANT, because renaming mutates the list.
 *
 * That is production behaviour rather than a test artefact: the switcher and the
 * Settings pane read ONE list — the one `/api/businesses` answered with — so a
 * rename updates the record in place and both surfaces stay in agreement without
 * a second fetch. A suite sharing one array between cases would carry the
 * previous case's rename into the next one's fixture.
 */
const businessesFixture = () => [
  { id: 'acct_bakery', name: 'Unnamed business', selectable: true },
  { id: 'acct_salon', name: 'Salon', selectable: true },
]

const ALL_LAPSED = [
  { id: 'acct_bakery', name: 'Unnamed business', selectable: false, lapse: { reason: 'expired', endedAt: null } },
]

const PERSON = { name: 'Sam', email: 'sam@example.test' }

const SITES_OF: Record<string, Array<{ site: string; latest: number | null }>> = {
  acct_bakery: [{ site: 'site-bakery', latest: null }],
  acct_salon: [{ site: 'site-salon', latest: 1 }],
}

/** What `/api/business/name` answers with — the shape `renameBusiness` returns. */
const RENAMED = {
  businessId: 'acct_bakery',
  name: 'Cole’s Bakery',
  previousName: 'Unnamed business',
  effects: {
    siteKey: 'site-bakery',
    siteName: 'Unnamed business',
    siteNameDiffers: true,
    pagesNamingPreviousName: ['home', 'about'],
  },
}

let root: HTMLElement

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ ...SETTINGS } = await import('../apps/control-app/src/builder/settings.js'))
  }
  if (!CONFIG) CONFIG = await import('../apps/control-app/src/builder/config.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/** The real builder, with every network seam recorded. */
function mount(over: Record<string, unknown> = {}) {
  const asked = {
    sessions: [] as string[],
    settingsSessions: 0,
    renames: [] as string[],
  }
  const app = mountBuilder(root, {
    businesses: over.businesses ?? businessesFixture(),
    person: PERSON,
    storage: memoryStorage(),
    loadSites: async (businessId: string | null) => SITES_OF[businessId ?? ''] ?? [],
    chatTransport: {
      openSession: async (slug: string) => {
        asked.sessions.push(slug)
        return { sessionId: `site-${slug}`, turns: [], ready: true }
      },
      openSettingsSession: async () => {
        asked.settingsSessions += 1
        return { sessionId: `business-settings-${asked.settingsSessions}`, turns: [], ready: true }
      },
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    settingsTransport: {
      saveName: async (name: string) => {
        asked.renames.push(name)
        return { ...RENAMED, name }
      },
      // THE PANE ASKS WHAT ADDRESSES THIS BUSINESS HOLDS ([[REQ-249]]), because
      // the free-web-address section beneath the name draws a field or a
      // permanent host depending on the answer. Stubbed here for the reason every
      // other seam in this fixture is: an unstubbed call reaches the real origin.
      loadAddresses: async () => ({ apex: '1stc.site', addresses: [] }),
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => ({ uid: 'm1', role: 'site', indexed: true }),
    },
    peopleTransport: { list: async () => ({ people: [] }), person: async () => ({}) },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
    ...over,
  })
  return { app, asked }
}

/**
 * The cell the name is shown in — a read cell until it is clicked.
 *
 * THAT IS WHAT *"click one, change it, done"* IS, and it is `mountFields`'s own
 * gesture rather than one this pane invented: the value reads as a value, the
 * control appears where it was, and confirming is Return or leaving it.
 */
function nameCell(app: Handle): HTMLElement {
  const cell = app.settings.element.querySelector('.fields-row[data-field="name"] .fields-value')
  expect(cell).toBeTruthy()
  return cell as HTMLElement
}

/** Click it, type, and confirm — exactly the sequence a customer performs. */
async function typeName(app: Handle, value: string) {
  nameCell(app).dispatchEvent(new Event('click', { bubbles: true }))
  const input = app.settings.element.querySelector('.fields-control-cell input') as HTMLInputElement
  expect(input).toBeTruthy()
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  // RETURN CONFIRMS — the control's own gesture, and the one the ticket describes
  // for a field you type into and are answered about.
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await settle()
  await settle()
}

// ── 1: the tab ───────────────────────────────────────────────────────────────

describe('REQ-239 AC1 — a fourth tab, rightmost', () => {
  it('test_UAT_FC_REQ-239_the_tab_is_last_in_the_strip_and_fills_the_panel', async () => {
    const { app } = mount()
    await settle()

    expect(CONFIG.TABS.at(-1)).toBe(CONFIG.SETTINGS_TAB)
    expect(CONFIG.SETTINGS_TAB.id).toBe('settings')
    // `fill` FOR THE REASON THE OTHER THREE HAVE IT: it hosts a split, and a
    // split resolves its height against the panel.
    expect(CONFIG.SETTINGS_TAB.fill).toBe(true)
    expect(app.shell.getTabs().map((t: { id: string }) => t.id).at(-1)).toBe(CONFIG.SETTINGS_TAB.id)
  })

  it('test_UAT_FC_REQ-239_the_label_is_declared_in_config_and_is_a_literal_nowhere_else', () => {
    // [[REQ-115]]'s rule: an id is stable and is what code addresses; a label is
    // provisional and must be a one-line edit to change.
    const label = CONFIG.SETTINGS_TAB.label
    const offenders = fs
      .readdirSync(BUILDER)
      .filter((f) => f.endsWith('.js') && f !== 'config.js')
      .filter((f) => fs.readFileSync(path.join(BUILDER, f), 'utf8').includes(`'${label}'`))
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_REQ-239_it_has_its_own_split_and_chat_keys', () => {
    // A SECOND `:split` AND A SECOND `:chat`. The site tab's division is where the
    // operator wants the PREVIEW divided; this one is a short form beside a
    // conversation, and a shared key would make one drag move both.
    expect(CONFIG.STORAGE_KEYS.settingsSplit).toBe(`${CONFIG.SETTINGS_TAB.id}:split`)
    expect(CONFIG.STORAGE_KEYS.settingsChat).toBe(`${CONFIG.SETTINGS_TAB.id}:chat`)
    expect(CONFIG.STORAGE_KEYS.settingsSplit).not.toBe(CONFIG.STORAGE_KEYS.split)
    expect(CONFIG.STORAGE_KEYS.settingsChat).not.toBe(CONFIG.STORAGE_KEYS.chat)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-239 AC2 — blocked with the others', () => {
  it('test_UAT_FC_REQ-239_a_lapsed_account_cannot_reach_settings_either', async () => {
    const { app } = mount({ businesses: ALL_LAPSED })
    await settle()

    // THE TABS GO AND THE CHROME STAYS ([[DOC-42]] §5). Settings is business-scoped
    // like every other tab, so it is inside the block rather than beside it —
    // there is no exception to explain.
    const panels = app.shell.element.querySelector('.shell-panels')
    expect(panels?.hasAttribute('inert')).toBe(true)
    expect(panels?.contains(app.settings.element)).toBe(true)
  })
})

// ── 3: two panes ─────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-239 AC3 — the record and its own assistant', () => {
  it('test_UAT_FC_REQ-239_both_panes_are_in_the_settings_panel_and_nowhere_else', async () => {
    const { app } = mount()
    await settle()

    const panel = app.shell.getPanel(CONFIG.SETTINGS_TAB.id)
    expect(panel.contains(app.settings.element)).toBe(true)
    expect(panel.contains(app.settingsChat.element)).toBe(true)
    // AND IT IS NOT THE SITE TAB'S CONVERSATION. `chat.js` shows ONE conversation;
    // sharing an instance would swap the site's out on every tab change and lose
    // whatever was half-typed in the other.
    expect(app.settingsChat.element).not.toBe(app.chat.element)
    expect(app.shell.getPanel(CONFIG.SITE_TAB.id).contains(app.settingsChat.element)).toBe(false)
  })

  it('test_UAT_FC_REQ-239_the_conversation_is_opened_without_naming_a_site', async () => {
    const { app, asked } = mount()
    await settle()

    // ONE SETTINGS CONVERSATION, opened alongside the site's and naming nothing.
    expect(asked.settingsSessions).toBe(1)
    expect(asked.sessions).toEqual(['site-bakery'])
    expect(app.settingsChat.getSessionId()).toBe('business-settings-1')
  })
})

// ── 4, 5, 6: the field ───────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-239 AC4 — the field is the primary path', () => {
  it('test_UAT_FC_REQ-239_typing_a_name_reaches_the_rename_with_no_conversation', async () => {
    const { app, asked } = mount()
    await settle()
    expect(nameCell(app).textContent).toContain('Unnamed business')

    await typeName(app, 'Cole’s Bakery')

    // THE SAME OPERATION THE ASSISTANT CALLS, reached the only way a browser can.
    expect(asked.renames).toEqual(['Cole’s Bakery'])
    // AND NOT THROUGH THE ASSISTANT. A settings change that went via a turn would
    // be the conversational path wearing a text field.
    expect(app.settingsChat.getChat()?.getInputMarkdown?.() ?? '').toBe('')
  })

  it('test_UAT_FC_REQ-239_the_switcher_says_the_new_name', async () => {
    const { app } = mount()
    await settle()

    await typeName(app, 'Cole’s Bakery')

    const switcher = root.querySelector('.builder-business')!
    expect(switcher.textContent).toContain('Cole’s Bakery')
    expect(switcher.textContent).not.toContain('Unnamed business')
  })

  it('test_UAT_FC_REQ-239_the_effects_are_offered_and_nothing_is_changed_by_them', async () => {
    const { app } = mount()
    await settle()

    await typeName(app, 'Cole’s Bakery')

    const notes = app.settings.element.querySelector('.builder-settings__notes')!
    // WHAT IS NOW OUT OF DATE, said as something to look at.
    expect(notes.textContent).toContain('Unnamed business')
    expect(notes.textContent).toContain('2 pages')
    // AND NOT AS SOMETHING TO PRESS. There is no control here that edits a site:
    // what to do about a site is a site edit, made in the site tab.
    expect(notes.querySelectorAll('button, a')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-239_an_empty_name_is_refused_before_it_is_sent', async () => {
    const { app, asked } = mount()
    await settle()

    await typeName(app, '   ')

    // REFUSED HERE AS WELL AS AT THE ORIGIN: `commit: 'auto'` reverts the control
    // when the commit throws, so throwing is how the customer gets their own word
    // back instead of watching a request go out that the Worker will refuse.
    expect(asked.renames).toEqual([])
    expect(SETTINGS.NAME_REQUIRED).toBeTruthy()
  })
})

// ── 7: the switch ────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-239 AC5 — a business switch moves both halves', () => {
  it('test_UAT_FC_REQ-239_the_record_and_the_conversation_both_follow_the_switch', async () => {
    const { app, asked } = mount()
    await settle()
    expect(app.settings.getBusiness()).toEqual({ id: 'acct_bakery', name: 'Unnamed business' })

    await app.scope.setBusiness('acct_salon')
    await settle()

    // A DIFFERENT BUSINESS'S RECORD, not the same one redrawn. A field still
    // holding the previous business's name, over a conversation about renaming
    // it, is the worst version of the crossing [[REQ-181]] refuses.
    expect(app.settings.getBusiness()).toEqual({ id: 'acct_salon', name: 'Salon' })
    expect(nameCell(app).textContent).toContain('Salon')
    // AND A DIFFERENT CONVERSATION.
    expect(asked.settingsSessions).toBe(2)
    expect(app.settingsChat.getSessionId()).toBe('business-settings-2')
  })

  it('test_UAT_FC_REQ-239_an_account_with_no_business_open_has_nothing_to_change', async () => {
    const { app } = mount({ businesses: [] })
    await settle()

    expect(app.settings.getBusiness()).toBe(null)
    expect(app.settings.element.textContent).toContain(SETTINGS.NO_BUSINESS)
    expect(app.settings.element.querySelector('.fields-row')).toBe(null)
  })
})
