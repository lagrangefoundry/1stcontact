-- [[REQ-306]] — THE TURN LEDGER: that a turn began, written before the turn can
-- kill the isolate that would otherwise have been the only witness to its end.
--
-- WHY A FILE AT ALL rather than an edit to an earlier one: every migration up to
-- `0019` has been applied, and `wrangler d1 migrations apply` records what it has
-- run, so an edit reaches no database. Same reasoning as `0005`, `0007`–`0009`,
-- `0013`, `0014`, `0016`, `0018` and `0019`.
--
-- THE FAILURE THIS TABLE EXISTS FOR, stated concretely. `streamTurn` returns its
-- `Response` before `start()` runs, so the status line and the headers are gone
-- before any work begins. When the isolate is killed mid-stream — `exceededMemory`
-- is what actually happened, but a CPU-time overrun, an eviction and any limit
-- not yet invented produce the identical shape — the client receives a 200 with an
-- empty body and no terminal frame, the `catch` that would have rendered a
-- readable error never runs, and the `finally` that flushes the audit dies with
-- it. EVERY record this system keeps of a turn is written by code that runs
-- AFTER the model call: the audit flush, the meter's row, the pending record's
-- close. An uncatchable death therefore left nothing at all behind except a
-- platform tail entry somebody had to go and look for. A whole tenant failed
-- every turn for a period before anyone established why.
--
-- SO THE ROW IS OPENED BEFORE THE STREAM, AND THAT IS THE WHOLE MECHANISM. The
-- route awaits the insert before it hands back the `Response`, so the record is
-- durable before the first byte of the body exists and before anything the turn
-- does can go wrong. Closing it is the `finally`'s job, exactly as the audit
-- flush is — and a `finally` that never ran is precisely the fact being
-- recorded. AN OPEN ROW IS NOT A GAP IN THE LEDGER; IT IS THE ENTRY.
--
-- WHY THIS TABLE AND NOT ONE THAT ALREADY EXISTS. Three candidates, each
-- disqualified by a property rather than by taste:
--
--   1. `turn_spend` (0019) is the obvious neighbour — same grain, one row per
--      turn, `turn_id` primary key, `started_at` and `ended_at` already there.
--      It is a METER and its `ended_at` is NOT NULL because a meter's row is
--      written once, in full, at the end, and never revised ("ONE STATEMENT, NO
--      READ", `spend.ts`). Making it nullable and adding an UPDATE path would
--      trade away the one invariant that makes a billing figure trustworthy, to
--      buy a column that says the turn died — and a turn that died before the
--      model answered has no counters to be a row OF. Two questions, two tables.
--   2. `log_records` (0018) needs no migration and is where an operator already
--      looks. It is PRUNED on a `(kind, level, ts)` band, and the thing being
--      recorded here is the absence of a later write — which cannot be
--      reconstructed once the opening row is deleted. A ledger whose entries an
--      ops job removes on a schedule is not a ledger.
--   3. The session's `chat` ticket already carries `pending_turn` (BUG-121),
--      written before the model for the same reason this row is. It holds the
--      QUESTION so the client can re-send it, it is one field replaced by the
--      next turn, and it says `open` for a turn still running and for a turn
--      whose isolate died — the same word. It cannot be counted, cannot be
--      ordered and cannot show that a site failed fourteen turns in a row, which
--      is the operator half this ticket is actually about.
--
-- RETAINED, NOT PRUNED, for `turn_spend`'s reason applied to a different
-- question: how often this platform kills its own turns, and whether a change
-- made it better or worse, is a question only the whole history can answer.

-- ---------------------------------------------------------------------------
-- One row per turn, opened before the turn and closed after it
-- ---------------------------------------------------------------------------
--
-- `turn_id` IS THE PRIMARY KEY, which is what makes *exactly one row per turn* a
-- property of the DATABASE rather than of the caller. Minted by the route, like
-- every other key this system mints, and opaque: nothing parses it.
--
-- `session_id` IDENTIFIES THE SITE AND THE SESSION IN ONE COLUMN, and there is
-- deliberately no second column beside it. A session id is `site-<key>` or
-- `business-<id>` — derived, total, and the documented inverse of
-- `sessionIdFor` / `businessSessionIdFor` in `host-core.ts`. A `site` column
-- would be that derivation stored a second time, free to disagree with the id it
-- was derived from the first time somebody renamed something. With `tenant_id`
-- beside it a row names the business, the site and the conversation, which is
-- everything an operator needs to find the incident without a platform tail.
--
-- `ended_at` AND `outcome` ARE NULLABLE, AND NULL IS THE POINT OF THE TABLE.
-- NULL does not mean "unknown" or "zero"; it means NO CODE RAN AFTER THE KILL.
-- A row that is still NULL long after `started_at` is the durable record of a
-- turn that ended uncatchably — there is nothing else to write, because by
-- construction there was nobody left to write it. HOW LONG IS A READER'S
-- JUDGEMENT AND NOT A COLUMN: `turn-log.ts` owns the one ceiling, so a turn in
-- flight and a turn that died are told apart in one place rather than wherever
-- somebody happens to be querying.
--
-- `outcome` USES THE HOST'S OWN VOCABULARY — `complete`, `aborted`, `error` —
-- and not a second one invented here. It is `TurnOutcome` in `host-core.ts`,
-- the same three words `turn_spend.outcome` and `pending_turn.status` already
-- carry, so the three records of one turn can be read side by side without a
-- translation table.
--
-- `detail` IS THE OPERATOR-READABLE REASON AND IS NULL EVERYWHERE ELSE. A turn
-- that errored knows why; one that completed has nothing to say, and an empty
-- string there would claim it did.
CREATE TABLE IF NOT EXISTS turn_log (
  turn_id    TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at   TEXT,
  outcome    TEXT,
  detail     TEXT
);

-- THE READ THIS TABLE EXISTS FOR: one tenant's turns, most recent first, so
-- *is this site failing repeatedly* is answered by looking at the top of a list
-- rather than by scanning a history. `tenant_id` leads for `turn_spend`'s
-- reason — every legitimate read of this is scoped to whose turns they are, and
-- an unscoped sweep is not a question anybody asks.
--
-- LAST STATEMENT IN THE FILE, which is what the test harness's `atHead` marker
-- asks about. A migration appended below without moving that marker re-opens the
-- hole `0013`'s own note describes.
CREATE INDEX IF NOT EXISTS idx_turn_log_tenant ON turn_log (tenant_id, started_at);
