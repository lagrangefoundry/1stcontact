---
uid: report-a216c262
id: REPORT-11636
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-09T00:45:01.418623+00:00'
updated_at: '2026-11-09T00:45:01.418623+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-f2e5032c
  parent_report_uid: report-0dbd477a
  batch_index: '0'
---

I fixed the failing AC2503 test by correcting the test and its AC, without changing any production code. The full lead-capture test file now passes, 15 of 15.

**Why it failed:** `/api/lead` accepts the `multipart/form-data` content type as a native form submission. But `readFields` in `apps/public-site/src/lead.ts:281` reads every form body as URL-encoded. A multipart body therefore produces no usable fields. The Turnstile token is never found, so the request is refused with 400. URL-encoded submissions pass every check.

**Why I changed the test rather than the code:** besides the code being frozen in this mode, REQ-223 only asks that "an ordinary form POST" without JavaScript is captured. The published `contact-form` renders `<form method="post">` with no `enctype`, so a browser always sends that POST URL-encoded. The multipart requirement came from how the AC was worded, not from the intent.

**Changes:**
- **Test** (`tests/test_reconciliation_public_lead_capture.workers.test.ts`, AC2503):
  - It now renders the published form and asserts `method="post"` with no `enctype`, so it fails if the form ever starts posting multipart.
  - It still checks that a URL-encoded submission creates the same contact and the same provenance detail as a JSON one, and gets the HTML confirmation page with its headers.
  - It still checks that a refused native submission gets an HTML 400.
  - The multipart case is dropped.
- **AC-2503** (`acceptance_criterion-ed5504e7`): rewritten to cover only the URL-encoded POST the form actually sends, with a note on what the code does with multipart bodies.

**Finding for the planner:** multipart bodies are accepted as a form type but parsed as URL-encoded, so they are always refused. The published form never sends multipart, so visitors aren't affected today. If multipart should be supported, `readFields` needs to parse it with `request.formData()`; otherwise `shapeOf` (`lead.ts:216`) should stop accepting `multipart/form-data`, so such requests get the 415 refusal for an unsupported content type.

```yaml
## Assessment
status: fixed
blocked_by: null
```