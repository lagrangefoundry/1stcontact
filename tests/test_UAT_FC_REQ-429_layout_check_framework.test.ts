/**
 * [[REQ-429]] — the layout check as a runner plus a registry of named checks, run
 * at desktop, tablet and phone, with checks for the faults the operator had to
 * point out on Ariel's Arc Welding and Bob's salon: a heading whose ink sits far
 * from its text, a word stranded on a line, menu labels that wrap or are too small
 * or take over a phone's first screen, a table out of line, and things too close
 * or drawn over each other.
 *
 * Each fixture is a page served over HTTP and checked by a real Chromium at every
 * configured width through `checkLayoutAt` — the path the host runs after a build.
 * The pages are written as HTML so a fixture can be exactly the fault in question
 * (a `<nav>`, a form field, a grid); the check reads the laid-out page, whatever
 * drew it.
 */
import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { engineAvailable, createPlaywrightDriver } from '../tools/generate/src'
import {
  checkLayoutAt,
  layoutLine,
  LAYOUT_CHECKS,
  LAYOUT_WIDTHS,
  type LayoutFinding,
  type LayoutFindingKind,
} from '../tools/generate/src/cli/ai/layout-check'
import layoutConfig from '../tools/generate/src/cli/ai/layout-check.json'

const browserOk = await engineAvailable('chromium')

const closers: (() => Promise<void>)[] = []
afterEach(async () => {
  while (closers.length) await closers.pop()!()
})

const LOGO = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Crect width='10' height='10' fill='%23333'/%3E%3C/svg%3E"

