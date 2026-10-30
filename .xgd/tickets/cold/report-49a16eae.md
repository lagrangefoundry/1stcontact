---
uid: report-49a16eae
id: REPORT-1038
type: report
title: 'Resync resolve conflicts: d3d689184dbc45f44b278bad79f1c82fb57525b9'
created_by: xgd
created_at: '2026-07-29T04:45:10.167898+00:00'
updated_at: '2026-07-29T04:45:10.167898+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class **UU**, config file (STEP 2g) with per-file intent enrichment.
  Sole conflicting hunk is the `version` scalar: ours `0.0.225` vs incoming `0.0.221`.
  **Rule applied:** the per-file enrichment rule ("intent unknown on one or both sides —
  take the more recent commit by timestamp, flag for post-merge review").
  Ours `877165bcc` @ 2026-07-28T21:38:56-07:00 is more recent than incoming
  `a84cbc46d` @ 2026-07-28T20:52:46-07:00 → **ours wins, `0.0.225` retained.**

  ⚠️ **Flagged for post-merge review**, and note a rule tension: the generic STEP 2g
  guidance ("scalar conflicts: incoming wins") would have selected `0.0.221`. That was
  NOT applied, because it is wrong here on two independent grounds:
    1. It moves the version *backwards* (0.0.225 → 0.0.221) — non-monotonic.
    2. It contradicts the established convention of this resync branch: all four prior
       picks (`821796e66`, `a2a4862b4`, `0ce425c02`, `5fda4f9e8`) landed WITHOUT touching
       `package.json`; the version has stayed pinned at `0.0.225` across the whole branch.
  The incoming `0.0.220 -> 0.0.221` bump is source-branch bookkeeping with no meaning in
  the main-rooted resync context. Resync picks carry code only.

No other conflicts. The remaining 10 paths auto-merged cleanly and are staged as-is.

## Incoming changes preserved

Verified by object-hash comparison of each staged blob against the same path in
CHERRY_PICK_HEAD (`a84cbc46d`) — all identical, zero drift:

- ✓ `packages/framework/src/l1/render.ts`
- ✓ `packages/site-schema/src/l1/index.ts`
- ✓ `packages/site-schema/src/l1/layout.ts` (new file)
- ✓ `packages/site-schema/src/l1/schema.ts`
- ✓ `packages/site-schema/src/l1/types.ts`
- ✓ `packages/site-schema/src/l1/validate.ts`
- ✓ `storage/sites/xgd/draft/pages/home.json`
- ✓ `tests/req100-scroll-reveal.test.ts`
- ✓ `tests/req104-responsive-layout.test.ts` (new file)
- ✓ `tools/generate/src/l1/probes.ts`

`package.json` diff vs incoming is exactly one line — the intentional `version` scalar.
No developer code discarded. No test function deleted or modified.

## Verification performed

- Staged tree hash `2a11d31122136050cd818afcb1552b4708b16c68`.
- Net change vs HEAD is non-empty: 10 files, +1427 / -1693.
- `pnpm -r build` clean (all 7 buildable workspace projects; `@1stcontact/framework`
  exposes only `typecheck`, its edited `render.ts` is covered transitively by the
  `public-site` / `control-app` `tsc --noEmit` passes, both green).
- Tests carried by this pick pass: `tests/req104-responsive-layout.test.ts` (new) and
  `tests/req100-scroll-reveal.test.ts` — 19/19.
- Full suite: 882 passed, 4 failed. All 4 failures are **environmental, not a regression** —
  they read `storage/references/gigabytealchemy.ai/index/multistate.json`, and
  `/storage/references/` is gitignored (`.gitignore:146`) with zero files tracked, so the
  directory does not exist in this worktree and these tests could never have passed here.
  The pick touches no reference paths. Affected: `tests/bug17-fold-padding.test.ts`,
  `tests/req91-l1-pixel-mover-axes.test.ts`, `tests/req96-control-composition.test.ts`.

## Process note

An earlier step in this session ran `git cherry-pick --continue` prematurely, before this
prompt's constraint was in scope. That was detected and fully reverted: the branch was
reset to `877165bcc` (clean tree, no work lost — the commit remains in reflog) and the pick
re-run to restore the paused state. `CHERRY_PICK_HEAD` is present again at `a84cbc46d`, and
the re-resolved staged tree hashes **identical** to the previously verified result, so the
build/test evidence above applies unchanged. The cherry-pick is paused and staged, awaiting
the workflow's own continuation step.
