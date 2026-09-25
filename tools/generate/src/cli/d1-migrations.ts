import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { STATE_DIR } from './reset'

/**
 * Does the local D1 database carry the migrations this checkout assumes?
 * ([[REQ-253]])
 *
 * WHY THIS EXISTS AT ALL. Production is guarded: `bin/deploy.d/migrate/10-d1-site-store`
 * applies the migrations before the Worker is uploaded and aborts the deploy if
 * they fail, *"so a Worker whose code assumes a column that does not exist yet"*
 * cannot reach traffic. Development had no equivalent. `wrangler dev` reads
 * whatever is in `.wrangler/state/v3/d1` and starts; a `git pull` brings new code
 * and new migration files, and nothing applies the second or notices the
 * mismatch. What the operator gets instead is
 *
 *     D1_ERROR: table asset_grants has no column named form_handle: SQLITE_ERROR
 *
 * at request time, rendered to them as the frozen acknowledgement — working
 * correctly, and by design carrying no diagnosis. This module turns that into one
 * sentence at startup.
 *
 * IT READS THE DATABASE, NOT A MARKER. `d1_migrations` is the table
 * `wrangler d1 migrations apply` writes a row into for every file it runs, and
 * `wrangler d1 migrations list` reads exactly it. Reading anything else — a
 * mtime, a recorded high-water mark, a file we write ourselves — would be a
 * second opinion that could disagree with wrangler's, which is the one thing a
 * check like this must never do.
 *
 * IT APPLIES NOTHING. A migration can drop data, so a tool that ran one because a
 * file appeared would be a worse problem than the one being fixed. This says what
 * is wrong and what to type.
 *
 * IT IS NOT A SECOND IMPLEMENTATION OF WRANGLER. Everything that could be looked
 * up is looked up rather than restated: the database name, its id and the
 * migrations directory come out of the same `wrangler.toml` block wrangler reads,
 * and the state directory is {@link STATE_DIR}, which `1c reset` already names.
 * The two derivations that are genuinely copied — miniflare's file name for a D1
 * database, and the `*.sql` set wrangler treats as migrations — are each four
 * lines, and each is marked below with what it is a copy of.
 */

/**
 * The durable-object namespace miniflare persists D1 under.
 *
 * Every local D1 database is a Durable Object, and its SQLite file is named for
 * that object's id. This is the namespace key wrangler passes when it opens one:
 * `executeLocally` builds a `Miniflare` with `d1Databases: { DATABASE: id }`,
 * where `id` is the `database_id` from the config.
 */
const D1_NAMESPACE = 'miniflare-D1DatabaseObject'

/**
 * Miniflare's `durableObjectNamespaceIdFromName`, verbatim.
 *
 * COPIED RATHER THAN IMPORTED because it is not exported — it lives inside
 * miniflare's bundle. Four lines against a whole Miniflare instance (which spawns
 * workerd, costing seconds) is the trade this makes; see the cost note on
 * {@link appliedMigrations}.
 */
function durableObjectIdFromName(uniqueKey: string, name: string): string {
  const key = crypto.createHash('sha256').update(uniqueKey).digest()
  const nameHmac = crypto.createHmac('sha256', key).update(name).digest().subarray(0, 16)
  const hmac = crypto.createHmac('sha256', key).update(nameHmac).digest().subarray(0, 16)
  return Buffer.concat([nameHmac, hmac]).toString('hex')
}

/** The one thing this module needs out of `wrangler.toml`. */
export interface LocalD1Binding {
  /** What `wrangler d1 migrations apply` is called with. */
  readonly databaseName: string
  /** What miniflare names the file after — the uuid, never the name. */
  readonly databaseId: string
  /** `migrations_dir`, resolved against the app directory as wrangler resolves it. */
  readonly migrationsDir: string
}

