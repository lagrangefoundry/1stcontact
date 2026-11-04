---
uid: report-a2f820c8
id: REPORT-10888
type: report
title: 'Override conformance: batch 0'
created_by: xgd
created_at: '2026-11-04T17:56:13.280413+00:00'
updated_at: '2026-11-04T17:56:13.280413+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: override_conformance
  subject_uid: story-7d255580
  mode_override_uid: report-132efb58
  parent_report_uid: report-1da9821d
  batch_index: 0
  attempt: 0
  findings: []
---

# Override conformance

- Item 1 (named files only): PASS. `unnamed_files_touched` is empty. The only production-code file touched is `apps/control-app/src/mail.ts`, which the override names. `tests/test_UAT_FC_REQ-196_mail.workers.test.ts` is a test file, outside code_frozen's scope, and the planner's instructions named that edit.
- Item 3 (consistent with intent and AC): PASS. REQ-197 (request-704fe21e.md:123) states "The body is HTML, and it is one part." AC-2281 (`test_UAT_AC2281_message_body_reaches_the_provider_as_html`, tests/test_reconciliation_outgoing_messages.workers.test.ts:216) asserts `payload.html` equals the rendered body. The change `text: message.body` -> `html: message.body` meets both.
- Item 4 (within stated scope): PASS. The diff contains exactly the three things the planner authorised: the one-line payload field change, the Message.body doc-comment correction, and the single `text:` -> `html:` expectation change in the REQ-196 exact-shape test. The rest of that test's payload/endpoint/bearer/id assertions are unchanged. No derived text part, no textFrom port, no multipart (REQ-205 stays out of scope).
- Item 5 (trust boundary): PASS. `trust_boundary_touched` is false, `trust_boundary_mismatch` is false, and `trust_boundary_matches` is empty.
- Item 6 (code_frozen, rung 1): PASS. Rung 1 (intents in scope): REQ-197 is later than REQ-196 and settles the body as one-part HTML. The diff edits only the named file `mail.ts` (tip_evidence mail.ts:380-392 region / the adapter payload) and adds no behaviour, branch, error handling or API. It renames one payload field and updates one comment.

Note (not a finding): the body now reaches the provider as HTML. Escaping untrusted values interpolated into templates is the template renderer's job (REQ-197), not this adapter's, and this batch does not change it.