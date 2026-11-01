---
uid: report-b1046c36
id: REPORT-7258
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T03:52:39.463201+00:00'
updated_at: '2026-11-01T03:52:39.463201+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-06a89294
  parent_report_uid: report-824ec5c5
  batch_index: '0'
---

I fixed all three tests; I changed only the two test files and two acceptance criteria, and no production code. Both files now pass in full (12 of 12), and the type check shows no errors in either. I didn't lint them because eslint isn't installed in the project and the sandbox blocked fetching it from the npm registry.

**Why they failed.** All three were written before REQ-173, which changed two things the tests relied on:
- The upload route now refuses with a 503 when no describer is set up (no API key and nothing injected).
- A document's body is now a short summary (a digest) written by a model. The document's full text goes into a separate `material_text` comment on the material.

The tests set up no text describer, so the upload either came back without a description or was refused outright. The code is behaving as REQ-173 specifies.

**Test changes:**
- **Both files:** the test setup now includes a stand-in text describer that returns a fixed summary and records the text it was shown.
- **AC1678:** the test checks that the stored body is exactly that summary, that the describer was shown the file's own words (not its filename), and that `description_model` is `stub/digest-1 (text-decode)`. The checks on the response and the second, separately opened store read are unchanged.
- **AC1809:** for the `.md` file sent with no declared type, the test now checks that:
  - the describer was shown the file's distinctive phrases;
  - the body is the summary, without the "nothing here can read" wording;
  - `description_model` is `stub/digest-1 (text-decode)`;
  - the full text is in exactly one `material_text` comment.

  The image and font cases are unchanged.
- **AC1687:** the test now builds its setup through the standard helper with the indexer removed, rather than passing an empty object. A describer is set up, so the route no longer refuses, and the "no indexer" situation the criterion is about is still tested for real.

**Acceptance criteria:** I updated AC-1678 and AC-1809 with `xgd ticket update`, because both still said the body contains the file's own text. They now say the body is the describer's summary and the full text lives in the `material_text` comment. AC-1687 needed no change.

```yaml
## Assessment
blocked_by: null
```
