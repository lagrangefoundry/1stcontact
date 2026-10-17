// @vitest-environment jsdom
/**
 * [[REQ-402]] — **the looks for a page are stepped through in a band of their
 * own across the top of the preview**: `‹ label · n of N ›` on the left, the
 * look's description in full on the right with the invitation under it, and
 * nothing at all on a page with no looks. The toolbar carries no look control.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the origin replaced at the transports it already takes (the page listing
 * and the plan panel's reads). jsdom lays nothing out, so where the band sits is
 * read from the DOM it is in — the preview's column, before the pane, outside
 * it — and how it is laid out from what `builder.css` says about it.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { rulesOf } from './support/css-rules'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const CSS = readFileSync(path.resolve(__dirname, '..', 'apps/control-app/src/builder/builder.css'), 'utf8')
const rule = (selector: string) => rulesOf(CSS, (s) => s === selector).join('\n')

/** Long enough to have been cut to one line on the toolbar. */
const LONG =
  'Warm and friendly, with the family who run the business pictured up top, a soft cream background, ' +
  'rounded buttons, hand-drawn icons beside each service and the phone number large in the header so a ' +
  'worried parent can call without scrolling — the whole page reads like a note from a neighbour.'

type Handle = Record<string, any>
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`REQ-402 looks band suite skipped: ${WEBUI_SKIP_REASON}`)

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
  look('home-family', 'Family', 1, LONG),
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

// [[REQ-402]] — the carousel moved off the toolbar into a band above the preview,
// which is absent (not dimmed) on a page with no looks, and whose arrows wrap.
const band = () => root.querySelector('.looks-band') as HTMLElement | null
const label = () => band()?.querySelector('.builder-carousel__label')?.textContent
const count = () => band()?.querySelector('.builder-carousel__count')?.textContent
const description = () => band()?.querySelector('.looks-band__description')?.textContent
const next = () => band()!.querySelector('.builder-carousel__next') as HTMLButtonElement
const previous = () => band()!.querySelector('.builder-carousel__prev') as HTMLButtonElement
const select = () => root.querySelector('[data-action="pages"] select') as HTMLSelectElement

async function choosePage(slug: string): Promise<void> {
  select().value = slug
  select().dispatchEvent(new Event('change'))
  await settle()
}

async function step(button: () => HTMLButtonElement): Promise<void> {
  button().click()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-402 — the band of looks above the preview', () => {
  it('test_UAT_FC_REQ-402_a_page_with_no_looks_has_no_band_and_the_pane_starts_at_the_top', async () => {
    const app = await mounted()
    await choosePage('about')
    expect(band()).toBeNull()
    const preview = app.panel.element.parentElement as HTMLElement
    expect(preview.classList.contains('builder-preview')).toBe(true)
    // The pane is the column's only child: nothing above it, no reserved space.
    expect([...preview.children]).toEqual([app.panel.element])
    expect(rule('.builder-preview > .builder-panel')).toMatch(/flex:\s*1 1 0/)

    // And it comes back with the page that has looks — the frame never re-parented.
    const frame = app.panel.frame
    await choosePage('home')
    expect(band()).not.toBeNull()
    expect(app.panel.frame).toBe(frame)
  })

  it('test_UAT_FC_REQ-402_the_band_sits_above_the_page_frame_not_over_it_and_spans_the_pane', async () => {
    const app = await mounted()
    const preview = app.panel.element.parentElement as HTMLElement
    // Above the pane, in the same column — not inside the pane, where it would overlay the frame.
    expect([...preview.children]).toEqual([band(), app.panel.element])
    expect(app.panel.element.contains(band())).toBe(false)
    expect(rule('.builder-preview')).toMatch(/flex-direction:\s*column/)
    expect(rule('.looks-band')).not.toMatch(/position:\s*(absolute|fixed)/)
    expect(rule('.looks-band')).toMatch(/flex:\s*0 0 auto/)
    // The description takes the rest of the band's width.
    expect(rule('.looks-band__about')).toMatch(/flex:\s*1 1 0/)
  })

  it('test_UAT_FC_REQ-402_stepping_goes_current_through_each_look_and_round_to_current', async () => {
    const app = await mounted()
    expect(label()).toBe('Current')
    expect(count()).toBe('1 of 3')
    expect(description()).toBe('Your page as it stands now.')

    await step(next)
    expect([label(), count(), description()]).toEqual(['Heavy Duty', '2 of 3', 'Steel grey and safety yellow'])
    await step(next)
    expect([label(), count(), description()]).toEqual(['Family', '3 of 3', LONG])
    // The set is a ring: › from the last look is Current again.
    expect(next().disabled).toBe(false)
    await step(next)
    expect([label(), count()]).toEqual(['Current', '1 of 3'])
    expect((app.panel.frame as HTMLIFrameElement).getAttribute('src')).toMatch(/\/draft\/(home)?$/)
    // And ‹ from Current goes round to the last.
    await step(previous)
    expect(label()).toBe('Family')
    expect(app.panel.getMode()).toBe('view')
  })

  it('test_UAT_FC_REQ-402_a_long_description_is_shown_in_full_and_wrapped', async () => {
    await mounted()
    await step(next)
    await step(next)
    const shown = band()!.querySelector('.looks-band__description') as HTMLElement
    expect(shown.textContent).toBe(LONG)
    expect(shown.textContent).not.toContain('…')
    const css = rule('.looks-band__description,.looks-band__invite,.looks-band__note')
    expect(css).toMatch(/white-space:\s*normal/)
    expect(css).not.toMatch(/text-overflow|line-clamp|nowrap/)
    expect(rule('.looks-band__about')).not.toMatch(/overflow:\s*hidden|max-height|nowrap/)
  })

  it('test_UAT_FC_REQ-402_the_instruction_under_the_description_reads_tell_the_consultant', async () => {
    await mounted()
    for (let at = 0; at < 3; at += 1) {
      const about = band()!.querySelector('.looks-band__about') as HTMLElement
      const lines = [...about.children].map((el) => el.className)
      expect(lines.indexOf('looks-band__invite')).toBe(lines.indexOf('looks-band__description') + 1)
      expect(about.querySelector('.looks-band__invite')?.textContent).toBe(
        'Tell the consultant which look you prefer, and why.',
      )
      await step(next)
    }
  })

  it('test_UAT_FC_REQ-402_the_preview_toolbar_carries_no_look_controls', async () => {
    const app = await mounted()
    for (const mode of ['view', 'edit']) {
      app.panel.setMode(mode)
      await settle()
      expect(app.toolbar.ids()).not.toContain('looks')
      const toolbar = app.toolbar.element as HTMLElement
      expect(toolbar.querySelector('.builder-carousel, .looks-band, [data-action="looks"]')).toBeNull()
      // The band is the one place looks are changed, in Edit as in View.
      expect(root.querySelectorAll('.builder-carousel')).toHaveLength(1)
      expect(band()).not.toBeNull()
    }
  })
})
