---
uid: report-1cb3708e
id: REPORT-1761
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-10T08:42:21.197772+00:00'
updated_at: '2026-08-10T08:42:21.197772+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-a58a0974
---

Only the new test file was added — no runtime code and no existing tests touched.

```
UATs generated for story story-a58a0974 (plan item 4 of 8)

Story: story-a58a0974
Test file(s) created:
  - tests/reconciliation-assistant-conversation.test.ts

Tests written: 11
Tests passed: 11
Tests failed: 0

test_files_created:
  - "tests/reconciliation-assistant-conversation.test.ts"
```

**AC → UAT mapping** (1:1, all 11 ACs covered):

| AC | Test |
|---|---|
| AC-1051 | `test_UAT_AC1051_capability_answer_names_the_role_and_readiness_without_a_conversation` |
| AC-1052 | `test_UAT_AC1052_opening_answers_with_an_identifier_the_turns_so_far_and_readiness` |
| AC-1053 | `test_UAT_AC1053_naming_a_site_or_omitting_a_value_is_refused_as_malformed` |
| AC-1054 | `test_UAT_AC1054_a_site_changing_turn_streams_its_activity_and_leaves_the_change_in_the_draft` |
| AC-1055 | `test_UAT_AC1055_an_identifier_the_origin_never_issued_is_refused_before_anything_is_streamed` |
| AC-1056 | `test_UAT_AC1056_each_conversation_changes_only_its_own_site_and_holds_only_its_own_turns` |
| AC-1057 | `test_UAT_AC1057_turns_persist_under_the_workspace_and_are_replayed_after_a_restart` |
| AC-1058 | `test_UAT_AC1058_only_granted_site_operations_are_offered_none_touching_files_or_naming_a_site` |
| AC-1059 | `test_UAT_AC1059_a_refused_operation_returns_a_named_refusal_into_the_same_turn` |
| AC-1060 | `test_UAT_AC1060_a_missing_credential_is_explained_without_losing_the_conversation` |
| AC-1061 | `test_UAT_AC1061_a_failure_after_streaming_begins_arrives_in_the_stream_before_one_completion` |

**Boundary and mocking**: every case drives real HTTP against a real `startBuilder` origin over `/api/ai/roles`, `/api/ai/session`, `/api/ai/prompt`, in a per-run `mkdtemp` workspace seeded by the real `cmdNew`. The only double is the Anthropic client (the network boundary the library exposes for injection) — the session manager, role assembly, tool loop, toolbox, `edit.ts` writes, on-disk transcripts and SSE projection are all real, and every assertion reads a real consequence (draft bytes on disk, transcript files under `storage/chat`, HTTP status/content-type, parsed SSE frames).

Two notes on evidence quality:
- AC-1058's "exactly those its grant allows" is asserted by comparing the tool names the model was sent against the grant projection from a real `createL1Toolbox` for the same site — not against a hand-copied list that could drift.
- AC-1059 asserts the property the AC states (a named failure class plus a stated correction, handed back into the same turn, draft byte-identical) and deliberately does not assert the per-call path/hint, matching the divergence the story's Technical Context records as raised upstream.

Lint/type-check: `eslint` has no flat config in this repo (pre-existing), and `tsc -p tsconfig.base.json` reports one error on the new file — `Cannot find module '@1stcontact/site-schema'` — which is the same pre-existing repo-wide condition affecting 21 test files including the FC suites this test sits beside; it is not introduced by this change.
