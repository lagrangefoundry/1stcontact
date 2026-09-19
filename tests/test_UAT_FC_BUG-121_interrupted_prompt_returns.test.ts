// @vitest-environment jsdom
/**
 * BUG-121 — **the pane hands back the words an interrupted turn swallowed**.
 *
 * THE HALF AN OPERATOR ACTUALLY SEES. The workers suite proves the origin: the
 * prompt is written before the model is called, kept when the turn does not
 * complete, and reported by `/api/ai/session` as `interrupted`, reconciled
 * against the transcript answered with it. None of that is worth anything until
 * something in the browser paints it — the failure being fixed is a SCREEN that
 * says nothing happened.
 *
 * TWO CASES, DECIDED BY THE ORIGIN AND NOT HERE (`recorded`):
 *
 *   - the turn left no trace, so this text exists nowhere else and the operator
 *     is owed it back — on screen AND in the composer, because what they lost
 *     and cannot reconstruct is a long message typed once;
 *   - the turn's records landed and only the reply is a fragment, so the words
 *     are already painted above and what is owed is being told that the reply
 *     stopped rather than ended.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, like BUG-46's panel suite:
 * the affordance under test is the component's own composer, so a stand-in would
 * assert nothing. The transport is injected — it is HTTP, and the workers suite
 * drives the real routes.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createChatPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-121 panel suite skipped: ${WEBUI_SKIP_REASON}`)

/** Let the composer's own async load, and the restore that waits on it, settle. */
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

const roles = (panel: { getChat: () => { getMessages: () => unknown[] } | null }) =>
  (panel.getChat()?.getMessages() ?? []).map((m) => (m as { role: string }).role)

const LOST = 'A long message, typed once, about the recursion diagram.'

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
  // THE COMPOSER PERSISTS ITS DRAFT IN `localStorage` BY DEFAULT (`input.js`),
  // keyed by conversation — which is the behaviour the third case below is about,
  // and which would otherwise carry one case's restored text into the next one's
  // supposedly empty composer.
  globalThis.localStorage?.clear()
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-121 the pane returns an interrupted prompt', () => {
  it('test_UAT_FC_BUG-121_an_unrecorded_prompt_comes_back_on_screen_and_in_the_composer', async () => {
    // THE REPORTED INCIDENT, from the operator's chair: they come back to a
    // conversation that ends on an exchange from before the one they lost.
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({
      sessionId: 'site-alpha',
      turns: [
        { role: 'user', markdown: 'Earlier question' },
        { role: 'assistant', markdown: 'Earlier answer' },
      ],
      cursor: 90,
      live: false,
      ready: true,
      interrupted: { text: LOST, at: '2026-09-18T22:24:46.000Z', recorded: false },
    })
    await settle()

    // THEIR WORDS ARE IN THE CONVERSATION, as theirs, after the exchange that
    // preceded them — so the screen accounts for the gap instead of denying it.
    expect(roles(panel)).toEqual(['user', 'assistant', 'user', 'assistant'])
    expect(painted(panel)[2]).toBe(LOST)
    // …and the fourth message is the pane saying what became of the turn. Without
    // it the operator is looking at their own message with no reply and no reason.
    expect(painted(panel)[3]).toContain('interrupted')

    // AND ONE KEYSTROKE FROM RE-SENT. Painting it as history would answer the
    // smaller half of the complaint: what they could not reconstruct was the
    // typing.
    expect(panel.getChat().getInputMarkdown()).toBe(LOST)
  })

  it('test_UAT_FC_BUG-121_a_recorded_prompt_is_not_painted_twice', async () => {
    // The turn's records DID land ([[BUG-46]]'s drain ran), so the prompt and the
    // fragment of a reply are both in the transcript. Appending the prompt again
    // would show the operator their own message twice and imply they had asked
    // twice.
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({
      sessionId: 'site-alpha',
      turns: [
        { role: 'user', markdown: LOST },
        { role: 'assistant', markdown: 'This much was said. ' },
      ],
      cursor: 120,
      live: false,
      ready: true,
      interrupted: { text: LOST, at: '2026-09-18T22:24:46.000Z', recorded: true },
    })
    await settle()

    expect(painted(panel).filter((m) => m === LOST)).toHaveLength(1)
    // What is added is the fact the transcript cannot carry: that the reply above
    // is a fragment rather than a short answer.
    expect(painted(panel).at(-1)).toContain('interrupted')
    // NOTHING GOES IN THE COMPOSER. The words are safe in the conversation, and
    // offering a re-send would invite a duplicate of a question the assistant has
    // already partly answered.
    expect(panel.getChat().getInputMarkdown()).toBe('')
  })

  it('test_UAT_FC_BUG-121_a_draft_already_in_the_composer_is_not_overwritten', async () => {
    // A DRAFT IS NEWER THAN THE LOST MESSAGE. `mountChat` restores its own
    // per-conversation draft, so a restore that wrote unconditionally would hand
    // back the older message by destroying the newer one — turning a rescue into
    // a second loss.
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({ sessionId: 'site-alpha', turns: [], cursor: 0, live: false, ready: true })
    panel.getChat().setInputMarkdown('Something I typed since.')

    // The same conversation, re-handed with the interrupted turn — which is what a
    // second page load produces, because the record is kept until a turn replaces
    // it.
    panel.setSession(
      {
        sessionId: 'site-alpha',
        turns: [],
        cursor: 0,
        live: false,
        ready: true,
        interrupted: { text: LOST, at: '2026-09-18T22:24:46.000Z', recorded: false },
      },
      'site-alpha-again',
    )
    panel.getChat().setInputMarkdown('Something I typed since.')
    await settle()

    expect(panel.getChat().getInputMarkdown()).toBe('Something I typed since.')
    // The message is still on screen to copy from — refusing the composer is not
    // refusing to report the loss.
    expect(painted(panel)).toContain(LOST)
  })

  it('test_UAT_FC_BUG-121_a_conversation_with_no_interrupted_turn_says_nothing', async () => {
    // ABSENT IS THE ORDINARY STATE, and it must cost the pane nothing: every turn
    // finished, so there is no notice, no extra bubble and no composer surprise.
    const panel = createChatPanel({ transport })
    document.body.append(panel.element)
    panel.setSession({
      sessionId: 'site-alpha',
      turns: [{ role: 'user', markdown: 'Earlier question' }],
      cursor: 10,
      live: false,
      ready: true,
    })
    await settle()

    expect(painted(panel)).toEqual(['Earlier question'])
    expect(panel.getChat().getInputMarkdown()).toBe('')
  })
})
