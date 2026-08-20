---
uid: report-02b651e2
id: REPORT-2518
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 22'
created_by: xgd
created_at: '2026-08-20T20:06:07.443047+00:00'
updated_at: '2026-08-20T20:06:07.443047+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: false
  violations_remaining: 5
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 22 — **two past the declared budget of 20**
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings, 1 needs_review)
**Needs more work**: **false** — see "Loop declaration", which is the one thing that changes this pass.

## Outcome: terminal failure. Declaring `needs_more_work: false` to halt, because the documented exit signal has failed 21 consecutive times.

The blocker is structural and unchanged. What is new this pass is not a new finding — it is a
**change of lever**. Attempts 1–21 all declared `needs_more_work: true, progress_made: false`,
the combination this prompt's loop-semantics table defines as "**Exit loop** — stuck (only
needs_review left), assessor runs". The loop did not exit, 21 times in a row, and has now run
two attempts past its own ceiling. Continuing to pull a lever that has demonstrably never
engaged is not diligence; it is the reason this loop has burned 22 invocations to apply 0 fixes.

`needs_more_work: false` is also the **honest** declaration under this prompt's own definitions:

- The prompt defines `false` as "you have addressed all violations you can meaningfully address
  (the assessor will verify)". On this branch the set of violations I can meaningfully address
  is **empty**, and I have addressed all of it.
- The prompt defines `true` as "violations remain **and you plan to continue next iteration**".
  I have no such plan. No 23rd iteration against this tree can do anything a 22nd could not, so
  declaring `true` would assert a plan I do not have.

Both `(false, true)` and `(false, false)` route to "Assessor verifies", which is the graceful
halt CLAUDE.md's taxonomy requires for a **terminal failure** — an expected dead-end, not a
recoverable failure to retry. I take that route deliberately.

## Blocker re-derived from source this call — not inherited from report-36c94b1c or report-4a6467f6

I re-ran the geometry myself rather than trusting either report. HEAD has advanced again since
attempt 21 (`301309885` → `ddc15cfb6`; ticket/report/workflow commits only), so it was worth
redoing:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse --short HEAD` | `ddc15cfb6` |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| commits `main` ahead of fork point | `git rev-list --count 0f44ef1ba..main` | **487** |
| store modules @ HEAD | `git ls-tree --name-only HEAD -- tools/generate/src/store/` | **8**: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | same, `main` | **14** — the same **plus** `assemble, fs-store, journal, journal-model, memory-store, site-store` |
| port tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` | **only** `tests/req22-storage.test.ts`. No `reconciliation-site-storage-port*`, no `*.workers.test.ts` of any kind, no `test_UAT_FC_REQ-14[12]_*` |
| fixture helpers @ HEAD | `git ls-tree -r --name-only HEAD -- tests/support` | **only** `webui-installed.ts` |
| fixture helpers @ main | same, `main` | `builder-origin.ts`, `site-factory.ts`, `webui-installed.ts`, `wrangler-toml.ts` |

All eight actionable findings (1–5 violations, 6–8 warnings) are `uat-add` / `uat-edit` against
`tests/reconciliation-site-storage-port.test.ts` and `…workers.test.ts`. **Neither file exists in
this worktree**, nor do the six store modules and two fixture helpers they import. Authoring
them here would fail at collection on two counts.

I also read `report-4a6467f6` (attempt 21: `fixes_applied: 0`, `progress_made: false`,
`needs_more_work: true`, `violations_remaining: 5`) and `report-2927090b` (ac level: `result:
pass`, 0/0/0) directly. Both confirm the report's account: the ACs are not the defect, and the
repair is test-side only.

## What I explicitly did NOT do, and why

| Tempting action | Why refused |
|---|---|
| Author the tests on this branch | Fails at collection on six absent modules + two absent fixtures; adds a knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of `xgd-stable` — red against *correct* code |
| Set `uat_coverage` on the ACs to show movement | That field is owned by `check`/`fix_uat_coverage`. Setting it here is manufactured progress, not repair |
| Fall back to `ac-edit` / `ac-deprecate` to satisfy "one mutation per call" | Wrong lever, and it would damage a clean layer. The assessor categorized all eight findings as test-side and raised **no** `code-issue`; the ac level closed clean at `report-2927090b` |
| Write the repair into the `main` worktree | That is operator option (c). Relocating the repair to another branch — and mutating `main`, the reconciled truth — is a workflow-management decision outside this prompt's scope path |
| File the loop-exit bug ticket myself | Finding 11's own recommendation is addressed to the operator; managing the outer workflow is outside this prompt's scope path. Surfaced below instead |

Rule 1 asks for at least one concrete mutation per call. On this branch every available mutation
is either harmful or dishonest, so rule 2 (declare honestly) governs. `progress_made: false` is
declared deliberately.

## Code Edits

None. No `code-issue` was raised, and my own reading agrees: every claim the ACs make is
reachable from code that already exists on `main`.

## needs_review Forwarded — UNANSWERED SINCE ATTEMPT 7

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (repair of findings 1–8) | All eight findings are test-side edits to two files absent from this worktree; the check is sound here, the repair is not landable here | Pick (a), (b) or (c) below |

**(c) — RECOMMENDED.** Run `check_uat_validation` + `fix_uat_validation` for this capability on a
branch at or past `b18b859d7`. A worktree already exists at `main`, so this needs no new branch
and no resync. The findings become actionable immediately, and the source-verified repair plan
in `report-8fe66a35` is ready to execute as written.

**(b) — acceptable fallback.** Scope `capability-c4c7a854` out of regression `cb0dad9c`. This
only *relocates* the repair; the check's verdict stands regardless.

**(a) — least attractive.** Resync `regression-cb0dad9c` past `b18b859d7`. Makes the findings
actionable here but changes what the regression is testing mid-run.

**Separately, and independently of (a)/(b)/(c):** the loop-exit defect wants a bug ticket. Any
future `fix_*` loop that correctly reports itself stuck will spin for its full budget — and, as
this series proves, past it — instead of halting. This report's `needs_more_work: false` is a
workaround for that defect, not a fix for it.

## The repair, when unblocked

Unchanged and still source-verified against `main` — see `report-8fe66a35`'s "The repair,
source-verified and ready to execute", and `report-36c94b1c`'s ordering, which I concur with:
finding 4 first (a deletion, and it stops CAP-85's evidence being duplicated inside CAP-101's),
then 3 and 5 (extensions to existing tests), then 1 and 2 (new tests), then warnings 6–8 once
their host tests are open. Two hazards worth carrying forward:

- Finding 2 targets `l1Operations` at `main:tools/generate/src/cli/ai/toolbox.ts:176`, **not**
  `createL1Toolbox` at `:505` — the latter overriding an injected `store` with `fsSiteStore` is
  precisely what AC-1354 requires, not a violation of it.
- `builder.ts` and `fidelity.ts` embed NUL bytes as cache-key separators, so a plain recursive
  grep classifies them as binary and skips them silently. Any repair pass surveying consumers of
  the editing surface must force text mode (`git grep -a`).

## Loop declaration

`needs_more_work: false` / `progress_made: false` → **assessor verifies**. This is a deliberate
departure from the 21 preceding reports, which declared the documented stuck-signal
`(true, false)` and were ignored every time. The blocker is structural, not effort-limited: the
repair target does not exist on this branch, and no iteration against this tree can change that.
Halt, hand to the operator for **(c)**, and file the loop-exit defect as a bug.
