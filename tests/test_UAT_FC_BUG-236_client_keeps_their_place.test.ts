// @vitest-environment jsdom
/**
 * [[BUG-236]] — **the client always knows where they are and what to do next, and
 * nothing takes their place away.** The browser half, and the words the
 * consultant is primed with.
 *
 * THE REAL COMPONENTS: the chat pane (`createChatPanel`) against the installed
 * `webui-chat`, the real attachment tray, and the real plan panel, each with only
 * its origin replaced at the transport it already takes. The stylesheet is the
 * shipped `builder.css`, loaded into the page, so a style assertion reads the rule
 * the browser reads.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { createPlanPanel } from '../apps/control-app/src/builder/plan-panel.js'
import { createComparisons } from '../apps/control-app/src/builder/comparisons.js'
import { createAttachmentTray } from '../apps/control-app/src/builder/attachments.js'
import { CHAT_RESULT_HELD, COMPS_FINISHED, COMPS_FINISHED_SAID, PLAN_DONE, PLAN_SAVED } from '../apps/control-app/src/builder/config.js'
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

let createChatPanel: (opts?: Record<string, unknown>) => Panel

if (!WEBUI_INSTALLED) console.warn(`BUG-236 chat suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 6) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  }
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
  document.head.replaceChildren()
  document.body.replaceChildren()
})

// ── 1. attachments never hide the text box ───────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('BUG-236 — however many files, the text box and Send stay in reach', () => {
  it('test_UAT_FC_BUG-236_twenty_attachments_scroll_inside_two_rows_and_the_box_stays_usable', async () => {
    const style = document.createElement('style')
    style.textContent = readFileSync(path.join(__dirname, '../apps/control-app/src/builder/builder.css'), 'utf8')
    document.head.append(style)
    let n = 0
    const tray = createAttachmentTray({
      upload: async (_file: File, role: string) => ({ uid: `m-${++n}`, label: `IMAGE-${n}`, kind: 'image', role }),
      setRole: async (uid: string, role: string) => ({ uid, role }),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
    })
    const panel = createChatPanel({ storage: memoryStorage(), transport: { streamPrompt: async function* () {} }, attachments: tray })
    document.body.append(panel.element)
    // DROPS ON THE CONVERSATION reach the tray, as the builder wires them.
    tray.watch(panel.element)
    panel.setSession({ sessionId: 'site-alpha', turns: [], ready: true })
    await panel.getChat()!.inputReady

    const files = Array.from({ length: 20 }, (_, i) => new File(['b'], `photo-${i}.jpg`, { type: 'image/jpeg' }))
    const drop = new Event('drop', { bubbles: true, cancelable: true })
    Object.defineProperty(drop, 'dataTransfer', { value: { types: ['Files'], files } })
    panel.element.dispatchEvent(drop)
    await settle(10)

    const chips = panel.element.querySelector<HTMLElement>('.builder-attach__chips')!
    expect(chips.querySelectorAll('.builder-attach__chip')).toHaveLength(20)
    // ABOUT TWO ROWS, AND THE REST SCROLLS INSIDE THE CHIP AREA.
    const shown = getComputedStyle(chips)
    expect(shown.maxHeight).toBe('96px')
    expect(shown.overflowY).toBe('auto')
    expect(shown.display).toBe('flex')
    // THE BOX AND SEND ARE STILL THERE, under the chips, and the box takes focus.
    const bar = panel.element.querySelector<HTMLElement>('.chat-widget-input-bar')!
    expect(chips.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(bar.querySelector('.chat-widget-send-btn')).not.toBeNull()
    const box = bar.querySelector<HTMLElement>('[contenteditable], textarea')!
    box.focus()
    expect(bar.contains(document.activeElement)).toBe(true)
  })
})

// ── 3. the worker's result never lands while the client types ────────────────

/** A consultant that goes to work, and comes back with `result` when released. */
function workingTransport(result: string) {
  let release: () => void = () => {}
  return {
    release: () => release(),
    transport: {
      streamPrompt: async function* () {
        const done = new Promise<void>((resolve) => {
          release = resolve
        })
        yield { kind: 'text', content: 'Building your first draft now — about five minutes.' }
        yield {
          kind: 'progress',
          content: 'The consultant is building your first draft',
          meta: { source: 'model', turn_id: 'worker-1', started_at: new Date().toISOString(), eta_s: 300 },
        }
        await done
        yield { kind: 'text', content: ` ${result}` }
        yield { kind: 'done', meta: { status: 'complete' } }
      },
      interpose: async () => 'msg-1',
      stop: async () => ({ stopping: true }),
    },
  }
}

