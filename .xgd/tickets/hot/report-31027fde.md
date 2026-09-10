---
uid: report-31027fde
id: REPORT-3671
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T05:28:59.104732+00:00'
updated_at: '2026-09-10T05:28:59.104732+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: uat
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: CAP-102 (capability-5d07b533).
Attempt 2 (one fix cycle has run: REPORT-3670, `fix_structural_validation`,
commit `c0e58ccdb4`).

Matrix shape at this level: 1 story (STORY-119, `story_kind: upgrade`), 18 active
acceptance criteria, 18 UATs — exactly one `test_UAT_AC<n>_*` per AC, each name
appearing exactly once anywhere under `tests/`, `apps/`, `tools/`, `packages/`.
All three test files live under `tests/*.test.ts` and are therefore inside the
`node` vitest project (`vitest.node.config.mts:71` → `include: ['tests/**/*.test.ts']`).

**This check RAN the suites.** Unlike the previous pass (REPORT-3669), which was
read-only, all three files were executed. Result: **17 of 18 UATs pass, 1 fails
deterministically** — see finding 1.

| File | Result |
|---|---|
| `tests/reconciliation-platform-invocation-log-retention.test.ts` | 2 passed |
| `tests/reconciliation-platform-build-order-and-private-surface.test.ts` | 3 passed |
| `tests/reconciliation-platform-build-deploy-smoke.test.ts` | 12 passed, **1 failed** (AC-1331) |

## Cumulative Intent Considered

Every intent that touched this capability's tree is fully reconciled, so all of
them count. Statuses re-read this pass, not carried forward. Ordered by `created_at`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 (request-7bef34e0) | free_and_reconciled | 2026-08-15 | `bin/build` / `bin/deploy` / `bin/smoke`, the hook seam, the `[vars]` non-inheritance bug — the story's original 13 criteria (AC-1330…AC-1342) | YES |
| REQ-145 (request-b474390f) | free_and_reconciled | 2026-08-15 | control-app becomes the builder; the uncommitted generated artifacts the typecheck consumes (AC-1427); the `ACCESS_DEV_OPEN` local-development relaxation named as AC-1341's one exception | YES |
| REQ-146 (request-0cdfdc5b) | free_and_reconciled | 2026-08-15 | The runtime-import guard that AC-1426 exists because it is blind to type-only edges | YES (context) |
| REQ-147 (request-23fd6e61) | free_and_reconciled | 2026-08-15 | Cloudflare Access on the builder; the two control-surface live-origin checks (AC-1425) | YES |
| REQ-149 (request-554ac441) | free_and_reconciled | 2026-08-17 | Cloud publish; the type-only reach into node → AC-1426; the secret-hook decision table behind AC-1342 | YES |
| BUNDLE-19 (bundle-77b28def) | free_and_reconciled | 2026-08-18 | Story's `intent_uid`; reconciled AC-1330…AC-1342 | YES |
| BUG-36 (bug-db356ff8) | free_and_reconciled | 2026-08-23 | Fresh deployment 503s until publish runs — the live-state note in the story's Technical Context | YES |
| BUG-37 (bug-6612c4b7) | free_and_reconciled | 2026-08-24 | The 1102 diagnosis that motivated invocation-log retention → AC-1454, AC-1455 | YES |
| BUNDLE-20 (bundle-b3b7c399) | free_and_reconciled | 2026-08-24 | Reconciled AC-1425, AC-1426, AC-1427 | YES |
| BUNDLE-21 (bundle-78f4e2fe) | free_and_reconciled | 2026-08-26 | Story's `updated_by`; reconciled AC-1454, AC-1455 | YES |

No abandoned / deprecated / wont_fix intent touches this tree, and no AC in it is
deprecated, so there is no retired-behaviour half to this ledger. Step 2.5 (the
named-abandoned-vehicle case) therefore does not arise anywhere in this
capability, and no finding below rests on a stale citation.

