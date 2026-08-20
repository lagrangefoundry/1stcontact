---
uid: report-a024b544
id: REPORT-2541
type: report
title: 'Capability-Intent Alignment: Site Storage Port: One Async Store Behind Every
  Edit (level=uat)'
created_by: xgd
created_at: '2026-08-20T21:30:28.834033+00:00'
updated_at: '2026-08-20T21:30:28.834033+00:00'
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

Thirty-second uat-level pass (`previous_attempt_count = 31`). Cumulative matrix, test or source
mutations applied by attempts 1–31: **0** (re-derived below, not inherited).

Every claim in this report was re-derived from git and the ticket store **this pass**. Nothing
was carried over from `report-5e96982e` (REPORT-2538) or its predecessors; where this pass lands
on the same conclusion it did so by independent derivation, and the command that produced each
fact is listed so it can be re-run. **Two facts are new this pass** and appear in no prior
report:

- The "nothing can land on this branch" reading is **too strong and was wrong** as a general
  claim. This regression branch *does* accept test and matrix repairs — 827 commits sit on it
  since the cut, and 43 source/test files have been modified here by earlier `fix_*` workflows
  (info-6). The blocker is narrower and therefore sharper: it is specific to *this* capability,
  whose production code is on `main` and not here.
- `main` advanced by one commit since the previous pass (500 → 501 commits ahead) and still
  contains **no** UAT for AC-1353 or AC-1354. Finding 1 is not being closed on `main` while this
  loop spins here (info-7).

## Verification environment (re-derived this pass)

| Check | Command | Result |
|---|---|---|
| Branch | `git rev-parse --abbrev-ref HEAD` | `regression-cb0dad9c` |
| HEAD | `git log --oneline -5` | `c6c46a152`, `8845c32af`, `956f6a6c2`, `6c3386f1d`, `408c92cb8` — workflow/ticket/report commits only |
| Worktree cleanliness | `git status --short` | empty |
| merge-base with `main` | `git merge-base HEAD main` | `0f44ef1ba06d0e071fbe726db099d5908cc425e4` |
| Regression cut point | `git log -1 --format='%ci' 0f44ef1ba` | `2026-08-19 17:43:02 -0700` |
| `main` HEAD | `git log -1 --format='%H %ci' main` | `78932cc53`, `2026-08-20 14:20:35 -0700` |
| Divergence | `git rev-list --count HEAD..main` | **501** commits on `main` absent here (was 500 last pass) |
| Branch's own commits | `git rev-list --count 0f44ef1ba..HEAD` | 827 |
| Source change since the previous check report | `git diff --stat d22e2ba1d..HEAD` | 3 files, all `.xgd/tickets/hot/*.md` (2 comments, 1 report). **Zero source or test files.** The `fix_uat_validation` at `c6c46a152` landed no mutation. |
| Source change across the whole uat fix loop | `git diff --stat fb283f48b..HEAD -- . ':(exclude).xgd'` | **empty** — nothing outside `.xgd/` has changed on this branch since `2026-08-20 07:53`, which predates every one of the 31 attempts |
| Store modules @ HEAD | `git ls-files tools/generate/src/store` | 8 pre-port modules: `base`, `diff`, `fsutil`, `history`, `index`, `loadSite`, `paths`, `snapshot`. **None of** `site-store.ts`, `memory-store.ts`, `fs-store.ts`, `assemble.ts`, `journal-model.ts`, `journal.ts`. |
| Store modules @ `main` | `git ls-tree main --name-only tools/generate/src/store/` | 14 modules — the 8 above **plus** `assemble.ts`, `fs-store.ts`, `journal-model.ts`, `journal.ts`, `memory-store.ts`, `site-store.ts` |
| Test support @ HEAD | `ls tests/support/` | `webui-installed.ts` only — no `site-factory.ts` |
| Runtime routing @ HEAD | `git ls-files \| grep -i vitest` | one file, `vitest.config.mts`; no `.node`/`.workers` split |
| AC-named UATs @ HEAD | `grep -ranE "test_UAT_AC13(2[1-9]\|5[34])_" .` (excluding `.xgd`, `node_modules`) | **zero hits** |
| AC-named UATs @ `main` | `git grep -aoE "test_UAT_AC13(2[0-9]\|3[0-9]\|5[0-9])_[A-Za-z0-9_]*" main -- tests` | AC-1321…AC-1329 present (9 of them). **No AC-1353, no AC-1354.** |
| Any AC id reference @ `main` | `git grep -an "AC-1353\|AC-1354\|AC1353\|AC1354" main -- tests tools packages` | **no output** |

