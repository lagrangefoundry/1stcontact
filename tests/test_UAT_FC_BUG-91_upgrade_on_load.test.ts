/**
 * [[BUG-91]] — a stored instance pinned to an older contract renders anyway.
 *
 * WHAT WENT WRONG. `contact-form` was bumped 5 → 6 ([[REQ-241]]) and 6 → 7
 * ([[REQ-243]]). Both bumps declared their migrations, so [[BUG-85]]'s guard was
 * satisfied and CI was green; both carried the repo fixtures under
 * `storage/sites/` to v7. Neither reached D1, because a commit cannot. Five of
 * the six sites in the live store were left holding `contact-form@5`, and every
 * page carrying one refused to render at all — the builder's preview pane showed
 * nothing but `Module not found in catalog: 'contact-form' v5`.
 *
 * WHAT THESE ASSERT. That the refusal is gone, and that nothing else moved with
 * it: the store keeps its pin, `upgradeSiteModules` goes on reporting the
 * instance as stale, and a malformed page still gets a validation error rather
 * than an exception out of the upgrade path.
 *
 * WHY THE INSTANCE IS THE REAL ONE. `fixtures/bug91/contact-form-v5-orphan.json`
 * is the `enquiry` form lifted verbatim out of the store that went dark — its
 * fields, its copy and its whole `form` slot. A hand-written approximation would
 * be a test of the shape somebody imagined, and the shape somebody imagined is
 * what both bumps were already checked against.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { upgradeSiteModules } from '../tools/generate/src/store/upgrade-site'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'

/** The real orphan: `contact-form@5`, exactly as the live store held it. */
const ORPHAN = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures/bug91/contact-form-v5-orphan.json'), 'utf8'),
)

/** The v5 asset triple — the shape v6 replaces with a list ([[REQ-241]]). */
const TRIPLE = {
  asset: 'whitepaper-a',
  assetName: 'The Whitepaper',
  assetUrl: 'https://example.test/a.pdf',
}

/** A page whose L1 is one slot, with `instance` mounted into it. */
function pageWith(instance: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: [instance],
    l1: {
      widths: [1280],
      background: '#ffffff',
      textColor: '#111827',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [{ kind: 'slot', id: 'enquiry-slot', name: 'enquiry', behavior: 'contact-form' }],
      },
    },
  }
}

/** A store holding one site whose only page carries `instance`. */
function storeWith(instance: Record<string, unknown>, slug = 'dark') {
  const store = memorySiteStore()
  store.seed(slug, { siteJson: starterSiteJson(slug), pages: { 'home.json': pageWith(instance) } })
  return store
}

/** The site's one module instance, as the LOAD produced it. */
async function loadedInstance(store: ReturnType<typeof memorySiteStore>, slug = 'dark') {
  const draft = await store.loadDraft(slug)
  expect(draft).not.toBeNull()
  if (!draft!.result.ok) {
    throw new Error(`load failed: ${JSON.stringify(draft!.result.errors)}`)
  }
  return draft!.result.value.site.pages[0].modules[0]
}

