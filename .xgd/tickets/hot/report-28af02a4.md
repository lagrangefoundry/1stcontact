---
uid: report-28af02a4
id: REPORT-5767
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T06:08:42.545700+00:00'
updated_at: '2026-10-02T06:08:42.545700+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync stage resolution — `e55f61ab9b` (BUG-113 WIP checkpoint)

- Anchor: `report-377b581e` · apply target: `ec118d67626fd31cfce67ca88dc9908ecdde70ed`
- Picked commit: `e55f61ab9bd9ee69b7f9a1350f87888c41fde072` — "fix(gate): grade the composed served document, price recovery [FREE-CODED]" (author 2026-09-17 21:02:10 -0700, 13 files, +959/-47)
- HEAD at resolution: `91a6b7b3e8` (unmoved). `CHERRY_PICK_HEAD` intact. Staging only; no `--continue`.
- `prior_stage_failure`: empty (first attempt).

## Outcome

All six conflicted code/test files resolved as **integrate both sides**; 13 regions total. 0 unmerged entries, 0 conflict markers. Staged: 13 files, +983/-80 against HEAD.

| File | Regions | Resolution |
|---|---|---|
| `tools/generate/src/l1/probes.ts` | 4 | developer's merge blob `9a5f942616` |
| `tools/generate/src/cli/repro.ts` | 1 | developer's merge blob `c4a577fba3` |
| `tests/req86-e2e-repro.test.ts` | 2 | developer's merge blob `fd723758b6` |
| `tests/req88-l1-repro-pipeline.test.ts` | 1 | developer's merge blob `f3c630bdf1` |
| `tools/generate/src/cli/gate-core.ts` | 4 | developer's merge delta replayed onto ours |
| `tests/reconciliation-3probe-gate.test.ts` | 1 | developer's merge delta replayed onto ours |

## Why this is not a guess

Ours is BUG-112 (`8d5c74a03a`: `threeProbeGate` → `acceptanceGate`, the on-sample probe, `served`). Theirs is BUG-113's checkpoint, written on a branch that did not yet have BUG-112 — its own message says "WIP checkpoint before merging xgd-working (BUG-112 landed in the same area)". The developer then resolved exactly this conflict three minutes later in merge `20228dad47` ("Merge xgd-working (BUG-112) into free-BUG-113"), parents `e55f61ab9b` (the pick) and `877830c4b8`. Resync skips merge commits, so that resolution never arrives through the queue.

For four of the six files, ours' index blob (`:2:`) is byte-identical to the blob at `877830c4b8`, and theirs is the pick itself. So the merge's result for those paths is the developer's own resolution of this exact three-way, and I took it verbatim.

For `gate-core.ts` and `reconciliation-3probe-gate.test.ts`, ours carries HEAD-only content the merge parent lacks (19 and 52 lines), so I replayed the merge's delta onto ours with `git merge-file <ours> <877830c4b8 blob> <20228dad47 blob>`. Both applied cleanly, and every resulting change falls inside the original conflict regions.

Check: `git diff --cached 20228dad47 -- <all 13 paths>` shows 10 of 13 paths byte-identical to the developer's merge. The three that differ (`gate-core.ts` 19 lines, `reconciliation-3probe-gate.test.ts` 52, `reconciliation-l1-fold.test.ts` 398) differ by exactly the amounts HEAD already differed from `877830c4b8` — HEAD-side content, none of it incoming-authored. Nothing from incoming is dropped; nothing from main is kept at incoming's expense.

## One change outside the conflict markers — flagged

In `probes.ts`, the developer's merge also widened the BUG-112 helper `envelopeAt(doc, widths, contentScale)` with a fourth `measured?: MeasuredTextHeights` parameter (7 lines, just above the first marker). I kept it. It is the developer's code from the incoming branch, not mine, and it is what lets ours' helper carry theirs' `measured` threading; without it the in-marker resolution does not compile as the developer wrote it, and `req88`'s `onSample.pass` assertion would be false. Calling it out because the policy says to resolve inside the markers only.

## Enrichment

"Intent unknown … take the more recent commit by timestamp" for all six files (the pick has no xgd trailers). Not followed: for code the hard rules make incoming authoritative and require integration, and here the developer's own integration exists.

## Tests

`npx vitest run` over the six test files the pick touches: 34 passed, 1 skipped, 1 failed.

The failure is `reconciliation-l1-fold.test.ts > test_UAT_AC696_adopt_values_command_removed`, which exits with `ENVIRONMENT` from the CLI preflight because this worktree's `node_modules` is behind `pnpm-lock.yaml`. It is the same stale-install failure reported on earlier picks and is unrelated to this resolution.

Not run: `tsc`, and the workers suites (unrunnable in this role).

## For post-merge review

- `tests/reconciliation-in-repo-png-codec.workers.test.ts` still imports `threeProbeGate`, which no longer exists. Pre-existing since the BUG-112 pick (REPORT-5765); the file is main-only, so no later pick heals it. Not touched here.
- The next code pick on these files should be `7c917a6fae` ("grade the bundle artifact repro serves, flag a stale fold"), whose parent is `20228dad47`. Ten of its base paths now match this branch byte-for-byte, so it should apply cleanly or conflict only where HEAD-only content sits.
