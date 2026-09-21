// @vitest-environment jsdom
/**
 * [[BUG-131]] UATs — **"Open in new tab" opens the DRAFT render**, in both
 * channels.
 *
 * The control's whole purpose is the honest view: an iframe can distort layout,
 * so a real tab is the production render of the page ([[DOC-28]] §10, and
 * [[DOC-8]] §3.3's framing of the same action as a production-fidelity check).
 * In Edit it was opening the edit channel — a deliberately crippled render, every
 * region outlined, addresses stamped on the markup, every panel open at once, no
 * link target, no form action, no client script — so the operator who asked to
 * see the page was handed the editor's scaffolding with no editor attached to
 * it. That inverts the one thing the control is for.
 *
 * WHAT MAKES THIS EVIDENCE. Driven against the ACTUAL composition —
 * `mountBuilder`, the real panel, the real toolbar, the real URL helpers — for
 * the reason every other builder suite is: the claim is about which URL a
 * *registered action* derives from the *live pane*, and a stand-in strip would
 * assert that of itself. Only the page listing and the site/business transports
 * are injected, the way this file's neighbours inject them.
 *
 * Covered:
 *
 *   1  in Edit, the link is the draft render of the page on screen — while the
 *      iframe is on the edit render of the same page, which is the one case
 *      where the tab and the pane MUST disagree
 *   2  the href follows the operator between pages, rather than freezing on the
 *      page the channel opened on
 *   3  View is untouched: it opens exactly what the pane is showing
 *   4  no reachable state of the control names the edit channel at all
 *   5  the draft URL keeps the business prefix, so what the operator copies out
 *      of the browser resolves to the business they are in
 */
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ site: 'acme', latest: null }]

const PAGES = [
  { id: 'home', slug: 'home', title: 'Home', reachable: true },
  { id: 'about', slug: 'about', title: 'About us', reachable: true },
]

function memoryStorage(): Storage {
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
  } as Storage
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

/** `app.js` imports the webui components by bare specifier — hence the dynamic load. */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`BUG-131 open-in-new-tab suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('BUG-131 — the tab is the production render', () => {
  let root: HTMLElement

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    setBusinessScope(null)
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
  })

  const mount = (over: Record<string, unknown> = {}) =>
    mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      pageState,
      pagesTransport: { list: async () => ({ pages: PAGES }) },
      ...over,
    })

  const frameOf = () =>
    root.querySelector('.builder-panel__frame') as HTMLIFrameElement
  const linkOf = () =>
    root.querySelector('.builder-toolbar__open') as HTMLAnchorElement | null
  const hrefOf = () => linkOf()!.getAttribute('href')
  const modeButton = (id: string) =>
    root.querySelector(`.builder-toolbar__modes button[data-mode="${id}"]`) as HTMLButtonElement

  const choose = (slug: string): void => {
    const select = root.querySelector('[data-action="pages"] select') as HTMLSelectElement
    select.value = slug
    select.dispatchEvent(new Event('change'))
  }

  it('test_UAT_FC_BUG-131_edit_mode_opens_the_draft_render_of_the_page_on_screen', async () => {
    mount()
    await settled()
    // The channel the control is defined against, before anything is switched.
    expect(hrefOf()).toBe('/preview/acme/draft/')

    modeButton('edit').click()
    await settled()

    // The pane is on the edit render — the control is offered in this channel,
    // so this is the state the bug was reported in.
    expect(frameOf().getAttribute('src')).toBe('/preview/acme/edit/')
    expect(linkOf(), 'the control is not offered in Edit at all').not.toBeNull()
    // …and the tab is the DRAFT render of that same page. The one case where the
    // tab and the pane must disagree, because the pane is deliberately showing a
    // render that is not the site.
    expect(hrefOf()).toBe('/preview/acme/draft/')
  })

  it('test_UAT_FC_BUG-131_the_href_follows_the_operator_between_pages_in_edit', async () => {
    mount()
    modeButton('edit').click()
    await settled()

    choose('about')
    // Moving between pages re-points the link at THAT page's draft render —
    // deriving the draft URL once at mount would freeze it on the page the
    // channel opened on, which is the second half of the same defect.
    expect(frameOf().getAttribute('src')).toBe('/preview/acme/edit/about')
    expect(hrefOf()).toBe('/preview/acme/draft/about')

    choose('home')
    expect(hrefOf()).toBe('/preview/acme/draft/home')
  })

  it('test_UAT_FC_BUG-131_view_mode_opens_exactly_what_the_pane_is_showing', async () => {
    mount()
    await settled()
    // View already opened the honest render; this change must not have moved it.
    expect(hrefOf()).toBe(frameOf().getAttribute('src'))

    choose('about')
    expect(frameOf().getAttribute('src')).toBe('/preview/acme/draft/about')
    expect(hrefOf()).toBe('/preview/acme/draft/about')
  })

  it('test_UAT_FC_BUG-131_no_reachable_state_of_the_control_names_the_edit_channel', async () => {
    mount()
    await settled()

    const seen: string[] = []
    for (const mode of ['view', 'edit', 'view']) {
      modeButton(mode).click()
      await settled()
      for (const slug of ['about', 'home']) {
        choose(slug)
        if (linkOf()) seen.push(hrefOf()!)
      }
    }

    expect(seen.length, 'no href was observed at all').toBeGreaterThan(0)
    // The negative claim, stated once over every state rather than implied by
    // the positive ones: there is no page, and no channel, from which this
    // control can hand the operator a render that is not the site.
    for (const href of seen) {
      expect(href, `the tab names the edit channel: ${href}`).not.toContain('/edit/')
      expect(href).toMatch(/\/preview\/acme\/draft\//)
    }
  })

  it('test_UAT_FC_BUG-131_the_draft_url_keeps_the_business_prefix', async () => {
    mount({
      businesses: [{ id: 'acct_salon', name: 'Salon', selectable: true }],
      person: { name: 'Sam Salon', email: 'sam@example.test' },
      loadSites: async () => [{ site: 'salon-site', latest: null }],
    })
    await settled()

    modeButton('edit').click()
    await settled()

    // Composed from the pane's own URL, so the scope prefix the switcher set
    // survives the change of channel. Without it the tab would open another
    // business's site — or the origin's fallback — from a link the operator can
    // copy out of the browser.
    expect(frameOf().getAttribute('src')).toBe('/b/acct_salon/preview/salon-site/edit/')
    expect(hrefOf()).toBe('/b/acct_salon/preview/salon-site/draft/')
  })
})
