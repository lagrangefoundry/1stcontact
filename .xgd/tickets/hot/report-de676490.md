---
uid: report-de676490
id: REPORT-11145
type: report
title: 'Report: mode_override for story-e0ca0a36'
created_by: xgd
created_at: '2026-11-07T19:42:01.955033+00:00'
updated_at: '2026-11-07T19:42:01.955033+00:00'
completed_at: null
last_field_updated: created_at
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
---

# Mode override granted: code_frozen

The reference state's baseline carries the sessions schema that the installed auth-passwordless component writes against, and this tree's baseline is the pre-rotation shape, so the settled REQ-202 tests (AC2347-AC2354 and the FC drift and conformance tests) are right and the migration is wrong. The builder's blocked_by prescription matches the reference exactly.

Planner instructions for the batch:

The suite now loads (the earlier 'Cannot find module ./generated/ticketing' was missing build output, since regenerated). The remaining failures share one root cause: the sessions DDL in db/migrations/0001_baseline.sql (around lines 811-824 in this tree) is the old five-column table, and the shared-store auth-passwordless component writes issued_at, origin_id, superseded_by and retired_at. Under the code_frozen override, (1) replace that CREATE TABLE IF NOT EXISTS sessions statement with the component's current SCHEMA_STATEMENTS text verbatim (nine columns, all nullable after last_seen_at) and add CREATE INDEX IF NOT EXISTS idx_sessions_origin_id ON sessions (origin_id) and idx_sessions_retired_at ON sessions (retired_at), keeping the existing subject_id/expires_at indexes. The reference shape is reconcile-src-BUNDLE-38:db/migrations/0001_baseline.sql:951-988. (2) Add db/migrations/0002_session_rotation.sql so a database that already applied the old baseline converges: rename to a staging table, re-create sessions with the component's statement, copy the five shared columns, backfill origin_id = id and issued_at = created_at WHERE ... IS NULL, drop the staging table, then re-create all four indexes. It must not use bare ALTER TABLE ADD COLUMN, which fails with 'duplicate column name' on fresh databases. Do not touch tests, ACs, sessions.ts or anything outside these two migration files. Done means AC2343-AC2355 and test_UAT_FC_REQ-202_ pass against the installed component. If a test still fails after the schema matches, report the new error rather than editing code outside the override.
