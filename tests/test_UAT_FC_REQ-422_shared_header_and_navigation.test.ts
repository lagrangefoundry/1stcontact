import { describe, expect, it } from 'vitest'
import { validateSite } from '../packages/site-schema/src'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import { siteStructureFindings } from '../tools/generate/src/cli/edit'
import priming from '../tools/generate/src/cli/ai/priming.json'
import layoutConfig from '../tools/generate/src/cli/ai/layout-check.json'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { makeMemorySite, type SiteFixture } from './support/site-factory'

/**
 * [[REQ-422]] — a shared site header and footer, and a navigation that knows the
 * site's pages.
 *
 * WHAT WENT WRONG (Ariel's AR Welding, 2026-10-21). The consultant created an
 * "Art & commissions" page and reported "Art is now in the menu". The home page
 * had no header, title or menu; the art page had no header and no way back home,
 * plus the empty placeholder it was created with. Every page carried its own
 * sections, so nothing was shared and adding a page changed no menu.
 *
 * WHAT THESE PIN. Driven through `l1Operations` — the grant's own operations, the
 * functions the chat's Toolbox invokes — over a real store, and through the real
 * renderer: the header is on every page a reader gets, the menu is the site's page
 * list, and the store-level check names a stranded page, a dead end and a
 * leftover placeholder.
 */

type Ops = Record<string, (p: Record<string, unknown>) => Promise<unknown>>

async function onSite(body: (site: SiteFixture, ops: Ops) => Promise<void>): Promise<void> {
  const site = makeMemorySite()
  try {
    await body(site, l1Operations(site.slug, site.opts) as unknown as Ops)
  } finally {
    await site.dispose()
  }
}

/** The site as a reader gets it: every rendered file, by name. */
async function rendered(site: SiteFixture): Promise<Map<string, string>> {
  const loaded = await site.store.loadDraft(site.slug)
  expect(loaded!.result.ok, loaded!.result.ok ? '' : JSON.stringify(loaded!.result)).toBe(true)
  const out = await renderSiteFiles(loaded!.result.ok ? loaded!.result.value : null!)
  return out.files as Map<string, string>
}

/** The `<header>` / `<footer>` part of a rendered page, or null. */
function part(html: string, name: 'header' | 'footer'): string | null {
  const m = new RegExp(`<${name} data-l1-part="${name}"[^>]*>([\\s\\S]*?)</${name}>`).exec(html)
  return m ? m[1] : null
}

