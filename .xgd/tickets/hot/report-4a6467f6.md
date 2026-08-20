---
uid: report-4a6467f6
id: REPORT-2516
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 21'
created_by: xgd
created_at: '2026-08-20T19:55:53.242059+00:00'
updated_at: '2026-08-20T19:55:53.242059+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 5
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 21 — **past the declared budget of 20**
**Fixes applied this call**: 0
**Violations remaining**: 5 (plus 3 warnings, 1 needs_review)
**Needs more work**: true — but **not on this branch**, and **not by this loop**.

## Outcome: terminal failure, budget overrun, exit-loop signal ignored 20 consecutive times

The blocker is unchanged and was re-derived from scratch this call. What is **new this
pass** is a measured, systemic finding the previous twenty reports did not have: the
documented exit-loop transition has never fired for this loop, and the loop has now run
one attempt past its own stated ceiling.

## NEW THIS PASS — the loop's exit transition is not wired (system bug, `@error`)

I enumerated every `fix_structural_validation` report for `capability-c4c7a854` and read
their declaration fields directly (26 reports; the first six belong to the earlier,
successful series that closed at `violations_remaining: 0`). The current uat-level series
is twenty reports, REPORT-2476 (attempt 1) through REPORT-2514 (attempt 20):

| Attempt | Report | fixes_applied | progress_made | needs_more_work | violations_remaining |
|---|---|---|---|---|---|
| 1 | REPORT-2476 | 0 | **false** | true | 5 |
| 2–19 | REPORT-2478 … REPORT-2512 | 0 | **false** | true | 5 |
| 20 | REPORT-2514 | 0 | **false** | true | 5 |

**Every one of the twenty declared `needs_more_work: true, progress_made: false`** — the
combination this prompt's own loop-semantics table defines as **"Exit loop — stuck (only
needs_review left), assessor runs"**. Total fixes applied across the entire series: **0**.

Per that contract the loop should have exited after **attempt 1**. It ran twenty times
instead, and has now invoked a twenty-first against a budget declared as 20. Attempt 20's
report inferred that attempt 19 was the first to raise the signal; that inference was
wrong in the direction that matters — the signal was raised on the *first* call and every
call since. The self-loop budget was therefore the only thing bounding this loop, and that
bound has now been exceeded too.

Per CLAUDE.md's failure/error taxonomy this is not a workflow *failure* to retry. A
documented transition that exists but does not fire is a **bug in the system** — the
`@error` category: immediate termination, distinct messaging, no recovery attempt. It
should not be handled by another fix iteration. I have not filed a bug ticket, as managing
the outer workflow is outside this prompt's scope path; recommending it to the operator is.

## Blocker re-verified independently this call (not inherited)

I re-ran the geometry rather than trusting `report-9ca1c6ee` or `report-8fe66a35`. HEAD has
advanced again since both (ticket/report commits only), so the check was worth redoing:

| Check | Command | Result |
|---|---|---|
| HEAD | `git rev-parse --short HEAD` | `301309885` — advanced from `0b47f2394` (report) and `4be257eae` (attempt 20) |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba` |
| commits `main` ahead of fork point | `git rev-list --count 0f44ef1ba..main` | **487** |
| store modules @ HEAD | `git ls-tree --name-only HEAD -- tools/generate/src/store/` | **8**: `base, diff, fsutil, history, index, loadSite, paths, snapshot` |
| store modules @ main | same, `main` | **14** — the same **plus** `assemble, fs-store, journal, journal-model, memory-store, site-store` |
| port tests @ HEAD | `git ls-tree -r --name-only HEAD -- tests` filtered | **only** `tests/req22-storage.test.ts` |
| port tests @ main | same, `main` | `reconciliation-site-storage-port.test.ts`, `…workers.test.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |
| fixture helpers @ HEAD | `git ls-tree -r --name-only HEAD -- tests/support` | **only** `webui-installed.ts` |
| fixture helpers @ main | same, `main` | `builder-origin.ts`, `site-factory.ts`, `webui-installed.ts`, `wrangler-toml.ts` |

