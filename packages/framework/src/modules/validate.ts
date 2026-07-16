import type { ContentFieldSpec, ModuleMeta } from './types'
import {
  GRADIENT_DIRECTION_ALIASES,
  TEXT_STYLE_ALIASES,
  isColorLiteral,
  isPaletteRole,
} from './text-style'

/**
 * Module-content validation (DOC-7 §6.5 layer 1, the framework half).
 *
 * The site-schema validator checks structural shape only — it does not know a
 * module's content contract. This function closes that gap: given a module's
 * `moduleMeta` and a candidate content record, it reports required-field and
 * list-bound violations. It is general over the contract, not specialised to
 * any one module: a list field declaring `minItems`/`maxItems` is bounded for
 * every module that declares it.
 */

/** A single content-contract violation. */
export interface ContentValidationError {
  /** The offending content field name. */
  field: string
  /** Human-readable explanation (mirrors the validator-error shape of DOC-8 §6). */
  message: string
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

/**
 * REQ-50 — the numeric style fields of a styled run, each with its alias step-set.
 * Every one accepts a literal in the report's unit (a `number`) OR one of these
 * named token aliases (a `string`); any other string is an unknown alias.
 */
const NUMERIC_ALIAS_FIELDS: Record<string, readonly string[]> = {
  fontSizePx: TEXT_STYLE_ALIASES.fontSizePx,
  fontWeight: TEXT_STYLE_ALIASES.fontWeight,
  letterSpacingPx: TEXT_STYLE_ALIASES.letterSpacingPx,
  lineHeightPx: TEXT_STYLE_ALIASES.lineHeightPx,
}

/** The content-bearing (non-style) fields of a styled run — validated as plain strings. */
const RUN_TEXT_FIELDS = ['text', 'label', 'href'] as const

/** Validate one styled run's fields are each literal-or-known-alias (REQ-50). */
function validateTextRun(
  path: string,
  run: Record<string, unknown>,
  errors: ContentValidationError[],
): void {
  for (const field of RUN_TEXT_FIELDS) {
    const v = run[field]
    if (v !== undefined && typeof v !== 'string') {
      errors.push({ field: `${path}.${field}`, message: `styled-text field '${path}.${field}' must be a string` })
    }
  }

  // A numeric field: a `number` literal (report unit) or a known step alias.
  for (const [field, aliases] of Object.entries(NUMERIC_ALIAS_FIELDS)) {
    const v = run[field]
    if (v === undefined) continue
    if (typeof v === 'number') continue
    if (typeof v === 'string' && aliases.includes(v)) continue
    errors.push({
      field: `${path}.${field}`,
      message: `styled-text field '${path}.${field}' must be a number or one of [${aliases.join(', ')}], got '${String(v)}'`,
    })
  }

  // `paddingLeftPx` is always a measured length — a literal number, no alias.
  if (run.paddingLeftPx !== undefined && typeof run.paddingLeftPx !== 'number') {
    errors.push({
      field: `${path}.paddingLeftPx`,
      message: `styled-text field '${path}.paddingLeftPx' must be a number`,
    })
  }

  // `fontFamily` is a real family name (literal) or a family-role alias — either
  // way a string; a non-string is the only error.
  if (run.fontFamily !== undefined && typeof run.fontFamily !== 'string') {
    errors.push({
      field: `${path}.fontFamily`,
      message: `styled-text field '${path}.fontFamily' must be a string (family name or role)`,
    })
  }

  // `color` is a `#hex` literal (report unit) or a known palette-role alias.
  if (run.color !== undefined) validateColor(`${path}.color`, run.color, errors)

  // `gradient` mirrors the report's TextGradient: an angle + colour stops.
  if (run.gradient !== undefined) validateGradient(`${path}.gradient`, run.gradient, errors)
}

/** A `color` value: a `#hex` literal or a known palette-role alias, else an error. */
function validateColor(path: string, value: unknown, errors: ContentValidationError[]): void {
  if (typeof value === 'string' && (isColorLiteral(value) || isPaletteRole(value))) return
  errors.push({
    field: path,
    message: `styled-text field '${path}' must be a #hex colour or a palette-role alias, got '${String(value)}'`,
  })
}

/** A gradient treatment: `angleDeg` (degrees literal or direction alias) + ≥1 colour stops. */
function validateGradient(path: string, value: unknown, errors: ContentValidationError[]): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push({ field: path, message: `styled-text field '${path}' must be a gradient object` })
    return
  }
  const g = value as Record<string, unknown>
  const angle = g.angleDeg
  const angleOk =
    typeof angle === 'number' ||
    (typeof angle === 'string' && (GRADIENT_DIRECTION_ALIASES as readonly string[]).includes(angle))
  if (!angleOk) {
    errors.push({
      field: `${path}.angleDeg`,
      message: `gradient '${path}.angleDeg' must be a degrees number or one of [${GRADIENT_DIRECTION_ALIASES.join(', ')}], got '${String(angle)}'`,
    })
  }
  if (!Array.isArray(g.stops)) {
    errors.push({ field: `${path}.stops`, message: `gradient '${path}.stops' must be a list of colour stops` })
    return
  }
  g.stops.forEach((stop, i) => {
    // A stop is a bare colour string (hex/role) or `{ color, position? }`.
    const color = typeof stop === 'string' ? stop : (stop as Record<string, unknown>)?.color
    validateColor(`${path}.stops[${i}].color`, color, errors)
  })
}

