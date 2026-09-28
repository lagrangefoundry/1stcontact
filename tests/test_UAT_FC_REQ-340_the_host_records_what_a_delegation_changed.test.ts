import { describe, expect, it } from 'vitest'
import {
  captureDraft,
  draftChanges,
  DIFFERENCE_LIMIT,
  type DraftDifference,
} from '../tools/generate/src/cli/ai/account-core'
import { canonicalJson } from '../tools/generate/src/store/revision-model'
import { editAssetAdd, editConfigSet, editL1Set, editPageRm } from '../tools/generate/src/cli/edit'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { makeMemorySite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'

/**
 * [[REQ-340]] — **the host derives its own record of what a delegation changed**
 * (DOC-60 §1).
 *
 * WHAT THIS IS EVIDENCE FOR. Everything else on a delegation result is the
 * worker's word. Two of the seven delegations that had ever run came back
 * `outcome: silent` with real element writes committed on the site, and nothing
 * contradicted them. These cases drive REAL writes through the same `edit*`
 * entry points the worker's L1 surface calls, take the host's two captures
 * through the REAL store port, and assert on what the comparison says — so a
 * passing case is a claim about what the store actually held, not about a
 * record anyone reported.
 *
 * THE BEHAVIOURS, in the order the requirement states them:
 *
 *   1. a capture before and a capture after, compared — and no part of the
 *      result coming from anything a worker says;
 *   2. a difference names the page, the element address, the field path, and
 *      both values — with an unchanged field and an unchanged element absent,
 *      and a field that did not exist before shown as newly present;
 *   3. a delegation that changed nothing yields an empty diff, distinguishable
 *      from a diff that was never taken;
 *   5. derived by comparing state, so a change the journal renders identically
 *      on both sides is still seen;
 *   6. it speaks for the window and attributes nothing;
 *   7. it costs what the change costs, not what the page costs.
 *
 * Behaviour 4 — the record returned BESIDE the worker's self-report rather than
 * instead of it — is the delegation surface's own shape and is exercised
 * end-to-end in the workerd suite, where a real worker runs.
 */

/** The page every case starts from: three bands, so an insertion has somewhere to go. */
function threeBandPage(name: string): Record<string, unknown> {
  const page = starterHomePage(name) as Record<string, unknown>
  const l1 = page.l1 as { root: { children: unknown[] } }
  l1.root.children = ['one', 'two', 'three'].map((word) => ({
    kind: 'text',
    text: word,
    axes: { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 },
  }))
  return page
}

/** The same page with a carousel mounted, for the cases about component scope. */
function pageWithModule(name: string): Record<string, unknown> {
  const page = threeBandPage(name)
  const l1 = page.l1 as { root: { children: unknown[] } }
  l1.root.children.push({ kind: 'slot', name: 'gallery' })
  page.modules = [
    {
      id: 'gallery',
      type: 'carousel',
      version: 3,
      slot: 'gallery',
      config: {},
      slots: { slide: [{ kind: 'text', text: 'A great experience.' }] },
    },
  ]
  return page
}

/** A site, and the bracket a delegation would take around whatever runs inside it. */
async function bracket(
  site: SiteFixture,
  work: () => Promise<void>,
): Promise<ReturnType<typeof draftChanges>> {
  const from = await captureDraft(site.store, site.slug)
  await work()
  const to = await captureDraft(site.store, site.slug)
  return draftChanges(from, to)
}

/** The band at `0.<index>` as it stands, so a case edits what is there. */
async function band(site: SiteFixture, index: number): Promise<Record<string, unknown>> {
  const capture = await captureDraft(site.store, site.slug)
  const page = capture.outline.pages[0].page as { l1: { root: { children: unknown[] } } }
  return structuredClone(page.l1.root.children[index]) as Record<string, unknown>
}

describe('REQ-340 the host derives a structural diff of a delegation', () => {
  it('test_UAT_FC_REQ-340_a_worker_that_reports_nothing_still_leaves_a_record', async () => {
    // Behaviour 1, and the whole reason the requirement exists. The work here is a
    // real element write and NOTHING reports it — the record is derived from two
    // reads of the store, so it holds whether or not anybody said so.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 1)
      node.text = 'rewritten'
      await editL1Set(site.slug, 'home', '0.1', node, site.opts)
    })

    expect(changed.differences).toEqual([
      { page: 'home', address: '0.1', field: 'text', before: 'two', after: 'rewritten' },
    ])
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_a_difference_names_the_page_the_address_the_field_and_both_values', async () => {
    // Behaviour 2. A paint change is the case behaviour 5 is about: the journal
    // records a TEXT rendering of an element, which is byte-identical on both
    // sides of this write, so a record built from the journal could not see it.
    // Comparing state does.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 0)
      ;(node.axes as Record<string, unknown>).color = '#b91c1c'
      await editL1Set(site.slug, 'home', '0.0', node, site.opts)
    })

    expect(changed.differences).toEqual([
      {
        page: 'home',
        address: '0.0',
        field: 'axes.color',
        before: '#111827',
        after: '#b91c1c',
      },
    ])
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_a_field_that_did_not_exist_is_newly_present_not_a_change_from_nothing', async () => {
    // Behaviour 2's last sentence. `before` is ABSENT rather than null, because a
    // field that arrived and a field that was set to null are different facts and
    // a caller has to be able to tell them apart.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 2)
      ;(node.axes as Record<string, unknown>).textAlign = 'center'
      await editL1Set(site.slug, 'home', '0.2', node, site.opts)
    })

    expect(changed.differences).toHaveLength(1)
    const only = changed.differences[0]
    expect(only).toEqual({
      page: 'home',
      address: '0.2',
      field: 'axes.textAlign',
      after: 'center',
    })
    expect('before' in only).toBe(false)
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_an_unchanged_element_and_an_unchanged_field_never_appear', async () => {
    // Behaviour 2's middle sentences, stated as a property rather than as the
    // count above: of the three bands and the five axes on the one that moved,
    // exactly one field is named.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 1)
      ;(node.axes as Record<string, unknown>).fontWeight = 700
      await editL1Set(site.slug, 'home', '0.1', node, site.opts)
    })

    expect(changed.differences.map((d) => d.address)).toEqual(['0.1'])
    expect(changed.differences.map((d) => d.field)).toEqual(['axes.fontWeight'])
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_a_delegation_that_changed_nothing_yields_an_empty_diff', async () => {
    // Behaviour 3. The worker read the page and wrote the element back unchanged —
    // which still moves the draft's change counter, so this is not the trivial
    // case of nothing having happened at all.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const from = await captureDraft(site.store, site.slug)
    const node = await band(site, 0)
    await editL1Set(site.slug, 'home', '0.0', node, site.opts)
    const to = await captureDraft(site.store, site.slug)

    const changed = draftChanges(from, to)
    expect(changed.differences).toEqual([])
    // And distinguishable from a record that was never taken: the bracket moved,
    // so the caller can see that somebody looked and found nothing.
    expect(to.at).toBeGreaterThan(from.at)
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_an_inserted_band_costs_one_addition_not_a_rewritten_page', async () => {
    // Behaviour 7, and the case that makes it true rather than aspirational. A
    // position-wise comparison would report all three surviving bands as
    // rewritten because each one moved down by one — a page's worth of difference
    // for a page's worth of nothing.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const changed = await bracket(site, async () => {
      const root = (await captureDraft(site.store, site.slug)).outline.pages[0].page as {
        l1: { root: Record<string, unknown> }
      }
      const next = structuredClone(root.l1.root)
      ;(next.children as unknown[]).unshift({
        kind: 'text',
        text: 'zero',
        axes: { color: '#111827', fontSizePx: 32, fontWeight: 400, lineHeightPx: 40 },
      })
      await editL1Set(site.slug, 'home', '0', next, site.opts)
    })

    expect(changed.differences).toHaveLength(1)
    expect(changed.differences[0].address).toBe('0.0')
    expect(changed.differences[0].field).toBe('')
    expect('before' in changed.differences[0]).toBe(false)
    expect((changed.differences[0].after as { text: string }).text).toBe('zero')
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_the_record_costs_the_change_rather_than_the_page', async () => {
    // Behaviour 7's measurement. The requirement quotes 287 bytes against a
    // 2,582-byte element; the ratio is the claim, not the numbers, so this asserts
    // the ratio against whatever the fixture's page actually weighs.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const before = await captureDraft(site.store, site.slug)
    const node = await band(site, 1)
    ;(node.axes as Record<string, unknown>).fontSizePx = 44
    await editL1Set(site.slug, 'home', '0.1', node, site.opts)
    const after = await captureDraft(site.store, site.slug)

    const changed = draftChanges(before, after)
    const page = canonicalJson(after.outline.pages[0].page).length
    expect(canonicalJson(changed).length).toBeLessThan(page / 4)
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_a_write_inside_a_component_carries_the_scope_its_address_needs', async () => {
    // An address inside a component instance reaches somewhere else without the
    // `module` and `slot` it is scoped to — the same pair the page map hands out
    // and the write operation takes. A record naming a bare address there would
    // point a caller at the page's own tree.
    const site = makeMemorySite({ pages: { 'home.json': pageWithModule('acme') } })
    const changed = await bracket(site, async () => {
      await editL1Set(
        site.slug,
        'home',
        '0',
        { kind: 'text', text: 'A better experience.' },
        { ...site.opts, module: 'gallery', slot: 'slide' },
      )
    })

    expect(changed.differences).toEqual([
      {
        page: 'home',
        module: 'gallery',
        slot: 'slide',
        address: '0',
        field: 'text',
        before: 'A great experience.',
        after: 'A better experience.',
      },
    ])
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_a_change_that_is_not_on_a_page_is_named_in_its_own_vocabulary', async () => {
    // The capture is the whole draft and not only its element trees, so a worker
    // that changed the site's own settings or added a picture is not reported as
    // having changed nothing. Behaviour 3 is only honest if the capture is
    // comprehensive — an empty diff has to mean the draft did not move.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const changed = await bracket(site, async () => {
      await editConfigSet(site.slug, 'businessName', 'Acme Works', site.opts)
      await editAssetAdd(site.slug, 'mark.svg', Buffer.from('<svg/>'), site.opts)
    })

    // A setting carries no page and no address, which is how a reader tells a
    // field of `site.json` from a field of a page.
    const config = changed.differences.find((d) => d.field === 'businessName')
    expect(config?.after).toBe('Acme Works')
    expect(config && 'page' in config).toBe(false)
    expect(config && 'address' in config).toBe(false)

    // A picture is named by its CONTENT IDENTITY and never by its bytes — the
    // one value about an asset that is the same question at a fixed size.
    const asset = changed.differences.find((d) => d.asset === 'mark.svg')
    expect(asset?.field).toBe('')
    expect(asset && 'before' in asset).toBe(false)
    expect(asset?.after).toMatch(/^[0-9a-f]{64}$/)
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_the_record_speaks_for_the_window_and_attributes_nothing', async () => {
    // Behaviour 6, stated as a property so a reader never mistakes this for an
    // attribution. Two different writers move the draft inside one bracket and
    // both appear, because the record is of the window and not of an actor.
    const site = makeMemorySite({ pages: { 'home.json': threeBandPage('acme') } })
    const changed = await bracket(site, async () => {
      const node = await band(site, 0)
      node.text = 'the worker wrote this'
      await editL1Set(site.slug, 'home', '0.0', node, { ...site.opts, actor: 'ai' })
      const other = await band(site, 2)
      other.text = 'somebody else wrote this'
      await editL1Set(site.slug, 'home', '0.2', other, { ...site.opts, actor: 'human' })
    })

    expect(changed.differences.map((d) => d.after)).toEqual([
      'the worker wrote this',
      'somebody else wrote this',
    ])
    await site.dispose()
  })

  it('test_UAT_FC_REQ-340_a_record_that_hit_its_budget_says_how_much_it_left_out', async () => {
    // A bounded total, stated when it bites. A silent cut would be a false
    // statement about the site; a count tells the caller to go and look.
    const many = Object.fromEntries(
      Array.from({ length: DIFFERENCE_LIMIT + 20 }, (_, i) => [
        `p${i}.json`,
        { ...starterHomePage(`acme`), id: `p${i}`, slug: `p${i}` },
      ]),
    )
    const site = makeMemorySite({ pages: many })
    const from = await captureDraft(site.store, site.slug)
    for (let i = 0; i < DIFFERENCE_LIMIT + 20; i += 1) {
      await editPageRm(site.slug, `p${i}`, site.opts).catch(() => undefined)
    }
    const to = await captureDraft(site.store, site.slug)

    const changed = draftChanges(from, to)
    expect(changed.truncated).toBeGreaterThan(0)
    expect(changed.differences.length).toBeLessThanOrEqual(DIFFERENCE_LIMIT)
    const total = changed.differences.length + (changed.truncated ?? 0)
    expect(total).toBe(DIFFERENCE_LIMIT + 20)
    await site.dispose()
  })
})

/** Every locator a difference may carry, so a reader of a case can see the shape. */
export type { DraftDifference }
