import {
  l1ControlNames,
  l1NodeSchema,
  type L1Node,
  type ResolvedLocale,
} from '@1stcontact/site-schema'
import type { L1ControlTag } from '../l1/render'

/**
 * The **behavior-module contract** (REQ-85). Since the framework pivot
 * (REQ-79/REQ-84) layout is owned by the L1 substrate, so a module is no longer
 * a bundle of aesthetic dials — it is a **behavior**: a vetted behavioural core
 * (framework code the AI never writes) exposing
 *
 *  - `config` — typed **behavioural / integration** parameters (how many slides
 *    show, whether a form autosubmits, an endpoint URL); never aesthetics.
 *  - `slots` — named **L1 presentation slots**. The instance supplies an L1
 *    subtree per slot (a `repeated` slot takes an array — one subtree per item);
 *    the core mounts each into its behavioural chrome. Presentation is 100% L1,
 *    inside the validated L1 security envelope — the module owns zero raw markup.
 *  - `conformance` — the universal ACs (DOC-20) the behavior must satisfy,
 *    plus **isolation**: a misbehaving behavior must degrade inertly, never
 *    breaking page-level robustness.
 *
 * This deliberately replaces the pre-pivot `ModuleMeta` (variants + aesthetic
 * dials + styled `contentSchema`): those axes moved to L1.
 */

/** The kind of a behavioural config field (never an aesthetic axis). */
export type BehaviorConfigType =
  | 'boolean'
  | 'integer'
  | 'enum'
  | 'string'
  | 'url'
  | 'list'

/** One config field's contract. */
export interface BehaviorConfigSpec {
  type: BehaviorConfigType
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
  itemSchema?: Record<string, BehaviorConfigSpec>
  /** Value applied when the field is omitted (documents the core's fallback). */
  default?: boolean | number | string
}