**The controlling fact.** The branch was cut at `0f44ef1ba` (2026-08-19 17:43). REQ-141's and
REQ-142's implementation and their UATs landed on `main` *after* that. The ticket store is
global; the branch is not. This check is being asked to validate a uat-level matrix against a
tree that contains neither the code the ACs describe nor the tests that prove them.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-119 | `request-64864801` | `free_and_reconciled` | 2026-07-31 | Request-time draft/edit renders; owns preview *freshness* (CAP-85). Cited by AC-1327 only to scope freshness **out** of this capability. | YES (boundary only) |
| REQ-141 | `request-b18d2056` | `ready_to_implement` | 2026-08-15 | Workers-runtime test project: two vitest projects routed by filename, real D1/R2 bindings. Source of AC-1328, AC-1329. `bundled_in: bundle-77b28def`. | **YES** — see info-4 |
| REQ-142 | `request-0dd62a5d` | `free_and_reconciled` | 2026-08-15 | The async `SiteStore` port with the filesystem behind it; no behaviour change. Source of AC-1321–AC-1327 and of the two branch-local ACs 1353/1354. `bundled_in: bundle-77b28def`. | **YES** |
| BUNDLE-19 | `bundle-77b28def` | merged (`merged_at_commit b18b859d7`) | — | Carrier for REQ-141 + REQ-142. | **YES** |
| REQ-143 | `request-18a48d63` | `ready_to_reconcile` | 2026-08-15 | The Cloudflare `SiteStore` (D1 + R2). REQ-142 scopes it out explicitly. Adds a *third* adapter later; retires nothing here. | imminent — **no AC impact** |

Chronology: REQ-119 → REQ-141 → REQ-142 (`depends_on: ['REQ-141']`) → REQ-143.

**No intent in the ledger retires any behaviour this capability claims.** The capability body's
two named implementations (the git-tracked FS tree, the filesystem-free store) match REQ-142's
scope exactly; the two-runtime clause matches REQ-141's. There is no consistency drift to report
between the ACs and the intent that produced them — the failure at this level is entirely one of
*evidence location*.

## Alignment Ledger

All 11 ACs are active (`kind: behavior`, `regression_only: false`), and all 11 hang off the one
story STORY-118 (`story_kind: feature`), so all are in scope for uat coverage. Coverage is
assessed **on `main`**, because this worktree has none (finding 3). Column 3 is the outcome *if
the branch carried the code*; column 4 is the outcome *in the tree actually under check*.

