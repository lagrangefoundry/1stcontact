// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../apps/control-app/src/index'
import { SIGN_OUT_EVERYWHERE } from '../apps/control-app/src/sign-in'
import { SIGN_OUT_PATH } from '../apps/control-app/src/sessions'
import { openAccountSurface } from '../apps/control-app/src/builder/business.js'
import {
  SIGN_OUT_EVERYWHERE_FIELD,
  SIGN_OUT_EVERYWHERE_HINT,
  SIGN_OUT_EVERYWHERE_LABEL,
  SIGN_OUT_HREF,
} from '../apps/control-app/src/builder/config.js'

/**
 * REQ-231 — **the parts of rotation that are configuration rather than code.**
 *
 * WHAT THIS FILE IS FOR. `test_UAT_FC_REQ-231_rotation.workers` drives the
 * behaviour inside workerd. Everything here is a claim about a FILE — a cron
 * that is declared in one environment and not the other, a migration written in
 * a shape a fresh database cannot survive, a control posting a field nothing
 * reads. None of them fails a test elsewhere; every one of them fails in
 * production, quietly, weeks later.
 *
 * THE THREE FALSIFIERS, in the order they would go unnoticed longest:
 *
 *   - *a cron declared at the top level and not under `[env.production]`* —
 *     `wrangler dev` sweeps and the deployment never does, so the retired rows
 *     accumulate on the only database anybody has;
 *   - *`0002` written as four `ALTER TABLE ADD COLUMN`* — correct for the live
 *     database and a hard error on every fresh one, discovered by whoever next
 *     creates an environment;
 *   - *a Sign out everywhere control posting a field the Worker does not read* —
 *     a button that reports success and ends one browser's session, which is the
 *     class of defect [[REQ-183]] §4.2 refuses for a Delete account button that
 *     deletes nothing.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const CONTROL = readFileSync(path.join(REPO, 'apps', 'control-app', 'wrangler.toml'), 'utf8')
const BASELINE = readFileSync(path.join(REPO, 'db', 'migrations', '0001_baseline.sql'), 'utf8')
const ROTATION = readFileSync(
  path.join(REPO, 'db', 'migrations', '0002_session_rotation.sql'),
  'utf8',
)

/** A file's SQL, with the prose it argues in removed. */
const sqlOf = (source: string): string =>
  source
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

/** The `sessions` CREATE TABLE, whitespace-collapsed, out of a migration. */
function sessionsDdl(source: string): string {
  const match = /CREATE TABLE IF NOT EXISTS sessions\s*\([^;]*\)/.exec(sqlOf(source))
  expect(match, 'no sessions CREATE TABLE in this migration').not.toBeNull()
  return match![0].replace(/\s+/g, ' ')
}

describe('REQ-231 — the sweep has somewhere to run', () => {
  it('test_UAT_FC_REQ-231_the_worker_exports_a_scheduled_handler', () => {
    // A `[triggers]` block against a Worker with no `scheduled` export is a
    // deploy that succeeds and a cron that fires into nothing. Both halves or
    // neither.
    expect(typeof worker.scheduled).toBe('function')
  })

  it('test_UAT_FC_REQ-231_the_cron_is_declared_in_both_environments_and_agrees', () => {
    // A named wrangler environment inherits `triggers` — so this repeat is
    // redundant TODAY, and is asserted anyway for the reason this file's every
    // other var is: nothing here may depend on remembering which keys inherit,
    // and the failure mode of losing the production half is silent.
    const declared = [...CONTROL.matchAll(/^crons\s*=\s*(\[[^\]]*\])/gm)].map((m) => m[1])
    expect(declared, 'crons is declared in both blocks').toHaveLength(2)
    expect(declared[0]).toBe(declared[1])
    expect(CONTROL).toMatch(/^\[triggers\]$/m)
    expect(CONTROL).toMatch(/^\[env\.production\.triggers\]$/m)
    // A schedule, not an empty list: `crons = []` parses, deploys, and sweeps
    // nothing.
    expect(declared[0]).toMatch(/"[^"]+"/)
  })
})

