---
uid: comment-e5c726d5
id: COMMENT-2570
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T17:42:57.246926+00:00'
updated_at: '2026-09-10T17:42:57.246926+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ca925e0f
  kind: note
---

**Result: FAIL** — 2 violations, 1 warning, 0 needs_review. Report: **REPORT-3769** (`report-ca925e0f`).

## What I did

Read all 43 AC bodies in full against STORY-100's post-repair body — the sweep REPORT-3766 recommended and REPORT-3768 explicitly deferred ("the remaining ~25 ACs untouched since 2026-08-16 were not re-swept this call").

**Last cycle's repairs are confirmed applied.** All 9 fixes from REPORT-3766 landed: AC-1117 reordered and recounted, AC-992 restated as the origin observable, AC-1026 reduced, AC-982 owning the CLI both-channels claim, the origin clause dropped from AC-1024/1048/1111 and rephrased in AC-1273, AC-990 and AC-1045 reduced, AC-1122 given its negative half, STORY-100 given the overflow parent bullet. Warnings 4, 5 and 6 — four cycles unrepaired — are closed.

## The two violations

Both are one-sentence edits inside a **verification** section; neither touches a criterion, and neither is a code issue — implementation and shipped UAT already assert the corrected claim.

1. **AC-1111** — "assert **its one field** declares the same thing" of a painted panel carrying a background. It exposes **two** fields: `copyFieldsOf` pushes `backgroundImageUrl` then `surfaceFill` unconditionally for any painted box/container (`packages/site-schema/src/l1/edit.ts:1022-1046`). The UAT already asserts `['backgroundImageUrl','surfaceFill']` and says so in a comment (`tests/reconciliation-copy-edit-field-format.test.ts:238-247`).

2. **AC-991** — "a run of copy, which exposes fields of **four of the five** shapes". It exposes all five: `string`, `color`, `integer`, `enum`, `boolean`. The UAT asserts exactly that (`for (const shape of CONTROL_SHAPES) expect(runShapes).toContain(shape)`).

## The pattern worth carrying forward

Last cycle framed the risk as "ACs untouched since 2026-08-16". Both survivors falsify that: AC-1111 was edited **today**, AC-991 was edited **in the colour batch itself** — the same 2026-08-20 pass that raised its criterion from four shapes to five left its verification saying four. What they share is that each edit was surgical and stopped at the sentence it came for, so `updated_at` is not a proxy for "reconciled with the current body". The cheaper successor rule I recorded: when a repair changes a count, ordering or exhaustive list in one AC, grep the whole tree for the same number — AC-991 is the unrepaired twin of the "four control shapes" error REPORT-3766 fixed in AC-1117.
