// @vitest-environment jsdom
/**
 * [[BUG-245]] — **one voice, one thing at a time: the browser half, and the words
 * the consultant is primed with.**
 *
 * THE REAL COMPONENTS: the chat pane (`createChatPanel`) against the installed
 * `webui-chat`, the real comparison board, the real plan panel and the whole
 * builder (`mountBuilder`), each with only its origin replaced at the transport it
 * already takes. The stylesheet is the shipped `builder.css`.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { createComparisons } from '../apps/control-app/src/builder/comparisons.js'
import { createPlanPanel } from '../apps/control-app/src/builder/plan-panel.js'
import {
  CHAT_NEWS_WAITING,
  COMPS_STATE_SKIPPED,
  COMPS_STATE_UNSENT,
  COMPS_UNSKIP,
  PLAN_NEW,
  PLAN_NOT_SAVED,
  PLAN_SAVE,
  PLAN_SAVED,
} from '../apps/control-app/src/builder/config.js'
import { primingConfig } from '../tools/generate/src/cli/ai/roles'

type Chat = {
  element: HTMLElement
  getMessages: () => { role: string; markdown: string }[]
  setInputMarkdown: (md: string) => void
  submitInput: () => Promise<void>
  inputReady: Promise<boolean>
}
type Panel = {
  element: HTMLElement
  setSession: (session: unknown, key?: string) => void
  getChat: () => Chat | null
}
type Handle = Record<string, any>

let createChatPanel: (opts?: Record<string, unknown>) => Panel
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-245 chat suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 8) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createChatPanel } = await import('../apps/control-app/src/builder/chat.js'))
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
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
  document.head.replaceChildren()
  document.body.replaceChildren()
})

// ── 1. the work's news is absorbed into the next reply ───────────────────────

const RESULT = "I've put four Bay Area shops on the comparison board."

/**
 * A consultant that goes to work and comes back with {@link RESULT} when released.
 * `talking` opens a host-cued talker reply that is still being written when the
 * result arrives.
 */
function workingTransport({ talking = false } = {}) {
  let release: () => void = () => {}
  const absorbed: [string, string, string][] = []
  const prompts: string[] = []
  return {
    absorbed,
    prompts,
    release: () => release(),
    transport: {
      streamPrompt: async function* (_id: string, text: string) {
        prompts.push(text)
        if (prompts.length > 1) {
          yield { kind: 'text', content: 'A garage start! Meanwhile, the board is ready.' }
          yield { kind: 'done', meta: { status: 'complete' } }
          return
        }
        const done = new Promise<void>((resolve) => {
          release = resolve
        })
        yield { kind: 'text', content: 'Looking for shops now.' }
        yield {
          kind: 'progress',
          content: 'The consultant is finding shops',
          meta: { source: 'model', turn_id: 'worker-1', started_at: new Date().toISOString() },
        }
        if (talking) yield { kind: 'talker', content: '', meta: { event: 'start', turn_id: 'talk-1', cued: true } }
        await done
        yield { kind: 'text', content: ` ${RESULT}` }
        if (talking) {
          yield { kind: 'talker', content: 'Tell me how it started?', meta: { event: 'text', turn_id: 'talk-1' } }
          yield { kind: 'talker', content: '', meta: { event: 'done', turn_id: 'talk-1', status: 'complete' } }
        }
        yield { kind: 'done', meta: { status: 'complete' } }
      },
      interpose: async () => 'msg-1',
      stop: async () => ({ stopping: true }),
      absorbed: async (sessionId: string, turnId: string, text: string) => {
        absorbed.push([sessionId, turnId, text])
        return { kept: true }
      },
    },
  }
}

