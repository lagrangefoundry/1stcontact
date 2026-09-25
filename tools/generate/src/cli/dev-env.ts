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
 * AND IT IS WHY A THIRD FILE HAD TO BE NAMED HERE TOO ([[BUG-146]]).
 * `bin/access-sim` has always told the operator to write `.dev.vars.local`, and
 * before BUG-50 made this argv explicit wrangler's own `.dev.vars*` lookup would
 * have found it. Afterwards nothing did, so the one documented way to LEAVE
 * dev-open mode — repointing `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` at the
 * simulator, which is exactly what makes `isUnconfiguredLocalDev` false — could
 * not take effect, and a minted token was verified against nothing. The symptom
 * was an anonymous builder, which is also what dev-open correctly looks like, so
 * there was nothing to see. A file the documentation names and no launcher reads
 * is the defect; naming it here is the whole fix.
 *
 * ORDER IS LOAD ORDER. Wrangler parses these with `override: true`, so the last
 * file wins — `.dev.vars` supplies the per-clone base, the secrets file supplies
 * `ANTHROPIC_API_KEY`, and `.dev.vars.local` is LAST because it is the operator's
 * own override of both. That direction matters: while BUG-146 was unfixed the
 * workaround was to append the simulator's vars to the secrets file, and putting
 * the local file last is what makes the supported recipe beat a leftover
 * workaround rather than lose to it.
 */

/** `wrangler dev` resolves a relative `--env-file` against the CONFIG dir. */
const DEV_VARS_ARG = '.dev.vars'

/**
 * The operator's own override, beside `.dev.vars` and gitignored with it.
 *
 * BESIDE THE FILE IT OVERRIDES, and not at the repository root where the
 * pre-BUG-146 recipe put it. `--env-file` resolves a relative argument against
 * the config directory, so a sibling needs no `../../`, and one location is the
 * point: the machine this was diagnosed on had a populated copy at the root and
 * an empty one here, which is precisely the ambiguity that cost the diagnosis.
 */
const DEV_VARS_LOCAL_ARG = '.dev.vars.local'

/** Where a personal key lives when the operator has not said otherwise. */
const DEFAULT_SECRETS_REL = ['Documents', 'secrets', '1c.dev.env']

/** The override, named after the product rather than the tool that reads it. */
const SECRETS_ENV_VAR = 'ONECONTACT_SECRETS'

/**
 * The two vars whose emptiness IS dev-open mode, and which `.dev.vars.local` is
 * written to fill. `isUnconfiguredLocalDev` needs BOTH empty; either one alone
 * switches the real gate on.
 */
const ACCESS_VARS = ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD'] as const

/**
 * The host every dev URL this repository PRINTS must name ([[BUG-146]]).
 *
 * NOT A STYLE CHOICE. `CF_Authorization` is scoped by HOST and ignores the port,
 * so the cookie `bin/access-sim` sets on `127.0.0.1:8799` is sent to a builder on
 * `127.0.0.1:8788` and is NOT sent to `localhost:8788` — a different cookie host.
 * access-sim takes care to name the host the operator will browse; a banner that
 * names the other one logs them straight back out, for a third reason and with
 * nothing on screen to connect it to the first two.
 *
 * It lives beside the layering because it is the same class of fact: how the dev
 * server is launched, and what an operator is told about the result.
 */
export const DEV_HOST = '127.0.0.1'

/** The origin a dev server on `port` is reachable at. The one place that is built. */
export function devUrl(port: number | string): string {
  return `http://${DEV_HOST}:${port}`
}

/** One file in the layering, and what its absence costs. */
export interface DevEnvFile {
  /** Passed to `--env-file` verbatim, exactly as the package script passed it. */
  readonly arg: string
  /** Resolved the way wrangler resolves it, for the existence check only. */
  readonly resolved: string
  readonly present: boolean
  /**
   * Present, and holding no assignment at all — the 0-byte case ([[BUG-146]]).
   * Reported apart from absence because the two produced the identical symptom
   * and telling them apart is most of the diagnosis.
   */
  readonly empty: boolean
  /** {@link expects} keys this file does not set, or sets blank. */
  readonly missing: readonly string[]
  /** What this file is the home for. Empty when it is nobody's business but the operator's. */
  readonly expects: readonly string[]
  /** What it holds, parsed the way wrangler parses it. Empty when absent. */
  readonly vars: Readonly<Record<string, string>>
  /** What stops working when this file is missing. */
  readonly consequence: string
}

