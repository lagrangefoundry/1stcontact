import { describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

/**
 * REQ-192 — **the seed is one command, and it is local by default**.
 *
 * THE COMPANION SUITE RUNS IN WORKERD AND ASSERTS THE ROWS. This one asserts the
 * things a database cannot answer: that there is a command at all, that it names
 * the file it applies, that reaching a real deployment takes typing `--remote`,
 * and that the literal shared with `wrangler.toml` still matches.
 *
 * THE `--remote` CASE IS THE ONE WORTH A TEST. The fixture carries invented
 * people — `alice@plumbing.example`, `bob@example.com` — and a fixture reaching a
 * deployment is the defect REQ-190 just removed from migration `0005`: one
 * personal address baked into a path that runs in production. What stops it here
 * is a default, and a default is exactly the kind of thing a later edit changes
 * without noticing.
 */

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEED = path.join(REPO, 'bin', 'seed')
const SEED_SQL = path.join(REPO, 'db', 'dev-seed.sql')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

const runner = fs.readFileSync(SEED, 'utf8')
const sql = fs.readFileSync(SEED_SQL, 'utf8')

describe('REQ-192 — the seed command', () => {
  /**
   * One command, executable, with no build step in front of it. `bin/seed` is
   * shell rather than another `1c` subcommand because the CLI compiles itself
   * through a Vite SSR server on every invocation — a fixture that cannot be
   * applied until the generator's TypeScript type-checks is a fixture unavailable
   * exactly when the repository is half-fixed, which is when it is wanted.
   */
  it('test_UAT_FC_REQ-192_the_seed_is_one_executable_command', async () => {
    expect(fs.existsSync(SEED)).toBe(true)
    // eslint-disable-next-line no-bitwise
    expect(fs.statSync(SEED).mode & 0o111).toBeGreaterThan(0)

    const { stdout } = await promisify(execFile)(SEED, ['--help'])
    expect(stdout).toContain('bin/seed')
    expect(stdout).toContain('--remote')
  })

  /**
   * It applies the file, and by `--file` rather than by `--command`. The seed's
   * prose contains semicolons and its data contains apostrophes, and a shell-side
   * splitter gets both wrong — so SQLite parses the statements, not bash.
   */
  it('test_UAT_FC_REQ-192_the_seed_applies_the_seed_file', () => {
    expect(fs.existsSync(SEED_SQL)).toBe(true)
    expect(runner).toContain('db/dev-seed.sql')
    expect(runner).toContain('wrangler d1 execute DB')
    expect(runner).toContain('--file')
  })

  /**
   * LOCAL UNLESS `--remote` IS TYPED. Asserted as the initial value of the
   * variable that reaches wrangler, because that is the thing that can silently
   * flip: a later edit adding a `--remote` branch is visible, and a later edit
   * changing the default is one word.
   */
  it('test_UAT_FC_REQ-192_the_seed_writes_locally_unless_remote_is_typed', () => {
    expect(runner).toMatch(/^target="--local"$/m)
    expect(runner).toMatch(/--remote\)\s*target="--remote"/)
  })

  /**
   * The fixture is not a migration and must never become one. `db/migrations/` is
   * applied to every environment forever — that is precisely what made migration
   * `0005` a defect — so the seed sits beside it and is reached only by typing
   * the command.
   */
  it('test_UAT_FC_REQ-192_the_seed_is_not_a_migration', () => {
    const migrations = fs.readdirSync(path.join(REPO, 'db', 'migrations'))
    expect(migrations).not.toContain('dev-seed.sql')
    expect(migrations.every((f) => !f.includes('seed'))).toBe(true)
  })

  /**
   * Re-running it changes nothing, at the level the workerd suite cannot see:
   * every write is `INSERT OR IGNORE`. That suite proves the rows are unchanged
   * after a second run; this proves there is no statement SHAPE that could change
   * them — an `INSERT OR REPLACE` or a bare `UPDATE` slipping in later would pass
   * a snapshot comparison only until somebody edited a literal.
   */
  it('test_UAT_FC_REQ-192_every_seed_statement_is_insert_or_ignore', () => {
    const statements = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    expect(statements.length).toBeGreaterThan(0)
    for (const statement of statements) {
      expect(statement.slice(0, 40).toUpperCase()).toMatch(/^INSERT OR IGNORE INTO/)
    }
  })

  /**
   * THE LITERAL TWO FILES MUST AGREE ON, for the third time (REQ-190 pinned the
   * baseline to `wrangler.toml`; this pins the seed to both). Alice's `users` row
   * has to land in the business `TENANT_ID` names, or she is a person in a tenant
   * this deployment never asks about — rows that look perfect and admit nobody.
   * Nothing about the value is derivable, so nothing could notice them disagreeing
   * except a check that compares them.
   */
  it('test_UAT_FC_REQ-192_the_seed_names_the_configured_tenant', () => {
    const toml = fs.readFileSync(WRANGLER, 'utf8')
    const declared = [...toml.matchAll(/^TENANT_ID\s*=\s*"([^"]+)"/gm)].map((m) => m[1])
    expect(declared, 'TENANT_ID is declared in both blocks').toHaveLength(2)
    expect(new Set(declared).size, 'both blocks name the same business').toBe(1)
    expect(sql).toContain(declared[0])
  })

  /**
   * It seeds no platform operator, and the column is written rather than left to
   * its default — the same way `invitePerson` writes it, and for the same reason:
   * the hosting capability is a fact this file must state it is not conferring,
   * not one it happens to omit. Every occurrence is therefore expected to be a
   * zero, and the workerd suite counts the rows to prove the database agrees.
   *
   * THE RUNNER HAS TO NAME THE ALTERNATIVE. `PLATFORM_ADMINS` is the one way an
   * operator is created (REQ-185), and a seed that merely declined to create one
   * without saying what does would leave a fresh clone with nobody privileged and
   * no hint about it.
   */
  it('test_UAT_FC_REQ-192_the_seed_confers_no_hosting_capability', () => {
    const body = sql
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
    expect(body).toContain('platform_operator')
    expect(body).not.toMatch(/platform_operator[^,)]*[1-9]/)
    expect(runner).toContain('PLATFORM_ADMINS')
  })
})
