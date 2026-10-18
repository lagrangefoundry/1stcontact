import { describe, expect, it } from 'vitest'
import {
  captureDraft,
  containmentCheck,
  draftChanges,
  settleContainment,
  type ContainmentCheck,
} from '../tools/generate/src/cli/ai/account-core'
import { editDocumentSet, editL1Set } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

/**
 * [[BUG-219]] — **a page-style change is in the host's record of a delegation.**
 *
 * WHAT THIS IS EVIDENCE FOR. A builder briefed to make one header band dark
 * repainted the whole page — `set_page_style` moved the document background
 * from cream to near-black — and the host's record (`account.changed`) said
 * nothing about it, because the comparison walked only the page's element tree
 * and never the document keys beside it. Every containment check the host
 * settles from that record was therefore blind to it, and would have PASSED.
 *
 * These cases drive the real `editDocumentSet` write — the one `set_page_style`
 * makes — through the real store port, take the host's two captures, and assert
 * on what the record and the containment settlement say.
 */

const CREAM = '#f5efe6'
const NEAR_BLACK = '#111111'

function creamPage(name: string): Record<string, unknown> {
  const page = starterHomePage(name) as Record<string, unknown>
  const l1 = page.l1 as Record<string, unknown> & { root: { children: unknown[] } }
  l1.background = CREAM
  l1.root.children = ['header', 'body'].map((word) => ({
    kind: 'text',
    text: word,
    axes: { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 },
  }))
  return page
}

async function bracket(
  site: SiteFixture,
  work: () => Promise<void>,
): Promise<ReturnType<typeof draftChanges>> {
  const from = await captureDraft(site.store, site.slug)
  await work()
  const to = await captureDraft(site.store, site.slug)
  return draftChanges(from, to)
}

async function band(site: SiteFixture, index: number): Promise<Record<string, unknown>> {
  const capture = await captureDraft(site.store, site.slug)
  const page = capture.outline.pages[0].page as { l1: { root: { children: unknown[] } } }
  return structuredClone(page.l1.root.children[index]) as Record<string, unknown>
}

function check(text: string): ContainmentCheck {
  const parsed = containmentCheck(text)
  if (parsed === null) throw new Error(`not a containment check: ${text}`)
  return parsed
}

describe('BUG-219 page-style changes are in the host record', () => {
  it('test_UAT_FC_BUG-219_a_page_background_change_appears_in_the_record', async () => {
    const site = makeMemorySite({ pages: { 'home.json': creamPage('acme') } })
    const changed = await bracket(site, async () => {
      await editDocumentSet(site.slug, 'home', { background: NEAR_BLACK }, site.opts)
    })

    expect(changed.differences).toEqual([
      { page: 'home', field: 'l1.background', before: CREAM, after: NEAR_BLACK },
    ])
    await site.dispose()
  })

  it('test_UAT_FC_BUG-219_an_unchanged_page_style_adds_nothing_to_the_record', async () => {
    const site = makeMemorySite({ pages: { 'home.json': creamPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 0)
      node.text = 'masthead'
      await editL1Set(site.slug, 'home', '0.0', node, site.opts)
    })

    expect(changed.differences).toEqual([
      { page: 'home', address: '0.0', field: 'text', before: 'header', after: 'masthead' },
    ])
    await site.dispose()
  })

  it('test_UAT_FC_BUG-219_page_and_address_containment_fail_on_a_page_style_change', async () => {
    const site = makeMemorySite({ pages: { 'home.json': creamPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 0)
      node.text = 'masthead'
      await editL1Set(site.slug, 'home', '0.0', node, site.opts)
      await editDocumentSet(site.slug, 'home', { background: NEAR_BLACK }, site.opts)
    })

    const onlyHeader = settleContainment(check('only the elements at 0.0 on page home changed'), changed)
    expect(onlyHeader?.settled).toBe(false)
    expect(onlyHeader?.reason).toContain('l1.background')

    const pageUntouched = settleContainment(check('page home has no changes'), changed)
    expect(pageUntouched?.settled).toBe(false)
    await site.dispose()
  })

  it('test_UAT_FC_BUG-219_a_page_style_change_is_not_an_element_field', async () => {
    const site = makeMemorySite({ pages: { 'home.json': creamPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 0)
      node.text = 'masthead'
      await editL1Set(site.slug, 'home', '0.0', node, site.opts)
      await editDocumentSet(site.slug, 'home', { background: NEAR_BLACK }, site.opts)
    })

    const textOnly = settleContainment(check('no element changed any field other than text'), changed)
    expect(textOnly).toEqual({ settled: true, reason: "the host's record shows no change outside it" })
    await site.dispose()
  })
})
