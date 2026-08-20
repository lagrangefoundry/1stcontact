---
uid: report-3421c03a
id: REPORT-2552
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 37'
created_by: xgd
created_at: '2026-08-20T22:12:10.403403+00:00'
updated_at: '2026-08-20T22:12:10.403403+00:00'
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

**Attempt**: 37
**Fixes applied this call**: 0
**Violations remaining**: 1 (finding 1, AC-1354) + 1 warning (finding 2, AC-1353)
**Needs more work**: true — but **not in this loop**. `progress_made: false` is set
deliberately, for the third consecutive attempt, to exit to the assessor/operator.

## Verdict

Both actionable findings were re-derived at source this call, independently of
`report-cf7943b7`, and both target artifacts that **do not exist on the branch under
check**. There is no mutation available here that would leave the matrix more valid than
before; the only mutations available are fabrications.

## Independent re-derivation this call

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| merge-base | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4`, **2026-08-19 17:43:02 -0700** |
| Divergence | `git rev-list --count HEAD..main` | **549** commits on `main` absent here (unchanged from attempt 36's check) |
| Store modules @HEAD | `git ls-files tools/generate/src/store` | **8** — `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @`main` | `git ls-tree -r --name-only main -- …` | **14** — the 8 above plus `assemble`, `fs-store`, `journal-model`, `journal`, `memory-store`, `site-store` |
| AC-1353 / AC-1354 UATs | `git grep -aoE "test_UAT_AC135[34]_…" main` | **no output** — neither exists on `main` either |
| Capability UATs @HEAD | `git grep -aoE "test_UAT_AC13[0-9][0-9]_…" HEAD` | many hits, **none in 1321–1329 / 1353 / 1354** |
| `fsSiteStore` @HEAD | `git grep -an "fsSiteStore" HEAD -- tools packages apps tests` | **zero occurrences, anywhere** |
| `makeMemorySite` @HEAD | `git grep -an "makeMemorySite" HEAD -- tests` | **absent** (present on `main`) |
| Finding 2's target file | `git ls-files tests/test_UAT_FC_REQ-142_site_store_port.test.ts` | **absent** @HEAD; present @`main` |
| Workers-routed files @HEAD | `git ls-files 'tests/*.workers.test.ts'` | **0** |

All greps used `-a` (NUL bytes in two heavy consumers of the editing surface make a plain
recursive grep skip them silently as binary).

AC-1353 and AC-1354 were both re-read at source via `xgd ticket get`: both `Status: active`,
`kind: behavior`, `regression_only: False`, bodies unchanged and sound. Attempt 34's rewrite
of AC-1354's Verification clause is intact — it correctly splits the structural half from the
behavioural half and steers the author away from the toolbox construction helper. No `ac-edit`
is warranted on either, consistent with the assessor's info-4.

## Why each finding could not be applied here

| # | Category | Element | Why not actionable in this worktree |
|---|---|---|---|
| 1 | `uat-add` | AC-1354 | Its structural half must assert exactly one `fsSiteStore(` construction in each of `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts`. **`fsSiteStore` has zero occurrences on this branch** — there is no symbol to count and no entry point in the shape described. Its behavioural half must bind the separately-exported operations against `makeMemorySite()`; both the operations (`site-store.ts`) and the fixture are absent. Authoring it here would mean first porting REQ-141/REQ-142 feature work onto a regression branch. |
| 2 | `uat-edit` | AC-1353 | The rename target — two cases at `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,:115` — is a file that **does not exist on this branch**. Nothing to rename. |
| 3 | `needs_review` | all 11 ACs | Unchanged and now re-confirmed with dates: branch cut 2026-08-19 17:43; the UATs landed on `main` at `c36402287` on 2026-08-20 05:21, ~11.5h later. Operator decision, by construction. |

Findings 1 and 2 are not independent of finding 3 — they **collapse into it**. Both are
"author/edit a test against module M", and M exists only on `main`. That is why
`progress_made: false` is honest here rather than evasive: the rule's intent ("only when every
remaining finding is `needs_review`") is satisfied in substance, because every remaining finding
shares finding 3's single unactionable root cause.

## Code edits

None this call. **Nothing in findings 1–3 is a production defect.** The `fsSiteStore`
construction sites on `main` already match AC-1354's claim exactly — one per entry point, none
beneath. What is missing is the assertion, not the behaviour.

## What was explicitly declined, and why

- **Authoring `test_UAT_AC1354_*` here.** It could only assert against modules that do not
  exist; the test would be a fabrication, and creating the modules to support it is feature work
  on a regression branch.
- **Writing to `main` from this worktree.** Finding 1's fix genuinely belongs on `main`, but a
  cross-branch write to trunk from inside a regression fix loop is an operator decision, not an
  autonomous one.
- **Setting `uat_coverage` on AC-1353/AC-1354.** That field is owned by the uat-coverage
  check/fix pair. Setting it here would manufacture a passing signal for evidence that does not
  exist — the precise failure mode this check is meant to catch.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` (all 11 ACs) | Production code and the entire UAT set are absent from the tree under check; 549 commits behind; 0 of 11 ACs verifiable here | **(a)** re-cut or refresh `regression-cb0dad9c` from current `main`, or **(b)** exclude this capability from the regression run |
| AC-1354 (`acceptance_criterion-56798f01`) | Genuine coverage gap that exists on `main` too | Author `test_UAT_AC1354_*` **on `main`** — re-cutting alone does not close it, because that UAT exists nowhere |
| AC-1353 (`acceptance_criterion-003caa07`) | Traceability defect only; evidence is correct and complete | Rename the two cases to `test_UAT_AC1353_*` **on `main`** — cheap same-file follow-on to the above |

## Loop routing

This is the 37th consecutive pass at the same wall; attempts 35, 36 and now 37 have each set
`fixes_applied: 0` / `progress_made: false` deliberately. Per the failure/error taxonomy in
`CLAUDE.md`, finding 3 is a **terminal failure** being routed as a recoverable one: the branch
cannot grow the feature code, and the check cannot pass without it, so no fix path exists by
construction. The divergence is still growing (531 → 536 → 546 → 548 → 549 over five passes),
so deferring makes the eventual re-cut larger, not smaller.

`needs_more_work: true` + `progress_made: false` exits the loop to the assessor, which is the
intended terminus. A 38th attempt would re-derive these same facts and reach this same verdict.