/**
 * Read the D1 binding the running server will use.
 *
 * IT FOLLOWS THE ENVIRONMENT, and that has always been the rule even though it
 * used to read only one block ([[REQ-318]]). The reason it read the top level was
 * never that the top level is special: it was that `1c builder` runs `wrangler
 * dev` with no `--env`, and a check about the local store has to read the same
 * half of the file the local server does. The local dev environment now runs at
 * `--env dev`, which inherits NOTHING from the top level, so the same rule now
 * selects `[[env.dev.d1_databases]]`. A check that kept reading the top level
 * would be right about a database the server is not opening.
 *
 * `env` ABSENT MEANS THE TOP LEVEL, which is what `1c builder` and `pnpm dev`
 * still read; those survive this ticket untouched (§L1), and both blocks are
 * deliberately duplicated in `apps/control-app/wrangler.toml`, so taking the
 * first match without scoping would be right today and silently wrong the day
 * they differ.
 *
 * SCRAPED RATHER THAN PARSED, which is this repository's existing convention for
 * this file (see `tests/test_UAT_FC_REQ-143_store_bindings.test.ts`). A TOML
 * parser would be a dependency bought for three keys.
 */
export function readLocalD1Binding(appDir: string, env?: string): LocalD1Binding | null {
  let toml: string
  try {
    toml = fs.readFileSync(path.join(appDir, 'wrangler.toml'), 'utf8')
  } catch {
    return null
  }
  // The scope to search. With no environment that is everything before the first
  // `[env.…]` header — what `wrangler dev` sees; with one it is the lines from
  // that environment's first table to the start of the next environment.
  const lines = toml.split('\n')
  const header = env === undefined ? '[[d1_databases]]' : `[[env.${env}.d1_databases]]`
  const scope =
    env === undefined
      ? lines.slice(
          0,
          (() => {
            const first = lines.findIndex((line) => /^\[env\./.test(line))
            return first === -1 ? lines.length : first
          })(),
        )
      : lines
  // The block runs from its own header to the next header of any kind — read
  // line by line rather than with a lookahead, because "until the next line that
  // starts a table" is exactly what TOML means and is not a regex worth writing.
  const start = scope.findIndex((line) => line.trim() === header)
  if (start === -1) return null
  const end = scope.findIndex((line, i) => i > start && line.startsWith('['))
  const block = scope.slice(start + 1, end === -1 ? undefined : end).join('\n')
  const value = (key: string): string | null =>
    new RegExp(`^${key}\\s*=\\s*"([^"]+)"`, 'm').exec(block)?.[1] ?? null

  const databaseName = value('database_name')
  const databaseId = value('database_id')
  const migrationsDir = value('migrations_dir')
  if (!databaseName || !databaseId || !migrationsDir) return null
  return {
    databaseName,
    databaseId,
    // Resolved against the app directory, because that is where wrangler resolves
    // it from — the migrations live at the repo root beside the schema they
    // describe, and only this key says so.
    migrationsDir: path.resolve(appDir, migrationsDir),
  }
}

/** Where miniflare persists this database for `wrangler dev`. */
export function localD1File(appDir: string, databaseId: string): string {
  return path.join(
    appDir,
    STATE_DIR,
    'v3',
    'd1',
    D1_NAMESPACE,
    `${durableObjectIdFromName(D1_NAMESPACE, databaseId)}.sqlite`,
  )
}

/**
 * The migration files, in the order wrangler would apply them.
 *
 * `*.sql` DIRECTLY IN THE DIRECTORY, dotfiles excluded — wrangler's own default
 * `migrations_pattern`. Ordered by leading number first so `0010_` follows
 * `0009_` rather than `0001_`, which is wrangler's `compareSegments`.
 */
export function migrationFiles(dir: string): readonly string[] {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const leading = (name: string): number => {
    const n = /^(\d+)/.exec(name)
    return n ? Number(n[1]) : Number.POSITIVE_INFINITY
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.sql') && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort((a, b) => leading(a) - leading(b) || (a < b ? -1 : a > b ? 1 : 0))
}

/**
 * The migrations recorded as applied, or `null` when there is no database.
 *
 * `node:sqlite` AND NOT A DEPENDENCY, and not `wrangler d1 migrations list`
 * either. The CLI's whole point is to add no measurable time to a normal start:
 * this opens a file and runs one query in single-digit milliseconds, where
 * shelling out to wrangler costs seconds and standing up a `Miniflare` spawns
 * workerd. `node:sqlite` is in the runtime this repository already requires
 * (`engines.node >= 22.12`), so it is a read of the same bytes at no cost in
 * maintenance.
 *
 * NO `d1_migrations` TABLE IS AN EMPTY LIST, NOT AN ABSENT DATABASE. A file that
 * exists with nothing recorded in it is a database that has had nothing applied,
 * which is drift and reads as drift. Only a missing file means "not created yet".
 *
 * READ-ONLY, because this runs in front of a server that is about to open the
 * same file for writing, and because a check has no business changing what it
 * checks.
 */
export async function appliedMigrations(dbFile: string): Promise<readonly string[] | null> {
  if (!fs.existsSync(dbFile)) return null
  const { DatabaseSync } = await importSqlite()
  const db = new DatabaseSync(dbFile, { readOnly: true })
  try {
    const present = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'd1_migrations'`)
      .all()
    if (present.length === 0) return []
    return db
      .prepare('SELECT name FROM d1_migrations ORDER BY id')
      .all()
      .map((row) => String((row as { name: unknown }).name))
  } finally {
    db.close()
  }
}

/**
 * Import `node:sqlite` without its experimental warning reaching the operator.
 *
 * THE WARNING IS THE PROBLEM, NOT THE MODULE. Node prints *"SQLite is an
 * experimental feature"* once, on the tick after the first import — so a check
 * whose whole contract is "a current database starts with no extra output" would
 * print a line about SQLite on every start, and every other `1c` command that
 * happens to load this module would too.
 *
 * SCOPED AND RESTORED. `process.emit` is replaced for exactly as long as it takes
 * the deferred warning to arrive, filters on that one warning, and is put back —
 * so a later warning from anywhere else still prints. The alternative,
 * `--disable-warning=ExperimentalWarning` on the launcher, would silence the
 * whole CLI's warnings for one module's benefit.
 */
async function importSqlite(): Promise<typeof import('node:sqlite')> {
  const original = process.emit
  process.emit = function (this: NodeJS.Process, name: string, ...rest: unknown[]) {
    const warning = rest[0] as { name?: string; message?: string } | undefined
    if (
      name === 'warning' &&
      warning?.name === 'ExperimentalWarning' &&
      /SQLite/.test(String(warning.message))
    ) {
      return false
    }
    return Reflect.apply(original, this, [name, ...rest]) as boolean
  } as typeof process.emit
  try {
    const mod = await import('node:sqlite')
    // The warning is emitted on the next tick, so the patch has to outlive the
    // import itself by exactly one turn of the loop.
    await new Promise((resolve) => setImmediate(resolve))
    return mod
  } finally {
    process.emit = original
  }
}

/** What the local database is, relative to the migration files beside it. */
export interface MigrationDrift {
  readonly dbFile: string
  /** False when miniflare has never persisted this database. */
  readonly created: boolean
  readonly files: readonly string[]
  readonly applied: readonly string[]
  /** Files with no row in `d1_migrations`, in the order they would be applied. */
  readonly pending: readonly string[]
  /**
   * Rows naming a file this checkout does not have. Reported, never refused: an
   * older branch against a newer store is an ordinary state, not an error.
   */
  readonly ahead: readonly string[]
}

/** The result of the check, and what the caller is meant to do about each case. */
export type LocalD1Check =
  /** Current, or ahead — start, and say nothing. */
  | { readonly kind: 'ok'; readonly drift: MigrationDrift }
  /**
   * Do not start. ONE KIND FOR TWO FACTS — a database behind the files, and a
   * database that was never created — because the caller does the same thing
   * with both and the operator is told which by {@link message}. `drift.created`
   * is what names the difference in code.
   */
  | { readonly kind: 'refuse'; readonly drift: MigrationDrift; readonly message: string }
  /**
   * The check itself could not run. WARN AND START: a gate that cannot read the
   * database is a different fact from a database that is behind one, and the
   * version of this that stops an operator working because the *check* broke
   * would be a worse bug than the one it was written for.
   */
  | { readonly kind: 'unreadable'; readonly message: string }

/**
 * Check the local store `wrangler dev` will open.
 *
 * `repoRoot` RATHER THAN A WORKING DIRECTORY, for the reason `1c reset` and
 * `1c builder` take it: a command that derived `apps/control-app` from wherever
 * it was typed would only work at the repo root, and any package script calling
 * it would inherit that as a silent requirement.
 */
export async function localD1Check(opts: {
  repoRoot: string
  /** The wrangler environment the server runs at; absent means the top level. */
  env?: string
}): Promise<LocalD1Check> {
  const appDir = path.join(opts.repoRoot, 'apps', 'control-app')
  const binding = readLocalD1Binding(appDir, opts.env)
  if (!binding) {
    const block = opts.env === undefined ? '[[d1_databases]]' : `[[env.${opts.env}.d1_databases]]`
    return {
      kind: 'unreadable',
      message:
        `Could not read a ${block} block from ${path.join(appDir, 'wrangler.toml')}, ` +
        'so the local database was not checked against db/migrations/.',
    }
  }

  const dbFile = localD1File(appDir, binding.databaseId)
  const files = migrationFiles(binding.migrationsDir)
  let applied: readonly string[] | null
  try {
    applied = await appliedMigrations(dbFile)
  } catch (err) {
    return {
      kind: 'unreadable',
      message:
        `Could not read ${dbFile}: ${err instanceof Error ? err.message : String(err)}. ` +
        'The local database was not checked against db/migrations/.',
    }
  }

  const drift: MigrationDrift = {
    dbFile,
    created: applied !== null,
    files,
    applied: applied ?? [],
    pending: applied === null ? files : files.filter((f) => !applied.includes(f)),
    ahead: (applied ?? []).filter((a) => !files.includes(a)),
  }
  if (drift.created && drift.pending.length === 0) return { kind: 'ok', drift }
  return { kind: 'refuse', drift, message: refusal(drift, binding, opts.repoRoot, appDir, opts.env) }
}

/**
 * The whole refusal, as one block of prose.
 *
 * NOT SPLIT INTO A `hint`. A `CommandError` thrown out of a command reaches
 * `bin/1c.mjs`, which prints `err.message` and nothing else — so a hint would be
 * the half of this that never arrives, and it is the half that says what to type.
 *
 * THE RESTART PARAGRAPH IS LOAD-BEARING and is not advice about tidiness. Applying
 * a migration under a live `wrangler dev` changes the file on disk while
 * miniflare's Durable Object holds its own view of the schema, so the server keeps
 * serving the old one — which is how the same error came back forty-five minutes
 * after it had been fixed. An operator who reads only this message has to be told.
 */
function refusal(
  drift: MigrationDrift,
  binding: LocalD1Binding,
  repoRoot: string,
  appDir: string,
  env?: string,
): string {
  const appRel = path.relative(repoRoot, appDir) || appDir
  // THE REMEDY NAMES THE ENVIRONMENT IT IS FOR. At `--env dev` the migrations are
  // the deploy's job, so the sentence that reaches the operator is the deploy
  // rather than a wrangler invocation that would bypass the hook that verifies
  // an applied migration's bytes ([[REQ-291]]).
  const command =
    env === undefined
      ? `(cd ${appRel} && npx wrangler d1 migrations apply ${binding.databaseName} --local)`
      : `bin/deploy --env ${env}`
  const diagnosis = drift.created
    ? `The local database is behind this checkout — ${drift.pending.length} ` +
      `migration${drift.pending.length === 1 ? ' has' : 's have'} not been applied:\n\n` +
      drift.pending.map((f) => `  ${f}`).join('\n')
    : `There is no local database yet — nothing is persisted for '${binding.databaseName}' at\n` +
      `  ${drift.dbFile}\n\n` +
      `Starting anyway would serve a Worker with no tables at all.`
  return (
    `${diagnosis}\n\n` +
    `Apply the migrations, then start again:\n\n` +
    `  ${command}\n\n` +
    `Nothing was started. A Worker whose code assumes a column that does not exist\n` +
    `yet fails at request time, naming SQLite rather than the change that caused it —\n` +
    `which is the failure this refusal exists to replace.\n\n` +
    `If a dev server is already running, RESTART it after applying: it holds its own\n` +
    `view of the schema and will keep serving the old one, which is how the same\n` +
    `error comes back an hour after it was fixed.`
  )
}