/**
 * Validate one field's value against its spec, prefixing every reported field
 * name with `path` so nested violations read as `items[0].badge.variant`.
 * Recurses through `itemSchema` for `list`/`object` fields, so the same
 * required/enum rules apply at every depth — the function is general over the
 * contract, never specialised to a particular module or field.
 */
function validateField(
  path: string,
  spec: ContentFieldSpec,
  value: unknown,
  errors: ContentValidationError[],
): void {
  if (spec.required && isEmpty(value)) {
    errors.push({ field: path, message: `required content field '${path}' is missing` })
    return
  }
  if (isEmpty(value)) return

  if (spec.type === 'enum' && spec.values !== undefined) {
    if (typeof value !== 'string' || !spec.values.includes(value)) {
      errors.push({
        field: path,
        message: `content field '${path}' must be one of [${spec.values.join(', ')}], got '${String(value)}'`,
      })
    }
    return
  }

  if (spec.type === 'color') {
    // Absolute value (#hex) or a palette-role alias (the overlay). Reuses the
    // same literal-or-role rule as styled-text `color`.
    validateColor(path, value, errors)
    return
  }

  if (spec.type === 'styled-text') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push({ field: path, message: `content field '${path}' must be a styled-text run` })
      return
    }
    validateTextRun(path, value as Record<string, unknown>, errors)
    return
  }

  if (spec.type === 'object' && spec.itemSchema !== undefined) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push({ field: path, message: `content field '${path}' must be an object` })
      return
    }
    validateSchema(path, spec.itemSchema, value as Record<string, unknown>, errors)
    return
  }

  if (spec.type === 'list') {
    if (!Array.isArray(value)) {
      errors.push({ field: path, message: `content field '${path}' must be a list` })
      return
    }
    if (spec.minItems !== undefined && value.length < spec.minItems) {
      errors.push({
        field: path,
        message: `content field '${path}' requires at least ${spec.minItems} item(s), got ${value.length}`,
      })
    }
    if (spec.maxItems !== undefined && value.length > spec.maxItems) {
      errors.push({
        field: path,
        message: `content field '${path}' allows at most ${spec.maxItems} item(s), got ${value.length}`,
      })
    }
    if (spec.itemSchema !== undefined) {
      value.forEach((item, i) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          errors.push({ field: `${path}[${i}]`, message: `item '${path}[${i}]' must be an object` })
          return
        }
        validateSchema(`${path}[${i}]`, spec.itemSchema!, item as Record<string, unknown>, errors)
      })
    }
  }
}

/** Validate every field of `content` against `schema`, prefixing names with `path`. */
function validateSchema(
  path: string,
  schema: Record<string, ContentFieldSpec>,
  content: Record<string, unknown>,
  errors: ContentValidationError[],
): void {
  for (const [field, spec] of Object.entries(schema)) {
    const prefixed = path ? `${path}.${field}` : field
    validateField(prefixed, spec, content[field], errors)
  }
}

/**
 * Validate `content` against `meta.contentSchema`. Returns an empty array when
 * the content satisfies the contract.
 */
export function validateModuleContent(
  meta: ModuleMeta,
  content: Record<string, unknown>,
): ContentValidationError[] {
  const errors: ContentValidationError[] = []
  validateSchema('', meta.contentSchema, content, errors)
  return errors
}
