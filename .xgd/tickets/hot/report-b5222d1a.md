---
uid: report-b5222d1a
id: REPORT-2459
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=uat)'
created_by: xgd
created_at: '2026-08-20T15:22:34.351581+00:00'
updated_at: '2026-08-20T15:22:34.351581+00:00'
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

## Cumulative Intent Considered

CAP-102 has exactly one story (STORY-119, `story_kind=feature`), whose `intent_uid` is
BUNDLE-19. No matrix element under this capability carries an `updated_by` chain — this is a
first-reconciliation tree, created 2026-08-20, and no later intent has revised it.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 (`request-7bef34e0`) — "Build, deploy and smoke-test scripts, and the `[vars]` inheritance bug behind the production 503" | free_and_reconciled | created 2026-08-15, free-coded `cd6f00c6e` → `4fb1e2a5f` | `bin/build` (with the new `1c preflight`), `bin/deploy` (dry-run as a target; migrate/secret hooks), `bin/smoke` (nine live-origin checks), the `[env.production]` inheritance guard, and a documented never-committed secret mechanism | **YES** |
| BUNDLE-19 (`bundle-77b28def`) | free_and_reconciled | created 2026-08-18, merged at `b18b859d` | Bundles REQ-144 (plus REQ-123/131/133/139/140/141/142 and BUG-35, none of which touch this capability). Recorded as STORY-119's `intent_uid` | **YES** |
| REQ-145 (`request-b474390f`) — "control-app becomes the builder … proxy deleted" | ready_to_reconcile | 2026-08-15 | Does not touch this capability's tree. Will make the `dist/` bundle a genuinely-consumed artifact rather than evidence, and is the ticket that turns REQ-144's honest bad-gateway into a working origin | imminent — **no** current claim here |
| REQ-147 (`request-23fd6e61`) — "The builder is private: Cloudflare Access" | reconciling | 2026-08-15 | `depends_on` REQ-144; owns the DNS record and the first control-app deploy. STORY-119 explicitly puts both out of scope | imminent — **no** current claim here |
| REQ-143 / REQ-146 | ready_to_reconcile | 2026-08-15 | Each adds a *file* to a hook directory; STORY-119 owns the seam, not the hooks. Explicitly out of scope | imminent — **no** current claim here |

Cumulative picture: one active intent (REQ-144, via BUNDLE-19), no retirements, no
supersessions. Every behaviour REQ-144 asked for is expressed in AC-1330…AC-1342, and the two
things REQ-144 records as *outstanding* (the live secret push; CI wired to `bin/build`) are
correctly absent from the AC set rather than silently claimed — AC-1342 is written about what is
observable (nothing committed, nothing echoed), which is the honest form.

## Alignment Ledger

