import fs from 'node:fs'
import path from 'node:path'
import { devEnvLayering, devUrl } from './dev-env'
import { STATE_DIR } from './reset'

/**
 * The local dev environment's snapshot: what `bin/deploy --env dev` wrote, and
 * the `wrangler dev` that serves it ([[REQ-318]], [[EPIC-16]] §K).
 *
 * WHAT THE FREEZE ACTUALLY IS. `wrangler dev` has no `--no-watch`, so an
 * environment cannot be frozen by a flag; it is frozen by WHAT IS WATCHED.
 * `1c builder` points wrangler at `src/worker.ts`, so every save rebuilds and
 * the running Worker and the file being edited are the same bytes, continuously
 * — a half-finished function is immediately what serves. This points it at a
 * directory that nothing writes to except the next deploy, with `--no-bundle` so
 * there is no compile step to re-run. Editing a source file then changes nothing
 * about what is served until `bin/deploy --env dev` runs again, which is this
 * ticket's acceptance condition rather than a nicety.
 *
 * ONE STORE, AND IT IS THE STORE THAT WAS ALREADY THERE (§K2). `--persist-to`
 * names `apps/<app>/.wrangler/state` — the same directory `1c builder` persists
 * to, holding the same D1 file and the same R2 buckets, because `[env.dev]`
 * declares the same `database_id` and bucket names. There is ONE local dev
 * environment holding THE ONLY COPY of the dev data, so this does not fork the
 * store; it becomes the environment that owns it. The old path keeps working on
 * its own port against the same bytes, which is the condition §L1 requires
 * before anything is deleted.
 *
 * NOTHING HERE RE-DERIVES WHAT THE DEPLOY ALREADY DECIDED. The entry file's
 * name, the environment and whether there are assets all come out of
 * `snapshot.json`, which the ship step wrote. A second derivation — recomputing
 * `main`'s basename here, say — would be a second opinion free to disagree with
 * the one that produced the bytes.
 */

/** Where a local deploy leaves what it built, relative to the app directory. */
export const SNAPSHOT_DIR = '.dev-snapshot'

/** The file `bin/deploy`'s local target writes and this module reads. */
export const SNAPSHOT_MANIFEST = 'snapshot.json'

/**
 * The control app's dev environment port, and why it is not 8788.
 *
 * IT WAS 8789 SO THAT BOTH PATHS COULD RUN AT ONCE, which EPIC-16 §L1 required
 * while the replacement was being proved: sharing 8788 with the watch builder
 * would have turned a sequencing requirement into a coin toss over which server
 * won the bind. [[BUG-150]] finished that sequence — the builder is deleted, so
 * nothing holds 8788 any more — and 8789 STAYS, because `bin/access-sim` already
 * defaults to it ([[REQ-322]]) and moving a port that is now uncontested would
 * cost every operator their habit to buy a tidier number.
 *
 * It sits inside `ps.ts`'s existing 8700–8899 band, so `1c ps` and `bin/dev reap`
 * see it with no change to either.
 */
export const DEV_SERVE_PORT = 8789

/**
 * The public site's dev environment port, and why it is the one the deleted
 * package script used ([[BUG-150]]).
 *
 * 8787 IS WHERE THE PUBLIC SITE HAS ALWAYS BEEN, under `pnpm dev:public` —
 * `wrangler dev --port 8787` over `src/`. That script is deleted here, and the
 * choice was between giving the frozen server a sixth number and giving it this
 * one. A sixth number would leave the port an operator already associates with
 * the public site owned by nothing, while the public site answered somewhere
 * they would have to be told about; reusing it means habit, a bookmark and an old
 * shell history line all land on the frozen server rather than on nothing.
 */
export const PUBLIC_SITE_SERVE_PORT = 8787

/**
 * An app `1c dev serve` can run, and what running it involves.
 *
 * WHY A TABLE AND NOT A SECOND COMMAND ([[BUG-150]]). `1c dev serve` hard-coded
 * `control-app`, and `bin/dev up` has to start the public site's snapshot too —
 * the whole of what this ticket asks for. A `1c dev serve-public` would be a
 * second author of one launch, free to disagree with the first about the store,
 * the freeze or what gets printed. The differences between the two apps are
 * DATA, and this is the data.
 */
