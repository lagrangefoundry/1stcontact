// @vitest-environment jsdom
/**
 * [[REQ-424]] — **guided focus tasks: the browser half, and the words the
 * consultant is primed with.**
 *
 * THE REAL COMPONENTS: the story board, the questions panel and the comparison
 * board, and the whole builder (`mountBuilder`) against the installed
 * `webui-chat`, each with only its origin replaced at the transport it already
 * takes.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { createStoryBoard } from '../apps/control-app/src/builder/story-board.js'
import { createPlanPanel } from '../apps/control-app/src/builder/plan-panel.js'
import { createComparisons } from '../apps/control-app/src/builder/comparisons.js'
import { FOCUS_PROGRESS, STORY_LATER } from '../apps/control-app/src/builder/config.js'
import { primingConfig } from '../tools/generate/src/cli/ai/roles'

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-424 builder suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 8) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
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
  if (WEBUI_INSTALLED) ({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
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

const INTRO = 'Heart the notes that sound most like you.'
const note = (id: string, text: string, extra: Record<string, unknown> = {}) => ({ id, text, emoji: '💬', theme: 'th1', quote: text, by: 'consultant', ...extra })
const board = (notes: Record<string, unknown>[]) => ({
  themes: [{ id: 'th1', name: 'Beginnings', colour: 0, notes }],
  headline: { state: 'empty', options: [], pick: 0, new_options: [] },
})
const ask = (id: string, status = 'open') => ({ id, prompt: `${id} — question`, why: `Why ${id}.`, input: 'text', needed_by: 'first_pass', blocking: false, status })
const comp = (n: number, extra: Record<string, unknown> = {}) => ({
  reference: `reference-${n}`,
  title: `Shop ${n}`,
  url: `https://shop${n}.test/`,
  source: 'consultant',
  added_at: '2026-10-21T00:00:00.000Z',
  ...extra,
})

/** A view with an open focus task. */
const focused = (kind: string, total: number, pending: string[], extra: Record<string, unknown> = {}) => ({
  focus: { kind, intro: INTRO, started_at: '2026-10-21T00:00:00.000Z', total, closed: total - pending.length, pending },
  focus_later: [],
  focus_finished_at: null,
  ...extra,
})

