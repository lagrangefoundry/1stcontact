import { EventEmitter } from 'node:events'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * REQ-253 — a development server refuses to run against a database that is
 * behind its code.
 *
 * WHAT IS REAL HERE, WHICH IS ALMOST ALL OF IT. Every database below is a real
 * SQLite file with a real `d1_migrations` table, written at the path miniflare
 * would write it to, under a real `wrangler.toml` read by the real scraper. The
 * migration directory is real files on disk. Nothing about the drift decision is
 * simulated — if the file-name derivation, the TOML block scoping or the applied
 * -versus-present comparison were wrong, these fail.
 *
 * TWO THINGS ARE STOOD ASIDE, both at genuine boundaries. `spawn` launches an
 * actual `wrangler dev` and binds a port — the same boundary BUG-50's suite
 * replaces, and for the same reason: the artefact under test is what happens
 * BEFORE it, including whether it is reached at all. And `repoRoot` is pointed at
 * a fixture checkout, because the gate is deliberately repo-anchored (BUG-50) and
 * a test that read the developer's own `.wrangler/state` would pass or fail on
 * whether they had run their migrations this morning.
 */

const { spawnCalls } = vi.hoisted(() => ({
  spawnCalls: [] as Array<{ cmd: string; args: string[] }>,
}))

const { fixture } = vi.hoisted(() => ({ fixture: { root: '' } }))

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  const spawn = (cmd: string, args: string[]) => {
    spawnCalls.push({ cmd, args })
    const child = new EventEmitter()
    queueMicrotask(() => child.emit('exit', 0))
    return child as unknown as ReturnType<typeof actual.spawn>
  }
  return { ...actual, spawn, default: { ...actual.default, spawn } }
})

vi.mock('../tools/generate/src/cli/webui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../tools/generate/src/cli/webui')>()
  return { ...actual, repoRoot: () => fixture.root }
})

const { run } = await import('../tools/generate/src/cli')
const { localD1Check, localD1File, migrationFiles, readLocalD1Binding } = await import(
  '../tools/generate/src/cli/d1-migrations'
)

const DATABASE_ID = '0434cd88-07e0-4eb2-a7d8-7370c333534c'
const DATABASE_NAME = '1stcontact'

/**
 * A checkout, shaped exactly as the repository is: the D1 binding in the app's
 * top-level `[[d1_databases]]` block, and the migrations at the repo root where
 * `migrations_dir` says they are.
 *
 * `[env.production]` CARRIES A DIFFERENT DATABASE ID ON PURPOSE. `wrangler dev`
 * reads the top level and a named environment inherits nothing, so a check that
 * took the first `database_id` in the file would read the wrong store the day the
 * two differ — and this fixture is the day they differ.
 */
function checkout(opts: { files: string[]; applied?: string[] | null }): string {
  const root = mkdtempSync(path.join(tmpdir(), 'req253-'))
  const appDir = path.join(root, 'apps', 'control-app')
  mkdirSync(appDir, { recursive: true })
  writeFileSync(
    path.join(appDir, 'wrangler.toml'),
    [
      'name = "1stcontact-control-app"',
      '',
      '[[d1_databases]]',
      'binding = "DB"',
      `database_name = "${DATABASE_NAME}"`,
      `database_id = "${DATABASE_ID}"`,
      'migrations_dir = "../../db/migrations"',
      '',
      '[env.production]',
      'name = "1stcontact-control-app"',
      '',
      '[[env.production.d1_databases]]',
      'binding = "DB"',
      `database_name = "${DATABASE_NAME}"`,
      'database_id = "11111111-2222-3333-4444-555555555555"',
      'migrations_dir = "../../db/migrations"',
      '',
    ].join('\n'),
  )

  const migrations = path.join(root, 'db', 'migrations')
  mkdirSync(migrations, { recursive: true })
  for (const f of opts.files) writeFileSync(path.join(migrations, f), '-- a migration\n')
  // Not a migration by wrangler's own `*.sql` pattern, and present so that a
  // check which merely listed the directory would report it as pending.
  writeFileSync(path.join(migrations, 'README.md'), '# how these are applied\n')

  if (opts.applied !== null && opts.applied !== undefined) {
    const file = localD1File(appDir, DATABASE_ID)
    mkdirSync(path.dirname(file), { recursive: true })
    const db = new DatabaseSync(file)
    db.exec(
      'CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
    )
    for (const name of opts.applied) {
      db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').run(name)
    }
    db.close()
  }
  return root
}

const restore: Array<() => void> = []

afterEach(() => {
  for (const r of restore.splice(0)) r()
  spawnCalls.length = 0
  fixture.root = ''
  process.exitCode = undefined
})

