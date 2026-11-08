---
uid: comment-28526b48
id: COMMENT-7969
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T05:16:22.788672+00:00'
updated_at: '2026-11-08T05:16:22.788672+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1cb3708e
  kind: note
---

I wrote 4 new UATs for story-a58a0974 (plan item 3 of 6) in one new test file, and all 4 pass. Lint was not run: eslint isn't installed in the worktree and the sandbox blocked fetching it from npm. No tsconfig covers `tests/`, so there was no type-check to run beyond vitest's own transpile.

The tests cover the four criteria this plan item adds or changes: AC-2374 and AC-2375 (new), AC-2107 and AC-2109 (changed). They run a real session through the host with only the model client replaced, over a small knowledge base built inside the test, and check what the model was actually sent.

| Test | What it checks |
|---|---|
| `test_UAT_AC2374_…` | No configured sentence appears in any source file of the assistant host. Text written as lines reaches the model as joined paragraphs. The site line and change line have no unfilled `{placeholder}`. Each of the six malformed shapes is refused with `PrimingConfigError` naming the entry. The no-knowledge-base order loads with only the always-registered providers; the knowledge-base order is refused naming `km-landscape`. |
| `test_UAT_AC2375_…` | The cap is 60,000 characters. A real session primes under half of it. A quiet turn's reminder has exactly four paragraphs, with no leftover separator or placeholder. An oversize entry stops the session with an error naming `km-landscape`, and no request reaches the model. |
| `test_UAT_AC2107_…` | No product tier is declared and none of the framework's transcript wording reaches the model. The role text comes first and the product text follows it unchanged. The product text names no role. The purpose sits between the map and the tool manual. No product sentence is repeated elsewhere, and no text mentions a playbook stage. |
| `test_UAT_AC2109_…` | The six reminder entries arrive in their declared order. A quiet turn has no `DOC-<n>` id and is under 600 characters. A client edit adds the change paragraph with its cursor. Both signals together give six paragraphs with the delta last. |

Two things to know:
- **Markers are named by position.** A cache-boundary marker has no name of its own, so the loader identifies it by its place in the list (`'priming'[0]`, `second 'cache_boundary' at [3]`, `'reminders'[0]`). The tests accept that as naming the offending entry.
- **The old AC-2109 test now fails.** `test_UAT_AC2109_reminder_is_short_points_to_doc33_…` in `tests/reconciliation-assistant-session-texts.test.ts` still expects `DOC-33`, which BUG-65 deliberately removed. I didn't touch it because this step only creates new files; the downstream fix loop will need to delete or replace it.

```
UATs generated for story story-a58a0974 (plan item 3 of 6)

Story: story-a58a0974
Test file(s) created:
  - tests/reconciliation-assistant-session-priming.test.ts

Tests written: 4
Tests passed: 4
Tests failed: 0

test_files_created:
  - "tests/reconciliation-assistant-session-priming.test.ts"
```