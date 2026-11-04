---
uid: comment-314897bd
id: COMMENT-7764
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-04T16:34:32.265006+00:00'
updated_at: '2026-11-04T16:34:32.265006+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9b2c552c
  kind: note
---

I wrote four new UATs for story-7b1025b8 and all four pass. The story's older test file is badly broken by this bundle's schema changes, though: 22 of its tests fail and need the fix-it loop.

**What I covered.** The plan item for this story adds two criteria and restates two, so the new file has one test for each of those four:

| Test | Criterion | What it proves against real D1 |
|---|---|---|
| `test_UAT_AC2247_…` | AC-2247 (new) | `users` has no `email` column, and a new invitee gets exactly one address row, marked primary. The database refuses a second primary and refuses the same address for a second person in one business. The same address invited from another business creates a different person there. The people list shows the primary address. |
| `test_UAT_AC2248_…` | AC-2248 (new) | Inviting someone at their second address returns the existing person with `created: false`, adds no person and no address. Logging in at the second address admits that person and reports their primary address. |
| `test_UAT_AC1744_…` | AC-1744 (restated) | A mixed-case, padded address is stored lower-cased and trimmed. Writing a mixed-case address straight into the table is refused by the schema. Re-inviting in a different case finds the same person, and an upper-case padded login is admitted. |
| `test_UAT_AC2171_…` | AC-2171 (restated) | A re-invite doesn't change the invitation time. A name supplied on re-invite is used only when the person has none; a later different name doesn't replace it, and only one name row exists, not superseded. |

Invites go through the Worker's real invite route with a signed login token; the only thing faked is the login provider's key fetch.

**The older test file needs fixing.** `tests/reconciliation-identity-invite-provision-admission.workers.test.ts` covers the rest of this story's criteria, and 22 of its tests now fail. Its helpers still use the old shapes: `users.email`, `display_name`, `provisionBusiness({accountUserId})`, and treating `findAccount(...).id` as the person's id. That file also holds the old AC1744 and AC2171 tests, which still assert the old schema. I was told not to modify existing test files, so I left it alone.

**Lint wasn't run.** ESLint isn't installed in `node_modules`, and the sandbox blocked downloading it. There's also no root `tsconfig.json`, so the tests aren't typechecked either.

```
UATs generated for story story-7b1025b8 (plan item 3 of 8)

Story: story-7b1025b8
Test file(s) created:
  - tests/reconciliation-identity-person-addresses-names.workers.test.ts

Tests written: 4
Tests passed: 4
Tests failed: 0

test_files_created:
  - "tests/reconciliation-identity-person-addresses-names.workers.test.ts"
```