/** A named L1 presentation slot the behavior mounts into its chrome. */
export interface BehaviorSlotSpec {
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

/**
 * REQ-96 — one **module-declared leaf element** in the contract: the second
 * composition direction, where L1 wraps the module.
 *
 * A `slot` is the module wrapping L1 and works only for containers. A control is
 * the inverse, and is the only shape available for a leaf: `<input>` is void and
 * `<textarea>`'s content is its value, so no L1 subtree can go *inside* one. The
 * module declares that the element must exist and what its behavioural
 * attributes are; an L1 `control` node names it and supplies every paint axis.
 *
 * Declaring controls is what makes "the module ships no CSS" *enforceable*: an
 * element on this list is one the module may not paint.
 */
export interface BehaviorControlSpec {
  /** The tag the module emits for this element. */
  element: L1ControlTag
  /** Whether an instance must bind an L1 `control` node to it. */
  required: boolean
  /**
   * When set, this is not one element but **one per item** of the named `list`
   * config field, and the instance names each control by that item's `name`
   * (`contact-form`'s fields). The declaration is the rule; the roster is
   * resolved per instance.
   */
  perItemOf?: string
  /**
   * When set, this is one element **per subtree** of the named repeated slot,
   * named `<key>-<index>` (a carousel's pagination dots — one per slide).
   */
  perSubtreeOf?: string
  /**
   * REQ-96 §10.3 — presentation fixed by an **obligation**, not by taste: the
   * honeypot must stay invisible, the Turnstile mount must sit where the widget
   * expects it, a visually-hidden label must stay out of flow. An invariant
   * element is the module's to paint and is never bound to an L1 control node;
   * it is also excluded from the reproduction value gate, since it exists only
   * on our side and would otherwise slide the control pairing.
   */
  invariant?: boolean
}

/** A universal-AC obligation (DOC-20) plus behavior `isolation`. */
export type ConformanceObligation =
  | 'safety'
  | 'security'
  | 'x-browser'
  | 'responsive'
  | 'isolation'

export interface BehaviorConformance {
  /** The ACs this behavior is obliged to satisfy. */
  obligations: readonly ConformanceObligation[]
  /** AC ids legitimately opted out of, each with a declared reason. */
  except?: Record<string, string>
}

/** The full behavior contract, exported as `behaviorMeta` from each module. */
export interface BehaviorMeta {
  /** Stable identifier, never renamed. */
  id: string
  /** Monotonically incremented on a breaking contract change. */
  version: number
  /** Discriminant — a behavior module, not a pre-pivot layout module. */
  kind: 'behavior'
  /** Per-field behavioural config contract. */
  config: Record<string, BehaviorConfigSpec>
  /** Per-slot named-L1-presentation contract. */
  slots: Record<string, BehaviorSlotSpec>
  /**
   * REQ-96 — the leaf elements the module declares, which L1 paints. A behavior
   * with no leaf controls (every element it owns is a container) declares none.
   */
  controls?: Record<string, BehaviorControlSpec>
  /** Conformance obligations + isolation. */
  conformance: BehaviorConformance
}

/** A behavior instance's presentation: an L1 subtree, or an array for a repeated slot. */
export type BehaviorSlotValue = L1Node | L1Node[]

/** A behavior instance's runtime fields (minus `id`/`type`/`version`). */
export interface BehaviorInstance {
  config: Record<string, unknown>
  slots: Record<string, BehaviorSlotValue>
}

/**
 * What the renderer hands a behavior's core for one instance.
 *
 * `slots` is the raw instance value — a single L1 subtree, or an array for a
 * `repeated` slot — exactly as the page schema validated it. Each behavior
 * narrows the slots it cares about itself, and isolation (REQ-85) requires it to
 * drop a shape it cannot use rather than throw.
 */
export interface BehaviorProps {
  /** Behavioural, data-only config (never aesthetics — DOC-25 §2). */
  config?: Record<string, unknown>
  /** Named L1 presentation slots, keyed as declared in {@link BehaviorMeta.slots}. */
  slots?: Record<string, BehaviorSlotValue | undefined>
  /** Namespaces this instance's slot classes so two on a page never collide. */
  instanceId?: string
  /** REQ-116 — render the edit channel: the module's own behaviour switched off. */
  edit?: boolean
  /**
   * REQ-151 — the site's settled locale identity (country, locale, currency,
   * timezone, direction), handed down by the renderer.
   *
   * Optional so a module that never formats anything can ignore it and a test
   * can omit it. A module that DOES format money or a date must read it rather
   * than assume: `Intl.NumberFormat('en-IE', …EUR)` gives `€49.99` where
   * `('de-DE', …EUR)` gives `49,99 €`, and a module guessing its own answer is
   * how two modules on one page come to disagree about the same business.
   */
  locale?: ResolvedLocale
}

/**
 * A behavior's renderable core: props in, HTML out (REQ-148).
 *
 * PLAIN TYPESCRIPT, DELIBERATELY. These were Astro components, which put Astro's
 * transform on the render path and so confined the render to Node — a Worker has
 * no way to compile `.astro`. Neither component used an Astro feature, so the
 * file extension was buying nothing and costing the whole of workerd. As plain
 * functions both hosts run the *same* code, which is why node/worker parity is
 * structural rather than something to compare bytes for.
 */
export type BehaviorComponent = (props: BehaviorProps) => string

/** A registry entry: a behavior's contract paired with its renderable component. */
export interface BehaviorDefinition {
  meta: BehaviorMeta
  Component: BehaviorComponent
}

/** Compile-time assertion: a module's `meta` must satisfy {@link BehaviorMeta}. */
export type AssertBehaviorMeta<T extends BehaviorMeta> = T

/** A single behavior-contract violation (mirrors the content-validator shape). */
export interface BehaviorValidationError {
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
  spec: BehaviorConfigSpec,
  value: unknown,
  errors: BehaviorValidationError[],
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

/** Validate a behavior instance's `config` against `meta.config`. */
export function validateBehaviorConfig(
  meta: BehaviorMeta,
  config: Record<string, unknown> | undefined,
): BehaviorValidationError[] {
  const errors: BehaviorValidationError[] = []
  const c = config ?? {}
  for (const [name, spec] of Object.entries(meta.config)) {
    validateConfigField(`config.${name}`, spec, c[name], errors)
  }
  return errors
}

/** Every subtree of a slot value, whether single or repeated. */
function slotSubtrees(value: BehaviorSlotValue | undefined): L1Node[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Validate a behavior instance's `slots` against `meta.slots`: every required
 * slot is present, a repeated slot's item count is within bounds, and — the
 * security line — every supplied subtree parses as a valid L1 node, so slot
 * content can never smuggle raw markup past the L1 envelope.
 */
export function validateBehaviorSlots(
  meta: BehaviorMeta,
  slots: Record<string, BehaviorSlotValue> | undefined,
): BehaviorValidationError[] {
  const errors: BehaviorValidationError[] = []
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

/**
 * REQ-96 — the control names an instance may bind, resolved from the declaration
 * against this instance's config and slots. Keyed by name → the declaration it
 * came from, so a caller can tell a field control from the submit button.
 *
 * `invariant` controls are deliberately absent: their presentation is fixed by an
 * obligation, so there is nothing for an L1 node to paint.
 */
export function resolveControlNames(
  meta: BehaviorMeta,
  instance: Partial<BehaviorInstance>,
): Map<string, { key: string; spec: BehaviorControlSpec }> {
  const out = new Map<string, { key: string; spec: BehaviorControlSpec }>()
  for (const [key, spec] of Object.entries(meta.controls ?? {})) {
    if (spec.invariant) continue
    if (spec.perItemOf) {
      const items = instance.config?.[spec.perItemOf]
      if (!Array.isArray(items)) continue
      for (const item of items) {
        const name = (item as Record<string, unknown> | null)?.name
        if (typeof name === 'string' && name) out.set(name, { key, spec })
      }
      continue
    }
    if (spec.perSubtreeOf) {
      const subtrees = instance.slots?.[spec.perSubtreeOf]
      const count = Array.isArray(subtrees) ? subtrees.length : subtrees ? 1 : 0
      for (let i = 0; i < count; i++) out.set(`${key}-${i}`, { key, spec })
      continue
    }
    out.set(key, { key, spec })
  }
  return out
}

/**
 * REQ-96 — validate the control bindings: every `control` node inside the
 * instance's slot subtrees names an element this behavior declares, and every
 * required declared element is bound by at least one node.
 *
 * This is the check the pre-REQ-96 contract could not express. A control node
 * naming an element no module declares would render nothing (the emitter's inert
 * degradation) — silently dropping a field the author believed they had placed.
 */
export function validateBehaviorControls(
  meta: BehaviorMeta,
  instance: Partial<BehaviorInstance>,
): BehaviorValidationError[] {
  const errors: BehaviorValidationError[] = []
  const declared = resolveControlNames(meta, instance)
  const bound = new Set<string>()
  for (const [slotName, value] of Object.entries(instance.slots ?? {})) {
    slotSubtrees(value).forEach((node, i) => {
      // A subtree that does not parse is already reported by the slot validator.
      if (!l1NodeSchema.safeParse(node).success) return
      const suffix = Array.isArray(value) ? `[${i}]` : ''
      for (const name of l1ControlNames(node)) {
        bound.add(name)
        if (!declared.has(name)) {
          errors.push({
            field: `slots.${slotName}${suffix}`,
            message:
              `control '${name}' is not declared by behavior '${meta.id}' ` +
              `(declared: ${[...declared.keys()].join(', ') || 'none'})`,
          })
        }
      }
    })
  }
  for (const [name, { key, spec }] of declared) {
    if (spec.required && !bound.has(name)) {
      errors.push({
        field: `controls.${key}`,
        message: `required control '${name}' has no L1 control node bound to it`,
      })
    }
  }
  return errors
}

/** Validate a whole behavior instance (`config` + `slots`) against its contract. */
export function validateBehaviorInstance(
  meta: BehaviorMeta,
  instance: Partial<BehaviorInstance>,
): BehaviorValidationError[] {
  return [
    ...validateBehaviorConfig(meta, instance.config),
    ...validateBehaviorSlots(meta, instance.slots),
    ...validateBehaviorControls(meta, instance),
  ]
}