export interface DevEnvLayering {
  readonly files: readonly DevEnvFile[]
  /** `['--env-file', '.dev.vars', …]`, in load order, ready to spread. */
  readonly args: readonly string[]
  /** One line per absent, empty or incomplete file, and per incoherent result. */
  readonly warnings: readonly string[]
}

/**
 * `KEY=value`, and A DELIBERATELY SMALL PARSER rather than a dependency.
 * Optional surrounding quotes, `#` comments and blank lines — which is every
 * line any of these files has ever held, and is the subset dotenv and wrangler
 * agree on. Anything richer would be a second interpretation of a file the
 * Worker reads through somebody else's parser.
 */
function parseEnvText(text: string): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    const value = match[2].trim().replace(/\s+#.*$/, '').trim()
    vars[match[1]] = /^(['"])(.*)\1$/.test(value) ? value.slice(1, -1) : value
  }
  return vars
}

/**
 * Compose the flags, and say what is missing rather than failing.
 *
 * A MISSING FILE IS NOT AN ERROR, and it is not silently dropped from the argv
 * either. Wrangler tolerates a named `--env-file` that does not exist — `ENOENT`
 * goes to its debug log and loading continues — so every flag is passed
 * unconditionally and {@link DevEnvLayering.warnings} exists purely to say so.
 * That matches what the Worker itself does with a missing key: it opens, serves,
 * and explains ([[REQ-173]]). What this removes is the *unstated* version, where
 * an operator infers a wrapper's argv from a chat panel that will not answer.
 *
 * THREE SHAPES OF "NOT THERE", BECAUSE THEY WERE INDISTINGUISHABLE ([[BUG-146]]).
 * Absent, present-but-0-byte, and present-but-not-holding-the-vars-it-is-for all
 * left the Worker in exactly the state the operator was trying to leave, and the
 * warning said nothing about any of them. They are now three different lines.
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
  read?: (p: string) => string
}): DevEnvLayering {
  const env = opts.env ?? process.env
  const exists = opts.exists ?? ((p: string) => fs.existsSync(p))
  const read = opts.read ?? ((p: string) => fs.readFileSync(p, 'utf8'))

  // `:-` in the script it replaces, so an EMPTY override falls back too: an
  // exported-but-blank variable is a variable someone meant to set.
  const home = env.HOME || os.homedir()
  const secretsArg = env[SECRETS_ENV_VAR] || path.join(home, ...DEFAULT_SECRETS_REL)

  const describe = (arg: string, expects: readonly string[], consequence: string): DevEnvFile => {
    const resolved = path.resolve(opts.appDir, arg)
    const present = exists(resolved)
    let vars: Record<string, string> = {}
    if (present) {
      try {
        vars = parseEnvText(read(resolved))
      } catch {
        // A FILE THAT VANISHED BETWEEN THE CHECK AND THE READ is the same fact
        // as one that was never there, and every caller here treats absence as
        // ordinary. Throwing would turn a race into an operator's problem.
        vars = {}
      }
    }
    return {
      arg,
      resolved,
      present,
      empty: present && Object.keys(vars).length === 0,
      expects,
      missing: expects.filter((key) => (vars[key] ?? '') === ''),
      vars,
      consequence,
    }
  }

  const files: DevEnvFile[] = [
    describe(
      DEV_VARS_ARG,
      // NOTHING DECLARED, and deliberately: this file's job is to BLANK the two
      // Access vars, so listing them as the ones it must hold would warn about
      // the correct state. What it is for is everything else, which no single
      // key stands for.
      [],
      // Not a hypothetical. `isUnconfiguredLocalDev` needs BOTH Access vars
      // empty and `wrangler.toml [vars]` fills both in, so without this file the
      // gate runs against a loopback request that carries no token and the
      // builder is unreachable — presenting as an Access misconfiguration rather
      // than as a missing file.
      'Cloudflare Access will not be open on loopback, so the builder will refuse every request.',
    ),
    describe(
      secretsArg,
      // NOTHING DECLARED HERE EITHER, and for a different reason: this file is
      // outside the repository and is the operator's own. Naming the keys it
      // must hold would be this repository making a claim about a file it does
      // not own — and BUG-146's own finding is that Access configuration must
      // never be advised into it, so it gets no ACCESS_* expectation.
      [],
      'the assistant cannot take a turn, and uploads will be refused.',
    ),
    describe(
      DEV_VARS_LOCAL_ARG,
      ACCESS_VARS,
      // THE WHOLE OF WHAT THIS FILE IS FOR, said as the consequence rather than
      // as a description, because an operator reading a warning is asking what
      // they lost and not what the file is called.
      'access-sim cannot sign anyone in; the Worker is in dev-open mode ' +
        '(`./bin/access-sim --print-env >` that path).',
    ),
  ]

  const warnings: string[] = []
  for (const file of files) {
    // The RESOLVED path, not the argument: `.dev.vars` on its own tells an
    // operator nothing about which directory was searched, and that is the
    // question a missing file actually raises.
    if (!file.present) warnings.push(`  no ${file.arg} at ${file.resolved} — ${file.consequence}`)
    else if (file.empty) warnings.push(`  ${file.arg} at ${file.resolved} is EMPTY — ${file.consequence}`)
    else if (file.missing.length)
      warnings.push(
        `  ${file.arg} at ${file.resolved} sets no ${file.missing.join(', ')} — ${file.consequence}`,
      )
  }

  /**
   * AND THE ONE STATE THAT IS WORSE THAN DEV-OPEN ([[BUG-146]]).
   *
   * `isUnconfiguredLocalDev` needs BOTH Access vars empty, so HALF a pair
   * switches the real gate on — and `guardAccess` then refuses every request 503
   * for an empty team domain. This is not hypothetical: appending `--print-env`
   * to a secrets file that ended without a newline fused two settings into one
   * line, leaving `ACCESS_AUD` set and `ACCESS_TEAM_DOMAIN` undefined, and the
   * only symptom was a builder that had stopped answering at all.
   *
   * ASKED OF THE COMPOSED RESULT, not of any one file, because that is the
   * question: no single file is wrong in that state, the overlay is.
   */
  const merged: Record<string, string> = {}
  for (const file of files) Object.assign(merged, file.vars)
  const set = ACCESS_VARS.filter((key) => (merged[key] ?? '') !== '')
  if (set.length === 1) {
    const absent = ACCESS_VARS.filter((key) => !set.includes(key))
    warnings.push(
      `  ${set.join(', ')} is set but ${absent.join(', ')} is not — the Access gate is ON and ` +
        'incomplete, so every request will be refused 503. Both, or neither.',
    )
  }

  return { files, args: files.flatMap((f) => ['--env-file', f.arg]), warnings }
}

/** The `.dev.vars` this layering names, resolved. The one place that path is built. */
export function devVarsPath(appDir: string): string {
  return path.resolve(appDir, DEV_VARS_ARG)
}

/**
 * The `.dev.vars.local` this layering names, resolved ([[BUG-146]]).
 *
 * EXPORTED SO THE RECIPE AND THE READER CANNOT DISAGREE. The defect was a
 * documented path that nothing read; a second literal spelling of it anywhere is
 * the same defect waiting to happen, so the scripts that print the recipe are
 * checked against this.
 */
export function devVarsLocalPath(appDir: string): string {
  return path.resolve(appDir, DEV_VARS_LOCAL_ARG)
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
 * whose whole point is that both see the same one — which is also why this is a
 * MERGE OF WHAT THE LAYERING ALREADY PARSED rather than a second pass over the
 * same files.
 */
export function readDevEnv(opts: {
  appDir: string
  env?: NodeJS.ProcessEnv
  exists?: (p: string) => boolean
  read?: (p: string) => string
}): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const file of devEnvLayering(opts).files) Object.assign(vars, file.vars)
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
  read?: (p: string) => string
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
