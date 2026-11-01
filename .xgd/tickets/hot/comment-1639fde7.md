---
uid: comment-1639fde7
id: COMMENT-6233
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T18:07:19.949734+00:00'
updated_at: '2026-11-01T18:07:19.949734+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-983fc656
  kind: note
---

UATs generated for story story-7102ffe3 (plan item 1 of 8)

The new file covers 16 of the story's 17 ACs. The 16 tests pass, except AC-2166, which fails about one run in six because of a timing bug in the production code. The bug is noted below and the code is unchanged.

Story: story-7102ffe3
Test file(s) created:
  - `tests/test_reconciliation_business_scope_operator.workers.test.ts`

Tests written: 16
Tests passed: 16 on 6 of the 7 runs above; on the other, 15
Tests failed: 0 or 1 depending on the run (AC-2166)

⚠️ TESTS FAILING INTERMITTENTLY — downstream fix-it loop required

Failures:
  - `test_UAT_AC2166_platform_admins_holder_is_seeded_owner_and_operator_idempotently_and_survives_emptying`: on the first login of a `PLATFORM_ADMINS` holder, the 1st Contact business can come back with `selectable: false` and lapse reason `not_yet`.
    - **Cause:** in `apps/control-app/src/identity.ts`, `admit` takes its `now` before it calls `ensurePlatformOperator`. That function stamps the seeded grant's `starts_at` with its own, slightly later `new Date()`. If the clock moves between the two, the grant hasn't "started" for that admission.
    - **Why it's the code:** the AC says the holder gets a selectable 1st Contact business on that admission, so I kept the assertion. A later request does resolve.
    - **Likely fix:** have `admit` pass its own time into `ensurePlatformOperator`.
    - The existing REQ-185 FC test misses this because it never checks selectability on the first admission.

What else you should know:
- **The earlier suite is stale.** `tests/test_reconciliation_business_scope.workers.test.ts` (AC-2117…AC-2131) now fails 13 of 14, because this bundle removed `provisionInvite` and renamed `platform_admin` to `platform_operator`. I wasn't allowed to edit existing tests, so I ported those cases into the new file and changed only what the renames required. The old file needs deleting: it now duplicates those test names and still fails.
- **AC-2124 isn't in the new file.** Its existing test in `tests/test_reconciliation_business_scope_single_reader.test.ts` still passes.
- **AC-2131's migration re-run** maps `platform_admin` to `platform_operator` as well as `account_id` to `business_id`. This extends a rename mapping the old test already did, because migration 0005 was written against the pre-rename schema.
- **Lint and typecheck weren't run.** eslint isn't installed in this worktree and the sandbox blocked the npm registry. No tsconfig covers `tests/`.
- **Build output:** to load the Worker in tests I ran `./bin/1c assets`, which wrote ignored build output under `apps/control-app/` and nothing tracked.

test_files_created:
  - "tests/test_reconciliation_business_scope_operator.workers.test.ts"
