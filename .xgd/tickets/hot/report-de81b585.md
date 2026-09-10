---
uid: report-de81b585
id: REPORT-3673
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T05:39:28.526356+00:00'
updated_at: '2026-09-10T05:39:28.526356+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: uat
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: CAP-102 (capability-5d07b533).
Attempt 3. Two fix cycles have run: REPORT-3670 (`fix_structural_validation`,
commit `c0e58ccdb4`) and REPORT-3672 (attempt 2, commits `5548061b56`…`2dd06aa673`).

Matrix shape at this level: 1 story (STORY-119, `story_kind: upgrade`), 18 active
acceptance criteria, 18 UATs — exactly one `test_UAT_AC<n>_*` per AC. A repo-wide
scan of `tests/ apps/ tools/ packages/ bin/` finds every one of the 18 names
exactly once, and all 18 live in the three `tests/*.test.ts` files that the `node`
vitest project includes.

**This check RAN the suites, independently of REPORT-3672's claim.** All three
files were executed in one invocation:

```
npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts \
            tests/reconciliation-platform-build-order-and-private-surface.test.ts \
            tests/reconciliation-platform-invocation-log-retention.test.ts
```

| File | Result |
|---|---|
| `tests/reconciliation-platform-build-deploy-smoke.test.ts` | 13 passed |
| `tests/reconciliation-platform-build-order-and-private-surface.test.ts` | 3 passed |
| `tests/reconciliation-platform-invocation-log-retention.test.ts` | 2 passed |
| **Total** | **Test Files 3 passed (3), Tests 18 passed (18)**, exit 0, 12.18s |

**18/18 active ACs now have a passing UAT** (was 17/18 at attempt 2). The one
`EPERM` line in the output is wrangler failing to write its own debug log to
`~/Library/Preferences/.wrangler/logs/` — a sandbox artifact of this worktree, not
a test failure; the run still exits 0.

## Cumulative Intent Considered

Every intent that touched this capability's tree was re-read this pass, not
carried forward from REPORT-3671. All ten are fully reconciled; the set and the
statuses are unchanged. Ordered by `created_at`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 (request-7bef34e0) | free_and_reconciled | 2026-08-15 | `bin/build` / `bin/deploy` / `bin/smoke`, the hook seam, the `[vars]` non-inheritance bug — the story's original 13 criteria (AC-1330…AC-1342) | YES |
| REQ-145 (request-b474390f) | free_and_reconciled | 2026-08-15 | control-app becomes the builder; the uncommitted generated artifacts the typecheck consumes (AC-1427); the `ACCESS_DEV_OPEN` relaxation named as AC-1341's one exception | YES |
| REQ-146 (request-0cdfdc5b) | free_and_reconciled | 2026-08-15 | The runtime-import guard that AC-1426 exists because it is blind to type-only edges | YES (context) |
| REQ-147 (request-23fd6e61) | free_and_reconciled | 2026-08-15 | Cloudflare Access on the builder; the two control-surface live-origin checks (AC-1425) | YES |
| REQ-149 (request-554ac441) | free_and_reconciled | 2026-08-17 | Cloud publish; the type-only reach into node → AC-1426; the secret-hook decision table behind AC-1342 | YES |
| BUNDLE-19 (bundle-77b28def) | free_and_reconciled | 2026-08-18 | Story's `intent_uid`; reconciled AC-1330…AC-1342 | YES |
| BUG-36 (bug-db356ff8) | free_and_reconciled | 2026-08-23 | Fresh deployment 503s until publish runs — the live-state note in the story's Technical Context | YES |
| BUG-37 (bug-6612c4b7) | free_and_reconciled | 2026-08-24 | The 1102 diagnosis that motivated invocation-log retention → AC-1454, AC-1455 | YES |
| BUNDLE-20 (bundle-b3b7c399) | free_and_reconciled | 2026-08-24 | Reconciled AC-1425, AC-1426, AC-1427 | YES |
| BUNDLE-21 (bundle-78f4e2fe) | free_and_reconciled | 2026-08-26 | Story's `updated_by`; reconciled AC-1454, AC-1455 | YES |

