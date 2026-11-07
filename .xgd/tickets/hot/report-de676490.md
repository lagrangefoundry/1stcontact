---
uid: report-de676490
id: REPORT-11145
type: report
title: 'Report: mode_override for story-e0ca0a36'
created_by: xgd
created_at: '2026-11-07T19:42:01.955033+00:00'
updated_at: '2026-11-07T19:51:17.648965+00:00'
completed_at: null
last_field_updated: files_touched
fields:
  report_kind: mode_override
  subject_uid: story-e0ca0a36
  anchor_ticket: bundle-7988e925
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-952055fa
  quality_mode: reconcile
  justification: The reference state's baseline carries the sessions schema that the
    installed auth-passwordless component writes against, and this tree's baseline
    is the pre-rotation shape, so the settled REQ-202 tests (AC2347-AC2354 and the
    FC drift and conformance tests) are right and the migration is wrong. The builder's
    blocked_by prescription matches the reference exactly.
  files:
  - db/migrations/0001_baseline.sql
  - db/migrations/0002_session_rotation.sql
  rung: 2
  tip_evidence:
  - file: db/migrations/0001_baseline.sql
    lines: 951-988
  - file: db/migrations/0002_session_rotation.sql
    lines: 42-87
  external_cause: null
  planner_trust_boundary: false
  granted_head: 6c2d26d1eb7dfc733c2b4d60c30a1fcec8ba472c
  files_touched:
  - db/migrations/0001_baseline.sql
  - db/migrations/0002_session_rotation.sql
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
---

# Mode override granted: code_frozen

The reference state's baseline carries the sessions schema that the installed auth-passwordless component writes against, and this tree's baseline is the pre-rotation shape, so the settled REQ-202 tests (AC2347-AC2354 and the FC drift and conformance tests) are right and the migration is wrong. The builder's blocked_by prescription matches the reference exactly.

Planner instructions for the batch:

The suite now loads (the earlier 'Cannot find module ./generated/ticketing' was missing build output, since regenerated). The remaining failures share one root cause: the sessions DDL in db/migrations/0001_baseline.sql (around lines 811-824 in this tree) is the old five-column table, and the shared-store auth-passwordless component writes issued_at, origin_id, superseded_by and retired_at. Under the code_frozen override, (1) replace that CREATE TABLE IF NOT EXISTS sessions statement with the component's current SCHEMA_STATEMENTS text verbatim (nine columns, all nullable after last_seen_at) and add CREATE INDEX IF NOT EXISTS idx_sessions_origin_id ON sessions (origin_id) and idx_sessions_retired_at ON sessions (retired_at), keeping the existing subject_id/expires_at indexes. The reference shape is reconcile-src-BUNDLE-38:db/migrations/0001_baseline.sql:951-988. (2) Add db/migrations/0002_session_rotation.sql so a database that already applied the old baseline converges: rename to a staging table, re-create sessions with the component's statement, copy the five shared columns, backfill origin_id = id and issued_at = created_at WHERE ... IS NULL, drop the staging table, then re-create all four indexes. It must not use bare ALTER TABLE ADD COLUMN, which fails with 'duplicate column name' on fresh databases. Do not touch tests, ACs, sessions.ts or anything outside these two migration files. Done means AC2343-AC2355 and test_UAT_FC_REQ-202_ pass against the installed component. If a test still fails after the schema matches, report the new error rather than editing code outside the override.

## Diff

