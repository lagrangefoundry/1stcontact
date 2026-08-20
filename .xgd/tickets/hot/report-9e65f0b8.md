---
uid: report-9e65f0b8
id: REPORT-2533
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T21:06:27.023671+00:00'
updated_at: '2026-08-20T21:06:27.023671+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-c4c7a854
  level: uat
  violations: 1
  warnings: 1
  needs_review_count: 1
---

# Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every Edit
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 1

Twenty-ninth uat-level pass (`previous_attempt_count = 28`). Cumulative fixes applied across
attempts 1–28: **0**. Attempts 24–28 all record `progress_made: false`.

Every claim below was re-derived from git and the ticket store **this pass**. Nothing was
inherited from `report-b272e3b2` (REPORT-2529) or its predecessors; where this pass reaches the
same conclusion, it did so by independent derivation, and the commands are listed so the
derivation is reproducible. The two substantive matrix findings (1 and 2) were derived by
reading `main`'s test blobs directly, not by trusting a prior report's summary of them.

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -3` | `0c2d36b97`, `7cc63a573`, `04b703035` — workflow/ticket/report commits only; no source change |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Regression cut point | `git log -1 --format='%ci' 0f44ef1ba` | `2026-08-19 17:43:02 -0700` |
| `main` HEAD | `git log -1 --format='%H %ci' main` | `bda6c9939`, `2026-08-20 05:57:11 -0700` |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | 8 pre-port modules: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot` |
| Store modules @ `main` | `git ls-tree -r --name-only main -- .../store` | those 8 **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Port tests @ HEAD | `git ls-files tests \| grep -Ei 'storage\|site-store\|REQ-14\|site-factory\|workers'` | one unrelated hit: `tests/req22-storage.test.ts` |
| Port tests @ `main` | same filter over `git ls-tree -r --name-only main -- tests` | `reconciliation-site-storage-port.test.ts`, `reconciliation-site-storage-port.workers.test.ts`, `support/site-factory.ts`, `test_UAT_FC_REQ-141_project_routing.test.ts`, `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`, `test_UAT_FC_REQ-142_site_store_port.test.ts` |
| AC ids in the worktree | `grep -ranE "AC-?13(21\|22\|23\|24\|25\|26\|27\|28\|29\|53\|54)" tests/` | **zero hits** |
| Port symbols in the worktree | `grep -ran` for `SiteStore`, `fsSiteStore`, `memorySiteStore`, `makeMemorySite`, `assembleDraft`, `applyChange` over `tests/` and `tools/generate/src/` | zero code hits (one prose mention, `tests/req111-public-site-serving.test.ts:12`) |
| Runtime routing @ HEAD | `vitest.config.mts` | single project, `include: ['tests/**/*.test.ts']` (line 61); no `projects:`, no `.workers.test.ts` split; `@cloudflare/vitest-pool-workers@0.18.5` is a devDependency (`package.json:23`) but unused |
| Runtime routing @ `main` | `git ls-tree main`, `git show main:vitest.config.mts` | three configs — `vitest.config.mts` line 24 `projects: ['./vitest.node.config.mts', './vitest.workers.config.mts']` |
| Worktree cleanliness | `git status --short` | empty |

**The controlling fact**: the regression branch was cut at `0f44ef1ba` (2026-08-19 17:43), and the
capability's implementation *and* its UATs landed on `main` afterwards, at or before `bda6c9939`
(2026-08-20 05:57). The ticket store is global; the branch is not. This check is being asked to
validate a uat-level matrix against a tree that does not contain the code or the tests.

## Cumulative Intent Considered

| Intent ID | UID | Status | Counts? | Asked / changed |
|---|---|---|---|---|
| REQ-142 | `request-0dd62a5d` | `free_and_reconciled` | **YES** | The async `SiteStore` port with the filesystem behind it; no behaviour change. Source of AC-1321 – AC-1327, AC-1353, AC-1354. Bundled in `bundle-77b28def`. |
| REQ-141 | `request-b18d2056` | `ready_to_implement` | **YES (see info-4)** | Workers-runtime test project: two vitest projects routed by filename, real D1/R2 bindings. Source of AC-1328, AC-1329. Bundled in `bundle-77b28def`; deliverable verified present on `main`. |
| BUNDLE-19 | `bundle-77b28def` | `free_and_reconciled` | **YES** | Carrier for REQ-141 + REQ-142 (+7 more); `merged_at_commit: b18b859d7414a049be45e09f48426d73742e5bf2`. |
| REQ-143 | `request-18a48d63` | `ready_to_reconcile` | imminent — **no AC impact** | The Cloudflare `SiteStore` (D1 + R2). REQ-142's body explicitly scopes it out ("The D1/R2 adapter is REQ-143 and is deliberately not in scope here"). Adds a *third* adapter later; retires nothing here. |

