---
uid: report-2a198aab
id: REPORT-5804
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T14:58:37.926124+00:00'
updated_at: '2026-10-02T14:58:37.926124+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync resolve conflicts — pick `26f5491165` (BUG-143) onto BUG-142

- Picked commit: `26f5491165d1b54a9b4a0d0206d85b1f38eb5e69` — feat(l1-gate): a surface that leaves the content it backs, and height as an axis [FREE-CODED] (author 2026-09-25 10:25:37 -0700, 17 files)
- HEAD: `c28d90fe69`; last code commit under it `25b29dbffe` fix(fold): a backing surface owns the content it backs [FREE-CODED] (BUG-142)
- Apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- `prior_stage_failure`: empty; retry count 1
- Session prompt arrived with no mission body; arguments recovered from `session-r36f21cf3.jsonl` seq 51823.

## Conflict

One path, class 2c (UU on code), one marked region:

| path | region | ours | theirs |
|---|---|---|---|
| `tools/generate/src/l1/probes.ts` | `evaluateLayout` return | adds `boxes: ctx.boxes` (BUG-142) | adds the BUG-143 `escape` containment block and `height` on the result |

The enrichment rule ("intent unknown, take the more recent by timestamp") was not used: this is code, both sides are additive, and neither side may be dropped.

## Resolution: the developer's own merge of these two commits

xgd-working carries `1a9983de64` "Merge xgd-working into free-BUG-142: surface containment through nesting [FREE-CODED]" (2026-09-25 13:43:18). It merges exactly these two inputs for this file:

- stage 2 (ours) `56ce4f4c7e` == `1a9983de64^1:tools/generate/src/l1/probes.ts`
- stage 3 (theirs) `94c700795a` == `1a9983de64^2:tools/generate/src/l1/probes.ts`

Resync does not pick merge commits, so that resolution cannot arrive through the queue. I took the merge's blob for two paths, both in the pick's own diff:

1. `tools/generate/src/l1/probes.ts` — the merge's version. Compared with git's plain three-way merge it differs in:
   - the conflicted return: both sides kept (`height` spread, `leaves`, `findings`, `boxes`);
   - integration outside the markers, which the merge message calls "the substantive part": a new `synthesizedSurfacePaths(doc)` walk, `pairsAt(leaves, boxes)` resolving surfaces from the box map as well as the leaves, and `surfaceAt()` in the escape check. BUG-142 makes an owning surface a structural `container` that is never pushed as a leaf, so BUG-143's leaf-only detector would have reported zero escapes on every owning panel. A markers-only resolution would compile and be silently inert.
2. `tests/test_UAT_FC_BUG-143_surface_containment_height_axis.test.ts` — applied cleanly as incoming's blob `17a65d93b3`; replaced with the merge's version (+6/−3): `boxIdsOf` → `surfaceIdsOf`, sweeping `box` and `container`. No test was removed or weakened; the helper is widened so the `backedBy` names resolve against container surfaces. This file was not conflicted — flagging that I changed it deliberately.

## Left as auto-merged (not taken from the merge)

- `tools/generate/src/l1/fold.ts`, `l1/index.ts`, `packages/site-schema/src/l1/{schema,validate}.ts`, `cli/index.ts`, `cli/repro.ts` and the other UAT files: staged content is already byte-identical to `1a9983de64`.
- `tools/generate/src/cli/gate-core.ts`: differs from the merge only in this branch's own `worstTier` field order and one BUG-110 comment, both already in HEAD before this pick.
- `tests/reconciliation-3probe-gate.test.ts`: +52 lines vs the merge, all present in HEAD before this pick (branch-local).
- `package.json`: `0.2.356` (the pick's own value; HEAD was `.355`). The merge reads `.357` from a later auto-bump commit that will arrive on its own.

## Verification

- `git ls-files -u` empty; no conflict markers in `probes.ts`.
- Staged paths outside the pick's own diff: none (`comm -23 staged pick` empty).
- `git diff --cached --stat 1a9983de64 -- tools/generate/src/l1 packages/site-schema tests/test_UAT_FC_BUG-143_*` empty: every l1 file and the BUG-143 suite equal the developer's merge.
- `tsc --noEmit -p tools/generate`: no errors in any file this pick touches. Four errors remain, all outside it: `templateUid` on `OutgoingMessage` in `apps/control-app/src/{invites,lead,sessions}.ts`, and `Cannot find module 'miniflare'` in `src/fonts/seed.ts`.
- HEAD unmoved at `c28d90fe69`; `CHERRY_PICK_HEAD` intact at `26f5491165`.

## Not verified

The BUG-143, BUG-142, BUG-112 and 3-probe gate suites could not be run in this worktree: all five files fail at import with `Cannot find package 'miniflare'` (from `tools/generate/src/fonts/seed.ts`), before any test executes. Zero tests ran, so the resolution is unproven by tests here. The evidence for correctness is byte-equality with the developer's merge.

## For post-merge review

- The merge `1a9983de64` also edited files outside this pick's diff relative to incoming (BUG-142-side suites and `l1/forms.ts`); those came in with the BUG-142 pick, and `HEAD` already equals `1a9983de64^1` on `fold.ts` and `probes.ts`, so nothing further was needed here.
- Next incoming for these files: the `0.2.357` version bump, then `a750b9376c` fix(fold): flow leads measure from a panel's content box.
