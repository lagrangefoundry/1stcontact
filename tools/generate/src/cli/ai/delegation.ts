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
 * AND WHETHER THE PRIMARY STILL WRITES ([[REQ-343]]), which is the second key here
 * rather than an edit to `instances.json` for one reason: `enabled` has to dominate
 * it. Two documents holding one half of that each is how a deployment gets built
 * in which the consultant has lost its write groups and has no worker to
 * commission — the one state the rollback above exists to make unreachable. Read
 * together, they cannot produce it.
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
 *
 * AND PER SCOPE, WITHOUT INSTALLING ANYTHING ([[REQ-353]]). {@link
 * DelegationResolver} is that same replaceability reached per request: a business
 * says whether it delegates, the answer becomes a document, and the document goes
 * through the validation below exactly as the bundled one does. It is a PARAMETER
 * and never a global — see the resolver's own note for why that distinction is the
 * load-bearing one.
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
  /**
   * Whether the consultant still writes L1 itself ([[REQ-343]]).
   *
   * `false` — the shipped value — narrows its grant to the groups the surface
   * declares `read`, so construction is commissioned rather than performed. It is
   * read HERE rather than in `instances.json` because {@link enabled} dominates
   * it: a consultant with no write groups and no worker to commission is the one
   * state no configuration may be able to produce, and two switches in two
   * documents are exactly how it gets produced.
   */
  readonly primaryWrites: boolean
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
  // [[REQ-343]] — ABSENT IS `false`, which is the one default in this file that
  // is not simply "what shipped before". The design is that the primary does not
  // write, and a replacement document that omits the key should get the design;
  // the shipped document states it anyway so the value is where an operator
  // looks. Present and not a boolean is refused by name, exactly as `enabled` is
  // — a `"false"` that read as truthy would silently restore the consultant's
  // hands and cost the twelve-fold difference this key exists to capture.
  const rawPrimaryWrites = mapping.primary_writes
  if (rawPrimaryWrites !== undefined && typeof rawPrimaryWrites !== 'boolean') {
    throw new DelegationConfigError(
      `delegation 'primary_writes' must be true or false, got ` +
        `${JSON.stringify(rawPrimaryWrites)}`,
    )
  }
  const primaryWrites = rawPrimaryWrites ?? false
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
  return Object.freeze({ enabled, primaryWrites, workers: Object.freeze(workers) })
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
export function delegationFor(
  known: readonly string[],
  /**
   * One request's own document, or `null` for this deployment's ([[REQ-353]]).
   *
   * THE PARSE THE HEADER ALREADY PROMISED, reached. "The document is replaceable
   * in full … today the only parse is the bundled import; a Worker reading the
   * switch from KV, or a test standing the feature up, installs its own
   * document" — this is the parameter that lets it do so WITHOUT installing
   * anything, which is the distinction {@link configureDelegation} cannot make.
   *
   * IT IS NOT A SECOND WAY TO CONFIGURE THIS DEPLOYMENT. A caller that passes
   * nothing gets exactly what it got before: the installed document, or the
   * bundled one. Everything below applies to a document from either source
   * identically, which is what makes a per-business value cost no second set of
   * refusals.
   */
  document: unknown | null = null,
): DelegationSettings {
  const settings = document === null ? delegationSettings() : delegationFromMapping(document)
  for (const role of Object.keys(settings.workers)) {
    if (known.includes(role)) continue
    throw new DelegationConfigError(
      `delegation names worker role '${role}', which this host cannot build. ` +
        `Roles it can: ${[...known].sort().join(', ') || '(none)'}`,
    )
  }
  return settings
}

/**
 * Where one scope's delegation document comes from ([[REQ-353]]).
 *
 * A RESOLVER AND NOT A VALUE, and the difference is the whole of what makes the
 * flip mean anything. A value would be read once, by whoever assembled the host,
 * and a host is cached for as long as its store is — so the switch would be
 * visible only to a deployment that had been restarted. This is asked on the path
 * that BUILDS a manager, so the answer is the one the database holds when the
 * session is composed.
 *
 * IT IS NOT REACHED THROUGH {@link configureDelegation}, deliberately, and that
 * is [[EPIC-22]]'s named trap: that function writes a module-level global, and
 * mutating a global per request while feeding a manager cache keyed per
 * store-and-site is precisely how one business comes to be served another's
 * setting. A resolver travels on `deps`, where it cannot bleed.
 *
 * `business` IS CARRIED SO THAT A REFUSAL CAN NAME IT. A stored value is
 * validated exactly as the bundled document is, which means the refusals are the
 * document's — *`enabled` must be true or false* — and a deployment reading those
 * with no idea WHOSE row produced them would have to go looking. See
 * {@link delegationForScope}.
 */
export interface DelegationResolver {
  /** Whose setting this resolves, for the refusal message and for nothing else. */
  readonly business: string
  /**
   * That business's document, or `null` where it holds no opinion.
   *
   * `null` IS THE ORDINARY ANSWER AND MEANS INHERIT. A business that has never
   * been asked resolves to this deployment's own document, so a host that grows
   * this seam changes no conversation until somebody moves a switch.
   */
  read(): Promise<unknown | null>
}

/**
 * The settings in force for one scope — the resolver's document, or this
 * deployment's ([[REQ-353]]).
 *
 * A HOST WITH NO RESOLVER READS THE BUNDLED DOCUMENT, which is this
 * repository's ordinary shape for a capability a host has not got: a missing
 * browser, a missing renderer, a missing ticket store. The `1c` CLI passes none
 * and behaves exactly as it did — it is not a host that disagrees about a value,
 * it is a host with no per-business override to read.
 *
 * EVERY REFUSAL NAMES THE BUSINESS AND THE OFFENDING KEY. The validation is
 * {@link delegationFor}'s, unchanged and unduplicated; what this adds is whose
 * row was being read when it failed. It fails HERE — on the path that builds the
 * host — rather than at the first delegation, which would be a configuration
 * mistake discovered in the middle of a customer's conversation.
 *
 * A READ THAT THROWS IS A REFUSAL AND NOT AN INHERIT. Treating an unreachable
 * database as *no opinion* would silently serve this deployment's arrangement to
 * a business that had turned it off, which is the one failure mode a switch used
 * as a rollback may not have.
 */
export async function delegationForScope(
  known: readonly string[],
  resolver: DelegationResolver | null = null,
): Promise<DelegationSettings> {
  if (resolver === null) return delegationFor(known)
  let document: unknown | null
  try {
    document = await resolver.read()
  } catch (error) {
    throw new DelegationConfigError(
      `delegation settings for business '${resolver.business}' could not be read: ` +
        `${error instanceof Error ? error.message : String(error)}`,
    )
  }
  if (document === null || document === undefined) return delegationFor(known)
  try {
    return delegationFor(known, document)
  } catch (error) {
    if (error instanceof DelegationConfigError) {
      throw new DelegationConfigError(`business '${resolver.business}': ${error.message}`)
    }
    throw error
  }
}

/** The settings this project declares, for anything that needs to assert them. */
export { delegationDocument }
