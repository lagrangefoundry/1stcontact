/**
 * [[BUG-238]] — the layout check measures two craft defaults builders keep
 * getting wrong: a header whose logo or business name is too small, and a
 * heading that floats between the content above and below it instead of sitting
 * with its text.
 *
 * Each fixture is an L1 document rendered by the framework's own renderer and
 * served the way `captureL1` serves one, then checked by a real browser at
 * desktop and phone width — the same path as REQ-415's own fixtures.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { engineAvailable, createPlaywrightDriver } from '../tools/generate/src'
import { serveL1 } from '../tools/generate/src/l1'
import { checkLayoutAt, layoutLine, type LayoutFinding } from '../tools/generate/src/cli/ai/layout-check'
import layoutConfig from '../tools/generate/src/cli/ai/layout-check.json'
import priming from '../tools/generate/src/cli/ai/priming.json'

const WIDTHS = [375, 1280]
const browserOk = await engineAvailable('chromium')

function text(t: string, fontSizePx = 16, extra: Partial<L1Node> = {}): L1Node {
  return { kind: 'text', text: t, axes: { color: '#111827', fontFamily: 'Arial', fontSizePx, fontWeight: 400 }, ...extra } as L1Node
}

function link(t: string, href: string, fontSizePx = 16): L1Node {
  return text(t, fontSizePx, { link: { href } } as Partial<L1Node>)
}

function heading(t: string): L1Node {
  return text(t, 28, { heading: { level: 2 } } as Partial<L1Node>)
}

function logo(heightPx: number): L1Node {
  return {
    kind: 'image',
    src: '/assets/logo.png',
    alt: 'Logo',
    sizing: { width: { mode: 'fixed', px: heightPx }, height: { mode: 'fixed', px: heightPx } },
  } as L1Node
}

function row(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'row', gapPx: 24, children }
}

function stack(children: L1Node[], gapPx = 8): L1Node {
  return { kind: 'container', layout: 'stack', gapPx, children }
}

function page(sections: L1Node[]): L1Document {
  const doc: L1Document = {
    widths: WIDTHS,
    background: '#ffffff',
    root: { kind: 'container', layout: 'stack', gapPx: 0, children: sections },
  }
  const result = validateL1(doc)
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return doc
}

const nav = (size = 16): L1Node[] => [link('Services', '/services', size), link('Prices', '/prices', size), link('Contact', '/contact', size)]

/** A body section below the header, so the header is not the only section. */
const body = stack([text('Welcome to the salon'), text('Open six days a week')])

const closers: (() => Promise<void>)[] = []
afterEach(async () => {
  while (closers.length) await closers.pop()!()
})

async function check(doc: L1Document, sections: string[]): Promise<LayoutFinding[]> {
  const served = await serveL1(doc)
  closers.push(served.close)
  return checkLayoutAt(served.url, 'home', createPlaywrightDriver, sections)
}

const brand = (found: LayoutFinding[]) =>
  found.filter((f) => f.kind === 'small_logo' || f.kind === 'small_name' || f.kind === 'loose_heading')