export interface DevServeApp {
  /** The directory under `apps/`, and the argument `1c dev serve` takes. */
  readonly app: string
  /**
   * The {@link KNOWN_SERVICES} name — the pidfile's stem, and what `1c ps` calls
   * it. Not always the app's own name: the control app's snapshot IS the dev
   * environment and has been called `dev` since [[REQ-318]].
   */
  readonly service: string
  readonly port: number
  /**
   * Whether this app's launch names the `.dev.vars` layering explicitly.
   *
   * THE CONTROL APP'S ONLY. `devEnvLayering` is about `ANTHROPIC_API_KEY` and the
   * two Access vars, and `--env-file` REPLACES wrangler's own `.dev.vars` lookup
   * rather than adding to it — so passing it for an app that has no `.dev.vars`
   * substitutes a list of files that do not exist for the default that works, and
   * prints three warnings about a builder this is not.
   */
  readonly envFiles: boolean
  /**
   * Whether starting it checks the local D1 against `db/migrations/`.
   *
   * THE CONTROL APP OWNS THE SCHEMA, and the public site's own config says so:
   * *"No `migrations_dir` here, deliberately. Migrations belong to the database
   * and are applied once, by the Worker that owns the schema (control-app)."*
   * `bin/dev up` starts the control app first, so the check still runs before
   * anything opens the store — once, rather than once per app.
   */
  readonly checkStore: boolean
  /** The banner's first words — what is answering on {@link port}. */
  readonly title: string
  /** The same fact as a `bin/dev`/`1c ps` table cell, which is a phrase not a sentence. */
  readonly what: string
}

/**
 * Every app the frozen dev environment serves, in start order.
 *
 * THE ORDER IS `bin/dev up`'S ORDER. The control app is first because it is the
 * one whose start checks the store, and because `bin/access-sim` fronts it.
 */
export const DEV_SERVE_APPS: readonly DevServeApp[] = [
  {
    app: 'control-app',
    service: 'dev',
    port: DEV_SERVE_PORT,
    envFiles: true,
    checkStore: true,
    title: 'Dev environment (wrangler dev on a deployed snapshot)',
    what: 'the deployed control-app snapshot — this is the builder',
  },
  {
    app: 'public-site',
    service: 'public-site',
    port: PUBLIC_SITE_SERVE_PORT,
    envFiles: false,
    checkStore: false,
    title: 'Public site (wrangler dev on a deployed snapshot)',
    what: 'the deployed public-site snapshot',
  },
]

/** The default app, which is what `1c dev serve` with no argument runs. */
export const DEFAULT_SERVE_APP = DEV_SERVE_APPS[0]

/**
 * The row for `name`, matched on the app directory OR the service name.
 *
 * BOTH SPELLINGS, BECAUSE THE OPERATOR HAS BOTH. `1c ps` and `bin/dev` call the
 * control app's snapshot `dev`, while `apps/control-app` is what it is on disk
 * and what `bin/deploy` prints. Accepting one and rejecting the other would make
 * which word you had last read decide whether the command worked.
 */
export function devServeApp(name: string): DevServeApp | null {
  return DEV_SERVE_APPS.find((a) => a.app === name || a.service === name) ?? null
}

/** What `bin/deploy --env dev` recorded about the snapshot it wrote. */
export interface DevSnapshot {
  readonly app: string
  /** The wrangler environment it was built at — `dev`. */
  readonly env: string
  /** The Worker name `[env.<env>].name` declares. */
  readonly worker: string
  /** The bundled entry, relative to the snapshot directory. */
  readonly entry: string
  /** The frozen copy of the assets directory, relative to the snapshot, or null. */
  readonly assets: string | null
  /** ISO-8601, UTC — when the deploy ran. */
  readonly deployedAt: string
  /** Short SHA of the checkout it was built from, or `unknown`. */
  readonly commit: string
}

/** The snapshot directory for an app, absolute. */
export function snapshotDir(repoRoot: string, app: string): string {
  return path.join(repoRoot, 'apps', app, SNAPSHOT_DIR)
}

/**
 * Read the manifest, or say what is missing.
 *
 * ABSENT IS AN ORDINARY STATE AND NOT AN ERROR HERE — it means nobody has
 * deployed yet, which the caller turns into a sentence naming the command to
 * type. A malformed or incomplete manifest is treated the same way rather than
 * raised: both mean "there is no snapshot to serve", and the remedy for both is
 * one deploy.
 */
export function readSnapshot(opts: {
  repoRoot: string
  app: string
  read?: (p: string) => string
}): DevSnapshot | null {
  const read = opts.read ?? ((p: string) => fs.readFileSync(p, 'utf8'))
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(read(path.join(snapshotDir(opts.repoRoot, opts.app), SNAPSHOT_MANIFEST))) as Record<
      string,
      unknown
    >
  } catch {
    return null
  }
  const str = (k: string): string | null => (typeof raw[k] === 'string' ? (raw[k] as string) : null)
  const app = str('app')
  const env = str('env')
  const entry = str('entry')
  if (app === null || env === null || entry === null) return null
  return {
    app,
    env,
    worker: str('worker') ?? app,
    entry,
    assets: str('assets'),
    deployedAt: str('deployedAt') ?? '',
    commit: str('commit') ?? 'unknown',
  }
}