describe('BUG-91 — stored instances are carried to the current contract on load', () => {
  it('test_UAT_FC_BUG-91_stale_pin_loads_at_the_current_version', async () => {
    const store = storeWith(structuredClone(ORPHAN))

    const instance = await loadedInstance(store)

    // THE CLAIM: a loaded site has current-contract instances, the way it has
    // literal colours. The pin the store holds is not observable from here.
    expect(instance.version).toBe(7)
    expect(instance.type).toBe('contact-form')
    // v6 arrived at: a form that promised nothing promises an EMPTY list, which
    // is the honest way to say "this form gates nothing" rather than an absent
    // key that means the same thing by accident.
    expect(instance.config.assets).toEqual([])
    // …and v7: no assets, so no template — this form sends no mail, which is the
    // behaviour it already had under v5.
    expect(instance.config.template).toBeUndefined()
    // Everything outside the contract change survives the crossing intact.
    expect(instance.id).toBe('enquiry')
    expect(instance.slot).toBe('enquiry')
    expect(instance.config.submitLabel).toBe('Send')
    expect((instance.config.fields as unknown[]).length).toBe(3)
    expect(instance.slots?.form).toBeDefined()
  })

  it('test_UAT_FC_BUG-91_gated_form_keeps_its_asset_and_gains_its_template', async () => {
    // The v5 shape a gated download was stored in: three sibling strings, which
    // v6 turns into a one-item list and v7 gives a template to name.
    const gated = structuredClone(ORPHAN)
    gated.config = { ...gated.config, ...TRIPLE }
    const store = storeWith(gated)

    const instance = await loadedInstance(store)

    expect(instance.version).toBe(7)
    // THE SAME asset under THE SAME key — the at-most-once ledger's handle on
    // every delivery already made is what a lost key would break.
    expect(instance.config.assets).toEqual([
      { key: 'whitepaper-a', name: 'The Whitepaper', url: 'https://example.test/a.pdf' },
    ])
    // v7 made absence mean "send nothing", so a form that was already delivering
    // must come out naming the template it was already sending.
    expect(instance.config.template).toBe('asset')
    // The keys v6 retired are gone, not carried alongside their replacement.
    expect(instance.config.asset).toBeUndefined()
    expect(instance.config.assetUrl).toBeUndefined()
  })

  it('test_UAT_FC_BUG-91_a_page_on_the_old_pin_renders', async () => {
    const store = storeWith(structuredClone(ORPHAN))
    const draft = await store.loadDraft('dark')
    expect(draft!.result.ok).toBe(true)
    const loaded = draft!.result.ok ? draft!.result.value : null

    // THE USER-VISIBLE SYMPTOM, asserted directly: this threw
    // `Module not found in catalog: 'contact-form' v5` and the preview pane
    // showed the message where the site should have been.
    const out = await renderSiteFiles(loaded!)

    const html = out.files.get('home.html')!
    expect(html).toContain('<form')
    expect(html).toContain('Send')
    // The edit hook the builder's preview targets the instance by.
    expect(html).toContain('data-fc-module="enquiry"')
  })

  it('test_UAT_FC_BUG-91_loading_writes_nothing_and_the_repair_still_reports_it', async () => {
    const store = storeWith(structuredClone(ORPHAN))
    const before = structuredClone(await store.readPages('dark'))

    await store.loadDraft('dark')

    // Rendering a stale instance is not the same act as repairing one. The store
    // keeps its pin until an edit rewrites the page or an operator asks.
    expect(await store.readPages('dark')).toEqual(before)
    expect((await store.readPages('dark'))[0].page.modules[0].version).toBe(5)

    // And the repair goes on seeing it, because it IS stale — what changed is
    // only that being stale no longer takes the site down.
    const report = await upgradeSiteModules(store, 'dark')
    expect(report.stale).toBe(1)
    expect(report.written).toBe(false)
    expect(report.pages[0].upgrades[0]).toMatchObject({ id: 'enquiry', from: 5, to: 7 })
  })

  it('test_UAT_FC_BUG-91_an_instance_already_current_is_untouched', async () => {
    const current = structuredClone(ORPHAN)
    current.version = 7
    current.config = { ...current.config, assets: [] }
    const store = storeWith(current)

    const instance = await loadedInstance(store)

    expect(instance.version).toBe(7)
    expect(await upgradeSiteModules(store, 'dark')).toMatchObject({ stale: 0 })
  })

  it('test_UAT_FC_BUG-91_a_malformed_module_is_a_validation_error_not_an_exception', async () => {
    // Not an instance at all. The upgrade path is a poor diagnostician of
    // malformed JSON — it would throw where the schema names the pointer — so it
    // must decline to look and leave the page to validation.
    const store = storeWith({ id: 'broken', type: 'contact-form' } as Record<string, unknown>)

    const draft = await store.loadDraft('dark')

    expect(draft!.result.ok).toBe(false)
    if (draft!.result.ok) throw new Error('expected a validation failure')
    expect(draft!.result.errors.some((e) => e.path.includes('/modules/0'))).toBe(true)
  })

  it('test_UAT_FC_BUG-91_a_type_the_catalog_has_never_heard_of_is_left_alone', async () => {
    // A module that was removed, or one a newer build had. An upgrade pass
    // inventing an opinion about it would be the wrong place to decide, so it
    // reaches the render as the catalog miss it genuinely is.
    const stranger = structuredClone(ORPHAN)
    stranger.type = 'not-a-module'
    const store = storeWith(stranger)

    const draft = await store.loadDraft('dark')
    expect(draft!.result.ok).toBe(true)
    const loaded = draft!.result.ok ? draft!.result.value : null

    await expect(renderSiteFiles(loaded!)).rejects.toThrow(/not-a-module/)
  })
})
