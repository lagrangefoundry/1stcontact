import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * REQ-194 — **the account, asserted as a fact about the repository.**
 *
 * The workers suite proves what the schema DOES. This proves the three claims
 * that are about an ABSENCE, and an absence is the one kind of property a
 * passing suite never notices going away:
 *
 * - **no id the deployment names as a business reads `acct_`.** `newId('acct')`
 *   minted business ids, so every business on the deployment wore the prefix of
 *   a noun that had no table. Reverting that is a one-character edit in three
 *   files that would break nothing until somebody read a log.
 * - **`entitlements` still declares no CHECK on `plan` or `status`** and the
 *   subject column still allows NULL, because [[REQ-184]]'s capacity grant is
 *   what makes a business selectable and a NOT NULL here would delete it.
 * - **no permission check reads `role`.** Access restrictions are punted
 *   deliberately ([[REQ-194]], [[CHAT-23]]): `memberships.role` is a foothold and
 *   stays one. An account may put several people on a business, and the moment a
 *   second predicate over `role` appears, that is RBAC arriving without anyone
 *   deciding to build it.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(HERE, '..')
const BASELINE = path.join(REPO, 'db', 'migrations', '0001_baseline.sql')
const WRANGLER = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')

const baseline = fs.readFileSync(BASELINE, 'utf8')
const toml = fs.readFileSync(WRANGLER, 'utf8')

/** The DDL with its prose removed — this file argues in comments about SQL. */
const ddl = baseline
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

