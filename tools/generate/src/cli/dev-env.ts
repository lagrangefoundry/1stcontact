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
