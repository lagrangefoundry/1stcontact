/**
 * This project's backend settings, installed into the library (BUG-67).
 *
 * WHAT WAS WRONG. `build` constructed `ClaudeAPIBackend` naming neither a model
 * nor a ceiling, so both came from the framework — and while they were framework
 * CONSTANTS that was not a choice this repository could make. It sent
 * `max_tokens: 4096` at a surface whose smallest legitimate write is a whole
 * page, and the cap is enforced without the model's knowledge: the reply is cut
 * wherever it happens to be, which in a tool call is a broken JSON argument
 * rather than a smaller edit. BUG-67 is twelve consecutive `set_l1` calls
 * arriving with `{}` for exactly that reason.
 *
 * lagrange-framework BUG-49 made both settings configuration. This file is the
 * consuming half: `backends.json` holds the values, this installs them, and the
 * framework validates them.
 *
 * IT IS A DOCUMENT, NOT A CONSTRUCTOR ARGUMENT, and that is deliberate. The
 * options exist on `ClaudeAPIBackend` too, and passing them at the one
 * construction site would have been the shorter path. It would also put the
 * project's model choice inside a function about tool projection, reachable only
 * by editing TypeScript — and `registerBackend` takes a zero-argument factory,
 * so anything else that builds a backend through the registry would go on
 * getting the framework's opinion. Configuration reaches every construction
 * site; an argument reaches one. It is the same reason `priming.json` is a
 * document rather than an array literal in `roles.ts`.
 *
 * STATIC IMPORT, NEVER `node:fs`. `host-core.ts` is the half a Worker loads
 * (REQ-146) and `loadBackends` — the framework's Node file reader — would put a
 * filesystem in that import graph. Both hosts must also AGREE: a setting only
 * the CLI could read would mean the builder sends one ceiling from the operator's
 * machine and another from workerd, which is the kind of divergence REQ-146 split
 * the host to prevent. The framework's own seam is written for this — everything
 * that decides lives in `backend_config.js` and the parse is the caller's — so a
 * Worker configured from a bundled document gets exactly the rejections a Node
 * host gets from a file.
 */

import backendsDocument from './backends.json'
import type { AiLibrary } from './toolbox-core'
import { budgetCeiling } from './budget-core'

/**
 * Install {@link backendsDocument} as the settings every backend is built with.
 *
 * MUST RUN BEFORE THE FIRST BACKEND IS CONSTRUCTED. The backends read the
 * configuration at construction, not per request, and `SessionManager` holds its
 * instance for the life of the manager — so configuring after the fact would
 * leave the first session, and every session that reuses its manager, on the
 * framework's defaults while the file said otherwise. `build` calls this ahead of
 * `registerBackend` for that reason.
 *
 * Idempotent, and safe to call once per site: `configureBackends` validates the
 * whole document and then replaces the installed mapping, so N calls with the
 * same document leave the same settings in force. That is the same property
 * `registerBackend` has, and it is why neither needs a once-per-process guard.
 *
 * @throws the framework's `BackendConfigError` when `backends.json` names a
 *   backend the library does not declare, a key that backend does not have, or a
 *   value of the wrong shape. Raised HERE — at host build, next to the Toolbox
 *   construction that surfaces configuration failures for the same reason —
 *   rather than as a 400 on the first turn, and the message names the key.
 */
export function configureProjectBackends(lib: AiLibrary): void {
  lib.configureBackends(backendsDocument)
  checkProjectWindows(lib)
}

/**
 * Every backend this project configures resolves a context window, or refuse to
 * start ([[REQ-296]]).
 *
 * WHY A CHECK AND NOT A DECLARED VALUE. `context_window` is a key this file may
 * set, and setting it would be the obvious reading of "declare the window" — but
 * the framework resolves the window from the CONFIGURED MODEL through
 * `defaults/models.json`, and says at length why a window declared beside a model
 * is the wrong shape: settings merge per key, so a `context_window` here would
 * outlive the next change of `model` and hand a session the denominator of a model
 * it is not running. Silently, and forever. A wrong denominator is worse than
 * none — a session told it is at 60% when it is at 12% spends conservatively for
 * no reason, and the reverse gets it truncated while believing it has room.
 *
 * SO WHAT WAS ACTUALLY MISSING WAS THE ALARM. Both models this file names are in
 * the framework's table, so both windows resolve today and nothing had to be
 * declared. What was true is that NOTHING NOTICED if they did not: a model the
 * table does not name resolves no window, and a host with no window has no gauge
 * (it renders the figure and declines to give a proportion) and no guard (a
 * ceiling of zero is "unguardable"). Both would have degraded in silence, on the
 * one edit — a model ID, the fastest-moving fact in the system — most likely to
 * cause it.
 *
 * RAISED AT HOST BUILD, beside the rejections `configureBackends` already makes,
 * for the reason that call is here rather than on the first turn: a
 * misconfiguration should cost a start-up and not a conversation. The escape hatch
 * is the one the framework documents — declare `context_window` on that entry,
 * which is the one case that key exists for.
 *
 * @throws the framework's `BackendConfigError`, so a window that cannot be
 *   resolved reads like every other configuration failure rather than like a bug.
 */
