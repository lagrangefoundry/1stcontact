// @vitest-environment jsdom
/**
 * [[REQ-251]] — **the pane beside the settings assistant re-reads when it
 * writes.**
 *
 * THE BUG THIS IS ABOUT. The Settings tab mounts the record and its own assistant
 * into one split, side by side, both able to write the same two facts. The site
 * tab's chat has been telling its pane about its writes since BUG-43; this one
 * was handed no equivalent, so a hostname claimed in the conversation left an
 * empty box six inches to its left — offering the customer a name that had just
 * been taken, behind a claim that cannot be undone. Both statements were on the
 * screen at once, contradicting each other, with nothing to tell the customer
 * which was true.
 *
 * WHAT MAKES THIS EVIDENCE. The first group mounts the real `chat.js` over the
 * actually-installed `webui-chat`; the second mounts the REAL builder and reads
 * the answer out of the DOM the customer would be looking at. The transports are
 * injected because they are HTTP, and the stream events are written in the shape
 * `host-core.ts` emits — the signal arrives among the tool activity, not after
 * the prose, which is the property the pane has to survive.
 *
 * THE CLAIMS:
 *
 *   1. THE PANE REPORTS EACH SETTINGS WRITE AS IT ARRIVES, once, carrying the
 *      count — and the signal leaves no trace in the conversation.
 *   2. A TURN THAT CHANGED NOTHING REPORTS NOTHING, and a throwing host does not
 *      take the turn with it.
 *   3. A CLAIM MADE IN THE CONVERSATION REACHES THE PANE, without a reload.
 *   4. SO DOES A RENAME — the field and the switcher both follow.
 *   5. A RE-READ THAT FOUND NO NEWS CHANGES NOTHING, including a candidate the
 *      customer is half-way through typing.
 *   6. THE PANE RE-READS RATHER THAN BEING WRITTEN TO. What appears came back
 *      from the routes the tab already reads on open.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let createChatPanel: (opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-251 pane suite skipped: ${WEBUI_SKIP_REASON}`)

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
 * A turn that renames the business and then takes its address — the shape
 * `host-core.ts` emits, frame for frame.
 *
 * WRITTEN AS THE REAL SHAPE rather than as a convenient simplification: each
 * signal arrives AMONG the tool activity that caused it, which is what lets the
 * pane move as the assistant works instead of jumping when it stops talking.
 */
const TWO_WRITES = [
  { kind: 'tool_activity', content: 'tool_call rename_business', meta: { name: 'rename_business' } },
  { kind: 'business_changed', content: '', meta: { at: 1, changes: 1 } },
  { kind: 'tool_activity', content: 'tool_call claim_hostname', meta: { name: 'claim_hostname' } },
  { kind: 'business_changed', content: '', meta: { at: 2, changes: 1 } },
  { kind: 'text', content: 'Both done.' },
  { kind: 'done' },
]

/** A turn that answered a question. Nothing moved, so nothing is reported. */
const NO_WRITES = [
  { kind: 'tool_activity', content: 'tool_call read_addresses', meta: { name: 'read_addresses' } },
  { kind: 'text', content: 'You have not chosen one yet.' },
  { kind: 'done' },
]

/** One claim, and nothing else. */
const ONE_CLAIM = [
  { kind: 'tool_activity', content: 'tool_call claim_hostname', meta: { name: 'claim_hostname' } },
  { kind: 'business_changed', content: '', meta: { at: 1, changes: 1 } },
  { kind: 'text', content: 'colesbakery.1stc.site is yours.' },
  { kind: 'done' },
]

const said = (chat: Handle) =>
  chat.getChat().getMessages().map(({ role, markdown }: Handle) => ({ role, markdown }))

const streamOf = (events: unknown[]) =>
  async function* () {
    for (const event of events) yield event
  }

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
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

