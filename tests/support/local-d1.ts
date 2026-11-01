import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { TERMS_VERSION } from '../../apps/control-app/src/terms'

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
 * An invited, entitled, agreed identity in that same local D1 (REQ-167, REQ-169).
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
 *
 * THE SAME LESSON A SECOND TIME ([[REQ-169]]). Admission stopped being the last
 * check: a person whose `tos_version` does not match the constant is served the
 * terms instead of anything they asked for, and is refused every asset and every
 * API route until they accept. So the seeded identity has ACCEPTED — otherwise
 * every suite that drives the real Worker would be asserting against an
 * interstitial, and would say "expected 403 to be 200" about a routing bug that
 * is not there.
 *
 * The version is IMPORTED rather than written out. A literal here would be a
 * second copy of the constant, and its first symptom would be every one of these
 * suites failing the day somebody bumps the terms — which is precisely the day
 * they should be the last thing anybody is looking at.
 *
 * The stamp is an UPDATE and not part of the `INSERT OR IGNORE`, so a row left
 * behind by an earlier run — miniflare persists this database under `.wrangler/`
 * — is brought up to the current version rather than silently kept at whatever it
 * was seeded with.
 */
export function seedIdentity(
  repoRoot: string,
  email: string,
  options: { tenantId?: string; businessId?: string } = {},
): { businessId: string } {
  const tenantId = options.tenantId ?? '1stcontact'
  // Named for what it is ([[REQ-184]]): the row this seeds is a BUSINESS. The id
  // still reads `acct_…` because those values are opaque, permanent and in R2
  // keys; only the names say what they mean.
  const businessId = options.businessId ?? `acct_${email.replace(/[^a-z0-9]/gi, '')}`
  const userId = `usr_${email.replace(/[^a-z0-9]/gi, '')}`
  const now = new Date().toISOString()
  const sql = [
    `INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES ('${businessId}', '${email}', 'active', '${now}');`,
    `INSERT OR IGNORE INTO users (id, tenant_id, email, status, platform_admin, invited_at, created_at, updated_at) ` +
      `VALUES ('${userId}', '${tenantId}', '${email.toLowerCase()}', 'active', 0, '${now}', '${now}', '${now}');`,
    `INSERT OR IGNORE INTO memberships (id, user_id, business_id, role, status, granted_at) ` +
      `VALUES ('mem_${userId}', '${userId}', '${businessId}', 'owner', 'active', '${now}');`,
    `INSERT OR IGNORE INTO entitlements (id, business_id, email, plan, source, status, starts_at, ends_at, created_at, updated_at) ` +
      `VALUES ('ent_${userId}', '${businessId}', '${email.toLowerCase()}', 'pro', 'admin_grant', 'active', '${now}', NULL, '${now}', '${now}');`,
    `UPDATE users SET tos_version = '${TERMS_VERSION}', tos_accepted_at = '${now}' WHERE id = '${userId}';`,
  ].join(' ')
  execFileSync('npx', ['wrangler', 'd1', 'execute', '1stcontact', '--local', '--command', sql], {
    cwd: path.join(repoRoot, 'apps', 'control-app'),
    stdio: 'ignore',
  })
  return { businessId }
}

/**
 * That same local D1, as a binding a suite can hand the Worker's own `fetch`.
 *
 * WHY THIS EXISTS NEXT TO THE TWO ABOVE. Some suites drive `controlWorker.fetch`
 * in-process rather than over `unstable_dev`, and so hold no D1 at all — but
 * admission (REQ-167) reads `users`, `memberships` and `entitlements` before any
 * route runs, so a route that opens no site store still touches D1. Handing such
 * a suite a throwing stand-in made admission itself the failure.
 *
 * It is the database `applyLocalD1Schema` migrated and `seedIdentity` seeded:
 * `getPlatformProxy` reads the same `wrangler.toml` and persists to the same
 * directory `wrangler d1 … --local` does, so there is no second schema and no
 * stubbed store — only a second way to reach the one local database.
 */
export async function localD1(
  repoRoot: string,
): Promise<{ db: D1Database; dispose: () => Promise<void> }> {
  const { getPlatformProxy } = await import('wrangler')
  const appDir = path.join(repoRoot, 'apps', 'control-app')
  // Miniflare registers every worker it starts in wrangler's dev registry, which
  // defaults to the operator's GLOBAL config directory. A test has no business
  // announcing itself to whatever `wrangler dev` the operator has running, so
  // the registry is a throwaway directory of this proxy's own — read once, while
  // the options are composed, and restored straight after.
  const previous = process.env.WRANGLER_REGISTRY_PATH
  process.env.WRANGLER_REGISTRY_PATH = mkdtempSync(path.join(os.tmpdir(), 'local-d1-registry-'))
  try {
    const proxy = await getPlatformProxy<{ DB: D1Database }>({
      configPath: path.join(appDir, 'wrangler.toml'),
      persist: { path: path.join(appDir, '.wrangler', 'state', 'v3') },
      // Local only. The config also declares bindings (AI, Browser Rendering)
      // that only exist remotely; a test must never reach a Cloudflare account.
      remoteBindings: false,
    })
    return { db: proxy.env.DB, dispose: () => proxy.dispose() }
  } finally {
    if (previous === undefined) delete process.env.WRANGLER_REGISTRY_PATH
    else process.env.WRANGLER_REGISTRY_PATH = previous
  }
}
