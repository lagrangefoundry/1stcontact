---
uid: report-697fb422
id: REPORT-11286
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T05:32:54.265599+00:00'
updated_at: '2026-11-08T05:32:54.265599+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-a58a0974
  parent_report_uid: report-3cf7a255
  batch_index: '0'
---

All three failing tests in this batch now pass. I changed only test files: no production code and no tickets.

**1. AC2109** (`tests/reconciliation-assistant-session-texts.test.ts`)
- The test still asserted `DOC-33`, which AC-2109 now forbids in the reminder. It now reads the reminder from what the model was sent (its own text block at the end of the last message) and checks that it:
  - equals `consultantReminder()`;
  - names the site and points to the knowledge base;
  - contains no `DOC-<n>` and no `stage <n>`;
  - is under 600 characters, has no unfilled `{placeholder}`, no extra blank line and doesn't end in a separator;
  - has exactly 4 paragraphs on a quiet turn.
- On the turn after the client edits the site, the reminder as sent has 5 paragraphs and the last is the change signal.
- I renamed the test to `test_UAT_AC2109_reminder_is_short_points_to_the_knowledge_base_and_carries_signals_only_when_present`.

**2. AC2066** (`tests/reconciliation-assistant-consultant-role.test.ts`)
- The test cut the text off at the first newline, so it only saw the site line, and "client" first appears in paragraph 2. It now reads the whole reminder block as sent and checks it has at least four paragraphs.
- The checks for `client`, no `user` and no former role name are unchanged. I replaced the out-of-date "one line" comment.

**3. AC1409** (`tests/reconciliation-assistant-conversation-deployed.workers.test.ts`)
- The test had fallen behind the code. Since REQ-190, draft files are stored under `draft/<siteId>/…`, not `draft/<tenant>/<slug>/…`. The test now looks up the site's key through the store (`siteKey(slug)`) instead of building the old path.
- The production code matches AC-1409, so nothing is blocked. Every other check in the test is unchanged and passes: the transcript isn't in object storage, audit records sit outside `draft/`, the address-guessing probes are refused, and two accounts can't reach each other's conversations.

**Runs**
- The two Node files: 9 of 9 passed.
- The deployed workers file: 5 of 5 passed.
- The batch's full test-name filter across the suite: 17 passed, 0 failed.
- One file, `tests/test_reconciliation_business_scope_operator.workers.test.ts`, fails to load because `../db/migrations/0005_operator_membership.sql` is missing. None of its tests are in this batch and none ran, so I left it alone.
- The run also logged that wrangler couldn't write its log file (`EPERM`, blocked by the sandbox); this didn't affect the results.

The acceptance criteria already described what the tests now check, so I made no ticket edits.

```yaml
## Assessment
status: fixed
fixes:
  - test: tests/reconciliation-assistant-session-texts.test.ts::test_UAT_AC2109_reminder_is_short_points_to_the_knowledge_base_and_carries_signals_only_when_present
    change: "Dropped the stale DOC-33 check; now checks the reminder as sent (knowledge-base pointer, no DOC-<n>, no placeholder or extra separator, 4 or 5 paragraphs); renamed off 'doc33'"
  - test: tests/reconciliation-assistant-consultant-role.test.ts::test_UAT_AC2066_per_turn_reminder_the_model_receives_calls_the_owner_the_client
    change: "Reads the whole reminder block as sent, not just its first line; client/user/former-name checks unchanged"
  - test: tests/reconciliation-assistant-conversation-deployed.workers.test.ts::test_UAT_AC1409_no_request_address_can_name_a_transcript_or_the_assistants_record
    change: "Looks up the draft asset key through store.siteKey(slug) (REQ-190 opaque site ids) instead of building the old tenant/slug path"
upstream_changes: none
blocked_by: null
```