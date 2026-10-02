// @vitest-environment jsdom
/**
 * [[REQ-357]] — the builder's own surfaces in group mode: the chat panel drawing
 * the room, and the Debug tab's switch and agent sessions.
 *
 * THE REAL PANES, mounted in jsdom, with the origin replaced at the transport —
 * the one seam each pane already takes. What is read for evidence is what the
 * client would see (each bubble's speaker label) and what reached the transport
 * (the room's session id, the stop, the switch's write), never a variable on the
 * way past.
 *
 * The speakers are read out of `group-chat.json`, so a rename is covered here
 * without an edit.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import groupChat from '../tools/generate/src/cli/ai/group-chat.json'

type Handle = Record<string, any>

const NAMES = groupChat.names as Record<string, string>

let createChatPanel: (opts?: Record<string, unknown>) => Handle
let createDebugPanel: (opts?: Record<string, unknown>) => Handle
let DEBUG: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-357 panel suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((r) => setTimeout(r, 0))

beforeEach(async () => {
  if (WEBUI_INSTALLED && !createChatPanel) {
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
    DEBUG = await import('../apps/control-app/src/builder/debug.js')
    createDebugPanel = DEBUG.createDebugPanel
  }
  document.body.replaceChildren()
})

const ROOM = {
  sessionId: 'room-bakery',
  ready: true,
  live: false,
  cursor: 0,
  group: { names: NAMES },
  turns: [
    { role: 'user', markdown: 'Make it warmer.', speaker: NAMES.client },
    { role: 'assistant', markdown: 'Amber, then.', speaker: NAMES.consultant },
    { role: 'assistant', markdown: 'You asked for warm last week too.', speaker: NAMES.assistant },
  ],
}

/** Who each bubble on screen says it is from, in order. */
function speakers(panel: Handle): string[] {
  return [...panel.element.querySelectorAll('.chat-message-speaker')].map((n) =>
    String(n.textContent),
  )
}