No abandoned / deprecated / wont_fix intent touches this tree, and no AC in it is
deprecated. There is therefore no retired-behaviour half to this ledger, Step 2.5
(the named-abandoned-vehicle case) does not arise anywhere in this capability, and
no finding below rests on a stale citation.

## Alignment Ledger

Per active AC: its UAT, the boundary that UAT actually drives, and the outcome.
Rows re-verified by execution this pass; the boundary column was re-derived from
the test bodies for the rows marked ✔read, and carried forward from REPORT-3671's
per-row reading (which this pass re-confirmed by running) for the rest.

| Element | UAT | Boundary actually driven | Outcome |
|---|---|---|---|
| AC-1330 | `test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one` | real `1c.mjs preflight` process, with a `Module._resolveFilename` hook making one component genuinely unresolvable | aligned, passes |
| AC-1331 | `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight` ✔read | real `bin/build` against the real repo (pnpm/npx recording shims, real `bin/1c`), plus a fixture tree with no apps | **aligned, passes — REPORT-3671's violation is repaired. See finding 3.** |
| AC-1332 | `test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation` | real `bin/deploy` in a fixture tree, rehearsal vs real compared line for line | aligned, passes |
| AC-1333 | `test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context` | real `bin/deploy` | aligned, passes |
| AC-1334 | `test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded` | real `bin/deploy`, both rehearsal and real | aligned, passes |
| AC-1335 | `test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused` | real `bin/deploy` | aligned, passes |
| AC-1336 | `test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_with_a_zero_exit` | real `smoke.mjs` process, transport replaced | aligned, passes |
| AC-1337 | `test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected` | `runSmoke` in-process + the real CLI for the exit status | aligned, passes |
| AC-1338 | `test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted` | `runSmoke` + `formatReport` + real CLI | aligned, passes |
| AC-1339 | `test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets` | real `referencedAssets` / `referencedFromCss` / `EXPECTED_CONTENT_TYPES` from `smoke.mjs`, pinned against the Worker's own `contentTypeFor` | aligned, passes |
| AC-1340 | `test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails` | `runSmoke` | aligned, passes |
| AC-1341 | `test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally` | every real `apps/*/wrangler.toml`, through `tests/support/wrangler-toml.ts` | aligned, passes |
| AC-1342 | `test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name` ✔read | file scan over the three commands, both hook READMEs and every `wrangler.toml`; **plus** the real `bin/deploy.d/secrets/10-anthropic-api-key` executed on both paths | aligned, passes — the behavioural half is genuinely run: value never echoed (`:1508`, `:1528`), command line carries only the name (`:1514`), stdin byte-equal with no trailing newline (`:1519`), rehearsal uploads nothing (`:1532`) |
| AC-1425 | `test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option` | `runSmoke` + real `smoke.mjs` process, multi-origin fetch incl. an unresolvable origin | aligned, passes |
| AC-1426 | `test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain` ✔read | real `tsc` over the real Worker tsconfig (`:369-372`) and over a minimal two-fixture pair differing by one specifier (`:444-457`); the chain half is the shared `typeProgramOf`/`chainTo` instrument, now in `tests/support/type-program.ts`, with its non-vacuity asserted (`:386-399`, `:468-475`) | aligned, passes — the instrument hoist did not weaken it |
| AC-1427 | `test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it` ✔read | `git ls-files` / `git check-ignore`, real `tsc` before and after generation, real `bin/build` copied into a fixture tree whose `1c`/`pnpm`/`npx` are recording shims | aligned, passes |
| AC-1454 | `test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives` ✔read | real `apps/control-app/wrangler.toml`, parsed by the file's own deliberately narrow `tables()` reader | aligned, passes — both `[observability]` blocks enabled at `head_sampling_rate = 1`, `[env.production]` still owns `name` and `routes`, and a negative control (`:138-153`) proves the parse can see the fault |
| AC-1455 | `test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count` ✔read | the same `parseWranglerConfig`/`missingFromEnv` reader AC-1341's check uses | aligned, passes — asserted as a set relation between levels, both non-empty (`:193-196`); negative control (`:219-241`) confirms the reader is not blind to unfamiliar tables |

