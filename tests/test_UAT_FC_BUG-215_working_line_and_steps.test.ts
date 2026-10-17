// @vitest-environment jsdom
/**
 * [[BUG-215]] — **the working line separates the turn from the step, and no
 * plumbing reaches the client.**
 *
 * The turn line keeps the opening announcement against the turn's clock; the
 * step line beneath it shows the step under way against the step's own clock.
 * Slow-operation notices are light step lines in the conversation, repeats
 * collapsed; the build heartbeat shows nothing.
 *
 * Mounted against the ACTUALLY-INSTALLED `webui-chat`, as REQ-390's panel suite
 * is; the transport and the clock are injected.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Chat = { send(text: string): Promise<void>; getMessages(): { role: string; markdown: string }[] }
type Panel = { element: HTMLElement; setSession(session: Record<string, unknown>): void; getChat(): Chat }

let createChatPanel: (opts?: Record<string, unknown>) => Panel
let classes: Record<string, string>

if (!WEBUI_INSTALLED) console.warn(`BUG-215 panel suite skipped: ${WEBUI_SKIP_REASON}`)

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    const chat = await import('../apps/control-app/src/builder/chat.js')
    createChatPanel = chat.createChatPanel as never
    classes = {
      line: chat.WORKING_LINE_CLASS,
      turn: chat.WORKING_TURN_CLASS,
      step: chat.WORKING_STEP_CLASS,
      logged: chat.STEP_LINE_CLASS,
    }
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

beforeEach(() => {
  document.body.replaceChildren()
  globalThis.localStorage?.clear()
})

let clock = 0
let tick: () => void = () => {}

function mount(streamPrompt: () => AsyncGenerator<unknown>): Panel {
  clock = 1_000_000
  const panel = createChatPanel({
    transport: { streamPrompt },
    now: () => clock,
    every: (fn: () => void) => {
      tick = fn
      return () => {}
    },
  })
  document.body.append(panel.element)
  panel.setSession({ sessionId: 'site-bob', turns: [], ready: true })
  return panel
}

const text = (cls: string): string | null => document.querySelector(`.${cls}`)?.textContent ?? null

const OPENING = 'Your consultant is building the first draft of Bob’s Salon’s home page — about 15 minutes'

describe.skipIf(!WEBUI_INSTALLED)('BUG-215 — the turn and the step, each on its own clock', () => {
  it('test_UAT_FC_BUG-215_the_turn_line_keeps_the_opening_estimate_and_the_step_line_times_the_step', async () => {
    const seen: { turn: string | null; step: string | null }[] = []
    const look = () => {
      tick()
      seen.push({ turn: text(classes.turn), step: text(classes.step) })
    }
    const panel = mount(async function* () {
      yield { kind: 'working', content: OPENING, meta: { scope: 'turn', doing: 'Building the first draft' } }
      clock += 14 * 60_000
      yield {
        kind: 'working',
        content: 'Your consultant is taking a screenshot',
        meta: { scope: 'step', doing: 'Taking a screenshot', estimate: 'about 1 min' },
      }
      clock += 2 * 60_000 + 34_000
      look()
      yield { kind: 'done' }
    })

    await panel.getChat().send('Build my home page.')

    // THE TURN: its own announcement and the turn's clock — never the step's estimate.
    expect(seen[0].turn).toBe(`${OPENING} · 16:34 so far`)
    expect(seen[0].turn).not.toContain('about 1 min')
    // THE STEP: its own estimate beside its own clock.
    expect(seen[0].step).toBe('now: taking a screenshot · about 1 min · 2:34')
    // AND GONE WHEN THE TURN ENDS.
    expect(document.querySelector(`.${classes.line}`)).toBeNull()
  })

  it('test_UAT_FC_BUG-215_with_no_announcement_the_turn_line_reads_working', async () => {
    let turn: string | null = null
    const panel = mount(async function* () {
      clock += 42_000
      tick()
      turn = text(classes.turn)
      yield { kind: 'done' }
    })
    await panel.getChat().send('Hi.')
    expect(turn).toBe('Working · 0:42 so far')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-215 — no plumbing, and steps that do not crowd the chat', () => {
  it('test_UAT_FC_BUG-215_a_delegation_heartbeat_shows_the_client_nothing', async () => {
    let during = ''
    const panel = mount(async function* () {
      yield {
        kind: 'progress',
        content:
          'still working, elapsed 5 min — builder worker-builder-3-3br9qs on home.json, home.json#footer since 22:19 UTC',
        meta: { elapsed_s: 300 },
      }
      during = document.body.textContent ?? ''
      yield { kind: 'text', content: 'The draft is ready.' }
      yield { kind: 'done' }
    })
    await panel.getChat().send('Build it.')

    for (const shown of [during, document.body.textContent ?? '']) {
      expect(shown).not.toMatch(/worker-|\.json|#|UTC|still working/)
    }
    const said = panel.getChat().getMessages().map((m) => m.markdown).join('')
    expect(said).not.toContain('still working')
  })

  it('test_UAT_FC_BUG-215_repeated_screenshots_collapse_into_one_light_step_line', async () => {
    const shot = {
      kind: 'working',
      content: 'Your consultant is taking a screenshot',
      meta: { scope: 'step', doing: 'Taking a screenshot', estimate: 'about 1 min' },
    }
    const panel = mount(async function* () {
      yield { kind: 'text', content: "I'm fixing that now. It will take about 5 minutes." }
      yield shot
      yield shot
      yield shot
      yield { kind: 'done' }
    })
    await panel.getChat().send('The photo looks wrong on my phone.')

    const steps = [...document.querySelectorAll(`.${classes.logged}`)]
    expect(steps.map((s) => s.textContent)).toEqual(['Taking a screenshot ×3'])
    // LIGHTER THAN A MESSAGE: not a chat message element, and not the assistant's words.
    expect(steps[0].classList.contains('chat-message')).toBe(false)
    const said = panel.getChat().getMessages().filter((m) => m.role === 'assistant').map((m) => m.markdown).join('')
    expect(said).not.toContain('screenshot')
    // THE CONSULTANT'S OWN ANNOUNCEMENT STAYS A MESSAGE.
    expect(said).toContain("I'm fixing that now. It will take about 5 minutes.")
  })
})
