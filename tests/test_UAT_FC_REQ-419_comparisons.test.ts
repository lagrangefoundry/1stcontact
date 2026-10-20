// @vitest-environment jsdom
/**
 * [[REQ-419]] — **Comparisons: a preview mode of site tiles that open the real
 * sites**, replacing the comp viewer and the panel's comp board.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes. What is read for
 * evidence is what the client would see — the mode toggle's buttons, the tiles and
 * their links, the panel's items, the progress bar's explanation — and what
 * reached the transport. The views fed in are the shape `/api/plan` answers.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
type View = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-419 Comparisons suites skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'alpha', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
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

const comp = (n: number, extra: Record<string, unknown> = {}) => ({
  reference: `reference-${n}`,
  title: `Salon ${n}`,
  url: `https://www.salon${n}.test/`,
  source: 'consultant',
  added_at: '2026-10-20T00:00:00.000Z',
  likes: [],
  dislikes: [],
  motion: null,
  desktop: 'screenshot-1280.png',
  phone: 'screenshot-375.png',
  ...extra,
})

const STAGES = [
  { id: 'know_you', label: 'Getting to know you', about: 'We learn about your business.', state: 'done' },
  { id: 'other_sites', label: 'Looking at other sites', about: 'We look at sites you like.', state: 'in_progress' },
  { id: 'first_draft', label: 'First draft', about: 'A first version.', state: 'not_started' },
]

const raised = (extra: View = {}): View => ({
  phase: 'intake',
  drafted: true,
  stages: STAGES,
  asks: [],
  comps_raised: true,
  comps_status: 'open',
  comps: [comp(1, { likes: ['the big photos'] }), comp(2, { source: 'client' })],
  ...extra,
})

const notRaised = (): View => ({ phase: 'intake', drafted: true, stages: STAGES, asks: [], comps_raised: false, comps: [] })

/** A plan origin: serves the view, answers each comp write with the view as stored. */
function planTransport(initial: View) {
  let current = initial
  const calls = { comps: [] as Record<string, unknown>[] }
  return {
    calls,
    set: (next: View) => {
      current = next
    },
    fetchPlan: async () => current,
    answerAsk: async () => current,
    uploadMaterial: async () => ({ uid: 'material-1' }),
    compAction: async (body: Record<string, any>) => {
      calls.comps.push(body)
      if (body.action === 'add') current = { ...current, comps: [...current.comps, comp(9, { title: 'Another', url: body.url, source: 'client' })] }
      if (body.action === 'finish') current = { ...current, comps_finished: true }
      return current
    },
  }
}

