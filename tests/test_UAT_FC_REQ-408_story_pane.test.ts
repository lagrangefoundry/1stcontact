// @vitest-environment jsdom
/**
 * [[REQ-408]] — **the Story pane**: the preview's third mode, beside View and
 * Edit, drawing the story board — notes, themes, reactions and the headline —
 * and opening first while the site has no draft.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components
 * with the builder's stylesheets loaded, as REQ-403's pane suite does. The origin
 * is replaced at the transport the builder already takes; the board actions it
 * sends are recorded, and the core suite and the workers suite prove what the
 * plan does with them.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { webuiPackageDir } from '../tools/generate/src/cli/webui'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-408 pane suite skipped: ${WEBUI_SKIP_REASON}`)

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
const BOARD = {
  themes: [
    {
      id: 'th1',
      name: 'Family',
      colour: 0,
      notes: [
        { id: 'n1', text: 'Three generations cut hair here', emoji: '👪', theme: 'th1', quote: 'My gran opened it, then my mum, and now me.', by: 'consultant' },
        { id: 'n2', text: 'Since 1971', emoji: '📍', theme: 'th1', quote: "We've been here since 1971.", by: 'consultant', reaction: 'down' },
      ],
    },
    {
      id: 'th2',
      name: 'The chair',
      colour: 1,
      notes: [{ id: 'n3', text: 'Tea before every cut', emoji: '💇', theme: 'th2', quote: 'Everybody gets tea first.', by: 'consultant', reaction: 'heart' }],
    },
  ],
  headline: NO_HEADLINE,
}
const view = (extra: Record<string, unknown> = {}) => ({
  stages: STAGES,
  asks: [],
  comps: [],
  comps_status: 'open',
  comps_raised: false,
  board: BOARD,
  drafted: false,
  ...extra,
})

function planTransport(initial: Record<string, any>) {
  let current = initial
  const sent: Record<string, unknown>[] = []
  return {
    sent,
    set: (next: Record<string, any>) => {
      current = next
    },
    fetchPlan: async () => current,
    answerAsk: async () => current,
    compAction: async () => current,
    boardAction: async (action: Record<string, unknown>) => {
      sent.push(action)
      return current
    },
    uploadMaterial: async () => ({ uid: 'material-1' }),
  }
}

const chatTransport = {
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [{ role: 'assistant', markdown: 'Hello again.' }], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

const sheet = (file: string) => readFileSync(file, 'utf8')
const BUILDER_CSS = path.resolve(__dirname, '../apps/control-app/src/builder/builder.css')
const CSS = WEBUI_INSTALLED
  ? [
      sheet(path.join(webuiPackageDir('webui-shell'), 'src/shell.css')),
      sheet(path.join(webuiPackageDir('webui-chat'), 'src/chat.css')),
      sheet(BUILDER_CSS),
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

async function mount(plan: ReturnType<typeof planTransport>, storage = memoryStorage()): Promise<Handle> {
  const root = document.createElement('div')
  document.body.append(root)
  const app = mountBuilder(root, { sites: SITES, storage, chatTransport, planTransport: plan })
  await settle()
  return app
}

const board = (app: Handle): HTMLElement => app.storyBoard.element
const noteEl = (app: Handle, id: string): HTMLElement => board(app).querySelector(`[data-note="${id}"]`) as HTMLElement
const modeButtons = (app: Handle): string[] =>
  [...app.toolbar.element.querySelectorAll<HTMLButtonElement>('.builder-toolbar__modes button')].map((b) => b.textContent ?? '')

describe.skipIf(!WEBUI_INSTALLED)('REQ-408 — the Story pane', () => {
  it('test_UAT_FC_REQ-408_story_is_the_third_mode_and_a_site_with_no_draft_opens_in_it', async () => {
    const plan = planTransport(view())
    const storage = memoryStorage()
    const app = await mount(plan, storage)
    expect(app.panel.getModes().filter((m: { transient?: boolean }) => !m.transient).map((m: { label: string }) => m.label)).toEqual(['View', 'Edit', 'Story'])
    expect(app.panel.getMode()).toBe('story')
    expect(modeButtons(app)).toEqual(['View', 'Edit', 'Story'])
    expect(app.panel.element.contains(board(app))).toBe(true)

    // THE FIRST DRAFT LANDS: the pane goes to View so the client sees it.
    plan.set(view({ drafted: true }))
    await app.planPanel.refresh()
    expect(app.panel.getMode()).toBe('view')
  })

  it('test_UAT_FC_REQ-408_a_drafted_site_opens_where_the_client_left_it', async () => {
    const app = await mount(planTransport(view({ drafted: true })))
    expect(app.panel.getMode()).toBe('view')
    app.panel.setMode('story')
    expect(app.panel.element.contains(board(app))).toBe(true)
  })

  it('test_UAT_FC_REQ-408_a_note_shows_its_text_emoji_theme_colour_and_original_sentence_on_hover', async () => {
    const app = await mount(planTransport(view()))
    const themes = [...board(app).querySelectorAll<HTMLElement>('.story-theme')]
    expect(themes.map((t) => t.querySelector('.story-theme__name')!.textContent)).toEqual(['Family', 'The chair'])
    const n1 = noteEl(app, 'n1')
    expect(n1.querySelector('.story-note__text')!.textContent).toBe('Three generations cut hair here')
    expect(n1.querySelector('.story-note__emoji')!.textContent).toBe('👪')
    expect(n1.classList.contains('story-note--c0')).toBe(true)
    expect(noteEl(app, 'n3').classList.contains('story-note--c1')).toBe(true)
    expect(getComputedStyle(n1).backgroundColor).not.toBe(getComputedStyle(noteEl(app, 'n3')).backgroundColor)
    expect((n1.querySelector('.story-note__text') as HTMLElement).title).toBe('From what you said: “My gran opened it, then my mum, and now me.”')
  })

  it('test_UAT_FC_REQ-408_reactions_and_delete_are_sent_and_a_thumbs_down_note_is_pale', async () => {
    const plan = planTransport(view())
    const app = await mount(plan)
    const press = async (id: string, which: string) => {
      ;(noteEl(app, id).querySelector(`.story-note__react--${which}`) as HTMLButtonElement).click()
      await settle()
    }
    await press('n1', 'heart')
    await press('n1', 'down')
    await press('n1', 'delete')
    expect(plan.sent).toEqual([
      { site: 'alpha', action: 'react', note: 'n1', reaction: 'heart' },
      { site: 'alpha', action: 'react', note: 'n1', reaction: 'down' },
      { site: 'alpha', action: 'delete', note: 'n1' },
    ])
    // THE STORED REACTION IS WHAT IS SHOWN: 👎 pale, ❤️ pressed.
    expect(Number(getComputedStyle(noteEl(app, 'n2')).opacity)).toBeLessThan(1)
    expect(noteEl(app, 'n3').dataset.reaction).toBe('heart')
    expect(noteEl(app, 'n3').querySelector('.story-note__react--heart')!.getAttribute('aria-pressed')).toBe('true')
  })

  it('test_UAT_FC_REQ-408_the_client_adds_a_note_by_clicking_a_theme_and_edits_any_note', async () => {
    const plan = planTransport(view())
    const app = await mount(plan)
    app.panel.setMode('story')
    ;(board(app).querySelector('[data-theme="th2"] .story-theme__name') as HTMLButtonElement).click()
    await settle()
    const box = board(app).querySelector('[data-theme="th2"] .story-note--draft textarea') as HTMLTextAreaElement
    box.value = 'We do the whole wedding party'
    box.dispatchEvent(new Event('blur'))
    await settle()
    ;(noteEl(app, 'n1').querySelector('.story-note__text') as HTMLButtonElement).click()
    await settle()
    const edit = noteEl(app, 'n1').querySelector('textarea') as HTMLTextAreaElement
    edit.value = 'Three generations, one corner'
    edit.dispatchEvent(new Event('blur'))
    await settle()
    expect(plan.sent).toEqual([
      { site: 'alpha', action: 'add', theme: 'th2', text: 'We do the whole wedding party' },
      { site: 'alpha', action: 'edit', note: 'n1', text: 'Three generations, one corner' },
    ])
  })

  it('test_UAT_FC_REQ-408_the_headline_shows_shadow_text_steps_through_offers_and_choose_picks_one', async () => {
    const plan = planTransport(view())
    const app = await mount(plan)
    const slot = () => board(app).querySelector('.story-headline') as HTMLElement
    const line = () => slot().querySelector('.story-headline__line') as HTMLTextAreaElement
    expect(slot().dataset.state).toBe('empty')
    expect(line().placeholder).toBe('The headline… why you?')
    expect(line().value).toBe('')

    const options = ['Three generations on one corner', 'Where every cut starts with tea', 'Leave feeling like yourself']
    plan.set(view({ board: { ...BOARD, headline: { state: 'offered', options, pick: 1, new_options: [] } } }))
    await app.planPanel.refresh()
    // HER PICK, IN FULL, WITH THE STRIP; visibly undecided.
    expect(slot().dataset.state).toBe('offered')
    expect(getComputedStyle(slot()).borderStyle).toBe('dashed')
    expect(line().value).toBe(options[1])
    expect(slot().querySelector('.story-headline__strip')!.textContent).toContain('2 of 3')
    expect(slot().querySelector('.story-headline__strip')!.textContent).toContain('my pick')
    // › STEPS IN PLACE, and "my pick" goes with her pick.
    ;(slot().querySelectorAll('.story-headline__step')[1] as HTMLButtonElement).click()
    expect(line().value).toBe(options[2])
    expect(slot().querySelector('.story-headline__strip')!.textContent).toContain('3 of 3')
    expect(slot().querySelector('.story-headline__strip')!.textContent).not.toContain('my pick')
    // CHOOSE… LISTS THEM ALL, each with Use this, and Write my own last.
    ;(slot().querySelector('.story-headline__choose') as HTMLButtonElement).click()
    const choices = [...slot().querySelectorAll('.story-headline__choice')]
    expect(choices.map((c) => c.querySelector('.story-headline__option')?.textContent ?? c.textContent)).toEqual([...options, 'Write my own'])
    ;(choices[0].querySelector('.story-headline__use') as HTMLButtonElement).click()
    await settle()
    expect(plan.sent).toEqual([{ site: 'alpha', action: 'choose', option: options[0] }])
  })

  it('test_UAT_FC_REQ-408_typing_over_an_offer_sends_it_as_the_headline_and_a_later_offer_waits_beside_a_choice', async () => {
    const options = ['Three generations on one corner', 'Where every cut starts with tea']
    const plan = planTransport(view({ board: { ...BOARD, headline: { state: 'offered', options, pick: 0, new_options: [] } } }))
    const app = await mount(plan)
    const slot = () => board(app).querySelector('.story-headline') as HTMLElement
    const line = slot().querySelector('.story-headline__line') as HTMLTextAreaElement
    line.value = 'Three generations, one chair'
    line.dispatchEvent(new Event('blur'))
    await settle()
    expect(plan.sent).toEqual([{ site: 'alpha', action: 'write', text: 'Three generations, one chair' }])

    plan.set(view({ board: { ...BOARD, headline: { state: 'chosen', text: 'Three generations, one chair', yours: true, options: [], pick: 0, new_options: ['A', 'B'] } } }))
    await app.planPanel.refresh()
    expect(slot().dataset.state).toBe('chosen')
    expect(getComputedStyle(slot()).borderStyle).toBe('solid')
    expect((slot().querySelector('.story-headline__line') as HTMLTextAreaElement).value).toBe('Three generations, one chair')
    expect(slot().querySelector('.story-headline__yours')!.textContent).toBe('your words')
    expect(slot().querySelector('.story-headline__new')!.textContent).toBe('2 new options')
    expect(slot().querySelector('.story-headline__choices')).toBeNull()
  })

  it('test_UAT_FC_REQ-408_the_board_style_does_not_change_with_the_sites_palette_or_fonts', async () => {
    const app = await mount(planTransport(view()))
    const probe = () => {
      const b = getComputedStyle(board(app))
      const n = getComputedStyle(noteEl(app, 'n1'))
      return [b.backgroundColor, b.fontFamily, b.color, n.backgroundColor]
    }
    const before = probe()
    // WHATEVER A SITE'S PALETTE OR FONTS WOULD SET, at the root or on the body.
    const root = document.documentElement.style
    for (const name of ['--color-primary', '--color-background', '--brand', '--font-body', '--font-heading', '--accent', '--surface', '--text']) {
      root.setProperty(name, name.startsWith('--font') ? 'Papyrus' : '#ff00ff')
    }
    document.body.style.fontFamily = 'Papyrus'
    document.body.style.backgroundColor = '#ff00ff'
    expect(probe()).toEqual(before)
    // AND THE STYLESHEET GIVES IT NOTHING TO TAKE: no custom property in a story rule.
    const css = sheet(BUILDER_CSS)
    const story = css.slice(css.indexOf('/* --- the story board'))
    expect(story).toContain('.story-board {')
    expect(story).not.toMatch(/var\(--(?!tilt)/)
  })
})
