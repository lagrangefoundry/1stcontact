import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { TICKETING_INSTALLED, TICKETING_SKIP_REASON } from './support/ticketing-installed'

/**
 * REQ-162 — the ticket store's configuration, pinned.
 *
 * THREE CLAIMS, and each is a one-line mistake that production would not
 * announce.
 *
 * 1. THE BLOB BUCKET IS NOT THE SITE BUCKET. `1stcontact-sites` is bound by
 *    `apps/public-site`, whose entire job is serving bytes to the public
 *    internet by path. Attachment blobs are the opposite kind of object — brand
 *    guidelines, positioning papers, competitor captures — and sharing the
 *    bucket would leave only routing code between a client's confidential
 *    document and a public URL. BUG-31 ([[DOC-12]] §7) is the same class of
 *    mistake with a kinder failure mode: there a shared keyspace could overwrite
 *    published bytes, and a key prefix was enough. Here the failure is
 *    disclosure rather than overwrite, so a prefix — a convention, enforced by
 *    whoever remembers it — is not enough, and the boundary has to be a bucket.
 *
 * 2. BOTH HALVES DECLARE IT. A named wrangler environment inherits neither vars
 *    nor bindings. REQ-144 paid for that lesson on a var and REQ-143 pinned it
 *    for the store's bindings; this is the same assertion for the third.
 *
 * 3. THE MIGRATION HAS NOT FORKED FROM THE COMPONENT. `SCHEMA_STATEMENTS` is
 *    the ticketing component's own DDL, and wrangler's migration runner reads
 *    `.sql` off disk and cannot import a JS constant — so the statements are
 *    transcribed, and a transcription is a fork unless something checks it.
 *    This is that something.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const MIGRATION = path.join(REPO, 'db', 'migrations', '0003_ticket_store.sql')

const toml = readFileSync(WRANGLER, 'utf8')

/** The `[env.production]` half of the file, and everything before it. */
function split(source: string): { top: string; production: string } {
  const match = /^\[env\.production\]$/m.exec(source)
  expect(match, 'control-app declares an [env.production] environment').not.toBeNull()
  return { top: source.slice(0, match!.index), production: source.slice(match!.index) }
}

/** Every `[[…r2_buckets]]` block in a half, as `binding -> bucket_name`. */
function buckets(half: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const block of half.split(/\[\[[^\]]*r2_buckets\]\]/).slice(1)) {
    const binding = /binding\s*=\s*"([^"]+)"/.exec(block)?.[1]
    const bucket = /bucket_name\s*=\s*"([^"]+)"/.exec(block)?.[1]
    if (binding && bucket) out.set(binding, bucket)
  }
  return out
}

describe('REQ-162 — the blob bucket', () => {
  const { top, production } = split(toml)

  it('UAT_FC_REQ-162 control-app declares a BLOBS bucket for local development', () => {
    expect(buckets(top).get('BLOBS')).toBeDefined()
  })

  it('UAT_FC_REQ-162 the BLOBS binding is repeated under [env.production]', () => {
    // The claim REQ-144's incident makes worth asserting: a named environment
    // inherits nothing, so the production half must restate all of it. Missing
    // this one is not a silent degradation — `ticketStoreFor` throws at
    // construction — but a Worker that refuses to build a store is still a
    // builder that cannot accept an upload.
    expect(buckets(production).get('BLOBS')).toBeDefined()
  })

  it('UAT_FC_REQ-162 both halves name the same bucket for BLOBS', () => {
    expect(buckets(production).get('BLOBS')).toBe(buckets(top).get('BLOBS'))
  })

  it('UAT_FC_REQ-162 the blob bucket is not the bucket public-site serves', () => {
    // THE SECURITY CLAIM, and the reason this file exists. Asserted on both
    // halves independently: production is the deployment that matters and is
    // also the one nothing else would catch.
    for (const half of [buckets(top), buckets(production)]) {
      expect(half.get('BLOBS')).not.toBe(half.get('SITES'))
      expect(half.get('BLOBS')).not.toBe('1stcontact-sites')
    }
    // And the site bucket is still declared — a "distinct" assertion passes
    // trivially if SITES has been dropped, which would break publishing instead.
    expect(buckets(top).get('SITES')).toBe('1stcontact-sites')
    expect(buckets(production).get('SITES')).toBe('1stcontact-sites')
  })
})

describe('REQ-162 — the migration', () => {
  const sql = readFileSync(MIGRATION, 'utf8')

  /** Collapse whitespace so formatting is not what this compares. */
  const flat = (s: string) => s.replace(/\s+/g, ' ').trim()

  it('UAT_FC_REQ-162 migrations_dir picks it up beside the existing two', () => {
    // `wrangler d1 migrations apply` applies a DIRECTORY in lexical order, so
    // the file only runs if it is named into the same sequence — and the order
    // matters, because 0001 creates `tenants` without the column 0003 adds.
    const dir = /migrations_dir\s*=\s*"([^"]+)"/.exec(toml)
    expect(dir).not.toBeNull()
    expect(path.resolve(path.dirname(WRANGLER), dir![1])).toBe(path.dirname(MIGRATION))
    expect(path.basename(MIGRATION)).toMatch(/^0003_/)
  })

  it('UAT_FC_REQ-162 it reconciles the tenants table the site store already created', () => {
    // The one place the migration is NOT a transcription, and the one place it
    // has to be. `0001_site_store.sql` created `tenants` for the site store
    // WITHOUT a `config` column; the component's own CREATE is `IF NOT EXISTS`,
    // so it sees that table and leaves it alone. `Accessor.putTenant` INSERTs
    // `config`, so without this ALTER the first tenant registration through the
    // ticket store fails with `no such column: config` — a migration that
    // appears to have applied the schema and has not.
    expect(flat(sql)).toContain('ALTER TABLE tenants ADD COLUMN config')
  })

  it.skipIf(!TICKETING_INSTALLED)(
    'UAT_FC_REQ-162 every statement in SCHEMA_STATEMENTS is in the migration',
    async () => {
      const { SCHEMA_STATEMENTS } = (await import(sharedModuleUrl('ticketing'))) as {
        SCHEMA_STATEMENTS: string[]
      }
      expect(SCHEMA_STATEMENTS.length).toBeGreaterThan(0)

      const flatSql = flat(sql)
      for (const statement of SCHEMA_STATEMENTS) {
        // Compared as a whole statement rather than by table name: a check that
        // only looked for `CREATE TABLE … tickets` would keep passing after
        // upstream added a column, which is precisely the drift this catches.
        expect(flatSql, `migration is missing: ${flat(statement).slice(0, 60)}…`).toContain(
          flat(statement),
        )
      }
    },
  )
})

if (!TICKETING_INSTALLED) console.warn(`REQ-162 schema drift check skipped: ${TICKETING_SKIP_REASON}`)
