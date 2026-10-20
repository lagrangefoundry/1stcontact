/**
 * [[REQ-418]] — the row-based table element: a price list whose item and values
 * share a row, so they cannot come apart whatever height a cell turns out to be.
 *
 * The browser UATs render each fixture with the framework's own renderer, serve
 * it the way `captureL1` does, and lay it out in a real browser — the page a site
 * actually ships, checked by the same layout check the host runs after a build.
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  replaceL1Node,
  resolveL1Node,
  resolveL1TextStyles,
  validateL1,
  type L1Document,
  type L1Node,
  type L1Table,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { engineAvailable, createPlaywrightDriver } from '../tools/generate/src'
import { serveL1 } from '../tools/generate/src/l1'
import { checkLayoutAt, layoutLine, type LayoutFinding } from '../tools/generate/src/cli/ai/layout-check'
import { builderVocabulary } from '../tools/generate/src/cli/ai/l1-vocabulary-core'
import priming from '../tools/generate/src/cli/ai/priming.json'

const WIDTHS = [375, 1280]
const browserOk = await engineAvailable('chromium')

function cell(t: string): { kind: 'text'; text: string } {
  return { kind: 'text', text: t }
}

/** Bob's colour price list, with the empty first name that slid every row in the column-built version. */
function priceTable(extra: Partial<L1Table> = {}): L1Table {
  return {
    kind: 'table',
    columns: [{}, { align: 'end' }],
    header: [cell('Treatment'), cell('Price')],
    rows: [
      [cell(''), cell('£50')],
      [cell('Full colour'), cell('£60')],
      [cell('Highlights'), cell('£70')],
      [cell('Toner'), cell('£80')],
    ],
    rule: { widthPx: 1, color: '#d1d5db' },
    type: { fontFamily: 'Arial', fontSizePx: 16 },
    ...extra,
  }
}

function page(sections: L1Node[]): L1Document {
  return {
    widths: WIDTHS,
    background: '#ffffff',
    textColor: '#111827',
    root: { kind: 'container', layout: 'stack', gapPx: 0, children: sections },
  }
}

function valid(doc: L1Document): L1Document {
  const result = validateL1(doc)
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return doc
}

function errorsOf(doc: unknown): string[] {
  const result = validateL1(doc)
  return result.ok ? [] : result.errors.map((e) => `${e.path}: ${e.message}`)
}

const heading = { kind: 'text', text: 'Colour', axes: { fontFamily: 'Arial', fontSizePx: 24 } } as L1Node

describe('REQ-418 table — the validator', () => {
  it('test_UAT_FC_REQ-418_a_well_formed_table_is_accepted', () => {
    valid(page([heading, priceTable()]))
    valid(page([priceTable({ header: undefined, narrow: 'stack', narrowBelowPx: 480 })]))
  })

  it('test_UAT_FC_REQ-418_a_row_or_header_with_the_wrong_cell_count_is_refused', () => {
    const short = priceTable({ rows: [[cell('Full colour'), cell('£60')], [cell('£70')]] })
    expect(errorsOf(page([short]))).toEqual([
      expect.stringMatching(/^\/root\/children\/0\/rows\/1: every table row, and its header, must hold exactly one cell per column/),
    ])
    const wideHeader = priceTable({ header: [cell('Treatment'), cell('Price'), cell('Time')] })
    expect(errorsOf(page([wideHeader])).join('\n')).toMatch(/\/header: every table row/)
  })

  it('test_UAT_FC_REQ-418_a_cell_cannot_leave_its_row_and_columns_are_capped', () => {
    const placed = priceTable()
    ;(placed.rows[0][0] as Record<string, unknown>).geometry = { keyframes: [] }
    expect(errorsOf(page([placed])).join('\n')).toMatch(/geometry/)
    const wide = priceTable({
      columns: Array.from({ length: 13 }, () => ({})),
      header: undefined,
      rows: [Array.from({ length: 13 }, () => cell('x'))],
    })
    expect(errorsOf(page([wide])).join('\n')).toMatch(/13 columns out of range \[1, 12\]/)
  })
})

describe('REQ-418 table — security of the cell sink', () => {
  it('test_UAT_FC_REQ-418_envelope_security_cell_text_is_inert', () => {
    const payload = '<script>alert(1)</script><img src=x onerror=alert(2)>'
    const doc = valid(page([priceTable({ header: [cell(`"><b>${payload}`), cell('Price')], rows: [[cell(payload), cell('£5')]] })]))
    const { html } = renderL1Document(doc)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img src=x')
    expect(html).not.toMatch(/data-label="[^"]*"><b>/)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('test_UAT_FC_REQ-418_envelope_security_a_cell_link_clears_the_allowlist', () => {
    const linked = priceTable({
      rows: [[{ kind: 'text', text: 'Book', link: { href: 'javascript:alert(1)' } }, cell('£5')]],
    })
    expect(errorsOf(page([linked])).join('\n')).toMatch(/rows\/0\/0\/link\/href: link href 'javascript:alert\(1\)' is not an allowed URL/)
  })
})