describe('REQ-231 — the migration can be applied to every database, not just one', () => {
  it('test_UAT_FC_REQ-231_the_rotation_migration_adds_no_column_to_a_table_that_may_have_it', () => {
    // THE DECISION THIS FILE EXISTS TO PIN. Upstream's own migrator issues four
    // `ALTER TABLE sessions ADD COLUMN` and is safe because it reads
    // `PRAGMA table_info` first and skips what is already there. That code does
    // not run here — wrangler reads `.sql` off disk — and SQLite has no
    // `ADD COLUMN IF NOT EXISTS`, so the same four statements in a migration
    // file are a hard error on every database created from the updated baseline.
    // The rebuild converges from both shapes; a later hand reaching for the
    // obvious four is what this catches.
    expect(sqlOf(ROTATION)).not.toMatch(/ALTER TABLE\s+sessions\s+ADD COLUMN/i)
  })

  it('test_UAT_FC_REQ-231_both_migrations_declare_the_same_sessions_table', () => {
    // A migrated database and a fresh one must not merely agree about columns —
    // they must have been built by the same text, or there are two schemas for
    // the component to be correct against and only one of them is the one
    // `SCHEMA_STATEMENTS` is compared to.
    expect(sessionsDdl(ROTATION)).toBe(sessionsDdl(BASELINE))
    // And the shape is the rotation shape, named rather than inferred: every
    // column below is one the component writes.
    for (const column of ['issued_at', 'origin_id', 'superseded_by', 'retired_at']) {
      expect(sessionsDdl(BASELINE)).toContain(column)
    }
  })

  it('test_UAT_FC_REQ-231_the_migration_backfills_the_chain_an_old_session_always_was', () => {
    // WITHOUT `origin_id` SIGN-OUT SILENTLY STOPS WORKING for everybody signed
    // in before the deploy: `endSession` deletes by chain, and a chain of NULL
    // matches nothing. The workers suite proves the backfill runs; this states
    // that it is in the file at all, which is the part a reformat could lose.
    const sql = sqlOf(ROTATION)
    expect(sql).toMatch(/UPDATE sessions SET origin_id = id WHERE origin_id IS NULL/)
    expect(sql).toMatch(/UPDATE sessions SET issued_at = created_at WHERE issued_at IS NULL/)
  })

  it('test_UAT_FC_REQ-231_the_indexes_rotation_needs_are_declared_where_the_table_is', () => {
    // The rebuild drops the table and takes its indexes with it, so `0002` has
    // to recreate ALL FOUR rather than only the two REQ-151 added — and the
    // baseline has to carry the same four, or a fresh database is missing the
    // ones the sweep and the chain-delete are written against.
    for (const index of [
      'idx_sessions_subject_id',
      'idx_sessions_expires_at',
      'idx_sessions_origin_id',
      'idx_sessions_retired_at',
    ]) {
      expect(sqlOf(BASELINE), `the baseline is missing ${index}`).toContain(index)
      expect(sqlOf(ROTATION), `the rebuild does not restore ${index}`).toContain(index)
    }
  })
})

describe('REQ-231 — the control that ends a sign-in everywhere', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  const control = (): HTMLFormElement | null =>
    document.querySelector<HTMLFormElement>('.builder-account__sign-out-everywhere')

  it('test_UAT_FC_REQ-231_the_account_dialog_posts_a_wider_sign_out', () => {
    const host = document.createElement('div')
    document.body.append(host)
    openAccountSurface({ host, person: { name: 'Sam', email: 'sam@example.test' } })

    const form = control()
    expect(form, 'no sign-out-everywhere control in the dialog').not.toBeNull()
    expect(form!.method.toLowerCase()).toBe('post')
    expect(new URL(form!.action, 'https://app.example.test').pathname).toBe(SIGN_OUT_HREF)

    // THE FIELD IS IN THE BODY AND NOT IN THE URL. What distinguishes the two
    // sign-outs must not survive being copied out of history or a referrer.
    const flag = form!.querySelector<HTMLInputElement>(`input[name="${SIGN_OUT_EVERYWHERE_FIELD}"]`)
    expect(flag, 'the form carries no everywhere field').not.toBeNull()
    expect(flag!.type).toBe('hidden')
    expect(flag!.value).toBe('1')

    const button = form!.querySelector('button')
    expect(button!.type).toBe('submit')
    expect(button!.textContent).toBe(SIGN_OUT_EVERYWHERE_LABEL)
    // The hint is beside it, because the reason to press this is not derivable
    // from its name: it is the answer to a device somebody no longer has.
    expect(document.body.textContent).toContain(SIGN_OUT_EVERYWHERE_HINT)
  })

  it('test_UAT_FC_REQ-231_the_field_the_control_sends_is_the_field_the_worker_reads', () => {
    // The builder is browser JavaScript and cannot import the Worker's
    // TypeScript, so the two literals are held equal here rather than by an
    // import — exactly as `SIGN_OUT_HREF` is held to `SIGN_OUT_PATH`. A field
    // nothing reads is a control that reports success and does the narrow thing.
    expect(SIGN_OUT_EVERYWHERE_FIELD).toBe(SIGN_OUT_EVERYWHERE)
    expect(SIGN_OUT_HREF).toBe(SIGN_OUT_PATH)
  })

  it('test_UAT_FC_REQ-231_the_label_says_what_the_button_does', () => {
    // THIS CONTROL IS DESTRUCTIVE IN A WAY ITS NEIGHBOUR IS NOT — it ends
    // sessions on machines the person is not looking at, and the only undo is
    // signing in again on each of them. A label that read "Sign out" beside
    // another button reading "Sign out" would be a coin toss.
    expect(SIGN_OUT_EVERYWHERE_LABEL.toLowerCase()).toContain('everywhere')
    expect(SIGN_OUT_EVERYWHERE_LABEL).not.toBe('Sign out')
  })
})