All eight actionable findings (1–5 violations, 6–8 warnings) are `uat-add` / `uat-edit`
against `tests/reconciliation-site-storage-port.test.ts` and `…workers.test.ts`. **Neither
file exists in this worktree**, nor do the six store modules and two fixture helpers they
import. The port landed on `main` at `2b902ead0` (2026-08-20T12:21:02Z, merged `b18b859d7`
12:49:19Z) — 11h38m **after** regression `cb0dad9c` was cut at `0f44ef1ba`
(2026-08-20T00:43:02Z). `main` is not an ancestor of HEAD.

The **check** remains sound and runnable here — the matrix is global and the evidence reads
from `main` via `git show` / `git grep <rev>`. Only the **repair** has nowhere to land.

## What I explicitly did NOT do, and why

| Tempting action | Why refused |
|---|---|
| Author the tests on this branch | Fails at collection on six absent modules + two absent fixtures; adds a knowingly-red suite to the branch whose sole purpose is to gate a fast-forward of `xgd-stable` — red against *correct* code |
| Set `uat_coverage` on the ACs to show movement | That field is owned by `check`/`fix_uat_coverage`. Setting it here is manufactured progress, not repair |
| Fall back to `ac-edit` / `ac-deprecate` | Wrong lever. The assessor categorized all eight as test-side and raised **no** `code-issue`; the ac level closed clean (`report-2927090b`, 0/0/0). The ACs are not the defect |
| Write the repair into the `main` worktree | That is operator option (c). Relocating the repair to another branch — and mutating `main`, the reconciled truth — is a workflow-management decision outside this prompt's scope path and not mine to take unilaterally |

Consequently `progress_made: false` is declared deliberately and honestly. Every mutation
available on this branch is either harmful or dishonest.

## Code Edits

None. No `code-issue` was raised, and my own reading agrees: every claim the ACs make is
reachable from code that already exists on `main`.

## needs_review Forwarded — UNANSWERED SINCE ATTEMPT 7

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (repair of findings 1–8) | All eight findings are test-side edits to two files absent from this worktree; the check is sound here, the repair is not landable here | Pick (a), (b) or (c) below |

**(c) — RECOMMENDED.** Run `check_uat_validation` + `fix_uat_validation` for this capability
on a branch at or past `b18b859d7`. A worktree already exists at `main`, so this needs no
new branch and no resync. The findings become actionable immediately, and the
source-verified repair plan in `report-8fe66a35` is ready to execute as written.

**(b) — acceptable fallback.** Scope `capability-c4c7a854` out of regression `cb0dad9c`.
This only *relocates* the repair; the check's verdict stands regardless.

**(a) — least attractive.** Resync `regression-cb0dad9c` past `b18b859d7`. Makes the
findings actionable here but changes what the regression is testing mid-run.

**Additionally, and separately from (a)/(b)/(c):** the loop-exit defect above wants a bug
ticket. It is independent of which option is chosen — any future `fix_*` loop that
correctly reports itself stuck will spin for its full budget instead of halting.

## The repair, when unblocked

Unchanged and still source-verified against `main` — see `report-8fe66a35`'s
"The repair, source-verified and ready to execute" section, which I re-read this call and
concur with in full, including its ordering: finding 4 first (a deletion, and it stops
CAP-85's evidence being duplicated inside CAP-101's), then 3 and 5 (extensions to existing
tests), then 1 and 2 (new tests), then warnings 6–8 once their host tests are open. Its
warning against targeting `createL1Toolbox` for finding 2 — the injectable seam is
`l1Operations` at `main:tools/generate/src/cli/ai/toolbox.ts:176` — is correct and worth
carrying forward.

## Loop declaration

`needs_more_work: true` / `progress_made: false` → **exit loop**. This is the twenty-first
consecutive call to raise that signal and the first to run past the stated budget. The
blocker is structural, not effort-limited: no further iteration against this tree can do
better than this report. Halt and hand to the operator for (c), and file the loop-exit
defect as a bug.
