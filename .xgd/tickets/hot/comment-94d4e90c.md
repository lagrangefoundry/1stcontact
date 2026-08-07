---
uid: comment-94d4e90c
id: COMMENT-819
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T22:10:01.357861+00:00'
updated_at: '2026-08-07T22:10:01.357861+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-54b011da
  kind: note
---

**Result: PASS** — REPORT-1639 (`report-54b011da`). 0 violations, 1 warning, 0 needs_review.

## What I checked

3 stories, 36 active ACs, 36 UATs across 4 test files. Every AC has exactly one `test_UAT_AC<n>_*` test — no gaps, no duplicates. I ran them: **36 passed / 36** in 1.14s.

Every UAT drives a real entry point rather than a structural check — `cmdDeploy`, `worker.fetch`, `startServe` over loopback, and a raw socket where `fetch` would normalise a traversal away before it reached the confinement guard. R2 is faked only at the binding.

## The drift risk I targeted

The ac-level fix (REPORT-1637) edited four ACs on 2026-08-07, after their tests were written — AC-892, AC-896, AC-905, AC-906. That's exactly where stale tests would land. All four newly-added clauses are already exercised, including AC-906's subtle one: the not-found byte comparison is correctly done *within* each channel, with `x-robots-tag` asserted as the sole cross-channel difference.

## The one warning

`test_UAT_AC914` proves the reserved-segment refusal by calling the pure gate `assertNoReservedSegment` directly, then asserts the store is byte-unchanged (`reconciliation-serve-deployed-snapshot.test.ts:880-881`) — an assertion that cannot fail, since no deploy was attempted and the gate never writes. The AC's "ships nothing" half is therefore asserted vacuously.

The production wiring is genuinely correct — I read it: `deploy.ts:136` runs the gate after `collectSnapshotFiles` and before the first upload. That ordering is what makes "refused before any bytes are shipped" true, and it's what the test doesn't pin. I kept this a warning rather than a violation because STORY-95's Technical Context explicitly sanctions gate-level verification: rendered pages are emitted flat, so no site definition today can trigger the collision.

Three findings recorded as info: the free-coded `req111` test file duplicates 10 of these scenarios in the same shape (project-wide convention — 120 FC files vs 51 reconciliation files, not capability drift); AC-892's overlap with AC-925 is proving its own tree-qualification clause, not duplicating; and AC-900 pins size on the render line but only count on the upload lines.
