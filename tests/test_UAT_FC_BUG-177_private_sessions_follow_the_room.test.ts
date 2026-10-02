// @vitest-environment jsdom
/**
 * [[BUG-177]] — the Debug tab's "Each agent's own session" follows the room.
 *
 * THE REAL BUILDER, mounted over the installed `webui-*` components, with only
 * the network seams it already declares replaced. The room's exchange arrives on
 * the chat transport exactly as the origin streams it — room posts, each
 * member's own events tagged `meta.member`, a `member_done` per round, a final
 * `done` — and what is read for evidence is what reached the Debug pane's
 * private-session transport and what the pane then drew.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import groupChat from '../tools/generate/src/cli/ai/group-chat.json'

type Handle = Record<string, any>

const NAMES = groupChat.names as Record<string, string>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let CONFIG: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`BUG-177 suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((r) => setTimeout(r, 0))
const drain = async (n = 12) => {
  for (let i = 0; i < n; i += 1) await settle()
}

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

let root: HTMLElement

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    CONFIG = await import('../apps/control-app/src/builder/config.js')
  }
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

const post = (speaker: string, role: string, content: string) => ({
  kind: 'room_post',
  content,
  meta: { speaker, role, markdown: content },
})

/**
 * The builder with group chat on and one site open. `stored` is what the origin
 * holds for each member's private session; each read answers it as it is now.
 */
