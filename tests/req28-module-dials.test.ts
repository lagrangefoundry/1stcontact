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
 *   1. `hero` heading colour treatment (REQ-28) — a `headingTreatment` dial
 *      (`plain`/`accent`/`gold`) that sets the heading colour independently of
 *      the surface text colour, so an inverse-surface hero can carry a gold
 *      heading rather than the default white.
 *   2. `header` content alignment (REQ-29) — an `align` dial (`left`/`center`)
 *      that groups the wordmark/nav centrally.
 *   3. `services-grid` stacked variant (REQ-30) — a full-width single-column
 *      layout at every breakpoint.
 *
 * All three are structured dials/variants; no raw CSS enters the site def.
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
  it('test_UAT_FC_REQ-28_hero_meta_exposes_heading_treatment_dial', () => {
    expect(heroMeta.dials.headingTreatment).toContain('plain')
    expect(heroMeta.dials.headingTreatment).toContain('accent')
    expect(heroMeta.dials.headingTreatment).toContain('gold')
  })

  it('test_UAT_FC_REQ-28_header_meta_exposes_align_dial', () => {
    expect(headerMeta.dials.align).toContain('left')
    expect(headerMeta.dials.align).toContain('center')
  })

  it('test_UAT_FC_REQ-28_services_grid_meta_exposes_stacked_variant', () => {
    expect(servicesGridMeta.variants).toContain('stacked')
  })
})

describe('REQ-28 hero heading treatment', () => {
  it('test_UAT_FC_REQ-28_hero_renders_gold_heading_treatment_over_inverse_surface', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: { surface: 'inverse', headingTreatment: 'gold' },
      content: { heading: 'Gigabyte Alchemy', subhead: 'Intentional software.' },
    })
    // The heading carries the gold treatment hook the scoped CSS clips the
    // metallic gradient to — independent of the inverse surface's text colour.
    expect(html).toMatch(
      /<h1[^>]*class="[^"]*hero__heading[^"]*treatment-gold[^"]*"[^>]*>\s*Gigabyte Alchemy\s*<\/h1>/,
    )
  })

  it('test_UAT_FC_REQ-28_hero_heading_defaults_to_plain_treatment', async () => {
    const html = await render(Hero, {
      variant: 'bg-color',
      dials: {},
      content: { heading: 'Acme', subhead: 'Body.' },
    })
    expect(html).toContain('treatment-plain')
    expect(html).not.toContain('treatment-gold')
  })
})

describe('REQ-28 header alignment', () => {
  it('test_UAT_FC_REQ-28_header_renders_centered_alignment', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: { align: 'center' },
      content: { logo: 'GIGABYTE ALCHEMY', entries: [] },
    })
    expect(html).toContain('align-center')
  })

  it('test_UAT_FC_REQ-28_header_defaults_to_left_alignment', async () => {
    const html = await render(Header, {
      variant: 'top-nav',
      dials: {},
      content: { logo: 'Acme', entries: [] },
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
          { title: 'One', body: 'First.' },
          { title: 'Two', body: 'Second.' },
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

    // Wire the three dials onto the scaffold: gold hero heading, centered header,
    // and a stacked services-grid appended to the page.
    const home = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))
    const header = home.modules.find((m: { type: string }) => m.type === 'header')
    header.dials = { ...header.dials, align: 'center' }
    const hero = home.modules.find((m: { type: string }) => m.type === 'hero')
    hero.dials = { ...hero.dials, surface: 'inverse', headingTreatment: 'gold' }
    home.modules.push({
      id: 'building',
      type: 'services-grid',
      version: 1,
      variant: 'stacked',
      dials: {},
      content: {
        heading: 'Building',
        items: [
          { title: 'Alpha', body: 'First card.' },
          { title: 'Beta', body: 'Second card.' },
        ],
      },
    })
    writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(home))

    const { outDir } = await cmdRender('acme', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // All three dials reach the rendered markup.
    expect(html).toContain('treatment-gold')
    expect(html).toContain('align-center')
    expect(html).toContain('variant-stacked')

    // The scoped CSS backing each dial is emitted: the gold gradient clip for the
    // hero heading, and the single-column rule for the stacked grid.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toMatch(/\.hero__heading\.treatment-gold\s*\{[\s\S]*background-clip: text/)
    expect(themeCss).toMatch(
      /\.services-grid\.variant-stacked\s+\.services-grid__cards\s*\{\s*grid-template-columns: 1fr/,
    )
  })
})
