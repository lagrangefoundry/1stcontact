// @vitest-environment jsdom
/**
 * [[REQ-417]] — **what a client sees when a new business opens**: the story
 * board's empty message in the middle of the board, the headline slot's clearer
 * wording with its shadow text centred, and ghost text in the question panel
 * until the first question arrives.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components
 * with the builder's stylesheets loaded, as REQ-408's and REQ-401's suites do; the
 * origin is replaced at the plan transport the builder already takes.
 *
 * CENTRING IS LAYOUT, and jsdom lays nothing out, so that claim is measured in a
 * real Chromium: the board jsdom drew is handed to the browser as markup, under
 * the source `builder.css`, in a pane of the size the builder gives it. A
 * missing browser reports loudly rather than passing.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { launchAnyChromium, loadChromium } from './support/chromium'
import { cssRules } from './support/css-rules'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-417 suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'alpha', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

const STAGES = [{ id: 'getting_to_know_you', label: 'Getting to know you', about: '', state: 'in_progress' }]
const NO_HEADLINE = { state: 'empty', options: [], pick: 0, new_options: [] }
const EMPTY_BOARD = { themes: [], headline: NO_HEADLINE }
const PINNED_BOARD = {
  themes: [
    {
      id: 'th1',
      name: 'Family',
      colour: 0,
      notes: [{ id: 'n1', text: 'Three generations cut hair here', emoji: '👪', theme: 'th1', quote: 'My gran opened it.', by: 'consultant' }],
    },
  ],
  headline: NO_HEADLINE,
}
const ask = (id: string, status = 'open') => ({
  id,
  prompt: `${id} for the site`,
  why: `Why ${id} matters.`,
  input: 'text',
  needed_by: 'first_pass',
  blocking: false,
  status,
  ...(status === 'answered' ? { answer: 'yes', answered_by: 'client' } : {}),
})
const view = (extra: Record<string, unknown> = {}) => ({
  stages: STAGES,
  asks: [],
  comps: [],
  comps_status: 'open',
  comps_raised: false,
  board: EMPTY_BOARD,
  drafted: false,
  ...extra,
})

function planTransport(initial: Record<string, any>) {
  let current = initial
  return {
    set: (next: Record<string, any>) => {
      current = next
    },
    fetchPlan: async () => current,
    answerAsk: async () => current,
    compAction: async () => current,
    boardAction: async () => current,
    uploadMaterial: async () => ({ uid: 'material-1' }),
  }
}

const chatTransport = {
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [{ role: 'assistant', markdown: 'Hello.' }], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

const sheet = (file: string) => readFileSync(file, 'utf8')
const BUILDER_CSS = sheet(path.resolve(__dirname, '../apps/control-app/src/builder/builder.css'))
const CSS = WEBUI_INSTALLED
  ? [
      sheet(path.join(webuiPackageDir('webui-shell'), 'src/shell.css')),
      sheet(path.join(webuiPackageDir('webui-chat'), 'src/chat.css')),
      BUILDER_CSS,
    ]
  : []

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
  for (const css of CSS) {
    const style = document.createElement('style')
    style.textContent = css
    document.head.append(style)
  }
})

async function mount(plan: ReturnType<typeof planTransport>): Promise<Handle> {
  const root = document.createElement('div')
  document.body.append(root)
  const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport, planTransport: plan })
  await settle()
  return app
}

const board = (app: Handle): HTMLElement => app.storyBoard.element
const emptyMessage = (app: Handle) => board(app).querySelector('.story-board__empty') as HTMLElement
const panel = (app: Handle): HTMLElement => app.planPanel.element
const ghost = (app: Handle) => panel(app).querySelector('.plan-panel__ghost') as HTMLElement | null
const headings = (app: Handle) =>
  [...panel(app).querySelectorAll<HTMLElement>('.plan-panel__heading')].filter((h) => !h.hidden).map((h) => h.textContent)

/** Loud skip. A silently-skipped measurement is indistinguishable from a pass. */
function skip(why: string): void {
  console.warn(`REQ-417 centring measurement SKIPPED — ${why}. The layout is unverified here.`)
}