**Consistency**: every one of the 18 tests drives the boundary its criterion is
stated about. No test asserts more than its AC claims — the one that did (AC-1331)
is finding 3.
**Coverage**: 18/18 active ACs have a substantive UAT, and 18/18 now have a
*passing* one. No AC is served only by a structural/AST check: the three rows that
read files rather than run a process (AC-1341, AC-1454, AC-1455) are criteria
*about* the deployment configuration, so the file is the artifact under test, and
each carries a negative control proving its reader can express the fault.
**Exclusivity within the matrix**: 18 distinct names, each appearing exactly once;
no two matrix UATs verify the same scenario in the same shape. Exclusivity
*across* the matrix and the surviving free-coded set is finding 2.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1331 (acceptance_criterion-ae2bb537) vs the other 17 ACs | ac-edit | `uat_coverage: pass` is set on AC-1331 and on no other AC in the story — REPORT-3672 action 2 set it as part of a `fix_structural_validation` cycle. The field is now differentially true where the underlying fact is not: all 18 criteria have a passing UAT as of this run, so a reader (or a downstream coverage check) seeing 1/18 populated would conclude the opposite of what the suite shows. `uat_coverage` is owned by the `check_uat_coverage` / `fix_uat_coverage` pair, not by this level's fix loop. | Leave the field to its owning workflow: either clear it back to unset on AC-1331 so the whole story is uniformly unpopulated and `check_uat_coverage` sets all 18 on its own pass, or let that workflow populate all 18. Do **not** hand-set the remaining 17 from this level to make the set uniform — that is the manufactured-progress shape this warning exists to prevent. Non-blocking: it misstates a bookkeeping field, not evidence. |
| 2 | warning | exclusivity | AC-1426's UAT and 3 others vs `test_UAT_FC_REQ-149_worker_type_program.test.ts`, `test_UAT_FC_BUG-37_observability.test.ts`, `test_UAT_FC_REQ-144_deploy_scripts.test.ts`, `test_UAT_FC_REQ-145_build_artifacts.test.ts` | uat-edit | Carried forward from REPORT-3671 finding 3, **half repaired**. The free-coded UATs the reconciled intents shipped with are still present alongside the AC-numbered set that superseded them, verifying the same scenarios in the same shape (`FC_REQ-144_deploy_scripts.test.ts` alone re-drives roughly twelve of AC-1330…AC-1342). Still not a violation — `test_UAT_FC_*` files carry no AC number and so are not matrix elements at this level. The *maintenance-hazard* half of the original finding is genuinely closed: `tests/support/type-program.ts` now holds the single copy of `FILESYSTEM_BOUND` / `filesystemBoundIn` / `withoutComments` / `resolveSpec` / `typeProgramOf` / `chainTo`, and both `reconciliation-platform-build-order-and-private-surface.test.ts:61` and `test_UAT_FC_REQ-149_worker_type_program.test.ts:6` import it — verified, the two module lists can no longer drift apart. What remains is the retirement question, which REPORT-3672 correctly forwarded rather than guessing. | Operator decision, unchanged: are `test_UAT_FC_*` files retired once the matrix takes ownership of their scenarios, or kept as a parallel set? Not classified `needs_review` because the ambiguity is a project test-retirement policy, not silence in the intent ledger about any behaviour — every behaviour both sets cover is settled and reconciled. Nothing here blocks this level. |
| 3 | info | consistency | AC-1331 + `tests/reconciliation-platform-build-deploy-smoke.test.ts:641-692` | — | REPORT-3671's violation is genuinely repaired, verified against current state rather than taken from REPORT-3672's claim. The over-asserting skip leg is now two legs. Half one (`:658-672`) keeps the hidden component and asserts only what the flag promises on such a tree — no `==> Preflight` header, the previous run's refusal gone, exit code **not** `EXIT_CODES.ENVIRONMENT`, and `==> Control-app assets` entered — with a comment at `:648-657` stating why exit 0 is deliberately not asserted. Half two (`:677-692`) runs the healthy real tree and asserts what "the remaining stages run normally" means: no preflight header, exit 0, one `pnpm\|`, one `npx\|` per discovered app, `Build complete.` Together they match AC-1331's Verification sentence ("Run it with the skip option under the same incomplete environment: the later stages proceed") without exceeding it. Both wrong repairs were avoided: `bin/build` is untouched, and nothing is skipped or deleted. | none |
| 4 | info | consistency | `tests/reconciliation-platform-build-order-and-private-surface.test.ts:15-21` | — | REPORT-3671's finding 2 is repaired. The header docblock now restates AC-1426 as the criterion does: the build names the **module** it cannot type, prints no import chain, nothing in the repository composes one, and the chain is the property's own instrument (`typeProgramOf`/`chainTo`, now cited at its new home in `tests/support/type-program.ts`) whose non-vacuity is asserted rather than assumed. `grep -rn "naming the import chain\|names the import chain"` across the tree returns nothing — the misattribution that cost two check cycles has no remaining occurrence. | none |
| 5 | info | exclusivity | AC-1337 vs AC-1339 / AC-1340 | — | Carried forward from REPORT-3669 finding 2 and REPORT-3671 finding 5, re-confirmed. Two of AC-1337's six breakages are re-driven by AC-1339 and AC-1340 through the same `runSmoke` engine. Prescribed by the AC bodies rather than introduced by the tests: AC-1337 enumerates the six breakages as its own subject, AC-1339/AC-1340 own the checks' internal semantics. Different question, same fixture; not a duplicate. | none |

