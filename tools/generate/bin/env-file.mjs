#!/usr/bin/env node
/**
 * `env-file.mjs` — the ONE reader of a dotenv secrets file ([[REQ-393]]).
 *
 * TWO CALLERS, ONE PARSER. The dev servers' layering (`dev-env.ts`) and the
 * release scripts' `--secrets-file` (`bin/deploy`, `bin/build`) both read
 * `~/Documents/secrets/1c.dev.env`. Two parsers would be two answers to what
 * that file means, so the parser lives here — plain JS, because the release
 * scripts run it straight from bash with no transform available — and
 * `dev-env.ts` imports it.
 *
 * AS A COMMAND it loads a file into the environment of ONE child process and
 * nothing else:
 *
 *   node env-file.mjs exec <who> <path> -- <cmd> [args...]
 *
 * WHY EXEC AND NOT "PRINT EXPORTS FOR BASH TO EVAL". A value then never leaves
 * the environment: it is not written to a pipe, not quoted for a shell, not
 * re-parsed by one. The child inherits it the way it inherits PATH.
 *
 * A NON-EMPTY VALUE ALREADY IN THE ENVIRONMENT WINS, so a one-off override on
 * the command line still beats the file. Empty counts as unset, matching `:-`
 * and the hooks' own `-n` test.
 *
 * It reports the file and the NAMES it took. Never a value.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { constants } from 'node:os'
import { pathToFileURL } from 'node:url'

/**
 * `KEY=value`, and A DELIBERATELY SMALL PARSER rather than a dependency.
 * Optional surrounding quotes, `#` comments, blank lines and an optional
 * `export ` — which is every line any of these files has ever held, and is the
 * subset dotenv and wrangler agree on. Anything richer would be a second
 * interpretation of a file the Worker reads through somebody else's parser.
 *
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function parseEnvText(text) {
  /** @type {Record<string, string>} */
  const vars = {}
  for (const line of text.split('\n')) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    const value = match[2].trim().replace(/\s+#.*$/, '').trim()
    vars[match[1]] = /^(['"])(.*)\1$/.test(value) ? value.slice(1, -1) : value
  }
  return vars
}

/**
 * Overlay a file's vars under an environment: the environment's non-empty
 * values win. Returns the merged environment and which names came from where.
 *
 * @param {Record<string, string>} fileVars
 * @param {NodeJS.ProcessEnv} env
 */
export function overlayEnv(fileVars, env) {
  const merged = { ...env }
  /** @type {string[]} */ const taken = []
  /** @type {string[]} */ const kept = []
  for (const [name, value] of Object.entries(fileVars)) {
    if ((env[name] ?? '') !== '') kept.push(name)
    else {
      merged[name] = value
      taken.push(name)
    }
  }
  return { merged, taken, kept }
}

/** @param {string[]} argv */
function main(argv) {
  const [verb, who, file, sep, ...cmd] = argv
  if (verb !== 'exec' || !who || !file || sep !== '--' || cmd.length === 0) {
    console.error('usage: env-file.mjs exec <who> <path> -- <cmd> [args...]')
    return 2
  }
  // BEFORE ANYTHING RUNS, naming the path: a deploy that silently carried on
  // without its credentials is the failure this flag exists to remove.
  if (!existsSync(file)) {
    console.error(`${who}: --secrets-file ${file} does not exist — nothing was run.`)
    return 1
  }
  const vars = parseEnvText(readFileSync(file, 'utf8'))
  if (Object.keys(vars).length === 0) {
    console.error(`${who}: --secrets-file ${file} holds no KEY=value assignment — nothing was run.`)
    return 1
  }
  const { merged, taken, kept } = overlayEnv(vars, process.env)
  console.log(`secrets file: ${file}`)
  console.log(`  took:  ${taken.length ? taken.join(', ') : '(none)'}`)
  if (kept.length) console.log(`  kept from your environment: ${kept.join(', ')}`)

  const r = spawnSync(cmd[0], cmd.slice(1), { stdio: 'inherit', env: merged })
  if (r.error) {
    console.error(`${who}: could not run ${cmd[0]}: ${r.error.message}`)
    return 1
  }
  // A child killed by a signal has no status; report it the way a shell would.
  return r.status ?? 128 + (constants.signals[r.signal] ?? 0)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(main(process.argv.slice(2)))
}
