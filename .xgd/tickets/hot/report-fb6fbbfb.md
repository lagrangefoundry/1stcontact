---
uid: report-fb6fbbfb
id: REPORT-7383
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:28:27.928618+00:00'
updated_at: '2026-11-01T06:28:27.928618+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- apps/control-app/src/describe.ts — UU code file (2c). Non-overlapping combine. The only conflicted hunk was HEAD's `fullText: null` in describeCapture's `withFacts` return. The incoming commit (77250a1a19, REQ-166, 2026-09-02) did not remove that line: it predates REQ-173 (9df6224cf7), which made `Description.fullText: string | null` a required field. Kept HEAD's line, which is also the newer commit by timestamp. Flagged for post-merge review per the enrichment rule.
- package.json — UU, scalar version field. Kept HEAD's "0.2.57" (BUG-46 bump, 2026-10-31) over incoming's "0.2.52" (2026-09-02). The incoming change was only a stale 0.2.51 -> 0.2.52 bump, and taking it would downgrade the version. This follows the enrichment rule to take the more recent commit. Flagged for post-merge review.

## Incoming changes preserved

- describe.ts: all REQ-166 additions (DescribeCaptureInput, CaptureEssence, palette, families, measured, captureTitle, link, describeCapture) are present in the resolved file and were already in HEAD. Staged diff vs HEAD is empty, so the commit is redundant (BUG-1109/BUG-1122 shape), not discarded: its content landed on HEAD earlier by another route.
- package.json: the incoming version bump is superseded by HEAD's later bump. No developer code was lost.
