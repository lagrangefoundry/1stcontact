import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { migrateHookHarness, sha256 } from './support/migrate-hook'

/**
 * [[REQ-291]] — **the deploy fails when an applied migration's content has
 * changed.**
 *
 * THE TEST IS THE INCIDENT, REPLAYED. `0001_baseline.sql` was applied to
 * production on 2026-09-06 and then edited twelve times ([[EPIC-16]] §H).
 * `d1_migrations` records a migration's name and the moment it ran and nothing
 * else, so wrangler considered the file done forever and started at `0002` —
 * whose first statement renames a table the applied baseline never created. The
 * first case below is that state, constructed: an environment reporting the
 * baseline as applied, a manifest holding the hash of the bytes it applied, and
 * a different file on disk. It fails, and it names the file.
 *
 * WHAT MAKES THIS EVIDENCE. It runs the SHIPPED hook — the same file `bin/deploy`
 * executes — against the SHIPPED `bin/migration-manifest`, with only `npx`
 * stubbed so that the deployed database's answer is the test's to dictate. A test
 * that grepped either file for the word `fail` would pass on a script that
 * printed it and exited 0.
 *
 * THE OTHER HALF OF EVERY CASE IS WHAT RAN AFTERWARDS. A check that refuses and
 * then applies the migrations anyway is indistinguishable from one that refuses,
 * unless somebody looks — so every case asserts on the `wrangler d1 migrations`
 * invocations the hook did or did not reach.
 */

const REPO = path.resolve(import.meta.dirname, '..')

/** The baseline as production applied it, and as it reads after the edits. */
const APPLIED_BASELINE = 'CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY);\n'
const EDITED_BASELINE =
  'CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY);\nCREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY);\n'
const ROTATION = 'ALTER TABLE sessions RENAME TO sessions_pre_rotation;\n'

const hook = migrateHookHarness()
afterAll(() => hook.dispose())

