// @vitest-environment jsdom
/**
 * [[BUG-209]] — **the progress banner is a segmented bar**, not a line of text:
 * titled `Progress` (no colon), one bordered box per stage with no `|` anywhere,
 * the state colouring only its own box, and the boxes sharing the full width of
 * the panel on one line.
 *
 * THE REAL BUILDER, mounted in jsdom against the installed `webui-*` components,
 * with the plan transport replaced (as the REQ-398 suite does). The builder's own
 * stylesheet is loaded into the document, so the layout asserted is what the
 * shipped CSS says, read back through `getComputedStyle`. jsdom does no layout, so
 * "fills the width" is asserted as the flex rules that make it so.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import planSeed from '../tools/generate/src/cli/ai/plan-seed.json'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-209 progress-bar suites skipped: ${WEBUI_SKIP_REASON}`)

const CSS = readFileSync(path.resolve(__dirname, '../apps/control-app/src/builder/builder.css'), 'utf8')
const SITES = [{ site: 'alpha', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

const SEED = planSeed.stages as { id: string; label: string; about: string }[]
const stages = (states: Record<number, string>) =>
  SEED.map((s, i) => ({ id: s.id, label: s.label, about: s.about, state: states[i + 1] ?? 'not_started' }))

const chatTransport = {
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

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
  document.head.replaceChildren()
  document.body.replaceChildren()
  const style = document.createElement('style')
  style.textContent = CSS
  document.head.append(style)
  root = document.createElement('div')
  document.body.append(root)
})

async function mount(view: Record<string, unknown>) {
  const planTransport = {
    fetchPlan: async () => view,
    answerAsk: async () => view,
    uploadMaterial: async () => ({ uid: 'material-1' }),
  }
  const app = mountBuilder(root, { sites: SITES, planTransport, chatTransport })
  await settle()
  return app
}

const banner = (app: Handle) => app.planPanel.element.querySelector('.plan-stages') as HTMLElement
const boxes = (app: Handle) => [...banner(app).querySelectorAll('.plan-stage')] as HTMLElement[]
const px = (v: string) => Number.parseFloat(v) || 0

/** Every rule in the shipped stylesheet whose selector names a stage element. */
const stageRules = () => {
  const sheet = document.styleSheets[0] as CSSStyleSheet
  const out: CSSStyleRule[] = []
  const walk = (rules: CSSRuleList) => {
    for (const rule of [...rules]) {
      if ('cssRules' in rule && !(rule instanceof CSSStyleRule)) walk((rule as CSSGroupingRule).cssRules)
      else if (rule instanceof CSSStyleRule && /plan-stage/.test(rule.selectorText)) out.push(rule)
    }
  }
  walk(sheet.cssRules)
  return out
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-209 — the progress banner is a segmented bar', () => {
  it('test_UAT_FC_BUG-209_the_title_reads_progress_with_no_colon', async () => {
    const app = await mount({ stages: stages({ 1: 'done', 2: 'in_progress' }), asks: [] })
    const title = banner(app).querySelector('.plan-stages__title') as HTMLElement
    expect(title.textContent).toBe('Progress')
    // A LABEL AT THE LEFT OF THE BAR: first in the banner, and it never gives up width.
    expect(banner(app).firstElementChild).toBe(title)
    expect(getComputedStyle(title).flexShrink).toBe('0')
  })

  it('test_UAT_FC_BUG-209_no_pipe_character_appears_in_text_or_generated_content', async () => {
    const app = await mount({ stages: stages({ 2: 'done', 4: 'in_progress' }), asks: [] })
    expect(banner(app).textContent).not.toContain('|')
    // NO GENERATED SEPARATOR on any stage — deleted, not hidden.
    for (const rule of stageRules()) {
      expect(rule.selectorText).not.toMatch(/::?(before|after)/)
      expect(rule.style.getPropertyValue('content')).not.toContain('|')
    }
    for (const box of boxes(app)) {
      expect(getComputedStyle(box, '::before').getPropertyValue('content')).not.toContain('|')
    }
  })

  it('test_UAT_FC_BUG-209_each_stage_is_its_own_box_and_its_state_colours_only_that_box', async () => {
    const app = await mount({ stages: stages({ 2: 'done', 4: 'in_progress' }), asks: [] })
    const items = boxes(app)
    expect(items).toHaveLength(SEED.length)
    for (const box of items) {
      const style = getComputedStyle(box)
      // A BORDERED, ROUNDED BOX with its number centred.
      expect(style.borderTopStyle).toBe('solid')
      expect(px(style.borderTopWidth)).toBeGreaterThan(0)
      expect(px(style.borderRadius || style.borderTopLeftRadius)).toBeGreaterThan(0)
      expect(style.justifyContent).toBe('center')
      // NOTHING BUT THE STAGE'S OWN PARTS INSIDE IT — no divider, no sibling.
      for (const child of [...box.children]) expect(child.className).toMatch(/^plan-stage__/)
    }
    // THE BOXES STAND APART: a gap between them that no box paints.
    const list = banner(app).querySelector('.plan-stages__list') as HTMLElement
    expect(px(getComputedStyle(list).columnGap || getComputedStyle(list).gap)).toBeGreaterThan(0)
    expect(getComputedStyle(list).backgroundColor).toMatch(/^(transparent|rgba\(0, 0, 0, 0\))?$/)

    // THE STATE FILLS ITS OWN BOX: skipped, done and in progress filled, not started left open.
    const fill = (i: number) => getComputedStyle(items[i]).getPropertyValue('--stage-fill').trim()
    const [skipped, done, , inProgress, notStarted] = [0, 1, 2, 3, 4].map(fill)
    expect(notStarted).toBe('transparent')
    for (const f of [skipped, done, inProgress]) expect(f).not.toBe('transparent')
    expect(new Set([skipped, done, inProgress]).size).toBe(3)
    expect(getComputedStyle(items[3]).background).toContain('var(--stage-fill)')
  })

  it('test_UAT_FC_BUG-209_the_boxes_share_the_full_width_on_one_line_and_the_current_one_takes_more', async () => {
    const app = await mount({ stages: stages({ 1: 'done', 2: 'done', 3: 'in_progress' }), asks: [] })
    const panel = app.planPanel.element as HTMLElement
    const bar = banner(app)
    const list = bar.querySelector('.plan-stages__list') as HTMLElement
    const panelStyle = getComputedStyle(panel)
    const barStyle = getComputedStyle(bar)

    // EDGE TO EDGE: the banner's negative margins cancel the panel's padding on both sides,
    // whatever width the panel is.
    expect(px(barStyle.marginLeft)).toBe(-px(panelStyle.paddingLeft))
    expect(px(barStyle.marginRight)).toBe(-px(panelStyle.paddingRight))
    // THE LIST TAKES ALL THE ROW AFTER THE TITLE, and the boxes all of the list.
    expect(getComputedStyle(list).flexGrow).toBe('1')
    const items = boxes(app)
    for (const box of items) expect(Number(getComputedStyle(box).flexGrow)).toBeGreaterThan(0)
    // THE ONE IN PROGRESS TAKES MORE, sized from its name, which ellipsises when it cannot fit.
    const current = items[2]
    const others = items.filter((b) => b !== current)
    for (const box of others) {
      expect(Number(getComputedStyle(current).flexGrow)).toBeGreaterThan(Number(getComputedStyle(box).flexGrow))
    }
    expect(getComputedStyle(current).flexBasis).toBe('auto')
    expect(px(getComputedStyle(current).minWidth)).toBe(0)
    const label = current.querySelector('.plan-stage__label') as HTMLElement
    expect(getComputedStyle(label).textOverflow).toBe('ellipsis')
    // ONE LINE at any width: nothing wraps, and the list clips rather than growing a second row.
    expect(barStyle.whiteSpace).toBe('nowrap')
    expect(getComputedStyle(list).flexWrap).not.toBe('wrap')
    expect(getComputedStyle(list).overflow).toBe('hidden')
  })
})
