---
uid: comment-2bcececb
id: COMMENT-1837
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-31T17:25:00.905479+00:00'
updated_at: '2026-08-31T17:25:00.905479+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1b278123
  kind: note
---

Tree is clean apart from the new file. Here is the outcome.

## What I found

Plan item 4 of 5 (BUNDLE-21 → story-d5167ced) adds exactly two acceptance criteria — **AC-1454** (invocation-log retention) and **AC-1455** (retention is not a binding) — and modifies AC-1341. The story's other fifteen ACs already carry UATs in `tests/reconciliation-platform-build-deploy-smoke.test.ts` and `tests/reconciliation-platform-build-order-and-private-surface.test.ts`, so I wrote UATs for the two uncovered ACs only.

Both are asserted against the **parsed** `apps/control-app/wrangler.toml`, per the criteria — the broken forms still parse and still deploy. AC-1455 is asserted through `parseWranglerConfig`/`missingFromEnv`, the same reader the environment-repetition check itself uses, since the criterion is a claim about *that check's* answer.

I verified both tests are non-vacuous by transiently mutating the config (restored via `git`, diff confirmed empty):

| Mutation | Caught by |
|---|---|
| production retention block deleted | AC-1454 |
| retention table hoisted above `routes` (route silently absorbed) | AC-1454 |
| `head_sampling_rate = 0.1` | AC-1454 |
| retention block given a `binding` key | AC-1455 |

## Pre-existing failures I did not touch

`tests/reconciliation-platform-build-deploy-smoke.test.ts` has **6 failing UATs**, all pre-existing and all in a file I'm prohibited from modifying. They are BUNDLE-19-era tests that lag the ACs restated by BUNDLE-20's reconciliation:

- `test_UAT_AC1336_…` — asserts `not.toContain('skip  ')` and `0 skipped`, but BUNDLE-20 decision 2 explicitly widened AC-1336 so the two control-surface checks skip and are named.
- `test_UAT_AC1337_…` / `test_UAT_AC1338_…` — pin a nine-check set and `2 passed, 7 skipped`; the set is now eleven.
- `test_UAT_AC1341_…` — does not encode AC-1341's single stated exception (`ACCESS_DEV_OPEN` must stay absent from production). The FC test `test_UAT_FC_REQ-144_deploy_scripts.test.ts:118` does filter it; the reconciled UAT did not. The config is correct; the test is wrong.
- `test_UAT_AC1331_…` — build-stage failure.
- `test_UAT_AC1342_…` — secret-hook documentation wording drifted from the assertion.

None is caused by this item, and none is a weakening of an AC — the ACs are right and the tests need updating. The downstream fix-it loop needs to take these.

```
UATs generated for story story-d5167ced (plan item 4 of 5)

Story: story-d5167ced
Test file(s) created:
  - tests/reconciliation-platform-invocation-log-retention.test.ts

Tests written: 2
Tests passed: 2
Tests failed: 0

test_files_created:
  - "tests/reconciliation-platform-invocation-log-retention.test.ts"
```

⚠️ Pre-existing (not mine, not modifiable here): 6 failures in `tests/reconciliation-platform-build-deploy-smoke.test.ts` — `test_UAT_AC1331`, `AC1336`, `AC1337`, `AC1338`, `AC1341`, `AC1342`.

The FC file `tests/test_UAT_FC_BUG-37_observability.test.ts` (4 UATs) is fully claimed by these two ACs and is ready for the review prompt to delete under the FC orphan invariant.
