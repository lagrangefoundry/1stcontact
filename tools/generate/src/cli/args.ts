/**
 * Tiny argv parser for the `1c` CLI. Supports boolean flags, valued flags, and
 * positionals — enough for the command surface without a dependency.
 */

export interface ParsedArgs {
  positionals: string[]
  flags: Record<string, string | boolean>
}

/**
 * Every flag the CLI reads as a boolean toggle, across the whole verb set.
 *
 * A name absent from here is parsed as value-taking, so it consumes the next
 * non-`--` token — which for these commands is the `<slug>` positional, and the
 * command then dies with `Missing required <slug>`. That is the exact fault
 * REQ-58 fixed for `--multi-viewport`; the guarantee is CLI-wide, so the set is
 * pinned entire in evidence. Adding a boolean flag to a command without adding
 * it here is a visible regression rather than a silent reopening of the hole.
 */
export const BOOLEAN_FLAGS: ReadonlySet<string> = new Set([
  'sandbox',
  'force',
  'json',
  'tolerant',
  'compare-years',
  'multi-viewport',
  'classify',
  'collapse',
  'clusters',
  'edit',
  'dry-run',
  'prune',
  'apply',
])
const ALIASES: Record<string, string> = { m: 'message' }

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = []
  const flags: Record<string, string | boolean> = {}

  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i]
    if (tok.startsWith('--') || (tok.startsWith('-') && tok.length === 2 && !/^-\d/.test(tok))) {
      const raw = tok.replace(/^--?/, '')
      const name = ALIASES[raw] ?? raw
      if (BOOLEAN_FLAGS.has(name)) {
        flags[name] = true
      } else {
        const next = argv[i + 1]
        if (next === undefined || next.startsWith('--')) {
          flags[name] = true
        } else {
          flags[name] = next
          i++
        }
      }
    } else {
      positionals.push(tok)
    }
  }

  return { positionals, flags }
}