describe('REQ-291 — an applied migration whose bytes have changed stops the deploy', () => {
  it('test_UAT_FC_REQ-291_the_edited_baseline_fails_the_deploy_and_names_the_file', () => {
    const r = hook.run({
      files: { '0001_baseline.sql': EDITED_BASELINE, '0002_session_rotation.sql': ROTATION },
      // What production recorded on 2026-09-06 — the baseline BEFORE the edits.
      manifest: { '0001_baseline.sql': sha256(APPLIED_BASELINE), '0002_session_rotation.sql': true },
      applied: ['0001_baseline.sql'],
    })

    expect(r.code).toBe(1)
    // THE FILE, THE ENVIRONMENT, AND BOTH HASHES. An operator reading only this
    // has to be able to tell which file, which database, and that the difference
    // is in content rather than in whether it ran.
    expect(r.out).toContain('0001_baseline.sql')
    expect(r.out).toContain('production')
    expect(r.out).toContain(sha256(APPLIED_BASELINE))
    expect(r.out).toContain(sha256(EDITED_BASELINE))

    // AND NOTHING WAS APPLIED. `0002` is the migration that would have opened
    // `ALTER TABLE sessions` against a database with no `sessions` table.
    expect(r.migrations).toEqual([])
  })

  it('test_UAT_FC_REQ-291_a_migration_the_environment_has_not_applied_is_not_checked', () => {
    // THE ORDINARY CASE OF SHIPPING A MIGRATION. `0002` differs from what the
    // manifest holds — it is being written right now — and the environment has
    // never run it, so its content is whatever it is and the deploy proceeds.
    // A check that refused here would make adding a migration impossible.
    const r = hook.run({
      files: { '0001_baseline.sql': APPLIED_BASELINE, '0002_session_rotation.sql': ROTATION },
      manifest: { '0001_baseline.sql': true, '0002_session_rotation.sql': sha256('-- an older draft\n') },
      applied: ['0001_baseline.sql'],
    })

    expect(r.code).toBe(0)
    expect(r.migrations).toEqual(['apply 1stcontact --env production --remote'])
  })

  it('test_UAT_FC_REQ-291_a_rehearsal_runs_the_same_verification', () => {
    // THE WHOLE VALUE IS CATCHING THIS BEFORE THE DEPLOY THAT WOULD HAVE
    // DISCOVERED IT, and the comparison is a read — so `--dry-run` refuses on
    // exactly the state the real deploy refuses on, and never reaches the list.
    const rehearsal = hook.run({
      files: { '0001_baseline.sql': EDITED_BASELINE },
      manifest: { '0001_baseline.sql': sha256(APPLIED_BASELINE) },
      applied: ['0001_baseline.sql'],
      dryRun: true,
    })
    expect(rehearsal.code).toBe(1)
    expect(rehearsal.out).toContain('0001_baseline.sql')
    expect(rehearsal.migrations).toEqual([])

    // AND A CLEAN REHEARSAL STILL REHEARSES — the check is an addition to the
    // dry run, not a replacement for it.
    const clean = hook.run({
      files: { '0001_baseline.sql': APPLIED_BASELINE },
      applied: ['0001_baseline.sql'],
      dryRun: true,
    })
    expect(clean.code).toBe(0)
    expect(clean.migrations).toEqual(['list 1stcontact --env production --remote'])
  })

  it('test_UAT_FC_REQ-291_it_reports_rather_than_repairs', () => {
    // THE REMEDY IS A DECISION ABOUT DATA — rebaseline an environment with
    // nothing in it, or write a corrective migration for one with customers —
    // and a script cannot make that call and must not appear to. So the refusal
    // states both options and changes nothing: no migration is applied, and the
    // manifest it just disagreed with is left exactly as it was.
    const r = hook.run({
      files: { '0001_baseline.sql': EDITED_BASELINE },
      manifest: { '0001_baseline.sql': sha256(APPLIED_BASELINE) },
      applied: ['0001_baseline.sql'],
    })

    expect(r.code).toBe(1)
    expect(r.out).toMatch(/rebaseline/i)
    expect(r.out).toMatch(/corrective migration/i)
    expect(r.out).toMatch(/Nothing was uploaded/i)
    expect(r.migrations).toEqual([])
  })

  it('test_UAT_FC_REQ-291_wranglers_own_chatter_does_not_become_the_answer', () => {
    // THE HOOK MERGES STDERR IN so that a failure carries its own explanation,
    // and wrangler says things on its way to answering — `▲ [WARNING] Proxy
    // environment variables detected` on any machine behind a proxy. That line
    // contains a bracket, so a reader that took the first `[` as the start of the
    // document would fail to parse it and refuse a deploy that was perfectly
    // fine. A gate that fires on a warning about a proxy is a gate people
    // disable.
    const chatter = '▲ [WARNING] Proxy environment variables detected. We\'ll use your proxy.'

    const clean = hook.run({
      files: { '0001_baseline.sql': APPLIED_BASELINE },
      applied: ['0001_baseline.sql'],
      chatter,
    })
    expect(clean.code).toBe(0)
    expect(clean.migrations).toEqual(['apply 1stcontact --env production --remote'])

    // And the drift underneath the same chatter is still found.
    const drifted = hook.run({
      files: { '0001_baseline.sql': EDITED_BASELINE },
      manifest: { '0001_baseline.sql': sha256(APPLIED_BASELINE) },
      applied: ['0001_baseline.sql'],
      chatter,
    })
    expect(drifted.code).toBe(1)
    expect(drifted.out).toContain('0001_baseline.sql')
    expect(drifted.migrations).toEqual([])
  })

  it('test_UAT_FC_REQ-291_an_applied_migration_with_no_manifest_entry_is_refused', () => {
    // A TRIPWIRE THAT CAN BE DISARMED BY DELETING A LINE IS NOT A TRIPWIRE. An
    // applied migration the manifest says nothing about cannot be checked, which
    // is a stale manifest rather than drift — so the refusal says what to type
    // rather than what to decide.
    const r = hook.run({
      files: { '0001_baseline.sql': APPLIED_BASELINE },
      manifest: {},
      applied: ['0001_baseline.sql'],
    })

    expect(r.code).toBe(1)
    expect(r.out).toContain('0001_baseline.sql')
    expect(r.out).toContain('bin/migration-manifest')
    expect(r.migrations).toEqual([])
  })

  it('test_UAT_FC_REQ-291_an_environment_that_could_not_be_read_is_not_a_yes', () => {
    // THE DIRECTORY'S STANDING ASYMMETRY ([[REQ-149]], [[REQ-259]]): only a
    // positive read counts, because the failure being guarded against is a
    // confident skip based on an answer nobody actually got.
    const unreadable = hook.run({
      files: { '0001_baseline.sql': APPLIED_BASELINE },
      applied: [],
      executeError: 'Authentication error [code: 10000]',
    })
    expect(unreadable.code).toBe(1)
    expect(unreadable.out).toMatch(/could not read the migrations/i)
    expect(unreadable.migrations).toEqual([])

    // THE ONE EXCEPTION IS STATED BY THE ERROR ITSELF. A database with no
    // `d1_migrations` table has applied nothing, which is a fact about the
    // environment rather than a failure to read one — so a first deploy into an
    // empty database proceeds.
    const empty = hook.run({
      files: { '0001_baseline.sql': APPLIED_BASELINE },
      applied: [],
      executeError: 'no such table: d1_migrations: SQLITE_ERROR [code: 7500]',
    })
    expect(empty.code).toBe(0)
    expect(empty.migrations).toEqual(['apply 1stcontact --env production --remote'])
  })

  it('test_UAT_FC_REQ-291_a_migration_this_checkout_does_not_have_is_reported_not_refused', () => {
    // An older checkout against a newer environment is an ordinary state, not an
    // error — the same judgement `tools/generate/src/cli/d1-migrations.ts` makes
    // about a local database that is ahead of the files beside it. There is
    // nothing to compare, so it is said out loud and the deploy continues.
    const r = hook.run({
      files: { '0001_baseline.sql': APPLIED_BASELINE },
      applied: ['0001_baseline.sql', '0099_from_a_newer_branch.sql'],
    })

    expect(r.code).toBe(0)
    expect(r.out).toContain('0099_from_a_newer_branch.sql')
    expect(r.out).toMatch(/not in this checkout/i)
    expect(r.migrations).toEqual(['apply 1stcontact --env production --remote'])
  })
})

