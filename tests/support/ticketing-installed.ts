import fs from 'node:fs'
import path from 'node:path'
import { WEBUI_SCOPE, webuiPackageDir } from '../../tools/generate/src/cli/webui'

/** The component id, in the vocabulary `bin/install` and the store both use. */
const COMPONENT = 'ticketing'

/**
 * Whether the ticket store component is present **and carries the attachment
 * surface** (REQ-162).
 *
 * TWO QUESTIONS, NOT ONE, and the second is the one that actually bit. The
 * component reaches this repository through the same shared artifact store the
 * browser components do — populated only when an operator runs `bin/install` —
 * so "absent" is an ordinary state on a fresh clone, exactly as
 * `webui-installed.ts` describes. But a *stale* install is not the same state
 * and must not report as the same one: the copy sitting in the store when this
 * ticket started predated lagrange-framework REQ-104, so it had the schema and
 * the store and no `BlobStore` at all. Everything imported cleanly and
 * `R2BlobStore` was `undefined`.
 *
 * That failure mode is worth a named check rather than a stack trace. A version
 * comparison could not answer it — the package is `0.0.0` and stays `0.0.0`
 * across every install — so presence is decided by the FILE the capability
 * lives in, which is the thing that actually has to be there.
 *
 * THE SCOPE IS NEVER SPELLED HERE, and that is a rule rather than a style
 * (AC-960). It is declared in exactly one place, `webui.ts`, because a second
 * copy would not announce itself as a defect: a half-completed rename fails
 * resolution in precisely the way a machine that never ran the install does, so
 * the restatement would read as "not installed yet". Both messages below
 * therefore compose the name, and the absent case simply carries the
 * declaration's own error text.
 *
 * Suites gate on this rather than failing, for the reason the webui helper
 * gives: the evidence is genuinely missing, and a visible skip naming the fix
 * beats a red run nobody can act on. It is never a substitute for the wiring
 * evidence itself — the bindings and the migration are asserted
 * unconditionally, because those are this repository's own files and are always
 * present.
 */
function probe(): { ok: boolean; reason: string } {
  let dir: string
  try {
    dir = webuiPackageDir(COMPONENT)
  } catch (err) {
    // The declaration's own message, which already names the component and the
    // literal command that installs it.
    return { ok: false, reason: (err as Error).message }
  }
  if (!fs.existsSync(path.join(dir, 'src', 'blob_store.js'))) {
    return {
      ok: false,
      reason:
        `${WEBUI_SCOPE}/${COMPONENT} at ${dir} predates the BlobStore port ` +
        '(lagrange-framework REQ-104).\n' +
        `Re-run: cd ../lagrange-framework && bin/install --lang js --component ${COMPONENT}`,
    }
  }
  return { ok: true, reason: '' }
}

const result = probe()

export const TICKETING_INSTALLED = result.ok
export const TICKETING_SKIP_REASON = result.reason
