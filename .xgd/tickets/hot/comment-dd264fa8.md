---
uid: comment-dd264fa8
id: COMMENT-7962
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T03:07:46.862111+00:00'
updated_at: '2026-11-08T03:07:46.862111+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3ccad988
  kind: note
---

I wrote two UATs for STORY-104 and both pass. There is one test per AC this item touched: AC-2094, which was restated, and AC-2368, which is new.

**`test_UAT_AC2094_origin_reports_live_only_while_a_turn_is_open_never_when_settled_or_empty`** (workers suite, real control-app routes and D1, only the model client faked)
- Follows one conversation from empty, to one closed turn, to a turn held open, to settled again.
- The origin must report it not live, then not live with its history intact, then live with a cursor, then not live again. A flag stuck at `true` (the BUG-64 defect) or stuck at `false` would both fail.
- AC-2094 already had a test, in `tests/reconciliation-builder-pane-rejoin.test.ts`, but it covers only the pane side. I wasn't allowed to edit existing files, and the origin side can't run under jsdom, so this is a second test for the same AC in a new file. That breaks the one-test-per-AC rule.

**`test_UAT_AC2368_a_settled_conversation_opens_idle_and_a_typed_message_is_sent_and_answered`** (jsdom, mounted from `mountBuilder` on the installed `webui-chat`, with HTTP stubbed through `fetch`)
- A conversation whose turns are all closed opens without the Stop button and is not rejoined.
- A message typed there reaches `/api/ai/prompt` and the reply is painted in the pane.
- When a turn really is in progress, the composer still shows its live controls, and a message typed then never reaches `/api/ai/prompt`.

**Gaps:**
- I couldn't run eslint. It isn't installed in the worktree, and `npx` was blocked from downloading it.
- `tsc --noEmit` reported no errors in the new files.
- The workers run printed an EPERM because the sandbox wouldn't let wrangler write its debug log. The test itself passed.
- I changed no runtime code and no existing tests.

```
UATs generated for story STORY-104 (plan item 7 of 7)

Story: STORY-104
Test file(s) created:
  - tests/reconciliation-builder-pane-live-flag.workers.test.ts
  - tests/reconciliation-builder-pane-idle-composer.test.ts

Tests written: 2
Tests passed: 2
Tests failed: 0

test_files_created:
  - "tests/reconciliation-builder-pane-live-flag.workers.test.ts"
  - "tests/reconciliation-builder-pane-idle-composer.test.ts"
```