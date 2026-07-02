import type { ContentFieldSpec, ModuleMeta } from './types'

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