| AC | Covering UAT on `main` | Outcome vs its AC body | Outcome in this worktree |
|---|---|---|---|
| AC-1321 storage answers totally, held and unheld | `reconciliation-site-storage-port.test.ts::test_UAT_AC1321_storage_answers_every_question_totally_held_and_unheld` | aligned | **absent** |
| AC-1322 assets as bytes, pages as keys | `…::test_UAT_AC1322_assets_cross_as_bytes_and_pages_as_keys_never_locations` | aligned | **absent** |
| AC-1323 multi-file command = one whole change | `…::test_UAT_AC1323_a_multi_file_command_reaches_storage_as_one_whole_change` (+ `test_UAT_FC_REQ-142_site_store_port.test.ts:317,338,359`) | aligned | **absent** |
| AC-1324 whole surface completes with no filesystem | `…::test_UAT_AC1324_the_whole_editing_surface_completes_with_no_filesystem` (+ `REQ-142:395`) | aligned | **absent** |
| AC-1325 same seed answers identically over both stores | `…::test_UAT_AC1325_the_same_seed_answers_identically_over_both_stores` (+ `REQ-142:376,378`; `tests/support/site-factory.ts:161` `SITE_BACKENDS`) | aligned | **absent** |
| AC-1326 arguments/output/refusal envelopes unchanged | `…::test_UAT_AC1326_command_arguments_output_and_refusal_envelopes_are_unchanged` (+ `REQ-142:276`) | aligned | **absent** |
| AC-1327 draft preview from whichever store rendered it | `…::test_UAT_AC1327_the_draft_preview_is_served_from_whichever_store_rendered_it` (+ `REQ-142:293,300`) | aligned | **absent** |
| AC-1328 two runtimes, real bindings in the Workers one | `reconciliation-site-storage-port.workers.test.ts::test_UAT_AC1328_workers_marked_file_runs_in_workerd_with_real_bindings` (+ `test_UAT_FC_REQ-141_workers_runtime.workers.test.ts`) | aligned | **absent** |
| AC-1329 the split cost nothing the single runtime provided | `reconciliation-site-storage-port.test.ts::test_UAT_AC1329_the_split_kept_the_astro_runtime_and_partitions_cleanly` (+ `test_UAT_FC_REQ-141_project_routing.test.ts`) | aligned | **absent** |
| AC-1353 surface and port import no filesystem module | `test_UAT_FC_REQ-142_site_store_port.test.ts:105` + `:115` — substantive, but **not** named `test_UAT_AC1353_*` | covered; **untraceable by name** → warning (finding 2) | **absent** |
| AC-1354 each entry point names its store once; tool adapter edits through it | **none** | **gap** → violation (finding 1) | **absent** |

**Derivation for the AC-1353 row** (re-run this pass): `git show main:tests/test_UAT_FC_REQ-142_site_store_port.test.ts`
lines 105–122 assert `edit.ts` matches neither `from 'node:fs'`, `from 'node:path'` nor
`from '../store'`; lines 115–122 loop over `site-store.ts`, `assemble.ts`, `journal-model.ts`,
`memory-store.ts` asserting neither `from 'node:` nor `from './fsutil'`, with the module name
passed as the assertion label so an offender is identified by name. That is every module AC-1353
names, both halves of its import claim, and its "identify the offending module" clause. The
substance is proven; only the name is wrong for traceability.

**Derivation for the AC-1354 row** (re-run this pass, not inherited):
- `git grep -aoE "test_UAT_AC1354_…" main -- tests` → no match.
- `git grep -an "AC-1353\|AC-1354\|AC1353\|AC1354" main -- tests tools packages` → no match at all.
- `git grep -an "fsSiteStore(" main -- tools packages` → exactly 4 hits: the definition at
  `tools/generate/src/store/fs-store.ts:45`, and **one construction per entry point** —
  `tools/generate/src/cli/index.ts:1313` (command line), `tools/generate/src/cli/builder.ts:628`
  (builder origin), `tools/generate/src/cli/ai/toolbox.ts:505` (assistant tool adapter). The
  production shape AC-1354 describes **is real on `main`**; nothing asserts it.
- `git grep -an "fsSiteStore\|memorySiteStore\|makeMemorySite" main -- tests` → 24 hits, none of
  which constructs the tool adapter over an injected memory store and none of which asserts
  single-construction at the three entry points.
- `git grep -anl "l1Operations\|createL1Toolbox" main -- tests` → 13 files exercise the tool
  adapter; none appears in the `makeMemorySite` hit list above, i.e. every one of them drives the
  adapter over the filesystem.