/** What to type when there is nothing to serve. */
export function noSnapshotMessage(app: string): string {
  return (
    `There is no deployed snapshot for ${app}.\n\n` +
    `The local dev environment is DEPLOYED TO rather than edited into, so it has\n` +
    `to be shipped once before it can be served:\n\n` +
    `  bin/build\n` +
    `  bin/deploy --env dev\n\n` +
    `That writes apps/${app}/${SNAPSHOT_DIR}/, which is what this command runs.`
  )
}

/**
 * The whole `wrangler dev` command line for the deployed snapshot.
 *
 * ONE FUNCTION RATHER THAN A LIST ASSEMBLED AT THE CALL SITE, for the reason
 * `wranglerDevArgs` is one ([[BUG-124]]): the question this ticket exists to
 * answer — *does what is served change when a source file changes?* — is a
 * question about this argv, and a UAT can only ask it of something it can call.
 * The answer it gets is that every path in here is under the snapshot directory
 * or under `.wrangler/state`, and none is under `src/`.
 *
 * RELATIVE PATHS, because the caller runs this with `cwd` set to the app
 * directory — which is also what makes `devEnvLayering`'s `.dev.vars` resolve the
 * way wrangler resolves it, against the config directory. The layering is
 * REUSED rather than restated: the dev environment must read exactly the files
 * the old path reads, or the two would disagree about the assistant's key while
 * claiming to be the same environment.
 */
export function devServeArgs(opts: {
  appDir: string
  snapshot: DevSnapshot
  port: number | string
  /**
   * Whether to name the `.dev.vars` layering — {@link DevServeApp.envFiles}.
   *
   * DEFAULTS TO TRUE, so every existing caller composes the argv it already
   * composed. It is the control app that has the layering; an app without one
   * passes `false` and gets wrangler's own `.dev.vars` lookup, which is the
   * behaviour `--env-file` would otherwise replace with a list of absent files.
   */
  envFiles?: boolean
  env?: NodeJS.ProcessEnv
  exists?: (p: string) => boolean
}): string[] {
  const layering =
    opts.envFiles === false
      ? { args: [] as readonly string[] }
      : devEnvLayering({ appDir: opts.appDir, env: opts.env, exists: opts.exists })
  return [
    'wrangler',
    'dev',
    // The BUNDLE, not the source. This one argument is the freeze.
    path.join(SNAPSHOT_DIR, opts.snapshot.entry),
    // …and this one is why there is no compile step to re-run.
    '--no-bundle',
    '--env',
    opts.snapshot.env,
    ...(opts.snapshot.assets === null
      ? []
      : // The frozen copy, never the live `dist-assets` the config names: that
        // directory is rebuilt by `1c assets`, and reading it live would leave
        // the builder client as the one part of the environment that is not
        // frozen.
        ['--assets', path.join(SNAPSHOT_DIR, opts.snapshot.assets)]),
    // Stated rather than defaulted. It happens to be wrangler's default, and
    // that is exactly why it is written: the store is the whole of what survives
    // a restart and which directory holds it must not be an assumption.
    '--persist-to',
    STATE_DIR,
    '--port',
    String(opts.port),
    ...layering.args,
  ]
}

/**
 * What is being served here, and when it was built.
 *
 * THE ANSWER TO *"WHAT AM I RUNNING?"*, WHICH IS THE WHOLE OF [[BUG-150]]. The
 * operator worked for an evening inside a server he believed was frozen, and the
 * reason he could not tell was that nothing said. `1c dev serve` printed this;
 * `bin/dev up` — the command he was told to use — did not, so this is now read by
 * both and there is one text for the fact rather than two.
 */
export function snapshotSummary(
  snapshot: DevSnapshot,
  port: number | string,
  app: DevServeApp = DEFAULT_SERVE_APP,
): string {
  const age = snapshot.deployedAt === '' ? '' : ` (deployed ${snapshot.deployedAt}`
  const commit = snapshot.commit === 'unknown' || age === '' ? '' : `, ${snapshot.commit}`
  return (
    // `devUrl`, NOT `localhost` ([[BUG-146]]): the cookie access-sim sets is
    // host-scoped, so naming the other host here logs the operator out again.
    `${app.title} on ${devUrl(port)}\n` +
    `  worker: ${snapshot.worker} --env ${snapshot.env}${age}${commit}${age === '' ? '' : ')'}\n` +
    `  serving: apps/${snapshot.app}/${SNAPSHOT_DIR}/${snapshot.entry}\n` +
    // "THE ONLY COPY" IS THE CONTROL APP'S CLAIM AND NOT EVERY APP'S (EPIC-16
    // §K2): that store holds the dev data every environment shares, which is why
    // `bin/deploy --env dev` guards it before any hook runs. An app that merely
    // has a store of its own gets the true, smaller sentence.
    `  store: apps/${snapshot.app}/${STATE_DIR} — ` +
    `${app.checkStore ? 'the only copy of the dev data' : 'what survives a restart'}\n` +
    '  FROZEN: editing a source file changes nothing here until `bin/deploy --env dev`\n'
  )
}
