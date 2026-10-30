---
uid: report-1db5eb5c
id: REPORT-5765
type: report
title: 'Resync resolve conflicts: ec118d67626fd31cfce67ca88dc9908ecdde70ed'
created_by: xgd
created_at: '2026-10-02T05:58:04.046058+00:00'
updated_at: '2026-10-02T05:58:04.046058+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

Resync anchor `report-377b581e`, apply target `ec118d67626fd31cfce67ca88dc9908ecdde70ed`.
Picked commit `6162558c2db128aae48c8042764439eef32f4074` — "fix(gate): grade the served
document's layout at the captured widths [FREE-CODED]" (BUG-112, author 2026-09-17
20:59:41 -0700, 16 files, +685/-63). HEAD `7230a75352`. `prior_stage_failure` empty,
retry count 1. The prompt body arrived empty; arguments were recovered from
`session-r36f21cf3.jsonl` (seq 232).

## Files resolved

- `tools/generate/src/cli/gate-core.ts` — code, class 2c (`UU`), ONE region, rule
  **keep BOTH (non-overlapping)**. The other 15 paths of the pick applied cleanly.
  - Theirs (BUG-112) rewrote the `structural-failure` rung's `diagnosis` / `nextStep`
    (collision-naming text, "3-probe gate" -> "acceptance gate") and left the
    following `} else if (!perceptualBreach) {` line as base had it.
  - Ours' only change in the region is that one following line:
    `} else if (!perceptualBreach && !valuesBreach) {` (BUG-110, already in HEAD); ours
    left `diagnosis` / `nextStep` as base had them.
  - Resolution: theirs' `diagnosis` / `nextStep` block verbatim + ours' `else if`
    condition. Adjacent lines, different statements — git conflicted on proximity only.
  - Corroboration: `xgd-working`'s tip carries both forms in this function
    ("The acceptance gate failed…" and `} else if (!perceptualBreach && !valuesBreach) {`).
  - The enrichment rule ("intent unknown -> more recent by timestamp") was not applied;
    on a code path the HARD RULES govern and here nothing is incompatible.

## Incoming changes preserved

- `gate-core.ts`: every hunk of `git show 6162558c2d -- gate-core.ts` is present — the
  `acceptanceGate` / `AcceptanceReport` / `EnvelopeReport` imports, `LayoutCollision`,
  `layoutCollisions`, `namedCollisions`, `l1Gate: Pick<…, 'pass' | 'onSample'>`,
  `GateReport.layout`, `const collisions = …`, the collision-aware diagnosis/nextStep,
  `layout: {…}` in the return, `L1GateResult extends AcceptanceReport`, and
  `acceptanceGate(base, multiState, { recovered, served: base, … })`.
- `git diff <:3: blob> -- gate-core.ts`: every `-` line is base content that OURS
  replaced (BUG-110/BUG-111 text); incoming's diff from base touches none of them. The
  only one inside the conflict region is `} else if (!perceptualBreach) {`, superseded
  by ours' condition.
- `git diff <:2: blob> -- gate-core.ts`: the only `-` lines are the ones incoming
  rewrote (three-probe naming, the old diagnosis/nextStep, `Pick<…, 'pass'>`).
- Staged `git diff --cached --stat HEAD` = 16 files, +685/-63 — exactly the pick's own
  diffstat. No conflict markers remain; no unmerged entries; HEAD unmoved;
  `CHERRY_PICK_HEAD` intact. No test function deleted.

## Flagged for post-merge review (not fixed — outside the conflict markers)

1. **`tests/reconciliation-in-repo-png-codec.workers.test.ts` will break.** It exists
   on main only (reconciliation UAT generation, `12d6ff004a` / `06f0f56885`; absent from
   `xgd-working`) and imports `threeProbeGate` from `tools/generate/src/l1/probes`
   (lines 14, 243). This pick renames that export to `acceptanceGate` with no alias, and
   no incoming commit can repair a file xgd-working does not have. Needs a one-line
   rename on main after the resync. Not touched here: it is an unconflicted file.
2. **Four `test_UAT_FC_BUG-112_*` tests fail at this commit, and the next pick heals
   them.** `reconcileGates` on this branch already requires `values.unpairedSections` /
   `unpairedActualSections` (BUG-111, `191bf02526`), but this pick's new test fixture
   `NO_DELTAS` predates it -> `TypeError: Cannot read properties of undefined (reading
   'length')` at `gate-core.ts:559`. The fix is `a87c8f8fc6` "chore(version): 0.2.261
   for BUG-112" (non-merge, not yet on HEAD), which adds both fields to that fixture.
   Expect that pick to conflict on `package.json` `version`.

## Tests run

`npx vitest run` over the pick's seven non-workers suites: 57 passed, 7 failed.
- 4 failures: item 2 above (transient).
- 3 failures in `reconciliation-cross-gate-reconciliation.test.ts` (AC852, AC853,
  AC856): "expected 6 to be +0" / "promise resolved instead of rejecting" — the CLI
  exiting 6 `ENVIRONMENT` from the install preflight because this worktree's install is
  stale (`pnpm-lock.yaml` != `node_modules/.pnpm/lock.yaml`, confirmed). Baseline at
  HEAD was not re-run; this is the same signature recorded on the previous gate pick.
- Workers suites (`*.workers.test.ts`) not run: blocked in this role (`listen EPERM`).
