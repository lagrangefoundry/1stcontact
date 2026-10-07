// @vitest-environment jsdom
/**
 * [[REQ-391]] — **the looks offered for a page, compared in the preview's
 * carousel** — on the toolbar, with no mode of its own and no "Choose this one"
 * since [[BUG-205]]: choosing is the consultant's, in the conversation.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes: the page listing
 * (rows shaped as `GET /api/pages` answers, `alternative` blocks included) and
 * the plan panel's reads. What is asserted is what
 * the client sees and what reached the transport — the dropdown's options, the
 * toolbar, the carousel's words, which document each frame was pointed at.
 *
 * jsdom loads no documents, so a frame's `src` is the evidence of where the pane
 * was sent.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-391 carousel suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'charlies', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const look = (slug: string, label: string, order: number, description: string, extra: Record<string, unknown> = {}) => ({
  id: slug,
  slug,
  title: `Home — ${label}`,
  kind: 'web',
  reachable: false,
  widths: [375, 768, 1280],
  alternative: { of: 'home', set: 'home-looks', label, description, order, ...extra },
})

/** Listed out of carousel order on purpose — the page store lists by key. */
const ROWS = () => [
  { id: 'home', slug: 'home', title: 'Home', kind: 'web', reachable: true, widths: [375, 768, 1280] },
  look('home-coastal', 'Coastal', 1, 'Sea blues and a calm, airy layout'),
  look('home-trade', 'Trade', 2, 'Dense, bold, the phone number everywhere'),
  look('home-workwear', 'Workwear', 0, 'Navy and safety orange, the van up top'),
  look('home-old', 'Old idea', 3, 'Set aside earlier', { archived: true }),
  { id: 'terms', slug: 'terms', title: 'Terms', kind: 'web', reachable: false, widths: [] },
]

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

