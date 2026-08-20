---
uid: report-734f91ce
id: REPORT-2564
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 43'
created_by: xgd
created_at: '2026-08-20T23:01:52.302557+00:00'
updated_at: '2026-08-20T23:01:52.302557+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-c4c7a854
  level: uat
  fixes_applied: 0
  progress_made: false
  needs_more_work: true
  violations_remaining: 1
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Site Storage Port: One Async Store Behind Every Edit (uat)

**Attempt**: 43
**Fixes applied this call**: 0
**Violations remaining**: 1 (finding 1, AC-1354) + 4 warnings
**Needs more work**: true — but **not by this loop**. `progress_made: false` is declared
deliberately so the loop exits to the assessor and the operator sees finding 6.

## Why zero mutations

Findings 1–5 are all `uat-add` / `uat-edit` against test files that **do not exist in this
worktree**. I re-derived this from git in this call rather than inheriting it from
`report-4bf4d99d`:

| Check | Result |
|---|---|
| `git rev-parse --short HEAD` | `506801caa`, `git status --porcelain` clean |
| `git rev-list --count HEAD..main` | **554** |
| `git ls-files tools/generate/src/store` | **8** modules |
| `git ls-tree -r --name-only main -- tools/generate/src/store` | **14** modules |
| Absent here, present on `main` | `site-store.ts` (the port), `fs-store.ts`, `memory-store.ts` (both adapters), `assemble.ts`, `journal-model.ts`, `journal.ts` |
| `git grep -lE "test_UAT_AC13(2[1-9]\|5[34])_" HEAD -- tests` | **zero hits** — 0 of 11 ACs carry a UAT on this branch |
| same search on `main` | `tests/reconciliation-site-storage-port.test.ts`, `tests/reconciliation-site-storage-port.workers.test.ts` |
| `git ls-files tests` matching `site-storage-port`, `REQ-14[12]`, `site-factory`, `workers.test` | **zero hits** — every file findings 1–5 name is absent at HEAD |
| `git grep -c "test_UAT_AC1354" main` / `test_UAT_AC1353` | **zero on `main` as well** — these two are genuine matrix gaps, but only authorable where the code lives |

Authoring the prescribed tests here would produce files importing modules that do not exist;
they could not collect, let alone pass. That is strictly worse than the current state on a
branch whose only job is gating a fast-forward of `xgd-stable`. A faithful `test_UAT_AC1353_*`
is the sharpest case: it would fail *correctly* here, because at HEAD `edit.ts` genuinely still
imports the filesystem modules the AC prohibits — the branch predates the seam.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | **None.** No mutation available from this ref that improves matrix validity. |

Explicitly **not** done, and why:

- **Did not write `uat_coverage` on any of the 11 ACs.** That field is owned by the
  uat-coverage check/fix pair, not by this cycle, and no AC carries a miscoded value today —
  so there is nothing to correct honestly. Setting it would manufacture a progress signal for
  work that has not happened.
- **Did not author findings 1–5 into this branch**, per `report-4bf4d99d`'s Notes for the Editor
  and the independent verification above.
- **Did not edit any AC body.** Findings 7 and 8 record that the AC bodies agree with REQ-141 /
  REQ-142 as carried by BUNDLE-19, and that the `fsSiteStore(` construction sites on `main`
  already match AC-1354's structural claim exactly. What is missing is the assertion, not the
  behaviour and not the criterion text.

## Code Edits (if any)

None this call. Findings 1–5 are categorized `uat-add` / `uat-edit`, and finding 8 records
explicitly that they are **not** `code-issue`.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` — all 11 ACs on branch `regression-cb0dad9c` (finding 6) | The tree under check contains neither the production code the ACs describe nor the tests that prove them; the matrix is correct and `main` largely satisfies it — the branch simply predates the work. Not matrix drift. | Either (a) re-cut / refresh `regression-cb0dad9c` from current `main` so the capability is present in the tree under check, or (b) exclude `capability-c4c7a854` from this regression run. Note (a) alone does **not** close findings 1–5. |

### Follow-on work this loop cannot schedule

Findings 1, 2 and 5 are one defect wearing three hats: this capability's proof was written
free-coded and per-REQ (`UAT_FC_REQ-141 …`, `UAT_FC_REQ-142 …`), and the AC-indexed
reconciliation file that followed re-expressed most of it under `test_UAT_AC13xx_` names but
not all of it. On `main`, a single rename pass over
`tests/test_UAT_FC_REQ-141_project_routing.test.ts` and
`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, plus one new `test_UAT_AC1354_*`, closes
findings 1, 2 and 5 together. Findings 3 and 4 are small edits to
`tests/reconciliation-site-storage-port.test.ts`, also on `main`. All five need scheduling as a
`main`-side development item; none of them belongs to this regression branch.

One trap worth carrying forward for whoever writes `test_UAT_AC1354_*`: do **not** route the
behavioural half through `createL1Toolbox`. At `main:tools/generate/src/cli/ai/toolbox.ts:505`
the call reads `new L1Toolbox(slug, { ...opts, store: fsSiteStore(ctxOf(opts)) })` — the spread
precedes the key, so an injected store is silently overridden and the test would quietly run on
the filesystem. That is the exact false green AC-1354's Verification clause warns against.

## Loop declaration

`needs_more_work: true`, `progress_made: false` → the loop exits without re-invoking this
prompt, and the assessor runs. This is the designed signal for "blocked entirely by
needs_review", and it is the honest one: this is the **43rd** pass, cumulative fixes across all
43 are **0** (`report-8dd1cc47`, attempt 42: `fixes_applied: 0`, `progress_made: false`), and
the only commits since that pass are ticket/report/workflow bookkeeping. The loop is not failing
to converge — there is nothing in this worktree to converge on. Under CLAUDE.md's failure/error
taxonomy this is a **terminal failure**: an expected dead-end warranting a graceful halt, not a
recoverable failure to retry. Re-invoking cannot produce a different result and only consumes
budget.
