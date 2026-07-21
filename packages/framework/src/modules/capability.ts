import type { AstroComponentFactory } from 'astro/runtime/server/index.js'
import { l1NodeSchema, type L1Node } from '@1stcontact/site-schema'

/**
 * The **capability-module contract** (REQ-85). Since the framework pivot
 * (REQ-79/REQ-84) layout is owned by the L1 substrate, so a module is no longer
 * a bundle of aesthetic dials — it is a **capability**: a vetted behavioural core
 * (framework code the AI never writes) exposing
 *
 *  - `config` — typed **behavioural / integration** parameters (how many slides
 *    show, whether a form autosubmits, an endpoint URL); never aesthetics.
 *  - `slots` — named **L1 presentation slots**. The instance supplies an L1
 *    subtree per slot (a `repeated` slot takes an array — one subtree per item);
 *    the core mounts each into its behavioural chrome. Presentation is 100% L1,
 *    inside the validated L1 security envelope — the module owns zero raw markup.
 *  - `conformance` — the universal ACs (DOC-20) the capability must satisfy,
 *    plus **isolation**: a misbehaving capability must degrade inertly, never
 *    breaking page-level robustness.
 *
 * This deliberately replaces the pre-pivot `ModuleMeta` (variants + aesthetic
 * dials + styled `contentSchema`): those axes moved to L1.
 */

/** The kind of a behavioural config field (never an aesthetic axis). */
export type CapabilityConfigType =
  | 'boolean'
  | 'integer'
  | 'enum'
  | 'string'
  | 'url'
  | 'list'

/** One config field's contract. */
export interface CapabilityConfigSpec {
  type: CapabilityConfigType
  required: boolean
  /** Closed value set for an `enum` field (a value outside it is a violation). */
  values?: readonly string[]
  /** Inclusive bounds for an `integer` field. */
  min?: number
  max?: number
  /** Inclusive item-count bounds for a `list` field. */
  minItems?: number
  maxItems?: number
  /** Per-item field contract for a `list` of objects (recursed to any depth). */
  itemSchema?: Record<string, CapabilityConfigSpec>
  /** Value applied when the field is omitted (documents the core's fallback). */
  default?: boolean | number | string
}

/** A named L1 presentation slot the capability mounts into its chrome. */
export interface CapabilitySlotSpec {
  /**
   * A `repeated` slot takes an **array** of L1 subtrees (one per item — carousel
   * slides, form fields); a non-repeated slot takes a single subtree (a heading,
   * a submit button).
   */
  repeated?: boolean
  required: boolean
  /** Inclusive bounds on the number of subtrees of a `repeated` slot. */
  minItems?: number
  maxItems?: number
}

/** A universal-AC obligation (DOC-20) plus capability `isolation`. */
export type ConformanceObligation =
  | 'safety'
  | 'security'
  | 'x-browser'
  | 'responsive'
  | 'isolation'

export interface CapabilityConformance {
  /** The ACs this capability is obliged to satisfy. */
  obligations: readonly ConformanceObligation[]
  /** AC ids legitimately opted out of, each with a declared reason. */
  except?: Record<string, string>
}

/** The full capability contract, exported as `capabilityMeta` from each module. */
export interface CapabilityMeta {
  /** Stable identifier, never renamed. */
  id: string
  /** Monotonically incremented on a breaking contract change. */
  version: number
  /** Discriminant — a capability module, not a pre-pivot layout module. */
  kind: 'capability'
  /** Per-field behavioural config contract. */
  config: Record<string, CapabilityConfigSpec>
  /** Per-slot named-L1-presentation contract. */
  slots: Record<string, CapabilitySlotSpec>
  /** Conformance obligations + isolation. */
  conformance: CapabilityConformance
}

/** A capability instance's presentation: an L1 subtree, or an array for a repeated slot. */
export type CapabilitySlotValue = L1Node | L1Node[]

/** A capability instance's runtime fields (minus `id`/`type`/`version`). */
export interface CapabilityInstance {
  config: Record<string, unknown>
  slots: Record<string, CapabilitySlotValue>
}

/** A registry entry: a capability's contract paired with its renderable component. */
export interface CapabilityDefinition {
  meta: CapabilityMeta
  Component: AstroComponentFactory
}

/** Compile-time assertion: a module's `meta` must satisfy {@link CapabilityMeta}. */
export type AssertCapabilityMeta<T extends CapabilityMeta> = T

