---
uid: report-4ed887a2
id: REPORT-876
type: report
title: 'Resync resolve conflicts: f72504735d5405af1376d8b1ddd218c0bc1ba4ea'
created_by: xgd
created_at: '2026-07-24T06:17:56.050554+00:00'
updated_at: '2026-07-24T06:17:56.050554+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class UU (config scalar / version-bump collision). Rule: per-file enrichment "take the more recent commit by timestamp." OURS is the main-rooted post-watermark sync at `0.0.191`, which post-dates the incoming free-coded commit `c78f27ae` (2026-07-23 12:43) and is the higher, non-regressing version. Kept `0.0.191`; discarded incoming `0.0.184`. Net change vs HEAD: none (HEAD already at 0.0.191) — expected for a discarded stale version bump.
- `tools/generate/src/cli/capture/pipeline.ts` — class M (applied cleanly, no conflict). Staged as-is from incoming.
- `tests/bug12-cross-origin-font-faces.test.ts` — class A (new file from incoming). Staged as-is.

## Incoming changes preserved

- `tools/generate/src/cli/capture/pipeline.ts` — staged index blob is byte-identical to `c78f27ae:tools/generate/src/cli/capture/pipeline.ts` (verified via git show diff). ✓
- `tests/bug12-cross-origin-font-faces.test.ts` — staged index blob is byte-identical to `c78f27ae:tests/bug12-cross-origin-font-faces.test.ts`. ✓

## Notes

- CHERRY_PICK_HEAD is present (c78f27ae); the cherry-pick remains paused for the downstream step to `--continue`. Only staging was performed here.
- Recovery note: an earlier step in this worktree had prematurely run `cherry-pick --continue` (commit 16fb3bd0, now in reflog). This was reverted by resetting to the parent `deb9bbaf` and re-initiating the cherry-pick to restore the paused CHERRY_PICK_HEAD state the workflow expects. The re-resolution is identical in content to the earlier one.
