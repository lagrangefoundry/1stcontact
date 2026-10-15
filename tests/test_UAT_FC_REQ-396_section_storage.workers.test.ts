/**
 * [[REQ-396]] — storing a page as sections, over D1 + R2 inside workerd.
 *
 * The shared contract proves the adapter answers exactly as the memory and
 * filesystem ones do. The cases below it are the D1-only half: that a section
 * really is one row of `site_page_sections`, keyed by id, and that writing one
 * section rewrites that row and no other.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { editL1Get, editL1Set, editPageDecompose } from '../tools/generate/src/cli/edit'
import { applySchema, makeD1Site, storeEnv } from './support/d1-site-factory'
import { CHARLIES_SECTIONS, charliesSeed, describePageSectionsContract } from './support/page-sections-contract'
import type { SiteFixture } from './support/site-seed'

/** Every section row of a site's page, by section id. */
async function sectionRows(site: string, page = 'home.json'): Promise<Map<string, string>> {
  const { results } = await storeEnv()
    .DB.prepare('SELECT section_id, unit FROM site_page_sections WHERE site_id = ? AND page_name = ?')
    .bind(site, page)
    .all<{ section_id: string; unit: string }>()
  return new Map((results ?? []).map((r) => [r.section_id, r.unit]))
}

async function frameRow(site: string): Promise<Record<string, any>> {
  const row = await storeEnv()
    .DB.prepare("SELECT page FROM site_pages WHERE site_id = ? AND name = 'home.json'")
    .bind(site)
    .first<{ page: string }>()
  return JSON.parse(row!.page)
}

describe('REQ-396 — a page stored as a frame plus sections, in D1', () => {
  const open: SiteFixture[] = []
  beforeAll(async () => {
    await applySchema()
  })
  afterEach(async () => {
    for (const f of open.splice(0)) await f.dispose()
  })

  describePageSectionsContract({ name: 'D1/R2', make: (o) => makeD1Site(o) }, (f) => open.push(f))

  it('test_UAT_FC_REQ-396_d1_stores_one_row_per_section_and_a_section_write_rewrites_only_its_row', async () => {
    const f = await makeD1Site(charliesSeed())
    open.push(f)
    expect((await sectionRows(f.slug)).size).toBe(0)

    await editPageDecompose(f.slug, 'home', f.opts)
    const frame = await frameRow(f.slug)
    expect(frame.sections).toEqual(CHARLIES_SECTIONS)
    expect(frame.l1.root.children).toEqual([])
    const before = await sectionRows(f.slug)
    expect([...before.keys()].sort()).toEqual([...CHARLIES_SECTIONS].sort())

    const story = (await editL1Get(f.slug, 'home', '0', { ...f.opts, section: 'story' })).data as { node: Record<string, any> }
    await editL1Set(f.slug, 'home', '0', { ...story.node, gapPx: 11 }, { ...f.opts, section: 'story' })

    const after = await sectionRows(f.slug)
    for (const [id, unit] of before) {
      if (id === 'story') expect(JSON.parse(after.get(id)!).node.gapPx).toBe(11)
      else expect(after.get(id), id).toBe(unit)
    }
    expect(await frameRow(f.slug)).toEqual(frame)

    // Removing the page removes its rows.
    await f.store.write(f.slug, { removePages: ['home.json'] })
    expect((await sectionRows(f.slug)).size).toBe(0)
  })
})