// ── 1 & 2: the signal ────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-251 AC9 — the settings chat reports its writes', () => {
  it('test_UAT_FC_REQ-251_each_settings_write_is_reported_once_as_it_arrives', async () => {
    const reported: unknown[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_WRITES) },
      onBusinessChanged: (meta: unknown) => reported.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('My name is wrong, and I want an address.')

    // ONCE PER WRITE, carrying the count — so a host can tell "twice" from
    // "once" without inferring either from the prose.
    expect(reported).toEqual([
      { at: 1, changes: 1 },
      { at: 2, changes: 1 },
    ])
  })

  it('test_UAT_FC_REQ-251_the_settings_signal_leaves_no_trace_in_the_conversation', async () => {
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_WRITES) },
      onBusinessChanged: () => {},
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('My name is wrong, and I want an address.')

    // Machinery, not conversation. Observed by the wrapper and stopping there.
    expect(said(chat)).toEqual([
      { role: 'user', markdown: 'My name is wrong, and I want an address.' },
      { role: 'assistant', markdown: 'Both done.' },
    ])
  })

  it('test_UAT_FC_REQ-251_a_settings_turn_that_changed_nothing_reports_nothing', async () => {
    const reported: unknown[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(NO_WRITES) },
      onBusinessChanged: (meta: unknown) => reported.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('Do I have an address yet?')

    // A READ IS NOT A WRITE. The pane is not disturbed for a question, which is
    // what makes claim 5 below possible at all.
    expect(reported).toEqual([])
  })

  it('test_UAT_FC_REQ-251_a_site_pane_is_not_moved_by_a_business_write', async () => {
    const site: unknown[] = []
    const business: unknown[] = []
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_WRITES) },
      onSiteChanged: (meta: unknown) => site.push(meta),
      onBusinessChanged: (meta: unknown) => business.push(meta),
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    await chat.getChat().send('My name is wrong, and I want an address.')

    // TWO KINDS AND NOT ONE. The host that consumes the site's signal answers it
    // by reloading a preview frame, which a business rename is not a reason to
    // do — so the two must not be the same string on the wire.
    expect(business).toHaveLength(2)
    expect(site).toEqual([])
  })

  it('test_UAT_FC_REQ-251_a_failing_host_does_not_take_the_settings_turn_with_it', async () => {
    const chat = createChatPanel({
      transport: { streamPrompt: streamOf(TWO_WRITES) },
      onBusinessChanged: () => {
        throw new Error('the pane went away')
      },
    })
    document.body.append(chat.element)
    chat.setSession({ sessionId: 'business-acct', turns: [], ready: true })

    // Re-reading a record is the host's business and its failure is not the
    // conversation's — the answer still arrives in full.
    await chat.getChat().send('My name is wrong, and I want an address.')
    expect(said(chat).at(-1)).toEqual({ role: 'assistant', markdown: 'Both done.' })
  })
})

// ── 3-6: the pane re-reads ───────────────────────────────────────────────────

const PERSON = { name: 'Sam', email: 'sam@example.test' }
const PLATFORM = { host: 'colesbakery.1stc.site', kind: 'platform', site: 'site-bakery' }

/**
 * The real builder, with the settings tab's two reads under the suite's control.
 *
 * `record` AND `addresses` ARE MUTABLE FIXTURES, because the whole subject is
 * what the pane does when the SAME call answers differently the second time. A
 * fixture frozen at mount could not express "the assistant changed it".
 */
function mount(over: Record<string, unknown> = {}) {
  const state = {
    record: { id: 'acct_bakery', name: 'Unnamed business' },
    addresses: { apex: '1stc.site', addresses: [] as unknown[] },
    reads: { business: 0, addresses: 0 },
  }
  const app = mountBuilder(root, {
    businesses: [{ id: 'acct_bakery', name: 'Unnamed business', selectable: true }],
    person: PERSON,
    storage: memoryStorage(),
    loadSites: async () => [{ site: 'site-bakery', latest: null }],
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
      openSettingsSession: async () => ({ sessionId: 'business-acct', turns: [], ready: true }),
      streamPrompt: streamOf((over.events as unknown[]) ?? ONE_CLAIM),
    },
    settingsTransport: {
      saveName: async (name: string) => ({ businessId: 'acct_bakery', name, effects: {} }),
      loadAddresses: async () => {
        state.reads.addresses += 1
        return { apex: state.addresses.apex, addresses: [...state.addresses.addresses] }
      },
      loadBusiness: async () => {
        state.reads.business += 1
        return { ...state.record }
      },
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
  })
  return { app, state }
}

const paneText = (app: Handle) => app.settings.element.textContent ?? ''
const hostBox = (app: Handle) =>
  app.settings.element.querySelector('.builder-hostname__label') as HTMLInputElement | null

