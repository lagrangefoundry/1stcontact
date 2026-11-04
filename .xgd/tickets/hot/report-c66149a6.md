---
uid: report-c66149a6
id: REPORT-10885
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-04T17:50:57.189451+00:00'
updated_at: '2026-11-04T17:50:57.189451+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-7d255580
  parent_report_uid: report-1da9821d
  batch_index: '0'
---

I changed `apps/control-app/src/mail.ts` so the provider now gets the message body as HTML, and both failing tests in this batch pass.

**What changed:**
- **`mail.ts:200`**: the Resend payload sends `html: message.body` where it used to send `text: message.body`. It is still one part; I didn't add a plain-text version, as the planner instructed.
- **`mail.ts:51-58`**: rewrote the comment on `Message.body`. It now says the body is HTML in one part, sent as `html`, because REQ-197's templates carry their call to action as a button. The old comment said plain text.
- **`tests/test_UAT_FC_REQ-196_mail.workers.test.ts`**: in `test_UAT_FC_REQ-196_resend_adapter_sends_and_returns_the_provider_message_id`, the expected payload field is now `html:` instead of `text:`. The test still checks the exact payload, the endpoint, the method, the bearer credential and the returned id.

No ticket updates were needed: the "Provider receives the message body as HTML" AC and the story's CODE-ISSUE entry already describe the HTML behaviour.

**Verification:**
- `test_reconciliation_outgoing_messages.workers.test.ts` (which holds AC2281) and the two FC_REQ-196 suites: 3 files, 22 tests, all passed.
- A run filtered to the full pytest scope (AC2281, FC_REQ-196, AC2275–2278, AC2286): 20 tests passed. One other suite, `tests/test_reconciliation_business_scope_operator.workers.test.ts`, failed to load because `../db/migrations/0005_operator_membership.sql` doesn't exist. That is outside this batch, and I didn't touch it.

```yaml
## Assessment
status: fixed
files_changed:
  - apps/control-app/src/mail.ts   # under authorised code_frozen exception
  - tests/test_UAT_FC_REQ-196_mail.workers.test.ts
upstream_changes: none
```