## Alignment Ledger

Per active AC: its UAT, the boundary that UAT actually drives, and the outcome —
now including whether it **passes**, which the previous pass could not report.

| Element | UAT | Boundary actually driven | Outcome |
|---|---|---|---|
| AC-1330 | `test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one` | real `tools/generate/bin/1c.mjs preflight` process, with a `Module._resolveFilename` hook making one component genuinely unresolvable | aligned, **passes** — both halves reported, browser/server distinguished, `EXIT_CODES.ENVIRONMENT` (6) asserted distinct from INTERNAL, remedy names `SHARED_STORE_INSTALL_COMMAND` |
| AC-1331 | `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight` | real `bin/build` against the real repo (pnpm/npx are recording shims, `bin/1c` is the real one) | **gap — the UAT FAILS. See finding 1.** Its first three legs are aligned and pass; the `--skip-preflight` leg cannot pass |
| AC-1332 | `test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation` | real `bin/deploy` in a fixture tree, rehearsal vs real compared line for line | aligned, passes — hook sequences identical but for `dry=`, invocation differs by `--dry-run` alone, `(rehearsed, not uploaded)` vs `Now prove it serves: bin/smoke` |
| AC-1333 | `test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context` | real `bin/deploy` | aligned, passes — sorted, migrate-then-secrets, `indexOf('npx') === length-1`, full context incl. `DEPLOY_WORKER_NAME != app dir`, real `bin/deploy.d/*/README.md` confirmed mode 0644 |
| AC-1334 | `test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded` | real `bin/deploy`, both rehearsal and real | aligned, passes — no `npx\|` line recorded, hook output surfaced, clean-tree control |
| AC-1335 | `test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused` | real `bin/deploy` | aligned, passes — default-all, named-one, explicit `--env`, unknown app refused before any hook, dangling `--env` refused |
| AC-1336 | `test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_with_a_zero_exit` | real `tools/generate/bin/smoke.mjs` process, transport replaced | aligned, passes — nine PASS, exactly two named skips, summary counts them separately, asset count > 0 |
| AC-1337 | `test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected` | `runSmoke` in-process + the real CLI for the exit status | aligned, passes — all six named breakages, each failing exactly its owning check, non-empty detail, remaining checks still report |
| AC-1338 | `test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted` | `runSmoke` + `formatReport` + real CLI | aligned, passes — no-slug and slug-without-draft both covered, reasons name the missing option, zero exit |
| AC-1339 | `test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets` | real `referencedAssets` / `referencedFromCss` / `EXPECTED_CONTENT_TYPES` from `smoke.mjs`, pinned against `apps/public-site/src/content-type`'s `contentTypeFor` | aligned, passes — exclusions, css nesting genuinely fetched, bare page fails, `--max-assets` bound fails rather than passing silently, table agreement asserted per extension |
| AC-1340 | `test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails` | `runSmoke` | aligned, passes — identical case, body leak, status leak, and the published "nothing to compare" pass |
| AC-1341 | `test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally` | every real `apps/*/wrangler.toml`, parsed by `tests/support/wrangler-toml.ts` | aligned, passes — real tree clean, the exact shipped-before-the-fix config reported missing `BUILDER_ORIGIN` + `r2_buckets:SITES`, an invented binding kind found structurally, the `ACCESS_DEV_OPEN` exception proved exactly one variable wide, `workers_dev` / `observability` proved invisible to both counted sets |
| AC-1342 | `test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name` | file scan over the three commands, both hook READMEs and every `wrangler.toml`; **plus** the real `bin/deploy.d/secrets/10-anthropic-api-key` executed on both paths | aligned, passes — the behavioural half is run, not read: value never echoed, `secret put` command line carries only the name, stdin captured raw and byte-equal (no trailing newline), rehearsal uploads nothing |
| AC-1425 | `test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option` | `runSmoke` + real `smoke.mjs` process, multi-origin fetch incl. a throwing (unresolvable) origin | aligned, passes — all three protected forms pass, the unconfigured form's detail says "no challenge was proved", both exposures fail naming their own door, both skip by option name, neither axis fails the other |
| AC-1426 | `test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_and_this_walk_names_the_chain` | real `tsc` over the real Worker tsconfig and over a minimal fixture; the chain half is the test file's own `typeProgramOf` / `chainTo` BFS, **and the criterion now says so** | aligned, passes — REPORT-3669's finding 1 is genuinely repaired (finding 4 below). Minor residue: finding 2 |
| AC-1427 | `test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it` | `git ls-files` / `git check-ignore`, real `tsc` before and after generation, real `bin/build` in a fixture tree | aligned, passes — artifacts confirmed untracked and ignored, ordering asserted in both the printed stages and the recorded shim log, failing preflight halts before `1c assets` |
| AC-1454 | `test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives` | real `apps/control-app/wrangler.toml`, parsed | aligned, passes — both `[observability]` blocks enabled at `head_sampling_rate = 1`; `[env.production]` still owns `name` and `routes`; negative control (retention hoisted above the route list) proves the parse can see the fault |
| AC-1455 | `test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count` | the same reader AC-1341's check uses | aligned, passes — asserted as a set relation between levels (both non-empty, identical) rather than a frozen snapshot; negative control confirms the reader is not blind to unfamiliar tables |