describe.skipIf(!WEBUI_INSTALLED)("BUG-245 — the work's news never interrupts", () => {
  const said = (panel: Panel, text = RESULT) => panel.getChat()!.getMessages().some((m) => m.markdown.includes(text))
  const news = (panel: Panel, slot: HTMLElement) =>
    slot.querySelector<HTMLElement>('.builder-chat-news') ?? panel.element.querySelector<HTMLElement>('.builder-chat-news')

  async function working(opts = {}) {
    const work = workingTransport(opts)
    const slot = document.createElement('div')
    document.body.append(slot)
    const panel = createChatPanel({ storage: memoryStorage(), transport: work.transport, statusContainer: slot })
    document.body.append(panel.element)
    panel.setSession({ sessionId: 'site-alpha', cursor: 0, live: false, ready: true, turns: [], talker: true })
    const chat = panel.getChat()!
    await chat.inputReady
    chat.setInputMarkdown('Find me some shops.')
    void chat.submitInput()
    await settle()
    return { work, panel, chat, slot }
  }

  it('test_UAT_FC_BUG-245_with_unsent_text_a_finished_result_posts_no_bubble_and_no_marker_and_waits_quietly', async () => {
    const { work, panel, chat, slot } = await working()
    chat.setInputMarkdown('It started in my mum’s')
    work.release()
    await settle(10)
    // NO BUBBLE, NO MARKER — and the origin is told what was withheld, for which round.
    expect(said(panel)).toBe(false)
    expect(panel.element.querySelector('button.builder-chat-held')).toBeNull()
    expect(work.absorbed).toEqual([['site-alpha', 'worker-1', RESULT]])
    // A QUIET STATE where the status widget was, until the client's next message.
    expect(news(panel, slot)?.hidden).toBe(false)
    expect(news(panel, slot)?.textContent).toBe(CHAT_NEWS_WAITING)
    // Still nothing after the box empties: the news is the next reply's.
    chat.setInputMarkdown('')
    await settle(10)
    expect(said(panel)).toBe(false)

    chat.setInputMarkdown('It started in my mum’s garage.')
    void chat.submitInput()
    await settle(10)
    expect(news(panel, slot)?.hidden).toBe(true)
    expect(said(panel, 'Meanwhile, the board is ready.')).toBe(true)
  })

  it('test_UAT_FC_BUG-245_a_result_arriving_while_a_talker_reply_is_written_is_absorbed', async () => {
    const { work, panel } = await working({ talking: true })
    work.release()
    await settle(10)
    expect(said(panel)).toBe(false)
    expect(work.absorbed.map((a) => a[2])).toEqual([RESULT])
    // The talker's reply is the one voice on screen.
    expect(said(panel, 'Tell me how it started?')).toBe(true)
  })

  it('test_UAT_FC_BUG-245_news_not_yet_told_survives_a_reload_as_the_same_quiet_state', async () => {
    const slot = document.createElement('div')
    document.body.append(slot)
    const panel = createChatPanel({ storage: memoryStorage(), transport: workingTransport().transport, statusContainer: slot })
    document.body.append(panel.element)
    panel.setSession({
      sessionId: 'site-alpha',
      ready: true,
      turns: [{ role: 'user', markdown: 'Find me some shops.' }, { role: 'assistant', markdown: 'Looking for shops now.' }],
      talker: true,
      news: true,
    })
    await panel.getChat()!.inputReady
    expect(slot.querySelector<HTMLElement>('.builder-chat-news')?.hidden).toBe(false)
    expect(panel.getChat()!.getMessages().map((m) => m.markdown)).toEqual(['Find me some shops.', 'Looking for shops now.'])
  })
})

// ── 3 / 4. comp cards: the consultant's why, a note, Send or Skip ────────────

const comp = (n: number, extra: Record<string, unknown> = {}) => ({
  reference: `reference-${n}`,
  title: `Salon ${n}`,
  url: `https://www.salon${n}.test/`,
  source: 'consultant',
  added_at: '2026-10-21T00:00:00.000Z',
  desktop: 'screenshot-1280.png',
  why: `Salon ${n} is the plain end of the range.`,
  ...extra,
})

