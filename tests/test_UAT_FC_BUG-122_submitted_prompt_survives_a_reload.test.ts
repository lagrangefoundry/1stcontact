// @vitest-environment jsdom
/**
 * BUG-122 — **a submitted prompt survives the reload a stranded turn invites**.
 *
 * THE INCIDENT. The operator typed a long message and sent it. No reply came, and
 * the pane offered the `↺` control on their own bubble. They reloaded instead of
 * pressing it — and the message was gone. Not the reply: the words they had
 * written. The composer had deleted its draft at submit (`webui-chat`'s
 * `submitWith` calls `clear()` BEFORE the handler runs), so from that instant the
 * browser's only copy was the bubble on screen, and a reload discards it.
 *
 * WHAT THIS PROVES, and why it is not [[BUG-121]]'s suite over again. That one
 * covers what the ORIGIN kept: a record written before the model was called, for
 * a turn the origin got to start. This covers the submissions it can never have —
 * a request that failed before it arrived, a record a later turn replaced, and a
 * message the panel queued, which this pane has no transport for. The browser
 * keeps its own copy from submit until a transcript accounts for it.
 *
 * A RELOAD IS A FRESH PANEL OVER THE SAME STORAGE, so that is how it is staged
 * here: mount, submit, throw the panel away, mount again with whatever the origin
 * would have answered with. Mounted against the ACTUALLY-INSTALLED `webui-chat`,
 * like BUG-121's suite beside it — the affordance under test is the component's
 * own composer, so a stand-in would assert nothing.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Panel = {
  element: HTMLElement
  setSession: (session: unknown, key?: string) => void
  getChat: () => {
    getMessages: () => unknown[]
    getInputMarkdown: () => string
    setInputMarkdown: (md: string) => void
    submitInput: () => Promise<void>
    inputReady: Promise<boolean>
  } | null
  destroy: () => void
}

let createChatPanel: (opts?: Record<string, unknown>) => Panel

if (!WEBUI_INSTALLED) console.warn(`BUG-122 panel suite skipped: ${WEBUI_SKIP_REASON}`)

/** Let the composer's own async load, and the restore that waits on it, settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const painted = (panel: Panel) =>
  (panel.getChat()?.getMessages() ?? []).map(
    (m) => (m as { role: string; markdown: string }).markdown,
  )

const LOST = 'A long message, typed once, about the recursion diagram.'

/** A turn that dies the way the reported one did: nothing arrives, ever. */
const deadTransport = {
  streamPrompt: async function* () {
    // The stream ends having said nothing — which is what a dropped turn looks
    // like from the browser, and why the operator is offered a resend.
  },
}

/** The store both mounts share, exactly as one browser's `localStorage` is. */
let storage: Storage

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
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

beforeEach(() => {
  document.body.replaceChildren()
  globalThis.localStorage?.clear()
  const map = new Map<string, string>()
  storage = {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  } as unknown as Storage
})

/** Mount a pane on the shared store and hand it an open conversation. */
function open(session: Record<string, unknown>, opts: Record<string, unknown> = {}): Panel {
  const panel = createChatPanel({ storage, transport: deadTransport, ...opts })
  document.body.append(panel.element)
  panel.setSession({ cursor: 0, live: false, ready: true, turns: [], ...session })
  return panel
}