/** Source with its comments removed, for the same reason REQ-190's scan strips them. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

const GENERATED = new Set(['node_modules', 'dist', 'dist-assets', 'generated'])

function sourceFiles(roots: string[]): string[] {
  const found: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || GENERATED.has(entry.name)) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(ts|js)$/.test(entry.name)) found.push(full)
    }
  }
  for (const root of roots) walk(path.join(REPO, root))
  return found.sort()
}

describe('REQ-194 — the account is a table', () => {
  it('test_UAT_FC_REQ-194_the_baseline_declares_the_account_and_both_edges_of_it', () => {
    // ONE BASELINE, EDITED ([[REQ-190]]'s own header says its siblings edit it
    // rather than follow it). A tenth migration adding a NOT NULL column to a
    // table with rows in it is a create-copy-drop-rename rebuild; there are no
    // rows, so the file that has never been applied is the file that changes.
    expect(
      fs.readdirSync(path.join(REPO, 'db', 'migrations')).filter((f) => f.endsWith('.sql')),
    ).toEqual(['0001_baseline.sql'])

    expect(ddl).toMatch(/CREATE TABLE IF NOT EXISTS accounts\s*\(/)
    // The person names their account, and cannot not name one.
    expect(ddl).toMatch(/account_id\s+TEXT NOT NULL/)
    expect(ddl).toMatch(/FOREIGN KEY \(account_id\) REFERENCES accounts \(id\)/)
    // The business names the account that owns it — nullable, because the
    // platform business is nobody's product.
    expect(ddl).toMatch(/owner_account_id TEXT,/)
    // And the subject has an index now that something reads it ([[REQ-184]]
    // declined one while nothing did).
    expect(ddl).toMatch(/idx_entitlements_account ON entitlements \(account_id\)/)
  })

  it('test_UAT_FC_REQ-194_the_capacity_grant_survives_the_subject_becoming_real', () => {
    // `entitlements.account_id` STAYS NULLABLE. NULL is a first-class value —
    // "a per-business capacity grant with no subject" — and it is what makes a
    // business selectable ([[REQ-184]]). Giving the column a NOT NULL because it
    // finally has something real to point at would delete the only kind of grant
    // the product writes.
    const table = /CREATE TABLE IF NOT EXISTS entitlements \(([\s\S]*?)\n\);/.exec(ddl)
    expect(table, 'entitlements is declared').not.toBeNull()
    expect(table![1]).toMatch(/account_id\s+TEXT\s*,/)
    // And still no CHECK on either open vocabulary, which is [[REQ-167]]'s claim
    // restated here because this ticket rewrote the block around it.
    expect(table![1]).not.toMatch(/CHECK/i)
  })

  it('test_UAT_FC_REQ-194_no_business_the_deployment_names_reads_acct', () => {
    // THE ONE BUSINESS ID WRITTEN DOWN ANYWHERE is `TENANT_ID`, in two wrangler
    // blocks that do not inherit from each other and one baseline seed. All three
    // have to agree, and none of them may wear the account's prefix.
    const declared = [...toml.matchAll(/^TENANT_ID\s*=\s*"([^"]+)"/gm)].map((m) => m[1])
    expect(declared).toHaveLength(2)
    expect(declared[0]).toBe(declared[1])
    expect(declared[0]).toMatch(/^biz_[0-9a-f]{32}$/)

    const seeded = /INSERT OR IGNORE INTO tenants[\s\S]*?VALUES\s*\(\s*'([^']+)'/.exec(ddl)
    expect(seeded![1]).toBe(declared[0])

    // AND THE MINTER AGREES. `provisionBusiness` is the only thing that creates a
    // business, so the prefix it passes is the prefix every business will ever
    // wear. Asserted over stripped source: the file explains at length why the
    // prefix moved, and a raw scan would match its own justification.
    const identity = code(
      fs.readFileSync(path.join(REPO, 'apps', 'control-app', 'src', 'identity.ts'), 'utf8'),
    )
    expect(identity).toMatch(/const businessId = newId\('biz'\)/)
    expect(identity).not.toMatch(/newId\('acct'\)[\s\S]{0,200}createTenant/)
  })

  it('test_UAT_FC_REQ-194_no_permission_check_reads_role', () => {
    // ACCESS RESTRICTIONS ARE PUNTED, AND THIS IS WHAT KEEPS THEM PUNTED. There
    // is exactly one predicate over `memberships.role` in the product —
    // `ownsBusiness`, which is [[REQ-185]]'s ownership question and the gate on a
    // product-fulfilment control ([[DOC-42]] §7), not an access-control rule. A
    // SECOND one is RBAC arriving by accident, and it arrives most naturally
    // here: an account may now put several people on one business, and telling
    // them apart by role is the obvious next thing to reach for.
    //
    // SCANNED FOR THE ROLE VOCABULARY, NOT FOR THE WORD `role`, which is a chat
    // turn's role, an ARIA role and a capture role in this repository and would
    // make the check a list of unrelated files. `'owner'` IS the whole vocabulary
    // — that is the other half of what this ticket froze — so a second value
    // appearing is caught by the same assertion that catches a second reader.
    const offenders = sourceFiles(['apps', 'packages', 'tools'])
      .filter((f) => /['"](owner|support|staff|admin)['"]/.test(code(fs.readFileSync(f, 'utf8'))))
      .map((f) => path.relative(REPO, f))
    expect(offenders).toEqual(['apps/control-app/src/identity.ts'])

    const identity = code(
      fs.readFileSync(path.join(REPO, 'apps', 'control-app', 'src', 'identity.ts'), 'utf8'),
    )
    // Two writes (`provisionBusiness`, `ensurePlatformOperator`) and exactly one
    // read, which is `ownsBusiness`.
    expect([...identity.matchAll(/['"]owner['"]/g)]).toHaveLength(3)
    expect([...identity.matchAll(/role === 'owner'/g)]).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-194_the_chrome_is_told_who_is_signed_in_under_that_noun', () => {
    // `/api/businesses` REPORTED A PERSON'S NAME AND ADDRESS UNDER THE LABEL
    // `account`, which is the API surface of the missing table. The account is
    // the payer and the owner of businesses; a receipt is not addressed to
    // whoever happens to be signed in.
    const router = code(
      fs.readFileSync(path.join(REPO, 'apps', 'control-app', 'src', 'router.ts'), 'utf8'),
    )
    expect(router).toMatch(/person: \{ name: string \| null; email: string \| null \} \| null/)
    expect(router).not.toMatch(/account: \{ name: string \| null; email: string \| null \}/)
  })
})
