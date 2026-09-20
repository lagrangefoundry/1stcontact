import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * THE env-file layering for `wrangler dev` on the control app (BUG-50).
 *
 * There are two ways to start that server — `1c builder` and `pnpm dev:control`
 * — and they used to compose their own argv. `1c builder` passed no
 * `--env-file` at all, so the key an operator had already put where the
 * documentation said was never loaded: the builder came up, served, and
 * truthfully reported having no assistant.
 *
 * WHY A `--env-file` IS NEEDED AT ALL, given that wrangler reads `.dev.vars` by
 * itself. Because the key does not live in `.dev.vars` and must not: that file
 * is per-clone local-dev config, while the key is personal and arrives from
 * outside the repository. Layering the two is the only way to have both, and
 * `--env-file` REPLACES the default `.dev.vars` lookup rather than adding to it
 * (wrangler's `getVarsForDev` guards that read with `if (!envFiles?.length)`),
 * so naming the second file forces you to name the first as well. That coupling
 * is the whole reason this is one function: half of it is not a smaller version
 * of it, it is a different and broken thing.
 *
 * ORDER IS LOAD ORDER. Wrangler parses these with `override: true`, so the last
 * file wins — the secrets file supplies `ANTHROPIC_API_KEY` and `.dev.vars`
 * supplies the rest.
 */

/** `wrangler dev` resolves a relative `--env-file` against the CONFIG dir. */
const DEV_VARS_ARG = '.dev.vars'

/** Where a personal key lives when the operator has not said otherwise. */
const DEFAULT_SECRETS_REL = ['Documents', 'secrets', '1c.dev.env']

/** The override, named after the product rather than the tool that reads it. */
const SECRETS_ENV_VAR = 'ONECONTACT_SECRETS'

/** One file in the layering, and what its absence costs. */
export interface DevEnvFile {
  /** Passed to `--env-file` verbatim, exactly as the package script passed it. */
  readonly arg: string
  /** Resolved the way wrangler resolves it, for the existence check only. */
  readonly resolved: string
  readonly present: boolean
  /** What stops working when this file is missing. */
  readonly consequence: string
}

export interface DevEnvLayering {
  readonly files: readonly DevEnvFile[]
  /** `['--env-file', '.dev.vars', '--env-file', '<secrets>']`, ready to spread. */
  readonly args: readonly string[]
  /** One line per absent file: the path looked for, and what will not work. */
  readonly warnings: readonly string[]
}

/**
 * Compose the flags, and say what is missing rather than failing.
 *
 * A MISSING FILE IS NOT AN ERROR, and it is not silently dropped from the argv
 * either. Wrangler tolerates a named `--env-file` that does not exist — `ENOENT`
 * goes to its debug log and loading continues — so both flags are passed
 * unconditionally and {@link DevEnvLayering.warnings} exists purely to say so.
 * That matches what the Worker itself does with a missing key: it opens, serves,
 * and explains ([[REQ-173]]). What this removes is the *unstated* version, where
 * an operator infers a wrapper's argv from a chat panel that will not answer.
 *
 * `env.HOME` rather than {@link os.homedir} FIRST, because the package script
 * this replaces expanded `$HOME` through a shell and the two can disagree —
 * and because a test can then pin the default path without pinning the machine.
 */
export function devEnvLayering(opts: {
  /** The directory holding `wrangler.toml`; relative args resolve against it. */
  appDir: string
  env?: NodeJS.ProcessEnv
  exists?: (p: string) => boolean
}): DevEnvLayering {
  const env = opts.env ?? process.env
  const exists = opts.exists ?? ((p: string) => fs.existsSync(p))

  // `:-` in the script it replaces, so an EMPTY override falls back too: an
  // exported-but-blank variable is a variable someone meant to set.
  const home = env.HOME || os.homedir()
  const secretsArg = env[SECRETS_ENV_VAR] || path.join(home, ...DEFAULT_SECRETS_REL)

  const files: DevEnvFile[] = [
    {
      arg: DEV_VARS_ARG,
      resolved: path.resolve(opts.appDir, DEV_VARS_ARG),
      present: exists(path.resolve(opts.appDir, DEV_VARS_ARG)),
      // Not a hypothetical. `isUnconfiguredLocalDev` needs BOTH Access vars
      // empty and `wrangler.toml [vars]` fills both in, so without this file the
      // gate runs against a loopback request that carries no token and the
      // builder is unreachable — presenting as an Access misconfiguration rather
      // than as a missing file.
      consequence:
        'Cloudflare Access will not be open on loopback, so the builder will refuse every request.',
    },
    {
      arg: secretsArg,
      resolved: path.resolve(opts.appDir, secretsArg),
      present: exists(path.resolve(opts.appDir, secretsArg)),
      consequence:
        'the assistant cannot take a turn, and uploads will be refused.',
    },
  ]

  return {
    files,
    args: files.flatMap((f) => ['--env-file', f.arg]),
    // The RESOLVED path, not the argument: `.dev.vars` on its own tells an
    // operator nothing about which directory was searched, and that is the
    // question a missing file actually raises.
    warnings: files
      .filter((f) => !f.present)
      .map((f) => `  no ${f.arg} at ${f.resolved} — ${f.consequence}`),
  }
}

/** The `.dev.vars` this layering names, resolved. The one place that path is built. */
export function devVarsPath(appDir: string): string {
  return path.resolve(appDir, DEV_VARS_ARG)
}

/**
 * Read the layering the way wrangler reads it.
 *
 * WHY THE CLI NEEDS THIS AT ALL ([[BUG-124]]). The filing address used to be a
 * LAUNCH ARTEFACT — minted per run and pushed at wrangler as `--var` — so the
 * only process that could know it was the one that had just minted it. Now it is
 * a SETTING, which means the CLI and the Worker read the same value from the same
 * files, and the CLI has to be able to read them.
 *
 * ORDER IS {@link devEnvLayering}'S ORDER, and later wins, because that is what
 * wrangler does with `override: true`. Reading them in a different order here
 * would give the CLI a different answer from the Worker's about the very value
 * whose whole point is that both see the same one.
 *
 * A DELIBERATELY SMALL PARSER rather than a dependency. `KEY=value`, optional
 * surrounding quotes, `#` comments and blank lines — which is every line any of
 * these files has ever held, and is the subset dotenv and wrangler agree on.
 * Anything richer would be a second interpretation of a file the Worker reads
 * through somebody else's parser.
 */
export function readDevEnv(opts: {
  appDir: string
  env?: NodeJS.ProcessEnv
  exists?: (p: string) => boolean
  read?: (p: string) => string
}): Record<string, string> {
  const read = opts.read ?? ((p: string) => fs.readFileSync(p, 'utf8'))
  const layering = devEnvLayering(opts)
  const vars: Record<string, string> = {}
  for (const file of layering.files) {
    if (!file.present) continue
    let text: string
    try {
      text = read(file.resolved)
    } catch {
      // A FILE THAT VANISHED BETWEEN THE CHECK AND THE READ is the same fact as
      // one that was never there, and this function's callers all treat absence
      // as ordinary. Throwing here would turn a race into an operator's problem.
      continue
    }
    for (const line of text.split('\n')) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
      if (!match) continue
      const value = match[2].trim().replace(/\s+#.*$/, '').trim()
      vars[match[1]] = /^(['"])(.*)\1$/.test(value) ? value.slice(1, -1) : value
    }
  }
  return vars
}

/**
 * The whole `wrangler dev` command line for the control app.
 *
 * ONE FUNCTION RATHER THAN A LIST ASSEMBLED AT THE CALL SITE ([[BUG-124]]),
 * because the question this ticket exists to answer — *does how you launched the
 * dev server change what the Worker can do?* — is a question about this argv, and
 * a UAT can only ask it of something it can call. The answer it now gets is no:
 * nothing here carries a `--var`, so every var the Worker sees comes from the
 * files, which a bare `wrangler dev` reads too.
 */
export function wranglerDevArgs(opts: {
  appDir: string
  port: string
  remote?: boolean
  env?: NodeJS.ProcessEnv
  exists?: (p: string) => boolean
}): string[] {
  const layering = devEnvLayering(opts)
  return [
    'wrangler',
    'dev',
    '--port',
    opts.port,
    ...layering.args,
    // `--remote` edits the DEPLOYED database from a laptop. Local is the default
    // because a dev loop that writes to production by default is one keystroke
    // from losing a site.
    ...(opts.remote === true ? ['--remote'] : []),
  ]
}
