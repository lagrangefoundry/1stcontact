---
uid: report-26a1d88d
id: REPORT-986
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T20:55:09.425880+00:00'
updated_at: '2026-07-27T20:55:09.425880+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — **UU, config file (2g)**. Sole conflict hunk was the `version`
  scalar: ours `0.0.212` (from `02896c2ce` — `xgd: sync from xgd-working 5cd728086215
  (post-watermark)`, 2026-07-27 13:32:42 -0700) vs theirs `0.0.199` (from
  `5d4149297`, 2026-07-25 10:45:22 -0700).
  Applied the enriched per-file rule ("intent unknown on one side — take the more
  recent commit by timestamp and flag for post-merge review"): **kept ours,
  `0.0.212`**, the newer of the two. This also preserves version monotonicity on the
  resync branch, which already carries commits past 0.0.199; replaying the older bump
  would regress the version and break the free-coding version-bump gate.
  **Flagged for post-merge review** per the rule: the incoming commit's own version
  bump is intentionally discarded — only the version line, no other field.

- `tools/generate/src/l1/fold.ts` — applied cleanly by the cherry-pick (staged `M`,
  no conflict). Untouched by this resolution.

- `tests/req88-surface-shape-and-fontface.test.ts` — applied cleanly by the
  cherry-pick (staged `M`, no conflict). Untouched by this resolution.

No UAT test function was deleted. No ticket files were in conflict.

## Incoming changes preserved

Verified by diffing the resolved worktree against the incoming commit
(`CHERRY_PICK_HEAD` = `5d414929774057c2ed548ad38eb6f7514a8e18de`):

- `git diff 5d4149297 -- tools/generate/src/l1/fold.ts` → **empty**; resolved file is
  byte-identical to the incoming version. The fix (a text box rounds its width **up**
  so a shrink-to-fit run cannot wrap inside its own glyph extent) is present.
- `git diff 5d4149297 -- tests/req88-surface-shape-and-fontface.test.ts` → **empty**;
  resolved file is byte-identical to the incoming version. All 50 added test lines
  are present.
- `package.json` — the only incoming change was the version bump, deliberately not
  taken per the timestamp rule above. No other incoming edit to this file existed.

Net staged change vs HEAD is non-empty: 2 files changed, 60 insertions(+),
1 deletion(-). `git status --porcelain` shows no UU/AA/DU/UD lines.
`CHERRY_PICK_HEAD` is still present — the cherry-pick remains paused for the next
workflow step.

## Note on worktree state

Before this prompt was issued, an earlier turn in this same session ran
`git cherry-pick --continue`, which completed the pick as `8ccb1002e` and cleared
`CHERRY_PICK_HEAD`. That state was restored before resolving: `git reset --hard HEAD~1`
back to `4ef7d7437`, then `git cherry-pick 5d4149297` re-run to reproduce the identical
paused conflict. `CHERRY_PICK_HEAD` and the staged resolution are now exactly what the
next step expects. No `--continue`/`--skip`/`--quit`/`--abort` was run during this task.
