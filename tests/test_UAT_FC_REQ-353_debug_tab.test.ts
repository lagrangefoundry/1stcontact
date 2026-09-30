// @vitest-environment jsdom
/**
 * [[REQ-353]] — **the Debug tab, and the switch on it**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case mounts the REAL builder over the
 * actually-installed shared `webui-*` components — the shell whose tab strip the
 * first claim is about, and the `mountFields` control the switch actually is. The
 * seams that are injected are the network ones the builder already declares, so
 * the composition under test is the shipped one. What the write cases read is the
 * call that reached the transport, not a value on an object on the way past: a
 * switch that moved and told nobody is precisely the failure a surface like this
 * has.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. THERE IS A FIFTH TAB AND IT IS RIGHTMOST. Its id is stable, its label is
 *      declared in `config.js` and appears as a literal nowhere else, and it
 *      fills the panel.
 *   2. IT IS BLOCKED WITH THE OTHERS WHEN A GRANT LAPSES. It is business-scoped
 *      like every tab in the strip, which is why it is allowed to be one.
 *   3. OPENING IT SHOWS A NETWORK CONFIGURATION SECTION WITH ONE CONTROL,
 *      reflecting what is actually in force for the business in scope — never a
 *      default the pane did not read.
 *   4. THE SENTENCE UNDER IT NAMES THE SOURCE. Inherited from the deployment, or
 *      set for this business; `off` in either case is the same switch position
 *      and two different facts.
 *   5. IT SAYS WHEN THE CHANGE LANDS. A manager holds its backend for its whole
 *      life, so a flip reaches the next conversation — stated in words rather
 *      than left to be inferred.
 *   6. MOVING IT WRITES, AND THE PANE FOLLOWS THE ORIGIN'S ANSWER rather than
 *      the value it sent.
 *   7. A REFUSED WRITE PUTS THE SWITCH BACK, so the pane cannot disagree with
 *      the database about a value the operator is about to act on.
 *   8. A BUSINESS SWITCH REDRAWS FROM THE NEW BUSINESS'S ANSWER, and a stale
 *      answer arriving afterwards is discarded.
 *   9. THERE IS NO GROUP-CHAT SWITCH. The room does not exist yet, and a control
 *      that cannot be moved is present-and-refusing.
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
let DEBUG: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-353 debug-tab suites skipped: ${WEBUI_SKIP_REASON}`)

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

const businessesFixture = () => [
  { id: 'biz_bakery', name: 'Cole’s Bakery', selectable: true },
  { id: 'biz_salon', name: 'Salon', selectable: true },
]

const ALL_LAPSED = [
  { id: 'biz_bakery', name: 'Cole’s Bakery', selectable: false, lapse: { reason: 'expired', endedAt: null } },
]

const PERSON = { name: 'Sam', email: 'sam@example.test' }

const SITES_OF: Record<string, Array<{ site: string; latest: number | null }>> = {
  biz_bakery: [{ site: 'site-bakery', latest: null }],
  biz_salon: [{ site: 'site-salon', latest: 1 }],
}

/**
 * What `GET /api/network/delegation` answers with — the shape the route returns.
 *
 * THREE VALUES AND NOT ONE, which is the whole of claim 4: what is in FORCE is
 * what the next session composes, what is STORED is this business's own decision
 * or `null`, and what the DEPLOYMENT carries is `delegation.json`.
 */
const INHERITED_ON = { delegateToolCalls: true, stored: null, deployment: true }
const SET_OFF = { delegateToolCalls: false, stored: false, deployment: true }