describe('REQ-291 — the manifest is refreshed deliberately', () => {
  /** A throwaway checkout holding just the two files the command reads. */
  function tree(files: Record<string, string>): string {
    const repo = mkdtempSync(path.join(tmpdir(), 'manifest-cmd-'))
    const appDir = path.join(repo, 'apps', 'control-app')
    mkdirSync(appDir, { recursive: true })
    mkdirSync(path.join(repo, 'db', 'migrations'), { recursive: true })
    writeFileSync(
      path.join(appDir, 'wrangler.toml'),
      '[[d1_databases]]\nmigrations_dir = "../../db/migrations"\n',
    )
    for (const [name, body] of Object.entries(files)) {
      writeFileSync(path.join(repo, 'db', 'migrations', name), body)
    }
    return repo
  }

  function run(repo: string, args: string[] = []) {
    const r = spawnSync('node', [path.join(REPO, 'bin', 'migration-manifest'), ...args], {
      env: { ...process.env, DEPLOY_REPO_ROOT: repo },
      encoding: 'utf8',
    })
    return { code: r.status, out: `${r.stdout}${r.stderr}` }
  }

  it('test_UAT_FC_REQ-291_regenerating_is_its_own_command_and_names_a_changed_hash', () => {
    const repo = tree({ '0001_baseline.sql': APPLIED_BASELINE })
    const manifest = path.join(repo, 'db', 'migrations', 'manifest.json')

    // IT IS GENERATED FROM db/migrations/ AND COMMITTED — a map of filename to
    // the SHA-256 of that file's bytes, which is the record `d1_migrations`
    // cannot hold without a schema change to a table wrangler owns.
    expect(run(repo).code).toBe(0)
    expect(JSON.parse(readFileSync(manifest, 'utf8'))).toEqual({
      '0001_baseline.sql': sha256(APPLIED_BASELINE),
    })

    // A NEW MIGRATION IS AN ADDED KEY, and reads as ordinary.
    writeFileSync(path.join(repo, 'db', 'migrations', '0002_session_rotation.sql'), ROTATION)
    const added = run(repo)
    expect(added.code).toBe(0)
    expect(added.out).toMatch(/added\s+0002_session_rotation\.sql/)
    expect(added.out).not.toMatch(/CHANGED/)

    // AN EDIT TO A MIGRATION THAT ALREADY EXISTED IS A CHANGED VALUE, reported
    // as such and with both hashes — which is what `git diff` will show a
    // reviewer, and what somebody then has to justify.
    writeFileSync(path.join(repo, 'db', 'migrations', '0001_baseline.sql'), EDITED_BASELINE)
    const changed = run(repo, ['--check'])
    expect(changed.code).toBe(1)
    expect(changed.out).toMatch(/CHANGED\s+0001_baseline\.sql/)
    expect(changed.out).toContain(sha256(APPLIED_BASELINE))
    expect(changed.out).toContain(sha256(EDITED_BASELINE))

    // AND `--check` CHANGED NOTHING, because a hash that refreshed itself as a
    // side effect of being looked at could never disagree with anything.
    expect(JSON.parse(readFileSync(manifest, 'utf8'))['0001_baseline.sql']).toBe(
      sha256(APPLIED_BASELINE),
    )
  })

  it('test_UAT_FC_REQ-291_the_committed_manifest_covers_this_repository_s_migrations', () => {
    // PRESENCE, NOT EQUALITY, and the distinction is the whole design. Asserting
    // that every hash matches its file would be a test that regenerates the
    // manifest's meaning away: the manifest lags on purpose, and that lag is what
    // makes an edit visible. What must hold is that no applied migration is
    // missing from it, because a file with no entry is one the deploy check
    // cannot speak for.
    const dir = path.join(REPO, 'db', 'migrations')
    const manifest = JSON.parse(readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
    const files = readdirSync(dir).filter((n) => n.endsWith('.sql') && !n.startsWith('.'))

    expect(files.length).toBeGreaterThan(0)
    for (const name of files) expect(manifest).toHaveProperty([name])
    // And no entry names a file that is not there, which would be an applied
    // migration somebody deleted.
    expect(Object.keys(manifest).sort()).toEqual(files.sort())
  })
})

describe('REQ-291 — the command an operator has to type is one they can type', () => {
  it('test_UAT_FC_REQ-291_bin_migration_manifest_ships_executable', () => {
    // The hook spawns it through `node` and would not care, but the refusal it
    // prints tells an operator to run `bin/migration-manifest` — so the bit that
    // makes that sentence true is part of the claim.
    const file = path.join(REPO, 'bin', 'migration-manifest')
    expect(readFileSync(file, 'utf8').startsWith('#!/usr/bin/env node')).toBe(true)
    expect(statSync(file).mode & 0o111).not.toBe(0)
  })
})
