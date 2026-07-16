import type { AstroComponentFactory } from 'astro/runtime/server/index.js'

/**
 * Module contract types (DOC-7 §3.1). Every module file exports a `moduleMeta`
 * object declaring its full contract: stable id, version, the finite set of
 * variants, the finite enumeration of each dial's values, and a typed schema
 * for each content field. All visual properties are finite enumerations —
 * free-form strings/numbers are forbidden (DOC-7 §3.2 rule 1).
 */

/**
 * Content-field kinds (DOC-7 §3.2). Structured fields use `object` / `list`.
 *
 * `styled-text` (REQ-50) is a flat styled *run* whose fields are the fidelity
 * report's own `ValueElement` names/units (`fontSizePx`, `fontWeight`, `color`,
 * `gradient`, …) — see {@link ../text-style#TextRun}. Its style fields relax
 * DOC-7 §3.2 rule 1 (finite enumerations): each accepts either a literal in the
 * report's unit (a captured value pasted verbatim) or a known theme alias.
 * {@link validateModuleContent} enforces literal-or-known-alias and rejects an
 * unknown alias.
 */
export type ContentFieldType =
  | 'string'
  | 'markdown'
  | 'url'
  | 'asset-ref'
  | 'enum'
  | 'list'
  | 'object'
  | 'styled-text'
  // A colour VALUE: a `#hex` absolute value OR a palette-role alias (the overlay
  // of constants). The absolute-or-overlay seam — lets a colour dial be
  // reproduced with an exact value, not just the restricted role vocabulary.
  | 'color'
  // A length VALUE (the size analogue): an absolute px, a named token, a relative
  // proportion (%/vw/em/ch), or a content keyword (fit-content). See classifyLength.
  | 'length'

/** One content field's contract. */
export interface ContentFieldSpec {
  type: ContentFieldType
  required: boolean
  /** Minimum length for a `list` field (inclusive). Ignored for other types. */
  minItems?: number
  /** Maximum length for a `list` field (inclusive). Ignored for other types. */
  maxItems?: number
  /**
   * Closed set of permitted values for an `enum` field (DOC-7 §3.2 rule 1 —
   * visual/semantic choices are finite enumerations, never free strings). A
   * value outside the set is a validation failure. Ignored for other types.
   */
  values?: readonly string[]
  /**
   * Per-field contract for a structured field. For a `list` of objects this is
   * the contract each element must satisfy; for an `object` field it is the
   * contract of the object itself. {@link validateModuleContent} recurses into
   * it, so nested `required`/`enum` constraints are enforced to arbitrary depth.
   * Ignored for scalar field types.
   */
  itemSchema?: Record<string, ContentFieldSpec>
}

/** The full module contract, exported as `moduleMeta` from each module. */
export interface ModuleMeta {
  /** Stable identifier, never renamed (DOC-7 §3.3). */
  id: string
  /** Monotonically incremented on a breaking contract change. */
  version: number
  /** Finite set of layout variants. */
  variants: readonly string[]
  /** Per-dial finite enumeration of permitted values. */
  dials: Record<string, readonly string[]>
  /** Per-field content schema. */
  contentSchema: Record<string, ContentFieldSpec>
}

/** A registry entry: a module's contract paired with its renderable component. */
export interface ModuleDefinition {
  meta: ModuleMeta
  Component: AstroComponentFactory
}

/**
 * Compile-time assertion helper: a module's `meta` must satisfy {@link ModuleMeta}.
 * Used by the type-level UAT to verify every module's contract shape.
 */
export type AssertModuleMeta<T extends ModuleMeta> = T
