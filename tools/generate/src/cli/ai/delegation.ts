/**
 * This project's delegation settings, read at start-up ([[REQ-295]]).
 *
 * THE CONSUMING HALF OF `delegation.json`, exactly as `backends.ts` is the
 * consuming half of `backends.json`: the document holds the values, this
 * validates them, and every refusal names the offending key. The two files sit
 * beside each other because they answer halves of one question — which model a
 * worker runs on is a `backends.json` entry, and *whether there are workers at
 * all* is this one.
 *
 * WHY IT IS NOT A KEY IN `backends.json`. That file's keys are the FRAMEWORK'S
 * schema: `configureBackends` validates the whole document and rejects anything
 * it does not declare, so an `enabled` flag there would fail the very validation
 * the file exists to pass.
 *
 * STATIC IMPORT, NEVER `node:fs`, for `backends.ts`'s reason precisely:
 * `host-core.ts` is the half a Worker loads (REQ-146), and a file reader would
 * put a filesystem in that import graph. Both hosts must also AGREE — a switch
 * only the CLI could read would mean the Worker delegated while the operator's
 * machine did not, which is the divergence REQ-146 split the host to prevent.
 *
 * THE DOCUMENT IS REPLACEABLE IN FULL, and that is the same seam the framework
 * draws for backends ("the parse is the caller's"). Today the only parse is the
 * bundled import; a Worker reading the switch from KV, or a test standing the
 * feature up, installs its own document through {@link configureDelegation} and
 * gets exactly the rejections the bundled one gets.
 */

import delegationDocument from './delegation.json'
import { backendsDocument } from './backends'

/** What one worker role needs: the backend entry its sessions run on. */
export interface WorkerSettings {
  readonly backend: string
}

/** The whole switch: whether to delegate at all, and to whom on what. */
export interface DelegationSettings {
  readonly enabled: boolean
  readonly workers: Readonly<Record<string, WorkerSettings>>
}

/** A delegation document was malformed, or bound a role to a backend nobody declares. */
export class DelegationConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DelegationConfigError'
  }
}

/** `about` is documentation carried in the document, as in every file beside it. */
const DOC_KEY = 'about'

/** The one key a worker entry has. Anything else is a typo, not an extension point. */
const WORKER_KEYS = ['backend'] as const

/** The backend names `backends.json` declares — what a worker's may be one of. */
function declaredBackends(): string[] {
  return Object.keys(backendsDocument as Record<string, unknown>)
    .filter((key) => key !== DOC_KEY)
    .sort()
}

/**
 * Validate an already-parsed delegation document.
 *
 * EVERY FAILURE IS A START-UP FAILURE WITH A NAME ATTACHED. The one this exists
 * for is condition 9 of the ticket: a worker role bound to a backend
 * `backends.json` does not declare is refused here, naming both, rather than at
 * the first delegation — which would be a configuration failure discovered by a
 * customer, in the middle of their conversation, on the one path nobody exercises
 * before shipping.
 */
export function delegationFromMapping(data: unknown): DelegationSettings {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new DelegationConfigError('delegation configuration must be a mapping')
  }
  const mapping = data as Record<string, unknown>
  const enabled = mapping.enabled
  if (typeof enabled !== 'boolean') {
    throw new DelegationConfigError(
      `delegation 'enabled' must be true or false, got ${JSON.stringify(enabled)}`,
    )
  }
  const rawWorkers = mapping.workers ?? {}
  if (rawWorkers === null || typeof rawWorkers !== 'object' || Array.isArray(rawWorkers)) {
    throw new DelegationConfigError(
      `delegation 'workers' must be a mapping of role to settings, got ` +
        `${JSON.stringify(rawWorkers)}`,
    )
  }
  const allowed = declaredBackends()
  const workers: Record<string, WorkerSettings> = {}
  for (const [role, entry] of Object.entries(rawWorkers as Record<string, unknown>)) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new DelegationConfigError(
        `delegation worker '${role}' must be a mapping of settings, got ${JSON.stringify(entry)}`,
      )
    }
    for (const key of Object.keys(entry as Record<string, unknown>)) {
      if (!WORKER_KEYS.includes(key as (typeof WORKER_KEYS)[number])) {
        throw new DelegationConfigError(
          `delegation worker '${role}' has no setting '${key}'. ` +
            `Settings for a worker: ${[...WORKER_KEYS].join(', ')}`,
        )
      }
    }
    const backend = (entry as { backend?: unknown }).backend
    if (typeof backend !== 'string' || backend.trim() === '') {
      throw new DelegationConfigError(
        `delegation worker '${role}' must name a backend, got ${JSON.stringify(backend)}`,
      )
    }
    // CONDITION 9. The document that says which model a worker runs on is
    // `backends.json`, so a name that is not in it resolves to no model, no
    // ceiling and the framework's own defaults — silently, and on the expensive
    // side. Refused by name.
    if (!allowed.includes(backend)) {
      throw new DelegationConfigError(
        `delegation worker '${role}' names backend '${backend}', which backends.json ` +
          `does not declare. Declared: ${allowed.join(', ')}`,
      )
    }
    workers[role] = Object.freeze({ backend })
  }
  return Object.freeze({ enabled, workers: Object.freeze(workers) })
}

/** The consumer's document, once installed. `null` means "the bundled one". */
let INSTALLED: DelegationSettings | null = null

/**
 * Install a delegation document, or `null` to go back to the bundled one.
 *
 * Validates first and installs second, so a rejected document leaves the previous
 * settings in force rather than half of it — the property `configureBackends` has
 * one file over.
 *
 * MANAGERS ARE CACHED, so a caller that changes this after a session has been
 * opened must drop them (`resetAiHost`): the delegation surface is composed when
 * the Toolbox is built, and a manager holds its backend for its whole life.
 */
export function configureDelegation(data: unknown | null): DelegationSettings {
  INSTALLED = data === null ? null : delegationFromMapping(data)
  return delegationSettings()
}

/** The settings in force: the installed document, or the one that ships. */
export function delegationSettings(): DelegationSettings {
  return INSTALLED ?? delegationFromMapping(delegationDocument)
}

/**
 * The settings in force, checked against the worker roles this host can stand up.
 *
 * THE SECOND HALF OF THE START-UP CHECK, and it is here rather than in
 * {@link delegationFromMapping} because *which roles exist* is the HOST'S
 * knowledge and not the document's. A document naming a role nothing can build
 * would otherwise produce a runtime `unknown_role` refusal at the first
 * delegation — a live conversation reporting a configuration mistake.
 *
 * WITH THE SWITCH OFF THE WORKERS ARE STILL CHECKED. A misconfiguration that only
 * became visible on the day the switch was flipped would make flipping it an
 * experiment rather than a decision.
 */
export function delegationFor(known: readonly string[]): DelegationSettings {
  const settings = delegationSettings()
  for (const role of Object.keys(settings.workers)) {
    if (known.includes(role)) continue
    throw new DelegationConfigError(
      `delegation names worker role '${role}', which this host cannot build. ` +
        `Roles it can: ${[...known].sort().join(', ') || '(none)'}`,
    )
  }
  return settings
}

/** The settings this project declares, for anything that needs to assert them. */
export { delegationDocument }