/** A comp origin: applies each card action the way the route does, answering the view. */
function compOrigin(comps: Record<string, any>[]) {
  let current: Record<string, any> = { comps, comps_status: 'open', comps_raised: true, comps_finished: false, comps_note: 'A range of four.' }
  const calls: Record<string, unknown>[] = []
  const closed = (c: Record<string, any>) => c.state === 'skipped' || (c.state === 'sent' && c.note === c.sent)
  return {
    calls,
    compAction: async (body: Record<string, any>) => {
      calls.push(body)
      const next = current.comps.map((c: Record<string, any>) => {
        if (c.reference !== body.reference) return c
        if (body.action === 'draft') return { ...c, note: body.note }
        if (body.action === 'send') return { ...c, note: body.note, sent: body.note, sent_at: '2026-10-21T15:42:00.000Z', state: 'sent' }
        if (body.action === 'skip_site') return { ...c, state: 'skipped' }
        if (body.action === 'reopen_site') return { ...c, state: undefined }
        return c
      })
      current = { ...current, comps: next, comps_finished: next.every(closed) }
      return current
    },
    view: () => current,
  }
}

function board(comps: Record<string, any>[]) {
  const origin = compOrigin(comps)
  const sent: string[] = []
  let finished = 0
  const comparisons = createComparisons({
    transport: { compAction: origin.compAction },
    onSend: (message: string) => sent.push(message),
    onFinished: () => {
      finished += 1
    },
  })
  document.body.append(comparisons.element)
  comparisons.setSite('alpha')
  comparisons.render(origin.view())
  const card = (n: number) => comparisons.element.querySelector<HTMLElement>(`.comp-tile[data-reference="reference-${n}"]`)!
  return { origin, sent, finished: () => finished, element: comparisons.element as HTMLElement, card }
}

const typeIn = (area: HTMLTextAreaElement, text: string) => {
  area.value = text
  area.dispatchEvent(new Event('input', { bubbles: true }))
}

