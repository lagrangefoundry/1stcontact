// @vitest-environment jsdom
/**
 * [[BUG-250]] — **the looks are a mode of their own: a Looks tab, offered only
 * while the page shown has looks, showing only the looks — no "Current" — with
 * no Edit or Colours on its toolbar, and a link back to the page as it stands.**
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes — the page listing
 * (rows shaped as `GET /api/pages` answers, `alternative` blocks included), the
 * plan panel's reads and the chat. jsdom loads no documents, so a frame's `src`
 * is the evidence of where the pane was sent, and the `view` the chat transport
 * is handed is exactly what `/api/ai/prompt` receives.
 *
 *   1  the Looks tab is on the toggle only while the page shown has looks, and
 *      goes once a look is chosen — the pane back in View on the page itself
 *   2  Looks mode steps through the looks only, with the band; its toolbar has
 *      width, phone and new tab, and no Edit-only control, Colours or Publish
 *   3  "Compare with your current page" is View on the real page, and the tab
 *      brings the client back to the look they left
 *   4  View and Edit have no carousel controls
 *   5  a message sent with Looks open reports the pane and which look
 *   6  Looks is not reopened from a previous visit
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-250 looks mode suite skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'charlies', latest: null }]
const settle = async (n = 12) => {
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
  look('home-family', 'Family', 1, 'Warm cream, the family pictured up top'),
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

function chatTransport() {
  const sent: unknown[][] = []
  return {
    sent,
    openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
    streamPrompt: async function* (...args: unknown[]) {
      sent.push(args)
      yield { kind: 'done', content: '', meta: { status: 'complete' } }
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

async function mounted(chat = chatTransport(), storage = memoryStorage()): Promise<Handle> {
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
  // jsdom has no layout; a real pane has a width, which the view report rides with.
  app.panel.viewport = () => ({ width: 1280, height: 800 })
  return app
}

const band = () => root.querySelector('.looks-band') as HTMLElement | null
const label = () => band()?.querySelector('.builder-carousel__label')?.textContent
const count = () => band()?.querySelector('.builder-carousel__count')?.textContent
const next = () => band()!.querySelector('.builder-carousel__next') as HTMLButtonElement
const looksTab = () => root.querySelector('button[data-mode="looks"]') as HTMLButtonElement | null
const compare = () => band()!.querySelector('.looks-band__compare') as HTMLButtonElement
const shownSrc = (app: Handle) => (app.panel.frame as HTMLIFrameElement).getAttribute('src') ?? ''
const select = () => root.querySelector('[data-action="pages"] select') as HTMLSelectElement

async function click(el: HTMLElement | null): Promise<void> {
  el!.click()
  await settle()
}

async function choosePage(slug: string): Promise<void> {
  select().value = slug
  select().dispatchEvent(new Event('change'))
  await settle()
}

/** Follow a link in the conversation, as the client does. */
async function followLink(app: Handle, href: string): Promise<void> {
  const link = document.createElement('a')
  link.href = href
  link.textContent = 'See the looks'
  app.chat.element.append(link)
  await click(link)
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-250 — Looks is a mode of its own', () => {
  it('test_UAT_FC_BUG-250_the_looks_tab_is_offered_only_while_the_page_shown_has_looks_and_goes_once_one_is_chosen', async () => {
    const app = await mounted()
    expect(app.panel.getMode()).toBe('view')
    expect(looksTab()?.textContent).toBe('Looks')

    await choosePage('about')
    expect(looksTab()).toBeNull()
    await choosePage('home')
    expect(looksTab()).not.toBeNull()

    await click(looksTab())
    expect(app.panel.getMode()).toBe('looks')
    expect(shownSrc(app)).toMatch(/\/preview\/charlies\/draft\/home-heavy-duty$/)

    // The consultant chose from the set: its looks are archived, and the next
    // listing takes the pane to View on the page itself, with no Looks tab.
    for (const row of listing) if (row.alternative) row.alternative.archived = true
    ;(app.panel.frame as HTMLIFrameElement).dispatchEvent(new Event('load'))
    await settle()
    expect(app.panel.getMode()).toBe('view')
    expect(shownSrc(app)).toMatch(/\/draft\/(home)?$/)
    expect(looksTab()).toBeNull()
    expect(band()).toBeNull()
  })

  it('test_UAT_FC_BUG-250_looks_mode_shows_only_the_looks_with_the_band_and_no_edit_or_colours', async () => {
    const app = await mounted()
    await click(looksTab())

    // Only the looks are positions — the draft is not one of them.
    expect([label(), count()]).toEqual(['Heavy Duty', '1 of 2'])
    expect(band()!.textContent).toContain('Steel grey and safety yellow')
    expect(band()!.textContent).toContain('Tell the consultant which look you prefer, and why.')
    expect(band()!.textContent).not.toContain('Current')
    await click(next())
    expect([label(), count()]).toEqual(['Family', '2 of 2'])
    await click(next())
    expect([label(), count()]).toEqual(['Heavy Duty', '1 of 2'])

    // No choosing control: the client tells the consultant.
    expect(root.textContent).not.toContain('Choose this one')
    expect([...band()!.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      '‹',
      '›',
      'Compare with your current page',
    ])

    // Width, phone and new tab; nothing that acts on the draft.
    expect(app.toolbar.ids()).toEqual(['mode-toggle', 'preview-width', 'open-new-tab', 'phone-preview'])
    for (const id of ['colors', 'pages', 'subject', 'mark-points', 'panels', 'publish']) {
      expect(root.querySelector(`[data-action="${id}"]`)).toBeNull()
    }
    const tab = root.querySelector('[data-action="open-new-tab"]') as HTMLElement
    expect(tab.getAttribute('data-href')).toMatch(/\/draft\/home-heavy-duty$/)
    const phone = root.querySelector('[data-action="preview-width"] button[data-width="phone"]') as HTMLButtonElement
    await click(phone)
    expect(phone.getAttribute('aria-pressed')).toBe('true')
    expect(app.panel.getMode()).toBe('looks')
    expect(root.querySelector('[data-action="phone-preview"]')).not.toBeNull()
  })

  it('test_UAT_FC_BUG-250_compare_with_your_current_page_is_view_on_the_real_page_and_the_tab_comes_back_to_the_look', async () => {
    const app = await mounted()
    // From another page entirely: the consultant's link opens Looks on the set.
    await choosePage('about')
    await followLink(app, '#looks=home-looks')
    expect(app.panel.getMode()).toBe('looks')
    expect(label()).toBe('Heavy Duty')
    await click(next())
    expect(label()).toBe('Family')

    await click(compare())
    expect(app.panel.getMode()).toBe('view')
    // The home page — the channel root serves it.
    expect(shownSrc(app)).toMatch(/\/draft\/(home)?$/)
    expect(select().value).toBe('home')
    expect(band()).toBeNull()

    // And back: the tab returns to the look the client left.
    await click(looksTab())
    expect(app.panel.getMode()).toBe('looks')
    expect(label()).toBe('Family')
    expect(shownSrc(app)).toMatch(/\/draft\/home-family$/)
  })

  it('test_UAT_FC_BUG-250_view_and_edit_have_no_carousel_controls', async () => {
    const app = await mounted()
    for (const mode of ['view', 'edit']) {
      app.panel.setMode(mode)
      await settle()
      expect(root.querySelector('.builder-carousel')).toBeNull()
      expect(band()).toBeNull()
      expect(app.toolbar.ids()).not.toContain('looks')
    }
  })

  it('test_UAT_FC_BUG-250_a_message_sent_with_looks_open_reports_the_pane_and_which_look', async () => {
    const chat = chatTransport()
    const app = await mounted(chat)
    const send = async () => {
      await app.chat.getChat().send('Which do you think?')
      await settle()
      return chat.sent[chat.sent.length - 1][2] as Record<string, unknown>
    }
    const before = await send()
    expect(before.pane).toBe('view')
    expect(before.look).toBeUndefined()
    expect(before.unopened).toContain('looks')

    await click(looksTab())
    await click(next())
    const during = await send()
    expect(during).toMatchObject({ pane: 'looks', look: 'Family' })
    expect(during.unopened).not.toContain('looks')
  })

  it('test_UAT_FC_BUG-250_looks_is_not_reopened_from_a_previous_visit', async () => {
    const storage = memoryStorage()
    const first = await mounted(chatTransport(), storage)
    await click(looksTab())
    expect(first.panel.getMode()).toBe('looks')
    first.destroy?.()
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    const again = await mounted(chatTransport(), storage)
    expect(again.panel.getMode()).toBe('view')
    expect(looksTab()).not.toBeNull()
  })
})