Coverage: 18/18 active ACs have a UAT; **17/18 have a *passing* one**.
Exclusivity within the matrix: 18 distinct names, each appearing exactly once; no
two matrix UATs verify the same scenario in the same shape. Exclusivity **across**
the matrix and the surviving free-coded UAT set is finding 3.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1331 (acceptance_criterion-ae2bb537) + `tests/reconciliation-platform-build-deploy-smoke.test.ts:641-660` | uat-edit | **The UAT fails deterministically** (re-run twice in isolation), so AC-1331 has no passing evidence. Its fourth leg — "the check can be explicitly skipped" — reuses the *crippled* environment from the previous leg: `UAT_HIDDEN_SPECS: ["@lagrangefoundry/webui-shell"]` plus `NODE_OPTIONS: --import <hide-hook>` (lines 645-649), which hides that component from every node process in the tree. It then asserts `expect(proceeded.code).toBe(0)` (line 653). But `--skip-preflight` skips *only* the preflight — `bin/build:87-90` gates `step "Preflight"` on it and nothing else — while the very next stage, `step "Control-app assets"` → `bin/1c assets` (`bin/build:98-99`, the stage AC-1427 owns), is unconditional and needs the same hidden component. Actual output: `==> Control-app assets` then `@lagrangefoundry/webui-shell is not installed`, exit 1. This is environment-independent: on any machine where the test's *first* leg passes (webui-shell resolvable — it does pass here, asserting exit 0 at line 595), the skip leg must fail, because it differs only by hiding a component a non-skippable stage requires; and on a machine where webui-shell is genuinely absent, the first leg fails instead. The criterion does **not** ask for what the test asserts: AC-1341's sibling wording aside, AC-1331 says "the remaining stages **run normally**" and its Verification says "the later stages **proceed**" — neither claims the build exits zero on a tree that is still deliberately incomplete. The over-assertion is the test's, not the AC's, and `bin/build` behaves as the criterion describes. The stage that breaks the assumption (`Control-app assets`) was reconciled into the matrix later, by BUNDLE-20 as AC-1427, which is why this leg's premise went stale unnoticed. | Repair the leg so it proves what AC-1331 actually claims. Either (a) drop the crippling from this leg — run `bin/build --skip-preflight` on the healthy real tree and assert `proceeded.out` does **not** contain `==> Preflight` while the later stages did run (the existing `pnpm\|`/`npx\|` shim-count assertions at lines 654-655 already carry that), or (b) keep the hidden component and assert only that the preflight stage did not run and the assets stage was *entered*, dropping the `code === 0` assertion. Do **not** "fix" this by making `--skip-preflight` also skip `1c assets`: no intent in this ledger asks for that, and AC-1427 requires the generation stage to run before the typecheck. |
| 2 | warning | consistency | `tests/reconciliation-platform-build-order-and-private-surface.test.ts:15-16` | uat-edit | Residue of REPORT-3669's finding 1. The file's header docblock still summarises AC-1426 as "the build refuses a Worker whose TYPE program reaches a filesystem-bound module, **naming the import chain that got there**" — the exact misattribution the fix cycle corrected in AC-1426's title and body, in STORY-119's Description and Reconciliation Decision 4, in the UAT's own name, and in the inline comment at line 536. Commit `c0e58ccdb4` changed the name and the inline comment in this file but not its header, so the file now contradicts the criterion it opens by summarising. The build prints no chain — `bin/build:101-102` is `pnpm -r build` → `tsc --noEmit`, and `grep -rn "import chain\|shortest chain" bin tools apps packages` returns nothing. | In the docblock, restate AC-1426 as the criterion now does: the build fails **naming the module it cannot type**, and the shortest import chain is this file's own `typeProgramOf`/`chainTo` instrument (lines 395-437), whose non-vacuity is asserted rather than assumed. |
| 3 | warning | exclusivity | AC-1426's UAT vs `tests/test_UAT_FC_REQ-149_worker_type_program.test.ts` (and the wider free-coded set) | uat-edit | The free-coded UATs the reconciled intents shipped with are still present alongside the AC-numbered set that superseded them, verifying the same scenarios in the same shape. The clearest case is exact: `test_UAT_FC_REQ-149_control_app_type_program_reaches_no_node_only_module` + `test_UAT_FC_REQ-149_the_walk_would_notice_if_the_seam_were_undone` are the first two blocks of `test_UAT_AC1426_*` (lines 451-476), with the instrument copy-pasted — `NODE_ONLY` (FC, lines 40-50) and `FILESYSTEM_BOUND` (AC, lines 360-370) are the same nine modules, and `withoutComments`, `resolveSpec`, `typeProgramOf`, `chainTo` are duplicated near-verbatim. AC-1426's UAT strictly subsumes both. The pattern repeats: `test_UAT_FC_BUG-37_observability.test.ts` (4 tests) covers AC-1454/AC-1455; `test_UAT_FC_REQ-144_deploy_scripts.test.ts` (13 tests) covers roughly twelve of AC-1330…AC-1342 — `..._named_environments_repeat_every_top_level_var_and_binding` / `..._inheritance_guard_catches_the_config_that_shipped` / `..._control_app_production_carries_what_it_cannot_run_without` (AC-1341), `..._a_failing_hook_aborts_the_deploy_before_upload` (AC-1334), `..._hook_directories_ignore_non_executable_files` (AC-1333), `..._no_secret_value_is_committed_or_echoed` (AC-1342), `..._smoke_content_types_agree_with_the_worker` / `..._asset_discovery_follows_document_relative_references` (AC-1339), `..._smoke_passes_against_a_correct_origin` (AC-1336), `..._smoke_fails_naming_the_assertion` (AC-1337), `..._smoke_reports_untested_checks_as_skipped` (AC-1338), `..._preflight_refuses_a_missing_shared_component` (AC-1330); and `test_UAT_FC_REQ-145_build_artifacts.test.ts` repeats AC-1341's rule and its `ACCESS_DEV_OPEN` exception. Not a violation — `test_UAT_FC_*` files carry no AC number and so are not matrix elements at this level — but a live maintenance hazard: two copies of the filesystem-bound module list means the next store file added to one goes stale in the other, against the coding standard's one-authoritative-location rule. | Confirm the project's post-reconciliation policy for free-coded UATs before deleting anything. If retirement is the policy, `test_UAT_FC_REQ-149_worker_type_program.test.ts` is the safe first candidate: AC-1426's UAT covers every assertion it makes and adds the compile-fixture pair. If both sets are to be kept, at minimum hoist the shared instrument (module list + walk) into `tests/support/` so there is one definition site, as `tests/support/wrangler-toml.ts` already does for the TOML reader. |
| 4 | info | consistency | AC-1426 (acceptance_criterion-f82419a7) + STORY-119 (story-d5167ced) | — | REPORT-3669's finding 1 is genuinely repaired, verified against current state rather than taken from REPORT-3670's claim. AC-1426's title and body now attribute only "names the module it cannot type" to the build, state explicitly that it prints no chain and that nothing in the repository composes one, and re-site the type-program walk as the property's own instrument with the non-vacuity guard attached to it. STORY-119 carries the matching correction at body lines 47, 141 and 271-275, including a dated "*Corrected 2026-09-09*" note preserving Decision 4's placement call. The UAT was renamed to `..._and_this_walk_names_the_chain` and its inline comment rewritten. The test passes. | none |
| 5 | info | exclusivity | AC-1337 vs AC-1339 / AC-1340 | — | Carried forward from REPORT-3669 finding 2 and re-confirmed. Two of AC-1337's six breakages (a font served as `application/octet-stream`; a 404 body naming the unpublished site) are re-driven by AC-1339 and AC-1340 through the same `runSmoke` engine. This is prescribed by the AC bodies rather than introduced by the tests — AC-1337 enumerates the six breakages as its own subject, while AC-1339/AC-1340 own the checks' internal semantics. Different question, same fixture; not a duplicate. | none |

