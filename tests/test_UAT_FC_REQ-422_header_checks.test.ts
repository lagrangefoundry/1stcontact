/**
 * [[REQ-422]] — the layout check finds the business at the top of every page,
 * never smaller than the page's headings, and the shared menu folds on a phone.
 *
 * Each fixture is a real site: built through the grant's own operations over a
 * real store, rendered by the real renderer (so the page states its business name
 * and carries the shared header exactly as a reader gets it), served, and checked
 * by a real browser at desktop and phone width — REQ-415's own path.
 */
import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { engineAvailable, createPlaywrightDriver } from '../tools/generate/src'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import { checkLayoutAt, type LayoutFinding } from '../tools/generate/src/cli/ai/layout-check'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { makeMemorySite, type SiteFixture } from './support/site-factory'

const browserOk = await engineAvailable('chromium')

type Ops = Record<string, (p: Record<string, unknown>) => Promise<unknown>>

const closers: (() => Promise<void>)[] = []
afterEach(async () => {
  while (closers.length) await closers.pop()!()
})

async function site(): Promise<{ fixture: SiteFixture; ops: Ops }> {
  const fixture = makeMemorySite()
  closers.push(() => fixture.dispose())
  return { fixture, ops: l1Operations(fixture.slug, fixture.opts) as unknown as Ops }
}

/** Serve the site's rendered files; the URL of its home page. */
async function serve(fixture: SiteFixture): Promise<string> {
  const loaded = await fixture.store.loadDraft(fixture.slug)
  if (!loaded?.result.ok) throw new Error(JSON.stringify(loaded?.result))
  const { files } = await renderSiteFiles(loaded.result.value)
  const server = http.createServer((req, res) => {
    const name = (req.url ?? '/').replace(/^\//, '').split(/[?#]/)[0] || 'index.html'
    const body = files.get(name) ?? files.get(`${name}.html`)
    res.writeHead(body === undefined ? 404 : 200, { 'content-type': name.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' })
    res.end(body ?? '')
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  closers.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
  const addr = server.address()
  return `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}/`
}

/** A page section: a level-2 heading at `headingPx` and a line of copy. */
function section(headingPx: number): Record<string, unknown> {
  return {
    kind: 'container',
    id: 'services',
    layout: 'stack',
    padding: { topPx: 48, rightPx: 24, bottomPx: 48, leftPx: 24 },
    children: [
      { kind: 'text', text: 'Our services', heading: { level: 2 }, axes: { fontSizePx: headingPx, lineHeightPx: headingPx + 8 } },
      { kind: 'text', text: 'Gates, railings and repairs, made to measure.', axes: { fontSizePx: 16 } },
    ],
  }
}

/** The home page as one section, and the header's wordmark at a fixed size. */
async function build(ops: Ops, opts: { header: boolean; namePx?: number; headingPx: number }): Promise<void> {
  if (opts.header) {
    await ops.add_page({ page: 'header', kind: 'header' })
    await ops.set_l1({
      page: 'header',
      path: '0.0',
      node: { kind: 'text', id: 'header-name', text: 'Acme Ironworks', link: { href: '/' }, axes: { fontSizePx: opts.namePx, fontWeight: 700 } },
    })
  }
  const contact = { kind: 'container', id: 'contact', layout: 'stack', padding: { topPx: 48, rightPx: 24, bottomPx: 48, leftPx: 24 }, children: [{ kind: 'text', text: 'Call 555 0100', axes: { fontSizePx: 16 } }] }
  await ops.set_l1({ page: 'home', path: '0', node: { kind: 'container', id: 'root', layout: 'stack', children: [section(opts.headingPx), contact] } })
}

const of = (found: LayoutFinding[], kind: LayoutFinding['kind']) => found.filter((f) => f.kind === kind)

describe.runIf(browserOk)('REQ-422 the business at the top of every page', () => {
  it('test_UAT_FC_REQ-422_a_header_name_smaller_than_the_headings_is_named', async () => {
    const { fixture, ops } = await site()
    await build(ops, { header: true, namePx: 18, headingPx: 32 })
    await businessName(fixture, 'Acme Ironworks')
    const found = await checkLayoutAt(await serve(fixture), 'home', createPlaywrightDriver, ['services', 'contact'])
    const small = of(found, 'name_smaller_than_headings')
    expect(small.map((f) => [f.widthName, f.sectionName])).toEqual([
      ['desktop', 'site-header'],
      ['tablet', 'site-header'],
      ['phone', 'site-header'],
    ])
    expect(small[0].text).toMatch(/business name "Acme Ironworks" at 18px, smaller than the page's 32px section heading/)
  }, 120000)

  it('test_UAT_FC_REQ-422_a_header_name_larger_than_the_headings_is_not_named', async () => {
    const { fixture, ops } = await site()
    await build(ops, { header: true, namePx: 30, headingPx: 28 })
    await businessName(fixture, 'Acme Ironworks')
    const found = await checkLayoutAt(await serve(fixture), 'home', createPlaywrightDriver, ['services', 'contact'])
    expect(of(found, 'name_smaller_than_headings')).toEqual([])
    expect(of(found, 'no_header')).toEqual([])
  }, 120000)

  it('test_UAT_FC_REQ-422_a_page_with_no_name_or_logo_at_its_top_has_no_header', async () => {
    const { fixture, ops } = await site()
    await build(ops, { header: false, headingPx: 28 })
    await businessName(fixture, 'Acme Ironworks')
    const found = await checkLayoutAt(await serve(fixture), 'home', createPlaywrightDriver, ['services', 'contact'])
    expect(of(found, 'no_header').map((f) => [f.widthName, f.sectionName])).toEqual([
      ['desktop', 'services'],
      ['tablet', 'services'],
      ['phone', 'services'],
    ])
  }, 120000)

  it('test_UAT_FC_REQ-422_the_shared_menu_folds_behind_a_button_on_a_phone', async () => {
    const { fixture, ops } = await site()
    await ops.add_page({ page: 'header', kind: 'header' })
    await ops.add_page({ page: 'art', title: 'Art' })
    const url = await serve(fixture)
    const visible = `(() => {
      const nav = document.querySelector('header nav');
      const shown = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      const links = Array.from(nav.querySelectorAll('a')).filter(shown).map((a) => a.textContent);
      return { links, button: shown(nav.querySelector('summary')) };
    })()`
    for (const [width, expected] of [
      [1280, { links: ['Home', 'Art'], button: false }],
      [375, { links: [], button: true }],
    ] as const) {
      const driver = await createPlaywrightDriver()
      try {
        await driver.navigate(url, { width, height: 800 })
        expect(await driver.query(visible), `${width}px`).toEqual(expected)
        if (width === 375) {
          // Opening it needs no script of ours: the disclosure is native.
          await driver.query(`(() => { document.querySelector('header nav summary').click(); return true })()`)
          expect(await driver.query(visible)).toEqual({ links: ['Home', 'Art'], button: true })
        }
      } finally {
        await driver.close()
      }
    }
  }, 120000)
})

/** Name the business as the site's settings do. */
async function businessName(fixture: SiteFixture, name: string): Promise<void> {
  const base = (await fixture.store.readSiteJson(fixture.slug)) as Record<string, unknown>
  await fixture.store.write(fixture.slug, {
    siteJson: { ...base, config: { ...(base.config as Record<string, unknown>), businessName: name } },
  })
}
