import fs from 'node:fs'
import path from 'node:path'
import { devEnvLayering } from './dev-env'
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
 * The dev environment's port, and why it is not 8788.
 *
 * §L1 REQUIRES BOTH TO BE ABLE TO RUN AT ONCE. The old `pnpm dev` path is
 * deleted in a separate, later step so that the replacement can be proved first,
 * and "proved" means run beside it against the same store. Sharing 8788 would
 * make that impossible and turn a sequencing requirement into a coin toss over
 * which server won the bind. 8789 sits inside `ps.ts`'s existing 8700–8899 band,
 * so `1c ps` and `bin/dev reap` see it with no change to either.
 */
export const DEV_SERVE_PORT = 8789

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
  env?: NodeJS.ProcessEnv
  exists?: (p: string) => boolean
}): string[] {
  const layering = devEnvLayering({ appDir: opts.appDir, env: opts.env, exists: opts.exists })
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

/** One line saying what is being served, and when it was built. */
export function snapshotSummary(snapshot: DevSnapshot, port: number | string): string {
  const age = snapshot.deployedAt === '' ? '' : ` (deployed ${snapshot.deployedAt}`
  const commit = snapshot.commit === 'unknown' || age === '' ? '' : `, ${snapshot.commit}`
  return (
    `Dev environment (wrangler dev on a deployed snapshot) on http://localhost:${port}\n` +
    `  worker: ${snapshot.worker} --env ${snapshot.env}${age}${commit}${age === '' ? '' : ')'}\n` +
    `  serving: apps/${snapshot.app}/${SNAPSHOT_DIR}/${snapshot.entry}\n` +
    `  store: apps/${snapshot.app}/${STATE_DIR} — the only copy of the dev data\n` +
    '  FROZEN: editing a source file changes nothing here until `bin/deploy --env dev`\n'
  )
}
