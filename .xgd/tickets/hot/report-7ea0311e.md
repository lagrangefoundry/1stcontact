---
uid: report-7ea0311e
id: REPORT-11094
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-07T06:45:45.991586+00:00'
updated_at: '2026-11-07T06:45:45.991586+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-179b8c06
  parent_report_uid: report-fb76a9e0
  batch_index: '0'
---

I left production code alone and closed the gap with a test-only change. Both production fixes the planner named are already committed. One target test still couldn't run here: AC1624's mounted-overflow test was skipped because Chromium won't launch in this sandbox.

**Already committed (confirmed):**
- `siteCapabilitiesSchema` in `packages/site-schema/src/schema.ts:910` ends with `.strict()`, so a misspelt key like `acounts` now fails site validation (AC-2329).
- `scopeClientJs` in `tools/generate/src/cli/module-assets.ts:108` wraps each behavior's `client.js` in its own block, so the bundle no longer declares `ERROR_SELECTOR` twice (AC-1624).

**Test change:** in `tests/test_UAT_FC_REQ-145_build_artifacts.test.ts`, the test `precompiled_module_chrome_matches_its_sources` now also checks that the bundle loads as a module script:
- It writes `MODULE_CLIENT_JS` to a temporary `.mjs` file and runs `node --check` on it, expecting exit code 0 and no error output. This catches a duplicate top-level declaration without a browser.
- To prove the check isn't vacuous, it also runs `node --check` on a file that declares `ERROR_SELECTOR` twice and asserts that one fails with a `SyntaxError`.

**Results:**
- `test_UAT_AC2329_declared_site_publishes_every_state_and_undeclared_publishes_none` passes.
- The updated REQ-145 test passes.
- AC1624's other three tests pass. Its mounted-overflow test was skipped (not run), as the planner expected; the gate runner has Chromium.
- The full scoped run had 34 passed and no test failures. One test suite outside this batch, `test_reconciliation_business_scope_operator.workers.test.ts`, failed to load because it can't find `0005_operator_membership.sql`; it contains no tests in this scope.
- Type-checking reports no errors in the edited file. I couldn't run ESLint: the project has no lint script and the sandbox blocked downloading it.

I changed no ACs or stories and added no skip markers. The test edit is not committed; I've left that to the workflow.

```yaml
## Assessment
status: fixed
evidence: "Production fixes at HEAD (siteCapabilitiesSchema .strict(); scopeClientJs block-scopes each client.js). Added a node --check ES-module parse assertion on MODULE_CLIENT_JS, plus a check that a duplicate-const file is rejected, to test_UAT_FC_REQ-145_precompiled_module_chrome_matches_its_sources. Scoped vitest: 34 passed, 0 test failures; AC2329 passes; the REQ-145 parse check passes."
unverified: "test_UAT_AC1624_mounted_run_flags_a_container_overflow_on_the_responsive_dimension skipped locally (Chromium unavailable in this sandbox); the gate runner has Chromium. ESLint not run: no lint script, and the sandbox blocked the registry download."
```