/** The menu's links in a rendered fragment, in order, as `[href, label]`. */
function menuLinks(fragment: string): [string, string][] {
  const list = /<ul class="[^"]*-l">([\s\S]*?)<\/ul>/.exec(fragment)
  if (!list) return []
  return [...list[1].matchAll(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map((m) => [m[1], m[2]])
}

async function siteJson(site: SiteFixture): Promise<Record<string, unknown>> {
  return (await site.store.readSiteJson(site.slug)) as Record<string, unknown>
}

async function navEntries(site: SiteFixture): Promise<{ label: string; target: { pageId?: string } }[]> {
  return ((await siteJson(site)).nav as { entries: { label: string; target: { pageId?: string } }[] }).entries
}

describe('REQ-422 — a shared header and footer, on every page', () => {
  it('test_UAT_FC_REQ-422_header_and_footer_render_on_every_page', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.add_page({ page: 'footer', kind: 'footer' })
      await ops.add_page({ page: 'art', title: 'Art & commissions' })
      const files = await rendered(site)
      for (const file of ['home.html', 'art.html']) {
        const html = files.get(file)!
        const header = part(html, 'header')
        expect(header, file).not.toBeNull()
        expect(part(html, 'footer'), file).not.toBeNull()
        // The page's own root is still the body's `.l1-0`: its addresses do not move.
        expect(html).toMatch(/<div class="l1-0[ "]/)
        // The business name, linking home.
        expect(header).toMatch(/<a class="header-l1-\d+"[^>]*href="\.\/"[^>]*>[^<]+<\/a>/)
      }
      // A part is not a page anyone visits.
      expect(files.has('header.html')).toBe(false)
      expect(files.has('footer.html')).toBe(false)
    })
  })

  it('test_UAT_FC_REQ-422_a_page_that_opts_out_renders_without_them', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.add_page({ page: 'footer', kind: 'footer' })
      await ops.add_page({ page: 'landing', title: 'Spring offer', shared: { header: false } })
      const files = await rendered(site)
      expect(part(files.get('landing.html')!, 'header')).toBeNull()
      expect(part(files.get('landing.html')!, 'footer')).not.toBeNull()
      expect(part(files.get('home.html')!, 'header')).not.toBeNull()
      // …and it can be put back.
      await ops.update_page({ page: 'landing', shared: { header: true } })
      expect(part((await rendered(site)).get('landing.html')!, 'header')).not.toBeNull()
    })
  })

  it('test_UAT_FC_REQ-422_editing_the_header_changes_every_page', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.add_page({ page: 'art', title: 'Art' })
      await ops.set_l1({ page: 'header', path: '0.0', node: { kind: 'text', id: 'header-name', text: 'Ariel AR Welding', link: { href: '/' }, axes: { fontSizePx: 30 } } })
      const files = await rendered(site)
      for (const file of ['home.html', 'art.html']) {
        expect(part(files.get(file)!, 'header')).toContain('Ariel AR Welding')
      }
    })
  })

  it('test_UAT_FC_REQ-422_a_new_page_has_the_shared_header_and_footer', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.add_page({ page: 'footer', kind: 'footer' })
      // A page created after the parts, by the builder's own operation, with nothing else said.
      await ops.add_page({ page: 'contact', title: 'Contact' })
      const html = (await rendered(site)).get('contact.html')!
      expect(part(html, 'header')).not.toBeNull()
      expect(part(html, 'footer')).not.toBeNull()
      // Its way back home is the header's.
      expect(menuLinks(part(html, 'header')!).map(([href]) => href)).toContain('./')
    })
  })

  it('test_UAT_FC_REQ-422_the_header_wordmark_is_sized_from_configuration', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      const header = (await site.store.readPages(site.slug)).find((p) => p.page.kind === 'header')!.page
      const name = (header.l1 as { root: { children: Record<string, unknown>[] } }).root.children[0] as {
        axes: { fontSizePx: number }
        responsive: { fontSizePx: { keyframes: { at: number; value: number }[] } }
      }
      expect(name.axes.fontSizePx).toBe(layoutConfig.brand.wordmarkPx.desktop)
      const sizes = name.responsive.fontSizePx.keyframes.map((k) => k.value)
      expect(sizes).toEqual([layoutConfig.brand.wordmarkPx.phone, layoutConfig.brand.wordmarkPx.desktop])
    })
  })
})

