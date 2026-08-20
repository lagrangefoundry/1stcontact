---
uid: report-e2c80258
id: REPORT-2560
type: report
title: 'Fix Site Storage Port: One Async Store Behind Every Edit (uat) — attempt 41'
created_by: xgd
created_at: '2026-08-20T22:45:42.129252+00:00'
updated_at: '2026-08-20T22:45:42.129252+00:00'
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

**Attempt**: 41
**Fixes applied this call**: 0
**Violations remaining**: 1 (finding 1, AC-1354) + 3 warnings (findings 2–4)
**Needs more work**: true (blocked — not continuable from this worktree)

## Verdict

No mutation was applied this call, and none was available. This is the same
conclusion as attempts 1–40, but it was **re-derived from source this pass**, not
inherited from `report-72c6b020`. Every command below was run in this worktree.

## Independent verification of the blocking condition (finding 5)

| Claim | Command run this pass | Result |
|---|---|---|
| Branch predates the port | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Store modules @HEAD | `git ls-files tools/generate/src/store` | **8** — `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @`main` | `git ls-tree -r --name-only main -- .../store` | **14** — adds `assemble`, `fs-store`, `journal`, `journal-model`, `memory-store`, `site-store` |
| Any port reference @HEAD | `git grep -lE "site-storage\|site_store\|siteStore\|fsSiteStore" HEAD -- tests tools` | **no output** (zero files) |
| Workers-runtime carriers @HEAD | `git ls-files \| grep -c "workers.test.ts"` | **0** |
| Workers-runtime carriers @`main` | `git ls-tree -r --name-only main \| grep workers.test.ts` | `reconciliation-site-storage-port.workers.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts` |
| `edit.ts` prohibited imports @HEAD | `git grep -nE "from 'node:fs'\|from 'node:path'\|from '\.\./store'" HEAD -- .../cli/edit.ts` | **4 hits** — `:1` `node:fs`, `:2` `node:path`, `:24` + `:37` `'../store'` |
| `fsSiteStore(` sites @`main` | `git grep -c "fsSiteStore(" main -- tools tests` | **7 across 6 files** — `fs-store.ts:1` (def), `cli/index.ts:1`, `cli/builder.ts:1`, `cli/ai/toolbox.ts:1` (entry points), `req11-structured-edit.test.ts:1`, `support/site-factory.ts:2` (fixtures) |

The assessor's table is accurate in every particular I checked.

## Why each actionable finding is unrepairable from `regression-cb0dad9c`

| # | Category | Element | Why it cannot land here |
|---|---|---|---|
| 1 | `uat-add` | AC-1354 | The test must bind `l1Operations(slug, opts)` over `makeMemorySite()`. Neither `memory-store.ts` nor `site-store.ts` nor `tests/support/site-factory.ts` exists at HEAD. The file would not collect. |
| 2 | `uat-edit` | AC-1353 | Target is `main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105,:115`. That file does not exist at HEAD; there is nothing here to rename. Authoring a faithful equivalent would **fail correctly**, because `edit.ts:1,2,24,37` genuinely still imports the prohibited modules on this ref — the branch predates the seam. |
| 3 | `uat-edit` | AC-1327 | Target is `main:tests/reconciliation-site-storage-port.test.ts:585–590`. Absent at HEAD. |
| 4 | `uat-add` | AC-1329 | Extends `test_UAT_AC1329_*` in the same absent file. AC-1329 additionally has zero possible carrier here: there are **no** `*.workers.test.ts` files at HEAD. |

No matrix-side lever substitutes. I checked the ACs' fields directly
(`xgd ticket list --type acceptance_criterion --view --flags frontmatter,fields`):
none of the eleven carries a `uat_coverage` value, so there is no miscoded field to
correct honestly — and per the anchor report's own instruction that field is owned by
the uat-coverage check/fix pair, not by this cycle. Writing it here would manufacture
progress, not make it. Finding 7 records that the AC-1353 and AC-1354 bodies are
correct as written, so no `ac-edit` is warranted either.

## Code Edits

None this call. Findings 1–4 are categorised `uat-add` / `uat-edit`, and finding 8
records explicitly that production code on `main` already satisfies AC-1354's
structural claim — what is missing is the assertion, not the behaviour. No
`code-issue` path is open.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| `capability-c4c7a854` — all 11 ACs, on `regression-cb0dad9c` | The tree under check contains neither the production code the ACs describe nor the tests that prove them; the branch was cut at `0f44ef1ba` and BUNDLE-19's merge `b18b859d7` is not an ancestor of HEAD. Not drift — the matrix is correct and `main` largely satisfies it; the branch simply predates the work. | **Choose one:** (a) re-cut or refresh `regression-cb0dad9c` from current `main` so the capability is present in the tree under check; or (b) exclude `capability-c4c7a854` from this regression run. Note (a) alone does **not** close findings 1, 3 or 4 — those are `main`-side test work that exists nowhere on any ref yet, and need scheduling as their own development item. |

## Loop status

Declaring `progress_made: false`, `needs_more_work: true` — the documented "stuck"
combination, which exits the self-loop and returns control rather than spending a
42nd pass re-deriving an operator decision. This is a **terminal failure** in
CLAUDE.md's taxonomy (an expected dead-end warranting a graceful halt), not a
recoverable failure to retry: the fix loop is structurally unable to close finding 1
from this branch, and 41 passes have now produced 0 cumulative fixes. Nothing in this
worktree has changed since attempt 40 — HEAD carries only workflow, ticket and report
commits.

The one durable matrix gap is **AC-1354**, and it needs exactly one test authored on a
ref that has the code. AC-1353 needs only a rename, likewise on `main`. Neither is
this branch's to give.
