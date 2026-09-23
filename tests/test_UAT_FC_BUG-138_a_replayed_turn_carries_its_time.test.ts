// @vitest-environment jsdom
/**
 * BUG-138 — **a turn replayed from the transcript carries the time it happened**.
 *
 * THE INCIDENT. Every turn in the chat pane is supposed to wear its time, and a
 * day separator is supposed to open each new calendar day. The scheme worked —
 * for exactly one turn, the one that had just been sent. Scroll back through a
 * conversation spanning days and the history was bare: no times, no separators.
 * Reload, and the turn that HAD been stamped lost its stamp too, because on the
 * next load it was history like everything above it.
 *
 * WHY, AND WHY THE FIX IS TWO ARGUMENTS RATHER THAN A FEATURE. The moment existed
 * at every layer except the two that would show it. The transcript markup carries
 * `ts="…"` on every marker; the fold puts a `ts` on every turn it projects. Then
 * `host-core.ts` mapped those turns to `{role, markdown}` — dropping it — and this
 * pane's replay called `appendMessage(role, markdown)` with no metadata, so the
 * component's `stampTurn` never ran for a single historical turn. Omit that third
 * argument and the component renders exactly as it did before stamps existed: no
 * time, no separator, no error. Which is why nothing failed, and why it was
 * invisible except as a bare history.
 *
 * WHAT IS ASSERTED HERE is the PANE's half: given turns that carry their moment,
 * every one of them is stamped, the day separators land where the local calendar
 * days change, and the times are the turns' own rather than the clock's. The
 * ORIGIN's half — that `/api/ai/session` carries `ts` at all — is the workers
 * suite beside this one, because that is where the fold and the routes are real.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, like BUG-121's and
 * BUG-122's panel suites: the scheme under test is the component's own, so a
 * stand-in would assert nothing at all.
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

if (!WEBUI_INSTALLED) console.warn(`BUG-138 panel suite skipped: ${WEBUI_SKIP_REASON}`)

/** Let the composer's own async load, and anything waiting on it, settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * A local wall-clock moment, as an ISO string.
 *
 * LOCAL AND NOT UTC, deliberately. The scheme under test is about the READER's
 * calendar — `localDayKey` and `formatTurnTime` both work in the local zone,
 * because a reader asking "was that yesterday?" means their own midnight. Writing
 * these fixtures as UTC literals would make the suite pass or fail depending on
 * the offset the machine running it happens to have.
 */
const local = (y: number, m: number, d: number, hh: number, mm: number) =>
  new Date(y, m - 1, d, hh, mm, 0, 0).toISOString()

/** What the thread shows under each bubble, in order — '' for an unstamped one. */
const times = (panel: Panel): string[] =>
  [...panel.element.querySelectorAll('.chat-message')].map(
    (el) => el.querySelector('.chat-message-time')?.textContent ?? '',
  )

/** The day separators the thread has opened, in order. */
const days = (panel: Panel): string[] =>
  [...panel.element.querySelectorAll('.chat-day-separator')].map((el) => el.textContent ?? '')

/**
 * The thread in document order, as `'kind:text'`.
 *
 * A separator's POSITION is the whole of its claim — "the turns below this are a
 * new day" — so a suite that only counted them would pass on separators emitted
 * at the end, which is close to the defect being fixed.
 */
const thread = (panel: Panel): string[] =>
  [...panel.element.querySelectorAll('.chat-day-separator, .chat-message')].map((el) =>
    el.classList.contains('chat-day-separator')
      ? `day:${el.textContent}`
      : `time:${el.querySelector('.chat-message-time')?.textContent ?? ''}`,
  )

const transport = {
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

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
})