```diff
diff --git a/db/migrations/0001_baseline.sql b/db/migrations/0001_baseline.sql
index a6bab4da0c..fc2928b3a6 100644
--- a/db/migrations/0001_baseline.sql
+++ b/db/migrations/0001_baseline.sql
@@ -808,12 +808,28 @@ CREATE INDEX IF NOT EXISTS idx_login_tokens_subject_created
 CREATE INDEX IF NOT EXISTS idx_login_tokens_expires_at
      ON login_tokens (expires_at);
 
+-- A LIVE SESSION IS ONE **BEARER** OF ONE SIGN-IN ([[REQ-231]], REQ-151
+-- upstream). The row is the credential; the sign-in it belongs to is the chain
+-- of rows sharing an `origin_id`. `expires_at` is written once, at
+-- `startSession`, and rotation carries it across unchanged — so no number of
+-- rotations lengthens a session by a millisecond, and the four columns after
+-- `last_seen_at` are what buy the rotation rather than what pay for it.
+--
+-- ALL FOUR ARE NULLABLE, AND THAT IS THE COMPONENT'S DECISION RATHER THAN A
+-- LOOSENING HERE. `ALTER TABLE ADD COLUMN` cannot add a NOT NULL column without
+-- a default, so a table migrated into this shape (`0002_session_rotation.sql`)
+-- and a table created in it would otherwise be two different schemas for the
+-- component to be correct against instead of one.
 CREATE TABLE IF NOT EXISTS sessions (
-     id           TEXT PRIMARY KEY,
-     subject_id   TEXT NOT NULL,
-     expires_at   TEXT NOT NULL,
-     created_at   TEXT NOT NULL,
-     last_seen_at TEXT NOT NULL
+     id            TEXT PRIMARY KEY,
+     subject_id    TEXT NOT NULL,
+     expires_at    TEXT NOT NULL,
+     created_at    TEXT NOT NULL,
+     last_seen_at  TEXT NOT NULL,
+     issued_at     TEXT,
+     origin_id     TEXT,
+     superseded_by TEXT,
+     retired_at    TEXT
    );
 
 CREATE INDEX IF NOT EXISTS idx_sessions_subject_id
@@ -822,6 +838,15 @@ CREATE INDEX IF NOT EXISTS idx_sessions_subject_id
 CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
      ON sessions (expires_at);
 
+-- Backs ending a whole CHAIN — sign-out, and the response to a replayed id.
+CREATE INDEX IF NOT EXISTS idx_sessions_origin_id
+     ON sessions (origin_id);
+
+-- Backs the retired-row sweep in `purgeExpired`. Without it a rotating
+-- deployment's reap is a full scan of a table whose live rows are the minority.
+CREATE INDEX IF NOT EXISTS idx_sessions_retired_at
+     ON sessions (retired_at);
+
 -- ---------------------------------------------------------------------------
 -- The one seeded row
 -- ---------------------------------------------------------------------------
diff --git a/db/migrations/0002_session_rotation.sql b/db/migrations/0002_session_rotation.sql
new file mode 100644
index 0000000000..f5bdb71911
--- /dev/null
+++ b/db/migrations/0002_session_rotation.sql
@@ -0,0 +1,87 @@
+-- [[REQ-231]] — bring an existing `sessions` table to the rotation shape.
+--
+-- WHY THERE IS A SECOND FILE AT ALL. `0001_baseline.sql` now declares the
+-- nine-column `sessions` the component asks for, which is what a database
+-- created from scratch gets. The live database ran `0001` months ago and will
+-- never run it again — `wrangler d1 migrations apply` records what it has run —
+-- so editing the baseline changes nothing that is already deployed. This file is
+-- the half that reaches it.
+--
+-- WHY IT IS A REBUILD RATHER THAN FOUR `ALTER TABLE ADD COLUMN`.
+--
+-- Upstream's `applySchema` issues exactly those four ALTERs and is safe to run
+-- on every boot because it reads `PRAGMA table_info(sessions)` first and skips
+-- the columns already there. **That code does not run here**: wrangler's
+-- migration runner reads `.sql` off disk and SQLite has no
+-- `ADD COLUMN IF NOT EXISTS`, so a file of bare ALTERs is correct for the one
+-- database that has the old shape and is a hard error — `duplicate column name:
+-- issued_at` — on every database created from the updated baseline. A migration
+-- set that cannot be applied to a fresh database is a landmine rather than a
+-- migration, and the fresh case is not hypothetical: it is `wrangler dev`'s
+-- local D1, a preview environment, and the next deployment of this product.
+--
+-- The rename-and-refill below is the SQLite idiom `0001`'s own header names
+-- ("create-copy-drop-rename rebuilds") and it converges from BOTH shapes onto
+-- one, because every column it reads from the old table exists in both. It runs
+-- once per database, before that database serves a request, so the copy is of a
+-- table that is empty (fresh) or holds one row per live sign-in (live).
+--
+-- AND IT LEAVES THE TABLE CREATED BY THE COMPONENT'S OWN STATEMENT. The
+-- `CREATE TABLE` below is `SCHEMA_STATEMENTS`' `sessions` verbatim, character
+-- for character with the copy in `0001` — so a migrated database and a fresh one
+-- do not merely agree about columns, they were built by the same text.
+
+-- A previous interrupted run is the one state this could meet, and dropping the
+-- staging table rather than failing on it is what makes a retry finish.
+DROP TABLE IF EXISTS sessions_pre_rotation;
+
+-- Takes the table's indexes with it, which is why all four are recreated at the
+-- bottom rather than only the two REQ-151 added.
+ALTER TABLE sessions RENAME TO sessions_pre_rotation;
+
+CREATE TABLE IF NOT EXISTS sessions (
+     id            TEXT PRIMARY KEY,
+     subject_id    TEXT NOT NULL,
+     expires_at    TEXT NOT NULL,
+     created_at    TEXT NOT NULL,
+     last_seen_at  TEXT NOT NULL,
+     issued_at     TEXT,
+     origin_id     TEXT,
+     superseded_by TEXT,
+     retired_at    TEXT
+   );
+
+-- THE FIVE COLUMNS BOTH SHAPES HAVE, and deliberately not the four that only
+-- one of them does: naming `issued_at` here would make this file unreadable
+-- against the old table, which is the database it exists for.
+INSERT INTO sessions (id, subject_id, expires_at, created_at, last_seen_at)
+  SELECT id, subject_id, expires_at, created_at, last_seen_at
+    FROM sessions_pre_rotation;
+
+-- The backfill, and it is upstream's own two statements. A session that predates
+-- rotation becomes the single-bearer chain it always was: its own origin, issued
+-- when it was created. Without `origin_id`, ending that sign-in would be a
+-- DELETE that matches nothing, and sign-out would silently leave a live
+-- credential behind.
+--
+-- `WHERE ... IS NULL` for upstream's reason: a half-finished run is finished
+-- rather than double-written.
+UPDATE sessions SET origin_id = id WHERE origin_id IS NULL;
+UPDATE sessions SET issued_at = created_at WHERE issued_at IS NULL;
+
+DROP TABLE sessions_pre_rotation;
+
+-- AFTER the table exists and carries the columns, for the reason upstream's
+-- migrator orders its own work this way: an index on a column that does not
+-- exist yet is an error.
+CREATE INDEX IF NOT EXISTS idx_sessions_subject_id
+     ON sessions (subject_id);
+
+CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
+     ON sessions (expires_at);
+
+CREATE INDEX IF NOT EXISTS idx_sessions_origin_id
+     ON sessions (origin_id);
+
+CREATE INDEX IF NOT EXISTS idx_sessions_retired_at
+     ON sessions (retired_at);

```