function mount(exchange: (stored: Stored) => AsyncGenerator<Record<string, unknown>>) {
  const stored: Stored = { consultant: [], coordinator: [], reads: [] }
  const app = mountBuilder(root, {
    businesses: [{ id: 'biz_bakery', name: 'Cole’s Bakery', selectable: true }],
    person: { name: 'Sam', email: 'sam@example.test' },
    storage: memoryStorage(),
    loadSites: async () => [{ site: 'bakery', latest: null }],
    chatTransport: {
      openSession: async (slug: string) => ({
        sessionId: `room-${slug}`,
        turns: [],
        ready: true,
        live: false,
        cursor: 0,
        group: { names: NAMES },
      }),
      openSettingsSession: async () => ({ sessionId: 'business-settings', turns: [], ready: true }),
      streamPrompt: () => exchange(stored),
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
    debugTransport: {
      load: async () => ({ delegateToolCalls: true, stored: null, deployment: true }),
      save: async () => ({ delegateToolCalls: true, stored: true, deployment: true }),
      loadGroupChat: async () => ({ groupChat: true, stored: true }),
      saveGroupChat: async (on: boolean) => ({ groupChat: on, stored: on }),
      loadPrivate: async (site: string) => {
        stored.reads.push(site)
        return {
          members: [
            { role: 'consultant', name: NAMES.consultant, turns: [...stored.consultant] },
            { role: 'coordinator', name: NAMES.coordinator, turns: [...stored.coordinator] },
          ],
        }
      },
    },
  })
  return { app, stored }
}

type Turn = { role: string; markdown: string }
type Stored = { consultant: Turn[]; coordinator: Turn[]; reads: string[] }

/** The private-session text the Debug pane is showing, per member section. */
function drawnSessions(app: Handle): string[] {
  return [...app.debug.element.querySelectorAll('.builder-debug__member')].map((n: Element) =>
    String(n.textContent),
  )
}

async function send(app: Handle, text: string) {
  const chat = app.chat.getChat()
  chat.setInputMarkdown(text)
  await chat.submitInput()
  await drain()
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-177 — each agent’s own session follows the room', () => {
  it('test_UAT_FC_BUG-177_a_member_round_ending_redraws_that_members_session', async () => {
    let releaseCoordinator = (): void => {}
    const coordinatorMayGo = new Promise<void>((r) => {
      releaseCoordinator = r
    })
    const { app, stored } = mount(async function* (s) {
      yield post(NAMES.client, 'user', 'Warmer, please.')
      // THE CONSULTANT'S ROUND: deliberates privately, posts, its round ends.
      yield { kind: 'text', content: 'thinking', meta: { member: NAMES.consultant } }
      s.consultant.push({ role: 'user', markdown: 'brief one' }, { role: 'assistant', markdown: 'amber it is' })
      yield post(NAMES.consultant, 'assistant', 'Amber, then.')
      yield { kind: 'member_done', content: '', meta: { member: NAMES.consultant } }
      // THE EXCHANGE IS STILL RUNNING — the coordinator has not spoken yet.
      await coordinatorMayGo
      s.coordinator.push({ role: 'user', markdown: 'brief two' }, { role: 'assistant', markdown: 'fits the brand' })
      yield post(NAMES.coordinator, 'assistant', 'That fits.')
      yield { kind: 'member_done', content: '', meta: { member: NAMES.coordinator } }
      yield { kind: 'done', content: '', meta: { status: 'complete' } }
    })
    await drain()
    expect(stored.reads).toContain('bakery')
    expect(drawnSessions(app).join('\n')).not.toContain('amber it is')
    const before = stored.reads.length

    await send(app, 'Warmer, please.')

    // MID-EXCHANGE: the consultant's finished round is already on the Debug tab.
    expect(app.chat.getChat().isStreaming()).toBe(true)
    expect(stored.reads.length).toBeGreaterThan(before)
    expect(stored.reads.every((site) => site === 'bakery')).toBe(true)
    const mid = drawnSessions(app)
    expect(mid[0]).toContain('amber it is')
    expect(mid[1]).not.toContain('fits the brand')

    releaseCoordinator()
    await drain()
    const after = drawnSessions(app)
    expect(after[0]).toContain('amber it is')
    expect(after[1]).toContain('fits the brand')
  })

  it('test_UAT_FC_BUG-177_the_exchanges_final_done_redraws_the_sessions', async () => {
    const { app, stored } = mount(async function* (s) {
      yield post(NAMES.client, 'user', 'Hello.')
      // A member's turn stored with no round-end on the wire — the final `done`
      // is still a moment the view must catch up.
      s.coordinator.push({ role: 'assistant', markdown: 'closing note' })
      yield { kind: 'done', content: '', meta: { status: 'complete' } }
    })
    await drain()
    await send(app, 'Hello.')
    expect(stored.reads.at(-1)).toBe('bakery')
    expect(drawnSessions(app)[1]).toContain('closing note')
  })

  it('test_UAT_FC_BUG-177_showing_the_debug_tab_redraws_the_sessions', async () => {
    const { app, stored } = mount(async function* () {
      yield { kind: 'done', content: '' }
    })
    await drain()
    app.shell.setActiveTab(CONFIG.SITE_TAB?.id ?? CONFIG.TABS[0].id)
    await drain()
    // Written at the origin while the reader was elsewhere (another page, a reload).
    stored.consultant.push({ role: 'assistant', markdown: 'said while you were away' })
    const before = stored.reads.length
    expect(drawnSessions(app)[0]).not.toContain('said while you were away')

    app.shell.setActiveTab(CONFIG.DEBUG_TAB.id)
    await drain()
    expect(stored.reads.length).toBe(before + 1)
    expect(drawnSessions(app)[0]).toContain('said while you were away')
  })

  it('test_UAT_FC_BUG-177_a_member_section_the_reader_collapsed_stays_collapsed_across_a_redraw', async () => {
    const { app, stored } = mount(async function* (s) {
      s.consultant.push({ role: 'assistant', markdown: 'new turn' })
      yield { kind: 'member_done', content: '', meta: { member: NAMES.consultant } }
      yield { kind: 'done', content: '', meta: { status: 'complete' } }
    })
    await drain()
    const sections = () =>
      [...app.debug.element.querySelectorAll('.builder-debug__member')] as HTMLDetailsElement[]
    // Both start open; the reader closes the coordinator's.
    expect(sections().map((d) => d.open)).toEqual([true, true])
    sections()[1].open = false
    sections()[1].dispatchEvent(new Event('toggle'))
    const before = stored.reads.length

    await send(app, 'Go.')
    expect(stored.reads.length).toBeGreaterThan(before)
    expect(sections()[0].textContent).toContain('new turn')
    expect(sections().map((d) => d.open)).toEqual([true, false])
  })
})
