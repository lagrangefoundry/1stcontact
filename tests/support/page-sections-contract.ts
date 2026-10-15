import { describe, expect, it } from 'vitest'
import {
  editL1Get,
  editL1Set,
  editPageDecompose,
  editPageRecompose,
  editPageUpdate,
} from '../../tools/generate/src/cli/edit'
import { readDraftSnapshot } from '../../tools/generate/src/publish/publish'
import charliesHome from '../fixtures/req396-charlies/pages/home.json'
import charliesSite from '../fixtures/req396-charlies/site.json'
import type { ContractBackend } from './site-store-contract'
import type { SiteFixture } from './site-factory'

/**
 * [[REQ-396]] — STORING A PAGE AS SECTIONS, one body of assertions run against
 * every adapter: memory and filesystem in the node project, D1 in workerd. The
 * port's own contract is in `site-store-contract.ts`, shaped this way for the
 * reason given there; this is the same arrangement for one more behaviour.
 *
 * The subject is Charlie's Plumbing 2's real home page: twelve id'd sections
 * under a root stack, and a contact form hosted by `quote-form-section`.
 */

export const CHARLIES_SECTIONS = [
  'emergency-bar',
  'header',
  'hero-section-outer',
  'services-glance',
  'kitchens-bathrooms',
  'process',
  'story',
  'emergencies',
  'reviews',
  'trust-strip',
  'quote-form-section',
  'footer',
]

const home = (): Record<string, unknown> => structuredClone(charliesHome) as Record<string, unknown>

/** Charlie's site, seeded whole — exactly as every existing page is stored. */
export const charliesSeed = () => ({
  siteJson: structuredClone(charliesSite) as Record<string, unknown>,
  pages: { 'home.json': home() },
})

export function describePageSectionsContract(backend: ContractBackend, track: (f: SiteFixture) => void): void {
  const fixture = async (): Promise<SiteFixture> => {
    const f = await backend.make(charliesSeed())
    track(f)
    return f
  }
  const homeOf = async (f: SiteFixture) => (await f.store.readPages(f.slug)).find((p) => p.name === 'home.json')!

  describe(`page sections over the ${backend.name} store`, () => {
    it('test_UAT_FC_REQ-396_a_decomposed_page_reads_back_assembled_and_identical', async () => {
      const f = await fixture()
      const before = await homeOf(f)
      expect(before.sections).toBeUndefined()
      const outline = await f.store.draftOutline(f.slug)

      await editPageDecompose(f.slug, 'home', f.opts)

      const after = await homeOf(f)
      expect(after.sections).toEqual(CHARLIES_SECTIONS)
      expect(after.page).toEqual(home())
      expect(JSON.stringify(after.page)).toBe(JSON.stringify(home()))
      // Nothing to publish: how a page is stored is not what it says.
      expect(await f.store.draftOutline(f.slug)).toEqual(outline)
      const snapshot = await readDraftSnapshot(f.store, f.slug)
      expect(snapshot.pages.find((p) => p.name === 'home.json')).toEqual({ name: 'home.json', page: home() })
      // And the draft still loads as one page.
      const loaded = await f.store.loadDraft(f.slug)
      expect(loaded?.result.ok).toBe(true)
    })

    it('test_UAT_FC_REQ-396_a_section_write_changes_that_section_alone', async () => {
      const f = await fixture()
      await editPageDecompose(f.slug, 'home', f.opts)
      const version = await f.store.version(f.slug)

      const story = (await editL1Get(f.slug, 'home', '0', { ...f.opts, section: 'story' })).data as { node: Record<string, any> }
      const hero = (await editL1Get(f.slug, 'home', '0.0', { ...f.opts, section: 'hero-section-outer' })).data as {
        node: unknown
      }
      const kicker = { kind: 'text', id: 'story-kicker', text: 'Since 1987', axes: { color: '#111111', fontSizePx: 14, lineHeightPx: 20 } }
      await editL1Set(f.slug, 'home', '0', { ...story.node, children: [kicker, ...story.node.children] }, {
        ...f.opts,
        section: 'story',
      })

      expect(await f.store.version(f.slug)).not.toBe(version)
      const after = (await homeOf(f)).page as { l1: { root: { children: Array<Record<string, any>> } } }
      const expected = home() as typeof after
      expected.l1.root.children[6] = { ...story.node, children: [kicker, ...story.node.children] }
      expect(after).toEqual(expected)
      // The hero's address, read before, still names the same node.
      expect((await editL1Get(f.slug, 'home', '0.0', { ...f.opts, section: 'hero-section-outer' })).data).toEqual(hero)
    })

    it('test_UAT_FC_REQ-396_a_section_unit_cannot_be_written_to_a_page_that_has_no_such_section', async () => {
      const f = await fixture()
      const unit = { node: { kind: 'container', id: 'story', layout: 'stack', children: [] } }
      // Not stored as sections at all.
      await expect(f.store.write(f.slug, { sections: [{ page: 'home.json', id: 'story', unit }] })).rejects.toThrow(
        /not stored as sections/,
      )
      await editPageDecompose(f.slug, 'home', f.opts)
      const before = await homeOf(f)
      // Stored as sections, but with no section of that id — adding one is a frame write.
      await expect(
        f.store.write(f.slug, { sections: [{ page: 'home.json', id: 'nope', unit: { node: { ...unit.node, id: 'nope' } } }] }),
      ).rejects.toThrow(/no section 'nope'/)
      expect(await homeOf(f)).toEqual(before)
    })

    it('test_UAT_FC_REQ-396_a_whole_page_write_keeps_the_page_decomposed_and_recompose_joins_it', async () => {
      const f = await fixture()
      await editPageDecompose(f.slug, 'home', f.opts)
      // A tool that knows nothing about sections writes the whole page.
      await editPageUpdate(f.slug, 'home', { ...f.opts, title: 'Charlie’s Plumbing' })
      const kept = await homeOf(f)
      expect(kept.sections).toEqual(CHARLIES_SECTIONS)
      expect(kept.page.title).toBe('Charlie’s Plumbing')

      await editPageRecompose(f.slug, 'home', f.opts)
      const joined = await homeOf(f)
      expect(joined.sections).toBeUndefined()
      expect(joined.page).toEqual({ ...home(), title: 'Charlie’s Plumbing' })

      // A removed page takes its sections with it: one re-added under the same
      // name is whole, with nothing left over.
      await editPageDecompose(f.slug, 'home', f.opts)
      await f.store.write(f.slug, { removePages: ['home.json'] })
      await f.store.write(f.slug, { pages: [{ name: 'home.json', page: home() }] })
      const fresh = await homeOf(f)
      expect(fresh.sections).toBeUndefined()
      expect(fresh.page).toEqual(home())
    })
  })
}
