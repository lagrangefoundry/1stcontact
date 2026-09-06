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
import { sharedModuleUrl, WEBUI_PACKAGES, WEBUI_SCOPE, webuiPackageDir } from './webui'

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

// ── the seam check: present is not the same as compatible ────────────────────

/**
 * BUG-55 — whether the installed component still takes the shape we call it with.
 *
 * PRESENCE WAS NEVER THE WHOLE QUESTION. Everything above answers "is the
 * component there", and a store can pass that check completely while holding a
 * component whose signature moved underneath us. That is not hypothetical: it is
 * how BUG-55 happened. Upstream REQ-112 made the index seam take a MAP of
 * indexes by source name where it had taken one index, this repository went on
 * passing the singular form, and nothing anywhere noticed — not `pnpm install`,
 * which cannot see a store no lockfile records, and not the preflight, which
 * asked only whether the directory resolved.
 *
 * WHY `indexFor` AND NOT A BROADER PROBE. It is the one function the whole read
 * half funnels through — `search`, `searchChunks` and the runtime's document
 * snapshot all resolve their artifact through it — and it is pure: a map, a KB,
 * no filesystem, no network, no embedder. So the check costs a function call and
 * still fails for every caller that would have failed.
 *
 * WHAT IT DELIBERATELY DOES NOT COVER. One seam, checked positively. It says
 * nothing about the other seams this repository shares with the store, and a
 * green result here is not a statement that the store and the repository agree
 * everywhere — only that they agree about this. A check that implied more than
 * it tested would be worse than none, because the reason BUG-55 ran for days is
 * precisely that a passing signal was read as a broader assurance than it was.
 */
export interface SeamReport {
  ok: boolean
  /** The failure in the component's own words, when it refused. */
  detail?: string
}

/** The seam probe, injectable so a UAT can drive the incompatible case. */
export type IndexSeamProbe = () => Promise<unknown>

/**
 * Ask the installed component to resolve a KB against a map keyed by its source.
 *
 * Positive rather than negative: it performs the resolution this repository
 * depends on and treats any refusal as disagreement. A component on the old
 * signature has no `indexFor` at all, and one on a third signature refuses the
 * map — both land here as the same finding, which is right, because the operator
 * does the same thing about either.
 */
export async function checkIndexSeam(opts?: { probe?: IndexSeamProbe }): Promise<SeamReport> {
  const probe =
    opts?.probe ??
    (async () => {
      const { indexFor } = await import(/* @vite-ignore */ sharedModuleUrl('knowledge'))
      if (typeof indexFor !== 'function') {
        throw new Error('the knowledge component exports no `indexFor`')
      }
      // A stand-in index — `indexFor` selects, it does not read, so nothing here
      // has to be a real artifact for the resolution to be the real one.
      const sentinel = {}
      const resolved = indexFor({ name: 'probe', source: 'probe' }, { probe: sentinel })
      if (resolved !== sentinel) {
        throw new Error('`indexFor` did not return the index named by the KB\'s source')
      }
      return resolved
    })

  try {
    await probe()
    return { ok: true }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Refuse the build when the store and this repository disagree about the seam.
 *
 * `ENVIRONMENT` like its neighbour, and for the same reason: the command and its
 * input were both fine. What is wrong is the machine, and no re-forming of the
 * request will help.
 */
export async function assertIndexSeam(opts?: { probe?: IndexSeamProbe }): Promise<void> {
  const report = await checkIndexSeam(opts)
  if (report.ok) return

  throw new CommandError({
    code: 'ENVIRONMENT',
    message:
      'The installed knowledge component does not take the index seam this repo ' +
      `calls it with:\n  - ${report.detail}\n` +
      'One index per SOURCE (upstream REQ-112): `search`, `searchChunks` and ' +
      '`KnowledgeRuntime.open` take `indexes`/`chunkIndexes` — a map from source ' +
      'name to index — rather than a single `source`. The store is delivered out ' +
      'of band, so a lockfile cannot notice it moving.',
    hint:
      `Run \`${SHARED_STORE_INSTALL_COMMAND}\` to bring the store up to date. If it ` +
      'is already current, the component has moved again and the call sites in ' +
      '`kb.ts`, `session-knowledge.ts`, `system-knowledge.ts` and `knowledge.ts` ' +
      'are what need changing.',
  })
}
