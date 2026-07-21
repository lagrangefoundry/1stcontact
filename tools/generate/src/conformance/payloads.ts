/**
 * REQ-40 (reframed REQ-85) — generic content-injection payload derivation
 * ([[DOC-20]] AC-M2) for **capability modules**.
 *
 * The security dimension treats every capability as the sanitization boundary for
 * untrusted input, so its payloads are derived **from the capability's own
 * contract** — its behavioural `config` fields and its named L1 `slots` — not
 * hand-listed per module. Two postures share the derivation: an **injection**
 * fixture fills every URL/string config field and every slot's L1 subtree with
 * hostile values (an unsafe URL scheme, inline-handler HTML), and a **benign**
 * twin fills the same shape with safe values — the must-pass baseline proving the
 * checks don't false-positive. Both satisfy the capability contract (required
 * config, required/bounded slots) so the one-module page still validates and
 * renders. Slot content re-enters the L1 envelope, so the injection fixture also
 * proves the L1 renderer neutralises hostile subtrees.
 */
import type { CapabilityMeta, CapabilityConfigSpec, CapabilitySlotValue } from '@1stcontact/framework'
import { XSS_SENTINEL } from './checks'
import type { ConformanceFixture } from './types'

/** A `javascript:` URL whose payload sets the execution sentinel if it ever runs. */
const JS_URL = `javascript:window.${XSS_SENTINEL}=true`
/** Inline-handler HTML — inert when escaped, live when it reaches a sink. */
const HANDLER_HTML = `<img src=x onerror="window.${XSS_SENTINEL}=true">`

/** One config field's value for the chosen posture (hostile vs benign). */
function configValue(spec: CapabilityConfigSpec, hostile: boolean): unknown {
  switch (spec.type) {
    case 'url':
      return hostile ? JS_URL : 'https://example.com/safe'
    case 'string':
      return hostile ? HANDLER_HTML : 'Safe text'
    case 'boolean':
      return spec.default ?? false
    case 'integer':
      return spec.min ?? 1
    case 'enum':
      return spec.values?.[0] ?? ''
    case 'list': {
      const n = spec.minItems ?? 1
      return Array.from({ length: n }, () =>
        spec.itemSchema ? buildConfig(spec.itemSchema, hostile) : 'x',
      )
    }
  }
}

/** A field is worth filling if it is required or can carry a URL/injection vector. */
function shouldFill(spec: CapabilityConfigSpec): boolean {
  return spec.required || spec.type === 'url' || spec.type === 'string' || spec.type === 'list'
}

/** Fill a whole config schema for the chosen posture. */
function buildConfig(
  schema: Record<string, CapabilityConfigSpec>,
  hostile: boolean,
): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  for (const [field, spec] of Object.entries(schema)) {
    if (shouldFill(spec)) config[field] = configValue(spec, hostile)
  }
  return config
}

/**
 * One L1 slot subtree carrying the posture's vectors: a text node (HTML-escape
 * sink) + an image node (URL-scheme sink). The L1 renderer escapes the text and
 * allowlists the src, so a hostile subtree renders inert.
 */
function slotSubtree(hostile: boolean) {
  return {
    kind: 'box' as const,
    children: [
      { kind: 'text' as const, text: hostile ? HANDLER_HTML : 'Safe slide text' },
      { kind: 'image' as const, src: hostile ? JS_URL : '/assets/safe.png', alt: 'slide' },
    ],
  }
}

/** Fill every named slot for the chosen posture (repeated slots get `minItems`). */
function buildSlots(meta: CapabilityMeta, hostile: boolean): Record<string, CapabilitySlotValue> {
  const slots: Record<string, CapabilitySlotValue> = {}
  for (const [name, spec] of Object.entries(meta.slots)) {
    slots[name] = spec.repeated
      ? Array.from({ length: spec.minItems ?? 1 }, () => slotSubtree(hostile))
      : slotSubtree(hostile)
  }
  return slots
}

/** Hostile `{ config, slots }` for `meta` — every fillable field carries a payload. */
export function buildInjectionContent(meta: CapabilityMeta): {
  config: Record<string, unknown>
  slots: Record<string, CapabilitySlotValue>
} {
  return { config: buildConfig(meta.config, true), slots: buildSlots(meta, true) }
}

/** Safe `{ config, slots }` for `meta` — the must-pass baseline (no false positives). */
export function buildBenignContent(meta: CapabilityMeta): {
  config: Record<string, unknown>
  slots: Record<string, CapabilitySlotValue>
} {
  return { config: buildConfig(meta.config, false), slots: buildSlots(meta, false) }
}

/**
 * A pair of fixtures for a capability: the contract-derived injection fixture and
 * its benign twin, each carrying `config` + L1 `slots` props.
 */
export function buildSecurityFixtures(meta: CapabilityMeta): {
  injection: ConformanceFixture
  benign: ConformanceFixture
} {
  return {
    injection: { label: `${meta.id}:injection`, props: buildInjectionContent(meta) },
    benign: { label: `${meta.id}:benign`, props: buildBenignContent(meta) },
  }
}
