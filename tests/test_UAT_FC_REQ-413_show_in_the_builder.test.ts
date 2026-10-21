// @vitest-environment jsdom
/**
 * [[REQ-413]] — **the consultant brings the right view to the client**, as the
 * builder receives it: a `switch` arriving on the live turn stream, and a `link`
 * in the reply the client follows when they choose.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes. The turn stream
 * carries exactly what the host sends for a switch — the recorded line as the
 * reply's text, then the `show_client` event — and the transcript a reload opens
 * carries what the host stored. The host's half (when a switch is allowed, what
 * is recorded) is proven against the real Worker by the suite beside this one.
 *
 * jsdom loads no documents, so a frame's `src` is the evidence of where the pane
 * was sent, and the panel's mode is the evidence of which view is in front.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
type Event = { kind: string; content?: string; meta?: Record<string, unknown> }
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-413 builder suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'charlies', latest: null }]
const settle = async (n = 12) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const look = (slug: string, label: string, order: number, extra: Record<string, unknown> = {}) => ({
  id: slug,
  slug,
  title: `Home — ${label}`,
  kind: 'web',
  reachable: false,
  widths: [375, 768, 1280],
  alternative: { of: 'home', set: 'home-looks', label, description: `${label} look`, order, ...extra },
})
const ROWS = () => [
  { id: 'home', slug: 'home', title: 'Home', kind: 'web', reachable: true, widths: [375, 768, 1280] },
  look('home-workwear', 'Workwear', 0),
  look('home-coastal', 'Coastal', 1),
  look('home-old', 'Old idea', 2, { archived: true }),
  { id: 'services', slug: 'services', title: 'Services', kind: 'web', reachable: true, widths: [] },
]

const ask = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  prompt: `What is your ${id}?`,
  why: `Why ${id} matters.`,
  input: 'text',
  needed_by: 'first_pass',
  blocking: false,
  status: 'open',
  ...extra,
})
const comp = (n: number) => ({
  reference: `reference-${n}`,
  title: `Duncan Plumbing ${n}`,
  url: `https://duncan${n}.test/`,
  source: 'consultant',
  added_at: '2026-10-03T00:00:00.000Z',
  likes: [],
  dislikes: [],
  motion: null,
  desktop: 'screenshot-1280.png',
  phone: 'screenshot-375.png',
})
/** A site with a first draft, so the pane opens on View rather than Story ([[REQ-408]]). */
const PLAN = {
  drafted: true,
  stages: [],
  asks: [ask('phone'), ask('licence', { status: 'answered', answer: 'GS-1', answered_by: 'client' })],
  comps: [comp(1), comp(2)],
  comps_raised: true,
  comps_status: 'open',
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

/** The chat transport: the transcript a reload opens, and the events each prompt streams. */
function chatTransport(turns: { role: string; markdown: string }[] = [], reply: Event[] = []) {
  const sent: unknown[][] = []
  return {
    sent,
    openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns, ready: true }),
    streamPrompt: async function* (...args: unknown[]) {
      sent.push(args)
      for (const event of reply) yield event
      yield { kind: 'done', content: '', meta: { status: 'complete' } }
    },
  }
}

/** What the host streams for a switch: the line it records, then the event. */
const switched = (href: string, label: string, said = 'Have a look.'): Event[] => [
  { kind: 'text', content: `[Showing you ${label}](${href})\n\n` },
  { kind: 'show_client', content: '', meta: { href, label } },
  { kind: 'text', content: said },
]

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    // THE ENGINES, so a markdown link is an `<a>` rather than escaped source — as
    // [[REQ-220]]'s suite installs them for a picture.
    const { setParser, setSanitizer } = await import('../apps/control-app/src/builder/markdown.js')
    const links = (md: string) =>
      md.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, text, href) => `<a href="${href.replace(/&/g, '&amp;')}">${text}</a>`)
    setParser({ parse: (md: string) => `<p>${links(md)}</p>`, parseInline: links })
    setSanitizer((html: string) => html)
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

let root: HTMLElement
let listing: ReturnType<typeof ROWS>
const scrolled: Element[] = []

beforeEach(() => {
  setBusinessScope(null)
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  listing = ROWS()
  scrolled.length = 0
  // jsdom has no layout, so no scrolling: record what was asked to scroll into view.
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this)
  }
})