All 13 ACs are `status=active`, `kind=behavior`, `regression_only=false`. Every one has exactly
one UAT, all in `tests/reconciliation-platform-build-deploy-smoke.test.ts` (one `it` per AC, no
AC covered twice, no AC uncovered).

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1330 | `test_UAT_AC1330_reports_every_component_and_package_then_refuses_naming_the_absent_one` | REQ-144 | aligned — spawns the real `1c.mjs preflight` under a module-resolution hook; asserts both halves reported, browser vs server surface distinguished, `EXIT_CODES.ENVIRONMENT` (6) ≠ `INTERNAL`, and `SHARED_STORE_INSTALL_COMMAND` named |
| AC-1331 | `test_UAT_AC1331_build_bundles_every_discovered_worker_against_production_after_preflight` | REQ-144 | aligned — runs the real `bin/build` against the real tree with `pnpm`/`npx` shimmed; asserts stage order, `--env production` on every bundle, discovery = `apps/*/wrangler.toml`, `--skip-preflight`, empty-tree refusal, exit-code propagation |
| AC-1332 | `test_UAT_AC1332_rehearsal_runs_the_same_hooks_and_composes_the_same_invocation` | REQ-144 | aligned — compares a rehearsal and a real deploy of the same fixture app; hook lines equal modulo `dry=`, invocation equal modulo the appended `--dry-run` |
| AC-1333 | `test_UAT_AC1333_executable_hooks_run_sorted_before_the_upload_with_the_deploy_context` | REQ-144 | aligned — sorted order, migrate-then-secrets, all six context variables (incl. `DEPLOY_WORKER_NAME` deliberately ≠ directory name), non-executable ignored, "(no … hooks)", and the real `bin/deploy.d/*/README.md` mode asserted `0o111 == 0` |
| AC-1334 | `test_UAT_AC1334_a_failing_hook_aborts_that_app_before_anything_is_uploaded` | REQ-144 | aligned — asserted in *both* the rehearsal and the real path; abort proven by the absence of any `npx\|` shim line, not by message order |
| AC-1335 | `test_UAT_AC1335_targets_default_to_every_discovered_app_and_an_unknown_one_is_refused` | REQ-144 | aligned — all/named/unknown, default and explicit `--env`, dangling `--env`; unknown refused with an empty shim log (before any hook) |
| AC-1336 | `test_UAT_AC1336_all_nine_checks_pass_with_nothing_skipped_and_the_command_exits_zero` | REQ-144 | aligned — drives the real `smoke.mjs` **process** with its transport replaced; all nine `NINE_CHECKS` pass, exit 0, summary `9 passed, 0 skipped.`, asset count > 0 |
| AC-1337 | `test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected` | REQ-144 | aligned with a gap — all six breakages present, each isolating exactly the owning check, other checks still reporting; the "what it expected" half is under-asserted (finding 1) |
| AC-1338 | `test_UAT_AC1338_missing_inputs_are_reported_skipped_with_the_reason_and_counted` | REQ-144 | aligned — no-slug and no-draft cases, `--slug`/`--draft` named in the skip detail, `2 passed, 7 skipped.` / `4 passed, 5 skipped.`, exit 0 |
| AC-1339 | `test_UAT_AC1339_same_origin_assets_are_checked_including_one_level_into_stylesheets` | REQ-144 | aligned; the AC's own verification prose is off by one (finding 2). Test covers exclusions, the CSS-nested font genuinely fetched, the bare-page failure, `--max-assets` exhaustion as a failure, and pins `EXPECTED_CONTENT_TYPES` to `contentTypeFor` |
| AC-1340 | `test_UAT_AC1340_unpublished_and_unknown_answer_identically_and_a_difference_fails` | REQ-144 | aligned — body-difference, status-difference, and the published "nothing to compare" pass, each with the message the AC names |
| AC-1341 | `test_UAT_AC1341_named_environments_repeat_top_level_vars_and_bindings_found_structurally` | REQ-144 | aligned — every `apps/*/wrangler.toml` × every named env; then the *pre-fix* control-app TOML fed back in, reporting `BUILDER_ORIGIN` and `r2_buckets:SITES`; structural discovery proven with an invented binding kind |
| AC-1342 | `test_UAT_AC1342_no_credential_shape_is_committed_and_the_documented_push_echoes_only_the_name` | REQ-144 | aligned — static by nature, which is the right shape for this criterion; three credential shapes over the three commands, both hook READMEs and every `wrangler.toml`, plus the piped/newline-free/name-only assertions on the documentation and on `bin/deploy` |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1337 / `test_UAT_AC1337_each_breakage_fails_naming_the_check_and_what_it_expected` (`tests/reconciliation-platform-build-deploy-smoke.test.ts:943`) | uat-edit | AC-1337 requires each failure to carry "a non-empty explanation of **what was expected versus what was seen**", and its Verification says the detail must "describe the expectation". The six-breakage loop asserts only `expect(failure.detail.length).toBeGreaterThan(0)` — a detail of `"x"` would satisfy it. The stronger form is already used elsewhere in the same file (AC-1339 asserts the detail contains `fonts/x.woff2` and `font/woff2`), so this is an under-assertion, not a missing capability | Give each breakage row an expected-substring (e.g. the status code, the header name, or the content type it should have had) and assert `failure.detail` contains it, as AC-1339's test already does |
| 2 | warning | consistency | AC-1339 (`acceptance_criterion-2e6c1d2d`) | ac-edit | The AC's Verification enumerates six references — "a stylesheet, a script, an image, a fragment link, an inline data image and an off-origin script" — of which only **three** are same-origin, then asserts "exactly **the four** same-origin assets are queued". The UAT is the correct one: it also supplies an inline-style `background:url(./bg.png)` and expects four (`app.js`, `assets/logo.svg`, `bg.png`, `theme.css`). The AC prose omits the fourth reference it counts | Add the inline-style background reference to the AC's Verification enumeration so the list and the count agree |
| 3 | info | exclusivity | `tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` vs `tests/reconciliation-platform-build-deploy-smoke.test.ts` | — | REQ-144's free-coded suite substantially overlaps the reconciliation suite in the *same shape* — most directly `…_named_environments_repeat_every_top_level_var_and_binding` + `…_inheritance_guard_catches_the_config_that_shipped` + `…_control_app_production_carries_the_builder_origin` vs `test_UAT_AC1341_*` (identical helpers `readWranglerConfig`/`missingFromEnv` and the identical pre-fix TOML fixture), and similarly for AC-1330/1333/1334/1336/1337/1338/1339/1342. Judged **not** capability drift: retaining the FC suite beside the reconciliation suite is this repo's uniform convention (24 `test_UAT_FC_*` files coexist with ~200 `reconciliation-*` files; REQ-133 in this same bundle has both). Recorded so a future check sees it was weighed rather than missed | none — revisit only as a repo-wide policy decision |
| 4 | info | coverage | AC-1342 | — | REQ-144 records as outstanding that the secret mechanism "has **not** been proved end-to-end with a throwaway value against the live account", and STORY-119 repeats it. AC-1342 is correspondingly written about what is observable (nothing committed, nothing echoed) rather than claiming a live push. Correct alignment, not a gap | none |
| 5 | info | coverage | AC-1336 / AC-1341 | — | REQ-144's own AC4 ("`bin/smoke` passes against the current live `public-site` before anything else changes") and AC1 ("a dry-run deploy shows them resolved") were satisfied by *observation* at free-coding time, not by an automated test, and are recorded as such in REQ-144's evidence table. AC-1336 correctly re-expresses the automatable half — the engine is a parameterised origin — rather than encoding a network call into the suite | none |

