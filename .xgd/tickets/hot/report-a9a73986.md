---
uid: report-a9a73986
id: REPORT-11241
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-08T02:37:56.427923+00:00'
updated_at: '2026-11-08T02:37:56.427923+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-149
---

UATs generated for story STORY-149 (plan item 4 of 7)

Story: STORY-149
Test file(s) created:
  - `tests/reconciliation-assistant-priming-delivery.test.ts`
  - `tests/reconciliation-assistant-priming-delivery.workers.test.ts`

Tests written: 2
Tests passed: 2
Tests failed: 0

The plan's only gap for this story was AC-2364: every host must actually send the model the system prompt, landscape, purpose, how-to-search section and the turn's reminder. The other 15 ACs already had UATs, so I added two tests for AC-2364 only. It has one test per runtime because the Node and workerd suites can't share a file; AC-2237 already does the same.

- **`test_UAT_AC2364_the_node_host_sends_system_prompt_landscape_purpose_mechanism_and_reminder`** drives the Node CLI host through `openSession` and `streamPrompt`, and reads only what the model double recorded.
  - **With a knowledge base built:** the system prompt is the first thing sent, then `# What exists` with the map's territory inside it, then the purpose, then `# How to search` carrying `KnowledgeSearch`. The reminder names the site.
  - **With no knowledge base built:** the session still starts. It is sent the system prompt and then the tool manual (`set_l1`), with no landscape or how-to-search section, and the reminder still goes out.
- **`test_UAT_AC2364_both_worker_paths_send_system_prompt_landscape_purpose_mechanism_and_reminder`** goes through the Worker's routes (`/api/ai/session`, `/api/ai/prompt`) against real D1 and R2.
  - **With the client's knowledge open:** both maps sit inside the landscape, before the purpose, and the same order holds.
  - **Without client knowledge:** only the system map is there, the same order holds, and the reminder names the site.

Both tests accept the system prompt as either one string or cache-split text blocks. They join the blocks before checking the order, and fail on any block that isn't text.

**Not run:**
- **ESLint:** it isn't installed at the repo root, and `npx` was blocked from reaching registry.npmjs.org.
- **`tsc`:** the type-check command was denied by this session's permission mode.

Both files copy the imports and setup of the existing BUG-63 and two-knowledge-bases suites, but the downstream quality gate is the first real lint and build check.

The existing AC-1795 test, which I didn't change, still passes against the amended criterion. Its last check reads text inside the how-to-search section. The new "system prompt first" requirement is now checked by both AC-2364 tests. No runtime code, existing tests or tickets were changed.

test_files_created:
  - "tests/reconciliation-assistant-priming-delivery.test.ts"
  - "tests/reconciliation-assistant-priming-delivery.workers.test.ts"