/** Silence the banner and the env-file warnings; return what was said. */
function captureOutput(): string[] {
  const said: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void said.push(a.join(' ')))
  const warn = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => void said.push(a.join(' ')))
  restore.push(() => {
    log.mockRestore()
    warn.mockRestore()
  })
  return said
}

describe('REQ-253 — the local database is checked before the server serves', () => {
  it('test_UAT_FC_REQ-253_a_database_behind_the_files_refuses_to_start_and_names_them', async () => {
    // AC1 and AC2 together, at the real entry point: the refusal has to stop the
    // start, and it has to carry every pending file and the command. Two files are
    // pending rather than one so that a message naming only the newest — the
    // tempting shorthand — fails.
    fixture.root = checkout({
      files: ['0001_baseline.sql', '0002_sessions.sql', '0003_domains.sql'],
      applied: ['0001_baseline.sql'],
    })
    captureOutput()

    await expect(run(['builder'])).rejects.toThrow(/0002_sessions\.sql/)
    expect(spawnCalls).toHaveLength(0)

    const said = await run(['builder']).catch((e: Error) => e.message)
    expect(said).toContain('0002_sessions.sql')
    expect(said).toContain('0003_domains.sql')
    // The applied one is not offered back as work to do.
    expect(said).not.toContain('0001_baseline.sql')
    // The command, exactly as it can be typed, from the repo root.
    expect(said).toContain(
      `(cd ${path.join('apps', 'control-app')} && npx wrangler d1 migrations apply ${DATABASE_NAME} --local)`,
    )
    expect(spawnCalls).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-253_the_refusal_says_a_running_server_must_be_restarted', async () => {
    // AC7. This sentence is the difference between the mismatch being met once and
    // being met twice: applying a migration under a live `wrangler dev` leaves
    // miniflare on its own view of the schema, which is how the same error came
    // back forty-five minutes after it had been fixed.
    fixture.root = checkout({ files: ['0001_baseline.sql'], applied: [] })
    captureOutput()

    const said = await run(['builder']).catch((e: Error) => e.message)
    expect(said).toMatch(/RESTART/)
    expect(said).toMatch(/view of the schema/)
  })

  it('test_UAT_FC_REQ-253_a_current_database_starts_with_no_extra_output', async () => {
    // AC3. The other side of the refusal, and the one that a check printing an
    // unconditional "database is up to date" line would fail. The only output is
    // the banner the command already had.
    fixture.root = checkout({
      files: ['0001_baseline.sql', '0002_sessions.sql'],
      applied: ['0001_baseline.sql', '0002_sessions.sql'],
    })
    const said = captureOutput()

    await run(['builder'])

    expect(spawnCalls).toHaveLength(1)
    expect(spawnCalls[0].args.slice(0, 2)).toEqual(['wrangler', 'dev'])
    expect(said.join('\n')).not.toMatch(/migration/i)
  })

  it('test_UAT_FC_REQ-253_a_database_ahead_of_the_files_starts', async () => {
    // AC4. An older branch against a newer store is an ordinary state on a
    // branch, not an error — and a check written as "the two lists must be equal"
    // would refuse it. The rule is that nothing is PENDING, not that nothing
    // differs.
    fixture.root = checkout({
      files: ['0001_baseline.sql'],
      applied: ['0001_baseline.sql', '0002_from_a_newer_branch.sql'],
    })
    captureOutput()

    await run(['builder'])

    expect(spawnCalls).toHaveLength(1)
    // Started, and the difference is still SEEN rather than ignored — the rule is
    // that nothing is pending, not that the two lists match.
    const check = await localD1Check({ repoRoot: fixture.root })
    expect(check.kind).toBe('ok')
    if (check.kind !== 'ok') return
    expect(check.drift.ahead).toEqual(['0002_from_a_newer_branch.sql'])
  })

  it('test_UAT_FC_REQ-253_a_first_run_is_told_how_to_create_the_database', async () => {
    // AC5. A fresh clone has no `.wrangler/state` at all. That is not drift and is
    // not reported as it — but it is not a start either: wrangler would open an
    // empty database and every request would fail on a missing table. The one
    // command that answers both cases is named.
    fixture.root = checkout({ files: ['0001_baseline.sql'], applied: null })
    captureOutput()

    const said = await run(['builder']).catch((e: Error) => e.message)
    expect(said).toContain('There is no local database yet')
    expect(said).not.toMatch(/behind/)
    expect(said).toContain(`npx wrangler d1 migrations apply ${DATABASE_NAME} --local`)
    expect(spawnCalls).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-253_the_check_reads_the_table_wrangler_writes_at_the_path_wrangler_uses', async () => {
    // AC6. The two derivations that could silently disagree with
    // `wrangler d1 migrations list`: WHICH file, and WHAT is read out of it.
    //
    // The path is asserted against the value this repository's own store is at
    // today, so a change to miniflare's naming is caught here rather than as a
    // check that reports "no database" forever. The applied set is asserted to be
    // the `d1_migrations` rows themselves — a file with an empty table is a
    // database with nothing applied, not a database that is absent.
    const root = checkout({ files: ['0001_baseline.sql'], applied: [] })
    const appDir = path.join(root, 'apps', 'control-app')

    expect(localD1File(appDir, DATABASE_ID)).toBe(
      path.join(
        appDir,
        '.wrangler',
        'state',
        'v3',
        'd1',
        'miniflare-D1DatabaseObject',
        '24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite',
      ),
    )

    fixture.root = root
    const check = await localD1Check({ repoRoot: root })
    expect(check.kind).toBe('refuse')
    if (check.kind !== 'refuse') return
    expect(check.drift.created).toBe(true)
    expect(check.drift.applied).toEqual([])
    expect(check.drift.pending).toEqual(['0001_baseline.sql'])
  })

  it('test_UAT_FC_REQ-253_the_binding_is_read_from_the_block_wrangler_dev_uses', async () => {
    // `wrangler dev` reads the top level; `--env production` reads its own block
    // and inherits nothing. Both are declared in the real `wrangler.toml` and both
    // are in the fixture, with different ids — so a scraper that took the first
    // `database_id` it found anywhere would read the wrong store the day they
    // diverge.
    const root = checkout({ files: [], applied: [] })
    const binding = readLocalD1Binding(path.join(root, 'apps', 'control-app'))
    expect(binding?.databaseId).toBe(DATABASE_ID)
    expect(binding?.databaseName).toBe(DATABASE_NAME)
    expect(binding?.migrationsDir).toBe(path.join(root, 'db', 'migrations'))
  })

  it('test_UAT_FC_REQ-253_only_sql_files_count_and_they_are_ordered_as_wrangler_orders_them', async () => {
    // Wrangler's default `migrations_pattern` is `*.sql`, and its ordering is by
    // leading number rather than lexicographic — so `0010_` follows `0009_` rather
    // than `0001_`. A pending list in the wrong order is a list that reads as the
    // wrong work.
    const root = checkout({
      files: ['0009_nine.sql', '0010_ten.sql', '0002_two.sql'],
      applied: [],
    })
    expect(migrationFiles(path.join(root, 'db', 'migrations'))).toEqual([
      '0002_two.sql',
      '0009_nine.sql',
      '0010_ten.sql',
    ])
  })

  it('test_UAT_FC_REQ-253_remote_is_not_gated_on_the_local_store', async () => {
    // `--remote` points wrangler at the DEPLOYED database, which `bin/deploy`
    // migrates and which this local file says nothing about. Refusing on it would
    // block the one mode the check has no evidence for.
    fixture.root = checkout({ files: ['0001_baseline.sql'], applied: null })
    captureOutput()

    await run(['builder', '--remote'])

    expect(spawnCalls).toHaveLength(1)
    expect(spawnCalls[0].args).toContain('--remote')
  })

  it('test_UAT_FC_REQ-253_a_check_that_cannot_run_warns_and_does_not_stop_the_start', async () => {
    // A gate that cannot read the database is a different fact from a database
    // that is behind one. Reporting the first as the second would make the check
    // itself the thing that stops an operator working — a worse bug than the one
    // it was written for. Driven by a checkout with no `[[d1_databases]]` block at
    // all, which is the one shape that leaves nothing to read.
    const root = mkdtempSync(path.join(tmpdir(), 'req253-nodb-'))
    const appDir = path.join(root, 'apps', 'control-app')
    mkdirSync(appDir, { recursive: true })
    writeFileSync(path.join(appDir, 'wrangler.toml'), 'name = "1stcontact-control-app"\n')
    fixture.root = root
    const said = captureOutput()

    await run(['builder'])

    expect(spawnCalls).toHaveLength(1)
    expect(said.join('\n')).toContain('d1_databases')
  })

  it('test_UAT_FC_REQ-253_the_check_costs_no_measurable_time', async () => {
    // AC8. The reason this reads the SQLite file directly rather than shelling out
    // to `wrangler d1 migrations list` or standing up a Miniflare — both of which
    // are seconds. The bound is loose on purpose: it is there to catch a change of
    // MECHANISM, not to measure a machine.
    const root = checkout({
      files: ['0001_baseline.sql', '0002_sessions.sql'],
      applied: ['0001_baseline.sql', '0002_sessions.sql'],
    })
    const started = performance.now()
    const check = await localD1Check({ repoRoot: root })
    const elapsed = performance.now() - started
    expect(check.kind).toBe('ok')
    expect(elapsed).toBeLessThan(250)
  })
})
