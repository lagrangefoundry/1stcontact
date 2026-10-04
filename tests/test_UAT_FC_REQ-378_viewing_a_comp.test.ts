// @vitest-environment jsdom
/**
 * [[REQ-378]] — **the comp board on the plan panel, and a comp viewed in the
 * preview pane.**
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes. What is read for
 * evidence is what the client would see — the board's entries, the pane's banner,
 * the picture's address, which toolbar controls exist — and what reached the
 * transport. The views fed in are the shape `/api/plan` answers; the server half
 * is the workers suite's.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-378 viewer suites skipped: ${WEBUI_SKIP_REASON}`)

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
  title: `Plumber ${n}`,
  url: `https://plumber${n}.test/`,
  source: 'consultant',
  added_at: '2026-10-03T00:00:00.000Z',
  likes: [],
  dislikes: [],
  motion: null,
  desktop: 'screenshot-1280.png',
  phone: 'screenshot-375.png',
  ...extra,
})

const VIEW = {
  phase: 'intake',
  asks: [],
  comps: [
    comp(1, { likes: ['phone number in three places'], motion: 'Motion: uses animation (entrance or scroll-in) on 3 elements, which a screenshot does not show.' }),
    comp(2, { source: 'client' }),
  ],
}

function planTransport(view: Record<string, unknown> = VIEW) {
  const calls = { comps: [] as Record<string, unknown>[] }
  return {
    calls,
    fetchPlan: async () => view,
    answerAsk: async () => view,
    uploadMaterial: async () => ({ uid: 'material-1' }),
    compAction: async (body: Record<string, unknown>) => {
      calls.comps.push(body)
      return view
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

async function mounted(plan = planTransport(), storage = memoryStorage()): Promise<Handle> {
  const app = mountBuilder(root, { sites: SITES, storage, chatTransport: chatTransport(), planTransport: plan })
  await settle()
  return app
}

const entry = (app: Handle, n: number): HTMLElement =>
  app.planPanel.element.querySelector(`.plan-comp[data-reference="reference-${n}"]`)

const viewer = (app: Handle): HTMLElement | null => app.panel.element.querySelector('.comp-viewer')

describe.skipIf(!WEBUI_INSTALLED)('REQ-378 — the comp board on the plan panel', () => {
  it('test_UAT_FC_REQ-378_the_board_shows_each_comp_with_its_hero_source_and_notes_and_the_client_adds_and_notes', async () => {
    const plan = planTransport()
    const app = await mounted(plan)
    const panelText = app.planPanel.element.textContent ?? ''
    expect(panelText).toContain("Sites we're comparing")

    // Each entry: the hero thumbnail from the capture, its name, and who added it.
    const first = entry(app, 1)
    const thumb = first.querySelector('img.plan-comp__thumb') as HTMLImageElement
    expect(thumb.getAttribute('src')).toContain('uid=reference-1')
    expect(thumb.getAttribute('src')).toContain('member=screenshot-1280.png')
    expect(first.textContent).toContain('Plumber 1')
    expect(first.textContent).toContain('Suggested')
    expect(entry(app, 2).textContent).toContain('You added')
    expect((first.querySelector('textarea.plan-comp__likes') as HTMLTextAreaElement).value).toBe('phone number in three places')

    // The client adds a site by its address…
    const url = app.planPanel.element.querySelector('input.plan-comps__url') as HTMLInputElement
    url.value = 'https://another.test/'
    ;(app.planPanel.element.querySelector('form.plan-comps__add') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    )
    // …and edits their dislikes, saved when they leave the box, one per line.
    const dislikes = entry(app, 2).querySelector('textarea.plan-comp__dislikes') as HTMLTextAreaElement
    dislikes.value = 'too many coupons\n\nstock photos'
    dislikes.dispatchEvent(new Event('change'))
    await settle()
    expect(plan.calls.comps).toEqual([
      { site: 'alpha', action: 'add', url: 'https://another.test/' },
      { site: 'alpha', action: 'note', reference: 'reference-2', dislikes: ['too many coupons', 'stock photos'] },
    ])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-378 — viewing a comp in the preview pane', () => {
  it('test_UAT_FC_REQ-378_opening_a_comp_shows_its_screenshot_in_a_separate_mode_with_no_edit_or_publish', async () => {
    const app = await mounted()
    const draftFrame = app.panel.frame as HTMLIFrameElement
    expect(app.toolbar.ids()).toContain('publish')

    ;(entry(app, 1).querySelector('button.plan-comp__open') as HTMLButtonElement).click()
    await settle()

    // A clearly separate mode: the banner names the site.
    expect(app.panel.getMode()).toBe('comp')
    const shown = viewer(app)!
    expect(shown.textContent).toContain('Viewing: Plumber 1')
    expect(shown.querySelector('.comp-viewer__back')?.textContent).toBe('Back to your draft')
    // The capture's screenshot — never an iframe of the site, never its HTML.
    const shot = shown.querySelector('img.comp-viewer__shot') as HTMLImageElement
    expect(shot.getAttribute('src')).toContain('uid=reference-1')
    expect(shot.getAttribute('src')).toContain('member=screenshot-1280.png')
    expect(shown.querySelector('iframe')).toBeNull()
    expect(draftFrame.classList.contains('builder-panel__frame')).toBe(false)

    // NOTHING HERE CAN EDIT OR PUBLISH: the toolbar offers none of it.
    expect(app.toolbar.ids()).toEqual([])
    expect(app.toolbar.element.querySelector('[data-action="publish"]')).toBeNull()

    // Visit the live site opens it in a new tab; the motion line is said in words.
    const visit = shown.querySelector('a.comp-viewer__visit') as HTMLAnchorElement
    expect(visit.getAttribute('href')).toBe('https://plumber1.test/')
    expect(visit.target).toBe('_blank')
    expect(shown.textContent).toContain("doesn't show animation")
    expect(shown.textContent).toContain('animation (entrance or scroll-in) on 3 elements')

    // Previous and next move between comps.
    expect((shown.querySelector('.comp-viewer__prev') as HTMLButtonElement).disabled).toBe(true)
    ;(shown.querySelector('.comp-viewer__next') as HTMLButtonElement).click()
    expect(viewer(app)!.textContent).toContain('Viewing: Plumber 2')
  })

  it('test_UAT_FC_REQ-378_the_desktop_phone_toggle_switches_between_the_capture_screenshots', async () => {
    const app = await mounted()
    ;(entry(app, 1).querySelector('button.plan-comp__open') as HTMLButtonElement).click()
    await settle()
    const phone = viewer(app)!.querySelector('button.comp-viewer__width[data-width="phone"]') as HTMLButtonElement
    phone.click()
    const shot = viewer(app)!.querySelector('img.comp-viewer__shot') as HTMLImageElement
    expect(shot.getAttribute('src')).toContain('member=screenshot-375.png')
    expect(
      viewer(app)!.querySelector('button.comp-viewer__width[data-width="phone"]')!.getAttribute('aria-pressed'),
    ).toBe('true')
    ;(viewer(app)!.querySelector('button.comp-viewer__width[data-width="desktop"]') as HTMLButtonElement).click()
    expect((viewer(app)!.querySelector('img.comp-viewer__shot') as HTMLImageElement).getAttribute('src')).toContain(
      'member=screenshot-1280.png',
    )
  })

  it('test_UAT_FC_REQ-378_back_to_your_draft_restores_the_draft_at_the_page_it_was_on', async () => {
    const storage = memoryStorage()
    const app = await mounted(planTransport(), storage)
    app.panel.setMode('edit')
    await settle()
    const editFrame = app.panel.frame as HTMLIFrameElement
    const editSrc = editFrame.getAttribute('src')

    ;(entry(app, 2).querySelector('button.plan-comp__open') as HTMLButtonElement).click()
    await settle()
    expect(app.panel.getMode()).toBe('comp')
    ;(viewer(app)!.querySelector('.comp-viewer__back') as HTMLButtonElement).click()
    await settle()

    // The same channel, the same frame, never re-navigated: the page it was on.
    expect(app.panel.getMode()).toBe('edit')
    expect(app.panel.frame).toBe(editFrame)
    expect(editFrame.getAttribute('src')).toBe(editSrc)
    expect(editFrame.classList.contains('builder-panel__frame')).toBe(true)
    expect(app.toolbar.ids()).toContain('publish')
    // The viewing mode is never remembered, nor offered by the mode toggle.
    expect([...storage.map.values()]).not.toContain('comp')
    expect(app.toolbar.element.querySelector('[data-mode="comp"]')).toBeNull()
  })
})
