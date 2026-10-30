---
uid: report-75c0a862
id: REPORT-5811
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T17:01:50.144532+00:00'
updated_at: '2026-10-02T17:01:50.144532+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — BUG-153 `18389b822e`

**Pick:** `18389b822e2707419728e86e6a3e83d911bb6583` — `fix(values-diff,probes): measure the transform, the mask and the nowrap run [FREE-CODED]` (12 paths)
**HEAD:** `73d5133ba3` · **Apply target:** `ec118d67626fd31cfce67ca88dc9908ecdde70ed` · **Retry:** 1 · `prior_stage_failure`: empty

## Oracle: the developer's own merge `beab9b22c1`

`beab9b22c1` ("merge xgd-working into free-BUG-153", 09-26 17:23:33) has first parent == this pick and
second parent `095014c83c` (xgd-working carrying REQ-333). It is the developer's resolution of exactly
this conflict. Its message: *"`extract.ts` and `package.json` take xgd-working's side wholesale: REQ-333
landed the same two transform findings this branch carries … BUG-153's own layer on top of it is
re-applied in the next commit rather than hand-merged here."*

Inputs proven identical: stage-2 blobs of `package.json` (`9c1d3b4acb`) and `extract.ts` (`d894051bca`)
== the merge's second-parent blobs == the merge's result blobs.

## Per-file resolution

| Path | Regions | Resolution | Why |
|---|---|---|---|
| `package.json` | 1 (`version`) | **ours** `0.2.385` | base .383 / theirs .384 / ours .385. HEAD's `3948d8ca05` (REQ-333 bump, an xgd-working commit already picked) is literally `-0.2.384 / +0.2.385` — incoming's value is retired. Both sides' delta from base is that one line. Matches merge blob. |
| `tools/generate/src/cli/capture/extract.ts` | 4 | **ours** (whole file) | Ours is xgd-working's REQ-333 (`da0d18d624`), not a main-only version. The developer's merge takes this side wholesale; result is byte-identical to the merge blob. BUG-153's layer on this file arrives as its own pick (`da3c01e584`, below). |
| `tools/generate/src/cli/gate-core.ts` | 2 | **keep both** | Incoming adds `bandPaintActual` (interface field + report literal) after `nonSurfaceSections`; HEAD's only delta from base is the branch-local `worstTier` reorder (+ a dropped 3-line comment) sitting at the same spot. Result: `nonSurfaceSections`, `bandPaintActual`, `worstTier`, `unmeasuredAxes`. Proof: `git diff <:3: blob> -- gate-core.ts` equals `git diff <:1:> <:2:>` exactly — all of incoming is present, only HEAD's pre-existing reorder differs. Incoming's two other hunks (ReconcileInput field, `outstanding.push`) auto-merged. |

The 9 cleanly-applied pick paths are byte-identical to the merge (`git diff --cached --stat beab9b22c1`
empty for them). Nothing outside the pick's own diff is staged. No conflict markers remain; no `UU` in
`git status --porcelain`; `CHERRY_PICK_HEAD` intact.

The enrichment's "take the more recent commit by timestamp" rule was not used: it would have pointed at
incoming for `package.json` (regressing the counter) and `extract.ts` (discarding REQ-333's transform
chain, which the developer explicitly kept).

## Verification — and a known, intentional red state

- `tsc --noEmit -p tools/generate/tsconfig.json`: **2 new errors**,
  `capture/sections.ts(164)` and `(201)`: `transformUnreadable` does not exist on `RawRun` / `RawField`.
- `tests/test_UAT_FC_BUG-153_a_nowrap_run_does_not_wrap.test.ts`: 7/7 pass.
- `tests/test_UAT_FC_BUG-153_the_ruler_reads_the_page.test.ts`: suite fails at load
  (`EXTRACT_SCRIPT.indexOf('function decomposeTransform(')` is -1).

Both failures are the developer merge's own state, not a resolution error: `beab9b22c1` has
`transformUnreadable` in `sections.ts`/`types.ts`/`value-axes.ts`/`values-diff.ts` but not in
`extract.ts`. They are closed by the **next code pick in the queue, `da3c01e584`**
(`fix(capture): the third outcome, on top of REQ-333's transform chain [FREE-CODED]`, 09-26 17:25:45),
which re-applies BUG-153 onto REQ-333's `extract.ts` (+100 lines, `transformUnreadable` ×5) and rewrites
the ruler UAT. Not fixed here — hand-porting it would duplicate that pick and make it conflict.

Pre-existing and unrelated: 3× TS2353 `templateUid` (control-app), TS2307 `miniflare` (`fonts/seed.ts`).

## Forecast

- `da3c01e584`: expect `package.json` `version` to conflict (ours .385 vs its bump) → incoming if higher;
  `extract.ts` should apply cleanly since ours == its parent's blob. `gate-core.ts` not touched.
- `d94d62a9e8` (`auto-bump patch to 0.2.387 for BUG-153`) follows.
- `gate-core.ts` will keep conflicting on any pick that adds a field next to `worstTier` until HEAD's
  branch-local reorder is dropped.