/** Type and send, the way the operator does. */
async function submit(panel: Panel, text: string) {
  const chat = panel.getChat()
  if (!chat) throw new Error('the pane has no conversation')
  await chat.inputReady
  chat.setInputMarkdown(text)
  await chat.submitInput()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-122 a submitted prompt survives a reload', () => {
  it('test_UAT_FC_BUG-122_a_prompt_the_origin_never_recorded_comes_back_after_a_reload', async () => {
    // THE REPORTED INCIDENT. The turn is sent, nothing comes back, and the
    // operator reloads rather than pressing the resend that would duplicate it.
    const first = open({ sessionId: 'site-alpha' })
    await submit(first, LOST)
    // The composer emptied itself at submit — which is the defect's whole
    // mechanism, and is what makes the bubble the browser's only copy.
    expect(first.getChat()?.getInputMarkdown()).toBe('')
    first.destroy()

    // The reload. The origin has nothing to say about that turn: it left no
    // transcript and no interrupted record, so the conversation comes back
    // byte-identical to the one that preceded it.
    const second = open({ sessionId: 'site-alpha' })
    await settle()

    // THEIR WORDS ARE IN THE CONVERSATION, as theirs, and the pane says what
    // became of them rather than leaving a message with no reply and no reason.
    expect(painted(second)[0]).toBe(LOST)
    expect(painted(second).at(-1)).toContain('no transcript')
    // AND ONE KEYSTROKE FROM RE-SENT: what could not be reconstructed was the
    // typing, so painting it as history alone would answer the smaller half.
    expect(second.getChat()?.getInputMarkdown()).toBe(LOST)
  })

  it('test_UAT_FC_BUG-122_a_prompt_the_transcript_accounts_for_is_not_handed_back', async () => {
    // THE ORDINARY CASE, and it must cost the pane nothing. The turn ran, so the
    // words are in the transcript the origin replays — handing them back as well
    // would show the operator their own message twice and invite a duplicate of a
    // question already answered.
    const first = open({ sessionId: 'site-alpha' })
    await submit(first, LOST)
    first.destroy()

    const second = open({
      sessionId: 'site-alpha',
      turns: [
        { role: 'user', markdown: LOST },
        { role: 'assistant', markdown: 'Answered.' },
      ],
      cursor: 120,
    })
    await settle()

    expect(painted(second)).toEqual([LOST, 'Answered.'])
    expect(second.getChat()?.getInputMarkdown()).toBe('')
  })

  it('test_UAT_FC_BUG-122_a_prompt_the_origin_is_already_handing_back_is_not_painted_twice', async () => {
    // [[BUG-121]] COVERS THE TURNS THE ORIGIN GOT TO START, and where both copies
    // exist they are one loss, not two. The origin's record wins the paint; this
    // pane's copy is dropped on sight rather than appended beside it.
    const first = open({ sessionId: 'site-alpha' })
    await submit(first, LOST)
    first.destroy()

    const second = open({
      sessionId: 'site-alpha',
      interrupted: { text: LOST, at: '2026-09-18T22:24:46.000Z', recorded: false },
    })
    await settle()

    expect(painted(second).filter((m) => m === LOST)).toHaveLength(1)
    expect(second.getChat()?.getInputMarkdown()).toBe(LOST)
  })

  it('test_UAT_FC_BUG-122_the_restored_message_is_not_offered_a_second_time', async () => {
    // ONCE IT IS IN THE BOX IT IS THE COMPOSER'S OWN DRAFT, which is durable
    // across the next load by the component's own persistence. Offering it again
    // from here would paint a bubble for a message the operator is holding — and
    // would go on doing so for as long as they declined to send it.
    const first = open({ sessionId: 'site-alpha' })
    await submit(first, LOST)
    first.destroy()

    const second = open({ sessionId: 'site-alpha' })
    await settle()
    expect(second.getChat()?.getInputMarkdown()).toBe(LOST)
    second.destroy()

    const third = open({ sessionId: 'site-alpha' })
    await settle()
    // The draft is back because the COMPOSER kept it, and there is no second
    // bubble and no second notice from us.
    expect(third.getChat()?.getInputMarkdown()).toBe(LOST)
    expect(painted(third)).toEqual([])
  })

  it('test_UAT_FC_BUG-122_a_newer_draft_is_not_overwritten_and_the_words_are_still_shown', async () => {
    // A DRAFT IS NEWER THAN THE LOST MESSAGE, so writing over it would turn a
    // rescue into a second loss. The message is still painted to copy from, and
    // kept — an entry that could not be restored is offered again next time.
    const first = open({ sessionId: 'site-alpha' })
    await submit(first, LOST)
    first.destroy()

    const second = open({ sessionId: 'site-alpha' })
    second.getChat()?.setInputMarkdown('Something I typed since.')
    await settle()

    expect(second.getChat()?.getInputMarkdown()).toBe('Something I typed since.')
    expect(painted(second)[0]).toBe(LOST)
  })

  it('test_UAT_FC_BUG-122_what_goes_back_in_the_box_is_what_the_operator_typed', async () => {
    // REQ-210 — a prompt is EXPANDED on the way out, so the wire form and the
    // typed form differ. The transcript records the expansion, which is what the
    // reconciliation has to compare against; what the operator gets back is the
    // short form they wrote, because that is the one they would have to re-type.
    const expandPrompt = (markdown: string) => `${markdown} [the header, top left]`
    const first = open({ sessionId: 'site-alpha' }, { expandPrompt })
    await submit(first, 'Make this bigger')
    first.destroy()

    // The turn DID reach the transcript, where it appears expanded. Comparing the
    // typed form against it would find no match and hand back a message the
    // conversation already holds.
    const accounted = open(
      {
        sessionId: 'site-alpha',
        turns: [{ role: 'user', markdown: 'Make this bigger [the header, top left]' }],
        cursor: 40,
      },
      { expandPrompt },
    )
    await settle()
    expect(painted(accounted)).toEqual(['Make this bigger [the header, top left]'])
    expect(accounted.getChat()?.getInputMarkdown()).toBe('')
    accounted.destroy()

    // And when it did not reach the transcript, the box gets the short form.
    const second = open({ sessionId: 'site-beta' }, { expandPrompt })
    await submit(second, 'Make this bigger')
    second.destroy()
    const third = open({ sessionId: 'site-beta' }, { expandPrompt })
    await settle()
    expect(third.getChat()?.getInputMarkdown()).toBe('Make this bigger')
  })

  it('test_UAT_FC_BUG-122_a_message_queued_during_a_turn_is_not_lost', async () => {
    // A SUBMIT MADE WHILE THE ASSISTANT IS STREAMING goes to `webui-chat`'s queue,
    // and this pane passes no queue transport — so the text is echoed as pending
    // and then dropped, with the draft already deleted. It is the same loss by a
    // quieter route, and the copy is kept for it too.
    let release: () => void = () => {}
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const slowTransport = {
      streamPrompt: async function* () {
        yield { kind: 'text', content: 'Working' }
        await held
      },
    }

    const first = open({ sessionId: 'site-alpha' }, { transport: slowTransport })
    const chat = first.getChat()
    await chat?.inputReady
    chat?.setInputMarkdown('First')
    const running = chat?.submitInput()
    await settle()
    // The turn is still open, so this one is queued rather than sent.
    chat?.setInputMarkdown(LOST)
    await chat?.submitInput()
    await settle()
    release()
    await running
    first.destroy()

    // The queued message reached no origin at all, so the conversation that comes
    // back holds only the turn that ran — and the queued words come back with it.
    const second = open(
      {
        sessionId: 'site-alpha',
        turns: [
          { role: 'user', markdown: 'First' },
          { role: 'assistant', markdown: 'Working' },
        ],
        cursor: 60,
      },
      { transport: slowTransport },
    )
    await settle()

    expect(painted(second).at(0)).toBe('First')
    expect(painted(second)).toContain(LOST)
    expect(second.getChat()?.getInputMarkdown()).toBe(LOST)
  })
})
