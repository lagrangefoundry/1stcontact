---
uid: report-e42de3cc
id: REPORT-11420
type: report
title: 'Fix reconciliation review: bundle-c0301347'
created_by: xgd
created_at: '2026-11-08T11:50:50.393421+00:00'
updated_at: '2026-11-08T11:50:50.393421+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-c0301347
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-e07c589b (STORY-128): gained AC-2412 (acceptance_criterion-7dcc23b9), which replaces superseded AC-1492. It restates AC-1492 in full, with "where it came from" extended to include `generated` (REQ-208), and its body opens "Replaces AC-1492…". This follows the AC-2409/AC-2337 pattern.

## Stories deleted
None

## ACs superseded
None this call. AC-1492 was already superseded by request-68718201, and it stays that way.

## FC orphans renamed/deleted
None. There is no fc_orphan_check report for this anchor.

## Code changes
- tests/reconciliation-material-types.workers.test.ts (commit 97ab3d1192):
  - UAT renamed to test_UAT_AC2412_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement, with store key ac2412.
  - `'generated'` added to ORIGINS, so both material and reference are shown to accept and read back origin=generated.
  - Comment updated to say "two of the five".
- No production change. tickets.ts:89 already accepts generated.
- Optional hardening item 2 (AC-2380 case-insensitive vendor match) not done. The review marked it optional and not a cause of the FAIL.

## Confidence
High. The single blocking gap (gap 1) is addressed exactly as the review prescribed.
