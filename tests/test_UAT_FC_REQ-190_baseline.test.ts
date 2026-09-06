import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * REQ-190 — **the rebaseline, asserted as a fact about the repository.**
 *
 * The workers suite proves what the schema DOES. This proves what replaced it:
 * one baseline instead of nine migrations, a platform business id two files have
 * to agree on, no people seeded, no claim table, and one minter of keys.
 *
 * WHY ANY OF THIS NEEDS A TEST AT ALL. Every claim here is about an ABSENCE, and
 * an absence is the one kind of property that a passing suite never notices
 * going away. A tenth migration would apply cleanly. A second `newId` would mint
 * perfectly good ids. A `TENANT_ID` that disagreed with the baseline would fail
 * only at runtime, in production, as `UnknownTenantError` on every request —
 * because nothing about a 128-bit literal is derivable, so nothing but a
 * comparison can notice the two copies drifting.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const MIGRATIONS = path.join(REPO, 'db', 'migrations')
const BASELINE = path.join(MIGRATIONS, '0001_baseline.sql')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

const baseline = fs.readFileSync(BASELINE, 'utf8')
const toml = fs.readFileSync(WRANGLER, 'utf8')

/** The DDL with its prose removed — this file argues in comments about SQL. */
const ddl = baseline
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

/**
 * Source with its comments removed.
 *
 * EVERY CLAIM BELOW IS ABOUT AN ABSENCE, and the files that removed a thing are
 * exactly the files that explain at length why it is gone — so a scan over raw
 * text would find `published_sites` in the paragraph saying there is no
 * `published_sites`, and fail on its own justification. The same trap caught
 * REQ-162's transcription check and REQ-167's check-constraint case; both strip
 * prose first, and so does this.
 */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/**
 * Every authored `.ts`/`.js` file under the source roots.
 *
 * BUILD OUTPUT IS EXCLUDED, and the dot-directory rule is the load-bearing part
 * of that. the `index.js` wrangler writes under
 * `apps/control-app/.wrangler/tmp/` is a BUNDLE — every
 * module in the Worker's graph concatenated — written by `unstable_dev` and left
 * behind by whichever suite ran last. A scan that read it would find every
 * symbol in the repository in one file, so both checks below would pass or fail
 * depending on which tests had run first, which is worse than not checking.
 */
const GENERATED = new Set(['node_modules', 'dist', 'dist-assets', 'generated'])

function sourceFiles(): string[] {
  const found: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || GENERATED.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(ts|js)$/.test(entry.name)) found.push(full)
    }
  }
  for (const root of ['apps', 'tools', 'packages']) walk(path.join(REPO, root))
  return found.sort()
}