## Notes for the Editor

**Finding 1 is the only thing blocking this level, and it is a test-fixture bug,
not a code bug and not matrix drift.** `bin/build` does what AC-1331 describes.
The UAT asserts something stronger than the criterion — that a deliberately
crippled tree builds clean once the preflight is skipped — which was true when
BUNDLE-19 wrote it and stopped being true when BUNDLE-20 reconciled the
`Control-app assets` stage as AC-1427. Resist two tempting wrong repairs: making
`--skip-preflight` skip the assets stage (no intent asks for it, and AC-1427
forbids it), and marking the test skipped (that removes AC-1331's evidence
entirely rather than repairing it).

**Reproduction, for the fixer.** `npm test -- tests/reconciliation-platform-build-deploy-smoke.test.ts -t "AC1331"`
fails at line 653 in ~3s. The other twelve in that file, and all five in the
other two files, pass. Note the suite writes `apps/*/dist` and runs the real
`bin/1c assets` against the working tree; that is pre-existing behaviour of the
first leg and is not part of this finding.

**Findings 2 and 3 are both about the same underlying habit** — an artefact of
reconciliation left behind after the matrix took ownership. Finding 2 is a
sentence in a header; finding 3 is a whole parallel test set. Neither invalidates
evidence, and neither affects pass/fail. If only one is taken opportunistically,
take finding 2: it is a two-line edit and it closes the last occurrence of a
misattribution that has now cost two check cycles.

**What was checked and found sound, so a later pass need not redo it.** The three
categories of self-referential evidence flagged by REPORT-3669 were re-examined
and remain legitimate: AC-1341/AC-1455 read the real `apps/*/wrangler.toml`
through `tests/support/wrangler-toml.ts` — which *is* the check those criteria
describe, with negative controls (the shipped pre-fix config, an invented binding
kind, retention hoisted above the routes) proving the reader can express the
fault; AC-1454 uses a deliberately narrower second reader (`tables()`) because
its question is "which table does `routes` belong to", stated in the file header
with its own negative control; and AC-1426's `typeProgramOf`/`chainTo` is the
same shape and is now *declared* as the criterion's instrument, which is what
finding 1 of the previous report asked for.
