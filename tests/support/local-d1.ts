import { execFileSync } from 'node:child_process'
import path from 'node:path'

/**
 * The migrations, applied to the LOCAL D1 that `unstable_dev` hands the Worker
 * (REQ-145).
 *
 * WHY A TEST NEEDS THIS AT ALL. `control-app` stopped being a proxy and became
 * the origin, so it reads its own D1 binding. Under `unstable_dev` that binding
 * is miniflare's local database, which starts with no schema — every store call
 * then fails and the Worker answers 503 to requests that have nothing to do with
 * the store. The failure reads as a routing bug, which is exactly the kind of
 * misdirection worth spending two seconds of setup to avoid.
 *
 * Deliberately the REAL migration path (`wrangler d1 migrations apply`) rather
 * than a hand-written `CREATE TABLE` in a test helper: a second copy of the
 * schema would drift from `db/migrations/`, and the first symptom would be a
 * suite that passes against a database production does not have.
 *
 * Memoised per process — miniflare persists local D1 under `.wrangler/`, so this
 * is idempotent, but it still costs a subprocess.
 */
let applied = false

export function applyLocalD1Schema(repoRoot: string): void {
  if (applied) return
  execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', '1stcontact', '--local'], {
    cwd: path.join(repoRoot, 'apps', 'control-app'),
    stdio: 'ignore',
  })
  applied = true
}

/**
 * An invited, entitled identity in that same local D1 (REQ-167).
 *
 * WHY EVERY TEST THAT DRIVES THE REAL WORKER NEEDS THIS NOW. Passing Cloudflare
 * Access stopped being admission: `index.ts` looks the verified email up in
 * `users`, resolves an account through `memberships` and requires an active
 * `entitlements` grant before any route runs. A suite that mints a valid token
 * and expects 200 is therefore asserting something that is no longer true unless
 * the person behind that token has been invited.
 *
 * IT IS REAL SQL AGAINST THE REAL DATABASE, through the same `wrangler d1
 * execute` path `applyLocalD1Schema` uses — not a stubbed store and not a fake
 * binding. What it seeds is exactly what `provisionInvite` writes; it is spelled
 * out here rather than called because these suites reach the Worker over HTTP
 * and hold no D1 handle of their own to call it with.
 *
 * The grant is OPEN-ENDED (`ends_at IS NULL`) deliberately: a suite whose fixture
 * expired would fail at a wall-clock time nobody chose. Expiry is proved where it
 * belongs, in REQ-167's own UATs, against a date the test sets.
 */
export function seedIdentity(
  repoRoot: string,
  email: string,
  options: { tenantId?: string; accountId?: string } = {},
): { accountId: string } {
  const tenantId = options.tenantId ?? '1stcontact'
  const accountId = options.accountId ?? `acct_${email.replace(/[^a-z0-9]/gi, '')}`
  const userId = `usr_${email.replace(/[^a-z0-9]/gi, '')}`
  const now = new Date().toISOString()
  const sql = [
    `INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES ('${accountId}', '${email}', 'active', '${now}');`,
    `INSERT OR IGNORE INTO users (id, tenant_id, email, status, platform_admin, invited_at, created_at, updated_at) ` +
      `VALUES ('${userId}', '${tenantId}', '${email.toLowerCase()}', 'active', 0, '${now}', '${now}', '${now}');`,
    `INSERT OR IGNORE INTO memberships (id, user_id, account_id, role, status, granted_at) ` +
      `VALUES ('mem_${userId}', '${userId}', '${accountId}', 'owner', 'active', '${now}');`,
    `INSERT OR IGNORE INTO entitlements (id, account_id, email, plan, source, status, starts_at, ends_at, created_at, updated_at) ` +
      `VALUES ('ent_${userId}', '${accountId}', '${email.toLowerCase()}', 'pro', 'admin_grant', 'active', '${now}', NULL, '${now}', '${now}');`,
  ].join(' ')
  execFileSync('npx', ['wrangler', 'd1', 'execute', '1stcontact', '--local', '--command', sql], {
    cwd: path.join(repoRoot, 'apps', 'control-app'),
    stdio: 'ignore',
  })
  return { accountId }
}
