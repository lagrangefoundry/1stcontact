---
uid: report-952055fa
id: REPORT-11144
type: report
title: 'Report: fix_plan for story-e0ca0a36'
created_by: xgd
created_at: '2026-11-07T19:37:59.109245+00:00'
updated_at: '2026-11-07T19:51:10.404600+00:00'
completed_at: null
last_field_updated: batches_pending
result: pass
fields:
  report_kind: fix_plan
  subject_uid: story-e0ca0a36
  items:
  - index: 0
    tests:
    - test_UAT_AC2347_
    - test_UAT_AC2348_
    - test_UAT_AC2349_
    - test_UAT_AC2350_
    - test_UAT_AC2351_
    - test_UAT_AC2352_
    - test_UAT_AC2353_
    - test_UAT_AC2354_
    - test_UAT_FC_REQ-202_every_statement_in_SCHEMA_STATEMENTS_is_in_the_migration
    dependency_tests:
    - test_UAT_AC2343_
    - test_UAT_AC2344_
    - test_UAT_AC2345_
    - test_UAT_AC2346_
    - test_UAT_AC2355_
    hypothesis: 'db/migrations/0001_baseline.sql still declares the pre-REQ-151 five-column
      sessions table, while the installed auth-passwordless component (REQ-151 rotation)
      inserts issued_at/origin_id, so every redeem/session-create fails with ''D1_ERROR:
      table sessions has no column named issued_at''.'
    instructions: 'The suite now loads (the earlier ''Cannot find module ./generated/ticketing''
      was missing build output, since regenerated). The remaining failures share one
      root cause: the sessions DDL in db/migrations/0001_baseline.sql (around lines
      811-824 in this tree) is the old five-column table, and the shared-store auth-passwordless
      component writes issued_at, origin_id, superseded_by and retired_at. Under the
      code_frozen override, (1) replace that CREATE TABLE IF NOT EXISTS sessions statement
      with the component''s current SCHEMA_STATEMENTS text verbatim (nine columns,
      all nullable after last_seen_at) and add CREATE INDEX IF NOT EXISTS idx_sessions_origin_id
      ON sessions (origin_id) and idx_sessions_retired_at ON sessions (retired_at),
      keeping the existing subject_id/expires_at indexes. The reference shape is reconcile-src-BUNDLE-38:db/migrations/0001_baseline.sql:951-988.
      (2) Add db/migrations/0002_session_rotation.sql so a database that already applied
      the old baseline converges: rename to a staging table, re-create sessions with
      the component''s statement, copy the five shared columns, backfill origin_id
      = id and issued_at = created_at WHERE ... IS NULL, drop the staging table, then
      re-create all four indexes. It must not use bare ALTER TABLE ADD COLUMN, which
      fails with ''duplicate column name'' on fresh databases. Do not touch tests,
      ACs, sessions.ts or anything outside these two migration files. Done means AC2343-AC2355
      and test_UAT_FC_REQ-202_ pass against the installed component. If a test still
      fails after the schema matches, report the new error rather than editing code
      outside the override.'
    test_scope: test_UAT_AC2343_ or test_UAT_AC2344_ or test_UAT_AC2345_ or test_UAT_AC2346_
      or test_UAT_AC2347_ or test_UAT_AC2348_ or test_UAT_AC2349_ or test_UAT_AC2350_
      or test_UAT_AC2351_ or test_UAT_AC2352_ or test_UAT_AC2353_ or test_UAT_AC2354_
      or test_UAT_AC2355_ or test_UAT_FC_REQ-202_
    ladder:
      rung1: REQ-202 (in scope) requires the migration to carry the component's SCHEMA_STATEMENTS
        verbatim but names no column set; REQ-231, which brought the rotation columns,
        is outside this bundle, so rung 1 does not decide.
      rung2: 'Decides: reconcile-src-BUNDLE-38:db/migrations/0001_baseline.sql:951-988
        declares the nine-column sessions table with idx_sessions_origin_id and idx_sessions_retired_at,
        and 0002_session_rotation.sql:42-87 converges old databases; this tree''s
        five-column baseline disagrees with what the user runs.'
      rung3: The tests stand unchanged; only the two migration files change.
    override:
      rule: code_frozen
      rung: 2
      justification: The reference state's baseline carries the sessions schema that
        the installed auth-passwordless component writes against, and this tree's
        baseline is the pre-rotation shape, so the settled REQ-202 tests (AC2347-AC2354
        and the FC drift and conformance tests) are right and the migration is wrong.
        The builder's blocked_by prescription matches the reference exactly.
      files:
      - db/migrations/0001_baseline.sql
      - db/migrations/0002_session_rotation.sql
      tip_evidence:
      - file: db/migrations/0001_baseline.sql
        lines: 951-988
      - file: db/migrations/0002_session_rotation.sql
        lines: 42-87
      trust_boundary: false
  fix_iteration: 2
  batches_pending: false
---

# Fix Plan — Iteration 2

## Hypothesis
`db/migrations/0001_baseline.sql` in this reconcile tree still creates the pre-REQ-151 five-column `sessions` table. The out-of-band `auth-passwordless` component in the shared store is the REQ-151 (rotation) version, and it writes `issued_at` and `origin_id`. So every redeem or session-create fails with `D1_ERROR: table sessions has no column named issued_at`, and redeem returns 503.

