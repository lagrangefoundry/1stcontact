/**
 * Tiny argv parser for the `1c` CLI. Supports boolean flags, valued flags, and
 * positionals — enough for the command surface without a dependency.
 */

export interface ParsedArgs {
  positionals: string[]
  flags: Record<string, string | boolean>
}

const BOOLEAN_FLAGS = new Set(['sandbox', 'force'])
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