## Notes for the Editor

**Workspace caveat, and why it is not a finding.** This check ran in the regression worktree
`regression-cb0dad9c`, cut from main at `0f44ef1b` — *before* BUNDLE-19 landed at `b18b859d`.
Neither the matrix elements nor the tests exist in this worktree's tree (`git ls-tree HEAD --
.xgd/tickets/hot/story-d5167ced.md` is empty; there is no `bin/build`, `bin/smoke` or
`tests/reconciliation-platform-build-deploy-smoke.test.ts`). Both resolve from `main`, which is
where the ticket CLI reads, so the matrix and the tests were read from the same commit and the
comparison is sound. A naive `grep` for `test_UAT_AC133*` in the working tree returns nothing and
would produce a false "no UATs exist" verdict — do not draw that conclusion without checking
`main`.

**Not executed.** This is an alignment check, and it is read-only; the suite was assessed by
reading, not by running. Running it here would require checking out `main`'s files into this
worktree. Corroborating evidence that it passes: BUNDLE-19's merge commit `b18b859d` is
`xgd(test_fix): done`, and REQ-144's evidence table records "18 UATs, all passing" against 75
pre-existing unrelated failures verified identical at the baseline with the work stashed.
Execution belongs to the structural-health / coverage stages, not here.

**Evidence-validity note (positive).** The suite is unusually careful about its mock boundary and
worth preserving as a pattern: `pnpm`, `npx`/wrangler and (in the fixture tree only) `bin/1c` are
replaced by *recording shims on PATH* — the external boundary — which is precisely what makes the
composed command line and the hook-before-upload **ordering** observable. `bin/build` and
`bin/deploy` themselves are copied byte-for-byte and run for real. Nothing internal is mocked.
The smoke checks drive the real `smoke.mjs` process with only `globalThis.fetch` replaced, so the
exit status and the rendered summary an operator sees are the things under test. AC-1334's abort
is proven by the *absence* of a shim line rather than by message ordering, which is the stronger
form.

**Two ACs are legitimately static.** AC-1341 and AC-1342 are criteria about committed
configuration and committed documentation; a file-content assertion is the correct shape for
them, not a weak substitute for an entry-point test. They are not "structural/AST checks" in the
sense the coverage rule is guarding against.

**Watch item for the next cycle.** REQ-145 (`ready_to_reconcile`) will turn STORY-119's
"the build artifact is evidence, not input" into "the build artifact is genuinely consumed", and
REQ-147 (`reconciling`) owns the first control-app deploy and the DNS record that STORY-119 puts
out of scope. Neither has touched this tree yet. When either reconciles, AC-1331 (what the
artifact is for) and the story's Technical Context (the residual bad-gateway; the two production
findings) will need re-reading at story level.