describe('REQ-424 — the surface shows the task: its line, the progress and Done', () => {
  it('test_UAT_FC_REQ-424_the_story_board_highlights_the_notes_waiting_marks_later_ones_new_and_done_ends_it', async () => {
    const done: Record<string, unknown>[] = []
    const views: unknown[] = []
    const after = { ...focused('story', 2, []), focus: null, focus_finished_at: '2026-10-21T00:05:00.000Z', board: board([note('n1', 'One', { reaction: 'heart' }), note('n2', 'Two'), note('n3', 'Three')]) }
    const story = createStoryBoard({
      transport: {
        boardAction: async () => ({}),
        focusAction: async (body: Record<string, unknown>) => (done.push(body), after),
      },
      onView: (view: unknown) => views.push(view),
    })
    document.body.append(story.element)
    story.setSite('alpha')
    story.render({
      ...focused('story', 2, ['n2'], { focus_later: ['n3'] }),
      board: board([note('n1', 'One', { reaction: 'heart' }), note('n2', 'Two'), note('n3', 'Three')]),
    })

    const banner = story.element.querySelector('.focus-banner') as HTMLElement
    expect(banner.hidden).toBe(false)
    expect(banner.textContent).toContain(INTRO)
    expect(banner.textContent).toContain(FOCUS_PROGRESS.story(1, 2))
    expect(FOCUS_PROGRESS.story(1, 2)).toBe('1 of 2 notes reacted to')
    // THE NOTE WAITING IS OUTLINED; THE ONE FOR A LATER ROUND IS TAGGED NEW.
    const node = (id: string) => story.element.querySelector(`.story-note[data-note="${id}"]`) as HTMLElement
    expect(node('n2').classList.contains('story-note--pending')).toBe(true)
    expect(node('n1').classList.contains('story-note--pending')).toBe(false)
    expect(node('n3').classList.contains('story-note--later')).toBe(true)
    expect(node('n3').dataset.later).toBe(STORY_LATER)

    // DONE ENDS THE WHOLE TASK, and the view it answers is drawn and handed on.
    ;(banner.querySelector('.focus-banner__done') as HTMLButtonElement).click()
    await settle()
    expect(done).toEqual([{ site: 'alpha', action: 'done' }])
    expect(banner.hidden).toBe(true)
    expect(views).toEqual([after])
    expect(node('n2').classList.contains('story-note--pending')).toBe(false)
  })

  it('test_UAT_FC_REQ-424_the_questions_panel_and_the_comparison_board_show_their_own_task_only', async () => {
    const asks = [ask('hours'), ask('area'), ask('phone', 'answered')]
    const panel = createPlanPanel({
      transport: { fetchPlan: async () => ({ stages: [], asks, comps: [], ...focused('questions', 3, ['hours', 'area']) }), answerAsk: async () => ({}) },
      storage: memoryStorage(),
    })
    document.body.append(panel.element)
    await panel.setSite('alpha')
    await settle()
    const qBanner = panel.element.querySelector('.focus-banner') as HTMLElement
    expect(qBanner.hidden).toBe(false)
    expect(qBanner.textContent).toContain('2 of 3 questions left')
    const item = (id: string) => panel.element.querySelector(`[data-ask="${id}"]`)?.closest('.plan-item') ?? panel.element.querySelector(`.plan-item[data-ask="${id}"]`)
    const pending = [...panel.element.querySelectorAll('.plan-item--focus')]
    expect(pending).toHaveLength(2)
    expect(item('phone')?.classList.contains('plan-item--focus') ?? false).toBe(false)

    const comps = createComparisons({ transport: { compAction: async () => ({}) } })
    document.body.append(comps.element)
    comps.setSite('alpha')
    comps.render({ comps: [comp(1), comp(2, { state: 'skipped' })], comps_status: 'open', comps_raised: true, ...focused('comps', 2, ['reference-1']) })
    const cBanner = comps.element.querySelector('.focus-banner') as HTMLElement
    expect(cBanner.hidden).toBe(false)
    expect(cBanner.textContent).toContain('1 of 2 sites left')
    const card = (ref: string) => comps.element.querySelector(`.comp-tile[data-reference="${ref}"]`) as HTMLElement
    expect(card('reference-1').classList.contains('comp-tile--focus')).toBe(true)
    expect(card('reference-2').classList.contains('comp-tile--focus')).toBe(false)

    // A TASK FOR ANOTHER SURFACE IS NOT SHOWN HERE.
    comps.render({ comps: [comp(1)], comps_status: 'open', comps_raised: true, ...focused('story', 2, ['n1']) })
    expect(cBanner.hidden).toBe(true)
    expect(card('reference-1').classList.contains('comp-tile--focus')).toBe(false)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-424 — the builder brings the task in front of the client and resumes the consultant', () => {
  async function builder(view: () => Record<string, unknown>, events: Record<string, unknown>[] = []) {
    const cues: string[] = []
    const plan = {
      fetchPlan: async () => view(),
      answerAsk: async () => view(),
      uploadMaterial: async () => ({ uid: 'material-1' }),
    }
    const chatTransport = {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
      streamPrompt: async function* () {
        for (const e of events) yield e
        yield { kind: 'text', content: 'Have a look at the story board.' }
        yield { kind: 'done' }
      },
      cue: async function* (_id: string, kind: string) {
        cues.push(kind)
        yield { kind: 'text', content: 'You hearted the shipyard.' }
        yield { kind: 'done' }
      },
    }
    const root = document.createElement('div')
    document.body.append(root)
    const app = mountBuilder(root, { sites: [{ site: 'alpha', latest: null }], storage: memoryStorage(), chatTransport, planTransport: plan })
    await settle(12)
    return { app, cues }
  }
  const base = { phase: 'intake', drafted: true, stages: [], asks: [], comps: [], board: board([note('n1', 'One')]), focus: null, focus_later: [], focus_finished_at: null }

  it('test_UAT_FC_REQ-424_starting_a_task_switches_an_idle_client_to_story_and_a_typing_client_keeps_their_place', async () => {
    const show = { kind: 'show_client', content: '', meta: { href: '#show=story', label: 'the story board' } }
    const idle = await builder(() => base, [show])
    expect(idle.app.panel.getMode()).toBe('view')
    const chat = idle.app.chat.getChat()
    chat.setInputMarkdown('Start the build')
    await chat.submitInput()
    await settle(12)
    expect(idle.app.panel.getMode()).toBe('story')

    document.body.replaceChildren()
    const busy = await builder(() => base, [
      { kind: 'text', content: 'One moment.' },
      show,
    ])
    const box = busy.app.chat.getChat()
    box.setInputMarkdown('Start the build')
    const sent = box.submitInput()
    // THE CLIENT IS ALREADY TYPING THEIR NEXT MESSAGE when the switch arrives.
    box.setInputMarkdown('Also, my dad')
    await sent
    await settle(12)
    expect(busy.app.panel.getMode()).toBe('view')
  })

  it('test_UAT_FC_REQ-424_a_finished_task_starts_the_consultants_resuming_turn_once', async () => {
    let current: Record<string, unknown> = { ...base, ...focused('story', 1, ['n1']) }
    const { app, cues } = await builder(() => current)
    // THE FIRST VIEW ONLY LEARNS WHERE IT STANDS.
    expect(cues).toEqual([])
    // The client finishes the task; the panel re-reads when the next turn ends.
    current = { ...base, focus_finished_at: '2026-10-21T00:05:00.000Z' }
    const chat = app.chat.getChat()
    chat.setInputMarkdown('Done hearting.')
    await chat.submitInput()
    // The cue waits for the panel to be free, as BUG-245's does.
    const end = Date.now() + 3_000
    while (cues.length === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 50))
    expect(cues).toEqual(['finished'])
    // A finish already seen is not cued again when the panel re-reads.
    await new Promise((r) => setTimeout(r, 700))
    chat.setInputMarkdown('Anything else?')
    await chat.submitInput()
    await new Promise((r) => setTimeout(r, 700))
    expect(cues).toEqual(['finished'])
  })
})

describe('REQ-424 — the consultant is primed with the cycle', () => {
  for (const withCorpus of [true, false]) {
    it(`test_UAT_FC_REQ-424_priming_describes_gather_focus_resume_and_never_whenever_suits_you (${withCorpus ? 'with' : 'without'} corpus)`, () => {
      const text = (primingConfig(withCorpus).priming as { text?: string }[])
        .map((e) => (typeof e.text === 'string' ? e.text : ''))
        .join('\n')
        .replace(/\s+/g, ' ')
      expect(text).toContain('Walk the client through it: focus tasks')
      expect(text).toContain('Nothing waiting on your client is "whenever suits you"')
      expect(text).toContain('right after you start a build')
      expect(text).toContain('Ask nothing else in it')
      expect(text).toContain('point them back once, gently')
      expect(text).toContain('resume at once, without being asked')
      expect(text).toContain('merge near-duplicates, keep each theme to its strongest few notes')
      // Reactions are asked for in a focus task, not in passing.
      expect(text).toContain('Ask for reactions in a focus task, not in passing')
    })
  }
})
