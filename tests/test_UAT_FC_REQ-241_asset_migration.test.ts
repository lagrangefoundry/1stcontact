/**
 * [[REQ-241]] §4 — **the v5 → v6 step, and the id that does not move.**
 *
 * WHY THIS IS ITS OWN FILE AND ITS OWN EVIDENCE. [[BUG-85]] made a declared
 * migration the PRECONDITION for a version bump rather than a courtesy, after
 * `account-chrome` went to v2 with no step and took 1st Contact's own site down
 * — every instance stored at the old number stopped resolving, and the only copy
 * anybody migrated was the repo fixture. The guard in
 * `test_UAT_FC_BUG-85_migration_path_guard` catches a MISSING step; nothing
 * catches a step that is declared and wrong, and this one is not an identity
 * function. It carries data the ledger depends on.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *an upgraded instance losing the asset's key* — the at-most-once ledger
 *     loses its handle on every delivery already made, and the next submission
 *     mails the same person the same artifact again;
 *   - *an instance that promised nothing coming out with no `assets` key* —
 *     "this form gates nothing" said by omission rather than said;
 *   - *the module being renamed* — every frozen `site_revisions` snapshot
 *     referencing `contact-form` stops resolving, which no migration can reach.
 */
import { describe, it, expect } from 'vitest'
import { CATALOG, getModuleMeta, latestModuleVersion } from '../packages/framework/src/modules/catalog'
import { missingMigrations, upgradeInstance } from '../packages/framework/src/modules/upgrade'
import { validateBehaviorConfig } from '../packages/framework/src/modules/behavior'

/** The `form` slot is required, so every fixture below supplies the same one. */
const FORM_SLOT = {
  kind: 'box' as const,
  children: [{ kind: 'control' as const, control: 'submit' }],
}

/** One stored v5 `contact-form`, with whatever config the case is about. */
function storedV5(config: Record<string, unknown>) {
  return {
    id: 'signup',
    type: 'contact-form',
    version: 5,
    config: {
      fields: [{ name: 'email', label: 'Your email', type: 'email', required: true }],
      submitLabel: 'Send',
      ...config,
    },
    slots: { form: FORM_SLOT },
  }
}

describe('REQ-241 — contact-form v5 → v6', () => {
  it('test_UAT_FC_REQ-241_a_stored_triple_upgrades_to_a_one_item_list', () => {
    const { instance, droppedConfigKeys } = upgradeInstance(
      storedV5({
        asset: 'whitepapers',
        assetName: 'both whitepapers',
        assetUrl: 'https://example.test/papers',
      }),
    )

    // AC-5, first half — the SAME key, name and URL, as one item.
    //
    // THE VERSION IS THE CATALOG'S CURRENT ONE AND NOT LITERALLY 6.
    // `upgradeInstance` carries a stored instance all the way to the contract in
    // force, so this number moves with every later bump — [[REQ-243]] is the
    // first, and what AC-5 is about is the SHAPE below, which each step is
    // required to leave intact.
    expect(instance.version).toBe(latestModuleVersion('contact-form'))
    expect(instance.config.assets).toEqual([
      { key: 'whitepapers', name: 'both whitepapers', url: 'https://example.test/papers' },
    ])
    // THE KEY IS THE POINT. It is what the at-most-once ledger remembers a
    // delivery by, so a step that renamed or dropped it would re-mail everybody
    // who has already had the artifact.
    expect((instance.config.assets as Array<{ key: string }>)[0].key).toBe('whitepapers')

    // The old triple is gone, and it went through the reporting path rather than
    // being deleted silently by the migration itself.
    expect(instance.config.asset).toBeUndefined()
    expect(instance.config.assetName).toBeUndefined()
    expect(instance.config.assetUrl).toBeUndefined()
    expect(droppedConfigKeys).toEqual(['asset', 'assetName', 'assetUrl'])

    // And the result is valid against the CURRENT contract — which
    // `upgradeInstance` already refuses to return otherwise, asserted here so
    // the claim is visible.
    expect(validateBehaviorConfig(getModuleMeta('contact-form', 7), instance.config)).toEqual([])
  })

  it('test_UAT_FC_REQ-241_a_stored_instance_promising_nothing_upgrades_to_an_empty_list', () => {
    const { instance } = upgradeInstance(storedV5({}))

    // AC-5, second half. An EMPTY list rather than an absent key: "this form
    // gates nothing" said, rather than left to be inferred from silence. Both
    // readings exist in the stores — every `contact-form` in the repo's own
    // fixtures is this one — so both are exercised rather than assumed.
    expect(instance.version).toBe(latestModuleVersion('contact-form'))
    expect(instance.config.assets).toEqual([])
    expect(validateBehaviorConfig(getModuleMeta('contact-form', 7), instance.config)).toEqual([])
  })

  it('test_UAT_FC_REQ-241_a_half_declared_triple_is_carried_rather_than_discarded', () => {
    // A key with no URL was read as no asset under v5 and is read as no asset
    // under v6 — the rule moved from the form to the item and did not change —
    // so the migration carries the author's half-finished intent where they left
    // it. Discarding it here would be this step deciding something the contract
    // already decides, silently.
    const { instance } = upgradeInstance(storedV5({ asset: 'orphan', assetName: 'a paper' }))
    expect(instance.config.assets).toEqual([{ key: 'orphan', name: 'a paper' }])
    expect(validateBehaviorConfig(getModuleMeta('contact-form', 7), instance.config)).toEqual([])
  })

  it('test_UAT_FC_REQ-241_the_module_id_is_unchanged_and_the_bump_ships_its_step', () => {
    // AC-6, first half. `upgradeInstance` carries `type` through unchanged — the
    // migration machinery moves versions WITHIN a module id and has no
    // expression for renaming one — and `site_revisions` rows are immutable, so
    // a rename would break every historical revision naming `contact-form`.
    // The generalization this ticket is about is capability, not spelling.
    expect(CATALOG.some((meta) => meta.id === 'contact-form')).toBe(true)
    expect(latestModuleVersion('contact-form')).toBe(7)
    expect(upgradeInstance(storedV5({})).instance.type).toBe('contact-form')
    // And the bump did not arrive without the step that reaches it.
    expect(missingMigrations()).toEqual([])
  })
})
