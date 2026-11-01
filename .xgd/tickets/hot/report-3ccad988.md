---
uid: report-3ccad988
id: REPORT-7236
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T03:10:21.656951+00:00'
updated_at: '2026-11-01T03:10:21.656951+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-104
---

I wrote 3 UATs for STORY-104, one each for AC-2092, AC-2093 and AC-2094, and all 3 pass. I didn't lint the file: `npx eslint` tried to download eslint, and the sandbox blocks `registry.npmjs.org`.

UATs generated for story STORY-104 (plan item 6 of 7)

Story: STORY-104
Test file(s) created:
  - tests/reconciliation-builder-pane-rejoin.test.ts

Tests written: 3
Tests passed: 3
Tests failed: 0

- `test_UAT_AC2092_a_live_turn_is_one_growing_assistant_message_with_no_user_message_added`: the part-written reply and the rest arrive as one assistant message, with no extra user message. Tool activity shows in the pane and the composer behaves as in any turn. A turn with nothing said yet still rejoins. During a turn that never ends, switching site lands at once.
- `test_UAT_AC2093_a_rejoined_turns_writes_reload_the_page_and_a_failed_reload_keeps_the_reply`: the page beside the conversation reloads once, as the write is reported. The report adds no message and no activity entry, and the reply still finishes when the reload throws.
- `test_UAT_AC2094_no_live_turn_is_not_rejoined_a_failed_rejoin_is_silent_and_a_transport_without_rejoin_mounts`: a conversation with no turn in progress asks for nothing more. A rejoin that fails at the start or part-way stays silent, keeps the transcript, and leaves the pane switchable and typeable. A transport with no rejoin still mounts, and "can't run" is still explained.

All three tests start from `mountBuilder`, the workspace entry point. Only `openSession` and `fetch` are stubbed, so the pane uses its real `api.js` transport and the real wiring in `app.js`. That matters because when a test injects `streamPrompt`, `app.js:203` passes the pane only `streamPrompt` and drops rejoin. The AC-2094 test uses exactly that to cover the "transport without rejoin" case.

**Possible divergence (not tested):** `postEventStream` in `api.js` turns a non-OK HTTP response into a visible message ("_the assistant could not be rejoined (500)_") instead of throwing. So if `/api/ai/reattach` answers with an error status, the operator would probably see a failure note, which AC-2094 says shouldn't happen. My tests only cover a network failure and a connection dropped mid-stream, and both are silent. This needs an operator decision.

test_files_created:
  - "tests/reconciliation-builder-pane-rejoin.test.ts"
