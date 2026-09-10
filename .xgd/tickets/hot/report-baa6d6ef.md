---
uid: report-baa6d6ef
id: REPORT-3669
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=uat)'
created_by: xgd
created_at: '2026-09-10T05:17:17.235090+00:00'
updated_at: '2026-09-10T05:17:17.235090+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: uat
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: CAP-102 (capability-5d07b533).
Matrix shape at this level: 1 story (STORY-119, `story_kind: upgrade`), 18 active
acceptance criteria, 18 UATs — exactly one per AC, no duplicates, all three test
files under `tests/*.test.ts` and therefore inside the `node` vitest project
(`vitest.node.config.mts` → `include: ['tests/**/*.test.ts']`).

## Cumulative Intent Considered

Every intent that touched this capability's tree is fully reconciled, so all of
them count. Ordered by `created_at`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 (request-7bef34e0) | free_and_reconciled | 2026-08-15 | `bin/build` / `bin/deploy` / `bin/smoke`, the hook seam, the `[vars]` non-inheritance rule — the story's original 13 criteria (AC-1330…AC-1342) | YES |
| REQ-145 (request-b474390f) | free_and_reconciled | 2026-08-15 | control-app becomes the builder; the uncommitted generated artifacts the typecheck consumes (AC-1427); the `ACCESS_DEV_OPEN` local-development relaxation named as AC-1341's one exception | YES |
| REQ-146 (request-0cdfdc5b) | free_and_reconciled | 2026-08-15 | The runtime-import guard that AC-1426 exists because it is blind to type-only edges | YES (context) |
| REQ-147 (request-23fd6e61) | free_and_reconciled | 2026-08-15 | Cloudflare Access on the builder; the two control-surface live-origin checks (AC-1425) | YES |
| REQ-149 (request-554ac441) | free_and_reconciled | 2026-08-17 | Cloud publish; **§"`bin/build` failed on a type-only reach into node"** → AC-1426; the secret-hook decision table behind AC-1342 | YES |
| BUG-36 (bug-db356ff8) | free_and_reconciled | 2026-08-23 | Records the control app deployed and `app.1stcontact.io` answering 302 to the identity provider — the live-state note in the story's Technical Context | YES |
| BUG-37 (bug-6612c4b7) | free_and_reconciled | 2026-08-24 | The 1102 diagnosis that motivated invocation-log retention → AC-1454, AC-1455 | YES |
| BUNDLE-19 (bundle-77b28def) | free_and_reconciled | 2026-08-18 | Story's `intent_uid`; reconciled AC-1330…AC-1342 | YES |
| BUNDLE-20 (bundle-b3b7c399) | free_and_reconciled | 2026-08-24 | Reconciled AC-1425, AC-1426, AC-1427 (Reconciliation Decisions 1–4) | YES |
| BUNDLE-21 (bundle-78f4e2fe) | free_and_reconciled | 2026-08-26 | Story's `updated_by`; reconciled AC-1454, AC-1455 (Decisions 5–7) | YES |

No abandoned / deprecated / wont_fix intent touches this tree, and no AC in it is
deprecated, so there is no retired-behaviour half to this ledger.

## Alignment Ledger

Per active AC: the UAT that evidences it, the boundary that UAT actually drives,
and the outcome. "Real entry point" means the shipped artifact is executed or
parsed — not a description of it.

