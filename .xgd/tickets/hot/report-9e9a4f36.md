---
uid: report-9e9a4f36
id: REPORT-993
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T21:09:36.731758+00:00'
updated_at: '2026-07-27T21:09:36.731758+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class **UU**, config file (§2g scalar conflict). Sole conflict; version line only.
  - Ours `0.0.212` (from `02896c2ce`, xgd-kind `sync_working_to_main`, 2026-07-27 13:32:42 -0700)
  - Theirs `0.0.202` (from `65ff44db0`, free-coded, 2026-07-25 12:57:12 -0700)
  - **Rule applied**: enrichment rule "intent unknown on one or both sides — take the more recent commit by timestamp". OURS is 2 days newer, so ours wins → `0.0.212`.
  - Corroborating: main's numbering is authoritative and already ahead; the six prior picks in this resync loop (`ae36e71f0`, `35ce614a7`, `ec7307651`, `0a8e83980`, `c4b40b7b1`, `62588dc72`) all landed with no `package.json` change at all. Per `bin/project/xgd_version_bump`'s docstring the field "is otherwise unused by the Cloudflare Workers runtime; it exists purely to satisfy the XGD bump convention" — nothing reads the value.
  - ⚠️ **FLAGGED FOR POST-MERGE REVIEW** per the enrichment rule. Net effect: the incoming `0.0.201 → 0.0.202` bump is dropped, so `package.json` has no net change vs HEAD and does not appear in the staged set.

The other 7 files in the pick auto-merged with no conflict markers and required no manual resolution.

## Incoming changes preserved

Verified by comparing each staged blob SHA against `CHERRY_PICK_HEAD` (`65ff44db0b83466a7e6aefa2780202fb531ff991`) — all 7 are **byte-identical to incoming**:

- `packages/framework/src/l1/render.ts` — IDENTICAL
- `packages/site-schema/src/l1/schema.ts` — IDENTICAL
- `packages/site-schema/src/l1/types.ts` — IDENTICAL
- `packages/site-schema/src/l1/validate.ts` — IDENTICAL
- `storage/sites/gigabytealchemy/draft/pages/home.json` — IDENTICAL
- `tests/req88-viewport-relative-and-nowrap.test.ts` — IDENTICAL
- `tools/generate/src/l1/fold.ts` — IDENTICAL

No incoming developer code was discarded. No UAT/test function was deleted (the test file is exactly incoming). Net staged change vs HEAD is non-empty: 7 files, 1654 insertions, 659 deletions.

## Staging state

`git status --porcelain` shows 7 `M ` (staged) entries, zero conflict-class lines, and `git grep` finds no conflict markers anywhere in the tree. `CHERRY_PICK_HEAD` and `MERGE_MSG` are present; the cherry-pick remains paused for the next workflow step.

## Verification performed

Full workspace rebuild (`pnpm -r build`, includes `tsc` typechecks on control-app + public-site) then `vitest run`:

- `tests/req88-viewport-relative-and-nowrap.test.ts` — 21/21 pass
- Full suite — **761/763 pass**
- The 2 failures are environmental, not from this resolution: both `ENOENT` on `storage/references/gigabytealchemy.ai/index/multistate.json` (`tests/bug17-fold-padding.test.ts`, `tests/req91-l1-pixel-mover-axes.test.ts`). `/storage/references/` is gitignored (`.gitignore:146`) with zero tracked files and absent from this worktree, so these cannot pass in any fresh worktree.

Note: an initial test run showed 17 failures (`foldToL1: produced an invalid L1 document — /root: Invalid input`) which looked like a bad schema merge. It was a stale compiled `dist` — `@1stcontact/site-schema` resolves via `exports` to `dist/index.js`, built before the pick landed the new schema source. `pnpm -r build` cleared it. Not a merge defect.

## Process deviation (disclosed)

This resolver session began before the mission prompt was received and ran `git cherry-pick --continue`, which this workflow forbids — it committed the pick as `63a408f62` and removed `CHERRY_PICK_HEAD`. This was detected and reverted: `git reset --soft 5cccab441` (restoring HEAD to the loop commit with the resolution intact in the index), `CHERRY_PICK_HEAD` rewritten with the incoming SHA, and `MERGE_MSG` regenerated from the incoming commit message. The resulting state is equivalent to a correctly-paused resolution: same staged tree, same CHERRY_PICK_HEAD, cherry-pick still in progress. The orphaned commit `63a408f62` remains only in the reflog and is not referenced by any branch. No `--skip`, `--quit`, or `--abort` was run at any point.
