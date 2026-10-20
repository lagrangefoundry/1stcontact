/**
 * [[REQ-415]] — the mechanical layout check, against real pages laid out by a
 * real browser.
 *
 * Each fixture is an L1 document rendered by the framework's own renderer and
 * served the way `captureL1` serves one, so what is checked is the markup a site
 * actually ships. The column-built price table is the Bob's-salon page in small:
 * a name column whose first cell is empty beside a price column, so every name
 * slides up a row beside the wrong price.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { validateL1, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { engineAvailable, createPlaywrightDriver } from '../tools/generate/src'
import { serveL1 } from '../tools/generate/src/l1'
import { checkLayoutAt, layoutLine, type LayoutFinding } from '../tools/generate/src/cli/ai/layout-check'

const WIDTHS = [375, 1280]
const browserOk = await engineAvailable('chromium')

function text(t: string): L1Node {
  return { kind: 'text', text: t, axes: { color: '#111827', fontFamily: 'Arial', fontSizePx: 16, fontWeight: 400 } }
}

function stack(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'stack', gapPx: 8, children }
}

function fixedBox(widthPx: number, children: L1Node[]): L1Node {
  return {
    kind: 'box',
    axes: { surfaceFill: '#e5e7eb' },
    sizing: { width: { mode: 'fixed', px: widthPx }, height: { mode: 'fixed', px: 60 } },
    children,
  }
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

const closers: (() => Promise<void>)[] = []
afterEach(async () => {
  while (closers.length) await closers.pop()!()
})

async function check(doc: L1Document, sections: string[] = []): Promise<LayoutFinding[]> {
  const served = await serveL1(doc)
  closers.push(served.close)
  return checkLayoutAt(served.url, 'prices', createPlaywrightDriver, sections)
}

describe.runIf(browserOk)('REQ-415 layout check', () => {
  it('test_UAT_FC_REQ-415_a_clean_page_has_no_findings', async () => {
    const found = await check(
      page([stack([text('Welcome to the salon'), text('Open six days a week')]), stack([text('Book a visit')])]),
    )
    expect(found.map(layoutLine)).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-415_a_page_wider_than_a_phone_is_named', async () => {
    const found = await check(page([stack([text('Prices')]), stack([fixedBox(600, [text('A wide banner')])])]), [
      'heading',
      'banner',
    ])
    const sideways = found.filter((f) => f.kind === 'sideways')
    expect(sideways.map((f) => [f.widthName, f.sectionName])).toEqual([['phone', 'banner']])
    expect(layoutLine(sideways[0])).toMatch(/^prices, phone \(375px\): section banner is wider than the screen/)
  }, 120000)

  it('test_UAT_FC_REQ-415_a_column_built_price_table_with_an_empty_cell_is_misaligned', async () => {
    const names = stack([text(''), text('Full colour'), text('Highlights'), text('Toner')])
    const prices = stack([text('£50'), text('£60'), text('£70'), text('£80')])
    const table: L1Node = { kind: 'container', layout: 'row', gapPx: 24, children: [names, prices] }
    const found = await check(page([stack([text('Colour')]), table]), ['intro', 'colour-prices'])
    const misaligned = found.filter((f) => f.kind === 'misaligned_rows')
    expect(misaligned.map((f) => f.sectionName)).toContain('colour-prices')
    expect(misaligned[0].text).toMatch(/rows do not line up/)
    expect(misaligned[0].text).toMatch(/one row per item/)
  }, 120000)

  it('test_UAT_FC_REQ-415_a_column_built_table_that_lines_up_is_still_reported_as_split', async () => {
    const names = stack([text('Full colour'), text('Highlights'), text('Toner')])
    const prices = stack([text('£60'), text('£70'), text('£80')])
    const table: L1Node = { kind: 'container', layout: 'row', gapPx: 24, children: [names, prices] }
    const found = await check(page([stack([text('Colour')]), table]), ['intro', 'colour-prices'])
    expect(found.filter((f) => f.kind === 'split_rows').map((f) => f.sectionName)).toContain('colour-prices')
    expect(found.some((f) => f.kind === 'misaligned_rows')).toBe(false)
  }, 120000)

  it('test_UAT_FC_REQ-415_siblings_with_different_edges_are_named', async () => {
    const found = await check(
      page([fixedBox(900, [text('One')]), fixedBox(900, [text('Two')]), fixedBox(700, [text('Three')])]),
      ['one', 'two', 'three'],
    )
    const edges = found.filter((f) => f.kind === 'edges' && f.widthName === 'desktop')
    expect(edges.map((f) => f.sectionName)).toEqual(['three'])
    expect(edges[0].text).toMatch(/other sections on this page run from/)
  }, 120000)
})
