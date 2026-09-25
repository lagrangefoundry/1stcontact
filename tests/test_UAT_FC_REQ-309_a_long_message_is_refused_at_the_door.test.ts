// @vitest-environment jsdom
/**
 * REQ-309 — **a message too long to store is refused at the front door**.
 *
 * THE QUESTION THIS ANSWERS. lagrange-framework REQ-176 makes an archived artifact
 * segment, so no conversation can outgrow D1 by growing. What it cannot absorb is a
 * SINGLE turn larger than the whole ceiling: no packing can place it, and shrinking
 * it would mean discarding content. REQ-176 left that case to this host, and the
 * answer is that a client never gets to make one.
 *
 * WHY A REFUSAL IS THE RIGHT ANSWER RATHER THAN A LARGER LIMIT. There is no reason to
 * put a long document in a chat message. The builder already takes documents — the
 * **Background information** drop area, and a drop into the conversation itself —
 * and material arriving that way is better off in every respect: it is described, it
 * is labelled, it stays in the Library to be reused, and it is indexed into the
 * client's knowledge base so a later session can retrieve it. Pasted text lives in
 * one transcript and nowhere else. So a false refusal costs the client one
 * drag-and-drop; a false accept loses the knowledge-base entry permanently, and that
 * asymmetry is what sets the figure.
 *
 * TWO ENFORCEMENT POINTS, AND THEY ARE NOT REDUNDANT. The composer refuses **before
 * it clears the box**, so the client sees the sentence with their own text still in
 * front of them and no bubbles are painted at all; the route refuses whatever the
 * client is, so the bound is a property of the surface rather than of one client's
 * good behaviour. *The route's answer is the contract; the composer's is the
 * courtesy.* Both halves are driven here, and so is the one thing that makes them one
 * bound rather than two — the figure and the sentence being identical on each side.
 *
 * THE COMPOSER HALF IS MOUNTED AGAINST THE ACTUALLY-INSTALLED `webui-chat`, like
 * every other panel suite here: the affordance under test is the component's own
 * `maxSubmissionChars`, and a stand-in would assert that this file passed an option
 * to itself.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_PROMPT_CHARS,
  OVER_LONG_PROMPT_MESSAGE,
  route,
  type RouterEnv,
} from '../apps/control-app/src/router'
import {
  CHAT_MAX_SUBMISSION_CHARS,
  CHAT_OVER_LONG_MESSAGE,
  UPLOAD_AREAS,
} from '../apps/control-app/src/builder/config.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const ORIGIN = 'https://app.test'

/** One character over, which is the only interesting side of a boundary. */
const TOO_LONG = 'p'.repeat(MAX_PROMPT_CHARS + 1)
/** Exactly at it. A bound that refused this would be off by one. */
const AT_THE_LIMIT = 'q'.repeat(MAX_PROMPT_CHARS)

// -- the contract: the route ---------------------------------------------------

/**
 * The prompt route, with no AI environment at all.
 *
 * THE ABSENCE IS THE ASSERTION. The refusal is made before the host is built, before
 * the ledger is opened and before any turn exists, so this route can answer it with
 * no API key, no knowledge base and no D1 — and a refusal that needed any of them
 * would be a refusal made after the turn had started.
 */
function bareEnv(): RouterEnv {
  return {} as RouterEnv
}