So AC-1354's second half — the adapter driven end-to-end through an *injected* store — is
asserted nowhere, and its first half — single construction, no runtime selection — is asserted
nowhere. This is a genuine coverage gap on `main`, independent of the branch problem.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1354 (`acceptance_criterion-56798f01`) | `uat-add` | AC-1354 is active and derives from REQ-142 (`free_and_reconciled`), but has **no UAT on `main` and none here**. Neither half of its Verification clause is asserted anywhere: (a) that each of the three entry points — command line, builder origin, assistant tool adapter — constructs its store in exactly one place, with every layer beneath taking an injected store and none selecting or falling back at runtime; (b) that the tool adapter, driven against an injected store, lands a copy edit that reads back with the change count advanced, adds an asset by reading the operator's source file itself and handing bytes across, and refuses a non-existent source path with the same code/path/hint the CLI produces for the same input. | Author `test_UAT_AC1354_*` **on `main`**. Both halves are testable with no production change: `l1Operations(slug, opts)` is exported from `tools/generate/src/cli/ai/toolbox.ts` and threads `opts` into `new L1Toolbox(slug, {...opts, store: …})` at `:505`, so the adapter can be driven against `makeMemorySite()` from `tests/support/site-factory.ts`; `add_asset` already reads the operator's source file itself. The single-construction half is structural, exactly as AC-1353's is: assert `fsSiteStore(` occurs exactly once in each of `cli/index.ts`, `cli/builder.ts`, `cli/ai/toolbox.ts` and nowhere below them. **Do not classify as `code-issue`** — the four `fsSiteStore(` sites on `main` already match the claim; only the assertion is missing. |
| 2 | warning | consistency | AC-1353 (`acceptance_criterion-003caa07`) | `uat-edit` | AC-1353's substance **is** proven on `main` at `tests/test_UAT_FC_REQ-142_site_store_port.test.ts:105` and `:115` — covering every module AC-1353 names, both the runtime-module imports and the filesystem-helper barrel, and naming the offender on failure. But those two cases are named for the *intent* (`UAT_FC_REQ-142 …`) and bound to the AC only by a section comment (`// ── AC-2: the seam is real, not described ──`), so the `test_UAT_AC{number}_` traceability convention resolves AC-1353 to nothing. | Rename the two cases to `test_UAT_AC1353_the_editing_surface_and_the_port_import_no_filesystem_module` (suffixing `_imports` / `_modules` to keep them distinct), or add AC-named wrappers. Traceability only — no behavioural change, the evidence is already correct. Not a violation. |
| 3 | needs_review | coverage | **all 11 ACs** / the capability as a whole | — (not repairable on this branch) | **The capability under check is not present in the tree under check.** `regression-cb0dad9c` was cut at `0f44ef1ba` (2026-08-19 17:43); REQ-141's and REQ-142's implementation and UATs landed on `main` afterwards, and `main` is now 501 commits ahead. In this worktree: six of the port's modules are absent (`git ls-files tools/generate/src/store` returns only the 8 pre-port ones, against 14 on `main`), all three port test files are absent, `tests/support/site-factory.ts` is absent, `vitest.config.mts` is a single project with no `.workers.test.ts` routing, and a grep for every AC id and every port symbol returns nothing. **Zero of 11 ACs are verifiable here.** This is branch topology, not matrix drift. | Escalate to the operator. Either (a) re-cut or refresh the regression branch from current `main` so the uat level is evaluated against the code it describes, or (b) exclude `capability-c4c7a854` from this regression run. **Do not** author UATs for this capability on this branch: it would require porting REQ-141/REQ-142's production code onto a regression branch, which is feature work in the one place it must not happen. |
| 4 | info | — | REQ-141 (`request-b18d2056`) | — | REQ-141 reads `ready_to_implement` yet is `bundled_in: bundle-77b28def`, whose `merged_at_commit` is `b18b859d7`, and its deliverable is demonstrably on `main` (both REQ-141 UAT files present; `.workers.test.ts` routing live). Read literally, `ready_to_implement` does **not** count toward cumulative intent, which would strand AC-1328/AC-1329. This pass treats it as counting: merged evidence outranks the status field, and both ACs are active and covered on `main`. | Operator glance at whether REQ-141 was re-queued for a second iteration. No matrix action. |
| 5 | info | — | AC-1353 + AC-1354 | — | Both ACs exist **only on this regression branch**. `git ls-tree main --name-only .xgd/tickets/hot/` finds neither `acceptance_criterion-003caa07.md` nor `acceptance_criterion-56798f01.md`, while AC-1321's blob (`acceptance_criterion-d4cc3712.md`) *is* on `main`; `git ls-tree HEAD` finds all three. They were authored by an earlier **ac-level** fix pass in this same regression run. | Explains why findings 1 and 2 are structurally unclosable here: the ac-level stage added two criteria whose UATs can only be written against code that is not on this branch, so the uat-level stage that follows it is guaranteed to fail. A loop-design observation, not a matrix edit. |
| 6 | info | — | the fix loop | — | **New this pass, and it corrects an over-broad reading in earlier reports.** This regression branch is *not* write-frozen: it carries 827 commits since the cut, and `git diff --stat 0f44ef1ba..HEAD -- . ':(exclude).xgd'` shows 43 source/test files changed here by earlier `fix_uat_validation` / `fix_ac_validation` / `fix_uat_coverage` / `fix_story_validation` workflows and one free-coded CLI fix (`9e8abb376`). Other capabilities *have* been repaired on this branch successfully. The blocker is therefore not "nothing can land here" but the narrower and more decisive "**this capability's code is not here to be tested**". | Sharpens the escalation: the loop is not misconfigured in general, so the remedy is scoped to this capability (re-cut, or exclude), not to the regression machinery. |
| 7 | info | — | the fix loop | — | `git diff --stat fb283f48b..HEAD -- . ':(exclude).xgd'` is **empty**: nothing outside `.xgd/` has changed on this branch since `2026-08-20 07:53:10 -0700`, which precedes all 31 attempts. Every attempt has committed reports and comments and no code or tests. Meanwhile `main` advanced one commit since the previous pass (500 → 501 ahead) and `git grep "AC-1354" main` still returns nothing — finding 1 is not being closed on `main` while this loop runs. | The loop is not converging and cannot; nothing about the elapsed attempts changes the inputs. |

