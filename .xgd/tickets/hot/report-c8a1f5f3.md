---
uid: report-c8a1f5f3
id: REPORT-11102
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-07T07:06:27.600398+00:00'
updated_at: '2026-11-07T07:06:27.600398+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-d34eccd8
  parent_report_uid: report-83b9f631
  batch_index: '0'
---

I removed `test_UAT_AC913_the_apex_holds_and_never_serves_a_site`. It asserted behaviour the code no longer has, because the criterion it tested has been retired.

**Why it failed:** the test expected `/` to return the fixed greeting `Hello from 1stcontact.io`. AC-913 is now at status `superseded` (by REQ-200), and the story says so: the root now serves the site the deployment configures as its apex, or the plain not-found if none is configured or published. The code is right and the test was stale.

**What I changed** (only `tests/reconciliation-published-site-serving.test.ts`):
- Deleted the AC-913 test. No other coverage was needed for it, since the AC itself is retired.
- Updated the file header from "nine criteria" to "eight", and added a note saying AC-913 is superseded and where the replacement tests live.

**Coverage of the new apex behaviour:** the REQ-200 tests already check it, in `tests/test_UAT_FC_REQ-200_apex_and_session.test.ts`. For example, `apex_serves_a_published_site_and_the_literal_is_gone` and `apex_pages_and_assets_resolve_at_the_root` cover AC-2333.

**Checks:** vitest on the edited file plus the REQ-200 apex/session file shows 2 files and 17 tests passing. I couldn't run lint: eslint isn't installed locally, and the sandbox blocked downloading it from registry.npmjs.org.

**Tickets:** no changes needed. AC-913 is already marked superseded, and the story already explains why it was retired.

```yaml
## Assessment
blocked_by: null
```