/** A page whose sections are `sections`, under the L1 root the check looks for. */
function html(sections: string[], css = ''): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>*{box-sizing:border-box} body{margin:0;font-family:Arial,sans-serif;color:#111;background:#fff} p,h1,h2,h3{margin:0}
.btn{display:inline-block;background:#b45309;color:#fff;padding:10px 16px;text-decoration:none;font-size:16px}
section{padding:40px 24px} ${css}</style></head>
<body><div class="l1-0">${sections.join('\n')}</div></body></html>`
}

async function check(page: string, sections: string[], checks = LAYOUT_CHECKS): Promise<LayoutFinding[]> {
  const body = Buffer.from(page, 'utf-8')
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(body)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  closers.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  return checkLayoutAt(`http://127.0.0.1:${port}/`, 'home', createPlaywrightDriver, sections, checks)
}

const of = (found: LayoutFinding[], kind: LayoutFindingKind) => found.filter((f) => f.kind === kind)
const widthsOf = (found: LayoutFinding[]) => [...new Set(found.map((f) => f.widthName))]

/** A plain body section, so the section under test is not the page's only one. */
const BODY = '<section><p>We make gates, railings and sculpture to order.</p></section>'

/** Ariel's hero: a 96px display heading, a subtitle, a paragraph and a button, all 24px apart as boxes. */
function hero(headingGroup: string): string {
  return `<section style="display:flex;flex-direction:column;gap:24px;align-items:flex-start">
  ${headingGroup}
  <p style="font-size:18px;line-height:1.5;max-width:560px">Gates, railings, furniture and sculpture, made by hand in our workshop to last for generations.</p>
  <a class="btn" href="/quote">Get a quote</a>
</section>`
}
const HERO_HEADING = '<h1 style="font-family:Georgia,serif;font-size:96px;line-height:1.3">Beauty and Strength</h1>'
const HERO_SUBTITLE = '<p style="font-size:24px;line-height:1.4">Quality custom metalwork</p>'

describe.runIf(browserOk)('REQ-429 the layout check framework', () => {
  it('test_UAT_FC_REQ-429_a_check_that_throws_is_named_and_the_others_still_run', async () => {
    const boom = { id: 'boom', kinds: ['empty'] as const, run: String.raw`() => { throw new Error('kaboom') }` }
    const found = await check(html(['<section></section>', BODY]), ['blank', 'about'], [boom, ...LAYOUT_CHECKS])
    // The broken check is reported against its id, at every width...
    const failed = of(found, 'check_failed')
    expect(failed.map((f) => f.widthName)).toEqual(['desktop', 'tablet', 'phone'])
    expect(layoutLine(failed[1])).toMatch(/^home, tablet \(900px\): the page could not be checked for boom, a fault in the check rather than the page \(kaboom\)\.$/)
    // ...and the checks after it still report.
    expect(of(found, 'empty').map((f) => [f.widthName, f.sectionName])).toEqual([
      ['desktop', 'blank'],
      ['tablet', 'blank'],
      ['phone', 'blank'],
    ])
  }, 120000)

  it('test_UAT_FC_REQ-429_widths_and_thresholds_are_configuration', () => {
    expect(LAYOUT_WIDTHS.map((w) => [w.name, w.width])).toEqual([
      ['desktop', 1280],
      ['tablet', 900],
      ['phone', 375],
    ])
    // Every check's thresholds live under its own id; every check is one registry entry.
    for (const id of ['heading', 'table', 'stranded_word', 'nav_wraps', 'small_nav', 'tall_menu', 'crowded', 'overlap']) {
      expect(LAYOUT_CHECKS.map((c) => c.id)).toContain(id)
      expect(layoutConfig).toHaveProperty(id)
    }
    expect(new Set(LAYOUT_CHECKS.map((c) => c.id)).size).toBe(LAYOUT_CHECKS.length)
  })

  it('test_UAT_FC_REQ-429_a_display_heading_far_from_its_subtitle_by_its_ink_is_loose', async () => {
    const found = await check(html([hero(HERO_HEADING + HERO_SUBTITLE), BODY]), ['hero', 'about'])
    const loose = of(found, 'loose_heading').filter((f) => f.widthName === 'desktop')
    expect(loose.map((f) => f.sectionName)).toEqual(['hero'])
    expect(loose[0].text).toMatch(/heading "Beauty and Strength" with \d+px of space below it, measured between the letters/)
    expect(loose[0].text).toMatch(/"Quality custom metalwork" to "Gates, railings/)
  }, 120000)

  it('test_UAT_FC_REQ-429_the_same_hero_with_the_heading_tight_to_its_subtitle_is_not_loose', async () => {
    const tight = `<div style="display:flex;flex-direction:column;gap:0">${HERO_HEADING.replace('line-height:1.3', 'line-height:1')}${HERO_SUBTITLE}</div>`
    const found = await check(html([hero(tight), BODY]), ['hero', 'about'])
    expect(of(found, 'loose_heading').map(layoutLine)).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-429_a_short_word_alone_on_a_line_of_a_display_heading_is_stranded', async () => {
    const h = (size: number) =>
      `<h2 style="font-family:'Courier New',monospace;font-size:${size}px;width:420px">Craftsmanship and Blacksmithing</h2>`
    const found = await check(html([`<section>${h(48)}</section>`, BODY]), ['intro', 'about'])
    const stranded = of(found, 'stranded_word').filter((f) => f.widthName === 'desktop')
    expect(stranded.map((f) => f.sectionName)).toEqual(['intro'])
    expect(stranded[0].text).toMatch(/"Craftsmanship and Blacksmithing" at 48px over 3 lines with "and" alone on a line/)
    // Small text is free to wrap however it falls.
    const small = await check(html([`<section>${h(20).replace('width:420px', 'width:180px')}</section>`, BODY]), ['intro', 'about'])
    expect(of(small, 'stranded_word')).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-429_menu_labels_that_wrap_at_tablet_width_are_named', async () => {
    const header = `<header style="display:flex;align-items:center;gap:24px;padding:16px 24px">
      <img src="${LOGO}" alt="Ariel's Arc Welding" style="width:400px;height:60px;flex:none">
      <nav style="display:flex;gap:24px;font-size:18px;text-transform:uppercase">
        <a href="/building">Building work</a><a href="/everything">Everything else</a><a href="/art">Art</a><a href="/contact">Contact us</a>
      </nav></header>`
    const found = await check(html([header, BODY]), ['header', 'about'])
    const wraps = of(found, 'nav_wraps')
    expect(widthsOf(wraps)).toContain('tablet')
    expect(widthsOf(wraps)).not.toContain('desktop')
    const tablet = wraps.filter((f) => f.widthName === 'tablet')
    expect(tablet.map((f) => f.text)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^has the menu link "Building work" broken over 2 lines/)]),
    )
    expect(layoutLine(tablet[0])).toMatch(/^home, tablet \(900px\): section header has the menu link/)
  }, 120000)

  it('test_UAT_FC_REQ-429_13px_phone_menu_links_are_too_small', async () => {
    const header = (px: number) => `<header style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px">
      <img src="${LOGO}" alt="logo" style="width:48px;height:48px">
      <nav style="display:flex;gap:12px;font-size:${px}px"><a href="/work">Work</a><a href="/art">Art</a><a href="/contact">Contact</a></nav></header>`
    const found = await check(html([header(13), BODY]), ['header', 'about'])
    const small = of(found, 'small_nav')
    expect(small.map((f) => [f.widthName, f.sectionName])).toEqual([['phone', 'header']])
    expect(small[0].text).toMatch(/menu links at 13px \("Work", "Art", "Contact"\).*at least 14px/)
    expect(of(await check(html([header(16), BODY]), ['header', 'about']), 'small_nav')).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-429_a_stacked_phone_menu_over_a_third_of_the_screen_is_tall', async () => {
    const links = ['Home', 'Building work', 'Everything else', 'Art', 'About', 'Contact']
      .map((t) => `<a href="/${t.toLowerCase().replace(/ /g, '-')}" style="display:block;padding:12px 16px;font-size:18px">${t}</a>`)
      .join('')
    const stacked = `<header style="padding:12px 16px"><img src="${LOGO}" alt="logo" style="width:48px;height:48px"><nav>${links}</nav></header>`
    const found = await check(html([stacked, BODY]), ['header', 'about'])
    const tall = of(found, 'tall_menu')
    expect(tall.map((f) => [f.widthName, f.sectionName])).toEqual([['phone', 'header']])
    expect(tall[0].text).toMatch(/has its 6 menu links stacked \d+px tall, more than 33% of a 667px-tall screen/)
  }, 120000)

  it('test_UAT_FC_REQ-429_a_table_with_a_cell_nudged_down_has_misaligned_rows', async () => {
    const table = `<section><table style="width:400px;border-collapse:collapse">
      <thead><tr><th style="text-align:left">Treatment</th><th style="text-align:right">Price</th></tr></thead>
      <tbody>
        <tr><td>Root colour</td><td style="text-align:right">£50</td></tr>
        <tr><td>Full colour</td><td style="text-align:right;padding-top:14px">£60</td></tr>
        <tr><td>Highlights</td><td style="text-align:right">£70</td></tr>
      </tbody></table></section>`
    const found = await check(html([table, BODY]), ['colour-prices', 'about'])
    const misaligned = of(found, 'misaligned_rows').filter((f) => f.widthName === 'desktop')
    expect(misaligned.map((f) => f.sectionName)).toEqual(['colour-prices'])
    expect(misaligned[0].text).toMatch(/has a table, and its rows do not line up from row 2: "Full colour" sits beside "£60"/)
    expect(of(found, 'ragged_column')).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-429_a_grid_price_list_with_a_cell_nudged_down_has_misaligned_rows', async () => {
    const cells = [['Cut', '£30'], ['Cut and finish', '£45'], ['Colour', '£60'], ['Toner', '£20']]
      .map(([t, p], i) => `<div>${t}</div><div style="text-align:right${i === 2 ? ';padding-top:12px' : ''}">${p}</div>`)
      .join('')
    const found = await check(html([`<section><div style="display:grid;grid-template-columns:240px 120px;row-gap:8px">${cells}</div></section>`, BODY]), [
      'prices',
      'about',
    ])
    const misaligned = of(found, 'misaligned_rows').filter((f) => f.widthName === 'desktop')
    expect(misaligned[0]?.text).toMatch(/has a grid of 2 columns, and its rows do not line up from row 3: "Colour" sits beside "£60"/)
  }, 120000)

  it('test_UAT_FC_REQ-429_a_column_of_mixed_alignment_is_ragged_and_a_clean_table_is_not', async () => {
    const table = (mixed: boolean) => `<section><table style="width:400px;border-collapse:collapse"><tbody>
        <tr><td>Root colour</td><td style="text-align:right">£5</td></tr>
        <tr><td>Full colour</td><td style="text-align:${mixed ? 'left' : 'right'}">£120</td></tr>
        <tr><td>Highlights</td><td style="text-align:${mixed ? 'center' : 'right'}">£60.50</td></tr>
      </tbody></table></section>`
    const found = await check(html([table(true), BODY]), ['colour-prices', 'about'])
    const ragged = of(found, 'ragged_column').filter((f) => f.widthName === 'desktop')
    expect(ragged.map((f) => f.sectionName)).toEqual(['colour-prices'])
    expect(ragged[0].text).toMatch(/has a table whose column 2 is not aligned: its cells \("£5", "£120", "£60.50"\) share neither a left edge, a right edge nor a centre/)
    const clean = await check(html([table(false), BODY]), ['colour-prices', 'about'])
    expect([...of(clean, 'ragged_column'), ...of(clean, 'misaligned_rows')].map(layoutLine)).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-429_a_menu_link_3px_from_the_call_button_is_crowded', async () => {
    const header = (gap: number) => `<header style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px">
      <img src="${LOGO}" alt="logo" style="width:56px;height:56px">
      <div style="display:flex;align-items:center;gap:${gap}px"><nav style="display:flex;gap:24px"><a href="/work">Work</a><a href="/contact">Contact</a></nav>
      <a class="btn" href="tel:5551234">Call 555 1234</a></div></header>`
    const found = await check(html([header(3), BODY]), ['header', 'about'])
    const crowded = of(found, 'crowded').filter((f) => f.widthName === 'desktop')
    expect(crowded.map((f) => f.sectionName)).toEqual(['header'])
    expect(crowded[0].text).toMatch(/has the link "Contact" and the button "Call 555 1234" only 3px apart.*at least 8px/)
    // Spaced out, nothing is crowded at desktop width (a phone squeezes this header's row).
    const spaced = await check(html([header(32), BODY]), ['header', 'about'])
    expect(of(spaced, 'crowded').filter((f) => f.widthName === 'desktop').map(layoutLine)).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-429_a_form_field_drawn_over_a_paragraph_overlaps', async () => {
    const form = `<section><div style="position:relative;max-width:600px">
      <p>Tell us about your project and we will reply within a day.</p>
      <input placeholder="Your name" style="position:absolute;top:0;left:40px;width:260px;height:36px">
    </div></section>`
    const found = await check(html([form, BODY]), ['contact', 'about'])
    const overlap = of(found, 'overlap').filter((f) => f.widthName === 'desktop')
    expect(overlap.map((f) => f.sectionName)).toEqual(['contact'])
    expect(overlap[0].text).toMatch(/^the form field "Your name" is drawn over "Tell us about your project/)
  }, 120000)

  it('test_UAT_FC_REQ-429_a_well_spaced_header_and_text_over_a_picture_give_neither', async () => {
    const header = `<header style="display:flex;align-items:center;justify-content:space-between;padding:12px 24px">
      <img src="${LOGO}" alt="logo" style="width:56px;height:56px">
      <div style="display:flex;align-items:center;gap:32px"><nav style="display:flex;gap:24px"><a href="/work">Work</a><a href="/contact">Contact</a></nav>
      <a class="btn" href="tel:5551234">Call us</a></div></header>`
    const picture = `<section style="position:relative;padding:0">
      <img src="${LOGO}" alt="The workshop" style="display:block;width:100%;height:320px">
      <h2 style="position:absolute;top:40px;left:24px;color:#fff;font-size:40px">Made by hand</h2></section>`
    const found = await check(html([header, picture, BODY]), ['header', 'picture', 'about'])
    expect([...of(found, 'crowded'), ...of(found, 'overlap')].map(layoutLine)).toEqual([])
  }, 120000)
})
