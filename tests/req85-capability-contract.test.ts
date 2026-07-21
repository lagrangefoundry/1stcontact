import { describe, expect, it } from 'vitest'
import {
  validateBehaviorConfig,
  validateBehaviorSlots,
  validateBehaviorInstance,
  type BehaviorMeta,
  type AssertBehaviorMeta,
} from '../packages/framework/src/modules/behavior'

/**
 * UATs for REQ-85 — the **capability-module contract**. A capability = vetted
 * core + typed behavioural `config` + named L1 presentation `slots` +
 * conformance obligations. These prove the contract's validator discriminates a
 * conforming instance from a malformed one: behavioural config is typed/bounded,
 * every required slot is present, a repeated slot's item count is bounded, and —
 * the security line — slot content that is not a valid L1 subtree is rejected so
 * presentation can never smuggle raw markup past the L1 envelope.
 */

// A representative capability: two config kinds + a repeated slot + a single slot.
const meta = {
  id: 'demo',
  version: 1,
  kind: 'behavior',
  config: {
    view: { type: 'enum', required: false, values: ['single', 'multi'], default: 'single' },
    slidesToShow: { type: 'integer', required: false, min: 1, max: 6 },
    autoplay: { type: 'boolean', required: false, default: false },
    endpoint: { type: 'url', required: true },
  },
  slots: {
    slide: { repeated: true, required: true, minItems: 1, maxItems: 3 },
    heading: { required: false },
  },
  conformance: { obligations: ['safety', 'security', 'x-browser', 'responsive', 'isolation'] },
} as const satisfies BehaviorMeta

// Compile-time: the literal satisfies the contract shape.
type _Assert = AssertBehaviorMeta<typeof meta>

/** A minimal valid L1 subtree (a single text node). */
const textNode = { kind: 'text', text: 'Hi' }

describe('REQ-85 — capability-module contract', () => {
  it('test_UAT_FC_REQ-85_config_accepts_a_conforming_instance', () => {
    const errors = validateBehaviorConfig(meta, {
      view: 'multi',
      slidesToShow: 3,
      autoplay: true,
      endpoint: 'https://example.com/lead',
    })
    expect(errors).toEqual([])
  })

  it('test_UAT_FC_REQ-85_config_flags_type_enum_and_bound_violations', () => {
    const errors = validateBehaviorConfig(meta, {
      view: 'carousel', // not in the enum
      slidesToShow: 99, // over max
      autoplay: 'yes', // not a boolean
      // endpoint missing → required
    })
    const fields = errors.map((e) => e.field).sort()
    expect(fields).toEqual(['config.autoplay', 'config.endpoint', 'config.slidesToShow', 'config.view'])
  })

  it('test_UAT_FC_REQ-85_slots_require_present_and_bound_repeated', () => {
    // Missing the required repeated `slide` slot entirely.
    expect(validateBehaviorSlots(meta, { heading: textNode })).toEqual([
      { field: 'slots.slide', message: expect.stringContaining('required slot') },
    ])
    // Too many subtrees for the repeated slot.
    const tooMany = validateBehaviorSlots(meta, { slide: [textNode, textNode, textNode, textNode] })
    expect(tooMany.some((e) => e.field === 'slots.slide' && /at most 3/.test(e.message))).toBe(true)
    // A single slot given a list is rejected.
    const wrongShape = validateBehaviorSlots(meta, { slide: [textNode], heading: [textNode] })
    expect(wrongShape.some((e) => e.field === 'slots.heading' && /single L1 subtree/.test(e.message))).toBe(true)
  })

  it('test_UAT_FC_REQ-85_slots_reject_non_L1_content', () => {
    // Slot content that is not a valid L1 subtree cannot pass the envelope.
    const errors = validateBehaviorSlots(meta, {
      slide: [{ kind: 'text', text: 'ok' }, { kind: 'evil', html: '<script>x</script>' } as never],
    })
    expect(errors.some((e) => e.field === 'slots.slide[1]' && /not a valid L1 subtree/.test(e.message))).toBe(true)
  })

  it('test_UAT_FC_REQ-85_instance_validates_config_and_slots_together', () => {
    const clean = validateBehaviorInstance(meta, {
      config: { endpoint: 'https://example.com/lead' },
      slots: { slide: [textNode] },
    })
    expect(clean).toEqual([])

    const dirty = validateBehaviorInstance(meta, { config: {}, slots: {} })
    // Both the required config (endpoint) and the required slot (slide) are flagged.
    expect(dirty.some((e) => e.field === 'config.endpoint')).toBe(true)
    expect(dirty.some((e) => e.field === 'slots.slide')).toBe(true)
  })
})
