/**
 * The structured-edit failure contract (REQ-11).
 *
 * Every structured-edit command (`page`/`config`/`asset`/`status`) reports
 * failure as a {@link CommandError} carrying a stable `code`, a human-readable
 * `message`, an optional `path` (a JSON-pointer for schema errors, or the
 * offending reference for integrity errors), and an optional `hint`. The code
 * maps deterministically to a process exit code so an AI caller can branch on
 * the outcome without parsing prose. These are first-class requirements: the
 * surface is designed to be driven by an AI, not just a human at a terminal.
 */

export type ErrorCode =
  | 'SCHEMA_INVALID'
  | 'NOT_FOUND'
  | 'REFERENTIAL_INTEGRITY'
  | 'CONFLICT'
  | 'INTERNAL'

/** Stable process exit codes, identical in `--json` and human mode. `0` = success. */
export const EXIT_CODES: Record<ErrorCode, number> = {
  SCHEMA_INVALID: 2,
  NOT_FOUND: 3,
  REFERENTIAL_INTEGRITY: 4,
  CONFLICT: 5,
  INTERNAL: 1,
}

export interface CommandErrorShape {
  code: ErrorCode
  message: string
  /** JSON-pointer (schema errors) or the offending reference (integrity errors). */
  path?: string
  /** Actionable next step — how to fix the input. */
  hint?: string
}

/** A structured, AI-legible command failure. */
export class CommandError extends Error {
  readonly code: ErrorCode
  readonly path?: string
  readonly hint?: string

  constructor(shape: CommandErrorShape) {
    super(shape.message)
    this.name = 'CommandError'
    this.code = shape.code
    this.path = shape.path
    this.hint = shape.hint
  }

  /** The `error` member of a `--json` failure envelope. */
  toEnvelope(): Record<string, unknown> {
    const error: Record<string, unknown> = { code: this.code, message: this.message }
    if (this.path !== undefined) error.path = this.path
    if (this.hint !== undefined) error.hint = this.hint
    return error
  }

  /** Single-line human rendering: `CODE: message (path) — hint`. */
  toHuman(): string {
    let line = `${this.code}: ${this.message}`
    if (this.path !== undefined) line += ` (${this.path})`
    if (this.hint !== undefined) line += `\n  hint: ${this.hint}`
    return line
  }
}
