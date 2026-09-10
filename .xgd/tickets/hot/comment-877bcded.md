---
uid: comment-877bcded
id: COMMENT-2627
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T22:55:40.642844+00:00'
updated_at: '2026-09-10T22:55:40.642844+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4c3e67c5
  kind: note
---

**REPORT-3811** (`report-4c3e67c5`) — **FAIL**: 2 violations, 2 warnings, 0 needs_review.

## What I checked

Built the intent ledger from both stories' `intent_uid`/`updated_by` (BUNDLE-14 → REQ-116, BUNDLE-16 → REQ-117, BUNDLE-19, REQ-136), expanded to member intents, and widened to every reconciled intent that touches the edit render or the edit gesture through 2026-08-31 (REQ-119, 132, 133, 135, 138, 139, 140, 145, 147; BUG-34, BUG-35, BUG-37; REQ-134 abandoned, excluded).

No coverage gap and no exclusivity problem — STORY-98 and STORY-101 split the capability cleanly, and the superseded CAP-84 holds zero stories. Both violations are stale **out-of-scope** claims.

## The two violations

**1. STORY-101 still excludes image framing.** Its out-of-scope reads "image framing — crop, scale, scrim, rotation, edge effects and free positioning". REQ-136 (`free_and_reconciled`, merged `a23c4c51`) put exactly those rows into this dialog's parameter sheet. Verified in code — `packages/site-schema/src/l1/edit.ts:833-851` (Fill mode, Pan across/down, Shape, Corner rounding, Rotate, Scale) and `:795-800` (the adjustment rows) — and in the gesture's own evidence, `tests/reconciliation-copy-edit-form-presentation.test.ts:1341`. The sibling write-path story STORY-100 already carries the full list as delivered.

**2. STORY-98 still calls the edit channel local and unshipped.** "It is a local render channel; the published and preview channels remain the only shipped ones." REQ-145 (`free_and_reconciled`, completed 2026-08-31) AC1 has the deployed Worker rendering "the draft and edit channels" with `1c builder` not running — confirmed at `apps/control-app/src/router.ts:68` and corroborated by BUG-37's measurements against that origin.

Both repairs are body edits; neither needs an AC added or deprecated. I flagged in the report that neither body has been edited in this cycle (STORY-101 `last_field_updated: status`, STORY-98 `uat_coverage`), so these findings will recur until the paragraphs themselves change.