const chatTransport = () => ({
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
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
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

async function mounted(plan: ReturnType<typeof planTransport>, storage = memoryStorage()): Promise<Handle> {
  const app = mountBuilder(root, { sites: SITES, storage, chatTransport: chatTransport(), planTransport: plan })
  await settle()
  return app
}

const modeButtons = (app: Handle): HTMLButtonElement[] => [
  ...app.toolbar.element.querySelectorAll<HTMLButtonElement>('.builder-toolbar__modes button'),
]
const modeLabels = (app: Handle): string[] => modeButtons(app).map((b) => b.textContent ?? '')
const toggle = (app: Handle, label: string) => modeButtons(app).find((b) => b.textContent === label)!
const tile = (app: Handle, n: number): HTMLElement =>
  app.comparisons.element.querySelector(`.comp-tile[data-reference="reference-${n}"]`)

async function toComparisons(app: Handle): Promise<void> {
  toggle(app, 'Comparisons').click()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-419 — Comparisons is a mode on the toggle', () => {
  it('test_UAT_FC_REQ-419_comparisons_appears_after_story_only_once_the_comps_are_raised', async () => {
    const plan = planTransport(notRaised())
    const app = await mounted(plan)
    expect(modeLabels(app)).toEqual(['View', 'Edit', 'Story'])

    // The consultant raises the comps (ask_comps, or the first add_comp).
    plan.set(raised())
    await app.planPanel.refresh()
    await settle()
    expect(modeLabels(app)).toEqual(['View', 'Edit', 'Story', 'Comparisons'])
  })

  it('test_UAT_FC_REQ-419_comparisons_is_switched_to_and_away_and_remembered_with_no_back_to_your_draft', async () => {
    const storage = memoryStorage()
    const app = await mounted(planTransport(raised()), storage)
    await toComparisons(app)
    expect(app.panel.getMode()).toBe('comparisons')
    expect(toggle(app, 'Comparisons').getAttribute('aria-pressed')).toBe('true')
    // Like Story: only the toggle — no edit, pages, colours or Publish.
    expect(app.toolbar.ids()).toEqual(['mode-toggle'])
    // No way out but the toggle.
    expect(root.textContent).not.toContain('Back to your draft')

    toggle(app, 'Edit').click()
    await settle()
    expect(app.panel.getMode()).toBe('edit')
    await toComparisons(app)
    expect(app.panel.getMode()).toBe('comparisons')

    // Remembered like the others: a reload opens it again.
    expect([...storage.map.values()]).toContain('comparisons')
    app.destroy()
    root.replaceChildren()
    const again = await mounted(planTransport(raised()), storage)
    expect(again.panel.getMode()).toBe('comparisons')
    expect(modeLabels(again)).toContain('Comparisons')
  })

  it('test_UAT_FC_REQ-419_the_questions_panel_has_no_sites_were_comparing_item', async () => {
    const app = await mounted(planTransport(raised()))
    const panelText = app.planPanel.element.textContent ?? ''
    expect(panelText).not.toContain("Sites we're comparing")
    expect(app.planPanel.element.querySelector('[data-comps], .comp-tile, input[type="url"]')).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-419 — the tiles', () => {
  it('test_UAT_FC_REQ-419_every_comp_is_a_tile_with_a_thumbnail_name_address_source_and_notes_and_no_carousel', async () => {
    const app = await mounted(planTransport(raised()))
    await toComparisons(app)
    const grid = app.panel.element.querySelector('.comparisons') as HTMLElement
    expect(grid).toBeTruthy()
    expect(grid.querySelectorAll('.comp-tile')).toHaveLength(2)
    // All at once: no previous/next.
    expect(grid.querySelector('.builder-carousel, .builder-carousel__next, .builder-carousel__prev')).toBeNull()
    // The line inviting the client to open each site, and nothing claiming the picture shows how it works.
    expect(grid.querySelector('.comparisons__intro')?.textContent).toContain('Open each site and have a look around')

    const first = tile(app, 1)
    const thumb = first.querySelector('img.comp-tile__thumb') as HTMLImageElement
    expect(thumb.getAttribute('src')).toContain('uid=reference-1')
    expect(thumb.getAttribute('src')).toContain('member=screenshot-1280.png')
    expect(first.querySelector('.comp-tile__title')?.textContent).toBe('Salon 1')
    expect(first.querySelector('.comp-tile__address')?.textContent).toBe('salon1.test')
    expect(first.textContent).toContain('Suggested')
    expect(tile(app, 2).textContent).toContain('You added')
    expect((first.querySelector('textarea.comp-tile__likes') as HTMLTextAreaElement).value).toBe('the big photos')
    expect(first.querySelector('.comp-tile__done')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-419_the_thumbnail_and_open_the_site_open_the_real_site_in_a_new_tab_only_for_http', async () => {
    const plan = planTransport(raised({ comps: [comp(1), comp(3, { url: 'javascript:alert(1)' })] }))
    const app = await mounted(plan)
    await toComparisons(app)
    const first = tile(app, 1)
    const links = [first.querySelector('a.comp-tile__shot'), first.querySelector('a.comp-tile__visit')] as HTMLAnchorElement[]
    expect(links[1].textContent).toBe('Open the site ↗')
    for (const link of links) {
      expect(link.getAttribute('href')).toBe('https://www.salon1.test/')
      expect(link.target).toBe('_blank')
      expect(link.rel.split(' ')).toContain('noopener')
    }
    // The thumbnail is inside the link.
    expect(links[0].querySelector('img.comp-tile__thumb')).toBeTruthy()
    // A non-http(s) address becomes no link at all.
    expect(tile(app, 3).querySelector('a')).toBeNull()
  })

  it('test_UAT_FC_REQ-419_a_comp_with_no_usable_picture_is_still_a_full_tile_with_name_address_link_and_notes', async () => {
    const plan = planTransport(raised({ comps: [comp(1, { desktop: null, phone: null }), comp(2)] }))
    const app = await mounted(plan)
    await toComparisons(app)
    const bare = tile(app, 1)
    expect(bare.querySelector('img')).toBeNull()
    const card = bare.querySelector('a.comp-tile__shot .comp-tile__card') as HTMLElement
    expect(card.querySelector('.comp-tile__card-name')?.textContent).toBe('Salon 1')
    expect(card.querySelector('.comp-tile__card-address')?.textContent).toBe('salon1.test')
    expect(bare.querySelector('a.comp-tile__visit')?.getAttribute('href')).toBe('https://www.salon1.test/')
    expect(bare.querySelector('textarea.comp-tile__likes')).toBeTruthy()
    expect(bare.querySelector('textarea.comp-tile__dislikes')).toBeTruthy()

    // A picture that will not load is a bad picture too.
    const img = tile(app, 2).querySelector('img.comp-tile__thumb') as HTMLImageElement
    img.dispatchEvent(new Event('error'))
    expect(tile(app, 2).querySelector('img')).toBeNull()
    expect(tile(app, 2).querySelector('.comp-tile__card-name')?.textContent).toBe('Salon 2')
  })

  it('test_UAT_FC_REQ-419_notes_done_finished_and_add_a_site_go_through_the_same_route', async () => {
    const plan = planTransport(raised())
    const app = await mounted(plan)
    await toComparisons(app)

    // Likes and dislikes, edited in place and stored with the tile's Done.
    const second = tile(app, 2)
    ;(second.querySelector('textarea.comp-tile__likes') as HTMLTextAreaElement).value = 'warm colours'
    ;(second.querySelector('textarea.comp-tile__dislikes') as HTMLTextAreaElement).value = 'too many popups\n\nstock photos'
    ;(second.querySelector('.comp-tile__done') as HTMLButtonElement).click()
    await settle()

    // Add a site you know, by its address: a new tile.
    const url = app.comparisons.element.querySelector('input.comparisons__url') as HTMLInputElement
    url.value = 'https://another.test/'
    ;(app.comparisons.element.querySelector('form.comparisons__add') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    )
    await settle()
    expect(app.comparisons.element.querySelectorAll('.comp-tile')).toHaveLength(3)

    // "I've finished commenting" tells the consultant.
    ;(app.comparisons.element.querySelector('.comparisons__finish') as HTMLButtonElement).click()
    await settle()
    expect(plan.calls.comps).toEqual([
      { site: 'alpha', action: 'note', reference: 'reference-2', likes: ['warm colours'], dislikes: ['too many popups', 'stock photos'] },
      { site: 'alpha', action: 'add', url: 'https://another.test/' },
      { site: 'alpha', action: 'finish' },
    ])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-419 — the ways in', () => {
  it('test_UAT_FC_REQ-419_a_comp_shown_in_chat_switches_to_comparisons_with_its_tile_in_view', async () => {
    const app = await mounted(planTransport(raised()))
    expect(app.panel.getMode()).toBe('view')
    const link = document.createElement('a')
    link.setAttribute('href', '#show=comp&comp=reference-2')
    app.chat.element.append(link)
    link.click()
    await settle()
    expect(app.panel.getMode()).toBe('comparisons')
    expect(tile(app, 2).classList.contains('comp-tile--shown')).toBe(true)
    expect(tile(app, 1).classList.contains('comp-tile--shown')).toBe(false)
  })

  it('test_UAT_FC_REQ-419_the_looking_at_other_sites_explanation_links_to_comparisons_and_the_stage_never_changes', async () => {
    const app = await mounted(planTransport(raised()))
    const stage = app.planPanel.element.querySelector('.plan-stage[data-stage="other_sites"]') as HTMLElement
    stage.click()
    const tip = app.planPanel.element.querySelector('.plan-stages__tip') as HTMLElement
    expect(tip.hidden).toBe(false)
    const link = tip.querySelector('.plan-stages__tip-link') as HTMLButtonElement
    expect(link.textContent).toBe("See the sites we're comparing")
    link.click()
    await settle()
    expect(app.panel.getMode()).toBe('comparisons')
    // The progress bar is never changed by a click.
    const after = app.planPanel.element.querySelector('.plan-stage[data-stage="other_sites"]') as HTMLElement
    expect(after.dataset.state).toBe('in_progress')

    // Another stage's explanation has no such link.
    ;(app.planPanel.element.querySelector('.plan-stage[data-stage="first_draft"]') as HTMLElement).click()
    expect(tip.querySelector('.plan-stages__tip-link')).toBeNull()
  })

  it('test_UAT_FC_REQ-419_a_site_whose_comps_were_never_raised_does_not_open_in_comparisons', async () => {
    // The client last left another site in Comparisons; this one's comps were never raised.
    const storage = memoryStorage()
    const before = await mounted(planTransport(raised()), storage)
    await toComparisons(before)
    before.destroy()
    root.replaceChildren()
    const app = await mounted(planTransport(notRaised()), storage)
    expect(app.panel.getMode()).not.toBe('comparisons')
    expect(modeLabels(app)).toEqual(['View', 'Edit', 'Story'])
    // And with nothing raised, the explanation has no link to a mode that is not there.
    ;(app.planPanel.element.querySelector('.plan-stage[data-stage="other_sites"]') as HTMLElement).click()
    expect(app.planPanel.element.querySelector('.plan-stages__tip-link')).toBeNull()
  })
})
