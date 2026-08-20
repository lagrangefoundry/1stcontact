---
uid: report-5e96982e
id: REPORT-2538
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T21:23:33.245658+00:00'
updated_at: '2026-08-20T21:23:33.245658+00:00'
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

Thirtieth-first uat-level pass (`previous_attempt_count = 30`). Cumulative matrix/test mutations
applied across attempts 1–30: **0**.

Every claim below was re-derived from git and the ticket store **this pass**. Nothing was
inherited from `report-9e65f0b8` (REPORT-2533) or its predecessors. Where this pass reaches the
same conclusion as the previous one, it did so by independent derivation and the commands are
listed so the derivation is reproducible. **One fact is new this pass** and was not in any prior
report: AC-1353 and AC-1354 were authored *on this regression branch* by an earlier ac-level fix
pass in this same run, and do not exist on `main` (info-5). That changes the reading of finding 1
from "an old gap nobody closed" to "a gap this run manufactured on a branch where it cannot be
closed."

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -6` | `eaa4ac065`, `6fc30c756`, `0e4ebedc9`, `8b6804a26`, `dd4ba7b2b`, `00bba451a` — workflow/ticket/report commits only |
| Source change since the previous pass | `git diff --stat 0c2d36b97..HEAD` | 8 files, all `.xgd/tickets/hot/*.md` (4 comments, 4 reports). **Zero source or test files.** The `fix_uat_validation` at `eaa4ac065` landed no mutation. |
| Worktree cleanliness | `git status --short` | empty |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Regression cut point | `git log -1 --format='%ci' 0f44ef1ba` | `2026-08-19 17:43:02 -0700` |
| `main` HEAD | `git log -1 --format='%H %ci' main` | `78932cc53`, `2026-08-20 14:20:35 -0700` (moved since the last pass; still ahead) |
| Divergence | `git rev-list --count HEAD..main` | **500** commits on `main` absent here |
| `main` an ancestor of HEAD? | `git merge-base --is-ancestor main HEAD` | no |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | 8 pre-port modules: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot`. **None of `site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts`, `journal-model.ts`, `journal.ts`.** |
| Test support @ HEAD | `ls tests/support/` | `webui-installed.ts` only — no `site-factory.ts` |
| Runtime routing @ HEAD | `git ls-files \| grep -i vitest` | one file, `vitest.config.mts`; no `.node`/`.workers` split |
| AC-named UATs @ HEAD | `grep -ranE "test_UAT_AC13(2[1-9]\|5[34])_" .` excluding `.xgd`/`node_modules` | **zero hits** |
| AC-named UATs @ `main` | `git grep -aoE "test_UAT_AC13(2[1-9]\|5[34])_[A-Za-z0-9_]*" main -- tests` | 9 hits: AC-1321…AC-1329. **No AC-1353, no AC-1354.** |

**The controlling fact, unchanged**: the branch was cut at `0f44ef1ba` (2026-08-19 17:43); the
capability's implementation and its UATs landed on `main` afterwards. The ticket store is global;
the branch is not. This check is being asked to validate a uat-level matrix against a tree that
contains neither the code nor the tests.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-141 | `request-b18d2056` | `ready_to_implement` (updated 2026-08-20T21:03:59Z) | 2026-08-15 | Workers-runtime test project: two vitest projects routed by filename, real D1/R2 bindings. Source of AC-1328, AC-1329. `bundled_in: bundle-77b28def`. | **YES** — see info-4 |
| REQ-142 | `request-0dd62a5d` | `free_and_reconciled` | 2026-08-15 | The async `SiteStore` port with the filesystem behind it; no behaviour change. Source of AC-1321–AC-1327, and of the two branch-local ACs 1353/1354. `bundled_in: bundle-77b28def`. | **YES** |
| BUNDLE-19 | `bundle-77b28def` | `free_and_reconciled` | — | Carrier for REQ-141 + REQ-142; `merged_at_commit b18b859d7`. | **YES** |
| REQ-143 | `request-18a48d63` | `ready_to_reconcile` | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2). REQ-142 scopes it out explicitly. Adds a *third* adapter later; retires nothing here. | imminent — **no AC impact** |
| REQ-119 | `request-64864801` | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders; owns preview *freshness* (CAP-85, AC-1033). Cited by AC-1327 to scope freshness **out** of this capability. | YES (boundary only) |

Chronology: REQ-119 → REQ-141 → REQ-142 (`depends_on: ['REQ-141']`) → REQ-143.
**No intent in the ledger retires any behaviour this capability claims.** The capability body's
two named implementations (git-tracked FS tree, filesystem-free store) match REQ-142's scope
exactly; the two-runtime clause matches REQ-141's.

## Alignment Ledger

All 11 ACs are active (`kind: behavior`, `regression_only: false`). Coverage is assessed **on
`main`**, because this worktree has none (finding 3). Column 3 is the outcome *if the branch
carried the code*; column 4 is the outcome *in the tree actually under check*.

| AC | Covering UAT on `main` | Outcome vs its AC body | Outcome in this worktree |
|---|---|---|---|
| AC-1321 storage answers totally, held and unheld | `reconciliation-site-storage-port.test.ts` `test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned | **absent** |
| AC-1322 assets as bytes, pages as keys | `…test.ts` `test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned | **absent** |
| AC-1323 multi-file command = one whole change | `…test.ts` `test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` (+ `REQ-142:317,338,359` via the recording store) | aligned | **absent** |
| AC-1324 whole surface completes with no filesystem | `…test.ts` `test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` (+ `REQ-142:395` memory fixture holds no fs handle) | aligned | **absent** |
| AC-1325 same seed answers identically over both stores | `…test.ts` `test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` (+ `REQ-142:376`; `tests/support/site-factory.ts:161` `SITE_BACKENDS`) | aligned | **absent** |
| AC-1326 arguments/output/refusal envelopes unchanged | `…test.ts` `test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` (+ `REQ-142:276`) | aligned | **absent** |
| AC-1327 draft preview from whichever store rendered it | `…test.ts` `test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` (+ `REQ-142:293,300`) | aligned | **absent** |
| AC-1328 two runtimes, real bindings in the Workers one | `reconciliation-site-storage-port.workers.test.ts` `test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` (+ `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`) | aligned | **absent** |
| AC-1329 the split cost nothing the single runtime provided | `reconciliation-site-storage-port.test.ts` `test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` (+ `test_UAT_FC_REQ-141_project_routing.test.ts`) | aligned | **absent** |
| AC-1353 surface and port import no filesystem module | `test_UAT_FC_REQ-142_site_store_port.test.ts:105` (`edit.ts` imports no filesystem module) + `:115` (the port and its model reach no filesystem) — substantive, but **not** named `test_UAT_AC1353_*` | covered; **untraceable by name** → warning (finding 2) | **absent** |
| AC-1354 each entry point names its store once; tool adapter edits through it | **none** | **gap** → violation (finding 1) | **absent** |

Derivation for the AC-1354 row (re-run this pass, not inherited):
`git grep -aoE "test_UAT_AC1354_…" main -- tests` → no match;
`git grep -anE "AC-?1354" main -- tests` → no match;
`git grep -an "fsSiteStore\|memorySiteStore\|makeMemorySite" main -- tests` → 24 hits, none of which
constructs `l1Operations`/`createL1Toolbox` over an injected memory store, and none of which
asserts single-construction at the three entry points. The 12 test files that import
`toolbox.ts` (`git grep -anE "toolbox" main -- tests`) all pass `fsOpts(cwd)`.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is active and derives from REQ-142 (`free_and_reconciled`), but has **no UAT on `main` and none here**. Neither half of its Verification clause is asserted anywhere: (a) that each of the three entry points — command line, builder origin, assistant tool adapter — constructs its store in exactly one place, with every layer beneath taking an injected store and none selecting or falling back at runtime; (b) that the tool adapter, driven against an injected store, lands a copy edit that reads back with the change count advanced, adds an asset by reading the operator's source file itself and handing bytes across, and refuses a non-existent source path with the same code/path/hint the CLI produces for the same input. | Author `test_UAT_AC1354_*` **on `main`**. Both halves are testable with no production change: `l1Operations(slug, opts)` is exported from `tools/generate/src/cli/ai/toolbox.ts` and accepts `opts.store`, so the adapter can be driven against `makeMemorySite()` from `tests/support/site-factory.ts`; `add_asset` already reads the operator's source file itself. The single-construction half is structural, exactly as AC-1353's is: assert `fsSiteStore(` appears once per entry point. **Do not classify as `code-issue`** — the code supports the claim; only the assertion is missing. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's substance **is** proven on `main`: `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` asserts `edit.ts` imports no filesystem module, and `:115` asserts the port, its assembly path, its journal model and its filesystem-free store reach no filesystem — covering every module AC-1353 names, both the runtime-module imports and the filesystem-helper barrel. But those tests are named for the *intent* (`UAT_FC_REQ-142 …`) and bound to the AC only by a source comment, so the `test_UAT_AC{number}_` traceability convention resolves AC-1353 to nothing. | Rename the two cases to `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` (or add an AC-named wrapper). Traceability only — no behavioural change, and the evidence is already correct. Not a violation. |
| 3 | needs_review | coverage | **all 11 ACs** / the capability as a whole | — (not repairable on this branch) | **The capability under check is not present in the tree under check.** `regression-cb0dad9c` was cut at `0f44ef1ba` (2026-08-19 17:43); REQ-141's and REQ-142's implementation and UATs landed on `main` afterwards, and `main` is now 500 commits ahead. In this worktree: none of the six port modules exist (`git ls-files tools/generate/src/store` returns only the 8 pre-port modules), none of the port test files exist, `tests/support/site-factory.ts` does not exist, `vitest.config.mts` is a single project with no `.workers.test.ts` routing, and a grep for every AC id and every port symbol returns nothing. **Zero of 11 ACs are verifiable here.** This is branch topology, not matrix drift — the matrix is global, the branch is not. | Escalate to the operator. Either (a) re-cut/refresh the regression branch from current `main` so the uat level is evaluated against the code it describes, or (b) exclude `capability-c4c7a854` from this regression run. **Do not** author UATs on this branch: it would require porting REQ-141/REQ-142's production code onto a regression branch, which is feature work in the one place it must not happen. |
| 4 | info | — | REQ-141 (`request-b18d2056`) | — | REQ-141 reads `ready_to_implement` (`updated_at 2026-08-20T21:03:59Z`) yet is `bundled_in: bundle-77b28def` (`free_and_reconciled`, `merged_at_commit b18b859d7`) and its deliverable is demonstrably on `main` (three vitest configs; both REQ-141 UAT files present). Read literally, `ready_to_implement` does **not** count toward cumulative intent, which would strand AC-1328/AC-1329. This pass treats it as counting: merged evidence outranks the status field, and both ACs are active and covered. | Operator glance at whether REQ-141 was re-queued for a second iteration. No matrix action. |
| 5 | info | — | AC-1353 + AC-1354 | — | **New this pass.** Both ACs were created **on this regression branch**, not on `main`: `acceptance_criterion-003caa07` at `9c1fdab20` (2026-08-20 08:43:36 -0700) and `acceptance_criterion-56798f01` at `3ef83fd85` (2026-08-20 08:59:43 -0700), both after the cut at `0f44ef1ba`. `git ls-tree main` finds neither blob, while AC-1321's (`d4cc3712`) is present on `main`. They were authored by an earlier **ac-level** fix pass in this same regression run. | Explains why findings 1 and 2 are structurally unclosable here: the ac-level stage added two criteria whose UATs can only be written against code that is not on this branch, so the uat-level stage that follows it is guaranteed to fail. Worth the operator's attention as a loop-design observation, not a matrix edit. |

## Why this is not reported as 11 coverage violations

Mechanically, this worktree has 11 active ACs and zero tests. Reporting that as eleven `uat-add`
violations would be a true sentence and a false instruction: it would direct the fix loop to
author UATs for production code that is absent, on a branch that must not carry feature work.
Finding 3 states the same fact in the shape that admits a correct action. Findings 1 and 2 are
the *real* matrix gaps — derived against `main`, where the code lives — and are recorded so the
30 iterations spent here leave behind something actionable once the branch question is settled.

## Notes for the Editor

- **Do not attempt findings 1 or 2 on `regression-cb0dad9c`.** Their target files
  (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, `tests/support/site-factory.ts`,
  `tools/generate/src/cli/ai/toolbox.ts` in its ported form) do not exist here. They are `main`
  work. Attempts 1–30 applied zero mutations for exactly this reason; the `fix_uat_validation`
  at `eaa4ac065` — the most recent one, run after the previous report — again landed nothing but
  ticket files (`git diff --stat 0c2d36b97..HEAD`). A 32nd attempt on this branch reaches the
  same wall.
- **The loop should stop.** The blocker is unchanged and is not of a kind any fix workflow can
  clear: no edit to a ticket, a test or a source file *on this branch* resolves it. Per the
  failure/error taxonomy this is an **error** (branch topology), not a recoverable **failure** —
  it has no fix-loop path by construction, and the repeated `@fail` → `fix_uat_validation` →
  `@fail` cycle is the symptom.
- **Finding 5 is the sharper diagnosis.** Earlier passes read this as "the regression branch
  predates the code." That is true, but incomplete: the ac-level stage of *this run* added
  AC-1353 and AC-1354 to the branch-local matrix on 2026-08-20, and AC-1354 has no UAT anywhere.
  So even a branch carrying all of `main`'s tests would still fail this check on AC-1354 until
  that test is written on `main`. Re-cutting the branch is necessary but, on its own, not
  sufficient — finding 1 must also be closed on `main`.
- **REQ-143 changes nothing at this level.** It is `ready_to_reconcile` (imminent) and adds a
  third adapter (D1 + R2); REQ-142's body scopes it out explicitly. When it reconciles, expect new
  ACs and expect `SITE_BACKENDS` in `tests/support/site-factory.ts` to grow a third entry —
  AC-1325 ("the same starting site answers identically over both stores") will then need its
  wording checked against a three-adapter world. Not a finding today.
- **Survey hazard, carried from the story's Technical Context and confirmed in method here.** Two
  of the heaviest consumers of the editing surface contain NUL bytes as cache-key separators, so
  a plain recursive grep classifies them as binary and skips them silently. Every grep in this
  report used `-a` (force text). A survey without it will under-report consumers.
