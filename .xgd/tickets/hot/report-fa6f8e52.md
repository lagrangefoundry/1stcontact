---
uid: report-fa6f8e52
id: REPORT-11210
type: report
title: 'Code Review: bundle-7988e925'
created_by: xgd
created_at: '2026-11-08T00:24:56.625700+00:00'
updated_at: '2026-11-08T00:24:56.625700+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-7988e925
  overrides_audited: 5
  trust_boundary_overrides: 0
  anchor_uid: bundle-7988e925
---

# Code Review

**Result**: PASS

## Summary
The free-coded REQ-199/200/201/202/203 work and the BUG-57/62 fixes are wired in and green. Five mode_override reports and one aligned_to_tip ruling were audited. The one override an earlier reconciliation review found misjudged (de676490 added 0002_session_rotation.sql) has already been fixed: commit 2d0ebd2419 deleted that file, so the net diff for that grant is now confined to the sessions DDL in 0001_baseline.sql. 5 overrides audited, 0 touched a trust boundary.

## Quality Gates
Lint success, build success, preflight pass, overall success (quality report 2026-11-08T00:08:53Z). I re-ran the suites the overrides affect: tests/reconciliation-behavior-account-chrome.test.ts, test_UAT_FC_REQ-145_build_artifacts, test_UAT_FC_REQ-200_account_chrome and test_UAT_FC_REQ-202_passwordless_wiring. 31/31 passed.

## External Interface Accessibility
All wired in. handleSignIn is routed in apps/control-app/src/index.ts:314-315. Invites are imported by router.ts:59. onboarding.ts is consumed by terms.ts. account-chrome is registered (registry.ts:31) and catalogued (catalog.ts:36). D1SessionReader and readSessionId are used by apps/public-site/src/index.ts:85,103.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/public-site/src/session.ts:144 | Liveness is `expires_at > now` only. The installed auth-passwordless component also treats a row with retired_at past its grace period as dead and as a replay (passwordless.js:493-494). Nothing in this window rotates sessions, so no rows are retired yet. Once rotation is adopted, a replayed rotated-away cookie would render the signed-in chrome on the public site, though it grants no access. | Warning |
| tools/generate/src/cli/module-assets.ts:106 | scopeClientJs strips only a statement-leading `export` before function/const/let/class. A future client.js using `import`, `export default` or `export {}` would break the bundle again. No current client.js does. | Warning |
| added production lines | No console.log, debugger or TODO/FIXME leftovers in apps/, packages/, tools/, bin/ or db/ | OK |

## Checklist Compliance
No architecture_checklist, security_checklist or design_checklist report exists. Skipped. (The `xgd ticket list` call was refused by the session's permissions, so I searched the ticket files directly instead.)

## Mode Override Audit
5 overrides audited, 0 touched a trust boundary.

- **report-aea06ed9 / report-de676490** (code_frozen, story-e0ca0a36, rung 2; the same grant recorded twice). Item 1: files_touched equal the named files, and unnamed_files_touched is empty. Item 2: suites pass. Item 3: the baseline sessions DDL and its four indexes (0001_baseline.sql:817-842) match reconcile-src-BUNDLE-38:db/migrations/0001_baseline.sql:951-988 and the component's SCHEMA_STATEMENTS. Items 4 and 6: the 0002 rebuild file went beyond what any in-scope AC or intent asks for. A prior reconciliation review already recorded that, and fix commit 2d0ebd2419 deleted the file and removed its cross-reference comment. The net diff is now within scope, so I am not raising a second failure. Item 5: no trust boundary touched.
- **report-87a5036b** (code_frozen, story-179b8c06, rung 2). The composer change (scopeClientJs block-scoping, BUG-75) is in the named file tools/generate/src/cli/module-assets.ts. The regenerated packages/framework/src/modules/module-assets.ts is the other named file. The extracted MODULE_CLIENT_JS passes `node --check`. The test was not edited and the REQ-145 suite is green. Item 5: no trust boundary touched.
- **report-96aef569 / report-078b06e6** (code_frozen, story-179b8c06, rung 1). siteCapabilitiesSchema is `.strict()` (schema.ts:920), as REQ-200 asks. The test change (a stronger AC-2329 assertion) is outside code_frozen's scope and does not fail item 1. storage/sites/1stcontact/draft/site.json carries only `accounts`. Conformance verdicts pass. Item 5: no trust boundary touched.
- **report-47493afa** (aligned_to_tip, AC-2208). Item 1: the tip evidence exists at reconcile-src-BUNDLE-38: line 419 is the users table and line 449 is `pipeline_stage ... DEFAULT 'lead'`; identity.ts:1228 is ensurePlatformOperator. Item 2: no later in-window intent requires a backfill, the bundle intent sentence says no separate migration exists, and erratum comment-d3b99dae is on bundle-7988e925. Item 3: AC-2208 was rewritten in place, stays active and carries an alignment note. Pass.

## Smoke Test
The entry points are Worker HTTP routes (sign-in, invites, contacts, the public-site apex). The sandbox blocks local port binding, so no live HTTP smoke test was run. The routes are exercised through the workers and vitest suites in the passing quality run.

## Issues Found
**Critical (must fix)**:
- None

**Warnings (should fix)**:
- apps/public-site/src/session.ts:144: before rotation (REQ-231) is adopted, align D1SessionReader liveness with the component, either by excluding rows whose retired_at is past the grace period or by delegating to the component's validator.
- tools/generate/src/cli/module-assets.ts:106: make scopeClientJs reject (with a build error) client.js containing `import` or `export default` / `export {}`, rather than emitting a bundle that will not parse.
