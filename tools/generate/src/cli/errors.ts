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

import type { ValidationError } from '@1stcontact/site-schema'

/**
 * Thrown when a definition fails schema validation; carries path-pointed errors.
 *
 * It lives here rather than in `commands.ts` because the request-time preview
 * throws it and now runs in workerd (REQ-145), while `commands.ts` reaches
 * `node:path` and the filesystem store. An error type is not a reason to drag a
 * filesystem into a Worker.
 */
export class InvalidDefinitionError extends Error {
  constructor(
    public slug: string,
    public errors: ValidationError[],
  ) {
    super(
      `Invalid site definition '${slug}':\n` +
        errors.map((e) => `  ${e.path}: ${e.message}`).join('\n'),
    )
    this.name = 'InvalidDefinitionError'
  }
}

/**
 * Thrown when a site is published with no public address ([[REQ-238]]).
 *
 * IT LIVES HERE BESIDE {@link InvalidDefinitionError} for the reason that one
 * does: `publishSite` runs in workerd and in Node, and an error type is not a
 * reason to drag a runtime into either. It is also the same KIND of refusal —
 * a publish that writes nothing at all, decided before a revision is minted.
 *
 * THE MESSAGE NAMES BOTH THINGS THAT WOULD FIX IT, and that is the requirement
 * rather than a courtesy. *"To go live a business needs a `1stc.site` hostname,
 * a custom domain, or both."* A refusal that named only the hostname would be
 * wrong the day [[EPIC-6]] lands, and a refusal that named neither would leave
 * the customer with a button that says no.
 */
export class NoPublicAddressError extends Error {
  constructor(public slug: string) {
    super(
      `Site '${slug}' has no public address, so publishing it would put it ` +
        'somewhere nobody can reach. Choose a 1stc.site hostname, or connect a ' +
        'domain you own — either one is enough.',
    )
    this.name = 'NoPublicAddressError'
  }
}

export type ErrorCode =
  | 'SCHEMA_INVALID'
  | 'NOT_FOUND'
  | 'REFERENTIAL_INTEGRITY'
  | 'CONFLICT'
  | 'ENVIRONMENT'
  | 'INTERNAL'

/** Stable process exit codes, identical in `--json` and human mode. `0` = success. */
export const EXIT_CODES: Record<ErrorCode, number> = {
  SCHEMA_INVALID: 2,
  NOT_FOUND: 3,
  REFERENTIAL_INTEGRITY: 4,
  CONFLICT: 5,
  // REQ-44 — the workspace is not installed as declared (a pruned dependency, a
  // lockfile the tree was never installed at). Its own code because the command
  // and its input were both fine: nothing about the invocation can fix it, so a
  // caller should re-install and retry rather than re-form the request.
  ENVIRONMENT: 6,
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
