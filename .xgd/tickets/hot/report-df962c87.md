---
uid: report-df962c87
id: REPORT-10881
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-04T17:41:33.372273+00:00'
updated_at: '2026-11-04T17:41:33.372273+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-7d255580
  parent_report_uid: report-18b12df9
  batch_index: '0'
---

I made no edits. The fix this test needs is a change to production code, and production code is frozen in this mode.

**What fails:** `test_UAT_AC2281_message_body_reaches_the_provider_as_html` in `tests/test_reconciliation_outgoing_messages.workers.test.ts:233`. The provider receives `payload.html === undefined`. I ran it and confirmed this is the cause.

**Why:** the Resend adapter sends the body as plain text. `apps/control-app/src/mail.ts:200` sets `text: message.body`, and the doc comment at lines 52–53 says the same. So the rendered invite reaches the provider as plain text, and the button would show up as raw `<a href=…>` markup.

**Why the test is right and the code is behind:** the AC is deliberately written to REQ-197's intent ("the body is HTML, and it is one part"). The story's Reconciliation Decisions list this exact mismatch as a CODE-ISSUE, and REQ-196 itself said the fix would be "one field here and one line in the adapter". If I changed the test to check `payload.text`, it would prove behaviour the AC rejects. If I changed the AC, it would reverse a decision the story has already recorded. The only correct fix is the one-line adapter change, and `code_frozen` doesn't allow it here.

## Assessment
```yaml
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run tests/test_reconciliation_outgoing_messages.workers.test.ts -t test_UAT_AC2281` — fails at line 233: expected payload.html to be the rendered invite body, received undefined. apps/control-app/src/mail.ts:200 submits `text: message.body` to Resend (doc comment at lines 52-53: 'the Resend adapter sends it as `text`'). Story story-7d255580's Reconciliation Decisions flag this as a CODE-ISSUE: REQ-197 (later intent, governs) requires the body to be HTML; AC acceptance_criterion-a9a7dbf2 captures that intent. The test correctly encodes the AC; only a production change can make it pass."
  proposed_change: "apps/control-app/src/mail.ts line 200: change `text: message.body,` to `html: message.body,` and update the doc comment at lines 52-53 to state the body is a single HTML part sent as Resend's `html` field. No test, AC or story changes needed."
```