import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import Header from '../packages/framework/src/modules/header/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { heroMeta } from '../packages/framework/src/modules/hero/meta'
import { headerMeta } from '../packages/framework/src/modules/header/meta'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * UATs for REQ-28 — three small module dials driven by the gigabytealchemy
 * import (REQ-20), consolidated into one ticket (subsumes REQ-29, REQ-30):
 *
 *   1. `hero` heading colour treatment (REQ-28) — heading colour is now expressed
 *      on the `heading` styled run's `color`/`gradient` (REQ-50). The former
 *      `headingTreatment` dial (`plain`/`accent`/`gold`) is removed; the tests
 *      are rewritten to assert the resolved inline `style` on the heading element.
 *   2. `header` content alignment (REQ-29) — an `align` dial (`left`/`center`)
 *      that groups the wordmark/nav centrally.
 *   3. `services-grid` stacked variant (REQ-30) — a full-width single-column
 *      layout at every breakpoint.
 *
 * All three are structural dials/variants; no raw CSS enters the site def.
 *
 * REQ-50 migration: `headingTreatment` dial and its CSS classes (`treatment-gold`
 * etc.) removed from hero. Hero heading colour is now a styled run. `logo: string`
 * removed from header; string wordmarks are now `wordmark: TextRun`.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(
    Component as Parameters<Container['renderToString']>[0],
    { props: props as Record<string, unknown> },
  )
}

describe('REQ-28 module dials — meta', () => {
  // REQ-50: headingTreatment dial removed from hero — heading colour lives on the
  // `heading` styled run. The old meta assertion is deleted; structural dials remain.

  it('test_UAT_FC_REQ-28_header_meta_exposes_align_dial', () => {
    expect(headerMeta.dials.align).toContain('left')
    expect(headerMeta.dials.align).toContain('center')
  })

  it('test_UAT_FC_REQ-28_services_grid_meta_exposes_stacked_variant', () => {
    expect(servicesGridMeta.variants).toContain('stacked')
  })

  it('test_UAT_FC_REQ-28_hero_meta_exposes_structural_heading_dials', () => {
    // Structural dials kept post-REQ-50: headingCase (letter-case) + align are
    // the remaining structural heading-level controls.
    expect(heroMeta.dials.headingCase).toContain('normal')
    expect(heroMeta.dials.headingCase).toContain('upper')
    // headingTreatment no longer exists on the meta.
    expect('headingTreatment' in heroMeta.dials).toBe(false)
  })
})

describe('REQ-28 hero heading colour (REQ-50 styled run)', () => {
  // REQ-50: gold heading is now a gradient on the `heading` run, not a dial class.
  // The heading run's `gradient` resolves to `background-clip: text; color: transparent`.

  it('test_UAT_FC_REQ-28_hero_renders_gold_gradient_on_heading_run', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { surface: 'inverse' },
      content: {
        // Gold gradient heading — same stops as the gigabytealchemy wordmark.
        heading: {
          text: 'Gigabyte Alchemy',
          gradient: { angleDeg: 90, stops: ['#f5e6a3', '#fbba72'] },
        },
      },
    })
    // The heading renders with the resolved gradient inline style.
    expect(html).toContain('Gigabyte Alchemy')
    expect(html).toContain('background-clip: text')
    expect(html).toContain('color: transparent')
    // The gradient image carries the two gold stops.
    expect(html).toContain('#f5e6a3')
    expect(html).toContain('#fbba72')
  })

  it('test_UAT_FC_REQ-28_hero_heading_without_run_style_has_no_gradient', async () => {
    // A plain heading run (text only, no colour/gradient) renders the heading
    // without any inline gradient — the surface text colour applies from CSS.
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: { text: 'Acme' } },
    })
    expect(html).toContain('Acme')
    expect(html).not.toContain('background-clip: text')
    expect(html).not.toContain('color: transparent')
    // No treatment-* CSS class emitted (REQ-50: removed mechanism).
    expect(html).not.toContain('treatment-')
  })
})

describe('REQ-28 header alignment', () => {
  it('test_UAT_FC_REQ-28_header_renders_centered_alignment', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: { align: 'center' },
      // REQ-50: string logo replaced by wordmark run.
      content: { wordmark: { text: 'GIGABYTE ALCHEMY' }, entries: [] },
    })
    expect(html).toContain('align-center')
  })

  it('test_UAT_FC_REQ-28_header_defaults_to_left_alignment', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: {},
      content: { wordmark: { text: 'Acme' }, entries: [] },
    })
    expect(html).toContain('align-left')
  })
})

describe('REQ-28 services-grid stacked variant', () => {
  it('test_UAT_FC_REQ-28_services_grid_renders_stacked_variant', async () => {
    const html = await render(ServicesGrid, {
      variant: 'stacked',
      dials: {},
      content: {
        items: [
          { title: { text: 'One' }, body: 'First.' },
          { title: { text: 'Two' }, body: 'Second.' },
        ],
      },
    })
    expect(html).toContain('variant-stacked')
  })
})

describe('REQ-28 module dials — render pipeline', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req28-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-28_render_pipeline_applies_all_three_dials', async () => {
    cmdNew('acme', { cwd })
    const draft = path.join(cwd, 'storage', 'sites', 'acme', 'draft')

    // Wire the three capabilities onto the scaffold: gold-gradient hero heading
    // (via run.gradient, REQ-50), centered header, and a stacked services-grid.
    const home = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))
    const header = home.modules.find((m: { type: string }) => m.type === 'header')
    // REQ-50: upgrade header to v2, replace string logo with wordmark run.
    header.version = 2
    header.dials = { align: 'center' }
    header.content = { wordmark: { text: 'acme' }, entries: [] }

    const hero = home.modules.find((m: { type: string }) => m.type === 'hero')
    // REQ-50: upgrade hero to v2, use styled runs; gold via heading.gradient.
    hero.version = 2
    hero.dials = { surface: 'inverse' }
    hero.content = {
      heading: {
        text: 'Gigabyte Alchemy',
        gradient: { angleDeg: 90, stops: ['#f5e6a3', '#fbba72'] },
      },
    }

    home.modules.push({
      id: 'building',
      type: 'services-grid',
      version: 2,
      variant: 'stacked',
      dials: {},
      content: {
        items: [
          { title: { text: 'Alpha' }, body: 'First card.' },
          { title: { text: 'Beta' }, body: 'Second card.' },
        ],
      },
    })
    writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(home))

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // Gold gradient heading: REQ-50 emits inline style, not treatment CSS class.
    expect(html).toContain('background-clip: text')
    expect(html).toContain('color: transparent')
    // The gold stop colours are present in the gradient declaration.
    expect(html).toContain('#f5e6a3')

    // Header align-center and services-grid variant-stacked reach the markup.
    expect(html).toContain('align-center')
    expect(html).toContain('variant-stacked')

    // The scoped CSS for the stacked grid single-column rule is emitted.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toMatch(
      /\.services-grid\.variant-stacked\s+\.services-grid__cards\s*\{\s*grid-template-columns: 1fr/,
    )
  })
})
