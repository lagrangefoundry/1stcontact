// @vitest-environment jsdom
/**
 * BUG-46 — **a reloaded panel rejoins the turn it loaded into**.
 *
 * THE OTHER HALF OF THE TICKET, and the half an operator actually sees. The
 * workers suite proves the origin: `/api/ai/session` folds the junction so a
 * reload paints the turn instead of losing it, and `/api/ai/reattach` streams
 * the rest from the cursor that fold stopped at. Both were true and neither was
 * visible, because nothing in the browser called the second one.
 *
 * WHAT MADE THAT A DEFERRAL RATHER THAN AN OMISSION. `mountChat` had no way to
 * render a turn it did not start: `send`/`queue`/`interject` all append a user
 * bubble and call `sendPrompt(text)`, and `appendMessage` renders a COMPLETE
 * message with no update path. lagrange-framework REQ-114 added `resume(events,
 * {markdown})` — a host-supplied stream into a new assistant bubble, seeded with
 * what was already painted, driven by `send`'s own loop rather than a second
 * copy of it. This is that call, wired.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, like REQ-122's suite: a
 * mocked panel would assert nothing about the affordance under test. The
 * transport is injected, and that is the correct line — it is HTTP, jsdom
 * cannot serve it, and the workers suite drives the real routes.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createChatPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-46 panel suite skipped: ${WEBUI_SKIP_REASON}`)

/** Let a fire-and-forget `resume` run to completion. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * A transport whose reattach stream the test releases by hand.
 *
 * The pane rejoins a turn that is STILL RUNNING, so a stream that finishes
 * before `setSession` returns would never exercise the state under test — the
 * bubble would be complete by the time anything looked at it. Holding it open is
 * what lets an assertion stand between "seeded" and "finished".
 */
function pacedReattach(rest: string[]) {
  const asked: [string, number][] = []
  let release = (): void => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  return {
    asked,
    release: () => release(),
    streamPrompt: async function* () {
      yield { kind: 'done' }
    },
    streamReattach: async function* (sessionId: string, cursor: number) {
      asked.push([sessionId, cursor])
      await gate
      for (const content of rest) yield { kind: 'text', content }
      yield { kind: 'done' }
    },
  }
}

/** The markdown of every message in the pane, in order. */
const painted = (panel: { getChat: () => { getMessages: () => unknown[] } | null }) =>
  (panel.getChat()?.getMessages() ?? []).map(
    (m) => (m as { role: string; markdown: string }).markdown,
  )

const roles = (panel: { getChat: () => { getMessages: () => unknown[] } | null }) =>
  (panel.getChat()?.getMessages() ?? []).map((m) => (m as { role: string }).role)

