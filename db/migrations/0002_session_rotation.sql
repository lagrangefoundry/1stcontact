-- [[REQ-231]] — bring an existing `sessions` table to the rotation shape.
--
-- WHY THERE IS A SECOND FILE AT ALL. `0001_baseline.sql` now declares the
-- nine-column `sessions` the component asks for, which is what a database
-- created from scratch gets. The live database ran `0001` months ago and will
-- never run it again — `wrangler d1 migrations apply` records what it has run —
-- so editing the baseline changes nothing that is already deployed. This file is
-- the half that reaches it.
--
-- WHY IT IS A REBUILD RATHER THAN FOUR `ALTER TABLE ADD COLUMN`.
--
-- Upstream's `applySchema` issues exactly those four ALTERs and is safe to run
-- on every boot because it reads `PRAGMA table_info(sessions)` first and skips
-- the columns already there. **That code does not run here**: wrangler's
-- migration runner reads `.sql` off disk and SQLite has no
-- `ADD COLUMN IF NOT EXISTS`, so a file of bare ALTERs is correct for the one
-- database that has the old shape and is a hard error — `duplicate column name:
-- issued_at` — on every database created from the updated baseline. A migration
-- set that cannot be applied to a fresh database is a landmine rather than a
-- migration, and the fresh case is not hypothetical: it is `wrangler dev`'s
-- local D1, a preview environment, and the next deployment of this product.
--
-- The rename-and-refill below is the SQLite idiom `0001`'s own header names
-- ("create-copy-drop-rename rebuilds") and it converges from BOTH shapes onto
-- one, because every column it reads from the old table exists in both. It runs
-- once per database, before that database serves a request, so the copy is of a
-- table that is empty (fresh) or holds one row per live sign-in (live).
--
-- AND IT LEAVES THE TABLE CREATED BY THE COMPONENT'S OWN STATEMENT. The
-- `CREATE TABLE` below is `SCHEMA_STATEMENTS`' `sessions` verbatim, character
-- for character with the copy in `0001` — so a migrated database and a fresh one
-- do not merely agree about columns, they were built by the same text.

-- A previous interrupted run is the one state this could meet, and dropping the
-- staging table rather than failing on it is what makes a retry finish.
DROP TABLE IF EXISTS sessions_pre_rotation;

-- Takes the table's indexes with it, which is why all four are recreated at the
-- bottom rather than only the two REQ-151 added.
ALTER TABLE sessions RENAME TO sessions_pre_rotation;

CREATE TABLE IF NOT EXISTS sessions (
     id            TEXT PRIMARY KEY,
     subject_id    TEXT NOT NULL,
     expires_at    TEXT NOT NULL,
     created_at    TEXT NOT NULL,
     last_seen_at  TEXT NOT NULL,
     issued_at     TEXT,
     origin_id     TEXT,
     superseded_by TEXT,
     retired_at    TEXT
   );

-- THE FIVE COLUMNS BOTH SHAPES HAVE, and deliberately not the four that only
-- one of them does: naming `issued_at` here would make this file unreadable
-- against the old table, which is the database it exists for.
INSERT INTO sessions (id, subject_id, expires_at, created_at, last_seen_at)
  SELECT id, subject_id, expires_at, created_at, last_seen_at
    FROM sessions_pre_rotation;

-- The backfill, and it is upstream's own two statements. A session that predates
-- rotation becomes the single-bearer chain it always was: its own origin, issued
-- when it was created. Without `origin_id`, ending that sign-in would be a
-- DELETE that matches nothing, and sign-out would silently leave a live
-- credential behind.
--
-- `WHERE ... IS NULL` for upstream's reason: a half-finished run is finished
-- rather than double-written.
UPDATE sessions SET origin_id = id WHERE origin_id IS NULL;
UPDATE sessions SET issued_at = created_at WHERE issued_at IS NULL;

DROP TABLE sessions_pre_rotation;

-- AFTER the table exists and carries the columns, for the reason upstream's
-- migrator orders its own work this way: an index on a column that does not
-- exist yet is an error.
CREATE INDEX IF NOT EXISTS idx_sessions_subject_id
     ON sessions (subject_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
     ON sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_origin_id
     ON sessions (origin_id);

CREATE INDEX IF NOT EXISTS idx_sessions_retired_at
     ON sessions (retired_at);