## Analysis
- Iteration 1's failure ("0 tests executed", `Cannot find module './generated/ticketing'`) was missing build output. Since `1c assets` regenerated it, the suite loads (builder assessment report-229bfbbf). That signature is gone. The real failures are 8 of 13 tests in `tests/test_reconciliation_passwordless_sign_in.workers.test.ts` (AC2347–AC2354). The free-coded REQ-202 evidence fails the same way: `test_UAT_FC_REQ-202_every_statement_in_SCHEMA_STATEMENTS_is_in_the_migration`, the conformance suite, and three `test_UAT_FC_REQ-202_sign_in` tests.
- The builder reported `blocked_by: code_frozen` with a concrete prescription: change the baseline's `sessions` DDL to the component's current `SCHEMA_STATEMENTS`. I verified this against the reference state:
  - `git show reconcile-src-BUNDLE-38:db/migrations/0001_baseline.sql` lines 951–988 declares the nine-column `sessions` table (`issued_at`, `origin_id`, `superseded_by`, `retired_at`). It is transcribed verbatim from the component, with all four indexes, including `idx_sessions_origin_id` and `idx_sessions_retired_at`.
  - The reference also carries `db/migrations/0002_session_rotation.sql`. It does a rename/copy/backfill rebuild so a database created from the old baseline converges on the same shape. This tree has only `0001_baseline.sql`.
- That schema arrived with commit 59f8754161 (REQ-231, "adopt rolling credentials"). That commit is in neither this bundle's commit list nor its skipped list. So the tree is REQ-202 code paired with a component that has already moved on. The tests are right, and the deployment schema here is a version behind the component and the reference.
- This is not the REQ-910 external-cause case. At the reference, the baseline matches the installed component, so these tests would not fail there. Rung 2 decides.
- Hypothesis count: iteration 1 had no hypothesis (mechanical plan). This is the first schema hypothesis, and it is the builder's own prescription. It is not a repeat.
- Isolation: there is no cross-suite contamination signal. The failure is deterministic and schema-level.

## Spec Changes Made
none

## Weak Evidence Flags (preventative — best effort)
- tests/test_UAT_FC_REQ-202_passwordless_wiring.test.ts::test_UAT_FC_REQ-202_every_statement_in_SCHEMA_STATEMENTS_is_in_the_migration — weak-observation (silent skip) — it is `skipIf(!PASSWORDLESS_INSTALLED)`, so on a machine without the shared store the only schema-drift guard silently passes. Consider having the quality gate fail rather than skip when the preflight component is absent.
- tests/test_UAT_FC_REQ-202_passwordless_wiring.test.ts::test_UAT_FC_REQ-202_the_baseline_creates_login_tokens_and_sessions — weak-observation — it checks only for the substring `CREATE TABLE IF NOT EXISTS sessions`, which a stale five-column table also satisfies (the exact defect here). The drift test above is the real guard.

## Batches
One batch: the whole failure set shares one root cause (the `sessions` DDL) and one edit path (the migrations).

Batch 0 makes the deployment schema match what the component and the reference expect:
1. Replace the `sessions` statement in `0001_baseline.sql` with the component's current `SCHEMA_STATEMENTS` text, the nine-column table plus `idx_sessions_origin_id` and `idx_sessions_retired_at`. It must be verbatim, so the REQ-202 drift test's whitespace-collapsed comparison matches.
2. Add `0002_session_rotation.sql` with the reference's rename/copy/backfill shape, so a D1 that already applied the old baseline converges. A bare-ALTER file would break fresh databases with `duplicate column name`.

No test, AC or story edits.

## Mode overrides (REQ-892)
- Batch 0, rule `code_frozen`, rung 2. Files: `db/migrations/0001_baseline.sql`, `db/migrations/0002_session_rotation.sql`. Justification: the reference (`0001_baseline.sql:951-988`, `0002_session_rotation.sql:42-87`) shows the `sessions` schema matching the installed component. This tree's baseline is the pre-rotation shape the component no longer writes against, so the settled REQ-202 tests are right and the migration is wrong. trust_boundary: false (DDL only, no escaping or sanitising). dependency_tests: no earlier story in this run has completed (STORY-171 is the only story in bundle-7988e925). The consumers of this schema are this story's own ACs (AC2343–AC2355) and the REQ-202 free-coded tests, all in scope.

## Resolution ladder (REQ-938)
- Batch 0, decided at rung 2.
  - Rung 1: REQ-202 (in scope) requires the migration to carry the component's `SCHEMA_STATEMENTS` verbatim, but it does not name the column set. REQ-231, which introduced the rotation columns, is not in this bundle, so rung 1 does not decide.
  - Rung 2: the reference shows the nine-column `sessions` table and both rotation indexes at `0001_baseline.sql:951-988`, plus the `0002_session_rotation.sql` converge-migration. That is what the user runs, and this tree's baseline disagrees with it.
  - Rung 3: the tests stand unchanged. Only the migrations change.