describe('REQ-422 — the navigation knows the site\'s pages', () => {
  it('test_UAT_FC_REQ-422_adding_a_page_adds_a_navigation_item', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.set_navigation({ entries: [{ page: 'home', label: 'Home' }] })
      await ops.add_page({ page: 'art', title: 'Art & commissions' })
      await ops.copy_page({ from: 'art', page: 'gallery', title: 'Gallery' })
      expect((await navEntries(site)).map((e) => e.target.pageId)).toEqual(['home', 'art', 'gallery'])
      const html = (await rendered(site)).get('home.html')!
      expect(menuLinks(part(html, 'header')!)).toEqual([
        ['./', 'Home'],
        ['art', 'Art &amp; commissions'],
        ['gallery', 'Gallery'],
      ])
      // The page being drawn is marked for assistive technology.
      expect(part((await rendered(site)).get('art.html')!, 'header')).toMatch(/<a aria-current="page" [^>]*href="art"/)
    })
  })

  it('test_UAT_FC_REQ-422_hiding_and_reordering_navigation_items', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.add_page({ page: 'prices', title: 'Prices' })
      await ops.add_page({ page: 'gallery', title: 'Gallery' })
      await ops.set_navigation({ entries: [{ page: 'prices', label: 'Our prices' }, { page: 'home', label: 'Home' }] })
      const html = (await rendered(site)).get('home.html')!
      expect(menuLinks(part(html, 'header')!)).toEqual([
        ['prices', 'Our prices'],
        ['./', 'Home'],
      ])
      // Hidden from the menu, not removed from the site.
      expect((await rendered(site)).has('gallery.html')).toBe(true)
    })
  })

  it('test_UAT_FC_REQ-422_removing_or_renaming_a_page_updates_the_navigation', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'art', title: 'Art' })
      await ops.add_page({ page: 'prices', title: 'Prices' })
      await ops.update_page({ page: 'art', title: 'Art & commissions' })
      expect((await navEntries(site)).find((e) => e.target.pageId === 'art')?.label).toBe('Art & commissions')
      // Removing a page the menu names is not refused: the entry goes with it.
      await ops.remove_page({ page: 'art' })
      expect((await navEntries(site)).map((e) => e.target.pageId)).toEqual(['prices'])
    })
  })

  it('test_UAT_FC_REQ-422_phone_width_collapses_the_navigation_without_script', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      const html = (await rendered(site)).get('home.html')!
      const header = part(html, 'header')!
      // A native disclosure, holding the same links.
      expect(header).toMatch(/<details class="header-l1-\d+-m"><summary><span [^>]*>Menu<\/span><\/summary><ul>/)
      // Below 640px the inline list is hidden and the button shown.
      const name = /class="(header-l1-\d+)-l"/.exec(header)![1]
      const phone = /@media \(max-width: 639px\) \{([\s\S]*?)\n\}/.exec(html)![1]
      expect(phone).toMatch(new RegExp(`\\.${name}-l \\{ display: none \\}`))
      expect(phone).toMatch(new RegExp(`\\.${name}-m \\{ display: block \\}`))
      // No script is involved in opening it.
      expect(header).not.toContain('<script')
    })
  })
})

describe('REQ-422 — shared parts are structured, and the site stays coherent', () => {
  it('test_UAT_FC_REQ-422_a_second_header_and_a_menu_entry_for_a_part_are_refused', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await expect(ops.add_page({ page: 'topbar', kind: 'header' })).rejects.toThrow(/already has a header/)
      await expect(ops.set_navigation({ entries: [{ page: 'header' }] })).rejects.toThrow(/not a page a reader can visit/)
    })
  })

  it('test_UAT_FC_REQ-422_an_id_shared_by_a_page_and_its_header_is_refused', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      // `header-name` is the header's wordmark; a page may not reuse it.
      await expect(
        ops.set_l1({ page: 'home', path: '0.0', node: { kind: 'text', id: 'header-name', text: 'Hello' } }),
      ).rejects.toThrow(/site header it is drawn with both use the id 'header-name'/)
    })
  })

  it('test_UAT_FC_REQ-422_menu_labels_and_links_are_inert_structured_data', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.set_navigation({
        entries: [
          { page: 'home', label: '<script>alert(1)</script>' },
          { href: 'javascript:alert(1)', label: 'Bad' },
        ],
      })
      const header = part((await rendered(site)).get('home.html')!, 'header')!
      expect(header).not.toContain('<script>alert')
      expect(header).toContain('&lt;script&gt;')
      expect(header).not.toMatch(/href="javascript:/i)
    })
  })

  it('test_UAT_FC_REQ-422_share_section_makes_a_page_header_the_site_header', async () => {
    await onSite(async (site, ops) => {
      const top = { kind: 'container', id: 'top', layout: 'row', gapPx: 8, children: [{ kind: 'text', id: 'brand', text: 'Bob', link: { href: '/' } }] }
      const body = { kind: 'container', id: 'intro', layout: 'stack', gapPx: 8, children: [{ kind: 'text', text: 'Welcome' }] }
      const root = { kind: 'container', id: 'root', layout: 'stack', gapPx: 0, children: [top, body] }
      await ops.set_l1({ page: 'home', path: '0', node: root })
      await ops.add_page({ page: 'about', title: 'About' })
      await ops.set_l1({ page: 'about', path: '0', node: { ...root, children: [top, { ...body, id: 'story' }] } })
      await ops.share_section({ page: 'home', section: 'top', as: 'header' })
      const pages = await site.store.readPages(site.slug)
      const header = pages.find((p) => p.page.kind === 'header')!.page
      expect((header.l1 as { root: { id: string } }).root.id).toBe('top')
      for (const id of ['home', 'about']) {
        const page = pages.find((p) => p.page.id === id)!.page
        expect((page.l1 as { root: { children: { id: string }[] } }).root.children.map((c) => c.id)).not.toContain('top')
      }
      expect(part((await rendered(site)).get('about.html')!, 'header')).toContain('Bob')
    })
  })

  it('test_UAT_FC_REQ-422_the_schema_rejects_a_part_that_is_served_or_carries_parts', () => {
    const doc = { widths: [375, 1280], root: { kind: 'container', layout: 'stack', children: [] } }
    const result = validateSite({
      ...starterSiteJson('s'),
      pages: [
        { id: 'home', slug: 'home', title: 'Home', modules: [], l1: doc },
        { id: 'header', slug: 'header', title: 'H', kind: 'header', shared: { footer: false }, seoMeta: { title: 'x', description: 'y' }, modules: [], l1: doc },
      ],
    })
    expect(result.ok).toBe(false)
    const messages = result.ok ? [] : result.errors.map((e) => e.message).join('\n')
    expect(messages).toMatch(/is itself a shared part/)
    expect(messages).toMatch(/never served on its own/)
  })
})