| Element | UAT | Boundary actually driven | Outcome |
|---|---|---|---|
| AC-1330 | `test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one` | real `tools/generate/bin/1c.mjs preflight` process, with a `Module._resolveFilename` hook making one component genuinely unresolvable | aligned — both halves reported, browser/server distinguished, `EXIT_CODES.ENVIRONMENT` (6) asserted distinct from INTERNAL, remedy names `SHARED_STORE_INSTALL_COMMAND` |
| AC-1331 | `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight` | real `bin/build` against the real repo (pnpm/npx are recording shims) | aligned — discovery == `apps/*/wrangler.toml`, every bundle `--env production`, preflight-first ordering, `--skip-preflight`, empty-tree refusal, exit-6 propagation |
| AC-1332 | `test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation` | real `bin/deploy` in a fixture tree, rehearsal vs real compared line for line | aligned — hook sequences identical but for `dry=`, invocation differs by `--dry-run` alone, `(rehearsed, not uploaded)` vs `Now prove it serves: bin/smoke` |
| AC-1333 | `test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context` | real `bin/deploy` | aligned — sorted, migrate-then-secrets, `indexOf('npx') === length-1`, full context asserted incl. `DEPLOY_WORKER_NAME != app dir`, real `bin/deploy.d/*/README.md` confirmed mode 0644 |
| AC-1334 | `test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded` | real `bin/deploy`, both rehearsal and real | aligned — no `npx\|` line recorded, hook output surfaced, clean-tree control |
| AC-1335 | `test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused` | real `bin/deploy` | aligned — default-all, named-one, explicit `--env`, unknown app refused before any hook, dangling `--env` refused |
| AC-1336 | `test_UAT_AC1336_every_applicable_check_passes_and_each_skip_is_named_with_a_zero_exit` | real `tools/generate/bin/smoke.mjs` process, transport replaced | aligned — nine PASS, exactly two named skips, summary counts them separately, asset count > 0 |
| AC-1337 | `test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected` | `runSmoke` in-process + the real CLI for the exit status | aligned — all six named breakages, each failing exactly its owning check, non-empty detail, remaining checks still report |
| AC-1338 | `test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted` | `runSmoke` + `formatReport` + real CLI | aligned — no-slug and slug-without-draft both covered, reasons name the missing option, zero exit |
| AC-1339 | `test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets` | real `referencedAssets` / `referencedFromCss` / `EXPECTED_CONTENT_TYPES` from `smoke.mjs`, pinned against `apps/public-site/src/content-type`'s `contentTypeFor` | aligned — exclusions, css nesting genuinely fetched, bare page fails, `--max-assets` bound fails rather than passing silently, table agreement asserted per extension |
| AC-1340 | `test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails` | `runSmoke` | aligned — identical case, body leak, status leak, and the published "nothing to compare" pass |
| AC-1341 | `test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally` | every real `apps/*/wrangler.toml`, parsed by `tests/support/wrangler-toml.ts` | aligned — real tree clean, the exact shipped-before-the-fix config reported missing `BUILDER_ORIGIN` + `r2_buckets:SITES`, an invented binding kind found structurally, the `ACCESS_DEV_OPEN` exception proved exactly one variable wide, and `workers_dev` / `observability` proved invisible to both counted sets |
| AC-1342 | `test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name` | file scan over the three commands, both hook READMEs and every `wrangler.toml`; **plus** the real `bin/deploy.d/secrets/10-anthropic-api-key` executed on both paths | aligned — the behavioural half is run, not read: value never echoed, `secret put` command line carries only the name, stdin captured raw and byte-equal to the value (no trailing newline), rehearsal uploads nothing |
| AC-1425 | `test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option` | `runSmoke` + real `smoke.mjs` process, multi-origin fetch incl. a throwing (unresolvable) origin | aligned — all three protected forms pass, the unconfigured form's detail says "no challenge was proved", both exposures fail naming their own door, both skip by option name, neither axis fails the other |
| AC-1426 | `test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_naming_the_chain` | real `tsc` over the real Worker tsconfig and over a minimal fixture; **the import-chain half is produced by the test file's own `typeProgramOf` / `chainTo` BFS** | **gap — see finding 1** |
| AC-1427 | `test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it` | `git ls-files` / `git check-ignore`, real `tsc` before and after generation, real `bin/build` in a fixture tree | aligned — artifacts confirmed untracked and ignored, ordering asserted in both the printed stages and the recorded shim log, failing preflight halts before `1c assets` |
| AC-1454 | `test_UAT_AC1454_retention_is_declared_unsampled_for_both_environments_and_the_route_survives` | real `apps/control-app/wrangler.toml`, parsed | aligned — both `[observability]` blocks enabled at `head_sampling_rate = 1`; `[env.production]` still owns `name` and `routes`; negative control (retention hoisted above the route list) proves the parse can see the fault |
| AC-1455 | `test_UAT_AC1455_retention_is_invisible_to_the_environment_repetition_binding_count` | the same reader AC-1341's check uses | aligned — asserted as a set relation between levels (both non-empty, identical) rather than a frozen snapshot, exactly as the criterion requires; negative control confirms the reader is not blind to unfamiliar tables |