/** A single capability-contract violation (mirrors the content-validator shape). */
export interface CapabilityValidationError {
  /** The offending config field or slot name (`config.<name>` / `slots.<name>`). */
  field: string
  /** Human-readable explanation. */
  message: string
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

/** Validate one config value against its field spec, appending any violations. */
function validateConfigField(
  path: string,
  spec: CapabilityConfigSpec,
  value: unknown,
  errors: CapabilityValidationError[],
): void {
  if (isMissing(value)) {
    if (spec.required) errors.push({ field: path, message: `required config '${path}' is missing` })
    return
  }
  switch (spec.type) {
    case 'boolean':
      if (typeof value !== 'boolean')
        errors.push({ field: path, message: `config '${path}' must be a boolean` })
      break
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        errors.push({ field: path, message: `config '${path}' must be an integer` })
      } else {
        if (spec.min !== undefined && value < spec.min)
          errors.push({ field: path, message: `config '${path}' must be ≥ ${spec.min}` })
        if (spec.max !== undefined && value > spec.max)
          errors.push({ field: path, message: `config '${path}' must be ≤ ${spec.max}` })
      }
      break
    case 'enum':
      if (typeof value !== 'string' || !(spec.values ?? []).includes(value))
        errors.push({
          field: path,
          message: `config '${path}' must be one of: ${(spec.values ?? []).join(', ')}`,
        })
      break
    case 'string':
    case 'url':
      if (typeof value !== 'string')
        errors.push({ field: path, message: `config '${path}' must be a string` })
      break
    case 'list':
      if (!Array.isArray(value)) {
        errors.push({ field: path, message: `config '${path}' must be a list` })
        break
      }
      if (spec.minItems !== undefined && value.length < spec.minItems)
        errors.push({ field: path, message: `config '${path}' needs at least ${spec.minItems} item(s)` })
      if (spec.maxItems !== undefined && value.length > spec.maxItems)
        errors.push({ field: path, message: `config '${path}' allows at most ${spec.maxItems} item(s)` })
      if (spec.itemSchema) {
        value.forEach((item, i) => {
          for (const [name, sub] of Object.entries(spec.itemSchema!)) {
            validateConfigField(
              `${path}[${i}].${name}`,
              sub,
              (item as Record<string, unknown> | null)?.[name],
              errors,
            )
          }
        })
      }
      break
  }
}

/** Validate a capability instance's `config` against `meta.config`. */
export function validateCapabilityConfig(
  meta: CapabilityMeta,
  config: Record<string, unknown> | undefined,
): CapabilityValidationError[] {
  const errors: CapabilityValidationError[] = []
  const c = config ?? {}
  for (const [name, spec] of Object.entries(meta.config)) {
    validateConfigField(`config.${name}`, spec, c[name], errors)
  }
  return errors
}

/** Every subtree of a slot value, whether single or repeated. */
function slotSubtrees(value: CapabilitySlotValue | undefined): L1Node[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Validate a capability instance's `slots` against `meta.slots`: every required
 * slot is present, a repeated slot's item count is within bounds, and — the
 * security line — every supplied subtree parses as a valid L1 node, so slot
 * content can never smuggle raw markup past the L1 envelope.
 */
export function validateCapabilitySlots(
  meta: CapabilityMeta,
  slots: Record<string, CapabilitySlotValue> | undefined,
): CapabilityValidationError[] {
  const errors: CapabilityValidationError[] = []
  const s = slots ?? {}
  for (const [name, spec] of Object.entries(meta.slots)) {
    const path = `slots.${name}`
    const raw = s[name]
    if (raw === undefined) {
      if (spec.required) errors.push({ field: path, message: `required slot '${name}' is missing` })
      continue
    }
    if (spec.repeated) {
      if (!Array.isArray(raw)) {
        errors.push({ field: path, message: `repeated slot '${name}' must be a list of L1 subtrees` })
        continue
      }
      if (spec.minItems !== undefined && raw.length < spec.minItems)
        errors.push({ field: path, message: `slot '${name}' needs at least ${spec.minItems} subtree(s)` })
      if (spec.maxItems !== undefined && raw.length > spec.maxItems)
        errors.push({ field: path, message: `slot '${name}' allows at most ${spec.maxItems} subtree(s)` })
    } else if (Array.isArray(raw)) {
      errors.push({ field: path, message: `slot '${name}' takes a single L1 subtree, not a list` })
      continue
    }
    slotSubtrees(raw).forEach((node, i) => {
      const parsed = l1NodeSchema.safeParse(node)
      if (!parsed.success) {
        const suffix = spec.repeated ? `[${i}]` : ''
        errors.push({ field: `${path}${suffix}`, message: `slot content is not a valid L1 subtree` })
      }
    })
  }
  return errors
}

/** Validate a whole capability instance (`config` + `slots`) against its contract. */
export function validateCapabilityInstance(
  meta: CapabilityMeta,
  instance: Partial<CapabilityInstance>,
): CapabilityValidationError[] {
  return [
    ...validateCapabilityConfig(meta, instance.config),
    ...validateCapabilitySlots(meta, instance.slots),
  ]
}