let root: HTMLElement

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ ...DEBUG } = await import('../apps/control-app/src/builder/debug.js'))
  }
  if (!CONFIG) CONFIG = await import('../apps/control-app/src/builder/config.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/** The real builder, with the Debug pane's two seams recorded. */
function mount(over: Record<string, unknown> = {}) {
  const asked = {
    reads: [] as Array<string | null>,
    writes: [] as boolean[],
  }
  const debugTransport = {
    load: async () => {
      asked.reads.push(app.scope.getBusiness())
      return (over.answer as unknown) ?? INHERITED_ON
    },
    save: async (enabled: boolean) => {
      asked.writes.push(enabled)
      return { delegateToolCalls: enabled, stored: enabled, deployment: true }
    },
    ...((over.debugTransport as Record<string, unknown>) ?? {}),
  }
  const app = mountBuilder(root, {
    businesses: over.businesses ?? businessesFixture(),
    person: PERSON,
    storage: memoryStorage(),
    loadSites: async (businessId: string | null) => SITES_OF[businessId ?? ''] ?? [],
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
      openSettingsSession: async () => ({ sessionId: 'business-settings', turns: [], ready: true }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    settingsTransport: {
      saveName: async (name: string) => ({ businessId: 'biz_bakery', name, effects: null }),
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
    debugTransport,
    ...(over.over as Record<string, unknown>),
  })
  return { app, asked }
}

/** The live toggle the switch is — `mountFields` renders a boolean as one. */
function toggle(app: Handle): HTMLInputElement {
  const box = app.debug.element.querySelector(
    `.fields-row[data-field="${DEBUG.DELEGATE_FIELD.name}"] input[type="checkbox"]`,
  )
  expect(box, 'the delegation switch is a live toggle in its own row').toBeTruthy()
  return box as HTMLInputElement
}

/** Click it — the toggle IS the commit gesture, which is why there is no Save. */
async function flip(app: Handle, to: boolean) {
  const box = toggle(app)
  box.checked = to
  box.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
  await settle()
}

// ── 1: the tab ───────────────────────────────────────────────────────────────

describe('REQ-353 AC1 — a fifth tab, rightmost', () => {
  it('test_UAT_FC_REQ-353_the_tab_is_last_in_the_strip_and_fills_the_panel', async () => {
    const { app } = mount()
    await settle()

    // FIVE TABS, AND THE FIFTH IS DEBUG. The count is the claim as much as the
    // order is: a sixth panel appearing is what the declaration is asserted
    // against rather than merely the presence of this one.
    expect(CONFIG.TABS).toHaveLength(5)
    expect(CONFIG.TABS.at(-1)).toBe(CONFIG.DEBUG_TAB)
    expect(CONFIG.DEBUG_TAB.id).toBe('debug')
    // AFTER SETTINGS, whose own comment claimed that position. The claim is
    // amended rather than contradicted — Settings is last of the tabs a customer
    // is meant to see, and this is past the end of that set.
    expect(CONFIG.TABS.indexOf(CONFIG.SETTINGS_TAB)).toBe(3)
    // `fill` so the pane owns its scroll rather than moving the whole shell.
    expect(CONFIG.DEBUG_TAB.fill).toBe(true)
    expect(app.shell.getTabs().map((t: { id: string }) => t.id).at(-1)).toBe(CONFIG.DEBUG_TAB.id)
    expect(app.shell.getPanel(CONFIG.DEBUG_TAB.id).contains(app.debug.element)).toBe(true)
  })

  it('test_UAT_FC_REQ-353_the_label_is_declared_in_config_and_is_a_literal_nowhere_else', () => {
    // [[REQ-115]]'s rule: an id is stable and is what code addresses; a label is
    // provisional and must be a one-line edit to change. The pane's own heading is
    // therefore NOT the tab's label — see `DEBUG_TITLE`.
    const label = CONFIG.DEBUG_TAB.label
    const offenders = fs
      .readdirSync(BUILDER)
      .filter((f) => f.endsWith('.js') && f !== 'config.js')
      .filter((f) => fs.readFileSync(path.join(BUILDER, f), 'utf8').includes(`'${label}'`))
    expect(offenders).toEqual([])
    expect(DEBUG.DEBUG_TITLE).not.toBe(label)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-353 AC2 — blocked with the others', () => {
  it('test_UAT_FC_REQ-353_a_lapsed_account_cannot_reach_debug_either', async () => {
    const { app } = mount({ businesses: ALL_LAPSED })
    await settle()

    // THE TABS GO AND THE CHROME STAYS ([[DOC-42]] §5). Debug is business-scoped
    // like every other tab, which is the whole reason it is allowed to be one —
    // so it is inside the block rather than beside it, and there is no exception
    // to explain. The operator console is kept OUT of the strip for exactly the
    // opposite reason.
    const panels = app.shell.element.querySelector('.shell-panels')
    expect(panels?.hasAttribute('inert')).toBe(true)
    expect(panels?.contains(app.debug.element)).toBe(true)
  })
})

// ── 3, 4, 5, 9: what the pane shows ──────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-353 AC3 — the section, and one control in it', () => {
  it('test_UAT_FC_REQ-353_the_pane_draws_the_network_section_from_what_is_in_force', async () => {
    const { app, asked } = mount()
    await settle()
    await settle()

    // IT READ BEFORE IT DREW, and it read for the business in scope. A control
    // rendered from a default it did not read is the thing this claim refuses.
    expect(asked.reads).toEqual(['biz_bakery'])
    expect(app.debug.getView()).toEqual(INHERITED_ON)

    const text = app.debug.element.textContent ?? ''
    expect(text).toContain(DEBUG.NETWORK_SECTION_TITLE)
    expect(toggle(app).checked).toBe(true)

    // CLAIM 4 — THE SENTENCE NAMES THE SOURCE. With nothing stored this is the
    // deployment's answer, and saying so is what stops an operator "changing"
    // something already set the way they want it.
    expect(text).toContain(DEBUG.delegationSource(INHERITED_ON))
    expect(DEBUG.delegationSource(INHERITED_ON)).toMatch(/inherited/i)
    expect(DEBUG.delegationSource(SET_OFF)).toMatch(/this business/i)

    // CLAIM 5 — WHEN IT LANDS, IN WORDS. A manager holds its backend for its
    // whole life; leaving the operator to infer that is how somebody comes to
    // conclude the switch does nothing.
    expect(text).toContain(DEBUG.DELEGATE_TIMING)
    expect(DEBUG.DELEGATE_TIMING).toMatch(/next conversation/i)

    // CLAIM 9 — NO GROUP-CHAT SWITCH. The room is framework REQ-183 and gated, so
    // there is nothing behind a flag; a rendered switch that cannot be moved is
    // present-and-refusing, which `delegation.json`, `development.ts` and the
    // console each reject in their own words. Exactly one row is rendered.
    expect(app.debug.element.querySelectorAll('.fields-row')).toHaveLength(1)
    expect(text.toLowerCase()).not.toContain('group chat')
  })

  it('test_UAT_FC_REQ-353_a_stored_value_wins_and_is_reported_as_this_businesss_own', async () => {
    const { app } = mount({ answer: SET_OFF })
    await settle()
    await settle()

    expect(toggle(app).checked).toBe(false)
    // AND THE DEPLOYMENT'S OWN SETTING IS STILL STATED, because the question that
    // follows an override is always what it would be if this were taken back.
    const text = app.debug.element.textContent ?? ''
    expect(text).toContain(DEBUG.delegationSource(SET_OFF))
    expect(DEBUG.delegationSource(SET_OFF)).toContain('on')
  })

  it('test_UAT_FC_REQ-353_a_read_that_fails_says_so_and_draws_no_switch', async () => {
    const { app } = mount({
      debugTransport: {
        load: async () => {
          throw new Error('GET /api/network/delegation → 500')
        },
      },
    })
    await settle()
    await settle()

    // REPORTED AND NOT SILENT, unlike the Settings pane's background reads: this
    // is the only thing on the tab, and a tab that drew nothing and said nothing
    // would read as a tab that is not finished. And NO switch — a guessed one
    // would be a control claiming to say what is in force.
    expect(app.debug.element.textContent).toContain(DEBUG.DEBUG_UNREADABLE)
    expect(app.debug.element.querySelector('input[type="checkbox"]')).toBeNull()
  })
})

// ── 6, 7: moving it ──────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-353 AC6 — moving it writes', () => {
  it('test_UAT_FC_REQ-353_turning_it_off_reaches_the_origin_and_the_pane_follows_the_answer', async () => {
    const { app, asked } = mount()
    await settle()
    await settle()

    await flip(app, false)

    // THE WRITE REACHED THE ORIGIN. A switch that moved and told nobody is the
    // failure a surface like this has, and the call is the only thing that can
    // distinguish the two.
    expect(asked.writes).toEqual([false])
    // AND THE PANE SAYS WHAT THE ORIGIN ANSWERED, not what it sent: the route
    // answers the same three values the read does, so the sentence is re-derived
    // from what the database now holds.
    expect(app.debug.getView()).toEqual({
      delegateToolCalls: false,
      stored: false,
      deployment: true,
    })
    expect(app.debug.element.textContent).toContain(
      DEBUG.delegationSource({ delegateToolCalls: false, stored: false, deployment: true }),
    )
  })

  it('test_UAT_FC_REQ-353_a_refused_write_puts_the_switch_back', async () => {
    const { app } = mount({
      debugTransport: {
        save: async () => {
          throw new Error("'enabled' must be true or false.")
        },
      },
    })
    await settle()
    await settle()
    expect(toggle(app).checked).toBe(true)

    await flip(app, false)

    // ROLLED BACK BY THE COMPONENT, which is why the pane uses `mountFields`
    // rather than a hand-rolled checkbox: a switch that stayed moved after a
    // refusal would be the pane disagreeing with the database about a value the
    // operator is about to act on.
    expect(toggle(app).checked).toBe(true)
  })
})

// ── 8: a business switch ─────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-353 AC8 — the pane follows the scope', () => {
  it('test_UAT_FC_REQ-353_a_business_switch_redraws_from_the_new_businesss_answer', async () => {
    const answers: Record<string, unknown> = {
      biz_bakery: INHERITED_ON,
      biz_salon: SET_OFF,
    }
    let app: Handle
    const mounted = mount({
      debugTransport: {
        load: async () => answers[app.scope.getBusiness() ?? ''],
      },
    })
    app = mounted.app
    await settle()
    await settle()
    expect(toggle(app).checked).toBe(true)

    await app.scope.setBusiness('biz_salon')
    await settle()
    await settle()

    // A DIFFERENT BUSINESS'S CONFIGURATION, NOT THE SAME ONE REDRAWN. A switch
    // still holding the previous business's value under a heading naming this one
    // is the worst version of the crossing [[REQ-181]] refuses, because the next
    // thing the operator does is click it.
    expect(app.debug.getBusiness()).toBe('biz_salon')
    expect(app.debug.getView()).toEqual(SET_OFF)
    expect(toggle(app).checked).toBe(false)
  })

  it('test_UAT_FC_REQ-353_an_answer_for_the_business_left_behind_is_discarded', async () => {
    // THE ROUND TRIP THE OPERATOR SWITCHED OUT OF. Without the pane's own
    // generation token the first business's answer arrives last and draws its
    // switch under the second one's heading — on a control that WRITES.
    let release: ((value: unknown) => void) | null = null
    let app: Handle
    const mounted = mount({
      debugTransport: {
        load: () => {
          if (app?.scope.getBusiness() === 'biz_salon') return Promise.resolve(SET_OFF)
          return new Promise((resolve) => {
            release = resolve
          })
        },
      },
    })
    app = mounted.app
    await settle()

    await app.scope.setBusiness('biz_salon')
    await settle()
    await settle()
    expect(app.debug.getView()).toEqual(SET_OFF)

    // …and now the stale one answers.
    release?.(INHERITED_ON)
    await settle()
    await settle()

    expect(app.debug.getBusiness()).toBe('biz_salon')
    expect(app.debug.getView()).toEqual(SET_OFF)
    expect(toggle(app).checked).toBe(false)
  })
})
