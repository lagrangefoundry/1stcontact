/**
 * [[REQ-248]] UATs — **which pages a reader could actually get to**, the
 * derivation half.
 *
 * A page is reached by clicking a link to it, so a page nothing links to cannot
 * be opened at all — not hidden, not awkward, unreachable. The builder's page
 * control exists to open those, and to SAY which they are: an unreferenced page
 * is either deliberate, as a gated landing page is, or a mistake nobody has
 * noticed, and the two are indistinguishable until something says so.
 *
 * Driven through `editPageList` — the real listing every reader uses, the
 * assistant's `list_pages` and the builder's `/api/pages` alike — against a real
 * store, so what is asserted is the answer both surfaces actually get.
 *
 * WHY LINKS AND NOT ONLY `nav.entries`. The ticket's §1 states the rule as "no
 * entry in the site's navigation settings names its path", and that is not how
 * these sites are authored: all three real definitions in `storage/sites/` carry
 * `nav: {entries: []}` and write their whole navigation as L1 links. A
 * derivation reading only `nav` would mark every page of every one of them
 * unreachable, which is a mark on everything and therefore a mark on nothing.
 * So the rule is generalised to what §1 actually means — *nothing can reach it*
 * — with nav entries counted as links from the front door.
 *
 * Acceptance covered:
 *
 *   AC-1  every page is listed, including one nothing points at
 *   AC-2  an unreachable page is marked, and a reachable one is not
 */
import { afterEach, describe, expect, it } from 'vitest'
import { editPageList } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { makeMemorySite, type SiteFixture } from './support/site-factory'

/** A page whose body carries a link per href given. */
function pageLinking(id: string, title: string, hrefs: string[]): Record<string, unknown> {
  const page = starterHomePage(id) as Record<string, unknown>
  const l1 = page.l1 as Record<string, unknown>
  const root = l1.root as Record<string, unknown>
  return {
    ...page,
    id,
    slug: id,
    title,
    l1: {
      ...l1,
      root: {
        ...root,
        children: [
          ...(root.children as unknown[]),
          ...hrefs.map((href, i) => ({
            kind: 'text',
            id: `link-${i}`,
            text: href,
            link: { href },
          })),
        ],
      },
    },
  }
}

interface Row {
  id: string
  slug: string
  title: string
  reachable: boolean
}

const rowsOf = async (fixture: SiteFixture): Promise<Row[]> =>
  ((await editPageList(fixture.slug, fixture.opts)).data as { pages: Row[] }).pages

const reachOf = (rows: Row[]): Record<string, boolean> =>
  Object.fromEntries(rows.map((r) => [r.id, r.reachable]))

let fixture: SiteFixture | null = null
afterEach(async () => {
  await fixture?.dispose()
  fixture = null
})

describe('REQ-248 — the listing says which pages a reader can get to', () => {
  it('test_UAT_FC_REQ-248_lists_every_page_and_marks_the_one_nothing_links_to', async () => {
    fixture = makeMemorySite({
      pages: {
        'home.json': pageLinking('home', 'Home', ['/about']),
        'about.json': pageLinking('about', 'About us', []),
        'terms.json': pageLinking('terms', 'Terms', []),
      },
    })
    const rows = await rowsOf(fixture)

    // AC-1 — the unreachable page is in the list. That is the whole point: it
    // appears nowhere else and can be clicked from nowhere.
    expect(rows.map((r) => r.id).sort()).toEqual(['about', 'home', 'terms'])
    // AC-2 — and it is the only one marked.
    expect(reachOf(rows)).toEqual({ home: true, about: true, terms: false })
  })

  it('test_UAT_FC_REQ-248_the_home_page_is_reachable_with_nothing_pointing_at_it', async () => {
    // The channel root serves it, so it is reachable by construction — a site
    // whose every page were marked would be a control saying nothing.
    fixture = makeMemorySite({
      pages: { 'home.json': pageLinking('home', 'Home', []) },
    })
    expect(reachOf(await rowsOf(fixture))).toEqual({ home: true })
  })

  it('test_UAT_FC_REQ-248_a_nav_entry_reaches_a_page_no_page_links_to', async () => {
    // `nav` is site-wide chrome rather than one page's content, so an entry
    // naming a page reaches it from everywhere.
    fixture = makeMemorySite({
      patchSiteJson: {
        nav: {
          pattern: 'top-tabs',
          entries: [{ label: 'Terms', target: { kind: 'page', pageId: 'terms' } }],
        },
      },
      pages: {
        'home.json': pageLinking('home', 'Home', []),
        'terms.json': pageLinking('terms', 'Terms', []),
      },
    })
    expect(reachOf(await rowsOf(fixture))).toEqual({ home: true, terms: true })
  })

  it('test_UAT_FC_REQ-248_two_pages_linking_only_to_each_other_are_unreachable', async () => {
    // Linked, and still unreachable. An incoming-link count would call both of
    // these reachable and be wrong about both.
    fixture = makeMemorySite({
      pages: {
        'home.json': pageLinking('home', 'Home', []),
        'a.json': pageLinking('a', 'A', ['/b']),
        'b.json': pageLinking('b', 'B', ['/a']),
      },
    })
    expect(reachOf(await rowsOf(fixture))).toEqual({ home: true, a: false, b: false })
  })

  it('test_UAT_FC_REQ-248_a_link_reaches_the_page_the_renderer_would_serve_for_it', async () => {
    // Every form the renderer resolves to a page: the extensionless sibling, the
    // explicit `.html`, a document-relative reference, and one carrying the
    // query and fragment a reproduction leaves behind.
    fixture = makeMemorySite({
      pages: {
        'home.json': pageLinking('home', 'Home', [
          'about',
          '/terms.html',
          './privacy',
          'contact?v=2#form',
          'https://elsewhere.example/pricing',
          '#anchor-on-this-page',
        ]),
        'about.json': pageLinking('about', 'About', []),
        'terms.json': pageLinking('terms', 'Terms', []),
        'privacy.json': pageLinking('privacy', 'Privacy', []),
        'contact.json': pageLinking('contact', 'Contact', []),
        'pricing.json': pageLinking('pricing', 'Pricing', []),
      },
    })
    expect(reachOf(await rowsOf(fixture))).toEqual({
      home: true,
      about: true,
      terms: true,
      privacy: true,
      contact: true,
      // Someone else's `/pricing`, on someone else's host. It says nothing about
      // ours, and a page of ours that happens to share the name is not reached.
      pricing: false,
    })
  })

  it('test_UAT_FC_REQ-248_pages_are_listed_in_a_stable_order', async () => {
    fixture = makeMemorySite({
      pages: {
        'terms.json': pageLinking('terms', 'Terms', []),
        'home.json': pageLinking('home', 'Home', ['/about', '/terms']),
        'about.json': pageLinking('about', 'About', []),
      },
    })
    const first = (await rowsOf(fixture)).map((r) => r.id)
    const second = (await rowsOf(fixture)).map((r) => r.id)
    expect(second).toEqual(first)
    // The store's own key order, which every adapter lists by — so the control
    // imposes none of its own and two openings agree without it.
    expect(first).toEqual(['about', 'home', 'terms'])
  })
})