const chatTransport = () => ({
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
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
const PLAN = { phase: 'intake', asks: [], comps: [comp(1), comp(2), comp(3)] }
const planTransport = () => ({
  fetchPlan: async () => PLAN,
  answerAsk: async () => PLAN,
  uploadMaterial: async () => ({ uid: 'material-1' }),
  compAction: async () => PLAN,
})

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

let root: HTMLElement
let listing: ReturnType<typeof ROWS>

beforeEach(() => {
  setBusinessScope(null)
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  listing = ROWS()
})

async function mounted(): Promise<Handle> {
  const app = mountBuilder(root, {
    sites: SITES,
    storage: memoryStorage(),
    pageState,
    chatTransport: chatTransport(),
    planTransport: planTransport(),
    pagesTransport: {
      list: async () => ({ pages: listing }),
      saveSubject: async () => ({}),
    },
  })
  await settle()
  return app
}

const bar = () => root.querySelector('[data-action="looks"]') as HTMLElement
const label = () => bar().querySelector('.builder-carousel__label')?.textContent
const count = () => bar().querySelector('.builder-carousel__count')?.textContent
const lit = () => !bar().classList.contains('looks-bar--unlit')
const next = () => bar().querySelector('.builder-carousel__next') as HTMLButtonElement
const shownSrc = (app: Handle) => (app.panel.frame as HTMLIFrameElement).getAttribute('src') ?? ''
const allSrcs = () => [...root.querySelectorAll('iframe.builder-panel__pane')].map((f) => f.getAttribute('src') ?? '')

describe.skipIf(!WEBUI_INSTALLED)('REQ-391 — looks are not pages of the site', () => {
  it('test_UAT_FC_REQ-391_looks_are_absent_from_the_page_list_and_nothing_says_unreachable', async () => {
    await mounted()
    const select = root.querySelector('[data-action="pages"] select') as HTMLSelectElement
    const options = [...select.options].map((o) => [o.value, o.text])
    expect(options).toEqual([
      ['home', 'Home'],
      ['terms', 'Terms — not linked from the site'],
    ])
    // NO CLIENT-FACING STRING SAYS IT — the toolbar, the panel, anywhere.
    expect(root.textContent?.toLowerCase()).not.toContain('unreachable')
    expect(select.innerHTML.toLowerCase()).not.toContain('unreachable')
  })

  it('test_UAT_FC_REQ-391_the_carousel_is_lit_only_while_a_set_is_on_offer', async () => {
    await mounted()
    expect(lit()).toBe(true)

    // The set is chosen from elsewhere; the next document the pane shows re-takes
    // the listing, which leaves nothing to compare.
    for (const row of listing) if ((row as any).alternative) (row as any).alternative.archived = true
    root.querySelector('iframe.builder-panel__frame')!.dispatchEvent(new Event('load'))
    await settle()
    expect(lit()).toBe(false)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-391 — the carousel', () => {
  it('test_UAT_FC_REQ-391_the_carousel_shows_label_and_n_of_n_and_the_arrows_move_between_looks', async () => {
    const app = await mounted()
    expect(label()).toBe('Current')
    expect(count()).toBe('1 of 4')
    // The next look is already loaded behind the draft, so the first step is instant.
    expect(allSrcs().some((s) => s.endsWith('/draft/home-workwear'))).toBe(true)
    next().click()
    await settle()

    // The pane stays in View, with its own strip ([[BUG-205]]).
    expect(app.panel.getMode()).toBe('view')
    expect(app.toolbar.ids()).toContain('publish')
    // In the set's own order, not the listing's; the archived look is not offered.
    expect(label()).toBe('Workwear')
    expect(count()).toBe('2 of 4')
    expect(bar().textContent).toContain('Navy and safety orange, the van up top')
    // The look is shown live, from the draft channel.
    expect(shownSrc(app)).toMatch(/\/preview\/charlies\/draft\/home-workwear$/)
    expect(allSrcs().some((s) => s.endsWith('/draft/home-coastal'))).toBe(true)

    const preloaded = [...root.querySelectorAll('iframe')].find((f) => f.getAttribute('src')?.endsWith('/home-coastal'))
    next().click()
    await settle()
    expect(label()).toBe('Coastal')
    expect(count()).toBe('3 of 4')
    // The swap is to the PRELOADED frame, animated in.
    expect(app.panel.frame).toBe(preloaded)
    expect(preloaded!.classList.contains('builder-panel__pane--entering')).toBe(true)
    expect(allSrcs().some((s) => s.endsWith('/draft/home-trade'))).toBe(true)
    // "Open in new tab" follows the shown look.
    const tab = root.querySelector('[data-action="open-new-tab"]') as HTMLAnchorElement
    expect(tab.getAttribute('href')).toMatch(/\/draft\/home-coastal$/)

    next().click()
    await settle()
    expect(label()).toBe('Trade')
    expect(next().disabled).toBe(true)
    ;(bar().querySelector('.builder-carousel__prev') as HTMLButtonElement).click()
    await settle()
    expect(label()).toBe('Coastal')
  })

  it('test_UAT_FC_REQ-391_a_link_in_the_chat_opens_the_set', async () => {
    const app = await mounted()
    const link = document.createElement('a')
    link.href = '#looks=home-looks'
    link.textContent = 'Compare the looks'
    app.chat.element.append(link)
    link.click()
    await settle()
    expect(app.panel.getMode()).toBe('view')
    expect(label()).toBe('Workwear')
    expect(location.hash).not.toBe('#looks=home-looks')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-391 — one carousel for looks and comps', () => {
  it('test_UAT_FC_REQ-391_the_comp_viewer_uses_the_same_carousel_without_choose', async () => {
    const app = await mounted()
    const open = app.planPanel.element.querySelector('.plan-comp[data-reference="reference-1"] button.plan-comp__open') as HTMLButtonElement
    open.click()
    await settle()
    expect(app.panel.getMode()).toBe('comp')
    const viewer = root.querySelector('.comp-viewer') as HTMLElement
    expect(viewer.querySelector('.builder-carousel__label')?.textContent).toBe('Duncan Plumbing 1')
    expect(viewer.querySelector('.builder-carousel__count')?.textContent).toBe('1 of 3')
    // A comp is never chosen onto the site.
    expect(root.querySelector('.looks-bar__choose')).toBeNull()
    expect(viewer.textContent).not.toContain('Choose this one')
    ;(viewer.querySelector('.builder-carousel__next') as HTMLButtonElement).click()
    expect(root.querySelector('.comp-viewer .builder-carousel__label')?.textContent).toBe('Duncan Plumbing 2')
  })
})