Coverage: 18/18 active ACs have a substantive UAT. Exclusivity: 18 distinct test
names, each appearing exactly once across `tests/`; no two UATs verify the same
scenario in the same shape.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1426 (acceptance_criterion-f82419a7) + `tests/reconciliation-platform-build-order-and-private-surface.test.ts:440` | ac-edit | AC-1426 attributes the import-chain naming to **the build** ("The build refuses … and **names the import chain that got there**"; "On a violation it fails and **reports the shortest chain from the entry point to the offending module**"). The build does not do this. `bin/build`'s typecheck stage is `pnpm -r build`, and `apps/control-app/package.json:7` defines that as `tsc --noEmit`; there is no walker anywhere in `bin/`, `tools/`, `apps/` or `packages/`. Reproducing the criterion's own scenario (a type imported from a module that re-exports it while importing `node:fs`, under `types: []`) makes `tsc` exit 2 with `loadSite.ts(1,16): error TS2591: Cannot find name 'node:fs'` — the **offending module**, never the chain from the Worker entry point. The UAT's chain assertions (`chainTo(offendingGraph, …)` → `['worker.ts','loadSite.ts']`, lines 537–544) run against the test file's own `typeProgramOf`/`chainTo` BFS (lines 395–437), so that half of the criterion is evidenced by the test asserting on itself. REQ-149 (free_and_reconciled, 2026-08-17) says where the walk actually belongs: "**A UAT now walks type-only imports too**, from the Worker entrypoints outward, and fails on any that reach a node-only module. It was confirmed to fail against the pre-fix specifier, naming the chain" — and states the ask as criterion 12, a repository property ("No module reachable from a Worker entrypoint imports a node-only module, including through a type-only import"), not a `bin/build` feature. | Restate AC-1426 so the two halves sit where the intent and the implementation put them: (a) the **build's** observable outcome is that it fails and names the offending node-only module — which is what `tsc` does and what the UAT already drives; (b) the **type-program walk from each Worker entry point, and the shortest import chain it reports**, is the UAT's own instrument, whose non-vacuity (reaches known modules, records at least one type-only edge) is the criterion's guard against a walk that proves nothing. Keep the rest verbatim — the reason the walk must exist (a bundler erases a type-only import, `tsc` does not, so REQ-146's runtime-import guard is structurally blind) is accurate and load-bearing. Do **not** "fix" this by editing the UAT to assert a chain in `bin/build`'s output: no such output exists, and manufacturing it is production work no intent in this ledger asks for. |
| 2 | info | exclusivity | AC-1337 vs AC-1339 / AC-1340 | — | Two of AC-1337's six breakages (a font served as `application/octet-stream`; a 404 body naming the unpublished site) are re-driven by AC-1339 and AC-1340 in the same shape, through the same `runSmoke` engine. This is prescribed by the AC bodies rather than introduced by the tests — AC-1337 enumerates the six breakages as its own subject ("the failure list contains exactly the check that owns that breakage") while AC-1339/AC-1340 own the checks' internal semantics. Different question, same fixture; not a duplicate under the exclusivity rule. | none |

## Notes for the Editor

**Finding 1 is a wording overreach, not a missing capability.** The behaviour
REQ-149 asked for is implemented and substantively tested; only the *attribution*
in the matrix is wrong. Two places carry the same sentence and should be corrected
together, or the next check will re-derive this:

1. AC-1426's Criterion and Verification sections (the wording is the finding).
2. **STORY-119's body** — the Description paragraph "Build — and one refusal a
   bundle graph cannot see" ends "The build therefore refuses a Worker whose type
   program reaches a filesystem-bound module, **walking every import the
   typechecker does and naming the import chain that got there**", and
   Reconciliation Decision 4 restates it as "an observable build outcome — the
   build fails and names the import chain". Decision 4's *placement* call (this is
   a build criterion of STORY-119, not a Worker-portability one) is sound and
   should stand; only its characterisation of what the build emits needs the same
   correction. That is a `story-body-edit` riding along with the `ac-edit`.

**What was checked and found sound, so a later pass need not redo it.** Three
categories of self-referential evidence were looked for specifically, since this
capability's criteria are unusually often *about* a check:

- AC-1341 / AC-1455 read `apps/*/wrangler.toml` through `tests/support/wrangler-toml.ts`.
  That reader **is** the check the criteria describe — no production counterpart is
  claimed by either AC — and both UATs carry negative controls (the exact shipped
  pre-fix config; an invented binding kind; retention hoisted above the routes)
  that prove the reader can express the fault it is asserting the absence of.
  Legitimate.
- AC-1454 uses a second, deliberately narrower TOML reader (`tables()`) because
  its question is "which table does `routes` belong to", which the repetition
  check's reader does not answer. The file header states the split and the reason;
  the negative control makes it non-vacuous. Legitimate.
- AC-1426's `typeProgramOf`/`chainTo` are the same shape — a test-side
  instrument — and would be equally legitimate **if the criterion said so**. It
  does not; it says the build does it. That difference is the whole of finding 1.

**Not run.** This check is read-only and did not execute the three suites. The one
production claim that mattered to a finding was verified directly instead: the
offending fixture from AC-1426's own Verification section was rebuilt and compiled
with `apps/control-app/node_modules/.bin/tsc`, and its output is quoted in the
finding.
