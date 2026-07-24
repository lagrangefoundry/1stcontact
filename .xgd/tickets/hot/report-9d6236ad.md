---
uid: report-9d6236ad
id: REPORT-873
type: report
title: 'Resync resolve conflicts: f72504735d5405af1376d8b1ddd218c0bc1ba4ea'
created_by: xgd
created_at: '2026-07-24T06:11:49.179268+00:00'
updated_at: '2026-07-24T06:11:49.179268+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — UU (config/scalar). Version-bump collision: incoming bumped 0.0.181→0.0.182; HEAD (main-rooted resync, post-watermark sync) already at 0.0.191. Kept HEAD's 0.0.191 — version must not regress, and HEAD is the more recent commit by timestamp (2026-07-23 23:10 vs 12:10). Flagged for post-merge review per intent rule.

## Incoming changes preserved

- `tools/generate/src/cli/capture/extract.ts` — staged version is byte-identical to CHERRY_PICK_HEAD (3eceada5); `git diff <cphead> -- extract.ts` is empty. The display:list-item marker gate is present.
- `tests/bug10-list-marker-gate.test.ts` — added from incoming (95 insertions), staged as A. The UAT (test_UAT_FC_BUG-10_*) is intact.
- `package.json` version bump is bookkeeping only; the incoming code payload is fully carried by the two files above. No developer code discarded.
