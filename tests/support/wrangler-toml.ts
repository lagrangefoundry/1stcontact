/**
 * REQ-144 — enough of a TOML reader to answer one question about a
 * `wrangler.toml`: **is everything declared at the top level also declared under
 * each named environment?**
 *
 * WHY A READER AND NOT A DEPENDENCY. The workspace has no TOML parser, and this
 * needs exactly two facts — which section a line is in, and which keys that
 * section declares. A full parser would be more code to trust for no more
 * answer. What it deliberately does NOT do is evaluate values: a value is only
 * ever read as the string a `binding = "NAME"` line assigns, which is the one
 * place a value participates in the identity of a declaration.
 *
 * WHY THE QUESTION MATTERS. Wrangler does not inherit `vars` or bindings into a
 * named environment. It warns, but a warning is not an error and a warning
 * scrolled past is a Worker deployed with no configuration at all — which is
 * exactly how `app.1stcontact.io` came to answer 503 to every request. It is
 * the second time inheritance has bitten this repo (public-site's R2 binding
 * carries a comment about the first), so the rule stops being folklore here.
 */
import { readFileSync } from 'node:fs'

export interface Declarations {
  /** Keys declared under `[vars]` / `[env.<name>.vars]`. */
  vars: string[]
  /**
   * Bindings, as `<table>:<binding name>` — e.g. `r2_buckets:SITES`.
   *
   * A binding is identified STRUCTURALLY: any table that assigns `binding`.
   * Deliberately not a list of known table names, which would silently stop
   * covering the first binding kind nobody remembered to add to it.
   */
  bindings: string[]
}

export interface WranglerConfig {
  topLevel: Declarations
  /** Declarations per named environment, keyed by environment name. */
  envs: Record<string, Declarations>
}

interface Section {
  /** Dotted path, e.g. `vars`, `env.production.vars`, `r2_buckets`. */
  path: string
  keys: Map<string, string>
}

/** Split a `wrangler.toml` into its sections, in order. */
function sections(toml: string): Section[] {
  const out: Section[] = []
  let current: Section = { path: '', keys: new Map() }
  out.push(current)

  for (const rawLine of toml.split('\n')) {
    const line = rawLine.replace(/(^|\s)#.*$/, '').trim()
    if (line === '') continue

    const header = /^\[\[?([^\]]+)\]\]?$/.exec(line)
    if (header) {
      current = { path: header[1].trim(), keys: new Map() }
      out.push(current)
      continue
    }

    const assignment = /^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/.exec(line)
    if (assignment) {
      const value = assignment[2].trim().replace(/^"(.*)"$/, '$1')
      current.keys.set(assignment[1], value)
    }
  }
  return out
}

export function parseWranglerConfig(toml: string): WranglerConfig {
  const empty = (): Declarations => ({ vars: [], bindings: [] })
  const config: WranglerConfig = { topLevel: empty(), envs: {} }

  const bucketFor = (envName: string | null): Declarations => {
    if (envName === null) return config.topLevel
    config.envs[envName] ??= empty()
    return config.envs[envName]
  }

  for (const section of sections(toml)) {
    const envMatch = /^env\.([^.]+)(?:\.(.+))?$/.exec(section.path)
    const envName = envMatch ? envMatch[1] : null
    // `env.production` itself carries no declarations we check — `name` and
    // `routes` are environment-specific by nature and inherit nothing.
    const table = envMatch ? (envMatch[2] ?? '') : section.path
    const bucket = bucketFor(envName)

    if (table === 'vars') {
      bucket.vars.push(...section.keys.keys())
      continue
    }
    const binding = section.keys.get('binding')
    if (table !== '' && binding !== undefined) {
      bucket.bindings.push(`${table}:${binding}`)
    }
  }

  // Environments named only by a bare `[env.<name>]` still have to be reported,
  // or a Worker that inherits nothing would pass by having declared nothing.
  for (const section of sections(toml)) {
    const envMatch = /^env\.([^.]+)/.exec(section.path)
    if (envMatch) bucketFor(envMatch[1])
  }

  return config
}

export function readWranglerConfig(file: string): WranglerConfig {
  return parseWranglerConfig(readFileSync(file, 'utf8'))
}

/**
 * The single variable exempt from the repeat rule, named here rather than left
 * as a gap in the report.
 *
 * `ACCESS_DEV_OPEN` exists to relax the Access gate for a `wrangler dev` server
 * on loopback, which no Access policy fronts. Its ABSENCE from a named
 * environment is precisely what keeps the relaxation out of a deployed Worker
 * (apps/control-app/wrangler.toml records the same reasoning beside the
 * declaration itself), so demanding its repetition would invert the rule this
 * function exists to enforce.
 *
 * ONE VARIABLE WIDE, deliberately. A second top-level variable added later is
 * still required to be repeated and is still reported by name; the exception is
 * a named constant rather than a predicate over the name so that widening it is
 * an edit somebody has to make on purpose.
 */
export const DEV_ONLY_VAR = 'ACCESS_DEV_OPEN'

/** What `env` fails to repeat from the top level. Empty means it inherits nothing it needs. */
export function missingFromEnv(
  config: WranglerConfig,
  envName: string,
): { vars: string[]; bindings: string[] } {
  const env = config.envs[envName] ?? { vars: [], bindings: [] }
  return {
    vars: config.topLevel.vars.filter((v) => v !== DEV_ONLY_VAR && !env.vars.includes(v)),
    bindings: config.topLevel.bindings.filter((b) => !env.bindings.includes(b)),
  }
}