describe.runIf(browserOk)('BUG-238 brand and heading layout findings', () => {
  it('test_UAT_FC_BUG-238_a_28px_header_logo_is_too_small', async () => {
    const found = await check(page([row([logo(28), text("Bob's Salon", 28), ...nav()]), body]), ['header', 'welcome'])
    const small = found.filter((f) => f.kind === 'small_logo')
    expect(small.map((f) => [f.widthName, f.sectionName])).toEqual([
      ['desktop', 'header'],
      ['phone', 'header'],
    ])
    expect(layoutLine(small[0])).toMatch(
      new RegExp(`^home, desktop \\(1280px\\): section header has its logo only 28px tall.*at least ${layoutConfig.brand.logoMinPx.desktop}px`),
    )
  }, 120000)

  it('test_UAT_FC_BUG-238_logo_thresholds_are_read_per_width_from_configuration', async () => {
    // Between the configured phone and desktop minimums: too small only on desktop.
    const between = Math.round((layoutConfig.brand.logoMinPx.phone + layoutConfig.brand.logoMinPx.desktop) / 2)
    const found = await check(page([row([logo(between), text("Bob's Salon", 28), ...nav()]), body]), ['header', 'welcome'])
    expect(found.filter((f) => f.kind === 'small_logo').map((f) => f.widthName)).toEqual(['desktop'])
  }, 120000)

  it('test_UAT_FC_BUG-238_a_header_name_smaller_than_the_nav_links_is_named', async () => {
    const found = await check(page([row([logo(56), text("Bob's Salon", 14), ...nav(16)]), body]), ['header', 'welcome'])
    const small = found.filter((f) => f.kind === 'small_name')
    expect(small.map((f) => f.widthName)).toContain('desktop')
    expect(small[0].sectionName).toBe('header')
    expect(small[0].text).toMatch(/"Bob's Salon" at 14px, not clearly the largest text/)
    expect(small[0].text).toContain(`at least ${Math.round(16 * layoutConfig.brand.nameOverNav)}px`)
  }, 120000)

  it('test_UAT_FC_BUG-238_a_home_linked_name_the_size_of_the_links_is_named', async () => {
    const found = await check(page([row([link("Bob's Salon", '/', 16), ...nav(16)]), body]), ['header', 'welcome'])
    expect(found.filter((f) => f.kind === 'small_name' && f.widthName === 'desktop')[0]?.text).toMatch(/"Bob's Salon" at 16px/)
  }, 120000)

  it('test_UAT_FC_BUG-238_an_evenly_spaced_heading_stack_is_loose', async () => {
    const found = await check(
      page([
        stack([text('Intro text'), heading('Colour'), text('Full colour from £60'), heading('Cuts'), text('Cuts from £30')], 32),
        body,
      ]),
      ['prices', 'welcome'],
    )
    const loose = found.filter((f) => f.kind === 'loose_heading' && f.widthName === 'desktop')
    expect(loose.map((f) => f.sectionName)).toEqual(['prices', 'prices'])
    expect(loose[0].text).toMatch(/heading "Colour" with \d+px of space below it and \d+px above/)
    expect(loose[0].text).toMatch(/sitting with the text it introduces/)
  }, 120000)

  it('test_UAT_FC_BUG-238_a_correct_header_and_attached_headings_have_none', async () => {
    const attached = (h: string, t: string) => stack([heading(h), text(t)], 6)
    const found = await check(
      page([
        row([logo(56), text("Bob's Salon", 28), ...nav(16)]),
        stack([text('Intro text'), attached('Colour', 'Full colour from £60'), attached('Cuts', 'Cuts from £30')], 40),
      ]),
      ['header', 'prices'],
    )
    expect(brand(found).map(layoutLine)).toEqual([])
  }, 120000)
})

describe('BUG-238 builders are given starting sizes and heading spacing', () => {
  it('test_UAT_FC_BUG-238_builder_priming_sizes_the_header_and_attaches_headings', () => {
    const text = (entry: unknown): string => ((entry as { text: string[] }[])[0].text ?? []).join(' ')
    for (const role of ['builder_priming', 'builder_priming_with_corpus'] as const) {
      const words = text((priming as Record<string, unknown>)[role])
      expect(words).toMatch(/Start the logo at about 56px tall on desktop and 40px on a phone/)
      expect(words).toMatch(/business name the header's largest text/)
      expect(words).toMatch(/put clearly less space below it than above it/)
    }
    // The starting sizes clear the thresholds the check holds them to.
    expect(56).toBeGreaterThan(layoutConfig.brand.logoMinPx.desktop)
    expect(40).toBeGreaterThan(layoutConfig.brand.logoMinPx.phone)
    expect(4 / 3).toBeGreaterThan(layoutConfig.brand.nameOverNav)
  })
})
