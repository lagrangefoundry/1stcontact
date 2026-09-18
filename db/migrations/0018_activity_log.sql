-- [[REQ-235]] — THE RAW SERVER-SIDE EVENT STORE, AND ITS RETENTION FLOOR.
--
-- WHY A FILE AT ALL rather than an edit to an earlier one: every migration up to
-- `0017` has been applied, and `wrangler d1 migrations apply` records what it has
-- run, so an edit reaches no database. Same reasoning as `0005`, `0007`–`0009`,
-- `0013`, `0014` and `0016`.
--
-- WHAT THIS IS NOT. It is not `contact_events` and must never be made into it
-- ([[REQ-235]] §0). That table is the permanent, immutable-by-trigger spine of
-- what happened to a PERSON — one row per milestone, read by the customer, and
-- reachable by erasure ([[DOC-37]]). This is one row per INVOCATION, most of
-- them with nobody behind them at all, pruned on a `(kind, level)` band and read
-- by an operator and the AI. The two meet at exactly one seam — session
-- inference folds these rows into one `contact_events` row per session — and
-- merging them would produce a store able to honour neither half.
--
-- WHY D1 AND NOT ANALYTICS ENGINE ([[EPIC-1]] §8.3, §16; [[REQ-235]] §2). Three
-- verified reasons, recorded here because the store is the one decision this
-- migration makes irreversibly:
--
--   1. AE IS ADAPTIVELY SAMPLED AT VOLUME. Session boundaries inferred from a
--      sampled stream are a guess, and the summary row deliberately refuses to
--      "present a floor as a fact" — which sampling does, one layer down. This
--      is the disqualifying reason for this reader specifically.
--   2. AE'S RETENTION IS THREE MONTHS AND IS NOT CONFIGURABLE, so it cannot hold
--      the warn/error band at 180 days.
--   3. READS COST 4x WRITES ($1.00/M against $0.25/M), and this layer's whole
--      purpose is being read on a schedule.
--
-- AE stays available for [[EPIC-8]]'s live counters, which is the reader it
-- suits. R2 is the archive if and when the rollup ladder lands.

