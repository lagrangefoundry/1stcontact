#!/usr/bin/env node
/**
 * `env-file.mjs` — the ONE reader of the operator's secrets file ([[REQ-393]]).
 *
 * TWO CALLERS, ONE PARSER, ONE DEFAULT. The dev servers' layering
 * (`dev-env.ts`) and the release and copy scripts (`bin/deploy`, `bin/build`,
 * `bin/copy-to-cloud`, `bin/copy-from-cloud`) all read the same file —
 * `$ONECONTACT_SECRETS`, else `~/Documents/secrets/1c.dev.env`. Two parsers, or
 * two spellings of that default, would be two answers to what the file means,
 * so both live here — plain JS, because the scripts run it straight from bash
 * with no transform available — and `dev-env.ts` imports them.
 *
 * AS A COMMAND it is the scripts' preamble:
 *
 *   node env-file.mjs run <who> -- <script> [args...]
 *
 * It takes `--secrets-file PATH` and `--no-secrets-file` OUT of `args`, loads
 * the file they select into the environment, and re-runs `<script>` with what
 * is left and {@link LOADED_MARKER} set, so the script never sees either flag
 * and does not load twice. One implementation of the flags rather than four
 * bash parsers, each free to drift.
 *
 *   --secrets-file PATH   load PATH; a missing or empty file fails, naming it,
 *                         before the script runs at all
 *   (neither)             load the DEFAULT file when it exists; absent is fine
 *   --no-secrets-file     load nothing
 *   -h / --help           load nothing — help must not depend on a credential
 *
 * WHY RE-RUN AND NOT "PRINT EXPORTS FOR BASH TO EVAL". A value then never leaves
 * the environment: not written to a pipe, not quoted for a shell, not re-parsed
 * by one. The script inherits it the way it inherits PATH.
 *
 * A NON-EMPTY VALUE ALREADY IN THE ENVIRONMENT WINS, so a one-off override on
 * the command line still beats the file. Empty counts as unset, matching `:-`
 * and the hooks' own `-n` test.
 *
 * THE REPORT GOES TO STDERR — the file and the NAMES taken, never a value —
 * so a `--json` command's single document on stdout is untouched.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { constants, homedir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** The override, named after the product rather than the tool that reads it. */
export const SECRETS_ENV_VAR = 'ONECONTACT_SECRETS'

/** Where the operator's secrets live when they have not said otherwise. */
export const DEFAULT_SECRETS_REL = ['Documents', 'secrets', '1c.dev.env']

/** Set on the re-run, to the script's name, so it does not load a second time. */
export const LOADED_MARKER = 'ONECONTACT_SECRETS_LOADED_BY'

/**
 * The default secrets file. `:-` semantics, so an EMPTY override falls back
 * too: an exported-but-blank variable is a variable someone meant to set.
 * `env.HOME` before {@link homedir} because a shell's `$HOME` is what the
 * package scripts this replaced expanded, and a test can pin it.
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {string}
 */
export function defaultSecretsPath(env) {
  return env[SECRETS_ENV_VAR] || path.join(env.HOME || homedir(), ...DEFAULT_SECRETS_REL)
}

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

/**
 * Take the two flags out of a script's arguments.
 *
 * @param {string[]} args
 * @returns {{ mode: 'default' | 'explicit' | 'none', file?: string, rest: string[], help: boolean }}
 */
export function takeSecretsFlags(args) {
  /** @type {'default' | 'explicit' | 'none'} */
  let mode = 'default'
  /** @type {string | undefined} */
  let file
  const rest = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--no-secrets-file') mode = 'none'
    else if (arg === '--secrets-file') {
      file = args[++i] ?? ''
      mode = 'explicit'
    } else if (arg.startsWith('--secrets-file=')) {
      file = arg.slice('--secrets-file='.length)
      mode = 'explicit'
    } else rest.push(arg)
  }
  return { mode, file, rest, help: rest.includes('-h') || rest.includes('--help') }
}

/** @param {string[]} argv */
function main(argv) {
  const [verb, who, sep, script, ...args] = argv
  if (verb !== 'run' || !who || sep !== '--' || !script) {
    console.error('usage: env-file.mjs run <who> -- <script> [args...]')
    return 2
  }
  const { mode, file: named, rest, help } = takeSecretsFlags(args)
  let env = { ...process.env, [LOADED_MARKER]: who }

  if (mode === 'explicit' && !named) {
    console.error(`${who}: --secrets-file needs a path`)
    return 1
  }
  if (!help && mode !== 'none') {
    // Relative to where the operator typed it — this runs before any `cd`.
    const file = mode === 'explicit' ? path.resolve(String(named)) : defaultSecretsPath(process.env)
    const present = existsSync(file)
    // BEFORE ANYTHING RUNS, naming the path: a run that silently carried on
    // without the credentials it was told to use is the failure this exists to
    // remove. The DEFAULT file is different — absent is an ordinary state on a
    // machine that keeps its credentials elsewhere.
    if (!present && mode === 'explicit') {
      console.error(`${who}: --secrets-file ${file} does not exist — nothing was run.`)
      return 1
    }
    if (present) {
      const vars = parseEnvText(readFileSync(file, 'utf8'))
      if (Object.keys(vars).length === 0 && mode === 'explicit') {
        console.error(`${who}: --secrets-file ${file} holds no KEY=value assignment — nothing was run.`)
        return 1
      }
      const { merged, taken, kept } = overlayEnv(vars, env)
      env = merged
      console.error(`secrets file: ${file}${mode === 'default' ? ' (default; --no-secrets-file to skip)' : ''}`)
      console.error(`  took:  ${taken.length ? taken.join(', ') : '(none)'}`)
      if (kept.length) console.error(`  kept from your environment: ${kept.join(', ')}`)
    }
  }

  const r = spawnSync('bash', [script, ...rest], { stdio: 'inherit', env })
  if (r.error) {
    console.error(`${who}: could not run ${script}: ${r.error.message}`)
    return 1
  }
  // A child killed by a signal has no status; report it the way a shell would.
  return r.status ?? 128 + (constants.signals[r.signal] ?? 0)
}

// Compared as REAL paths: node resolves symlinks for `import.meta.url` and not
// for `argv[1]`, so under a symlinked directory (macOS `/tmp`) a plain string
// compare is false and the command silently does nothing and exits 0.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exit(main(process.argv.slice(2)))
}