Chronology: REQ-141 → REQ-142 (`depends_on: ['REQ-141']`) → REQ-143 (`depends_on: ['REQ-141','REQ-142']`).
No intent in the ledger retires any behaviour this capability claims. The capability body's two
named implementations (git-tracked FS tree, filesystem-free store) match REQ-142's scope exactly.

## Alignment Ledger

All 11 ACs are `status: active`. Coverage assessed **on `main`**, because the worktree has none
(see finding 3). Column 3 is the outcome *if the branch carried the code*; column 4 is the
outcome *in this worktree*.

| AC | Covering UAT on `main` | Outcome vs intent | Outcome in this worktree |
|---|---|---|---|
| AC-1321 storage answers totally, held and unheld | `reconciliation-site-storage-port.test.ts:126` `test_UAT_AC1321_…` | aligned | **absent** |
| AC-1322 assets as bytes, pages as keys | `…:197` `test_UAT_AC1322_…` | aligned | **absent** |
| AC-1323 multi-file command = one whole change | `…:257` `test_UAT_AC1323_…` (+ `REQ-142:317,338,359` via `recordingStore`) | aligned | **absent** |
| AC-1324 whole surface completes with no filesystem | `…:338` `test_UAT_AC1324_…` | aligned | **absent** |
| AC-1325 same seed answers identically over both stores | `…:422` `test_UAT_AC1325_…` (+ `REQ-142:376`) | aligned | **absent** |
| AC-1326 arguments/output/refusal envelopes unchanged | `…:460` `test_UAT_AC1326_…` (+ `REQ-142:276`) | aligned | **absent** |
| AC-1327 draft preview served from whichever store rendered it | `…:561` `test_UAT_AC1327_…` (+ `REQ-142:293,300`) | aligned | **absent** |
| AC-1328 two runtimes, real bindings in the Workers one | `reconciliation-site-storage-port.workers.test.ts:30` `test_UAT_AC1328_…` (+ `REQ-141_workers_runtime.workers.test.ts:17,24,58`) | aligned | **absent** |
| AC-1329 the split cost nothing the single runtime provided | `reconciliation-site-storage-port.test.ts:595` `test_UAT_AC1329_…` (+ `REQ-141_project_routing.test.ts:21,28,42,51`) | aligned | **absent** |
| AC-1353 surface and port import no filesystem module | `test_UAT_FC_REQ-142_site_store_port.test.ts:105` + `:115` — substantive, but **not** named `test_UAT_AC1353_*` | covered, untraceable by name → **warning (finding 2)** | **absent** |
| AC-1354 each entry point names its store once; tool adapter edits through it | **none** — `grep -aE "AC-?1354"` over `main -- tests` returns nothing; no test drives `l1Operations`/the toolbox against an injected store | **gap → violation (finding 1)** | **absent** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 (active, from REQ-142 `free_and_reconciled`) has **no UAT on `main` and none here**. `git grep -aE "AC-?1354" main -- tests` → no match. Neither half of its Verification clause is asserted anywhere: (a) that each of the three entry points constructs its store in exactly one place and every layer beneath takes an injected store; (b) that the assistant's tool adapter, driven against an injected store, lands a copy edit with the change count advanced, adds an asset from a real source file as bytes, and refuses a non-existent source path with the same code/path/hint the CLI produces. | Author `test_UAT_AC1354_*`. Both halves are testable **without production change**: `l1Operations(slug, opts)` is exported (`main:tools/generate/src/cli/ai/toolbox.ts:176`) and takes `opts.store`, so the adapter can be driven against `makeMemorySite()`; `add_asset` already reads the operator's source file itself (`:134`, `:323`). The single-construction claim is structural, like AC-1353's — assert `fsSiteStore(` appears exactly once per entry point (`toolbox.ts:505`, `cli/index.ts`, `cli/builder.ts`). Do **not** classify as `code-issue`: the code supports the claim; only the assertion is missing. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353 is substantively proven on `main` by `test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`edit.ts` imports no `node:fs`/`node:path`/`../store`) and `:115` (`site-store.ts`, `assemble.ts`, `journal-model.ts`, `memory-store.ts` import no `node:` module and no `./fsutil`) — every module AC-1353 names is covered. But the tests are named for the *intent* (`UAT_FC_REQ-142`) and linked to the AC only by a source comment (`// ── AC-2: the seam is real, not described`), so the `test_UAT_AC{number}_` traceability convention does not resolve AC-1353 to any test. | Rename to `test_UAT_AC1353_the_editing_surface_and_port_import_no_filesystem_module`, or add an AC-named wrapper. No behavioural change — traceability only. Not a violation: the evidence exists and is correct. |
| 3 | needs_review | coverage | **all 11 ACs** / the capability as a whole | — (not repairable on this branch) | **The capability under check is not present in the tree under check.** `regression-cb0dad9c` was cut at `0f44ef1ba` (2026-08-19 17:43); REQ-141's and REQ-142's implementation and UATs landed on `main` afterwards (`bda6c9939`, 2026-08-20 05:57). In this worktree: none of the six port modules exist, none of the five port test files exist, `tests/support/site-factory.ts` does not exist, the vitest config is a single project with no `.workers.test.ts` routing, and `grep` for every AC id and every port symbol returns nothing. **Zero of 11 ACs are verifiable here.** This is an environment/branch-topology error, not matrix drift — the matrix is global, the branch is not. | Escalate to the operator. Either (a) refresh/re-cut the regression branch from current `main` so the uat level can be evaluated against the code it describes, or (b) exclude `capability-c4c7a854` from this regression run. **Do not** author UATs on this branch: doing so would require porting REQ-141/REQ-142's production code onto a regression branch, which is feature work in the one place it must not happen. |

