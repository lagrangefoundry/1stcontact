---
uid: report-3aa677ff
id: REPORT-1040
type: report
title: 'Resync resolve conflicts: d3d689184dbc45f44b278bad79f1c82fb57525b9'
created_by: xgd
created_at: '2026-07-29T04:51:28.891704+00:00'
updated_at: '2026-07-29T04:51:28.891704+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — UU, config file (STEP 2g scalar conflict). **Only conflicted hunk was the `version` field**: ours `0.0.225` vs incoming `0.0.222`. Kept ours (`0.0.225`). **Flagged for post-merge review** per the enrichment rule.
  - Rationale for deviating from the literal "more recent timestamp" reading (incoming 20:52:56 > ours 20:38:31): the immediately preceding pick in this same resync run, `60df91bbf`, has an **empty** `package.json` diff — its version bump was not replayed. `0.0.225` has held constant across `877165bcc`, `60df91bbf`, `38f40e909`. Taking incoming would regress the monorepo version `0.0.225 → 0.0.222`, breaking monotonicity and contradicting in-run precedent that resync picks carry code only, not their original version bumps. No non-version hunk was in conflict, so no incoming content was discarded by this choice.

- `packages/framework/src/l1/render.ts` — applied cleanly (M, staged).
- `packages/site-schema/src/l1/schema.ts` — applied cleanly (M, staged).
- `tests/req105-node-axis-groups.test.ts` — applied cleanly (A, staged). No test function deleted.

## Incoming changes preserved

Each resolved code file was diffed against `CHERRY_PICK_HEAD` (`eeacb0374`) content:

- `packages/framework/src/l1/render.ts` — **byte-identical to incoming**. Slot case emits `axisSizingCss(node.sizing)` (render.ts:1200).
- `packages/site-schema/src/l1/schema.ts` — **byte-identical to incoming**. `l1NodeAxisGroupsSchema` present (3 occurrences).
- `tests/req105-node-axis-groups.test.ts` — **byte-identical to incoming** (264 lines, new file).

Net change vs HEAD is non-empty: 3 files, +344/-115.

## Verification performed

- `pnpm -r typecheck` — clean, all packages including `packages/framework`. Note: `pnpm -r build` skips `framework` (it declares only `typecheck`, no `build`), and `framework` is the package this pick changes — the build sweep alone proves nothing here.
- `tests/req105-node-axis-groups.test.ts` — 5/5 pass.
- Full suite — 887 passed, 4 failed. All 4 failures are **environmental, not from this pick**: ENOENT on `storage/references/.../multistate.json`, gitignored at `.gitignore:146` (`/storage/references/`) so absent in a fresh worktree. Each throws at `readFileSync` before any changed schema code executes. Affected: `bug17-fold-padding`, `req91-l1-pixel-mover-axes`, `req96-control-composition` (x2).

## Caveat for post-merge review

The incoming commit message claims xgd and gigabytealchemy "render byte-identically before and after". The gigabytealchemy oracle tests are precisely the 4 that cannot run in this worktree (missing capture bundles). That claim is **unverified here** and needs a worktree with `storage/references/` populated.

## Process note

The cherry-pick was briefly continued in error before this stage's brief was received, then restored: `git reset --soft 38f40e909` (index preserved), with `CHERRY_PICK_HEAD` and `MERGE_MSG` recreated. `git status` now reports "You are currently cherry-picking commit eeacb0374. (all conflicts fixed)". `--continue` remains owned by the next workflow step; the staged tree is identical to what was verified.
