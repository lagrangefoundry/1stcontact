// @vitest-environment jsdom
/**
 * BUG-123 — **a panel whose live stream dies goes and finds out what happened**.
 *
 * THE DOWNSTREAM HALF OF `lagrange-framework` BUG-58. Upstream stopped reading a
 * stream that ended without its terminal `done` as a turn that produced nothing:
 * the bubble is kept, marked, offered no resend — the resend is what duplicated
 * the operator's prompt — and the host is told on `opts.onTurnLost`. That is the
 * whole of what a widget with no origin can do. Asking the origin is this side's,
 * and until now nothing here asked: [[BUG-46]] rejoined a turn exactly once, AT
 * MOUNT, so a panel already on screen whose stream died simply stopped painting
 * and the operator's only move was to reload — which is itself destructive
 * ([[BUG-122]]) and is how they came to lose a long prompt.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, like [[BUG-46]]'s suite
 * and REQ-122's: a mocked panel would assert nothing about the affordance under
 * test, and the thing under test here is specifically what the real widget does
 * when a stream stops. The transport and the re-read are injected, which is the
 * correct line — both are HTTP, jsdom cannot serve it, and the workers suites
 * drive the real routes.
 *
 * THE SUITE ALSO SKIPS ON A STALE INSTALL, not only an absent one. `WEBUI_INSTALLED`
 * is presence-only and says so; a copy predating BUG-58 is present and simply
 * never calls `onTurnLost`, which would fail every assertion below for a reason
 * that is not a defect in this repository. The probe is the capability itself.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON, importWebui } from './support/webui-installed'

/** Let the fire-and-forget chase, and any resume it starts, run to completion. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * A recovery that pauses for no time at all.
 *
 * The ladder is measured in seconds because it is standing in front of a person
 * watching a reply that stopped. A suite that spent it per assertion is a suite
 * nobody runs, so the wait is a seam and this is what a test puts in it.
 */
const instant = () => Promise.resolve()

/** The markdown of every message in the pane, in order. */
const painted = (panel: { getChat: () => { getMessages: () => unknown[] } | null }) =>
  (panel.getChat()?.getMessages() ?? []).map(
    (m) => (m as { role: string; markdown: string }).markdown,
  )

/** A turn whose stream stops mid-reply without ever saying `done`. */
function droppedPrompt(said: string[]) {
  return async function* () {
    for (const content of said) yield { kind: 'text', content }
    // AND THEN NOTHING. No `done`, no throw — the socket simply went away, which
    // is the ending this whole ticket is about being unable to tell apart from a
    // turn that finished.
  }
}

/**
 * A session as `/api/ai/session` answers it: the fold, and whether a turn is open.
 *
 * EMPTY BY DEFAULT, because every case below starts its turn with `send` — the
 * panel paints the prompt itself, so a seeded transcript carrying the same words
 * would put them on screen twice and prove nothing about the recovery. The cases
 * that are about the RE-READ pass the transcript the origin answers with.
 */
