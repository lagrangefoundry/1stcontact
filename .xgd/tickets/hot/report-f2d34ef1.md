---
uid: report-f2d34ef1
id: REPORT-2548
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 35'
created_by: xgd
created_at: '2026-08-20T21:55:38.046158+00:00'
updated_at: '2026-08-20T21:55:38.046158+00:00'
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

**Attempt**: 35
**Fixes applied this call**: 0
**Violations remaining**: 1 (AC-1354 coverage gap) + 1 warning (AC-1353 traceability)
**Needs more work**: true
**Progress made**: false — deliberately, to exit the loop rather than burn attempts 36–40

## Declaration rationale

This call sets `progress_made: false` **on purpose**. Per the loop-semantics table,
`needs_more_work=true` + `progress_made=false` exits the loop and returns control to the
assessor/operator. That is the correct routing for this capability, and it is what
`report-292b522e`'s own "Notes for the Editor" section asks for: *"Two independent things must
both happen before this capability's uat level can pass, and neither can happen inside this loop."*

Attempts 1–34 produced a combined **one ticket-body edit and zero source or test mutations**.
Manufacturing a mutation this call solely to keep `progress_made=true` would extend a terminal
failure through the remaining budget without moving any finding toward closure.

## Verification re-derived this call (nothing inherited)

Every fact below was re-run in this worktree this call, not copied from `report-292b522e`.

| Check | Command | Result |
|---|---|---|
| Divergence | `git rev-list --count HEAD..main` | **536** commits on `main` absent here (unchanged since attempt 34) |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | **8**: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree main --name-only tools/generate/src/store/` | **14** — the 8 above plus `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Port test files @ HEAD | `git ls-files` on all 5 named port test paths | **no output** — none of the 5 exist here |
| Port test files @ `main` | `git ls-tree main --name-only -r tests/` | all 5 present: `reconciliation-site-storage-port.test.ts`, `…​.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts`, `support/site-factory.ts` |
| Entry points @ `main` | `git grep -acn "fsSiteStore(" main -- tools packages apps` | **4 files, 1 hit each** — `store/fs-store.ts` (definition), `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` |
| Entry points @ HEAD | `git grep -acn "fsSiteStore(" HEAD -- tools packages apps` | **no output** — the symbol AC-1354 counts does not exist on this branch |
| Worktree state | `git status --porcelain` | clean |

**Name-collision guard.** `git grep -acn "SiteStore" HEAD` does return two files —
`apps/public-site/src/index.ts` and `apps/public-site/src/site-store.ts`. These are the
**unrelated public-site serving store**, not the editing port REQ-142 introduced. The editing
port must be identified by path (`tools/generate/src/store/site-store.ts`), which is absent at
HEAD. A name-only grep would have produced a false positive here.

All greps used `-a`: two of the heaviest consumers of the editing surface carry NUL bytes as
cache-key separators and are otherwise skipped silently as binary.

## Ticket-level state re-read this call

Both branch-local ACs were read in full via `xgd ticket get`:

- **AC-1354** (`acceptance_criterion-56798f01`) — `active`, `kind: behavior`,
  `regression_only: false`. Attempt 34's Verification rewrite is present and sound: it splits the
  structural half (one `fsSiteStore(` construction per entry point, none beneath) from the
  behavioural half (drive the tool adapter end to end against an **injected** store: copy edit
  reads back with change count advanced; asset add lands bytes under the given name; missing
  source refused with the not-found code, path and hint). Nothing further to correct in the body.
- **AC-1353** (`acceptance_criterion-003caa07`) — `active`, `kind: behavior`. Criterion and
  Verification are correct and complete. Its stated rationale (under the Node compatibility flag
  the Workers runtime *resolves* a filesystem import and supplies a per-isolate filesystem, so a
  successful import is not evidence) justifies the structural check correctly.

**There is no remaining ticket-level defect to fix.** The assessor's own info-4 and info-5 rows
agree: the matrix is internally consistent, the ACs match REQ-142/REQ-141 scope exactly, and the
nine behavioural ACs are covered non-redundantly on `main`. The failure is entirely one of
*evidence location* plus one genuine coverage gap that lives on `main`.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | uat-add (finding 1) | AC-1354 | **Not applied — unactionable on this branch.** See below. |
| — | uat-edit (finding 2) | AC-1353 | **Not applied — target file does not exist on this branch.** See below. |
| — | needs_review (finding 3) | all 11 ACs / capability | Forwarded to operator. |

### Why finding 1 (`uat-add`) was not applied

The suggested edit says to author `test_UAT_AC1354_*` **on `main`**. It cannot be authored here:
the test must count `fsSiteStore(` constructions in `cli/index.ts`, `cli/builder.ts` and
`cli/ai/toolbox.ts`, bind `l1Operations` against `makeMemorySite()` from
`tests/support/site-factory.ts`, and exercise the memory store. **None of those modules exist at
HEAD** (verified above: 0 hits for `fsSiteStore(`, 6 of 14 store modules missing, `site-factory.ts`
absent). A file written here would not resolve its imports and could not pass; committing one
would put a permanently-red test on a regression branch.

Authoring it on `main` instead was considered and rejected: that means landing REQ-141/REQ-142
feature-test work directly on `main` from inside a regression fix loop, with no scope ticket. Per
`CLAUDE.md`'s free-coding lifecycle that is a mandatory-process violation (commits without a scope
ticket are detected and reverted on the next sync), and it is outside this task's declared scope
path. It is an operator action, not a fix-loop action.

### Why finding 2 (`uat-edit`) was not applied

The rename targets `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts`. `git ls-files`
confirms the file does not exist at HEAD. Same constraint as finding 1, and it is a warning
rather than a violation — it is a cheap same-file follow-on once the branch carries the code.

## Code Edits

None this call. Nothing in findings 1–3 is a production defect: the `fsSiteStore` construction
sites on `main` already match AC-1354's claim exactly (4 files, one hit each, one per entry point
plus the definition). What is missing is the assertion, not the behaviour.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` — all 11 ACs | The capability's production code and its entire UAT set are absent from the tree under check. `regression-cb0dad9c` was cut at `0f44ef1ba`; REQ-141/REQ-142 landed on `main` afterwards; `main` is now 536 commits ahead. Zero of 11 ACs are verifiable here. | **(a)** re-cut or refresh `regression-cb0dad9c` from current `main`, **or** **(b)** exclude `capability-c4c7a854` from this regression run. |
| AC-1354 (`acceptance_criterion-56798f01`) | No UAT exists anywhere — not on `main`, not here. | Authorise `test_UAT_AC1354_*` to be authored **on `main`** under its own scope ticket. Re-cutting the branch alone does **not** close this, because the UAT exists nowhere. |
| AC-1353 (`acceptance_criterion-003caa07`) | Substance is proven on `main`; only the case *names* defeat `test_UAT_AC{number}_` resolution. | Same-file rename on `main`, bundled with the AC-1354 authoring above. |

## Recommendation

Route this capability out of the fix loop. Per `CLAUDE.md`'s failure/error taxonomy this is a
**terminal failure** (guard not met — the branch cannot grow the feature code, and the check
cannot pass without it), not a recoverable failure, and it has been routed as recoverable for 35
consecutive passes. The two required actions — refresh/exclude the branch, and author
`test_UAT_AC1354_*` on `main` — are both operator actions outside this loop's reach.