/** Mount a pane and hand it a conversation, the way a page load does. */
function open(session: Record<string, unknown>, opts: Record<string, unknown> = {}): Panel {
  const panel = createChatPanel({ transport, ...opts })
  document.body.append(panel.element)
  panel.setSession({ sessionId: 'site-alpha', cursor: 0, live: false, ready: true, turns: [], ...session })
  return panel
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-138 a replayed turn carries its time', () => {
  it('test_UAT_FC_BUG-138_every_replayed_turn_is_stamped_with_its_own_recorded_moment', async () => {
    // THE REPORTED SCREEN, one day of it. Before the fix exactly none of these
    // wore a time; the only stamped bubble in the pane was one the operator had
    // just sent, from the panel's own clock.
    const panel = open({
      turns: [
        { role: 'user', markdown: 'Rebuild the recursion diagram.', ts: local(2026, 9, 18, 9, 14) },
        { role: 'assistant', markdown: 'Done — the fold is on the left now.', ts: local(2026, 9, 18, 9, 15) },
        { role: 'user', markdown: 'Make the caption smaller.', ts: local(2026, 9, 18, 17, 2) },
        { role: 'assistant', markdown: 'Smaller.', ts: local(2026, 9, 18, 17, 3) },
      ],
    })
    await settle()

    // EACH TURN'S OWN MOMENT, not one stamp and three blanks — and formatted by
    // the component's scheme, because it is the component's own call.
    expect(times(panel)).toEqual(['09:14', '09:15', '17:02', '17:03'])
  })

  it('test_UAT_FC_BUG-138_day_separators_open_each_day_of_the_history_not_only_the_last', async () => {
    // THE CONVERSATION THE TICKET DESCRIBES: one that spans days. The separator
    // belongs ABOVE the first turn of each day, throughout — which is exactly
    // what a history replayed without moments could not produce, because the
    // boundary rule has nothing to compare.
    const panel = open({
      turns: [
        { role: 'user', markdown: 'Start the site.', ts: local(2026, 9, 16, 11, 5) },
        { role: 'assistant', markdown: 'Started.', ts: local(2026, 9, 16, 11, 6) },
        { role: 'user', markdown: 'Change the hero.', ts: local(2026, 9, 17, 8, 40) },
        { role: 'assistant', markdown: 'Changed.', ts: local(2026, 9, 17, 8, 41) },
        { role: 'user', markdown: 'Ship it.', ts: local(2026, 9, 18, 20, 12) },
      ],
    })
    await settle()

    expect(days(panel)).toEqual([
      'Wednesday, September 16 2026',
      'Thursday, September 17 2026',
      'Friday, September 18 2026',
    ])
    // AND WHERE THEY LAND IS THE CLAIM. A separator is a statement about the
    // turns BELOW it, so its position is what makes it true or merely present.
    expect(thread(panel)).toEqual([
      'day:Wednesday, September 16 2026',
      'time:11:05',
      'time:11:06',
      'day:Thursday, September 17 2026',
      'time:08:40',
      'time:08:41',
      'day:Friday, September 18 2026',
      'time:20:12',
    ])
  })

  it('test_UAT_FC_BUG-138_the_same_conversation_reloaded_later_shows_the_same_times', async () => {
    // THE SECOND HALF OF THE REPORT — reload and the stamp that WAS there is
    // gone, because on the next load it is history. What replaces "gone" must be
    // the turn's own moment and never the moment of the load: a conversation
    // opened tomorrow reads exactly as it read today.
    const turns = [
      { role: 'user', markdown: 'Rebuild the recursion diagram.', ts: local(2026, 9, 18, 9, 14) },
      { role: 'assistant', markdown: 'Done.', ts: local(2026, 9, 18, 9, 15) },
    ]

    const first = open({ turns })
    await settle()
    const asRead = thread(first)
    expect(asRead).toEqual(['day:Friday, September 18 2026', 'time:09:14', 'time:09:15'])
    first.destroy()

    // A SECOND LOAD IS A SECOND PANEL OVER THE SAME TRANSCRIPT, which is the only
    // honest way to stage a reload — and the only thing that differs between the
    // two is the wall clock, which is precisely what must not show.
    const second = open({ turns })
    await settle()
    expect(thread(second)).toEqual(asRead)
  })

  it('test_UAT_FC_BUG-138_a_turn_with_no_usable_moment_renders_as_it_always_did', async () => {
    // THE DEGRADE, and it is the reason a missing or broken moment is cheaper
    // than a wrong one. A transcript written before the markup carried `ts`, or a
    // record whose value will not parse, must render as the pane rendered before
    // stamps existed — no time, no separator — rather than printing a wrong time
    // or failing the mount and costing the operator the whole conversation.
    const panel = open({
      turns: [
        { role: 'user', markdown: 'From an older transcript.' },
        { role: 'assistant', markdown: 'No moment on this one either.', ts: '' },
        { role: 'user', markdown: 'Nor this.', ts: 'the day before yesterday' },
        { role: 'assistant', markdown: 'But this one has one.', ts: local(2026, 9, 18, 9, 15) },
      ],
    })
    await settle()

    expect(times(panel)).toEqual(['', '', '', '09:15'])
    // THE UNSTAMPED TURNS TAKE NO PART IN THE BOUNDARY RULE, so the one day
    // opened is the one day that is actually known.
    expect(days(panel)).toEqual(['Friday, September 18 2026'])
    // AND NOTHING WAS LOST TO THE DEGRADE: all four turns are still painted.
    expect(panel.element.querySelectorAll('.chat-message')).toHaveLength(4)
  })

  it('test_UAT_FC_BUG-138_an_interrupted_turns_words_are_stamped_with_when_they_were_sent', async () => {
    // [[BUG-121]]'s RESCUE, DATED HONESTLY. The origin wrote that record as the
    // turn opened and has carried its `at` ever since. Painting the operator's
    // words back with the moment of the reload would place a message they sent
    // on Wednesday after a conversation that ended on Friday.
    const panel = open({
      turns: [
        { role: 'user', markdown: 'Change the hero.', ts: local(2026, 9, 16, 11, 5) },
        { role: 'assistant', markdown: 'Changed.', ts: local(2026, 9, 16, 11, 6) },
      ],
      interrupted: {
        text: 'A long message, typed once, about the recursion diagram.',
        at: local(2026, 9, 17, 14, 30),
        recorded: false,
      },
    })
    await settle()

    // The handed-back message wears its SUBMIT moment, and opens the day it was
    // submitted on — the notice beneath it is the panel's own voice and wears
    // nothing, as panel notices always have.
    expect(thread(panel)).toEqual([
      'day:Wednesday, September 16 2026',
      'time:11:05',
      'time:11:06',
      'day:Thursday, September 17 2026',
      'time:14:30',
      'time:',
    ])
  })

  it('test_UAT_FC_BUG-138_a_turn_still_in_flight_is_dated_by_the_turn_and_not_by_the_reattach', async () => {
    // THE ONE TURN THE REPLAY LOOP NEVER APPENDS. When the origin says a turn is
    // open, the transcript's last assistant turn is the half of a reply already
    // written; it is handed to `resume` so the half said and the half coming are
    // ONE message rather than two. Which means it misses the loop's third
    // argument — and so it would be the only bubble in the thread dated by
    // whenever the tail happened to drain.
    //
    // AND THAT IS WORST FOR THE TURN MOST LIKELY TO NEED IT: a reattach whose
    // `turn_end` is already past the cursor drains at once, so "now" is the
    // reload rather than the reply.
    const transportWithTail = {
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
      streamReattach: async function* () {
        yield { kind: 'text', content: 'and here is the rest of it.' }
        yield { kind: 'done' }
      },
    }
    const panel = open(
      {
        live: true,
        cursor: 412,
        turns: [
          { role: 'user', markdown: 'Change the heading.', ts: local(2026, 9, 18, 9, 14) },
          { role: 'assistant', markdown: 'I have started editing — ', ts: local(2026, 9, 18, 9, 15) },
        ],
      },
      { transport: transportWithTail },
    )
    await settle()

    // TWO BUBBLES, NOT THREE — the seeded half and the tail are one reply — and
    // the reply wears the moment the TURN opened, which is what the transcript
    // recorded for it.
    expect(panel.element.querySelectorAll('.chat-message')).toHaveLength(2)
    expect(times(panel)).toEqual(['09:14', '09:15'])
    expect(days(panel)).toEqual(['Friday, September 18 2026'])
  })

  it('test_UAT_FC_BUG-138_a_submission_no_transcript_accounts_for_is_stamped_with_when_it_was_sent', async () => {
    // [[BUG-122]]'s RESCUE, and the moment matters most here: these are the
    // submissions that survive precisely BECAUSE no transcript accounts for them,
    // so they are the entries most likely to be days old by the time they are
    // handed back. `sentPrompts` has kept `at` on every entry since it started
    // keeping them; this is the call that finally shows it.
    const map = new Map<string, string>()
    const storage = {
      getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
      setItem: (k: string, v: string) => void map.set(k, String(v)),
      removeItem: (k: string) => void map.delete(k),
    } as unknown as Storage

    // The submit that never reached a transcript, staged the way BUG-122's suite
    // stages one: a pane, a send into a transport that says nothing, then a
    // reload onto the same store.
    const first = open({}, { storage })
    const chat = first.getChat()
    if (!chat) throw new Error('the pane has no conversation')
    await chat.inputReady
    chat.setInputMarkdown('The message that went nowhere.')
    await chat.submitInput()
    await settle()
    first.destroy()

    const second = open({}, { storage })
    await settle()

    // ITS OWN SUBMIT MOMENT, which the entry kept — so it is stamped, and not
    // with a blank the way every replayed turn used to be.
    const stamped = times(second)
    expect(stamped[0]).toMatch(/^\d{2}:\d{2}$/)
    expect(days(second)).toHaveLength(1)
  })
})
