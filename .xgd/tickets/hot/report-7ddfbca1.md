---
uid: report-7ddfbca1
id: REPORT-874
type: report
title: 'Resync resolve conflicts: f72504735d5405af1376d8b1ddd218c0bc1ba4ea'
created_by: xgd
created_at: '2026-07-24T06:14:32.016743+00:00'
updated_at: '2026-07-24T06:14:32.016743+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — **UU**, config/bookkeeping (version scalar). Only conflict hunk was the `version` field: OURS `0.0.191` (sync_working_to_main, post-watermark) vs THEIRS `0.0.183` (incoming free-coded fold fix). Resolution rule "take more recent commit by timestamp" → OURS commit (2026-07-23T23:11:58) is newer than incoming b25e10bf (2026-07-23T12:19:11), so kept `0.0.191`. Flagged for post-merge review. Incoming's only package.json change was this stale version bump, so no developer code discarded.

## Incoming changes preserved

Incoming commit b25e10bf ("fix(l1-fold): reconstruct run surfaces as backing boxes + doc.background") touched 5 files. The 4 substantive files applied cleanly (no conflict) and are staged, with net diff vs HEAD matching the incoming stat exactly:

- `tools/generate/src/l1/fold.ts` — +44 lines; distinctive incoming lines present (`surfaceIdx`, "backing box" surface-reconstruction comment, `surfaceFill`/`surfaceGradient` handling).
- `tools/generate/src/l1/probes.ts` — +9 lines, staged.
- `tests/bug11-fold-surface-fill.test.ts` — +198 lines (new file), staged.
- `tests/req92-image-box-fold.test.ts` — +13 lines, staged.

Only `package.json`'s version bump (bookkeeping) was not carried, by the timestamp rule. All implementation/test changes from the incoming free-coded commit are present in the resolved tree. Zero conflict markers remain; CHERRY_PICK_HEAD (b25e10bf) left intact for the next workflow step.
