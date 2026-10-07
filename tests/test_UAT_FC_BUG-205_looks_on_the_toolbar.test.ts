// @vitest-environment jsdom
/**
 * [[BUG-205]] — **looks are stepped through on the toolbar the client already
 * has: no mode of their own, the draft as one of them, no "Choose this one",
 * and never a row in the Page selector.**
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes — the page listing
 * (rows shaped as `GET /api/pages` answers, `alternative` blocks included) and
 * the plan panel's reads. jsdom loads no documents, so a frame's `src` is the
 * evidence of where the pane was sent.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-205 looks suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'charlies', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const look = (slug: string, label: string, order: number, description: string) => ({
  id: slug,
  slug,
  title: `Home — ${label}`,
  kind: 'web',
  reachable: false,
  widths: [375, 768, 1280],
  alternative: { of: 'home', set: 'home-looks', label, description, order },
})

const ROWS = () => [
  { id: 'home', slug: 'home', title: 'Home', kind: 'web', reachable: true, widths: [375, 768, 1280] },
  look('home-heavy-duty', 'Heavy Duty', 0, 'Steel grey and safety yellow'),
  look('home-family', 'Family', 1, 'Warm, friendly, faces up top'),
  { id: 'about', slug: 'about', title: 'About', kind: 'web', reachable: true, widths: [] },
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

const PLAN = { phase: 'intake', asks: [], comps: [] }

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
let listing: Array<Record<string, any>>

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
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
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

const bar = () => root.querySelector('[data-action="looks"]') as HTMLElement
const lit = () => !bar().classList.contains('looks-bar--unlit')
const label = () => bar().querySelector('.builder-carousel__label')?.textContent
const count = () => bar().querySelector('.builder-carousel__count')?.textContent
const next = () => bar().querySelector('.builder-carousel__next') as HTMLButtonElement
const previous = () => bar().querySelector('.builder-carousel__prev') as HTMLButtonElement
const shownSrc = (app: Handle) => (app.panel.frame as HTMLIFrameElement).getAttribute('src') ?? ''
const select = () => root.querySelector('[data-action="pages"] select') as HTMLSelectElement

/** Choose a page in the Page selector, as the client does. */
async function choosePage(slug: string): Promise<void> {
  select().value = slug
  select().dispatchEvent(new Event('change'))
  await settle()
}

async function step(button: () => HTMLButtonElement): Promise<void> {
  button().click()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-205 — looks on the existing toolbar', () => {
  it('test_UAT_FC_BUG-205_the_carousel_is_lit_only_on_a_page_with_looks_and_stepping_never_changes_the_mode', async () => {
    const app = await mounted()
    // On the toolbar of View itself, beside the page selector — no other mode.
    expect(app.panel.getModes().map((m: { id: string }) => m.id)).toEqual(['view', 'edit', 'comp'])
    expect(app.toolbar.ids()).toContain('looks')
    expect(app.toolbar.ids().indexOf('looks')).toBe(app.toolbar.ids().indexOf('pages') + 1)
    expect(lit()).toBe(true)
    expect(next().disabled).toBe(false)

    await step(next)
    expect(app.panel.getMode()).toBe('view')
    expect(app.toolbar.ids()).toContain('publish')

    // A page with no looks: present, dimmed, inert.
    await choosePage('about')
    expect(lit()).toBe(false)
    expect(next().disabled).toBe(true)
    expect(previous().disabled).toBe(true)

    // In Edit too — and a look shown there is shown, not edited.
    await choosePage('home')
    app.panel.setMode('edit')
    await settle()
    expect(lit()).toBe(true)
    await step(next)
    expect(app.panel.getMode()).toBe('edit')
    expect(label()).toBe('Heavy Duty')
    expect(shownSrc(app)).toMatch(/\/preview\/charlies\/edit\/home-heavy-duty$/)
    expect(bar().querySelector('.looks-bar__note')?.textContent).toContain('go back to Current to edit')
    await step(previous)
    expect(label()).toBe('Current')
    expect(bar().querySelector('.looks-bar__note')).toBeNull()
  })

  it('test_UAT_FC_BUG-205_stepping_goes_current_then_each_look_then_back_to_current', async () => {
    const app = await mounted()
    const draft = app.panel.frame as HTMLIFrameElement
    expect(label()).toBe('Current')
    expect(count()).toBe('1 of 3')
    expect(previous().disabled).toBe(true)

    await step(next)
    expect(label()).toBe('Heavy Duty')
    expect(count()).toBe('2 of 3')
    expect(bar().textContent).toContain('Steel grey and safety yellow')
    expect(shownSrc(app)).toMatch(/\/preview\/charlies\/draft\/home-heavy-duty$/)

    await step(next)
    expect(label()).toBe('Family')
    expect(count()).toBe('3 of 3')
    expect(next().disabled).toBe(true)

    await step(previous)
    await step(previous)
    // Current is the real page's draft, in the frame the client left.
    expect(label()).toBe('Current')
    expect(count()).toBe('1 of 3')
    expect(shownSrc(app)).toMatch(/\/preview\/charlies\/draft\/(home)?$/)
    expect(app.panel.frame).toBe(draft)
  })

  it('test_UAT_FC_BUG-205_no_choose_this_one_control_and_the_carousel_invites_the_client_to_tell_the_consultant', async () => {
    const app = await mounted()
    for (let at = 0; at < 3; at += 1) {
      expect(root.querySelector('.looks-bar__choose')).toBeNull()
      expect(root.textContent).not.toContain('Choose this one')
      expect([...bar().querySelectorAll('button')].map((b) => b.textContent)).toEqual(['‹', '›'])
      expect(bar().querySelector('.looks-bar__invite')?.textContent).toBe(
        'Tell your consultant which look you prefer, and why.',
      )
      if (at < 2) await step(next)
    }
    expect(app.panel.getMode()).toBe('view')
  })

  it('test_UAT_FC_BUG-205_with_a_look_in_the_pane_the_page_selector_names_its_real_page_and_lists_no_look', async () => {
    await mounted()
    await step(next)
    await step(next)
    expect(label()).toBe('Family')
    const options = [...select().options].map((o) => o.value)
    expect(options).toEqual(['home', 'about'])
    expect(options.some((value) => listing.find((row) => row.slug === value)?.alternative)).toBe(false)
    expect(select().value).toBe('home')
  })

  it('test_UAT_FC_BUG-205_a_link_in_the_chat_shows_the_first_look_and_a_set_chosen_from_returns_the_pane_to_its_page', async () => {
    const app = await mounted()
    const link = document.createElement('a')
    link.href = '#looks=home-looks'
    link.textContent = 'See the looks'
    app.chat.element.append(link)
    link.click()
    await settle()
    expect(app.panel.getMode()).toBe('view')
    expect(label()).toBe('Heavy Duty')
    expect(shownSrc(app)).toMatch(/\/draft\/home-heavy-duty$/)

    // The consultant chose from the set in the conversation: its looks are
    // archived, and the next listing takes the pane back to the page itself.
    for (const row of listing) if (row.alternative) row.alternative.archived = true
    ;(app.panel.frame as HTMLIFrameElement).dispatchEvent(new Event('load'))
    await settle()
    expect(shownSrc(app)).toMatch(/\/draft\/home$/)
    expect(lit()).toBe(false)
  })
})
