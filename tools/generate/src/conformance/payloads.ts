/**
 * REQ-40 — generic content-injection payload derivation ([[DOC-20]] AC-M2).
 *
 * The security dimension treats every module as the sanitization boundary for
 * untrusted content, so its payloads must be derived **from the module's own
 * content schema**, not hand-listed per module: whatever fields a module exposes,
 * the harness fills them with hostile values of the matching type and asserts the
 * render is inert. This keeps the check honest as the catalog grows — a new
 * content field is fuzzed the moment it is declared.
 *
 * Two builders share one recursion: {@link buildInjectionContent} fills fields
 * with hostile values (unsafe URL schemes, inline-handler HTML, a markdown
 * `javascript:` link), and {@link buildBenignContent} fills the same shape with
 * safe values — the must-pass baseline that proves the checks don't false-positive.
 * Both satisfy the module's structural contract (required fields, enum sets, list
 * bounds) so the one-module page still validates and renders.
 */
import type { ContentFieldSpec, ModuleMeta } from '@1stcontact/framework'
import { XSS_SENTINEL } from './checks'
import type { ConformanceFixture } from './types'

/** A `javascript:` URL whose payload sets the execution sentinel if it ever runs. */
const JS_URL = `javascript:window.${XSS_SENTINEL}=true`
/** Inline-handler HTML — inert when a field escapes it, live when it reaches a sink. */
const HANDLER_HTML = `<img src=x onerror="window.${XSS_SENTINEL}=true">`

/** A field is worth filling if it is required or can carry a URL/injection vector. */
function shouldFill(spec: ContentFieldSpec): boolean {
  return spec.required || spec.type === 'url' || spec.type === 'object'
}

/** Build one field's value for the chosen posture (hostile vs benign). */
function valueFor(spec: ContentFieldSpec, hostile: boolean): unknown {
  switch (spec.type) {
    case 'string':
      return hostile ? HANDLER_HTML : 'Safe heading text'
    case 'markdown':
      // A markdown link is the live vector: it reaches `set:html` unfiltered.
      return hostile ? `Lead copy with a [tap here](${JS_URL}) link.` : 'A safe paragraph of prose.'
    case 'url':
      return hostile ? JS_URL : 'https://example.com/safe'
    case 'asset-ref':
      return hostile ? { src: JS_URL, alt: 'x' } : { src: '/assets/safe.png', alt: 'Logo' }
    case 'enum':
      return spec.values?.[0] ?? ''
    case 'object':
      return buildObject(spec, hostile)
    case 'list':
      return buildList(spec, hostile)
  }
}

/** An object field: recurse its declared shape, or synthesize a `{label, href}` CTA. */
function buildObject(spec: ContentFieldSpec, hostile: boolean): Record<string, unknown> {
  if (spec.itemSchema) return buildContent(spec.itemSchema, hostile)
  // No declared shape (e.g. hero's `cta`): the common link object carries an href.
  return { label: 'Tap', href: hostile ? JS_URL : '/safe' }
}

/** A list field: `minItems` (or one) elements built from the item contract. */
function buildList(spec: ContentFieldSpec, hostile: boolean): unknown[] {
  const n = spec.minItems ?? 1
  return Array.from({ length: n }, () => (spec.itemSchema ? buildContent(spec.itemSchema, hostile) : {}))
}

/** Fill a whole content schema for the chosen posture. */
function buildContent(
  schema: Record<string, ContentFieldSpec>,
  hostile: boolean,
): Record<string, unknown> {
  const content: Record<string, unknown> = {}
  for (const [field, spec] of Object.entries(schema)) {
    if (shouldFill(spec)) content[field] = valueFor(spec, hostile)
  }
  return content
}

/** Hostile content for `meta`'s schema — every fillable field carries a payload. */
export function buildInjectionContent(meta: ModuleMeta): Record<string, unknown> {
  return buildContent(meta.contentSchema, true)
}

/** Safe content for `meta`'s schema — the must-pass baseline (no false positives). */
export function buildBenignContent(meta: ModuleMeta): Record<string, unknown> {
  return buildContent(meta.contentSchema, false)
}

/**
 * A pair of fixtures for a module: the schema-derived injection fixture and its
 * benign twin. `variant` defaults to the module's first declared variant.
 */
export function buildSecurityFixtures(meta: ModuleMeta): {
  injection: ConformanceFixture
  benign: ConformanceFixture
} {
  const variant = meta.variants[0] ?? ''
  return {
    injection: { label: `${meta.id}:injection`, props: { variant, content: buildInjectionContent(meta) } },
    benign: { label: `${meta.id}:benign`, props: { variant, content: buildBenignContent(meta) } },
  }
}