describe('REQ-418 table — one structure for every reader', () => {
  it('test_UAT_FC_REQ-418_renders_a_real_table_with_header_cells', () => {
    const { html } = renderL1Document(valid(page([priceTable()])))
    expect(html).toMatch(/<table class="[^"]+"><thead><tr><th scope="col">.*Treatment.*<\/th><th scope="col">.*Price.*<\/th><\/tr><\/thead><tbody>/)
    expect(html.match(/<tr>/g)).toHaveLength(5)
    expect(html.match(/<td/g)).toHaveLength(8)
  })

  it('test_UAT_FC_REQ-418_a_cell_is_addressed_in_reading_order_and_written_into_its_row', () => {
    const doc = valid(page([priceTable()]))
    // header (2 cells) then rows left to right: row 2's price is cell 2 + 2*2 + 1 = 7.
    expect(resolveL1Node([doc.root], [0, 0, 7])).toEqual(cell('£70'))
    expect(replaceL1Node([doc.root], [0, 0, 7], cell('£75'))).toBe(true)
    const table = (doc.root as { children: L1Table[] }).children[0]
    expect(table.rows[2]).toEqual([cell('Highlights'), cell('£75')])
    expect(replaceL1Node([doc.root], [0, 0, 10], cell('£1'))).toBe(false)
    valid(doc)
  })

  it('test_UAT_FC_REQ-418_the_table_sets_the_type_of_every_cell', () => {
    const styles = { body: { fontFamily: 'Georgia', fontSizePx: 18 } }
    const doc = page([priceTable({ type: { style: 'body' } })])
    expect(validateL1(doc, { textStyles: styles }).ok).toBe(true)
    const resolved = resolveL1TextStyles(doc, styles)
    const table = (resolved.root as { children: L1Table[] }).children[0]
    for (const c of [...table.header!, ...table.rows.flat()]) {
      expect(c.axes).toMatchObject({ fontFamily: 'Georgia', fontSizePx: 18 })
    }
  })
})

describe('REQ-418 table — builders and the consultant are taught it', () => {
  it('test_UAT_FC_REQ-418_builder_priming_names_the_table_for_price_lists_and_hours', () => {
    const text = (entry: unknown): string => ((entry as { text: string[] }[])[0].text ?? []).join(' ')
    for (const role of ['builder_priming', 'builder_priming_with_corpus'] as const) {
      const words = text((priming as Record<string, unknown>)[role])
      expect(words).toMatch(/price list, opening hours,/)
      expect(words).toMatch(/is a `table` element: one row per item/)
    }
    const consultant = JSON.stringify((priming as Record<string, unknown>).priming)
    expect(consultant).toMatch(/a price list or opening hours is a table, one row per item, and a brief that","  asks for one says so/)
    expect(builderVocabulary()).toMatch(/- `table`: .*`columns`.*`rows`.*`narrow`/)
  })
})

const closers: (() => Promise<void>)[] = []
afterEach(async () => {
  while (closers.length) await closers.pop()!()
})

async function check(doc: L1Document, sections: string[]): Promise<{ url: string; found: LayoutFinding[] }> {
  const served = await serveL1(valid(doc))
  closers.push(served.close)
  return { url: served.url, found: await checkLayoutAt(served.url, 'prices', createPlaywrightDriver, sections) }
}

/** Each body row's cell tops, and the page's own scroll width, at `width`. */
async function measure(url: string, width: number): Promise<{ rows: number[][]; scrollWidth: number; display: string }> {
  const driver = await createPlaywrightDriver()
  try {
    await driver.navigate(url, { width, height: 900 })
    return await driver.query(`(() => ({
      rows: Array.from(document.querySelectorAll('tbody tr')).map((tr) =>
        Array.from(tr.children).map((td) => Math.round(td.getBoundingClientRect().top))),
      scrollWidth: document.documentElement.scrollWidth,
      display: getComputedStyle(document.querySelector('tbody td')).display,
    }))()`)
  } finally {
    await driver.close()
  }
}

/** A table too wide for a phone in either mode: five columns of long words. */
function wideTable(narrow: 'scroll' | 'stack'): L1Table {
  const long = (i: number): { kind: 'text'; text: string } => cell(`Extraordinarilylongtreatmentname${i}`)
  return {
    kind: 'table',
    narrow,
    columns: [{}, {}, {}, {}, { align: 'end' }],
    header: [cell('Treatment'), cell('Short'), cell('Medium'), cell('Long'), cell('Time')],
    rows: [0, 1, 2].map((r) => [long(r), long(r + 1), long(r + 2), long(r + 3), cell(`${r + 1}h`)]),
  }
}

describe.runIf(browserOk)('REQ-418 table — in a real browser', () => {
  it('test_UAT_FC_REQ-418_an_empty_first_cell_keeps_every_row_aligned', async () => {
    const { url, found } = await check(page([heading, priceTable()]), ['intro', 'colour-prices'])
    expect(found.map(layoutLine)).toEqual([])
    for (const width of WIDTHS) {
      const { rows } = await measure(url, width)
      expect(rows).toHaveLength(4)
      for (const tops of rows) expect(new Set(tops).size).toBe(1)
      // the empty cell still takes its row: the rows step down evenly
      expect(rows[1][0] - rows[0][0]).toBe(rows[2][0] - rows[1][0])
    }
  }, 120000)

  it('test_UAT_FC_REQ-418_each_narrow_mode_keeps_the_page_from_scrolling_sideways', async () => {
    for (const narrow of ['scroll', 'stack'] as const) {
      const { url, found } = await check(page([heading, wideTable(narrow)]), ['intro', 'hours'])
      expect(found.map(layoutLine), narrow).toEqual([])
      const phone = await measure(url, 375)
      expect(phone.scrollWidth, narrow).toBeLessThanOrEqual(375)
      if (narrow === 'stack') {
        expect(phone.display).toBe('block')
        for (const tops of phone.rows) expect(new Set(tops).size).toBe(tops.length)
      } else {
        expect(phone.display).toBe('table-cell')
      }
      const desktop = await measure(url, 1280)
      expect(desktop.display, narrow).toBe('table-cell')
    }
  }, 240000)
})
