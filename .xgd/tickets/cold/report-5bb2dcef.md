---
uid: report-5bb2dcef
id: REPORT-1061
type: report
title: 'Resync resolve conflicts: f5f29fb9f01dfd222dd5a744af7374b1e371be99'
created_by: xgd
created_at: '2026-07-29T06:26:53.492064+00:00'
updated_at: '2026-07-29T06:26:53.492064+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `packages/site-schema/src/l1/validate.ts` — **UU** (code file, §2c: incoming authoritative). Single additive collision inside the `L1_ENVELOPE` object literal: OURS (main-rooted, reconcile bundle-cceaba25) had added `rotateDeg: { min: -3600, max: 3600 }` (REQ-91) at the same position where THEIRS (`0c3f0c371`, BUG-17 free-coded) adds `paddingPx: { min: 0, max: 10_000 }`. The two are unrelated axes with no semantic overlap, so rule §2c step 1 applies: **non-overlapping changes → keep BOTH**. No incoming content was discarded; the "more recent commit by timestamp" tiebreak in the enrichment metadata was not needed because the changes are complementary rather than mutually exclusive.

The commit's second hunk in the same file (the `node.padding` per-side range check in `checkEffects`) applied cleanly, as did all five other files in the pick (`render.ts`, `schema.ts`, `types.ts`, `fold.ts`, `tests/bug17-fold-padding.test.ts`) — auto-merged, no markers.

No deletion (DU/UD), both-added (AA), ticket, or config conflicts in this pick.

## Incoming changes preserved

Verified against `git show $CHERRY_PICK_HEAD -- <file>` for each file:

- `validate.ts` — both incoming hunks present: `paddingPx: { min: 0, max: 10_000 }` at line 41, and the `if (node.padding) { ... }` per-side envelope check at lines 161-171. OURS' `rotateDeg` bound (line 39) and its `checkEffects` consumer are also intact.
- `render.ts` — the four `padding-{top,right,bottom,left}` longhand emissions inside `emitNode`, through the numeric-only `px()` sink.
- `schema.ts` — `l1PaddingSchema` (strict, non-negative per side) plus the `padding` optional field wired onto all five node kinds (text/image/slot/box/container, both the interfaces and the lazy schemas).
- `types.ts` — `l1PaddingSchema` import and the `L1Padding` type export.
- `fold.ts` — `foldPadding()` and its three call sites (text run, image, box).
- `tests/bug17-fold-padding.test.ts` — added whole, 138 lines, all seven `test_UAT_FC_BUG-17_*` functions. No test function was modified or removed.

The staged diff against HEAD is byte-identical in shape to the source commit: 6 files changed, 223 insertions(+), 0 deletions — the same per-file line counts as `git show --stat 0c3f0c371`. Net change from HEAD is non-empty.

## Build / test verification

Run against this exact staged tree (`8b524fc37fd273405a2f400126a4f102631ae2c3`):

- `pnpm -r build` — clean.
- `tsc --noEmit` on `packages/framework` and `tools/generate` (not in the recursive build set) — clean.
- `vitest run tests packages/site-schema packages/framework` — **697 passed, 1 failed**.

The single failure is environmental, not a resolution defect: `test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding` reads `storage/references/gigabytealchemy.ai/index/multistate.json`, and `/storage/references/` is gitignored (`.gitignore:146`) so no capture bundle exists in a fresh resync worktree — the known missing-captures pattern, same class as regression worktrees. The other six BUG-17 UATs (validator accept/reject, renderer longhands, border-box insetting) pass.

## Note on worktree state

An earlier `git cherry-pick --continue` was issued in this worktree before the stage-only constraint was in scope, committing the pick as `4d71390bf`. State was restored for the owning Python step: `git reset --hard 0b6f9b4d1`, re-ran `git cherry-pick 0c3f0c371` (reproducing the identical single UU conflict), and re-applied the same resolution. The resulting staged tree hashes to `8b524fc37fd273405a2f400126a4f102631ae2c3` — bit-identical to the verified tree above. `CHERRY_PICK_HEAD` is present (`0c3f0c371964d57be100a5fda92566c66c712087`) and the cherry-pick is paused and staged, as this step requires.