describe("BUG-245 — each comp is a card with the consultant's why, open or closed", () => {
  it('test_UAT_FC_BUG-245_a_card_shows_why_a_growing_notes_box_and_send_and_skip_and_the_board_its_note', () => {
    const { element, card } = board([comp(1)])
    expect(element.querySelector('.comparisons__note')?.textContent).toBe('A range of four.')
    const one = card(1)
    expect(one.querySelector('.comp-tile__why')?.textContent).toContain('Salon 1 is the plain end of the range.')
    const area = one.querySelector<HTMLTextAreaElement>('textarea.comp-tile__note')!
    expect(area.placeholder).toBe('What do you like? What would you never do?')
    expect(area.rows).toBeGreaterThanOrEqual(3)
    expect(one.querySelector('.comp-tile__send')?.textContent).toBe('Send to the consultant ➤')
    expect(one.querySelector('.comp-tile__skip')?.textContent).toBe('Skip')
    expect(one.querySelector<HTMLAnchorElement>('a.comp-tile__visit')?.textContent).toBe('Open the real site ↗')
    // OPEN AND EMPTY: nothing to send.
    expect(one.dataset.state).toBe('open')
    expect(one.querySelector<HTMLButtonElement>('.comp-tile__send')!.disabled).toBe(true)
  })

  it('test_UAT_FC_BUG-245_typing_is_a_draft_send_posts_the_labelled_note_and_editing_a_sent_note_reopens_it', async () => {
    const { origin, sent, card } = board([comp(1), comp(2)])
    const area = () => card(1).querySelector<HTMLTextAreaElement>('textarea.comp-tile__note')!
    typeIn(area(), 'Love the gates')
    // NOT SENT YET, with its dot — and kept as a draft once the client leaves the box.
    expect(card(1).querySelector('.comp-tile__state')?.textContent).toBe(COMPS_STATE_UNSENT)
    expect(card(1).dataset.unsent).toBe('true')
    area().dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    expect(origin.calls).toEqual([{ site: 'alpha', action: 'draft', reference: 'reference-1', note: 'Love the gates' }])
    expect(sent).toEqual([])

    card(1).querySelector<HTMLButtonElement>('.comp-tile__send')!.click()
    await settle()
    expect(origin.calls.at(-1)).toEqual({ site: 'alpha', action: 'send', reference: 'reference-1', note: 'Love the gates' })
    // THE CLIENT'S OWN MESSAGE, labelled with the site.
    expect(sent).toEqual(['On Salon 1: Love the gates'])
    // SENT: the state, the accent edge, the button dimmed.
    expect(card(1).dataset.state).toBe('sent')
    expect(card(1).querySelector('.comp-tile__state')?.textContent).toMatch(/^Sent ✓ /)
    expect(card(1).querySelector<HTMLButtonElement>('.comp-tile__send')!.disabled).toBe(true)

    // EDITING A SENT NOTE makes it "Not sent yet" again.
    typeIn(area(), 'Love the gates, hate the font')
    expect(card(1).dataset.state).toBe('open')
    expect(card(1).querySelector('.comp-tile__state')?.textContent).toBe(COMPS_STATE_UNSENT)
    expect(card(1).querySelector<HTMLButtonElement>('.comp-tile__send')!.disabled).toBe(false)
  })

  it('test_UAT_FC_BUG-245_skip_mutes_a_card_reopen_unskips_it_and_the_last_skip_finishes_the_board', async () => {
    const { finished, card } = board([comp(1, { state: 'sent', note: 'Nice', sent: 'Nice', sent_at: '2026-10-21T15:00:00.000Z' }), comp(2)])
    card(2).querySelector<HTMLButtonElement>('.comp-tile__skip')!.click()
    await settle()
    expect(card(2).dataset.state).toBe('skipped')
    expect(card(2).querySelector('.comp-tile__state')?.textContent).toBe(COMPS_STATE_SKIPPED)
    expect(card(2).querySelector('.comp-tile__skip')?.textContent).toBe(COMPS_UNSKIP)
    // EVERY CARD SENT OR SKIPPED: the consultant is cued, once.
    expect(finished()).toBe(1)

    card(2).querySelector<HTMLButtonElement>('.comp-tile__skip')!.click()
    await settle()
    expect(card(2).dataset.state).toBe('open')
    expect(finished()).toBe(1)
  })

  it('test_UAT_FC_BUG-245_two_cards_per_row_on_a_wide_board_else_one_sent_edged_skipped_muted', () => {
    const css = readFileSync(path.join(__dirname, '../apps/control-app/src/builder/builder.css'), 'utf8')
    expect(css).toMatch(/@container \(min-width: 720px\) \{\s*\.comparisons__grid \{\s*grid-template-columns: 1fr 1fr;/)
    expect(css).toMatch(/\.comparisons__grid \{\s*display: grid;\s*grid-template-columns: 1fr;/)
    expect(css).toMatch(/\.comp-tile\[data-state='sent'\] \{\s*border-color: var\(--shell-accent/)
    expect(css).toMatch(/\.comp-tile\[data-state='skipped'\] \{\s*opacity: 0\.6;/)
  })
})

// ── 2 / 5. the builder: one line, the board link, a note in the conversation ─

describe.skipIf(!WEBUI_INSTALLED)('BUG-245 — the board in the builder', () => {
  const STAGES = [{ id: 'other_sites', label: 'Looking at other sites', about: 'Sites you like.', state: 'in_progress' }]

  async function builder() {
    const origin = compOrigin([comp(1), comp(2)])
    const prompts: string[] = []
    const plan = {
      fetchPlan: async () => ({ phase: 'intake', drafted: true, stages: STAGES, asks: [], ...origin.view() }),
      answerAsk: async () => origin.view(),
      uploadMaterial: async () => ({ uid: 'material-1' }),
      compAction: origin.compAction,
    }
    const chatTransport = {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
      streamPrompt: async function* (_id: string, text: string) {
        prompts.push(text)
        yield { kind: 'text', content: 'Gates it is.' }
        yield { kind: 'done' }
      },
    }
    const root = document.createElement('div')
    document.body.append(root)
    const app = mountBuilder(root, { sites: [{ site: 'alpha', latest: null }], storage: memoryStorage(), chatTransport, planTransport: plan })
    await settle(12)
    return { app, prompts }
  }

  it('test_UAT_FC_BUG-245_the_board_link_in_the_conversation_opens_comparisons', async () => {
    const { app } = await builder()
    expect(app.panel.getMode()).toBe('view')
    const link = document.createElement('a')
    link.setAttribute('href', '#show=comps')
    app.chat.element.append(link)
    link.click()
    await settle()
    expect(app.panel.getMode()).toBe('comparisons')
  })

  it('test_UAT_FC_BUG-245_a_sent_note_is_the_clients_own_message_and_starts_the_consultants_reply', async () => {
    const { app, prompts } = await builder()
    const card = app.comparisons.element.querySelector('.comp-tile[data-reference="reference-2"]') as HTMLElement
    typeIn(card.querySelector('textarea.comp-tile__note') as HTMLTextAreaElement, 'Too many popups')
    ;(card.querySelector('.comp-tile__send') as HTMLButtonElement).click()
    await settle(12)
    const messages = app.chat.getChat().getMessages()
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', markdown: 'On Salon 2: Too many popups' }),
        expect.objectContaining({ role: 'assistant', markdown: 'Gates it is.' }),
      ]),
    )
    expect(prompts).toEqual(['On Salon 2: Too many popups'])
  })
})

// ── 6 / 7 / 8. the panel: Save states, new questions, the working state ──────

const ask = (id: string, input: string, extra: Record<string, unknown> = {}) => ({
  id,
  prompt: `${id} — question`,
  why: `Why ${id}.`,
  input,
  needed_by: 'first_pass',
  blocking: false,
  status: 'open',
  ...extra,
})

function planOrigin(view: Record<string, any>) {
  const answers: Record<string, unknown>[] = []
  let current = view
  return {
    answers,
    set: (next: Record<string, any>) => {
      current = next
    },
    transport: {
      fetchPlan: async () => current,
      answerAsk: async (body: Record<string, any>) => {
        answers.push(body)
        if (body.action === 'answer') {
          current = {
            ...current,
            asks: current.asks.map((a: Record<string, unknown>) =>
              a.id === body.ask ? { ...a, status: 'answered', answer: body.answer, answered_by: 'client' } : a,
            ),
          }
        }
        return current
      },
    },
  }
}

const block = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-ask="${id}"]`)!

describe('BUG-245 — the panel says what is saved, what is new, and when the consultant works', () => {
  it('test_UAT_FC_BUG-245_a_typed_answer_is_not_saved_yet_until_save_and_then_saved_and_starts_no_turn', async () => {
    const origin = planOrigin({ stages: [], asks: [ask('towns', 'text')], comps: [] })
    const panel = createPlanPanel({ transport: origin.transport })
    document.body.append(panel.element)
    await panel.setSite('alpha')
    await settle()
    const input = block(panel.element, 'towns').querySelector<HTMLInputElement>('.plan-ask__input')!
    const button = block(panel.element, 'towns').querySelector<HTMLButtonElement>('.plan-ask__save')!
    expect(button.textContent).toBe(PLAN_SAVE)
    input.value = 'Oakland, Berkeley'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    const state = block(panel.element, 'towns').querySelector<HTMLElement>('.plan-ask__state')!
    expect(state.textContent).toBe(PLAN_NOT_SAVED)
    expect(state.dataset.unsaved).toBe('true')
    button.click()
    await settle()
    expect(origin.answers).toEqual([{ site: 'alpha', ask: 'towns', action: 'answer', answer: 'Oakland, Berkeley' }])
    expect(block(panel.element, 'towns').querySelector('.plan-item__saved')?.textContent).toBe(PLAN_SAVED)
    // Opened to change, the stored answer reads as saved until it is edited.
    block(panel.element, 'towns').querySelector<HTMLButtonElement>('.plan-ask__change')!.click()
    await settle()
    expect(block(panel.element, 'towns').querySelector('.plan-ask__state')?.textContent).toBe(PLAN_SAVED)
  })

  it('test_UAT_FC_BUG-245_new_questions_raise_a_badge_and_a_highlight_until_opened', async () => {
    const storage = memoryStorage()
    const origin = planOrigin({ stages: [], asks: [ask('phone', 'phone')], comps: [] })
    const panel = createPlanPanel({ transport: origin.transport, storage })
    document.body.append(panel.element)
    await panel.setSite('alpha')
    await settle()
    // What was on the panel the first time it was seen is not new.
    const heading = panel.element.querySelector<HTMLElement>('.plan-panel__heading')!
    const badge = () => heading.dataset.new
    expect(badge()).toBeUndefined()
    expect(block(panel.element, 'phone').classList.contains('plan-item--new')).toBe(false)

    origin.set({ stages: [], asks: [ask('phone', 'phone'), ask('towns', 'text'), ask('hours', 'text')], comps: [] })
    await panel.refresh()
    await settle()
    expect(badge()).toBe(PLAN_NEW(2))
    // DRAWN BESIDE THE HEADING by the stylesheet, from the attribute.
    const css = readFileSync(path.join(__dirname, '../apps/control-app/src/builder/builder.css'), 'utf8')
    expect(css).toMatch(/\.plan-panel__heading\[data-new\]::after \{\s*content: attr\(data-new\);/)
    expect(block(panel.element, 'towns').classList.contains('plan-item--new')).toBe(true)

    // OPENED — touched — it is no longer new, and that is remembered.
    block(panel.element, 'towns').dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(block(panel.element, 'towns').classList.contains('plan-item--new')).toBe(false)
    expect(badge()).toBe(PLAN_NEW(1))
    await panel.refresh()
    await settle()
    expect(block(panel.element, 'towns').classList.contains('plan-item--new')).toBe(false)
    expect(block(panel.element, 'hours').classList.contains('plan-item--new')).toBe(true)
  })

  it('test_UAT_FC_BUG-245_the_panel_shows_the_working_state_in_progress_blue_while_a_round_runs_and_clears_after', async () => {
    const panel = createPlanPanel({ transport: planOrigin({ stages: [], asks: [], comps: [] }).transport })
    document.body.append(panel.element)
    panel.setBusy(true)
    expect(panel.element.classList.contains('plan-panel--working')).toBe(true)
    expect(panel.element.getAttribute('aria-busy')).toBe('true')
    expect(panel.element.querySelector<HTMLElement>('.plan-panel__working')?.hidden).toBe(false)
    panel.setBusy(false)
    expect(panel.element.classList.contains('plan-panel--working')).toBe(false)
    expect(panel.element.querySelector<HTMLElement>('.plan-panel__working')?.hidden).toBe(true)
    // THE PROGRESS BANNER'S IN-PROGRESS BLUE, animated — and still under reduced motion.
    const css = readFileSync(path.join(__dirname, '../apps/control-app/src/builder/builder.css'), 'utf8')
    expect(css).toMatch(/\.plan-stage\[data-state='in_progress'\] \{[^}]*#2563eb/)
    expect(css).toMatch(/\.plan-panel--working \{\s*box-shadow: inset 0 0 0 2px #2563eb;/)
    expect(css).toMatch(/\.plan-panel--working \.plan-stages \{[^}]*animation: plan-panel-working/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.plan-panel--working \.plan-stages \{\s*animation: none;/)
  })
})

// ── what the consultant is primed to do ──────────────────────────────────────

describe('BUG-245 — one voice, one thing at a time, in the priming', () => {
  const said = (text: string): string => text.replace(/\s+/g, ' ')
  for (const withCorpus of [true, false]) {
    it(`test_UAT_FC_BUG-245_the_consultant_is_primed_for_one_voice_and_the_comp_cards (${withCorpus ? 'with' : 'without'} corpus)`, () => {
      const priming = said(
        (primingConfig(withCorpus).priming as { text?: string }[]).map((e) => (typeof e.text === 'string' ? e.text : '')).join('\n'),
      )
      // News of the work is absorbed into the next reply, after answering the client.
      expect(priming).toMatch(/You and the work are one voice, and one thing happens at a time/)
      expect(priming).toMatch(/answer what they said first, then give them the news in a line or two/)
      expect(priming).toMatch(/never puts a second question on top of one you have already asked them/)
      // New panel questions: one line inside the next reply.
      expect(priming).toMatch(/the line goes inside your next reply, after you have answered what they said/)
      // Comps: one line with the board link; cards carry the why; a note gets a short reply.
      expect(priming).toMatch(/say so in ONE line with the board's link/)
      expect(priming).toMatch(/\(#show=comps\)/)
      expect(priming).toMatch(/No pictures, site links or descriptions in the chat/)
      expect(priming).toMatch(/Reply in two or three sentences at most/)
      expect(priming).toMatch(/you sum up without being asked/)
      expect(priming).not.toMatch(/Show each tile in your reply/)
    })
  }
})
