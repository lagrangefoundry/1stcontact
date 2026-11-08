---
uid: comment-a715f8dc
id: COMMENT-7973
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T06:06:29.265822+00:00'
updated_at: '2026-11-08T06:06:29.265822+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7c39c309
  kind: note
---

All 103 tests in the batch scope now pass, including the three that were failing. The `ai.ts` capabilities fix the planner asked for was already committed (`ef0e1f4040`), so I made no production edits. The three failures had two test-side causes:

1. **The two `FC_REQ_207` tests** import a `systemText` helper from `tests/support/scripted-model-client.ts`. That helper exists on a sibling branch (commit `53ede2641f`) that isn't merged here, so the call failed with `systemText is not a function`. I added it as a new export that returns a request's system text. Nothing existing changed, so other users of the helper are unaffected.

2. **`FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed`** checks for unscrubbed error values with the regex `error:\s*name`. That pattern also matched the type annotation `error: string` on `refuseNonOwner` (`router.ts:1144`). That isn't a leak: all three callers pass literal strings. I changed the test to skip TypeScript type keywords (`string`, `unknown`, `any`, `never`), since none of those can be the name of a value carrying `err.message`. Every real value position is still checked, and I added an assertion that at least one scrubbed `error:` value is found, so the check can't pass by matching nothing.

`router.ts` and both test files are unchanged since the last-green commit. That suggests these tests were failing there too and are only now being reported, rather than something new breaking them.

Unresolved:
- **One file outside the batch fails to load:** `tests/test_reconciliation_business_scope_operator.workers.test.ts` (`ENOENT … 0005_operator_membership.sql`). I left it alone.
- **Lint wasn't run.** eslint isn't installed locally, and the sandbox blocked fetching it from the npm registry.
- **The edits aren't committed;** they're in the worktree for the workflow to pick up.

```yaml
## Assessment
status: fixed
fixed:
  - test: test_UAT_FC_REQ_207_the_describer_is_primed_with_the_image_prompt_and_nothing_else
    cause: "tests/support/scripted-model-client.ts lacked the systemText export the test imports"
    change: "added export systemText(req) = textOf(req.system) (additive, backward-compatible)"
  - test: test_UAT_FC_REQ_207_the_image_and_document_describers_do_not_cross_wire
    cause: "same missing systemText export"
  - test: test_UAT_FC_REQ-146_every_error_path_out_of_the_router_is_scrubbed
    cause: "regex matched the parameter type annotation `error: string` (router.ts:1144); all callers pass literals"
    change: "skip TS type keywords; added non-empty guard so the check still bites"
production_changes: none (ai.ts capabilities fix already present at ef0e1f4040)
verification: "vitest -t <batch scope>: 103 passed; only failure is an unrelated load error (missing 0005_operator_membership.sql) in test_reconciliation_business_scope_operator.workers.test.ts"
```