## Why this is not reported as 11 coverage violations

Mechanically, this worktree has 11 active ACs and zero tests, so 11 `uat-add` violations would be
a true sentence. It would also be a false instruction: it directs the fix loop to author UATs for
production code that is absent, on a branch that must not carry feature work. Finding 3 states
the same fact in the shape that admits a correct action. Findings 1 and 2 are the *real* matrix
gaps — derived against `main`, where the code lives — and are recorded so the 31 iterations spent
here leave behind something actionable once the branch question is settled.

## Notes for the Editor

- **Do not attempt findings 1 or 2 on `regression-cb0dad9c`.** Their target files
  (`tests/test_UAT_FC_REQ-142_site_store_port.test.ts`, `tests/support/site-factory.ts`,
  `tools/generate/src/cli/ai/toolbox.ts` in its ported form) do not exist here. They are `main`
  work. Attempts 1–31 applied zero mutations for exactly this reason; the most recent
  `fix_uat_validation` (`c6c46a152`, run after the previous report) again landed nothing but
  ticket files. A 33rd attempt on this branch reaches the same wall.
- **The loop should stop, and the stop is an operator decision, not a fix.** The blocker is of a
  kind no fix workflow can clear: no edit to a ticket, a test or a source file *on this branch*
  resolves it. Per the failure/error taxonomy this behaves as a **terminal failure** — an
  expected dead end with no fix-loop path by construction — and the repeated
  `@fail` → `fix_uat_validation` → `@fail` cycle is the symptom of it being routed as a
  recoverable failure instead.
- **Re-cutting is necessary but not sufficient.** Finding 5 plus finding 1 together: even a
  branch carrying all of `main`'s tests would still fail this check on AC-1354, because that UAT
  does not exist anywhere. Closing this capability's uat level needs both (a) the branch to see
  the code and (b) `test_UAT_AC1354_*` authored on `main`.
- **REQ-143 changes nothing at this level.** It is `ready_to_reconcile` (imminent) and adds a
  third adapter (D1 + R2); REQ-142's body scopes it out explicitly. When it reconciles, expect new
  ACs and expect `SITE_BACKENDS` in `tests/support/site-factory.ts` to grow a third entry —
  AC-1325 ("the same starting site answers identically over both stores") will then need its
  wording checked against a three-adapter world. Not a finding today.
- **Survey hazard, carried from STORY-118's Technical Context and re-confirmed in method here.**
  Two of the heaviest consumers of the editing surface carry NUL bytes as cache-key separators, so
  a plain recursive grep classifies them as binary and skips them silently. Every grep in this
  report used `-a` (force text). A survey without it will under-report consumers.
