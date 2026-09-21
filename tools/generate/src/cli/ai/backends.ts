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
