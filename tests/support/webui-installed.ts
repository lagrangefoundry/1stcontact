import { sharedModuleUrl, webuiPackageDir, WEBUI_PACKAGES } from '../../tools/generate/src/cli/webui'

/**
 * Whether the shared `webui-*` components are present.
 *
 * PRESENCE ONLY. This cannot tell "never installed" from "installed under a
 * scope the components are no longer published under", so it is a legitimate
 * gate for MOUNT-behaviour suites and never for identity or wiring evidence —
 * see `bug32-webui-scope-rebrand` and AC-961, which assert this value rather
 * than branching on it.
 *
 * The chosen consumption route (REQ-115 Deliverable 0, DOC-8 §9.5) is a shared
 * artifact store populated by `lagrange-framework`'s `bin/install`. Upstream
 * names the cost explicitly: the dependency is IMPLICIT — nothing in our
 * `package.json` records it, so a fresh clone (CI, another machine) has nothing.
 *
 * Suites that mount the real components therefore skip when they are absent,
 * rather than failing. The skip is deliberately visible in the test report: the
 * evidence is genuinely missing there, and a green run that silently proved
 * nothing would be worse than a reported gap. A private registry is the
 * eventual fix, and upstream already names it as such.
 */
export const WEBUI_INSTALLED = WEBUI_PACKAGES.every((name) => {
  try {
    webuiPackageDir(name)
    return true
  } catch {
    return false
  }
})

export const WEBUI_SKIP_REASON =
  'webui components not installed — run `bin/install --lang js --component all` in lagrange-framework'

/**
 * One installed component, reached the way everything else reaches one.
 *
 * WHY A HELPER AND NOT A BARE SPECIFIER. A specifier written out in a test is a
 * reference to a component composed by hand, and AC-960 is that the scope those
 * references are made under is written in exactly ONE place — the declaration in
 * `tools/generate/src/cli/webui.ts`. `sharedModuleUrl` composes it from there, so
 * a rebrand upstream moves every one of these with a single edit and a suite that
 * missed the rename fails at resolution rather than mounting a stale copy.
 *
 * It is the SAME module the suites that import by bare specifier receive: the
 * Vitest alias derived in `vitest.node.config.mts` rewrites that specifier to
 * this very path, so both routes land on one module id and a module-global seam
 * — `setParser`, `setSanitizer` — is shared across them rather than installed on
 * a second instance nothing else can see.
 */
export async function importWebui(name: string, subpath = '.'): Promise<Record<string, unknown>> {
  return (await import(/* @vite-ignore */ sharedModuleUrl(name, subpath))) as Record<
    string,
    unknown
  >
}