async function mounted(chat: ReturnType<typeof chatTransport>, storage = memoryStorage()): Promise<Handle> {
  const app = mountBuilder(root, {
    sites: SITES,
    storage,
    pageState,
    chatTransport: chat,
    planTransport: {
      fetchPlan: async () => PLAN,
      answerAsk: async () => PLAN,
      uploadMaterial: async () => ({ uid: 'material-1' }),
      compAction: async () => PLAN,
    },
    pagesTransport: { list: async () => ({ pages: listing }), saveSubject: async () => ({}) },
  })
  await settle()
  return app
}

const send = async (app: Handle, text = 'What next?') => {
  await app.chat.getChat().send(text)
  await settle()
}
const shownSrc = (app: Handle) => (app.panel.frame as HTMLIFrameElement).getAttribute('src') ?? ''
const bandLabel = () => root.querySelector('.looks-band .builder-carousel__label')?.textContent
const chatLink = (app: Handle, href: string) =>
  [...app.chat.element.querySelectorAll('a[href]')].find((a) => a.getAttribute('href') === href) as HTMLAnchorElement | undefined
const askNode = (app: Handle, id: string) => app.planPanel.element.querySelector(`[data-ask="${id}"]`) as HTMLElement

describe.skipIf(!WEBUI_INSTALLED)('REQ-413 — the consultant switches the view', () => {
  it('test_UAT_FC_REQ-413_switch_to_story_while_in_view_puts_the_story_board_in_front', async () => {
    const chat = chatTransport([], switched('#show=story', 'the story board', 'Your sayings are on the board.'))
    const app = await mounted(chat)
    expect(app.panel.getMode()).toBe('view')

    await send(app)
    expect(app.panel.getMode()).toBe('story')
    // The reply says what was shown, as a link back to it.
    expect(chatLink(app, '#show=story')?.textContent).toBe('Showing you the story board')

    // THE CLIENT IS NEVER STUCK: their own mode buttons work as they always do.
    ;(root.querySelector('.builder-toolbar__modes [data-mode="view"]') as HTMLButtonElement).click()
    await settle()
    expect(app.panel.getMode()).toBe('view')
  })

  it('test_UAT_FC_REQ-413_switch_with_an_edit_open_does_not_change_the_view_and_the_reply_carries_the_link', async () => {
    // The host was told the client is busy, so the consultant pasted the link;
    // even a switch arriving anyway is not made under them.
    const reply: Event[] = [
      { kind: 'text', content: "When you're done there: [Open the story board](#show=story)" },
      { kind: 'show_client', content: '', meta: { href: '#show=story', label: 'the story board' } },
    ]
    const chat = chatTransport([], reply)
    const app = await mounted(chat)
    app.panel.setMode('edit')
    await settle()
    // A real pane has a width, which is what the busy report rides with.
    app.panel.viewport = () => ({ width: 1280, height: 800 })
    const modal = document.createElement('div')
    modal.className = 'builder-modal'
    document.body.append(modal)

    await send(app, 'Can you make this bolder?')
    expect(chat.sent[0][2]).toMatchObject({ busy: 'editing' })
    expect(app.panel.getMode()).toBe('edit')
    expect(chatLink(app, '#show=story')?.textContent).toBe('Open the story board')

    // And the link works once they choose to follow it.
    modal.remove()
    chatLink(app, '#show=story')!.click()
    await settle()
    expect(app.panel.getMode()).toBe('story')
  })

  it('test_UAT_FC_REQ-413_switch_to_a_panel_question_unfolds_scrolls_to_and_highlights_it', async () => {
    const chat = chatTransport([], switched('#show=ask&ask=licence', 'the question "What is your licence?"'))
    const app = await mounted(chat)
    const licence = askNode(app, 'licence')
    // An answered question starts folded ([[REQ-401]]).
    expect(licence.dataset.expanded).toBe('false')

    await send(app)
    const shown = askNode(app, 'licence')
    expect(shown.dataset.expanded).toBe('true')
    expect(shown.classList.contains('plan-item--shown')).toBe(true)
    expect(scrolled).toContain(shown)
    // Nothing else moved: the preview is where it was.
    expect(app.panel.getMode()).toBe('view')
  })

  it('test_UAT_FC_REQ-413_switch_to_a_comparison_site_and_back_to_a_page_of_the_draft', async () => {
    const chat = chatTransport([], switched('#show=comp&comp=reference-2', 'Duncan Plumbing 2'))
    const app = await mounted(chat)
    await send(app)
    // [[REQ-419]] — a comparison site is its tile in Comparisons, brought into view.
    expect(app.panel.getMode()).toBe('comparisons')
    const tile = root.querySelector('.comp-tile[data-reference="reference-2"]') as HTMLElement
    expect(tile.textContent).toContain('Duncan Plumbing 2')
    expect(tile.classList.contains('comp-tile--shown')).toBe(true)

    // A link to a page of the draft brings the pane back to the draft, on that page.
    const link = document.createElement('a')
    link.setAttribute('href', '#show=draft&page=services')
    app.chat.element.append(link)
    link.click()
    await settle()
    expect(app.panel.getMode()).toBe('view')
    expect(shownSrc(app)).toMatch(/\/preview\/charlies\/draft\/services$/)
  })

  it('test_UAT_FC_REQ-413_a_reload_after_a_switch_does_not_switch_again', async () => {
    // The transcript holds the recorded line; the event was never stored.
    const turns = [
      { role: 'user', markdown: 'What next?' },
      { role: 'assistant', markdown: '[Showing you the story board](#show=story)\n\nYour sayings are on the board.' },
    ]
    const app = await mounted(chatTransport(turns))
    expect(app.panel.getMode()).toBe('view')
    // The reload still shows the view was changed, as a link back to it.
    expect(chatLink(app, '#show=story')?.textContent).toBe('Showing you the story board')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-413 — a link the client follows', () => {
  const LOOK_LINE = '[Open the Coastal look](#show=looks&set=home-looks&look=home-coastal)'

  it('test_UAT_FC_REQ-413_a_link_to_a_look_shows_that_look_and_still_works_after_a_reload', async () => {
    const storage = memoryStorage()
    const live = await mounted(chatTransport([], [{ kind: 'text', content: `When you have a minute: ${LOOK_LINE}` }]), storage)
    await send(live)
    chatLink(live, '#show=looks&set=home-looks&look=home-coastal')!.click()
    await settle()
    // [[BUG-250]] — a look is shown in Looks mode.
    expect(live.panel.getMode()).toBe('looks')
    expect(bandLabel()).toBe('Coastal')
    expect(shownSrc(live)).toMatch(/\/draft\/home-coastal$/)
    // In place: the builder is not navigated away and no tab is opened.
    expect(location.hash).toBe('')

    // A reload replays the transcript, and the link in it works the same.
    live.destroy?.()
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    const reloaded = await mounted(
      chatTransport([
        { role: 'user', markdown: 'What next?' },
        { role: 'assistant', markdown: `When you have a minute: ${LOOK_LINE}` },
      ]),
      storage,
    )
    reloaded.panel.setMode('story')
    chatLink(reloaded, '#show=looks&set=home-looks&look=home-coastal')!.click()
    await settle()
    expect(reloaded.panel.getMode()).toBe('looks')
    expect(bandLabel()).toBe('Coastal')
  })

  it('test_UAT_FC_REQ-413_a_link_to_a_look_that_was_set_aside_says_it_is_no_longer_there', async () => {
    const href = '#show=looks&set=home-looks&look=home-old'
    const app = await mounted(
      chatTransport([{ role: 'assistant', markdown: `[Open the Old idea look](${href})` }]),
    )
    const before = shownSrc(app)
    chatLink(app, href)!.click()
    await settle()
    const note = app.chat.element.querySelector('.builder-chat-gone')
    expect(note?.textContent).toBe('That’s no longer there.')
    expect(chatLink(app, href)!.nextElementSibling).toBe(note)
    // Nothing else is shown in its place.
    expect(shownSrc(app)).toBe(before)

    // A question that is no longer on the panel says the same.
    const gone = document.createElement('a')
    gone.setAttribute('href', '#show=ask&ask=hours')
    app.chat.element.append(gone)
    gone.click()
    await settle()
    expect(gone.nextElementSibling?.textContent).toBe('That’s no longer there.')
  })
})
