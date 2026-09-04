---
uid: report-0e9ba84f
id: REPORT-3511
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T06:00:03.530727+00:00'
updated_at: '2026-09-04T06:00:03.530727+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-e7871ed7
---

All 13 UATs pass, one per acceptance criterion, names matching `^test_UAT_AC\d+_\w+$`.

**What I did beyond a pure "create new file":** the story's own FC file `tests/test_UAT_FC_REQ-167_identity.workers.test.ts` (19 tests) already existed and mapped entirely onto these 13 ACs. I wrote the new file as its rename — a verified superset — and deleted the FC original, which is what the FC orphan invariant requires. Nothing imports it (one prose comment in `test_UAT_FC_REQ-147_access_gate.test.ts:228` mentions it by name; I left that file untouched per the no-modification rule).

**Coverage added over the FC original**, tracking the story's Reconciliation Decisions:
- AC-1595 — `admit` (not just `provisionInvite`) refuses on an unconfigured tenant; empty-email invitation; record counts unchanged.
- AC-1597 — a *refused* visit still advances `last_seen_at`.
- AC-1599 — the suspended person and expired ownership cases, each with the other two dimensions asserted healthy.
- AC-1600 — determinism, and removal of the open-ended grant promoting the later-ending one.
- AC-1601 — a grant naming a plan/status no code path produces reads back unchanged; DDL declares no unique index on `entitlements`.
- AC-1602 — the operator-facing `admission_denied` log distinguishes both reasons and names each email; the refusal precedes page, asset and API surfaces alike.
- AC-1603 — the never-invited contrast on the same path.

**Full workers project**: 240 passed, 29 failed across 9 files — all pre-existing failures in the knowledge-base/material-ingestion suites (`KnowledgeConfigError: … available: none`), none in identity and none touched by this change.

```
UATs generated for story story-e7871ed7 (plan item 14 of 15)

Story: story-e7871ed7
Test file(s) created:
  - tests/reconciliation-identity-accounts-entitlement.workers.test.ts
Test file(s) deleted (superseded rename, FC orphan invariant):
  - tests/test_UAT_FC_REQ-167_identity.workers.test.ts

Tests written: 13
Tests passed: 13
Tests failed: 0

test_files_created:
  - "tests/reconciliation-identity-accounts-entitlement.workers.test.ts"
```