/**
 * Lay `markup` out in a real Chromium, under the source `builder.css`, inside the
 * pane the builder mounts it in at `width`×`height`, and run `measure` there.
 * `undefined` means no browser could be started, already reported loudly.
 */
async function measureIn<T>(markup: string, width: number, height: number, measure: () => T): Promise<T | undefined> {
  const chromium = await loadChromium()
  if (!chromium) return skip('playwright is not resolvable from tools/generate')
  const browser = await launchAnyChromium(chromium)
  if (!browser) return skip('no chromium build or system Chrome could be launched')
  try {
    const page = await browser.newPage({ viewport: { width: width + 200, height: height + 100 } })
    await page.setContent(
      `<!doctype html><html><head><style>${BUILDER_CSS}</style></head>` +
        `<body style="margin:0"><div class="builder-panel__host" style="width:${width}px;height:${height}px">${markup}</div></body></html>`,
    )
    return (await page.evaluate(measure)) as T
  } finally {
    await browser.close()
  }
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-417 — the opening experience', () => {
  it('test_UAT_FC_REQ-417_the_empty_board_says_what_it_is_for_until_the_first_pin', async () => {
    const plan = planTransport(view())
    const app = await mount(plan)
    expect(emptyMessage(app).hidden).toBe(false)
    expect(emptyMessage(app).textContent).toBe(
      "As we talk, I'll pin the things you say about your business here. Heart the ones that are most you.",
    )
    plan.set(view({ board: PINNED_BOARD }))
    await app.planPanel.refresh()
    await settle()
    expect(emptyMessage(app).hidden).toBe(true)
  })

  it('test_UAT_FC_REQ-417_the_empty_headline_slot_reads_your_headline_statement_why_choose_your_business', async () => {
    const app = await mount(planTransport(view()))
    const slot = board(app).querySelector('.story-headline') as HTMLElement
    const line = slot.querySelector('.story-headline__line') as HTMLTextAreaElement
    expect(slot.dataset.state).toBe('empty')
    expect(slot.querySelector('.story-headline__label')!.textContent).toBe('Your headline statement:')
    expect(line.placeholder).toBe('Why choose your business?')
    expect(line.getAttribute('aria-label')).toBe('Your headline statement:')
    // ONLY THE EMPTY STATE IS CENTRED: the rule keys on the placeholder showing,
    // so an offer, a choice or the client's own words keep the board's own style.
    const centred = cssRules(BUILDER_CSS).filter((r) => /text-align:\s*center/.test(r.body)).map((r) => r.selector)
    expect(centred).toContain('.story-headline__line:placeholder-shown')
    expect(centred).not.toContain('.story-headline__line')
  })

  it('test_UAT_FC_REQ-417_the_question_panel_shows_ghost_text_until_the_first_question', async () => {
    const plan = planTransport(view())
    const app = await mount(plan)
    expect(ghost(app)).not.toBeNull()
    expect(ghost(app)!.hidden).toBe(false)
    expect(ghost(app)!.textContent).toBe("We'll put questions here for you to answer")
    expect(headings(app)).toEqual([])
    // NOT A QUESTION AND NOT A BUTTON: plain text in the panel's own type.
    expect(ghost(app)!.closest('[data-ask], button')).toBeNull()
    const rule = cssRules(BUILDER_CSS).find((r) => r.selector === '.plan-panel__ghost')
    expect(rule, 'the ghost text has no rule of its own').toBeTruthy()
    expect(rule!.body).not.toMatch(/\b(font|font-size|font-family|border|background|cursor)\s*:/)

    plan.set(view({ asks: [ask('a1')] }))
    await app.planPanel.refresh()
    await settle()
    expect(ghost(app)!.hidden).toBe(true)
    expect(headings(app)).toEqual(['Open questions'])

    // ONCE QUESTIONS EXIST IT DOES NOT RETURN, even with none left open.
    plan.set(view({ asks: [ask('a1', 'answered')] }))
    await app.planPanel.refresh()
    await settle()
    expect(ghost(app)!.hidden).toBe(true)
  })

  it(
    'test_UAT_FC_REQ-417_the_empty_message_is_centred_both_ways_under_the_headline',
    async () => {
      const app = await mount(planTransport(view()))
      const m = await measureIn(board(app).outerHTML, 900, 700, () => {
        const box = (s: string) => document.querySelector(s)!.getBoundingClientRect()
        const b = box('.story-board')
        const style = getComputedStyle(document.querySelector('.story-board')!)
        const h = box('.story-headline')
        const e = box('.story-board__empty')
        return {
          board: { left: b.left + parseFloat(style.paddingLeft), right: b.right - parseFloat(style.paddingRight), bottom: b.bottom - parseFloat(style.paddingBottom) },
          headline: { width: h.width, bottom: h.bottom + parseFloat(getComputedStyle(document.querySelector('.story-headline')!).marginBottom) },
          empty: { left: e.left, right: e.right, top: e.top, bottom: e.bottom },
          placeholderAlign: getComputedStyle(document.querySelector('.story-headline__line')!).textAlign,
        }
      })
      if (!m) return
        // HORIZONTALLY: equal space either side within the board.
        expect(Math.abs(m.empty.left - m.board.left - (m.board.right - m.empty.right))).toBeLessThan(2)
        // VERTICALLY: equal space above (to the headline) and below (to the board's end).
        const above = m.empty.top - m.headline.bottom
        const below = m.board.bottom - m.empty.bottom
        expect(above).toBeGreaterThan(50)
        expect(Math.abs(above - below)).toBeLessThan(2)
        // THE HEADLINE KEEPS ITS FULL WIDTH in the board's new column layout.
        expect(m.headline.width).toBeGreaterThan(600)
        expect(m.placeholderAlign).toBe('center')
    },
    120000,
  )

  it(
    'test_UAT_FC_REQ-417_the_ghost_text_is_centred_both_ways_in_the_question_panel',
    async () => {
      const plan = planTransport(view())
      const app = await mount(plan)
      const measure = () => {
        const p = document.querySelector('.plan-panel')!
        const g = p.querySelector('.plan-panel__ghost')!
        const style = getComputedStyle(p)
        const r = p.getBoundingClientRect()
        const e = g.getBoundingClientRect()
        // THE SPACE THE GHOST HAS: below whatever shows above it, to the panel's foot.
        let top = r.top + parseFloat(style.paddingTop)
        for (let n = g.previousElementSibling; n; n = n.previousElementSibling) {
          const b = n.getBoundingClientRect()
          if (getComputedStyle(n).display !== 'none' && b.height) top = Math.max(top, b.bottom + parseFloat(getComputedStyle(n).marginBottom))
        }
        return {
          shown: getComputedStyle(g).display !== 'none',
          display: style.display,
          left: e.left - (r.left + parseFloat(style.paddingLeft)),
          right: r.right - parseFloat(style.paddingRight) - e.right,
          above: e.top - top,
          below: r.bottom - parseFloat(style.paddingBottom) - e.bottom,
        }
      }
      const m = await measureIn(panel(app).outerHTML, 360, 700, measure)
      if (!m) return
      expect(m.shown).toBe(true)
      expect(Math.abs(m.left - m.right)).toBeLessThan(2)
      expect(m.above).toBeGreaterThan(100)
      expect(Math.abs(m.above - m.below)).toBeLessThan(2)

      // A PANEL WITH QUESTIONS lays out as it always did: no column, no ghost.
      plan.set(view({ asks: [ask('a1')] }))
      await app.planPanel.refresh()
      await settle()
      const after = await measureIn(panel(app).outerHTML, 360, 700, measure)
      expect(after!.shown).toBe(false)
      expect(after!.display).toBe('block')
    },
    120000,
  )
})
