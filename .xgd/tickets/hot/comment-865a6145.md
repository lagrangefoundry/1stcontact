---
uid: comment-865a6145
id: COMMENT-1773
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-31T12:24:14.142640+00:00'
updated_at: '2026-08-31T12:24:14.142640+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1b278123
  kind: note
---

Tree is clean apart from the new file. Here is the report.

```
UATs generated for story story-d5167ced (plan item 9 of 11)

Story: story-d5167ced
Test file(s) created:
  - tests/reconciliation-platform-build-order-and-private-surface.test.ts

Tests written: 3
Tests passed: 3
Tests failed: 0

test_files_created:
  - "tests/reconciliation-platform-build-order-and-private-surface.test.ts"
```

**Scope.** The story carries 16 ACs. Thirteen already have UATs in `tests/reconciliation-platform-build-deploy-smoke.test.ts`, written when BUNDLE-19 reconciled this same story (`AC1330`–`AC1342`). BUNDLE-20 added three ACs with no test at all, so I wrote exactly those three — writing duplicates for the other thirteen would have violated the 1:1 mapping.

| AC | Test | Boundary |
|---|---|---|
| AC-1425 | `test_UAT_AC1425_each_control_surface_check_passes_fails_and_skips_on_its_own_option` | `runSmoke` in-process for status/detail; the real `smoke.mjs` process (transport replaced beneath it) for exit status and the rendered report |
| AC-1426 | `test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_naming_the_chain` | the real `tsc` — the binary `bin/build`'s typecheck stage runs — over the real `apps/control-app/tsconfig.json` and over a fixture reproducing the original offending specifier |
| AC-1427 | `test_UAT_AC1427_the_generation_stage_runs_before_the_typecheck_that_consumes_it` | real `tsc`, real `git ls-files`/`check-ignore`, and the unmodified `bin/build` against a fixture tree with recording shims for `1c`/`pnpm`/`npx` |

## ⚠️ Six pre-existing tests in this story's sibling file are failing

I did not touch them — the prompt prohibits modifying existing test files. Five are stale against ACs this bundle rewrote (the code is right, the tests describe the old spec); one is environmental. Diagnoses, for the fix-it loop:

- **`test_UAT_AC1336`** — asserts `not.toContain('skip  ')` and `9 passed, 0 skipped.`. Reconciliation Decision 2 removed exactly that: the check set is now eleven, and the two control-surface checks skip against a public origin. Needs "every *applicable* check passes, and each skip is **named**".
- **`test_UAT_AC1337`** — `expect(report.checks.map(c => c.name)).toEqual(NINE_CHECKS)`; the set is eleven.
- **`test_UAT_AC1338`** — expects the summary `2 passed, 7 skipped.`; it is now 9 skipped.
- **`test_UAT_AC1341`** — the upgraded AC requires the one exception to be **named in the check itself**. `missingFromEnv` in `tests/support/wrangler-toml.ts` has no exception, so it reports `ACCESS_DEV_OPEN` as missing from control-app's `[env.production]` — where its absence *is* the security control. The check needs that single variable exempted by name.
- **`test_UAT_AC1342`** — looks for `would push ANTHROPIC_API_KEY to $DEPLOY_WORKER_NAME` in `bin/deploy.d/secrets/README.md`. REQ-149 moved the worked example into the hook itself; those lines are now at `bin/deploy.d/secrets/10-anthropic-api-key:93` and `:106`. The README still carries the piped, newline-free push it asserts on.
- **`test_UAT_AC1331`** — **environmental, not a regression.** `bin/build --skip-preflight` still runs the real `1c assets`, which needs the out-of-band shared component store; `node_modules/@lagrangefoundry` does not exist in this worktree (it only resolves from the main checkout). This one should pass unchanged from the main checkout.
