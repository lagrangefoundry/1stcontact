---
uid: comment-4b047e40
id: COMMENT-336
type: comment
title: Comment on acceptance_criterion AC-717
created_by: xgd
created_at: '2026-07-23T07:32:06.348087+00:00'
updated_at: '2026-07-23T07:32:06.348087+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-3a1cae43
  kind: note
---

DEPRECATED / collapsed per REPORT-795 (AC-level dedup). Behavioural duplicate of AC-684 (acceptance_criterion-5de42d48): both assert L1 geometry keyframes drive per-viewport layout via interpolate/snap segments, with identical verification shape. Re-homed from archived STORY-81/CAP-68 into STORY-83; AC-717's only distinct content was provenance (variation carried by L1, not per-breakpoint module dials), now folded into AC-684's criterion. Duplicate test file tests/reconciliation-responsive-keyframes.test.ts retired; behaviour remains covered by tests/reconciliation-l1-substrate.test.ts (test_UAT_AC684_interpolate_varies_continuously_and_snap_holds).