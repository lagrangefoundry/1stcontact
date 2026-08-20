---
uid: report-8dd1cc47
id: REPORT-2562
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 42'
created_by: xgd
created_at: '2026-08-20T22:55:19.859583+00:00'
updated_at: '2026-08-20T22:55:19.859583+00:00'
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

**Attempt**: 42
**Fixes applied this call**: 0
**Violations remaining**: 1 (AC-1354, unrepairable on this ref)
**Needs more work**: true — but not by this loop. See "Loop declaration" below.

## Declaration in one line

Zero mutations, deliberately. Every repair the report prescribes targets files that
exist only on `main`; landing any of them here would put a knowingly-red suite on the
branch whose sole job is gating a fast-forward of `xgd-stable`. This call was spent
independently re-verifying that conclusion rather than inheriting it.

## Independent verification performed this call

I did not take `report-c2a4b9b5` at face value. Every load-bearing claim in finding 6
was re-derived from git in this worktree:

| Claim | Command | Result |
|---|---|---|
| Tree is clean | `git status --porcelain` | empty |
| Branch is behind | `git rev-list --count HEAD..main` | **554** |
| Store modules at HEAD | `git ls-files tools/generate/src/store` | **8** (`base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot`) |
| Store modules on main | `git ls-tree --name-only main tools/generate/src/store/` | **14** — adds `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Workers carriers at HEAD | `git ls-files 'tests/*.workers.test.ts'` | **none** |
| Shared fixture at HEAD | `git ls-files --error-unmatch tests/support/site-factory.ts` | **does not exist** |

Two findings **stronger** than the report stated, established this call:

1. **`git grep -c "fsSiteStore" HEAD -- tools tests` returns zero hits.** AC-1354's
   structural half asks a test to assert *exactly one* `fsSiteStore(` construction per
   entry point. At HEAD there is not one construction to count anywhere in the tree.
   The assertion is not merely inadvisable here — it is unwritable.
2. **`toolbox.ts:239` at HEAD reads `export function l1Operations(slug: string, opts: GlobalOptions = {}): L1Operations`.**
   AC-1354's behavioural half requires binding `l1Operations` over an injected
   `SiteStore`. That parameter does not exist at HEAD; `GlobalOptions` carries no
   `store` field, because the port type it would reference is one of the six modules
   absent from this ref. The seam the AC describes has not been cut on this branch.

So findings 1–5 are unrepairable here **by construction**, not by judgement call. That
is a stronger statement than "would be unwise", and it is why I am not chipping away at
them as the pacing guidance would otherwise ask.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| — | — | — | **None.** No ticket, test, or code mutation was applied this call. |

## Repairs deliberately NOT made, and why

| Prescribed repair | Finding | Why withheld |
|---|---|---|
| Author `test_UAT_AC1354_*` | 1 (violation) | Imports `memory-store`/`site-store`/`fs-store`; none exist at HEAD. Would not collect. Structural half has zero `fsSiteStore(` sites to count; behavioural half has no `store` option to inject through. |
| Rename cases to `test_UAT_AC1353_*` | 2 | Target file `tests/test_UAT_FC_REQ-142_site_store_port.test.ts` does not exist on this ref. |
| Delete `:585–590` from `test_UAT_AC1327_*` | 3 | Target file `tests/reconciliation-site-storage-port.test.ts` does not exist on this ref. |
| Extend `test_UAT_AC1329_*` with a source scan | 4 | Same file, absent. No `vitest.node.config.mts` / `vitest.workers.config.mts` at HEAD to scan. |
| Rename node-side cases to `test_UAT_AC1328_*` | 5 | Target `tests/test_UAT_FC_REQ-141_project_routing.test.ts` does not exist on this ref. |
| Set `uat_coverage` on any AC | — | Explicitly forbidden by the report's Notes, and that field is owned by the uat-coverage check/fix pair, not this cycle. Writing it would manufacture the appearance of progress without the repair. |

## Code Edits

None this call.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` — all 11 ACs, on branch `regression-cb0dad9c` | The branch predates the capability entirely: 554 commits behind `main`, missing the port, both adapters, the assembly path, the journal model, the shared fixture, both vitest configs and every workers-runtime carrier. Zero of 11 ACs can carry a UAT here. | **Choose one:** (a) re-cut or refresh `regression-cb0dad9c` from current `main` so the capability is present in the tree under check; or (b) exclude `capability-c4c7a854` from this regression run. |

**Note that (a) does not close findings 1–5.** Those are `main`-side test-authoring items
that exist on no ref yet. Refreshing the branch makes them *landable*; it does not land
them. They need scheduling as their own development item. The report's cross-cutting
observation is the efficient framing: findings 1, 2 and 5 are one defect — proof written
free-coded and per-REQ (`UAT_FC_REQ-141 …`, `UAT_FC_REQ-142 …`), then re-expressed under
`test_UAT_AC13xx_` names incompletely. A single rename pass over the two REQ-named files
plus one new AC-1354 test closes all three together, on `main`.

## Loop declaration and why it is shaped this way

`needs_more_work: true`, `progress_made: false` — which per the loop table **exits the
loop without re-invoking me**. That is the intended outcome, not an accident of the flags:

- Work genuinely remains (AC-1354 is a real, durable matrix gap — it postdates the
  UAT-generation run and was never in scope for a UAT author), so `needs_more_work` is
  honestly `true`.
- No mutation is available *from this ref*, so `progress_made` is honestly `false`.

Under CLAUDE.md's failure/error taxonomy this is a **terminal failure** — an expected
dead-end warranting a graceful halt with a clear message, not a recoverable failure to
retry. Declaring `progress_made: true` on a manufactured edit would convert a clean halt
into a 43rd pass over the same ground. Forty-two passes have reached this conclusion with
0 cumulative fixes; the loop is not failing to converge, it is structurally unable to,
and the correct action is to stop and surface the operator decision.
