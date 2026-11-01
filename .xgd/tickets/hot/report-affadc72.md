---
uid: report-affadc72
id: REPORT-7193
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T01:41:33.516689+00:00'
updated_at: '2026-11-01T01:41:33.516689+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-146
  parent_report_uid: report-76cdd954
  batch_index: '0'
---

Both failing tests now pass, and so does the rest of their file (21 of 21 in `tests/reconciliation-identity-invite-and-admission.workers.test.ts`). I changed only the tests.

**Cause:** the code has moved to multi-business admission. A successful `admit` now returns `{ ok, user, businesses: AdmittedBusiness[] }`, and each business carries its own `entitlement`. The two tests still read a top-level `accountId` and `entitlement`, which no longer exist, so they got `undefined`.

- **AC1748:** the test now checks that the set holds exactly the business the invite created. It asserts that business's id, name, grant id and that it can be selected. It also asserts there is no top-level `accountId` or `entitlement`, and that a repeat admission returns the same set in the same order. If admission returned the wrong business, the wrong grant, or kept the old single-account fields, the test would fail.
- **AC1754:** the test reads the chosen grant from the account's own entry in `businesses`. Both original checks are unchanged: the open-ended grant wins, and once it is removed the grant ending latest wins, not the one that has already lapsed.

**Upstream:** the AC-1748 and AC-1754 tickets already describe the multi-business behaviour, so neither the ACs nor the story needed changing.

I couldn't run a separate TypeScript check because the repo has no root `tsconfig.json`; vitest compiled and ran the file without errors.

```yaml
## Assessment
blocked_by: null
status: fixed
fixed:
  - test_UAT_AC1748_an_invited_person_binds_to_one_account_and_one_grant
  - test_UAT_AC1754_the_effective_grant_is_the_one_preserving_access_longest
files_changed:
  - tests/reconciliation-identity-invite-and-admission.workers.test.ts
upstream_changes: none (AC-1748 and AC-1754 already match the code)
```
