-- [[REQ-268]] — THE TWO INDEXES COLLECTION READS.
--
-- WHY A FILE AT ALL rather than an edit to `0014_capture_gutter.sql`: that file
-- has been applied, and `wrangler d1 migrations apply` records what it has run,
-- so an edit reaches no database. Same reasoning as `0005`, `0007`–`0009`,
-- `0013` and `0014` itself.
--
-- WHY THEY WERE NOT IN `0014`. That migration added the columns for the WRITE
-- side and for the read predicate — `synthetic = 0` appended to a query already
-- keyed on `tenant_id`, which the existing tenant indexes serve. Collection asks
-- two questions neither of those indexes can answer, because neither of them
-- names a tenant at all.

-- ---------------------------------------------------------------------------
-- Collection by run
-- ---------------------------------------------------------------------------
--
-- NOT UNIQUE: a run produces as many contacts as it manufactures submissions.
-- It serves `collectRun`, and it serves the marked capture path's own
-- find-or-create lookup — which is scoped to its run precisely so a probe can
-- never attach itself to a real contact who happens to hold the same address.
CREATE INDEX IF NOT EXISTS idx_users_run ON users (run_id);

-- ---------------------------------------------------------------------------
-- The sweep, and the marker this file is recognised by
-- ---------------------------------------------------------------------------
--
-- `(synthetic, created_at)` IS THE SWEEP'S OWN PREDICATE AND NOTHING ELSE'S
-- ([[DOC-54]] §2.7). The sweep is keyed on the row alone — `synthetic = 1 AND
-- created_at < horizon`, across every business, joined to no registry of known
-- runs — precisely so that a run nobody remembers is still collected. It cannot
-- lead with `tenant_id` the way every other index on this table does, because it
-- deliberately names no tenant.
--
-- LAST STATEMENT IN THE FILE, which is what the test harness's `atHead` marker
-- asks about. A migration appended below without moving that marker re-opens the
-- hole `0013`'s own note describes.
CREATE INDEX IF NOT EXISTS idx_users_synthetic ON users (synthetic, created_at);
