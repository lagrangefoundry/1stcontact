import type { L1Node } from '@1stcontact/site-schema'
import type { BehaviorSlotValue } from '../modules/behavior'
import { contactFormPreset, type ContactFormPresetField } from './contact-form'

/**
 * The L2 index (REQ-130): behavior id → a vetted default presentation for its
 * slots, derived from that instance's own `config`.
 *
 * `contact-form.ts` already holds the design; what was missing was a way to ASK
 * for it by behavior id. A caller creating an instance — the reproduction
 * importer, the assistant's `add_module` — knows the type and the config and has
 * no business knowing which module happens to have a preset and what its
 * builder is called. Without this every such caller grows the same `if
 * (type === 'contact-form')`, which is the literalism the project forbids: the
 * preset library is the general thing, and one entry in it is not.
 *
 * A behavior with no entry returns null, which is a legitimate answer and not a
 * failure: it means the caller must author the slots, and the caller is the
 * place to say so.
 */
export type SlotPresetBuilder = (config: Record<string, unknown>) => Record<string, BehaviorSlotValue>

const PRESETS: Record<string, SlotPresetBuilder> = {
  'contact-form': (config) => ({
    form: contactFormPreset(
      (Array.isArray(config.fields) ? config.fields : []) as ContactFormPresetField[],
    ) as L1Node,
  }),
}

/** Which behaviors can be instantiated without the caller authoring any L1. */
export function hasSlotPreset(behaviorId: string): boolean {
  return behaviorId in PRESETS
}

/** A vetted default for every slot of `behaviorId`, or null when it has none. */
export function presetSlots(
  behaviorId: string,
  config: Record<string, unknown>,
): Record<string, BehaviorSlotValue> | null {
  const build = PRESETS[behaviorId]
  return build ? build(config) : null
}