describe.skipIf(!WEBUI_INSTALLED)('REQ-251 AC10 — a claim in the chat reaches the pane', () => {
  it('test_UAT_FC_REQ-251_an_address_taken_in_the_conversation_replaces_the_box_beside_it', async () => {
    const { app, state } = mount()
    await settle()

    // BEFORE: the pane offers a box, because this business has no address. That
    // box is the bug — it is an invitation to choose a name the conversation is
    // about to take.
    expect(hostBox(app)).not.toBeNull()

    // The assistant takes one. The origin now answers differently.
    state.addresses.addresses = [PLATFORM]
    await app.settingsChat.getChat().send('Take colesbakery please.')
    await settle()

    // AFTER: no box, and the permanent host said in full with the sentence that
    // it cannot be changed. No reload, and nothing the customer had to do.
    expect(hostBox(app)).toBeNull()
    expect(paneText(app)).toContain('colesbakery.1stc.site')
    expect(paneText(app)).toContain('cannot be changed')
  })

  it('test_UAT_FC_REQ-251_the_pane_re_reads_the_record_rather_than_being_written_to', async () => {
    const { app, state } = mount()
    await settle()
    const opened = state.reads.addresses

    state.addresses.addresses = [PLATFORM]
    await app.settingsChat.getChat().send('Take colesbakery please.')
    await settle()

    // THE ROUTE THE TAB ALREADY READS ON OPEN, asked again. That is what keeps
    // this a refresh FROM THE RECORD and not the assistant driving the pane —
    // the signal carried a count and nothing renderable, so there was nothing
    // else it could have drawn.
    expect(state.reads.addresses).toBe(opened + 1)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-251 AC11 — a rename in the chat reaches the field and the chrome', () => {
  it('test_UAT_FC_REQ-251_a_rename_made_in_the_conversation_moves_the_field_and_the_switcher', async () => {
    const { app, state } = mount()
    await settle()
    expect(paneText(app)).toContain('Unnamed business')

    state.record = { id: 'acct_bakery', name: 'Cole’s Bakery' }
    await app.settingsChat.getChat().send('My business is called Cole’s Bakery.')
    await settle()

    // THE FIELD FOLLOWS…
    expect(app.settings.getBusiness()?.name).toBe('Cole’s Bakery')
    expect(paneText(app)).toContain('Cole’s Bakery')
    // …AND SO DOES THE CHROME, by the same `onRenamed` the field's own rename
    // uses. A product that disagrees with itself on one screen is worse than one
    // that is merely stale, and this is the screen the customer is looking at.
    expect(app.switcher.element.textContent).toContain('Cole’s Bakery')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-251 AC12 — a re-read that found no news changes nothing', () => {
  it('test_UAT_FC_REQ-251_a_half_typed_candidate_survives_a_turn_that_changed_nothing_else', async () => {
    // A turn that WRITES — so the pane genuinely re-reads — but writes the name
    // rather than the address. This is the case that separates "refresh" from
    // "redraw", and getting it wrong would empty the box under the customer's
    // hands the moment they asked the assistant anything.
    const { app, state } = mount()
    await settle()

    const box = hostBox(app)!
    box.value = 'colesbakerydublin'

    state.record = { id: 'acct_bakery', name: 'Cole’s Bakery' }
    await app.settingsChat.getChat().send('My business is called Cole’s Bakery.')
    await settle()

    // THE NAME MOVED AND THE CANDIDATE DID NOT. The address read answered the
    // same thing it answered on open, so the section was left exactly as it was.
    expect(app.settings.getBusiness()?.name).toBe('Cole’s Bakery')
    expect(hostBox(app)?.value).toBe('colesbakerydublin')
  })

  it('test_UAT_FC_REQ-251_a_turn_that_only_answered_a_question_does_not_re_read_at_all', async () => {
    const { app, state } = mount({ events: NO_WRITES })
    await settle()
    const opened = { ...state.reads }

    await app.settingsChat.getChat().send('Do I have an address yet?')
    await settle()

    // NOTHING SIGNALLED, SO NOTHING WAS ASKED. The cheapest possible answer to
    // the most common turn, and the reason the signal is derived from writes
    // rather than fired at the end of every turn.
    expect(state.reads).toEqual(opened)
  })
})
