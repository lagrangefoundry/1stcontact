import { WEBUI_SCOPE, webuiPackageDir } from '../../tools/generate/src/cli/webui'

/** The component id, in the vocabulary `bin/install` and the store both use. */
const COMPONENT = 'auth-passwordless'

/**
 * Whether `@lagrangefoundry/auth-passwordless` is present ([[REQ-202]]).
 *
 * THE SAME SHAPE AS `ticketing-installed.ts`, AND FOR THE SAME REASON. The
 * component reaches this repository through the shared artifact store, which is
 * populated only when an operator runs `bin/install` — nothing in `package.json`
 * records it, so `pnpm install` cannot supply it and the lockfile cannot notice
 * it missing. "Absent" is therefore an ordinary state on a fresh clone, and a
 * visible skip naming the fix beats a red run nobody can act on.
 *
 * IT GATES THE DRIFT CHECK AND NOTHING ELSE. Everything this repository owns —
 * the migration, the wrangler vars, the preflight registration — is asserted
 * unconditionally, because those files are always present. Gating them would make
 * a missing install look like a passing configuration, which is the failure mode
 * a presence-only guard is least able to distinguish.
 *
 * THE SCOPE IS NEVER SPELLED HERE. It is declared once, in `webui.ts`; a second
 * copy would not announce itself as a defect, because a half-completed rename
 * fails resolution in exactly the way a machine that never ran the install does.
 */
function probe(): { ok: boolean; reason: string } {
  try {
    webuiPackageDir(COMPONENT)
    return { ok: true, reason: '' }
  } catch (err) {
    // The declaration's own message, which already names the component and the
    // literal command that installs it.
    return { ok: false, reason: (err as Error).message }
  }
}

const result = probe()

export const PASSWORDLESS_INSTALLED = result.ok
export const PASSWORDLESS_SKIP_REASON = result.reason
export const PASSWORDLESS_COMPONENT = `${WEBUI_SCOPE}/${COMPONENT}`