export function checkProjectWindows(lib: AiLibrary): void {
  for (const name of Object.keys(backendsDocument)) {
    if (name === 'about') continue
    if (projectBackendWindow(lib, name) > 0) continue
    const settings = lib.backendSettings(name, { family: PROJECT_BACKEND }) as { model?: string }
    throw new lib.BackendConfigError(
      `backends.json entry '${name}' resolves no context window: the framework ` +
        `does not know how large ${JSON.stringify(settings?.model ?? '')}'s context ` +
        `is. Without one this session gets no occupancy gauge and no overflow ` +
        `guard ([[REQ-296]]). Either name a model the framework's model table ` +
        `carries, or declare 'context_window' on this entry — which is the one ` +
        `case that key exists for.`,
    )
  }
}

/**
 * How much context the model configured for `name` holds, or `0`.
 *
 * ASKED OF THE FRAMEWORK, for {@link projectBackendModel}'s reason: the window is
 * resolved from the model that came out of the merge, so reading this file
 * directly would answer for a model this project NAMES rather than for the one a
 * request is sent with.
 */
export function projectBackendWindow(lib: AiLibrary, name: string = PROJECT_BACKEND): number {
  const settings = lib.backendSettings(name, { family: PROJECT_BACKEND }) as {
    contextWindow?: number
  }
  return Math.trunc(Number(settings?.contextWindow) || 0)
}

/**
 * The measured occupancy at which this host stops sending on `name` ([[REQ-296]]).
 *
 * THE SAME NUMBER THE ADAPTER'S OWN GUARD USES, derived from the same two
 * settings, so the pre-turn refusal in `host-core.ts` and the in-turn one in
 * `budget-core.ts` cannot disagree about where the line is. The host asks for it
 * by NAME because it makes its decision before there is a backend instance to ask;
 * the guard reads the instance, because by then there is one.
 */
export function projectBackendCeiling(lib: AiLibrary, name: string = PROJECT_BACKEND): number {
  const settings = lib.backendSettings(name, { family: PROJECT_BACKEND }) as {
    contextWindow?: number
    maxTokens?: number
  }
  return budgetCeiling(Number(settings?.contextWindow) || 0, Number(settings?.maxTokens) || 0)
}

/** The settings this project declares, for anything that needs to assert them. */
export { backendsDocument }

/**
 * The adapter family every backend this host registers is a variant of
 * ([[REQ-292]]).
 *
 * WHY IT IS NAMED AT ALL. The registry names are per-site and per-business —
 * `claude+site:acme`, `claude+business:…` — because a backend carries its tool
 * set and the registry is global. None of those is what a PRICE is keyed by: the
 * rates belong to the adapter and the model, and `ClaudeAPIBackend` itself reads
 * its settings under `{family: 'claude'}` for exactly the same reason. So the
 * family is what `turn_spend.backend` records and what `prices.json` keys on,
 * and this is the one place it is spelled.
 *
 * It is `'claude'` because that is the only adapter this host constructs. A
 * second one is a second `registerBackend` call, and the record already has a
 * column to tell them apart.
 */
export const PROJECT_BACKEND = 'claude'

/**
 * The model in force for {@link PROJECT_BACKEND}, or `''` where none is
 * configured ([[REQ-292]]).
 *
 * ASKED OF THE FRAMEWORK RATHER THAN READ OUT OF {@link backendsDocument}. The
 * settings that reach the wire are the consumer's document merged per key over
 * the framework's shipped defaults, and `backendSettings` is the function that
 * performs that merge — the same one `ClaudeAPIBackend`'s constructor calls. A
 * meter that read this file directly would record the model this project NAMES,
 * which is not necessarily the model a request was sent with: delete the key and
 * the wire quietly falls back to the framework's, and only one of the two
 * readings would notice.
 */
export function projectBackendModel(lib: AiLibrary): string {
  const settings = lib.backendSettings(PROJECT_BACKEND) as { model?: string } | undefined
  return typeof settings?.model === 'string' ? settings.model : ''
}