describe.skipIf(!WEBUI_INSTALLED)("BUG-236 — the worker's hand-back waits for the client's box", () => {
  const RESULT = 'The first draft is ready — have a look at the home page.'
  const said = (panel: Panel) => panel.getChat()!.getMessages().some((m) => m.markdown.includes(RESULT))
  const marker = (panel: Panel) => panel.element.querySelector<HTMLButtonElement>('.builder-chat-held')

  async function working(result = RESULT) {
    const work = workingTransport(result)
    const panel = createChatPanel({ storage: memoryStorage(), transport: work.transport })
    document.body.append(panel.element)
    panel.setSession({ sessionId: 'site-alpha', cursor: 0, live: false, ready: true, turns: [], talker: true })
    const chat = panel.getChat()!
    await chat.inputReady
    chat.setInputMarkdown('Build my site.')
    void chat.submitInput()
    await settle()
    return { work, panel, chat }
  }

  it('test_UAT_FC_BUG-236_a_result_is_held_behind_a_marker_while_the_box_has_text_and_shown_when_it_is_cleared', async () => {
    const { work, panel, chat } = await working()
    chat.setInputMarkdown('It started in my mum’s')
    work.release()
    await settle(8)
    // HELD: not in the conversation, and the marker says something is waiting.
    expect(said(panel)).toBe(false)
    expect(marker(panel)?.hidden).toBe(false)
    expect(marker(panel)?.textContent).toBe(CHAT_RESULT_HELD)

    // The client clears the box: the result appears, and the marker goes.
    chat.setInputMarkdown('')
    await wait(400)
    await settle(8)
    expect(said(panel)).toBe(true)
    expect(marker(panel)?.hidden ?? true).toBe(true)
  })

  it('test_UAT_FC_BUG-236_a_held_result_shows_when_the_client_presses_the_marker', async () => {
    const { work, panel, chat } = await working()
    chat.setInputMarkdown('We also do beards')
    work.release()
    await settle(8)
    expect(said(panel)).toBe(false)
    marker(panel)!.click()
    await wait(400)
    await settle(8)
    expect(said(panel)).toBe(true)
  })

  it('test_UAT_FC_BUG-236_with_an_empty_box_the_result_is_shown_at_once', async () => {
    const { work, panel } = await working()
    work.release()
    await settle(8)
    expect(said(panel)).toBe(true)
    expect(marker(panel)?.hidden ?? true).toBe(true)
  })
})

// ── 5 / 6. the panel says "got it", and a redraw keeps what is typed ─────────

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

/** A plan origin: serves `view`, answers each write with the view as stored. */
function planOrigin(view: Record<string, any>) {
  const answers: Record<string, unknown>[] = []
  const comps: Record<string, unknown>[] = []
  let current = view
  return {
    answers,
    comps,
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
      compAction: async (body: Record<string, any>) => {
        comps.push(body)
        if (body.action === 'finish') current = { ...current, comps_finished: true }
        return current
      },
    },
  }
}

async function panelFor(view: Record<string, any>) {
  const origin = planOrigin(view)
  const panel = createPlanPanel({ transport: origin.transport })
  document.body.append(panel.element)
  await panel.setSite('alpha')
  await settle()
  return { origin, panel }
}

