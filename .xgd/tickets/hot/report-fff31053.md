---
uid: report-fff31053
id: REPORT-5803
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T14:34:36.351512+00:00'
updated_at: '2026-10-02T14:34:36.351512+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Pick `cbcde4aef7` (REQ-308, "a control carries its own type, and a paintless band is not a surface")
onto HEAD `bc9f178253`. Anchor `report-377b581e`, apply target
`ec118d67626fd31cfce67ca88dc9908ecdde70ed`, `prior_stage_failure` empty. Ours on all three
paths is `bfc29dca06` (BUG-139, "count a declined per-band measurement as unmeasured").

The developer already merged these two tickets on xgd-working: `f697f337ea`
"Merge branch 'xgd-working' into free-REQ-308" (parents `cbcde4aef7` = this pick, `9384b5129b`),
whose message lists `values-diff.ts` and `unmeasured.ts` as its conflicts.

- `tools/generate/src/cli/capture/values-diff.ts` — code, keep BOTH. Stage 2 blob `f0cc85909e`
  is byte-identical to the merge's second parent, so the merge blob `3079aee30c` is the
  developer's own integration of BUG-139 + REQ-308. Taken verbatim.
- `tools/repro-console/src/unmeasured.ts` — code, keep BOTH. Stage 2 blob `a6cecb1680` is
  byte-identical to the merge's second parent; merge blob `ca7a0f3a16` taken verbatim.
- `tools/generate/src/cli/gate-core.ts` — code, keep BOTH, 2 regions, hand-integrated. The
  developer's merge did not conflict here; ours conflicts only because HEAD carries a
  branch-local field order (`unpairedSections`/`unpairedActualSections` above `worstTier`, from
  earlier resync resolutions). Kept HEAD's order and added incoming's `nonSurfaceSections`
  (docblock + field in `GateReport.values`, and the property in the returned literal) directly
  after `unpairedActualSections`, where incoming put it. The other three REQ-308 hunks in this
  file (`ReconcileInput.nonSurfaceSections?`, the `nonSurfaceSections` const, the `outstanding`
  push) auto-merged.

## Verification

- `git diff 4eac508d89 -- gate-core.ts` (developer merge blob vs resolution) shows only what
  `git diff <merge^2 blob> <stage 2>` already showed before the pick: the `worstTier` reorder in
  the interface and the literal, and a 3-line BUG-110 comment HEAD does not have. Nothing
  incoming-authored is missing.
- `git diff --cached --stat f697f337ea -- <all 14 pick paths>` is empty apart from that
  `gate-core.ts` delta, so the 11 cleanly-applied paths equal the developer merge too.
- `git diff --cached --shortstat HEAD`: 14 files, +1386/-17 — identical to the pick's own
  diffstat. All 14 staged paths are in the pick's diff; nothing outside it is staged.
- No conflict markers in the three paths; no unmerged entries; HEAD unmoved; `CHERRY_PICK_HEAD`
  intact.
- `tsc --noEmit -p tools/generate/tsconfig.json`: no errors in any pick path. Four errors
  remain, none from this pick: the three known `templateUid` TS2353 errors in
  `apps/control-app/src/{invites,lead,sessions}.ts` (already on HEAD) and
  `tools/generate/src/fonts/seed.ts` TS2307 `Cannot find module 'miniflare'` (worktree install).

## Tests

NOT verified by test run — the environment blocks the relevant suites:

- `tests/test_UAT_FC_REQ-308_a_control_carries_its_own_type.test.ts`,
  `tests/test_UAT_FC_REQ-308_a_paintless_reference_band_is_not_a_surface.test.ts` and
  `tests/req51-object-grouped-report.test.ts` fail at import: `Cannot find package 'miniflare'`
  from `tools/generate/src/fonts/seed.ts` (not a pick path). 0 tests collected.
- `tests/test_UAT_FC_REQ-277_unmeasured_is_the_headline.test.ts`: 5/5 fail on
  `listen EPERM 127.0.0.1` (sandbox forbids local port binding).
- `tests/test_UAT_FC_BUG-139_declined_measurement_is_unmeasured.test.ts`: 5/5 pass.

The REQ-308 UATs need a run in a role with a full install before this pick is treated as green.

## Flagged for post-merge review

- The enrichment's rule for all three files was "intent unknown, take the more recent commit by
  timestamp". Not applied: both sides are independent additive features and the developer's merge
  keeps both.
- `gate-core.ts` field order differs from xgd-working (HEAD keeps `worstTier` after the
  unpaired-section counts). Cosmetic; no consumer reads key order.
- The developer merge `f697f337ea` also brought xgd-working changes to other paths (e.g.
  `tests/test_UAT_FC_REQ-277_unmeasured_is_the_headline.test.ts`, `capture/index.ts`); those are
  the second parent's own commits, already on HEAD or arriving as their own picks, and were not
  touched here.