describe('REQ-422 — the host check names a stranded page, a dead end and a leftover placeholder', () => {
  it('test_UAT_FC_REQ-422_structure_findings_name_each_fault', async () => {
    await onSite(async (site, ops) => {
      // `hidden` is in no menu and linked from nowhere; `landing` opts out of the
      // header and has no link home; both still hold the placeholder they were made with.
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.add_page({ page: 'hidden', title: 'Hidden', nav: false })
      await ops.add_page({ page: 'landing', title: 'Landing', shared: { header: false } })
      const found = siteStructureFindings(await site.store.readPages(site.slug), await siteJson(site))
      const kinds = (page: string) => found.filter((f) => f.page === page).map((f) => f.kind).sort()
      expect(kinds('hidden')).toEqual(['leftover_placeholder', 'unreachable'])
      expect(kinds('landing')).toEqual(['dead_end', 'leftover_placeholder'])
      expect(found.find((f) => f.kind === 'dead_end')!.text).toMatch(/no link back to the home page/)
    })
  })

  it('test_UAT_FC_REQ-422_a_page_in_the_shared_header_menu_is_reachable_and_not_a_dead_end', async () => {
    await onSite(async (site, ops) => {
      await ops.add_page({ page: 'header', kind: 'header' })
      await ops.add_page({ page: 'art', title: 'Art' })
      await ops.set_l1({ page: 'art', path: '0.0', node: { kind: 'text', id: 'intro', text: 'Commissions open' } })
      const found = siteStructureFindings(await site.store.readPages(site.slug), await siteJson(site))
      expect(found.filter((f) => f.page === 'art')).toEqual([])
    })
  })
})

describe('REQ-422 — builders and the consultant are taught it', () => {
  it('test_UAT_FC_REQ-422_priming_carries_the_navigation_rules', () => {
    const doc = priming as unknown as Record<string, unknown>
    const text = (key: string): string => JSON.stringify(doc[key])
    for (const key of ['builder_priming', 'builder_priming_with_corpus']) {
      expect(text(key), key).toMatch(/header and footer are SHARED/)
      expect(text(key), key).toMatch(/set_navigation/)
      expect(text(key), key).toMatch(/never smaller than the page's section headings/)
    }
    for (const key of ['priming', 'priming_without_corpus']) {
      expect(text(key), key).toMatch(/one shared header and one shared footer/)
      expect(text(key), key).toMatch(/a menu you only asked for is not a menu/)
    }
  })
})