async function prompt(text: unknown): Promise<{ status: number; body: { error?: string } }> {
  const res = await route(
    new Request(`${ORIGIN}/api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: 'site-req309', text }),
    }),
    bareEnv(),
    { businessId: 'tenant-req309' },
    {},
  )
  return { status: res.status, body: (await res.json()) as { error?: string } }
}

describe('REQ-309 the route refuses an over-long message', () => {
  it('test_UAT_FC_REQ-309_the_route_refuses_and_names_what_to_do_instead', async () => {
    const refused = await prompt(TOO_LONG)

    // BESIDE `text is required`, IN THE SAME SHAPE. 400 and an `error` sentence is
    // what every other body-validation refusal on this surface answers, and a second
    // convention for one check would be a distinction no caller acts on.
    expect(refused.status).toBe(400)

    // THE SENTENCE NAMES THE GESTURE. A refusal that only stated the fact would leave
    // the client with a paste they cannot send and no route for the material, which
    // reads as the product being broken rather than as it having a better door.
    expect(refused.body.error).toBe(OVER_LONG_PROMPT_MESSAGE)
    expect(refused.body.error).toMatch(/Background information/)
    expect(refused.body.error).toMatch(/Library/)

    // AND IT STATES NO NUMBER. A figure invites bargaining and counting — trimming to
    // fit, splitting in two, asking why — and what the client needs is the gesture
    // that works, not the threshold they failed.
    expect(refused.body.error).not.toMatch(/[0-9]/)
  })

  it('test_UAT_FC_REQ-309_the_route_accepts_a_message_at_the_limit', async () => {
    // A BOUND REFUSES WHAT IS OVER IT AND NOTHING ELSE. With no AI environment this
    // cannot reach a model — what matters is that it is not refused for LENGTH, so
    // the assertion is on the sentence and not on the status.
    const accepted = await prompt(AT_THE_LIMIT)
    expect(accepted.body.error ?? '').not.toBe(OVER_LONG_PROMPT_MESSAGE)
  })

  it('test_UAT_FC_REQ-309_a_missing_text_is_still_the_older_refusal', async () => {
    // THE CHECK ADDED BESIDE THE EXISTING ONE DID NOT REPLACE IT. `text is required`
    // and "too long" are different facts about a request, and a caller that gets the
    // wrong one is being told to fix the wrong thing.
    const missing = await prompt(undefined)
    expect(missing.status).toBe(400)
    expect(missing.body.error).toBe('text is required')
  })
})

// -- the courtesy: the composer ------------------------------------------------

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

if (!WEBUI_INSTALLED) console.warn(`REQ-309 composer suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** Every submission the transport was asked to run. Must stay empty on a refusal. */
let sent: string[]

const recordingTransport = {
  streamPrompt: async function* (_sessionId: string, text: string) {
    sent.push(text)
    yield { kind: 'text', content: 'ok' }
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

let storage: Storage

beforeEach(() => {
  document.body.replaceChildren()
  sent = []
  const map = new Map<string, string>()
  storage = {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  } as unknown as Storage
})

function open(): Panel {
  const panel = createChatPanel({ storage, transport: recordingTransport })
  document.body.append(panel.element)
  panel.setSession({ sessionId: 'site-req309', cursor: 0, live: false, ready: true, turns: [] })
  return panel
}

async function type(panel: Panel, text: string) {
  const chat = panel.getChat()
  if (!chat) throw new Error('the pane has no conversation')
  await chat.inputReady
  chat.setInputMarkdown(text)
  await chat.submitInput()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-309 the composer refuses before it clears the box', () => {
  it('test_UAT_FC_REQ-309_the_text_stays_in_the_box_and_no_turn_opens', async () => {
    const panel = open()
    await type(panel, TOO_LONG)

    // THE WHOLE POINT OF ENFORCING IT HERE. `webui-chat` clears the composer BEFORE
    // the submit handler runs, deliberately — *"the text has been accepted by the
    // session the moment it is submitted"* — so any refusal made later than this
    // arrives after the draft is gone. The client keeps their words, in front of them.
    expect(panel.getChat()?.getInputMarkdown()).toBe(TOO_LONG)

    // NOT A TRUNCATION AND NOT A FAILED TURN. Nothing was sent, so nothing is
    // archived, no bubble is painted and there is no turn for `onTurnLost` to chase.
    expect(sent).toEqual([])
    expect(panel.getChat()?.getMessages() ?? []).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-309_the_client_is_told_why_beside_the_composer', async () => {
    const panel = open()
    await type(panel, TOO_LONG)

    // THE SENTENCE IS SHOWN, AND NOT IN THE TRANSCRIPT — nothing was submitted, so a
    // message in the conversation would be a record of something that did not happen.
    const notice = panel.element.textContent ?? ''
    expect(notice).toContain('too long to send as a message')
    expect(notice).toContain('Background information')

    // IT IS THE ROUTE'S SENTENCE, WORD FOR WORD. Two sentences would be two things to
    // keep in step, and the client can reach either enforcement point.
    expect(notice).toContain(OVER_LONG_PROMPT_MESSAGE)
  })

  it('test_UAT_FC_REQ-309_a_message_at_the_limit_is_sent_normally', async () => {
    const panel = open()
    await type(panel, AT_THE_LIMIT)

    // THE BOUND IS A BOUND AND NOT A DISCOURAGEMENT. Five pages goes through; the
    // refusal is for what is past that, and the composer empties as it always did.
    expect(sent).toEqual([AT_THE_LIMIT])
    expect(panel.getChat()?.getInputMarkdown()).toBe('')
  })
})

// -- one bound, not two -------------------------------------------------------

describe('REQ-309 the two enforcement points share one figure and one sentence', () => {
  it('test_UAT_FC_REQ-309_the_browser_and_the_worker_agree_on_the_bound', () => {
    // HELD EQUAL BY A TEST RATHER THAN BY AN IMPORT, because `builder/config.js` is
    // browser JavaScript and cannot import the Worker's TypeScript — the arrangement
    // {@link SIGN_OUT_HREF} and `BUSINESS_SESSION_SCOPE` already live under, and
    // asserted here in exactly the shape REQ-204's suite asserts that pair.
    expect(CHAT_MAX_SUBMISSION_CHARS).toBe(MAX_PROMPT_CHARS)

    // AND THE SENTENCE, for the same reason: a client refused at the composer and a
    // caller refused at the route are being told the same thing, or the product has two
    // opinions about what to do instead.
    expect(CHAT_OVER_LONG_MESSAGE).toBe(OVER_LONG_PROMPT_MESSAGE)
  })

  it('test_UAT_FC_REQ-309_the_sentence_names_a_drop_area_that_exists', () => {
    // THE ONE WAY THIS SENTENCE CAN GO WRONG WITHOUT ANYTHING FAILING. It works by
    // sending the client somewhere better, and it names that somewhere by its label.
    // Rename the drop area and the refusal points at a thing that is not on the
    // screen — a client told to use a control that does not exist is worse off than
    // one told only that their message was too long.
    const background = (
      UPLOAD_AREAS as { id: string; label: string; hint: string }[]
    ).find((area) => area.id === 'reference')
    expect(background).toBeDefined()
    expect(OVER_LONG_PROMPT_MESSAGE).toContain(background!.label)

    // AND THE PROMISE THE SENTENCE MAKES IS THE ONE THAT AREA MAKES. "I'll read it
    // from there" is the drop area's own hint restated to a client who has just been
    // refused, so the two must still be describing the same behaviour.
    expect(background!.hint).toMatch(/understand your business/)
  })

  it('test_UAT_FC_REQ-309_the_figure_is_a_product_judgement_not_a_storage_guard', () => {
    // CONFIRMED BY THE OPERATOR AT 16,000 on calibration measured against real content
    // in this repository: a pasted line averages about 50 characters, so this is about
    // 320 lines, roughly 2,700 words, five pages. A long, careful message is about a
    // thousand characters; a brand-guidelines document is thirty thousand and up. A
    // 500-line paste is refused deliberately — eight pages is a document by any reading.
    expect(MAX_PROMPT_CHARS).toBe(16_000)

    // AND IT IS NOT THE STORE'S CEILING WEARING A DISGUISE. Once the transcript
    // segments, the substrate no longer sets this; the limit is the point past which a
    // message has stopped being a message, which is why the figure is nowhere near
    // D1's 2,000,000 bytes and does not move when that does.
    expect(MAX_PROMPT_CHARS).toBeLessThan(100_000)
  })
})