function session(over: Record<string, unknown> = {}) {
  return {
    sessionId: 'site-alpha',
    turns: [] as { role: string; markdown: string }[],
    cursor: 0,
    live: false,
    ready: true,
    ...over,
  }
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

/**
 * Whether the INSTALLED panel reports a lost turn at all.
 *
 * AT MODULE SCOPE AND NOT IN `beforeAll`, because `it.skipIf` is evaluated when
 * the case is REGISTERED — during collection, which is before any hook has run.
 * A probe in a hook decides the gate after every decision it was meant to make.
 *
 * THE PROBE IS A MOUNT AND NOT A SOURCE READ. What matters is whether the
 * installed panel REPORTS a lost turn, and the only honest way to ask is to lose
 * one: an option the widget does not know is an option it silently ignores,
 * which is exactly how a stale install reads as a broken repository.
 * `WEBUI_INSTALLED` cannot see this — it says so itself, and is presence-only.
 */
async function reportsLostTurns(): Promise<boolean> {
  if (!WEBUI_INSTALLED) {
    console.warn(`BUG-123 suite skipped: ${WEBUI_SKIP_REASON}`)
    return false
  }
  const chat = await importWebui('webui-chat')
  const host = document.createElement('div')
  document.body.append(host)
  let told = false
  const probe = (
    chat.mountChat as (el: Element, o: Record<string, unknown>) => Record<string, unknown>
  )(host, { onTurnLost: () => (told = true), composer: false })
  await (probe.resume as (e: AsyncIterable<unknown>) => Promise<void>)(droppedPrompt([])())
  ;(probe.destroy as () => void)()
  host.remove()
  if (!told) {
    console.warn(
      'BUG-123 suite skipped: the installed webui-chat predates BUG-58 and never reports a ' +
        'lost turn — run `bin/install --lang js --component all` in lagrange-framework',
    )
  }
  return told
}

const live = await reportsLostTurns()
const createChatPanel: (opts?: Record<string, unknown>) => never = live
  ? ((await import('../apps/control-app/src/builder/chat.js')).createChatPanel as never)
  : (null as never)

beforeEach(() => {
  document.body.replaceChildren()
})

describe('BUG-123 a stream that drops mid-turn is rejoined', () => {
  it.skipIf(!live)(
    'test_UAT_FC_BUG-123_a_dropped_stream_asks_the_origin_what_happened',
    async () => {
      // THE WHOLE TICKET IN ONE ASSERTION: the panel that used to go quiet now
      // goes back to the origin. `reopen` is the host's half of the seam
      // (REQ-127) — the pane knows a session id, and `/api/ai/session` does not
      // take one — so proving the pane ASKS is proving it can be answered.
      const asked: number[] = []
      const panel = createChatPanel({
        transport: { streamPrompt: droppedPrompt(['Working on it. ']) },
        reopen: async () => {
          asked.push(1)
          return session()
        },
        wait: instant,
      })
      document.body.append(panel.element)
      panel.setSession(session())

      await panel.getChat().send('Change the heading.')
      await settle()

      expect(asked.length).toBe(1)
    },
  )

  it.skipIf(!live)('test_UAT_FC_BUG-123_a_turn_still_live_is_rejoined_into_one_message', async () => {
    // THE RECOVERY THAT MATTERS. The turn is still being written, so the answer
    // is not "here is what we have" — it is the rest of the reply, continuing
    // into the SAME bubble. Two messages, the first wearing a notice saying the
    // connection to it was lost, directly above the connection being fine, is
    // the failure `resume`'s adoption exists to prevent.
    const rejoined: [string, number][] = []
    const panel = createChatPanel({
      transport: {
        streamPrompt: droppedPrompt(['I have started ']),
        streamReattach: async function* (id: string, cursor: number) {
          rejoined.push([id, cursor])
          yield { kind: 'text', content: 'editing. Done.' }
          yield { kind: 'done' }
        },
      },
      reopen: async () => session({ live: true, cursor: 412 }),
      wait: instant,
    })
    document.body.append(panel.element)
    panel.setSession(session())

    await panel.getChat().send('Change the heading.')
    await settle()

    // REJOINED AT THE CURSOR THE ORIGIN JUST HANDED OUT, not at one this pane
    // remembered from mount: the fold it pairs with is the one just taken.
    expect(rejoined).toEqual([['site-alpha', 412]])
    expect(painted(panel)).toEqual(['Change the heading.', 'I have started editing. Done.'])
    // AND THE NOTICE IS GONE. `resume` adopts the lost bubble, so the reply is
    // one message that was never interrupted rather than one wearing an apology
    // for a connection that has since been re-made.
    expect(panel.element.querySelectorAll('.chat-message-lost').length).toBe(0)
  })

  it.skipIf(!live)('test_UAT_FC_BUG-123_a_turn_that_ended_is_repainted_from_the_transcript', async () => {
    // NOT LIVE MEANS OVER, and the transcript the origin just answered with is
    // the honest account of it — including the half of the reply that DID reach
    // the archive, which this panel never saw because its stream died first.
    //
    // REPAINTED WHOLE rather than patched at an offset: the cursor is a junction
    // offset, not a byte offset into the reply, so "the reply from here on" is
    // not a thing that can be asked for.
    const panel = createChatPanel({
      transport: { streamPrompt: droppedPrompt(['I have st']) },
      reopen: async () =>
        session({
          turns: [
            { role: 'user', markdown: 'Change the heading.' },
            { role: 'assistant', markdown: 'I have started editing. It is done.' },
          ],
        }),
      wait: instant,
    })
    document.body.append(panel.element)
    panel.setSession(session())

    await panel.getChat().send('Change the heading.')
    await settle()

    expect(painted(panel)).toEqual([
      'Change the heading.',
      'I have started editing. It is done.',
    ])
  })

  it.skipIf(!live)('test_UAT_FC_BUG-123_the_origin_is_retried_before_the_pane_gives_up', async () => {
    // A FIRST REFUSAL IS A BAD MOMENT, NOT AN ANSWER. The commonest reason the
    // stream stopped is that the origin is having trouble, so asking once and
    // reporting failure would turn a blip into a lost turn — which is the whole
    // complaint. Bounded, though: a few attempts, and then a sentence.
    let attempts = 0
    const panel = createChatPanel({
      transport: { streamPrompt: droppedPrompt(['I have st']) },
      reopen: async () => {
        attempts += 1
        if (attempts < 3) throw new Error('origin unreachable')
        return session({
          turns: [
            { role: 'user', markdown: 'Change the heading.' },
            { role: 'assistant', markdown: 'I have started editing. It is done.' },
          ],
        })
      },
      wait: instant,
    })
    document.body.append(panel.element)
    panel.setSession(session())

    await panel.getChat().send('Change the heading.')
    await settle()

    expect(attempts).toBe(3)
    expect(painted(panel)).toEqual([
      'Change the heading.',
      'I have started editing. It is done.',
    ])
  })

  it.skipIf(!live)('test_UAT_FC_BUG-123_a_recovery_that_fails_is_said_out_loud', async () => {
    // THE OPERATOR IS OWED THE REASON. A pane that tried, failed, and then sat
    // there is the same screen as a pane that never tried — and it is the screen
    // that taught them to reload. When the attempts run out the conversation
    // says what happened, carrying the origin's own words for it.
    const panel = createChatPanel({
      transport: { streamPrompt: droppedPrompt(['I have st']) },
      reopen: async () => {
        throw new Error('origin unreachable')
      },
      wait: instant,
    })
    document.body.append(panel.element)
    panel.setSession(session())

    await panel.getChat().send('Change the heading.')
    await settle()

    const said = painted(panel).at(-1) as string
    expect(said).toContain('could not be re-read')
    expect(said).toContain('origin unreachable')
    // AND THE PARTIAL IS STILL THERE. Half an answer is content, and a recovery
    // that failed is not a licence to throw away what did arrive.
    expect(painted(panel)).toContain('I have st')
  })

  it.skipIf(!live)('test_UAT_FC_BUG-123_a_host_with_no_reopen_is_unchanged_but_not_silent', async () => {
    // EVERY CALLER THAT PREDATES THIS TICKET passes no `reopen`, and none of them
    // may break for want of one. What they gain is the half that needs no seam:
    // the stall is explained rather than left to read as an assistant that
    // stopped mid-sentence for no reason.
    const panel = createChatPanel({
      transport: { streamPrompt: droppedPrompt(['I have st']) },
      wait: instant,
    })
    document.body.append(panel.element)
    expect(() => panel.setSession(session())).not.toThrow()

    await panel.getChat().send('Change the heading.')
    await settle()

    expect(painted(panel).at(-1)).toContain('The connection to that reply was lost')
  })

  it.skipIf(!live)('test_UAT_FC_BUG-123_a_recovery_for_a_conversation_left_behind_is_dropped', async () => {
    // THE GUARD `setSession` IS BUILT AROUND, applied to the one thing that did
    // not have it. Every await in a chase is a window in which the operator can
    // switch site, and an answer about the conversation they left must not be
    // painted into the one they are looking at.
    let release = (): void => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const panel = createChatPanel({
      transport: { streamPrompt: droppedPrompt(['I have st']) },
      reopen: async () => {
        await gate
        return session({
          turns: [{ role: 'user', markdown: 'Change the heading.' }, { role: 'assistant', markdown: 'STALE' }],
        })
      },
      wait: instant,
    })
    document.body.append(panel.element)
    panel.setSession(session())

    await panel.getChat().send('Change the heading.')
    await settle()

    // The operator moves on while the re-read is still in flight.
    panel.setSession(session({ sessionId: 'site-beta', turns: [{ role: 'user', markdown: 'Other site.' }] }), 'beta')
    release()
    await settle()

    expect(painted(panel)).toEqual(['Other site.'])
  })
})