describe('REQ-190 — one baseline', () => {
  it('test_UAT_FC_REQ-190_the_migrations_directory_is_one_baseline', () => {
    // `0001`–`0009` are gone, replaced by one file. D1 cannot alter a primary
    // key in place, so re-keying `sites` incrementally would have been eight
    // create-copy-drop-rename rebuilds carrying data that does not exist —
    // and the nine files it replaces were themselves a chain of repairs, each
    // fixing something the one before had left (`0003` adding the column `0001`
    // created `tenants` without; `0006` having to follow `0005` because `0005`
    // was written against the old column names).
    const files = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()
    expect(files).toEqual(['0001_baseline.sql'])
  })

  it('test_UAT_FC_REQ-190_tenant_id_literal', () => {
    // THE LITERAL TWO FILES MUST AGREE ON. `TENANT_ID` names the platform
    // business by key now, and the baseline seeds that exact id. A mismatch is
    // `UnknownTenantError` on every deployed request, and nothing else in the
    // system could notice it — which is the whole reason this assertion exists.
    //
    // BOTH BLOCKS, because a named wrangler environment inherits no vars: a
    // value correct at the top level and stale under `[env.production.vars]` is
    // the failure discovered at the worst possible moment.
    const declared = [...toml.matchAll(/^TENANT_ID\s*=\s*"([^"]+)"/gm)].map((m) => m[1])
    expect(declared, 'TENANT_ID is declared in both blocks').toHaveLength(2)
    expect(declared[0]).toBe(declared[1])

    // It is a key, not a word — the defect this ticket exists to remove.
    expect(declared[0]).toMatch(/^[a-z]+_[0-9a-f]{32}$/)

    // And it is the row the baseline seeds.
    const seeded = /INSERT OR IGNORE INTO tenants[\s\S]*?VALUES\s*\(\s*'([^']+)'/.exec(ddl)
    expect(seeded, 'the baseline seeds a platform business').not.toBeNull()
    expect(seeded![1]).toBe(declared[0])
  })

  it('test_UAT_FC_REQ-190_the_baseline_seeds_no_people', () => {
    // `0005` hardcoded one personal address into a migration that ran in every
    // environment, forever, including ones that address should never be able to
    // enter. `ensurePlatformOperator` writes the same four rows from
    // `PLATFORM_ADMINS`, works before any row exists, and cannot be revoked by
    // the database it repairs — so carrying the seed forward would be two ways
    // to create one set of rows, one of them unreachable by anyone reading the
    // code.
    const inserts = [...ddl.matchAll(/INSERT[^;]*?INTO\s+(\w+)/gi)].map((m) => m[1].toLowerCase())
    expect(inserts).toEqual(['tenants'])
    expect(ddl).not.toMatch(/@/)
  })

  it('test_UAT_FC_REQ-190_there_is_no_claim_table_and_no_reader_of_one', () => {
    // `published_sites` existed to make one data field — the slug — globally
    // unique, because `/site/<slug>/` carried no business. The published address
    // is the site's key now, so there is nothing left to claim. Asserted over
    // the SOURCE as well as the schema: a query against a table that does not
    // exist fails at runtime, in the one Worker whose failures are public.
    expect(ddl).not.toMatch(/published_sites/i)
    const offenders = sourceFiles()
      .filter((f) => /published_sites|SlugClaimedError/.test(code(fs.readFileSync(f, 'utf8'))))
      .map((f) => path.relative(REPO, f))
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_REQ-190_there_is_one_minter_of_keys', () => {
    // "A key is a surrogate THE SYSTEM MINTS" stops being a property the moment
    // there are two minters. `newId` moved down into the store layer because the
    // store is where a site comes into existence and `control-app` imports
    // `tools/generate` rather than the reverse; `identity.ts` re-exports it. So
    // exactly one file may call the CSPRNG for this purpose.
    const offenders = sourceFiles()
      .filter((f) => /\.ts$/.test(f) && !/\.d\.ts$/.test(f))
      .filter((f) => /crypto\.getRandomValues/.test(code(fs.readFileSync(f, 'utf8'))))
      .map((f) => path.relative(REPO, f))
    expect(offenders).toEqual(['tools/generate/src/store/ids.ts'])
  })

  it('test_UAT_FC_REQ-190_the_schema_carries_no_composite_key_made_of_data', () => {
    // The rule, read off the DDL. Every `PRIMARY KEY` is either a single opaque
    // column or a pair whose parts are themselves keys or ordinals — never a
    // name somebody chose.
    //
    // `site_pages`/`site_assets` are keyed `(site_id, name)` and the `name` is a
    // STORE KEY (`home.json`), not a chosen label: it is how the port addresses
    // a page, it carries no directory component, and renaming one is not an
    // operation the product has. `counters` is keyed by a business and a type
    // name the code supplies. Those are named here so the list is a decision
    // rather than whatever happened to be in the file.
    const declared = [...ddl.matchAll(/PRIMARY KEY \(([^)]+)\)/g)].map((m) =>
      m[1].split(',').map((c) => c.trim()),
    )
    expect(declared).toEqual([
      ['site_id', 'name'], // site_pages
      ['site_id', 'name'], // site_assets
      ['site_id', 'at'], // site_changes — `at` is the journal counter
      ['site_id', 'id'], // site_revisions — `id` is the revision's position
      ['tenant_id', 'type'], // counters
    ])
    // And every table keyed on a single column keys on an opaque TEXT id:
    // `tenants`, `sites`, `users`, `user_emails`, `contact_events`,
    // `memberships`, `entitlements` and `tickets`.
    // NINE, NOT EIGHT — `tenants` is declared twice, because the ticket store's
    // DDL is the component's own, transcribed, and its `IF NOT EXISTS` CREATE is
    // the no-op the header describes. Spelling that out here rather than
    // loosening the assertion: the duplicate is load-bearing (a UAT asserts
    // every `SCHEMA_STATEMENTS` entry appears verbatim) and a reader who tidied
    // it away would break that check instead of this one.
    //
    // `user_emails` IS THE ONE REQ-191 ADDED, and it is the rule restated rather
    // than an exception to it: the address is an attribute with a key of its own,
    // where it used to BE the key of the person holding it.
    //
    // `contact_events` IS REQ-195's, AND IS THE SAME RULE UNDER PRESSURE. An
    // event has a natural-looking composite — the contact, the kind and the
    // instant — and keying on it would make two identical facts at the same
    // millisecond unrepresentable, which is exactly what a log must be able to
    // hold: pressing Invite twice in a second is two presses.
    const single = [...ddl.matchAll(/^\s*(\w+)\s+TEXT PRIMARY KEY/gm)].map((m) => m[1])
    expect(single.sort()).toEqual(['id', 'id', 'id', 'id', 'id', 'id', 'id', 'id', 'uid'])
  })
})
