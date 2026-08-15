/**
 * REQ-144 — the shared-store preflight.
 *
 * {@link ./preflight} answers "is this tree installed at its lockfile?" for the
 * packages `tools/generate/package.json` declares. This answers the other half:
 * are the **shared artifact store's** components present? They are a different
 * kind of dependency and fail a different way.
 *
 * WHY IT NEEDS ITS OWN CHECK, AND WHY AT BUILD TIME. The store is populated out
 * of band by `lagrange-framework`'s `bin/install`; nothing in `package.json`
 * records it, so `pnpm install` cannot supply it and the lockfile cannot notice
 * it missing. Worse, absence is not loud where it bites: the builder composes a
 * browser IMPORT MAP from these components, so a missing one yields a document
 * that loads, renders chrome, and then fails at the first `import` — in the
 * browser, at request time, with the operator's site on screen. A build that
 * emitted that map has shipped a broken artifact and reported success.
 *
 * So the rule this module encodes is: **fail at build time, naming the
 * component and the command that installs it**, rather than let a broken import
 * map reach a browser.
 *
 * Resolution goes through {@link webuiPackageDir} — the single resolution point
 * — and never re-derives the scope or a layout. A component that resolves here
 * is a component the import map can name.
 */
import { CommandError } from './errors'
import { WEBUI_PACKAGES, WEBUI_SCOPE, webuiPackageDir } from './webui'

/**
 * Shared-store components loaded SERVER-side, by name.
 *
 * Kept beside {@link WEBUI_PACKAGES} rather than merged into it because the two
 * fail differently and the report says which: a missing browser component is a
 * broken import map, a missing server component is a CLI verb that dies on its
 * dynamic `import()`. Composed from the call sites in `ai/host.ts` and `kb.ts`.
 */
export const SHARED_SERVER_COMPONENTS = ['ai', 'ai-knowledge', 'knowledge', 'ticketing'] as const

/** Where a component is consumed — the half of the system its absence breaks. */
export type SharedComponentSurface = 'browser' | 'server'

export interface MissingSharedComponent {
  component: string
  surface: SharedComponentSurface
}

export interface SharedStoreReport {
  ok: boolean
  missing: MissingSharedComponent[]
  /** Every component checked, in the order checked. */
  checked: readonly MissingSharedComponent[]
}

/**
 * Resolve a component to its installed directory, or return undefined.
 * Injectable so a UAT can exercise the missing case without uninstalling.
 */
export type ComponentResolver = (component: string) => string | undefined

function defaultResolver(component: string): string | undefined {
  try {
    return webuiPackageDir(component)
  } catch {
    return undefined
  }
}

/** Every component the deployable artifacts need, with the surface it serves. */
export function sharedComponents(): readonly MissingSharedComponent[] {
  return [
    ...WEBUI_PACKAGES.map((component) => ({ component, surface: 'browser' as const })),
    ...SHARED_SERVER_COMPONENTS.map((component) => ({ component, surface: 'server' as const })),
  ]
}

/** Probe the shared store. Read-only — one resolution per component. */
export function checkSharedStore(opts?: { resolve?: ComponentResolver }): SharedStoreReport {
  const resolve = opts?.resolve ?? defaultResolver
  const checked = sharedComponents()
  const missing = checked.filter(({ component }) => resolve(component) === undefined)
  return { ok: missing.length === 0, missing, checked }
}

/** The remedy, spelled once. `all` because a partial install is how this starts. */
export const SHARED_STORE_INSTALL_COMMAND =
  'cd ../lagrange-framework && bin/install --lang js --component all'

/**
 * Refuse the build on a missing component.
 *
 * A {@link CommandError} with `ENVIRONMENT`, so it exits 6 through the CLI's
 * existing failure contract — the same code the install preflight uses, and for
 * the same reason: the command and its input were both fine, and no way of
 * re-forming the request will help.
 */
export function assertSharedStore(opts?: { resolve?: ComponentResolver }): void {
  const report = checkSharedStore(opts)
  if (report.ok) return

  const lines = report.missing.map(
    ({ component, surface }) =>
      `  - ${WEBUI_SCOPE}/${component} (${surface}) does not resolve` +
      (surface === 'browser' ? ' — the browser import map would name a module nothing serves' : ''),
  )

  throw new CommandError({
    code: 'ENVIRONMENT',
    message:
      `The shared component store is incomplete — ${report.missing.length} of ` +
      `${report.checked.length} components are missing:\n${lines.join('\n')}\n` +
      'They are delivered out of band and are never vendored into this repo, so ' +
      '`pnpm install` cannot supply them.',
    hint: `Run \`${SHARED_STORE_INSTALL_COMMAND}\`, then retry.`,
  })
}