## Notes for the Editor

**This level passes.** Zero violations, zero needs_review. Both blocking items
from the previous two cycles are closed and were re-verified against current state
rather than accepted from the fix report: the AC-1331 skip leg now asserts exactly
its criterion's claim, and the AC-1426 docblock misattribution is gone from the
whole tree.

**The two warnings are both bookkeeping, and neither should be fixed from this
level.** Finding 1 wants a field handed back to its owning workflow — the tempting
repair (setting `uat_coverage: pass` on the other 17 so the set looks uniform) is
exactly the manufactured-progress move to avoid, even though all 17 would today be
truthful. Finding 2 wants an operator's answer on test-retirement policy, not an
assessor's guess; its actionable half was already taken correctly.

**What was checked this pass and found sound, so a later pass need not redo it.**
The suites were run, not read — 18/18 green, one invocation, exit 0. The intent
ledger was re-read from the tickets rather than carried forward: all ten intents
are still `free_and_reconciled`, none retired, so no AC in this tree describes
behaviour intent has withdrawn. The instrument hoist introduced by REPORT-3672 was
checked for regression at the assertion level, not just by the green result:
AC-1426's non-vacuity guards, its type-only-edge assertion, and its two-fixture
compile pair all survive the move to `tests/support/type-program.ts`. The three
config-reading UATs (AC-1341, AC-1454, AC-1455) were re-examined for the
self-referential-evidence concern first raised in REPORT-3669 and remain
legitimate: each reads the real shipped file through the reader its criterion is
stated about, and each carries a negative control.

**Environment note for whoever runs this next.** In this worktree the suite emits
a wrangler `EPERM` writing its own debug log under
`~/Library/Preferences/.wrangler/logs/`. It is a sandbox artifact, not a failure —
the run exits 0. The build UATs also write `apps/*/dist` and run the real
`bin/1c assets` against the working tree, restoring only what was not there
before; that is pre-existing behaviour of AC-1331's first leg.
