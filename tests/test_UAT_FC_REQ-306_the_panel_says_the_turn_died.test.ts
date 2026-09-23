// @vitest-environment jsdom
/**
 * [[REQ-306]] — **the customer is told something true about a turn that died**.
 *
 * WHAT THE CUSTOMER WAS TOLD, and why it was the worst possible sentence. When
 * the isolate running a turn was killed the panel saw a stream stop without a
 * terminal frame and said *the connection to this reply was lost*. The
 * connection was fine. Told that it had dropped, a customer reloads, retries and
 * checks their network — the three remedies that cannot possibly work — and the
 * one party who could have fixed it never hears about it at all.
 *
 * THE TWO FACTS THE ORIGIN NOW SUPPLIES, and this suite is about neither being
 * invented here. `interrupted` ([[BUG-121]]) is about the customer's WORDS;
 * `failed` ([[REQ-306]]) is about what became of the TURN, read from a ledger row
 * written before the turn began rather than guessed at from a socket. The panel's
 * job is to compose them into ONE sentence that is true.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, like BUG-121's suite, for
 * its reason: the affordance is the component's own transcript. The transport is
 * injected — it is HTTP, and the `.workers` suites drive the real routes.
 *
 * THE FALSIFIERS:
 *
 *   - *the word "connection"* anywhere in what a died turn produces;
 *   - *silence* where the origin reported a death but kept no pending record —
 *     the turn killed before it could write the customer's words down, which is
 *     precisely the case the old code showed nothing at all for;
 *   - *two notices for one turn*, which is what a second mechanism bolted beside
 *     the first would produce;
 *   - *a notice after an ordinary turn*, which would teach the customer to
 *     ignore the one that mattered.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createChatPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-306 panel suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

const transport = {
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

const painted = (panel: { getChat: () => { getMessages: () => unknown[] } | null }) =>
  (panel.getChat()?.getMessages() ?? []).map(
    (m) => (m as { role: string; markdown: string }).markdown,
  )

const TURN = 'turn_0123456789abcdef0123456789abcdef'

const base = {
  sessionId: 'site-alpha',
  turns: [
    { role: 'user', markdown: 'Make the header green.' },
    { role: 'assistant', markdown: 'Starting on that. ' },
  ],
  cursor: 90,
  live: false,
  ready: true,
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

function mount(session: Record<string, unknown>) {
  const panel = createChatPanel({ transport }) as never as {
    element: HTMLElement
    setSession: (s: unknown) => void
    getChat: () => { getMessages: () => unknown[] } | null
  }
  document.body.append(panel.element)
  panel.setSession({ ...base, ...session })
  return panel
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-306 the panel says what became of the turn', () => {
  it('test_UAT_FC_REQ-306_a_died_turn_is_not_reported_as_a_dropped_connection', async () => {
    // THE INCIDENT, from the customer's chair: the turn was killed before it
    // could even record their question, so there is no `interrupted` — which on
    // the old code meant the conversation repainted in silence behind a bubble
    // claiming the connection had gone.
    const panel = mount({ failed: { turn: TURN, at: base.turns[0].markdown, state: 'lost', detail: null } })
    await settle()

    const last = painted(panel).at(-1) as string
    expect(last).toContain('stopped before it finished')
    // THE LOAD-BEARING ASSERTION. The connection held; saying otherwise sent a
    // customer to their router and kept the failure away from the one party who
    // could act on it.
    expect(last).not.toContain('connection to')
    expect(last).toContain('the connection held')
    // AND THE REFERENCE, which is what turns a complaint into a lookup: an
    // operator can find the row by the id the customer quotes.
    expect(last).toContain(TURN)
  })

  it('test_UAT_FC_REQ-306_a_died_turn_and_a_kept_prompt_produce_one_notice', async () => {
    // THE COMPOSITION. The turn got as far as writing the customer's words down
    // (`recorded`), so the transcript already carries both halves; what is owed
    // is why the reply stopped. Two mechanisms each saying their piece would give
    // the customer two apologies for one failure.
    const panel = mount({
      interrupted: { text: 'Make the header green.', at: '2026-09-22T12:00:00.000Z', recorded: true },
      failed: { turn: TURN, at: '2026-09-22T12:00:00.000Z', state: 'lost', detail: null },
    })
    await settle()

    const notes = painted(panel).filter((m) => typeof m === 'string' && m.includes('stopped before it finished'))
    expect(notes).toHaveLength(1)
    // ONE SENTENCE, CARRYING BOTH FACTS: that the turn died, and that the reply
    // above it is a fragment rather than a short answer.
    expect(notes[0]).toContain('not all of it')
    expect(painted(panel).at(-1)).not.toContain('connection to')
  })

  it('test_UAT_FC_REQ-306_a_turn_that_errored_says_why', async () => {
    // AN ERRORED TURN CLOSED PROPERLY AND TOLD THE STREAM WHY — but a panel that
    // reloaded after it never saw that frame, so the reason is what it is owed.
    // It reads differently from a death because it IS different: a lost turn has
    // no why, and inventing one would be worse than the silence.
    const panel = mount({
      failed: { turn: TURN, at: '2026-09-22T12:00:00.000Z', state: 'error', detail: 'the assistant ran out of room' },
    })
    await settle()

    const last = painted(panel).at(-1) as string
    expect(last).toContain('failed before it finished')
    expect(last).toContain('the assistant ran out of room')
  })

  it('test_UAT_FC_REQ-306_an_ordinary_conversation_gets_no_notice', async () => {
    // THE FALSIFIER FOR ALL THREE. A notice that appeared after every turn would
    // be worth nothing and would train the customer past the one that mattered.
    const panel = mount({ failed: null })
    await settle()

    expect(painted(panel)).toEqual(['Make the header green.', 'Starting on that. '])
  })
})