-- ---------------------------------------------------------------------------
-- The raw records
-- ---------------------------------------------------------------------------
--
-- THE COLUMNS ARE `RECORD_FIELDS`, AND THE RECORD IS NOT INVENTED HERE.
-- The shared logging package exports `IDENTIFIERS`, `DIMENSIONS` and `MEASURES`
-- as data precisely so a store can be built against the dimension set without
-- re-deriving it ([[EPIC-1]] §15: *"EPIC-1 owns the record; REQ-235 owns the
-- store and its retention"*). `log.ts` maps each exported field onto one column
-- below, and a UAT fails if the two sets ever disagree; a field the package adds
-- that has no column here still travels, in `data`.
--
-- `seq` IS THE READER'S CURSOR AND NOT `ts`. Two records can share a millisecond
-- and a cursor that could not separate them would serve one of them twice or
-- never — the same reasoning `ticket_changes` gives for its own
-- `INTEGER PRIMARY KEY AUTOINCREMENT`.
--
-- `business` IS NULLABLE, WHICH IS THE WHOLE POINT OF THIS TABLE. Most requests
-- are anonymous, and many arrive before a business has been resolved at all — a
-- sign-in, a webhook, a refused gate. Those are exactly the events a
-- `contact_id NOT NULL` column cannot hold, and exactly the ones an operator
-- asking "what happened at 04:12" needs.
--
-- `actor` IS THE ONE FIELD THAT NEVER LEAVES THIS TIER ([[EPIC-1]] §42). Member
-- behaviour lives in `contact_events`, so no permanent tier carries a person — a
-- structural property rather than a policy one, and the reason this table's
-- answer to a person's data is expiry while the spine's is erasure.
--
-- `data` IS THE SANITISED PAYLOAD, AS ONE JSON STRING. The package walks it
-- before it is ever offered here: a value at a sensitive key name is replaced at
-- any depth, case- and separator-insensitively, so no secret, credential or
-- bearer token reaches this store and no call site has to remember that.
--
-- `synthetic` / `run_id` — THE TEST GUTTER'S MARK ([[DOC-54]], [[REQ-268]]).
-- [[DOC-54]] §2.4 named four tables plus message tickets because it was written
-- before a raw log existed. A probe produces invocations like any other caller,
-- so without the mark here every aggregate over this table counts manufactured
-- hits as traffic — [[DOC-54]] §3's named failure, *"the number is wrong in the
-- flattering direction"*, in the one store the contract was never applied to.
-- NOT NULL DEFAULT 0 for the reason `users` has them that way: a nullable flag
-- makes an unstamped row ambiguous under three-valued logic, and ambiguity in a
-- `DELETE` predicate is how a real row gets collected.
CREATE TABLE IF NOT EXISTS log_records (
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts          INTEGER NOT NULL,
  trace_id    TEXT,
  business    TEXT,
  kind        TEXT    NOT NULL,
  level       TEXT    NOT NULL,
  event       TEXT    NOT NULL,
  route       TEXT,
  method      TEXT,
  status      INTEGER,
  outcome     TEXT,
  actor       TEXT,
  duration_ms INTEGER,
  data        TEXT,
  synthetic   INTEGER NOT NULL DEFAULT 0,
  run_id      TEXT
);

-- ---------------------------------------------------------------------------
-- The retention floor
-- ---------------------------------------------------------------------------
--
-- WHAT IT IS FOR, and it is the same thing `ticket_change_floor` is for. Pruning
-- deletes rows. A consumer holding a cursor from before the window would then be
-- served a partial history it cannot distinguish from a complete one — which is
-- worse than an error, because nothing about the answer looks wrong. The floor
-- remembers how far pruning has reached, so such a reader is told `reset`.
--
-- IT RECORDS THE HIGHEST `seq` PRUNING HAS TOUCHED, not a contiguous prefix, and
-- the difference is forced by the band: a `debug` row at `seq` 900 is deleted
-- while a `warn` row at `seq` 100 survives. So the honest statement is *below
-- this point the history may have holes*, which is exactly what a reader needs
-- in order to know it must start again.
--
-- ONE ROW, ENFORCED BY THE CHECK. `ticket_change_floor` is per tenant because
-- its log is; this log is cross-business by construction — most of its rows name
-- no business at all — so a per-business floor would have no row to file an
-- anonymous invocation's pruning under.
CREATE TABLE IF NOT EXISTS log_floor (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  pruned_through INTEGER NOT NULL DEFAULT 0
);

-- Present from this migration rather than created on first prune, so every
-- reader can `SELECT` it without a branch for "no sweep has run yet" — a branch
-- that would be written once and forgotten at the second call site.
INSERT OR IGNORE INTO log_floor (id, pruned_through) VALUES (1, 0);

-- ---------------------------------------------------------------------------
-- The three reads, and the marker this file is recognised by
-- ---------------------------------------------------------------------------

-- THE PRUNE'S OWN PREDICATE, AND NOTHING ELSE'S. Retention is a band and not a
-- scalar ([[EPIC-1]] §40) — a `debug` row and a `warn` row written in the same
-- millisecond are deleted on different days — so the sweep's `WHERE` leads with
-- the two columns that decide the horizon and ends with the one it compares.
CREATE INDEX IF NOT EXISTS idx_log_records_prune ON log_records (kind, level, ts);

-- SESSION INFERENCE'S OWN PREDICATE. The closer reads one actor's records in
-- time order and cuts them at the inactivity gap; without this it is a scan of
-- the whole table per actor, every ten minutes, forever.
CREATE INDEX IF NOT EXISTS idx_log_records_actor ON log_records (actor, ts);

-- THE OPERATOR'S READ: one business's records, in cursor order. `seq` and not
-- `ts`, because `seq` is what the reader pages on — an index ordered by a
-- different column from the query would page in an order the query does not
-- produce, and the symptom is a row appearing on two pages or on neither.
--
-- LAST STATEMENT IN THE FILE, which is what the test harness's `atHead` marker
-- asks about. A migration appended below without moving that marker re-opens the
-- hole `0013`'s own note describes.
CREATE INDEX IF NOT EXISTS idx_log_records_business ON log_records (business, seq);