## Why this is not reported as 11 coverage violations

Mechanically, this worktree has 11 ACs with zero tests. Reporting that as eleven `uat-add`
violations would be a true sentence and a false instruction: it would direct the fix loop to
author UATs for production code that is absent, on a branch that must not carry feature work.
Finding 3 states the same fact in the shape that admits a correct action. Findings 1 and 2 are
the *real* matrix gaps — derived against `main`, where the code lives — and are recorded here so
that the 29 iterations spent on this capability leave behind something actionable once the branch
question is settled.

## Notes for the Editor

- **Do not attempt findings 1 or 2 on `regression-cb0dad9c`.** Their target files
  (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, `tests/support/site-factory.ts`) do not
  exist here. They are `main` work. Attempts 1–28 correctly applied zero mutations for this
  reason; a 30th attempt on this branch will reach the same wall.
- **The loop should stop.** Attempt 28 (`report-7201aabb`) set `progress_made: false`
  deliberately to exit to the operator. This pass confirms the blocker is unchanged and is not of
  a kind any fix workflow can clear: no edit to a ticket, a test, or a source file on this branch
  resolves it. Per the failure/error taxonomy, this is an **error** (branch topology), not a
  recoverable **failure** — it has no fix-loop path by construction.
- **info-4 — REQ-141's status is anomalous but not load-bearing here.** REQ-141 reads
  `ready_to_implement` with `ready_since: 2026-08-20T21:03:59Z` (today), yet it is
  `bundled_in: bundle-77b28def` (`free_and_reconciled`, `merged_at_commit b18b859d7`) and its
  deliverable is demonstrably on `main` (`vitest.config.mts:24` composes
  `vitest.node.config.mts` + `vitest.workers.config.mts`; both REQ-141 UAT files present). Read
  literally, `ready_to_implement` does not count toward cumulative intent — which would strand
  AC-1328/AC-1329. This pass treats REQ-141 as counting, because the merged evidence outranks the
  status field, and because AC-1328/AC-1329 are `active` and covered. Flagged so a later pass does
  not silently reach the opposite conclusion; worth an operator glance at whether REQ-141 was
  re-queued for a second iteration.
- **REQ-143 changes nothing at this level.** It is `ready_to_reconcile` (imminent) and adds a
  third adapter (D1 + R2). REQ-142's body scopes it out explicitly. When it reconciles, expect
  new ACs, and expect `SITE_BACKENDS` in `tests/support/site-factory.ts` to grow a third entry —
  AC-1325 ("the same seed answers identically over both stores") will then need its wording
  checked against a three-adapter world. Not a finding today.
