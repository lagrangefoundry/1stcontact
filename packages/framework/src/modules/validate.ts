import type { ModuleMeta } from './types'

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
 * Validate `content` against `meta.contentSchema`. Returns an empty array when
 * the content satisfies the contract.
 */
export function validateModuleContent(
  meta: ModuleMeta,
  content: Record<string, unknown>,
): ContentValidationError[] {
  const errors: ContentValidationError[] = []

  for (const [field, spec] of Object.entries(meta.contentSchema)) {
    const value = content[field]

    if (spec.required && isEmpty(value)) {
      errors.push({ field, message: `required content field '${field}' is missing` })
      continue
    }

    if (spec.type === 'list' && !isEmpty(value)) {
      if (!Array.isArray(value)) {
        errors.push({ field, message: `content field '${field}' must be a list` })
        continue
      }
      if (spec.minItems !== undefined && value.length < spec.minItems) {
        errors.push({
          field,
          message: `content field '${field}' requires at least ${spec.minItems} item(s), got ${value.length}`,
        })
      }
      if (spec.maxItems !== undefined && value.length > spec.maxItems) {
        errors.push({
          field,
          message: `content field '${field}' allows at most ${spec.maxItems} item(s), got ${value.length}`,
        })
      }
    }
  }

  return errors
}
