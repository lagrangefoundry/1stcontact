---
uid: report-c757f137
id: REPORT-10882
type: report
title: 'Report: blocked_by_handoff for story-7d255580'
created_by: xgd
created_at: '2026-11-04T17:41:37.967654+00:00'
updated_at: '2026-11-04T17:47:55.043609+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: story-7d255580
  rule: code_frozen
  evidence: 'Ran `npx vitest run tests/test_reconciliation_outgoing_messages.workers.test.ts
    -t test_UAT_AC2281` — fails at line 233: expected payload.html to be the rendered
    invite body, received undefined. apps/control-app/src/mail.ts:200 submits `text:
    message.body` to Resend (doc comment at lines 52-53: ''the Resend adapter sends
    it as `text`''). Story story-7d255580''s Reconciliation Decisions flag this as
    a CODE-ISSUE: REQ-197 (later intent, governs) requires the body to be HTML; AC
    acceptance_criterion-a9a7dbf2 captures that intent. The test correctly encodes
    the AC; only a production change can make it pass.'
  proposed_change: 'apps/control-app/src/mail.ts line 200: change `text: message.body,`
    to `html: message.body,` and update the doc comment at lines 52-53 to state the
    body is a single HTML part sent as Resend''s `html` field. No test, AC or story
    changes needed.'
  batch_index: 0
  parent_report_uid: report-18b12df9
  anchor_ticket: bundle-5052a63c
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run tests/test_reconciliation_outgoing_messages.workers.test.ts -t test_UAT_AC2281` — fails at line 233: expected payload.html to be the rendered invite body, received undefined. apps/control-app/src/mail.ts:200 submits `text: message.body` to Resend (doc comment at lines 52-53: 'the Resend adapter sends it as `text`'). Story story-7d255580's Reconciliation Decisions flag this as a CODE-ISSUE: REQ-197 (later intent, governs) requires the body to be HTML; AC acceptance_criterion-a9a7dbf2 captures that intent. The test correctly encodes the AC; only a production change can make it pass.

**Proposed change**: apps/control-app/src/mail.ts line 200: change `text: message.body,` to `html: message.body,` and update the doc comment at lines 52-53 to state the body is a single HTML part sent as Resend's `html` field. No test, AC or story changes needed.

## Ruling: granted

the planner granted an override in its plan