/** A session as `/api/ai/session` answers mid-turn: the fold, plus where it got to. */
const midTurn = () => ({
  sessionId: 'site-alpha',
  turns: [
    { role: 'user', markdown: 'Change the heading.' },
    { role: 'assistant', markdown: 'I have started editing. ' },
  ],
  cursor: 412,
  live: true,
  ready: true,
})

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
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-46 the pane rejoins a turn in flight', () => {
  it('test_UAT_FC_BUG-46_the_partial_and_the_tail_are_one_message', async () => {
    // THE POINT OF THE WHOLE TICKET, seen from the operator's chair. What was
    // written before the reload and what arrives after it are one reply, not a
    // finished-looking fragment followed by a second bubble.
    const transport = pacedReattach(['And now I am ', 'finished.'])
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession(midTurn())

    // MID-REJOIN. The user turn is painted; the partial is NOT a message of its
    // own — it is the seed of the bubble the tail is being written into.
    expect(roles(panel)).toEqual(['user', 'assistant'])
    expect(painted(panel)).toEqual(['Change the heading.', 'I have started editing. '])
    expect(transport.asked).toEqual([['site-alpha', 412]])

    transport.release()
    await settle()

    expect(roles(panel)).toEqual(['user', 'assistant'])
    expect(painted(panel)).toEqual([
      'Change the heading.',
      'I have started editing. And now I am finished.',
    ])
  })

  it('test_UAT_FC_BUG-46_a_settled_conversation_does_not_reattach', async () => {
    // `live` IS THE WHOLE GUARD. Tailing a quiet junction would be correct and
    // wasteful — the request hangs until the tail's own timeout, having rejoined
    // nothing — so a conversation with no turn open must not ask.
    const transport = pacedReattach(['unreachable'])
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({
      sessionId: 'site-alpha',
      turns: [
        { role: 'user', markdown: 'Change the heading.' },
        { role: 'assistant', markdown: 'Done.' },
      ],
      cursor: 412,
      live: false,
      ready: true,
    })
    await settle()

    expect(transport.asked).toEqual([])
    // And the finished assistant turn is painted as an ordinary message, which
    // is the branch that was there before this ticket and still is.
    expect(painted(panel)).toEqual(['Change the heading.', 'Done.'])
  })

  it('test_UAT_FC_BUG-46_a_reload_between_turns_seeds_nothing', async () => {
    // A turn can be open with NOTHING SAID YET — the operator's message is in,
    // the model has not begun. There is no partial to seed with, and the rejoin
    // must still happen: this is the window in which the reply is entirely still
    // to come, so it is the one where losing the tail costs most.
    const transport = pacedReattach(['Thinking about it.'])
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({
      sessionId: 'site-alpha',
      turns: [{ role: 'user', markdown: 'Change the heading.' }],
      cursor: 200,
      live: true,
      ready: true,
    })

    expect(transport.asked).toEqual([['site-alpha', 200]])
    transport.release()
    await settle()

    expect(roles(panel)).toEqual(['user', 'assistant'])
    expect(painted(panel)).toEqual(['Change the heading.', 'Thinking about it.'])
  })

  it('test_UAT_FC_BUG-46_a_resumed_turn_still_reports_its_writes', async () => {
    // BUG-43's signal has to survive the rejoin. A resumed turn writes to the
    // site exactly as a live one does, and `site_changed` is the operator's only
    // notice that the preview moved — dropping it here would make a reloaded
    // page the one place edits happen invisibly, which is the loop that had them
    // reloading to begin with.
    const seen: { at?: number }[] = []
    const transport = {
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
      streamReattach: async function* () {
        yield { kind: 'text', content: 'Edited. ' }
        yield { kind: 'site_changed', content: '', meta: { at: 7, changes: 1 } }
        yield { kind: 'done' }
      },
    }
    const panel = createChatPanel({ transport, onSiteChanged: (m: { at?: number }) => seen.push(m) })
    document.body.append(panel.element)
    panel.setSession(midTurn())
    await settle()

    expect(seen).toEqual([{ at: 7, changes: 1 }])
    // AND IT STOPS THERE. `site_changed` is the host's own kind; passing it on
    // to the chat component would render a blank bubble the day it learns
    // another one.
    expect(painted(panel)).toEqual([
      'Change the heading.',
      'I have started editing. Edited. ',
    ])
  })

  it('test_UAT_FC_BUG-46_a_failed_rejoin_costs_the_tail_and_nothing_else', async () => {
    // The rejoin is a request the operator did not make, so its failure is not
    // theirs to be told about: the transcript is painted, and the turn itself is
    // untouched because a tail is a reader. What must NOT happen is an unhandled
    // rejection or a pane that fails to mount.
    const transport = {
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
      // eslint-disable-next-line require-yield
      streamReattach: async function* () {
        throw new Error('reattach refused')
      },
    }
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    expect(() => panel.setSession(midTurn())).not.toThrow()
    await settle()

    expect(painted(panel)).toEqual(['Change the heading.', 'I have started editing. '])
  })

  it('test_UAT_FC_BUG-46_a_transport_with_no_reattach_still_mounts', async () => {
    // Every caller that predates this ticket hands in `{streamPrompt}` alone,
    // and a panel that threw — or silently stopped painting — for want of a
    // rejoin would be a regression in the ordinary path to fix the exceptional
    // one.
    const panel = createChatPanel({
      transport: {
        streamPrompt: async function* () {
          yield { kind: 'done' }
        },
      },
    })
    document.body.append(panel.element)
    panel.setSession(midTurn())
    await settle()

    expect(painted(panel)).toEqual(['Change the heading.', 'I have started editing. '])
  })
})