const block = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-ask="${id}"]`)!

describe('BUG-236 — every typed answer has Done, and the panel says it was saved', () => {
  it('test_UAT_FC_BUG-236_a_one_line_answer_saves_with_enter_and_says_saved', async () => {
    const { origin, panel } = await panelFor({ stages: [], asks: [ask('phone', 'phone')], comps: [] })
    const input = block(panel.element, 'phone').querySelector<HTMLInputElement>('.plan-ask__input')!
    expect(block(panel.element, 'phone').querySelector('.plan-ask__done')?.textContent).toBe(PLAN_DONE)
    input.value = '07700 900123'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await settle()
    expect(origin.answers).toEqual([{ site: 'alpha', ask: 'phone', action: 'answer', answer: '07700 900123' }])
    // "SAVED ✓" ON THE ITEM'S LINE, wherever it now sits.
    expect(block(panel.element, 'phone').querySelector('.plan-item__line .plan-item__saved')?.textContent).toBe(PLAN_SAVED)
  })

  it('test_UAT_FC_BUG-236_a_long_answer_is_finished_with_done_and_sent_once', async () => {
    const { origin, panel } = await panelFor({ stages: [], asks: [ask('story', 'long_text')], comps: [] })
    const area = block(panel.element, 'story').querySelector<HTMLTextAreaElement>('textarea')!
    area.value = 'We started in 1998.\nTwo vans now.'
    area.dispatchEvent(new Event('input', { bubbles: true }))
    // Leaving the box (the safety net) and then Done: one answer, not two.
    area.dispatchEvent(new Event('change', { bubbles: true }))
    block(panel.element, 'story').querySelector<HTMLButtonElement>('.plan-ask__done')!.click()
    await settle()
    expect(origin.answers.map((a) => a.answer)).toEqual(['We started in 1998.\nTwo vans now.'])
    expect(block(panel.element, 'story').querySelector('.plan-item__saved')?.textContent).toBe(PLAN_SAVED)
  })

  it('test_UAT_FC_BUG-236_a_redraw_never_discards_text_the_client_is_typing', async () => {
    const { origin, panel } = await panelFor({ stages: [], asks: [ask('phone', 'phone'), ask('towns', 'text')], comps: [] })
    const input = block(panel.element, 'phone').querySelector<HTMLInputElement>('.plan-ask__input')!
    input.value = '07700'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    // ANOTHER PLAN CHANGE REDRAWS THE BLOCK — its reason was reworded while the
    // client had moved on — and the half-typed answer is still in it.
    origin.set({ stages: [], asks: [ask('phone', 'phone', { why: 'Reworded.' }), ask('towns', 'text')], comps: [] })
    await panel.refresh()
    await settle()
    const again = block(panel.element, 'phone').querySelector<HTMLInputElement>('.plan-ask__input')!
    expect(block(panel.element, 'phone').querySelector('.plan-ask__why')?.textContent).toBe('Reworded.')
    expect(again.value).toBe('07700')
    expect(origin.answers).toEqual([])
  })
})

// [[REQ-419]] — the comps moved from the panel to the preview's Comparisons mode;
// what Done and "I've finished commenting" do is unchanged.
describe('BUG-236 — each comparable site has Done, and "I\'ve finished commenting"', () => {
  const COMP = { reference: 'reference-1', title: 'Rival Salon', url: 'https://rival.example', source: 'consultant', likes: [], dislikes: [] }
  const VIEW = { stages: [], asks: [], comps: [COMP], comps_status: 'open', comps_raised: true }

  function comparisonsFor(view: Record<string, any>) {
    const origin = planOrigin(view)
    const comparisons = createComparisons({ transport: origin.transport })
    document.body.append(comparisons.element)
    comparisons.setSite('alpha')
    comparisons.render(view)
    return { origin, element: comparisons.element as HTMLElement }
  }

  it('test_UAT_FC_BUG-236_a_comps_done_saves_both_notes_and_says_saved', async () => {
    const { origin, element } = comparisonsFor(VIEW)
    const comp = element.querySelector<HTMLElement>('.comp-tile')!
    const likes = comp.querySelector<HTMLTextAreaElement>('.comp-tile__likes')!
    const dislikes = comp.querySelector<HTMLTextAreaElement>('.comp-tile__dislikes')!
    likes.value = 'the big photos\nthe booking button'
    dislikes.value = 'the grey text'
    comp.querySelector<HTMLButtonElement>('.comp-tile__done')!.click()
    await settle()
    expect(origin.comps).toEqual([
      { site: 'alpha', action: 'note', reference: 'reference-1', likes: ['the big photos', 'the booking button'], dislikes: ['the grey text'] },
    ])
    expect(element.querySelector('.comp-tile .comp-tile__saved')?.textContent).toBe(PLAN_SAVED)
  })

  it('test_UAT_FC_BUG-236_ive_finished_commenting_tells_the_origin_and_says_it_was_heard', async () => {
    const { origin, element } = comparisonsFor(VIEW)
    const finish = element.querySelector<HTMLButtonElement>('.comparisons__finish')!
    expect(finish.textContent).toBe(COMPS_FINISHED)
    expect(finish.hidden).toBe(false)
    finish.click()
    await settle()
    expect(origin.comps).toEqual([{ site: 'alpha', action: 'finish' }])
    expect(finish.hidden).toBe(true)
    const heard = element.querySelector<HTMLElement>('.comparisons__finished')!
    expect(heard.hidden).toBe(false)
    expect(heard.textContent).toBe(COMPS_FINISHED_SAID)
  })
})

// ── 2 / 3. what the consultant is primed to do ───────────────────────────────

describe('BUG-236 — one thing at a time, and a short hand-back', () => {
  const said = (text: string): string => text.replace(/\s+/g, ' ')
  for (const withCorpus of [true, false]) {
    it(`test_UAT_FC_BUG-236_the_consultant_is_primed_to_pace_one_thing_at_a_time (${withCorpus ? 'with' : 'without'} corpus)`, () => {
      const priming = said(
        (primingConfig(withCorpus).priming as { text?: string }[]).map((e) => (typeof e.text === 'string' ? e.text : '')).join('\n'),
      )
      // Panel questions announced in ONE line in total, never restated.
      expect(priming).toMatch(/Announce the questions you add in one line in total/)
      expect(priming).toMatch(/Never one line per question, never the questions restated/)
      // A message ends on its one real question, and that is the main thing in it.
      expect(priming).toMatch(/A message ends on its one real question, and that question is the main thing in it/)
      expect(priming).toMatch(/when it is a question about their story, little else goes in the message/)
      // What happens next has its own message when this one asks something.
      expect(priming).toMatch(/What happens next goes in its own message, or not at all, when the message also asks something/)
      // The worker's hand-back is short.
      expect(priming).toMatch(/keep the result short: what is ready, where to look, and at most one question — about three lines/)
    })
  }
})
