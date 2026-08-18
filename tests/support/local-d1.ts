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