const post = (speaker: string, role: string, content: string) => ({
  kind: 'room_post',
  content,
  meta: { speaker, role, markdown: content },
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-357 — the chat panel draws the room', () => {
  it('test_UAT_FC_REQ-357_the_room_transcript_is_drawn_with_who_said_each_contribution', () => {
    const panel = createChatPanel({ transport: { streamPrompt: async function* () {} } })
    document.body.append(panel.element)
    panel.setSession(ROOM)
    expect(speakers(panel)).toEqual([NAMES.client, NAMES.consultant, NAMES.assistant])
    const messages = panel.getChat().getMessages()
    expect(messages.map((m: Handle) => [m.role, m.markdown])).toEqual(
      ROOM.turns.map((t) => [t.role, t.markdown]),
    )
  })

  it('test_UAT_FC_REQ-357_the_composer_posts_to_the_room_and_the_exchange_streams_live', async () => {
    const sent: Array<[string, string]> = []
    const panel = createChatPanel({
      transport: {
        streamPrompt: async function* (id: string, text: string) {
          sent.push([id, text])
          yield post(NAMES.client, 'user', text)
          // A member's own deliberation is on the stream and must not be drawn.
          yield { kind: 'text', content: 'thinking privately', meta: { member: NAMES.consultant } }
          yield post(NAMES.consultant, 'assistant', 'Here is a warmer palette.')
          yield post(NAMES.assistant, 'assistant', 'That fits the brief.')
          yield { kind: 'done', content: '', meta: { status: 'complete' } }
        },
      },
    })
    document.body.append(panel.element)
    panel.setSession({ ...ROOM, turns: [] })
    const chat = panel.getChat()
    chat.setInputMarkdown('Warmer, please.')
    await chat.submitInput()
    for (let i = 0; i < 10; i += 1) await settle()

    // INTO THE ROOM'S SESSION, and drawn from what came back rather than echoed.
    expect(sent).toEqual([['room-bakery', 'Warmer, please.']])
    expect(speakers(panel)).toEqual([NAMES.client, NAMES.consultant, NAMES.assistant])
    const text = panel.element.textContent ?? ''
    expect(text).toContain('Here is a warmer palette.')
    expect(text).not.toContain('thinking privately')
    expect(chat.isStreaming()).toBe(false)
  })

  it('test_UAT_FC_REQ-357_stop_reaches_the_origin_for_the_room', async () => {
    const stops: string[] = []
    let finish = (): void => {}
    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })
    const panel = createChatPanel({
      transport: {
        streamPrompt: async function* (_id: string, text: string) {
          yield post(NAMES.client, 'user', text)
          await finished
          yield { kind: 'done', content: '', meta: { status: 'aborted' } }
        },
        stopExchange: async (id: string) => {
          stops.push(id)
          finish()
          return { stopping: true }
        },
      },
    })
    document.body.append(panel.element)
    panel.setSession({ ...ROOM, turns: [] })
    const chat = panel.getChat()
    chat.setInputMarkdown('Go on.')
    await chat.submitInput()
    for (let i = 0; i < 5; i += 1) await settle()
    expect(chat.isStreaming()).toBe(true)

    const stop = panel.element.querySelector('.chat-widget-stop-btn') as HTMLButtonElement
    stop.click()
    for (let i = 0; i < 10; i += 1) await settle()
    expect(stops).toEqual(['room-bakery'])
    expect(chat.isStreaming()).toBe(false)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-357 — the Debug tab', () => {
  function mount(groupChatOn: boolean) {
    const asked = { saved: [] as boolean[], privateFor: [] as string[], changed: 0 }
    const debug = createDebugPanel({
      transport: {
        load: async () => ({ delegateToolCalls: true, stored: null, deployment: true }),
        save: async () => ({ delegateToolCalls: true, stored: true, deployment: true }),
        loadGroupChat: async () => ({ groupChat: groupChatOn, stored: groupChatOn }),
        saveGroupChat: async (enabled: boolean) => {
          asked.saved.push(enabled)
          return { groupChat: enabled, stored: enabled }
        },
        loadPrivate: async (site: string) => {
          asked.privateFor.push(site)
          return {
            members: [
              { role: 'consultant', name: NAMES.consultant, turns: [{ role: 'user', markdown: 'brief' }] },
              { role: 'assistant', name: NAMES.assistant, turns: [] },
            ],
          }
        },
      },
      onGroupChatChanged: () => {
        asked.changed += 1
      },
    })
    document.body.append(debug.element)
    return { debug, asked }
  }

  const groupBox = (debug: Handle) =>
    debug.element.querySelector(
      `.fields-row[data-field="${DEBUG.GROUP_CHAT_FIELD.name}"] input[type="checkbox"]`,
    ) as HTMLInputElement | null

  it('test_UAT_FC_REQ-357_the_switch_sits_beside_delegation_and_shows_what_is_in_force', async () => {
    const { debug } = mount(false)
    await debug.setBusiness('biz_bakery')
    await settle()
    expect(groupBox(debug)).toBeTruthy()
    expect(groupBox(debug)!.checked).toBe(false)
    // The delegation switch is still there, in the same section.
    expect(debug.element.querySelectorAll('.fields-row')).toHaveLength(2)
    expect(debug.element.textContent).toContain(DEBUG.GROUP_CHAT_TIMING)
    // OFF: no agent sessions are shown.
    expect(debug.element.textContent).not.toContain(DEBUG.PRIVATE_SECTION_TITLE)
  })

  it('test_UAT_FC_REQ-357_turning_it_on_saves_reopens_the_conversation_and_shows_each_agents_session', async () => {
    const { debug, asked } = mount(false)
    await debug.setBusiness('biz_bakery')
    await debug.setSite('bakery')
    await settle()
    const box = groupBox(debug)!
    box.checked = true
    box.dispatchEvent(new Event('change', { bubbles: true }))
    for (let i = 0; i < 6; i += 1) await settle()

    expect(asked.saved).toEqual([true])
    expect(asked.changed).toBe(1)
    expect(asked.privateFor).toEqual(['bakery'])
    const text = debug.element.textContent ?? ''
    expect(text).toContain(DEBUG.PRIVATE_SECTION_TITLE)
    expect(text).toContain(NAMES.consultant)
    expect(text).toContain(NAMES.assistant)
    expect(text).toContain('brief')
  })
})
