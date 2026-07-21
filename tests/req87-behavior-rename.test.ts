import { describe, it, expect } from 'vitest'
import {
  registry,
  getModule,
  validateBehaviorConfig,
  validateBehaviorSlots,
  validateBehaviorInstance,
  type BehaviorMeta,
} from '../packages/framework/src/index'
import { l1SlotSchema } from '../packages/site-schema/src/l1/schema'

/**
 * UATs for REQ-87 — the mechanical rename of the runtime module-type from
 * `Capability*`/`kind: 'capability'` to `Behavior*`/`kind: 'behavior'`,
 * disambiguating it from the XGD capability matrix. No functional change: the
 * REQ-85 behaviour-module contract must survive under the new names, and the
 * renamed discriminant must flow atomically through the framework registry and
 * the site-schema L1 slot seam with no `'capability'` residue.
 */

describe('REQ-87 — behavior-module rename preserves the REQ-85 contract', () => {
  it('test_UAT_FC_REQ-87_behavior_meta_rename_validators_drive_the_contract', () => {
    // The renamed contract compiles and is exported: BehaviorMeta + the three
    // validateBehavior* validators. Exercising them proves config drives
    // behaviour and slots mount L1 exactly as REQ-85 required.
    const meta: BehaviorMeta = getModule('carousel', 2).meta

    // A well-formed instance: behavioural config within bounds + one L1 subtree
    // per repeated slide slot.
    const validSlide = { kind: 'text', text: 'Chef Sarah transformed our weekly meals.' }
    expect(
      validateBehaviorInstance(meta, {
        config: { view: 'peek', controls: 'dots', autoplay: true, loop: false },
        slots: { slide: [validSlide] },
      }),
    ).toEqual([])

    // Config out of contract → a config violation (behaviour is contract-driven).
    const badConfig = validateBehaviorConfig(meta, { view: 'not-a-view' })
    expect(badConfig.length).toBeGreaterThan(0)
    expect(badConfig[0].field).toBe('config.view')

    // A required repeated slot missing / carrying non-L1 content → a slot
    // violation (slots mount validated L1, the security line).
    expect(validateBehaviorSlots(meta, {}).some((e) => e.field === 'slots.slide')).toBe(true)
    expect(
      validateBehaviorSlots(meta, { slide: [{ kind: 'not-a-real-l1-node' }] }).length,
    ).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-87_discriminant_atomic_kind_is_behavior', () => {
    // Every registered module carries the renamed discriminant — the rename
    // flowed through the framework registry, not just the core file.
    expect(registry.size).toBeGreaterThan(0)
    for (const { meta } of registry.values()) {
      expect(meta.kind).toBe('behavior')
    }
    // Both real behavior modules specifically.
    expect(getModule('carousel', 2).meta.kind).toBe('behavior')
    expect(getModule('contact-form', 3).meta.kind).toBe('behavior')
  })

  it('test_UAT_FC_REQ-87_discriminant_atomic_l1_slot_seam_renamed_in_site_schema', () => {
    // The L1 slot seam (site-schema) records its target behavior-module id under
    // the renamed `behavior` field; the strict schema accepts it.
    const parsed = l1SlotSchema.safeParse({ kind: 'slot', name: 'body', behavior: 'carousel' })
    expect(parsed.success).toBe(true)

    // No `'capability'` residue: the old field name is now an unknown key and the
    // strict L1 slot schema rejects it — proving the discriminant/field rename is
    // atomic through site-schema, not a lingering alias.
    const legacy = l1SlotSchema.safeParse({ kind: 'slot', name: 'body', capability: 'carousel' })
    expect(legacy.success).toBe(false)
  })
})
