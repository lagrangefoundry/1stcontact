-- [[REQ-292]] — THE TURN METER: what every turn of every conversation cost.
--
-- WHY A FILE AT ALL rather than an edit to an earlier one: every migration up to
-- `0018` has been applied, and `wrangler d1 migrations apply` records what it has
-- run, so an edit reaches no database. Same reasoning as `0005`, `0007`–`0009`,
-- `0013`, `0014`, `0016` and `0018`.
--
-- WHY THIS TABLE AND NOT ONE THAT ALREADY EXISTS. Four candidates were
-- considered and all four are disqualified by a property of the store rather
-- than by taste:
--
--   1. `log_records` needs no migration at all and is the obvious home. It is
--      also PRUNED: `pruneRecords()` DELETEs on a `(kind, level, ts)` band and
--      `log_floor` records how far that has reached. A meter that will be billed
--      from must not be deletable by an ops job on a schedule, and "do not prune
--      these rows" is a rule somebody has to keep remembering rather than a
--      property of where they live.
--   2. R2 beside the session audit is durable and cheap to write, and turns a
--      month's report into a prefix listing and thousands of GETs.
--   3. `counters` is an aggregate. It can be neither split by model nor
--      re-priced, which is exactly the question the raw counters exist to answer.
--   4. The session's `chat` ticket via the ledger surface, which `ledger-core.ts`
--      itself rules out: the ledger is the ENGAGEMENT's record — what was decided
--      and why, read back to the consultant every turn — and spend is not part of
--      the engagement.
--
-- RETAINED, NOT PRUNED, and that is the whole reason this table is separate from
-- the one above it. The raw counters are what will answer whether a cheaper
-- provider or a smaller model would have served this workload; deleting them
-- forecloses that question permanently, and no later decision can recover it.
-- Rolling aged rows into a period aggregate is a later ticket and deliberately
-- not this one.

-- ---------------------------------------------------------------------------
-- One row per measured turn
-- ---------------------------------------------------------------------------
--
-- `turn_id` IS THE PRIMARY KEY, which is what makes *exactly one row per turn* a
-- property of the DATABASE rather than of the caller. The host mints it (the
-- framework's own turn id is stamped on junction records and never reaches the
-- stream vocabulary the host consumes), so it is opaque like every other key
-- this system mints and carries no meaning to parse.
--
-- BOTH THE FOUR RAW COUNTERS AND THE SETTLED COST, not either. Raw, so a past
-- period can be re-priced against another model or another provider — the
-- counters are the only thing that survives a rate change. Settled, so a bill
-- does not move underneath somebody the day a rate is corrected. The four
-- columns are the framework's `USAGE_KEYS` verbatim; `spend-core.ts` restates
-- them once as `COUNTER_KEYS` and a UAT holds the two to each other, so a
-- counter added upstream fails a test rather than being dropped on the floor.
--
-- `backend` AND `model` ARE BOTH RECORDED, AND BOTH ARE THE PRICE KEY. A table
-- keyed by model alone would have to be rewritten rather than extended the day a
-- second provider arrives, and a row that recorded only the model could not be
-- re-priced afterwards because nobody would know whose rates to use.
--
-- `cost_micros` IS NULLABLE, AND NULL IS NOT ZERO. A `(backend, model)` the
-- price table does not name is still measured and still recorded, with its cost
-- left NULL — *measured but not priced*, recoverable later from the counters. A
-- zero there would claim the turn was free, which is the one thing a meter must
-- never say. Micros — millionths of a US dollar — because floating-point money
-- is not money, and because rates published per million tokens make the figure
-- exactly `tokens x rate` with no division in between.
--
-- `attributed` IS THE DELEGATED HALF, AS JSON AND NOT AS FOUR MORE COLUMNS. An
-- attributed entry names its OWN backend and role (REQ-148 §8), so flattening it
-- into this row's counters would price a worker's tokens at this row's model —
-- precisely the error the two-part price key exists to prevent. NULL where the
-- turn delegated nothing, which for this product is every turn: it composes no
-- delegation surface at all.
--
-- `outcome` IS RECORDED AND IS NEVER A REASON NOT TO WRITE. A stopped or errored
-- turn sent requests and was billed for them whatever became of the answers, so
-- it is a row like any other — and the column is what lets a later reader ask
-- what abandonment costs, which is a question about this product's UX.
--
-- `started_at` AND `ended_at` ARE BOTH KEPT so a long turn is visible as one
-- rather than as an instant at the moment it closed. ISO-8601 text, like every
-- other timestamp a ticket or a revision carries here, and sortable as text.
CREATE TABLE IF NOT EXISTS turn_spend (
  turn_id                     TEXT PRIMARY KEY,
  tenant_id                   TEXT    NOT NULL,
  session_id                  TEXT    NOT NULL,
  started_at                  TEXT    NOT NULL,
  ended_at                    TEXT    NOT NULL,
  role                        TEXT    NOT NULL,
  backend                     TEXT    NOT NULL,
  model                       TEXT    NOT NULL,
  outcome                     TEXT    NOT NULL,
  requests                    INTEGER NOT NULL,
  input_tokens                INTEGER NOT NULL,
  output_tokens               INTEGER NOT NULL,
  cache_read_input_tokens     INTEGER NOT NULL,
  cache_creation_input_tokens INTEGER NOT NULL,
  attributed                  TEXT,
  cost_micros                 INTEGER
);

-- THE READ THIS TABLE EXISTS FOR: one tenant's turns over a period. `tenant_id`
-- leads because every legitimate read of a meter is scoped to whose meter it is
-- — an unscoped total is not a question anybody asks and not one this product
-- should make cheap — and `started_at` follows because the period is what the
-- query ranges over and what it returns rows in the order of.
--
-- LAST STATEMENT IN THE FILE, which is what the test harness's `atHead` marker
-- asks about. A migration appended below without moving that marker re-opens the
-- hole `0013`'s own note describes.
CREATE INDEX IF NOT EXISTS idx_turn_spend_tenant ON turn_spend (tenant_id, started_at);
